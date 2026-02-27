// js/home.js
document.addEventListener('DOMContentLoaded', () => {
  // ------- SLIDER -------

  const track = document.getElementById('slider-track');
  const btnPrev = document.getElementById('slider-prev');
  const btnNext = document.getElementById('slider-next');
  const dotsContainer = document.getElementById('slider-dots');

  if (track && btnPrev && btnNext && dotsContainer) {
    const slides = Array.from(track.children);
    const total = slides.length;
    let current = 0;

    // Crear dots
    slides.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.className = 'slider-dot' + (idx === 0 ? ' is-active' : '');
      dot.addEventListener('click', () => goTo(idx));
      dotsContainer.appendChild(dot);
    });

    const dots = Array.from(dotsContainer.children);

    function update() {
      const offset = -current * 100;
      track.style.transform = `translateX(${offset}%)`;
      dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
    }

    function goTo(idx) {
      current = (idx + total) % total;
      update();
    }

    btnPrev.addEventListener('click', () => goTo(current - 1));
    btnNext.addEventListener('click', () => goTo(current + 1));

    // Auto-rotación suave
    setInterval(() => {
      goTo(current + 1);
    }, 7000);
  } else {
    console.warn('Slider no inicializado (faltan elementos).');
  }

  // ------- RESUMEN ESTANTERÍAS / PRODUCTOS / HUECOS -------

  const tbodyResumen = document.getElementById('tbody-resumen');

  // Mock ampliado para que se vea con más ejemplos
  const resumenMock = [
    {
      plano: 'Almacén Central',
      estanteria: 'S-01',
      ok: ['arroz', 'lentejas'],
      gaps: ['garbanzos'],
      responsables: ['Marta López'],
      estado: 'gaps'
    },
    {
      plano: 'Almacén Central',
      estanteria: 'S-02',
      ok: ['azúcar', 'harina'],
      gaps: [],
      responsables: ['Marta López', 'Reponedor turno mañana'],
      estado: 'ok'
    },
    {
      plano: 'Supermercado — zona seca',
      estanteria: 'SM-02',
      ok: ['aceite', 'sal', 'vinagre'],
      gaps: ['azúcar moreno'],
      responsables: ['Carlos Ruiz'],
      estado: 'gaps'
    },
    {
      plano: 'Supermercado — refrigerados',
      estanteria: 'SM-FR-01',
      ok: ['yogures', 'mantequilla'],
      gaps: [],
      responsables: ['Equipo frío'],
      estado: 'ok'
    },
    {
      plano: 'Tienda de barrio',
      estanteria: 'TB-01',
      ok: ['snacks', 'refrescos'],
      gaps: ['agua pequeña'],
      responsables: ['Propietaria'],
      estado: 'gaps'
    },
    {
      plano: 'Ferretería Centro',
      estanteria: 'F-03',
      ok: ['tacos', 'brocas'],
      gaps: ['tornillos M6'],
      responsables: ['Encargado ferretería'],
      estado: 'gaps'
    }
  ];

  if (tbodyResumen) {
    tbodyResumen.innerHTML = '';
    resumenMock.forEach((r) => {
      const tr = document.createElement('tr');

      const tdPlano = document.createElement('td');
      tdPlano.textContent = r.plano;

      const tdEst = document.createElement('td');
      tdEst.textContent = r.estanteria;

      const tdOk = document.createElement('td');
      tdOk.textContent = r.ok.length ? r.ok.join(', ') : '—';

      const tdGaps = document.createElement('td');
      tdGaps.textContent = r.gaps.length ? r.gaps.join(', ') : '—';

      const tdResp = document.createElement('td');
      tdResp.textContent = r.responsables.join(' / ');

      const tdEstado = document.createElement('td');
      const spanEstado = document.createElement('span');
      spanEstado.className = r.estado === 'ok' ? 'badge-ok' : 'badge-gap';
      spanEstado.textContent =
        r.estado === 'ok' ? 'Sin huecos' : 'Con huecos';
      tdEstado.appendChild(spanEstado);

      tr.append(tdPlano, tdEst, tdOk, tdGaps, tdResp, tdEstado);
      tbodyResumen.appendChild(tr);
    });
  }
});
