"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  return (
    <header className="relative z-50 flex items-center justify-between gap-4 py-1">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-2xl bg-[#0E4A43] flex items-center justify-center text-[#E5F973] shadow-sm">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <div>
          <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-heading block leading-none">
            Swasthya Sahayak
          </span>
          <span className="text-[10px] sm:text-[11px] font-semibold text-[#0E4A43] tracking-wide uppercase">
            Public Healthcare Access Platform
          </span>
        </div>
      </Link>

      {/* Clean Spacious Pill Navbar with Dropdowns */}
      <nav className="hidden lg:flex items-center gap-1.5 bg-[#EFF2F5] px-4 py-1.5 rounded-full text-xs xl:text-sm font-medium text-slate-700 shadow-xs">
        {/* Dropdown 1: Clinical Services */}
        <div
          className="relative"
          onMouseEnter={() => setActiveDropdown("services")}
          onMouseLeave={() => setActiveDropdown(null)}
        >
          <button
            onClick={() => toggleDropdown("services")}
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

          {/* Dropdown Menu */}
          {activeDropdown === "services" && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl p-2.5 shadow-2xl border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <Link
                href="#teleconsultation"
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F4F6F8] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0E4A43] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-900">Assisted Teleconsultation</div>
                  <div className="text-[11px] text-slate-500">Live doctor consult at sub-centres &amp; kiosks</div>
                </div>
              </Link>

              <Link
                href="#triage"
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F4F6F8] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-900">Digital Triage</div>
                  <div className="text-[11px] text-slate-500">Symptom evaluation &amp; priority assignment</div>
                </div>
              </Link>

              <Link
                href="#referrals"
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F4F6F8] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-900">Referral Tracking</div>
                  <div className="text-[11px] text-slate-500">Sub-Centre ➔ PHC ➔ District Hospital</div>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Dropdown 2: Facilities & Availability */}
        <div
          className="relative"
          onMouseEnter={() => setActiveDropdown("facilities")}
          onMouseLeave={() => setActiveDropdown(null)}
        >
          <button
            onClick={() => toggleDropdown("facilities")}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full transition-all ${
              activeDropdown === "facilities"
                ? "bg-white text-slate-950 shadow-xs font-semibold"
                : "hover:text-slate-950 hover:bg-slate-200/50"
            }`}
          >
            <span>Facilities &amp; Stock</span>
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

          {/* Dropdown Menu */}
          {activeDropdown === "facilities" && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl p-2.5 shadow-2xl border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <Link
                href="#facilities"
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F4F6F8] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-900">PHC &amp; CHC Locator</div>
                  <div className="text-[11px] text-slate-500">Locate nearest health centres &amp; staff</div>
                </div>
              </Link>

              <Link
                href="#medicines"
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F4F6F8] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-900">Medicine Availability Tracker</div>
                  <div className="text-[11px] text-slate-500">Live stock visibility for essential drugs</div>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Dropdown 3: Portals & Monitoring */}
        <div
          className="relative"
          onMouseEnter={() => setActiveDropdown("portals")}
          onMouseLeave={() => setActiveDropdown(null)}
        >
          <button
            onClick={() => toggleDropdown("portals")}
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

          {/* Dropdown Menu */}
          {activeDropdown === "portals" && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl p-2.5 shadow-2xl border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <Link
                href="#asha"
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F4F6F8] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-lime-50 text-lime-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-900">ASHA / ANM Frontline Desk</div>
                  <div className="text-[11px] text-slate-500">Offline-ready field consultation app</div>
                </div>
              </Link>

              <Link
                href="#dashboard"
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F4F6F8] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.25 2.25L15 7.5" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-xs text-slate-900">District Health Dashboard</div>
                  <div className="text-[11px] text-slate-500">Public health monitoring &amp; analytics</div>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Direct Tab: News & Updates with Highlight Pill */}
        <Link
          href="#updates"
          className="px-3.5 py-1.5 rounded-full bg-[#E5F973] text-slate-950 font-bold shadow-xs transition-transform hover:scale-105"
        >
          Live Updates
        </Link>

        {/* Search Icon */}
        <button
          aria-label="Search Facilities or Services"
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-600 hover:text-slate-950 shadow-xs transition-all ml-0.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
        </button>
      </nav>

      {/* Right: Emergency Helpline & Action Button */}
      <div className="flex items-center gap-3 sm:gap-5">
        <div className="hidden sm:flex items-center gap-2.5 text-left">
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#0E4A43]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
          </div>
          <div>
            <div className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight font-heading">
              104 / 108 Helpline
            </div>
            <div className="text-[11px] font-medium text-slate-500 leading-tight">
              24x7 Rural Health Triage
            </div>
          </div>
        </div>

        <button className="px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold text-white bg-[#0E4A43] hover:bg-[#083530] transition-all shadow-sm active:scale-95">
          Assisted Teleconsult
        </button>
      </div>
    </header>
  );
}
