import { authFetch } from "../lib/api";

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
  codigo?: string | null;
  nombre?: string | null;
};

type EstanteriaResumenResponse = {
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
  alertaId: number;
  tipoTarea: TipoTareaOperativa;
  prioridad: Prioridad;
  estadoTarea: EstadoTareaOperativa;
  titulo: string;
  descripcion: string;
  seccion?: SeccionResponse | null;
  estanteria?: EstanteriaResumenResponse | null;
  slot?: AlertaSlotResponse | null;
  asignacion?: AlertaAsignacionResponse | null;
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
};

const API_TAREAS = "/api/tareas";
const API_TRABAJADORES_ACTIVOS = "/api/trabajadores/activos";

const tasksGrid = document.querySelector<HTMLElement>("#tasks-grid");
const filtroEstado = document.querySelector<HTMLSelectElement>("#filtro-estado");
const filtroPrioridad = document.querySelector<HTMLSelectElement>("#filtro-prioridad");
const filtroTexto = document.querySelector<HTMLInputElement>("#filtro-texto");
const trabajadorSelect = document.querySelector<HTMLSelectElement>("#trabajador-select");
const btnLimpiar = document.querySelector<HTMLButtonElement>("#btn-limpiar");

const metricPendientes = document.querySelector<HTMLElement>("#metric-pendientes");
const metricCurso = document.querySelector<HTMLElement>("#metric-curso");
const metricCompletadas = document.querySelector<HTMLElement>("#metric-completadas");

let tareas: TareaOperativaResponse[] = [];
let trabajadoresActivos: TrabajadorActivoResponse[] = [];

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

function productoTarea(tarea: TareaOperativaResponse): string {
  return textoSeguro(
    tarea.asignacion?.producto?.nombre ?? tarea.slot?.productoEsperado?.nombre,
    "Sin producto asociado"
  );
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
    tarea.asignacion?.proveedor?.nombre,
    tarea.asignacion?.claveProductoProveedor,
    nombreTrabajador(tarea.trabajadorAsignado)
  ].join(" ").toLowerCase();
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
  if (status === 401) return "Debes iniciar sesión para consultar tareas";
  if (status === 403) return "No tienes permisos para modificar esta tarea";
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

function tareasFiltradas(): TareaOperativaResponse[] {
  const estado = filtroEstado?.value ?? "";
  const prioridad = filtroPrioridad?.value ?? "";
  const texto = filtroTexto?.value.trim().toLowerCase() ?? "";

  return tareas.filter((tarea) => {
    const okEstado = !estado || tarea.estadoTarea === estado;
    const okPrioridad = !prioridad || tarea.prioridad === prioridad;
    const okTexto = !texto || blobBusqueda(tarea).includes(texto);
    return okEstado && okPrioridad && okTexto;
  });
}

function addMeta(container: HTMLElement, label: string, value: string, full = false): void {
  const box = document.createElement("div");
  box.className = `meta-box${full ? " full" : ""}`;

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

function renderTarea(tarea: TareaOperativaResponse): HTMLElement {
  const article = document.createElement("article");
  article.className = "task-card";

  const head = document.createElement("div");
  head.className = "task-head";

  const titleGroup = document.createElement("div");
  titleGroup.className = "task-title-group";

  const id = document.createElement("span");
  id.className = "task-id";
  id.textContent = `T-${tarea.id} / A-${tarea.alertaId}`;

  const title = document.createElement("h2");
  title.className = "task-title";
  title.textContent = tarea.titulo;

  titleGroup.append(id, title);

  const chip = document.createElement("span");
  chip.className = `status-chip ${claseEstado(tarea.estadoTarea)}`;
  chip.textContent = etiquetaEstado(tarea.estadoTarea);

  head.append(titleGroup, chip);

  const body = document.createElement("div");
  body.className = "task-body";

  const meta = document.createElement("div");
  meta.className = "task-meta";

  addMeta(meta, "Acción", `${etiquetaTipo(tarea.tipoTarea)} / ${tarea.prioridad}`, true);
  addMeta(meta, "Estantería", estanteriaTarea(tarea));
  addMeta(meta, "Sección", seccionTarea(tarea));
  addMeta(meta, "Slot", slotTarea(tarea));
  addMeta(meta, "Producto", productoTarea(tarea));
  addMeta(meta, "Trabajador", nombreTrabajador(tarea.trabajadorAsignado), true);
  addMeta(meta, "Creada", formatFecha(tarea.createdAt));
  addMeta(meta, "Asignada", formatFecha(tarea.assignedAt));
  addMeta(meta, "Resuelta", formatFecha(tarea.resueltaAt));
  addMeta(meta, "Proveedor", textoSeguro(tarea.asignacion?.proveedor?.nombre, "Sin proveedor"));
  addMeta(meta, "Descripción", tarea.descripcion || "Sin descripción", true);

  body.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "task-actions";

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
  tasksGrid.innerHTML = "";

  if (tareas.length === 0) {
    setGridMessage("No hay tareas operativas registradas");
    return;
  }

  if (filtradas.length === 0) {
    setGridMessage("No hay tareas que coincidan con los filtros");
    return;
  }

  filtradas.forEach((tarea) => {
    tasksGrid.appendChild(renderTarea(tarea));
  });
}

async function cargarTareas(): Promise<void> {
  setGridMessage("Cargando tareas operativas...");

  try {
    const data = await fetchJson<TareaOperativaResponse[]>(API_TAREAS);
    tareas = data.slice().sort((a, b) => new Date(b.createdAt ?? "").getTime() - new Date(a.createdAt ?? "").getTime());
    actualizarMetricas();
    renderTareas();
  } catch (err) {
    tareas = [];
    actualizarMetricas();
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
}

async function cambiarEstado(id: number, estado: EstadoTareaOperativa): Promise<void> {
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
  const trabajadorId = Number(trabajadorSelect?.value);
  if (!Number.isInteger(trabajadorId) || trabajadorId <= 0) {
    setGridMessage("Selecciona un trabajador activo antes de asignar");
    return;
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
    setGridMessage(err instanceof Error ? err.message : "No se pudo actualizar la tarea");
  });
});

filtroEstado?.addEventListener("change", renderTareas);
filtroPrioridad?.addEventListener("change", renderTareas);
filtroTexto?.addEventListener("input", renderTareas);

btnLimpiar?.addEventListener("click", () => {
  if (filtroEstado) filtroEstado.value = "";
  if (filtroPrioridad) filtroPrioridad.value = "";
  if (filtroTexto) filtroTexto.value = "";
  renderTareas();
});

document.addEventListener("DOMContentLoaded", () => {
  void cargarTrabajadoresActivos();
  void cargarTareas();
});
