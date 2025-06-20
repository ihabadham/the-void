"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2, FileText, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateApplication } from "@/hooks/use-applications";
import { useCreateDocument } from "@/hooks/use-documents";
import type {
  CreateApplicationData,
  CreateDocumentData,
} from "@/lib/api-client";

export default function NewApplicationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createApplicationMutation = useCreateApplication();
  const createDocumentMutation = useCreateDocument();

  const [formData, setFormData] = useState<CreateApplicationData>({
    company: "",
    position: "",
    jobUrl: "",
    appliedDate: new Date().toISOString().split("T")[0],
    status: "applied",
    nextEvent: "",
    nextDate: "",
    notes: "",
    cvVersion: "",
  });

  const [nextDateCalendar, setNextDateCalendar] = useState<Date>();

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<
    Array<{
      file: File;
      name: string;
      type: "cv" | "cover-letter" | "portfolio" | "other";
    }>
  >([]);

  const handleInputChange = (
    field: keyof CreateApplicationData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setNextDateCalendar(date);
    setFormData((prev) => ({
      ...prev,
      nextDate: date ? date.toISOString().split("T")[0] : "",
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files).map((file) => ({
      file,
      name: file.name,
      type: "other" as const,
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);

    // Reset the input
    event.target.value = "";
  };

  const updateFileMetadata = (
    index: number,
    field: "name" | "type",
    value: string
  ) => {
    setSelectedFiles((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clean data: remove empty strings to avoid validation errors
    const cleanedData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key,
        typeof value === "string" && value.trim() === "" ? undefined : value,
      ])
    ) as CreateApplicationData;

    createApplicationMutation.mutate(cleanedData, {
      onSuccess: async (applicationResponse) => {
        const newApplicationId = applicationResponse.data?.id;

        if (!newApplicationId) {
          toast({
            title: "Application logged successfully",
            description: "Your application has been cast into the void.",
          });
          router.push("/applications");
          return;
        }

        // Upload files if any were selected
        if (selectedFiles.length > 0) {
          toast({
            title: "Application created",
            description: `Uploading ${selectedFiles.length} document(s)...`,
          });

          try {
            // Upload all files
            await Promise.all(
              selectedFiles.map((fileItem) => {
                const documentData: CreateDocumentData = {
                  file: fileItem.file,
                  name: fileItem.name,
                  type: fileItem.type,
                  applicationId: newApplicationId,
                };
                return createDocumentMutation.mutateAsync(documentData);
              })
            );

            toast({
              title: "Success",
              description:
                "Application and documents have been cast into the void.",
            });
          } catch (error) {
            toast({
              title: "Application created, but document upload failed",
              description:
                "You can upload documents later from the application details page.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Application logged successfully",
            description: "Your application has been cast into the void.",
          });
        }

        router.push("/applications");
      },
      onError: (error) => {
        toast({
          title: "Failed to log application",
          description: error.message || "The void rejected your offering.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="font-mono text-3xl font-medium text-white">
            Log New Application
          </h1>
          <p className="text-gray-400 font-mono text-sm">
            Cast another application into the digital abyss
          </p>
        </div>
      </div>

      <Card className="void-card max-w-2xl">
        <CardHeader>
          <CardTitle className="font-mono text-white">
            Application Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company" className="text-gray-300 font-mono">
                  Company Name *
                </Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="text-gray-300 font-mono">
                  Position *
                </Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) =>
                    handleInputChange("position", e.target.value)
                  }
                  className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                  placeholder="Enter position title"
                  required
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
                className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                placeholder="https://company.com/jobs/role"
              />
            </div>

            {/* Application Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="appliedDate"
                  className="text-gray-300 font-mono"
                >
                  Applied Date *
                </Label>
                <Input
                  id="appliedDate"
                  type="date"
                  value={formData.appliedDate}
                  onChange={(e) =>
                    handleInputChange("appliedDate", e.target.value)
                  }
                  className="bg-black border-gray-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300 font-mono">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger className="bg-black border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-gray-700">
                    <SelectItem
                      value="applied"
                      className="text-white hover:bg-gray-800"
                    >
                      Applied
                    </SelectItem>
                    <SelectItem
                      value="assessment"
                      className="text-white hover:bg-gray-800"
                    >
                      Assessment
                    </SelectItem>
                    <SelectItem
                      value="interview"
                      className="text-white hover:bg-gray-800"
                    >
                      Interview
                    </SelectItem>
                    <SelectItem
                      value="offer"
                      className="text-white hover:bg-gray-800"
                    >
                      Offer
                    </SelectItem>
                    <SelectItem
                      value="rejected"
                      className="text-white hover:bg-gray-800"
                    >
                      Rejected
                    </SelectItem>
                    <SelectItem
                      value="withdrawn"
                      className="text-white hover:bg-gray-800"
                    >
                      Withdrawn
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Next Event */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nextEvent" className="text-gray-300 font-mono">
                  Next Event
                </Label>
                <Input
                  id="nextEvent"
                  value={formData.nextEvent}
                  onChange={(e) =>
                    handleInputChange("nextEvent", e.target.value)
                  }
                  className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                  placeholder="e.g., Phone screen, Technical interview"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300 font-mono">Next Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-black border-gray-700 text-white hover:bg-gray-800",
                        !nextDateCalendar && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {nextDateCalendar ? (
                        format(nextDateCalendar, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-black border-gray-700">
                    <Calendar
                      mode="single"
                      selected={nextDateCalendar}
                      onSelect={handleDateSelect}
                      initialFocus
                      className="bg-black text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* CV Version */}
            <div className="space-y-2">
              <Label htmlFor="cvVersion" className="text-gray-300 font-mono">
                CV/Resume Version
              </Label>
              <Input
                id="cvVersion"
                value={formData.cvVersion}
                onChange={(e) => handleInputChange("cvVersion", e.target.value)}
                className="bg-black border-gray-700 text-white placeholder:text-gray-500"
                placeholder="e.g., Software Engineer v2.1, Frontend Specialist"
              />
            </div>

            {/* Notes Section */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-gray-300 font-mono">
                Notes & Details
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="bg-black border-gray-700 text-white placeholder:text-gray-500 min-h-[120px]"
                placeholder="Requirements, qualifications, company culture, contact details, interview prep notes..."
              />
              <p className="text-xs text-gray-500 font-mono">
                Use this field for requirements, interview preparation, company
                research, or any other relevant details.
              </p>
            </div>

            {/* File Upload Section */}
            <div className="space-y-4">
              <Label className="text-gray-300 font-mono">Documents</Label>

              {/* File Selection */}
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 font-mono text-sm mb-2">
                  Upload CV, cover letter, or other documents
                </p>
                <p className="text-gray-500 font-mono text-xs mb-4">
                  PDF, DOC, DOCX, TXT, images (max 50MB each)
                </p>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select Files
                </Button>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-gray-400 font-mono text-sm">
                    Selected Files ({selectedFiles.length})
                  </Label>
                  {selectedFiles.map((fileItem, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700"
                    >
                      <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Input
                          value={fileItem.name}
                          onChange={(e) =>
                            updateFileMetadata(index, "name", e.target.value)
                          }
                          className="bg-black border-gray-700 text-white text-sm"
                          placeholder="Document name"
                        />
                        <Select
                          value={fileItem.type}
                          onValueChange={(value) =>
                            updateFileMetadata(index, "type", value)
                          }
                        >
                          <SelectTrigger className="bg-black border-gray-700 text-white text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-black border-gray-700">
                            <SelectItem
                              value="cv"
                              className="text-white hover:bg-gray-800"
                            >
                              CV/Resume
                            </SelectItem>
                            <SelectItem
                              value="cover-letter"
                              className="text-white hover:bg-gray-800"
                            >
                              Cover Letter
                            </SelectItem>
                            <SelectItem
                              value="portfolio"
                              className="text-white hover:bg-gray-800"
                            >
                              Portfolio
                            </SelectItem>
                            <SelectItem
                              value="other"
                              className="text-white hover:bg-gray-800"
                            >
                              Other
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="text-xs text-gray-500 font-mono">
                        {(fileItem.file.size / 1024 / 1024).toFixed(1)}MB
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-gray-400 hover:text-red-400 hover:bg-red-900/20"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createApplicationMutation.isPending}
                className="bg-[#00F57A] text-black hover:bg-[#00F57A]/90"
              >
                {createApplicationMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Logging...
                  </>
                ) : (
                  "Log Application"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
