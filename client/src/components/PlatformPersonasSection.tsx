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
    scope: "For Patients & Families",
    tagline: "Find nearby care, live hospital beds & digital prescriptions",
    description: "Search for the nearest health centre, check available beds before leaving home, consult doctors online, and access your prescriptions and medical history on your phone.",
    keyFeatures: [
      "Find nearby Primary Health Centres (PHCs) & Civil Hospitals",
      "Check live general and ICU bed availability in real-time",
      "Online doctor teleconsultations in your regional language",
      "Easy access to digital prescriptions & lab test records",
    ],
    ctaText: "Patient Sign In / Register",
    ctaHref: "/register",
  },
  {
    id: "health_worker",
    roleTitle: "Frontline Health Worker (ASHA / ANM)",
    marathiLabel: "आशा / एएनएम सेविका",
    scope: "For Village Health Workers",
    tagline: "Doorstep symptom check-ups & assisted doctor consultations",
    description: "Built for easy use on mobile devices. ASHA and ANM workers assist village families with symptom evaluations, connect patients with doctors via tele-OPD, and organize hospital transfers.",
    keyFeatures: [
      "Quick and simple patient check-in on mobile phones",
      "Connect village patients to online doctor video/audio calls",
      "Maternal and child immunization reminders",
      "Direct referral escalation to nearest hospital",
    ],
    ctaText: "Health Worker Portal",
    ctaHref: "/login",
  },
  {
    id: "doctor",
    roleTitle: "Doctor & Specialist",
    marathiLabel: "वैद्यकीय अधिकारी / डॉक्टर",
    scope: "For Registered Doctors",
    tagline: "Online consultation queue, patient history & e-prescriptions",
    description: "Qualified doctors and medical specialists consult rural and remote patients, review past health records, and issue verified digital prescriptions in minutes.",
    keyFeatures: [
      "Clean consultation queue and tele-OPD workbench",
      "Review patient symptoms and medical background",
      "Write digital prescriptions with local medicine check",
      "Generate specialist hospital referral notes",
    ],
    ctaText: "Doctor Portal Sign In",
    ctaHref: "/login",
  },
  {
    id: "facility_admin",
    roleTitle: "Hospital & Facility Admin",
    marathiLabel: "आरोग्य केंद्र प्रशासक",
    scope: "For Clinic & Hospital Staff",
    tagline: "Update live bed counts, medicine supplies & doctor rosters",
    description: "Health centre administrators manage OPD timings, update bed vacancies in real time, and ensure essential medicines stay well-stocked for the community.",
    keyFeatures: [
      "Update live general, ICU, and oxygen bed vacancy",
      "Manage essential medicine stock and inventory alerts",
      "Schedule doctor duty hours & OPD timings",
      "Monitor patient check-ins and reduce wait times",
    ],
    ctaText: "Hospital Admin Login",
    ctaHref: "/login",
  },
];

export default function PlatformPersonasSection() {
  const [activeTab, setActiveTab] = useState<string>("patient");
  const currentPersona = personas.find((p) => p.id === activeTab) ?? personas[0];

  return (
    <section id="portals" className="bg-white rounded-[32px] p-6 sm:p-9 lg:p-11 border border-slate-200/80 shadow-xs relative overflow-hidden">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E5F973] text-slate-950 text-xs sm:text-sm font-bold tracking-tight">
            <span className="w-2 h-2 rounded-full bg-[#0E4A43] animate-pulse" />
            <span>Built for Everyone</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 font-heading tracking-tight leading-tight">
            One Unified Platform for Healthcare Access
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Tailored, user-friendly portals for patients, village health workers, doctors, and hospital administrators.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 bg-[#EFF2F5] rounded-2xl sm:rounded-3xl w-full border border-slate-200/50">
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
                <span>{currentPersona.scope}</span>
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
              <span className="text-xs font-bold text-slate-900">Why Use Swasthya Sahayak</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">Fast &amp; Free</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-[#EFF2F5] rounded-xl">
                <div className="font-bold text-slate-800 mb-0.5">Real-Time Information</div>
                <div className="text-slate-500 text-[11px] leading-relaxed">Accurate hospital bed vacancy, doctor timings, and medicine availability.</div>
              </div>
              <div className="p-3 bg-[#EFF2F5] rounded-xl">
                <div className="font-bold text-slate-800 mb-0.5">Works in Remote Areas</div>
                <div className="text-slate-500 text-[11px] leading-relaxed">Optimized to load fast on any smartphone or basic internet connection.</div>
              </div>
              <div className="p-3 bg-[#EFF2F5] rounded-xl">
                <div className="font-bold text-slate-800 mb-0.5">24x7 Emergency Help</div>
                <div className="text-slate-500 text-[11px] leading-relaxed">Direct links to emergency medical helpline 104 and ambulance dispatch 108.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
