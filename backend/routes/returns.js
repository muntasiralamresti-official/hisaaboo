import express from 'express';
import { Return, Product, Party, AuditLog } from '../models/index.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkSubscription } from '../middleware/subscriptionMiddleware.js';
import { tenantFilter, tenantQueries, getTenantId } from '../lib/tenant.js';

const router = express.Router();

router.use(authenticate);
router.use(checkSubscription);

/**
 * GET /api/returns
 * List all returns (sale & purchase returns)
 */
router.get('/', async (req, res) => {
  try {
    const { type, partyId } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (partyId) filter.partyId = partyId;

    const returns = await tenantQueries
      .find(Return, req, filter)
      .populate('partyId', 'name phone address')
      .sort({ date: -1, createdAt: -1 });

    let totalAmount = 0;
    returns.forEach((r) => {
      totalAmount += r.totalAmount || 0;
    });

    return res.json({
      success: true,
      returns,
      summary: {
        totalAmount,
        count: returns.length,
      },
    });
  } catch (error) {
    console.error('Get returns error:', error);
    return res.status(500).json({ success: false, message: 'ফেরত তালিকা লোড করতে ব্যর্থ' });
  }
});

/**
 * GET /api/returns/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const ret = await tenantQueries
      .findById(Return, req, req.params.id)
      .populate('partyId', 'name phone address');

    if (!ret) {
      return res.status(404).json({ success: false, message: 'ফেরত রেকর্ড পাওয়া যায়নি' });
    }

    return res.json({ success: true, returnRecord: ret });
  } catch (error) {
    console.error('Get return detail error:', error);
    return res.status(500).json({ success: false, message: 'ফেরত বিবরণ লোড করতে ব্যর্থ' });
  }
});

/**
 * POST /api/returns
 * Record a sale_return or purchase_return
 */
router.post('/', async (req, res) => {
  try {
    const { type, partyId, date, items, reason, notes } = req.body;

    if (!type || !['sale_return', 'purchase_return'].includes(type) || !partyId || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'সঠিক পার্টির নাম ও ফেরত পণ্যের তালিকা দিন' });
    }

    const businessId = getTenantId(req);

    // Generate Return number
    const count = await Return.countDocuments({ businessId });
    const returnNo = `RET-${String(count + 1).padStart(4, '0')}`;

    let totalAmount = 0;
    const formattedItems = [];

    for (const item of items) {
      const q = Number(item.quantity) || 0;
      const r = Number(item.rate) || 0;
      const t = q * r;
      totalAmount += t;

      formattedItems.push({
        productId: item.productId,
        productName: item.productName,
        unit: item.unit || 'bag',
        quantity: q,
        rate: r,
        total: t,
        customFields: item.customFields || {},
      });

      // Stock adjustment:
      // sale_return: customer returns goods to our godown -> stock INCREASES
      // purchase_return: we return goods back to mill -> stock DECREASES
      const stockChange = type === 'sale_return' ? q : -q;
      await Product.findOneAndUpdate(
        { _id: item.productId, businessId },
        { $inc: { stock: stockChange } }
      );
    }

    const returnRecord = await tenantQueries.create(Return, req, {
      returnNo,
      type,
      partyId,
      date: date ? new Date(date) : new Date(),
      items: formattedItems,
      totalAmount,
      reason: reason || 'damage',
      notes: notes?.trim() || '',
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: 'ফেরত সফলভাবে এন্ট্রি হয়েছে ও স্টক সমন্বয় করা হয়েছে',
      returnRecord,
    });
  } catch (error) {
    console.error('Create return error:', error);
    return res.status(500).json({ success: false, message: 'ফেরত সংরক্ষণ ব্যর্থ' });
  }
});

export default router;
