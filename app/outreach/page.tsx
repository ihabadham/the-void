"use client";

import { useState, useDeferredValue, useMemo } from "react";
import {
  Plus,
  Filter,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { OutreachModal } from "@/components/outreach-modal";
import { useAllOutreach, useUpdateOutreachStatus } from "@/hooks/use-outreach";
import { formatDate } from "@/lib/utils";

export default function OutreachPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [companyFilter, setCompanyFilter] = useState<string>("");

  // Defer the company filter to prevent API calls on every keystroke
  const deferredCompanyFilter = useDeferredValue(companyFilter);

  // Only use status filter for API calls, handle company filtering client-side
  const apiFilters = {
    ...(statusFilter && {
      status: statusFilter as "pending" | "accepted" | "ignored" | "other",
    }),
  };

  const {
    data: allOutreachActions = [],
    isLoading,
    isError,
  } = useAllOutreach(
    Object.keys(apiFilters).length > 0 ? apiFilters : undefined
  );

  // Client-side filtering for smooth search experience
  const outreachActions = useMemo(() => {
    if (!deferredCompanyFilter) return allOutreachActions;

    return allOutreachActions.filter((action) => {
      const companyName = action.application?.company || action.company || "";
      return companyName
        .toLowerCase()
        .includes(deferredCompanyFilter.toLowerCase());
    });
  }, [allOutreachActions, deferredCompanyFilter]);

  const updateStatusMutation = useUpdateOutreachStatus();

  // Check if we're showing stale results during search
  const isSearching = companyFilter !== deferredCompanyFilter;

  const handleStatusUpdate = (
    actionId: string,
    newStatus: "pending" | "accepted" | "ignored" | "other"
  ) => {
    const respondedAt =
      newStatus === "accepted" || newStatus === "ignored"
        ? new Date().toISOString()
        : undefined;
    updateStatusMutation.mutate({ actionId, status: newStatus, respondedAt });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "ignored":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "other":
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-600";
      case "accepted":
        return "bg-green-600";
      case "ignored":
        return "bg-red-600";
      case "other":
        return "bg-gray-600";
      default:
        return "bg-gray-600";
    }
  };

  const clearFilters = () => {
    setStatusFilter("");
    setCompanyFilter("");
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2 bg-gray-800" />
            <Skeleton className="h-4 w-96 bg-gray-800" />
          </div>
          <Skeleton className="h-10 w-32 bg-gray-800" />
        </div>

        {/* Filters skeleton */}
        <Card className="void-card">
          <CardHeader>
            <Skeleton className="h-6 w-48 bg-gray-800" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16 bg-gray-800" />
                <Skeleton className="h-10 w-full bg-gray-800" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 bg-gray-800" />
                <Skeleton className="h-10 w-full bg-gray-800" />
              </div>
              <div className="flex items-end">
                <Skeleton className="h-10 w-28 bg-gray-800" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results skeleton */}
        <Card className="void-card">
          <CardHeader>
            <Skeleton className="h-6 w-64 bg-gray-800" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border border-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Skeleton className="h-4 w-48 bg-gray-800" />
                        <Skeleton className="h-4 w-24 bg-gray-800" />
                      </div>
                      <Skeleton className="h-3 w-64 mb-3 bg-gray-800" />
                      <div className="flex items-center gap-6">
                        <Skeleton className="h-3 w-32 bg-gray-800" />
                        <Skeleton className="h-3 w-32 bg-gray-800" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <Skeleton className="h-6 w-20 bg-gray-800" />
                      <Skeleton className="h-8 w-32 bg-gray-800" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-400 font-mono text-sm">
            /dev/null &gt; outreach – Error loading transmission
          </p>
          <p className="text-gray-500 font-mono text-xs mt-2">
            Cast your first outreach into the corporate void above
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-mono">
            /dev/null &gt; outreach
          </h1>
          <p className="text-gray-400 font-mono text-sm mt-1">
            Peer into the corporate abyss - Track all human outreach attempts
          </p>
        </div>

        <OutreachModal
          trigger={
            <Button className="bg-[#00F57A] text-black font-mono hover:bg-[#00F57A]/90">
              <Plus className="h-4 w-4 mr-2" />
              Log Outreach
            </Button>
          }
        />
      </div>

      {/* Filters */}
      <Card className="void-card">
        <CardHeader>
          <CardTitle className="font-mono text-white flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Transmissions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="font-mono text-gray-300">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-black border-gray-700 text-white">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="ignored">Ignored</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-gray-300">Company</Label>
              <Input
                placeholder="Filter by company..."
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="bg-black border-gray-700 text-white"
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="void-card">
        <CardHeader>
          <CardTitle className="font-mono text-white flex items-center gap-2">
            Outreach Transmissions ({outreachActions.length})
            {isSearching && (
              <span className="text-xs text-[#00F57A] animate-pulse">
                • Filtering...
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Only show loading skeleton on initial load, not during search */}
          {isLoading && !allOutreachActions.length ? (
            <div className="text-center py-8">
              <p className="text-gray-400 font-mono">
                Loading transmissions from the void...
              </p>
            </div>
          ) : outreachActions.length === 0 ? (
            <div className="text-center py-8">
              {allOutreachActions.length === 0 ? (
                <>
                  <p className="text-gray-400 font-mono text-sm">
                    /dev/null &gt; outreach – No transmissions found in the
                    digital abyss
                  </p>
                  <p className="text-gray-500 font-mono text-xs mt-2">
                    Cast your first outreach into the corporate void above
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-400 font-mono text-sm">
                    /dev/null &gt; search – No matches found in the filtered
                    abyss
                  </p>
                  <p className="text-gray-500 font-mono text-xs mt-2">
                    Try adjusting your filters or clear them to see all
                    transmissions
                  </p>
                </>
              )}
            </div>
          ) : (
            <div
              className="space-y-4 transition-opacity duration-200"
              style={{
                opacity: isSearching ? 0.7 : 1,
              }}
            >
              {outreachActions.map((action) => (
                <div
                  key={action.id}
                  className="border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Contact & Company Info */}
                      <div className="flex items-center gap-3 mb-2">
                        <a
                          href={action.contact.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00F57A] font-mono text-sm hover:underline truncate flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {action.contact.fullName ||
                            action.contact.linkedinUrl}
                        </a>
                        {action.application ? (
                          <a
                            href={`/applications/${action.application.id}`}
                            className="text-cyan-400 font-mono text-sm hover:underline"
                          >
                            @ {action.application.company} -{" "}
                            {action.application.position}
                          </a>
                        ) : action.company ? (
                          <span className="text-gray-400 font-mono text-sm">
                            @ {action.company} (No application)
                          </span>
                        ) : (
                          <span className="text-gray-500 font-mono text-sm">
                            @ Unknown company
                          </span>
                        )}
                      </div>

                      {/* Contact headline */}
                      {action.contact.headline && (
                        <p className="text-gray-400 font-mono text-xs mb-3">
                          {action.contact.headline}
                        </p>
                      )}

                      {/* Timeline */}
                      <div className="flex items-center gap-6 text-xs font-mono">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock className="h-3 w-3" />
                          Sent: {formatDate(action.sentAt)}
                        </div>
                        {action.respondedAt && (
                          <div className="flex items-center gap-2 text-cyan-400">
                            <CheckCircle className="h-3 w-3" />
                            Responded: {formatDate(action.respondedAt)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-3 ml-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(action.status)}
                        <Badge
                          className={`text-white font-mono text-xs ${getStatusColor(action.status)}`}
                        >
                          {action.status}
                        </Badge>
                      </div>

                      {/* Status Update Dropdown */}
                      <Select
                        value={action.status}
                        onValueChange={(newStatus) =>
                          handleStatusUpdate(action.id, newStatus as any)
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger className="w-32 bg-black border-gray-700 text-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="ignored">Ignored</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
