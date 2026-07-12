# Server database boundary

Database client wrapping, tenant scope, and RLS helpers will live here. P00 has
no Prisma client, schema, connection, or data model; PR-2 owns that work. The
future package must not expose a raw database client to applications.
