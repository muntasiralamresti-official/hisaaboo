'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../../lib/api';
import { formatBDT, formatDate } from '../../../lib/formatters';
import { useAuth } from '../../../lib/authContext';
import {
  UserCheck,
  PlusCircle,
  DollarSign,
  Calendar,
  RefreshCw,
  Phone,
  Briefcase,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function PayrollPage() {
  const { language, t } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [totalPayrollMonthly, setTotalPayrollMonthly] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  // Form states
  const [newEmp, setNewEmp] = useState({
    name: '',
    phone: '',
    designation: 'গোডাউন ইনচার্জ',
    monthlySalary: '',
  });

  const [newPay, setNewPay] = useState({
    employeeId: '',
    month: new Date().toISOString().slice(0, 7),
    type: 'salary', // 'salary' or 'advance'
    amount: '',
    paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadPayrollData = async () => {
    setLoading(true);
    try {
      const [empRes, payRes] = await Promise.all([
        fetchApi('/payroll/employees'),
        fetchApi('/payroll/payments'),
      ]);
      if (empRes.success) {
        setEmployees(empRes.employees || []);
        setTotalPayrollMonthly(empRes.totalPayrollMonthly || 0);
        if (empRes.employees?.length > 0 && !newPay.employeeId) {
          setNewPay((prev) => ({ ...prev, employeeId: empRes.employees[0]._id }));
        }
      }
      if (payRes.success) {
        setPayments(payRes.payments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayrollData();
  }, []);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      const res = await fetchApi('/payroll/employees', {
        method: 'POST',
        body: JSON.stringify(newEmp),
      });
      if (res.success) {
        setShowAddEmpModal(false);
        setNewEmp({ name: '', phone: '', designation: 'গোডাউন ইনচার্জ', monthlySalary: '' });
        loadPayrollData();
      } else {
        setModalError(res.message || (language === 'en' ? 'Failed to add employee' : 'কর্মচারী যোগ ব্যর্থ'));
      }
    } catch (err) {
      setModalError(err.data?.message || err.message || (language === 'en' ? 'Server error' : 'সার্ভার সমস্যা'));
    } finally {
      setModalLoading(false);
    }
  };

  const handleDisbursePayment = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      const res = await fetchApi('/payroll/payments', {
        method: 'POST',
        body: JSON.stringify(newPay),
      });
      if (res.success) {
        setShowPayModal(false);
        setNewPay((prev) => ({
          ...prev,
          amount: '',
          note: '',
          date: new Date().toISOString().split('T')[0],
        }));
        loadPayrollData();
      } else {
        setModalError(res.message || (language === 'en' ? 'Failed to disburse salary' : 'বেতন প্রদান ব্যর্থ'));
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
            <UserCheck className="w-7 h-7 text-indigo-600" />
            <span>{t('payroll_title')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('payroll_subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setShowPayModal(true)}
            className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <DollarSign className="w-4 h-4" />
            <span>{t('disburse_salary')}</span>
          </button>
          <button
            onClick={() => setShowAddEmpModal(true)}
            className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('add_employee')}</span>
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500">{t('total_active_staff')}</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {employees.length} {language === 'en' ? 'Staff' : 'জন'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {language === 'en' ? 'Shop & Warehouse workers' : 'দোকান ও গোডাউন কর্মী'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-indigo-600">{t('monthly_salary_budget')}</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">{formatBDT(totalPayrollMonthly, language)}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            {language === 'en' ? 'Fixed monthly salary budget' : 'প্রতি মাসের ফিক্সড স্যালারি বাজেট'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-emerald-600">
            {language === 'en' ? 'Salary Payment Vouchers' : 'মোট বেতন পরিশোধ ভাউচার'}
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {payments.length} {language === 'en' ? 'Records' : 'টি'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {language === 'en' ? 'Salary & advance transactions' : 'বেতন ও অগ্রিম ট্রানজেকশন'}
          </p>
        </div>
      </div>

      {/* Employee List */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">{t('staff_list')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div key={emp._id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{emp.name}</h3>
                  <p className="text-xs text-indigo-600 font-semibold">{emp.designation}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {t('active')}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {emp.phone}
                </span>
                <span className="font-bold text-slate-900">
                  {language === 'en' ? 'Salary: ' : 'বেতন: '}
                  <strong className="text-indigo-700 font-black">{formatBDT(emp.monthlySalary, language)}</strong>
                </span>
              </div>
            </div>
          ))}

          {employees.length === 0 && !loading && (
            <div className="col-span-full py-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-xs text-slate-400">
              {language === 'en' ? 'No staff members added yet.' : 'এখনও কোনো কর্মচারী যুক্ত করা হয়নি।'}
            </div>
          )}
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">{t('salary_voucher_ledger')}</h2>
          <button
            onClick={loadPayrollData}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer"
            title={t('refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">{t('date')}</th>
                <th className="px-5 py-3.5">{language === 'en' ? 'Staff Name' : 'কর্মচারীর নাম'}</th>
                <th className="px-5 py-3.5">{language === 'en' ? 'Salary Month' : 'মাস'}</th>
                <th className="px-5 py-3.5">{t('salary_type')}</th>
                <th className="px-5 py-3.5">{language === 'en' ? 'Payment Method' : 'পেমেন্ট মাধ্যম'}</th>
                <th className="px-5 py-3.5">{t('notes')}</th>
                <th className="px-5 py-3.5 text-right font-black">{language === 'en' ? 'Paid Amount' : 'প্রদত্ত টাকা'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">{t('loading')}</p>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-xs">
                    {language === 'en' ? 'No salary disbursement records found.' : 'কোনো বেতন পরিশোধ রেকর্ড পাওয়া যায়নি।'}
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isSalary = p.type === 'salary';
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 text-xs font-mono text-slate-600">
                        {formatDate(p.date, language)}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {p.employeeId?.name || (language === 'en' ? 'Employee' : 'কর্মচারী')}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs font-bold text-slate-600">
                        {p.month}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isSalary
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isSalary
                            ? (language === 'en' ? 'Regular Salary' : 'মাসিক বেতন')
                            : (language === 'en' ? 'Advance / Allowance' : 'অগ্রিম / খোরকি')}
                        </span>
                      </td>
                      <td className="px-5 py-4 uppercase text-xs font-bold text-slate-600">
                        {p.paymentMethod}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {p.note || '—'}
                      </td>
                      <td className="px-5 py-4 text-right font-black text-slate-900">
                        {formatBDT(p.amount, language)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <span>{language === 'en' ? 'Add New Employee' : 'নতুন কর্মচারী যোগ করুন'}</span>
              </h3>
              <button
                onClick={() => setShowAddEmpModal(false)}
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

            <form onSubmit={handleCreateEmployee} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Employee Full Name *' : 'কর্মচারীর পূর্ণ নাম *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'en' ? 'e.g. Alamgir Hossain' : 'যেমন: মো: আলমগীর হোসেন'}
                  value={newEmp.name}
                  onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Mobile Phone Number *' : 'মোবাইল ফোন নম্বর *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="017xxxxxxxx"
                  value={newEmp.phone}
                  onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Designation' : 'পদবী (Designation)'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'e.g. Warehouse In-charge' : 'যেমন: গোডাউন ইনচার্জ'}
                    value={newEmp.designation}
                    onChange={(e) => setNewEmp({ ...newEmp, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Monthly Salary (৳) *' : 'মাসিক বেতন (৳) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="15000"
                    value={newEmp.monthlySalary}
                    onChange={(e) => setNewEmp({ ...newEmp, monthlySalary: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  {modalLoading ? t('saving') : (language === 'en' ? 'Confirm Employee' : 'কর্মচারী নিশ্চিত করুন')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disburse Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>{language === 'en' ? 'Record Salary / Advance' : 'বেতন বা অগ্রিম প্রদান এন্ট্রি'}</span>
              </h3>
              <button
                onClick={() => setShowPayModal(false)}
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

            <form onSubmit={handleDisbursePayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'en' ? 'Select Employee *' : 'কর্মচারী নির্বাচন *'}
                </label>
                <select
                  value={newPay.employeeId}
                  onChange={(e) => setNewPay({ ...newPay, employeeId: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold bg-white"
                >
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.designation}) - {language === 'en' ? 'Salary: ' : 'বেতন: '}{formatBDT(emp.monthlySalary, language)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('salary_type')} *</label>
                  <select
                    value={newPay.type}
                    onChange={(e) => setNewPay({ ...newPay, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold bg-white"
                  >
                    <option value="salary">{language === 'en' ? 'Regular Monthly Salary' : 'মাসিক নিয়মিত বেতন'}</option>
                    <option value="advance">{language === 'en' ? 'Advance / Allowance' : 'অগ্রিম / খোরকি খরচ'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('payment_month')} *</label>
                  <input
                    type="month"
                    required
                    value={newPay.month}
                    onChange={(e) => setNewPay({ ...newPay, month: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Amount (৳) *' : 'টাকার পরিমাণ (৳) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="15000"
                    value={newPay.amount}
                    onChange={(e) => setNewPay({ ...newPay, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'en' ? 'Method' : 'মাধ্যম'}
                  </label>
                  <select
                    value={newPay.paymentMethod}
                    onChange={(e) => setNewPay({ ...newPay, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold bg-white"
                  >
                    <option value="cash">{language === 'en' ? 'Cash' : 'নগদ ক্যাশ'}</option>
                    <option value="bKash">{language === 'en' ? 'bKash' : 'বিকাশ'}</option>
                    <option value="Nagad">{language === 'en' ? 'Nagad' : 'নগদ'}</option>
                    <option value="bank">{language === 'en' ? 'Bank Account' : 'ব্যাংক একাউন্ট'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('date')} *</label>
                <input
                  type="date"
                  required
                  value={newPay.date}
                  onChange={(e) => setNewPay({ ...newPay, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('notes')}</label>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'e.g. Full month salary payment' : 'যেমন: চলতি মাসের পূর্ণ বেতন পরিশোধ'}
                  value={newPay.note}
                  onChange={(e) => setNewPay({ ...newPay, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  {modalLoading ? t('saving') : (language === 'en' ? 'Confirm Payment' : 'পরিশোধ নিশ্চিত করুন')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
