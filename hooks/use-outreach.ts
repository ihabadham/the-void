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
