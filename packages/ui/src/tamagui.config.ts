import { createTamagui } from 'tamagui'
import { defaultConfig } from '@tamagui/config/v4'

const poppinsFont = {
  ...defaultConfig.fonts.body,
  family: '"Poppins", system-ui, sans-serif',
}

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  fonts: {
    ...defaultConfig.fonts,
    body:    poppinsFont,
    heading: poppinsFont,
  },
  themes: {
    ...defaultConfig.themes,
    light: {
      ...defaultConfig.themes.light,
      // Verde Cancha — acento interactivo (hue 155)
      verdeCancha:         'oklch(50% 0.18 155)',
      verdeCanchaProfundo: 'oklch(32% 0.17 155)',
      verdeCanchaActivo:   'oklch(85% 0.058 155)',
      verdeCanchaFondo:    'oklch(84% 0.052 155)',
      // Acento Terraza — identidad y headings (hue 42–80)
      acentoTerraza:       'oklch(55% 0.13 42)',
      acentoTerrazaClaro:  'oklch(92% 0.03 42)',
      textoNav:            'oklch(32% 0.012 75)',
      textoNavMuted:       'oklch(58% 0.01 75)',
      bordeCalido:         'oklch(88% 0.012 78)',
      // Neutrales azul-gris — superficies y texto (hue 218–228)
      superficie:          'oklch(92.5% 0.016 224)',
      superficieContenido: 'oklch(97% 0.010 220)',
      superficieSidebar:   'oklch(96.5% 0.008 80)',
      cabeceraOscura:      'oklch(22% 0.024 228)',
      textoPrimario:       'oklch(16% 0.014 222)',
      textoMuted:          'oklch(48% 0.012 218)',
      textoInactivo:       'oklch(40% 0.014 224)',
      bordeNeutral:        'oklch(86% 0.016 222)',
      divisor:             'oklch(88% 0.014 222)',
      fondoHover:          'oklch(89% 0.020 224)',
      // Sidebar específicos
      cabeceraTexto:       'oklch(94% 0.008 218)',
      cabeceraSub:         'oklch(58% 0.018 222)',
      cabeceraIcono:       'oklch(68% 0.16 155)',
      textoActivo:         'oklch(22% 0.018 200)',
      etiquetaSeccion:     'oklch(54% 0.014 224)',
      manija:              'oklch(54% 0.020 225)',
      avatarTexto:         'oklch(28% 0.14 155)',
      tooltipFondo:        'oklch(18% 0.014 222)',
      proBadgeFondo:       'oklch(86% 0.040 155)',
      proBadgeTexto:       'oklch(34% 0.16 155)',
    },
  },
})

export type Conf = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

export default tamaguiConfig
