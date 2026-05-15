import { authFetch, isStructuralAdmin } from "../lib/api";
import { requireAuth } from "../lib/auth-guard";

requireAuth();

type TipoTarea = "REPOSICION" | "REVISION_VISUAL" | "VERIFICACION_MANUAL" | "REVISION_CADUCIDAD" | "RETIRADA_PRODUCTO";
type Prioridad = "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
type EstadoTarea = "PENDIENTE" | "EN_PROGRESO" | "RESUELTA" | "CANCELADA";

type ApiErrorResponse = {
  message?: string;
  fieldErrors?: Record<string, string>;
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

type ProductoResumenResponse = {
  codigoInterno: string | null;
  nombre: string | null;
};

type SlotConfiguradoResponse = {
  id: number;
  slotId: string;
  orden: number;
  productoEsperado: ProductoResumenResponse | null;
};

type EstanteriaConfiguracionResponse = {
  id: number;
  codigo: string;
  slots: SlotConfiguradoResponse[];
};

type TrabajadorResponse = {
  id: number;
  nombre: string | null;
  apellidos: string | null;
  tipoTrabajador: string | null;
};

type TareaResponse = {
  id: number;
  alertaId: number | null;
  tipoTarea: TipoTarea;
  prioridad: Prioridad;
  estadoTarea: EstadoTarea;
  titulo: string;
  descripcion: string | null;
  seccion: { id: number } | null;
  estanteria: { id: number; codigo: string } | null;
  slot: { id: number } | null;
  trabajadorAsignado: { id: number } | null;
  fechaLimite: string | null;
};

type TareaPayload = {
  tipoTarea: TipoTarea;
  prioridad: Prioridad;
  titulo: string;
  descripcion: string | null;
  seccionId: number | null;
  estanteriaId: number | null;
  slotConfiguracionId: number | null;
  trabajadorAsignadoId: number | null;
  fechaLimite: string | null;
};

const EMPRESA_CODIGO = "EMP-DEMO";
const params = new URLSearchParams(window.location.search);
const tareaId = params.get("id");
const isEditMode = Boolean(tareaId);
const puedeGestionarTareas = isStructuralAdmin();

const formMode = document.querySelector<HTMLElement>("#form-mode");
const formTitle = document.querySelector<HTMLElement>("#form-title");
const formStatus = document.querySelector<HTMLElement>("#form-status");
const taskForm = document.querySelector<HTMLFormElement>("#task-form");
const btnSubmit = document.querySelector<HTMLButtonElement>("#btn-submit");
const tipoSelect = document.querySelector<HTMLSelectElement>("#tipo-tarea");
const prioridadSelect = document.querySelector<HTMLSelectElement>("#prioridad");
const tituloInput = document.querySelector<HTMLInputElement>("#titulo");
const descripcionInput = document.querySelector<HTMLTextAreaElement>("#descripcion");
const seccionSelect = document.querySelector<HTMLSelectElement>("#seccion");
const estanteriaSelect = document.querySelector<HTMLSelectElement>("#estanteria");
const slotSelect = document.querySelector<HTMLSelectElement>("#slot");
const trabajadorSelect = document.querySelector<HTMLSelectElement>("#trabajador");
const fechaLimiteInput = document.querySelector<HTMLInputElement>("#fecha-limite");

let tareaActual: TareaResponse | null = null;
let secciones: SeccionResponse[] = [];
let estanterias: EstanteriaResumenResponse[] = [];
let slots: SlotConfiguradoResponse[] = [];
let trabajadores: TrabajadorResponse[] = [];
let saving = false;

function setText(element: HTMLElement | null, text: string): void {
  if (element) element.textContent = text;
}

function setStatus(message: string, kind: "info" | "ok" | "error" = "info"): void {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.dataset.kind = kind;
}

function permissionMessage(): string {
  return "Solo un administrador puede crear o editar tareas manuales.";
}

function disableForm(): void {
  if (!taskForm) return;
  Array.from(taskForm.elements).forEach((element) => {
    if ("disabled" in element) {
      (element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement).disabled = true;
    }
  });
  if (btnSubmit) btnSubmit.disabled = true;
}

function option(value: string, text: string): HTMLOptionElement {
  const node = document.createElement("option");
  node.value = value;
  node.textContent = text;
  return node;
}

async function parseErrorResponse(response: Response): Promise<ApiErrorResponse | null> {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) as ApiErrorResponse : null;
  } catch {
    return null;
  }
}

function backendErrorMessage(data: ApiErrorResponse | null, status: number): string {
  const fieldMessage = data?.fieldErrors ? Object.values(data.fieldErrors)[0] : null;
  if (fieldMessage) return fieldMessage;
  if (data?.message) return data.message;
  if (status === 403) return permissionMessage();
  if (status === 409) return "No se puede editar una tarea resuelta o cancelada.";
  if (status === 404) return "No se encontro la tarea solicitada.";
  if (status === 400) return "Revisa los datos de la tarea.";
  return `Error HTTP ${status}`;
}

async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await authFetch(url, {
    ...init,
    headers: {
      "Accept": "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...Object.fromEntries(new Headers(init.headers))
    }
  });

  if (!response.ok) {
    throw new Error(backendErrorMessage(await parseErrorResponse(response), response.status));
  }

  return response.json() as Promise<T>;
}

function labelTrabajador(trabajador: TrabajadorResponse): string {
  const nombre = [trabajador.nombre, trabajador.apellidos].filter(Boolean).join(" ").trim();
  return `${nombre || "Trabajador sin nombre"} - ${trabajador.tipoTrabajador ?? "Sin tipo"}`;
}

function labelSlot(slot: SlotConfiguradoResponse): string {
  const producto = slot.productoEsperado?.nombre ?? slot.productoEsperado?.codigoInterno ?? "Sin producto";
  return `${slot.slotId} / orden ${slot.orden} / ${producto}`;
}

function renderSecciones(selectedId?: number | null): void {
  if (!seccionSelect) return;
  seccionSelect.innerHTML = "";
  seccionSelect.appendChild(option("", "Sin seccion"));
  secciones.forEach((seccion) => {
    const node = option(String(seccion.id), `${seccion.nombre} - ${seccion.codigo}`);
    node.selected = seccion.id === selectedId;
    seccionSelect.appendChild(node);
  });
}

function renderEstanterias(selectedId?: number | null): void {
  if (!estanteriaSelect) return;
  estanteriaSelect.innerHTML = "";
  estanteriaSelect.appendChild(option("", "Sin estanteria"));
  estanterias.forEach((estanteria) => {
    const node = option(String(estanteria.id), `${estanteria.codigo} - ${estanteria.nombre}`);
    node.selected = estanteria.id === selectedId;
    estanteriaSelect.appendChild(node);
  });
}

function renderSlots(selectedId?: number | null): void {
  if (!slotSelect) return;
  slotSelect.innerHTML = "";
  slotSelect.appendChild(option("", "Sin slot"));
  slots.forEach((slot) => {
    const node = option(String(slot.id), labelSlot(slot));
    node.selected = slot.id === selectedId;
    slotSelect.appendChild(node);
  });
}

function renderTrabajadores(selectedId?: number | null): void {
  if (!trabajadorSelect) return;
  trabajadorSelect.innerHTML = "";
  trabajadorSelect.appendChild(option("", "Sin trabajador asignado"));
  trabajadores.forEach((trabajador) => {
    const node = option(String(trabajador.id), labelTrabajador(trabajador));
    node.selected = trabajador.id === selectedId;
    trabajadorSelect.appendChild(node);
  });
}

async function cargarSecciones(selectedId?: number | null): Promise<void> {
  secciones = await fetchJson<SeccionResponse[]>(`/api/empresas/${encodeURIComponent(EMPRESA_CODIGO)}/secciones`);
  renderSecciones(selectedId);
}

async function cargarEstanterias(seccionId: number | null, selectedId?: number | null): Promise<void> {
  estanterias = seccionId
    ? await fetchJson<EstanteriaResumenResponse[]>(`/api/secciones/${seccionId}/estanterias`)
    : [];
  renderEstanterias(selectedId);
}

async function cargarSlots(codigoEstanteria: string | null, selectedId?: number | null): Promise<void> {
  slots = codigoEstanteria
    ? (await fetchJson<EstanteriaConfiguracionResponse>(`/api/estanterias/${encodeURIComponent(codigoEstanteria)}/configuracion`)).slots
    : [];
  renderSlots(selectedId);
}

async function cargarTrabajadores(selectedId?: number | null): Promise<void> {
  trabajadores = await fetchJson<TrabajadorResponse[]>("/api/trabajadores/activos");
  renderTrabajadores(selectedId);
}

function toDatetimeLocal(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function numberOrNull(value: string | undefined): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function validatePayload(payload: TareaPayload): string | null {
  if (!payload.tipoTarea) return "Selecciona un tipo de tarea.";
  if (!payload.prioridad) return "Selecciona una prioridad.";
  if (!payload.titulo) return "El titulo es obligatorio.";
  if (payload.titulo.length > 200) return "El titulo no puede superar 200 caracteres.";
  if (payload.slotConfiguracionId && !payload.estanteriaId) return "Selecciona una estanteria antes de elegir slot.";
  if (fechaLimiteInput?.value && !payload.fechaLimite) return "La fecha limite no es valida.";
  return null;
}

function buildPayload(): TareaPayload | string {
  const payload: TareaPayload = {
    tipoTarea: (tipoSelect?.value || "REPOSICION") as TipoTarea,
    prioridad: (prioridadSelect?.value || "MEDIA") as Prioridad,
    titulo: tituloInput?.value.trim() ?? "",
    descripcion: descripcionInput?.value.trim() || null,
    seccionId: numberOrNull(seccionSelect?.value),
    estanteriaId: numberOrNull(estanteriaSelect?.value),
    slotConfiguracionId: numberOrNull(slotSelect?.value),
    trabajadorAsignadoId: numberOrNull(trabajadorSelect?.value),
    fechaLimite: fromDatetimeLocal(fechaLimiteInput?.value ?? "")
  };

  return validatePayload(payload) ?? payload;
}

async function cargarTarea(): Promise<void> {
  if (!tareaId) return;
  tareaActual = await fetchJson<TareaResponse>(`/api/tareas/${encodeURIComponent(tareaId)}`);
  if (tareaActual.estadoTarea === "RESUELTA" || tareaActual.estadoTarea === "CANCELADA") {
    setStatus("No se puede editar una tarea resuelta o cancelada.", "error");
    disableForm();
  }

  if (tipoSelect) tipoSelect.value = tareaActual.tipoTarea;
  if (prioridadSelect) prioridadSelect.value = tareaActual.prioridad;
  if (tituloInput) tituloInput.value = tareaActual.titulo;
  if (descripcionInput) descripcionInput.value = tareaActual.descripcion ?? "";
  if (fechaLimiteInput) fechaLimiteInput.value = toDatetimeLocal(tareaActual.fechaLimite);

  await cargarSecciones(tareaActual.seccion?.id ?? null);
  await cargarEstanterias(tareaActual.seccion?.id ?? null, tareaActual.estanteria?.id ?? null);
  await cargarSlots(tareaActual.estanteria?.codigo ?? null, tareaActual.slot?.id ?? null);
  renderTrabajadores(tareaActual.trabajadorAsignado?.id ?? null);
}

async function guardar(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  if (!puedeGestionarTareas) {
    setStatus(permissionMessage(), "error");
    return;
  }
  if (saving) return;

  const payload = buildPayload();
  if (typeof payload === "string") {
    setStatus(payload, "error");
    return;
  }

  saving = true;
  if (btnSubmit) btnSubmit.disabled = true;
  setStatus("Guardando tarea...", "info");

  try {
    const url = isEditMode && tareaId ? `/api/tareas/${encodeURIComponent(tareaId)}` : "/api/tareas";
    const method = isEditMode ? "PATCH" : "POST";
    const saved = await fetchJson<TareaResponse>(url, {
      method,
      body: JSON.stringify(payload)
    });
    setStatus("Tarea guardada correctamente.", "ok");
    window.location.href = `tareas_reposicion.html#tarea-${encodeURIComponent(String(saved.id))}`;
  } catch (err) {
    setStatus(err instanceof Error ? err.message : "No se pudo guardar la tarea.", "error");
  } finally {
    saving = false;
    if (btnSubmit && (!tareaActual || (tareaActual.estadoTarea !== "RESUELTA" && tareaActual.estadoTarea !== "CANCELADA"))) {
      btnSubmit.disabled = false;
    }
  }
}

function bindEvents(): void {
  taskForm?.addEventListener("submit", (event) => {
    void guardar(event);
  });
  seccionSelect?.addEventListener("change", async () => {
    const seccionId = numberOrNull(seccionSelect.value);
    await cargarEstanterias(seccionId);
    await cargarSlots(null);
  });
  estanteriaSelect?.addEventListener("change", async () => {
    const selected = estanterias.find((item) => String(item.id) === estanteriaSelect?.value);
    await cargarSlots(selected?.codigo ?? null);
  });
}

async function init(): Promise<void> {
  setText(formMode, isEditMode ? "Edicion de tarea" : "Tarea manual");
  setText(formTitle, isEditMode ? "Editar tarea operativa" : "Nueva tarea operativa");
  if (!puedeGestionarTareas) {
    setStatus(permissionMessage(), "error");
    disableForm();
    return;
  }

  bindEvents();
  try {
    await Promise.all([cargarSecciones(), cargarTrabajadores()]);
    renderEstanterias();
    renderSlots();
    if (isEditMode) {
      await cargarTarea();
      setStatus("Tarea cargada.", "ok");
    } else {
      setStatus("Formulario listo.", "ok");
    }
  } catch (err) {
    setStatus(err instanceof Error ? err.message : "No se pudo preparar el formulario.", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  void init();
});
