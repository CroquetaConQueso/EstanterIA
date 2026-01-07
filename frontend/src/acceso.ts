const form = document.querySelector<HTMLFormElement>("#loginForm")!;
const usernameInput = document.querySelector<HTMLInputElement>("#username")!;
const passwordInput = document.querySelector<HTMLInputElement>("#password")!;
const out = document.querySelector<HTMLPreElement>("#out")!;

function show(obj: unknown) {
  out.textContent = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  const errors: Record<string, string> = {};
  if (!username) errors.username = "El usuario es obligatorio";
  if (!password) errors.password = "La contraseña es obligatoria";

  if (Object.keys(errors).length > 0) {
    show({ error: "CLIENT_VALIDATION_ERROR", fieldErrors: errors });
    return;
  }

  // Demo: login falso
  show({ message: "Login OK (demo)", user: username });
});
