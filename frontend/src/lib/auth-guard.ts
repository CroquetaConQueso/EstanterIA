import { clearAuthSession, getAuthRole, getAuthToken, isStructuralAdmin, isTokenExpired, logoutSession } from "./api";

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

  if (isStructuralAdmin()) {
    setupPrivateNavigation();
    return;
  }

  if (role === "WORKER") {
    window.location.replace("/html/acceso_trabajador.html");
    return;
  }

  clearAuthSession();
  window.location.replace("/html/login.html");
}

function setupPrivateNavigation(): void {
  const brand = document.querySelector<HTMLAnchorElement>(".topbar .brand");
  if (brand) {
    brand.href = "/html/home.html";
    brand.addEventListener("click", (event) => {
      const token = getAuthToken();
      const role = getAuthRole()?.toUpperCase();

      if (!token || isTokenExpired(token)) {
        event.preventDefault();
        clearAuthSession();
        window.location.href = "/html/login.html";
        return;
      }

      if (role === "WORKER") {
        event.preventDefault();
        window.location.href = "/html/acceso_trabajador.html";
      }
    });
  }

  const navActions = document.querySelector<HTMLElement>(".topbar .right");
  if (!navActions || navActions.querySelector("[data-logout-action='true']")) return;

  const logoutButton = document.createElement("button");
  logoutButton.type = "button";
  logoutButton.className = "user logout-action";
  logoutButton.dataset.logoutAction = "true";
  logoutButton.textContent = "Cerrar sesi\u00f3n";
  logoutButton.addEventListener("click", () => {
    logoutButton.disabled = true;
    void logoutSession();
  });

  navActions.appendChild(logoutButton);
}
