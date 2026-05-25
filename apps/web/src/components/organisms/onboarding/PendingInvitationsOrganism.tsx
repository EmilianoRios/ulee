'use client'

import { useMutation, useQuery } from 'convex/react'
import { useTheme } from 'tamagui'
import { Trash2 } from 'lucide-react'
import { api } from '@canchero/backend'
import type { Id } from '@canchero/backend'

export function PendingInvitationsOrganism() {
  const t              = useTheme()
  const data           = useQuery(api.functions.users.queries.getVenueEmployeesByOwner, {})
  const revokeAccess   = useMutation(api.functions.venues.mutations.revokeVenueAccess)

  if (data === undefined) return null

  async function handleRevoke(venueAccessId: Id<'venueAccess'>) {
    await revokeAccess({ venueAccessId })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: t.textoNav.val, lineHeight: 1.3 }}>
          Empleados
        </span>
        <span style={{ fontSize: 12, color: t.textoMuted.val, lineHeight: 1.5 }}>
          Empleados con acceso a tus sedes.
        </span>
      </div>

      {data.length === 0 ? (
        <p style={{
          fontSize:   13,
          color:      t.textoMuted.val,
          lineHeight: 1.5,
          margin:     0,
          padding:    '16px 0',
        }}>
          No hay empleados todavía.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Table header */}
          <div style={{
            display:             'grid',
            gridTemplateColumns: '1fr 1fr 90px 36px',
            gap:                 12,
            padding:             '0 0 8px',
            borderBottom:        `1px solid ${t.divisor.val}`,
          }}>
            {['Email', 'Sede', 'Estado'].map((h) => (
              <span key={h} style={{
                fontSize:      11,
                fontWeight:    500,
                color:         t.textoMuted.val,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                userSelect:    'none',
              }}>
                {h}
              </span>
            ))}
            <span />
          </div>

          {/* Rows */}
          {data.map((item, i) => (
            <div
              key={item.venueAccessId}
              style={{
                display:             'grid',
                gridTemplateColumns: '1fr 1fr 90px 36px',
                gap:                 12,
                alignItems:          'center',
                padding:             '10px 0',
                borderBottom:        i < data.length - 1 ? `1px solid ${t.divisor.val}` : 'none',
              }}
            >
              <span style={{ fontSize: 13, color: t.textoPrimario.val, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.inviteeEmail || item.inviteeName || '—'}
              </span>
              <span style={{ fontSize: 13, color: t.textoMuted.val, lineHeight: 1.3 }}>
                {item.venueName}
              </span>
              <span style={{
                display:         'inline-flex',
                alignItems:      'center',
                padding:         '3px 8px',
                borderRadius:    12,
                fontSize:        11,
                fontWeight:      500,
                width:           'fit-content',
                backgroundColor: item.status === 'active'
                  ? 'oklch(93% 0.05 155)'
                  : 'oklch(94% 0.04 70)',
                color: item.status === 'active'
                  ? 'oklch(38% 0.14 155)'
                  : 'oklch(45% 0.12 55)',
              }}>
                {item.status === 'active' ? 'Activo' : 'Pendiente'}
              </span>
              <button
                type="button"
                onClick={() => handleRevoke(item.venueAccessId)}
                aria-label={`Quitar acceso a ${item.inviteeEmail}`}
                style={{
                  width:           28,
                  height:          28,
                  borderRadius:    6,
                  border:          `1px solid ${t.bordeNeutral.val}`,
                  backgroundColor: 'transparent',
                  cursor:          'pointer',
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'center',
                  color:           t.textoMuted.val,
                  fontFamily:      'inherit',
                  transition:      'background-color 150ms ease-out, color 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'oklch(96% 0.015 25)'
                  e.currentTarget.style.borderColor     = 'oklch(80% 0.06 25)'
                  e.currentTarget.style.color           = 'oklch(55% 0.20 25)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor     = t.bordeNeutral.val
                  e.currentTarget.style.color           = t.textoMuted.val
                }}
              >
                <Trash2 size={13} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
