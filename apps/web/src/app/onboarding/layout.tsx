import { OnboardingLayout } from '@/components/templates/onboarding-layout'

export default function OnboardingRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <OnboardingLayout>{children}</OnboardingLayout>
}
