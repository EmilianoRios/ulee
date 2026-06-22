'use client'

import { useTheme } from 'tamagui'
import { Pagination } from '../../molecules/pagination'
import { StatusChip } from '../../atoms/status-chip'
import type { ReservationStatus } from '../../atoms/status-chip'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UnifiedRow {
  id:          string
  cliente:     string
  cancha:      string
  diayhorario: string
  estado:      ReservationStatus
  total:       number
}

export interface UnifiedReservationTableProps {
  rows:              UnifiedRow[]
  page:              number
  totalPages:        number
  totalRows:         number
  onPageChange:      (page: number) => void
  onRowClick?:       (id: string) => void
  totalColumnLabel?: string   // default 'Total'
  noun?:             string   // default 'movimiento'
}

// ─── Column definitions ───────────────────────────────────────────────────────

const COLS: { label: string; width?: number; align?: 'left' | 'right' }[] = [
  { label: 'Cliente',        width: 160                },
  { label: 'Cancha',         width: 140                },
  { label: 'Día y horario',  width: 178                },
  { label: 'Estado',         width: 130                },
  { label: 'Total',          width: 100, align: 'right' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return '$' + n.toLocaleString('es-AR')
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UnifiedReservationTable({
  rows,
  page,
  totalPages,
  totalRows,
  onPageChange,
  onRowClick,
  totalColumnLabel,
  noun,
}: UnifiedReservationTableProps) {
  const t = useTheme()

  const resolvedCols = COLS.map((col, i) =>
    i === COLS.length - 1 && totalColumnLabel ? { ...col, label: totalColumnLabel } : col
  )

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
      {rows.length === 0 ? (
        <div style={{
          flex:           1,
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            6,
          textAlign:      'center',
          padding:        '56px 24px',
        }}>
          <span style={{ fontSize: 14, color: t.textoMuted.val, fontWeight: 400 }}>
            Sin movimientos para este período.
          </span>
          <span style={{ fontSize: 12, color: t.textoInactivo.val }}>
            Probá cambiando el período o la cancha.
          </span>
        </div>
      ) : (
        <>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: '100%', minWidth: 710, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                {COLS.map((col) => (
                  <col key={col.label} style={{ width: col.width ?? undefined }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  {resolvedCols.map((col) => (
                    <th key={col.label} style={{ ...th, textAlign: col.align ?? 'left' }}>
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
                    role="row"
                    aria-rowindex={idx + 1}
                    onClick={onRowClick ? () => onRowClick(row.id) : undefined}
                    style={onRowClick ? { cursor: 'pointer' } : undefined}
                  >
                    <td style={td}>
                      <span style={{ fontWeight: 500 }}>{row.cliente}</span>
                    </td>
                    <td style={{ ...td, color: t.textoMuted.val }}>{row.cancha}</td>
                    <td style={{ ...td, color: t.textoMuted.val }}>{row.diayhorario}</td>
                    <td style={td}>
                      <StatusChip status={row.estado} />
                    </td>
                    <td style={{ ...td, fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(row.total)}
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
              {totalRows} {noun ?? 'movimiento'}{totalRows !== 1 ? 's' : ''}
            </span>
            <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
          </div>
        </>
      )}
    </div>
  )
}
