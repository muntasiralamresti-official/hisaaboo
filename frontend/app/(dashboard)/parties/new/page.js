'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../../../lib/api';
import { useAuth } from '../../../../lib/authContext';
import { getTemplateLabel } from '../../../../lib/templates';
import { ArrowLeft, Users, Save, AlertCircle, Phone, MapPin, FileText } from 'lucide-react';

export default function NewPartyPage() {
  const router = useRouter();
  const { business } = useAuth();
  const businessType = business?.businessType || 'general';

  const partyLabel = getTemplateLabel(businessType, 'party', 'bn', 'পার্টি');
  const customerLabel = getTemplateLabel(businessType, 'customer', 'bn', 'কাস্টমার / খরিদ্দার');
  const supplierLabel = getTemplateLabel(businessType, 'supplier', 'bn', 'মহাজন / মিল সাপ্লায়ার');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    type: 'customer',
    balanceAmount: 0,
    balanceType: 'due', // 'due' = party owes us (+), 'advance' = we owe party (-)
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('পার্টির নাম অবশ্যই প্রদান করতে হবে।');
      return;
    }

    const numBal = Number(formData.balanceAmount) || 0;
    const finalOpeningBalance = formData.balanceType === 'due' ? numBal : -numBal;

    setLoading(true);
    try {
      const res = await fetchApi('/parties', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          type: formData.type,
          openingBalance: finalOpeningBalance,
          notes: formData.notes.trim(),
        }),
      });

      if (res.success && res.party) {
        router.push(`/parties/${res.party._id}`);
      } else {
        setError(res.message || 'পার্টি সংরক্ষণ ব্যর্থ হয়েছে');
      }
    } catch (err) {
      setError(err.message || 'পার্টি সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/parties"
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            নতুন {partyLabel} যোগ করুন
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            নতুন খরিদ্দার অথবা মহাজন খাতা খুলুন
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        {/* Party Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            পার্টির নাম / প্রতিষ্ঠানের নাম *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Users className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="যেমন: হাজী ট্রেডার্স / মেসার্স রহিম টেক্সটাইল"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              required
            />
          </div>
        </div>

        {/* Type Selector Radio Cards */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            পার্টির ধরন *
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'customer', label: customerLabel },
              { id: 'supplier', label: supplierLabel },
              { id: 'both', label: 'উভয় (Both)' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFormData({ ...formData, type: t.id })}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  formData.type === t.id
                    ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-600'
                    : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Phone & Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              মোবাইল নম্বর
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="017xxxxxxxx"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              ঠিকানা / গোডাউন
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="যেমন: তানবাজার, নারায়ণগঞ্জ"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Opening Balance */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            পূর্বের বাকি বা প্রারম্ভিক ব্যালেন্স (Opening Balance)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <input
                type="number"
                value={formData.balanceAmount}
                onChange={(e) => setFormData({ ...formData, balanceAmount: e.target.value })}
                placeholder="0"
                min="0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <select
                value={formData.balanceType}
                onChange={(e) => setFormData({ ...formData, balanceType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="due">পূর্বের বাকি (পার্টি আমাদের দেবে)</option>
                <option value="advance">পূর্বের জমা (আমরা পার্টিকে দেব)</option>
              </select>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            * নতুন খাতা শুরু করার সময় কোনো বকেয়া বা অগ্রিম থাকলে তা এখানে লিখুন।
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            মন্তব্য / অতিরিক্ত তথ্য
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="পার্টি সম্পর্কিত অতিরিক্ত কোনো তথ্য..."
            rows={2}
            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Link
            href="/parties"
            className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
          >
            বাতিল
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>সংরক্ষণ হচ্ছে...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>খাতা তৈরি করুন</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
