"use client";

import { useRef } from "react";
import {
  CheckCircle2,
  Calendar,
  Clock,
  Building2,
  User,
  Ticket,
  Printer,
  X,
  ArrowRight,
  ShieldCheck,
  MapPin,
} from "lucide-react";

interface AppointmentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackQueue?: (appointmentId: string) => void;
  appointment: {
    id: string;
    token?: string | null;
    appointmentDate: string | Date;
    slot: string;
    type?: string;
    doctor?: {
      user?: { fullName: string };
      specialty?: string | null;
    } | null;
    facility?: {
      name: string;
      district: string;
      village?: string | null;
      type?: string;
    } | null;
    patient?: {
      user?: { fullName: string; phone?: string | null };
    } | null;
  } | null;
}

export function AppointmentConfirmationModal({
  isOpen,
  onClose,
  onTrackQueue,
  appointment,
}: AppointmentConfirmationModalProps) {
  const slipRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !appointment) return null;

  const apptDate = new Date(appointment.appointmentDate);
  const formattedDate = apptDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const doctorName = appointment.doctor?.user?.fullName
    ? `Dr. ${appointment.doctor.user.fullName}`
    : "Medical Officer on Duty";

  const facilityName = appointment.facility?.name || "Primary Health Centre";
  const token = appointment.token || "A-01";
  const slotTime = appointment.slot;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        {/* Top celebratory banner */}
        <div className="bg-gradient-to-br from-[#0E4A43] to-[#165A51] px-6 py-7 text-white text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 rounded-full bg-[#E5F973] text-[#0E4A43] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-black/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black tracking-tight">Appointment Confirmed</h2>
          <p className="text-xs text-teal-100 font-medium mt-1">
            Your consultation token is registered in the live hospital queue
          </p>
        </div>

        {/* Official Slip Content matching FR-15 specification */}
        <div ref={slipRef} className="p-6 space-y-5 bg-white">
          {/* Token Callout Badge */}
          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#0E4A43] text-white flex items-center justify-center shadow-xs">
                <Ticket className="w-5 h-5 text-[#E5F973]" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Your Queue Token
                </span>
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  Token: {token}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-md bg-white border border-teal-200 text-xs font-black text-[#0E4A43] shadow-2xs">
                Active Slot
              </span>
            </div>
          </div>

          {/* Details Table */}
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/40 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Doctor:
              </span>
              <span className="font-black text-slate-900">{doctorName}</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-3">
              <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Facility:
              </span>
              <span className="font-black text-slate-900 text-right max-w-[220px] truncate">
                {facilityName}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-3">
              <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date:
              </span>
              <span className="font-black text-slate-900">{formattedDate}</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-3">
              <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Time / Slot:
              </span>
              <span className="font-black text-slate-900">{slotTime}</span>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1 text-amber-950">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              OPD Check-in Guidance:
            </div>
            <p>
              Please arrive 10 minutes prior to your slot. Show this digital token slip at the facility registration counter to proceed directly to the doctor&apos;s consultation room.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Slip</span>
          </button>

          {onTrackQueue && (
            <button
              onClick={() => {
                onTrackQueue(appointment.id);
                onClose();
              }}
              className="w-full sm:flex-1 px-4 py-2.5 rounded-xl bg-[#0E4A43] hover:bg-[#135E55] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>Track Live Queue</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#E5F973]" />
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
