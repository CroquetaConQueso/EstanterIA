type EstadoInspeccion = 'CREADA' | 'ACTUALIZADA' | 'LISTA' | string;

type InspeccionItem = {
  id: number;
  estanteriaCodigo: string;
  notas: string | null;
  imagenPath?: string | null;
  imagePath?: string | null;
  imageUrl?: string | null;
  estado: EstadoInspeccion;
  createdAt: string;
};

const API_BASE_URL =
  (document.body?.getAttribute('data-api-base-url')?.trim() || window.location.origin).replace(/\/$/, '');

const tbody = document.getElementById('tbody-inspecciones') as HTMLTableSectionElement | null;
const filtroPlano = document.getElementById('filtro-plano') as HTMLInputElement | null;
const filtroEstado = document.getElementById('filtro-estado') as HTMLSelectElement | null;
const filtroDia = document.getElementById('filtro-dia') as HTMLInputElement | null;
const filtroDesde = document.getElementById('filtro-desde') as HTMLInputElement | null;
const filtroHasta = document.getElementById('filtro-hasta') as HTMLInputElement | null;
const ordenFecha = document.getElementById('orden-fecha') as HTMLSelectElement | null;
const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros') as HTMLButtonElement | null;

const inspeccionesError = document.getElementById('inspecciones-error') as HTMLElement | null;
const inspeccionesSuccess = document.getElementById('inspecciones-success') as HTMLElement | null;

const photoPlaceholder = document.getElementById('photo-placeholder') as HTMLElement | null;
const detalleResumen = document.getElementById('detalle-resumen') as HTMLUListElement | null;
const detalleOk = document.getElementById('detalle-ok') as HTMLUListElement | null;
const detalleGaps = document.getElementById('detalle-gaps') as HTMLUListElement | null;
const detalleError = document.getElementById('detalle-error') as HTMLElement | null;

const quickActions = document.getElementById('quick-actions') as HTMLElement | null;
const btnIrDetalle = document.getElementById('btn-ir-detalle') as HTMLAnchorElement | null;
const btnIrEditar = document.getElementById('btn-ir-editar') as HTMLAnchorElement | null;
const btnAbrirImagen = document.getElementById('btn-abrir-imagen') as HTMLAnchorElement | null;

let inspeccionesCache: InspeccionItem[] = [];
let selectedInspeccionId: number | null = null;

function setError(msg: string | null): void {
  if (!inspeccionesError) return;

  if (!msg) {
    inspeccionesError.textContent = '';
    inspeccionesError.setAttribute('hidden', '');
    return;
  }

  inspeccionesError.textContent = msg;
  inspeccionesError.removeAttribute('hidden');
}

function setSuccess(msg: string | null): void {
  if (!inspeccionesSuccess) return;

  if (!msg) {
    inspeccionesSuccess.textContent = '';
    inspeccionesSuccess.setAttribute('hidden', '');
    return;
  }

  inspeccionesSuccess.textContent = msg;
  inspeccionesSuccess.removeAttribute('hidden');
}

function setDetalleError(msg: string | null): void {
  if (!detalleError) return;

  if (!msg) {
    detalleError.textContent = '';
    detalleError.setAttribute('hidden', '');
    return;
  }

  detalleError.textContent = msg;
  detalleError.removeAttribute('hidden');
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
}

function getDateKeyLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getItemDateKey(ins: InspeccionItem): string | null {
  if (!ins.createdAt) return null;

  const date = new Date(ins.createdAt);
  if (Number.isNaN(date.getTime())) return null;

  return getDateKeyLocal(date);
}

function getImagenPath(ins: InspeccionItem): string | null {
  const value = ins.imagenPath ?? ins.imagePath ?? null;
  return value?.trim() ? value.trim() : null;
}

function normalizeImageUrl(raw: string): string {
  const trimmed = raw.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  let normalized = trimmed;

  if (normalized.startsWith('./')) {
    normalized = normalized.substring(1);
  }

  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }

  return `${API_BASE_URL}${normalized}`;
}

function buildImageUrl(ins: InspeccionItem): string | null {
  const rawImageUrl = ins.imageUrl?.trim();

  if (rawImageUrl) {
    return normalizeImageUrl(rawImageUrl);
  }

  const imagenPath = getImagenPath(ins);
  if (!imagenPath) {
    return null;
  }

  return `${API_BASE_URL}/captures/${encodeURIComponent(imagenPath)}`;
}

function buildEstadoBadge(estado: EstadoInspeccion): string {
  const normalized = (estado ?? '').toUpperCase();

  if (normalized === 'CREADA') {
    return `<span class="badge-gap">CREADA</span>`;
  }

  if (normalized === 'ACTUALIZADA') {
    return `<span class="badge-ok">ACTUALIZADA</span>`;
  }

  if (normalized === 'LISTA') {
    return `<span class="badge-ok">LISTA</span>`;
  }

  return `<span class="badge-gap">${normalized || 'DESCONOCIDO'}</span>`;
}

function clearList(el: HTMLUListElement | null): void {
  if (!el) return;
  el.innerHTML = '';
}

function appendListItem(el: HTMLUListElement | null, text: string): void {
  if (!el) return;
  const li = document.createElement('li');
  li.textContent = text;
  el.appendChild(li);
}

function updateQuickActionLinks(ins: InspeccionItem): void {
  if (!quickActions || !btnIrDetalle || !btnIrEditar || !btnAbrirImagen) return;

  quickActions.removeAttribute('hidden');
  btnIrDetalle.href = `inspeccion_detalle.html?id=${encodeURIComponent(ins.id)}`;
  btnIrEditar.href = `inspeccion_editar.html?id=${encodeURIComponent(ins.id)}`;

  const imageUrl = buildImageUrl(ins);
  if (imageUrl) {
    btnAbrirImagen.href = imageUrl;
    btnAbrirImagen.removeAttribute('aria-disabled');
  } else {
    btnAbrirImagen.href = '#';
    btnAbrirImagen.setAttribute('aria-disabled', 'true');
  }
}

function renderInspectionImage(ins: InspeccionItem): void {
  if (!photoPlaceholder) return;

  const imageUrl = buildImageUrl(ins);

  if (!imageUrl) {
    photoPlaceholder.innerHTML = '<span>Sin imagen disponible</span>';
    return;
  }

  photoPlaceholder.innerHTML = '';

  const img = document.createElement('img');
  img.src = imageUrl;
  img.alt = `Captura de la inspección ${ins.id}`;
  img.className = 'inspection-image';

  img.onerror = () => {
    photoPlaceholder.innerHTML = '<span>No se pudo cargar la imagen de la inspección</span>';
    setDetalleError(`No se pudo cargar la imagen desde: ${imageUrl}`);
    console.error('Error cargando imagen:', imageUrl);
  };

  photoPlaceholder.appendChild(img);
}

function renderDetalle(ins: InspeccionItem): void {
  selectedInspeccionId = ins.id;
  setDetalleError(null);
  renderInspectionImage(ins);
  updateQuickActionLinks(ins);

  clearList(detalleResumen);
  clearList(detalleOk);
  clearList(detalleGaps);

  appendListItem(detalleResumen, `ID: ${ins.id}`);
  appendListItem(detalleResumen, `Estantería: ${ins.estanteriaCodigo}`);
  appendListItem(detalleResumen, `Estado: ${ins.estado}`);
  appendListItem(detalleResumen, `Fecha: ${formatDate(ins.createdAt)}`);
  appendListItem(detalleResumen, `Notas: ${ins.notas?.trim() || '—'}`);

  const imagenPath = getImagenPath(ins);
  appendListItem(detalleResumen, `Archivo: ${imagenPath || '—'}`);

  appendListItem(detalleOk, 'Pendiente de conectar detalle real de productos OK');
  appendListItem(detalleGaps, 'Pendiente de conectar detalle real de huecos');

  renderTable(inspeccionesCache);
}

function goToDetalle(id: number): void {
  window.location.href = `inspeccion_detalle.html?id=${encodeURIComponent(id)}`;
}

function goToEditar(id: number): void {
  window.location.href = `inspeccion_editar.html?id=${encodeURIComponent(id)}`;
}

async function deleteInspeccion(id: number): Promise<void> {
  const accepted = window.confirm('¿Seguro que quieres eliminar esta inspección? Esta acción borra el registro de la BD.');
  if (!accepted) return;

  setError(null);
  setSuccess(null);

  try {
    const response = await fetch(`${API_BASE_URL}/api/inspecciones/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });

    const data = await parseJsonSafely(response);

    if (!response.ok) {
      throw new Error(data?.message ?? 'No se pudo eliminar la inspección');
    }

    setSuccess(data?.message ?? 'Inspección eliminada correctamente');

    if (selectedInspeccionId === id) {
      selectedInspeccionId = null;

      if (photoPlaceholder) {
        photoPlaceholder.innerHTML = '<span>Selecciona una inspección para ver la imagen</span>';
      }

      if (quickActions) {
        quickActions.setAttribute('hidden', '');
      }

      clearList(detalleResumen);
      clearList(detalleOk);
      clearList(detalleGaps);
    }

    await loadInspecciones();
  } catch (error) {
    setError(error instanceof Error ? error.message : 'No se pudo eliminar la inspección');
  }
}

function createActionButton(text: string, className: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = text;
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    onClick();
  });
  return button;
}

function createActionGroup(ins: InspeccionItem): HTMLElement {
  const container = document.createElement('div');
  container.className = 'table-actions';

  container.appendChild(
    createActionButton('Detalle', 'btn-small ghost', () => goToDetalle(ins.id))
  );

  container.appendChild(
    createActionButton('Editar', 'btn-small ghost', () => goToEditar(ins.id))
  );

  container.appendChild(
    createActionButton('Eliminar', 'btn-small danger', () => {
      void deleteInspeccion(ins.id);
    })
  );

  return container;
}

function applyFiltersAndSort(lista: InspeccionItem[]): InspeccionItem[] {
  const planoQuery = filtroPlano?.value.trim().toLowerCase() ?? '';
  const estadoQuery = filtroEstado?.value.trim().toUpperCase() ?? '';
  const diaExacto = filtroDia?.value ?? '';
  const desde = filtroDesde?.value ?? '';
  const hasta = filtroHasta?.value ?? '';
  const order = ordenFecha?.value === 'asc' ? 'asc' : 'desc';

  return [...lista]
    .filter((ins) => {
      const searchableText = `${ins.estanteriaCodigo} ${ins.notas ?? ''}`.toLowerCase();
      const matchesPlano = !planoQuery || searchableText.includes(planoQuery);
      const matchesEstado = !estadoQuery || ins.estado.toUpperCase() === estadoQuery;

      const itemDateKey = getItemDateKey(ins);

      const matchesDia =
        !diaExacto || (itemDateKey !== null && itemDateKey === diaExacto);

      const matchesDesde =
        !desde || (itemDateKey !== null && itemDateKey >= desde);

      const matchesHasta =
        !hasta || (itemDateKey !== null && itemDateKey <= hasta);

      return matchesPlano && matchesEstado && matchesDia && matchesDesde && matchesHasta;
    })
    .sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();

      if (order === 'asc') {
        return aTime - bTime;
      }

      return bTime - aTime;
    });
}

function renderTable(lista: InspeccionItem[]): void {
  if (!tbody) return;

  tbody.innerHTML = '';

  const filtered = applyFiltersAndSort(lista);

  if (filtered.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 9;
    td.textContent = 'No hay inspecciones que coincidan con los filtros.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  filtered.forEach((ins) => {
    const tr = document.createElement('tr');
    tr.classList.add('inspection-row');
    tr.tabIndex = 0;

    if (selectedInspeccionId === ins.id) {
      tr.classList.add('row-selected');
    }

    tr.addEventListener('click', () => renderDetalle(ins));
    tr.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        renderDetalle(ins);
      }
    });

    const tdFecha = document.createElement('td');
    tdFecha.textContent = formatDate(ins.createdAt);

    const tdPlano = document.createElement('td');
    tdPlano.textContent = '—';

    const tdEstanteria = document.createElement('td');
    tdEstanteria.textContent = ins.estanteriaCodigo;

    const tdResponsables = document.createElement('td');
    tdResponsables.textContent = '—';

    const tdLayout = document.createElement('td');
    tdLayout.textContent = '—';

    const tdOk = document.createElement('td');
    tdOk.textContent = '—';

    const tdGaps = document.createElement('td');
    tdGaps.textContent = '—';

    const tdEstado = document.createElement('td');
    tdEstado.innerHTML = buildEstadoBadge(ins.estado);

    const tdAccion = document.createElement('td');
    tdAccion.appendChild(createActionGroup(ins));

    tr.append(
      tdFecha,
      tdPlano,
      tdEstanteria,
      tdResponsables,
      tdLayout,
      tdOk,
      tdGaps,
      tdEstado,
      tdAccion
    );

    tbody.appendChild(tr);
  });
}

async function parseJsonSafely(response: Response): Promise<any> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getSelectedIdFromQuery(): number | null {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('selectedId');
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

async function loadInspecciones(): Promise<void> {
  setError(null);
  setSuccess(null);
  setDetalleError(null);

  try {
    const response = await fetch(`${API_BASE_URL}/api/inspecciones`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await parseJsonSafely(response);

    if (!response.ok) {
      throw new Error(data?.message ?? 'No se pudo cargar el listado de inspecciones');
    }

    inspeccionesCache = Array.isArray(data) ? data : [];
    renderTable(inspeccionesCache);

    const filtered = applyFiltersAndSort(inspeccionesCache);
    const selectedFromQuery = getSelectedIdFromQuery();

    const preferredId =
      selectedInspeccionId ??
      selectedFromQuery ??
      filtered[0]?.id ??
      null;

    const preferred =
      preferredId != null
        ? filtered.find((ins) => ins.id === preferredId) ??
          inspeccionesCache.find((ins) => ins.id === preferredId) ??
          null
        : null;

    if (preferred) {
      renderDetalle(preferred);
    } else {
      if (photoPlaceholder) {
        photoPlaceholder.innerHTML = '<span>Sin inspecciones todavía</span>';
      }

      if (quickActions) {
        quickActions.setAttribute('hidden', '');
      }

      clearList(detalleResumen);
      clearList(detalleOk);
      clearList(detalleGaps);
    }

    setSuccess(`Inspecciones cargadas: ${inspeccionesCache.length}`);
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Error al cargar inspecciones');

    if (tbody) {
      tbody.innerHTML = '';
    }

    if (photoPlaceholder) {
      photoPlaceholder.innerHTML = '<span>No se pudo cargar la vista de estantería</span>';
    }

    if (quickActions) {
      quickActions.setAttribute('hidden', '');
    }

    clearList(detalleResumen);
    clearList(detalleOk);
    clearList(detalleGaps);

    setDetalleError('No se pudo cargar el detalle de inspecciones.');
    console.error('Error en loadInspecciones:', error);
  }
}

function bindFilters(): void {
  const rerender = () => {
    renderTable(inspeccionesCache);

    const filtered = applyFiltersAndSort(inspeccionesCache);

    if (selectedInspeccionId != null) {
      const selected = filtered.find((ins) => ins.id === selectedInspeccionId);
      if (selected) {
        renderDetalle(selected);
        return;
      }
    }

    if (filtered[0]) {
      renderDetalle(filtered[0]);
      return;
    }

    selectedInspeccionId = null;

    if (photoPlaceholder) {
      photoPlaceholder.innerHTML = '<span>No hay inspecciones que coincidan con los filtros</span>';
    }

    if (quickActions) {
      quickActions.setAttribute('hidden', '');
    }

    clearList(detalleResumen);
    clearList(detalleOk);
    clearList(detalleGaps);
  };

  filtroPlano?.addEventListener('input', rerender);
  filtroEstado?.addEventListener('change', rerender);
  filtroDia?.addEventListener('change', rerender);
  filtroDesde?.addEventListener('change', rerender);
  filtroHasta?.addEventListener('change', rerender);
  ordenFecha?.addEventListener('change', rerender);

  btnLimpiarFiltros?.addEventListener('click', () => {
    if (filtroPlano) filtroPlano.value = '';
    if (filtroEstado) filtroEstado.value = '';
    if (filtroDia) filtroDia.value = '';
    if (filtroDesde) filtroDesde.value = '';
    if (filtroHasta) filtroHasta.value = '';
    if (ordenFecha) ordenFecha.value = 'desc';
    rerender();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  bindFilters();
  void loadInspecciones();
});