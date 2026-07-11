# Supply-chain policy and evidence boundary

P03 activates deterministic inventory checks for every bundled skill, declared
OpenClaw plugin, local OpenClaw extension, built-in Kit, and MCP default. The
inventory is generated from repository sources and compared in both directions;
missing, ghost, duplicate, case-colliding, symlink-escaping, or integrity-drifted
assets fail the gate.

Production nodes and containers are offline. Runtime stages may not install or
download dependencies. Build environments may resolve only declared sources,
and every resolved package must be pinned and captured before promotion. Legacy
MCP marketplace templates that still use `latest` or an unversioned package are
inventoried as `blocked` and `productionEligible: false`; they are not approved
runtime inputs.

## Image evidence and publication

Each candidate image must be addressed by `sha256` digest and have an SPDX JSON
or CycloneDX JSON SBOM bound to the same image digest and 40-character source
commit. Missing evidence, digest drift, source drift, or any Critical finding is
fail-closed. A waiver needs an owner, a reason, and a future expiry; an expired
waiver fails automatically.

The internal registry and trusted signing identity are not yet frozen, so the
manifest intentionally records signature status `BLOCKED`. Local static checks,
builds, and SBOM generation can proceed, but publication and deployment must not
invent a signature, push to a public registry, or weaken the signature policy.

Secrets, registry credentials, `.npmrc`, tenant data, image archives, and build
caches must never be committed to this directory or included in reports. CI
evidence belongs in a dated directory such as
`docs/supply-chain/20260711_PR3部署供应链证据/` and must bind tool versions,
source SHA, image digest, SBOM hash, invocation ID, and timestamp.

## Rollback

Rollback uses the previous audited image digest and matching chart/values
digest. The SBOM and inventory snapshot must move with that digest. A candidate
with incomplete inventory, missing signature, or Critical findings is isolated
or deleted; it is never retained as a temporary deployable tag.
