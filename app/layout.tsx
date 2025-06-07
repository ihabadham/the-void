import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { AuthWrapper } from "@/components/auth-wrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "The Void | /dev/null > applications",
  description: "A brutally honest dashboard for software engineers to wrangle the chaos of the modern job search.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthWrapper>
          <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <main className="flex-1 bg-black min-h-screen">{children}</main>
          </SidebarProvider>
        </AuthWrapper>
        <Toaster />
      </body>
    </html>
  )
}
