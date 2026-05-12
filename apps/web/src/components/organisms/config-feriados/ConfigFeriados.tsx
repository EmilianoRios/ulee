'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'tamagui'
import { ChevronLeft, ChevronRight, X, AlertTriangle } from 'lucide-react'

interface Feriado {
  id:     string
  fecha:  string
  motivo: string
}

interface Props {
  formId:        string
  onDirtyChange: (dirty: boolean) => void
  onSaved:       () => void
}

const INITIAL_FERIADOS: Feriado[] = [
  { id: '1', fecha: '2026-05-25', motivo: 'Día del Ejército' },
  { id: '2', fecha: '2026-06-20', motivo: 'Paso a la Inmortalidad del Gral. Belgrano' },
  { id: '3', fecha: '2026-07-09', motivo: 'Día de la Independencia' },
]

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DIAS  = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function padDate(n: number) { return String(n).padStart(2, '0') }
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${padDate(m + 1)}-${padDate(d)}`
}
function formatDisplay(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${padDate(d)}/${padDate(m)}/${y}`
}
function mockReservationCount(dateStr: string) {
  const dow = new Date(dateStr).getDay()
  if (dow === 6) return 3
  if (dow === 0) return 5
  return 0
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, description, children }: {
  title:        string
  description?: string
  children:     React.ReactNode
}) {
  const t = useTheme()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: t.textoNav.val, lineHeight: 1.3 }}>
          {title}
        </span>
        {description && (
          <span style={{ fontSize: 12, color: t.textoMuted.val, lineHeight: 1.5 }}>
            {description}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function MiniCalendar({ year, month, closedDates, selectedDate, onSelect, onPrev, onNext }: {
  year:        number
  month:       number
  closedDates: string[]
  selectedDate: string | null
  onSelect:    (date: string) => void
  onPrev:      () => void
  onNext:      () => void
}) {
  const t = useTheme()
  const today = new Date()

  const firstDayDow  = new Date(year, month, 1).getDay()
  const leadingCells = (firstDayDow + 6) % 7  // Mon=0 offset
  const daysInMonth  = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(leadingCells).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null)

  function isPast(day: number) {
    const cellDate = new Date(year, month, day)
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return cellDate < todayMidnight
  }

  function isToday(day: number) {
    return year === today.getFullYear() && month === today.getMonth() && day === today.getDate()
  }

  const cellSize = 34

  return (
    <div style={{
      backgroundColor: t.superficieContenido.val,
      border:          `1px solid ${t.bordeNeutral.val}`,
      borderRadius:    10,
      padding:         '14px 12px 12px',
      width:           'fit-content',
    }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 2px' }}>
        <button
          type="button"
          onClick={onPrev}
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
            transition:      'background-color 120ms ease-out',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = t.fondoHover.val }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          <ChevronLeft size={14} strokeWidth={2} />
        </button>

        <span style={{ fontSize: 13, fontWeight: 600, color: t.textoPrimario.val, userSelect: 'none' }}>
          {MESES[month]} {year}
        </span>

        <button
          type="button"
          onClick={onNext}
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
            transition:      'background-color 120ms ease-out',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = t.fondoHover.val }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          <ChevronRight size={14} strokeWidth={2} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, ${cellSize}px)`, marginBottom: 4 }}>
        {DIAS.map(d => (
          <div key={d} style={{
            height:     cellSize,
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize:   11,
            fontWeight: 500,
            color:      t.textoMuted.val,
            userSelect: 'none',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, ${cellSize}px)`, gap: 0 }}>
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} />

          const dateStr   = toDateStr(year, month, day)
          const past      = isPast(day)
          const today_    = isToday(day)
          const selected  = selectedDate === dateStr
          const closed    = closedDates.includes(dateStr)

          return (
            <button
              key={dateStr}
              type="button"
              disabled={past}
              onClick={() => !past && onSelect(dateStr)}
              style={{
                width:           cellSize,
                height:          cellSize,
                borderRadius:    '50%',
                border:          today_ && !selected ? `1.5px solid ${t.verdeCancha.val}` : 'none',
                backgroundColor: selected ? t.verdeCancha.val : 'transparent',
                color:           selected
                  ? 'oklch(98% 0.004 155)'
                  : past
                    ? t.textoInactivo.val
                    : t.textoPrimario.val,
                fontSize:        12,
                fontFamily:      'inherit',
                cursor:          past ? 'default' : 'pointer',
                position:        'relative',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                fontWeight:      selected ? 600 : today_ ? 500 : 400,
                transition:      'background-color 120ms ease-out',
              }}
              onMouseEnter={(e) => {
                if (past || selected) return
                e.currentTarget.style.backgroundColor = t.verdeCanchaActivo.val
              }}
              onMouseLeave={(e) => {
                if (past || selected) return
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {day}
              {closed && !selected && (
                <span style={{
                  position:        'absolute',
                  bottom:          3,
                  left:            '50%',
                  transform:       'translateX(-50%)',
                  width:           4,
                  height:          4,
                  borderRadius:    '50%',
                  backgroundColor: t.acentoTerraza.val,
                  pointerEvents:   'none',
                }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ConfigFeriados({ formId, onDirtyChange, onSaved }: Props) {
  const t = useTheme()

  const today = new Date()
  const [calYear,      setCalYear]      = useState(today.getFullYear())
  const [calMonth,     setCalMonth]     = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [motivo,       setMotivo]       = useState('')
  const [feriados,     setFeriados]     = useState<Feriado[]>(INITIAL_FERIADOS)
  const [confirm,      setConfirm]      = useState<{ fecha: string; count: number } | null>(null)

  const closedDates = feriados.map(f => f.fecha)

  useEffect(() => {
    onDirtyChange(JSON.stringify(feriados) !== JSON.stringify(INITIAL_FERIADOS))
  }, [feriados, onDirtyChange])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSaved()
  }

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }

  function addFeriado(fecha: string) {
    if (!fecha || !motivo.trim()) return
    if (closedDates.includes(fecha)) return
    setFeriados(fs => [...fs, { id: Date.now().toString(), fecha, motivo: motivo.trim() }])
    setMotivo('')
    setSelectedDate(null)
    setConfirm(null)
  }

  function handleAgregar() {
    if (!selectedDate || !motivo.trim()) return
    const reservas = mockReservationCount(selectedDate)
    if (reservas > 0) {
      setConfirm({ fecha: selectedDate, count: reservas })
    } else {
      addFeriado(selectedDate)
    }
  }

  function removeFeriado(id: string) {
    setFeriados(fs => fs.filter(f => f.id !== id))
  }

  const inputBase: React.CSSProperties = {
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
    transition:      'border-color 150ms ease-out',
  }

  const formattedDate = selectedDate ? formatDisplay(selectedDate) : ''

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 32 }}
    >
      {/* ── Agregar día cerrado ── */}
      <Section
        title="Agregar día cerrado"
        description="Seleccioná una fecha en el calendario y agregá el motivo."
      >
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <MiniCalendar
            year={calYear}
            month={calMonth}
            closedDates={closedDates}
            selectedDate={selectedDate}
            onSelect={(date) => { setSelectedDate(date); setConfirm(null) }}
            onPrev={prevMonth}
            onNext={nextMonth}
          />

          {/* Add form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, minWidth: 200, paddingTop: 2 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: t.textoMuted.val, letterSpacing: '0.02em', lineHeight: 1 }}>
                Fecha seleccionada
              </label>
              <div style={{
                padding:         '9px 12px',
                borderRadius:    7,
                border:          `1px solid ${t.bordeNeutral.val}`,
                backgroundColor: t.superficie.val,
                color:           formattedDate ? t.textoPrimario.val : t.textoInactivo.val,
                fontSize:        13,
                lineHeight:      1,
                userSelect:      'none',
              }}>
                {formattedDate || 'Ninguna seleccionada'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: t.textoMuted.val, letterSpacing: '0.02em', lineHeight: 1 }}>
                Motivo
              </label>
              <input
                type="text"
                value={motivo}
                placeholder="ej. Feriado Nacional, Mantenimiento…"
                onChange={(e) => setMotivo(e.target.value)}
                style={inputBase}
                onFocus={(e) => { e.currentTarget.style.borderColor = t.verdeCancha.val }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = t.bordeNeutral.val }}
              />
            </div>

            {/* Reservation warning */}
            {confirm && (
              <div style={{
                padding:         '12px 14px',
                borderRadius:    7,
                border:          `1px solid oklch(80% 0.06 55)`,
                backgroundColor: 'oklch(97% 0.015 55)',
                display:         'flex',
                flexDirection:   'column',
                gap:             10,
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <AlertTriangle size={14} strokeWidth={2} style={{ color: 'oklch(55% 0.12 55)', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 12, color: 'oklch(35% 0.08 55)', lineHeight: 1.5 }}>
                    Hay <strong>{confirm.count} reservas</strong> el {formatDisplay(confirm.fecha)}. Si cerrás este día, quedan sin atención.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setConfirm(null)}
                    style={{
                      flex:            1,
                      padding:         '7px 10px',
                      borderRadius:    6,
                      border:          `1px solid ${t.bordeNeutral.val}`,
                      backgroundColor: 'transparent',
                      color:           t.textoPrimario.val,
                      fontSize:        12,
                      fontFamily:      'inherit',
                      cursor:          'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => addFeriado(confirm.fecha)}
                    style={{
                      flex:            1,
                      padding:         '7px 10px',
                      borderRadius:    6,
                      border:          'none',
                      backgroundColor: 'oklch(55% 0.12 55)',
                      color:           'oklch(98% 0.005 55)',
                      fontSize:        12,
                      fontFamily:      'inherit',
                      cursor:          'pointer',
                    }}
                  >
                    Agregar igual
                  </button>
                </div>
              </div>
            )}

            {!confirm && (
              <button
                type="button"
                disabled={!selectedDate || !motivo.trim() || closedDates.includes(selectedDate ?? '')}
                onClick={handleAgregar}
                style={{
                  padding:         '9px 16px',
                  borderRadius:    7,
                  border:          'none',
                  backgroundColor: selectedDate && motivo.trim() ? t.verdeCancha.val : t.bordeNeutral.val,
                  color:           selectedDate && motivo.trim() ? 'oklch(98% 0.004 155)' : t.textoInactivo.val,
                  fontSize:        13,
                  fontWeight:      500,
                  fontFamily:      'inherit',
                  cursor:          selectedDate && motivo.trim() ? 'pointer' : 'default',
                  transition:      'background-color 150ms ease-out',
                  alignSelf:       'flex-start',
                }}
                onMouseEnter={(e) => {
                  if (!selectedDate || !motivo.trim()) return
                  e.currentTarget.style.backgroundColor = t.verdeCanchaProfundo.val
                }}
                onMouseLeave={(e) => {
                  if (!selectedDate || !motivo.trim()) return
                  e.currentTarget.style.backgroundColor = t.verdeCancha.val
                }}
              >
                Agregar
              </button>
            )}
          </div>
        </div>
      </Section>

      <div style={{ height: 1, backgroundColor: t.divisor.val }} />

      {/* ── Lista de días cerrados ── */}
      <Section title="Días cerrados">
        {feriados.length === 0 ? (
          <p style={{
            fontSize:   13,
            color:      t.textoMuted.val,
            lineHeight: 1.5,
            margin:     0,
            padding:    '16px 0',
          }}>
            No hay días cerrados cargados todavía.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Table header */}
            <div style={{
              display:             'grid',
              gridTemplateColumns: '120px 1fr 36px',
              gap:                 12,
              padding:             '0 0 8px',
              borderBottom:        `1px solid ${t.divisor.val}`,
            }}>
              {['Fecha', 'Motivo'].map(h => (
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
            </div>

            {/* Rows */}
            {feriados
              .slice()
              .sort((a, b) => a.fecha.localeCompare(b.fecha))
              .map((f, i, arr) => (
                <div
                  key={f.id}
                  style={{
                    display:             'grid',
                    gridTemplateColumns: '120px 1fr 36px',
                    gap:                 12,
                    alignItems:          'center',
                    padding:             '10px 0',
                    borderBottom:        i < arr.length - 1 ? `1px solid ${t.divisor.val}` : 'none',
                  }}
                >
                  <span style={{ fontSize: 13, color: t.textoMuted.val, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                    {formatDisplay(f.fecha)}
                  </span>
                  <span style={{ fontSize: 13, color: t.textoPrimario.val, lineHeight: 1.3 }}>
                    {f.motivo}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFeriado(f.id)}
                    aria-label={`Eliminar ${f.motivo}`}
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
                    <X size={13} strokeWidth={2} />
                  </button>
                </div>
              ))}
          </div>
        )}
      </Section>
    </form>
  )
}
