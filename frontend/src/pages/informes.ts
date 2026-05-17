import { authFetch } from "../lib/api";
import { requireAdminPanelAccess } from "../lib/auth-guard";

requireAdminPanelAccess();

const CODIGO_EMPRESA_DEMO = "EMP-DEMO";
const CODIGO_PLANO_DEMO = "PLANO-DEMO";

type ApiErrorResponse = {
  message?: string;
  error?: string;
  status?: number;
};

type PlanoResumenResponse = {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean | null;
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
  activa?: boolean | null;
};

type InformeRotacionVisualResponse = {
  periodo: {
    fechaDesde: string;
    fechaHasta: string;
  };
  filtros: {
    planoCodigo?: string | null;
    seccionId?: number | null;
    seccionNombre?: string | null;
    estanteriaCodigo?: string | null;
  };
  resumen: {
    totalInspecciones: number;
    totalResultadosSlot: number;
    totalVaciosDetectados: number;
    totalOcupadosDetectados: number;
    totalAnomaliasDetectadas: number;
  };
  productosMasVaciados: ProductoVaciadoResponse[];
  slotsMasVaciados: SlotVaciadoResponse[];
  productosSinVacios: ProductoSinVaciosResponse[];
  resumenPorDiaSemana: ResumenDiaSemanaResponse[];
};

type ProductoVaciadoResponse = {
  productoId: number | null;
  productoCodigo: string | null;
  productoNombre: string | null;
  seccionNombre: string | null;
  estanteriaCodigo: string | null;
  slotId: string | null;
  vaciosDetectados: number;
  ocupadosDetectados: number;
  anomaliasDetectadas: number;
  totalInspecciones: number;
  porcentajeVacio: number;
  ultimoVacioAt: string | null;
};

type SlotVaciadoResponse = {
  seccionNombre: string | null;
  estanteriaCodigo: string | null;
  slotId: string | null;
  productoEsperadoNombre: string | null;
  vaciosDetectados: number;
  totalInspecciones: number;
  porcentajeVacio: number;
};

type ProductoSinVaciosResponse = {
  productoId: number | null;
  productoCodigo: string | null;
  productoNombre: string | null;
  totalInspecciones: number;
  vaciosDetectados: number;
};

type ResumenDiaSemanaResponse = {
  diaSemana: string;
  vaciosDetectados: number;
};

const planoSelect = document.querySelector<HTMLSelectElement>("#f-plano");
const seccionSelect = document.querySelector<HTMLSelectElement>("#f-seccion");
const estanteriaSelect = document.querySelector<HTMLSelectElement>("#f-estanteria");
const fechaDesdeInput = document.querySelector<HTMLInputElement>("#f-fecha-desde");
const fechaHastaInput = document.querySelector<HTMLInputElement>("#f-fecha-hasta");
const generarBtn = document.querySelector<HTMLButtonElement>("#btn-generar-informe");
const statusEl = document.querySelector<HTMLElement>("#informes-status");

const metricInspecciones = document.querySelector<HTMLElement>("#metric-inspecciones");
const metricResultados = document.querySelector<HTMLElement>("#metric-resultados");
const metricVacios = document.querySelector<HTMLElement>("#metric-vacios");
const metricOcupados = document.querySelector<HTMLElement>("#metric-ocupados");
const metricAnomalias = document.querySelector<HTMLElement>("#metric-anomalias");

const productosVaciadosEl = document.querySelector<HTMLElement>("#productos-vaciados");
const slotsVaciadosEl = document.querySelector<HTMLTableSectionElement>("#slots-vaciados");
const productosSinVaciosEl = document.querySelector<HTMLElement>("#productos-sin-vacios");
const resumenDiasEl = document.querySelector<HTMLElement>("#resumen-dias");

let secciones: SeccionResponse[] = [];

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
  if (status === 403) return "No tienes permisos para consultar informes operativos.";
  if (status === 404) return "No se encontró el recurso solicitado para generar el informe.";
  if (status >= 500) return "Error interno del servidor al generar el informe.";
  return `Error HTTP ${status}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await authFetch(url, {
    method: "GET",
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    const errorData = await parseErrorResponse(response);
    throw new Error(getBackendErrorMessage(errorData, response.status));
  }

  return response.json() as Promise<T>;
}

function setStatus(message: string, error = false): void {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.toggle("error", error);
}

function setLoading(loading: boolean): void {
  if (generarBtn) {
    generarBtn.disabled = loading;
    generarBtn.textContent = loading ? "Generando..." : "Generar informe";
  }
}

function setText(element: HTMLElement | null, value: string | number): void {
  if (element) element.textContent = String(value);
}

function textoSeguro(value: string | number | null | undefined, fallback = "No disponible"): string {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function inicializarFechas(): void {
  const hasta = new Date();
  const desde = new Date();
  desde.setDate(hasta.getDate() - 29);
  if (fechaDesdeInput) fechaDesdeInput.value = toDateInputValue(desde);
  if (fechaHastaInput) fechaHastaInput.value = toDateInputValue(hasta);
}

function crearOption(value: string, label: string): HTMLOptionElement {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

async function cargarPlanos(): Promise<void> {
  if (!planoSelect) return;
  planoSelect.innerHTML = "";
  planoSelect.appendChild(crearOption("", "Todos"));

  const planos = await fetchJson<PlanoResumenResponse[]>(`/api/empresas/${encodeURIComponent(CODIGO_EMPRESA_DEMO)}/planos`);
  planos.forEach((plano) => {
    planoSelect.appendChild(crearOption(plano.codigo, `${plano.nombre} · ${plano.codigo}`));
  });

  const demo = planos.find((plano) => plano.codigo === CODIGO_PLANO_DEMO);
  const primero = planos[0];
  planoSelect.value = demo?.codigo ?? primero?.codigo ?? "";
}

async function cargarSecciones(): Promise<void> {
  if (!seccionSelect) return;
  secciones = await fetchJson<SeccionResponse[]>(`/api/empresas/${encodeURIComponent(CODIGO_EMPRESA_DEMO)}/secciones`);
  seccionSelect.innerHTML = "";
  seccionSelect.appendChild(crearOption("", "Todas"));
  secciones.forEach((seccion) => {
    seccionSelect.appendChild(crearOption(String(seccion.id), `${seccion.nombre} · ${seccion.codigo}`));
  });
}

async function cargarEstanteriasDeSeccion(): Promise<void> {
  if (!estanteriaSelect || !seccionSelect) return;
  estanteriaSelect.innerHTML = "";
  estanteriaSelect.appendChild(crearOption("", "Todas"));

  const seccionId = seccionSelect.value;
  if (!seccionId) {
    estanteriaSelect.disabled = true;
    return;
  }

  estanteriaSelect.disabled = true;
  const estanterias = await fetchJson<EstanteriaResumenResponse[]>(`/api/secciones/${encodeURIComponent(seccionId)}/estanterias`);
  estanterias.forEach((estanteria) => {
    estanteriaSelect.appendChild(crearOption(estanteria.codigo, `${estanteria.nombre} · ${estanteria.codigo}`));
  });
  estanteriaSelect.disabled = false;
}

function validarFechas(): boolean {
  const desde = fechaDesdeInput?.value;
  const hasta = fechaHastaInput?.value;
  if (desde && hasta && desde > hasta) {
    setStatus("La fecha desde no puede ser posterior a la fecha hasta.", true);
    return false;
  }
  return true;
}

function construirInformeUrl(): string {
  const params = new URLSearchParams();
  if (planoSelect?.value) params.set("planoCodigo", planoSelect.value);
  if (seccionSelect?.value) params.set("seccionId", seccionSelect.value);
  if (estanteriaSelect?.value) params.set("estanteriaCodigo", estanteriaSelect.value);
  if (fechaDesdeInput?.value) params.set("fechaDesde", fechaDesdeInput.value);
  if (fechaHastaInput?.value) params.set("fechaHasta", fechaHastaInput.value);

  const query = params.toString();
  return query ? `/api/informes/rotacion-visual?${query}` : "/api/informes/rotacion-visual";
}

function formatPercent(value: number | null | undefined): string {
  const number = value ?? 0;
  return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(number)}%`;
}

function humanizarDia(dia: string): string {
  const labels: Record<string, string> = {
    MONDAY: "Lunes",
    TUESDAY: "Martes",
    WEDNESDAY: "Miércoles",
    THURSDAY: "Jueves",
    FRIDAY: "Viernes",
    SATURDAY: "Sábado",
    SUNDAY: "Domingo",
    MIERCOLES: "Miércoles",
    SABADO: "Sábado"
  };
  return labels[dia] ?? dia;
}

function emptyState(message: string): HTMLParagraphElement {
  const element = document.createElement("p");
  element.className = "empty-state";
  element.textContent = message;
  return element;
}

function renderResumen(informe: InformeRotacionVisualResponse): void {
  setText(metricInspecciones, informe.resumen.totalInspecciones);
  setText(metricResultados, informe.resumen.totalResultadosSlot);
  setText(metricVacios, informe.resumen.totalVaciosDetectados);
  setText(metricOcupados, informe.resumen.totalOcupadosDetectados);
  setText(metricAnomalias, informe.resumen.totalAnomaliasDetectadas);
}

function renderProductosMasVaciados(productos: ProductoVaciadoResponse[]): void {
  if (!productosVaciadosEl) return;
  productosVaciadosEl.innerHTML = "";

  if (productos.length === 0) {
    productosVaciadosEl.appendChild(emptyState("No hay vacíos detectados en el periodo seleccionado."));
    return;
  }

  const maxVacios = Math.max(...productos.map((producto) => producto.vaciosDetectados), 1);
  productos.forEach((producto) => {
    const row = document.createElement("div");
    row.className = "bar-row";

    const name = document.createElement("div");
    name.className = "bar-name";
    name.textContent = textoSeguro(producto.productoNombre, "Producto sin nombre");
    const meta = document.createElement("span");
    meta.className = "bar-meta";
    meta.textContent = `${textoSeguro(producto.estanteriaCodigo)} / ${textoSeguro(producto.slotId)} · ${textoSeguro(producto.productoCodigo)}`;
    name.appendChild(meta);

    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.setProperty("--bar-width", `${Math.max((producto.vaciosDetectados / maxVacios) * 100, 4)}%`);
    track.appendChild(fill);

    const value = document.createElement("div");
    value.className = "bar-value";
    value.textContent = `${producto.vaciosDetectados} vacíos · ${formatPercent(producto.porcentajeVacio)}`;

    row.append(name, track, value);
    productosVaciadosEl.appendChild(row);
  });
}

function renderSlotsMasVaciados(slots: SlotVaciadoResponse[]): void {
  if (!slotsVaciadosEl) return;
  slotsVaciadosEl.innerHTML = "";

  if (slots.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.textContent = "No hay slots con vacíos detectados en el periodo seleccionado.";
    row.appendChild(cell);
    slotsVaciadosEl.appendChild(row);
    return;
  }

  slots.forEach((slot) => {
    const row = document.createElement("tr");
    [
      textoSeguro(slot.seccionNombre),
      textoSeguro(slot.estanteriaCodigo),
      textoSeguro(slot.slotId),
      textoSeguro(slot.productoEsperadoNombre),
      String(slot.vaciosDetectados),
      String(slot.totalInspecciones),
      formatPercent(slot.porcentajeVacio)
    ].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });
    slotsVaciadosEl.appendChild(row);
  });
}

function renderProductosSinVacios(productos: ProductoSinVaciosResponse[]): void {
  if (!productosSinVaciosEl) return;
  productosSinVaciosEl.innerHTML = "";

  if (productos.length === 0) {
    productosSinVaciosEl.appendChild(emptyState("No hay productos sin vacíos detectados para este periodo."));
    return;
  }

  productos.forEach((producto) => {
    const item = document.createElement("article");
    item.className = "quiet-item";

    const title = document.createElement("strong");
    title.className = "quiet-title";
    title.textContent = textoSeguro(producto.productoNombre, "Producto sin nombre");

    const meta = document.createElement("span");
    meta.className = "quiet-meta";
    meta.textContent = `${textoSeguro(producto.productoCodigo)} · ${producto.totalInspecciones} inspecciones · 0 vacíos`;

    item.append(title, meta);
    productosSinVaciosEl.appendChild(item);
  });
}

function renderResumenDias(dias: ResumenDiaSemanaResponse[]): void {
  if (!resumenDiasEl) return;
  resumenDiasEl.innerHTML = "";

  if (dias.length === 0) {
    resumenDiasEl.appendChild(emptyState("No hay datos por día de la semana."));
    return;
  }

  const maxVacios = Math.max(...dias.map((dia) => dia.vaciosDetectados), 1);
  dias.forEach((dia) => {
    const row = document.createElement("div");
    row.className = "day-row";

    const label = document.createElement("span");
    label.className = "day-label";
    label.textContent = humanizarDia(dia.diaSemana);

    const track = document.createElement("div");
    track.className = "day-track";
    const fill = document.createElement("div");
    fill.className = "day-fill";
    fill.style.setProperty("--bar-width", `${Math.max((dia.vaciosDetectados / maxVacios) * 100, dia.vaciosDetectados > 0 ? 4 : 0)}%`);
    track.appendChild(fill);

    const value = document.createElement("span");
    value.className = "day-value";
    value.textContent = String(dia.vaciosDetectados);

    row.append(label, track, value);
    resumenDiasEl.appendChild(row);
  });
}

function renderInforme(informe: InformeRotacionVisualResponse): void {
  renderResumen(informe);
  renderProductosMasVaciados(informe.productosMasVaciados ?? []);
  renderSlotsMasVaciados(informe.slotsMasVaciados ?? []);
  renderProductosSinVacios(informe.productosSinVacios ?? []);
  renderResumenDias(informe.resumenPorDiaSemana ?? []);
  setStatus(`Informe generado para el periodo ${informe.periodo.fechaDesde} - ${informe.periodo.fechaHasta}.`);
}

async function generarInforme(): Promise<void> {
  if (!validarFechas()) return;

  setLoading(true);
  setStatus("Generando informe de rotación visual...");
  try {
    const informe = await fetchJson<InformeRotacionVisualResponse>(construirInformeUrl());
    renderInforme(informe);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo generar el informe.";
    setStatus(message, true);
  } finally {
    setLoading(false);
  }
}

async function inicializar(): Promise<void> {
  inicializarFechas();
  try {
    await Promise.all([cargarPlanos(), cargarSecciones()]);
    await cargarEstanteriasDeSeccion();
    await generarInforme();
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron cargar los filtros del informe.";
    setStatus(message, true);
  }
}

seccionSelect?.addEventListener("change", () => {
  void cargarEstanteriasDeSeccion();
});

generarBtn?.addEventListener("click", () => {
  void generarInforme();
});

void inicializar();
