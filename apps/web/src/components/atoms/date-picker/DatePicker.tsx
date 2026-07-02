'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from 'tamagui'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { usePopoverPosition } from '@/hooks/use-popover-position'

interface DatePickerProps {
  value:     string   // ISO 'YYYY-MM-DD' or ''
  onChange:  (value: string) => void
  error?:    string
  disabled?: boolean
  style?:    CSSProperties
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function pad(n: number) { return String(n).padStart(2, '0') }
function toISO(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}` }
function parseISO(value: string): Date | null {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}
function formatDisplay(value: string): string {
  const d = parseISO(value)
  if (!d) return ''
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// 6x7 grid of dates spanning the leading/trailing days of adjacent months
function buildGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay())
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
}

export function DatePicker({ value, onChange, error, disabled, style }: DatePickerProps) {
  const t = useTheme()
  const { open, placement, triggerRef, popoverRef, openPopover, closePopover } =
    usePopoverPosition<HTMLButtonElement, HTMLDivElement>(360)

  const selected = parseISO(value)
  const today = new Date()
  const [cursor, setCursor] = useState(() => selected ?? today)

  const borderC = error
    ? 'oklch(65% 0.15 25)'
    : open
    ? 'oklch(50% 0.18 155)'
    : t.bordeNeutral.val

  function handleOpen() {
    setCursor(selected ?? today)
    openPopover()
  }

  const grid = buildGrid(cursor.getFullYear(), cursor.getMonth())

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? closePopover() : handleOpen())}
        style={{
          width:            '100%',
          padding:          '9px 32px 9px 12px',
          borderRadius:     7,
          border:           `1.5px solid ${borderC}`,
          backgroundColor:  disabled ? t.superficie.val : t.superficieContenido.val,
          color:            disabled ? t.textoInactivo.val : (value ? t.textoPrimario.val : t.textoMuted.val),
          fontSize:         14,
          fontFamily:       'inherit',
          outline:          'none',
          boxSizing:        'border-box',
          cursor:           disabled ? 'default' : 'pointer',
          transition:       'border-color 120ms ease-out',
          textAlign:        'left',
          position:         'relative',
          display:          'block',
          ...style,
        }}
      >
        {value ? formatDisplay(value) : 'dd/mm/aaaa'}
        <Calendar
          size={14}
          strokeWidth={2}
          style={{
            position:  'absolute',
            right:     10,
            top:       '50%',
            transform: 'translateY(-50%)',
            color:     disabled ? t.textoInactivo.val : t.textoMuted.val,
          }}
        />
      </button>

      {open && placement && createPortal(
        <div
          ref={popoverRef}
          style={{
            ...placement.style,
            width:            268,
            overflowY:        'auto',
            backgroundColor:  t.superficieContenido.val,
            border:           `1px solid ${t.bordeNeutral.val}`,
            borderRadius:     9,
            boxShadow:        '0 4px 16px rgba(0, 0, 0, 0.12)',
            padding:          12,
            zIndex:           1000,
            boxSizing:        'border-box',
          }}
        >
          {/* Month header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button
              type="button"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex', color: t.textoMuted.val }}
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, color: t.textoPrimario.val, textTransform: 'capitalize' }}>
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex', color: t.textoMuted.val }}
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Weekday header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 2 }}>
            {WEEKDAYS.map((w) => (
              <span key={w} style={{
                fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.02em',
                color: t.textoMuted.val, textAlign: 'center', padding: '4px 0',
              }}>
                {w}
              </span>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {grid.map((d) => {
              const inMonth  = d.getMonth() === cursor.getMonth()
              const isToday  = isSameDay(d, today)
              const isPicked = selected ? isSameDay(d, selected) : false
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  onClick={() => { onChange(toISO(d.getFullYear(), d.getMonth(), d.getDate())); closePopover() }}
                  style={{
                    width: '100%', aspectRatio: '1', border: isToday && !isPicked ? `1px solid ${t.textoMuted.val}` : 'none',
                    borderRadius: 6, background: isPicked ? t.verdeCanchaActivo.val : 'transparent',
                    color: isPicked ? t.verdeCanchaProfundo.val : inMonth ? t.textoPrimario.val : t.textoInactivo.val,
                    fontSize: 13, fontWeight: isPicked ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => { if (!isPicked) e.currentTarget.style.backgroundColor = t.fondoHover.val }}
                  onMouseLeave={(e) => { if (!isPicked) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: `1px solid ${t.divisor.val}` }}>
            <button
              type="button"
              onClick={() => { onChange(''); closePopover() }}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 6px', borderRadius: 5, fontSize: 12, fontWeight: 500, color: t.verdeCancha.val, fontFamily: 'inherit' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = t.verdeCanchaActivo.val }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => { onChange(toISO(today.getFullYear(), today.getMonth(), today.getDate())); closePopover() }}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 6px', borderRadius: 5, fontSize: 12, fontWeight: 500, color: t.verdeCancha.val, fontFamily: 'inherit' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = t.verdeCanchaActivo.val }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              Hoy
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
