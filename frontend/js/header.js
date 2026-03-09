(() => {
  const path = window.location.pathname.replace(/\\/g, "/");
  const page = path.split("/").pop() || "index.html";
  const inHtmlDir = /\/html\/[^/]+$/.test(path);

  const configs = {
    "index.html": { zone: "public", active: "inicio" },
    "about.html": { zone: "public", active: "about" },
    "descargas.html": { zone: "public", active: "descargas" },
    "login.html": { zone: "public", active: "acceso" },
    "registro.html": { zone: "public", active: "registro" },
    "recuperar_password.html": { zone: "public", active: "acceso" },

    "home.html": { zone: "internal", active: "inicio" },
    "planos.html": { zone: "internal", active: "planos" },
    "editor.html": { zone: "internal", active: "planos" },
    "editar.html": { zone: "internal", active: "planos" },
    "inspecciones.html": { zone: "internal", active: "inspecciones" },
    "inspeccion_nueva.html": { zone: "internal", active: "inspecciones" },
    "inventario.html": { zone: "internal", active: "inventario" },
    "vision.html": { zone: "internal", active: "vision" },
    "alertas_centro.html": { zone: "internal", active: "alertas" },
    "tareas_reposicion.html": { zone: "internal", active: "tareas" },
    "perfil.html": { zone: "internal", active: "perfil" }
  };

  const cfg = configs[page];
  if (!cfg) return;

  injectHeaderCss();

  function pageHref(fileName) {
    return inHtmlDir ? fileName : `html/${fileName}`;
  }

  function getBrandHref() {
    return inHtmlDir ? "../index.html" : "index.html";
  }

  function getIconSrc() {
    return inHtmlDir ? "../img/iconoFAV.png" : "img/iconoFAV.png";
  }

  function getHeaderCssHref() {
    return inHtmlDir ? "../css/header.css" : "css/header.css";
  }

  function injectHeaderCss() {
    if (document.querySelector('link[data-estanteria-header-css="true"]')) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = getHeaderCssHref();
    link.setAttribute("data-estanteria-header-css", "true");
    document.head.appendChild(link);
  }

  function getStoredToken() {
    return localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
  }

  function getTokenStorage() {
    if (localStorage.getItem("auth_token")) return localStorage;
    if (sessionStorage.getItem("auth_token")) return sessionStorage;
    return null;
  }

  function clearAuthStorage() {
    [localStorage, sessionStorage].forEach((storage) => {
      storage.removeItem("auth_token");
      storage.removeItem("auth_user");
      storage.removeItem("auth_role");
      storage.removeItem("auth_email");
    });
  }

  function saveSessionSnapshot(user) {
    const storage = getTokenStorage() || sessionStorage;
    const resolvedUserName = resolveUserName(user);
    const resolvedRole = resolveUserRole(user);
    const resolvedEmail = resolveUserEmail(user);

    if (resolvedUserName) storage.setItem("auth_user", resolvedUserName);
    if (resolvedRole) storage.setItem("auth_role", resolvedRole);
    if (resolvedEmail) storage.setItem("auth_email", resolvedEmail);
  }

  function resolveUserName(data) {
    return (
      data?.userName ||
      data?.username ||
      data?.user ||
      localStorage.getItem("auth_user") ||
      sessionStorage.getItem("auth_user") ||
      null
    );
  }

  function resolveUserRole(data) {
    return (
      data?.role ||
      data?.rol ||
      localStorage.getItem("auth_role") ||
      sessionStorage.getItem("auth_role") ||
      null
    );
  }

  function resolveUserEmail(data) {
    return (
      data?.email ||
      data?.mail ||
      localStorage.getItem("auth_email") ||
      sessionStorage.getItem("auth_email") ||
      null
    );
  }

  function buildUserChipText(data) {
    const userName = resolveUserName(data);
    const role = resolveUserRole(data);

    if (userName && role) return `${userName} · ${role}`;
    if (userName) return userName;
    if (role) return role;

    return "Sesión activa";
  }

  function redirectToLogin(reason = "") {
    const loginUrl = pageHref("login.html");

    if (!reason) {
      window.location.href = loginUrl;
      return;
    }

    const separator = loginUrl.includes("?") ? "&" : "?";
    window.location.href = `${loginUrl}${separator}reason=${encodeURIComponent(reason)}`;
  }

  async function authFetch(url, options = {}) {
    const token = getStoredToken();
    const headers = new Headers(options.headers || {});

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(url, {
      ...options,
      headers
    });
  }

  const publicLinks = [
    { key: "inicio", href: inHtmlDir ? "../index.html" : "index.html", label: "Inicio" },
    { key: "descargas", href: pageHref("descargas.html"), label: "Descargas" },
    { key: "acceso", href: pageHref("login.html"), label: "Acceso" },
    { key: "registro", href: pageHref("registro.html"), label: "Registro" },
    { key: "about", href: pageHref("about.html"), label: "Acerca de" }
  ];

  const internalLinks = [
    { key: "inicio", href: pageHref("home.html"), label: "Inicio" },
    { key: "planos", href: pageHref("planos.html"), label: "Planos" },
    { key: "inspecciones", href: pageHref("inspecciones.html"), label: "Inspecciones" },
    { key: "inventario", href: pageHref("inventario.html"), label: "Inventario" },
    { key: "vision", href: pageHref("vision.html"), label: "Visión" },
    { key: "alertas", href: pageHref("alertas_centro.html"), label: "Alertas" },
    { key: "tareas", href: pageHref("tareas_reposicion.html"), label: "Tareas" }
  ];

  const links = cfg.zone === "public" ? publicLinks : internalLinks;

  function renderNavLinks(items, activeKey) {
    return items
      .map((item) => {
        const active = item.key === activeKey;
        return `
          <a
            class="ea-nav__link${active ? " is-active" : ""}"
            href="${item.href}"
            ${active ? 'aria-current="page"' : ""}
          >
            ${item.label}
          </a>
        `;
      })
      .join("");
  }

  function renderRightSide() {
    if (cfg.zone === "internal") {
      return `
        <div class="ea-user" id="ea-user-chip">Validando sesión...</div>
        <a class="ea-btn ea-btn--ghost" href="${pageHref("perfil.html")}">Mi perfil</a>
        <button class="ea-btn ea-btn--danger" type="button" id="ea-logout-btn">
          <span class="ea-btn__icon" aria-hidden="true"></span>
          <span>Salir</span>
        </button>
      `;
    }

    if (page === "login.html") {
      return `<a class="ea-btn ea-btn--ghost" href="${pageHref("registro.html")}">Crear cuenta</a>`;
    }

    if (page === "registro.html") {
      return `<a class="ea-btn ea-btn--ghost" href="${pageHref("login.html")}">Acceder</a>`;
    }

    if (page === "recuperar_password.html") {
      return `<a class="ea-btn ea-btn--ghost" href="${pageHref("login.html")}">Volver al acceso</a>`;
    }

    return `<a class="ea-btn ea-btn--ghost" href="${pageHref("login.html")}">Acceso</a>`;
  }

  const html = `
    <header class="ea-header">
      <div class="ea-header__inner">
        <div class="ea-header__left">
          <a class="ea-brand" href="${getBrandHref()}">
            <img src="${getIconSrc()}" alt="EstanterIA" class="ea-brand__icon" />
            <span class="ea-brand__text">Estanter<span class="ea-brand__accent">IA</span></span>
          </a>

          <nav class="ea-nav" aria-label="Principal">
            ${renderNavLinks(links, cfg.active)}
          </nav>
        </div>

        <div class="ea-header__right">
          ${renderRightSide()}
        </div>
      </div>
    </header>
  `;

  const target = document.querySelector("[data-app-header]") || document.querySelector("header");
  if (target) {
    target.outerHTML = html;
  } else {
    document.body.insertAdjacentHTML("afterbegin", html);
  }

  async function hydrateInternalHeader() {
    if (cfg.zone !== "internal") return;

    const token = getStoredToken();
    if (!token) {
      clearAuthStorage();
      redirectToLogin("session-expired");
      return;
    }

    const userChip = document.getElementById("ea-user-chip");
    const logoutBtn = document.getElementById("ea-logout-btn");

    if (userChip) {
      userChip.textContent = buildUserChipText({});
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        logoutBtn.disabled = true;

        try {
          await authFetch("/api/auth/logout", {
            method: "POST"
          });
        } catch (_) {
          // La sesión local se limpia igualmente.
        } finally {
          clearAuthStorage();
          redirectToLogin();
        }
      });
    }

    try {
      const response = await authFetch("/api/auth/me", {
        method: "GET"
      });

      if (!response.ok) {
        clearAuthStorage();
        redirectToLogin("session-expired");
        return;
      }

      const data = await response.json();
      saveSessionSnapshot(data);

      if (userChip) {
        userChip.textContent = buildUserChipText(data);
      }
    } catch (_) {
      clearAuthStorage();
      redirectToLogin("session-expired");
    }
  }

  hydrateInternalHeader();
})();