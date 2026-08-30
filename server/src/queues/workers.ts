import { Worker, Job } from 'bullmq';
import { redisConfig } from '../config/redis';
import {
  QueueName,
  NotificationJobData,
  OfflineSyncJobData,
  ReferralEscalationJobData,
} from './types';
import { logger } from '../utils/logger';

let notificationWorker: Worker<NotificationJobData, unknown, string> | null = null;
let offlineSyncWorker: Worker<OfflineSyncJobData, unknown, string> | null = null;
let referralEscalationWorker: Worker<ReferralEscalationJobData, unknown, string> | null = null;

/**
 * Worker 1: Notification Worker (Processes SMS, WhatsApp, and In-App Alerts)
 */
const createNotificationWorker = () => {
  return new Worker<NotificationJobData, unknown, string>(
    QueueName.NOTIFICATION,
    async (job: Job<NotificationJobData, unknown, string>) => {
      logger.info(`[NotificationWorker] Processing Job ID ${job.id} for ${job.data.recipientName} (${job.data.channel})`);
      
      // Simulation of Multilingual Alert Delivery (SMS / WhatsApp gateway)
      const { recipientPhone, language, channel, templateId, payload } = job.data;
      
      // In production, integrate MSG91 / Twilio / WhatsApp Business API
      logger.info(`[NotificationWorker] Sent ${templateId} via ${channel} in [${language}] to ${recipientPhone}`, payload);
      
      return { delivered: true, sentAt: new Date().toISOString() };
    },
    {
      connection: redisConfig,
      concurrency: 5,
    }
  );
};

/**
 * Worker 2: Offline Sync Worker (Processes batch uploads from ASHA / ANM workers)
 */
const createOfflineSyncWorker = () => {
  return new Worker<OfflineSyncJobData, unknown, string>(
    QueueName.OFFLINE_SYNC,
    async (job: Job<OfflineSyncJobData, unknown, string>) => {
      logger.info(`[OfflineSyncWorker] Ingesting Batch ${job.data.syncBatchId} (${job.data.recordsCount} records) by ${job.data.workerRole}`);
      
      // In production, validate schema, resolve conflicts, and batch upsert into MongoDB / PostgreSQL
      const { syncBatchId, workerId, recordsCount } = job.data;
      logger.info(`[OfflineSyncWorker] Successfully synchronized ${recordsCount} records for Worker [${workerId}] under Batch [${syncBatchId}]`);
      
      return { synced: true, batchId: syncBatchId, processedCount: recordsCount };
    },
    {
      connection: redisConfig,
      concurrency: 3,
    }
  );
};

/**
 * Worker 3: Referral Escalation Worker (Checks if urgent referral was acknowledged)
 */
const createReferralEscalationWorker = () => {
  return new Worker<ReferralEscalationJobData, unknown, string>(
    QueueName.REFERRAL_ESCALATION,
    async (job: Job<ReferralEscalationJobData, unknown, string>) => {
      logger.info(`[ReferralEscalationWorker] Checking SLA for Referral ID ${job.data.referralId} (Urgency: ${job.data.urgencyLevel})`);
      
      // In production, check if referral is still 'PENDING_ACKNOWLEDGEMENT'
      // If still pending, trigger emergency district escalation to CMO
      logger.warn(`[ReferralEscalationWorker] Referral ${job.data.referralId} SLA threshold reached. Escalation Level: ${job.data.escalationLevel}`);
      
      return { checked: true, escalated: true, referralId: job.data.referralId };
    },
    {
      connection: redisConfig,
      concurrency: 2,
    }
  );
};

/**
 * Start all BullMQ background workers
 */
export const startWorkers = (): void => {
  try {
    if (!notificationWorker) {
      notificationWorker = createNotificationWorker();
      notificationWorker.on('completed', (job) => {
        logger.info(`[NotificationWorker] Job ${job.id} completed successfully`);
      });
      notificationWorker.on('failed', (job, err) => {
        logger.error(`[NotificationWorker] Job ${job?.id} failed:`, err);
      });
    }

    if (!offlineSyncWorker) {
      offlineSyncWorker = createOfflineSyncWorker();
      offlineSyncWorker.on('completed', (job) => {
        logger.info(`[OfflineSyncWorker] Job ${job.id} completed successfully`);
      });
      offlineSyncWorker.on('failed', (job, err) => {
        logger.error(`[OfflineSyncWorker] Job ${job?.id} failed:`, err);
      });
    }

    if (!referralEscalationWorker) {
      referralEscalationWorker = createReferralEscalationWorker();
      referralEscalationWorker.on('completed', (job) => {
        logger.info(`[ReferralEscalationWorker] Job ${job.id} completed successfully`);
      });
      referralEscalationWorker.on('failed', (job, err) => {
        logger.error(`[ReferralEscalationWorker] Job ${job?.id} failed:`, err);
      });
    }

    logger.info('BullMQ: All queue workers registered and listening for jobs');
  } catch (error) {
    logger.error('BullMQ: Error starting queue workers:', error);
  }
};

/**
 * Stop and close all workers on server shutdown
 */
export const stopWorkers = async (): Promise<void> => {
  try {
    const promises: Promise<void>[] = [];
    if (notificationWorker) promises.push(notificationWorker.close());
    if (offlineSyncWorker) promises.push(offlineSyncWorker.close());
    if (referralEscalationWorker) promises.push(referralEscalationWorker.close());

    await Promise.all(promises);
    logger.info('BullMQ: All queue workers stopped');
  } catch (error) {
    logger.error('BullMQ: Error closing queue workers:', error);
  }
};
