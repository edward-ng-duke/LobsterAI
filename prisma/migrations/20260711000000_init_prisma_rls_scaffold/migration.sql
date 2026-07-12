-- P02 first recorded Prisma migration. Published migrations are immutable.
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE "tenants" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "slug" CITEXT NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "tenants_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tenants_slug_key" UNIQUE ("slug"),
  CONSTRAINT "tenants_slug_not_empty" CHECK (char_length("slug") > 0)
);

CREATE TABLE "agents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "logical_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "model" TEXT,
  "skill_ids" JSONB NOT NULL DEFAULT '[]',
  "working_directory" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "agents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "agents_tenant_id_logical_id_key" UNIQUE ("tenant_id", "logical_id"),
  CONSTRAINT "agents_logical_id_not_empty" CHECK (char_length("logical_id") > 0),
  CONSTRAINT "agents_tenant_id_fkey" FOREIGN KEY ("tenant_id")
    REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "agents_tenant_id_idx" ON "agents"("tenant_id");

ALTER TABLE "agents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agents" FORCE ROW LEVEL SECURITY;

CREATE POLICY "agents_tenant_isolation" ON "agents"
  FOR ALL
  USING ("tenant_id" = current_setting('app.tenant_id')::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id')::uuid);
