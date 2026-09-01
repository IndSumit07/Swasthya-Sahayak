"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  type UserProfile,
  type TriageAssessment,
  type MchRecord,
  type Facility,
  triageApi,
  mchApi,
  facilitiesApi,
} from "@/lib/api";

interface HealthWorkerDashboardProps {
  user: UserProfile;
  activeTab: string;
  setTab: (t: string) => void;
}

export function HealthWorkerDashboard({ user, activeTab, setTab }: HealthWorkerDashboardProps) {
  const worker = user.healthWorker;

  // Live Database States
  const [triageRecords, setTriageRecords] = useState<TriageAssessment[]>([]);
  const [mchList, setMchList] = useState<MchRecord[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  // Doorstep Triage Form State
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState<"MALE" | "FEMALE" | "OTHER">("FEMALE");
  const [bpSystolic, setBpSystolic] = useState("");
  const [bpDiastolic, setBpDiastolic] = useState("");
  const [spo2, setSpo2] = useState("");
  const [temp, setTemp] = useState("");
  const [pulse, setPulse] = useState("");
  const [isPregnant, setIsPregnant] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [triageSubmitting, setTriageSubmitting] = useState(false);
  const [triageOutput, setTriageOutput] = useState<{ priority: string; advice: string } | null>(null);

  // MCH Add Modal State
  const [showAddMchModal, setShowAddMchModal] = useState(false);
  const [mchMotherName, setMchMotherName] = useState("");
  const [mchAge, setMchAge] = useState("");
  const [mchVillage, setMchVillage] = useState(worker?.villageArea || "Ambegaon");
  const [mchEdd, setMchEdd] = useState("");
  const [mchTrimester, setMchTrimester] = useState("1st Trimester");
  const [mchRiskLevel, setMchRiskLevel] = useState<"NORMAL" | "HIGH_RISK">("NORMAL");
  const [mchAncCount, setMchAncCount] = useState(1);
  const [mchHb, setMchHb] = useState("");
  const [mchIfa, setMchIfa] = useState(true);
  const [mchNotes, setMchNotes] = useState("");
  const [mchSubmitting, setMchSubmitting] = useState(false);

  const loadHealthWorkerData = async () => {
    setLoading(true);
    try {
      const [triageRes, mchRes, facRes] = await Promise.allSettled([
        triageApi.list(),
        mchApi.list(),
        facilitiesApi.list(),
      ]);

      if (triageRes.status === "fulfilled" && triageRes.value.success) {
        setTriageRecords(triageRes.value.data);
      }
      if (mchRes.status === "fulfilled" && mchRes.value.success) {
        setMchList(mchRes.value.data);
      }
      if (facRes.status === "fulfilled" && facRes.value.success) {
        setFacilities(facRes.value.data.facilities);
      }
    } catch (err) {
      console.error("Failed to load health worker data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealthWorkerData();
  }, [worker?.id]);

  const handleRunTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;
    setTriageSubmitting(true);
    try {
      const res = await triageApi.create({
        patientName,
        patientAge: patientAge ? Number(patientAge) : undefined,
        patientGender,
        village: worker?.villageArea || "Village",
        facilityId: worker?.facilityId || worker?.facility?.id || undefined,
        bpSystolic: bpSystolic ? Number(bpSystolic) : undefined,
        bpDiastolic: bpDiastolic ? Number(bpDiastolic) : undefined,
        spo2: spo2 ? Number(spo2) : undefined,
        temperature: temp ? Number(temp) : undefined,
        pulse: pulse ? Number(pulse) : undefined,
        symptoms: selectedSymptoms,
        isPregnant,
        notes,
      });

      setTriageOutput({
        priority: res.data.priority,
        advice: res.data.actionTaken || "Vitals recorded and synced with PHC database.",
      });

      await loadHealthWorkerData();
      setTimeout(() => {
        setPatientName("");
        setPatientAge("");
        setBpSystolic("");
        setBpDiastolic("");
        setSpo2("");
        setTemp("");
        setPulse("");
        setIsPregnant(false);
        setSelectedSymptoms([]);
        setNotes("");
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Failed to submit triage assessment.");
    } finally {
      setTriageSubmitting(false);
    }
  };

  const handleCreateMch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mchMotherName.trim()) return;
    setMchSubmitting(true);
    try {
      await mchApi.create({
        healthWorkerId: worker?.id || undefined,
        facilityId: worker?.facilityId || worker?.facility?.id || undefined,
        motherName: mchMotherName,
        age: mchAge ? Number(mchAge) : undefined,
        village: mchVillage,
        edd: mchEdd || undefined,
        trimester: mchTrimester,
        riskLevel: mchRiskLevel,
        ancCount: Number(mchAncCount),
        hemoglobin: mchHb ? Number(mchHb) : undefined,
        ifaDelivered: mchIfa,
        notes: mchNotes,
      });

      await loadHealthWorkerData();
      setShowAddMchModal(false);
      setMchMotherName("");
      setMchAge("");
      setMchEdd("");
      setMchHb("");
      setMchNotes("");
    } catch (err: any) {
      alert(err.message || "Failed to save MCH record.");
    } finally {
      setMchSubmitting(false);
    }
  };

  const handleDeleteTriage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this triage log?")) return;
    try {
      await triageApi.delete(id);
      await loadHealthWorkerData();
    } catch (err: any) {
      alert(err.message || "Failed to delete triage log.");
    }
  };

  const handleDeleteMch = async (id: string) => {
    if (!confirm("Are you sure you want to delete this MCH record?")) return;
    try {
      await mchApi.delete(id);
      await loadHealthWorkerData();
    } catch (err: any) {
      alert(err.message || "Failed to delete MCH record.");
    }
  };

  const toggleSymptom = (s: string) => {
    if (selectedSymptoms.includes(s)) {
      setSelectedSymptoms(selectedSymptoms.filter((item) => item !== s));
    } else {
      setSelectedSymptoms([...selectedSymptoms, s]);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* ─── FRONTLINE OVERVIEW TAB ──────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Header Banner */}
          <div className="rounded-3xl bg-linear-to-br from-[#0E4A43] via-[#093530] to-[#041c19] p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-[#E5F973]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#E5F973] text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-[#E5F973] animate-pulse" />
                  National Health Mission (NHM) &bull; Frontline Health Worker Desk
                </div>
                <h1 className="text-2xl sm:text-3xl font-black">{user.fullName}</h1>
                <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
                  {worker?.workerType || "ASHA Worker"} • Village Jurisdiction: <strong className="text-white">{worker?.villageArea || "Rural Sub-Centre"}</strong>
                </p>
                <div className="text-xs text-slate-300">
                  Affiliated PHC: <strong className="text-white">{worker?.facility?.name || "Primary Health Centre"}</strong>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => setTab("triage")}
                  className="px-5 py-3 rounded-2xl bg-[#E5F973] text-[#0E4A43] font-black text-xs hover:brightness-105 active:scale-95 transition-all shadow-md flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  New Doorstep Triage
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div
              onClick={() => setTab("triage")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                🩺
              </div>
              <div className="text-2xl font-black text-slate-900">{triageRecords.length}</div>
              <div className="text-xs font-bold text-slate-500">Triaged Villagers</div>
            </div>
            <div
              onClick={() => setTab("mch")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                🤰
              </div>
              <div className="text-2xl font-black text-slate-900">{mchList.length}</div>
              <div className="text-xs font-bold text-slate-500">MCH / ANC Tracked</div>
            </div>
            <div
              onClick={() => setTab("tele_kiosk")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                📹
              </div>
              <div className="text-2xl font-black text-slate-900">{facilities.length}</div>
              <div className="text-xs font-bold text-slate-500">Network Facilities</div>
            </div>
            <div
              onClick={() => setTab("escalation")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                🚨
              </div>
              <div className="text-2xl font-black text-slate-900">
                {triageRecords.filter((t) => t.priority === "CRITICAL").length}
              </div>
              <div className="text-xs font-bold text-slate-500">108 Emergencies</div>
            </div>
          </div>

          {/* Recent Doorstep Assessments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Recent Village Triage Records</h2>
                <p className="text-xs text-slate-500">Clinical assessments and doorstep triage history</p>
              </div>
              <button onClick={() => setTab("triage")} className="text-xs font-black text-[#0E4A43] hover:underline">
                View All Triage Records
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 text-sm text-slate-500 font-bold">
                Loading triage data from database...
              </div>
            ) : triageRecords.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 space-y-2">
                <div className="text-2xl">🩺</div>
                <div className="font-bold text-slate-900 text-sm">No Triage Records Yet</div>
                <p className="text-xs text-slate-500">Record your first doorstep patient assessment to sync with PHC.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {triageRecords.slice(0, 3).map((trg) => (
                  <div
                    key={trg.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          trg.priority === "CRITICAL"
                            ? "bg-rose-100 text-rose-800"
                            : trg.priority === "MODERATE"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {trg.priority}
                        </span>
                        <span className="text-xs font-bold text-slate-400 font-mono">
                          {new Date(trg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-black text-slate-900 text-sm">{trg.patientName}</h3>
                      <p className="text-xs text-slate-500">
                        Age: {trg.patientAge || "N/A"} &bull; BP: {trg.bpSystolic || "-"}/{trg.bpDiastolic || "-"} &bull; SpO2: {trg.spo2 ? `${trg.spo2}%` : "-"}
                      </p>
                      {trg.actionTaken && <p className="text-xs text-slate-700 font-medium">{trg.actionTaken}</p>}
                    </div>

                    <button
                      onClick={() => handleDeleteTriage(trg.id)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs font-bold self-start sm:self-center"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── DOORSTEP CLINICAL TRIAGE TAB ────────────────────────────────────── */}
      {activeTab === "triage" && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Doorstep Clinical Vitals &amp; Triage Assessment</h2>
            <p className="text-xs text-slate-500">Auto-evaluates clinical urgency and transmits records to Medical Officers</p>
          </div>

          {triageOutput && (
            <div className={`p-4 rounded-2xl border text-xs font-bold space-y-1 ${
              triageOutput.priority === "CRITICAL"
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : triageOutput.priority === "MODERATE"
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}>
              <div className="font-black uppercase tracking-wider">Priority: {triageOutput.priority}</div>
              <div>{triageOutput.advice}</div>
            </div>
          )}

          <form onSubmit={handleRunTriage} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Laxmi Jadhav"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  placeholder="e.g. 32"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold bg-white text-xs"
                >
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {/* Vitals Grid */}
            <div>
              <label className="block font-bold text-slate-700 mb-2">Clinical Vitals</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500">BP Systolic</label>
                  <input
                    type="number"
                    placeholder="120"
                    value={bpSystolic}
                    onChange={(e) => setBpSystolic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500">BP Diastolic</label>
                  <input
                    type="number"
                    placeholder="80"
                    value={bpDiastolic}
                    onChange={(e) => setBpDiastolic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500">SpO2 (%)</label>
                  <input
                    type="number"
                    placeholder="98"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="98.6"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500">Pulse (bpm)</label>
                  <input
                    type="number"
                    placeholder="75"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Red Flags & Symptoms */}
            <div>
              <label className="block font-bold text-slate-700 mb-2">Red Flags &amp; Symptoms</label>
              <div className="flex flex-wrap gap-2">
                {["Severe Chest Pain", "High Fever (>102°F)", "Severe Breathlessness", "Persistent Vomiting", "Abdominal Pain", "Dizziness / Fainting"].map((symp) => (
                  <button
                    key={symp}
                    type="button"
                    onClick={() => toggleSymptom(symp)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                      selectedSymptoms.includes(symp)
                        ? "bg-[#0E4A43] text-white border-[#0E4A43]"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {selectedSymptoms.includes(symp) ? "✓ " : "+ "}{symp}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="preg"
                checked={isPregnant}
                onChange={(e) => setIsPregnant(e.target.checked)}
                className="w-4 h-4 accent-[#0E4A43] rounded"
              />
              <label htmlFor="preg" className="font-bold text-slate-700 cursor-pointer">
                Pregnant Woman (Antenatal Care / High-Risk Pregnancy Assessment)
              </label>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Clinical Observation Notes</label>
              <textarea
                rows={2}
                placeholder="Document any additional observations, medicine allergies, or village conditions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-medium text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={triageSubmitting}
                className="px-6 py-3 rounded-2xl bg-[#0E4A43] text-white font-black text-xs hover:brightness-110 disabled:opacity-50 transition-all shadow-md"
              >
                {triageSubmitting ? "Evaluating & Transmitting..." : "Evaluate & Transmit Triage Record"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MATERNAL & CHILD HEALTH (MCH) TAB ───────────────────────────────── */}
      {activeTab === "mch" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Maternal &amp; Child Health (MCH) Register</h2>
              <p className="text-xs text-slate-500">Antenatal care (ANC), high-risk pregnancy tracking, and IFA supplement delivery</p>
            </div>
            <button
              onClick={() => setShowAddMchModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#0E4A43] text-white font-bold text-xs hover:brightness-110 shadow-xs"
            >
              + Add Pregnant Mother (ANC)
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 text-sm text-slate-500 font-bold">
              Loading MCH records from database...
            </div>
          ) : mchList.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-2">
              <div className="text-2xl">🤰</div>
              <div className="font-bold text-slate-900 text-base">No MCH Records Registered</div>
              <p className="text-xs text-slate-500">Click Add Pregnant Mother to log an antenatal tracking entry.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mchList.map((mch) => (
                <div key={mch.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-base text-slate-900">{mch.motherName}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      mch.riskLevel === "HIGH_RISK" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {mch.riskLevel === "HIGH_RISK" ? "High-Risk Pregnancy" : "Normal Progress"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-[#EFF2F5] rounded-xl text-xs">
                    <div>Age: <strong className="text-slate-900">{mch.age || "N/A"} yrs</strong></div>
                    <div>Village: <strong className="text-slate-900">{mch.village || "Ambegaon"}</strong></div>
                    <div>Trimester: <strong className="text-slate-900">{mch.trimester}</strong></div>
                    <div>EDD: <strong className="text-[#0E4A43]">{mch.edd ? new Date(mch.edd).toLocaleDateString() : "Pending"}</strong></div>
                  </div>

                  <div className="text-xs space-y-1 text-slate-700">
                    <div>ANC Visits Completed: <strong className="text-slate-900">{mch.ancCount} of 4</strong></div>
                    <div>Hemoglobin: <strong className="text-slate-900">{mch.hemoglobin ? `${mch.hemoglobin} g/dL` : "Pending Lab"}</strong></div>
                    <div>IFA Supplements: <strong className="text-slate-900">{mch.ifaDelivered ? "Delivered (100 Tablets)" : "Pending Delivery"}</strong></div>
                    {mch.notes && <div className="pt-1 text-slate-500 italic">{mch.notes}</div>}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleDeleteMch(mch.id)}
                      className="text-xs font-bold text-red-600 hover:underline"
                    >
                      Remove Entry
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add MCH Modal */}
          {showAddMchModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-lg text-slate-900">Add Pregnant Mother (ANC Tracker)</h3>
                  <button
                    onClick={() => setShowAddMchModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateMch} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mother Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rohini Balu More"
                      value={mchMotherName}
                      onChange={(e) => setMchMotherName(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Age</label>
                      <input
                        type="number"
                        placeholder="e.g. 24"
                        value={mchAge}
                        onChange={(e) => setMchAge(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Expected Delivery (EDD)</label>
                      <input
                        type="date"
                        value={mchEdd}
                        onChange={(e) => setMchEdd(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Trimester</label>
                      <select
                        value={mchTrimester}
                        onChange={(e) => setMchTrimester(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold bg-white text-xs"
                      >
                        <option value="1st Trimester">1st Trimester</option>
                        <option value="2nd Trimester">2nd Trimester</option>
                        <option value="3rd Trimester">3rd Trimester</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Risk Classification</label>
                      <select
                        value={mchRiskLevel}
                        onChange={(e) => setMchRiskLevel(e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold bg-white text-xs"
                      >
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH_RISK">High Risk (Pre-eclampsia/Anemia)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ANC Checkups Done</label>
                      <input
                        type="number"
                        min="0"
                        max="4"
                        value={mchAncCount}
                        onChange={(e) => setMchAncCount(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Hemoglobin (g/dL)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 11.5"
                        value={mchHb}
                        onChange={(e) => setMchHb(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="ifaCheck"
                      checked={mchIfa}
                      onChange={(e) => setMchIfa(e.target.checked)}
                      className="w-4 h-4 accent-[#0E4A43] rounded"
                    />
                    <label htmlFor="ifaCheck" className="font-bold text-slate-700 cursor-pointer">
                      Iron &amp; Folic Acid (IFA) 100 Tablets Delivered
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddMchModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={mchSubmitting}
                      className="px-6 py-2 rounded-xl bg-[#0E4A43] text-white font-bold hover:brightness-110 disabled:opacity-50 shadow-md"
                    >
                      {mchSubmitting ? "Saving..." : "Save MCH Record"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── ASSISTED TELE-OPD KIOSK TAB ─────────────────────────────────────── */}
      {activeTab === "tele_kiosk" && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Sub-Centre Assisted Tele-OPD Kiosk</h2>
            <p className="text-xs text-slate-500">Connect rural patients with Medical Officers at CHC/District Hospital via Marathi/Hindi video stream</p>
          </div>

          <div className="p-6 bg-[#EFF2F5] rounded-3xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-black text-slate-900 text-base">Village Kiosk Console &bull; {worker?.villageArea || "Ambegaon"}</span>
                <p className="text-xs text-slate-500">Digital health terminal connected to Maharashtra Health Cloud</p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
                KIOSK ONLINE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/facilities"
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#0E4A43] transition-colors space-y-2 block"
              >
                <div className="text-2xl">🏥</div>
                <div className="font-black text-slate-900 text-sm">Nearby PHC &amp; Bed Registry</div>
                <p className="text-xs text-slate-500">Check live bed vacancies and medicine stock in the district</p>
              </Link>
              <button
                onClick={() => setTab("triage")}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#0E4A43] transition-colors space-y-2 text-left"
              >
                <div className="text-2xl">🩺</div>
                <div className="font-black text-slate-900 text-sm">Log Doorstep Patient Vitals</div>
                <p className="text-xs text-slate-500">Record BP, pulse, SpO2, and trigger emergency escalations</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EMERGENCY 108 ESCALATION TAB ────────────────────────────────────── */}
      {activeTab === "escalation" && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Maharashtra 108 Emergency Ambulance Escalation</h2>
            <p className="text-xs text-slate-500">Direct frontline hotline to government emergency response services</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 space-y-3">
              <div className="text-3xl">🚑</div>
              <h3 className="font-black text-rose-900 text-lg">108 Emergency Ambulance Service</h3>
              <p className="text-xs text-rose-700">
                Toll-free 24x7 emergency medical transfer. Dispatches nearest ALS/BLS ambulance with GPS tracking.
              </p>
              <a
                href="tel:108"
                className="inline-block px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition-colors"
              >
                Call 108 Emergency Now
              </a>
            </div>

            <div className="p-6 rounded-3xl bg-blue-50 border border-blue-200 space-y-3">
              <div className="text-3xl">📞</div>
              <h3 className="font-black text-blue-900 text-lg">104 Health Advice Helpline</h3>
              <p className="text-xs text-blue-700">
                Government telephonic medical advice, suicide prevention, and maternal emergency support in Marathi &amp; Hindi.
              </p>
              <a
                href="tel:104"
                className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition-colors"
              >
                Call 104 Medical Helpline
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ─── WORKER PROFILE TAB ──────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Frontline Health Worker Profile</h2>
            <p className="text-xs text-slate-500">Institutional registration and assigned village sub-centres</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-[#EFF2F5] rounded-2xl space-y-1">
              <div className="text-slate-400 uppercase text-[10px] font-bold">Worker Designation</div>
              <div className="font-black text-slate-900 text-sm">{worker?.workerType || "ASHA Frontline Worker"}</div>
            </div>
            <div className="p-4 bg-[#EFF2F5] rounded-2xl space-y-1">
              <div className="text-slate-400 uppercase text-[10px] font-bold">Village Jurisdiction Area</div>
              <div className="font-black text-slate-900 text-sm">{worker?.villageArea || "Rural Sub-Centre"}</div>
            </div>
            <div className="p-4 bg-[#EFF2F5] rounded-2xl space-y-1">
              <div className="text-slate-400 uppercase text-[10px] font-bold">Affiliated Primary Health Centre</div>
              <div className="font-black text-slate-900 text-sm">{worker?.facility?.name || "PHC Ambegaon"}</div>
            </div>
            <div className="p-4 bg-[#EFF2F5] rounded-2xl space-y-1">
              <div className="text-slate-400 uppercase text-[10px] font-bold">Contact Email / Phone</div>
              <div className="font-black text-[#0E4A43] font-mono text-sm">{user.email} &bull; {user.phone || "Registered"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
