import { EventEmitter, once } from 'node:events';

import { afterEach, describe, expect, test } from 'vitest';

import { createApiShell, readApiShellOptions } from '../apps/api/src/index.js';
import {
  createRuntimeOrchestratorShell,
  readRuntimeOrchestratorOptions,
} from '../apps/runtime-orchestrator/src/index.js';
import { createWorkerShell, installWorkerSignalHandlers } from '../apps/worker/src/index.js';

const openServers: ReturnType<typeof createApiShell>[] = [];

const listen = async (server: ReturnType<typeof createApiShell>): Promise<string> => {
  openServers.push(server);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected a TCP listener');
  return `http://127.0.0.1:${address.port}`;
};

afterEach(async () => {
  await Promise.all(
    openServers.splice(0).map(
      (server) =>
        new Promise<void>((resolve) => {
          server.close(() => resolve());
        }),
    ),
  );
});

describe('P00 executable application shells', () => {
  test('API serves health/readiness and rejects unsupported requests', async () => {
    const baseUrl = await listen(createApiShell());
    expect((await fetch(`${baseUrl}/healthz`)).status).toBe(200);
    expect((await fetch(`${baseUrl}/readyz`)).status).toBe(200);
    expect((await fetch(`${baseUrl}/missing`)).status).toBe(404);
    expect((await fetch(`${baseUrl}/healthz`, { method: 'POST' })).status).toBe(404);
  });

  test.each(['', '-1', '1.5', '3000x', '65536'])('API rejects invalid port %j', (port) => {
    expect(() => readApiShellOptions({ LOBSTER_API_PORT: port })).toThrow();
  });

  test('runtime orchestrator serves only its health route', async () => {
    const baseUrl = await listen(createRuntimeOrchestratorShell());
    expect((await fetch(`${baseUrl}/healthz`)).status).toBe(200);
    expect((await fetch(`${baseUrl}/missing`)).status).toBe(404);
  });

  test.each(['', '-1', '1.5', '3001x', '65536'])('runtime rejects invalid port %j', (port) => {
    expect(() => readRuntimeOrchestratorOptions({ LOBSTER_RUNTIME_ORCHESTRATOR_PORT: port })).toThrow();
  });

  test('worker lifecycle is idempotent and SIGTERM stops it', () => {
    const worker = createWorkerShell();
    const signals = new EventEmitter();
    const removeHandlers = installWorkerSignalHandlers(worker, signals);
    expect(worker.getStatus()).toBe('stopped');
    worker.start();
    worker.start();
    expect(worker.getStatus()).toBe('ready');
    signals.emit('SIGTERM');
    expect(worker.getStatus()).toBe('stopped');
    worker.stop();
    expect(worker.getStatus()).toBe('stopped');
    removeHandlers();
  });
});
