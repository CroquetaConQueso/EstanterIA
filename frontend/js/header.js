(() => {
  const path = window.location.pathname.replace(/\\/g, "/");
  const page = path.split("/").pop() || "index.html";
  const inHtmlDir = /\/html\/[^/]+$/.test(path);

  const configs = {
    "index.html": { zone: "public", active: "inicio" },
    "about.html": { zone: "public", active: "about" },
    "descargas.html": { zone: "public", active: "descargas", right: "download-note" },
    "login.html": { zone: "public", active: "acceso" },
    "registro.html": { zone: "public", active: "registro", right: "registro-links" },

    "home.html": { zone: "internal", active: "inicio" },
    "planos.html": { zone: "internal", active: "planos" },
    "editor.html": { zone: "internal", active: "planos" },
    "editar.html": { zone: "internal", active: "planos" },
    "inspecciones.html": { zone: "internal", active: "inspecciones" },
    "inspeccion_nueva.html": { zone: "internal", active: "inspecciones" },
    "inventario.html": { zone: "internal", active: "inventario" },
    "alertas_centro.html": { zone: "internal", active: "alertas" },
    "tareas_reposicion.html": { zone: "internal", active: "tareas" },
    "vision.html": { zone: "internal", active: "vision" },
    "perfil.html": { zone: "internal", active: "perfil" }
  };

  const cfg = configs[page];
  if (!cfg) return;

  const publicLinks = inHtmlDir
    ? [
        { key: "inicio", href: "../index.html", label: "Inicio" },
        { key: "descargas", href: "descargas.html", label: "Descargas" },
        { key: "acceso", href: "login.html", label: "Acceso" },
        { key: "registro", href: "registro.html", label: "Crear cuenta" },
        { key: "about", href: "about.html", label: "Acerca de" }
      ]
    : [
        { key: "inicio", href: "index.html", label: "Inicio" },
        { key: "descargas", href: "html/descargas.html", label: "Descargas" },
        { key: "acceso", href: "html/login.html", label: "Acceso" },
        { key: "registro", href: "html/registro.html", label: "Crear cuenta" },
        { key: "about", href: "html/about.html", label: "Acerca de" }
      ];

  const internalLinks = [
    { key: "inicio", href: "home.html", label: "Inicio" },
    { key: "planos", href: "planos.html", label: "Planos" },
    { key: "inspecciones", href: "inspecciones.html", label: "Inspecciones" },
    { key: "inventario", href: "inventario.html", label: "Inventario" },
    { key: "alertas", href: "alertas_centro.html", label: "Alertas" },
    { key: "tareas", href: "tareas_reposicion.html", label: "Tareas" },
    { key: "vision", href: "vision.html", label: "Visión" }
  ];

  const links = cfg.zone === "public" ? publicLinks : internalLinks;
  const brandHref = inHtmlDir ? "../index.html" : "index.html";
  const iconSrc = inHtmlDir ? "../img/iconoFAV.png" : "img/iconoFAV.png";
  const headerClass = page === "registro.html" ? "topbar home-topbar" : "topbar";
  const rightClass = page === "registro.html" ? "right home-right" : "right";

  const navHtml = links
    .map((item) => {
      const active = item.key === cfg.active;
      const activeClass = active ? " is-active" : "";
      const current = active ? ' aria-current="page"' : "";
      return `<a class="nav-link${activeClass}"${current} href="${item.href}">${item.label}</a>`;
    })
    .join("");

  let rightHtml = "";
  if (cfg.zone === "internal") {
    const active = cfg.active === "perfil";
    const activeClass = active ? " is-active" : "";
    const current = active ? ' aria-current="page"' : "";
    rightHtml = `<a class="user${activeClass}"${current} href="perfil.html">Mi Perfil</a>`;
  } else if (cfg.right === "download-note") {
    rightHtml = '<span class="top-note">Prototipo - descargas simuladas</span>';
  } else if (cfg.right === "registro-links") {
    rightHtml =
      '<a class="home-link" href="login.html">Acceder</a>' +
      '<a class="home-link is-active" href="registro.html">Registrarse</a>';
  }

  const html =
    `<header class="${headerClass}">` +
    '<div class="inner">' +
    '<div class="left">' +
    `<a class="brand" href="${brandHref}">` +
    `<img src="${iconSrc}" alt="Suite Tienda" class="brand-icon" />` +
    '<span class="brand-text">Suite<span class="brand-accent">Tienda</span></span>' +
    "</a>" +
    `<nav class="nav" aria-label="Principal">${navHtml}</nav>` +
    "</div>" +
    `<div class="${rightClass}">${rightHtml}</div>` +
    "</div>" +
    "</header>";

  const target = document.querySelector("[data-app-header]") || document.querySelector("header");
  if (target) {
    target.outerHTML = html;
  }
})();
