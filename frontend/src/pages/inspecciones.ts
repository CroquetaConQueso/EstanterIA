import { authFetch } from "../lib/api";
import { requireAuth } from "../lib/auth-guard";
import { imageFallbackText, normalizeImageUrl } from "../lib/image-paths";

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
    timestamp?: string;
    status?: number;
    error?: string;
    message?: string;
    path?: string;
    fieldErrors?: Record<string, string>;
};

const tbody = document.querySelector<HTMLTableSectionElement>("#tbody-inspecciones");
const filtroSeccion = document.querySelector<HTMLSelectElement>("#filtro-seccion");
const filtroPlano = document.querySelector<HTMLInputElement>("#filtro-plano");
const filtroEstado = document.querySelector<HTMLSelectElement>("#filtro-estado");
const filtroFechaDesde = document.querySelector<HTMLInputElement>("#filtro-fecha-desde");
const filtroFechaHasta = document.querySelector<HTMLInputElement>("#filtro-fecha-hasta");
const btnLimpiar = document.querySelector<HTMLButtonElement>("#btn-limpiar-filtros");

const errorEl = document.querySelector<HTMLElement>("#inspecciones-error");
const successEl = document.querySelector<HTMLElement>("#inspecciones-success");

const photoPlaceholder = document.querySelector<HTMLElement>("#photo-placeholder");
const detalleResumen = document.querySelector<HTMLUListElement>("#detalle-resumen");
const detalleVisual = document.querySelector<HTMLUListElement>("#detalle-visual");
const detalleSlots = document.querySelector<HTMLUListElement>("#detalle-slots");
const detalleError = document.querySelector<HTMLElement>("#detalle-error");
const detalleCompletoLink = document.querySelector<HTMLAnchorElement>("#detalle-completo-link");

let inspecciones: InspeccionResponse[] = [];
let estanteriasPorCodigo = new Map<string, EstanteriaConSeccion>();
let selectedInspeccionId: number | null = null;

const API_URL = "/api/inspecciones";
const EMPRESA_CODIGO = "EMP-DEMO";

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

function setSelectOptions(
    select: HTMLSelectElement | null,
    placeholder: string,
    options: Array<{ value: string; label: string }>
): void {
    if (!select) return;
    select.innerHTML = "";

    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = placeholder;
    select.appendChild(empty);

    options.forEach((option) => {
        const el = document.createElement("option");
        el.value = option.value;
        el.textContent = option.label;
        select.appendChild(el);
    });
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

function getFechaFiltro(ins: InspeccionResponse): Date | null {
    const raw = ins.capturadaEn ?? ins.createdAt;
    if (!raw) return null;
    const fecha = new Date(raw);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function getInicioDia(value: string): Date | null {
    if (!value) return null;
    const fecha = new Date(`${value}T00:00:00`);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function getFinDia(value: string): Date | null {
    if (!value) return null;
    const fecha = new Date(`${value}T23:59:59.999`);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function getErrorRangoFechas(): string | null {
    const desde = getInicioDia(filtroFechaDesde?.value ?? "");
    const hasta = getFinDia(filtroFechaHasta?.value ?? "");

    if (desde && hasta && desde.getTime() > hasta.getTime()) {
        return "La fecha desde no puede ser posterior a la fecha hasta";
    }

    return null;
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

function getEstanteriaInfo(codigo: string): EstanteriaConSeccion | null {
    return estanteriasPorCodigo.get(codigo) ?? null;
}

function getSeccionLabel(ins: InspeccionResponse): string {
    const info = getEstanteriaInfo(ins.estanteriaCodigo);
    return info ? `${info.seccion.codigo} · ${info.seccion.nombre}` : "Sin sección";
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

async function fetchJson<T>(url: string): Promise<T> {
    const res = await authFetch(url, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });

    if (!res.ok) {
        const errorData = await parseErrorResponse(res);
        throw new Error(getBackendErrorMessage(errorData, res.status));
    }

    return res.json() as Promise<T>;
}

async function fetchInspeccionDetalle(id: number): Promise<InspeccionResponse> {
    return fetchJson<InspeccionResponse>(`${API_URL}/${encodeURIComponent(String(id))}`);
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

    setSelectOptions(
        filtroSeccion,
        "Todas",
        secciones.map((seccion) => ({
            value: String(seccion.id),
            label: `${seccion.codigo} · ${seccion.nombre}`
        }))
    );
}

function renderPhoto(ins: InspeccionResponse) {
    if (!photoPlaceholder) return;

    photoPlaceholder.innerHTML = "";

    const imagen = getImagenPath(ins);
    const imageUrl = normalizeImageUrl(imagen);

    if (!imageUrl) {
        const wrapper = document.createElement("div");
        wrapper.className = "image-error";
        const texto = document.createElement("strong");
        texto.textContent = "Esta inspección no tiene imagen asociada";
        const path = document.createElement("small");
        path.textContent = imageFallbackText(imagen);
        wrapper.append(texto, path);
        photoPlaceholder.appendChild(wrapper);
        return;
    }

    const img = document.createElement("img");
    img.className = "inspection-image";
    img.src = imageUrl;
    img.alt = `Imagen de inspección ${ins.estanteriaCodigo}`;
    img.addEventListener("error", () => {
        photoPlaceholder.innerHTML = "";
        const wrapper = document.createElement("div");
        wrapper.className = "image-error";
        const text = document.createElement("strong");
        text.textContent = "Imagen no disponible";
        const path = document.createElement("small");
        path.textContent = imageFallbackText(imagen);
        wrapper.append(text, path);
        photoPlaceholder.appendChild(wrapper);
    });
    photoPlaceholder.appendChild(img);
}

function renderDetalle(ins: InspeccionResponse) {
    setDetalleError(null);

    clearElement(detalleResumen);
    clearElement(detalleVisual);
    clearElement(detalleSlots);

    const resumen = getResumenPersistido(ins);
    const resultadoVisual = ins.resultadoVisual ?? null;
    const slots = resultadoVisual?.slots ?? [];
    const info = getEstanteriaInfo(ins.estanteriaCodigo);

    addListItem(detalleResumen, "ID", String(ins.id));
    addListItem(detalleResumen, "Sección", info ? `${info.seccion.codigo} · ${info.seccion.nombre}` : "Sin sección");
    addListItem(detalleResumen, "Estantería", info ? `${info.codigo} · ${info.nombre}` : ins.estanteriaCodigo);
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
    selectedInspeccionId = id;
    renderTabla();

    try {
        const detalle = await fetchInspeccionDetalle(id);
        renderDetalle(detalle);
    } catch (err) {
        setDetalleError(err instanceof Error ? err.message : "No se pudo cargar el detalle");
    }
}

function getInspeccionesFiltradas(): InspeccionResponse[] {
    const texto = filtroPlano?.value.trim().toLowerCase() ?? "";
    const estado = filtroEstado?.value ?? "";
    const seccionId = filtroSeccion?.value ?? "";
    const desde = getInicioDia(filtroFechaDesde?.value ?? "");
    const hasta = getFinDia(filtroFechaHasta?.value ?? "");

    return inspecciones.filter((ins) => {
        const resumen = getResumenPersistido(ins);
        const fecha = getFechaFiltro(ins);
        const info = getEstanteriaInfo(ins.estanteriaCodigo);
        const coincideSeccion = !seccionId || String(info?.seccion.id ?? "") === seccionId;
        const coincideTexto =
            !texto ||
            ins.estanteriaCodigo.toLowerCase().includes(texto) ||
            (info?.nombre.toLowerCase().includes(texto) ?? false) ||
            (info?.seccion.nombre.toLowerCase().includes(texto) ?? false) ||
            (info?.seccion.codigo.toLowerCase().includes(texto) ?? false) ||
            (ins.notas?.toLowerCase().includes(texto) ?? false) ||
            (resumen?.estadoGeneralVisual.toLowerCase().includes(texto) ?? false);

        const coincideEstado =
            !estado ||
            ins.estado === estado;

        const coincideDesde = !desde || (fecha !== null && fecha.getTime() >= desde.getTime());
        const coincideHasta = !hasta || (fecha !== null && fecha.getTime() <= hasta.getTime());

        return coincideSeccion && coincideTexto && coincideEstado && coincideDesde && coincideHasta;
    });
}

function renderTabla() {
    if (!tbody) return;

    tbody.innerHTML = "";

    const errorRango = getErrorRangoFechas();
    if (errorRango) {
        setError(errorRango);
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 7;
        td.textContent = "Corrige el rango de fechas para aplicar el filtro";
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    setError(null);

    const lista = getInspeccionesFiltradas();

    if (lista.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");

        td.colSpan = 7;
        td.textContent = "No hay inspecciones para mostrar";
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    lista.forEach((ins) => {
        const resumen = getResumenPersistido(ins);
        const info = getEstanteriaInfo(ins.estanteriaCodigo);
        const tr = document.createElement("tr");
        tr.tabIndex = 0;
        tr.classList.toggle("is-selected", selectedInspeccionId === ins.id);
        tr.addEventListener("click", () => {
            void renderDetalleDesdeBackend(ins.id);
        });
        tr.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                void renderDetalleDesdeBackend(ins.id);
            }
        });

        const tdFecha = document.createElement("td");
        tdFecha.textContent = formatFecha(ins.capturadaEn ?? ins.createdAt);

        const tdSeccion = document.createElement("td");
        tdSeccion.textContent = getSeccionLabel(ins);

        const tdEstanteria = document.createElement("td");
        tdEstanteria.textContent = info ? `${info.codigo} · ${info.nombre}` : ins.estanteriaCodigo;

        const tdEstadoVisual = document.createElement("td");
        tdEstadoVisual.textContent = resumen?.estadoGeneralVisual ?? "Sin análisis visual";

        const tdResumen = document.createElement("td");
        tdResumen.textContent = resumen
            ? `O:${resumen.ocupados} · V:${resumen.vacios} · A:${resumen.anomalias}`
            : "Sin datos";

        const tdModelo = document.createElement("td");
        tdModelo.textContent = ins.modeloVersion ?? ins.resultadoVisual?.modeloVersion ?? "Sin modelo";

        const tdAcciones = document.createElement("td");
        const enlaceDetalle = document.createElement("a");

        enlaceDetalle.className = "btn ghost";
        enlaceDetalle.href = `inspeccion_detalle.html?id=${encodeURIComponent(String(ins.id))}`;
        enlaceDetalle.textContent = "Abrir completo";
        enlaceDetalle.addEventListener("click", (event) => event.stopPropagation());

        tdAcciones.append(enlaceDetalle);

        tr.append(
            tdFecha,
            tdSeccion,
            tdEstanteria,
            tdEstadoVisual,
            tdResumen,
            tdModelo,
            tdAcciones
        );

        tbody.appendChild(tr);
    });
}

async function cargarInspecciones() {
    setError(null);

    try {
        await cargarMapaSeccionesEstanterias();
        const data = await fetchJson<InspeccionResponse[]>(API_URL);
        inspecciones = data;

        inspecciones.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

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

    } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo conectar con el servidor.");
    }
}

function onFilterChange() {
    setSuccess(null);
    selectedInspeccionId = null;
    renderTabla();
}

filtroSeccion?.addEventListener("change", onFilterChange);
filtroPlano?.addEventListener("input", onFilterChange);
filtroEstado?.addEventListener("change", onFilterChange);
filtroFechaDesde?.addEventListener("change", onFilterChange);
filtroFechaHasta?.addEventListener("change", onFilterChange);

btnLimpiar?.addEventListener("click", () => {
    if (filtroSeccion) filtroSeccion.value = "";
    if (filtroPlano) filtroPlano.value = "";
    if (filtroEstado) filtroEstado.value = "";
    if (filtroFechaDesde) filtroFechaDesde.value = "";
    if (filtroFechaHasta) filtroFechaHasta.value = "";

    setError(null);
    setSuccess(null);
    selectedInspeccionId = null;
    renderTabla();
});

document.addEventListener("DOMContentLoaded", () => {
    void cargarInspecciones();
});
