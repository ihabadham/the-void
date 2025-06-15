"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Calendar,
  FileText,
  ExternalLink,
  Eye,
  Trash2,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { ApplicationsSkeleton } from "@/components/applications-skeleton";
import useSWR from "swr";
import type { Application } from "@/lib/database/schemas";

interface ApplicationsData {
  applications: Application[];
}

const statusColors = {
  applied: "bg-blue-500",
  assessment: "bg-yellow-500",
  interview: "bg-cyan-500",
  offer: "bg-[#00F57A]",
  rejected: "bg-red-500",
  withdrawn: "bg-gray-500",
};

// SWR fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ApplicationsContent() {
  const [filteredApplications, setFilteredApplications] = useState<
    Application[]
  >([]);
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
  const router = useRouter();

  // Use SWR for data fetching with caching
  const { data, error, isLoading } = useSWR<ApplicationsData>(
    "/api/applications",
    fetcher
  );

  const applications = data?.applications;

  useEffect(() => {
    // Only filter if we have applications data
    if (!applications) {
      setFilteredApplications([]);
      return;
    }

    // Filter applications based on search and status
    let filtered = applications;

    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.position.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    setFilteredApplications(filtered);
  }, [applications, searchTerm, statusFilter]);

  const openDeleteModal = (app: Application) => {
    // TODO: Get actual attachment count from database
    const attachmentCount = 0;

    setDeleteModal({
      isOpen: true,
      applicationId: app.id,
      applicationName: `${app.company} - ${app.position}`,
      attachmentCount,
    });
  };

  const confirmDelete = () => {
    // TODO: Implement database delete via API call
    setDeleteModal({
      isOpen: false,
      applicationId: "",
      applicationName: "",
      attachmentCount: 0,
    });
  };

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "applied", label: "Applied" },
    { value: "assessment", label: "Assessment" },
    { value: "interview", label: "Interview" },
    { value: "offer", label: "Offer" },
    { value: "rejected", label: "Rejected" },
    { value: "withdrawn", label: "Withdrawn" },
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-400 font-mono text-sm">
            Error loading applications from the void...
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <ApplicationsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <p className="text-gray-400 font-mono text-sm">
        {filteredApplications.length} applications in the void
      </p>

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
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Applications Grid */}
      {filteredApplications.length === 0 ? (
        <Card className="void-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="font-mono text-lg text-white mb-2">
                {(applications?.length || 0) === 0
                  ? "The Void Awaits"
                  : "No Matching Applications"}
              </h3>
              <p className="text-gray-500 font-mono text-sm mb-6">
                {(applications?.length || 0) === 0
                  ? "Cast your first application into the digital abyss."
                  : "Try adjusting your search or filter criteria."}
              </p>
              {(applications?.length || 0) === 0 && (
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
          {filteredApplications.map((app) => (
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

                {/* TODO: Show document count from database */}

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
                      onClick={() => window.open(app.jobUrl || "", "_blank")}
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteModal(app)}
                    className="border-red-700 text-red-400 hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
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
