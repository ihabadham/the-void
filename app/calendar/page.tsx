"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, AlertCircle, Plus } from "lucide-react";
import Link from "next/link";
import { useApplications } from "@/hooks/use-applications";

interface Application {
  id: string;
  company: string;
  position: string;
  status:
    | "applied"
    | "assessment"
    | "interview"
    | "offer"
    | "rejected"
    | "withdrawn";
  appliedDate: string;
  nextDate?: string;
  nextEvent?: string;
}

const statusColors = {
  applied: "bg-blue-500",
  assessment: "bg-yellow-500",
  interview: "bg-cyan-500",
  offer: "bg-[#00F57A]",
  rejected: "bg-red-500",
  withdrawn: "bg-gray-500",
};

export default function CalendarPage() {
  const [upcomingEvents, setUpcomingEvents] = useState<Application[]>([]);
  const [pastEvents, setPastEvents] = useState<Application[]>([]);

  // Use the applications hook to fetch data
  const {
    data: applicationsData,
    isLoading,
    error,
    refetch,
  } = useApplications();

  useEffect(() => {
    // Process events when applications data changes
    if (
      applicationsData?.applications &&
      applicationsData.applications.length > 0
    ) {
      const now = new Date();
      const eventsWithDates = applicationsData.applications.filter(
        (app: Application) => app.nextDate
      );

      const upcoming = eventsWithDates
        .filter((app: Application) => new Date(app.nextDate!) > now)
        .sort(
          (a: Application, b: Application) =>
            new Date(a.nextDate!).getTime() - new Date(b.nextDate!).getTime()
        );

      const past = eventsWithDates
        .filter((app: Application) => new Date(app.nextDate!) <= now)
        .sort(
          (a: Application, b: Application) =>
            new Date(b.nextDate!).getTime() - new Date(a.nextDate!).getTime()
        );

      setUpcomingEvents(upcoming);
      setPastEvents(past);
    } else {
      setUpcomingEvents([]);
      setPastEvents([]);
    }
  }, [applicationsData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

    return date.toLocaleDateString();
  };

  const getUrgencyColor = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "text-red-400";
    if (diffDays <= 2) return "text-yellow-400";
    if (diffDays <= 7) return "text-[#00F57A]";
    return "text-gray-400";
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <Skeleton className="h-8 w-32 mb-2 bg-gray-800" />
              <Skeleton className="h-4 w-48 bg-gray-800" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 bg-gray-800" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="void-card">
              <CardHeader>
                <Skeleton className="h-6 w-40 bg-gray-800" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, j) => (
                    <div
                      key={j}
                      className="flex items-center justify-between p-4 rounded border border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-3 h-3 bg-gray-800 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-1 bg-gray-800" />
                          <Skeleton className="h-3 w-32 mb-1 bg-gray-800" />
                          <Skeleton className="h-3 w-16 bg-gray-800" />
                        </div>
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-16 mb-1 bg-gray-800" />
                        <Skeleton className="h-5 w-20 bg-gray-800" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="void-card">
          <CardHeader>
            <Skeleton className="h-6 w-32 bg-gray-800" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="text-center p-4 rounded border border-gray-700"
                >
                  <Skeleton className="h-8 w-8 mx-auto mb-2 bg-gray-800" />
                  <Skeleton className="h-4 w-16 mx-auto bg-gray-800" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="font-mono text-3xl font-medium text-white">
                Calendar
              </h1>
              <p className="text-gray-400 font-mono text-sm">
                Error loading calendar from the void.
              </p>
            </div>
          </div>
        </div>

        <Card className="void-card">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-4 font-mono">
              Failed to load calendar data:{" "}
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
            <Button onClick={() => refetch()} variant="outline">
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
              Calendar
            </h1>
            <p className="text-gray-400 font-mono text-sm">
              {upcomingEvents.length === 0
                ? "No upcoming events. The void is quiet."
                : `${upcomingEvents.length} upcoming events in the pipeline.`}
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
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 font-mono text-sm">
                  No upcoming events scheduled.
                </p>
                <p className="text-gray-600 font-mono text-xs mt-2">
                  The void awaits your next move.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 rounded border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-[#00F57A] rounded-full"></div>
                        <div className="w-px h-8 bg-gray-700 mt-1"></div>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {app.company}
                        </p>
                        <p className="text-gray-400 text-xs">{app.position}</p>
                        <p className="text-gray-500 text-xs font-mono">
                          {app.nextEvent || "Event"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-mono ${getUrgencyColor(app.nextDate!)}`}
                      >
                        {formatDate(app.nextDate!)}
                      </p>
                      <Badge
                        className={`${statusColors[app.status]} text-black text-xs font-mono mt-1`}
                      >
                        {app.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Events */}
        <Card className="void-card">
          <CardHeader>
            <CardTitle className="font-mono text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-gray-400" />
              Past Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pastEvents.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 font-mono text-sm">
                  No past events recorded.
                </p>
                <p className="text-gray-600 font-mono text-xs mt-2">
                  History begins with your first event.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {pastEvents.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 rounded border border-gray-800 opacity-75"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                        <div className="w-px h-8 bg-gray-800 mt-1"></div>
                      </div>
                      <div>
                        <p className="text-gray-300 text-sm font-medium">
                          {app.company}
                        </p>
                        <p className="text-gray-500 text-xs">{app.position}</p>
                        <p className="text-gray-600 text-xs font-mono">
                          {app.nextEvent || "Event"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 text-sm font-mono">
                        {formatDate(app.nextDate!)}
                      </p>
                      <Badge
                        className={`${statusColors[app.status]} text-black text-xs font-mono mt-1 opacity-75`}
                      >
                        {app.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card className="void-card">
        <CardHeader>
          <CardTitle className="font-mono text-white">Event Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded border border-gray-700">
              <p className="text-2xl font-mono font-bold text-[#00F57A]">
                {upcomingEvents.length}
              </p>
              <p className="text-gray-400 text-sm font-mono">Upcoming</p>
            </div>
            <div className="text-center p-4 rounded border border-gray-700">
              <p className="text-2xl font-mono font-bold text-yellow-500">
                {
                  upcomingEvents.filter((app) => {
                    const diffDays = Math.ceil(
                      (new Date(app.nextDate!).getTime() -
                        new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return diffDays <= 7;
                  }).length
                }
              </p>
              <p className="text-gray-400 text-sm font-mono">This Week</p>
            </div>
            <div className="text-center p-4 rounded border border-gray-700">
              <p className="text-2xl font-mono font-bold text-red-500">
                {
                  upcomingEvents.filter((app) => {
                    const diffDays = Math.ceil(
                      (new Date(app.nextDate!).getTime() -
                        new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return diffDays <= 2;
                  }).length
                }
              </p>
              <p className="text-gray-400 text-sm font-mono">Urgent</p>
            </div>
            <div className="text-center p-4 rounded border border-gray-700">
              <p className="text-2xl font-mono font-bold text-gray-400">
                {pastEvents.length}
              </p>
              <p className="text-gray-400 text-sm font-mono">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
