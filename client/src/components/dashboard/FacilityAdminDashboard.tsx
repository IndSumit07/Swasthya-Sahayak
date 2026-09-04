"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  facilitiesApi,
  type UserProfile,
  type Facility,
  type FacilityMedicine,
  type FacilityDiagnostic,
  type AvailabilityMatrix,
  type FacilitySlot,
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
  Calendar,
  ToggleLeft,
  ToggleRight,
  Layers,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface FacilityAdminDashboardProps {
  user: UserProfile;
  activeTab: string;
  setTab: (t: string) => void;
}

export function FacilityAdminDashboard({ user, activeTab, setTab }: FacilityAdminDashboardProps) {
  const facilityId = user.facilityAdmin?.facilityId;
  const [facility, setFacility] = useState<Facility | null>(null);
  const [matrix, setMatrix] = useState<AvailabilityMatrix | null>(null);
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

  // Appointment Slot Modal (FR-07)
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [slotName, setSlotName] = useState("");
  const [slotStart, setSlotStart] = useState("09:00");
  const [slotEnd, setSlotEnd] = useState("12:00");
  const [slotCapacity, setSlotCapacity] = useState(20);

  // Service Modal (FR-06)
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [serviceCategory, setServiceCategory] = useState("OPD");

  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchFacilityData = async () => {
    if (!facilityId) return;
    setLoading(true);
    try {
      const [facRes, matRes] = await Promise.allSettled([
        facilitiesApi.getById(facilityId),
        facilitiesApi.getAvailabilityMatrix(facilityId),
      ]);

      if (facRes.status === "fulfilled" && facRes.value.success && facRes.value.data) {
        const fac = facRes.value.data;
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

      if (matRes.status === "fulfilled" && matRes.value.success && matRes.value.data) {
        setMatrix(matRes.value.data);
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

  // Bed Matrix Update
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
      setBedMsg({ type: "success", text: "Bed capacity matrix synchronized with State Central Directory!" });
      fetchFacilityData();
    } catch (err: any) {
      setBedMsg({ type: "error", text: err.message || "Failed to update bed capacity." });
    } finally {
      setSavingBeds(false);
    }
  };

  // Quick Inpatient Bed Adjustment (+ / -)
  const handleQuickAdjustBeds = async (delta: number) => {
    if (!facilityId) return;
    const newAvailable = Math.max(0, Math.min(totalBeds, availableBeds + delta));
    setAvailableBeds(newAvailable);
    try {
      await facilitiesApi.updateBeds(facilityId, { availableBeds: newAvailable });
      fetchFacilityData();
    } catch (err) {
      console.error("Failed to adjust beds:", err);
    }
  };

  // Medicine Restock
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
      setActionMsg({ type: "success", text: "Medicine added to drug directory!" });
      fetchFacilityData();
    } catch (err: any) {
      alert(err.message || "Failed to add medicine.");
    }
  };

  // Medicine Availability Toggle
  const handleToggleMedicine = async (medicineId: string, current: boolean) => {
    if (!facilityId) return;
    try {
      await facilitiesApi.toggleMedicine(facilityId, medicineId, !current);
      fetchFacilityData();
    } catch (err: any) {
      alert(err.message || "Failed to toggle medicine status.");
    }
  };

  // Diagnostic Test Upsert
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
      setActionMsg({ type: "success", text: "Diagnostic test catalog updated!" });
      fetchFacilityData();
    } catch (err: any) {
      alert(err.message || "Failed to add diagnostic test.");
    }
  };

  // Diagnostic Availability Toggle
  const handleToggleDiagnostic = async (diagId: string, current: boolean) => {
    if (!facilityId) return;
    try {
      await facilitiesApi.toggleDiagnostic(facilityId, diagId, !current);
      fetchFacilityData();
    } catch (err: any) {
      alert(err.message || "Failed to toggle diagnostic status.");
    }
  };

  // Doctor Availability Toggle (FR-07)
  const handleToggleDoctor = async (doctorId: string, current: boolean) => {
    if (!facilityId) return;
    try {
      await facilitiesApi.toggleDoctorAvailability(facilityId, doctorId, !current);
      fetchFacilityData();
    } catch (err: any) {
      alert(err.message || "Failed to update doctor availability.");
    }
  };

  // Slot Management (FR-07)
  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId || !slotName.trim()) return;
    try {
      await facilitiesApi.upsertSlot(facilityId, {
        slotName,
        startTime: slotStart,
        endTime: slotEnd,
        maxCapacity: Number(slotCapacity),
        isAvailable: true,
      });
      setShowSlotModal(false);
      setSlotName("");
      setActionMsg({ type: "success", text: "Consultation appointment slot created!" });
      fetchFacilityData();
    } catch (err: any) {
      alert(err.message || "Failed to create slot.");
    }
  };

  const handleToggleSlot = async (slotId: string, current: boolean) => {
    if (!facilityId) return;
    try {
      await facilitiesApi.toggleSlot(facilityId, slotId, !current);
      fetchFacilityData();
    } catch (err: any) {
      alert(err.message || "Failed to toggle slot.");
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!facilityId || !confirm("Delete this appointment slot?")) return;
    try {
      await facilitiesApi.deleteSlot(facilityId, slotId);
      fetchFacilityData();
    } catch (err: any) {
      alert(err.message || "Failed to delete slot.");
    }
  };

  // Service Management (FR-06)
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId || !serviceName.trim()) return;
    try {
      await facilitiesApi.addService(facilityId, serviceName, serviceCategory);
      setShowServiceModal(false);
      setServiceName("");
      setActionMsg({ type: "success", text: "Clinical service added to directory!" });
      fetchFacilityData();
    } catch (err: any) {
      alert(err.message || "Failed to add service.");
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!facilityId || !confirm("Remove this service from facility?")) return;
    try {
      await facilitiesApi.deleteService(facilityId, serviceId);
      fetchFacilityData();
    } catch (err: any) {
      alert(err.message || "Failed to delete service.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {actionMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 ${
          actionMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
        }`}>
          <span>{actionMsg.text}</span>
          <button onClick={() => setActionMsg(null)} className="font-black text-slate-500 hover:text-slate-800">Dismiss</button>
        </div>
      )}

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "overview", label: "Facility Console", icon: Building2 },
          { id: "matrix", label: "Live Availability Matrix (FR-07)", icon: Sparkles },
          { id: "beds", label: "Bed Capacity", icon: Bed },
          { id: "medicines", label: `Medicines (${facility?.medicines?.length ?? 0})`, icon: Pill },
          { id: "diagnostics", label: `Diagnostics (${facility?.diagnostics?.length ?? 0})`, icon: FlaskConical },
          { id: "staff_roster", label: `Doctors & Slots (${facility?.doctors?.length ?? 0})`, icon: Stethoscope },
          { id: "services", label: `Services (${facility?.services?.length ?? 0})`, icon: Layers },
          { id: "profile", label: "Facility Details", icon: Building2 },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive
                  ? "bg-[#0E4A43] text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

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
                  onClick={() => setTab("matrix")}
                  className="px-5 py-3 rounded-2xl bg-[#E5F973] text-[#0E4A43] font-black text-xs hover:brightness-105 active:scale-95 transition-all shadow-md flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Update Live Matrix (FR-07)</span>
                </button>
                <button
                  onClick={() => setShowMedModal(true)}
                  className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Restock Drug</span>
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
              <div className="text-[11px] font-bold text-slate-400 uppercase">Available Beds</div>
              <div className="text-2xl font-black text-emerald-700">
                {availableBeds} <span className="text-xs text-slate-400 font-bold">/ {totalBeds}</span>
              </div>
              <div className="text-[10px] text-slate-400">Click to configure</div>
            </div>

            <div
              onClick={() => setTab("staff_roster")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <Stethoscope className="w-5 h-5 text-teal-800" />
              </div>
              <div className="text-[11px] font-bold text-slate-400 uppercase">Doctors on Duty</div>
              <div className="text-2xl font-black text-[#0E4A43]">
                {facility?.doctors?.filter(d => d.isAvailable).length ?? 0}
              </div>
              <div className="text-[10px] text-slate-400">Manage roster &amp; slots</div>
            </div>

            <div
              onClick={() => setTab("medicines")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <Pill className="w-5 h-5 text-amber-800" />
              </div>
              <div className="text-[11px] font-bold text-slate-400 uppercase">Medicines in Stock</div>
              <div className="text-2xl font-black text-amber-700">
                {facility?.medicines?.filter(m => m.isAvailable && m.quantity > 0).length ?? 0}
              </div>
              <div className="text-[10px] text-slate-400">Restock catalog</div>
            </div>

            <div
              onClick={() => setTab("diagnostics")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <FlaskConical className="w-5 h-5 text-indigo-800" />
              </div>
              <div className="text-[11px] font-bold text-slate-400 uppercase">Active Diagnostics</div>
              <div className="text-2xl font-black text-indigo-700">
                {facility?.diagnostics?.filter(d => d.isAvailable).length ?? 0}
              </div>
              <div className="text-[10px] text-slate-400">Lab &amp; radiological tests</div>
            </div>
          </div>

          {/* Quick FR-07 Live Availability Matrix Widget */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0E4A43]" />
                  <span>Live Availability Control (FR-07)</span>
                </h3>
                <p className="text-xs text-slate-500">1-click status toggling synchronized directly to public patient directory</p>
              </div>
              <button
                onClick={() => setTab("matrix")}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Expand Matrix &rsaquo;
              </button>
            </div>

            {/* Inpatient Bed Quick Adjustment */}
            <div className="p-4 bg-slate-50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-bold text-slate-900">Beds Availability</div>
                <div className="text-slate-500">Current available inpatient beds: <strong className="text-emerald-700">{availableBeds}</strong> / {totalBeds}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuickAdjustBeds(-1)}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-black text-slate-700 hover:bg-slate-100 flex items-center justify-center"
                >
                  -
                </button>
                <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 font-black text-xs">
                  {availableBeds} Available
                </span>
                <button
                  onClick={() => handleQuickAdjustBeds(1)}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-black text-slate-700 hover:bg-slate-100 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── LIVE AVAILABILITY MATRIX TAB (FR-07 COMPLETE) ────────────────────── */}
      {activeTab === "matrix" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>FR-07 Facility Availability Control Panel</span>
              </div>
              <h2 className="text-xl font-black text-slate-900">{facility?.name} &bull; Availability Switchboard</h2>
              <p className="text-xs text-slate-500 mt-1">
                Toggle doctor availability, appointment slots, bed capacity, diagnostic tests, and medicine availability with instant real-time sync.
              </p>
            </div>
            <button
              onClick={fetchFacilityData}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Status</span>
            </button>
          </div>

          {/* Doctors Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[#0E4A43]" />
                <span>Doctor Availability</span>
              </h3>
              <span className="text-xs text-slate-500 font-bold">{facility?.doctors?.length || 0} Registered Doctors</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs font-bold">
              {facility?.doctors && facility.doctors.length > 0 ? (
                facility.doctors.map((doc) => (
                  <div key={doc.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-slate-900 font-black">Dr. {doc.user?.fullName || "Doctor"}</div>
                      <div className="text-slate-500 font-normal">{doc.specialty || "General Medicine"} &bull; {doc.qualification || "MBBS"}</div>
                    </div>
                    <button
                      onClick={() => handleToggleDoctor(doc.id, doc.isAvailable !== false)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                        doc.isAvailable !== false
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {doc.isAvailable !== false ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Available</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-slate-400" />
                          <span>Unavailable</span>
                        </>
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-slate-400 font-normal">
                  No doctors registered directly at facility. Add doctors in the staff roster tab.
                </div>
              )}
            </div>
          </div>

          {/* Diagnostic Tests Section (FR-07 example: Blood Test Available, X-Ray Unavailable) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-[#0E4A43]" />
                <span>Diagnostic Availability (e.g. Blood Test, X-Ray)</span>
              </h3>
              <button
                onClick={() => setShowDiagModal(true)}
                className="px-3 py-1.5 rounded-xl bg-[#0E4A43] text-white text-xs font-bold hover:brightness-110 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Test</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs font-bold">
              {facility?.diagnostics && facility.diagnostics.length > 0 ? (
                facility.diagnostics.map((diag) => (
                  <div key={diag.id || diag.testName} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-slate-900 font-black">{diag.testName}</div>
                      <div className="text-slate-500 font-normal">{diag.category || "Laboratory"} &bull; Turnaround: {diag.turnaroundHours}h &bull; Govt Rate: {diag.costInr === 0 ? "Free" : `Rs. ${diag.costInr}`}</div>
                    </div>
                    <button
                      onClick={() => diag.id && handleToggleDiagnostic(diag.id, diag.isAvailable)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                        diag.isAvailable
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                      }`}
                    >
                      {diag.isAvailable ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Available</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Unavailable</span>
                        </>
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-slate-400 font-normal">
                  No diagnostic tests registered yet. Click &quot;Add Test&quot; above.
                </div>
              )}
            </div>
          </div>

          {/* Medicine Availability Section (FR-07 example: Paracetamol Available) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Pill className="w-4 h-4 text-[#0E4A43]" />
                <span>Medicine Availability (e.g. Paracetamol)</span>
              </h3>
              <button
                onClick={() => setShowMedModal(true)}
                className="px-3 py-1.5 rounded-xl bg-[#0E4A43] text-white text-xs font-bold hover:brightness-110 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medicine</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs font-bold">
              {facility?.medicines && facility.medicines.length > 0 ? (
                facility.medicines.map((med) => (
                  <div key={med.id || med.medicineName} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-slate-900 font-black">{med.medicineName}</div>
                      <div className="text-slate-500 font-normal">{med.category || "Essential"} &bull; Stock: {med.quantity} {med.unit} &bull; Threshold: {med.stockThreshold}</div>
                    </div>
                    <button
                      onClick={() => med.id && handleToggleMedicine(med.id, med.isAvailable && med.quantity > 0)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                        med.isAvailable && med.quantity > 0
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                      }`}
                    >
                      {med.isAvailable && med.quantity > 0 ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Available</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Out of Stock</span>
                        </>
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-slate-400 font-normal">
                  No medicines cataloged yet. Click &quot;Add Medicine&quot; above.
                </div>
              )}
            </div>
          </div>

          {/* Bed Availability Section (FR-07 example: Beds 3 Available) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Bed className="w-4 h-4 text-[#0E4A43]" />
              <span>Bed Availability (FR-07)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                <div className="text-[11px] font-bold text-emerald-900">General Beds</div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-emerald-800">{availableBeds} Available</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleQuickAdjustBeds(-1)}
                      className="w-7 h-7 bg-white rounded-lg border border-emerald-300 font-black text-emerald-900 hover:bg-emerald-100"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleQuickAdjustBeds(1)}
                      className="w-7 h-7 bg-white rounded-lg border border-emerald-300 font-black text-emerald-900 hover:bg-emerald-100"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-emerald-700">Total capacity: {totalBeds} beds</div>
              </div>

              <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 space-y-2">
                <div className="text-[11px] font-bold text-sky-900">Oxygen-Supported Beds</div>
                <span className="text-2xl font-black text-sky-800">{oxygenAvailable} Available</span>
                <div className="text-[10px] text-sky-700">Total capacity: {oxygenTotal} beds</div>
              </div>

              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
                <div className="text-[11px] font-bold text-purple-900">ICU Ventilator Beds</div>
                <span className="text-2xl font-black text-purple-800">{icuAvailable} Available</span>
                <div className="text-[10px] text-purple-700">Total capacity: {icuTotal} beds</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── BED MATRIX CONFIGURATION TAB ────────────────────────────────────── */}
      {activeTab === "beds" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Bed Availability &amp; Inpatient Capacity Matrix</h2>
            <p className="text-xs text-slate-500">Live bed census synchronizes with the district and state centralized emergency board</p>
          </div>

          {bedMsg && (
            <div className={`p-4 rounded-2xl text-xs font-bold ${
              bedMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {bedMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdateBeds} className="space-y-6 max-w-2xl text-xs">
            {/* General Ward */}
            <div className="p-5 bg-slate-50 rounded-2xl space-y-4">
              <div className="font-black text-slate-900 flex items-center gap-2">
                <Bed className="w-4 h-4 text-emerald-600" />
                <span>General Inpatient Ward</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Authorized Beds</label>
                  <input
                    type="number"
                    min="0"
                    value={totalBeds}
                    onChange={(e) => setTotalBeds(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Currently Available Beds</label>
                  <input
                    type="number"
                    min="0"
                    value={availableBeds}
                    onChange={(e) => setAvailableBeds(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Oxygen Supported */}
            <div className="p-5 bg-slate-50 rounded-2xl space-y-4">
              <div className="font-black text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-600" />
                <span>Oxygen-Supported Beds</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Oxygen Beds</label>
                  <input
                    type="number"
                    min="0"
                    value={oxygenTotal}
                    onChange={(e) => setOxygenTotal(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Available Oxygen Beds</label>
                  <input
                    type="number"
                    min="0"
                    value={oxygenAvailable}
                    onChange={(e) => setOxygenAvailable(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* ICU Ventilator */}
            <div className="p-5 bg-slate-50 rounded-2xl space-y-4">
              <div className="font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>ICU &amp; Ventilator Capacity</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total ICU Beds</label>
                  <input
                    type="number"
                    min="0"
                    value={icuTotal}
                    onChange={(e) => setIcuTotal(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Available ICU Beds</label>
                  <input
                    type="number"
                    min="0"
                    value={icuAvailable}
                    onChange={(e) => setIcuAvailable(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 font-bold"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingBeds}
              className="px-6 py-3 rounded-2xl bg-[#0E4A43] text-white font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-md"
            >
              {savingBeds ? "Synchronizing..." : "Save Bed Matrix"}
            </button>
          </form>
        </div>
      )}

      {/* ─── ESSENTIAL MEDICINES TAB ─────────────────────────────────────────── */}
      {activeTab === "medicines" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Essential Drug Inventory</h2>
              <p className="text-xs text-slate-500">Track and restock medicine batches at the facility pharmacy</p>
            </div>
            <button
              onClick={() => setShowMedModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#0E4A43] text-white font-bold text-xs hover:brightness-110 flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Medicine Batch</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#EFF2F5] text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Medicine Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Threshold</th>
                  <th className="py-3 px-4">Availability</th>
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
                      <button
                        onClick={() => med.id && handleToggleMedicine(med.id, med.isAvailable && med.quantity > 0)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          med.isAvailable && med.quantity > 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {med.isAvailable && med.quantity > 0 ? "In Stock" : "Out of Stock"}
                      </button>
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
                  <button
                    onClick={() => diag.id && handleToggleDiagnostic(diag.id, diag.isAvailable)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      diag.isAvailable ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {diag.isAvailable ? "Available" : "Unavailable"}
                  </button>
                </div>
                <p className="text-slate-500">{diag.category || "General Pathology"}</p>
                <div className="p-3 bg-[#EFF2F5] rounded-xl flex items-center justify-between font-bold">
                  <span>Govt Rate: <strong className="text-slate-900">{diag.costInr === 0 ? "Free (Govt)" : `Rs. ${diag.costInr}`}</strong></span>
                  <span>Turnaround: <strong className="text-[#0E4A43]">{diag.turnaroundHours} hrs</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── DOCTORS & APPOINTMENT SLOTS TAB (FR-07) ─────────────────────────── */}
      {activeTab === "staff_roster" && (
        <div className="space-y-6">
          {/* Doctor Availability */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 text-xs">
            <div>
              <h2 className="text-xl font-black text-slate-900">Doctor Shift &amp; Availability Matrix</h2>
              <p className="text-slate-500">1-click duty status toggling synchronized directly to public patient directory</p>
            </div>

            <div className="divide-y divide-slate-100">
              {facility?.doctors && facility.doctors.length > 0 ? (
                facility.doctors.map((doc) => (
                  <div key={doc.id} className="py-4 flex items-center justify-between">
                    <div>
                      <span className="font-black text-sm text-slate-900">Dr. {doc.user?.fullName}</span>
                      <p className="text-slate-500">{doc.specialty || "Medical Officer"} &bull; {doc.qualification || "MBBS"}</p>
                    </div>
                    <button
                      onClick={() => handleToggleDoctor(doc.id, doc.isAvailable !== false)}
                      className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
                        doc.isAvailable !== false
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {doc.isAvailable !== false ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>On Duty (Available)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-slate-400" />
                          <span>Off Duty</span>
                        </>
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 font-bold">
                  No doctors currently registered at facility.
                </div>
              )}
            </div>
          </div>

          {/* Appointment Consultation Slots */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">OPD Consultation Slots (FR-07)</h2>
                <p className="text-slate-500">Define daily token quotas and timings for patient appointments</p>
              </div>
              <button
                onClick={() => setShowSlotModal(true)}
                className="px-4 py-2 rounded-xl bg-[#0E4A43] text-white font-bold text-xs hover:brightness-110 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Slot</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {facility?.slots && facility.slots.length > 0 ? (
                facility.slots.map((sl) => (
                  <div key={sl.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm">{sl.slotName}</span>
                      <button
                        onClick={() => handleToggleSlot(sl.id, sl.isAvailable)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sl.isAvailable ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {sl.isAvailable ? "Available" : "Unavailable"}
                      </button>
                    </div>
                    <div className="text-slate-500">Timings: {sl.startTime} - {sl.endTime}</div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 font-bold">
                      <span>Max Capacity: {sl.maxCapacity} tokens</span>
                      <button
                        onClick={() => handleDeleteSlot(sl.id)}
                        className="text-rose-600 hover:text-rose-800 text-[11px]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 p-6 text-center text-slate-400 font-bold">
                  No custom consultation slots configured. Default morning and midday OPD hours apply.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── CLINICAL SERVICES DIRECTORY TAB (FR-06) ─────────────────────────── */}
      {activeTab === "services" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Clinical Services Directory (FR-06)</h2>
              <p className="text-slate-500">Manage registered services offered to citizens at this facility</p>
            </div>
            <button
              onClick={() => setShowServiceModal(true)}
              className="px-4 py-2 rounded-xl bg-[#0E4A43] text-white font-bold text-xs hover:brightness-110 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Service</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {facility?.services && facility.services.length > 0 ? (
              facility.services.map((srv) => (
                <div key={srv.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-black text-slate-900 text-sm">{srv.name}</div>
                    <div className="text-slate-500 text-[11px]">{srv.category || "Clinical Care"}</div>
                  </div>
                  <button
                    onClick={() => srv.id && handleDeleteService(srv.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-3 p-6 text-center text-slate-400 font-bold">
                No clinical services registered yet. Click &quot;Add Service&quot; above.
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
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="text-slate-400 font-bold uppercase text-[10px]">GPS Latitude &amp; Longitude</div>
              <div className="font-black text-slate-900 text-sm mt-1">{facility?.latitude ? `${facility.latitude}, ${facility.longitude}` : "Configured at District"}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Working Hours</div>
              <div className="font-black text-slate-900 text-sm mt-1">{facility?.workingHours || "24x7 Emergency"}</div>
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
                  placeholder="e.g. Complete Blood Count (CBC) or X-Ray Chest"
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

      {/* ─── ADD APPOINTMENT SLOT MODAL (FR-07) ───────────────────────────────── */}
      {showSlotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">Add OPD Consultation Slot</h3>
              <button onClick={() => setShowSlotModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddSlot} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Slot Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Morning OPD Slot (09:00 - 11:00)"
                  value={slotName}
                  onChange={(e) => setSlotName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={slotStart}
                    onChange={(e) => setSlotStart(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={slotEnd}
                    onChange={(e) => setSlotEnd(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Max Token Capacity</label>
                <input
                  type="number"
                  value={slotCapacity}
                  onChange={(e) => setSlotCapacity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowSlotModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 rounded-xl bg-[#0E4A43] text-white font-bold hover:brightness-110">
                  Save Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD SERVICE MODAL (FR-06) ───────────────────────────────────────── */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">Add Clinical Service to Directory</h3>
              <button onClick={() => setShowServiceModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddService} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vaccination, Maternal Care, Emergency Triage..."
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Category</label>
                <select
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                >
                  <option value="OPD">OPD Consultation</option>
                  <option value="MCH">Maternal &amp; Child Health</option>
                  <option value="LAB">Diagnostics &amp; Lab</option>
                  <option value="PHARMACY">Pharmacy</option>
                  <option value="EMERGENCY">Emergency Care</option>
                  <option value="PREVENTIVE">Vaccination &amp; Preventive</option>
                  <option value="NCD">Chronic Disease Care</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowServiceModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 rounded-xl bg-[#0E4A43] text-white font-bold hover:brightness-110">
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
