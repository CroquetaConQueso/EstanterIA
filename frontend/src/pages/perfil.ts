import { authFetch, clearAuthSession } from "../lib/api";
import { requireAdminPanelAccess } from "../lib/auth-guard";

requireAdminPanelAccess();

type PerfilEmpresa = {
  id: number;
  codigo: string;
  nombre: string;
};

type PerfilTrabajador = {
  id: number;
  nombre: string;
  apellidos?: string | null;
  emailContacto?: string | null;
  telefonoContacto?: string | null;
  tipoTrabajador?: string | null;
  estadoDisponibilidad?: string | null;
  activo?: boolean | null;
};

type PerfilResponse = {
  userId: number;
  username: string;
  email: string;
  role: "SUPERADMIN" | "ADMIN" | "WORKER" | string;
  enabled: boolean;
  empresa?: PerfilEmpresa | null;
  trabajador?: PerfilTrabajador | null;
  requiereNuevoLogin?: boolean | null;
  mensaje?: string | null;
};

type ApiError = {
  message?: string;
  fieldErrors?: Record<string, string>;
};

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Superadministrador",
  ADMIN: "Administrador",
  WORKER: "Trabajador"
};

const TRABAJADOR_LABELS: Record<string, string> = {
  GERENTE: "Gerente",
  ENCARGADO: "Encargado",
  TRABAJADOR: "Trabajador",
  ENCARGADO_SECCION: "Encargado de sección",
  REPONEDOR: "Reponedor",
  CAJERO: "Cajero",
  ADMINISTRATIVO: "Administrativo"
};

const DISPONIBILIDAD_LABELS: Record<string, string> = {
  DISPONIBLE: "Disponible",
  AUSENTE: "Ausente",
  ENFERMO: "Enfermo"
};

const form = document.querySelector<HTMLFormElement>("#perfil-form");
const usernameInput = document.querySelector<HTMLInputElement>("#perfil-username");
const emailInput = document.querySelector<HTMLInputElement>("#perfil-email");
const roleInput = document.querySelector<HTMLElement>("#perfil-role");
const estadoEl = document.querySelector<HTMLElement>("#perfil-estado");
const statusEl = document.querySelector<HTMLElement>("#perfil-status");
const errorEl = document.querySelector<HTMLElement>("#perfil-error");
const logoutBtn = document.querySelector<HTMLButtonElement>("#btn-logout");
const guardarBtn = document.querySelector<HTMLButtonElement>("#btn-guardar-perfil");

const empresaCodigoEl = document.querySelector<HTMLElement>("#perfil-empresa-codigo");
const empresaNombreEl = document.querySelector<HTMLElement>("#perfil-empresa-nombre");
const trabajadorDatosEl = document.querySelector<HTMLElement>("#perfil-trabajador-datos");
const trabajadorEmptyEl = document.querySelector<HTMLElement>("#perfil-trabajador-empty");
const trabajadorNombreEl = document.querySelector<HTMLElement>("#perfil-trabajador-nombre");
const trabajadorTipoEl = document.querySelector<HTMLElement>("#perfil-trabajador-tipo");
const trabajadorDisponibilidadEl = document.querySelector<HTMLElement>("#perfil-trabajador-disponibilidad");
const trabajadorEmailEl = document.querySelector<HTMLElement>("#perfil-trabajador-email");
const trabajadorTelefonoEl = document.querySelector<HTMLElement>("#perfil-trabajador-telefono");
const trabajadorEstadoEl = document.querySelector<HTMLElement>("#perfil-trabajador-estado");

function setText(element: HTMLElement | HTMLInputElement | null, value: string | number | null | undefined): void {
  if (!element) return;
  const text = value === null || value === undefined || value === "" ? "No disponible" : String(value);
  if (element instanceof HTMLInputElement) {
    element.value = text === "No disponible" ? "" : text;
  } else {
    element.textContent = text;
  }
}

function mostrarEstado(message: string): void {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.removeAttribute("hidden");
  errorEl?.setAttribute("hidden", "true");
}

function mostrarError(message: string): void {
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.removeAttribute("hidden");
  statusEl?.setAttribute("hidden", "true");
}

function ocultarMensajes(): void {
  statusEl?.setAttribute("hidden", "true");
  errorEl?.setAttribute("hidden", "true");
}

function formatearRol(role: string | undefined | null): string {
  if (!role) return "No disponible";
  return ROLE_LABELS[role] ?? role;
}

function formatearTipoTrabajador(tipo: string | undefined | null): string {
  if (!tipo) return "No disponible";
  return TRABAJADOR_LABELS[tipo] ?? tipo;
}

function formatearDisponibilidad(disponibilidad: string | undefined | null): string {
  if (!disponibilidad) return "No disponible";
  return DISPONIBILIDAD_LABELS[disponibilidad] ?? disponibilidad;
}

function nombreCompletoTrabajador(trabajador: PerfilTrabajador): string {
  return [trabajador.nombre, trabajador.apellidos].filter(Boolean).join(" ").trim() || "No disponible";
}

function setLoading(loading: boolean): void {
  if (guardarBtn) guardarBtn.disabled = loading;
  if (logoutBtn) logoutBtn.disabled = loading;
  if (usernameInput) usernameInput.disabled = loading;
  if (emailInput) emailInput.disabled = loading;
}

async function leerError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as ApiError;
    const fieldMessage = body.fieldErrors ? Object.values(body.fieldErrors)[0] : null;
    return fieldMessage || body.message || fallback;
  } catch {
    return fallback;
  }
}

function pintarPerfil(perfil: PerfilResponse): void {
  setText(usernameInput, perfil.username);
  setText(emailInput, perfil.email);
  setText(roleInput, formatearRol(perfil.role));
  setText(estadoEl, perfil.enabled ? "Cuenta activa" : "Cuenta deshabilitada");

  if (perfil.empresa) {
    setText(empresaCodigoEl, perfil.empresa.codigo);
    setText(empresaNombreEl, perfil.empresa.nombre);
  } else {
    setText(empresaCodigoEl, "Sin empresa asociada");
    setText(empresaNombreEl, "Sin empresa asociada");
  }

  if (perfil.trabajador) {
    trabajadorDatosEl?.removeAttribute("hidden");
    trabajadorEmptyEl?.setAttribute("hidden", "true");
    setText(trabajadorNombreEl, nombreCompletoTrabajador(perfil.trabajador));
    setText(trabajadorTipoEl, formatearTipoTrabajador(perfil.trabajador.tipoTrabajador));
    setText(trabajadorDisponibilidadEl, formatearDisponibilidad(perfil.trabajador.estadoDisponibilidad));
    setText(trabajadorEmailEl, perfil.trabajador.emailContacto);
    setText(trabajadorTelefonoEl, perfil.trabajador.telefonoContacto);
    setText(trabajadorEstadoEl, perfil.trabajador.activo ? "Activo" : "Inactivo");
  } else {
    trabajadorDatosEl?.setAttribute("hidden", "true");
    trabajadorEmptyEl?.removeAttribute("hidden");
  }
}

async function cargarPerfil(): Promise<void> {
  ocultarMensajes();
  setLoading(true);

  try {
    const response = await authFetch("/api/perfil", {
      headers: { Accept: "application/json" }
    });

    if (response.status === 401) {
      clearAuthSession();
      window.location.replace("/html/login.html");
      return;
    }

    if (!response.ok) {
      throw new Error(await leerError(response, "No se pudo cargar el perfil."));
    }

    const perfil = (await response.json()) as PerfilResponse;
    pintarPerfil(perfil);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar el perfil.";
    mostrarError(message);
  } finally {
    setLoading(false);
  }
}

function validarFormulario(): { username: string; email: string } | null {
  const username = usernameInput?.value.trim() ?? "";
  const email = emailInput?.value.trim() ?? "";

  if (username.length < 3 || username.length > 80) {
    mostrarError("El nombre de usuario debe tener entre 3 y 80 caracteres.");
    usernameInput?.focus();
    return null;
  }

  if (!email || email.length > 120 || !email.includes("@")) {
    mostrarError("Introduce un email válido.");
    emailInput?.focus();
    return null;
  }

  return { username, email };
}

async function cerrarSesionLocal(): Promise<void> {
  try {
    await authFetch("/api/logout", { method: "POST" });
  } catch {
    // Si el backend ya revoco la sesion, igualmente limpiamos el navegador.
  } finally {
    clearAuthSession();
    window.location.href = "/html/login.html";
  }
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  ocultarMensajes();

  const payload = validarFormulario();
  if (!payload) return;

  setLoading(true);
  try {
    const response = await authFetch("/api/perfil", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 401) {
      clearAuthSession();
      window.location.replace("/html/login.html");
      return;
    }

    if (response.status === 409) {
      throw new Error(await leerError(response, "Ya existe un usuario con ese nombre o email."));
    }

    if (!response.ok) {
      throw new Error(await leerError(response, "No se pudo actualizar el perfil."));
    }

    const perfil = (await response.json()) as PerfilResponse;
    pintarPerfil(perfil);
    if (perfil.requiereNuevoLogin) {
      mostrarEstado(perfil.mensaje || "Perfil actualizado. Debes iniciar sesión de nuevo.");
      window.setTimeout(() => {
        void cerrarSesionLocal();
      }, 1200);
    } else {
      mostrarEstado(perfil.mensaje || "Perfil actualizado.");
      setLoading(false);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el perfil.";
    mostrarError(message);
    setLoading(false);
  }
});

logoutBtn?.addEventListener("click", () => {
  logoutBtn.disabled = true;
  void cerrarSesionLocal();
});

void cargarPerfil();
