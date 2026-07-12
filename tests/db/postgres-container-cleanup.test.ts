import { describe, expect, test, vi } from 'vitest';

import { stopPostgresContainer } from '../../scripts/db/postgres-container-cleanup.mjs';

describe('PostgreSQL container cleanup evidence', () => {
  test('records a successful stop as attempted and removed', async () => {
    const stop = vi.fn().mockResolvedValue(undefined);

    await expect(stopPostgresContainer({ getId: () => 'container-id', stop })).resolves.toEqual({
      attempted: true,
      containerId: 'container-id',
      removed: true,
    });
    expect(stop).toHaveBeenCalledOnce();
  });

  test('records a stop fault without hiding the cleanup failure', async () => {
    const stop = vi.fn().mockRejectedValue(new Error('synthetic stop fault'));

    await expect(stopPostgresContainer({ getId: () => 'container-id', stop })).resolves.toEqual({
      attempted: true,
      containerId: 'container-id',
      removed: false,
      error: 'synthetic stop fault',
    });
  });

  test('records that startup failed before a container existed', async () => {
    await expect(stopPostgresContainer(undefined)).resolves.toEqual({
      attempted: false,
      removed: false,
    });
  });
});
