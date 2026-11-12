import * as SecureStore from "expo-secure-store";

export class ApiError extends Error {
  constructor(message: string, readonly status: number = 0, readonly details?: unknown) {
    super(message);
  }
}

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://api.endod-health.com/patient/v1";

const TOKEN_KEY = "endod_access_token";

let authToken: string | null = null;
let tokenLoaded = false;
let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(cb: (() => void) | null) {
  onUnauthorized = cb;
}

export async function ensureTokenLoaded() {
  if (tokenLoaded) return;
  try {
    authToken = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    authToken = null;
  }
  tokenLoaded = true;
}

export function setAuthToken(token: string | null) {
  authToken = token;
  tokenLoaded = true;
  if (token) {
    SecureStore.setItemAsync(TOKEN_KEY, token).catch(() => {});
  } else {
    SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
  }
}

export function getAuthToken() {
  return authToken;
}

export async function api<T = any>(path: string, options: any = {}): Promise<T> {
  // A request started just before sign-out still goes out signed in.
  const tokenAtCall = authToken;
  await ensureTokenLoaded();

  const method = (options.method ?? "GET").toUpperCase();
  const p = path.replace(/^\/+/, "");
  const url = `${API_BASE_URL}/${p}`;

  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  const token = authToken ?? tokenAtCall;
  if (token) headers["Authorization"] = `Bearer ${token}`;

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
    if (response.status === 401) {
      const hadToken = !!authToken;
      setAuthToken(null);
      if (hadToken) onUnauthorized?.();
    }
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
