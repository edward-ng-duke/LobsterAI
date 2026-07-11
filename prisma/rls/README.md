# RLS policy boundary

Tenant policy SQL and its generator/checker belong here. PR-2 must enforce both
`ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` and test missing or
incorrect tenant context. P00 contains no policy that could be mistaken for a
deployed control.
