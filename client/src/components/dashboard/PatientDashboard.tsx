"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { profileApi, facilitiesApi, type UserProfile, type Facility } from "@/lib/api";

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

  // Appointment Booking Modal State
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [showApptModal, setShowApptModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState("");
  const [apptType, setApptType] = useState("IN_PERSON");
  const [appDate, setAppDate] = useState(new Date().toISOString().split("T")[0]);
  const [appSlot, setAppSlot] = useState("10:00 AM - 11:00 AM");
  const [appNotes, setAppNotes] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Demo user data states (stored in local state for seamless interactive demo)
  const [appointments, setAppointments] = useState([
    {
      id: "APT-2026-001",
      facilityName: "Primary Health Centre (PHC) Manchar",
      doctorName: "Dr. Ananya Kulkarni (General Medicine)",
      type: "In-Person OPD",
      date: "Tomorrow, 10:30 AM",
      status: "Confirmed",
      token: "Token #14",
    },
  ]);

  const [prescriptions, setPrescriptions] = useState([
    {
      id: "RX-8821",
      doctorName: "Dr. Sachin Deshmukh (Medical Officer)",
      facility: "Sub-District Hospital Junnar",
      date: "28 Aug 2026",
      diagnosis: "Acute Upper Respiratory Infection & Mild Fever",
      medicines: [
        { name: "Paracetamol 500mg", dose: "1 tablet thrice daily after food", duration: "5 days", inStock: true },
        { name: "Amoxicillin 500mg", dose: "1 capsule twice daily", duration: "5 days", inStock: true },
        { name: "Cetirizine 10mg", dose: "1 tablet at bedtime", duration: "3 days", inStock: true },
      ],
    },
  ]);

  const [referrals, setReferrals] = useState([
    {
      id: "REF-MAH-9021",
      fromFacility: "Sub-Centre Ambegaon",
      toFacility: "Sassoon General Hospital (District Hospital Pune)",
      specialty: "Radiology & Sonography USG",
      priority: "URGENT",
      status: "Bed & Slot Reserved",
      referredOn: "30 Aug 2026",
      notes: "Routine antenatal anomaly scan & maternal follow-up",
    },
  ]);

  const [labReports, setLabReports] = useState([
    {
      id: "LAB-4019",
      testName: "Complete Blood Count (CBC)",
      labName: "PHC Pathology Unit",
      collectedOn: "28 Aug 2026",
      status: "Completed",
      keyResult: "Hemoglobin 12.8 g/dL (Normal)",
      findings: "Normal range, no active infection indicated.",
    },
    {
      id: "LAB-4020",
      testName: "Fasting Blood Glucose",
      labName: "PHC Pathology Unit",
      collectedOn: "28 Aug 2026",
      status: "Completed",
      keyResult: "92 mg/dL (Normal)",
      findings: "Optimal glycemic control.",
    },
  ]);

  useEffect(() => {
    facilitiesApi.list({ district: district !== "ALL" ? district : undefined })
      .then((res) => {
        setFacilities(res.data.facilities);
        if (res.data.facilities.length > 0) {
          setSelectedFacility(res.data.facilities[0].id);
        }
      })
      .catch((err) => console.warn("Failed to load facilities for appointment booking:", err));
  }, [district]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await profileApi.step1({
        district,
        village: village.trim() || undefined,
        pincode: pincode.trim() || undefined,
        abhaId: abhaId.trim() || undefined,
        bloodGroup: bloodGroup || undefined,
      });
      setProfileMsg({ type: "success", text: "Health profile & ABHA details updated successfully!" });
      onRefreshUser();
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const fac = facilities.find((f) => f.id === selectedFacility);
    const newApt = {
      id: `APT-2026-${Math.floor(100 + Math.random() * 900)}`,
      facilityName: fac?.name || "Primary Health Centre (PHC) Manchar",
      doctorName: "Dr. On-Duty Medical Officer",
      type: apptType === "TELE_OPD" ? "Assisted Teleconsultation" : "In-Person OPD",
      date: `${appDate}, ${appSlot}`,
      status: "Confirmed",
      token: `Token #${Math.floor(10 + Math.random() * 40)}`,
    };
    setAppointments([newApt, ...appointments]);
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setShowApptModal(false);
      setAppNotes("");
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* ─── OVERVIEW TAB ──────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Welcome Health Card */}
          <div className="bg-[#0E4A43] text-white rounded-[32px] p-6 sm:p-8 relative overflow-hidden shadow-xs">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5F973]/20 border border-[#E5F973]/30 text-[#E5F973] text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#E5F973] animate-pulse" />
                  Ayushman Bharat • ABHA Linked Citizen Portal
                </div>
                <h2 className="text-2xl sm:text-3xl font-black font-heading">
                  Namaste, {user.fullName}
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                  Welcome to your unified health dashboard. You can book doctor visits, check live hospital beds across Maharashtra, and access verified digital prescriptions.
                </p>

                <div className="pt-2 flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setShowApptModal(true)}
                    className="px-5 py-2.5 rounded-full bg-[#E5F973] text-slate-950 text-xs font-black hover:bg-[#d8ec68] transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Book OPD / Teleconsultation
                  </button>
                  <Link
                    href="/facilities"
                    className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4 text-[#E5F973]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    Find Live Hospital Beds
                  </Link>
                </div>
              </div>

              {/* Patient ABHA Identity Card Badge */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 w-full lg:w-72 space-y-3 flex-shrink-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] uppercase font-bold text-emerald-200">ABHA Health Card</span>
                  <span className="text-[10px] font-black bg-[#E5F973] text-slate-950 px-2 py-0.5 rounded-full">ACTIVE</span>
                </div>
                <div>
                  <div className="text-xs text-emerald-100/70">Patient Name</div>
                  <div className="text-sm font-bold text-white truncate">{user.fullName}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-white/10">
                  <div>
                    <div className="text-[10px] text-emerald-100/70">ABHA ID</div>
                    <div className="font-bold text-white truncate">{patient?.abhaId || "91-4029-8812"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-100/70">Blood Group</div>
                    <div className="font-bold text-[#E5F973]">{patient?.bloodGroup || "O+"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setTab("appointments")}
              className="bg-[#EFF2F5] hover:bg-slate-200/70 transition-all rounded-[24px] p-5 border border-slate-200/50 text-left group"
            >
              <div className="text-2xl font-black text-slate-900 group-hover:text-[#0E4A43] transition-colors">{appointments.length}</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Upcoming Visits</div>
              <div className="text-[11px] text-slate-500">Confirmed OPD &amp; Telehealth</div>
            </button>

            <button
              onClick={() => setTab("prescriptions")}
              className="bg-[#EFF2F5] hover:bg-slate-200/70 transition-all rounded-[24px] p-5 border border-slate-200/50 text-left group"
            >
              <div className="text-2xl font-black text-slate-900 group-hover:text-[#0E4A43] transition-colors">{prescriptions.length}</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Active Prescriptions</div>
              <div className="text-[11px] text-slate-500">Digital doctor notes</div>
            </button>

            <button
              onClick={() => setTab("referrals")}
              className="bg-[#EFF2F5] hover:bg-slate-200/70 transition-all rounded-[24px] p-5 border border-slate-200/50 text-left group"
            >
              <div className="text-2xl font-black text-slate-900 group-hover:text-[#0E4A43] transition-colors">{referrals.length}</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Hospital Referrals</div>
              <div className="text-[11px] text-slate-500">Live transfer status</div>
            </button>

            <button
              onClick={() => setTab("lab_tests")}
              className="bg-[#EFF2F5] hover:bg-slate-200/70 transition-all rounded-[24px] p-5 border border-slate-200/50 text-left group"
            >
              <div className="text-2xl font-black text-slate-900 group-hover:text-[#0E4A43] transition-colors">{labReports.length}</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Lab Reports</div>
              <div className="text-[11px] text-slate-500">Diagnostic records</div>
            </button>
          </div>

          {/* Next Upcoming Appointment Preview */}
          <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Next Upcoming Consultation</h3>
                <p className="text-xs text-slate-500">Show this token number at the OPD desk or join the virtual call.</p>
              </div>
              <button onClick={() => setTab("appointments")} className="text-xs text-[#0E4A43] font-bold hover:underline">
                View All Appointments &rsaquo;
              </button>
            </div>

            {appointments.length > 0 ? (
              <div className="bg-[#EFF2F5] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                      {appointments[0].type}
                    </span>
                    <span className="text-xs font-black text-slate-900">{appointments[0].date}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">{appointments[0].facilityName}</div>
                  <div className="text-xs text-slate-600">{appointments[0].doctorName}</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-black text-[#0E4A43]">
                    {appointments[0].token}
                  </div>
                  <button
                    onClick={() => alert("Joining Tele-OPD consultation room...")}
                    className="px-4 py-2 rounded-xl bg-[#0E4A43] text-white text-xs font-bold hover:bg-[#083530] transition-colors"
                  >
                    Open Details
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                No active appointments. Click "Book OPD / Teleconsultation" to schedule one.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── APPOINTMENTS TAB ─────────────────────────────────────────────────── */}
      {activeTab === "appointments" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">My Appointments &amp; OPD Tokens</h2>
              <p className="text-xs text-slate-500">Scheduled in-person visits and assisted teleconsultations.</p>
            </div>
            <button
              onClick={() => setShowApptModal(true)}
              className="px-5 py-2.5 rounded-full bg-[#0E4A43] text-white text-xs font-black hover:bg-[#083530] transition-all shadow-xs flex items-center gap-1.5"
            >
              + Book New Appointment
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.map((apt) => (
              <div key={apt.id} className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase">
                    {apt.type}
                  </span>
                  <span className="text-xs font-bold text-slate-500">{apt.id}</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{apt.facilityName}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{apt.doctorName}</p>
                </div>
                <div className="p-3 bg-[#EFF2F5] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Scheduled Slot</span>
                    <span className="font-bold text-slate-900">{apt.date}</span>
                  </div>
                  <span className="px-3 py-1 bg-white rounded-lg font-black text-[#0E4A43] border border-slate-200/60 shadow-2xs">
                    {apt.token}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {apt.status}
                  </span>
                  <button
                    onClick={() => alert(`Appointment Details:\nID: ${apt.id}\nFacility: ${apt.facilityName}\nToken: ${apt.token}`)}
                    className="text-[#0E4A43] font-bold hover:underline"
                  >
                    View Slip &rsaquo;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── PRESCRIPTIONS TAB ────────────────────────────────────────────────── */}
      {activeTab === "prescriptions" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">Digital Prescriptions (E-Rx)</h2>
            <p className="text-xs text-slate-500">Verified doctor prescriptions linked with local PHC medicine stock availability.</p>
          </div>

          <div className="space-y-4">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base text-slate-900">{rx.doctorName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">{rx.id}</span>
                    </div>
                    <p className="text-xs text-slate-500">{rx.facility} • Prescribed on {rx.date}</p>
                  </div>
                  <Link
                    href="/facilities"
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <svg className="w-3.5 h-3.5 text-[#0E4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    Check PHC Medicine Stock
                  </Link>
                </div>

                <div className="p-3.5 bg-[#EFF2F5] rounded-2xl text-xs font-medium text-slate-700">
                  <span className="font-bold text-slate-900 block mb-0.5">Clinical Diagnosis:</span>
                  {rx.diagnosis}
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-900 block">Prescribed Medicines:</span>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden text-xs">
                    {rx.medicines.map((m, idx) => (
                      <div key={idx} className="p-3 bg-white flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">{m.name}</div>
                          <div className="text-slate-500 text-[11px]">{m.dose} • Duration: {m.duration}</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                          In Stock at PHC
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── REFERRALS TAB ───────────────────────────────────────────────────── */}
      {activeTab === "referrals" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">Inter-Facility Referrals</h2>
            <p className="text-xs text-slate-500">Live transfer tracking from Sub-Centres to District Hospitals.</p>
          </div>

          <div className="space-y-4">
            {referrals.map((ref) => (
              <div key={ref.id} className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                    Priority: {ref.priority}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{ref.id}</span>
                </div>

                {/* Visual Referral Path */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-[#EFF2F5] rounded-2xl text-xs">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Referred From</div>
                    <div className="font-bold text-slate-900 mt-0.5">{ref.fromFacility}</div>
                  </div>
                  <div className="flex items-center justify-center font-black text-[#0E4A43]">
                    &rarr; Transfer Pathway &rarr;
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Destination Hospital</div>
                    <div className="font-bold text-[#0E4A43] mt-0.5">{ref.toFacility}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <span className="font-bold text-slate-900">Required Service: </span>
                    <span className="text-slate-600">{ref.specialty}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    {ref.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── LAB REPORTS TAB ─────────────────────────────────────────────────── */}
      {activeTab === "lab_tests" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">Diagnostic Laboratory Reports</h2>
            <p className="text-xs text-slate-500">Point-of-care laboratory tests conducted at government healthcare centres.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {labReports.map((lab) => (
              <div key={lab.id} className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-base text-slate-900">{lab.testName}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                    {lab.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500">{lab.labName} • Sample Collected: {lab.collectedOn}</div>
                <div className="p-3 bg-[#EFF2F5] rounded-xl text-xs">
                  <div className="font-bold text-slate-900">{lab.keyResult}</div>
                  <div className="text-slate-600 text-[11px] mt-0.5">{lab.findings}</div>
                </div>
                <button
                  onClick={() => alert(`Viewing lab report: ${lab.testName}\n${lab.keyResult}\nVerified by Pathologist`)}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors"
                >
                  Download Report PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── PROFILE & ABHA TAB ──────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h2 className="text-lg font-black text-slate-900">My Health Profile &amp; ABHA Link</h2>
            <p className="text-xs text-slate-500">Manage your contact, village address, and Ayushman Bharat health identification.</p>
          </div>

          {profileMsg && (
            <div className={`p-4 rounded-2xl text-xs font-bold ${profileMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">District (Maharashtra)</label>
                <select value={district} onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium">
                  {MAHARASHTRA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Village / Locality</label>
                <input type="text" value={village} onChange={(e) => setVillage(e.target.value)} placeholder="e.g. Manchar"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Blood Group</label>
                <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium">
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Pincode</label>
                <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="410503"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">14-Digit ABHA ID (Ayushman Bharat)</label>
              <input type="text" value={abhaId} onChange={(e) => setAbhaId(e.target.value)} placeholder="e.g. 91-4029-8812-3341"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono" />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-3 rounded-full bg-[#0E4A43] text-white font-black hover:bg-[#083530] transition-all shadow-xs disabled:opacity-50"
              >
                {savingProfile ? "Saving Profile..." : "Save Health Details"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── BOOK APPOINTMENT MODAL ───────────────────────────────────────────── */}
      {showApptModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Book Doctor Visit / Teleconsultation</h3>
              <button onClick={() => setShowApptModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900">✕</button>
            </div>

            {bookingSuccess ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl mx-auto font-bold">✓</div>
                <h4 className="text-base font-black text-slate-900">Appointment Confirmed!</h4>
                <p className="text-xs text-slate-500">Your token slip has been generated and added to your dashboard.</p>
              </div>
            ) : (
              <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Select Healthcare Facility *</label>
                  <select
                    value={selectedFacility}
                    onChange={(e) => setSelectedFacility(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                  >
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} ({f.district})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Consultation Type</label>
                    <select value={apptType} onChange={(e) => setApptType(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium">
                      <option value="IN_PERSON">In-Person OPD Visit</option>
                      <option value="TELE_OPD">Virtual Teleconsultation</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Preferred Date</label>
                    <input type="date" required value={appDate} onChange={(e) => setAppDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Preferred Time Slot</label>
                  <select value={appSlot} onChange={(e) => setAppSlot(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium">
                    <option value="09:00 AM - 10:00 AM">Morning: 09:00 AM - 10:00 AM</option>
                    <option value="10:00 AM - 11:00 AM">Morning: 10:00 AM - 11:00 AM</option>
                    <option value="11:00 AM - 12:00 PM">Morning: 11:00 AM - 12:00 PM</option>
                    <option value="02:00 PM - 03:00 PM">Afternoon: 02:00 PM - 03:00 PM</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Symptoms / Health Notes</label>
                  <textarea
                    rows={2}
                    value={appNotes}
                    onChange={(e) => setAppNotes(e.target.value)}
                    placeholder="Briefly describe symptoms (e.g. fever, headache since 2 days)..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setShowApptModal(false)} className="px-4 py-2.5 rounded-full text-slate-600 hover:bg-slate-100 font-bold">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-2.5 rounded-full bg-[#0E4A43] text-white font-black hover:bg-[#083530] shadow-sm">
                    Confirm Booking
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
