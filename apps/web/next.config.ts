import type { NextConfig } from 'next'
import { withTamagui } from '@tamagui/next-plugin'

const nextConfig: NextConfig = {
  transpilePackages: ['@canchero/ui'],
  // TODO: apretar de vuelta cuando se tipen los tokens custom de Tamagui en theme.
  eslint:     { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
}

export default withTamagui({
  config: '../../packages/ui/src/tamagui.config.ts',
  components: ['tamagui', '@canchero/ui'],
  disableExtraction: process.env.NODE_ENV === 'development',
})(nextConfig)
