import { authFetch, isStructuralAdmin } from "../lib/api";
import { requireAdminPanelAccess } from "../lib/auth-guard";
import { imageFallbackText, normalizeImageUrl } from "../lib/image-paths";

requireAdminPanelAccess();

type TipoAlerta =
  | "HUECO_VACIO"
  | "ANOMALIA_VISUAL"
  | "REVISION_MANUAL"
  | "PRODUCTO_PROXIMO_A_CADUCAR"
  | "PRESENCIA_TRAS_RETIRADA_PROGRAMADA"
  | string;

type PrioridadAlerta = "BAJA" | "MEDIA" | "ALTA" | "CRITICA" | string;
type EstadoAlerta = "ABIERTA" | "RESUELTA" | "DESCARTADA" | string;

type ProductoResumenResponse = {
  id: number;
  productoUuid?: string | null;
  codigoInterno?: string | null;
  nombre?: string | null;
  descripcion?: string | null;
};

type ProveedorResumenResponse = {
  id: number;
  codigo?: string | null;
  nombre?: string | null;
  descripcion?: string | null;
};

type SeccionResponse = {
  id: number;
  codigo?: string | null;
  nombre?: string | null;
  descripcion?: string | null;
  activa?: boolean | null;
};

type EstanteriaResumenResponse = {
  id: number;
  codigo?: string | null;
  nombre?: string | null;
  descripcion?: string | null;
  activa?: boolean | null;
};

type AlertaSlotResponse = {
  id: number;
  slotId?: string | null;
  orden?: number | null;
  productoEsperado?: ProductoResumenResponse | null;
};

type AlertaAsignacionResponse = {
  id: number;
  producto?: ProductoResumenResponse | null;
  proveedor?: ProveedorResumenResponse | null;
  claveProductoProveedor?: string | null;
  stockDisponible?: boolean | null;
  stockMensaje?: string | null;
  fechaCaducidad?: string | null;
  fechaRetiradaProgramada?: string | null;
  estadoAsignacion?: string | null;
};

type AlertaResponse = {
  id: number;
  tipo: TipoAlerta;
  prioridad: PrioridadAlerta;
  estado: EstadoAlerta;
  mensaje: string;
  createdAt: string;
  resueltaAt?: string | null;
  inspeccionId?: number | null;
  imagenPath?: string | null;
  imagePath?: string | null;
  imageUrl?: string | null;
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
};

type ApiErrorResponse = {
  message?: string;
  error?: string;
  status?: number;
};

const API_ALERTAS_ABIERTAS = "/api/alertas/abiertas";

const tbody = document.querySelector<HTMLTableSectionElement>("#tbody-alertas");
const filtroGravedad = document.querySelector<HTMLSelectElement>("#filtro-gravedad");
const filtroEstado = document.querySelector<HTMLSelectElement>("#filtro-estado");
const filtroTexto = document.querySelector<HTMLInputElement>("#filtro-texto");
const btnLimpiar = document.querySelector<HTMLButtonElement>("#btn-limpiar");

const detalle = document.querySelector<HTMLUListElement>("#detalle-alerta");
const detallePanel = document.querySelector<HTMLElement>("#detalle-alerta-panel");
const preview = document.querySelector<HTMLElement>("#alerta-preview");
const btnResolver = document.querySelector<HTMLButtonElement>("#btn-resolver");
const btnDescartar = document.querySelector<HTMLButtonElement>("#btn-descartar");
const alertaActionStatus = document.querySelector<HTMLElement>("#alerta-action-status");

const metricCritical = document.querySelector<HTMLElement>("#metric-critical");
const metricPending = document.querySelector<HTMLElement>("#metric-pending");
const metricAssigned = document.querySelector<HTMLElement>("#metric-assigned");

let alertas: AlertaResponse[] = [];
let selectedId: number | null = null;
const puedeCerrarAlertas = isStructuralAdmin();

const tipoLabels: Record<string, string> = {
  HUECO_VACIO: "Hueco vacio",
  ANOMALIA_VISUAL: "Anomalia visual",
  REVISION_MANUAL: "Revision manual",
  PRODUCTO_PROXIMO_A_CADUCAR: "Producto proximo a caducar",
  PRESENCIA_TRAS_RETIRADA_PROGRAMADA: "Presencia tras retirada programada"
};

const estadoLabels: Record<string, string> = {
  ABIERTA: "Abierta",
  RESUELTA: "Resuelta",
  DESCARTADA: "Descartada"
};

function textoSeguro(value: string | number | null | undefined, fallback = "No disponible"): string {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function etiquetaTipo(tipo: TipoAlerta): string {
  return tipoLabels[tipo] ?? tipo.replaceAll("_", " ").toLowerCase();
}

function etiquetaEstado(estado: EstadoAlerta): string {
  return estadoLabels[estado] ?? estado.replaceAll("_", " ").toLowerCase();
}

function clasePrioridad(prioridad: PrioridadAlerta): string {
  if (prioridad === "CRITICA") return "critica";
  if (prioridad === "ALTA") return "alta";
  if (prioridad === "MEDIA") return "media";
  return "pendiente";
}

function claseEstado(estado: EstadoAlerta): string {
  if (estado === "ABIERTA") return "pendiente";
  if (estado === "RESUELTA") return "asignada";
  if (estado === "DESCARTADA") return "descartada";
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

function getProducto(alerta: AlertaResponse): string {
  return textoSeguro(
    alerta.productoNombre ?? alerta.asignacion?.producto?.nombre ?? alerta.slot?.productoEsperado?.nombre,
    "Sin producto asociado"
  );
}

function getProveedor(alerta: AlertaResponse): string {
  return textoSeguro(alerta.proveedorNombre ?? alerta.asignacion?.proveedor?.nombre, "Sin asignacion asociada");
}

function getStockMensaje(alerta: AlertaResponse): string {
  if (alerta.stockMensaje) return alerta.stockMensaje;
  if (alerta.asignacion?.stockMensaje) return alerta.asignacion.stockMensaje;
  if (alerta.stockDisponible === true || alerta.asignacion?.stockDisponible === true) return "Stock disponible: Sí";
  if (alerta.stockDisponible === false || alerta.asignacion?.stockDisponible === false) {
    return "Stock disponible: No · requiere pedido o reposición externa";
  }
  return "Sin dato de stock";
}

function getSeccion(alerta: AlertaResponse): string {
  const seccion = alerta.seccion;
  if (!seccion) return "No disponible";
  return textoSeguro(seccion.nombre ?? seccion.codigo);
}

function getEstanteria(alerta: AlertaResponse): string {
  const estanteria = alerta.estanteria;
  if (!estanteria) return "No disponible";
  return textoSeguro(estanteria.codigo ?? estanteria.nombre);
}

function getSlot(alerta: AlertaResponse): string {
  if (!alerta.slot) return "Sin slot vinculado";
  const orden = alerta.slot.orden ? `Orden ${alerta.slot.orden}` : "Sin orden";
  return `${textoSeguro(alerta.slot.slotId, "Sin slot vinculado")} · ${orden}`;
}

function getDetectadoEsperado(alerta: AlertaResponse): string {
  const slot = alerta.slot?.slotId ?? "Sin slot";
  return `${etiquetaTipo(alerta.tipo)} · ${slot}`;
}

function getAlertaImagePath(alerta: AlertaResponse): string | null {
  return alerta.imageUrl ?? alerta.imagenPath ?? alerta.imagePath ?? null;
}

function getBlobBusqueda(alerta: AlertaResponse): string {
  return [
    alerta.id,
    alerta.tipo,
    etiquetaTipo(alerta.tipo),
    alerta.prioridad,
    alerta.estado,
    alerta.mensaje,
    getSeccion(alerta),
    getEstanteria(alerta),
    getSlot(alerta),
    getProducto(alerta),
    getProveedor(alerta),
    alerta.asignacion?.claveProductoProveedor
  ].join(" ").toLowerCase();
}

function setRowMessage(message: string): void {
  if (!tbody) return;

  tbody.innerHTML = "";
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = 7;
  td.textContent = message;
  tr.appendChild(td);
  tbody.appendChild(tr);
}

function setDetalleMessage(message: string): void {
  if (!detalle) return;

  detalle.innerHTML = "";
  const li = document.createElement("li");
  li.textContent = message;
  detalle.appendChild(li);

  if (preview) {
    preview.innerHTML = `<span>${message}</span>`;
  }
}

function setActionStatus(message = "", type: "success" | "error" | "info" = "info"): void {
  if (!alertaActionStatus) return;
  alertaActionStatus.textContent = message;
  alertaActionStatus.dataset.type = type;
}

function updateMetrics(): void {
  if (metricCritical) {
    metricCritical.textContent = String(alertas.filter((alerta) => alerta.prioridad === "CRITICA").length);
  }

  if (metricPending) {
    metricPending.textContent = String(alertas.filter((alerta) => alerta.estado === "ABIERTA").length);
  }

  if (metricAssigned) {
    metricAssigned.textContent = "0";
  }
}

function getFiltered(): AlertaResponse[] {
  const prioridad = filtroGravedad?.value ?? "";
  const estado = filtroEstado?.value ?? "";
  const texto = filtroTexto?.value.trim().toLowerCase() ?? "";

  return alertas.filter((alerta) => {
    const okPrioridad = !prioridad || alerta.prioridad === prioridad;
    const okEstado = !estado || alerta.estado === estado;
    const okTexto = !texto || getBlobBusqueda(alerta).includes(texto);
    return okPrioridad && okEstado && okTexto;
  });
}

function addDetailItem(label: string, value: string): void {
  if (!detalle) return;

  const li = document.createElement("li");
  const strong = document.createElement("strong");
  strong.textContent = `${label}:`;
  li.append(strong, ` ${value}`);
  detalle.appendChild(li);
}

function renderAlertPreview(alerta: AlertaResponse): void {
  if (!preview) return;

  const imagePath = getAlertaImagePath(alerta);
  const imageUrl = normalizeImageUrl(imagePath);
  preview.innerHTML = "";
  preview.classList.toggle("has-image", Boolean(imageUrl));

  if (!imageUrl) {
    const placeholder = document.createElement("div");
    placeholder.className = "image-placeholder";
    const title = document.createElement("strong");
    title.textContent = etiquetaTipo(alerta.tipo);
    const context = document.createElement("span");
    context.textContent = `${getEstanteria(alerta)} · ${getSlot(alerta)}`;
    const path = document.createElement("small");
    path.textContent = imageFallbackText(imagePath);
    placeholder.append(title, context, path);
    preview.appendChild(placeholder);
    return;
  }

  const img = document.createElement("img");
  img.className = "alert-image";
  img.src = imageUrl;
  img.alt = `Imagen asociada a alerta ${alerta.id}`;
  img.addEventListener("error", () => {
    preview.classList.remove("has-image");
    preview.innerHTML = "";
    const wrapper = document.createElement("div");
    wrapper.className = "image-error";
    const title = document.createElement("strong");
    title.textContent = "Imagen no disponible";
    const path = document.createElement("small");
    path.textContent = imageFallbackText(imagePath);
    wrapper.append(title, path);
    preview.appendChild(wrapper);
  });
  preview.appendChild(img);
}

function renderDetail(alerta: AlertaResponse): void {
  if (!detalle) return;

  detalle.innerHTML = "";
  setActionStatus();

  renderAlertPreview(alerta);

  addDetailItem("ID", String(alerta.id));
  addDetailItem("Inspeccion", textoSeguro(alerta.inspeccionId, "Sin inspeccion asociada"));
  addDetailItem("Imagen", getAlertaImagePath(alerta) ?? "Sin imagen asociada");
  addDetailItem("Tipo", etiquetaTipo(alerta.tipo));
  addDetailItem("Prioridad", alerta.prioridad);
  addDetailItem("Estado", etiquetaEstado(alerta.estado));
  addDetailItem("Fecha", formatFecha(alerta.createdAt));
  addDetailItem("Mensaje", alerta.mensaje || "Sin mensaje");
  addDetailItem("Seccion", getSeccion(alerta));
  addDetailItem("Estanteria", getEstanteria(alerta));
  addDetailItem("Slot", getSlot(alerta));
  addDetailItem("Producto", getProducto(alerta));
  addDetailItem("Proveedor", getProveedor(alerta));
  addDetailItem("Stock", getStockMensaje(alerta));
  addDetailItem("Clave proveedor", textoSeguro(alerta.asignacion?.claveProductoProveedor, "Sin asignacion asociada"));
  addDetailItem("Caducidad", textoSeguro(alerta.asignacion?.fechaCaducidad, "Sin fecha de caducidad"));
  addDetailItem("Retirada programada", textoSeguro(alerta.asignacion?.fechaRetiradaProgramada, "Sin retirada programada"));

  const alertaAbierta = alerta.estado === "ABIERTA";
  if (btnResolver) {
    btnResolver.disabled = !puedeCerrarAlertas || !alertaAbierta;
    btnResolver.hidden = false;
  }
  if (btnDescartar) {
    btnDescartar.disabled = !puedeCerrarAlertas || !alertaAbierta;
    btnDescartar.hidden = false;
  }

  if (!puedeCerrarAlertas) {
    setActionStatus("Solo un administrador puede cerrar alertas.", "info");
  } else if (!alertaAbierta) {
    setActionStatus("Esta alerta ya no esta abierta.", "info");
  }

}

function scrollDetalleSiHaceFalta(): void {
  if (!detallePanel) return;

  const rect = detallePanel.getBoundingClientRect();
  const fueraDeVista = rect.top < 0 || rect.bottom > window.innerHeight;
  if (window.innerWidth <= 1100 || fueraDeVista) {
    detallePanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function selectAlert(id: number, scrollToDetail = false): void {
  selectedId = id;
  const alerta = alertas.find((item) => item.id === id);
  if (alerta) renderDetail(alerta);
  renderTable();
  if (scrollToDetail) scrollDetalleSiHaceFalta();
}

function renderTable(): void {
  if (!tbody) return;

  const rows = getFiltered();
  tbody.innerHTML = "";

  if (alertas.length === 0) {
    setRowMessage("No hay alertas abiertas para mostrar");
    return;
  }

  if (rows.length === 0) {
    setRowMessage("No hay alertas que coincidan con los filtros");
    return;
  }

  rows.forEach((alerta) => {
    const tr = document.createElement("tr");
    tr.dataset.id = String(alerta.id);
    tr.tabIndex = 0;
    tr.setAttribute("role", "button");
    tr.setAttribute("aria-label", `Ver detalle de alerta ${alerta.id}`);
    if (alerta.id === selectedId) {
      tr.classList.add("is-selected");
      tr.setAttribute("aria-selected", "true");
    }

    const tdHora = document.createElement("td");
    tdHora.textContent = formatFecha(alerta.createdAt);

    const tdPrioridad = document.createElement("td");
    const prioridadChip = document.createElement("span");
    prioridadChip.className = `status-chip ${clasePrioridad(alerta.prioridad)}`;
    prioridadChip.textContent = alerta.prioridad;
    tdPrioridad.appendChild(prioridadChip);

    const tdEstanteria = document.createElement("td");
    tdEstanteria.textContent = getEstanteria(alerta);

    const tdProducto = document.createElement("td");
    tdProducto.textContent = getProducto(alerta);

    const tdZona = document.createElement("td");
    tdZona.textContent = getSeccion(alerta);

    const tdDetectado = document.createElement("td");
    tdDetectado.textContent = getDetectadoEsperado(alerta);

    const tdEstado = document.createElement("td");
    const estadoChip = document.createElement("span");
    estadoChip.className = `status-chip ${claseEstado(alerta.estado)}`;
    estadoChip.textContent = etiquetaEstado(alerta.estado);
    tdEstado.appendChild(estadoChip);

    tr.append(tdHora, tdPrioridad, tdEstanteria, tdProducto, tdZona, tdDetectado, tdEstado);
    tbody.appendChild(tr);
  });
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
  if (status === 404) return "No se encontraron alertas";
  if (status === 403) return "Solo un administrador puede cerrar alertas.";
  if (status === 409) return "La alerta ya esta cerrada o no admite esa transicion";
  if (status >= 500) return "Error interno del servidor";
  return `Error HTTP ${status}`;
}

async function cargarAlertas(mensajeDetalle?: string): Promise<void> {
  setRowMessage("Cargando alertas abiertas...");
  setDetalleMessage("Cargando detalle de alertas...");

  try {
    const response = await authFetch(API_ALERTAS_ABIERTAS, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      const errorData = await parseErrorResponse(response);
      const mensaje = getBackendErrorMessage(errorData, response.status);
      setRowMessage(mensaje);
      setDetalleMessage("No se pudo cargar el detalle porque el backend no respondio correctamente");
      alertas = [];
      updateMetrics();
      return;
    }

    const data = await response.json() as AlertaResponse[];
    alertas = data.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    updateMetrics();
    renderTable();

    if (mensajeDetalle) {
      selectedId = null;
      renderTable();
      setDetalleMessage(mensajeDetalle);
      setActionStatus(mensajeDetalle, "success");
      return;
    }

    if (alertas.length > 0) {
      selectAlert(alertas[0].id);
    } else {
      setDetalleMessage("No hay alertas abiertas");
    }
  } catch {
    alertas = [];
    updateMetrics();
    setRowMessage("No se pudo conectar con el servidor de alertas");
    setDetalleMessage("Revisa que el backend este arrancado para consultar las alertas");
  }
}

async function cerrarAlerta(accion: "resolver" | "descartar"): Promise<void> {
  const alerta = alertas.find((item) => item.id === selectedId);
  if (!alerta) {
    setActionStatus("Selecciona una alerta antes de ejecutar la accion.", "error");
    return;
  }

  if (!puedeCerrarAlertas) {
    setActionStatus("Solo un administrador puede cerrar alertas.", "error");
    return;
  }

  const endpoint = accion === "resolver"
    ? `/api/alertas/${alerta.id}/resolver`
    : `/api/alertas/${alerta.id}/descartar`;

  const textoAccion = accion === "resolver" ? "resolviendo" : "descartando";
  setActionStatus(`Se esta ${textoAccion} la alerta...`, "info");
  if (btnResolver) btnResolver.disabled = true;
  if (btnDescartar) btnDescartar.disabled = true;

  try {
    const response = await authFetch(endpoint, {
      method: "PATCH",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      const errorData = await parseErrorResponse(response);
      renderDetail(alerta);
      setActionStatus(getBackendErrorMessage(errorData, response.status), "error");
      return;
    }

    await cargarAlertas("La alerta se cerro correctamente.");
  } catch {
    renderDetail(alerta);
    setActionStatus("No se pudo conectar con el servidor de alertas.", "error");
  }
}

tbody?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const row = target.closest<HTMLTableRowElement>("tr[data-id]");
  const id = Number(row?.dataset.id);

  if (!Number.isFinite(id)) return;
  selectAlert(id, true);
});

tbody?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const row = target.closest<HTMLTableRowElement>("tr[data-id]");
  const id = Number(row?.dataset.id);
  if (!Number.isFinite(id)) return;

  event.preventDefault();
  selectAlert(id, true);
});

btnResolver?.addEventListener("click", () => {
  void cerrarAlerta("resolver");
});

btnDescartar?.addEventListener("click", () => {
  void cerrarAlerta("descartar");
});

filtroGravedad?.addEventListener("change", renderTable);
filtroEstado?.addEventListener("change", renderTable);
filtroTexto?.addEventListener("input", renderTable);

btnLimpiar?.addEventListener("click", () => {
  if (filtroGravedad) filtroGravedad.value = "";
  if (filtroEstado) filtroEstado.value = "";
  if (filtroTexto) filtroTexto.value = "";
  renderTable();
});

document.addEventListener("DOMContentLoaded", () => {
  void cargarAlertas();
});
