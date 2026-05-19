'use client'

import { createContext, useContext, useEffect, useState } from 'react'
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

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setActiveVenueIdState(stored as Id<'venues'>)
  }, [])

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
