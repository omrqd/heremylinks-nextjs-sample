import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'All-in-one bio links builder - HereMyLinks',
  description: 'Create your personalized link page in seconds',
  icons: {
    icon: '/imgs/icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

