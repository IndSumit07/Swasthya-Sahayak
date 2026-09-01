import Link from "next/link";

const workflowSteps = [
  {
    step: "01",
    title: "Search & Find Nearby Facilities",
    desc: "Search by district or village to find health centres, open OPD timings, active doctor rosters, and phone numbers.",
    badge: "Locate Clinics",
    color: "bg-emerald-50 text-emerald-900 border-emerald-200",
    icon: (
      <svg className="w-6 h-6 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  },
  {
    step: "02",
    title: "Check Live Beds & Medicines",
    desc: "Check available general and ICU beds and verify essential drug stock in real-time before you travel.",
    badge: "Live Availability",
    color: "bg-teal-50 text-teal-900 border-teal-200",
    icon: (
      <svg className="w-6 h-6 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 011.875 1.875v13.125H3.75V6.375A1.875 1.875 0 015.625 4.5z" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "Doctor Teleconsultations",
    desc: "Connect with doctors and specialists in Marathi, Hindi, or English for medical guidance and symptom check-ups.",
    badge: "Online Consult",
    color: "bg-lime-50 text-lime-900 border-lime-200",
    icon: (
      <svg className="w-6 h-6 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    step: "04",
    title: "Digital Prescriptions & Referrals",
    desc: "Receive digital prescriptions on your phone and get direct hospital referrals without lost paper records.",
    badge: "Seamless Transfer",
    color: "bg-amber-50 text-amber-900 border-amber-200",
    icon: (
      <svg className="w-6 h-6 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
];

export default function CareWorkflowSection() {
  return (
    <section id="care-flow" className="bg-[#EFF2F5] rounded-[32px] p-6 sm:p-9 lg:p-11 relative overflow-hidden">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E5F973] text-slate-950 text-xs sm:text-sm font-bold tracking-tight">
              <span className="w-2 h-2 rounded-full bg-[#0E4A43] animate-pulse" />
              <span>Simple Healthcare Access</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 font-heading tracking-tight leading-tight">
              How Swasthya Sahayak Works
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              A simple 4-step journey designed to help patients and families get fast, reliable medical care without stress.
            </p>
          </div>

          <Link
            href="/facilities"
            className="self-start md:self-auto px-6 py-3 rounded-full text-xs sm:text-sm font-bold text-white bg-[#0E4A43] hover:bg-[#083530] transition-all shadow-xs active:scale-95 flex items-center gap-2 flex-shrink-0"
          >
            <span>Browse Directory</span>
            <span className="text-base leading-none">&rsaquo;</span>
          </Link>
        </div>

        {/* 4 Step Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
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
                <span>Fast &amp; Transparent</span>
                <span className="text-sm font-bold">&rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
