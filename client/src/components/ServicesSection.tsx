import Image from "next/image";
import Link from "next/link";

interface ServiceItem {
  id: number;
  title: string;
  category: string;
  icon: React.ReactNode;
  active?: boolean;
}

const services: ServiceItem[] = [
  {
    id: 1,
    title: "Adult OPD & General Medicine",
    category: "Взрослое отделение",
    icon: (
      <svg className="w-7 h-7 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632zM18.75 12h.008v.008h-.008V12zm-3 0h.008v.008h-.008V12z" />
      </svg>
    ),
  },
  {
    id: 2,
    title: "Pediatric & Child Health Care",
    category: "Детское отделение",
    icon: (
      <svg className="w-7 h-7 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 3,
    title: "Day Inpatient & Observation Ward",
    category: "Дневной стационар",
    active: true,
    icon: (
      <svg className="w-7 h-7 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 011.875 1.875v13.125H3.75V6.375A1.875 1.875 0 015.625 4.5z" />
      </svg>
    ),
  },
  {
    id: 4,
    title: "Emergency & Minor Procedure OT",
    category: "Операционный блок",
    icon: (
      <svg className="w-7 h-7 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
  },
  {
    id: 5,
    title: "Ultrasound & Sonography (USG)",
    category: "Ультразвуковое исследование",
    icon: (
      <svg className="w-7 h-7 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-6-10.5h12a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0019.5 3H4.5A2.25 2.25 0 002.25 5.25v5.25A2.25 2.25 0 004.5 13.5z" />
      </svg>
    ),
  },
  {
    id: 6,
    title: "X-Ray & Digital Radiology",
    category: "Рентген кабинет",
    icon: (
      <svg className="w-7 h-7 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0 3.75v4.5m0 3.75h16.5m0-16.5v4.5m0 3.75v4.5M3.75 3.75h16.5M9.75 8.25h4.5m-4.5 3.75h4.5m-4.5 3.75h4.5" />
      </svg>
    ),
  },
  {
    id: 7,
    title: "Functional Diagnostics & ECG",
    category: "Функциональная диагностика",
    icon: (
      <svg className="w-7 h-7 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
  {
    id: 8,
    title: "Home Healthcare & ASHA Outreach",
    category: "Медицинские услуги на дому",
    icon: (
      <svg className="w-7 h-7 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
];

export default function ServicesSection() {
  return (
    <section className="bg-[#EFF2F5] rounded-[32px] p-6 sm:p-9 lg:p-11 relative overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Services Header & 8 Card Grid */}
        <div className="lg:col-span-8 xl:col-span-8 space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E5F973] text-slate-950 text-xs sm:text-sm font-bold tracking-tight">
            <span className="text-sm font-extrabold">+</span>
            <span>Comprehensive Services</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 font-heading tracking-tight leading-tight">
            Wide Range of Public Health Services
          </h2>

          {/* 8 Bento Service Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5 pt-2">
            {services.map((service) => (
              <div
                key={service.id}
                className={`group bg-white rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between min-h-[125px] sm:min-h-[135px] border border-slate-100 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 relative ${
                  service.active ? "ring-2 ring-slate-950/10 shadow-sm" : "shadow-xs"
                }`}
              >
                {/* Top Row: Icon & Action Arrow */}
                <div className="flex items-center justify-between">
                  <div className="p-1.5 rounded-xl bg-slate-50 group-hover:bg-emerald-50/80 transition-colors">
                    {service.icon}
                  </div>

                  {service.active ? (
                    <div className="w-6 h-6 rounded-full bg-slate-950 text-white flex items-center justify-center shadow-xs">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors flex items-center justify-center">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Bottom: Service Title */}
                <div>
                  <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug font-heading group-hover:text-[#0E4A43] transition-colors">
                    {service.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Doctor Portrait with Soft Green Aura */}
        <div className="lg:col-span-4 xl:col-span-4 relative flex justify-center items-end min-h-[340px] sm:min-h-[420px] lg:min-h-[460px]">
          {/* Subtle Sage Green Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#C8EEA2]/50 via-[#E5F973]/35 to-transparent rounded-3xl blur-2xl pointer-events-none transform scale-90" />

          {/* Doctor Image Container */}
          <div className="relative w-full h-[360px] sm:h-[430px] lg:h-[470px] rounded-3xl overflow-hidden shadow-xs flex items-end justify-center">
            <Image
              src="/doctor_female.png"
              alt="Medical Specialist"
              fill
              className="object-cover object-top"
            />
            {/* Soft fade at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#EFF2F5] via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

      </div>
    </section>
  );
}
