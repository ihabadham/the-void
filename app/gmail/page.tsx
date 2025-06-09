"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Mail,
  RefreshCw,
  Settings,
  AlertCircle,
  CheckCircle,
  Zap,
  Link2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { storeGmailTokens, clearGmailTokens } from "@/lib/gmail-client";
import { useRouter, useSearchParams } from "next/navigation";

export default function GmailPage() {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [keywords, setKeywords] = useState(
    "job application, interview, assessment, offer, rejection"
  );
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we're returning from Gmail OAuth
    const success = searchParams.get("success");
    const tokens = searchParams.get("tokens");
    const error = searchParams.get("error");

    if (success && tokens && session?.user?.email) {
      try {
        const parsedTokens = JSON.parse(decodeURIComponent(tokens));
        storeGmailTokens(session.user.email, parsedTokens);
        setIsConnected(true);
        setLastSync(new Date().toISOString());

        toast({
          title: "Gmail connected successfully",
          description: "The void now has access to your email abyss.",
        });

        // Clean up URL
        router.replace("/gmail");
      } catch (err) {
        console.error("Error parsing tokens:", err);
        toast({
          title: "Connection failed",
          description: "Failed to process Gmail connection.",
          variant: "destructive",
        });
      }
    }

    if (error) {
      toast({
        title: "Gmail connection failed",
        description: `Error: ${error}`,
        variant: "destructive",
      });
      router.replace("/gmail");
    }

    // Check existing connection
    const gmailConnected = localStorage.getItem("void-gmail-connected");
    const connectedDate = localStorage.getItem("void-gmail-connected-date");

    if (gmailConnected === "true") {
      setIsConnected(true);
      setLastSync(connectedDate || new Date().toISOString());
    }
  }, [searchParams, session, router, toast]);

  const handleConnectGmail = async () => {
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please sign in first to connect Gmail.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      const response = await fetch("/api/gmail/connect");
      const data = await response.json();

      if (data.authUrl) {
        // Redirect to Google OAuth for Gmail permissions
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.error || "Failed to get auth URL");
      }
    } catch (error) {
      console.error("Connect Gmail error:", error);
      toast({
        title: "Connection failed",
        description: "Failed to initiate Gmail connection.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    clearGmailTokens();
    setIsConnected(false);
    setLastSync(null);
    setShowDisconnectModal(false);

    toast({
      title: "Gmail disconnected",
      description: "The void has released your email connection.",
    });
  };

  const handleSync = async () => {
    if (!isConnected) return;

    setIsSyncing(true);

    try {
      // TODO: Implement real Gmail sync with our API
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setLastSync(new Date().toISOString());

      toast({
        title: "Sync completed",
        description: "Email data has been processed by the void.",
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "The void could not process your emails.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="font-mono text-3xl font-medium text-white">
              Gmail Integration
            </h1>
            <p className="text-gray-400 font-mono text-sm">
              {isConnected
                ? "Connected to the email abyss. Monitoring for job-related communications."
                : "Connect your Gmail to automatically track job application emails."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Connection Status */}
          <Card className="void-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-mono text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#00F57A]" />
                Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded border border-gray-700">
                <div className="flex items-center gap-3">
                  {isConnected ? (
                    <CheckCircle className="h-6 w-6 text-[#00F57A]" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-gray-500" />
                  )}
                  <div>
                    <p className="text-white font-medium">
                      {isConnected ? "Gmail Connected" : "Gmail Not Connected"}
                    </p>
                    <p className="text-gray-400 text-sm font-mono">
                      {isConnected
                        ? "Automatic email monitoring is active"
                        : "Manual application tracking only"}
                    </p>
                  </div>
                </div>

                {isConnected ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSync}
                      disabled={isSyncing}
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${
                          isSyncing ? "animate-spin" : ""
                        }`}
                      />
                      {isSyncing ? "Syncing..." : "Sync Now"}
                    </Button>
                    <Button
                      onClick={() => setShowDisconnectModal(true)}
                      variant="outline"
                      size="sm"
                      className="border-red-700 text-red-400 hover:bg-red-900/20"
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleConnectGmail}
                    disabled={isConnecting}
                    className="bg-[#00F57A] text-black hover:bg-[#00F57A]/90"
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    {isConnecting ? "Connecting..." : "Connect Gmail"}
                  </Button>
                )}
              </div>

              {lastSync && (
                <div className="text-sm text-gray-400 font-mono">
                  Last sync: {new Date(lastSync).toLocaleString()}
                </div>
              )}

              {!isConnected && (
                <div className="p-4 rounded border border-yellow-700 bg-yellow-900/10">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-yellow-400 font-medium text-sm">
                        Manual Tracking Mode
                      </p>
                      <p className="text-yellow-300 text-sm mt-1">
                        Without Gmail integration, you'll need to manually
                        update application statuses. Connect Gmail to
                        automatically detect job-related emails and suggest
                        status updates.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="void-card">
            <CardHeader>
              <CardTitle className="font-mono text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#00F57A]" />
                Email Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 rounded border border-gray-700">
                <p className="text-2xl font-mono font-bold text-[#00F57A]">
                  {isConnected ? "47" : "0"}
                </p>
                <p className="text-gray-400 text-sm font-mono">
                  Emails Processed
                </p>
              </div>

              <div className="text-center p-4 rounded border border-gray-700">
                <p className="text-2xl font-mono font-bold text-yellow-500">
                  {isConnected ? "12" : "0"}
                </p>
                <p className="text-gray-400 text-sm font-mono">Auto-Updates</p>
              </div>

              <div className="text-center p-4 rounded border border-gray-700">
                <p className="text-2xl font-mono font-bold text-cyan-500">
                  {isConnected ? "3" : "0"}
                </p>
                <p className="text-gray-400 text-sm font-mono">
                  Interviews Detected
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration */}
        <Card className="void-card">
          <CardHeader>
            <CardTitle className="font-mono text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#00F57A]" />
              Email Monitoring Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="keywords" className="text-gray-300 font-mono">
                Detection Keywords
              </Label>
              <Input
                id="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Enter comma-separated keywords..."
                className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                disabled={!isConnected}
              />
              <p className="text-gray-500 text-sm font-mono">
                The void will scan emails for these keywords to identify
                job-related communications.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-mono text-white text-sm">
                  Auto-Detection Rules
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#00F57A] rounded-full"></div>
                    <span className="text-gray-300 font-mono">
                      Interview invitations → Status: Interview
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-300 font-mono">
                      Assessment links → Status: Assessment
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-gray-300 font-mono">
                      Rejection emails → Status: Rejected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                    <span className="text-gray-300 font-mono">
                      Offer letters → Status: Offer
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-mono text-white text-sm">
                  Privacy & Security
                </h4>
                <div className="space-y-2 text-sm text-gray-400 font-mono">
                  <p>• Read-only access to Gmail</p>
                  <p>• No emails stored permanently</p>
                  <p>• Only job-related content processed</p>
                  <p>• OAuth 2.0 secure authentication</p>
                  <p>• Revoke access anytime</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                disabled={!isConnected}
                className="bg-[#00F57A] text-black hover:bg-[#00F57A]/90 disabled:opacity-50"
              >
                Save Configuration
              </Button>
              <Button
                variant="outline"
                disabled={!isConnected}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
              >
                Test Detection
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {isConnected && (
          <Card className="void-card">
            <CardHeader>
              <CardTitle className="font-mono text-white">
                Recent Email Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded border border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#00F57A] rounded-full"></div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        Interview invitation detected
                      </p>
                      <p className="text-gray-400 text-xs font-mono">
                        TechCorp - Senior Developer Position
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs font-mono">2 hours ago</p>
                </div>

                <div className="flex items-center justify-between p-3 rounded border border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        Rejection email processed
                      </p>
                      <p className="text-gray-400 text-xs font-mono">
                        StartupXYZ - Frontend Engineer
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs font-mono">1 day ago</p>
                </div>

                <div className="flex items-center justify-between p-3 rounded border border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        Assessment link found
                      </p>
                      <p className="text-gray-400 text-xs font-mono">
                        BigTech Inc - Software Engineer
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs font-mono">3 days ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Gmail Disconnect Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        onConfirm={handleDisconnect}
        title="Disconnect Gmail"
        description={`Are you sure you want to disconnect Gmail?\n\nThis will:\n• Stop automatic email monitoring\n• Disable job application status detection\n• Switch to manual tracking mode only\n\nYou can reconnect anytime, but automatic sync history will be lost.`}
        confirmText="Disconnect"
        destructive={true}
      />
    </>
  );
}
