import express from 'express';
import { z } from 'zod';
import { Sale, Product, Party, Payment, AuditLog } from '../models/index.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkSubscription } from '../middleware/subscriptionMiddleware.js';
import { tenantFilter, tenantQueries, getTenantId } from '../lib/tenant.js';

const router = express.Router();

router.use(authenticate);
router.use(checkSubscription);

/**
 * GET /api/sales
 * List sales with party populate, search, and date filters
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
      filter.invoiceNo = regex;
    }

    const sales = await tenantQueries
      .find(Sale, req, filter)
      .populate('partyId', 'name phone address')
      .sort({ date: -1, createdAt: -1 });

    // Summary calculations
    let totalSalesAmount = 0;
    let totalPaid = 0;
    let totalDue = 0;

    sales.forEach((s) => {
      totalSalesAmount += s.totalAmount || 0;
      totalPaid += s.paidAmount || 0;
      totalDue += s.dueAmount || 0;
    });

    return res.json({
      success: true,
      sales,
      summary: {
        totalSalesAmount,
        totalPaid,
        totalDue,
        count: sales.length,
      },
    });
  } catch (error) {
    console.error('Get sales error:', error);
    return res.status(500).json({ success: false, message: 'বিক্রয় তালিকা লোড করতে ব্যর্থ' });
  }
});

/**
 * GET /api/sales/:id
 * Retrieve single sale invoice details
 */
router.get('/:id', async (req, res) => {
  try {
    const sale = await tenantQueries
      .findById(Sale, req, req.params.id)
      .populate('partyId', 'name phone address');

    if (!sale) {
      return res.status(404).json({ success: false, message: 'চালান পাওয়া যায়নি' });
    }

    return res.json({
      success: true,
      sale,
    });
  } catch (error) {
    console.error('Get sale by id error:', error);
    return res.status(500).json({ success: false, message: 'চালান লোড করতে ব্যর্থ' });
  }
});

/**
 * POST /api/sales
 * Create a new sale invoice:
 * - Auto-generates unique invoice number per business
 * - Decrements stock for each item
 * - Auto-records payment if paidAmount > 0
 */
router.post('/', async (req, res) => {
  try {
    const { partyId, items, discount = 0, paidAmount = 0, paymentMethod = 'cash', notes = '', date } = req.body;

    if (!partyId) {
      return res.status(400).json({ success: false, message: 'পার্টি নির্বাচন করুন' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'কমপক্ষে একটি আইটেম যুক্ত করুন' });
    }

    const businessId = getTenantId(req);

    // 1. Verify party
    const party = await tenantQueries.findById(Party, req, partyId);
    if (!party) {
      return res.status(404).json({ success: false, message: 'পার্টি পাওয়া যায়নি' });
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

    // 3. Auto-generate sequential invoice number per business
    const salesCount = await Sale.countDocuments({ businessId });
    const invoiceNo = `INV-${String(salesCount + 1001).padStart(4, '0')}`;

    // 4. Create Sale
    const sale = await tenantQueries.create(Sale, req, {
      invoiceNo,
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

    // 5. Decrement Stock for each product
    for (const item of sanitizedItems) {
      await Product.updateOne(
        { _id: item.productId, businessId },
        { $inc: { stock: -item.quantity } }
      );
    }

    // 6. If paidAmount > 0, create automatic Payment record
    if (numPaid > 0) {
      await tenantQueries.create(Payment, req, {
        partyId: party._id,
        type: 'received',
        amount: numPaid,
        method: paymentMethod,
        date: sale.date,
        saleId: sale._id,
        receiptNo: invoiceNo,
        notes: `মেমো #${invoiceNo} বিক্রয় বাবদ নগদ আদায়`,
        createdBy: req.user.id,
      });
    }

    // 7. Audit Log
    await AuditLog.create({
      businessId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'CREATE_SALE',
      entity: 'Sale',
      entityId: sale._id.toString(),
      details: { invoiceNo, partyName: party.name, totalAmount, paidAmount: numPaid, dueAmount },
      ip: req.ip || '',
    }).catch((err) => console.error('Audit log failed:', err));

    return res.status(201).json({
      success: true,
      message: 'চালান সফলভাবে সংরক্ষিত হয়েছে',
      sale,
    });
  } catch (error) {
    console.error('Create sale error:', error);
    return res.status(500).json({ success: false, message: error.message || 'চালান তৈরি করতে ব্যর্থ' });
  }
});

/**
 * DELETE /api/sales/:id
 * Soft delete sale and restore product stock
 */
router.delete('/:id', async (req, res) => {
  try {
    const sale = await tenantQueries.findById(Sale, req, req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'চালান পাওয়া যায়নি' });
    }

    const businessId = getTenantId(req);

    // 1. Soft delete sale
    sale.isDeleted = true;
    await sale.save();

    // 2. Restore stock for each item
    for (const item of sale.items) {
      await Product.updateOne(
        { _id: item.productId, businessId },
        { $inc: { stock: item.quantity } }
      );
    }

    // 3. Soft delete linked payment
    await Payment.updateMany(
      { businessId, saleId: sale._id },
      { $set: { isDeleted: true } }
    );

    // 4. Audit Log
    await AuditLog.create({
      businessId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'DELETE_SALE',
      entity: 'Sale',
      entityId: sale._id.toString(),
      details: { invoiceNo: sale.invoiceNo, totalAmount: sale.totalAmount },
      ip: req.ip || '',
    }).catch((err) => console.error('Audit log failed:', err));

    return res.json({
      success: true,
      message: 'চালান বাতিল করা হয়েছে এবং স্টক পুনরুদ্ধার করা হয়েছে',
    });
  } catch (error) {
    console.error('Delete sale error:', error);
    return res.status(500).json({ success: false, message: 'চালান মুছতে ব্যর্থ' });
  }
});

export default router;
