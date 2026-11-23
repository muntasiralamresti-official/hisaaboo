'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../../../lib/api';
import { formatBDT, formatDate } from '../../../../lib/formatters';
import { useAuth } from '../../../../lib/authContext';
import { getTemplateCustomFields } from '../../../../lib/templates';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  Printer,
  ShoppingCart,
  Calendar,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Truck,
  FileText,
  ShieldCheck,
  MessageCircle,
  Receipt,
} from 'lucide-react';

function SaleInvoiceContent() {
  const { id } = useParams();
  const router = useRouter();
  const { business } = useAuth();
  const businessType = business?.businessType || 'general';
  const templateFields = getTemplateCustomFields(businessType);

  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mode: 'invoice' (Cash Memo with rates) vs 'challan' (Delivery Challan & Gate Pass rate-free)
  const [printMode, setPrintMode] = useState('invoice');

  // Transport details for Delivery Challan
  const [transportInfo, setTransportInfo] = useState({
    truckNo: '',
    driverName: '',
    driverPhone: '',
    destination: '',
  });

  useEffect(() => {
    async function loadSale() {
      try {
        const res = await fetchApi(`/sales/${id}`);
        if (res.success) {
          setSale(res.sale);
          if (res.sale.partyId) {
            setTransportInfo((prev) => ({
              ...prev,
              destination: res.sale.partyId.address || '',
            }));
          }
        } else {
          setError(res.message || 'চালান লোড করা যায়নি');
        }
      } catch (err) {
        setError(err.message || 'চালান লোড করা যায়নি');
      } finally {
        setLoading(false);
      }
    }
    if (id) loadSale();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!sale?.partyId?.phone) {
      alert('পার্টির মোবাইল নম্বর পাওয়া যায়নি');
      return;
    }
    const cleanPhone = sale.partyId.phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('88')
      ? cleanPhone
      : cleanPhone.startsWith('0')
      ? `88${cleanPhone}`
      : `880${cleanPhone}`;

    const itemsSummary = (sale.items || [])
      .map((it, idx) => `${idx + 1}. ${it.productName} (${it.quantity} ${it.unit}) = ৳${it.total.toLocaleString('bn-BD')}`)
      .join('\n');

    const msg = `আসসালামু আলাইকুম, ${sale.partyId.name}।\n${business?.name || 'হিসাবূ'} হতে আপনার ইনভয়েস #${sale.invoiceNo} প্রস্তুত করা হয়েছে।\n\nমালের বিবরণ:\n${itemsSummary}\n\nসর্বমোট বিল: ৳${sale.totalAmount.toLocaleString('bn-BD')}\nজমা: ৳${sale.paidAmount.toLocaleString('bn-BD')}\nবকেয়া জের: ৳${sale.dueAmount.toLocaleString('bn-BD')}\n\nধন্যবাদ।`;
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">চালান লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="p-8 bg-white rounded-3xl border text-center text-slate-500">
        চালানটি পাওয়া যায়নি।{' '}
        <Link href="/sales" className="text-blue-600 underline">
          তালিকায় ফিরে যান
        </Link>
      </div>
    );
  }

  const isYarn = businessType === 'yarn';
  const totalBags = sale.items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Action Header (Hidden during Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/sales"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              চালান #{sale.invoiceNo}
            </h1>
            <p className="text-xs text-slate-500">{formatDate(sale.date)}</p>
          </div>
        </div>

        {/* Mode Selector & Print */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle between Memo, Delivery Challan and POS */}
          <div className="flex items-center p-1 rounded-xl bg-slate-200/80 text-xs font-bold">
            <button
              onClick={() => setPrintMode('invoice')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all ${
                printMode === 'invoice'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>A4 ক্যাশ মেমো</span>
            </button>
            <button
              onClick={() => setPrintMode('pos')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all ${
                printMode === 'pos'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              <span>থার্মাল পিওএস</span>
            </button>
            <button
              onClick={() => setPrintMode('challan')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all ${
                printMode === 'challan'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-indigo-600" />
              <span>ডেলিভারি চালান</span>
            </button>
          </div>

          {sale.partyId?.phone && (
            <button
              onClick={handleWhatsAppShare}
              className="py-2 px-3 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp মেমো</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট করুন</span>
          </button>
        </div>
      </div>

      {/* Transport Inputs (Visible on screen when Delivery Challan mode is selected) */}
      {printMode === 'challan' && (
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 print:hidden space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span>পরিবহন ও গেট পাস তথ্য (প্রিন্ট কপিতে যুক্ত হবে):</span>
            </span>
            <span className="text-slate-500 font-normal">চালক ও সিকিউরিটি গেটের জন্য রেট ব্যতীত কপি</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">গাড়ি / ট্রাক নং</label>
              <input
                type="text"
                placeholder="যেমন: ঢাকা মেট্রো-ট ১১-২২৩৩"
                value={transportInfo.truckNo}
                onChange={(e) => setTransportInfo({ ...transportInfo, truckNo: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">ড্রাইভারের নাম</label>
              <input
                type="text"
                placeholder="যেমন: মো: রফিক"
                value={transportInfo.driverName}
                onChange={(e) => setTransportInfo({ ...transportInfo, driverName: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">ড্রাইভারের ফোন নং</label>
              <input
                type="text"
                placeholder="017xxxxxxxx"
                value={transportInfo.driverPhone}
                onChange={(e) => setTransportInfo({ ...transportInfo, driverPhone: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-indigo-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">ডেলিভারি গন্তব্য / গোডাউন</label>
              <input
                type="text"
                placeholder="যেমন: টানবাজার গোডাউন"
                value={transportInfo.destination}
                onChange={(e) => setTransportInfo({ ...transportInfo, destination: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* POS Thermal Receipt (58mm / 80mm format) */}
      {printMode === 'pos' ? (
        <div className="max-w-[340px] mx-auto p-6 bg-white border border-dashed border-slate-300 rounded-2xl shadow-sm text-slate-800 font-mono text-xs space-y-4 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full">
          <div className="text-center space-y-1">
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              {business?.name || 'হিসাবূ ব্যবসা'}
            </h2>
            <p className="text-[11px] text-slate-600">{business?.address || ''}</p>
            <p className="text-[11px] text-slate-600">ফোন: {business?.phone || ''}</p>
            <div className="pt-1">
              <span className="inline-block py-0.5 px-3 rounded bg-slate-100 text-slate-800 text-[10px] font-bold uppercase tracking-wider">
                ক্যাশ মেমো / রসিদ
              </span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>মেমো নং:</span>
              <span className="font-bold">{sale.invoiceNo}</span>
            </div>
            <div className="flex justify-between">
              <span>তারিখ:</span>
              <span>{formatDate(sale.date)}</span>
            </div>
            <div className="flex justify-between">
              <span>গ্রাহক:</span>
              <span className="font-bold truncate max-w-[180px]">{sale.partyId?.name || 'ক্যাশ কাস্টমার'}</span>
            </div>
            {sale.partyId?.phone && (
              <div className="flex justify-between">
                <span>ফোন:</span>
                <span>{sale.partyId.phone}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-2">
            <div className="flex justify-between font-bold text-[10px] uppercase text-slate-500">
              <span>আইটেম / বিবরণ</span>
              <span>টাকা</span>
            </div>
            {sale.items?.map((it, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between font-bold text-slate-900">
                  <span className="truncate pr-2">{it.productName}</span>
                  <span>{formatBDT(it.total)}</span>
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>{it.quantity} {it.unit} x ৳{it.rate}</span>
                  {it.customFields?.serialOrImei && <span>IMEI: {it.customFields.serialOrImei}</span>}
                  {it.customFields?.warranty && <span>{it.customFields.warranty}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 text-right text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>সাবটোটাল:</span>
              <span className="font-bold">{formatBDT(sale.subTotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>ছাড় (-):</span>
                <span>{formatBDT(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-xs border-t border-slate-900 pt-1 text-slate-900">
              <span>মোট প্রদেয়:</span>
              <span>{formatBDT(sale.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>নগদ জমা:</span>
              <span>{formatBDT(sale.paidAmount)}</span>
            </div>
            {sale.dueAmount > 0 && (
              <div className="flex justify-between text-rose-600 font-black">
                <span>বকেয়া (Due):</span>
                <span>{formatBDT(sale.dueAmount)}</span>
              </div>
            )}
          </div>

          {/* Mock Barcode / Footer */}
          <div className="border-t border-dashed border-slate-300 pt-3 text-center space-y-2">
            <div className="font-mono text-[9px] tracking-widest uppercase opacity-75">
              ||||| | |||| ||| |||||| | ||||| |||||||
            </div>
            <p className="text-[10px] text-slate-500 font-sans">
              {business?.invoiceFooterNote || 'ধন্যবাদ, আবার আসবেন!'}
            </p>
            <p className="text-[9px] text-slate-400 font-sans">
              Hisaaboo POS System • hisaaboo.com
            </p>
          </div>
        </div>
      ) : (
        /* Print Document Paper (Prints cleanly on A4) */
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-md print:shadow-none print:border-none print:p-0 space-y-6 text-slate-900">
        
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {business?.name || 'আল-মদিনা সুতা ট্রেডার্স'}
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-sm">
              {business?.address || 'টানবাজার, নারায়ণগঞ্জ'}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              মোবাইল: <strong className="text-slate-900">{business?.phone}</strong>
            </p>
          </div>

          <div className="text-right sm:self-center">
            <span className={`inline-block py-1.5 px-4 rounded-lg text-white text-xs sm:text-sm font-black uppercase tracking-widest ${
              printMode === 'invoice' ? 'bg-slate-900' : 'bg-indigo-950'
            }`}>
              {printMode === 'invoice' ? 'বিক্রয় চালান / মেমো' : 'ডেলিভারি চালান ও গেট পাস'}
            </span>
            <div className="mt-2 text-xs font-bold text-slate-600">
              চালান নং: <span className="text-slate-900 font-mono">{sale.invoiceNo}</span>
            </div>
            <div className="text-xs text-slate-600">
              তারিখ: <span className="font-semibold">{formatDate(sale.date)}</span>
            </div>
          </div>
        </div>

        {/* Customer & Transport Info Box */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              গ্রহীতা / পার্টির বিবরণ:
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              {sale.partyId?.name || 'ক্যাশ কাস্টমার'}
            </h3>
            {sale.partyId?.address && (
              <p className="text-slate-600 mt-0.5">{sale.partyId.address}</p>
            )}
            {sale.partyId?.phone && (
              <p className="text-slate-600 mt-0.5">ফোন: {sale.partyId.phone}</p>
            )}
          </div>

          {printMode === 'invoice' ? (
            <div className="sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                পেমেন্ট স্ট্যাটাস:
              </span>
              <div className="mt-0.5 font-bold">
                {sale.dueAmount <= 0 ? (
                  <span className="text-emerald-700">পরিশোধিত (Paid)</span>
                ) : sale.paidAmount > 0 ? (
                  <span className="text-amber-700">আংশিক জমা (Partial Due)</span>
                ) : (
                  <span className="text-rose-700">বাকি (Full Due)</span>
                )}
              </div>
              {sale.paymentMethod && sale.paymentMethod !== 'none' && (
                <p className="text-slate-500 text-[11px] mt-0.5 uppercase">
                  মাধ্যম: {sale.paymentMethod}
                </p>
              )}
            </div>
          ) : (
            <div className="sm:text-right space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                গাড়ি ও চালান বিবরণ:
              </span>
              <p className="text-slate-800 font-bold">গাড়ি নং: {transportInfo.truckNo || '—'}</p>
              <p className="text-slate-600">চালক: {transportInfo.driverName || '—'} {transportInfo.driverPhone ? `(${transportInfo.driverPhone})` : ''}</p>
              <p className="text-slate-600">গন্তব্য: {transportInfo.destination || sale.partyId?.address || '—'}</p>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">নং</th>
                <th className="py-2.5 px-3">সুতা ও পণ্যের বিবরণ</th>
                {templateFields.map((f) => (
                  <th key={f.key} className="py-2.5 px-3">
                    {f.label.bn}
                  </th>
                ))}
                <th className="py-2.5 px-3 text-right">পরিমাণ (বস্তা / একক)</th>
                {/* Financial columns shown only in invoice mode */}
                {printMode === 'invoice' && (
                  <>
                    <th className="py-2.5 px-3 text-right">দর / রেট</th>
                    <th className="py-2.5 px-3 text-right">মোট টাকা</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans">
              {sale.items?.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    {item.productName}
                  </td>
                  {templateFields.map((f) => (
                    <td key={f.key} className="py-2.5 px-3 text-slate-700">
                      {item.customFields?.[f.key] || '—'}
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {item.quantity} {item.unit}
                  </td>
                  {printMode === 'invoice' && (
                    <>
                      <td className="py-2.5 px-3 text-right text-slate-800">
                        {formatBDT(item.rate)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                        {formatBDT(item.total)}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
            {/* Delivery Challan Bag Summary Row */}
            {printMode === 'challan' && (
              <tfoot className="bg-slate-50 font-black text-xs border-t border-slate-300">
                <tr>
                  <td colSpan={2 + templateFields.length} className="py-3 px-3 text-right uppercase text-slate-600">
                    মোট ডেলিভারি বস্তা সংখ্যা:
                  </td>
                  <td className="py-3 px-3 text-right text-indigo-900 text-sm">
                    {totalBags} {sale.items?.[0]?.unit || 'বস্তা'}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Calculation Totals (Invoice Mode Only) */}
        {printMode === 'invoice' ? (
          <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
            <div className="text-xs text-slate-500 max-w-sm space-y-2">
              {sale.notes && (
                <p>
                  <strong>মন্তব্য:</strong> {sale.notes}
                </p>
              )}
              <p className="italic text-[11px] text-slate-400">
                * বিক্রিত মাল বিশেষ কারণ ছাড়া ফেরত নেওয়া হয় না।
              </p>

              {/* Digital Verification QR Code */}
              <div className="pt-2 flex items-center gap-3">
                <div className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
                  <QRCodeSVG
                    value={`INVOICE:${sale.invoiceNumber}|DATE:${sale.date}|TOTAL:${sale.totalAmount}|DUE:${sale.dueAmount}|PARTY:${sale.partyId?.name || 'Cash'}`}
                    size={68}
                    level="M"
                  />
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  <p className="font-bold text-slate-700">ডিজিটাল ভেরিফিকেশন কোড</p>
                  <p className="font-mono mt-0.5">{sale.invoiceNumber}</p>
                  <p className="text-[9px] text-slate-400">স্ক্যান করে ইনভয়েসের সত্যতা যাচাই করুন</p>
                </div>
              </div>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between py-1 text-slate-600 font-medium">
                <span>মোট মূল্য (Subtotal):</span>
                <span className="font-mono font-bold">{formatBDT(sale.subTotal)}</span>
              </div>

              {sale.discount > 0 && (
                <div className="flex justify-between py-1 text-rose-600 font-medium">
                  <span>ছাড় / ডিসকাউন্ট:</span>
                  <span className="font-mono font-bold">- {formatBDT(sale.discount)}</span>
                </div>
              )}

              <div className="flex justify-between py-1.5 border-t border-b border-slate-900 font-black text-sm text-slate-900">
                <span>সর্বমোট প্রদেয়:</span>
                <span className="font-mono">{formatBDT(sale.totalAmount)}</span>
              </div>

              <div className="flex justify-between py-1 text-emerald-700 font-bold">
                <span>নগদ জমা:</span>
                <span className="font-mono">{formatBDT(sale.paidAmount)}</span>
              </div>

              <div className="flex justify-between py-1.5 border-t border-slate-200 text-rose-600 font-black text-sm">
                <span>অবশিষ্ট বাকি (Due):</span>
                <span className="font-mono">{formatBDT(sale.dueAmount)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            <strong>নির্দেশনা:</strong> মালের বস্তা ও ওজন বুঝিয়া পাইলাম। পথিমধ্যে কোনো ঘাটতি বা ক্ষতির জন্য ট্রান্সপোর্ট চালক ও দায়িত্বপ্রাপ্ত ব্যক্তি দায়ী থাকিবেন।
          </div>
        )}

        {/* Signatures */}
        {printMode === 'invoice' ? (
          <div className="pt-16 grid grid-cols-2 text-center text-xs text-slate-600">
            <div>
              <div className="w-36 border-t border-slate-400 mx-auto mb-1" />
              <span>ক্রেতার স্বাক্ষর</span>
            </div>
            <div>
              <div className="w-36 border-t border-slate-400 mx-auto mb-1" />
              <span>পক্ষে: {business?.name}</span>
            </div>
          </div>
        ) : (
          <div className="pt-16 grid grid-cols-3 text-center text-xs text-slate-600">
            <div>
              <div className="w-28 border-t border-slate-400 mx-auto mb-1" />
              <span>চালকের স্বাক্ষর</span>
            </div>
            <div>
              <div className="w-28 border-t border-slate-400 mx-auto mb-1" />
              <span>গেট ইনচার্জ স্বাক্ষর</span>
            </div>
            <div>
              <div className="w-28 border-t border-slate-400 mx-auto mb-1" />
              <span>মাল গ্রহীতার স্বাক্ষর</span>
            </div>
          </div>
        )}

        {/* Custom Footer Note */}
        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
          {business?.invoiceFooterNote || 'ধন্যবাদ, আবার আসবেন।'}
        </div>
      </div>
      )}
    </div>
  );
}

export default function SaleInvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">চালান মেমো লোড হচ্ছে...</p>
        </div>
      }
    >
      <SaleInvoiceContent />
    </Suspense>
  );
}
