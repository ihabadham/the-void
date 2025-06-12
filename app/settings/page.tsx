"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SidebarTrigger } from "@/components/ui/sidebar";
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

interface Settings {
  notifications: boolean;
  autoSync: boolean;
  darkMode: boolean;
  emailReminders: boolean;
  exportFormat: "json" | "csv";
  dataRetention: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    notifications: true,
    autoSync: false,
    darkMode: true,
    emailReminders: true,
    exportFormat: "json",
    dataRetention: 365,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [showClearDataModal, setShowClearDataModal] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const stored = localStorage.getItem("void-settings");
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  }, []);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem("void-settings", JSON.stringify(settings));
      toast({
        title: "Settings saved",
        description: "Configuration committed to the void.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
    const applications = localStorage.getItem("void-applications");
    const documents = localStorage.getItem("void-documents");

    const data = {
      applications: applications ? JSON.parse(applications) : [],
      documents: documents ? JSON.parse(documents) : [],
      exportDate: new Date().toISOString(),
      version: "1.0",
    };

    if (settings.exportFormat === "json") {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
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
      const apps = data.applications;
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
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (data.applications) {
          localStorage.setItem(
            "void-applications",
            JSON.stringify(data.applications)
          );
        }
        if (data.documents) {
          localStorage.setItem(
            "void-documents",
            JSON.stringify(data.documents)
          );
        }

        toast({
          title: "Data imported",
          description: "Your data has been cast into the void.",
        });

        // Refresh the page to reflect imported data
        window.location.reload();
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

  const handleClearAllData = () => {
    localStorage.removeItem("void-applications");
    localStorage.removeItem("void-documents");
    localStorage.removeItem("void-settings");

    toast({
      title: "All data cleared",
      description: "The void has consumed everything. You are free.",
    });

    setShowClearDataModal(false);
    // Refresh the page
    window.location.reload();
  };

  const updateSetting = (key: keyof Settings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

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
                checked={settings.notifications}
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
                checked={settings.autoSync}
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
                checked={settings.emailReminders}
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
                value={settings.dataRetention}
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
              disabled={isLoading}
              className="w-full bg-[#00F57A] text-black hover:bg-[#00F57A]/90"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : "Save Settings"}
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
                value={settings.exportFormat}
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
              Clear All Data
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
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Data
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
