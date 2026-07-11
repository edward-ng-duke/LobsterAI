# Server authentication boundary

OIDC/JWT validation and tenant/member context parsing will live here. P00
contains no identity-provider configuration or authentication behavior. This
server-only package must never be imported by `apps/web`.
