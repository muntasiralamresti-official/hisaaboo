'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../../../lib/api';
import { ALL_MODULES, getAllTemplates } from '../../../../lib/templates';
import {
  Building2,
  ArrowLeft,
  Check,
  AlertCircle,
  ShieldAlert,
  Save,
  Layers,
} from 'lucide-react';

export default function CreateBusinessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    phone: '',
    address: '',
    businessType: 'yarn', // default yarn
    yearlyFee: 12000,
    ownerPassword: 'owner' + Math.floor(100 + Math.random() * 900),
    initialPaymentAmount: 12000,
    initialPaymentMethod: 'cash',
    enabledModules: [
      'dashboard',
      'parties',
      'products',
      'sales',
      'purchases',
      'payments',
      'expenses',
      'cashbook',
      'reports',
      'settings',
    ],
  });

  const handleModuleToggle = (moduleId) => {
    setFormData((prev) => {
      const exists = prev.enabledModules.includes(moduleId);
      return {
        ...prev,
        enabledModules: exists
          ? prev.enabledModules.filter((m) => m !== moduleId)
          : [...prev.enabledModules, moduleId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.ownerName || !formData.phone) {
      setError('ব্যবসার নাম, মালিকের নাম এবং মোবাইল নম্বর আবশ্যক।');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi('/admin/businesses', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          yearlyFee: Number(formData.yearlyFee) || 0,
          initialPaymentAmount: Number(formData.initialPaymentAmount) || 0,
        }),
      });

      if (res.success) {
        router.push(`/admin/businesses/${res.business._id}`);
      } else {
        setError(res.message || 'ব্যবসা তৈরি করতে সমস্যা হয়েছে।');
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'ব্যবসা তৈরি করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/businesses"
          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            নতুন ব্যবসা যুক্ত করুন
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            নতুন ক্লায়েন্ট অনবোর্ড করুন এবং ব্যবসার ধরন অনুযায়ী সিস্টেম প্রস্তুত করুন
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Basic Business & Owner Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>১. ব্যবসা ও মালিকের তথ্য</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ব্যবসার নাম *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="যেমন: আল-মদিনা সুতা ট্রেডার্স"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                মালিকের নাম *
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="যেমন: হাজী মোঃ রফিক"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                মোবাইল নম্বর (লগইন ইউজারনেম) *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="017xxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ওনারের প্রাথমিক পাসওয়ার্ড *
              </label>
              <input
                type="text"
                value={formData.ownerPassword}
                onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ঠিকানা
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="যেমন: তানবাজার, নারায়ণগঞ্জ"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* 2. Business Type Selector (Template) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>২. ব্যবসার ধরন (Template System)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {getAllTemplates().map((tpl) => {
              const isSelected = formData.businessType === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      businessType: tpl.id,
                      yearlyFee: tpl.id === 'yarn' ? 12000 : 10000,
                    })
                  }
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-slate-900">{tpl.name.bn}</span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">
                      {tpl.description.bn}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 border-t border-slate-100 pt-2 text-[10px] text-slate-500 font-semibold">
                    <span>একক:</span>
                    {tpl.units.map((u) => (
                      <span key={u.key} className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                        {u.label.bn}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Fee & Initial Payment */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>৩. বাৎসরিক সাবস্ক্রিপশন ফি ও প্রথম পেমেন্ট</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                বাৎসরিক ফি (টাকা)
              </label>
              <input
                type="number"
                value={formData.yearlyFee}
                onChange={(e) => setFormData({ ...formData, yearlyFee: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                প্রথম পেমেন্ট গ্রহণ (টাকা)
              </label>
              <input
                type="number"
                value={formData.initialPaymentAmount}
                onChange={(e) => setFormData({ ...formData, initialPaymentAmount: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পেমেন্ট মাধ্যম
              </label>
              <select
                value={formData.initialPaymentMethod}
                onChange={(e) => setFormData({ ...formData, initialPaymentMethod: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              >
                <option value="cash">ক্যাশ (নগদ)</option>
                <option value="bKash">বিকাশ (bKash)</option>
                <option value="Nagad">নগদ (Nagad)</option>
                <option value="bank">ব্যাংক ডিপোজিট</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Enabled Modules */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            ৪. এই ব্যবসার জন্য অনুমোদিত মডিউলসমূহ
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {ALL_MODULES.map((mod) => {
              const isChecked = formData.enabledModules.includes(mod.id);
              return (
                <label
                  key={mod.id}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                    isChecked
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleModuleToggle(mod.id)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs">{mod.name.bn}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/businesses"
            className="py-3 px-5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50"
          >
            বাতিল
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>তৈরি হচ্ছে...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>ব্যবসা সংরক্ষণ করুন</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
