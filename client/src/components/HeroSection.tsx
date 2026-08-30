import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
      {/* Left Card: PS 26133 Problem & Integrated Public Health Solution */}
      <div className="lg:col-span-6 xl:col-span-6 bg-[#EFF2F5] rounded-[32px] p-7 sm:p-10 lg:p-11 flex flex-col justify-between relative overflow-hidden">
        <div className="space-y-5">
          {/* Badge: PS ID & Organization */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E5F973] text-slate-950 text-xs sm:text-sm font-bold tracking-tight">
            <span className="text-sm font-extrabold">+</span>
            <span>PS 26133 • Rural &amp; Underserved Healthcare</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl xl:text-[44px] font-black text-slate-950 font-heading leading-[1.18] tracking-tight">
            Accessible, quality public healthcare for{" "}
            <span className="inline-block bg-white/90 px-3 py-0.5 rounded-2xl shadow-xs border border-slate-200/50">
              every village
            </span>
          </h1>

          {/* Description based on PS 26133 */}
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal max-w-lg">
            Bridging distances with assisted teleconsultations, digital triage, longitudinal patient records (ABDM), and seamless referral tracking across Sub-Centres, PHCs, CHCs, and District Hospitals.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button className="px-6 sm:px-7 py-3 rounded-full text-xs sm:text-sm font-bold text-white bg-[#0E4A43] hover:bg-[#083530] shadow-sm transition-all hover:shadow-md active:scale-95">
              Start Assisted Triage
            </button>
            <button className="px-5 sm:px-6 py-3 rounded-full text-xs sm:text-sm font-semibold text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs flex items-center gap-1.5 transition-all">
              <span>Track Referrals &amp; Beds</span>
              <span className="text-base leading-none">&rsaquo;</span>
            </button>
          </div>
        </div>

        {/* Bottom Frontline Proof / Rural Network Coverage */}
        <div className="flex items-center gap-4 pt-8 mt-6 border-t border-slate-300/50">
          <div className="flex items-center -space-x-2.5">
            <div className="w-10 h-10 rounded-full ring-2 ring-white overflow-hidden bg-slate-200 relative">
              <Image
                src="/doctor_patient.jpg"
                alt="Doctor with patient"
                fill
                className="object-cover"
              />
            </div>
            <div className="w-10 h-10 rounded-full ring-2 ring-white overflow-hidden bg-slate-300 relative">
              <Image
                src="/medical_team.png"
                alt="Specialist doctor"
                fill
                className="object-cover object-left"
              />
            </div>
            <div className="w-10 h-10 rounded-full ring-2 ring-white overflow-hidden bg-slate-400 relative">
              <Image
                src="/doctor_female.png"
                alt="Healthcare specialist"
                fill
                className="object-cover object-right"
              />
            </div>
            <div className="w-10 h-10 rounded-full ring-2 ring-white bg-[#E5F973] text-slate-950 font-bold text-xs flex items-center justify-center shadow-xs">
              &gt;2.4k
            </div>
          </div>

          <p className="text-xs sm:text-sm font-medium text-slate-700 leading-tight max-w-[240px]">
            Connected PHCs, CHCs &amp; ASHA frontline workers across Maharashtra
          </p>
        </div>
      </div>

      {/* Right Card: Clinical Medical Team Visual */}
      <div className="lg:col-span-6 xl:col-span-6 relative rounded-[32px] overflow-hidden min-h-[420px] lg:min-h-[500px] shadow-sm bg-slate-200 group">
        <Image
          src="/medical_team.png"
          alt="Public Healthcare Medical Specialists"
          fill
          priority
          className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
        />

        {/* Floating Live Verified Rating Badge */}
        <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 px-4 shadow-xl flex items-center gap-3 border border-white/80">
          <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
            <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-slate-950 font-heading">4.9</span>
              <div className="flex text-amber-400 text-xs">
                ★★★★★
              </div>
            </div>
            <span className="text-[11px] font-medium text-slate-500 block">
              Verified Patient Reviews
            </span>
          </div>
        </div>

        {/* Floating Top-Left Badge: Multilingual & Offline Ready */}
        <div className="absolute top-6 left-6 bg-slate-950/80 backdrop-blur-md rounded-full px-3.5 py-1.5 text-white text-xs font-semibold flex items-center gap-2 border border-white/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>मराठी • Hindi • English | Offline Sync</span>
        </div>
      </div>
    </section>
  );
}
