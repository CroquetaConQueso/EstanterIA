type PrioridadAlerta = "BAJA" | "MEDIA" | "ALTA" | "CRITICA" | string;
type TipoAlerta =
  | "HUECO_VACIO"
  | "ANOMALIA_VISUAL"
  | "REVISION_MANUAL"
  | "PRODUCTO_PROXIMO_A_CADUCAR"
  | "PRESENCIA_TRAS_RETIRADA_PROGRAMADA"
  | string;

type AlertaResponse = {
  id: number;
  tipo: TipoAlerta;
  prioridad: PrioridadAlerta;
  estado: string;
  mensaje: string;
  createdAt: string;
  estanteria?: {
    codigo?: string | null;
    nombre?: string | null;
  } | null;
  seccion?: {
    codigo?: string | null;
    nombre?: string | null;
  } | null;
  slot?: {
    slotId?: string | null;
  } | null;
};

type InspeccionItemResponse = {
  id: number;
  estanteriaCodigo: string;
  notas: string | null;
  imagenPath: string | null;
  estado: string;
  createdAt: string;
  estadoGeneralVisual: string | null;
  ocupados: number | null;
  vacios: number | null;
  anomalias: number | null;
  modeloVersion: string | null;
  capturadaEn: string | null;
};

type ApiErrorResponse = {
  message?: string;
  error?: string;
  status?: number;
};

type ActividadItem = {
  tipo: "Alerta" | "Inspecci\u00f3n";
  fecha: string;
  estanteria: string;
  resumen: string;
  contexto: string;
  estado: string;
  destacado: boolean;
};

const metricAlertasAbiertas = document.querySelector<HTMLElement>("#metric-alertas-abiertas");
const metricAlertasCriticas = document.querySelector<HTMLElement>("#metric-alertas-criticas");
const metricRevisionesManuales = document.querySelector<HTMLElement>("#metric-revisiones-manuales");
const metricCaducidades = document.querySelector<HTMLElement>("#metric-caducidades");
const metricEstanterias = document.querySelector<HTMLElement>("#metric-estanterias-incidencias");
const tbodyResumen = document.querySelector<HTMLTableSectionElement>("#tbody-resumen");

const tipoLabels: Record<string, string> = {
  HUECO_VACIO: "Hueco vac\u00edo",
  ANOMALIA_VISUAL: "Anomal\u00eda visual",
  REVISION_MANUAL: "Revisi\u00f3n manual",
  PRODUCTO_PROXIMO_A_CADUCAR: "Producto pr\u00f3ximo a caducar",
  PRESENCIA_TRAS_RETIRADA_PROGRAMADA: "Presencia tras retirada programada"
};

const estadoVisualLabels: Record<string, string> = {
  OK: "OK",
  HUECOS_VACIOS: "Huecos vac\u00edos",
  ANOMALIAS: "Anomal\u00edas",
  MIXTO: "Mixto"
};

function textoSeguro(value: string | number | null | undefined, fallback = "No disponible"): string {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function etiquetaTipo(tipo: string): string {
  return tipoLabels[tipo] ?? tipo.replaceAll("_", " ").toLowerCase();
}

function etiquetaEstadoVisual(estado: string | null | undefined): string {
  if (!estado) return "Sin resumen visual";
  return estadoVisualLabels[estado] ?? estado.replaceAll("_", " ").toLowerCase();
}

function formatFecha(value: string | null | undefined): string {
  if (!value) return "Sin fecha";

  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return value;

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(fecha);
}

async function parseErrorResponse(response: Response): Promise<ApiErrorResponse | null> {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) as ApiErrorResponse : null;
  } catch {
    return null;
  }
}

function getBackendErrorMessage(data: ApiErrorResponse | null, status: number): string {
  if (data?.message) return data.message;
  if (status >= 500) return "Error interno del servidor";
  return `Error HTTP ${status}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    const errorData = await parseErrorResponse(response);
    throw new Error(getBackendErrorMessage(errorData, response.status));
  }

  return response.json() as Promise<T>;
}

function setMetric(element: HTMLElement | null, value: string): void {
  if (element) element.textContent = value;
}

function initSlider(): void {
  const track = document.getElementById("slider-track");
  const btnPrev = document.getElementById("slider-prev");
  const btnNext = document.getElementById("slider-next");
  const dotsContainer = document.getElementById("slider-dots");

  if (!track || !btnPrev || !btnNext || !dotsContainer) return;

  const sliderTrack = track;
  const slides = Array.from(track.children);
  const total = slides.length;
  let current = 0;

  dotsContainer.innerHTML = "";
  slides.forEach((_, idx) => {
    const dot = document.createElement("button");
    dot.className = `slider-dot${idx === 0 ? " is-active" : ""}`;
    dot.type = "button";
    dot.addEventListener("click", () => goTo(idx));
    dotsContainer.appendChild(dot);
  });

  const dots = Array.from(dotsContainer.children);

  function update(): void {
    sliderTrack.style.transform = `translateX(${-current * 100}%)`;
    dots.forEach((dot, index) => dot.classList.toggle("is-active", index === current));
  }

  function goTo(index: number): void {
    current = (index + total) % total;
    update();
  }

  btnPrev.addEventListener("click", () => goTo(current - 1));
  btnNext.addEventListener("click", () => goTo(current + 1));
}

function renderMetrics(alertas: AlertaResponse[]): void {
  const estanteriasConIncidencias = new Set(
    alertas
      .map((alerta) => alerta.estanteria?.codigo)
      .filter((codigo): codigo is string => Boolean(codigo))
  );

  setMetric(metricAlertasAbiertas, `${alertas.length} alertas abiertas`);
  setMetric(metricAlertasCriticas, `${alertas.filter((alerta) => alerta.prioridad === "CRITICA").length} cr\u00edticas`);
  setMetric(metricRevisionesManuales, `${alertas.filter((alerta) => alerta.tipo === "REVISION_MANUAL").length} pendientes`);
  setMetric(metricCaducidades, `${alertas.filter((alerta) => alerta.tipo === "PRODUCTO_PROXIMO_A_CADUCAR").length} productos`);
  setMetric(metricEstanterias, `${estanteriasConIncidencias.size} estanter\u00edas`);
}

function toActividadDesdeAlerta(alerta: AlertaResponse): ActividadItem {
  return {
    tipo: "Alerta",
    fecha: alerta.createdAt,
    estanteria: textoSeguro(alerta.estanteria?.codigo),
    resumen: etiquetaTipo(alerta.tipo),
    contexto: alerta.mensaje || textoSeguro(alerta.slot?.slotId, "Sin detalle"),
    estado: alerta.prioridad,
    destacado: alerta.prioridad === "CRITICA" || alerta.prioridad === "ALTA"
  };
}

function toActividadDesdeInspeccion(inspeccion: InspeccionItemResponse): ActividadItem {
  const vacios = inspeccion.vacios ?? 0;
  const anomalias = inspeccion.anomalias ?? 0;
  return {
    tipo: "Inspecci\u00f3n",
    fecha: inspeccion.capturadaEn ?? inspeccion.createdAt,
    estanteria: inspeccion.estanteriaCodigo,
    resumen: etiquetaEstadoVisual(inspeccion.estadoGeneralVisual),
    contexto: `Ocupados: ${inspeccion.ocupados ?? 0} / Vac\u00edos: ${vacios} / Anomal\u00edas: ${anomalias}`,
    estado: inspeccion.estado,
    destacado: vacios > 0 || anomalias > 0
  };
}

function renderActividad(alertas: AlertaResponse[], inspecciones: InspeccionItemResponse[]): void {
  if (!tbodyResumen) return;

  tbodyResumen.innerHTML = "";

  const actividad = [
    ...alertas.map(toActividadDesdeAlerta),
    ...inspecciones.map(toActividadDesdeInspeccion)
  ]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 8);

  if (actividad.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.textContent = "No hay alertas ni inspecciones recientes para mostrar";
    tr.appendChild(td);
    tbodyResumen.appendChild(tr);
    return;
  }

  actividad.forEach((item) => {
    const tr = document.createElement("tr");

    const tdTipo = document.createElement("td");
    tdTipo.textContent = item.tipo;

    const tdFecha = document.createElement("td");
    tdFecha.textContent = formatFecha(item.fecha);

    const tdEstanteria = document.createElement("td");
    tdEstanteria.textContent = item.estanteria;

    const tdResumen = document.createElement("td");
    tdResumen.textContent = item.resumen;

    const tdContexto = document.createElement("td");
    tdContexto.textContent = item.contexto;

    const tdEstado = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = item.destacado ? "badge-gap" : "badge-ok";
    badge.textContent = item.estado;
    tdEstado.appendChild(badge);

    tr.append(tdTipo, tdFecha, tdEstanteria, tdResumen, tdContexto, tdEstado);
    tbodyResumen.appendChild(tr);
  });
}

function renderEstadoVacio(alertas: AlertaResponse[], inspecciones: InspeccionItemResponse[]): void {
  if (alertas.length === 0) {
    setMetric(metricAlertasAbiertas, "0 alertas abiertas");
    setMetric(metricAlertasCriticas, "0 cr\u00edticas");
    setMetric(metricRevisionesManuales, "0 pendientes");
    setMetric(metricCaducidades, "0 productos");
    setMetric(metricEstanterias, "0 estanter\u00edas");
  }

  renderActividad(alertas, inspecciones);
}

function renderError(message: string): void {
  setMetric(metricAlertasAbiertas, "Sin conexi\u00f3n");
  setMetric(metricAlertasCriticas, "Sin datos");
  setMetric(metricRevisionesManuales, "Sin datos");
  setMetric(metricCaducidades, "Sin datos");
  setMetric(metricEstanterias, "Sin datos");

  if (!tbodyResumen) return;
  tbodyResumen.innerHTML = "";
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = 6;
  td.textContent = message;
  tr.appendChild(td);
  tbodyResumen.appendChild(tr);
}

async function cargarDashboard(): Promise<void> {
  try {
    const [alertas, inspecciones] = await Promise.all([
      fetchJson<AlertaResponse[]>("/api/alertas/abiertas"),
      fetchJson<InspeccionItemResponse[]>("/api/inspecciones")
    ]);

    renderMetrics(alertas);
    renderEstadoVacio(alertas, inspecciones);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo cargar el dashboard operativo";
    renderError(`No se pudo conectar con el backend: ${message}`);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initSlider();
  void cargarDashboard();
});
