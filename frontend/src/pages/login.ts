type LoginRequest = { email: string; password: string };
type LoginResponse = { message: string; userName: string; role: string; token: string };

const form = document.querySelector<HTMLFormElement>("#form-login");
const useremailInput = document.querySelector<HTMLInputElement>("#login-email");
const userpasswordInput = document.querySelector<HTMLInputElement>("#login-password");
const rememberInput = document.querySelector<HTMLInputElement>("#login-remember");
const errorEl = document.querySelector<HTMLElement>("#login-error");
const out = document.querySelector<HTMLPreElement>("#out");

function show(obj: unknown): void {
  if (!out) return;
  out.textContent = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
}

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

function validateClient(email: string, password: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!email.trim()) errors.email = "El email es obligatorio";
  if (!password) errors.password = "La contraseña es obligatoria";
  return errors;
}

if (form && useremailInput && userpasswordInput) {
  useremailInput.addEventListener("input", () => setError(null));
  userpasswordInput.addEventListener("input", () => setError(null));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setError(null);

    const payload: LoginRequest = {
      email: useremailInput.value.trim(),
      password: userpasswordInput.value
    };

    const clienteErrores = validateClient(payload.email, payload.password);
    if (Object.keys(clienteErrores).length > 0) {
      setError(Object.values(clienteErrores).join(" "));
      show({ error: "CLIENTE_VALIDACION_ERROR", fieldErrors: clienteErrores });
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

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        show(data ?? { error: "HTTP_ERROR", status: res.status });

        const msg = data?.message ?? (res.status === 401 ? "Credenciales inválidas." : "Error al iniciar sesión");
        setError(msg);
        return;
      }

      const login = data as LoginResponse;
      const storage = rememberInput?.checked ? localStorage : sessionStorage;
      storage.setItem("auth_token", login.token);
      storage.setItem("auth_user", login.userName);
      storage.setItem("auth_role", login.role);

      show(login);
      window.location.href = "/html/home.html";
    } catch {
      setError("No se pudo conectar con el servidor.");
      show({ error: "NETWORK_ERROR" });
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
