import { getAuthToken } from "./api";

export function requireAuth(): void {
  if (getAuthToken()) return;

  window.location.replace("/html/login.html");
}
