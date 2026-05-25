# Proposal: Convex Domain Entities

## Intent

The Convex backend (`packages/backend/convex/`) is empty — only boilerplate, no schema, no functions.
All domain data is currently hardcoded as mock objects in the frontend.
Without a real schema, no feature can be implemented, tested, or deployed against real data.
This change defines the complete domain entity model as a Convex schema so all downstream work (reservations, calendar, payments, clients, config) has a stable, typed foundation to build on.

## Scope

### In Scope

- `schema.ts` definition for all 8 entities: `User`, `SedeAccess`, `Sede`, `Cancha`, `Reserva`, `Payment`, `RecurrenceSeries`, `Cliente`
- Embedded sub-objects where appropriate (horario config, pricing config) per agreed model
- Convex index definitions for the most common query patterns (by `sedeId`, by `clerkId`, by `canchaId`, by `fecha`)
- TypeScript types re-exported from `packages/backend/src/index.ts`
- Inline documentation (comments) for non-obvious fields and design decisions

### Out of Scope

- Convex query/mutation functions (separate change)
- MercadoPago integration (separate change)
- Client rating / loyalty system (still in definition)
- Stats / reporting module (deferred — premium feature)
- Mobile-specific flows (depend on functions, not schema)
- Plan limits enforcement (Freemium/Premium — deferred)

## Capabilities

### New Capabilities

- `domain-schema`: Full Convex schema covering all 8 domain entities with indexes and TypeScript types

### Modified Capabilities

None

## Approach

Define all entities in a single `packages/backend/convex/schema.ts` using Convex's `defineSchema` + `defineTable` DSL.
Embed config sub-objects (schedule, pricing) directly inside `Sede` using `v.object()` — no separate tables needed since they are always read together and have no independent query needs.
Use Convex's native `v.id("table")` references for foreign keys.
Export types via `packages/backend/src/index.ts` so apps import `@canchero/backend` only.

Rationale for key decisions:
- **Payment as separate entity**: MercadoPago requires transaction IDs per payment — embedding in `Reserva` would complicate reconciliation.
- **Cliente scoped per Sede**: a person who visits two sedes is two `Cliente` records — avoids cross-sede data leakage.
- **Cancha price/schedule as overrides**: inheritance model (sede base, cancha override) avoids data duplication while preserving flexibility.
- **RecurrenceSeries independent from Reserva**: individual instances link back via `seriesId`; cancelling one does not mutate the series.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `packages/backend/convex/schema.ts` | New | Full schema definition |
| `packages/backend/src/index.ts` | Modified | Re-export inferred types |
| `packages/backend/convex/_generated/` | Auto-generated | Convex CLI regenerates after schema change |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Schema churn once functions are written | Med | Define indexes upfront based on known query patterns |
| Convex `v.object()` nesting limits for config blobs | Low | Keep config objects flat (1 level deep max) |
| `_generated/` out of sync in CI | Low | Document that `npx convex dev` must run after schema changes |

## Rollback Plan

Schema is additive-only at this stage (no data, no functions).
Rollback = revert the `schema.ts` commit and re-run `npx convex dev` to regenerate `_generated/`.
No data migration needed since the backend has no live data yet.

## Dependencies

- Convex CLI must be available (`npx convex dev`) to regenerate `_generated/` after schema write
- No external service dependencies for schema definition alone

## Success Criteria

- [ ] `packages/backend/convex/schema.ts` compiles without TypeScript errors
- [ ] `npx convex dev` regenerates `_generated/` successfully
- [ ] All 8 entities are present with correct field types and foreign key references
- [ ] Indexes cover the query patterns: by `sedeId`, by `clerkId`, by `canchaId + fecha`
- [ ] Types are importable from `@canchero/backend` in `apps/web` and `apps/mobile`
- [ ] Inline comments document the rationale for non-obvious design choices (payment split, cliente scope, override model)
