'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../../lib/api';
import { formatBDT, formatDate } from '../../../lib/formatters';
import { useAuth } from '../../../lib/authContext';
import {
  FileText,
  PlusCircle,
  Search,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

export default function QuotationsPage() {
  const { language, t } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadQuotations = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/quotations');
      if (res.success) {
        setQuotations(res.quotations || []);
      }
    } catch (err) {
      console.error('Failed to load quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const filtered = quotations.filter((q) => {
    const s = search.toLowerCase();
    return (
      q.quotationNo?.toLowerCase().includes(s) ||
      q.partyId?.name?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-indigo-600" />
            <span>{t('quotations_title')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('quotations_subtitle')}
          </p>
        </div>

        <Link
          href="/quotations/new"
          className="inline-flex items-center gap-2 py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('create_quotation')}</span>
        </Link>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={language === 'en' ? 'Search quotation # or client name...' : 'কোটেশন নং বা পার্টির নাম খুঁজুন...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50"
          />
        </div>

        <button
          onClick={loadQuotations}
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 self-end sm:self-auto cursor-pointer"
          title={t('refresh')}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">{language === 'en' ? 'Quotation #' : 'কোটেশন নং'}</th>
                <th className="px-5 py-3.5">{t('date')}</th>
                <th className="px-5 py-3.5">{language === 'en' ? 'Customer / Client' : 'খরিদ্দার / কাস্টমার'}</th>
                <th className="px-5 py-3.5 text-right font-black">{language === 'en' ? 'Quoted Amount' : 'মোট টাকার প্রস্তাব'}</th>
                <th className="px-5 py-3.5 text-center">{t('status')}</th>
                <th className="px-5 py-3.5 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">{t('loading')}</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-xs">
                    {language === 'en' ? 'No quotations found.' : 'কোনো কোটেশন পাওয়া যায়নি।'}
                  </td>
                </tr>
              ) : (
                filtered.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-indigo-700">
                      {q.quotationNo}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-slate-600">
                      {formatDate(q.date, language)}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {q.partyId?.name || (language === 'en' ? 'Customer' : 'খরিদ্দার')}
                    </td>
                    <td className="px-5 py-4 text-right font-black text-slate-900">
                      {formatBDT(q.totalAmount, language)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          q.status === 'converted'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {q.status === 'converted'
                          ? (language === 'en' ? 'Converted to Invoice' : 'চালানে রূপান্তরিত')
                          : (language === 'en' ? 'Proposed' : 'প্রস্তাবিত')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Link
                        href={`/quotations/${q._id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all shadow-xs"
                      >
                        <span>{language === 'en' ? 'View & Convert' : 'ভিউ ও চালান রূপান্তর'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
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
