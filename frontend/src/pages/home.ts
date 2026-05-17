import { authFetch } from "../lib/api";
import { requireAdminPanelAccess } from "../lib/auth-guard";

requireAdminPanelAccess();

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

type Orientacion = "HORIZONTAL" | "VERTICAL" | string;
type EstadoVisualSlot = "OCUPADO" | "VACIO" | "ANOMALIA" | "SIN_DATOS" | string;

type ProductoResumenResponse = {
  id: number;
  productoUuid: string | null;
  codigoInterno: string | null;
  nombre: string | null;
  descripcion: string | null;
};

type PlanoResponsableResponse = {
  trabajadorId: number;
  nombre: string | null;
  apellidos: string | null;
  tipoTrabajador: string | null;
  responsablePrincipal: boolean | null;
};

type PlanoZonaOperativaResponse = {
  id: number;
  seccion: SeccionResponse;
  x: number;
  y: number;
  width: number;
  height: number;
  responsables: PlanoResponsableResponse[];
};

type PlanoUltimaInspeccionResponse = {
  id: number;
  createdAt: string | null;
  capturadaEn: string | null;
  estadoGeneralVisual: string | null;
  ocupados: number | null;
  vacios: number | null;
  anomalias: number | null;
};

type PlanoAlertaResumenResponse = {
  id: number;
  tipo: string;
  prioridad: string;
  mensaje: string;
  slotId: string | null;
};

type PlanoTareaResumenResponse = {
  id: number;
  tipoTarea: string;
  estadoTarea: string;
  prioridad: string;
  titulo: string;
  slotId: string | null;
};

type PlanoSlotOperativoResponse = {
  slotId: string;
  orden: number;
  productoEsperado: ProductoResumenResponse | null;
  estadoVisual: EstadoVisualSlot;
  confianza: number | null;
  tieneAlertaAbierta: boolean;
  tiposAlertas: string[];
};

type PlanoEstanteriaOperativaResponse = {
  layoutId: number;
  zonaId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  orientacion: Orientacion;
  estanteria: EstanteriaResumenResponse;
  ultimaInspeccion: PlanoUltimaInspeccionResponse | null;
  slots: PlanoSlotOperativoResponse[];
  alertasAbiertas: PlanoAlertaResumenResponse[];
  tareasActivas: PlanoTareaResumenResponse[];
};

type PlanoOperativoResponse = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  ancho: number;
  alto: number;
  zonas: PlanoZonaOperativaResponse[];
  estanterias: PlanoEstanteriaOperativaResponse[];
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
const CODIGO_PLANO_DEMO = "PLANO-DEMO";

const metricAlertasAbiertas = document.querySelector<HTMLElement>("#metric-alertas-abiertas");
const metricTareasPendientes = document.querySelector<HTMLElement>("#metric-tareas-pendientes");
const metricTareasProgreso = document.querySelector<HTMLElement>("#metric-tareas-progreso");
const metricCaducidades = document.querySelector<HTMLElement>("#metric-caducidades");
const metricEstanteriasAccion = document.querySelector<HTMLElement>("#metric-estanterias-accion");
const tbodyResumen = document.querySelector<HTMLTableSectionElement>("#tbody-resumen");
const estadoEstanterias = document.querySelector<HTMLElement>("#estado-estanterias");
const homePlanoNombre = document.querySelector<HTMLElement>("#home-plano-nombre");
const homePlanoCodigo = document.querySelector<HTMLElement>("#home-plano-codigo");
const homePlanoPreview = document.querySelector<HTMLElement>("#home-plano-preview");
const homePlanoStage = document.querySelector<HTMLElement>("#home-plano-stage");
const homePlanoPrev = document.querySelector<HTMLButtonElement>("#home-plano-prev");
const homePlanoNext = document.querySelector<HTMLButtonElement>("#home-plano-next");
const homePlanoNav = document.querySelector<HTMLElement>("#home-plano-nav");
const homePlanoZonas = document.querySelector<HTMLElement>("#home-plano-zonas");
const homePlanoEstanterias = document.querySelector<HTMLElement>("#home-plano-estanterias");
const homePlanoAlertas = document.querySelector<HTMLElement>("#home-plano-alertas");
const homePlanoTareas = document.querySelector<HTMLElement>("#home-plano-tareas");
const homePlanoStatus = document.querySelector<HTMLElement>("#home-plano-status");
const quickPlanosLink = document.querySelector<HTMLButtonElement>("#quick-planos-link");

let planosDisponibles: PlanoResumenResponse[] = [];
let planoSeleccionadoIndex = 0;
let planoOperativoActual: PlanoOperativoResponse | null = null;

const tipoLabels: Record<string, string> = {
  HUECO_VACIO: "Hueco vacío",
  ANOMALIA_VISUAL: "Anomalía visual",
  REVISION_MANUAL: "Revisión manual",
  PRODUCTO_PROXIMO_A_CADUCAR: "Producto próximo a caducar",
  RETIRADA_PROGRAMADA_PENDIENTE: "Retirada programada pendiente",
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

function setTexto(element: HTMLElement | null, value: string): void {
  if (element) element.textContent = value;
}

function claseEstado(estado: string | null | undefined): string {
  const base = estado ?? "SIN_DATOS";
  return `state-${base.toLowerCase().replaceAll("_", "-")}`;
}

function crearPlanoUrl(codigo: string): string {
  return `/html/planos.html?codigo=${encodeURIComponent(codigo)}`;
}

function actualizarEnlacesPlano(codigo: string): void {
  const url = crearPlanoUrl(codigo);
  if (quickPlanosLink) {
    quickPlanosLink.onclick = () => {
      window.location.href = url;
    };
  }
}

function seleccionarIndiceInicial(planos: PlanoResumenResponse[]): number {
  const demoIndex = planos.findIndex((plano) => plano.codigo === CODIGO_PLANO_DEMO);
  if (demoIndex >= 0) return demoIndex;

  const activoIndex = planos.findIndex((plano) => plano.activo !== false);
  return activoIndex >= 0 ? activoIndex : 0;
}

function setPlanPreviewMessage(message: string): void {
  if (!homePlanoStage) return;
  homePlanoStage.innerHTML = "";

  const empty = document.createElement("span");
  empty.textContent = message;
  homePlanoStage.appendChild(empty);
}

function renderSinPlanos(): void {
  planoOperativoActual = null;
  setTexto(homePlanoNombre, "Sin planos configurados");
  setTexto(homePlanoCodigo, "EMP-DEMO no tiene planos disponibles");
  setTexto(homePlanoStatus, "No hay planos configurados.");
  setTexto(homePlanoZonas, "-");
  setTexto(homePlanoEstanterias, "-");
  setTexto(homePlanoAlertas, "-");
  setTexto(homePlanoTareas, "-");
  setPlanPreviewMessage("No hay planos configurados.");

  if (quickPlanosLink) {
    quickPlanosLink.onclick = () => {
      window.location.href = "/html/editor.html";
    };
  }
  if (homePlanoNav) homePlanoNav.hidden = true;
}

function renderErrorPlano(message: string): void {
  planoOperativoActual = null;
  setTexto(homePlanoNombre, "Plano operativo no disponible");
  setTexto(homePlanoCodigo, "No se pudo cargar la miniatura");
  setTexto(homePlanoStatus, message);
  setTexto(homePlanoZonas, "-");
  setTexto(homePlanoEstanterias, "-");
  setTexto(homePlanoAlertas, "-");
  setTexto(homePlanoTareas, "-");
  setPlanPreviewMessage(message);
}

function crearElementoPlano(className: string, x: number, y: number, width: number, height: number, scale: number): HTMLDivElement {
  const element = document.createElement("div");
  element.className = className;
  element.style.left = `${x * scale}px`;
  element.style.top = `${y * scale}px`;
  element.style.width = `${Math.max(width * scale, 1)}px`;
  element.style.height = `${Math.max(height * scale, 1)}px`;
  return element;
}

function totalAlertasPlano(plano: PlanoOperativoResponse): number {
  return plano.estanterias.reduce((total, estanteria) => total + estanteria.alertasAbiertas.length, 0);
}

function totalTareasPlano(plano: PlanoOperativoResponse): number {
  return plano.estanterias.reduce((total, estanteria) => total + estanteria.tareasActivas.length, 0);
}

function renderPlanoPreview(plano: PlanoOperativoResponse | null): void {
  if (!homePlanoPreview || !homePlanoStage || !plano) return;

  const previewWidth = homePlanoPreview.clientWidth || 520;
  const previewHeight = homePlanoPreview.clientHeight || 360;
  const planoAncho = Math.max(plano.ancho, 1);
  const planoAlto = Math.max(plano.alto, 1);
  const scale = Math.min(previewWidth / planoAncho, previewHeight / planoAlto);
  const scaledWidth = planoAncho * scale;
  const scaledHeight = planoAlto * scale;

  homePlanoStage.innerHTML = "";
  const surface = document.createElement("div");
  surface.className = "mini-plan-surface";
  surface.style.width = `${scaledWidth}px`;
  surface.style.height = `${scaledHeight}px`;
  surface.style.left = `${(previewWidth - scaledWidth) / 2}px`;
  surface.style.top = `${(previewHeight - scaledHeight) / 2}px`;

  if (plano.zonas.length === 0 && plano.estanterias.length === 0) {
    const empty = document.createElement("span");
    empty.textContent = "Plano sin zonas ni estanterías.";
    surface.appendChild(empty);
    homePlanoStage.appendChild(surface);
    return;
  }

  plano.zonas.forEach((zona) => {
    const zonaNode = crearElementoPlano("mini-zone", zona.x, zona.y, zona.width, zona.height, scale);
    const label = document.createElement("span");
    label.className = "mini-zone-label";
    label.textContent = zona.seccion.nombre || zona.seccion.codigo;
    zonaNode.appendChild(label);
    surface.appendChild(zonaNode);
  });

  plano.estanterias.forEach((estanteria) => {
    const rackWidth = estanteria.width * scale;
    const rackHeight = estanteria.height * scale;
    const tieneAlertas = estanteria.alertasAbiertas.length > 0;
    const rack = crearElementoPlano(
      `mini-rack ${claseEstado(estanteria.ultimaInspeccion?.estadoGeneralVisual)}${tieneAlertas ? " has-alert" : ""}`,
      estanteria.x,
      estanteria.y,
      estanteria.width,
      estanteria.height,
      scale
    );

    const title = document.createElement("strong");
    title.textContent = estanteria.estanteria.codigo;
    rack.appendChild(title);

    const puedeMostrarSlots = estanteria.slots.length > 0 && rackWidth >= 58 && rackHeight >= 34;
    if (puedeMostrarSlots) {
      const slots = document.createElement("span");
      slots.className = `mini-rack-slots ${estanteria.orientacion.toLowerCase()}`;
      estanteria.slots.forEach((slot) => {
        const slotNode = document.createElement("span");
        slotNode.className = `mini-slot ${claseEstado(slot.estadoVisual)}${slot.tieneAlertaAbierta ? " has-slot-alert" : ""}`;
        slotNode.title = `${slot.slotId}: ${etiquetaEstadoVisual(slot.estadoVisual)}`;
        slots.appendChild(slotNode);
      });
      rack.appendChild(slots);
    }

    surface.appendChild(rack);
  });

  homePlanoStage.appendChild(surface);
}

function renderPlanoOperativo(plano: PlanoOperativoResponse): void {
  planoOperativoActual = plano;
  setTexto(homePlanoNombre, plano.nombre);
  setTexto(homePlanoCodigo, `${plano.codigo} - ${plano.ancho}x${plano.alto}`);
  setTexto(homePlanoZonas, String(plano.zonas.length));
  setTexto(homePlanoEstanterias, String(plano.estanterias.length));
  setTexto(homePlanoAlertas, String(totalAlertasPlano(plano)));
  setTexto(homePlanoTareas, String(totalTareasPlano(plano)));
  setTexto(homePlanoStatus, "Miniatura operativa solo lectura. Usa los controles para cambiar de plano.");
  actualizarEnlacesPlano(plano.codigo);
  renderPlanoPreview(plano);
}

function actualizarNavegacionPlanos(): void {
  const hayVarios = planosDisponibles.length > 1;
  if (homePlanoNav) homePlanoNav.hidden = !hayVarios;
  if (homePlanoPrev) homePlanoPrev.disabled = !hayVarios;
  if (homePlanoNext) homePlanoNext.disabled = !hayVarios;
}

async function cargarPlanoHome(codigo: string): Promise<void> {
  setTexto(homePlanoStatus, "Cargando plano operativo...");
  setPlanPreviewMessage("Cargando plano operativo...");

  try {
    const plano = await fetchJson<PlanoOperativoResponse>(`/api/planos/${encodeURIComponent(codigo)}/operativo`);
    renderPlanoOperativo(plano);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo cargar el plano operativo.";
    renderErrorPlano(message);
  }
}

async function seleccionarPlanoHome(index: number): Promise<void> {
  if (planosDisponibles.length === 0) {
    renderSinPlanos();
    return;
  }

  planoSeleccionadoIndex = (index + planosDisponibles.length) % planosDisponibles.length;
  actualizarNavegacionPlanos();
  await cargarPlanoHome(planosDisponibles[planoSeleccionadoIndex].codigo);
}

async function cargarPlanosHome(): Promise<void> {
  try {
    planosDisponibles = await fetchJson<PlanoResumenResponse[]>(`/api/empresas/${encodeURIComponent(CODIGO_EMPRESA_DEMO)}/planos`);

    if (planosDisponibles.length === 0) {
      renderSinPlanos();
      return;
    }

    await seleccionarPlanoHome(seleccionarIndiceInicial(planosDisponibles));
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudieron cargar los planos disponibles.";
    renderErrorPlano(message);
  }
}

function esTareaActiva(tarea: TareaOperativaResponse): boolean {
  return tarea.estadoTarea === "PENDIENTE" || tarea.estadoTarea === "EN_PROGRESO";
}

function esPrioridadFuerte(prioridad: Prioridad): boolean {
  return prioridad === "ALTA" || prioridad === "CRITICA";
}

function clasePrioridad(prioridad: string): string {
  if (prioridad === "CRITICA") return "critica";
  if (prioridad === "ALTA") return "alta";
  if (prioridad === "MEDIA") return "media";
  if (prioridad === "BAJA") return "baja";
  return "neutra";
}

function claseBadgeActividad(item: ActividadItem): string {
  if (item.tipo === "Alerta") return `badge-priority ${clasePrioridad(item.estado)}`;
  return item.destacado ? "badge-gap" : "badge-ok";
}

function claseTipoActividad(tipo: ActividadItem["tipo"]): string {
  if (tipo === "Alerta") return "alerta";
  if (tipo === "Inspección") return "inspeccion";
  return "tarea";
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
    planosLink.className = "btn shelf-action primary";
    planosLink.href = "planos.html";
    planosLink.textContent = "Ver plano";

    const inspeccionesLink = document.createElement("a");
    inspeccionesLink.className = "btn shelf-action gold";
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
    const resumenLabel = document.createElement("span");
    resumenLabel.className = `action-label ${claseTipoActividad(item.tipo)}`;
    resumenLabel.textContent = item.resumen;
    tdResumen.appendChild(resumenLabel);

    const tdContexto = document.createElement("td");
    tdContexto.textContent = item.contexto;

    const tdEstado = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = claseBadgeActividad(item);
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
    renderError(`No se pudo conectar con el servidor: ${message}`);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  homePlanoPrev?.addEventListener("click", () => {
    void seleccionarPlanoHome(planoSeleccionadoIndex - 1);
  });
  homePlanoNext?.addEventListener("click", () => {
    void seleccionarPlanoHome(planoSeleccionadoIndex + 1);
  });
  window.addEventListener("resize", () => renderPlanoPreview(planoOperativoActual));
  void cargarPlanosHome();
  void cargarDashboard();
});
