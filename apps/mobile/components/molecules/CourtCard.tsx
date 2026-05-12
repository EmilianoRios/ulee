'use client'
import { useState } from 'react'
import { Image, StyleSheet, TouchableOpacity } from 'react-native'
import { Heart } from '@tamagui/lucide-icons'
import { XStack, YStack, Text, View } from 'tamagui'
import type { Court } from '../../data/mock-courts'
import { CourtRating } from '../atoms/CourtRating'

interface CourtCardProps {
  court: Court
  onPress?: (court: Court) => void
}

export function CourtCard({ court, onPress }: CourtCardProps) {
  const [isFav, setIsFav] = useState(court.isFavorite)

  const formattedPrice = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(court.pricePerHour)

  return (
    <YStack
      backgroundColor="$superficieContenido"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$bordeNeutral"
      overflow="hidden"
      marginHorizontal="$4"
      marginBottom="$3"
      pressStyle={{ opacity: 0.95, scale: 0.99 }}
      onPress={() => onPress?.(court)}
      animation="fast"
    >
      {/* Photo */}
      <View height={200} backgroundColor="$superficie">
        <Image
          source={{ uri: court.image }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Favorite button */}
        <TouchableOpacity
          style={styles.heartButton}
          onPress={() => setIsFav(v => !v)}
          activeOpacity={0.8}
        >
          <Heart
            size={18}
            color={isFav ? '#1d8b52' : '#545f72'}
            fill={isFav ? '#1d8b52' : 'transparent'}
          />
        </TouchableOpacity>
        {/* Court type badge */}
        <XStack
          position="absolute"
          bottom={10}
          left={12}
          backgroundColor="rgba(27, 32, 56, 0.72)"
          paddingHorizontal="$2"
          paddingVertical="$0.5"
          borderRadius="$full"
        >
          <Text fontSize={11} color="white" fontWeight="600" fontFamily="$body">
            {court.type}
          </Text>
        </XStack>
      </View>

      {/* Content */}
      <YStack padding="$3" gap="$2">
        <XStack justifyContent="space-between" alignItems="flex-start">
          <YStack flex={1} gap="$0.5" paddingRight="$2">
            <Text
              fontSize={15}
              fontWeight="600"
              color="$textoNav"
              fontFamily="$heading"
              numberOfLines={1}
            >
              {court.venueName}
            </Text>
            <Text
              fontSize={13}
              color="$textoMuted"
              fontFamily="$body"
              numberOfLines={1}
            >
              {court.neighborhood} · {court.distance}
            </Text>
          </YStack>
          <CourtRating rating={court.rating} reviewCount={court.reviewCount} />
        </XStack>

        {/* Divider */}
        <View height={1} backgroundColor="$divisor" />

        {/* Price + CTA */}
        <XStack justifyContent="space-between" alignItems="center">
          <YStack>
            <Text fontSize={11} color="$textoMuted" fontFamily="$body">
              por hora
            </Text>
            <Text
              fontSize={17}
              fontWeight="700"
              color="$textoPrimario"
              fontFamily="$heading"
            >
              {formattedPrice}
            </Text>
          </YStack>

          <XStack
            backgroundColor="$verdeCancha"
            paddingHorizontal="$4"
            paddingVertical="$2.5"
            borderRadius="$3"
            pressStyle={{ backgroundColor: '$verdeCanchaProfundo' }}
            animation="100"
          >
            <Text
              fontSize={13}
              fontWeight="600"
              color="white"
              fontFamily="$body"
            >
              Reservar
            </Text>
          </XStack>
        </XStack>
      </YStack>
    </YStack>
  )
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(242, 244, 248, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
