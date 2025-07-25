"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Shield, ArrowRight, Terminal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { data: session, status } = useSession();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (session) {
      toast({
        title: "Successfully signed in",
        description: "Welcome to the void. Your digital abyss awaits.",
      });
      router.push("/");
    }
  }, [session, router, toast]);

  const handleGoogleAuth = async () => {
    setIsSigningIn(true);
    try {
      await signIn("google", {
        callbackUrl: "/",
      });
    } catch (error) {
      toast({
        title: "Authentication failed",
        description: "The void rejected your sign-in attempt.",
        variant: "destructive",
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <Terminal className="h-12 w-12 text-[#00F57A] mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400 font-mono">Initializing the void...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <Card className="void-card w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Terminal className="h-12 w-12 text-[#00F57A]" />
          </div>
          <CardTitle className="font-mono text-2xl text-white">
            Welcome to The Void
          </CardTitle>
          <p className="text-gray-400 font-mono text-sm">
            Sign in with Google to begin tracking your job applications in the
            digital abyss.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded border border-gray-700">
              <Shield className="h-5 w-5 text-[#00F57A]" />
              <div>
                <p className="text-white text-sm font-medium">
                  Secure OAuth 2.0
                </p>
                <p className="text-gray-400 text-xs">
                  Read-only access to Gmail
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded border border-gray-700">
              <Mail className="h-5 w-5 text-[#00F57A]" />
              <div>
                <p className="text-white text-sm font-medium">
                  Email Monitoring
                </p>
                <p className="text-gray-400 text-xs">
                  Auto-detect job application updates
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleGoogleAuth}
            disabled={isSigningIn}
            className="w-full bg-[#00F57A] text-black hover:bg-[#00F57A]/90"
          >
            {isSigningIn ? (
              "Signing in..."
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Sign in with Google
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>

          <div className="text-xs text-gray-500 font-mono text-center space-y-1">
            <p>• No emails stored permanently</p>
            <p>• Only job-related content processed</p>
            <p>• Revoke access anytime</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
