import { clearAuthSession, getAuthToken } from "../lib/api";
import { requireAuth } from "../lib/auth-guard";

requireAuth();

type JwtPayload = {
  sub?: string;
  email?: string;
  role?: string;
  userId?: number | string;
  exp?: number;
  iat?: number;
  iss?: string;
};

const CAMPOS_ROL: Record<string, string> = {
  ADMIN: "Administrador",
  SUPERADMIN: "Superadministrador",
  WORKER: "Trabajador"
};

const usuarioEl = document.querySelector<HTMLElement>("#perfil-usuario");
const emailEl = document.querySelector<HTMLElement>("#perfil-email");
const rolEl = document.querySelector<HTMLElement>("#perfil-rol");
const estadoEl = document.querySelector<HTMLElement>("#perfil-estado");
const userIdEl = document.querySelector<HTMLElement>("#perfil-user-id");
const expiraEl = document.querySelector<HTMLElement>("#perfil-expira");
const emitidoEl = document.querySelector<HTMLElement>("#perfil-emitido");
const issuerEl = document.querySelector<HTMLElement>("#perfil-issuer");
const errorEl = document.querySelector<HTMLElement>("#perfil-error");
const logoutBtn = document.querySelector<HTMLButtonElement>("#btn-logout");

function setText(element: HTMLElement | null, value: string | number | null | undefined): void {
  if (!element) return;
  const text = value === null || value === undefined || value === "" ? "No disponible" : String(value);
  element.textContent = text;
}

function mostrarError(message: string): void {
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.removeAttribute("hidden");
}

function obtenerDatoGuardado(key: "auth_user" | "auth_role"): string | null {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
}

function base64UrlToJson(segment: string): unknown {
  const normalizado = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalizado.length % 4)) % 4);
  const decoded = atob(normalizado + padding);
  const bytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json);
}

function decodificarJwt(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) return null;

  try {
    const payload = base64UrlToJson(parts[1]);
    if (!payload || typeof payload !== "object") return null;
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

function formatearFechaEpoch(value: number | undefined): string {
  if (!value) return "No disponible";
  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) return "No disponible";
  return date.toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function tokenCaducado(exp: number | undefined): boolean {
  return typeof exp === "number" && exp * 1000 <= Date.now();
}

function formatearRol(role: string | undefined | null): string {
  if (!role) return "No disponible";
  return CAMPOS_ROL[role] ?? role;
}

function cargarPerfil(): void {
  const token = getAuthToken();
  if (!token) return;

  const payload = decodificarJwt(token);
  if (!payload) {
    clearAuthSession();
    setText(estadoEl, "Sesión no válida");
    mostrarError("No se pudo leer la sesión actual. Vuelve a iniciar sesión.");
    window.setTimeout(() => {
      window.location.replace("/html/login.html");
    }, 1200);
    return;
  }

  if (tokenCaducado(payload.exp)) {
    clearAuthSession();
    setText(estadoEl, "Sesión caducada");
    mostrarError("La sesión ha caducado. Vuelve a iniciar sesión.");
    window.setTimeout(() => {
      window.location.replace("/html/login.html");
    }, 1200);
    return;
  }

  const usuario = payload.sub ?? obtenerDatoGuardado("auth_user");
  const role = payload.role ?? obtenerDatoGuardado("auth_role");

  setText(usuarioEl, usuario);
  setText(emailEl, payload.email);
  setText(rolEl, formatearRol(role));
  setText(estadoEl, "Sesión iniciada");
  setText(userIdEl, payload.userId);
  setText(expiraEl, formatearFechaEpoch(payload.exp));
  setText(emitidoEl, formatearFechaEpoch(payload.iat));
  setText(issuerEl, payload.iss);
}

logoutBtn?.addEventListener("click", () => {
  clearAuthSession();
  window.location.href = "/html/login.html";
});

cargarPerfil();
