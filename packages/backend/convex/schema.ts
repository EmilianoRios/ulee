import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// ---------------------------------------------------------------------------
// Embedded config objects
// ---------------------------------------------------------------------------

// Schedule entry for a single day of the week
const daySchedule = v.object({
  dayOfWeek: v.number(), // ISO 8601: 1=Monday … 7=Sunday
  active: v.boolean(),
  openTime: v.string(),  // "HH:MM"
  closeTime: v.string(), // "HH:MM"
})

// Pricing configuration for a venue (inheritable by courts)
const pricingConfig = v.object({
  pricePerHour: v.number(),                  // ARS float pesos — NOT cents
  currency: v.literal('ARS'),
  depositPercentage: v.optional(v.number()), // 0–100; only used when policy = deposit
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
  }).index('by_clerkId', ['clerkId']),

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
    sport: v.string(),
    surface: v.optional(v.string()),
    covered: v.optional(v.boolean()),
    status: v.union(
      v.literal('active'),
      v.literal('maintenance'),
      v.literal('inactive'),
    ),
    images: v.optional(v.array(v.string())),
    priceOverride: v.optional(v.number()),
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
    startTime: v.string(),             // "HH:MM"
    endTime: v.string(),               // "HH:MM"
    clientName: v.string(),
    clientPhone: v.string(),
    status: v.union(
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
    notes: v.optional(v.string()),
    seriesId: v.optional(v.id('recurrenceSeries')),
    createdByUserId: v.optional(v.id('users')),
    clientUserId: v.optional(v.id('users')),
  })
    .index('by_courtId', ['courtId'])
    .index('by_venueId', ['venueId'])
    .index('by_date', ['date'])
    .index('by_venueId_date', ['venueId', 'date'])
    .index('by_seriesId', ['seriesId'])
    .index('by_clientUserId', ['clientUserId']),

  // -------------------------------------------------------------------------
  // payments
  // Separate table (not embedded) for MercadoPago transaction IDs + audit trail.
  // mercadopagoTransactionId uniqueness enforced at mutation layer —
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
      v.literal('mercadopago'),
    ),
    mercadopagoTransactionId: v.optional(v.string()),
    status: v.union(
      v.literal('pending'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('returned'),
    ),
    timestamp: v.number(),             // Unix ms
  })
    .index('by_reservationId', ['reservationId'])
    .index('by_mercadopagoTransactionId', ['mercadopagoTransactionId']),

  // -------------------------------------------------------------------------
  // recurrenceSeries
  // dayOfWeek ISO 8601: 1=Monday, 7=Sunday (NOT JS Date.getDay() 0-based).
  // weekInterval: 1=weekly, 2=biweekly.
  // Cancelling the series does NOT auto-cancel existing reservation instances.
  // -------------------------------------------------------------------------
  recurrenceSeries: defineTable({
    courtId: v.id('courts'),
    venueId: v.id('venues'),           // denormalized
    dayOfWeek: v.number(),             // ISO 8601: 1=Monday … 7=Sunday
    weekInterval: v.union(
      v.literal(1),
      v.literal(2),
    ),
    startTime: v.string(),             // "HH:MM"
    endTime: v.string(),               // "HH:MM"
    startDate: v.string(),             // "YYYY-MM-DD"
    endDate: v.optional(v.string()),   // "YYYY-MM-DD" — null = indefinite
    clientName: v.string(),
    clientPhone: v.string(),
    totalAmount: v.number(),           // ARS float pesos — NOT cents
    notes: v.optional(v.string()),
    status: v.union(
      v.literal('active'),
      v.literal('cancelled'),
      v.literal('completed'),
    ),
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
