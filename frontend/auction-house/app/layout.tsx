import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ThemeRegistry from '@/utils/themeregistry'
import { LoginContextProvider } from '@/contexts/LoginContextProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'An inconspicious crypto site',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <ThemeRegistry options={{ key: 'mui-theme' }}>
        <LoginContextProvider>
          {children}
        </LoginContextProvider>
        </ThemeRegistry>
      </body>
    </html>
  )
}
