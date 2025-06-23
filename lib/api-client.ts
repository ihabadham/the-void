// API client for applications with proper error handling and type safety

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Export-specific response types
export interface ApplicationsExportData {
  exportDate: string;
  totalApplications: number;
  applications: Application[];
}

export interface ExportJsonResponse
  extends ApiResponse<ApplicationsExportData> {}

export interface ExportCsvResponse {
  blob: Blob;
  filename: string;
}

export interface Application {
  id: string;
  company: string;
  position: string;
  status:
    | "applied"
    | "assessment"
    | "interview"
    | "offer"
    | "rejected"
    | "withdrawn";
  appliedDate: string;
  nextDate?: string;
  nextEvent?: string;
  cvVersion?: string;
  notes?: string;
  jobUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  userId: string;
  applicationId: string;
  name: string;
  type: "cv" | "cover-letter" | "portfolio" | "other";
  size: number;
  url?: string;
  mimeType?: string;
  uploadDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationsQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  startDate?: string;
  endDate?: string;
}

export interface DocumentsQueryParams {
  applicationId?: string;
  type?: string;
}

export interface CreateApplicationData {
  company: string;
  position: string;
  status?: Application["status"];
  appliedDate?: string;
  nextDate?: string;
  nextEvent?: string;
  cvVersion?: string;
  notes?: string;
  jobUrl?: string;
}

export interface CreateDocumentData {
  name: string;
  type: Document["type"];
  applicationId: string;
  file: File;
}

export interface UpdateDocumentData {
  name?: string;
  type?: Document["type"];
}

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: Response
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Base API client with error handling
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || `HTTP ${response.status}`,
        response.status,
        response
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network or parsing errors
    throw new ApiError(
      error instanceof Error ? error.message : "Network error occurred"
    );
  }
}

// Special fetch for file uploads (no JSON content-type)
async function fetchApiFormData<T>(
  endpoint: string,
  formData: FormData
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || `HTTP ${response.status}`,
        response.status,
        response
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      error instanceof Error ? error.message : "Network error occurred"
    );
  }
}

// Applications API client
export const applicationsApi = {
  // Get applications with optional filtering and pagination
  getApplications: async (
    params: ApplicationsQueryParams = {}
  ): Promise<ApiResponse<Application[]>> => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/api/applications${queryString ? `?${queryString}` : ""}`;

    return fetchApi<Application[]>(endpoint);
  },

  // Get a single application by ID
  getApplication: async (id: string): Promise<ApiResponse<Application>> => {
    return fetchApi<Application>(`/api/applications/${id}`);
  },

  // Create a new application
  createApplication: async (
    data: CreateApplicationData
  ): Promise<ApiResponse<Application>> => {
    return fetchApi<Application>("/api/applications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Update an existing application
  updateApplication: async (
    id: string,
    data: Partial<CreateApplicationData>
  ): Promise<ApiResponse<Application>> => {
    return fetchApi<Application>(`/api/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Delete an application
  deleteApplication: async (id: string): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/api/applications/${id}`, {
      method: "DELETE",
    });
  },

  // Export applications as JSON
  exportApplicationsJson: async (
    params: ApplicationsQueryParams = {}
  ): Promise<ExportJsonResponse> => {
    const searchParams = new URLSearchParams({ format: "json" });

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        searchParams.append(key, String(value));
      }
    });

    return fetchApi<ApplicationsExportData>(
      `/api/applications/export?${searchParams.toString()}`
    );
  },

  // Export applications as CSV with proper file handling
  exportApplicationsCsv: async (
    params: ApplicationsQueryParams = {}
  ): Promise<ExportCsvResponse> => {
    const searchParams = new URLSearchParams({ format: "csv" });

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        searchParams.append(key, String(value));
      }
    });

    const endpoint = `/api/applications/export?${searchParams.toString()}`;
    const url = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          response
        );
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const filename =
        contentDisposition?.match(/filename="([^"]+)"/)?.[1] ||
        `applications-${new Date().toISOString().split("T")[0]}.csv`;

      return { blob, filename };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : "Network error occurred"
      );
    }
  },

  // Get documents for a specific application
  getApplicationDocuments: async (
    applicationId: string
  ): Promise<ApiResponse<{ applicationId: string; documents: Document[] }>> => {
    return fetchApi<{ applicationId: string; documents: Document[] }>(
      `/api/applications/${applicationId}/documents`
    );
  },
};

// Documents API client
export const documentsApi = {
  // Get documents with optional filtering
  getDocuments: async (
    params: DocumentsQueryParams = {}
  ): Promise<ApiResponse<Document[]>> => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/api/documents${queryString ? `?${queryString}` : ""}`;

    return fetchApi<Document[]>(endpoint);
  },

  // Get a single document by ID (with signed URL for file access)
  getDocument: async (
    id: string,
    options: { download?: boolean; expiresIn?: number } = {}
  ): Promise<ApiResponse<Document & { signedUrl?: string }>> => {
    const searchParams = new URLSearchParams();

    if (options.download !== undefined) {
      searchParams.append("download", String(options.download));
    }
    if (options.expiresIn !== undefined) {
      searchParams.append("expiresIn", String(options.expiresIn));
    }

    const queryString = searchParams.toString();
    const endpoint = `/api/documents/${id}${queryString ? `?${queryString}` : ""}`;

    return fetchApi<Document & { signedUrl?: string }>(endpoint);
  },

  // Create a new document with file upload
  createDocument: async (
    data: CreateDocumentData
  ): Promise<ApiResponse<Document>> => {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("name", data.name);
    formData.append("type", data.type);
    formData.append("applicationId", data.applicationId);

    return fetchApiFormData<Document>("/api/documents", formData);
  },

  // Update document metadata
  updateDocument: async (
    id: string,
    data: UpdateDocumentData
  ): Promise<ApiResponse<Document>> => {
    return fetchApi<Document>(`/api/documents/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Delete a document
  deleteDocument: async (id: string): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/api/documents/${id}`, {
      method: "DELETE",
    });
  },

  // Validate a file before upload
  validateFile: async (
    file: File,
    applicationId: string
  ): Promise<ApiResponse<{ isValid: boolean; name: string; size: number }>> => {
    const formData = new FormData();
    formData.append("file", file);

    const searchParams = new URLSearchParams({
      applicationId,
      validate: "true",
    });

    return fetchApiFormData<{
      isValid: boolean;
      name: string;
      size: number;
    }>(`/api/documents/upload?${searchParams.toString()}`, formData);
  },

  // Get secure download URL for a document
  getDownloadUrl: (id: string, options: { inline?: boolean } = {}): string => {
    const searchParams = new URLSearchParams();

    if (options.inline !== undefined) {
      searchParams.append("inline", String(options.inline));
    }

    const queryString = searchParams.toString();
    return `/api/documents/${id}/download${queryString ? `?${queryString}` : ""}`;
  },
};

// Settings API client
export const settingsApi = {
  // Get user settings
  getSettings: async (): Promise<ApiResponse<UserSettings>> => {
    return fetchApi<UserSettings>("/api/settings");
  },

  // Update user settings
  updateSettings: async (
    data: Partial<UserSettings>
  ): Promise<ApiResponse<UserSettings>> => {
    return fetchApi<UserSettings>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Export all user data (applications + documents)
  exportData: async (): Promise<
    ApiResponse<{
      applications: Application[];
      documents: Document[];
      exportDate: string;
      version: string;
    }>
  > => {
    return fetchApi("/api/settings/export");
  },
};

// Add UserSettings interface
export interface UserSettings {
  id?: string;
  userId: string;
  notifications: boolean;
  autoSync: boolean;
  darkMode: boolean;
  emailReminders: boolean;
  exportFormat: "json" | "csv";
  dataRetention: number;
  createdAt: string;
  updatedAt: string;
}

export interface LogOutreachPayload {
  applicationId?: string;
  company?: string;
  messageBody: string;
  contacts: string[];
}

export interface OutreachAction {
  id: string;
  contactId: string;
  applicationId?: string;
  company?: string;
  status: "pending" | "accepted" | "ignored" | "other";
  sentAt: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Outreach API client
export const outreachApi = {
  logOutreach: async (
    payload: LogOutreachPayload
  ): Promise<ApiResponse<OutreachAction[]>> => {
    return fetchApi<OutreachAction[]>("/api/outreach", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
