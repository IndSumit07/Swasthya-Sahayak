import { Queue, JobsOptions } from 'bullmq';
import { redisConfig } from '../config/redis';
import {
  QueueName,
  NotificationJobData,
  OfflineSyncJobData,
  ReferralEscalationJobData,
} from './types';
import { logger } from '../utils/logger';

/**
 * BullMQ Queues
 */
export const notificationQueue = new Queue<NotificationJobData, unknown, string>(QueueName.NOTIFICATION, {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

export const offlineSyncQueue = new Queue<OfflineSyncJobData, unknown, string>(QueueName.OFFLINE_SYNC, {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

export const referralEscalationQueue = new Queue<ReferralEscalationJobData, unknown, string>(QueueName.REFERRAL_ESCALATION, {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'fixed',
      delay: 3000,
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

/**
 * Dispatcher: Add a notification job (SMS / WhatsApp / Alerts)
 */
export const addNotificationJob = async (
  data: NotificationJobData,
  opts?: JobsOptions
) => {
  try {
    const jobName = `notify:${data.templateId}:${data.recipientPhone}`;
    const job = await notificationQueue.add(jobName, data, opts);
    logger.info(`Queue [${QueueName.NOTIFICATION}]: Dispatched Job ID [${job.id}] for ${data.recipientPhone}`);
    return job;
  } catch (error) {
    logger.error(`Queue [${QueueName.NOTIFICATION}]: Failed to dispatch job:`, error);
    throw error;
  }
};

/**
 * Dispatcher: Add an offline sync job (ASHA / ANM field batch upload)
 */
export const addOfflineSyncJob = async (
  data: OfflineSyncJobData,
  opts?: JobsOptions
) => {
  try {
    const jobName = `sync:${data.syncBatchId}:${data.workerId}`;
    const job = await offlineSyncQueue.add(jobName, data, opts);
    logger.info(`Queue [${QueueName.OFFLINE_SYNC}]: Dispatched Batch [${data.syncBatchId}] from Worker [${data.workerId}]`);
    return job;
  } catch (error) {
    logger.error(`Queue [${QueueName.OFFLINE_SYNC}]: Failed to dispatch job:`, error);
    throw error;
  }
};

/**
 * Dispatcher: Add a referral escalation job (with SLA delay)
 */
export const addReferralEscalationJob = async (
  data: ReferralEscalationJobData,
  delayMs: number = 3600000 // Default 1 hour SLA check
) => {
  try {
    const jobName = `escalate:${data.referralId}:level${data.escalationLevel}`;
    const job = await referralEscalationQueue.add(
      jobName,
      data,
      { delay: delayMs }
    );
    logger.info(`Queue [${QueueName.REFERRAL_ESCALATION}]: Scheduled Escalation Job [${job.id}] in ${delayMs / 1000}s`);
    return job;
  } catch (error) {
    logger.error(`Queue [${QueueName.REFERRAL_ESCALATION}]: Failed to schedule job:`, error);
    throw error;
  }
};

/**
 * Helper to get queue statistics (for health check / monitoring)
 */
export const getQueuesHealth = async () => {
  try {
    const [notifCounts, syncCounts, escCounts] = await Promise.all([
      notificationQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
      offlineSyncQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
      referralEscalationQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
    ]);

    return {
      status: 'HEALTHY',
      queues: {
        notificationQueue: notifCounts,
        offlineSyncQueue: syncCounts,
        referralEscalationQueue: escCounts,
      },
    };
  } catch (error) {
    return {
      status: 'UNHEALTHY',
      error: (error as Error).message,
    };
  }
};

export * from './types';
