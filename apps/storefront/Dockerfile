FROM node:20-alpine AS base
RUN npm install -g pnpm@9

# ---- deps ----
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/validators/package.json ./packages/validators/
COPY packages/ui/package.json ./packages/ui/
COPY apps/storefront/package.json ./apps/storefront/
RUN pnpm install --frozen-lockfile

# ---- builder ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/validators/node_modules ./packages/validators/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=deps /app/apps/storefront/node_modules ./apps/storefront/node_modules
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Generate Prisma client and copy binary to standard locations for pnpm
RUN pnpm --filter @store-builder/database db:generate && \
    PRISMA_DIR=$(find node_modules/.pnpm -path "*/@prisma+client*/.prisma" -type d 2>/dev/null | head -1) && \
    if [ -n "$PRISMA_DIR" ]; then \
      mkdir -p node_modules/.prisma && cp -r "$PRISMA_DIR/." node_modules/.prisma/; \
      mkdir -p packages/database/node_modules/.prisma && cp -r "$PRISMA_DIR/." packages/database/node_modules/.prisma/; \
    fi
RUN pnpm --filter @store-builder/storefront build

# ---- runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/storefront/.next/standalone ./
COPY --from=builder /app/apps/storefront/.next/static ./apps/storefront/.next/static
COPY --from=builder /app/apps/storefront/public ./apps/storefront/public

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/packages/database/node_modules/.prisma ./packages/database/node_modules/.prisma
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma

USER nextjs
EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/storefront/server.js"]
