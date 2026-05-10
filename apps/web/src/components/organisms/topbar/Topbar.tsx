'use client'

import { usePathname } from 'next/navigation'
import { useTheme } from 'tamagui'

// ─── Route definitions ────────────────────────────────────────────────────────

const ROUTE_MAP: Record<string, string> = {
  '/reservas':      'Reservas',
  '/calendario':    'Calendario',
  '/canchas':       'Canchas',
  '/clientes':      'Clientes',
  '/finanzas':      'Finanzas',
  '/estadisticas':  'Estadísticas',
  '/sedes':         'Sedes',
  '/configuracion': 'Configuración',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Topbar() {
  const t        = useTheme()
  const pathname = usePathname()
  const title    = ROUTE_MAP[pathname]

  if (!title) return null

  return (
    <div style={{
      height:          56,
      display:         'flex',
      alignItems:      'center',
      padding:         '0 32px',
      flexShrink:      0,
      backgroundColor: t.cabeceraOscura.val,
    }}>
      <h1 style={{
        margin:        0,
        fontSize:      18,
        fontWeight:    600,
        color:         t.cabeceraTexto.val,
        letterSpacing: '-0.01em',
        lineHeight:    1,
      }}>
        {title}
      </h1>
    </div>
  )
}
