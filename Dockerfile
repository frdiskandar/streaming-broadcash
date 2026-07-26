FROM node:20-slim AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/

RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY packages/server/ packages/server/
COPY packages/client/ packages/client/

RUN pnpm build

RUN mkdir -p packages/server/data packages/server/media

# Stage 2: Runtime
FROM node:20-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/pnpm-lock.yaml pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml pnpm-workspace.yaml
COPY --from=builder /app/package.json package.json
COPY --from=builder /app/packages/shared/package.json packages/shared/
COPY --from=builder /app/packages/server/package.json packages/server/
COPY --from=builder /app/packages/client/package.json packages/client/

RUN corepack enable && corepack prepare pnpm@latest --activate \
    && pnpm install --frozen-lockfile --prod \
    && corepack disable

COPY --from=builder /app/packages/shared/dist packages/shared/dist/
COPY --from=builder /app/packages/server/dist packages/server/dist/
COPY --from=builder /app/packages/client/dist packages/client/dist/

RUN mkdir -p packages/server/data packages/server/media

ENV NODE_ENV=production
ENV DB_PATH=packages/server/data/broadcast.db
ENV MEDIA_ROOT=packages/server/media

EXPOSE 1935 8080 8081 10080

CMD ["node", "packages/server/dist/index.js"]
