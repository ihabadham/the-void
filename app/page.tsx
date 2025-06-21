"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Database,
  Calendar,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { DebugSession } from "@/components/debug-session";
import { useApplications } from "@/hooks/use-applications";
import { formatDate } from "@/lib/utils";
import type { Application } from "@/lib/api-client";

const statusColors = {
  applied: "bg-blue-500",
  assessment: "bg-yellow-500",
  interview: "bg-cyan-500",
  offer: "bg-[#00F57A]",
  rejected: "bg-red-500",
  withdrawn: "bg-gray-500",
};

const statusIcons = {
  applied: Clock,
  assessment: AlertCircle,
  interview: Calendar,
  offer: CheckCircle,
  rejected: XCircle,
  withdrawn: XCircle,
};

export default function Dashboard() {
  // Fetch all applications for dashboard stats
  const { data, isLoading, isError, error, refetch } = useApplications({
    // Get applications for dashboard overview - use max allowed limit
    limit: 100,
    sortBy: "appliedDate",
    sortOrder: "desc",
  });

  const applications = data?.applications || [];

  // Calculate stats from applications
  const stats = {
    total: applications.length,
    pending: applications.filter((app: Application) =>
      ["applied", "assessment", "interview"].includes(app.status)
    ).length,
    interviews: applications.filter(
      (app: Application) => app.status === "interview"
    ).length,
    rejections: applications.filter(
      (app: Application) => app.status === "rejected"
    ).length,
  };

  // Get upcoming events (next dates in the future)
  const upcomingEvents = applications
    .filter((app) => app.nextDate && new Date(app.nextDate) > new Date())
    .sort(
      (a, b) =>
        new Date(a.nextDate!).getTime() - new Date(b.nextDate!).getTime()
    )
    .slice(0, 5);

  // Get recent applications (last 5)
  const recentApplications = applications
    .sort(
      (a, b) =>
        new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
    )
    .slice(0, 5);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="void-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="void-card">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
          <Card className="void-card">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="font-mono text-3xl font-medium text-white">
                Dashboard
              </h1>
              <p className="text-gray-400 font-mono text-sm">
                Error loading data from the void.
              </p>
            </div>
          </div>
        </div>

        <Card className="void-card">
          <CardContent className="p-6 text-center">
            <p className="text-red-400 mb-4">
              Failed to load dashboard data:{" "}
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="font-mono text-3xl font-medium text-white">
              Dashboard
            </h1>
            <p className="text-gray-400 font-mono text-sm">
              {applications.length === 0
                ? "The Void is empty. Cast an application into the abyss to begin."
                : `Monitoring ${applications.length} applications in the void.`}
            </p>
          </div>
        </div>
        <Button
          asChild
          className="bg-[#00F57A] text-black hover:bg-[#00F57A]/90"
        >
          <Link href="/applications/new">
            <Plus className="h-4 w-4 mr-2" />
            Log Application
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="void-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Applications
            </CardTitle>
            <Database className="h-4 w-4 text-[#00F57A]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-white">
              {stats.total}
            </div>
            <p className="text-xs text-gray-500 font-mono">
              Applications cast into the void
            </p>
          </CardContent>
        </Card>

        <Card className="void-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-white">
              {stats.pending}
            </div>
            <p className="text-xs text-gray-500 font-mono">
              Awaiting response from the abyss
            </p>
          </CardContent>
        </Card>

        <Card className="void-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Interviews
            </CardTitle>
            <Calendar className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-white">
              {stats.interviews}
            </div>
            <p className="text-xs text-gray-500 font-mono">
              Scheduled encounters with humans
            </p>
          </CardContent>
        </Card>

        <Card className="void-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Rejections
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-white">
              {stats.rejections}
            </div>
            <p className="text-xs text-gray-500 font-mono">
              Digital rejection letters received
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card className="void-card">
          <CardHeader>
            <CardTitle className="font-mono text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#00F57A]" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((app) => {
                  const StatusIcon = statusIcons[app.status];
                  return (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-3 rounded border border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <StatusIcon className="h-4 w-4 text-cyan-500" />
                        <div>
                          <p className="text-white text-sm font-medium">
                            {app.company}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {app.nextEvent}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-sm font-mono">
                          {app.nextDate ? formatDate(app.nextDate) : "TBD"}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`${
                            statusColors[app.status]
                          } text-black text-xs`}
                        >
                          {app.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 font-mono text-sm">
                  No upcoming events scheduled
                </p>
                <p className="text-gray-500 font-mono text-xs mt-1">
                  The calendar is as empty as the void
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card className="void-card">
          <CardHeader>
            <CardTitle className="font-mono text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-[#00F57A]" />
              Recent Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentApplications.length > 0 ? (
              <div className="space-y-3">
                {recentApplications.map((app) => {
                  const StatusIcon = statusIcons[app.status];
                  return (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-3 rounded border border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <StatusIcon className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-white text-sm font-medium">
                            {app.company}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {app.position}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-sm font-mono">
                          {formatDate(app.appliedDate)}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`${
                            statusColors[app.status]
                          } text-black text-xs`}
                        >
                          {app.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 font-mono text-sm">
                  No applications tracked
                </p>
                <p className="text-gray-500 font-mono text-xs mt-1">
                  The void awaits your first submission
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Debug Session Component - Only visible in development */}
      <DebugSession />
    </div>
  );
}
