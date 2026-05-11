'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTheme } from 'tamagui'
import { CourtsTable, type Court } from '@/components/organisms/courts-list'
import { CourtSlideOver } from '@/components/organisms/court-slide-over'
import { ModuleLayout } from '@/components/templates/module-layout'

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_COURTS: Court[] = [
  { id: '1', name: 'La Principal', sport: 'Fútbol 5', surface: 'Sintético', covered: true,  pricePerHour: 12000, status: 'activa',        todayTurnos: 7, todayRevenue: 84000 },
  { id: '2', name: 'Cancha 2',     sport: 'Fútbol 5', surface: 'Sintético', covered: false, pricePerHour: 10000, status: 'activa',        todayTurnos: 5, todayRevenue: 50000 },
  { id: '3', name: 'Cancha 3',     sport: 'Fútbol 7', surface: 'Sintético', covered: false, pricePerHour: 11000, status: 'activa',        todayTurnos: 6, todayRevenue: 66000 },
  { id: '4', name: 'Cancha Pádel', sport: 'Pádel',    surface: 'Hormigón',  covered: true,  pricePerHour:  9500, status: 'activa',        todayTurnos: 4, todayRevenue: 38000 },
  { id: '5', name: 'Cancha Tenis', sport: 'Tenis',    surface: 'Tierra',    covered: false, pricePerHour:  8500, status: 'inactiva',      todayTurnos: 0, todayRevenue:     0 },
  { id: '6', name: 'Cancha Norte', sport: 'Fútbol 5', surface: 'Sintético', covered: true,  pricePerHour: 10000, status: 'mantenimiento', todayTurnos: 0, todayRevenue:     0 },
]

function deriveStats(courts: Court[]) {
  const active   = courts.filter((c) => c.status === 'activa').length
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

  const [courts,   setCourts]   = useState<Court[]>(INITIAL_COURTS)
  const [editing,  setEditing]  = useState<Court | null>(null)
  const [creating, setCreating] = useState(false)

  const isOpen    = editing !== null || creating
  const slideOver = editing ?? null

  const STATS = deriveStats(courts)

  function handleSave(data: Omit<Court, 'id' | 'todayTurnos' | 'todayRevenue'>) {
    if (editing) {
      setCourts((cs) => cs.map((c) => c.id === editing.id ? { ...c, ...data } : c))
    } else {
      setCourts((cs) => [...cs, { id: String(Date.now()), todayTurnos: 0, todayRevenue: 0, ...data }])
    }
  }

  function handleClose() {
    setEditing(null)
    setCreating(false)
  }

  function openCreate() {
    setEditing(null)
    setCreating(true)
  }

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
      <div style={{
        height:       52,
        display:      'flex',
        alignItems:   'center',
        padding:      '0 32px',
        borderBottom: `1px solid ${t.divisor.val}`,
      }}>
        {STATS.map((stat, i) => (
          <div key={stat.label} style={{ display: 'flex', alignItems: 'center' }}>
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
