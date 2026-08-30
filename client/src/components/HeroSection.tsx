import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
      {/* Left Card: PS 26133 Problem & Integrated Public Health Solution */}
      <div className="lg:col-span-6 bg-[#EFF2F5] rounded-[28px] sm:rounded-[32px] p-6 sm:p-9 lg:p-11 flex flex-col justify-between relative overflow-hidden">
        <div className="space-y-4 sm:space-y-5">
          {/* Badge: PS ID & Organization */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#E5F973] text-slate-950 text-xs sm:text-sm font-bold tracking-tight max-w-full">
            <span className="w-2 h-2 rounded-full bg-[#0E4A43] animate-pulse flex-shrink-0" />
            <span className="truncate">PS 26133 • Rural &amp; Underserved Healthcare</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-2xl sm:text-4xl lg:text-[42px] xl:text-[44px] font-black text-slate-950 font-heading leading-[1.18] tracking-tight">
            Accessible, quality public healthcare for{" "}
            <span className="inline-block bg-white/90 px-2.5 sm:px-3 py-0.5 rounded-2xl shadow-xs border border-slate-200/50">
              every village
            </span>
          </h1>

          {/* Description based on PS 26133 */}
          <p className="text-slate-600 text-xs sm:text-sm lg:text-base leading-relaxed font-normal max-w-lg">
            Bridging distances with assisted teleconsultations, digital triage, longitudinal patient records (ABDM), and seamless referral tracking across Sub-Centres, PHCs, CHCs, and District Hospitals.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <Link
              href="/register"
              className="px-6 py-3 rounded-full text-xs sm:text-sm font-bold text-white bg-[#0E4A43] hover:bg-[#083530] shadow-sm transition-all hover:shadow-md active:scale-95 text-center"
            >
              Start Assisted Triage
            </Link>
            <Link
              href="/login"
              className="px-5 py-3 rounded-full text-xs sm:text-sm font-semibold text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs flex items-center justify-center gap-1.5 transition-all text-center"
            >
              <span>Track Referrals &amp; Beds</span>
              <span className="text-base leading-none">&rsaquo;</span>
            </Link>
          </div>
        </div>

        {/* Bottom Frontline Proof / Rural Network Coverage */}
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
                alt="Specialist doctor"
                width={40}
                height={40}
                className="w-full h-full object-cover object-left"
              />
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full ring-2 ring-white overflow-hidden bg-slate-400 relative shadow-2xs">
              <Image
                src="/doctor_female.png"
                alt="Healthcare specialist"
                width={40}
                height={40}
                className="w-full h-full object-cover object-right"
              />
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full ring-2 ring-white bg-[#E5F973] text-slate-950 font-bold text-[11px] sm:text-xs flex items-center justify-center shadow-xs">
              &gt;2.4k
            </div>
          </div>

          <p className="text-[11px] sm:text-xs font-medium text-slate-700 leading-tight max-w-[240px]">
            Connected PHCs, CHCs &amp; ASHA frontline workers across Maharashtra
          </p>
        </div>
      </div>

      {/* Right Card: Clinical Medical Team Visual */}
      <div className="lg:col-span-6 relative rounded-[28px] sm:rounded-[32px] overflow-hidden min-h-[300px] sm:min-h-[400px] lg:min-h-[480px] shadow-sm bg-slate-200 group flex items-end">
        <Image
          src="/medical_team.png"
          alt="Public Healthcare Medical Specialists"
          fill
          priority
          className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
        />

        {/* Floating Top-Left Badge: Multilingual & Offline Ready */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-slate-950/85 backdrop-blur-md rounded-full px-3 py-1.5 sm:px-3.5 sm:py-1.5 text-white text-[11px] sm:text-xs font-semibold flex items-center gap-2 border border-white/20 shadow-md max-w-[calc(100%-2rem)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
          <span className="truncate">मराठी • Hindi • English | Offline Sync</span>
        </div>

        {/* Floating Live Verified Rating Badge */}
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3.5 px-3 sm:px-4 shadow-xl flex items-center gap-2.5 sm:gap-3 border border-white/80 max-w-[calc(100%-2rem)]">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 flex-shrink-0">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-xs sm:text-sm text-slate-950 font-heading">4.9</span>
              <div className="flex text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 block">
              Verified Patient Reviews
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
