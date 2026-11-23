'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../lib/api';
import { formatBDT, formatDate } from '../../lib/formatters';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  PlusCircle,
  ArrowRight,
  RefreshCw,
  Eye,
  Sliders,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, bizRes] = await Promise.all([
        fetchApi('/admin/stats'),
        fetchApi('/admin/businesses'),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (bizRes.success) setBusinesses(bizRes.businesses);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            সুপারএডমিন ড্যাশবোর্ড
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Hisaaboo প্ল্যাটফর্মের সকল ক্লায়েন্ট ব্যবসা ও সাবস্ক্রিপশন ওভারভিউ
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="রিফ্রেশ"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/admin/businesses/new"
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন ব্যবসা তৈরি</span>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Businesses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">মোট ব্যবসা</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats ? stats.totalBusinesses : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex gap-2">
            <span>সুতা: {stats?.yarnCount || 0}</span>
            <span>•</span>
            <span>জেনারেল: {stats?.generalCount || 0}</span>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">সক্রিয় ব্যবসা</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {stats ? stats.activeBusinesses - (stats.expiredSubscriptions || 0) : '—'}
          </div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">
            নিয়মিত সার্ভিস চালু আছে
          </div>
        </div>

        {/* Expired / Overdue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">মেয়াদোত্তীর্ণ</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">
            {stats ? stats.expiredSubscriptions : '—'}
          </div>
          <div className="text-xs text-rose-600 mt-1 font-medium">
            রিনিউ করা প্রয়োজন
          </div>
        </div>

        {/* Total Collected Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">মোট ফি আদায়</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-900">
            {stats ? formatBDT(stats.totalRevenue) : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            সর্বমোট সাবস্ক্রিপশন আয়
          </div>
        </div>
      </div>

      {/* Businesses Overview Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">ব্যবসার তালিকা</h2>
            <p className="text-xs text-slate-500">অনবোর্ড হওয়া সকল ক্লায়েন্ট প্রতিষ্ঠান</p>
          </div>
          <Link
            href="/admin/businesses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <span>সবগুলো দেখুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">ব্যবসার নাম</th>
                <th className="px-5 py-3.5">টাইপ</th>
                <th className="px-5 py-3.5">মালিক ও মোবাইল</th>
                <th className="px-5 py-3.5">মেয়াদ (Paid Until)</th>
                <th className="px-5 py-3.5">বাৎসরিক ফি</th>
                <th className="px-5 py-3.5">স্ট্যাটাস</th>
                <th className="px-5 py-3.5 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {businesses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    কোনো ব্যবসা পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                businesses.map((biz) => {
                  const isExpired = new Date(biz.paidUntil) < new Date();
                  return (
                    <tr key={biz._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{biz.name}</div>
                        <div className="text-xs text-slate-500">{biz.address || '—'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                            biz.businessType === 'yarn'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {biz.businessType === 'yarn' ? 'সুতা ব্যবসা' : 'জেনারেল'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">{biz.ownerName}</div>
                        <div className="text-xs text-slate-500">{biz.phone}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-700">
                          {formatDate(biz.paidUntil)}
                        </div>
                        {isExpired && !biz.isSuspended && (
                          <span className="inline-block text-[11px] text-rose-600 font-bold">
                            (মেয়াদোত্তীর্ণ)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800">
                        {formatBDT(biz.yearlyFee)}
                      </td>
                      <td className="px-5 py-4">
                        {biz.isSuspended ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                            সাসপেন্ড
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                            মেয়াদ শেষ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                            সক্রিয়
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/businesses/${biz._id}`}
                          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>ম্যানেজ</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
