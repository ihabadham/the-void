import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  outreachApi,
  type LogOutreachPayload,
  type OutreachActionWithContact,
} from "@/lib/api-client";
import { ApiError } from "@/lib/api-client";

export function useLogOutreach() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: LogOutreachPayload) =>
      outreachApi.logOutreach(payload),
    onSuccess: (response, variables) => {
      toast({
        title: "Outreach logged",
        description: `Logged ${response.data?.length || 0} contacts into the void.`,
      });

      // Invalidate the application's outreach query if we have an applicationId
      if (variables.applicationId) {
        queryClient.invalidateQueries({
          queryKey: ["application", variables.applicationId, "outreach"],
        });
        // Also invalidate the message template query since we may have created/updated it
        queryClient.invalidateQueries({
          queryKey: ["application", variables.applicationId, "message"],
        });
      }

      // Invalidate any future global outreach queries
      queryClient.invalidateQueries({
        queryKey: ["outreach"],
      });
    },
    onError: (error: any) => {
      const message =
        error instanceof ApiError ? error.message : "Failed to log outreach";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });
}

export function useApplicationOutreach(applicationId: string) {
  return useQuery({
    queryKey: ["application", applicationId, "outreach"],
    queryFn: () => outreachApi.getApplicationOutreach(applicationId),
    select: (response) => (response.data as OutreachActionWithContact[]) || [],
    enabled: !!applicationId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useApplicationOutreachMessage(applicationId?: string) {
  return useQuery({
    queryKey: ["application", applicationId, "message"],
    queryFn: () => outreachApi.getApplicationOutreachMessage(applicationId!),
    select: (response) => response.data,
    enabled: !!applicationId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllOutreach(filters?: {
  status?: "pending" | "accepted" | "ignored" | "other";
  company?: string;
}) {
  return useQuery({
    queryKey: ["outreach", "all", filters],
    queryFn: () => outreachApi.getAllOutreach(filters),
    select: (response) => (response.data as OutreachActionWithContact[]) || [],
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateOutreachStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      actionId,
      status,
      respondedAt,
    }: {
      actionId: string;
      status: "pending" | "accepted" | "ignored" | "other";
      respondedAt?: string;
    }) => outreachApi.updateOutreachStatus(actionId, status, respondedAt),
    onSuccess: (response, variables) => {
      toast({
        title: "Status updated",
        description: `Outreach status changed to ${variables.status}.`,
      });

      // Invalidate all outreach queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["outreach"] });
    },
    onError: (error: any) => {
      const message =
        error instanceof ApiError ? error.message : "Failed to update status";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });
}
