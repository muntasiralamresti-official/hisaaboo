import express from 'express';
import { z } from 'zod';
import { Business, User, AuditLog } from '../models/index.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { hashPassword } from '../lib/auth.js';
import { getTemplate } from '../lib/templates.js';

const router = express.Router();

// Enforce authentication and superadmin role for ALL routes in this file
router.use(authenticate);
router.use(requireRole('superadmin'));

/**
 * GET /api/admin/stats
 * Overview numbers for the superadmin dashboard
 */
router.get('/stats', async (req, res) => {
  try {
    const totalBusinesses = await Business.countDocuments();
    const activeBusinesses = await Business.countDocuments({ isSuspended: false });
    const suspendedBusinesses = await Business.countDocuments({ isSuspended: true });

    const now = new Date();
    const expiredSubscriptions = await Business.countDocuments({
      isSuspended: false,
      paidUntil: { $lt: now },
    });

    // Sum of all payment history records
    const paymentAgg = await Business.aggregate([
      { $unwind: '$paymentHistory' },
      { $group: { _id: null, totalRevenue: { $sum: '$paymentHistory.amount' } } },
    ]);
    const totalRevenue = paymentAgg[0]?.totalRevenue || 0;

    // Type distribution
    const yarnCount = await Business.countDocuments({ businessType: 'yarn' });
    const generalCount = await Business.countDocuments({ businessType: 'general' });

    return res.json({
      success: true,
      stats: {
        totalBusinesses,
        activeBusinesses,
        suspendedBusinesses,
        expiredSubscriptions,
        totalRevenue,
        yarnCount,
        generalCount,
      },
    });
  } catch (error) {
    console.error('Superadmin stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin stats' });
  }
});

/**
 * GET /api/admin/businesses
 * List all businesses with search, filtering and pagination
 */
router.get('/businesses', async (req, res) => {
  try {
    const { search, type, status } = req.query;
    const filter = {};

    if (type && ['yarn', 'general'].includes(type)) {
      filter.businessType = type;
    }

    const now = new Date();
    if (status === 'suspended') {
      filter.isSuspended = true;
    } else if (status === 'expired') {
      filter.isSuspended = false;
      filter.paidUntil = { $lt: now };
    } else if (status === 'active') {
      filter.isSuspended = false;
      filter.paidUntil = { $gte: now };
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { ownerName: searchRegex },
        { phone: searchRegex },
        { address: searchRegex },
      ];
    }

    const businesses = await Business.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      businesses,
    });
  } catch (error) {
    console.error('Superadmin get businesses error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch businesses' });
  }
});

/**
 * GET /api/admin/businesses/:id
 * Retrieve full details of a specific business, owner user, and payments
 */
router.get('/businesses/:id', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const owner = await User.findOne({ businessId: business._id, role: 'owner' }).select('-password');
    const template = getTemplate(business.businessType);

    return res.json({
      success: true,
      business,
      owner,
      template,
    });
  } catch (error) {
    console.error('Superadmin get business by id error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch business details' });
  }
});

// Validation schema for creating a new business
const createBusinessSchema = z.object({
  name: z.string().min(2, 'Business name is required'),
  ownerName: z.string().min(2, 'Owner name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  address: z.string().optional().default(''),
  businessType: z.enum(['yarn', 'general']).default('general'),
  yearlyFee: z.number().min(0, 'Yearly fee must be 0 or positive').default(0),
  paidUntil: z.string().optional(),
  enabledModules: z.array(z.string()).optional(),
  ownerPassword: z.string().min(6, 'Password must be at least 6 characters').default('123456'),
  initialPaymentAmount: z.number().min(0).optional().default(0),
  initialPaymentMethod: z.enum(['cash', 'bKash', 'Nagad', 'bank']).optional().default('cash'),
});

/**
 * POST /api/admin/businesses
 * Create new business and its owner account
 */
router.post('/businesses', async (req, res) => {
  try {
    const parsed = createBusinessSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.errors[0]?.message || 'Invalid input data',
      });
    }

    const data = parsed.data;
    const cleanPhone = data.phone.trim();

    // 1. Check if phone is already registered as a User
    const existingUser = await User.findOne({ phone: cleanPhone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this phone number already exists.',
      });
    }

    // 2. Determine paidUntil date (default 1 year from now if not given)
    let paidUntilDate = data.paidUntil ? new Date(data.paidUntil) : new Date();
    if (!data.paidUntil) {
      paidUntilDate.setDate(paidUntilDate.getDate() + 365);
    }

    // 3. Determine enabled modules from template if not provided
    const template = getTemplate(data.businessType);
    const enabledModules = data.enabledModules && data.enabledModules.length > 0
      ? data.enabledModules
      : template.enabledModules;

    // 4. Initial payment history
    const paymentHistory = [];
    if (data.initialPaymentAmount > 0) {
      paymentHistory.push({
        amount: data.initialPaymentAmount,
        date: new Date(),
        method: data.initialPaymentMethod,
        notes: 'Initial subscription fee upon creation',
        recordedBy: req.user.id,
      });
    }

    // 5. Create Business
    const business = await Business.create({
      name: data.name.trim(),
      ownerName: data.ownerName.trim(),
      phone: cleanPhone,
      address: data.address.trim(),
      businessType: data.businessType,
      enabledModules,
      yearlyFee: data.yearlyFee,
      paidUntil: paidUntilDate,
      paymentStatus: 'active',
      isSuspended: false,
      paymentHistory,
    });

    // 6. Create Owner User
    const hashedPassword = await hashPassword(data.ownerPassword);
    const owner = await User.create({
      name: data.ownerName.trim(),
      phone: cleanPhone,
      password: hashedPassword,
      role: 'owner',
      businessId: business._id,
      isActive: true,
    });

    // 7. Audit Log
    await AuditLog.create({
      businessId: business._id,
      userId: req.user.id,
      userName: req.user.name,
      action: 'CREATE_BUSINESS',
      entity: 'Business',
      entityId: business._id.toString(),
      details: { businessName: business.name, type: business.businessType, phone: cleanPhone },
      ip: req.ip || '',
    }).catch((err) => console.error('Audit log failed:', err));

    return res.status(201).json({
      success: true,
      message: 'Business and owner account created successfully',
      business,
      owner: {
        id: owner._id,
        name: owner.name,
        phone: owner.phone,
        role: owner.role,
      },
    });
  } catch (error) {
    console.error('Superadmin create business error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create business' });
  }
});

/**
 * PUT /api/admin/businesses/:id
 * Update business details, template, modules, and yearly fee
 */
router.put('/businesses/:id', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const { name, ownerName, phone, address, businessType, yearlyFee, enabledModules, invoiceFooterNote } = req.body;

    if (name) business.name = name.trim();
    if (ownerName) business.ownerName = ownerName.trim();
    if (phone) business.phone = phone.trim();
    if (address !== undefined) business.address = address.trim();
    if (businessType && ['yarn', 'general'].includes(businessType)) business.businessType = businessType;
    if (yearlyFee !== undefined) business.yearlyFee = Number(yearlyFee);
    if (enabledModules && Array.isArray(enabledModules)) business.enabledModules = enabledModules;
    if (invoiceFooterNote !== undefined) business.invoiceFooterNote = invoiceFooterNote.trim();

    await business.save();

    // Update owner user name if changed
    if (ownerName) {
      await User.updateOne({ businessId: business._id, role: 'owner' }, { $set: { name: ownerName.trim() } });
    }

    // Audit Log
    await AuditLog.create({
      businessId: business._id,
      userId: req.user.id,
      userName: req.user.name,
      action: 'UPDATE_BUSINESS',
      entity: 'Business',
      entityId: business._id.toString(),
      details: { updatedFields: req.body },
      ip: req.ip || '',
    }).catch((err) => console.error('Audit log failed:', err));

    return res.json({
      success: true,
      message: 'Business details updated successfully',
      business,
    });
  } catch (error) {
    console.error('Superadmin update business error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update business' });
  }
});

/**
 * PATCH /api/admin/businesses/:id/status
 * Suspend or activate a business
 */
router.patch('/businesses/:id/status', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const { isSuspended } = req.body;
    business.isSuspended = Boolean(isSuspended);
    business.paymentStatus = business.isSuspended ? 'suspended' : 'active';
    await business.save();

    // Audit Log
    await AuditLog.create({
      businessId: business._id,
      userId: req.user.id,
      userName: req.user.name,
      action: business.isSuspended ? 'SUSPEND_BUSINESS' : 'ACTIVATE_BUSINESS',
      entity: 'Business',
      entityId: business._id.toString(),
      details: { isSuspended: business.isSuspended },
      ip: req.ip || '',
    }).catch((err) => console.error('Audit log failed:', err));

    return res.json({
      success: true,
      message: business.isSuspended ? 'Business has been suspended' : 'Business has been activated',
      business,
    });
  } catch (error) {
    console.error('Superadmin toggle status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update business status' });
  }
});

/**
 * POST /api/admin/businesses/:id/payments
 * Record a subscription payment and extend paidUntil date
 */
router.post('/businesses/:id/payments', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const { amount, method = 'cash', notes = '', extendMonths = 12 } = req.body;
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
    }

    // 1. Calculate new paidUntil date
    const currentPaidUntil = new Date(business.paidUntil);
    const now = new Date();
    // If already expired, start from today; otherwise extend from existing paidUntil
    const baseDate = currentPaidUntil > now ? currentPaidUntil : now;
    const newPaidUntil = new Date(baseDate);
    newPaidUntil.setMonth(newPaidUntil.getMonth() + Number(extendMonths));

    business.paidUntil = newPaidUntil;
    business.paymentStatus = 'active';

    // 2. Append to payment history
    business.paymentHistory.push({
      amount: numAmount,
      date: new Date(),
      method,
      notes: notes.trim() || `Extended subscription by ${extendMonths} months`,
      recordedBy: req.user.id,
    });

    await business.save();

    // 3. Audit Log
    await AuditLog.create({
      businessId: business._id,
      userId: req.user.id,
      userName: req.user.name,
      action: 'RECORD_SUBSCRIPTION_PAYMENT',
      entity: 'Business',
      entityId: business._id.toString(),
      details: { amount: numAmount, method, newPaidUntil, extendMonths },
      ip: req.ip || '',
    }).catch((err) => console.error('Audit log failed:', err));

    return res.json({
      success: true,
      message: 'Payment recorded and subscription extended successfully',
      business,
      newPaidUntil,
    });
  } catch (error) {
    console.error('Superadmin record payment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to record payment' });
  }
});

/**
 * POST /api/admin/businesses/:id/reset-password
 * Reset the owner password for a business
 */
router.post('/businesses/:id/reset-password', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const owner = await User.findOne({ businessId: business._id, role: 'owner' });
    if (!owner) {
      return res.status(404).json({ success: false, message: 'Owner account not found for this business' });
    }

    const hashedPassword = await hashPassword(newPassword);
    owner.password = hashedPassword;
    await owner.save();

    // Audit Log
    await AuditLog.create({
      businessId: business._id,
      userId: req.user.id,
      userName: req.user.name,
      action: 'RESET_OWNER_PASSWORD',
      entity: 'User',
      entityId: owner._id.toString(),
      details: { ownerPhone: owner.phone },
      ip: req.ip || '',
    }).catch((err) => console.error('Audit log failed:', err));

    return res.json({
      success: true,
      message: `Password reset successfully for ${owner.name} (${owner.phone})`,
    });
  } catch (error) {
    console.error('Superadmin reset password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

export default router;
