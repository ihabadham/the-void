"use client";

import React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  ExternalLink,
  Trash2,
  Upload,
  X,
  FileText,
  Eye,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationModal } from "@/components/confirmation-modal";
import useSWR from "swr";

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
}

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface Document {
  id: string;
  name: string;
  type: "cv" | "cover-letter" | "portfolio" | "other";
  uploadDate: string;
  size: number;
  url?: string;
  applicationId: string;
  applicationCompany: string;
}

interface ApplicationDetailData {
  application: Application;
  documents: Document[];
}

const statusColors = {
  applied: "bg-blue-500",
  assessment: "bg-yellow-500",
  interview: "bg-cyan-500",
  offer: "bg-[#00F57A]",
  rejected: "bg-red-500",
  withdrawn: "bg-gray-500",
};

const documentTypes = {
  cv: { label: "CV/Resume", color: "bg-[#00F57A]" },
  "cover-letter": { label: "Cover Letter", color: "bg-blue-500" },
  portfolio: { label: "Portfolio", color: "bg-purple-500" },
  other: { label: "Other", color: "bg-gray-500" },
};

// SWR fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ApplicationDetailContentProps {
  applicationId: string;
}

export function ApplicationDetailContent({
  applicationId,
}: ApplicationDetailContentProps) {
  const [application, setApplication] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Application>>({});
  const [newFiles, setNewFiles] = useState<AttachedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteDocModal, setDeleteDocModal] = useState<{
    isOpen: boolean;
    documentId: string;
    documentName: string;
  }>({
    isOpen: false,
    documentId: "",
    documentName: "",
  });
  const router = useRouter();
  const { toast } = useToast();

  // Use SWR for data fetching with caching
  const { data, error, isLoading } = useSWR<ApplicationDetailData>(
    `/api/applications/${applicationId}`,
    fetcher
  );

  useEffect(() => {
    // Load application from localStorage for now, prioritize database data when available
    const stored = localStorage.getItem("void-applications");
    if (stored) {
      const applications = JSON.parse(stored);
      const app = applications.find((a: Application) => a.id === applicationId);
      if (app) {
        setApplication(app);
        setFormData(app);
      }
    }

    // Load documents for this application
    const storedDocs = localStorage.getItem("void-documents");
    if (storedDocs) {
      const allDocs = JSON.parse(storedDocs);
      const appDocs = allDocs.filter(
        (doc: Document) => doc.applicationId === applicationId
      );
      setDocuments(appDocs);
    }

    // Use database data when available
    if (data?.application && data?.documents) {
      setApplication(data.application);
      setFormData(data.application);
      setDocuments(data.documents);
    }
  }, [applicationId, data]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const newFile: AttachedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
      };
      setNewFiles((prev) => [...prev, newFile]);
    });

    // Reset file input
    event.target.value = "";
  };

  const removeNewFile = (fileId: string) => {
    setNewFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const handleSave = async () => {
    if (!application) return;

    setIsSubmitting(true);
    try {
      // Update application
      const stored = localStorage.getItem("void-applications");
      if (stored) {
        const applications = JSON.parse(stored);
        const index = applications.findIndex(
          (a: Application) => a.id === applicationId
        );
        if (index !== -1) {
          applications[index] = { ...application, ...formData };
          localStorage.setItem(
            "void-applications",
            JSON.stringify(applications)
          );
          setApplication(applications[index]);

          // Save new files as documents
          if (newFiles.length > 0) {
            const existingDocuments = localStorage.getItem("void-documents");
            const documents = existingDocuments
              ? JSON.parse(existingDocuments)
              : [];

            const newDocuments: Document[] = newFiles.map((file) => ({
              id: file.id,
              name: file.name,
              type: (file.name.toLowerCase().includes("cv") ||
              file.name.toLowerCase().includes("resume")
                ? "cv"
                : "other") as "cv" | "cover-letter" | "portfolio" | "other",
              uploadDate: new Date().toISOString(),
              size: file.size,
              url: file.url,
              applicationId: applicationId,
              applicationCompany: applications[index].company,
            }));

            documents.push(...newDocuments);
            localStorage.setItem("void-documents", JSON.stringify(documents));

            // Update local documents state
            setDocuments((prev) => [...prev, ...newDocuments]);
            setNewFiles([]);
          }

          setIsEditing(false);
          toast({
            title: "Application updated",
            description: `Changes committed to the void${newFiles.length > 0 ? ` with ${newFiles.length} new attachment(s)` : ""}.`,
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update application.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const stored = localStorage.getItem("void-applications");
      if (stored) {
        const applications = JSON.parse(stored);
        const filtered = applications.filter(
          (a: Application) => a.id !== applicationId
        );
        localStorage.setItem("void-applications", JSON.stringify(filtered));

        // Remove associated documents
        const storedDocuments = localStorage.getItem("void-documents");
        if (storedDocuments) {
          const documents = JSON.parse(storedDocuments);
          const filteredDocuments = documents.filter(
            (doc: any) => doc.applicationId !== applicationId
          );
          localStorage.setItem(
            "void-documents",
            JSON.stringify(filteredDocuments)
          );
        }

        toast({
          title: "Application deleted",
          description: "Record consumed by the void.",
        });
        setShowDeleteModal(false);
        router.push("/applications");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete application.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;

    setDeleteDocModal({
      isOpen: true,
      documentId: docId,
      documentName: doc.name,
    });
  };

  const confirmDeleteDocument = () => {
    const { documentId } = deleteDocModal;

    // Remove from documents state
    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));

    // Remove from localStorage
    const storedDocuments = localStorage.getItem("void-documents");
    if (storedDocuments) {
      const documents = JSON.parse(storedDocuments);
      const filteredDocuments = documents.filter(
        (doc: any) => doc.id !== documentId
      );
      localStorage.setItem("void-documents", JSON.stringify(filteredDocuments));
    }

    toast({
      title: "Document deleted",
      description: "File consumed by the void.",
    });

    setDeleteDocModal({ isOpen: false, documentId: "", documentName: "" });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 font-mono text-sm">
          Error loading application from the void...
        </p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="font-mono text-xl text-white mb-2">
            Application Not Found
          </h2>
          <p className="text-gray-400 font-mono text-sm mb-4">
            This application has been consumed by the void.
          </p>
          <Button
            asChild
            className="bg-[#00F57A] text-black hover:bg-[#00F57A]/90"
          >
            <Link href="/applications">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Header Content */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="font-mono text-3xl font-medium text-white">
              {application.company}
            </h1>
            <p className="text-gray-400 font-mono text-sm">
              {application.position}
            </p>
          </div>
          <Badge
            className={`${statusColors[application.status]} text-black text-sm font-mono`}
          >
            {application.status.toUpperCase()}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {application.jobUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(application.jobUrl, "_blank")}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Job
            </Button>
          )}

          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-[#00F57A] text-black hover:bg-[#00F57A]/90"
            >
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={isSubmitting}
                className="bg-[#00F57A] text-black hover:bg-[#00F57A]/90"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setFormData(application);
                  setNewFiles([]);
                }}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>
          )}

          <Button
            onClick={() => setShowDeleteModal(true)}
            variant="outline"
            size="sm"
            className="border-red-700 text-red-400 hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="void-card">
            <CardHeader>
              <CardTitle className="font-mono text-white">
                Application Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300 font-mono">Company</Label>
                      <Input
                        value={formData.company || ""}
                        onChange={(e) =>
                          handleInputChange("company", e.target.value)
                        }
                        className="bg-black border-gray-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300 font-mono">
                        Position
                      </Label>
                      <Input
                        value={formData.position || ""}
                        onChange={(e) =>
                          handleInputChange("position", e.target.value)
                        }
                        className="bg-black border-gray-700 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300 font-mono">Status</Label>
                      <select
                        value={formData.status || ""}
                        onChange={(e) =>
                          handleInputChange("status", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-black border border-gray-700 rounded-md text-white font-mono text-sm"
                      >
                        <option value="applied">Applied</option>
                        <option value="assessment">Assessment Pending</option>
                        <option value="interview">Interview Scheduled</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Rejected</option>
                        <option value="withdrawn">Withdrawn</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300 font-mono">
                        Applied Date
                      </Label>
                      <Input
                        type="date"
                        value={formData.appliedDate || ""}
                        onChange={(e) =>
                          handleInputChange("appliedDate", e.target.value)
                        }
                        className="bg-black border-gray-700 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300 font-mono">
                        Next Key Date
                      </Label>
                      <Input
                        type="date"
                        value={formData.nextDate || ""}
                        onChange={(e) =>
                          handleInputChange("nextDate", e.target.value)
                        }
                        className="bg-black border-gray-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300 font-mono">
                        Event Type
                      </Label>
                      <Input
                        value={formData.nextEvent || ""}
                        onChange={(e) =>
                          handleInputChange("nextEvent", e.target.value)
                        }
                        placeholder="e.g., Interview, Assessment"
                        className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300 font-mono">Job URL</Label>
                    <Input
                      type="url"
                      value={formData.jobUrl || ""}
                      onChange={(e) =>
                        handleInputChange("jobUrl", e.target.value)
                      }
                      placeholder="https://..."
                      className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                    />
                  </div>

                  {/* File Upload Section for Edit Mode */}
                  <div className="space-y-2">
                    <Label className="text-gray-300 font-mono">
                      Add New Attachments
                    </Label>
                    <div className="space-y-3">
                      <div>
                        <input
                          type="file"
                          id="file-upload-edit"
                          className="hidden"
                          multiple
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleFileUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            document.getElementById("file-upload-edit")?.click()
                          }
                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Attach Files (CV, Cover Letter, etc.)
                        </Button>
                      </div>

                      {newFiles.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-gray-400 text-sm font-mono">
                            New files to be added:
                          </p>
                          {newFiles.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-2 rounded border border-gray-700"
                            >
                              <div>
                                <p className="text-white text-sm font-medium">
                                  {file.name}
                                </p>
                                <p className="text-gray-400 text-xs font-mono">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeNewFile(file.id)}
                                className="border-red-700 text-red-400 hover:bg-red-900/20"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-400 font-mono text-sm">
                        Applied Date
                      </Label>
                      <p className="text-white font-mono">
                        {new Date(application.appliedDate).toLocaleDateString()}
                      </p>
                    </div>
                    {application.nextDate && (
                      <div>
                        <Label className="text-gray-400 font-mono text-sm">
                          {application.nextEvent || "Next Event"}
                        </Label>
                        <p className="text-[#00F57A] font-mono">
                          {new Date(application.nextDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {application.cvVersion && (
                    <div>
                      <Label className="text-gray-400 font-mono text-sm">
                        CV Version
                      </Label>
                      <p className="text-white font-mono">
                        {application.cvVersion}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="void-card">
            <CardHeader>
              <CardTitle className="font-mono text-white">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={formData.notes || ""}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Additional notes, contacts, or preparation points..."
                  rows={6}
                  className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                />
              ) : (
                <div className="min-h-[120px]">
                  {application.notes ? (
                    <p className="text-gray-300 whitespace-pre-wrap">
                      {application.notes}
                    </p>
                  ) : (
                    <p className="text-gray-500 font-mono text-sm italic">
                      No notes recorded. The void remembers nothing.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachments Section */}
          <Card className="void-card">
            <CardHeader>
              <CardTitle className="font-mono text-white">
                Attachments ({documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-gray-500 font-mono text-sm italic">
                  No attachments. Files cast into the void remain elusive.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc) => {
                    const docType = documentTypes[doc.type];
                    return (
                      <div
                        key={doc.id}
                        className="p-3 rounded border border-gray-700 hover:border-gray-600 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-[#00F57A] flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-white text-sm font-medium truncate">
                                {doc.name}
                              </p>
                              <span
                                className={`${docType.color} text-black text-xs font-mono px-2 py-1 rounded`}
                              >
                                {docType.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-gray-400 font-mono mb-3">
                          <p>Size: {formatFileSize(doc.size)}</p>
                          <p>
                            Uploaded:{" "}
                            {new Date(doc.uploadDate).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {doc.url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(doc.url, "_blank")}
                              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          )}

                          {doc.url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = doc.url!;
                                link.download = doc.name;
                                link.click();
                              }}
                              className="border-gray-700 text-gray-300 hover:bg-gray-800"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="border-red-700 text-red-400 hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="void-card">
            <CardHeader>
              <CardTitle className="font-mono text-white">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 rounded border border-gray-700">
                  <div className="w-2 h-2 bg-[#00F57A] rounded-full"></div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      Application Logged
                    </p>
                    <p className="text-gray-400 text-xs font-mono">
                      {new Date(application.appliedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {application.nextDate && (
                  <div className="flex items-center gap-3 p-2 rounded border border-gray-700">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {application.nextEvent || "Upcoming Event"}
                      </p>
                      <p className="text-cyan-400 text-xs font-mono">
                        {new Date(application.nextDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="void-card">
            <CardHeader>
              <CardTitle className="font-mono text-white">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start border-gray-700 text-gray-300 hover:bg-gray-800"
                onClick={() => {
                  const subject = `Follow up: ${application.position} at ${application.company}`;
                  const body = `Hi,\n\nI wanted to follow up on my application for the ${application.position} position at ${application.company}.\n\nBest regards`;
                  window.open(
                    `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                  );
                }}
              >
                Send Follow-up Email
              </Button>

              {application.jobUrl && (
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-700 text-gray-300 hover:bg-gray-800"
                  onClick={() => window.open(application.jobUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Original Job Post
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Application Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Application"
        description={`Are you sure you want to delete "${application.company} - ${application.position}"?\n\nThis will permanently delete:\n• The application record\n• ${documents.length} attached document(s)\n• All associated data\n\nThis action cannot be undone. Everything will be consumed by the void, forever.`}
        confirmText="Delete Forever"
        destructive={true}
      />

      {/* Delete Document Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteDocModal.isOpen}
        onClose={() =>
          setDeleteDocModal({ isOpen: false, documentId: "", documentName: "" })
        }
        onConfirm={confirmDeleteDocument}
        title="Delete Document"
        description={`Are you sure you want to delete "${deleteDocModal.documentName}"?\n\nThis document is attached to this application and will be permanently removed.\n\nThis action cannot be undone. The file will be consumed by the void, forever.`}
        confirmText="Delete Forever"
        destructive={true}
      />
    </div>
  );
}
