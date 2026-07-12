# Container build boundaries

Each subdirectory reserves one production deployable image boundary. P00 does
not ship Dockerfiles: PR-3 activates non-root images, health checks, SBOM, and
static/build validation. Debug images must remain separately named and may not
leak Xvfb/noVNC into production values.
