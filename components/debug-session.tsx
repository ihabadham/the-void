"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";

export function DebugSession() {
  const { data: session, status } = useSession();
  const [showTokens, setShowTokens] = useState(false);

  const clearSession = async () => {
    await signOut({ callbackUrl: "/auth" });
  };

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <Card className="void-card mt-6">
      <CardHeader>
        <CardTitle className="font-mono text-white flex items-center gap-2">
          🔍 Debug Session (Dev Only)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-gray-300 font-mono text-sm">
            <strong>Status:</strong> {status}
          </p>

          {session && (
            <>
              <p className="text-gray-300 font-mono text-sm">
                <strong>Email:</strong> {session.user?.email}
              </p>

              <p className="text-gray-300 font-mono text-sm">
                <strong>Name:</strong> {session.user?.name}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowTokens(!showTokens)}
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-300"
                >
                  {showTokens ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {showTokens ? "Hide" : "Show"} Tokens
                </Button>

                <Button
                  onClick={clearSession}
                  variant="outline"
                  size="sm"
                  className="border-red-700 text-red-400 hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Session
                </Button>
              </div>

              {showTokens && (
                <div className="space-y-2 p-3 bg-gray-900 rounded border border-gray-700">
                  <p className="text-gray-300 font-mono text-xs">
                    <strong>Access Token:</strong>
                    <br />
                    <code className="break-all">
                      {session.accessToken
                        ? `${session.accessToken.substring(0, 50)}...`
                        : "Not available"}
                    </code>
                  </p>

                  <p className="text-gray-300 font-mono text-xs">
                    <strong>Refresh Token:</strong>
                    <br />
                    <code className="break-all">
                      {session.refreshToken
                        ? `${session.refreshToken.substring(0, 50)}...`
                        : "Not available"}
                    </code>
                  </p>
                </div>
              )}
            </>
          )}

          {!session && status !== "loading" && (
            <p className="text-gray-400 font-mono text-sm">No active session</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
