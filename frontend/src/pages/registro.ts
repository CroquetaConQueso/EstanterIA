type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  role: string | null;
};

type ApiResponse = {
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string> | null;
};

const form = document.querySelector<HTMLFormElement>('#form-registro');
const usernameInput = document.querySelector<HTMLInputElement>('#reg-nombre');
const emailInput = document.querySelector<HTMLInputElement>('#reg-email');
const passwordInput = document.querySelector<HTMLInputElement>('#reg-pass');
const confirmPasswordInput = document.querySelector<HTMLInputElement>('#reg-pass2');
const roleInput = document.querySelector<HTMLSelectElement>('#reg-rol');
const termsInput = document.querySelector<HTMLInputElement>('#reg-terms');

const errorEl = document.querySelector<HTMLElement>('#reg-error');
const successEl = document.querySelector<HTMLElement>('#reg-success');

function setError(msg: string | null): void {
  if (!errorEl) return;

  if (!msg) {
    errorEl.textContent = '';
    errorEl.setAttribute('hidden', '');
    return;
  }

  errorEl.textContent = msg;
  errorEl.removeAttribute('hidden');
}

function setSuccess(msg: string | null): void {
  if (!successEl) return;

  if (!msg) {
    successEl.textContent = '';
    successEl.setAttribute('hidden', '');
    return;
  }

  successEl.textContent = msg;
  successEl.removeAttribute('hidden');
}

async function parseJsonSafely(response: Response): Promise<any> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function validateClient(
  username: string,
  email: string,
  password: string,
  confirmPassword: string,
  acceptedTerms: boolean
): string[] {
  const errors: string[] = [];

  if (!username.trim()) {
    errors.push('El nombre de usuario es obligatorio.');
  } else if (username.trim().length < 3) {
    errors.push('El nombre de usuario debe tener al menos 3 caracteres.');
  }

  if (!email.trim()) {
    errors.push('El correo electrónico es obligatorio.');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Introduce un correo electrónico válido.');
    }
  }

  if (!password.trim()) {
    errors.push('La contraseña es obligatoria.');
  } else if (password.trim().length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres.');
  }

  if (!confirmPassword.trim()) {
    errors.push('Debes confirmar la contraseña.');
  }

  if (password && confirmPassword && password !== confirmPassword) {
    errors.push('La confirmación de la contraseña no coincide.');
  }

  if (!acceptedTerms) {
    errors.push('Debes aceptar las condiciones de uso.');
  }

  return errors;
}

function mapRegisterError(data: ApiResponse | null, status: number): string {
  const errorCode = (data?.error ?? '').trim().toUpperCase();

  if (errorCode === 'EMAIL_ALREADY_EXISTS') {
    return 'Ya existe una cuenta con ese correo electrónico.';
  }

  if (errorCode === 'USERNAME_ALREADY_EXISTS') {
    return 'Ya existe una cuenta con ese nombre de usuario.';
  }

  if (errorCode === 'USER_ALREADY_EXISTS' || errorCode === 'DATA_INTEGRITY_VIOLATION') {
    return 'Ya existe una cuenta con esos datos.';
  }

  if (status === 400 && data?.fieldErrors) {
    const firstFieldError = Object.values(data.fieldErrors)[0];
    if (firstFieldError) {
      return firstFieldError;
    }
  }

  if (status === 400) {
    return data?.message ?? 'Revisa los datos introducidos.';
  }

  if (status === 409) {
    return data?.message ?? 'Ya existe una cuenta con esos datos.';
  }

  return 'No se pudo completar el registro.';
}

async function submitRegister(event: Event): Promise<void> {
  event.preventDefault();
  setError(null);
  setSuccess(null);

  const username = usernameInput?.value ?? '';
  const email = emailInput?.value ?? '';
  const password = passwordInput?.value ?? '';
  const confirmPassword = confirmPasswordInput?.value ?? '';
  const role = roleInput?.value?.trim() || null;
  const acceptedTerms = Boolean(termsInput?.checked);

  const clientErrors = validateClient(
    username,
    email,
    password,
    confirmPassword,
    acceptedTerms
  );

  if (clientErrors.length > 0) {
    setError(clientErrors.join(' '));
    return;
  }

  const submitBtn = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const payload: RegisterRequest = {
      username: username.trim(),
      email: email.trim(),
      password,
      role
    };

    const response = await fetch('/api/auth/registro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = (await parseJsonSafely(response)) as ApiResponse | null;

    if (!response.ok) {
      throw new Error(mapRegisterError(data, response.status));
    }

    setSuccess('Cuenta creada correctamente. Ya puedes iniciar sesión.');
    form?.reset();

    window.setTimeout(() => {
      window.location.href = 'login.html';
    }, 1200);
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : 'No se pudo completar el registro.'
    );
    console.error('Error en registro:', error);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  form?.addEventListener('submit', (event) => {
    void submitRegister(event);
  });
});