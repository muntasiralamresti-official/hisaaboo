'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/authContext';
import Logo from '../../components/ui/Logo';
import { AlertTriangle, PhoneCall, ShieldAlert, LogOut } from 'lucide-react';
import { formatDate } from '../../lib/formatters';

export default function SubscriptionExpiredPage() {
  const { business, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-rose-100 text-center">
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>

        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold text-slate-900 mb-2">
          সাবস্ক্রিপশনের মেয়াদ শেষ হয়েছে!
        </h1>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {business?.name ? (
            <span className="font-semibold text-slate-800">"{business.name}"</span>
          ) : (
            'আপনার ব্যবসা'
          )}{' '}
          প্রতিষ্ঠানের বাৎসরিক সাবস্ক্রিপশন মেয়াদ{' '}
          {business?.paidUntil ? (
            <span className="font-bold text-rose-600">
              {formatDate(business.paidUntil)}
            </span>
          ) : (
            'উত্তীর্ণ'
          )}{' '}
          হয়েছে। ডেটা সুরক্ষিত রয়েছে, পুনরায় ব্যবহারের জন্য অনুগ্রহ করে সার্ভিস রিনিউ করুন।
        </p>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 mb-6">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <PhoneCall className="w-4 h-4 text-blue-600" />
            <span>সাপোর্ট ও রিনিউয়াল হেল্পলাইন:</span>
          </div>
          <div className="text-slate-600">
            মোবাইল: <strong className="text-slate-900">01800-000000</strong>
          </div>
          <div className="text-slate-600">
            বিকাশ / নগদ পেমেন্ট রেফারেন্স: আপনার ব্যবসার রেজিস্টার্ড মোবাইল নম্বর
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>লগআউট করুন</span>
        </button>
      </div>
    </div>
  );
}
