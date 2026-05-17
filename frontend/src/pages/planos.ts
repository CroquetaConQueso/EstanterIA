import { authFetch, isStructuralAdmin } from "../lib/api";
import { requireAdminPanelAccess } from "../lib/auth-guard";

requireAdminPanelAccess();

type Orientacion = "HORIZONTAL" | "VERTICAL";
type EstadoVisual = "OCUPADO" | "VACIO" | "ANOMALIA" | "SIN_DATOS" | string;
type EstadoListadoPlanos = "ACTIVOS" | "INACTIVOS" | "TODOS";

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

type PlanoResponsableResponse = {
  trabajadorId: number;
  nombre: string | null;
  apellidos: string | null;
  tipoTrabajador: string | null;
  responsablePrincipal: boolean | null;
};

type TrabajadorAsignadoEstanteriaResponse = {
  trabajadorId: number;
  nombre: string | null;
  apellidos: string | null;
  emailContacto: string | null;
  tipoTrabajador: string | null;
  estadoDisponibilidad: string | null;
  activo: boolean | null;
};

type PlanoZonaOperativaResponse = {
  id: number;
  seccion: SeccionResponse;
  x: number;
  y: number;
  width: number;
  height: number;
  responsables: PlanoResponsableResponse[];
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
  activo: boolean | null;
  empresa: EmpresaResponse;
  zonas: PlanoZonaOperativaResponse[];
  estanterias: PlanoEstanteriaOperativaResponse[];
};

type PlanoResumenResponse = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  ancho: number;
  alto: number;
  activo: boolean | null;
};

const EMPRESA_DEMO = "EMP-DEMO";
const CODIGO_PLANO_DEMO = "PLANO-DEMO";

const planoMeta = document.querySelector<HTMLElement>("#plano-meta");
const planoSelect = document.querySelector<HTMLSelectElement>("#plano-select");
const planoEstadoFilter = document.querySelector<HTMLSelectElement>("#plano-estado-filter");
const btnCrearPlano = document.querySelector<HTMLAnchorElement>("#btn-crear-plano");
const btnEditarPlano = document.querySelector<HTMLAnchorElement>("#btn-editar-plano");
const btnTogglePlano = document.querySelector<HTMLButtonElement>("#btn-toggle-plano");
const listaEstanterias = document.querySelector<HTMLUListElement>("#lista-estanterias");
const tituloPlano = document.querySelector<HTMLElement>("#titulo-plano");
const subtituloPlano = document.querySelector<HTMLElement>("#subtitulo-plano");
const estadoCarga = document.querySelector<HTMLElement>("#estado-carga");
const planoInactivoAviso = document.querySelector<HTMLElement>("#plano-inactivo-aviso");
const planoAccionFeedback = document.querySelector<HTMLElement>("#plano-accion-feedback");
const canvas = document.querySelector<HTMLElement>("#plano-canvas");
const detalleEstanteria = document.querySelector<HTMLElement>("#detalle-estanteria");
const detallePrincipalTitulo = document.querySelector<HTMLElement>("#detalle-principal-titulo");
const detalleSlot = document.querySelector<HTMLElement>("#detalle-slot");
const detalleAlertas = document.querySelector<HTMLElement>("#detalle-alertas");
const planoEstadoModal = document.querySelector<HTMLElement>("#plano-estado-modal");
const planoEstadoModalTitle = document.querySelector<HTMLElement>("#plano-estado-modal-title");
const planoEstadoModalText = document.querySelector<HTMLElement>("#plano-estado-modal-text");
const planoDesactivarConfirmGroup = document.querySelector<HTMLElement>("#plano-desactivar-confirm-group");
const planoDesactivarConfirmInput = document.querySelector<HTMLInputElement>("#plano-desactivar-confirm");
const planoEstadoModalError = document.querySelector<HTMLElement>("#plano-estado-modal-error");
const planoEstadoModalConfirm = document.querySelector<HTMLButtonElement>("#plano-estado-modal-confirm");
const planoEstadoModalCancelButtons = document.querySelectorAll<HTMLElement>("[data-modal-cancel]");

let planoActual: PlanoOperativoResponse | null = null;
let planosDisponibles: PlanoResumenResponse[] = [];
let zonaSeleccionada: PlanoZonaOperativaResponse | null = null;
let estanteriaSeleccionada: PlanoEstanteriaOperativaResponse | null = null;
let slotSeleccionado: PlanoSlotOperativoResponse | null = null;
let accionModalActual: "desactivar" | "reactivar" | null = null;
const trabajadoresPorEstanteria = new Map<string, TrabajadorAsignadoEstanteriaResponse[]>();
const puedeConfigurarEstructura = isStructuralAdmin();

if (!puedeConfigurarEstructura) {
  if (btnCrearPlano) btnCrearPlano.hidden = true;
  if (btnEditarPlano) btnEditarPlano.hidden = true;
  if (btnTogglePlano) btnTogglePlano.hidden = true;
}

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
  RETIRADA_PROGRAMADA_PENDIENTE: "Retirada programada pendiente",
  PRESENCIA_TRAS_RETIRADA_PROGRAMADA: "Presencia tras retirada programada"
};

const prioridadLabels: Record<string, string> = {
  CRITICA: "Crítica",
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja"
};

const disponibilidadLabels: Record<string, string> = {
  DISPONIBLE: "Disponible",
  AUSENTE: "Ausente",
  ENFERMO: "Enfermo"
};

const estadoPlanosPermitidos: EstadoListadoPlanos[] = ["ACTIVOS", "INACTIVOS", "TODOS"];

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

function etiquetaPrioridad(value: string): string {
  return prioridadLabels[value] ?? value.replaceAll("_", " ").toLowerCase();
}

function esAlertaCaducidadRetirada(tipo: string): boolean {
  return tipo === "PRODUCTO_PROXIMO_A_CADUCAR"
    || tipo === "RETIRADA_PROGRAMADA_PENDIENTE"
    || tipo === "PRESENCIA_TRAS_RETIRADA_PROGRAMADA";
}

function slotTieneAlertaCaducidadRetirada(slot: PlanoSlotOperativoResponse): boolean {
  return slot.tiposAlertas.some(esAlertaCaducidadRetirada);
}

function estanteriaTieneAlertaCaducidadRetirada(estanteria: PlanoEstanteriaOperativaResponse): boolean {
  return estanteria.alertasAbiertas.some((alerta) => esAlertaCaducidadRetirada(alerta.tipo))
    || estanteria.slots.some(slotTieneAlertaCaducidadRetirada);
}

function totalTareas(estanterias: PlanoEstanteriaOperativaResponse[]): number {
  return estanterias.reduce((total, estanteria) => total + estanteria.tareasActivas.length, 0);
}

function totalAlertasCaducidadRetirada(estanterias: PlanoEstanteriaOperativaResponse[]): number {
  return estanterias.reduce((total, estanteria) =>
    total + estanteria.alertasAbiertas.filter((alerta) => esAlertaCaducidadRetirada(alerta.tipo)).length, 0);
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

function nombreResponsable(responsable: PlanoResponsableResponse): string {
  return [responsable.nombre, responsable.apellidos].filter(Boolean).join(" ").trim()
    || `Trabajador #${responsable.trabajadorId}`;
}

function textoResponsables(responsables: PlanoResponsableResponse[]): string {
  if (responsables.length === 0) return "Sin responsable asignado";
  const principal = responsables.find((responsable) => responsable.responsablePrincipal) ?? responsables[0];
  return nombreResponsable(principal);
}

function nombreTrabajador(trabajador: TrabajadorAsignadoEstanteriaResponse): string {
  return [trabajador.nombre, trabajador.apellidos].filter(Boolean).join(" ").trim()
    || `Trabajador #${trabajador.trabajadorId}`;
}

function etiquetaDisponibilidad(value: string | null | undefined): string {
  if (!value) return "Disponible";
  return disponibilidadLabels[value] ?? value.replaceAll("_", " ").toLowerCase();
}

function claseDisponibilidad(value: string | null | undefined): string {
  if (value === "AUSENTE") return "is-absent";
  if (value === "ENFERMO") return "is-sick";
  return "is-available";
}

function plural(count: number, singular: string, pluralText: string): string {
  return `${count} ${count === 1 ? singular : pluralText}`;
}

function estanteriasDeZona(plano: PlanoOperativoResponse, zonaId: number): PlanoEstanteriaOperativaResponse[] {
  return plano.estanterias.filter((estanteria) => estanteria.zonaId === zonaId);
}

function estanteriaActiva(estanteria: PlanoEstanteriaOperativaResponse): boolean {
  return estanteria.estanteria.activa !== false;
}

function textoEstadoOperativo(estanteria: PlanoEstanteriaOperativaResponse): string {
  return estanteriaActiva(estanteria) ? "Activa" : "Inactiva";
}

function totalAlertas(estanterias: PlanoEstanteriaOperativaResponse[]): number {
  return estanterias.reduce((total, estanteria) => total + estanteria.alertasAbiertas.length, 0);
}

function setTexto(element: HTMLElement | null, text: string): void {
  if (element) element.textContent = text;
}

function setHtml(element: HTMLElement | null, html: string): void {
  if (element) element.innerHTML = html;
}

function setFeedback(message: string | null, kind: "ok" | "error" | "info" = "info"): void {
  if (!planoAccionFeedback) return;
  if (!message) {
    planoAccionFeedback.hidden = true;
    planoAccionFeedback.textContent = "";
    planoAccionFeedback.className = "plan-action-feedback";
    return;
  }
  planoAccionFeedback.hidden = false;
  planoAccionFeedback.textContent = message;
  planoAccionFeedback.className = `plan-action-feedback is-${kind}`;
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
  if (status >= 500) return "El servidor no pudo cargar el plano operativo.";
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

async function patchJson<T>(url: string): Promise<T> {
  const response = await authFetch(url, {
    method: "PATCH",
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

async function cargarTrabajadoresEstanteria(codigo: string): Promise<TrabajadorAsignadoEstanteriaResponse[]> {
  if (trabajadoresPorEstanteria.has(codigo)) {
    return trabajadoresPorEstanteria.get(codigo) ?? [];
  }

  const trabajadores = await fetchJson<TrabajadorAsignadoEstanteriaResponse[]>(
    `/api/estanterias/${encodeURIComponent(codigo)}/trabajadores`
  );
  trabajadoresPorEstanteria.set(codigo, trabajadores);
  return trabajadores;
}

function getCodigoQueryParam(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("codigo")?.trim() || null;
}

function getEstadoQueryParam(): EstadoListadoPlanos {
  const params = new URLSearchParams(window.location.search);
  const estado = params.get("estado")?.trim().toUpperCase();
  return estadoPlanosPermitidos.includes(estado as EstadoListadoPlanos) ? estado as EstadoListadoPlanos : "ACTIVOS";
}

function estadoPlanosSeleccionado(): EstadoListadoPlanos {
  const estado = planoEstadoFilter?.value as EstadoListadoPlanos | undefined;
  return estadoPlanosPermitidos.includes(estado as EstadoListadoPlanos) ? estado as EstadoListadoPlanos : "ACTIVOS";
}

function actualizarUrlPlano(codigo: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set("codigo", codigo);
  const estado = estadoPlanosSeleccionado();
  if (estado === "ACTIVOS") {
    url.searchParams.delete("estado");
  } else {
    url.searchParams.set("estado", estado);
  }
  window.history.replaceState({}, "", url);
}

function renderSelectorPlanos(codigoSeleccionado: string | null): void {
  if (!planoSelect) return;

  planoSelect.innerHTML = "";

  if (planosDisponibles.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = mensajeSinPlanos(estadoPlanosSeleccionado());
    planoSelect.appendChild(option);
    planoSelect.disabled = true;
    return;
  }

  planoSelect.disabled = false;
  const contieneSeleccionado = codigoSeleccionado
    ? planosDisponibles.some((plano) => plano.codigo === codigoSeleccionado)
    : true;
  planosDisponibles.forEach((plano) => {
    const option = document.createElement("option");
    option.value = plano.codigo;
    option.textContent = `${plano.codigo} · ${plano.nombre} · ${plano.activo === false ? "Inactivo" : "Activo"}`;
    option.selected = plano.codigo === codigoSeleccionado;
    planoSelect.appendChild(option);
  });

  if (codigoSeleccionado && !contieneSeleccionado && planoActual?.codigo === codigoSeleccionado) {
    const option = document.createElement("option");
    option.value = planoActual.codigo;
    option.textContent = `${planoActual.codigo} · ${planoActual.nombre} · ${planoActual.activo === false ? "Inactivo" : "Activo"}`;
    option.selected = true;
    planoSelect.appendChild(option);
    planoSelect.disabled = false;
  }
}

function seleccionarCodigoInicial(planos: PlanoResumenResponse[], codigoQuery: string | null): string | null {
  if (codigoQuery && planos.some((plano) => plano.codigo === codigoQuery)) return codigoQuery;
  const demo = planos.find((plano) => plano.codigo === CODIGO_PLANO_DEMO);
  if (demo) return demo.codigo;
  return planos.find((plano) => plano.activo !== false)?.codigo ?? planos[0]?.codigo ?? null;
}

function mensajeSinPlanos(estado: EstadoListadoPlanos): string {
  if (estado === "INACTIVOS") return "No hay planos inactivos.";
  if (estado === "TODOS") return "No hay planos registrados.";
  return "No hay planos activos.";
}

function renderEstadoPlano(plano: PlanoOperativoResponse | null): void {
  const inactivo = plano?.activo === false;
  if (planoInactivoAviso) {
    planoInactivoAviso.hidden = !inactivo;
  }

  if (!btnTogglePlano) return;
  if (!puedeConfigurarEstructura || !plano) {
    btnTogglePlano.hidden = true;
    return;
  }

  btnTogglePlano.hidden = false;
  btnTogglePlano.textContent = inactivo ? "Reactivar plano" : "Desactivar plano";
  btnTogglePlano.classList.toggle("danger", !inactivo);
  btnTogglePlano.classList.toggle("plan-action-primary", inactivo);
}

function cerrarModalEstadoPlano(): void {
  accionModalActual = null;
  if (planoEstadoModal) planoEstadoModal.hidden = true;
  if (planoDesactivarConfirmInput) planoDesactivarConfirmInput.value = "";
  if (planoEstadoModalError) {
    planoEstadoModalError.hidden = true;
    planoEstadoModalError.textContent = "";
  }
  if (planoEstadoModalConfirm) {
    planoEstadoModalConfirm.disabled = true;
  }
}

function actualizarEstadoConfirmacionModal(): void {
  if (!planoEstadoModalConfirm) return;
  if (accionModalActual === "reactivar") {
    planoEstadoModalConfirm.disabled = false;
    return;
  }
  planoEstadoModalConfirm.disabled = planoDesactivarConfirmInput?.value !== "DESACTIVAR";
}

function abrirModalEstadoPlano(accion: "desactivar" | "reactivar"): void {
  if (!planoActual || !planoEstadoModal || !planoEstadoModalConfirm) return;
  accionModalActual = accion;
  const desactivar = accion === "desactivar";

  if (planoEstadoModalTitle) {
    planoEstadoModalTitle.textContent = desactivar ? "Desactivar plano" : "Reactivar plano";
  }
  if (planoEstadoModalText) {
    planoEstadoModalText.textContent = desactivar
      ? "El plano dejará de aparecer en los flujos operativos por defecto. Se conservarán sus zonas, estanterías, inspecciones, alertas, tareas e histórico."
      : "El plano volverá a aparecer en los flujos operativos normales.";
  }
  if (planoDesactivarConfirmGroup) {
    planoDesactivarConfirmGroup.hidden = !desactivar;
  }
  if (planoDesactivarConfirmInput) {
    planoDesactivarConfirmInput.value = "";
  }
  if (planoEstadoModalError) {
    planoEstadoModalError.hidden = true;
    planoEstadoModalError.textContent = "";
  }

  planoEstadoModalConfirm.textContent = desactivar ? "Desactivar plano" : "Reactivar plano";
  planoEstadoModalConfirm.classList.toggle("danger", desactivar);
  planoEstadoModalConfirm.classList.toggle("plan-action-primary", !desactivar);
  planoEstadoModal.hidden = false;
  actualizarEstadoConfirmacionModal();

  if (desactivar) {
    planoDesactivarConfirmInput?.focus();
  } else {
    planoEstadoModalConfirm.focus();
  }
}

async function ejecutarCambioEstadoPlano(): Promise<void> {
  if (!accionModalActual || !planoActual || !planoEstadoModalConfirm) return;
  const accion = accionModalActual;
  const codigo = planoActual.codigo;
  const reactivar = accion === "reactivar";

  planoEstadoModalConfirm.disabled = true;
  setTexto(estadoCarga, reactivar ? "Reactivando" : "Desactivando");

  try {
    await patchJson<unknown>(`/api/planos/${encodeURIComponent(codigo)}/${accion}`);
    cerrarModalEstadoPlano();
    const successMessage = reactivar ? "Plano reactivado correctamente." : "Plano desactivado. Se conserva su histórico operativo.";

    const estado = estadoPlanosSeleccionado();
    if ((!reactivar && estado === "ACTIVOS") || (reactivar && estado === "INACTIVOS")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("codigo");
      window.history.replaceState({}, "", url);
    }
    await cargarPlanosDisponibles();
    setFeedback(successMessage, "ok");
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo actualizar el estado del plano.";
    if (planoEstadoModalError) {
      planoEstadoModalError.hidden = false;
      planoEstadoModalError.textContent = message;
    }
    setTexto(estadoCarga, "Error");
    actualizarEstadoConfirmacionModal();
  }
}

function renderListaEstanterias(plano: PlanoOperativoResponse): void {
  if (!listaEstanterias) return;

  listaEstanterias.innerHTML = "";
  if (plano.zonas.length === 0) {
    const item = document.createElement("li");
    item.className = "plan-item";
    item.textContent = "El plano no tiene zonas configuradas.";
    listaEstanterias.appendChild(item);
    return;
  }

  plano.zonas.forEach((zona) => {
    const estanterias = estanteriasDeZona(plano, zona.id);
    const alertasZona = totalAlertas(estanterias);
    const tareasZona = totalTareas(estanterias);
    const alertasCaducidadZona = totalAlertasCaducidadRetirada(estanterias);
    const item = document.createElement("li");
    item.className = `plan-item tree-zone${zonaSeleccionada?.id === zona.id ? " is-active" : ""}`;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "plan-list-button";
    button.addEventListener("click", () => seleccionarZona(zona));

    const title = document.createElement("span");
    title.className = "plan-title";
    const zoneName = document.createElement("strong");
    zoneName.textContent = zona.seccion.nombre;
    const zoneCode = document.createElement("span");
    zoneCode.textContent = zona.seccion.codigo;
    title.append(zoneName, zoneCode);

    const meta = document.createElement("span");
    meta.className = "plan-meta";
    const responsible = document.createElement("span");
    responsible.className = "tree-meta-line";
    responsible.textContent = `Responsable: ${textoResponsables(zona.responsables)}`;
    const summary = document.createElement("span");
    summary.className = "tree-meta-line tree-summary";
    summary.textContent = [
      plural(estanterias.length, "estantería", "estanterías"),
      plural(alertasZona, "alerta", "alertas"),
      plural(tareasZona, "tarea activa", "tareas activas")
    ].join(" · ");
    meta.append(responsible, summary);

    if (alertasCaducidadZona > 0) {
      const expiry = document.createElement("span");
      expiry.className = "tree-badge is-expiry";
      expiry.textContent = "Alerta de caducidad/retirada";
      meta.appendChild(expiry);
    }

    button.append(title, meta);
    item.appendChild(button);

    const childList = document.createElement("ul");
    childList.className = "tree-rack-list";
    if (estanterias.length === 0) {
      const empty = document.createElement("li");
      empty.className = "tree-rack-empty";
      empty.textContent = "Sin estanterías colocadas";
      childList.appendChild(empty);
    } else {
      estanterias.forEach((estanteria) => {
        const activa = estanteriaActiva(estanteria);
        const rackItem = document.createElement("li");
        rackItem.className = `tree-rack-item${estanteriaSeleccionada?.layoutId === estanteria.layoutId ? " is-active" : ""}${activa ? "" : " is-inactive"}`;
        const rackButton = document.createElement("button");
        rackButton.type = "button";
        rackButton.className = "tree-rack-button";
        rackButton.addEventListener("click", (event) => {
          event.stopPropagation();
          seleccionarEstanteria(estanteria, null);
        });

        const rackTitle = document.createElement("span");
        rackTitle.className = "plan-title";
        const rackCode = document.createElement("strong");
        rackCode.textContent = estanteria.estanteria.codigo;
        const rackName = document.createElement("span");
        rackName.textContent = estanteria.estanteria.nombre;
        rackTitle.append(rackCode, rackName);

        const rackMeta = document.createElement("span");
        rackMeta.className = "plan-meta";
        const operationalState = document.createElement("span");
        operationalState.className = activa ? "operational-state" : "operational-state is-inactive";
        operationalState.textContent = activa ? "Activa" : "Inactiva · histórico conservado";
        const visualState = document.createElement("span");
        visualState.className = "tree-meta-line";
        visualState.textContent = `Estado visual: ${etiquetaEstado(estanteria.ultimaInspeccion?.estadoGeneralVisual)}`;
        const alertsState = document.createElement("span");
        alertsState.className = "tree-meta-line tree-summary";
        alertsState.textContent = estanteria.alertasAbiertas.length === 0
          ? "Sin alertas abiertas"
          : plural(estanteria.alertasAbiertas.length, "alerta", "alertas");
        const taskState = document.createElement("span");
        taskState.className = "tree-meta-line";
        taskState.textContent = estanteria.tareasActivas.length === 0
          ? "Sin tareas activas"
          : plural(estanteria.tareasActivas.length, "tarea activa", "tareas activas");
        rackMeta.append(operationalState, visualState, alertsState, taskState);

        if (estanteriaTieneAlertaCaducidadRetirada(estanteria)) {
          const expiry = document.createElement("span");
          expiry.className = "tree-badge is-expiry";
          expiry.textContent = "Alerta de caducidad/retirada";
          rackMeta.appendChild(expiry);
        }

        rackButton.append(rackTitle, rackMeta);
        rackItem.appendChild(rackButton);
        childList.appendChild(rackItem);
      });
    }
    item.appendChild(childList);
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
    zonaNode.className = `zone-node${zonaSeleccionada?.id === zona.id ? " is-selected" : ""}`;
    zonaNode.tabIndex = 0;
    zonaNode.role = "button";
    zonaNode.setAttribute("aria-label", `Sección ${zona.seccion.codigo}`);
    posicionar(zonaNode, zona.x, zona.y, zona.width, zona.height, plano);
    zonaNode.addEventListener("click", () => seleccionarZona(zona));
    zonaNode.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        seleccionarZona(zona);
      }
    });

    const label = document.createElement("span");
    label.className = "zone-label";
    label.textContent = zona.seccion.nombre;
    zonaNode.appendChild(label);
    canvas.appendChild(zonaNode);
  });

  plano.estanterias.forEach((estanteria) => {
    const activa = estanteriaActiva(estanteria);
    const rack = document.createElement("div");
    rack.className = `rack-node ${claseEstado(estanteria.ultimaInspeccion?.estadoGeneralVisual)}${estanteriaSeleccionada?.layoutId === estanteria.layoutId ? " is-selected" : ""}${activa ? "" : " is-inactive"}`;
    rack.tabIndex = 0;
    rack.role = "button";
    rack.setAttribute("aria-label", `Estantería ${estanteria.estanteria.codigo}${activa ? "" : " inactiva"}`);
    posicionar(rack, estanteria.x, estanteria.y, estanteria.width, estanteria.height, plano);
    rack.addEventListener("click", (event) => {
      event.stopPropagation();
      seleccionarEstanteria(estanteria, null);
    });
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

    if (!activa) {
      const inactiveLabel = document.createElement("span");
      inactiveLabel.className = "rack-status";
      inactiveLabel.textContent = "INACTIVA";
      rack.appendChild(inactiveLabel);
    }

    const slotsWrap = document.createElement("span");
    slotsWrap.className = `rack-slots ${estanteria.orientacion.toLowerCase()}`;

    estanteria.slots.forEach((slot) => {
      const alertaCaducidadRetirada = slotTieneAlertaCaducidadRetirada(slot);
      const slotButton = document.createElement("button");
      slotButton.type = "button";
      slotButton.className = `slot-node ${claseEstado(slot.estadoVisual)}${slot.tieneAlertaAbierta ? " has-slot-alert" : ""}${alertaCaducidadRetirada ? " has-expiry-alert" : ""}${slotSeleccionado?.slotId === slot.slotId && estanteriaSeleccionada?.layoutId === estanteria.layoutId ? " is-selected" : ""}`;
      slotButton.setAttribute("aria-label", `${slot.slotId}: ${etiquetaEstado(slot.estadoVisual)}${alertaCaducidadRetirada ? ", alerta de caducidad o retirada activa" : ""}`);
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
  setTexto(detallePrincipalTitulo, "Detalle de estantería");

  if (!estanteria) {
    setTexto(detallePrincipalTitulo, "Detalle de sección");
    setHtml(detalleEstanteria, "<p>Selecciona una sección o estantería del plano para ver su detalle.</p>");
    return;
  }

  const inspeccion = estanteria.ultimaInspeccion;
  detalleEstanteria.innerHTML = "";
  detalleEstanteria.append(
    crearLineaDetalle("Código", estanteria.estanteria.codigo),
    crearLineaDetalle("Nombre", estanteria.estanteria.nombre),
    crearLineaDetalle("Estado operativo", textoEstadoOperativo(estanteria)),
    crearLineaDetalle("Estado visual", etiquetaEstado(inspeccion?.estadoGeneralVisual)),
    crearLineaDetalle("Última inspección", inspeccion ? `#${inspeccion.id} · ${formatFecha(inspeccion.capturadaEn ?? inspeccion.createdAt)}` : "Sin inspección reciente"),
    crearLineaDetalle("Ocupados", textoSeguro(inspeccion?.ocupados, "0")),
    crearLineaDetalle("Vacíos", textoSeguro(inspeccion?.vacios, "0")),
    crearLineaDetalle("Anomalías", textoSeguro(inspeccion?.anomalias, "0")),
    crearLineaDetalle("Caducidad/retirada", estanteriaTieneAlertaCaducidadRetirada(estanteria) ? "Alerta de caducidad/retirada activa" : "Sin alerta de caducidad/retirada"),
    crearLineaDetalle("Alertas abiertas", String(estanteria.alertasAbiertas.length)),
    crearLineaDetalle("Tareas activas", String(estanteria.tareasActivas.length))
  );

  if (!estanteriaActiva(estanteria)) {
    const note = document.createElement("p");
    note.className = "inactive-note";
    note.textContent = "Esta estantería está retirada de nuevas operaciones, pero conserva su histórico.";
    detalleEstanteria.appendChild(note);
  }

  const workersBlock = document.createElement("div");
  workersBlock.className = "assigned-workers";
  const workersTitle = document.createElement("h4");
  workersTitle.textContent = "Trabajadores asignados";
  const workersContent = document.createElement("div");
  workersContent.className = "assigned-workers-content";
  workersContent.textContent = "Cargando trabajadores asignados...";
  workersBlock.append(workersTitle, workersContent);
  detalleEstanteria.appendChild(workersBlock);

  const codigo = estanteria.estanteria.codigo;
  const layoutId = estanteria.layoutId;
  void cargarTrabajadoresEstanteria(codigo)
    .then((trabajadores) => {
      if (estanteriaSeleccionada?.layoutId !== layoutId) return;
      renderTrabajadoresAsignados(workersContent, trabajadores);
    })
    .catch(() => {
      if (estanteriaSeleccionada?.layoutId !== layoutId) return;
      workersContent.textContent = "No se pudieron cargar los trabajadores asignados.";
    });
}

function renderTrabajadoresAsignados(container: HTMLElement, trabajadores: TrabajadorAsignadoEstanteriaResponse[]): void {
  container.innerHTML = "";

  if (trabajadores.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-note";
    empty.textContent = "Sin trabajadores asignados";
    container.appendChild(empty);
    return;
  }

  const list = document.createElement("ul");
  list.className = "assigned-workers-list";
  trabajadores.forEach((trabajador) => {
    const item = document.createElement("li");
    item.className = "worker-item";

    const name = document.createElement("strong");
    name.textContent = nombreTrabajador(trabajador);

    const badge = document.createElement("span");
    badge.className = `worker-badge ${claseDisponibilidad(trabajador.estadoDisponibilidad)}`;
    badge.textContent = etiquetaDisponibilidad(trabajador.estadoDisponibilidad);

    item.append(name, badge);
    list.appendChild(item);
  });
  container.appendChild(list);
}

function renderDetalleZona(zona: PlanoZonaOperativaResponse | null): void {
  if (!detalleEstanteria) return;
  setTexto(detallePrincipalTitulo, "Detalle de sección");

  if (!zona || !planoActual) {
    setHtml(detalleEstanteria, "<p>Selecciona una sección del plano para ver su detalle.</p>");
    return;
  }

  const estanterias = estanteriasDeZona(planoActual, zona.id);
  detalleEstanteria.innerHTML = "";
  detalleEstanteria.append(
    crearLineaDetalle("Código", zona.seccion.codigo),
    crearLineaDetalle("Nombre", zona.seccion.nombre),
    crearLineaDetalle("Descripción", textoSeguro(zona.seccion.descripcion)),
    crearLineaDetalle("Responsable", textoResponsables(zona.responsables)),
    crearLineaDetalle("Estanterías", String(estanterias.length)),
    crearLineaDetalle("Alertas abiertas", String(totalAlertas(estanterias))),
    crearLineaDetalle("Tareas activas", String(totalTareas(estanterias))),
    crearLineaDetalle("Caducidad/retirada", totalAlertasCaducidadRetirada(estanterias) > 0 ? `${totalAlertasCaducidadRetirada(estanterias)} alertas activas` : "Sin alertas de caducidad/retirada")
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
    crearLineaDetalle("Caducidad/retirada", slotTieneAlertaCaducidadRetirada(slot) ? "Alerta de caducidad/retirada activa" : "Sin alerta de caducidad/retirada"),
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
    list.className = "ops-list";
    estanteria.alertasAbiertas.forEach((alerta) => {
      const item = document.createElement("li");
      item.className = `ops-item${esAlertaCaducidadRetirada(alerta.tipo) ? " is-expiry" : ""}`;
      const title = document.createElement("strong");
      title.textContent = `#${alerta.id} · ${etiquetaAlerta(alerta.tipo)}`;
      const meta = document.createElement("span");
      meta.textContent = `Prioridad: ${etiquetaPrioridad(alerta.prioridad)} · Slot: ${textoSeguro(alerta.slotId, "sin slot")}`;
      item.append(title, meta);
      list.appendChild(item);
    });
    detalleAlertas.appendChild(list);
  }

  if (estanteria.tareasActivas.length > 0) {
    const title = document.createElement("h4");
    title.textContent = "Tareas activas";
    const tareas = document.createElement("ul");
    tareas.className = "ops-list";
    estanteria.tareasActivas.forEach((tarea) => {
      const item = document.createElement("li");
      item.className = "ops-item";
      const taskTitle = document.createElement("strong");
      taskTitle.textContent = `#${tarea.id} · ${tarea.titulo}`;
      const taskMeta = document.createElement("span");
      taskMeta.textContent = `Estado: ${etiquetaEstado(tarea.estadoTarea)} · Prioridad: ${etiquetaPrioridad(tarea.prioridad)}`;
      item.append(taskTitle, taskMeta);
      tareas.appendChild(item);
    });
    detalleAlertas.append(title, tareas);
  }
}

function renderDetalleAlertasZona(zona: PlanoZonaOperativaResponse | null): void {
  if (!detalleAlertas) return;

  if (!zona || !planoActual) {
    setHtml(detalleAlertas, "<p>Selecciona una sección para ver sus alertas agregadas.</p>");
    return;
  }

  const alertas = estanteriasDeZona(planoActual, zona.id).flatMap((estanteria) =>
    estanteria.alertasAbiertas.map((alerta) => ({ alerta, estanteria }))
  );
  detalleAlertas.innerHTML = "";

  if (alertas.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Sin alertas abiertas en la sección.";
    detalleAlertas.appendChild(empty);
    return;
  }

  const list = document.createElement("ul");
  list.className = "ops-list";
  alertas.forEach(({ alerta, estanteria }) => {
    const item = document.createElement("li");
    item.className = `ops-item${esAlertaCaducidadRetirada(alerta.tipo) ? " is-expiry" : ""}`;
    const title = document.createElement("strong");
    title.textContent = `${estanteria.estanteria.codigo} · #${alerta.id} · ${etiquetaAlerta(alerta.tipo)}`;
    const meta = document.createElement("span");
    meta.textContent = `Prioridad: ${etiquetaPrioridad(alerta.prioridad)} · Slot: ${textoSeguro(alerta.slotId, "sin slot")}`;
    item.append(title, meta);
    list.appendChild(item);
  });
  detalleAlertas.appendChild(list);
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
  zonaSeleccionada = null;
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

function seleccionarZona(zona: PlanoZonaOperativaResponse): void {
  zonaSeleccionada = zona;
  estanteriaSeleccionada = null;
  slotSeleccionado = null;

  if (planoActual) {
    renderListaEstanterias(planoActual);
    renderCanvas(planoActual);
  }
  renderDetalleZona(zonaSeleccionada);
  renderDetalleSlot(null);
  renderDetalleAlertasZona(zonaSeleccionada);
}

function renderPlano(plano: PlanoOperativoResponse): void {
  planoActual = plano;
  zonaSeleccionada = plano.zonas[0] ?? null;
  estanteriaSeleccionada = null;
  slotSeleccionado = null;
  trabajadoresPorEstanteria.clear();

  const estadoPlano = plano.activo === false ? "Inactivo" : "Activo";
  setTexto(planoMeta, `${plano.codigo} · ${plano.empresa.nombre} · ${plano.ancho} x ${plano.alto} · ${estadoPlano}`);
  setTexto(tituloPlano, plano.nombre);
  setTexto(subtituloPlano, plano.descripcion ?? "Plano operativo persistido");
  setTexto(estadoCarga, plano.activo === false ? "Inactivo" : "Operativo");
  if (btnEditarPlano) {
    btnEditarPlano.href = `editor.html?codigo=${encodeURIComponent(plano.codigo)}`;
    if (puedeConfigurarEstructura) {
      btnEditarPlano.hidden = false;
      btnEditarPlano.removeAttribute("aria-disabled");
    }
  }
  renderSelectorPlanos(plano.codigo);
  renderEstadoPlano(plano);

  renderListaEstanterias(plano);
  renderCanvas(plano);
  renderDetalleZona(zonaSeleccionada);
  renderDetalleSlot(null);
  renderDetalleAlertasZona(zonaSeleccionada);
}

function renderError(message: string): void {
  zonaSeleccionada = null;
  estanteriaSeleccionada = null;
  slotSeleccionado = null;
  setTexto(planoMeta, "Sin plano operativo");
  setTexto(tituloPlano, "Plano no disponible");
  setTexto(subtituloPlano, message);
  setTexto(estadoCarga, "Error");
  renderEstadoPlano(null);
  if (btnEditarPlano) {
    btnEditarPlano.href = "editor.html";
    btnEditarPlano.setAttribute("aria-disabled", "true");
  }
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

function renderSinPlanos(): void {
  planoActual = null;
  zonaSeleccionada = null;
  estanteriaSeleccionada = null;
  slotSeleccionado = null;
  const estado = estadoPlanosSeleccionado();
  const mensaje = mensajeSinPlanos(estado);
  renderSelectorPlanos(null);
  setTexto(planoMeta, mensaje);
  setTexto(tituloPlano, "Sin planos configurados");
  setTexto(subtituloPlano, estado === "ACTIVOS"
    ? "Crea un plano nuevo o cambia a Inactivos/Todos para consultar históricos."
    : "Cambia el filtro de visualización o crea un nuevo plano si necesitas configurar uno.");
  setTexto(estadoCarga, "Sin planos");
  renderEstadoPlano(null);
  if (btnEditarPlano) {
    btnEditarPlano.href = "editor.html";
    btnEditarPlano.setAttribute("aria-disabled", "true");
  }
  if (canvas) {
    canvas.innerHTML = "";
    const empty = document.createElement("span");
    empty.innerHTML = puedeConfigurarEstructura
      ? `${mensaje}<br><a class="canvas-empty-link" href="editor.html">Crear plano</a>`
      : mensaje;
    canvas.appendChild(empty);
  }
  if (listaEstanterias) {
    listaEstanterias.innerHTML = `<li class="plan-item">${mensaje}</li>`;
  }
  renderDetalleEstanteria(null);
  renderDetalleSlot(null);
  renderDetalleAlertas(null);
}

async function cargarPlanoOperativo(codigo: string): Promise<void> {
  setTexto(estadoCarga, "Cargando");
  setFeedback(null);

  try {
    const plano = await fetchJson<PlanoOperativoResponse>(`/api/planos/${encodeURIComponent(codigo)}/operativo`);
    actualizarUrlPlano(plano.codigo);
    renderPlano(plano);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo cargar el plano operativo.";
    renderError(message);
  }
}

async function cargarPlanosDisponibles(): Promise<void> {
  setTexto(estadoCarga, "Cargando");
  setFeedback(null);
  if (planoSelect) planoSelect.disabled = true;
  if (planoEstadoFilter) planoEstadoFilter.disabled = true;
  const codigoQuery = getCodigoQueryParam();
  const estado = estadoPlanosSeleccionado();

  try {
    planosDisponibles = await fetchJson<PlanoResumenResponse[]>(
      `/api/empresas/${encodeURIComponent(EMPRESA_DEMO)}/planos?estado=${encodeURIComponent(estado)}`
    );
    const codigoInicial = seleccionarCodigoInicial(planosDisponibles, codigoQuery);

    if (!codigoInicial) {
      renderSinPlanos();
      return;
    }

    renderSelectorPlanos(codigoInicial);
    await cargarPlanoOperativo(codigoInicial);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudieron cargar los planos disponibles.";
    setFeedback(message, "error");
    renderError(message);
  } finally {
    if (planoEstadoFilter) planoEstadoFilter.disabled = false;
  }
}

planoSelect?.addEventListener("change", () => {
  const codigo = planoSelect.value;
  if (codigo) void cargarPlanoOperativo(codigo);
});

planoEstadoFilter?.addEventListener("change", () => {
  const url = new URL(window.location.href);
  url.searchParams.delete("codigo");
  const estado = estadoPlanosSeleccionado();
  if (estado === "ACTIVOS") {
    url.searchParams.delete("estado");
  } else {
    url.searchParams.set("estado", estado);
  }
  window.history.replaceState({}, "", url);
  void cargarPlanosDisponibles();
});

btnTogglePlano?.addEventListener("click", async () => {
  if (!planoActual) return;
  abrirModalEstadoPlano(planoActual.activo === false ? "reactivar" : "desactivar");
});

planoDesactivarConfirmInput?.addEventListener("input", actualizarEstadoConfirmacionModal);
planoEstadoModalConfirm?.addEventListener("click", () => {
  void ejecutarCambioEstadoPlano();
});
planoEstadoModalCancelButtons.forEach((button) => {
  button.addEventListener("click", cerrarModalEstadoPlano);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !planoEstadoModal?.hidden) {
    cerrarModalEstadoPlano();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  if (planoEstadoFilter) {
    planoEstadoFilter.value = getEstadoQueryParam();
  }
  void cargarPlanosDisponibles();
});
