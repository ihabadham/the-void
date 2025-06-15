"use client";

import type React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export function NewApplicationForm() {
  const [formData, setFormData] = useState({
    company: "",
    position: "",
    status: "applied" as const,
    appliedDate: new Date().toISOString().split("T")[0],
    nextDate: "",
    nextEvent: "",
    notes: "",
    jobUrl: "",
  });
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

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
      setAttachedFiles((prev) => [...prev, newFile]);
    });

    // Reset file input
    event.target.value = "";
  };

  const removeFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((file) => file.id !== fileId));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate unique ID
      const applicationId = Date.now().toString();

      // Create new application
      const newApplication = {
        id: applicationId,
        ...formData,
        appliedDate:
          formData.appliedDate || new Date().toISOString().split("T")[0],
        attachments: attachedFiles.map((file) => file.id),
      };

      // Save attached files to documents with application reference
      const existingDocuments = localStorage.getItem("void-documents");
      const documents = existingDocuments ? JSON.parse(existingDocuments) : [];

      const newDocuments = attachedFiles.map((file) => ({
        id: file.id,
        name: file.name,
        type:
          file.name.toLowerCase().includes("cv") ||
          file.name.toLowerCase().includes("resume")
            ? "cv"
            : "other",
        uploadDate: new Date().toISOString(),
        size: file.size,
        url: file.url,
        applicationId: applicationId, // Link document to application
        applicationCompany: formData.company,
      }));

      documents.push(...newDocuments);
      localStorage.setItem("void-documents", JSON.stringify(documents));

      // Load existing applications
      const existing = localStorage.getItem("void-applications");
      const applications = existing ? JSON.parse(existing) : [];

      // Add new application
      applications.push(newApplication);

      // Save to localStorage
      localStorage.setItem("void-applications", JSON.stringify(applications));

      toast({
        title: "Application logged successfully",
        description: `Record committed to the void with ${attachedFiles.length} attachment(s).`,
      });

      router.push("/applications");
    } catch (error) {
      toast({
        title: "Error",
        description:
          "Failed to log application. The void rejected your offering.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="void-card max-w-2xl">
      <CardHeader>
        <CardTitle className="font-mono text-white">
          Application Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company" className="text-gray-300 font-mono">
                Company *
              </Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                placeholder="Enter company name"
                required
                className="bg-black border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position" className="text-gray-300 font-mono">
                Position *
              </Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleInputChange("position", e.target.value)}
                placeholder="Enter job title"
                required
                className="bg-black border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-gray-300 font-mono">
                Status
              </Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
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
              <Label htmlFor="appliedDate" className="text-gray-300 font-mono">
                Applied Date
              </Label>
              <Input
                id="appliedDate"
                type="date"
                value={formData.appliedDate}
                onChange={(e) =>
                  handleInputChange("appliedDate", e.target.value)
                }
                className="bg-black border-gray-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nextDate" className="text-gray-300 font-mono">
                Next Key Date
              </Label>
              <Input
                id="nextDate"
                type="date"
                value={formData.nextDate}
                onChange={(e) => handleInputChange("nextDate", e.target.value)}
                className="bg-black border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextEvent" className="text-gray-300 font-mono">
                Event Type
              </Label>
              <Input
                id="nextEvent"
                value={formData.nextEvent}
                onChange={(e) => handleInputChange("nextEvent", e.target.value)}
                placeholder="e.g., Interview, Assessment"
                className="bg-black border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobUrl" className="text-gray-300 font-mono">
              Job URL
            </Label>
            <Input
              id="jobUrl"
              type="url"
              value={formData.jobUrl}
              onChange={(e) => handleInputChange("jobUrl", e.target.value)}
              placeholder="https://..."
              className="bg-black border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          {/* File Upload Section */}
          <div className="space-y-2">
            <Label className="text-gray-300 font-mono">Attachments</Label>
            <div className="space-y-3">
              <div>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Attach Files (CV, Cover Letter, etc.)
                </Button>
              </div>

              {attachedFiles.length > 0 && (
                <div className="space-y-2">
                  {attachedFiles.map((file) => (
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
                        onClick={() => removeFile(file.id)}
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

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-gray-300 font-mono">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Additional notes, contacts, or preparation points..."
              rows={4}
              className="bg-black border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.company || !formData.position}
              className="bg-[#00F57A] text-black hover:bg-[#00F57A]/90 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Logging..." : "Log Application"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/applications")}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
