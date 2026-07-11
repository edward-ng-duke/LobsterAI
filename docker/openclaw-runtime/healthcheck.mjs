import { readFileSync } from 'node:fs';

const expectedVersion = process.env.OPENCLAW_VERSION;
const packageJson = JSON.parse(readFileSync('/opt/openclaw/package.json', 'utf8'));
if (!expectedVersion || !String(expectedVersion).endsWith(String(packageJson.version))) process.exit(1);
