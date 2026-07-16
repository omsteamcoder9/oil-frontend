import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import HeaderWrapper from '@/components/ui/HeaderWrapper' // CHANGE THIS
import Footer from '@/components/ui/Footer'
import FloatingContactButtons from '@/components/FloatingContactButtons'
import Script from 'next/script'
// app/layout.tsx or wherever you're fetching categories
export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ['latin'] })

async function getSettings() {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const response = await fetch(`${API_URL}/settings/public`, {
      cache: 'no-store',
    })

    if (!response.ok) throw new Error('Failed to fetch settings')

    const data = await response.json()
    return data.data
  } catch {
    return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()

  return {
    title: settings?.siteName,
    description:
      settings?.siteDescription ||
      '',
    keywords: settings?.metaKeywords?.join(', ') || '',
    icons: { icon: '/images/logo.png' },
  }
}

function injectScripts(html: string | null | undefined, pos: 'head' | 'body') {
  if (!html) return []

  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi
  const srcRegex = /src="([^"]*)"/i

  const scripts: React.ReactNode[] = []
  let match

  while ((match = scriptRegex.exec(html))) {
    const content = match[1]?.trim()
    const srcMatch = srcRegex.exec(match[0])

    scripts.push(
      srcMatch ? (
        <Script
          key={`${pos}-${scripts.length}`}
          src={srcMatch[1]}
          strategy={pos === 'head' ? 'beforeInteractive' : 'afterInteractive'}
        />
      ) : (
        <Script
          key={`${pos}-${scripts.length}`}
          strategy={pos === 'head' ? 'beforeInteractive' : 'afterInteractive'}
          dangerouslySetInnerHTML={{ __html: content || '' }}
        />
      )
    )
  }

  return scripts
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getSettings()

  return (
    <html lang="en">
      <head>
        {injectScripts(settings?.headerScripts, 'head')}
      </head>

      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <div className="min-h-screen flex flex-col">
              <HeaderWrapper /> {/* CHANGED FROM Header TO HeaderWrapper */}
              <main className="flex-grow">{children}</main>
              <Footer />
              <FloatingContactButtons />
            </div>
          </CartProvider>
        </AuthProvider>

        {/* scripts MUST be direct children of body */}
        {injectScripts(settings?.bodyScripts, 'body')}
        {injectScripts(settings?.footerScripts, 'body')}
      </body>
    </html>
  )
}