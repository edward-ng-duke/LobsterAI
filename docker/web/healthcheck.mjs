const port = Number(process.env.LOBSTER_WEB_PORT ?? '8080');
const response = await fetch(`http://127.0.0.1:${port}/healthz`, { signal: AbortSignal.timeout(2_000) });
if (!response.ok) process.exit(1);
