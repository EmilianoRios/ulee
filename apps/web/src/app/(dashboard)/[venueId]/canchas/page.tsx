'use client'

import { useState } from 'react'
import { Plus, LayoutGrid, CheckCircle2, CalendarDays, TrendingUp } from 'lucide-react'
import { useTheme } from 'tamagui'
import { useQuery, useMutation, useConvexAuth } from 'convex/react'
import { api, FREE_LIMITS } from '@canchero/backend'
import { CourtsTable, type Court } from '@/components/organisms/courts-list'
import { CourtSlideOver } from '@/components/organisms/court-slide-over'
import { ModuleLayout } from '@/components/templates/module-layout'
import { useActiveVenue } from '@/context/active-venue'
import { usePlan } from '@/hooks/usePlan'
import { PlanLimitButton } from '@/components/molecules/plan-limit-button/PlanLimitButton'
import type { Id } from '@canchero/backend'

// ─── Stats derivation ─────────────────────────────────────────────────────────

const GREEN_ACCENT = 'oklch(56% 0.15 155)'
const GREEN_SOFT    = 'oklch(56% 0.07 155)'

function deriveStats(courts: Court[]) {
  const active   = courts.filter((c) => c.status === 'active').length
  const turnos   = courts.reduce((s, c) => s + c.todayTurnos, 0)
  const ingresos = courts.reduce((s, c) => s + c.todayRevenue, 0)
  return [
    { icon: LayoutGrid,    label: 'Canchas totales', value: String(courts.length), ruleColor: GREEN_ACCENT, color: undefined as string | undefined },
    { icon: CheckCircle2,  label: 'Activas hoy',      value: String(active),        ruleColor: active === courts.length ? GREEN_ACCENT : GREEN_SOFT, color: undefined as string | undefined },
    { icon: CalendarDays,  label: 'Turnos hoy',       value: String(turnos),        ruleColor: GREEN_ACCENT, color: undefined as string | undefined },
    { icon: TrendingUp,    label: 'Ingresos hoy',     value: `$${ingresos.toLocaleString('es-AR')}`, ruleColor: GREEN_ACCENT, color: GREEN_ACCENT },
  ]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CanchasPage() {
  const t = useTheme()
  const { activeVenueId } = useActiveVenue()
  const { isAuthenticated } = useConvexAuth()

  const [editing,  setEditing]  = useState<Court | null>(null)
  const [creating, setCreating] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)

  // ─── Convex data ────────────────────────────────────────────────────────────

  const plan = usePlan()
  const rawCourts  = useQuery(
    api.functions.courts.queries.listByVenue,
    isAuthenticated && activeVenueId ? { venueId: activeVenueId } : 'skip',
  )
  const atCourtLimit = plan === 'free' && (rawCourts?.length ?? 0) >= FREE_LIMITS.courts
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
    setPageError(null)

    try {
      if (editing) {
        await updateCourt({
          courtId:                editing.id as Id<'courts'>,
          name:                   data.name,
          sport:                  data.sport,
          surface:                data.surface,
          covered:                data.covered,
          status:                 data.status,
          priceOverride:          data.pricePerHour,
          nightRatePriceOverride: data.nightRatePrice,
        })
      } else {
        await createCourt({
          venueId:                activeVenueId,
          name:                   data.name,
          sport:                  data.sport,
          surface:                data.surface,
          covered:                data.covered,
          priceOverride:          data.pricePerHour,
          nightRatePriceOverride: data.nightRatePrice,
        })
      }
    } catch (err: unknown) {
      const convexMessage = (err as { data?: string })?.data
      if (convexMessage === 'plan_limit_courts') {
        setPageError('Alcanzaste el límite de canchas en el plan gratuito.')
      }
    }
  }

  function handleClose() { setEditing(null); setCreating(false); setPageError(null) }
  function openCreate()  { setEditing(null); setCreating(true); setPageError(null) }

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

        <PlanLimitButton
          atLimit={atCourtLimit}
          limitLabel={`Límite del plan gratuito: ${FREE_LIMITS.courts} canchas. Actualizá tu plan para agregar más.`}
          onClick={openCreate}
          buttonStyle={{
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
        </PlanLimitButton>
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
          padding:       '14px 32px',
          boxSizing:     'border-box',
          display:       'flex',
          flexDirection: 'column',
          gap:           14,
        }}>
          {/* KPI strip */}
          <div style={{
            flexShrink:      0,
            borderRadius:    7,
            border:          `1px solid ${t.bordeNeutral.val}`,
            overflow:        'hidden',
            backgroundColor: 'oklch(28% 0.035 228)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch', padding: '26px 44px', gap: 0 }}>
              {STATS.map((kpi, i) => {
                const Icon = kpi.icon
                return (
                  <div key={kpi.label} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    {i > 0 && <div style={{ alignSelf: 'stretch', borderLeft: '1px dashed oklch(97% 0.006 220 / 18%)', margin: '0 35px', flexShrink: 0 }} />}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, userSelect: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon size={17} strokeWidth={2} style={{ color: 'oklch(56% 0.15 155)', flexShrink: 0 }} />
                        <span style={{ fontSize: 12.5, fontWeight: 500, color: 'oklch(75% 0.02 228)', lineHeight: 1, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                          {kpi.label}
                        </span>
                      </div>
                      <span style={{
                        fontSize:           29,
                        fontWeight:         700,
                        color:              kpi.color ?? 'oklch(97% 0.006 220)',
                        lineHeight:         1,
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing:      '-0.015em',
                      }}>
                        {kpi.value}
                      </span>
                      <div style={{ width: 29, height: 3, borderRadius: 2, backgroundColor: kpi.ruleColor }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <CourtsTable
            courts={courts}
            onEdit={setEditing}
            onCreate={openCreate}
          />
        </div>
      </ModuleLayout>

      {pageError && (
        <div style={{
          position:        'fixed',
          bottom:          24,
          left:            '50%',
          transform:       'translateX(-50%)',
          backgroundColor: 'oklch(20% 0.02 25)',
          color:           'oklch(90% 0.10 25)',
          padding:         '10px 20px',
          borderRadius:    8,
          fontSize:        13,
          fontWeight:      500,
          zIndex:          500,
          boxShadow:       '0 4px 16px oklch(0% 0 0 / 0.2)',
          border:          '1px solid oklch(35% 0.12 25)',
          whiteSpace:      'nowrap',
        }}>
          {pageError}
        </div>
      )}

      <CourtSlideOver
        court={slideOver}
        isOpen={isOpen}
        onClose={handleClose}
        onSave={handleSave}
      />
    </>
  )
}
