import express from 'express';
import { z } from 'zod';
import { Product, StockAdjustment, AuditLog } from '../models/index.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkSubscription } from '../middleware/subscriptionMiddleware.js';
import { tenantFilter, tenantQueries, getTenantId } from '../lib/tenant.js';
import { getTemplate } from '../lib/templates.js';

const router = express.Router();

router.use(authenticate);
router.use(checkSubscription);

/**
 * GET /api/products
 * List products with search, low-stock filter, and total stock valuation
 */
router.get('/', async (req, res) => {
  try {
    const { search, lowStock } = req.query;
    const filter = {};

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { unit: regex },
        { 'customFields.count': regex },
        { 'customFields.lot': regex },
        { 'customFields.color': regex },
      ];
    }

    let products = await tenantQueries.find(Product, req, filter).sort({ name: 1 });

    if (lowStock === 'true') {
      products = products.filter((p) => p.stock <= p.lowStockLevel);
    }

    // Calculate total stock valuation and total items
    let totalStockValue = 0;
    let lowStockCount = 0;

    const enriched = products.map((p) => {
      const value = (Number(p.stock) || 0) * (Number(p.purchasePrice) || 0);
      totalStockValue += value;
      if (p.stock <= p.lowStockLevel) lowStockCount++;

      return {
        ...p.toObject(),
        stockValue: value,
        customFields: p.customFields ? Object.fromEntries(p.customFields) : {},
      };
    });

    return res.json({
      success: true,
      products: enriched,
      summary: {
        totalItems: products.length,
        totalStockValue,
        lowStockCount,
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ success: false, message: 'প্রোডাক্ট তালিকা লোড করতে ব্যর্থ' });
  }
});

/**
 * GET /api/products/:id
 * Retrieve single product details and adjustment history
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await tenantQueries.findById(Product, req, req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'পণ্যটি পাওয়া যায়নি' });
    }

    const businessId = getTenantId(req);
    const adjustments = await StockAdjustment.find({
      businessId,
      productId: product._id,
    }).sort({ date: -1 });

    return res.json({
      success: true,
      product: {
        ...product.toObject(),
        customFields: product.customFields ? Object.fromEntries(product.customFields) : {},
      },
      adjustments,
    });
  } catch (error) {
    console.error('Get product by id error:', error);
    return res.status(500).json({ success: false, message: 'পণ্যের তথ্য লোড করতে ব্যর্থ' });
  }
});

/**
 * POST /api/products
 * Create a new product with template-driven custom fields
 */
router.post('/', async (req, res) => {
  try {
    const { name, unit, purchasePrice, salePrice, stock, lowStockLevel, customFields } = req.body;

    if (!name || !unit) {
      return res.status(400).json({ success: false, message: 'পণ্যের নাম এবং ইউনিট আবশ্যক' });
    }

    // Clean customFields map
    const sanitizedCustomFields = {};
    if (customFields && typeof customFields === 'object') {
      for (const [k, v] of Object.entries(customFields)) {
        if (v !== undefined && v !== null && String(v).trim()) {
          sanitizedCustomFields[k] = String(v).trim();
        }
      }
    }

    const product = await tenantQueries.create(Product, req, {
      name: name.trim(),
      unit: unit.trim(),
      purchasePrice: Number(purchasePrice) || 0,
      salePrice: Number(salePrice) || 0,
      stock: Number(stock) || 0,
      lowStockLevel: Number(lowStockLevel) || 5,
      customFields: sanitizedCustomFields,
    });

    // Audit Log
    await AuditLog.create({
      businessId: getTenantId(req),
      userId: req.user.id,
      userName: req.user.name,
      action: 'CREATE_PRODUCT',
      entity: 'Product',
      entityId: product._id.toString(),
      details: { name: product.name, unit: product.unit, stock: product.stock },
      ip: req.ip || '',
    }).catch((err) => console.error('Audit log failed:', err));

    return res.status(201).json({
      success: true,
      message: 'পণ্য সফলভাবে যুক্ত হয়েছে',
      product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ success: false, message: error.message || 'পণ্য তৈরি করতে ব্যর্থ' });
  }
});

/**
 * PUT /api/products/:id
 * Update product info
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, unit, purchasePrice, salePrice, lowStockLevel, customFields } = req.body;
    const update = {};

    if (name) update.name = name.trim();
    if (unit) update.unit = unit.trim();
    if (purchasePrice !== undefined) update.purchasePrice = Number(purchasePrice);
    if (salePrice !== undefined) update.salePrice = Number(salePrice);
    if (lowStockLevel !== undefined) update.lowStockLevel = Number(lowStockLevel);

    if (customFields && typeof customFields === 'object') {
      const sanitized = {};
      for (const [k, v] of Object.entries(customFields)) {
        if (v !== undefined && v !== null) sanitized[k] = String(v).trim();
      }
      update.customFields = sanitized;
    }

    const product = await tenantQueries.updateOne(
      Product,
      req,
      { _id: req.params.id },
      { $set: update }
    );

    return res.json({
      success: true,
      message: 'পণ্যের তথ্য আপডেট করা হয়েছে',
      product,
    });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ success: false, message: 'পণ্য আপডেট করতে ব্যর্থ' });
  }
});

/**
 * POST /api/products/:id/adjust
 * Manual stock adjustment (increase or decrease) with reason
 */
router.post('/:id/adjust', async (req, res) => {
  try {
    const { type, quantity, reason, notes } = req.body;
    const numQty = Number(quantity);

    if (!['increase', 'decrease'].includes(type) || !numQty || numQty <= 0) {
      return res.status(400).json({ success: false, message: 'সঠিক ধরন ও পরিমাণ দিন' });
    }
    if (!reason) {
      return res.status(400).json({ success: false, message: 'স্টক পরিবর্তনের কারণ আবশ্যক' });
    }

    const product = await tenantQueries.findById(Product, req, req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'পণ্যটি পাওয়া যায়নি' });
    }

    // Update product stock
    const stockChange = type === 'increase' ? numQty : -numQty;
    product.stock = (product.stock || 0) + stockChange;
    await product.save();

    // Create StockAdjustment record
    const adjustment = await tenantQueries.create(StockAdjustment, req, {
      productId: product._id,
      type,
      quantity: numQty,
      reason: reason.trim(),
      notes: notes?.trim() || '',
      date: new Date(),
      createdBy: req.user.id,
    });

    // Audit Log
    await AuditLog.create({
      businessId: getTenantId(req),
      userId: req.user.id,
      userName: req.user.name,
      action: 'STOCK_ADJUSTMENT',
      entity: 'Product',
      entityId: product._id.toString(),
      details: { productName: product.name, type, quantity: numQty, reason, newStock: product.stock },
      ip: req.ip || '',
    }).catch((err) => console.error('Audit log failed:', err));

    return res.json({
      success: true,
      message: 'স্টক সফলভাবে সমন্বয় করা হয়েছে',
      product,
      adjustment,
    });
  } catch (error) {
    console.error('Stock adjustment error:', error);
    return res.status(500).json({ success: false, message: 'স্টক সমন্বয় ব্যর্থ' });
  }
});

/**
 * DELETE /api/products/:id
 * Soft delete product
 */
router.delete('/:id', async (req, res) => {
  try {
    await tenantQueries.softDelete(Product, req, req.params.id);

    // Audit Log
    await AuditLog.create({
      businessId: getTenantId(req),
      userId: req.user.id,
      userName: req.user.name,
      action: 'DELETE_PRODUCT',
      entity: 'Product',
      entityId: req.params.id,
      ip: req.ip || '',
    }).catch((err) => console.error('Audit log failed:', err));

    return res.json({
      success: true,
      message: 'পণ্য সফলভাবে মুছে ফেলা হয়েছে',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ success: false, message: 'পণ্য মুছতে ব্যর্থ' });
  }
});

export default router;
