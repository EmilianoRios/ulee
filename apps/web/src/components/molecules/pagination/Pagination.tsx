'use client'

import { useTheme } from 'tamagui'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page:         number
  totalPages:   number
  onPageChange: (page: number) => void
}

function buildPages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '…')[] = [1]

  if (current > 3) pages.push('…')

  const start = Math.max(2, current - 1)
  const end   = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('…')
  pages.push(total)

  return pages
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const t = useTheme()

  if (totalPages <= 1) return null

  const pages = buildPages(page, totalPages)

  const base: React.CSSProperties = {
    display:         'inline-flex',
    alignItems:      'center',
    justifyContent:  'center',
    minWidth:        32,
    height:          32,
    padding:         '0 10px',
    borderRadius:    7,
    border:          `1px solid ${t.bordeNeutral.val}`,
    backgroundColor: t.superficieContenido.val,
    color:           t.textoMuted.val,
    fontSize:        13,
    fontWeight:      400,
    cursor:          'pointer',
    lineHeight:      1,
    fontFamily:      'inherit',
  }

  const active: React.CSSProperties = {
    ...base,
    backgroundColor: t.verdeCanchaActivo.val,
    color:           t.verdeCanchaProfundo.val,
    fontWeight:      600,
    border:          `1px solid ${t.verdeCanchaActivo.val}`,
  }

  const disabled: React.CSSProperties = {
    ...base,
    opacity: 0.38,
    cursor:  'not-allowed',
  }

  return (
    <div role="navigation" aria-label="Paginación" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <button
        onClick={() => page > 1 && onPageChange(page - 1)}
        disabled={page === 1}
        style={page === 1 ? disabled : base}
        aria-label="Página anterior"
        className="pagination-btn"
      >
        <ChevronLeft size={14} strokeWidth={2} />
      </button>

      {pages.map((p, idx) =>
        p === '…' ? (
          <span
            key={`ellipsis-${idx}`}
            style={{ ...base, border: 'none', backgroundColor: 'transparent', cursor: 'default', color: t.textoInactivo.val }}
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            style={p === page ? active : base}
            aria-label={`Ir a la página ${p}`}
            aria-current={p === page ? 'page' : undefined}
            className="pagination-btn"
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => page < totalPages && onPageChange(page + 1)}
        disabled={page === totalPages}
        style={page === totalPages ? disabled : base}
        aria-label="Página siguiente"
        className="pagination-btn"
      >
        <ChevronRight size={14} strokeWidth={2} />
      </button>
    </div>
  )
}
