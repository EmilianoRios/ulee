'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTheme } from 'tamagui'
import { useQuery, useMutation, useConvexAuth } from 'convex/react'
import { api } from '@canchero/backend'
import { CourtsTable, type Court } from '@/components/organisms/courts-list'
import { CourtSlideOver } from '@/components/organisms/court-slide-over'
import { ModuleLayout } from '@/components/templates/module-layout'
import { useActiveVenue } from '@/context/active-venue'
import type { Id } from '@canchero/backend'

// ─── Stats derivation ─────────────────────────────────────────────────────────

function deriveStats(courts: Court[]) {
  const active   = courts.filter((c) => c.status === 'active').length
  const turnos   = courts.reduce((s, c) => s + c.todayTurnos, 0)
  const ingresos = courts.reduce((s, c) => s + c.todayRevenue, 0)
  return [
    { value: String(courts.length),                        label: 'canchas totales' },
    { value: String(active),                               label: 'activas hoy'     },
    { value: String(turnos),                               label: 'turnos hoy'      },
    { value: `$${ingresos.toLocaleString('es-AR')}`,       label: 'ingresos hoy'   },
  ]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CanchasPage() {
  const t = useTheme()
  const { activeVenueId } = useActiveVenue()
  const { isAuthenticated } = useConvexAuth()

  const [editing,  setEditing]  = useState<Court | null>(null)
  const [creating, setCreating] = useState(false)

  // ─── Convex data ────────────────────────────────────────────────────────────

  const rawCourts  = useQuery(
    api.functions.courts.queries.listByVenue,
    isAuthenticated && activeVenueId ? { venueId: activeVenueId } : 'skip',
  )
  const createCourt = useMutation(api.functions.courts.mutations.create)
  const updateCourt = useMutation(api.functions.courts.mutations.update)

  // Adapt Convex shape (_id) to the Court interface (id) expected by UI components
  const courts: Court[] = (rawCourts ?? []).map((c) => ({
    ...c,
    id:      c._id,
    surface: c.surface ?? '',
    covered: c.covered ?? false,
  }))

  // ─── Derived state ──────────────────────────────────────────────────────────

  const isOpen    = editing !== null || creating
  const slideOver = editing ?? null
  const STATS     = deriveStats(courts)

  // ─── Handlers ───────────────────────────────────────────────────────────────

  async function handleSave(data: Omit<Court, 'id' | 'todayTurnos' | 'todayRevenue'>) {
    if (!activeVenueId) return

    if (editing) {
      await updateCourt({
        courtId:       editing.id as Id<'courts'>,
        name:          data.name,
        sport:         data.sport,
        surface:       data.surface,
        covered:       data.covered,
        status:        data.status,
        priceOverride: data.pricePerHour,
      })
    } else {
      await createCourt({
        venueId:       activeVenueId,
        name:          data.name,
        sport:         data.sport,
        surface:       data.surface,
        covered:       data.covered,
        priceOverride: data.pricePerHour,
      })
    }
  }

  function handleClose() { setEditing(null); setCreating(false) }
  function openCreate()  { setEditing(null); setCreating(true)  }

  // ─── Strip ────────────────────────────────────────────────────────────────

  const strip = (
    <>
      {/* Dark header */}
      <div style={{
        height:          56,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
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
          Canchas
        </span>

        <button
          onClick={openCreate}
          style={{
            display:         'flex',
            alignItems:      'center',
            gap:             6,
            padding:         '6px 14px',
            borderRadius:    7,
            border:          'none',
            backgroundColor: t.verdeCancha.val,
            color:           'oklch(98% 0.004 155)',
            fontSize:        12,
            fontWeight:      500,
            cursor:          'pointer',
            lineHeight:      1,
            fontFamily:      'inherit',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.verdeCanchaProfundo.val }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.verdeCancha.val }}
        >
          <Plus size={13} strokeWidth={2.5} />
          Nueva cancha
        </button>
      </div>

      {/* Stats strip */}
      <div className="strip-scroll" style={{
        height:       52,
        display:      'flex',
        alignItems:   'center',
        padding:      '0 32px',
        borderBottom: `1px solid ${t.divisor.val}`,
        overflowX:    'auto',
      }}>
        {STATS.map((stat, i) => (
          <div key={stat.label} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {i > 0 && (
              <div style={{ width: 1, height: 32, backgroundColor: t.divisor.val, margin: '0 28px', flexShrink: 0 }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, userSelect: 'none' }}>
              <span style={{
                fontSize:           20,
                fontWeight:         700,
                color:              t.textoPrimario.val,
                lineHeight:         1,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing:      '-0.01em',
              }}>
                {stat.value}
              </span>
              <span style={{ fontSize: 11, color: t.textoMuted.val, lineHeight: 1 }}>
                {stat.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  )

  // ─── Loading state ────────────────────────────────────────────────────────

  if (!activeVenueId) {
    return (
      <ModuleLayout strip={strip}>
        <div style={{
          height:         '100%',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: 13, color: t.textoMuted.val }}>
            Seleccioná una sede para ver las canchas.
          </span>
        </div>
      </ModuleLayout>
    )
  }

  return (
    <>
      <ModuleLayout strip={strip}>
        <div style={{
          height:        '100%',
          padding:       '12px 32px',
          boxSizing:     'border-box',
          display:       'flex',
          flexDirection: 'column',
        }}>
          <CourtsTable
            courts={courts}
            onEdit={setEditing}
            onCreate={openCreate}
          />
        </div>
      </ModuleLayout>

      <CourtSlideOver
        court={slideOver}
        isOpen={isOpen}
        onClose={handleClose}
        onSave={handleSave}
      />
    </>
  )
}
