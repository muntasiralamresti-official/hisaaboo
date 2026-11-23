'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../../../lib/api';
import { formatBDT, formatDate } from '../../../../lib/formatters';
import { useAuth } from '../../../../lib/authContext';
import { getTemplateLabel } from '../../../../lib/templates';
import {
  ArrowLeft,
  Users,
  Phone,
  MapPin,
  Printer,
  Calendar,
  CreditCard,
  ShoppingCart,
  TrendingUp,
  FileText,
  Clock,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  MessageCircle,
} from 'lucide-react';

function PartyLedgerContent() {
  const { id } = useParams();
  const router = useRouter();
  const { business } = useAuth();
  const businessType = business?.businessType || 'general';

  const partyLabel = getTemplateLabel(businessType, 'party', 'bn', 'পার্টি');

  const [party, setParty] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadLedger = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetchApi(`/parties/${id}?${params.toString()}`);
      if (res.success) {
        setParty(res.party);
        setLedger(res.ledger || []);
      } else {
        setError(res.message || 'লেজার লোড করা যায়নি');
      }
    } catch (err) {
      setError(err.message || 'লেজার লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadLedger();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!party?.phone) {
      alert('পার্টির মোবাইল নম্বর পাওয়া যায়নি');
      return;
    }
    const cleanPhone = party.phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('88')
      ? cleanPhone
      : cleanPhone.startsWith('0')
      ? `88${cleanPhone}`
      : `880${cleanPhone}`;

    const curBal = party.currentBalance || 0;
    const dueTxt = curBal > 0
      ? `আপনার বর্তমান বকেয়া জের: ৳${Math.abs(curBal).toLocaleString('bn-BD')}`
      : curBal < 0
      ? `আপনার বর্তমান পাওনা জমা: ৳${Math.abs(curBal).toLocaleString('bn-BD')}`
      : 'আপনার পূর্বের সকল হিসাব পরিশোধিত ও ক্লিয়ার রয়েছে।';

    const msg = `আসসালামু আলাইকুম, ${party.name}।\n${business?.name || 'হিসাবূ'}-এর খাতা অনুযায়ী ${dueTxt}।\n\nপ্রয়োজনে যোগাযোগ করুন: ${business?.phone || ''}।\nধন্যবাদ।`;
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">খাতা লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!party) {
    return (
      <div className="p-8 bg-white rounded-3xl border text-center text-slate-500">
        পার্টি পাওয়া যায়নি।{' '}
        <Link href="/parties" className="text-blue-600 underline">
          তালিকায় ফিরে যান
        </Link>
      </div>
    );
  }

  const currentBalance = party.currentBalance || 0;
  const isDue = currentBalance > 0;
  const isPayable = currentBalance < 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/parties"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {party.name}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {party.type === 'supplier' ? 'মহাজন / মিল' : party.type === 'both' ? 'উভয়' : 'খরিদ্দার / কাস্টমার'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
              {party.phone && (
                <a href={`tel:${party.phone}`} className="flex items-center gap-1 hover:text-blue-600 font-medium">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{party.phone}</span>
                </a>
              )}
              {party.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{party.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>প্রিন্ট স্টেটমেন্ট</span>
          </button>
          {party.phone && (
            <button
              onClick={handleWhatsAppShare}
              className="py-2.5 px-4 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>হোয়াটসঅ্যাপ তাগাদা</span>
            </button>
          )}
          <Link
            href={`/payments/new?partyId=${party._id}`}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
          >
            <CreditCard className="w-4 h-4" />
            <span>টাকা জমা / আদায়</span>
          </Link>
          <Link
            href={`/sales/new?partyId=${party._id}`}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>নতুন মেমো</span>
          </Link>
        </div>
      </div>

      {/* Printable Header (Visible only during Print) */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h1 className="text-2xl font-black text-slate-900">{business?.name}</h1>
        <p className="text-xs text-slate-600">{business?.address} • মোবাইল: {business?.phone}</p>
        <div className="mt-3 py-1 px-3 bg-slate-100 rounded inline-block text-xs font-bold uppercase tracking-wider">
          লেজার খাতা বিবরণী (Statement of Accounts)
        </div>
        <div className="mt-2 text-sm text-left flex justify-between border-t pt-2">
          <div>
            <strong>পার্টির নাম:</strong> {party.name} <br />
            <strong>ঠিকানা:</strong> {party.address || '—'} | <strong>মোবাইল:</strong> {party.phone || '—'}
          </div>
          <div className="text-right">
            <strong>প্রিন্ট তারিখ:</strong> {formatDate(new Date())} <br />
            <strong>বর্তমান জের:</strong> {formatBDT(Math.abs(currentBalance))} ({isDue ? 'বাকি দেনাদার' : 'অগ্রিম জমা'})
          </div>
        </div>
      </div>

      {/* Balance Highlight Banner */}
      <div
        className={`p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
          isDue
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : isPayable
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
              isDue ? 'bg-rose-100 text-rose-700' : isPayable ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-75">
              বর্তমান নেট জের (Net Balance)
            </div>
            <div className="text-2xl sm:text-3xl font-black mt-0.5">
              {formatBDT(Math.abs(currentBalance))}
            </div>
          </div>
        </div>

        <div className="sm:text-right">
          <div className="text-sm font-bold">
            {isDue ? (
              <span className="text-rose-700">বাকি দেনাদার (আমরা টাকা পাবো)</span>
            ) : isPayable ? (
              <span className="text-amber-700">পাওনাদার (মহাজন টাকা পাবে)</span>
            ) : (
              <span className="text-emerald-700">কোনো বকেয়া নেই (হিসাব ক্লিয়ার)</span>
            )}
          </div>
          <p className="text-xs opacity-75 mt-0.5">
            সর্বমোট {ledger.length} টি লেনদেন অন্তর্ভুক্ত
          </p>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>তারিখ ফিল্টার:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <span className="text-slate-400">থেকে</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            onClick={loadLedger}
            className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
          >
            ফিল্টার করুন
          </button>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                loadLedger();
              }}
              className="py-2 px-3 text-slate-500 hover:text-slate-700 font-semibold underline"
            >
              রিসেট
            </button>
          )}
        </div>
      </div>

      {/* Running Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>লেনদেন বিবরণী ও রানিং ব্যালেন্স</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            সর্বশেষ আপডেট: {formatDate(new Date())}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">তারিখ</th>
                <th className="px-5 py-3.5">বিবরণ / ভাউচার</th>
                <th className="px-5 py-3.5 text-right text-rose-600">ডেবিট (+) মাল বিক্রয়</th>
                <th className="px-5 py-3.5 text-right text-emerald-600">ক্রেডিট (-) টাকা আদায়</th>
                <th className="px-5 py-3.5 text-right font-black">রানিং ব্যালেন্স (জের)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs sm:text-sm">
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 font-sans">
                    কোনো লেনদেন রেকর্ড নেই।
                  </td>
                </tr>
              ) : (
                ledger.map((entry, idx) => {
                  const bal = entry.balance || 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors font-sans">
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-600 font-mono text-xs">
                        {formatDate(entry.date)}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        {entry.reference}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-rose-600">
                        {entry.debit ? formatBDT(entry.debit) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-emerald-600">
                        {entry.credit ? formatBDT(entry.credit) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right font-black">
                        <span className={bal > 0 ? 'text-rose-600' : bal < 0 ? 'text-amber-600' : 'text-slate-600'}>
                          {formatBDT(Math.abs(bal))} {bal > 0 ? '(Dr)' : bal < 0 ? '(Cr)' : ''}
                        </span>
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

export default function PartyLedgerPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">খাতা লোড হচ্ছে...</p>
        </div>
      }
    >
      <PartyLedgerContent />
    </Suspense>
  );
}
