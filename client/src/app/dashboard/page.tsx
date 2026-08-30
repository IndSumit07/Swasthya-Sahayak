"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, profileApi, type UserProfile } from "@/lib/api";

// ─── Context ──────────────────────────────────────────────────────────────────

const UserContext = createContext<{ user: UserProfile | null; logout: () => void }>({
  user: null,
  logout: () => {},
});

export const useUser = () => useContext(UserContext);

// ─── DashboardNav (Desktop Sidebar + Mobile Drawer) ──────────────────────────

const navItems = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    id: "appointments",
    label: "Appointments",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.253M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
      </svg>
    ),
  },
  {
    id: "prescriptions",
    label: "Prescriptions",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    id: "referrals",
    label: "Referrals",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "My Profile",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
];

const roleLabel: Record<string, string> = {
  PATIENT: "Patient",
  DOCTOR: "Doctor",
  HEALTH_WORKER: "ASHA / ANM",
  FACILITY_ADMIN: "Facility Admin",
  DISTRICT_ADMIN: "District Admin",
};

function DesktopSidebar({ user, activeTab, setTab }: { user: UserProfile; activeTab: string; setTab: (t: string) => void }) {
  const router = useRouter();

  const handleLogout = async () => {
    await authApi.logout().catch(() => {});
    router.push("/login");
  };

  return (
    <aside className="hidden md:flex w-64 flex-shrink-0 bg-[#0E4A43] text-white min-h-screen flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#E5F973] flex items-center justify-center text-slate-950">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          </div>
          <div>
            <div className="text-sm font-bold leading-none">Swasthya Sahayak</div>
            <div className="text-[10px] text-emerald-300 font-medium mt-0.5">Healthcare Portal</div>
          </div>
        </Link>
      </div>

      {/* User card */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E5F973] text-slate-950 flex items-center justify-center font-black text-sm flex-shrink-0">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold truncate">{user.fullName}</div>
            <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full bg-[#E5F973]/15 border border-[#E5F973]/25 text-[10px] font-semibold text-[#E5F973]">
              {roleLabel[user.role] ?? user.role}
            </div>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold text-left transition-all ${
              activeTab === id
                ? "bg-[#E5F973] text-slate-950 shadow-sm"
                : "hover:bg-white/10 text-emerald-100"
            }`}
          >
            <span className="flex-shrink-0">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold text-rose-300 hover:bg-rose-500/15 transition-all"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          <span>Sign Out</span>
        </button>
        <div className="mt-3 text-center text-[10px] text-emerald-400/60">
          Govt. of Maharashtra • PS 26133
        </div>
      </div>
    </aside>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color = "#EFF2F5" }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-[24px] p-4 sm:p-5 flex flex-col justify-between min-h-[110px] sm:min-h-[120px] shadow-2xs border border-slate-200/40" style={{ background: color }}>
      <div className="w-8 h-8 rounded-xl bg-white/80 border border-slate-200/60 flex items-center justify-center text-[#0E4A43]">
        {icon}
      </div>
      <div>
        <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{value}</div>
        <div className="text-xs font-bold text-slate-700 mt-0.5">{label}</div>
        {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ user, setTab }: { user: UserProfile; setTab: (t: string) => void }) {
  const patient = user.patient;
  const regStep = user.registrationProgress?.currentStep;
  const isProfileComplete = regStep === "COMPLETE" || regStep === "PROFILE_STEP_2";

  return (
    <div className="space-y-5 sm:space-y-6 max-w-full">
      {/* Profile completion nudge */}
      {!isProfileComplete && (
        <div className="p-4 sm:p-5 rounded-[24px] sm:rounded-[28px] bg-[#E5F973] border border-yellow-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0E4A43] text-[#E5F973] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-black text-slate-900">Complete Your Health Profile</div>
              <div className="text-xs text-slate-700 mt-0.5">Add your demographics and medical history so doctors can provide better care.</div>
            </div>
          </div>
          <button
            onClick={() => setTab("profile")}
            className="w-full sm:w-auto flex-shrink-0 px-5 py-2.5 rounded-full bg-[#0E4A43] text-white text-xs font-bold hover:bg-[#083530] transition-all active:scale-95 shadow-xs text-center"
          >
            Complete Now &rsaquo;
          </button>
        </div>
      )}

      {/* ABHA Nudge */}
      {!patient?.abhaId && (
        <div className="p-4 sm:p-5 rounded-[24px] sm:rounded-[28px] bg-sky-50 border border-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-black text-slate-900">Link Your ABHA Health ID</div>
              <div className="text-xs text-slate-600 mt-0.5">Access government health schemes and portable digital records across all facilities.</div>
            </div>
          </div>
          <button
            onClick={() => setTab("profile")}
            className="w-full sm:w-auto flex-shrink-0 px-5 py-2.5 rounded-full bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition-all active:scale-95 shadow-xs text-center"
          >
            Link ABHA &rsaquo;
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.253M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" /></svg>}
          label="Appointments" value={0} sub="No upcoming" color="#EFF2F5"
        />
        <StatCard
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
          label="Prescriptions" value={0} sub="Active medicines" color="#EFF2F5"
        />
        <StatCard
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>}
          label="Referrals" value={0} sub="In progress" color="#EFF2F5"
        />
        <StatCard
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>}
          label="Lab Reports" value={0} sub="Pending results" color="#EFF2F5"
        />
      </div>

      {/* Profile Summary Card */}
      <div className="bg-[#EFF2F5] rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 space-y-4 border border-slate-200/50 shadow-2xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-black text-slate-900">Health Profile Summary</h3>
          <button onClick={() => setTab("profile")} className="text-xs text-[#0E4A43] font-bold hover:underline">
            Edit Details &rsaquo;
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          {[
            { label: "Date of Birth", value: patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString("en-IN") : "—" },
            { label: "Gender", value: patient?.gender?.replace(/_/g," ") ?? "—" },
            { label: "Blood Group", value: patient?.bloodGroup ?? "—" },
            { label: "District", value: patient?.district ?? "—" },
            { label: "ABHA ID", value: patient?.abhaId ?? "Not linked" },
            { label: "Village", value: patient?.village ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-2xl p-3.5 border border-slate-200/50">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Medical History */}
      {patient?.medicalHistory && (
        <div className="bg-[#EFF2F5] rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 space-y-4 border border-slate-200/50 shadow-2xs">
          <h3 className="text-sm sm:text-base font-black text-slate-900">Medical History</h3>
          <div className="space-y-3">
            {[
              { label: "Allergies", items: patient.medicalHistory.allergies, color: "rose" },
              { label: "Chronic Conditions", items: patient.medicalHistory.chronicConditions, color: "amber" },
              { label: "Current Medications", items: patient.medicalHistory.currentMedications, color: "blue" },
            ].map(({ label, items, color }) => (
              <div key={label}>
                <div className="text-xs font-bold text-slate-600 mb-1.5">{label}</div>
                {items.length === 0 ? (
                  <span className="text-xs text-slate-400">None reported</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((item) => (
                      <span key={item} className={`px-2.5 py-1 rounded-full text-xs font-semibold bg-${color}-50 text-${color}-700 border border-${color}-200`}>
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Services */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <a href="tel:104" className="p-4 sm:p-5 bg-emerald-50 border border-emerald-200 rounded-[24px] flex items-center gap-3.5 hover:bg-emerald-100 transition-colors shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-[#0E4A43] text-white flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-black text-slate-900">104 — Health Helpline</div>
            <div className="text-xs text-slate-600">24×7 Rural Health Triage</div>
          </div>
        </a>
        <a href="tel:108" className="p-4 sm:p-5 bg-rose-50 border border-rose-200 rounded-[24px] flex items-center gap-3.5 hover:bg-rose-100 transition-colors shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-black text-slate-900">108 — Ambulance</div>
            <div className="text-xs text-slate-600">Emergency Medical Services</div>
          </div>
        </a>
      </div>
    </div>
  );
}

// ─── Placeholder Tabs ─────────────────────────────────────────────────────────

function PlaceholderTab({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center space-y-3 px-4">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-[#0E4A43]">
        {icon}
      </div>
      <h3 className="text-lg sm:text-xl font-black text-slate-900">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-600 max-w-xs">{description}</p>
      <div className="px-4 py-1.5 rounded-full bg-[#EFF2F5] text-xs font-bold text-slate-500 border border-slate-200">
        Coming Soon
      </div>
    </div>
  );
}

// ─── Profile Tab (Interactive Editor) ─────────────────────────────────────────

const MAHARASHTRA_DISTRICTS = [
  "Ahmednagar","Akola","Amravati","Aurangabad","Beed","Bhandara","Buldhana","Chandrapur",
  "Dhule","Gadchiroli","Gondia","Hingoli","Jalgaon","Jalna","Kolhapur","Latur","Mumbai City",
  "Mumbai Suburban","Nagpur","Nanded","Nandurbar","Nashik","Osmanabad","Palghar","Parbhani",
  "Pune","Raigad","Ratnagiri","Sangli","Satara","Sindhudurg","Solapur","Thane","Wardha",
  "Washim","Yavatmal",
];
const BLOOD_GROUPS = ["A+","A−","B+","B−","AB+","AB−","O+","O−","Don't know"];
const GENDERS = ["MALE","FEMALE","OTHER","PREFER_NOT_TO_SAY"] as const;

function ProfileTab({ user, onProfileUpdated }: { user: UserProfile; onProfileUpdated: () => void }) {
  const patient = user.patient;
  const medicalHistory = patient?.medicalHistory;

  const [activeSubTab, setActiveSubTab] = useState<"step1" | "step2">("step1");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1 Form
  const [dateOfBirth, setDateOfBirth] = useState(patient?.dateOfBirth ? patient.dateOfBirth.split("T")[0] : "");
  const [gender, setGender] = useState(patient?.gender ?? "");
  const [village, setVillage] = useState(patient?.village ?? "");
  const [district, setDistrict] = useState(patient?.district ?? "Pune");
  const [pincode, setPincode] = useState(patient?.pincode ?? "");
  const [abhaId, setAbhaId] = useState(patient?.abhaId ?? "");
  const [bloodGroup, setBloodGroup] = useState(patient?.bloodGroup ?? "");
  const [ecName, setEcName] = useState(patient?.emergencyContactName ?? "");
  const [ecPhone, setEcPhone] = useState(patient?.emergencyContactPhone ?? "");

  // Step 2 Form
  const [allergies, setAllergies] = useState(medicalHistory?.allergies?.join(", ") ?? "");
  const [chronicConditions, setChronicConditions] = useState(medicalHistory?.chronicConditions?.join(", ") ?? "");
  const [currentMedications, setCurrentMedications] = useState(medicalHistory?.currentMedications?.join(", ") ?? "");
  const [notes, setNotes] = useState(medicalHistory?.notes ?? "");

  const handleSaveStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null); setSuccessMsg(null); setSaving(true);
    try {
      await profileApi.step1({
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        village: village.trim() || undefined,
        district: district || undefined,
        pincode: pincode.trim() || undefined,
        abhaId: abhaId.trim() || undefined,
        bloodGroup: bloodGroup || undefined,
        emergencyContactName: ecName.trim() || undefined,
        emergencyContactPhone: ecPhone.trim() || undefined,
      });
      setSuccessMsg("Personal details saved successfully!");
      onProfileUpdated();
      setActiveSubTab("step2");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save details.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null); setSuccessMsg(null); setSaving(true);
    const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
    try {
      await profileApi.step2({
        allergies: split(allergies),
        chronicConditions: split(chronicConditions),
        currentMedications: split(currentMedications),
        notes: notes.trim() || undefined,
      });
      setSuccessMsg("Medical history and health profile saved successfully!");
      onProfileUpdated();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save medical history.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-3xl w-full">
      {/* Account Info Header */}
      <div className="bg-[#EFF2F5] rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 border border-slate-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#0E4A43] text-[#E5F973] flex items-center justify-center font-black text-lg sm:text-xl flex-shrink-0">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">{user.fullName}</h3>
            <div className="text-xs sm:text-sm text-slate-600 truncate">{user.email ?? "No email"}</div>
            <div className="text-xs text-slate-500 mt-0.5">{user.phone ? `+91 ${user.phone}` : "Phone not added"}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            {user.role}
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
            {user.status}
          </span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => { setActiveSubTab("step1"); setErrorMsg(null); setSuccessMsg(null); }}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all text-center ${
            activeSubTab === "step1" ? "bg-[#0E4A43] text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          1. Personal Details &amp; Demographics
        </button>
        <button
          onClick={() => { setActiveSubTab("step2"); setErrorMsg(null); setSuccessMsg(null); }}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all text-center ${
            activeSubTab === "step2" ? "bg-[#0E4A43] text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          2. Medical History &amp; Allergies
        </button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <svg className="w-4 h-4 text-rose-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {errorMsg}
        </div>
      )}

      {/* Step 1 Form */}
      {activeSubTab === "step1" && (
        <form onSubmit={handleSaveStep1} className="bg-[#EFF2F5] rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 space-y-4 sm:space-y-5 border border-slate-200/50 shadow-2xs">
          <div>
            <h4 className="text-base font-black text-slate-900">Demographic &amp; Identification Details</h4>
            <p className="text-xs text-slate-600 mt-0.5">Keep your personal information up to date for public health programs.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Date of Birth</label>
              <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all">
                <option value="">Select</option>
                {GENDERS.map((g) => <option key={g} value={g}>{g.replace(/_/g," ")}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Village / Locality</label>
              <input type="text" value={village} onChange={(e) => setVillage(e.target.value)} placeholder="e.g. Ambegaon"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">District</label>
              <select value={district} onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all">
                {MAHARASHTRA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Pincode</label>
              <input type="text" maxLength={6} value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 411001"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Blood Group</label>
              <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all">
                <option value="">Select</option>
                {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">ABHA Health ID</label>
            <input type="text" value={abhaId} onChange={(e) => setAbhaId(e.target.value)} placeholder="14-digit ABHA Number"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Emergency Contact Name</label>
              <input type="text" value={ecName} onChange={(e) => setEcName(e.target.value)} placeholder="Name"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Emergency Contact Phone</label>
              <input type="tel" maxLength={10} value={ecPhone} onChange={(e) => setEcPhone(e.target.value.replace(/\D/g,""))} placeholder="10-digit mobile"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all" />
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-3.5 rounded-full text-sm font-bold text-white bg-[#0E4A43] hover:bg-[#083530] transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span>Save Details &amp; Continue</span><span className="text-base">&rsaquo;</span></>}
          </button>
        </form>
      )}

      {/* Step 2 Form */}
      {activeSubTab === "step2" && (
        <form onSubmit={handleSaveStep2} className="bg-[#EFF2F5] rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 space-y-4 sm:space-y-5 border border-slate-200/50 shadow-2xs">
          <div>
            <h4 className="text-base font-black text-slate-900">Medical History &amp; Chronic Conditions</h4>
            <p className="text-xs text-slate-600 mt-0.5">Comma-separated values for allergies, conditions, and ongoing medications.</p>
          </div>

          <div className="space-y-3.5 sm:space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Known Allergies</label>
              <input type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. Penicillin, Peanuts, Dust"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Chronic Conditions</label>
              <input type="text" value={chronicConditions} onChange={(e) => setChronicConditions(e.target.value)} placeholder="e.g. Hypertension, Diabetes Type 2"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Current Medications</label>
              <input type="text" value={currentMedications} onChange={(e) => setCurrentMedications(e.target.value)} placeholder="e.g. Metformin 500mg, Amlodipine"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Additional Clinical Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any relevant past surgeries or special conditions..." rows={3}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all resize-none" />
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-3.5 rounded-full text-sm font-bold text-white bg-[#0E4A43] hover:bg-[#083530] transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span>Save Medical History &amp; Finish</span><span className="text-base">&rsaquo;</span></>}
          </button>
        </form>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchUser = () => {
    authApi.me()
      .then((res) => setUser(res.data))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await authApi.logout().catch(() => {});
    router.push("/login");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#0E4A43] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs text-slate-500 font-medium">Loading your health dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col md:flex-row overflow-x-hidden max-w-full" style={{ fontFamily: "var(--font-quicksand, 'Quicksand', sans-serif)" }}>
      {/* Desktop Sidebar */}
      <DesktopSidebar user={user} activeTab={tab} setTab={setTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          {/* Mobile brand / menu toggle */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 rounded-2xl bg-[#EFF2F5] flex items-center justify-center text-slate-700 hover:text-slate-950 flex-shrink-0"
              aria-label="Toggle Dashboard Navigation"
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

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black text-slate-900 capitalize truncate">
                {tab === "overview"
                  ? `Good ${new Date().getHours() < 12 ? "morning" : "afternoon"}, ${user.fullName.split(" ")[0]}`
                  : tab === "profile"
                  ? "My Health Profile"
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#0E4A43]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              System Online
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0E4A43] text-[#E5F973] flex items-center justify-center font-black text-xs sm:text-sm">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0E4A43] text-white p-4 space-y-2 border-b border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-2">
              {navItems.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => { setTab(id); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2.5 p-3 rounded-2xl text-xs font-bold text-left transition-all ${
                    tab === id ? "bg-[#E5F973] text-slate-950 shadow-xs" : "bg-white/10 text-emerald-100 hover:bg-white/20"
                  }`}
                >
                  <span className="flex-shrink-0">{icon}</span>
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl text-xs font-bold text-rose-300 bg-rose-500/15 mt-2 hover:bg-rose-500/25 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Page Content with Zero Horizontal Overflow */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-full">
          {tab === "overview" && <OverviewTab user={user} setTab={setTab} />}
          {tab === "appointments" && (
            <PlaceholderTab
              title="Appointments"
              description="Book and manage your appointments at nearby PHC, CHC or specialist clinics."
              icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.253M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" /></svg>}
            />
          )}
          {tab === "prescriptions" && (
            <PlaceholderTab
              title="Prescriptions"
              description="View your digital prescriptions and medication history from all consultations."
              icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
            />
          )}
          {tab === "referrals" && (
            <PlaceholderTab
              title="Referrals"
              description="Track your inter-facility referrals from Sub-Centre to District Hospital in real time."
              icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>}
            />
          )}
          {tab === "profile" && <ProfileTab user={user} onProfileUpdated={fetchUser} />}
        </main>
      </div>
    </div>
  );
}
