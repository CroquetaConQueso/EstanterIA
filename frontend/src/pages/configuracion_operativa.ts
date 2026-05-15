import { authFetch, isStructuralAdmin } from "../lib/api";
import { requireAuth } from "../lib/auth-guard";

requireAuth();

type ApiErrorResponse = {
  message?: string;
  error?: string;
  status?: number;
  fieldErrors?: Record<string, string>;
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
  codigoInterno: string | null;
  nombre: string | null;
  descripcion: string | null;
};

type CrearSeccionPayload = {
  empresaCodigo: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
};

type CrearEstanteriaPayload = {
  seccionId: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  slots: Array<{
    slotId: string;
    orden: number;
    productoId: number;
    cantidadObjetivo: number;
  }>;
};

const EMPRESA_CODIGO = "EMP-DEMO";
const puedeConfigurarEstructura = isStructuralAdmin();

const formSeccion = document.querySelector<HTMLFormElement>("#form-seccion");
const seccionCodigoInput = document.querySelector<HTMLInputElement>("#seccion-codigo");
const seccionNombreInput = document.querySelector<HTMLInputElement>("#seccion-nombre");
const seccionDescripcionInput = document.querySelector<HTMLTextAreaElement>("#seccion-descripcion");
const seccionStatus = document.querySelector<HTMLElement>("#seccion-status");
const listaSecciones = document.querySelector<HTMLUListElement>("#lista-secciones");

const formEstanteria = document.querySelector<HTMLFormElement>("#form-estanteria");
const estanteriaSeccionSelect = document.querySelector<HTMLSelectElement>("#estanteria-seccion");
const estanteriaCodigoInput = document.querySelector<HTMLInputElement>("#estanteria-codigo");
const estanteriaNombreInput = document.querySelector<HTMLInputElement>("#estanteria-nombre");
const estanteriaDescripcionInput = document.querySelector<HTMLTextAreaElement>("#estanteria-descripcion");
const slotCountInput = document.querySelector<HTMLInputElement>("#slot-count");
const slotsContainer = document.querySelector<HTMLElement>("#slots-container");
const productosStatus = document.querySelector<HTMLElement>("#productos-status");
const estanteriaStatus = document.querySelector<HTMLElement>("#estanteria-status");
const listaEstanterias = document.querySelector<HTMLUListElement>("#lista-estanterias");
const btnCrearEstanteria = document.querySelector<HTMLButtonElement>("#btn-crear-estanteria");

let secciones: SeccionResponse[] = [];
let productos: ProductoResumenResponse[] = [];
let estanteriasSeccion: EstanteriaResumenResponse[] = [];
let savingSeccion = false;
let savingEstanteria = false;

function setStatus(element: HTMLElement | null, text: string, kind: "info" | "ok" | "error" = "info"): void {
  if (!element) return;
  element.textContent = text;
  element.dataset.kind = kind;
}

function structuralPermissionMessage(): string {
  return "Solo un administrador puede modificar la configuración estructural.";
}

function disableForm(form: HTMLFormElement | null): void {
  if (!form) return;
  Array.from(form.elements).forEach((element) => {
    if ("disabled" in element) {
      (element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement).disabled = true;
    }
  });
}

function applyStructuralPermissions(): void {
  if (puedeConfigurarEstructura) return;
  disableForm(formSeccion);
  disableForm(formEstanteria);
  setStatus(seccionStatus, structuralPermissionMessage(), "error");
  setStatus(estanteriaStatus, structuralPermissionMessage(), "error");
}

function option(value: string, text: string): HTMLOptionElement {
  const node = document.createElement("option");
  node.value = value;
  node.textContent = text;
  return node;
}

function textValue(input: HTMLInputElement | HTMLTextAreaElement | null): string {
  return input?.value.trim() ?? "";
}

function nullableText(input: HTMLTextAreaElement | null): string | null {
  const value = textValue(input);
  return value || null;
}

async function parseErrorResponse(response: Response): Promise<ApiErrorResponse | null> {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) as ApiErrorResponse : null;
  } catch {
    return null;
  }
}

function backendErrorMessage(data: ApiErrorResponse | null, status: number): string {
  const fieldMessage = data?.fieldErrors ? Object.values(data.fieldErrors)[0] : null;
  if (fieldMessage) return fieldMessage;
  if (data?.message) return data.message;
  if (status === 400) return "Revisa los datos del formulario.";
  if (status === 401) return "La sesion no es valida o ha caducado.";
  if (status === 403) return structuralPermissionMessage();
  if (status === 404) return "No se encontro el recurso solicitado.";
  if (status === 409) return "Ya existe un recurso con esos datos.";
  if (status >= 500) return "El servidor no pudo completar la operacion.";
  return `Error HTTP ${status}`;
}

async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await authFetch(url, {
    ...init,
    headers: {
      "Accept": "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...Object.fromEntries(new Headers(init.headers))
    }
  });

  if (!response.ok) {
    const errorData = await parseErrorResponse(response);
    throw new Error(backendErrorMessage(errorData, response.status));
  }

  return response.json() as Promise<T>;
}

function renderSecciones(): void {
  if (listaSecciones) {
    listaSecciones.innerHTML = "";
    if (secciones.length === 0) {
      listaSecciones.appendChild(li("No hay secciones activas."));
    } else {
      secciones.forEach((seccion) => {
        listaSecciones.appendChild(li(`${seccion.codigo} - ${seccion.nombre}`));
      });
    }
  }

  if (!estanteriaSeccionSelect) return;
  const previous = estanteriaSeccionSelect.value;
  estanteriaSeccionSelect.innerHTML = "";

  if (secciones.length === 0) {
    estanteriaSeccionSelect.appendChild(option("", "Crea una seccion primero"));
    return;
  }

  secciones.forEach((seccion) => {
    estanteriaSeccionSelect.appendChild(option(String(seccion.id), `${seccion.nombre} - ${seccion.codigo}`));
  });
  if (previous && secciones.some((seccion) => String(seccion.id) === previous)) {
    estanteriaSeccionSelect.value = previous;
  }
}

function renderEstanterias(): void {
  if (!listaEstanterias) return;
  listaEstanterias.innerHTML = "";

  if (!estanteriaSeccionSelect?.value) {
    listaEstanterias.appendChild(li("Selecciona una seccion."));
    return;
  }

  if (estanteriasSeccion.length === 0) {
    listaEstanterias.appendChild(li("La seccion no tiene estanterias activas."));
    return;
  }

  estanteriasSeccion.forEach((estanteria) => {
    listaEstanterias.appendChild(li(`${estanteria.codigo} - ${estanteria.nombre}`));
  });
}

function li(text: string): HTMLLIElement {
  const item = document.createElement("li");
  item.textContent = text;
  return item;
}

function productoLabel(producto: ProductoResumenResponse): string {
  const codigo = producto.codigoInterno ? `${producto.codigoInterno} - ` : "";
  return `${codigo}${producto.nombre ?? "Producto sin nombre"}`;
}

function renderSlots(): void {
  if (!slotsContainer) return;

  const count = Math.max(1, Math.min(24, Number(slotCountInput?.value) || 4));
  if (slotCountInput) slotCountInput.value = String(count);
  slotsContainer.innerHTML = "";

  for (let index = 1; index <= count; index += 1) {
    const row = document.createElement("div");
    row.className = "slot-row";
    row.dataset.slotIndex = String(index);

    const slotId = document.createElement("input");
    slotId.type = "text";
    slotId.value = `slot_${index}`;
    slotId.maxLength = 50;
    slotId.setAttribute("aria-label", `Slot ${index}`);
    slotId.dataset.field = "slotId";

    const orden = document.createElement("input");
    orden.type = "number";
    orden.value = String(index);
    orden.min = "1";
    orden.step = "1";
    orden.setAttribute("aria-label", `Orden ${index}`);
    orden.dataset.field = "orden";

    const producto = document.createElement("select");
    producto.dataset.field = "productoId";
    producto.setAttribute("aria-label", `Producto esperado ${index}`);
    if (productos.length === 0) {
      producto.appendChild(option("", "No hay productos activos"));
    } else {
      productos.forEach((item) => producto.appendChild(option(String(item.id), productoLabel(item))));
    }

    const cantidad = document.createElement("input");
    cantidad.type = "number";
    cantidad.value = "8";
    cantidad.min = "0";
    cantidad.step = "1";
    cantidad.setAttribute("aria-label", `Cantidad objetivo ${index}`);
    cantidad.dataset.field = "cantidadObjetivo";

    row.append(
      labeled("Slot", slotId),
      labeled("Orden", orden),
      labeled("Producto esperado", producto),
      labeled("Cantidad objetivo", cantidad)
    );
    slotsContainer.appendChild(row);
  }
}

function labeled(labelText: string, control: HTMLElement): HTMLElement {
  const wrap = document.createElement("label");
  wrap.className = "slot-field";
  const label = document.createElement("span");
  label.textContent = labelText;
  wrap.append(label, control);
  return wrap;
}

async function cargarSecciones(): Promise<void> {
  secciones = await fetchJson<SeccionResponse[]>(`/api/empresas/${EMPRESA_CODIGO}/secciones`);
  renderSecciones();
  await cargarEstanteriasDeSeccion();
}

async function cargarProductos(): Promise<void> {
  productos = await fetchJson<ProductoResumenResponse[]>("/api/productos");
  if (productosStatus) {
    productosStatus.textContent = productos.length === 0
      ? "No hay productos activos disponibles."
      : `${productos.length} productos activos`;
  }
  renderSlots();
}

async function cargarEstanteriasDeSeccion(): Promise<void> {
  const seccionId = Number(estanteriaSeccionSelect?.value);
  estanteriasSeccion = Number.isFinite(seccionId) && seccionId > 0
    ? await fetchJson<EstanteriaResumenResponse[]>(`/api/secciones/${seccionId}/estanterias`)
    : [];
  renderEstanterias();
}

function buildSeccionPayload(): CrearSeccionPayload | string {
  const codigo = textValue(seccionCodigoInput);
  const nombre = textValue(seccionNombreInput);
  if (!codigo) return "El codigo de seccion es obligatorio.";
  if (!nombre) return "El nombre de seccion es obligatorio.";

  return {
    empresaCodigo: EMPRESA_CODIGO,
    codigo,
    nombre,
    descripcion: nullableText(seccionDescripcionInput)
  };
}

function buildEstanteriaPayload(): CrearEstanteriaPayload | string {
  const seccionId = Number(estanteriaSeccionSelect?.value);
  const codigo = textValue(estanteriaCodigoInput);
  const nombre = textValue(estanteriaNombreInput);

  if (!Number.isFinite(seccionId) || seccionId <= 0) return "Selecciona una seccion valida.";
  if (!codigo) return "El codigo de estanteria es obligatorio.";
  if (!nombre) return "El nombre de estanteria es obligatorio.";
  if (productos.length === 0) return "No hay productos activos para asignar a los slots.";

  const rows = Array.from(slotsContainer?.querySelectorAll<HTMLElement>(".slot-row") ?? []);
  if (rows.length === 0) return "La estanteria debe tener al menos un slot.";

  const slots = rows.map((row) => {
    const slotId = row.querySelector<HTMLInputElement>("[data-field='slotId']")?.value.trim() ?? "";
    const orden = Number(row.querySelector<HTMLInputElement>("[data-field='orden']")?.value);
    const productoId = Number(row.querySelector<HTMLSelectElement>("[data-field='productoId']")?.value);
    const cantidadObjetivo = Number(row.querySelector<HTMLInputElement>("[data-field='cantidadObjetivo']")?.value);
    return { slotId, orden, productoId, cantidadObjetivo };
  });

  if (slots.some((slot) => !slot.slotId)) return "Todos los slots deben tener identificador.";
  if (slots.some((slot) => !Number.isFinite(slot.orden) || slot.orden <= 0)) return "Todos los slots deben tener orden mayor que cero.";
  if (slots.some((slot) => !Number.isFinite(slot.productoId) || slot.productoId <= 0)) return "Todos los slots deben tener producto esperado.";
  if (slots.some((slot) => !Number.isFinite(slot.cantidadObjetivo) || slot.cantidadObjetivo < 0)) return "La cantidad objetivo no puede ser negativa.";

  return {
    seccionId,
    codigo,
    nombre,
    descripcion: nullableText(estanteriaDescripcionInput),
    slots
  };
}

async function crearSeccion(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  if (!puedeConfigurarEstructura) {
    setStatus(seccionStatus, structuralPermissionMessage(), "error");
    return;
  }
  if (savingSeccion) return;

  const payload = buildSeccionPayload();
  if (typeof payload === "string") {
    setStatus(seccionStatus, payload, "error");
    return;
  }

  savingSeccion = true;
  setStatus(seccionStatus, "Creando seccion...", "info");
  try {
    await fetchJson<SeccionResponse>("/api/secciones", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    formSeccion?.reset();
    setStatus(seccionStatus, "Seccion creada correctamente.", "ok");
    await cargarSecciones();
  } catch (err) {
    setStatus(seccionStatus, err instanceof Error ? err.message : "No se pudo crear la seccion.", "error");
  } finally {
    savingSeccion = false;
  }
}

async function crearEstanteria(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  if (!puedeConfigurarEstructura) {
    setStatus(estanteriaStatus, structuralPermissionMessage(), "error");
    return;
  }
  if (savingEstanteria) return;

  const payload = buildEstanteriaPayload();
  if (typeof payload === "string") {
    setStatus(estanteriaStatus, payload, "error");
    return;
  }

  savingEstanteria = true;
  if (btnCrearEstanteria) btnCrearEstanteria.disabled = true;
  setStatus(estanteriaStatus, "Creando estanteria...", "info");

  try {
    await fetchJson("/api/estanterias", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    formEstanteria?.reset();
    if (slotCountInput) slotCountInput.value = "4";
    renderSlots();
    renderSecciones();
    setStatus(estanteriaStatus, "Estanteria creada correctamente. Ya puede colocarse en el editor de planos.", "ok");
    await cargarEstanteriasDeSeccion();
  } catch (err) {
    setStatus(estanteriaStatus, err instanceof Error ? err.message : "No se pudo crear la estanteria.", "error");
  } finally {
    savingEstanteria = false;
    if (btnCrearEstanteria) btnCrearEstanteria.disabled = false;
  }
}

function bindEvents(): void {
  formSeccion?.addEventListener("submit", (event) => {
    void crearSeccion(event);
  });
  formEstanteria?.addEventListener("submit", (event) => {
    void crearEstanteria(event);
  });
  estanteriaSeccionSelect?.addEventListener("change", () => {
    void cargarEstanteriasDeSeccion();
  });
  slotCountInput?.addEventListener("change", renderSlots);
  slotCountInput?.addEventListener("input", renderSlots);
}

async function init(): Promise<void> {
  bindEvents();
  applyStructuralPermissions();
  try {
    await Promise.all([cargarSecciones(), cargarProductos()]);
    if (puedeConfigurarEstructura) {
      setStatus(seccionStatus, "Secciones cargadas.", "ok");
      setStatus(estanteriaStatus, "Configuracion lista.", "ok");
    } else {
      applyStructuralPermissions();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo cargar la configuracion operativa.";
    setStatus(seccionStatus, message, "error");
    setStatus(estanteriaStatus, message, "error");
    renderSlots();
    applyStructuralPermissions();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  void init();
});
