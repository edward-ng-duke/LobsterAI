import { fileURLToPath } from 'node:url';

import { ServiceLifecycle } from '@lobsterai/shared-types';

export interface WorkerShell {
  getStatus(): ServiceLifecycle;
  start(): void;
  stop(): void;
}

export interface WorkerSignalSource {
  once(event: 'SIGINT' | 'SIGTERM', listener: () => void): unknown;
  off(event: 'SIGINT' | 'SIGTERM', listener: () => void): unknown;
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

export const installWorkerSignalHandlers = (
  worker: WorkerShell,
  signalSource: WorkerSignalSource,
): (() => void) => {
  const stop = (): void => worker.stop();
  signalSource.once('SIGINT', stop);
  signalSource.once('SIGTERM', stop);
  return () => {
    signalSource.off('SIGINT', stop);
    signalSource.off('SIGTERM', stop);
  };
};

const isMainModule = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  const worker = createWorkerShell();
  worker.start();
  console.log('[SaaS Worker] scaffold started');
  installWorkerSignalHandlers(worker, process);
}
