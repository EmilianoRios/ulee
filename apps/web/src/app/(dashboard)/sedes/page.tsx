'use client'

import { useState } from 'react'
import { Plus, Pencil, MapPin, Phone, Mail } from 'lucide-react'
import { useTheme } from 'tamagui'
import { useQuery, useConvexAuth } from 'convex/react'
import { api } from '@canchero/backend'
import type { Doc, Id } from '@canchero/backend'
import { VenueSlideOver } from '@/components/organisms/venue-slide-over/VenueSlideOver'
import { ModuleLayout } from '@/components/templates/module-layout'
import { useActiveVenue } from '@/context/active-venue'


// ─── Venue row ────────────────────────────────────────────────────────────────

interface VenueRowProps {
  venue:    Doc<'venues'>
  isActive: boolean
  onSelect: (id: Id<'venues'>) => void
  onEdit:   (venue: Doc<'venues'>) => void
  t:        ReturnType<typeof useTheme>
}

function VenueRow({ venue, isActive, onSelect, onEdit, t }: VenueRowProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={() => onSelect(venue._id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:         'flex',
        alignItems:      'center',
        gap:             16,
        padding:         '14px 20px',
        borderRadius:    10,
        border:          `1.5px solid ${isActive ? t.verdeCancha.val : hovered ? t.bordeNeutral.val : t.divisor.val}`,
        backgroundColor: isActive
          ? `${t.verdeCancha.val}0d`
          : hovered
          ? t.fondoHover.val
          : 'transparent',
        cursor:          'pointer',
        transition:      'border-color 150ms ease-out, background-color 150ms ease-out',
        outline:         isActive ? `2px solid ${t.verdeCancha.val}20` : 'none',
        outlineOffset:   2,
        position:        'relative',
      }}
    >
      {/* Icon */}
      <div style={{
        width:           40,
        height:          40,
        borderRadius:    9,
        backgroundColor: isActive ? `${t.verdeCancha.val}18` : t.superficie.val,
        border:          `1px solid ${isActive ? t.verdeCancha.val + '30' : t.divisor.val}`,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        flexShrink:      0,
        transition:      'background-color 150ms ease-out',
      }}>
        <MapPin
          size={16}
          strokeWidth={2}
          color={isActive ? t.verdeCancha.val : t.textoMuted.val}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        8,
          marginBottom: 4,
        }}>
          <span style={{
            fontSize:      14,
            fontWeight:    600,
            color:         t.textoPrimario.val,
            letterSpacing: '-0.01em',
            lineHeight:    1.2,
            overflow:      'hidden',
            textOverflow:  'ellipsis',
            whiteSpace:    'nowrap',
          }}>
            {venue.name}
          </span>
          {isActive && (
            <span style={{
              fontSize:        10,
              fontWeight:      600,
              letterSpacing:   '0.06em',
              textTransform:   'uppercase',
              color:           t.verdeCancha.val,
              backgroundColor: `${t.verdeCancha.val}18`,
              padding:         '2px 7px',
              borderRadius:    4,
              lineHeight:      1.6,
              flexShrink:      0,
            }}>
              Activa
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={10} strokeWidth={2} color={t.textoMuted.val} />
            <span style={{ fontSize: 12, color: t.textoMuted.val, lineHeight: 1 }}>
              {venue.address}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Phone size={10} strokeWidth={2} color={t.textoMuted.val} />
            <span style={{ fontSize: 12, color: t.textoMuted.val, lineHeight: 1 }}>
              {venue.phone}
            </span>
          </div>
          {venue.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Mail size={10} strokeWidth={2} color={t.textoMuted.val} />
              <span style={{ fontSize: 12, color: t.textoMuted.val, lineHeight: 1 }}>
                {venue.email}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Edit button */}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(venue) }}
        aria-label={`Editar ${venue.name}`}
        style={{
          width:           32,
          height:          32,
          borderRadius:    7,
          border:          `1px solid ${t.divisor.val}`,
          backgroundColor: hovered ? t.superficie.val : 'transparent',
          cursor:          'pointer',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          color:           t.textoMuted.val,
          flexShrink:      0,
          fontFamily:      'inherit',
          transition:      'background-color 150ms ease-out, border-color 150ms ease-out, color 150ms ease-out',
          opacity:         hovered ? 1 : 0.4,
        }}
        onMouseEnter={(e) => {
          const btn = e.currentTarget as HTMLButtonElement
          btn.style.backgroundColor = t.verdeCanchaActivo.val
          btn.style.borderColor     = t.verdeCancha.val
          btn.style.color           = t.verdeCanchaProfundo.val
          btn.style.opacity         = '1'
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget as HTMLButtonElement
          btn.style.backgroundColor = hovered ? t.superficie.val : 'transparent'
          btn.style.borderColor     = t.divisor.val
          btn.style.color           = t.textoMuted.val
          btn.style.opacity         = hovered ? '1' : '0.4'
        }}
      >
        <Pencil size={13} strokeWidth={2} />
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SedesPage() {
  const t = useTheme()
  const { activeVenueId, setActiveVenueId } = useActiveVenue()

  const { isAuthenticated } = useConvexAuth()
  const venues = useQuery(api.functions.venues.queries.listByOwner, isAuthenticated ? {} : 'skip')

  const [editingVenue, setEditingVenue] = useState<Doc<'venues'> | null>(null)
  const [creating,     setCreating]     = useState(false)

  const isOpen   = creating || editingVenue !== null
  const slideVenue = editingVenue ?? null

  function openCreate()                  { setEditingVenue(null); setCreating(true) }
  function openEdit(v: Doc<'venues'>)    { setCreating(false); setEditingVenue(v) }
  function handleClose()                 { setCreating(false); setEditingVenue(null) }
  function handleCreated(id: Id<'venues'>) { setActiveVenueId(id) }

  // ── Strip ──────────────────────────────────────────────────────────────────

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
          Sedes
        </span>

        <button
          onClick={openCreate}
          style={{
            display:         'flex',
            alignItems:      'center',
            gap:             6,
            padding:         '6px 14px',
            borderRadius:    7,
            border:          'none',
            backgroundColor: t.verdeCancha.val,
            color:           'oklch(98% 0.004 155)',
            fontSize:        12,
            fontWeight:      500,
            cursor:          'pointer',
            lineHeight:      1,
            fontFamily:      'inherit',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.verdeCanchaProfundo.val }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.verdeCancha.val }}
        >
          <Plus size={13} strokeWidth={2.5} />
          Nueva sede
        </button>
      </div>

      <div style={{
        height:       52,
        display:      'flex',
        alignItems:   'center',
        padding:      '0 32px',
        borderBottom: `1px solid ${t.divisor.val}`,
        gap:          6,
      }}>
        {venues !== undefined && (
          <>
            <span style={{
              fontSize:           20,
              fontWeight:         700,
              color:              t.textoPrimario.val,
              lineHeight:         1,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing:      '-0.01em',
            }}>
              {venues.length}
            </span>
            <span style={{ fontSize: 11, color: t.textoMuted.val, lineHeight: 1 }}>
              {venues.length === 1 ? 'sede registrada' : 'sedes registradas'}
            </span>
          </>
        )}
      </div>
    </>
  )

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
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

          {/* Empty / no venues */}
          {!venues?.length && (
            <div style={{
              flex:           1,
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            0,
              padding:        '60px 32px',
            }}>
              {/* Icon container */}
              <div style={{
                width:           64,
                height:          64,
                borderRadius:    16,
                backgroundColor: `${t.verdeCancha.val}14`,
                border:          `1.5px solid ${t.verdeCancha.val}28`,
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                marginBottom:    20,
              }}>
                <MapPin size={28} strokeWidth={1.8} color={t.verdeCancha.val} />
              </div>

              {/* Title */}
              <span style={{
                fontSize:      17,
                fontWeight:    600,
                color:         t.textoPrimario.val,
                letterSpacing: '-0.01em',
                lineHeight:    1.3,
                marginBottom:  8,
                textAlign:     'center',
              }}>
                No tenés ninguna sede registrada
              </span>

              {/* Description */}
              <span style={{
                fontSize:     13,
                color:        t.textoMuted.val,
                lineHeight:   1.6,
                textAlign:    'center',
                maxWidth:     340,
                marginBottom: 28,
              }}>
                Las sedes son los espacios donde se ubican tus canchas. Creá la primera para empezar a gestionar reservas.
              </span>

              {/* CTA */}
              <button
                onClick={openCreate}
                style={{
                  display:         'flex',
                  alignItems:      'center',
                  gap:             6,
                  padding:         '10px 20px',
                  borderRadius:    8,
                  border:          'none',
                  backgroundColor: t.verdeCancha.val,
                  color:           'oklch(98% 0.004 155)',
                  fontSize:        13,
                  fontWeight:      500,
                  cursor:          'pointer',
                  fontFamily:      'inherit',
                  letterSpacing:   '-0.01em',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.verdeCanchaProfundo.val }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.verdeCancha.val }}
              >
                <Plus size={14} strokeWidth={2.5} />
                Crear primera sede
              </button>
            </div>
          )}

          {/* Venue list */}
          {venues !== undefined && venues.length > 0 && venues.map((venue) => (
            <VenueRow
              key={venue._id}
              venue={venue}
              isActive={activeVenueId === venue._id}
              onSelect={setActiveVenueId}
              onEdit={openEdit}
              t={t}
            />
          ))}
        </div>
      </ModuleLayout>

      <VenueSlideOver
        venue={slideVenue}
        isOpen={isOpen}
        onClose={handleClose}
        onCreated={handleCreated}
      />
    </>
  )
}
