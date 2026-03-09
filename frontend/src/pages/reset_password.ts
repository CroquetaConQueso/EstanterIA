type ValidateResponse = {
  valid: boolean;
  message: string;
  expiresAt: string | null;
};

type MessageResponse = {
  message?: string;
  error?: string;
};

const form = document.getElementById('form-reset-password') as HTMLFormElement | null;
const newPasswordInput = document.getElementById('reset-new-password') as HTMLInputElement | null;
const confirmPasswordInput = document.getElementById('reset-confirm-password') as HTMLInputElement | null;
const errorEl = document.getElementById('reset-error') as HTMLElement | null;
const successEl = document.getElementById('reset-success') as HTMLElement | null;
const statusEl = document.getElementById('reset-status') as HTMLElement | null;
const submitBtn = document.getElementById('btn-reset-password') as HTMLButtonElement | null;

function getTokenFromUrl(): string {
  const params = new URLSearchParams(window.location.search);
  return (params.get('token') ?? '').trim();
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

function validateClient(newPassword: string, confirmPassword: string): string[] {
  const errors: string[] = [];

  if (!newPassword.trim()) {
    errors.push('La nueva contraseña es obligatoria.');
  } else if (newPassword.trim().length < 8) {
    errors.push('La nueva contraseña debe tener al menos 8 caracteres.');
  }

  if (!confirmPassword.trim()) {
    errors.push('Debes confirmar la nueva contraseña.');
  }

  if (newPassword.trim() && confirmPassword.trim() && newPassword !== confirmPassword) {
    errors.push('La confirmación de la contraseña no coincide.');
  }

  return errors;
}

async function validateToken(): Promise<boolean> {
  const token = getTokenFromUrl();

  if (!token) {
    setError('El enlace de recuperación no es válido.');
    if (statusEl) statusEl.textContent = 'Enlace no válido.';
    if (submitBtn) submitBtn.disabled = true;
    return false;
  }

  try {
    const response = await fetch(`/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`);
    const data = (await parseJsonSafely(response)) as ValidateResponse | null;

    if (!response.ok || !data?.valid) {
      setError(data?.message ?? 'El enlace de recuperación no es válido.');
      if (statusEl) statusEl.textContent = 'No se puede usar este enlace.';
      if (submitBtn) submitBtn.disabled = true;
      return false;
    }

    if (statusEl) {
      statusEl.textContent = 'Enlace válido. Ya puedes establecer una nueva contraseña.';
    }

    if (submitBtn) {
      submitBtn.disabled = false;
    }

    return true;
  } catch (error) {
    setError('No se pudo validar el enlace de recuperación.');
    if (statusEl) statusEl.textContent = 'Error al validar el enlace.';
    if (submitBtn) submitBtn.disabled = true;
    console.error('Error validando token de recuperación:', error);
    return false;
  }
}

async function submitReset(event: Event): Promise<void> {
  event.preventDefault();

  setError(null);
  setSuccess(null);

  const token = getTokenFromUrl();
  const newPassword = newPasswordInput?.value ?? '';
  const confirmPassword = confirmPasswordInput?.value ?? '';

  const errors = validateClient(newPassword, confirmPassword);
  if (errors.length > 0) {
    setError(errors.join(' '));
    return;
  }

  if (submitBtn) submitBtn.disabled = true;

  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim()
      })
    });

    const data = (await parseJsonSafely(response)) as MessageResponse | null;

    if (!response.ok) {
      throw new Error(data?.message ?? 'No se pudo restablecer la contraseña.');
    }

    setSuccess(data?.message ?? 'Contraseña actualizada correctamente.');
    form?.reset();

    if (statusEl) {
      statusEl.textContent = 'La contraseña ya ha sido actualizada. Puedes volver al acceso.';
    }
  } catch (error) {
    setError(error instanceof Error ? error.message : 'No se pudo restablecer la contraseña.');
    console.error('Error restableciendo contraseña:', error);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  void validateToken();

  form?.addEventListener('submit', (event) => {
    void submitReset(event);
  });
});