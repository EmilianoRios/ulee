'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { YStack, XStack, Text, useTheme } from 'tamagui'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import {
  CalendarCheck,
  CalendarDays,
  LayoutGrid,
  Users,
  Wallet,
  Building2,
  Settings,
  MapPin,
  ChevronDown,
  Check,
  Lock,
  type LucideIcon,
} from 'lucide-react'
import { useUser, UserButton } from '@clerk/nextjs'
import { useQuery, useConvexAuth } from 'convex/react'
import { api } from '@canchero/backend'
import { MODULE_REGISTRY } from '@canchero/backend'
import type { ModuleSlug } from '@canchero/backend'
import type { Id } from '@canchero/backend'
import { useActiveVenue } from '@/context/active-venue'
import { usePlan } from '@/hooks/usePlan'

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
  label:        string
  href:         string        // prefixed with /${venueId} at render time
  activePrefix?: string       // if set, isActive matches this prefix instead of href
  icon:         LucideIcon
  premium?:     boolean
  locked?:      boolean
}

interface NavSection {
  label: string
  items: NavItemDef[]
}

// Icon mapping for registry entries
const SLUG_ICONS: Partial<Record<ModuleSlug | 'sedes' | 'configuracion', LucideIcon>> = {
  reservations:     CalendarCheck,
  finances:         Wallet,
  courts:           LayoutGrid,
  customers:        Users,
  // config:* slugs are collapsed under a single "Configuración" sidebar entry
}

// Static sections for owner/admin (all modules visible, hrefs are flat — prefixed at render time)
const OWNER_NAV_SECTIONS: NavSection[] = [
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
      { label: 'Finanzas', href: '/finanzas', icon: Wallet },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      { label: 'Sedes',         href: '/sedes',                    icon: Building2 },
      { label: 'Configuración', href: '/configuracion/general', activePrefix: '/configuracion', icon: Settings },
    ],
  },
]

// ─── Brand bolt icon ─────────────────────────────────────────────────────────
function BoltIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M20 3L10 18h6L12 29l10-15h-6z" fill={color} />
    </svg>
  )
}

// ─── Venue switcher ───────────────────────────────────────────────────────────

function VenueSwitcher({ collapsed }: { collapsed: boolean }) {
  const C        = useC()
  const { isAuthenticated } = useConvexAuth()
  const venues   = useQuery(api.functions.venues.queries.listByOwner, isAuthenticated ? {} : 'skip')
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
function NavItem({ href, label, icon: Icon, isActive, collapsed, premium, locked, plan }: {
  href: string; label: string; icon: LucideIcon
  isActive: boolean; collapsed: boolean; premium?: boolean
  locked?: boolean; plan?: 'free' | 'pro'
}) {
  const C = useC()
  const params  = useParams()
  const venueId = params?.venueId as string | undefined
  const [hovered,     setHovered]     = useState(false)
  const [tooltipTop,  setTooltipTop]  = useState(0)
  const [tooltipLeft, setTooltipLeft] = useState(0)
  const itemRef = useRef<HTMLAnchorElement>(null)

  const isLocked = locked && plan === 'free'
  // Prefix flat href with /${venueId} if not already absolute and venueId is available
  const resolvedHref = (() => {
    if (isLocked) return venueId ? `/${venueId}/upgrade` : '/upgrade'
    if (!venueId) return href
    if (href.startsWith(`/${venueId}`)) return href
    return `/${venueId}${href}`
  })()

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
        href={resolvedHref}
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
            color={isLocked ? C.textInactive : isActive ? C.greenDeep : C.textInactive}
            strokeWidth={isActive ? 2.2 : 1.7}
            style={{ flexShrink: 0, opacity: isLocked ? 0.5 : 1 }}
          />

          {!collapsed && (
            <XStack flex={1} items="center" justify="space-between">
              <Text
                fontSize={13}
                style={{
                  color:         isActive ? C.activeText : C.textMuted,
                  fontWeight:    isActive ? '600' : '400',
                  letterSpacing: isActive ? '-0.1px' : '0px',
                  lineHeight:    '1',
                  opacity:       isLocked ? 0.5 : 1,
                }}
              >
                {label}
              </Text>
              {isLocked && (
                <Lock size={12} strokeWidth={2} color={C.textInactive} style={{ flexShrink: 0, opacity: 0.5 }} />
              )}
              {!isLocked && premium && (
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
        <Tooltip label={isLocked ? `${label} (PRO)` : label} visible={hovered} top={tooltipTop} left={tooltipLeft} />
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

// ─── Build employee nav sections from MODULE_REGISTRY ────────────────────────

function buildEmployeeSections(allowedModules: ModuleSlug[]): NavSection[] {
  const moduleSet = new Set(allowedModules)

  const operaciones: NavItemDef[] = []
  const gestion: NavItemDef[] = []

  if (moduleSet.has('reservations')) {
    operaciones.push({ label: MODULE_REGISTRY.reservations.label, href: '/reservas',   icon: CalendarCheck })
    operaciones.push({ label: 'Calendario',                        href: '/calendario', icon: CalendarDays  })
  }
  if (moduleSet.has('courts'))    gestion.push({ label: MODULE_REGISTRY.courts.label,    href: '/canchas',  icon: LayoutGrid })
  if (moduleSet.has('finances'))  gestion.push({ label: MODULE_REGISTRY.finances.label,  href: '/finanzas', icon: Wallet     })
  // customers module hidden until implemented

  // Find first allowed config:* slug (in display order) to deep-link directly
  const configSlugOrder: ModuleSlug[] = ['config:general', 'config:horarios', 'config:precios', 'config:feriados']
  const configSlugToPath: Record<string, string> = {
    'config:general':  '/configuracion/general',
    'config:horarios': '/configuracion/horarios',
    'config:precios':  '/configuracion/precios',
    'config:feriados': '/configuracion/feriados',
  }
  const firstConfigSlug = configSlugOrder.find(slug => moduleSet.has(slug))
  const configHref = firstConfigSlug ? configSlugToPath[firstConfigSlug] : null

  const sections: NavSection[] = []
  if (operaciones.length > 0) sections.push({ label: 'OPERACIONES', items: operaciones })
  if (gestion.length > 0)     sections.push({ label: 'GESTIÓN',     items: gestion     })
  if (configHref) {
    sections.push({
      label: 'SISTEMA',
      items: [{ label: 'Configuración', href: configHref, activePrefix: '/configuracion', icon: Settings }],
    })
  }

  return sections
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function Sidebar() {
  const C        = useC()
  const pathname = usePathname()
  const params   = useParams()
  const plan     = usePlan()

  const venueId = params?.venueId as string | undefined

  const { isAuthenticated } = useConvexAuth()
  const userStatus     = useQuery(api.functions.users.queries.getCurrentUserStatus, isAuthenticated ? {} : 'skip')
  const venueAccess    = useQuery(
    api.functions.users.queries.getMyVenueAccessForVenue,
    isAuthenticated && venueId ? { venueId: venueId as Id<'venues'> } : 'skip',
  )

  // Use venue-scoped role as source of truth for nav — not the global users.role
  const venueRole = venueAccess?.role
  const isRestrictedRole = venueRole === 'employee' || venueRole === 'manager'

  // Build visible sections
  const visibleSections: NavSection[] = (() => {
    // While venueAccess is loading, check global role as fallback
    if (venueAccess === undefined) {
      return userStatus?.role === 'owner' ? OWNER_NAV_SECTIONS : []
    }

    if (!isRestrictedRole) return OWNER_NAV_SECTIONS

    const modules = venueAccess?.allowedModules as ModuleSlug[] | null | undefined
    // null = no restriction set → full employee access across all module slugs
    if (modules === null) return buildEmployeeSections(Object.keys(MODULE_REGISTRY) as ModuleSlug[])
    return buildEmployeeSections(modules ?? [])
  })()

  // For isActive matching: strip /${venueId} prefix to get the flat path
  const flatPathname = venueId && pathname.startsWith(`/${venueId}`)
    ? pathname.slice(`/${venueId}`.length) || '/'
    : pathname

  const [width,       setWidth]       = useLocalStorage('canchero:sidebarWidth', EXPANDED)
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
        <BoltIcon size={collapsed ? 18 : 20} color={C.headerIcon} />
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
              Ulee!
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
        {visibleSections.map((section, idx) => (
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
                  isActive={(() => {
                    const matchHref = item.activePrefix ?? item.href
                    return flatPathname === matchHref || (matchHref !== '/' && flatPathname.startsWith(matchHref + '/'))
                  })()}
                  collapsed={collapsed}
                  premium={item.premium}
                  locked={item.locked}
                  plan={plan}
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
