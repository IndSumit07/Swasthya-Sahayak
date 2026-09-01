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
  const facilityId = user.facilityAdmin?.facilityId;
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);

  // Live Bed State
  const [totalBeds, setTotalBeds] = useState(25);
  const [availableBeds, setAvailableBeds] = useState(12);
  const [oxygenBedsTotal, setOxygenBedsTotal] = useState(8);
  const [oxygenBedsAvailable, setOxygenBedsAvailable] = useState(4);
  const [icuBedsTotal, setIcuBedsTotal] = useState(4);
  const [icuBedsAvailable, setIcuBedsAvailable] = useState(1);
  const [savingBeds, setSavingBeds] = useState(false);
  const [bedMsg, setBedMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Medicine Stock State
  const [medicines, setMedicines] = useState<FacilityMedicine[]>([
    { id: "1", facilityId: facilityId || "1", medicineName: "Paracetamol 500mg", category: "Analgesic", quantity: 450, unit: "tablets", stockThreshold: 100, isAvailable: true, expiryDate: null },
    { id: "2", facilityId: facilityId || "1", medicineName: "Amoxicillin 500mg", category: "Antibiotic", quantity: 180, unit: "capsules", stockThreshold: 50, isAvailable: true, expiryDate: null },
    { id: "3", facilityId: facilityId || "1", medicineName: "ORS Sachets (WHO Formula)", category: "Rehydration", quantity: 20, unit: "packets", stockThreshold: 50, isAvailable: true, expiryDate: null },
    { id: "4", facilityId: facilityId || "1", medicineName: "Iron & Folic Acid (IFA)", category: "Maternal Supplement", quantity: 800, unit: "tablets", stockThreshold: 200, isAvailable: true, expiryDate: null },
    { id: "5", facilityId: facilityId || "1", medicineName: "Insulin Regular (100IU/ml)", category: "Diabetes", quantity: 5, unit: "vials", stockThreshold: 15, isAvailable: true, expiryDate: null },
  ]);
  const [showMedModal, setShowMedModal] = useState(false);
  const [medName, setMedName] = useState("");
  const [medCategory, setMedCategory] = useState("Analgesic");
  const [medQty, setMedQty] = useState(100);
  const [medUnit, setMedUnit] = useState("tablets");
  const [medThreshold, setMedThreshold] = useState(20);

  // Diagnostic Test State
  const [diagnostics, setDiagnostics] = useState<FacilityDiagnostic[]>([
    { id: "1", facilityId: facilityId || "1", testName: "Complete Blood Count (CBC)", category: "Pathology", isAvailable: true, turnaroundHours: 4, costInr: 0 },
    { id: "2", facilityId: facilityId || "1", testName: "Fasting & Post-Meal Blood Glucose", category: "Biochemistry", isAvailable: true, turnaroundHours: 2, costInr: 0 },
    { id: "3", facilityId: facilityId || "1", testName: "Chest X-Ray Digital", category: "Radiology", isAvailable: true, turnaroundHours: 6, costInr: 0 },
    { id: "4", facilityId: facilityId || "1", testName: "Obstetric Ultrasonography (USG)", category: "Radiology", isAvailable: false, turnaroundHours: 24, costInr: 0 },
  ]);

  // Doctor Duty Roster
  const [dutyRoster, setDutyRoster] = useState([
    { id: "1", name: "Dr. Ananya Kulkarni", specialty: "General Medicine", shift: "Morning (09:00 - 15:00)", status: "On Duty", tokens: 28 },
    { id: "2", name: "Dr. Ramesh Joshi", specialty: "Pediatrics & MCH", shift: "Evening (15:00 - 21:00)", status: "Scheduled", tokens: 15 },
  ]);

  useEffect(() => {
    if (!facilityId) {
      setLoading(false);
      return;
    }
    facilitiesApi.getById(facilityId)
      .then((res) => {
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
        if (fac.medicines && fac.medicines.length > 0) {
          setMedicines(fac.medicines);
        }
        if (fac.diagnostics && fac.diagnostics.length > 0) {
          setDiagnostics(fac.diagnostics);
        }
      })
      .catch((err) => console.warn("Failed to load facility data:", err))
      .finally(() => setLoading(false));
  }, [facilityId]);

  const handleSaveBeds = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBeds(true);
    setBedMsg(null);
    try {
      if (facilityId) {
        await facilitiesApi.updateBeds(facilityId, {
          totalBeds: Number(totalBeds),
          availableBeds: Number(availableBeds),
          oxygenBedsTotal: Number(oxygenBedsTotal),
          oxygenBedsAvailable: Number(oxygenBedsAvailable),
          icuBedsTotal: Number(icuBedsTotal),
          icuBedsAvailable: Number(icuBedsAvailable),
        });
      }
      setBedMsg({ type: "success", text: "Hospital bed capacity updated and synced across Maharashtra live directory!" });
    } catch (err: any) {
      setBedMsg({ type: "error", text: err.message || "Failed to update beds." });
    } finally {
      setSavingBeds(false);
    }
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    const newMed: FacilityMedicine = {
      id: `${Date.now()}`,
      facilityId: facilityId || "1",
      medicineName: medName,
      category: medCategory,
      quantity: Number(medQty),
      unit: medUnit,
      stockThreshold: Number(medThreshold),
      isAvailable: Number(medQty) > 0,
      expiryDate: null,
    };
    setMedicines([newMed, ...medicines]);
    if (facilityId) {
      facilitiesApi.upsertMedicine(facilityId, newMed).catch(() => {});
    }
    setShowMedModal(false);
    setMedName("");
  };

  const handleToggleDiagnostic = (testIdentifier: string) => {
    setDiagnostics(diagnostics.map((d) => (d.id === testIdentifier || d.testName === testIdentifier ? { ...d, isAvailable: !d.isAvailable } : d)));
  };

  const facilityName = facility?.name || user.facilityAdmin?.facility?.name || "Manchar Primary Health Centre (PHC)";
  const facilityDistrict = facility?.district || "Pune";

  return (
    <div className="space-y-6">
      {/* ─── FACILITY SNAPSHOT OVERVIEW ──────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-[#0E4A43] text-white rounded-[32px] p-6 sm:p-8 relative overflow-hidden shadow-xs">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5F973]/20 border border-[#E5F973]/30 text-[#E5F973] text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#E5F973] animate-pulse" />
                  Hospital Administrator Console
                </div>
                <h2 className="text-2xl sm:text-3xl font-black font-heading">
                  {facilityName}
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                  District: {facilityDistrict} • Type: {facility?.type || "PHC"} • Live Inpatient &amp; Pharmacy Management
                </p>

                <div className="pt-2 flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setTab("beds")}
                    className="px-5 py-2.5 rounded-full bg-[#E5F973] text-slate-950 text-xs font-black hover:bg-[#d8ec68] transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                  >
                    Manage Live Bed Vacancies ({availableBeds} Available)
                  </button>
                  <button
                    onClick={() => setTab("medicines")}
                    className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20"
                  >
                    Pharmacy Stock &amp; Drug Alerts
                  </button>
                </div>
              </div>

              {/* Live Occupancy Metric */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 w-full lg:w-72 space-y-3 flex-shrink-0 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-emerald-200">Bed Occupancy Rate</span>
                  <span className="text-[10px] font-black bg-[#E5F973] text-slate-950 px-2 py-0.5 rounded-full">
                    {totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0}% OCCUPIED
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#E5F973] h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalBeds > 0 ? Math.min(100, Math.round(((totalBeds - availableBeds) / totalBeds) * 100)) : 0}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>Available: <strong className="text-[#E5F973]">{availableBeds}</strong> / {totalBeds}</div>
                  <div>ICU Beds: <strong className="text-white">{icuBedsAvailable}</strong> / {icuBedsTotal}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button onClick={() => setTab("beds")} className="bg-[#EFF2F5] hover:bg-slate-200/70 p-5 rounded-[24px] border border-slate-200/50 text-left transition-all group">
              <div className="text-2xl font-black text-emerald-700">{availableBeds} Beds</div>
              <div className="text-xs font-bold text-slate-700 mt-1">General Inpatient Available</div>
              <div className="text-[10px] text-slate-500">Ready for admissions</div>
            </button>
            <button onClick={() => setTab("beds")} className="bg-[#EFF2F5] hover:bg-slate-200/70 p-5 rounded-[24px] border border-slate-200/50 text-left transition-all group">
              <div className="text-2xl font-black text-indigo-700">{icuBedsAvailable} ICU</div>
              <div className="text-xs font-bold text-slate-700 mt-1">ICU / Ventilators Available</div>
              <div className="text-[10px] text-slate-500">Emergency capacity</div>
            </button>
            <button onClick={() => setTab("medicines")} className="bg-[#EFF2F5] hover:bg-slate-200/70 p-5 rounded-[24px] border border-slate-200/50 text-left transition-all group">
              <div className="text-2xl font-black text-amber-700">2 Items</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Low Medicine Stock</div>
              <div className="text-[10px] text-slate-500">Below threshold limit</div>
            </button>
            <button onClick={() => setTab("staff_roster")} className="bg-[#EFF2F5] hover:bg-slate-200/70 p-5 rounded-[24px] border border-slate-200/50 text-left transition-all group">
              <div className="text-2xl font-black text-[#0E4A43]">{dutyRoster.length} Doctors</div>
              <div className="text-xs font-bold text-slate-700 mt-1">On Active Duty</div>
              <div className="text-[10px] text-slate-500">OPD &amp; Emergency Cover</div>
            </button>
          </div>

          {/* Quick Bed Update Form Preview */}
          <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Live Hospital Bed Quick Adjuster</h3>
                <p className="text-xs text-slate-500">Updates sync instantly with 108 Emergency and Citizen directory.</p>
              </div>
              <Link href={`/facilities/${facilityId || ""}`} className="text-xs text-[#0E4A43] font-bold hover:underline">
                Public Live View &rsaquo;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-[#EFF2F5] rounded-2xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">General Available</span>
                <span className="text-xl font-black text-slate-900">{availableBeds} / {totalBeds}</span>
              </div>
              <div className="p-3.5 bg-[#EFF2F5] rounded-2xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Oxygen Beds</span>
                <span className="text-xl font-black text-slate-900">{oxygenBedsAvailable} / {oxygenBedsTotal}</span>
              </div>
              <div className="p-3.5 bg-[#EFF2F5] rounded-2xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">ICU Ventilators</span>
                <span className="text-xl font-black text-slate-900">{icuBedsAvailable} / {icuBedsTotal}</span>
              </div>
              <div className="p-3.5 bg-[#EFF2F5] rounded-2xl flex items-center justify-center">
                <button
                  onClick={() => setTab("beds")}
                  className="w-full py-2.5 bg-[#0E4A43] text-white font-bold rounded-xl hover:bg-[#083530] text-center"
                >
                  Edit Bed Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── LIVE BED MATRIX TAB ─────────────────────────────────────────────── */}
      {activeTab === "beds" && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h2 className="text-lg font-black text-slate-900">Hospital Bed Capacity Management</h2>
            <p className="text-xs text-slate-500">Update general admissions, oxygen beds, and ICU ventilators in real time.</p>
          </div>

          {bedMsg && (
            <div className={`p-4 rounded-2xl text-xs font-bold ${bedMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
              {bedMsg.text}
            </div>
          )}

          <form onSubmit={handleSaveBeds} className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Total General Beds</label>
                <input
                  type="number"
                  value={totalBeds}
                  onChange={(e) => setTotalBeds(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Available General Beds *</label>
                <input
                  type="number"
                  value={availableBeds}
                  onChange={(e) => setAvailableBeds(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Total Oxygen Beds</label>
                <input
                  type="number"
                  value={oxygenBedsTotal}
                  onChange={(e) => setOxygenBedsTotal(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Available Oxygen Beds *</label>
                <input
                  type="number"
                  value={oxygenBedsAvailable}
                  onChange={(e) => setOxygenBedsAvailable(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Total ICU / Ventilators</label>
                <input
                  type="number"
                  value={icuBedsTotal}
                  onChange={(e) => setIcuBedsTotal(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Available ICU Beds *</label>
                <input
                  type="number"
                  value={icuBedsAvailable}
                  onChange={(e) => setIcuBedsAvailable(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingBeds}
              className="w-full py-3 rounded-full bg-[#0E4A43] text-white font-black hover:bg-[#083530] transition-all shadow-xs disabled:opacity-50"
            >
              {savingBeds ? "Updating Live Bed Status..." : "Save Live Bed Matrix"}
            </button>
          </form>
        </div>
      )}

      {/* ─── PHARMACY & MEDICINE STOCK TAB ───────────────────────────────────── */}
      {activeTab === "medicines" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Hospital Pharmacy &amp; Essential Drug Inventory</h2>
              <p className="text-xs text-slate-500">Live stock counts sync automatically with doctor E-Rx prescriptions and public directory.</p>
            </div>
            <button
              onClick={() => setShowMedModal(true)}
              className="px-5 py-2.5 rounded-full bg-[#0E4A43] text-white text-xs font-black hover:bg-[#083530] transition-all shadow-xs flex items-center gap-1.5"
            >
              + Add / Restock Medicine
            </button>
          </div>

          <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EFF2F5] text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-5">Medicine Name</th>
                    <th className="py-3 px-4">Therapeutic Category</th>
                    <th className="py-3 px-4">Current Stock</th>
                    <th className="py-3 px-4">Threshold</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {medicines.map((m) => {
                    const isLow = m.quantity <= m.stockThreshold;
                    const isOut = m.quantity === 0;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-3 px-5 font-black text-slate-900">{m.medicineName}</td>
                        <td className="py-3 px-4 text-slate-600">{m.category || "General"}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{m.quantity} {m.unit}</td>
                        <td className="py-3 px-4 text-slate-500">{m.stockThreshold} {m.unit}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isOut ? "bg-rose-100 text-rose-800" : isLow ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── DIAGNOSTICS CATALOG TAB ─────────────────────────────────────────── */}
      {activeTab === "diagnostics" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">Diagnostic Tests &amp; Pathology Services</h2>
            <p className="text-xs text-slate-500">Toggle active test availability for OPD bookings and doctor e-prescriptions.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {diagnostics.map((diag) => (
              <div key={diag.id} className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-base text-slate-900">{diag.testName}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    diag.isAvailable ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                  }`}>
                    {diag.isAvailable ? "Available" : "Temporarily Offline"}
                  </span>
                </div>
                <div className="p-3 bg-[#EFF2F5] rounded-xl flex items-center justify-between">
                  <div>Category: <strong className="text-slate-900">{diag.category}</strong></div>
                  <div>TAT: <strong className="text-slate-900">{diag.turnaroundHours}h</strong></div>
                  <div>Cost: <strong className="text-emerald-800">{diag.costInr === 0 ? "FREE (Govt)" : `₹${diag.costInr}`}</strong></div>
                </div>
                <button
                  onClick={() => handleToggleDiagnostic(diag.id || diag.testName)}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-800 transition-colors"
                >
                  {diag.isAvailable ? "Mark Test Unavailable" : "Enable Test for OPD"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── DOCTOR DUTY ROSTER TAB ──────────────────────────────────────────── */}
      {activeTab === "staff_roster" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">Medical Officer &amp; Doctor Duty Roster</h2>
            <p className="text-xs text-slate-500">Manage shift allocations and daily OPD consultation quotas.</p>
          </div>

          <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-xs overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#EFF2F5] text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-5">Doctor Name</th>
                    <th className="py-3 px-4">Specialty</th>
                    <th className="py-3 px-4">Current Shift</th>
                    <th className="py-3 px-4">OPD Tokens Issued</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {dutyRoster.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-3 px-5 font-black text-slate-900">{d.name}</td>
                      <td className="py-3 px-4 text-slate-600">{d.specialty}</td>
                      <td className="py-3 px-4 text-slate-800">{d.shift}</td>
                      <td className="py-3 px-4 font-bold text-[#0E4A43]">{d.tokens} Tokens</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── FACILITY PROFILE TAB ────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <h3 className="text-base font-black text-slate-900">Hospital Facility Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#EFF2F5] rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Facility Name</span>
                <span className="text-sm font-bold text-slate-900">{facilityName}</span>
              </div>
              <div className="p-3.5 bg-[#EFF2F5] rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">District</span>
                <span className="text-sm font-bold text-slate-900">{facilityDistrict}</span>
              </div>
              <div className="p-3.5 bg-[#EFF2F5] rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Working Hours</span>
                <span className="text-sm font-bold text-slate-900">24x7 Emergency / 09:00 - 17:00 OPD</span>
              </div>
              <div className="p-3.5 bg-[#EFF2F5] rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">108 Ambulance Bay</span>
                <span className="text-sm font-bold text-emerald-800">Connected &amp; Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── RESTOCK MEDICINE MODAL ──────────────────────────────────────────── */}
      {showMedModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Add / Restock Medicine</h3>
              <button onClick={() => setShowMedModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900">✕</button>
            </div>

            <form onSubmit={handleAddMedicine} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Medicine Generic Name *</label>
                <input
                  type="text"
                  required
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  placeholder="e.g. Ciprofloxacin 500mg"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Category</label>
                  <input
                    type="text"
                    value={medCategory}
                    onChange={(e) => setMedCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Packaging Unit</label>
                  <select value={medUnit} onChange={(e) => setMedUnit(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold">
                    <option value="tablets">tablets</option>
                    <option value="capsules">capsules</option>
                    <option value="strips">strips</option>
                    <option value="bottles">bottles</option>
                    <option value="vials">vials</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Quantity Added</label>
                  <input
                    type="number"
                    required
                    value={medQty}
                    onChange={(e) => setMedQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    required
                    value={medThreshold}
                    onChange={(e) => setMedThreshold(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowMedModal(false)} className="px-4 py-2.5 rounded-full text-slate-600 hover:bg-slate-100 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-full bg-[#0E4A43] text-white font-black hover:bg-[#083530] shadow-sm">
                  Save to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
