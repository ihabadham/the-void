// TanStack Query hooks for settings API

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { settingsApi, type UserSettings, ApiError } from "@/lib/api-client";

// Query keys for consistent caching
export const settingsKeys = {
  all: ["settings"] as const,
  user: () => [...settingsKeys.all, "user"] as const,
};

// Hook to get user settings
export function useSettings() {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: settingsKeys.user(),
    queryFn: () => settingsApi.getSettings(),
    // Transform the response to return just the data with defaults
    select: (response) =>
      response.data || {
        notifications: true,
        autoSync: false,
        darkMode: true,
        emailReminders: true,
        exportFormat: "json" as const,
        dataRetention: 365,
      },
    // Cache for 10 minutes since settings change infrequently
    staleTime: 10 * 60 * 1000,
    // Only run when user is authenticated
    enabled: !!session && status === "authenticated",
  });
}

// Hook to update user settings
export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Partial<UserSettings>) =>
      settingsApi.updateSettings(data),

    // Optimistic update
    onMutate: async (newSettings) => {
      // Cancel any outgoing queries for settings
      await queryClient.cancelQueries({ queryKey: settingsKeys.user() });

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData(settingsKeys.user());

      // Optimistically update settings
      queryClient.setQueryData(settingsKeys.user(), (old: any) => ({
        ...old,
        ...newSettings,
        updatedAt: new Date().toISOString(),
      }));

      return { previousSettings };
    },

    // On success, update with real data
    onSuccess: (response) => {
      if (response.data) {
        queryClient.setQueryData(settingsKeys.user(), response.data);
      }

      toast({
        title: "Settings saved",
        description: "Configuration committed to the void.",
      });
    },

    // On error, rollback optimistic updates
    onError: (error, variables, context) => {
      // Restore previous data
      if (context?.previousSettings) {
        queryClient.setQueryData(settingsKeys.user(), context.previousSettings);
      }

      const errorMessage =
        error instanceof ApiError ? error.message : "Failed to save settings";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },

    // Always refetch after mutation completes
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.user() });
    },
  });
}

// Hook to export user data
export function useExportData() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => settingsApi.exportData(),

    onSuccess: (response) => {
      toast({
        title: "Data exported",
        description: "Your data has been extracted from the void.",
      });
      return response.data;
    },

    onError: (error) => {
      const errorMessage =
        error instanceof ApiError ? error.message : "Failed to export data";

      toast({
        title: "Export failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}
