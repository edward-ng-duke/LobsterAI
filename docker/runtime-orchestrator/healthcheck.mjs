const port = Number(process.env.LOBSTER_RUNTIME_ORCHESTRATOR_PORT ?? '3001');
const response = await fetch(`http://127.0.0.1:${port}/healthz`, { signal: AbortSignal.timeout(2_000) });
if (!response.ok) process.exit(1);
