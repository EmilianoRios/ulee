# Reservation Status Taxonomy

Single source of truth for all reservation status values, their labels, and their behavior per UI surface.

---

## Status Map

| DB value (`status`)  | Display state (calendar)  | StatusChip label | SlideOver label                   |
|----------------------|---------------------------|------------------|-----------------------------------|
| `pending`            | `pendiente`               | Pendiente        | Pendiente · a cobrar              |
| `deposit_paid`       | `señado`                  | Señado           | Señado · cobra al llegar          |
| `on_court`           | `en-cancha`               | En cancha        | En cancha                         |
| `absent`             | `ausente`                 | Ausente          | Ausente                           |
| `paid`               | `pagado`                  | Pagado           | Pagado                            |
| `maintenance`        | `mantenimiento`           | Mantenimiento    | Mantenimiento                     |
| `recurring`          | `recurrente`              | Recurrente       | Turno recurrente                  |
| `played`             | `jugado`                  | Jugado           | Jugado · cobro pendiente          |
| `event`              | `evento`                  | Evento           | Evento                            |

> **Label intent**: StatusChip/ReservationCard use short labels (chip space). SlideOver uses contextual labels with financial context. Both are intentionally different — they serve different purposes.

---

## Financial behavior per status

| Status          | `depositAmount` shown? | `pendingBalance` formula                           | SlideOver amount rows                                            |
|-----------------|------------------------|-----------------------------------------------------|------------------------------------------------------------------|
| `pending`       | No                     | `totalAmount`                                       | "A cobrar al llegar: $total"                                     |
| `deposit_paid`  | Yes                    | `totalAmount − depositAmount`                       | "Seña pagada: $dep" + "Saldo pendiente: $balance"                |
| `on_court`      | If deposit exists      | `totalAmount − depositAmount` or `totalAmount`      | With deposit: "Seña pagada" + "Saldo pendiente". Without: "A cobrar: $total" |
| `played`        | If deposit exists      | `totalAmount − depositAmount` or `totalAmount`      | With deposit: "Seña pagada" + "Saldo pendiente". Without: "A cobrar: $total" |
| `paid`          | N/A (fully paid)       | 0                                                   | "Cobrada en su totalidad"                                        |
| `absent`        | If deposit existed     | N/A                                                 | With deposit: "Seña retenida: $dep". Without: nothing            |
| `recurring`     | No                     | Custom per turn                                     | "Por turno: $total" (editable per charge)                        |
| `maintenance`   | No                     | N/A                                                 | "Liberar cancha" action only                                     |
| `event`         | No                     | `totalAmount`                                       | "Cobrar evento" action                                           |

---

## State transitions (allowed actions per status)

| From status    | Allowed transitions                                      |
|----------------|----------------------------------------------------------|
| `pending`      | → `paid` (full cobro), → `on_court` (marcar en cancha), → `absent` (marcar ausente) |
| `deposit_paid` | → `paid` (cobrar saldo), → `absent` (cancelar y retener seña) |
| `on_court`     | → `paid` (cobrar saldo or total), extend +30/+60 min    |
| `played`       | → `paid` (cobrar)                                        |
| `absent`       | (terminal) — can delete                                  |
| `paid`         | → `absent` (cancelar ya cobrada)                         |
| `recurring`    | → `paid` (cobrar turno), → `absent` (cancelar turno), cancel series |
| `maintenance`  | → delete (liberar cancha)                                |
| `event`        | → `paid` (cobrar evento), → `absent` (cancelar evento)  |

---

## Code locations

| Concern                              | File                                                                 |
|--------------------------------------|----------------------------------------------------------------------|
| DB status → CalendarReservationState | `apps/web/src/lib/convex/status-map.ts`                              |
| DB status → StatusChip label         | `apps/web/src/lib/convex/status-labels.ts`                           |
| CalendarReservationState → SlideOver label | `ReservationSlideOver.tsx` — `STATE_LABEL` constant             |
| CalendarReservationState → Card chip | `ReservationCard.tsx` — `STATE_LABEL` constant                       |
| `ReservationRow` type (includes `depositAmount`) | `packages/backend/convex/functions/reservations/queries.ts` |
| `CalendarReservation` type           | `apps/web/src/components/atoms/reservation-card/ReservationCard.tsx` |

---

## Effective status rules (client-side override — `applyEffectiveStatus`)

`applyEffectiveStatus` in `status-map.ts` applies a visual override without touching the DB. The Convex cron (`transitionExpiredReservations`) makes the DB authoritative once it runs.

| Condition                                          | Status that triggers | Result    |
|----------------------------------------------------|----------------------|-----------|
| Slot ended (past day or same-day past endTime)     | `deposit_paid`, `on_court`, `pending` | → `played` |
| Slot currently in progress (startTime ≤ now < endTime, same day) | `deposit_paid`, `pending` | → `on_court` |
| Slot currently in progress, already paid           | `paid` | stays `paid` (table/finance views) |

> **Note:** `paid → on_court` is intentionally scoped to `CalendarDayView.tsx` only (visual timeline). In Reservas and Finanzas tables, `paid` stays `paid`.

> **Overnight handling:** If `endTime (HH:MM) < startTime (HH:MM)` after `minutesToTime` wrapping, the slot ends on the next calendar day. `applyEffectiveStatus` detects this as `endMinsRaw < startMins` and adds 1440.

---

## Cron behavior (`transitionExpiredReservations`)

- **Runs every 5 minutes** via Convex cron.
- **Only** `deposit_paid` and `on_court` auto-transition to `played`.
- **`pending` stays `pending`** — the operator must reconcile: if the client came → mark `paid`; if not → mark `absent`. Auto-transitioning `pending → played` would create phantom debt for no-shows.
- **Overnight slots** (`endTime > 1440`): end date is computed as `date + 1 day`. Correctly handled.
- **Scale note:** `by_date` index scans ALL venues. Add pagination if reservation volume exceeds ~10k rows.

---

## Invariants (must never be violated)

1. `depositAmount` must flow from DB → `ReservationRow` → `CalendarReservation` → `ReservationSlideOver`. Any mapper that drops it breaks the "Seña pagada / Saldo pendiente" display.
2. `on_court` label must be "En cancha" in ALL surfaces (StatusChip, ReservationCard, SlideOver). It was previously "Paga en cancha" in StatusChip — that was a bug.
3. `played` status means the match happened but payment is still pending. Never confuse with `paid`.
4. `deposit_paid` = seña paid, balance owed. `paid` = fully settled. These are mutually exclusive.
5. `wasFullyPaid` in `CalendarReservation` is `true` only when `status === 'paid'`.
6. `paid → on_court` override is calendar-only. Table views (Reservas, Finanzas) must NOT apply this override — `paid` stays `paid` there.
7. `pending` reservations past their end time show as `played` in the UI (visual hint only). The DB keeps them as `pending` for operator reconciliation.
