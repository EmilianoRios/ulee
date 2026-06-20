'use client'

import { useTheme } from 'tamagui'
import { useQuery } from 'convex/react'
import { api } from '@canchero/backend'
import { ModuleLayout } from '@/components/templates/module-layout'
import { useActiveVenue } from '@/context/active-venue'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientesPage() {
  const t = useTheme()
  const { activeVenueId } = useActiveVenue()

  // TODO: migrate to customers table once a population write path exists
  const clients = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api as any).functions.reservations.queriesClients.getClientsByVenue,
    activeVenueId ? { venueId: activeVenueId } : 'skip',
  )

  // ── Strip ─────────────────────────────────────────────────────────────────

  const strip = (
    <>
      <div style={{
        height:          56,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
        padding:         '0 32px',
        backgroundColor: t.cabeceraOscura.val,
      }}>
        <span style={{
          fontSize:      15,
          fontWeight:    600,
          color:         'oklch(97% 0.006 220)',
          letterSpacing: '-0.01em',
          lineHeight:    1,
          userSelect:    'none',
        }}>
          Clientes
        </span>
      </div>

      <div style={{
        height:       52,
        display:      'flex',
        alignItems:   'center',
        padding:      '0 32px',
        borderBottom: `1px solid ${t.divisor.val}`,
        gap:          6,
      }}>
        <span style={{
          fontSize:           20,
          fontWeight:         700,
          color:              t.textoPrimario.val,
          lineHeight:         1,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing:      '-0.01em',
        }}>
          {clients?.length ?? 0}
        </span>
        <span style={{ fontSize: 11, color: t.textoMuted.val, lineHeight: 1 }}>
          {(clients?.length ?? 0) === 1 ? 'cliente único' : 'clientes únicos'}
        </span>
      </div>
    </>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ModuleLayout strip={strip}>
      <div style={{
        height:        '100%',
        padding:       '20px 32px',
        boxSizing:     'border-box',
        overflowY:     'auto',
        display:       'flex',
        flexDirection: 'column',
        gap:           8,
      }}>

        {/* No venue selected */}
        {!activeVenueId && (
          <div style={{
            flex:           1,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: 13, color: t.textoMuted.val }}>
              Seleccioná una sede para ver los clientes.
            </span>
          </div>
        )}

        {/* Loading */}
        {activeVenueId && clients === undefined && (
          <div style={{
            flex:           1,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: 13, color: t.textoMuted.val }}>
              Cargando clientes...
            </span>
          </div>
        )}

        {/* Empty state */}
        {activeVenueId && clients !== undefined && clients.length === 0 && (
          <div style={{
            flex:           1,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: 13, color: t.textoMuted.val }}>
              Esta sede no tiene reservas aún.
            </span>
          </div>
        )}

        {/* Client list */}
        {activeVenueId && clients !== undefined && clients.length > 0 && clients.map((client) => (
          <div
            key={client.clientPhone}
            style={{
              display:         'flex',
              alignItems:      'center',
              gap:             16,
              padding:         '14px 20px',
              borderRadius:    10,
              border:          `1.5px solid ${t.divisor.val}`,
              backgroundColor: 'transparent',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize:      14,
                fontWeight:    600,
                color:         t.textoPrimario.val,
                letterSpacing: '-0.01em',
                lineHeight:    1.2,
                overflow:      'hidden',
                textOverflow:  'ellipsis',
                whiteSpace:    'nowrap',
                marginBottom:  4,
              }}>
                {client.clientName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: t.textoMuted.val, lineHeight: 1 }}>
                  {client.clientPhone}
                </span>
                <span style={{ fontSize: 12, color: t.textoMuted.val, lineHeight: 1 }}>
                  Última: {client.lastDate.split('-').reverse().join('/')}
                </span>
              </div>
            </div>
            <div style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'flex-end',
              gap:            2,
              flexShrink:     0,
            }}>
              <span style={{
                fontSize:           18,
                fontWeight:         700,
                color:              t.textoPrimario.val,
                lineHeight:         1,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {client.count}
              </span>
              <span style={{ fontSize: 11, color: t.textoMuted.val, lineHeight: 1 }}>
                {client.count === 1 ? 'reserva' : 'reservas'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ModuleLayout>
  )
}
