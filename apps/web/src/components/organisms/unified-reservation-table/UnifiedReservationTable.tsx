'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTheme } from 'tamagui'
import { Search, ArrowUp, ArrowDown, ArrowUpDown, ChevronDown, X } from 'lucide-react'
import { Pagination } from '../../molecules/pagination'
import { StatusChip } from '../../atoms/status-chip'
import type { ReservationStatus } from '../../atoms/status-chip'
import { RESERVATION_STATUS_LABELS } from '@/lib/convex/status-labels'

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
  rows:               UnifiedRow[]
  onRowClick?:        (id: string) => void
  totalColumnLabel?:  string
  noun?:              string
  defaultPageSize?:   number
  showStatusFilter?:  boolean
}

type SortKey = 'cliente' | 'cancha' | 'diayhorario' | 'estado' | 'total'
type SortDir = 'asc' | 'desc'

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 15, 25, 50]

const STATUS_OPTIONS: { value: ReservationStatus | 'todas'; label: string }[] = [
  { value: 'todas',        label: 'Todos los estados'                   },
  { value: 'pending',      label: RESERVATION_STATUS_LABELS.pending      },
  { value: 'deposit_paid', label: RESERVATION_STATUS_LABELS.deposit_paid },
  { value: 'on_court',     label: RESERVATION_STATUS_LABELS.on_court     },
  { value: 'played',       label: RESERVATION_STATUS_LABELS.played       },
  { value: 'paid',         label: RESERVATION_STATUS_LABELS.paid         },
  { value: 'absent',       label: RESERVATION_STATUS_LABELS.absent       },
  { value: 'recurring',    label: RESERVATION_STATUS_LABELS.recurring    },
  { value: 'maintenance',  label: RESERVATION_STATUS_LABELS.maintenance  },
  { value: 'event',        label: RESERVATION_STATUS_LABELS.event        },
]

const COLS: { key: SortKey; label: string; align?: 'right'; width: number }[] = [
  { key: 'cliente',     label: 'Cliente',        width: 160 },
  { key: 'cancha',      label: 'Cancha',         width: 130 },
  { key: 'diayhorario', label: 'Día y horario',  width: 168 },
  { key: 'estado',      label: 'Estado',         width: 130 },
  { key: 'total',       label: 'Total',          width: 100, align: 'right' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return '$' + n.toLocaleString('es-AR')
}

function sortRows(rows: UnifiedRow[], key: SortKey, dir: SortDir): UnifiedRow[] {
  return [...rows].sort((a, b) => {
    let cmp = 0
    if (key === 'total') {
      cmp = a.total - b.total
    } else {
      cmp = String(a[key]).localeCompare(String(b[key]), 'es-AR', { sensitivity: 'base' })
    }
    return dir === 'asc' ? cmp : -cmp
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UnifiedReservationTable({
  rows,
  onRowClick,
  totalColumnLabel,
  noun,
  defaultPageSize = 10,
  showStatusFilter = true,
}: UnifiedReservationTableProps) {
  const t = useTheme()

  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'todas'>('todas')
  const [sortKey,      setSortKey]      = useState<SortKey | null>(null)
  const [sortDir,      setSortDir]      = useState<SortDir>('asc')
  const [page,         setPage]         = useState(1)
  const [pageSize,     setPageSize]     = useState(defaultPageSize)

  // Reset to page 1 when the parent passes new rows (tab/cancha/date filter changed)
  useEffect(() => { setPage(1) }, [rows])

  const statusFiltered = useMemo(
    () => statusFilter === 'todas' ? rows : rows.filter(r => r.estado === statusFilter),
    [rows, statusFilter]
  )

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return statusFiltered
    return statusFiltered.filter(r =>
      r.cliente.toLowerCase().includes(q) ||
      r.cancha.toLowerCase().includes(q) ||
      r.diayhorario.toLowerCase().includes(q) ||
      RESERVATION_STATUS_LABELS[r.estado].toLowerCase().includes(q)
    )
  }, [statusFiltered, search])

  const sorted = useMemo(
    () => sortKey ? sortRows(searched, sortKey, sortDir) : searched,
    [searched, sortKey, sortDir]
  )

  const totalResults = sorted.length
  const totalPages   = Math.max(1, Math.ceil(totalResults / pageSize))
  const safePage     = Math.min(page, totalPages)
  const pageRows     = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  const hasActiveFilters = search.trim().length > 0 || statusFilter !== 'todas'

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      if (sortDir === 'asc') { setSortDir('desc') }
      else                   { setSortKey(null)   }
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  function clearFilters() {
    setSearch('')
    setStatusFilter('todas')
    setPage(1)
  }

  const resolvedCols = COLS.map((col) =>
    col.key === 'total' && totalColumnLabel ? { ...col, label: totalColumnLabel } : col
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
    cursor:          'pointer',
    userSelect:      'none',
  }

  const td: React.CSSProperties = {
    padding:      '10px 16px',
    fontSize:     13,
    color:        t.textoPrimario.val,
    fontWeight:   400,
    lineHeight:   1.4,
    borderBottom: `1px solid ${t.divisor.val}`,
  }

  const selectStyle: React.CSSProperties = {
    appearance:       'none',
    WebkitAppearance: 'none',
    padding:          '6px 28px 6px 10px',
    borderRadius:     6,
    border:           `1px solid ${t.bordeNeutral.val}`,
    backgroundColor:  t.superficie.val,
    color:            t.textoPrimario.val,
    fontSize:         12,
    fontFamily:       'inherit',
    cursor:           'pointer',
    outline:          'none',
    lineHeight:       1,
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
      {/* Toolbar */}
      <div style={{
        display:         'flex',
        alignItems:      'center',
        gap:             8,
        padding:         '9px 12px',
        borderBottom:    `1px solid ${t.bordeNeutral.val}`,
        flexShrink:      0,
        flexWrap:        'wrap',
        backgroundColor: 'transparent',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: 200, flexShrink: 0 }}>
          <Search
            size={13}
            strokeWidth={2}
            style={{
              position:      'absolute',
              left:          9,
              top:           '50%',
              transform:     'translateY(-50%)',
              color:         t.textoMuted.val,
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{
              width:           '100%',
              boxSizing:       'border-box',
              padding:         '6px 30px 6px 30px',
              borderRadius:    6,
              border:          `1px solid ${t.bordeNeutral.val}`,
              backgroundColor: t.superficie.val,
              color:           t.textoPrimario.val,
              fontSize:        12,
              fontFamily:      'inherit',
              outline:         'none',
              lineHeight:      1,
            }}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1) }}
              style={{
                position:   'absolute',
                right:      7,
                top:        '50%',
                transform:  'translateY(-50%)',
                background: 'none',
                border:     'none',
                cursor:     'pointer',
                padding:    2,
                display:    'flex',
                alignItems: 'center',
                color:      t.textoMuted.val,
              }}
            >
              <X size={11} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Status filter */}
        {showStatusFilter && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value as ReservationStatus | 'todas'); setPage(1) }}
              style={{
                ...selectStyle,
                border:          statusFilter !== 'todas'
                  ? `1px solid ${t.verdeCancha.val}`
                  : `1px solid ${t.bordeNeutral.val}`,
                backgroundColor: statusFilter !== 'todas' ? t.verdeCanchaActivo.val : t.superficie.val,
                color:           statusFilter !== 'todas' ? t.verdeCanchaProfundo.val : t.textoPrimario.val,
              }}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown
              size={11}
              strokeWidth={2.5}
              style={{
                position:      'absolute',
                right:         8,
                top:           '50%',
                transform:     'translateY(-50%)',
                pointerEvents: 'none',
                color:         statusFilter !== 'todas' ? t.verdeCanchaProfundo.val : t.textoMuted.val,
              }}
            />
          </div>
        )}

      </div>

      {/* Table + footer */}
      {sorted.length === 0 ? (
            <div style={{
              flex:           1,
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            8,
              textAlign:      'center',
              padding:        '48px 24px',
            }}>
              <span style={{ fontSize: 14, color: t.textoMuted.val, fontWeight: 400 }}>
                {hasActiveFilters
                  ? 'Sin resultados para los filtros aplicados.'
                  : 'Sin movimientos para este período.'}
              </span>
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  style={{
                    marginTop:       2,
                    padding:         '5px 14px',
                    borderRadius:    6,
                    border:          `1px solid ${t.bordeNeutral.val}`,
                    backgroundColor: 'transparent',
                    color:           t.textoMuted.val,
                    fontSize:        12,
                    cursor:          'pointer',
                    fontFamily:      'inherit',
                  }}
                >
                  Limpiar filtros
                </button>
              ) : (
                <span style={{ fontSize: 12, color: t.textoInactivo.val }}>
                  Probá cambiando el período o la cancha.
                </span>
              )}
            </div>
          ) : (
            <>
              <div style={{ flex: 1, overflow: 'auto' }}>
                <table style={{ width: '100%', minWidth: 680, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <colgroup>
                    {resolvedCols.map(col => (
                      <col key={col.key} style={{ width: col.width }} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      {resolvedCols.map(col => {
                        const isSorted = sortKey === col.key
                        const SortIcon = isSorted
                          ? (sortDir === 'asc' ? ArrowUp : ArrowDown)
                          : ArrowUpDown
                        return (
                          <th
                            key={col.key}
                            onClick={() => handleSort(col.key)}
                            style={{ ...th, textAlign: col.align ?? 'left' }}
                          >
                            <div style={{
                              display:        col.align === 'right' ? 'inline-flex' : 'inline-flex',
                              alignItems:     'center',
                              justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start',
                              gap:            4,
                              width:          '100%',
                            }}>
                              {col.label}
                              <SortIcon
                                size={10}
                                strokeWidth={isSorted ? 2.5 : 2}
                                style={{ opacity: isSorted ? 1 : 0.35, flexShrink: 0 }}
                              />
                            </div>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row, idx) => (
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
                        <td style={td}><StatusChip status={row.estado} /></td>
                        <td style={{ ...td, fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {fmt(row.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{
                padding:        '9px 14px',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                borderTop:      `1px solid ${t.divisor.val}`,
                flexShrink:     0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, color: t.textoMuted.val }}>
                    {totalResults}{' '}
                    {noun ?? 'movimiento'}{totalResults !== 1 ? 's' : ''}
                    {hasActiveFilters && ' · filtrados'}
                  </span>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <select
                      value={pageSize}
                      onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                      style={selectStyle}
                    >
                      {PAGE_SIZES.map(s => (
                        <option key={s} value={s}>{s} por página</option>
                      ))}
                    </select>
                    <ChevronDown
                      size={11}
                      strokeWidth={2.5}
                      style={{
                        position:      'absolute',
                        right:         8,
                        top:           '50%',
                        transform:     'translateY(-50%)',
                        pointerEvents: 'none',
                        color:         t.textoMuted.val,
                      }}
                    />
                  </div>
                </div>
                <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
    </div>
  )
}
