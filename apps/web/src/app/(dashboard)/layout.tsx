import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { fetchQuery } from 'convex/nextjs'
import { api } from '@canchero/backend'
import { AppLayout } from '../../components/templates/app-layout'

const EMPLOYEE_BLOCKED_PATHS = ['/clientes', '/estadisticas']

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

    if (userStatus?.role === 'employee') {
      const headersList = await headers()
      const pathname = headersList.get('x-pathname') ?? headersList.get('x-invoke-path') ?? ''
      const blocked = EMPLOYEE_BLOCKED_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
      if (blocked) redirect('/')
    }
  } catch {
    // Convex unreachable — do not block dashboard access
  }

  return <AppLayout>{children}</AppLayout>
}
