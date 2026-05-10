'use client'

import { useTheme } from 'tamagui'
import { TrendingUp, TrendingDown } from 'lucide-react'

type Trend = 'up' | 'down' | 'neutral'

type KpiCardProps =
  | {
      label:           string
      value:           string | number
      subtitle:        string
      comparisonLabel?: never
      delta?:           never
      trend?:           never
    }
  | {
      label:           string
      value:           string | number
      subtitle?:       never
      comparisonLabel: string
      delta:           number
      trend:           Trend
    }

export function KpiCard(props: KpiCardProps) {
  const t = useTheme()
  const { label, value } = props

  const footer = props.subtitle !== undefined ? (
    <span style={{ fontSize: 11, fontWeight: 400, color: t.textoInactivo.val, marginTop: 2 }}>
      {props.subtitle}
    </span>
  ) : (() => {
    const { delta, trend, comparisonLabel } = props as {
      delta: number; trend: Trend; comparisonLabel: string
    }

    const sentiment =
      trend === 'up'      ? t.verdeCancha.val
      : trend === 'down'  ? 'oklch(52% 0.18 25)'
      : t.textoMuted.val

    const DeltaIcon = delta > 0 ? TrendingUp : TrendingDown

    const text = trend === 'neutral'
      ? `Sin cambios vs ${comparisonLabel}`
      : `${delta > 0 ? '+' : ''}${delta}% vs ${comparisonLabel}`

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
        {trend !== 'neutral' && (
          <DeltaIcon size={12} color={sentiment} strokeWidth={2} style={{ flexShrink: 0 }} />
        )}
        <span style={{ fontSize: 11, fontWeight: 500, color: sentiment }}>
          {text}
        </span>
      </div>
    )
  })()

  return (
    <div
      style={{
        flex:            1,
        minWidth:        0,
        padding:         '12px 16px',
        borderRadius:    7,
        border:          `1px solid ${t.bordeNeutral.val}`,
        backgroundColor: t.superficieContenido.val,
        display:         'flex',
        flexDirection:   'column',
        gap:             4,
      }}
    >
      <span style={{
        fontSize:      12,
        fontWeight:    500,
        color:         t.textoMuted.val,
        letterSpacing: '0.02em',
        lineHeight:    1.4,
      }}>
        {label}
      </span>

      <span style={{
        fontSize:      20,
        fontWeight:    600,
        color:         t.textoPrimario.val,
        lineHeight:    1.2,
        letterSpacing: '-0.01em',
      }}>
        {value}
      </span>

      {footer}
    </div>
  )
}
