import { SafeAreaView, StyleSheet } from 'react-native'
import { YStack, Text } from 'tamagui'

export default function BuscarScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$2">
        <Text fontSize={16} fontWeight="600" color="$textoNav" fontFamily="$heading">
          Buscar
        </Text>
        <Text fontSize={14} color="$textoMuted" fontFamily="$body">
          Próximamente
        </Text>
      </YStack>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f4f8' },
})
