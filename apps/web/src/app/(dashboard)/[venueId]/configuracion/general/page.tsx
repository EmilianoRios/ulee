'use client'

import { useCallback, useState } from 'react'
import { Check } from 'lucide-react'
import { useTheme } from 'tamagui'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useConvexAuth } from 'convex/react'
import { api } from '@canchero/backend'
import type { Doc, Id } from '@canchero/backend'
import { ConfigGeneral } from '@/components/organisms/config-general'
import type { GeneralInitialData } from '@/components/organisms/config-general'

function venueToGeneralData(venue: Doc<'venues'>): GeneralInitialData {
  return {
    name:        venue.name,
    description: venue.description,
    address:     venue.address,
    phone:       venue.phone,
    email:       venue.email,
  }
}

const FORM_ID = 'config-form-general'

export default function ConfiguracionGeneralPage() {
  const t = useTheme()
  const params  = useParams()
  const venueId = params?.venueId as Id<'venues'> | undefined
  const { isAuthenticated } = useConvexAuth()

  const venue       = useQuery(api.functions.venues.queries.getById, isAuthenticated && venueId ? { venueId } : 'skip')
  const updateVenue = useMutation(api.functions.venues.mutations.update)

  const [isDirty,    setIsDirty]    = useState(false)
  const [justSaved,  setJustSaved]  = useState(false)

  const handleDirtyChange = useCallback((dirty: boolean) => setIsDirty(dirty), [])

  const handleSaved = useCallback(() => {
    setIsDirty(false)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2000)
  }, [])

  const handleSubmit = useCallback(async (data: GeneralInitialData) => {
    if (!venueId) return
    await updateVenue({
      venueId,
      name:        data.name,
      description: data.description,
      address:     data.address,
      phone:       data.phone,
      email:       data.email,
    })
  }, [venueId, updateVenue])

  return (
    <>
      <div style={{
        height:    '100%',
        overflowY: 'auto',
        padding:   '32px',
        boxSizing: 'border-box',
      }}>
        <div style={{ maxWidth: 640, width: '100%' }}>
          <ConfigGeneral
            formId={FORM_ID}
            onDirtyChange={handleDirtyChange}
            onSaved={handleSaved}
            initialData={venue ? venueToGeneralData(venue) : null}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

      {/* Sticky save footer */}
      <div
        style={{
          position:        'fixed',
          bottom:          0,
          left:            0,
          right:           0,
          zIndex:          50,
          opacity:         isDirty ? 1 : 0,
          transform:       isDirty ? 'translateY(0)' : 'translateY(100%)',
          transition:      'opacity 200ms ease-out, transform 200ms ease-out',
          pointerEvents:   isDirty ? 'auto' : 'none',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'flex-end',
          padding:         '12px 32px',
          backgroundColor: t.cabeceraOscura.val,
          borderTop:       `1px solid oklch(30% 0.008 228)`,
        }}
      >
        <button
          form={FORM_ID}
          type="submit"
          style={{
            display:         'flex',
            alignItems:      'center',
            gap:             6,
            padding:         '6px 14px',
            borderRadius:    7,
            border:          'none',
            backgroundColor: justSaved ? 'oklch(45% 0.14 155)' : t.verdeCancha.val,
            color:           'oklch(98% 0.004 155)',
            fontSize:        12,
            fontWeight:      500,
            cursor:          'pointer',
            lineHeight:      1,
            fontFamily:      'inherit',
            transition:      'background-color 200ms ease-out',
          }}
          onMouseEnter={(e) => { if (!justSaved) e.currentTarget.style.backgroundColor = t.verdeCanchaProfundo.val }}
          onMouseLeave={(e) => { if (!justSaved) e.currentTarget.style.backgroundColor = t.verdeCancha.val }}
        >
          {justSaved && <Check size={12} strokeWidth={2.5} />}
          {justSaved ? 'Guardado' : 'Guardar cambios'}
        </button>
      </div>
    </>
  )
}
