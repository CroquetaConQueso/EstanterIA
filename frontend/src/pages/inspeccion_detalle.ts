import { authFetch } from "../lib/api";
import { requireAuth } from "../lib/auth-guard";
import { normalizeImageUrl } from "../lib/image-paths";

requireAuth();

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

const estadoCarga = document.querySelector<HTMLElement>("#detalle-estado-carga");
const errorEl = document.querySelector<HTMLElement>("#detalle-error");
const imagenEl = document.querySelector<HTMLElement>("#detalle-imagen");
const resumenEl = document.querySelector<HTMLUListElement>("#detalle-resumen");
const visualEl = document.querySelector<HTMLUListElement>("#detalle-visual");
const slotsEl = document.querySelector<HTMLUListElement>("#detalle-slots");

const EMPRESA_CODIGO = "EMP-DEMO";

let estanteriasPorCodigo = new Map<string, EstanteriaConSeccion>();

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
    if (status === 404) return "No se encontró la inspección solicitada";
    if (status >= 500) return "Error interno del servidor";
    return `Error HTTP ${status}`;
}

async function fetchJson<T>(url: string): Promise<T> {
    const res = await authFetch(url, {
        method: "GET",
        headers: {
            "Accept": "application/json"
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
        const texto = document.createElement("span");
        texto.textContent = "Esta inspección no tiene imagen asociada";
        imagenEl.appendChild(texto);
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
        path.textContent = imagen ?? "";
        wrapper.append(text, path);
        imagenEl.appendChild(wrapper);
    });
    imagenEl.appendChild(img);
}

function renderDetalle(inspeccion: InspeccionDetalleResponse) {
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
    addListItem(resumenEl, "Estado backend", inspeccion.estado);
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
    void init();
});
