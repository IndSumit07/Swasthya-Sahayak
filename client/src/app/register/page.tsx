"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, ApiError } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName]   = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);

  const [loading, setLoading]     = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) { setError("Passwords don't match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    try {
      await authApi.register({ email, password, fullName, phone: phone || undefined });
      setRegisteredEmail(email);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const res = await authApi.googleOAuth();
      window.location.href = res.data.url;
    } catch {
      setError("Failed to initiate Google sign-in.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col" style={{ fontFamily: "var(--font-quicksand, 'Quicksand', sans-serif)" }}>
      {/* Header */}
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
          Already have an account? Sign In
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-5xl items-stretch">

          {/* Left — Benefits */}
          <div className="hidden lg:flex lg:col-span-5 bg-[#0E4A43] text-white rounded-[32px] p-10 flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#E5F973]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#E5F973] text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-[#E5F973] animate-pulse" />
                <span>Unified Health Interface (UHI)</span>
              </div>
              <h2 className="text-3xl font-extrabold leading-tight">One Digital Health Record For Your Entire Lifetime</h2>
              <p className="text-emerald-100/80 text-sm leading-relaxed">Connect your ABHA ID, access diagnostic reports, teleconsultations, high-risk maternal follow-ups, and referral tracking in one secure, government-backed portal.</p>
              <div className="space-y-2.5 pt-2">
                {["Instant appointment booking at nearest PHC/CHC","Real-time inter-facility referral tracking","Free assisted teleconsultations in Marathi, Hindi & English"].map((t) => (
                  <div key={t} className="flex items-center gap-2.5 text-xs text-emerald-100 font-medium">
                    <span className="w-5 h-5 rounded-full bg-[#E5F973] text-slate-950 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-2xl bg-white/10 border border-white/15">
                <p className="text-xs font-bold text-[#E5F973] mb-1">Only for Patients (Self-Registration)</p>
                <p className="text-xs text-emerald-100/80 leading-snug">Doctor &amp; ASHA worker accounts are provisioned by facility administrators. Contact your district health office.</p>
              </div>
            </div>
            <div className="pt-6 border-t border-white/15 text-xs text-emerald-200/70">
              Need help with your ABHA ID? Call <strong className="text-white">104</strong> or visit your nearest PHC.
            </div>
          </div>

          {/* Right — Form */}
          <div className="lg:col-span-7 bg-[#EFF2F5] rounded-[32px] p-8 sm:p-10 flex flex-col justify-center border border-slate-200/50">
            <div className="max-w-md w-full mx-auto space-y-5">
              {registeredEmail ? (
                <div className="text-center space-y-5 py-4">
                  <div className="w-16 h-16 rounded-3xl bg-[#E5F973] text-[#0E4A43] mx-auto flex items-center justify-center shadow-xs">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Check Your Email</h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                      We have sent a verification link to <strong className="text-slate-900 font-bold">{registeredEmail}</strong>. Please click the link in your inbox to confirm your account and complete your health profile.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 text-left space-y-1">
                    <div className="font-bold text-slate-700">Didn&apos;t receive the email?</div>
                    <p>Check your Spam/Junk folder or verify that you entered the correct email address.</p>
                  </div>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center w-full py-3.5 rounded-full text-sm font-bold text-white bg-[#0E4A43] hover:bg-[#083530] transition-all shadow-sm active:scale-95"
                  >
                    Proceed to Sign In &rsaquo;
                  </Link>
                </div>
              ) : (
                <>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5F973] text-slate-950 text-xs font-bold mb-2">New Registration</div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Create Your Health Account</h1>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Join Maharashtra&apos;s public health companion platform.</p>
                  </div>

                  {error && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      {error}
                    </div>
                  )}

                  {/* Google */}
                  <button onClick={handleGoogle} disabled={googleLoading}
                    className="w-full py-3 rounded-2xl bg-white border border-slate-200 text-slate-800 text-sm font-semibold flex items-center justify-center gap-3 hover:border-slate-400 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {googleLoading ? <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    )}
                    Sign up with Google
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs text-slate-400 font-medium">or register with email</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <form onSubmit={handleRegister} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Full Name</label>
                        <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Ramesh Deshmukh"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Mobile Number</label>
                        <input type="tel" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="10-digit mobile"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Email Address</label>
                      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Password</label>
                        <div className="relative">
                          <input type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                            className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all pr-10" />
                          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                            {showPw ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Confirm Password</label>
                        <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all" />
                      </div>
                    </div>

                    <button type="submit" disabled={loading}
                      className="w-full py-3.5 rounded-full text-sm font-bold text-white bg-[#0E4A43] hover:bg-[#083530] transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                    >
                      {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span>Create Account</span><span className="text-base">&rsaquo;</span></>}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200/80">
        © {new Date().getFullYear()} Swasthya Sahayak • Government of Maharashtra Health Innovation Initiative
      </footer>
    </div>
  );
}
