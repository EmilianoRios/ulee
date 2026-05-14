'use client'
import { ChevronDown } from '@tamagui/lucide-icons-2'
import { XStack, Text } from 'tamagui'

interface FilterPillProps {
  label: string
  value?: string
  active?: boolean
  onPress?: () => void
}

export function FilterPill({ label, value, active = false, onPress }: FilterPillProps) {
  const displayText = value ?? label

  return (
    <XStack
      onPress={onPress}
      alignItems="center"
      gap="$1"
      paddingHorizontal="$3"
      paddingVertical="$2"
      borderRadius="$full"
      borderWidth={1}
      borderColor={active ? '$verdeCancha' : '$bordeNeutral'}
      backgroundColor={active ? '$verdeCanchaActivo' : '$superficieContenido'}
      pressStyle={{ opacity: 0.85 }}
    >
      <Text
        fontSize={13}
        fontWeight={active ? '600' : '400'}
        color={active ? '$verdeCanchaProfundo' : '$textoMuted'}
        fontFamily="$body"
      >
        {displayText}
      </Text>
      <ChevronDown
        size={13}
        color={active ? '#0b5a33' : '#697283'}
      />
    </XStack>
  )
}
