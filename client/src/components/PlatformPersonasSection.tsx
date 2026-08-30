"use client";

import { useState } from "react";
import Link from "next/link";

interface Persona {
  id: string;
  roleTitle: string;
  marathiLabel: string;
  scope: string;
  tagline: string;
  description: string;
  keyFeatures: string[];
  ctaText: string;
  ctaHref: string;
}

const personas: Persona[] = [
  {
    id: "patient",
    roleTitle: "Patient / Citizen",
    marathiLabel: "रुग्ण / नागरिक",
    scope: "Own Health Records Only",
    tagline: "Lifelong digital health records, teleconsultations & medicine access",
    description: "Empowering rural citizens with instant appointment booking at local PHCs, assisted teleconsultations with city specialists, and SMS/WhatsApp medicine availability alerts.",
    keyFeatures: [
      "Linked ABHA ID for zero paper record loss",
      "Point-of-care digital prescriptions & lab reports",
      "Inter-facility referral tracking from village to hospital",
      "Multilingual teleconsultations in Marathi, Hindi & English",
    ],
    ctaText: "Register as Citizen / Patient",
    ctaHref: "/register",
  },
  {
    id: "health_worker",
    roleTitle: "Frontline Health Worker (ASHA / ANM)",
    marathiLabel: "आशा / एएनएम सेविका",
    scope: "Assigned Facility & Village Catchment",
    tagline: "Doorstep clinical triage, maternal tracking & assisted kiosk OPD",
    description: "Built for low-bandwidth and offline environments. ASHA and ANM workers record patient vitals, initiate tele-consults for village kiosks, and conduct high-risk maternal follow-ups.",
    keyFeatures: [
      "Offline-first mobile data capture with auto-sync",
      "Rule-based maternal ANC/PNC & child immunization alerts",
      "Assisted teleconsultation initiation for elderly/critical patients",
      "Direct referral escalation to nearest PHC/CHC",
    ],
    ctaText: "Access Frontline Desk",
    ctaHref: "/login",
  },
  {
    id: "doctor",
    roleTitle: "Doctor & Specialist",
    marathiLabel: "वैद्यकीय अधिकारी / तज्ज्ञ डॉक्टर",
    scope: "Active Consultations & Referrals",
    tagline: "Tele-OPD queue management, digital prescribing & referral generation",
    description: "Specialists in District Hospitals and Medical Colleges provide expert consultations to rural patients, review full longitudinal medical history, and issue verified e-prescriptions.",
    keyFeatures: [
      "Interactive Tele-OPD consultation workbench",
      "Access to patient's full longitudinal health history",
      "Instant e-prescription with local PHC stock check",
      "Specialist referral generation with priority flags",
    ],
    ctaText: "Doctor Portal Sign In",
    ctaHref: "/login",
  },
  {
    id: "facility_admin",
    roleTitle: "Health Facility Administrator",
    marathiLabel: "आरोग्य केंद्र प्रशासक",
    scope: "Facility-Level Operations",
    tagline: "Real-time doctor rosters, bed inventory, medicine stock & queue tracking",
    description: "Facility superintendents at PHCs, CHCs, and Sub-District Hospitals manage appointment quotas, monitor daily waiting times, and prevent stock-outs of essential medicines.",
    keyFeatures: [
      "Live medicine inventory & essential drug stock management",
      "Doctor duty rosters & tele-OPD slot configuration",
      "Inpatient bed occupancy & observation ward status",
      "Real-time token and waiting time monitoring",
    ],
    ctaText: "Facility Admin Portal",
    ctaHref: "/login",
  },
  {
    id: "district_admin",
    roleTitle: "District & State Health Officer",
    marathiLabel: "जिल्हा आरोग्य अधिकारी (DHO)",
    scope: "District / State-Wide Aggregated Data",
    tagline: "Public health surveillance, referral completion & quality monitoring",
    description: "Decision-makers in Maharashtra's 36 districts monitor public health indices, track inter-facility referral dropouts, and allocate emergency resources in real-time.",
    keyFeatures: [
      "District-wide referral completion rate heatmaps",
      "Epidemiological outbreak & seasonal disease alerts",
      "PHC & CHC performance, wait-time & resource audit",
      "Maternal & infant mortality risk surveillance",
    ],
    ctaText: "District Health Dashboard",
    ctaHref: "/login",
  },
];

export default function PlatformPersonasSection() {
  const [activeTab, setActiveTab] = useState<string>("patient");
  const currentPersona = personas.find((p) => p.id === activeTab) ?? personas[0];

  return (
    <section className="bg-white rounded-[32px] p-6 sm:p-9 lg:p-11 border border-slate-200/80 shadow-xs relative overflow-hidden">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E5F973] text-slate-950 text-xs sm:text-sm font-bold tracking-tight">
            <span className="w-2 h-2 rounded-full bg-[#0E4A43] animate-pulse" />
            <span>Role-Based Access Control (RBAC)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 font-heading tracking-tight leading-tight">
            Five Roles, One Unified Public Health Platform
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Tailored interfaces designed specifically for rural citizens, frontline healthcare workers, specialist doctors, and district health officers.
          </p>
        </div>

        {/* Tab Selector — Clean Responsive Segmented Control */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-2 bg-[#EFF2F5] rounded-2xl sm:rounded-3xl w-full border border-slate-200/50">
          {personas.map((persona) => {
            const isActive = activeTab === persona.id;
            return (
              <button
                key={persona.id}
                onClick={() => setActiveTab(persona.id)}
                className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl text-left transition-all flex flex-col justify-between gap-1.5 ${
                  isActive
                    ? "bg-[#0E4A43] text-white shadow-sm"
                    : "bg-white/70 hover:bg-white text-slate-700 hover:text-slate-950 border border-slate-200/40"
                }`}
              >
                <div className="text-xs sm:text-sm font-black font-heading leading-tight line-clamp-2">
                  {persona.roleTitle}
                </div>
                <div className={`text-[10px] font-semibold tracking-wide ${isActive ? "text-[#E5F973]" : "text-slate-500"}`}>
                  {persona.marathiLabel}
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab Content Box */}
        <div className="bg-[#EFF2F5] rounded-[28px] p-5 sm:p-8 lg:p-10 border border-slate-200/60 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-[#0E4A43]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Scope: {currentPersona.scope}</span>
              </div>

              <h3 className="text-lg sm:text-2xl font-black text-slate-950 font-heading leading-tight">
                {currentPersona.tagline}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                {currentPersona.description}
              </p>

              <div className="space-y-2 pt-1">
                {currentPersona.keyFeatures.map((feat) => (
                  <div key={feat} className="flex items-start gap-2.5 text-xs text-slate-800 font-medium">
                    <div className="w-5 h-5 rounded-full bg-[#E5F973] text-slate-950 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <Link
                href={currentPersona.ctaHref}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-bold text-white bg-[#0E4A43] hover:bg-[#083530] transition-all shadow-xs active:scale-95 text-center"
              >
                <span>{currentPersona.ctaText}</span>
                <span className="text-base leading-none">&rsaquo;</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">Portal Security &amp; Compliance</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">ABDM Certified</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-[#EFF2F5] rounded-xl">
                <div className="font-bold text-slate-800 mb-0.5">Data Privacy</div>
                <div className="text-slate-500 text-[11px] leading-relaxed">Strict least-privilege RBAC matrix enforcing patient consent for medical history access.</div>
              </div>
              <div className="p-3 bg-[#EFF2F5] rounded-xl">
                <div className="font-bold text-slate-800 mb-0.5">Connectivity Resilient</div>
                <div className="text-slate-500 text-[11px] leading-relaxed">Optimized for 2G/3G rural networks with full offline sync queues.</div>
              </div>
              <div className="p-3 bg-[#EFF2F5] rounded-xl">
                <div className="font-bold text-slate-800 mb-0.5">104 / 108 Emergency Tie-in</div>
                <div className="text-slate-500 text-[11px] leading-relaxed">One-click triage escalation directly connecting to emergency ambulance dispatch.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
