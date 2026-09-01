"use client";

import { useState } from "react";
import Link from "next/link";
import { type UserProfile } from "@/lib/api";

interface DoctorDashboardProps {
  user: UserProfile;
  activeTab: string;
  setTab: (t: string) => void;
}

export function DoctorDashboard({ user, activeTab, setTab }: DoctorDashboardProps) {
  const doctor = user.doctor;
  const [isOnDuty, setIsOnDuty] = useState(true);

  // Active Queue State
  const [patientQueue, setPatientQueue] = useState([
    {
      id: "Q-101",
      name: "Ramesh Tukaram Patil",
      age: 48,
      gender: "Male",
      village: "Manchar",
      type: "Virtual Tele-OPD",
      priority: "CRITICAL",
      vitals: "BP: 155/98 | SpO2: 94% | Pulse: 102 bpm",
      symptoms: "Severe chest discomfort and breathlessness since morning",
      timeWaiting: "8 mins ago",
    },
    {
      id: "Q-102",
      name: "Sunita Anil Shinde",
      age: 26,
      gender: "Female",
      village: "Junnar",
      type: "In-Person OPD",
      priority: "URGENT",
      vitals: "BP: 120/80 | Temp: 101.4°F | SpO2: 98%",
      symptoms: "High fever with chills and persistent joint pain (Day 3)",
      timeWaiting: "15 mins ago",
    },
    {
      id: "Q-103",
      name: "Kisan Bapu Rao",
      age: 62,
      gender: "Male",
      village: "Ambegaon",
      type: "Virtual Tele-OPD",
      priority: "ROUTINE",
      vitals: "BP: 130/84 | Fasting Sugar: 140 mg/dL",
      symptoms: "Monthly diabetes & hypertension prescription refill",
      timeWaiting: "22 mins ago",
    },
  ]);

  // E-Prescription Form State
  const [rxPatientName, setRxPatientName] = useState("");
  const [rxDiagnosis, setRxDiagnosis] = useState("");
  const [rxMedicines, setRxMedicines] = useState([
    { name: "Paracetamol 500mg", dose: "1 tablet thrice daily", duration: "5 days" },
    { name: "Amoxicillin 500mg", dose: "1 capsule twice daily", duration: "5 days" },
  ]);
  const [rxLabOrders, setRxLabOrders] = useState("Complete Blood Count (CBC)");
  const [rxSuccess, setRxSuccess] = useState(false);

  // Referral State
  const [refPatientName, setRefPatientName] = useState("");
  const [refDestination, setRefDestination] = useState("Sassoon General Hospital (District Hospital Pune)");
  const [refUrgency, setRefUrgency] = useState("URGENT");
  const [refReason, setRefReason] = useState("");
  const [refSuccess, setRefSuccess] = useState(false);

  // Patient Lookup State
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResult, setLookupResult] = useState<any>(null);

  const handleIssuePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    setRxSuccess(true);
    setTimeout(() => {
      setRxSuccess(false);
      setRxPatientName("");
      setRxDiagnosis("");
    }, 2000);
  };

  const handleCreateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    setRefSuccess(true);
    setTimeout(() => {
      setRefSuccess(false);
      setRefPatientName("");
      setRefReason("");
    }, 2000);
  };

  const handleSearchPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    setLookupResult({
      name: "Ramesh Tukaram Patil",
      abhaId: "91-4029-8812-4419",
      age: 48,
      gender: "Male",
      district: "Pune",
      village: "Manchar",
      bloodGroup: "B+",
      chronicConditions: ["Hypertension (Grade 1)", "Mild Type 2 Diabetes"],
      allergies: ["Penicillin / Sulfa Drugs"],
      pastVisits: [
        { date: "12 May 2026", facility: "PHC Manchar", diagnosis: "Viral Pyrexia", doctor: "Dr. Kulkarni" },
        { date: "15 Jan 2026", facility: "Sub-District Hospital", diagnosis: "Hypertension Review", doctor: "Dr. Deshmukh" },
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* ─── DOCTOR OVERVIEW TAB ─────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-[#0E4A43] text-white rounded-[32px] p-6 sm:p-8 relative overflow-hidden shadow-xs">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5F973]/20 border border-[#E5F973]/30 text-[#E5F973] text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#E5F973] animate-pulse" />
                  Doctor &amp; Specialist Workbench
                </div>
                <h2 className="text-2xl sm:text-3xl font-black font-heading">
                  Welcome, {user.fullName}
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                  Specialty: {doctor?.specialty || "General Medicine"} • Reg: {doctor?.registrationNo || "MCI-MH-44912"}
                </p>

                <div className="pt-2 flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setTab("queue")}
                    className="px-5 py-2.5 rounded-full bg-[#E5F973] text-slate-950 text-xs font-black hover:bg-[#d8ec68] transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                  >
                    Open Tele-OPD Queue ({patientQueue.length} Waiting)
                  </button>
                  <button
                    onClick={() => setTab("prescriptions")}
                    className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20"
                  >
                    + Write E-Prescription
                  </button>
                </div>
              </div>

              {/* Duty Toggle Card */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 w-full lg:w-72 space-y-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-100">Tele-OPD Status</span>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${isOnDuty ? "bg-[#E5F973] text-slate-950" : "bg-rose-500 text-white"}`}>
                    {isOnDuty ? "AVAILABLE" : "OFF-DUTY"}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/80">
                  {isOnDuty ? "You are receiving live patient triage calls and OPD consultation requests." : "Currently offline for scheduled consultations."}
                </p>
                <button
                  onClick={() => setIsOnDuty(!isOnDuty)}
                  className="w-full py-2 rounded-xl bg-white text-slate-900 text-xs font-black hover:bg-slate-100 transition-colors"
                >
                  Toggle Duty Status ({isOnDuty ? "Go Offline" : "Go Available"})
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#EFF2F5] rounded-[24px] p-5 border border-slate-200/50">
              <div className="text-2xl font-black text-slate-900">{patientQueue.length}</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Waiting in Queue</div>
              <div className="text-[10px] text-slate-500">Live triage waiting room</div>
            </div>
            <div className="bg-[#EFF2F5] rounded-[24px] p-5 border border-slate-200/50">
              <div className="text-2xl font-black text-emerald-700">14</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Consulted Today</div>
              <div className="text-[10px] text-slate-500">OPD &amp; Telehealth</div>
            </div>
            <div className="bg-[#EFF2F5] rounded-[24px] p-5 border border-slate-200/50">
              <div className="text-2xl font-black text-slate-900">3</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Specialist Referrals</div>
              <div className="text-[10px] text-slate-500">Transferred to District Hospital</div>
            </div>
            <div className="bg-[#EFF2F5] rounded-[24px] p-5 border border-slate-200/50">
              <div className="text-2xl font-black text-[#0E4A43]">100%</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Pharmacy Sync</div>
              <div className="text-[10px] text-slate-500">Local PHC drug stock</div>
            </div>
          </div>

          {/* Live Patient Queue Preview */}
          <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Current Consultation Queue</h3>
                <p className="text-xs text-slate-500">Patients sorted by clinical triage severity.</p>
              </div>
              <button onClick={() => setTab("queue")} className="text-xs text-[#0E4A43] font-bold hover:underline">
                View Full Queue ({patientQueue.length}) &rsaquo;
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
              {patientQueue.map((pt) => (
                <div key={pt.id} className="p-4 bg-white hover:bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900">{pt.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        pt.priority === "CRITICAL" ? "bg-rose-100 text-rose-800" : pt.priority === "URGENT" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {pt.priority}
                      </span>
                      <span className="text-[11px] text-slate-400">({pt.age}y / {pt.gender} • {pt.village})</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{pt.symptoms}</p>
                    <div className="text-[11px] font-mono font-bold text-slate-500">{pt.vitals}</div>
                  </div>

                  <button
                    onClick={() => alert(`Starting encrypted WebRTC Tele-OPD consult with ${pt.name}...`)}
                    className="px-4 py-2 rounded-xl bg-[#0E4A43] text-white text-xs font-bold hover:bg-[#083530] transition-colors shadow-xs self-start sm:self-auto flex items-center gap-1.5"
                  >
                    <span>Start Tele-Consult</span>
                    <span>&rsaquo;</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── QUEUE TAB ───────────────────────────────────────────────────────── */}
      {activeTab === "queue" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Live Tele-OPD &amp; In-Person Queue</h2>
              <p className="text-xs text-slate-500">Review patient triage vitals and launch instant video/audio consultations.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              {patientQueue.length} Active Patients
            </span>
          </div>

          <div className="space-y-3">
            {patientQueue.map((pt) => (
              <div key={pt.id} className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-black text-slate-900">{pt.name}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      pt.priority === "CRITICAL" ? "bg-rose-100 text-rose-800 border border-rose-200" : pt.priority === "URGENT" ? "bg-amber-100 text-amber-900 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}>
                      {pt.priority} PRIORITY
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-bold">{pt.timeWaiting}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#EFF2F5] rounded-2xl text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Vitals from Sub-Centre Kiosk</span>
                    <span className="font-bold text-slate-900 font-mono">{pt.vitals}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Chief Complaint</span>
                    <span className="font-medium text-slate-800">{pt.symptoms}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    Consultation Type: <span className="font-bold text-slate-900">{pt.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setRxPatientName(pt.name);
                        setTab("prescriptions");
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                    >
                      Write E-Rx
                    </button>
                    <button
                      onClick={() => alert(`Launching Tele-OPD Video consultation with ${pt.name} (${pt.village})...`)}
                      className="px-4 py-2 rounded-xl bg-[#0E4A43] hover:bg-[#083530] text-white text-xs font-black transition-colors shadow-xs"
                    >
                      Connect Video Call &rsaquo;
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── E-PRESCRIPTIONS TAB ─────────────────────────────────────────────── */}
      {activeTab === "prescriptions" && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h2 className="text-lg font-black text-slate-900">Issue Verified E-Prescription</h2>
            <p className="text-xs text-slate-500">Digitally signed prescriptions sync immediately to the patient's local PHC dispensary.</p>
          </div>

          {rxSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              ✓ E-Prescription issued and sent to patient SMS &amp; PHC Pharmacy!
            </div>
          )}

          <form onSubmit={handleIssuePrescription} className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Patient Name / ABHA ID *</label>
              <input
                type="text"
                required
                value={rxPatientName}
                onChange={(e) => setRxPatientName(e.target.value)}
                placeholder="e.g. Ramesh Tukaram Patil (or ABHA 91-4029-8812)"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Clinical Diagnosis *</label>
              <input
                type="text"
                required
                value={rxDiagnosis}
                onChange={(e) => setRxDiagnosis(e.target.value)}
                placeholder="e.g. Acute Bronchitis / Hypertension Review"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-700 block">Medications &amp; Regimen</label>
              {rxMedicines.map((med, idx) => (
                <div key={idx} className="p-3 bg-[#EFF2F5] rounded-xl flex items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900">{med.name}</span>
                    <div className="text-[11px] text-slate-500">{med.dose} • {med.duration}</div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    In Stock at PHC
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Recommended Lab Tests</label>
              <input
                type="text"
                value={rxLabOrders}
                onChange={(e) => setRxLabOrders(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-[#0E4A43] text-white font-black hover:bg-[#083530] transition-all shadow-xs"
            >
              Digitally Sign &amp; Issue E-Prescription
            </button>
          </form>
        </div>
      )}

      {/* ─── REFERRALS TAB ───────────────────────────────────────────────────── */}
      {activeTab === "referrals" && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h2 className="text-lg font-black text-slate-900">Generate Inter-Facility Referral</h2>
            <p className="text-xs text-slate-500">Transfer critical patients with confirmed bed reservations at higher health centres.</p>
          </div>

          {refSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              ✓ Inter-facility referral created with priority bed request!
            </div>
          )}

          <form onSubmit={handleCreateReferral} className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Patient Name *</label>
              <input
                type="text"
                required
                value={refPatientName}
                onChange={(e) => setRefPatientName(e.target.value)}
                placeholder="e.g. Ramesh Tukaram Patil"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Destination Hospital *</label>
                <select
                  value={refDestination}
                  onChange={(e) => setRefDestination(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900"
                >
                  <option value="Sassoon General Hospital (District Hospital Pune)">Sassoon Hospital (District Hospital Pune)</option>
                  <option value="Civil Hospital Nashik">Civil Hospital Nashik</option>
                  <option value="Sub-District Hospital Junnar">Sub-District Hospital Junnar</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Urgency Level</label>
                <select
                  value={refUrgency}
                  onChange={(e) => setRefUrgency(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold"
                >
                  <option value="EMERGENCY">Emergency (108 Ambulance)</option>
                  <option value="URGENT">Urgent (Within 24 Hours)</option>
                  <option value="ROUTINE">Routine Specialist Consult</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Clinical Reason &amp; Provisional Diagnosis *</label>
              <textarea
                rows={3}
                required
                value={refReason}
                onChange={(e) => setRefReason(e.target.value)}
                placeholder="Describe why referral is required (e.g. Needs echocardiography and ICU monitoring)..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-[#0E4A43] text-white font-black hover:bg-[#083530] transition-all shadow-xs"
            >
              Generate Referral &amp; Reserve Bed
            </button>
          </form>
        </div>
      )}

      {/* ─── HISTORY LOOKUP TAB ──────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="space-y-6 max-w-3xl">
          <div>
            <h2 className="text-lg font-black text-slate-900">Longitudinal Patient History Lookup</h2>
            <p className="text-xs text-slate-500">Search patient records across all 36 districts by ABHA ID or phone number.</p>
          </div>

          <form onSubmit={handleSearchPatient} className="flex gap-2">
            <input
              type="text"
              required
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              placeholder="Enter 14-digit ABHA ID, Aadhaar or Patient Phone..."
              className="flex-1 px-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20"
            />
            <button type="submit" className="px-6 py-3 rounded-2xl bg-[#0E4A43] text-white text-xs font-black hover:bg-[#083530]">
              Search Records
            </button>
          </form>

          {lookupResult && (
            <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="font-black text-base text-slate-900">{lookupResult.name}</span>
                  <span className="text-slate-500 block text-[11px]">ABHA: {lookupResult.abhaId} • {lookupResult.age}y / {lookupResult.gender}</span>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-full">
                  Verified ABHA Record
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#EFF2F5] rounded-xl">
                  <span className="font-bold text-slate-700 block mb-0.5">Allergies:</span>
                  <span className="text-rose-700 font-semibold">{lookupResult.allergies.join(", ")}</span>
                </div>
                <div className="p-3 bg-[#EFF2F5] rounded-xl">
                  <span className="font-bold text-slate-700 block mb-0.5">Chronic Conditions:</span>
                  <span className="text-slate-800 font-semibold">{lookupResult.chronicConditions.join(", ")}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-900 block">Past Consultations &amp; Case Notes:</span>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {lookupResult.pastVisits.map((v: any, i: number) => (
                    <div key={i} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{v.diagnosis}</span>
                        <span className="text-slate-500 block text-[11px]">{v.facility} • {v.doctor}</span>
                      </div>
                      <span className="text-slate-400 font-semibold">{v.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── DOCTOR PROFILE TAB ──────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <h3 className="text-base font-black text-slate-900">Doctor Credentials &amp; Specialty</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[#EFF2F5] rounded-xl">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Specialty</span>
                <span className="font-bold text-slate-900 text-sm">{doctor?.specialty || "General Medicine"}</span>
              </div>
              <div className="p-3 bg-[#EFF2F5] rounded-xl">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Qualification</span>
                <span className="font-bold text-slate-900 text-sm">{doctor?.qualification || "MBBS, MD"}</span>
              </div>
              <div className="p-3 bg-[#EFF2F5] rounded-xl">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Registration Number</span>
                <span className="font-bold text-slate-900 text-sm">{doctor?.registrationNo || "MMC-2018-0912"}</span>
              </div>
              <div className="p-3 bg-[#EFF2F5] rounded-xl">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Role Permission</span>
                <span className="font-bold text-emerald-800 text-sm">Medical Officer (MO)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
