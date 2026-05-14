type ApiErrorResponse = {
  message?: string;
  fieldErrors?: Record<string, string>;
};

type ResetPasswordValidateResponse = {
  valid: boolean;
  message: string;
};

type ResetPasswordResponse = {
  message: string;
};

const form = document.querySelector<HTMLFormElement>("#form-reset-password");
const statusBox = document.querySelector<HTMLElement>("#reset-status");
const statusText = document.querySelector<HTMLElement>("#reset-status-text");
const passwordInput = document.querySelector<HTMLInputElement>("#reset-password");
const confirmPasswordInput = document.querySelector<HTMLInputElement>("#reset-confirm-password");
const errorEl = document.querySelector<HTMLElement>("#reset-error");
const successEl = document.querySelector<HTMLElement>("#reset-success");

const params = new URLSearchParams(window.location.search);
const token = params.get("token")?.trim() ?? "";

function setMessage(element: HTMLElement | null, message: string | null): void {
  if (!element) return;
  if (!message) {
    element.textContent = "";
    element.setAttribute("hidden", "");
    return;
  }

  element.textContent = message;
  element.removeAttribute("hidden");
}

function setStatus(message: string): void {
  if (statusText) statusText.textContent = message;
}

function validarPassword(password: string, confirmPassword: string): string | null {
  if (!password) return "La contraseña es obligatoria";
  if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres";
  if (password.length > 120) return "La contraseña no puede superar 120 caracteres";
  if (!confirmPassword) return "Debes repetir la contraseña";
  if (password !== confirmPassword) return "Las contraseñas no coinciden";
  return null;
}

async function parseErrorResponse(response: Response): Promise<ApiErrorResponse | null> {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) as ApiErrorResponse : null;
  } catch {
    return null;
  }
}

function getErrorMessage(data: ApiErrorResponse | null, status: number): string {
  if (data?.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
    return Object.values(data.fieldErrors).join(" ");
  }
  if (status === 400) return data?.message ?? "El enlace no es válido o la contraseña no cumple los requisitos";
  if (status >= 500) return "Error interno del servidor";
  return data?.message ?? `Error HTTP ${status}`;
}

async function validarToken(): Promise<void> {
  if (!token) {
    setStatus("Falta el token de recuperación.");
    return;
  }

  try {
    const response = await fetch(`/api/reset-password/validate?token=${encodeURIComponent(token)}`);
    if (!response.ok) {
      const data = await parseErrorResponse(response);
      setStatus(getErrorMessage(data, response.status));
      return;
    }

    const data = await response.json() as ResetPasswordValidateResponse;
    if (!data.valid) {
      setStatus(data.message);
      return;
    }

    statusBox?.setAttribute("hidden", "");
    form?.removeAttribute("hidden");
  } catch {
    setStatus("No se pudo validar el enlace de recuperación.");
  }
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(errorEl, null);
  setMessage(successEl, null);

  const password = passwordInput?.value ?? "";
  const confirmPassword = confirmPasswordInput?.value ?? "";
  const error = validarPassword(password, confirmPassword);

  if (error) {
    setMessage(errorEl, error);
    return;
  }

  const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const response = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, confirmPassword })
    });

    if (!response.ok) {
      const data = await parseErrorResponse(response);
      setMessage(errorEl, getErrorMessage(data, response.status));
      return;
    }

    const data = await response.json() as ResetPasswordResponse;
    setMessage(successEl, data.message);
    passwordInput?.setAttribute("disabled", "");
    confirmPasswordInput?.setAttribute("disabled", "");
    if (submitBtn) submitBtn.disabled = true;
  } catch {
    setMessage(errorEl, "No se pudo conectar con el servidor.");
  } finally {
    if (submitBtn && !successEl?.hasAttribute("hidden")) {
      submitBtn.disabled = true;
    } else if (submitBtn) {
      submitBtn.disabled = false;
    }
  }
});

passwordInput?.addEventListener("input", () => setMessage(errorEl, null));
confirmPasswordInput?.addEventListener("input", () => setMessage(errorEl, null));

void validarToken();
