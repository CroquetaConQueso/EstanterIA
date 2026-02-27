// js/editor.js
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('plan-canvas');
  const ctx = canvas.getContext('2d');

  const shelfListEl = document.getElementById('shelf-list');
  const form = document.getElementById('shelf-form');
  const noShelfMsg = document.getElementById('no-shelf-msg');
  const formFields = document.getElementById('form-fields');
  const fName = document.getElementById('f-name');
  const fZone = document.getElementById('f-zone');
  const fOwner = document.getElementById('f-owner');
  const fNotes = document.getElementById('f-notes');
  const coordInfo = document.getElementById('coord-info');
  const btnDelete = document.getElementById('btn-delete');
  const btnClear = document.getElementById('btn-clear');
  const btnExport = document.getElementById('btn-export');

  // Estado interno
  let shelves = [];
  let nextId = 1;
  let selectedId = null;

  let isDrawing = false;
  let startX = 0;
  let startY = 0;

  // ---------- Helpers de dibujo ----------

  function clearCanvas() {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawGrid() {
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1;

    for (let x = 20; x < canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 20; y < canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  function drawShelves() {
    shelves.forEach((shelf) => {
      const isSelected = shelf.id === selectedId;

      ctx.beginPath();
      ctx.rect(shelf.x, shelf.y, shelf.width, shelf.height);
      ctx.fillStyle = isSelected ? 'rgba(34,197,94,0.35)' : 'rgba(34,197,94,0.15)';
      ctx.fill();
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeStyle = isSelected ? '#22c55e' : '#16a34a';
      ctx.stroke();

      // Nombre dentro
      if (shelf.name) {
        ctx.fillStyle = '#e5e7eb';
        ctx.font = '11px system-ui';
        ctx.fillText(shelf.name, shelf.x + 4, shelf.y + 14);
      }
    });
  }

  function redraw() {
    clearCanvas();
    drawGrid();
    drawShelves();
  }

  // ---------- Gestión de estanterías ----------

  function addShelfFromDrag(x1, y1, x2, y2) {
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);

    // Evitar “clicks” muy pequeños
    if (width < 10 || height < 10) return;

    const shelf = {
      id: nextId++,
      name: `Est-${String(nextId - 1).padStart(2, '0')}`,
      zone: '',
      owner: '',
      notes: '',
      x,
      y,
      width,
      height
    };
    shelves.push(shelf);
    selectedId = shelf.id;
    renderShelfList();
    loadSelectedShelfIntoForm();
    redraw();
  }

  function getShelfAt(x, y) {
    // Buscar de arriba a abajo (última creada arriba)
    for (let i = shelves.length - 1; i >= 0; i--) {
      const s = shelves[i];
      if (
        x >= s.x &&
        x <= s.x + s.width &&
        y >= s.y &&
        y <= s.y + s.height
      ) {
        return s;
      }
    }
    return null;
  }

  function selectShelf(id) {
    selectedId = id;
    renderShelfList();
    loadSelectedShelfIntoForm();
    redraw();
  }

  function deleteSelectedShelf() {
    if (selectedId == null) return;
    shelves = shelves.filter((s) => s.id !== selectedId);
    selectedId = null;
    renderShelfList();
    loadSelectedShelfIntoForm();
    redraw();
  }

  // ---------- Lista lateral ----------

  function renderShelfList() {
    shelfListEl.innerHTML = '';

    if (!shelves.length) {
      const li = document.createElement('li');
      li.className = 'shelf-item';
      li.innerHTML =
        '<span class="shelf-meta">No hay estanterías todavía. Dibuja una arrastrando sobre el lienzo.</span>';
      shelfListEl.appendChild(li);
      return;
    }

    shelves.forEach((shelf) => {
      const li = document.createElement('li');
      li.className =
        'shelf-item' + (shelf.id === selectedId ? ' is-active' : '');
      li.dataset.id = shelf.id;

      const name = document.createElement('div');
      name.className = 'shelf-name';
      name.textContent = shelf.name || `Estantería ${shelf.id}`;

      const meta = document.createElement('div');
      meta.className = 'shelf-meta';
      const zoneText = shelf.zone ? `Zona: ${shelf.zone}` : 'Zona sin definir';
      const ownerText = shelf.owner
        ? ` · Resp.: ${shelf.owner}`
        : '';
      meta.textContent = `${zoneText}${ownerText}`;

      li.appendChild(name);
      li.appendChild(meta);
      li.addEventListener('click', () => {
        selectShelf(shelf.id);
      });

      shelfListEl.appendChild(li);
    });
  }

  // ---------- Formulario detalle ----------

  function loadSelectedShelfIntoForm() {
    const shelf = shelves.find((s) => s.id === selectedId);

    if (!shelf) {
      noShelfMsg.classList.remove('hidden');
      formFields.classList.add('hidden');
      return;
    }

    noShelfMsg.classList.add('hidden');
    formFields.classList.remove('hidden');

    fName.value = shelf.name || '';
    fZone.value = shelf.zone || '';
    fOwner.value = shelf.owner || '';
    fNotes.value = shelf.notes || '';
    coordInfo.textContent = `Posición: (${Math.round(
      shelf.x
    )}, ${Math.round(shelf.y)}) · Tamaño: ${Math.round(
      shelf.width
    )}×${Math.round(shelf.height)} px`;
  }

  function saveFormToShelf() {
    const shelf = shelves.find((s) => s.id === selectedId);
    if (!shelf) return;

    shelf.name = fName.value.trim() || shelf.name;
    shelf.zone = fZone.value.trim();
    shelf.owner = fOwner.value.trim();
    shelf.notes = fNotes.value.trim();

    renderShelfList();
    redraw();
  }

  // Guardar en blur
  [fName, fZone, fOwner, fNotes].forEach((input) => {
    input &&
      input.addEventListener('blur', () => {
        saveFormToShelf();
      });
  });

  // Botón eliminar
  if (btnDelete) {
    btnDelete.addEventListener('click', () => {
      if (!selectedId) return;
      const sure = confirm(
        '¿Seguro que quieres eliminar esta estantería del plano?'
      );
      if (sure) {
        deleteSelectedShelf();
      }
    });
  }

  // ---------- Canvas events ----------

  function getCanvasCoords(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((evt.clientX - rect.left) / rect.width) * canvas.width,
      y: ((evt.clientY - rect.top) / rect.height) * canvas.height
    };
  }

  canvas.addEventListener('mousedown', (evt) => {
    const { x, y } = getCanvasCoords(evt);

    // Si clic corto, primero comprobar si hay selección
    const clickedShelf = getShelfAt(x, y);
    if (clickedShelf) {
      selectShelf(clickedShelf.id);
      return;
    }

    // Si no hay shelf, empezamos a dibujar
    isDrawing = true;
    startX = x;
    startY = y;
  });

  canvas.addEventListener('mousemove', (evt) => {
    if (!isDrawing) return;

    const { x, y } = getCanvasCoords(evt);
    redraw();

    // Dibujo en vivo del rectángulo
    ctx.beginPath();
    ctx.rect(
      Math.min(startX, x),
      Math.min(startY, y),
      Math.abs(x - startX),
      Math.abs(y - startY)
    );
    ctx.fillStyle = 'rgba(34,197,94,0.15)';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#22c55e';
    ctx.stroke();
  });

  canvas.addEventListener('mouseup', (evt) => {
    if (!isDrawing) return;
    isDrawing = false;
    const { x, y } = getCanvasCoords(evt);
    addShelfFromDrag(startX, startY, x, y);
  });

  canvas.addEventListener('mouseleave', () => {
    if (isDrawing) {
      isDrawing = false;
      redraw();
    }
  });

  // ---------- Botones generales ----------

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      const sure = confirm(
        'Esto eliminará todas las estanterías dibujadas. ¿Continuar?'
      );
      if (!sure) return;
      shelves = [];
      selectedId = null;
      renderShelfList();
      loadSelectedShelfIntoForm();
      redraw();
    });
  }

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const exportData = {
        plano: 'Almacén Central',
        estanterias: shelves.map((s) => ({
          id: s.id,
          name: s.name,
          zone: s.zone,
          owner: s.owner,
          notes: s.notes,
          x: s.x,
          y: s.y,
          width: s.width,
          height: s.height
        }))
      };
      console.log('Export JSON (mock):', JSON.stringify(exportData, null, 2));
      alert(
        'Export JSON (mock) generado en consola. En la versión real se enviaría al backend.'
      );
    });
  }

  // ---------- Inicialización ----------

  noShelfMsg.classList.remove('hidden');
  formFields.classList.add('hidden');

  redraw();
  renderShelfList();
});
