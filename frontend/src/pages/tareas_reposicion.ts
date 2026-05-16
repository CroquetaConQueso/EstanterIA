import { authFetch, isStructuralAdmin } from "../lib/api";
import { requireAdminPanelAccess } from "../lib/auth-guard";

requireAdminPanelAccess();

type EstadoTareaOperativa = "PENDIENTE" | "EN_PROGRESO" | "RESUELTA" | "CANCELADA" | string;
type TipoTareaOperativa =
  | "REPOSICION"
  | "REVISION_VISUAL"
  | "VERIFICACION_MANUAL"
  | "REVISION_CADUCIDAD"
  | "RETIRADA_PRODUCTO"
  | string;
type Prioridad = "BAJA" | "MEDIA" | "ALTA" | "CRITICA" | string;

type ProductoResumenResponse = {
  nombre?: string | null;
  codigoInterno?: string | null;
};

type ProveedorResumenResponse = {
  nombre?: string | null;
  codigo?: string | null;
};

type SeccionResponse = {
  id?: number | null;
  codigo?: string | null;
  nombre?: string | null;
};

type EstanteriaResumenResponse = {
  id?: number | null;
  codigo?: string | null;
  nombre?: string | null;
};

type AlertaSlotResponse = {
  slotId?: string | null;
  orden?: number | null;
  productoEsperado?: ProductoResumenResponse | null;
};

type AlertaAsignacionResponse = {
  id?: number | null;
  producto?: ProductoResumenResponse | null;
  proveedor?: ProveedorResumenResponse | null;
  claveProductoProveedor?: string | null;
  stockDisponible?: boolean | null;
  stockMensaje?: string | null;
  fechaCaducidad?: string | null;
  fechaRetiradaProgramada?: string | null;
  estadoAsignacion?: string | null;
};

type TrabajadorResumenResponse = {
  id: number;
  nombre?: string | null;
  apellidos?: string | null;
  emailContacto?: string | null;
  tipoTrabajador?: string | null;
};

type TrabajadorActivoResponse = {
  id: number;
  nombre?: string | null;
  apellidos?: string | null;
  tipoTrabajador?: string | null;
  activo?: boolean | null;
};

type TareaOperativaResponse = {
  id: number;
  alertaId: number | null;
  tipoTarea: TipoTareaOperativa;
  prioridad: Prioridad;
  estadoTarea: EstadoTareaOperativa;
  titulo: string;
  descripcion: string;
  seccion?: SeccionResponse | null;
  estanteria?: EstanteriaResumenResponse | null;
  slot?: AlertaSlotResponse | null;
  asignacion?: AlertaAsignacionResponse | null;
  productoId?: number | null;
  productoCodigo?: string | null;
  productoNombre?: string | null;
  proveedorId?: number | null;
  proveedorNombre?: string | null;
  stockDisponible?: boolean | null;
  stockMensaje?: string | null;
  trabajadorAsignado?: TrabajadorResumenResponse | null;
  asignadaPorUsername?: string | null;
  createdAt?: string | null;
  assignedAt?: string | null;
  fechaLimite?: string | null;
  resueltaAt?: string | null;
  updatedAt?: string | null;
};

type ApiErrorResponse = {
  message?: string;
  error?: string;
  status?: number;
  fieldErrors?: Record<string, string>;
};

const API_TAREAS = "/api/tareas";
const API_TRABAJADORES_ACTIVOS = "/api/trabajadores/activos";
const CODIGO_EMPRESA_DEMO = "EMP-DEMO";
const VALOR_SIN_ASIGNAR = "__SIN_ASIGNAR__";

const tasksGrid = document.querySelector<HTMLElement>("#tasks-grid");
const filtroEstado = document.querySelector<HTMLSelectElement>("#filtro-estado");
const filtroPrioridad = document.querySelector<HTMLSelectElement>("#filtro-prioridad");
const filtroTipo = document.querySelector<HTMLSelectElement>("#filtro-tipo");
const filtroTrabajador = document.querySelector<HTMLSelectElement>("#filtro-trabajador");
const filtroSeccion = document.querySelector<HTMLSelectElement>("#filtro-seccion");
const filtroEstanteria = document.querySelector<HTMLSelectElement>("#filtro-estanteria");
const filtroTexto = document.querySelector<HTMLInputElement>("#filtro-texto");
const trabajadorSelect = document.querySelector<HTMLSelectElement>("#trabajador-select");
const btnLimpiar = document.querySelector<HTMLButtonElement>("#btn-limpiar");
const btnNuevaTarea = document.querySelector<HTMLAnchorElement>("#btn-nueva-tarea");
const tasksFeedback = document.querySelector<HTMLElement>("#tasks-feedback");
const filterSummary = document.querySelector<HTMLElement>("#filter-summary");

const metricPendientes = document.querySelector<HTMLElement>("#metric-pendientes");
const metricCurso = document.querySelector<HTMLElement>("#metric-curso");
const metricCompletadas = document.querySelector<HTMLElement>("#metric-completadas");

let tareas: TareaOperativaResponse[] = [];
let trabajadoresActivos: TrabajadorActivoResponse[] = [];
let seccionesDisponibles: SeccionResponse[] = [];
let estanteriasFiltro: EstanteriaResumenResponse[] = [];
const puedeGestionarTareas = isStructuralAdmin();

if (!puedeGestionarTareas && btnNuevaTarea) {
  btnNuevaTarea.hidden = true;
}

const tipoLabels: Record<string, string> = {
  REPOSICION: "Reposición",
  REVISION_VISUAL: "Revisión visual",
  VERIFICACION_MANUAL: "Verificación manual",
  REVISION_CADUCIDAD: "Revisión de caducidad",
  RETIRADA_PRODUCTO: "Retirada de producto"
};

const estadoLabels: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En progreso",
  RESUELTA: "Resuelta",
  CANCELADA: "Cancelada"
};

function textoSeguro(value: string | number | null | undefined, fallback = "No disponible"): string {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function etiquetaTipo(tipo: TipoTareaOperativa): string {
  return tipoLabels[tipo] ?? tipo.replaceAll("_", " ").toLowerCase();
}

function etiquetaEstado(estado: EstadoTareaOperativa): string {
  return estadoLabels[estado] ?? estado.replaceAll("_", " ").toLowerCase();
}

function claseEstado(estado: EstadoTareaOperativa): string {
  if (estado === "PENDIENTE") return "pendiente";
  if (estado === "EN_PROGRESO") return "en_curso";
  if (estado === "RESUELTA") return "completada";
  if (estado === "CANCELADA") return "falso_positivo";
  return "pendiente";
}

function clasePrioridad(prioridad: Prioridad): string {
  if (prioridad === "CRITICA") return "critica";
  if (prioridad === "ALTA") return "alta";
  if (prioridad === "MEDIA") return "media";
  if (prioridad === "BAJA") return "baja";
  return "media";
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

function nombreTrabajador(trabajador: TrabajadorResumenResponse | null | undefined): string {
  if (!trabajador) return "Sin trabajador asignado";
  const nombre = [trabajador.nombre, trabajador.apellidos].filter(Boolean).join(" ");
  return `${textoSeguro(nombre, "Trabajador sin nombre")} (#${trabajador.id})`;
}

function etiquetaTrabajadorActivo(trabajador: TrabajadorActivoResponse): string {
  const nombre = [trabajador.nombre, trabajador.apellidos].filter(Boolean).join(" ");
  return `${textoSeguro(nombre, "Trabajador sin nombre")} - ${textoSeguro(trabajador.tipoTrabajador, "Sin tipo")}`;
}

function etiquetaSeccion(seccion: SeccionResponse): string {
  const nombre = textoSeguro(seccion.nombre ?? seccion.codigo, "Sección sin nombre");
  const codigo = seccion.codigo ? ` · ${seccion.codigo}` : "";
  return `${nombre}${codigo}`;
}

function etiquetaEstanteria(estanteria: EstanteriaResumenResponse): string {
  const codigo = textoSeguro(estanteria.codigo, "Sin código");
  const nombre = estanteria.nombre ? ` · ${estanteria.nombre}` : "";
  return `${codigo}${nombre}`;
}

function valorSeccion(seccion: SeccionResponse): string {
  return seccion.id != null ? String(seccion.id) : (seccion.codigo ?? textoSeguro(seccion.nombre, ""));
}

function valorEstanteria(estanteria: EstanteriaResumenResponse): string {
  return estanteria.id != null ? String(estanteria.id) : (estanteria.codigo ?? textoSeguro(estanteria.nombre, ""));
}

function crearOption(value: string, label: string): HTMLOptionElement {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function productoTarea(tarea: TareaOperativaResponse): string {
  return textoSeguro(
    tarea.productoNombre ?? tarea.asignacion?.producto?.nombre ?? tarea.slot?.productoEsperado?.nombre,
    "Sin producto asociado"
  );
}

function proveedorTarea(tarea: TareaOperativaResponse): string {
  return textoSeguro(tarea.proveedorNombre ?? tarea.asignacion?.proveedor?.nombre, "Sin proveedor");
}

function stockMensajeTarea(tarea: TareaOperativaResponse): string {
  if (tarea.stockMensaje) return tarea.stockMensaje;
  if (tarea.asignacion?.stockMensaje) return tarea.asignacion.stockMensaje;
  if (tarea.stockDisponible === true || tarea.asignacion?.stockDisponible === true) return "Stock disponible: Sí";
  if (tarea.stockDisponible === false || tarea.asignacion?.stockDisponible === false) {
    return "Stock disponible: No · requiere pedido o reposición externa";
  }
  return "Sin dato de stock";
}

function claseStock(tarea: TareaOperativaResponse): string {
  if (tarea.stockDisponible === true || tarea.asignacion?.stockDisponible === true) return "stock-ok";
  if (tarea.stockDisponible === false || tarea.asignacion?.stockDisponible === false) return "stock-warning";
  return "stock-unknown";
}

function seccionTarea(tarea: TareaOperativaResponse): string {
  return textoSeguro(tarea.seccion?.nombre ?? tarea.seccion?.codigo);
}

function estanteriaTarea(tarea: TareaOperativaResponse): string {
  return textoSeguro(tarea.estanteria?.codigo ?? tarea.estanteria?.nombre);
}

function slotTarea(tarea: TareaOperativaResponse): string {
  if (!tarea.slot) return "Sin slot vinculado";
  const orden = tarea.slot.orden ? `orden ${tarea.slot.orden}` : "sin orden";
  return `${textoSeguro(tarea.slot.slotId, "Sin slot")} / ${orden}`;
}

function blobBusqueda(tarea: TareaOperativaResponse): string {
  return [
    tarea.id,
    tarea.alertaId,
    tarea.tipoTarea,
    etiquetaTipo(tarea.tipoTarea),
    tarea.estadoTarea,
    etiquetaEstado(tarea.estadoTarea),
    tarea.prioridad,
    tarea.titulo,
    tarea.descripcion,
    seccionTarea(tarea),
    estanteriaTarea(tarea),
    slotTarea(tarea),
    productoTarea(tarea),
    proveedorTarea(tarea),
    stockMensajeTarea(tarea),
    tarea.asignacion?.claveProductoProveedor,
    nombreTrabajador(tarea.trabajadorAsignado)
  ].join(" ").toLowerCase();
}

function idsTrabajadorTarea(tarea: TareaOperativaResponse): string[] {
  const id = tarea.trabajadorAsignado?.id;
  return id != null ? [String(id)] : [];
}

function idsSeccionTarea(tarea: TareaOperativaResponse): string[] {
  return [
    tarea.seccion?.id != null ? String(tarea.seccion.id) : "",
    tarea.seccion?.codigo ?? "",
    tarea.seccion?.nombre ?? ""
  ].filter(Boolean);
}

function idsEstanteriaTarea(tarea: TareaOperativaResponse): string[] {
  return [
    tarea.estanteria?.id != null ? String(tarea.estanteria.id) : "",
    tarea.estanteria?.codigo ?? "",
    tarea.estanteria?.nombre ?? ""
  ].filter(Boolean);
}

function tareaCoincideConSeccion(tarea: TareaOperativaResponse, value: string): boolean {
  return !value || idsSeccionTarea(tarea).includes(value);
}

function tareaCoincideConEstanteria(tarea: TareaOperativaResponse, value: string): boolean {
  return !value || idsEstanteriaTarea(tarea).includes(value);
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
  if (data?.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
    return Object.values(data.fieldErrors).join(" ");
  }
  if (data?.message) return data.message;
  if (status === 400) return "Revisa los datos de la tarea";
  if (status === 401) return "Debes iniciar sesión para consultar tareas";
  if (status === 403) return "Solo un administrador puede crear o editar tareas manuales.";
  if (status === 404) return "No se encontró la tarea solicitada";
  if (status === 409) return "El cambio solicitado no está permitido";
  if (status >= 500) return "Error interno del servidor";
  return `Error HTTP ${status}`;
}

async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await authFetch(url, {
    ...init,
    headers: {
      "Accept": "application/json",
      ...init.headers
    }
  });

  if (!response.ok) {
    const errorData = await parseErrorResponse(response);
    throw new Error(getBackendErrorMessage(errorData, response.status));
  }

  return response.json() as Promise<T>;
}

function setGridMessage(message: string): void {
  if (!tasksGrid) return;
  tasksGrid.innerHTML = "";

  const div = document.createElement("div");
  div.style.gridColumn = "1 / -1";
  div.style.padding = "40px";
  div.style.background = "var(--surface)";
  div.style.border = "var(--border-heavy)";
  div.style.textAlign = "center";
  div.style.fontWeight = "800";
  div.style.textTransform = "uppercase";
  div.textContent = message;
  tasksGrid.appendChild(div);
}

function setTaskFeedback(message: string | null): void {
  if (!tasksFeedback) return;
  if (!message) {
    tasksFeedback.textContent = "";
    tasksFeedback.setAttribute("hidden", "");
    return;
  }

  tasksFeedback.textContent = message;
  tasksFeedback.removeAttribute("hidden");
}

function actualizarMetricas(): void {
  if (metricPendientes) {
    metricPendientes.textContent = String(tareas.filter((tarea) => tarea.estadoTarea === "PENDIENTE").length);
  }
  if (metricCurso) {
    metricCurso.textContent = String(tareas.filter((tarea) => tarea.estadoTarea === "EN_PROGRESO").length);
  }
  if (metricCompletadas) {
    metricCompletadas.textContent = String(tareas.filter((tarea) => tarea.estadoTarea === "RESUELTA").length);
  }
}

function actualizarResumenFiltrado(cantidad: number): void {
  if (!filterSummary) return;
  filterSummary.textContent = `Mostrando ${cantidad} de ${tareas.length} tareas`;
}

function setOpciones(select: HTMLSelectElement | null, placeholder: string, opciones: Array<{ value: string; label: string }>): void {
  if (!select) return;
  const selected = select.value;
  select.innerHTML = "";
  select.appendChild(crearOption("", placeholder));
  opciones.forEach((opcion) => {
    select.appendChild(crearOption(opcion.value, opcion.label));
  });
  select.value = opciones.some((opcion) => opcion.value === selected) ? selected : "";
}

function opcionesTipoDesdeTareas(): Array<{ value: string; label: string }> {
  const tipos = Array.from(new Set(tareas.map((tarea) => tarea.tipoTarea).filter(Boolean))).sort();
  return tipos.map((tipo) => ({ value: tipo, label: etiquetaTipo(tipo) }));
}

function opcionesTrabajadorFiltro(): Array<{ value: string; label: string }> {
  const porId = new Map<string, string>();
  trabajadoresActivos.forEach((trabajador) => {
    porId.set(String(trabajador.id), etiquetaTrabajadorActivo(trabajador));
  });
  tareas.forEach((tarea) => {
    const trabajador = tarea.trabajadorAsignado;
    if (!trabajador) return;
    porId.set(String(trabajador.id), nombreTrabajador(trabajador));
  });

  return [
    { value: VALOR_SIN_ASIGNAR, label: "Sin asignar" },
    ...Array.from(porId.entries())
      .sort((a, b) => a[1].localeCompare(b[1], "es"))
      .map(([value, label]) => ({ value, label }))
  ];
}

function opcionesSeccionFallback(): Array<{ value: string; label: string }> {
  const porValor = new Map<string, string>();
  tareas.forEach((tarea) => {
    if (!tarea.seccion) return;
    const value = idsSeccionTarea(tarea)[0];
    if (!value) return;
    porValor.set(value, etiquetaSeccion(tarea.seccion));
  });
  return Array.from(porValor.entries())
    .sort((a, b) => a[1].localeCompare(b[1], "es"))
    .map(([value, label]) => ({ value, label }));
}

function opcionesEstanteriaDesdeTareas(seccionValue = ""): Array<{ value: string; label: string }> {
  const porValor = new Map<string, string>();
  tareas
    .filter((tarea) => tareaCoincideConSeccion(tarea, seccionValue))
    .forEach((tarea) => {
      if (!tarea.estanteria) return;
      const value = idsEstanteriaTarea(tarea)[0];
      if (!value) return;
      porValor.set(value, etiquetaEstanteria(tarea.estanteria));
    });
  return Array.from(porValor.entries())
    .sort((a, b) => a[1].localeCompare(b[1], "es"))
    .map(([value, label]) => ({ value, label }));
}

function renderFiltrosDinamicos(): void {
  setOpciones(filtroTipo, "Todos", opcionesTipoDesdeTareas());
  setOpciones(filtroTrabajador, "Todos", opcionesTrabajadorFiltro());
  setOpciones(
    filtroSeccion,
    "Todas",
    seccionesDisponibles.length > 0
      ? seccionesDisponibles.map((seccion) => ({ value: valorSeccion(seccion), label: etiquetaSeccion(seccion) }))
      : opcionesSeccionFallback()
  );
  renderFiltroEstanteria();
}

function renderFiltroEstanteria(): void {
  const seccionValue = filtroSeccion?.value ?? "";
  const opciones = estanteriasFiltro.length > 0
    ? estanteriasFiltro.map((estanteria) => ({ value: valorEstanteria(estanteria), label: etiquetaEstanteria(estanteria) }))
    : opcionesEstanteriaDesdeTareas(seccionValue);
  setOpciones(filtroEstanteria, "Todas", opciones);
}

function tareasFiltradas(): TareaOperativaResponse[] {
  const estado = filtroEstado?.value ?? "";
  const prioridad = filtroPrioridad?.value ?? "";
  const tipo = filtroTipo?.value ?? "";
  const trabajador = filtroTrabajador?.value ?? "";
  const seccion = filtroSeccion?.value ?? "";
  const estanteria = filtroEstanteria?.value ?? "";
  const texto = filtroTexto?.value.trim().toLowerCase() ?? "";

  return tareas.filter((tarea) => {
    const okEstado = !estado || tarea.estadoTarea === estado;
    const okPrioridad = !prioridad || tarea.prioridad === prioridad;
    const okTipo = !tipo || tarea.tipoTarea === tipo;
    const okTrabajador = !trabajador
      || (trabajador === VALOR_SIN_ASIGNAR ? !tarea.trabajadorAsignado : idsTrabajadorTarea(tarea).includes(trabajador));
    const okSeccion = tareaCoincideConSeccion(tarea, seccion);
    const okEstanteria = tareaCoincideConEstanteria(tarea, estanteria);
    const okTexto = !texto || blobBusqueda(tarea).includes(texto);
    return okEstado && okPrioridad && okTipo && okTrabajador && okSeccion && okEstanteria && okTexto;
  });
}

function addMeta(container: HTMLElement, label: string, value: string, full = false, modifier = ""): void {
  const box = document.createElement("div");
  box.className = `meta-box${full ? " full" : ""}${modifier ? ` ${modifier}` : ""}`;

  const labelEl = document.createElement("span");
  labelEl.className = "meta-label";
  labelEl.textContent = label;

  const valueEl = document.createElement("span");
  valueEl.className = "meta-value";
  valueEl.textContent = value;

  box.append(labelEl, valueEl);
  container.appendChild(box);
}

function crearBoton(texto: string, action: string, id: number, className: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.dataset.action = action;
  button.dataset.id = String(id);
  button.textContent = texto;
  return button;
}

function crearLink(texto: string, href: string, className: string): HTMLAnchorElement {
  const link = document.createElement("a");
  link.className = className;
  link.href = href;
  link.textContent = texto;
  return link;
}

function renderTarea(tarea: TareaOperativaResponse): HTMLElement {
  const article = document.createElement("article");
  article.className = "task-card";

  const head = document.createElement("div");
  head.className = "task-head";

  const titleGroup = document.createElement("div");
  titleGroup.className = "task-title-group";

  const id = document.createElement("span");
  id.className = "task-id";
  id.textContent = tarea.alertaId ? `T-${tarea.id} / A-${tarea.alertaId}` : `T-${tarea.id} / Manual`;

  const title = document.createElement("h2");
  title.className = "task-title";
  title.textContent = tarea.titulo;

  titleGroup.append(id, title);

  const chip = document.createElement("span");
  chip.className = `status-chip ${claseEstado(tarea.estadoTarea)}`;
  chip.textContent = etiquetaEstado(tarea.estadoTarea);

  const priorityChip = document.createElement("span");
  priorityChip.className = `priority-chip ${clasePrioridad(tarea.prioridad)}`;
  priorityChip.textContent = tarea.prioridad;

  const badges = document.createElement("div");
  badges.className = "task-badges";
  badges.append(priorityChip, chip);

  head.append(titleGroup, badges);

  const body = document.createElement("div");
  body.className = "task-body";

  const meta = document.createElement("div");
  meta.className = "task-meta";

  addMeta(meta, "Acción", etiquetaTipo(tarea.tipoTarea), true);
  addMeta(meta, "Estantería", estanteriaTarea(tarea));
  addMeta(meta, "Sección", seccionTarea(tarea));
  addMeta(meta, "Slot", slotTarea(tarea));
  addMeta(meta, "Producto", productoTarea(tarea));
  addMeta(meta, "Stock", stockMensajeTarea(tarea), true, claseStock(tarea));
  addMeta(meta, "Trabajador", nombreTrabajador(tarea.trabajadorAsignado), true);
  addMeta(meta, "Creada", formatFecha(tarea.createdAt));
  addMeta(meta, "Asignada", formatFecha(tarea.assignedAt));
  addMeta(meta, "Resuelta", formatFecha(tarea.resueltaAt));
  addMeta(meta, "Proveedor", proveedorTarea(tarea));
  addMeta(meta, "Descripción", tarea.descripcion || "Sin descripción", true);

  body.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  if (puedeGestionarTareas && tarea.estadoTarea !== "RESUELTA" && tarea.estadoTarea !== "CANCELADA") {
    actions.appendChild(crearLink("Editar", `tarea_formulario.html?id=${encodeURIComponent(String(tarea.id))}`, "btn primary"));
  }

  if (tarea.estadoTarea === "PENDIENTE") {
    actions.appendChild(crearBoton("Asignar", "asignar", tarea.id, "btn ghost"));
    actions.appendChild(crearBoton("Iniciar", "EN_PROGRESO", tarea.id, "btn warn"));
    actions.appendChild(crearBoton("Cancelar", "CANCELADA", tarea.id, "btn ghost"));
  } else if (tarea.estadoTarea === "EN_PROGRESO") {
    actions.appendChild(crearBoton("Asignar", "asignar", tarea.id, "btn ghost"));
    actions.appendChild(crearBoton("Resolver", "RESUELTA", tarea.id, "btn primary"));
    actions.appendChild(crearBoton("Cancelar", "CANCELADA", tarea.id, "btn ghost"));
  }

  article.append(head, body, actions);
  return article;
}

function renderTareas(): void {
  if (!tasksGrid) return;

  const filtradas = tareasFiltradas();
  actualizarResumenFiltrado(filtradas.length);
  tasksGrid.innerHTML = "";

  if (tareas.length === 0) {
    setGridMessage("No hay tareas operativas registradas");
    return;
  }

  if (filtradas.length === 0) {
    setGridMessage("No hay tareas que coincidan con los filtros.");
    return;
  }

  filtradas.forEach((tarea) => {
    tasksGrid.appendChild(renderTarea(tarea));
  });
}

async function cargarTareas(): Promise<void> {
  setTaskFeedback(null);
  setGridMessage("Cargando tareas operativas...");

  try {
    const data = await fetchJson<TareaOperativaResponse[]>(API_TAREAS);
    tareas = data.slice().sort((a, b) => new Date(b.createdAt ?? "").getTime() - new Date(a.createdAt ?? "").getTime());
    actualizarMetricas();
    renderFiltrosDinamicos();
    renderTareas();
  } catch (err) {
    tareas = [];
    actualizarMetricas();
    renderFiltrosDinamicos();
    actualizarResumenFiltrado(0);
    setGridMessage(err instanceof Error ? err.message : "No se pudieron cargar las tareas");
  }
}

function renderTrabajadoresActivos(): void {
  if (!trabajadorSelect) return;

  trabajadorSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = trabajadoresActivos.length > 0
    ? "Selecciona trabajador"
    : "No hay trabajadores activos";
  trabajadorSelect.appendChild(placeholder);

  trabajadoresActivos.forEach((trabajador) => {
    const option = document.createElement("option");
    option.value = String(trabajador.id);
    option.textContent = etiquetaTrabajadorActivo(trabajador);
    trabajadorSelect.appendChild(option);
  });
}

async function cargarTrabajadoresActivos(): Promise<void> {
  if (!trabajadorSelect) return;

  try {
    trabajadoresActivos = await fetchJson<TrabajadorActivoResponse[]>(API_TRABAJADORES_ACTIVOS);
  } catch {
    trabajadoresActivos = [];
  }

  renderTrabajadoresActivos();
  renderFiltrosDinamicos();
}

async function cargarSeccionesFiltro(): Promise<void> {
  try {
    seccionesDisponibles = await fetchJson<SeccionResponse[]>(`/api/empresas/${encodeURIComponent(CODIGO_EMPRESA_DEMO)}/secciones`);
  } catch {
    seccionesDisponibles = [];
  }

  renderFiltrosDinamicos();
}

async function cargarEstanteriasFiltroPorSeccion(): Promise<void> {
  const seccionValue = filtroSeccion?.value ?? "";
  estanteriasFiltro = [];

  if (!seccionValue) {
    renderFiltroEstanteria();
    renderTareas();
    return;
  }

  const seccion = seccionesDisponibles.find((item) => valorSeccion(item) === seccionValue);
  if (seccion?.id == null) {
    renderFiltroEstanteria();
    renderTareas();
    return;
  }

  try {
    estanteriasFiltro = await fetchJson<EstanteriaResumenResponse[]>(`/api/secciones/${encodeURIComponent(String(seccion.id))}/estanterias`);
  } catch {
    estanteriasFiltro = [];
  }

  renderFiltroEstanteria();
  renderTareas();
}

async function cambiarEstado(id: number, estado: EstadoTareaOperativa): Promise<void> {
  setTaskFeedback(null);
  await fetchJson<TareaOperativaResponse>(`${API_TAREAS}/${encodeURIComponent(String(id))}/estado`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ estado })
  });
  await cargarTareas();
}

async function asignarTarea(id: number): Promise<void> {
  setTaskFeedback(null);
  const trabajadorId = Number(trabajadorSelect?.value);
  if (!Number.isInteger(trabajadorId) || trabajadorId <= 0) {
    throw new Error("Selecciona un trabajador activo antes de asignar la tarea");
  }

  await fetchJson<TareaOperativaResponse>(`${API_TAREAS}/${encodeURIComponent(String(id))}/asignar`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ trabajadorId })
  });
  await cargarTareas();
}

tasksGrid?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const button = target.closest<HTMLButtonElement>("button[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.action;
  if (!Number.isFinite(id) || !action) return;

  button.disabled = true;

  const operation = action === "asignar"
    ? asignarTarea(id)
    : cambiarEstado(id, action as EstadoTareaOperativa);

  void operation.catch((err: unknown) => {
    setTaskFeedback(err instanceof Error ? err.message : "No se pudo actualizar la tarea");
    renderTareas();
  });
});

filtroEstado?.addEventListener("change", renderTareas);
filtroPrioridad?.addEventListener("change", renderTareas);
filtroTipo?.addEventListener("change", renderTareas);
filtroTrabajador?.addEventListener("change", renderTareas);
filtroSeccion?.addEventListener("change", () => {
  if (filtroEstanteria) filtroEstanteria.value = "";
  void cargarEstanteriasFiltroPorSeccion();
});
filtroEstanteria?.addEventListener("change", renderTareas);
filtroTexto?.addEventListener("input", renderTareas);

btnLimpiar?.addEventListener("click", () => {
  setTaskFeedback(null);
  if (filtroEstado) filtroEstado.value = "";
  if (filtroPrioridad) filtroPrioridad.value = "";
  if (filtroTipo) filtroTipo.value = "";
  if (filtroTrabajador) filtroTrabajador.value = "";
  if (filtroSeccion) filtroSeccion.value = "";
  if (filtroEstanteria) filtroEstanteria.value = "";
  if (filtroTexto) filtroTexto.value = "";
  estanteriasFiltro = [];
  renderFiltroEstanteria();
  renderTareas();
});

document.addEventListener("DOMContentLoaded", () => {
  void cargarTrabajadoresActivos();
  void cargarSeccionesFiltro();
  void cargarTareas();
});
