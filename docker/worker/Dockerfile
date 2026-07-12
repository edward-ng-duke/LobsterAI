# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e
FROM node:24.18.0-alpine3.24@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS build
WORKDIR /src
COPY package.json package-lock.json tsconfig.base.json tsconfig.workspace.json ./
COPY apps ./apps
COPY libs ./libs
RUN npm ci --ignore-scripts --no-audit --no-fund
RUN ./node_modules/.bin/esbuild apps/worker/src/index.ts --bundle --platform=node --format=esm --target=node24 --outfile=/out/index.mjs

FROM node:24.18.0-alpine3.24@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS production
RUN addgroup -S -g 10001 lobster && adduser -S -D -H -u 10001 -G lobster lobster
WORKDIR /opt/lobster
COPY --from=build --chown=10001:10001 /out/index.mjs ./index.mjs
COPY --chown=10001:10001 docker/worker/entrypoint.sh docker/worker/healthcheck.mjs ./
ENV NODE_ENV=production
USER 10001:10001
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 CMD ["node", "/opt/lobster/healthcheck.mjs"]
ENTRYPOINT ["/opt/lobster/entrypoint.sh"]
