import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { VenueRouterOrganism } from '../../components/organisms/onboarding/VenueRouterOrganism'

export default async function RootDashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return <VenueRouterOrganism />
}
