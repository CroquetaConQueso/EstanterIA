import { clearAuthSession, getAuthRole, getAuthToken, isStructuralAdmin, isTokenExpired } from "./api";

export function requireAuth(): void {
  const token = getAuthToken();

  if (token && !isTokenExpired(token)) return;

  clearAuthSession();
  window.location.replace("/html/login.html");
}

export function requireAdminPanelAccess(): void {
  const token = getAuthToken();

  if (!token || isTokenExpired(token)) {
    clearAuthSession();
    window.location.replace("/html/login.html");
    return;
  }

  const role = getAuthRole()?.toUpperCase();

  if (isStructuralAdmin()) return;

  if (role === "WORKER") {
    window.location.replace("/html/acceso_trabajador.html");
    return;
  }

  clearAuthSession();
  window.location.replace("/html/login.html");
}
