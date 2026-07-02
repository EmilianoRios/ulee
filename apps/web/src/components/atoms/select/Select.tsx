'use client'

import { createPortal } from 'react-dom'
import type { CSSProperties } from 'react'
import { useTheme } from 'tamagui'
import { Check, ChevronDown } from 'lucide-react'
import { usePopoverPosition } from '@/hooks/use-popover-position'

export interface SelectOption {
  value:     string
  label:     string
  disabled?: boolean
}

interface SelectProps {
  value:       string
  onChange:    (value: string) => void
  options:     SelectOption[]
  placeholder?: string
  error?:      string
  disabled?:   boolean
  style?:      CSSProperties
  chevronColor?: string
  /** idle border color override — for surfaces off the light theme (e.g. the dark KPI-strip toolbar) */
  borderColor?: string
  /** border color while open/focused — pairs with `borderColor` */
  focusColor?: string
}

export function Select({
  value, onChange, options, placeholder, error, disabled, style, chevronColor, borderColor, focusColor,
}: SelectProps) {
  const t = useTheme()
  const { open, placement, triggerRef, popoverRef, openPopover, closePopover } =
    usePopoverPosition<HTMLButtonElement, HTMLDivElement>(260)

  const selected = options.find((o) => o.value === value)

  const borderC = error
    ? 'oklch(65% 0.15 25)'
    : open
    ? (focusColor ?? 'oklch(50% 0.18 155)')
    : (borderColor ?? t.bordeNeutral.val)

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? closePopover() : openPopover())}
        style={{
          width:            '100%',
          padding:          '9px 32px 9px 12px',
          borderRadius:     7,
          border:           `1.5px solid ${borderC}`,
          backgroundColor:  disabled ? t.superficie.val : t.superficieContenido.val,
          color:            disabled ? t.textoInactivo.val : (selected ? t.textoPrimario.val : t.textoMuted.val),
          fontSize:         13,
          fontFamily:       'inherit',
          outline:          'none',
          boxSizing:        'border-box',
          cursor:           disabled ? 'default' : 'pointer',
          transition:       'border-color 120ms ease-out',
          textAlign:        'left',
          position:         'relative',
          display:          'block',
          overflow:         'hidden',
          textOverflow:     'ellipsis',
          whiteSpace:       'nowrap',
          ...style,
        }}
      >
        {selected ? selected.label : (placeholder ?? '')}
        <ChevronDown
          size={14}
          strokeWidth={2}
          style={{
            position:  'absolute',
            right:     10,
            top:       '50%',
            transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
            transition: 'transform 120ms ease-out',
            color:     disabled ? t.textoInactivo.val : (chevronColor ?? t.textoMuted.val),
          }}
        />
      </button>

      {open && placement && createPortal(
        <div
          ref={popoverRef}
          role="listbox"
          style={{
            ...placement.style,
            overflowY:        'auto',
            backgroundColor:  t.superficieContenido.val,
            border:           `1px solid ${t.bordeNeutral.val}`,
            borderRadius:     7,
            boxShadow:        '0 4px 16px rgba(0, 0, 0, 0.12)',
            padding:          4,
            zIndex:           1000,
            boxSizing:        'border-box',
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => { onChange(opt.value); closePopover() }}
                style={{
                  width:           '100%',
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'space-between',
                  gap:             8,
                  padding:         '9px 12px',
                  borderRadius:    5,
                  border:          'none',
                  backgroundColor: isSelected ? t.verdeCanchaActivo.val : 'transparent',
                  color:           isSelected ? t.verdeCanchaProfundo.val : t.textoPrimario.val,
                  fontSize:        13,
                  fontWeight:      isSelected ? 600 : 400,
                  fontFamily:      'inherit',
                  textAlign:       'left',
                  cursor:          opt.disabled ? 'default' : 'pointer',
                  opacity:         opt.disabled ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && !opt.disabled) e.currentTarget.style.backgroundColor = t.fondoHover.val
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {opt.label}
                {isSelected && <Check size={13} strokeWidth={2.5} />}
              </button>
            )
          })}
        </div>,
        document.body,
      )}
    </>
  )
}
