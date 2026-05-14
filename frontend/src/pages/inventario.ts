import { authFetch } from "../lib/api";
import { requireAuth } from "../lib/auth-guard";

requireAuth();

type EmpresaResponse = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activa: boolean | null;
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
  productoUuid: string | null;
  codigoInterno: string | null;
  nombre: string | null;
  descripcion: string | null;
};

type ProveedorResumenResponse = {
  id: number;
  codigo: string | null;
  nombre: string | null;
  descripcion: string | null;
};

type TrabajadorResumenResponse = {
  id: number;
  nombre: string | null;
  apellidos: string | null;
  emailContacto: string | null;
  tipoTrabajador: string | null;
  responsablePrincipal: boolean | null;
};

type AsignacionActivaSlotResponse = {
  id: number;
  proveedor: ProveedorResumenResponse | null;
  claveProductoProveedor: string | null;
  stockDisponible: boolean | null;
  fechaColocacion: string | null;
  fechaCaducidad: string | null;
  fechaRetiradaProgramada: string | null;
  fechaRetiradaConfirmada: string | null;
  estadoAsignacion: string | null;
  observaciones: string | null;
};

type SlotConfiguradoResponse = {
  id: number;
  slotId: string | null;
  orden: number | null;
  productoEsperado: ProductoResumenResponse | null;
  cantidadObjetivo: number | null;
  asignacionActiva: AsignacionActivaSlotResponse | null;
};

type EstanteriaConfiguracionResponse = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activa: boolean | null;
  seccion: SeccionResponse | null;
  encargados: TrabajadorResumenResponse[];
  slots: SlotConfiguradoResponse[];
};

type ApiErrorResponse = {
  message?: string;
  error?: string;
  status?: number;
};

const CODIGO_EMPRESA_DEMO = "EMP-DEMO";

const seccionSelect = document.querySelector<HTMLSelectElement>("#f-seccion");
const estanteriaSelect = document.querySelector<HTMLSelectElement>("#f-estanteria");
const busquedaInput = document.querySelector<HTMLInputElement>("#f-busqueda");
const btnLimpiar = document.querySelector<HTMLButtonElement>("#btn-limpiar-inv");

const tbody = document.querySelector<HTMLTableSectionElement>("#tbody-inventario");
const detalleResumen = document.querySelector<HTMLUListElement>("#detalle-inv-resumen");
const detalleSlots = document.querySelector<HTMLUListElement>("#detalle-inv-ok");
const detalleAsignacion = document.querySelector<HTMLUListElement>("#detalle-inv-gaps");

let empresa: EmpresaResponse | null = null;
let secciones: SeccionResponse[] = [];
let estanterias: EstanteriaResumenResponse[] = [];
let configuracionActual: EstanteriaConfiguracionResponse | null = null;
let selectedSlotId: number | null = null;

function textoSeguro(value: string | number | boolean | null | undefined, fallback = "No disponible"): string {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function formatFecha(value: string | null | undefined): string {
  if (!value) return "Sin fecha";

  const fecha = new Date(`${value}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return value;

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short"
  }).format(fecha);
}

function formatStock(value: boolean | null | undefined): string {
  if (value === true) return "Disponible";
  if (value === false) return "No disponible";
  return "No informado";
}

function formatEncargado(encargado: TrabajadorResumenResponse): string {
  const nombre = [encargado.nombre, encargado.apellidos].filter(Boolean).join(" ");
  const principal = encargado.responsablePrincipal ? "principal" : "asignado";
  return `${textoSeguro(nombre, "Encargado sin nombre")} (${principal})`;
}

function productoNombre(slot: SlotConfiguradoResponse): string {
  return textoSeguro(slot.productoEsperado?.nombre, "Sin producto esperado");
}

function proveedorNombre(slot: SlotConfiguradoResponse): string {
  return textoSeguro(slot.asignacionActiva?.proveedor?.nombre, "Sin asignaci\u00f3n activa");
}

function claveProveedor(slot: SlotConfiguradoResponse): string {
  return textoSeguro(slot.asignacionActiva?.claveProductoProveedor, "Sin clave de proveedor");
}

function estadoAsignacion(slot: SlotConfiguradoResponse): string {
  return textoSeguro(slot.asignacionActiva?.estadoAsignacion, "Sin asignaci\u00f3n activa");
}

function fechasSlot(slot: SlotConfiguradoResponse): string {
  const asignacion = slot.asignacionActiva;
  if (!asignacion) return "Sin fechas de asignaci\u00f3n";

  return `Caduca: ${formatFecha(asignacion.fechaCaducidad)} / Retirada: ${formatFecha(asignacion.fechaRetiradaProgramada)}`;
}

function blobBusqueda(slot: SlotConfiguradoResponse): string {
  return [
    slot.slotId,
    slot.orden,
    slot.productoEsperado?.codigoInterno,
    slot.productoEsperado?.nombre,
    slot.asignacionActiva?.proveedor?.codigo,
    slot.asignacionActiva?.proveedor?.nombre,
    slot.asignacionActiva?.claveProductoProveedor,
    slot.asignacionActiva?.estadoAsignacion
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
  if (status === 404) return "No se encontraron datos operativos";
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

function setRowMessage(message: string): void {
  if (!tbody) return;

  tbody.innerHTML = "";
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = 8;
  td.textContent = message;
  tr.appendChild(td);
  tbody.appendChild(tr);
}

function clearList(list: HTMLUListElement | null): void {
  if (list) list.innerHTML = "";
}

function addListItem(list: HTMLUListElement | null, label: string, value: string): void {
  if (!list) return;

  const li = document.createElement("li");
  const strong = document.createElement("strong");
  strong.textContent = `${label}:`;
  li.append(strong, ` ${value}`);
  list.appendChild(li);
}

function setDetalleMessage(message: string): void {
  clearList(detalleResumen);
  clearList(detalleSlots);
  clearList(detalleAsignacion);
  addListItem(detalleResumen, "Estado", message);
}

function renderSecciones(): void {
  if (!seccionSelect) return;

  seccionSelect.innerHTML = "";

  if (secciones.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Sin secciones";
    seccionSelect.appendChild(option);
    return;
  }

  secciones.forEach((seccion) => {
    const option = document.createElement("option");
    option.value = String(seccion.id);
    option.textContent = `${seccion.codigo} - ${seccion.nombre}`;
    seccionSelect.appendChild(option);
  });
}

function renderEstanterias(): void {
  if (!estanteriaSelect) return;

  estanteriaSelect.innerHTML = "";

  if (estanterias.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Sin estanter\u00edas";
    estanteriaSelect.appendChild(option);
    return;
  }

  estanterias.forEach((estanteria) => {
    const option = document.createElement("option");
    option.value = estanteria.codigo;
    option.textContent = `${estanteria.codigo} - ${estanteria.nombre}`;
    estanteriaSelect.appendChild(option);
  });
}

function getSlotsFiltrados(): SlotConfiguradoResponse[] {
  const texto = busquedaInput?.value.trim().toLowerCase() ?? "";
  const slots = configuracionActual?.slots ?? [];

  if (!texto) return slots;

  return slots.filter((slot) => blobBusqueda(slot).includes(texto));
}

function renderTabla(): void {
  if (!tbody) return;

  const configuracion = configuracionActual;
  if (!configuracion) {
    setRowMessage("Selecciona una estanter\u00eda para ver su configuraci\u00f3n");
    return;
  }

  const slots = getSlotsFiltrados();
  if (configuracion.slots.length === 0) {
    setRowMessage("La estanter\u00eda seleccionada no tiene slots configurados");
    return;
  }

  if (slots.length === 0) {
    setRowMessage("No hay slots que coincidan con la b\u00fasqueda");
    return;
  }

  tbody.innerHTML = "";

  slots.forEach((slot) => {
    const tr = document.createElement("tr");
    if (slot.id === selectedSlotId) {
      tr.style.background = "#eef6ff";
    }

    const tdSeccion = document.createElement("td");
    tdSeccion.textContent = textoSeguro(configuracion.seccion?.nombre ?? configuracion.seccion?.codigo);

    const tdEstanteria = document.createElement("td");
    tdEstanteria.textContent = configuracion.codigo;

    const tdSlot = document.createElement("td");
    tdSlot.textContent = `${textoSeguro(slot.slotId, "Sin slot")} / orden ${textoSeguro(slot.orden, "sin orden")}`;

    const tdProducto = document.createElement("td");
    tdProducto.textContent = productoNombre(slot);

    const tdProveedor = document.createElement("td");
    tdProveedor.textContent = proveedorNombre(slot);

    const tdFechas = document.createElement("td");
    tdFechas.textContent = fechasSlot(slot);

    const tdEstado = document.createElement("td");
    const chip = document.createElement("span");
    chip.className = slot.asignacionActiva ? "badge-ok" : "badge-gap";
    chip.textContent = estadoAsignacion(slot);
    tdEstado.appendChild(chip);

    const tdAcciones = document.createElement("td");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn ghost";
    button.dataset.id = String(slot.id);
    button.textContent = "Ver";
    tdAcciones.appendChild(button);

    tr.append(tdSeccion, tdEstanteria, tdSlot, tdProducto, tdProveedor, tdFechas, tdEstado, tdAcciones);
    tbody.appendChild(tr);
  });
}

function renderDetalle(slotSeleccionado?: SlotConfiguradoResponse): void {
  const configuracion = configuracionActual;
  if (!configuracion) {
    setDetalleMessage("Sin configuraci\u00f3n cargada");
    return;
  }

  const slots = configuracion.slots;
  const conAsignacion = slots.filter((slot) => slot.asignacionActiva).length;

  clearList(detalleResumen);
  clearList(detalleSlots);
  clearList(detalleAsignacion);

  addListItem(detalleResumen, "Empresa", empresa ? `${empresa.codigo} - ${empresa.nombre}` : CODIGO_EMPRESA_DEMO);
  addListItem(detalleResumen, "Secci\u00f3n", textoSeguro(configuracion.seccion?.nombre ?? configuracion.seccion?.codigo));
  addListItem(detalleResumen, "Estanter\u00eda", `${configuracion.codigo} - ${configuracion.nombre}`);
  addListItem(detalleResumen, "Descripci\u00f3n", textoSeguro(configuracion.descripcion, "Sin descripci\u00f3n"));
  addListItem(detalleResumen, "Slots configurados", String(slots.length));
  addListItem(detalleResumen, "Slots con asignaci\u00f3n activa", String(conAsignacion));
  addListItem(detalleResumen, "Encargados", configuracion.encargados.length > 0
    ? configuracion.encargados.map(formatEncargado).join(", ")
    : "Sin encargados activos");

  if (slots.length === 0) {
    addListItem(detalleSlots, "Slots", "Sin slots configurados");
  } else {
    slots.forEach((slot) => {
      addListItem(
        detalleSlots,
        textoSeguro(slot.slotId, "Sin slot"),
        `${productoNombre(slot)} / objetivo ${textoSeguro(slot.cantidadObjetivo, "no indicado")}`
      );
    });
  }

  const slot = slotSeleccionado ?? slots[0] ?? null;
  selectedSlotId = slot?.id ?? null;

  if (!slot) {
    addListItem(detalleAsignacion, "Asignaci\u00f3n", "Sin slot seleccionado");
    return;
  }

  addListItem(detalleAsignacion, "Slot", `${textoSeguro(slot.slotId, "Sin slot")} / orden ${textoSeguro(slot.orden, "sin orden")}`);
  addListItem(detalleAsignacion, "Producto esperado", productoNombre(slot));
  addListItem(detalleAsignacion, "C\u00f3digo interno", textoSeguro(slot.productoEsperado?.codigoInterno));
  addListItem(detalleAsignacion, "Cantidad objetivo", textoSeguro(slot.cantidadObjetivo, "No indicada"));

  const asignacion = slot.asignacionActiva;
  if (!asignacion) {
    addListItem(detalleAsignacion, "Asignaci\u00f3n activa", "Sin asignaci\u00f3n activa");
    return;
  }

  addListItem(detalleAsignacion, "Estado", textoSeguro(asignacion.estadoAsignacion));
  addListItem(detalleAsignacion, "Proveedor", proveedorNombre(slot));
  addListItem(detalleAsignacion, "Clave proveedor", claveProveedor(slot));
  addListItem(detalleAsignacion, "Stock proveedor", formatStock(asignacion.stockDisponible));
  addListItem(detalleAsignacion, "Fecha colocaci\u00f3n", formatFecha(asignacion.fechaColocacion));
  addListItem(detalleAsignacion, "Fecha caducidad", formatFecha(asignacion.fechaCaducidad));
  addListItem(detalleAsignacion, "Retirada programada", formatFecha(asignacion.fechaRetiradaProgramada));
  addListItem(detalleAsignacion, "Retirada confirmada", formatFecha(asignacion.fechaRetiradaConfirmada));
  addListItem(detalleAsignacion, "Observaciones", textoSeguro(asignacion.observaciones, "Sin observaciones"));
}

async function cargarConfiguracion(codigoEstanteria: string): Promise<void> {
  if (!codigoEstanteria) {
    configuracionActual = null;
    selectedSlotId = null;
    setRowMessage("Selecciona una estanter\u00eda");
    setDetalleMessage("No hay estanter\u00eda seleccionada");
    return;
  }

  setRowMessage("Cargando configuraci\u00f3n de estanter\u00eda...");
  setDetalleMessage("Cargando detalle operativo...");

  configuracionActual = await fetchJson<EstanteriaConfiguracionResponse>(
    `/api/estanterias/${encodeURIComponent(codigoEstanteria)}/configuracion`
  );
  selectedSlotId = configuracionActual.slots[0]?.id ?? null;

  renderTabla();
  renderDetalle(configuracionActual.slots[0]);
}

async function cargarEstanteriasDeSeccion(seccionId: number): Promise<void> {
  setRowMessage("Cargando estanter\u00edas...");
  setDetalleMessage("Cargando estanter\u00edas de la secci\u00f3n...");

  estanterias = await fetchJson<EstanteriaResumenResponse[]>(`/api/secciones/${encodeURIComponent(String(seccionId))}/estanterias`);
  renderEstanterias();

  if (estanterias.length === 0) {
    configuracionActual = null;
    selectedSlotId = null;
    setRowMessage("La secci\u00f3n seleccionada no tiene estanter\u00edas activas");
    setDetalleMessage("Sin estanter\u00edas disponibles");
    return;
  }

  const preferida = estanterias.find((estanteria) => estanteria.codigo === "EST-001") ?? estanterias[0];
  if (estanteriaSelect && preferida) {
    estanteriaSelect.value = preferida.codigo;
  }
  await cargarConfiguracion(preferida?.codigo ?? "");
}

async function cargarInicial(): Promise<void> {
  setRowMessage("Cargando inventario operativo...");
  setDetalleMessage("Cargando empresa demo...");

  try {
    empresa = await fetchJson<EmpresaResponse>(`/api/empresas/${encodeURIComponent(CODIGO_EMPRESA_DEMO)}`);
    secciones = await fetchJson<SeccionResponse[]>(`/api/empresas/${encodeURIComponent(CODIGO_EMPRESA_DEMO)}/secciones`);
    renderSecciones();

    if (secciones.length === 0) {
      setRowMessage("La empresa demo no tiene secciones activas");
      setDetalleMessage("Sin secciones disponibles");
      return;
    }

    await cargarEstanteriasDeSeccion(secciones[0].id);
  } catch (err) {
    empresa = null;
    secciones = [];
    estanterias = [];
    configuracionActual = null;
    selectedSlotId = null;

    const message = err instanceof Error ? err.message : "No se pudo cargar el inventario operativo";
    setRowMessage(message);
    setDetalleMessage("Revisa que el backend est\u00e9 arrancado y que existan datos demo operativos");
  }
}

seccionSelect?.addEventListener("change", () => {
  const seccionId = Number(seccionSelect.value);
  if (!Number.isFinite(seccionId)) return;

  void cargarEstanteriasDeSeccion(seccionId).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : "No se pudieron cargar las estanter\u00edas";
    setRowMessage(message);
    setDetalleMessage("No se pudo cargar el detalle de la secci\u00f3n");
  });
});

estanteriaSelect?.addEventListener("change", () => {
  void cargarConfiguracion(estanteriaSelect.value).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : "No se pudo cargar la estanter\u00eda";
    setRowMessage(message);
    setDetalleMessage("No se pudo cargar la configuraci\u00f3n de la estanter\u00eda");
  });
});

busquedaInput?.addEventListener("input", () => {
  renderTabla();
});

btnLimpiar?.addEventListener("click", () => {
  if (busquedaInput) busquedaInput.value = "";
  renderTabla();
});

tbody?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const button = target.closest<HTMLButtonElement>("button[data-id]");
  if (!button) return;

  const id = Number(button.dataset.id);
  const slot = configuracionActual?.slots.find((item) => item.id === id);
  if (!slot) return;

  selectedSlotId = slot.id;
  renderDetalle(slot);
  renderTabla();
});

document.addEventListener("DOMContentLoaded", () => {
  void cargarInicial();
});
