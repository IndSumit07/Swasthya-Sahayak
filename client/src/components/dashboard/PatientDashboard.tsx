"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  profileApi,
  facilitiesApi,
  appointmentsApi,
  prescriptionsApi,
  referralsApi,
  diagnosticReportsApi,
  type UserProfile,
  type Facility,
  type Appointment,
  type Prescription,
  type Referral,
  type DiagnosticReport,
} from "@/lib/api";

const MAHARASHTRA_DISTRICTS = [
  "Ahmednagar","Akola","Amravati","Aurangabad","Beed","Bhandara","Buldhana","Chandrapur",
  "Dhule","Gadchiroli","Gondia","Hingoli","Jalgaon","Jalna","Kolhapur","Latur","Mumbai City",
  "Mumbai Suburban","Nagpur","Nanded","Nandurbar","Nashik","Osmanabad","Palghar","Parbhani",
  "Pune","Raigad","Ratnagiri","Sangli","Satara","Sindhudurg","Solapur","Thane","Wardha",
  "Washim","Yavatmal",
];

interface PatientDashboardProps {
  user: UserProfile;
  activeTab: string;
  setTab: (t: string) => void;
  onRefreshUser: () => void;
}

export function PatientDashboard({ user, activeTab, setTab, onRefreshUser }: PatientDashboardProps) {
  const patient = user.patient;

  // Profile Form State
  const [district, setDistrict] = useState(patient?.district ?? "Pune");
  const [village, setVillage] = useState(patient?.village ?? "");
  const [pincode, setPincode] = useState(patient?.pincode ?? "");
  const [abhaId, setAbhaId] = useState(patient?.abhaId ?? "");
  const [bloodGroup, setBloodGroup] = useState(patient?.bloodGroup ?? "O+");
  const [emergencyName, setEmergencyName] = useState(patient?.emergencyContactName ?? "");
  const [emergencyPhone, setEmergencyPhone] = useState(patient?.emergencyContactPhone ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Live Database States
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [labReports, setLabReports] = useState<DiagnosticReport[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Appointment Booking Modal State
  const [showApptModal, setShowApptModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState("");
  const [apptType, setApptType] = useState<"IN_PERSON" | "TELE_OPD">("IN_PERSON");
  const [appDate, setAppDate] = useState(new Date().toISOString().split("T")[0]);
  const [appSlot, setAppSlot] = useState("10:00 AM - 11:00 AM");
  const [appNotes, setAppNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Load Real Data from DB
  const loadDatabaseRecords = async () => {
    setLoadingData(true);
    try {
      const [facRes, apptRes, rxRes, refRes, diagRes] = await Promise.allSettled([
        facilitiesApi.list(),
        appointmentsApi.list({ patientId: patient?.id }),
        prescriptionsApi.list({ patientId: patient?.id }),
        referralsApi.list({ patientId: patient?.id }),
        diagnosticReportsApi.list({ patientId: patient?.id }),
      ]);

      if (facRes.status === "fulfilled" && facRes.value.success) {
        setFacilities(facRes.value.data.facilities);
        if (facRes.value.data.facilities.length > 0 && !selectedFacility) {
          setSelectedFacility(facRes.value.data.facilities[0].id);
        }
      }
      if (apptRes.status === "fulfilled" && apptRes.value.success) {
        setAppointments(apptRes.value.data);
      }
      if (rxRes.status === "fulfilled" && rxRes.value.success) {
        setPrescriptions(rxRes.value.data);
      }
      if (refRes.status === "fulfilled" && refRes.value.success) {
        setReferrals(refRes.value.data);
      }
      if (diagRes.status === "fulfilled" && diagRes.value.success) {
        setLabReports(diagRes.value.data);
      }
    } catch (err) {
      console.error("Failed to load patient records from DB:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadDatabaseRecords();
  }, [patient?.id]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await profileApi.step1({
        district,
        village,
        pincode,
        abhaId,
        bloodGroup,
        emergencyContactName: emergencyName,
        emergencyContactPhone: emergencyPhone,
      });
      setProfileMsg({ type: "success", text: "Health profile synchronized with ABHA & District Registry successfully!" });
      onRefreshUser();
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacility || !appDate) return;
    setBookingLoading(true);
    try {
      await appointmentsApi.create({
        patientId: patient?.id,
        facilityId: selectedFacility,
        type: apptType,
        appointmentDate: appDate,
        slot: appSlot,
        notes: appNotes,
      });
      setBookingSuccess(true);
      await loadDatabaseRecords();
      setTimeout(() => {
        setShowApptModal(false);
        setBookingSuccess(false);
        setAppNotes("");
      }, 1200);
    } catch (err: any) {
      alert(err.message || "Failed to book appointment.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await appointmentsApi.updateStatus(id, "CANCELLED");
      await loadDatabaseRecords();
    } catch (err: any) {
      alert(err.message || "Failed to cancel appointment.");
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* ─── OVERVIEW TAB ────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Top Welcome / ABHA Health Card */}
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#0E4A43] via-[#093530] to-[#041c19] p-8 text-white shadow-xl">
            <div className="absolute right-0 top-0 w-96 h-96 bg-[#E5F973]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[#E5F973] text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-[#E5F973] animate-pulse" />
                  Ayushman Bharat Digital Mission (ABDM) Card
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{user.fullName}</h1>
                <p className="text-slate-300 text-sm max-w-xl">
                  Digital Health Portal — Government of Maharashtra. Access verified health records, queue tokens, and PHC medicine stocks.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
                  <div className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10">
                    ABHA ID: <strong className="text-[#E5F973] tracking-widest font-mono ml-1">{patient?.abhaId || "91-XXXX-XXXX-XXXX"}</strong>
                  </div>
                  <div className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10">
                    District: <strong className="text-white ml-1">{patient?.district || "Maharashtra"}</strong>
                  </div>
                  <div className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10">
                    Blood Group: <strong className="text-white ml-1">{patient?.bloodGroup || "Not Set"}</strong>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2.5 shrink-0">
                <button
                  onClick={() => setShowApptModal(true)}
                  className="px-5 py-3 rounded-2xl bg-[#E5F973] text-[#0E4A43] font-black text-sm hover:brightness-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Book OPD Appointment
                </button>
                <Link
                  href="/facilities"
                  className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/15 transition-all text-center"
                >
                  Find Nearby Facilities &amp; Beds
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div
              onClick={() => setTab("appointments")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                📅
              </div>
              <div className="text-2xl font-black text-slate-900">{appointments.length}</div>
              <div className="text-xs font-bold text-slate-500">Upcoming Appointments</div>
            </div>
            <div
              onClick={() => setTab("prescriptions")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                💊
              </div>
              <div className="text-2xl font-black text-slate-900">{prescriptions.length}</div>
              <div className="text-xs font-bold text-slate-500">Active Prescriptions</div>
            </div>
            <div
              onClick={() => setTab("referrals")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                🔄
              </div>
              <div className="text-2xl font-black text-slate-900">{referrals.length}</div>
              <div className="text-xs font-bold text-slate-500">Inter-Facility Referrals</div>
            </div>
            <div
              onClick={() => setTab("lab_reports")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                🧪
              </div>
              <div className="text-2xl font-black text-slate-900">{labReports.length}</div>
              <div className="text-xs font-bold text-slate-500">Lab Diagnostic Reports</div>
            </div>
          </div>

          {/* Active Appointments & Teleconsultations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Upcoming Appointments &amp; Consultations</h2>
                <p className="text-xs text-slate-700">Digital OPD tokens and scheduled clinic visits</p>
              </div>
              <button
                onClick={() => setShowApptModal(true)}
                className="text-xs font-black text-[#0E4A43] hover:underline"
              >
                + Book New Slot
              </button>
            </div>

            {loadingData ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 text-sm text-slate-500 font-bold">
                Loading appointments from database...
              </div>
            ) : appointments.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-2xl">📅</div>
                <div className="text-slate-900 font-bold text-sm">No Appointments Scheduled</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You do not have any pending appointments. Click below to book an in-person OPD token or virtual teleconsultation.
                </p>
                <button
                  onClick={() => setShowApptModal(true)}
                  className="px-4 py-2 bg-[#0E4A43] text-white rounded-xl text-xs font-bold hover:brightness-110"
                >
                  Book Appointment Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-100 text-emerald-800">
                        {appt.status}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-400">{appt.token || "Queue Token Pending"}</span>
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-base">{appt.facility?.name || "Facility Appointment"}</h3>
                      <p className="text-xs text-slate-500">{appt.doctor ? `Dr. ${appt.doctor.user?.fullName}` : "Medical Officer Duty Officer"}</p>
                    </div>
                    <div className="p-3 bg-[#EFF2F5] rounded-2xl flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Type: <strong className="text-slate-900">{appt.type === "TELE_OPD" ? "Virtual Tele-OPD" : "In-Person OPD"}</strong></span>
                      <span>Date: <strong className="text-[#0E4A43]">{new Date(appt.appointmentDate).toLocaleDateString()} ({appt.slot})</strong></span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/facilities/${appt.facilityId}`}
                        className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs text-center transition-colors"
                      >
                        Facility Route &amp; Beds
                      </Link>
                      {appt.status !== "CANCELLED" && (
                        <button
                          onClick={() => handleCancelAppointment(appt.id)}
                          className="px-3 py-2.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── APPOINTMENTS TAB ─────────────────────────────────────────────────── */}
      {activeTab === "appointments" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">OPD Appointments &amp; Virtual Teleconsultations</h2>
              <p className="text-xs text-slate-500">Live tokens and scheduled consultations across Maharashtra facilities</p>
            </div>
            <button
              onClick={() => setShowApptModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#0E4A43] text-white font-bold text-xs hover:brightness-110 transition-all flex items-center gap-2 shadow-xs"
            >
              + Book New Appointment
            </button>
          </div>

          {loadingData ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 text-sm text-slate-500 font-bold">
              Loading appointments from database...
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-2xl">📅</div>
              <div className="text-slate-900 font-bold text-base">No Appointments Found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active or past appointments recorded for your profile. Book a slot at your local PHC or District Hospital.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-emerald-100 text-emerald-800">
                        {appt.status}
                      </span>
                      <span className="text-xs font-bold text-slate-400 font-mono">{appt.token || "Queue Token Pending"}</span>
                    </div>
                    <h3 className="font-black text-slate-900 text-base">{appt.facility?.name || "Facility Appointment"}</h3>
                    <p className="text-xs text-slate-500">
                      {appt.doctor ? `Assigned Doctor: Dr. ${appt.doctor.user?.fullName}` : "General Medical Officer"} • {appt.type === "TELE_OPD" ? "Virtual Tele-OPD Video" : "In-Person Consultation"}
                    </p>
                    <p className="text-xs font-bold text-[#0E4A43]">
                      Scheduled: {new Date(appt.appointmentDate).toLocaleDateString()} ({appt.slot})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/facilities/${appt.facilityId}`}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                    >
                      View Facility
                    </Link>
                    {appt.status !== "CANCELLED" && (
                      <button
                        onClick={() => handleCancelAppointment(appt.id)}
                        className="px-4 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs transition-colors"
                      >
                        Cancel Slot
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── PRESCRIPTIONS (E-Rx) TAB ────────────────────────────────────────── */}
      {activeTab === "prescriptions" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Digital E-Prescriptions &amp; PHC Pharmacy Stocks</h2>
            <p className="text-xs text-slate-500">Verified doctor prescriptions with live medicine availability check at your nearest dispensary</p>
          </div>

          {loadingData ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 text-sm text-slate-500 font-bold">
              Loading prescriptions from database...
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-2xl">💊</div>
              <div className="text-slate-900 font-bold text-base">No Prescriptions Issued</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active e-prescriptions recorded. When a doctor issues a prescription during your OPD consultation, it will appear here with live stock indicators.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {prescriptions.map((rx) => (
                <div key={rx.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-400">Prescription #{rx.id.slice(0, 8)}</span>
                      <h3 className="font-black text-slate-900 text-base">Diagnosis: {rx.diagnosis}</h3>
                      <p className="text-xs text-slate-500">
                        Prescribed by {rx.doctor ? `Dr. ${rx.doctor.user?.fullName}` : "Medical Officer"} • {rx.facility?.name} • {new Date(rx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      href={`/facilities/${rx.facilityId}`}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200 self-start sm:self-center"
                    >
                      Check PHC Pharmacy Stock
                    </Link>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Prescribed Medicines</h4>
                    <div className="divide-y divide-slate-100 bg-[#EFF2F5] rounded-2xl p-4">
                      {rx.items?.map((med, idx) => (
                        <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-black text-slate-900">{med.medicineName}</span>
                            <span className="text-slate-500 ml-2">({med.dosage}, {med.duration})</span>
                            {med.instructions && <p className="text-[11px] text-slate-400 mt-0.5">{med.instructions}</p>}
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            med.inStock ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {med.inStock ? "In Stock at PHC" : "Low Stock / Request"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {rx.advice && (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                      <strong>Doctor Advice:</strong> {rx.advice}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── REFERRALS TAB ───────────────────────────────────────────────────── */}
      {activeTab === "referrals" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Inter-Facility Referrals &amp; Transfers</h2>
            <p className="text-xs text-slate-500">Track high-priority escalations and reserved beds at District Civil Hospitals</p>
          </div>

          {loadingData ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 text-sm text-slate-500 font-bold">
              Loading referrals from database...
            </div>
          ) : referrals.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-2xl">🔄</div>
              <div className="text-slate-900 font-bold text-base">No Referrals Active</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You do not have any active inter-facility referrals. When a medical officer refers you to a higher facility, track live status here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {referrals.map((ref) => (
                <div key={ref.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-blue-100 text-blue-800">
                      {ref.status}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-red-100 text-red-800">
                      Priority: {ref.priority}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#EFF2F5] rounded-2xl text-xs">
                    <div>
                      <div className="text-slate-400 font-bold uppercase text-[10px]">Referred From</div>
                      <div className="font-black text-slate-900 mt-1">{ref.fromFacility?.name || "Sub-Centre"}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-bold uppercase text-[10px]">Target Center</div>
                      <div className="font-black text-[#0E4A43] mt-1">{ref.toFacility?.name || "District Hospital"}</div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 space-y-1">
                    <div>Reason: <strong className="text-slate-900">{ref.reason}</strong></div>
                    {ref.requiredSpecialty && <div>Required Specialty: <strong className="text-slate-900">{ref.requiredSpecialty}</strong></div>}
                    {ref.notes && <div>Clinical Notes: <strong className="text-slate-900">{ref.notes}</strong></div>}
                    <div className="text-[11px] text-slate-400 pt-1">Referred on {new Date(ref.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── LAB DIAGNOSTIC REPORTS TAB ──────────────────────────────────────── */}
      {activeTab === "lab_reports" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Diagnostic Reports &amp; Pathology Tests</h2>
            <p className="text-xs text-slate-500">Download and review verified lab test results from government pathology centers</p>
          </div>

          {loadingData ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 text-sm text-slate-500 font-bold">
              Loading diagnostic reports from database...
            </div>
          ) : labReports.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-2xl">🧪</div>
              <div className="text-slate-900 font-bold text-base">No Diagnostic Reports Found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No lab test reports recorded yet. Blood tests, radiology scans, and pathology results will be synced here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {labReports.map((lab) => (
                <div key={lab.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-base text-slate-900">{lab.testName}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                      {lab.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{lab.facility?.name} • {new Date(lab.createdAt).toLocaleDateString()}</p>
                  <div className="p-3 bg-[#EFF2F5] rounded-xl text-xs space-y-1">
                    <div className="font-bold text-slate-900">{lab.keyResult}</div>
                    {lab.findings && <div className="text-slate-600 text-[11px]">{lab.findings}</div>}
                    {lab.normalRange && <div className="text-slate-400 text-[10px]">Reference Range: {lab.normalRange}</div>}
                  </div>
                  {lab.verifiedBy && (
                    <p className="text-[10px] text-slate-400">Verified by: {lab.verifiedBy}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── PROFILE & ABHA SETTINGS TAB ─────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Demographic Profile &amp; ABHA Credentials</h2>
            <p className="text-xs text-slate-500">Maintain updated contact and emergency details for government healthcare outreach</p>
          </div>

          {profileMsg && (
            <div className={`p-4 rounded-2xl text-xs font-bold ${
              profileMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={user.fullName}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-xs font-bold cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-xs font-bold cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">14-Digit ABHA ID</label>
                <input
                  type="text"
                  placeholder="91-XXXX-XXXX-XXXX"
                  value={abhaId}
                  onChange={(e) => setAbhaId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] text-xs font-bold bg-white"
                >
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">District</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] text-xs font-bold bg-white"
                >
                  {MAHARASHTRA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Village / Taluka</label>
                <input
                  type="text"
                  placeholder="e.g. Ambegaon, Junnar"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
                <input
                  type="text"
                  placeholder="e.g. 411046"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Person</label>
                <input
                  type="text"
                  placeholder="Relative / Guardian Name"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Phone</label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] text-xs font-bold"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-3 rounded-2xl bg-[#0E4A43] text-white font-black text-xs hover:brightness-110 disabled:opacity-50 transition-all shadow-md"
              >
                {savingProfile ? "Saving Profile..." : "Update Health Profile"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── BOOK APPOINTMENT MODAL ──────────────────────────────────────────── */}
      {showApptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-slate-900">Book OPD Appointment / Teleconsult</h3>
                <p className="text-xs text-slate-500">Select facility and preferred consultation mode</p>
              </div>
              <button
                onClick={() => setShowApptModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {bookingSuccess ? (
              <div className="p-8 text-center space-y-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 text-2xl flex items-center justify-center mx-auto">✓</div>
                <h4 className="font-black text-slate-900 text-base">Appointment Booked!</h4>
                <p className="text-xs text-slate-600">Your slot is confirmed and synced with the hospital queue.</p>
              </div>
            ) : (
              <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Facility</label>
                  <select
                    value={selectedFacility}
                    onChange={(e) => setSelectedFacility(e.target.value)}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Consultation Mode</label>
                    <select
                      value={apptType}
                      onChange={(e) => setApptType(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold bg-white text-xs"
                    >
                      <option value="IN_PERSON">In-Person OPD</option>
                      <option value="TELE_OPD">Virtual Tele-OPD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Appointment Date</label>
                    <input
                      type="date"
                      value={appDate}
                      onChange={(e) => setAppDate(e.target.value)}
                      required
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time Slot</label>
                  <select
                    value={appSlot}
                    onChange={(e) => setAppSlot(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-bold bg-white text-xs"
                  >
                    <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
                    <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                    <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                    <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                    <option value="03:00 PM - 04:00 PM">03:00 PM - 04:00 PM</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reason for Visit / Symptoms (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Seasonal cough, fever, follow-up blood pressure check"
                    value={appNotes}
                    onChange={(e) => setAppNotes(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-[#0E4A43] font-medium text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowApptModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="px-6 py-2.5 rounded-xl bg-[#0E4A43] text-white font-bold hover:brightness-110 disabled:opacity-50 shadow-md"
                  >
                    {bookingLoading ? "Confirming Slot..." : "Confirm Booking"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
