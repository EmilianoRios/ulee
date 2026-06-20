'use client'

import { Lock } from 'lucide-react'
import { YStack, Text } from 'tamagui'
import Link from 'next/link'

interface UpgradeWallProps {
  module?: string
}

export function UpgradeWall({ module }: UpgradeWallProps) {
  return (
    <YStack flex={1} items="center" justify="center" gap="$4" height="100%">
      <YStack
        width={56}
        height={56}
        borderRadius={14}
        items="center"
        justify="center"
        style={{ backgroundColor: 'oklch(25% 0.10 155)' }}
      >
        <Lock size={24} color="oklch(70% 0.18 155)" strokeWidth={2} />
      </YStack>

      <YStack items="center" gap="$2" maxWidth={360}>
        <Text fontSize={20} fontWeight="600" color="$textoNav" style={{ letterSpacing: '-0.01em' }}>
          Función Premium
        </Text>
        <Text fontSize={14} color="$textoNav" opacity={0.5} textAlign="center" lineHeight={1.5}>
          {module
            ? `${module} requiere el plan Pro. Actualizá tu plan para desbloquear esta función.`
            : 'Esta función requiere el plan Pro. Actualizá tu plan para desbloquearla.'}
        </Text>
      </YStack>

      <Link
        href="/upgrade"
        style={{
          display:         'inline-flex',
          alignItems:      'center',
          padding:         '10px 24px',
          backgroundColor: 'oklch(55% 0.18 155)',
          color:           'white',
          borderRadius:    8,
          fontSize:        14,
          fontWeight:      600,
          textDecoration:  'none',
          letterSpacing:   '-0.01em',
          transition:      'background-color 150ms ease-out',
        }}
      >
        Ver planes
      </Link>
    </YStack>
  )
}
