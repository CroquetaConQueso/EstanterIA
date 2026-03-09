type ForgotPasswordRequest = {
  email: string;
};

type MessageResponse = {
  message?: string;
  error?: string;
};

const form = document.querySelector<HTMLFormElement>('#form-recovery');
const emailInput = document.querySelector<HTMLInputElement>('#recovery-email');
const errorEl = document.querySelector<HTMLElement>('#recovery-error');
const successEl = document.querySelector<HTMLElement>('#recovery-success');

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

function validateClient(email: string): string[] {
  const errors: string[] = [];

  if (!email.trim()) {
    errors.push('El correo electrónico es obligatorio.');
    return errors;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    errors.push('Introduce un correo electrónico válido.');
  }

  return errors;
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

function getRecoverySuccessMessage(): string {
  return 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.';
}

async function submitRecovery(event: Event): Promise<void> {
  event.preventDefault();

  setError(null);
  setSuccess(null);

  const email = emailInput?.value ?? '';
  const validationErrors = validateClient(email);

  if (validationErrors.length > 0) {
    setError(validationErrors.join(' '));
    return;
  }

  const submitBtn = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const payload: ForgotPasswordRequest = {
      email: email.trim()
    };

    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = (await parseJsonSafely(response)) as MessageResponse | null;

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error(data?.message ?? 'Revisa el correo introducido.');
      }

      throw new Error('No se pudo procesar la solicitud en este momento.');
    }

    setSuccess(getRecoverySuccessMessage());
    form?.reset();
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : 'No se pudo procesar la solicitud en este momento.'
    );
    console.error('Error en recuperación de contraseña:', error);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  emailInput?.addEventListener('input', () => {
    setError(null);
    setSuccess(null);
  });

  form?.addEventListener('submit', (event) => {
    void submitRecovery(event);
  });
});