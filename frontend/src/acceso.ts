type PersonalRequest = { userName: string; userPassword: string };

const form = document.querySelector<HTMLFormElement>("#loginForm")!;
const usernameInput = document.querySelector<HTMLInputElement>("#username")!;
const passwordInput = document.querySelector<HTMLInputElement>("#password")!;
const out = document.querySelector<HTMLPreElement>("#out")!;

function show(obj: unknown) {
  out.textContent = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
}

function validateClient(userName: string, userPassword: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!userName.trim()) errors.userName = "El usuario es obligatorio";
  if (!userPassword) errors.userPassword = "La contraseña es obligatoria";
  return errors;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload: PersonalRequest = {
    userName: usernameInput.value,
    userPassword: passwordInput.value,
  };

  const clientErrors = validateClient(payload.userName, payload.userPassword);
  if (Object.keys(clientErrors).length > 0) {
    show({ error: "CLIENT_VALIDATION_ERROR", fieldErrors: clientErrors });
    return;
  }

  try {
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

    show(data);
  } catch (err) {
    show({ error: "NETWORK_ERROR", detail: String(err) });
  }
});
