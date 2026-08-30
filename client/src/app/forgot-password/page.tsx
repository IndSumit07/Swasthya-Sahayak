"use client";

import { useState } from "react";
import Link from "next/link";
import { authApi, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [done, setDone]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col" style={{ fontFamily: "var(--font-quicksand, 'Quicksand', sans-serif)" }}>
      <header className="max-w-7xl w-full mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0E4A43] flex items-center justify-center text-[#E5F973]">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          </div>
          <div>
            <span className="text-xl font-bold text-slate-900 block leading-none">Swasthya Sahayak</span>
            <span className="text-[10px] font-semibold text-[#0E4A43] tracking-wide uppercase">Public Healthcare Portal</span>
          </div>
        </Link>
        <Link href="/login" className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-900 hover:border-[#0E4A43] transition-all">
          Back to Sign In
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-[#EFF2F5] rounded-[32px] p-8 sm:p-10 border border-slate-200/50 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#E5F973] text-[#0E4A43] flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Reset Password</h1>
            <p className="text-xs sm:text-sm text-slate-600">Enter your registered email and we&apos;ll send secure reset instructions.</p>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          {done ? (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 text-center space-y-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#0E4A43] flex items-center justify-center mx-auto">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Reset Link Sent</h3>
                <p className="text-xs text-slate-600 mt-1">Check <strong>{email}</strong> for password recovery instructions.</p>
              </div>
              <Link href="/login" className="inline-flex items-center justify-center w-full py-2.5 rounded-full text-xs font-bold text-white bg-[#0E4A43] hover:bg-[#083530] transition-all">
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Registered Email Address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com"
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-full text-sm font-bold text-white bg-[#0E4A43] hover:bg-[#083530] transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span>Send Reset Instructions</span><span className="text-base">&rsaquo;</span></>}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-slate-500">
            Remember your password?{" "}
            <Link href="/login" className="text-[#0E4A43] font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200/80">
        © {new Date().getFullYear()} Swasthya Sahayak • Government of Maharashtra Health Innovation Initiative
      </footer>
    </div>
  );
}
