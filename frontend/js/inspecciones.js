// js/inspecciones.js
document.addEventListener('DOMContentLoaded', () => {
  const inspeccionesMock = [
    {
      id: 1,
      fecha: '2025-11-18 10:32',
      plano: 'Almacén Central',
      estanteria: 'S-01',
      layout: '2025-11-17',
      responsables: ['Marta López'],
      ok: ['arroz', 'lentejas'],
      gaps: ['garbanzos'],
      estado: 'gaps',
      zonas: [
        { zona: 'Z1', producto: 'arroz', presente: true, responsable: 'Marta López' },
        { zona: 'Z2', producto: 'lentejas', presente: true, responsable: 'Marta López' },
        { zona: 'Z3', producto: 'garbanzos', presente: false, responsable: 'Marta López' }
      ]
    },
    {
      id: 2,
      fecha: '2025-11-18 09:10',
      plano: 'Supermercado Norte',
      estanteria: 'P-02',
      layout: '2025-11-16',
      responsables: ['Carlos Ruiz', 'Equipo reponedores A'],
      ok: ['aceite', 'sal', 'azúcar'],
      gaps: [],
      estado: 'ok',
      zonas: [
        { zona: 'Z1', producto: 'aceite', presente: true, responsable: 'Carlos Ruiz' },
        { zona: 'Z2', producto: 'sal', presente: true, responsable: 'Equipo reponedores A' },
        { zona: 'Z3', producto: 'azúcar', presente: true, responsable: 'Equipo reponedores A' }
      ]
    },
    {
      id: 3,
      fecha: '2025-11-17 19:45',
      plano: 'Tienda de Barrio',
      estanteria: 'TB-01',
      layout: '2025-11-15',
      responsables: ['Propietaria'],
      ok: ['snacks', 'refrescos'],
      gaps: ['agua pequeña'],
      estado: 'gaps',
      zonas: [
        { zona: 'Z1', producto: 'snacks', presente: true, responsable: 'Propietaria' },
        { zona: 'Z2', producto: 'refrescos', presente: true, responsable: 'Propietaria' },
        { zona: 'Z3', producto: 'agua pequeña', presente: false, responsable: 'Propietaria' }
      ]
    },
    {
      id: 4,
      fecha: '2025-11-17 10:05',
      plano: 'Almacén Central',
      estanteria: 'S-03',
      layout: '2025-11-10',
      responsables: ['Turno noche'],
      ok: ['detergente', 'suavizante'],
      gaps: ['lejía'],
      estado: 'gaps',
      zonas: [
        { zona: 'Z1', producto: 'detergente', presente: true, responsable: 'Turno noche' },
        { zona: 'Z2', producto: 'suavizante', presente: true, responsable: 'Turno noche' },
        { zona: 'Z3', producto: 'lejía', presente: false, responsable: 'Turno noche' }
      ]
    },
    {
      id: 5,
      fecha: '2025-11-16 18:20',
      plano: 'Supermercado Norte',
      estanteria: 'P-05',
      layout: '2025-11-14',
      responsables: ['Equipo reponedores B', 'Jefe de sección'],
      ok: ['pasta', 'salsa tomate'],
      gaps: [],
      estado: 'ok',
      zonas: [
        { zona: 'Z1', producto: 'pasta', presente: true, responsable: 'Equipo reponedores B' },
        { zona: 'Z2', producto: 'salsa tomate', presente: true, responsable: 'Jefe de sección' }
      ]
    }
  ];

  const tbody = document.getElementById('tbody-inspecciones');
  const filtroPlano = document.getElementById('filtro-plano');
  const filtroEstado = document.getElementById('filtro-estado');
  const filtroUltimas = document.getElementById('filtro-ultimas');
  const detailTitle = document.getElementById('detail-title');
  const detailContent = document.getElementById('detail-content');
  const btnDescargar = document.getElementById('btn-descargar');
  const btnRegistro = document.getElementById('btn-registro');

  function renderTable() {
    if (!tbody) return;
    tbody.innerHTML = '';

    const planoQuery = (filtroPlano?.value || '').toLowerCase();
    const estadoQuery = filtroEstado?.value || '';
    const soloUltimas = filtroUltimas?.checked || false;

    const ahora = new Date('2025-11-18T12:00:00'); // referencia fija mock

    inspeccionesMock
      .filter((ins) => {
        const okPlano =
          !planoQuery || ins.plano.toLowerCase().includes(planoQuery);
        const okEstado =
          !estadoQuery ||
          (estadoQuery === 'ok' && ins.estado === 'ok') ||
          (estadoQuery === 'gaps' && ins.estado === 'gaps');

        let okFecha = true;
        if (soloUltimas) {
          const fechaIns = new Date(ins.fecha.replace(' ', 'T'));
          const diffMs = ahora - fechaIns;
          const diffHoras = diffMs / 1000 / 60 / 60;
          okFecha = diffHoras <= 24;
        }

        return okPlano && okEstado && okFecha;
      })
      .forEach((ins) => {
        const tr = document.createElement('tr');

        const tdFecha = document.createElement('td');
        tdFecha.textContent = ins.fecha;

        const tdPlano = document.createElement('td');
        tdPlano.textContent = ins.plano;

        const tdEst = document.createElement('td');
        tdEst.textContent = ins.estanteria;

        const tdResp = document.createElement('td');
        tdResp.textContent = ins.responsables.join(' / ');

        const tdLayout = document.createElement('td');
        tdLayout.textContent = ins.layout;

        const tdOk = document.createElement('td');
        tdOk.textContent = ins.ok.length ? ins.ok.join(', ') : '—';

        const tdGaps = document.createElement('td');
        tdGaps.textContent = ins.gaps.length ? ins.gaps.join(', ') : '—';

        const tdEstado = document.createElement('td');
        const spanEstado = document.createElement('span');
        spanEstado.className = ins.estado === 'ok' ? 'badge-ok' : 'badge-gap';
        spanEstado.textContent =
          ins.estado === 'ok' ? 'Sin huecos' : 'Con huecos';
        tdEstado.appendChild(spanEstado);

        const tdAccion = document.createElement('td');
        const btnDetalle = document.createElement('button');
        btnDetalle.className = 'btn-small';
        btnDetalle.textContent = 'Ver detalle';
        btnDetalle.addEventListener('click', () => mostrarDetalle(ins));
        tdAccion.appendChild(btnDetalle);

        tr.append(
          tdFecha,
          tdPlano,
          tdEst,
          tdResp,
          tdLayout,
          tdOk,
          tdGaps,
          tdEstado,
          tdAccion
        );
        tbody.appendChild(tr);
      });
  }

  function mostrarDetalle(ins) {
    if (!detailTitle || !detailContent) return;

    detailTitle.textContent =
      `${ins.plano} · ${ins.estanteria} · ${ins.fecha} (layout ${ins.layout})`;

    detailContent.innerHTML = '';

    const info = document.createElement('p');
    info.className = 'detail-sub';
    info.textContent =
      `Responsables: ${ins.responsables.join(' / ')} · ` +
      `Productos completos: ${ins.ok.join(', ') || '—'} · ` +
      `Huecos: ${ins.gaps.join(', ') || '—'}`;

    const grid = document.createElement('div');
    grid.className = 'detail-grid';

    ins.zonas.forEach((z) => {
      const card = document.createElement('article');
      card.className = 'zone-card';

      const name = document.createElement('div');
      name.className = 'zone-name';
      name.textContent = `Zona ${z.zona}`;

      const meta = document.createElement('div');
      meta.className = 'zone-meta';
      meta.textContent = `Producto objetivo: ${z.producto}`;

      const resp = document.createElement('div');
      resp.className = 'zone-meta';
      resp.textContent = `Responsable: ${z.responsable}`;

      const status = document.createElement('div');
      status.className = 'zone-status';
      const badge = document.createElement('span');
      badge.className = z.presente ? 'badge-ok' : 'badge-gap';
      badge.textContent = z.presente ? 'Producto detectado' : 'Hueco';
      status.appendChild(badge);

      card.append(name, meta, resp, status);
      grid.appendChild(card);
    });

    detailContent.append(info, grid);
  }

  if (filtroPlano) filtroPlano.addEventListener('input', renderTable);
  if (filtroEstado) filtroEstado.addEventListener('change', renderTable);
  if (filtroUltimas) filtroUltimas.addEventListener('change', renderTable);

  // Botones Descarga / Registro (mock)
  if (btnDescargar) {
    btnDescargar.addEventListener('click', () => {
      console.log('Descargar informe CSV (mock)', inspeccionesMock);
      alert('Descarga simulada. En la versión real se generará un CSV/PDF.');
    });
  }

  if (btnRegistro) {
    btnRegistro.addEventListener('click', () => {
      console.log('Registrar revisión en log (mock)');
      alert('Registro simulado. En la versión real se guardará quién revisó qué zona.');
    });
  }

  renderTable();
});
