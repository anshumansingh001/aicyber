import Queue from 'bull';
import config from '../../config';
import logger from '../../utils/logger';
import { QueueJob } from '../../types/global';

export interface QueueService {
  addJob(job: QueueJob): Promise<void>;
  processJob(jobName: string, processor: (job: any) => Promise<any>): void;
  getJobStatus(jobId: string): Promise<any>;
  getQueueStats(): Promise<any>;
  healthCheck(): Promise<boolean>;
}

export class BullQueueService implements QueueService {
  private queues: Map<string, Queue.Queue> = new Map();
  private redisConfig: any;

  constructor() {
    this.redisConfig = {
      host: config.redis.host,
      port: config.redis.port,
    };

    if (config.redis.password) {
      this.redisConfig.password = config.redis.password;
    }

    if (config.redis.db !== undefined) {
      this.redisConfig.db = config.redis.db;
    }
  }

  private getQueue(name: string): Queue.Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, { redis: this.redisConfig });
      
      // Set up queue event handlers
      queue.on('error', (error) => {
        logger.error(`Queue ${name} error:`, error);
      });

      queue.on('waiting', (jobId) => {
        logger.debug(`Job ${jobId} waiting in queue ${name}`);
      });

      queue.on('active', (job) => {
        logger.debug(`Job ${job.id} started processing in queue ${name}`);
      });

      queue.on('completed', (job, result) => {
        logger.info(`Job ${job.id} completed in queue ${name}`, { result });
      });

      queue.on('failed', (job, err) => {
        logger.error(`Job ${job.id} failed in queue ${name}:`, err);
      });

      this.queues.set(name, queue);
    }

    return this.queues.get(name)!;
  }

  async addJob(job: QueueJob): Promise<void> {
    const queue = this.getQueue(job.name);
    
    const jobOptions: any = {};
    if (job.priority !== undefined) jobOptions.priority = job.priority;
    if (job.delay !== undefined) jobOptions.delay = job.delay;
    if (job.attempts !== undefined) jobOptions.attempts = job.attempts;
    if (job.backoff !== undefined) jobOptions.backoff = job.backoff;

    await queue.add(job.data, jobOptions);
    
    logger.info(`Job added to queue ${job.name}`, {
      jobId: job.id,
      priority: job.priority,
      delay: job.delay,
    });
  }

  processJob(jobName: string, processor: (job: any) => Promise<any>): void {
    const queue = this.getQueue(jobName);
    
    queue.process(async (job) => {
      const startTime = Date.now();
      
      try {
        logger.info(`Processing job ${job.id} in queue ${jobName}`, {
          data: job.data,
          attempts: job.attemptsMade,
        });

        const result = await processor(job);
        
        const duration = Date.now() - startTime;
        logger.info(`Job ${job.id} completed successfully`, {
          duration: `${duration}ms`,
          result,
        });

        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        logger.error(`Job ${job.id} failed`, {
          duration: `${duration}ms`,
          error: error.message,
          attempts: job.attemptsMade,
        });
        
        throw error;
      }
    });
  }

  async getJobStatus(jobId: string): Promise<any> {
    for (const [queueName, queue] of this.queues) {
      const job = await queue.getJob(jobId);
      if (job) {
        return {
          id: job.id,
          queue: queueName,
          status: await job.getState(),
          data: job.data,
          progress: job.progress(),
          attempts: job.attemptsMade,
          timestamp: job.timestamp,
        };
      }
    }
    
    throw new Error(`Job ${jobId} not found`);
  }

  async getQueueStats(): Promise<any> {
    const stats: any = {};
    
    for (const [queueName, queue] of this.queues) {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
      ]);

      stats[queueName] = {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      };
    }
    
    return stats;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Try to create a test queue to check Redis connection
      const testQueue = new Queue('health-check', { redis: this.redisConfig });
      await testQueue.close();
      return true;
    } catch (error) {
      logger.error('Queue health check failed:', error);
      return false;
    }
  }

  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.queues.values()).map(queue => queue.close());
    await Promise.all(closePromises);
    this.queues.clear();
    logger.info('All queues closed');
  }
}

// Queue service factory
export class QueueServiceFactory {
  static create(): QueueService {
    return new BullQueueService();
  }
} 