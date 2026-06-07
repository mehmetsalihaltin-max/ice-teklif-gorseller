# TİGNAL Web (Next.js) — Cloud Run container
# Kök dizinden derlenir:
#   docker build -f apps/web/Dockerfile \
#     --build-arg NEXT_PUBLIC_API_URL=https://<api-url> -t tignal-web .

FROM node:20-slim AS base
RUN corepack enable
WORKDIR /app

# ---- Bağımlılıklar ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

# ---- Derleme ----
FROM base AS build
# NEXT_PUBLIC_* değişkenleri DERLEME anında gömülür; API adresi burada verilmeli.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY --from=deps /app ./
COPY . .
RUN pnpm --filter @tignal/shared build \
  && pnpm --filter @tignal/web build

# ---- Çalışma (standalone) ----
FROM base AS runtime
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=8080
WORKDIR /app
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
EXPOSE 8080
CMD ["node", "apps/web/server.js"]
