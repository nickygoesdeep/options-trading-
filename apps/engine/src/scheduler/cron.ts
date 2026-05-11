import type { CronJob, EngineConfig } from '@quant-engine/shared';

export interface Scheduler {
  start(config: EngineConfig): Promise<void>;
  stop(): Promise<void>;
  getJobs(): CronJob[];
}

/** TODO: Set up Vercel Cron-compatible scheduling. Register jobs for market open scan, intraday signal checks, and end-of-day reconciliation. Respect MARKET_OPEN (06:25 PST) and MARKET_CLOSE (13:05 PST) windows. */
export async function startScheduler(
  config: EngineConfig
): Promise<Scheduler> {
  throw new Error('TODO: implement startScheduler');
}
