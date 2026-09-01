import Image from "next/image";
import Link from "next/link";

interface ServiceItem {
  id: number;
  title: string;
  category: string;
  icon: React.ReactNode;
}

const services: ServiceItem[] = [
  {
    id: 1,
    title: "General Doctor Consultations",
    category: "Primary Healthcare & Tele-OPD",
    icon: (
      <svg className="w-6 h-6 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    id: 2,
    title: "Mother & Child Care",
    category: "Immunization & Check-ups",
    icon: (
      <svg className="w-6 h-6 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
  {
    id: 3,
    title: "Hospital Beds & Observation",
    category: "General & ICU Availability",
    icon: (
      <svg className="w-6 h-6 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 011.875 1.875v13.125H3.75V6.375A1.875 1.875 0 015.625 4.5z" />
      </svg>
    ),
  },
  {
    id: 4,
    title: "24x7 Emergency Helpline",
    category: "Dial 104 / 108 Support",
    icon: (
      <svg className="w-6 h-6 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
  },
  {
    id: 5,
    title: "Ultrasound & Sonography",
    category: "Diagnostic Imaging Clinic",
    icon: (
      <svg className="w-6 h-6 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-6-10.5h12a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0019.5 3H4.5A2.25 2.25 0 002.25 5.25v5.25A2.25 2.25 0 004.5 13.5z" />
      </svg>
    ),
  },
  {
    id: 6,
    title: "Digital X-Ray",
    category: "Radiology Services",
    icon: (
      <svg className="w-6 h-6 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0 3.75v4.5m0 3.75h16.5m0-16.5v4.5m0 3.75v4.5M3.75 3.75h16.5M9.75 8.25h4.5m-4.5 3.75h4.5m-4.5 3.75h4.5" />
      </svg>
    ),
  },
  {
    id: 7,
    title: "Diabetes & BP Check",
    category: "Chronic Disease Screening",
    icon: (
      <svg className="w-6 h-6 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    id: 8,
    title: "Medicine Pharmacy Stock",
    category: "Essential Drug Availability",
    icon: (
      <svg className="w-6 h-6 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m-12 0h19.5" />
      </svg>
    ),
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="bg-[#EFF2F5] rounded-[32px] p-6 sm:p-9 lg:p-11 relative overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Services Header & 8 Card Grid */}
        <div className="lg:col-span-8 space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E5F973] text-slate-950 text-xs sm:text-sm font-bold tracking-tight">
            <span className="w-2 h-2 rounded-full bg-[#0E4A43] animate-pulse" />
            <span>Healthcare Services</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 font-heading tracking-tight leading-tight">
            Services Available Near You
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-xl">
            Find the right medical service at local government health centres across Maharashtra to save travel time and get treated faster.
          </p>

          {/* 8 Bento Service Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 pt-2">
            {services.map((service) => (
              <Link
                key={service.id}
                href="/facilities"
                className="group bg-white rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between min-h-[125px] sm:min-h-[135px] border border-slate-200/60 shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 relative"
              >
                {/* Top Row: Icon & Action Arrow */}
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-[#EFF2F5] group-hover:bg-[#E5F973]/50 transition-colors">
                    {service.icon}
                  </div>

                  <div className="w-6 h-6 text-slate-400 group-hover:text-[#0E4A43] transition-colors flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                    </svg>
                  </div>
                </div>

                {/* Bottom: Service Title & Category */}
                <div className="pt-2">
                  <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug font-heading group-hover:text-[#0E4A43] transition-colors">
                    {service.title}
                  </h3>
                  <div className="text-[10px] font-semibold text-slate-400 mt-0.5 truncate">
                    {service.category}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Side: Doctor Portrait */}
        <div className="lg:col-span-4 relative flex justify-center items-end min-h-[280px] sm:min-h-[380px] lg:min-h-[460px]">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#C8EEA2]/50 via-[#E5F973]/35 to-transparent rounded-3xl blur-2xl pointer-events-none transform scale-90" />

          <div className="relative w-full h-[280px] sm:h-[380px] lg:h-[460px] rounded-3xl overflow-hidden shadow-xs flex items-end justify-center">
            <Image
              src="/doctor_female.png"
              alt="Medical Specialist"
              fill
              className="object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#EFF2F5] via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

      </div>
    </section>
  );
}
