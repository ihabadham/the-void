import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ApplicationDetailContent } from "@/components/application-detail-content";
import { ApplicationDetailSkeleton } from "@/components/application-detail-skeleton";
import type { Metadata } from "next";

// ✅ Server Component metadata - Great for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Application Details | The Void`,
    description: `View and manage your job application details in the digital abyss. Track progress, attachments, and notes with The Void.`,
  };
}

// ✅ Server Component - Static header, fast initial render
function ApplicationDetailHeader() {
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
      {/* Dynamic content (company name, position, status badge) moved to client component */}
    </div>
  );
}

// ✅ Server Component main page - Streaming with Suspense
export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* ✅ Static header renders immediately (Server Component) */}
      <ApplicationDetailHeader />

      {/* ✅ Dynamic content streams in with Suspense (Client Component) */}
      <Suspense fallback={<ApplicationDetailSkeleton />}>
        <ApplicationDetailContent applicationId={id} />
      </Suspense>
    </div>
  );
}
