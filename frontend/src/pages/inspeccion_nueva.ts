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

type SeccionResponse = {
  id: number;
  codigo: string;
  nombre: string;
};

type EstanteriaResumenResponse = {
  id: number;
  codigo: string;
  nombre: string;
};

type ApiErrorResponse = {
  status?: number;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
};

const form = document.querySelector<HTMLFormElement>("#form-inspeccion-nueva");
const seccionSelect = document.querySelector<HTMLSelectElement>("#insp-seccion");
const estanteriaSelect = document.querySelector<HTMLSelectElement>("#insp-estanteria");
const estanteriaHelp = document.querySelector<HTMLElement>("#insp-estanteria-help");
const imagenInput = document.querySelector<HTMLInputElement>("#insp-imagen");
const notasInput = document.querySelector<HTMLTextAreaElement>("#insp-notas");

const errorEl = document.querySelector<HTMLElement>("#insp-error");
const successEl = document.querySelector<HTMLElement>("#insp-success");

const API_URL = "/api/inspeccion_nueva";
const EMPRESA_CODIGO = "EMP-DEMO";

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

function setSelectOptions(
  select: HTMLSelectElement | null,
  placeholder: string,
  options: Array<{ value: string; label: string }>
): void {
  if (!select) return;

  select.innerHTML = "";
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = placeholder;
  select.appendChild(empty);

  options.forEach((option) => {
    const el = document.createElement("option");
    el.value = option.value;
    el.textContent = option.label;
    select.appendChild(el);
  });
}

function validateClient(estanteriaCodigo: string, imagenPath: string, notas: string): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!seccionSelect?.value) errors.seccionId = "Selecciona una sección";
  if (!estanteriaCodigo) errors.estanteriaCodigo = "Selecciona una estantería";

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

async function fetchJson<T>(url: string): Promise<T> {
  const res = await authFetch(url, {
    method: "GET",
    headers: { "Accept": "application/json" }
  });

  if (!res.ok) {
    const errorData = await parseErrorResponse(res);
    throw new Error(getBackendErrorMessage(errorData, res.status));
  }

  return res.json() as Promise<T>;
}

function buildPayload(): CrearInspeccionRequest {
  const notas = notasInput?.value.trim() ?? "";
  const imagenPath = imagenInput?.value.trim() ?? "";

  return {
    estanteriaCodigo: estanteriaSelect?.value.trim() ?? "",
    notas: notas || null,
    imagenPath: imagenPath || null
  };
}

async function cargarSecciones(): Promise<void> {
  if (!seccionSelect || !estanteriaSelect) return;

  try {
    const secciones = await fetchJson<SeccionResponse[]>(`/api/empresas/${encodeURIComponent(EMPRESA_CODIGO)}/secciones`);

    if (secciones.length === 0) {
      setSelectOptions(seccionSelect, "No hay secciones disponibles", []);
      seccionSelect.disabled = true;
      setSelectOptions(estanteriaSelect, "Sin estanterías", []);
      estanteriaSelect.disabled = true;
      setError("No hay secciones disponibles para crear inspecciones.");
      return;
    }

    setSelectOptions(
      seccionSelect,
      "Selecciona una sección",
      secciones.map((seccion) => ({
        value: String(seccion.id),
        label: `${seccion.codigo} · ${seccion.nombre}`
      }))
    );
    seccionSelect.disabled = false;
  } catch (err) {
    setSelectOptions(seccionSelect, "No se pudieron cargar secciones", []);
    seccionSelect.disabled = true;
    setError(err instanceof Error ? err.message : "No se pudieron cargar las secciones.");
  }
}

async function cargarEstanteriasDeSeccion(seccionId: string): Promise<void> {
  if (!estanteriaSelect) return;

  setSelectOptions(estanteriaSelect, "Cargando estanterías...", []);
  estanteriaSelect.disabled = true;

  if (!seccionId) {
    setSelectOptions(estanteriaSelect, "Selecciona primero una sección", []);
    if (estanteriaHelp) estanteriaHelp.textContent = "No necesitas escribir códigos manualmente.";
    return;
  }

  try {
    const estanterias = await fetchJson<EstanteriaResumenResponse[]>(`/api/secciones/${encodeURIComponent(seccionId)}/estanterias`);

    if (estanterias.length === 0) {
      setSelectOptions(estanteriaSelect, "Esta sección no tiene estanterías", []);
      if (estanteriaHelp) estanteriaHelp.textContent = "Crea una estantería en el editor antes de inspeccionar esta sección.";
      setError("La sección seleccionada no tiene estanterías configuradas.");
      return;
    }

    setSelectOptions(
      estanteriaSelect,
      "Selecciona una estantería",
      estanterias.map((estanteria) => ({
        value: estanteria.codigo,
        label: `${estanteria.codigo} · ${estanteria.nombre}`
      }))
    );
    estanteriaSelect.disabled = false;
    if (estanteriaHelp) estanteriaHelp.textContent = "Se usará el código de la estantería seleccionada.";
  } catch (err) {
    setSelectOptions(estanteriaSelect, "No se pudieron cargar estanterías", []);
    setError(err instanceof Error ? err.message : "No se pudieron cargar las estanterías.");
  }
}

seccionSelect?.addEventListener("change", () => {
  setError(null);
  setSuccess(null);
  void cargarEstanteriasDeSeccion(seccionSelect.value);
});

imagenInput?.addEventListener("input", () => setError(null));
notasInput?.addEventListener("input", () => setError(null));
estanteriaSelect?.addEventListener("change", () => setError(null));

form?.addEventListener("submit", async (e) => {
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

document.addEventListener("DOMContentLoaded", () => {
  void cargarSecciones();
});
