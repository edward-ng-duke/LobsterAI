# API application boundary

This deployable owns the future REST and WebSocket composition root. P00 only
provides executable health/readiness endpoints and explicit server boundary
objects. It contains no session, tenant, billing, provider, or runtime business
logic.

Production code in this boundary must not fetch packages, models, tools, or
other resources from the public internet. Approved internal services must be
injected through later, reviewed configuration.
