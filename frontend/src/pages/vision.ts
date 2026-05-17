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
  descripcion?: string | null;
  activa?: boolean | null;
};

type EstanteriaResumenResponse = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activa?: boolean | null;
};

type PlanoResumenResponse = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  ancho: number;
  alto: number;
  activo: boolean | null;
};

type PlanoZonaOperativaResponse = {
  id: number;
  seccion: SeccionResponse;
};

type PlanoEstanteriaOperativaResponse = {
  layoutId: number;
  zonaId: number;
  estanteria: EstanteriaResumenResponse;
};

type PlanoOperativoResponse = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean | null;
  zonas: PlanoZonaOperativaResponse[];
  estanterias: PlanoEstanteriaOperativaResponse[];
};

type CapturaResponse = {
  fileName: string;
  relativePath: string;
  imageUrl: string;
  sizeBytes: number;
  createdAt: string;
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
const planoSelect = document.querySelector<HTMLSelectElement>("#vision-plano");
const planoHelp = document.querySelector<HTMLElement>("#vision-plano-help");
const seccionSelect = document.querySelector<HTMLSelectElement>("#vision-seccion");
const estanteriaSelect = document.querySelector<HTMLSelectElement>("#vision-estanteria");
const modoSelect = document.querySelector<HTMLSelectElement>("#vision-modo");
const imagePathInput = document.querySelector<HTMLInputElement>("#vision-image-path");
const imagePathField = document.querySelector<HTMLElement>("#vision-image-path-field");
const capturasDatalist = document.querySelector<HTMLDataListElement>("#vision-capturas-list");
const capturasHelp = document.querySelector<HTMLElement>("#vision-capturas-help");
const notasInput = document.querySelector<HTMLTextAreaElement>("#vision-notas");

const errorEl = document.querySelector<HTMLElement>("#vision-error");
const successEl = document.querySelector<HTMLElement>("#vision-success");

const previewBox = document.querySelector<HTMLElement>("#preview-box");
const previewPlan = document.querySelector<HTMLElement>("#preview-plan");
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
const PLANO_DEMO_CODIGO = "PLANO-DEMO";

let planosActivos: PlanoResumenResponse[] = [];
let planoActual: PlanoOperativoResponse | null = null;
let secciones: SeccionResponse[] = [];
let estanteriasActuales: EstanteriaResumenResponse[] = [];
let capturasActuales: CapturaResponse[] = [];

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
      visionStatusChip.textContent = "Ejecutando";
      break;
    case "success":
      visionStatusChip.classList.add("ok");
      visionStatusChip.textContent = "Completada";
      break;
    case "critical":
      visionStatusChip.classList.add("critica");
      visionStatusChip.textContent = "Revisar";
      break;
    case "error":
      visionStatusChip.classList.add("descartada");
      visionStatusChip.textContent = "Error";
      break;
    default:
      visionStatusChip.classList.add("pendiente");
      visionStatusChip.textContent = "En espera";
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

function setCapturasHelp(message: string): void {
  if (capturasHelp) capturasHelp.textContent = message;
}

function renderCapturasDatalist(capturas: CapturaResponse[]): void {
  if (!capturasDatalist) return;
  capturasDatalist.innerHTML = "";

  capturas.forEach((captura) => {
    const option = document.createElement("option");
    option.value = captura.imageUrl;
    option.label = formatCaptureLabel(captura);
    capturasDatalist.appendChild(option);
  });
}

function resetCapturas(message = "Selecciona una estantería para cargar capturas disponibles."): void {
  capturasActuales = [];
  renderCapturasDatalist([]);
  setCapturasHelp(message);
  if (imagePathInput) imagePathInput.value = "";
  if (previewImage) previewImage.textContent = "—";
}

function getResumen(resultadoVisual: ResultadoVisualResponse | null | undefined): ResultadoVisualResponse["resumen"] {
  return resultadoVisual?.resumen ?? null;
}

function labelEstadoVisual(value: string | null | undefined): string {
  const normalized = value?.trim();
  if (!normalized) return "";
  const labels: Record<string, string> = {
    OK: "Resultado correcto",
    CON_HUECOS: "Con huecos vacíos",
    CON_ANOMALIAS: "Con anomalías",
    CON_ANOMALÍAS: "Con anomalías",
    SIN_DATOS: "Sin datos",
    OCUPADO: "Ocupado",
    VACIO: "Vacío",
    VACÍO: "Vacío",
    ANOMALIA: "Anomalía",
    ANOMALÍA: "Anomalía"
  };
  return labels[normalized.toUpperCase()] ?? normalized.replaceAll("_", " ").toLowerCase().replace(/^\p{L}/u, (char) => char.toUpperCase());
}

function getImagePath(result: Partial<VisionResponse>): string {
  return result.imageUrl || result.imagePath || result.resultadoVisual?.imagen?.ruta || "";
}

function getEstadoGeneral(result: Partial<VisionResponse>): string {
  return labelEstadoVisual(getResumen(result.resultadoVisual)?.estadoGeneralVisual) || "Sin análisis";
}

function getPlanoSeleccionado(): PlanoResumenResponse | null {
  const codigo = planoSelect?.value ?? "";
  return planosActivos.find((plano) => plano.codigo === codigo) ?? null;
}

function getSeccionSeleccionada(): SeccionResponse | null {
  const id = Number(seccionSelect?.value ?? "");
  return secciones.find((seccion) => seccion.id === id) ?? null;
}

function getEstanteriaSeleccionada(): EstanteriaResumenResponse | null {
  const codigo = estanteriaSelect?.value ?? "";
  return estanteriasActuales.find((estanteria) => estanteria.codigo === codigo) ?? null;
}

function updateSubmitAvailability(): void {
  const submitBtn = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!submitBtn) return;

  const disabled = !planoSelect?.value || !seccionSelect?.value || !estanteriaSelect?.value || !getEstanteriaSeleccionada();
  submitBtn.disabled = disabled;
  submitBtn.classList.toggle("disabled", disabled);
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

function formatCaptureLabel(captura: CapturaResponse): string {
  const fecha = formatFecha(captura.createdAt);
  return fecha === "—" ? captura.fileName : `${captura.fileName} · ${fecha}`;
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
  const plano = getPlanoSeleccionado();
  const seccion = getSeccionSeleccionada();
  const estanteria = getEstanteriaSeleccionada();

  if (previewPlan) previewPlan.textContent = plano ? `${plano.codigo} · ${plano.nombre}` : "—";
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
  if (sumEstado) sumEstado.textContent = labelEstadoVisual(resumen?.estadoGeneralVisual) || "—";
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
      ? slots.map((slot) => `${slot.slotId}: ${labelEstadoVisual(slot.estadoVisual)} (${Math.round((slot.confianza ?? 0) * 100)}%)`).join(" | ")
      : "Sin análisis visual";
  }

  if (!resultChip) return;

  if (!resultadoVisual) {
    resultChip.textContent = "Sin análisis visual";
    resultChip.className = "status-chip descartada";
  } else if (resumen?.hayHuecosVacios || resumen?.hayAnomalias) {
    resultChip.textContent = labelEstadoVisual(resumen.estadoGeneralVisual) || "Revisar";
    resultChip.className = "status-chip critica";
  } else {
    resultChip.textContent = labelEstadoVisual(resumen?.estadoGeneralVisual) || "Resultado correcto";
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
  if (isExisting && capturasActuales.length > 0) {
    setCapturasHelp(`${capturasActuales.length} captura${capturasActuales.length === 1 ? "" : "s"} disponible${capturasActuales.length === 1 ? "" : "s"} para la estantería seleccionada.`);
  } else if (isExisting) {
    setCapturasHelp(estanteriaSelect?.value ? "No hay capturas disponibles para esta estantería." : "Selecciona una estantería para cargar capturas disponibles.");
  }
}

function validateClient(estanteriaCodigo: string, modo: string, imagePath: string, notas: string): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!planoSelect?.value) errors.plano = "Debes seleccionar un plano activo";
  if (!seccionSelect?.value) errors.seccion = "Debes seleccionar una sección";
  if (!estanteriaCodigo.trim()) errors.estanteriaCodigo = "Debes seleccionar una estantería";
  if (estanteriaCodigo.trim() && !getEstanteriaSeleccionada()) {
    errors.estanteriaCodigo = "Selecciona una estantería activa del plano y sección actuales";
  }
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

function disableInspectionSelection(message: string): void {
  setSelectOptions(seccionSelect, message, []);
  if (seccionSelect) seccionSelect.disabled = true;
  setSelectOptions(estanteriaSelect, "Sin estanterías disponibles", []);
  if (estanteriaSelect) estanteriaSelect.disabled = true;
  estanteriasActuales = [];
  resetCapturas();
  updateCurrentSelectionMeta();
  updateSubmitAvailability();
}

function renderSeccionesDePlano(plano: PlanoOperativoResponse): void {
  if (!seccionSelect) return;

  secciones = plano.zonas
    .map((zona) => zona.seccion)
    .filter((seccion, index, all) =>
      seccion.activa !== false && all.findIndex((item) => item.id === seccion.id) === index
    );

  if (secciones.length === 0) {
    disableInspectionSelection("El plano no tiene secciones colocadas");
    setError("El plano seleccionado no tiene secciones colocadas.");
    return;
  }

  setSelectOptions(
    seccionSelect,
    "Selecciona una sección del plano",
    secciones.map((seccion) => ({
      value: String(seccion.id),
      label: `${seccion.codigo} · ${seccion.nombre}`
    }))
  );
  seccionSelect.disabled = false;
  renderEstanteriasDeSeccion("");
  updateSubmitAvailability();
}

function renderEstanteriasDeSeccion(seccionId: string): void {
  if (!estanteriaSelect) return;

  estanteriasActuales = [];
  setSelectOptions(estanteriaSelect, "Selecciona primero una sección", []);
  estanteriaSelect.disabled = true;
  resetCapturas();

  if (!planoActual || !seccionId) {
    updateCurrentSelectionMeta();
    updateSubmitAvailability();
    return;
  }

  const zonaIds = new Set(
    planoActual.zonas
      .filter((zona) => String(zona.seccion.id) === seccionId)
      .map((zona) => zona.id)
  );

  estanteriasActuales = planoActual.estanterias
    .filter((layout) => zonaIds.has(layout.zonaId) && layout.estanteria.activa !== false)
    .map((layout) => layout.estanteria)
    .filter((estanteria, index, all) =>
      all.findIndex((item) => item.codigo === estanteria.codigo) === index
    );

  if (estanteriasActuales.length === 0) {
    setSelectOptions(estanteriaSelect, "No hay estanterías activas en esta sección", []);
    setError("No hay estanterías activas en esta sección del plano.");
    updateCurrentSelectionMeta();
    updateSubmitAvailability();
    return;
  }

  setSelectOptions(
    estanteriaSelect,
    "Selecciona una estantería activa del plano",
    estanteriasActuales.map((estanteria) => ({
      value: estanteria.codigo,
      label: `${estanteria.codigo} · ${estanteria.nombre}`
    }))
  );
  estanteriaSelect.disabled = false;
  updateCurrentSelectionMeta();
  updateSubmitAvailability();
}

async function cargarCapturasDeEstanteria(estanteriaCodigo: string): Promise<void> {
  if (!estanteriaCodigo) {
    resetCapturas();
    return;
  }

  resetCapturas("Cargando capturas disponibles...");
  updateSubmitAvailability();

  try {
    capturasActuales = await fetchJson<CapturaResponse[]>(
      `/api/capturas?estanteriaCodigo=${encodeURIComponent(estanteriaCodigo)}`
    );
    renderCapturasDatalist(capturasActuales);

    if (capturasActuales.length === 0) {
      setCapturasHelp("No hay capturas disponibles para esta estantería.");
      return;
    }

    setCapturasHelp(`${capturasActuales.length} captura${capturasActuales.length === 1 ? "" : "s"} disponible${capturasActuales.length === 1 ? "" : "s"}.`);
  } catch (err) {
    resetCapturas("No se pudieron cargar las capturas disponibles.");
    setError(err instanceof Error ? err.message : "No se pudieron cargar las capturas disponibles.");
  }
}

async function cargarPlanoOperativo(codigo: string): Promise<void> {
  if (!codigo) {
    planoActual = null;
    disableInspectionSelection("Selecciona primero un plano");
    return;
  }

  setSelectOptions(seccionSelect, "Cargando secciones del plano...", []);
  if (seccionSelect) seccionSelect.disabled = true;
  setSelectOptions(estanteriaSelect, "Selecciona primero una sección", []);
  if (estanteriaSelect) estanteriaSelect.disabled = true;
  resetCapturas();
  updateCurrentSelectionMeta();
  updateSubmitAvailability();

  try {
    planoActual = await fetchJson<PlanoOperativoResponse>(`/api/planos/${encodeURIComponent(codigo)}/operativo`);
    renderSeccionesDePlano(planoActual);
    if (planoHelp) planoHelp.textContent = `${planoActual.codigo} · ${planoActual.nombre}`;
  } catch (err) {
    planoActual = null;
    disableInspectionSelection("No se pudo cargar el plano");
    setError(err instanceof Error ? err.message : "No se pudo cargar el plano operativo.");
  } finally {
    updateCurrentSelectionMeta();
    updateSubmitAvailability();
  }
}

async function cargarPlanosActivos(): Promise<void> {
  if (!planoSelect) return;

  setSelectOptions(planoSelect, "Cargando planos activos...", []);
  planoSelect.disabled = true;
  disableInspectionSelection("Selecciona primero un plano");
  updateSubmitAvailability();

  try {
    planosActivos = await fetchJson<PlanoResumenResponse[]>(
      `/api/empresas/${encodeURIComponent(EMPRESA_CODIGO)}/planos?estado=ACTIVOS`
    );

    if (planosActivos.length === 0) {
      setSelectOptions(planoSelect, "No hay planos activos disponibles", []);
      if (planoHelp) planoHelp.textContent = "No hay planos activos disponibles para inspección.";
      setError("No hay planos activos disponibles para inspección.");
      updateSubmitAvailability();
      return;
    }

    setSelectOptions(
      planoSelect,
      "Selecciona un plano activo",
      planosActivos.map((plano) => ({
        value: plano.codigo,
        label: `${plano.codigo} · ${plano.nombre}`
      }))
    );
    planoSelect.disabled = false;

    const inicial = planosActivos.find((plano) => plano.codigo === PLANO_DEMO_CODIGO)?.codigo
      ?? planosActivos[0].codigo;
    planoSelect.value = inicial;
    await cargarPlanoOperativo(inicial);
  } catch (err) {
    setSelectOptions(planoSelect, "No se pudieron cargar planos activos", []);
    if (planoHelp) planoHelp.textContent = "Error cargando planos activos.";
    setError(err instanceof Error ? err.message : "No se pudieron cargar los planos activos.");
    updateSubmitAvailability();
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
  updateSubmitAvailability();
}

planoSelect?.addEventListener("change", () => {
  setError(null);
  setSuccess(null);
  void cargarPlanoOperativo(planoSelect.value);
});

seccionSelect?.addEventListener("change", () => {
  setError(null);
  setSuccess(null);
  renderEstanteriasDeSeccion(seccionSelect.value);
});

estanteriaSelect?.addEventListener("change", () => {
  setError(null);
  setSuccess(null);
  updateCurrentSelectionMeta();
  void cargarCapturasDeEstanteria(estanteriaSelect.value);
  updateSubmitAvailability();
});

modoSelect?.addEventListener("change", updateImagePathState);

btnReset?.addEventListener("click", () => {
  if (modoSelect) modoSelect.value = "capture-and-predict";
  if (imagePathInput) imagePathInput.value = "";
  if (notasInput) notasInput.value = "";
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
      updateSubmitAvailability();
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  resetView();
  void cargarPlanosActivos();
});
