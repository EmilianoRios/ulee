FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@11.1.0 --activate

WORKDIR /app

# Railway forwards matching service env vars as Docker build ARGs.
# Required for Next.js to inline NEXT_PUBLIC_* into the client bundle.
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

COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @canchero/web build

# Debug: verify .next contents after build
RUN echo "=== /app/apps/web/.next ===" && ls -la /app/apps/web/.next/ | head -25

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["sh", "-c", "echo '=== RUNTIME CHECK ===' && pwd && ls -la .next/ 2>&1 | head -20 && echo '=== STARTING ===' && exec pnpm start"]
