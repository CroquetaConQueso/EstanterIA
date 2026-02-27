// js/perfil.js
document.addEventListener('DOMContentLoaded', () => {
  const formPerfil = document.getElementById('form-perfil');
  const btnLogout = document.getElementById('btn-logout');

  if (formPerfil) {
    formPerfil.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(formPerfil);
      console.log('Guardando perfil (mock):', Object.fromEntries(data.entries()));
      alert('Perfil actualizado (mock). En la versión real se guardará en el backend.');
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      console.log('Cerrar sesión (mock)');
      alert('Sesión cerrada (mock). Volviendo a Acceso.');
      window.location.href = 'login.html';
    });
  }
});
