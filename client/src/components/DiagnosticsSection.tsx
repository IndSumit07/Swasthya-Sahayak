import Image from "next/image";
import Link from "next/link";

export default function DiagnosticsSection() {
  return (
    <section id="diagnostics" className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
      
      {/* 1. Left Card: Clinical Lab Photo */}
      <div className="lg:col-span-3 xl:col-span-3 rounded-[28px] overflow-hidden relative min-h-[220px] sm:min-h-[250px] shadow-xs bg-slate-200 group">
        <Image
          src="/blood_test_lab.png"
          alt="Clinical Laboratory Blood Test"
          fill
          className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* 2. Middle Card: Lab Tests Information & CTAs */}
      <div className="lg:col-span-5 xl:col-span-5 bg-[#EFF2F5] rounded-[28px] p-6 sm:p-8 flex flex-col justify-between space-y-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5F973] text-slate-950 text-xs font-bold mb-2.5">
            <span>Diagnostic Support</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-heading tracking-tight mb-2.5">
            Diagnostic &amp; Lab Tests
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
            Essential point-of-care laboratory tests conducted at government health centres for early detection, routine health checks, and maternal care.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/facilities"
            className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold text-white bg-[#0E4A43] hover:bg-[#083530] transition-all shadow-sm active:scale-95 text-center"
          >
            Find Diagnostic Centres
          </Link>
          <Link
            href="/facilities"
            className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs flex items-center gap-1.5 transition-all text-center"
          >
            <span>Check Availability</span>
            <span className="text-base leading-none">&rsaquo;</span>
          </Link>
        </div>
      </div>

      {/* 3. Right Card: Diagnostic Test Badges */}
      <div className="lg:col-span-4 xl:col-span-4 bg-[#E5F973] rounded-[28px] p-6 sm:p-7 flex flex-col justify-center text-slate-950">
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1.5 bg-white rounded-full text-[11px] sm:text-xs font-bold text-slate-950 shadow-xs">
            Complete Blood Count (CBC)
          </span>
          <span className="px-3 py-1.5 bg-white rounded-full text-[11px] sm:text-xs font-bold text-slate-950 shadow-xs">
            Blood Sugar &amp; Diabetes Test
          </span>
          <span className="px-3 py-1.5 bg-white rounded-full text-[11px] sm:text-xs font-bold text-slate-950 shadow-xs">
            Thyroid &amp; Hormone Screen
          </span>
          <span className="px-3 py-1.5 bg-white rounded-full text-[11px] sm:text-xs font-bold text-slate-950 shadow-xs">
            Liver &amp; Kidney Check
          </span>
          <span className="px-3 py-1.5 bg-white rounded-full text-[11px] sm:text-xs font-bold text-slate-950 shadow-xs">
            Vitamin &amp; Calcium Levels
          </span>
          <span className="px-3 py-1.5 bg-white rounded-full text-[11px] sm:text-xs font-bold text-slate-950 shadow-xs">
            Urine &amp; Basic Lab Work
          </span>
          <Link
            href="/facilities"
            className="px-3.5 py-1.5 bg-[#0E4A43] text-white rounded-full text-[11px] sm:text-xs font-bold shadow-xs hover:bg-[#083530] transition-colors flex items-center gap-1"
          >
            <span>View All</span>
            <span className="text-xs">&rarr;</span>
          </Link>
        </div>
      </div>

    </section>
  );
}
