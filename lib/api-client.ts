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

  // Export applications
  exportApplications: async (
    format: "json" | "csv" = "json",
    params: ApplicationsQueryParams = {}
  ): Promise<ApiResponse<any>> => {
    const searchParams = new URLSearchParams({ format });

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        searchParams.append(key, String(value));
      }
    });

    return fetchApi<any>(`/api/applications/export?${searchParams.toString()}`);
  },
};
