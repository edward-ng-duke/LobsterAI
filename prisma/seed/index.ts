import { PrismaClient } from '../../libs/server/db/generated/index.js';

export const P02Seed = {
  tenantA: '10000000-0000-4000-8000-000000000001',
  tenantB: '20000000-0000-4000-8000-000000000002',
  agentMainA: 'a0000000-0000-4000-8000-000000000001',
  agentMainB: 'b0000000-0000-4000-8000-000000000002',
} as const;

const allowedEnvironments = new Set(['development', 'test']);

export const seedP02Fixtures = async (client: PrismaClient): Promise<void> => {
  if (!allowedEnvironments.has(process.env.NODE_ENV ?? '')) {
    throw new Error('P02 seed is restricted to NODE_ENV=development or test');
  }

  await client.tenant.upsert({
    where: { id: P02Seed.tenantA },
    update: { slug: 'p02-tenant-a', name: 'P02 Tenant A' },
    create: { id: P02Seed.tenantA, slug: 'p02-tenant-a', name: 'P02 Tenant A' },
  });
  await client.tenant.upsert({
    where: { id: P02Seed.tenantB },
    update: { slug: 'p02-tenant-b', name: 'P02 Tenant B' },
    create: { id: P02Seed.tenantB, slug: 'p02-tenant-b', name: 'P02 Tenant B' },
  });
  await client.agent.upsert({
    where: { id: P02Seed.agentMainA },
    update: { name: 'Main A' },
    create: {
      id: P02Seed.agentMainA,
      tenantId: P02Seed.tenantA,
      logicalId: 'main',
      name: 'Main A',
      skillIds: [],
    },
  });
  await client.agent.upsert({
    where: { id: P02Seed.agentMainB },
    update: { name: 'Main B' },
    create: {
      id: P02Seed.agentMainB,
      tenantId: P02Seed.tenantB,
      logicalId: 'main',
      name: 'Main B',
      skillIds: [],
    },
  });
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const client = new PrismaClient();
  seedP02Fixtures(client)
    .finally(() => client.$disconnect());
}
