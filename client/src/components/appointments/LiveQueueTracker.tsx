"use client";

import { useState, useEffect } from "react";
import {
  appointmentsApi,
  type PatientQueueStatus,
} from "@/lib/api";
import {
  Clock,
  UserCheck,
  Activity,
  Ticket,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Building2,
  Calendar,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";

interface LiveQueueTrackerProps {
  appointmentId: string;
  onClose?: () => void;
  onReschedule?: (appointmentId: string) => void;
}

export function LiveQueueTracker({
  appointmentId,
  onClose,
  onReschedule,
}: LiveQueueTrackerProps) {
  const [queueData, setQueueData] = useState<PatientQueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await appointmentsApi.getPatientQueue(appointmentId);
      if (res.success) {
        setQueueData(res.data);
        setError(null);
      }
    } catch (err: any) {
      console.error("Failed to load queue status:", err);
      setError(err.message || "Unable to fetch live queue");
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // Auto refresh queue position every 15 seconds
    const interval = setInterval(() => {
      fetchQueue();
    }, 15000);
    return () => clearInterval(interval);
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs text-center">
        <div className="inline-block w-6 h-6 border-2 border-[#0E4A43] border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs font-bold text-slate-500">Connecting to facility digital queue...</p>
      </div>
    );
  }

  if (error || !queueData) {
    return (
      <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error || "Queue status unavailable"}</span>
        </div>
        <button
          onClick={() => fetchQueue(true)}
          className="px-3 py-1 rounded-lg bg-white border border-rose-300 font-bold hover:bg-rose-100"
        >
          Retry
        </button>
      </div>
    );
  }

  const isYourTurn = queueData.status === "IN_PROGRESS";
  const isCompleted = queueData.status === "COMPLETED";
  const isCancelled = queueData.status === "CANCELLED";

  return (
    <div className="rounded-3xl bg-white border border-slate-200/90 shadow-md overflow-hidden animate-in fade-in duration-200">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-teal-900 to-[#0E4A43] text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-[#E5F973] animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-black tracking-tight">Live OPD Digital Queue</div>
            <div className="text-[10px] text-teal-200 font-medium">
              {queueData.facilityName} &bull; {queueData.doctorName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchQueue(true)}
            disabled={refreshing}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Refresh queue"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs text-teal-200 hover:text-white px-2 py-1 rounded-md"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Main Queue Stat Boxes matching FR-16 Specification */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          {/* Box 1: Current Token */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Current Token
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1 flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{queueData.currentToken}</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
              Now with Doctor
            </span>
          </div>

          {/* Box 2: Your Token */}
          <div className={`p-3.5 rounded-2xl border ${
            isYourTurn
              ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20"
              : "bg-teal-50/70 border-teal-200"
          }`}>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Your Token
            </span>
            <div className="text-2xl font-black text-[#0E4A43] mt-1">
              {queueData.yourToken}
            </div>
            <span className="text-[10px] font-bold text-[#0E4A43] block mt-0.5">
              {isYourTurn ? "It's Your Turn Now!" : queueData.slot || "Confirmed Slot"}
            </span>
          </div>

          {/* Box 3: Patients Ahead */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
              Patients Ahead
            </span>
            <div className="text-2xl font-black text-amber-950 mt-1">
              {isYourTurn ? "0" : queueData.patientsAhead}
            </div>
            <span className="text-[10px] font-bold text-amber-800 block mt-0.5">
              {isYourTurn
                ? "Entering consultation"
                : `~${queueData.estimatedWaitMinutes} mins estimated wait`}
            </span>
          </div>
        </div>

        {/* Dynamic Status Alert Banner */}
        {isYourTurn ? (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              <div>
                <div className="text-xs font-black uppercase tracking-wider">It is Your Turn!</div>
                <div className="text-[11px] text-emerald-100 font-medium">
                  Please step into Doctor Consultation Room with Dr. {queueData.doctorName}
                </div>
              </div>
            </div>
          </div>
        ) : isCompleted ? (
          <div className="p-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold text-center">
            Consultation completed for Token {queueData.yourToken}.
          </div>
        ) : isCancelled ? (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold text-center">
            This appointment was cancelled.
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>
                Estimated consultation call: <strong className="text-slate-900">in ~{queueData.estimatedWaitMinutes} minutes</strong>
              </span>
            </div>

            {onReschedule && (
              <button
                onClick={() => onReschedule(appointmentId)}
                className="text-xs font-bold text-[#0E4A43] hover:underline"
              >
                Can&apos;t wait? Reschedule &rarr;
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
