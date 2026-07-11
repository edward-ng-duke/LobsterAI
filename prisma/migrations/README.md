# Migration policy

Directories use sortable UTC timestamps followed by a descriptive snake-case
name. `prisma migrate deploy` is the only production application path; it writes
the corresponding `_prisma_migrations` history. Published migration SQL is
immutable. Fixes are forward-only migrations; shared or production databases
must never be repaired by editing history or running ad-hoc down SQL.
