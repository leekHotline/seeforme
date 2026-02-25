/**
 * API client for SeeForMe backend.
 * Handles base URL, auth headers, and common request patterns.
 */

import { Platform } from "react-native";
import * as storage from "@/lib/storage";

const API_BASE_URL = __DEV__
  ? Platform.select({
      android: "http://10.0.2.2:8000/api/v1",  // Android emulator -> host
      web: "http://localhost:8000/api/v1",
      default: "http://localhost:8000/api/v1",
    })!
  : "https://api.seeforme.app/api/v1";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
};

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super(`API Error ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function getAccessToken(): Promise<string | null> {
  try {
    return await storage.getItem("access_token");
  } catch {
    return null;
  }
}

async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, auth = true } = options;

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;
  const finalHeaders: Record<string, string> = { ...headers };
  if (!isFormData && body !== undefined && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = await getAccessToken();
    if (token) {
      finalHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    method,
    headers: finalHeaders,
  };

  if (body !== undefined) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(buildApiUrl(endpoint), config);

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(response.status, data);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

function buildApiUrl(endpoint: string): string {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }
  const normalized = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${normalized}`;
}

/** Typed API methods */
export const api = {
  get: <T = unknown>(endpoint: string, auth = true) =>
    request<T>(endpoint, { auth }),

  post: <T = unknown>(endpoint: string, body?: unknown, auth = true) =>
    request<T>(endpoint, { method: "POST", body, auth }),

  patch: <T = unknown>(endpoint: string, body?: unknown, auth = true) =>
    request<T>(endpoint, { method: "PATCH", body, auth }),

  put: <T = unknown>(endpoint: string, body?: unknown, auth = true) =>
    request<T>(endpoint, { method: "PUT", body, auth }),

  delete: <T = unknown>(endpoint: string, auth = true) =>
    request<T>(endpoint, { method: "DELETE", auth }),
};

export { ApiError, API_BASE_URL, buildApiUrl };
