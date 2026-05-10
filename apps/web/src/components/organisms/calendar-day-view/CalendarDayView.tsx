'use client'

import { useRef, useEffect, useState, Fragment } from 'react'
import { useTheme } from 'tamagui'
import { Plus } from 'lucide-react'

import { ReservationCard }      from '@/components/atoms/reservation-card'
import { ReservationSlideOver } from '@/components/organisms/reservation-slide-over'
import type { CalendarReservation, Court } from '@/components/atoms/reservation-card'

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_START          = 9     // 09:00
const DAY_END            = 24    // 00:00 midnight
const SLOT_MINUTES       = 30
const SLOT_HEIGHT        = 40    // px per 30-min slot
const COURT_HEADER_HEIGHT = 44   // px
const TIME_AXIS_WIDTH    = 64    // px

const TOTAL_SLOTS = (DAY_END - DAY_START) * 2  // 30 slots

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeToRowStart(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return 2 + (h - DAY_START) * 2 + Math.floor(m / SLOT_MINUTES)
}

function generateTimeLabels(): string[] {
  const labels: string[] = []
  for (let h = DAY_START; h < DAY_END; h++) {
    labels.push(`${String(h).padStart(2, '0')}:00`)
    labels.push(`${String(h).padStart(2, '0')}:30`)
  }
  return labels
}

const TIME_LABELS = generateTimeLabels()

// ─── Props ────────────────────────────────────────────────────────────────────

interface CalendarDayViewProps {
  courts:       Court[]
  reservations: CalendarReservation[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CalendarDayView({ courts, reservations }: CalendarDayViewProps) {
  const t = useTheme()

  const scrollRef = useRef<HTMLDivElement>(null)

  const [now,         setNow]         = useState(() => new Date())
  const [selected,    setSelected]    = useState<CalendarReservation | null>(null)
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)

  // Tick every minute for the time indicator
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Auto-scroll to current time on mount
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const minutesFromStart = (now.getHours() - DAY_START) * 60 + now.getMinutes()
    if (minutesFromStart < 0) return
    const pixelFromSlotStart = (minutesFromStart / SLOT_MINUTES) * SLOT_HEIGHT
    const visibleSlotHeight  = el.clientHeight - COURT_HEADER_HEIGHT
    el.scrollTop = Math.max(0, pixelFromSlotStart - visibleSlotHeight * 0.25)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Current time line ───────────────────────────────────────────────────────
  const nowH = now.getHours()
  const nowM = now.getMinutes()
  const withinDay   = nowH >= DAY_START && nowH < DAY_END
  const nowSlotIdx  = withinDay ? Math.floor(((nowH - DAY_START) * 60 + nowM) / SLOT_MINUTES) : -1
  const nowFraction = withinDay ? ((nowH - DAY_START) * 60 + nowM) % SLOT_MINUTES / SLOT_MINUTES : 0
  const nowGridRow  = withinDay ? 2 + nowSlotIdx : -1
  const nowMarginTop = nowFraction * SLOT_HEIGHT

  // ── Grid template strings ───────────────────────────────────────────────────
  const gridCols = `${TIME_AXIS_WIDTH}px repeat(${courts.length}, minmax(180px, 1fr))`
  const gridRows = `${COURT_HEADER_HEIGHT}px repeat(${TOTAL_SLOTS}, ${SLOT_HEIGHT}px)`

  // ── Token shortcuts ─────────────────────────────────────────────────────────
  const C = {
    bg:         t.superficieContenido.val,
    surface:    t.superficie.val,
    border:     t.bordeNeutral.val,
    divider:    t.divisor.val,
    hover:      t.fondoHover.val,
    textPrimary: t.textoPrimario.val,
    textMuted:  t.textoMuted.val,
    textInact:  t.textoInactivo.val,
    textNav:    t.textoNav.val,
    green:      t.verdeCancha.val,
    greenDeep:  t.verdeCanchaProfundo.val,
    greenBg:    t.verdeCanchaActivo.val,
    headerBg:   t.cabeceraOscura.val,
  } as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Scroll container ─────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflow: 'auto', backgroundColor: C.bg }}
      >
        {/* ── CSS Grid ──────────────────────────────────────────────────────── */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: gridCols,
            gridTemplateRows:    gridRows,
            minHeight:           '100%',
          }}
        >

          {/* ── Corner cell ─────────────────────────────────────────────────── */}
          <div style={{
            gridRow:         1,
            gridColumn:      1,
            position:        'sticky',
            top:             0,
            left:            0,
            zIndex:          15,
            backgroundColor: C.bg,
            borderRight:     `1px solid ${C.border}`,
            borderBottom:    `1px solid ${C.border}`,
          }} />

          {/* ── Court header cells ──────────────────────────────────────────── */}
          {courts.map((court, colIdx) => (
            <div
              key={`hdr-${court.id}`}
              style={{
                gridRow:         1,
                gridColumn:      colIdx + 2,
                position:        'sticky',
                top:             0,
                zIndex:          10,
                backgroundColor: C.bg,
                borderBottom:    `1px solid ${C.border}`,
                borderRight:     colIdx < courts.length - 1 ? `1px solid ${C.divider}` : 'none',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                padding:         '0 12px',
              }}
            >
              <span style={{
                fontSize:      12,
                fontWeight:    600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color:         C.textInact,
                lineHeight:    1,
                userSelect:    'none',
              }}>
                {court.name}
              </span>
            </div>
          ))}

          {/* ── Time labels + slot rows ──────────────────────────────────────── */}
          {TIME_LABELS.map((label, rowIdx) => {
            const showHour = label.endsWith(':00')
            const gridRow  = rowIdx + 2

            return (
              <Fragment key={rowIdx}>
                {/* Time label cell */}
                <div
                  style={{
                    gridRow,
                    gridColumn:      1,
                    position:        'sticky',
                    left:            0,
                    zIndex:          5,
                    backgroundColor: C.bg,
                    borderRight:     `1px solid ${C.border}`,
                    borderBottom:    `1px solid ${C.divider}`,
                    display:         'flex',
                    alignItems:      'flex-start',
                    justifyContent:  'flex-end',
                    paddingRight:    10,
                    paddingTop:      7,
                    userSelect:      'none',
                  }}
                >
                  {showHour && (
                    <span style={{
                      fontSize:        11,
                      fontWeight:      500,
                      color:           C.textInact,
                      lineHeight:      1,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {label}
                    </span>
                  )}
                </div>

                {/* Slot cells for each court */}
                {courts.map((court, colIdx) => {
                  const slotKey = `${rowIdx}-${colIdx}`
                  const isHovered = hoveredSlot === slotKey

                  return (
                    <div
                      key={`slot-${rowIdx}-${colIdx}`}
                      onMouseEnter={() => setHoveredSlot(slotKey)}
                      onMouseLeave={() => setHoveredSlot(null)}
                      onClick={() => {
                        // Future: open new reservation form for this slot + court
                      }}
                      style={{
                        gridRow,
                        gridColumn:      colIdx + 2,
                        borderRight:     colIdx < courts.length - 1 ? `1px solid ${C.divider}` : 'none',
                        borderBottom:    `1px solid ${showHour ? C.border : C.divider}`,
                        position:        'relative',
                        backgroundColor: isHovered ? C.hover : 'transparent',
                        transition:      'background-color 80ms ease-out',
                        cursor:          isHovered ? 'pointer' : 'default',
                      }}
                    >
                      {isHovered && (
                        <SlotAddHint color={C.textInact} />
                      )}
                    </div>
                  )
                })}
              </Fragment>
            )
          })}

          {/* ── Reservation cards ────────────────────────────────────────────── */}
          {reservations.map((res) => {
            const courtIdx   = courts.findIndex((c) => c.id === res.courtId)
            if (courtIdx === -1) return null

            const rowStart   = timeToRowStart(res.startTime)
            const rowEnd     = timeToRowStart(res.endTime)
            const slotCount  = rowEnd - rowStart

            return (
              <div
                key={res.id}
                style={{
                  gridRow:    `${rowStart} / ${rowEnd}`,
                  gridColumn: courtIdx + 2,
                  position:   'relative',
                  zIndex:     2,
                }}
              >
                <ReservationCard
                  reservation={res}
                  slotHeight={SLOT_HEIGHT}
                  slotCount={slotCount}
                  now={now}
                  onClick={() => setSelected(res)}
                />
              </div>
            )
          })}

          {/* ── Current time indicator ───────────────────────────────────────── */}
          {withinDay && courts.length > 0 && (
            <div
              aria-hidden="true"
              style={{
                gridRow:       nowGridRow,
                gridColumn:    `2 / -1`,
                alignSelf:     'start',
                marginTop:     nowMarginTop,
                height:        2,
                backgroundColor: C.green,
                opacity:       0.8,
                zIndex:        3,
                pointerEvents: 'none',
                position:      'relative',
              }}
            >
              {/* Dot on the left edge */}
              <div style={{
                position:        'absolute',
                left:            -4,
                top:             -3,
                width:           8,
                height:          8,
                borderRadius:    '50%',
                backgroundColor: C.green,
              }} />
            </div>
          )}

        </div>
      </div>

      {/* ── Slide-over ────────────────────────────────────────────────────────── */}
      <ReservationSlideOver
        reservation={selected}
        courts={courts}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}

// ─── Slot add hint ────────────────────────────────────────────────────────────

function SlotAddHint({ color }: { color: string }) {
  return (
    <div style={{
      position:       'absolute',
      inset:          0,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            4,
      pointerEvents:  'none',
    }}>
      <Plus size={13} strokeWidth={2.5} color={color} />
      <span style={{
        fontSize:   11,
        fontWeight: 500,
        color,
        lineHeight: 1,
        userSelect: 'none',
      }}>
        Agregar
      </span>
    </div>
  )
}
