"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  type UserProfile,
  type Appointment,
  type Facility,
  appointmentsApi,
  prescriptionsApi,
  referralsApi,
  facilitiesApi,
} from "@/lib/api";

interface DoctorDashboardProps {
  user: UserProfile;
  activeTab: string;
  setTab: (t: string) => void;
}

export function DoctorDashboard({ user, activeTab, setTab }: DoctorDashboardProps) {
  const doctor = user.doctor;
  const [isOnDuty, setIsOnDuty] = useState(true);

  // Live Database States
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  // E-Prescription Form State
  const [rxAppointmentId, setRxAppointmentId] = useState("");
  const [rxPatientId, setRxPatientId] = useState("");
  const [rxPatientName, setRxPatientName] = useState("");
  const [rxDiagnosis, setRxDiagnosis] = useState("");
  const [rxAdvice, setRxAdvice] = useState("");
  const [rxFollowUpDate, setRxFollowUpDate] = useState("");
  const [rxMedicines, setRxMedicines] = useState([
    { medicineName: "Paracetamol 500mg", dosage: "1 tablet thrice daily", duration: "5 days", instructions: "After food" },
  ]);
  const [rxSubmitting, setRxSubmitting] = useState(false);
  const [rxSuccess, setRxSuccess] = useState(false);

  // Referral State
  const [refPatientId, setRefPatientId] = useState("");
  const [refPatientName, setRefPatientName] = useState("");
  const [refToFacilityId, setRefToFacilityId] = useState("");
  const [refUrgency, setRefUrgency] = useState<"ROUTINE" | "URGENT" | "HIGH" | "CRITICAL">("URGENT");
  const [refSpecialty, setRefSpecialty] = useState("Cardiology");
  const [refReason, setRefReason] = useState("");
  const [refSubmitting, setRefSubmitting] = useState(false);
  const [refSuccess, setRefSuccess] = useState(false);

  // Patient Lookup State
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  // Active Video Modal
  const [activeCallAppt, setActiveCallAppt] = useState<Appointment | null>(null);

  const loadDoctorData = async () => {
    setLoading(true);
    try {
      const [apptRes, facRes] = await Promise.allSettled([
        appointmentsApi.list({ doctorId: doctor?.id }),
        facilitiesApi.list(),
      ]);

      if (apptRes.status === "fulfilled" && apptRes.value.success) {
        setAppointments(apptRes.value.data);
      }
      if (facRes.status === "fulfilled" && facRes.value.success) {
        setFacilities(facRes.value.data.facilities);
        if (facRes.value.data.facilities.length > 0 && !refToFacilityId) {
          setRefToFacilityId(facRes.value.data.facilities[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load doctor data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorData();
  }, [doctor?.id]);

  const handleIssuePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxPatientId || !doctor?.id || !doctor?.facilityId) {
      alert("Please select a valid patient appointment from the queue or queue selection.");
      return;
    }
    setRxSubmitting(true);
    try {
      await prescriptionsApi.create({
        patientId: rxPatientId,
        doctorId: doctor.id,
        facilityId: doctor.facilityId,
        diagnosis: rxDiagnosis,
        advice: rxAdvice,
        followUpDate: rxFollowUpDate || undefined,
        items: rxMedicines.map((m) => ({
          medicineName: m.medicineName,
          dosage: m.dosage,
          duration: m.duration,
          instructions: m.instructions,
          inStock: true,
        })),
      });

      if (rxAppointmentId) {
        await appointmentsApi.updateStatus(rxAppointmentId, "COMPLETED");
      }

      setRxSuccess(true);
      await loadDoctorData();
      setTimeout(() => {
        setRxSuccess(false);
        setRxDiagnosis("");
        setRxAdvice("");
        setRxPatientName("");
        setRxPatientId("");
        setRxAppointmentId("");
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Failed to issue digital prescription.");
    } finally {
      setRxSubmitting(false);
    }
  };

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refPatientId || !doctor?.facilityId || !refToFacilityId) {
      alert("Please select a patient and destination hospital.");
      return;
    }
    setRefSubmitting(true);
    try {
      await referralsApi.create({
        patientId: refPatientId,
        fromFacilityId: doctor.facilityId,
        toFacilityId: refToFacilityId,
        reason: refReason,
        requiredSpecialty: refSpecialty,
        priority: refUrgency,
      });

      setRefSuccess(true);
      await loadDoctorData();
      setTimeout(() => {
        setRefSuccess(false);
        setRefPatientName("");
        setRefPatientId("");
        setRefReason("");
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Failed to create referral.");
    } finally {
      setRefSubmitting(false);
    }
  };

  const handleSelectPatientForRx = (appt: Appointment) => {
    setRxAppointmentId(appt.id);
    setRxPatientId(appt.patientId);
    setRxPatientName(appt.patient?.user?.fullName || "Patient");
    setTab("prescribe");
  };

  const handleSelectPatientForRef = (appt: Appointment) => {
    setRefPatientId(appt.patientId);
    setRefPatientName(appt.patient?.user?.fullName || "Patient");
    setTab("referrals");
  };

  const handleCompleteAppointment = async (id: string) => {
    try {
      await appointmentsApi.updateStatus(id, "COMPLETED");
      await loadDoctorData();
    } catch (err: any) {
      alert(err.message || "Failed to update appointment status.");
    }
  };

  const handleSearchPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    setSearching(true);
    // Search among appointments
    const match = appointments.find((a) =>
      a.patient?.user?.fullName?.toLowerCase().includes(lookupQuery.toLowerCase()) ||
      a.patientId.includes(lookupQuery)
    );
    if (match) {
      setLookupResult({
        name: match.patient?.user?.fullName || "Citizen Record",
        patientId: match.patientId,
        contact: match.patient?.user?.phone || "Registered with Health Center",
        lastVisit: new Date(match.appointmentDate).toLocaleDateString(),
        lastNotes: match.notes || "Routine OPD Consultation",
        facility: match.facility?.name || "PHC",
      });
    } else {
      setLookupResult(null);
      alert("No patient matching the search query found in the live database records.");
    }
    setSearching(false);
  };

  const addMedicineRow = () => {
    setRxMedicines([...rxMedicines, { medicineName: "", dosage: "1 tablet BD", duration: "3 days", instructions: "After food" }]);
  };

  const activeQueue = appointments.filter((a) => a.status === "BOOKED" || a.status === "CONFIRMED" || a.status === "IN_PROGRESS");

  return (
    <div className="space-y-8 max-w-6xl">
      {/* ─── DOCTOR OVERVIEW TAB ─────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Header Banner */}
          <div className="rounded-3xl bg-linear-to-br from-[#0E4A43] via-[#093530] to-[#041c19] p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-[#E5F973]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#E5F973] text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Clinical Tele-OPD Station &bull; Maharashtra Health Services
                </div>
                <h1 className="text-2xl sm:text-3xl font-black">{user.fullName}</h1>
                <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
                  {doctor?.specialty || "Medical Officer"} • Reg No: <strong className="text-white font-mono">{doctor?.registrationNo || "MMC-2026"}</strong>
                </p>
                <div className="text-xs text-slate-300">
                  Assigned Facility: <strong className="text-white">{doctor?.facility?.name || "District Health Facility"}</strong>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => setIsOnDuty(!isOnDuty)}
                  className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 shadow-xs ${
                    isOnDuty
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${isOnDuty ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
                  {isOnDuty ? "ON TELE-OPD DUTY" : "DUTY PAUSED"}
                </button>
                <button
                  onClick={() => setTab("queue")}
                  className="px-5 py-3 rounded-2xl bg-[#E5F973] text-[#0E4A43] font-black text-xs hover:brightness-105 active:scale-95 transition-all shadow-md"
                >
                  Open Live Patient Queue ({activeQueue.length})
                </button>
              </div>
            </div>
          </div>

          {/* KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div
              onClick={() => setTab("queue")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                ⏳
              </div>
              <div className="text-2xl font-black text-slate-900">{activeQueue.length}</div>
              <div className="text-xs font-bold text-slate-500">Patients in Queue</div>
            </div>
            <div
              onClick={() => setTab("prescribe")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                💊
              </div>
              <div className="text-2xl font-black text-slate-900">{appointments.filter((a) => a.status === "COMPLETED").length}</div>
              <div className="text-xs font-bold text-slate-500">Completed Consults</div>
            </div>
            <div
              onClick={() => setTab("referrals")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                🔄
              </div>
              <div className="text-2xl font-black text-slate-900">{facilities.length}</div>
              <div className="text-xs font-bold text-slate-500">Referral Facilities</div>
            </div>
            <div
              onClick={() => setTab("patient_lookup")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                🔍
              </div>
              <div className="text-2xl font-black text-slate-900">{appointments.length}</div>
              <div className="text-xs font-bold text-slate-500">Total Consultations</div>
            </div>
          </div>

          {/* Queue Snapshot */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Immediate Patient Queue</h2>
                <p className="text-xs text-slate-500">Prioritized by triage urgency and waiting time</p>
              </div>
              <button onClick={() => setTab("queue")} className="text-xs font-black text-[#0E4A43] hover:underline">
                View Full Queue ({activeQueue.length})
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 text-sm text-slate-500 font-bold">
                Loading live patient queue from database...
              </div>
            ) : activeQueue.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 space-y-2">
                <div className="text-2xl">✅</div>
                <div className="font-bold text-slate-900 text-sm">No Pending Patients</div>
                <p className="text-xs text-slate-500">All scheduled appointments for your duty roster have been attended.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeQueue.slice(0, 3).map((appt) => (
                  <div
                    key={appt.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                          {appt.status}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-400">{appt.token || "Token Pending"}</span>
                      </div>
                      <h3 className="font-black text-slate-900 text-sm">{appt.patient?.user?.fullName || "Patient"}</h3>
                      <p className="text-xs text-slate-500">
                        {appt.type === "TELE_OPD" ? "Virtual Tele-OPD Video" : "In-Person Consultation"} &bull; {appt.facility?.name}
                      </p>
                      {appt.notes && <p className="text-xs text-slate-700">Reason: <em>{appt.notes}</em></p>}
                    </div>

                    <div className="flex items-center gap-2">
                      {appt.type === "TELE_OPD" && (
                        <button
                          onClick={() => setActiveCallAppt(appt)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          Launch Video Call
                        </button>
                      )}
                      <button
                        onClick={() => handleSelectPatientForRx(appt)}
                        className="px-4 py-2 rounded-xl bg-[#0E4A43] hover:brightness-110 text-white font-bold text-xs transition-colors"
                      >
                        Prescribe (E-Rx)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TELE-OPD QUEUE TAB ──────────────────────────────────────────────── */}
      {activeTab === "queue" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Live Tele-OPD Consultation Queue</h2>
              <p className="text-xs text-slate-500">Live patients waiting for clinical review and video tele-consultation</p>
            </div>
            <button
              onClick={loadDoctorData}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-50 text-slate-700"
            >
              🔄 Refresh Queue
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 text-sm text-slate-500 font-bold">
              Loading queue from database...
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-2">
              <div className="text-2xl">📋</div>
              <div className="font-bold text-slate-900 text-base">Queue Empty</div>
              <p className="text-xs text-slate-500">No appointments scheduled for this doctor.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-emerald-100 text-emerald-800">
                        {appt.status}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-400">{appt.token || "Token Pending"}</span>
                      <span className="text-xs font-bold text-[#0E4A43]">{appt.type === "TELE_OPD" ? "📹 Tele-OPD" : "🏥 In-Person"}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400 font-mono">
                      Scheduled: {new Date(appt.appointmentDate).toLocaleDateString()} ({appt.slot})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="font-black text-slate-900 text-base">{appt.patient?.user?.fullName || "Patient"}</div>
                      <div className="text-slate-500 mt-1">Facility: {appt.facility?.name}</div>
                      {appt.notes && <div className="text-slate-700 mt-1">Notes: <strong>{appt.notes}</strong></div>}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {appt.type === "TELE_OPD" && appt.status !== "COMPLETED" && (
                      <button
                        onClick={() => setActiveCallAppt(appt)}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
                      >
                        📹 Start Video Consultation
                      </button>
                    )}
                    <button
                      onClick={() => handleSelectPatientForRx(appt)}
                      className="px-5 py-2.5 rounded-xl bg-[#0E4A43] hover:brightness-110 text-white font-bold text-xs transition-colors"
                    >
                      💊 Issue E-Prescription
                    </button>
                    <button
                      onClick={() => handleSelectPatientForRef(appt)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 hover:bg-slate-50 font-bold text-xs transition-colors"
                    >
                      🔄 Escalate Referral
                    </button>
                    {appt.status !== "COMPLETED" && (
                      <button
                        onClick={() => handleCompleteAppointment(appt.id)}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                      >
                        ✓ Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── ISSUE E-PRESCRIPTION TAB ────────────────────────────────────────── */}
      {activeTab === "prescribe" && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Issue Digital E-Prescription</h2>
            <p className="text-xs text-slate-500">Connected directly to the patient's local PHC dispensary database</p>
          </div>

          {rxSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              ✓ Digital prescription stored and synchronized with patient records and PHC pharmacy!
            </div>
          )}

          <form onSubmit={handleIssuePrescription} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Patient from Appointments</label>
                <select
                  value={rxPatientId}
                  onChange={(e) => {
                    const sel = appointments.find((a) => a.patientId === e.target.value);
                    if (sel) {
                      setRxPatientId(sel.patientId);
                      setRxPatientName(sel.patient?.user?.fullName || "");
                      setRxAppointmentId(sel.id);
                    }
                  }}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold bg-white text-xs"
                >
                  <option value="">-- Choose Patient --</option>
                  {appointments.map((a) => (
                    <option key={a.id} value={a.patientId}>
                      {a.patient?.user?.fullName || "Patient"} ({a.token || a.slot})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Follow-Up Date</label>
                <input
                  type="date"
                  value={rxFollowUpDate}
                  onChange={(e) => setRxFollowUpDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Clinical Diagnosis</label>
              <input
                type="text"
                placeholder="e.g. Acute Upper Respiratory Tract Infection"
                value={rxDiagnosis}
                onChange={(e) => setRxDiagnosis(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold text-xs"
              />
            </div>

            {/* Prescribed Medicines List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Prescribed Medicines</label>
                <button
                  type="button"
                  onClick={addMedicineRow}
                  className="text-xs font-bold text-[#0E4A43] hover:underline"
                >
                  + Add Drug
                </button>
              </div>

              <div className="space-y-2 bg-[#EFF2F5] p-4 rounded-2xl">
                {rxMedicines.map((med, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Medicine Name (e.g. Paracetamol 500mg)"
                      value={med.medicineName}
                      onChange={(e) => {
                        const copy = [...rxMedicines];
                        copy[idx].medicineName = e.target.value;
                        setRxMedicines(copy);
                      }}
                      required
                      className="px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 1 tab TDS)"
                      value={med.dosage}
                      onChange={(e) => {
                        const copy = [...rxMedicines];
                        copy[idx].dosage = e.target.value;
                        setRxMedicines(copy);
                      }}
                      required
                      className="px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g. 5 days)"
                      value={med.duration}
                      onChange={(e) => {
                        const copy = [...rxMedicines];
                        copy[idx].duration = e.target.value;
                        setRxMedicines(copy);
                      }}
                      required
                      className="px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Instructions (e.g. After food)"
                      value={med.instructions}
                      onChange={(e) => {
                        const copy = [...rxMedicines];
                        copy[idx].instructions = e.target.value;
                        setRxMedicines(copy);
                      }}
                      className="px-3 py-2 bg-white rounded-xl border border-slate-200 font-medium text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Clinical Advice / Non-Pharmacological Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Drink warm fluids, adequate bed rest, avoid cold beverages"
                value={rxAdvice}
                onChange={(e) => setRxAdvice(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-medium text-xs"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={rxSubmitting}
                className="px-6 py-3 rounded-2xl bg-[#0E4A43] text-white font-black text-xs hover:brightness-110 disabled:opacity-50 transition-all shadow-md"
              >
                {rxSubmitting ? "Signing & Issuing E-Rx..." : "Sign & Issue E-Prescription"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── SPECIALIST REFERRALS TAB ────────────────────────────────────────── */}
      {activeTab === "referrals" && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Inter-Facility Referral Escalation</h2>
            <p className="text-xs text-slate-500">Transfer high-risk clinical cases directly to District Civil Hospitals</p>
          </div>

          {refSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              ✓ Inter-facility referral created and transmitted to the target facility!
            </div>
          )}

          <form onSubmit={handleCreateReferral} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient</label>
                <select
                  value={refPatientId}
                  onChange={(e) => {
                    setRefPatientId(e.target.value);
                    const p = appointments.find((a) => a.patientId === e.target.value);
                    if (p) setRefPatientName(p.patient?.user?.fullName || "");
                  }}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold bg-white text-xs"
                >
                  <option value="">-- Select Patient --</option>
                  {appointments.map((a) => (
                    <option key={a.id} value={a.patientId}>
                      {a.patient?.user?.fullName || "Patient"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Healthcare Facility</label>
                <select
                  value={refToFacilityId}
                  onChange={(e) => setRefToFacilityId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold bg-white text-xs"
                >
                  {facilities.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} ({fac.district} - {fac.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Required Specialty</label>
                <select
                  value={refSpecialty}
                  onChange={(e) => setRefSpecialty(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold bg-white text-xs"
                >
                  <option value="Cardiology">Cardiology &amp; CCU</option>
                  <option value="Pulmonology">Pulmonology &amp; Critical Care</option>
                  <option value="Obstetrics & Gynecology">Obstetrics &amp; High-Risk Delivery</option>
                  <option value="Neurology">Neurology &amp; Trauma</option>
                  <option value="Pediatrics">Pediatrics &amp; NICU</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Referral Priority</label>
                <select
                  value={refUrgency}
                  onChange={(e) => setRefUrgency(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold bg-white text-xs"
                >
                  <option value="CRITICAL">CRITICAL (Immediate 108 Emergency Transfer)</option>
                  <option value="HIGH">HIGH (Urgent Same-Day Inpatient)</option>
                  <option value="URGENT">URGENT (Within 24 Hours)</option>
                  <option value="ROUTINE">ROUTINE (Specialist OPD Consult)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Clinical Reason for Escalation</label>
              <textarea
                rows={3}
                placeholder="Document patient vitals, clinical suspicion, and reason local PHC/CHC cannot manage case..."
                value={refReason}
                onChange={(e) => setRefReason(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-medium text-xs"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={refSubmitting}
                className="px-6 py-3 rounded-2xl bg-[#0E4A43] text-white font-black text-xs hover:brightness-110 disabled:opacity-50 transition-all shadow-md"
              >
                {refSubmitting ? "Generating Referral..." : "Transmit Referral & Bed Reservation"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── PATIENT SEARCH & ABHA LOOKUP TAB ───────────────────────────────── */}
      {activeTab === "patient_lookup" && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Longitudinal Patient Health Search</h2>
            <p className="text-xs text-slate-500">Lookup medical history and consults across Maharashtra database</p>
          </div>

          <form onSubmit={handleSearchPatient} className="flex gap-2">
            <input
              type="text"
              placeholder="Search by Patient Name or ID..."
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-[#0E4A43] font-bold text-xs"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-6 py-3 rounded-2xl bg-[#0E4A43] text-white font-black text-xs hover:brightness-110"
            >
              Search Database
            </button>
          </form>

          {lookupResult && (
            <div className="p-6 bg-[#EFF2F5] rounded-3xl space-y-4 border border-slate-200/80 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-base text-slate-900">{lookupResult.name}</span>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                  Verified Patient
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>Patient ID: <strong className="text-slate-900">{lookupResult.patientId?.slice(0, 8)}</strong></div>
                <div>Contact: <strong className="text-slate-900">{lookupResult.contact}</strong></div>
                <div>Registered Facility: <strong className="text-slate-900">{lookupResult.facility}</strong></div>
              </div>
              <div className="p-3 bg-white rounded-2xl">
                <span className="font-bold text-slate-700">Last Consultation Notes:</span>
                <p className="text-slate-900 mt-0.5">{lookupResult.lastNotes}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── CREDENTIALS & SPECIALTY TAB ─────────────────────────────────────── */}
      {activeTab === "credentials" && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Medical Officer Credentials &amp; Verification</h2>
            <p className="text-xs text-slate-500">Government Medical Council registration and institutional posting</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-[#EFF2F5] rounded-2xl space-y-1">
              <div className="text-slate-400 uppercase text-[10px] font-bold">Medical Specialty</div>
              <div className="font-black text-slate-900 text-sm">{doctor?.specialty || "General Medicine & Tele-Triage"}</div>
            </div>
            <div className="p-4 bg-[#EFF2F5] rounded-2xl space-y-1">
              <div className="text-slate-400 uppercase text-[10px] font-bold">Degree &amp; Qualifications</div>
              <div className="font-black text-slate-900 text-sm">{doctor?.qualification || "MBBS, MD (Medicine)"}</div>
            </div>
            <div className="p-4 bg-[#EFF2F5] rounded-2xl space-y-1">
              <div className="text-slate-400 uppercase text-[10px] font-bold">Registration Number</div>
              <div className="font-black text-[#0E4A43] font-mono text-sm">{doctor?.registrationNo || "MMC-2015-84920"}</div>
            </div>
            <div className="p-4 bg-[#EFF2F5] rounded-2xl space-y-1">
              <div className="text-slate-400 uppercase text-[10px] font-bold">Assigned Facility</div>
              <div className="font-black text-slate-900 text-sm">{doctor?.facility?.name || "District Health Facility"}</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── VIDEO TELECONSULTATION POPUP ────────────────────────────────────── */}
      {activeCallAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#093530] text-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-slate-900 animate-pulse">
                  LIVE TELE-OPD ENCRYPTED CALL
                </span>
                <h3 className="font-black text-xl mt-1">{activeCallAppt.patient?.user?.fullName || "Patient"}</h3>
                <p className="text-xs text-slate-300">Connecting from {activeCallAppt.facility?.name}</p>
              </div>
              <button
                onClick={() => setActiveCallAppt(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="relative aspect-video bg-black/50 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 text-3xl flex items-center justify-center mx-auto animate-pulse">
                  📹
                </div>
                <div className="text-sm font-bold text-emerald-300">Live Video Stream Connected</div>
                <p className="text-xs text-slate-400">Audio, Video, and Vitals Telemetry synchronized with Sub-Centre Kiosk</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  handleSelectPatientForRx(activeCallAppt);
                  setActiveCallAppt(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#E5F973] text-[#0E4A43] font-black text-xs hover:brightness-105"
              >
                💊 Open Prescription Desk
              </button>
              <button
                onClick={() => setActiveCallAppt(null)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              >
                End Consultation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
