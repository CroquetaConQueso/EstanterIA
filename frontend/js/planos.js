// js/planos.js
// Interacción mínima para la pantalla de Planos:
// - Cambia el plano activo
// - Actualiza preview y detalles usando datos mock

document.addEventListener('DOMContentLoaded', () => {
  const planosData = {
    'almacen-central': {
      nombre: 'Almacén Central',
      resumen: [
        'Plano: Almacén Central (mock)',
        'Estanterías: 12',
        'Zonas: 3 (Recepción, Pasillo A, Pasillo B)',
      ],
      estanterias: [
        'Est. A-01 — detergentes',
        'Est. A-05 — suavizantes',
        'Est. B-02 — papel / celulosa',
      ],
      preview: 'Render 2D (mock) del Almacén Central.',
    },
    'supermercado-seco': {
      nombre: 'Supermercado — zona seca',
      resumen: [
        'Plano: Supermercado — zona seca (mock)',
        'Estanterías: 18',
        'Zonas: 5 (Entrada, Seco 1, Seco 2, Promo, Cajas)',
      ],
      estanterias: [
        'Est. S1-03 — pasta y arroz',
        'Est. S1-07 — legumbres',
        'Est. S2-04 — conservas',
      ],
      preview: 'Render 2D (mock) del Supermercado — zona seca.',
    },
    'tienda-barrio': {
      nombre: 'Tienda de barrio',
      resumen: [
        'Plano: Tienda de barrio (mock)',
        'Estanterías: 8',
        'Zonas: 2 (Sala ventas, Almacén trasero)',
      ],
      estanterias: [
        'Est. T-01 — básicos (pan, leche)',
        'Est. T-03 — snacks',
        'Est. T-05 — bebidas frías',
      ],
      preview: 'Render 2D (mock) de la tienda de barrio.',
    },
    'ferreteria-centro': {
      nombre: 'Ferretería Centro',
      resumen: [
        'Plano: Ferretería Centro (mock)',
        'Estanterías: 10',
        'Pasillos: 4 (Herramienta, Tornillería, Jardín, Pintura)',
      ],
      estanterias: [
        'Est. F-01 — martillos y destornilladores',
        'Est. F-03 — tornillería',
        'Est. F-06 — pintura interior',
      ],
      preview: 'Render 2D (mock) de la ferretería.',
    },
  };

  const listaPlanos = document.querySelectorAll('.plan-item');
  const preview = document.getElementById('preview-plano');
  const detallePlano = document.getElementById('detalle-plano');
  const detalleEstanterias = document.getElementById('detalle-estanterias');

  if (!listaPlanos.length || !preview || !detallePlano || !detalleEstanterias) {
    return;
  }

  function renderPlano(id) {
    const data = planosData[id];
    if (!data) return;

    // Preview
    preview.innerHTML = `<span>${data.preview}</span>`;

    // Resumen
    detallePlano.innerHTML = '';
    data.resumen.forEach((linea) => {
      const li = document.createElement('li');
      li.textContent = linea;
      detallePlano.appendChild(li);
    });

    // Estanterías
    detalleEstanterias.innerHTML = '';
    data.estanterias.forEach((linea) => {
      const li = document.createElement('li');
      li.textContent = linea;
      detalleEstanterias.appendChild(li);
    });
  }

  listaPlanos.forEach((item) => {
    item.addEventListener('click', () => {
      listaPlanos.forEach((p) => p.classList.remove('is-active'));
      item.classList.add('is-active');
      const id = item.dataset.id;
      renderPlano(id);
    });
  });

  // Render inicial según el que tenga .is-active
  const activo = document.querySelector('.plan-item.is-active');
  if (activo) {
    renderPlano(activo.dataset.id);
  }
});
