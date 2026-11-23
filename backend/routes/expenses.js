import express from 'express';
import { Expense, AuditLog } from '../models/index.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkSubscription } from '../middleware/subscriptionMiddleware.js';
import { tenantFilter, tenantQueries, getTenantId } from '../lib/tenant.js';

const router = express.Router();

router.use(authenticate);
router.use(checkSubscription);

/**
 * GET /api/expenses
 * List all expenses with category breakdown and date filters
 */
router.get('/', async (req, res) => {
  try {
    const { category, method, startDate, endDate } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (method) filter.paymentMethod = method;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        filter.date.$lte = eDate;
      }
    }

    const expenses = await tenantQueries.find(Expense, req, filter).sort({ date: -1, createdAt: -1 });

    let totalExpense = 0;
    const categoryBreakdown = {};

    expenses.forEach((e) => {
      totalExpense += e.amount;
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
    });

    return res.json({
      success: true,
      expenses,
      summary: {
        totalExpense,
        categoryBreakdown,
        count: expenses.length,
      },
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    return res.status(500).json({ success: false, message: 'খরচ তালিকা লোড করতে ব্যর্থ' });
  }
});

/**
 * POST /api/expenses
 * Record a new expense
 */
router.post('/', async (req, res) => {
  try {
    const { category, amount, paymentMethod = 'cash', date, note } = req.body;
    const numAmount = Number(amount);

    if (!category || !numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'সঠিক খরচের খাত ও টাকার পরিমাণ দিন' });
    }

    const businessId = getTenantId(req);

    const expense = await tenantQueries.create(Expense, req, {
      category: category.trim(),
      amount: numAmount,
      paymentMethod,
      date: date ? new Date(date) : new Date(),
      note: note?.trim() || '',
      createdBy: req.user.id,
    });

    // Audit Log
    await AuditLog.create({
      businessId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'CREATE_EXPENSE',
      entity: 'Expense',
      entityId: expense._id.toString(),
      details: { category, amount: numAmount, paymentMethod },
      ip: req.ip || '',
    }).catch((err) => console.error('Audit log failed:', err));

    return res.status(201).json({
      success: true,
      message: 'খরচ সফলভাবে এন্ট্রি হয়েছে',
      expense,
    });
  } catch (error) {
    console.error('Create expense error:', error);
    return res.status(500).json({ success: false, message: 'খরচ সংরক্ষণ ব্যর্থ' });
  }
});

/**
 * DELETE /api/expenses/:id
 * Soft delete expense
 */
router.delete('/:id', async (req, res) => {
  try {
    await tenantQueries.softDelete(Expense, req, req.params.id);

    return res.json({
      success: true,
      message: 'খরচ রেকর্ড মুছে ফেলা হয়েছে',
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    return res.status(500).json({ success: false, message: 'খরচ মুছতে ব্যর্থ' });
  }
});

export default router;
