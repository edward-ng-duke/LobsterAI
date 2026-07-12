import { createServer, type Server } from 'node:http';
import { fileURLToPath } from 'node:url';

import { createAuthBoundary } from '@lobsterai/server-auth';
import { createDatabaseBoundary } from '@lobsterai/server-db';
import { ServiceLifecycle } from '@lobsterai/shared-types';

export const ApiRoute = {
  Health: '/healthz',
  Readiness: '/readyz',
} as const;

export interface ApiShellOptions {
  host: string;
  port: number;
}

export const readApiShellOptions = (environment: NodeJS.ProcessEnv = process.env): ApiShellOptions => {
  const rawPort = environment.LOBSTER_API_PORT ?? '3000';
  const port = Number(rawPort);
  if (!/^\d+$/.test(rawPort) || !Number.isSafeInteger(port) || port < 0 || port > 65_535) {
    throw new Error(`LOBSTER_API_PORT must be an integer between 0 and 65535; received ${rawPort}`);
  }
  return { host: environment.LOBSTER_API_HOST ?? '127.0.0.1', port };
};

export const createApiShell = (): Server => {
  const auth = createAuthBoundary();
  const database = createDatabaseBoundary();
  return createServer((request, response) => {
    const isKnownRoute = request.url === ApiRoute.Health || request.url === ApiRoute.Readiness;
    if (request.method !== 'GET' || !isKnownRoute) {
      response.writeHead(404, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: 'not_found' }));
      return;
    }
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(
      JSON.stringify({
        service: 'lobster-api',
        status: ServiceLifecycle.Ready,
        boundaries: { auth: auth.kind, database: database.kind },
      }),
    );
  });
};

export const startApiShell = async (options = readApiShellOptions()): Promise<Server> => {
  const server = createApiShell();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port, options.host, () => {
      server.off('error', reject);
      resolve();
    });
  });
  return server;
};

const isMainModule = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  const server = await startApiShell();
  console.log('[SaaS API] scaffold listening', server.address());
}
