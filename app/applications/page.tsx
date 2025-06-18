"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Calendar,
  FileText,
  ExternalLink,
  Eye,
  Trash2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmationModal } from "@/components/confirmation-modal";
import {
  useApplications,
  useDeleteApplication,
} from "@/hooks/use-applications";
import type { Application } from "@/lib/api-client";

const statusColors = {
  applied: "bg-blue-500",
  assessment: "bg-yellow-500",
  interview: "bg-cyan-500",
  offer: "bg-[#00F57A]",
  rejected: "bg-red-500",
  withdrawn: "bg-gray-500",
};

export default function ApplicationsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    applicationId: string;
    applicationName: string;
    attachmentCount: number;
  }>({
    isOpen: false,
    applicationId: "",
    applicationName: "",
    attachmentCount: 0,
  });

  // Use TanStack Query to fetch applications with filters
  const { data, isLoading, isError, error, refetch } = useApplications({
    search: searchTerm || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    sortBy: "appliedDate",
    sortOrder: "desc",
  });

  const deleteApplicationMutation = useDeleteApplication();

  const applications = data?.applications || [];
  const pagination = data?.pagination;

  const openDeleteModal = (app: Application) => {
    setDeleteModal({
      isOpen: true,
      applicationId: app.id,
      applicationName: `${app.company} - ${app.position}`,
      attachmentCount: 0, // TODO: This will be updated when we implement documents integration
    });
  };

  const confirmDelete = () => {
    if (deleteModal.applicationId) {
      deleteApplicationMutation.mutate(deleteModal.applicationId, {
        onSuccess: () => {
          setDeleteModal({
            isOpen: false,
            applicationId: "",
            applicationName: "",
            attachmentCount: 0,
          });
        },
      });
    }
  };

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

        <div className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="void-card">
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
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
                Applications
              </h1>
              <p className="text-gray-400 font-mono text-sm">
                Error loading applications from the void.
              </p>
            </div>
          </div>
        </div>

        <Card className="void-card">
          <CardContent className="p-6 text-center">
            <p className="text-red-400 mb-4">
              Failed to load applications:{" "}
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
              Applications
            </h1>
            <p className="text-gray-400 font-mono text-sm">
              {applications.length} applications in the void
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search companies or positions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black border-gray-700 text-white placeholder:text-gray-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-black border border-gray-700 rounded-md text-white font-mono text-sm"
        >
          <option value="all">All Status</option>
          <option value="applied">Applied</option>
          <option value="assessment">Assessment</option>
          <option value="interview">Interview</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>

      {/* Applications Grid */}
      {applications.length === 0 ? (
        <Card className="void-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="font-mono text-lg text-white mb-2">
                {applications.length === 0
                  ? "The Void Awaits"
                  : "No Matching Applications"}
              </h3>
              <p className="text-gray-500 font-mono text-sm mb-6">
                {applications.length === 0
                  ? "Cast your first application into the digital abyss."
                  : "Try adjusting your search or filter criteria."}
              </p>
              {applications.length === 0 && (
                <Button
                  asChild
                  className="bg-[#00F57A] text-black hover:bg-[#00F57A]/90"
                >
                  <Link href="/applications/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Log First Application
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app) => (
            <Card
              key={app.id}
              className="void-card hover:border-gray-600 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="font-mono text-white text-lg mb-1">
                      {app.company}
                    </CardTitle>
                    <p className="text-gray-400 text-sm">{app.position}</p>
                  </div>
                  <Badge
                    className={`${statusColors[app.status]} text-black text-xs font-mono ml-2`}
                  >
                    {app.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span className="font-mono">
                    Applied: {new Date(app.appliedDate).toLocaleDateString()}
                  </span>
                </div>

                {app.nextDate && (
                  <div className="flex items-center gap-2 text-sm text-[#00F57A]">
                    <Calendar className="h-4 w-4" />
                    <span className="font-mono">
                      {app.nextEvent}:{" "}
                      {new Date(app.nextDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {(() => {
                  const storedDocuments =
                    localStorage.getItem("void-documents");
                  let attachmentCount = 0;

                  if (storedDocuments) {
                    const documents = JSON.parse(storedDocuments);
                    attachmentCount = documents.filter(
                      (doc: any) => doc.applicationId === app.id
                    ).length;
                  }

                  return attachmentCount > 0 ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <FileText className="h-4 w-4" />
                      <span className="font-mono">
                        {attachmentCount} attachment(s)
                      </span>
                    </div>
                  ) : null;
                })()}

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/applications/${app.id}`)}
                    className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>

                  {app.jobUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(app.jobUrl, "_blank")}
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteModal(app)}
                    disabled={deleteApplicationMutation.isPending}
                    className="border-red-700 text-red-400 hover:bg-red-900/20"
                  >
                    {deleteApplicationMutation.isPending &&
                    deleteApplicationMutation.variables === app.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Info */}
      {pagination && (
        <div className="text-center text-gray-400 text-sm">
          Showing {applications.length} of {pagination.total} applications
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({
            isOpen: false,
            applicationId: "",
            applicationName: "",
            attachmentCount: 0,
          })
        }
        onConfirm={confirmDelete}
        title="Delete Application"
        description={`Are you sure you want to delete "${deleteModal.applicationName}"?\n\nThis will permanently delete:\n• The application record\n• ${deleteModal.attachmentCount} attached document(s)\n• All associated data\n\nThis action cannot be undone. Everything will be consumed by the void, forever.`}
        confirmText="Delete Forever"
        destructive={true}
      />
    </div>
  );
}
