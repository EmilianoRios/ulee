'use client'
import { Bell, MapPin } from '@tamagui/lucide-icons'
import { XStack, YStack, Text, View } from 'tamagui'

interface ExploreHeaderProps {
  userName?: string
  location?: string
  notificationCount?: number
}

export function ExploreHeader({
  userName = 'Matías',
  location = 'Palermo, Buenos Aires',
  notificationCount = 2,
}: ExploreHeaderProps) {
  return (
    <YStack
      paddingHorizontal="$4"
      paddingTop="$3"
      paddingBottom="$2"
      backgroundColor="$superficieContenido"
      gap="$2"
    >
      <XStack justifyContent="space-between" alignItems="center">
        <YStack gap="$0.5">
          <Text
            fontSize={22}
            fontWeight="600"
            color="$textoNav"
            fontFamily="$heading"
            letterSpacing={-0.3}
          >
            Hola, {userName}
          </Text>
          <XStack alignItems="center" gap="$1">
            <MapPin size={13} color="#697283" />
            <Text
              fontSize={13}
              color="$textoMuted"
              fontFamily="$body"
            >
              {location}
            </Text>
          </XStack>
        </YStack>

        <View position="relative">
          <XStack
            width={40}
            height={40}
            borderRadius={20}
            backgroundColor="$superficie"
            alignItems="center"
            justifyContent="center"
            pressStyle={{ opacity: 0.75 }}
          >
            <Bell size={20} color="#545f72" />
          </XStack>
          {notificationCount > 0 && (
            <View
              position="absolute"
              top={-2}
              right={-2}
              width={18}
              height={18}
              borderRadius={9}
              backgroundColor="$verdeCancha"
              alignItems="center"
              justifyContent="center"
            >
              <Text
                fontSize={10}
                fontWeight="700"
                color="white"
                fontFamily="$body"
              >
                {notificationCount}
              </Text>
            </View>
          )}
        </View>
      </XStack>
    </YStack>
  )
}
