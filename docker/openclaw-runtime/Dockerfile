# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e
FROM node:24.18.0-trixie-slim@sha256:366fdef91728b1b7fa18c84fba63b6e79ed77b7e10cc206878e9705da4d7b169 AS build
WORKDIR /src
ARG TARGETARCH
ENV OPENCLAW_SRC=/build/openclaw
COPY package.json package-lock.json ./
COPY scripts ./scripts
COPY openclaw-extensions ./openclaw-extensions
COPY resources ./resources
COPY SKILLs ./SKILLs
RUN apt-get update \
 && apt-get install -y --no-install-recommends bash ca-certificates git python3 make g++ pkg-config \
 && rm -rf /var/lib/apt/lists/*
RUN npm ci --ignore-scripts --no-audit --no-fund
RUN corepack enable
RUN case "$TARGETARCH" in amd64) target=linux-x64 ;; arm64) target=linux-arm64 ;; *) echo "unsupported architecture: $TARGETARCH" >&2; exit 1 ;; esac \
 && node scripts/ensure-openclaw-version.cjs \
 && node scripts/apply-openclaw-patches.cjs "$OPENCLAW_SRC" \
 && node scripts/run-build-openclaw-runtime.cjs "$target" \
 && node scripts/sync-openclaw-runtime-current.cjs "$target" \
 && node scripts/bundle-openclaw-gateway.cjs \
 && node scripts/ensure-openclaw-plugins.cjs \
 && node scripts/harden-openclaw-runtime-dependencies.mjs \
 && node scripts/sync-local-openclaw-extensions.cjs \
 && node scripts/precompile-openclaw-extensions.cjs \
 && node scripts/install-openclaw-channel-deps.cjs \
 && node scripts/prune-openclaw-runtime.cjs \
 && current="$(realpath vendor/openclaw-runtime/current)" \
 && cp "$OPENCLAW_SRC/openclaw.mjs" "$current/openclaw.mjs" \
 && cp -R "$OPENCLAW_SRC/dist" "$current/dist"

FROM ubuntu:26.04@sha256:b7f48194d4d8b763a478a621cdc81c27be222ba2206ca3ca6bc42b49685f3d9e AS production
RUN groupadd --gid 10001 lobster \
 && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin lobster
WORKDIR /opt/openclaw
COPY --from=build /usr/local/bin/node /usr/local/bin/node
COPY --from=build --chown=10001:10001 /src/vendor/openclaw-runtime/current /opt/openclaw
COPY --chown=10001:10001 docker/openclaw-runtime/entrypoint.sh docker/openclaw-runtime/healthcheck.mjs /opt/lobster/
ENV NODE_ENV=production OPENCLAW_VERSION=v2026.6.1 OPENCLAW_GATEWAY_PORT=18789 OPENCLAW_STATE_DIR=/state
EXPOSE 18789
USER 10001:10001
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=6 CMD ["node", "/opt/lobster/healthcheck.mjs"]
ENTRYPOINT ["/opt/lobster/entrypoint.sh"]
