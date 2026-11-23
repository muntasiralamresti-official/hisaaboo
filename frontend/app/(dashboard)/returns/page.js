'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../../lib/api';
import { formatBDT, formatDate } from '../../../lib/formatters';
import { useAuth } from '../../../lib/authContext';
import {
  RotateCcw,
  PlusCircle,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

export default function ReturnsPage() {
  const { language, t } = useAuth();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  const loadReturns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      const res = await fetchApi(`/returns?${params.toString()}`);
      if (res.success) {
        setReturns(res.returns || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, [typeFilter]);

  const getReasonLabel = (reason) => {
    switch (reason) {
      case 'damage':
        return language === 'en' ? 'Damaged Goods' : 'ত্রুটিপূর্ণ / ড্যামেজ';
      case 'count_mismatch':
        return language === 'en' ? 'Specification Mismatch' : 'কাউন্ট / স্পেক অমিল';
      case 'quality':
        return language === 'en' ? 'Quality Issue' : 'মানসম্মত নয়';
      case 'expired':
        return language === 'en' ? 'Expired' : 'মেয়াদোত্তীর্ণ';
      default:
        return reason || (language === 'en' ? 'Standard return' : 'সাধারণ ফেরত');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <RotateCcw className="w-7 h-7 text-rose-600" />
            <span>{t('returns_title')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('returns_subtitle')}
          </p>
        </div>

        <Link
          href="/returns/new"
          className="inline-flex items-center gap-2 py-3 px-5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('record_return')}</span>
        </Link>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 text-xs font-bold">
          <button
            onClick={() => setTypeFilter('all')}
            className={`py-2 px-3.5 rounded-lg transition-all cursor-pointer ${
              typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            {language === 'en' ? 'All Returns' : 'সকল ফেরত'}
          </button>
          <button
            onClick={() => setTypeFilter('sale_return')}
            className={`py-2 px-3.5 rounded-lg transition-all cursor-pointer ${
              typeFilter === 'sale_return' ? 'bg-white text-rose-800 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            {language === 'en' ? 'Sales Return (Customer)' : 'বিক্রয় ফেরত (কাস্টমার)'}
          </button>
          <button
            onClick={() => setTypeFilter('purchase_return')}
            className={`py-2 px-3.5 rounded-lg transition-all cursor-pointer ${
              typeFilter === 'purchase_return' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            {language === 'en' ? 'Purchase Return (Supplier)' : 'ক্রয় ফেরত (সাপ্লায়ার)'}
          </button>
        </div>

        <button
          onClick={loadReturns}
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
                <th className="px-5 py-3.5">{language === 'en' ? 'Return #' : 'ফেরত নং'}</th>
                <th className="px-5 py-3.5">{t('date')}</th>
                <th className="px-5 py-3.5">{language === 'en' ? 'Party / Supplier' : 'পার্টি / মিলের নাম'}</th>
                <th className="px-5 py-3.5">{language === 'en' ? 'Type' : 'ধরন'}</th>
                <th className="px-5 py-3.5">{t('return_reason')}</th>
                <th className="px-5 py-3.5 text-right font-black">{language === 'en' ? 'Return Value' : 'ফেরত মূল্য'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">{t('loading')}</p>
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-xs">
                    {language === 'en' ? 'No return or damaged goods records found.' : 'কোনো ফেরত বা ড্যামেজ রেকর্ড পাওয়া যায়নি।'}
                  </td>
                </tr>
              ) : (
                returns.map((r) => {
                  const isSaleReturn = r.type === 'sale_return';
                  return (
                    <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-rose-700">
                        {r.returnNo}
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-slate-600">
                        {formatDate(r.date, language)}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {r.partyId?.name || (language === 'en' ? 'Party' : 'পার্টি')}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isSaleReturn
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isSaleReturn ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {isSaleReturn
                            ? (language === 'en' ? 'Sale Return (+Stock)' : 'বিক্রয় ফেরত (+স্টক)')
                            : (language === 'en' ? 'Purchase Return (-Stock)' : 'ক্রয় ফেরত (-স্টক)')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 capitalize">
                        {getReasonLabel(r.reason)}
                      </td>
                      <td className="px-5 py-4 text-right font-black text-slate-900">
                        {formatBDT(r.totalAmount, language)}
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
