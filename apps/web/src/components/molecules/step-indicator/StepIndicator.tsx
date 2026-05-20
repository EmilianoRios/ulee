'use client'

import { Check } from 'lucide-react'

interface StepIndicatorProps {
  steps: string[]
  currentStep: number // 0-indexed
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        marginBottom:   32,
        gap:            0,
      }}
    >
      {steps.map((label, index) => {
        const isDone    = index < currentStep
        const isActive  = index === currentStep
        const isLast    = index === steps.length - 1

        return (
          <div
            key={label}
            style={{
              display:    'flex',
              alignItems: 'center',
              gap:        0,
            }}
          >
            {/* Step dot */}
            <div
              style={{
                display:         'flex',
                flexDirection:   'column',
                alignItems:      'center',
                gap:             6,
              }}
            >
              <div
                style={{
                  width:           28,
                  height:          28,
                  borderRadius:    '50%',
                  backgroundColor: isDone
                    ? 'oklch(52% 0.16 155)'
                    : isActive
                      ? 'oklch(52% 0.16 155)'
                      : 'oklch(22% 0.01 228)',
                  border: isDone || isActive
                    ? '2px solid oklch(52% 0.16 155)'
                    : '2px solid oklch(35% 0.01 228)',
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'center',
                  transition:      'all 200ms ease-out',
                  flexShrink:      0,
                }}
              >
                {isDone ? (
                  <Check size={14} color="white" strokeWidth={2.5} />
                ) : (
                  <span
                    style={{
                      fontSize:   11,
                      fontWeight: 600,
                      color:      isActive ? 'white' : 'oklch(50% 0.01 228)',
                      lineHeight: 1,
                    }}
                  >
                    {index + 1}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize:  11,
                  color:     isDone || isActive ? 'oklch(75% 0.01 228)' : 'oklch(45% 0.01 228)',
                  whiteSpace: 'nowrap',
                  lineHeight: 1,
                }}
              >
                {label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                style={{
                  width:           40,
                  height:          2,
                  backgroundColor: isDone
                    ? 'oklch(52% 0.16 155)'
                    : 'oklch(25% 0.01 228)',
                  marginBottom:    20,
                  marginLeft:      4,
                  marginRight:     4,
                  flexShrink:      0,
                  transition:      'background-color 200ms ease-out',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
