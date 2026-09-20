/**
 * Client-safe session helpers. The session token is stored in
 * localStorage so the app works even in embedded/iframe previews where
 * third-party cookies are blocked; the httpOnly cookie set at login
 * remains the primary channel in normal browser tabs.
 */
const TOKEN_KEY = "meridian_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable — cookie channel still works
  }
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token && !headers.has("x-meridian-session")) {
    headers.set("x-meridian-session", token);
  }
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return fetch(path, { ...init, headers });
}
