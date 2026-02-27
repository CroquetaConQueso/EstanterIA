// js/registro.js
(() => {
  const $  = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // ===== Util =====
  const exists = (el, name) => {
    if (!el) console.warn(`[registro] No se encontró ${name}`);
    return !!el;
  };

  // ===== Header: marcar activo por URL (por si falta en HTML) =====
  (function markActive() {
    const path = location.pathname.split('/').pop().toLowerCase();
    $$('.home-nav-link, .home-link').forEach(a => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      if (href && path && href.includes(path)) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      }
    });
  })();

  // ===== Pasos (wizard) =====
  const steps   = $$('.reg-step');
  const chips   = [$('#step-chip-1'), $('#step-chip-2'), $('#step-chip-3')].filter(Boolean);
  const progress = $('#reg-progress');

  if (!steps.length) return; // si no hay wizard, salimos

  let current = 0;

  function go(i) {
    if (i < 0 || i >= steps.length) return;
    steps.forEach((s, idx) => s.classList.toggle('is-active', idx === i));
    chips.forEach((c, idx) => c.classList.toggle('is-active', idx === i));
    if (progress && steps.length > 1) {
      const pct = (i) / (steps.length - 1) * 100;
      progress.style.width = `${pct}%`;
    }
    current = i;
    // foco al primer control del paso
    const first = steps[i].querySelector('input, select, button');
    first && first.focus();
  }

  // ===== Campos Paso 1 =====
  const name   = $('#name');
  const email  = $('#email');
  const pass   = $('#password');
  const pass2  = $('#password2');

  const eName  = $('#e-name');
  const eEmail = $('#e-email');
  const ePass  = $('#e-password');
  const ePass2 = $('#e-password2');

  const togglePass = $('#togglePass');
  if (exists(togglePass, '#togglePass') && exists(pass, '#password')) {
    togglePass.addEventListener('click', () => {
      pass.type = pass.type === 'password' ? 'text' : 'password';
      togglePass.setAttribute('aria-pressed', pass.type !== 'password');
    });
  }

  // Fuerza de contraseña
  const strengthBar  = $('#strengthBar');
  const strengthText = $('#strengthText');

  function passScore(v) {
    // 0..4
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[a-z]/.test(v)) s++;
    if (/\d/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    return Math.min(s, 4);
  }

  if (exists(pass, '#password') && exists(strengthBar, '#strengthBar') && exists(strengthText, '#strengthText')) {
    pass.addEventListener('input', () => {
      const s   = passScore(pass.value);
      const pct = [0, 25, 50, 75, 100][s];
      // actualiza la “after bar” vía CSS var
      strengthBar.style.setProperty('--w', pct + '%');
      const labels = ['Muy débil', 'Débil', 'Media', 'Buena', 'Fuerte'];
      strengthText.textContent = `Fuerza: ${labels[s]}`;
    });
  }

  const reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function valPaso1() {
    let ok = true;
    if (exists(name, '#name')) {
      const valid = !!name.value.trim();
      eName && (eName.textContent = valid ? '' : 'Introduce tu nombre.');
      ok = ok && valid;
    }
    if (exists(email, '#email')) {
      const valid = reEmail.test(email.value);
      eEmail && (eEmail.textContent = valid ? '' : 'Email no válido.');
      ok = ok && valid;
    }
    if (exists(pass, '#password')) {
      const sc = passScore(pass.value);
      const valid = sc >= 3;
      ePass && (ePass.textContent = valid ? '' : 'Contraseña de 8+ con may/min, número y símbolo.');
      ok = ok && valid;
    }
    if (exists(pass2, '#password2') && exists(pass, '#password')) {
      const valid = pass.value && pass.value === pass2.value;
      ePass2 && (ePass2.textContent = valid ? '' : 'Las contraseñas no coinciden.');
      ok = ok && valid;
    }
    return ok;
  }

  $('#next-1')?.addEventListener('click', () => { if (valPaso1()) go(1); });

  // ===== Paso 2 =====
  const company = $('#company');
  const role    = $('#role');
  const eCompany = $('#e-company');
  const eRole    = $('#e-role');

  $('#prev-2')?.addEventListener('click', () => go(0));
  $('#next-2')?.addEventListener('click', () => {
    let ok = true;
    if (exists(company, '#company')) {
      const valid = !!company.value.trim();
      eCompany && (eCompany.textContent = valid ? '' : 'Indica el nombre del negocio.');
      ok = ok && valid;
    }
    if (exists(role, '#role')) {
      const valid = !!role.value;
      eRole && (eRole.textContent = valid ? '' : 'Selecciona un rol.');
      ok = ok && valid;
    }
    if (ok) go(2);
  });

  // Rango catálogo
  const catalog    = $('#catalog');
  const catalogOut = $('#catalogOut');
  if (catalog && catalogOut) {
    const fmt = (n) => Number(n || 0).toLocaleString('es-ES');
    catalog.addEventListener('input', () => catalogOut.textContent = fmt(catalog.value));
    catalogOut.textContent = fmt(catalog.value);
  }

  // Logo drag&drop (opcional)
  const dropLogo = $('#dropLogo');
  const logoFile = $('#logoFile');
  const pickLogo = $('#pickLogo');

  if (dropLogo) {
    ['dragover', 'dragenter'].forEach(ev => dropLogo.addEventListener(ev, (e) => {
      e.preventDefault(); dropLogo.classList.add('reg-drag');
    }));
    ['dragleave', 'drop'].forEach(ev => dropLogo.addEventListener(ev, () => {
      dropLogo.classList.remove('reg-drag');
    }));
    dropLogo.addEventListener('drop', (e) => {
      e.preventDefault();
      const f = e.dataTransfer?.files?.[0];
      if (f) dropLogo.innerHTML = `Logo: <strong>${f.name}</strong>`;
    });
  }
  pickLogo?.addEventListener('click', () => logoFile?.click());
  logoFile?.addEventListener('change', () => {
    const f = logoFile.files?.[0];
    if (f) dropLogo.innerHTML = `Logo: <strong>${f.name}</strong>`;
  });

  // ===== Paso 3 =====
  $('#prev-3')?.addEventListener('click', () => go(1));

  const captchaQ = $('#captchaQ');
  const captchaA = $('#captchaA');
  const eCaptcha = $('#e-captcha');

  function newCaptcha() {
    if (!captchaQ) return;
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    captchaQ.textContent = `${a} + ${b} = ?`;
    captchaQ.dataset.ans = String(a + b);
  }
  newCaptcha();

  // Submit simulado
  $('#reg-form')?.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validación captcha/aceptación
    const agree = $('#agree')?.checked ?? false;
    const ans   = (captchaA?.value || '').trim();
    let ok = true;

    if (!agree) { ok = false; alert('Debes aceptar los Términos y la Política.'); }
    if (captchaQ && (ans !== captchaQ.dataset.ans)) { ok = false; eCaptcha && (eCaptcha.textContent = 'Respuesta incorrecta.'); }

    if (!ok) return;

    const payload = {
      name: name?.value?.trim() || null,
      email: email?.value?.trim() || null,
      company: company?.value?.trim() || null,
      role: role?.value || null,
      catalog: Number(catalog?.value || 0),
      news: $('#news')?.checked ?? false,
      sample: $('#sample')?.checked ?? false
    };

    console.log('POST /api/registro', payload);
    alert('✅ Cuenta creada. Te llevamos al inicio.');
    location.href = 'home.html';
  });

  // Atajo Enter para avanzar si hay botón primario
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const activeStep = steps[current];
    if (!activeStep) return;
    // Si el target es un textarea o un select, no interceptamos
    if (e.target instanceof HTMLTextAreaElement) return;
    // Si el submit está visible, dejamos submit
    const isLast = current === steps.length - 1;
    if (!isLast) {
      const primary = activeStep.querySelector('.btn.primary[type="button"]');
      if (primary) { e.preventDefault(); primary.click(); }
    }
  });

  // Iniciar en paso 0
  go(0);
})();
