'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../../lib/api';
import { formatBDT, formatDate } from '../../../lib/formatters';
import { useAuth } from '../../../lib/authContext';
import {
  CreditCard,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Search,
  Calendar,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

export default function PaymentsPage() {
  const { business, language, t } = useAuth();
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ totalReceived: 0, totalPaid: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all'); // all, received, paid
  const [methodFilter, setMethodFilter] = useState('');

  const loadPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (methodFilter) params.append('method', methodFilter);

      const res = await fetchApi(`/payments?${params.toString()}`);
      if (res.success) {
        setPayments(res.payments || []);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [typeFilter, methodFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-blue-600" />
            <span>{t('payments_title', 'লেনদেন ও পেমেন্ট খাতা')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('payments_subtitle', 'কাস্টমারদের থেকে বাকি আদায় এবং মহাজনদের পাওনা পরিশোধের বিবরণ')}
          </p>
        </div>

        <Link
          href="/payments/new"
          className="inline-flex items-center gap-2 py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{language === 'en' ? 'Record New Payment / Receipt' : 'টাকা জমা / পরিশোধ এন্ট্রি'}</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              {language === 'en' ? 'Total Collections (In)' : 'মোট টাকা জমা (আদায়)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{formatBDT(summary.totalReceived, language)}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {language === 'en' ? 'Customer dues collected' : 'কাস্টমার বাকি কালেকশন'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              {language === 'en' ? 'Total Disbursements (Out)' : 'মোট টাকা পরিশোধ'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">{formatBDT(summary.totalPaid, language)}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {language === 'en' ? 'Payments to mills & suppliers' : 'মহাজন ও সাপ্লায়ারদের পেমেন্ট'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {language === 'en' ? 'Total Transactions' : 'মোট লেনদেন সংখ্যা'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{summary.count} {language === 'en' ? 'Entries' : 'টি'}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {language === 'en' ? 'Cash, bKash & Bank vouchers' : 'ক্যাশ, বিকাশ ও ব্যাংক ভাউচার'}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 text-xs font-bold">
          <button
            onClick={() => setTypeFilter('all')}
            className={`py-2 px-3.5 rounded-lg transition-all cursor-pointer ${
              typeFilter === 'all' ? 'bg-white text-blue-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            {language === 'en' ? 'All Transactions' : 'সকল লেনদেন'}
          </button>
          <button
            onClick={() => setTypeFilter('received')}
            className={`py-2 px-3.5 rounded-lg transition-all cursor-pointer ${
              typeFilter === 'received' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            {language === 'en' ? 'Received (In)' : 'টাকা জমা (আদায়)'}
          </button>
          <button
            onClick={() => setTypeFilter('paid')}
            className={`py-2 px-3.5 rounded-lg transition-all cursor-pointer ${
              typeFilter === 'paid' ? 'bg-white text-rose-800 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            {language === 'en' ? 'Paid (Out)' : 'টাকা পরিশোধ'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700"
          >
            <option value="">{language === 'en' ? 'All Payment Methods' : 'সব পেমেন্ট মাধ্যম'}</option>
            <option value="cash">{language === 'en' ? 'Cash' : 'ক্যাশ (Cash)'}</option>
            <option value="bKash">{language === 'en' ? 'bKash' : 'বিকাশ (bKash)'}</option>
            <option value="Nagad">{language === 'en' ? 'Nagad' : 'নগদ (Nagad)'}</option>
            <option value="bank">{language === 'en' ? 'Bank' : 'ব্যাংক'}</option>
          </select>
          <button
            onClick={loadPayments}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
            title={t('refresh', 'রিফ্রেশ')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">{t('date', 'তারিখ')}</th>
                <th className="px-5 py-3.5">{language === 'en' ? 'Party / Customer' : 'পার্টি / গ্রাহক'}</th>
                <th className="px-5 py-3.5">{language === 'en' ? 'Type' : 'ধরন'}</th>
                <th className="px-5 py-3.5">{language === 'en' ? 'Method' : 'মাধ্যম'}</th>
                <th className="px-5 py-3.5">{t('notes', 'বিবরণ / নোট')}</th>
                <th className="px-5 py-3.5 text-right font-black">{t('amount', 'টাকার পরিমাণ')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">{t('loading', 'পেমেন্ট তালিকা লোড হচ্ছে...')}</p>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    {language === 'en' ? 'No payment records found.' : 'কোনো লেনদেন পাওয়া যায়নি।'}
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isReceived = p.type === 'received';
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 text-xs font-mono text-slate-600">
                        {formatDate(p.date, language)}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {p.partyId ? (
                          <Link href={`/parties/${p.partyId._id}`} className="hover:text-blue-600 underline">
                            {p.partyId.name}
                          </Link>
                        ) : (
                          language === 'en' ? 'Direct / Cash' : 'সরাসরি / ক্যাশ'
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isReceived
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isReceived
                            ? (language === 'en' ? 'Received (+)' : 'টাকা জমা (+)')
                            : (language === 'en' ? 'Paid (-)' : 'পরিশোধ (-)')}
                        </span>
                      </td>
                      <td className="px-5 py-4 uppercase text-xs font-bold text-slate-700">
                        {p.method}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600">
                        {p.notes || '—'}
                      </td>
                      <td className="px-5 py-4 text-right font-black text-sm">
                        <span className={isReceived ? 'text-emerald-700' : 'text-rose-700'}>
                          {isReceived ? '+ ' : '- '}
                          {formatBDT(p.amount, language)}
                        </span>
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
