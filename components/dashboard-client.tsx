"use client";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Plus } from "lucide-react";
import Link from "next/link";

interface DashboardClientProps {
  applicationsCount: number;
}

export function DashboardClient({ applicationsCount }: DashboardClientProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="font-mono text-3xl font-medium text-white">
            Dashboard
          </h1>
          <p className="text-gray-400 font-mono text-sm">
            {applicationsCount === 0
              ? "The Void is empty. Cast an application into the abyss to begin."
              : `Monitoring ${applicationsCount} applications in the void.`}
          </p>
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
