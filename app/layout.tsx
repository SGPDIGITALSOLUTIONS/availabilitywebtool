import React from 'react'
import './globals.css'
import type { Metadata } from 'next'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
import { PWAMetaTags } from '@/components/PWAMetaTags'

export const metadata: Metadata = {
  title: 'Vision Care Reporting',
  description: 'Real-time clinic availability and staffing information across multiple healthcare facilities',
  keywords: 'clinic, availability, healthcare, staffing, dashboard',
  manifest: '/manifest.json',
  themeColor: '#307ABF',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vision Care Reporting',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: '/assets/Vision_Care_identifier_RGB (2).jpg',
    apple: '/assets/Vision_Care_identifier_RGB (2).jpg',
    shortcut: '/assets/Vision_Care_identifier_RGB (2).jpg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <PWAMetaTags />
        <ServiceWorkerRegistration />
        <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(to bottom right, rgba(99, 185, 232, 0.1), rgba(24, 172, 167, 0.1))' }}>
          <Navigation />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
          <PWAInstallPrompt />
        </div>
      </body>
    </html>
  )
} 