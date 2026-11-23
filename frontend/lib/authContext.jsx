'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from './api';
import { t as i18nT } from './i18n';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguageState] = useState('bn');
  const router = useRouter();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('hisaaboo_lang');
      if (saved && (saved === 'en' || saved === 'bn')) {
        setLanguageState(saved);
      }
    } catch (e) {}
  }, []);

  const setLanguage = (lang) => {
    const nextLang = lang === 'en' ? 'en' : 'bn';
    setLanguageState(nextLang);
    try {
      localStorage.setItem('hisaaboo_lang', nextLang);
    } catch (e) {}
  };

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  const t = (key, fallback = '') => i18nT(key, language, fallback);

  // Load current user session on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetchApi('/auth/me');
        if (res.success && res.user) {
          setUser(res.user);
          setBusiness(res.business);
          setTemplate(res.template);
          if (res.business?.language && !localStorage.getItem('hisaaboo_lang')) {
            setLanguageState(res.business.language);
          }
        }
      } catch (err) {
        // Not logged in or session expired
        setUser(null);
        setBusiness(null);
        setTemplate(null);
        localStorage.removeItem('hisaaboo_token');
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  // Login handler
  const login = async (phone, password) => {
    try {
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      });

      if (res.success) {
        setUser(res.user);
        setBusiness(res.business);
        setTemplate(res.template);
        if (res.token) {
          localStorage.setItem('hisaaboo_token', res.token);
        }

        // Redirect based on role
        if (res.user.role === 'superadmin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }

        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      return {
        success: false,
        message: err.data?.message || err.message || 'Login failed',
      };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setBusiness(null);
      setTemplate(null);
      localStorage.removeItem('hisaaboo_token');
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        template,
        loading,
        isAuthenticated: !!user,
        isSuperAdmin: user?.role === 'superadmin',
        isOwner: user?.role === 'owner',
        isStaff: user?.role === 'staff',
        language,
        setLanguage,
        toggleLanguage,
        t,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
