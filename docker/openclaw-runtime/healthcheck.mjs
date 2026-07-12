import { randomBytes } from 'node:crypto';
import { connect } from 'node:net';

const port = Number(process.env.OPENCLAW_GATEWAY_PORT ?? '18789');
const key = randomBytes(16).toString('base64');
const socket = connect({ host: '127.0.0.1', port });
const timeout = setTimeout(() => socket.destroy(new Error('gateway readiness timed out')), 3_000);
socket.setEncoding('utf8');
socket.once('connect', () => socket.write([
  'GET / HTTP/1.1',
  `Host: 127.0.0.1:${port}`,
  'Connection: Upgrade',
  'Upgrade: websocket',
  'Sec-WebSocket-Version: 13',
  `Sec-WebSocket-Key: ${key}`,
  '\r\n',
].join('\r\n')));
socket.once('data', (data) => {
  clearTimeout(timeout);
  socket.end();
  if (!String(data).startsWith('HTTP/1.1 101')) process.exitCode = 1;
});
socket.once('error', () => {
  clearTimeout(timeout);
  process.exitCode = 1;
});
