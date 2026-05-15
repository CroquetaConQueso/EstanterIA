import { authFetch } from "../lib/api";
import { requireAuth } from "../lib/auth-guard";

requireAuth();

type EditorMode = "select" | "zone" | "rack";
type SelectedElement = { type: "zone"; uid: string } | { type: "rack"; uid: string } | null;
type Orientation = "HORIZONTAL" | "VERTICAL";

type ApiErrorResponse = {
  message?: string;
  error?: string;
  status?: number;
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

type PlanoZonaResponse = {
  id: number;
  seccion: SeccionResponse;
  x: number;
  y: number;
  width: number;
  height: number;
};

type PlanoEstanteriaLayoutResponse = {
  id: number;
  zonaId: number;
  estanteria: EstanteriaResumenResponse;
  x: number;
  y: number;
  width: number;
  height: number;
  orientacion: Orientation;
};

type PlanoResponse = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  ancho: number;
  alto: number;
  activo: boolean | null;
  zonas: PlanoZonaResponse[];
  estanterias: PlanoEstanteriaLayoutResponse[];
};

type LocalZone = {
  uid: string;
  persistedId: number | null;
  seccionId: number;
  seccionCodigo: string;
  seccionNombre: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type LocalRack = {
  uid: string;
  persistedId: number | null;
  zonaUid: string;
  seccionId: number;
  estanteriaCodigo: string;
  estanteriaNombre: string;
  x: number;
  y: number;
  width: number;
  height: number;
  orientacion: Orientation;
};

type PlanoPayload = {
  empresaCodigo?: string;
  codigo?: string;
  nombre: string;
  descripcion: string | null;
  ancho: number;
  alto: number;
  zonas: Array<{
    seccionId: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  estanterias: Array<{
    estanteriaCodigo: string;
    seccionId: number;
    x: number;
    y: number;
    width: number;
    height: number;
    orientacion: Orientation;
  }>;
};

const params = new URLSearchParams(window.location.search);
const codigoInicial = params.get("codigo");
const isEditMode = Boolean(codigoInicial);

const editorModeLabel = document.querySelector<HTMLElement>("#editor-mode-label");
const editorTitle = document.querySelector<HTMLElement>("#editor-title");
const editorStatus = document.querySelector<HTMLElement>("#editor-status");
const btnSave = document.querySelector<HTMLButtonElement>("#btn-save");
const empresaInput = document.querySelector<HTMLInputElement>("#empresa-codigo");
const codigoInput = document.querySelector<HTMLInputElement>("#plano-codigo");
const nombreInput = document.querySelector<HTMLInputElement>("#plano-nombre");
const descripcionInput = document.querySelector<HTMLTextAreaElement>("#plano-descripcion");
const anchoInput = document.querySelector<HTMLInputElement>("#plano-ancho");
const altoInput = document.querySelector<HTMLInputElement>("#plano-alto");
const seccionSelect = document.querySelector<HTMLSelectElement>("#seccion-select");
const estanteriaSelect = document.querySelector<HTMLSelectElement>("#estanteria-select");
const orientacionSelect = document.querySelector<HTMLSelectElement>("#orientacion-select");
const canvas = document.querySelector<HTMLElement>("#editor-canvas");
const canvasSize = document.querySelector<HTMLElement>("#canvas-size");
const canvasHelp = document.querySelector<HTMLElement>("#canvas-help");
const zoneList = document.querySelector<HTMLUListElement>("#zone-list");
const rackList = document.querySelector<HTMLUListElement>("#rack-list");
const selectionSummary = document.querySelector<HTMLElement>("#selection-summary");
const formElemento = document.querySelector<HTMLFormElement>("#form-elemento");
const elementX = document.querySelector<HTMLInputElement>("#element-x");
const elementY = document.querySelector<HTMLInputElement>("#element-y");
const elementWidth = document.querySelector<HTMLInputElement>("#element-width");
const elementHeight = document.querySelector<HTMLInputElement>("#element-height");
const elementOrientationField = document.querySelector<HTMLElement>("#element-orientation-field");
const elementOrientation = document.querySelector<HTMLSelectElement>("#element-orientation");
const btnApplyElement = document.querySelector<HTMLButtonElement>("#btn-apply-element");
const btnDeleteElement = document.querySelector<HTMLButtonElement>("#btn-delete-element");

let mode: EditorMode = "select";
let selected: SelectedElement = null;
let zones: LocalZone[] = [];
let racks: LocalRack[] = [];
let secciones: SeccionResponse[] = [];
let estanteriasSeccion: EstanteriaResumenResponse[] = [];
let saving = false;
let drawing: { startX: number; startY: number; draft: HTMLElement } | null = null;

function setText(element: HTMLElement | null, text: string): void {
  if (element) element.textContent = text;
}

function setStatus(message: string, kind: "info" | "ok" | "error" = "info"): void {
  if (!editorStatus) return;
  editorStatus.textContent = message;
  editorStatus.dataset.kind = kind;
}

function numberValue(input: HTMLInputElement | null, fallback = 0): number {
  const value = Number(input?.value);
  return Number.isFinite(value) ? value : fallback;
}

function getPlanoSize(): { ancho: number; alto: number } {
  return {
    ancho: numberValue(anchoInput, 1200),
    alto: numberValue(altoInput, 700)
  };
}

function uid(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function selectedZone(): LocalZone | null {
  if (selected?.type !== "zone") return null;
  const selectedUid = selected.uid;
  return zones.find((zone) => zone.uid === selectedUid) ?? null;
}

function selectedRack(): LocalRack | null {
  if (selected?.type !== "rack") return null;
  const selectedUid = selected.uid;
  return racks.find((rack) => rack.uid === selectedUid) ?? null;
}

function findZoneForRack(rack: LocalRack): LocalZone | null {
  return zones.find((zone) => zone.uid === rack.zonaUid) ?? null;
}

function setMode(nextMode: EditorMode): void {
  mode = nextMode;
  document.querySelectorAll<HTMLButtonElement>(".tool").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === mode);
  });
  setText(canvasHelp, mode === "zone"
    ? "Arrastra para dibujar una zona de la sección seleccionada."
    : mode === "rack"
      ? "Arrastra dentro de una zona para colocar la estantería seleccionada."
      : "Selecciona zonas o estanterías para editar sus coordenadas.");
}

function updateCanvasSize(): void {
  const { ancho, alto } = getPlanoSize();
  if (canvas) {
    canvas.style.aspectRatio = `${ancho} / ${alto}`;
  }
  setText(canvasSize, `${ancho} x ${alto}`);
}

function positionElement(element: HTMLElement, item: { x: number; y: number; width: number; height: number }): void {
  const { ancho, alto } = getPlanoSize();
  element.style.left = `${(item.x / ancho) * 100}%`;
  element.style.top = `${(item.y / alto) * 100}%`;
  element.style.width = `${(item.width / ancho) * 100}%`;
  element.style.height = `${(item.height / alto) * 100}%`;
}

function getPointerCoords(event: PointerEvent): { x: number; y: number } {
  const { ancho, alto } = getPlanoSize();
  const rect = canvas?.getBoundingClientRect();
  if (!rect) return { x: 0, y: 0 };

  const x = ((event.clientX - rect.left) / rect.width) * ancho;
  const y = ((event.clientY - rect.top) / rect.height) * alto;
  return {
    x: Math.max(0, Math.min(ancho, Math.round(x))),
    y: Math.max(0, Math.min(alto, Math.round(y)))
  };
}

function render(): void {
  updateCanvasSize();
  renderCanvas();
  renderLists();
  renderSelectionPanel();
}

function renderCanvas(): void {
  if (!canvas) return;

  canvas.innerHTML = "";
  if (zones.length === 0 && racks.length === 0) {
    const empty = document.createElement("span");
    empty.className = "empty-canvas";
    empty.textContent = "Sin elementos dibujados";
    canvas.appendChild(empty);
  }

  zones.forEach((zone) => {
    const node = document.createElement("button");
    node.type = "button";
    node.className = `zone-node${selected?.type === "zone" && selected.uid === zone.uid ? " is-selected" : ""}`;
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      selected = { type: "zone", uid: zone.uid };
      setMode("select");
      render();
    });
    positionElement(node, zone);

    const label = document.createElement("span");
    label.className = "zone-label";
    label.textContent = zone.seccionNombre;
    node.appendChild(label);
    canvas.appendChild(node);
  });

  racks.forEach((rack) => {
    const node = document.createElement("button");
    node.type = "button";
    node.className = `rack-node ${rack.orientacion.toLowerCase()}${selected?.type === "rack" && selected.uid === rack.uid ? " is-selected" : ""}`;
    node.textContent = rack.estanteriaCodigo;
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      selected = { type: "rack", uid: rack.uid };
      setMode("select");
      render();
    });
    positionElement(node, rack);
    canvas.appendChild(node);
  });
}

function renderLists(): void {
  if (zoneList) {
    zoneList.innerHTML = "";
    if (zones.length === 0) {
      zoneList.appendChild(listItem("No hay zonas creadas.", false, () => undefined));
    } else {
      zones.forEach((zone) => {
        zoneList.appendChild(listItem(`${zone.seccionNombre} · ${zone.width}x${zone.height}`, selected?.type === "zone" && selected.uid === zone.uid, () => {
          selected = { type: "zone", uid: zone.uid };
          render();
        }));
      });
    }
  }

  if (rackList) {
    rackList.innerHTML = "";
    if (racks.length === 0) {
      rackList.appendChild(listItem("No hay estanterías colocadas.", false, () => undefined));
    } else {
      racks.forEach((rack) => {
        rackList.appendChild(listItem(`${rack.estanteriaCodigo} · ${rack.orientacion}`, selected?.type === "rack" && selected.uid === rack.uid, () => {
          selected = { type: "rack", uid: rack.uid };
          render();
        }));
      });
    }
  }
}

function listItem(text: string, active: boolean, onClick: () => void): HTMLLIElement {
  const item = document.createElement("li");
  item.textContent = text;
  item.classList.toggle("is-active", active);
  item.addEventListener("click", onClick);
  return item;
}

function renderSelectionPanel(): void {
  const zone = selectedZone();
  const rack = selectedRack();

  if (!zone && !rack) {
    setText(selectionSummary, "No hay ningún elemento seleccionado.");
    formElemento?.classList.remove("is-visible");
    return;
  }

  formElemento?.classList.add("is-visible");

  if (zone) {
    setText(selectionSummary, `Zona: ${zone.seccionNombre}`);
    fillElementInputs(zone);
    if (elementOrientationField) elementOrientationField.style.display = "none";
    return;
  }

  if (rack) {
    setText(selectionSummary, `Estantería: ${rack.estanteriaCodigo} · ${rack.estanteriaNombre}`);
    fillElementInputs(rack);
    if (elementOrientationField) elementOrientationField.style.display = "grid";
    if (elementOrientation) elementOrientation.value = rack.orientacion;
  }
}

function fillElementInputs(item: { x: number; y: number; width: number; height: number }): void {
  if (elementX) elementX.value = String(item.x);
  if (elementY) elementY.value = String(item.y);
  if (elementWidth) elementWidth.value = String(item.width);
  if (elementHeight) elementHeight.value = String(item.height);
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
  if (data?.message) return data.message;
  if (status === 401) return "La sesión no es válida o ha caducado.";
  if (status === 404) return "No se encontró el recurso solicitado.";
  if (status === 409) return "Ya existe un recurso con esos datos.";
  if (status >= 500) return "Error interno del servidor.";
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

async function cargarSecciones(): Promise<void> {
  secciones = await fetchJson<SeccionResponse[]>("/api/empresas/EMP-DEMO/secciones");
  if (seccionSelect) {
    seccionSelect.innerHTML = "";
    if (secciones.length === 0) {
      seccionSelect.appendChild(option("", "No hay secciones disponibles"));
    } else {
      secciones.forEach((seccion) => {
        seccionSelect.appendChild(option(String(seccion.id), `${seccion.nombre} · ${seccion.codigo}`));
      });
    }
  }
  await cargarEstanteriasDeSeccion();
}

async function cargarEstanteriasDeSeccion(): Promise<void> {
  const seccionId = Number(seccionSelect?.value);
  estanteriasSeccion = Number.isFinite(seccionId) && seccionId > 0
    ? await fetchJson<EstanteriaResumenResponse[]>(`/api/secciones/${seccionId}/estanterias`)
    : [];

  if (estanteriaSelect) {
    estanteriaSelect.innerHTML = "";
    if (estanteriasSeccion.length === 0) {
      estanteriaSelect.appendChild(option("", "No hay estanterías disponibles"));
    } else {
      estanteriasSeccion.forEach((estanteria) => {
        estanteriaSelect.appendChild(option(estanteria.codigo, `${estanteria.codigo} · ${estanteria.nombre}`));
      });
    }
  }
}

function option(value: string, text: string): HTMLOptionElement {
  const node = document.createElement("option");
  node.value = value;
  node.textContent = text;
  return node;
}

async function cargarPlano(codigo: string): Promise<void> {
  const plano = await fetchJson<PlanoResponse>(`/api/planos/${encodeURIComponent(codigo)}`);
  if (empresaInput) {
    empresaInput.value = "EMP-DEMO";
    empresaInput.disabled = true;
  }
  if (codigoInput) {
    codigoInput.value = plano.codigo;
    codigoInput.disabled = true;
  }
  if (nombreInput) nombreInput.value = plano.nombre;
  if (descripcionInput) descripcionInput.value = plano.descripcion ?? "";
  if (anchoInput) anchoInput.value = String(plano.ancho);
  if (altoInput) altoInput.value = String(plano.alto);

  zones = plano.zonas.map((zona) => ({
    uid: uid("zona"),
    persistedId: zona.id,
    seccionId: zona.seccion.id,
    seccionCodigo: zona.seccion.codigo,
    seccionNombre: zona.seccion.nombre,
    x: zona.x,
    y: zona.y,
    width: zona.width,
    height: zona.height
  }));

  const zonesByPersistedId = new Map(zones.filter((zone) => zone.persistedId !== null).map((zone) => [zone.persistedId, zone]));
  racks = plano.estanterias.flatMap((layout) => {
    const zone = zonesByPersistedId.get(layout.zonaId);
    if (!zone) return [];
    return [{
      uid: uid("rack"),
      persistedId: layout.id,
      zonaUid: zone.uid,
      seccionId: zone.seccionId,
      estanteriaCodigo: layout.estanteria.codigo,
      estanteriaNombre: layout.estanteria.nombre,
      x: layout.x,
      y: layout.y,
      width: layout.width,
      height: layout.height,
      orientacion: layout.orientacion
    }];
  });
}

function validateMetadata(): string | null {
  if (!isEditMode && !codigoInput?.value.trim()) return "El código del plano es obligatorio.";
  if (!nombreInput?.value.trim()) return "El nombre del plano es obligatorio.";
  const { ancho, alto } = getPlanoSize();
  if (ancho <= 0 || alto <= 0) return "El ancho y el alto deben ser mayores que cero.";
  return null;
}

function validateBox(item: { x: number; y: number; width: number; height: number }): string | null {
  const { ancho, alto } = getPlanoSize();
  if (item.x < 0 || item.y < 0 || item.width <= 0 || item.height <= 0) {
    return "Las coordenadas y dimensiones no son válidas.";
  }
  if (item.x + item.width > ancho || item.y + item.height > alto) {
    return "El elemento debe quedar dentro del plano.";
  }
  return null;
}

function rackInsideZone(rack: { x: number; y: number; width: number; height: number }, zone: LocalZone): boolean {
  return rack.x >= zone.x
    && rack.y >= zone.y
    && rack.x + rack.width <= zone.x + zone.width
    && rack.y + rack.height <= zone.y + zone.height;
}

function zoneAtBox(box: { x: number; y: number; width: number; height: number }, seccionId: number): LocalZone | null {
  return zones.find((zone) => zone.seccionId === seccionId && rackInsideZone(box, zone)) ?? null;
}

function buildPayload(): PlanoPayload {
  const base = {
    nombre: nombreInput?.value.trim() ?? "",
    descripcion: descripcionInput?.value.trim() || null,
    ancho: getPlanoSize().ancho,
    alto: getPlanoSize().alto,
    zonas: zones.map((zone) => ({
      seccionId: zone.seccionId,
      x: zone.x,
      y: zone.y,
      width: zone.width,
      height: zone.height
    })),
    estanterias: racks.map((rack) => ({
      estanteriaCodigo: rack.estanteriaCodigo,
      seccionId: rack.seccionId,
      x: rack.x,
      y: rack.y,
      width: rack.width,
      height: rack.height,
      orientacion: rack.orientacion
    }))
  };

  if (isEditMode) return base;

  return {
    empresaCodigo: empresaInput?.value.trim() || "EMP-DEMO",
    codigo: codigoInput?.value.trim() ?? "",
    ...base
  };
}

async function guardarPlano(): Promise<void> {
  if (saving) return;

  const error = validateMetadata();
  if (error) {
    setStatus(error, "error");
    return;
  }

  const payload = buildPayload();
  saving = true;
  if (btnSave) btnSave.disabled = true;
  setStatus("Guardando plano...", "info");

  try {
    if (isEditMode && codigoInicial) {
      await fetchJson<PlanoResponse>(`/api/planos/${encodeURIComponent(codigoInicial)}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      setStatus("Plano guardado correctamente.", "ok");
    } else {
      const created = await fetchJson<PlanoResponse>("/api/planos", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setStatus("Plano creado correctamente. Redirigiendo al modo edición...", "ok");
      window.location.href = `editor.html?codigo=${encodeURIComponent(created.codigo)}`;
    }
  } catch (err) {
    setStatus(err instanceof Error ? err.message : "No se pudo guardar el plano.", "error");
  } finally {
    saving = false;
    if (btnSave) btnSave.disabled = false;
  }
}

function createBoxFromDrag(startX: number, startY: number, endX: number, endY: number): { x: number; y: number; width: number; height: number } | null {
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);
  if (width < 8 || height < 8) return null;
  return { x, y, width, height };
}

function addZone(box: { x: number; y: number; width: number; height: number }): void {
  const seccionId = Number(seccionSelect?.value);
  const seccion = secciones.find((item) => item.id === seccionId);
  if (!seccion) {
    setStatus("Selecciona una sección válida antes de dibujar la zona.", "error");
    return;
  }
  if (zones.some((zone) => zone.seccionId === seccionId)) {
    setStatus("Esa sección ya tiene una zona en este plano.", "error");
    return;
  }
  const boxError = validateBox(box);
  if (boxError) {
    setStatus(boxError, "error");
    return;
  }

  const zone: LocalZone = {
    uid: uid("zona"),
    persistedId: null,
    seccionId: seccion.id,
    seccionCodigo: seccion.codigo,
    seccionNombre: seccion.nombre,
    ...box
  };
  zones.push(zone);
  selected = { type: "zone", uid: zone.uid };
  setStatus("Zona añadida al plano.", "ok");
  render();
}

function addRack(box: { x: number; y: number; width: number; height: number }): void {
  const seccionId = Number(seccionSelect?.value);
  const estanteriaCodigo = estanteriaSelect?.value ?? "";
  const estanteria = estanteriasSeccion.find((item) => item.codigo === estanteriaCodigo);
  if (!estanteria) {
    setStatus("Selecciona una estantería válida antes de dibujar.", "error");
    return;
  }
  if (racks.some((rack) => rack.estanteriaCodigo === estanteriaCodigo)) {
    setStatus("Esa estantería ya está colocada en el plano.", "error");
    return;
  }

  const zone = zoneAtBox(box, seccionId);
  if (!zone) {
    setStatus("La estantería debe quedar dentro de una zona de su sección.", "error");
    return;
  }

  const rack: LocalRack = {
    uid: uid("rack"),
    persistedId: null,
    zonaUid: zone.uid,
    seccionId,
    estanteriaCodigo: estanteria.codigo,
    estanteriaNombre: estanteria.nombre,
    orientacion: orientacionSelect?.value === "VERTICAL" ? "VERTICAL" : "HORIZONTAL",
    ...box
  };
  racks.push(rack);
  selected = { type: "rack", uid: rack.uid };
  setStatus("Estantería colocada en el plano.", "ok");
  render();
}

function applySelectedElement(): void {
  const box = {
    x: numberValue(elementX),
    y: numberValue(elementY),
    width: numberValue(elementWidth),
    height: numberValue(elementHeight)
  };
  const boxError = validateBox(box);
  if (boxError) {
    setStatus(boxError, "error");
    return;
  }

  const zone = selectedZone();
  if (zone) {
    const hasRacks = racks.some((rack) => rack.zonaUid === zone.uid && !rackInsideZone(rack, { ...zone, ...box }));
    if (hasRacks) {
      setStatus("No puedes reducir la zona dejando estanterías fuera.", "error");
      return;
    }
    Object.assign(zone, box);
    setStatus("Zona actualizada.", "ok");
    render();
    return;
  }

  const rack = selectedRack();
  if (rack) {
    const zoneForRack = findZoneForRack(rack);
    if (!zoneForRack || !rackInsideZone(box, zoneForRack)) {
      setStatus("La estantería debe quedar dentro de su zona.", "error");
      return;
    }
    Object.assign(rack, box);
    rack.orientacion = elementOrientation?.value === "VERTICAL" ? "VERTICAL" : "HORIZONTAL";
    setStatus("Estantería actualizada.", "ok");
    render();
  }
}

function deleteSelectedElement(): void {
  const zone = selectedZone();
  if (zone) {
    if (racks.some((rack) => rack.zonaUid === zone.uid)) {
      setStatus("Retira las estanterías de la zona antes de eliminarla.", "error");
      return;
    }
    zones = zones.filter((item) => item.uid !== zone.uid);
    selected = null;
    setStatus("Zona eliminada.", "ok");
    render();
    return;
  }

  const rack = selectedRack();
  if (rack) {
    racks = racks.filter((item) => item.uid !== rack.uid);
    selected = null;
    setStatus("Estantería eliminada.", "ok");
    render();
  }
}

function setupDrawing(): void {
  canvas?.addEventListener("pointerdown", (event) => {
    if (mode === "select") return;
    const start = getPointerCoords(event);
    const draft = document.createElement("div");
    draft.className = "draft-node";
    canvas.appendChild(draft);
    drawing = { startX: start.x, startY: start.y, draft };
    canvas.setPointerCapture(event.pointerId);
  });

  canvas?.addEventListener("pointermove", (event) => {
    if (!drawing) return;
    const current = getPointerCoords(event);
    const box = createBoxFromDrag(drawing.startX, drawing.startY, current.x, current.y);
    if (box) positionElement(drawing.draft, box);
  });

  canvas?.addEventListener("pointerup", (event) => {
    if (!drawing) return;
    const current = getPointerCoords(event);
    const box = createBoxFromDrag(drawing.startX, drawing.startY, current.x, current.y);
    drawing.draft.remove();
    drawing = null;
    if (!box) return;
    if (mode === "zone") addZone(box);
    if (mode === "rack") addRack(box);
  });
}

function bindEvents(): void {
  document.querySelectorAll<HTMLButtonElement>(".tool").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode as EditorMode));
  });
  seccionSelect?.addEventListener("change", () => {
    void cargarEstanteriasDeSeccion();
  });
  btnSave?.addEventListener("click", () => {
    void guardarPlano();
  });
  btnApplyElement?.addEventListener("click", applySelectedElement);
  btnDeleteElement?.addEventListener("click", deleteSelectedElement);
  anchoInput?.addEventListener("change", render);
  altoInput?.addEventListener("change", render);
  canvas?.addEventListener("click", () => {
    if (mode === "select") {
      selected = null;
      render();
    }
  });
  setupDrawing();
}

async function init(): Promise<void> {
  setText(editorModeLabel, isEditMode ? "Edición persistente" : "Creación persistente");
  setText(editorTitle, isEditMode ? "Editar plano 2D" : "Crear plano 2D");
  if (btnSave) btnSave.textContent = isEditMode ? "Guardar cambios" : "Guardar plano";
  if (empresaInput) empresaInput.value = "EMP-DEMO";

  bindEvents();
  try {
    await cargarSecciones();
    if (isEditMode && codigoInicial) {
      await cargarPlano(codigoInicial);
      setStatus("Plano cargado correctamente.", "ok");
    } else {
      setStatus("Editor listo para crear un plano nuevo.", "ok");
    }
    render();
  } catch (err) {
    setStatus(err instanceof Error ? err.message : "No se pudo inicializar el editor.", "error");
    render();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  void init();
});
