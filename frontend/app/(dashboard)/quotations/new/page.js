'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../../../lib/api';
import { formatBDT } from '../../../../lib/formatters';
import { ArrowLeft, Plus, Trash2, Save, FileText, AlertCircle } from 'lucide-react';

export default function NewQuotationPage() {
  const router = useRouter();
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [partyId, setPartyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [items, setItems] = useState([
    { productId: '', productName: '', unit: '', quantity: 1, rate: 0, total: 0 },
  ]);
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
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
        console.error(err);
      }
    }
    init();
  }, []);

  const handleProductSelect = (index, prodId) => {
    const prod = products.find((p) => p._id === prodId);
    if (!prod) return;
    setItems((prev) => {
      const next = [...prev];
      const q = next[index].quantity || 1;
      const r = prod.salePrice || 0;
      next[index] = {
        ...next[index],
        productId: prod._id,
        productName: prod.name,
        unit: prod.unit,
        rate: r,
        total: q * r,
      };
      return next;
    });
  };

  const handleItemChange = (index, field, val) => {
    setItems((prev) => {
      const next = [...prev];
      next[index][field] = val;
      const q = Number(next[index].quantity) || 0;
      const r = Number(next[index].rate) || 0;
      next[index].total = q * r;
      return next;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { productId: '', productName: '', unit: '', quantity: 1, rate: 0, total: 0 },
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subTotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const totalAmount = Math.max(0, subTotal - (Number(discount) || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!partyId) {
      setError('খরিদ্দার নির্বাচন করুন');
      return;
    }
    const validItems = items.filter((i) => i.productId && Number(i.quantity) > 0);
    if (!validItems.length) {
      setError('কমপক্ষে একটি পণ্য যোগ করুন');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetchApi('/quotations', {
        method: 'POST',
        body: JSON.stringify({
          partyId,
          date,
          validUntil: validUntil || null,
          items: validItems,
          discount: Number(discount) || 0,
          notes,
        }),
      });

      if (res.success) {
        router.push(`/quotations/${res.quotation._id}`);
      } else {
        setError(res.message || 'কোটেশন সংরক্ষণ ব্যর্থ');
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'সার্ভার সমস্যা');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/quotations"
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            <span>নতুন দরপত্র / কোটেশন তৈরি</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            খরিদ্দারের জন্য সুতার দর প্রস্তাব তৈরি করুন
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              খরিদ্দার / কাস্টমার *
            </label>
            <select
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white"
            >
              <option value="">খরিদ্দার নির্বাচন করুন</option>
              {parties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} {p.phone ? `(${p.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              কোটেশনের তারিখ *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              মেয়াদ উত্তীর্ণের তারিখ (ঐচ্ছিক)
            </label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>
        </div>

        {/* Item Rows */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            সুতা ও পণ্যের তালিকা
          </label>
          <div className="space-y-2.5">
            {items.map((row, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-12 gap-2.5 items-center">
                <div className="col-span-12 sm:col-span-6">
                  <select
                    value={row.productId}
                    onChange={(e) => handleProductSelect(idx, e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    <option value="">পণ্য নির্বাচন করুন</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="পরিমাণ"
                    value={row.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-right"
                  />
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="দর"
                    value={row.rate}
                    onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-right"
                  />
                </div>

                <div className="col-span-3 sm:col-span-1 text-right font-black text-xs text-slate-900">
                  {formatBDT(row.total)}
                </div>

                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItemRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-indigo-300 text-indigo-700 text-xs font-bold hover:bg-indigo-50 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ আরও পণ্য যোগ করুন</span>
          </button>
        </div>

        {/* Totals */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
          <div className="w-full sm:w-1/2">
            <label className="block text-xs font-bold text-slate-700 mb-1">কোটেশনের শর্তাবলী / নোট</label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: দর আগামী ৭ দিনের জন্য প্রযোজ্য।"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div className="w-full sm:w-64 space-y-2 text-xs">
            <div className="flex justify-between py-1 text-slate-600 font-semibold">
              <span>মোট মূল্য:</span>
              <span className="font-bold text-slate-900 font-mono">{formatBDT(subTotal)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-600 font-semibold">প্রস্তাবিত ছাড়:</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-right font-bold text-xs"
              />
            </div>
            <div className="flex justify-between py-2 border-t border-slate-900 font-black text-sm text-indigo-900">
              <span>সর্বমোট প্রদেয়:</span>
              <span>{formatBDT(totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Link
            href="/quotations"
            className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold cursor-pointer"
          >
            বাতিল
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
          >
            {loading ? 'সংরক্ষণ হচ্ছে...' : 'কোটেশন নিশ্চিত করুন'}
          </button>
        </div>
      </form>
    </div>
  );
}
