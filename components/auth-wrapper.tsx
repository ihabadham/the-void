"use client";

import type React from "react";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Terminal } from "lucide-react";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const isAuthPage = pathname === "/auth";

    if (status === "loading") return; // Still checking session

    if (session) {
      // User is authenticated
      if (isAuthPage) {
        router.push("/"); // Redirect to dashboard if on auth page
      }
    } else {
      // User is not authenticated
      if (!isAuthPage) {
        router.push("/auth"); // Redirect to auth page
      }
    }
  }, [session, status, pathname, router]);

  // Show loading state while checking auth
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <Terminal className="h-12 w-12 text-[#00F57A] mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400 font-mono text-sm">
            Initializing the void...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
