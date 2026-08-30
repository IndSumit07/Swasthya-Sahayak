import Image from "next/image";
import Link from "next/link";

export default function HeroBentoGrid() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
      {/* Card 1: Continuity of Care & Longitudinal Records */}
      <div className="bg-[#EFF2F5] rounded-[28px] p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden min-h-[220px]">
        <div className="space-y-2 z-10 max-w-[62%]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0E4A43]">
            Zero Information Loss
          </span>
          <h3 className="text-base sm:text-lg font-bold text-slate-950 font-heading leading-snug">
            Longitudinal Records &amp; Referrals
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Continuous patient history from Sub-Centre to District Hospital without lost paper files.
          </p>
        </div>

        {/* Visual Preview */}
        <div className="absolute -bottom-2 -right-3 w-40 h-36 rounded-2xl overflow-hidden shadow-sm">
          <Image
            src="/doctor_patient.jpg"
            alt="Doctor Patient Care"
            fill
            className="object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#EFF2F5] via-transparent to-transparent" />
        </div>
      </div>

      {/* Card 2: Essential Care Checklists (Maternal, Child, NCD, Diagnostics) */}
      <div className="bg-[#E5F973] rounded-[28px] p-6 sm:p-7 flex flex-col justify-between min-h-[220px] text-slate-950">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
            High-Risk Follow-up
          </span>
          <h3 className="text-base sm:text-lg font-black font-heading mb-3 mt-0.5">
            Priority Care &amp; Health Programs:
          </h3>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <span className="px-2.5 py-1 bg-white rounded-full text-[11px] sm:text-xs font-bold text-slate-950 shadow-xs">
              + Maternal &amp; ANC Tracking
            </span>
            <span className="px-2.5 py-1 bg-white rounded-full text-[11px] sm:text-xs font-bold text-slate-950 shadow-xs">
              + Child Immunization
            </span>
            <span className="px-2.5 py-1 bg-white rounded-full text-[11px] sm:text-xs font-bold text-slate-950 shadow-xs">
              + Chronic NCDs (BP/Sugar)
            </span>
            <span className="px-2.5 py-1 bg-white rounded-full text-[11px] sm:text-xs font-bold text-slate-950 shadow-xs">
              + Emergency Escalation
            </span>
            <span className="px-2.5 py-1 bg-white rounded-full text-[11px] sm:text-xs font-bold text-slate-950 shadow-xs">
              + Lab Test Coordination
            </span>
            <span className="px-2.5 py-1 bg-white rounded-full text-[11px] sm:text-xs font-bold text-slate-950 shadow-xs">
              + Essential Medicine Tracker
            </span>
          </div>
        </div>

        <Link
          href="#programs"
          className="text-xs sm:text-sm font-extrabold text-slate-950 hover:underline flex items-center gap-1 mt-4 pt-2 font-heading"
        >
          <span>Explore High-Risk Registry</span>
          <span>&rsaquo;</span>
        </Link>
      </div>

      {/* Card 3: Real-Time Availability & Accountability */}
      <div className="bg-[#EFF2F5] rounded-[28px] p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden min-h-[220px]">
        <div className="space-y-2 z-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0E4A43]">
            Facility Dashboards
          </span>
          <h3 className="text-base sm:text-lg font-bold text-slate-950 font-heading leading-snug">
            Medicine &amp; Diagnostic Visibility
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed max-w-[90%] font-normal">
            Real-time stock alerts for essential drugs, specialist doctor roasters, and reduced waiting times.
          </p>
        </div>

        {/* Quality Wave Graphic */}
        <div className="relative w-full h-14 mt-3 opacity-80">
          <svg className="w-full h-full text-slate-300" viewBox="0 0 300 80" fill="none">
            <path
              d="M0 60 C 50 65, 80 40, 130 50 C 180 60, 220 20, 300 10 L 300 80 L 0 80 Z"
              fill="currentColor"
              fillOpacity="0.4"
            />
            <path
              d="M0 70 C 60 75, 100 55, 160 50 C 210 45, 250 35, 300 25"
              stroke="#0E4A43"
              strokeWidth="2.5"
              strokeDasharray="4 4"
            />
            <circle cx="160" cy="50" r="4.5" fill="#0E4A43" />
            <circle cx="300" cy="25" r="4.5" fill="#E5F973" stroke="#0E4A43" strokeWidth="2" />
          </svg>
        </div>
      </div>
    </section>
  );
}
