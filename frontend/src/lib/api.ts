export function getAuthToken(): string | null {
  return localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getAuthRole(): string | null {
  const storedRole = localStorage.getItem("auth_role") || sessionStorage.getItem("auth_role");
  if (storedRole) return storedRole;

  const token = getAuthToken();
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  const role = payload?.role;
  return typeof role === "string" && role ? role : null;
}

export function isStructuralAdmin(): boolean {
  const role = getAuthRole()?.toUpperCase();
  return role === "ADMIN" || role === "SUPERADMIN";
}

export function buildAuthHeaders(headers: HeadersInit = {}): Headers {
  const result = new Headers(headers);
  const token = getAuthToken();

  if (token) {
    result.set("Authorization", `Bearer ${token}`);
  }

  return result;
}

export function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  return fetch(input, {
    ...init,
    headers: buildAuthHeaders(init.headers)
  });
}

export function clearAuthSession(): void {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
  localStorage.removeItem("auth_role");
  sessionStorage.removeItem("auth_token");
  sessionStorage.removeItem("auth_user");
  sessionStorage.removeItem("auth_role");
}
