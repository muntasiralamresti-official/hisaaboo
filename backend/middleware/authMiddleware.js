import { verifyToken } from '../lib/auth.js';
import User from '../models/User.js';
import Business from '../models/Business.js';

export async function authenticate(req, res, next) {
  try {
    // 1. Check token in httpOnly cookie or Authorization Bearer header
    let token = req.cookies?.hisaaboo_token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.',
      });
    }

    // 2. Verify token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid. Please login again.',
      });
    }

    // 3. Find user in database
    const user = await User.findById(decoded.userId).populate('businessId');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated or no longer exists.',
      });
    }

    // 4. Attach user context to request
    req.user = {
      _id: user._id,
      id: user._id.toString(),
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      businessId: user.businessId ? user.businessId._id.toString() : null,
      business: user.businessId || null,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error occurred.',
    });
  }
}

export default authenticate;
