'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../../lib/api';
import { formatBDT } from '../../../lib/formatters';
import { useAuth } from '../../../lib/authContext';
import { getTemplateLabel } from '../../../lib/templates';
import {
  Users,
  PlusCircle,
  Search,
  Phone,
  MapPin,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  BookOpen,
  Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function PartiesPage() {
  const { business, language, t } = useAuth();
  const businessType = business?.businessType || 'general';

  const [parties, setParties] = useState([]);
  const [summary, setSummary] = useState({ totalReceivable: 0, totalPayable: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeTab, setTypeTab] = useState('all'); // all, customer, supplier

  // Dynamic template labels
  const partyLabel = getTemplateLabel(businessType, 'party', language, t('nav_parties', 'পার্টি'));
  const customerLabel = getTemplateLabel(businessType, 'customer', language, t('customer', 'কাস্টমার'));
  const supplierLabel = getTemplateLabel(businessType, 'supplier', language, t('supplier', 'মহাজন / সাপ্লায়ার'));

  const loadParties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeTab !== 'all') params.append('type', typeTab);

      const res = await fetchApi(`/parties?${params.toString()}`);
      if (res.success) {
        setParties(res.parties || []);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to load parties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParties();
  }, [typeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadParties();
  };

  const handleExportExcel = () => {
    if (!parties.length) return;
    const rows = parties.map((p) => ({
      [language === 'en' ? 'Name' : 'নাম']: p.name,
      [language === 'en' ? 'Type' : 'ধরন']: p.type,
      [language === 'en' ? 'Phone' : 'ফোন']: p.phone || '—',
      [language === 'en' ? 'Address' : 'ঠিকানা']: p.address || '—',
      [language === 'en' ? 'Current Balance' : 'বর্তমান জের']: p.currentBalance || 0,
      [language === 'en' ? 'Status' : 'অবস্থা']:
        (p.currentBalance || 0) > 0
          ? (language === 'en' ? 'Receivable (Due)' : 'বাকি (পাওনা)')
          : (p.currentBalance || 0) < 0
          ? (language === 'en' ? 'Payable' : 'দেনা')
          : (language === 'en' ? 'Settled' : 'পরিশোধ'),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Parties_Directory');
    XLSX.writeFile(wb, `Parties_List_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-blue-600" />
            <span>{partyLabel} {language === 'en' ? 'Ledger & Directory' : 'তালিকা ও খাতা'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('parties_subtitle', 'খরিদ্দার, সাপ্লায়ার ও মহাজনদের দেনা-পাওনা খতিয়ান')}
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
            href="/parties/new"
            className="inline-flex items-center gap-2 py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{language === 'en' ? `Add New ${partyLabel}` : `নতুন ${partyLabel} যোগ করুন`}</span>
          </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Receivable */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              {t('total_receivable', 'মোট বাকি (দেনাদার খাতা)')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">
            {formatBDT(summary.totalReceivable, language)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {language === 'en' ? 'Total receivables from customer accounts' : 'বাজার থেকে আপনার মোট পাওনা টাকা'}
          </p>
        </div>

        {/* Total Payable */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              {t('total_payable', 'মহাজন পাওনা (দেনা খাতা)')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatBDT(summary.totalPayable, language)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {language === 'en' ? 'Total payables due to mills and suppliers' : 'মিল বা সাপ্লায়ারকে পরিশোধযোগ্য দেনা'}
          </p>
        </div>

        {/* Total Parties Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {language === 'en' ? 'Total Accounts' : 'মোট খাতা সংখ্যা'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {parties.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {language === 'en' ? 'Active registered customers & suppliers' : 'মোট রেজিস্টার্ড কাস্টমার ও মহাজন'}
          </p>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Type Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 text-xs font-bold">
          <button
            onClick={() => setTypeTab('all')}
            className={`py-2 px-3.5 rounded-lg transition-all cursor-pointer ${
              typeTab === 'all'
                ? 'bg-white text-blue-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'en' ? `All Parties (${parties.length})` : `সকল পার্টি (${parties.length})`}
          </button>
          <button
            onClick={() => setTypeTab('customer')}
            className={`py-2 px-3.5 rounded-lg transition-all cursor-pointer ${
              typeTab === 'customer'
                ? 'bg-white text-blue-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {customerLabel}
          </button>
          <button
            onClick={() => setTypeTab('supplier')}
            className={`py-2 px-3.5 rounded-lg transition-all cursor-pointer ${
              typeTab === 'supplier'
                ? 'bg-white text-blue-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {supplierLabel}
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search_party_placeholder', 'পার্টির নাম বা ফোন দিয়ে খুঁজুন...')}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            {t('search', 'খুঁজুন')}
          </button>
          <button
            type="button"
            onClick={loadParties}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
            title={t('refresh', 'রিফ্রেশ')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      {/* Parties List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">{t('col_party_name', 'পার্টির নাম ও বিবরণ')}</th>
                <th className="px-5 py-3.5">{t('col_party_type', 'ধরন')}</th>
                <th className="px-5 py-3.5">{t('phone', 'মোবাইল নম্বর')}</th>
                <th className="px-5 py-3.5 text-right">{t('col_current_balance', 'বর্তমান ব্যালেন্স')}</th>
                <th className="px-5 py-3.5 text-right">{language === 'en' ? 'Ledger Book' : 'লেজার খাতা'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">{t('loading', 'পার্টি তালিকা লোড হচ্ছে...')}</p>
                  </td>
                </tr>
              ) : parties.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-700">{t('no_parties_found', 'কোনো পার্টি পাওয়া যায়নি')}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {language === 'en' ? 'Click the button above to add a new account.' : 'নতুন কাস্টমার বা মহাজন যুক্ত করতে উপরের বাটনে ক্লিক করুন।'}
                    </p>
                  </td>
                </tr>
              ) : (
                parties.map((p) => {
                  const bal = p.currentBalance || 0;
                  const isDue = bal > 0; // Customer owes money
                  const isPayable = bal < 0; // We owe supplier money
                  const isClear = bal === 0;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <Link
                          href={`/parties/${p._id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {p.name}
                        </Link>
                        {p.address && (
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{p.address}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            p.type === 'supplier'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : p.type === 'both'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {p.type === 'supplier'
                            ? supplierLabel.split('/')[0].trim()
                            : p.type === 'both'
                            ? (language === 'en' ? 'Both' : 'উভয়')
                            : customerLabel.split('/')[0].trim()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {p.phone ? (
                          <a
                            href={`tel:${p.phone}`}
                            className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-blue-600 font-medium"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{p.phone}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div
                          className={`font-black text-sm ${
                            isDue
                              ? 'text-rose-600'
                              : isPayable
                              ? 'text-amber-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {formatBDT(Math.abs(bal), language)}
                        </div>
                        <div className="text-[10px] font-semibold mt-0.5">
                          {isDue ? (
                            <span className="text-rose-600 font-bold">
                              {language === 'en' ? 'Receivable (Due)' : 'বাকি পাবে (দেনাদার)'}
                            </span>
                          ) : isPayable ? (
                            <span className="text-amber-600 font-bold">
                              {language === 'en' ? 'Payable' : 'পাওনাদার'}
                            </span>
                          ) : (
                            <span className="text-emerald-600">
                              {language === 'en' ? 'Settled (Zero)' : 'হিসাব পরিশোধ'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/parties/${p._id}`}
                          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-xs"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                          <span>{language === 'en' ? 'View Ledger' : 'খাতা দেখুন'}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
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
