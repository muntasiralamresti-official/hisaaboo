'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../../lib/api';
import { formatBDT, formatDate } from '../../../lib/formatters';
import { useAuth } from '../../../lib/authContext';
import {
  BookOpen,
  Calendar,
  RefreshCw,
  Printer,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Building,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';

export default function CashBookPage() {
  const { business, language, t } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCashbook = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/payments/cashbook?date=${date}`);
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load cashbook:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCashbook();
  }, [date]);

  // Combine and sort day transactions chronologically
  const dayTransactions = [];
  if (data?.transactions) {
    (data.transactions.payments || []).forEach((p) => {
      dayTransactions.push({
        id: p._id,
        time: p.date,
        type: p.type === 'received' ? 'payment_in' : 'payment_out',
        title: p.partyId?.name || (p.type === 'received'
          ? (language === 'en' ? 'Direct Collection (In)' : 'সরাসরি জমা')
          : (language === 'en' ? 'Direct Payment (Out)' : 'সরাসরি পরিশোধ')),
        method: p.method,
        note: p.notes,
        inAmount: p.type === 'received' ? p.amount : 0,
        outAmount: p.type === 'paid' ? p.amount : 0,
      });
    });

    (data.transactions.expenses || []).forEach((e) => {
      dayTransactions.push({
        id: e._id,
        time: e.date,
        type: 'expense',
        title: language === 'en' ? `Expense: ${e.category}` : `খরচ: ${e.category}`,
        method: e.paymentMethod || 'cash',
        note: e.note,
        inAmount: 0,
        outAmount: e.amount,
      });
    });

    dayTransactions.sort((a, b) => new Date(a.time) - new Date(b.time));
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            <span>{t('cashbook_title', 'দৈনিক ক্যাশ বুক / রোজনামচা')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('cashbook_subtitle', 'দৈনিক নগদ ক্যাশ, বিকাশ ও ব্যাংক জমার হিসাব ও সমাপনী উদ্বৃত্ত')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={loadCashbook}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-xs transition-colors cursor-pointer"
            title={t('refresh', 'রিফ্রেশ')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t('print', 'প্রিন্ট')}</span>
          </button>
        </div>
      </div>

      {/* Printable Header (Visible only in print) */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h2 className="text-2xl font-black text-slate-900">{business?.name || (language === 'en' ? 'Business Enterprise' : 'ব্যবসায়িক প্রতিষ্ঠান')}</h2>
        <p className="text-xs text-slate-600">{business?.address || ''} {business?.phone ? `| ${language === 'en' ? 'Phone' : 'ফোন'}: ${business.phone}` : ''}</p>
        <p className="text-sm font-bold mt-2 underline">
          {language === 'en' ? 'Daily Daybook / Cash Statement' : 'দৈনিক রোজনামচা / ক্যাশ স্টেটমেন্ট'} - {formatDate(date, language)}
        </p>
      </div>

      {/* 4 Balances Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Opening Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            {t('opening_balance', 'প্রারম্ভিক ক্যাশ (সকালের শুরু)')}
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-800">
            {formatBDT(data?.openingBalance || 0, language)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {language === 'en' ? 'Brought forward from previous day' : 'পূর্বের দিনের অবশিষ্ট টাকা'}
          </p>
        </div>

        {/* Today In */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1 flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>{t('cash_in', 'আজকের মোট জমা (+)')}</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600">
            {formatBDT(data?.todayIn || 0, language)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {language === 'en' ? 'Collections & cash received' : 'কাস্টমার বাকি কালেকশন ও জমা'}
          </p>
        </div>

        {/* Today Out */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{t('cash_out', 'আজকের মোট খরচ ও পরিশোধ (-)')}</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600">
            {formatBDT(data?.todayOut || 0, language)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {language === 'en' ? 'Supplier disbursements & expenses' : 'মহাজন পেমেন্ট ও অফিস ব্যয়'}
          </p>
        </div>

        {/* Closing Balance */}
        <div className="bg-indigo-50/70 p-5 rounded-2xl border border-indigo-200/80 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-1">
            {t('closing_balance', 'সমাপনী উদ্বৃত্ত (হাতে থাকা ক্যাশ)')}
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-900">
            {formatBDT(data?.closingBalance || 0, language)}
          </div>
          <p className="text-[11px] text-indigo-600/80 mt-1">
            {language === 'en' ? 'Cash in hand at end of day' : 'দিনের শেষে মোট অবশিষ্ট ক্যাশ'}
          </p>
        </div>
      </div>

      {/* Account Balances Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold">{language === 'en' ? 'Cash in Hand (Drawer)' : 'নগদ ক্যাশ (Cash)'}</div>
            <div className="text-sm font-black text-slate-800">
              {language === 'en' ? 'In: ' : 'জমা: '}
              <span className="text-emerald-600">+{formatBDT(data?.methodBreakdown?.cash?.in || 0, language)}</span>
              {' | '}
              {language === 'en' ? 'Out: ' : 'খরচ: '}
              <span className="text-rose-600">-{formatBDT(data?.methodBreakdown?.cash?.out || 0, language)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold">{language === 'en' ? 'bKash / Nagad / MFS' : 'বিকাশ / নগদ (MFS)'}</div>
            <div className="text-sm font-black text-slate-800">
              {language === 'en' ? 'In: ' : 'জমা: '}
              <span className="text-emerald-600">+{formatBDT((data?.methodBreakdown?.bKash?.in || 0) + (data?.methodBreakdown?.Nagad?.in || 0), language)}</span>
              {' | '}
              {language === 'en' ? 'Out: ' : 'খরচ: '}
              <span className="text-rose-600">-{formatBDT((data?.methodBreakdown?.bKash?.out || 0) + (data?.methodBreakdown?.Nagad?.out || 0), language)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold">{language === 'en' ? 'Bank Accounts' : 'ব্যাংক হিসাব (Bank)'}</div>
            <div className="text-sm font-black text-slate-800">
              {language === 'en' ? 'In: ' : 'জমা: '}
              <span className="text-emerald-600">+{formatBDT(data?.methodBreakdown?.bank?.in || 0, language)}</span>
              {' | '}
              {language === 'en' ? 'Out: ' : 'খরচ: '}
              <span className="text-rose-600">-{formatBDT(data?.methodBreakdown?.bank?.out || 0, language)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>{language === 'en' ? 'Day Transaction Receipts & Expense Entries' : 'দিনের সকল জমার রশিদ ও খরচের হিসাব'}</span>
            <span className="text-xs font-normal text-slate-400">
              ({dayTransactions.length} {language === 'en' ? 'Vouchers' : 'টি ভাউচার'})
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">{language === 'en' ? 'Time / Date' : 'সময় / তারিখ'}</th>
                <th className="px-5 py-3.5">{language === 'en' ? 'Description / Account' : 'বিবরণ / পার্টি / খাত'}</th>
                <th className="px-5 py-3.5">{language === 'en' ? 'Payment Method' : 'অ্যাকাউন্ট'}</th>
                <th className="px-5 py-3.5">{t('notes', 'নোট')}</th>
                <th className="px-5 py-3.5 text-right text-emerald-600 font-black">
                  {language === 'en' ? 'Cash In (+)' : 'টাকা জমা (+)'}
                </th>
                <th className="px-5 py-3.5 text-right text-rose-600 font-black">
                  {language === 'en' ? 'Cash Out (-)' : 'টাকা খরচ / প্রদান (-)'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">{t('loading', 'রোজনামচা হিসাব লোড হচ্ছে...')}</p>
                  </td>
                </tr>
              ) : dayTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    {language === 'en' ? 'No transactions recorded on this date.' : 'এই তারিখে কোনো টাকা জমা বা খরচের লেনদেন নেই।'}
                  </td>
                </tr>
              ) : (
                dayTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 text-xs font-mono text-slate-600">
                      {new Date(tx.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            tx.type === 'payment_in'
                              ? 'bg-emerald-500'
                              : tx.type === 'payment_out'
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        <span>{tx.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 uppercase text-xs font-bold text-slate-600">
                      {tx.method}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {tx.note || '—'}
                    </td>
                    <td className="px-5 py-4 text-right font-black text-sm text-emerald-600">
                      {tx.inAmount > 0 ? `+ ${formatBDT(tx.inAmount, language)}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-right font-black text-sm text-rose-600">
                      {tx.outAmount > 0 ? `- ${formatBDT(tx.outAmount, language)}` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {dayTransactions.length > 0 && (
              <tfoot className="bg-slate-50 font-black text-sm border-t border-slate-200">
                <tr>
                  <td colSpan={4} className="px-5 py-3.5 text-right uppercase text-xs text-slate-600">
                    {language === 'en' ? 'Day Total:' : 'দিনের মোট সর্বমোট:'}
                  </td>
                  <td className="px-5 py-3.5 text-right text-emerald-700">
                    + {formatBDT(data?.todayIn || 0, language)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-rose-700">
                    - {formatBDT(data?.todayOut || 0, language)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
