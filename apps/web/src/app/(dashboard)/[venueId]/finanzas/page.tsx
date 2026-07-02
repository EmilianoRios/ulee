'use client'

import { useState, useRef, useCallback } from 'react'
import { Lock, Download, ChevronLeft, ChevronRight, CreditCard, Banknote, Wallet, Clock, TrendingUp } from 'lucide-react'
import { useTheme } from 'tamagui'
import { useQuery, useConvexAuth } from 'convex/react'
import { api } from '@canchero/backend'
import { UnifiedReservationTable, type UnifiedRow } from '@/components/organisms/unified-reservation-table'
import { ModuleLayout } from '@/components/templates/module-layout'
import { Select } from '@/components/atoms/select/Select'
import { useActiveVenue } from '@/context/active-venue'
import { applyEffectiveStatus } from '@/lib/convex/status-map'
import type { Id } from '@canchero/backend'

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = 'dia' | 'semana' | 'mes'

type StatusTab = 'todas' | 'pendientes' | 'señadas' | 'jugadas' | 'pagadas'

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS: { id: Period; label: string }[] = [
  { id: 'dia',    label: 'Día'    },
  { id: 'semana', label: 'Semana' },
  { id: 'mes',    label: 'Mes'    },
]

const TAB_FILTER: Record<StatusTab, FinanceRowShape['status'][]> = {
  todas:      [],
  pendientes: ['pending'],
  señadas:    ['deposit_paid'],
  jugadas:    ['played'],
  pagadas:    ['paid'],
}

const TAB_LABELS: Record<StatusTab, string> = {
  todas:      'Todas',
  pendientes: 'Pendientes',
  señadas:    'Señadas',
  jugadas:    'Jugadas',
  pagadas:    'Pagadas',
}

const STATUS_TABS: StatusTab[] = ['todas', 'pendientes', 'señadas', 'jugadas', 'pagadas']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return '$' + n.toLocaleString('es-AR')
}

function computePeriodRange(period: Period, offset: number): { dateFrom: string; dateTo: string } {
  const now = new Date(Date.now() - 3 * 60 * 60 * 1000)

  if (period === 'dia') {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() + offset)
    const dateStr = d.toISOString().slice(0, 10)
    return { dateFrom: dateStr, dateTo: dateStr }
  }
  if (period === 'semana') {
    // Monday of current week
    const dow = now.getUTCDay() === 0 ? 6 : now.getUTCDay() - 1
    const mon = new Date(now)
    mon.setUTCDate(now.getUTCDate() - dow + offset * 7)
    const sun = new Date(mon)
    sun.setUTCDate(mon.getUTCDate() + 6)
    return { dateFrom: mon.toISOString().slice(0, 10), dateTo: sun.toISOString().slice(0, 10) }
  }
  // mes
  const year  = now.getUTCFullYear()
  const month = now.getUTCMonth() + offset  // may go negative or >11 — Date handles it
  const firstDay = new Date(Date.UTC(year, month, 1))
  const lastDay  = new Date(Date.UTC(year, month + 1, 0))
  return { dateFrom: firstDay.toISOString().slice(0, 10), dateTo: lastDay.toISOString().slice(0, 10) }
}

function computePeriodLabel(period: Period, offset: number): string {
  const now = new Date(Date.now() - 3 * 60 * 60 * 1000)

  if (period === 'mes') {
    const year  = now.getUTCFullYear()
    const month = now.getUTCMonth() + offset
    const d = new Date(Date.UTC(year, month, 1))
    const raw = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }
  if (period === 'semana') {
    const dow = now.getUTCDay() === 0 ? 6 : now.getUTCDay() - 1
    const mon = new Date(now)
    mon.setUTCDate(now.getUTCDate() - dow + offset * 7)
    const sun = new Date(mon)
    sun.setUTCDate(mon.getUTCDate() + 6)
    const dayFrom = mon.getUTCDate()
    const dayTo   = sun.getUTCDate()
    const monthAbbr = sun.toLocaleDateString('es-AR', { month: 'short', timeZone: 'UTC' }).replace('.', '')
    return `${dayFrom} – ${dayTo} ${monthAbbr}`
  }
  // dia
  const d = new Date(now)
  d.setUTCDate(d.getUTCDate() + offset)
  const weekday = d.toLocaleDateString('es-AR', { weekday: 'short', timeZone: 'UTC' }).replace('.', '')
  const day     = d.getUTCDate()
  const month   = d.toLocaleDateString('es-AR', { month: 'short', timeZone: 'UTC' }).replace('.', '')
  return `${weekday} ${day} ${month}`
}

type FinanceRowShape = {
  _id:          Id<'reservations'>
  clientName:   string
  courtName:    string
  date:         string
  startTime:    string
  endTime:      string
  online:       number
  cash:         number
  total:        number
  depositTotal: number
  paymentType:  'deposit' | 'balance' | 'full' | 'mixed' | 'none'
  status:       'paid' | 'deposit_paid' | 'pending' | 'played' | 'on_court' | 'absent' | 'recurring' | 'event' | 'maintenance'
  totalAmount:  number
}

function toUnifiedRow(row: FinanceRowShape, now: Date): UnifiedRow {
  const dayLabel = new Date(row.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', timeZone: 'UTC' })
  return {
    id:          row._id,
    cliente:     row.clientName,
    cancha:      row.courtName,
    diayhorario: `${dayLabel} ${row.startTime} – ${row.endTime}`,
    estado:      applyEffectiveStatus(row.status, row.date, row.startTime, row.endTime, now),
    total:       row.total,
  }
}

// ─── Dark header tokens ───────────────────────────────────────────────────────

const D = {
  text:      'oklch(97% 0.006 220)',
  textMuted: 'oklch(50% 0.012 228)',
  border:    'oklch(35% 0.018 228)',
  hover:     'oklch(30% 0.020 228)',
  toggleBg:  'oklch(16% 0.020 228)',
  toggleOn:  'oklch(32% 0.022 228)',
  toggleOff: 'oklch(40% 0.012 228)',
} as const

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinanzasPage() {
  const t = useTheme()
  const { activeVenueId } = useActiveVenue()
  const { isAuthenticated } = useConvexAuth()

  const [period,        setPeriod]        = useState<Period>('mes')
  const [offset,        setOffset]        = useState(0)
  const [cancha,        setCancha]        = useState('todas')
  const [activeTab,     setActiveTab]     = useState<StatusTab>('todas')
  const [showExportTip, setShowExportTip] = useState(false)
  const [tipPos,        setTipPos]        = useState({ top: 0, left: 0 })
  const exportRef = useRef<HTMLButtonElement>(null)

  const { dateFrom, dateTo } = computePeriodRange(period, offset)
  const periodLabel = computePeriodLabel(period, offset)

  const allRows = useQuery(
    api.functions.finances.queries.listByVenueAndPeriod,
    isAuthenticated && activeVenueId !== null
      ? { venueId: activeVenueId, dateFrom, dateTo }
      : 'skip'
  )

  const isLoading = activeVenueId !== null && allRows === undefined

  const now = new Date()

  // Client-side cancha filter
  const canchaFiltered = (allRows ?? []).filter(
    (r) => cancha === 'todas' || r.courtName === cancha
  )

  // Status tab filter — applies only to the table, not the KPIs
  const filtered = canchaFiltered.filter((r) => {
    if (activeTab === 'todas') return true
    if (activeTab === 'jugadas') {
      return applyEffectiveStatus(r.status, r.date, r.startTime, r.endTime, now) === 'played'
    }
    return TAB_FILTER[activeTab].includes(r.status)
  })

  // Unique cancha names derived from live data.
  // Always include the currently selected cancha so the select stays consistent
  // when navigating to a period where that court has no reservations.
  const canchaOptionsSet = new Set((allRows ?? []).map((r) => r.courtName).filter(Boolean))
  if (cancha !== 'todas') canchaOptionsSet.add(cancha)
  const canchaOptions = [...canchaOptionsSet].sort()

  // KPIs — derived client-side from cancha-filtered rows (unaffected by status tab)
  const totalOnline   = canchaFiltered.reduce((s, r) => s + r.online, 0)
  const totalCash     = canchaFiltered.reduce((s, r) => s + r.cash,   0)
  const totalSenias   = canchaFiltered.reduce((s, r) => s + r.depositTotal, 0)
  const totalGeneral  = canchaFiltered.reduce((s, r) => s + r.total,  0)
  const totalACobrar  = canchaFiltered
    .filter((r) => r.status === 'pending' || r.status === 'played' || r.status === 'deposit_paid' || r.status === 'on_court')
    .reduce((s, r) => s + (r.totalAmount - r.total), 0)

  const allMappedRows = filtered.map((r) => toUnifiedRow(r, now))

  const handlePeriod = useCallback((p: Period) => { setPeriod(p); setOffset(0); setCancha('todas') }, [])
  const handleCancha = useCallback((c: string)  => { setCancha(c) }, [])
  const handleTabChange = useCallback((tab: StatusTab) => { setActiveTab(tab) }, [])

  const handleExportClick = useCallback(() => {
    if (exportRef.current) {
      const r = exportRef.current.getBoundingClientRect()
      setTipPos({ top: r.bottom + 8, left: r.left + r.width / 2 })
    }
    setShowExportTip(true)
    setTimeout(() => setShowExportTip(false), 2000)
  }, [])

  const kpis = [
    { icon: CreditCard, label: 'Mercado Pago', value: fmt(totalOnline),   ruleColor: 'oklch(56% 0.15 155)',   color: undefined as string | undefined },
    { icon: Banknote,   label: 'Efectivo',      value: fmt(totalCash),    ruleColor: 'oklch(56% 0.15 155)',   color: undefined as string | undefined },
    { icon: Wallet,     label: 'Señas',         value: fmt(totalSenias),  ruleColor: 'oklch(56% 0.07 155)', color: undefined as string | undefined },
    { icon: Clock,      label: 'A cobrar',      value: fmt(totalACobrar), ruleColor: 'oklch(56% 0.07 155)', color: undefined as string | undefined },
    { icon: TrendingUp, label: 'Total',         value: fmt(totalGeneral), ruleColor: 'oklch(56% 0.15 155)', color: 'oklch(56% 0.15 155)' },
  ]

  const strip = (
    <>
      {/* Dark header */}
      <div className="strip-scroll" style={{
        height:          56,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
        padding:         '0 32px',
        backgroundColor: t.cabeceraOscura.val,
        overflowX:       'auto',
        gap:             12,
      }}>
        {/* Left: title + period nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize:      15,
            fontWeight:    600,
            color:         D.text,
            letterSpacing: '-0.01em',
            lineHeight:    1,
            userSelect:    'none',
            flexShrink:    0,
            marginRight:   4,
          }}>
            Finanzas
          </span>
          <button
            onClick={() => { setOffset(o => o - 1) }}
            aria-label="Período anterior"
            style={{
              width:           32,
              height:          32,
              borderRadius:    6,
              border:          `1px solid ${D.border}`,
              backgroundColor: 'transparent',
              cursor:          'pointer',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              color:           D.textMuted,
              flexShrink:      0,
            }}
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </button>

          <span style={{
            fontSize:      18,
            fontWeight:    600,
            color:         D.text,
            letterSpacing: '-0.01em',
            lineHeight:    1.2,
            userSelect:    'none',
            minWidth:      200,
            textAlign:     'center',
          }}>
            {periodLabel}
          </span>

          <button
            onClick={() => { setOffset(o => o + 1) }}
            aria-label="Período siguiente"
            style={{
              width:           32,
              height:          32,
              borderRadius:    6,
              border:          `1px solid ${D.border}`,
              backgroundColor: 'transparent',
              cursor:          'pointer',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              color:           D.textMuted,
              flexShrink:      0,
            }}
          >
            <ChevronRight size={16} strokeWidth={2} />
          </button>

          {offset !== 0 && (
            <button
              onClick={() => { setOffset(0) }}
              style={{
                padding:         '6px 14px',
                borderRadius:    6,
                border:          `1px solid ${D.border}`,
                backgroundColor: 'transparent',
                cursor:          'pointer',
                fontSize:        12,
                fontWeight:      500,
                color:           D.textMuted,
                fontFamily:      'inherit',
                lineHeight:      1,
              }}
            >
              Hoy
            </button>
          )}
        </div>

        {/* Right: period toggle + cancha select + export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

          {/* Period toggle */}
          <div style={{
            display:         'flex',
            backgroundColor: D.toggleBg,
            borderRadius:    8,
            padding:         3,
            gap:             2,
            border:          `1px solid ${D.border}`,
          }}>
            {PERIOD_OPTIONS.map(({ id, label }) => {
              const isActive = period === id
              return (
                <button
                  key={id}
                  onClick={() => handlePeriod(id)}
                  style={{
                    padding:         '5px 14px',
                    borderRadius:    6,
                    border:          'none',
                    cursor:          'pointer',
                    fontSize:        12,
                    fontWeight:      isActive ? 600 : 400,
                    backgroundColor: isActive ? D.toggleOn : 'transparent',
                    color:           isActive ? D.text : D.toggleOff,
                    transition:      'background-color 120ms ease-out',
                    userSelect:      'none',
                    lineHeight:      1,
                    fontFamily:      'inherit',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Cancha select */}
          <Select
            value={cancha}
            onChange={handleCancha}
            options={[
              { value: 'todas', label: 'Todas las canchas' },
              ...canchaOptions.map((c) => ({ value: c, label: c })),
            ]}
            borderColor={D.border}
            focusColor="oklch(56% 0.15 155)"
            chevronColor={D.textMuted}
            style={{
              width:           'auto',
              backgroundColor: 'transparent',
              borderRadius:    6,
              color:           D.text,
              fontSize:        12,
              fontWeight:      500,
              padding:         '5px 28px 5px 10px',
            }}
          />

          {/* Export button — premium locked */}
          <button
            ref={exportRef}
            onClick={handleExportClick}
            style={{
              display:         'flex',
              alignItems:      'center',
              gap:             6,
              padding:         '5px 12px',
              borderRadius:    6,
              border:          `1px solid ${D.border}`,
              backgroundColor: 'transparent',
              color:           D.textMuted,
              fontSize:        12,
              fontWeight:      500,
              cursor:          'not-allowed',
              lineHeight:      1,
              fontFamily:      'inherit',
              flexShrink:      0,
            }}
          >
            <Lock size={11} strokeWidth={2.5} />
            Exportar
            <Download size={11} strokeWidth={2} />
          </button>
        </div>
      </div>
    </>
  )

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
              {kpis.map((kpi, i) => {
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
                        fontSize:           kpi.label === 'Total' ? 31 : 29,
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

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {STATUS_TABS.map((tab) => {
              const isActive = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  style={{
                    padding:         '6px 16px',
                    borderRadius:    7,
                    border:          isActive
                      ? `1px solid ${t.verdeCancha.val}`
                      : `1px solid ${t.bordeNeutral.val}`,
                    backgroundColor: isActive ? t.verdeCanchaFondo.val : 'transparent',
                    color:           isActive ? t.verdeCanchaProfundo.val : t.textoMuted.val,
                    fontSize:        12,
                    fontWeight:      isActive ? 600 : 400,
                    cursor:          'pointer',
                    lineHeight:      1,
                    fontFamily:      'inherit',
                    transition:      'all 100ms ease-out',
                  }}
                >
                  {TAB_LABELS[tab]}
                </button>
              )
            })}
          </div>

          {isLoading ? (
            <div style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              height:         '100%',
              color:          t.textoMuted.val,
              fontSize:       14,
            }}>
              Cargando...
            </div>
          ) : (
            <UnifiedReservationTable
              rows={allMappedRows}
              totalColumnLabel="Cobrado"
              noun="movimiento"
              showStatusFilter={false}
            />
          )}
        </div>
      </ModuleLayout>

      {/* Premium tooltip */}
      {showExportTip && (
        <div
          role="tooltip"
          style={{
            position:        'fixed',
            top:             tipPos.top,
            left:            tipPos.left,
            transform:       'translateX(-50%)',
            zIndex:          9999,
            backgroundColor: 'oklch(22% 0.024 228)',
            color:           'oklch(82% 0.010 220)',
            fontSize:        12,
            fontWeight:      500,
            padding:         '6px 12px',
            borderRadius:    6,
            border:          '1px solid oklch(35% 0.018 228)',
            whiteSpace:      'nowrap',
            pointerEvents:   'none',
            fontFamily:      'inherit',
          }}
        >
          Disponible en plan Premium
        </div>
      )}
    </>
  )
}
