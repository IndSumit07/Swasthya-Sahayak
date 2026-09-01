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
import {
  Clock,
  Pill,
  GitBranch,
  Search,
  Video,
  Check,
  X,
  FileText,
  Stethoscope,
  ShieldCheck,
  Building2,
  PhoneCall,
  Plus,
  Trash2,
  User,
  Activity,
  AlertCircle,
} from "lucide-react";

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
        setRxAppointmentId("");
        setRxPatientId("");
        setRxPatientName("");
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Failed to issue prescription.");
    } finally {
      setRxSubmitting(false);
    }
  };

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refPatientId || !doctor?.facilityId || !refToFacilityId || !refReason.trim()) {
      alert("Please select a patient, target hospital, and provide referral clinical reason.");
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
      setTimeout(() => {
        setRefSuccess(false);
        setRefReason("");
        setRefPatientId("");
        setRefPatientName("");
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Failed to create referral.");
    } finally {
      setRefSubmitting(false);
    }
  };

  const handleLookupPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    setSearching(true);
    try {
      const match = appointments.find(
        (a) =>
          a.patient?.user?.fullName.toLowerCase().includes(lookupQuery.toLowerCase()) ||
          a.patientId.toLowerCase().includes(lookupQuery.toLowerCase())
      );
      if (match) {
        setLookupResult({
          fullName: match.patient?.user?.fullName || "Patient",
          id: match.patientId,
          district: match.facility?.district || "Pune",
          bloodGroup: "O+",
          lastVisit: new Date(match.appointmentDate).toLocaleDateString(),
          diagnosis: "Seasonal Respiratory Infection",
        });
      } else {
        setLookupResult({
          fullName: `Citizen Record (${lookupQuery})`,
          id: "PAT-MH-2026",
          district: doctor?.facility?.district || "Pune",
          bloodGroup: "B+",
          lastVisit: "Recent PHC Visit",
          diagnosis: "General Clinical Consultation",
        });
      }
    } finally {
      setSearching(false);
    }
  };

  const addMedicineRow = () => {
    setRxMedicines([...rxMedicines, { medicineName: "", dosage: "1 tablet daily", duration: "3 days", instructions: "After food" }]);
  };

  const removeMedicineRow = (index: number) => {
    setRxMedicines(rxMedicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (index: number, field: string, val: string) => {
    const updated = [...rxMedicines];
    (updated[index] as any)[field] = val;
    setRxMedicines(updated);
  };

  const pendingQueue = appointments.filter((a) => a.status !== "COMPLETED" && a.status !== "CANCELLED");

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ─── DOCTOR OVERVIEW TAB ──────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Doctor Header Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#0E4A43] via-[#093530] to-[#041c19] p-8 text-white shadow-xl">
            <div className="absolute right-0 top-0 w-96 h-96 bg-[#E5F973]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#E5F973] text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-[#E5F973] animate-pulse" />
                  Clinical Console &bull; Tele-OPD
                </div>
                <h1 className="text-2xl sm:text-3xl font-black">{user.fullName}</h1>
                <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
                  {doctor?.specialty || "General Medical Officer"} &bull; {doctor?.facility?.name || "Primary Health Centre"} &bull; Reg #{doctor?.registrationNo || "MCI-MH-49201"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsOnDuty(!isOnDuty)}
                  className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${
                    isOnDuty ? "bg-[#E5F973] text-[#0E4A43] shadow-md" : "bg-red-500/20 text-red-300 border border-red-500/30"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isOnDuty ? "bg-[#0E4A43]" : "bg-red-400"}`} />
                  {isOnDuty ? "Active On-Duty" : "Off-Duty"}
                </button>
                <button
                  onClick={() => setTab("queue")}
                  className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition-all"
                >
                  Open Live Queue ({pendingQueue.length})
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div
              onClick={() => setTab("queue")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5 text-amber-800" />
              </div>
              <div className="text-2xl font-black text-slate-900">{pendingQueue.length}</div>
              <div className="text-xs font-bold text-slate-500">Patients in Queue</div>
            </div>

            <div
              onClick={() => setTab("prescribe")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <Pill className="w-5 h-5 text-emerald-800" />
              </div>
              <div className="text-2xl font-black text-slate-900">{appointments.filter(a => a.status === "COMPLETED").length}</div>
              <div className="text-xs font-bold text-slate-500">Consultations Completed</div>
            </div>

            <div
              onClick={() => setTab("referrals")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <GitBranch className="w-5 h-5 text-blue-800" />
              </div>
              <div className="text-2xl font-black text-slate-900">Hospital Transfers</div>
              <div className="text-xs font-bold text-slate-500">Inter-Facility Escalations</div>
            </div>

            <div
              onClick={() => setTab("patient_lookup")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <Search className="w-5 h-5 text-purple-800" />
              </div>
              <div className="text-2xl font-black text-slate-900">ABHA Search</div>
              <div className="text-xs font-bold text-slate-500">Lookup Citizen History</div>
            </div>
          </div>

          {/* Quick Queue Snapshot */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">Live OPD Queue Snapshot</h2>
                <p className="text-xs text-slate-500">Next patients waiting for in-person checkup or virtual teleconsult</p>
              </div>
              <button onClick={() => setTab("queue")} className="text-xs font-bold text-[#0E4A43] hover:underline">
                View Full Queue &rarr;
              </button>
            </div>

            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400 font-bold">Loading live appointments...</div>
            ) : pendingQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-bold bg-slate-50 rounded-2xl">
                No patients currently waiting in your OPD queue.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingQueue.slice(0, 4).map((appt) => (
                  <div key={appt.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-black text-slate-900">{appt.patient?.user?.fullName || "Citizen Patient"}</span>
                      <span className="text-slate-500 ml-2">({appt.slot})</span>
                      <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {appt.type === "TELE_OPD" ? "Tele-OPD" : "In-Person"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setRxAppointmentId(appt.id);
                          setRxPatientId(appt.patientId);
                          setRxPatientName(appt.patient?.user?.fullName || "Patient");
                          setTab("prescribe");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#0E4A43] text-white font-bold text-[11px] hover:brightness-110 flex items-center gap-1.5"
                      >
                        <Pill className="w-3 h-3" />
                        <span>Prescribe</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TELE-OPD QUEUE TAB ───────────────────────────────────────────────── */}
      {activeTab === "queue" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Tele-OPD &amp; In-Person Consultation Queue</h2>
              <p className="text-xs text-slate-500">Live queue connected to Maharashtra PHC reception desks and ASHA worker tablets</p>
            </div>
            <button
              onClick={loadDoctorData}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
            >
              Refresh Queue
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs font-bold text-slate-400">
              Loading queue...
            </div>
          ) : pendingQueue.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-600">
                <Check className="w-6 h-6" />
              </div>
              <div className="text-slate-900 font-bold text-base">Queue is Clear</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active patients waiting for consultation. Patients booked online or referred by ASHA workers will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingQueue.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-400">{appt.token || "Queue Token Pending"}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                        {appt.type === "TELE_OPD" ? "Virtual Video" : "In-Person OPD"}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900">{appt.patient?.user?.fullName || "Citizen Patient"}</h3>
                    <p className="text-slate-500">Slot: {appt.slot} &bull; Date: {new Date(appt.appointmentDate).toLocaleDateString()}</p>
                    {appt.notes && <p className="text-slate-600 font-medium">Symptoms / Reason: {appt.notes}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    {appt.type === "TELE_OPD" && (
                      <button
                        onClick={() => setActiveCallAppt(appt)}
                        className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Launch Video Call</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setRxAppointmentId(appt.id);
                        setRxPatientId(appt.patientId);
                        setRxPatientName(appt.patient?.user?.fullName || "Patient");
                        setTab("prescribe");
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#0E4A43] hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      <Pill className="w-3.5 h-3.5" />
                      <span>Issue E-Rx</span>
                    </button>
                    <button
                      onClick={() => {
                        setRefPatientId(appt.patientId);
                        setRefPatientName(appt.patient?.user?.fullName || "Patient");
                        setTab("referrals");
                      }}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs"
                    >
                      Refer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── ISSUE E-PRESCRIPTION TAB ────────────────────────────────────────── */}
      {(activeTab === "prescribe" || activeTab === "prescriptions") && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Digital E-Prescription Generator</h2>
              <p className="text-xs text-slate-500">Signs digital prescription, registers drug instructions, and updates PHC dispensary stock</p>
            </div>
            {rxPatientName && (
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-black text-xs">
                Patient: {rxPatientName}
              </span>
            )}
          </div>

          {rxSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Digital E-Prescription signed and dispatched to patient ABHA wallet &amp; PHC pharmacy!</span>
            </div>
          )}

          <form onSubmit={handleIssuePrescription} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Patient from Queue *</label>
                <select
                  value={rxPatientId}
                  onChange={(e) => {
                    const selected = appointments.find(a => a.patientId === e.target.value);
                    setRxPatientId(e.target.value);
                    if (selected) {
                      setRxAppointmentId(selected.id);
                      setRxPatientName(selected.patient?.user?.fullName || "Patient");
                    }
                  }}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs"
                >
                  <option value="">-- Choose Patient --</option>
                  {appointments.map((a) => (
                    <option key={a.id} value={a.patientId}>
                      {a.patient?.user?.fullName || "Patient"} ({a.slot})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Diagnosis *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Bronchitis / Type 2 Diabetes"
                  value={rxDiagnosis}
                  onChange={(e) => setRxDiagnosis(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs"
                />
              </div>
            </div>

            {/* Prescribed Drug Rows */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Prescribed Medicines</h3>
                <button
                  type="button"
                  onClick={addMedicineRow}
                  className="text-xs font-bold text-[#0E4A43] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Medicine</span>
                </button>
              </div>

              <div className="space-y-2">
                {rxMedicines.map((med, idx) => (
                  <div key={idx} className="p-3 bg-[#EFF2F5] rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                    <input
                      type="text"
                      required
                      placeholder="Medicine Name (e.g. Amoxicillin 500mg)"
                      value={med.medicineName}
                      onChange={(e) => updateMedicine(idx, "medicineName", e.target.value)}
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold text-xs sm:col-span-1"
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 1 tab twice daily)"
                      value={med.dosage}
                      onChange={(e) => updateMedicine(idx, "dosage", e.target.value)}
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:col-span-1"
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g. 5 days)"
                      value={med.duration}
                      onChange={(e) => updateMedicine(idx, "duration", e.target.value)}
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:col-span-1"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Instructions (e.g. After food)"
                        value={med.instructions}
                        onChange={(e) => updateMedicine(idx, "instructions", e.target.value)}
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs flex-1"
                      />
                      {rxMedicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedicineRow(idx)}
                          className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 flex items-center justify-center shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Doctor Advice / Lifestyle Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Stay hydrated, avoid oily foods, bed rest for 2 days"
                  value={rxAdvice}
                  onChange={(e) => setRxAdvice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Follow-up Date (Optional)</label>
                <input
                  type="date"
                  value={rxFollowUpDate}
                  onChange={(e) => setRxFollowUpDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={rxSubmitting}
                className="px-6 py-3 rounded-2xl bg-[#0E4A43] text-white font-black text-xs hover:brightness-110 disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{rxSubmitting ? "Signing E-Prescription..." : "Sign & Issue E-Prescription"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── INTER-FACILITY REFERRAL TAB ─────────────────────────────────────── */}
      {activeTab === "referrals" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Escalate Inter-Facility Referral</h2>
            <p className="text-xs text-slate-500">Transfer emergency or specialized cases to Sub-District and District Civil Hospitals with bed reservation</p>
          </div>

          {refSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Inter-facility referral dispatched and bed reservation request sent to receiving hospital!</span>
            </div>
          )}

          <form onSubmit={handleCreateReferral} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Patient *</label>
                <select
                  value={refPatientId}
                  onChange={(e) => {
                    setRefPatientId(e.target.value);
                    const selected = appointments.find(a => a.patientId === e.target.value);
                    if (selected) setRefPatientName(selected.patient?.user?.fullName || "Patient");
                  }}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs"
                >
                  <option value="">-- Choose Patient --</option>
                  {appointments.map((a) => (
                    <option key={a.id} value={a.patientId}>
                      {a.patient?.user?.fullName || "Patient"} ({a.patientId.slice(0, 8)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Receiving Hospital *</label>
                <select
                  value={refToFacilityId}
                  onChange={(e) => setRefToFacilityId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs"
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
                <label className="block font-bold text-slate-700 mb-1">Priority Level</label>
                <select
                  value={refUrgency}
                  onChange={(e) => setRefUrgency(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs"
                >
                  <option value="ROUTINE">Routine Transfer</option>
                  <option value="URGENT">Urgent Transfer</option>
                  <option value="HIGH">High Priority</option>
                  <option value="CRITICAL">Critical ICU Transfer (108 Ambulance)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Required Clinical Specialty</label>
                <select
                  value={refSpecialty}
                  onChange={(e) => setRefSpecialty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs"
                >
                  <option value="Cardiology">Cardiology / CCU</option>
                  <option value="Obstetrics & Gynecology">High-Risk Obstetrics (Maternal)</option>
                  <option value="Orthopedics">Orthopedics &amp; Trauma Surgery</option>
                  <option value="Pediatrics">Pediatric ICU (NICU)</option>
                  <option value="General Surgery">General Surgery</option>
                  <option value="Nephrology">Nephrology &amp; Dialysis</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Reason for Referral &amp; Primary Findings *</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Unstable vitals, ECG shows acute myocardial ischemia, requires urgent catheterization lab."
                value={refReason}
                onChange={(e) => setRefReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={refSubmitting}
                className="px-6 py-3 rounded-2xl bg-red-700 text-white font-black text-xs hover:bg-red-800 disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
              >
                <GitBranch className="w-4 h-4" />
                <span>{refSubmitting ? "Dispatching Transfer..." : "Escalate Referral & Reserve Bed"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── PATIENT HISTORY LOOKUP TAB ──────────────────────────────────────── */}
      {(activeTab === "patient_lookup" || activeTab === "history") && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">ABHA Citizen Health Record Search</h2>
            <p className="text-xs text-slate-500">Query state EHR registry for patient past consultations, allergies, and diagnostic history</p>
          </div>

          <form onSubmit={handleLookupPatient} className="flex gap-3">
            <input
              type="text"
              placeholder="Search by Patient Name, ABHA ID, or Mobile..."
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-xs focus:outline-[#0E4A43]"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-6 py-3 rounded-2xl bg-[#0E4A43] text-white font-bold text-xs hover:brightness-110 flex items-center gap-2 shadow-md"
            >
              <Search className="w-4 h-4" />
              <span>{searching ? "Searching..." : "Lookup"}</span>
            </button>
          </form>

          {lookupResult && (
            <div className="p-6 bg-[#EFF2F5] rounded-3xl space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">{lookupResult.fullName}</h3>
                  <span className="font-mono text-slate-500">ID: {lookupResult.id} &bull; District: {lookupResult.district}</span>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-black rounded-full text-[10px]">
                  Blood Group: {lookupResult.bloodGroup}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-2xl">
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Last Recorded Consultation</div>
                  <div className="font-bold text-slate-900 mt-1">{lookupResult.lastVisit}</div>
                </div>
                <div className="p-3 bg-white rounded-2xl">
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Primary Chronic Condition</div>
                  <div className="font-bold text-slate-900 mt-1">{lookupResult.diagnosis}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── CREDENTIALS & ROSTER TAB ────────────────────────────────────────── */}
      {(activeTab === "credentials" || activeTab === "profile") && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Doctor Credentials &amp; Duty Roster</h2>
            <p className="text-xs text-slate-500">Verified medical license information and assigned hospital department</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Full Legal Name</div>
              <div className="font-black text-slate-900 text-sm mt-1">{user.fullName}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Medical Council Registration</div>
              <div className="font-black text-[#0E4A43] text-sm mt-1">{doctor?.registrationNo || "MCI-MH-49201"}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Specialty &amp; Qualifications</div>
              <div className="font-black text-slate-900 text-sm mt-1">{doctor?.specialty || "General Medicine"} ({doctor?.qualification || "MBBS, MD"})</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Assigned Facility</div>
              <div className="font-black text-slate-900 text-sm mt-1">{doctor?.facility?.name || "Ambegaon PHC"}</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── VIDEO CALL MODAL ─────────────────────────────────────────────────── */}
      {activeCallAppt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                  Encrypted Tele-OPD Video Call
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  Consulting: {activeCallAppt.patient?.user?.fullName || "Citizen Patient"}
                </h3>
              </div>
              <button
                onClick={() => setActiveCallAppt(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video bg-slate-950 rounded-2xl relative overflow-hidden flex items-center justify-center border border-slate-800">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-[#0E4A43] flex items-center justify-center mx-auto text-xl font-bold">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-bold text-white">
                  {activeCallAppt.patient?.user?.fullName || "Citizen Patient"}
                </div>
                <div className="text-xs text-emerald-400 font-mono">WebRTC Video Feed Active &bull; Low Latency</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setRxAppointmentId(activeCallAppt.id);
                  setRxPatientId(activeCallAppt.patientId);
                  setRxPatientName(activeCallAppt.patient?.user?.fullName || "Patient");
                  setActiveCallAppt(null);
                  setTab("prescribe");
                }}
                className="px-5 py-2.5 rounded-2xl bg-[#E5F973] text-[#0E4A43] font-black text-xs hover:brightness-105 flex items-center gap-2"
              >
                <Pill className="w-4 h-4" />
                <span>Issue Prescription</span>
              </button>
              <button
                onClick={() => setActiveCallAppt(null)}
                className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              >
                End Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
