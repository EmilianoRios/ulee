'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

const EDGE_PADDING = 8
const GAP = 4

interface PopoverPlacement {
  style:      CSSProperties  // position:fixed + left/top-or-bottom/minWidth/maxWidth/maxHeight, ready to spread
  openUpward: boolean
}

// ponytail: portal + fixed-position via getBoundingClientRect, not Tamagui Popover/Select —
// several call sites live inside slide-over panels that animate with CSS `transform`, which
// creates a new containing block and breaks plain `position: fixed` children. Portaling to
// document.body sidesteps that plus any `overflow: hidden` ancestor (e.g. the reservations
// table card) without pulling in floating-ui. Flip/clamp math below covers the viewport-edge
// cases floating-ui's flip/shift/size middleware would otherwise handle.
export function usePopoverPosition<TriggerEl extends HTMLElement, PopoverEl extends HTMLElement>(
  preferredMaxHeight = 280,
) {
  const [open, setOpen]           = useState(false)
  const [placement, setPlacement] = useState<PopoverPlacement | null>(null)
  const triggerRef                = useRef<TriggerEl>(null)
  const popoverRef                = useRef<PopoverEl>(null)

  const updatePlacement = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    const spaceBelow = vh - rect.bottom - EDGE_PADDING
    const spaceAbove = rect.top - EDGE_PADDING
    const openUpward = spaceBelow < Math.min(preferredMaxHeight, 160) && spaceAbove > spaceBelow

    const maxHeight = Math.max(120, Math.min(preferredMaxHeight, openUpward ? spaceAbove : spaceBelow))
    const left      = Math.min(Math.max(rect.left, EDGE_PADDING), vw - EDGE_PADDING - rect.width)
    const maxWidth  = vw - left - EDGE_PADDING

    setPlacement({
      openUpward,
      style: {
        position: 'fixed',
        left,
        minWidth: rect.width,
        maxWidth,
        maxHeight,
        ...(openUpward
          ? { bottom: vh - rect.top + GAP }
          : { top: rect.bottom + GAP }),
      },
    })
  }, [preferredMaxHeight])

  const openPopover = useCallback(() => {
    updatePlacement()
    setOpen(true)
  }, [updatePlacement])

  const closePopover = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      setOpen(false)
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', updatePlacement, true)
    window.addEventListener('resize', updatePlacement)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', updatePlacement, true)
      window.removeEventListener('resize', updatePlacement)
    }
  }, [open, updatePlacement])

  return { open, placement, triggerRef, popoverRef, openPopover, closePopover }
}
