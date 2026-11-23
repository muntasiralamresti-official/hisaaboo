import express from 'express';
import { BankAccount, BankTransaction, AuditLog } from '../models/index.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkSubscription } from '../middleware/subscriptionMiddleware.js';
import { tenantFilter, tenantQueries, getTenantId } from '../lib/tenant.js';

const router = express.Router();

router.use(authenticate);
router.use(checkSubscription);

/**
 * GET /api/banking/accounts
 */
router.get('/accounts', async (req, res) => {
  try {
    const accounts = await tenantQueries
      .find(BankAccount, req)
      .sort({ createdAt: -1 });

    let totalBankBalance = 0;
    accounts.forEach((a) => {
      totalBankBalance += a.currentBalance || 0;
    });

    return res.json({
      success: true,
      accounts,
      totalBankBalance,
    });
  } catch (error) {
    console.error('Get bank accounts error:', error);
    return res.status(500).json({ success: false, message: 'ব্যাংক হিসাব লোড করতে ব্যর্থ' });
  }
});

/**
 * POST /api/banking/accounts
 */
router.post('/accounts', async (req, res) => {
  try {
    const { accountName, accountNumber, bankName, branchName, openingBalance = 0 } = req.body;

    if (!accountName || !accountNumber || !bankName) {
      return res.status(400).json({ success: false, message: 'হিসাবের নাম, অ্যাকাউন্ট নম্বর ও ব্যাংকের নাম দিন' });
    }

    const numOpening = Number(openingBalance) || 0;

    const account = await tenantQueries.create(BankAccount, req, {
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
      bankName: bankName.trim(),
      branchName: branchName?.trim() || '',
      openingBalance: numOpening,
      currentBalance: numOpening,
    });

    return res.status(201).json({
      success: true,
      message: 'ব্যাংক অ্যাকাউন্ট সফলভাবে যুক্ত হয়েছে',
      account,
    });
  } catch (error) {
    console.error('Create bank account error:', error);
    return res.status(500).json({ success: false, message: 'ব্যাংক অ্যাকাউন্ট সংরক্ষণ ব্যর্থ' });
  }
});

/**
 * GET /api/banking/transactions
 */
router.get('/transactions', async (req, res) => {
  try {
    const { bankAccountId } = req.query;
    const filter = {};
    if (bankAccountId) filter.bankAccountId = bankAccountId;

    const transactions = await tenantQueries
      .find(BankTransaction, req, filter)
      .populate('bankAccountId', 'accountName accountNumber bankName')
      .sort({ date: -1, createdAt: -1 });

    return res.json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error('Get bank transactions error:', error);
    return res.status(500).json({ success: false, message: 'লেনদেন লোড ব্যর্থ' });
  }
});

/**
 * POST /api/banking/transactions
 * Deposit (cash to bank) or Withdraw (bank to cash)
 */
router.post('/transactions', async (req, res) => {
  try {
    const { bankAccountId, type, amount, chequeNo, reference, note, date } = req.body;
    const numAmount = Number(amount);

    if (!bankAccountId || !['deposit', 'withdraw'].includes(type) || !numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'সঠিক ব্যাংক অ্যাকাউন্ট, লেনদেনের ধরন ও টাকার পরিমাণ দিন' });
    }

    const account = await tenantQueries.findById(BankAccount, req, bankAccountId);
    if (!account) {
      return res.status(404).json({ success: false, message: 'ব্যাংক অ্যাকাউন্ট পাওয়া যায়নি' });
    }

    if (type === 'withdraw' && account.currentBalance < numAmount) {
      return res.status(400).json({ success: false, message: 'ব্যাংক অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই' });
    }

    // Update bank balance
    const balanceChange = type === 'deposit' ? numAmount : -numAmount;
    account.currentBalance = (account.currentBalance || 0) + balanceChange;
    await account.save();

    const tx = await tenantQueries.create(BankTransaction, req, {
      bankAccountId,
      type,
      amount: numAmount,
      date: date ? new Date(date) : new Date(),
      chequeNo: chequeNo?.trim() || '',
      reference: reference?.trim() || '',
      note: note?.trim() || '',
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: type === 'deposit' ? 'ব্যাংকে টাকা সফলভাবে জমা হয়েছে' : 'ব্যাংক থেকে টাকা সফলভাবে উত্তোলন হয়েছে',
      transaction: tx,
      currentBalance: account.currentBalance,
    });
  } catch (error) {
    console.error('Create bank transaction error:', error);
    return res.status(500).json({ success: false, message: 'ব্যাংক লেনদেন সংরক্ষণ ব্যর্থ' });
  }
});

export default router;
