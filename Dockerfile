# ─── Build stage ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@11.1.0 --activate

WORKDIR /app

# Railway forwards matching service env vars as Docker ARGs. Required for
# Next.js to inline NEXT_PUBLIC_* into the client bundle during `next build`.
ARG NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_CONVEX_SITE_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL
ARG NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
ARG CLERK_SECRET_KEY

ENV NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL
ENV NEXT_PUBLIC_CONVEX_SITE_URL=$NEXT_PUBLIC_CONVEX_SITE_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_URL
ENV NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/tsconfig/package.json ./packages/tsconfig/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @canchero/web build

# ─── Runtime stage ───────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Standalone output contains the server, minimal node_modules and the
# traced workspace deps. Static assets and public files are copied
# separately because Next.js does NOT include them in standalone.
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
