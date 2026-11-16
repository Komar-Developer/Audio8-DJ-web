(function () {
  var c = window.A8DJ || {};
  var root = document.documentElement;
  var gh = location.hostname.match(/^([^.]+)\.github\.io$/);
  if ((!c.repo || c.repo.indexOf("TU_USUARIO") === 0) && gh) c.repo = gh[1] + "/" + (location.pathname.split("/")[1] || gh[1] + ".github.io");
  var releases = "https://github.com/" + c.repo + "/releases";
  if (c.shop === false) document.querySelectorAll('a[href="comprar.html"]').forEach(function (a) {
    var p = a.closest("p"); (p && !p.closest("nav") ? p : a).hidden = true;
  });
  var T = {
    es: { other: "EN", label: "Switch to English", loading: "Buscando la última versión…", version: "Versión", missing: "Aún no hay ninguna versión publicada. Abre la página de versiones de GitHub.", locale: "es-ES" },
    en: { other: "ES", label: "Cambiar a español", loading: "Looking for the latest version…", version: "Version", missing: "No version has been published yet. Open the GitHub releases page.", locale: "en-GB" }
  };
  var release = null, failed = false;

  document.querySelectorAll("[data-owner]").forEach(function (e) { e.textContent = c.owner; });
  document.querySelectorAll("[data-updated]").forEach(function (e) { e.textContent = c.updated; });
  document.querySelectorAll("[data-email]").forEach(function (e) { e.textContent = c.email; e.href = "mailto:" + c.email; });
  document.querySelectorAll("[data-releases]").forEach(function (e) { e.href = releases; });
  document.querySelectorAll("[data-year]").forEach(function (e) { e.textContent = new Date().getFullYear(); });

  var btn = document.getElementById("download-btn");
  var meta = document.getElementById("download-meta");
  var toggle = document.getElementById("lang-toggle");

  function renderMeta() {
    if (!meta) return;
    var t = T[root.lang];
    if (failed) { meta.textContent = t.missing; meta.dataset.state = "missing"; return; }
    if (!release) { meta.textContent = t.loading; return; }
    var mb = (release.dmg.size / 1048576).toFixed(1);
    if (root.lang === "es") mb = mb.replace(".", ",");
    var date = new Date(release.published_at).toLocaleDateString(t.locale, { day: "numeric", month: "long", year: "numeric" });
    meta.textContent = t.version + " " + (release.tag_name || "").replace(/^v/, "") + " · " + mb + " MB · " + date;
    meta.dataset.state = "ok";
  }

  function apply(lang) {
    root.lang = lang;
    var title = document.querySelector("title");
    if (title && title.dataset[lang]) title.textContent = title.dataset[lang];
    if (toggle) { toggle.textContent = T[lang].other; toggle.setAttribute("aria-label", T[lang].label); }
    renderMeta();
  }

  if (toggle) toggle.addEventListener("click", function () {
    var next = root.lang === "es" ? "en" : "es";
    try { localStorage.setItem("a8dj-lang", next); } catch (e) {}
    apply(next);
  });
  apply(root.lang === "en" ? "en" : "es");

  if (!btn) return;
  btn.href = releases + "/latest";
  fetch("https://api.github.com/repos/" + c.repo + "/releases/latest", { headers: { Accept: "application/vnd.github+json" } })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (rel) {
      var dmg = (rel.assets || []).filter(function (a) { return /\.dmg$/i.test(a.name); })[0];
      if (!dmg) throw new Error("no dmg");
      btn.href = dmg.browser_download_url;
      rel.dmg = dmg; release = rel; renderMeta();
    })
    .catch(function () { failed = true; renderMeta(); });
})();
