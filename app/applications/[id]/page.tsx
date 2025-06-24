"use client";

import React from "react";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Save,
  ExternalLink,
  Trash2,
  FileText,
  AlertCircle,
  Loader2,
  Upload,
  Eye,
  Download,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationModal } from "@/components/confirmation-modal";
import {
  useApplication,
  useUpdateApplication,
  useDeleteApplication,
} from "@/hooks/use-applications";
import {
  useApplicationDocuments,
  useCreateDocument,
  useDeleteDocument,
  useDocumentDownload,
} from "@/hooks/use-documents";
import type {
  CreateApplicationData,
  CreateDocumentData,
  Document,
} from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import { OutreachModal } from "@/components/outreach-modal";
import { useApplicationOutreach } from "@/hooks/use-outreach";

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

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateApplicationData>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    name: "",
    type: "other" as Document["type"],
  });
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

  // TanStack Query hooks
  const { data: application, isLoading, error, isError } = useApplication(id);

  const { data: documents = [], isLoading: documentsLoading } =
    useApplicationDocuments(id);

  const { data: outreachActions = [] } = useApplicationOutreach(id);

  const updateMutation = useUpdateApplication();
  const deleteMutation = useDeleteApplication();
  const createDocumentMutation = useCreateDocument();
  const deleteDocumentMutation = useDeleteDocument();
  const { getDownloadUrl } = useDocumentDownload();

  // Initialize form data when application data loads
  React.useEffect(() => {
    if (application && !isEditing) {
      setFormData({
        company: application.company,
        position: application.position,
        status: application.status,
        appliedDate: application.appliedDate,
        nextDate: application.nextDate || "",
        nextEvent: application.nextEvent || "",
        cvVersion: application.cvVersion || "",
        notes: application.notes || "",
        jobUrl: application.jobUrl || "",
      });
    }
  }, [application, isEditing]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const getDocumentTypeFromFile = (file: File): Document["type"] => {
    const name = file.name.toLowerCase();
    if (name.includes("cv") || name.includes("resume")) return "cv";
    if (name.includes("cover")) return "cover-letter";
    if (name.includes("portfolio")) return "portfolio";
    return "other";
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadData((prev) => ({
      ...prev,
      name: prev.name || file.name, // Use existing name or default to filename
      type: getDocumentTypeFromFile(file),
    }));
  };

  const handleDocumentUpload = async () => {
    if (!selectedFile || !uploadData.name.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a file and provide a name.",
        variant: "destructive",
      });
      return;
    }

    const uploadPayload: CreateDocumentData = {
      file: selectedFile,
      name: uploadData.name.trim(),
      type: uploadData.type,
      applicationId: id,
    };

    try {
      await createDocumentMutation.mutateAsync(uploadPayload);

      // Reset form
      setSelectedFile(null);
      setUploadData({ name: "", type: "other" });
      setShowUploadForm(false);

      // Reset file input
      const fileInput = document.getElementById(
        "document-upload"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const handleSave = async () => {
    if (!application) return;

    try {
      await updateMutation.mutateAsync({
        id: application.id,
        data: {
          ...formData,
          // Clean up empty strings to undefined
          nextDate: formData.nextDate?.trim() || undefined,
          nextEvent: formData.nextEvent?.trim() || undefined,
          cvVersion: formData.cvVersion?.trim() || undefined,
          notes: formData.notes?.trim() || undefined,
          jobUrl: formData.jobUrl?.trim() || undefined,
        },
      });

      setIsEditing(false);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const handleDelete = async () => {
    if (!application) return;

    try {
      await deleteMutation.mutateAsync(application.id);
      setShowDeleteModal(false);
      router.push("/applications");
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const handleDeleteDocument = (docId: string, docName: string) => {
    setDeleteDocModal({
      isOpen: true,
      documentId: docId,
      documentName: docName,
    });
  };

  const confirmDeleteDocument = async () => {
    try {
      await deleteDocumentMutation.mutateAsync(deleteDocModal.documentId);
      setDeleteDocModal({ isOpen: false, documentId: "", documentName: "" });
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const handleDownload = (doc: Document) => {
    const downloadUrl = getDownloadUrl(doc.id, { inline: false });
    window.open(downloadUrl, "_blank");
  };

  const handleView = (doc: Document) => {
    const viewUrl = getDownloadUrl(doc.id, { inline: true });
    window.open(viewUrl, "_blank");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <Link href="/applications">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <Skeleton className="h-8 w-48 mb-2 bg-gray-800" />
              <Skeleton className="h-4 w-32 bg-gray-800" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="void-card">
              <CardHeader>
                <Skeleton className="h-6 w-40 bg-gray-800" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full bg-gray-800" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="void-card">
              <CardHeader>
                <Skeleton className="h-6 w-24 bg-gray-800" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full bg-gray-800" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !application) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="font-mono text-xl text-white mb-2">
            Application Not Found
          </h2>
          <p className="text-gray-400 font-mono text-sm mb-4">
            {error instanceof Error
              ? error.message
              : "This application has been consumed by the void."}
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
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <Link href="/applications">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
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

          {/* Log Outreach Button */}
          <OutreachModal
            applicationId={id}
            company={application.company}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Log Outreach
              </Button>
            }
          />

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
                disabled={updateMutation.isPending}
                className="bg-[#00F57A] text-black hover:bg-[#00F57A]/90 disabled:opacity-50"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  // Reset form data to current application values
                  setFormData({
                    company: application.company,
                    position: application.position,
                    status: application.status,
                    appliedDate: application.appliedDate,
                    nextDate: application.nextDate || "",
                    nextEvent: application.nextEvent || "",
                    cvVersion: application.cvVersion || "",
                    notes: application.notes || "",
                    jobUrl: application.jobUrl || "",
                  });
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300 font-mono">
                        CV Version
                      </Label>
                      <Input
                        value={formData.cvVersion || ""}
                        onChange={(e) =>
                          handleInputChange("cvVersion", e.target.value)
                        }
                        placeholder="e.g., Senior_Dev_v2.1"
                        className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                      />
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
                        {formatDate(application.appliedDate)}
                      </p>
                    </div>
                    {application.nextDate && (
                      <div>
                        <Label className="text-gray-400 font-mono text-sm">
                          {application.nextEvent || "Next Event"}
                        </Label>
                        <p className="text-[#00F57A] font-mono">
                          {formatDate(application.nextDate)}
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-mono text-white">
                Attachments ({documents.length})
              </CardTitle>
              <Button
                onClick={() => setShowUploadForm(true)}
                size="sm"
                className="bg-[#00F57A] text-black hover:bg-[#00F57A]/90"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {/* Upload Form */}
              {showUploadForm && (
                <div className="mb-6 p-4 rounded border border-gray-700 bg-gray-900/50 space-y-4">
                  <h4 className="font-mono text-white text-sm">
                    Attach Document
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300 font-mono text-sm">
                        Select File
                      </Label>
                      <input
                        type="file"
                        id="document-upload"
                        className="w-full px-3 py-2 bg-black border border-gray-700 rounded-md text-white font-mono text-xs file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#00F57A] file:text-black file:text-xs"
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip"
                        onChange={handleFileSelect}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-300 font-mono text-sm">
                        Document Type
                      </Label>
                      <select
                        value={uploadData.type}
                        onChange={(e) =>
                          setUploadData((prev) => ({
                            ...prev,
                            type: e.target.value as Document["type"],
                          }))
                        }
                        className="w-full px-3 py-2 bg-black border border-gray-700 rounded-md text-white font-mono text-xs"
                      >
                        <option value="cv">CV/Resume</option>
                        <option value="cover-letter">Cover Letter</option>
                        <option value="portfolio">Portfolio</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300 font-mono text-sm">
                      Document Name
                    </Label>
                    <Input
                      value={uploadData.name}
                      onChange={(e) =>
                        setUploadData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="e.g., Senior_Developer_CV_v2.1"
                      className="bg-black border-gray-700 text-white placeholder:text-gray-500 text-sm"
                    />
                  </div>

                  {selectedFile && (
                    <div className="p-2 rounded border border-gray-600 bg-gray-800/50">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#00F57A]" />
                        <span className="text-white text-xs font-medium">
                          {selectedFile.name}
                        </span>
                        <span className="text-gray-400 text-xs">
                          ({formatFileSize(selectedFile.size)})
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleDocumentUpload}
                      disabled={
                        !selectedFile ||
                        !uploadData.name.trim() ||
                        createDocumentMutation.isPending
                      }
                      size="sm"
                      className="bg-[#00F57A] text-black hover:bg-[#00F57A]/90 disabled:opacity-50"
                    >
                      {createDocumentMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-1" />
                      )}
                      {createDocumentMutation.isPending
                        ? "Uploading..."
                        : "Upload"}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowUploadForm(false);
                        setSelectedFile(null);
                        setUploadData({ name: "", type: "other" });
                      }}
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Documents List */}
              {documentsLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="p-3 rounded border border-gray-700">
                      <Skeleton className="h-4 w-full mb-2 bg-gray-800" />
                      <Skeleton className="h-3 w-24 mb-2 bg-gray-800" />
                      <Skeleton className="h-8 w-full bg-gray-800" />
                    </div>
                  ))}
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 font-mono text-sm">
                    No documents attached to this application.
                    <br />
                    Cast files into the void to begin.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
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
                          <p>Uploaded: {formatDate(doc.uploadDate)}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(doc)}
                            className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                            className="border-gray-700 text-gray-300 hover:bg-gray-800"
                          >
                            <Download className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDeleteDocument(doc.id, doc.name)
                            }
                            disabled={deleteDocumentMutation.isPending}
                            className="border-red-700 text-red-400 hover:bg-red-900/20 disabled:opacity-50"
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

          {/* Outreach list */}
          <Card className="void-card">
            <CardHeader>
              <CardTitle className="font-mono text-white">Outreach</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {outreachActions.length === 0 ? (
                <p className="text-gray-400 font-mono text-sm">
                  /dev/null &gt; outreach – No humans have been pinged yet
                </p>
              ) : (
                outreachActions.map((action) => (
                  <div
                    key={action.id}
                    className="border-b border-gray-800 pb-3 last:border-b-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col flex-1 min-w-0">
                        <a
                          href={action.contact.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00F57A] font-mono text-sm hover:underline truncate"
                        >
                          {action.contact.fullName ||
                            action.contact.linkedinUrl}
                        </a>
                        {action.contact.headline && (
                          <span className="text-gray-400 font-mono text-xs mt-1">
                            {action.contact.headline}
                          </span>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-gray-500 font-mono text-xs">
                            Sent: {formatDate(action.sentAt)}
                          </span>
                          {action.respondedAt && (
                            <span className="text-cyan-400 font-mono text-xs">
                              Responded: {formatDate(action.respondedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge className="text-black font-mono text-xs bg-gray-500 capitalize ml-2 flex-shrink-0">
                        {action.status}
                      </Badge>
                    </div>
                  </div>
                ))
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
                      {formatDate(application.appliedDate)}
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
                        {formatDate(application.nextDate)}
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
        description={`Are you sure you want to delete "${deleteDocModal.documentName}"?\n\nThis document will be permanently removed from the void.\n\nThis action cannot be undone. The file will be consumed by the abyss, forever.`}
        confirmText="Delete Forever"
        destructive={true}
      />
    </div>
  );
}
