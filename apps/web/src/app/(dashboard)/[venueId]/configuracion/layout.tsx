'use client'

import { useTheme } from 'tamagui'
import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useConvexAuth } from 'convex/react'
import { api } from '@canchero/backend'
import type { ModuleSlug } from '@canchero/backend'
import type { Id } from '@canchero/backend'
import { ModuleLayout } from '@/components/templates/module-layout'

// ─── Tab definitions ──────────────────────────────────────────────────────────

interface TabDef {
  id:    string
  label: string
  href:  string         // flat href, e.g. '/configuracion/horarios'
  slug?: ModuleSlug     // config:* slug that unlocks this tab; absent = owner-only
}

const TABS: TabDef[] = [
  { id: 'general',  label: 'Información general', href: '/configuracion/general',  slug: 'config:general'  },
  { id: 'horarios', label: 'Horarios',             href: '/configuracion/horarios', slug: 'config:horarios' },
  { id: 'precios',  label: 'Precios y pagos',      href: '/configuracion/precios',  slug: 'config:precios'  },
  { id: 'feriados', label: 'Feriados',             href: '/configuracion/feriados', slug: 'config:feriados' },
  { id: 'equipo',   label: 'Equipo',               href: '/configuracion/equipo'                            },
]

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function ConfiguracionLayout({ children }: { children: React.ReactNode }) {
  const t        = useTheme()
  const pathname = usePathname()
  const params   = useParams()
  const venueId  = params?.venueId as Id<'venues'> | undefined

  const { isAuthenticated } = useConvexAuth()
  const userStatus  = useQuery(api.functions.users.queries.getCurrentUserStatus,  isAuthenticated ? {} : 'skip')
  const venueAccess = useQuery(
    api.functions.users.queries.getMyVenueAccessForVenue,
    isAuthenticated && venueId ? { venueId } : 'skip',
  )

  const isEmployee     = userStatus?.role === 'employee'
  const allowedModules = venueAccess?.allowedModules as ModuleSlug[] | undefined

  // Filter visible tabs
  const visibleTabs: TabDef[] = TABS.filter((tab) => {
    if (!isEmployee) return true           // owner/admin sees all tabs
    if (tab.id === 'equipo') return false  // equipo is owner-only
    if (!tab.slug) return false
    return (allowedModules ?? []).includes(tab.slug)
  })

  // Derive active tab from pathname (strip /${venueId} prefix first)
  const prefix      = venueId ? `/${venueId}` : ''
  const flatPath    = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname
  const activeTabId = TABS.find(tab => flatPath === tab.href || flatPath.startsWith(tab.href + '/'))?.id ?? null

  const strip = (
    <>
      {/* Dark header */}
      <div style={{
        height:          56,
        display:         'flex',
        alignItems:      'center',
        padding:         '0 32px',
        backgroundColor: t.cabeceraOscura.val,
      }}>
        <span style={{
          fontSize:      15,
          fontWeight:    600,
          color:         'oklch(97% 0.006 220)',
          letterSpacing: '-0.01em',
          lineHeight:    1,
          userSelect:    'none',
        }}>
          Configuración
        </span>
      </div>

      {/* Tab bar */}
      <div style={{
        display:         'flex',
        alignItems:      'stretch',
        padding:         '0 24px',
        borderBottom:    `1px solid ${t.divisor.val}`,
        backgroundColor: t.superficieContenido.val,
        height:          44,
        gap:             0,
      }}>
        {visibleTabs.map(tab => {
          const isActive = tab.id === activeTabId
          const href     = venueId ? `/${venueId}${tab.href}` : tab.href

          return (
            <Link
              key={tab.id}
              href={href}
              style={{
                position:     'relative',
                display:      'flex',
                alignItems:   'center',
                padding:      '0 14px',
                borderBottom: isActive ? `2px solid ${t.verdeCancha.val}` : '2px solid transparent',
                marginBottom: -1,
                color:        isActive ? t.verdeCanchaProfundo.val : t.textoMuted.val,
                fontSize:     13,
                fontWeight:   isActive ? 500 : 400,
                lineHeight:   1,
                userSelect:   'none',
                textDecoration: 'none',
                transition:   'color 120ms ease-out, border-color 120ms ease-out',
              }}
              onMouseEnter={(e) => {
                if (isActive) return
                e.currentTarget.style.color = t.textoPrimario.val
              }}
              onMouseLeave={(e) => {
                if (isActive) return
                e.currentTarget.style.color = t.textoMuted.val
              }}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </>
  )

  return (
    <ModuleLayout strip={strip}>
      {children}
    </ModuleLayout>
  )
}
