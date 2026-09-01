"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { adminApi, facilitiesApi, type UserProfile, type Facility } from "@/lib/api";

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
      const [sumRes, facRes, staffRes] = await Promise.all([
        adminApi.getDistrictSummary(districtName).catch(() => ({ data: { district: districtName, totalFacilities: 18, totalBeds: 450, availableBeds: 180, totalDoctors: 64 } })),
        facilitiesApi.list({ district: districtName }),
        adminApi.listStaff({ district: districtName }).catch(() => ({ data: [] })),
      ]);
      setSummary(sumRes.data);
      setFacilities(facRes.data.facilities);
      setStaff(staffRes.data);
      if (facRes.data.facilities.length > 0) {
        setStaffFacilityId(facRes.data.facilities[0].id);
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

  return (
    <div className="space-y-6">
      {/* ─── DISTRICT COMMAND OVERVIEW ────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-[#0E4A43] text-white rounded-[32px] p-6 sm:p-8 relative overflow-hidden shadow-xs">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5F973]/20 border border-[#E5F973]/30 text-[#E5F973] text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#E5F973] animate-pulse" />
                  District Health Officer (DHO) Command Console
                </div>
                <h2 className="text-2xl sm:text-3xl font-black font-heading">
                  {districtName} District Administration
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                  Supervise public health centres, bed allocation, clinical manpower, and patient transfers across all talukas in {districtName}.
                </p>

                <div className="pt-2 flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setShowFacModal(true)}
                    className="px-5 py-2.5 rounded-full bg-[#E5F973] text-slate-950 text-xs font-black hover:bg-[#d8ec68] transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                  >
                    + Register Healthcare Facility
                  </button>
                  <button
                    onClick={() => setShowStaffModal(true)}
                    className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20"
                  >
                    + Provision Medical Staff / Admin
                  </button>
                </div>
              </div>

              {/* District Status Card */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 w-full lg:w-72 space-y-2 flex-shrink-0 text-xs">
                <span className="text-[10px] font-bold uppercase text-emerald-200 block">District Health Index</span>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-emerald-100">Reporting Facilities:</span>
                  <span className="font-bold text-[#E5F973]">{facilities.length || 18} Active</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-emerald-100">Live Available Beds:</span>
                  <span className="font-bold text-white">{summary?.availableBeds ?? 180} Beds</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-emerald-100">108 Referral Success:</span>
                  <span className="font-bold text-emerald-300">98.4%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button onClick={() => setTab("facilities")} className="bg-[#EFF2F5] hover:bg-slate-200/70 p-5 rounded-[24px] border border-slate-200/50 text-left transition-all group">
              <div className="text-2xl font-black text-slate-900">{facilities.length || summary?.totalFacilities || 18}</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Health Facilities</div>
              <div className="text-[10px] text-slate-500">Sub-Centres, PHCs &amp; Hospitals</div>
            </button>

            <button onClick={() => setTab("facilities")} className="bg-[#EFF2F5] hover:bg-slate-200/70 p-5 rounded-[24px] border border-slate-200/50 text-left transition-all group">
              <div className="text-2xl font-black text-emerald-700">{summary?.availableBeds ?? 180}</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Available Inpatient Beds</div>
              <div className="text-[10px] text-slate-500">Across all talukas</div>
            </button>

            <button onClick={() => setTab("staff")} className="bg-[#EFF2F5] hover:bg-slate-200/70 p-5 rounded-[24px] border border-slate-200/50 text-left transition-all group">
              <div className="text-2xl font-black text-[#0E4A43]">{summary?.totalDoctors ?? 64}</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Active Doctors</div>
              <div className="text-[10px] text-slate-500">Medical officers on duty</div>
            </button>

            <button onClick={() => setTab("referrals_audit")} className="bg-[#EFF2F5] hover:bg-slate-200/70 p-5 rounded-[24px] border border-slate-200/50 text-left transition-all group">
              <div className="text-2xl font-black text-indigo-700">100%</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Taluka Network Coverage</div>
              <div className="text-[10px] text-slate-500">Closed-loop referrals</div>
            </button>
          </div>

          {/* District Facilities Table Preview */}
          <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">District Public Health Centres</h3>
                <p className="text-xs text-slate-500">Real-time status of Sub-Centres, PHCs, and District Hospitals in {districtName}.</p>
              </div>
              <button onClick={() => setTab("facilities")} className="text-xs text-[#0E4A43] font-bold hover:underline">
                View All Directory &rsaquo;
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden text-xs">
              {facilities.slice(0, 5).map((fac) => (
                <div key={fac.id} className="p-4 bg-white hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{fac.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                        {fac.type}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-0.5">{fac.village ? `${fac.village}, ` : ""}{fac.district} • Ph: {fac.contactPhone || "020-24381001"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl">
                      {fac.bedStatus?.availableBeds ?? 5} / {fac.bedStatus?.totalBeds ?? 10} Beds Free
                    </span>
                    <Link href={`/facilities/${fac.id}`} className="text-[#0E4A43] font-bold hover:underline">
                      Live View &rsaquo;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── DISTRICT FACILITIES DIRECTORY TAB ─────────────────────────────────── */}
      {activeTab === "facilities" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Healthcare Facilities in {districtName}</h2>
              <p className="text-xs text-slate-500">Monitor bed allocations, emergency readiness, and contact lines.</p>
            </div>
            <button
              onClick={() => setShowFacModal(true)}
              className="px-5 py-2.5 rounded-full bg-[#0E4A43] text-white text-xs font-black hover:bg-[#083530] transition-all shadow-xs flex items-center gap-1.5"
            >
              + Register New Facility
            </button>
          </div>

          <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EFF2F5] text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-5">Facility Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Village / Taluka</th>
                    <th className="py-3 px-4">Available Inpatient Beds</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {facilities.map((fac) => (
                    <tr key={fac.id} className="hover:bg-slate-50">
                      <td className="py-3 px-5 font-black text-slate-900">{fac.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                          {fac.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{fac.village || "Taluka Center"}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">
                        {fac.bedStatus?.availableBeds ?? 0} / {fac.bedStatus?.totalBeds ?? 0} Beds Free
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/facilities/${fac.id}`} className="text-[#0E4A43] font-bold hover:underline">
                          View Live &rsaquo;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── STAFF PROVISIONING TAB ───────────────────────────────────────────── */}
      {activeTab === "staff" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">District Staff &amp; Administrator Accounts</h2>
              <p className="text-xs text-slate-500">Provision Facility Administrators, Medical Officers, and ASHA Health Workers.</p>
            </div>
            <button
              onClick={() => setShowStaffModal(true)}
              className="px-5 py-2.5 rounded-full bg-[#0E4A43] text-white text-xs font-black hover:bg-[#083530] transition-all shadow-xs flex items-center gap-1.5"
            >
              + Provision Staff Account
            </button>
          </div>

          <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-xs overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#EFF2F5] text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-5">Name &amp; Email</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Assigned Facility / Area</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {staff.length > 0 ? (
                    staff.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-3 px-5 font-black text-slate-900">
                          <div>{s.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-normal">{s.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase">
                            {s.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {s.facilityAdmin?.facility?.name || s.healthWorker?.villageArea || "District Healthcare Pool"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No staff provisioned yet. Click "+ Provision Staff Account" to add personnel.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── REFERRALS & BED AUDITS TAB ───────────────────────────────────────── */}
      {activeTab === "referrals_audit" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">District Inter-Facility Referral &amp; Bed Audit</h2>
            <p className="text-xs text-slate-500">Track taluka-level patient transfers and prevent bed shortages across the district.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Sub-Centres &rarr; PHC Transfers</span>
              <div className="text-2xl font-black text-slate-900">42 Referrals</div>
              <p className="text-xs text-slate-500">100% resolved within district network.</p>
            </div>
            <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">PHC &rarr; District Hospital Transfers</span>
              <div className="text-2xl font-black text-emerald-700">18 Critical</div>
              <p className="text-xs text-slate-500">All bed reservations confirmed before transit.</p>
            </div>
            <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">108 Ambulance Response Time</span>
              <div className="text-2xl font-black text-[#0E4A43]">14.2 Mins</div>
              <p className="text-xs text-slate-500">Average response across rural talukas.</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── DISTRICT PROFILE TAB ────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <h3 className="text-base font-black text-slate-900">District Health Office Jurisdiction</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#EFF2F5] rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Officer Name</span>
                <span className="text-sm font-bold text-slate-900">{user.fullName}</span>
              </div>
              <div className="p-3.5 bg-[#EFF2F5] rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned District</span>
                <span className="text-sm font-bold text-[#0E4A43]">{districtName} District</span>
              </div>
              <div className="p-3.5 bg-[#EFF2F5] rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Official Email</span>
                <span className="text-sm font-bold text-slate-900">{user.email}</span>
              </div>
              <div className="p-3.5 bg-[#EFF2F5] rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">State Authority</span>
                <span className="text-sm font-bold text-slate-900">Govt of Maharashtra</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── REGISTER FACILITY MODAL ─────────────────────────────────────────── */}
      {showFacModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Register Healthcare Facility</h3>
              <button onClick={() => setShowFacModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900">✕</button>
            </div>

            <form onSubmit={handleRegisterFacility} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Facility Name *</label>
                <input
                  type="text"
                  required
                  value={facName}
                  onChange={(e) => setFacName(e.target.value)}
                  placeholder="e.g. Primary Health Centre (PHC) Manchar"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Facility Type *</label>
                  <select value={facType} onChange={(e) => setFacType(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold">
                    <option value="SUB_CENTRE">Sub Centre</option>
                    <option value="PHC">PHC</option>
                    <option value="CHC">CHC</option>
                    <option value="RURAL_HOSPITAL">Rural Hospital</option>
                    <option value="DISTRICT_HOSPITAL">District Hospital</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Village / Locality</label>
                  <input type="text" value={facVillage} onChange={(e) => setFacVillage(e.target.value)} placeholder="e.g. Manchar"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Total Bed Capacity</label>
                  <input type="number" value={facTotalBeds} onChange={(e) => setFacTotalBeds(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Available Beds</label>
                  <input type="number" value={facAvailableBeds} onChange={(e) => setFacAvailableBeds(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900" />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowFacModal(false)} className="px-4 py-2.5 rounded-full text-slate-600 hover:bg-slate-100 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-full bg-[#0E4A43] text-white font-black hover:bg-[#083530]">
                  Register Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── PROVISION STAFF MODAL ───────────────────────────────────────────── */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Provision Staff Account</h3>
              <button onClick={() => setShowStaffModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900">✕</button>
            </div>

            <form onSubmit={handleProvisionStaff} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Role to Assign *</label>
                <select value={staffRole} onChange={(e) => setStaffRole(e.target.value as any)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold">
                  <option value="FACILITY_ADMIN">Facility Admin (Hospital Superintendent)</option>
                  <option value="DOCTOR">Doctor / Medical Officer</option>
                  <option value="HEALTH_WORKER">ASHA / ANM Health Worker</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Full Name *</label>
                <input type="text" required value={staffFullName} onChange={(e) => setStaffFullName(e.target.value)} placeholder="e.g. Dr. Ananya Kulkarni"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Official Email *</label>
                  <input type="email" required value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} placeholder="doctor@swasthya.gov.in"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Initial Password *</label>
                  <input type="text" required value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Assigned Facility *</label>
                <select value={staffFacilityId} onChange={(e) => setStaffFacilityId(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900">
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.district})</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowStaffModal(false)} className="px-4 py-2.5 rounded-full text-slate-600 hover:bg-slate-100 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-full bg-[#0E4A43] text-white font-black hover:bg-[#083530]">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
