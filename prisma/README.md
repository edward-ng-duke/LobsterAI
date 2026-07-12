# Prisma and PostgreSQL boundary

This directory freezes the future PostgreSQL schema, migration, RLS, and seed
locations. P00 provides structural fixtures only. PR-2 activates Prisma CLI
validation, extension preflight, migrations, and executable RLS checks.

Generated Prisma client code will be written to `libs/server/db/generated` and
must carry the repository generated-file marker. No production database access
or tenant data is present in P00.
