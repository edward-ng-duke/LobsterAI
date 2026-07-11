import { fileURLToPath } from 'node:url';

import { ServiceLifecycle } from '@lobsterai/shared-types';

export interface WorkerShell {
  getStatus(): ServiceLifecycle;
  start(): void;
  stop(): void;
}

export const createWorkerShell = (): WorkerShell => {
  let status: ServiceLifecycle = ServiceLifecycle.Stopped;
  let keepAlive: NodeJS.Timeout | undefined;
  return {
    getStatus: () => status,
    start: () => {
      if (status === ServiceLifecycle.Ready) return;
      status = ServiceLifecycle.Starting;
      keepAlive = setInterval(() => undefined, 60_000);
      status = ServiceLifecycle.Ready;
    },
    stop: () => {
      status = ServiceLifecycle.Stopping;
      if (keepAlive) clearInterval(keepAlive);
      keepAlive = undefined;
      status = ServiceLifecycle.Stopped;
    },
  };
};

const isMainModule = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  const worker = createWorkerShell();
  worker.start();
  console.log('[SaaS Worker] scaffold started');
  const stop = (): void => worker.stop();
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}
