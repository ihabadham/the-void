import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Plus } from "lucide-react";
import { DocumentsContent } from "@/components/documents-content";
import { DocumentsSkeleton } from "@/components/documents-skeleton";
import type { Metadata } from "next";

// ✅ Server Component metadata - Great for SEO
export const metadata: Metadata = {
  title: "Documents | The Void",
  description:
    "Manage your application documents in the digital abyss. Upload, organize, and track CVs, cover letters, and portfolios with The Void.",
};

// ✅ Server Component - Static header, fast initial render
function DocumentsHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="font-mono text-3xl font-medium text-white">
            Documents
          </h1>
          {/* Dynamic content moved to client component */}
        </div>
      </div>
      {/* Add Document button will be handled in client component */}
    </div>
  );
}

// ✅ Server Component main page - Streaming with Suspense
export default function DocumentsPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* ✅ Static header renders immediately (Server Component) */}
      <DocumentsHeader />

      {/* ✅ Dynamic content streams in with Suspense (Client Component) */}
      <Suspense fallback={<DocumentsSkeleton />}>
        <DocumentsContent />
      </Suspense>
    </div>
  );
}
