// js/login.js
document.addEventListener('DOMContentLoaded', () => {
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const panelLogin = document.getElementById('panel-login');
  const panelRegister = document.getElementById('panel-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const btnDesktop = document.getElementById('btn-download-desktop');
  const btnMobile = document.getElementById('btn-download-mobile');

  function activateTab(tab) {
    const loginActive = tab === 'login';

    tabLogin.classList.toggle('is-active', loginActive);
    tabRegister.classList.toggle('is-active', !loginActive);

    if (panelLogin && panelRegister) {
      panelLogin.classList.toggle('is-active', loginActive);
      panelRegister.classList.toggle('is-active', !loginActive);

      panelLogin.hidden = !loginActive;
      panelRegister.hidden = loginActive;
    }

    tabLogin.setAttribute('aria-selected', loginActive ? 'true' : 'false');
    tabRegister.setAttribute('aria-selected', loginActive ? 'false' : 'true');
  }

  if (tabLogin) {
    tabLogin.addEventListener('click', () => activateTab('login'));
  }
  if (tabRegister) {
    tabRegister.addEventListener('click', () => activateTab('register'));
  }

  // Simulación de login
  if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(formLogin);
      const email = data.get('email');
      console.log('Login simulado para:', email);
      alert('Inicio de sesión simulado. Se redirige al panel Home.');
      window.location.href = 'home.html';
    });
  }

  // Simulación de registro
  if (formRegister) {
    formRegister.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(formRegister);
      const nombre = data.get('nombre');
      const email = data.get('email');
      const rol = data.get('rol');
      console.log('Registro simulado:', { nombre, email, rol });
      alert('Cuenta creada (boceto). Se simula acceso al panel.');
      window.location.href = 'home.html';
    });
  }

  // Botones descarga (mock)
  if (btnDesktop) {
    btnDesktop.addEventListener('click', () => {
      console.log('Descarga versión escritorio (mock)');
      alert('Descarga simulada de la versión escritorio.');
    });
  }

  if (btnMobile) {
    btnMobile.addEventListener('click', () => {
      console.log('Descarga versión móvil (mock)');
      alert('Descarga simulada de la app móvil.');
    });
  }
});
