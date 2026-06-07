# TİGNAL API (NestJS) — Cloud Run container
# Kök dizinden derlenir:  docker build -f apps/api/Dockerfile -t tignal-api .

FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# Prisma için openssl gerekir
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

# ---- Bağımlılıklar ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile

# ---- Derleme ----
FROM base AS build
COPY --from=deps /app ./
COPY . .
RUN pnpm --filter @tignal/shared build \
  && pnpm --filter @tignal/db build \
  && pnpm --filter @tignal/api build

# ---- Çalışma ----
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app ./
WORKDIR /app/apps/api
# Cloud Run PORT'u env ile verir (varsayılan 8080); uygulama bunu okur.
EXPOSE 8080
CMD ["node", "dist/main.js"]
