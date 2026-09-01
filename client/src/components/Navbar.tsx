"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authApi, type UserProfile } from "@/lib/api";

export default function Navbar() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navContainerRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();

  const isFacilitiesPage = pathname?.startsWith("/facilities");

  useEffect(() => {
    authApi.me()
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (navContainerRef.current && !navContainerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Close mobile menu on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  const handleMouseEnter = (name: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(name);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150); // slight grace delay so mouse movement across borders doesn't flicker
  };

  return (
    <header ref={navContainerRef} className="relative z-50 flex flex-col py-1">
      <div className="flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0 group">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#0E4A43] flex items-center justify-center text-[#E5F973] shadow-sm group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div>
            <span className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 font-heading block leading-none">
              Swasthya Sahayak
            </span>
            <span className="text-[9px] sm:text-[11px] font-semibold text-[#0E4A43] tracking-wide uppercase block mt-0.5">
              Public Healthcare Access
            </span>
          </div>
        </Link>

        {/* Clean Spacious Pill Navbar with Dropdowns (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-[#EFF2F5] px-4 py-1.5 rounded-full text-xs xl:text-sm font-medium text-slate-700 shadow-xs">
          {/* Dropdown 1: Clinical Services */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("services")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === "services" ? null : "services")}
              className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full transition-all ${
                activeDropdown === "services"
                  ? "bg-white text-slate-950 shadow-xs font-semibold"
                  : "hover:text-slate-950 hover:bg-slate-200/50"
              }`}
            >
              <span>Services</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeDropdown === "services" ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* Dropdown Menu with zero-gap hover container */}
            {activeDropdown === "services" && (
              <div
                className="absolute top-full left-0 pt-2 w-72 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                onMouseEnter={() => handleMouseEnter("services")}
                onMouseLeave={handleMouseLeave}
              >
                <div className="bg-white rounded-2xl p-2.5 shadow-2xl border border-slate-100/80 ring-1 ring-black/5">
                  <Link
                    href="/#services"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F4F6F8] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0E4A43] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-900">Doctor Consultations</div>
                      <div className="text-[11px] text-slate-500">General OPD and online specialist consults</div>
                    </div>
                  </Link>

                  <Link
                    href="/#diagnostics"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F4F6F8] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-900">Diagnostics &amp; Lab Tests</div>
                      <div className="text-[11px] text-slate-500">Blood tests, sugar, X-Ray &amp; check-ups</div>
                    </div>
                  </Link>

                  <Link
                    href="/#care-flow"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F4F6F8] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-900">How It Works</div>
                      <div className="text-[11px] text-slate-500">4 easy steps to access care near you</div>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Dropdown 2: Facilities & Availability */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("facilities")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === "facilities" ? null : "facilities")}
              className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full transition-all ${
                activeDropdown === "facilities" || isFacilitiesPage
                  ? "bg-white text-slate-950 shadow-xs font-semibold"
                  : "hover:text-slate-950 hover:bg-slate-200/50"
              }`}
            >
              <span>Facilities</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeDropdown === "facilities" ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {activeDropdown === "facilities" && (
              <div
                className="absolute top-full left-0 pt-2 w-80 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                onMouseEnter={() => handleMouseEnter("facilities")}
                onMouseLeave={handleMouseLeave}
              >
                <div className="bg-white rounded-2xl p-2.5 shadow-2xl border border-slate-100/80 ring-1 ring-black/5">
                  <Link
                    href="/facilities"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F4F6F8] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0E4A43] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m-12 0h19.5" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-900">Hospital &amp; PHC Directory</div>
                      <div className="text-[11px] text-slate-500">Find nearest clinics, OPD hours &amp; contact info</div>
                    </div>
                  </Link>

                  <Link
                    href="/facilities"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F4F6F8] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-lime-50 text-lime-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-900">Live Medicine Availability</div>
                      <div className="text-[11px] text-slate-500">Check essential medicine stock in real time</div>
                    </div>
                  </Link>

                  <Link
                    href="/facilities"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F4F6F8] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 011.875 1.875v13.125H3.75V6.375A1.875 1.875 0 015.625 4.5z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-900">Hospital Beds &amp; ICU Status</div>
                      <div className="text-[11px] text-slate-500">View available general, oxygen and ICU beds</div>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Dropdown 3: Portals (5 Roles) */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("portals")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === "portals" ? null : "portals")}
              className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full transition-all ${
                activeDropdown === "portals"
                  ? "bg-white text-slate-950 shadow-xs font-semibold"
                  : "hover:text-slate-950 hover:bg-slate-200/50"
              }`}
            >
              <span>Portals</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeDropdown === "portals" ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {activeDropdown === "portals" && (
              <div
                className="absolute top-full left-0 pt-2 w-80 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                onMouseEnter={() => handleMouseEnter("portals")}
                onMouseLeave={handleMouseLeave}
              >
                <div className="bg-white rounded-2xl p-2.5 shadow-2xl border border-slate-100/80 ring-1 ring-black/5 space-y-1">
                  <Link
                    href="/login"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F4F6F8] transition-colors"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">Citizen / Patient Portal</div>
                      <div className="text-[10px] text-slate-500">Book OPD, view ABDM health history</div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">रुग्ण</span>
                  </Link>

                  <Link
                    href="/login"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F4F6F8] transition-colors"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">ASHA / ANM Frontline Desk</div>
                      <div className="text-[10px] text-slate-500">Doorstep triage, assisted tele-OPD</div>
                    </div>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">आशा</span>
                  </Link>

                  <Link
                    href="/login"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F4F6F8] transition-colors"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">Doctor / Specialist Workbench</div>
                      <div className="text-[10px] text-slate-500">Consultation queue, e-prescriptions</div>
                    </div>
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">डॉक्टर</span>
                  </Link>

                  <Link
                    href="/login"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F4F6F8] transition-colors"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">District Health Officer (DHO)</div>
                      <div className="text-[10px] text-slate-500">District-wide referral &amp; quality audits</div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">जिल्हा</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Direct Tab: Facilities / Live Updates with Highlight Pill */}
          <Link
            href="/facilities"
            className={`px-3.5 py-1.5 rounded-full font-bold shadow-xs transition-transform hover:scale-105 ${
              isFacilitiesPage
                ? "bg-[#0E4A43] text-white"
                : "bg-[#E5F973] text-slate-950"
            }`}
          >
            Live Facilities
          </Link>
        </nav>

        {/* Right: Emergency Helpline & Action Button / Hamburger on mobile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 text-left">
            <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#0E4A43]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-extrabold text-slate-900 leading-tight font-heading">
                104 / 108
              </div>
              <div className="text-[10px] font-medium text-slate-500 leading-tight">
                24x7 Triage
              </div>
            </div>
          </div>

          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 p-1 pl-2.5 pr-1 rounded-full bg-[#EFF2F5] hover:bg-slate-200/80 transition-all text-slate-900 border border-slate-200/60 shadow-2xs"
              >
                <span className="text-xs font-bold max-w-[80px] sm:max-w-[110px] truncate">
                  {user.fullName.split(" ")[0]}
                </span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#0E4A43] text-[#E5F973] flex items-center justify-center font-bold text-[11px] sm:text-xs flex-shrink-0 shadow-xs">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              </Link>

              <Link
                href="/dashboard"
                className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold text-slate-950 bg-[#E5F973] hover:bg-[#d9ed5f] transition-all shadow-xs active:scale-95 flex items-center gap-1"
              >
                <span>Dashboard</span>
                <span className="text-sm leading-none">&rsaquo;</span>
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold text-white bg-[#0E4A43] hover:bg-[#083530] transition-all shadow-sm active:scale-95 flex items-center gap-1"
            >
              <span>Sign In</span>
              <span className="text-sm leading-none">&rsaquo;</span>
            </Link>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="lg:hidden w-9 h-9 rounded-2xl bg-[#EFF2F5] flex items-center justify-center text-slate-700 hover:text-slate-950 border border-slate-200/60 transition-colors"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 p-4 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              href="/#services"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 bg-[#EFF2F5] hover:bg-slate-200/60 rounded-2xl font-bold text-slate-900 flex flex-col justify-between transition-colors"
            >
              <span>Doctor Consults</span>
              <span className="text-[10px] text-slate-500 mt-1">General OPD &amp; Telehealth</span>
            </Link>
            <Link
              href="/facilities"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 bg-[#0E4A43]/10 hover:bg-[#0E4A43]/15 border border-[#0E4A43]/20 rounded-2xl font-bold text-[#0E4A43] flex flex-col justify-between transition-colors"
            >
              <span>Facilities &amp; Beds</span>
              <span className="text-[10px] text-emerald-800/80 mt-1">Find PHCs &amp; Live Beds</span>
            </Link>
            <Link
              href="/#diagnostics"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 bg-[#EFF2F5] hover:bg-slate-200/60 rounded-2xl font-bold text-slate-900 flex flex-col justify-between transition-colors"
            >
              <span>Lab Tests</span>
              <span className="text-[10px] text-slate-500 mt-1">Blood Tests &amp; Scans</span>
            </Link>
            <Link
              href="/#care-flow"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 bg-[#EFF2F5] hover:bg-slate-200/60 rounded-2xl font-bold text-slate-900 flex flex-col justify-between transition-colors"
            >
              <span>How It Works</span>
              <span className="text-[10px] text-slate-500 mt-1">4 Simple Steps</span>
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">24x7 Emergency Triage:</span>
            <a href="tel:104" className="font-extrabold text-[#0E4A43] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 hover:bg-emerald-100">
              Dial 104 / 108
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
