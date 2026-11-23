'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../../lib/api';
import { formatBDT, formatDate } from '../../../lib/formatters';
import { useAuth } from '../../../lib/authContext';
import { getTemplateExpenseCategories } from '../../../lib/templates';
import {
  Receipt,
  PlusCircle,
  Trash2,
  RefreshCw,
  Tag,
  DollarSign,
  TrendingDown,
  Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ExpensesPage() {
  const { business, language, t } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ totalExpense: 0, categoryBreakdown: {}, count: 0 });
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  const templateCategories = getTemplateExpenseCategories(business?.businessType);
  const categoryLabelMap = {};
  templateCategories.forEach((c) => {
    categoryLabelMap[c.key] = c.label?.[language] || c.label?.bn || c.label?.en;
  });

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      if (methodFilter) params.append('method', methodFilter);

      const res = await fetchApi(`/expenses?${params.toString()}`);
      if (res.success) {
        setExpenses(res.expenses || []);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [categoryFilter, methodFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm(language === 'en' ? 'Are you sure you want to delete this expense record?' : 'আপনি কি নিশ্চিতভাবে এই খরচের হিসাবটি মুছে ফেলতে চান?')) return;
    try {
      const res = await fetchApi(`/expenses/${id}`, { method: 'DELETE' });
      if (res.success) {
        loadExpenses();
      }
    } catch (err) {
      alert(language === 'en' ? 'Failed to delete expense' : 'খরচ মুছতে ব্যর্থ হয়েছে');
    }
  };

  const handleExportExcel = () => {
    if (!expenses.length) return;
    const rows = expenses.map((e) => ({
      [language === 'en' ? 'Date' : 'তারিখ']: formatDate(e.date, language),
      [language === 'en' ? 'Category' : 'খাত']: categoryLabelMap[e.category] || e.category,
      [language === 'en' ? 'Payment Method' : 'মাধ্যম']: e.paymentMethod,
      [language === 'en' ? 'Description' : 'বিবরণ']: e.description || '—',
      [language === 'en' ? 'Amount (BDT)' : 'টাকা']: e.amount,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses_Log');
    XLSX.writeFile(wb, `Expenses_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-rose-600" />
            <span>{t('expenses_title', 'অফিস ও ব্যবসায়িক খরচ')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('expenses_subtitle', 'দৈনন্দিন পরিচালন খরচ, ভাড়া, পরিবহন ও লেবার ব্যয়ের সম্পূর্ণ হিসাব')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 shadow-2xs transition-all cursor-pointer"
            title="এক্সেল ডাউনলোড"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>{language === 'en' ? 'Export Excel' : 'এক্সেল এক্সপোর্ট'}</span>
          </button>

          <Link
            href="/expenses/new"
            className="inline-flex items-center gap-2 py-3 px-5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{language === 'en' ? 'Record New Expense' : 'নতুন খরচ এন্ট্রি'}</span>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              {language === 'en' ? 'Total Expenses' : 'মোট খরচ'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">{formatBDT(summary.totalExpense, language)}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {language === 'en' ? 'Total expenditure in period' : 'নির্বাচিত খাতের মোট ব্যয়'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              {language === 'en' ? 'Vouchers Count' : 'ভাউচার সংখ্যা'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{summary.count} {language === 'en' ? 'Entries' : 'টি'}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {language === 'en' ? 'Total recorded vouchers' : 'মোট খরচ রেকর্ড'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              {language === 'en' ? 'Top Expense Category' : 'শীর্ষ খরচের খাত'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-800 truncate">
            {Object.keys(summary.categoryBreakdown || {}).length > 0
              ? categoryLabelMap[
                  Object.entries(summary.categoryBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0]
                ] ||
                Object.entries(summary.categoryBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0]
              : (language === 'en' ? 'No Data' : 'তথ্য নেই')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {language === 'en' ? 'Highest spending category' : 'সবচেয়ে বেশি ব্যয়িত খাত'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700"
          >
            <option value="">{language === 'en' ? 'All Expense Categories' : 'সকল খরচের খাত'}</option>
            {templateCategories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label?.[language] || c.label?.bn || c.label?.en}
              </option>
            ))}
          </select>

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
        </div>

        <button
          onClick={loadExpenses}
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors self-end sm:self-auto cursor-pointer"
          title={t('refresh', 'রিফ্রেশ')}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">{t('date', 'তারিখ')}</th>
                <th className="px-5 py-3.5">{language === 'en' ? 'Category' : 'খরচের খাত'}</th>
                <th className="px-5 py-3.5">{language === 'en' ? 'Method' : 'পেমেন্ট মাধ্যম'}</th>
                <th className="px-5 py-3.5">{t('notes', 'নোট / বিবরণ')}</th>
                <th className="px-5 py-3.5 text-right font-black">{t('amount', 'পরিমাণ')}</th>
                <th className="px-5 py-3.5 text-center">{t('actions', 'অ্যাকশন')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">{t('loading', 'খরচ তালিকা লোড হচ্ছে...')}</p>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    {language === 'en' ? 'No expense records found.' : 'কোনো খরচের রেকর্ড পাওয়া যায়নি।'}
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 text-xs font-mono text-slate-600">
                      {formatDate(e.date, language)}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-100 text-slate-800 font-bold">
                        <Tag className="w-3 h-3 text-slate-500" />
                        {categoryLabelMap[e.category] || e.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 uppercase text-xs font-bold text-slate-700">
                      {e.paymentMethod}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      {e.note || '—'}
                    </td>
                    <td className="px-5 py-4 text-right font-black text-sm text-rose-600">
                      {formatBDT(e.amount, language)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleDelete(e._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title={t('delete', 'মুছে ফেলুন')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
