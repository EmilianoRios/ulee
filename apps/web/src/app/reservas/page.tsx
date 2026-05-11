'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTheme } from 'tamagui'
import { ReservationsTable, type Reservation } from '@/components/organisms/reservations-table'
import { ModuleLayout } from '@/components/templates/module-layout'

// ─── Mock data ────────────────────────────────────────────────────────────────

const STATS = [
  { value: '14',       label: 'hoy'        },
  { value: '$142.500', label: 'sem.'       },
  { value: '3',        label: 'pendientes' },
  { value: '4 de 6',   label: 'canchas'   },
]

const ALL_ROWS: Reservation[] = [
  { id:  '1', cliente: 'Lucas Martínez',    cancha: 'Cancha 1',     horario: 'Lun 08:00 – 09:00', estado: 'pagado',         total: 8500  },
  { id:  '2', cliente: 'Sofía González',    cancha: 'La Principal', horario: 'Lun 09:00 – 10:00', estado: 'señado',         total: 12000 },
  { id:  '3', cliente: 'Martín Rodríguez',  cancha: 'Cancha Pádel', horario: 'Lun 10:00 – 11:00', estado: 'paga_en_cancha', total: 9500  },
  { id:  '4', cliente: 'Valentina López',   cancha: 'Cancha 2',     horario: 'Lun 11:00 – 12:00', estado: 'pagado',         total: 8500  },
  { id:  '5', cliente: 'Agustín Torres',    cancha: 'La Principal', horario: 'Lun 14:00 – 15:00', estado: 'señado',         total: 12000 },
  { id:  '6', cliente: 'Camila Fernández',  cancha: 'Cancha 1',     horario: 'Lun 15:00 – 16:00', estado: 'pagado',         total: 8500  },
  { id:  '7', cliente: 'Nicolás Pérez',     cancha: 'Cancha Pádel', horario: 'Lun 16:00 – 17:00', estado: 'paga_en_cancha', total: 9500  },
  { id:  '8', cliente: 'Luciana García',    cancha: 'Cancha 3',     horario: 'Lun 17:00 – 18:00', estado: 'señado',         total: 11000 },
  { id:  '9', cliente: 'Santiago Ruiz',     cancha: 'La Principal', horario: 'Lun 18:00 – 19:00', estado: 'pagado',         total: 12000 },
  { id: '10', cliente: 'Pilar Herrera',     cancha: 'Cancha 1',     horario: 'Lun 19:00 – 20:00', estado: 'pagado',         total: 10000 },
  { id: '11', cliente: 'Mateo Álvarez',     cancha: 'Cancha 2',     horario: 'Lun 20:00 – 21:00', estado: 'señado',         total: 10000 },
  { id: '12', cliente: 'Florencia Sosa',    cancha: 'Cancha Pádel', horario: 'Lun 21:00 – 22:00', estado: 'paga_en_cancha', total: 9500  },
  { id: '13', cliente: 'Tomás Ramírez',     cancha: 'Cancha 3',     horario: 'Lun 22:00 – 23:00', estado: 'pagado',         total: 11000 },
  { id: '14', cliente: 'Emilia Vega',       cancha: 'La Principal', horario: 'Mar 08:00 – 09:00', estado: 'pagado',         total: 12000 },
]

const PAGE_SIZE = 8

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReservasPage() {
  const t    = useTheme()
  const [page, setPage] = useState(1)

  const totalPages = Math.ceil(ALL_ROWS.length / PAGE_SIZE)
  const rows       = ALL_ROWS.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const strip = (
    <>
      {/* Dark header: module identity + primary action */}
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
          Reservas
        </span>

        <button
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
          Nueva reserva
        </button>
      </div>

      {/* Info strip: contextual stats on light background */}
      <div style={{
        height:       36,
        display:      'flex',
        alignItems:   'center',
        padding:      '0 32px',
        borderBottom: `1px solid ${t.divisor.val}`,
        gap:          0,
      }}>
        {STATS.map((stat, i) => (
          <div key={stat.label} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && (
              <span style={{ fontSize: 14, color: t.textoInactivo.val, padding: '0 10px', lineHeight: 1, userSelect: 'none' }}>
                ·
              </span>
            )}
            <span style={{ fontSize: 13, color: t.textoMuted.val, lineHeight: 1, userSelect: 'none' }}>
              <span style={{ fontWeight: 600, color: t.textoPrimario.val, marginRight: 4, fontVariantNumeric: 'tabular-nums' }}>
                {stat.value}
              </span>
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </>
  )

  return (
    <ModuleLayout strip={strip}>
      <div style={{
        height:        '100%',
        padding:       '12px 32px',
        boxSizing:     'border-box',
        display:       'flex',
        flexDirection: 'column',
      }}>
        <ReservationsTable
          rows={rows}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </ModuleLayout>
  )
}
