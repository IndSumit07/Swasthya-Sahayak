"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  adminApi,
  facilitiesApi,
  referralsApi,
  type UserProfile,
  type Facility,
  type Referral,
} from "@/lib/api";
import {
  Building2,
  Bed,
  Users,
  GitBranch,
  Check,
  X,
  Plus,
  PhoneCall,
  Calendar,
  ShieldCheck,
  User,
  Activity,
} from "lucide-react";

interface DistrictAdminDashboardProps {
  user: UserProfile;
  activeTab: string;
  setTab: (t: string) => void;
}

export function DistrictAdminDashboard({ user, activeTab, setTab }: DistrictAdminDashboardProps) {
  const districtName = user.districtAdmin?.district || "Pune";

  const [summary, setSummary] = useState<{ totalFacilities: number; totalBeds: number; availableBeds: number; totalDoctors: number } | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  // Facility Registration Modal
  const [showFacModal, setShowFacModal] = useState(false);
  const [facName, setFacName] = useState("");
  const [facType, setFacType] = useState("PHC");
  const [facVillage, setFacVillage] = useState("");
  const [facPhone, setFacPhone] = useState("");
  const [facTotalBeds, setFacTotalBeds] = useState(20);
  const [facAvailableBeds, setFacAvailableBeds] = useState(10);
  const [facMsg, setFacMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Staff Provisioning Modal
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffRole, setStaffRole] = useState<"FACILITY_ADMIN" | "DOCTOR" | "HEALTH_WORKER">("FACILITY_ADMIN");
  const [staffFullName, setStaffFullName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("Password@123");
  const [staffFacilityId, setStaffFacilityId] = useState("");
  const [staffMsg, setStaffMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, facRes, staffRes, refRes] = await Promise.allSettled([
        adminApi.getDistrictSummary(districtName),
        facilitiesApi.list({ district: districtName }),
        adminApi.listStaff({ district: districtName }),
        referralsApi.list({ district: districtName }),
      ]);

      if (sumRes.status === "fulfilled" && sumRes.value.success) {
        setSummary(sumRes.value.data);
      }
      if (facRes.status === "fulfilled" && facRes.value.success) {
        setFacilities(facRes.value.data.facilities);
        if (facRes.value.data.facilities.length > 0 && !staffFacilityId) {
          setStaffFacilityId(facRes.value.data.facilities[0].id);
        }
      }
      if (staffRes.status === "fulfilled" && staffRes.value.success) {
        setStaff(staffRes.value.data);
      }
      if (refRes.status === "fulfilled" && refRes.value.success) {
        setReferrals(refRes.value.data);
      }
    } catch (err) {
      console.warn("Failed to load district admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [districtName]);

  const handleRegisterFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    setFacMsg(null);
    try {
      await facilitiesApi.create({
        name: facName,
        type: facType as any,
        district: districtName,
        village: facVillage || undefined,
        contactPhone: facPhone || undefined,
        totalBeds: Number(facTotalBeds),
        availableBeds: Number(facAvailableBeds),
        services: ["General Consultation", "Maternal Care", "Emergency Triage", "Vaccination"],
      });
      setFacMsg({ type: "success", text: "Healthcare facility registered in district directory!" });
      setShowFacModal(false);
      setFacName("");
      setFacVillage("");
      fetchData();
    } catch (err: any) {
      setFacMsg({ type: "error", text: err.message || "Failed to register facility." });
    }
  };

  const handleProvisionStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffMsg(null);
    try {
      await adminApi.provisionUser({
        email: staffEmail,
        password: staffPassword,
        fullName: staffFullName,
        role: staffRole,
        district: districtName,
        facilityId: staffFacilityId || undefined,
      });
      setStaffMsg({ type: "success", text: "Staff account provisioned successfully!" });
      setShowStaffModal(false);
      setStaffFullName("");
      setStaffEmail("");
      fetchData();
    } catch (err: any) {
      setStaffMsg({ type: "error", text: err.message || "Failed to provision staff." });
    }
  };

  const handleUpdateReferralStatus = async (id: string, status: string) => {
    try {
      await referralsApi.updateStatus(id, status);
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to update referral status.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ─── DISTRICT OVERVIEW TAB ───────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#0E4A43] via-[#093530] to-[#041c19] p-8 text-white shadow-xl">
            <div className="absolute right-0 top-0 w-96 h-96 bg-[#E5F973]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#E5F973] text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-[#E5F973] animate-pulse" />
                  District Health Office Command Center &bull; {districtName} District
                </div>
                <h1 className="text-2xl sm:text-3xl font-black">{user.fullName}</h1>
                <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
                  Public Health Department &bull; District Health Administration for {districtName}, Maharashtra
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => setShowFacModal(true)}
                  className="px-5 py-3 rounded-2xl bg-[#E5F973] text-[#0E4A43] font-black text-xs hover:brightness-105 active:scale-95 transition-all shadow-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register New Facility</span>
                </button>
                <button
                  onClick={() => setShowStaffModal(true)}
                  className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition-all flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Provision Staff</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div
              onClick={() => setTab("facilities")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <Building2 className="w-5 h-5 text-emerald-800" />
              </div>
              <div className="text-2xl font-black text-slate-900">{facilities.length}</div>
              <div className="text-xs font-bold text-slate-500">District Facilities</div>
            </div>

            <div
              onClick={() => setTab("facilities")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <Bed className="w-5 h-5 text-blue-800" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {summary?.availableBeds ?? facilities.reduce((acc, f) => acc + (f.bedStatus?.availableBeds ?? 0), 0)}
              </div>
              <div className="text-xs font-bold text-slate-500">Available District Beds</div>
            </div>

            <div
              onClick={() => setTab("staff")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-purple-800" />
              </div>
              <div className="text-2xl font-black text-slate-900">{staff.length}</div>
              <div className="text-xs font-bold text-slate-500">Provisioned Staff</div>
            </div>

            <div
              onClick={() => setTab("referrals_audit")}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0E4A43]/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <GitBranch className="w-5 h-5 text-amber-800" />
              </div>
              <div className="text-2xl font-black text-slate-900">{referrals.length}</div>
              <div className="text-xs font-bold text-slate-500">Inter-Facility Referrals</div>
            </div>
          </div>

          {/* Quick Facility Registry Snapshot */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">Hospitals &amp; Health Centres in {districtName}</h2>
              <button onClick={() => setTab("facilities")} className="text-xs font-bold text-[#0E4A43] hover:underline">
                View All Facilities &rarr;
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {facilities.slice(0, 4).map((fac) => (
                <div key={fac.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-black text-slate-900">{fac.name}</span>
                    <span className="text-slate-500 ml-2">({fac.type} &bull; {fac.village || "Urban"})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-800 font-bold">
                      {fac.bedStatus?.availableBeds ?? 0} Beds Vacant
                    </span>
                    <Link
                      href={`/facilities/${fac.id}`}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]"
                    >
                      Audit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── DISTRICT FACILITIES DIRECTORY TAB ───────────────────────────────── */}
      {activeTab === "facilities" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">District Healthcare Facilities Registry</h2>
              <p className="text-xs text-slate-500">All public hospitals, CHCs, and PHCs across {districtName} district</p>
            </div>
            <button
              onClick={() => setShowFacModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#0E4A43] text-white font-bold text-xs hover:brightness-110 shadow-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Facility</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {facilities.map((fac) => (
              <div key={fac.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-base text-slate-900">{fac.name}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                    {fac.type}
                  </span>
                </div>
                <p className="text-slate-500">{fac.address || `${fac.village || "Taluka"}, ${fac.district}`}</p>
                <div className="p-3 bg-[#EFF2F5] rounded-xl flex items-center justify-between">
                  <div>General Beds: <strong className="text-slate-900">{fac.bedStatus?.availableBeds ?? 0} / {fac.bedStatus?.totalBeds ?? 0}</strong></div>
                  <div>Oxygen Beds: <strong className="text-emerald-800">{fac.bedStatus?.oxygenBedsAvailable ?? 0}</strong></div>
                  <div>ICU: <strong className="text-purple-800">{fac.bedStatus?.icuBedsAvailable ?? 0}</strong></div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400 font-mono text-[11px]">{fac.contactPhone || "24x7 Emergency"}</span>
                  <Link
                    href={`/facilities/${fac.id}`}
                    className="px-3 py-1.5 rounded-xl bg-[#0E4A43] text-white font-bold text-[11px] hover:brightness-110"
                  >
                    View Facility Console
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── STAFF PROVISIONING TAB ──────────────────────────────────────────── */}
      {activeTab === "staff" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">District Clinical &amp; Admin Staff Register</h2>
              <p className="text-xs text-slate-500">Provision Facility Administrators, Medical Officers, and ASHA Health Workers</p>
            </div>
            <button
              onClick={() => setShowStaffModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#0E4A43] text-white font-bold text-xs hover:brightness-110 shadow-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Provision Staff Account</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {staff.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-bold">
                  No staff provisioned yet for {districtName} district. Click Provision Staff Account to add.
                </div>
              ) : (
                staff.map((s) => (
                  <div key={s.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="font-black text-sm text-slate-900">{s.fullName}</span>
                      <p className="text-slate-500">{s.email} &bull; {s.phone || "No phone"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px] uppercase">
                        {s.role}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                        {s.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── REFERRALS AUDIT TAB ─────────────────────────────────────────────── */}
      {activeTab === "referrals_audit" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">District Inter-Facility Referral Audits</h2>
            <p className="text-xs text-slate-500">Real-time monitoring of inter-hospital transfers and critical bed reservations</p>
          </div>

          {referrals.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-600">
                <GitBranch className="w-6 h-6" />
              </div>
              <div className="font-bold text-slate-900 text-base">No Active Referrals in {districtName}</div>
              <p className="text-xs text-slate-500">Inter-facility transfers escalated by Medical Officers will be audited here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {referrals.map((ref) => (
                <div key={ref.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800">
                        {ref.status}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">
                        {ref.priority}
                      </span>
                    </div>
                    <span className="text-slate-400 font-mono">{new Date(ref.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#EFF2F5] rounded-2xl">
                    <div>Origin: <strong className="text-slate-900">{ref.fromFacility?.name}</strong></div>
                    <div>Target Hospital: <strong className="text-[#0E4A43]">{ref.toFacility?.name}</strong></div>
                  </div>

                  <div className="text-slate-700">
                    Reason: <strong className="text-slate-900">{ref.reason}</strong>
                    {ref.requiredSpecialty && <span className="ml-2">({ref.requiredSpecialty})</span>}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {ref.status !== "BED_RESERVED" && ref.status !== "COMPLETED" && (
                      <button
                        onClick={() => handleUpdateReferralStatus(ref.id, "BED_RESERVED")}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                      >
                        Confirm Bed Reservation
                      </button>
                    )}
                    {ref.status === "BED_RESERVED" && (
                      <button
                        onClick={() => handleUpdateReferralStatus(ref.id, "PATIENT_ARRIVED")}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px]"
                      >
                        Mark Patient Arrived
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── DISTRICT PROFILE TAB ────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 text-xs">
          <div>
            <h2 className="text-xl font-black text-slate-900">District Health Officer Authority Profile</h2>
            <p className="text-slate-500">Jurisdictional authority across all health sub-centres and district hospitals</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Officer Name</div>
              <div className="font-black text-slate-900 text-sm mt-1">{user.fullName}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Assigned District</div>
              <div className="font-black text-[#0E4A43] text-sm mt-1">{districtName} District</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Official Govt Email</div>
              <div className="font-black text-slate-900 text-sm mt-1">{user.email}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Jurisdiction</div>
              <div className="font-black text-slate-900 text-sm mt-1">Government of Maharashtra Public Health Dept</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── REGISTER FACILITY MODAL ─────────────────────────────────────────── */}
      {showFacModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Register Healthcare Facility</h3>
              <button onClick={() => setShowFacModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {facMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold ${facMsg.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                {facMsg.text}
              </div>
            )}

            <form onSubmit={handleRegisterFacility} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  value={facName}
                  onChange={(e) => setFacName(e.target.value)}
                  placeholder="e.g. Primary Health Centre (PHC) Manchar"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Facility Type *</label>
                  <select
                    value={facType}
                    onChange={(e) => setFacType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  >
                    <option value="SUB_CENTRE">Sub Centre</option>
                    <option value="PHC">PHC</option>
                    <option value="CHC">CHC</option>
                    <option value="RURAL_HOSPITAL">Rural Hospital</option>
                    <option value="DISTRICT_HOSPITAL">District Hospital</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Village / Taluka</label>
                  <input
                    type="text"
                    value={facVillage}
                    onChange={(e) => setFacVillage(e.target.value)}
                    placeholder="e.g. Manchar"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Beds</label>
                  <input
                    type="number"
                    value={facTotalBeds}
                    onChange={(e) => setFacTotalBeds(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Available Beds</label>
                  <input
                    type="number"
                    value={facAvailableBeds}
                    onChange={(e) => setFacAvailableBeds(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFacModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#0E4A43] text-white font-bold hover:brightness-110 shadow-md"
                >
                  Register Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── PROVISION STAFF MODAL ───────────────────────────────────────────── */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Provision Healthcare Personnel</h3>
              <button onClick={() => setShowStaffModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {staffMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold ${staffMsg.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                {staffMsg.text}
              </div>
            )}

            <form onSubmit={handleProvisionStaff} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role *</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  >
                    <option value="FACILITY_ADMIN">Facility Admin</option>
                    <option value="DOCTOR">Medical Officer / Doctor</option>
                    <option value="HEALTH_WORKER">ASHA / Frontline Worker</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assign to Facility</label>
                  <select
                    value={staffFacilityId}
                    onChange={(e) => setStaffFacilityId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  >
                    {facilities.map((fac) => (
                      <option key={fac.id} value={fac.id}>{fac.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={staffFullName}
                  onChange={(e) => setStaffFullName(e.target.value)}
                  placeholder="e.g. Dr. Suresh Kulkarni"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Govt Email *</label>
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="doctor@swasthya.gov.in"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="password"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#0E4A43] text-white font-bold hover:brightness-110 shadow-md"
                >
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
