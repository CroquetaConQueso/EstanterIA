import { authFetch } from "../lib/api";
import { requireAdminPanelAccess } from "../lib/auth-guard";
import { imageFallbackText, normalizeImageUrl } from "../lib/image-paths";

requireAdminPanelAccess();

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

type CapturaResponse = {
  fileName: string;
  relativePath: string;
  imageUrl: string;
  sizeBytes: number;
  createdAt: string;
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
const capturaSelect = document.querySelector<HTMLSelectElement>("#insp-captura");
const capturasRefreshButton = document.querySelector<HTMLButtonElement>("#insp-capturas-refresh");
const capturasHelp = document.querySelector<HTMLElement>("#insp-capturas-help");
const capturaPreview = document.querySelector<HTMLElement>("#insp-captura-preview");
const capturaPreviewImg = document.querySelector<HTMLImageElement>("#insp-captura-preview-img");
const capturaPreviewTitle = document.querySelector<HTMLElement>("#insp-captura-preview-title");
const capturaPreviewPath = document.querySelector<HTMLElement>("#insp-captura-preview-path");
const notasInput = document.querySelector<HTMLTextAreaElement>("#insp-notas");

const errorEl = document.querySelector<HTMLElement>("#insp-error");
const successEl = document.querySelector<HTMLElement>("#insp-success");

const API_URL = "/api/inspeccion_nueva";
const EMPRESA_CODIGO = "EMP-DEMO";

let capturasDisponibles: CapturaResponse[] = [];

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

function setCapturasHelp(message: string): void {
  if (capturasHelp) capturasHelp.textContent = message;
}

function formatCaptureLabel(captura: CapturaResponse): string {
  const createdAt = new Date(captura.createdAt);
  const fecha = Number.isNaN(createdAt.getTime())
    ? ""
    : ` · ${createdAt.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}`;
  return `${captura.fileName}${fecha}`;
}

function getSelectedCaptura(): CapturaResponse | null {
  const selectedUrl = capturaSelect?.value ?? "";
  if (!selectedUrl) return null;
  return capturasDisponibles.find((captura) => captura.imageUrl === selectedUrl) ?? null;
}

function setCapturePreview(captura: CapturaResponse | null): void {
  capturaPreview?.classList.toggle("has-image", Boolean(captura));

  if (!captura) {
    if (capturaPreviewImg) {
      capturaPreviewImg.hidden = true;
      capturaPreviewImg.removeAttribute("src");
    }
    if (capturaPreviewTitle) capturaPreviewTitle.textContent = "Sin imagen asociada.";
    if (capturaPreviewPath) capturaPreviewPath.textContent = "";
    return;
  }

  const imageUrl = normalizeImageUrl(captura.imageUrl);
  if (!imageUrl) {
    if (capturaPreviewImg) capturaPreviewImg.hidden = true;
    if (capturaPreviewTitle) capturaPreviewTitle.textContent = "Imagen no disponible";
    if (capturaPreviewPath) capturaPreviewPath.textContent = imageFallbackText(captura.imageUrl);
    return;
  }

  if (capturaPreviewImg) {
    capturaPreviewImg.hidden = true;
    capturaPreviewImg.onload = () => {
      capturaPreviewImg.hidden = false;
    };
    capturaPreviewImg.onerror = () => {
      capturaPreviewImg.hidden = true;
      if (capturaPreviewTitle) capturaPreviewTitle.textContent = "Imagen no disponible";
      if (capturaPreviewPath) capturaPreviewPath.textContent = imageFallbackText(captura.imageUrl);
    };
    capturaPreviewImg.src = imageUrl;
  }

  if (capturaPreviewTitle) capturaPreviewTitle.textContent = captura.fileName;
  if (capturaPreviewPath) capturaPreviewPath.textContent = captura.imageUrl;
}

function resetCapturas(message = "Sin imagen asociada."): void {
  capturasDisponibles = [];
  setSelectOptions(capturaSelect, "Sin imagen", []);
  if (capturaSelect) capturaSelect.disabled = true;
  if (capturasRefreshButton) capturasRefreshButton.disabled = !estanteriaSelect?.value;
  setCapturasHelp(message);
  setCapturePreview(null);
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
  const captura = getSelectedCaptura();

  return {
    estanteriaCodigo: estanteriaSelect?.value.trim() ?? "",
    notas: notas || null,
    imagenPath: captura?.imageUrl ?? null
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
  resetCapturas("Selecciona una estanteria para cargar capturas.");

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

async function cargarCapturasDeEstanteria(estanteriaCodigo: string): Promise<void> {
  if (!capturaSelect) return;

  if (!estanteriaCodigo) {
    resetCapturas("Selecciona una estanteria para cargar capturas.");
    return;
  }

  capturasDisponibles = [];
  setSelectOptions(capturaSelect, "Cargando capturas...", []);
  capturaSelect.disabled = true;
  if (capturasRefreshButton) capturasRefreshButton.disabled = true;
  setCapturasHelp("Cargando capturas disponibles...");
  setCapturePreview(null);

  try {
    const capturas = await fetchJson<CapturaResponse[]>(
      `/api/capturas?estanteriaCodigo=${encodeURIComponent(estanteriaCodigo)}`
    );

    capturasDisponibles = capturas;
    setSelectOptions(
      capturaSelect,
      "Sin imagen",
      capturas.map((captura) => ({
        value: captura.imageUrl,
        label: formatCaptureLabel(captura)
      }))
    );
    capturaSelect.disabled = false;

    if (capturas.length === 0) {
      setCapturasHelp("No hay capturas disponibles para esta estantería.");
      return;
    }

    setCapturasHelp(`${capturas.length} captura${capturas.length === 1 ? "" : "s"} disponible${capturas.length === 1 ? "" : "s"}.`);
  } catch (err) {
    resetCapturas("No se pudieron cargar las capturas disponibles.");
    setError(err instanceof Error ? err.message : "No se pudieron cargar las capturas disponibles.");
  } finally {
    if (capturasRefreshButton) capturasRefreshButton.disabled = !estanteriaCodigo;
  }
}

seccionSelect?.addEventListener("change", () => {
  setError(null);
  setSuccess(null);
  void cargarEstanteriasDeSeccion(seccionSelect.value);
});

notasInput?.addEventListener("input", () => setError(null));
estanteriaSelect?.addEventListener("change", () => {
  setError(null);
  setSuccess(null);
  void cargarCapturasDeEstanteria(estanteriaSelect.value);
});
capturaSelect?.addEventListener("change", () => {
  setError(null);
  setCapturePreview(getSelectedCaptura());
});
capturasRefreshButton?.addEventListener("click", () => {
  setError(null);
  void cargarCapturasDeEstanteria(estanteriaSelect?.value ?? "");
});

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
  resetCapturas("Selecciona una estanteria para cargar capturas.");
  void cargarSecciones();
});
