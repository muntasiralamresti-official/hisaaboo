'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../../../lib/api';
import { formatBDT } from '../../../../lib/formatters';
import { useAuth } from '../../../../lib/authContext';
import { getTemplateLabel, getTemplateCustomFields } from '../../../../lib/templates';
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  Building,
  Package,
} from 'lucide-react';

function NewPurchaseContent() {
  const router = useRouter();
  const { business } = useAuth();
  const businessType = business?.businessType || 'general';

  const purchaseLabel = getTemplateLabel(businessType, 'purchase', 'bn', 'ক্রয় / মিল চালান');
  const supplierLabel = getTemplateLabel(businessType, 'supplier', 'bn', 'মহাজন / মিল সাপ্লায়ার');
  const templateFields = getTemplateCustomFields(businessType);

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [partyId, setPartyId] = useState('');
  const [billNo, setBillNo] = useState('');
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
        const [suppliersRes, productsRes] = await Promise.all([
          fetchApi('/parties?type=supplier'),
          fetchApi('/products'),
        ]);

        if (suppliersRes.success) setSuppliers(suppliersRes.parties || []);
        if (productsRes.success) setProducts(productsRes.products || []);
      } catch (err) {
        console.error('Failed to load suppliers/products:', err);
      } finally {
        setLoadingData(false);
      }
    }
    init();
  }, []);

  const handleProductSelect = (index, prodId) => {
    const prod = products.find((p) => p._id === prodId);
    if (!prod) return;

    setItems((prev) => {
      const updated = [...prev];
      const qty = updated[index].quantity || 1;
      const rate = prod.purchasePrice || 0;
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

  const subTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const numDiscount = Number(discount) || 0;
  const totalAmount = Math.max(0, subTotal - numDiscount);
  const numPaid = Number(paidAmount) || 0;
  const dueAmount = Math.max(0, totalAmount - numPaid);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!partyId) {
      setError('মহাজন / মিল নির্বাচন করুন');
      return;
    }

    const validItems = items.filter((item) => item.productId && Number(item.quantity) > 0);
    if (validItems.length === 0) {
      setError('কমপক্ষে একটি পণ্য এবং সঠিক পরিমাণ নির্বাচন করুন');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchApi('/purchases', {
        method: 'POST',
        body: JSON.stringify({
          partyId,
          billNo,
          date,
          items: validItems,
          discount: numDiscount,
          paidAmount: numPaid,
          paymentMethod,
          notes,
        }),
      });

      if (res.success) {
        router.push('/purchases');
      } else {
        setError(res.message || 'ক্রয় চালান সংরক্ষণ ব্যর্থ');
      }
    } catch (err) {
      setError(err.message || 'ক্রয় চালান সংরক্ষণ ব্যর্থ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/purchases"
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            নতুন {purchaseLabel} এন্ট্রি
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            মাল ক্রয় এন্ট্রি দিলে স্বয়ংক্রিয়ভাবে স্টক বৃদ্ধি পাবে এবং মহাজন খাতা আপডেট হবে
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
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {supplierLabel} নির্বাচন করুন *
            </label>
            <select
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              required
            >
              <option value="">-- মহাজন / মিল নির্বাচন করুন --</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} {s.phone ? `(${s.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              মিলের চালান / বিল নং
            </label>
            <input
              type="text"
              value={billNo}
              onChange={(e) => setBillNo(e.target.value)}
              placeholder="ঐচ্ছিক (যেমন: M-4091)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              ক্রয় তারিখ *
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

        {/* Item Rows */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <span>ক্রয়কৃত পণ্যের বিবরণ</span>
            </h2>
            <button
              type="button"
              onClick={addItemRow}
              className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold cursor-pointer"
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
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} (বর্তমান মজুদ: {p.stock} {p.unit})
                      </option>
                    ))}
                  </select>
                </div>

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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-black text-right"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    ক্রয় দর (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={row.rate}
                    onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-bold text-right"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    মোট টাকা
                  </label>
                  <div className="px-3 py-2 rounded-xl bg-slate-200/60 text-slate-900 text-xs font-black text-right">
                    {formatBDT(row.total)}
                  </div>
                </div>

                <div className="sm:col-span-1 flex justify-center pb-1">
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    disabled={items.length <= 1}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Totals */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              মন্তব্য / চালান বিবরণ
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="গাড়ি নম্বর, গোডাউন রিসিভ ইত্যাদি..."
              rows={4}
              className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-700">
              <span>মোট ক্রয় মূল্য:</span>
              <span className="font-mono text-sm">{formatBDT(subTotal)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">ছাড় / কমিশন (৳):</span>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                className="w-32 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-right text-xs font-bold"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
              <span>সর্বমোট প্রদেয় বিল:</span>
              <span className="text-base text-blue-900">{formatBDT(totalAmount)}</span>
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-700">তাৎক্ষণিক পরিশোধ (৳):</span>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0"
                  className="w-32 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50/40 text-right text-xs font-black text-emerald-700"
                />
              </div>

              {numPaid > 0 && (
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600">পরিশোধ মাধ্যম:</span>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="py-1 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                  >
                    <option value="cash">নগদ (Cash)</option>
                    <option value="bKash">বিকাশ (bKash)</option>
                    <option value="Nagad">নগদ (Nagad)</option>
                    <option value="bank">ব্যাংক ট্রান্সফার</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 font-black">
              <span className="text-amber-700">মহাজন পাওনা (বকেয়া):</span>
              <span className="text-sm text-amber-700 font-mono">{formatBDT(dueAmount)}</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/purchases"
            className="py-3 px-5 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
          >
            বাতিল
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="py-3.5 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-500/25 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {submitting ? 'সংরক্ষণ হচ্ছে...' : 'ক্রয় চালান সংরক্ষণ করুন'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewPurchasePage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">ফর্ম প্রস্তুত হচ্ছে...</p>
        </div>
      }
    >
      <NewPurchaseContent />
    </Suspense>
  );
}
