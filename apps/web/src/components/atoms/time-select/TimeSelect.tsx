'use client'

import { useRef, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'
import { useTheme } from 'tamagui'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad(n: number) { return String(n).padStart(2, '0') }

function parseTime(value: string): [number, number] {
  const parts = (value || '00:00').split(':').map(Number)
  const h = parts[0] ?? 0
  const m = parts[1] ?? 0
  return [isNaN(h) ? 0 : h, isNaN(m) ? 0 : m]
}

// ─── Segment ──────────────────────────────────────────────────────────────────

function TimeSegment({ value, min, max, onChange, onNext, onPrev, inputRef, disabled }: {
  value:     number
  min:       number
  max:       number
  onChange:  (v: number) => void
  onNext?:   () => void
  onPrev?:   () => void
  inputRef?: RefObject<HTMLInputElement>
  disabled?: boolean
}) {
  const pendingRef = useRef<string | null>(null)

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      pendingRef.current = null
      onChange(value >= max ? min : value + 1)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      pendingRef.current = null
      onChange(value <= min ? max : value - 1)
      return
    }
    if (e.key === 'ArrowRight' || e.key === ':') {
      e.preventDefault()
      onNext?.()
      return
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      onPrev?.()
      return
    }
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault()
      pendingRef.current = null
      onChange(min)
      return
    }
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault()
      const digit = e.key
      if (pendingRef.current !== null) {
        const combined = parseInt(pendingRef.current + digit, 10)
        pendingRef.current = null
        if (combined <= max) {
          onChange(combined)
        } else {
          // Combined value out of range — treat this digit as new first digit
          const single = parseInt(digit, 10)
          if (single <= max) onChange(single)
          if (single * 10 > max) {
            onNext?.()
          } else {
            pendingRef.current = digit
          }
        }
        onNext?.()
      } else {
        const single = parseInt(digit, 10)
        if (single <= max) onChange(single)
        if (single * 10 > max) {
          onNext?.()
        } else {
          pendingRef.current = digit
        }
      }
      return
    }
    // Allow Tab/Enter to propagate naturally; block everything else
    if (e.key !== 'Tab' && e.key !== 'Enter') {
      e.preventDefault()
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      readOnly
      value={pad(value)}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      onFocus={(e) => {
        pendingRef.current = null
        e.target.select()
      }}
      aria-label={max === 23 ? 'Hora' : 'Minutos'}
      style={{
        width:              26,
        textAlign:          'center',
        border:             'none',
        background:         'transparent',
        fontSize:           13,
        fontFamily:         'inherit',
        fontVariantNumeric: 'tabular-nums',
        outline:            'none',
        color:              'inherit',
        padding:            0,
        lineHeight:         1,
        cursor:             disabled ? 'default' : 'text',
      }}
    />
  )
}

// ─── TimeSelect ───────────────────────────────────────────────────────────────

export function TimeSelect({ value, onChange, error, disabled, style }: {
  value:     string
  onChange:  (v: string) => void
  error?:    string
  disabled?: boolean
  style?:    CSSProperties
}) {
  const t = useTheme()
  const [focused, setFocused] = useState(false)
  const hourRef = useRef<HTMLInputElement>(null)
  const minRef  = useRef<HTMLInputElement>(null)
  const [hh, mm] = parseTime(value)

  const borderC = error
    ? 'oklch(65% 0.15 25)'
    : focused
    ? 'oklch(50% 0.18 155)'
    : t.bordeNeutral.val

  return (
    <div
      style={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        padding:         '7px 11px',
        borderRadius:    7,
        border:          `1.5px solid ${borderC}`,
        backgroundColor: disabled ? t.superficie.val : t.superficieContenido.val,
        transition:      'border-color 120ms ease-out',
        gap:             1,
        cursor:          disabled ? 'default' : 'text',
        color:           disabled ? t.textoInactivo.val : t.textoPrimario.val,
        boxSizing:       'border-box',
        userSelect:      'none',
        ...style,
      }}
      onClick={(e) => {
        if (!disabled && (e.target as HTMLElement).tagName !== 'INPUT') {
          hourRef.current?.focus()
        }
      }}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setFocused(false)
        }
      }}
    >
      <TimeSegment
        value={hh}
        min={0}
        max={23}
        inputRef={hourRef}
        disabled={disabled}
        onChange={(v) => onChange(`${pad(v)}:${pad(mm)}`)}
        onNext={() => minRef.current?.focus()}
      />
      <span style={{
        color:      t.textoMuted.val,
        fontSize:   13,
        fontWeight: 600,
        lineHeight: 1,
        flexShrink: 0,
        marginBottom: 1,
      }}>
        :
      </span>
      <TimeSegment
        value={mm}
        min={0}
        max={59}
        inputRef={minRef}
        disabled={disabled}
        onChange={(v) => onChange(`${pad(hh)}:${pad(v)}`)}
        onPrev={() => hourRef.current?.focus()}
      />
    </div>
  )
}
