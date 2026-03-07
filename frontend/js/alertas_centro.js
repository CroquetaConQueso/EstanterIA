document.addEventListener('DOMContentLoaded', () => {
  const alertas = [
    {
      id: 101,
      hora: '08:12',
      gravedad: 'CRITICA',
      estanteria: 'A-12',
      producto: 'Lentejas 1kg',
      zona: 'Zona seca',
      detectado: 0,
      esperado: 3,
      responsable: 'Marta López',
      estado: 'PENDIENTE',
      plano: 'Almacén Central',
      observacion: 'Sin unidades visibles en la balda inferior.'
    },
    {
      id: 102,
      hora: '08:19',
      gravedad: 'ALTA',
      estanteria: 'B-05',
      producto: 'Arroz redondo',
      zona: 'Pasillo 2',
      detectado: 1,
      esperado: 4,
      responsable: 'Carlos Ruiz',
      estado: 'ASIGNADA',
      plano: 'Supermercado Norte',
      observacion: 'Presencia por debajo del mínimo visible esperado.'
    },
    {
      id: 103,
      hora: '08:33',
      gravedad: 'CRITICA',
      estanteria: 'TB-01',
      producto: 'Comida de gato',
      zona: 'Mascotas',
      detectado: 0,
      esperado: 2,
      responsable: 'Propietaria',
      estado: 'PENDIENTE',
      plano: 'Tienda de Barrio',
      observacion: 'Hueco completo detectado; revisar reposición.'
    },
    {
      id: 104,
      hora: '09:05',
      gravedad: 'MEDIA',
      estanteria: 'P-02',
      producto: 'Pasta corta',
      zona: 'Pasillo 3',
      detectado: 2,
      esperado: 3,
      responsable: 'Equipo A',
      estado: 'DESCARTADA',
      plano: 'Supermercado Norte',
      observacion: 'La detección no requiere acción inmediata.'
    }
  ];

  const tbody = document.getElementById('tbody-alertas');
  const filtroGravedad = document.getElementById('filtro-gravedad');
  const filtroEstado = document.getElementById('filtro-estado');
  const filtroTexto = document.getElementById('filtro-texto');
  const btnLimpiar = document.getElementById('btn-limpiar');

  const detalle = document.getElementById('detalle-alerta');
  const preview = document.getElementById('alerta-preview');
  const btnAsignar = document.getElementById('btn-asignar');
  const btnDescartar = document.getElementById('btn-descartar');
  const btnPlano = document.getElementById('btn-plano');

  const metricCritical = document.getElementById('metric-critical');
  const metricPending = document.getElementById('metric-pending');
  const metricAssigned = document.getElementById('metric-assigned');

  let selectedId = null;

  function updateMetrics() {
    metricCritical.textContent = alertas.filter(a => a.gravedad === 'CRITICA').length;
    metricPending.textContent = alertas.filter(a => a.estado === 'PENDIENTE').length;
    metricAssigned.textContent = alertas.filter(a => a.estado === 'ASIGNADA').length;
  }

  function getFiltered() {
    const gravedad = filtroGravedad?.value || '';
    const estado = filtroEstado?.value || '';
    const texto = (filtroTexto?.value || '').trim().toLowerCase();

    return alertas.filter((a) => {
      const okGravedad = !gravedad || a.gravedad === gravedad;
      const okEstado = !estado || a.estado === estado;
      const blob = `${a.estanteria} ${a.producto} ${a.zona} ${a.responsable} ${a.plano}`.toLowerCase();
      const okTexto = !texto || blob.includes(texto);
      return okGravedad && okEstado && okTexto;
    });
  }

  function renderDetail(alerta) {
    detalle.innerHTML = '';
    preview.innerHTML = `<span>${alerta.producto}<br>${alerta.estanteria} · ${alerta.plano}</span>`;

    const items = [
      ['Gravedad', alerta.gravedad],
      ['Estado', alerta.estado],
      ['Estantería', alerta.estanteria],
      ['Producto', alerta.producto],
      ['Zona', alerta.zona],
      ['Cantidad detectada', String(alerta.detectado)],
      ['Cantidad esperada', String(alerta.esperado)],
      ['Responsable', alerta.responsable],
      ['Observación', alerta.observacion]
    ];

    items.forEach(([label, value]) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${label}:</strong> ${value}`;
      detalle.appendChild(li);
    });

    btnAsignar.disabled = false;
    btnDescartar.disabled = false;
    btnPlano.disabled = false;
  }

  function selectAlert(id) {
    selectedId = id;
    const alerta = alertas.find(a => a.id === id);
    if (alerta) renderDetail(alerta);
    renderTable();
  }

  function renderTable() {
    if (!tbody) return;
    const rows = getFiltered();
    tbody.innerHTML = '';

    rows.forEach((a) => {
      const tr = document.createElement('tr');
      if (a.id === selectedId) tr.style.background = '#eef6ff';

      tr.innerHTML = `
        <td>${a.hora}</td>
        <td><span class="badge ${a.gravedad.toLowerCase()}">${a.gravedad}</span></td>
        <td>${a.estanteria}</td>
        <td>${a.producto}</td>
        <td>${a.zona}</td>
        <td>${a.detectado} / ${a.esperado}</td>
        <td>${a.responsable}</td>
        <td><span class="status-chip ${a.estado.toLowerCase()}">${a.estado}</span></td>
        <td>
          <div class="inline-actions">
            <button class="btn small ghost" data-action="detalle" data-id="${a.id}">Ver</button>
            <button class="btn small primary" data-action="asignar" data-id="${a.id}">Asignar</button>
          </div>
        </td>
      `;

      tbody.appendChild(tr);
    });
  }

  tbody?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.action;
    const alerta = alertas.find(a => a.id === id);
    if (!alerta) return;

    if (action === 'detalle') {
      selectAlert(id);
      return;
    }

    if (action === 'asignar') {
      alerta.estado = 'ASIGNADA';
      selectAlert(id);
      updateMetrics();
      renderTable();
    }
  });

  btnAsignar?.addEventListener('click', () => {
    const alerta = alertas.find(a => a.id === selectedId);
    if (!alerta) return;
    alerta.estado = 'ASIGNADA';
    updateMetrics();
    renderDetail(alerta);
    renderTable();
  });

  btnDescartar?.addEventListener('click', () => {
    const alerta = alertas.find(a => a.id === selectedId);
    if (!alerta) return;
    alerta.estado = 'DESCARTADA';
    updateMetrics();
    renderDetail(alerta);
    renderTable();
  });

  btnPlano?.addEventListener('click', () => {
    const alerta = alertas.find(a => a.id === selectedId);
    if (!alerta) return;
    alert(`Ir al plano de ${alerta.estanteria} (${alerta.plano})`);
  });

  filtroGravedad?.addEventListener('change', renderTable);
  filtroEstado?.addEventListener('change', renderTable);
  filtroTexto?.addEventListener('input', renderTable);
  btnLimpiar?.addEventListener('click', () => {
    filtroGravedad.value = '';
    filtroEstado.value = '';
    filtroTexto.value = '';
    renderTable();
  });

  updateMetrics();
  renderTable();
  if (alertas.length > 0) selectAlert(alertas[0].id);
});
