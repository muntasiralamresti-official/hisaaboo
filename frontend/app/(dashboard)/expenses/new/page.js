'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../../../lib/api';
import { useAuth } from '../../../../lib/authContext';
import { getTemplateExpenseCategories } from '../../../../lib/templates';
import { ArrowLeft, Save, Receipt, AlertCircle } from 'lucide-react';

export default function NewExpensePage() {
  const router = useRouter();
  const { business } = useAuth();
  const templateCategories = getTemplateExpenseCategories(business?.businessType);

  const [formData, setFormData] = useState({
    category: templateCategories[0]?.key || 'other',
    amount: '',
    paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('সঠিক খরচের টাকার পরিমাণ দিন');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetchApi('/expenses', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          amount: Number(formData.amount),
        }),
      });

      if (res.success) {
        router.push('/expenses');
      } else {
        setError(res.message || 'খরচ সংরক্ষণ ব্যর্থ হয়েছে');
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'সার্ভার যোগাযোগে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/expenses"
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-rose-600" />
            <span>নতুন খরচ যুক্ত করুন</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            দোকান বা গোডাউনের খরচের রশিদ সংরক্ষণ করুন
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              খরচের খাত *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-sm font-bold text-slate-800 bg-white"
            >
              {templateCategories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label.bn || c.label.en}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              {business?.name || 'আপনার ব্যবসা'} এর টেমপ্লেট অনুযায়ী অনুমোদিত খাত
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                টাকার পরিমাণ (BDT ৳) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                placeholder="যেমন ৫০০"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-base font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                পেমেন্ট মাধ্যম *
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-sm font-bold text-slate-800 bg-white"
              >
                <option value="cash">নগদ ক্যাশ (Cash)</option>
                <option value="bKash">বিকাশ (bKash)</option>
                <option value="Nagad">নগদ (Nagad)</option>
                <option value="bank">ব্যাংক চেক / ট্রান্সফার</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              তারিখ *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-sm text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              খরচের বিবরণ বা ভাউচার নোট
            </label>
            <textarea
              rows="3"
              placeholder="যেমন: কার্টুন লোডিং খরচ বাবদ..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-sm text-slate-800"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <Link
              href="/expenses"
              className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm transition-colors cursor-pointer"
            >
              বাতিল
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'সংরক্ষণ হচ্ছে...' : 'খরচ নিশ্চিত করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
