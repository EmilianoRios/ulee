'use client'

import { YStack, Text } from 'tamagui'
import { Construction } from 'lucide-react'

function EstadisticasPage() {
  return (
    <YStack flex={1} items="center" justify="center" gap="$4" height="100%">
      <YStack opacity={0.35}>
        <Construction size={48} />
      </YStack>
      <YStack items="center" gap="$2">
        <Text fontSize={20} fontWeight="600" color="$textoNav">
          Módulo en Desarrollo
        </Text>
        <Text fontSize={14} color="$textoNav" opacity={0.5}>
          Estadísticas estará disponible próximamente.
        </Text>
      </YStack>
    </YStack>
  )
}

export default EstadisticasPage
