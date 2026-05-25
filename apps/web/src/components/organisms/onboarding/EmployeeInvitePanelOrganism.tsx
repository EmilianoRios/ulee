'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { useTheme } from 'tamagui'
import { api } from '@canchero/backend'
import type { Id } from '@canchero/backend'
import { UserPlus } from 'lucide-react'

export function EmployeeInvitePanelOrganism() {
  const t              = useTheme()
  const venues         = useQuery(api.functions.venues.queries.listByOwner)
  const inviteEmployee = useMutation(api.functions.users.mutations.inviteEmployee)

  const [email,   setEmail]   = useState('')
  const [venueId, setVenueId] = useState<string>('')
  const [status,  setStatus]  = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const venueOptions = venues ?? []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage(null)

    if (!email.trim()) {
      setStatus('error')
      setMessage('El email es obligatorio.')
      return
    }
    if (!venueId) {
      setStatus('error')
      setMessage('Seleccioná una sede.')
      return
    }

    try {
      const result = await inviteEmployee({
        email:   email.trim().toLowerCase(),
        venueId: venueId as Id<'venues'>,
      })
      setStatus('success')
      setMessage(
        result.status === 'access_granted'
          ? 'El empleado fue agregado a la sede.'
          : 'Invitación enviada. El empleado tendrá acceso cuando se registre.',
      )
      setEmail('')
      setVenueId('')
    } catch (err: unknown) {
      setStatus('error')
      const convexMessage = (err as { data?: string })?.data
      if (convexMessage === 'already_invited') {
        setMessage('Este empleado ya tiene acceso a esa sede.')
      } else if (convexMessage === 'forbidden') {
        setMessage('No tenés permiso para invitar empleados a esa sede.')
      } else {
        setMessage('Error al invitar. Intentá de nuevo.')
      }
    }
  }

  const inputStyle: React.CSSProperties = {
    width:           '100%',
    padding:         '9px 12px',
    borderRadius:    7,
    border:          `1px solid ${t.bordeNeutral.val}`,
    backgroundColor: t.superficieContenido.val,
    color:           t.textoPrimario.val,
    fontSize:        13,
    fontFamily:      'inherit',
    outline:         'none',
    boxSizing:       'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize:   12,
    fontWeight: 500,
    color:      t.textoMuted.val,
    letterSpacing: '0.02em',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <UserPlus size={16} strokeWidth={2} />
        <span style={{ fontSize: 13, fontWeight: 600, color: t.textoNav.val }}>
          Invitar empleado
        </span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 480 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Email del empleado</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="empleado@ejemplo.com"
            style={inputStyle}
            onFocus={(e)  => { e.currentTarget.style.borderColor = t.verdeCancha.val }}
            onBlur={(e)   => { e.currentTarget.style.borderColor = t.bordeNeutral.val }}
          />
        </div>

        {venueOptions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Sede</label>
            <select
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">Seleccioná una sede</option>
              {venueOptions.map((v) => (
                <option key={v._id} value={v._id}>{v.name}</option>
              ))}
            </select>
          </div>
        )}

        {message && (
          <p style={{
            color:    status === 'success' ? t.verdeCancha.val : 'oklch(65% 0.19 25)',
            fontSize: 13,
            margin:   0,
          }}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            padding:         '9px 20px',
            backgroundColor: status === 'loading' ? 'oklch(35% 0.10 155)' : t.verdeCancha.val,
            color:           'white',
            border:          'none',
            borderRadius:    7,
            fontSize:        13,
            fontWeight:      500,
            cursor:          status === 'loading' ? 'default' : 'pointer',
            fontFamily:      'inherit',
            alignSelf:       'flex-start',
          }}
        >
          {status === 'loading' ? 'Enviando...' : 'Invitar empleado'}
        </button>
      </form>
    </div>
  )
}
