import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import { Providers } from '@/providers'
import './globals.css'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

export const metadata: Metadata = {
  title: 'Canchero',
  description: 'Gestión de reservas deportivas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning className={poppins.className}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
