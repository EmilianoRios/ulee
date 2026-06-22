import { v } from 'convex/values'

// ---------------------------------------------------------------------------
// Module Registry — single source of truth for all module slugs, labels,
// hrefs, and groupings. Consumers MUST import from here; no local copies.
// ---------------------------------------------------------------------------

export const MODULE_REGISTRY = {
  reservations: {
    label:  'Reservas',
    hrefs:  ['/reservas', '/calendario'],
    group:  'OPERACIONES' as const,
    parent: null,
  },
  finances: {
    label:  'Finanzas',
    hrefs:  ['/finanzas'],
    group:  'GESTION' as const,
    parent: null,
  },
  courts: {
    label:  'Canchas',
    hrefs:  ['/canchas'],
    group:  'GESTION' as const,
    parent: null,
  },
  customers: {
    label:  'Clientes',
    hrefs:  ['/clientes'],
    group:  'GESTION' as const,
    parent: null,
  },
  'config:general': {
    label:  'Información general',
    hrefs:  ['/configuracion/general'],
    group:  'SISTEMA' as const,
    parent: 'configuracion' as const,
  },
  'config:horarios': {
    label:  'Horarios',
    hrefs:  ['/configuracion/horarios'],
    group:  'SISTEMA' as const,
    parent: 'configuracion' as const,
  },
  'config:precios': {
    label:  'Precios y pagos',
    hrefs:  ['/configuracion/precios'],
    group:  'SISTEMA' as const,
    parent: 'configuracion' as const,
  },
  'config:feriados': {
    label:  'Feriados',
    hrefs:  ['/configuracion/feriados'],
    group:  'SISTEMA' as const,
    parent: 'configuracion' as const,
  },
} as const

export type ModuleSlug = keyof typeof MODULE_REGISTRY

export const moduleSlugValidator = v.union(
  v.literal('reservations'),
  v.literal('finances'),
  v.literal('courts'),
  v.literal('customers'),
  v.literal('config:general'),
  v.literal('config:horarios'),
  v.literal('config:precios'),
  v.literal('config:feriados'),
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Given a flat href (e.g. "/reservas"), returns the matching ModuleSlug or null.
 * Callers should strip the /${venueId} prefix before passing to this function.
 */
export function getModuleByHref(href: string): ModuleSlug | null {
  for (const [slug, entry] of Object.entries(MODULE_REGISTRY) as [ModuleSlug, { hrefs: readonly string[] }][]) {
    if (entry.hrefs.includes(href)) return slug
  }
  return null
}

/**
 * Returns a deduplicated array of all hrefs accessible by the given slugs.
 * Callers should strip the /${venueId} prefix when comparing against pathnames.
 */
export function getHrefsForModules(slugs: ModuleSlug[]): string[] {
  const seen = new Set<string>()
  for (const slug of slugs) {
    const entry = MODULE_REGISTRY[slug] as { hrefs: readonly string[] }
    for (const href of entry.hrefs) {
      seen.add(href)
    }
  }
  return Array.from(seen)
}
