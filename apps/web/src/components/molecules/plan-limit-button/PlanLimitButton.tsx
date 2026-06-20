'use client'

import { useState } from 'react'

interface PlanLimitButtonProps {
  atLimit:     boolean
  limitLabel:  string
  onClick:     () => void
  children:    React.ReactNode
  buttonStyle?: React.CSSProperties
  onMouseEnter?: (e: React.MouseEvent<HTMLButtonElement>) => void
  onMouseLeave?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export function PlanLimitButton({
  atLimit,
  limitLabel,
  onClick,
  children,
  buttonStyle,
  onMouseEnter,
  onMouseLeave,
}: PlanLimitButtonProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false)

  if (!atLimit) {
    return (
      <button
        onClick={onClick}
        style={buttonStyle}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {children}
      </button>
    )
  }

  return (
    <div
      style={{ position: 'relative', display: 'inline-block', pointerEvents: 'all' }}
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
    >
      <button
        disabled
        style={{ ...buttonStyle, pointerEvents: 'none' }}
      >
        {children}
      </button>
      {tooltipVisible && (
        <span
          style={{
            position:     'absolute',
            top:          'calc(100% + 6px)',
            right:        0,
            zIndex:       50,
            whiteSpace:   'nowrap',
            background:   'oklch(0.25 0 0)',
            color:        'oklch(0.9 0 0)',
            padding:      '4px 10px',
            borderRadius: '6px',
            fontSize:     '12px',
            pointerEvents: 'none',
          }}
        >
          {limitLabel}
        </span>
      )}
    </div>
  )
}
