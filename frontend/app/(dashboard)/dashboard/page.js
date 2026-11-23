'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../../lib/api';
import { useAuth } from '../../../lib/authContext';
import { formatBDT, formatDate } from '../../../lib/formatters';
import { getTemplateLabel } from '../../../lib/templates';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  CreditCard,
  Receipt,
  Users,
  Package,
  Wallet,
  PlusCircle,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  AlertCircle,
  Clock,
  ChevronRight,
  Truck,
  Layers,
  Sparkles,
  RefreshCw,
  Landmark,
  Smartphone,
  AlertTriangle,
} from 'lucide-react';

const PIE_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function TenantDashboardPage() {
  const { business, language, t } = useAuth();
  const businessType = business?.businessType || 'general';

  const saleLabel = getTemplateLabel(businessType, 'sale', language, t('nav_sales', 'চালান / মেমো'));
  const partyLabel = getTemplateLabel(businessType, 'party', language, t('nav_parties', 'পার্টি / খাতা'));
  const productLabel = getTemplateLabel(businessType, 'product', language, t('nav_products', 'সুতা / পণ্য'));

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todaySales: 0,
    todayCollection: 0,
    todayExpense: 0,
    monthSales: 0,
    monthPurchases: 0,
    totalReceivable: 0,
    totalPayable: 0,
    stockValue: 0,
    balances: { cash: 0, bKash: 0, bank: 0 },
    topDebtors: [],
    sixMonthTrend: [],
    topSellingProducts: [],
    lowStockProducts: [],
  });

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/reports/dashboard');
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const totalLiquid = (stats.balances?.cash || 0) + (stats.balances?.bKash || 0) + (stats.balances?.bank || 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Header Banner & Quick Action Buttons */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-semibold mb-3 border border-white/10">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {businessType === 'yarn' 
                ? (language === 'en' ? 'Yarn Trading Dashboard' : 'সুতা ব্যবসা ড্যাশবোর্ড (কামরুল ট্রেডিং আর্কিটেকচার)')
                : (language === 'en' ? 'Business Dashboard' : 'ব্যবসায়িক ড্যাশবোর্ড')}
            </span>
            <span>•</span>
            <span>{formatDate(new Date(), language)}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {business?.name || (language === 'en' ? 'Business Enterprise' : 'ব্যবসায়িক প্রতিষ্ঠান')}
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100/80 mt-1 max-w-xl">
            {language === 'en'
              ? 'Daily sales memos, due collections, supplier payables, and warehouse stock ledger'
              : 'সুতার দৈনিক চালান, বাকি কালেকশন, মিল পাওনা এবং গোডাউন স্টক খতিয়ান'}
          </p>
        </div>

        {/* Quick Action Navigation Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/sales/new"
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{language === 'en' ? 'New Invoice' : 'নতুন মেমো'}</span>
          </Link>
          <Link
            href="/purchases/new"
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5"
          >
            <Package className="w-4 h-4" />
            <span>{language === 'en' ? 'Mill Purchase' : 'মিল চালান (ক্রয়)'}</span>
          </Link>
          <Link
            href="/payments/new"
            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5"
          >
            <CreditCard className="w-4 h-4" />
            <span>{language === 'en' ? 'Collect Payment' : 'টাকা আদায়'}</span>
          </Link>
          <Link
            href="/challans"
            className="py-2.5 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm border border-white/20 transition-all flex items-center gap-1.5"
          >
            <Truck className="w-4 h-4" />
            <span>{language === 'en' ? 'Gate Pass / Challan' : 'গেট পাস / চালান'}</span>
          </Link>
          <button
            onClick={loadDashboard}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
            title={t('refresh', 'রিফ্রেশ')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Primary 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              {t('today_sales', 'আজকের বিক্রি')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {formatBDT(stats.todaySales, language)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {language === 'en' ? "Today's invoice value" : 'আজকের মোট চালান মূল্য'}
          </p>
        </div>

        {/* Today's Collection */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              {t('today_collections', 'আজকের নগদ আদায়')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600">
            {formatBDT(stats.todayCollection, language)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {language === 'en' ? 'Customer due collections' : 'কাস্টমার বাকি কালেকশন'}
          </p>
        </div>

        {/* Month Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              {language === 'en' ? 'Month Turnover' : 'চলতি মাসের টার্নওভার'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-900">
            {formatBDT(stats.monthSales, language)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {language === 'en' ? 'Total monthly sales volume' : 'চলতি মাসের মোট সুতা বিক্রি'}
          </p>
        </div>

        {/* Customer Outstanding Due */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              {t('total_receivable', 'বাজারের মোট বাকি')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600">
            {formatBDT(stats.totalReceivable, language)}
          </div>
          <p className="text-[11px] text-rose-500 mt-1">
            {language === 'en' ? 'Total customer receivables' : 'খরিদ্দারদের কাছে মোট পাওনা'}
          </p>
        </div>
      </div>

      {/* 3. Secondary Business Monitor Row (Kamrul Yarn Business Monitor Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Month Purchases */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500">
            {language === 'en' ? 'Month Purchases' : 'চলতি মাসের ক্রয় (Procurement)'}
          </span>
          <div className="text-lg sm:text-xl font-black text-slate-800 mt-1">
            {formatBDT(stats.monthPurchases, language)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {language === 'en' ? 'Goods inward from spinning mills' : 'স্পিনিং মিল ও সাপ্লায়ার থেকে মাল গ্রহণ'}
          </p>
        </div>

        {/* Supplier Due */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-amber-700">
            {t('total_payable', 'মিল ও মহাজন পাওনা (Payable)')}
          </span>
          <div className="text-lg sm:text-xl font-black text-amber-700 mt-1">
            {formatBDT(stats.totalPayable, language)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {language === 'en' ? 'Pending bills due to mills/suppliers' : 'মিলের বকেয়া বিল পরিশোধ বাকি'}
          </p>
        </div>

        {/* Yarn Stock Valuation */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500">
            {t('stock_value', 'মজুদ সুতার মোট মূল্য (Stock Value)')}
          </span>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">
            {formatBDT(stats.stockValue, language)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {language === 'en' ? 'Warehouse stock at purchase value' : 'গোডাউনে বর্তমান কেনা মূল্যের স্টক'}
          </p>
        </div>

        {/* Liquid Cash */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-emerald-700">
            {language === 'en' ? 'Total Liquid Cash & Bank' : 'মোট নগদ তারল্য (ক্যাশ ও ব্যাংক)'}
          </span>
          <div className="text-lg sm:text-xl font-black text-emerald-700 mt-1">
            {formatBDT(totalLiquid, language)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {language === 'en' ? 'Cash drawer + bKash + Bank accounts' : 'ক্যাশ ড্রয়ার + বিকাশ + ব্যাংক একাউন্ট'}
          </p>
        </div>
      </div>

      {/* 4. Interactive Charts Row (6-Month Sales vs Purchases & Top Selling Products) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales vs Purchase Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {t('sales_vs_purchase', '৬ মাসের বিক্রয় বনাম ক্রয় তুলনামূলক চিত্র')}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'en' ? 'Monthly sales & purchase growth trends' : 'মাসিক সুতা ক্রয় ও বিক্রয়ের প্রবৃদ্ধি বিশ্লেষণ'}
              </p>
            </div>
            <Link href="/reports" className="text-xs font-bold text-indigo-600 hover:underline">
              {language === 'en' ? 'Detailed Reports →' : 'বিস্তারিত রিপোর্ট →'}
            </Link>
          </div>

          <div className="h-72 w-full">
            {stats.sixMonthTrend && stats.sixMonthTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.sixMonthTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                  />
                  <Tooltip
                    formatter={(val) => [formatBDT(val, language), '']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="Sales" name={language === 'en' ? 'Sales' : 'বিক্রয় (Sales)'} fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={22} />
                  <Bar dataKey="Purchase" name={language === 'en' ? 'Purchase' : 'ক্রয় (Purchase)'} fill="#10b981" radius={[6, 6, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                {language === 'en' ? 'Insufficient monthly data' : 'পর্যাপ্ত মাসিক ডাটা পাওয়া যায়নি'}
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Yarn Donut Chart (1 col) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {t('top_selling', 'সেরা বিক্রিত সুতা ও কাউন্ট')}
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              {language === 'en' ? 'Top products by revenue' : 'মোট রেভিনিউতে কোন সুতার অবদান বেশি'}
            </p>
          </div>

          <div className="h-52 w-full relative">
            {stats.topSellingProducts && stats.topSellingProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.topSellingProducts}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {stats.topSellingProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [formatBDT(val, language), language === 'en' ? 'Sales' : 'বিক্রয়']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                {language === 'en' ? 'No sales data yet' : 'বিক্রয় তথ্য এখনো জমা হয়নি'}
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {stats.topSellingProducts?.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5 truncate max-w-[170px]" title={item.name}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="font-bold text-slate-900 font-mono">{formatBDT(item.value, language)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Low Stock / Reorder Alert & Top Debtors Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Reorder / Low Stock Warning (Inspired by Kamrul Stock ReOrderList) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>{t('reorder_alert', 'রি-অর্ডার সতর্কতা (Low Stock Alert)')}</span>
            </h2>
            <Link href="/products" className="text-xs font-bold text-indigo-600 hover:underline">
              {language === 'en' ? 'All Stock' : 'সকল স্টক'}
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {!stats.lowStockProducts || stats.lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {language === 'en' ? 'Stock is sufficient across all items.' : 'আলহামদুলিল্লাহ, সব সুতার পর্যাপ্ত স্টক গোডাউনে রয়েছে।'}
              </div>
            ) : (
              stats.lowStockProducts.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                    <p className="text-[11px] text-slate-500">
                      {language === 'en' ? 'Alert Level' : 'সতর্কতা স্তর'}: {p.lowStockLevel} {p.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold font-mono">
                      {language === 'en' ? 'Stock' : 'বাকি'}: {p.stock} {p.unit}
                    </span>
                    <Link
                      href="/purchases/new"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                      title={language === 'en' ? 'New Purchase' : 'নতুন মিল চালান'}
                    >
                      {language === 'en' ? '+ Buy' : '+ ক্রয়'}
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Debtors (কারা বেশি বাকি রেখেছে) (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{t('top_debtors', 'শীর্ষ বাকিদার খরিদ্দার (Top Customer Due)')}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'en' ? 'Customers with highest outstanding balances' : 'যাদের কাছে সবচেয়ে বেশি বকেয়া আটকে আছে'}
              </p>
            </div>
            <Link href="/parties" className="text-xs font-bold text-indigo-600 hover:underline">
              {language === 'en' ? 'Full Due Ledger →' : 'সম্পূর্ণ বাকি খাতা →'}
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {!stats.topDebtors || stats.topDebtors.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {language === 'en' ? 'No pending dues recorded.' : 'কোনো বাকি রেকর্ড পাওয়া যায়নি।'}
              </div>
            ) : (
              stats.topDebtors.map((debtor, index) => (
                <div key={debtor.id || index} className="py-3 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div>
                      <Link href={`/parties/${debtor.id}`} className="text-xs sm:text-sm font-bold text-slate-900 hover:text-indigo-600">
                        {debtor.name}
                      </Link>
                      <div className="text-[11px] text-slate-500 font-mono">{debtor.phone || (language === 'en' ? 'No phone' : 'ফোন নেই')}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-black text-rose-600">{formatBDT(debtor.due, language)}</div>
                      <div className="text-[10px] text-slate-400">{language === 'en' ? 'Due Amount' : 'বাকি পরিমাণ'}</div>
                    </div>
                    <Link
                      href={`/payments/new?partyId=${debtor.id}`}
                      className="py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {language === 'en' ? 'Collect' : 'আদায়'}
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
