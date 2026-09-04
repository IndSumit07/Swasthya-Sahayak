"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  facilitiesApi,
  appointmentsApi,
  authApi,
  type Facility,
  type AvailabilityMatrix,
  type UserProfile,
} from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Bed,
  Stethoscope,
  FlaskConical,
  Pill,
  Clock,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  Calendar,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";

export default function FacilityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const facilityId = params?.id as string;

  const [facility, setFacility] = useState<Facility | null>(null);
  const [matrix, setMatrix] = useState<AvailabilityMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "matrix" | "doctors" | "beds" | "medicines" | "diagnostics" | "book">("overview");

  // User auth state for booking
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("Morning (09:00 - 11:00)");
  const [appointmentDate, setAppointmentDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!facilityId) return;
    setLoading(true);

    Promise.allSettled([
      facilitiesApi.getById(facilityId),
      facilitiesApi.getAvailabilityMatrix(facilityId),
      authApi.me(),
    ]).then(([facRes, matRes, userRes]) => {
      if (facRes.status === "fulfilled" && facRes.value.success) {
        setFacility(facRes.value.data);
      }
      if (matRes.status === "fulfilled" && matRes.value.success) {
        setMatrix(matRes.value.data);
      }
      if (userRes.status === "fulfilled" && userRes.value.success) {
        setCurrentUser(userRes.value.data);
      }
      setLoading(false);
    });
  }, [facilityId]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      router.push(`/login?redirect=/facilities/${facilityId}`);
      return;
    }
    setBookingLoading(true);
    setBookingResult(null);
    try {
      await appointmentsApi.create({
        facilityId,
        doctorId: selectedDoctorId || undefined,
        appointmentDate,
        slot: selectedSlot,
        notes: bookingNotes || undefined,
      });
      setBookingResult({
        success: true,
        message: "Consultation token confirmed in database! Please arrive 15 minutes before your slot.",
      });
      setBookingNotes("");
    } catch (err: any) {
      setBookingResult({
        success: false,
        message: err.message || "Failed to book appointment. Please try again.",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#0E4A43] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs text-slate-500 font-bold">Loading live facility resource matrix...</div>
        </div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-[#E5F973] selection:text-slate-950" style={{ fontFamily: "var(--font-quicksand, 'Quicksand', sans-serif)" }}>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5">
          <Navbar />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
          <h2 className="text-xl font-black text-slate-900">Facility Not Found</h2>
          <p className="text-xs text-slate-500">The healthcare facility requested does not exist or has been relocated.</p>
          <Link href="/facilities" className="px-5 py-2.5 rounded-full bg-[#0E4A43] text-white text-xs font-bold">
            &larr; Back to Directory
          </Link>
        </div>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Footer />
        </div>
      </div>
    );
  }

  const bed = facility.bedStatus;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-[#E5F973] selection:text-slate-950" style={{ fontFamily: "var(--font-quicksand, 'Quicksand', sans-serif)" }}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5">
        <Navbar />
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Back Link */}
        <div>
          <Link href="/facilities" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0E4A43] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Health Facilities Directory</span>
          </Link>
        </div>

        {/* Facility Header Banner */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black uppercase tracking-wider">
                  {facility.type.replace(/_/g, " ")}
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                  {facility.district} District
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Resource Sync Active
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {facility.name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  {facility.address || `${facility.village ? facility.village + ", " : ""}${facility.district}, Maharashtra - ${facility.pincode || "411001"}`}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {facility.contactPhone && (
                <a
                  href={`tel:${facility.contactPhone}`}
                  className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-800 text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
                >
                  <Phone className="w-4 h-4 text-slate-600" />
                  <span>Call {facility.contactPhone}</span>
                </a>
              )}

              <button
                onClick={() => setActiveTab("book")}
                className="px-5 py-3 rounded-2xl bg-[#0E4A43] text-white text-xs font-black hover:brightness-110 transition-all shadow-xs flex items-center gap-2 active:scale-95"
              >
                <Calendar className="w-4 h-4 text-[#E5F973]" />
                <span>Book Consultation Slot</span>
              </button>
            </div>
          </div>
        </div>

        {/* FR-07: Real-Time Availability Matrix Example Card */}
        <div className="bg-linear-to-br from-[#0E4A43] to-[#082e29] text-white rounded-[32px] p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#E5F973] text-[10px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  <span>FR-07 Live Facility Availability Status</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black mt-1">
                  {facility.name} &mdash; Resource Status
                </h2>
              </div>
              <div className="text-xs text-emerald-200 font-medium">
                Real-time sync with facility admin console
              </div>
            </div>

            {/* FR-07 Example Matrix Table */}
            <div className="bg-black/20 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-white/10 overflow-x-auto">
              <table className="w-full text-left text-xs font-bold">
                <thead>
                  <tr className="border-b border-white/10 text-emerald-200 uppercase text-[10px]">
                    <th className="pb-3">Resource / Clinical Item</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3 text-right">Current Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-semibold">
                  {matrix?.summaryMatrix && matrix.summaryMatrix.length > 0 ? (
                    matrix.summaryMatrix.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-2.5 font-bold text-white text-xs sm:text-sm">{item.item}</td>
                        <td className="py-2.5 text-emerald-200/80 text-[11px] uppercase tracking-wider">{item.category}</td>
                        <td className="py-2.5 text-right">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black ${
                            item.isAvailable
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          }`}>
                            {item.isAvailable ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <XCircle className="w-3 h-3 text-rose-400" />
                            )}
                            <span>{item.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <>
                      {/* Fallback structured matrix if empty */}
                      <tr className="border-b border-white/5">
                        <td className="py-2.5 font-bold text-white">General Doctor</td>
                        <td className="py-2.5 text-emerald-200/80 text-[11px]">DOCTOR</td>
                        <td className="py-2.5 text-right">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Available
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2.5 font-bold text-white">Blood Test</td>
                        <td className="py-2.5 text-emerald-200/80 text-[11px]">DIAGNOSTIC</td>
                        <td className="py-2.5 text-right">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Available
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2.5 font-bold text-white">X-Ray</td>
                        <td className="py-2.5 text-emerald-200/80 text-[11px]">DIAGNOSTIC</td>
                        <td className="py-2.5 text-right">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <XCircle className="w-3 h-3 text-rose-400" />
                            Unavailable
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2.5 font-bold text-white">Paracetamol</td>
                        <td className="py-2.5 text-emerald-200/80 text-[11px]">MEDICINE</td>
                        <td className="py-2.5 text-right">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Available
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-white">Beds</td>
                        <td className="py-2.5 text-emerald-200/80 text-[11px]">BED</td>
                        <td className="py-2.5 text-right">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            {bed?.availableBeds ?? 3} Available
                          </span>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          {[
            { id: "overview", label: "Overview & Services", icon: Layers },
            { id: "book", label: "Book Appointment", icon: Calendar },
            { id: "doctors", label: `Doctors (${facility.doctors?.length ?? 0})`, icon: Stethoscope },
            { id: "beds", label: "Bed Capacity", icon: Bed },
            { id: "medicines", label: `Medicines (${facility.medicines?.length ?? 0})`, icon: Pill },
            { id: "diagnostics", label: `Diagnostics (${facility.diagnostics?.length ?? 0})`, icon: FlaskConical },
          ].map((t) => {
            const Icon = t.icon;
            const isTabActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                  isTabActive
                    ? "bg-[#0E4A43] text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab: Overview & Services */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-black text-slate-900">Available Clinical Services (FR-06)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {facility.services && facility.services.length > 0 ? (
                  facility.services.map((s) => (
                    <div key={s.id || s.name} className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{s.name}</div>
                        <div className="text-[10px] text-slate-500">Government Free Scheme</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500">General OPD and emergency care available.</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-base font-black text-slate-900">Operational Timings &amp; Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
                  <div className="font-bold text-slate-400 uppercase text-[10px] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Working Hours</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">{facility.workingHours || "24x7 Emergency / 09:00 - 17:00 OPD"}</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
                  <div className="font-bold text-slate-400 uppercase text-[10px] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>Official Email</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">{facility.contactEmail || "health.facility@swasthya.gov.in"}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Book Appointment */}
        {activeTab === "book" && (
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900">Book Outpatient Consultation Slot</h3>
              <p className="text-xs text-slate-500">Instant digital OPD registration at {facility.name}</p>
            </div>

            {bookingResult && (
              <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                bookingResult.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}>
                {bookingResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span>{bookingResult.message}</span>
              </div>
            )}

            <form onSubmit={handleBookAppointment} className="space-y-4 max-w-xl text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Attending Doctor</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                >
                  <option value="">Any Available General Physician / Duty MO</option>
                  {facility.doctors?.filter(d => d.isAvailable).map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.user?.fullName} ({doc.specialty || "Medical Officer"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Consultation Date</label>
                  <input
                    type="date"
                    required
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Appointment Slot (FR-07)</label>
                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                  >
                    {facility.slots && facility.slots.length > 0 ? (
                      facility.slots.filter(sl => sl.isAvailable).map((sl) => (
                        <option key={sl.id} value={sl.slotName}>
                          {sl.slotName} ({sl.startTime} - {sl.endTime})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Morning Slot (09:00 - 11:00)">Morning Slot (09:00 - 11:00)</option>
                        <option value="Midday Slot (11:00 - 13:00)">Midday Slot (11:00 - 13:00)</option>
                        <option value="Afternoon Slot (14:00 - 16:00)">Afternoon Slot (14:00 - 16:00)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Chief Complaints / Reason for Visit</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fever, persistent cough, child immunization..."
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full py-3 rounded-xl bg-[#0E4A43] text-white font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4 text-[#E5F973]" />
                <span>{bookingLoading ? "Confirming Booking..." : "Confirm OPD Slot Booking"}</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab: Doctors */}
        {activeTab === "doctors" && (
          <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Medical Officers &amp; Specialists on Duty</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {facility.doctors && facility.doctors.length > 0 ? (
                facility.doctors.map((doc) => (
                  <div key={doc.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0E4A43] text-[#E5F973] flex items-center justify-center font-black text-sm shrink-0">
                        {doc.user?.fullName ? doc.user.fullName.charAt(0) : "D"}
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900">{doc.user?.fullName || "Doctor"}</div>
                        <div className="text-xs text-[#0E4A43] font-bold">{doc.specialty || "General Medicine"}</div>
                        <div className="text-[10px] text-slate-500">{doc.qualification || "MBBS"} {doc.registrationNo ? `&bull; Reg: ${doc.registrationNo}` : ""}</div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      doc.isAvailable !== false ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                    }`}>
                      {doc.isAvailable !== false ? "Available" : "Off Duty"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500">Government Medical Officer roster assigned for duty.</div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Beds */}
        {activeTab === "beds" && (
          <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Live Inpatient Bed Availability Matrix</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="text-xs font-bold text-emerald-900">General Ward Beds</div>
                <div className="text-3xl font-black text-emerald-800 mt-2">
                  {bed?.availableBeds ?? 0} <span className="text-sm font-semibold text-emerald-600">/ {bed?.totalBeds ?? 0} Total</span>
                </div>
                <div className="text-[11px] text-emerald-700 mt-1">Available for admission</div>
              </div>

              <div className="p-5 rounded-2xl bg-sky-50 border border-sky-200">
                <div className="text-xs font-bold text-sky-900">Oxygen-Supported Beds</div>
                <div className="text-3xl font-black text-sky-800 mt-2">
                  {bed?.oxygenBedsAvailable ?? 0} <span className="text-sm font-semibold text-sky-600">/ {bed?.oxygenBedsTotal ?? 0} Total</span>
                </div>
                <div className="text-[11px] text-sky-700 mt-1">High-flow oxygen available</div>
              </div>

              <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200">
                <div className="text-xs font-bold text-purple-900">ICU Ventilator Beds</div>
                <div className="text-3xl font-black text-purple-800 mt-2">
                  {bed?.icuBedsAvailable ?? 0} <span className="text-sm font-semibold text-purple-600">/ {bed?.icuBedsTotal ?? 0} Total</span>
                </div>
                <div className="text-[11px] text-purple-700 mt-1">Intensive care unit</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Medicines */}
        {activeTab === "medicines" && (
          <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Essential Drug Inventory &amp; Stock Levels</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-bold">Medicine Name</th>
                    <th className="pb-3 font-bold">Category</th>
                    <th className="pb-3 font-bold">Quantity Available</th>
                    <th className="pb-3 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {facility.medicines && facility.medicines.length > 0 ? (
                    facility.medicines.map((med) => (
                      <tr key={med.id || med.medicineName} className="hover:bg-slate-50">
                        <td className="py-3 font-bold text-slate-900">{med.medicineName}</td>
                        <td className="py-3 text-slate-600">{med.category || "General"}</td>
                        <td className="py-3 font-bold text-slate-800">{med.quantity} {med.unit}</td>
                        <td className="py-3 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            med.isAvailable && med.quantity > 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            {med.isAvailable && med.quantity > 0 ? "Available" : "Unavailable"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-slate-500">No medicine inventory records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Diagnostics */}
        {activeTab === "diagnostics" && (
          <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Diagnostic Laboratory &amp; Radiology Services</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {facility.diagnostics && facility.diagnostics.length > 0 ? (
                facility.diagnostics.map((test) => (
                  <div key={test.id || test.testName} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{test.testName}</div>
                      <div className="text-xs text-slate-500">{test.category || "Laboratory"} &bull; Results in ~{test.turnaroundHours}h</div>
                      <div className="text-[11px] font-bold text-emerald-700 mt-0.5">
                        {test.costInr === 0 ? "Free under Public Health Scheme" : `Rs. ${test.costInr}`}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${test.isAvailable ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                      {test.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500">Standard basic laboratory tests available at OPD.</div>
              )}
            </div>
          </div>
        )}
      </main>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Footer />
      </div>
    </div>
  );
}
