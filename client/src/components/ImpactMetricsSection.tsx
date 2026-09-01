import Link from "next/link";

const impactMetrics = [
  {
    value: "70%",
    label: "Reduced Travel Time",
    desc: "Online teleconsultations and live clinic information help families avoid hours of unnecessary travel.",
    sub: "Care closer to home",
  },
  {
    value: "Live",
    label: "Bed & ICU Tracker",
    desc: "Check available general and ICU beds in advance before traveling to a community or district hospital.",
    sub: "Real-time updates",
  },
  {
    value: "36",
    label: "Districts Covered",
    desc: "Comprehensive health directory connecting Sub-Centres, PHCs, and District Hospitals across Maharashtra.",
    sub: "Statewide public network",
  },
  {
    value: "24×7",
    label: "Emergency Support",
    desc: "Instant access to health advice, symptom check-up, and emergency ambulance dispatch (104 / 108).",
    sub: "Always available",
  },
];

export default function ImpactMetricsSection() {
  return (
    <section className="bg-[#0E4A43] text-white rounded-[32px] p-7 sm:p-10 lg:p-12 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -left-28 w-72 h-72 bg-[#E5F973]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#E5F973] text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#E5F973] animate-pulse" />
              <span>Public Health Impact</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight">
              Better Healthcare Access for Every Community
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed">
              Helping citizens, doctors, and health workers stay connected with transparent medical resources and timely care.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/facilities"
              className="px-6 py-3 rounded-full text-xs sm:text-sm font-bold text-slate-950 bg-[#E5F973] hover:bg-[#d9ed5f] transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
            >
              <span>Explore Facilities</span>
              <span className="text-base leading-none">&rsaquo;</span>
            </Link>
          </div>
        </div>

        {/* 4 Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {impactMetrics.map(({ value, label, desc, sub }) => (
            <div
              key={label}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 flex flex-col justify-between space-y-4 hover:bg-white/[0.14] transition-all"
            >
              <div>
                <div className="text-3xl sm:text-4xl font-black text-[#E5F973] tracking-tight">
                  {value}
                </div>
                <div className="text-sm font-bold text-white mt-1">
                  {label}
                </div>
                <p className="text-xs text-emerald-100/70 mt-2 leading-relaxed font-normal">
                  {desc}
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 text-[11px] font-semibold text-emerald-200/90 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E5F973]" />
                <span>{sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
