type VisionModo = 'capture-and-predict' | 'predict-existing';

type VisionRequest = {
  estanteriaCodigo: string;
  modo: VisionModo;
  imagePath: string | null;
  notas: string | null;
};

type VisionResponse = {
  message: string;
  id: number;
  estanteriaCodigo: string;
  imagePath: string;
  imageUrl: string | null;
  summary: {
    lentejas?: number;
    arroz?: number;
    comida_gato?: number;
    [key: string]: number | undefined;
  };
  createdAt: string;
  critical: boolean;
};

const form = document.querySelector<HTMLFormElement>('#vision-form');
const estanteriaSelect = document.querySelector<HTMLSelectElement>('#vision-estanteria');
const modoSelect = document.querySelector<HTMLSelectElement>('#vision-modo');
const imagePathInput = document.querySelector<HTMLInputElement>('#vision-image-path');
const imagePathField = document.querySelector<HTMLElement>('#vision-image-path-field');
const notasInput = document.querySelector<HTMLTextAreaElement>('#vision-notas');

const errorEl = document.querySelector<HTMLElement>('#vision-error');
const successEl = document.querySelector<HTMLElement>('#vision-success');
const out = document.querySelector<HTMLPreElement>('#vision-out');

const previewBox = document.querySelector<HTMLElement>('#preview-box');
const previewShelf = document.querySelector<HTMLElement>('#preview-shelf');
const previewImage = document.querySelector<HTMLElement>('#preview-image');

const resultChip = document.querySelector<HTMLElement>('#result-chip');
const resultId = document.querySelector<HTMLElement>('#result-id');
const resultDate = document.querySelector<HTMLElement>('#result-date');

const sumLentejas = document.querySelector<HTMLElement>('#sum-lentejas');
const sumArroz = document.querySelector<HTMLElement>('#sum-arroz');
const sumComida = document.querySelector<HTMLElement>('#sum-comida');

const goInspecciones = document.querySelector<HTMLElement>('#go-inspecciones');
const goAlertas = document.querySelector<HTMLElement>('#go-alertas');
const goTareas = document.querySelector<HTMLElement>('#go-tareas');

const btnReset = document.querySelector<HTMLButtonElement>('#btn-reset');

const visionStatusText = document.querySelector<HTMLElement>('#vision-status-text');
const visionStatusChip = document.querySelector<HTMLElement>('#vision-status-chip');

function show(obj: unknown): void {
  if (!out) return;
  out.textContent = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
}

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

function setOperationalStatus(
  type: 'idle' | 'running' | 'success' | 'critical' | 'error',
  text: string
): void {
  if (visionStatusText) {
    visionStatusText.textContent = text;
  }

  if (!visionStatusChip) return;

  visionStatusChip.className = 'status-chip';

  switch (type) {
    case 'running':
      visionStatusChip.classList.add('media');
      visionStatusChip.textContent = 'EJECUTANDO';
      break;
    case 'success':
      visionStatusChip.classList.add('ok');
      visionStatusChip.textContent = 'COMPLETADA';
      break;
    case 'critical':
      visionStatusChip.classList.add('critica');
      visionStatusChip.textContent = 'CRÍTICA';
      break;
    case 'error':
      visionStatusChip.classList.add('descartada');
      visionStatusChip.textContent = 'ERROR';
      break;
    default:
      visionStatusChip.classList.add('pendiente');
      visionStatusChip.textContent = 'EN ESPERA';
      break;
  }
}

function setPreview(data: { estanteriaCodigo?: string; imagePath?: string; imageUrl?: string | null }): void {
  if (previewShelf) previewShelf.textContent = data.estanteriaCodigo || '—';
  if (previewImage) previewImage.textContent = data.imagePath || '—';

  if (!previewBox) return;

  previewBox.innerHTML = '';
  previewBox.classList.remove('has-image');

  if (!data.imageUrl) {
    previewBox.innerHTML = `
      <div class="preview-placeholder">
        <p>Sin captura reciente</p>
        <small>No se ha asociado una imagen al resultado actual.</small>
      </div>
    `;
    return;
  }

  const img = document.createElement('img');
  img.className = 'preview-image';
  img.src = data.imageUrl;
  img.alt = 'Imagen capturada de la inspección';
  previewBox.classList.add('has-image');
  previewBox.appendChild(img);
}

function setSummary(summary: VisionResponse['summary'] = {}): void {
  if (sumLentejas) sumLentejas.textContent = String(summary.lentejas ?? 0);
  if (sumArroz) sumArroz.textContent = String(summary.arroz ?? 0);
  if (sumComida) sumComida.textContent = String(summary.comida_gato ?? 0);
}

function setResultMeta(result: Partial<VisionResponse>): void {
  if (resultId) resultId.textContent = result.id ? `#${result.id}` : '—';

  if (resultDate) {
    resultDate.textContent = result.createdAt
      ? new Intl.DateTimeFormat('es-ES', {
          dateStyle: 'short',
          timeStyle: 'short'
        }).format(new Date(result.createdAt))
      : '—';
  }

  if (!resultChip) return;

  if (result.critical) {
    resultChip.textContent = 'RESULTADO CRÍTICO';
    resultChip.className = 'status-chip critica';
  } else if (result.id) {
    resultChip.textContent = 'RESULTADO OK';
    resultChip.className = 'status-chip ok';
  } else {
    resultChip.textContent = 'SIN RESULTADO';
    resultChip.className = 'status-chip descartada';
  }
}

function toggleNextLinks(enabled: boolean, critical = false): void {
  if (goInspecciones) {
    goInspecciones.classList.toggle('disabled', !enabled);
  }

  if (goAlertas) {
    goAlertas.classList.toggle('disabled', !(enabled && critical));
  }

  if (goTareas) {
    goTareas.classList.toggle('disabled', !(enabled && critical));
  }
}

function updateImagePathState(): void {
  if (!modoSelect || !imagePathInput) return;

  const isExisting = modoSelect.value === 'predict-existing';

  imagePathInput.disabled = !isExisting;

  if (imagePathField) {
    imagePathField.classList.toggle('input-disabled', !isExisting);
  }

  if (!isExisting) {
    imagePathInput.value = '';
  }
}

function validateClient(
  estanteriaCodigo: string,
  modo: string,
  imagePath: string
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!estanteriaCodigo.trim()) {
    errors.estanteriaCodigo = 'Debes seleccionar una estantería';
  }

  if (!modo) {
    errors.modo = 'Debes seleccionar un modo de ejecución';
  }

  if (modo === 'predict-existing' && !imagePath.trim()) {
    errors.imagePath = 'Debes indicar la ruta de la imagen';
  }

  return errors;
}

function buildPayload(): VisionRequest {
  return {
    estanteriaCodigo: estanteriaSelect?.value ?? '',
    modo: (modoSelect?.value as VisionModo) ?? 'capture-and-predict',
    imagePath: imagePathInput?.value.trim() || null,
    notas: notasInput?.value.trim() || null
  };
}

async function runVision(payload: VisionRequest): Promise<VisionResponse> {
  const response = await fetch(`/api/vision/inspeccionar/${encodeURIComponent(payload.estanteriaCodigo)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message ?? 'No se pudo completar la inspección visual');
  }

  return data as VisionResponse;
}

function resetView(): void {
  setError(null);
  setSuccess(null);
  show('Sin actividad todavía.');
  setPreview({ estanteriaCodigo: '', imagePath: '', imageUrl: null });
  setSummary({});
  setResultMeta({});
  toggleNextLinks(false, false);
  setOperationalStatus('idle', 'El módulo está listo para ejecutar una inspección.');
  updateImagePathState();
}

if (modoSelect) {
  modoSelect.addEventListener('change', updateImagePathState);
}

if (btnReset) {
  btnReset.addEventListener('click', () => {
    form?.reset();
    resetView();
  });
}

if (form) {
  form.addEventListener('submit', async (e: SubmitEvent) => {
    e.preventDefault();

    setError(null);
    setSuccess(null);

    const payload = buildPayload();
    const errors = validateClient(
      payload.estanteriaCodigo,
      payload.modo,
      payload.imagePath || ''
    );

    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors).join(' · '));
      setOperationalStatus('error', 'La inspección no puede ejecutarse porque faltan datos.');
      show({ error: 'CLIENT_VALIDATION_ERROR', fieldErrors: errors });
      return;
    }

    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('disabled');
    }

    try {
      setOperationalStatus('running', 'La inspección visual está en ejecución.');
      show({ request: payload });

      const result = await runVision(payload);

      setSuccess(`Inspección visual completada para ${result.estanteriaCodigo}`);
      setPreview(result);
      setSummary(result.summary);
      setResultMeta(result);
      toggleNextLinks(true, result.critical);
      show(result);

      if (result.critical) {
        setOperationalStatus(
          'critical',
          'La inspección ha generado un resultado crítico. Se recomienda revisar alertas o tareas.'
        );
      } else {
        setOperationalStatus(
          'success',
          'La inspección se completó correctamente y ya puede revisarse en el historial.'
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la inspección visual');
      setOperationalStatus(
        'error',
        'Se produjo un error durante la ejecución del flujo de visión.'
      );
      show({
        error: 'VISION_EXECUTION_ERROR',
        detail: err instanceof Error ? err.message : 'Error desconocido'
      });
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('disabled');
      }
    }
  });
}

resetView();