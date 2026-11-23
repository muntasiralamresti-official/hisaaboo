'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../../lib/api';
import { useAuth } from '../../../lib/authContext';
import {
  Settings,
  Building,
  UserCheck,
  Phone,
  MapPin,
  FileText,
  Save,
  PlusCircle,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Database,
  Download,
} from 'lucide-react';

export default function SettingsPage() {
  const { business: currentBusiness, language, setLanguage, t } = useAuth();
  const [businessData, setBusinessData] = useState({
    name: '',
    address: '',
    phone: '',
    logo: '',
    invoiceFooterNote: '',
    language: 'bn',
  });
  const [staffUsers, setStaffUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // New staff form state
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', phone: '', password: '' });
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/settings');
      if (res.success && res.business) {
        setBusinessData({
          name: res.business.name || '',
          address: res.business.address || '',
          phone: res.business.phone || '',
          logo: res.business.logo || '',
          invoiceFooterNote: res.business.invoiceFooterNote || '',
          language: res.business.language || 'bn',
        });
        setStaffUsers(res.staffUsers || []);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await fetchApi('/settings', {
        method: 'PUT',
        body: JSON.stringify(businessData),
      });

      if (res.success) {
        if (businessData.language) {
          setLanguage(businessData.language);
        }
        setFeedback({
          type: 'success',
          message:
            businessData.language === 'en'
              ? 'Business settings updated successfully!'
              : 'ব্যবসায়িক সেটিংস সফলভাবে আপডেট করা হয়েছে!',
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.message || (language === 'en' ? 'Failed to update settings' : 'সেটিংস আপডেট ব্যর্থ'),
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.data?.message || err.message || (language === 'en' ? 'Server error' : 'সার্ভার সমস্যা'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setStaffError('');
    setStaffLoading(true);

    try {
      const res = await fetchApi('/settings/users', {
        method: 'POST',
        body: JSON.stringify(newStaff),
      });

      if (res.success) {
        setShowStaffModal(false);
        setNewStaff({ name: '', phone: '', password: '' });
        loadSettings();
        setFeedback({
          type: 'success',
          message: language === 'en' ? 'New staff account created successfully!' : 'নতুন স্টাফ সফলভাবে যোগ করা হয়েছে!',
        });
      } else {
        setStaffError(res.message || (language === 'en' ? 'Failed to add staff' : 'স্টাফ যুক্ত করতে ব্যর্থ'));
      }
    } catch (err) {
      setStaffError(err.data?.message || err.message || (language === 'en' ? 'Server error' : 'সার্ভার সমস্যা'));
    } finally {
      setStaffLoading(false);
    }
  };

  const [backupLoading, setBackupLoading] = useState(false);
  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetchApi('/settings/backup');
      if (res.success) {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        const fileName = `hisaaboo_backup_${(businessData.name || 'business').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        downloadAnchor.setAttribute('download', fileName);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setFeedback({
          type: 'success',
          message: language === 'en' ? 'Complete business backup downloaded successfully!' : 'সম্পূর্ণ ব্যবসায়িক ব্যাকআপ সফলভাবে ডাউনলোড হয়েছে!',
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.message || (language === 'en' ? 'Backup creation failed' : 'ব্যাকআপ তৈরি ব্যর্থ'),
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || (language === 'en' ? 'Backup error' : 'ব্যাকআপ ত্রুটি'),
      });
    } finally {
      setBackupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-indigo-600" />
          <span>{language === 'en' ? 'Business Settings & Profile' : 'ব্যবসার সেটিংস ও প্রোফাইল'}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {language === 'en'
            ? 'White-label invoice branding, contact details, and staff access control'
            : 'হোয়াইট-লেবেল ইনভয়েস ব্র্যান্ডিং, যোগাযোগের তথ্য ও কর্মচারীদের এক্সেস কন্ট্রোল'}
        </p>
      </div>

      {feedback.message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-100">
          <Building className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">
            {language === 'en' ? 'Business Profile & Invoice Branding' : 'ব্যবসার সাধারণ তথ্য ও মেমো ব্র্যান্ডিং'}
          </h2>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                {language === 'en' ? 'Business / Trade Name *' : 'ব্যবসা / দোকানের নাম *'}
              </label>
              <input
                type="text"
                required
                value={businessData.name}
                onChange={(e) => setBusinessData({ ...businessData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-bold text-slate-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {language === 'en' ? 'Printed at the header of all invoices & challans' : 'সব ইনভয়েস ও চালানের শীর্ষে এই নামটি প্রিন্ট হবে'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                {language === 'en' ? 'Official Phone Number' : 'অফিসিয়াল ফোন নম্বর'}
              </label>
              <input
                type="text"
                value={businessData.phone}
                onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm text-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              {language === 'en' ? 'Shop or Warehouse Address' : 'দোকান বা গোডাউনের ঠিকানা'}
            </label>
            <input
              type="text"
              value={businessData.address}
              onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm text-slate-900"
              placeholder={language === 'en' ? 'e.g. Tanbazar, Narayanganj' : 'যেমন: টানবাজার, নারায়ণগঞ্জ'}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              {language === 'en' ? 'Invoice Footer Terms / Message' : 'চালানের নিচের শর্তাবলী / বার্তা (Invoice Footer Note)'}
            </label>
            <textarea
              rows="3"
              value={businessData.invoiceFooterNote}
              onChange={(e) => setBusinessData({ ...businessData, invoiceFooterNote: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm text-slate-900"
              placeholder={
                language === 'en'
                  ? 'e.g. Sold goods cannot be returned without receipt. Errors are subject to correction.'
                  : 'যেমন: বিক্রিত মাল ফেরত নেওয়া হয় না। ভুলভ্রান্তি মার্জনীয়।'
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                {language === 'en' ? 'System Language' : 'ভাষা (Language)'}
              </label>
              <select
                value={businessData.language}
                onChange={(e) => setBusinessData({ ...businessData, language: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-bold text-slate-800 bg-white"
              >
                <option value="bn">বাংলা (Bengali)</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                {language === 'en' ? 'Business Type & Template' : 'ব্যবসার ধরন ও টেমপ্লেট'}
              </label>
              <div className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-600">
                {currentBusiness?.businessType === 'yarn'
                  ? (language === 'en' ? 'Yarn Trading (সুতা ব্যবসা)' : 'সুতা ব্যবসা (Yarn Trading)')
                  : (language === 'en' ? 'General Trading (সাধারণ ব্যবসা)' : 'সাধারণ ব্যবসা (General)')}
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? t('saving') : (language === 'en' ? 'Save Settings' : 'সেটিংস সংরক্ষণ করুন')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Data Backup Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">{t('backup_title')}</h2>
              <p className="text-xs text-slate-500">{t('backup_desc')}</p>
            </div>
          </div>

          <button
            onClick={handleDownloadBackup}
            disabled={backupLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer self-start sm:self-auto disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{backupLoading ? (language === 'en' ? 'Generating Backup...' : 'ব্যাকআপ তৈরি হচ্ছে...') : t('backup_download')}</span>
          </button>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          {language === 'en'
            ? '💡 This backup JSON file contains an offline snapshot of all your customers, inventory stock balances, invoices, vouchers, and transactions. Keep periodic downloads saved on an external drive or cloud storage.'
            : '💡 এই ব্যাকআপ ফাইলটিতে আপনার দোকানের সকল গ্রাহক খতিয়ান, বর্তমান পণ্য মজুদ, ইনভয়েস ও রসিদের সম্পূর্ণ হিস্টোরি এনকোডেড অবস্থায় থাকবে। নিয়মিত ব্যাকআপ ডাউনলোড করে পেনড্রাইভ বা গুগল ড্রাইভে সেভ করে রাখুন।'}
        </p>
      </div>

      {/* Staff Management Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">{t('staff_management')}</h2>
              <p className="text-xs text-slate-500">
                {language === 'en'
                  ? 'Create staff accounts for your shop employees with limited access'
                  : 'আপনার দোকানের কর্মচারীদের জন্য সীমিত সুবিধার অ্যাকাউন্ট তৈরি করুন'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowStaffModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{language === 'en' ? 'Add New Staff' : 'নতুন স্টাফ যোগ করুন'}</span>
          </button>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">{language === 'en' ? 'Staff Name' : 'নাম'}</th>
                <th className="px-4 py-3">{language === 'en' ? 'Mobile Phone' : 'মোবাইল ফোন নম্বর'}</th>
                <th className="px-4 py-3">{language === 'en' ? 'Role' : 'ভূমিকা (Role)'}</th>
                <th className="px-4 py-3">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-xs">
                    {language === 'en' ? 'No staff accounts added yet.' : 'এখনও কোনো স্টাফ অ্যাকাউন্ট যোগ করা হয়নি।'}
                  </td>
                </tr>
              ) : (
                staffUsers.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{s.name}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{s.phone}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {language === 'en' ? 'Staff' : 'Staff (কর্মচারী)'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {language === 'en' ? 'Active' : 'সক্রিয় (Active)'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <span>{language === 'en' ? 'Add Staff Account' : 'নতুন স্টাফ যোগ করুন'}</span>
              </h3>
              <button
                onClick={() => setShowStaffModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {staffError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {staffError}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Staff Full Name *' : 'স্টাফের পুরো নাম *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'en' ? 'e.g. Rafiq Uddin' : 'যেমন: মো: রফিক উদ্দিন'}
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Login Mobile Number *' : 'লগইন ফোন নম্বর *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="01700000000"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Login Password (Min. 6 chars) *' : 'লগইন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) *'}
                </label>
                <input
                  type="password"
                  required
                  minLength="6"
                  placeholder="••••••••"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={staffLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {staffLoading ? (language === 'en' ? 'Adding...' : 'যুক্ত হচ্ছে...') : (language === 'en' ? 'Create Staff' : 'স্টাফ অ্যাকাউন্ট তৈরি করুন')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
