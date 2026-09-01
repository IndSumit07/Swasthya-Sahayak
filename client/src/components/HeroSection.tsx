import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
      {/* Left Card: Clear & Simple Value Proposition */}
      <div className="lg:col-span-6 bg-[#EFF2F5] rounded-[28px] sm:rounded-[32px] p-6 sm:p-9 lg:p-11 flex flex-col justify-between relative overflow-hidden">
        <div className="space-y-4 sm:space-y-5">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#E5F973] text-slate-950 text-xs sm:text-sm font-bold tracking-tight max-w-full">
            <span className="w-2 h-2 rounded-full bg-[#0E4A43] animate-pulse flex-shrink-0" />
            <span className="truncate">Public Healthcare Portal for Maharashtra</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-2xl sm:text-4xl lg:text-[42px] xl:text-[44px] font-black text-slate-950 font-heading leading-[1.18] tracking-tight">
            Find doctors, live hospital beds &amp; care for{" "}
            <span className="inline-block bg-white/90 px-2.5 sm:px-3 py-0.5 rounded-2xl shadow-xs border border-slate-200/50">
              every family
            </span>
          </h1>

          {/* Simple Description */}
          <p className="text-slate-600 text-xs sm:text-sm lg:text-base leading-relaxed font-normal max-w-lg">
            Swasthya Sahayak makes public healthcare easy to access. Find nearby Primary Health Centres (PHCs) and hospitals, check live bed availability, connect with doctors online, and view medicine stock before you travel.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <Link
              href="/facilities"
              className="px-6 py-3 rounded-full text-xs sm:text-sm font-bold text-white bg-[#0E4A43] hover:bg-[#083530] shadow-sm transition-all hover:shadow-md active:scale-95 text-center flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-[#E5F973]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span>Find Nearby Hospitals &amp; Beds</span>
            </Link>
            <Link
              href="/login"
              className="px-5 py-3 rounded-full text-xs sm:text-sm font-semibold text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs flex items-center justify-center gap-1.5 transition-all text-center"
            >
              <span>Patient &amp; Staff Login</span>
              <span className="text-base leading-none">&rsaquo;</span>
            </Link>
          </div>
        </div>

        {/* Bottom Proof / Coverage */}
        <div className="flex items-center gap-3.5 pt-6 mt-6 border-t border-slate-300/50">
          <div className="flex items-center -space-x-2.5 flex-shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full ring-2 ring-white overflow-hidden bg-slate-200 relative shadow-2xs">
              <Image
                src="/doctor_patient.jpg"
                alt="Doctor with patient"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full ring-2 ring-white overflow-hidden bg-slate-300 relative shadow-2xs">
              <Image
                src="/medical_team.png"
                alt="Medical team"
                width={40}
                height={40}
                className="w-full h-full object-cover object-left"
              />
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full ring-2 ring-white overflow-hidden bg-slate-400 relative shadow-2xs">
              <Image
                src="/doctor_female.png"
                alt="Healthcare doctor"
                width={40}
                height={40}
                className="w-full h-full object-cover object-right"
              />
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full ring-2 ring-white bg-[#E5F973] text-slate-950 font-bold text-[11px] sm:text-xs flex items-center justify-center shadow-xs">
              2.4k+
            </div>
          </div>

          <p className="text-[11px] sm:text-xs font-medium text-slate-700 leading-tight max-w-[240px]">
            Connected Health Centres, Doctors &amp; Frontline Workers
          </p>
        </div>
      </div>

      {/* Right Card: Medical Team Visual */}
      <div className="lg:col-span-6 relative rounded-[28px] sm:rounded-[32px] overflow-hidden min-h-[300px] sm:min-h-[400px] lg:min-h-[480px] shadow-sm bg-slate-200 group flex items-end">
        <Image
          src="/medical_team.png"
          alt="Healthcare Medical Specialists"
          fill
          priority
          className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
        />

        {/* Floating Top-Left Badge */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-slate-950/85 backdrop-blur-md rounded-full px-3 py-1.5 sm:px-3.5 sm:py-1.5 text-white text-[11px] sm:text-xs font-semibold flex items-center gap-2 border border-white/20 shadow-md max-w-[calc(100%-2rem)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
          <span className="truncate">मराठी • हिन्दी • English</span>
        </div>

        {/* Floating Live Verified Rating Badge */}
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3.5 px-3 sm:px-4 shadow-xl flex items-center gap-2.5 sm:gap-3 border border-white/80 max-w-[calc(100%-2rem)]">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-xs sm:text-sm text-slate-950 font-heading">Verified &amp; Active</span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 block">
              Government Health Network
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
