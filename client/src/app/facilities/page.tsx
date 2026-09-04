"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { facilitiesApi, type Facility } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  MapPin,
  Search,
  Navigation,
  Bed,
  Stethoscope,
  FlaskConical,
  Pill,
  Siren,
  ShieldCheck,
  Activity,
  HeartHandshake,
  Baby,
  UserCheck,
  Phone,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building2,
  SlidersHorizontal,
} from "lucide-react";

const MAHARASHTRA_DISTRICTS = [
  "All Districts", "Pune", "Nashik", "Satara", "Ahmednagar", "Nagpur", "Amravati",
  "Aurangabad", "Kolhapur", "Solapur", "Thane", "Mumbai City", "Mumbai Suburban", "Mathura"
];

const FACILITY_TYPES = [
  { id: "ALL", label: "All Institutional Types" },
  { id: "PHC", label: "PHC (Primary Health Centre)" },
  { id: "CHC", label: "CHC (Community Health Centre)" },
  { id: "RURAL_HOSPITAL", label: "Rural Hospital" },
  { id: "DISTRICT_HOSPITAL", label: "District Hospital" },
  { id: "DIAGNOSTIC_CENTER", label: "Diagnostic Center" },
  { id: "PHARMACY", label: "Pharmacy" },
];

// Official FR-06 Services with dedicated Lucide icons
const FR06_SERVICES = [
  { id: "All Services", label: "All Services", icon: Building2 },
  { id: "General Consultation", label: "General Consultation", icon: Stethoscope },
  { id: "Specialist Consultation", label: "Specialist Consultation", icon: UserCheck },
  { id: "Maternal Care", label: "Maternal Care", icon: HeartHandshake },
  { id: "Child Healthcare", label: "Child Healthcare", icon: Baby },
  { id: "Diagnostics", label: "Diagnostics", icon: FlaskConical },
  { id: "Pharmacy", label: "Pharmacy", icon: Pill },
  { id: "Emergency Services", label: "Emergency Services", icon: Siren },
  { id: "Vaccination", label: "Vaccination", icon: ShieldCheck },
  { id: "Chronic Disease Care", label: "Chronic Disease Care", icon: Activity },
];

export default function FacilitiesDirectoryPage() {
  const [facilities, setFacilities] = useState<(Facility & { distanceKm?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedService, setSelectedService] = useState("All Services");
  const [onlyAvailableBeds, setOnlyAvailableBeds] = useState(false);
  const [onlyAvailableDoctors, setOnlyAvailableDoctors] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [radiusKm, setRadiusKm] = useState(50);
  const [serviceCatalog, setServiceCatalog] = useState<Array<{ name: string; category: string; facilityCount: number }>>([]);

  // Fetch standard catalog
  useEffect(() => {
    facilitiesApi.getServicesCatalog()
      .then((res) => {
        if (res.success && res.data) setServiceCatalog(res.data);
      })
      .catch(() => {});
  }, []);

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      if (userLocation) {
        const res = await facilitiesApi.nearby({
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius: radiusKm,
          district: selectedDistrict !== "All Districts" ? selectedDistrict : undefined,
          type: selectedType !== "ALL" ? selectedType : undefined,
          service: selectedService !== "All Services" ? selectedService : undefined,
          hasBeds: onlyAvailableBeds,
        });
        let list = res.data;
        if (onlyAvailableDoctors) {
          list = list.filter((f) => (f.doctors && f.doctors.some((d) => d.isAvailable)) || (f.doctors && f.doctors.length > 0));
        }
        setFacilities(list);
      } else {
        const res = await facilitiesApi.list({
          district: selectedDistrict !== "All Districts" ? selectedDistrict : undefined,
          type: selectedType !== "ALL" ? selectedType : undefined,
          search: search || undefined,
          hasAvailableBeds: onlyAvailableBeds,
          service: selectedService !== "All Services" ? selectedService : undefined,
        });
        let list = res.data.facilities;
        if (onlyAvailableDoctors) {
          list = list.filter((f) => (f.doctors && f.doctors.some((d) => d.isAvailable)) || (f.doctors && f.doctors.length > 0));
        }
        setFacilities(list);
      }
    } catch (err) {
      console.error("Failed to load facilities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [selectedDistrict, selectedType, selectedService, onlyAvailableBeds, onlyAvailableDoctors, userLocation, radiusKm]);

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
        // Default Maharashtra Pune reference coordinates
        setUserLocation({ lat: 18.5204, lng: 73.8567 });
        setLocating(false);
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-[#E5F973] selection:text-slate-950" style={{ fontFamily: "var(--font-quicksand, 'Quicksand', sans-serif)" }}>
      {/* Navigation */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5">
        <Navbar />
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-8">
        {/* Hero Banner (FR-08 Nearby Search & Location Hero) */}
        <div className="bg-[#0E4A43] text-white rounded-[32px] p-6 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-[#E5F973]/30 text-[#E5F973] text-xs font-bold uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              <span>Public Health Directory &bull; Real Database</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Health Facility &amp; Resource Directory
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl">
              Locate nearby Primary Health Centres (PHCs), CHCs, Rural &amp; District Hospitals, Diagnostic Centres, and Pharmacies with real-time bed counts, doctor rosters, and medicine availability.
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={handleGetLocation}
                disabled={locating}
                className="px-5 py-2.5 rounded-full bg-[#E5F973] text-[#0E4A43] text-xs font-black hover:brightness-105 transition-all active:scale-95 flex items-center gap-2 shadow-sm"
              >
                <Navigation className="w-4 h-4" />
                <span>{locating ? "Acquiring GPS..." : userLocation ? "Location Active (Nearest First)" : "Find Nearby Facilities (GPS)"}</span>
              </button>

              {userLocation && (
                <div className="flex items-center gap-2 text-xs bg-white/10 px-3 py-1.5 rounded-full text-emerald-200">
                  <span>Radius:</span>
                  <select
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="bg-transparent text-white font-black focus:outline-hidden"
                  >
                    <option value={10} className="text-slate-900">10 km</option>
                    <option value={25} className="text-slate-900">25 km</option>
                    <option value={50} className="text-slate-900">50 km</option>
                    <option value={100} className="text-slate-900">100 km</option>
                  </select>
                  <button
                    onClick={() => setUserLocation(null)}
                    className="text-xs text-rose-300 hover:text-white underline ml-2"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FR-06: Clinical Service Directory Quick Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#0E4A43]" />
              <span>Service Directory (FR-06)</span>
            </h2>
            <span className="text-xs text-slate-500 font-bold">
              {selectedService === "All Services" ? "Showing all clinical services" : `Filtering by: ${selectedService}`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {FR06_SERVICES.map((srv) => {
              const Icon = srv.icon;
              const isSelected = selectedService === srv.id;
              return (
                <button
                  key={srv.id}
                  onClick={() => setSelectedService(srv.id)}
                  className={`p-3 rounded-2xl text-left border transition-all flex items-center gap-2.5 ${
                    isSelected
                      ? "bg-[#0E4A43] text-white border-[#0E4A43] shadow-sm ring-2 ring-[#0E4A43]/20"
                      : "bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-white/20 text-[#E5F973]" : "bg-emerald-50 text-[#0E4A43]"
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold truncate">{srv.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* Search Input */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Search Name, Village or District</label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchFacilities()}
                  placeholder="e.g. PHC Mathura, Junnar, Ambegaon..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* District dropdown */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">District / Region</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all"
              >
                {MAHARASHTRA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Facility Type */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Facility Classification (FR-05)</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all"
              >
                {FACILITY_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={onlyAvailableBeds}
                  onChange={(e) => setOnlyAvailableBeds(e.target.checked)}
                  className="w-4 h-4 rounded-sm text-[#0E4A43] focus:ring-[#0E4A43]"
                />
                <span>Inpatient / ICU Beds Available</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={onlyAvailableDoctors}
                  onChange={(e) => setOnlyAvailableDoctors(e.target.checked)}
                  className="w-4 h-4 rounded-sm text-[#0E4A43] focus:ring-[#0E4A43]"
                />
                <span>Doctor On Duty Available</span>
              </label>
            </div>

            <button
              onClick={fetchFacilities}
              className="px-5 py-2 rounded-full bg-[#0E4A43] text-white text-xs font-bold hover:brightness-110 transition-all shadow-xs"
            >
              Apply Filter
            </button>
          </div>
        </div>

        {/* Results section */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#0E4A43] border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs text-slate-500 font-bold">Querying live facilities from database...</div>
          </div>
        ) : facilities.length === 0 ? (
          <div className="bg-white rounded-[32px] p-12 text-center border border-slate-200/80 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">No Facilities Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No matching healthcare facilities found with the current filters. Try selecting &quot;All Districts&quot; or resetting the service filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {facilities.map((fac) => {
              const bed = fac.bedStatus;
              const hasBeds = (bed?.availableBeds ?? 0) > 0;
              const activeDoctors = fac.doctors?.filter((d) => d.isAvailable) || [];

              return (
                <div
                  key={fac.id}
                  className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Header: Classification badge and distance */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                        {fac.type.replace(/_/g, " ")}
                      </span>
                      {fac.distanceKm !== undefined && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-[#0E4A43]" />
                          <span>{fac.distanceKm} km</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-[#0E4A43] transition-colors leading-snug">
                        {fac.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{fac.village ? `${fac.village}, ` : ""}{fac.district} &bull; Maharashtra</span>
                      </p>
                    </div>

                    {/* Live Bed matrix pills */}
                    {bed && (
                      <div className="grid grid-cols-2 gap-2 bg-[#F8FAFC] rounded-2xl p-3 border border-slate-100 text-xs">
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">General Beds</div>
                          <div className={`font-black text-xs mt-0.5 ${hasBeds ? "text-emerald-700" : "text-rose-600"}`}>
                            {bed.availableBeds} / {bed.totalBeds} Available
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">ICU &amp; Oxygen</div>
                          <div className="font-black text-xs text-slate-800 mt-0.5">
                            {bed.icuBedsAvailable + bed.oxygenBedsAvailable} Available
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Doctors on Duty pill */}
                    <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-slate-500 font-bold flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-[#0E4A43]" />
                        <span>Doctors on Duty</span>
                      </span>
                      <span className={`font-black text-xs ${activeDoctors.length > 0 ? "text-emerald-700" : "text-slate-400"}`}>
                        {activeDoctors.length > 0 ? `${activeDoctors.length} On Duty` : "None on Duty"}
                      </span>
                    </div>

                    {/* Services tags */}
                    {fac.services && fac.services.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Key Services:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {fac.services.slice(0, 3).map((s) => (
                            <span key={s.id || s.name} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                              {s.name}
                            </span>
                          ))}
                          {fac.services.length > 3 && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold">
                              +{fac.services.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card footer actions */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    {fac.contactPhone ? (
                      <a
                        href={`tel:${fac.contactPhone}`}
                        className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>Call</span>
                      </a>
                    ) : <div />}

                    <Link
                      href={`/facilities/${fac.id}`}
                      className="px-4 py-2 rounded-xl bg-[#0E4A43] text-white text-xs font-black hover:brightness-110 transition-all shadow-xs flex items-center gap-1 active:scale-95"
                    >
                      <span>Live Availability</span>
                      <ArrowRight className="w-3.5 h-3.5" />
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
