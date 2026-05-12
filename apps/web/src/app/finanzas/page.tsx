'use client'

import { useState, useRef, useCallback } from 'react'
import { Lock, Download, ChevronDown } from 'lucide-react'
import { useTheme } from 'tamagui'
import { FinancesTable, type Transaction } from '@/components/organisms/finances-table'
import { ModuleLayout } from '@/components/templates/module-layout'

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = 'dia' | 'semana' | 'mes'

// ─── Mock data ────────────────────────────────────────────────────────────────
// Mock "now": domingo 11/05/2026. Week = lun 06 → dom 11. Month = may 01 → 11.

type TransactionRaw = Transaction & { date: string }

const ALL: TransactionRaw[] = [
  // ── Hoy (dom 11/05) ───────────────────────────────────────────────
  { id: '01', cliente: 'Lucas Martínez',   cancha: 'Cancha 1',     diayhorario: 'Dom 08:00 – 09:00', fechaReserva: '11/05/2026', date: '2026-05-11', mercadoPago: 8500,  seña: 0,    total: 8500  },
  { id: '02', cliente: 'Sofía González',   cancha: 'La Principal', diayhorario: 'Dom 09:00 – 10:00', fechaReserva: '11/05/2026', date: '2026-05-11', mercadoPago: 0,     seña: 6000, total: 12000 },
  { id: '03', cliente: 'Martín Rodríguez', cancha: 'Pádel Norte',  diayhorario: 'Dom 10:00 – 11:00', fechaReserva: '11/05/2026', date: '2026-05-11', mercadoPago: 0,     seña: 0,    total: 9500  },
  { id: '04', cliente: 'Valentina López',  cancha: 'Cancha 1',     diayhorario: 'Dom 11:00 – 12:00', fechaReserva: '11/05/2026', date: '2026-05-11', mercadoPago: 8500,  seña: 0,    total: 8500  },
  { id: '05', cliente: 'Agustín Torres',   cancha: 'La Principal', diayhorario: 'Dom 14:00 – 15:00', fechaReserva: '11/05/2026', date: '2026-05-11', mercadoPago: 0,     seña: 5000, total: 12000 },

  // ── Esta semana sin hoy (sáb-mar 06-10/05) ────────────────────────
  { id: '06', cliente: 'Camila Fernández', cancha: 'Cancha 1',     diayhorario: 'Sáb 08:00 – 09:00', fechaReserva: '10/05/2026', date: '2026-05-10', mercadoPago: 8500,  seña: 0,    total: 8500  },
  { id: '07', cliente: 'Nicolás Pérez',    cancha: 'Pádel Sur',    diayhorario: 'Sáb 09:00 – 10:00', fechaReserva: '10/05/2026', date: '2026-05-10', mercadoPago: 0,     seña: 0,    total: 9500  },
  { id: '08', cliente: 'Luciana García',   cancha: 'La Principal', diayhorario: 'Vie 17:00 – 18:00', fechaReserva: '09/05/2026', date: '2026-05-09', mercadoPago: 12000, seña: 0,    total: 12000 },
  { id: '09', cliente: 'Santiago Ruiz',    cancha: 'Pádel Norte',  diayhorario: 'Vie 18:00 – 19:00', fechaReserva: '09/05/2026', date: '2026-05-09', mercadoPago: 0,     seña: 4500, total: 9000  },
  { id: '10', cliente: 'Pilar Herrera',    cancha: 'Cancha 1',     diayhorario: 'Jue 19:00 – 20:00', fechaReserva: '08/05/2026', date: '2026-05-08', mercadoPago: 10000, seña: 0,    total: 10000 },
  { id: '11', cliente: 'Mateo Álvarez',    cancha: 'Pádel Sur',    diayhorario: 'Jue 20:00 – 21:00', fechaReserva: '08/05/2026', date: '2026-05-08', mercadoPago: 0,     seña: 5000, total: 10000 },
  { id: '12', cliente: 'Florencia Sosa',   cancha: 'La Principal', diayhorario: 'Mié 10:00 – 11:00', fechaReserva: '07/05/2026', date: '2026-05-07', mercadoPago: 9500,  seña: 0,    total: 9500  },
  { id: '13', cliente: 'Tomás Ramírez',    cancha: 'Pádel Norte',  diayhorario: 'Mié 15:00 – 16:00', fechaReserva: '07/05/2026', date: '2026-05-07', mercadoPago: 0,     seña: 0,    total: 9000  },
  { id: '14', cliente: 'Emilia Vega',      cancha: 'Cancha 1',     diayhorario: 'Mar 08:00 – 09:00', fechaReserva: '06/05/2026', date: '2026-05-06', mercadoPago: 8500,  seña: 0,    total: 8500  },

  // ── Este mes sin esta semana (01-05/05) ───────────────────────────
  { id: '15', cliente: 'Diego Morales',    cancha: 'La Principal', diayhorario: 'Dom 09:00 – 10:00', fechaReserva: '05/05/2026', date: '2026-05-05', mercadoPago: 12000, seña: 0,    total: 12000 },
  { id: '16', cliente: 'Ana Torres',       cancha: 'Pádel Sur',    diayhorario: 'Sáb 10:00 – 11:00', fechaReserva: '04/05/2026', date: '2026-05-04', mercadoPago: 0,     seña: 4500, total: 9000  },
  { id: '17', cliente: 'Pablo Castro',     cancha: 'Cancha 1',     diayhorario: 'Vie 16:00 – 17:00', fechaReserva: '03/05/2026', date: '2026-05-03', mercadoPago: 8500,  seña: 0,    total: 8500  },
  { id: '18', cliente: 'Fernanda Ríos',    cancha: 'Pádel Norte',  diayhorario: 'Jue 18:00 – 19:00', fechaReserva: '02/05/2026', date: '2026-05-02', mercadoPago: 9000,  seña: 0,    total: 9000  },
  { id: '19', cliente: 'Rodrigo Suárez',   cancha: 'La Principal', diayhorario: 'Mié 20:00 – 21:00', fechaReserva: '01/05/2026', date: '2026-05-01', mercadoPago: 0,     seña: 5000, total: 12000 },
  { id: '20', cliente: 'Claudia Ferreyra', cancha: 'Cancha 1',     diayhorario: 'Mié 08:00 – 09:00', fechaReserva: '01/05/2026', date: '2026-05-01', mercadoPago: 0,     seña: 0,    total: 8500  },
]

const ALL_RAW = ALL

const CANCHAS = ['Cancha 1', 'La Principal', 'Pádel Norte', 'Pádel Sur'] as const

const PERIOD_OPTIONS: { id: Period; label: string }[] = [
  { id: 'dia',    label: 'Día'    },
  { id: 'semana', label: 'Semana' },
  { id: 'mes',    label: 'Mes'    },
]

const PERIOD_CUTOFF: Record<Period, string> = {
  dia:    '2026-05-11',
  semana: '2026-05-06',
  mes:    '2026-05-01',
}

const PAGE_SIZE = 8

function fmt(n: number): string {
  return '$' + n.toLocaleString('es-AR')
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

  const [period,           setPeriod]           = useState<Period>('semana')
  const [cancha,           setCancha]           = useState('todas')
  const [page,             setPage]             = useState(1)
  const [showExportTip,    setShowExportTip]    = useState(false)
  const [tipPos,           setTipPos]           = useState({ top: 0, left: 0 })
  const exportRef = useRef<HTMLButtonElement>(null)

  const filtered = ALL_RAW.filter((r) => {
    const inPeriod = r.date >= PERIOD_CUTOFF[period]
    const inCancha = cancha === 'todas' || r.cancha === cancha
    return inPeriod && inCancha
  })

  const totalMP       = filtered.reduce((s, r) => s + r.mercadoPago, 0)
  const totalSeña     = filtered.reduce((s, r) => s + r.seña,        0)
  const totalEfectivo = filtered.reduce((s, r) => s + Math.max(0, r.total - r.mercadoPago - r.seña), 0)
  const totalGeneral  = filtered.reduce((s, r) => s + r.total,       0)

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const rows       = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handlePeriod = useCallback((p: Period) => { setPeriod(p); setPage(1) }, [])
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
    { value: fmt(totalMP),       label: 'Mercado Pago' },
    { value: fmt(totalEfectivo), label: 'Efectivo'     },
    { value: fmt(totalSeña),     label: 'Señas'        },
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
        {/* Left: title */}
        <span style={{
          fontSize:      15,
          fontWeight:    600,
          color:         D.text,
          letterSpacing: '-0.01em',
          lineHeight:    1,
          userSelect:    'none',
          flexShrink:    0,
        }}>
          Finanzas
        </span>

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
                appearance:      'none',
                WebkitAppearance: 'none',
                backgroundColor: 'transparent',
                border:          `1px solid ${D.border}`,
                borderRadius:    6,
                color:           D.text,
                fontSize:        12,
                fontWeight:      500,
                padding:         '5px 28px 5px 10px',
                cursor:          'pointer',
                outline:         'none',
                fontFamily:      'inherit',
                lineHeight:      1,
              }}
            >
              <option style={{ background: 'oklch(22% 0.024 228)' }} value="todas">Todas las canchas</option>
              {CANCHAS.map((c) => (
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
          <FinancesTable
            rows={rows}
            page={page}
            totalPages={totalPages}
            totalRows={filtered.length}
            onPageChange={setPage}
          />
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
