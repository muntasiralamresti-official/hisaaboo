import express from 'express';
import { Employee, SalaryPayment, Expense, AuditLog } from '../models/index.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkSubscription } from '../middleware/subscriptionMiddleware.js';
import { tenantFilter, tenantQueries, getTenantId } from '../lib/tenant.js';

const router = express.Router();

router.use(authenticate);
router.use(checkSubscription);

/**
 * GET /api/payroll/employees
 */
router.get('/employees', async (req, res) => {
  try {
    const employees = await tenantQueries
      .find(Employee, req, { isActive: true })
      .sort({ createdAt: -1 });

    let totalPayrollMonthly = 0;
    employees.forEach((e) => {
      totalPayrollMonthly += e.monthlySalary || 0;
    });

    return res.json({
      success: true,
      employees,
      totalPayrollMonthly,
    });
  } catch (error) {
    console.error('Get employees error:', error);
    return res.status(500).json({ success: false, message: 'কর্মচারী তালিকা লোড করতে ব্যর্থ' });
  }
});

/**
 * POST /api/payroll/employees
 */
router.post('/employees', async (req, res) => {
  try {
    const { name, phone, designation = 'স্টাফ', monthlySalary, joiningDate } = req.body;
    const numSalary = Number(monthlySalary);

    if (!name || !phone || !numSalary || numSalary <= 0) {
      return res.status(400).json({ success: false, message: 'সঠিক নাম, ফোন নম্বর ও মাসিক বেতনের পরিমাণ দিন' });
    }

    const employee = await tenantQueries.create(Employee, req, {
      name: name.trim(),
      phone: phone.trim(),
      designation: designation.trim(),
      monthlySalary: numSalary,
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: 'কর্মচারী সফলভাবে যোগ করা হয়েছে',
      employee,
    });
  } catch (error) {
    console.error('Create employee error:', error);
    return res.status(500).json({ success: false, message: 'কর্মচারী সংরক্ষণ ব্যর্থ' });
  }
});

/**
 * GET /api/payroll/payments
 */
router.get('/payments', async (req, res) => {
  try {
    const { employeeId, month } = req.query;
    const filter = {};
    if (employeeId) filter.employeeId = employeeId;
    if (month) filter.month = month;

    const payments = await tenantQueries
      .find(SalaryPayment, req, filter)
      .populate('employeeId', 'name phone designation monthlySalary')
      .sort({ date: -1, createdAt: -1 });

    let totalPaid = 0;
    payments.forEach((p) => {
      totalPaid += p.amount || 0;
    });

    return res.json({
      success: true,
      payments,
      totalPaid,
    });
  } catch (error) {
    console.error('Get salary payments error:', error);
    return res.status(500).json({ success: false, message: 'বেতন পরিশোধ তালিকা লোড ব্যর্থ' });
  }
});

/**
 * POST /api/payroll/payments
 * Disburse salary or advance
 */
router.post('/payments', async (req, res) => {
  try {
    const { employeeId, month, type = 'salary', amount, paymentMethod = 'cash', date, note } = req.body;
    const numAmount = Number(amount);

    if (!employeeId || !month || !numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'সঠিক কর্মচারী, মাস ও টাকার পরিমাণ দিন' });
    }

    const employee = await tenantQueries.findById(Employee, req, employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'কর্মচারী পাওয়া যায়নি' });
    }

    const payment = await tenantQueries.create(SalaryPayment, req, {
      employeeId,
      month,
      type,
      amount: numAmount,
      paymentMethod,
      date: date ? new Date(date) : new Date(),
      note: note?.trim() || '',
      createdBy: req.user.id,
    });

    // Auto-record in Expense collection so it shows in Profit & Loss and Cash Book!
    await tenantQueries.create(Expense, req, {
      category: 'salary',
      amount: numAmount,
      paymentMethod,
      date: date ? new Date(date) : new Date(),
      note: `${employee.name} (${employee.designation}) - ${type === 'salary' ? 'মাসিক বেতন' : 'অগ্রিম/খোরকি'} [মাস: ${month}]`,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: type === 'salary' ? 'মাসিক বেতন পরিশোধ সম্পন্ন হয়েছে' : 'অগ্রিম/খোরকি প্রদান সম্পন্ন হয়েছে',
      payment,
    });
  } catch (error) {
    console.error('Disburse salary error:', error);
    return res.status(500).json({ success: false, message: 'বেতন এন্ট্রি ব্যর্থ' });
  }
});

export default router;
