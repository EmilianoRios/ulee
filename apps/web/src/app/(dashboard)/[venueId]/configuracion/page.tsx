import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { fetchQuery } from 'convex/nextjs'
import { api } from '@canchero/backend'
import type { ModuleSlug } from '@canchero/backend'
import type { Id } from '@canchero/backend'

// Config slugs in display order — first allowed one wins
const CONFIG_SLUG_ORDER: ModuleSlug[] = [
  'config:general',
  'config:horarios',
  'config:precios',
  'config:feriados',
]

const CONFIG_SLUG_TO_PATH: Record<string, string> = {
  'config:general':  'general',
  'config:horarios': 'horarios',
  'config:precios':  'precios',
  'config:feriados': 'feriados',
}

export default async function ConfiguracionPage({
  params,
}: {
  params: Promise<{ venueId: string }>
}) {
  const { venueId } = await params
  const { userId, getToken } = await auth()

  if (!userId) redirect('/sign-in')

  try {
    const token = await getToken({ template: 'convex' })

    if (token) {
      const userStatus = await fetchQuery(
        api.functions.users.queries.getCurrentUserStatus,
        {},
        { token },
      )

      if (userStatus?.role === 'employee') {
        const venueAccess = await fetchQuery(
          api.functions.users.queries.getMyVenueAccessForVenue,
          { venueId: venueId as Id<'venues'> },
          { token },
        )

        if (!venueAccess) {
          redirect('/')
        }

        const allowedModules = venueAccess.allowedModules as ModuleSlug[]

        // Find first allowed config tab in display order
        const firstSlug = CONFIG_SLUG_ORDER.find(slug => allowedModules.includes(slug))
        if (firstSlug) {
          redirect(`/${venueId}/configuracion/${CONFIG_SLUG_TO_PATH[firstSlug]}`)
        }

        // Employee has no config slugs — belt-and-suspenders fallback
        redirect(`/${venueId}/reservas`)
      }
    }
  } catch {
    // Convex unreachable — redirect to a safe universal fallback (avoids redirect
    // loops for employees whose role cannot be verified)
    redirect(`/${venueId}/reservas`)
  }

  // Owner / admin fallback → general tab
  redirect(`/${venueId}/configuracion/general`)
}
