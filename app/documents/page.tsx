"use client";

import type React from "react";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Search,
  Eye,
  Plus,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationModal } from "@/components/confirmation-modal";
import {
  useDocuments,
  useCreateDocument,
  useDeleteDocument,
  useDocumentDownload,
} from "@/hooks/use-documents";
import { useApplications } from "@/hooks/use-applications";
import type { Document, CreateDocumentData } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";

const documentTypes = {
  cv: { label: "CV/Resume", color: "bg-[#00F57A]" },
  "cover-letter": { label: "Cover Letter", color: "bg-blue-500" },
  portfolio: { label: "Portfolio", color: "bg-purple-500" },
  other: { label: "Other", color: "bg-gray-500" },
};

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    name: "",
    type: "other" as Document["type"],
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    documentId: string;
    documentName: string;
    applicationName: string;
  }>({
    isOpen: false,
    documentId: "",
    documentName: "",
    applicationName: "",
  });
  const { toast } = useToast();

  // TanStack Query hooks
  const {
    data: documents = [],
    isLoading: documentsLoading,
    error: documentsError,
  } = useDocuments();

  const { data: applicationsData, isLoading: applicationsLoading } =
    useApplications();

  const applications = applicationsData?.applications || [];

  const createDocumentMutation = useCreateDocument();
  const deleteDocumentMutation = useDeleteDocument();
  const { getDownloadUrl } = useDocumentDownload();

  // Filter documents based on search
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // Find application company name for search
        applications
          .find((app) => app.id === doc.applicationId)
          ?.company?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [documents, searchTerm, applications]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
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

  const getDocumentTypeFromFile = (file: File): Document["type"] => {
    const name = file.name.toLowerCase();
    if (name.includes("cv") || name.includes("resume")) return "cv";
    if (name.includes("cover")) return "cover-letter";
    if (name.includes("portfolio")) return "portfolio";
    return "other";
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedApplicationId || !uploadData.name.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a file, application, and provide a name.",
        variant: "destructive",
      });
      return;
    }

    const uploadPayload: CreateDocumentData = {
      file: selectedFile,
      name: uploadData.name.trim(),
      type: uploadData.type,
      applicationId: selectedApplicationId,
    };

    try {
      await createDocumentMutation.mutateAsync(uploadPayload);

      // Reset form
      setSelectedFile(null);
      setUploadData({ name: "", type: "other" });
      setSelectedApplicationId("");
      setShowUploadForm(false);

      // Reset file input
      const fileInput = document.getElementById(
        "file-upload"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const openDeleteModal = (doc: Document) => {
    const application = applications.find(
      (app) => app.id === doc.applicationId
    );
    setDeleteModal({
      isOpen: true,
      documentId: doc.id,
      documentName: doc.name,
      applicationName: application?.company || "Unknown Application",
    });
  };

  const confirmDelete = async () => {
    try {
      await deleteDocumentMutation.mutateAsync(deleteModal.documentId);
      setDeleteModal({
        isOpen: false,
        documentId: "",
        documentName: "",
        applicationName: "",
      });
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

  // Loading state
  if (documentsLoading || applicationsLoading) {
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="void-card">
              <CardContent className="p-4">
                <Skeleton className="h-6 w-full mb-2 bg-gray-800" />
                <Skeleton className="h-4 w-20 mb-3 bg-gray-800" />
                <Skeleton className="h-4 w-full mb-2 bg-gray-800" />
                <Skeleton className="h-8 w-full bg-gray-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (documentsError) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="font-mono text-xl text-white mb-2">
            Failed to Load Documents
          </h2>
          <p className="text-gray-400 font-mono text-sm mb-4">
            {documentsError instanceof Error
              ? documentsError.message
              : "The void seems to be experiencing technical difficulties."}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#00F57A] text-black hover:bg-[#00F57A]/90"
          >
            Retry Connection to the Void
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
          <div>
            <h1 className="font-mono text-3xl font-medium text-white">
              Documents
            </h1>
            <p className="text-gray-400 font-mono text-sm">
              {documents.length === 0
                ? "No documents cast into the void. Begin the attachment ritual."
                : `${documents.length} documents archived in the digital abyss.`}
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowUploadForm(true)}
          disabled={applications.length === 0}
          className="bg-[#00F57A] text-black hover:bg-[#00F57A]/90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Cast Document
        </Button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <Card className="void-card">
          <CardHeader>
            <CardTitle className="font-mono text-white">
              Document Upload Ritual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300 font-mono">Select File</Label>
                <input
                  type="file"
                  id="file-upload"
                  className="w-full px-3 py-2 bg-black border border-gray-700 rounded-md text-white font-mono text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-[#00F57A] file:text-black"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip"
                  onChange={handleFileSelect}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300 font-mono">
                  Target Application
                </Label>
                <select
                  value={selectedApplicationId}
                  onChange={(e) => setSelectedApplicationId(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-gray-700 rounded-md text-white font-mono text-sm"
                >
                  <option value="">Select application to haunt...</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.company} - {app.position}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300 font-mono">Document Name</Label>
                <Input
                  value={uploadData.name}
                  onChange={(e) =>
                    setUploadData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Senior_Developer_CV_v2.1"
                  className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300 font-mono">Document Type</Label>
                <select
                  value={uploadData.type}
                  onChange={(e) =>
                    setUploadData((prev) => ({
                      ...prev,
                      type: e.target.value as Document["type"],
                    }))
                  }
                  className="w-full px-3 py-2 bg-black border border-gray-700 rounded-md text-white font-mono text-sm"
                >
                  <option value="cv">CV/Resume</option>
                  <option value="cover-letter">Cover Letter</option>
                  <option value="portfolio">Portfolio</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {selectedFile && (
              <div className="p-3 rounded border border-gray-700 bg-gray-900/50">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#00F57A]" />
                  <span className="text-white text-sm font-medium">
                    {selectedFile.name}
                  </span>
                  <span className="text-gray-400 text-xs">
                    ({formatFileSize(selectedFile.size)})
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={
                  !selectedFile ||
                  !selectedApplicationId ||
                  !uploadData.name.trim() ||
                  createDocumentMutation.isPending
                }
                className="bg-[#00F57A] text-black hover:bg-[#00F57A]/90 disabled:opacity-50"
              >
                {createDocumentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {createDocumentMutation.isPending
                  ? "Uploading..."
                  : "Upload to Void"}
              </Button>
              <Button
                onClick={() => {
                  setShowUploadForm(false);
                  setSelectedFile(null);
                  setUploadData({ name: "", type: "other" });
                  setSelectedApplicationId("");
                }}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel Ritual
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <Card className="void-card">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search documents or companies in the void..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-black border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      {applications.length === 0 ? (
        <Card className="void-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="font-mono text-lg text-white mb-2">
                No Applications Found
              </h3>
              <p className="text-gray-500 font-mono text-sm">
                Cast applications into the void before uploading documents.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : documents.length === 0 ? (
        <Card className="void-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="font-mono text-lg text-white mb-2">
                The Document Void Awaits
              </h3>
              <p className="text-gray-500 font-mono text-sm mb-4">
                No files have been cast into the digital abyss. Begin by
                uploading your first document.
              </p>
              <Button
                onClick={() => setShowUploadForm(true)}
                className="bg-[#00F57A] text-black hover:bg-[#00F57A]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Begin Document Ritual
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredDocuments.length === 0 && documents.length > 0 ? (
        <Card className="void-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="font-mono text-lg text-white mb-2">
                No Matching Documents
              </h3>
              <p className="text-gray-500 font-mono text-sm">
                Your search yielded no results from the void.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        filteredDocuments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => {
              const docType = documentTypes[doc.type];
              const application = applications.find(
                (app) => app.id === doc.applicationId
              );
              return (
                <Card
                  key={doc.id}
                  className="void-card hover:border-gray-600 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-[#00F57A] flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-white text-sm font-medium truncate">
                            {doc.name}
                          </h3>
                          <span
                            className={`${docType.color} text-black text-xs font-mono px-2 py-1 rounded mt-1 inline-block`}
                          >
                            {docType.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-400 font-mono mb-3 space-y-1">
                      <p>Application: {application?.company || "Unknown"}</p>
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
                        onClick={() => openDeleteModal(doc)}
                        disabled={deleteDocumentMutation.isPending}
                        className="border-red-700 text-red-400 hover:bg-red-900/20 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* Document Stats */}
      {documents.length > 0 && (
        <Card className="void-card">
          <CardHeader>
            <CardTitle className="font-mono text-white">
              Void Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(documentTypes).map(([type, config]) => {
                const count = documents.filter(
                  (doc) => doc.type === type
                ).length;
                return (
                  <div
                    key={type}
                    className="text-center p-4 rounded border border-gray-700"
                  >
                    <p className="text-2xl font-mono font-bold text-white">
                      {count}
                    </p>
                    <p className="text-gray-400 text-sm font-mono">
                      {config.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({
            isOpen: false,
            documentId: "",
            documentName: "",
            applicationName: "",
          })
        }
        onConfirm={confirmDelete}
        title="Delete Document"
        description={`Are you sure you want to delete "${deleteModal.documentName}"?\n\nThis document is attached to ${deleteModal.applicationName} and will be permanently removed from the void.\n\nThis action cannot be undone. The file will be consumed by the abyss, forever.`}
        confirmText="Delete Forever"
        destructive={true}
      />
    </div>
  );
}
