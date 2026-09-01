"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { facilitiesApi, type Facility } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const MAHARASHTRA_DISTRICTS = [
  "All Districts", "Pune", "Nashik", "Satara", "Ahmednagar", "Nagpur", "Amravati",
  "Aurangabad", "Kolhapur", "Solapur", "Thane", "Mumbai City", "Mumbai Suburban"
];

const FACILITY_TYPES = [
  { id: "ALL", label: "All Facilities" },
  { id: "PHC", label: "PHC (Primary Centre)" },
  { id: "CHC", label: "CHC (Community Centre)" },
  { id: "RURAL_HOSPITAL", label: "Rural Hospital" },
  { id: "DISTRICT_HOSPITAL", label: "District Hospital" },
  { id: "DIAGNOSTIC_CENTER", label: "Diagnostic Center" },
  { id: "PHARMACY", label: "Pharmacy" },
];

const POPULAR_SERVICES = [
  "All Services", "General Consultation", "Maternal & Child Health", "Emergency Triage",
  "Radiology / X-Ray", "Vaccination", "Pathology / Blood Test", "ICU & Critical Care"
];

export default function FacilitiesDirectoryPage() {
  const [facilities, setFacilities] = useState<(Facility & { distanceKm?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedService, setSelectedService] = useState("All Services");
  const [onlyAvailableBeds, setOnlyAvailableBeds] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      if (userLocation) {
        const res = await facilitiesApi.nearby({
          lat: userLocation.lat,
          lng: userLocation.lng,
          district: selectedDistrict !== "All Districts" ? selectedDistrict : undefined,
          type: selectedType !== "ALL" ? selectedType : undefined,
          service: selectedService !== "All Services" ? selectedService : undefined,
          hasBeds: onlyAvailableBeds,
        });
        setFacilities(res.data);
      } else {
        const res = await facilitiesApi.list({
          district: selectedDistrict !== "All Districts" ? selectedDistrict : undefined,
          type: selectedType !== "ALL" ? selectedType : undefined,
          search: search || undefined,
          hasAvailableBeds: onlyAvailableBeds,
          service: selectedService !== "All Services" ? selectedService : undefined,
        });
        setFacilities(res.data.facilities);
      }
    } catch (err) {
      console.error("Failed to load facilities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [selectedDistrict, selectedType, selectedService, onlyAvailableBeds, userLocation]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocating(false);
      },
      (err) => {
        console.warn("Location error:", err);
        // Fallback default Pune coordinates for demo
        setUserLocation({ lat: 18.5204, lng: 73.8567 });
        setLocating(false);
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-[#E5F973] selection:text-slate-950" style={{ fontFamily: "var(--font-quicksand, 'Quicksand', sans-serif)" }}>
      {/* Top Navigation */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5">
        <Navbar />
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header banner */}
        <div className="bg-[#0E4A43] text-white rounded-[32px] p-6 sm:p-10 shadow-lg relative overflow-hidden mb-8">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5F973]/20 border border-[#E5F973]/30 text-[#E5F973] text-xs font-bold">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              Live Maharashtra Health Directory • Module 2
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Find Nearby Hospitals, PHCs &amp; Live Beds
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              Real-time directory of Sub-Centres, Primary Health Centres, Community Hospitals, and Civil Hospitals with live doctor rosters and medicine stock.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={handleGetLocation}
                disabled={locating}
                className="px-5 py-2.5 rounded-full bg-[#E5F973] text-slate-950 text-xs font-black hover:bg-[#d8ec68] transition-all active:scale-95 flex items-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                {locating ? "Locating..." : userLocation ? "Location Active (Nearest First)" : "Use My Live Location"}
              </button>

              {userLocation && (
                <button
                  onClick={() => setUserLocation(null)}
                  className="text-xs text-emerald-200 hover:text-white underline"
                >
                  Reset Location
                </button>
              )}
            </div>
          </div>

          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none hidden lg:flex items-center justify-center">
            <svg className="w-80 h-80" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v5.25H6a.75.75 0 000 1.5h5.25v5.25a.75.75 0 001.5 0v-5.25H18a.75.75 0 000-1.5h-5.25V6z" />
            </svg>
          </div>
        </div>

        {/* Filter controls */}
        <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-slate-200/80 shadow-xs mb-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Search Input */}
            <div className="space-y-1 sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-bold text-slate-700">Search Name or Village</label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchFacilities()}
                  placeholder="e.g. Ambegaon, Junnar, Civil..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
            </div>

            {/* District dropdown */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all"
              >
                {MAHARASHTRA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Facility Type */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Facility Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all"
              >
                {FACILITY_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Service filter */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Required Service</label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all"
              >
                {POPULAR_SERVICES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={onlyAvailableBeds}
                onChange={(e) => setOnlyAvailableBeds(e.target.checked)}
                className="w-4 h-4 rounded text-[#0E4A43] focus:ring-[#0E4A43]"
              />
              <span>Show only facilities with Available Inpatient / ICU Beds</span>
            </label>

            <button
              onClick={fetchFacilities}
              className="px-5 py-2 rounded-full bg-[#0E4A43] text-white text-xs font-bold hover:bg-[#083530] transition-all shadow-xs"
            >
              Apply Search
            </button>
          </div>
        </div>

        {/* Results section */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#0E4A43] border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs text-slate-500 font-medium">Fetching healthcare facilities...</div>
          </div>
        ) : facilities.length === 0 ? (
          <div className="bg-white rounded-[32px] p-12 text-center border border-slate-200/80 space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.25 6H9m3-3H9m-1.5-6H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="text-base font-black text-slate-900">No Facilities Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search criteria, clearing the filters, or selecting a different district.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {facilities.map((fac) => {
              const bed = fac.bedStatus;
              const hasBeds = (bed?.availableBeds ?? 0) > 0;

              return (
                <div
                  key={fac.id}
                  className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Header: Type and distance */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black uppercase tracking-wider">
                        {fac.type.replace(/_/g, " ")}
                      </span>
                      {fac.distanceKm !== undefined && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          {fac.distanceKm} km
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-[#0E4A43] transition-colors leading-snug">
                        {fac.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        {fac.village ? `${fac.village}, ` : ""}{fac.district} • Maharashtra
                      </p>
                    </div>

                    {/* Live Bed matrix pills */}
                    {bed && (
                      <div className="grid grid-cols-2 gap-2 bg-[#F8FAFC] rounded-2xl p-3 border border-slate-100 text-xs">
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">General Beds</div>
                          <div className={`font-black text-sm mt-0.5 ${hasBeds ? "text-emerald-700" : "text-rose-600"}`}>
                            {bed.availableBeds} / {bed.totalBeds} Available
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">ICU &amp; Oxygen</div>
                          <div className="font-black text-sm text-slate-800 mt-0.5">
                            {bed.icuBedsAvailable + bed.oxygenBedsAvailable} Available
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Services sample */}
                    {fac.services && fac.services.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-600">Key Services:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {fac.services.slice(0, 3).map((s) => (
                            <span key={s.id || s.name} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                              {s.name}
                            </span>
                          ))}
                          {fac.services.length > 3 && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-semibold">
                              +{fac.services.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card footer CTA */}
                  <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    {fac.contactPhone ? (
                      <a
                        href={`tel:${fac.contactPhone}`}
                        className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                        </svg>
                        Call
                      </a>
                    ) : <div />}

                    <Link
                      href={`/facilities/${fac.id}`}
                      className="px-4 py-2 rounded-xl bg-[#0E4A43] text-white text-xs font-black hover:bg-[#083530] transition-all shadow-xs flex items-center gap-1 active:scale-95"
                    >
                      View Live Status &rsaquo;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
 
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Footer />
      </div>
    </div>
  );
}
