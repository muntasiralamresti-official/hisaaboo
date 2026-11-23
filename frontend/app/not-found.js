import Link from 'next/link';
import Logo from '../components/ui/Logo';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>
        <div className="text-6xl font-black text-blue-600 mb-2">৪০৪</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">পৃষ্ঠাটি পাওয়া যায়নি</h2>
        <p className="text-xs text-slate-500 mb-6">
          আপনি যে পেজটি খুঁজছেন তা বিদ্যমান নেই অথবা সরানো হয়েছে।
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>মূল পাতায় ফিরে যান</span>
        </Link>
      </div>
    </div>
  );
}
