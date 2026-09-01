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
import {
  Stethoscope,
  Baby,
  Video,
  AlertTriangle,
  PhoneCall,
  Check,
  X,
  Building2,
  Users,
  Calendar,
  Activity,
  Clock,
  Plus,
  Trash2,
  User,
  ShieldAlert,
} from "lucide-react";

interface HealthWorkerDashboardProps {
  user: UserProfile;
  activeTab: string;
  setTab: (t: string) => void;
}

export function HealthWorkerDashboard({ user, activeTab, setTab }: HealthWorkerDashboardProps) {
  const worker = user.healthWorker;

  // Live Database States
  const [triageLogs, setTriageLogs] = useState<TriageAssessment[]>([]);
  const [mchRecords, setMchRecords] = useState<MchRecord[]>([]);
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

  // MCH Form State
  const [mchMotherName, setMchMotherName] = useState("");
  const [mchAge, setMchAge] = useState("");
  const [mchVillage, setMchVillage] = useState(worker?.villageArea || "");
  const [mchEdd, setMchEdd] = useState("");
  const [mchTrimester, setMchTrimester] = useState("FIRST");
  const [mchRiskLevel, setMchRiskLevel] = useState<"NORMAL" | "HIGH_RISK">("NORMAL");
  const [mchAncCount, setMchAncCount] = useState(1);
  const [mchHb, setMchHb] = useState("");
  const [mchIfa, setMchIfa] = useState(true);
  const [mchSubmitting, setMchSubmitting] = useState(false);
  const [mchSuccess, setMchSuccess] = useState(false);

  const SYMPTOMS_LIST = [
    "High Fever > 101F",
    "Shortness of Breath",
    "Severe Chest Pain",
    "Persistent Vomiting",
    "High Blood Pressure",
    "Severe Dizziness",
    "Swelling in Feet / Hands",
    "Diarrhea / Dehydration",
  ];

  const loadHealthWorkerData = async () => {
    setLoading(true);
    try {
      const [triRes, mchRes, facRes] = await Promise.allSettled([
        triageApi.list({ assessedById: user.id }),
        mchApi.list({ healthWorkerId: worker?.id }),
        facilitiesApi.list(),
      ]);

      if (triRes.status === "fulfilled" && triRes.value.success) {
        setTriageLogs(triRes.value.data);
      }
      if (mchRes.status === "fulfilled" && mchRes.value.success) {
        setMchRecords(mchRes.value.data);
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
  }, [user.id, worker?.id]);

  const handleToggleSymptom = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const handleDoorstepTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;
    setTriageSubmitting(true);
    setTriageOutput(null);

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
      });

      setMchSuccess(true);
      await loadHealthWorkerData();
      setTimeout(() => {
        setMchSuccess(false);
        setMchMotherName("");
        setMchAge("");
        setMchEdd("");
        setMchHb("");
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Failed to add MCH record.");
    } finally {
      setMchSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ─── FRONTLINE OVERVIEW TAB ─────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#0E4A43] via-[#093530] to-[#041c19] p-8 text-white shadow-xl">
            <div className="absolute right-0 top-0 w-96 h-96 bg-[#E5F973]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#E5F973] text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-[#E5F973] animate-pulse" />
                  ASHA / ANM Frontline Desk &bull; Area: {worker?.villageArea || "Rural Village Cluster"}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black">{user.fullName}</h1>
                <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
                  {worker?.workerType || "Accredited Social Health Activist (ASHA)"} &bull; Attached to {worker?.facility?.name || "Ambegaon PHC"}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => setTab("triage")}
                  className="px-5 py-3 rounded-2xl bg-[#E5F973] text-[#0E4A43] font-black text-xs hover:brightness-105 active:scale-95 transition-all shadow-md flex items-center gap-2"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Start Doorstep Triage</span>
                </button>
                <button
                  onClick={() => setTab("mch")}
                  className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition-all flex items-center gap-2"
                >
                  <Baby className="w-4 h-4" />
                  <span>MCH / ANC Register</span>
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
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <Stethoscope className="w-5 h-5 text-teal-800" />
              </div>
              <div className="text-2xl font-black text-slate-900">{triageLogs.length}</div>
              <div className="text-xs font-bold text-slate-500">Doorstep Triage Logs</div>
            </div>

            <div
              onClick={() => setTab("mch")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <Baby className="w-5 h-5 text-rose-800" />
              </div>
              <div className="text-2xl font-black text-slate-900">{mchRecords.length}</div>
              <div className="text-xs font-bold text-slate-500">MCH / ANC Tracked</div>
            </div>

            <div
              onClick={() => setTab("tele_kiosk")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <Video className="w-5 h-5 text-purple-800" />
              </div>
              <div className="text-2xl font-black text-slate-900">Assisted Kiosk</div>
              <div className="text-xs font-bold text-slate-500">Virtual OPD Connect</div>
            </div>

            <div
              onClick={() => setTab("escalation")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-5 h-5 text-red-800" />
              </div>
              <div className="text-2xl font-black text-slate-900">108 Hotline</div>
              <div className="text-xs font-bold text-slate-500">Emergency Escalation</div>
            </div>
          </div>

          {/* Quick Doorstep Triage History */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">Recent Doorstep Triage Visits</h2>
                <p className="text-xs text-slate-500">Vitals and red flag evaluations recorded during home visits</p>
              </div>
              <button onClick={() => setTab("triage")} className="text-xs font-bold text-[#0E4A43] hover:underline">
                View All Triage Logs &rarr;
              </button>
            </div>

            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400 font-bold">Loading triage logs...</div>
            ) : triageLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-bold bg-slate-50 rounded-2xl">
                No triage assessments recorded yet. Click "Start Doorstep Triage" above.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {triageLogs.slice(0, 4).map((t) => (
                  <div key={t.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-black text-slate-900">{t.patientName}</span>
                      <span className="text-slate-500 ml-2">({t.village || "Village"})</span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        t.priority === "CRITICAL" ? "bg-red-100 text-red-800" : t.priority === "MODERATE" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {t.priority}
                      </span>
                    </div>
                    <span className="text-slate-400 font-mono">{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── DOORSTEP CLINICAL TRIAGE TAB ───────────────────────────────────── */}
      {activeTab === "triage" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Doorstep Clinical Vitals &amp; Triage Evaluator</h2>
            <p className="text-xs text-slate-500">Record BP, SpO2, Temperature, and Pulse. The system automatically classifies urgency and triggers alerts.</p>
          </div>

          {triageOutput && (
            <div className={`p-4 rounded-2xl text-xs font-bold space-y-1 ${
              triageOutput.priority === "CRITICAL"
                ? "bg-red-50 text-red-900 border border-red-200"
                : triageOutput.priority === "MODERATE"
                ? "bg-amber-50 text-amber-900 border border-amber-200"
                : "bg-emerald-50 text-emerald-900 border border-emerald-200"
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black uppercase">Triage Result: {triageOutput.priority}</span>
              </div>
              <p>{triageOutput.advice}</p>
            </div>
          )}

          <form onSubmit={handleDoorstepTriage} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Citizen / Patient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunita Shantaram Patil"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  placeholder="e.g. 34"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                >
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {/* Vitals Grid */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900">Frontline Clinical Vitals</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">BP Systolic</label>
                  <input
                    type="number"
                    placeholder="120"
                    value={bpSystolic}
                    onChange={(e) => setBpSystolic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">BP Diastolic</label>
                  <input
                    type="number"
                    placeholder="80"
                    value={bpDiastolic}
                    onChange={(e) => setBpDiastolic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    placeholder="98"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="98.6"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Pulse (bpm)</label>
                  <input
                    type="number"
                    placeholder="72"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Red Flag Symptoms */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900">Symptoms &amp; Clinical Red Flags</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SYMPTOMS_LIST.map((sym) => {
                  const isChecked = selectedSymptoms.includes(sym);
                  return (
                    <button
                      type="button"
                      key={sym}
                      onClick={() => handleToggleSymptom(sym)}
                      className={`p-2.5 rounded-xl border text-left font-bold text-[11px] transition-all ${
                        isChecked
                          ? "bg-red-50 border-red-300 text-red-800"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {sym}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pregnantCheck"
                checked={isPregnant}
                onChange={(e) => setIsPregnant(e.target.checked)}
                className="w-4 h-4 rounded text-[#0E4A43]"
              />
              <label htmlFor="pregnantCheck" className="font-bold text-slate-800">
                Patient is currently pregnant (Maternal Health Protocol)
              </label>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Clinical Observation Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Mild dehydration noted, advised ORS and PHC consultation."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={triageSubmitting}
                className="px-6 py-3 rounded-2xl bg-[#0E4A43] text-white font-black text-xs hover:brightness-110 disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
              >
                <Stethoscope className="w-4 h-4" />
                <span>{triageSubmitting ? "Evaluating Vitals..." : "Evaluate & Sync Vitals with PHC"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── ASSISTED TELE-OPD KIOSK TAB ─────────────────────────────────────── */}
      {(activeTab === "tele_kiosk" || activeTab === "teleopd") && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">ASHA Assisted Tele-OPD Kiosk</h2>
            <p className="text-xs text-slate-500">Connect rural citizens directly to Medical Specialists at Sub-District and District Civil Hospitals</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-6 bg-[#EFF2F5] rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0E4A43] text-[#E5F973] flex items-center justify-center font-bold">
                <Video className="w-5 h-5 text-[#E5F973]" />
              </div>
              <h3 className="font-black text-base text-slate-900">Virtual Specialist Booth</h3>
              <p className="text-slate-600">
                Assist elderly or non-smartphone citizens in establishing a direct video consultation with MBBS/MD Medical Officers.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => alert("Assisted Tele-OPD Virtual Session Initiated with Duty Medical Officer.")}
                  className="px-5 py-2.5 rounded-2xl bg-[#0E4A43] text-white font-bold text-xs hover:brightness-110 shadow-md flex items-center gap-2"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Launch Assisted Call</span>
                </button>
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5 text-amber-800" />
              </div>
              <h3 className="font-black text-base text-slate-900">Specialist OPD Schedule</h3>
              <ul className="space-y-2 text-slate-600">
                <li>&bull; <strong>Pediatrics:</strong> Mon, Wed, Fri (10:00 AM - 01:00 PM)</li>
                <li>&bull; <strong>Gynecology &amp; ANC:</strong> Tue, Thu, Sat (10:00 AM - 01:00 PM)</li>
                <li>&bull; <strong>General Medicine:</strong> Daily 24x7 Emergency</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ─── MATERNAL & CHILD HEALTH (MCH) TAB ────────────────────────────────── */}
      {(activeTab === "mch" || activeTab === "maternal_child") && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">Maternal &amp; Child Health (ANC Tracker)</h2>
              <p className="text-xs text-slate-500">Register pregnant women, track antenatal care checkups (ANC 1-4), and ensure Iron Folic Acid (IFA) delivery</p>
            </div>

            {mchSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Maternal Health Record saved and synced with PHC ANC Register!</span>
              </div>
            )}

            <form onSubmit={handleCreateMch} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mother's Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kavita Ramesh Gaikwad"
                    value={mchMotherName}
                    onChange={(e) => setMchMotherName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    placeholder="e.g. 26"
                    value={mchAge}
                    onChange={(e) => setMchAge(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Village / Pada</label>
                  <input
                    type="text"
                    placeholder="e.g. Ambegaon"
                    value={mchVillage}
                    onChange={(e) => setMchVillage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expected Delivery Date (EDD)</label>
                  <input
                    type="date"
                    value={mchEdd}
                    onChange={(e) => setMchEdd(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trimester</label>
                  <select
                    value={mchTrimester}
                    onChange={(e) => setMchTrimester(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  >
                    <option value="FIRST">1st Trimester (1-12 wks)</option>
                    <option value="SECOND">2nd Trimester (13-26 wks)</option>
                    <option value="THIRD">3rd Trimester (27-40 wks)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ANC Checkup Number</label>
                  <select
                    value={mchAncCount}
                    onChange={(e) => setMchAncCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  >
                    <option value={1}>ANC 1 (Registration)</option>
                    <option value={2}>ANC 2 (14-26 wks)</option>
                    <option value={3}>ANC 3 (28-34 wks)</option>
                    <option value={4}>ANC 4 (36 wks)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Risk Category</label>
                  <select
                    value={mchRiskLevel}
                    onChange={(e) => setMchRiskLevel(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  >
                    <option value="NORMAL">Normal Pregnancy</option>
                    <option value="HIGH_RISK">High-Risk Pregnancy (HRP)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={mchSubmitting}
                  className="px-6 py-3 rounded-2xl bg-[#0E4A43] text-white font-black text-xs hover:brightness-110 disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
                >
                  <Baby className="w-4 h-4" />
                  <span>{mchSubmitting ? "Saving ANC Record..." : "Register Mother in ANC"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Active MCH Records List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-black text-slate-900 text-base">Tracked Mothers in Area</h3>
            {mchRecords.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-bold">No mothers registered yet.</div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {mchRecords.map((m) => (
                  <div key={m.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-black text-slate-900">{m.motherName}</span>
                      <span className="text-slate-500 ml-2">({m.village})</span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        m.riskLevel === "HIGH_RISK" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {m.riskLevel === "HIGH_RISK" ? "High Risk" : "Normal"}
                      </span>
                    </div>
                    <div className="text-slate-500 font-mono">
                      EDD: {m.edd ? new Date(m.edd).toLocaleDateString() : "Pending"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── EMERGENCY ESCALATION TAB ─────────────────────────────────────────── */}
      {(activeTab === "escalation" || activeTab === "emergency") && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Emergency 108 Ambulance Escalation</h2>
            <p className="text-xs text-slate-500">Fast-track direct dispatch of emergency life-support ambulances to village coordinates</p>
          </div>

          <div className="p-6 bg-red-50 rounded-3xl border border-red-200 space-y-4 text-xs text-red-900">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-black text-base">Emergency SOS Dispatch</h3>
                <p className="text-red-700">Immediate GPS dispatch to closest 108 Advanced Life Support (ALS) unit</p>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="tel:108"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-md"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call 108 Ambulance Hotline</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ─── WORKER PROFILE TAB ──────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 text-xs">
          <div>
            <h2 className="text-xl font-black text-slate-900">Health Worker Profile &amp; Jurisdiction</h2>
            <p className="text-slate-500">Government accreditation and primary health centre affiliation</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Worker Name</div>
              <div className="font-black text-slate-900 text-sm mt-1">{user.fullName}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Role / Cadre</div>
              <div className="font-black text-[#0E4A43] text-sm mt-1">{worker?.workerType || "ASHA Frontline Worker"}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Assigned Village Area</div>
              <div className="font-black text-slate-900 text-sm mt-1">{worker?.villageArea || "Ambegaon Cluster"}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Affiliated PHC</div>
              <div className="font-black text-slate-900 text-sm mt-1">{worker?.facility?.name || "Ambegaon PHC"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
