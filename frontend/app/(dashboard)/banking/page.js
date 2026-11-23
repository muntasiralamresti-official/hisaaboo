'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../../lib/api';
import { formatBDT, formatDate } from '../../../lib/formatters';
import { useAuth } from '../../../lib/authContext';
import {
  Landmark,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Wallet,
  Building,
  CreditCard,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function BankingPage() {
  const { business, language, t } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [totalBankBalance, setTotalBankBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState('deposit'); // 'deposit' or 'withdraw'

  // New account form
  const [newAcc, setNewAcc] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    branchName: '',
    openingBalance: '0',
  });

  // New tx form
  const [newTx, setNewTx] = useState({
    bankAccountId: '',
    amount: '',
    chequeNo: '',
    reference: '',
    note: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadBankingData = async () => {
    setLoading(true);
    try {
      const [accRes, txRes] = await Promise.all([
        fetchApi('/banking/accounts'),
        fetchApi('/banking/transactions'),
      ]);
      if (accRes.success) {
        setAccounts(accRes.accounts || []);
        setTotalBankBalance(accRes.totalBankBalance || 0);
        if (accRes.accounts?.length > 0 && !newTx.bankAccountId) {
          setNewTx((prev) => ({ ...prev, bankAccountId: accRes.accounts[0]._id }));
        }
      }
      if (txRes.success) {
        setTransactions(txRes.transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBankingData();
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      const res = await fetchApi('/banking/accounts', {
        method: 'POST',
        body: JSON.stringify(newAcc),
      });
      if (res.success) {
        setShowAddModal(false);
        setNewAcc({ accountName: '', accountNumber: '', bankName: '', branchName: '', openingBalance: '0' });
        loadBankingData();
      } else {
        setModalError(res.message || (language === 'en' ? 'Failed to create account' : 'অ্যাকাউন্ট যুক্ত করতে ব্যর্থ'));
      }
    } catch (err) {
      setModalError(err.data?.message || err.message || (language === 'en' ? 'Server error' : 'সার্ভার সমস্যা'));
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      const res = await fetchApi('/banking/transactions', {
        method: 'POST',
        body: JSON.stringify({
          ...newTx,
          type: txType,
          amount: Number(newTx.amount),
        }),
      });
      if (res.success) {
        setShowTxModal(false);
        setNewTx({
          bankAccountId: accounts[0]?._id || '',
          amount: '',
          chequeNo: '',
          reference: '',
          note: '',
          date: new Date().toISOString().split('T')[0],
        });
        loadBankingData();
      } else {
        setModalError(res.message || (language === 'en' ? 'Failed to record transaction' : 'লেনদেন সংরক্ষণ ব্যর্থ'));
      }
    } catch (err) {
      setModalError(err.data?.message || err.message || (language === 'en' ? 'Server error' : 'সার্ভার সমস্যা'));
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Landmark className="w-7 h-7 text-indigo-600" />
            <span>{language === 'en' ? 'Bank Accounts & Cheque Registry' : 'ব্যাংক হিসাব ও চেক ট্র্যাকিং'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'en'
              ? 'Multi-bank accounts management, deposits, cheque clearing, and bank reconciliation'
              : 'বিভিন্ন ব্যাংকের হিসাব খতিয়ান, ক্যাশ ডিপোজিট, চেক ড্র এবং ব্যাংকিং লেনদেন'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setTxType('deposit');
              setShowTxModal(true);
            }}
            className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>{language === 'en' ? 'Deposit to Bank' : 'ব্যাংকে ক্যাশ জমা'}</span>
          </button>
          <button
            onClick={() => {
              setTxType('withdraw');
              setShowTxModal(true);
            }}
            className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{language === 'en' ? 'Withdraw from Bank' : 'ব্যাংক থেকে উত্তোলন'}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{language === 'en' ? 'Add Bank Account' : 'নতুন অ্যাকাউন্ট'}</span>
          </button>
        </div>
      </div>

      {/* Bank Account Cards */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>{language === 'en' ? 'Connected Bank Accounts' : 'যুক্তকৃত ব্যাংক অ্যাকাউন্টসমূহ'}</span>
          <span className="text-xs font-normal text-slate-400">({accounts.length} {language === 'en' ? 'Accounts' : 'টি'})</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div key={acc._id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{acc.accountName}</h3>
                    <p className="text-[11px] text-slate-500">{acc.bankName} {acc.branchName ? `(${acc.branchName})` : ''}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">{language === 'en' ? 'A/C Number' : 'হিসাব নং'}</span>
                  <p className="font-mono text-xs font-semibold text-slate-700">{acc.accountNumber}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">{language === 'en' ? 'Current Balance' : 'বর্তমান ব্যালেন্স'}</span>
                  <p className="text-base font-black text-indigo-700">{formatBDT(acc.currentBalance, language)}</p>
                </div>
              </div>
            </div>
          ))}

          {accounts.length === 0 && !loading && (
            <div className="col-span-full py-10 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-xs text-slate-400">
              {language === 'en'
                ? 'No bank accounts added yet. Click "+ Add Bank Account" above to link one.'
                : 'এখনও কোনো ব্যাংক হিসাব যুক্ত করা হয়নি। উপরে "নতুন অ্যাকাউন্ট" বাটনে ক্লিক করে যোগ করুন।'}
            </div>
          )}
        </div>
      </div>

      {/* Recent Bank Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">{language === 'en' ? 'Recent Bank Transactions & Cheques' : 'সাম্প্রতিক ব্যাংকিং লেনদেন ও চেক রেকর্ড'}</h2>
          <button
            onClick={loadBankingData}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer"
            title={t('refresh', 'রিফ্রেশ')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">{t('date', 'তারিখ')}</th>
                <th className="px-5 py-3.5">{language === 'en' ? 'Bank Account' : 'ব্যাংক হিসাব'}</th>
                <th className="px-5 py-3.5">{language === 'en' ? 'Type' : 'ধরন'}</th>
                <th className="px-5 py-3.5">{language === 'en' ? 'Cheque / Ref #' : 'চেক / রেফারেন্স'}</th>
                <th className="px-5 py-3.5">{t('notes', 'নোট')}</th>
                <th className="px-5 py-3.5 text-right font-black">{t('amount', 'টাকার পরিমাণ')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">{t('loading', 'ব্যাংকিং তথ্য লোড হচ্ছে...')}</p>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-xs">
                    {language === 'en' ? 'No banking transactions found.' : 'কোনো ব্যাংকিং লেনদেন পাওয়া যায়নি।'}
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isDeposit = tx.type === 'deposit';
                  return (
                    <tr key={tx._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 text-xs font-mono text-slate-600">
                        {formatDate(tx.date, language)}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {tx.bankAccountId?.accountName || (language === 'en' ? 'Bank' : 'ব্যাংক')}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isDeposit
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isDeposit ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {isDeposit ? (language === 'en' ? 'Deposit (+)' : 'ক্যাশ জমা (+)') : (language === 'en' ? 'Withdrawal (-)' : 'উত্তোলন (-)')}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">
                        {tx.chequeNo ? (language === 'en' ? `Cheque: ${tx.chequeNo}` : `চেক নং: ${tx.chequeNo}`) : tx.reference || '—'}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {tx.note || '—'}
                      </td>
                      <td className="px-5 py-4 text-right font-black text-sm">
                        <span className={isDeposit ? 'text-emerald-700' : 'text-rose-700'}>
                          {isDeposit ? '+ ' : '- '}
                          {formatBDT(tx.amount, language)}
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

      {/* Add Bank Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Landmark className="w-5 h-5 text-indigo-600" />
                <span>{language === 'en' ? 'Add New Bank Account' : 'নতুন ব্যাংক অ্যাকাউন্ট যুক্ত করুন'}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{language === 'en' ? 'Account Name / Title *' : 'অ্যাকাউন্টের নাম / উপাধি *'}</label>
                <input
                  type="text"
                  required
                  placeholder={language === 'en' ? 'e.g. Current Account' : 'যেমন: আল-মদিনা কারেন্ট একাউন্ট'}
                  value={newAcc.accountName}
                  onChange={(e) => setNewAcc({ ...newAcc, accountName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{language === 'en' ? 'Bank Name *' : 'ব্যাংকের নাম *'}</label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'en' ? 'e.g. City Bank' : 'যেমন: Islami Bank'}
                    value={newAcc.bankName}
                    onChange={(e) => setNewAcc({ ...newAcc, bankName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{language === 'en' ? 'Branch' : 'শাখা (Branch)'}</label>
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'e.g. Gulshan Branch' : 'যেমন: টানবাজার শাখা'}
                    value={newAcc.branchName}
                    onChange={(e) => setNewAcc({ ...newAcc, branchName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{language === 'en' ? 'Account Number *' : 'হিসাব নম্বর *'}</label>
                  <input
                    type="text"
                    required
                    placeholder="2050..."
                    value={newAcc.accountNumber}
                    onChange={(e) => setNewAcc({ ...newAcc, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{language === 'en' ? 'Opening Balance (৳)' : 'প্রারম্ভিক ব্যালেন্স (৳)'}</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newAcc.openingBalance}
                    onChange={(e) => setNewAcc({ ...newAcc, openingBalance: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer"
                >
                  {t('cancel', 'বাতিল')}
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  {modalLoading ? t('saving', 'সংরক্ষণ হচ্ছে...') : (language === 'en' ? 'Confirm Account' : 'অ্যাকাউন্ট নিশ্চিত করুন')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal (Deposit / Withdraw) */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                {txType === 'deposit' ? (
                  <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-rose-600" />
                )}
                <span>{txType === 'deposit' ? (language === 'en' ? 'Deposit Cash to Bank' : 'ব্যাংকে ক্যাশ জমা দিন') : (language === 'en' ? 'Withdraw Cash from Bank' : 'ব্যাংক থেকে ক্যাশ উত্তোলন')}</span>
              </h3>
              <button
                onClick={() => setShowTxModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateTransaction} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{language === 'en' ? 'Select Bank Account *' : 'ব্যাংক অ্যাকাউন্ট নির্বাচন *'}</label>
                <select
                  value={newTx.bankAccountId}
                  onChange={(e) => setNewTx({ ...newTx, bankAccountId: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold bg-white"
                >
                  {accounts.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.accountName} - {language === 'en' ? 'Balance' : 'ব্যালেন্স'}: {formatBDT(a.currentBalance, language)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{language === 'en' ? 'Amount (৳) *' : 'টাকার পরিমাণ (৳) *'}</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder={language === 'en' ? 'e.g. 50000' : 'যেমন: ৫০,০০০'}
                    value={newTx.amount}
                    onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('date', 'তারিখ')} *</label>
                  <input
                    type="date"
                    required
                    value={newTx.date}
                    onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{language === 'en' ? 'Cheque # (Optional)' : 'চেক নম্বর (ঐচ্ছিক)'}</label>
                <input
                  type="text"
                  placeholder="CHQ-882910"
                  value={newTx.chequeNo}
                  onChange={(e) => setNewTx({ ...newTx, chequeNo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('notes', 'মন্তব্য / বিবরণ')}</label>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'e.g. Collections cash deposit' : 'যেমন: কালেকশনের ক্যাশ জমা'}
                  value={newTx.note}
                  onChange={(e) => setNewTx({ ...newTx, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer"
                >
                  {t('cancel', 'বাতিল')}
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className={`px-5 py-2 rounded-xl text-white font-bold cursor-pointer ${
                    txType === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {modalLoading
                    ? t('saving', 'সংরক্ষণ হচ্ছে...')
                    : txType === 'deposit'
                    ? (language === 'en' ? 'Confirm Deposit' : 'জমা নিশ্চিত করুন')
                    : (language === 'en' ? 'Confirm Withdrawal' : 'উত্তোলন নিশ্চিত করুন')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
