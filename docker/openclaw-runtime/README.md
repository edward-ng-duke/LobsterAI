# OpenClaw runtime image boundary

PR-3/PR-4 will build the Linux OpenClaw runtime image used by the V1 harness.
It must exclude Electron UI, Xvfb/noVNC, real secrets, tenant data, and all
production-time public downloads.
