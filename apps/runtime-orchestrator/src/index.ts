import { createServer, type Server } from 'node:http';
import { fileURLToPath } from 'node:url';

import { ServiceLifecycle } from '@lobsterai/shared-types';

export interface RuntimeOrchestratorOptions {
  host: string;
  port: number;
}

export interface RuntimeOrchestratorSignalSource {
  once(event: 'SIGINT' | 'SIGTERM', listener: () => void): unknown;
  off(event: 'SIGINT' | 'SIGTERM', listener: () => void): unknown;
}

export const readRuntimeOrchestratorOptions = (
  environment: NodeJS.ProcessEnv = process.env,
): RuntimeOrchestratorOptions => {
  const rawPort = environment.LOBSTER_RUNTIME_ORCHESTRATOR_PORT ?? '3001';
  const port = Number(rawPort);
  if (!/^\d+$/.test(rawPort) || !Number.isSafeInteger(port) || port < 0 || port > 65_535) {
    throw new Error(
      `LOBSTER_RUNTIME_ORCHESTRATOR_PORT must be an integer between 0 and 65535; received ${rawPort}`,
    );
  }
  return { host: environment.LOBSTER_RUNTIME_ORCHESTRATOR_HOST ?? '127.0.0.1', port };
};

export const createRuntimeOrchestratorShell = (): Server =>
  createServer((request, response) => {
    if (request.method !== 'GET' || request.url !== '/healthz') {
      response.writeHead(404, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: 'not_found' }));
      return;
    }
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(
      JSON.stringify({
        service: 'lobster-runtime-orchestrator',
        status: ServiceLifecycle.Ready,
        runtimeOperations: 'not_configured',
      }),
    );
  });

export const startRuntimeOrchestratorShell = async (
  options = readRuntimeOrchestratorOptions(),
): Promise<Server> => {
  const server = createRuntimeOrchestratorShell();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port, options.host, () => {
      server.off('error', reject);
      resolve();
    });
  });
  return server;
};

export const installRuntimeOrchestratorSignalHandlers = (
  server: Server,
  signalSource: RuntimeOrchestratorSignalSource,
): (() => void) => {
  let closing = false;
  const stop = (): void => {
    if (closing) return;
    closing = true;
    server.close();
  };
  const removeHandlers = (): void => {
    signalSource.off('SIGINT', stop);
    signalSource.off('SIGTERM', stop);
  };
  signalSource.once('SIGINT', stop);
  signalSource.once('SIGTERM', stop);
  server.once('close', removeHandlers);
  return removeHandlers;
};

const isMainModule = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  const server = await startRuntimeOrchestratorShell();
  console.log('[Runtime Orchestrator] scaffold listening', server.address());
  installRuntimeOrchestratorSignalHandlers(server, process);
}
