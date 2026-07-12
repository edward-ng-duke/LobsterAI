# Shared contracts boundary

This is the sole future source of truth for OpenAPI, AsyncAPI, JSON Schema,
fixtures, and generated transport types. P00 establishes only the package
boundary; PR-1 owns actual route/channel contracts and generation gates. No
application may create a parallel handwritten DTO source.
