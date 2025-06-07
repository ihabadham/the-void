"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Check if user has connected Gmail
    const gmailConnected = localStorage.getItem("void-gmail-connected")
    const isAuthPage = pathname === "/auth"

    if (gmailConnected === "true") {
      setIsAuthenticated(true)
      // If on auth page and already authenticated, redirect to dashboard
      if (isAuthPage) {
        router.push("/")
      }
    } else {
      setIsAuthenticated(false)
      // If not authenticated and not on auth page, redirect to auth
      if (!isAuthPage) {
        router.push("/auth")
      }
    }
  }, [pathname, router])

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#00F57A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-mono text-sm">Initializing the void...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
