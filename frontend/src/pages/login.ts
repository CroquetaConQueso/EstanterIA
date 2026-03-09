type LoginRequest = {
  email: string;
  password: string;
};

type ApiResponse = {
  message?: string;
  error?: string;
  username?: string;
  userName?: string;
  role?: string;
  token?: string;
};

const form = document.querySelector<HTMLFormElement>('#form-login');
const emailInput = document.querySelector<HTMLInputElement>('#login-email');
const passwordInput = document.querySelector<HTMLInputElement>('#login-password');
const rememberInput = document.querySelector<HTMLInputElement>('#login-remember');
const errorEl = document.querySelector<HTMLElement>('#login-error');
const debugOut = document.querySelector<HTMLElement>('#out');

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

function clearPreviousSession(): void {
  [localStorage, sessionStorage].forEach((storage) => {
    storage.removeItem('auth_token');
    storage.removeItem('auth_user');
    storage.removeItem('auth_role');
    storage.removeItem('auth_email');
  });
}

function getTargetStorage(): Storage {
  return rememberInput?.checked ? localStorage : sessionStorage;
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

function validateClient(email: string, password: string): string[] {
  const errors: string[] = [];

  if (!email.trim()) {
    errors.push('El correo electrónico es obligatorio.');
  }

  if (!password.trim()) {
    errors.push('La contraseña es obligatoria.');
  }

  return errors;
}

function mapLoginError(data: ApiResponse | null, status: number): string {
  const errorCode = (data?.error ?? '').trim().toUpperCase();

  if (status === 401 || errorCode === 'INVALID_CREDENTIALS') {
    return 'El correo o la contraseña no son correctos.';
  }

  if (status === 403 || errorCode === 'USER_DISABLED') {
    return 'Tu cuenta está deshabilitada. Contacta con el administrador.';
  }

  if (status === 400 || errorCode === 'VALIDATION_ERROR') {
    return 'Revisa los datos introducidos.';
  }

  return 'No se pudo iniciar sesión.';
}

function readLoginReasonFromUrl(): void {
  const params = new URLSearchParams(window.location.search);
  const reason = (params.get('reason') ?? '').trim();

  if (reason === 'session-expired') {
    setError('Tu sesión ha caducado. Inicia sesión de nuevo.');
  }
}

function redirectAfterLogin(): void {
  window.location.href = 'home.html';
}

async function submitLogin(event: Event): Promise<void> {
  event.preventDefault();
  setError(null);

  const email = emailInput?.value ?? '';
  const password = passwordInput?.value ?? '';

  const validationErrors = validateClient(email, password);
  if (validationErrors.length > 0) {
    setError(validationErrors.join(' '));
    return;
  }

  const submitBtn = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const payload: LoginRequest = {
      email: email.trim(),
      password
    };

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = (await parseJsonSafely(response)) as ApiResponse | null;

    if (!response.ok) {
      clearPreviousSession();
      throw new Error(mapLoginError(data, response.status));
    }

    const token = data?.token?.trim();
    const userName = (data?.userName ?? data?.username ?? '').trim();
    const role = (data?.role ?? '').trim();

    if (!token) {
      clearPreviousSession();
      throw new Error('No se pudo iniciar sesión.');
    }

    clearPreviousSession();

    const storage = getTargetStorage();
    storage.setItem('auth_token', token);

    if (userName) {
      storage.setItem('auth_user', userName);
    }

    if (role) {
      storage.setItem('auth_role', role);
    }

    storage.setItem('auth_email', email.trim());

    redirectAfterLogin();
  } catch (error) {
    clearPreviousSession();
    setError(
      error instanceof Error
        ? error.message
        : 'No se pudo conectar con el servidor.'
    );
    console.error('Error en login:', error);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  clearPreviousSession();

  if (debugOut) {
    debugOut.setAttribute('hidden', '');
    debugOut.textContent = '';
  }

  readLoginReasonFromUrl();

  form?.addEventListener('submit', (event) => {
    void submitLogin(event);
  });
});