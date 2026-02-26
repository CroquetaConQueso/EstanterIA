type LoginRequest = { userName: string; userPassword: string };
type LoginResponse = { message: string; userName: string; role: string; token: string };

const form = document.querySelector<HTMLFormElement>("#loginForm");
const usernameInput = document.querySelector<HTMLInputElement>("#username");
const passwordInput = document.querySelector<HTMLInputElement>("#password");
const out = document.querySelector<HTMLPreElement>("#out");

function show(obj: unknown) {
  if (!out) return;
  out.textContent = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
}

function validateClient(userName: string, userPassword: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!userName.trim()) errors.userName = "El usuario es obligatorio";
  if (!userPassword) errors.userPassword = "La contraseña es obligatoria";
  return errors;
}

if (form && usernameInput && passwordInput) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload: LoginRequest = {
      userName: usernameInput.value,
      userPassword: passwordInput.value,
    };

    const clientErrors = validateClient(payload.userName, payload.userPassword);
    if (Object.keys(clientErrors).length > 0) {
      show({ error: "CLIENT_VALIDATION_ERROR", fieldErrors: clientErrors });
      return;
    }

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      show(data ?? { error: "HTTP_ERROR", status: res.status });
      return;
    }

    const login = data as LoginResponse;
    localStorage.setItem("auth_token", login.token);
    localStorage.setItem("auth_user", login.userName);
    localStorage.setItem("auth_role", login.role);

    show(login);
    window.location.href = "/index.html";
  });
}