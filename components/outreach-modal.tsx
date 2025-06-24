"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogOutreach } from "@/hooks/use-outreach";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function isValidLinkedInUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.hostname === "linkedin.com" ||
        parsed.hostname === "www.linkedin.com") &&
      (parsed.pathname.startsWith("/in/") ||
        parsed.pathname.startsWith("/company/") ||
        parsed.pathname.startsWith("/pub/"))
    );
  } catch {
    return false;
  }
}
interface OutreachModalProps {
  applicationId?: string;
  company?: string;
  trigger: React.ReactNode;
}

export function OutreachModal({
  applicationId,
  company,
  trigger,
}: OutreachModalProps) {
  const [open, setOpen] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const [linkedinUrls, setLinkedinUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [companyInput, setCompanyInput] = useState(company || "");

  const logMutation = useLogOutreach();
  const { toast } = useToast();

  const handleUrlInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addUrl();
    }
  };

  const addUrl = () => {
    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) return;

    if (!isValidLinkedInUrl(trimmedUrl)) {
      toast({
        title: "Invalid URL",
        description:
          "Please enter a valid LinkedIn profile URL (linkedin.com/in/...)",
        variant: "destructive",
      });
      return;
    }

    if (linkedinUrls.includes(trimmedUrl)) {
      toast({
        title: "Duplicate URL",
        description: "This LinkedIn URL has already been added",
        variant: "destructive",
      });
      return;
    }

    setLinkedinUrls([...linkedinUrls, trimmedUrl]);
    setUrlInput("");
  };

  const removeUrl = (urlToRemove: string) => {
    setLinkedinUrls(linkedinUrls.filter((url) => url !== urlToRemove));
  };

  const handleSubmit = async () => {
    if (linkedinUrls.length === 0) {
      toast({
        title: "No URLs provided",
        description:
          "Please add at least one LinkedIn URL before logging outreach",
        variant: "destructive",
      });
      return;
    }

    try {
      await logMutation.mutateAsync({
        applicationId,
        company: applicationId ? undefined : companyInput || undefined,
        messageBody,
        contacts: linkedinUrls,
      });
      // Reset & close
      setMessageBody("");
      setLinkedinUrls([]);
      setUrlInput("");
      if (!company) setCompanyInput("");
      setOpen(false);
    } catch (err) {
      // Error toast handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="void-card w-full sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-white">
            Log LinkedIn Outreach
          </DialogTitle>
          <DialogDescription className="font-mono text-gray-400 text-sm">
            Add LinkedIn profile URLs one by one. Press Enter or comma to add
            each URL. The note will be saved once per application.
          </DialogDescription>
        </DialogHeader>

        {!applicationId && (
          <div className="space-y-2">
            <Label className="font-mono text-gray-300">Company</Label>
            <Input
              value={companyInput}
              onChange={(e) => setCompanyInput(e.target.value)}
              className="bg-black border-gray-700 text-white"
              placeholder="ACME Corp"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label className="font-mono text-gray-300">Note</Label>
          <Textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            rows={4}
            className="bg-black border-gray-700 text-white font-mono"
            placeholder="Hi there, I just applied ..."
          />
        </div>

        <div className="space-y-2">
          <Label className="font-mono text-gray-300">
            LinkedIn URLs ({linkedinUrls.length})
          </Label>

          {/* URL Tags Display */}
          {linkedinUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-black border border-gray-700 rounded-md min-h-[60px]">
              {linkedinUrls.map((url, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-[#00F57A]/20 border border-[#00F57A]/30 rounded text-xs font-mono text-[#00F57A]"
                >
                  <span className="truncate max-w-[200px]">{url}</span>
                  <button
                    type="button"
                    onClick={() => removeUrl(url)}
                    className="hover:bg-[#00F57A]/30 rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* URL Input */}
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={handleUrlInputKeyDown}
              className="bg-black border-gray-700 text-white font-mono flex-1"
              placeholder="https://linkedin.com/in/example"
            />
            <Button
              type="button"
              onClick={addUrl}
              disabled={!urlInput.trim()}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Add
            </Button>
          </div>

          <p className="text-xs text-gray-500 font-mono">
            Press Enter or comma to add URLs • /dev/null &gt; duplicate URLs
          </p>
        </div>

        <DialogFooter className="mt-4">
          <Button
            onClick={handleSubmit}
            disabled={logMutation.isPending}
            className="bg-[#00F57A] text-black hover:bg-[#00F57A]/90 disabled:opacity-50"
          >
            {logMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {logMutation.isPending ? "Logging..." : "Log Outreach"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
