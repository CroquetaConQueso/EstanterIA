import { authFetch } from "../lib/api";
import { requireAuth } from "../lib/auth-guard";

requireAuth();

type Prioridad = "BAJA" | "MEDIA" | "ALTA" | "CRITICA" | string;
type EstadoTarea = "PENDIENTE" | "EN_PROGRESO" | "RESUELTA" | "CANCELADA" | string;

type AlertaResponse = {
  id: number;
  tipo: string;
  prioridad: Prioridad;
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

type TrabajadorResumenResponse = {
  id: number;
  nombre?: string | null;
  apellidos?: string | null;
  tipoTrabajador?: string | null;
};

type TareaOperativaResponse = {
  id: number;
  alertaId: number;
  tipoTarea: string;
  prioridad: Prioridad;
  estadoTarea: EstadoTarea;
  titulo: string;
  descripcion: string;
  seccion?: {
    codigo?: string | null;
    nombre?: string | null;
  } | null;
  estanteria?: {
    codigo?: string | null;
    nombre?: string | null;
  } | null;
  trabajadorAsignado?: TrabajadorResumenResponse | null;
  createdAt?: string | null;
  assignedAt?: string | null;
  resueltaAt?: string | null;
  updatedAt?: string | null;
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
  descripcion?: string | null;
  activa?: boolean | null;
};

type ApiErrorResponse = {
  message?: string;
  error?: string;
  status?: number;
};

type EstanteriaOperativa = {
  codigo: string;
  nombre: string;
  seccion: string;
};

type EstadoSemaforo = "rojo" | "ambar" | "verde" | "neutro";

type EstadoEstanteria = {
  estanteria: EstanteriaOperativa;
  estado: EstadoSemaforo;
  etiqueta: string;
  alertas: AlertaResponse[];
  tareasActivas: TareaOperativaResponse[];
  ultimaInspeccion: InspeccionItemResponse | null;
};

type ActividadItem = {
  tipo: "Alerta" | "Inspección" | "Tarea";
  fecha: string;
  estanteria: string;
  resumen: string;
  contexto: string;
  estado: string;
  destacado: boolean;
};

const CODIGO_EMPRESA_DEMO = "EMP-DEMO";

const metricAlertasAbiertas = document.querySelector<HTMLElement>("#metric-alertas-abiertas");
const metricTareasPendientes = document.querySelector<HTMLElement>("#metric-tareas-pendientes");
const metricTareasProgreso = document.querySelector<HTMLElement>("#metric-tareas-progreso");
const metricCaducidades = document.querySelector<HTMLElement>("#metric-caducidades");
const metricEstanteriasAccion = document.querySelector<HTMLElement>("#metric-estanterias-accion");
const tbodyResumen = document.querySelector<HTMLTableSectionElement>("#tbody-resumen");
const estadoEstanterias = document.querySelector<HTMLElement>("#estado-estanterias");

const tipoLabels: Record<string, string> = {
  HUECO_VACIO: "Hueco vacío",
  ANOMALIA_VISUAL: "Anomalía visual",
  REVISION_MANUAL: "Revisión manual",
  PRODUCTO_PROXIMO_A_CADUCAR: "Producto próximo a caducar",
  PRESENCIA_TRAS_RETIRADA_PROGRAMADA: "Presencia tras retirada programada",
  REPOSICION: "Reposición",
  REVISION_VISUAL: "Revisión visual",
  VERIFICACION_MANUAL: "Verificación manual",
  REVISION_CADUCIDAD: "Revisión de caducidad",
  RETIRADA_PRODUCTO: "Retirada de producto"
};

const estadoVisualLabels: Record<string, string> = {
  OK: "OK",
  HUECOS_VACIOS: "Huecos vacíos",
  ANOMALIAS: "Anomalías",
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
  if (status === 401) return "Debes iniciar sesión para ver el dashboard";
  if (status >= 500) return "Error interno del servidor";
  return `Error HTTP ${status}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await authFetch(url, {
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

function esTareaActiva(tarea: TareaOperativaResponse): boolean {
  return tarea.estadoTarea === "PENDIENTE" || tarea.estadoTarea === "EN_PROGRESO";
}

function esPrioridadFuerte(prioridad: Prioridad): boolean {
  return prioridad === "ALTA" || prioridad === "CRITICA";
}

function nombreTrabajador(trabajador: TrabajadorResumenResponse | null | undefined): string {
  if (!trabajador) return "Sin trabajador asignado";
  return [trabajador.nombre, trabajador.apellidos].filter(Boolean).join(" ") || `Trabajador #${trabajador.id}`;
}

function resolverUltimaInspeccion(codigo: string, inspecciones: InspeccionItemResponse[]): InspeccionItemResponse | null {
  return inspecciones
    .filter((inspeccion) => inspeccion.estanteriaCodigo === codigo)
    .sort((a, b) => new Date(b.capturadaEn ?? b.createdAt).getTime() - new Date(a.capturadaEn ?? a.createdAt).getTime())[0] ?? null;
}

async function cargarEstanteriasOperativas(): Promise<{ estanterias: EstanteriaOperativa[]; error: string | null }> {
  try {
    const secciones = await fetchJson<SeccionResponse[]>(`/api/empresas/${encodeURIComponent(CODIGO_EMPRESA_DEMO)}/secciones`);

    const resultados = await Promise.allSettled(
      secciones.map(async (seccion) => {
        const estanterias = await fetchJson<EstanteriaResumenResponse[]>(`/api/secciones/${encodeURIComponent(String(seccion.id))}/estanterias`);
        return estanterias.map((estanteria) => ({
          codigo: estanteria.codigo,
          nombre: estanteria.nombre,
          seccion: seccion.nombre || seccion.codigo
        }));
      })
    );

    const estanterias = resultados.flatMap((resultado) => resultado.status === "fulfilled" ? resultado.value : []);
    const huboErrorParcial = resultados.some((resultado) => resultado.status === "rejected");

    return {
      estanterias,
      error: huboErrorParcial ? "Algunas secciones no pudieron cargar sus estanterías." : null
    };
  } catch {
    return {
      estanterias: [],
      error: "No se pudo cargar el listado operativo de estanterías."
    };
  }
}

function completarEstanteriasDescubiertas(
  estanterias: EstanteriaOperativa[],
  alertas: AlertaResponse[],
  tareas: TareaOperativaResponse[],
  inspecciones: InspeccionItemResponse[]
): EstanteriaOperativa[] {
  const porCodigo = new Map(estanterias.map((estanteria) => [estanteria.codigo, estanteria]));

  function add(codigo: string | null | undefined, nombre: string | null | undefined, seccion: string | null | undefined): void {
    if (!codigo || porCodigo.has(codigo)) return;
    porCodigo.set(codigo, {
      codigo,
      nombre: nombre || codigo,
      seccion: seccion || "No disponible"
    });
  }

  alertas.forEach((alerta) => add(alerta.estanteria?.codigo, alerta.estanteria?.nombre, alerta.seccion?.nombre ?? alerta.seccion?.codigo));
  tareas.forEach((tarea) => add(tarea.estanteria?.codigo, tarea.estanteria?.nombre, tarea.seccion?.nombre ?? tarea.seccion?.codigo));
  inspecciones.forEach((inspeccion) => add(inspeccion.estanteriaCodigo, inspeccion.estanteriaCodigo, null));

  return Array.from(porCodigo.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
}

function construirEstadoEstanteria(
  estanteria: EstanteriaOperativa,
  alertas: AlertaResponse[],
  tareas: TareaOperativaResponse[],
  inspecciones: InspeccionItemResponse[]
): EstadoEstanteria {
  const alertasEstanteria = alertas.filter((alerta) => alerta.estanteria?.codigo === estanteria.codigo);
  const tareasActivas = tareas.filter((tarea) => tarea.estanteria?.codigo === estanteria.codigo && esTareaActiva(tarea));
  const ultimaInspeccion = resolverUltimaInspeccion(estanteria.codigo, inspecciones);

  const tieneRojo = alertasEstanteria.some((alerta) => esPrioridadFuerte(alerta.prioridad))
    || tareasActivas.some((tarea) => esPrioridadFuerte(tarea.prioridad));
  const tieneAmbar = alertasEstanteria.length > 0 || tareasActivas.length > 0;

  if (tieneRojo) {
    return { estanteria, estado: "rojo", etiqueta: "Acción necesaria", alertas: alertasEstanteria, tareasActivas, ultimaInspeccion };
  }

  if (tieneAmbar) {
    return { estanteria, estado: "ambar", etiqueta: "Atención recomendada", alertas: alertasEstanteria, tareasActivas, ultimaInspeccion };
  }

  if (ultimaInspeccion) {
    return { estanteria, estado: "verde", etiqueta: "Estable", alertas: alertasEstanteria, tareasActivas, ultimaInspeccion };
  }

  return { estanteria, estado: "neutro", etiqueta: "Sin inspección reciente", alertas: alertasEstanteria, tareasActivas, ultimaInspeccion };
}

function renderMetrics(alertas: AlertaResponse[], tareas: TareaOperativaResponse[], estados: EstadoEstanteria[]): void {
  setMetric(metricAlertasAbiertas, `${alertas.length} alertas abiertas`);
  setMetric(metricTareasPendientes, `${tareas.filter((tarea) => tarea.estadoTarea === "PENDIENTE").length} pendientes`);
  setMetric(metricTareasProgreso, `${tareas.filter((tarea) => tarea.estadoTarea === "EN_PROGRESO").length} en progreso`);
  setMetric(metricCaducidades, `${alertas.filter((alerta) => alerta.tipo === "PRODUCTO_PROXIMO_A_CADUCAR").length} productos`);
  setMetric(metricEstanteriasAccion, `${estados.filter((estado) => estado.estado === "rojo").length} estanterías`);
}

function renderEstadoEstanterias(estados: EstadoEstanteria[], errorParcial: string | null): void {
  if (!estadoEstanterias) return;

  estadoEstanterias.innerHTML = "";

  if (errorParcial) {
    const aviso = document.createElement("article");
    aviso.className = "shelf-card neutral";
    const title = document.createElement("h3");
    title.textContent = "Datos operativos incompletos";
    const body = document.createElement("p");
    body.textContent = errorParcial;
    aviso.append(title, body);
    estadoEstanterias.appendChild(aviso);
  }

  if (estados.length === 0) {
    const vacio = document.createElement("article");
    vacio.className = "shelf-card neutral";
    const title = document.createElement("h3");
    title.textContent = "Sin estanterías";
    const body = document.createElement("p");
    body.textContent = "No hay estanterías operativas disponibles para EMP-DEMO.";
    vacio.append(title, body);
    estadoEstanterias.appendChild(vacio);
    return;
  }

  estados.forEach((estado) => {
    const card = document.createElement("article");
    card.className = `shelf-card ${estado.estado}`;

    const visual = estado.ultimaInspeccion
      ? etiquetaEstadoVisual(estado.ultimaInspeccion.estadoGeneralVisual)
      : "Sin inspección reciente";
    const fecha = estado.ultimaInspeccion
      ? formatFecha(estado.ultimaInspeccion.capturadaEn ?? estado.ultimaInspeccion.createdAt)
      : "Sin fecha";

    const head = document.createElement("div");
    head.className = "shelf-card-head";

    const code = document.createElement("span");
    code.className = "shelf-code";
    code.textContent = estado.estanteria.codigo;

    const state = document.createElement("span");
    state.className = "shelf-state";
    state.textContent = estado.etiqueta;
    head.append(code, state);

    const title = document.createElement("h3");
    title.textContent = estado.estanteria.nombre;

    const section = document.createElement("p");
    section.textContent = estado.estanteria.seccion;

    const definitionList = document.createElement("dl");
    appendDatoEstanteria(definitionList, "Estado visual", visual);
    appendDatoEstanteria(definitionList, "Alertas abiertas", String(estado.alertas.length));
    appendDatoEstanteria(definitionList, "Tareas activas", String(estado.tareasActivas.length));
    appendDatoEstanteria(definitionList, "Última inspección", fecha);

    const actions = document.createElement("div");
    actions.className = "shelf-actions";

    const planosLink = document.createElement("a");
    planosLink.className = "btn ghost";
    planosLink.href = "planos.html";
    planosLink.textContent = "Ver plano";

    const inspeccionesLink = document.createElement("a");
    inspeccionesLink.className = "btn ghost";
    inspeccionesLink.href = "inspecciones.html";
    inspeccionesLink.textContent = "Ver inspecciones";
    actions.append(planosLink, inspeccionesLink);

    card.append(head, title, section, definitionList, actions);

    estadoEstanterias.appendChild(card);
  });
}

function appendDatoEstanteria(list: HTMLDListElement, label: string, value: string): void {
  const wrapper = document.createElement("div");
  const term = document.createElement("dt");
  term.textContent = label;
  const description = document.createElement("dd");
  description.textContent = value;
  wrapper.append(term, description);
  list.appendChild(wrapper);
}

function toActividadDesdeAlerta(alerta: AlertaResponse): ActividadItem {
  return {
    tipo: "Alerta",
    fecha: alerta.createdAt,
    estanteria: textoSeguro(alerta.estanteria?.codigo),
    resumen: etiquetaTipo(alerta.tipo),
    contexto: alerta.mensaje || textoSeguro(alerta.slot?.slotId, "Sin detalle"),
    estado: alerta.prioridad,
    destacado: esPrioridadFuerte(alerta.prioridad)
  };
}

function toActividadDesdeInspeccion(inspeccion: InspeccionItemResponse): ActividadItem {
  const vacios = inspeccion.vacios ?? 0;
  const anomalias = inspeccion.anomalias ?? 0;
  return {
    tipo: "Inspección",
    fecha: inspeccion.capturadaEn ?? inspeccion.createdAt,
    estanteria: inspeccion.estanteriaCodigo,
    resumen: etiquetaEstadoVisual(inspeccion.estadoGeneralVisual),
    contexto: `Ocupados: ${inspeccion.ocupados ?? 0} / Vacíos: ${vacios} / Anomalías: ${anomalias}`,
    estado: inspeccion.estado,
    destacado: vacios > 0 || anomalias > 0
  };
}

function toActividadDesdeTarea(tarea: TareaOperativaResponse): ActividadItem {
  return {
    tipo: "Tarea",
    fecha: tarea.updatedAt ?? tarea.createdAt ?? "",
    estanteria: textoSeguro(tarea.estanteria?.codigo),
    resumen: tarea.titulo || etiquetaTipo(tarea.tipoTarea),
    contexto: `${nombreTrabajador(tarea.trabajadorAsignado)} / ${etiquetaTipo(tarea.tipoTarea)}`,
    estado: tarea.estadoTarea,
    destacado: esTareaActiva(tarea) && esPrioridadFuerte(tarea.prioridad)
  };
}

function renderActividad(alertas: AlertaResponse[], inspecciones: InspeccionItemResponse[], tareas: TareaOperativaResponse[]): void {
  if (!tbodyResumen) return;

  tbodyResumen.innerHTML = "";

  const actividad = [
    ...alertas.map(toActividadDesdeAlerta),
    ...inspecciones.map(toActividadDesdeInspeccion),
    ...tareas.map(toActividadDesdeTarea)
  ]
    .filter((item) => Boolean(item.fecha))
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 10);

  if (actividad.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.textContent = "No hay alertas, inspecciones ni tareas recientes para mostrar";
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

function renderError(message: string): void {
  setMetric(metricAlertasAbiertas, "Sin conexión");
  setMetric(metricTareasPendientes, "Sin datos");
  setMetric(metricTareasProgreso, "Sin datos");
  setMetric(metricCaducidades, "Sin datos");
  setMetric(metricEstanteriasAccion, "Sin datos");

  if (estadoEstanterias) {
    estadoEstanterias.innerHTML = "";
    const card = document.createElement("article");
    card.className = "shelf-card neutral";
    const title = document.createElement("h3");
    title.textContent = "Sin datos operativos";
    const body = document.createElement("p");
    body.textContent = message;
    card.append(title, body);
    estadoEstanterias.appendChild(card);
  }

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
    const [alertas, tareas, inspecciones, estanteriasResult] = await Promise.all([
      fetchJson<AlertaResponse[]>("/api/alertas/abiertas"),
      fetchJson<TareaOperativaResponse[]>("/api/tareas"),
      fetchJson<InspeccionItemResponse[]>("/api/inspecciones"),
      cargarEstanteriasOperativas()
    ]);

    const estanterias = completarEstanteriasDescubiertas(
      estanteriasResult.estanterias,
      alertas,
      tareas,
      inspecciones
    );
    const estados = estanterias.map((estanteria) => construirEstadoEstanteria(estanteria, alertas, tareas, inspecciones));

    renderMetrics(alertas, tareas, estados);
    renderEstadoEstanterias(estados, estanteriasResult.error);
    renderActividad(alertas, inspecciones, tareas);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo cargar el dashboard operativo";
    renderError(`No se pudo conectar con el backend: ${message}`);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initSlider();
  void cargarDashboard();
});
