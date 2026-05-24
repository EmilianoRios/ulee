'use client'

import { useState, useEffect, useCallback } from 'react'

type Updater<T> = T | ((prev: T) => T)

/**
 * SSR-safe localStorage hook.
 * Initialises with `initial` on the server and on the first client render
 * (avoids hydration mismatch), then syncs with the stored value after mount.
 * Supports both direct values and functional updaters — same API as useState.
 */
export function useLocalStorage<T>(key: string, initial: T): [T, (value: Updater<T>) => void] {
  const [stored, setStored] = useState<T>(initial)

  // Read from storage after hydration
  useEffect(() => {
    try {
      const item = localStorage.getItem(key)
      if (item !== null) setStored(JSON.parse(item) as T)
    } catch {
      // Silently ignore parse errors — fall back to initial
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const setValue = useCallback((valueOrUpdater: Updater<T>) => {
    setStored((prev) => {
      const next = typeof valueOrUpdater === 'function'
        ? (valueOrUpdater as (prev: T) => T)(prev)
        : valueOrUpdater
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {
        // Silently ignore write errors (e.g. private browsing quota)
      }
      return next
    })
  }, [key])

  return [stored, setValue]
}
