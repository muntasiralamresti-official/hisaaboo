import './globals.css';
import { AuthProvider } from '../lib/authContext';

export const metadata = {
  title: 'Hisaaboo - হিসাব খাতা ও ইনভেন্টরি ম্যানেজমেন্ট',
  description: 'Generic, multi-tenant business accounting and stock web platform for Bangladesh small traders.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn" className="h-full antialiased bg-slate-50 text-slate-900">
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
