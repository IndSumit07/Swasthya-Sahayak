"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, type UserProfile } from "@/lib/api";
import { DashboardSidebar, getRoleNavItems, roleTitles } from "@/components/dashboard/DashboardSidebar";
import { PatientDashboard } from "@/components/dashboard/PatientDashboard";
import { DoctorDashboard } from "@/components/dashboard/DoctorDashboard";
import { HealthWorkerDashboard } from "@/components/dashboard/HealthWorkerDashboard";
import { FacilityAdminDashboard } from "@/components/dashboard/FacilityAdminDashboard";
import { DistrictAdminDashboard } from "@/components/dashboard/DistrictAdminDashboard";
import { SuperAdminDashboard } from "@/components/dashboard/SuperAdminDashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchUser = () => {
    authApi.me()
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#0E4A43] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs text-slate-500 font-semibold tracking-wide">Loading Swasthya Sahayak Portal...</div>
        </div>
      </div>
    );
  }

  const roleMeta = roleTitles[user.role] ?? roleTitles.PATIENT;
  const navItems = getRoleNavItems(user.role);

  return (
    <div
      className="min-h-screen bg-[#FAFAFA] flex flex-col md:flex-row overflow-x-hidden max-w-full"
      style={{ fontFamily: "var(--font-quicksand, 'Quicksand', sans-serif)" }}
    >
      {/* Desktop Left Sidebar (Strictly Authorized Tabs Only) */}
      <DashboardSidebar user={user} activeTab={tab} setTab={setTab} />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 rounded-2xl bg-[#EFF2F5] flex items-center justify-center text-slate-700 hover:text-slate-900 border border-slate-200/60"
              aria-label="Toggle navigation drawer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 capitalize truncate font-heading">
                  {tab.replace(/_/g, " ")}
                </h1>
                <span className={`hidden sm:inline-block text-[10px] font-black px-2 py-0.5 rounded-full border ${roleMeta.tagColor}`}>
                  {roleMeta.title}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500">
                {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} • Government of Maharashtra
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/facilities"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              Live Directory
            </Link>

            <div className="flex items-center gap-2 bg-[#EFF2F5] pl-2 pr-3 py-1 rounded-full border border-slate-200/50">
              <div className="w-7 h-7 rounded-full bg-[#0E4A43] text-[#E5F973] flex items-center justify-center font-black text-xs">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-slate-900 hidden sm:inline max-w-[120px] truncate">
                {user.fullName}
              </span>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0E4A43] text-white p-4 space-y-2 border-b border-white/10 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider px-1">
              Authorized Menu ({roleMeta.title})
            </div>
            <div className="grid grid-cols-2 gap-2">
              {navItems.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => { setTab(id); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-bold text-left transition-all ${
                    tab === id ? "bg-[#E5F973] text-slate-950 shadow-xs" : "bg-white/10 text-emerald-100"
                  }`}
                >
                  <span className="flex-shrink-0">{icon}</span>
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Dedicated Dashboard Views by Role */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-full">
          {user.role === "SUPER_ADMIN" && (
            <SuperAdminDashboard user={user} activeTab={tab} setTab={setTab} />
          )}

          {user.role === "DISTRICT_ADMIN" && (
            <DistrictAdminDashboard user={user} activeTab={tab} setTab={setTab} />
          )}

          {user.role === "FACILITY_ADMIN" && (
            <FacilityAdminDashboard user={user} activeTab={tab} setTab={setTab} />
          )}

          {user.role === "DOCTOR" && (
            <DoctorDashboard user={user} activeTab={tab} setTab={setTab} />
          )}

          {user.role === "HEALTH_WORKER" && (
            <HealthWorkerDashboard user={user} activeTab={tab} setTab={setTab} />
          )}

          {user.role === "PATIENT" && (
            <PatientDashboard
              user={user}
              activeTab={tab}
              setTab={setTab}
              onRefreshUser={fetchUser}
            />
          )}
        </main>
      </div>
    </div>
  );
}
