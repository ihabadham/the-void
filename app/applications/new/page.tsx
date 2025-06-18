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
import { CalendarIcon, Loader2, FileText, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateApplication } from "@/hooks/use-applications";
import type { CreateApplicationData } from "@/lib/api-client";

export default function NewApplicationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createApplicationMutation = useCreateApplication();

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
      onSuccess: () => {
        toast({
          title: "Application logged successfully",
          description: "Your application has been cast into the void.",
        });
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

            {/* File Upload Section - Currently disabled pending documents integration */}
            <div className="space-y-2">
              <Label className="text-gray-300 font-mono">Documents</Label>
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 font-mono text-sm mb-2">
                  Document upload will be available after Phase 3 migration
                </p>
                <p className="text-gray-500 font-mono text-xs">
                  CV/Resume, cover letter, portfolio links
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled
                  className="mt-4 border-gray-700 text-gray-500"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files (Coming Soon)
                </Button>
              </div>
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
