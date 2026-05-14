import { authFetch } from "../lib/api";
import { requireAuth } from "../lib/auth-guard";

requireAuth();

type CrearInspeccionRequest = {
  estanteriaCodigo: string;
  notas: string | null;
  imagenPath: string | null;
};

type InspeccionResponse = {
  id: number;
  estanteriaCodigo: string;
  notas: string | null;
  imagenPath: string | null;
  estado: string;
  createdAt: string;
  message?: string;
};

type ApiErrorResponse = {
  status?: number;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
};

const form = document.querySelector<HTMLFormElement>("#form-inspeccion-nueva");
const estanteriaInput = document.querySelector<HTMLInputElement>("#insp-estanteria");
const imagenInput = document.querySelector<HTMLInputElement>("#insp-imagen");
const notasInput = document.querySelector<HTMLTextAreaElement>("#insp-notas");

const errorEl = document.querySelector<HTMLElement>("#insp-error");
const successEl = document.querySelector<HTMLElement>("#insp-success");

const API_URL = "/api/inspeccion_nueva";

function setError(msg: string | null): void {
  if (!errorEl) return;

  if (!msg) {
    errorEl.textContent = "";
    errorEl.setAttribute("hidden", "");
    return;
  }

  errorEl.textContent = msg;
  errorEl.removeAttribute("hidden");
}

function setSuccess(msg: string | null): void {
  if (!successEl) return;

  if (!msg) {
    successEl.textContent = "";
    successEl.setAttribute("hidden", "");
    return;
  }

  successEl.textContent = msg;
  successEl.removeAttribute("hidden");
}

function validateClient(estanteriaCodigo: string, imagenPath: string, notas: string): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!estanteriaCodigo) errors.estanteriaCodigo = "El código de estantería es obligatorio";
  else if (estanteriaCodigo.length < 5 || estanteriaCodigo.length > 50) {
    errors.estanteriaCodigo = "El código debe tener entre 5 y 50 caracteres";
  }

  if (imagenPath.length > 500) errors.imagenPath = "La ruta de imagen no puede superar 500 caracteres";
  if (notas.length > 1000) errors.notas = "Las notas no pueden superar 1000 caracteres";

  return errors;
}

async function parseErrorResponse(res: Response): Promise<ApiErrorResponse | null> {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) as ApiErrorResponse : null;
  } catch {
    return null;
  }
}

function getBackendErrorMessage(data: ApiErrorResponse | null, status: number): string {
  if (data?.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
    return Object.values(data.fieldErrors).join(" ");
  }
  if (data?.message) return data.message;
  if (status === 400) return "Revisa los datos del formulario";
  if (status === 401) return "Debes iniciar sesión";
  if (status === 403) return "No tienes permisos para crear inspecciones";
  if (status === 404) return "No se encontró el recurso solicitado";
  if (status === 409) return "Conflicto al crear la inspección";
  if (status >= 500) return "Error interno del servidor";
  return `Error HTTP ${status}`;
}

function buildPayload(): CrearInspeccionRequest {
  const notas = notasInput?.value.trim() ?? "";
  const imagenPath = imagenInput?.value.trim() ?? "";

  return {
    estanteriaCodigo: estanteriaInput?.value.trim() ?? "",
    notas: notas || null,
    imagenPath: imagenPath || null
  };
}

if (form && estanteriaInput && imagenInput && notasInput) {
  estanteriaInput.addEventListener("input", () => setError(null));
  imagenInput.addEventListener("input", () => setError(null));
  notasInput.addEventListener("input", () => setError(null));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = buildPayload();
    const clientErrors = validateClient(payload.estanteriaCodigo, payload.imagenPath || "", payload.notas || "");

    if (Object.keys(clientErrors).length > 0) {
      setError(Object.values(clientErrors).join(" "));
      return;
    }

    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await authFetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await parseErrorResponse(res);
        setError(getBackendErrorMessage(errorData, res.status));
        return;
      }

      const text = await res.text();
      const data = text ? JSON.parse(text) as InspeccionResponse : null;

      if (!data?.id) {
        setError("La inspección se creó, pero la respuesta no contiene ID");
        return;
      }

      sessionStorage.setItem("nuevaInspeccionId", String(data.id));
      setSuccess(`Inspección ${data.estanteriaCodigo} creada correctamente`);

      setTimeout(() => {
        window.location.href = "/html/inspecciones.html";
      }, 500);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
