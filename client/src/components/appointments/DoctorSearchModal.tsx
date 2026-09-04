"use client";

import { useState, useEffect } from "react";
import {
  doctorsApi,
  type DoctorSearchResult,
  type Facility,
} from "@/lib/api";
import {
  Search,
  Stethoscope,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  Calendar,
  X,
  User,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

interface DoctorSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDoctor: (doctor: DoctorSearchResult) => void;
  initialSpecialty?: string;
  initialDistrict?: string;
}

const COMMON_SPECIALTIES = [
  "All Specialties",
  "General Medicine",
  "Pediatrics",
  "Obstetrics & Gynecology",
  "Cardiology",
  "Orthopedics",
  "Dermatology",
  "Ophthalmology",
  "ENT",
];

const MAHARASHTRA_DISTRICTS = [
  "All Districts",
  "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana",
  "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna",
  "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded",
  "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad",
  "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha",
  "Washim", "Yavatmal",
];

export function DoctorSearchModal({
  isOpen,
  onClose,
  onSelectDoctor,
  initialSpecialty = "All Specialties",
  initialDistrict = "All Districts",
}: DoctorSearchModalProps) {
  const [specialty, setSpecialty] = useState(initialSpecialty);
  const [district, setDistrict] = useState(initialDistrict);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [doctors, setDoctors] = useState<DoctorSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialtiesList, setSpecialtiesList] = useState<string[]>(COMMON_SPECIALTIES);

  useEffect(() => {
    if (!isOpen) return;

    // Load available specialties
    doctorsApi
      .getSpecialties()
      .then((res) => {
        if (res.success && res.data.length > 0) {
          const merged = Array.from(new Set(["All Specialties", ...res.data]));
          setSpecialtiesList(merged);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await doctorsApi.search({
        specialty: specialty !== "All Specialties" ? specialty : undefined,
        district: district !== "All Districts" ? district : undefined,
        isAvailable: onlyAvailable ? true : undefined,
        search: searchQuery.trim() || undefined,
      });

      if (res.success) {
        setDoctors(res.data.doctors);
      }
    } catch (err) {
      console.error("Failed to search doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        fetchDoctors();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen, specialty, district, onlyAvailable, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-teal-50/50 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0E4A43] text-white flex items-center justify-center shadow-md shadow-[#0E4A43]/20">
              <Stethoscope className="w-5 h-5 text-[#E5F973]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Find &amp; Consult Specialist Doctors
              </h2>
              <p className="text-xs font-medium text-slate-500">
                FR-13: Search by specialty, government facility, location, and duty status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters Bar */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-3.5">
          {/* Search Input & District */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by doctor name, qualification, hospital..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0E4A43] focus:ring-1 focus:ring-[#0E4A43]"
              />
            </div>

            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-[#0E4A43] focus:ring-1 focus:ring-[#0E4A43] appearance-none"
              >
                {MAHARASHTRA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Specialty Chips & On-Duty Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 max-w-2xl">
              {specialtiesList.slice(0, 7).map((s) => (
                <button
                  key={s}
                  onClick={() => setSpecialty(s)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    specialty === s
                      ? "bg-[#0E4A43] text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="rounded text-[#0E4A43] focus:ring-[#0E4A43] w-3.5 h-3.5"
              />
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                On Duty Right Now
              </span>
            </label>
          </div>
        </div>

        {/* Doctor List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block w-8 h-8 border-3 border-[#0E4A43] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-bold text-slate-500">Searching government doctors &amp; duty rosters...</p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No doctors match your search filters</p>
              <p className="text-xs text-slate-400 mt-1">Try broadening your specialty or district criteria.</p>
              <button
                onClick={() => {
                  setSpecialty("All Specialties");
                  setDistrict("All Districts");
                  setOnlyAvailable(false);
                  setSearchQuery("");
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-300"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            doctors.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-[#0E4A43]/50 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0E4A43] flex-shrink-0 group-hover:scale-105 transition-transform">
                    <User className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                        Dr. {doc.user.fullName}
                      </h3>
                      {doc.qualification && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                          {doc.qualification}
                        </span>
                      )}
                      {doc.isAvailable ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Available / On Duty
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                          Off Duty
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1 font-medium">
                      <span className="flex items-center gap-1 text-[#0E4A43] font-bold">
                        <Stethoscope className="w-3.5 h-3.5" />
                        {doc.specialty || "General Medicine"}
                      </span>

                      {doc.facility && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {doc.facility.name} ({doc.facility.type})
                        </span>
                      )}

                      {doc.facility?.district && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3 h-3" />
                          {doc.facility.district}
                        </span>
                      )}
                    </div>

                    {doc.rosterEntries && doc.rosterEntries[0] && (
                      <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span className="font-semibold text-slate-700">Active Shift:</span>
                        <span>{doc.rosterEntries[0].shiftName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onSelectDoctor(doc)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#0E4A43] hover:bg-[#135E55] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 flex-shrink-0"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#E5F973]" />
                  <span>Book with Dr. {doc.user.fullName.split(" ")[0]}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0E4A43]" />
            <span className="font-semibold text-slate-700">National Health Mission Verified Officers</span>
          </div>
          <span className="font-bold text-slate-700">{doctors.length} Doctors Found</span>
        </div>
      </div>
    </div>
  );
}
