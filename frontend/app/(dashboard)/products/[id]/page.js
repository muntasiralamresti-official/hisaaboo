'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../../../lib/api';
import { formatBDT, formatDate } from '../../../../lib/formatters';
import { useAuth } from '../../../../lib/authContext';
import { getTemplateCustomFields } from '../../../../lib/templates';
import {
  ArrowLeft,
  Package,
  Layers,
  History,
  TrendingUp,
  AlertCircle,
  PlusCircle,
  ShoppingCart,
  ShoppingBag,
} from 'lucide-react';

function ProductDetailContent() {
  const { id } = useParams();
  const { business } = useAuth();
  const businessType = business?.businessType || 'general';
  const templateFields = getTemplateCustomFields(businessType);

  const [product, setProduct] = useState(null);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetchApi(`/products/${id}`);
        if (res.success) {
          setProduct(res.product);
          setAdjustments(res.adjustments || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">সুতার তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border text-slate-500">
        পণ্যটি পাওয়া যায়নি।{' '}
        <Link href="/products" className="text-blue-600 underline">
          তালিকায় ফিরে যান
        </Link>
      </div>
    );
  }

  const stockValue = (Number(product.stock) || 0) * (Number(product.purchasePrice) || 0);
  const isLowStock = (Number(product.stock) || 0) <= (Number(product.lowStockLevel) || 5);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              <span>{product.name}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">সুতার বিস্তারিত স্পেসিফিকেশন ও স্টক সমন্বয় খতিয়ান</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/purchases/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>+ মিল চালান (ক্রয়)</span>
          </Link>
          <Link
            href="/sales/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>+ বিক্রয় মেমো</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500">বর্তমান লাইভ স্টক</span>
          <div className={`text-2xl font-black mt-1 ${isLowStock ? 'text-rose-600' : 'text-slate-900'}`}>
            {product.stock} {product.unit}
          </div>
          {isLowStock ? (
            <p className="text-[11px] text-rose-500 font-bold mt-1">⚠️ রি-অর্ডার সীমার নিচে</p>
          ) : (
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">পর্যাপ্ত স্টক রয়েছে</p>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500">ক্রয় দর (Purchase Rate)</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{formatBDT(product.purchasePrice)}</div>
          <p className="text-[11px] text-slate-400 mt-1">প্রতি {product.unit} দর</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500">বিক্রয় দর (Sales Rate)</span>
          <div className="text-2xl font-black text-blue-700 mt-1">{formatBDT(product.salePrice)}</div>
          <p className="text-[11px] text-slate-400 mt-1">বর্তমান বাজার দর</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500">মোট স্টক মূল্য</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">{formatBDT(stockValue)}</div>
          <p className="text-[11px] text-slate-400 mt-1">গোডাউনে মোট ইনভেস্টমেন্ট</p>
        </div>
      </div>

      {/* Specifications Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
          <Layers className="w-5 h-5 text-indigo-600" />
          <span>সুতা ব্যবসার বিশেষ তথ্য ও প্যারামিটারসমূহ</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          {templateFields.map((f) => (
            <div key={f.key} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-bold uppercase">{f.label.bn}</span>
              <p className="text-slate-900 font-black text-sm mt-0.5">
                {product.customFields?.[f.key] || '—'}
              </p>
            </div>
          ))}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-bold uppercase">সতর্কতা স্তর (Reorder Level)</span>
            <p className="text-slate-900 font-black text-sm mt-0.5">{product.lowStockLevel} {product.unit}</p>
          </div>
        </div>
      </div>

      {/* Stock Adjustment History */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            <span>স্টক সমন্বয় ও অডিট হিস্ট্রি (Manual Adjustments)</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">তারিখ</th>
                <th className="px-5 py-3.5">ধরন</th>
                <th className="px-5 py-3.5">কারণ</th>
                <th className="px-5 py-3.5 text-right font-black">সমন্বয় পরিমাণ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {adjustments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-400 text-xs">
                    এই পণ্যে কোনো ম্যানুয়াল স্টক সমন্বয় রেকর্ড নেই।
                  </td>
                </tr>
              ) : (
                adjustments.map((adj) => (
                  <tr key={adj._id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-600">{formatDate(adj.date)}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 capitalize">{adj.type === 'increase' ? 'বৃদ্ধি (+)' : 'হ্রাস (-)'}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{adj.reason || '—'}</td>
                    <td className="px-5 py-3.5 text-right font-black text-sm">
                      {adj.type === 'increase' ? `+ ${adj.quantity}` : `- ${adj.quantity}`} {product.unit}
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

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-400">পণ্য তথ্য লোড হচ্ছে...</div>}>
      <ProductDetailContent />
    </Suspense>
  );
}
