import Business from '../models/Business.js';

/**
 * Middleware ensuring tenant business has an active subscription
 */
export async function checkSubscription(req, res, next) {
  try {
    // Superadmin bypasses subscription checks
    if (req.user?.role === 'superadmin') {
      return next();
    }

    const business = req.user?.business;

    if (!business) {
      return res.status(403).json({
        success: false,
        message: 'No associated business found.',
      });
    }

    // 1. Check if suspended
    if (business.isSuspended) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: 'Your business account is suspended. Please contact Hisaaboo support.',
      });
    }

    // 2. Check paid-until expiration date
    const now = new Date();
    const paidUntil = new Date(business.paidUntil);

    if (paidUntil.getTime() < now.getTime()) {
      // Allow read-only GET requests with a warning header, but block all mutations
      if (req.method !== 'GET') {
        return res.status(403).json({
          success: false,
          code: 'SUBSCRIPTION_EXPIRED',
          message: 'Subscription expired, please contact support to renew your service.',
          paidUntil: business.paidUntil,
        });
      }

      // Mark request context so client knows subscription is expired
      req.isSubscriptionExpired = true;
    }

    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    next(error);
  }
}

export default checkSubscription;
