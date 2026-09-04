"use client";

import { useState } from "react";
import { appointmentsApi, type Appointment } from "@/lib/api";
import { Calendar, Clock, X, Check, AlertCircle, ArrowRight } from "lucide-react";

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess: (updated: Appointment) => void;
}

const COMMON_SLOTS = [
  "Morning Slot 1 (09:00 AM - 10:00 AM)",
  "Morning Slot 2 (10:00 AM - 11:00 AM)",
  "Morning Slot 3 (11:00 AM - 12:00 PM)",
  "Afternoon Slot 1 (01:00 PM - 02:00 PM)",
  "Afternoon Slot 2 (02:00 PM - 03:00 PM)",
  "Afternoon Slot 3 (03:00 PM - 04:00 PM)",
  "Evening Slot (05:00 PM - 06:00 PM)",
];

export function RescheduleModal({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}: RescheduleModalProps) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const [newDate, setNewDate] = useState(minDate);
  const [newSlot, setNewSlot] = useState(COMMON_SLOTS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !appointment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await appointmentsApi.reschedule(appointment.id, {
        newDate,
        newSlot,
      });

      if (res.success) {
        onSuccess(res.data);
        onClose();
      } else {
        setError(res.message || "Failed to reschedule appointment.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to reschedule appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0E4A43]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Reschedule Appointment</h3>
              <p className="text-[11px] font-medium text-slate-500">
                FR-17: Pick a new date and consultation slot
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Booking Info */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Current Appointment
            </div>
            <div className="font-bold text-slate-900">
              Token: {appointment.token || "N/A"} &bull; {new Date(appointment.appointmentDate).toLocaleDateString()}
            </div>
            <div className="text-slate-500 text-[11px]">
              Slot: {appointment.slot}
            </div>
          </div>

          {/* New Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select New Date *
            </label>
            <input
              type="date"
              min={minDate}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-[#0E4A43] focus:ring-1 focus:ring-[#0E4A43]"
            />
          </div>

          {/* New Slot */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select New Consultation Slot *
            </label>
            <select
              value={newSlot}
              onChange={(e) => setNewSlot(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-[#0E4A43] focus:ring-1 focus:ring-[#0E4A43]"
            >
              {COMMON_SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#0E4A43] hover:bg-[#135E55] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-60"
            >
              <span>{submitting ? "Rescheduling..." : "Confirm Reschedule"}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#E5F973]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
