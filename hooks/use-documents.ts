// TanStack Query hooks for documents API

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import {
  documentsApi,
  applicationsApi,
  type Document,
  type DocumentsQueryParams,
  type CreateDocumentData,
  type UpdateDocumentData,
  ApiError,
} from "@/lib/api-client";

// Query keys for consistent caching
export const documentKeys = {
  all: ["documents"] as const,
  lists: () => [...documentKeys.all, "list"] as const,
  list: (params: DocumentsQueryParams) =>
    [...documentKeys.lists(), params] as const,
  details: () => [...documentKeys.all, "detail"] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  byApplication: (applicationId: string) =>
    [...documentKeys.all, "byApplication", applicationId] as const,
};

// Hook to get documents with optional filtering
export function useDocuments(params: DocumentsQueryParams = {}) {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => documentsApi.getDocuments(params),
    // Transform the response to return just the data
    select: (response) => response.data || [],
    // Enable background refetching
    refetchOnWindowFocus: true,
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Only run when user is authenticated
    enabled: !!session && status === "authenticated",
  });
}

// Hook to get documents for a specific application
export function useApplicationDocuments(applicationId: string) {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: documentKeys.byApplication(applicationId),
    queryFn: () => applicationsApi.getApplicationDocuments(applicationId),
    // Transform the response to return just the documents array
    select: (response) => response.data?.documents || [],
    // Cache for 10 minutes since application documents change less frequently
    staleTime: 10 * 60 * 1000,
    // Don't run if no applicationId or user not authenticated
    enabled: !!applicationId && !!session && status === "authenticated",
  });
}

// Hook to get a single document by ID
export function useDocument(
  id: string,
  options: { download?: boolean; expiresIn?: number } = {}
) {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => documentsApi.getDocument(id, options),
    // Transform the response to return just the data
    select: (response) => response.data,
    // Cache for 30 minutes since individual documents change infrequently
    staleTime: 30 * 60 * 1000,
    // Don't run if no ID provided or user not authenticated
    enabled: !!id && !!session && status === "authenticated",
  });
}

// Hook to create a new document with file upload
export function useCreateDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateDocumentData) => documentsApi.createDocument(data),

    // Optimistic update - add the new document immediately
    onMutate: async (newDocumentData) => {
      // Cancel any outgoing queries for documents lists
      await queryClient.cancelQueries({ queryKey: documentKeys.lists() });
      await queryClient.cancelQueries({
        queryKey: documentKeys.byApplication(newDocumentData.applicationId),
      });

      // Snapshot the previous values
      const previousDocuments = queryClient.getQueriesData({
        queryKey: documentKeys.lists(),
      });
      const previousApplicationDocuments = queryClient.getQueryData(
        documentKeys.byApplication(newDocumentData.applicationId)
      );

      // Create optimistic document with temporary ID
      const optimisticDocument: Document = {
        id: `temp-${Date.now()}`,
        userId: "temp-user", // Will be replaced with real data
        applicationId: newDocumentData.applicationId,
        name: newDocumentData.name,
        type: newDocumentData.type,
        size: newDocumentData.file.size,
        mimeType: newDocumentData.file.type,
        uploadDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistically update all document lists
      queryClient.setQueriesData(
        { queryKey: documentKeys.lists() },
        (old: any) => {
          if (!Array.isArray(old)) return old;
          return [optimisticDocument, ...old];
        }
      );

      // Optimistically update application-specific documents
      queryClient.setQueryData(
        documentKeys.byApplication(newDocumentData.applicationId),
        (old: any) => {
          if (!Array.isArray(old)) return [optimisticDocument];
          return [optimisticDocument, ...old];
        }
      );

      return { previousDocuments, previousApplicationDocuments };
    },

    // On success, replace optimistic data with real data
    onSuccess: (response, variables) => {
      if (response.data) {
        // Update the specific document in cache
        queryClient.setQueryData(
          documentKeys.detail(response.data.id),
          response
        );

        // Invalidate and refetch document lists to ensure consistency
        queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: documentKeys.byApplication(variables.applicationId),
        });
      }

      toast({
        title: "Document uploaded",
        description: `${variables.name} has been cast into the digital void.`,
      });
    },

    // On error, rollback optimistic updates
    onError: (error, variables, context) => {
      // Restore previous document lists
      if (context?.previousDocuments) {
        context.previousDocuments.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Restore previous application documents
      if (context?.previousApplicationDocuments) {
        queryClient.setQueryData(
          documentKeys.byApplication(variables.applicationId),
          context.previousApplicationDocuments
        );
      }

      const errorMessage =
        error instanceof ApiError ? error.message : "Failed to upload document";

      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    },

    // Always refetch after mutation completes
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: documentKeys.byApplication(variables.applicationId),
      });
    },
  });
}

// Hook to update document metadata
export function useUpdateDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentData }) =>
      documentsApi.updateDocument(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel queries for this document
      await queryClient.cancelQueries({ queryKey: documentKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: documentKeys.lists() });

      // Snapshot previous values
      const previousDocument = queryClient.getQueryData(
        documentKeys.detail(id)
      );
      const previousLists = queryClient.getQueriesData({
        queryKey: documentKeys.lists(),
      });

      // Optimistically update the individual document
      queryClient.setQueryData(documentKeys.detail(id), (old: any) => {
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
        { queryKey: documentKeys.lists() },
        (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.map((doc: Document) =>
            doc.id === id
              ? { ...doc, ...data, updatedAt: new Date().toISOString() }
              : doc
          );
        }
      );

      return { previousDocument, previousLists };
    },

    // On success, update with real data
    onSuccess: (response, { id }) => {
      if (response.data) {
        queryClient.setQueryData(documentKeys.detail(id), response);
        queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      }

      toast({
        title: "Document updated",
        description: "Changes have been committed to the void.",
      });
    },

    // On error, rollback
    onError: (error, { id }, context) => {
      if (context?.previousDocument) {
        queryClient.setQueryData(
          documentKeys.detail(id),
          context.previousDocument
        );
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      const errorMessage =
        error instanceof ApiError ? error.message : "Failed to update document";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },

    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

// Hook to delete a document
export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => documentsApi.deleteDocument(id),

    // Optimistic delete
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: documentKeys.lists() });

      // Get the document before deletion for rollback
      const documentToDelete = queryClient
        .getQueriesData({ queryKey: documentKeys.lists() })
        .flatMap(([, data]) => (Array.isArray(data) ? data : []))
        .find((doc: Document) => doc.id === id);

      const previousLists = queryClient.getQueriesData({
        queryKey: documentKeys.lists(),
      });

      // Remove from all lists optimistically
      queryClient.setQueriesData(
        { queryKey: documentKeys.lists() },
        (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.filter((doc: Document) => doc.id !== id);
        }
      );

      // Remove from application-specific cache if we know the applicationId
      if (documentToDelete?.applicationId) {
        queryClient.setQueryData(
          documentKeys.byApplication(documentToDelete.applicationId),
          (old: any) => {
            if (!Array.isArray(old)) return old;
            return old.filter((doc: Document) => doc.id !== id);
          }
        );
      }

      return { previousLists, documentToDelete };
    },

    onSuccess: (response, id) => {
      // Remove from individual cache
      queryClient.removeQueries({ queryKey: documentKeys.detail(id) });

      toast({
        title: "Document deleted",
        description: "File has been consumed by the void.",
      });
    },

    onError: (error, id, context) => {
      // Restore lists
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Restore application-specific cache
      if (context?.documentToDelete?.applicationId) {
        queryClient.invalidateQueries({
          queryKey: documentKeys.byApplication(
            context.documentToDelete.applicationId
          ),
        });
      }

      const errorMessage =
        error instanceof ApiError ? error.message : "Failed to delete document";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

// Hook to validate a file before upload
export function useValidateFile() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      file,
      applicationId,
    }: {
      file: File;
      applicationId: string;
    }) => documentsApi.validateFile(file, applicationId),

    onError: (error) => {
      const errorMessage =
        error instanceof ApiError ? error.message : "File validation failed";

      toast({
        title: "File validation failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

// Utility hook to get download URL for a document
export function useDocumentDownload() {
  return {
    getDownloadUrl: (id: string, options: { inline?: boolean } = {}) =>
      documentsApi.getDownloadUrl(id, options),
  };
}
