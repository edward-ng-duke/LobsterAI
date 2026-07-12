# RLS policy boundary

`tenant-scoped-models.json` is the completeness inventory, not a second policy
deployment source. Published policy SQL lives only in the matching Prisma
migration and is checked in both directions against the Prisma schema and the
live PostgreSQL catalogs.

Every inventory table must have `tenant_id UUID NOT NULL`, `ENABLE ROW LEVEL
SECURITY`, `FORCE ROW LEVEL SECURITY`, and symmetric `USING` / `WITH CHECK`
predicates. Missing `app.tenant_id` fails closed. Migration roles and application
roles are distinct; isolation tests must prove the application role is neither a
superuser, a `BYPASSRLS` role, nor the table owner.
