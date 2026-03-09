type EstadoInspeccion = 'CREADA' | 'ACTUALIZADA' | 'LISTA' | string;

type InspeccionDetail = {
  id: number;
  estanteriaCodigo: string;
  notas: string | null;
  imagenPath?: string | null;
  imagePath?: string | null;
  imageUrl?: string | null;
  estado: EstadoInspeccion;
  createdAt: string;
  summary?: Record<string, number>;
  productosOk?: string[];
  huecosDetectados?: string[];
};

type MessageResponse = {
  message?: string;
};

const API_BASE_URL =
  (document.body?.getAttribute('data-api-base-url')?.trim() || window.location.origin).replace(/\/$/, '');

const errorEl = document.getElementById('detalle-page-error') as HTMLElement | null;
const successEl = document.getElementById('detalle-page-success') as HTMLElement | null;
const photoPlaceholder = document.getElementById('detalle-photo-placeholder') as HTMLElement | null;

const resumenEl = document.getElementById('detalle-resumen-completo') as HTMLUListElement | null;
const summaryEl = document.getElementById('detalle-summary-completo') as HTMLUListElement | null;
const okEl = document.getElementById('detalle-ok-completo') as HTMLUListElement | null;
const gapsEl = document.getElementById('detalle-gaps-completo') as HTMLUListElement | null;

const btnEditar = document.getElementById('btn-editar-inspeccion') as HTMLAnchorElement | null;
const btnAbrirImagen = document.getElementById('btn-abrir-imagen-detalle') as HTMLAnchorElement | null;
const btnEliminar = document.getElementById('btn-eliminar-inspeccion') as HTMLButtonElement | null;

let currentInspeccion: InspeccionDetail | null = null;

function setError(msg: string | null): void {
  if (!errorEl) return;
  if (!msg) {
    errorEl.textContent = '';
    errorEl.setAttribute('hidden', '');
    return;
  }
  errorEl.textContent = msg;
  errorEl.removeAttribute('hidden');
}

function setSuccess(msg: string | null): void {
  if (!successEl) return;
  if (!msg) {
    successEl.textContent = '';
    successEl.setAttribute('hidden', '');
    return;
  }
  successEl.textContent = msg;
  successEl.removeAttribute('hidden');
}

function clearList(el: HTMLUListElement | null): void {
  if (el) el.innerHTML = '';
}

function appendListItem(el: HTMLUListElement | null, text: string): void {
  if (!el) return;
  const li = document.createElement('li');
  li.textContent = text;
  el.appendChild(li);
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

function parseIdFromUrl(): number | null {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('id');
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getImagenPath(ins: InspeccionDetail): string | null {
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

function buildImageUrl(ins: InspeccionDetail): string | null {
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

function renderImage(ins: InspeccionDetail): void {
  if (!photoPlaceholder) return;

  const imageUrl = buildImageUrl(ins);
  if (!imageUrl) {
    photoPlaceholder.innerHTML = '<span>Sin imagen disponible</span>';
    return;
  }

  photoPlaceholder.innerHTML = '';

  const img = document.createElement('img');
  img.className = 'inspection-image';
  img.src = imageUrl;
  img.alt = `Imagen de la inspección ${ins.id}`;

  img.onerror = () => {
    photoPlaceholder.innerHTML = '<span>No se pudo cargar la imagen de la inspección</span>';
  };

  photoPlaceholder.appendChild(img);

  if (btnAbrirImagen) {
    btnAbrirImagen.href = imageUrl;
  }
}

function renderDetail(ins: InspeccionDetail): void {
  currentInspeccion = ins;
  document.title = `Inspección #${ins.id} · EstanterIA`;

  renderImage(ins);

  clearList(resumenEl);
  clearList(summaryEl);
  clearList(okEl);
  clearList(gapsEl);

  appendListItem(resumenEl, `ID: ${ins.id}`);
  appendListItem(resumenEl, `Estantería: ${ins.estanteriaCodigo}`);
  appendListItem(resumenEl, `Estado: ${ins.estado}`);
  appendListItem(resumenEl, `Fecha: ${formatDate(ins.createdAt)}`);
  appendListItem(resumenEl, `Notas: ${ins.notas?.trim() || '—'}`);
  appendListItem(resumenEl, `Archivo: ${getImagenPath(ins) || '—'}`);

  const summary = ins.summary ?? {};
  const summaryEntries = Object.entries(summary);

  if (summaryEntries.length === 0) {
    appendListItem(summaryEl, 'Sin resumen disponible');
  } else {
    summaryEntries.forEach(([key, value]) => {
      appendListItem(summaryEl, `${key}: ${value}`);
    });
  }

  const productosOk = ins.productosOk ?? [];
  if (productosOk.length === 0) {
    appendListItem(okEl, 'Sin productos OK registrados');
  } else {
    productosOk.forEach((item) => appendListItem(okEl, item));
  }

  const huecos = ins.huecosDetectados ?? [];
  if (huecos.length === 0) {
    appendListItem(gapsEl, 'Sin huecos detectados');
  } else {
    huecos.forEach((item) => appendListItem(gapsEl, item));
  }

  if (btnEditar) {
    btnEditar.href = `inspeccion_editar.html?id=${encodeURIComponent(ins.id)}`;
  }
}

async function parseJsonSafely(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function loadDetalle(): Promise<void> {
  setError(null);
  setSuccess(null);

  const id = parseIdFromUrl();
  if (!id) {
    setError('El id de la inspección no es válido.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/inspecciones/${encodeURIComponent(id)}`, {
      method: 'GET'
    });

    const data = await parseJsonSafely(response);

    if (!response.ok) {
      throw new Error(data?.message ?? 'No se pudo cargar el detalle de la inspección');
    }

    renderDetail(data as InspeccionDetail);
  } catch (error) {
    setError(error instanceof Error ? error.message : 'No se pudo cargar el detalle de la inspección');
  }
}

async function deleteCurrentInspeccion(): Promise<void> {
  if (!currentInspeccion) return;

  const accepted = window.confirm('¿Seguro que quieres eliminar esta inspección?');
  if (!accepted) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/inspecciones/${encodeURIComponent(currentInspeccion.id)}`, {
      method: 'DELETE'
    });

    const data = (await parseJsonSafely(response)) as MessageResponse | null;

    if (!response.ok) {
      throw new Error(data?.message ?? 'No se pudo eliminar la inspección');
    }

    window.location.href = 'inspecciones.html';
  } catch (error) {
    setError(error instanceof Error ? error.message : 'No se pudo eliminar la inspección');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  btnEliminar?.addEventListener('click', () => {
    void deleteCurrentInspeccion();
  });

  void loadDetalle();
});