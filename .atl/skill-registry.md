# Canchero Skill Registry

**Last Generated**: 2026-05-18  
**Project**: canchero  
**Stack**: TypeScript, Turborepo, Next.js 15, Expo 54, Convex, Tamagui, Clerk

---

## Project Context

- **Monorepo Structure**: Turborepo + pnpm workspaces
- **Apps**: web (Next.js 15 App Router), mobile (Expo 54 + Expo Router)
- **Packages**: backend (Convex), auth (Clerk types), ui (Tamagui), tsconfig (base TypeScript)
- **Testing**: None configured (see Testing Capabilities below)
- **Linting**: ESLint v9 flat config (shared root), Prettier for formatting
- **Type Checking**: TypeScript strict mode, enabled in all packages

---

## Project Skills (User-Level)

These skills are registered from `~/.claude/skills/` and are relevant to Canchero's stack.

### Turborepo
**Triggers**: turbo.json, task pipelines, monorepo structure, --filter, package tasks  
**Compact Rules**:
- Prefer package tasks over root tasks — add scripts to each package's `package.json`, register in `turbo.json`, root delegates via `turbo run <task>`.
- Always use `turbo run` in scripts/CI (not shorthand `turbo build`) — shorthand is terminal only.
- Use `--filter` to target packages: `--filter=web` (by name), `--filter=./apps/*` (by directory), `--filter=web...` (+ dependencies).
- For changed packages, use `--affected` to auto-compare against default branch and include dependents.
- Caching: missing `outputs` key causes cache misses; `inputs` controls what invalidates cache; environment variables must be in `env` key.

**Skill Path**: `~/.claude/skills/turborepo/SKILL.md`

---

### Convex Quickstart
**Triggers**: New Convex setup, env vars, schema, functions, frontend wiring  
**Compact Rules**:
- For existing Convex project, start building — don't re-init.
- Client must be created at module scope (not in component) to avoid re-creation per render.
- Next.js: create `ConvexClientProvider` component, pass `process.env.NEXT_PUBLIC_CONVEX_URL` (not `process.env.CONVEX_URL`).
- Run `npx convex dev` in background terminal — it handles login, creates `convex/_generated/`, syncs on save.
- No test runner configured for backend functions.

**Skill Path**: `~/.claude/skills/convex-quickstart/SKILL.md`

---

### Tamagui
**Triggers**: Styled components, cross-platform UI, tokens, themes, animations, Tamagui imports  
**Compact Rules**:
- Generate project config first: `npx tamagui generate-prompt` → outputs tokens, themes, breakpoints, components.
- Use `styled()` with `as const` on variants for type safety.
- Tokens: use `$` prefix (`$4`, `$background`); respond to theme hierarchy.
- Stack components: `XStack` (row), `YStack` (column), `ZStack` (absolute); use `gap`, `padding` with `$` tokens.
- Responsive: media query props like `$gtSm`, `$gtMd`, `$gtLg` (check config for actual names).
- All Tamagui components in cross-platform apps require `'use client'` in Next.js App Router (RSC don't support context).

**Skill Path**: `~/.claude/skills/tamagui/SKILL.md`

---

### Clerk + Next.js Patterns
**Triggers**: Auth, middleware, Server Actions, session tokens, Clerk setup  
**Compact Rules**:
- Server: `await auth()` from `@clerk/nextjs/server` (must await!); Client: `useAuth()` hook from `@clerk/nextjs` (sync).
- Middleware: use `proxy.ts` (Next.js 16) or `middleware.ts` (<=15); must include `'/(api|trpc)(.*)'` matcher for API routes.
- Server Actions: check auth at start with `await auth().protect()`.
- `isAuthenticated`, `sessionStatus` available in Core 3+; use `!!userId` fallback for older versions.
- Cache: include `userId` in cache key to avoid serving wrong user's data.

**Skill Path**: `~/.claude/skills/clerk-nextjs-patterns/SKILL.md`

---

### Next.js Best Practices
**Triggers**: RSC, route handlers, async patterns, metadata, error handling, file conventions  
**Compact Rules**:
- Default to Node.js runtime; Edge only for lightweight, latency-critical routes.
- RSC boundaries: async/await in Server Components OK; async in Client Components invalid (use Server Actions instead).
- Async params/searchParams in Next.js 15+: must await before use.
- Use Server Components for data fetching; Client Components for interactivity.
- Error: use `error.tsx` for route-specific errors, `global-error.tsx` for app-level, `not-found.tsx` for 404.

**Skill Path**: `~/.claude/skills/next-best-practices/SKILL.md`

---

## Project Conventions (from CLAUDE.md)

### Atomic Design (All UI)
**Atoms** → minimal units (Button, Text, Input, Icon) → **Molecules** (SearchBar, FormField, Badge) → **Organisms** (Sidebar, ReservationCard) → **Templates** (page layout) → **Pages** (template + data).

**Rules**:
- Atoms don't import Molecules/Organisms.
- Molecules don't import Organisms.
- Organisms can import Molecules/Atoms.
- Templates have no business logic.
- Pages connect Organisms with Convex queries.

### Shared Infrastructure (Critical)
**NEVER put shared code in an app.** If 2+ apps need it → `packages/`.

| What | Where |
|------|-------|
| Convex schema, functions, auth.config.ts | `packages/backend/convex/` |
| Auth types, constants (SIGN_IN_URL, etc.) | `packages/auth/src/` |
| Tamagui components, reusable UI | `packages/ui/src/` |
| Next.js middleware, @clerk/nextjs config | `apps/web/` |
| Expo middleware, @clerk/expo config | `apps/mobile/` |

### Backend Architecture
- `convex/functions/` = ports (entry points); domain logic lives in `convex/lib/`.
- Modules don't import each other directly; receive data as parameters.
- Generated types in `_generated/` are auto-updated — never edit manually.
- Re-export API from `packages/backend/src/index.ts` — apps import from `@canchero/backend`.

### Mobile Native Shims
When a library has no web support (e.g., `react-native-maps`):
- Create `ComponentName.tsx` (native impl) + `ComponentName.web.tsx` (web fallback).
- Export same interface from both; Metro chooses `.web.tsx` automatically in web context.
- Do NOT use `Platform.OS === 'web'` inline — bundler includes native imports anyway.

### Icons
- **Web**: use `lucide-react` (installed).
- **Mobile**: use `@tamagui/lucide-icons-2` (Tamagui package, installed).
- **NEVER** use `@tamagui/lucide-icons` in web — not installed, won't resolve.
- Lucide icons use `currentColor` — pass color to parent Tamagui component, not icon.

### Convex Schema
```typescript
// Empty initially; will be built per feature
// packages/backend/convex/schema.ts
defineSchema({})
```

---

## Testing Capabilities

**Strict TDD Mode**: **DISABLED**

| Layer | Available | Tool/Command |
|-------|-----------|--------------|
| **Unit Tests** | ❌ | None configured |
| **Integration Tests** | ❌ | None configured |
| **E2E Tests** | ❌ | None configured |
| **Coverage** | ❌ | None available |
| **Linting** | ✅ | `pnpm lint` (ESLint v9 flat config) |
| **Type Checking** | ✅ | `pnpm type-check` (TypeScript strict) |
| **Formatting** | ✅ | `prettier --write .` |

**Detection Date**: 2026-05-18

**Next Step**: If testing is needed, evaluate Vitest (recommended for TS/monorepo) or Jest. Once a test runner is installed, re-run `sdd-init` to activate Strict TDD Mode.

---

## Persistence Configuration

**Artifact Store**: Engram (default for this session)  
**SDD Init Saved**: `sdd-init/canchero` (topic_key)  
**Testing Capabilities Saved**: `sdd/{project}/testing-capabilities` (topic_key)  
**Skill Registry Saved**: `skill-registry` (topic_key)

---

## Next Steps

1. Start SDD planning with `/sdd-new` or `/sdd-explore` to design features.
2. Use `/sdd-apply` to implement tasks; testing will use Standard Mode (write code, then verify).
3. When a test runner is installed, re-run `sdd-init` to enable Strict TDD Mode.
4. Reference this registry and the `CLAUDE.md` architecture file when writing code.

---

## Related Files

- `CLAUDE.md` — project architecture, conventions, tech stack
- `.atl/skill-registry.md` — this file
- Root `eslint.config.js` — shared linting (ESLint v9 flat)
- Root `turbo.json` — Turborepo task pipeline
- `pnpm-workspace.yaml` — workspace structure
