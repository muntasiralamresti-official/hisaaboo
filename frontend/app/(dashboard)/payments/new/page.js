'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../../../lib/api';
import { formatBDT } from '../../../../lib/formatters';
import { useAuth } from '../../../../lib/authContext';
import {
  ArrowLeft,
  CreditCard,
  Save,
  AlertCircle,
  Users,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

function NewPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPartyId = searchParams.get('partyId') || '';

  const [type, setType] = useState('received'); // 'received' or 'paid'
  const [partyId, setPartyId] = useState(initialPartyId);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadParties() {
      try {
        const filterType = type === 'received' ? 'customer' : 'supplier';
        const res = await fetchApi(`/parties?type=${filterType}`);
        if (res.success) {
          setParties(res.parties || []);
        }
      } catch (err) {
        console.error('Failed to load parties:', err);
      }
    }
    loadParties();
  }, [type]);

  const selectedParty = parties.find((p) => p._id === partyId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmt = Number(amount);
    if (!numAmt || numAmt <= 0) {
      setError('সঠিক টাকার পরিমাণ দিন');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi('/payments', {
        method: 'POST',
        body: JSON.stringify({
          partyId: partyId || null,
          type,
          amount: numAmt,
          method,
          date,
          notes,
        }),
      });

      if (res.success) {
        if (partyId) {
          router.push(`/parties/${partyId}`);
        } else {
          router.push('/payments');
        }
      } else {
        setError(res.message || 'পেমেন্ট সংরক্ষণ ব্যর্থ');
      }
    } catch (err) {
      setError(err.message || 'পেমেন্ট সংরক্ষণ ব্যর্থ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/payments"
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            টাকা জমা ও পরিশোধ এন্ট্রি
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            কাস্টমারের বকেয়া আদায় বা মহাজন পাওনা পরিশোধের ভাউচার
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        {/* Type Switcher */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            লেনদেনের ধরন *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setType('received');
                setPartyId('');
              }}
              className={`py-3 px-4 rounded-2xl border text-xs font-black transition-all cursor-pointer ${
                type === 'received'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              ↓ টাকা জমা / বাকি আদায় (Received)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('paid');
                setPartyId('');
              }}
              className={`py-3 px-4 rounded-2xl border text-xs font-black transition-all cursor-pointer ${
                type === 'paid'
                  ? 'border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-600'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              ↑ টাকা পরিশোধ / মহাজন দেনা (Paid)
            </button>
          </div>
        </div>

        {/* Party Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            {type === 'received' ? 'কোন কাস্টমার টাকা জমা দিচ্ছে?' : 'কোন মহাজনকে পরিশোধ করছেন?'}
          </label>
          <select
            value={partyId}
            onChange={(e) => {
              setPartyId(e.target.value);
              const p = parties.find((item) => item._id === e.target.value);
              if (p && p.currentBalance) {
                setAmount(Math.abs(p.currentBalance));
              }
            }}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">-- পার্টি নির্বাচন করুন (অথবা সরাসরি ক্যাশ) --</option>
            {parties.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} {p.phone ? `(${p.phone})` : ''} • বর্তমান বাকি:{' '}
                {formatBDT(Math.abs(p.currentBalance || 0))}
              </option>
            ))}
          </select>
          {selectedParty && (
            <div className="mt-2 text-xs font-bold text-slate-700 flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border">
              <span>এই পার্টির বর্তমান বাকি:</span>
              <span className="text-rose-600 font-mono text-sm">
                {formatBDT(Math.abs(selectedParty.currentBalance || 0))}
              </span>
            </div>
          )}
        </div>

        {/* Amount & Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              টাকার পরিমাণ (৳) *
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-base font-black focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              পেমেন্ট মাধ্যম *
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="cash">নগদ (Cash)</option>
              <option value="bKash">বিকাশ (bKash)</option>
              <option value="Nagad">নগদ (Nagad)</option>
              <option value="bank">ব্যাংক ট্রান্সফার</option>
            </select>
          </div>
        </div>

        {/* Date & Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            তারিখ
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            বিবরণ / রেফারেন্স (রশিদ নং, TrxID বা চেক নম্বর)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="যেমন: বিকাশ TrxID বা ব্যাংক চেক নং..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Link
            href="/payments"
            className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
          >
            বাতিল
          </Link>
          <button
            type="submit"
            disabled={loading}
            className={`py-3 px-6 rounded-2xl text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 ${
              type === 'received'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
            }`}
          >
            {loading ? 'সংরক্ষণ হচ্ছে...' : type === 'received' ? 'টাকা জমা নিশ্চিত করুন' : 'পরিশোধ নিশ্চিত করুন'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">পেমেন্ট ফর্ম প্রস্তুত হচ্ছে...</p>
        </div>
      }
    >
      <NewPaymentContent />
    </Suspense>
  );
}
