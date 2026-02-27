// js/descarga.js
document.addEventListener('DOMContentLoaded', () => {
  const btnDesk = document.getElementById('btn-descarga-escritorio');
  const btnMovil = document.getElementById('btn-descarga-movil');

  if (btnDesk) {
    btnDesk.addEventListener('click', () => {
      console.log('Descarga instalador escritorio (mock)');
      alert('Descarga simulada del instalador de escritorio.');
    });
  }

  if (btnMovil) {
    btnMovil.addEventListener('click', () => {
      console.log('Descarga app móvil (mock)');
      alert('Descarga simulada de la app móvil.');
    });
  }
});
