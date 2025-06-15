import { Suspense } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SettingsContent } from "@/components/settings-content";
import { SettingsSkeleton } from "@/components/settings-skeleton";
import type { Metadata } from "next";

// ✅ Server Component metadata - Great for SEO
export const metadata: Metadata = {
  title: "Settings | The Void",
  description:
    "Configure your preferences in the digital abyss. Manage settings, data export/import, and account preferences with The Void.",
};

// ✅ Server Component - Static header, fast initial render
function SettingsHeader() {
  return (
    <div className="flex items-center gap-4">
      <SidebarTrigger />
      <div>
        <h1 className="font-mono text-3xl font-medium text-white">Settings</h1>
        <p className="text-gray-400 font-mono text-sm">
          Configure the void to your preferences.
        </p>
      </div>
    </div>
  );
}

// ✅ Server Component main page - Streaming with Suspense
export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* ✅ Static header renders immediately (Server Component) */}
      <SettingsHeader />

      {/* ✅ Dynamic content streams in with Suspense (Client Component) */}
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
