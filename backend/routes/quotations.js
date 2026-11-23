import express from 'express';
import { Quotation, Sale, Product, Party, AuditLog } from '../models/index.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkSubscription } from '../middleware/subscriptionMiddleware.js';
import { tenantFilter, tenantQueries, getTenantId } from '../lib/tenant.js';

const router = express.Router();

router.use(authenticate);
router.use(checkSubscription);

/**
 * GET /api/quotations
 */
router.get('/', async (req, res) => {
  try {
    const { partyId, status } = req.query;
    const filter = {};
    if (partyId) filter.partyId = partyId;
    if (status) filter.status = status;

    const quotations = await tenantQueries
      .find(Quotation, req, filter)
      .populate('partyId', 'name phone address')
      .sort({ date: -1, createdAt: -1 });

    return res.json({
      success: true,
      quotations,
    });
  } catch (error) {
    console.error('Get quotations error:', error);
    return res.status(500).json({ success: false, message: 'কোটেশন তালিকা লোড করতে ব্যর্থ' });
  }
});

/**
 * GET /api/quotations/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const quotation = await tenantQueries
      .findById(Quotation, req, req.params.id)
      .populate('partyId', 'name phone address');

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'কোটেশন পাওয়া যায়নি' });
    }

    return res.json({ success: true, quotation });
  } catch (error) {
    console.error('Get quotation error:', error);
    return res.status(500).json({ success: false, message: 'কোটেশন লোড ব্যর্থ' });
  }
});

/**
 * POST /api/quotations
 */
router.post('/', async (req, res) => {
  try {
    const { partyId, date, validUntil, items, discount = 0, notes } = req.body;

    if (!partyId || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'কাস্টমার ও আইটেমের তালিকা দিন' });
    }

    const businessId = getTenantId(req);
    const count = await Quotation.countDocuments({ businessId });
    const quotationNo = `QT-${String(count + 1).padStart(4, '0')}`;

    let subTotal = 0;
    const formattedItems = items.map((item) => {
      const q = Number(item.quantity) || 0;
      const r = Number(item.rate) || 0;
      const t = q * r;
      subTotal += t;
      return {
        productId: item.productId,
        productName: item.productName,
        unit: item.unit || 'bag',
        quantity: q,
        rate: r,
        total: t,
        customFields: item.customFields || {},
      };
    });

    const disc = Number(discount) || 0;
    const totalAmount = Math.max(0, subTotal - disc);

    const quotation = await tenantQueries.create(Quotation, req, {
      quotationNo,
      partyId,
      date: date ? new Date(date) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : null,
      items: formattedItems,
      subTotal,
      discount: disc,
      totalAmount,
      status: 'sent',
      notes: notes?.trim() || '',
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: 'কোটেশন সফলভাবে সংরক্ষিত হয়েছে',
      quotation,
    });
  } catch (error) {
    console.error('Create quotation error:', error);
    return res.status(500).json({ success: false, message: 'কোটেশন তৈরি করতে ব্যর্থ' });
  }
});

/**
 * POST /api/quotations/:id/convert
 * Convert accepted quotation into a real sale invoice
 */
router.post('/:id/convert', async (req, res) => {
  try {
    const quotation = await tenantQueries.findById(Quotation, req, req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'কোটেশন পাওয়া যায়নি' });
    }

    if (quotation.status === 'converted') {
      return res.status(400).json({ success: false, message: 'এই কোটেশন ইতিমধ্যে চালানে রূপান্তরিত হয়েছে' });
    }

    const businessId = getTenantId(req);
    const saleCount = await Sale.countDocuments({ businessId });
    const invoiceNo = `INV-${String(saleCount + 1).padStart(4, '0')}`;

    // Decrement stock for all items
    for (const item of quotation.items) {
      await Product.findOneAndUpdate(
        { _id: item.productId, businessId },
        { $inc: { stock: -item.quantity } }
      );
    }

    const sale = await tenantQueries.create(Sale, req, {
      invoiceNo,
      partyId: quotation.partyId,
      date: new Date(),
      items: quotation.items,
      subTotal: quotation.subTotal,
      discount: quotation.discount,
      totalAmount: quotation.totalAmount,
      paidAmount: 0,
      dueAmount: quotation.totalAmount,
      paymentMethod: 'none',
      notes: `কোটেশন ${quotation.quotationNo} হতে প্রস্তুতকৃত বিক্রয় চালান।`,
      createdBy: req.user.id,
    });

    quotation.status = 'converted';
    quotation.convertedSaleId = sale._id;
    await quotation.save();

    return res.json({
      success: true,
      message: 'কোটেশন সফলভাবে বিক্রয় চালানে রূপান্তরিত হয়েছে!',
      saleId: sale._id,
    });
  } catch (error) {
    console.error('Convert quotation error:', error);
    return res.status(500).json({ success: false, message: 'চালানে রূপান্তর করতে ব্যর্থ' });
  }
});

export default router;
