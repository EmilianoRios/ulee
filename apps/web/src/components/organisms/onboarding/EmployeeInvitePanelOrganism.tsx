'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { useTheme } from 'tamagui'
import { api } from '@canchero/backend'
import type { Id } from '@canchero/backend'
import { UserPlus, Users } from 'lucide-react'

type ModuleKey = 'reservations' | 'finances' | 'courts' | 'customers'

const MODULE_LABELS: Record<ModuleKey, string> = {
  reservations: 'Reservas',
  finances:     'Finanzas',
  courts:       'Canchas',
  customers:    'Clientes',
}

const ALL_MODULES: ModuleKey[] = ['reservations', 'finances', 'courts', 'customers']

export function EmployeeInvitePanelOrganism() {
  const t              = useTheme()
  const venues         = useQuery(api.functions.venues.queries.listByOwner)
  const employees      = useQuery(api.functions.users.queries.getVenueEmployeesByOwner)
  const inviteEmployee = useMutation(api.functions.users.mutations.inviteEmployee)
  const updateAccess   = useMutation(api.functions.users.mutations.updateEmployeeAccess)

  const [email,   setEmail]   = useState('')
  const [venueId, setVenueId] = useState<string>('')
  const [status,  setStatus]  = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  // Per-employee module selection state: venueAccessId → Set<ModuleKey>
  const [moduleSelections, setModuleSelections] = useState<Record<string, Set<ModuleKey>>>({})
  const [accessSaving, setAccessSaving] = useState<Record<string, boolean>>({})
  const [accessMessage, setAccessMessage] = useState<Record<string, string | null>>({})

  const venueOptions = venues ?? []

  function getModulesForEmployee(venueAccessId: string): Set<ModuleKey> {
    if (moduleSelections[venueAccessId] !== undefined) return moduleSelections[venueAccessId]
    const emp = employees?.find((e) => e.venueAccessId === venueAccessId)
    if (emp?.allowedModules !== undefined) return new Set(emp.allowedModules as ModuleKey[])
    return new Set(ALL_MODULES)
  }

  function toggleModule(venueAccessId: string, module: ModuleKey) {
    setModuleSelections((prev) => {
      const current = new Set(prev[venueAccessId] ?? ALL_MODULES)
      if (current.has(module)) {
        current.delete(module)
      } else {
        current.add(module)
      }
      return { ...prev, [venueAccessId]: current }
    })
  }

  async function handleSaveAccess(venueAccessId: Id<'venueAccess'>) {
    setAccessSaving((prev) => ({ ...prev, [venueAccessId]: true }))
    setAccessMessage((prev) => ({ ...prev, [venueAccessId]: null }))

    const selected = getModulesForEmployee(venueAccessId)
    const allowedModules = selected.size === ALL_MODULES.length
      ? undefined
      : Array.from(selected)

    try {
      await updateAccess({ venueAccessId, allowedModules })
      setAccessMessage((prev) => ({ ...prev, [venueAccessId]: 'Acceso actualizado.' }))
    } catch (err: unknown) {
      const convexMessage = (err as { data?: string })?.data
      if (convexMessage === 'forbidden') {
        setAccessMessage((prev) => ({ ...prev, [venueAccessId]: 'No tenés permiso para modificar este acceso.' }))
      } else {
        setAccessMessage((prev) => ({ ...prev, [venueAccessId]: 'Error al guardar. Intentá de nuevo.' }))
      }
    } finally {
      setAccessSaving((prev) => ({ ...prev, [venueAccessId]: false }))
    }
  }

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
      } else if (convexMessage === 'plan_limit_employees') {
        setMessage('Límite de empleados alcanzado. Actualizá tu plan.')
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
    fontSize:      12,
    fontWeight:    500,
    color:         t.textoMuted.val,
    letterSpacing: '0.02em',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

      {/* ── Invite form ─────────────────────────────────────────────────────── */}
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

      {/* ── Employee access management ───────────────────────────────────────── */}
      {employees && employees.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ height: 1, backgroundColor: t.divisor.val }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} strokeWidth={2} />
            <span style={{ fontSize: 13, fontWeight: 600, color: t.textoNav.val }}>
              Acceso de empleados
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {employees.map((emp) => {
              const selected = getModulesForEmployee(emp.venueAccessId)
              const saving   = accessSaving[emp.venueAccessId] ?? false
              const msg      = accessMessage[emp.venueAccessId] ?? null

              return (
                <div
                  key={emp.venueAccessId}
                  style={{
                    padding:         16,
                    borderRadius:    8,
                    border:          `1px solid ${t.bordeNeutral.val}`,
                    backgroundColor: t.superficieContenido.val,
                    display:         'flex',
                    flexDirection:   'column',
                    gap:             12,
                    maxWidth:        480,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: t.textoPrimario.val }}>
                      {emp.inviteeName || emp.inviteeEmail}
                    </span>
                    <span style={{ fontSize: 11, color: t.textoMuted.val }}>
                      {emp.venueName} · {emp.status === 'pending' ? 'Pendiente' : 'Activo'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ ...labelStyle, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Módulos habilitados
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {ALL_MODULES.map((mod) => {
                        const checked = selected.has(mod)
                        return (
                          <label
                            key={mod}
                            style={{
                              display:      'flex',
                              alignItems:   'center',
                              gap:          6,
                              cursor:       'pointer',
                              userSelect:   'none',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleModule(emp.venueAccessId, mod)}
                              style={{ cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: 12, color: t.textoPrimario.val }}>
                              {MODULE_LABELS[mod]}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {msg && (
                    <p style={{
                      fontSize: 12,
                      margin:   0,
                      color:    msg === 'Acceso actualizado.' ? t.verdeCancha.val : 'oklch(65% 0.19 25)',
                    }}>
                      {msg}
                    </p>
                  )}

                  <button
                    onClick={() => handleSaveAccess(emp.venueAccessId as Id<'venueAccess'>)}
                    disabled={saving}
                    style={{
                      padding:         '7px 16px',
                      backgroundColor: saving ? 'oklch(35% 0.10 155)' : t.verdeCancha.val,
                      color:           'white',
                      border:          'none',
                      borderRadius:    6,
                      fontSize:        12,
                      fontWeight:      500,
                      cursor:          saving ? 'default' : 'pointer',
                      fontFamily:      'inherit',
                      alignSelf:       'flex-start',
                    }}
                  >
                    {saving ? 'Guardando...' : 'Guardar acceso'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
