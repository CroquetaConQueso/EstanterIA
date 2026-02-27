// js/inventario.js
document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('tbody-inventario');
  const fPlano = document.getElementById('f-plano');
  const fEstado = document.getElementById('f-estado');
  const fHotspot = document.getElementById('f-hotspot');
  const fSearch = document.getElementById('f-search');

  const resTotal = document.getElementById('res-total');
  const resGaps = document.getElementById('res-gaps');
  const resHotspots = document.getElementById('res-hotspots');

  // Mock de inventario alineado con el resumen de Home
  const inventario = [
    {
      producto: 'Arroz 1kg',
      sku: 'ARZ-001',
      plano: 'Almacén Central',
      estanteria: 'S-01',
      stockSistema: 24,
      stockIA: 18,
      estado: 'gaps',
      hotspot: 'normal'
    },
    {
      producto: 'Lentejas 1kg',
      sku: 'LEN-002',
      plano: 'Almacén Central',
      estanteria: 'S-01',
      stockSistema: 18,
      stockIA: 18,
      estado: 'ok',
      hotspot: 'normal'
    },
    {
      producto: 'Garbanzos 1kg',
      sku: 'GBZ-003',
      plano: 'Almacén Central',
      estanteria: 'S-01',
      stockSistema: 15,
      stockIA: 5,
      estado: 'gaps',
      hotspot: 'alto'
    },
    {
      producto: 'Aceite oliva 1L',
      sku: 'ACE-010',
      plano: 'Supermercado — zona seca',
      estanteria: 'SM-02',
      stockSistema: 30,
      stockIA: 29,
      estado: 'ok',
      hotspot: 'alto'
    },
    {
      producto: 'Azúcar blanco 1kg',
      sku: 'AZU-011',
      plano: 'Supermercado — zona seca',
      estanteria: 'SM-02',
      stockSistema: 20,
      stockIA: 10,
      estado: 'gaps',
      hotspot: 'alto'
    },
    {
      producto: 'Snacks surtidos',
      sku: 'SNK-050',
      plano: 'Tienda de barrio',
      estanteria: 'TB-01',
      stockSistema: 40,
      stockIA: 35,
      estado: 'ok',
      hotspot: 'alto'
    },
    {
      producto: 'Agua pequeña 0.5L',
      sku: 'AGU-051',
      plano: 'Tienda de barrio',
      estanteria: 'TB-01',
      stockSistema: 25,
      stockIA: 6,
      estado: 'gaps',
      hotspot: 'alto'
    },
    {
      producto: 'Tacos pared',
      sku: 'TAC-100',
      plano: 'Ferretería Centro',
      estanteria: 'F-03',
      stockSistema: 60,
      stockIA: 59,
      estado: 'ok',
      hotspot: 'normal'
    },
    {
      producto: 'Tornillos M6',
      sku: 'TOR-101',
      plano: 'Ferretería Centro',
      estanteria: 'F-03',
      stockSistema: 50,
      stockIA: 10,
      estado: 'gaps',
      hotspot: 'alto'
    }
  ];

  function actualizarResumen(nFiltrados) {
    const total = inventario.length;
    const conGaps = inventario.filter((i) => i.estado === 'gaps').length;
    const hotspots = inventario.filter((i) => i.hotspot === 'alto').length;

    if (resTotal) resTotal.textContent = `${nFiltrados} / ${total}`;
    if (resGaps) resGaps.textContent = conGaps.toString();
    if (resHotspots) resHotspots.textContent = hotspots.toString();
  }

  function pasaFiltros(item) {
    const plano = fPlano.value;
    const estado = fEstado.value;
    const hotspot = fHotspot.value;
    const search = fSearch.value.trim().toLowerCase();

    if (plano && item.plano !== plano) return false;
    if (estado && item.estado !== estado) return false;
    if (hotspot && item.hotspot !== hotspot) return false;

    if (search) {
      const texto = `${item.producto} ${item.sku} ${item.estanteria}`.toLowerCase();
      if (!texto.includes(search)) return false;
    }

    return true;
  }

  function render() {
    if (!tbody) return;

    tbody.innerHTML = '';
    const filtrados = inventario.filter(pasaFiltros);

    filtrados.forEach((item) => {
      const tr = document.createElement('tr');

      const tdProd = document.createElement('td');
      tdProd.textContent = item.producto;

      const tdSku = document.createElement('td');
      tdSku.textContent = item.sku;

      const tdPlano = document.createElement('td');
      tdPlano.textContent = item.plano;

      const tdEst = document.createElement('td');
      tdEst.textContent = item.estanteria;

      const tdStockSis = document.createElement('td');
      tdStockSis.textContent = item.stockSistema;

      const tdStockIA = document.createElement('td');
      tdStockIA.textContent = item.stockIA;

      const diferencia = item.stockIA - item.stockSistema;
      const tdDif = document.createElement('td');
      tdDif.textContent = diferencia;
      if (diferencia < 0) {
        tdDif.style.color = '#fecaca';
      }

      const tdEstado = document.createElement('td');
      const spanEstado = document.createElement('span');
      spanEstado.className = item.estado === 'ok' ? 'badge-ok' : 'badge-gap';
      spanEstado.textContent = item.estado === 'ok' ? 'Sin huecos' : 'Con huecos';
      tdEstado.appendChild(spanEstado);

      const tdHotspot = document.createElement('td');
      const spanHot = document.createElement('span');
      spanHot.className = 'badge-hotspot';
      spanHot.textContent =
        item.hotspot === 'alto' ? 'Alta rotación' : 'Normal';
      tdHotspot.appendChild(spanHot);

      tr.append(
        tdProd,
        tdSku,
        tdPlano,
        tdEst,
        tdStockSis,
        tdStockIA,
        tdDif,
        tdEstado,
        tdHotspot
      );

      tbody.appendChild(tr);
    });

    actualizarResumen(filtrados.length);
  }

  if (fPlano) fPlano.addEventListener('change', render);
  if (fEstado) fEstado.addEventListener('change', render);
  if (fHotspot) fHotspot.addEventListener('change', render);
  if (fSearch) fSearch.addEventListener('input', render);

  render();
});
