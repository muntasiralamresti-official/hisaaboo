'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../../lib/api';
import { formatBDT, formatDate } from '../../../lib/formatters';
import { useAuth } from '../../../lib/authContext';
import * as XLSX from 'xlsx';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Layers,
  Users,
  Package,
  Receipt,
  FileSpreadsheet,
  MessageCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export default function ReportsPage() {
  const { business, language, t } = useAuth();
  const [activeTab, setActiveTab] = useState('profit-loss'); // 'profit-loss', 'sales', 'stock', 'due', 'aging'

  // Date filters (defaults to current month)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(true);
  const [profitLossData, setProfitLossData] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [salesList, setSalesList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [partiesList, setPartiesList] = useState([]);
  const [agingData, setAgingData] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plRes, dbRes, salesRes, prodRes, partyRes, agingRes] = await Promise.all([
        fetchApi(`/reports/profit-loss?startDate=${startDate}&endDate=${endDate}`),
        fetchApi('/reports/dashboard'),
        fetchApi(`/sales?limit=100`),
        fetchApi('/products'),
        fetchApi('/parties'),
        fetchApi('/reports/due-aging'),
      ]);

      if (plRes.success) setProfitLossData(plRes.summary);
      if (dbRes.success) setDashboardStats(dbRes.stats);
      if (salesRes.success) setSalesList(salesRes.sales || []);
      if (prodRes.success) setProductList(prodRes.products || []);
      if (partyRes.success) setPartiesList(partyRes.parties || []);
      if (agingRes.success) setAgingData(agingRes);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  // Export current tab to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    if (activeTab === 'profit-loss' && profitLossData) {
      const rows = [
        [language === 'en' ? 'Financial Line' : 'হিসাব বিবরণী', language === 'en' ? 'Amount (BDT ৳)' : 'টাকার পরিমাণ (BDT ৳)'],
        [language === 'en' ? 'Gross Sales Revenue' : 'মোট বিক্রয় আয় (Total Revenue)', profitLossData.totalRevenue],
        [language === 'en' ? 'Total Discounts' : 'বিক্রয় ছাড় (Discounts)', profitLossData.totalDiscount],
        [language === 'en' ? 'Cost of Goods Sold (COGS)' : 'বিক্রিত পণ্যের ক্রয়মূল্য (COGS)', profitLossData.estimatedCOGS],
        [language === 'en' ? 'Gross Profit' : 'মোট লাভ (Gross Profit)', profitLossData.grossProfit],
        [language === 'en' ? 'Operating Expenses' : 'মোট পরিচালন ব্যয় (Total Expenses)', profitLossData.totalExpenses],
        [language === 'en' ? 'Net Profit / Loss' : 'নিট লাভ / ক্ষতি (Net Profit)', profitLossData.netProfit],
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Profit_Loss');
    } else if (activeTab === 'sales') {
      const rows = salesList.map((s) => ({
        [language === 'en' ? 'Invoice #' : 'মেমো নং']: s.invoiceNumber,
        [language === 'en' ? 'Date' : 'তারিখ']: formatDate(s.date, language),
        [language === 'en' ? 'Customer' : 'পার্টি']: s.partyId?.name || (language === 'en' ? 'Cash Customer' : 'ক্যাশ কাস্টমার'),
        [language === 'en' ? 'Total' : 'সর্বমোট']: s.totalAmount,
        [language === 'en' ? 'Discount' : 'ছাড়']: s.discount,
        [language === 'en' ? 'Paid' : 'জমা']: s.paidAmount,
        [language === 'en' ? 'Due' : 'বাকি']: s.dueAmount,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Sales_Report');
    } else if (activeTab === 'stock') {
      const rows = productList.map((p) => ({
        [language === 'en' ? 'Product' : 'পণ্য']: p.name,
        [language === 'en' ? 'Unit' : 'একক']: p.unit,
        [language === 'en' ? 'Current_Stock' : 'বর্তমান_স্টক']: p.stock,
        [language === 'en' ? 'Purchase_Rate' : 'ক্রয়মূল্য']: p.purchasePrice,
        [language === 'en' ? 'Sale_Rate' : 'বিক্রয়মূল্য']: p.salePrice,
        [language === 'en' ? 'Stock_Valuation' : 'মোট_স্টক_মূল্য']: (p.stock || 0) * (p.purchasePrice || 0),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Stock_Report');
    } else if (activeTab === 'due') {
      const rows = (dashboardStats?.topDebtors || []).map((d) => ({
        [language === 'en' ? 'Customer_Name' : 'গ্রাহকের_নাম']: d.name,
        [language === 'en' ? 'Phone' : 'ফোন']: d.phone,
        [language === 'en' ? 'Outstanding_Due' : 'বাকি_টাকা']: d.due,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Customer_Due_List');
    } else if (activeTab === 'aging') {
      const rows = (agingData?.parties || []).map((p) => ({
        [language === 'en' ? 'Party' : 'পার্টি']: p.name,
        [language === 'en' ? 'Phone' : 'ফোন']: p.phone,
        [language === 'en' ? 'Total_Due' : 'মোট_বাকি']: p.totalDue,
        [language === 'en' ? '0-30_Days' : '০-৩০_দিন']: p.current,
        [language === 'en' ? '31-60_Days' : '৩১-৬০_দিন']: p.month1,
        [language === 'en' ? '61-90_Days' : '৬১-৯০_দিন']: p.month2,
        [language === 'en' ? '90+_Days' : '৯০+_দিন']: p.older,
        [language === 'en' ? 'Risk_Status' : 'ঝুঁকি_লেভেল']: p.riskLevel,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Due_Aging_Analysis');
    }

    XLSX.writeFile(wb, `hisaaboo_report_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            <span>{language === 'en' ? 'Financial Audit & Reports' : 'ব্যবসায়িক অডিট ও আর্থিক রিপোর্ট'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'en'
              ? 'Profit & loss, sales audit, customer due balances, and inventory valuation'
              : 'লাভ-ক্ষতি, বিক্রয় খতিয়ান, বাকি আদায়ের তালিকা ও স্টক ভ্যালুয়েশন'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>{t('export_excel')}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t('print')}</span>
          </button>
        </div>
      </div>

      {/* Date Filters & Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between print:hidden">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 text-xs font-bold w-full md:w-auto">
          <button
            onClick={() => setActiveTab('profit-loss')}
            className={`py-2 px-3.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'profit-loss' ? 'bg-white text-indigo-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            {language === 'en' ? 'Profit & Loss Statement' : 'লাভ-ক্ষতি বিবরণী'}
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`py-2 px-3.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'sales' ? 'bg-white text-indigo-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            {language === 'en' ? 'Sales Registry' : 'বিক্রয় রিপোর্ট'}
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`py-2 px-3.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'stock' ? 'bg-white text-indigo-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            {language === 'en' ? 'Stock Valuation' : 'স্টক ভ্যালুয়েশন'}
          </button>
          <button
            onClick={() => setActiveTab('due')}
            className={`py-2 px-3.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'due' ? 'bg-white text-indigo-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            {language === 'en' ? 'Outstanding Dues' : 'বাকি তালিকা'}
          </button>
          <button
            onClick={() => setActiveTab('aging')}
            className={`py-2 px-3.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'aging' ? 'bg-white text-indigo-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>{t('due_aging')}</span>
          </button>
        </div>

        {/* Date Inputs */}
        <div className="flex items-center gap-2 self-start md:self-auto w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent font-bold text-slate-700 focus:outline-none"
            />
            <span className="text-slate-400">{language === 'en' ? 'to' : 'হতে'}</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent font-bold text-slate-700 focus:outline-none"
            />
          </div>

          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
            title={t('refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Printable Heading */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h2 className="text-2xl font-black text-slate-900">{business?.name || (language === 'en' ? 'Business Ledger' : 'হিসাবূ ব্যবসা')}</h2>
        <p className="text-xs text-slate-600">{business?.address || ''} {business?.phone ? `| ${language === 'en' ? 'Phone: ' : 'ফোন: '}${business.phone}` : ''}</p>
        <p className="text-sm font-bold mt-2 underline">
          {activeTab === 'profit-loss' && (language === 'en' ? 'Profit & Loss Statement' : 'লাভ-ক্ষতি বিবরণী')}
          {activeTab === 'sales' && (language === 'en' ? 'Sales Registry & Audit' : 'বিক্রয় ও খতিয়ান রিপোর্ট')}
          {activeTab === 'stock' && (language === 'en' ? 'Stock Valuation & Inventory Audit' : 'পণ্যের স্টক ও মূল্যায়ন রিপোর্ট')}
          {activeTab === 'due' && (language === 'en' ? 'Customer Accounts Receivable (Dues)' : 'গ্রাহকদের মোট বাকি টাকার খতিয়ান')}
          {activeTab === 'aging' && (language === 'en' ? 'Due Aging Analysis' : 'বকেয়ার মেয়াদ (Due Aging)')}
          {' '} ({formatDate(startDate, language)} {language === 'en' ? 'to' : 'হতে'} {formatDate(endDate, language)})
        </p>
      </div>

      {/* TAB 1: PROFIT & LOSS */}
      {activeTab === 'profit-loss' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase text-slate-500">
                {language === 'en' ? 'Total Sales Revenue' : 'মোট বিক্রয় রাজস্ব'}
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {formatBDT(profitLossData?.totalRevenue || 0, language)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {language === 'en' ? 'Gross billed sales invoices' : 'সর্বমোট চালানের বিক্রয়'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase text-slate-500">
                {language === 'en' ? 'Gross Profit' : 'মোট লাভ (Gross Profit)'}
              </span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {formatBDT(profitLossData?.grossProfit || 0, language)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {language === 'en' ? 'Sales revenue minus estimated procurement COGS' : 'বিক্রয় মূল্য - আনুমানিক ক্রয় খরচ'}
              </p>
            </div>

            <div className={`p-5 rounded-2xl border shadow-xs ${
              (profitLossData?.netProfit || 0) >= 0
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/70 border-rose-200 text-rose-900'
            }`}>
              <span className="text-xs font-bold uppercase tracking-wider">
                {(profitLossData?.netProfit || 0) >= 0
                  ? (language === 'en' ? 'Net Profit' : 'নিট লাভ (Net Profit)')
                  : (language === 'en' ? 'Net Loss' : 'নিট ক্ষতি (Net Loss)')}
              </span>
              <div className="text-2xl font-black mt-1">
                {formatBDT(profitLossData?.netProfit || 0, language)}
              </div>
              <p className="text-[11px] opacity-80 mt-1">
                {language === 'en' ? 'Net bottom-line earnings after operating expenses' : 'পরিচালন ব্যয় বাদে আসল মুনাফা'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-3">
              {language === 'en' ? 'Detailed Profit & Expense Statement' : 'বিস্তারিত লাভ ও ব্যয়ের সারাংশ'}
            </h3>
            
            <div className="space-y-3 font-sans text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600 font-medium">
                  {language === 'en' ? '1. Gross Sales Revenue' : '১. মোট বিক্রয় আয় (Gross Sales Revenue)'}
                </span>
                <span className="font-bold text-slate-900">{formatBDT(profitLossData?.totalRevenue || 0, language)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 text-rose-600">
                <span className="font-medium">
                  {language === 'en' ? '2. Cost of Goods Sold (COGS)' : '২. বিক্রিত মালের ক্রয়মূল্য (Cost of Goods Sold - COGS)'}
                </span>
                <span className="font-bold">- {formatBDT(profitLossData?.estimatedCOGS || 0, language)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200 font-bold bg-slate-50 px-3 rounded-lg">
                <span className="text-slate-800">
                  {language === 'en' ? 'Gross Margin' : 'মোট বিক্রয় মুনাফা (Gross Margin)'}
                </span>
                <span className="text-emerald-700">{formatBDT(profitLossData?.grossProfit || 0, language)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 text-rose-600">
                <span className="font-medium">
                  {language === 'en' ? '3. Operating & Warehouse Expenses' : '৩. মোট পরিচালন অফিস ও গোডাউন খরচ (Operating Expenses)'}
                </span>
                <span className="font-bold">- {formatBDT(profitLossData?.totalExpenses || 0, language)}</span>
              </div>

              {profitLossData?.expenseCategoryMap && Object.keys(profitLossData.expenseCategoryMap).length > 0 && (
                <div className="pl-6 space-y-1.5 text-xs text-slate-500 py-1">
                  {Object.entries(profitLossData.expenseCategoryMap).map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between">
                      <span>• {cat}:</span>
                      <span>{formatBDT(amt, language)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between py-3 font-black text-base bg-indigo-50/70 border border-indigo-100 px-4 rounded-xl text-indigo-950">
                <span>{language === 'en' ? 'Final Net Profit' : 'চূড়ান্ত নিট লাভ / মুনাফা (Net Profit)'}</span>
                <span className={(profitLossData?.netProfit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {formatBDT(profitLossData?.netProfit || 0, language)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALES REPORT */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">{language === 'en' ? 'Invoice #' : 'চালান নং'}</th>
                  <th className="px-5 py-3.5">{t('date')}</th>
                  <th className="px-5 py-3.5">{language === 'en' ? 'Customer / Party' : 'গ্রাহক / পার্টি'}</th>
                  <th className="px-5 py-3.5 text-right">{language === 'en' ? 'Total' : 'মোট টাকা'}</th>
                  <th className="px-5 py-3.5 text-right">{language === 'en' ? 'Paid' : 'আদায়কৃত'}</th>
                  <th className="px-5 py-3.5 text-right font-black">{t('due')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesList.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-600">{s.invoiceNumber}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 font-mono">{formatDate(s.date, language)}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{s.partyId?.name || (language === 'en' ? 'Cash Customer' : 'ক্যাশ কাস্টমার')}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-800">{formatBDT(s.totalAmount, language)}</td>
                    <td className="px-5 py-3.5 text-right text-emerald-600 font-bold">{formatBDT(s.paidAmount, language)}</td>
                    <td className="px-5 py-3.5 text-right font-black text-rose-600">{formatBDT(s.dueAmount, language)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STOCK REPORT */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">
              {language === 'en' ? 'Total Inventory Valuation:' : 'বর্তমান মোট স্টক ভ্যালুয়েশন:'}
            </span>
            <span className="text-lg font-black text-indigo-700">{formatBDT(dashboardStats?.stockValue || 0, language)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">{language === 'en' ? 'Product Description' : 'পণ্যের বিবরণ'}</th>
                  <th className="px-5 py-3.5">{language === 'en' ? 'Unit' : 'একক'}</th>
                  <th className="px-5 py-3.5 text-right">{language === 'en' ? 'In Stock' : 'মজুদ পরিমাণ'}</th>
                  <th className="px-5 py-3.5 text-right">{language === 'en' ? 'Cost Price' : 'ক্রয় দর'}</th>
                  <th className="px-5 py-3.5 text-right">{language === 'en' ? 'Sale Price' : 'বিক্রয় দর'}</th>
                  <th className="px-5 py-3.5 text-right font-black">{language === 'en' ? 'Stock Valuation' : 'মোট স্টক মূল্য'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productList.map((p) => {
                  const val = (p.stock || 0) * (p.purchasePrice || 0);
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{p.name}</td>
                      <td className="px-5 py-3.5 uppercase text-xs font-bold text-slate-500">{p.unit}</td>
                      <td className="px-5 py-3.5 text-right font-black text-slate-800">{p.stock}</td>
                      <td className="px-5 py-3.5 text-right text-slate-600">{formatBDT(p.purchasePrice, language)}</td>
                      <td className="px-5 py-3.5 text-right text-slate-600">{formatBDT(p.salePrice, language)}</td>
                      <td className="px-5 py-3.5 text-right font-black text-indigo-700">{formatBDT(val, language)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DUE LIST */}
      {activeTab === 'due' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">
              {language === 'en' ? 'Total Outstanding Receivable (Due):' : 'বাজারের মোট পাওনা / বাকি (Receivable):'}
            </span>
            <span className="text-lg font-black text-rose-600">{formatBDT(dashboardStats?.totalReceivable || 0, language)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">{language === 'en' ? 'Customer / Party Name' : 'গ্রাহক / পার্টির নাম'}</th>
                  <th className="px-5 py-3.5">{language === 'en' ? 'Mobile Phone Number' : 'মোবাইল ফোন নম্বর'}</th>
                  <th className="px-5 py-3.5 text-right font-black">{language === 'en' ? 'Due Amount' : 'বাকি টাকার পরিমাণ'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(dashboardStats?.topDebtors || []).map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{d.name}</td>
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-600">{d.phone || '—'}</td>
                    <td className="px-5 py-3.5 text-right font-black text-rose-600">{formatBDT(d.due, language)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: DUE AGING ANALYSIS */}
      {activeTab === 'aging' && (
        <div className="space-y-6">
          {/* Aging Buckets Summary Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-emerald-50/70 border border-emerald-200 p-5 rounded-2xl shadow-xs">
              <span className="text-xs font-bold uppercase text-emerald-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                {t('days_0_30')}
              </span>
              <div className="text-2xl font-black text-emerald-900 mt-1">
                {formatBDT(agingData?.bucketTotals?.current || 0, language)}
              </div>
              <p className="text-[11px] text-emerald-700 mt-1">
                {language === 'en' ? 'Current normal turnover' : 'স্বাভাবিক চলতি লেনদেন'}
              </p>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-2xl shadow-xs">
              <span className="text-xs font-bold uppercase text-amber-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                {t('days_31_60')}
              </span>
              <div className="text-2xl font-black text-amber-900 mt-1">
                {formatBDT(agingData?.bucketTotals?.month1 || 0, language)}
              </div>
              <p className="text-[11px] text-amber-700 mt-1">
                {language === 'en' ? 'Due payment approaching deadline' : 'পরিশোধের মেয়াদ অতিক্রমের পথে'}
              </p>
            </div>

            <div className="bg-orange-50/70 border border-orange-200 p-5 rounded-2xl shadow-xs">
              <span className="text-xs font-bold uppercase text-orange-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                {t('days_61_90')}
              </span>
              <div className="text-2xl font-black text-orange-900 mt-1">
                {formatBDT(agingData?.bucketTotals?.month2 || 0, language)}
              </div>
              <p className="text-[11px] text-orange-700 mt-1">
                {language === 'en' ? 'High risk, enforce recovery' : 'বকেয়া তাগাদা জোরদার করুন'}
              </p>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 p-5 rounded-2xl shadow-xs">
              <span className="text-xs font-bold uppercase text-rose-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                {t('days_90_plus')}
              </span>
              <div className="text-2xl font-black text-rose-900 mt-1">
                {formatBDT(agingData?.bucketTotals?.older || 0, language)}
              </div>
              <p className="text-[11px] text-rose-700 mt-1">
                {language === 'en' ? 'Critical bad debt risk' : 'অনাদায়ী হওয়ার চরম ঝুঁকিতে'}
              </p>
            </div>
          </div>

          {/* Aging Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>
                    {language === 'en'
                      ? 'Customer Due Aging Classification & WhatsApp Notice'
                      : 'গ্রাহকওয়ারি বকেয়া সময়ের ক্লাসিফিকেশন ও হোয়াটসঅ্যাপ তাগাদা'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'en'
                    ? `Total ${agingData?.parties?.length || 0} customers with outstanding receivables`
                    : `মোট ${agingData?.parties?.length || 0} জন গ্রাহকের কাছে বাজার বাকি রয়েছে`}
                </p>
              </div>
              <span className="text-xs font-bold bg-rose-50 text-rose-700 px-3 py-1 rounded-full border border-rose-200">
                {language === 'en' ? 'Total Outstanding: ' : 'মোট বকেয়া: '}
                {formatBDT(agingData?.totalDue || 0, language)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">{language === 'en' ? 'Customer & Contact' : 'পার্টির নাম ও যোগাযোগ'}</th>
                    <th className="px-5 py-3.5 text-right text-emerald-700 font-bold">{language === 'en' ? '0-30 Days' : '০-৩০ দিন'}</th>
                    <th className="px-5 py-3.5 text-right text-amber-700 font-bold">{language === 'en' ? '31-60 Days' : '৩১-৬০ দিন'}</th>
                    <th className="px-5 py-3.5 text-right text-orange-700 font-bold">{language === 'en' ? '61-90 Days' : '৬১-৯০ দিন'}</th>
                    <th className="px-5 py-3.5 text-right text-rose-700 font-bold">{language === 'en' ? '90+ Days' : '৯০+ দিন'}</th>
                    <th className="px-5 py-3.5 text-right font-black">{t('due')}</th>
                    <th className="px-5 py-3.5 text-center">{language === 'en' ? 'Risk Status & Notice' : 'স্ট্যাটাস ও নোটিশ'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {(agingData?.parties || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                        {language === 'en' ? 'No outstanding due accounts found.' : 'কোনো বকেয়া রেকর্ড পাওয়া যায়নি।'}
                      </td>
                    </tr>
                  ) : (
                    agingData.parties.map((p) => {
                      const cleanPhone = (p.phone || '').replace(/[^0-9]/g, '');
                      const intlPhone = cleanPhone.startsWith('88')
                        ? cleanPhone
                        : cleanPhone.startsWith('0')
                        ? `88${cleanPhone}`
                        : `880${cleanPhone}`;
                      const msg = language === 'en'
                        ? `Greetings ${p.name}. As per records of ${business?.name || 'Hisaaboo'}, your current outstanding balance is ${formatBDT(p.totalDue, 'en')}. Please kindly settle the bill at your earliest convenience. Thank you.`
                        : `আসসালামু আলাইকুম, ${p.name}।\n${business?.name || 'হিসাবূ'}-এর খাতা অনুযায়ী আপনার বর্তমান বকেয়া জের: ৳${p.totalDue.toLocaleString('bn-BD')}।\nঅনুগ্রহ করে দ্রুত বিল পরিশোধ করে সহযোগিতা করুন। ধন্যবাদ।`;
                      const waUrl = `https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900">{p.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              {p.phone && <span>{p.phone}</span>}
                              {p.address && <span>• {p.address}</span>}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono text-emerald-700 font-bold">
                            {p.current > 0 ? formatBDT(p.current, language) : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono text-amber-700 font-bold">
                            {p.month1 > 0 ? formatBDT(p.month1, language) : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono text-orange-700 font-bold">
                            {p.month2 > 0 ? formatBDT(p.month2, language) : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono text-rose-700 font-bold">
                            {p.older > 0 ? formatBDT(p.older, language) : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono font-black text-slate-900 text-sm">
                            {formatBDT(p.totalDue, language)}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  p.riskLevel === 'critical'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : p.riskLevel === 'warning'
                                    ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                    : p.riskLevel === 'follow-up'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                }`}
                              >
                                {p.riskLevel === 'critical'
                                  ? (language === 'en' ? 'Critical' : 'জরুরি')
                                  : p.riskLevel === 'warning'
                                  ? (language === 'en' ? 'Warning' : 'সতর্ক')
                                  : p.riskLevel === 'follow-up'
                                  ? (language === 'en' ? 'Follow-up' : 'তাগাদা')
                                  : (language === 'en' ? 'Normal' : 'স্বাভাবিক')}
                              </span>

                              {p.phone && (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                  title={language === 'en' ? 'Send WhatsApp Notice' : 'WhatsApp এ তাগাদা পাঠান'}
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
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
      )}
    </div>
  );
}
