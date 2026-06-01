'use client'

import { useState, useRef, useCallback } from 'react'
import { Lock, Download, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTheme } from 'tamagui'
import { useQuery, useConvexAuth } from 'convex/react'
import { api } from '@canchero/backend'
import { UnifiedReservationTable, type UnifiedRow } from '@/components/organisms/unified-reservation-table'
import { ModuleLayout } from '@/components/templates/module-layout'
import { useActiveVenue } from '@/context/active-venue'
import type { Id } from '@canchero/backend'

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = 'dia' | 'semana' | 'mes'

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS: { id: Period; label: string }[] = [
  { id: 'dia',    label: 'Día'    },
  { id: 'semana', label: 'Semana' },
  { id: 'mes',    label: 'Mes'    },
]

const PAGE_SIZE = 8

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
  status:       'paid' | 'deposit_paid' | 'pending' | 'played' | 'maintenance' | 'cancelled'
  totalAmount:  number
}

function toUnifiedRow(row: FinanceRowShape): UnifiedRow {
  const dayLabel = new Date(row.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short' })
  return {
    id:          row._id,
    cliente:     row.clientName,
    cancha:      row.courtName,
    diayhorario: `${dayLabel} ${row.startTime} – ${row.endTime}`,
    estado:      row.status,
    online:      row.online,
    cash:        row.cash,
    paymentType: row.paymentType,
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
  const [page,          setPage]          = useState(1)
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

  // Client-side cancha filter
  const filtered = (allRows ?? []).filter(
    (r) => cancha === 'todas' || r.courtName === cancha
  )

  // Unique cancha names derived from live data.
  // Always include the currently selected cancha so the select stays consistent
  // when navigating to a period where that court has no reservations.
  const canchaOptionsSet = new Set((allRows ?? []).map((r) => r.courtName).filter(Boolean))
  if (cancha !== 'todas') canchaOptionsSet.add(cancha)
  const canchaOptions = [...canchaOptionsSet].sort()

  // KPIs — derived client-side from filtered rows
  const totalOnline   = filtered.reduce((s, r) => s + r.online, 0)
  const totalCash     = filtered.reduce((s, r) => s + r.cash,   0)
  const totalSenias   = filtered.reduce((s, r) => s + r.depositTotal, 0)
  const totalGeneral  = filtered.reduce((s, r) => s + r.total,  0)
  const totalACobrar  = filtered
    .filter((r) => r.status === 'pending' || r.status === 'played' || r.status === 'deposit_paid')
    .reduce((s, r) => s + (r.totalAmount - r.total), 0)

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(toUnifiedRow)

  const handlePeriod = useCallback((p: Period) => { setPeriod(p); setOffset(0); setPage(1); setCancha('todas') }, [])
  const handleCancha = useCallback((c: string)  => { setCancha(c);  setPage(1) }, [])

  const handleExportClick = useCallback(() => {
    if (exportRef.current) {
      const r = exportRef.current.getBoundingClientRect()
      setTipPos({ top: r.bottom + 8, left: r.left + r.width / 2 })
    }
    setShowExportTip(true)
    setTimeout(() => setShowExportTip(false), 2000)
  }, [])

  const KPIS = [
    { value: fmt(totalOnline),   label: 'Mercado Pago' },
    { value: fmt(totalCash),     label: 'Efectivo'     },
    { value: fmt(totalSenias),   label: 'Señas'        },
    { value: fmt(totalACobrar),  label: 'A Cobrar'     },
    { value: fmt(totalGeneral),  label: 'Total', bold: true },
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
            onClick={() => { setOffset(o => o - 1); setPage(1) }}
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
            onClick={() => { setOffset(o => o + 1); setPage(1) }}
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
              onClick={() => { setOffset(0); setPage(1) }}
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
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <select
              value={cancha}
              onChange={(e) => handleCancha(e.target.value)}
              style={{
                appearance:       'none',
                WebkitAppearance: 'none',
                backgroundColor:  'transparent',
                border:           `1px solid ${D.border}`,
                borderRadius:     6,
                color:            D.text,
                fontSize:         12,
                fontWeight:       500,
                padding:          '5px 28px 5px 10px',
                cursor:           'pointer',
                outline:          'none',
                fontFamily:       'inherit',
                lineHeight:       1,
              }}
            >
              <option style={{ background: 'oklch(22% 0.024 228)' }} value="todas">Todas las canchas</option>
              {canchaOptions.map((c) => (
                <option key={c} style={{ background: 'oklch(22% 0.024 228)' }} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown
              size={12}
              strokeWidth={2.5}
              style={{
                position:      'absolute',
                right:         8,
                top:           '50%',
                transform:     'translateY(-50%)',
                color:         D.textMuted,
                pointerEvents: 'none',
              }}
            />
          </div>

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

      {/* KPI strip */}
      <div className="strip-scroll" style={{
        height:       52,
        display:      'flex',
        alignItems:   'center',
        padding:      '0 32px',
        borderBottom: `1px solid ${t.divisor.val}`,
        overflowX:    'auto',
      }}>
        {KPIS.map((kpi, i) => (
          <div key={kpi.label} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {i > 0 && (
              <div style={{ width: 1, height: 32, backgroundColor: t.divisor.val, margin: '0 28px', flexShrink: 0 }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, userSelect: 'none' }}>
              <span style={{
                fontSize:           20,
                fontWeight:         kpi.bold ? 700 : 600,
                color:              kpi.bold ? t.verdeCanchaProfundo.val : t.textoPrimario.val,
                lineHeight:         1,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing:      '-0.01em',
              }}>
                {kpi.value}
              </span>
              <span style={{ fontSize: 11, color: t.textoMuted.val, lineHeight: 1 }}>
                {kpi.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  )

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
              rows={pageRows}
              page={page}
              totalPages={totalPages}
              totalRows={filtered.length}
              onPageChange={setPage}
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
