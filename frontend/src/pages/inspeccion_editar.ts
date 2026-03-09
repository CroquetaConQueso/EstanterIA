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
};

type InspeccionUpdateRequest = {
  notas: string | null;
  estado: EstadoInspeccion;
};

const API_BASE_URL =
  (document.body?.getAttribute('data-api-base-url')?.trim() || window.location.origin).replace(/\/$/, '');

const errorEl = document.getElementById('editar-error') as HTMLElement | null;
const successEl = document.getElementById('editar-success') as HTMLElement | null;

const form = document.getElementById('form-editar-inspeccion') as HTMLFormElement | null;
const inputId = document.getElementById('inspeccion-id') as HTMLInputElement | null;
const inputEstanteria = document.getElementById('inspeccion-estanteria') as HTMLInputElement | null;
const inputFecha = document.getElementById('inspeccion-fecha') as HTMLInputElement | null;
const inputArchivo = document.getElementById('inspeccion-archivo') as HTMLInputElement | null;
const selectEstado = document.getElementById('inspeccion-estado') as HTMLSelectElement | null;
const textareaNotas = document.getElementById('inspeccion-notas') as HTMLTextAreaElement | null;

const btnVolverDetalle = document.getElementById('btn-volver-detalle') as HTMLAnchorElement | null;
const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion') as HTMLButtonElement | null;
const photoPlaceholder = document.getElementById('editar-photo-placeholder') as HTMLElement | null;

let currentInspeccionId: number | null = null;

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

function parseIdFromUrl(): number | null {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('id');
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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
    photoPlaceholder.innerHTML = '<span>No se pudo cargar la imagen</span>';
  };

  photoPlaceholder.appendChild(img);
}

function fillForm(ins: InspeccionDetail): void {
  currentInspeccionId = ins.id;
  document.title = `Editar inspección #${ins.id} · EstanterIA`;

  if (inputId) inputId.value = String(ins.id);
  if (inputEstanteria) inputEstanteria.value = ins.estanteriaCodigo;
  if (inputFecha) inputFecha.value = formatDate(ins.createdAt);
  if (inputArchivo) inputArchivo.value = getImagenPath(ins) || '—';
  if (selectEstado) selectEstado.value = ins.estado;
  if (textareaNotas) textareaNotas.value = ins.notas ?? '';

  if (btnVolverDetalle) {
    btnVolverDetalle.href = `inspeccion_detalle.html?id=${encodeURIComponent(ins.id)}`;
  }

  renderImage(ins);
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

async function loadInspeccion(): Promise<void> {
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
      throw new Error(data?.message ?? 'No se pudo cargar la inspección');
    }

    fillForm(data as InspeccionDetail);
  } catch (error) {
    setError(error instanceof Error ? error.message : 'No se pudo cargar la inspección');
  }
}

async function submitForm(event: Event): Promise<void> {
  event.preventDefault();

  if (!currentInspeccionId || !selectEstado || !textareaNotas) {
    setError('La inspección no está cargada correctamente.');
    return;
  }

  setError(null);
  setSuccess(null);

  const payload: InspeccionUpdateRequest = {
    estado: selectEstado.value,
    notas: textareaNotas.value.trim() || null
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/inspecciones/${encodeURIComponent(currentInspeccionId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await parseJsonSafely(response);

    if (!response.ok) {
      throw new Error(data?.message ?? 'No se pudo actualizar la inspección');
    }

    setSuccess('Inspección actualizada correctamente.');

    window.setTimeout(() => {
      window.location.href = `inspeccion_detalle.html?id=${encodeURIComponent(currentInspeccionId!)}`;
    }, 500);
  } catch (error) {
    setError(error instanceof Error ? error.message : 'No se pudo actualizar la inspección');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  form?.addEventListener('submit', (event) => {
    void submitForm(event);
  });

  btnCancelarEdicion?.addEventListener('click', () => {
    const id = parseIdFromUrl();
    if (!id) {
      window.location.href = 'inspecciones.html';
      return;
    }

    window.location.href = `inspeccion_detalle.html?id=${encodeURIComponent(id)}`;
  });

  void loadInspeccion();
});