import express from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import Business from '../models/Business.js';
import AuditLog from '../models/AuditLog.js';
import { signToken, comparePassword, COOKIE_OPTIONS } from '../lib/auth.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { getTemplate } from '../lib/templates.js';

const router = express.Router();

// Input validation schema for login
const loginSchema = z.object({
  phone: z.string().min(10, 'Valid phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * POST /api/auth/login
 * Authenticates user, signs JWT, sets httpOnly cookie
 */
router.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.errors[0]?.message || 'Invalid input data',
      });
    }

    const { phone, password } = parsed.data;
    const cleanPhone = phone.trim();

    // 1. Find user by phone
    const user = await User.findOne({ phone: cleanPhone }).populate('businessId');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password',
      });
    }

    // 2. Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact support.',
      });
    }

    // 3. Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password',
      });
    }

    // 4. Verify business status for non-superadmins
    let business = null;
    let template = null;
    let subscriptionStatus = 'active';

    if (user.role !== 'superadmin') {
      business = user.businessId;
      if (!business) {
        return res.status(403).json({
          success: false,
          message: 'No business assigned to this account',
        });
      }

      if (business.isSuspended) {
        return res.status(403).json({
          success: false,
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your business account is suspended. Please contact Hisaaboo support.',
        });
      }

      // Check subscription date
      const now = new Date();
      const paidUntil = new Date(business.paidUntil);
      if (paidUntil.getTime() < now.getTime()) {
        subscriptionStatus = 'expired';
      }

      template = getTemplate(business.businessType);
    }

    // 5. Generate JWT token
    const tokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      businessId: business ? business._id.toString() : null,
    };

    const token = signToken(tokenPayload);

    // 6. Set httpOnly cookie
    res.cookie('hisaaboo_token', token, COOKIE_OPTIONS);

    // 7. Audit Log
    await AuditLog.create({
      businessId: business?._id || null,
      userId: user._id,
      userName: user.name,
      action: 'LOGIN',
      entity: 'User',
      entityId: user._id.toString(),
      details: { role: user.role, ip: req.ip },
      ip: req.ip || '',
    }).catch((err) => console.error('Audit log failed:', err));

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
      business: business
        ? {
            id: business._id.toString(),
            name: business.name,
            ownerName: business.ownerName,
            phone: business.phone,
            address: business.address,
            logo: business.logo,
            businessType: business.businessType,
            enabledModules: business.enabledModules,
            paidUntil: business.paidUntil,
            subscriptionStatus,
            language: business.language,
          }
        : null,
      template,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login',
    });
  }
});

/**
 * POST /api/auth/logout
 * Clears JWT cookie
 */
router.post('/logout', (req, res) => {
  res.clearCookie('hisaaboo_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });

  return res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * GET /api/auth/me
 * Retrieves current authenticated user and session metadata
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('businessId');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let business = null;
    let template = null;
    let subscriptionStatus = 'active';

    if (user.role !== 'superadmin' && user.businessId) {
      business = user.businessId;
      const now = new Date();
      const paidUntil = new Date(business.paidUntil);
      if (paidUntil.getTime() < now.getTime()) {
        subscriptionStatus = 'expired';
      }
      template = getTemplate(business.businessType);
    }

    return res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
      business: business
        ? {
            id: business._id.toString(),
            name: business.name,
            ownerName: business.ownerName,
            phone: business.phone,
            address: business.address,
            logo: business.logo,
            businessType: business.businessType,
            enabledModules: business.enabledModules,
            paidUntil: business.paidUntil,
            subscriptionStatus,
            language: business.language,
          }
        : null,
      template,
    });
  } catch (error) {
    console.error('Auth /me error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user session' });
  }
});

export default router;
