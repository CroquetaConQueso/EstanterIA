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

type ApiErrorResponse = {
    message?: string;
};

const estadoCarga = document.querySelector<HTMLElement>("#detalle-estado-carga");
const errorEl = document.querySelector<HTMLElement>("#detalle-error");
const imagenEl = document.querySelector<HTMLElement>("#detalle-imagen");
const resumenEl = document.querySelector<HTMLUListElement>("#detalle-resumen");
const visualEl = document.querySelector<HTMLUListElement>("#detalle-visual");
const slotsEl = document.querySelector<HTMLUListElement>("#detalle-slots");

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
    if (status === 404) return "No se encontro la inspeccion solicitada";
    if (status >= 500) return "Error interno del servidor";
    return `Error HTTP ${status}`;
}

async function fetchDetalle(id: string): Promise<InspeccionDetalleResponse> {
    const res = await fetch(`/api/inspecciones/${encodeURIComponent(id)}`, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    });

    if (!res.ok) {
        const errorData = await parseErrorResponse(res);
        throw new Error(getBackendErrorMessage(errorData, res.status));
    }

    return res.json() as Promise<InspeccionDetalleResponse>;
}

function renderImagen(inspeccion: InspeccionDetalleResponse) {
    if (!imagenEl) return;

    const imagen = getImagenPath(inspeccion);
    imagenEl.innerHTML = "";

    const texto = document.createElement("span");
    texto.textContent = imagen
        ? `Imagen asociada: ${imagen}`
        : "Esta inspeccion no tiene imagen asociada";

    imagenEl.appendChild(texto);
}

function renderDetalle(inspeccion: InspeccionDetalleResponse) {
    clearElement(resumenEl);
    clearElement(visualEl);
    clearElement(slotsEl);

    const resultadoVisual = inspeccion.resultadoVisual;
    const resumen = resultadoVisual?.resumen ?? null;
    const slots = resultadoVisual?.slots ?? [];

    addListItem(resumenEl, "ID", String(inspeccion.id));
    addListItem(resumenEl, "Codigo de estanteria", inspeccion.estanteriaCodigo);
    addListItem(resumenEl, "Estado backend", inspeccion.estado);
    addListItem(resumenEl, "Fecha de creacion", formatFecha(inspeccion.createdAt));
    addListItem(resumenEl, "Notas", inspeccion.notas?.trim() ? inspeccion.notas : "Sin notas");
    addListItem(resumenEl, "Imagen", getImagenPath(inspeccion) ?? "Sin imagen");

    if (!resumen) {
        addListItem(visualEl, "Resultado", "Sin analisis visual");
    } else {
        addListItem(visualEl, "Estado general", resumen.estadoGeneralVisual);
        addListItem(visualEl, "Slots totales", String(resumen.slotsTotales));
        addListItem(visualEl, "Ocupados", String(resumen.ocupados));
        addListItem(visualEl, "Vacios", String(resumen.vacios));
        addListItem(visualEl, "Anomalias", String(resumen.anomalias));
        addListItem(visualEl, "Huecos vacios", resumen.hayHuecosVacios ? "Si" : "No");
        addListItem(visualEl, "Hay anomalias", resumen.hayAnomalias ? "Si" : "No");
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
        setEstadoCarga("Falta el identificador de inspeccion en la URL.");
        setError("Abre esta pagina desde una inspeccion concreta o usa ?id=ID.");
        return;
    }

    try {
        setError(null);
        setEstadoCarga("Cargando detalle de inspeccion...");
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
