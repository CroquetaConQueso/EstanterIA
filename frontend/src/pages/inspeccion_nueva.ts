// ===============================
// Tipos de datos
// ===============================
type CrearInspeccionRequest = {
    estanteriaCodigo: string;
    notas: string | null;
    imagenPath: string | null;
};

type InspeccionResponse = {
    id: number;
    estanteriaCodigo: string;
    notas: string | null;
    imagenPath: string | null;
    estado: string;
    createdAt: string;
    message?: string;
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
const form = document.querySelector<HTMLFormElement>("#form-inspeccion-nueva");
const planoInput = document.querySelector<HTMLInputElement>("#insp-plano");
const estanteriaInput = document.querySelector<HTMLInputElement>("#insp-estanteria");
const estadoInput = document.querySelector<HTMLSelectElement>("#insp-estado");
const notasInput = document.querySelector<HTMLTextAreaElement>("#insp-notas");

const errorEl = document.querySelector<HTMLElement>("#insp-error");
const successEl = document.querySelector<HTMLElement>("#insp-success");
const out = document.querySelector<HTMLPreElement>("#out");

const API_URL = "/api/inspeccion_nueva";

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

// ===============================
// Auth helper
// ===============================
function getAuthToken(): string | null {
    return localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
}

// ===============================
// Validación frontend
// ===============================
function validateClient(
    plano: string,
    estanteriaCodigo: string,
    estado: string,
    notas: string
): Record<string, string> {
    const errors: Record<string, string> = {};

    // Aunque el backend todavía no usa "plano", el formulario sí lo exige.
    if (!plano.trim()) {
        errors.plano = "El plano es obligatorio";
    }

    if (!estanteriaCodigo.trim()) {
        errors.estanteriaCodigo = "El código de estantería es obligatorio";
    }

    // De momento el backend crea con estado inicial; este campo aún es más visual que real.
    if (!estado.trim()) {
        errors.estado = "El estado es obligatorio";
    }

    // Validación ligera, sin meternos aún en reglas avanzadas.
    if (notas.length > 1000) {
        errors.notas = "Las notas son demasiado largas";
    }

    return errors;
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

    if (data?.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
        return Object.values(data.fieldErrors).join(" ");
    }

    if (status === 400) return "Revisa los datos del formulario";
    if (status === 401) return "No autorizado";
    if (status === 403) return "No tienes permisos para realizar esta acción";
    if (status === 404) return "No se encontró el recurso solicitado";
    if (status === 409) return "Ya existe una inspección con ese código de estantería";
    if (status >= 500) return "Error interno del servidor";

    return `Error HTTP ${status}`;
}

// ===============================
// Construcción del payload
// ===============================
function buildPayload(): CrearInspeccionRequest {
    const estanteriaCodigo = estanteriaInput?.value.trim() ?? "";
    const notas = notasInput?.value.trim() ?? "";

    return {
        estanteriaCodigo,
        notas: notas ? notas : null,
        imagenPath: null
    };
}

// ===============================
// Envío del formulario
// ===============================
if (form && planoInput && estanteriaInput && estadoInput && notasInput) {
    planoInput.addEventListener("input", () => setError(null));
    estanteriaInput.addEventListener("input", () => setError(null));
    estadoInput.addEventListener("change", () => setError(null));
    notasInput.addEventListener("input", () => setError(null));

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const plano = planoInput.value.trim();
        const estanteriaCodigo = estanteriaInput.value.trim();
        const estado = estadoInput.value;
        const notas = notasInput.value.trim();

        const clientErrors = validateClient(plano, estanteriaCodigo, estado, notas);

        if (Object.keys(clientErrors).length > 0) {
            const msg = Object.values(clientErrors).join(" ");
            setError(msg);
            show({ error: "CLIENTE_VALIDACION_ERROR", fieldErrors: clientErrors });
            return;
        }

        const payload = buildPayload();

        const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            const token = getAuthToken();

            const headers: Record<string, string> = {
                "Content-Type": "application/json",
                "Accept": "application/json"
            };

            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const res = await fetch(API_URL, {
                method: "POST",
                headers,
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await parseErrorResponse(res);
                show(errorData ?? { error: "HTTP_ERROR", status: res.status });

                const msg = getBackendErrorMessage(errorData, res.status);
                setError(msg);
                return;
            }

            const text = await res.text();
            const data = text ? JSON.parse(text) as InspeccionResponse : null;

            show(data);

            if (!data?.id) {
                setError("La inspección se creó, pero la respuesta no contiene ID");
                return;
            }

            sessionStorage.setItem("nuevaInspeccionId", String(data.id));
            setSuccess(`Inspección ${data.estanteriaCodigo} creada correctamente`);

            // Redirección breve para que el usuario vea el feedback y luego vuelva al listado.
            setTimeout(() => {
                window.location.href = "/html/inspecciones.html";
            }, 500);

        } catch {
            setError("No se pudo conectar con el servidor.");
            show({ error: "NETWORK_ERROR" });
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}