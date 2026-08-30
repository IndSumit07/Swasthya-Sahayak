import Image from "next/image";
import Link from "next/link";

export default function DiagnosticsSection() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
      
      {/* 1. Left Card: Clinical Lab Blood Test Photo */}
      <div className="lg:col-span-3 xl:col-span-3 rounded-[28px] overflow-hidden relative min-h-[220px] sm:min-h-[250px] shadow-xs bg-slate-200 group">
        <Image
          src="/blood_test_lab.png"
          alt="Clinical Laboratory Blood Test"
          fill
          className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* 2. Middle Card: Express Lab Tests Information & Dual CTAs */}
      <div className="lg:col-span-5 xl:col-span-5 bg-[#EFF2F5] rounded-[28px] p-6 sm:p-8 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-heading tracking-tight mb-2.5">
            Express Diagnostics &amp; Lab Tests
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
            We conduct a comprehensive range of point-of-care laboratory tests essential for early illness detection, chronic disease staging, and maternal screening across rural health centres.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold text-white bg-[#0E4A43] hover:bg-[#083530] transition-all shadow-sm active:scale-95">
            Book Lab Test
          </button>
          <button className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs flex items-center gap-1.5 transition-all">
            <span>Learn more</span>
            <span className="text-base leading-none">&rsaquo;</span>
          </button>
        </div>
      </div>

      {/* 3. Right Card: Diagnostic Test Badges (Lime Accent) */}
      <div className="lg:col-span-4 xl:col-span-4 bg-[#E5F973] rounded-[28px] p-6 sm:p-7 flex flex-col justify-center text-slate-950">
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1.5 bg-white rounded-full text-[11px] sm:text-xs font-bold text-slate-950 shadow-xs">
            + Blood &amp; Complete Hemogram
          </span>
          <span className="px-3 py-1.5 bg-white rounded-full text-[11px] sm:text-xs font-bold text-slate-950 shadow-xs">
            + Vitamins
          </span>
          <span className="px-3 py-1.5 bg-white rounded-full text-[11px] sm:text-xs font-bold text-slate-950 shadow-xs">
            + Liver &amp; Kidney Enzymes
          </span>
          <span className="px-3 py-1.5 bg-white rounded-full text-[11px] sm:text-xs font-bold text-slate-950 shadow-xs">
            + Specific Proteins &amp; Biomarkers
          </span>
          <span className="px-3 py-1.5 bg-white rounded-full text-[11px] sm:text-xs font-bold text-slate-950 shadow-xs">
            + Hormonal &amp; Thyroid Screen
          </span>
          <span className="px-3 py-1.5 bg-white rounded-full text-[11px] sm:text-xs font-bold text-slate-950 shadow-xs">
            + Immunohematology
          </span>
          <button className="px-3.5 py-1.5 bg-[#0E4A43] text-white rounded-full text-[11px] sm:text-xs font-bold shadow-xs hover:bg-[#083530] transition-colors flex items-center gap-1">
            <span>More</span>
            <span className="text-xs">↗</span>
          </button>
        </div>
      </div>

    </section>
  );
}
