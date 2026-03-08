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
  (document.body?.getAttribute('data-api-base-url')?.trim() || 'http://localhost:8080').replace(/\/$/, '');

const tbody = document.getElementById('tbody-inspecciones') as HTMLTableSectionElement | null;
const filtroPlano = document.getElementById('filtro-plano') as HTMLInputElement | null;
const filtroEstado = document.getElementById('filtro-estado') as HTMLSelectElement | null;
const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros') as HTMLButtonElement | null;

const inspeccionesError = document.getElementById('inspecciones-error') as HTMLElement | null;
const inspeccionesSuccess = document.getElementById('inspecciones-success') as HTMLElement | null;

const photoPlaceholder = document.getElementById('photo-placeholder') as HTMLElement | null;
const detalleResumen = document.getElementById('detalle-resumen') as HTMLUListElement | null;
const detalleOk = document.getElementById('detalle-ok') as HTMLUListElement | null;
const detalleGaps = document.getElementById('detalle-gaps') as HTMLUListElement | null;
const detalleError = document.getElementById('detalle-error') as HTMLElement | null;

let inspeccionesCache: InspeccionItem[] = [];

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

function getImagenPath(ins: InspeccionItem): string | null {
  const value = ins.imagenPath ?? ins.imagePath ?? null;
  return value?.trim() ? value.trim() : null;
}

function buildImageUrl(ins: InspeccionItem): string | null {
  const rawImageUrl = ins.imageUrl?.trim();

  if (rawImageUrl) {
    if (/^https?:\/\//i.test(rawImageUrl)) {
      return rawImageUrl;
    }

    return `${API_BASE_URL}${rawImageUrl.startsWith('/') ? '' : '/'}${rawImageUrl}`;
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
  setDetalleError(null);
  renderInspectionImage(ins);

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
}

function createActionButton(ins: InspeccionItem): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn-small';
  button.textContent = 'Ver detalle';
  button.addEventListener('click', () => renderDetalle(ins));
  return button;
}

function renderTable(lista: InspeccionItem[]): void {
  if (!tbody) return;

  tbody.innerHTML = '';

  const planoQuery = filtroPlano?.value.trim().toLowerCase() ?? '';
  const estadoQuery = filtroEstado?.value.trim().toUpperCase() ?? '';

  const filtered = lista.filter((ins) => {
    const matchesPlano =
      !planoQuery || ins.estanteriaCodigo.toLowerCase().includes(planoQuery);

    const matchesEstado =
      !estadoQuery || ins.estado.toUpperCase() === estadoQuery;

    return matchesPlano && matchesEstado;
  });

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
    tdAccion.appendChild(createActionButton(ins));

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

    if (inspeccionesCache.length > 0) {
      renderDetalle(inspeccionesCache[0]);
    } else {
      if (photoPlaceholder) {
        photoPlaceholder.innerHTML = '<span>Sin inspecciones todavía</span>';
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

    clearList(detalleResumen);
    clearList(detalleOk);
    clearList(detalleGaps);

    setDetalleError('No se pudo cargar el detalle de inspecciones.');
  }
}

function bindFilters(): void {
  filtroPlano?.addEventListener('input', () => renderTable(inspeccionesCache));
  filtroEstado?.addEventListener('change', () => renderTable(inspeccionesCache));

  btnLimpiarFiltros?.addEventListener('click', () => {
    if (filtroPlano) filtroPlano.value = '';
    if (filtroEstado) filtroEstado.value = '';
    renderTable(inspeccionesCache);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  bindFilters();
  loadInspecciones();
});