import { existsSync, readdirSync,readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

import { checkHelmStatic, scanRenderedManifests, validateValues } from '../scripts/check-helm.mjs';

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

  test('service-plane NetworkPolicies are component-to-component and port-scoped', () => {
    const networkPolicies = readFileSync(
      path.join(chartRoot, 'templates', 'networkpolicies.yaml'),
      'utf8',
    );
    expect(networkPolicies).not.toContain('name: {{ include "lobsterai.fullname" . }}-allow-service-plane');
    for (const edge of ['web-to-api', 'worker-to-api', 'orchestrator-to-api']) {
      expect(networkPolicies).toContain(`-${edge}`);
    }
    expect(networkPolicies.match(/app\.kubernetes\.io\/component:/g)?.length ?? 0).toBeGreaterThanOrEqual(6);
    expect(networkPolicies.match(/ports:/g)?.length ?? 0).toBeGreaterThanOrEqual(4);

    const broad = `
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: p03-allow-service-plane }
spec:
  podSelector: { matchLabels: { app.kubernetes.io/part-of: lobsterai } }
  policyTypes: [Ingress, Egress]
`;
    expect(scanRenderedManifests(broad).join('\n')).toContain('broad allow-service-plane');

    const missingPort = `
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: p03-web-to-api }
spec:
  podSelector: { matchLabels: { app.kubernetes.io/component: web } }
  policyTypes: [Egress]
  egress:
    - to:
        - podSelector: { matchLabels: { app.kubernetes.io/component: api } }
`;
    expect(scanRenderedManifests(missingPort).join('\n')).toContain('explicit TCP port');
  });

  test('render scan rejects missing resources, probes and container security controls together', () => {
    const insecureDeployment = `
apiVersion: apps/v1
kind: Deployment
metadata: { name: insecure-web }
spec:
  template:
    spec:
      automountServiceAccountToken: true
      containers:
        - name: web
          image: registry.internal/lobster/web@sha256:${'a'.repeat(64)}
`;
    const errors = scanRenderedManifests(insecureDeployment).join('\n');
    expect(errors).toContain('service account token must not automount');
    expect(errors).toContain('pod securityContext is incomplete');
    expect(errors).toContain('container securityContext is incomplete');
    expect(errors).toContain('resources are required');
    expect(errors).toContain('readiness/liveness probes are required');
  });
});
