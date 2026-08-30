import Link from "next/link";

const workflowSteps = [
  {
    step: "01",
    title: "Village-Level Assisted Triage",
    desc: "ASHA & ANM health workers record vitals and evaluate symptoms at sub-centres using standardized rule-based clinical triage.",
    badge: "Sub-Centre / Doorstep",
    color: "bg-emerald-50 text-emerald-900 border-emerald-200",
    icon: (
      <svg className="w-6 h-6 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    step: "02",
    title: "Assisted Specialist Teleconsultation",
    desc: "Low-bandwidth audio/video consult with Medical Officers & Specialists in Marathi, Hindi & English without long commutes.",
    badge: "Tele-OPD Kiosk",
    color: "bg-teal-50 text-teal-900 border-teal-200",
    icon: (
      <svg className="w-6 h-6 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "Instant E-Prescriptions & Stock Check",
    desc: "Doctors issue digital prescriptions while the platform checks real-time medicine availability at the patient's local PHC dispensary.",
    badge: "PHC Pharmacy",
    color: "bg-lime-50 text-lime-900 border-lime-200",
    icon: (
      <svg className="w-6 h-6 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    step: "04",
    title: "Closed-Loop Referral Escalation",
    desc: "When tertiary care is needed, patients are referred with clinical notes and pre-booked slots at CHC or District Hospital.",
    badge: "PHC → District Hospital",
    color: "bg-amber-50 text-amber-900 border-amber-200",
    icon: (
      <svg className="w-6 h-6 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    step: "05",
    title: "Point-of-Care Diagnostics & Records",
    desc: "Diagnostic samples are collected and synced directly to the patient's ABDM-linked longitudinal health record.",
    badge: "Lab Coordination",
    color: "bg-sky-50 text-sky-900 border-sky-200",
    icon: (
      <svg className="w-6 h-6 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.942A4.5 4.5 0 0115.9 16.5H8.1a4.5 4.5 0 01-2.33-.658L4.2 14.9" />
      </svg>
    ),
  },
  {
    step: "06",
    title: "Doorstep High-Risk Follow-up",
    desc: "Automated alerts prompt ASHA workers for maternal ANC/PNC check-ins and chronic diabetes/hypertension management.",
    badge: "Doorstep Retention",
    color: "bg-rose-50 text-rose-900 border-rose-200",
    icon: (
      <svg className="w-6 h-6 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
];

export default function CareWorkflowSection() {
  return (
    <section className="bg-[#EFF2F5] rounded-[32px] p-6 sm:p-9 lg:p-11 relative overflow-hidden">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E5F973] text-slate-950 text-xs sm:text-sm font-bold tracking-tight">
              <span className="w-2 h-2 rounded-full bg-[#0E4A43] animate-pulse" />
              <span>Continuum of Care (PS 26133)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 font-heading tracking-tight leading-tight">
              Strengthening Maharashtra&apos;s Public Health Delivery
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              From village sub-centres to district hospitals, patients and healthcare providers stay connected through a single, continuous care journey.
            </p>
          </div>

          <Link
            href="/register"
            className="self-start md:self-auto px-6 py-3 rounded-full text-xs sm:text-sm font-bold text-white bg-[#0E4A43] hover:bg-[#083530] transition-all shadow-xs active:scale-95 flex items-center gap-2 flex-shrink-0"
          >
            <span>Experience Care Access</span>
            <span className="text-base leading-none">&rsaquo;</span>
          </Link>
        </div>

        {/* 6 Step Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {workflowSteps.map(({ step, title, desc, badge, color, icon }) => (
            <div
              key={step}
              className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4 group hover:-translate-y-0.5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#EFF2F5] flex items-center justify-center group-hover:bg-[#E5F973]/50 transition-colors">
                    {icon}
                  </div>
                  <span className="text-2xl font-black text-slate-300 font-heading group-hover:text-[#0E4A43] transition-colors">
                    {step}
                  </span>
                </div>

                <div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border mb-2 ${color}`}>
                    {badge}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 leading-snug font-heading">
                    {title}
                  </h3>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {desc}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400 group-hover:text-[#0E4A43] transition-colors">
                <span>Integrated ABDM Record</span>
                <span className="text-sm font-bold">&rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
