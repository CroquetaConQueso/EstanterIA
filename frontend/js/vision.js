const form = document.querySelector('#vision-form');
const estanteriaSelect = document.querySelector('#vision-estanteria');
const modoSelect = document.querySelector('#vision-modo');
const imagePathInput = document.querySelector('#vision-image-path');
const imagePathField = document.querySelector('#vision-image-path-field');
const notasInput = document.querySelector('#vision-notas');

const errorEl = document.querySelector('#vision-error');
const successEl = document.querySelector('#vision-success');
const out = document.querySelector('#vision-out');

const previewBox = document.querySelector('#preview-box');
const previewShelf = document.querySelector('#preview-shelf');
const previewImage = document.querySelector('#preview-image');

const resultChip = document.querySelector('#result-chip');
const resultId = document.querySelector('#result-id');
const resultDate = document.querySelector('#result-date');

const sumLentejas = document.querySelector('#sum-lentejas');
const sumArroz = document.querySelector('#sum-arroz');
const sumComida = document.querySelector('#sum-comida');

const goInspecciones = document.querySelector('#go-inspecciones');
const goAlertas = document.querySelector('#go-alertas');
const goTareas = document.querySelector('#go-tareas');

const btnReset = document.querySelector('#btn-reset');

const visionStatusText = document.querySelector('#vision-status-text');
const visionStatusChip = document.querySelector('#vision-status-chip');

function show(obj) {
  if (!out) return;
  out.textContent = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
}

function setError(msg) {
  if (!errorEl) return;

  if (!msg) {
    errorEl.textContent = '';
    errorEl.setAttribute('hidden', '');
    return;
  }

  errorEl.textContent = msg;
  errorEl.removeAttribute('hidden');
}

function setSuccess(msg) {
  if (!successEl) return;

  if (!msg) {
    successEl.textContent = '';
    successEl.setAttribute('hidden', '');
    return;
  }

  successEl.textContent = msg;
  successEl.removeAttribute('hidden');
}

function setOperationalStatus(type, text) {
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

function setPreview(data) {
  if (previewShelf) previewShelf.textContent = data.estanteriaCodigo || '—';
  if (previewImage) previewImage.textContent = data.imagePath || '—';

  if (!previewBox) return;

  previewBox.innerHTML = '';

  if (!data.imagePath) {
    previewBox.innerHTML = `
      <div class="preview-placeholder">
        <p>Sin captura reciente</p>
        <small>No se ha asociado una imagen al resultado actual.</small>
      </div>
    `;
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'preview-placeholder';
  wrapper.innerHTML = `
    <p>Imagen asociada</p>
    <small>${data.imagePath}</small>
  `;
  previewBox.appendChild(wrapper);
}

function setSummary(summary = {}) {
  if (sumLentejas) sumLentejas.textContent = String(summary.lentejas ?? 0);
  if (sumArroz) sumArroz.textContent = String(summary.arroz ?? 0);
  if (sumComida) sumComida.textContent = String(summary.comida_gato ?? 0);
}

function setResultMeta(result) {
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

function toggleNextLinks(enabled, critical = false) {
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

function updateImagePathState() {
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

function validateClient(estanteriaCodigo, modo, imagePath) {
  const errors = {};

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

function buildPayload() {
  return {
    estanteriaCodigo: estanteriaSelect?.value ?? '',
    modo: modoSelect?.value ?? 'capture-and-predict',
    imagePath: imagePathInput?.value.trim() || null,
    notas: notasInput?.value.trim() || null
  };
}

function createMockResult(payload) {
  const isCritical = payload.estanteriaCodigo === 'EST-002';

  return {
    message: 'VISION_INSPECCION_OK',
    id: Math.floor(Math.random() * 9000) + 1000,
    estanteriaCodigo: payload.estanteriaCodigo,
    imagePath:
      payload.imagePath ||
      `data/raw/capture_${String(Math.floor(Math.random() * 90) + 10).padStart(6, '0')}.png`,
    summary: {
      lentejas: isCritical ? 0 : 2,
      arroz: isCritical ? 1 : 2,
      comida_gato: isCritical ? 0 : 1
    },
    createdAt: new Date().toISOString(),
    critical: isCritical
  };
}

/*
 * Punto de integración real con Spring Boot.
 * Cuando quieras dejar el mock, esta función debería hacer algo como:
 *
 * return fetch(`/api/vision/inspeccionar/${payload.estanteriaCodigo}`, {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(payload)
 * }).then(...)
 */
async function runVision(payload) {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return createMockResult(payload);
}

function resetView() {
  setError(null);
  setSuccess(null);
  show('Sin actividad todavía.');
  setPreview({ estanteriaCodigo: '', imagePath: '' });
  setSummary({ lentejas: 0, arroz: 0, comida_gato: 0 });
  setResultMeta({ id: null, createdAt: null, critical: false });
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
  form.addEventListener('submit', async (e) => {
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

    const submitBtn = form.querySelector('button[type="submit"]');

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
      setError('No se pudo completar la inspección visual');
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