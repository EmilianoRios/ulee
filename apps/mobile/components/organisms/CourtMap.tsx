'use client'
import { ScrollView, StyleSheet, Image } from 'react-native'
import MapView, { Marker, Callout } from 'react-native-maps'
import { AlignJustify, Map } from '@tamagui/lucide-icons-2'
import { XStack, YStack, Text, View } from 'tamagui'
import type { Court } from '../../data/mock-courts'
import { CourtRating } from '../atoms/CourtRating'

const BUENOS_AIRES = {
  latitude: -34.5885,
  longitude: -58.4356,
  latitudeDelta: 0.06,
  longitudeDelta: 0.04,
}

interface CourtMapProps {
  courts: Court[]
  viewMode: 'list' | 'map'
  onToggleView: (mode: 'list' | 'map') => void
}

export function CourtMap({ courts, viewMode, onToggleView }: CourtMapProps) {
  return (
    <View flex={1} backgroundColor="$superficie">
      {/* Map */}
      <MapView
        style={styles.map}
        initialRegion={BUENOS_AIRES}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {courts.map(court => (
          <Marker
            key={court.id}
            coordinate={{ latitude: court.lat, longitude: court.lng }}
            pinColor="#1d8b52"
          >
            <View
              backgroundColor="#1d8b52"
              paddingHorizontal={10}
              paddingVertical={5}
              borderRadius={20}
              shadowColor="#000"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.2}
              shadowRadius={4}
            >
              <Text fontSize={12} fontWeight="700" color="white" fontFamily="$body">
                {new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: 'ARS',
                  maximumFractionDigits: 0,
                  notation: 'compact',
                }).format(court.pricePerHour)}
              </Text>
            </View>
            <Callout tooltip>
              <YStack
                backgroundColor="$superficieContenido"
                borderRadius="$3"
                overflow="hidden"
                borderWidth={1}
                borderColor="$bordeNeutral"
                width={200}
              >
                <Text
                  fontSize={13}
                  fontWeight="600"
                  color="$textoNav"
                  fontFamily="$heading"
                  padding="$2"
                  paddingBottom="$1"
                >
                  {court.venueName}
                </Text>
                <Text
                  fontSize={12}
                  color="$textoMuted"
                  fontFamily="$body"
                  paddingHorizontal="$2"
                  paddingBottom="$2"
                >
                  {court.neighborhood} · {court.distance}
                </Text>
              </YStack>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Toggle overlay */}
      <View
        position="absolute"
        top={16}
        right={16}
        borderRadius="$3"
        borderWidth={1}
        borderColor="$bordeNeutral"
        overflow="hidden"
        backgroundColor="$superficieContenido"
        shadowColor="#000"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.1}
        shadowRadius={4}
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

      {/* Bottom card strip */}
      <View
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        backgroundColor="$superficieContenido"
        borderTopWidth={1}
        borderTopColor="$bordeNeutral"
        paddingTop="$3"
        paddingBottom="$4"
      >
        <Text
          fontSize={12}
          fontWeight="600"
          color="$textoMuted"
          fontFamily="$body"
          paddingHorizontal="$4"
          marginBottom="$2"
          textTransform="uppercase"
          letterSpacing={0.8}
        >
          {courts.length} canchas disponibles
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        >
          {courts.map(court => (
            <MapCourtChip key={court.id} court={court} />
          ))}
        </ScrollView>
      </View>
    </View>
  )
}

function MapCourtChip({ court }: { court: Court }) {
  const formattedPrice = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(court.pricePerHour)

  return (
    <XStack
      width={200}
      height={90}
      backgroundColor="$superficieContenido"
      borderRadius="$3"
      borderWidth={1}
      borderColor="$bordeNeutral"
      overflow="hidden"
      pressStyle={{ opacity: 0.85 }}
      animation="fast"
    >
      <Image
        source={{ uri: court.image }}
        style={styles.chipImage}
        resizeMode="cover"
      />
      <YStack flex={1} padding="$2" gap="$0.5">
        <Text
          fontSize={12}
          fontWeight="600"
          color="$textoNav"
          fontFamily="$heading"
          numberOfLines={1}
        >
          {court.venueName}
        </Text>
        <Text fontSize={11} color="$textoMuted" fontFamily="$body" numberOfLines={1}>
          {court.distance}
        </Text>
        <CourtRating rating={court.rating} compact />
        <Text fontSize={12} fontWeight="700" color="$verdeCancha" fontFamily="$heading">
          {formattedPrice}/h
        </Text>
      </YStack>
    </XStack>
  )
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  chipImage: {
    width: 70,
    height: 90,
  },
})
