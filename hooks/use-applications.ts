// TanStack Query hooks for applications API

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import {
  applicationsApi,
  type Application,
  type ApplicationsQueryParams,
  type CreateApplicationData,
  ApiError,
} from "@/lib/api-client";

// Query keys for consistent caching
export const applicationKeys = {
  all: ["applications"] as const,
  lists: () => [...applicationKeys.all, "list"] as const,
  list: (params: ApplicationsQueryParams) =>
    [...applicationKeys.lists(), params] as const,
  details: () => [...applicationKeys.all, "detail"] as const,
  detail: (id: string) => [...applicationKeys.details(), id] as const,
};

// Hook to get applications list with optional filtering and pagination
export function useApplications(params: ApplicationsQueryParams = {}) {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: applicationKeys.list(params),
    queryFn: () => applicationsApi.getApplications(params),
    // Transform the response to return just the data
    select: (response) => ({
      applications: response.data || [],
      pagination: response.pagination,
    }),
    // Enable background refetching
    refetchOnWindowFocus: true,
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Only run when user is authenticated
    enabled: !!session && status === "authenticated",
  });
}

// Hook to get a single application by ID
export function useApplication(id: string) {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () => applicationsApi.getApplication(id),
    // Transform the response to return just the data
    select: (response) => response.data,
    // Don't refetch if we have data and user is just navigating
    refetchOnWindowFocus: false,
    // Cache for 10 minutes since individual records change less frequently
    staleTime: 10 * 60 * 1000,
    // Don't run if no ID provided or user not authenticated
    enabled: !!id && !!session && status === "authenticated",
  });
}

// Hook to create a new application
export function useCreateApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateApplicationData) =>
      applicationsApi.createApplication(data),

    // Optimistic update - add the new application immediately
    onMutate: async (newApplication) => {
      // Cancel any outgoing queries for applications list
      await queryClient.cancelQueries({ queryKey: applicationKeys.lists() });

      // Snapshot the previous value
      const previousApplications = queryClient.getQueriesData({
        queryKey: applicationKeys.lists(),
      });

      // Optimistically update all application lists
      queryClient.setQueriesData(
        { queryKey: applicationKeys.lists() },
        (old: any) => {
          if (!old?.data) return old;

          // Create optimistic application with temporary ID
          const optimisticApp: Application = {
            id: `temp-${Date.now()}`,
            ...newApplication,
            appliedDate:
              newApplication.appliedDate ||
              new Date().toISOString().split("T")[0],
            status: newApplication.status || "applied",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          return {
            ...old,
            data: [optimisticApp, ...old.data],
            pagination: old.pagination
              ? {
                  ...old.pagination,
                  total: old.pagination.total + 1,
                }
              : undefined,
          };
        }
      );

      return { previousApplications };
    },

    // On success, replace optimistic data with real data
    onSuccess: (response) => {
      if (response.data) {
        // Update the specific application in cache
        queryClient.setQueryData(
          applicationKeys.detail(response.data.id),
          response
        );

        // Invalidate and refetch applications lists to ensure consistency
        queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      }

      toast({
        title: "Application created",
        description: "Successfully logged application into the void.",
      });
    },

    // On error, rollback optimistic updates
    onError: (error, variables, context) => {
      // Restore previous data
      if (context?.previousApplications) {
        context.previousApplications.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      const errorMessage =
        error instanceof ApiError
          ? error.message
          : "Failed to create application";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },

    // Always refetch after mutation completes
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
    },
  });
}

// Hook to update an existing application
export function useUpdateApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateApplicationData>;
    }) => applicationsApi.updateApplication(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel queries for this application
      await queryClient.cancelQueries({ queryKey: applicationKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: applicationKeys.lists() });

      // Snapshot previous values
      const previousApplication = queryClient.getQueryData(
        applicationKeys.detail(id)
      );
      const previousLists = queryClient.getQueriesData({
        queryKey: applicationKeys.lists(),
      });

      // Optimistically update the individual application
      queryClient.setQueryData(applicationKeys.detail(id), (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            ...data,
            updatedAt: new Date().toISOString(),
          },
        };
      });

      // Optimistically update in all lists
      queryClient.setQueriesData(
        { queryKey: applicationKeys.lists() },
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((app: Application) =>
              app.id === id
                ? { ...app, ...data, updatedAt: new Date().toISOString() }
                : app
            ),
          };
        }
      );

      return { previousApplication, previousLists };
    },

    // On success, update with real data
    onSuccess: (response, { id }) => {
      if (response.data) {
        queryClient.setQueryData(applicationKeys.detail(id), response);
        queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      }

      toast({
        title: "Application updated",
        description: "Changes have been saved to the void.",
      });
    },

    // On error, rollback
    onError: (error, { id }, context) => {
      if (context?.previousApplication) {
        queryClient.setQueryData(
          applicationKeys.detail(id),
          context.previousApplication
        );
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      const errorMessage =
        error instanceof ApiError
          ? error.message
          : "Failed to update application";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },

    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
    },
  });
}

// Hook to delete an application
export function useDeleteApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => applicationsApi.deleteApplication(id),

    // Optimistic delete
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: applicationKeys.lists() });

      const previousLists = queryClient.getQueriesData({
        queryKey: applicationKeys.lists(),
      });

      // Remove from all lists optimistically
      queryClient.setQueriesData(
        { queryKey: applicationKeys.lists() },
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.filter((app: Application) => app.id !== id),
            pagination: old.pagination
              ? {
                  ...old.pagination,
                  total: Math.max(0, old.pagination.total - 1),
                }
              : undefined,
          };
        }
      );

      return { previousLists };
    },

    onSuccess: (response, id) => {
      // Remove from individual cache
      queryClient.removeQueries({ queryKey: applicationKeys.detail(id) });

      toast({
        title: "Application deleted",
        description: "Application has been cast into the void.",
      });
    },

    onError: (error, id, context) => {
      // Restore lists
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      const errorMessage =
        error instanceof ApiError
          ? error.message
          : "Failed to delete application";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
    },
  });
}

// Hook to export applications
export function useExportApplications() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      format,
      params,
    }: {
      format: "json" | "csv";
      params?: ApplicationsQueryParams;
    }) => applicationsApi.exportApplications(format, params),

    onSuccess: (response, { format }) => {
      toast({
        title: "Export successful",
        description: `Applications exported as ${format.toUpperCase()}`,
      });
    },

    onError: (error) => {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : "Failed to export applications";

      toast({
        title: "Export failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}
