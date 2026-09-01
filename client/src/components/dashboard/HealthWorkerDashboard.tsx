"use client";

import { useState } from "react";
import Link from "next/link";
import { type UserProfile } from "@/lib/api";

interface HealthWorkerDashboardProps {
  user: UserProfile;
  activeTab: string;
  setTab: (t: string) => void;
}

export function HealthWorkerDashboard({ user, activeTab, setTab }: HealthWorkerDashboardProps) {
  const worker = user.healthWorker;

  // Doorstep Triage State
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("Female");
  const [bpSystolic, setBpSystolic] = useState("");
  const [bpDiastolic, setBpDiastolic] = useState("");
  const [spo2, setSpo2] = useState("");
  const [temp, setTemp] = useState("");
  const [pulse, setPulse] = useState("");
  const [isPregnant, setIsPregnant] = useState(false);
  const [hasChestPain, setHasChestPain] = useState(false);
  const [hasHighFever, setHasHighFever] = useState(false);
  const [triageOutput, setTriageOutput] = useState<{ priority: string; color: string; advice: string } | null>(null);

  // Triage Records
  const [triageRecords, setTriageRecords] = useState([
    {
      id: "TRG-101",
      patient: "Laxmi Dilip Jadhav",
      age: 24,
      village: "Ambegaon Gav",
      priority: "CRITICAL",
      vitals: "BP: 160/105 (High) | SpO2: 96%",
      notes: "ANC 3rd Trimester - High blood pressure / pre-eclampsia signs",
      action: "Assisted Tele-OPD Initiated",
    },
    {
      id: "TRG-102",
      patient: "Ganesh Vishnu Kale",
      age: 58,
      village: "Ambegaon Wasti",
      priority: "MODERATE",
      vitals: "BP: 138/88 | Random Sugar: 210 mg/dL",
      notes: "Uncontrolled diabetes review required",
      action: "Referred to PHC Manchar",
    },
  ]);

  // Maternal & Child Health Tracker State
  const [mchList, setMchList] = useState([
    {
      id: "MCH-01",
      motherName: "Pooja Santosh Gaikwad",
      age: 22,
      edd: "15 Oct 2026",
      trimester: "3rd Trimester",
      riskLevel: "HIGH RISK",
      ancCount: "3 of 4 Completed",
      hb: "9.2 g/dL (Mild Anemia)",
      ifaGiven: "Yes (100 tablets)",
    },
    {
      id: "MCH-02",
      motherName: "Rohini Balu More",
      age: 27,
      edd: "22 Dec 2026",
      trimester: "2nd Trimester",
      riskLevel: "NORMAL",
      ancCount: "2 of 4 Completed",
      hb: "11.8 g/dL (Normal)",
      ifaGiven: "Yes (100 tablets)",
    },
  ]);

  const handleRunTriage = (e: React.FormEvent) => {
    e.preventDefault();
    const sys = Number(bpSystolic);
    const sp = Number(spo2);
    const tp = Number(temp);

    let priority = "ROUTINE";
    let color = "bg-emerald-100 text-emerald-800 border-emerald-200";
    let advice = "Vitals stable. Schedule routine checkup at Sub-Centre.";

    if (hasChestPain || sp < 92 || sys >= 160) {
      priority = "CRITICAL EMERGENCY";
      color = "bg-rose-100 text-rose-800 border-rose-200";
      advice = "Immediate referral required! Call 108 ambulance and start emergency protocol.";
    } else if (hasHighFever || tp >= 102 || sys >= 140 || sp < 95 || isPregnant) {
      priority = "MODERATE PRIORITY";
      color = "bg-amber-100 text-amber-900 border-amber-200";
      advice = "Connect with Medical Officer via Assisted Tele-OPD within 2 hours.";
    }

    const res = { priority, color, advice };
    setTriageOutput(res);

    const newRecord = {
      id: `TRG-${Math.floor(100 + Math.random() * 900)}`,
      patient: patientName,
      age: Number(patientAge) || 30,
      village: worker?.villageArea || "Ambegaon",
      priority: priority.includes("CRITICAL") ? "CRITICAL" : priority.includes("MODERATE") ? "MODERATE" : "ROUTINE",
      vitals: `BP: ${bpSystolic}/${bpDiastolic || "80"} | SpO2: ${spo2}%`,
      notes: advice,
      action: priority.includes("CRITICAL") ? "108 Escalation" : "Tele-OPD Scheduled",
    };
    setTriageRecords([newRecord, ...triageRecords]);
  };

  return (
    <div className="space-y-6">
      {/* ─── FRONTLINE OVERVIEW TAB ──────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="bg-[#0E4A43] text-white rounded-[32px] p-6 sm:p-8 relative overflow-hidden shadow-xs">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5F973]/20 border border-[#E5F973]/30 text-[#E5F973] text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#E5F973] animate-pulse" />
                  ASHA / ANM Frontline Health Desk
                </div>
                <h2 className="text-2xl sm:text-3xl font-black font-heading">
                  Namaste, {user.fullName}
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                  Assigned Village: <span className="font-bold text-[#E5F973]">{worker?.villageArea || "Ambegaon Catchment"}</span> • Linked PHC: Manchar Primary Health Centre
                </p>

                <div className="pt-2 flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setTab("triage")}
                    className="px-5 py-2.5 rounded-full bg-[#E5F973] text-slate-950 text-xs font-black hover:bg-[#d8ec68] transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                  >
                    + Start Doorstep Clinical Triage
                  </button>
                  <button
                    onClick={() => setTab("teleopd")}
                    className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20"
                  >
                    Launch Kiosk Tele-OPD
                  </button>
                </div>
              </div>

              {/* Village Quick Stats */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 w-full lg:w-72 space-y-2 flex-shrink-0 text-xs">
                <span className="text-[10px] font-bold uppercase text-emerald-200 block">Village Health Status</span>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-emerald-100">Covered Households:</span>
                  <span className="font-bold text-white">184 Families</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-emerald-100">Pregnant Women (ANC):</span>
                  <span className="font-bold text-[#E5F973]">{mchList.length} Active</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-emerald-100">Child Immunizations Due:</span>
                  <span className="font-bold text-white">6 Due this week</span>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#EFF2F5] rounded-[24px] p-5 border border-slate-200/50">
              <div className="text-2xl font-black text-slate-900">{triageRecords.length}</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Triaged This Week</div>
              <div className="text-[10px] text-slate-500">Doorstep vitals logged</div>
            </div>
            <div className="bg-[#EFF2F5] rounded-[24px] p-5 border border-slate-200/50">
              <div className="text-2xl font-black text-rose-700">1</div>
              <div className="text-xs font-bold text-slate-700 mt-1">High-Risk ANC</div>
              <div className="text-[10px] text-slate-500">Specialist tracking</div>
            </div>
            <div className="bg-[#EFF2F5] rounded-[24px] p-5 border border-slate-200/50">
              <div className="text-2xl font-black text-emerald-700">8</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Tele-OPD Consults</div>
              <div className="text-[10px] text-slate-500">Connected with MO</div>
            </div>
            <div className="bg-[#EFF2F5] rounded-[24px] p-5 border border-slate-200/50">
              <div className="text-2xl font-black text-[#0E4A43]">100%</div>
              <div className="text-xs font-bold text-slate-700 mt-1">IFA Supplement Stock</div>
              <div className="text-[10px] text-slate-500">Available at Sub-Centre</div>
            </div>
          </div>

          {/* Recent Triage Logs */}
          <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Recent Village Triage Records</h3>
                <p className="text-xs text-slate-500">Real-time health records assessed during village visits.</p>
              </div>
              <button onClick={() => setTab("triage")} className="text-xs text-[#0E4A43] font-bold hover:underline">
                New Triage Form &rsaquo;
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden text-xs">
              {triageRecords.map((rec) => (
                <div key={rec.id} className="p-4 bg-white hover:bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{rec.patient}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        rec.priority === "CRITICAL" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-900"
                      }`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{rec.vitals} • {rec.notes}</p>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 font-bold self-start sm:self-auto">
                    {rec.action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── DOORSTEP TRIAGE TAB ─────────────────────────────────────────────── */}
      {activeTab === "triage" && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h2 className="text-lg font-black text-slate-900">Doorstep Clinical Symptom Triage</h2>
            <p className="text-xs text-slate-500">Record patient vitals to automatically determine clinical urgency level and action protocol.</p>
          </div>

          {triageOutput && (
            <div className={`p-5 rounded-2xl border text-xs space-y-1.5 animate-in fade-in duration-200 ${triageOutput.color}`}>
              <div className="flex items-center justify-between">
                <span className="font-black text-sm uppercase">Triage Result: {triageOutput.priority}</span>
                <span className="font-bold px-2 py-0.5 rounded-full bg-white/60">Automated Protocol</span>
              </div>
              <p className="font-medium">{triageOutput.advice}</p>
            </div>
          )}

          <form onSubmit={handleRunTriage} className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1">
                <label className="font-bold text-slate-700">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Laxmi Jadhav"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Age</label>
                <input
                  type="number"
                  required
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="24"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">BP Systolic</label>
                <input type="number" value={bpSystolic} onChange={(e) => setBpSystolic(e.target.value)} placeholder="120"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">BP Diastolic</label>
                <input type="number" value={bpDiastolic} onChange={(e) => setBpDiastolic(e.target.value)} placeholder="80"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">SpO2 Oxygen %</label>
                <input type="number" value={spo2} onChange={(e) => setSpo2(e.target.value)} placeholder="98"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Temperature (°F)</label>
                <input type="text" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="98.6"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900" />
              </div>
            </div>

            <div className="p-3 bg-[#EFF2F5] rounded-2xl space-y-2">
              <span className="font-bold text-slate-800 block">Red-Flag Symptoms:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input type="checkbox" checked={hasChestPain} onChange={(e) => setHasChestPain(e.target.checked)} className="rounded text-[#0E4A43]" />
                  Severe Chest Pain / Shortness of Breath
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input type="checkbox" checked={isPregnant} onChange={(e) => setIsPregnant(e.target.checked)} className="rounded text-[#0E4A43]" />
                  Pregnant ANC (Swelling / Blurred Vision)
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input type="checkbox" checked={hasHighFever} onChange={(e) => setHasHighFever(e.target.checked)} className="rounded text-[#0E4A43]" />
                  High Fever with Chills (&gt; 3 Days)
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-[#0E4A43] text-white font-black hover:bg-[#083530] transition-all shadow-xs"
            >
              Evaluate Triage &amp; Calculate Urgency Protocol
            </button>
          </form>
        </div>
      )}

      {/* ─── ASSISTED TELE-OPD TAB ───────────────────────────────────────────── */}
      {activeTab === "teleopd" && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h2 className="text-lg font-black text-slate-900">Sub-Centre Kiosk Tele-OPD</h2>
            <p className="text-xs text-slate-500">Connect village patients with on-duty government medical officers via live video consult.</p>
          </div>

          <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-black text-sm block">Sub-Centre Kiosk Online</span>
                <span className="text-[11px] text-emerald-800">4 Medical Officers currently on duty in district pool.</span>
              </div>
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Patient Full Name / ABHA ID</label>
                <input type="text" placeholder="Enter patient name..." className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Preferred Language</label>
                <select className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold">
                  <option>Marathi (मराठी)</option>
                  <option>Hindi (हिन्दी)</option>
                  <option>English</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Presenting Symptoms for Doctor</label>
                <textarea rows={2} placeholder="Notes for doctor (e.g. chronic cough, joint swelling)..." className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 resize-none" />
              </div>

              <button
                type="button"
                onClick={() => alert("Launching Assisted Tele-OPD Video session in Marathi with on-duty MO...")}
                className="w-full py-3 rounded-full bg-[#0E4A43] text-white font-black hover:bg-[#083530] transition-all shadow-xs"
              >
                Connect Live Video Call with Doctor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MATERNAL & CHILD HEALTH TAB ────────────────────────────────────── */}
      {activeTab === "maternal_child" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">Maternal &amp; Child Health (MCH) Tracker</h2>
            <p className="text-xs text-slate-500">Antenatal checkups, high-risk pregnancy monitoring, and child immunization follow-ups.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mchList.map((mch) => (
              <div key={mch.id} className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-base text-slate-900">{mch.motherName}</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                    mch.riskLevel === "HIGH RISK" ? "bg-rose-100 text-rose-800 border border-rose-200" : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {mch.riskLevel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 bg-[#EFF2F5] rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Estimated Delivery</span>
                    <span className="font-bold text-slate-900">{mch.edd}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Stage</span>
                    <span className="font-bold text-slate-900">{mch.trimester}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">ANC Visits</span>
                    <span className="font-bold text-emerald-800">{mch.ancCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Hemoglobin (Hb)</span>
                    <span className="font-bold text-rose-700">{mch.hb}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-500">IFA Stock Delivered: <strong className="text-slate-900">{mch.ifaGiven}</strong></span>
                  <button
                    onClick={() => alert(`Opening ANC clinical card for ${mch.motherName}...`)}
                    className="text-[#0E4A43] font-bold hover:underline"
                  >
                    Update ANC Card &rsaquo;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── EMERGENCY ESCALATION TAB ────────────────────────────────────────── */}
      {activeTab === "emergency" && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-rose-50 border border-rose-200 rounded-[28px] p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-xl font-black">
                !
              </div>
              <div>
                <h3 className="text-base font-black text-rose-950">24x7 Maharashtra Emergency Escalation</h3>
                <p className="text-xs text-rose-800">Dispatch 108 Emergency Ambulance or 104 Health Helpline immediately.</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <a
                href="tel:108"
                className="px-5 py-3 rounded-full bg-rose-600 text-white text-xs font-black hover:bg-rose-700 shadow-xs flex items-center gap-2"
              >
                <span>Dial 108 Ambulance</span>
              </a>
              <a
                href="tel:104"
                className="px-5 py-3 rounded-full bg-white text-slate-900 border border-slate-200 text-xs font-bold hover:bg-slate-100"
              >
                <span>Call 104 Medical Helpline</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ─── WORKER PROFILE TAB ──────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <h3 className="text-base font-black text-slate-900">Health Worker Profile &amp; Catchment</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#EFF2F5] rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Worker Role</span>
                <span className="text-sm font-bold text-slate-900">ASHA / ANM Frontline Worker</span>
              </div>
              <div className="p-3.5 bg-[#EFF2F5] rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned Village Area</span>
                <span className="text-sm font-bold text-slate-900">{worker?.villageArea || "Ambegaon Catchment"}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
