"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Plus,
  Search,
  Calendar,
  FileText,
  ExternalLink,
  Eye,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmationModal } from "@/components/confirmation-modal";

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
  cvVersion?: string;
  notes?: string;
  jobUrl?: string;
  attachments?: string[];
}

const statusColors = {
  applied: "bg-blue-500",
  assessment: "bg-yellow-500",
  interview: "bg-cyan-500",
  offer: "bg-[#00F57A]",
  rejected: "bg-red-500",
  withdrawn: "bg-gray-500",
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
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

  useEffect(() => {
    // Load applications from localStorage or use dummy data
    const stored = localStorage.getItem("void-applications");
    let apps: Application[] = [];

    if (stored) {
      apps = JSON.parse(stored);
    }

    // If no stored data, use comprehensive dummy data to showcase F1 features
    if (apps.length === 0) {
      apps = [
        {
          id: "1",
          company: "TechCorp",
          position: "Senior Frontend Developer",
          status: "interview",
          appliedDate: "2024-01-15",
          nextDate: "2024-01-25",
          nextEvent: "Technical Interview",
          cvVersion: "CV_v2.1_Frontend_Specialist",
          notes:
            "Great company culture. Spoke with Sarah from HR. Technical interview will cover React, TypeScript, and system design.",
          jobUrl: "https://techcorp.com/careers/senior-frontend",
          attachments: ["doc1", "doc2"],
        },
        {
          id: "2",
          company: "StartupXYZ",
          position: "Full Stack Engineer",
          status: "rejected",
          appliedDate: "2024-01-10",
          cvVersion: "CV_v2.0_Fullstack",
          notes:
            "Automated rejection email received. They went with someone with more backend experience.",
          attachments: ["doc3"],
        },
        {
          id: "3",
          company: "BigTech Inc",
          position: "Software Engineer",
          status: "assessment",
          appliedDate: "2024-01-20",
          nextDate: "2024-01-28",
          nextEvent: "Coding Assessment",
          cvVersion: "CV_v2.1_BigTech_Optimized",
          notes:
            "HackerRank assessment. Focus on algorithms and data structures. 90 minutes, 3 problems.",
          jobUrl: "https://bigtech.com/jobs/swe-l4",
          attachments: ["doc4", "doc5"],
        },
        {
          id: "4",
          company: "InnovateLabs",
          position: "React Developer",
          status: "applied",
          appliedDate: "2024-01-22",
          cvVersion: "CV_v2.1_React_Focused",
          notes:
            "Applied through their website. Emphasize React Native experience.",
          jobUrl: "https://innovatelabs.io/careers/react-dev",
          attachments: ["doc6"],
        },
        {
          id: "5",
          company: "DataDriven Co",
          position: "Frontend Architect",
          status: "offer",
          appliedDate: "2024-01-05",
          nextDate: "2024-01-30",
          nextEvent: "Offer Response Deadline",
          cvVersion: "CV_v2.2_Senior_Architect",
          notes:
            "Offer: $140k + equity. Need to respond by Jan 30. Great team, interesting tech stack (React, GraphQL, Micro-frontends).",
          attachments: ["doc7", "doc8", "doc9"],
        },
        {
          id: "6",
          company: "CloudFirst",
          position: "Senior Developer",
          status: "interview",
          appliedDate: "2024-01-18",
          nextDate: "2024-01-26",
          nextEvent: "Final Round Interview",
          cvVersion: "CV_v2.1_Cloud_Native",
          notes:
            "Final round with CTO. Will discuss architecture decisions and leadership experience.",
          jobUrl: "https://cloudfirst.dev/careers/senior-dev",
          attachments: ["doc10"],
        },
        {
          id: "7",
          company: "FinTech Solutions",
          position: "JavaScript Developer",
          status: "withdrawn",
          appliedDate: "2024-01-12",
          cvVersion: "CV_v2.0_JavaScript",
          notes:
            "Withdrew application after learning about their 60-hour work week policy.",
          attachments: [],
        },
        {
          id: "8",
          company: "GreenTech Innovations",
          position: "Frontend Lead",
          status: "applied",
          appliedDate: "2024-01-23",
          cvVersion: "CV_v2.2_Leadership",
          notes:
            "Mission-driven company. Applied via LinkedIn. Recruiter mentioned they're looking for someone with team lead experience.",
          jobUrl: "https://greentech.com/jobs/frontend-lead",
          attachments: ["doc11", "doc12"],
        },
      ];

      // Store dummy data for persistence
      localStorage.setItem("void-applications", JSON.stringify(apps));
    }

    setApplications(apps);
    setFilteredApplications(apps);
  }, []);

  useEffect(() => {
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
    // Get actual attachment count from documents
    const storedDocuments = localStorage.getItem("void-documents");
    let attachmentCount = 0;

    if (storedDocuments) {
      const documents = JSON.parse(storedDocuments);
      attachmentCount = documents.filter(
        (doc: any) => doc.applicationId === app.id
      ).length;
    }

    setDeleteModal({
      isOpen: true,
      applicationId: app.id,
      applicationName: `${app.company} - ${app.position}`,
      attachmentCount,
    });
  };

  const confirmDelete = () => {
    const { applicationId } = deleteModal;

    // Remove application
    const updatedApplications = applications.filter(
      (app) => app.id !== applicationId
    );
    setApplications(updatedApplications);
    localStorage.setItem(
      "void-applications",
      JSON.stringify(updatedApplications)
    );

    // Remove associated documents
    const storedDocuments = localStorage.getItem("void-documents");
    if (storedDocuments) {
      const documents = JSON.parse(storedDocuments);
      const filteredDocuments = documents.filter(
        (doc: any) => doc.applicationId !== applicationId
      );
      localStorage.setItem("void-documents", JSON.stringify(filteredDocuments));
    }

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
              {filteredApplications.length} applications in the void
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
