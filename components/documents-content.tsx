"use client";

import type React from "react";
import { useState, useEffect } from "react";
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

const documentTypes = {
  cv: { label: "CV/Resume", color: "bg-[#00F57A]" },
  "cover-letter": { label: "Cover Letter", color: "bg-blue-500" },
  portfolio: { label: "Portfolio", color: "bg-purple-500" },
  other: { label: "Other", color: "bg-gray-500" },
};

// SWR fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function DocumentsContent() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
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
  const { data, error, isLoading } = useSWR<DocumentsData>(
    "/api/documents",
    fetcher
  );

  useEffect(() => {
    // Load from localStorage for now, prioritize database data when available
    const storedDocs = localStorage.getItem("void-documents");
    const storedApps = localStorage.getItem("void-applications");

    if (data?.documents && data?.applications) {
      // Use database data when available
      setDocuments(data.documents);
      setApplications(data.applications);
      setFilteredDocuments(data.documents);
    } else {
      // Fallback to localStorage
      if (storedDocs) {
        const docs = JSON.parse(storedDocs);
        setDocuments(docs);
        setFilteredDocuments(docs);
      }

      if (storedApps) {
        const apps = JSON.parse(storedApps);
        setApplications(
          apps.map((app: any) => ({
            id: app.id,
            company: app.company,
            position: app.position,
          }))
        );
      }
    }
  }, [data]);

  useEffect(() => {
    // Filter documents based on search
    const filtered = documents.filter(
      (doc) =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.applicationCompany.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDocuments(filtered);
  }, [documents, searchTerm]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedApplicationId) return;

    const selectedApp = applications.find(
      (app) => app.id === selectedApplicationId
    );
    if (!selectedApp) return;

    // Create new document
    const newDocument: Document = {
      id: Date.now().toString(),
      name: file.name,
      type:
        file.name.toLowerCase().includes("cv") ||
        file.name.toLowerCase().includes("resume")
          ? "cv"
          : file.name.toLowerCase().includes("cover")
            ? "cover-letter"
            : "other",
      uploadDate: new Date().toISOString(),
      size: file.size,
      url: URL.createObjectURL(file),
      applicationId: selectedApplicationId,
      applicationCompany: selectedApp.company,
    };

    const updatedDocuments = [...documents, newDocument];
    setDocuments(updatedDocuments);
    localStorage.setItem("void-documents", JSON.stringify(updatedDocuments));

    toast({
      title: "Document uploaded",
      description: `${file.name} has been attached to ${selectedApp.company}.`,
    });

    // Reset form
    event.target.value = "";
    setShowUploadForm(false);
    setSelectedApplicationId("");
  };

  const openDeleteModal = (doc: Document) => {
    setDeleteModal({
      isOpen: true,
      documentId: doc.id,
      documentName: doc.name,
      applicationName: doc.applicationCompany,
    });
  };

  const confirmDelete = () => {
    const { documentId } = deleteModal;

    const updatedDocuments = documents.filter((doc) => doc.id !== documentId);
    setDocuments(updatedDocuments);
    localStorage.setItem("void-documents", JSON.stringify(updatedDocuments));

    toast({
      title: "Document deleted",
      description: "File consumed by the void.",
    });

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
                variant="outline"
                onClick={() => {
                  setShowUploadForm(false);
                  setSelectedApplicationId("");
                }}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>

            {!selectedApplicationId && (
              <p className="text-gray-500 text-sm font-mono">
                Select an application first to attach the document.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Applications Warning */}
      {applications.length === 0 && (
        <Card className="void-card border-yellow-700">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-center">
              <FileText className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-mono text-lg text-white mb-2">
                No Applications Found
              </h3>
              <p className="text-yellow-400 font-mono text-sm mb-4">
                You need to log at least one application before you can attach
                documents.
              </p>
              <Button
                onClick={() => (window.location.href = "/applications/new")}
                className="bg-[#00F57A] text-black hover:bg-[#00F57A]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Log First Application
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      {documents.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search documents or companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black border-gray-700 text-white placeholder:text-gray-500"
          />
        </div>
      )}

      {/* Documents Grid */}
      {filteredDocuments.length === 0 && documents.length > 0 ? (
        <Card className="void-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="font-mono text-lg text-white mb-2">
                No Matching Documents
              </h3>
              <p className="text-gray-500 font-mono text-sm">
                Try adjusting your search criteria.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        filteredDocuments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => {
              const docType = documentTypes[doc.type];

              return (
                <Card
                  key={doc.id}
                  className="void-card hover:border-gray-600 transition-colors"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="h-8 w-8 text-[#00F57A]" />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="font-mono text-white text-sm truncate">
                            {doc.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`${docType.color} text-black text-xs font-mono px-2 py-1 rounded`}
                            >
                              {docType.label}
                            </span>
                          </div>
                          {/* Application Reference */}
                          <div className="mt-2 p-2 rounded border border-gray-700 bg-gray-900/50">
                            <p className="text-[#00F57A] text-xs font-mono">
                              Attached to:
                            </p>
                            <p className="text-white text-xs font-medium">
                              {doc.applicationCompany}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-gray-400 space-y-1">
                      <p className="font-mono">
                        Size: {formatFileSize(doc.size)}
                      </p>
                      <p className="font-mono">
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
                          <Eye className="h-4 w-4 mr-2" />
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
        )
      )}

      {/* Document Stats */}
      {documents.length > 0 && (
        <Card className="void-card">
          <CardHeader>
            <CardTitle className="font-mono text-white">
              Document Statistics
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
        description={`Are you sure you want to delete "${deleteModal.documentName}"?\n\nThis document is attached to: ${deleteModal.applicationName}\n\nThis action cannot be undone. The file will be consumed by the void, forever.`}
        confirmText="Delete Forever"
        destructive={true}
      />
    </div>
  );
}
