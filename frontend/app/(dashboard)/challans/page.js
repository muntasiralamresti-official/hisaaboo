'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../../lib/api';
import { formatDate } from '../../../lib/formatters';
import { useAuth } from '../../../lib/authContext';
import {
  Truck,
  Printer,
  Search,
  RefreshCw,
  Calendar,
  Building,
  Package,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function ChallansHubPage() {
  const { business, language, t } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadChallans = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/sales?limit=100');
      if (res.success) {
        setSales(res.sales || []);
      }
    } catch (err) {
      console.error('Failed to load challans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallans();
  }, []);

  const filteredSales = sales.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.invoiceNo?.toLowerCase().includes(q) ||
      s.partyId?.name?.toLowerCase().includes(q) ||
      s.partyId?.address?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-indigo-600" />
            <span>{language === 'en' ? 'Delivery Challans & Gate Pass Hub' : 'ডেলিভারি চালান ও গেট পাস হাব'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'en'
              ? 'Warehouse dispatch, vehicle carriage copies and security gate pass registry'
              : 'গোডাউন থেকে মাল লোডিং, পরিবহন ট্রাক কপি এবং সিকিউরিটি গেট পাসের কেন্দ্রীয় তালিকা'}
          </p>
        </div>

        <Link
          href="/sales/new"
          className="inline-flex items-center gap-2 py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Truck className="w-4 h-4" />
          <span>{language === 'en' ? 'New Delivery Challan' : 'নতুন চালান কাটুন'}</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={language === 'en' ? 'Search by challan # or customer...' : 'চালান নং বা পার্টির নাম খুঁজুন...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50"
          />
        </div>

        <button
          onClick={loadChallans}
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 self-end sm:self-auto cursor-pointer"
          title={t('refresh', 'রিফ্রেশ')}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Challans Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">{t('invoice_no', 'চালান নং')}</th>
                <th className="px-5 py-3.5">{t('date', 'তারিখ')}</th>
                <th className="px-5 py-3.5">{t('customer', 'খরিদ্দার / পার্টি')}</th>
                <th className="px-5 py-3.5">{t('address', 'গন্তব্য / ঠিকানা')}</th>
                <th className="px-5 py-3.5 text-center">{language === 'en' ? 'Quantity / Bags' : 'মোট বস্তা / পরিমাণ'}</th>
                <th className="px-5 py-3.5 text-center">{t('gate_pass', 'গেট পাস প্রিন্ট')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">{t('loading', 'চালান লোড হচ্ছে...')}</p>
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    {language === 'en' ? 'No delivery challans found.' : 'কোনো চালান পাওয়া যায়নি।'}
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => {
                  const totalBags = s.items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
                  return (
                    <tr key={s._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-indigo-700">
                        {s.invoiceNo}
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-slate-600">
                        {formatDate(s.date, language)}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {s.partyId?.name || (language === 'en' ? 'Cash Customer' : 'ক্যাশ কাস্টমার')}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600">
                        {s.partyId?.address || '—'}
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-slate-900">
                        <span className="inline-flex px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-black">
                          {totalBags} {s.items?.[0]?.unit || (language === 'en' ? 'Bag' : 'বস্তা')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Link
                          href={`/sales/${s._id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? 'Print Gate Pass' : 'গেট পাস প্রিন্ট'}</span>
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
