'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../../../lib/api';
import { formatBDT } from '../../../../lib/formatters';
import { ArrowLeft, Save, Plus, Trash2, RotateCcw, AlertCircle } from 'lucide-react';

export default function NewReturnPage() {
  const router = useRouter();
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [type, setType] = useState('sale_return'); // 'sale_return' or 'purchase_return'
  const [partyId, setPartyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('damage');
  const [items, setItems] = useState([
    { productId: '', productName: '', unit: '', quantity: 1, rate: 0, total: 0 },
  ]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const partyType = type === 'sale_return' ? 'customer' : 'supplier';
        const [pRes, prodRes] = await Promise.all([
          fetchApi(`/parties?type=${partyType}`),
          fetchApi('/products'),
        ]);
        if (pRes.success) setParties(pRes.parties || []);
        if (prodRes.success) setProducts(prodRes.products || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, [type]);

  const handleProductSelect = (index, prodId) => {
    const prod = products.find((p) => p._id === prodId);
    if (!prod) return;
    setItems((prev) => {
      const next = [...prev];
      const q = next[index].quantity || 1;
      const r = type === 'sale_return' ? (prod.salePrice || 0) : (prod.purchasePrice || 0);
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

  const totalAmount = items.reduce((sum, it) => sum + (Number(it.total) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!partyId) {
      setError('পার্টি নির্বাচন করুন');
      return;
    }
    const validItems = items.filter((i) => i.productId && Number(i.quantity) > 0);
    if (!validItems.length) {
      setError('কমপক্ষে একটি পণ্য নির্বাচন করুন');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetchApi('/returns', {
        method: 'POST',
        body: JSON.stringify({
          type,
          partyId,
          date,
          reason,
          items: validItems,
          notes,
        }),
      });

      if (res.success) {
        router.push('/returns');
      } else {
        setError(res.message || 'ফেরত সংরক্ষণ ব্যর্থ');
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
          href="/returns"
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-rose-600" />
            <span>নতুন সুতা ফেরত / ড্যামেজ এন্ট্রি</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            মাল ফেরত গ্রহণ বা মিল ফেরত পাঠানোর পর স্টক স্বয়ংক্রিয়ভাবে সমন্বয় হবে
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              ফেরতের ধরন *
            </label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPartyId('');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white"
            >
              <option value="sale_return">বিক্রয় ফেরত (কাস্টমার ফেরত দিল)</option>
              <option value="purchase_return">ক্রয় ফেরত (মিলে ফেরত পাঠানো হলো)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              {type === 'sale_return' ? 'খরিদ্দার / কাস্টমার *' : 'স্পিনিং মিল / সাপ্লায়ার *'}
            </label>
            <select
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white"
            >
              <option value="">পার্টি নির্বাচন করুন</option>
              {parties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              তারিখ *
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
              ফেরতের কারণ *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white"
            >
              <option value="damage">কোণ ড্যামেজ / ছেঁড়া</option>
              <option value="defect">কোয়ালিটি ত্রুটি / দাগ</option>
              <option value="count_mismatch">কাউন্ট বা লট অমিল</option>
              <option value="excess">অতিরিক্ত মাল পাঠানো হয়েছিল</option>
              <option value="other">অন্যান্য কারণ</option>
            </select>
          </div>
        </div>

        {/* Item Rows */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            ফেরতকৃত পণ্যের বিবরণ
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
                        {p.name} (স্টক: {p.stock} {p.unit})
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

                <div className="col-span-3 sm:col-span-1 text-right font-black text-xs text-rose-600">
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-rose-300 text-rose-700 text-xs font-bold hover:bg-rose-50 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ আরও পণ্য যোগ করুন</span>
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">মন্তব্য / বিবরণ</label>
          <textarea
            rows="2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="যেমন: ৩ বস্তা সুতার কোণ চাপ খেয়ে নষ্ট হয়ে ফেরত এসেছে।"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
          />
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm font-bold text-slate-700">
            মোট ফেরত মূল্য: <span className="text-base font-black text-rose-600 ml-1">{formatBDT(totalAmount)}</span>
          </div>

          <div className="flex gap-3">
            <Link
              href="/returns"
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold cursor-pointer"
            >
              বাতিল
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading ? 'সংরক্ষণ হচ্ছে...' : 'ফেরত নিশ্চিত করুন'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
