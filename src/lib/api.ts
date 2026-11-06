import { Platform } from "react-native";

export class ApiError extends Error {
  constructor(message: string, readonly status: number = 0, readonly details?: unknown) {
    super(message);
  }
}

const API_BASE_URL = Platform.OS === "web" ? "http://localhost:8000" : "http://10.161.94.61:8000";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export async function api<T = any>(path: string, options: any = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const p = path.replace(/^\/+/, "");
  const url = `${API_BASE_URL}/${p}`;

  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError("Unable to reach the server. Please check your connection.", 0);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : typeof data?.error === "string"
          ? data.error
          : "Something went wrong. Please try again.";
    throw new ApiError(message, response.status, data);
  }
  return data as T;
}

export function redirectToLogin() {}

export async function logout() {
  setAuthToken(null);
}

export function passwordProblem(password: string) {
  if (password.length < 10) return "Password must be at least 10 characters.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return "Password must include both upper and lower case letters.";
  }
  return null;
}

export function safeNext(next: string | null, fallback: string) {
  return next && next.startsWith("/") ? next : fallback;
}
