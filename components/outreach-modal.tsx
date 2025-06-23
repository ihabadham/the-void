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
import { Loader2 } from "lucide-react";

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
  const [contactsText, setContactsText] = useState("");
  const [companyInput, setCompanyInput] = useState(company || "");

  const logMutation = useLogOutreach();

  const handleSubmit = async () => {
    const urls = contactsText
      .split(/\s|,|;/)
      .map((s) => s.trim())
      .filter((s) => s.length);

    if (urls.length === 0) {
      // TODO: toast error? we rely on backend validation but early return
      return;
    }

    try {
      await logMutation.mutateAsync({
        applicationId,
        company: applicationId ? undefined : companyInput || undefined,
        messageBody,
        contacts: urls,
      });
      // reset & close
      setMessageBody("");
      setContactsText("");
      if (!company) setCompanyInput("");
      setOpen(false);
    } catch (err) {
      // error toast handled in hook
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
            Paste one or more LinkedIn profile URLs. Separate with spaces,
            commas, or new lines. The note will be saved once per application.
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
          <Label className="font-mono text-gray-300">LinkedIn URLs</Label>
          <Textarea
            value={contactsText}
            onChange={(e) => setContactsText(e.target.value)}
            rows={4}
            className="bg-black border-gray-700 text-white font-mono"
            placeholder="https://linkedin.com/in/example\nhttps://linkedin.com/in/example2"
          />
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
