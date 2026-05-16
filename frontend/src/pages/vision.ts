import { authFetch } from "../lib/api";
import { requireAdminPanelAccess } from "../lib/auth-guard";
import { imageFallbackText, normalizeImageUrl } from "../lib/image-paths";

requireAdminPanelAccess();

type VisionModo = "capture-and-predict" | "predict-existing";

type VisionRequest = {
  estanteriaCodigo: string;
  modo: VisionModo;
  imagePath: string | null;
  notas: string | null;
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

type ResultadoVisualResponse = {
  modeloVersion?: string | null;
  capturadaEn?: string | null;
  imagen?: {
    ruta?: string | null;
  } | null;
  resumen?: {
    estadoGeneralVisual?: string | null;
    ocupados?: number | null;
    vacios?: number | null;
    anomalias?: number | null;
    hayHuecosVacios?: boolean | null;
    hayAnomalias?: boolean | null;
  } | null;
  slots?: Array<{
    slotId?: string | null;
    estadoVisual?: string | null;
    confianza?: number | null;
  }> | null;
};

type VisionResponse = {
  message: string;
  id: number;
  estanteriaCodigo: string;
  imagePath?: string | null;
  imageUrl?: string | null;
  createdAt?: string | null;
  critical?: boolean | null;
  resultadoVisual?: ResultadoVisualResponse | null;
};

type ApiErrorResponse = {
  message?: string;
  error?: string;
  status?: number;
  fieldErrors?: Record<string, string>;
};

const form = document.querySelector<HTMLFormElement>("#vision-form");
const seccionSelect = document.querySelector<HTMLSelectElement>("#vision-seccion");
const estanteriaSelect = document.querySelector<HTMLSelectElement>("#vision-estanteria");
const modoSelect = document.querySelector<HTMLSelectElement>("#vision-modo");
const imagePathInput = document.querySelector<HTMLInputElement>("#vision-image-path");
const imagePathField = document.querySelector<HTMLElement>("#vision-image-path-field");
const notasInput = document.querySelector<HTMLTextAreaElement>("#vision-notas");

const errorEl = document.querySelector<HTMLElement>("#vision-error");
const successEl = document.querySelector<HTMLElement>("#vision-success");

const previewBox = document.querySelector<HTMLElement>("#preview-box");
const previewSection = document.querySelector<HTMLElement>("#preview-section");
const previewShelf = document.querySelector<HTMLElement>("#preview-shelf");
const previewShelfCode = document.querySelector<HTMLElement>("#preview-shelf-code");
const previewImage = document.querySelector<HTMLElement>("#preview-image");

const resultChip = document.querySelector<HTMLElement>("#result-chip");
const resultId = document.querySelector<HTMLElement>("#result-id");
const resultDate = document.querySelector<HTMLElement>("#result-date");
const resultModel = document.querySelector<HTMLElement>("#result-model");
const resultSlots = document.querySelector<HTMLElement>("#result-slots");

const sumEstado = document.querySelector<HTMLElement>("#sum-estado");
const sumOcupados = document.querySelector<HTMLElement>("#sum-ocupados");
const sumVacios = document.querySelector<HTMLElement>("#sum-vacios");
const sumAnomalias = document.querySelector<HTMLElement>("#sum-anomalias");

const goInspecciones = document.querySelector<HTMLAnchorElement>("#go-inspecciones");
const goAlertas = document.querySelector<HTMLElement>("#go-alertas");
const goTareas = document.querySelector<HTMLElement>("#go-tareas");

const btnReset = document.querySelector<HTMLButtonElement>("#btn-reset");

const visionStatusText = document.querySelector<HTMLElement>("#vision-status-text");
const visionStatusChip = document.querySelector<HTMLElement>("#vision-status-chip");

const EMPRESA_CODIGO = "EMP-DEMO";

let secciones: SeccionResponse[] = [];
let estanteriasActuales: EstanteriaResumenResponse[] = [];

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

function setOperationalStatus(type: "idle" | "running" | "success" | "critical" | "error", text: string): void {
  if (visionStatusText) visionStatusText.textContent = text;
  if (!visionStatusChip) return;

  visionStatusChip.className = "status-chip";

  switch (type) {
    case "running":
      visionStatusChip.classList.add("media");
      visionStatusChip.textContent = "EJECUTANDO";
      break;
    case "success":
      visionStatusChip.classList.add("ok");
      visionStatusChip.textContent = "COMPLETADA";
      break;
    case "critical":
      visionStatusChip.classList.add("critica");
      visionStatusChip.textContent = "REVISAR";
      break;
    case "error":
      visionStatusChip.classList.add("descartada");
      visionStatusChip.textContent = "ERROR";
      break;
    default:
      visionStatusChip.classList.add("pendiente");
      visionStatusChip.textContent = "EN ESPERA";
      break;
  }
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

function getResumen(resultadoVisual: ResultadoVisualResponse | null | undefined): ResultadoVisualResponse["resumen"] {
  return resultadoVisual?.resumen ?? null;
}

function getImagePath(result: Partial<VisionResponse>): string {
  return result.imageUrl || result.imagePath || result.resultadoVisual?.imagen?.ruta || "";
}

function getEstadoGeneral(result: Partial<VisionResponse>): string {
  return getResumen(result.resultadoVisual)?.estadoGeneralVisual || "Sin análisis";
}

function getSeccionSeleccionada(): SeccionResponse | null {
  const id = Number(seccionSelect?.value ?? "");
  return secciones.find((seccion) => seccion.id === id) ?? null;
}

function getEstanteriaSeleccionada(): EstanteriaResumenResponse | null {
  const codigo = estanteriaSelect?.value ?? "";
  return estanteriasActuales.find((estanteria) => estanteria.codigo === codigo) ?? null;
}

function isResultadoRevisable(result: VisionResponse): boolean {
  const resumen = getResumen(result.resultadoVisual);
  return Boolean(resumen?.hayHuecosVacios || resumen?.hayAnomalias || result.critical);
}

function formatFecha(value: string | null | undefined): string {
  if (!value) return "—";
  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return value;
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(fecha);
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
  if (status === 400) return "La petición de visión no es válida";
  if (status === 401) return "Debes iniciar sesión";
  if (status === 403) return "No tienes permisos para ejecutar visión";
  if (status === 404) return "No se encontró la estantería solicitada";
  if (status >= 500) return "Error interno al ejecutar la inspección visual";
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

function updateCurrentSelectionMeta(): void {
  const seccion = getSeccionSeleccionada();
  const estanteria = getEstanteriaSeleccionada();

  if (previewSection) previewSection.textContent = seccion ? `${seccion.codigo} · ${seccion.nombre}` : "—";
  if (previewShelf) previewShelf.textContent = estanteria ? estanteria.nombre : "—";
  if (previewShelfCode) previewShelfCode.textContent = estanteria?.codigo ?? "—";
}

function setPreview(result: Partial<VisionResponse>): void {
  const imagePath = getImagePath(result);
  const imageUrl = normalizeImageUrl(imagePath);

  updateCurrentSelectionMeta();
  if (previewImage) previewImage.textContent = imagePath || "—";
  if (!previewBox) return;

  previewBox.innerHTML = "";
  previewBox.classList.toggle("has-image", Boolean(imageUrl));

  if (!imageUrl) {
    const placeholder = document.createElement("div");
    placeholder.className = "preview-placeholder";
    const text = document.createElement("p");
    text.textContent = "Sin captura reciente";
    const small = document.createElement("small");
    small.textContent = imageFallbackText(imagePath);
    placeholder.append(text, small);
    previewBox.appendChild(placeholder);
    return;
  }

  const img = document.createElement("img");
  img.className = "preview-image";
  img.src = imageUrl;
  img.alt = `Imagen de inspección ${result.estanteriaCodigo ?? ""}`.trim();
  img.addEventListener("error", () => {
    previewBox.classList.remove("has-image");
    previewBox.innerHTML = "";
    const placeholder = document.createElement("div");
    placeholder.className = "preview-placeholder";
    const text = document.createElement("p");
    text.textContent = "Imagen no disponible";
    const small = document.createElement("small");
    small.textContent = imageFallbackText(imagePath);
    placeholder.append(text, small);
    previewBox.appendChild(placeholder);
  });
  previewBox.appendChild(img);
}

function setSummary(resultadoVisual: ResultadoVisualResponse | null | undefined): void {
  const resumen = getResumen(resultadoVisual);
  if (sumEstado) sumEstado.textContent = resumen?.estadoGeneralVisual ?? "—";
  if (sumOcupados) sumOcupados.textContent = String(resumen?.ocupados ?? 0);
  if (sumVacios) sumVacios.textContent = String(resumen?.vacios ?? 0);
  if (sumAnomalias) sumAnomalias.textContent = String(resumen?.anomalias ?? 0);
}

function setResultMeta(result: Partial<VisionResponse>): void {
  const resultadoVisual = result.resultadoVisual ?? null;
  const resumen = getResumen(resultadoVisual);
  const slots = Array.isArray(resultadoVisual?.slots) ? resultadoVisual.slots : [];

  if (resultId) resultId.textContent = result.id ? `#${result.id}` : "—";
  if (resultDate) resultDate.textContent = formatFecha(result.createdAt || resultadoVisual?.capturadaEn);
  if (resultModel) resultModel.textContent = resultadoVisual?.modeloVersion || "—";
  if (resultSlots) {
    resultSlots.textContent = slots.length > 0
      ? slots.map((slot) => `${slot.slotId}: ${slot.estadoVisual} (${Math.round((slot.confianza ?? 0) * 100)}%)`).join(" | ")
      : "Sin análisis visual";
  }

  if (!resultChip) return;

  if (!resultadoVisual) {
    resultChip.textContent = "SIN ANÁLISIS VISUAL";
    resultChip.className = "status-chip descartada";
  } else if (resumen?.hayHuecosVacios || resumen?.hayAnomalias) {
    resultChip.textContent = resumen.estadoGeneralVisual || "REVISAR";
    resultChip.className = "status-chip critica";
  } else {
    resultChip.textContent = resumen?.estadoGeneralVisual || "RESULTADO OK";
    resultChip.className = "status-chip ok";
  }
}

function toggleNextLinks(enabled: boolean, revisable = false, inspeccionId: number | null = null): void {
  if (goInspecciones) {
    goInspecciones.classList.toggle("disabled", !enabled);
    goInspecciones.href = inspeccionId
      ? `inspeccion_detalle.html?id=${encodeURIComponent(String(inspeccionId))}`
      : "inspecciones.html";
  }

  if (goAlertas) goAlertas.classList.toggle("disabled", !(enabled && revisable));
  if (goTareas) goTareas.classList.toggle("disabled", !(enabled && revisable));
}

function updateImagePathState(): void {
  if (!modoSelect || !imagePathInput) return;

  const isExisting = modoSelect.value === "predict-existing";
  imagePathInput.disabled = !isExisting;
  imagePathField?.classList.toggle("input-disabled", !isExisting);

  if (!isExisting) imagePathInput.value = "";
}

function validateClient(estanteriaCodigo: string, modo: string, imagePath: string, notas: string): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!seccionSelect?.value) errors.seccion = "Debes seleccionar una sección";
  if (!estanteriaCodigo.trim()) errors.estanteriaCodigo = "Debes seleccionar una estantería";
  if (!modo) errors.modo = "Debes seleccionar un modo de ejecución";
  if (modo === "predict-existing" && !imagePath.trim()) errors.imagePath = "Debes indicar la ruta de la imagen";
  if (imagePath.length > 500) errors.imagePath = "La ruta de imagen no puede superar 500 caracteres";
  if (notas.length > 1000) errors.notas = "Las notas no pueden superar 1000 caracteres";

  return errors;
}

function buildPayload(): VisionRequest {
  return {
    estanteriaCodigo: estanteriaSelect?.value ?? "",
    modo: (modoSelect?.value as VisionModo) ?? "capture-and-predict",
    imagePath: imagePathInput?.value.trim() || null,
    notas: notasInput?.value.trim() || null
  };
}

async function runVision(payload: VisionRequest): Promise<VisionResponse> {
  const res = await authFetch(`/api/vision/inspeccionar/${encodeURIComponent(payload.estanteriaCodigo)}`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      modo: payload.modo,
      imagePath: payload.imagePath,
      notas: payload.notas
    })
  });

  if (!res.ok) {
    const errorData = await parseErrorResponse(res);
    throw new Error(getBackendErrorMessage(errorData, res.status));
  }

  return res.json() as Promise<VisionResponse>;
}

async function cargarSecciones(): Promise<void> {
  if (!seccionSelect) return;

  try {
    secciones = await fetchJson<SeccionResponse[]>(`/api/empresas/${encodeURIComponent(EMPRESA_CODIGO)}/secciones`);

    if (secciones.length === 0) {
      setSelectOptions(seccionSelect, "No hay secciones disponibles", []);
      seccionSelect.disabled = true;
      setError("No hay secciones disponibles para ejecutar Vision.");
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

  estanteriasActuales = [];
  setSelectOptions(estanteriaSelect, "Cargando estanterías...", []);
  estanteriaSelect.disabled = true;
  updateCurrentSelectionMeta();

  if (!seccionId) {
    setSelectOptions(estanteriaSelect, "Selecciona primero una sección", []);
    return;
  }

  try {
    estanteriasActuales = await fetchJson<EstanteriaResumenResponse[]>(`/api/secciones/${encodeURIComponent(seccionId)}/estanterias`);

    if (estanteriasActuales.length === 0) {
      setSelectOptions(estanteriaSelect, "Esta sección no tiene estanterías", []);
      setError("La sección seleccionada no tiene estanterías configuradas.");
      updateCurrentSelectionMeta();
      return;
    }

    setSelectOptions(
      estanteriaSelect,
      "Selecciona una estantería",
      estanteriasActuales.map((estanteria) => ({
        value: estanteria.codigo,
        label: `${estanteria.codigo} · ${estanteria.nombre}`
      }))
    );
    estanteriaSelect.disabled = false;
  } catch (err) {
    setSelectOptions(estanteriaSelect, "No se pudieron cargar estanterías", []);
    setError(err instanceof Error ? err.message : "No se pudieron cargar las estanterías.");
  } finally {
    updateCurrentSelectionMeta();
  }
}

function resetView(): void {
  setError(null);
  setSuccess(null);
  setPreview({ estanteriaCodigo: "", imagePath: "" });
  setSummary(null);
  setResultMeta({ id: undefined, createdAt: null, resultadoVisual: null });
  toggleNextLinks(false, false, null);
  setOperationalStatus("idle", "El módulo está listo para ejecutar una inspección.");
  updateImagePathState();
}

seccionSelect?.addEventListener("change", () => {
  setError(null);
  setSuccess(null);
  void cargarEstanteriasDeSeccion(seccionSelect.value);
});

estanteriaSelect?.addEventListener("change", () => {
  setError(null);
  setSuccess(null);
  updateCurrentSelectionMeta();
});

modoSelect?.addEventListener("change", updateImagePathState);

btnReset?.addEventListener("click", () => {
  form?.reset();
  estanteriasActuales = [];
  setSelectOptions(estanteriaSelect, "Selecciona primero una sección", []);
  if (estanteriaSelect) estanteriaSelect.disabled = true;
  resetView();
});

form?.addEventListener("submit", async (e: SubmitEvent) => {
  e.preventDefault();
  setError(null);
  setSuccess(null);

  const payload = buildPayload();
  const errors = validateClient(
    payload.estanteriaCodigo,
    payload.modo,
    payload.imagePath || "",
    payload.notas || ""
  );

  if (Object.keys(errors).length > 0) {
    setError(Object.values(errors).join(" | "));
    setOperationalStatus("error", "La inspección no puede ejecutarse porque faltan datos o hay valores no válidos.");
    return;
  }

  const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add("disabled");
  }

  try {
    setOperationalStatus("running", "La inspección visual está en ejecución.");

    const result = await runVision(payload);
    const revisable = isResultadoRevisable(result);

    setSuccess(`Inspección visual completada para ${result.estanteriaCodigo}`);
    setPreview(result);
    setSummary(result.resultadoVisual);
    setResultMeta(result);
    toggleNextLinks(true, revisable, result.id);

    if (result.id) sessionStorage.setItem("nuevaInspeccionId", String(result.id));

    if (revisable) {
      setOperationalStatus("critical", `Resultado ${getEstadoGeneral(result)}. Revisa los slots detectados.`);
    } else {
      setOperationalStatus("success", "La inspección se completó correctamente y ya puede revisarse en el historial.");
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : "No se pudo completar la inspección visual");
    setOperationalStatus("error", "Se produjo un error durante la ejecución del flujo de visión.");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove("disabled");
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  resetView();
  void cargarSecciones();
});
