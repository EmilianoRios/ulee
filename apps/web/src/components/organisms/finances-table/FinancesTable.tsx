'use client'

import { useTheme } from 'tamagui'
import { Pagination } from '../../molecules/pagination'

export interface Transaction {
  id:           string
  cliente:      string
  cancha:       string
  diayhorario:  string
  fechaReserva: string
  online:       number
  cash:         number
  paymentType:  'deposit' | 'balance' | 'full' | 'mixed' | 'none'
  total:        number
}

interface FinancesTableProps {
  rows:         Transaction[]
  page:         number
  totalPages:   number
  totalRows:    number
  onPageChange: (page: number) => void
}

const COLS: { label: string; width?: number; align?: 'left' | 'right' }[] = [
  { label: 'Cliente' },
  { label: 'Cancha',           width: 140 },
  { label: 'Día y horario',    width: 178 },
  { label: 'Fecha de reserva', width: 130 },
  { label: 'Mercado Pago',     width: 122, align: 'right' },
  { label: 'Efectivo',         width: 100, align: 'right' },
  { label: 'Tipo',             width: 130 },
  { label: 'Total',            width: 100, align: 'right' },
]

const PAYMENT_TYPE_LABELS: Record<Transaction['paymentType'], string> = {
  deposit: 'Seña',
  balance: 'Saldo',
  full:    'Pago completo',
  mixed:   'Seña + Saldo',
  none:    'Pendiente',
}

const PAYMENT_TYPE_COLORS: Record<Transaction['paymentType'], { bg: string; text: string }> = {
  deposit: { bg: 'oklch(92% 0.04 230)',  text: 'oklch(35% 0.10 230)'  },
  balance: { bg: 'oklch(92% 0.05 160)',  text: 'oklch(35% 0.12 160)'  },
  full:    { bg: 'oklch(91% 0.06 145)',  text: 'oklch(32% 0.14 145)'  },
  mixed:   { bg: 'oklch(93% 0.04 290)',  text: 'oklch(38% 0.10 290)'  },
  none:    { bg: 'oklch(91% 0.00 0)',    text: 'oklch(50% 0.00 0)'    },
}

function PaymentTypeBadge({ type }: { type: Transaction['paymentType'] }) {
  const { bg, text } = PAYMENT_TYPE_COLORS[type]
  return (
    <span style={{
      display:         'inline-flex',
      alignItems:      'center',
      padding:         '3px 9px',
      borderRadius:    9999,
      fontSize:        11,
      fontWeight:      500,
      letterSpacing:   '0.02em',
      lineHeight:      1.4,
      backgroundColor: bg,
      color:           text,
      border:          `1px solid ${text}33`,
      whiteSpace:      'nowrap',
    }}>
      {PAYMENT_TYPE_LABELS[type]}
    </span>
  )
}

function fmt(n: number): string {
  return '$' + n.toLocaleString('es-AR')
}

export function FinancesTable({ rows, page, totalPages, totalRows, onPageChange }: FinancesTableProps) {
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
            <table style={{ width: '100%', minWidth: 830, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                {COLS.map((col) => (
                  <col key={col.label} style={{ width: col.width ?? undefined }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  {COLS.map((col) => (
                    <th key={col.label} style={{ ...th, textAlign: col.align ?? 'left' }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.id} className="table-row" role="row" aria-rowindex={idx + 1}>
                    <td style={td}>
                      <span style={{ fontWeight: 500 }}>{row.cliente}</span>
                    </td>
                    <td style={{ ...td, color: t.textoMuted.val }}>{row.cancha}</td>
                    <td style={{ ...td, color: t.textoMuted.val }}>{row.diayhorario}</td>
                    <td style={{ ...td, color: t.textoMuted.val }}>{row.fechaReserva}</td>
                    <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {row.online > 0
                        ? fmt(row.online)
                        : <span style={{ color: t.textoInactivo.val }}>—</span>
                      }
                    </td>
                    <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {row.cash > 0
                        ? fmt(row.cash)
                        : <span style={{ color: t.textoInactivo.val }}>—</span>
                      }
                    </td>
                    <td style={td}>
                      <PaymentTypeBadge type={row.paymentType} />
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
              {totalRows} movimiento{totalRows !== 1 ? 's' : ''}
            </span>
            <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
          </div>
        </>
      )}
    </div>
  )
}
