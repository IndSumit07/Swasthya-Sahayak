"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, type UserProfile, type UserRole } from "@/lib/api";
import {
  LayoutDashboard,
  Building2,
  Users,
  Activity,
  User,
  Calendar,
  Pill,
  GitBranch,
  FlaskConical,
  CreditCard,
  Stethoscope,
  Clock,
  Search,
  Baby,
  Video,
  AlertTriangle,
  LogOut,
  Bed,
  ShieldCheck,
  PhoneCall,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  badge?: string;
  icon: React.ReactNode;
}

export const roleTitles: Record<UserRole, { title: string; subtitle: string; tagColor: string }> = {
  SUPER_ADMIN: {
    title: "State Super Admin",
    subtitle: "Govt of Maharashtra",
    tagColor: "bg-purple-100 text-purple-900 border-purple-200",
  },
  DISTRICT_ADMIN: {
    title: "District Health Officer (DHO)",
    subtitle: "District Health Admin",
    tagColor: "bg-indigo-100 text-indigo-900 border-indigo-200",
  },
  FACILITY_ADMIN: {
    title: "Hospital / Facility Admin",
    subtitle: "Facility Operations",
    tagColor: "bg-sky-100 text-sky-900 border-sky-200",
  },
  DOCTOR: {
    title: "Doctor / Specialist",
    subtitle: "Clinical Tele-OPD",
    tagColor: "bg-emerald-100 text-emerald-900 border-emerald-200",
  },
  HEALTH_WORKER: {
    title: "ASHA / ANM Worker",
    subtitle: "Frontline Outreach",
    tagColor: "bg-teal-100 text-teal-900 border-teal-200",
  },
  PATIENT: {
    title: "Citizen / Patient Portal",
    subtitle: "Public Health Access",
    tagColor: "bg-[#E5F973]/25 text-slate-900 border-[#E5F973]/40",
  },
};

export function getRoleNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case "SUPER_ADMIN":
      return [
        {
          id: "overview",
          label: "State Command Console",
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: "facilities",
          label: "All Maharashtra Facilities",
          icon: <Building2 className="w-4 h-4" />,
        },
        {
          id: "dho_management",
          label: "District Admins (DHOs)",
          icon: <Users className="w-4 h-4" />,
        },
        {
          id: "system_health",
          label: "System Audit & Metrics",
          icon: <Activity className="w-4 h-4" />,
        },
        {
          id: "profile",
          label: "Admin Account",
          icon: <User className="w-4 h-4" />,
        },
      ];

    case "DISTRICT_ADMIN":
      return [
        {
          id: "overview",
          label: "District Command Center",
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: "facilities",
          label: "District Hospitals & PHCs",
          icon: <Building2 className="w-4 h-4" />,
        },
        {
          id: "staff",
          label: "Clinical Staff & Admins",
          icon: <Users className="w-4 h-4" />,
        },
        {
          id: "referrals_audit",
          label: "Referrals & Bed Audits",
          icon: <GitBranch className="w-4 h-4" />,
        },
        {
          id: "profile",
          label: "My District Profile",
          icon: <User className="w-4 h-4" />,
        },
      ];

    case "FACILITY_ADMIN":
      return [
        {
          id: "overview",
          label: "Facility Snapshot",
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: "beds",
          label: "Live Bed Availability",
          icon: <Bed className="w-4 h-4" />,
        },
        {
          id: "pharmacy",
          label: "Pharmacy & Medicine Stock",
          icon: <Pill className="w-4 h-4" />,
        },
        {
          id: "diagnostics",
          label: "Diagnostic Tests Catalog",
          icon: <FlaskConical className="w-4 h-4" />,
        },
        {
          id: "staff_roster",
          label: "Doctor Duty Roster",
          icon: <Stethoscope className="w-4 h-4" />,
        },
        {
          id: "facility_details",
          label: "Facility Details",
          icon: <Building2 className="w-4 h-4" />,
        },
      ];

    case "DOCTOR":
      return [
        {
          id: "overview",
          label: "Doctor Overview",
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: "queue",
          label: "Tele-OPD Patient Queue",
          badge: "Live",
          icon: <Clock className="w-4 h-4" />,
        },
        {
          id: "prescribe",
          label: "Issue E-Prescriptions",
          icon: <Pill className="w-4 h-4" />,
        },
        {
          id: "referrals",
          label: "Hospital Referrals",
          icon: <GitBranch className="w-4 h-4" />,
        },
        {
          id: "patient_lookup",
          label: "Patient History Lookup",
          icon: <Search className="w-4 h-4" />,
        },
        {
          id: "credentials",
          label: "My Credentials & Roster",
          icon: <ShieldCheck className="w-4 h-4" />,
        },
      ];

    case "HEALTH_WORKER":
      return [
        {
          id: "overview",
          label: "Frontline Overview",
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: "triage",
          label: "Doorstep Clinical Triage",
          badge: "New",
          icon: <Stethoscope className="w-4 h-4" />,
        },
        {
          id: "tele_kiosk",
          label: "Assisted Tele-OPD Kiosk",
          icon: <Video className="w-4 h-4" />,
        },
        {
          id: "mch",
          label: "Maternal & Child Health",
          icon: <Baby className="w-4 h-4" />,
        },
        {
          id: "escalation",
          label: "Emergency Escalation (108)",
          icon: <AlertTriangle className="w-4 h-4" />,
        },
        {
          id: "profile",
          label: "Worker Profile & Area",
          icon: <User className="w-4 h-4" />,
        },
      ];

    case "PATIENT":
    default:
      return [
        {
          id: "overview",
          label: "Health Overview",
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: "appointments",
          label: "Book OPD / Consultations",
          icon: <Calendar className="w-4 h-4" />,
        },
        {
          id: "prescriptions",
          label: "Digital Prescriptions",
          icon: <Pill className="w-4 h-4" />,
        },
        {
          id: "referrals",
          label: "Inter-Facility Referrals",
          icon: <GitBranch className="w-4 h-4" />,
        },
        {
          id: "lab_reports",
          label: "Diagnostic Lab Reports",
          icon: <FlaskConical className="w-4 h-4" />,
        },
        {
          id: "profile",
          label: "ABHA Health Profile",
          icon: <CreditCard className="w-4 h-4" />,
        },
      ];
  }
}

interface DashboardSidebarProps {
  user: UserProfile;
  activeTab: string;
  setTab: (tab: string) => void;
}

export function DashboardSidebar({ user, activeTab, setTab }: DashboardSidebarProps) {
  const router = useRouter();
  const navItems = getRoleNavItems(user.role);
  const roleMeta = roleTitles[user.role] ?? roleTitles.PATIENT;

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      router.push("/login");
    }
  };

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col min-h-screen bg-[#0E4A43] text-white p-4 border-r border-[#0E4A43]/40 select-none">
      {/* Brand Header */}
      <div className="px-2 py-4 mb-2">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-2xl bg-[#E5F973] text-[#0E4A43] flex items-center justify-center font-black text-lg group-hover:scale-105 transition-transform shadow-xs">
            <Activity className="w-5 h-5 text-[#0E4A43]" />
          </div>
          <div>
            <span className="font-black text-base tracking-tight text-white block leading-tight">Swasthya Sahayak</span>
            <span className="text-[10px] text-[#E5F973] font-bold tracking-wider uppercase block">Government of Maharashtra</span>
          </div>
        </Link>
      </div>

      {/* User Role Card */}
      <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 mb-6 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase text-[#E5F973] tracking-wide">
            {roleMeta.title}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div className="text-sm font-bold text-white truncate">{user.fullName}</div>
        <div className="text-[11px] text-slate-300 truncate">{user.email}</div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 space-y-1 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] font-black uppercase text-slate-300 tracking-wider">
          Workspace Navigation
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left ${
                isActive
                  ? "bg-[#E5F973] text-[#0E4A43] font-black shadow-sm"
                  : "text-slate-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? "text-[#0E4A43]" : "text-slate-300"}>{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    isActive ? "bg-[#0E4A43] text-[#E5F973]" : "bg-[#E5F973] text-[#0E4A43]"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / Quick Links */}
      <div className="pt-4 border-t border-white/10 space-y-2">
        <Link
          href="/facilities"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Building2 className="w-4 h-4 text-[#E5F973]" />
          <span>Public Hospital Directory</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
