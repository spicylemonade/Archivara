import "@/app/globals.css"
import { Inter as FontSans } from "next/font/google"
import type { Metadata } from "next"

import { cn } from "@/lib/utils"
import { SiteHeader } from "@/components/site-header"
import { FaviconUpdater } from "@/components/favicon-updater"
import { AuthProvider } from "@/lib/auth-context"
import { Analytics } from "@/components/analytics"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Archivara - AI-Generated Research Archive",
  description: "A public platform for machine-generated research with comprehensive storage of papers, code, and model artifacts",
  icons: {
    icon: "/favicon-white.png",
    apple: "/logo-white.png",
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full overflow-hidden">
      <head />
      <body
        className={cn(
          "h-full bg-background font-sans antialiased overflow-hidden",
          fontSans.variable
        )}
      >
        <AuthProvider>
          <FaviconUpdater />
          <Analytics />
          <SiteHeader />
          <main className="snap-container fixed inset-0 pt-24">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
