import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json"
  }
});

export type ApiError = {
  status?: number;
  message: string;
  details?: unknown;
};

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    return {
      status: error.response?.status,
      message:
        (error.response?.data as { detail?: string })?.detail ??
        error.message ??
        "Unexpected error occurred",
      details: error.response?.data
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: "Unexpected error occurred" };
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

type ConfigureAuthOptions = {
  refreshAccessToken: () => Promise<string | null>;
  onUnauthorized: () => void;
};

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export function configureAuthInterceptors({ refreshAccessToken, onUnauthorized }: ConfigureAuthOptions) {
  const requestInterceptor = apiClient.interceptors.request.use((config) => {
    const headers = (config.headers ?? {}) as Record<string, unknown>;
    if (accessToken && typeof headers.Authorization === "undefined") {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    config.headers = headers as typeof config.headers;
    return config;
  });

  const responseInterceptor = apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const status = error.response?.status;
      const originalRequest = error.config as RetriableRequestConfig | undefined;

      const isAuthEndpoint =
        originalRequest?.url?.includes("/auth/login") ||
        originalRequest?.url?.includes("/auth/register") ||
        originalRequest?.url?.includes("/auth/verify") ||
        originalRequest?.url?.includes("/auth/forgot-password") ||
        originalRequest?.url?.includes("/auth/reset-password") ||
        originalRequest?.url?.includes("/auth/logout") ||
        originalRequest?.url?.includes("/auth/refresh");

      if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
        originalRequest._retry = true;
        try {
          const newToken = await refreshAccessToken();
          if (newToken) {
            setAccessToken(newToken);
            const headers = (originalRequest.headers ?? {}) as Record<string, unknown>;
            headers.Authorization = `Bearer ${newToken}`;
            originalRequest.headers = headers as typeof originalRequest.headers;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          onUnauthorized();
          throw refreshError;
        }
      }

      if (status === 401) {
        onUnauthorized();
      }

      return Promise.reject(error);
    }
  );

  return () => {
    apiClient.interceptors.request.eject(requestInterceptor);
    apiClient.interceptors.response.eject(responseInterceptor);
  };
}
