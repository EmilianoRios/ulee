'use client'

import { useCallback, useState } from 'react'
import { Check } from 'lucide-react'
import { useTheme } from 'tamagui'
import { useQuery, useMutation, useConvexAuth } from 'convex/react'
import { api, minutesToTime, timeToMinutes } from '@canchero/backend'
import type { Doc } from '@canchero/backend'
import { ModuleLayout } from '@/components/templates/module-layout'
import { ConfigGeneral  } from '@/components/organisms/config-general'
import { ConfigHorarios } from '@/components/organisms/config-horarios'
import { ConfigPrecios  } from '@/components/organisms/config-precios'
import { ConfigFeriados } from '@/components/organisms/config-feriados'
import { EmployeeInvitePanelOrganism } from '@/components/organisms/onboarding/EmployeeInvitePanelOrganism'
import { PendingInvitationsOrganism } from '@/components/organisms/onboarding/PendingInvitationsOrganism'
import type { GeneralInitialData  } from '@/components/organisms/config-general'
import type { ScheduleEntry       } from '@/components/organisms/config-horarios'
import type { PricingInitialData  } from '@/components/organisms/config-precios'
import type { HolidayEntry        } from '@/components/organisms/config-feriados'
import { useActiveVenue } from '@/context/active-venue'

type Tab = 'general' | 'horarios' | 'precios' | 'feriados' | 'equipo'

const TABS: { id: Tab; label: string }[] = [
  { id: 'general',  label: 'Información general' },
  { id: 'horarios', label: 'Horarios'             },
  { id: 'precios',  label: 'Precios y pagos'      },
  { id: 'feriados', label: 'Feriados'             },
  { id: 'equipo',   label: 'Equipo'               },
]

// ─── Adapter functions (pure, module-scope) ────────────────────────────────────

function venueToGeneralData(venue: Doc<'venues'>): GeneralInitialData {
  return {
    name:        venue.name,
    description: venue.description,
    address:     venue.address,
    phone:       venue.phone,
    email:       venue.email,
  }
}

function venueToScheduleData(venue: Doc<'venues'>): ScheduleEntry[] {
  return venue.schedule.map(entry => ({
    dayOfWeek: entry.dayOfWeek,
    active:    entry.active,
    openTime:  minutesToTime(entry.openTime),
    closeTime: minutesToTime(entry.closeTime),
  }))
}

function venueToPricingData(venue: Doc<'venues'>): PricingInitialData {
  const pc = venue.pricingConfig
  return {
    pricePerHour:        pc.pricePerHour,
    currency:            pc.currency,
    depositPercentage:   pc.depositPercentage,
    nightRatePrice:      pc.nightRatePrice,
    nightRateStart:      pc.nightRateStart !== undefined ? minutesToTime(pc.nightRateStart) : undefined,
    chargePolicy:        pc.chargePolicy,
    bookingWindowDays:   pc.bookingWindowDays,
    balanceDeadlineDays: pc.balanceDeadlineDays,
    allowedDurations:    pc.allowedDurations,
  }
}

function venueToHolidaysData(venue: Doc<'venues'>): HolidayEntry[] {
  return (venue.holidays ?? []).map(h => ({
    date:   h.date,
    reason: h.reason,
  }))
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfiguracionPage() {
  const t = useTheme()
  const { activeVenueId } = useActiveVenue()
  const { isAuthenticated } = useConvexAuth()

  // ─── Convex ──────────────────────────────────────────────────────────────
  const venue = useQuery(
    api.functions.venues.queries.getById,
    isAuthenticated && activeVenueId ? { venueId: activeVenueId } : 'skip',
  )
  const updateVenue     = useMutation(api.functions.venues.mutations.update)
  const updateSchedule  = useMutation(api.functions.venues.mutations.updateSchedule)
  const updatePricing   = useMutation(api.functions.venues.mutations.updatePricing)
  const updateHolidays  = useMutation(api.functions.venues.mutations.updateHolidays)

  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [dirtyTabs, setDirtyTabs] = useState<Set<Tab>>(new Set())
  const [savedTab,  setSavedTab]  = useState<Tab | null>(null)

  const isDirty   = dirtyTabs.has(activeTab)
  const justSaved = savedTab === activeTab

  // ─── Stable dirty callbacks per tab ───────────────────────────────────────

  const onGeneralDirty  = useCallback((d: boolean) => setDirtyTabs(p => { const n = new Set(p); if (d) n.add('general');  else n.delete('general');  return n }), [])
  const onHorariosDirty = useCallback((d: boolean) => setDirtyTabs(p => { const n = new Set(p); if (d) n.add('horarios'); else n.delete('horarios'); return n }), [])
  const onPreciosDirty  = useCallback((d: boolean) => setDirtyTabs(p => { const n = new Set(p); if (d) n.add('precios');  else n.delete('precios');  return n }), [])
  const onFeriadosDirty = useCallback((d: boolean) => setDirtyTabs(p => { const n = new Set(p); if (d) n.add('feriados'); else n.delete('feriados'); return n }), [])

  // ─── Stable saved callbacks per tab ───────────────────────────────────────

  const markSaved = useCallback((tab: Tab) => {
    setDirtyTabs(p => { const n = new Set(p); n.delete(tab); return n })
    setSavedTab(tab)
    setTimeout(() => setSavedTab(prev => prev === tab ? null : prev), 2000)
  }, [])

  const onGeneralSaved  = useCallback(() => markSaved('general'),  [markSaved])
  const onHorariosSaved = useCallback(() => markSaved('horarios'), [markSaved])
  const onPreciosSaved  = useCallback(() => markSaved('precios'),  [markSaved])
  const onFeriadosSaved = useCallback(() => markSaved('feriados'), [markSaved])

  // ─── Submit handlers ──────────────────────────────────────────────────────

  const handleGeneralSubmit = useCallback(async (data: GeneralInitialData) => {
    if (!activeVenueId) return
    await updateVenue({
      venueId:     activeVenueId,
      name:        data.name,
      description: data.description,
      address:     data.address,
      phone:       data.phone,
      email:       data.email,
    })
  }, [activeVenueId, updateVenue])

  const handleScheduleSubmit = useCallback(async (schedule: ScheduleEntry[]) => {
    if (!activeVenueId) return
    await updateSchedule({
      venueId: activeVenueId,
      schedule: schedule.map(entry => ({
        dayOfWeek: entry.dayOfWeek,
        active:    entry.active,
        openTime:  timeToMinutes(entry.openTime),
        closeTime: timeToMinutes(entry.closeTime),
      })),
    })
  }, [activeVenueId, updateSchedule])

  const handlePricingSubmit = useCallback(async (data: PricingInitialData) => {
    if (!activeVenueId) return
    await updatePricing({
      venueId: activeVenueId,
      pricingConfig: {
        ...data,
        nightRateStart: data.nightRateStart !== undefined ? timeToMinutes(data.nightRateStart) : undefined,
      },
    })
  }, [activeVenueId, updatePricing])

  const handleHolidaysSubmit = useCallback(async (holidays: HolidayEntry[]) => {
    if (!activeVenueId) return
    await updateHolidays({ venueId: activeVenueId, holidays })
  }, [activeVenueId, updateHolidays])

  const FORM_ID = `config-form-${activeTab}`

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
          Configuración
        </span>

        <button
          form={FORM_ID}
          type="submit"
          disabled={!isDirty}
          style={{
            display:         'flex',
            alignItems:      'center',
            gap:             6,
            padding:         '6px 14px',
            borderRadius:    7,
            border:          'none',
            backgroundColor: justSaved
              ? 'oklch(45% 0.14 155)'
              : isDirty ? t.verdeCancha.val : 'oklch(36% 0.008 228)',
            color:           isDirty || justSaved
              ? 'oklch(98% 0.004 155)'
              : 'oklch(55% 0.010 228)',
            fontSize:        12,
            fontWeight:      500,
            cursor:          isDirty ? 'pointer' : 'default',
            lineHeight:      1,
            fontFamily:      'inherit',
            transition:      'background-color 200ms ease-out, color 200ms ease-out',
          }}
          onMouseEnter={(e) => {
            if (!isDirty) return
            e.currentTarget.style.backgroundColor = t.verdeCanchaProfundo.val
          }}
          onMouseLeave={(e) => {
            if (!isDirty) return
            e.currentTarget.style.backgroundColor = isDirty ? t.verdeCancha.val : 'oklch(36% 0.008 228)'
          }}
        >
          {justSaved && <Check size={12} strokeWidth={2.5} />}
          {justSaved ? 'Guardado' : 'Guardar cambios'}
        </button>
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
        {TABS.map(tab => {
          const isActive   = tab.id === activeTab
          const hasUnsaved = dirtyTabs.has(tab.id) && tab.id !== activeTab

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                position:     'relative',
                display:      'flex',
                alignItems:   'center',
                gap:          6,
                padding:      '0 14px',
                border:       'none',
                borderBottom: isActive ? `2px solid ${t.verdeCancha.val}` : '2px solid transparent',
                marginBottom: -1,
                backgroundColor: 'transparent',
                color:        isActive ? t.verdeCanchaProfundo.val : t.textoMuted.val,
                fontSize:     13,
                fontWeight:   isActive ? 500 : 400,
                cursor:       'pointer',
                fontFamily:   'inherit',
                lineHeight:   1,
                userSelect:   'none',
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
              {hasUnsaved && (
                <span style={{
                  width:           5,
                  height:          5,
                  borderRadius:    '50%',
                  backgroundColor: t.acentoTerraza.val,
                  flexShrink:      0,
                }} />
              )}
            </button>
          )
        })}
      </div>
    </>
  )

  return (
    <>
      <ModuleLayout strip={strip}>
        <div style={{
          height:    '100%',
          overflowY: 'auto',
          padding:   '32px',
          boxSizing: 'border-box',
        }}>
          <div style={{ maxWidth: 640, width: '100%' }}>
            {activeTab === 'general'  && (
              <ConfigGeneral
                formId={FORM_ID}
                onDirtyChange={onGeneralDirty}
                onSaved={onGeneralSaved}
                initialData={venue ? venueToGeneralData(venue) : null}
                onSubmit={handleGeneralSubmit}
              />
            )}
            {activeTab === 'horarios' && (
              <ConfigHorarios
                formId={FORM_ID}
                onDirtyChange={onHorariosDirty}
                onSaved={onHorariosSaved}
                initialData={venue ? venueToScheduleData(venue) : null}
                onSubmit={handleScheduleSubmit}
              />
            )}
            {activeTab === 'precios'  && (
              <ConfigPrecios
                formId={FORM_ID}
                onDirtyChange={onPreciosDirty}
                onSaved={onPreciosSaved}
                initialData={venue ? venueToPricingData(venue) : null}
                onSubmit={handlePricingSubmit}
              />
            )}
            {activeTab === 'feriados' && (
              <ConfigFeriados
                formId={FORM_ID}
                venueId={activeVenueId ?? null}
                onDirtyChange={onFeriadosDirty}
                onSaved={onFeriadosSaved}
                initialData={venue ? venueToHolidaysData(venue) : null}
                onSubmit={handleHolidaysSubmit}
              />
            )}
            {activeTab === 'equipo' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                <EmployeeInvitePanelOrganism />
                <div style={{ height: 1, backgroundColor: t.divisor.val }} />
                <PendingInvitationsOrganism />
              </div>
            )}
          </div>
        </div>
      </ModuleLayout>

      {/* Sticky save footer — animates in when the active tab has unsaved changes */}
      <div
        style={{
          position:      'fixed',
          bottom:        0,
          left:          0,
          right:         0,
          zIndex:        50,
          opacity:       isDirty ? 1 : 0,
          transform:     isDirty ? 'translateY(0)' : 'translateY(100%)',
          transition:    'opacity 200ms ease-out, transform 200ms ease-out',
          pointerEvents: isDirty ? 'auto' : 'none',
          display:       'flex',
          alignItems:    'center',
          justifyContent: 'flex-end',
          padding:       '12px 32px',
          backgroundColor: t.cabeceraOscura.val,
          borderTop:     `1px solid oklch(30% 0.008 228)`,
        }}
      >
        <button
          form={FORM_ID}
          type="submit"
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
            transition:      'background-color 200ms ease-out',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = t.verdeCanchaProfundo.val }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = t.verdeCancha.val }}
        >
          Guardar cambios
        </button>
      </div>
    </>
  )
}
