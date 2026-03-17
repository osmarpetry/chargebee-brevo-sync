import type { Metadata } from 'next'
import { Inter, Inconsolata } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const inconsolata = Inconsolata({
  variable: '--font-inconsolata',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'CBDemo – Passbolt Cloud',
  description: 'Full-featured password manager for teams. Secure, open source, and self-hostable.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'CBDemo' },
  icons: { apple: '/apple-icon.png' },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${inconsolata.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
