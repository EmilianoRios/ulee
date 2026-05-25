'use client'

import { useTheme } from 'tamagui'
import { Pencil, Camera } from 'lucide-react'
import { CourtStatusChip, type CourtStatus } from '../../atoms/court-status-chip'

export interface Court {
  id:              string
  name:            string
  sport:           string
  surface:         string
  covered:         boolean
  pricePerHour?:   number
  nightRatePrice?: number
  status:          CourtStatus
  todayTurnos:     number
  todayRevenue:    number
  images?:         string[]
}

interface CourtsTableProps {
  courts:   Court[]
  onEdit:   (court: Court) => void
  onCreate: () => void
}

const COLS = [
  { label: 'Cancha'          },
  { label: 'Características', width: 190 },
  { label: 'Precio / hr',     width: 110 },
  { label: 'Estado',          width: 130 },
  { label: 'Hoy',             width: 140 },
  { label: '',                width:  52 },
]

export function CourtsTable({ courts, onEdit, onCreate }: CourtsTableProps) {
  const t = useTheme()

  const th: React.CSSProperties = {
    padding:         '8px 16px',
    textAlign:       'left',
    fontSize:        11,
    fontWeight:      600,
    color:           t.textoMuted.val,
    letterSpacing:   '0.05em',
    textTransform:   'uppercase',
    borderBottom:    `1px solid ${t.bordeNeutral.val}`,
    whiteSpace:      'nowrap',
    position:        'sticky',
    top:             0,
    backgroundColor: t.superficieContenido.val,
    zIndex:          1,
  }

  const td: React.CSSProperties = {
    padding:      '14px 16px',
    fontSize:     13,
    color:        t.textoPrimario.val,
    fontWeight:   400,
    lineHeight:   1.4,
    borderBottom: `1px solid ${t.divisor.val}`,
  }

  return (
    <div style={{
      flex:            1,
      minHeight:       0,
      borderRadius:    7,
      border:          `1px solid ${t.bordeNeutral.val}`,
      backgroundColor: t.superficieContenido.val,
      overflow:        'hidden',
      display:         'flex',
      flexDirection:   'column',
    }}>
      {courts.length === 0 ? (
        <div style={{
          flex:          1,
          padding:       '64px 24px',
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           8,
          textAlign:     'center',
        }}>
          <span style={{ fontSize: 14, color: t.textoMuted.val, fontWeight: 400 }}>
            Todavía no hay canchas registradas.
          </span>
          <span style={{ fontSize: 12, color: t.textoInactivo.val }}>
            Agregá tu primera cancha para empezar a tomar reservas.
          </span>
          <button
            onClick={onCreate}
            style={{
              marginTop:       16,
              padding:         '9px 20px',
              borderRadius:    7,
              border:          'none',
              backgroundColor: t.verdeCancha.val,
              color:           'oklch(98% 0.004 155)',
              fontSize:        13,
              fontWeight:      500,
              cursor:          'pointer',
              fontFamily:      'inherit',
              transition:      'background-color 150ms ease-out',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.verdeCanchaProfundo.val }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.verdeCancha.val }}
          >
            Nueva cancha
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', minWidth: 780, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              {COLS.map((col, i) => (
                <col key={i} style={{ width: col.width ?? undefined }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {COLS.map((col, i) => (
                  <th key={i} style={th}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courts.map((court, idx) => {
                const dim = court.status === 'inactive' ? 0.45 : 1
                return (
                  <tr
                    key={court.id}
                    className="table-row"
                    style={{ cursor: 'pointer' }}
                    role="row"
                    aria-rowindex={idx + 1}
                    onClick={() => onEdit(court)}
                  >
                    {/* Cancha: thumbnail + nombre + deporte */}
                    <td style={{ ...td, opacity: dim }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {court.images?.[0] ? (
                          <img
                            src={court.images[0]}
                            alt={court.name}
                            style={{
                              width:      40,
                              height:     40,
                              borderRadius: 6,
                              objectFit:  'cover',
                              border:     `1px solid ${t.bordeNeutral.val}`,
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div style={{
                            width:           40,
                            height:          40,
                            borderRadius:    6,
                            backgroundColor: t.fondoHover.val,
                            border:          `1px solid ${t.bordeNeutral.val}`,
                            flexShrink:      0,
                            display:         'flex',
                            alignItems:      'center',
                            justifyContent:  'center',
                            color:           t.textoInactivo.val,
                          }}>
                            <Camera size={15} strokeWidth={1.5} />
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                          <span style={{
                            fontWeight:    500,
                            fontSize:      13,
                            color:         t.textoPrimario.val,
                            overflow:      'hidden',
                            textOverflow:  'ellipsis',
                            whiteSpace:    'nowrap',
                          }}>
                            {court.name}
                          </span>
                          <span style={{ fontSize: 11, color: t.textoMuted.val }}>
                            {court.sport}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Características: superficie + cobertura */}
                    <td style={{ ...td, opacity: dim }}>
                      <span style={{ fontSize: 12, color: t.textoMuted.val }}>
                        {court.surface} · {court.covered ? 'Techada' : 'Al aire libre'}
                      </span>
                    </td>

                    {/* Precio por hora */}
                    <td style={{ ...td, opacity: dim }}>
                      <span style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                        {court.pricePerHour != null ? `$${court.pricePerHour.toLocaleString('es-AR')}` : 'Hereda sede'}
                      </span>
                    </td>

                    {/* Estado */}
                    <td style={{ ...td, opacity: dim }}>
                      <CourtStatusChip status={court.status} />
                    </td>

                    {/* Actividad de hoy */}
                    <td style={{ ...td, opacity: dim }}>
                      {court.todayTurnos > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 12, color: t.textoPrimario.val, fontWeight: 500 }}>
                            {court.todayTurnos} {court.todayTurnos === 1 ? 'turno' : 'turnos'}
                          </span>
                          <span style={{ fontSize: 12, color: t.textoMuted.val, fontVariantNumeric: 'tabular-nums' }}>
                            ${court.todayRevenue.toLocaleString('es-AR')}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: t.textoInactivo.val }}>
                          Sin turnos
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td style={{ ...td, padding: '14px 10px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(court) }}
                        aria-label={`Editar ${court.name}`}
                        style={{
                          width:           32,
                          height:          32,
                          borderRadius:    6,
                          border:          '1px solid transparent',
                          backgroundColor: 'transparent',
                          cursor:          'pointer',
                          display:         'flex',
                          alignItems:      'center',
                          justifyContent:  'center',
                          color:           t.textoMuted.val,
                          fontFamily:      'inherit',
                          transition:      'background-color 120ms ease-out, border-color 120ms ease-out',
                        }}
                        onMouseEnter={(e) => {
                          const btn = e.currentTarget as HTMLButtonElement
                          btn.style.backgroundColor = t.fondoHover.val
                          btn.style.borderColor     = t.bordeNeutral.val
                        }}
                        onMouseLeave={(e) => {
                          const btn = e.currentTarget as HTMLButtonElement
                          btn.style.backgroundColor = 'transparent'
                          btn.style.borderColor     = 'transparent'
                        }}
                      >
                        <Pencil size={14} strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
