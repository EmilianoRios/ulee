'use client'

import { useTheme } from 'tamagui'
import { EmployeeInvitePanelOrganism } from '@/components/organisms/onboarding/EmployeeInvitePanelOrganism'
import { PendingInvitationsOrganism } from '@/components/organisms/onboarding/PendingInvitationsOrganism'

export default function ConfiguracionEquipoPage() {
  const t = useTheme()

  return (
    <div style={{
      height:    '100%',
      overflowY: 'auto',
      padding:   '32px',
      boxSizing: 'border-box',
    }}>
      <div style={{ maxWidth: 640, width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <EmployeeInvitePanelOrganism />
          <div style={{ height: 1, backgroundColor: t.divisor.val }} />
          <PendingInvitationsOrganism />
        </div>
      </div>
    </div>
  )
}
