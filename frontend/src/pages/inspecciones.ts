import { authFetch } from "../lib/api";

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

type InspeccionResponse = {
    id: number;
    estanteriaCodigo: string;
    notas: string | null;
    imagenPath: string | null;
    estado: EstadoInspeccion;
    createdAt: string;
    estadoGeneralVisual?: EstadoGeneralVisual | null;
    ocupados?: number | null;
    vacios?: number | null;
    anomalias?: number | null;
    modeloVersion?: string | null;
    capturadaEn?: string | null;
    resultadoVisual?: ResultadoVisualResponse | null;
};

type ApiErrorResponse = {
    timestamp?: string;
    status?: number;
    error?: string;
    message?: string;
    path?: string;
    fieldErrors?: Record<string, string>;
};

const tbody = document.querySelector<HTMLTableSectionElement>("#tbody-inspecciones");
const filtroPlano = document.querySelector<HTMLInputElement>("#filtro-plano");
const filtroEstado = document.querySelector<HTMLSelectElement>("#filtro-estado");
const btnLimpiar = document.querySelector<HTMLButtonElement>("#btn-limpiar-filtros");

const errorEl = document.querySelector<HTMLElement>("#inspecciones-error");
const successEl = document.querySelector<HTMLElement>("#inspecciones-success");
const out = document.querySelector<HTMLPreElement>("#out");

const photoPlaceholder = document.querySelector<HTMLElement>("#photo-placeholder");
const detalleResumen = document.querySelector<HTMLUListElement>("#detalle-resumen");
const detalleVisual = document.querySelector<HTMLUListElement>("#detalle-visual");
const detalleSlots = document.querySelector<HTMLUListElement>("#detalle-slots");
const detalleError = document.querySelector<HTMLElement>("#detalle-error");
const detalleCompletoLink = document.querySelector<HTMLAnchorElement>("#detalle-completo-link");

let inspecciones: InspeccionResponse[] = [];

const API_URL = "/api/inspecciones";

function show(obj: unknown) {
    if (!out) return;
    out.textContent = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
}

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

function setSuccess(msg: string | null) {
    if (!successEl) return;

    if (!msg) {
        successEl.textContent = "";
        successEl.setAttribute("hidden", "");
        return;
    }

    successEl.textContent = msg;
    successEl.removeAttribute("hidden");
}

function setDetalleError(msg: string | null) {
    if (!detalleError) return;

    if (!msg) {
        detalleError.textContent = "";
        detalleError.setAttribute("hidden", "");
        return;
    }

    detalleError.textContent = msg;
    detalleError.removeAttribute("hidden");
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

    if (Number.isNaN(fecha.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("es-ES", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(fecha);
}

function formatNullable(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === "") return "Sin análisis visual";
    return String(value);
}

function formatConfianza(value: number | null | undefined): string {
    if (value === null || value === undefined) return "Sin confianza";
    return `${Math.round(value * 100)}%`;
}

function getResumenPersistido(ins: InspeccionResponse): ResumenVisualResponse | null {
    if (ins.resultadoVisual?.resumen) return ins.resultadoVisual.resumen;

    if (!ins.estadoGeneralVisual) return null;

    const vacios = ins.vacios ?? 0;
    const anomalias = ins.anomalias ?? 0;
    const ocupados = ins.ocupados ?? 0;

    return {
        estadoGeneralVisual: ins.estadoGeneralVisual,
        slotsTotales: ocupados + vacios + anomalias,
        ocupados,
        vacios,
        anomalias,
        hayHuecosVacios: vacios > 0,
        hayAnomalias: anomalias > 0
    };
}

function getImagenPath(ins: InspeccionResponse): string | null {
    return ins.resultadoVisual?.imagen?.ruta || ins.imagenPath || null;
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

    if (status === 400) return "La petición no es válida";
    if (status === 401) return "No autorizado";
    if (status === 403) return "No tienes permisos para realizar esta acción";
    if (status === 404) return "No se encontró la inspección solicitada";
    if (status === 409) return "Conflicto al recuperar los datos";
    if (status >= 500) return "Error interno del servidor";

    return `Error HTTP ${status}`;
}

async function fetchInspeccionDetalle(id: number): Promise<InspeccionResponse> {
    const res = await authFetch(`${API_URL}/${encodeURIComponent(String(id))}`, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    });

    if (!res.ok) {
        const errorData = await parseErrorResponse(res);
        throw new Error(getBackendErrorMessage(errorData, res.status));
    }

    return res.json() as Promise<InspeccionResponse>;
}

function renderPhoto(ins: InspeccionResponse) {
    if (!photoPlaceholder) return;

    photoPlaceholder.innerHTML = "";

    const texto = document.createElement("span");
    const imagen = getImagenPath(ins);
    texto.textContent = imagen
        ? `Imagen asociada: ${imagen}`
        : "Esta inspección no tiene imagen asociada";

    photoPlaceholder.appendChild(texto);
}

function renderDetalle(ins: InspeccionResponse) {
    setDetalleError(null);

    clearElement(detalleResumen);
    clearElement(detalleVisual);
    clearElement(detalleSlots);

    const resumen = getResumenPersistido(ins);
    const resultadoVisual = ins.resultadoVisual ?? null;
    const slots = resultadoVisual?.slots ?? [];

    addListItem(detalleResumen, "ID", String(ins.id));
    addListItem(detalleResumen, "Código de estantería", ins.estanteriaCodigo);
    addListItem(detalleResumen, "Estado backend", ins.estado);
    addListItem(detalleResumen, "Fecha de creación", formatFecha(ins.createdAt));
    addListItem(detalleResumen, "Notas", ins.notas?.trim() ? ins.notas : "Sin notas");
    addListItem(detalleResumen, "Imagen", getImagenPath(ins) ?? "Sin imagen");

    if (!resumen) {
        addListItem(detalleVisual, "Resultado", "Sin análisis visual");
    } else {
        addListItem(detalleVisual, "Estado general", resumen.estadoGeneralVisual);
        addListItem(detalleVisual, "Ocupados", String(resumen.ocupados));
        addListItem(detalleVisual, "Vacíos", String(resumen.vacios));
        addListItem(detalleVisual, "Anomalías", String(resumen.anomalias));
        addListItem(detalleVisual, "Modelo", resultadoVisual?.modeloVersion ?? ins.modeloVersion ?? "Sin modelo");
        addListItem(detalleVisual, "Capturada en", formatFecha(resultadoVisual?.capturadaEn ?? ins.capturadaEn));
    }

    if (slots.length === 0) {
        addListItem(detalleSlots, "Slots", "Sin detalle de slots");
    } else {
        slots
            .slice()
            .sort((a, b) => a.orden - b.orden)
            .forEach((slot) => {
                addListItem(
                    detalleSlots,
                    `${slot.orden}. ${slot.slotId}`,
                    `${slot.estadoVisual} - confianza ${formatConfianza(slot.confianza)}`
                );
            });
    }

    if (detalleCompletoLink) {
        detalleCompletoLink.href = `inspeccion_detalle.html?id=${encodeURIComponent(String(ins.id))}`;
        detalleCompletoLink.removeAttribute("hidden");
    }

    renderPhoto(ins);
}

async function renderDetalleDesdeBackend(id: number) {
    setDetalleError(null);

    try {
        const detalle = await fetchInspeccionDetalle(id);
        renderDetalle(detalle);
        show(detalle);
    } catch (err) {
        setDetalleError(err instanceof Error ? err.message : "No se pudo cargar el detalle");
    }
}

function getInspeccionesFiltradas(): InspeccionResponse[] {
    const texto = filtroPlano?.value.trim().toLowerCase() ?? "";
    const estado = filtroEstado?.value ?? "";

    return inspecciones.filter((ins) => {
        const resumen = getResumenPersistido(ins);
        const coincideTexto =
            !texto ||
            ins.estanteriaCodigo.toLowerCase().includes(texto) ||
            (ins.notas?.toLowerCase().includes(texto) ?? false) ||
            (resumen?.estadoGeneralVisual.toLowerCase().includes(texto) ?? false);

        const coincideEstado =
            !estado ||
            ins.estado === estado;

        return coincideTexto && coincideEstado;
    });
}

function renderTabla() {
    if (!tbody) return;

    tbody.innerHTML = "";

    const lista = getInspeccionesFiltradas();

    if (lista.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");

        td.colSpan = 8;
        td.textContent = "No hay inspecciones para mostrar";
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    lista.forEach((ins) => {
        const resumen = getResumenPersistido(ins);
        const tr = document.createElement("tr");

        const tdFecha = document.createElement("td");
        tdFecha.textContent = formatFecha(ins.capturadaEn ?? ins.createdAt);

        const tdEstanteria = document.createElement("td");
        tdEstanteria.textContent = ins.estanteriaCodigo;

        const tdEstadoVisual = document.createElement("td");
        tdEstadoVisual.textContent = resumen?.estadoGeneralVisual ?? "Sin análisis visual";

        const tdOcupados = document.createElement("td");
        tdOcupados.textContent = formatNullable(resumen?.ocupados);

        const tdVacios = document.createElement("td");
        tdVacios.textContent = formatNullable(resumen?.vacios);

        const tdAnomalias = document.createElement("td");
        tdAnomalias.textContent = formatNullable(resumen?.anomalias);

        const tdModelo = document.createElement("td");
        tdModelo.textContent = ins.modeloVersion ?? ins.resultadoVisual?.modeloVersion ?? "Sin modelo";

        const tdAcciones = document.createElement("td");
        const btnDetalle = document.createElement("button");
        const enlaceDetalle = document.createElement("a");

        btnDetalle.type = "button";
        btnDetalle.className = "btn ghost";
        btnDetalle.textContent = "Ver detalle";
        btnDetalle.addEventListener("click", () => {
            void renderDetalleDesdeBackend(ins.id);
        });

        enlaceDetalle.className = "btn ghost";
        enlaceDetalle.href = `inspeccion_detalle.html?id=${encodeURIComponent(String(ins.id))}`;
        enlaceDetalle.textContent = "Abrir completo";

        tdAcciones.append(btnDetalle, enlaceDetalle);

        tr.append(
            tdFecha,
            tdEstanteria,
            tdEstadoVisual,
            tdOcupados,
            tdVacios,
            tdAnomalias,
            tdModelo,
            tdAcciones
        );

        tbody.appendChild(tr);
    });
}

async function cargarInspecciones() {
    setError(null);

    try {
        const res = await authFetch(API_URL, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!res.ok) {
            const errorData = await parseErrorResponse(res);
            show(errorData ?? { error: "HTTP_ERROR", status: res.status });

            const msg = getBackendErrorMessage(errorData, res.status);
            setError(msg);
            return;
        }

        const data = await res.json() as InspeccionResponse[];
        inspecciones = data;

        inspecciones.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        show(inspecciones);
        renderTabla();

        const nuevaInspeccionId = sessionStorage.getItem("nuevaInspeccionId");

        if (nuevaInspeccionId) {
            const creada = inspecciones.find(i => i.id === Number(nuevaInspeccionId));
            if (creada) {
                await renderDetalleDesdeBackend(creada.id);
                setSuccess(`Inspección ${creada.estanteriaCodigo} creada correctamente`);
            }
            sessionStorage.removeItem("nuevaInspeccionId");
            return;
        }

        if (inspecciones.length > 0) {
            await renderDetalleDesdeBackend(inspecciones[0].id);
        } else {
            setDetalleError("No hay detalle disponible porque no existen inspecciones");
        }

    } catch {
        setError("No se pudo conectar con el servidor.");
        show({ error: "NETWORK_ERROR" });
    }
}

if (filtroPlano) {
    filtroPlano.addEventListener("input", () => {
        setSuccess(null);
        renderTabla();
    });
}

if (filtroEstado) {
    filtroEstado.addEventListener("change", () => {
        setSuccess(null);
        renderTabla();
    });
}

if (btnLimpiar) {
    btnLimpiar.addEventListener("click", () => {
        if (filtroPlano) filtroPlano.value = "";
        if (filtroEstado) filtroEstado.value = "";

        setError(null);
        setSuccess(null);
        renderTabla();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    void cargarInspecciones();
});
