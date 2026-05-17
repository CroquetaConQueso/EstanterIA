import { authFetch, isStructuralAdmin } from "../lib/api";
import { requireAdminPanelAccess } from "../lib/auth-guard";

requireAdminPanelAccess();

type ApiErrorResponse = {
  message?: string;
  error?: string;
  status?: number;
  fieldErrors?: Record<string, string>;
};

type SeccionResponse = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activa: boolean | null;
};

type EstanteriaResumenResponse = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activa: boolean | null;
};

type ProductoResumenResponse = {
  id: number;
  codigoInterno: string | null;
  nombre: string | null;
  descripcion: string | null;
};

type CrearSeccionPayload = {
  empresaCodigo: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
};

type CrearEstanteriaPayload = {
  seccionId: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  slots: Array<{
    slotId: string;
    orden: number;
    productoId: number;
    cantidadObjetivo: number;
  }>;
};

const EMPRESA_CODIGO = "EMP-DEMO";
const puedeConfigurarEstructura = isStructuralAdmin();

const formSeccion = document.querySelector<HTMLFormElement>("#form-seccion");
const seccionCodigoInput = document.querySelector<HTMLInputElement>("#seccion-codigo");
const seccionNombreInput = document.querySelector<HTMLInputElement>("#seccion-nombre");
const seccionDescripcionInput = document.querySelector<HTMLTextAreaElement>("#seccion-descripcion");
const seccionStatus = document.querySelector<HTMLElement>("#seccion-status");
const listaSecciones = document.querySelector<HTMLUListElement>("#lista-secciones");
const mostrarSeccionesInactivasInput = document.querySelector<HTMLInputElement>("#mostrar-secciones-inactivas");

const formEstanteria = document.querySelector<HTMLFormElement>("#form-estanteria");
const estanteriaSeccionSelect = document.querySelector<HTMLSelectElement>("#estanteria-seccion");
const estanteriaCodigoInput = document.querySelector<HTMLInputElement>("#estanteria-codigo");
const estanteriaNombreInput = document.querySelector<HTMLInputElement>("#estanteria-nombre");
const estanteriaDescripcionInput = document.querySelector<HTMLTextAreaElement>("#estanteria-descripcion");
const slotCountInput = document.querySelector<HTMLInputElement>("#slot-count");
const slotsContainer = document.querySelector<HTMLElement>("#slots-container");
const productosStatus = document.querySelector<HTMLElement>("#productos-status");
const estanteriaStatus = document.querySelector<HTMLElement>("#estanteria-status");
const listaEstanterias = document.querySelector<HTMLUListElement>("#lista-estanterias");
const btnCrearEstanteria = document.querySelector<HTMLButtonElement>("#btn-crear-estanteria");
const mostrarEstanteriasInactivasInput = document.querySelector<HTMLInputElement>("#mostrar-estanterias-inactivas");
const seccionGestionLabel = document.querySelector<HTMLElement>("#seccion-gestion-label");

let secciones: SeccionResponse[] = [];
let productos: ProductoResumenResponse[] = [];
let estanteriasSeccion: EstanteriaResumenResponse[] = [];
let savingSeccion = false;
let savingEstanteria = false;
let seccionGestionId: number | null = null;

function setStatus(element: HTMLElement | null, text: string, kind: "info" | "ok" | "error" = "info"): void {
  if (!element) return;
  element.textContent = text;
  element.dataset.kind = kind;
}

function structuralPermissionMessage(): string {
  return "Solo un administrador puede modificar la configuración estructural.";
}

function disableForm(form: HTMLFormElement | null): void {
  if (!form) return;
  Array.from(form.elements).forEach((element) => {
    if ("disabled" in element) {
      (element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement).disabled = true;
    }
  });
}

function applyStructuralPermissions(): void {
  if (puedeConfigurarEstructura) return;
  disableForm(formSeccion);
  disableForm(formEstanteria);
  setStatus(seccionStatus, structuralPermissionMessage(), "error");
  setStatus(estanteriaStatus, structuralPermissionMessage(), "error");
}

function option(value: string, text: string): HTMLOptionElement {
  const node = document.createElement("option");
  node.value = value;
  node.textContent = text;
  return node;
}

function entidadActiva(entidad: { activa: boolean | null }): boolean {
  return entidad.activa !== false;
}

function estadoTexto(entidad: { activa: boolean | null }): string {
  return entidadActiva(entidad) ? "Activa" : "Inactiva";
}

function badgeEstado(entidad: { activa: boolean | null }): HTMLSpanElement {
  const badge = document.createElement("span");
  badge.className = entidadActiva(entidad) ? "state-badge active" : "state-badge inactive";
  badge.textContent = estadoTexto(entidad);
  return badge;
}

function textValue(input: HTMLInputElement | HTMLTextAreaElement | null): string {
  return input?.value.trim() ?? "";
}

function nullableText(input: HTMLTextAreaElement | null): string | null {
  const value = textValue(input);
  return value || null;
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
  if (status === 400) return "Revisa los datos del formulario.";
  if (status === 401) return "La sesión no es válida o ha caducado.";
  if (status === 403) return structuralPermissionMessage();
  if (status === 404) return "No se encontro el recurso solicitado.";
  if (status === 409) return "Ya existe un recurso con esos datos.";
  if (status >= 500) return "El servidor no pudo completar la operacion.";
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
    const errorData = await parseErrorResponse(response);
    throw new Error(backendErrorMessage(errorData, response.status));
  }

  return response.json() as Promise<T>;
}

function selectedManagementSection(): SeccionResponse | null {
  return secciones.find((seccion) => seccion.id === seccionGestionId) ?? null;
}

function syncManagementSection(): void {
  if (seccionGestionId && secciones.some((seccion) => seccion.id === seccionGestionId)) {
    return;
  }

  const selectedCreateId = Number(estanteriaSeccionSelect?.value);
  const selectedCreateSection = Number.isFinite(selectedCreateId)
    ? secciones.find((seccion) => seccion.id === selectedCreateId)
    : null;
  seccionGestionId = selectedCreateSection?.id ?? secciones[0]?.id ?? null;
}

function renderSecciones(): void {
  syncManagementSection();

  if (listaSecciones) {
    listaSecciones.innerHTML = "";
    if (secciones.length === 0) {
      listaSecciones.appendChild(li(mostrarSeccionesInactivasInput?.checked
        ? "No hay secciones registradas."
        : "No hay secciones activas."));
    } else {
      secciones.forEach((seccion) => {
        listaSecciones.appendChild(renderSeccionItem(seccion));
      });
    }
  }

  if (!estanteriaSeccionSelect) return;
  const previous = estanteriaSeccionSelect.value;
  const seccionesActivas = secciones.filter(entidadActiva);
  estanteriaSeccionSelect.innerHTML = "";

  if (seccionesActivas.length === 0) {
    estanteriaSeccionSelect.appendChild(option("", "Crea una sección primero"));
    return;
  }

  seccionesActivas.forEach((seccion) => {
    estanteriaSeccionSelect.appendChild(option(String(seccion.id), `${seccion.nombre} - ${seccion.codigo}`));
  });
  if (previous && seccionesActivas.some((seccion) => String(seccion.id) === previous)) {
    estanteriaSeccionSelect.value = previous;
  }
}

function renderEstanterias(): void {
  if (!listaEstanterias) return;
  listaEstanterias.innerHTML = "";

  const seccion = selectedManagementSection();
  if (seccionGestionLabel) {
    seccionGestionLabel.textContent = seccion
      ? `${seccion.codigo} - ${seccion.nombre} (${estadoTexto(seccion)})`
      : "Selecciona una sección.";
  }

  if (!seccion) {
    listaEstanterias.appendChild(li("Selecciona una sección."));
    return;
  }

  if (estanteriasSeccion.length === 0) {
    listaEstanterias.appendChild(li(mostrarEstanteriasInactivasInput?.checked
      ? "La sección no tiene estanterías registradas."
      : "La sección no tiene estanterías activas."));
    return;
  }

  estanteriasSeccion.forEach((estanteria) => {
    listaEstanterias.appendChild(renderEstanteriaItem(estanteria));
  });
}

function li(text: string): HTMLLIElement {
  const item = document.createElement("li");
  item.textContent = text;
  return item;
}

function renderSeccionItem(seccion: SeccionResponse): HTMLLIElement {
  const item = document.createElement("li");
  if (seccion.id === seccionGestionId) item.classList.add("is-selected");

  const main = document.createElement("div");
  main.className = "entity-main";
  const title = document.createElement("strong");
  title.textContent = `${seccion.codigo} - ${seccion.nombre}`;
  const description = document.createElement("span");
  description.textContent = seccion.descripcion ?? "Sin descripción";
  main.append(title, description);

  const actions = document.createElement("div");
  actions.className = "entity-actions";
  actions.appendChild(badgeEstado(seccion));

  const viewButton = document.createElement("button");
  viewButton.className = "btn compact";
  viewButton.type = "button";
    viewButton.textContent = "Ver estanterías";
  viewButton.addEventListener("click", () => {
    seccionGestionId = seccion.id;
    renderSecciones();
    void cargarEstanteriasDeSeccion();
  });
  actions.appendChild(viewButton);

  if (puedeConfigurarEstructura) {
    const stateButton = document.createElement("button");
    stateButton.className = entidadActiva(seccion) ? "btn compact danger" : "btn compact";
    stateButton.type = "button";
    stateButton.textContent = entidadActiva(seccion) ? "Desactivar sección" : "Reactivar sección";
    stateButton.addEventListener("click", () => {
      void cambiarEstadoSeccion(seccion, !entidadActiva(seccion));
    });
    actions.appendChild(stateButton);
  }

  item.append(main, actions);
  return item;
}

function renderEstanteriaItem(estanteria: EstanteriaResumenResponse): HTMLLIElement {
  const item = document.createElement("li");

  const main = document.createElement("div");
  main.className = "entity-main";
  const title = document.createElement("strong");
  title.textContent = `${estanteria.codigo} - ${estanteria.nombre}`;
  const description = document.createElement("span");
  description.textContent = estanteria.descripcion ?? "Sin descripción";
  main.append(title, description);

  const actions = document.createElement("div");
  actions.className = "entity-actions";
  actions.appendChild(badgeEstado(estanteria));

  if (puedeConfigurarEstructura) {
    const stateButton = document.createElement("button");
    stateButton.className = entidadActiva(estanteria) ? "btn compact danger" : "btn compact";
    stateButton.type = "button";
    stateButton.textContent = entidadActiva(estanteria) ? "Desactivar estantería" : "Reactivar estantería";
    stateButton.addEventListener("click", () => {
      void cambiarEstadoEstanteria(estanteria, !entidadActiva(estanteria));
    });
    actions.appendChild(stateButton);
  }

  item.append(main, actions);
  return item;
}

function productoLabel(producto: ProductoResumenResponse): string {
  const codigo = producto.codigoInterno ? `${producto.codigoInterno} - ` : "";
  return `${codigo}${producto.nombre ?? "Producto sin nombre"}`;
}

function renderSlots(): void {
  if (!slotsContainer) return;

  const count = Math.max(1, Math.min(24, Number(slotCountInput?.value) || 4));
  if (slotCountInput) slotCountInput.value = String(count);
  slotsContainer.innerHTML = "";

  for (let index = 1; index <= count; index += 1) {
    const row = document.createElement("div");
    row.className = "slot-row";
    row.dataset.slotIndex = String(index);

    const slotId = document.createElement("input");
    slotId.type = "text";
    slotId.value = `slot_${index}`;
    slotId.maxLength = 50;
    slotId.setAttribute("aria-label", `Slot ${index}`);
    slotId.dataset.field = "slotId";

    const orden = document.createElement("input");
    orden.type = "number";
    orden.value = String(index);
    orden.min = "1";
    orden.step = "1";
    orden.setAttribute("aria-label", `Orden ${index}`);
    orden.dataset.field = "orden";

    const producto = document.createElement("select");
    producto.dataset.field = "productoId";
    producto.setAttribute("aria-label", `Producto esperado ${index}`);
    if (productos.length === 0) {
      producto.appendChild(option("", "No hay productos activos"));
    } else {
      productos.forEach((item) => producto.appendChild(option(String(item.id), productoLabel(item))));
    }

    const cantidad = document.createElement("input");
    cantidad.type = "number";
    cantidad.value = "8";
    cantidad.min = "0";
    cantidad.step = "1";
    cantidad.setAttribute("aria-label", `Cantidad objetivo ${index}`);
    cantidad.dataset.field = "cantidadObjetivo";

    row.append(
      labeled("Slot", slotId),
      labeled("Orden", orden),
      labeled("Producto esperado", producto),
      labeled("Cantidad objetivo", cantidad)
    );
    slotsContainer.appendChild(row);
  }
}

function labeled(labelText: string, control: HTMLElement): HTMLElement {
  const wrap = document.createElement("label");
  wrap.className = "slot-field";
  const label = document.createElement("span");
  label.textContent = labelText;
  wrap.append(label, control);
  return wrap;
}

async function cargarSecciones(): Promise<void> {
  const query = mostrarSeccionesInactivasInput?.checked ? "?incluirInactivas=true" : "";
  secciones = await fetchJson<SeccionResponse[]>(`/api/empresas/${EMPRESA_CODIGO}/secciones${query}`);
  renderSecciones();
  await cargarEstanteriasDeSeccion();
}

async function cargarProductos(): Promise<void> {
  productos = await fetchJson<ProductoResumenResponse[]>("/api/productos");
  if (productosStatus) {
    productosStatus.textContent = productos.length === 0
      ? "No hay productos activos disponibles."
      : `${productos.length} productos activos`;
  }
  renderSlots();
}

async function cargarEstanteriasDeSeccion(): Promise<void> {
  const seccionId = seccionGestionId;
  const query = mostrarEstanteriasInactivasInput?.checked ? "?incluirInactivas=true" : "";
  estanteriasSeccion = seccionId && seccionId > 0
    ? await fetchJson<EstanteriaResumenResponse[]>(`/api/secciones/${seccionId}/estanterias${query}`)
    : [];
  renderEstanterias();
}

function buildSeccionPayload(): CrearSeccionPayload | string {
  const codigo = textValue(seccionCodigoInput);
  const nombre = textValue(seccionNombreInput);
  if (!codigo) return "El código de sección es obligatorio.";
  if (!nombre) return "El nombre de sección es obligatorio.";

  return {
    empresaCodigo: EMPRESA_CODIGO,
    codigo,
    nombre,
    descripcion: nullableText(seccionDescripcionInput)
  };
}

function buildEstanteriaPayload(): CrearEstanteriaPayload | string {
  const seccionId = Number(estanteriaSeccionSelect?.value);
  const codigo = textValue(estanteriaCodigoInput);
  const nombre = textValue(estanteriaNombreInput);

  if (!Number.isFinite(seccionId) || seccionId <= 0) return "Selecciona una sección válida.";
  if (!codigo) return "El código de estantería es obligatorio.";
  if (!nombre) return "El nombre de estantería es obligatorio.";
  if (productos.length === 0) return "No hay productos activos para asignar a los slots.";

  const rows = Array.from(slotsContainer?.querySelectorAll<HTMLElement>(".slot-row") ?? []);
  if (rows.length === 0) return "La estantería debe tener al menos un slot.";

  const slots = rows.map((row) => {
    const slotId = row.querySelector<HTMLInputElement>("[data-field='slotId']")?.value.trim() ?? "";
    const orden = Number(row.querySelector<HTMLInputElement>("[data-field='orden']")?.value);
    const productoId = Number(row.querySelector<HTMLSelectElement>("[data-field='productoId']")?.value);
    const cantidadObjetivo = Number(row.querySelector<HTMLInputElement>("[data-field='cantidadObjetivo']")?.value);
    return { slotId, orden, productoId, cantidadObjetivo };
  });

  if (slots.some((slot) => !slot.slotId)) return "Todos los slots deben tener identificador.";
  if (slots.some((slot) => !Number.isFinite(slot.orden) || slot.orden <= 0)) return "Todos los slots deben tener orden mayor que cero.";
  if (slots.some((slot) => !Number.isFinite(slot.productoId) || slot.productoId <= 0)) return "Todos los slots deben tener producto esperado.";
  if (slots.some((slot) => !Number.isFinite(slot.cantidadObjetivo) || slot.cantidadObjetivo < 0)) return "La cantidad objetivo no puede ser negativa.";

  return {
    seccionId,
    codigo,
    nombre,
    descripcion: nullableText(estanteriaDescripcionInput),
    slots
  };
}

async function crearSeccion(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  if (!puedeConfigurarEstructura) {
    setStatus(seccionStatus, structuralPermissionMessage(), "error");
    return;
  }
  if (savingSeccion) return;

  const payload = buildSeccionPayload();
  if (typeof payload === "string") {
    setStatus(seccionStatus, payload, "error");
    return;
  }

  savingSeccion = true;
  setStatus(seccionStatus, "Creando sección...", "info");
  try {
    await fetchJson<SeccionResponse>("/api/secciones", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    formSeccion?.reset();
    setStatus(seccionStatus, "Sección creada correctamente.", "ok");
    await cargarSecciones();
  } catch (err) {
    setStatus(seccionStatus, err instanceof Error ? err.message : "No se pudo crear la sección.", "error");
  } finally {
    savingSeccion = false;
  }
}

async function crearEstanteria(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  if (!puedeConfigurarEstructura) {
    setStatus(estanteriaStatus, structuralPermissionMessage(), "error");
    return;
  }
  if (savingEstanteria) return;

  const payload = buildEstanteriaPayload();
  if (typeof payload === "string") {
    setStatus(estanteriaStatus, payload, "error");
    return;
  }

  savingEstanteria = true;
  if (btnCrearEstanteria) btnCrearEstanteria.disabled = true;
  setStatus(estanteriaStatus, "Creando estantería...", "info");

  try {
    await fetchJson("/api/estanterias", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    formEstanteria?.reset();
    if (slotCountInput) slotCountInput.value = "4";
    renderSlots();
    renderSecciones();
    setStatus(estanteriaStatus, "Estantería creada correctamente. Ya puede colocarse en el editor de planos.", "ok");
    await cargarEstanteriasDeSeccion();
  } catch (err) {
    setStatus(estanteriaStatus, err instanceof Error ? err.message : "No se pudo crear la estantería.", "error");
  } finally {
    savingEstanteria = false;
    if (btnCrearEstanteria) btnCrearEstanteria.disabled = false;
  }
}

async function cambiarEstadoSeccion(seccion: SeccionResponse, activar: boolean): Promise<void> {
  if (!puedeConfigurarEstructura) {
    setStatus(seccionStatus, structuralPermissionMessage(), "error");
    return;
  }

  if (!activar) {
    const confirmed = window.confirm(
      "La sección dejará de estar disponible para nuevas configuraciones. Se conservará el histórico operativo."
    );
    if (!confirmed) return;
  }

  const endpoint = activar ? "reactivar" : "desactivar";
  setStatus(seccionStatus, activar ? "Reactivando sección..." : "Desactivando sección...", "info");

  try {
    const updated = await fetchJson<SeccionResponse>(`/api/secciones/${encodeURIComponent(String(seccion.id))}/${endpoint}`, {
      method: "PATCH"
    });
    seccionGestionId = updated.id;
    if (!activar && mostrarSeccionesInactivasInput) {
      mostrarSeccionesInactivasInput.checked = true;
    }
    if (!activar && mostrarEstanteriasInactivasInput) {
      mostrarEstanteriasInactivasInput.checked = true;
    }
    setStatus(
      seccionStatus,
      activar
        ? "Seccion reactivada. Ya esta disponible para nuevas configuraciones."
        : "Sección desactivada. Se conserva el histórico operativo.",
      "ok"
    );
    await cargarSecciones();
  } catch (err) {
    setStatus(seccionStatus, err instanceof Error ? err.message : "No se pudo cambiar el estado de la sección.", "error");
  }
}

async function cambiarEstadoEstanteria(estanteria: EstanteriaResumenResponse, activar: boolean): Promise<void> {
  if (!puedeConfigurarEstructura) {
    setStatus(estanteriaStatus, structuralPermissionMessage(), "error");
    return;
  }

  if (!activar) {
    const confirmed = window.confirm(
      "La estantería dejará de estar disponible para nuevas inspecciones y configuraciones. Se conservará el histórico operativo."
    );
    if (!confirmed) return;
  }

  const endpoint = activar ? "reactivar" : "desactivar";
  setStatus(estanteriaStatus, activar ? "Reactivando estantería..." : "Desactivando estantería...", "info");

  try {
    await fetchJson(`/api/estanterias/${encodeURIComponent(estanteria.codigo)}/${endpoint}`, {
      method: "PATCH"
    });
    if (!activar && mostrarEstanteriasInactivasInput) {
      mostrarEstanteriasInactivasInput.checked = true;
    }
    setStatus(
      estanteriaStatus,
      activar
        ? "Estanteria reactivada. Ya esta disponible para nuevas operaciones."
        : "Estantería desactivada. Se conserva el histórico operativo.",
      "ok"
    );
    await cargarEstanteriasDeSeccion();
  } catch (err) {
    setStatus(estanteriaStatus, err instanceof Error ? err.message : "No se pudo cambiar el estado de la estantería.", "error");
  }
}

function bindEvents(): void {
  formSeccion?.addEventListener("submit", (event) => {
    void crearSeccion(event);
  });
  formEstanteria?.addEventListener("submit", (event) => {
    void crearEstanteria(event);
  });
  estanteriaSeccionSelect?.addEventListener("change", () => {
    const selected = Number(estanteriaSeccionSelect.value);
    if (Number.isFinite(selected) && selected > 0) {
      seccionGestionId = selected;
      renderSecciones();
    }
    void cargarEstanteriasDeSeccion();
  });
  mostrarSeccionesInactivasInput?.addEventListener("change", () => {
    void cargarSecciones();
  });
  mostrarEstanteriasInactivasInput?.addEventListener("change", () => {
    void cargarEstanteriasDeSeccion();
  });
  slotCountInput?.addEventListener("change", renderSlots);
  slotCountInput?.addEventListener("input", renderSlots);
}

async function init(): Promise<void> {
  bindEvents();
  applyStructuralPermissions();
  try {
    await Promise.all([cargarSecciones(), cargarProductos()]);
    if (puedeConfigurarEstructura) {
      setStatus(seccionStatus, "Secciones cargadas.", "ok");
      setStatus(estanteriaStatus, "Configuración lista.", "ok");
    } else {
      applyStructuralPermissions();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo cargar la configuracion operativa.";
    setStatus(seccionStatus, message, "error");
    setStatus(estanteriaStatus, message, "error");
    renderSlots();
    applyStructuralPermissions();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  void init();
});
