import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DocumentsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search Bar Skeleton */}
      <div className="relative max-w-md">
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Documents Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="void-card">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="h-8 w-8" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-5 w-20" />
                    <div className="mt-2 p-2 rounded border border-gray-700 bg-gray-900/50 space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Document Stats Skeleton */}
      <Card className="void-card">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="text-center p-4 rounded border border-gray-700 space-y-2"
              >
                <Skeleton className="h-8 w-8 mx-auto" />
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
