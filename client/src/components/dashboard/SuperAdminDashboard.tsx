"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { adminApi, facilitiesApi, type UserProfile, type Facility } from "@/lib/api";

const MAHARASHTRA_DISTRICTS = [
  "ALL",
  "Ahmednagar","Akola","Amravati","Aurangabad","Beed","Bhandara","Buldhana","Chandrapur",
  "Dhule","Gadchiroli","Gondia","Hingoli","Jalgaon","Jalna","Kolhapur","Latur","Mumbai City",
  "Mumbai Suburban","Nagpur","Nanded","Nandurbar","Nashik","Osmanabad","Palghar","Parbhani",
  "Pune","Raigad","Ratnagiri","Sangli","Satara","Sindhudurg","Solapur","Thane","Wardha",
  "Washim","Yavatmal",
];

interface SuperAdminDashboardProps {
  user: UserProfile;
  activeTab: string;
  setTab: (t: string) => void;
}

export function SuperAdminDashboard({ user, activeTab, setTab }: SuperAdminDashboardProps) {
  const [selectedDistrict, setSelectedDistrict] = useState("ALL");
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // DHO Provisioning Modal
  const [showDhoModal, setShowDhoModal] = useState(false);
  const [dhoName, setDhoName] = useState("");
  const [dhoEmail, setDhoEmail] = useState("");
  const [dhoDistrict, setDhoDistrict] = useState("Nashik");
  const [dhoPassword, setDhoPassword] = useState("Password@123");
  const [dhoMsg, setDhoMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Facility Modal
  const [showFacModal, setShowFacModal] = useState(false);
  const [facName, setFacName] = useState("");
  const [facType, setFacType] = useState("DISTRICT_HOSPITAL");
  const [facDistrict, setFacDistrict] = useState("Nashik");
  const [facTotalBeds, setFacTotalBeds] = useState(100);
  const [facAvailableBeds, setFacAvailableBeds] = useState(45);

  const fetchStateData = async () => {
    setLoading(true);
    try {
      const [facRes, staffRes] = await Promise.all([
        facilitiesApi.list({ district: selectedDistrict !== "ALL" ? selectedDistrict : undefined }),
        adminApi.listStaff(),
      ]);
      setFacilities(facRes.data.facilities);
      setStaff(staffRes.data);
    } catch (err) {
      console.warn("Failed to load state admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStateData();
  }, [selectedDistrict]);

  const handleProvisionDho = async (e: React.FormEvent) => {
    e.preventDefault();
    setDhoMsg(null);
    try {
      await adminApi.provisionUser({
        email: dhoEmail,
        password: dhoPassword,
        fullName: dhoName,
        role: "DISTRICT_ADMIN",
        district: dhoDistrict,
      });
      setDhoMsg({ type: "success", text: `District Health Officer provisioned for ${dhoDistrict} district!` });
      setShowDhoModal(false);
      setDhoName("");
      setDhoEmail("");
      fetchStateData();
    } catch (err: any) {
      setDhoMsg({ type: "error", text: err.message || "Failed to provision DHO." });
    }
  };

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await facilitiesApi.create({
        name: facName,
        type: facType as any,
        district: facDistrict,
        totalBeds: Number(facTotalBeds),
        availableBeds: Number(facAvailableBeds),
        services: ["General Consultation", "Emergency ICU", "Maternal Care", "Advanced Diagnostics"],
      });
      setShowFacModal(false);
      setFacName("");
      fetchStateData();
    } catch (err: any) {
      alert(err.message || "Failed to create facility.");
    }
  };

  const dhoList = staff.filter((s) => s.role === "DISTRICT_ADMIN");

  return (
    <div className="space-y-6">
      {/* ─── STATE COMMAND OVERVIEW ───────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-[#0E4A43] text-white rounded-[32px] p-6 sm:p-8 relative overflow-hidden shadow-xs">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5F973]/20 border border-[#E5F973]/30 text-[#E5F973] text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#E5F973] animate-pulse" />
                  State Super Administrator Console • Government of Maharashtra
                </div>
                <h2 className="text-2xl sm:text-3xl font-black font-heading">
                  Statewide Health Infrastructure
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                  Total administrative oversight of public hospitals, district health officers (DHOs), bed capacities, and teleconsultation nodes across all 36 districts.
                </p>

                <div className="pt-2 flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setShowDhoModal(true)}
                    className="px-5 py-2.5 rounded-full bg-[#E5F973] text-slate-950 text-xs font-black hover:bg-[#d8ec68] transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                  >
                    + Provision District Admin (DHO)
                  </button>
                  <button
                    onClick={() => setShowFacModal(true)}
                    className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20"
                  >
                    + Register Healthcare Facility
                  </button>
                </div>
              </div>

              {/* State Macro Card */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 w-full lg:w-72 space-y-2 flex-shrink-0 text-xs">
                <span className="text-[10px] font-bold uppercase text-emerald-200 block">Maharashtra State Health KPI</span>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-emerald-100">Covered Districts:</span>
                  <span className="font-bold text-[#E5F973]">36 Districts</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-emerald-100">ABDM Registry Sync:</span>
                  <span className="font-bold text-white">100% Compliant</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-emerald-100">Active Medical Officers:</span>
                  <span className="font-bold text-emerald-300">1,240+ Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button onClick={() => setTab("facilities")} className="bg-[#EFF2F5] hover:bg-slate-200/70 p-5 rounded-[24px] border border-slate-200/50 text-left transition-all group">
              <div className="text-2xl font-black text-slate-900">{facilities.length || 24}</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Hospitals &amp; PHCs</div>
              <div className="text-[10px] text-slate-500">Across 36 districts</div>
            </button>

            <button onClick={() => setTab("dho_management")} className="bg-[#EFF2F5] hover:bg-slate-200/70 p-5 rounded-[24px] border border-slate-200/50 text-left transition-all group">
              <div className="text-2xl font-black text-indigo-700">{dhoList.length || 6} DHOs</div>
              <div className="text-xs font-bold text-slate-700 mt-1">District Health Officers</div>
              <div className="text-[10px] text-slate-500">Assigned district heads</div>
            </button>

            <button onClick={() => setTab("facilities")} className="bg-[#EFF2F5] hover:bg-slate-200/70 p-5 rounded-[24px] border border-slate-200/50 text-left transition-all group">
              <div className="text-2xl font-black text-emerald-700">4,200+</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Live Inpatient Beds</div>
              <div className="text-[10px] text-slate-500">State capacity</div>
            </button>

            <button onClick={() => setTab("system_health")} className="bg-[#EFF2F5] hover:bg-slate-200/70 p-5 rounded-[24px] border border-slate-200/50 text-left transition-all group">
              <div className="text-2xl font-black text-[#0E4A43]">99.98%</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Tele-OPD Uptime</div>
              <div className="text-[10px] text-slate-500">System latency &lt; 80ms</div>
            </button>
          </div>

          {/* Quick DHO Overview */}
          <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">District Health Officers (DHO Hierarchy)</h3>
                <p className="text-xs text-slate-500">Supervisory jurisdiction over district healthcare units.</p>
              </div>
              <button onClick={() => setTab("dho_management")} className="text-xs text-[#0E4A43] font-bold hover:underline">
                Manage All Admins &rsaquo;
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden text-xs">
              {dhoList.length > 0 ? (
                dhoList.map((d) => (
                  <div key={d.id} className="p-4 bg-white hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{d.fullName}</span>
                      <span className="text-slate-500 block">{d.email}</span>
                    </div>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-900 font-bold rounded-full">
                      District: {d.districtAdmin?.district || "Maharashtra"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400">
                  No DHOs assigned yet. Click "+ Provision District Admin (DHO)" above.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── ALL MAHARASHTRA FACILITIES TAB ──────────────────────────────────── */}
      {activeTab === "facilities" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">All Maharashtra Healthcare Facilities</h2>
              <p className="text-xs text-slate-500">Filter across all 36 districts of Maharashtra.</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
              >
                {MAHARASHTRA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d === "ALL" ? "All 36 Districts" : d}</option>
                ))}
              </select>
              <button
                onClick={() => setShowFacModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-[#0E4A43] text-white text-xs font-bold hover:bg-[#083530]"
              >
                + Add Facility
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-xs overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#EFF2F5] text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-5">Facility Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">District</th>
                    <th className="py-3 px-4">Bed Capacity</th>
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
                      <td className="py-3 px-4 text-slate-700 font-semibold">{fac.district}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">
                        {fac.bedStatus?.availableBeds ?? 0} / {fac.bedStatus?.totalBeds ?? 0} Free
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

      {/* ─── DHO & STAFF HIERARCHY TAB ────────────────────────────────────────── */}
      {activeTab === "dho_management" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">District Health Officers &amp; Staff Hierarchy</h2>
              <p className="text-xs text-slate-500">Provision DHOs for any district with full administrative jurisdiction.</p>
            </div>
            <button
              onClick={() => setShowDhoModal(true)}
              className="px-5 py-2.5 rounded-full bg-[#0E4A43] text-white text-xs font-black hover:bg-[#083530] transition-all shadow-xs flex items-center gap-1.5"
            >
              + Provision District Admin (DHO)
            </button>
          </div>

          <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-xs overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#EFF2F5] text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-5">Name &amp; Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Assigned Maharashtra District</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {staff.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-3 px-5 font-black text-slate-900">
                        <div>{s.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-normal">{s.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-900 text-[10px] font-black uppercase">
                          {s.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-bold">
                        {s.districtAdmin?.district || s.facilityAdmin?.facility?.district || "State System"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── SYSTEM HEALTH TAB ────────────────────────────────────────────────── */}
      {activeTab === "system_health" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">State System Health &amp; Security Audits</h2>
            <p className="text-xs text-slate-500">Live platform telemetry, Ayushman Bharat ABDM sync, and data privacy compliance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-[10px] font-bold uppercase text-emerald-800">ABDM Registry Sync</span>
              <div className="text-2xl font-black text-slate-900">100% Operational</div>
              <p className="text-xs text-slate-500">M1, M2 &amp; M3 milestones compliant.</p>
            </div>
            <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-[10px] font-bold uppercase text-emerald-800">Database Replication</span>
              <div className="text-2xl font-black text-emerald-700">Healthy (0 ms lag)</div>
              <p className="text-xs text-slate-500">PostgreSQL on Supabase Cloud.</p>
            </div>
            <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-[10px] font-bold uppercase text-emerald-800">Emergency Dispatch</span>
              <div className="text-2xl font-black text-[#0E4A43]">24x7 Ready</div>
              <p className="text-xs text-slate-500">108 &amp; 104 hotline integrations.</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADMIN ACCOUNT TAB ───────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <h3 className="text-base font-black text-slate-900">State Super Admin Credentials</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#EFF2F5] rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Admin Name</span>
                <span className="text-sm font-bold text-slate-900">{user.fullName}</span>
              </div>
              <div className="p-3.5 bg-[#EFF2F5] rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Privilege Level</span>
                <span className="text-sm font-bold text-purple-900">SUPER_ADMIN (Statewide)</span>
              </div>
              <div className="p-3.5 bg-[#EFF2F5] rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Official Email</span>
                <span className="text-sm font-bold text-slate-900">{user.email}</span>
              </div>
              <div className="p-3.5 bg-[#EFF2F5] rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Authority</span>
                <span className="text-sm font-bold text-[#0E4A43]">Govt of Maharashtra</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PROVISION DHO MODAL ─────────────────────────────────────────────── */}
      {showDhoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Provision District Health Officer (DHO)</h3>
              <button onClick={() => setShowDhoModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900">✕</button>
            </div>

            <form onSubmit={handleProvisionDho} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">DHO Full Name *</label>
                <input
                  type="text"
                  required
                  value={dhoName}
                  onChange={(e) => setDhoName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Shinde"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Official Email *</label>
                  <input
                    type="email"
                    required
                    value={dhoEmail}
                    onChange={(e) => setDhoEmail(e.target.value)}
                    placeholder="dho.nashik@swasthya.gov.in"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Initial Password *</label>
                  <input
                    type="text"
                    required
                    value={dhoPassword}
                    onChange={(e) => setDhoPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Assigned Maharashtra District *</label>
                <select
                  value={dhoDistrict}
                  onChange={(e) => setDhoDistrict(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold"
                >
                  {MAHARASHTRA_DISTRICTS.filter((d) => d !== "ALL").map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowDhoModal(false)} className="px-4 py-2.5 rounded-full text-slate-600 hover:bg-slate-100 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-full bg-[#0E4A43] text-white font-black hover:bg-[#083530]">
                  Create DHO Account
                </button>
              </div>
            </form>
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

            <form onSubmit={handleCreateFacility} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Facility Name *</label>
                <input
                  type="text"
                  required
                  value={facName}
                  onChange={(e) => setFacName(e.target.value)}
                  placeholder="e.g. Civil Hospital Nashik"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Facility Type *</label>
                  <select value={facType} onChange={(e) => setFacType(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold">
                    <option value="DISTRICT_HOSPITAL">District Hospital</option>
                    <option value="CHC">CHC</option>
                    <option value="PHC">PHC</option>
                    <option value="RURAL_HOSPITAL">Rural Hospital</option>
                    <option value="SUB_CENTRE">Sub Centre</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">District *</label>
                  <select value={facDistrict} onChange={(e) => setFacDistrict(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold">
                    {MAHARASHTRA_DISTRICTS.filter((d) => d !== "ALL").map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Total Beds</label>
                  <input type="number" value={facTotalBeds} onChange={(e) => setFacTotalBeds(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Available Beds</label>
                  <input type="number" value={facAvailableBeds} onChange={(e) => setFacAvailableBeds(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900" />
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
    </div>
  );
}
