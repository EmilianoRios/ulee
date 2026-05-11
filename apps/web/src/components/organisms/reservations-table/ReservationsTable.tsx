'use client'

import { useTheme } from 'tamagui'
import { StatusChip, type ReservationStatus } from '../../atoms/status-chip'
import { Pagination } from '../../molecules/pagination'

export interface Reservation {
  id:      string
  cliente: string
  cancha:  string
  horario: string
  estado:  ReservationStatus
  total:   number
}

interface ReservationsTableProps {
  rows:         Reservation[]
  page:         number
  totalPages:   number
  onPageChange: (page: number) => void
  action?:      React.ReactNode
}

const COLS: { label: string; width?: number; align?: 'left' | 'right' }[] = [
  { label: 'Cliente' },
  { label: 'Cancha',  width: 160 },
  { label: 'Horario', width: 180 },
  { label: 'Estado',  width: 140 },
  { label: 'Total',   width: 100, align: 'right' },
]

export function ReservationsTable({ rows, page, totalPages, onPageChange, action }: ReservationsTableProps) {
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
    padding:      '10px 16px',
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
      {action && (
        <div style={{
          padding:        '10px 16px',
          borderBottom:   `1px solid ${t.bordeNeutral.val}`,
          flexShrink:     0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'flex-end',
        }}>
          {action}
        </div>
      )}

      {rows.length === 0 ? (
        <div style={{
          padding:       '56px 24px',
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           6,
          textAlign:     'center',
        }}>
          <span style={{ fontSize: 14, color: t.textoMuted.val, fontWeight: 400 }}>
            Todavía no hay reservas para hoy.
          </span>
          <span style={{ fontSize: 12, color: t.textoInactivo.val }}>
            Las reservas que lleguen aparecen acá.
          </span>
        </div>
      ) : (
        <>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                {COLS.map((col) => (
                  <col key={col.label} style={{ width: col.width ? col.width : undefined }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  {COLS.map((col) => (
                    <th key={col.label} style={{ ...th, textAlign: col.align ?? 'left', width: col.width }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className="table-row"
                    style={{ cursor: 'pointer' }}
                    role="row"
                    aria-rowindex={idx + 1}
                  >
                    <td style={td}>
                      <span style={{ fontWeight: 500 }}>{row.cliente}</span>
                    </td>
                    <td style={td}>{row.cancha}</td>
                    <td style={{ ...td, color: t.textoMuted.val }}>{row.horario}</td>
                    <td style={td}><StatusChip status={row.estado} /></td>
                    <td style={{ ...td, fontWeight: 500, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                      ${row.total.toLocaleString('es-AR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{
            padding:        '10px 16px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            borderTop:      `1px solid ${t.divisor.val}`,
            flexShrink:     0,
          }}>
            <span style={{ fontSize: 12, color: t.textoMuted.val }}>
              Página {page} de {totalPages}
            </span>
            <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
          </div>
        </>
      )}
    </div>
  )
}
