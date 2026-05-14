type EstadoGeneralVisual = "OK" | "HUECOS_VACIOS" | "ANOMALIAS" | "MIXTO" | string;
type EstadoVisualSlot = "OCUPADO" | "VACIO" | "ANOMALIA" | string;

type InspeccionItemResponse = {
  id: number;
  estanteriaCodigo: string;
  notas: string | null;
  imagenPath: string | null;
  estado: string;
  createdAt: string;
  estadoGeneralVisual: EstadoGeneralVisual | null;
  ocupados: number | null;
  vacios: number | null;
  anomalias: number | null;
  modeloVersion: string | null;
  capturadaEn: string | null;
};

type SlotVisualResponse = {
  slotId: string | null;
  orden: number | null;
  estadoVisual: EstadoVisualSlot | null;
  confianza: number | null;
};

type ResultadoVisualResponse = {
  estanteriaCodigo: string;
  modeloVersion: string | null;
  capturadaEn: string | null;
  resumen: {
    estadoGeneralVisual: EstadoGeneralVisual;
    slotsTotales: number;
    ocupados: number;
    vacios: number;
    anomalias: number;
    hayHuecosVacios: boolean;
    hayAnomalias: boolean;
  } | null;
  slots: SlotVisualResponse[];
};

type InspeccionDetalleResponse = {
  id: number;
  estanteriaCodigo: string;
  notas: string | null;
  imagenPath: string | null;
  estado: string;
  createdAt: string;
  resultadoVisual: ResultadoVisualResponse | null;
};

type ProductoResumenResponse = {
  id: number;
  codigoInterno: string | null;
  nombre: string | null;
};

type SlotConfiguradoResponse = {
  id: number;
  slotId: string | null;
  orden: number | null;
  productoEsperado: ProductoResumenResponse | null;
  cantidadObjetivo: number | null;
};

type EstanteriaConfiguracionResponse = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activa: boolean | null;
  seccion: {
    id: number;
    codigo: string;
    nombre: string;
  } | null;
  slots: SlotConfiguradoResponse[];
};

type AlertaResponse = {
  id: number;
  tipo: string;
  prioridad: string;
  estado: string;
  mensaje: string;
  estanteria: {
    codigo?: string | null;
    nombre?: string | null;
  } | null;
  slot: {
    slotId?: string | null;
    orden?: number | null;
  } | null;
};

type ApiErrorResponse = {
  message?: string;
  error?: string;
  status?: number;
};

const ESTANTERIA_DEMO = "EST-001";

const listaPlanos = document.querySelector<HTMLUListElement>("#lista-planos");
const preview = document.querySelector<HTMLElement>("#preview-plano");
const detallePlano = document.querySelector<HTMLUListElement>("#detalle-plano");
const detalleSlots = document.querySelector<HTMLUListElement>("#detalle-estanterias");
const detalleAlertas = document.querySelector<HTMLUListElement>("#detalle-alertas-plano");

const tipoLabels: Record<string, string> = {
  HUECO_VACIO: "Hueco vac\u00edo",
  ANOMALIA_VISUAL: "Anomal\u00eda visual",
  REVISION_MANUAL: "Revisi\u00f3n manual",
  PRODUCTO_PROXIMO_A_CADUCAR: "Producto pr\u00f3ximo a caducar",
  PRESENCIA_TRAS_RETIRADA_PROGRAMADA: "Presencia tras retirada programada"
};

const estadoVisualLabels: Record<string, string> = {
  OK: "OK",
  HUECOS_VACIOS: "Huecos vac\u00edos",
  ANOMALIAS: "Anomal\u00edas",
  MIXTO: "Mixto",
  OCUPADO: "Ocupado",
  VACIO: "Vac\u00edo",
  ANOMALIA: "Anomal\u00eda"
};

function textoSeguro(value: string | number | null | undefined, fallback = "No disponible"): string {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function etiquetaEstado(value: string | null | undefined): string {
  if (!value) return "Sin estado visual";
  return estadoVisualLabels[value] ?? value.replaceAll("_", " ").toLowerCase();
}

function etiquetaTipo(value: string): string {
  return tipoLabels[value] ?? value.replaceAll("_", " ").toLowerCase();
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

function formatConfianza(value: number | null | undefined): string {
  if (value === null || value === undefined) return "sin confianza";
  return `${Math.round(value * 100)}%`;
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
  if (status === 404) return "No se encontraron datos para la estanter\u00eda";
  if (status >= 500) return "Error interno del servidor";
  return `Error HTTP ${status}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
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

function clearList(list: HTMLUListElement | null): void {
  if (list) list.innerHTML = "";
}

function addListItem(list: HTMLUListElement | null, text: string): void {
  if (!list) return;

  const li = document.createElement("li");
  li.textContent = text;
  list.appendChild(li);
}

function setMessage(message: string): void {
  if (preview) {
    preview.innerHTML = `<span>${message}</span>`;
  }
  clearList(detallePlano);
  clearList(detalleSlots);
  clearList(detalleAlertas);
  addListItem(detallePlano, message);
}

function resolverUltimaInspeccion(inspecciones: InspeccionItemResponse[]): InspeccionItemResponse | null {
  return inspecciones
    .filter((inspeccion) => inspeccion.estanteriaCodigo === ESTANTERIA_DEMO)
    .sort((a, b) => {
      const fechaA = new Date(a.capturadaEn ?? a.createdAt).getTime();
      const fechaB = new Date(b.capturadaEn ?? b.createdAt).getTime();
      return fechaB - fechaA;
    })[0] ?? null;
}

function buscarSlotConfigurado(configuracion: EstanteriaConfiguracionResponse, slotVisual: SlotVisualResponse): SlotConfiguradoResponse | null {
  return configuracion.slots.find((slot) => slot.slotId === slotVisual.slotId)
    ?? configuracion.slots.find((slot) => slot.orden === slotVisual.orden)
    ?? null;
}

function renderListaEstanteria(configuracion: EstanteriaConfiguracionResponse, ultima: InspeccionItemResponse | null): void {
  if (!listaPlanos) return;

  listaPlanos.innerHTML = "";
  const li = document.createElement("li");
  li.className = "plan-item is-active";
  li.dataset.codigo = configuracion.codigo;

  const title = document.createElement("div");
  title.className = "plan-title";
  title.textContent = `${configuracion.codigo} - ${configuracion.nombre}`;

  const meta = document.createElement("div");
  meta.className = "plan-meta";
  meta.textContent = ultima
    ? `${etiquetaEstado(ultima.estadoGeneralVisual)} - ${formatFecha(ultima.capturadaEn ?? ultima.createdAt)}`
    : "Sin inspecciones visuales";

  li.append(title, meta);
  listaPlanos.appendChild(li);
}

function renderPreview(
  configuracion: EstanteriaConfiguracionResponse,
  ultima: InspeccionItemResponse | null,
  detalle: InspeccionDetalleResponse | null,
  alertas: AlertaResponse[]
): void {
  if (!preview) return;

  const resumen = detalle?.resultadoVisual?.resumen;
  const estado = resumen?.estadoGeneralVisual ?? ultima?.estadoGeneralVisual ?? null;
  const ocupados = resumen?.ocupados ?? ultima?.ocupados ?? 0;
  const vacios = resumen?.vacios ?? ultima?.vacios ?? 0;
  const anomalias = resumen?.anomalias ?? ultima?.anomalias ?? 0;

  preview.innerHTML = "";
  const container = document.createElement("div");

  const titulo = document.createElement("strong");
  titulo.textContent = `${configuracion.codigo} - ${etiquetaEstado(estado)}`;
  container.appendChild(titulo);

  const resumenTexto = document.createElement("p");
  resumenTexto.textContent = `Ocupados: ${ocupados} / Vac\u00edos: ${vacios} / Anomal\u00edas: ${anomalias} / Alertas abiertas: ${alertas.length}`;
  container.appendChild(resumenTexto);

  const slots = detalle?.resultadoVisual?.slots ?? [];
  if (slots.length === 0) {
    const sinSlots = document.createElement("p");
    sinSlots.textContent = ultima ? "La \u00faltima inspecci\u00f3n no tiene detalle visual por slots." : "No hay inspecciones visuales registradas.";
    container.appendChild(sinSlots);
  } else {
    const lista = document.createElement("ul");
    slots
      .slice()
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      .forEach((slot) => {
        const configurado = buscarSlotConfigurado(configuracion, slot);
        const item = document.createElement("li");
        item.textContent = `${textoSeguro(slot.slotId, "slot")} - ${etiquetaEstado(slot.estadoVisual)} - ${textoSeguro(configurado?.productoEsperado?.nombre, "Sin producto esperado")}`;
        lista.appendChild(item);
      });
    container.appendChild(lista);
  }

  preview.appendChild(container);
}

function renderResumen(
  configuracion: EstanteriaConfiguracionResponse,
  ultima: InspeccionItemResponse | null,
  detalle: InspeccionDetalleResponse | null,
  alertas: AlertaResponse[]
): void {
  clearList(detallePlano);

  addListItem(detallePlano, `Estanter\u00eda: ${configuracion.codigo} - ${configuracion.nombre}`);
  addListItem(detallePlano, `Secci\u00f3n: ${textoSeguro(configuracion.seccion?.nombre ?? configuracion.seccion?.codigo)}`);
  addListItem(detallePlano, `Slots configurados: ${configuracion.slots.length}`);
  addListItem(detallePlano, `\u00daltima inspecci\u00f3n: ${ultima ? `#${ultima.id} / ${formatFecha(ultima.capturadaEn ?? ultima.createdAt)}` : "Sin inspecciones"}`);
  addListItem(detallePlano, `Estado visual: ${etiquetaEstado(detalle?.resultadoVisual?.resumen?.estadoGeneralVisual ?? ultima?.estadoGeneralVisual)}`);
  addListItem(detallePlano, `Ocupados: ${textoSeguro(detalle?.resultadoVisual?.resumen?.ocupados ?? ultima?.ocupados, "0")}`);
  addListItem(detallePlano, `Vac\u00edos: ${textoSeguro(detalle?.resultadoVisual?.resumen?.vacios ?? ultima?.vacios, "0")}`);
  addListItem(detallePlano, `Anomal\u00edas: ${textoSeguro(detalle?.resultadoVisual?.resumen?.anomalias ?? ultima?.anomalias, "0")}`);
  addListItem(detallePlano, `Alertas abiertas: ${alertas.length}`);
}

function renderSlots(configuracion: EstanteriaConfiguracionResponse, detalle: InspeccionDetalleResponse | null): void {
  clearList(detalleSlots);

  const slotsVisuales = detalle?.resultadoVisual?.slots ?? [];
  if (slotsVisuales.length === 0) {
    if (configuracion.slots.length === 0) {
      addListItem(detalleSlots, "La estanter\u00eda no tiene slots configurados.");
      return;
    }

    configuracion.slots
      .slice()
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      .forEach((slot) => {
        addListItem(detalleSlots, `${textoSeguro(slot.slotId, "Slot")} - sin resultado visual - ${textoSeguro(slot.productoEsperado?.nombre, "Sin producto esperado")}`);
      });
    return;
  }

  slotsVisuales
    .slice()
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    .forEach((slotVisual) => {
      const configurado = buscarSlotConfigurado(configuracion, slotVisual);
      addListItem(
        detalleSlots,
        `${textoSeguro(slotVisual.slotId, "Slot")} - ${etiquetaEstado(slotVisual.estadoVisual)} - confianza ${formatConfianza(slotVisual.confianza)} - ${textoSeguro(configurado?.productoEsperado?.nombre, "Sin producto esperado")}`
      );
    });
}

function renderAlertas(alertas: AlertaResponse[], configuracion: EstanteriaConfiguracionResponse): void {
  clearList(detalleAlertas);

  if (alertas.length === 0) {
    addListItem(detalleAlertas, "Sin alertas abiertas asociadas a esta estanter\u00eda.");
  } else {
    alertas.forEach((alerta) => {
      addListItem(
        detalleAlertas,
        `#${alerta.id} - ${etiquetaTipo(alerta.tipo)} - ${alerta.prioridad} - ${textoSeguro(alerta.slot?.slotId, "sin slot")}`
      );
    });
  }

  if (configuracion.slots.length > 0) {
    addListItem(detalleAlertas, `Productos esperados: ${configuracion.slots.map((slot) => textoSeguro(slot.productoEsperado?.nombre, "Sin producto")).join(", ")}`);
  }
}

async function cargarPlanoOperativo(): Promise<void> {
  setMessage("Cargando estado visual de EST-001...");

  try {
    const [configuracion, inspecciones, alertas] = await Promise.all([
      fetchJson<EstanteriaConfiguracionResponse>(`/api/estanterias/${encodeURIComponent(ESTANTERIA_DEMO)}/configuracion`),
      fetchJson<InspeccionItemResponse[]>("/api/inspecciones"),
      fetchJson<AlertaResponse[]>("/api/alertas/abiertas")
    ]);

    const ultima = resolverUltimaInspeccion(inspecciones);
    const detalle = ultima
      ? await fetchJson<InspeccionDetalleResponse>(`/api/inspecciones/${encodeURIComponent(String(ultima.id))}`)
      : null;
    const alertasEstanteria = alertas.filter((alerta) => alerta.estanteria?.codigo === configuracion.codigo);

    renderListaEstanteria(configuracion, ultima);
    renderPreview(configuracion, ultima, detalle, alertasEstanteria);
    renderResumen(configuracion, ultima, detalle, alertasEstanteria);
    renderSlots(configuracion, detalle);
    renderAlertas(alertasEstanteria, configuracion);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo cargar el plano operativo";
    setMessage(message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  void cargarPlanoOperativo();
});
