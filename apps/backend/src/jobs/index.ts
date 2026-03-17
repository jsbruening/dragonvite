/**
 * Example Jobs
 * BullMQ job definitions and workers
 */

import { Queue, Worker, QueueOptions } from 'bullmq';
import { getConfig } from '../config.js';
import pino from 'pino';

const logger = pino();
const config = getConfig();

const queueOptions: QueueOptions = {
  connection: {
    host: new URL(config.REDIS_URL).hostname || 'localhost',
    port: parseInt(new URL(config.REDIS_URL).port || '6379'),
  },
};

/**
 * Email Job
 */
export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
}

export const emailQueue = new Queue<EmailJobData>(
  config.BULLMQ_QUEUE_NAME,
  queueOptions
);

export const emailWorker = new Worker<EmailJobData>(
  config.BULLMQ_QUEUE_NAME,
  async (job) => {
    logger.info({ jobId: job.id }, 'Processing email job');

    // TODO: Call Resend API to send email
    // const response = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
    //   body: JSON.stringify({ from: 'noreply@dragonvite.local', ...job.data })
    // });

    logger.info({ jobId: job.id }, 'Email job completed');
    return { success: true };
  },
  { connection: queueOptions.connection as any }
);

/**
 * LLM Job (AI content generation)
 */
export interface LLMJobData {
  prompt: string;
  model?: string;
}

export const llmQueue = new Queue<LLMJobData>(
  `${config.BULLMQ_QUEUE_NAME}:llm`,
  queueOptions
);

export const llmWorker = new Worker<LLMJobData>(
  `${config.BULLMQ_QUEUE_NAME}:llm`,
  async (job) => {
    logger.info({ jobId: job.id, prompt: job.data.prompt }, 'Processing LLM job');

    // TODO: Call Ollama API for content generation
    // const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
    //   method: 'POST',
    //   body: JSON.stringify({ model: job.data.model || OLLAMA_MODEL, prompt: job.data.prompt })
    // });

    logger.info({ jobId: job.id }, 'LLM job completed');
    return { success: true, result: 'Generated content' };
  },
  { connection: queueOptions.connection as any }
);

/**
 * Add email job to queue
 */
export async function addEmailJob(data: EmailJobData) {
  return emailQueue.add('send-email', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
}

/**
 * Add LLM job to queue
 */
export async function addLLMJob(data: LLMJobData) {
  return llmQueue.add('generate-content', data, {
    attempts: 2,
    backoff: { type: 'exponential', delay: 2000 },
  });
}

/**
 * Initialize all job workers
 */
export async function initializeJobs() {
  logger.info('Initializing job workers...');

  emailWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Email job completed');
  });

  emailWorker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error }, 'Email job failed');
  });

  llmWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'LLM job completed');
  });

  llmWorker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error }, 'LLM job failed');
  });

  logger.info('Job workers initialized');
}
