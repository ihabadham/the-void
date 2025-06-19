import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Loading() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <Skeleton className="h-8 w-48 mb-2 bg-gray-800" />
          <Skeleton className="h-4 w-64 bg-gray-800" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="void-card">
            <CardHeader>
              <Skeleton className="h-6 w-32 bg-gray-800" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full bg-gray-800" />
                <Skeleton className="h-4 w-3/4 bg-gray-800" />
                <Skeleton className="h-10 w-full bg-gray-800" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center py-8">
        <div className="inline-flex items-center space-x-2 text-[#00F57A] font-mono">
          <div className="w-2 h-2 bg-[#00F57A] rounded-full animate-pulse"></div>
          <div
            className="w-2 h-2 bg-[#00F57A] rounded-full animate-pulse"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-2 h-2 bg-[#00F57A] rounded-full animate-pulse"
            style={{ animationDelay: "0.4s" }}
          ></div>
          <span className="ml-3">Loading from the void...</span>
        </div>
      </div>
    </div>
  );
}
