"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  SettingsIcon,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationModal } from "@/components/confirmation-modal";
import useSWR, { mutate } from "swr";

interface Settings {
  notifications: boolean;
  autoSync: boolean;
  darkMode: boolean;
  emailReminders: boolean;
  exportFormat: "json" | "csv";
  dataRetention: number;
}

interface SettingsData {
  settings: Settings | null;
}

// SWR fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SettingsContent() {
  const [formData, setFormData] = useState<Settings>({
    notifications: true,
    autoSync: false,
    darkMode: true,
    emailReminders: true,
    exportFormat: "json",
    dataRetention: 365,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [showClearDataModal, setShowClearDataModal] = useState(false);

  // Use SWR for data fetching with caching
  const {
    data,
    error,
    isLoading,
    mutate: mutateSettings,
  } = useSWR<SettingsData>("/api/settings", fetcher);

  // Update form data when SWR data changes
  useEffect(() => {
    if (data?.settings) {
      setFormData(data.settings);
    }
  }, [data]);

  const handleSaveSettings = async () => {
    setIsSubmitting(true);
    try {
      // Save to database via API
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      // Refresh data from server
      await mutateSettings();

      toast({
        title: "Settings saved",
        description: "Configuration committed to the void.",
      });
    } catch (error) {
      console.error("Settings save error:", error);
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportData = async () => {
    try {
      // Export data from database via API
      const response = await fetch("/api/export", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      const exportData = await response.json();

      if (formData.exportFormat === "json") {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `void-export-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // CSV export for applications
        const apps = exportData.applications || [];
        if (apps.length === 0) {
          toast({
            title: "No data to export",
            description: "The void is empty.",
            variant: "destructive",
          });
          return;
        }

        const headers = [
          "Company",
          "Position",
          "Status",
          "Applied Date",
          "Next Date",
          "CV Version",
          "Notes",
        ];
        const csvContent = [
          headers.join(","),
          ...apps.map((app: any) =>
            [
              app.company,
              app.position,
              app.status,
              app.appliedDate,
              app.nextDate || "",
              app.cvVersion || "",
              (app.notes || "").replace(/,/g, ";"),
            ].join(",")
          ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `void-applications-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Data exported",
        description: "Your data has been extracted from the void.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to extract data from the void.",
        variant: "destructive",
      });
    }
  };

  const handleImportData = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);

        // Import data via API
        const response = await fetch("/api/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(importData),
        });

        if (!response.ok) {
          throw new Error("Failed to import data");
        }

        toast({
          title: "Data imported",
          description: "Your data has been cast into the void.",
        });

        // Refresh all data
        await mutateSettings();
        await mutate("/api/applications");
        await mutate("/api/documents");
      } catch (error) {
        toast({
          title: "Import failed",
          description: "The void rejected your data offering.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = "";
  };

  const handleClearAllData = async () => {
    try {
      // Clear all data via API
      const response = await fetch("/api/clear-data", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear data");
      }

      toast({
        title: "All data cleared",
        description: "The void has consumed everything. You are free.",
      });

      setShowClearDataModal(false);

      // Refresh all data
      await mutateSettings();
      await mutate("/api/applications");
      await mutate("/api/documents");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear data.",
        variant: "destructive",
      });
    }
  };

  const updateSetting = (key: keyof Settings, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 font-mono text-sm">
          Error loading settings from the void...
        </p>
      </div>
    );
  }

  const settings = data?.settings || formData;

  return (
    <div className="space-y-6">
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
                checked={formData.notifications}
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
                checked={formData.autoSync}
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
                checked={formData.emailReminders}
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
                value={formData.dataRetention}
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
              disabled={isSubmitting}
              className="w-full bg-[#00F57A] text-black hover:bg-[#00F57A]/90"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Saving..." : "Save Settings"}
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
                value={formData.exportFormat}
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
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="void-card border-red-800">
        <CardHeader>
          <CardTitle className="font-mono text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-gray-300 font-mono mb-2">Clear All Data</p>
              <p className="text-gray-500 text-sm font-mono mb-4">
                Permanently delete all applications, documents, and settings.
                This action cannot be undone.
              </p>
              <Button
                onClick={() => setShowClearDataModal(true)}
                variant="outline"
                className="border-red-700 text-red-400 hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Data
              </Button>
            </div>
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
