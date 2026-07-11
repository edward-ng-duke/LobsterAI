import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

import { checkHelmStatic, validateValues } from '../scripts/check-helm.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const chartRoot = path.join(repositoryRoot, 'charts', 'lobsterai');

const renderSources = (): string => readdirSync(path.join(chartRoot, 'templates'), { recursive: true })
  .filter((entry): entry is string => typeof entry === 'string' && /\.ya?ml$/.test(entry))
  .map(entry => readFileSync(path.join(chartRoot, 'templates', entry), 'utf8'))
  .join('\n---\n');

describe('P03 Helm security baseline', () => {
  test('chart has a strict values schema and four permanent workloads', () => {
    const schemaPath = path.join(chartRoot, 'values.schema.json');
    expect(existsSync(schemaPath)).toBe(true);
    const schema = readFileSync(schemaPath, 'utf8');
    expect(schema).toContain('sha256:');
    expect(schema).toContain('additionalProperties');

    const templates = renderSources();
    for (const component of ['web', 'api', 'worker', 'runtime-orchestrator']) {
      expect(templates, `${component} Deployment is missing`).toMatch(
        new RegExp(`kind:\\s*Deployment[\\s\\S]{0,1800}${component}`),
      );
    }
  });

  test('templates contain default deny, quota, least-privilege RBAC and safe pod defaults', () => {
    const templates = renderSources();
    expect(templates).toMatch(/kind:\s*NetworkPolicy/);
    expect(templates).toMatch(/policyTypes:\s*\n\s*- Ingress\s*\n\s*- Egress/);
    expect(templates).toMatch(/kind:\s*ResourceQuota/);
    expect(templates).toMatch(/kind:\s*Role/);
    expect(templates).not.toMatch(/resources:\s*\n\s*- ['"]?\*['"]?/);
    expect(templates).toContain('automountServiceAccountToken: false');
    expect(templates).toContain('runAsNonRoot: true');
    expect(templates).toContain('allowPrivilegeEscalation: false');
    expect(templates).toContain('readOnlyRootFilesystem: true');
    expect(templates).toContain('type: RuntimeDefault');
    expect(templates).not.toContain('0.0.0.0/0');
    expect(templates).not.toMatch(/(?:xvfb|x11vnc|novnc|\bdebug\b|:latest)/i);
  });

  test('sandbox activation remains fail-closed without runtime class and service account', () => {
    const sandbox = readFileSync(path.join(chartRoot, 'templates', 'sandbox-pod.yaml'), 'utf8');
    expect(sandbox).toContain('required "sandbox.runtimeClassName');
    expect(sandbox).toContain('required "sandbox.serviceAccountName');
    expect(sandbox).toContain('automountServiceAccountToken: false');
  });

  test('static checker accepts baseline and rejects schema/security mutations', async () => {
    expect(checkHelmStatic(repositoryRoot)).toEqual([]);
    const yaml = await import('js-yaml');
    const baseline = yaml.load(readFileSync(path.join(chartRoot, 'values.yaml'), 'utf8')) as Record<string, any>;

    const badDigest = structuredClone(baseline);
    badDigest.images.api.digest = 'latest';
    expect(validateValues(badDigest).join('\n')).toContain('sha256:<64hex>');

    const emptyResources = structuredClone(baseline);
    delete emptyResources.components.worker.resources.limits;
    expect(validateValues(emptyResources).join('\n')).toContain('invalid or empty quantity');

    const sandboxWithoutRuntime = structuredClone(baseline);
    sandboxWithoutRuntime.sandbox.enabled = true;
    expect(validateValues(sandboxWithoutRuntime).join('\n')).toContain('runtimeClassName is required');

    const unknownField = structuredClone(baseline);
    unknownField.privileged = true;
    expect(validateValues(unknownField).join('\n')).toContain('unknown field privileged');
  });
});
