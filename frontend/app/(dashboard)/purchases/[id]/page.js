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
  Printer,
  ShoppingBag,
  Calendar,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Building,
} from 'lucide-react';

function PurchaseBillContent() {
  const { id } = useParams();
  const router = useRouter();
  const { business } = useAuth();
  const businessType = business?.businessType || 'general';
  const templateFields = getTemplateCustomFields(businessType);

  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPurchase() {
      try {
        const res = await fetchApi(`/purchases/${id}`);
        if (res.success) {
          setPurchase(res.purchase);
        } else {
          setError(res.message || 'ক্রয় বিল লোড করা যায়নি');
        }
      } catch (err) {
        setError(err.message || 'ক্রয় বিল লোড করা যায়নি');
      } finally {
        setLoading(false);
      }
    }
    if (id) loadPurchase();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">ক্রয় বিল লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="p-8 bg-white rounded-3xl border text-center text-slate-500">
        ক্রয় বিলটি পাওয়া যায়নি।{' '}
        <Link href="/purchases" className="text-emerald-600 underline">
          তালিকায় ফিরে যান
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Action Header */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/purchases"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              ক্রয় চালান #{purchase.billNo}
            </h1>
            <p className="text-xs text-slate-500">{formatDate(purchase.date)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/purchases/new"
            className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs"
          >
            + নতুন ক্রয় এন্ট্রি
          </Link>
          <button
            onClick={handlePrint}
            className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট / PDF ভাউচার</span>
          </button>
        </div>
      </div>

      {/* Printable Paper */}
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-md print:shadow-none print:border-none print:p-0 space-y-6 text-slate-900">
        
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {business?.name || 'ব্যবসায়িক প্রতিষ্ঠান'}
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-sm">
              {business?.address || ''}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              ফোন: <strong className="text-slate-900">{business?.phone}</strong>
            </p>
          </div>

          <div className="text-right sm:self-center">
            <span className="inline-block py-1.5 px-4 rounded-lg bg-emerald-950 text-white text-xs sm:text-sm font-black uppercase tracking-widest">
              মিল ক্রয় চালান / ইনওয়ার্ড
            </span>
            <div className="mt-2 text-xs font-bold text-slate-600">
              বিল নং: <span className="text-slate-900 font-mono">{purchase.billNo}</span>
            </div>
            <div className="text-xs text-slate-600">
              তারিখ: <span className="font-semibold">{formatDate(purchase.date)}</span>
            </div>
          </div>
        </div>

        {/* Supplier / Mill Info Box */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              স্পিনিং মিল / সাপ্লায়ারের বিবরণ:
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-emerald-600" />
              <span>{purchase.partyId?.name || 'সরাসরি সরবরাহকারী'}</span>
            </h3>
            {purchase.partyId?.address && (
              <p className="text-slate-600 mt-0.5">{purchase.partyId.address}</p>
            )}
            {purchase.partyId?.phone && (
              <p className="text-slate-600 mt-0.5">ফোন: {purchase.partyId.phone}</p>
            )}
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              পেমেন্ট স্ট্যাটাস:
            </span>
            <div className="mt-0.5 font-bold">
              {purchase.dueAmount <= 0 ? (
                <span className="text-emerald-700">পরিশোধিত (Paid)</span>
              ) : purchase.paidAmount > 0 ? (
                <span className="text-amber-700">আংশিক পরিশোধ (Partial Paid)</span>
              ) : (
                <span className="text-rose-700">বকেয়া বিল (Full Payable)</span>
              )}
            </div>
            {purchase.paymentMethod && purchase.paymentMethod !== 'none' && (
              <p className="text-slate-500 text-[11px] mt-0.5 uppercase">
                মাধ্যম: {purchase.paymentMethod}
              </p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">নং</th>
                <th className="py-2.5 px-3">সুতা ও পণ্যের বিবরণ</th>
                {templateFields.map((f) => (
                  <th key={f.key} className="py-2.5 px-3">
                    {f.label.bn}
                  </th>
                ))}
                <th className="py-2.5 px-3 text-right">পরিমাণ (বস্তা / একক)</th>
                <th className="py-2.5 px-3 text-right">ক্রয় দর / রেট</th>
                <th className="py-2.5 px-3 text-right">মোট টাকা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans">
              {purchase.items?.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    {item.productName}
                  </td>
                  {templateFields.map((f) => (
                    <td key={f.key} className="py-2.5 px-3 text-slate-700">
                      {item.customFields?.[f.key] || '—'}
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-800">
                    {formatBDT(item.rate)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                    {formatBDT(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Totals */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
          <div className="text-xs text-slate-500 max-w-sm space-y-1">
            {purchase.notes && (
              <p>
                <strong>মন্তব্য:</strong> {purchase.notes}
              </p>
            )}
            <p className="italic text-[11px] text-slate-400">
              * মাল গোডাউনে রিসিভ করার পর স্টক স্বয়ংক্রিয়ভাবে আপডেট হয়েছে।
            </p>
          </div>

          <div className="w-full sm:w-64 space-y-1.5 text-xs">
            <div className="flex justify-between py-1 text-slate-600 font-medium">
              <span>মোট ক্রয়মূল্য:</span>
              <span className="font-mono font-bold">{formatBDT(purchase.subTotal)}</span>
            </div>

            {purchase.discount > 0 && (
              <div className="flex justify-between py-1 text-rose-600 font-medium">
                <span>মিলের ছাড়:</span>
                <span className="font-mono font-bold">- {formatBDT(purchase.discount)}</span>
              </div>
            )}

            <div className="flex justify-between py-1.5 border-t border-b border-slate-900 font-black text-sm text-slate-900">
              <span>সর্বমোট প্রদেয় বিল:</span>
              <span className="font-mono">{formatBDT(purchase.totalAmount)}</span>
            </div>

            <div className="flex justify-between py-1 text-emerald-700 font-bold">
              <span>পরিশোধ করা হয়েছে:</span>
              <span className="font-mono">{formatBDT(purchase.paidAmount)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-t border-slate-200 text-rose-600 font-black text-sm">
              <span>মিলের বকেয়া পাওনা (Due):</span>
              <span className="font-mono">{formatBDT(purchase.dueAmount)}</span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-16 grid grid-cols-2 text-center text-xs text-slate-600">
          <div>
            <div className="w-36 border-t border-slate-400 mx-auto mb-1" />
            <span>গোডাউন ইনচার্জ / মাল রিসিভার</span>
          </div>
          <div>
            <div className="w-36 border-t border-slate-400 mx-auto mb-1" />
            <span>অনুমোদনকারী স্বাক্ষর</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PurchaseBillPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">ক্রয় বিল লোড হচ্ছে...</p>
        </div>
      }
    >
      <PurchaseBillContent />
    </Suspense>
  );
}
