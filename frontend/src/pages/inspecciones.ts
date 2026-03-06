// ===============================
// Tipos de datos esperados desde backend
// ===============================
type EstadoInspeccion = "CREADA" | "ACTUALIZADA" | "LISTA" | string;

type InspeccionResponse = {
    id: number;
    estanteriaCodigo: string;
    notas: string | null;
    imagenPath: string | null;
    estado: EstadoInspeccion;
    createdAt: string;
    message?: string; // opcional por si tu backend todavía lo devuelve en algún caso
};

type ApiErrorResponse = {
    timestamp?: string;
    status?: number;
    error?: string;
    message?: string;
    path?: string;
    fieldErrors?: Record<string, string>;
};

// ===============================
// Selectores del DOM
// ===============================
const tbody = document.querySelector<HTMLTableSectionElement>("#tbody-inspecciones");
const filtroPlano = document.querySelector<HTMLInputElement>("#filtro-plano");
const filtroEstado = document.querySelector<HTMLSelectElement>("#filtro-estado");
const btnLimpiar = document.querySelector<HTMLButtonElement>("#btn-limpiar-filtros");

const errorEl = document.querySelector<HTMLElement>("#inspecciones-error");
const successEl = document.querySelector<HTMLElement>("#inspecciones-success");
const out = document.querySelector<HTMLPreElement>("#out");

const photoPlaceholder = document.querySelector<HTMLElement>("#photo-placeholder");
const detalleResumen = document.querySelector<HTMLUListElement>("#detalle-resumen");
const detalleOk = document.querySelector<HTMLUListElement>("#detalle-ok");
const detalleGaps = document.querySelector<HTMLUListElement>("#detalle-gaps");
const detalleError = document.querySelector<HTMLElement>("#detalle-error");

// ===============================
// Estado en memoria de la página
// ===============================
let inspecciones: InspeccionResponse[] = [];

// Si tu backend expone /inspecciones en vez de /api/inspecciones, cambia SOLO esta línea.
const API_URL = "/api/inspecciones";

// ===============================
// Helpers visuales
// ===============================
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
    li.innerHTML = `<strong>${label}:</strong> ${value}`;
    list.appendChild(li);
}

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatFecha(value: string): string {
    const fecha = new Date(value);

    if (Number.isNaN(fecha.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("es-ES", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(fecha);
}

// ===============================
// Parseo de errores backend
// ===============================
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
    if (status === 404) return "No se encontró el recurso solicitado";
    if (status === 409) return "Conflicto al recuperar los datos";
    if (status >= 500) return "Error interno del servidor";

    return `Error HTTP ${status}`;
}

// ===============================
// Render del detalle lateral
// ===============================
function renderDetalle(ins: InspeccionResponse) {
    setDetalleError(null);

    clearElement(detalleResumen);
    clearElement(detalleOk);
    clearElement(detalleGaps);

    addListItem(detalleResumen, "ID", String(ins.id));
    addListItem(detalleResumen, "Código de estantería", ins.estanteriaCodigo);
    addListItem(detalleResumen, "Estado", ins.estado);
    addListItem(detalleResumen, "Fecha de creación", formatFecha(ins.createdAt));
    addListItem(detalleResumen, "Notas", ins.notas?.trim() ? ins.notas : "—");
    addListItem(detalleResumen, "Imagen", ins.imagenPath?.trim() ? ins.imagenPath : "—");

    // Tu backend actual todavía no devuelve estos datos.
    addListItem(detalleOk, "Productos detectados", "Pendiente de IA / YOLO");
    addListItem(detalleGaps, "Huecos detectados", "Pendiente de IA / YOLO");

    if (photoPlaceholder) {
        photoPlaceholder.innerHTML = "";

        const texto = document.createElement("span");
        texto.textContent = ins.imagenPath?.trim()
            ? `Imagen asociada: ${ins.imagenPath}`
            : "Esta inspección no tiene imagen asociada";

        photoPlaceholder.appendChild(texto);
    }
}

// ===============================
// Filtros
// ===============================
function getInspeccionesFiltradas(): InspeccionResponse[] {
    const texto = filtroPlano?.value.trim().toLowerCase() ?? "";
    const estado = filtroEstado?.value ?? "";

    return inspecciones.filter((ins) => {
        const coincideTexto =
            !texto ||
            ins.estanteriaCodigo.toLowerCase().includes(texto) ||
            (ins.notas?.toLowerCase().includes(texto) ?? false);

        const coincideEstado =
            !estado ||
            ins.estado === estado;

        return coincideTexto && coincideEstado;
    });
}

// ===============================
// Render de tabla
// ===============================
function renderTabla() {
    if (!tbody) return;

    tbody.innerHTML = "";

    const lista = getInspeccionesFiltradas();

    if (lista.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");

        td.colSpan = 9;
        td.textContent = "No hay inspecciones para mostrar";
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    lista.forEach((ins) => {
        const tr = document.createElement("tr");

        const tdFecha = document.createElement("td");
        tdFecha.textContent = formatFecha(ins.createdAt);

        const tdPlano = document.createElement("td");
        tdPlano.textContent = "—"; // todavía no viene del backend

        const tdEstanteria = document.createElement("td");
        tdEstanteria.textContent = ins.estanteriaCodigo;

        const tdEncargados = document.createElement("td");
        tdEncargados.textContent = "—"; // todavía no viene del backend

        const tdVersionPlano = document.createElement("td");
        tdVersionPlano.textContent = "—"; // todavía no viene del backend

        const tdProductosOk = document.createElement("td");
        tdProductosOk.textContent = "—"; // todavía no viene del backend

        const tdHuecos = document.createElement("td");
        tdHuecos.textContent = "—"; // todavía no viene del backend

        const tdEstado = document.createElement("td");
        tdEstado.textContent = ins.estado;

        const tdAcciones = document.createElement("td");
        const btnDetalle = document.createElement("button");

        btnDetalle.type = "button";
        btnDetalle.className = "btn ghost";
        btnDetalle.textContent = "Ver detalle";
        btnDetalle.addEventListener("click", () => renderDetalle(ins));

        tdAcciones.appendChild(btnDetalle);

        tr.append(
            tdFecha,
            tdPlano,
            tdEstanteria,
            tdEncargados,
            tdVersionPlano,
            tdProductosOk,
            tdHuecos,
            tdEstado,
            tdAcciones
        );

        tbody.appendChild(tr);
    });
}

// ===============================
// Carga real desde backend
// ===============================
async function cargarInspecciones() {
    setError(null);

    try {
        const res = await fetch(API_URL, {
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

        // Ordenamos por fecha descendente: más reciente primero
        inspecciones.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        show(inspecciones);
        renderTabla();

        // Si vienes de crear una inspección nueva, mostramos esa en detalle
        const nuevaInspeccionId = sessionStorage.getItem("nuevaInspeccionId");

        if (nuevaInspeccionId) {
            const creada = inspecciones.find(i => i.id === Number(nuevaInspeccionId));
            if (creada) {
                renderDetalle(creada);
                setSuccess(`Inspección ${creada.estanteriaCodigo} creada correctamente`);
            }
            sessionStorage.removeItem("nuevaInspeccionId");
            return;
        }

        // Si no venimos de crear nada, mostramos la primera por defecto
        if (inspecciones.length > 0) {
            renderDetalle(inspecciones[0]);
        } else {
            setDetalleError("No hay detalle disponible porque no existen inspecciones");
        }

    } catch {
        setError("No se pudo conectar con el servidor.");
        show({ error: "NETWORK_ERROR" });
    }
}

// ===============================
// Eventos
// ===============================
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

// ===============================
// Inicio
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    void cargarInspecciones();
});