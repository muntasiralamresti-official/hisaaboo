import express from 'express';
import { z } from 'zod';
import { Party, Sale, Purchase, Payment, AuditLog } from '../models/index.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkSubscription } from '../middleware/subscriptionMiddleware.js';
import { tenantFilter, tenantQueries, getTenantId } from '../lib/tenant.js';

const router = express.Router();

router.use(authenticate);
router.use(checkSubscription);

// Validation schema for creating a party
const partySchema = z.object({
  name: z.string().min(2, 'পার্টির নাম আবশ্যক'),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  type: z.enum(['customer', 'supplier', 'both']).default('customer'),
  openingBalance: z.number().default(0), // Positive = party owes us, Negative = we owe party
  notes: z.string().optional().default(''),
});

/**
 * GET /api/parties
 * Get list of parties with current net balance calculation
 */
router.get('/', async (req, res) => {
  try {
    const { search, type } = req.query;
    const filter = {};

    if (type && ['customer', 'supplier', 'both'].includes(type)) {
      if (type === 'customer') {
        filter.type = { $in: ['customer', 'both'] };
      } else if (type === 'supplier') {
        filter.type = { $in: ['supplier', 'both'] };
      } else {
        filter.type = type;
      }
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { phone: regex }, { address: regex }];
    }

    const parties = await tenantQueries.find(Party, req, filter).sort({ name: 1 });

    // Calculate dynamic balances from transactions
    const businessId = getTenantId(req);

    // Sales by party (dueAmount)
    const salesDue = await Sale.aggregate([
      { $match: { businessId, isDeleted: false } },
      { $group: { _id: '$partyId', totalSaleDue: { $sum: '$dueAmount' } } },
    ]);
    const salesDueMap = {};
    salesDue.forEach((s) => {
      if (s._id) salesDueMap[s._id.toString()] = s.totalSaleDue;
    });

    // Purchases by party (dueAmount)
    const purchasesDue = await Purchase.aggregate([
      { $match: { businessId, isDeleted: false } },
      { $group: { _id: '$partyId', totalPurchaseDue: { $sum: '$dueAmount' } } },
    ]);
    const purchasesDueMap = {};
    purchasesDue.forEach((p) => {
      if (p._id) purchasesDueMap[p._id.toString()] = p.totalPurchaseDue;
    });

    // Payments by party (received vs paid)
    const paymentsAgg = await Payment.aggregate([
      { $match: { businessId, isDeleted: false, partyId: { $ne: null } } },
      {
        $group: {
          _id: { partyId: '$partyId', type: '$type' },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);
    const paymentsMap = {};
    paymentsAgg.forEach((p) => {
      const pId = p._id.partyId.toString();
      if (!paymentsMap[pId]) paymentsMap[pId] = { received: 0, paid: 0 };
      if (p._id.type === 'received') paymentsMap[pId].received += p.totalAmount;
      if (p._id.type === 'paid') paymentsMap[pId].paid += p.totalAmount;
    });

    // Calculate net balance for each party:
    // Positive balance = Receivable (তারা বাকি টাকা দেবে)
    // Negative balance = Payable (আমরা মহাজনকে টাকা দেব)
    let totalReceivable = 0;
    let totalPayable = 0;

    const enrichedParties = parties.map((party) => {
      const pid = party._id.toString();
      const openBal = Number(party.openingBalance) || 0;
      const sDue = Number(salesDueMap[pid]) || 0;
      const pDue = Number(purchasesDueMap[pid]) || 0;
      const pmts = paymentsMap[pid] || { received: 0, paid: 0 };

      // Net balance = opening + sales due - extra payments received - purchase due + payments paid
      // Or simply: openingBalance + (sales due - purchases due)
      const currentBalance = openBal + sDue - pDue;

      if (currentBalance > 0) {
        totalReceivable += currentBalance;
      } else if (currentBalance < 0) {
        totalPayable += Math.abs(currentBalance);
      }

      return {
        ...party.toObject(),
        currentBalance,
      };
    });

    return res.json({
      success: true,
      parties: enrichedParties,
      summary: {
        totalReceivable,
        totalPayable,
        count: parties.length,
      },
    });
  } catch (error) {
    console.error('Get parties error:', error);
    return res.status(500).json({ success: false, message: 'পার্টি তালিকা লোড করতে ব্যর্থ' });
  }
});

/**
 * GET /api/parties/:id
 * Retrieve party info and complete running ledger statement with date filters
 */
router.get('/:id', async (req, res) => {
  try {
    const party = await tenantQueries.findById(Party, req, req.params.id);
    if (!party) {
      return res.status(404).json({ success: false, message: 'পার্টি পাওয়া যায়নি' });
    }

    const { startDate, endDate } = req.query;
    const businessId = getTenantId(req);

    // Fetch all transactions for this party
    const dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      dateQuery.$lte = eDate;
    }

    const txFilter = { businessId, partyId: party._id, isDeleted: false };
    if (Object.keys(dateQuery).length > 0) {
      txFilter.date = dateQuery;
    }

    const [sales, purchases, payments] = await Promise.all([
      Sale.find(txFilter).sort({ date: 1 }),
      Purchase.find(txFilter).sort({ date: 1 }),
      Payment.find(txFilter).sort({ date: 1 }),
    ]);

    // Build unified ledger entries
    const ledger = [];

    // Opening balance entry
    ledger.push({
      date: party.createdAt,
      type: 'OPENING',
      reference: 'প্রারম্ভিক ব্যালেন্স (Opening Balance)',
      debit: party.openingBalance > 0 ? party.openingBalance : 0,
      credit: party.openingBalance < 0 ? Math.abs(party.openingBalance) : 0,
    });

    // Add Sales
    sales.forEach((s) => {
      ledger.push({
        id: s._id,
        date: s.date,
        type: 'SALE',
        reference: `চালান #${s.invoiceNo}`,
        debit: s.totalAmount, // Increases receivable
        credit: s.paidAmount, // Instant paid on sale reduces receivable
        paidAmount: s.paidAmount,
        dueAmount: s.dueAmount,
      });
    });

    // Add Purchases
    purchases.forEach((p) => {
      ledger.push({
        id: p._id,
        date: p.date,
        type: 'PURCHASE',
        reference: `ক্রয় বিল #${p.billNo}`,
        debit: p.paidAmount, // Instant paid reduces payable
        credit: p.totalAmount, // Increases payable
        paidAmount: p.paidAmount,
        dueAmount: p.dueAmount,
      });
    });

    // Add Separate Payments
    payments.forEach((pmt) => {
      if (pmt.type === 'received') {
        ledger.push({
          id: pmt._id,
          date: pmt.date,
          type: 'PAYMENT_RECEIVED',
          reference: `টাকা জমা (${pmt.method}) ${pmt.notes ? '• ' + pmt.notes : ''}`,
          debit: 0,
          credit: pmt.amount, // Customer paid money
        });
      } else {
        ledger.push({
          id: pmt._id,
          date: pmt.date,
          type: 'PAYMENT_PAID',
          reference: `মহাজনকে পরিশোধ (${pmt.method}) ${pmt.notes ? '• ' + pmt.notes : ''}`,
          debit: pmt.amount, // We paid supplier
          credit: 0,
        });
      }
    });

    // Sort all transactions chronologically
    ledger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runningBalance = 0;
    const computedLedger = ledger.map((entry) => {
      runningBalance += (entry.debit || 0) - (entry.credit || 0);
      return {
        ...entry,
        balance: runningBalance,
      };
    });

    return res.json({
      success: true,
      party: {
        ...party.toObject(),
        currentBalance: runningBalance,
      },
      ledger: computedLedger,
    });
  } catch (error) {
    console.error('Get party ledger error:', error);
    return res.status(500).json({ success: false, message: 'লেজার ডাটা লোড করতে ব্যর্থ' });
  }
});

/**
 * POST /api/parties
 * Create a new party (customer/supplier)
 */
router.post('/', async (req, res) => {
  try {
    const parsed = partySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.errors[0]?.message || 'ভুল ইনপুট দেওয়া হয়েছে',
      });
    }

    const data = parsed.data;
    const party = await tenantQueries.create(Party, req, data);

    // Audit Log
    await AuditLog.create({
      businessId: getTenantId(req),
      userId: req.user.id,
      userName: req.user.name,
      action: 'CREATE_PARTY',
      entity: 'Party',
      entityId: party._id.toString(),
      details: { name: party.name, type: party.type, phone: party.phone },
      ip: req.ip || '',
    }).catch((err) => console.error('Audit log failed:', err));

    return res.status(201).json({
      success: true,
      message: 'পার্টি সফলভাবে যোগ করা হয়েছে',
      party,
    });
  } catch (error) {
    console.error('Create party error:', error);
    return res.status(500).json({ success: false, message: 'পার্টি তৈরি করতে ব্যর্থ' });
  }
});

/**
 * PUT /api/parties/:id
 * Update party details
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, address, type, notes } = req.body;
    const update = {};
    if (name) update.name = name.trim();
    if (phone !== undefined) update.phone = phone.trim();
    if (address !== undefined) update.address = address.trim();
    if (type) update.type = type;
    if (notes !== undefined) update.notes = notes.trim();

    const party = await tenantQueries.updateOne(
      Party,
      req,
      { _id: req.params.id },
      { $set: update }
    );

    return res.json({
      success: true,
      message: 'পার্টির তথ্য আপডেট করা হয়েছে',
      party,
    });
  } catch (error) {
    console.error('Update party error:', error);
    return res.status(500).json({ success: false, message: 'পার্টি আপডেট করতে ব্যর্থ' });
  }
});

/**
 * DELETE /api/parties/:id
 * Soft delete party
 */
router.delete('/:id', async (req, res) => {
  try {
    await tenantQueries.softDelete(Party, req, req.params.id);

    // Audit Log
    await AuditLog.create({
      businessId: getTenantId(req),
      userId: req.user.id,
      userName: req.user.name,
      action: 'DELETE_PARTY',
      entity: 'Party',
      entityId: req.params.id,
      ip: req.ip || '',
    }).catch((err) => console.error('Audit log failed:', err));

    return res.json({
      success: true,
      message: 'পার্টি সফলভাবে সরানো হয়েছে',
    });
  } catch (error) {
    console.error('Delete party error:', error);
    return res.status(500).json({ success: false, message: 'পার্টি মুছে ফেলতে ব্যর্থ' });
  }
});

export default router;
