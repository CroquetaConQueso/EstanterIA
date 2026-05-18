import { clearAuthSession, getAuthRole, getAuthToken, isStructuralAdmin, isTokenExpired, logoutSession } from "../lib/api";

const btnLogout = document.querySelector<HTMLButtonElement>("#btn-worker-logout");
const loginLink = document.querySelector<HTMLAnchorElement>("#worker-login-link");

const token = getAuthToken();
const role = getAuthRole()?.toUpperCase();

if (!token || isTokenExpired(token)) {
  clearAuthSession();
  window.location.replace("/html/login.html");
} else if (isStructuralAdmin()) {
  window.location.replace("/html/home.html");
} else if (role !== "WORKER") {
  clearAuthSession();
  window.location.replace("/html/login.html");
}

btnLogout?.addEventListener("click", () => {
  btnLogout.disabled = true;
  void logoutSession();
});

loginLink?.addEventListener("click", () => {
  clearAuthSession();
});
