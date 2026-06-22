'use client'

import { createContext, useContext } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import type { Id } from '@canchero/backend'

interface ActiveVenueContextValue {
  activeVenueId: Id<'venues'> | null
  setActiveVenueId: (id: Id<'venues'>) => void
}

const ActiveVenueContext = createContext<ActiveVenueContextValue>({
  activeVenueId: null,
  setActiveVenueId: () => {},
})

// Kept for backward-compatibility with any file that still imports it.
// No longer used as the primary venue storage mechanism.
export const ACTIVE_VENUE_STORAGE_KEY = 'canchero:activeVenueId'

export function ActiveVenueProvider({ children }: { children: React.ReactNode }) {
  const params   = useParams()
  const router   = useRouter()
  const pathname = usePathname()

  // venueId lives in the URL — read it from params
  const venueId = (params?.venueId as Id<'venues'> | undefined) ?? null

  function setActiveVenueId(id: Id<'venues'>) {
    // Derive the current module path (everything after /${currentVenueId})
    const currentPrefix = venueId ? `/${venueId}` : ''
    const modulePath = currentPrefix && pathname.startsWith(currentPrefix)
      ? pathname.slice(currentPrefix.length) || '/reservas'
      : '/reservas'

    router.push(`/${id}${modulePath}`)
  }

  return (
    <ActiveVenueContext.Provider value={{ activeVenueId: venueId, setActiveVenueId }}>
      {children}
    </ActiveVenueContext.Provider>
  )
}

export function useActiveVenue() {
  return useContext(ActiveVenueContext)
}
