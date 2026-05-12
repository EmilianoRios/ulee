'use client'
import { Star } from '@tamagui/lucide-icons'
import { XStack, Text } from 'tamagui'

interface CourtRatingProps {
  rating: number
  reviewCount?: number
  compact?: boolean
}

export function CourtRating({ rating, reviewCount, compact = false }: CourtRatingProps) {
  return (
    <XStack alignItems="center" gap="$1">
      <Star size={13} color="#a0631a" fill="#a0631a" />
      <Text
        fontSize={13}
        fontWeight="600"
        color="$textoNav"
        fontFamily="$body"
      >
        {rating.toFixed(1)}
      </Text>
      {!compact && reviewCount !== undefined && (
        <Text
          fontSize={12}
          color="$textoMuted"
          fontFamily="$body"
        >
          ({reviewCount})
        </Text>
      )}
    </XStack>
  )
}
