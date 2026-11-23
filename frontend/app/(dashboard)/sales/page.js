'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../../lib/api';
import { formatBDT, formatDate } from '../../../lib/formatters';
import { useAuth } from '../../../lib/authContext';
import { getTemplateLabel } from '../../../lib/templates';
import {
  ShoppingCart,
  PlusCircle,
  Search,
  Calendar,
  FileText,
  Printer,
  TrendingUp,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Eye,
} from 'lucide-react';

export default function SalesPage() {
  const { business, language, t } = useAuth();
  const businessType = business?.businessType || 'general';

  const saleLabel = getTemplateLabel(businessType, 'sale', language, t('nav_sales', 'চালান / মেমো'));
  const partyLabel = getTemplateLabel(businessType, 'party', language, t('nav_parties', 'পার্টি'));

  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({ totalSalesAmount: 0, totalPaid: 0, totalDue: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadSales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetchApi(`/sales?${params.toString()}`);
      if (res.success) {
        setSales(res.sales || []);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to load sales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-blue-600" />
            <span>{saleLabel} {language === 'en' ? 'List' : 'তালিকা'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('sales_subtitle', 'সকল বিক্রয় ইনভয়েস, নগদ আদায় ও বকেয়ার বিবরণ')}
          </p>
        </div>

        <Link
          href="/sales/new"
          className="inline-flex items-center gap-2 py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{language === 'en' ? `Create New ${saleLabel}` : `নতুন ${saleLabel} কাটুন`}</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {t('total_sales_amount', 'মোট বিক্রয় মূল্য')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatBDT(summary.totalSalesAmount, language)}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {language === 'en' ? `Total ${summary.count} invoices` : `মোট ${summary.count} টি চালানের যোগফল`}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              {t('cash_collected', 'নগদ ও ডিজিটাল আদায়')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{formatBDT(summary.totalPaid, language)}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {language === 'en' ? 'Direct collections received at billing' : 'চালান কাটার সময় সরাসরি প্রাপ্ত টাকা'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              {t('total_due_balance', 'মোট বকেয়া (Due)')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">{formatBDT(summary.totalDue, language)}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {language === 'en' ? 'Added to party receivable ledger' : 'কাস্টমারদের খাতায় জমা হওয়া বাকি'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search_memo_placeholder', 'মেমো নম্বর দিয়ে খুঁজুন (যেমন: INV-1001)...')}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>
          <button
            onClick={loadSales}
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
            onClick={loadSales}
            className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
          >
            {t('filter', 'ফিল্টার')}
          </button>
          <button
            onClick={loadSales}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
            title={t('refresh', 'রিফ্রেশ')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">{t('col_memo_date', 'মেমো নং ও তারিখ')}</th>
                <th className="px-5 py-3.5">{t('col_customer', 'কাস্টমার / পার্টি')}</th>
                <th className="px-5 py-3.5">{t('col_item_count', 'আইটেম সংখ্যা')}</th>
                <th className="px-5 py-3.5 text-right">{t('col_total', 'মোট টাকা')}</th>
                <th className="px-5 py-3.5 text-right">{t('col_paid', 'নগদ জমা')}</th>
                <th className="px-5 py-3.5 text-right">{t('col_due', 'বাকি (Due)')}</th>
                <th className="px-5 py-3.5 text-right">{t('col_invoice', 'ইনভয়েস')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">{t('loading', 'চালান তালিকা লোড হচ্ছে...')}</p>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-700">{t('no_sales_found', 'কোনো বিক্রয় মেমো পাওয়া যায়নি')}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t('click_to_create_sale', 'নতুন চালান কাটতে উপরের বাটনে ক্লিক করুন।')}</p>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <Link
                        href={`/sales/${sale._id}`}
                        className="font-bold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {sale.invoiceNo}
                      </Link>
                      <div className="text-[11px] text-slate-500">{formatDate(sale.date, language)}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{sale.partyId?.name || t('cash_customer', 'ক্যাশ কাস্টমার')}</div>
                      <div className="text-[11px] text-slate-400">{sale.partyId?.phone || '—'}</div>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                      {sale.items?.length || 0} {t('items_count_suffix', 'টি পণ্য')}
                    </td>
                    <td className="px-5 py-4 text-right font-black text-slate-900">
                      {formatBDT(sale.totalAmount, language)}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-emerald-600">
                      {formatBDT(sale.paidAmount, language)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`font-black ${sale.dueAmount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {formatBDT(sale.dueAmount, language)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/sales/${sale._id}`}
                        className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-xs transition-all"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                        <span>{t('print_memo', 'প্রিন্ট মেমো')}</span>
                      </Link>
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
