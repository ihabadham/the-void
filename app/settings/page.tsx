"use client";

import type React from "react";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SettingsIcon,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Save,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationModal } from "@/components/confirmation-modal";
import {
  useSettings,
  useUpdateSettings,
  useExportData,
} from "@/hooks/use-settings";
import {
  useExportApplicationsJson,
  useExportApplicationsCsv,
} from "@/hooks/use-applications";

interface Settings {
  notifications: boolean;
  autoSync: boolean;
  darkMode: boolean;
  emailReminders: boolean;
  exportFormat: "json" | "csv";
  dataRetention: number;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [showClearDataModal, setShowClearDataModal] = useState(false);

  // Use settings hooks
  const { data: settings, isLoading, error, refetch } = useSettings();
  const updateSettingsMutation = useUpdateSettings();
  const exportJsonMutation = useExportApplicationsJson();
  const exportCsvMutation = useExportApplicationsCsv();

  // Local state for form updates (with proper defaults)
  const [localSettings, setLocalSettings] = useState<Settings>(() => ({
    notifications: settings?.notifications ?? true,
    autoSync: settings?.autoSync ?? false,
    darkMode: settings?.darkMode ?? true,
    emailReminders: settings?.emailReminders ?? true,
    exportFormat: settings?.exportFormat ?? "json",
    dataRetention: settings?.dataRetention ?? 365,
  }));

  // Update local settings when data is loaded
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        notifications: settings.notifications,
        autoSync: settings.autoSync,
        darkMode: settings.darkMode,
        emailReminders: settings.emailReminders,
        exportFormat: settings.exportFormat,
        dataRetention: settings.dataRetention,
      });
    }
  }, [settings]);

  // Check if settings have changed from original
  const hasChanges = useMemo(() => {
    if (!settings) return false;

    return (
      localSettings.notifications !== settings.notifications ||
      localSettings.autoSync !== settings.autoSync ||
      localSettings.darkMode !== settings.darkMode ||
      localSettings.emailReminders !== settings.emailReminders ||
      localSettings.exportFormat !== settings.exportFormat ||
      localSettings.dataRetention !== settings.dataRetention
    );
  }, [localSettings, settings]);

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(localSettings);
  };

  const handleExportData = () => {
    if (localSettings.exportFormat === "json") {
      exportJsonMutation.mutate({});
    } else {
      exportCsvMutation.mutate({});
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Data import functionality requires backend implementation for database
    toast({
      title: "Feature not implemented",
      description: "Database data import requires backend implementation.",
      variant: "destructive",
    });

    // Reset file input
    event.target.value = "";
  };

  const handleClearAllData = async () => {
    try {
      // Note: This will need a separate API endpoint to clear all user data
      // For now, we'll show a message that this feature requires backend implementation
      toast({
        title: "Feature not implemented",
        description: "Database data clearing requires backend implementation.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear data.",
        variant: "destructive",
      });
    }
    setShowClearDataModal(false);
  };

  const updateSetting = (key: keyof Settings, value: any) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <Skeleton className="h-8 w-24 mb-2 bg-gray-800" />
            <Skeleton className="h-4 w-48 bg-gray-800" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="void-card">
            <CardHeader>
              <Skeleton className="h-6 w-32 bg-gray-800" />
            </CardHeader>
            <CardContent className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24 bg-gray-800" />
                    <Skeleton className="h-3 w-40 bg-gray-800" />
                  </div>
                  <Skeleton className="h-6 w-11 bg-gray-800 rounded-full" />
                </div>
              ))}
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 bg-gray-800" />
                <Skeleton className="h-10 w-full bg-gray-800" />
              </div>
              <Skeleton className="h-10 w-full bg-gray-800" />
            </CardContent>
          </Card>

          <Card className="void-card">
            <CardHeader>
              <Skeleton className="h-6 w-32 bg-gray-800" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 bg-gray-800" />
                <Skeleton className="h-10 w-full bg-gray-800" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-10 w-full bg-gray-800" />
                <Skeleton className="h-10 w-full bg-gray-800" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="void-card border-red-700">
          <CardHeader>
            <Skeleton className="h-6 w-24 bg-gray-800" />
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded border border-red-700 bg-red-900/10">
              <Skeleton className="h-6 w-32 mb-2 bg-gray-800" />
              <Skeleton className="h-16 w-full mb-4 bg-gray-800" />
              <Skeleton className="h-10 w-32 bg-gray-800" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="font-mono text-3xl font-medium text-white">
              Settings
            </h1>
            <p className="text-gray-400 font-mono text-sm">
              Error loading settings from the void.
            </p>
          </div>
        </div>

        <Card className="void-card">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-4 font-mono">
              Failed to load settings:{" "}
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="font-mono text-3xl font-medium text-white">
            Settings
          </h1>
          <p className="text-gray-400 font-mono text-sm">
            Configure the void to your preferences.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="void-card">
          <CardHeader>
            <CardTitle className="font-mono text-white flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-[#00F57A]" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300 font-mono">Notifications</Label>
                <p className="text-gray-500 text-sm font-mono">
                  Enable browser notifications for updates
                </p>
              </div>
              <Switch
                checked={localSettings.notifications}
                onCheckedChange={(checked) =>
                  updateSetting("notifications", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300 font-mono">
                  Auto Gmail Sync
                </Label>
                <p className="text-gray-500 text-sm font-mono">
                  Automatically sync emails every hour
                </p>
              </div>
              <Switch
                checked={localSettings.autoSync}
                onCheckedChange={(checked) =>
                  updateSetting("autoSync", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300 font-mono">
                  Email Reminders
                </Label>
                <p className="text-gray-500 text-sm font-mono">
                  Send reminders for upcoming events
                </p>
              </div>
              <Switch
                checked={localSettings.emailReminders}
                onCheckedChange={(checked) =>
                  updateSetting("emailReminders", checked)
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300 font-mono">
                Data Retention (days)
              </Label>
              <Input
                type="number"
                value={localSettings.dataRetention}
                onChange={(e) =>
                  updateSetting(
                    "dataRetention",
                    Number.parseInt(e.target.value)
                  )
                }
                className="bg-black border-gray-700 text-white"
                min="30"
                max="3650"
              />
              <p className="text-gray-500 text-sm font-mono">
                How long to keep application data (30-3650 days)
              </p>
            </div>

            <Button
              onClick={handleSaveSettings}
              disabled={updateSettingsMutation.isPending || !hasChanges}
              className="w-full bg-[#00F57A] text-black hover:bg-[#00F57A]/90 disabled:opacity-50"
            >
              {updateSettingsMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="void-card">
          <CardHeader>
            <CardTitle className="font-mono text-white">
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-gray-300 font-mono">Export Format</Label>
              <select
                value={localSettings.exportFormat}
                onChange={(e) => updateSetting("exportFormat", e.target.value)}
                className="w-full px-3 py-2 bg-black border border-gray-700 rounded-md text-white font-mono text-sm"
              >
                <option value="json">JSON (Complete)</option>
                <option value="csv">CSV (Applications Only)</option>
              </select>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleExportData}
                variant="outline"
                className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Download className="h-4 w-4 mr-2" />
                Export All Data
              </Button>

              <div>
                <input
                  type="file"
                  id="import-data"
                  className="hidden"
                  accept=".json"
                  onChange={handleImportData}
                />
                <Button
                  onClick={() =>
                    document.getElementById("import-data")?.click()
                  }
                  variant="outline"
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                  disabled
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data (Coming Soon)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="void-card border-red-700">
        <CardHeader>
          <CardTitle className="font-mono text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded border border-red-700 bg-red-900/10">
            <h4 className="font-mono text-red-400 font-medium mb-2">
              Clear All Data (Coming Soon)
            </h4>
            <p className="text-red-300 text-sm mb-4 font-mono">
              This will permanently delete all applications, documents, and
              settings. This action cannot be undone. Everything will be
              consumed by the void, forever.
            </p>
            <Button
              onClick={() => setShowClearDataModal(true)}
              variant="outline"
              className="border-red-700 text-red-400 hover:bg-red-900/20"
              disabled
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Data (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="void-card">
        <CardHeader>
          <CardTitle className="font-mono text-white">About The Void</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm font-mono text-gray-400">
            <p>Version: 1.0.0</p>
            <p>
              Built for software engineers navigating the digital abyss of job
              applications.
            </p>
            <p>Remember: The void stares back, but at least it's organized.</p>
            <p className="text-[#00F57A]">/dev/null {">"} applications</p>
          </div>
        </CardContent>
      </Card>

      {/* Clear Data Confirmation Modal */}
      <ConfirmationModal
        isOpen={showClearDataModal}
        onClose={() => setShowClearDataModal(false)}
        onConfirm={handleClearAllData}
        title="Clear All Data"
        description={`Are you absolutely sure you want to clear ALL data?\n\nThis will permanently delete:\n• All application records\n• All uploaded documents\n• All settings and preferences\n• All sync history\n\nThis action cannot be undone. Everything will be consumed by the void, forever.`}
        confirmText="Clear Everything"
        destructive={true}
      />
    </div>
  );
}
