"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  facilitiesApi,
  type UserProfile,
  type Facility,
  type FacilityMedicine,
  type FacilityDiagnostic,
} from "@/lib/api";
import {
  Bed,
  Pill,
  FlaskConical,
  Stethoscope,
  Building2,
  Users,
  Check,
  X,
  Clock,
  Plus,
  Trash2,
  ShieldCheck,
  Activity,
} from "lucide-react";

interface FacilityAdminDashboardProps {
  user: UserProfile;
  activeTab: string;
  setTab: (t: string) => void;
}

export function FacilityAdminDashboard({ user, activeTab, setTab }: FacilityAdminDashboardProps) {
  const facilityId = user.facilityAdmin?.facilityId;
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);

  // Bed Status State
  const [totalBeds, setTotalBeds] = useState(0);
  const [availableBeds, setAvailableBeds] = useState(0);
  const [icuTotal, setIcuTotal] = useState(0);
  const [icuAvailable, setIcuAvailable] = useState(0);
  const [oxygenTotal, setOxygenTotal] = useState(0);
  const [oxygenAvailable, setOxygenAvailable] = useState(0);
  const [savingBeds, setSavingBeds] = useState(false);
  const [bedMsg, setBedMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Medicine Restock Modal
  const [showMedModal, setShowMedModal] = useState(false);
  const [medName, setMedName] = useState("");
  const [medQty, setMedQty] = useState(100);
  const [medUnit, setMedUnit] = useState("tablets");
  const [medThreshold, setMedThreshold] = useState(20);
  const [medCategory, setMedCategory] = useState("Antibiotic");

  // Diagnostic Test Modal
  const [showDiagModal, setShowDiagModal] = useState(false);
  const [diagName, setDiagName] = useState("");
  const [diagCategory, setDiagCategory] = useState("Blood Pathology");
  const [diagCost, setDiagCost] = useState(0);
  const [diagTurnaround, setDiagTurnaround] = useState(4);

  const fetchFacilityData = async () => {
    if (!facilityId) return;
    setLoading(true);
    try {
      const res = await facilitiesApi.getById(facilityId);
      if (res.success && res.data) {
        const fac = res.data;
        setFacility(fac);
        if (fac.bedStatus) {
          setTotalBeds(fac.bedStatus.totalBeds);
          setAvailableBeds(fac.bedStatus.availableBeds);
          setIcuTotal(fac.bedStatus.icuBedsTotal);
          setIcuAvailable(fac.bedStatus.icuBedsAvailable);
          setOxygenTotal(fac.bedStatus.oxygenBedsTotal);
          setOxygenAvailable(fac.bedStatus.oxygenBedsAvailable);
        }
      }
    } catch (err) {
      console.warn("Failed to load facility data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilityData();
  }, [facilityId]);

  const handleUpdateBeds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId) return;
    setSavingBeds(true);
    setBedMsg(null);
    try {
      await facilitiesApi.updateBeds(facilityId, {
        totalBeds: Number(totalBeds),
        availableBeds: Number(availableBeds),
        icuBedsTotal: Number(icuTotal),
        icuBedsAvailable: Number(icuAvailable),
        oxygenBedsTotal: Number(oxygenTotal),
        oxygenBedsAvailable: Number(oxygenAvailable),
      });
      setBedMsg({ type: "success", text: "Bed capacity matrix synchronized with State Central Dashboard!" });
      fetchFacilityData();
    } catch (err: any) {
      setBedMsg({ type: "error", text: err.message || "Failed to update bed capacity." });
    } finally {
      setSavingBeds(false);
    }
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId || !medName.trim()) return;
    try {
      await facilitiesApi.upsertMedicine(facilityId, {
        medicineName: medName,
        quantity: Number(medQty),
        unit: medUnit,
        stockThreshold: Number(medThreshold),
        category: medCategory,
        isAvailable: Number(medQty) > 0,
      });
      setShowMedModal(false);
      setMedName("");
      fetchFacilityData();
    } catch (err: any) {
      alert(err.message || "Failed to add medicine.");
    }
  };

  const handleAddDiagnostic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId || !diagName.trim()) return;
    try {
      await facilitiesApi.upsertDiagnostic(facilityId, {
        testName: diagName,
        category: diagCategory,
        costInr: Number(diagCost),
        turnaroundHours: Number(diagTurnaround),
        isAvailable: true,
      });
      setShowDiagModal(false);
      setDiagName("");
      fetchFacilityData();
    } catch (err: any) {
      alert(err.message || "Failed to add diagnostic test.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ─── FACILITY OVERVIEW TAB ───────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#0E4A43] via-[#093530] to-[#041c19] p-8 text-white shadow-xl">
            <div className="absolute right-0 top-0 w-96 h-96 bg-[#E5F973]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#E5F973] text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-[#E5F973] animate-pulse" />
                  Facility Operations Center &bull; {facility?.type || "PHC"}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black">{facility?.name || "Healthcare Facility Console"}</h1>
                <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
                  {facility?.address || `${facility?.village || "Taluka"}, ${facility?.district || "Maharashtra"}`} &bull; Contact: {facility?.contactPhone || "24x7 Emergency"}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => setTab("beds")}
                  className="px-5 py-3 rounded-2xl bg-[#E5F973] text-[#0E4A43] font-black text-xs hover:brightness-105 active:scale-95 transition-all shadow-md flex items-center gap-2"
                >
                  <Bed className="w-4 h-4" />
                  <span>Update Bed Matrix</span>
                </button>
                <button
                  onClick={() => setShowMedModal(true)}
                  className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Restock Pharmacy</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div
              onClick={() => setTab("beds")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <Bed className="w-5 h-5 text-emerald-800" />
              </div>
              <div className="text-2xl font-black text-slate-900">{availableBeds} / {totalBeds}</div>
              <div className="text-xs font-bold text-slate-500">Vacant Inpatient Beds</div>
            </div>

            <div
              onClick={() => setTab("beds")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5 text-blue-800" />
              </div>
              <div className="text-2xl font-black text-slate-900">{oxygenAvailable} / {oxygenTotal}</div>
              <div className="text-xs font-bold text-slate-500">Oxygen-Equipped Beds</div>
            </div>

            <div
              onClick={() => setTab("pharmacy")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <Pill className="w-5 h-5 text-amber-800" />
              </div>
              <div className="text-2xl font-black text-slate-900">{facility?.medicines?.length || 0}</div>
              <div className="text-xs font-bold text-slate-500">Essential Drug SKUs</div>
            </div>

            <div
              onClick={() => setTab("diagnostics")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <FlaskConical className="w-5 h-5 text-purple-800" />
              </div>
              <div className="text-2xl font-black text-slate-900">{facility?.diagnostics?.length || 0}</div>
              <div className="text-xs font-bold text-slate-500">Active Diagnostic Tests</div>
            </div>
          </div>

          {/* Live Pharmacy Snapshot */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">Essential Medicines Inventory</h2>
              <button onClick={() => setTab("pharmacy")} className="text-xs font-bold text-[#0E4A43] hover:underline">
                View Full Pharmacy &rarr;
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {facility?.medicines?.slice(0, 4).map((med) => (
                <div key={med.id || med.medicineName} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-black text-slate-900">{med.medicineName}</span>
                    <span className="text-slate-500 ml-2">({med.category || "General"})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-700">{med.quantity} {med.unit}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      med.quantity > med.stockThreshold ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    }`}>
                      {med.quantity > med.stockThreshold ? "Adequate Stock" : "Low Stock"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── BED CAPACITY MANAGEMENT TAB ─────────────────────────────────────── */}
      {activeTab === "beds" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Broadcast Live Inpatient Bed Capacities</h2>
            <p className="text-xs text-slate-500">Updates here are reflected instantaneously on the citizen directory, 108 emergency dispatch, and referral routing.</p>
          </div>

          {bedMsg && (
            <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              bedMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              <Check className="w-4 h-4" />
              <span>{bedMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateBeds} className="space-y-6 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* General Inpatient */}
              <div className="p-5 bg-slate-50 rounded-2xl space-y-3">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Bed className="w-4 h-4 text-[#0E4A43]" />
                  <span>General Ward Beds</span>
                </h3>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Capacity</label>
                  <input
                    type="number"
                    value={totalBeds}
                    onChange={(e) => setTotalBeds(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vacant / Available Beds</label>
                  <input
                    type="number"
                    value={availableBeds}
                    onChange={(e) => setAvailableBeds(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold"
                  />
                </div>
              </div>

              {/* Oxygen Beds */}
              <div className="p-5 bg-blue-50/50 rounded-2xl space-y-3">
                <h3 className="font-black text-sm text-blue-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-800" />
                  <span>Oxygen-Supported Beds</span>
                </h3>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Capacity</label>
                  <input
                    type="number"
                    value={oxygenTotal}
                    onChange={(e) => setOxygenTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vacant / Available Beds</label>
                  <input
                    type="number"
                    value={oxygenAvailable}
                    onChange={(e) => setOxygenAvailable(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold"
                  />
                </div>
              </div>

              {/* ICU Beds */}
              <div className="p-5 bg-purple-50/50 rounded-2xl space-y-3">
                <h3 className="font-black text-sm text-purple-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-800" />
                  <span>ICU / Ventilator Beds</span>
                </h3>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Capacity</label>
                  <input
                    type="number"
                    value={icuTotal}
                    onChange={(e) => setIcuTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vacant / Available Beds</label>
                  <input
                    type="number"
                    value={icuAvailable}
                    onChange={(e) => setIcuAvailable(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingBeds}
                className="px-6 py-3 rounded-2xl bg-[#0E4A43] text-white font-black text-xs hover:brightness-110 disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{savingBeds ? "Broadcasting Matrix..." : "Broadcast Real-Time Bed Matrix"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── PHARMACY & MEDICINES TAB ────────────────────────────────────────── */}
      {(activeTab === "pharmacy" || activeTab === "medicines") && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Hospital Pharmacy &amp; Medicine Inventory</h2>
              <p className="text-xs text-slate-500">Live dispensary drug stocks connected to doctor e-prescription validation</p>
            </div>
            <button
              onClick={() => setShowMedModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#0E4A43] text-white font-bold text-xs hover:brightness-110 flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add / Restock Medicine</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#EFF2F5] text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Medicine Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Threshold</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {facility?.medicines?.map((med) => (
                  <tr key={med.id || med.medicineName} className="hover:bg-slate-50">
                    <td className="py-3 px-5 font-black text-slate-900">{med.medicineName}</td>
                    <td className="py-3 px-4 text-slate-500">{med.category || "General"}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{med.quantity} {med.unit}</td>
                    <td className="py-3 px-4 text-slate-500">{med.stockThreshold} {med.unit}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        med.quantity > med.stockThreshold ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}>
                        {med.quantity > med.stockThreshold ? "In Stock" : "Low Stock"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── DIAGNOSTIC CATALOG TAB ──────────────────────────────────────────── */}
      {activeTab === "diagnostics" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Diagnostic Tests &amp; Pathology Services</h2>
              <p className="text-xs text-slate-500">Available laboratory tests, radiological scans, and turnaround timelines</p>
            </div>
            <button
              onClick={() => setShowDiagModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#0E4A43] text-white font-bold text-xs hover:brightness-110 flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Diagnostic Test</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {facility?.diagnostics?.map((diag) => (
              <div key={diag.id || diag.testName} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-sm">{diag.testName}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Available
                  </span>
                </div>
                <p className="text-slate-500">{diag.category || "General Pathology"}</p>
                <div className="p-3 bg-[#EFF2F5] rounded-xl flex items-center justify-between font-bold">
                  <span>Govt Rate: <strong className="text-slate-900">{diag.costInr === 0 ? "Free (Govt)" : `₹${diag.costInr}`}</strong></span>
                  <span>Turnaround: <strong className="text-[#0E4A43]">{diag.turnaroundHours} hrs</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── DOCTOR DUTY ROSTER TAB ──────────────────────────────────────────── */}
      {activeTab === "staff_roster" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 text-xs">
          <div>
            <h2 className="text-xl font-black text-slate-900">Doctor Shift &amp; OPD Duty Roster</h2>
            <p className="text-slate-500">Manage shift assignments, on-call specialists, and emergency duty rotations</p>
          </div>

          <div className="divide-y divide-slate-100">
            {facility?.doctors && facility.doctors.length > 0 ? (
              facility.doctors.map((doc) => (
                <div key={doc.id} className="py-4 flex items-center justify-between">
                  <div>
                    <span className="font-black text-sm text-slate-900">Dr. {doc.user?.fullName}</span>
                    <p className="text-slate-500">{doc.specialty || "Medical Officer"} &bull; {doc.qualification || "MBBS"}</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-full text-[11px]">
                    OPD Duty: 09:00 AM - 04:00 PM
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400 font-bold">
                Duty roster synced with district health officer schedule.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── FACILITY DETAILS TAB ────────────────────────────────────────────── */}
      {(activeTab === "facility_details" || activeTab === "profile") && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 text-xs">
          <div>
            <h2 className="text-xl font-black text-slate-900">Facility Master Profile &amp; Geo-Coordinates</h2>
            <p className="text-slate-500">Public metadata broadcasted on the Maharashtra Statewide Healthcare Directory</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Facility Official Name</div>
              <div className="font-black text-slate-900 text-sm mt-1">{facility?.name}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Administrative Classification</div>
              <div className="font-black text-[#0E4A43] text-sm mt-1">{facility?.type}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="text-slate-400 font-bold uppercase text-[10px]">District &amp; Taluka</div>
              <div className="font-black text-slate-900 text-sm mt-1">{facility?.district} ({facility?.village || "Taluka"})</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Emergency Hotline</div>
              <div className="font-black text-slate-900 text-sm mt-1">{facility?.contactPhone || "24x7 Emergency"}</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD MEDICINE MODAL ──────────────────────────────────────────────── */}
      {showMedModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">Add / Restock Medicine</h3>
              <button onClick={() => setShowMedModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddMedicine} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol 500mg"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={medQty}
                    onChange={(e) => setMedQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={medUnit}
                    onChange={(e) => setMedUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowMedModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 rounded-xl bg-[#0E4A43] text-white font-bold hover:brightness-110">
                  Save Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD DIAGNOSTIC MODAL ────────────────────────────────────────────── */}
      {showDiagModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">Add Diagnostic Test</h3>
              <button onClick={() => setShowDiagModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddDiagnostic} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Test Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Blood Count (CBC)"
                  value={diagName}
                  onChange={(e) => setDiagName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={diagCategory}
                    onChange={(e) => setDiagCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Turnaround (Hours)</label>
                  <input
                    type="number"
                    value={diagTurnaround}
                    onChange={(e) => setDiagTurnaround(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowDiagModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 rounded-xl bg-[#0E4A43] text-white font-bold hover:brightness-110">
                  Save Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
