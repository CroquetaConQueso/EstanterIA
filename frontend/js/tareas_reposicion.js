document.addEventListener('DOMContentLoaded', () => {
  // Datos simulados iniciales
  let tareas = [
    {
      id: 201,
      producto: 'Lentejas 1kg',
      estanteria: 'A-12',
      zona: 'Zona seca',
      plano: 'Almacén Central',
      detectado: 0,
      esperado: 3,
      responsable: 'Marta López',
      estado: 'PENDIENTE',
      observacion: 'Rotura de stock visual detectada.'
    },
    {
      id: 202,
      producto: 'Arroz redondo',
      estanteria: 'B-05',
      zona: 'Pasillo 2',
      plano: 'Supermercado Norte',
      detectado: 1,
      esperado: 4,
      responsable: 'Carlos Ruiz',
      estado: 'EN_CURSO',
      observacion: 'Reponiendo desde almacén.'
    },
    {
      id: 203,
      producto: 'Comida de gato',
      estanteria: 'TB-01',
      zona: 'Mascotas',
      plano: 'Tienda de Barrio',
      detectado: 0,
      esperado: 2,
      responsable: 'Propietaria',
      estado: 'SIN_STOCK',
      observacion: 'Falta entrega del proveedor.'
    },
    {
      id: 204,
      producto: 'Tomate triturado',
      estanteria: 'C-08',
      zona: 'Conservas',
      plano: 'Almacén Central',
      detectado: 2,
      esperado: 6,
      responsable: 'Marta López',
      estado: 'COMPLETADA',
      observacion: 'Cabecera completada con éxito.'
    },
    {
      id: 205,
      producto: 'Aceite de Oliva 1L',
      estanteria: 'A-02',
      zona: 'Zona seca',
      plano: 'Almacén Central',
      detectado: 0,
      esperado: 12,
      responsable: 'Equipo Noche',
      estado: 'PENDIENTE',
      observacion: 'Alerta prioritaria.'
    }
  ];

  // Referencias del DOM
  const tasksGrid = document.getElementById('tasks-grid');
  const filtroEstado = document.getElementById('filtro-estado');
  const filtroZona = document.getElementById('filtro-zona');
  const filtroTexto = document.getElementById('filtro-texto');
  const btnLimpiar = document.getElementById('btn-limpiar');

  const metricPendientes = document.getElementById('metric-pendientes');
  const metricCurso = document.getElementById('metric-curso');
  const metricCompletadas = document.getElementById('metric-completadas');

  // Función para normalizar el texto del estado para la clase CSS
  const getEstadoClass = (estado) => {
    return estado.toLowerCase();
  };

  // Función para actualizar las tarjetas en pantalla
  function renderTasks() {
    const filterEstado = filtroEstado.value;
    const filterZona = filtroZona.value;
    const filterText = filtroTexto.value.toLowerCase();

    tasksGrid.innerHTML = '';

    const tareasFiltradas = tareas.filter(t => {
      const matchEstado = filterEstado === '' || t.estado === filterEstado;
      const matchZona = filterZona === '' || t.zona === filterZona;
      const matchText = filterText === '' || 
        t.producto.toLowerCase().includes(filterText) || 
        t.estanteria.toLowerCase().includes(filterText) ||
        t.responsable.toLowerCase().includes(filterText);
      
      return matchEstado && matchZona && matchText;
    });

    if (tareasFiltradas.length === 0) {
      tasksGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 40px; background: var(--surface); border: var(--border-heavy); text-align: center; font-weight: 800; text-transform: uppercase;">
          No hay órdenes de trabajo que coincidan con los filtros.
        </div>
      `;
      return;
    }

    tareasFiltradas.forEach(t => {
      const article = document.createElement('article');
      article.className = 'task-card';
      
      // Cantidad a reponer
      const aReponer = t.esperado - t.detectado;

      article.innerHTML = `
        <div class="task-head">
          <div class="task-title-group">
            <span class="task-id">OP-${t.id}</span>
            <h2 class="task-title">${t.producto}</h2>
          </div>
          <span class="status-chip ${getEstadoClass(t.estado)}">${t.estado.replace('_', ' ')}</span>
        </div>

        <div class="task-body">
          <div class="task-meta">
            <div class="meta-box highlight full">
              <span class="meta-label">Acción requerida</span>
              <span class="meta-value">REPONER ${aReponer} UNIDADES</span>
            </div>
            
            <div class="meta-box">
              <span class="meta-label">Estantería</span>
              <span class="meta-value">${t.estanteria}</span>
            </div>
            <div class="meta-box">
              <span class="meta-label">Zona</span>
              <span class="meta-value">${t.zona}</span>
            </div>
            
            <div class="meta-box full">
              <span class="meta-label">Plano de origen</span>
              <span class="meta-value">${t.plano}</span>
            </div>
            
            <div class="meta-box full">
              <span class="meta-label">Observaciones IA</span>
              <span class="meta-value">${t.observacion}</span>
            </div>
          </div>
        </div>

        <div class="task-actions">
          ${t.estado !== 'COMPLETADA' ? `<button class="btn primary" data-action="COMPLETADA" data-id="${t.id}">Completada</button>` : ''}
          ${t.estado === 'PENDIENTE' ? `<button class="btn warn" data-action="EN_CURSO" data-id="${t.id}">Iniciar</button>` : ''}
          ${t.estado !== 'SIN_STOCK' && t.estado !== 'COMPLETADA' ? `<button class="btn ghost" data-action="SIN_STOCK" data-id="${t.id}">Falta Almacén</button>` : ''}
        </div>
      `;
      tasksGrid.appendChild(article);
    });
  }

  // Actualización de KPIs en la cabecera
  function updateMetrics() {
    const pendientes = tareas.filter(t => t.estado === 'PENDIENTE').length;
    const curso = tareas.filter(t => t.estado === 'EN_CURSO').length;
    const completadas = tareas.filter(t => t.estado === 'COMPLETADA').length;

    metricPendientes.textContent = pendientes;
    metricCurso.textContent = curso;
    metricCompletadas.textContent = completadas;
  }

  // Delegación de eventos para los botones de las tarjetas
  tasksGrid.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.action;
    
    const tareaIndex = tareas.findIndex(t => t.id === id);
    if (tareaIndex === -1) return;

    // Actualizar el estado de la tarea
    tareas[tareaIndex].estado = action;

    // Repintar interfaz
    updateMetrics();
    renderTasks();
  });

  // Listeners de los filtros
  filtroEstado.addEventListener('change', renderTasks);
  filtroZona.addEventListener('change', renderTasks);
  filtroTexto.addEventListener('input', renderTasks);

  btnLimpiar.addEventListener('click', () => {
    filtroEstado.value = '';
    filtroZona.value = '';
    filtroTexto.value = '';
    renderTasks();
  });

  // Inicialización
  updateMetrics();
  renderTasks();
});