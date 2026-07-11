# syntax=docker/dockerfile:1.7
FROM node:24.15.0-alpine@sha256:d1b3b4da11eefd5941e7f0b9cf17783fc99d9c6fc34884a665f40a06dbdfc94f AS build
WORKDIR /src
COPY package.json package-lock.json tsconfig.base.json tsconfig.workspace.json ./
COPY apps ./apps
COPY libs ./libs
RUN npm ci --ignore-scripts --no-audit --no-fund \
 && ./node_modules/.bin/esbuild apps/runtime-orchestrator/src/index.ts --bundle --platform=node --format=esm --target=node24 --outfile=/out/index.mjs

FROM node:24.15.0-alpine@sha256:d1b3b4da11eefd5941e7f0b9cf17783fc99d9c6fc34884a665f40a06dbdfc94f AS production
RUN addgroup -S -g 10001 lobster && adduser -S -D -H -u 10001 -G lobster lobster
WORKDIR /opt/lobster
COPY --from=build --chown=10001:10001 /out/index.mjs ./index.mjs
COPY --chown=10001:10001 docker/runtime-orchestrator/healthcheck.mjs ./healthcheck.mjs
ENV NODE_ENV=production LOBSTER_RUNTIME_ORCHESTRATOR_HOST=0.0.0.0 LOBSTER_RUNTIME_ORCHESTRATOR_PORT=3001
EXPOSE 3001
USER 10001:10001
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 CMD ["node", "/opt/lobster/healthcheck.mjs"]
ENTRYPOINT ["node", "/opt/lobster/index.mjs"]
