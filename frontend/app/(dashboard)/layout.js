'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/authContext';
import Logo from '../../components/ui/Logo';
import { getTemplateLabel } from '../../lib/templates';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  ShoppingBag,
  CreditCard,
  Receipt,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Store,
  Truck,
  RotateCcw,
  FileText,
  Landmark,
  UserCheck,
  Globe,
} from 'lucide-react';

function DashboardLayoutContent({ children }) {
  const { user, business, template, loading, logout, isSuperAdmin, language, toggleLanguage, t } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If loading session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">{t('loading', 'লোড হচ্ছে...')}</p>
        </div>
      </div>
    );
  }

  // If unauthenticated or superadmin without business
  if (!user) {
    router.replace('/login');
    return null;
  }

  if (isSuperAdmin) {
    router.replace('/admin');
    return null;
  }

  // Check if subscription expired
  if (business?.subscriptionStatus === 'expired') {
    router.replace('/subscription-expired');
    return null;
  }

  const businessType = business?.businessType || 'general';

  // Dynamic labels based on business template overrides
  const partyLabel = getTemplateLabel(businessType, 'party', language, t('nav_parties', 'পার্টি খাতা'));
  const saleLabel = getTemplateLabel(businessType, 'sale', language, t('nav_sales', 'বিক্রয় / মেমো'));
  const purchaseLabel = getTemplateLabel(businessType, 'purchase', language, t('nav_purchases', 'ক্রয় হিসাব'));
  const productLabel = getTemplateLabel(businessType, 'product', language, t('nav_products', 'পণ্য ও স্টক'));

  // All potential nav items with template overrides
  const navItems = [
    {
      id: 'dashboard',
      name: t('nav_dashboard', 'ড্যাশবোর্ড'),
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard',
    },
    {
      id: 'parties',
      name: partyLabel,
      href: '/parties',
      icon: Users,
      active: pathname.startsWith('/parties'),
    },
    {
      id: 'products',
      name: productLabel,
      href: '/products',
      icon: Package,
      active: pathname.startsWith('/products'),
    },
    {
      id: 'sales',
      name: saleLabel,
      href: '/sales',
      icon: ShoppingCart,
      active: pathname.startsWith('/sales'),
    },
    {
      id: 'purchases',
      name: purchaseLabel,
      href: '/purchases',
      icon: ShoppingBag,
      active: pathname.startsWith('/purchases'),
    },
    {
      id: 'challans',
      name: getTemplateLabel(businessType, 'deliveryChallan', language, t('nav_challans', 'ডেলিভারি চালান হাব')),
      href: '/challans',
      icon: Truck,
      active: pathname.startsWith('/challans'),
    },
    {
      id: 'quotations',
      name: t('nav_quotations', 'দরপত্র / কোটেশন'),
      href: '/quotations',
      icon: FileText,
      active: pathname.startsWith('/quotations'),
    },
    {
      id: 'returns',
      name: t('nav_returns', 'ফেরত ও ড্যামেজ'),
      href: '/returns',
      icon: RotateCcw,
      active: pathname.startsWith('/returns'),
    },
    {
      id: 'payments',
      name: t('nav_payments', 'লেনদেন / পেমেন্ট'),
      href: '/payments',
      icon: CreditCard,
      active: pathname.startsWith('/payments'),
    },
    {
      id: 'banking',
      name: t('nav_banking', 'ব্যাংক হিসাব ও চেক'),
      href: '/banking',
      icon: Landmark,
      active: pathname.startsWith('/banking'),
    },
    {
      id: 'cashbook',
      name: t('nav_cashbook', 'ক্যাশ বুক / রোজনামচা'),
      href: '/cashbook',
      icon: BookOpen,
      active: pathname.startsWith('/cashbook'),
    },
    {
      id: 'expenses',
      name: t('nav_expenses', 'অফিস খরচ'),
      href: '/expenses',
      icon: Receipt,
      active: pathname.startsWith('/expenses'),
    },
    {
      id: 'payroll',
      name: t('nav_payroll', 'কর্মচারী ও বেতন'),
      href: '/payroll',
      icon: UserCheck,
      active: pathname.startsWith('/payroll'),
    },
    {
      id: 'reports',
      name: t('nav_reports', 'আর্থিক রিপোর্ট'),
      href: '/reports',
      icon: BarChart3,
      active: pathname.startsWith('/reports'),
    },
    {
      id: 'settings',
      name: t('nav_settings', 'সেটিংস'),
      href: '/settings',
      icon: Settings,
      active: pathname.startsWith('/settings'),
    },
  ];

  // Filter items by tenant's enabledModules (defaults to all modules if empty)
  const enabledModules = business?.enabledModules;
  const visibleNavItems = navItems.filter((item) => {
    if (!enabledModules || !Array.isArray(enabledModules) || enabledModules.length === 0) {
      return true;
    }
    return enabledModules.includes(item.id) || item.id === 'settings' || item.id === 'dashboard';
  });

  // Bottom navigation items (top 4 most used for mobile)
  const bottomNavItems = [
    { name: t('nav_dashboard', 'ড্যাশবোর্ড'), href: '/dashboard', icon: LayoutDashboard },
    { name: partyLabel.split('/')[0].trim(), href: '/parties', icon: Users },
    { name: saleLabel.split('/')[0].trim(), href: '/sales', icon: ShoppingCart },
    { name: t('nav_cashbook', 'ক্যাশ বুক').split('/')[0].trim(), href: '/cashbook', icon: BookOpen },
    { name: t('more', 'আরও'), href: '/settings', icon: Menu },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-16 md:pb-0">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Left: Mobile Toggle & Business Name */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate max-w-[200px] sm:max-w-xs">
                {business?.name || (language === 'en' ? 'Business Name' : 'ব্যবসার নাম')}
              </h1>
              <p className="text-[11px] text-slate-500 leading-none mt-0.5">
                {template?.name?.[language] || template?.name?.bn || t('tagline', 'ব্যবসায়িক হিসাব ও খাতা')}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Language Switcher, User Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher Pill */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title={language === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
          </button>

          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800">{user?.name}</span>
            <span className="text-[10px] text-emerald-600 font-semibold uppercase">
              {user?.role === 'owner' 
                ? (language === 'en' ? 'Owner' : 'মালিক (Owner)') 
                : (language === 'en' ? 'Staff' : 'স্টাফ (Staff)')}
            </span>
          </div>

          <button
            onClick={logout}
            className="p-2 sm:py-1.5 sm:px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title={t('logout', 'লগআউট')}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t('logout', 'লগআউট')}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Desktop Sidebar (Collapsible & Responsive) */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 shrink-0">
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    item.active
                      ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {item.active && <ChevronRight className="w-4 h-4 text-white/70" />}
                </Link>
              );
            })}
          </nav>

          {/* Platform Watermark footer */}
          <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            {language === 'en' ? 'Powered by ' : 'চালিত হচ্ছে '}
            <strong className="text-slate-600">Hisaaboo</strong>
            {language === 'en' ? ' Platform' : ' প্ল্যাটফর্মে'}
          </div>
        </aside>

        {/* Mobile Slide-over Drawer */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div
              className="w-72 max-w-[80vw] h-full bg-white p-4 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <Logo size="sm" />
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Language Switcher */}
              <div className="py-2 border-b border-slate-100">
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-700 text-xs font-bold transition-all cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>{language === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}</span>
                </button>
              </div>

              <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                        item.active
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('logout', 'লগআউট করুন')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Main View Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Shop owners use phones) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-2 py-1 flex items-center justify-around shadow-lg">
        {bottomNavItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={idx}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
