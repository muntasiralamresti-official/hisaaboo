/**
 * Multi-Tenant Isolation Engine for Hisaaboo
 *
 * CRITICAL SECURITY GUARANTEE:
 * - businessId is ALWAYS read strictly from the authenticated user's JWT token (req.user.businessId).
 * - NEVER read from req.body, req.query, or req.params.
 * - Every tenant-scoped query automatically attaches businessId so no query can leak cross-tenant data.
 */

/**
 * Extract verified businessId from authenticated user session
 * Throws error if user is unauthenticated or has no business assigned
 */
export function getTenantId(req) {
  if (!req.user) {
    const error = new Error('Unauthorized: User not authenticated');
    error.status = 401;
    throw error;
  }

  // Superadmin might impersonate or query directly, but for tenant requests:
  const businessId = req.user.businessId;

  if (!businessId && req.user.role !== 'superadmin') {
    const error = new Error('Forbidden: User is not linked to any business tenant');
    error.status = 403;
    throw error;
  }

  return businessId;
}

/**
 * Returns a filter object guaranteed to include the tenant's businessId.
 * Automatically adds isDeleted: false if the model supports soft-delete.
 */
export function tenantFilter(req, baseFilter = {}, includeDeleted = false) {
  const businessId = getTenantId(req);

  const filter = {
    ...baseFilter,
    businessId,
  };

  if (!includeDeleted && baseFilter.isDeleted === undefined) {
    filter.isDeleted = false;
  }

  return filter;
}

/**
 * Attaches the authenticated tenant's businessId to data before saving.
 * Strips any user-provided businessId to prevent privilege escalation or data spoofing.
 */
export function withTenantData(req, data = {}) {
  const businessId = getTenantId(req);

  // Clean payload and force authenticated businessId
  const sanitized = { ...data };
  delete sanitized.businessId; // Remove any injected businessId from user input

  return {
    ...sanitized,
    businessId,
  };
}

/**
 * Reusable tenant query wrappers
 */
export const tenantQueries = {
  find(model, req, filter = {}, projection = null, options = {}) {
    return model.find(tenantFilter(req, filter), projection, options);
  },

  findOne(model, req, filter = {}, projection = null, options = {}) {
    return model.findOne(tenantFilter(req, filter), projection, options);
  },

  findById(model, req, id, projection = null, options = {}) {
    return model.findOne(tenantFilter(req, { _id: id }), projection, options);
  },

  create(model, req, data) {
    const tenantPayload = withTenantData(req, data);
    return model.create(tenantPayload);
  },

  updateOne(model, req, filter, update, options = {}) {
    return model.updateOne(tenantFilter(req, filter), update, options);
  },

  softDelete(model, req, id) {
    return model.findOneAndUpdate(
      tenantFilter(req, { _id: id }),
      { $set: { isDeleted: true } },
      { new: true }
    );
  },

  countDocuments(model, req, filter = {}) {
    return model.countDocuments(tenantFilter(req, filter));
  },
};

export default {
  getTenantId,
  tenantFilter,
  withTenantData,
  tenantQueries,
};
