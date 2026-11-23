import express from 'express';
import { z } from 'zod';
import { Purchase, Product, Party, Payment, AuditLog } from '../models/index.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkSubscription } from '../middleware/subscriptionMiddleware.js';
import { tenantFilter, tenantQueries, getTenantId } from '../lib/tenant.js';

const router = express.Router();

router.use(authenticate);
router.use(checkSubscription);

/**
 * GET /api/purchases
 * List purchases
 */
router.get('/', async (req, res) => {
  try {
    const { search, partyId, startDate, endDate } = req.query;
    const filter = {};

    if (partyId) filter.partyId = partyId;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        filter.date.$lte = eDate;
      }
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.billNo = regex;
    }

    const purchases = await tenantQueries
      .find(Purchase, req, filter)
      .populate('partyId', 'name phone address')
      .sort({ date: -1, createdAt: -1 });

    let totalPurchaseAmount = 0;
    let totalPaid = 0;
    let totalDue = 0;

    purchases.forEach((p) => {
      totalPurchaseAmount += p.totalAmount || 0;
      totalPaid += p.paidAmount || 0;
      totalDue += p.dueAmount || 0;
    });

    return res.json({
      success: true,
      purchases,
      summary: {
        totalPurchaseAmount,
        totalPaid,
        totalDue,
        count: purchases.length,
      },
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    return res.status(500).json({ success: false, message: 'ক্রয় তালিকা লোড করতে ব্যর্থ' });
  }
});

/**
 * GET /api/purchases/:id
 * Retrieve single purchase bill details
 */
router.get('/:id', async (req, res) => {
  try {
    const purchase = await tenantQueries
      .findById(Purchase, req, req.params.id)
      .populate('partyId', 'name phone address');

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'ক্রয় রশিদ পাওয়া যায়নি' });
    }

    return res.json({
      success: true,
      purchase,
    });
  } catch (error) {
    console.error('Get purchase by id error:', error);
    return res.status(500).json({ success: false, message: 'ক্রয় রশিদ লোড করতে ব্যর্থ' });
  }
});

/**
 * POST /api/purchases
 * Create a new purchase bill:
 * - Increments product stock
 * - Auto-records payment if paidAmount > 0
 */
router.post('/', async (req, res) => {
  try {
    const { partyId, items, billNo, discount = 0, paidAmount = 0, paymentMethod = 'cash', notes = '', date } = req.body;

    if (!partyId) {
      return res.status(400).json({ success: false, message: 'মহাজন / মিল নির্বাচন করুন' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'কমপক্ষে একটি আইটেম যুক্ত করুন' });
    }

    const businessId = getTenantId(req);

    // 1. Verify party
    const party = await tenantQueries.findById(Party, req, partyId);
    if (!party) {
      return res.status(404).json({ success: false, message: 'মহাজন / সরবরাহকারী পাওয়া যায়নি' });
    }

    // 2. Validate items and calculate subTotal
    let subTotal = 0;
    const sanitizedItems = [];

    for (const item of items) {
      const product = await tenantQueries.findById(Product, req, item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `পণ্য পাওয়া যায়নি: ${item.productName || ''}` });
      }

      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      if (qty <= 0 || rate < 0) {
        return res.status(400).json({ success: false, message: 'সঠিক পরিমাণ ও দর প্রদান করুন' });
      }

      const total = qty * rate;
      subTotal += total;

      sanitizedItems.push({
        productId: product._id,
        productName: product.name,
        unit: product.unit,
        customFields: item.customFields || (product.customFields ? Object.fromEntries(product.customFields) : {}),
        quantity: qty,
        rate,
        total,
      });
    }

    const numDiscount = Number(discount) || 0;
    const totalAmount = Math.max(0, subTotal - numDiscount);
    const numPaid = Math.min(totalAmount, Math.max(0, Number(paidAmount) || 0));
    const dueAmount = Math.max(0, totalAmount - numPaid);

    // 3. Bill number
    let finalBillNo = billNo ? String(billNo).trim() : '';
    if (!finalBillNo) {
      const purchaseCount = await Purchase.countDocuments({ businessId });
      finalBillNo = `PUR-${String(purchaseCount + 1001).padStart(4, '0')}`;
    }

    // 4. Create Purchase
    const purchase = await tenantQueries.create(Purchase, req, {
      billNo: finalBillNo,
      partyId: party._id,
      date: date ? new Date(date) : new Date(),
      items: sanitizedItems,
      subTotal,
      discount: numDiscount,
      totalAmount,
      paidAmount: numPaid,
      dueAmount,
      paymentMethod: numPaid > 0 ? paymentMethod : 'none',
      notes: notes?.trim() || '',
      createdBy: req.user.id,
    });

    // 5. Increment Stock for each product
    for (const item of sanitizedItems) {
      await Product.updateOne(
        { _id: item.productId, businessId },
        { $inc: { stock: item.quantity } }
      );
    }

    // 6. If paidAmount > 0, create automatic Payment record (paid to supplier)
    if (numPaid > 0) {
      await tenantQueries.create(Payment, req, {
        partyId: party._id,
        type: 'paid',
        amount: numPaid,
        method: paymentMethod,
        date: purchase.date,
        purchaseId: purchase._id,
        receiptNo: finalBillNo,
        notes: `ক্রয় চালান #${finalBillNo} বাবদ পরিশোধ`,
        createdBy: req.user.id,
      });
    }

    // 7. Audit Log
    await AuditLog.create({
      businessId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'CREATE_PURCHASE',
      entity: 'Purchase',
      entityId: purchase._id.toString(),
      details: { billNo: finalBillNo, supplierName: party.name, totalAmount, paidAmount: numPaid, dueAmount },
      ip: req.ip || '',
    }).catch((err) => console.error('Audit log failed:', err));

    return res.status(201).json({
      success: true,
      message: 'ক্রয় চালান সফলভাবে সংরক্ষিত হয়েছে এবং স্টক বৃদ্ধি করা হয়েছে',
      purchase,
    });
  } catch (error) {
    console.error('Create purchase error:', error);
    return res.status(500).json({ success: false, message: error.message || 'ক্রয় রশিদ তৈরি করতে ব্যর্থ' });
  }
});

/**
 * DELETE /api/purchases/:id
 * Soft delete purchase and decrease product stock back
 */
router.delete('/:id', async (req, res) => {
  try {
    const purchase = await tenantQueries.findById(Purchase, req, req.params.id);
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'ক্রয় চালান পাওয়া যায়নি' });
    }

    const businessId = getTenantId(req);

    // 1. Soft delete purchase
    purchase.isDeleted = true;
    await purchase.save();

    // 2. Decrease stock back
    for (const item of purchase.items) {
      await Product.updateOne(
        { _id: item.productId, businessId },
        { $inc: { stock: -item.quantity } }
      );
    }

    // 3. Soft delete linked payment
    await Payment.updateMany(
      { businessId, purchaseId: purchase._id },
      { $set: { isDeleted: true } }
    );

    // 4. Audit Log
    await AuditLog.create({
      businessId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'DELETE_PURCHASE',
      entity: 'Purchase',
      entityId: purchase._id.toString(),
      details: { billNo: purchase.billNo, totalAmount: purchase.totalAmount },
      ip: req.ip || '',
    }).catch((err) => console.error('Audit log failed:', err));

    return res.json({
      success: true,
      message: 'ক্রয় চালান বাতিল করা হয়েছে এবং স্টক সমন্বয় করা হয়েছে',
    });
  } catch (error) {
    console.error('Delete purchase error:', error);
    return res.status(500).json({ success: false, message: 'ক্রয় চালান মুছতে ব্যর্থ' });
  }
});

export default router;
