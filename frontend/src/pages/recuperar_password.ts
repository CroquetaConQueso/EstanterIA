type ForgotPasswordRequest = {
  email: string;
};

type MessageResponse = {
  message: string;
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

function validateClient(email: string): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!email.trim()) {
    errors.email = 'El email es obligatorio';
    return errors;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    errors.email = 'El email no tiene un formato válido';
  }

  return errors;
}

if (form && emailInput) {
  emailInput.addEventListener('input', () => {
    setError(null);
    setSuccess(null);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    const payload: ForgotPasswordRequest = {
      email: emailInput.value.trim()
    };

    const clientErrors = validateClient(payload.email);
    if (Object.keys(clientErrors).length > 0) {
      setError(Object.values(clientErrors).join(' · '));
      return;
    }

    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      const data = text ? (JSON.parse(text) as MessageResponse) : null;

      if (!response.ok) {
        setError(data?.message ?? 'No se pudo procesar la recuperación de contraseña');
        return;
      }

      setSuccess(
        data?.message ?? 'Si el correo existe, se ha enviado un enlace de recuperación.'
      );

      form.reset();
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
      }
    }
  });
}