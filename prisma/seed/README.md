# Deterministic development/test seed

`index.ts` creates two synthetic tenants. Each receives a distinct internal UUID
for the same external `logical_id = main`, proving tenant-local uniqueness. The
seed is idempotent and refuses to run outside `NODE_ENV=development|test`. It
contains no secrets, production endpoints, or real tenant data.
