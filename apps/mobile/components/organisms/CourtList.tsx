'use client'
import { FlatList } from 'react-native'
import { AlignJustify, Map } from '@tamagui/lucide-icons-2'
import { XStack, YStack, Text } from 'tamagui'
import type { Court } from '../../data/mock-courts'
import { CourtCard } from '../molecules/CourtCard'

interface CourtListProps {
  courts: Court[]
  viewMode: 'list' | 'map'
  onToggleView: (mode: 'list' | 'map') => void
  onCourtPress?: (court: Court) => void
}

export function CourtList({ courts, viewMode, onToggleView, onCourtPress }: CourtListProps) {
  return (
    <YStack flex={1} backgroundColor="$superficie">
      {/* Section header */}
      <XStack
        paddingHorizontal="$4"
        paddingVertical="$3"
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$superficieContenido"
        borderBottomWidth={1}
        borderBottomColor="$divisor"
      >
        <Text
          fontSize={15}
          fontWeight="600"
          color="$textoNav"
          fontFamily="$heading"
        >
          Canchas cerca tuyo
        </Text>

        <XStack gap="$1" borderRadius="$3" borderWidth={1} borderColor="$bordeNeutral" overflow="hidden">
          <XStack
            paddingHorizontal="$2.5"
            paddingVertical="$1.5"
            backgroundColor={viewMode === 'list' ? '$verdeCanchaActivo' : 'transparent'}
            onPress={() => onToggleView('list')}
            animation="100"
          >
            <AlignJustify
              size={16}
              color={viewMode === 'list' ? '#0b5a33' : '#545f72'}
            />
          </XStack>
          <XStack
            paddingHorizontal="$2.5"
            paddingVertical="$1.5"
            backgroundColor={viewMode === 'map' ? '$verdeCanchaActivo' : 'transparent'}
            onPress={() => onToggleView('map')}
            animation="100"
          >
            <Map
              size={16}
              color={viewMode === 'map' ? '#0b5a33' : '#545f72'}
            />
          </XStack>
        </XStack>
      </XStack>

      <FlatList
        data={courts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <CourtCard court={item} onPress={onCourtPress} />
        )}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      />
    </YStack>
  )
}
