"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { facilitiesApi, type UserProfile, type Facility, type FacilityMedicine, type FacilityDiagnostic } from "@/lib/api";

interface FacilityAdminDashboardProps {
  user: UserProfile;
  activeTab: string;
  setTab: (t: string) => void;
}

export function FacilityAdminDashboard({ user, activeTab, setTab }: FacilityAdminDashboardProps) {
  const [effectiveFacilityId, setEffectiveFacilityId] = useState(user.facilityAdmin?.facilityId || "");
  const [facility, setFacility] = useState<Facility | null>(null);
  const [allFacilities, setAllFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  // Live Bed State
  const [totalBeds, setTotalBeds] = useState(10);
  const [availableBeds, setAvailableBeds] = useState(5);
  const [oxygenBedsTotal, setOxygenBedsTotal] = useState(2);
  const [oxygenBedsAvailable, setOxygenBedsAvailable] = useState(1);
  const [icuBedsTotal, setIcuBedsTotal] = useState(0);
  const [icuBedsAvailable, setIcuBedsAvailable] = useState(0);
  const [savingBeds, setSavingBeds] = useState(false);
  const [bedMsg, setBedMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Medicine Stock State
  const [medicines, setMedicines] = useState<FacilityMedicine[]>([]);
  const [showMedModal, setShowMedModal] = useState(false);
  const [medName, setMedName] = useState("");
  const [medCategory, setMedCategory] = useState("Analgesic");
  const [medQty, setMedQty] = useState(100);
  const [medUnit, setMedUnit] = useState("strips");
  const [medThreshold, setMedThreshold] = useState(20);
  const [savingMed, setSavingMed] = useState(false);

  // Diagnostic Test State
  const [diagnostics, setDiagnostics] = useState<FacilityDiagnostic[]>([]);
  const [showDiagModal, setShowDiagModal] = useState(false);
  const [diagTestName, setDiagTestName] = useState("");
  const [diagCategory, setDiagCategory] = useState("Pathology");
  const [diagTat, setDiagTat] = useState(24);
  const [diagCost, setDiagCost] = useState(0);
  const [savingDiag, setSavingDiag] = useState(false);

  // Doctor Duty Roster
  const [dutyRoster, setDutyRoster] = useState<any[]>([]);

  const loadFacilityData = async (targetId?: string) => {
    setLoading(true);
    try {
      let targetFacilityId = targetId || effectiveFacilityId;

      if (!targetFacilityId) {
        const facListRes = await facilitiesApi.list();
        if (facListRes.success && facListRes.data.facilities.length > 0) {
          targetFacilityId = facListRes.data.facilities[0].id;
          setEffectiveFacilityId(targetFacilityId);
          setAllFacilities(facListRes.data.facilities);
        }
      }

      if (targetFacilityId) {
        const res = await facilitiesApi.getById(targetFacilityId);
        if (res.success && res.data) {
          const fac = res.data;
          setFacility(fac);
          if (fac.bedStatus) {
            setTotalBeds(fac.bedStatus.totalBeds);
            setAvailableBeds(fac.bedStatus.availableBeds);
            setOxygenBedsTotal(fac.bedStatus.oxygenBedsTotal);
            setOxygenBedsAvailable(fac.bedStatus.oxygenBedsAvailable);
            setIcuBedsTotal(fac.bedStatus.icuBedsTotal);
            setIcuBedsAvailable(fac.bedStatus.icuBedsAvailable);
          }
          if (fac.medicines) {
            setMedicines(fac.medicines);
          }
          if (fac.diagnostics) {
            setDiagnostics(fac.diagnostics);
          }
          if (fac.doctors) {
            setDutyRoster(fac.doctors.map((d, idx) => ({
              id: d.id,
              name: d.user?.fullName || `Dr. Specialist ${idx + 1}`,
              specialty: d.specialty || "General Medicine",
              shift: "Morning (09:00 - 15:00)",
              status: "On Duty",
              tokens: 30,
            })));
          }
        }
      }
    } catch (err) {
      console.warn("Failed to load facility data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacilityData();
  }, [user.id]);

  const handleSaveBeds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveFacilityId) return;
    setSavingBeds(true);
    setBedMsg(null);
    try {
      await facilitiesApi.updateBeds(effectiveFacilityId, {
        totalBeds: Number(totalBeds),
        availableBeds: Number(availableBeds),
        oxygenBedsTotal: Number(oxygenBedsTotal),
        oxygenBedsAvailable: Number(oxygenBedsAvailable),
        icuBedsTotal: Number(icuBedsTotal),
        icuBedsAvailable: Number(icuBedsAvailable),
      });
      setBedMsg({ type: "success", text: "Hospital bed capacity updated and synced across Maharashtra live directory!" });
      await loadFacilityData(effectiveFacilityId);
    } catch (err: any) {
      setBedMsg({ type: "error", text: err.message || "Failed to update bed status." });
    } finally {
      setSavingBeds(false);
    }
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim() || !effectiveFacilityId) return;
    setSavingMed(true);
    try {
      await facilitiesApi.upsertMedicine(effectiveFacilityId, {
        medicineName: medName,
        category: medCategory,
        quantity: Number(medQty),
        unit: medUnit,
        stockThreshold: Number(medThreshold),
        isAvailable: Number(medQty) > 0,
      });
      await loadFacilityData(effectiveFacilityId);
      setShowMedModal(false);
      setMedName("");
      setMedQty(100);
    } catch (err: any) {
      alert(err.message || "Failed to save medicine.");
    } finally {
      setSavingMed(false);
    }
  };

  const handleAddDiagnostic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagTestName.trim() || !effectiveFacilityId) return;
    setSavingDiag(true);
    try {
      await facilitiesApi.upsertDiagnostic(effectiveFacilityId, {
        testName: diagTestName,
        category: diagCategory,
        turnaroundHours: Number(diagTat),
        costInr: Number(diagCost),
        isAvailable: true,
      });
      await loadFacilityData(effectiveFacilityId);
      setShowDiagModal(false);
      setDiagTestName("");
      setDiagCost(0);
    } catch (err: any) {
      alert(err.message || "Failed to save diagnostic test.");
    } finally {
      setSavingDiag(false);
    }
  };

  const handleToggleDiagnostic = async (testName: string, currentAvailable: boolean) => {
    if (!effectiveFacilityId) return;
    try {
      await facilitiesApi.upsertDiagnostic(effectiveFacilityId, {
        testName,
        isAvailable: !currentAvailable,
      });
      await loadFacilityData(effectiveFacilityId);
    } catch (err: any) {
      alert(err.message || "Failed to update diagnostic test.");
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* ─── FACILITY OVERVIEW TAB ───────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Header Banner */}
          <div className="rounded-3xl bg-linear-to-br from-[#0E4A43] via-[#093530] to-[#041c19] p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-[#E5F973]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#E5F973] text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-[#E5F973] animate-pulse" />
                  Facility Administrative Node &bull; Live Hospital System
                </div>
                <h1 className="text-2xl sm:text-3xl font-black">{facility?.name || "Healthcare Facility Console"}</h1>
                <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
                  {facility?.type || "PHC"} &bull; {facility?.district || "Maharashtra"} &bull; Administrator: <strong className="text-white">{user.fullName}</strong>
                </p>
                <div className="text-xs text-slate-300">
                  Address: <strong className="text-white">{facility?.address || "Government Health Center"}</strong>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => setTab("beds")}
                  className="px-5 py-3 rounded-2xl bg-[#E5F973] text-[#0E4A43] font-black text-xs hover:brightness-105 active:scale-95 transition-all shadow-md"
                >
                  Manage Live Beds
                </button>
                <Link
                  href={`/facilities/${effectiveFacilityId}`}
                  className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition-all"
                >
                  Public View
                </Link>
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
                🛏️
              </div>
              <div className="text-2xl font-black text-slate-900">{availableBeds} / {totalBeds}</div>
              <div className="text-xs font-bold text-slate-500">Available Inpatient Beds</div>
            </div>
            <div
              onClick={() => setTab("pharmacy")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                💊
              </div>
              <div className="text-2xl font-black text-slate-900">{medicines.length}</div>
              <div className="text-xs font-bold text-slate-500">Cataloged Medicines</div>
            </div>
            <div
              onClick={() => setTab("diagnostics")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                🧪
              </div>
              <div className="text-2xl font-black text-slate-900">{diagnostics.length}</div>
              <div className="text-xs font-bold text-slate-500">Lab Diagnostic Tests</div>
            </div>
            <div
              onClick={() => setTab("staff_roster")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                🩺
              </div>
              <div className="text-2xl font-black text-slate-900">{dutyRoster.length}</div>
              <div className="text-xs font-bold text-slate-500">Doctors on Roster</div>
            </div>
          </div>

          {/* Quick Bed Status Snapshot */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">Bed Vacancy Snapshot</h2>
              <button onClick={() => setTab("beds")} className="text-xs font-bold text-[#0E4A43] hover:underline">
                Update Capacities &rarr;
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-[#EFF2F5] rounded-2xl">
                <div className="text-slate-400 font-bold uppercase text-[10px]">General Ward Beds</div>
                <div className="text-xl font-black text-slate-900 mt-1">{availableBeds} Available <span className="text-xs text-slate-500 font-normal">of {totalBeds}</span></div>
              </div>
              <div className="p-4 bg-[#EFF2F5] rounded-2xl">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Oxygen Supported Beds</div>
                <div className="text-xl font-black text-emerald-800 mt-1">{oxygenBedsAvailable} Available <span className="text-xs text-slate-500 font-normal">of {oxygenBedsTotal}</span></div>
              </div>
              <div className="p-4 bg-[#EFF2F5] rounded-2xl">
                <div className="text-slate-400 font-bold uppercase text-[10px]">ICU / Ventilator Units</div>
                <div className="text-xl font-black text-purple-800 mt-1">{icuBedsAvailable} Available <span className="text-xs text-slate-500 font-normal">of {icuBedsTotal}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── LIVE BED AVAILABILITY TAB ───────────────────────────────────────── */}
      {activeTab === "beds" && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Live Hospital Bed Matrix Manager</h2>
            <p className="text-xs text-slate-500">Changes update instantly across the Maharashtra Public Healthcare Directory</p>
          </div>

          {bedMsg && (
            <div className={`p-4 rounded-2xl text-xs font-bold ${
              bedMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {bedMsg.text}
            </div>
          )}

          <form onSubmit={handleSaveBeds} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* General Beds */}
              <div className="p-5 bg-[#EFF2F5] rounded-2xl space-y-3">
                <h3 className="font-black text-slate-900 text-sm">General Inpatient Beds</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Total Capacity</label>
                    <input
                      type="number"
                      value={totalBeds}
                      onChange={(e) => setTotalBeds(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Currently Vacant</label>
                    <input
                      type="number"
                      value={availableBeds}
                      onChange={(e) => setAvailableBeds(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Oxygen Beds */}
              <div className="p-5 bg-[#EFF2F5] rounded-2xl space-y-3">
                <h3 className="font-black text-slate-900 text-sm">Oxygen-Supported Beds</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Total Capacity</label>
                    <input
                      type="number"
                      value={oxygenBedsTotal}
                      onChange={(e) => setOxygenBedsTotal(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Currently Vacant</label>
                    <input
                      type="number"
                      value={oxygenBedsAvailable}
                      onChange={(e) => setOxygenBedsAvailable(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* ICU Beds */}
              <div className="p-5 bg-[#EFF2F5] rounded-2xl space-y-3 sm:col-span-2">
                <h3 className="font-black text-slate-900 text-sm">ICU &amp; Ventilator Units</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Total ICU Units</label>
                    <input
                      type="number"
                      value={icuBedsTotal}
                      onChange={(e) => setIcuBedsTotal(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Available ICU Units</label>
                    <input
                      type="number"
                      value={icuBedsAvailable}
                      onChange={(e) => setIcuBedsAvailable(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingBeds}
                className="px-6 py-3 rounded-2xl bg-[#0E4A43] text-white font-black text-xs hover:brightness-110 disabled:opacity-50 transition-all shadow-md"
              >
                {savingBeds ? "Broadcasting to State..." : "Broadcast Bed Status Updates"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── PHARMACY & MEDICINES TAB ────────────────────────────────────────── */}
      {activeTab === "pharmacy" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Facility Pharmacy &amp; Essential Drugs Inventory</h2>
              <p className="text-xs text-slate-500">Live medicine stocks queried during doctor prescription issuance</p>
            </div>
            <button
              onClick={() => setShowMedModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#0E4A43] text-white font-bold text-xs hover:brightness-110 shadow-xs"
            >
              + Restock / Add Medicine
            </button>
          </div>

          {medicines.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-2">
              <div className="text-2xl">💊</div>
              <div className="font-bold text-slate-900 text-base">No Medicines in Inventory</div>
              <p className="text-xs text-slate-500">Click Restock / Add Medicine to log facility pharmacy items.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="divide-y divide-slate-100">
                {medicines.map((med) => (
                  <div key={med.id || med.medicineName} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900">{med.medicineName}</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                          {med.category || "General"}
                        </span>
                      </div>
                      <div className="text-slate-500">
                        Stock: <strong className="text-slate-900">{med.quantity} {med.unit}</strong> &bull; Reorder Alert at &lt;{med.stockThreshold}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase self-start sm:self-center ${
                      med.quantity <= med.stockThreshold
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {med.quantity <= med.stockThreshold ? "Low Stock Warning" : "Adequate Stock"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Medicine Modal */}
          {showMedModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-lg text-slate-900">Add / Restock Medicine</h3>
                  <button
                    onClick={() => setShowMedModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddMedicine} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Medicine &amp; Strength Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Paracetamol 500mg"
                      value={medName}
                      onChange={(e) => setMedName(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Category</label>
                      <input
                        type="text"
                        placeholder="e.g. Antibiotic"
                        value={medCategory}
                        onChange={(e) => setMedCategory(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={medQty}
                        onChange={(e) => setMedQty(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Unit</label>
                      <select
                        value={medUnit}
                        onChange={(e) => setMedUnit(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold bg-white text-xs"
                      >
                        <option value="tablets">tablets</option>
                        <option value="strips">strips</option>
                        <option value="capsules">capsules</option>
                        <option value="bottles">bottles</option>
                        <option value="vials">vials</option>
                        <option value="packets">packets</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Alert Threshold</label>
                      <input
                        type="number"
                        value={medThreshold}
                        onChange={(e) => setMedThreshold(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowMedModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingMed}
                      className="px-6 py-2 rounded-xl bg-[#0E4A43] text-white font-bold hover:brightness-110 disabled:opacity-50 shadow-md"
                    >
                      {savingMed ? "Saving..." : "Save Medicine Stock"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── DIAGNOSTIC TESTS TAB ────────────────────────────────────────────── */}
      {activeTab === "diagnostics" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Diagnostic Tests &amp; Laboratory Catalog</h2>
              <p className="text-xs text-slate-500">Configure pathology, radiology, and biochemistry test availability</p>
            </div>
            <button
              onClick={() => setShowDiagModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#0E4A43] text-white font-bold text-xs hover:brightness-110 shadow-xs"
            >
              + Add Diagnostic Test
            </button>
          </div>

          {diagnostics.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-2">
              <div className="text-2xl">🧪</div>
              <div className="font-bold text-slate-900 text-base">No Diagnostic Tests Listed</div>
              <p className="text-xs text-slate-500">Click Add Diagnostic Test to offer pathology or radiology services.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {diagnostics.map((diag) => (
                <div key={diag.id || diag.testName} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-base text-slate-900">{diag.testName}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      diag.isAvailable ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                    }`}>
                      {diag.isAvailable ? "Available" : "Offline"}
                    </span>
                  </div>
                  <div className="p-3 bg-[#EFF2F5] rounded-xl flex items-center justify-between">
                    <div>Category: <strong className="text-slate-900">{diag.category || "General"}</strong></div>
                    <div>TAT: <strong className="text-slate-900">{diag.turnaroundHours}h</strong></div>
                    <div>Cost: <strong className="text-emerald-800">{diag.costInr === 0 ? "FREE" : `₹${diag.costInr}`}</strong></div>
                  </div>
                  <button
                    onClick={() => handleToggleDiagnostic(diag.testName, diag.isAvailable)}
                    className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-800 transition-colors"
                  >
                    {diag.isAvailable ? "Mark Test Offline" : "Enable Test for OPD"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Diagnostic Modal */}
          {showDiagModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-lg text-slate-900">Add Diagnostic Test</h3>
                  <button
                    onClick={() => setShowDiagModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddDiagnostic} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Test Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Complete Blood Count (CBC)"
                      value={diagTestName}
                      onChange={(e) => setDiagTestName(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Category</label>
                      <select
                        value={diagCategory}
                        onChange={(e) => setDiagCategory(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold bg-white text-xs"
                      >
                        <option value="Pathology">Pathology</option>
                        <option value="Radiology">Radiology</option>
                        <option value="Biochemistry">Biochemistry</option>
                        <option value="Microbiology">Microbiology</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Turnaround (Hours)</label>
                      <input
                        type="number"
                        value={diagTat}
                        onChange={(e) => setDiagTat(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cost (₹ INR, 0 for Free Govt)</label>
                    <input
                      type="number"
                      value={diagCost}
                      onChange={(e) => setDiagCost(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold text-xs"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDiagModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingDiag}
                      className="px-6 py-2 rounded-xl bg-[#0E4A43] text-white font-bold hover:brightness-110 disabled:opacity-50 shadow-md"
                    >
                      {savingDiag ? "Saving..." : "Save Test Catalog"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── DOCTOR DUTY ROSTER TAB ──────────────────────────────────────────── */}
      {activeTab === "staff_roster" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">Medical Officer &amp; Doctor Duty Roster</h2>
            <p className="text-xs text-slate-500">Live doctor availability for OPD tokens and teleconsultations</p>
          </div>

          {dutyRoster.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-2">
              <div className="text-2xl">🩺</div>
              <div className="font-bold text-slate-900 text-base">No Doctors Assigned</div>
              <p className="text-xs text-slate-500">Assigned doctors will appear here with active duty shifts.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="divide-y divide-slate-100">
                {dutyRoster.map((doc) => (
                  <div key={doc.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <h3 className="font-black text-sm text-slate-900">{doc.name}</h3>
                      <p className="text-slate-500">{doc.specialty} &bull; {doc.shift}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase">
                        {doc.status}
                      </span>
                      <span className="text-slate-400 font-bold">{doc.tokens} Daily OPD Quota</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── FACILITY DETAILS TAB ────────────────────────────────────────────── */}
      {activeTab === "facility_details" && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Facility Master Details</h2>
            <p className="text-xs text-slate-500">Government registry identifiers and geographical coordination</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-[#EFF2F5] rounded-2xl space-y-1">
              <div className="text-slate-400 uppercase text-[10px] font-bold">Facility Official Name</div>
              <div className="font-black text-slate-900 text-sm">{facility?.name || "Facility"}</div>
            </div>
            <div className="p-4 bg-[#EFF2F5] rounded-2xl space-y-1">
              <div className="text-slate-400 uppercase text-[10px] font-bold">Facility Type</div>
              <div className="font-black text-slate-900 text-sm">{facility?.type || "PHC"}</div>
            </div>
            <div className="p-4 bg-[#EFF2F5] rounded-2xl space-y-1">
              <div className="text-slate-400 uppercase text-[10px] font-bold">Assigned District</div>
              <div className="font-black text-slate-900 text-sm">{facility?.district || "Maharashtra"}</div>
            </div>
            <div className="p-4 bg-[#EFF2F5] rounded-2xl space-y-1">
              <div className="text-slate-400 uppercase text-[10px] font-bold">Emergency &amp; OPD Timings</div>
              <div className="font-black text-[#0E4A43] text-sm">{facility?.workingHours || "24x7 Emergency"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
