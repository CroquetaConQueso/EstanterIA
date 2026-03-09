document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-perfil');
  const errorEl = document.getElementById('perfil-error');
  const successEl = document.getElementById('perfil-success');

  const usernameInput = document.getElementById('perfil-username');
  const emailInput = document.getElementById('perfil-email');
  const roleInput = document.getElementById('perfil-role');
  const enabledInput = document.getElementById('perfil-enabled');

  const summaryUsername = document.getElementById('summary-username');
  const summaryEmail = document.getElementById('summary-email');
  const summaryRole = document.getElementById('summary-role');
  const summaryEnabled = document.getElementById('summary-enabled');

  const btnRecargar = document.getElementById('btn-recargar-perfil');

  function getStoredToken() {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  function getTokenStorage() {
    if (localStorage.getItem('auth_token')) return localStorage;
    if (sessionStorage.getItem('auth_token')) return sessionStorage;
    return null;
  }

  function clearAuthStorage() {
    [localStorage, sessionStorage].forEach((storage) => {
      storage.removeItem('auth_token');
      storage.removeItem('auth_user');
      storage.removeItem('auth_role');
      storage.removeItem('auth_email');
    });
  }

  function redirectToLogin() {
    window.location.href = 'login.html';
  }

  function setError(msg) {
    if (!errorEl) return;

    if (!msg) {
      errorEl.textContent = '';
      errorEl.setAttribute('hidden', '');
      return;
    }

    errorEl.textContent = msg;
    errorEl.removeAttribute('hidden');
  }

  function setSuccess(msg) {
    if (!successEl) return;

    if (!msg) {
      successEl.textContent = '';
      successEl.setAttribute('hidden', '');
      return;
    }

    successEl.textContent = msg;
    successEl.removeAttribute('hidden');
  }

  function saveAuthSnapshot(data) {
    const storage = getTokenStorage() || sessionStorage;

    if (data?.userName) storage.setItem('auth_user', data.userName);
    if (data?.role) storage.setItem('auth_role', data.role);
    if (data?.email) storage.setItem('auth_email', data.email);
  }

  function fillProfile(data) {
    if (usernameInput) usernameInput.value = data?.userName || '';
    if (emailInput) emailInput.value = data?.email || '';
    if (roleInput) roleInput.value = data?.role || '—';
    if (enabledInput) enabledInput.value = data?.enabled ? 'Activo' : 'Deshabilitado';

    if (summaryUsername) summaryUsername.textContent = data?.userName || '—';
    if (summaryEmail) summaryEmail.textContent = data?.email || '—';
    if (summaryRole) summaryRole.textContent = data?.role || '—';
    if (summaryEnabled) summaryEnabled.textContent = data?.enabled ? 'Activo' : 'Deshabilitado';
  }

  async function authFetch(url, options = {}) {
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

  async function parseJsonSafely(response) {
    const text = await response.text();

    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  function validateClient(userName, email) {
    const errors = [];

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

  async function loadProfile() {
    setError(null);
    setSuccess(null);

    try {
      const response = await authFetch('/api/perfil/me', {
        method: 'GET'
      });

      if (response.status === 401) {
        clearAuthStorage();
        redirectToLogin();
        return;
      }

      const data = await parseJsonSafely(response);

      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo cargar el perfil');
      }

      fillProfile(data);
      saveAuthSnapshot(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo cargar el perfil');
    }
  }

  async function submitProfile(event) {
    event.preventDefault();

    const userName = usernameInput?.value || '';
    const email = emailInput?.value || '';

    setError(null);
    setSuccess(null);

    const validationErrors = validateClient(userName, email);
    if (validationErrors.length > 0) {
      setError(validationErrors.join(' · '));
      return;
    }

    const submitBtn = form?.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const response = await authFetch('/api/perfil/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userName: userName.trim(),
          email: email.trim()
        })
      });

      if (response.status === 401) {
        clearAuthStorage();
        redirectToLogin();
        return;
      }

      const data = await parseJsonSafely(response);

      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo actualizar el perfil');
      }

      fillProfile(data);
      saveAuthSnapshot(data);
      setSuccess('Perfil actualizado correctamente.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo actualizar el perfil');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  if (form) {
    form.addEventListener('submit', submitProfile);
  }

  if (btnRecargar) {
    btnRecargar.addEventListener('click', () => {
      loadProfile();
    });
  }

  loadProfile();
});