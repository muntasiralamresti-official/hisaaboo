'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../../lib/api';
import { formatBDT, formatDate } from '../../../lib/formatters';
import {
  Building2,
  PlusCircle,
  Search,
  Filter,
  Sliders,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetchApi(`/admin/businesses?${params.toString()}`);
      if (res.success) {
        setBusinesses(res.businesses);
      }
    } catch (err) {
      console.error('Failed to load businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [typeFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBusinesses();
  };

  const toggleStatus = async (biz) => {
    const newSuspended = !biz.isSuspended;
    const confirmMsg = newSuspended
      ? `আপনি কি নিশ্চিত যে "${biz.name}" ব্যবসাটি সাময়িকভাবে সাসপেন্ড করতে চান? ওনার লগইন বা চালান তৈরি করতে পারবে না।`
      : `আপনি কি "${biz.name}" ব্যবসাটি পুনরায় সক্রিয় করতে চান?`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(biz._id);
    try {
      const res = await fetchApi(`/admin/businesses/${biz._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isSuspended: newSuspended }),
      });

      if (res.success) {
        setBusinesses((prev) =>
          prev.map((b) => (b._id === biz._id ? { ...b, isSuspended: newSuspended } : b))
        );
      }
    } catch (err) {
      alert(err.message || 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            সকল ক্লায়েন্ট ব্যবসা
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Hisaaboo প্ল্যাটফর্মে রেজিস্টার্ড সব ব্যবসা প্রতিষ্ঠান পরিচালনা করুন
          </p>
        </div>

        <Link
          href="/admin/businesses/new"
          className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>নতুন ব্যবসা যোগ করুন</span>
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ব্যবসার নাম, মালিক বা মোবাইল দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </form>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Business Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">সব ধরনের ব্যবসা</option>
            <option value="yarn">সুতা ব্যবসা (Yarn)</option>
            <option value="general">সাধারণ ব্যবসা (General)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">সব স্ট্যাটাস</option>
            <option value="active">সক্রিয় (Active)</option>
            <option value="expired">মেয়াদোত্তীর্ণ (Expired)</option>
            <option value="suspended">সাসপেন্ড (Suspended)</option>
          </select>

          <button
            onClick={fetchBusinesses}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
            title="রিফ্রেশ"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">ব্যবসার নাম ও ঠিকানা</th>
                <th className="px-5 py-3.5">টাইপ</th>
                <th className="px-5 py-3.5">মালিক ও মোবাইল</th>
                <th className="px-5 py-3.5">মেয়াদ (Paid Until)</th>
                <th className="px-5 py-3.5">বাৎসরিক ফি</th>
                <th className="px-5 py-3.5">স্ট্যাটাস</th>
                <th className="px-5 py-3.5 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <p>ব্যবসার তথ্য লোড হচ্ছে...</p>
                  </td>
                </tr>
              ) : businesses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
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
                        <button
                          onClick={() => toggleStatus(biz)}
                          disabled={actionLoading === biz._id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                            biz.isSuspended
                              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              : isExpired
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title="ক্লিক করে স্ট্যাটাস পরিবর্তন করুন"
                        >
                          {biz.isSuspended ? (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-slate-400" />
                              <span>সাসপেন্ড</span>
                            </>
                          ) : isExpired ? (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                              <span>মেয়াদ শেষ</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              <span>সক্রিয়</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/businesses/${biz._id}`}
                          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>ডিটেইলস ও রিনিউ</span>
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
