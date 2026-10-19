import type { Job } from 'bullmq';
import logger from '../utils/logger';

const DEFAULT_SHUTDOWN_TIMEOUT_MS = 30000;

function getDefaultTimeoutMs(): number {
  const parsed = Number(process.env.WORKER_SHUTDOWN_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SHUTDOWN_TIMEOUT_MS;
}

export interface GracefulShutdownOptions {
  workerName?: string;
  timeoutMs?: number; // default WORKER_SHUTDOWN_TIMEOUT_MS or 30000
  onShutdown?: () => Promise<void> | void;
  exitProcess?: boolean; // default true (set to false in unit tests)
}

export interface CloseableWorker {
  close: (force?: boolean) => Promise<unknown>;
  disconnect?: () => Promise<unknown>;
  pause?: (doNotWaitActive?: boolean) => Promise<unknown>;
  on?(event: any, listener: (...args: any[]) => void): unknown;
}

/**
 * Registers SIGINT and SIGTERM listeners to gracefully shut down a worker,
 * allowing active BullMQ jobs to finish within the grace window. Jobs still
 * running when the window expires are moved back to the queue.
 */
export function setupWorkerGracefulShutdown(
  worker: CloseableWorker,
  options: GracefulShutdownOptions = {}
): (signal: string) => Promise<void> {
  const {
    workerName = 'Worker',
    timeoutMs = getDefaultTimeoutMs(),
    onShutdown,
    exitProcess = true,
  } = options;

  let isShuttingDown = false;

  // Track in-flight jobs so they can be re-queued if the grace window expires
  const activeJobs = new Set<Job>();
  if (typeof worker.on === 'function') {
    worker.on('active', (job: Job) => activeJobs.add(job));
    worker.on('completed', (job: Job) => activeJobs.delete(job));
    worker.on('failed', (job?: Job) => {
      if (job) activeJobs.delete(job);
    });
  }

  const requeueActiveJobs = async () => {
    for (const job of activeJobs) {
      try {
        await job.moveToDelayed(Date.now(), job.token);
        logger.warn(`Re-queued job ${job.id} that exceeded the shutdown window for ${workerName}`);
      } catch (requeueErr) {
        logger.error(`Failed to re-queue job ${job.id} for ${workerName}:`, requeueErr);
      }
    }
    activeJobs.clear();
  };

  const handleShutdown = async (signal: string) => {
    if (isShuttingDown) {
      logger.warn(`${signal} received again, graceful shutdown already in progress for ${workerName}`);
      return;
    }
    isShuttingDown = true;

    logger.info(`${signal} received: initiating graceful shutdown for ${workerName} (grace window: ${timeoutMs / 1000}s)`);

    // Setup grace window timer to prevent hanging
    const forceExitTimer = setTimeout(async () => {
      logger.error(`Graceful shutdown timed out after ${timeoutMs}ms for ${workerName}. Forcing exit.`);
      await requeueActiveJobs();
      try {
        await worker.close(true);
      } catch (closeErr) {
        logger.warn(`Warning force-closing ${workerName}:`, closeErr);
      }
      if (exitProcess) {
        process.exit(1);
      }
    }, timeoutMs);

    if (forceExitTimer.unref) {
      forceExitTimer.unref();
    }

    try {
      // 0. Stop accepting new jobs without waiting for the active ones
      if (typeof worker.pause === 'function') {
        await worker.pause(true);
      }

      // 1. Close BullMQ worker - waits for active jobs to finish
      logger.info(`Waiting for active jobs to finish and closing ${workerName}...`);
      await worker.close();
      logger.info(`${workerName} closed successfully`);

      // 2. Disconnect if supported
      if (typeof worker.disconnect === 'function') {
        try {
          await worker.disconnect();
          logger.info(`${workerName} disconnected from Redis`);
        } catch (disconnectErr) {
          logger.warn(`Warning disconnecting ${workerName}:`, disconnectErr);
        }
      }

      // 3. Custom cleanup hook if provided
      if (onShutdown) {
        logger.info(`Running additional cleanup for ${workerName}...`);
        await onShutdown();
        logger.info(`Additional cleanup completed for ${workerName}`);
      }

      clearTimeout(forceExitTimer);
      logger.info(`Graceful shutdown completed successfully for ${workerName} (${signal})`);
      if (exitProcess) {
        process.exit(0);
      }
    } catch (error) {
      clearTimeout(forceExitTimer);
      logger.error(`Error during graceful shutdown for ${workerName}:`, error);
      if (exitProcess) {
        process.exit(1);
      }
    }
  };

  process.on('SIGTERM', () => {
    void handleShutdown('SIGTERM');
  });

  process.on('SIGINT', () => {
    void handleShutdown('SIGINT');
  });

  return handleShutdown;
}
