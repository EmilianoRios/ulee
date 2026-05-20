import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { fetchQuery } from 'convex/nextjs'
import { api } from '@canchero/backend'
import { AppLayout } from '../../components/templates/app-layout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId, getToken } = await auth()
  if (!userId) redirect('/sign-in')

  try {
    const token = await getToken({ template: 'convex' })

    if (!token) return <AppLayout>{children}</AppLayout>

    const userStatus = await fetchQuery(
      api.functions.users.queries.getCurrentUserStatus,
      {},
      { token },
    )

    if (userStatus?.role === 'owner' && !userStatus.onboardingCompleted) {
      redirect('/onboarding/sede')
    }

    if (userStatus?.role === 'employee' && !userStatus.onboardingCompleted) {
      redirect('/onboarding/acceso')
    }
  } catch {
    // Convex unreachable — do not block dashboard access
  }

  return <AppLayout>{children}</AppLayout>
}
