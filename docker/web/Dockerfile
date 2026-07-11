# syntax=docker/dockerfile:1.7
FROM node:24.15.0-alpine@sha256:d1b3b4da11eefd5941e7f0b9cf17783fc99d9c6fc34884a665f40a06dbdfc94f AS build
WORKDIR /src
COPY package.json package-lock.json tsconfig.base.json tsconfig.workspace.json vite.config.ts ./
COPY apps ./apps
COPY libs ./libs
RUN npm ci --ignore-scripts --no-audit --no-fund \
 && npm run build --workspace @lobsterai/web

FROM node:24.15.0-alpine@sha256:d1b3b4da11eefd5941e7f0b9cf17783fc99d9c6fc34884a665f40a06dbdfc94f AS production
RUN addgroup -S -g 10001 lobster && adduser -S -D -H -u 10001 -G lobster lobster
WORKDIR /opt/lobster
COPY --from=build --chown=10001:10001 /src/apps/web/dist ./public
COPY --chown=10001:10001 docker/web/server.mjs docker/web/healthcheck.mjs ./
ENV NODE_ENV=production LOBSTER_WEB_HOST=0.0.0.0 LOBSTER_WEB_PORT=8080
EXPOSE 8080
USER 10001:10001
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 CMD ["node", "/opt/lobster/healthcheck.mjs"]
ENTRYPOINT ["node", "/opt/lobster/server.mjs"]
