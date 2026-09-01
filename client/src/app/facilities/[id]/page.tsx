"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { facilitiesApi, type Facility } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function FacilityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const facilityId = params?.id as string;

  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "doctors" | "beds" | "medicines" | "diagnostics">("overview");

  useEffect(() => {
    if (!facilityId) return;
    facilitiesApi.getById(facilityId)
      .then((res) => setFacility(res.data))
      .catch((err) => {
        console.error("Failed to load facility:", err);
      })
      .finally(() => setLoading(false));
  }, [facilityId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#0E4A43] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs text-slate-500 font-medium">Loading live facility resources...</div>
        </div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-[#E5F973] selection:text-slate-950" style={{ fontFamily: "var(--font-quicksand, 'Quicksand', sans-serif)" }}>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5">
          <Navbar />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
          <h2 className="text-xl font-black text-slate-900">Facility Not Found</h2>
          <p className="text-xs text-slate-500">The healthcare facility requested does not exist or has been relocated.</p>
          <Link href="/facilities" className="px-5 py-2.5 rounded-full bg-[#0E4A43] text-white text-xs font-bold">
            &larr; Back to Directory
          </Link>
        </div>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Footer />
        </div>
      </div>
    );
  }

  const bed = facility.bedStatus;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-[#E5F973] selection:text-slate-950" style={{ fontFamily: "var(--font-quicksand, 'Quicksand', sans-serif)" }}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5">
        <Navbar />
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link href="/facilities" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0E4A43] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Maharashtra Facilities Directory
          </Link>
        </div>

        {/* Facility Header Card */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200/80 shadow-xs mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black uppercase tracking-wider">
                  {facility.type.replace(/_/g, " ")}
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                  {facility.district} District
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Facility
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {facility.name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {facility.address || `${facility.village ? facility.village + ", " : ""}${facility.district}, Maharashtra - ${facility.pincode || "411001"}`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {facility.contactPhone && (
                <a
                  href={`tel:${facility.contactPhone}`}
                  className="px-5 py-3 rounded-2xl bg-[#0E4A43] text-white text-xs font-black hover:bg-[#083530] transition-all shadow-xs flex items-center gap-2 active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  Call {facility.contactPhone}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Live Resource Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-[24px] p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Available Inpatient Beds</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {bed?.availableBeds ?? 0} <span className="text-xs font-semibold text-slate-500">/ {bed?.totalBeds ?? 0}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Real-time status</div>
          </div>

          <div className="bg-white rounded-[24px] p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Oxygen &amp; ICU Beds</div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {(bed?.oxygenBedsAvailable ?? 0) + (bed?.icuBedsAvailable ?? 0)} <span className="text-xs font-semibold text-slate-500">/ {(bed?.oxygenBedsTotal ?? 0) + (bed?.icuBedsTotal ?? 0)}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Critical care ready</div>
          </div>

          <div className="bg-white rounded-[24px] p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Doctors on Duty</div>
            <div className="text-2xl font-black text-[#0E4A43] mt-1">
              {facility.doctors?.length ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Available for OPD</div>
          </div>

          <div className="bg-white rounded-[24px] p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Diagnostic Tests</div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {facility.diagnostics?.filter(d => d.isAvailable).length ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Active lab services</div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 mb-6">
          {[
            { id: "overview", label: "Overview & Services" },
            { id: "doctors", label: `Doctors (${facility.doctors?.length ?? 0})` },
            { id: "beds", label: "Bed Matrix" },
            { id: "medicines", label: `Essential Medicines (${facility.medicines?.length ?? 0})` },
            { id: "diagnostics", label: `Diagnostic Tests (${facility.diagnostics?.length ?? 0})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                activeTab === t.id
                  ? "bg-[#0E4A43] text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview & Services */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-black text-slate-900">Available Clinical Services</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {facility.services && facility.services.length > 0 ? (
                  facility.services.map((s) => (
                    <div key={s.id || s.name} className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{s.name}</div>
                        <div className="text-[10px] text-slate-500">Government Free Scheme</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500">General OPD and emergency care available.</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-base font-black text-slate-900">Operational Timings &amp; Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <div className="font-bold text-slate-500 uppercase text-[10px]">Working Hours</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">{facility.workingHours || "24x7 Emergency / 09:00 - 17:00 OPD"}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <div className="font-bold text-slate-500 uppercase text-[10px]">Official Email</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">{facility.contactEmail || "health.facility@swasthya.gov.in"}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Doctors on Duty */}
        {activeTab === "doctors" && (
          <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Medical Officers &amp; Specialists on Duty</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {facility.doctors && facility.doctors.length > 0 ? (
                facility.doctors.map((doc) => (
                  <div key={doc.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#0E4A43] text-[#E5F973] flex items-center justify-center font-black text-base flex-shrink-0">
                      {doc.user?.fullName ? doc.user.fullName.charAt(0) : "D"}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900">{doc.user?.fullName || "Doctor"}</div>
                      <div className="text-xs text-[#0E4A43] font-bold">{doc.specialty || "General Medicine"}</div>
                      <div className="text-[11px] text-slate-500">{doc.qualification || "MBBS"} {doc.registrationNo ? `• Reg: ${doc.registrationNo}` : ""}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500">No registered doctors currently assigned.</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Bed Matrix */}
        {activeTab === "beds" && (
          <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Live Inpatient Bed Availability Matrix</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="text-xs font-bold text-emerald-900">General Ward Beds</div>
                <div className="text-3xl font-black text-emerald-800 mt-2">
                  {bed?.availableBeds ?? 0} <span className="text-sm font-semibold text-emerald-600">/ {bed?.totalBeds ?? 0} Total</span>
                </div>
                <div className="text-[11px] text-emerald-700 mt-1">Available for admission</div>
              </div>

              <div className="p-5 rounded-2xl bg-sky-50 border border-sky-200">
                <div className="text-xs font-bold text-sky-900">Oxygen-Supported Beds</div>
                <div className="text-3xl font-black text-sky-800 mt-2">
                  {bed?.oxygenBedsAvailable ?? 0} <span className="text-sm font-semibold text-sky-600">/ {bed?.oxygenBedsTotal ?? 0} Total</span>
                </div>
                <div className="text-[11px] text-sky-700 mt-1">High-flow oxygen available</div>
              </div>

              <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200">
                <div className="text-xs font-bold text-purple-900">ICU Ventilator Beds</div>
                <div className="text-3xl font-black text-purple-800 mt-2">
                  {bed?.icuBedsAvailable ?? 0} <span className="text-sm font-semibold text-purple-600">/ {bed?.icuBedsTotal ?? 0} Total</span>
                </div>
                <div className="text-[11px] text-purple-700 mt-1">Intensive care unit</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Essential Medicines */}
        {activeTab === "medicines" && (
          <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Essential Drug Inventory &amp; Stock Levels</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-bold">Medicine Name</th>
                    <th className="pb-3 font-bold">Category</th>
                    <th className="pb-3 font-bold">Quantity Available</th>
                    <th className="pb-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {facility.medicines && facility.medicines.length > 0 ? (
                    facility.medicines.map((med) => (
                      <tr key={med.id || med.medicineName} className="hover:bg-slate-50">
                        <td className="py-3 font-bold text-slate-900">{med.medicineName}</td>
                        <td className="py-3 text-slate-600">{med.category || "General"}</td>
                        <td className="py-3 font-bold text-slate-800">{med.quantity} {med.unit}</td>
                        <td className="py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            med.isAvailable && med.quantity > (med.stockThreshold || 10)
                              ? "bg-emerald-100 text-emerald-800"
                              : med.quantity > 0
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}>
                            {med.isAvailable && med.quantity > 0 ? "In Stock" : "Out of Stock"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-slate-500">No medicine inventory records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Diagnostic Tests */}
        {activeTab === "diagnostics" && (
          <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Diagnostic Laboratory &amp; Radiology Services</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {facility.diagnostics && facility.diagnostics.length > 0 ? (
                facility.diagnostics.map((test) => (
                  <div key={test.id || test.testName} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{test.testName}</div>
                      <div className="text-xs text-slate-500">{test.category || "Laboratory"} • Results in ~{test.turnaroundHours}h</div>
                      <div className="text-[11px] font-bold text-emerald-700 mt-0.5">
                        {test.costInr === 0 ? "Free under Public Health Scheme" : `Rs. ${test.costInr}`}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${test.isAvailable ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                      {test.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500">Standard basic laboratory tests available at OPD.</div>
              )}
            </div>
          </div>
        )}
      </main>
 
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Footer />
      </div>
    </div>
  );
}
