# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e
FROM node:24.18.0-alpine3.24@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS build
WORKDIR /src
COPY package.json package-lock.json tsconfig.base.json tsconfig.workspace.json vite.config.ts ./
COPY apps ./apps
COPY libs ./libs
RUN npm ci --ignore-scripts --no-audit --no-fund
RUN npm run build --workspace @lobsterai/web

FROM node:24.18.0-alpine3.24@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS production
RUN addgroup -S -g 10001 lobster && adduser -S -D -H -u 10001 -G lobster lobster
WORKDIR /opt/lobster
COPY --from=build --chown=10001:10001 /src/apps/web/dist ./public
COPY --chown=10001:10001 docker/web/server.mjs docker/web/healthcheck.mjs ./
ENV NODE_ENV=production LOBSTER_WEB_HOST=0.0.0.0 LOBSTER_WEB_PORT=8080
EXPOSE 8080
USER 10001:10001
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 CMD ["node", "/opt/lobster/healthcheck.mjs"]
ENTRYPOINT ["node", "/opt/lobster/server.mjs"]
