import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { fetchQuery } from 'convex/nextjs'
import { api } from '@canchero/backend'
import type { Id } from '@canchero/backend'

export default async function RootDashboardPage() {
  const { getToken } = await auth()
  const token = await getToken({ template: 'convex' })

  if (!token) redirect('/sign-in')

  try {
    const venueAccess = await fetchQuery(
      api.functions.users.queries.getMyVenueAccess,
      {},
      { token },
    )

    const firstVenue = venueAccess?.filter((a) => a.status === 'active')[0]
    if (firstVenue) {
      redirect(`/${firstVenue.venueId as Id<'venues'>}/reservas`)
    }
  } catch {
    // Convex unreachable — fall through to sign-in
  }

  redirect('/sign-in')
}
