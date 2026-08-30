export enum QueueName {
  NOTIFICATION = 'notification-queue',
  OFFLINE_SYNC = 'offline-sync-queue',
  REFERRAL_ESCALATION = 'referral-escalation-queue',
}

export interface NotificationJobData {
  recipientPhone: string;
  recipientEmail?: string;
  recipientName: string;
  language: 'marathi' | 'hindi' | 'english';
  channel: 'SMS' | 'WHATSAPP' | 'IN_APP';
  templateId: 'APPOINTMENT_REMINDER' | 'HIGH_RISK_FOLLOWUP' | 'MEDICINE_ALERT' | 'EMERGENCY_ESCALATION';
  payload: Record<string, string | number | boolean>;
}

export interface OfflineSyncJobData {
  syncBatchId: string;
  workerId: string;
  workerRole: 'ASHA' | 'ANM' | 'CHO';
  facilityId: string;
  recordsCount: number;
  dataPayload: {
    patients?: unknown[];
    screenings?: unknown[];
    vitalLogs?: unknown[];
    consultations?: unknown[];
  };
  submittedAt: string;
}

export interface ReferralEscalationJobData {
  referralId: string;
  patientId: string;
  patientName: string;
  sourceFacilityId: string;
  targetFacilityId: string;
  urgencyLevel: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  escalationLevel: number;
  reason: string;
}
