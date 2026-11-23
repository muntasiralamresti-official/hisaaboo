import express from 'express';
import mongoose from 'mongoose';
import { Sale, Purchase, Payment, Expense, Product, Party } from '../models/index.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkSubscription } from '../middleware/subscriptionMiddleware.js';
import { getTenantId } from '../lib/tenant.js';

const router = express.Router();

router.use(authenticate);
router.use(checkSubscription);

/**
 * GET /api/reports/dashboard
 * Live aggregated numbers for the dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    const rawBusinessId = getTenantId(req);
    const businessId = new mongoose.Types.ObjectId(rawBusinessId);

    // Today's boundaries
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Today's Sales
    const todaySalesAgg = await Sale.aggregate([
      { $match: { businessId, isDeleted: false, date: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const todaySales = todaySalesAgg[0]?.total || 0;

    // 2. Today's Collections (Payments received today)
    const todayCollectionAgg = await Payment.aggregate([
      { $match: { businessId, isDeleted: false, type: 'received', date: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const todayCollection = todayCollectionAgg[0]?.total || 0;

    // 3. Today's Expenses
    const todayExpenseAgg = await Expense.aggregate([
      { $match: { businessId, isDeleted: false, date: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const todayExpense = todayExpenseAgg[0]?.total || 0;

    // 4. Total Receivable & Payable (from party opening + sales due - purchase due)
    const parties = await Party.find({ businessId, isDeleted: false });
    const salesDue = await Sale.aggregate([
      { $match: { businessId, isDeleted: false } },
      { $group: { _id: '$partyId', totalDue: { $sum: '$dueAmount' } } },
    ]);
    const sMap = {};
    salesDue.forEach((s) => {
      if (s._id) sMap[s._id.toString()] = s.totalDue;
    });

    const purchasesDue = await Purchase.aggregate([
      { $match: { businessId, isDeleted: false } },
      { $group: { _id: '$partyId', totalDue: { $sum: '$dueAmount' } } },
    ]);
    const pMap = {};
    purchasesDue.forEach((p) => {
      if (p._id) pMap[p._id.toString()] = p.totalDue;
    });

    let totalReceivable = 0;
    let totalPayable = 0;
    const debtorsList = [];

    parties.forEach((party) => {
      const pid = party._id.toString();
      const open = Number(party.openingBalance) || 0;
      const sDue = Number(sMap[pid]) || 0;
      const pDue = Number(pMap[pid]) || 0;
      const net = open + sDue - pDue;

      if (net > 0) {
        totalReceivable += net;
        debtorsList.push({
          id: party._id,
          name: party.name,
          phone: party.phone,
          due: net,
        });
      } else if (net < 0) {
        totalPayable += Math.abs(net);
      }
    });

    // Sort debtors descending and pick top 5
    debtorsList.sort((a, b) => b.due - a.due);
    const topDebtors = debtorsList.slice(0, 5);

    // 5. Total Stock Value
    const products = await Product.find({ businessId, isDeleted: false });
    let stockValue = 0;
    products.forEach((p) => {
      stockValue += (Number(p.stock) || 0) * (Number(p.purchasePrice) || 0);
    });

    // 6. Account Balances (Cash, bKash/Nagad, Bank)
    const [allPayments, allExpenses] = await Promise.all([
      Payment.aggregate([
        { $match: { businessId, isDeleted: false } },
        {
          $group: {
            _id: { method: '$method', type: '$type' },
            total: { $sum: '$amount' },
          },
        },
      ]),
      Expense.aggregate([
        { $match: { businessId, isDeleted: false } },
        {
          $group: {
            _id: '$paymentMethod',
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const balances = { cash: 0, bKash: 0, bank: 0 };
    allPayments.forEach((p) => {
      const m = p._id.method;
      const amt = p._id.type === 'received' ? p.total : -p.total;
      if (m === 'cash') balances.cash += amt;
      else if (m === 'bKash' || m === 'Nagad') balances.bKash += amt;
      else if (m === 'bank') balances.bank += amt;
    });

    allExpenses.forEach((e) => {
      const m = e._id;
      if (m === 'cash') balances.cash -= e.total;
      else if (m === 'bKash' || m === 'Nagad') balances.bKash -= e.total;
      else if (m === 'bank') balances.bank -= e.total;
    });

    // 7. This Month's Sales & Purchases
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const [monthSalesAgg, monthPurchasesAgg] = await Promise.all([
      Sale.aggregate([
        { $match: { businessId, isDeleted: false, date: { $gte: currentMonthStart } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Purchase.aggregate([
        { $match: { businessId, isDeleted: false, date: { $gte: currentMonthStart } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const monthSales = monthSalesAgg[0]?.total || 0;
    const monthPurchases = monthPurchasesAgg[0]?.total || 0;

    // 8. 6-Month Comparison (Sales vs Purchases)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [monthlySalesAgg, monthlyPurchasesAgg] = await Promise.all([
      Sale.aggregate([
        { $match: { businessId, isDeleted: false, date: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
            total: { $sum: '$totalAmount' },
          },
        },
      ]),
      Purchase.aggregate([
        { $match: { businessId, isDeleted: false, date: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
            total: { $sum: '$totalAmount' },
          },
        },
      ]),
    ]);

    const salesMonthMap = {};
    monthlySalesAgg.forEach((m) => {
      salesMonthMap[m._id] = m.total;
    });

    const purchasesMonthMap = {};
    monthlyPurchasesAgg.forEach((m) => {
      purchasesMonthMap[m._id] = m.total;
    });

    const sixMonthTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      sixMonthTrend.push({
        key,
        month: label,
        Sales: salesMonthMap[key] || 0,
        Purchase: purchasesMonthMap[key] || 0,
      });
    }

    // 9. Top Selling Products
    const topProductsAgg = await Sale.aggregate([
      { $match: { businessId, isDeleted: false } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productName',
          totalAmount: { $sum: '$items.total' },
          totalQuantity: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 5 },
    ]);

    const topSellingProducts = topProductsAgg.map((p) => ({
      name: p._id,
      value: p.totalAmount,
      quantity: p.totalQuantity,
    }));

    // 10. Low-Stock Reorder Alert Products
    const lowStockProducts = products
      .filter((p) => (Number(p.stock) || 0) <= (Number(p.lowStockLevel) || 5))
      .map((p) => ({
        id: p._id,
        name: p.name,
        unit: p.unit,
        stock: p.stock,
        lowStockLevel: p.lowStockLevel,
        purchasePrice: p.purchasePrice,
        customFields: p.customFields || {},
      }))
      .slice(0, 5);

    return res.json({
      success: true,
      stats: {
        todaySales,
        todayCollection,
        todayExpense,
        monthSales,
        monthPurchases,
        totalReceivable,
        totalPayable,
        stockValue,
        balances,
        topDebtors,
        sixMonthTrend,
        topSellingProducts,
        lowStockProducts,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ success: false, message: 'ড্যাশবোর্ড তথ্য লোড ব্যর্থ' });
  }
});

/**
 * GET /api/reports/profit-loss
 * Profit & Loss Calculation
 */
router.get('/profit-loss', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const businessId = getTenantId(req);
    const dateFilter = {};

    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        dateFilter.date.$lte = eDate;
      }
    }

    const [sales, expenses] = await Promise.all([
      Sale.find({ businessId, isDeleted: false, ...dateFilter }),
      Expense.find({ businessId, isDeleted: false, ...dateFilter }),
    ]);

    let totalRevenue = 0;
    let totalDiscount = 0;
    let estimatedCOGS = 0; // Cost of goods sold based on purchase rate

    // Fetch product purchase price mapping
    const products = await Product.find({ businessId });
    const productPriceMap = {};
    products.forEach((p) => {
      productPriceMap[p._id.toString()] = p.purchasePrice || 0;
    });

    sales.forEach((s) => {
      totalRevenue += s.totalAmount;
      totalDiscount += s.discount || 0;

      s.items.forEach((item) => {
        const costPrice = productPriceMap[item.productId?.toString()] || item.rate * 0.85; // Fallback
        estimatedCOGS += costPrice * item.quantity;
      });
    });

    let totalExpenses = 0;
    const expenseCategoryMap = {};
    expenses.forEach((e) => {
      totalExpenses += e.amount;
      expenseCategoryMap[e.category] = (expenseCategoryMap[e.category] || 0) + e.amount;
    });

    const grossProfit = totalRevenue - estimatedCOGS;
    const netProfit = grossProfit - totalExpenses;

    return res.json({
      success: true,
      summary: {
        totalRevenue,
        totalDiscount,
        estimatedCOGS,
        grossProfit,
        totalExpenses,
        netProfit,
        expenseCategoryMap,
      },
    });
  } catch (error) {
    console.error('Profit loss report error:', error);
    return res.status(500).json({ success: false, message: 'লাভ-ক্ষতি রিপোর্ট লোড করতে ব্যর্থ' });
  }
});

/**
 * GET /api/reports/due-aging
 * Categorizes all party receivables into 0-30, 31-60, 61-90, and 90+ day aging buckets
 */
router.get('/due-aging', async (req, res) => {
  try {
    const rawBusinessId = getTenantId(req);
    const businessId = new mongoose.Types.ObjectId(rawBusinessId);

    const now = new Date();
    const day30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const day60Ago = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const day90Ago = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [parties, salesDue, purchasesDue] = await Promise.all([
      Party.find({ businessId, isDeleted: false }),
      Sale.find({ businessId, isDeleted: false, dueAmount: { $gt: 0 } }).sort({ date: -1 }),
      Purchase.aggregate([
        { $match: { businessId, isDeleted: false } },
        { $group: { _id: '$partyId', totalDue: { $sum: '$dueAmount' } } },
      ]),
    ]);

    const pDueMap = {};
    purchasesDue.forEach((p) => {
      if (p._id) pDueMap[p._id.toString()] = p.totalDue;
    });

    // Group sales by partyId
    const partySalesMap = {};
    salesDue.forEach((s) => {
      const pid = s.partyId?.toString();
      if (!pid) return;
      if (!partySalesMap[pid]) partySalesMap[pid] = [];
      partySalesMap[pid].push(s);
    });

    let totalDue = 0;
    const bucketTotals = {
      current: 0, // 0-30 days
      month1: 0,  // 31-60 days
      month2: 0,  // 61-90 days
      older: 0,   // 90+ days
    };

    const agingParties = [];

    parties.forEach((party) => {
      const pid = party._id.toString();
      const open = Number(party.openingBalance) || 0;
      const invoices = partySalesMap[pid] || [];
      const sDue = invoices.reduce((acc, inv) => acc + (inv.dueAmount || 0), 0);
      const pDue = Number(pDueMap[pid]) || 0;
      const netDue = open + sDue - pDue;

      if (netDue <= 0) return; // No receivables from this party

      totalDue += netDue;

      // Classify this party's due into buckets
      let bCurrent = 0;
      let bMonth1 = 0;
      let bMonth2 = 0;
      let bOlder = 0;

      // If they have explicit unpaid sales invoices:
      let invoiceDueTracked = 0;
      invoices.forEach((inv) => {
        const iDate = new Date(inv.date);
        const amt = inv.dueAmount || 0;
        invoiceDueTracked += amt;

        if (iDate >= day30Ago) {
          bCurrent += amt;
        } else if (iDate >= day60Ago) {
          bMonth1 += amt;
        } else if (iDate >= day90Ago) {
          bMonth2 += amt;
        } else {
          bOlder += amt;
        }
      });

      // Any remaining due (like opening balance or difference) goes to older or current
      const remainder = netDue - invoiceDueTracked;
      if (remainder > 0) {
        bOlder += remainder;
      }

      bucketTotals.current += bCurrent;
      bucketTotals.month1 += bMonth1;
      bucketTotals.month2 += bMonth2;
      bucketTotals.older += bOlder;

      // Determine highest alert bucket
      let riskLevel = 'normal'; // normal, follow-up, warning, critical
      if (bOlder > 0) riskLevel = 'critical';
      else if (bMonth2 > 0) riskLevel = 'warning';
      else if (bMonth1 > 0) riskLevel = 'follow-up';

      agingParties.push({
        id: party._id,
        name: party.name,
        phone: party.phone,
        address: party.address,
        totalDue: netDue,
        current: bCurrent,
        month1: bMonth1,
        month2: bMonth2,
        older: bOlder,
        riskLevel,
        lastDate: invoices[0]?.date || party.createdAt,
      });
    });

    agingParties.sort((a, b) => b.totalDue - a.totalDue);

    return res.json({
      success: true,
      totalDue,
      bucketTotals,
      parties: agingParties,
    });
  } catch (error) {
    console.error('Due aging report error:', error);
    return res.status(500).json({ success: false, message: 'বকেয়া বয়স বিশ্লেষণ লোড করতে ব্যর্থ' });
  }
});

export default router;
