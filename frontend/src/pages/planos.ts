import { authFetch } from "../lib/api";
import { requireAuth } from "../lib/auth-guard";

requireAuth();

type Orientacion = "HORIZONTAL" | "VERTICAL";
type EstadoVisual = "OCUPADO" | "VACIO" | "ANOMALIA" | "SIN_DATOS" | string;

type ApiErrorResponse = {
  message?: string;
  error?: string;
  status?: number;
};

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

type PlanoZonaOperativaResponse = {
  id: number;
  seccion: SeccionResponse;
  x: number;
  y: number;
  width: number;
  height: number;
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
  estadoVisual: EstadoVisual;
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
  empresa: EmpresaResponse;
  zonas: PlanoZonaOperativaResponse[];
  estanterias: PlanoEstanteriaOperativaResponse[];
};

const CODIGO_PLANO = "PLANO-DEMO";

const planoMeta = document.querySelector<HTMLElement>("#plano-meta");
const listaEstanterias = document.querySelector<HTMLUListElement>("#lista-estanterias");
const tituloPlano = document.querySelector<HTMLElement>("#titulo-plano");
const subtituloPlano = document.querySelector<HTMLElement>("#subtitulo-plano");
const estadoCarga = document.querySelector<HTMLElement>("#estado-carga");
const canvas = document.querySelector<HTMLElement>("#plano-canvas");
const detalleEstanteria = document.querySelector<HTMLElement>("#detalle-estanteria");
const detalleSlot = document.querySelector<HTMLElement>("#detalle-slot");
const detalleAlertas = document.querySelector<HTMLElement>("#detalle-alertas");

let planoActual: PlanoOperativoResponse | null = null;
let estanteriaSeleccionada: PlanoEstanteriaOperativaResponse | null = null;
let slotSeleccionado: PlanoSlotOperativoResponse | null = null;

const estadoLabels: Record<string, string> = {
  OK: "OK",
  HUECOS_VACIOS: "Huecos vacíos",
  ANOMALIAS: "Anomalías",
  MIXTO: "Mixto",
  OCUPADO: "Ocupado",
  VACIO: "Vacío",
  ANOMALIA: "Anomalía",
  SIN_DATOS: "Sin datos"
};

const tipoAlertaLabels: Record<string, string> = {
  HUECO_VACIO: "Hueco vacío",
  ANOMALIA_VISUAL: "Anomalía visual",
  REVISION_MANUAL: "Revisión manual",
  PRODUCTO_PROXIMO_A_CADUCAR: "Producto próximo a caducar",
  PRESENCIA_TRAS_RETIRADA_PROGRAMADA: "Presencia tras retirada programada"
};

function textoSeguro(value: string | number | null | undefined, fallback = "No disponible"): string {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function etiquetaEstado(value: string | null | undefined): string {
  if (!value) return "Sin datos";
  return estadoLabels[value] ?? value.replaceAll("_", " ").toLowerCase();
}

function etiquetaAlerta(value: string): string {
  return tipoAlertaLabels[value] ?? value.replaceAll("_", " ").toLowerCase();
}

function formatFecha(value: string | null | undefined): string {
  if (!value) return "Sin inspección";

  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return value;

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(fecha);
}

function formatConfianza(value: number | null): string {
  if (value === null) return "Sin confianza";
  return `${Math.round(value * 100)}%`;
}

function claseEstado(estado: string | null | undefined): string {
  const base = estado ?? "SIN_DATOS";
  return `state-${base.toLowerCase().replaceAll("_", "-")}`;
}

function abreviarProducto(producto: ProductoResumenResponse | null): string {
  const nombre = producto?.nombre ?? producto?.codigoInterno;
  if (!nombre) return "Sin producto";
  return nombre.length > 16 ? `${nombre.slice(0, 14)}...` : nombre;
}

function setTexto(element: HTMLElement | null, text: string): void {
  if (element) element.textContent = text;
}

function setHtml(element: HTMLElement | null, html: string): void {
  if (element) element.innerHTML = html;
}

function posicionar(element: HTMLElement, x: number, y: number, width: number, height: number, plano: PlanoOperativoResponse): void {
  element.style.left = `${(x / plano.ancho) * 100}%`;
  element.style.top = `${(y / plano.alto) * 100}%`;
  element.style.width = `${(width / plano.ancho) * 100}%`;
  element.style.height = `${(height / plano.alto) * 100}%`;
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
  if (status === 404) return "No hay plano operativo disponible.";
  if (status === 401) return "La sesión no es válida o ha caducado.";
  if (status >= 500) return "El backend no pudo cargar el plano operativo.";
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

function renderListaEstanterias(plano: PlanoOperativoResponse): void {
  if (!listaEstanterias) return;

  listaEstanterias.innerHTML = "";
  if (plano.estanterias.length === 0) {
    const item = document.createElement("li");
    item.className = "plan-item";
    item.textContent = "El plano no tiene estanterías colocadas.";
    listaEstanterias.appendChild(item);
    return;
  }

  plano.estanterias.forEach((estanteria) => {
    const item = document.createElement("li");
    item.className = `plan-item${estanteriaSeleccionada?.layoutId === estanteria.layoutId ? " is-active" : ""}`;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "plan-list-button";
    button.addEventListener("click", () => seleccionarEstanteria(estanteria, null));

    const title = document.createElement("span");
    title.className = "plan-title";
    title.textContent = estanteria.estanteria.codigo;

    const meta = document.createElement("span");
    meta.className = "plan-meta";
    meta.textContent = `${etiquetaEstado(estanteria.ultimaInspeccion?.estadoGeneralVisual)} · ${estanteria.alertasAbiertas.length} alertas`;

    button.append(title, meta);
    item.appendChild(button);
    listaEstanterias.appendChild(item);
  });
}

function renderCanvas(plano: PlanoOperativoResponse): void {
  if (!canvas) return;

  canvas.innerHTML = "";
  canvas.style.aspectRatio = `${plano.ancho} / ${plano.alto}`;

  if (plano.zonas.length === 0) {
    const empty = document.createElement("span");
    empty.textContent = "El plano no tiene zonas configuradas.";
    canvas.appendChild(empty);
    return;
  }

  plano.zonas.forEach((zona) => {
    const zonaNode = document.createElement("section");
    zonaNode.className = "zone-node";
    posicionar(zonaNode, zona.x, zona.y, zona.width, zona.height, plano);

    const label = document.createElement("span");
    label.className = "zone-label";
    label.textContent = zona.seccion.nombre;
    zonaNode.appendChild(label);
    canvas.appendChild(zonaNode);
  });

  plano.estanterias.forEach((estanteria) => {
    const rack = document.createElement("div");
    rack.className = `rack-node ${claseEstado(estanteria.ultimaInspeccion?.estadoGeneralVisual)}${estanteriaSeleccionada?.layoutId === estanteria.layoutId ? " is-selected" : ""}`;
    rack.tabIndex = 0;
    rack.role = "button";
    rack.setAttribute("aria-label", `Estantería ${estanteria.estanteria.codigo}`);
    posicionar(rack, estanteria.x, estanteria.y, estanteria.width, estanteria.height, plano);
    rack.addEventListener("click", () => seleccionarEstanteria(estanteria, null));
    rack.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        seleccionarEstanteria(estanteria, null);
      }
    });

    const rackTitle = document.createElement("strong");
    rackTitle.className = "rack-title";
    rackTitle.textContent = estanteria.estanteria.codigo;
    rack.appendChild(rackTitle);

    const slotsWrap = document.createElement("span");
    slotsWrap.className = `rack-slots ${estanteria.orientacion.toLowerCase()}`;

    estanteria.slots.forEach((slot) => {
      const slotButton = document.createElement("button");
      slotButton.type = "button";
      slotButton.className = `slot-node ${claseEstado(slot.estadoVisual)}${slot.tieneAlertaAbierta ? " has-slot-alert" : ""}${slotSeleccionado?.slotId === slot.slotId && estanteriaSeleccionada?.layoutId === estanteria.layoutId ? " is-selected" : ""}`;
      slotButton.setAttribute("aria-label", `${slot.slotId}: ${etiquetaEstado(slot.estadoVisual)}`);
      slotButton.addEventListener("click", (event) => {
        event.stopPropagation();
        seleccionarEstanteria(estanteria, slot);
      });

      const slotId = document.createElement("span");
      slotId.textContent = slot.slotId;
      const producto = document.createElement("small");
      producto.textContent = abreviarProducto(slot.productoEsperado);
      slotButton.append(slotId, producto);
      slotsWrap.appendChild(slotButton);
    });

    rack.appendChild(slotsWrap);
    canvas.appendChild(rack);
  });
}

function renderDetalleEstanteria(estanteria: PlanoEstanteriaOperativaResponse | null): void {
  if (!detalleEstanteria) return;

  if (!estanteria) {
    setHtml(detalleEstanteria, "<p>Selecciona una estantería del plano para ver su detalle.</p>");
    return;
  }

  const inspeccion = estanteria.ultimaInspeccion;
  detalleEstanteria.innerHTML = "";
  detalleEstanteria.append(
    crearLineaDetalle("Código", estanteria.estanteria.codigo),
    crearLineaDetalle("Nombre", estanteria.estanteria.nombre),
    crearLineaDetalle("Estado visual", etiquetaEstado(inspeccion?.estadoGeneralVisual)),
    crearLineaDetalle("Última inspección", inspeccion ? `#${inspeccion.id} · ${formatFecha(inspeccion.capturadaEn ?? inspeccion.createdAt)}` : "Sin inspección reciente"),
    crearLineaDetalle("Ocupados", textoSeguro(inspeccion?.ocupados, "0")),
    crearLineaDetalle("Vacíos", textoSeguro(inspeccion?.vacios, "0")),
    crearLineaDetalle("Anomalías", textoSeguro(inspeccion?.anomalias, "0")),
    crearLineaDetalle("Tareas activas", String(estanteria.tareasActivas.length))
  );
}

function renderDetalleSlot(slot: PlanoSlotOperativoResponse | null): void {
  if (!detalleSlot) return;

  if (!slot) {
    setHtml(detalleSlot, "<p>Selecciona un slot para consultar producto, estado visual y alertas.</p>");
    return;
  }

  detalleSlot.innerHTML = "";
  detalleSlot.append(
    crearLineaDetalle("Slot", slot.slotId),
    crearLineaDetalle("Orden", String(slot.orden)),
    crearLineaDetalle("Producto esperado", textoSeguro(slot.productoEsperado?.nombre ?? slot.productoEsperado?.codigoInterno)),
    crearLineaDetalle("Estado visual", etiquetaEstado(slot.estadoVisual)),
    crearLineaDetalle("Confianza", formatConfianza(slot.confianza)),
    crearLineaDetalle("Alertas", slot.tiposAlertas.length > 0 ? slot.tiposAlertas.map(etiquetaAlerta).join(", ") : "Sin alertas de slot")
  );
}

function renderDetalleAlertas(estanteria: PlanoEstanteriaOperativaResponse | null): void {
  if (!detalleAlertas) return;

  if (!estanteria) {
    setHtml(detalleAlertas, "<p>Las alertas de la estantería seleccionada aparecerán aquí.</p>");
    return;
  }

  detalleAlertas.innerHTML = "";

  if (estanteria.alertasAbiertas.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Sin alertas abiertas asociadas.";
    detalleAlertas.appendChild(empty);
  } else {
    const list = document.createElement("ul");
    estanteria.alertasAbiertas.forEach((alerta) => {
      const item = document.createElement("li");
      item.textContent = `#${alerta.id} · ${etiquetaAlerta(alerta.tipo)} · ${alerta.prioridad} · ${textoSeguro(alerta.slotId, "sin slot")}`;
      list.appendChild(item);
    });
    detalleAlertas.appendChild(list);
  }

  if (estanteria.tareasActivas.length > 0) {
    const title = document.createElement("h4");
    title.textContent = "Tareas activas";
    const tareas = document.createElement("ul");
    estanteria.tareasActivas.forEach((tarea) => {
      const item = document.createElement("li");
      item.textContent = `#${tarea.id} · ${tarea.titulo} · ${tarea.estadoTarea}`;
      tareas.appendChild(item);
    });
    detalleAlertas.append(title, tareas);
  }
}

function crearLineaDetalle(label: string, value: string): HTMLElement {
  const row = document.createElement("p");
  row.className = "detail-row";

  const labelNode = document.createElement("span");
  labelNode.textContent = label;

  const valueNode = document.createElement("strong");
  valueNode.textContent = value;

  row.append(labelNode, valueNode);
  return row;
}

function seleccionarEstanteria(estanteria: PlanoEstanteriaOperativaResponse, slot: PlanoSlotOperativoResponse | null): void {
  estanteriaSeleccionada = estanteria;
  slotSeleccionado = slot;

  if (planoActual) {
    renderListaEstanterias(planoActual);
    renderCanvas(planoActual);
  }
  renderDetalleEstanteria(estanteriaSeleccionada);
  renderDetalleSlot(slotSeleccionado);
  renderDetalleAlertas(estanteriaSeleccionada);
}

function renderPlano(plano: PlanoOperativoResponse): void {
  planoActual = plano;
  estanteriaSeleccionada = plano.estanterias[0] ?? null;
  slotSeleccionado = null;

  setTexto(planoMeta, `${plano.codigo} · ${plano.empresa.nombre} · ${plano.ancho} x ${plano.alto}`);
  setTexto(tituloPlano, plano.nombre);
  setTexto(subtituloPlano, plano.descripcion ?? "Plano operativo persistido");
  setTexto(estadoCarga, "Operativo");

  renderListaEstanterias(plano);
  renderCanvas(plano);
  renderDetalleEstanteria(estanteriaSeleccionada);
  renderDetalleSlot(null);
  renderDetalleAlertas(estanteriaSeleccionada);
}

function renderError(message: string): void {
  setTexto(planoMeta, "Sin plano operativo");
  setTexto(tituloPlano, CODIGO_PLANO);
  setTexto(subtituloPlano, message);
  setTexto(estadoCarga, "Error");
  if (canvas) {
    canvas.innerHTML = "";
    const error = document.createElement("span");
    error.textContent = message;
    canvas.appendChild(error);
  }
  if (listaEstanterias) {
    listaEstanterias.innerHTML = "<li class=\"plan-item\">No hay estanterías para mostrar.</li>";
  }
  renderDetalleEstanteria(null);
  renderDetalleSlot(null);
  renderDetalleAlertas(null);
}

async function cargarPlanoOperativo(): Promise<void> {
  setTexto(estadoCarga, "Cargando");

  try {
    const plano = await fetchJson<PlanoOperativoResponse>(`/api/planos/${encodeURIComponent(CODIGO_PLANO)}/operativo`);
    renderPlano(plano);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo cargar el plano operativo.";
    renderError(message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  void cargarPlanoOperativo();
});
