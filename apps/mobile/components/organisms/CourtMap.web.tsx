'use client'
import { AlignJustify, Map } from '@tamagui/lucide-icons-2'
import { XStack, YStack, Text, View } from 'tamagui'
import type { Court } from '../../data/mock-courts'

interface CourtMapProps {
  courts: Court[]
  viewMode: 'list' | 'map'
  onToggleView: (mode: 'list' | 'map') => void
}

export function CourtMap({ courts, viewMode, onToggleView }: CourtMapProps) {
  return (
    <View flex={1} backgroundColor="$superficie">
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
        <Map size={48} color="#545f72" />
        <Text fontSize={16} color="$textoMuted" fontFamily="$body">
          El mapa no está disponible en la versión web.
        </Text>
      </YStack>

      <View
        position="absolute"
        top={16}
        right={16}
        borderRadius="$3"
        borderWidth={1}
        borderColor="$bordeNeutral"
        overflow="hidden"
        backgroundColor="$superficieContenido"
      >
        <XStack>
          <XStack
            paddingHorizontal="$2.5"
            paddingVertical="$1.5"
            backgroundColor={viewMode === 'list' ? '$verdeCanchaActivo' : 'transparent'}
            onPress={() => onToggleView('list')}
          >
            <AlignJustify size={16} color={viewMode === 'list' ? '#0b5a33' : '#545f72'} />
          </XStack>
          <XStack
            paddingHorizontal="$2.5"
            paddingVertical="$1.5"
            backgroundColor={viewMode === 'map' ? '$verdeCanchaActivo' : 'transparent'}
            onPress={() => onToggleView('map')}
          >
            <Map size={16} color={viewMode === 'map' ? '#0b5a33' : '#545f72'} />
          </XStack>
        </XStack>
      </View>
    </View>
  )
}
