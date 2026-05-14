type RegistroRequest = { username: string; email: string; password: string };
type ApiErrorResponse = {
  message?: string;
  error?: string;
  status?: number;
  fieldErrors?: Record<string, string>;
};

const form = document.querySelector<HTMLFormElement>("#form-registro");
const usernameInput = document.querySelector<HTMLInputElement>("#reg-nombre");
const emailInput = document.querySelector<HTMLInputElement>("#reg-email");
const passwordInput = document.querySelector<HTMLInputElement>("#reg-pass");
const password2Input = document.querySelector<HTMLInputElement>("#reg-pass2");
const errorReg = document.querySelector<HTMLElement>("#reg-error");

function setError(msg: string | null): void {
  if (!errorReg) return;
  if (!msg) {
    errorReg.textContent = "";
    errorReg.setAttribute("hidden", "");
    return;
  }

  errorReg.textContent = msg;
  errorReg.removeAttribute("hidden");
}

function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateClient(username: string, email: string, password: string, password2: string): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!username) errors.username = "El usuario es obligatorio";
  else if (username.length < 3) errors.username = "El usuario debe tener al menos 3 caracteres";
  else if (username.length > 80) errors.username = "El usuario no puede superar 80 caracteres";

  if (!email) errors.email = "El email es obligatorio";
  else if (!emailValido(email)) errors.email = "El email no tiene un formato válido";
  else if (email.length > 120) errors.email = "El email no puede superar 120 caracteres";

  if (!password) errors.password = "La contraseña es obligatoria";
  else if (password.length < 8) errors.password = "La contraseña debe tener al menos 8 caracteres";
  else if (password.length > 120) errors.password = "La contraseña no puede superar 120 caracteres";

  if (!password2) errors.password2 = "Debes repetir la contraseña";
  else if (password !== password2) errors.password2 = "Las contraseñas no coinciden";

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

function getRegistroErrorMessage(data: ApiErrorResponse | null, status: number): string {
  if (data?.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
    return Object.values(data.fieldErrors).join(" ");
  }
  if (status === 409) {
    if (data?.error === "USERNAME_ALREADY_EXISTS") return "Ya existe una cuenta con ese nombre de usuario";
    if (data?.error === "EMAIL_ALREADY_EXISTS") return "Ya existe una cuenta con ese email";
    return data?.message ?? "Ya existe una cuenta con esos datos";
  }
  if (status === 400) return data?.message ?? "Revisa los datos del formulario";
  if (status >= 500) return "Error interno del servidor";
  return data?.message ?? `Error HTTP ${status}`;
}

if (form && usernameInput && emailInput && passwordInput && password2Input) {
  usernameInput.addEventListener("input", () => setError(null));
  emailInput.addEventListener("input", () => setError(null));
  passwordInput.addEventListener("input", () => setError(null));
  password2Input.addEventListener("input", () => setError(null));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setError(null);

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const password2 = password2Input.value;

    const clienteErrores = validateClient(username, email, password, password2);
    if (Object.keys(clienteErrores).length > 0) {
      setError(Object.values(clienteErrores).join(" "));
      return;
    }

    const payload: RegistroRequest = { username, email, password };

    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await parseErrorResponse(res);
        setError(getRegistroErrorMessage(errorData, res.status));
        return;
      }

      window.location.href = "/html/login.html";
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
