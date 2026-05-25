# Tasks: Convex Domain Entities

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 180–240 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Write schema.ts + regenerate + update index.ts | PR 1 | All 3 file changes ship together |

---

## Phase 1: Foundation — Schema Creation

- [x] 1.1 Create `packages/backend/convex/schema.ts` — add `defineSchema` import + embedded object validators `HorarioConfig` and `PricingConfig` (flat, max 1 level deep)
- [x] 1.2 Add `users` table: clerkId (string), role (union enum admin/dueno/empleado/cliente), nombre, email, optional avatarUrl; index `by_clerkId`
- [x] 1.3 Add `sedeAccess` table: userId (id("users")), sedeId (id("sedes")); indexes `by_userId`, `by_sedeId`, `by_userId_sedeId`
- [x] 1.4 Add `sedes` table: duenoid (id("users")), nombre, direccion, telefono, horarios (HorarioConfig), pricingConfig (PricingConfig); optional descripcion, logoUrl, feriados (string[]); index `by_duenoid`
- [x] 1.5 Add `canchas` table: sedeId (id("sedes")), nombre, deporte, status (union enum activa/inactiva/mantenimiento); optional descripcion, precioOverride, horarioOverride (HorarioConfig shape); index `by_sedeId`
- [x] 1.6 Add `reservas` table: canchaId, sedeId (denorm), fecha, horaInicio, horaFin, status (union enum pendiente/confirmada/cancelada/completada), origen (union enum web/mobile/manual); optional clienteId, seriesId, notas, precioTotal; indexes `by_sedeId`, `by_canchaId_fecha`, `by_clienteId`, `by_seriesId`
- [x] 1.7 Add `payments` table: reservaId, sedeId (denorm), monto (number — ARS float, documented inline), tipo (union enum sena/saldo/total), metodo (union enum efectivo/transferencia/mercadopago), status (union enum pendiente/acreditado/rechazado/devuelto); optional mpPaymentId, notas; indexes `by_reservaId`, `by_sedeId`; add inline comment that mpPaymentId uniqueness is enforced at mutation layer
- [x] 1.8 Add `recurrenceSeries` table: sedeId, canchaId, frecuencia (enum semanal/quincenal), diaSemana (0–6 JS Date.getDay() — documented inline), horaInicio, horaFin, fechaInicio, status (enum activa/cancelada/completada); optional clienteId, fechaFin, notas; indexes `by_sedeId`, `by_canchaId`
- [x] 1.9 Add `clientes` table: sedeId, nombre, telefono; optional email, clerkId, notas; indexes `by_sedeId`, `by_clerkId`; add inline comment about per-sede scoping

## Phase 2: Inline Documentation

- [x] 2.1 Add JSDoc comment above `payments` table explaining why it is a separate table (MercadoPago split transactions, independent lifecycle)
- [x] 2.2 Add JSDoc comment above `clientes` table explaining per-sede scoping (dueño data isolation; same person at 2 sedes = 2 records)
- [x] 2.3 Add inline comment on `canchas.horarioOverride` explaining the override model (null = inherit from sede)
- [x] 2.4 Add JSDoc comment above `recurrenceSeries` explaining independence from Reserva instances (RFC 5545 EXDATE pattern — cancel instance ≠ cancel series)
- [x] 2.5 Add inline comment on `payments.monto` confirming ARS float pesos (not cents); add inline comment on `recurrenceSeries.diaSemana` confirming 0=Sunday (JS Date.getDay())

## Phase 3: Type Re-exports

- [x] 3.1 Modify `packages/backend/src/index.ts` — add `export type { Doc, Id } from '../convex/_generated/dataModel'`
- [x] 3.2 Verify the 8 `Doc<"tableName">` aliases and 4 `Id<"tableName">` aliases are derivable from the export (no additional hand-authored types needed — Convex inference handles them)

## Phase 4: Regeneration & Verification

- [ ] 4.1 Run `npx convex dev` (or `pnpm --filter @canchero/backend dev`) once to regenerate `packages/backend/convex/_generated/` with the new schema
- [ ] 4.2 Confirm `_generated/dataModel.d.ts` contains type entries for all 8 tables
- [ ] 4.3 Confirm `packages/backend/src/index.ts` compiles without TS errors (`tsc --noEmit` from packages/backend)
- [ ] 4.4 Confirm all 16 indexes are present in the generated output (verify against spec §4)

## Phase 5: Follow-up Flags (out of scope — document only)

- [x] 5.1 Add TODO comment in `users` table: "Populated by Clerk webhook — webhook handler is out of scope for this change"
- [x] 5.2 Add TODO comment in `payments` table: "mpPaymentId uniqueness enforced in mutation layer — Convex schema has no native unique constraint"
