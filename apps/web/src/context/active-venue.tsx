'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@canchero/backend'
import type { Id } from '@canchero/backend'

interface ActiveVenueContextValue {
  activeVenueId: Id<'venues'> | null
  setActiveVenueId: (id: Id<'venues'>) => void
}

const ActiveVenueContext = createContext<ActiveVenueContextValue>({
  activeVenueId: null,
  setActiveVenueId: () => {},
})

const STORAGE_KEY = 'canchero:activeVenueId'

export function ActiveVenueProvider({ children }: { children: React.ReactNode }) {
  const [activeVenueId, setActiveVenueIdState] = useState<Id<'venues'> | null>(null)

  // Used only as fallback when localStorage is empty
  const venueAccess = useQuery(api.functions.users.queries.getMyVenueAccess)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setActiveVenueIdState(stored as Id<'venues'>)
      return
    }
    // No stored venue — auto-select the first accessible one
    if (venueAccess && venueAccess.length > 0) {
      const firstId = venueAccess[0].venueId as Id<'venues'>
      setActiveVenueIdState(firstId)
      localStorage.setItem(STORAGE_KEY, firstId)
    }
  }, [venueAccess])

  function setActiveVenueId(id: Id<'venues'>) {
    setActiveVenueIdState(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  return (
    <ActiveVenueContext.Provider value={{ activeVenueId, setActiveVenueId }}>
      {children}
    </ActiveVenueContext.Provider>
  )
}

export function useActiveVenue() {
  return useContext(ActiveVenueContext)
}
