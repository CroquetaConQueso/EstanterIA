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
const resultModel = document.querySelector('#result-model');
const resultSlots = document.querySelector('#result-slots');

const sumEstado = document.querySelector('#sum-estado');
const sumOcupados = document.querySelector('#sum-ocupados');
const sumVacios = document.querySelector('#sum-vacios');
const sumAnomalias = document.querySelector('#sum-anomalias');

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
      visionStatusChip.textContent = 'REVISAR';
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

function getResumen(resultadoVisual) {
  return resultadoVisual?.resumen ?? null;
}

function getImagePath(result) {
  return result?.imageUrl || result?.imagePath || result?.resultadoVisual?.imagen?.ruta || '';
}

function getEstadoGeneral(result) {
  return getResumen(result?.resultadoVisual)?.estadoGeneralVisual || 'Sin analisis';
}

function isResultadoRevisable(result) {
  const resumen = getResumen(result?.resultadoVisual);
  return Boolean(resumen?.hayHuecosVacios || resumen?.hayAnomalias || result?.critical);
}

function formatFecha(value) {
  if (!value) return 'â€”';

  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return value;

  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(fecha);
}

async function parseErrorResponse(res) {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function getBackendErrorMessage(data, status) {
  if (data?.message) return data.message;
  if (status === 400) return 'La peticion de vision no es valida';
  if (status === 404) return 'No se encontro la estanteria solicitada';
  if (status >= 500) return 'Error interno al ejecutar la inspeccion visual';
  return `Error HTTP ${status}`;
}

function setPreview(result) {
  const imagePath = getImagePath(result);

  if (previewShelf) previewShelf.textContent = result?.estanteriaCodigo || 'â€”';
  if (previewImage) previewImage.textContent = imagePath || 'â€”';

  if (!previewBox) return;

  previewBox.innerHTML = '';
  previewBox.classList.toggle('has-image', Boolean(imagePath));

  if (!imagePath) {
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
  img.src = imagePath;
  img.alt = `Imagen de inspeccion ${result?.estanteriaCodigo ?? ''}`.trim();
  previewBox.appendChild(img);
}

function setSummary(resultadoVisual) {
  const resumen = getResumen(resultadoVisual ? { resultadoVisual } : null);

  if (sumEstado) sumEstado.textContent = resumen?.estadoGeneralVisual ?? 'â€”';
  if (sumOcupados) sumOcupados.textContent = String(resumen?.ocupados ?? 0);
  if (sumVacios) sumVacios.textContent = String(resumen?.vacios ?? 0);
  if (sumAnomalias) sumAnomalias.textContent = String(resumen?.anomalias ?? 0);
}

function setResultMeta(result) {
  const resultadoVisual = result?.resultadoVisual ?? null;
  const resumen = getResumen(resultadoVisual ? { resultadoVisual } : null);
  const slots = Array.isArray(resultadoVisual?.slots) ? resultadoVisual.slots : [];

  if (resultId) resultId.textContent = result?.id ? `#${result.id}` : 'â€”';
  if (resultDate) resultDate.textContent = formatFecha(result?.createdAt || resultadoVisual?.capturadaEn);
  if (resultModel) resultModel.textContent = resultadoVisual?.modeloVersion || 'â€”';
  if (resultSlots) {
    resultSlots.textContent = slots.length > 0
      ? slots.map((slot) => `${slot.slotId}: ${slot.estadoVisual} (${Math.round((slot.confianza ?? 0) * 100)}%)`).join(' | ')
      : 'Sin analisis visual';
  }

  if (!resultChip) return;

  if (!resultadoVisual) {
    resultChip.textContent = 'SIN ANALISIS VISUAL';
    resultChip.className = 'status-chip descartada';
  } else if (resumen?.hayHuecosVacios || resumen?.hayAnomalias) {
    resultChip.textContent = resumen.estadoGeneralVisual || 'REVISAR';
    resultChip.className = 'status-chip critica';
  } else {
    resultChip.textContent = resumen?.estadoGeneralVisual || 'RESULTADO OK';
    resultChip.className = 'status-chip ok';
  }
}

function toggleNextLinks(enabled, revisable = false, inspeccionId = null) {
  if (goInspecciones) {
    goInspecciones.classList.toggle('disabled', !enabled);
    goInspecciones.href = inspeccionId
      ? `inspeccion_detalle.html?id=${encodeURIComponent(String(inspeccionId))}`
      : 'inspecciones.html';
  }

  if (goAlertas) {
    goAlertas.classList.toggle('disabled', !(enabled && revisable));
  }

  if (goTareas) {
    goTareas.classList.toggle('disabled', !(enabled && revisable));
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
    errors.estanteriaCodigo = 'Debes seleccionar una estanteria';
  }

  if (!modo) {
    errors.modo = 'Debes seleccionar un modo de ejecucion';
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

async function runVision(payload) {
  const res = await fetch(`/api/vision/inspeccionar/${encodeURIComponent(payload.estanteriaCodigo)}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      modo: payload.modo,
      imagePath: payload.imagePath,
      notas: payload.notas
    })
  });

  if (!res.ok) {
    const errorData = await parseErrorResponse(res);
    throw new Error(getBackendErrorMessage(errorData, res.status));
  }

  return res.json();
}

function resetView() {
  setError(null);
  setSuccess(null);
  show('Sin actividad todavia.');
  setPreview({ estanteriaCodigo: '', imagePath: '' });
  setSummary(null);
  setResultMeta({ id: null, createdAt: null, resultadoVisual: null });
  toggleNextLinks(false, false, null);
  setOperationalStatus('idle', 'El modulo esta listo para ejecutar una inspeccion.');
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
      setError(Object.values(errors).join(' | '));
      setOperationalStatus('error', 'La inspeccion no puede ejecutarse porque faltan datos.');
      show({ error: 'CLIENT_VALIDATION_ERROR', fieldErrors: errors });
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('disabled');
    }

    try {
      setOperationalStatus('running', 'La inspeccion visual esta en ejecucion.');
      show({
        endpoint: `/api/vision/inspeccionar/${payload.estanteriaCodigo}`,
        body: {
          modo: payload.modo,
          imagePath: payload.imagePath,
          notas: payload.notas
        }
      });

      const result = await runVision(payload);
      const revisable = isResultadoRevisable(result);

      setSuccess(`Inspeccion visual completada para ${result.estanteriaCodigo}`);
      setPreview(result);
      setSummary(result.resultadoVisual);
      setResultMeta(result);
      toggleNextLinks(true, revisable, result.id);
      show(result);

      if (result.id) {
        sessionStorage.setItem('nuevaInspeccionId', String(result.id));
      }

      if (revisable) {
        setOperationalStatus(
          'critical',
          `Resultado ${getEstadoGeneral(result)}. Revisa los slots detectados.`
        );
      } else {
        setOperationalStatus(
          'success',
          'La inspeccion se completo correctamente y ya puede revisarse en el historial.'
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la inspeccion visual');
      setOperationalStatus(
        'error',
        'Se produjo un error durante la ejecucion del flujo de vision.'
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
