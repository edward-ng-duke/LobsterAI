# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e
FROM node:24.18.0-alpine3.24@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS build
WORKDIR /src
ARG TARGETARCH
ENV OPENCLAW_SRC=/build/openclaw
COPY package.json package-lock.json ./
COPY scripts ./scripts
COPY openclaw-extensions ./openclaw-extensions
COPY resources ./resources
COPY SKILLs ./SKILLs
RUN apk add --no-cache bash ca-certificates git python3 make g++ pkgconfig
RUN npm ci --ignore-scripts --no-audit --no-fund
RUN case "$TARGETARCH" in amd64) target=linux-x64 ;; arm64) target=linux-arm64 ;; *) echo "unsupported architecture: $TARGETARCH" >&2; exit 1 ;; esac \
 && node scripts/ensure-openclaw-version.cjs \
 && node scripts/apply-openclaw-patches.cjs "$OPENCLAW_SRC" \
 && node scripts/run-build-openclaw-runtime.cjs "$target" \
 && node scripts/sync-openclaw-runtime-current.cjs "$target" \
 && node scripts/bundle-openclaw-gateway.cjs \
 && node scripts/ensure-openclaw-plugins.cjs \
 && node scripts/sync-local-openclaw-extensions.cjs \
 && node scripts/precompile-openclaw-extensions.cjs \
 && node scripts/install-openclaw-channel-deps.cjs \
 && node scripts/prune-openclaw-runtime.cjs \
 && current="$(realpath vendor/openclaw-runtime/current)" \
 && cp "$OPENCLAW_SRC/openclaw.mjs" "$current/openclaw.mjs" \
 && cp -R "$OPENCLAW_SRC/dist" "$current/dist"

FROM node:24.18.0-alpine3.24@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS production
RUN addgroup -S -g 10001 lobster && adduser -S -D -H -u 10001 -G lobster lobster
WORKDIR /opt/openclaw
COPY --from=build --chown=10001:10001 /src/vendor/openclaw-runtime/current /opt/openclaw
COPY --chown=10001:10001 docker/openclaw-runtime/entrypoint.sh docker/openclaw-runtime/healthcheck.mjs /opt/lobster/
ENV NODE_ENV=production OPENCLAW_VERSION=v2026.6.1 OPENCLAW_GATEWAY_PORT=18789 OPENCLAW_STATE_DIR=/state
EXPOSE 18789
USER 10001:10001
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=6 CMD ["node", "/opt/lobster/healthcheck.mjs"]
ENTRYPOINT ["/opt/lobster/entrypoint.sh"]
