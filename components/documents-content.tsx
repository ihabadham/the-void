"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Search,
  Eye,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationModal } from "@/components/confirmation-modal";
import useSWR from "swr";

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

interface Application {
  id: string;
  company: string;
  position: string;
}

interface DocumentsData {
  documents: Document[];
  applications: Application[];
}

// SWR fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function DocumentsContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
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

  // Use SWR for data fetching with caching
  const {
    data,
    error,
    isLoading,
    mutate: mutateDocuments,
  } = useSWR<DocumentsData>("/api/documents", fetcher);

  // Use useMemo to prevent infinite re-renders
  const documents = useMemo(() => data?.documents || [], [data?.documents]);
  const applications = useMemo(
    () => data?.applications || [],
    [data?.applications]
  );

  // Filter documents based on search term
  const filteredDocuments = useMemo(() => {
    return documents.filter(
      (doc) =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.applicationCompany.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [documents, searchTerm]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !selectedApplicationId) return;

    const selectedApp = applications.find(
      (app) => app.id === selectedApplicationId
    );
    if (!selectedApp) return;

    try {
      // Upload file via API
      const formData = new FormData();
      formData.append("file", file);
      formData.append("applicationId", selectedApplicationId);
      formData.append(
        "type",
        file.name.toLowerCase().includes("cv") ||
          file.name.toLowerCase().includes("resume")
          ? "cv"
          : file.name.toLowerCase().includes("cover")
            ? "cover-letter"
            : "other"
      );

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload document");
      }

      // Refresh data from server
      await mutateDocuments();

      toast({
        title: "Document uploaded",
        description: `${file.name} has been attached to ${selectedApp.company}.`,
      });

      // Reset form
      event.target.value = "";
      setShowUploadForm(false);
      setSelectedApplicationId("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload document.",
        variant: "destructive",
      });
    }
  };

  const openDeleteModal = (doc: Document) => {
    setDeleteModal({
      isOpen: true,
      documentId: doc.id,
      documentName: doc.name,
      applicationName: doc.applicationCompany,
    });
  };

  const confirmDelete = async () => {
    const { documentId } = deleteModal;

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      // Refresh data from server
      await mutateDocuments();

      toast({
        title: "Document deleted",
        description: "File consumed by the void.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document.",
        variant: "destructive",
      });
    }

    setDeleteModal({
      isOpen: false,
      documentId: "",
      documentName: "",
      applicationName: "",
    });
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

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 font-mono text-sm">
          Error loading documents from the void...
        </p>
      </div>
    );
  }

  const documentTypes = {
    cv: { label: "CV/Resume", color: "bg-[#00F57A]" },
    "cover-letter": { label: "Cover Letter", color: "bg-blue-500" },
    portfolio: { label: "Portfolio", color: "bg-purple-500" },
    other: { label: "Other", color: "bg-gray-500" },
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Header Content */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 font-mono text-sm">
            {documents.length === 0
              ? "No documents in the void. Attach files to your applications."
              : `${documents.length} documents stored in the void.`}
          </p>
        </div>
        <Button
          onClick={() => setShowUploadForm(true)}
          disabled={applications.length === 0}
          className="bg-[#00F57A] text-black hover:bg-[#00F57A]/90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <Card className="void-card">
          <CardHeader>
            <CardTitle className="font-mono text-white">
              Add Document to Application
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-gray-300 font-mono text-sm">
                Select Application *
              </label>
              <select
                value={selectedApplicationId}
                onChange={(e) => setSelectedApplicationId(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-gray-700 rounded-md text-white font-mono text-sm"
              >
                <option value="">Choose an application...</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.company} - {app.position}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                disabled={!selectedApplicationId}
              />
              <Button
                onClick={() => document.getElementById("file-upload")?.click()}
                disabled={!selectedApplicationId}
                className="bg-[#00F57A] text-black hover:bg-[#00F57A]/90 disabled:opacity-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              <Button
                onClick={() => {
                  setShowUploadForm(false);
                  setSelectedApplicationId("");
                }}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      {documents.length > 0 && (
        <Card className="void-card">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search documents or companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <Card className="void-card">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="font-mono text-xl text-gray-400 mb-2">
              No Documents Found
            </h3>
            <p className="text-gray-500 font-mono text-sm mb-6">
              The void awaits your documents. Upload files to organize your job
              application materials.
            </p>
            {applications.length === 0 ? (
              <p className="text-gray-500 font-mono text-sm">
                You need to create at least one application before uploading
                documents.
              </p>
            ) : (
              <Button
                onClick={() => setShowUploadForm(true)}
                className="bg-[#00F57A] text-black hover:bg-[#00F57A]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload First Document
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map((doc) => {
            const docType = documentTypes[doc.type];
            return (
              <Card
                key={doc.id}
                className="void-card hover:border-gray-600 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-[#00F57A] flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-sm font-medium truncate">
                          {doc.name}
                        </p>
                        <span
                          className={`${docType.color} text-black text-xs font-mono px-2 py-1 rounded inline-block mt-1`}
                        >
                          {docType.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="text-xs text-gray-400 font-mono">
                      <p>Application: {doc.applicationCompany}</p>
                      <p>Size: {formatFileSize(doc.size)}</p>
                      <p>
                        Uploaded:{" "}
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {doc.url && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.url, "_blank")}
                          className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>

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
                      </>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteModal(doc)}
                      className="border-red-700 text-red-400 hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
        description={`Are you sure you want to delete "${deleteModal.documentName}"?\n\nThis document is attached to: ${deleteModal.applicationName}\n\nThis action cannot be undone. The file will be consumed by the void, forever.`}
        confirmText="Delete Forever"
        destructive={true}
      />
    </div>
  );
}
