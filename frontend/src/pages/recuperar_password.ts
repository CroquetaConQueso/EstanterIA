type ApiErrorResponse = {
  message?: string;
  fieldErrors?: Record<string, string>;
};

type ForgotPasswordResponse = {
  message: string;
};

const form = document.querySelector<HTMLFormElement>("#form-recuperar-password");
const emailInput = document.querySelector<HTMLInputElement>("#recovery-email");
const errorEl = document.querySelector<HTMLElement>("#recovery-error");
const successEl = document.querySelector<HTMLElement>("#recovery-success");

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

function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarEmail(email: string): string | null {
  if (!email) return "El email es obligatorio";
  if (!emailValido(email)) return "El email no tiene un formato válido";
  if (email.length > 120) return "El email no puede superar 120 caracteres";
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
  if (status === 400) return data?.message ?? "Revisa el email introducido";
  if (status >= 500) return "Error interno del servidor";
  return data?.message ?? `Error HTTP ${status}`;
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(errorEl, null);
  setMessage(successEl, null);

  const email = emailInput?.value.trim() ?? "";
  const error = validarEmail(email);
  if (error) {
    setMessage(errorEl, error);
    return;
  }

  const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const response = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const data = await parseErrorResponse(response);
      setMessage(errorEl, getErrorMessage(data, response.status));
      return;
    }

    const data = await response.json() as ForgotPasswordResponse;
    setMessage(successEl, data.message);
    form.reset();
  } catch {
    setMessage(errorEl, "No se pudo conectar con el servidor.");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

emailInput?.addEventListener("input", () => {
  setMessage(errorEl, null);
  setMessage(successEl, null);
});
