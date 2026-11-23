'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../../lib/api';
import { formatBDT, formatDate } from '../../../lib/formatters';
import { useAuth } from '../../../lib/authContext';
import { getTemplateLabel } from '../../../lib/templates';
import {
  ShoppingBag,
  PlusCircle,
  Search,
  Calendar,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Building,
} from 'lucide-react';

export default function PurchasesPage() {
  const { business, language, t } = useAuth();
  const businessType = business?.businessType || 'general';

  const purchaseLabel = getTemplateLabel(businessType, 'purchase', language, t('nav_purchases', 'ক্রয় / মিল চালান'));
  const supplierLabel = getTemplateLabel(businessType, 'supplier', language, t('supplier', 'মহাজন / মিল'));

  const [purchases, setPurchases] = useState([]);
  const [summary, setSummary] = useState({ totalPurchaseAmount: 0, totalPaid: 0, totalDue: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetchApi(`/purchases?${params.toString()}`);
      if (res.success) {
        setPurchases(res.purchases || []);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-blue-600" />
            <span>{purchaseLabel} {language === 'en' ? 'List' : 'তালিকা'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('purchases_subtitle', 'স্পিনিং মিল বা সাপ্লায়ার থেকে মাল গ্রহণ ও ক্রয় খতিয়ান')}
          </p>
        </div>

        <Link
          href="/purchases/new"
          className="inline-flex items-center gap-2 py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{language === 'en' ? `New ${purchaseLabel} Entry` : `নতুন ${purchaseLabel} এন্ট্রি`}</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {t('total_purchase_amount', 'মোট ক্রয় মূল্য')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatBDT(summary.totalPurchaseAmount, language)}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {language === 'en' ? `Total ${summary.count} inward shipments` : `মোট ${summary.count} টি ক্রয় চালানের যোগফল`}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              {t('total_paid_to_supplier', 'পরিশোধিত টাকা')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{formatBDT(summary.totalPaid, language)}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {language === 'en' ? 'Disbursed via cash & bank transfers' : 'মহাজনকে নগদ ও ব্যাংকে পরিশোধ'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              {t('total_supplier_payable', 'মহাজন পাওনা (দেনা)')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">{formatBDT(summary.totalDue, language)}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {language === 'en' ? 'Outstanding mill liabilities' : 'মিলের অবশিষ্ট বকেয়া টাকা'}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search_purchase_placeholder', 'চালান নং বা মিলের নাম দিয়ে খুঁজুন...')}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>
          <button
            onClick={loadPurchases}
            className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            {t('search', 'খুঁজুন')}
          </button>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 text-xs">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
          />
          <span className="text-slate-400">{t('from', 'থেকে')}</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
          />
          <button
            onClick={loadPurchases}
            className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
          >
            {t('filter', 'ফিল্টার')}
          </button>
          <button
            onClick={loadPurchases}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
            title={t('refresh', 'রিফ্রেশ')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">{t('col_purchase_date', 'বিল নং ও তারিখ')}</th>
                <th className="px-5 py-3.5">{supplierLabel}</th>
                <th className="px-5 py-3.5">{t('col_item_count', 'আইটেম সংখ্যা')}</th>
                <th className="px-5 py-3.5 text-right">{t('col_total', 'মোট বিল')}</th>
                <th className="px-5 py-3.5 text-right">{t('col_paid', 'পরিশোধ')}</th>
                <th className="px-5 py-3.5 text-right">{t('col_due', 'দেনা (Due)')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">{t('loading', 'ক্রয় তালিকা লোড হচ্ছে...')}</p>
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-700">{t('no_purchases_found', 'কোনো ক্রয় চালান নেই')}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t('click_to_create_purchase', 'নতুন ক্রয় যোগ করতে উপরের বাটনে ক্লিক করুন।')}</p>
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{p.billNo}</div>
                      <div className="text-[11px] text-slate-500">{formatDate(p.date, language)}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{p.partyId?.name || t('supplier', 'সাপ্লায়ার')}</div>
                      <div className="text-[11px] text-slate-400">{p.partyId?.phone || '—'}</div>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                      {p.items?.length || 0} {t('items_count_suffix', 'টি পণ্য')}
                    </td>
                    <td className="px-5 py-4 text-right font-black text-slate-900">
                      {formatBDT(p.totalAmount, language)}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-emerald-600">
                      {formatBDT(p.paidAmount, language)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`font-black ${p.dueAmount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {formatBDT(p.dueAmount, language)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
