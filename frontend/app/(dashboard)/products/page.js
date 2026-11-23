'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../../lib/api';
import { formatBDT } from '../../../lib/formatters';
import { useAuth } from '../../../lib/authContext';
import { getTemplateLabel, getTemplateCustomFields } from '../../../lib/templates';
import {
  Package,
  PlusCircle,
  Search,
  AlertTriangle,
  Boxes,
  TrendingUp,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Layers,
} from 'lucide-react';

export default function ProductsPage() {
  const { business, language, t } = useAuth();
  const businessType = business?.businessType || 'general';

  const productLabel = getTemplateLabel(businessType, 'product', language, t('nav_products', 'পণ্য'));
  const templateFields = getTemplateCustomFields(businessType);

  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({ totalItems: 0, totalStockValue: 0, lowStockCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Stock Adjustment Modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustType, setAdjustType] = useState('increase');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('recount');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (lowStockFilter) params.append('lowStock', 'true');

      const res = await fetchApi(`/products?${params.toString()}`);
      if (res.success) {
        setProducts(res.products || []);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [lowStockFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadProducts();
  };

  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !adjustQty || Number(adjustQty) <= 0) return;

    setAdjustLoading(true);
    try {
      const res = await fetchApi(`/products/${selectedProduct._id}/adjust`, {
        method: 'POST',
        body: JSON.stringify({
          type: adjustType,
          quantity: Number(adjustQty),
          reason: adjustReason,
          notes: adjustNotes,
        }),
      });

      if (res.success) {
        setSelectedProduct(null);
        setAdjustQty('');
        setAdjustNotes('');
        loadProducts();
      }
    } catch (err) {
      alert(err.message || (language === 'en' ? 'Stock adjustment failed' : 'স্টক সমন্বয় ব্যর্থ'));
    } finally {
      setAdjustLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Package className="w-7 h-7 text-blue-600" />
            <span>{productLabel} {language === 'en' ? 'Stock & Inventory' : 'ও স্টক তালিকা'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('products_subtitle', 'মজুদ মালামাল, বর্তমান স্টক মূল্য এবং ইনভেন্টরি ম্যানেজমেন্ট')}
          </p>
        </div>

        <Link
          href="/products/new"
          className="inline-flex items-center gap-2 py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{language === 'en' ? `Add New ${productLabel}` : `নতুন ${productLabel} যোগ করুন`}</span>
        </Link>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Stock Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {t('col_stock_value', 'মোট স্টক মূল্যায়ন (ক্রয় রেট)')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatBDT(summary.totalStockValue, language)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {language === 'en' ? 'Total valuation at cost price' : 'গোডাউনে থাকা মালামালের বর্তমান আর্থিক মূল্য'}
          </p>
        </div>

        {/* Total Items Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {language === 'en' ? 'Unique Product Items' : 'মোট মালামালের ধরন'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {products.length} {language === 'en' ? 'Items' : 'টি'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {language === 'en' ? 'Total active items in catalog' : 'ইনভেন্টরিতে নিবন্ধিত মোট আইটেম'}
          </p>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => setLowStockFilter(!lowStockFilter)}
          className={`p-5 rounded-2xl border shadow-xs cursor-pointer transition-all ${
            summary.lowStockCount > 0
              ? 'bg-amber-50/60 border-amber-200 hover:bg-amber-100/60'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              {t('reorder_alert', 'কম স্টক সতর্কতা')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700">
            {summary.lowStockCount} {language === 'en' ? 'Items Alert' : 'টি আইটেম'}
          </div>
          <p className="text-[11px] text-amber-800/80 mt-1 font-medium">
            {lowStockFilter
              ? (language === 'en' ? 'Filter active (click to clear)' : 'ফিল্টার সক্রিয় (ক্লিক করে সব দেখুন)')
              : (language === 'en' ? 'Need to reorder / procure' : 'পুনরায় ক্রয় বা তোলার প্রয়োজন')}
          </p>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 w-full sm:max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search_product_placeholder', 'পণ্যের নাম, ব্র্যান্ড বা কোড দিয়ে খুঁজুন...')}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            {t('search', 'খুঁজুন')}
          </button>
        </form>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {lowStockFilter && (
            <button
              onClick={() => setLowStockFilter(false)}
              className="py-1.5 px-3 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold cursor-pointer"
            >
              {language === 'en' ? 'Clear Filter ✕' : 'ফিল্টার মুছুন ✕'}
            </button>
          )}
          <button
            onClick={loadProducts}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
            title={t('refresh', 'রিফ্রেশ')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Products Table (Dynamic Custom Fields from Template) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">{t('col_product_name', 'বিবরণ / পণ্যের নাম')}</th>
                {/* Dynamically render custom fields header from template! */}
                {templateFields.map((f) => (
                  <th key={f.key} className="px-5 py-3.5">
                    {f.label?.[language] || f.label?.bn || f.label?.en || f.key}
                  </th>
                ))}
                <th className="px-5 py-3.5 text-right">{t('col_purchase_price', 'ক্রয় রেট')}</th>
                <th className="px-5 py-3.5 text-right">{t('col_sale_price', 'বিক্রয় রেট')}</th>
                <th className="px-5 py-3.5 text-right">{t('col_stock_qty', 'বর্তমান স্টক')}</th>
                <th className="px-5 py-3.5 text-right">{t('col_stock_value', 'মোট ভ্যালু')}</th>
                <th className="px-5 py-3.5 text-right">{language === 'en' ? 'Adjustment' : 'স্টক সমন্বয়'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6 + templateFields.length} className="px-5 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">{t('loading', 'স্টক তালিকা লোড হচ্ছে...')}</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6 + templateFields.length} className="px-5 py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-700">{t('no_products_found', 'কোনো মালামাল পাওয়া যায়নি')}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {language === 'en' ? 'Click above to add a new product.' : 'স্টকে নতুন মাল যোগ করতে উপরের বাটনে ক্লিক করুন।'}
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.stock <= p.lowStockLevel;
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {language === 'en' ? 'Unit' : 'একক'}: {p.unit}
                        </div>
                      </td>

                      {/* Dynamic Custom Fields Content */}
                      {templateFields.map((f) => (
                        <td key={f.key} className="px-5 py-4">
                          <span className="font-semibold text-slate-800 text-xs">
                            {p.customFields?.[f.key] || '—'}
                          </span>
                        </td>
                      ))}

                      <td className="px-5 py-4 text-right font-medium text-slate-700">
                        {formatBDT(p.purchasePrice, language)}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-slate-900">
                        {formatBDT(p.salePrice, language)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="font-black text-sm text-slate-900">
                          {p.stock} <span className="text-xs font-normal text-slate-500">{p.unit}</span>
                        </div>
                        {isLow && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 mt-0.5">
                            {language === 'en' ? `Low-Stock (< ${p.lowStockLevel})` : `লো-স্টক (${p.lowStockLevel} এর নিচে)`}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-slate-900">
                        {formatBDT(p.stockValue, language)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedProduct(p)}
                          className="py-1.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          {language === 'en' ? 'Adjust' : 'সমন্বয়'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {language === 'en' ? 'Manual Stock Adjustment' : 'ম্যানুয়াল স্টক সমন্বয় (Stock Adjustment)'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              <strong>{selectedProduct.name}</strong> • {language === 'en' ? 'Current Stock' : 'বর্তমান স্টক'}: {selectedProduct.stock} {selectedProduct.unit}
            </p>

            <form onSubmit={handleStockAdjustment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Adjustment Type' : 'সমন্বয়ের ধরন'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('increase')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      adjustType === 'increase'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {language === 'en' ? '+ Increase Stock' : '+ স্টক বৃদ্ধি (Increase)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('decrease')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      adjustType === 'decrease'
                        ? 'border-rose-600 bg-rose-50 text-rose-900 ring-1 ring-rose-600'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {language === 'en' ? '- Decrease (Damage / Loss)' : '- স্টক হ্রাস (Damage / Loss)'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'en' ? `Quantity (${selectedProduct.unit})` : `পরিমাণ (${selectedProduct.unit})`}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder={language === 'en' ? 'e.g. 10' : 'যেমন: ১০'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Reason' : 'কারণ (Reason)'}
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="recount">{language === 'en' ? 'Physical Recount / Correction' : 'স্টক রিকাউন্ট / গণনা ভুল সংশোধন'}</option>
                  <option value="damaged">{language === 'en' ? 'Damaged Goods' : 'মাল নষ্ট / ড্যামেজ'}</option>
                  <option value="missing">{language === 'en' ? 'Missing / Wastage' : 'হারিয়ে গেছে / চুরি / ঘাটতি'}</option>
                  <option value="bonus">{language === 'en' ? 'Bonus / Extra from Mill' : 'বোনাস বা অতিরিক্ত প্রাপ্তি'}</option>
                  <option value="other">{language === 'en' ? 'Other' : 'অন্যান্য'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('notes', 'মন্তব্য')}
                </label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder={language === 'en' ? 'Optional remarks...' : 'অতিরিক্ত কোনো তথ্য থাকলে...'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="py-2 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  {t('cancel', 'বাতিল')}
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {adjustLoading
                    ? t('saving', 'সংরক্ষণ হচ্ছে...')
                    : (language === 'en' ? 'Update Stock' : 'স্টক আপডেট করুন')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
