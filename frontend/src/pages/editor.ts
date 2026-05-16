import { authFetch } from "../lib/api";
import { requireAdminPanelAccess } from "../lib/auth-guard";
import { isStructuralAdmin } from "../lib/api";

requireAdminPanelAccess();

type EditorMode = "select" | "zone" | "rack";
type SelectedElement = { type: "zone"; uid: string } | { type: "rack"; uid: string } | null;
type Orientation = "HORIZONTAL" | "VERTICAL";

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
  productoUuid?: string | null;
  codigoInterno: string | null;
  nombre: string | null;
  descripcion: string | null;
};

type TrabajadorActivoResponse = {
  id: number;
  nombre: string | null;
  apellidos: string | null;
  tipoTrabajador: string | null;
  activo: boolean | null;
};

type PlanoResponsableResponse = {
  trabajadorId: number;
  nombre: string | null;
  apellidos: string | null;
  tipoTrabajador: string | null;
  responsablePrincipal: boolean | null;
};

type SlotConfiguradoResponse = {
  id: number;
  slotId: string;
  orden: number;
  productoEsperado: ProductoResumenResponse | null;
  cantidadObjetivo: number | null;
};

type EstanteriaConfiguracionResponse = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activa: boolean | null;
  seccion: SeccionResponse;
  slots: SlotConfiguradoResponse[];
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

type PlanoOperativoResponsablesResponse = {
  zonas: Array<{
    id: number;
    seccion: SeccionResponse;
    responsables: PlanoResponsableResponse[];
  }>;
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
  estanteriaActiva: boolean | null;
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

type CrearSeccionPayload = {
  empresaCodigo: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
};

type ActualizarSeccionPayload = {
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

type ActualizarEstanteriaPayload = {
  nombre: string;
  descripcion: string | null;
  slots: Array<{
    slotId: string;
    orden: number;
    productoId: number;
    cantidadObjetivo: number;
    activo: boolean;
  }>;
};

type DragState =
  | {
      type: "zone";
      uid: string;
      startX: number;
      startY: number;
      originalZone: Pick<LocalZone, "x" | "y" | "width" | "height">;
      originalRacks: Array<{ uid: string; x: number; y: number }>;
      hasMoved: boolean;
    }
  | {
      type: "rack";
      uid: string;
      startX: number;
      startY: number;
      originalRack: Pick<LocalRack, "x" | "y" | "width" | "height">;
      hasMoved: boolean;
    };

const params = new URLSearchParams(window.location.search);
const codigoInicial = params.get("codigo");
const isEditMode = Boolean(codigoInicial);
const puedeConfigurarEstructura = isStructuralAdmin();

const editorModeLabel = document.querySelector<HTMLElement>("#editor-mode-label");
const editorTitle = document.querySelector<HTMLElement>("#editor-title");
const editorStatus = document.querySelector<HTMLElement>("#editor-status");
const btnSave = document.querySelector<HTMLButtonElement>("#btn-save");
const btnViewPlan = document.querySelector<HTMLAnchorElement>("#btn-view-plan");
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
const elementCode = document.querySelector<HTMLInputElement>("#element-code");
const elementName = document.querySelector<HTMLInputElement>("#element-name");
const elementDescription = document.querySelector<HTMLTextAreaElement>("#element-description");
const elementOrientationField = document.querySelector<HTMLElement>("#element-orientation-field");
const elementOrientation = document.querySelector<HTMLSelectElement>("#element-orientation");
const elementResponsibleField = document.querySelector<HTMLElement>("#element-responsible-field");
const elementResponsible = document.querySelector<HTMLSelectElement>("#element-responsible");
const elementResponsibleNote = document.querySelector<HTMLElement>("#element-responsible-note");
const elementSlotsField = document.querySelector<HTMLElement>("#element-slots-field");
const elementSlotsContainer = document.querySelector<HTMLElement>("#element-slots-container");
const elementEditStatus = document.querySelector<HTMLElement>("#element-edit-status");
const rackStatusActions = document.querySelector<HTMLElement>("#rack-status-actions");
const rackStatusText = document.querySelector<HTMLElement>("#rack-status-text");
const btnDeactivateRack = document.querySelector<HTMLButtonElement>("#btn-deactivate-rack");
const btnReactivateRack = document.querySelector<HTMLButtonElement>("#btn-reactivate-rack");
const btnApplyElement = document.querySelector<HTMLButtonElement>("#btn-apply-element");
const btnDeleteElement = document.querySelector<HTMLButtonElement>("#btn-delete-element");
const toolFeedback = document.querySelector<HTMLElement>("#tool-feedback");
const formInlineSeccion = document.querySelector<HTMLFormElement>("#form-inline-seccion");
const newSeccionCodigoInput = document.querySelector<HTMLInputElement>("#new-seccion-codigo");
const newSeccionNombreInput = document.querySelector<HTMLInputElement>("#new-seccion-nombre");
const newSeccionDescripcionInput = document.querySelector<HTMLTextAreaElement>("#new-seccion-descripcion");
const newSeccionResponsableSelect = document.querySelector<HTMLSelectElement>("#new-seccion-responsable");
const sectionCreateStatus = document.querySelector<HTMLElement>("#section-create-status");
const btnCreateSection = document.querySelector<HTMLButtonElement>("#btn-create-section");
const formInlineRack = document.querySelector<HTMLFormElement>("#form-inline-rack");
const newRackCodigoInput = document.querySelector<HTMLInputElement>("#new-rack-codigo");
const newRackNombreInput = document.querySelector<HTMLInputElement>("#new-rack-nombre");
const newRackDescripcionInput = document.querySelector<HTMLTextAreaElement>("#new-rack-descripcion");
const newRackSlotCountInput = document.querySelector<HTMLInputElement>("#new-rack-slot-count");
const inlineSlotsContainer = document.querySelector<HTMLElement>("#inline-slots-container");
const productsStatus = document.querySelector<HTMLElement>("#products-status");
const rackCreateStatus = document.querySelector<HTMLElement>("#rack-create-status");
const btnCreateRack = document.querySelector<HTMLButtonElement>("#btn-create-rack");
const sectionDialog = document.querySelector<HTMLDialogElement>("#section-dialog");
const rackDialog = document.querySelector<HTMLDialogElement>("#rack-dialog");
const btnOpenSectionDialog = document.querySelector<HTMLButtonElement>("#btn-open-section-dialog");
const btnOpenRackDialog = document.querySelector<HTMLButtonElement>("#btn-open-rack-dialog");
const btnCloseSectionDialog = document.querySelector<HTMLButtonElement>("#btn-close-section-dialog");
const btnCancelSectionDialog = document.querySelector<HTMLButtonElement>("#btn-cancel-section-dialog");
const btnCloseRackDialog = document.querySelector<HTMLButtonElement>("#btn-close-rack-dialog");
const btnCancelRackDialog = document.querySelector<HTMLButtonElement>("#btn-cancel-rack-dialog");
const rackDeactivateDialog = document.querySelector<HTMLDialogElement>("#rack-deactivate-dialog");
const btnCancelRackDeactivate = document.querySelector<HTMLButtonElement>("#btn-cancel-rack-deactivate");
const btnCloseRackDeactivate = document.querySelector<HTMLButtonElement>("#btn-close-rack-deactivate");
const btnConfirmRackDeactivate = document.querySelector<HTMLButtonElement>("#btn-confirm-rack-deactivate");

let mode: EditorMode = "select";
let selected: SelectedElement = null;
let zones: LocalZone[] = [];
let racks: LocalRack[] = [];
let secciones: SeccionResponse[] = [];
let estanteriasSeccion: EstanteriaResumenResponse[] = [];
let productos: ProductoResumenResponse[] = [];
let trabajadoresActivos: TrabajadorActivoResponse[] = [];
const responsablePrincipalPorSeccionId = new Map<number, number>();
const rackConfigurations = new Map<string, EstanteriaConfiguracionResponse>();
let saving = false;
let creatingSection = false;
let creatingRack = false;
let drawing: { startX: number; startY: number; draft: HTMLElement } | null = null;
let dragging: DragState | null = null;
let suppressNextCanvasClick = false;

function setText(element: HTMLElement | null, text: string): void {
  if (element) element.textContent = text;
}

function setStatus(message: string, kind: "info" | "ok" | "error" = "info"): void {
  if (!editorStatus) return;
  editorStatus.textContent = message;
  editorStatus.dataset.kind = kind;
}

function structuralPermissionMessage(): string {
  return "Solo un administrador puede modificar la configuración estructural.";
}

function requireStructuralAdmin(): boolean {
  if (puedeConfigurarEstructura) return true;
  setStatus(structuralPermissionMessage(), "error");
  setInlineStatus(elementEditStatus, structuralPermissionMessage(), "error");
  return false;
}

function applyStructuralPermissions(): void {
  if (puedeConfigurarEstructura) return;

  setStatus("Solo un administrador puede crear o editar planos.", "error");
  btnSave?.setAttribute("disabled", "true");
  btnOpenSectionDialog?.setAttribute("disabled", "true");
  btnOpenRackDialog?.setAttribute("disabled", "true");
  btnCreateSection?.setAttribute("disabled", "true");
  btnCreateRack?.setAttribute("disabled", "true");
  btnApplyElement?.setAttribute("disabled", "true");
  btnDeleteElement?.setAttribute("disabled", "true");
  btnDeactivateRack?.setAttribute("disabled", "true");
  btnReactivateRack?.setAttribute("disabled", "true");
  document.querySelectorAll<HTMLButtonElement>(".tool").forEach((button) => {
    if (button.dataset.mode !== "select") button.disabled = true;
  });
}

function setInlineStatus(element: HTMLElement | null, message: string, kind: "info" | "ok" | "error" = "info"): void {
  if (!element) return;
  element.textContent = message;
  element.dataset.kind = kind;
}

function openDialog(dialog: HTMLDialogElement | null): void {
  if (!dialog) return;
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function closeDialog(dialog: HTMLDialogElement | null): void {
  if (!dialog) return;
  if (typeof dialog.close === "function") {
    dialog.close();
  } else {
    dialog.removeAttribute("open");
  }
}

function textValue(input: HTMLInputElement | HTMLTextAreaElement | null): string {
  return input?.value.trim() ?? "";
}

function nullableText(input: HTMLTextAreaElement | null): string | null {
  const value = textValue(input);
  return value || null;
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

function rackActivo(rack: LocalRack): boolean {
  const config = rackConfigurations.get(rack.estanteriaCodigo);
  if (config?.activa !== undefined && config.activa !== null) return config.activa;

  const estanteria = estanteriasSeccion.find((item) => item.codigo === rack.estanteriaCodigo);
  if (estanteria?.activa !== undefined && estanteria.activa !== null) return estanteria.activa;

  return rack.estanteriaActiva !== false;
}

function setRackEstadoLocal(codigo: string, activa: boolean): void {
  racks = racks.map((rack) => rack.estanteriaCodigo === codigo
    ? { ...rack, estanteriaActiva: activa }
    : rack);
  estanteriasSeccion = estanteriasSeccion.map((estanteria) => estanteria.codigo === codigo
    ? { ...estanteria, activa }
    : estanteria);
}

function selectedSeccionId(): number | null {
  const seccionId = Number(seccionSelect?.value);
  return Number.isFinite(seccionId) && seccionId > 0 ? seccionId : null;
}

function selectedEstanteriaCodigo(): string | null {
  const codigo = estanteriaSelect?.value.trim();
  return codigo || null;
}

function updateToolFeedback(): void {
  if (!toolFeedback) return;

  const seccionId = selectedSeccionId();
  const estanteriaCodigo = selectedEstanteriaCodigo();

  if (!seccionId) {
    toolFeedback.textContent = "Selecciona una sección para dibujar zonas o estanterías.";
    return;
  }

  const todasSeccionesColocadas = secciones.length > 0
    && secciones.every((seccion) => zones.some((zone) => zone.seccionId === seccion.id));
  if (mode === "zone" && todasSeccionesColocadas) {
    toolFeedback.textContent = "Todas las secciones disponibles ya tienen zona en este plano.";
    return;
  }

  if (mode === "zone" && zones.some((zone) => zone.seccionId === seccionId)) {
    toolFeedback.textContent = "La sección seleccionada ya está representada en este plano.";
    return;
  }

  const zonaSeccion = zones.find((zone) => zone.seccionId === seccionId);
  if (mode === "rack" && !zonaSeccion) {
    toolFeedback.textContent = "Crea primero una zona para la sección seleccionada.";
    return;
  }

  const noQuedanEstanterias = estanteriasSeccion.length > 0
    && estanteriasSeccion.every((estanteria) => racks.some((rack) => rack.estanteriaCodigo === estanteria.codigo));
  if (mode === "rack" && noQuedanEstanterias) {
    toolFeedback.textContent = "No quedan estanterías libres de esta sección para añadir.";
    return;
  }

  if (mode === "rack" && estanteriaCodigo && racks.some((rack) => rack.estanteriaCodigo === estanteriaCodigo)) {
    toolFeedback.textContent = "La estantería seleccionada ya está colocada en este plano.";
    return;
  }

  toolFeedback.textContent = "";
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
  updateToolFeedback();
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
  updateToolFeedback();
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
    node.className = `zone-node${selected?.type === "zone" && selected.uid === zone.uid ? " is-selected" : ""}${dragging?.type === "zone" && dragging.uid === zone.uid ? " is-dragging" : ""}`;
    node.dataset.uid = zone.uid;
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      selected = { type: "zone", uid: zone.uid };
      setMode("select");
      render();
    });
    node.addEventListener("pointerdown", (event) => startZoneDrag(event, zone));
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
    node.className = `rack-node ${rack.orientacion.toLowerCase()}${selected?.type === "rack" && selected.uid === rack.uid ? " is-selected" : ""}${dragging?.type === "rack" && dragging.uid === rack.uid ? " is-dragging" : ""}${rackActivo(rack) ? "" : " is-inactive"}`;
    node.dataset.uid = rack.uid;
    node.textContent = rack.estanteriaCodigo;
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      selected = { type: "rack", uid: rack.uid };
      setMode("select");
      render();
    });
    node.addEventListener("pointerdown", (event) => startRackDrag(event, rack));
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
        const estado = rackActivo(rack) ? "Activa" : "Inactiva";
        rackList.appendChild(listItem(`${rack.estanteriaCodigo} · ${rack.orientacion} · ${estado}`, selected?.type === "rack" && selected.uid === rack.uid, () => {
          selected = { type: "rack", uid: rack.uid };
          render();
        }));
      });
    }
  }
  updateToolFeedback();
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
    if (elementResponsibleField) elementResponsibleField.style.display = "none";
    if (rackStatusActions) rackStatusActions.setAttribute("hidden", "");
    setText(elementResponsibleNote, "");
    if (elementEditStatus) elementEditStatus.textContent = "";
    return;
  }

  formElemento?.classList.add("is-visible");
  if (elementEditStatus) elementEditStatus.textContent = "";

  if (zone) {
    setText(selectionSummary, `Zona: ${zone.seccionNombre}`);
    if (elementCode) elementCode.value = zone.seccionCodigo;
    if (elementName) elementName.value = zone.seccionNombre;
    const seccion = secciones.find((item) => item.id === zone.seccionId);
    if (elementDescription) elementDescription.value = seccion?.descripcion ?? "";
    fillElementInputs(zone);
    if (elementOrientationField) elementOrientationField.style.display = "none";
    if (elementResponsibleField) elementResponsibleField.style.display = "grid";
    renderTrabajadorOptions(elementResponsible, responsablePrincipalPorSeccionId.get(zone.seccionId) ?? null);
    setText(elementResponsibleNote, trabajadoresActivos.length === 0
      ? "No hay trabajadores activos disponibles; puedes guardar la zona sin responsable."
      : "El responsable se guarda en la sección/zona, no en las estanterías.");
    if (elementSlotsField) elementSlotsField.style.display = "none";
    if (rackStatusActions) rackStatusActions.setAttribute("hidden", "");
    if (elementSlotsContainer) elementSlotsContainer.innerHTML = "";
    return;
  }

  if (rack) {
    const zoneForRack = findZoneForRack(rack);
    const responsable = zoneForRack ? responsableLabelForSeccion(zoneForRack.seccionId) : "Sin responsable asignado";
    const activo = rackActivo(rack);
    setText(selectionSummary, `Estantería: ${rack.estanteriaCodigo} · ${activo ? "Activa" : "Inactiva"} · Responsable de zona: ${responsable}`);
    if (elementCode) elementCode.value = rack.estanteriaCodigo;
    if (elementName) elementName.value = rack.estanteriaNombre;
    const config = rackConfigurations.get(rack.estanteriaCodigo);
    if (elementDescription) elementDescription.value = config?.descripcion ?? "";
    fillElementInputs(rack);
    if (elementOrientationField) elementOrientationField.style.display = "grid";
    if (elementOrientation) elementOrientation.value = rack.orientacion;
    if (elementResponsibleField) elementResponsibleField.style.display = "none";
    setText(elementResponsibleNote, "");
    renderTrabajadorOptions(elementResponsible);
    if (elementSlotsField) elementSlotsField.style.display = "grid";
    renderElementSlots(config?.slots ?? []);
    if (rackStatusActions) rackStatusActions.removeAttribute("hidden");
    setText(rackStatusText, activo
      ? "Estantería activa para nuevas operaciones."
      : "Estantería inactiva: se conserva en este plano por histórico, pero no estará disponible para nuevas operaciones.");
    if (btnDeactivateRack) btnDeactivateRack.hidden = !activo || !puedeConfigurarEstructura;
    if (btnReactivateRack) btnReactivateRack.hidden = activo || !puedeConfigurarEstructura;
    if (!config) void cargarConfiguracionRack(rack.estanteriaCodigo);
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
  const fieldMessage = data?.fieldErrors ? Object.values(data.fieldErrors)[0] : null;
  if (fieldMessage) return fieldMessage;
  if (data?.message) return data.message;
  if (status === 401) return "La sesión no es válida o ha caducado.";
  if (status === 403) return structuralPermissionMessage();
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

async function cargarSecciones(selectedId?: number): Promise<void> {
  secciones = await fetchJson<SeccionResponse[]>("/api/empresas/EMP-DEMO/secciones");
  if (seccionSelect) {
    const previousValue = selectedId ? String(selectedId) : seccionSelect.value;
    seccionSelect.innerHTML = "";
    if (secciones.length === 0) {
      seccionSelect.appendChild(option("", "No hay secciones disponibles"));
    } else {
      secciones.forEach((seccion) => {
        seccionSelect.appendChild(option(String(seccion.id), `${seccion.nombre} · ${seccion.codigo}`));
      });
      if (previousValue && secciones.some((seccion) => String(seccion.id) === previousValue)) {
        seccionSelect.value = previousValue;
      }
    }
  }
  await cargarEstanteriasDeSeccion();
}

async function cargarProductos(): Promise<void> {
  productos = await fetchJson<ProductoResumenResponse[]>("/api/productos");
  setText(productsStatus, productos.length === 0
    ? "No hay productos activos disponibles."
    : `${productos.length} productos activos disponibles.`);
  renderInlineSlots();
}

async function cargarEstanteriasDeSeccion(selectedCodigo?: string): Promise<void> {
  const seccionId = Number(seccionSelect?.value);
  estanteriasSeccion = Number.isFinite(seccionId) && seccionId > 0
    ? await fetchJson<EstanteriaResumenResponse[]>(`/api/secciones/${seccionId}/estanterias`)
    : [];

  if (estanteriaSelect) {
    const previousValue = selectedCodigo ?? estanteriaSelect.value;
    estanteriaSelect.innerHTML = "";
    if (estanteriasSeccion.length === 0) {
      estanteriaSelect.appendChild(option("", "No hay estanterías disponibles"));
    } else {
      estanteriasSeccion.forEach((estanteria) => {
        estanteriaSelect.appendChild(option(estanteria.codigo, `${estanteria.codigo} · ${estanteria.nombre}`));
      });
      if (previousValue && estanteriasSeccion.some((estanteria) => estanteria.codigo === previousValue)) {
        estanteriaSelect.value = previousValue;
      }
    }
  }
  updateToolFeedback();
}

async function cargarConfiguracionRack(codigo: string): Promise<void> {
  try {
    const config = await fetchJson<EstanteriaConfiguracionResponse>(`/api/estanterias/${encodeURIComponent(codigo)}/configuracion`);
    rackConfigurations.set(codigo, config);
    setRackEstadoLocal(config.codigo, config.activa !== false);
    const rack = selectedRack();
    if (rack?.estanteriaCodigo === codigo) {
      renderSelectionPanel();
    }
  } catch (err) {
    setInlineStatus(elementEditStatus, err instanceof Error ? err.message : "No se pudo cargar la configuración de la estantería.", "error");
  }
}

function option(value: string, text: string): HTMLOptionElement {
  const node = document.createElement("option");
  node.value = value;
  node.textContent = text;
  return node;
}

function productoLabel(producto: ProductoResumenResponse): string {
  const codigo = producto.codigoInterno ? `${producto.codigoInterno} · ` : "";
  return `${codigo}${producto.nombre ?? "Producto sin nombre"}`;
}

function responsableLabelForSeccion(seccionId: number): string {
  const responsableId = responsablePrincipalPorSeccionId.get(seccionId);
  if (!responsableId) return "Sin responsable asignado";
  const trabajador = trabajadoresActivos.find((item) => item.id === responsableId);
  return trabajador ? trabajadorLabel(trabajador) : `Responsable #${responsableId}`;
}

function trabajadorLabel(trabajador: TrabajadorActivoResponse | PlanoResponsableResponse): string {
  const nombre = [trabajador.nombre, trabajador.apellidos].filter(Boolean).join(" ").trim();
  return `${nombre || "Trabajador sin nombre"} · ${trabajador.tipoTrabajador ?? "Sin tipo"}`;
}

function renderTrabajadorOptions(select: HTMLSelectElement | null, selectedId?: number | null): void {
  if (!select) return;
  select.innerHTML = "";
  select.appendChild(option("", trabajadoresActivos.length === 0
    ? "No hay trabajadores activos disponibles"
    : "Sin responsable asignado"));
  trabajadoresActivos.forEach((trabajador) => {
    const node = option(String(trabajador.id), trabajadorLabel(trabajador));
    node.selected = trabajador.id === selectedId;
    select.appendChild(node);
  });
  select.disabled = trabajadoresActivos.length === 0;
}

async function asignarResponsablePrincipal(seccionId: number, trabajadorId: number): Promise<PlanoResponsableResponse> {
  if (!puedeConfigurarEstructura) {
    throw new Error(structuralPermissionMessage());
  }
  const responsable = await fetchJson<PlanoResponsableResponse>(`/api/secciones/${seccionId}/responsable-principal`, {
    method: "PATCH",
    body: JSON.stringify({ trabajadorId })
  });
  responsablePrincipalPorSeccionId.set(seccionId, responsable.trabajadorId);
  return responsable;
}

async function cargarResponsablesDePlano(codigo: string): Promise<void> {
  try {
    const operativo = await fetchJson<PlanoOperativoResponsablesResponse>(`/api/planos/${encodeURIComponent(codigo)}/operativo`);
    responsablePrincipalPorSeccionId.clear();
    operativo.zonas.forEach((zona) => {
      const principal = zona.responsables.find((responsable) => responsable.responsablePrincipal);
      if (principal) {
        responsablePrincipalPorSeccionId.set(zona.seccion.id, principal.trabajadorId);
      }
    });
  } catch {
    // El responsable no bloquea la edición del layout.
  }
}

async function cargarTrabajadoresActivos(): Promise<void> {
  trabajadoresActivos = await fetchJson<TrabajadorActivoResponse[]>("/api/trabajadores/activos");
  renderTrabajadorOptions(newSeccionResponsableSelect);
  renderTrabajadorOptions(elementResponsible, selectedZone()
    ? responsablePrincipalPorSeccionId.get(selectedZone()!.seccionId)
    : null);
}

function renderInlineSlots(): void {
  if (!inlineSlotsContainer) return;
  const count = Math.max(1, Math.min(24, Number(newRackSlotCountInput?.value) || 4));
  if (newRackSlotCountInput) newRackSlotCountInput.value = String(count);
  inlineSlotsContainer.innerHTML = "";

  for (let index = 1; index <= count; index += 1) {
    const row = document.createElement("div");
    row.className = "slot-row";

    const slotId = document.createElement("input");
    slotId.type = "text";
    slotId.value = `slot_${index}`;
    slotId.maxLength = 50;
    slotId.dataset.field = "slotId";
    slotId.setAttribute("aria-label", `Slot ${index}`);

    const orden = document.createElement("input");
    orden.type = "number";
    orden.value = String(index);
    orden.min = "1";
    orden.step = "1";
    orden.dataset.field = "orden";
    orden.setAttribute("aria-label", `Orden ${index}`);

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
    cantidad.dataset.field = "cantidadObjetivo";
    cantidad.setAttribute("aria-label", `Cantidad objetivo ${index}`);

    row.append(
      labeledSlotField("Slot", slotId),
      labeledSlotField("Orden", orden),
      labeledSlotField("Producto esperado", producto),
      labeledSlotField("Cantidad", cantidad)
    );
    inlineSlotsContainer.appendChild(row);
  }
}

function renderElementSlots(slots: SlotConfiguradoResponse[]): void {
  if (!elementSlotsContainer) return;
  elementSlotsContainer.innerHTML = "";

  if (slots.length === 0) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "No hay slots configurados o todavía se está cargando su configuración.";
    elementSlotsContainer.appendChild(empty);
    return;
  }

  slots.forEach((slot) => {
    const row = document.createElement("div");
    row.className = "slot-row";

    const slotId = document.createElement("input");
    slotId.type = "text";
    slotId.value = slot.slotId;
    slotId.maxLength = 50;
    slotId.dataset.field = "slotId";
    slotId.setAttribute("aria-label", `Slot ${slot.orden}`);

    const orden = document.createElement("input");
    orden.type = "number";
    orden.value = String(slot.orden);
    orden.min = "1";
    orden.step = "1";
    orden.dataset.field = "orden";
    orden.setAttribute("aria-label", `Orden ${slot.orden}`);

    const producto = document.createElement("select");
    producto.dataset.field = "productoId";
    producto.setAttribute("aria-label", `Producto esperado ${slot.orden}`);
    if (productos.length === 0) {
      producto.appendChild(option("", "No hay productos activos"));
    } else {
      productos.forEach((item) => producto.appendChild(option(String(item.id), productoLabel(item))));
      const productoId = slot.productoEsperado?.id;
      if (productoId && productos.some((item) => item.id === productoId)) {
        producto.value = String(productoId);
      }
    }

    const cantidad = document.createElement("input");
    cantidad.type = "number";
    cantidad.value = String(slot.cantidadObjetivo ?? 0);
    cantidad.min = "0";
    cantidad.step = "1";
    cantidad.dataset.field = "cantidadObjetivo";
    cantidad.setAttribute("aria-label", `Cantidad objetivo ${slot.orden}`);

    row.append(
      labeledSlotField("Slot", slotId),
      labeledSlotField("Orden", orden),
      labeledSlotField("Producto esperado", producto),
      labeledSlotField("Cantidad", cantidad)
    );
    elementSlotsContainer.appendChild(row);
  });
}

function labeledSlotField(labelText: string, control: HTMLElement): HTMLElement {
  const wrap = document.createElement("label");
  wrap.className = "slot-field";
  const label = document.createElement("span");
  label.textContent = labelText;
  wrap.append(label, control);
  return wrap;
}

async function cargarPlano(codigo: string): Promise<void> {
  const plano = await fetchJson<PlanoResponse>(`/api/planos/${encodeURIComponent(codigo)}`);
  if (btnViewPlan) btnViewPlan.href = `planos.html?codigo=${encodeURIComponent(plano.codigo)}`;
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
      estanteriaActiva: layout.estanteria.activa,
      x: layout.x,
      y: layout.y,
      width: layout.width,
      height: layout.height,
      orientacion: layout.orientacion
    }];
  });

  await cargarResponsablesDePlano(plano.codigo);
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

function buildSeccionPayload(): CrearSeccionPayload | string {
  const empresaCodigo = empresaInput?.value.trim() || "EMP-DEMO";
  const codigo = textValue(newSeccionCodigoInput);
  const nombre = textValue(newSeccionNombreInput);
  if (!empresaCodigo) return "El código de empresa es obligatorio.";
  if (!codigo) return "El código de sección es obligatorio.";
  if (!nombre) return "El nombre de sección es obligatorio.";

  return {
    empresaCodigo,
    codigo,
    nombre,
    descripcion: nullableText(newSeccionDescripcionInput)
  };
}

function buildEstanteriaPayload(): CrearEstanteriaPayload | string {
  const seccionId = selectedSeccionId();
  const codigo = textValue(newRackCodigoInput);
  const nombre = textValue(newRackNombreInput);

  if (!seccionId) return "Selecciona una sección válida antes de crear la estantería.";
  if (!codigo) return "El código de estantería es obligatorio.";
  if (!nombre) return "El nombre de estantería es obligatorio.";
  if (productos.length === 0) return "No hay productos activos para asignar a los slots.";

  const rows = Array.from(inlineSlotsContainer?.querySelectorAll<HTMLElement>(".slot-row") ?? []);
  if (rows.length === 0) return "La estantería debe tener al menos un slot.";

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

  const slotIds = new Set<string>();
  const ordenes = new Set<number>();
  for (const slot of slots) {
    const normalizedSlotId = slot.slotId.toLowerCase();
    if (slotIds.has(normalizedSlotId)) return "No puedes repetir identificadores de slot.";
    if (ordenes.has(slot.orden)) return "No puedes repetir órdenes de slot.";
    slotIds.add(normalizedSlotId);
    ordenes.add(slot.orden);
  }

  return {
    seccionId,
    codigo,
    nombre,
    descripcion: nullableText(newRackDescripcionInput),
    slots
  };
}

function buildActualizarEstanteriaPayload(): ActualizarEstanteriaPayload | string {
  const nombre = textValue(elementName);
  if (!nombre) return "El nombre de estantería es obligatorio.";
  if (productos.length === 0) return "No hay productos activos para asignar a los slots.";

  const rows = Array.from(elementSlotsContainer?.querySelectorAll<HTMLElement>(".slot-row") ?? []);
  if (rows.length === 0) return "La estantería debe tener al menos un slot configurado.";

  const slots = rows.map((row) => {
    const slotId = row.querySelector<HTMLInputElement>("[data-field='slotId']")?.value.trim() ?? "";
    const orden = Number(row.querySelector<HTMLInputElement>("[data-field='orden']")?.value);
    const productoId = Number(row.querySelector<HTMLSelectElement>("[data-field='productoId']")?.value);
    const cantidadObjetivo = Number(row.querySelector<HTMLInputElement>("[data-field='cantidadObjetivo']")?.value);
    return { slotId, orden, productoId, cantidadObjetivo, activo: true };
  });

  if (slots.some((slot) => !slot.slotId)) return "Todos los slots deben tener identificador.";
  if (slots.some((slot) => !Number.isFinite(slot.orden) || slot.orden <= 0)) return "Todos los slots deben tener orden mayor que cero.";
  if (slots.some((slot) => !Number.isFinite(slot.productoId) || slot.productoId <= 0)) return "Todos los slots deben tener producto esperado.";
  if (slots.some((slot) => !Number.isFinite(slot.cantidadObjetivo) || slot.cantidadObjetivo < 0)) return "La cantidad objetivo no puede ser negativa.";

  const slotIds = new Set<string>();
  const ordenes = new Set<number>();
  for (const slot of slots) {
    const normalizedSlotId = slot.slotId.toLowerCase();
    if (slotIds.has(normalizedSlotId)) return "No puedes repetir identificadores de slot.";
    if (ordenes.has(slot.orden)) return "No puedes repetir órdenes de slot.";
    slotIds.add(normalizedSlotId);
    ordenes.add(slot.orden);
  }

  return {
    nombre,
    descripcion: nullableText(elementDescription),
    slots
  };
}

async function crearSeccionInline(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  if (!requireStructuralAdmin()) return;
  if (creatingSection) return;

  const payload = buildSeccionPayload();
  if (typeof payload === "string") {
    setInlineStatus(sectionCreateStatus, payload, "error");
    return;
  }

  creatingSection = true;
  if (btnCreateSection) btnCreateSection.disabled = true;
  setInlineStatus(sectionCreateStatus, "Creando sección...", "info");

  try {
    const created = await fetchJson<SeccionResponse>("/api/secciones", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const responsableId = Number(newSeccionResponsableSelect?.value);
    if (Number.isFinite(responsableId) && responsableId > 0) {
      await asignarResponsablePrincipal(created.id, responsableId);
    }
    formInlineSeccion?.reset();
    renderTrabajadorOptions(newSeccionResponsableSelect);
    await cargarSecciones(created.id);
    setMode("zone");
    setInlineStatus(sectionCreateStatus, "Sección creada y seleccionada. Dibuja su zona en el lienzo.", "ok");
    setStatus("Sección creada. Arrastra en el lienzo para añadir la zona.", "ok");
    closeDialog(sectionDialog);
  } catch (err) {
    setInlineStatus(sectionCreateStatus, err instanceof Error ? err.message : "No se pudo crear la sección.", "error");
  } finally {
    creatingSection = false;
    if (btnCreateSection) btnCreateSection.disabled = false;
  }
}

async function crearEstanteriaInline(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  if (!requireStructuralAdmin()) return;
  if (creatingRack) return;

  const payload = buildEstanteriaPayload();
  if (typeof payload === "string") {
    setInlineStatus(rackCreateStatus, payload, "error");
    return;
  }

  creatingRack = true;
  if (btnCreateRack) btnCreateRack.disabled = true;
  setInlineStatus(rackCreateStatus, "Creando estantería...", "info");

  try {
    const created = await fetchJson<EstanteriaConfiguracionResponse>("/api/estanterias", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    rackConfigurations.set(created.codigo, created);
    formInlineRack?.reset();
    if (newRackSlotCountInput) newRackSlotCountInput.value = "4";
    renderInlineSlots();
    await cargarEstanteriasDeSeccion(created.codigo);
    setMode("rack");
    setInlineStatus(rackCreateStatus, "Estantería creada y seleccionada. Dibújala dentro de su zona.", "ok");
    setStatus("Estantería creada. Arrastra dentro de su zona para colocarla.", "ok");
    closeDialog(rackDialog);
  } catch (err) {
    setInlineStatus(rackCreateStatus, err instanceof Error ? err.message : "No se pudo crear la estantería.", "error");
  } finally {
    creatingRack = false;
    if (btnCreateRack) btnCreateRack.disabled = false;
  }
}

async function guardarPlano(): Promise<void> {
  if (!requireStructuralAdmin()) return;
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
  if (!requireStructuralAdmin()) return;
  const seccionId = Number(seccionSelect?.value);
  const seccion = secciones.find((item) => item.id === seccionId);
  if (!seccion) {
    setStatus("Selecciona una sección válida antes de dibujar la zona.", "error");
    return;
  }
  if (zones.some((zone) => zone.seccionId === seccionId)) {
    setStatus("La sección seleccionada ya está representada en este plano.", "error");
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
  if (!requireStructuralAdmin()) return;
  const seccionId = Number(seccionSelect?.value);
  const estanteriaCodigo = estanteriaSelect?.value ?? "";
  const estanteria = estanteriasSeccion.find((item) => item.codigo === estanteriaCodigo);
  if (!estanteria) {
    setStatus("Selecciona una estantería válida antes de dibujar.", "error");
    return;
  }
  if (racks.some((rack) => rack.estanteriaCodigo === estanteriaCodigo)) {
    setStatus("La estantería seleccionada ya está colocada en este plano.", "error");
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
    estanteriaActiva: estanteria.activa,
    orientacion: orientacionSelect?.value === "VERTICAL" ? "VERTICAL" : "HORIZONTAL",
    ...box
  };
  racks.push(rack);
  selected = { type: "rack", uid: rack.uid };
  setStatus("Estantería colocada en el plano.", "ok");
  render();
}

function applySelectedElement(): void {
  if (!requireStructuralAdmin()) return;
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
    const nextZone: LocalZone = { ...zone, ...box };
    const deltaX = nextZone.x - zone.x;
    const deltaY = nextZone.y - zone.y;
    const movedRacks = racks
      .filter((rack) => rack.zonaUid === zone.uid)
      .map((rack) => ({
        rack,
        next: {
          ...rack,
          x: rack.x + deltaX,
          y: rack.y + deltaY
        }
      }));

    const hasRacksOutside = movedRacks.some(({ next }) => !rackInsideZone(next, nextZone));
    if (hasRacksOutside) {
      setStatus(deltaX !== 0 || deltaY !== 0
        ? "No puedes mover la zona dejando estanterías fuera."
        : "No puedes reducir la zona dejando estanterías fuera.", "error");
      return;
    }

    Object.assign(zone, nextZone);
    const nextName = textValue(elementName);
    const nextDescription = nullableText(elementDescription);
    if (nextName) {
      zone.seccionNombre = nextName;
      const seccion = secciones.find((item) => item.id === zone.seccionId);
      if (seccion) {
        seccion.nombre = nextName;
        seccion.descripcion = nextDescription;
      }
    }
    movedRacks.forEach(({ rack, next }) => {
      rack.x = next.x;
      rack.y = next.y;
    });
    void persistirSeccion(zone, deltaX !== 0 || deltaY !== 0);
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
    const nextName = textValue(elementName);
    if (nextName) rack.estanteriaNombre = nextName;
    void persistirEstanteria(rack);
  }
}

async function persistirSeccion(zone: LocalZone, moved: boolean): Promise<void> {
  const payload: ActualizarSeccionPayload = {
    codigo: zone.seccionCodigo,
    nombre: zone.seccionNombre,
    descripcion: nullableText(elementDescription)
  };
  const responsableId = Number(elementResponsible?.value);
  const responsableActualId = responsablePrincipalPorSeccionId.get(zone.seccionId);

  try {
    const updated = await fetchJson<SeccionResponse>(`/api/secciones/${zone.seccionId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    zone.seccionCodigo = updated.codigo;
    zone.seccionNombre = updated.nombre;
    secciones = secciones.map((item) => item.id === updated.id ? updated : item);
    if (Number.isFinite(responsableId) && responsableId > 0 && responsableId !== responsableActualId) {
      await asignarResponsablePrincipal(zone.seccionId, responsableId);
    }
    setStatus(moved ? "Zona actualizada y estanterías desplazadas." : "Zona actualizada.", "ok");
    setInlineStatus(elementEditStatus, "Datos de sección guardados.", "ok");
  } catch (err) {
    setInlineStatus(elementEditStatus, err instanceof Error ? err.message : "No se pudo guardar la sección.", "error");
  } finally {
    render();
  }
}

async function persistirEstanteria(rack: LocalRack): Promise<void> {
  const payload = buildActualizarEstanteriaPayload();
  if (typeof payload === "string") {
    setInlineStatus(elementEditStatus, payload, "error");
    render();
    return;
  }

  try {
    const updated = await fetchJson<EstanteriaConfiguracionResponse>(`/api/estanterias/${encodeURIComponent(rack.estanteriaCodigo)}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    rack.estanteriaNombre = updated.nombre;
    rack.estanteriaActiva = updated.activa;
    rackConfigurations.set(updated.codigo, updated);
    estanteriasSeccion = estanteriasSeccion.map((item) => item.codigo === updated.codigo
      ? { id: updated.id, codigo: updated.codigo, nombre: updated.nombre, descripcion: updated.descripcion, activa: updated.activa }
      : item);
    setStatus("Estantería actualizada.", "ok");
    setInlineStatus(elementEditStatus, "Datos y slots de estantería guardados.", "ok");
  } catch (err) {
    setInlineStatus(elementEditStatus, err instanceof Error ? err.message : "No se pudo guardar la estantería.", "error");
  } finally {
    render();
  }
}

function abrirConfirmacionDesactivarEstanteria(): void {
  if (!requireStructuralAdmin()) return;
  const rack = selectedRack();
  if (!rack) {
    setInlineStatus(elementEditStatus, "Selecciona una estantería antes de desactivarla.", "error");
    return;
  }
  openDialog(rackDeactivateDialog);
}

async function cambiarEstadoEstanteria(rack: LocalRack, activa: boolean): Promise<void> {
  const endpoint = activa ? "reactivar" : "desactivar";
  const updated = await fetchJson<EstanteriaConfiguracionResponse>(
    `/api/estanterias/${encodeURIComponent(rack.estanteriaCodigo)}/${endpoint}`,
    { method: "PATCH" }
  );

  const activaActual = updated.activa !== false;
  rack.estanteriaNombre = updated.nombre;
  rack.estanteriaActiva = activaActual;
  rackConfigurations.set(updated.codigo, updated);
  setRackEstadoLocal(updated.codigo, activaActual);
  await cargarEstanteriasDeSeccion(activaActual ? updated.codigo : undefined);
  setStatus(
    activaActual
      ? "Estantería reactivada. Ya está disponible para nuevas operaciones."
      : "Estantería desactivada. Se conserva el histórico operativo.",
    "ok"
  );
  setInlineStatus(
    elementEditStatus,
    activaActual
      ? "Estantería reactivada."
      : "La estantería seguirá visible en el plano hasta que edites el layout.",
    "ok"
  );
  render();
}

async function confirmarDesactivarEstanteria(): Promise<void> {
  const rack = selectedRack();
  if (!rack) return;

  btnConfirmRackDeactivate?.setAttribute("disabled", "true");
  try {
    await cambiarEstadoEstanteria(rack, false);
    closeDialog(rackDeactivateDialog);
  } catch (err) {
    setInlineStatus(elementEditStatus, err instanceof Error ? err.message : "No se pudo desactivar la estantería.", "error");
  } finally {
    btnConfirmRackDeactivate?.removeAttribute("disabled");
  }
}

async function reactivarEstanteriaSeleccionada(): Promise<void> {
  if (!requireStructuralAdmin()) return;
  const rack = selectedRack();
  if (!rack) {
    setInlineStatus(elementEditStatus, "Selecciona una estantería antes de reactivarla.", "error");
    return;
  }

  btnReactivateRack?.setAttribute("disabled", "true");
  try {
    await cambiarEstadoEstanteria(rack, true);
  } catch (err) {
    setInlineStatus(elementEditStatus, err instanceof Error ? err.message : "No se pudo reactivar la estantería.", "error");
  } finally {
    btnReactivateRack?.removeAttribute("disabled");
  }
}

function deleteSelectedElement(): void {
  if (!requireStructuralAdmin()) return;
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

function startZoneDrag(event: PointerEvent, zone: LocalZone): void {
  if (mode !== "select") return;
  if (!puedeConfigurarEstructura) {
    setStatus(structuralPermissionMessage(), "error");
    return;
  }
  event.stopPropagation();
  const start = getPointerCoords(event);
  selected = { type: "zone", uid: zone.uid };
  dragging = {
    type: "zone",
    uid: zone.uid,
    startX: start.x,
    startY: start.y,
    originalZone: {
      x: zone.x,
      y: zone.y,
      width: zone.width,
      height: zone.height
    },
    originalRacks: racks
      .filter((rack) => rack.zonaUid === zone.uid)
      .map((rack) => ({ uid: rack.uid, x: rack.x, y: rack.y })),
    hasMoved: false
  };
  render();
}

function startRackDrag(event: PointerEvent, rack: LocalRack): void {
  if (mode !== "select") return;
  if (!puedeConfigurarEstructura) {
    setStatus(structuralPermissionMessage(), "error");
    return;
  }
  event.stopPropagation();
  const start = getPointerCoords(event);
  selected = { type: "rack", uid: rack.uid };
  dragging = {
    type: "rack",
    uid: rack.uid,
    startX: start.x,
    startY: start.y,
    originalRack: {
      x: rack.x,
      y: rack.y,
      width: rack.width,
      height: rack.height
    },
    hasMoved: false
  };
  render();
}

function moveDraggingElement(event: PointerEvent): void {
  if (!dragging) return;
  const current = getPointerCoords(event);
  const deltaX = current.x - dragging.startX;
  const deltaY = current.y - dragging.startY;
  if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;
  dragging.hasMoved = true;

  if (dragging.type === "zone") {
    const activeDrag = dragging;
    const zone = zones.find((item) => item.uid === activeDrag.uid);
    if (!zone) return;
    zone.x = activeDrag.originalZone.x + deltaX;
    zone.y = activeDrag.originalZone.y + deltaY;
    activeDrag.originalRacks.forEach((originalRack) => {
      const rack = racks.find((item) => item.uid === originalRack.uid);
      if (!rack) return;
      rack.x = originalRack.x + deltaX;
      rack.y = originalRack.y + deltaY;
    });
    render();
    return;
  }

  const activeDrag = dragging;
  const rack = racks.find((item) => item.uid === activeDrag.uid);
  if (!rack) return;
  rack.x = activeDrag.originalRack.x + deltaX;
  rack.y = activeDrag.originalRack.y + deltaY;
  render();
}

function finishDraggingElement(): void {
  if (!dragging) return;
  const activeDrag = dragging;
  dragging = null;

  if (!activeDrag.hasMoved) {
    render();
    return;
  }

  suppressNextCanvasClick = true;

  if (activeDrag.type === "zone") {
    const zone = zones.find((item) => item.uid === activeDrag.uid);
    if (!zone) return;
    const boxError = validateBox(zone);
    const hasRacksOutside = racks.some((rack) => rack.zonaUid === zone.uid && !rackInsideZone(rack, zone));
    if (boxError || hasRacksOutside) {
      zone.x = activeDrag.originalZone.x;
      zone.y = activeDrag.originalZone.y;
      zone.width = activeDrag.originalZone.width;
      zone.height = activeDrag.originalZone.height;
      activeDrag.originalRacks.forEach((originalRack) => {
        const rack = racks.find((item) => item.uid === originalRack.uid);
        if (!rack) return;
        rack.x = originalRack.x;
        rack.y = originalRack.y;
      });
      setStatus(boxError ?? "No puedes mover la zona dejando estanterías fuera.", "error");
      render();
      return;
    }
    setStatus("Zona movida. Las estanterías asociadas se desplazaron con ella.", "ok");
    render();
    return;
  }

  const rack = racks.find((item) => item.uid === activeDrag.uid);
  if (!rack) return;
  const zone = findZoneForRack(rack);
  if (!zone || !rackInsideZone(rack, zone)) {
    rack.x = activeDrag.originalRack.x;
    rack.y = activeDrag.originalRack.y;
    rack.width = activeDrag.originalRack.width;
    rack.height = activeDrag.originalRack.height;
    setStatus("La estantería debe permanecer dentro de su zona.", "error");
    render();
    return;
  }
  setStatus("Estantería movida.", "ok");
  render();
}

function setupDrawing(): void {
  canvas?.addEventListener("pointerdown", (event) => {
    if (mode === "select") return;
    if (!requireStructuralAdmin()) return;
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
  estanteriaSelect?.addEventListener("change", updateToolFeedback);
  formInlineSeccion?.addEventListener("submit", (event) => {
    void crearSeccionInline(event);
  });
  formInlineRack?.addEventListener("submit", (event) => {
    void crearEstanteriaInline(event);
  });
  btnOpenSectionDialog?.addEventListener("click", () => {
    setInlineStatus(sectionCreateStatus, "", "info");
    openDialog(sectionDialog);
  });
  btnOpenRackDialog?.addEventListener("click", () => {
    setInlineStatus(rackCreateStatus, "", "info");
    renderInlineSlots();
    openDialog(rackDialog);
  });
  btnCloseSectionDialog?.addEventListener("click", () => closeDialog(sectionDialog));
  btnCancelSectionDialog?.addEventListener("click", () => closeDialog(sectionDialog));
  btnCloseRackDialog?.addEventListener("click", () => closeDialog(rackDialog));
  btnCancelRackDialog?.addEventListener("click", () => closeDialog(rackDialog));
  newRackSlotCountInput?.addEventListener("input", renderInlineSlots);
  newRackSlotCountInput?.addEventListener("change", renderInlineSlots);
  btnSave?.addEventListener("click", () => {
    void guardarPlano();
  });
  btnApplyElement?.addEventListener("click", applySelectedElement);
  btnDeleteElement?.addEventListener("click", deleteSelectedElement);
  btnDeactivateRack?.addEventListener("click", abrirConfirmacionDesactivarEstanteria);
  btnReactivateRack?.addEventListener("click", () => {
    void reactivarEstanteriaSeleccionada();
  });
  btnCancelRackDeactivate?.addEventListener("click", () => closeDialog(rackDeactivateDialog));
  btnCloseRackDeactivate?.addEventListener("click", () => closeDialog(rackDeactivateDialog));
  btnConfirmRackDeactivate?.addEventListener("click", () => {
    void confirmarDesactivarEstanteria();
  });
  anchoInput?.addEventListener("change", render);
  altoInput?.addEventListener("change", render);
  canvas?.addEventListener("click", () => {
    if (suppressNextCanvasClick) {
      suppressNextCanvasClick = false;
      return;
    }
    if (mode === "select") {
      selected = null;
      render();
    }
  });
  window.addEventListener("pointermove", moveDraggingElement);
  window.addEventListener("pointerup", finishDraggingElement);
  setupDrawing();
}

async function init(): Promise<void> {
  setText(editorModeLabel, isEditMode ? "Edición persistente" : "Creación persistente");
  setText(editorTitle, isEditMode ? "Editar plano 2D" : "Crear plano 2D");
  if (btnSave) btnSave.textContent = isEditMode ? "Guardar cambios" : "Guardar plano";
  if (empresaInput) empresaInput.value = "EMP-DEMO";

  bindEvents();
  applyStructuralPermissions();
  try {
    await Promise.all([cargarSecciones(), cargarProductos(), cargarTrabajadoresActivos()]);
    if (isEditMode && codigoInicial) {
      await cargarPlano(codigoInicial);
      setStatus("Plano cargado correctamente.", "ok");
    } else {
      setStatus("Editor listo para crear un plano nuevo.", "ok");
    }
    render();
    applyStructuralPermissions();
  } catch (err) {
    setStatus(err instanceof Error ? err.message : "No se pudo inicializar el editor.", "error");
    render();
    applyStructuralPermissions();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  void init();
});
