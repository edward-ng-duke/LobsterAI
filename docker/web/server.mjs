import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';

const root = '/opt/lobster/public';
const host = process.env.LOBSTER_WEB_HOST ?? '0.0.0.0';
const port = Number(process.env.LOBSTER_WEB_PORT ?? '8080');
const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
]);

const server = createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }
  if (request.url === '/healthz') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end('{"status":"ready"}');
    return;
  }
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
  const candidate = path.resolve(root, `.${pathname}`);
  const safeCandidate = candidate.startsWith(`${root}${path.sep}`) ? candidate : '';
  const filePath = safeCandidate && existsSync(safeCandidate) && statSync(safeCandidate).isFile()
    ? safeCandidate
    : path.join(root, 'index.html');
  response.writeHead(200, {
    'cache-control': filePath.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
    'content-type': contentTypes.get(path.extname(filePath)) ?? 'application/octet-stream',
    'x-content-type-options': 'nosniff',
  });
  if (request.method === 'HEAD') response.end();
  else createReadStream(filePath).pipe(response);
});

const shutdown = () => server.close(() => process.exit(0));
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
server.listen(port, host);
