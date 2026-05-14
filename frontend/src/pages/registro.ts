type RegistroRequest = { username: string; email: string; role: string; tienda: string; password: string };

const form = document.querySelector<HTMLFormElement>("#form-registro");
const usernameInput = document.querySelector<HTMLInputElement>("#reg-nombre");
const useremailInput = document.querySelector<HTMLInputElement>("#reg-email");
const userroleInput = document.querySelector<HTMLSelectElement>("#reg-rol");
const usertiendaInput = document.querySelector<HTMLInputElement>("#reg-tienda");
const userpasswordInput = document.querySelector<HTMLInputElement>("#reg-pass");
const userpassword2Input = document.querySelector<HTMLInputElement>("#reg-pass2");
const useracceptInput = document.querySelector<HTMLInputElement>("#reg-terms");
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

function validateClient(
  username: string,
  email: string,
  role: string,
  tienda: string,
  password: string,
  acceptedTerms: boolean
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!username.trim()) errors.username = "El nombre del usuario es obligatorio";
  if (!email.trim()) errors.email = "El email es obligatorio";
  else if (!email.includes("@")) errors.email = "El email no es válido";
  if (!role) errors.role = "Debes escoger un rol";
  if (!tienda.trim()) errors.tienda = "Se debe establecer el nombre de una tienda";
  if (!password.trim()) errors.password = "La contraseña es obligatoria";
  if (!acceptedTerms) errors.terms = "Debes aceptar las condiciones";

  return errors;
}

if (form && usernameInput && useremailInput && userroleInput && usertiendaInput && userpasswordInput && userpassword2Input) {
  usernameInput.addEventListener("input", () => setError(null));
  useremailInput.addEventListener("input", () => setError(null));
  userroleInput.addEventListener("input", () => setError(null));
  usertiendaInput.addEventListener("input", () => setError(null));
  userpasswordInput.addEventListener("input", () => setError(null));
  userpassword2Input.addEventListener("input", () => setError(null));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setError(null);

    const password = userpasswordInput.value;
    const password2 = userpassword2Input.value;

    if (password !== password2) {
      setError("Las contraseñas no coinciden");
      return;
    }

    const payload: RegistroRequest = {
      username: usernameInput.value.trim(),
      email: useremailInput.value.trim(),
      role: userroleInput.value,
      tienda: usertiendaInput.value,
      password
    };

    const acceptedTerms = !!useracceptInput?.checked;
    const clienteErrores = validateClient(payload.username, payload.email, payload.role, payload.tienda, payload.password, acceptedTerms);
    if (Object.keys(clienteErrores).length > 0) {
      setError(Object.values(clienteErrores).join(" "));
      return;
    }

    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        let msg = data?.message;

        if (!msg) {
          if (res.status === 409) msg = "Ya existe una cuenta con ese email o usuario";
          else if (res.status === 400) msg = "Revisa los datos del formulario";
          else msg = "Error al crear la cuenta";
        }
        setError(msg);
        return;
      }

      window.location.href = "/html/login.html";
    } catch {
      setError("No se puede conectar con el servidor");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
