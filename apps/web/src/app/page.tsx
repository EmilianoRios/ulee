'use client'

import { YStack, Text } from 'tamagui'

function InicioPage() {
  return (
    <YStack flex={1} items="center" justify="center" height="100%">
      <Text fontSize={24} fontWeight="600" color="$textoNav">
        Inicio
      </Text>
    </YStack>
  )
}

export default InicioPage
