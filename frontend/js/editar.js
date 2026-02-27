// js/editar.js
document.addEventListener('DOMContentLoaded', () => {
  // Mismo mock que en planos.js para poder obtener el plano por id
  const planosMock = [
    {
      id: 'almacen-central',
      nombre: 'Almacén Central',
      tipo: 'almacen',
      estanterias: 12,
      subzonas: 'Recepción, Seco, Frío (3 responsables)',
      responsables: 'Marta López; Juan Pérez; Turno noche',
      estadoIA: 'ok'
    },
    {
      id: 'super-norte',
      nombre: 'Supermercado Norte',
      tipo: 'tienda',
      estanterias: 8,
      subzonas: 'Pasillos 1–4 (2 responsables)',
      responsables: 'Carlos Ruiz; Equipo reponedores A',
      estadoIA: 'pending'
    },
    {
      id: 'tienda-barrio',
      nombre: 'Tienda de Barrio',
      tipo: 'mixto',
      estanterias: 4,
      subzonas: 'Mostrador, refrigerados',
      responsables: 'Propietaria; Auxiliar',
      estadoIA: 'off'
    }
  ];

  const params = new URLSearchParams(window.location.search);
  const planoId = params.get('id') || 'almacen-central';
  const plano = planosMock.find((p) => p.id === planoId) || planosMock[0];

  const titulo = document.getElementById('titulo-plano');
  const desc = document.getElementById('descripcion-plano');
  const inputNombre = document.getElementById('plano-nombre');
  const selectTipo = document.getElementById('plano-tipo');
  const textareaSub = document.getElementById('plano-subzonas');
  const inputResp = document.getElementById('plano-responsables');
  const selectEstado = document.getElementById('plano-estado');
  const form = document.getElementById('form-plano');
  const previewGrid = document.getElementById('preview-grid');

  if (titulo && desc) {
    titulo.textContent = `Editar plano: ${plano.nombre}`;
    desc.textContent =
      `Plano de tipo ${plano.tipo} con ${plano.estanterias} estanterías. ` +
      `Aquí puedes ajustar subzonas, responsables y el estado de la IA.`;
  }

  if (inputNombre) inputNombre.value = plano.nombre;
  if (selectTipo) selectTipo.value = plano.tipo;
  if (textareaSub) textareaSub.value = plano.subzonas;
  if (inputResp) inputResp.value = plano.responsables || '';
  if (selectEstado) selectEstado.value = plano.estadoIA;

  // Form submit (mock)
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      console.log('Guardar cambios (mock):', {
        id: plano.id,
        nombre: inputNombre?.value,
        tipo: selectTipo?.value,
        subzonas: textareaSub?.value,
        responsables: inputResp?.value,
        estadoIA: selectEstado?.value
      });
      alert('Cambios guardados (boceto). Más adelante se enviarán al backend.');
    });
  }

  // Vista esquemática: generamos una cuadrícula simple con algunas celdas marcadas
  if (previewGrid) {
    previewGrid.innerHTML = '';

    const total = plano.estanterias;
    const maxCeldas = Math.max(total, 8); // siempre al menos 8 celdas para que se vea algo
    for (let i = 1; i <= maxCeldas; i++) {
      const cell = document.createElement('div');
      cell.className = 'preview-cell';

      if (i <= total) {
        cell.classList.add('preview-cell-main');
        const title = document.createElement('div');
        title.className = 'preview-cell-title';
        title.textContent = `Est. ${i.toString().padStart(2, '0')}`;

        const meta = document.createElement('div');
        meta.className = 'preview-cell-meta';
        meta.textContent =
          i === 1
            ? 'Zona recepción'
            : i === 2
            ? 'Zona seco'
            : i === 3
            ? 'Zona frío'
            : 'Zona general';

        cell.append(title, meta);
      } else {
        const meta = document.createElement('div');
        meta.className = 'preview-cell-meta';
        meta.textContent = 'Espacio libre';
        cell.appendChild(meta);
      }

      previewGrid.appendChild(cell);
    }
  }
});
