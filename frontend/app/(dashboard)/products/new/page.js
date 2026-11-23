'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../../../lib/api';
import { useAuth } from '../../../../lib/authContext';
import { getTemplateLabel, getTemplateCustomFields, getTemplateUnits } from '../../../../lib/templates';
import { ArrowLeft, Package, Save, AlertCircle, Layers, Sparkles } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();
  const { business } = useAuth();
  const businessType = business?.businessType || 'general';

  const productLabel = getTemplateLabel(businessType, 'product', 'bn', 'পণ্য');
  const templateFields = getTemplateCustomFields(businessType);
  const allowedUnits = getTemplateUnits(businessType);

  const [formData, setFormData] = useState({
    name: '',
    unit: allowedUnits[0]?.key || (businessType === 'yarn' ? 'bag' : 'pcs'),
    purchasePrice: '',
    salePrice: '',
    stock: '',
    lowStockLevel: '5',
    customFields: {},
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCustomFieldChange = (key, value) => {
    setFormData((prev) => {
      const nextCustom = {
        ...prev.customFields,
        [key]: value,
      };

      let nextName = prev.name;
      // Auto-generate product name if user hasn't manually typed an arbitrary name
      if (!prev.name || prev.name.includes('-') || prev.name.includes('/')) {
        if (businessType === 'yarn') {
          const count = key === 'count' ? value : nextCustom.count;
          const type = key === 'yarnType' ? value : nextCustom.yarnType;
          const brand = key === 'brand' ? value : nextCustom.brand;
          const parts = [count, type, brand].filter(Boolean);
          if (parts.length > 0) nextName = parts.join(' - ');
        } else if (businessType === 'grocery') {
          const brand = key === 'brand' ? value : nextCustom.brand;
          const packSize = key === 'packSize' ? value : nextCustom.packSize;
          const parts = [brand, packSize].filter(Boolean);
          if (parts.length > 0) nextName = parts.join(' - ');
        } else if (businessType === 'electronics') {
          const brand = key === 'brand' ? value : nextCustom.brand;
          const model = key === 'model' ? value : nextCustom.model;
          const parts = [brand, model].filter(Boolean);
          if (parts.length > 0) nextName = parts.join(' - ');
        } else if (businessType === 'pharmacy') {
          const generic = key === 'genericName' ? value : nextCustom.genericName;
          const strength = key === 'strength' ? value : nextCustom.strength;
          const company = key === 'company' ? value : nextCustom.company;
          const parts = [generic, strength ? `(${strength})` : '', company].filter(Boolean);
          if (parts.length > 0) nextName = parts.join(' ');
        } else if (businessType === 'clothing') {
          const fabric = key === 'fabricType' ? value : nextCustom.fabricType;
          const size = key === 'size' ? value : nextCustom.size;
          const color = key === 'color' ? value : nextCustom.color;
          const parts = [fabric, size ? `[${size}]` : '', color].filter(Boolean);
          if (parts.length > 0) nextName = parts.join(' - ');
        } else if (businessType === 'hardware') {
          const brand = key === 'brand' ? value : nextCustom.brand;
          const grade = key === 'gradeOrSize' ? value : nextCustom.gradeOrSize;
          const parts = [brand, grade].filter(Boolean);
          if (parts.length > 0) nextName = parts.join(' - ');
        }
      }

      return {
        ...prev,
        name: nextName,
        customFields: nextCustom,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('পণ্যের নাম প্রদান করুন');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name.trim(),
          unit: formData.unit,
          purchasePrice: Number(formData.purchasePrice) || 0,
          salePrice: Number(formData.salePrice) || 0,
          stock: Number(formData.stock) || 0,
          lowStockLevel: Number(formData.lowStockLevel) || 5,
          customFields: formData.customFields,
        }),
      });

      if (res.success) {
        router.push('/products');
      } else {
        setError(res.message || 'পণ্য সংরক্ষণ ব্যর্থ হয়েছে');
      }
    } catch (err) {
      setError(err.message || 'পণ্য সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/products"
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            নতুন {productLabel} যোগ করুন
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ইনভেন্টরিতে নতুন আইটেম যুক্ত করুন এবং স্টক হিসাব শুরু করুন
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        
        {/* Dynamic Template Custom Fields (Count, Yarn Type, Mill Brand, Lot, Cones, Weight) */}
        {templateFields.length > 0 && (
          <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>
                  {businessType === 'yarn'
                    ? 'সুতা স্পেসিফিকেশন (কাউন্ট, মিল, লট ও কোন)'
                    : businessType === 'grocery'
                    ? 'খাদ্যপণ্য ও ব্র্যান্ড স্পেসিফিকেশন (ব্র্যান্ড, প্যাক সাইজ ও ক্যাটাগরি)'
                    : businessType === 'electronics'
                    ? 'ইলেকট্রনিক্স স্পেসিফিকেশন (IMEI, মডেল ও ওয়ারেন্টি)'
                    : businessType === 'pharmacy'
                    ? 'ওষুধ ও ফার্মাসিউটিক্যাল স্পেসিফিকেশন (জেনেরিক, প্রস্তুতকারক, ব্যাচ ও মেয়াদ)'
                    : businessType === 'clothing'
                    ? 'কাপড় ও পোশাক স্পেসিফিকেশন (সাইজ, ফেব্রিক, কালার ও ব্র্যান্ড)'
                    : businessType === 'hardware'
                    ? 'রড ও নির্মাণ সামগ্রী স্পেসিফিকেশন (ব্র্যান্ড, সাইজ ও গ্রেড)'
                    : 'পণ্যের বিশেষ তথ্য ও স্পেসিফিকেশন'}
                </span>
              </h3>
              <span className="text-[11px] text-blue-600 flex items-center gap-1 font-semibold">
                <Sparkles className="w-3 h-3" />
                অটো টাইটেল জেনারেটর সক্রিয়
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {templateFields.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {f.label.bn}
                  </label>
                  {f.options && f.options.length > 0 ? (
                    <div>
                      <input
                        type={f.type === 'number' ? 'number' : 'text'}
                        list={`list-${f.key}`}
                        value={formData.customFields[f.key] || ''}
                        onChange={(e) => handleCustomFieldChange(f.key, e.target.value)}
                        placeholder={f.placeholder.bn}
                        className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <datalist id={`list-${f.key}`}>
                        {f.options.map((opt) => (
                          <option key={opt} value={opt} />
                        ))}
                      </datalist>
                    </div>
                  ) : (
                    <input
                      type={f.type === 'number' ? 'number' : 'text'}
                      value={formData.customFields[f.key] || ''}
                      onChange={(e) => handleCustomFieldChange(f.key, e.target.value)}
                      placeholder={f.placeholder.bn}
                      className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Name & Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              পণ্যের পূর্ণ নাম / ডিসপ্লে টাইটেল *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={businessType === 'yarn' ? 'যেমন: 30/1 - Combed - Square Textiles' : 'পণ্যের নাম দিন'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              হিসাবের পরিমাপ একক (Unit) *
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            >
              {allowedUnits.map((u) => (
                <option key={u.key} value={u.key}>
                  {u.label.bn} ({u.key})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Prices: Purchase Price & Sale Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              প্রতি ইউনিটের ক্রয় মূল্য (৳)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.purchasePrice}
              onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              প্রতি ইউনিটের বিক্রয় মূল্য (৳)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.salePrice}
              onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Initial Stock & Low Stock Alert */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              বর্তমান প্রারম্ভিক স্টক (Bags / Units)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              placeholder="0"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              লো-স্টক সতর্কতা লেভেল (পরিমাণ)
            </label>
            <input
              type="number"
              value={formData.lowStockLevel}
              onChange={(e) => setFormData({ ...formData, lowStockLevel: e.target.value })}
              placeholder="5"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Link
            href="/products"
            className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
          >
            বাতিল
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>সংরক্ষণ হচ্ছে...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>পণ্য যুক্ত করুন</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
