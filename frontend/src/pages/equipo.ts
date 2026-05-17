import { authFetch } from "../lib/api";
import { requireAdminPanelAccess } from "../lib/auth-guard";

requireAdminPanelAccess();

type TipoTrabajador = "ADMINISTRADOR" | "ENCARGADO" | "TRABAJADOR" | string;
type EstadoDisponibilidad = "DISPONIBLE" | "AUSENTE" | "ENFERMO" | string;
type EstadoTarea = "PENDIENTE" | "EN_PROGRESO" | string;

type EstanteriaAsignada = {
  id: number | null;
  codigo: string | null;
  nombre: string | null;
  activa: boolean | null;
  seccionCodigo: string | null;
  seccionNombre: string | null;
};

type TareaAsignada = {
  id: number;
  titulo: string | null;
  tipoTarea: string | null;
  prioridad: string | null;
  estadoTarea: EstadoTarea;
  fechaLimite: string | null;
  estanteriaCodigo: string | null;
  estanteriaNombre: string | null;
};

type TrabajadorResponse = {
  id: number;
  nombre: string | null;
  apellidos: string | null;
  emailContacto: string | null;
  telefonoContacto: string | null;
  tipoTrabajador: TipoTrabajador | null;
  estadoDisponibilidad: EstadoDisponibilidad | null;
  activo: boolean | null;
  empresaCodigo: string | null;
  empresaNombre: string | null;
  estanteriasAsignadas: EstanteriaAsignada[];
  tareasPendientes: number;
  tareasEnProgreso: number;
  tareasAsignadas: TareaAsignada[];
};

type ApiErrorResponse = {
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const workersBody = document.querySelector<HTMLTableSectionElement>("#workers-body");
const workersSummary = document.querySelector<HTMLElement>("#workers-summary");
const filterText = document.querySelector<HTMLInputElement>("#filter-text");
const filterActive = document.querySelector<HTMLSelectElement>("#filter-active");
const filterAvailability = document.querySelector<HTMLSelectElement>("#filter-availability");
const filterType = document.querySelector<HTMLSelectElement>("#filter-type");
const btnClearFilters = document.querySelector<HTMLButtonElement>("#btn-clear-filters");
const btnNewWorker = document.querySelector<HTMLButtonElement>("#btn-new-worker");

const detailEmpty = document.querySelector<HTMLElement>("#detail-empty");
const workerDetail = document.querySelector<HTMLElement>("#worker-detail");
const detailName = document.querySelector<HTMLElement>("#detail-name");
const detailActiveBadge = document.querySelector<HTMLElement>("#detail-active-badge");
const detailData = document.querySelector<HTMLElement>("#detail-data");
const assignedRacks = document.querySelector<HTMLUListElement>("#assigned-racks");
const assignedTasks = document.querySelector<HTMLUListElement>("#assigned-tasks");
const workerActionStatus = document.querySelector<HTMLElement>("#worker-action-status");
const btnEditWorker = document.querySelector<HTMLButtonElement>("#btn-edit-worker");
const btnDeactivateWorker = document.querySelector<HTMLButtonElement>("#btn-deactivate-worker");
const btnReactivateWorker = document.querySelector<HTMLButtonElement>("#btn-reactivate-worker");

const workerDialog = document.querySelector<HTMLDialogElement>("#worker-dialog");
const workerForm = document.querySelector<HTMLFormElement>("#worker-form");
const workerDialogTitle = document.querySelector<HTMLElement>("#worker-dialog-title");
const btnCloseWorkerDialog = document.querySelector<HTMLButtonElement>("#btn-close-worker-dialog");
const workerNameInput = document.querySelector<HTMLInputElement>("#worker-name");
const workerSurnameInput = document.querySelector<HTMLInputElement>("#worker-surname");
const workerEmailInput = document.querySelector<HTMLInputElement>("#worker-email");
const workerPhoneInput = document.querySelector<HTMLInputElement>("#worker-phone");
const workerTypeSelect = document.querySelector<HTMLSelectElement>("#worker-type");
const workerAvailabilitySelect = document.querySelector<HTMLSelectElement>("#worker-availability");
const workerFormStatus = document.querySelector<HTMLElement>("#worker-form-status");
const btnSaveWorker = document.querySelector<HTMLButtonElement>("#btn-save-worker");

const deactivateWorkerDialog = document.querySelector<HTMLDialogElement>("#deactivate-worker-dialog");
const btnCancelDeactivateWorker = document.querySelector<HTMLButtonElement>("#btn-cancel-deactivate-worker");
const btnConfirmDeactivateWorker = document.querySelector<HTMLButtonElement>("#btn-confirm-deactivate-worker");

let trabajadores: TrabajadorResponse[] = [];
let selectedWorkerId: number | null = null;
let dialogMode: "create" | "edit" = "create";

const tipoLabels: Record<string, string> = {
  ADMINISTRADOR: "Administrador operativo",
  ENCARGADO: "Encargado",
  TRABAJADOR: "Trabajador"
};

const disponibilidadLabels: Record<string, string> = {
  DISPONIBLE: "Disponible",
  AUSENTE: "Ausente",
  ENFERMO: "Enfermo"
};

const estadoTareaLabels: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En progreso"
};

function textoSeguro(value: string | number | null | undefined, fallback = "No disponible"): string {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function nombreCompleto(trabajador: TrabajadorResponse): string {
  return [trabajador.nombre, trabajador.apellidos].filter(Boolean).join(" ") || `Trabajador #${trabajador.id}`;
}

function labelTipo(tipo: string | null | undefined): string {
  return tipo ? tipoLabels[tipo] ?? tipo : "Sin tipo";
}

function labelDisponibilidad(value: string | null | undefined): string {
  return value ? disponibilidadLabels[value] ?? value : "Disponible";
}

function disponibilidadClass(value: string | null | undefined): string {
  if (value === "AUSENTE") return "absent";
  if (value === "ENFERMO") return "sick";
  return "available";
}

function estadoActivoClass(trabajador: TrabajadorResponse): string {
  return trabajador.activo === false ? "inactive" : "active";
}

function setText(element: HTMLElement | null, value: string): void {
  if (element) element.textContent = value;
}

async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await authFetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    let message = `Error ${response.status}`;
    try {
      const body = await response.json() as ApiErrorResponse;
      message = body.message || body.error || message;
      if (body.fieldErrors) {
        const firstFieldError = Object.values(body.fieldErrors)[0];
        if (firstFieldError) message = firstFieldError;
      }
    } catch {
      // Se mantiene el mensaje HTTP.
    }
    throw new Error(message);
  }

  return await response.json() as T;
}

function trabajadoresFiltrados(): TrabajadorResponse[] {
  const text = (filterText?.value ?? "").trim().toLowerCase();
  const active = filterActive?.value ?? "ALL";
  const availability = filterAvailability?.value ?? "";
  const type = filterType?.value ?? "";

  return trabajadores.filter((trabajador) => {
    const blob = [
      trabajador.nombre,
      trabajador.apellidos,
      trabajador.emailContacto,
      trabajador.telefonoContacto,
      trabajador.tipoTrabajador,
      trabajador.estadoDisponibilidad
    ].filter(Boolean).join(" ").toLowerCase();
    const okText = !text || blob.includes(text);
    const okActive = active === "ALL"
      || (active === "ACTIVE" && trabajador.activo !== false)
      || (active === "INACTIVE" && trabajador.activo === false);
    const okAvailability = !availability || trabajador.estadoDisponibilidad === availability;
    const okType = !type || trabajador.tipoTrabajador === type;
    return okText && okActive && okAvailability && okType;
  });
}

function renderWorkers(): void {
  if (!workersBody) return;
  const visibles = trabajadoresFiltrados();
  workersBody.innerHTML = "";
  setText(workersSummary, `Mostrando ${visibles.length} de ${trabajadores.length} trabajadores`);

  if (visibles.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.textContent = "No hay trabajadores que coincidan con los filtros.";
    row.append(cell);
    workersBody.append(row);
    return;
  }

  visibles.forEach((trabajador) => {
    const row = document.createElement("tr");
    row.tabIndex = 0;
    row.dataset.workerId = String(trabajador.id);
    if (trabajador.id === selectedWorkerId) row.classList.add("is-selected");

    row.append(
      td(nombreCompleto(trabajador)),
      td(labelTipo(trabajador.tipoTrabajador)),
      tdBadge(labelDisponibilidad(trabajador.estadoDisponibilidad), disponibilidadClass(trabajador.estadoDisponibilidad)),
      tdBadge(trabajador.activo === false ? "Inactivo" : "Activo", estadoActivoClass(trabajador)),
      td(textoSeguro(trabajador.emailContacto, "Sin email")),
      td(textoSeguro(trabajador.telefonoContacto, "Sin teléfono"))
    );

    row.addEventListener("click", () => seleccionarTrabajador(trabajador.id));
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        seleccionarTrabajador(trabajador.id);
      }
    });
    workersBody.append(row);
  });
}

function td(value: string): HTMLTableCellElement {
  const cell = document.createElement("td");
  cell.textContent = value;
  return cell;
}

function tdBadge(value: string, className: string): HTMLTableCellElement {
  const cell = document.createElement("td");
  const badge = document.createElement("span");
  badge.className = `badge ${className}`;
  badge.textContent = value;
  cell.append(badge);
  return cell;
}

function seleccionarTrabajador(id: number): void {
  selectedWorkerId = id;
  renderWorkers();
  renderDetail();
}

function selectedWorker(): TrabajadorResponse | null {
  return trabajadores.find((trabajador) => trabajador.id === selectedWorkerId) ?? null;
}

function renderDetail(): void {
  const trabajador = selectedWorker();
  if (!trabajador) {
    if (workerDetail) workerDetail.hidden = true;
    if (detailEmpty) detailEmpty.hidden = false;
    return;
  }

  if (workerDetail) workerDetail.hidden = false;
  if (detailEmpty) detailEmpty.hidden = true;
  setText(detailName, nombreCompleto(trabajador));
  if (detailActiveBadge) {
    detailActiveBadge.className = `badge ${estadoActivoClass(trabajador)}`;
    detailActiveBadge.textContent = trabajador.activo === false ? "Inactivo" : "Activo";
  }

  if (btnDeactivateWorker) btnDeactivateWorker.hidden = trabajador.activo === false;
  if (btnReactivateWorker) btnReactivateWorker.hidden = trabajador.activo !== false;

  renderDataList(trabajador);
  renderAssignedRacks(trabajador);
  renderAssignedTasks(trabajador);
}

function renderDataList(trabajador: TrabajadorResponse): void {
  if (!detailData) return;
  detailData.innerHTML = "";
  addData("Tipo operativo", labelTipo(trabajador.tipoTrabajador));
  addData("Disponibilidad", labelDisponibilidad(trabajador.estadoDisponibilidad));
  addData("Email", textoSeguro(trabajador.emailContacto, "Sin email"));
  addData("Teléfono", textoSeguro(trabajador.telefonoContacto, "Sin teléfono"));
  addData("Empresa", textoSeguro(trabajador.empresaNombre ?? trabajador.empresaCodigo));
  addData("Tareas pendientes", String(trabajador.tareasPendientes));
  addData("Tareas en progreso", String(trabajador.tareasEnProgreso));

  if (trabajador.activo === false || trabajador.estadoDisponibilidad !== "DISPONIBLE") {
    addData("Asignaciones nuevas", "No disponible para nuevas asignaciones.");
  }
}

function addData(label: string, value: string): void {
  if (!detailData) return;
  const wrapper = document.createElement("div");
  const dt = document.createElement("dt");
  const dd = document.createElement("dd");
  dt.textContent = label;
  dd.textContent = value;
  wrapper.append(dt, dd);
  detailData.append(wrapper);
}

function renderAssignedRacks(trabajador: TrabajadorResponse): void {
  if (!assignedRacks) return;
  assignedRacks.innerHTML = "";
  if (!trabajador.estanteriasAsignadas.length) {
    assignedRacks.append(emptyItem("Sin estanterías asignadas."));
    return;
  }

  trabajador.estanteriasAsignadas.forEach((rack) => {
    const item = document.createElement("li");
    const title = document.createElement("span");
    const meta = document.createElement("span");
    title.className = "stack-title";
    meta.className = "stack-meta";
    title.textContent = `${textoSeguro(rack.codigo, "Sin código")} · ${textoSeguro(rack.nombre, "Sin nombre")}`;
    meta.textContent = `${textoSeguro(rack.seccionCodigo, "Sin sección")} · ${rack.activa === false ? "Inactiva" : "Activa"}`;
    item.append(title, meta);
    assignedRacks.append(item);
  });
}

function renderAssignedTasks(trabajador: TrabajadorResponse): void {
  if (!assignedTasks) return;
  assignedTasks.innerHTML = "";
  if (!trabajador.tareasAsignadas.length) {
    assignedTasks.append(emptyItem("Sin tareas pendientes ni en progreso."));
    return;
  }

  trabajador.tareasAsignadas.forEach((task) => {
    const item = document.createElement("li");
    const title = document.createElement("span");
    const meta = document.createElement("span");
    title.className = "stack-title";
    meta.className = "stack-meta";
    title.textContent = `#${task.id} · ${textoSeguro(task.titulo, "Tarea operativa")}`;
    meta.textContent = `${estadoTareaLabels[task.estadoTarea] ?? task.estadoTarea} · ${textoSeguro(task.prioridad)} · ${textoSeguro(task.estanteriaCodigo, "Sin estantería")}`;
    item.append(title, meta);
    assignedTasks.append(item);
  });
}

function emptyItem(message: string): HTMLLIElement {
  const item = document.createElement("li");
  item.textContent = message;
  return item;
}

function openCreateDialog(): void {
  dialogMode = "create";
  selectedWorkerId = selectedWorkerId;
  setText(workerDialogTitle, "Nuevo trabajador");
  setText(btnSaveWorker, "Crear trabajador");
  setText(workerFormStatus, "");
  if (workerForm) workerForm.reset();
  if (workerTypeSelect) workerTypeSelect.value = "TRABAJADOR";
  if (workerAvailabilitySelect) workerAvailabilitySelect.value = "DISPONIBLE";
  workerDialog?.showModal();
}

function openEditDialog(): void {
  const trabajador = selectedWorker();
  if (!trabajador) return;
  dialogMode = "edit";
  setText(workerDialogTitle, "Editar trabajador");
  setText(btnSaveWorker, "Guardar cambios");
  setText(workerFormStatus, "");
  if (workerNameInput) workerNameInput.value = trabajador.nombre ?? "";
  if (workerSurnameInput) workerSurnameInput.value = trabajador.apellidos ?? "";
  if (workerEmailInput) workerEmailInput.value = trabajador.emailContacto ?? "";
  if (workerPhoneInput) workerPhoneInput.value = trabajador.telefonoContacto ?? "";
  if (workerTypeSelect) workerTypeSelect.value = trabajador.tipoTrabajador ?? "TRABAJADOR";
  if (workerAvailabilitySelect) workerAvailabilitySelect.value = trabajador.estadoDisponibilidad ?? "DISPONIBLE";
  workerDialog?.showModal();
}

function workerPayload(): Record<string, string | null> {
  return {
    nombre: workerNameInput?.value.trim() ?? "",
    apellidos: workerSurnameInput?.value.trim() ?? "",
    emailContacto: workerEmailInput?.value.trim() || null,
    telefonoContacto: workerPhoneInput?.value.trim() || null,
    tipoTrabajador: workerTypeSelect?.value ?? "TRABAJADOR",
    estadoDisponibilidad: workerAvailabilitySelect?.value ?? "DISPONIBLE"
  };
}

async function saveWorker(): Promise<void> {
  try {
    setText(workerFormStatus, "Guardando trabajador...");
    const payload = workerPayload();
    const url = dialogMode === "edit" && selectedWorkerId != null
      ? `/api/trabajadores/${selectedWorkerId}`
      : "/api/trabajadores";
    const method = dialogMode === "edit" ? "PATCH" : "POST";
    const saved = await fetchJson<TrabajadorResponse>(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    selectedWorkerId = saved.id;
    workerDialog?.close();
    await cargarTrabajadores(true);
    setText(workerActionStatus, dialogMode === "edit" ? "Trabajador actualizado." : "Trabajador creado.");
  } catch (err) {
    setText(workerFormStatus, err instanceof Error ? err.message : "No se pudo guardar el trabajador.");
  }
}

async function cambiarActivo(reactivar: boolean): Promise<void> {
  const trabajador = selectedWorker();
  if (!trabajador) return;
  try {
    setText(workerActionStatus, reactivar ? "Reactivando trabajador..." : "Desactivando trabajador...");
    const saved = await fetchJson<TrabajadorResponse>(
      `/api/trabajadores/${trabajador.id}/${reactivar ? "reactivar" : "desactivar"}`,
      { method: "PATCH" }
    );
    selectedWorkerId = saved.id;
    if (!reactivar) deactivateWorkerDialog?.close();
    await cargarTrabajadores(true);
    setText(workerActionStatus, reactivar
      ? "Trabajador reactivado."
      : "Trabajador desactivado. Se conserva el histórico operativo.");
  } catch (err) {
    setText(workerActionStatus, err instanceof Error ? err.message : "No se pudo cambiar el estado del trabajador.");
  }
}

async function cargarTrabajadores(preserveSelection = false): Promise<void> {
  try {
    trabajadores = await fetchJson<TrabajadorResponse[]>("/api/trabajadores?incluirInactivos=true");
    if (!preserveSelection || !trabajadores.some((trabajador) => trabajador.id === selectedWorkerId)) {
      selectedWorkerId = trabajadores[0]?.id ?? null;
    }
    renderWorkers();
    renderDetail();
  } catch (err) {
    if (workersBody) workersBody.innerHTML = "";
    setText(workersSummary, err instanceof Error ? err.message : "No se pudo cargar el equipo operativo.");
  }
}

filterText?.addEventListener("input", renderWorkers);
filterActive?.addEventListener("change", renderWorkers);
filterAvailability?.addEventListener("change", renderWorkers);
filterType?.addEventListener("change", renderWorkers);
btnClearFilters?.addEventListener("click", () => {
  if (filterText) filterText.value = "";
  if (filterActive) filterActive.value = "ALL";
  if (filterAvailability) filterAvailability.value = "";
  if (filterType) filterType.value = "";
  renderWorkers();
});
btnNewWorker?.addEventListener("click", openCreateDialog);
btnEditWorker?.addEventListener("click", openEditDialog);
btnDeactivateWorker?.addEventListener("click", () => deactivateWorkerDialog?.showModal());
btnReactivateWorker?.addEventListener("click", () => void cambiarActivo(true));
btnCancelDeactivateWorker?.addEventListener("click", () => deactivateWorkerDialog?.close());
btnConfirmDeactivateWorker?.addEventListener("click", () => void cambiarActivo(false));
btnCloseWorkerDialog?.addEventListener("click", () => workerDialog?.close());
workerForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  void saveWorker();
});

void cargarTrabajadores();
