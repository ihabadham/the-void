import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Plus } from "lucide-react";
import Link from "next/link";
import { DashboardContent } from "@/components/dashboard-content";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";
import type { Metadata } from "next";

// ✅ Server Component metadata - Great for SEO
export const metadata: Metadata = {
  title: "Dashboard | The Void",
  description:
    "Monitor your job applications in the digital abyss. Track applications, interviews, and rejections with The Void dashboard.",
};

// ✅ Server Component - Static header, fast initial render
function DashboardHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="font-mono text-3xl font-medium text-white">
            Dashboard
          </h1>
          {/* Dynamic content moved to client component */}
        </div>
      </div>
      <Button asChild className="bg-[#00F57A] text-black hover:bg-[#00F57A]/90">
        <Link href="/applications/new">
          <Plus className="h-4 w-4 mr-2" />
          Log Application
        </Link>
      </Button>
    </div>
  );
}

// ✅ Server Component main page - Streaming with Suspense
export default function Dashboard() {
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* ✅ Static header renders immediately (Server Component) */}
      <DashboardHeader />

      {/* ✅ Dynamic content streams in with Suspense (Client Component) */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
