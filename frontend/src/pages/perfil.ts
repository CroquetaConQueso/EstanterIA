type PerfilResponse = {
  userName: string;
  email: string;
  role: string;
  enabled: boolean;
};

type PerfilUpdateRequest = {
  userName: string;
  email: string;
};

const errorEl = document.getElementById('perfil-error') as HTMLElement | null;
const successEl = document.getElementById('perfil-success') as HTMLElement | null;

const form = document.getElementById('form-perfil') as HTMLFormElement | null;
const usernameInput = document.getElementById('perfil-username') as HTMLInputElement | null;
const emailInput = document.getElementById('perfil-email') as HTMLInputElement | null;
const roleInput = document.getElementById('perfil-role') as HTMLInputElement | null;
const enabledInput = document.getElementById('perfil-enabled') as HTMLInputElement | null;

const btnRecargar = document.getElementById('btn-recargar-perfil') as HTMLButtonElement | null;

function getStoredToken(): string | null {
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

function getTokenStorage(): Storage {
  if (localStorage.getItem('auth_token')) return localStorage;
  if (sessionStorage.getItem('auth_token')) return sessionStorage;
  return sessionStorage;
}

function clearAuthStorage(): void {
  [localStorage, sessionStorage].forEach((storage) => {
    storage.removeItem('auth_token');
    storage.removeItem('auth_user');
    storage.removeItem('auth_role');
    storage.removeItem('auth_email');
  });
}

function redirectToLogin(): void {
  window.location.href = 'login.html';
}

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

function saveAuthSnapshot(data: PerfilResponse): void {
  const storage = getTokenStorage();
  storage.setItem('auth_user', data.userName);
  storage.setItem('auth_role', data.role);
  storage.setItem('auth_email', data.email);
}

function fillProfile(data: PerfilResponse): void {
  if (usernameInput) usernameInput.value = data.userName;
  if (emailInput) emailInput.value = data.email;
  if (roleInput) roleInput.value = data.role;
  if (enabledInput) enabledInput.value = data.enabled ? 'Activo' : 'Deshabilitado';
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();

  if (!token) {
    clearAuthStorage();
    redirectToLogin();
    throw new Error('No hay sesión activa');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  return fetch(url, {
    ...options,
    headers
  });
}

async function parseJsonSafely(response: Response): Promise<any> {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizePerfilResponse(raw: any): PerfilResponse {
  if (!raw || typeof raw !== 'object') {
    throw new Error('La respuesta del perfil está vacía o no es JSON válido');
  }

  const userName = String(raw.userName ?? raw.username ?? '').trim();
  const email = String(raw.email ?? '').trim();
  const role = String(raw.role ?? raw.rol ?? '').trim();

  let enabled = false;
  if (typeof raw.enabled === 'boolean') {
    enabled = raw.enabled;
  } else if (typeof raw.enabled === 'string') {
    enabled = raw.enabled.toLowerCase() === 'true';
  }

  if (!userName) {
    throw new Error('La respuesta del perfil no contiene userName/username válido');
  }

  if (!email) {
    throw new Error('La respuesta del perfil no contiene email válido');
  }

  if (!role) {
    throw new Error('La respuesta del perfil no contiene role válido');
  }

  return {
    userName,
    email,
    role,
    enabled
  };
}

function validateClient(userName: string, email: string): string[] {
  const errors: string[] = [];

  if (!userName.trim()) {
    errors.push('El nombre de usuario es obligatorio');
  }

  if (!email.trim()) {
    errors.push('El email es obligatorio');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('El email no tiene un formato válido');
    }
  }

  return errors;
}

async function loadProfile(options?: { preserveSuccess?: boolean }): Promise<void> {
  setError(null);
  if (!options?.preserveSuccess) {
    setSuccess(null);
  }

  try {
    const response = await authFetch('/api/perfil/me', {
      method: 'GET'
    });

    if (response.status === 401) {
      clearAuthStorage();
      redirectToLogin();
      return;
    }

    const rawData = await parseJsonSafely(response);

    if (!response.ok) {
      throw new Error(rawData?.message ?? 'No se pudo cargar el perfil');
    }

    const data = normalizePerfilResponse(rawData);

    fillProfile(data);
    saveAuthSnapshot(data);
  } catch (error) {
    setError(error instanceof Error ? error.message : 'No se pudo cargar el perfil');
    console.error('Error cargando perfil:', error);
  }
}

async function submitProfile(event: Event): Promise<void> {
  event.preventDefault();

  const userName = usernameInput?.value ?? '';
  const email = emailInput?.value ?? '';

  setError(null);
  setSuccess(null);

  const validationErrors = validateClient(userName, email);
  if (validationErrors.length > 0) {
    setError(validationErrors.join(' · '));
    return;
  }

  const submitBtn = form?.querySelector('button[type="submit"]') as HTMLButtonElement | null;
  if (submitBtn) submitBtn.disabled = true;

  try {
    const payload: PerfilUpdateRequest = {
      userName: userName.trim(),
      email: email.trim()
    };

    const response = await authFetch('/api/perfil/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 401) {
      clearAuthStorage();
      redirectToLogin();
      return;
    }

    const rawData = await parseJsonSafely(response);

    if (!response.ok) {
      throw new Error(rawData?.message ?? 'No se pudo actualizar el perfil');
    }

    await loadProfile({ preserveSuccess: true });
    setSuccess('Perfil actualizado correctamente.');
  } catch (error) {
    setError(error instanceof Error ? error.message : 'No se pudo actualizar el perfil');
    console.error('Error actualizando perfil:', error);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  form?.addEventListener('submit', (event) => {
    void submitProfile(event);
  });

  btnRecargar?.addEventListener('click', () => {
    void loadProfile();
  });

  void loadProfile();
});