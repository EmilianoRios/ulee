import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// ---------------------------------------------------------------------------
// Embedded config objects
// ---------------------------------------------------------------------------

// Schedule entry for a single day of the week
const daySchedule = v.object({
  dayOfWeek: v.number(), // ISO 8601: 1=Monday … 7=Sunday
  active: v.boolean(),
  openTime: v.number(),  // minutes since midnight (0–2879)
  closeTime: v.number(), // minutes since midnight; may be > 1440 for overnight
})

// Versioned schedule entry — one per schedule change, append-only
const scheduleVersion = v.object({
  validFrom: v.string(),            // "YYYY-MM-DD" inclusive
  validTo:   v.optional(v.string()), // "YYYY-MM-DD" exclusive; undefined = currently active
  schedule:  v.array(daySchedule),
})

// Pricing configuration for a venue (inheritable by courts)
const pricingConfig = v.object({
  pricePerHour: v.number(),                  // ARS float pesos — NOT cents
  currency: v.literal('ARS'),
  depositPercentage: v.optional(v.number()), // 0–100; only used when policy = deposit
  nightRatePrice: v.optional(v.number()),    // ARS float pesos — NOT cents
  nightRateStart: v.optional(v.number()),    // minutes since midnight (0–1439)
  chargePolicy: v.optional(v.union(
    v.literal('on_arrival'),
    v.literal('on_booking_deposit'),
    v.literal('on_booking_full'),
  )),
  bookingWindowDays: v.optional(v.number()),
  balanceDeadlineDays: v.optional(v.number()),
  allowedDurations: v.optional(v.array(v.number())),
})

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export default defineSchema({
  // -------------------------------------------------------------------------
  // users — populated by Clerk webhook (webhook handler out of scope here)
  // -------------------------------------------------------------------------
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal('admin'),
      v.literal('owner'),
      v.literal('employee'),
      v.literal('customer'),
    ),
    avatarUrl: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
  })
    .index('by_clerkId', ['clerkId'])
    .index('by_email', ['email']),

  // -------------------------------------------------------------------------
  // venueAccess — M2M between users and venues with a role qualifier
  // -------------------------------------------------------------------------
  venueAccess: defineTable({
    userId: v.id('users'),
    venueId: v.id('venues'),
    role: v.union(
      v.literal('owner'),
      v.literal('employee'),
      v.literal('manager'),
    ),
    status: v.optional(v.union(v.literal('pending'), v.literal('active'))),
  })
    .index('by_userId', ['userId'])
    .index('by_venueId', ['venueId'])
    .index('by_userId_venueId', ['userId', 'venueId']),

  // -------------------------------------------------------------------------
  // venues (sedes)
  // Config objects embedded — always read together, never queried independently.
  // -------------------------------------------------------------------------
  venues: defineTable({
    ownerId: v.id('users'),
    name: v.string(),
    description: v.optional(v.string()),
    address: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    schedule: v.array(daySchedule),        // 7 entries, one per day
    scheduleHistory: v.optional(v.array(scheduleVersion)), // append-only version log
    holidays: v.optional(v.array(v.object({
      date: v.string(),    // "YYYY-MM-DD"
      reason: v.string(),
    }))),
    pricingConfig: pricingConfig,
  }).index('by_ownerId', ['ownerId']),

  // -------------------------------------------------------------------------
  // courts (canchas)
  // priceOverride: null → inherit pricingConfig.pricePerHour from venue
  // scheduleOverride: null → inherit schedule from venue
  // status is independent from maintenance reservation blocks
  // -------------------------------------------------------------------------
  courts: defineTable({
    venueId: v.id('venues'),
    name: v.string(),
    sport: v.union(
      v.literal('Fútbol 5'),
      v.literal('Fútbol 7'),
      v.literal('Fútbol 8'),
      v.literal('Fútbol 11'),
      v.literal('Pádel'),
      v.literal('Tenis'),
      v.literal('Básquet'),
      v.literal('Otro'),
    ),
    surface: v.optional(v.union(
      v.literal('Sintético'),
      v.literal('Tierra'),
      v.literal('Hormigón'),
      v.literal('Madera'),
      v.literal('Cemento'),
      v.literal('Otro'),
    )),
    covered: v.optional(v.boolean()),
    status: v.union(
      v.literal('active'),
      v.literal('maintenance'),
      v.literal('inactive'),
    ),
    images: v.optional(v.array(v.string())),
    priceOverride: v.optional(v.number()),
    nightRatePriceOverride: v.optional(v.number()),
    scheduleOverride: v.optional(v.array(daySchedule)),
  }).index('by_venueId', ['venueId']),

  // -------------------------------------------------------------------------
  // reservations (reservas)
  // venueId is denormalized for efficient venue-level queries.
  // A maintenance reservation blocks a time slot independently of court.status.
  // Cancelling one instance of a series does NOT touch the recurrenceSeries doc.
  // -------------------------------------------------------------------------
  reservations: defineTable({
    courtId: v.id('courts'),
    venueId: v.id('venues'),           // denormalized
    date: v.string(),                  // "YYYY-MM-DD" — timezone AR UTC-3 handled at function layer
    startTime: v.number(),             // minutes since midnight (0–2879)
    endTime: v.number(),               // minutes since midnight (0–2879)
    clientName: v.string(),
    clientPhone: v.string(),
    status: v.union(
      v.literal('pending'),            // pendiente — reserva confirmada, cobro a realizarse en cancha
      v.literal('deposit_paid'),       // señado
      v.literal('on_court'),           // en-cancha
      v.literal('absent'),             // ausente
      v.literal('paid'),               // pagado
      v.literal('maintenance'),        // mantenimiento
      v.literal('recurring'),          // recurrente
      v.literal('played'),             // jugado — cobro pendiente
      v.literal('event'),              // evento especial
    ),
    totalAmount: v.number(),           // ARS float pesos — NOT cents
    depositAmount: v.optional(v.number()), // ARS float, frozen at creation — NOT cents
    notes: v.optional(v.string()),
    seriesId: v.optional(v.id('recurrenceSeries')),
    eventId: v.optional(v.string()),
    createdByUserId: v.optional(v.id('users')),
    clientUserId: v.optional(v.id('users')),
  })
    .index('by_courtId', ['courtId'])
    .index('by_venueId', ['venueId'])
    .index('by_date', ['date'])
    .index('by_venueId_date', ['venueId', 'date'])
    .index('by_seriesId', ['seriesId'])
    .index('by_clientUserId', ['clientUserId'])
    .index('by_eventId', ['eventId']),

  // -------------------------------------------------------------------------
  // payments
  // externalTransactionId uniqueness enforced at mutation layer —
  // Convex schema has no native unique constraint.
  // -------------------------------------------------------------------------
  payments: defineTable({
    reservationId: v.id('reservations'),
    type: v.union(
      v.literal('deposit'),  // seña
      v.literal('balance'),  // saldo
      v.literal('full'),     // pago completo
    ),
    amount: v.number(),                // ARS float pesos — NOT cents
    method: v.union(
      v.literal('cash'),
      v.literal('online'),
    ),
    externalTransactionId: v.optional(v.string()),
    status: v.union(
      v.literal('pending'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('returned'),
    ),
    timestamp: v.number(),             // Unix ms
  })
    .index('by_reservationId', ['reservationId'])
    .index('by_externalTransactionId', ['externalTransactionId']),

  // -------------------------------------------------------------------------
  // recurrenceSeries
  // diasSemana: ISO 8601 weekday array (1=Monday…7=Sunday) — multi-day support.
  // dayOfWeek: kept optional for backward compat; new mutations write diasSemana.
  // weekInterval: 1=weekly, 2=biweekly.
  // Cancelling the series does NOT auto-cancel existing reservation instances.
  // -------------------------------------------------------------------------
  recurrenceSeries: defineTable({
    courtId: v.id('courts'),
    venueId: v.id('venues'),           // denormalized
    diasSemana: v.array(v.number()),   // ISO 8601 weekdays: 1=Monday…7=Sunday
    dayOfWeek: v.optional(v.number()), // deprecated — use diasSemana; kept for backward compat
    weekInterval: v.union(
      v.literal(1),
      v.literal(2),
    ),
    startTime: v.number(),             // minutes since midnight (0–2879)
    endTime: v.number(),               // minutes since midnight (0–2879)
    startDate: v.string(),             // "YYYY-MM-DD"
    endDate: v.optional(v.string()),   // "YYYY-MM-DD" — undefined = indefinite
    clientName: v.string(),
    clientPhone: v.string(),
    totalAmount: v.number(),           // ARS float pesos — NOT cents
    notes: v.optional(v.string()),
    status: v.union(
      v.literal('active'),
      v.literal('cancelled'),
      v.literal('completed'),
    ),
    createdByUserId: v.optional(v.id('users')),
  })
    .index('by_venueId', ['venueId'])
    .index('by_courtId', ['courtId']),

  // -------------------------------------------------------------------------
  // customers (clientes)
  // Scoped per venue — same real-world person at 2 venues = 2 separate records.
  // clerkId is optional: a customer may exist before signing up in the mobile app.
  // -------------------------------------------------------------------------
  customers: defineTable({
    venueId: v.id('venues'),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    clerkId: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index('by_venueId', ['venueId'])
    .index('by_clerkId', ['clerkId']),
})
