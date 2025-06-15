import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { NewApplicationForm } from "@/components/new-application-form";
import type { Metadata } from "next";

// ✅ Server Component metadata - Great for SEO
export const metadata: Metadata = {
  title: "New Application | The Void",
  description:
    "Cast a new job application into the digital abyss. Log application details, attach documents, and track your journey through The Void.",
};

// ✅ Server Component - Static header, fast initial render
function NewApplicationHeader() {
  return (
    <div className="flex items-center gap-4">
      <SidebarTrigger />
      <Button
        variant="outline"
        size="sm"
        asChild
        className="border-gray-700 text-gray-300 hover:bg-gray-800"
      >
        <Link href="/applications">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>
      </Button>
      <div>
        <h1 className="font-mono text-3xl font-medium text-white">
          Log Application
        </h1>
        <p className="text-gray-400 font-mono text-sm">
          Cast another application into the digital abyss.
        </p>
      </div>
    </div>
  );
}

// ✅ Server Component main page
export default function NewApplicationPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* ✅ Static header renders immediately (Server Component) */}
      <NewApplicationHeader />

      {/* ✅ Dynamic form content (Client Component) */}
      <NewApplicationForm />
    </div>
  );
}
