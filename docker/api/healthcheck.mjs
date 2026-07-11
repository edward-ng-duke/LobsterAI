const port = Number(process.env.LOBSTER_API_PORT ?? '3000');
const response = await fetch(`http://127.0.0.1:${port}/readyz`, { signal: AbortSignal.timeout(2_000) });
if (!response.ok) process.exit(1);
