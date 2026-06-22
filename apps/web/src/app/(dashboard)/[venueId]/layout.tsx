import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { fetchQuery } from 'convex/nextjs'
import { api } from '@canchero/backend'
import { getHrefsForModules } from '@canchero/backend'
import type { ModuleSlug } from '@canchero/backend'
import type { Id } from '@canchero/backend'
import { AppLayout } from '../../../components/templates/app-layout'

export default async function VenueDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ venueId: string }>
}) {
  const { venueId } = await params

  const { userId, getToken } = await auth()
  if (!userId) redirect('/sign-in')

  const token = await getToken({ template: 'convex' })

  if (!token) return <AppLayout>{children}</AppLayout>

  let userStatus = null
  try {
    userStatus = await fetchQuery(
      api.functions.users.queries.getCurrentUserStatus,
      {},
      { token },
    )
  } catch {
    redirect('/')
  }

  if (userStatus?.role === 'owner' && !userStatus.onboardingCompleted) {
    redirect('/onboarding/sede')
  }

  if (userStatus?.role === 'employee' && !userStatus.onboardingCompleted) {
    redirect('/onboarding/acceso')
  }

  // Least-privilege gate: any role that is not owner or admin goes through module enforcement
  if (!['owner', 'admin'].includes(userStatus?.role ?? '')) {
    let venueAccess = null
    try {
      venueAccess = await fetchQuery(
        api.functions.users.queries.getMyVenueAccessForVenue,
        { venueId: venueId as Id<'venues'> },
        { token },
      )
    } catch {
      redirect('/')
    }

    // Fail-closed: no active access row → redirect to waiting screen
    if (!venueAccess) {
      redirect('/onboarding/acceso')
    }

    // null = no restriction (full access granted) — skip module enforcement
    if (venueAccess.allowedModules !== null) {
      // Derive allowed flat hrefs from the employee's granted slugs
      const allowedHrefs = new Set(
        getHrefsForModules(venueAccess.allowedModules as ModuleSlug[])
      )

      // Normalize pathname: strip /${venueId} prefix before matching registry hrefs
      const headersList = await headers()
      const rawPathname = headersList.get('x-pathname') ?? headersList.get('x-invoke-path') ?? ''
      const prefix = `/${venueId}`
      const pathname = rawPathname.startsWith(prefix)
        ? rawPathname.slice(prefix.length) || '/'
        : rawPathname

      // Check if current path is within an allowed href
      const isAllowed = Array.from(allowedHrefs).some(
        (href) => pathname === href || pathname.startsWith(href + '/')
      )

      if (!isAllowed) {
        const firstHref = Array.from(allowedHrefs)[0]
        if (firstHref) {
          redirect(`/${venueId}${firstHref}`)
        } else {
          // No modules allowed — send to waiting screen instead of looping
          redirect('/onboarding/acceso')
        }
      }
    }
  }

  return <AppLayout>{children}</AppLayout>
}
