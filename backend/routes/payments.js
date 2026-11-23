import express from 'express';
import { z } from 'zod';
import { Payment, Party, Expense, AuditLog } from '../models/index.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkSubscription } from '../middleware/subscriptionMiddleware.js';
import { tenantFilter, tenantQueries, getTenantId } from '../lib/tenant.js';

const router = express.Router();

router.use(authenticate);
router.use(checkSubscription);

/**
 * GET /api/payments
 * List all payments with filtering
 */
router.get('/', async (req, res) => {
  try {
    const { partyId, type, method, startDate, endDate } = req.query;
    const filter = {};

    if (partyId) filter.partyId = partyId;
    if (type && ['received', 'paid'].includes(type)) filter.type = type;
    if (method) filter.method = method;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        filter.date.$lte = eDate;
      }
    }

    const payments = await tenantQueries
      .find(Payment, req, filter)
      .populate('partyId', 'name phone')
      .sort({ date: -1, createdAt: -1 });

    let totalReceived = 0;
    let totalPaid = 0;

    payments.forEach((p) => {
      if (p.type === 'received') totalReceived += p.amount;
      if (p.type === 'paid') totalPaid += p.amount;
    });

    return res.json({
      success: true,
      payments,
      summary: {
        totalReceived,
        totalPaid,
        count: payments.length,
      },
    });
  } catch (error) {
    console.error('Get payments error:', error);
    return res.status(500).json({ success: false, message: 'পেমেন্ট তালিকা লোড করতে ব্যর্থ' });
  }
});

/**
 * GET /api/payments/cashbook
 * Calculate Daily Cash Book / Daybook
 */
router.get('/cashbook', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const businessId = getTenantId(req);

    // 1. Calculate Opening Balance (all transactions before startOfDay)
    const [priorPayments, priorExpenses] = await Promise.all([
      Payment.aggregate([
        { $match: { businessId, isDeleted: false, date: { $lt: startOfDay } } },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]),
      Expense.aggregate([
        { $match: { businessId, isDeleted: false, date: { $lt: startOfDay } } },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    let priorReceived = 0;
    let priorPaid = 0;
    priorPayments.forEach((p) => {
      if (p._id === 'received') priorReceived = p.total;
      if (p._id === 'paid') priorPaid = p.total;
    });
    const priorExpenseTotal = priorExpenses[0]?.total || 0;
    const openingBalance = priorReceived - priorPaid - priorExpenseTotal;

    // 2. Transactions during target date
    const [dayPayments, dayExpenses] = await Promise.all([
      Payment.find({
        businessId,
        isDeleted: false,
        date: { $gte: startOfDay, $lte: endOfDay },
      })
        .populate('partyId', 'name')
        .sort({ date: 1 }),
      Expense.find({
        businessId,
        isDeleted: false,
        date: { $gte: startOfDay, $lte: endOfDay },
      }).sort({ date: 1 }),
    ]);

    let todayIn = 0;
    let todayOut = 0;

    const methodBreakdown = {
      cash: { in: 0, out: 0 },
      bKash: { in: 0, out: 0 },
      Nagad: { in: 0, out: 0 },
      bank: { in: 0, out: 0 },
    };

    dayPayments.forEach((p) => {
      if (p.type === 'received') {
        todayIn += p.amount;
        if (methodBreakdown[p.method]) methodBreakdown[p.method].in += p.amount;
      } else {
        todayOut += p.amount;
        if (methodBreakdown[p.method]) methodBreakdown[p.method].out += p.amount;
      }
    });

    dayExpenses.forEach((e) => {
      todayOut += e.amount;
      const m = e.paymentMethod || 'cash';
      if (methodBreakdown[m]) methodBreakdown[m].out += e.amount;
    });

    const closingBalance = openingBalance + todayIn - todayOut;

    return res.json({
      success: true,
      date: startOfDay.toISOString().split('T')[0],
      openingBalance,
      todayIn,
      todayOut,
      closingBalance,
      methodBreakdown,
      transactions: {
        payments: dayPayments,
        expenses: dayExpenses,
      },
    });
  } catch (error) {
    console.error('Cashbook error:', error);
    return res.status(500).json({ success: false, message: 'ক্যাশ বুক হিসাব করতে ব্যর্থ' });
  }
});

/**
 * POST /api/payments
 * Record a payment (receive from customer or pay to supplier)
 */
router.post('/', async (req, res) => {
  try {
    const { partyId, type, amount, method = 'cash', date, notes } = req.body;
    const numAmount = Number(amount);

    if (!type || !['received', 'paid'].includes(type) || !numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'সঠিক পেমেন্ট ধরন ও পরিমাণ দিন' });
    }

    let party = null;
    if (partyId) {
      party = await tenantQueries.findById(Party, req, partyId);
    }

    const businessId = getTenantId(req);

    const payment = await tenantQueries.create(Payment, req, {
      partyId: party?._id || null,
      type,
      amount: numAmount,
      method,
      date: date ? new Date(date) : new Date(),
      notes: notes?.trim() || '',
      createdBy: req.user.id,
    });

    // Audit Log
    await AuditLog.create({
      businessId,
      userId: req.user.id,
      userName: req.user.name,
      action: type === 'received' ? 'RECEIVE_PAYMENT' : 'MAKE_PAYMENT',
      entity: 'Payment',
      entityId: payment._id.toString(),
      details: { amount: numAmount, method, partyName: party?.name || 'Direct' },
      ip: req.ip || '',
    }).catch((err) => console.error('Audit log failed:', err));

    return res.status(201).json({
      success: true,
      message: type === 'received' ? 'টাকা সফলভাবে জমা হয়েছে' : 'টাকা সফলভাবে পরিশোধ হয়েছে',
      payment,
    });
  } catch (error) {
    console.error('Create payment error:', error);
    return res.status(500).json({ success: false, message: 'পেমেন্ট সংরক্ষণ ব্যর্থ' });
  }
});

/**
 * DELETE /api/payments/:id
 * Soft delete payment
 */
router.delete('/:id', async (req, res) => {
  try {
    await tenantQueries.softDelete(Payment, req, req.params.id);

    return res.json({
      success: true,
      message: 'পেমেন্ট রেকর্ড মুছে ফেলা হয়েছে',
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    return res.status(500).json({ success: false, message: 'পেমেন্ট মুছতে ব্যর্থ' });
  }
});

export default router;
