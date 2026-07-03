'use client'

import { useTheme } from 'tamagui'
import { fmtDuration } from './helpers'

export function EnCanchaProgress({ elapsed, remaining, durationMins }: {
  elapsed:      number
  remaining:    number
  durationMins: number
}) {
  const t = useTheme()
  return (
    <div style={{ padding: '8px 24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: t.textoMuted.val, fontWeight: 500 }}>Transcurrido</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: t.textoNav.val, marginTop: 2 }}>{fmtDuration(elapsed)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: t.textoMuted.val, fontWeight: 500 }}>Restante</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: t.textoNav.val, marginTop: 2 }}>{fmtDuration(remaining)}</div>
        </div>
      </div>
      <div style={{ height: 6, borderRadius: 3, backgroundColor: t.fondoHover.val, overflow: 'hidden' }}>
        <div style={{
          height:          '100%',
          width:           `${Math.min(100, durationMins > 0 ? (elapsed / durationMins) * 100 : 0)}%`,
          backgroundColor: t.verdeCancha.val,
          borderRadius:    3,
        }} />
      </div>
    </div>
  )
}
