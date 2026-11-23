'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../../../lib/api';
import { formatBDT } from '../../../../lib/formatters';
import { useAuth } from '../../../../lib/authContext';
import { getTemplateLabel, getTemplateCustomFields } from '../../../../lib/templates';
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  Users,
  Package,
  CreditCard,
  FileText,
} from 'lucide-react';

function NewSaleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPartyId = searchParams.get('partyId') || '';

  const { business } = useAuth();
  const businessType = business?.businessType || 'general';

  const saleLabel = getTemplateLabel(businessType, 'sale', 'bn', 'চালান / মেমো');
  const partyLabel = getTemplateLabel(businessType, 'party', 'bn', 'পার্টি / কাস্টমার');
  const templateFields = getTemplateCustomFields(businessType);

  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [partyId, setPartyId] = useState(initialPartyId);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([
    { productId: '', productName: '', unit: '', quantity: 1, rate: 0, total: 0, customFields: {}, stock: 0 },
  ]);
  const [discount, setDiscount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const [partiesRes, productsRes] = await Promise.all([
          fetchApi('/parties?type=customer'),
          fetchApi('/products'),
        ]);

        if (partiesRes.success) setParties(partiesRes.parties || []);
        if (productsRes.success) setProducts(productsRes.products || []);
      } catch (err) {
        console.error('Failed to load parties/products:', err);
      } finally {
        setLoadingData(false);
      }
    }
    init();
  }, []);

  // Update item row when product is selected
  const handleProductSelect = (index, prodId) => {
    const prod = products.find((p) => p._id === prodId);
    if (!prod) return;

    setItems((prev) => {
      const updated = [...prev];
      const qty = updated[index].quantity || 1;
      const rate = prod.salePrice || 0;
      updated[index] = {
        ...updated[index],
        productId: prod._id,
        productName: prod.name,
        unit: prod.unit,
        rate,
        stock: prod.stock || 0,
        customFields: prod.customFields || {},
        total: qty * rate,
      };
      return updated;
    });
  };

  // Update quantity or rate
  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      const q = Number(updated[index].quantity) || 0;
      const r = Number(updated[index].rate) || 0;
      updated[index].total = q * r;
      return updated;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { productId: '', productName: '', unit: '', quantity: 1, rate: 0, total: 0, customFields: {}, stock: 0 },
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Summary calculations
  const subTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const numDiscount = Number(discount) || 0;
  const totalAmount = Math.max(0, subTotal - numDiscount);
  const numPaid = Number(paidAmount) || 0;
  const dueAmount = Math.max(0, totalAmount - numPaid);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!partyId) {
      setError('অনুগ্রহ করে কাস্টমার / পার্টি নির্বাচন করুন।');
      return;
    }

    const validItems = items.filter((item) => item.productId && Number(item.quantity) > 0);
    if (validItems.length === 0) {
      setError('কমপক্ষে একটি পণ্য এবং সঠিক পরিমাণ নির্বাচন করুন।');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchApi('/sales', {
        method: 'POST',
        body: JSON.stringify({
          partyId,
          date,
          items: validItems,
          discount: numDiscount,
          paidAmount: numPaid,
          paymentMethod,
          notes,
        }),
      });

      if (res.success && res.sale) {
        router.push(`/sales/${res.sale._id}`);
      } else {
        setError(res.message || 'চালান তৈরি করতে সমস্যা হয়েছে');
      }
    } catch (err) {
      setError(err.message || 'চালান তৈরি করতে সমস্যা হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/sales"
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            নতুন {saleLabel} কাটুন
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            আইটেম নির্বাচন করুন, রেট ও পরিমাণ দিন; স্টক ও কাস্টমার খাতা স্বয়ংক্রিয়ভাবে আপডেট হবে
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Date Selector Box */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {partyLabel} নির্বাচন করুন *
            </label>
            <div className="flex gap-2">
              <select
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                required
              >
                <option value="">-- কাস্টমার / পার্টি নির্বাচন করুন --</option>
                {parties.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} {p.phone ? `(${p.phone})` : ''} • পূর্বের জের:{' '}
                    {formatBDT(Math.abs(p.currentBalance || 0))} {p.currentBalance > 0 ? '(বাকি)' : ''}
                  </option>
                ))}
              </select>
              <Link
                href="/parties/new"
                className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold shrink-0 flex items-center gap-1"
                title="নতুন পার্টি যোগ করুন"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">নতুন</span>
              </Link>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              চালানের তারিখ *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              required
            />
          </div>
        </div>

        {/* Line Items Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <span>পণ্যের বিবরণ ও পরিমাণ</span>
            </h2>
            <button
              type="button"
              onClick={addItemRow}
              className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ আরও পণ্য যোগ করুন</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((row, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
              >
                {/* Product Select (5 cols) */}
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    পণ্য নির্বাচন ({idx + 1})
                  </label>
                  <select
                    value={row.productId}
                    onChange={(e) => handleProductSelect(idx, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  >
                    <option value="">-- পণ্য নির্বাচন করুন --</option>
                    {products.map((p) => {
                      const yarnInfo = [];
                      if (p.customFields?.count) yarnInfo.push(`Count: ${p.customFields.count}`);
                      if (p.customFields?.lot) yarnInfo.push(`Lot: ${p.customFields.lot}`);
                      return (
                        <option key={p._id} value={p._id}>
                          {p.name} {yarnInfo.length > 0 ? `[${yarnInfo.join(' | ')}]` : ''} (মজুদ: {p.stock} {p.unit})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Quantity (2 cols) */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    পরিমাণ {row.unit ? `(${row.unit})` : ''}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={row.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-black text-right focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>

                {/* Rate (2 cols) */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    দর / রেট (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={row.rate}
                    onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-bold text-right focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>

                {/* Line Total (2 cols) */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    মোট টাকা
                  </label>
                  <div className="px-3 py-2 rounded-xl bg-slate-200/60 text-slate-900 text-xs font-black text-right">
                    {formatBDT(row.total)}
                  </div>
                </div>

                {/* Remove button (1 col) */}
                <div className="sm:col-span-1 flex justify-center pb-1">
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    disabled={items.length <= 1}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 cursor-pointer"
                    title="আইটেম মুছুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calculation & Payment Details Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              চালান বা মেমোর বিবরণ / মন্তব্য
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ট্রাক নম্বর, ডেলিভারি চালানের তথ্য বা অতিরিক্ত নোট..."
              rows={4}
              className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Pricing Totals & Payment */}
          <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>আইটেমসমূহের মোট মূল্য:</span>
              <span className="font-mono text-sm">{formatBDT(subTotal)}</span>
            </div>

            {/* Discount */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">ছাড় / ডিসকাউন্ট (৳):</span>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                className="w-32 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-right text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Grand Total */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
              <span>সর্বমোট প্রদেয় (Net Total):</span>
              <span className="text-base text-blue-900">{formatBDT(totalAmount)}</span>
            </div>

            {/* Instant Paid Amount & Method */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-700">নগদ / ইনস্ট্যান্ট জমা (৳):</span>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0"
                  className="w-32 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50/40 text-right text-xs font-black text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {numPaid > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">পেমেন্ট মাধ্যম:</span>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="py-1 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                  >
                    <option value="cash">নগদ (Cash)</option>
                    <option value="bKash">বিকাশ (bKash)</option>
                    <option value="Nagad">নগদ (Nagad)</option>
                    <option value="bank">ব্যাংক ডিপোজিট</option>
                  </select>
                </div>
              )}
            </div>

            {/* Due Amount Highlight */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs font-black">
              <span className="text-rose-600">অবশিষ্ট বাকি (Due Amount):</span>
              <span className="text-sm text-rose-600 font-mono">{formatBDT(dueAmount)}</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <Link
            href="/sales"
            className="py-3 px-5 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
          >
            বাতিল
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="py-3.5 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-500/25 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>চালান তৈরি হচ্ছে...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>চালান সংরক্ষণ ও প্রিন্ট করুন</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewSalePage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">চালান ফর্ম প্রস্তুত হচ্ছে...</p>
        </div>
      }
    >
      <NewSaleContent />
    </Suspense>
  );
}
