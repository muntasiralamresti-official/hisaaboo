'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../../../lib/api';
import { formatBDT, formatDate } from '../../../../lib/formatters';
import { ALL_MODULES } from '../../../../lib/templates';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  Key,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PlusCircle,
  Save,
  Clock,
  ShieldCheck,
} from 'lucide-react';

function BusinessDetailContent() {
  const { id } = useParams();
  const router = useRouter();

  const [business, setBusiness] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit details form state
  const [editData, setEditData] = useState({
    name: '',
    ownerName: '',
    phone: '',
    address: '',
    yearlyFee: 0,
    invoiceFooterNote: '',
    enabledModules: [],
  });

  // Payment record form state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(12000);
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [extendMonths, setExtendMonths] = useState(12);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Password reset state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const loadBusiness = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/admin/businesses/${id}`);
      if (res.success) {
        setBusiness(res.business);
        setOwner(res.owner);
        setEditData({
          name: res.business.name || '',
          ownerName: res.business.ownerName || '',
          phone: res.business.phone || '',
          address: res.business.address || '',
          yearlyFee: res.business.yearlyFee || 0,
          invoiceFooterNote: res.business.invoiceFooterNote || '',
          enabledModules: res.business.enabledModules || [],
        });
        setPaymentAmount(res.business.yearlyFee || 12000);
      } else {
        setError(res.message || 'ব্যবসার তথ্য লোড করা যায়নি');
      }
    } catch (err) {
      setError(err.message || 'ব্যবসার তথ্য লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadBusiness();
  }, [id]);

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setError('');

    try {
      const res = await fetchApi(`/admin/businesses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editData),
      });

      if (res.success) {
        setBusiness(res.business);
        setSuccessMsg('ব্যবসার তথ্য সফলভাবে আপডেট হয়েছে!');
      }
    } catch (err) {
      setError(err.message || 'আপডেট করতে সমস্যা হয়েছে');
    }
  };

  const handleToggleSuspend = async () => {
    const nextSuspended = !business.isSuspended;
    const msg = nextSuspended
      ? `আপনি কি "${business.name}" ব্যবসাটি সাময়িকভাবে সাসপেন্ড করতে চান?`
      : `আপনি কি "${business.name}" ব্যবসাটি পুনরায় সক্রিয় করতে চান?`;

    if (!window.confirm(msg)) return;

    try {
      const res = await fetchApi(`/admin/businesses/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isSuspended: nextSuspended }),
      });

      if (res.success) {
        setBusiness(res.business);
        setSuccessMsg(res.message);
      }
    } catch (err) {
      setError(err.message || 'স্ট্যাটাস আপডেট ব্যর্থ');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    setError('');

    try {
      const res = await fetchApi(`/admin/businesses/${id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(paymentAmount),
          method: paymentMethod,
          extendMonths: Number(extendMonths),
          notes: paymentNotes,
        }),
      });

      if (res.success) {
        setBusiness(res.business);
        setShowPaymentModal(false);
        setPaymentNotes('');
        setSuccessMsg('পেমেন্ট সফলভাবে সংরক্ষিত হয়েছে এবং সাবস্ক্রিপশন মেয়াদ বৃদ্ধি করা হয়েছে!');
      }
    } catch (err) {
      setError(err.message || 'পেমেন্ট সংরক্ষণ ব্যর্থ');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    setPassLoading(true);
    try {
      const res = await fetchApi(`/admin/businesses/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });

      if (res.success) {
        setShowPasswordModal(false);
        setNewPassword('');
        setSuccessMsg(res.message);
      }
    } catch (err) {
      alert(err.message || 'পাসওয়ার্ড রিসেট ব্যর্থ');
    } finally {
      setPassLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">ব্যবসার বিস্তারিত লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-8 bg-white rounded-2xl border text-center text-slate-500">
        ব্যবসাটি পাওয়া যায়নি।{' '}
        <Link href="/admin/businesses" className="text-blue-600 underline">
          তালিকায় ফিরে যান
        </Link>
      </div>
    );
  }

  const isExpired = new Date(business.paidUntil) < new Date();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/businesses"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {business.name}
              </h1>
              <span
                className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  business.businessType === 'yarn'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {business.businessType === 'yarn' ? 'সুতা ব্যবসা (Yarn)' : 'জেনারেল ট্রেডিং'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              মালিক: {business.ownerName} • মোবাইল: {business.phone}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
          >
            <CreditCard className="w-4 h-4" />
            <span>পেমেন্ট রেকর্ড ও রিনিউ</span>
          </button>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
          >
            <Key className="w-4 h-4" />
            <span>পাসওয়ার্ড রিসেট</span>
          </button>
          <button
            onClick={handleToggleSuspend}
            className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
              business.isSuspended
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            {business.isSuspended ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>সক্রিয় করুন</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span>সাসপেন্ড করুন</span>
              </>
            )}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Subscription Status Card */}
      <div
        className={`p-5 rounded-2xl border ${
          business.isSuspended
            ? 'bg-slate-100 border-slate-300 text-slate-800'
            : isExpired
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                business.isSuspended
                  ? 'bg-slate-200 text-slate-700'
                  : isExpired
                  ? 'bg-rose-200 text-rose-700'
                  : 'bg-emerald-200 text-emerald-800'
              }`}
            >
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                সাবস্ক্রিপশন স্ট্যাটাস:{' '}
                {business.isSuspended
                  ? 'সাসপেন্ড করা হয়েছে'
                  : isExpired
                  ? 'মেয়াদ শেষ (Expired)'
                  : 'সক্রিয় (Active)'}
              </h3>
              <p className="text-xs opacity-80 mt-0.5">
                পরবর্তী মেয়াদ শেষ হওয়ার তারিখ: <strong>{formatDate(business.paidUntil)}</strong>
                {isExpired && !business.isSuspended && ' — ক্লায়েন্ট লকড অবস্থায় রয়েছে।'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs opacity-75">বাৎসরিক চার্জ</div>
            <div className="text-xl font-black">{formatBDT(business.yearlyFee)}</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Edit Form + Payment History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Edit Settings & Modules (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <form
            onSubmit={handleUpdateDetails}
            className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4"
          >
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>ব্যবসার বিবরণ পরিবর্তন করুন</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ব্যবসার নাম
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  মালিকের নাম
                </label>
                <input
                  type="text"
                  value={editData.ownerName}
                  onChange={(e) => setEditData({ ...editData, ownerName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  মোবাইল নম্বর
                </label>
                <input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  বাৎসরিক ফি (৳)
                </label>
                <input
                  type="number"
                  value={editData.yearlyFee}
                  onChange={(e) => setEditData({ ...editData, yearlyFee: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ঠিকানা
                </label>
                <input
                  type="text"
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Modules Selector */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                অনুমোদিত মডিউলসমূহ
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ALL_MODULES.map((mod) => {
                  const isChecked = editData.enabledModules.includes(mod.id);
                  return (
                    <label
                      key={mod.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                        isChecked
                          ? 'border-blue-600 bg-blue-50/50 font-semibold text-blue-900'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setEditData((prev) => ({
                            ...prev,
                            enabledModules: isChecked
                              ? prev.enabledModules.filter((m) => m !== mod.id)
                              : [...prev.enabledModules, mod.id],
                          }));
                        }}
                        className="w-3.5 h-3.5 rounded text-blue-600"
                      />
                      <span>{mod.name.bn}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>পরিবর্তন সংরক্ষণ করুন</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Payment History Timeline (1 Col) */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>পেমেন্ট হিস্ট্রি</span>
              </h2>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
              >
                + নতুন পেমেন্ট
              </button>
            </div>

            {business.paymentHistory && business.paymentHistory.length > 0 ? (
              <div className="space-y-3">
                {business.paymentHistory
                  .slice()
                  .reverse()
                  .map((p, idx) => (
                    <div
                      key={p._id || idx}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{formatBDT(p.amount)}</span>
                        <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                          {p.method}
                        </span>
                      </div>
                      <div className="text-slate-500 flex items-center justify-between text-[11px]">
                        <span>{formatDate(p.date)}</span>
                      </div>
                      {p.notes && <div className="text-slate-600 italic">{p.notes}</div>}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">
                এখনো কোনো পেমেন্ট রেকর্ড নেই।
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              বাৎসরিক পেমেন্ট গ্রহণ ও মেয়াদ বৃদ্ধি
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              টাকা জমার এন্ট্রি দিন এবং সাবস্ক্রিপশন মেয়াদ বাড়িয়ে দিন
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  জমার পরিমাণ (টাকা)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পেমেন্ট মাধ্যম
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="cash">নগদ (Cash)</option>
                  <option value="bKash">বিকাশ (bKash)</option>
                  <option value="Nagad">নগদ (Nagad)</option>
                  <option value="bank">ব্যাংক ট্রান্সফার</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  মেয়াদ বৃদ্ধি (মাস)
                </label>
                <select
                  value={extendMonths}
                  onChange={(e) => setExtendMonths(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="12">১২ মাস (১ বছর)</option>
                  <option value="6">৬ মাস</option>
                  <option value="24">২৪ মাস (২ বছর)</option>
                  <option value="1">১ মাস</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  মন্তব্য / রেফারেন্স
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="যেমন: TrxID বা চেক নম্বর"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm disabled:opacity-60"
                >
                  {paymentLoading ? 'সংরক্ষণ হচ্ছে...' : 'পেমেন্ট নিশ্চিত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              মালিকের পাসওয়ার্ড রিসেট
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              ওনার <strong>{business.ownerName}</strong> ({business.phone}) এর জন্য নতুন পাসওয়ার্ড দিন
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="নতুন পাসওয়ার্ড দিন"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={passLoading}
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm disabled:opacity-60"
                >
                  {passLoading ? 'রিসেট হচ্ছে...' : 'পাসওয়ার্ড সেট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BusinessDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">ব্যবসার বিস্তারিত লোড হচ্ছে...</p>
        </div>
      }
    >
      <BusinessDetailContent />
    </Suspense>
  );
}
