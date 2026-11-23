'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../../../lib/api';
import { formatBDT, formatDate } from '../../../../lib/formatters';
import { useAuth } from '../../../../lib/authContext';
import { ArrowLeft, Printer, CheckCircle2, ShoppingCart, FileText, AlertCircle } from 'lucide-react';

function QuotationViewContent() {
  const { id } = useParams();
  const router = useRouter();
  const { business } = useAuth();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [message, setMessage] = useState('');

  const loadQuotation = async () => {
    try {
      const res = await fetchApi(`/quotations/${id}`);
      if (res.success) {
        setQuotation(res.quotation);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadQuotation();
  }, [id]);

  const handleConvert = async () => {
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই কোটেশনটিকে আসল বিক্রয় চালানে রূপান্তর করতে চান? পণ্যগুলোর স্টক কমে যাবে।')) return;
    setConverting(true);
    try {
      const res = await fetchApi(`/quotations/${id}/convert`, { method: 'POST' });
      if (res.success && res.saleId) {
        router.push(`/sales/${res.saleId}`);
      } else {
        alert(res.message || 'চালানে রূপান্তর ব্যর্থ');
      }
    } catch (err) {
      alert('রূপান্তর ব্যর্থ হয়েছে');
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">কোটেশন লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border text-slate-500">
        কোটেশন পাওয়া যায়নি।{' '}
        <Link href="/quotations" className="text-indigo-600 underline">
          তালিকায় ফিরুন
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/quotations"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">কোটেশন #{quotation.quotationNo}</h1>
            <p className="text-xs text-slate-500">{formatDate(quotation.date)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {quotation.status !== 'converted' ? (
            <button
              onClick={handleConvert}
              disabled={converting}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{converting ? 'রূপান্তর হচ্ছে...' : 'বিক্রয় চালানে রূপান্তর করুন'}</span>
            </button>
          ) : (
            <span className="py-2 px-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>চালানে রূপান্তরিত সম্পন্ন</span>
            </span>
          )}

          <button
            onClick={() => window.print()}
            className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট করুন</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-md print:shadow-none print:border-none print:p-0 space-y-6 text-slate-900">
        <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{business?.name || 'ব্যবসায়িক প্রতিষ্ঠান'}</h2>
            <p className="text-xs text-slate-600 mt-1">{business?.address || ''}</p>
            <p className="text-xs text-slate-600">ফোন: {business?.phone}</p>
          </div>

          <div className="text-right sm:self-center">
            <span className="inline-block py-1.5 px-4 rounded-lg bg-indigo-950 text-white text-xs sm:text-sm font-black uppercase tracking-widest">
              দরপত্র / কোটেশন
            </span>
            <div className="mt-2 text-xs font-bold text-slate-600">
              নম্বর: <span className="text-slate-900 font-mono">{quotation.quotationNo}</span>
            </div>
            <div className="text-xs text-slate-600">তারিখ: {formatDate(quotation.date)}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">প্রাপক:</span>
          <h3 className="text-sm font-bold text-slate-900 mt-0.5">{quotation.partyId?.name}</h3>
          {quotation.partyId?.address && <p className="text-slate-600 mt-0.5">{quotation.partyId.address}</p>}
          {quotation.partyId?.phone && <p className="text-slate-600 mt-0.5">ফোন: {quotation.partyId.phone}</p>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">নং</th>
                <th className="py-2.5 px-3">সুতা ও পণ্যের বিবরণ</th>
                <th className="py-2.5 px-3 text-right">পরিমাণ</th>
                <th className="py-2.5 px-3 text-right">প্রস্তাবিত দর</th>
                <th className="py-2.5 px-3 text-right font-black">মোট টাকা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {quotation.items?.map((it, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{it.productName}</td>
                  <td className="py-2.5 px-3 text-right font-bold">{it.quantity} {it.unit}</td>
                  <td className="py-2.5 px-3 text-right">{formatBDT(it.rate)}</td>
                  <td className="py-2.5 px-3 text-right font-black text-slate-900">{formatBDT(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
          <div className="text-xs text-slate-500 max-w-sm space-y-1">
            {quotation.notes && <p><strong>শর্তাবলী:</strong> {quotation.notes}</p>}
            {quotation.validUntil && <p className="text-amber-700 font-bold">* কোটেশনের মেয়াদ: {formatDate(quotation.validUntil)} পর্যন্ত কার্যকর।</p>}
          </div>

          <div className="w-full sm:w-64 space-y-1.5 text-xs">
            <div className="flex justify-between py-1 text-slate-600">
              <span>মোট মূল্য:</span>
              <span className="font-bold">{formatBDT(quotation.subTotal)}</span>
            </div>
            {quotation.discount > 0 && (
              <div className="flex justify-between py-1 text-rose-600">
                <span>ছাড়:</span>
                <span className="font-bold">- {formatBDT(quotation.discount)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t border-b border-slate-900 font-black text-sm text-indigo-950">
              <span>প্রস্তাবিত সর্বমোট:</span>
              <span>{formatBDT(quotation.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="pt-16 grid grid-cols-2 text-center text-xs text-slate-600">
          <div>
            <div className="w-36 border-t border-slate-400 mx-auto mb-1" />
            <span>প্রস্তুতকারকের স্বাক্ষর</span>
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

export default function QuotationViewPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-400">লোড হচ্ছে...</div>}>
      <QuotationViewContent />
    </Suspense>
  );
}
