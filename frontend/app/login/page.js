'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/authContext';
import Logo from '../../components/ui/Logo';
import { Lock, Phone, ArrowRight, AlertCircle, Eye, EyeOff, Sparkles, ShieldCheck, Globe } from 'lucide-react';
import bn from '../../messages/bn';
import en from '../../messages/en';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, language, toggleLanguage } = useAuth();
  const router = useRouter();

  const m = language === 'en' ? en : bn;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phone || !password) {
      setError(
        language === 'en'
          ? 'Please provide both mobile number and password.'
          : 'মোবাইল নম্বর এবং পাসওয়ার্ড উভয়ই প্রদান করুন।'
      );
      return;
    }

    setIsSubmitting(true);
    const result = await login(phone, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(
        result.message ||
          (language === 'en'
            ? 'Invalid mobile number or password.'
            : 'মোবাইল নম্বর অথবা পাসওয়ার্ড সঠিক নয়।')
      );
    }
  };

  const setDemoCredentials = (demoPhone, demoPass) => {
    setPhone(demoPhone);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-50 overflow-hidden">
      {/* Decorative Background Elements */}
      {/* Dot Grid Pattern */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Ambient Gradient Glow Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 -right-40 w-96 h-96 bg-blue-300/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Box */}
      <div className="relative z-10 w-full max-w-md">
        {/* Language Switcher Pill */}
        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs hover:bg-white text-slate-700 text-xs font-bold transition-all cursor-pointer"
            title={language === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
          </button>
        </div>

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-2xl bg-white shadow-md shadow-blue-500/10 ring-1 ring-slate-200/80 mb-3.5 transition-transform hover:scale-105 duration-300">
            <Logo size="lg" showText={false} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Hisaaboo
          </h1>
          <p className="text-sm font-semibold text-slate-600 mt-1 flex items-center gap-1.5">
            <span>{m.tagline}</span>
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-300/60 border border-slate-200/80 p-7 sm:p-9">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {m.login.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {m.login.subtitle}
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                {m.login.phone_label}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={m.login.phone_placeholder}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-sm transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                {m.login.password_label}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={m.login.password_placeholder}
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-sm transition-all shadow-inner"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{m.login.logging_in}</span>
                </>
              ) : (
                <>
                  <span>{m.login.submit_btn}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins Box */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{language === 'en' ? 'Quick Demo Login (Click to fill):' : 'সহজ ডেমো লগইন (ক্লিক করুন):'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDemoCredentials('01800000000', 'admin123')}
                className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 font-medium text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-blue-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  <span>{language === 'en' ? 'Superadmin' : 'সুপারএডমিন'}</span>
                </div>
                <div className="text-[11px] text-blue-600">01800000000</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('01711111111', 'owner123')}
                className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 font-medium text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-indigo-800">{language === 'en' ? 'Yarn Trader Owner' : 'সুতা ট্রেডার ওনার'}</div>
                <div className="text-[11px] text-indigo-600">01711111111</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-xs font-medium text-slate-500">
          {language === 'en' ? '© 2026 Hisaaboo Platform. All rights reserved.' : '© 2026 Hisaaboo Platform. সার্বিক সহযোগিতায়।'}
        </p>
      </div>
    </div>
  );
}
