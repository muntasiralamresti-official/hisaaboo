import express from 'express';
import { Business, User, AuditLog, Party, Product, Sale, Purchase, Payment, Expense } from '../models/index.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkSubscription } from '../middleware/subscriptionMiddleware.js';
import { getTenantId } from '../lib/tenant.js';
import { hashPassword } from '../lib/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(checkSubscription);

/**
 * GET /api/settings
 * Get current business settings
 */
router.get('/', async (req, res) => {
  try {
    const businessId = getTenantId(req);
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'ব্যবসা পাওয়া যায়নি' });
    }

    const staffUsers = await User.find({ businessId, role: 'staff', isActive: true }).select('-password');

    return res.json({
      success: true,
      business,
      staffUsers,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({ success: false, message: 'সেটিংস লোড করতে ব্যর্থ' });
  }
});

/**
 * PUT /api/settings
 * Update business settings (White-label branding, invoice footer, address, language)
 */
router.put('/', async (req, res) => {
  try {
    const businessId = getTenantId(req);
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'ব্যবসা পাওয়া যায়নি' });
    }

    const { name, address, phone, logo, invoiceFooterNote, language } = req.body;

    if (name) business.name = name.trim();
    if (address !== undefined) business.address = address.trim();
    if (phone) business.phone = phone.trim();
    if (logo !== undefined) business.logo = logo;
    if (invoiceFooterNote !== undefined) business.invoiceFooterNote = invoiceFooterNote.trim();
    if (language && ['bn', 'en'].includes(language)) business.language = language;

    await business.save();

    return res.json({
      success: true,
      message: 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে',
      business,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ success: false, message: 'সেটিংস আপডেট ব্যর্থ' });
  }
});

/**
 * POST /api/settings/users
 * Add staff user to business
 */
router.post('/users', async (req, res) => {
  try {
    const businessId = getTenantId(req);
    const { name, phone, password } = req.body;

    if (!name || !phone || !password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'সঠিক নাম, ফোন ও ৬ অক্ষরের পাসওয়ার্ড দিন' });
    }

    const cleanPhone = phone.trim();
    const existing = await User.findOne({ phone: cleanPhone });
    if (existing) {
      return res.status(400).json({ success: false, message: 'এই ফোন নম্বরে ইতিমধ্যে অ্যাকাউন্ট রয়েছে' });
    }

    const hashedPassword = await hashPassword(password);
    const staff = await User.create({
      name: name.trim(),
      phone: cleanPhone,
      password: hashedPassword,
      role: 'staff',
      businessId,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: 'স্টাফ অ্যাকাউন্ট তৈরি করা হয়েছে',
      staff: {
        id: staff._id,
        name: staff.name,
        phone: staff.phone,
        role: staff.role,
      },
    });
  } catch (error) {
    console.error('Create staff error:', error);
    return res.status(500).json({ success: false, message: 'স্টাফ তৈরি করতে ব্যর্থ' });
  }
});

/**
 * GET /api/settings/backup
 * Full 1-Click Business Data Backup
 */
router.get('/backup', async (req, res) => {
  try {
    const businessId = getTenantId(req);
    const [business, parties, products, sales, purchases, payments, expenses] = await Promise.all([
      Business.findById(businessId),
      Party.find({ businessId, isDeleted: false }),
      Product.find({ businessId, isDeleted: false }),
      Sale.find({ businessId, isDeleted: false }),
      Purchase.find({ businessId, isDeleted: false }),
      Payment.find({ businessId, isDeleted: false }),
      Expense.find({ businessId, isDeleted: false }),
    ]);

    return res.json({
      success: true,
      backupTimestamp: new Date().toISOString(),
      platform: 'Hisaaboo Business ERP',
      data: {
        business,
        parties,
        products,
        sales,
        purchases,
        payments,
        expenses,
      },
    });
  } catch (error) {
    console.error('Backup generation error:', error);
    return res.status(500).json({ success: false, message: 'ব্যাকআপ জেনারেট করতে সমস্যা হয়েছে' });
  }
});

export default router;
