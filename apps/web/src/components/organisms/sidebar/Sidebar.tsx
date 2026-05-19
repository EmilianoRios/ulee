'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarCheck,
  CalendarDays,
  LayoutGrid,
  Users,
  Wallet,
  BarChart3,
  Building2,
  Settings,
  MapPin,
  ChevronDown,
  Check,
  type LucideIcon,
} from 'lucide-react'
import { useUser, UserButton } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '@canchero/backend'
import { useActiveVenue } from '@/context/active-venue'

// ─── Design tokens ────────────────────────────────────────────────────────────
function useC() {
  const t = useTheme()
  return {
    surface:      t.superficie.val,
    headerBg:     t.cabeceraOscura.val,
    headerText:   t.cabeceraTexto.val,
    headerSub:    t.cabeceraSub.val,
    headerIcon:   t.cabeceraIcono.val,
    green:        t.verdeCancha.val,
    greenDeep:    t.verdeCanchaProfundo.val,
    activeBg:     t.verdeCanchaActivo.val,
    activeText:   t.textoActivo.val,
    hoverBg:      t.fondoHover.val,
    border:       t.bordeNeutral.val,
    textPrimary:  t.textoPrimario.val,
    textMuted:    t.textoMuted.val,
    textInactive: t.textoInactivo.val,
    sectionLabel: t.etiquetaSeccion.val,
    divider:      t.divisor.val,
    handle:       t.manija.val,
    avatarBg:     t.verdeCanchaFondo.val,
    avatarText:   t.avatarTexto.val,
    tooltipBg:    t.tooltipFondo.val,
    proBadgeBg:   t.proBadgeFondo.val,
    proBadgeText: t.proBadgeTexto.val,
  } as const
}

const EXPANDED  = 260
const COLLAPSED = 56
const THRESHOLD = 160

// ─── Nav structure ────────────────────────────────────────────────────────────
interface NavItemDef {
  label:   string
  href:    string
  icon:    LucideIcon
  premium?: boolean
}

interface NavSection {
  label: string
  items: NavItemDef[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'OPERACIONES',
    items: [
      { label: 'Reservas',   href: '/reservas',   icon: CalendarCheck },
      { label: 'Calendario', href: '/calendario', icon: CalendarDays },
    ],
  },
  {
    label: 'GESTIÓN',
    items: [
      { label: 'Canchas',  href: '/canchas',  icon: LayoutGrid },
      { label: 'Clientes', href: '/clientes', icon: Users },
      { label: 'Finanzas', href: '/finanzas', icon: Wallet },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      { label: 'Estadísticas', href: '/estadisticas', icon: BarChart3, premium: true },
      { label: 'Sedes',        href: '/sedes',        icon: Building2 },
      { label: 'Configuración',href: '/configuracion',icon: Settings },
    ],
  },
]


// ─── Venue switcher ───────────────────────────────────────────────────────────

function VenueSwitcher({ collapsed }: { collapsed: boolean }) {
  const C        = useC()
  const venues   = useQuery(api.functions.venues.queries.listByOwner)
  const { activeVenueId, setActiveVenueId } = useActiveVenue()
  const [open, setOpen] = useState(false)

  const activeVenue = venues?.find((v) => v._id === activeVenueId)
  const hasMultiple = (venues?.length ?? 0) > 1

  if (!venues || venues.length === 0) return null

  const displayName = activeVenue?.name ?? 'Sin sede'

  if (collapsed) {
    return (
      <div style={{
        padding:        '8px 0',
        borderBottom:   `1px solid ${C.divider}`,
        display:        'flex',
        justifyContent: 'center',
        flexShrink:     0,
      }}>
        <div
          title={displayName}
          style={{
            width:           32,
            height:          32,
            borderRadius:    7,
            backgroundColor: C.activeBg,
            border:          `1px solid ${C.green}30`,
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            cursor:          'default',
          }}
        >
          <MapPin size={14} strokeWidth={2} color={C.green} />
        </div>
      </div>
    )
  }

  return (
    <div style={{
      borderBottom: `1px solid ${C.divider}`,
      flexShrink:   0,
    }}>
      {/* Trigger */}
      <button
        onClick={() => hasMultiple && setOpen((o) => !o)}
        style={{
          width:           '100%',
          display:         'flex',
          alignItems:      'center',
          gap:             8,
          padding:         '10px 14px',
          border:          'none',
          backgroundColor: 'transparent',
          cursor:          hasMultiple ? 'pointer' : 'default',
          fontFamily:      'inherit',
          transition:      'background-color 120ms ease-out',
        }}
        onMouseEnter={(e) => {
          if (hasMultiple) (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.hoverBg
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
        }}
      >
        <div style={{
          width:           28,
          height:          28,
          borderRadius:    6,
          backgroundColor: C.activeBg,
          border:          `1px solid ${C.green}28`,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          flexShrink:      0,
        }}>
          <MapPin size={13} strokeWidth={2} color={C.green} />
        </div>

        <div style={{
          flex:         1,
          minWidth:     0,
          textAlign:    'left',
          display:      'flex',
          flexDirection:'column',
          gap:          1,
        }}>
          <span style={{
            fontSize:     10,
            fontWeight:   500,
            letterSpacing:'0.06em',
            textTransform:'uppercase',
            color:        C.sectionLabel,
            lineHeight:   1,
            userSelect:   'none',
          }}>
            Sede activa
          </span>
          <span style={{
            fontSize:     13,
            fontWeight:   600,
            color:        C.textPrimary,
            lineHeight:   1.3,
            letterSpacing:'-0.01em',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
            userSelect:   'none',
          }}>
            {displayName}
          </span>
        </div>

        {hasMultiple && (
          <ChevronDown
            size={13}
            strokeWidth={2.2}
            color={C.textMuted}
            style={{
              flexShrink:  0,
              transform:   open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition:  'transform 160ms ease-out',
            }}
          />
        )}
      </button>

      {/* Dropdown */}
      {open && hasMultiple && (
        <div style={{
          borderTop:     `1px solid ${C.divider}`,
          paddingBottom: 4,
          paddingTop:    4,
        }}>
          {venues?.map((venue) => {
            const isActive = venue._id === activeVenueId
            return (
              <button
                key={venue._id}
                onClick={() => { setActiveVenueId(venue._id); setOpen(false) }}
                style={{
                  width:           '100%',
                  display:         'flex',
                  alignItems:      'center',
                  gap:             8,
                  padding:         '8px 14px',
                  border:          'none',
                  backgroundColor: 'transparent',
                  cursor:          'pointer',
                  fontFamily:      'inherit',
                  transition:      'background-color 120ms ease-out',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.hoverBg }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
              >
                <span style={{
                  flex:         1,
                  textAlign:    'left',
                  fontSize:     13,
                  fontWeight:   isActive ? 600 : 400,
                  color:        isActive ? C.textPrimary : C.textMuted,
                  lineHeight:   1.3,
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace:   'nowrap',
                }}>
                  {venue.name}
                </span>
                {isActive && (
                  <Check size={13} strokeWidth={2.5} color={C.green} style={{ flexShrink: 0 }} />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ label, visible, top, left }: { label: string; visible: boolean; top: number; left: number }) {
  const C = useC()
  return (
    <div
      role="tooltip"
      aria-hidden={!visible}
      style={{
        position:      'fixed',
        top,
        left,
        background:    C.tooltipBg,
        color:         '#fff',
        fontSize:      11,
        fontWeight:    600,
        letterSpacing: '0.02em',
        padding:       '5px 10px',
        borderRadius:  5,
        whiteSpace:    'nowrap',
        pointerEvents: 'none',
        opacity:       visible ? 1 : 0,
        transition:    'opacity 130ms ease-out',
        zIndex:        600,
      }}
    >
      {label}
    </div>
  )
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────
function NavItem({ href, label, icon: Icon, isActive, collapsed, premium }: {
  href: string; label: string; icon: LucideIcon
  isActive: boolean; collapsed: boolean; premium?: boolean
}) {
  const C = useC()
  const [hovered,     setHovered]     = useState(false)
  const [tooltipTop,  setTooltipTop]  = useState(0)
  const [tooltipLeft, setTooltipLeft] = useState(0)
  const itemRef = useRef<HTMLAnchorElement>(null)

  const handleMouseEnter = useCallback(() => {
    setHovered(true)
    if (collapsed && itemRef.current) {
      const r = itemRef.current.getBoundingClientRect()
      setTooltipTop(r.top + r.height / 2 - 11)
      setTooltipLeft(r.right + 8)
    }
  }, [collapsed])

  return (
    <div style={{ position: 'relative' }}>
      <Link
        href={href}
        ref={itemRef}
        style={{ textDecoration: 'none', display: 'block', borderRadius: 7, outline: 'none' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setHovered(false)}
        className="sidebar-nav-link"
      >
        <XStack
          height={40}
          px={collapsed ? 0 : 10}
          gap={9}
          items="center"
          borderRadius={7}
          justify={collapsed ? 'center' : 'flex-start'}
          style={{
            backgroundColor: isActive ? C.activeBg : hovered ? C.hoverBg : 'transparent',
            transition: 'background-color 110ms ease-out',
          }}
          cursor="pointer"
        >
          <Icon
            size={isActive ? 18 : 17}
            // @ts-expect-error — OKLCH strings are valid CSS colors
            color={isActive ? C.greenDeep : C.textInactive}
            strokeWidth={isActive ? 2.2 : 1.7}
            style={{ flexShrink: 0 }}
          />

          {!collapsed && (
            <XStack flex={1} items="center" justify="space-between">
              <Text
                fontSize={13}
                style={{
                  color:      isActive ? C.activeText : C.textMuted,
                  fontWeight: isActive ? '600' : '400',
                  letterSpacing: isActive ? '-0.1px' : '0px',
                  lineHeight: '1',
                }}
              >
                {label}
              </Text>
              {premium && (
                <span style={{
                  fontSize:        9,
                  fontWeight:      700,
                  letterSpacing:   '0.07em',
                  textTransform:   'uppercase',
                  backgroundColor: C.proBadgeBg,
                  color:           C.proBadgeText,
                  padding:         '2px 5px',
                  borderRadius:    3,
                  lineHeight:      '1.4',
                  flexShrink:      0,
                }}>
                  PRO
                </span>
              )}
            </XStack>
          )}
        </XStack>
      </Link>

      {collapsed && (
        <Tooltip label={label} visible={hovered} top={tooltipTop} left={tooltipLeft} />
      )}
    </div>
  )
}

// ─── Section divider ──────────────────────────────────────────────────────────
function SectionDivider() {
  const C = useC()
  return (
    <div aria-hidden="true" style={{ height: 1, backgroundColor: C.divider, margin: '0 4px' }} />
  )
}

// ─── User zone ────────────────────────────────────────────────────────────────
function UserZone({ collapsed }: { collapsed: boolean }) {
  const C = useC()
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <XStack
        px={collapsed ? 0 : 12}
        py={12}
        items="center"
        justify={collapsed ? 'center' : 'flex-start'}
        style={{ borderTop: `1px solid ${C.divider}`, flexShrink: 0, height: 56 }}
      />
    )
  }

  const displayName =
    user?.fullName ?? user?.username ?? user?.primaryEmailAddress?.emailAddress ?? 'Usuario'
  const secondary = user?.primaryEmailAddress?.emailAddress ?? ''

  return (
    <XStack
      px={collapsed ? 0 : 12}
      py={12}
      gap={10}
      items="center"
      justify={collapsed ? 'center' : 'flex-start'}
      style={{ borderTop: `1px solid ${C.divider}`, overflow: 'hidden', flexShrink: 0 }}
    >
      <UserButton
        afterSignOutUrl="/sign-in"
        appearance={{
          elements: {
            avatarBox: { width: 32, height: 32 },
          },
        }}
      />

      {!collapsed && (
        <YStack flex={1} gap={1} style={{ overflow: 'hidden', minWidth: 0 }}>
          <Text fontSize={13} fontWeight="600" numberOfLines={1} style={{
            color: C.textPrimary, letterSpacing: '-0.1px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {displayName}
          </Text>
          {secondary ? (
            <Text fontSize={11} numberOfLines={1} style={{
              color: C.textMuted, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {secondary}
            </Text>
          ) : null}
        </YStack>
      )}
    </XStack>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function Sidebar() {
  const C = useC()
  const pathname = usePathname()

  const [width,       setWidth]       = useState(EXPANDED)
  const [isDragging,  setIsDragging]  = useState(false)
  const [handleHover, setHandleHover] = useState(false)

  const isDraggingRef = useRef(false)
  const startXRef     = useRef(0)
  const startWidthRef = useRef(0)
  const movedRef      = useRef(false)

  const collapsed = width <= COLLAPSED + 2

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingRef.current = true
    movedRef.current      = false
    startXRef.current     = e.clientX
    startWidthRef.current = width
    setIsDragging(true)
    document.body.style.cursor     = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [width])

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDraggingRef.current) return
      const delta = e.clientX - startXRef.current
      if (Math.abs(delta) > 4) movedRef.current = true
      if (!movedRef.current) return
      setWidth(Math.min(320, Math.max(COLLAPSED, startWidthRef.current + delta)))
    }

    function onMouseUp() {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      setIsDragging(false)
      document.body.style.cursor     = ''
      document.body.style.userSelect = ''

      if (!movedRef.current) {
        setWidth((w) => (w <= COLLAPSED + 2 ? EXPANDED : COLLAPSED))
      } else {
        setWidth((w) => (w < THRESHOLD ? COLLAPSED : EXPANDED))
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
    }
  }, [])

  const showHandle = handleHover || isDragging

  return (
    <div
      className="sidebar-root"
      style={{
        position:        'relative',
        width,
        height:          '100%',
        flexShrink:      0,
        backgroundColor: C.surface,
        borderRight:     `1px solid ${C.border}`,
        display:         'flex',
        flexDirection:   'column',
        transition:      isDragging ? 'none' : 'width 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        overflow:        'hidden',
      }}
    >

      {/* ── Logo zone ──────────────────────────────────────────────────────── */}
      <XStack
        px={collapsed ? 0 : 14}
        height={56}
        gap={10}
        items="center"
        justify={collapsed ? 'center' : 'flex-start'}
        style={{ flexShrink: 0, backgroundColor: C.headerBg }}
      >
        <MapPin
          size={collapsed ? 18 : 20}
          // @ts-expect-error — OKLCH color
          color={C.headerIcon}
          strokeWidth={2}
          style={{ flexShrink: 0 }}
        />
        {!collapsed && (
          <YStack gap={2}>
            <Text
              fontSize={15}
              numberOfLines={1}
              style={{
                color:         C.headerText,
                fontWeight:    '700',
                letterSpacing: '0px',
                lineHeight:    '1',
                userSelect:    'none',
              }}
            >
              Canchero
            </Text>
            <Text
              fontSize={10}
              numberOfLines={1}
              style={{
                color:         C.headerSub,
                fontWeight:    '500',
                letterSpacing: '0.06em',
                lineHeight:    '1',
                userSelect:    'none',
                textTransform: 'uppercase',
              }}
            >
              Panel de gestión
            </Text>
          </YStack>
        )}
      </XStack>

      {/* ── Venue switcher ─────────────────────────────────────────────────── */}
      <VenueSwitcher collapsed={collapsed} />

      {/* ── Nav zone ───────────────────────────────────────────────────────── */}
      <YStack
        flex={1}
        px={collapsed ? 8 : 10}
        pt={8}
        pb={8}
        gap={0}
        style={{ overflowY: 'auto', overflowX: 'hidden' }}
      >
        {NAV_SECTIONS.map((section, idx) => (
          <div key={section.label}>
            {idx > 0 && (
              <div style={{ paddingTop: 6, paddingBottom: 6 }}>
                <SectionDivider />
              </div>
            )}

            {!collapsed && (
              <div style={{ paddingTop: idx === 0 ? 4 : 6, paddingBottom: 3, paddingLeft: 10 }}>
                <span style={{
                  fontSize:      11,
                  fontWeight:    600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  // @ts-expect-error — OKLCH color
                  color:         C.sectionLabel,
                  userSelect:    'none',
                  lineHeight:    '1',
                }}>
                  {section.label}
                </span>
              </div>
            )}

            {collapsed && idx === 0 && <div style={{ paddingTop: 4 }} />}

            <YStack gap={2}>
              {section.items.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={pathname === item.href}
                  collapsed={collapsed}
                  premium={item.premium}
                />
              ))}
            </YStack>
          </div>
        ))}
      </YStack>

      {/* ── User zone ──────────────────────────────────────────────────────── */}
      <UserZone collapsed={collapsed} />

      {/* ── Drag handle ────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setHandleHover(true)}
        onMouseLeave={() => setHandleHover(false)}
        style={{
          position:        'absolute',
          top:             0,
          right:           0,
          width:           4,
          height:          '100%',
          cursor:          'col-resize',
          backgroundColor: C.handle,
          opacity:         showHandle ? (isDragging ? 1 : 0.7) : 0,
          transition:      'opacity 150ms ease-out',
          zIndex:          10,
        }}
      />
    </div>
  )
}
