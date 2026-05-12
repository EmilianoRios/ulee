import { createAnimations } from '@tamagui/animations-react-native'
import { createFont, createTamagui } from 'tamagui'
import { defaultConfig } from '@tamagui/config/v4'

const animations = createAnimations({
  fast: { type: 'spring', damping: 20, mass: 1.2, stiffness: 250 },
  medium: { type: 'spring', damping: 10, mass: 0.9, stiffness: 100 },
  slow: { type: 'spring', damping: 20, stiffness: 60 },
  100: { type: 'timing', duration: 100 },
  200: { type: 'timing', duration: 200 },
})

const poppinsFont = createFont({
  family: 'Poppins_400Regular',
  face: {
    400: { normal: 'Poppins_400Regular' },
    500: { normal: 'Poppins_500Medium' },
    600: { normal: 'Poppins_600SemiBold' },
    700: { normal: 'Poppins_700Bold' },
  },
  size: {
    1: 11,
    2: 12,
    3: 14,
    4: 16,
    5: 18,
    6: 20,
    7: 24,
    true: 14,
  },
  lineHeight: {
    1: 16,
    2: 17,
    3: 20,
    4: 22,
    5: 24,
    6: 26,
    7: 30,
    true: 20,
  },
  weight: {
    1: '400',
    2: '400',
    3: '400',
    4: '400',
    5: '500',
    6: '600',
    7: '700',
    true: '400',
  },
  letterSpacing: {
    4: 0,
    5: -0.2,
    6: -0.4,
    true: 0,
  },
})

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  animations,
  fonts: {
    body: poppinsFont,
    heading: poppinsFont,
  },
  themes: {
    ...defaultConfig.themes,
    light: {
      ...defaultConfig.themes.light,
      // Verde Cancha — acción e interactividad
      verdeCancha: '#1d8b52',
      verdeCanchaProfundo: '#0b5a33',
      verdeCanchaActivo: '#c0e8d5',
      verdeCanchaFondo: '#bee5d0',
      // Acento Terraza — identidad y marca
      acentoTerraza: '#a0631a',
      acentoTerrazaClaro: '#f5ebe0',
      // Texto cálido — headings
      textoNav: '#4c4236',
      textoNavMuted: '#928874',
      bordeCalido: '#e2d6c5',
      // Neutrales azul-gris — superficies y texto
      superficie: '#e3e8f0',
      superficieContenido: '#f2f4f8',
      cabeceraOscura: '#1b2038',
      textoPrimario: '#141820',
      textoMuted: '#697283',
      textoInactivo: '#545f72',
      bordeNeutral: '#cdd3dd',
      divisor: '#d5dae5',
      fondoHover: '#d6dce8',
    },
  },
})

export type Conf = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

export default tamaguiConfig
