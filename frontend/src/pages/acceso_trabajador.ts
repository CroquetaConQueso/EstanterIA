import { clearAuthSession, getAuthRole, getAuthToken, isStructuralAdmin, isTokenExpired } from "../lib/api";

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
  clearAuthSession();
  window.location.href = "/html/login.html";
});

loginLink?.addEventListener("click", () => {
  clearAuthSession();
});
