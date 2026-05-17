import { authFetch, isStructuralAdmin } from "../lib/api";
import { requireAdminPanelAccess } from "../lib/auth-guard";
import { imageFallbackText, normalizeImageUrl } from "../lib/image-paths";

requireAdminPanelAccess();

type EstadoInspeccion = "CREADA" | "ACTUALIZADA" | "LISTA" | string;
type EstadoGeneralVisual = "OK" | "HUECOS_VACIOS" | "ANOMALIAS" | "MIXTO" | string;
type EstadoVisualSlot = "OCUPADO" | "VACIO" | "ANOMALIA" | string;

type ImagenVisualResponse = {
    nombreArchivo: string | null;
    ruta: string | null;
};

type ResumenVisualResponse = {
    estadoGeneralVisual: EstadoGeneralVisual;
    slotsTotales: number;
    ocupados: number;
    vacios: number;
    anomalias: number;
    hayHuecosVacios: boolean;
    hayAnomalias: boolean;
};

type SlotVisualResponse = {
    slotId: string;
    orden: number;
    estadoVisual: EstadoVisualSlot;
    confianza: number | null;
};

type ResultadoVisualResponse = {
    estanteriaCodigo: string;
    modeloVersion: string | null;
    capturadaEn: string | null;
    imagen: ImagenVisualResponse | null;
    resumen: ResumenVisualResponse | null;
    slots: SlotVisualResponse[];
};

type InspeccionDetalleResponse = {
    id: number;
    estanteriaCodigo: string;
    notas: string | null;
    imagenPath: string | null;
    estado: EstadoInspeccion;
    createdAt: string;
    resultadoVisual: ResultadoVisualResponse | null;
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

type EstanteriaConSeccion = EstanteriaResumenResponse & {
    seccion: SeccionResponse;
};

type ApiErrorResponse = {
    message?: string;
};

type CapturaResponse = {
    fileName: string;
    relativePath: string;
    imageUrl: string;
    sizeBytes: number | null;
    createdAt: string | null;
};

const estadoCarga = document.querySelector<HTMLElement>("#detalle-estado-carga");
const errorEl = document.querySelector<HTMLElement>("#detalle-error");
const imagenEl = document.querySelector<HTMLElement>("#detalle-imagen");
const imagenActionsEl = document.querySelector<HTMLElement>("#detalle-imagen-acciones");
const cambiarImagenBtn = document.querySelector<HTMLButtonElement>("#btn-cambiar-imagen");
const quitarImagenBtn = document.querySelector<HTMLButtonElement>("#btn-quitar-imagen");
const resumenEl = document.querySelector<HTMLUListElement>("#detalle-resumen");
const visualEl = document.querySelector<HTMLUListElement>("#detalle-visual");
const slotsEl = document.querySelector<HTMLUListElement>("#detalle-slots");
const imagenDialog = document.querySelector<HTMLDialogElement>("#imagen-dialog");
const capturaSelect = document.querySelector<HTMLSelectElement>("#imagen-captura-select");
const capturaPreview = document.querySelector<HTMLElement>("#imagen-captura-preview");
const imagenDialogHelp = document.querySelector<HTMLElement>("#imagen-dialog-help");
const guardarImagenBtn = document.querySelector<HTMLButtonElement>("#btn-guardar-imagen");
const cancelarImagenBtn = document.querySelector<HTMLButtonElement>("#btn-cancelar-imagen");

const EMPRESA_CODIGO = "EMP-DEMO";

let estanteriasPorCodigo = new Map<string, EstanteriaConSeccion>();
let inspeccionActual: InspeccionDetalleResponse | null = null;
let capturasDisponibles: CapturaResponse[] = [];
const puedeEditarImagen = isStructuralAdmin();

function setError(msg: string | null) {
    if (!errorEl) return;

    if (!msg) {
        errorEl.textContent = "";
        errorEl.setAttribute("hidden", "");
        return;
    }

    errorEl.textContent = msg;
    errorEl.removeAttribute("hidden");
}

function setEstadoCarga(msg: string) {
    if (estadoCarga) estadoCarga.textContent = msg;
}

function clearElement(el: Element | null) {
    if (!el) return;
    el.innerHTML = "";
}

function addListItem(list: HTMLUListElement | null, label: string, value: string) {
    if (!list) return;

    const li = document.createElement("li");
    const strong = document.createElement("strong");
    strong.textContent = `${label}:`;
    li.append(strong, ` ${value}`);
    list.appendChild(li);
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
    if (value === null || value === undefined) return "Sin confianza";
    return `${Math.round(value * 100)}%`;
}

function getImagenPath(inspeccion: InspeccionDetalleResponse): string | null {
    return inspeccion.resultadoVisual?.imagen?.ruta || inspeccion.imagenPath || null;
}

function getEstanteriaInfo(codigo: string): EstanteriaConSeccion | null {
    return estanteriasPorCodigo.get(codigo) ?? null;
}

async function parseErrorResponse(res: Response): Promise<ApiErrorResponse | null> {
    try {
        const text = await res.text();
        return text ? JSON.parse(text) as ApiErrorResponse : null;
    } catch {
        return null;
    }
}

function getBackendErrorMessage(data: ApiErrorResponse | null, status: number): string {
    if (data?.message) return data.message;
    if (status === 400) return "La imagen seleccionada no es válida";
    if (status === 403) return "No tienes permisos para modificar la imagen de inspección";
    if (status === 404) return "No se encontró la inspección solicitada";
    if (status >= 500) return "Error interno del servidor";
    return `Error HTTP ${status}`;
}

async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
    const res = await authFetch(url, {
        method: init.method ?? "GET",
        ...init,
        headers: {
            "Accept": "application/json",
            ...init.headers
        }
    });

    if (!res.ok) {
        const errorData = await parseErrorResponse(res);
        throw new Error(getBackendErrorMessage(errorData, res.status));
    }

    return res.json() as Promise<T>;
}

async function fetchDetalle(id: string): Promise<InspeccionDetalleResponse> {
    return fetchJson<InspeccionDetalleResponse>(`/api/inspecciones/${encodeURIComponent(id)}`);
}

async function actualizarImagenInspeccion(id: number, imagenPath: string | null): Promise<InspeccionDetalleResponse> {
    return fetchJson<InspeccionDetalleResponse>(`/api/inspecciones/${encodeURIComponent(String(id))}/imagen`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ imagenPath })
    });
}

async function cargarCapturas(estanteriaCodigo: string): Promise<CapturaResponse[]> {
    return fetchJson<CapturaResponse[]>(`/api/capturas?estanteriaCodigo=${encodeURIComponent(estanteriaCodigo)}`);
}

async function cargarMapaSeccionesEstanterias(): Promise<void> {
    const secciones = await fetchJson<SeccionResponse[]>(`/api/empresas/${encodeURIComponent(EMPRESA_CODIGO)}/secciones`);
    const entries = await Promise.all(
        secciones.map(async (seccion) => {
            const estanterias = await fetchJson<EstanteriaResumenResponse[]>(`/api/secciones/${encodeURIComponent(String(seccion.id))}/estanterias`);
            return estanterias.map((estanteria) => ({ ...estanteria, seccion }));
        })
    );

    estanteriasPorCodigo = new Map(
        entries.flat().map((estanteria) => [estanteria.codigo, estanteria])
    );
}

function renderImagen(inspeccion: InspeccionDetalleResponse) {
    if (!imagenEl) return;

    const imagen = getImagenPath(inspeccion);
    const imageUrl = normalizeImageUrl(imagen);
    imagenEl.innerHTML = "";

    if (!imageUrl) {
        const wrapper = document.createElement("div");
        wrapper.className = "image-error";
        const texto = document.createElement("strong");
        texto.textContent = "Esta inspección no tiene imagen asociada";
        const path = document.createElement("small");
        path.textContent = imageFallbackText(imagen);
        wrapper.append(texto, path);
        imagenEl.appendChild(wrapper);
        return;
    }

    const img = document.createElement("img");
    img.className = "inspection-image";
    img.src = imageUrl;
    img.alt = `Imagen de inspección ${inspeccion.estanteriaCodigo}`;
    img.addEventListener("error", () => {
        imagenEl.innerHTML = "";
        const wrapper = document.createElement("div");
        wrapper.className = "image-error";
        const text = document.createElement("strong");
        text.textContent = "Imagen no disponible";
        const path = document.createElement("small");
        path.textContent = imageFallbackText(imagen);
        wrapper.append(text, path);
        imagenEl.appendChild(wrapper);
    });
    imagenEl.appendChild(img);
}

function renderAccionesImagen(inspeccion: InspeccionDetalleResponse): void {
    if (!imagenActionsEl) return;

    if (!puedeEditarImagen) {
        imagenActionsEl.hidden = true;
        return;
    }

    const tieneImagen = Boolean(getImagenPath(inspeccion));
    imagenActionsEl.hidden = false;
    if (cambiarImagenBtn) cambiarImagenBtn.textContent = tieneImagen ? "Cambiar imagen" : "Asociar imagen";
    if (quitarImagenBtn) quitarImagenBtn.hidden = !tieneImagen;
}

function setDialogHelp(message: string): void {
    if (imagenDialogHelp) imagenDialogHelp.textContent = message;
}

function renderCapturaPreview(imagePath: string | null): void {
    if (!capturaPreview) return;

    capturaPreview.innerHTML = "";
    const imageUrl = normalizeImageUrl(imagePath);
    if (!imageUrl) {
        const span = document.createElement("span");
        span.textContent = "La inspección quedará sin imagen asociada.";
        capturaPreview.appendChild(span);
        return;
    }

    const img = document.createElement("img");
    img.className = "inspection-image";
    img.src = imageUrl;
    img.alt = "Preview de captura seleccionada";
    img.addEventListener("error", () => {
        capturaPreview.innerHTML = "";
        const wrapper = document.createElement("div");
        wrapper.className = "image-error";
        const text = document.createElement("strong");
        text.textContent = "Captura no disponible";
        const path = document.createElement("small");
        path.textContent = imageFallbackText(imagePath);
        wrapper.append(text, path);
        capturaPreview.appendChild(wrapper);
    });
    capturaPreview.appendChild(img);
}

function renderCapturasSelect(capturas: CapturaResponse[], selectedPath: string | null): void {
    if (!capturaSelect) return;

    capturaSelect.innerHTML = "";
    const sinImagen = document.createElement("option");
    sinImagen.value = "";
    sinImagen.textContent = "Sin imagen";
    capturaSelect.appendChild(sinImagen);

    capturas.forEach((captura) => {
        const option = document.createElement("option");
        option.value = captura.imageUrl;
        option.textContent = `${captura.fileName} - ${formatFecha(captura.createdAt)}`;
        capturaSelect.appendChild(option);
    });

    const selected = selectedPath ?? "";
    capturaSelect.value = capturas.some((captura) => captura.imageUrl === selected) ? selected : "";
    renderCapturaPreview(capturaSelect.value || null);
}

async function abrirDialogoImagen(): Promise<void> {
    if (!inspeccionActual || !imagenDialog) return;

    setError(null);
    setDialogHelp("Cargando capturas disponibles...");
    if (guardarImagenBtn) guardarImagenBtn.disabled = true;
    renderCapturasSelect([], getImagenPath(inspeccionActual));
    imagenDialog.showModal();

    try {
        capturasDisponibles = await cargarCapturas(inspeccionActual.estanteriaCodigo);
        renderCapturasSelect(capturasDisponibles, getImagenPath(inspeccionActual));
        setDialogHelp(capturasDisponibles.length === 0
            ? "No hay capturas disponibles para esta estantería."
            : `${capturasDisponibles.length} captura${capturasDisponibles.length === 1 ? "" : "s"} disponible${capturasDisponibles.length === 1 ? "" : "s"}.`);
    } catch (err) {
        capturasDisponibles = [];
        renderCapturasSelect([], getImagenPath(inspeccionActual));
        setDialogHelp("No se pudieron cargar las capturas disponibles.");
        setError(err instanceof Error ? err.message : "No se pudieron cargar las capturas disponibles.");
    } finally {
        if (guardarImagenBtn) guardarImagenBtn.disabled = false;
    }
}

async function guardarImagenSeleccionada(): Promise<void> {
    if (!inspeccionActual) return;

    const imagenPath = capturaSelect?.value || null;
    if (guardarImagenBtn) guardarImagenBtn.disabled = true;

    try {
        const detalle = await actualizarImagenInspeccion(inspeccionActual.id, imagenPath);
        renderDetalle(detalle);
        setEstadoCarga(imagenPath ? "Imagen de inspección actualizada." : "Imagen asociada eliminada.");
        imagenDialog?.close();
    } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo actualizar la imagen de inspección.");
    } finally {
        if (guardarImagenBtn) guardarImagenBtn.disabled = false;
    }
}

async function quitarImagenAsociada(): Promise<void> {
    if (!inspeccionActual) return;

    const confirmed = window.confirm("La inspección quedará sin imagen asociada.");
    if (!confirmed) return;

    if (quitarImagenBtn) quitarImagenBtn.disabled = true;
    try {
        const detalle = await actualizarImagenInspeccion(inspeccionActual.id, null);
        renderDetalle(detalle);
        setEstadoCarga("Imagen asociada eliminada.");
    } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo quitar la imagen asociada.");
    } finally {
        if (quitarImagenBtn) quitarImagenBtn.disabled = false;
    }
}

function renderDetalle(inspeccion: InspeccionDetalleResponse) {
    inspeccionActual = inspeccion;
    clearElement(resumenEl);
    clearElement(visualEl);
    clearElement(slotsEl);

    const resultadoVisual = inspeccion.resultadoVisual;
    const resumen = resultadoVisual?.resumen ?? null;
    const slots = resultadoVisual?.slots ?? [];
    const info = getEstanteriaInfo(inspeccion.estanteriaCodigo);

    addListItem(resumenEl, "ID", String(inspeccion.id));
    addListItem(resumenEl, "Sección", info ? `${info.seccion.codigo} · ${info.seccion.nombre}` : "Sin sección");
    addListItem(resumenEl, "Estantería", info ? `${info.codigo} · ${info.nombre}` : inspeccion.estanteriaCodigo);
    addListItem(resumenEl, "Estado del registro", inspeccion.estado);
    addListItem(resumenEl, "Fecha de creación", formatFecha(inspeccion.createdAt));
    addListItem(resumenEl, "Notas", inspeccion.notas?.trim() ? inspeccion.notas : "Sin notas");
    addListItem(resumenEl, "Imagen", getImagenPath(inspeccion) ?? "Sin imagen");

    if (!resumen) {
        addListItem(visualEl, "Resultado", "Sin análisis visual");
    } else {
        addListItem(visualEl, "Estado general", resumen.estadoGeneralVisual);
        addListItem(visualEl, "Slots totales", String(resumen.slotsTotales));
        addListItem(visualEl, "Ocupados", String(resumen.ocupados));
        addListItem(visualEl, "Vacíos", String(resumen.vacios));
        addListItem(visualEl, "Anomalías", String(resumen.anomalias));
        addListItem(visualEl, "Huecos vacíos", resumen.hayHuecosVacios ? "Sí" : "No");
        addListItem(visualEl, "Hay anomalías", resumen.hayAnomalias ? "Sí" : "No");
        addListItem(visualEl, "Modelo", resultadoVisual?.modeloVersion ?? "Sin modelo");
        addListItem(visualEl, "Capturada en", formatFecha(resultadoVisual?.capturadaEn));
    }

    if (slots.length === 0) {
        addListItem(slotsEl, "Slots", "Sin detalle de slots");
    } else {
        slots
            .slice()
            .sort((a, b) => a.orden - b.orden)
            .forEach((slot) => {
                addListItem(
                    slotsEl,
                    `${slot.orden}. ${slot.slotId}`,
                    `${slot.estadoVisual} - confianza ${formatConfianza(slot.confianza)}`
                );
            });
    }

    renderImagen(inspeccion);
    renderAccionesImagen(inspeccion);
    setEstadoCarga("Detalle cargado correctamente.");
}

async function init() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        setEstadoCarga("Falta el identificador de inspección en la URL.");
        setError("Abre esta página desde una inspección concreta o usa ?id=ID.");
        return;
    }

    try {
        setError(null);
        setEstadoCarga("Cargando detalle de inspección...");
        await cargarMapaSeccionesEstanterias();
        const detalle = await fetchDetalle(id);
        renderDetalle(detalle);
    } catch (err) {
        setEstadoCarga("No se pudo cargar el detalle.");
        setError(err instanceof Error ? err.message : "Error desconocido al cargar el detalle");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    cambiarImagenBtn?.addEventListener("click", () => {
        void abrirDialogoImagen();
    });
    quitarImagenBtn?.addEventListener("click", () => {
        void quitarImagenAsociada();
    });
    capturaSelect?.addEventListener("change", () => {
        renderCapturaPreview(capturaSelect.value || null);
    });
    guardarImagenBtn?.addEventListener("click", () => {
        void guardarImagenSeleccionada();
    });
    cancelarImagenBtn?.addEventListener("click", () => {
        imagenDialog?.close();
    });
    void init();
});
