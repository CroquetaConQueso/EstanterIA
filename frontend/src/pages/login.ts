import { clearAuthSession } from "../lib/api";

type LoginRequest = { email: string; password: string };
type LoginResponse = { message: string; userName: string; role: string; token: string };
type ApiErrorResponse = {
  message?: string;
  error?: string;
  status?: number;
  fieldErrors?: Record<string, string>;
};

const ADMIN_HOME_URL = "/html/home.html";

const form = document.querySelector<HTMLFormElement>("#form-login");
const emailInput = document.querySelector<HTMLInputElement>("#login-email");
const passwordInput = document.querySelector<HTMLInputElement>("#login-password");
const rememberInput = document.querySelector<HTMLInputElement>("#login-remember");
const errorEl = document.querySelector<HTMLElement>("#login-error");

function setError(msg: string | null): void {
  if (!errorEl) return;
  if (!msg) {
    errorEl.textContent = "";
    errorEl.setAttribute("hidden", "");
    return;
  }

  errorEl.textContent = msg;
  errorEl.removeAttribute("hidden");
}

function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateClient(email: string, password: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!email.trim()) errors.email = "El email es obligatorio";
  else if (!emailValido(email)) errors.email = "El email no tiene un formato válido";
  else if (email.length > 120) errors.email = "El email no puede superar 120 caracteres";
  if (!password) errors.password = "La contraseña es obligatoria";
  return errors;
}

async function parseErrorResponse(res: Response): Promise<ApiErrorResponse | null> {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) as ApiErrorResponse : null;
  } catch {
    return null;
  }
}

function getLoginErrorMessage(data: ApiErrorResponse | null, status: number): string {
  if (data?.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
    return Object.values(data.fieldErrors).join(" ");
  }
  if (status === 400) return data?.message ?? "Revisa los datos del formulario";
  if (status === 401) return "Credenciales inválidas";
  if (status === 403) return data?.message ?? "No tienes permisos para acceder";
  if (status >= 500) return "Error interno del servidor";
  return data?.message ?? `Error HTTP ${status}`;
}

function isAdminPanelRole(role: string): boolean {
  const normalizedRole = role.toUpperCase();
  return normalizedRole === "ADMIN" || normalizedRole === "SUPERADMIN";
}

if (form && emailInput && passwordInput) {
  emailInput.addEventListener("input", () => setError(null));
  passwordInput.addEventListener("input", () => setError(null));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setError(null);

    const payload: LoginRequest = {
      email: emailInput.value.trim(),
      password: passwordInput.value
    };

    const clienteErrores = validateClient(payload.email, payload.password);
    if (Object.keys(clienteErrores).length > 0) {
      setError(Object.values(clienteErrores).join(" "));
      return;
    }

    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await parseErrorResponse(res);
        setError(getLoginErrorMessage(errorData, res.status));
        return;
      }

      const data = await res.json() as LoginResponse;
      if (!isAdminPanelRole(data.role)) {
        clearAuthSession();
        setError("El panel web está reservado a administradores y gerentes.");
        return;
      }

      const storage = rememberInput?.checked ? localStorage : sessionStorage;
      storage.setItem("auth_token", data.token);
      storage.setItem("auth_user", data.userName);
      storage.setItem("auth_role", data.role);

      window.location.href = ADMIN_HOME_URL;
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
