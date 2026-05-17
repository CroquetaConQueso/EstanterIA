import { authFetch, isStructuralAdmin } from "../lib/api";
import { requireAdminPanelAccess } from "../lib/auth-guard";

requireAdminPanelAccess();

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
  activo: boolean | null;
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
  productoProveedorId: number | null;
  productoAsignado: ProductoResumenResponse | null;
  proveedor: ProveedorResumenResponse | null;
  claveProductoProveedor: string | null;
  stockDisponible: boolean | null;
  stockMensaje: string | null;
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
  fieldErrors?: Record<string, string>;
};

type ProductoCreadoResponse = {
  id: number;
  productoUuid?: string | null;
  codigoInterno: string;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean | null;
  proveedor?: ProveedorResumenResponse | null;
  stockDisponible?: boolean | null;
  stockMensaje?: string | null;
};

type ProductoProveedorResumenResponse = {
  id: number;
  producto: ProductoResumenResponse | null;
  proveedor: ProveedorResumenResponse | null;
  claveProductoProveedor: string | null;
  stockDisponible: boolean | null;
  stockMensaje: string | null;
};

type RevisionCaducidadesResponse = {
  asignacionesRevisadas: number;
  alertasCreadas: number;
  alertasExistentes: number;
  mensaje: string | null;
};

const CODIGO_EMPRESA_DEMO = "EMP-DEMO";

const seccionSelect = document.querySelector<HTMLSelectElement>("#f-seccion");
const estanteriaSelect = document.querySelector<HTMLSelectElement>("#f-estanteria");
const busquedaInput = document.querySelector<HTMLInputElement>("#f-busqueda");
const btnLimpiar = document.querySelector<HTMLButtonElement>("#btn-limpiar-inv");
const btnOpenProductDialog = document.querySelector<HTMLButtonElement>("#btn-open-product-dialog");
const btnReviewExpiry = document.querySelector<HTMLButtonElement>("#btn-review-expiry");
const inventoryReviewStatus = document.querySelector<HTMLElement>("#inventory-review-status");
const productDialog = document.querySelector<HTMLDialogElement>("#product-dialog");
const btnCloseProductDialog = document.querySelector<HTMLButtonElement>("#btn-close-product-dialog");
const productForm = document.querySelector<HTMLFormElement>("#product-form");
const productCodeInput = document.querySelector<HTMLInputElement>("#product-code");
const productNameInput = document.querySelector<HTMLInputElement>("#product-name");
const productDescriptionInput = document.querySelector<HTMLTextAreaElement>("#product-description");
const productLinkDemoProviderInput = document.querySelector<HTMLInputElement>("#product-link-demo-provider");
const productStockDemoLabel = document.querySelector<HTMLElement>("#product-stock-demo-label");
const productStockDemoHelp = document.querySelector<HTMLElement>("#product-stock-demo-help");
const productStockLabelText = document.querySelector<HTMLElement>("#product-stock-label-text");
const productStockSelect = document.querySelector<HTMLSelectElement>("#product-stock");
const productFormStatus = document.querySelector<HTMLElement>("#product-form-status");
const productDialogTitle = document.querySelector<HTMLElement>("#product-dialog-title");
const productSaveButton = document.querySelector<HTMLButtonElement>("#btn-save-product");
const productActions = document.querySelector<HTMLElement>("#product-actions");
const btnEditProduct = document.querySelector<HTMLButtonElement>("#btn-edit-product");
const btnDeactivateProduct = document.querySelector<HTMLButtonElement>("#btn-deactivate-product");
const btnReactivateProduct = document.querySelector<HTMLButtonElement>("#btn-reactivate-product");
const deactivateProductDialog = document.querySelector<HTMLDialogElement>("#deactivate-product-dialog");
const btnCancelDeactivateProduct = document.querySelector<HTMLButtonElement>("#btn-cancel-deactivate-product");
const btnConfirmDeactivateProduct = document.querySelector<HTMLButtonElement>("#btn-confirm-deactivate-product");
const inventoryActionStatus = document.querySelector<HTMLElement>("#inventory-action-status");
const assignmentActions = document.querySelector<HTMLElement>("#assignment-actions");
const btnEditAssignment = document.querySelector<HTMLButtonElement>("#btn-edit-assignment");
const btnRetireAssignment = document.querySelector<HTMLButtonElement>("#btn-retire-assignment");
const assignmentDialog = document.querySelector<HTMLDialogElement>("#assignment-dialog");
const assignmentForm = document.querySelector<HTMLFormElement>("#assignment-form");
const assignmentDialogTitle = document.querySelector<HTMLElement>("#assignment-dialog-title");
const assignmentDialogHelp = document.querySelector<HTMLElement>("#assignment-dialog-help");
const btnCloseAssignmentDialog = document.querySelector<HTMLButtonElement>("#btn-close-assignment-dialog");
const assignmentProductProviderSelect = document.querySelector<HTMLSelectElement>("#assignment-product-provider");
const assignmentPlacementDateInput = document.querySelector<HTMLInputElement>("#assignment-placement-date");
const assignmentExpiryDateInput = document.querySelector<HTMLInputElement>("#assignment-expiry-date");
const assignmentPlannedRemovalDateInput = document.querySelector<HTMLInputElement>("#assignment-planned-removal-date");
const assignmentFormStatus = document.querySelector<HTMLElement>("#assignment-form-status");
const btnSaveAssignment = document.querySelector<HTMLButtonElement>("#btn-save-assignment");

const tbody = document.querySelector<HTMLTableSectionElement>("#tbody-inventario");
const detalleResumen = document.querySelector<HTMLUListElement>("#detalle-inv-resumen");
const detalleSlots = document.querySelector<HTMLUListElement>("#detalle-inv-ok");
const detalleAsignacion = document.querySelector<HTMLUListElement>("#detalle-inv-gaps");

let empresa: EmpresaResponse | null = null;
let secciones: SeccionResponse[] = [];
let estanterias: EstanteriaResumenResponse[] = [];
let productoProveedorOpciones: ProductoProveedorResumenResponse[] = [];
let configuracionActual: EstanteriaConfiguracionResponse | null = null;
let selectedSlotId: number | null = null;
let productDialogMode: "create" | "edit" = "create";
const puedeGestionarProductos = isStructuralAdmin();

if (!puedeGestionarProductos && btnOpenProductDialog) {
  btnOpenProductDialog.hidden = true;
}

if (!puedeGestionarProductos && btnReviewExpiry) {
  btnReviewExpiry.hidden = true;
}

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

function todayIsoDate(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function formatStock(value: boolean | null | undefined): string {
  if (value === true) return "Stock disponible: Sí";
  if (value === false) return "Stock disponible: No · requiere pedido o reposición externa";
  return "Sin dato de stock";
}

function productoActivo(producto: ProductoResumenResponse | null | undefined): boolean {
  return producto?.activo !== false;
}

function badgeProductoActivo(producto: ProductoResumenResponse | null | undefined): string {
  return productoActivo(producto) ? "Activo" : "Inactivo";
}

function stockMensaje(slot: SlotConfiguradoResponse): string {
  return slot.asignacionActiva?.stockMensaje ?? formatStock(slot.asignacionActiva?.stockDisponible);
}

function claseStock(slot: SlotConfiguradoResponse): string {
  if (slot.asignacionActiva?.stockDisponible === true) return "badge-ok";
  if (slot.asignacionActiva?.stockDisponible === false) return "badge-gap";
  return "badge-neutral";
}

function formatEncargado(encargado: TrabajadorResumenResponse): string {
  const nombre = [encargado.nombre, encargado.apellidos].filter(Boolean).join(" ");
  const principal = encargado.responsablePrincipal ? "principal" : "asignado";
  return `${textoSeguro(nombre, "Encargado sin nombre")} (${principal})`;
}

function productoNombre(slot: SlotConfiguradoResponse): string {
  return textoSeguro(slot.productoEsperado?.nombre, "Sin producto esperado");
}

function productoAsignadoNombre(slot: SlotConfiguradoResponse): string {
  return textoSeguro(slot.asignacionActiva?.productoAsignado?.nombre, "Sin asignación activa");
}

function getSelectedSlot(): SlotConfiguradoResponse | null {
  const slots = configuracionActual?.slots ?? [];
  return slots.find((slot) => slot.id === selectedSlotId) ?? slots[0] ?? null;
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

function productoProveedorLabel(opcion: ProductoProveedorResumenResponse): string {
  const producto = opcion.producto;
  const proveedor = opcion.proveedor;
  const productoCodigo = producto?.codigoInterno ? `${producto.codigoInterno} - ` : "";
  const proveedorTexto = proveedor?.nombre ?? proveedor?.codigo ?? "Proveedor sin nombre";
  return `${productoCodigo}${producto?.nombre ?? "Producto sin nombre"} / ${proveedorTexto}`;
}

function productoProveedorDemoParaProducto(productoId: number | null | undefined): ProductoProveedorResumenResponse | null {
  if (!productoId) return null;
  return productoProveedorOpciones.find((opcion) => opcion.producto?.id === productoId) ?? null;
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
    slot.asignacionActiva?.productoAsignado?.codigoInterno,
    slot.asignacionActiva?.productoAsignado?.nombre,
    slot.asignacionActiva?.proveedor?.codigo,
    slot.asignacionActiva?.proveedor?.nombre,
    slot.asignacionActiva?.claveProductoProveedor,
    stockMensaje(slot),
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
  if (data?.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
    return Object.values(data.fieldErrors).join(" ");
  }
  if (data?.message) return data.message;
  if (status === 400) return "Revisa los datos del producto";
  if (status === 403) return "Solo un administrador puede gestionar productos";
  if (status === 404) return "No se encontraron datos operativos";
  if (status === 409) return "Ya existe un producto con ese codigo interno";
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

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await authFetch(url, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await parseErrorResponse(response);
    throw new Error(getBackendErrorMessage(errorData, response.status));
  }

  return response.json() as Promise<T>;
}

async function postEmptyJson<T>(url: string): Promise<T> {
  const response = await authFetch(url, {
    method: "POST",
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

async function putJson<T>(url: string, body: unknown): Promise<T> {
  const response = await authFetch(url, {
    method: "PUT",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await parseErrorResponse(response);
    throw new Error(getBackendErrorMessage(errorData, response.status));
  }

  return response.json() as Promise<T>;
}

async function patchJson<T>(url: string, body?: unknown): Promise<T> {
  const headers = new Headers();
  headers.set("Accept", "application/json");
  const init: RequestInit = {
    method: "PATCH",
    headers
  };

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    init.body = JSON.stringify(body);
  }

  const response = await authFetch(url, init);

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
  if (productActions) productActions.hidden = true;
  if (assignmentActions) assignmentActions.hidden = true;
  addListItem(detalleResumen, "Estado", message);
}

function setProductFormStatus(message = "", type: "info" | "success" | "error" = "info"): void {
  if (!productFormStatus) return;
  productFormStatus.textContent = message;
  productFormStatus.dataset.type = type;
}

function setInventoryActionStatus(message = "", type: "info" | "success" | "error" = "info"): void {
  if (!inventoryActionStatus) return;
  inventoryActionStatus.textContent = message;
  inventoryActionStatus.dataset.type = type;
}

function setInventoryReviewStatus(message = "", type: "info" | "success" | "error" = "info"): void {
  if (!inventoryReviewStatus) return;
  inventoryReviewStatus.textContent = message;
  inventoryReviewStatus.dataset.type = type;
}

function renderProductBadge(producto: ProductoResumenResponse | null | undefined): HTMLSpanElement {
  const badge = document.createElement("span");
  badge.className = productoActivo(producto) ? "badge-ok" : "badge-inactive";
  badge.textContent = badgeProductoActivo(producto);
  return badge;
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
    tr.dataset.id = String(slot.id);
    tr.tabIndex = 0;
    tr.setAttribute("role", "button");
    tr.setAttribute("aria-label", `Ver detalle del slot ${textoSeguro(slot.slotId, "sin identificador")}`);
    if (slot.id === selectedSlotId) tr.classList.add("is-selected");

    const tdSeccion = document.createElement("td");
    tdSeccion.textContent = textoSeguro(configuracion.seccion?.nombre ?? configuracion.seccion?.codigo);

    const tdEstanteria = document.createElement("td");
    tdEstanteria.textContent = configuracion.codigo;

    const tdSlot = document.createElement("td");
    tdSlot.textContent = `${textoSeguro(slot.slotId, "Sin slot")} / orden ${textoSeguro(slot.orden, "sin orden")}`;

    const tdProducto = document.createElement("td");
    const productoWrap = document.createElement("div");
    productoWrap.className = "product-cell";
    const productoTexto = document.createElement("span");
    productoTexto.textContent = productoNombre(slot);
    productoWrap.append(productoTexto, renderProductBadge(slot.productoEsperado));
    tdProducto.appendChild(productoWrap);

    const tdProveedor = document.createElement("td");
    tdProveedor.textContent = slot.asignacionActiva
      ? `${productoAsignadoNombre(slot)} / ${proveedorNombre(slot)}`
      : "Sin asignación activa";

    const tdStock = document.createElement("td");
    const stockChip = document.createElement("span");
    stockChip.className = claseStock(slot);
    stockChip.textContent = stockMensaje(slot);
    tdStock.appendChild(stockChip);

    const tdFechas = document.createElement("td");
    tdFechas.textContent = fechasSlot(slot);

    const tdEstado = document.createElement("td");
    const chip = document.createElement("span");
    chip.className = slot.asignacionActiva ? "badge-ok" : "badge-gap";
    chip.textContent = estadoAsignacion(slot);
    tdEstado.appendChild(chip);

    tr.append(tdSeccion, tdEstanteria, tdSlot, tdProducto, tdProveedor, tdStock, tdFechas, tdEstado);
    tbody.appendChild(tr);
  });
}

function renderProductActions(slot: SlotConfiguradoResponse | null): void {
  if (!productActions || !btnEditProduct || !btnDeactivateProduct || !btnReactivateProduct) return;

  const producto = slot?.productoEsperado ?? null;
  if (!puedeGestionarProductos || !producto?.id) {
    productActions.hidden = true;
    return;
  }

  productActions.hidden = false;
  btnEditProduct.hidden = false;
  btnDeactivateProduct.hidden = !productoActivo(producto);
  btnReactivateProduct.hidden = productoActivo(producto);
}

function renderAssignmentActions(slot: SlotConfiguradoResponse | null): void {
  if (!assignmentActions || !btnEditAssignment || !btnRetireAssignment) return;

  if (!puedeGestionarProductos || !slot?.id) {
    assignmentActions.hidden = true;
    return;
  }

  assignmentActions.hidden = false;
  btnEditAssignment.textContent = slot.asignacionActiva ? "Editar asignación activa" : "Crear asignación activa";
  btnRetireAssignment.hidden = !slot.asignacionActiva;
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
  }

  const slot = slotSeleccionado ?? slots[0] ?? null;
  selectedSlotId = slot?.id ?? null;

  if (!slot) {
    addListItem(detalleSlots, "Producto esperado", "Sin slot seleccionado");
    addListItem(detalleAsignacion, "Asignación activa", "Sin slot seleccionado");
    renderProductActions(null);
    renderAssignmentActions(null);
    return;
  }

  addListItem(detalleSlots, "Slot", `${textoSeguro(slot.slotId, "Sin slot")} / orden ${textoSeguro(slot.orden, "sin orden")}`);
  addListItem(detalleSlots, "Producto esperado", productoNombre(slot));
  addListItem(detalleSlots, "Código interno", textoSeguro(slot.productoEsperado?.codigoInterno));
  addListItem(detalleSlots, "Estado producto", badgeProductoActivo(slot.productoEsperado));
  addListItem(detalleSlots, "Descripción producto", textoSeguro(slot.productoEsperado?.descripcion, "Sin descripción"));
  addListItem(detalleSlots, "Cantidad objetivo", textoSeguro(slot.cantidadObjetivo, "No indicada"));
  renderProductActions(slot);
  renderAssignmentActions(slot);

  const asignacion = slot.asignacionActiva;
  if (!asignacion) {
    addListItem(detalleAsignacion, "Asignaci\u00f3n activa", "Sin asignaci\u00f3n activa");
    addListItem(detalleAsignacion, "Lectura visual", "Las inspecciones visuales no crean asignaciones automáticamente");
    return;
  }

  addListItem(detalleAsignacion, "Estado", textoSeguro(asignacion.estadoAsignacion));
  addListItem(detalleAsignacion, "Producto asignado", productoAsignadoNombre(slot));
  addListItem(detalleAsignacion, "Código asignado", textoSeguro(asignacion.productoAsignado?.codigoInterno));
  addListItem(detalleAsignacion, "Proveedor", proveedorNombre(slot));
  addListItem(detalleAsignacion, "Clave proveedor", claveProveedor(slot));
  addListItem(detalleAsignacion, "Stock disponible", asignacion.stockMensaje ?? formatStock(asignacion.stockDisponible));
  addListItem(detalleAsignacion, "Fecha colocaci\u00f3n", formatFecha(asignacion.fechaColocacion));
  addListItem(detalleAsignacion, "Fecha caducidad", formatFecha(asignacion.fechaCaducidad));
  addListItem(detalleAsignacion, "Retirada programada", formatFecha(asignacion.fechaRetiradaProgramada));
  addListItem(detalleAsignacion, "Retirada confirmada", formatFecha(asignacion.fechaRetiradaConfirmada));
  addListItem(detalleAsignacion, "Observaciones", textoSeguro(asignacion.observaciones, "Sin observaciones"));
}

function setAssignmentFormStatus(message = "", type: "info" | "success" | "error" = "info"): void {
  if (!assignmentFormStatus) return;
  assignmentFormStatus.textContent = message;
  assignmentFormStatus.dataset.type = type;
}

function renderProductoProveedorOptions(slot: SlotConfiguradoResponse): void {
  if (!assignmentProductProviderSelect) return;

  assignmentProductProviderSelect.innerHTML = "";
  const opciones = productoProveedorOpciones;

  if (opciones.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No hay proveedor/stock disponible para productos";
    assignmentProductProviderSelect.appendChild(option);
    return;
  }

  opciones.forEach((opcion) => {
    const option = document.createElement("option");
    option.value = String(opcion.id);
    option.textContent = productoProveedorLabel(opcion);
    assignmentProductProviderSelect.appendChild(option);
  });

  const actual = slot.asignacionActiva?.productoProveedorId;
  const esperado = slot.productoEsperado?.id;
  const defecto = actual
    ?? opciones.find((opcion) => opcion.producto?.id === esperado)?.id
    ?? opciones[0]?.id;

  if (defecto) assignmentProductProviderSelect.value = String(defecto);
}

function abrirDialogoAsignacion(): void {
  if (!puedeGestionarProductos) {
    setInventoryActionStatus("Solo un administrador puede gestionar asignaciones.", "error");
    return;
  }

  const slot = getSelectedSlot();
  if (!slot?.id) {
    setInventoryActionStatus("Selecciona un slot antes de gestionar la asignación.", "error");
    return;
  }

  const asignacion = slot.asignacionActiva;
  if (assignmentDialogTitle) {
    assignmentDialogTitle.textContent = asignacion ? "Editar asignación activa" : "Crear asignación activa";
  }
  if (assignmentDialogHelp) {
    const hayProveedorEsperado = productoProveedorOpciones.some((opcion) => opcion.producto?.id === slot.productoEsperado?.id);
    assignmentDialogHelp.textContent = hayProveedorEsperado
      ? `Producto esperado: ${productoNombre(slot)}. La asignación activa indica qué producto/proveedor está colocado ahora.`
      : `Producto esperado: ${productoNombre(slot)}. No hay proveedor/stock disponible para este producto; puedes seleccionar otra opción activa si corresponde.`;
  }

  renderProductoProveedorOptions(slot);
  if (assignmentPlacementDateInput) assignmentPlacementDateInput.value = asignacion?.fechaColocacion ?? "";
  if (assignmentExpiryDateInput) assignmentExpiryDateInput.value = asignacion?.fechaCaducidad ?? "";
  if (assignmentPlannedRemovalDateInput) {
    assignmentPlannedRemovalDateInput.value = asignacion?.fechaRetiradaProgramada ?? "";
  }
  setAssignmentFormStatus();
  assignmentDialog?.showModal();
}

function cerrarDialogoAsignacion(): void {
  assignmentDialog?.close();
}

async function guardarAsignacionDesdeFormulario(): Promise<void> {
  if (!puedeGestionarProductos) {
    setAssignmentFormStatus("Solo un administrador puede gestionar asignaciones.", "error");
    return;
  }

  const slot = getSelectedSlot();
  if (!slot?.id) {
    setAssignmentFormStatus("Selecciona un slot antes de guardar.", "error");
    return;
  }

  const productoProveedorId = Number(assignmentProductProviderSelect?.value);
  if (!Number.isFinite(productoProveedorId) || productoProveedorId <= 0) {
    setAssignmentFormStatus("Selecciona un producto/proveedor disponible.", "error");
    return;
  }

  const fechaColocacion = assignmentPlacementDateInput?.value || null;
  const fechaCaducidad = assignmentExpiryDateInput?.value || null;
  const fechaRetiradaProgramada = assignmentPlannedRemovalDateInput?.value || null;
  if (fechaCaducidad && fechaCaducidad < todayIsoDate()) {
    setAssignmentFormStatus("No se puede asignar un producto ya caducado a una estantería.", "error");
    return;
  }

  setAssignmentFormStatus("Guardando asignación activa...", "info");
  if (btnSaveAssignment) btnSaveAssignment.disabled = true;

  try {
    await putJson<SlotConfiguradoResponse>(`/api/slots/${encodeURIComponent(String(slot.id))}/asignacion-activa`, {
      productoProveedorId,
      fechaColocacion,
      fechaCaducidad,
      fechaRetiradaProgramada
    });
    await refrescarConfiguracionManteniendoSlot(slot.id);
    setInventoryActionStatus("Asignación activa guardada correctamente.", "success");
    cerrarDialogoAsignacion();
  } finally {
    if (btnSaveAssignment) btnSaveAssignment.disabled = false;
  }
}

async function retirarAsignacionSeleccionada(): Promise<void> {
  if (!puedeGestionarProductos) {
    setInventoryActionStatus("Solo un administrador puede retirar asignaciones.", "error");
    return;
  }

  const slot = getSelectedSlot();
  if (!slot?.id || !slot.asignacionActiva) {
    setInventoryActionStatus("El slot seleccionado no tiene asignación activa.", "error");
    return;
  }

  const confirmed = window.confirm("La asignación activa se marcará como retirada y se conservará el histórico.");
  if (!confirmed) return;

  await patchJson<SlotConfiguradoResponse>(`/api/slots/${encodeURIComponent(String(slot.id))}/asignacion-activa/retirar`);
  await refrescarConfiguracionManteniendoSlot(slot.id);
  setInventoryActionStatus("Asignación retirada. Se conserva el histórico operativo.", "success");
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

async function cargarOpcionesProductoProveedor(): Promise<void> {
  productoProveedorOpciones = await fetchJson<ProductoProveedorResumenResponse[]>("/api/productos-proveedor/activos");
}

async function refrescarConfiguracionManteniendoSeleccion(productoId?: number): Promise<void> {
  const codigoEstanteria = estanteriaSelect?.value ?? "";
  if (!codigoEstanteria) return;

  const slotIdAnterior = selectedSlotId;
  configuracionActual = await fetchJson<EstanteriaConfiguracionResponse>(
    `/api/estanterias/${encodeURIComponent(codigoEstanteria)}/configuracion`
  );

  const slotSeleccionado = configuracionActual.slots.find((slot) => productoId && slot.productoEsperado?.id === productoId)
    ?? configuracionActual.slots.find((slot) => slot.id === slotIdAnterior)
    ?? configuracionActual.slots[0]
    ?? null;
  selectedSlotId = slotSeleccionado?.id ?? null;
  renderTabla();
  renderDetalle(slotSeleccionado ?? undefined);
}

async function refrescarConfiguracionManteniendoSlot(slotId: number): Promise<void> {
  const codigoEstanteria = estanteriaSelect?.value ?? "";
  if (!codigoEstanteria) return;

  configuracionActual = await fetchJson<EstanteriaConfiguracionResponse>(
    `/api/estanterias/${encodeURIComponent(codigoEstanteria)}/configuracion`
  );

  const slotSeleccionado = configuracionActual.slots.find((slot) => slot.id === slotId)
    ?? configuracionActual.slots[0]
    ?? null;
  selectedSlotId = slotSeleccionado?.id ?? null;
  renderTabla();
  renderDetalle(slotSeleccionado ?? undefined);
}

function abrirDialogoProducto(): void {
  if (!puedeGestionarProductos) {
    setDetalleMessage("Solo un administrador puede crear productos");
    return;
  }
  productDialogMode = "create";
  productForm?.reset();
  if (productDialogTitle) productDialogTitle.textContent = "Nuevo producto";
  if (productSaveButton) productSaveButton.textContent = "Crear producto";
  if (productCodeInput) productCodeInput.readOnly = false;
  if (productLinkDemoProviderInput) productLinkDemoProviderInput.disabled = false;
  if (productLinkDemoProviderInput) productLinkDemoProviderInput.checked = true;
  if (productStockDemoLabel) productStockDemoLabel.textContent = "Registrar stock demo para este producto";
  if (productStockDemoHelp) {
    productStockDemoHelp.textContent = "Permite mostrar si el producto tiene stock disponible en Inventario, Alertas y Tareas. Si no se activa, el producto puede aparecer como \"Sin dato de stock\".";
  }
  if (productStockLabelText) productStockLabelText.textContent = "Stock disponible inicial";
  if (productStockSelect) productStockSelect.value = "true";
  setProductFormStatus();
  productDialog?.showModal();
}

function abrirDialogoEditarProducto(): void {
  if (!puedeGestionarProductos) {
    setDetalleMessage("Solo un administrador puede editar productos");
    return;
  }

  const slot = getSelectedSlot();
  const producto = slot?.productoEsperado;
  if (!producto?.id) {
    setDetalleMessage("Selecciona un slot con producto esperado antes de editar");
    return;
  }

  productDialogMode = "edit";
  if (productDialogTitle) productDialogTitle.textContent = "Editar producto";
  if (productSaveButton) productSaveButton.textContent = "Guardar cambios";
  if (productCodeInput) {
    productCodeInput.value = producto.codigoInterno ?? "";
    productCodeInput.readOnly = true;
  }
  if (productNameInput) productNameInput.value = producto.nombre ?? "";
  if (productDescriptionInput) productDescriptionInput.value = producto.descripcion ?? "";
  const productoProveedorDemo = productoProveedorDemoParaProducto(producto.id);
  if (productLinkDemoProviderInput) {
    productLinkDemoProviderInput.checked = Boolean(productoProveedorDemo);
    productLinkDemoProviderInput.disabled = Boolean(productoProveedorDemo);
  }
  if (productStockDemoLabel) {
    productStockDemoLabel.textContent = productoProveedorDemo
      ? "Stock demo registrado"
      : "Registrar stock demo para este producto";
  }
  if (productStockDemoHelp) {
    productStockDemoHelp.textContent = productoProveedorDemo
      ? "Permite actualizar si este producto tiene stock disponible para asignaciones activas."
      : "Permite usar este producto en asignaciones activas y mostrar disponibilidad de stock.";
  }
  if (productStockLabelText) {
    productStockLabelText.textContent = productoProveedorDemo
      ? "Stock disponible"
      : "Stock disponible inicial";
  }
  if (productStockSelect) {
    const stock = productoProveedorDemo?.stockDisponible;
    productStockSelect.value = stock === false ? "false" : "true";
  }
  setProductFormStatus();
  productDialog?.showModal();
}

function cerrarDialogoProducto(): void {
  productDialog?.close();
}

async function crearProductoDesdeFormulario(): Promise<void> {
  if (!puedeGestionarProductos) {
    setProductFormStatus("Solo un administrador puede crear productos", "error");
    return;
  }

  const codigoInterno = productCodeInput?.value.trim() ?? "";
  const nombre = productNameInput?.value.trim() ?? "";
  const descripcion = productDescriptionInput?.value.trim() ?? "";

  if (!codigoInterno || !nombre) {
    setProductFormStatus("Código interno y nombre son obligatorios.", "error");
    return;
  }

  setProductFormStatus("Creando producto...", "info");

  const producto = await postJson<ProductoCreadoResponse>("/api/productos", {
    codigoInterno,
    nombre,
    descripcion: descripcion || null,
    vincularProveedorDemo: productLinkDemoProviderInput?.checked ?? true,
    stockDisponible: productStockSelect?.value !== "false"
  });

  const stock = producto.stockMensaje ?? "Producto sin proveedor demo vinculado";
  setProductFormStatus(`${producto.codigoInterno} creado. ${stock}. Ya puede usarse en el editor.`, "success");

  const codigoEstanteria = estanteriaSelect?.value ?? "";
  if (codigoEstanteria) {
    await cargarOpcionesProductoProveedor();
    await cargarConfiguracion(codigoEstanteria);
  }

  window.setTimeout(() => {
    cerrarDialogoProducto();
  }, 900);
}

async function editarProductoDesdeFormulario(): Promise<void> {
  if (!puedeGestionarProductos) {
    setProductFormStatus("Solo un administrador puede editar productos", "error");
    return;
  }

  const slot = getSelectedSlot();
  const productoActual = slot?.productoEsperado;
  if (!productoActual?.id) {
    setProductFormStatus("Selecciona un producto antes de editar.", "error");
    return;
  }

  const nombre = productNameInput?.value.trim() ?? "";
  const descripcion = productDescriptionInput?.value.trim() ?? "";
  if (!nombre) {
    setProductFormStatus("El nombre es obligatorio.", "error");
    return;
  }

  setProductFormStatus("Guardando producto...", "info");
  const teniaStockDemo = Boolean(productoProveedorDemoParaProducto(productoActual.id));

  const producto = await patchJson<ProductoCreadoResponse>(`/api/productos/${encodeURIComponent(String(productoActual.id))}`, {
    nombre,
    descripcion: descripcion || null,
    registrarStockDemo: productLinkDemoProviderInput?.checked ?? false,
    stockDisponible: productStockSelect?.value !== "false"
  });

  const registroStockDemo = !teniaStockDemo && Boolean(producto.proveedor);
  setProductFormStatus(
    registroStockDemo
      ? "Stock demo registrado. El producto ya puede usarse en asignaciones activas."
      : `${producto.codigoInterno} actualizado correctamente.`,
    "success"
  );
  await cargarOpcionesProductoProveedor();
  await refrescarConfiguracionManteniendoSeleccion(productoActual.id);

  window.setTimeout(() => {
    cerrarDialogoProducto();
  }, 700);
}

async function guardarProductoDesdeFormulario(): Promise<void> {
  if (productDialogMode === "edit") {
    await editarProductoDesdeFormulario();
    return;
  }

  await crearProductoDesdeFormulario();
}

function abrirConfirmacionDesactivarProducto(): void {
  if (!puedeGestionarProductos) {
    setInventoryActionStatus("Solo un administrador puede desactivar productos.", "error");
    return;
  }

  const producto = getSelectedSlot()?.productoEsperado;
  if (!producto?.id) {
    setInventoryActionStatus("Selecciona un producto antes de desactivarlo.", "error");
    return;
  }

  deactivateProductDialog?.showModal();
}

async function desactivarProductoSeleccionado(): Promise<void> {
  const producto = getSelectedSlot()?.productoEsperado;
  if (!producto?.id) {
    setInventoryActionStatus("Selecciona un producto antes de desactivarlo.", "error");
    return;
  }

  btnConfirmDeactivateProduct?.setAttribute("disabled", "");
  try {
    await patchJson<ProductoCreadoResponse>(`/api/productos/${encodeURIComponent(String(producto.id))}/desactivar`);
    deactivateProductDialog?.close();
    await refrescarConfiguracionManteniendoSeleccion(producto.id);
    setInventoryActionStatus("Producto desactivado. Se conserva por trazabilidad.", "success");
  } finally {
    btnConfirmDeactivateProduct?.removeAttribute("disabled");
  }
}

async function reactivarProductoSeleccionado(): Promise<void> {
  const producto = getSelectedSlot()?.productoEsperado;
  if (!producto?.id) {
    setInventoryActionStatus("Selecciona un producto antes de reactivarlo.", "error");
    return;
  }

  await patchJson<ProductoCreadoResponse>(`/api/productos/${encodeURIComponent(String(producto.id))}/reactivar`);
  await refrescarConfiguracionManteniendoSeleccion(producto.id);
  setInventoryActionStatus("Producto reactivado. Ya puede usarse en nuevas configuraciones.", "success");
}

async function revisarCaducidadesInventario(): Promise<void> {
  if (!puedeGestionarProductos) {
    setInventoryReviewStatus("Solo un administrador puede revisar caducidades.", "error");
    return;
  }

  btnReviewExpiry?.setAttribute("disabled", "");
  setInventoryReviewStatus("Revisando caducidades y retiradas programadas...", "info");
  try {
    const response = await postEmptyJson<RevisionCaducidadesResponse>("/api/alertas/revisar-caducidades");
    setInventoryReviewStatus(
      `Revision completada: ${response.alertasCreadas} alertas creadas, ${response.alertasExistentes} ya existentes. Asignaciones revisadas: ${response.asignacionesRevisadas}.`,
      "success"
    );
  } finally {
    btnReviewExpiry?.removeAttribute("disabled");
  }
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
    await cargarOpcionesProductoProveedor();
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

btnOpenProductDialog?.addEventListener("click", abrirDialogoProducto);
btnReviewExpiry?.addEventListener("click", () => {
  void revisarCaducidadesInventario().catch((err: unknown) => {
    setInventoryReviewStatus(err instanceof Error ? err.message : "No se pudo revisar caducidades.", "error");
    btnReviewExpiry?.removeAttribute("disabled");
  });
});
btnCloseProductDialog?.addEventListener("click", cerrarDialogoProducto);
productForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  void guardarProductoDesdeFormulario().catch((err: unknown) => {
    setProductFormStatus(err instanceof Error ? err.message : "No se pudo guardar el producto", "error");
  });
});
btnEditProduct?.addEventListener("click", abrirDialogoEditarProducto);
btnDeactivateProduct?.addEventListener("click", abrirConfirmacionDesactivarProducto);
btnReactivateProduct?.addEventListener("click", () => {
  void reactivarProductoSeleccionado().catch((err: unknown) => {
    setInventoryActionStatus(err instanceof Error ? err.message : "No se pudo reactivar el producto", "error");
  });
});
btnCancelDeactivateProduct?.addEventListener("click", () => deactivateProductDialog?.close());
btnConfirmDeactivateProduct?.addEventListener("click", () => {
  void desactivarProductoSeleccionado().catch((err: unknown) => {
    deactivateProductDialog?.close();
    setInventoryActionStatus(err instanceof Error ? err.message : "No se pudo desactivar el producto", "error");
    btnConfirmDeactivateProduct?.removeAttribute("disabled");
  });
});
btnEditAssignment?.addEventListener("click", abrirDialogoAsignacion);
btnRetireAssignment?.addEventListener("click", () => {
  void retirarAsignacionSeleccionada().catch((err: unknown) => {
    setInventoryActionStatus(err instanceof Error ? err.message : "No se pudo retirar la asignación.", "error");
  });
});
btnCloseAssignmentDialog?.addEventListener("click", cerrarDialogoAsignacion);
assignmentForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  void guardarAsignacionDesdeFormulario().catch((err: unknown) => {
    setAssignmentFormStatus(err instanceof Error ? err.message : "No se pudo guardar la asignación.", "error");
    if (btnSaveAssignment) btnSaveAssignment.disabled = false;
  });
});

tbody?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const row = target.closest<HTMLTableRowElement>("tr[data-id]");
  const id = Number(row?.dataset.id);
  const slot = configuracionActual?.slots.find((item) => item.id === id);
  if (!slot) return;

  selectedSlotId = slot.id;
  setInventoryActionStatus();
  renderDetalle(slot);
  renderTabla();
});

tbody?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const row = target.closest<HTMLTableRowElement>("tr[data-id]");
  const id = Number(row?.dataset.id);
  const slot = configuracionActual?.slots.find((item) => item.id === id);
  if (!slot) return;

  event.preventDefault();
  selectedSlotId = slot.id;
  setInventoryActionStatus();
  renderDetalle(slot);
  renderTabla();
});

document.addEventListener("DOMContentLoaded", () => {
  void cargarInicial();
});
