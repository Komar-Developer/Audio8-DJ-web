(function () {
  var c = window.A8DJ || {};
  var root = document.documentElement;
  var gh = location.hostname.match(/^([^.]+)\.github\.io$/);
  if ((!c.repo || c.repo.indexOf("TU_USUARIO") === 0) && gh) c.repo = gh[1] + "/" + (location.pathname.split("/")[1] || gh[1] + ".github.io");
  var releases = "https://github.com/" + c.repo + "/releases";
  if (c.bizum) {
    document.querySelectorAll("[data-bizum-es]").forEach(function (e) { e.textContent = "Al móvil " + c.bizum + "."; });
    document.querySelectorAll("[data-bizum-en]").forEach(function (e) { e.textContent = "To the mobile number " + c.bizum + "."; });
  }
  var T = {
    es: { other: "EN", label: "Switch to English", loading: "Buscando la última versión…", version: "Versión", missing: "Aún no hay ninguna versión publicada. Abre la página de versiones de GitHub.", locale: "es-ES" },
    en: { other: "ES", label: "Cambiar a español", loading: "Looking for the latest version…", version: "Version", missing: "No version has been published yet. Open the GitHub releases page.", locale: "en-GB" }
  };
  var release = null, failed = false;

  document.querySelectorAll("[data-owner]").forEach(function (e) { e.textContent = c.owner; });
  document.querySelectorAll("[data-updated]").forEach(function (e) { e.textContent = c.updated; });
  document.querySelectorAll("[data-email]").forEach(function (e) { e.textContent = c.email; e.href = "mailto:" + c.email; });
  var N = {
    es: { s: "Avísame: Audio 8 DJ para Apple Silicon", b: "Hola,\n\nAvísame cuando esté lista la versión de Audio 8 DJ para Macs con Apple Silicon.\n\nMi Mac (modelo y chip, p. ej. MacBook Air M2): \nVersión de macOS: \nSoftware de DJ: \n\nGracias." },
    en: { s: "Notify me: Audio 8 DJ for Apple Silicon", b: "Hi,\n\nPlease let me know when the Audio 8 DJ version for Apple Silicon Macs is ready.\n\nMy Mac (model and chip, e.g. MacBook Air M2): \nmacOS version: \nDJ software: \n\nThanks." },
    "key-es": { s: "Key de tester: Audio 8 DJ para Apple Silicon", b: "Hola,\n\nQuiero probar Audio 8 DJ en mi Mac con chip Apple.\n\nUsuario: \nNº de dispositivo (Control Center > Activation…): \nMi Mac (modelo y chip): \nVersión de macOS: \nSoftware de DJ: \n\nGracias." },
    "key-en": { s: "Tester Key: Audio 8 DJ for Apple Silicon", b: "Hi,\n\nI'd like to test Audio 8 DJ on my Apple chip Mac.\n\nUser: \nDevice number (Control Center > Activation…): \nMy Mac (model and chip): \nmacOS version: \nDJ software: \n\nThanks." }
  };
  document.querySelectorAll("[data-notify]").forEach(function (e) {
    var n = N[e.getAttribute("data-notify")];
    e.href = "mailto:" + c.email + "?subject=" + encodeURIComponent(n.s) + "&body=" + encodeURIComponent(n.b);
  });
  document.querySelectorAll("[data-releases]").forEach(function (e) { e.href = releases; });
  document.querySelectorAll("[data-year]").forEach(function (e) { e.textContent = new Date().getFullYear(); });

  if (c.appleSilicon) root.classList.add("as-ok");
  var M = {
    es: {
      intel: "Tu Mac parece <b>Intel</b>: en el DMG abre <b>Audio 8 DJ for Intel</b>.",
      "arm-ok": "Tu Mac parece tener <b>chip de Apple (M)</b>: en el DMG abre <b>Audio 8 DJ for Apple Silicon</b>.",
      "arm-soon": "Tu Mac parece tener <b>chip de Apple (M)</b>. Su versión aún no está disponible: pulsa <b>Lo quiero en mi Mac M</b> o <b>Avísame</b>.",
      "unknown-soon": "Este DMG es para Macs <b>Intel</b>: mira  &gt; Acerca de este Mac. Con <b>Procesador Intel</b> abre <b>Audio 8 DJ for Intel</b>; con <b>Chip Apple M…</b>, pulsa <b>Lo quiero en mi Mac M</b>.",
      unknown: "En el DMG hay dos instaladores. Mira  &gt; Acerca de este Mac: con <b>Procesador Intel</b> abre <b>Audio 8 DJ for Intel</b>; con <b>Chip Apple M…</b>, <b>Audio 8 DJ for Apple Silicon</b>.",
      other: "Este driver es para Mac: descárgalo desde tu Mac.",
      check: " Compruébalo en  &gt; Acerca de este Mac."
    },
    en: {
      intel: "Your Mac looks like an <b>Intel</b> Mac: in the DMG, open <b>Audio 8 DJ for Intel</b>.",
      "arm-ok": "Your Mac looks like it has an <b>Apple (M) chip</b>: in the DMG, open <b>Audio 8 DJ for Apple Silicon</b>.",
      "arm-soon": "Your Mac looks like it has an <b>Apple (M) chip</b>. Its version isn't available yet: click <b>I want it on my M Mac</b> or <b>Notify me</b>.",
      "unknown-soon": "This DMG is for <b>Intel</b> Macs: check  &gt; About This Mac. With an <b>Intel processor</b>, open <b>Audio 8 DJ for Intel</b>; with an <b>Apple M… chip</b>, click <b>I want it on my M Mac</b>.",
      unknown: "There are two installers in the DMG. Check  &gt; About This Mac: with an <b>Intel processor</b>, open <b>Audio 8 DJ for Intel</b>; with an <b>Apple M… chip</b>, <b>Audio 8 DJ for Apple Silicon</b>.",
      other: "This driver is for Mac: download it from your Mac.",
      check: " Check it in  &gt; About This Mac."
    }
  };
  var mac = null;
  var macBox = document.getElementById("mac-detect");
  function renderMac() {
    if (!macBox || !mac) return;
    var kind = mac === "arm" ? (c.appleSilicon ? "arm-ok" : "arm-soon") : mac === "unknown" && !c.appleSilicon ? "unknown-soon" : mac;
    var t = M[root.lang];
    macBox.innerHTML = t[kind] + (kind === "intel" || kind.indexOf("arm") === 0 ? t.check : "");
    macBox.dataset.kind = kind;
  }
  function glArch() {
    try {
      var g = document.createElement("canvas").getContext("webgl");
      var ext = g && g.getExtension("WEBGL_debug_renderer_info");
      var r = g ? String(ext ? g.getParameter(ext.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER)) : "";
      if (/Apple M\d/i.test(r)) return "arm";
      if (/Intel|AMD|Radeon|NVIDIA|GeForce/i.test(r)) return "intel";
    } catch (e) {}
    return "unknown";
  }
  function setMac(k) { mac = k; renderMac(); }
  if (macBox) {
    var ua = navigator.userAgent || "";
    if (!/Macintosh|Mac OS X/.test(ua) || /iPhone|iPad|iPod/.test(ua) || navigator.maxTouchPoints > 1) setMac("other");
    else if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
      navigator.userAgentData.getHighEntropyValues(["architecture"])
        .then(function (v) { setMac(v.architecture === "arm" ? "arm" : v.architecture === "x86" ? "intel" : glArch()); })
        .catch(function () { setMac(glArch()); });
    } else setMac(glArch());
  }

  var G = {
    request: { title: "[Solicitud Apple Silicon] ", body: "Quiero Audio 8 DJ en mi Mac con chip Apple / I want Audio 8 DJ on my Apple chip Mac.\n\nMac (modelo y chip / model and chip): \nmacOS: \nSoftware de DJ / DJ software: \n" },
    tester: { title: "[Tester Apple Silicon] ", body: "Resultado en Mac con chip Apple / Result on an Apple chip Mac.\n\nMac (modelo y chip / model and chip): \nmacOS: \nVersión / Version: \nSoftware de DJ / DJ software: \nFrecuencias probadas / Sample rates tested: \n¿Suena bien? / Does it sound right?: \n" }
  };
  var ghRepo = "https://github.com/" + c.repo;
  document.querySelectorAll("[data-gh-issues]").forEach(function (e) { e.href = ghRepo + "/issues"; });
  document.querySelectorAll("[data-gh-issue]").forEach(function (e) {
    var g = G[e.getAttribute("data-gh-issue")];
    e.href = ghRepo + "/issues/new?template=" + e.getAttribute("data-gh-issue") + ".yml&title=" + encodeURIComponent(g.title);
  });
  document.querySelectorAll("[data-gh-count]").forEach(function (e) {
    var g = G[e.getAttribute("data-gh-count")];
    var q = "repo:" + c.repo + " is:issue in:title \"" + g.title.replace(/[\[\]]/g, "").trim() + "\"";
    fetch("https://api.github.com/search/issues?per_page=1&q=" + encodeURIComponent(q), { headers: { Accept: "application/vnd.github+json" } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { e.textContent = String(d.total_count); e.dataset.state = "ok"; })
      .catch(function () { e.textContent = ""; });
  });

  var tested = document.querySelectorAll("[data-tested]");
  if (tested.length) {
    var tq = "repo:" + c.repo + " is:issue in:title \"Tester Apple Silicon\"";
    var field = function (body, label) {
      var m = (body || "").split("### " + label)[1];
      if (!m) return "";
      var v = m.split("###")[0].replace(/_No response_/g, "").split("\n").slice(1).join("\n").trim();
      return v.split("\n")[0].trim();
    };
    var fill = function (items, failed) {
      tested.forEach(function (ul) {
        var es = ul.closest("[data-l]").getAttribute("data-l") === "es";
        ul.textContent = "";
        if (failed || !items.length) {
          var li = document.createElement("li");
          li.className = "meta";
          li.textContent = failed ? (es ? "No se han podido cargar los informes. Míralos en GitHub." : "Couldn't load the reports. See them on GitHub.")
            : (es ? "Todavía no hay informes. ¡El tuyo puede ser el primero!" : "No reports yet. Yours could be the first!");
          ul.appendChild(li);
          return;
        }
        items.forEach(function (it) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          a.href = it.url; a.target = "_blank"; a.rel = "noopener";
          a.textContent = it.mac;
          var b = document.createElement("b");
          b.className = "res " + it.state;
          b.textContent = it.state === "ok" ? (es ? "Funciona" : "Works") : it.state === "bad" ? (es ? "Con problemas" : "Has issues") : (es ? "En revisión" : "Under review");
          var sm = document.createElement("span");
          sm.className = "meta";
          sm.textContent = [it.macos && "macOS " + it.macos, it.result].filter(Boolean).join(" · ");
          li.appendChild(b); li.appendChild(a); li.appendChild(sm);
          ul.appendChild(li);
        });
      });
    };
    fetch("https://api.github.com/search/issues?per_page=50&sort=created&q=" + encodeURIComponent(tq), { headers: { Accept: "application/vnd.github+json" } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        fill((d.items || []).map(function (i) {
          var mac = field(i.body, "Mac (modelo y chip)") || i.title.replace(/\[[^\]]*\]/, "").split("·")[0].trim() || "Mac";
          var res = field(i.body, "Resultado por frecuencia");
          var low = res.toLowerCase();
          var state = /:fail\b|input:mono|\b(falla|mal|bad|ko|cortes?|dropouts?)\b/.test(low) ? "bad" : (/:ok\b/.test(low) ? "ok" : "wait");
          return { mac: mac, macos: field(i.body, "macOS"), result: res, state: state, url: i.html_url };
        }), false);
      })
      .catch(function () { fill([], true); });
  }

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
    renderMac();
  }

  if (toggle) toggle.addEventListener("click", function () {
    var next = root.lang === "es" ? "en" : "es";
    try { localStorage.setItem("a8dj-lang", next); } catch (e) {}
    apply(next);
  });
  apply(root.lang === "en" ? "en" : "es");

  var beta = document.getElementById("beta-btn");
  var betaMeta = document.getElementById("beta-meta");
  if (beta) {
    var BT = {
      es: { none: "La beta aún no está publicada. Pulsa Avísame o vuelve pronto.", fail: "No se pudo consultar GitHub. Abre la lista de versiones.", v: "Versión" },
      en: { none: "The beta isn't published yet. Click Notify me or check back soon.", fail: "Couldn't reach GitHub. Open the releases list.", v: "Version" }
    };
    var betaState = "loading", betaRel = null;
    var renderBeta = function () {
      var t = BT[root.lang === "en" ? "en" : "es"];
      if (betaState === "ok") {
        var mb = (betaRel.dmg.size / 1048576).toFixed(1);
        betaMeta.textContent = t.v + " " + (betaRel.tag_name || "").replace(/^v/, "") + " · " + (root.lang === "es" ? mb.replace(".", ",") : mb) + " MB";
      } else if (betaState !== "loading") betaMeta.textContent = t[betaState];
      betaMeta.dataset.state = betaState;
      document.querySelectorAll("[data-beta-meta-mirror]").forEach(function (e) { e.textContent = betaMeta.textContent; e.dataset.state = betaState; });
      document.querySelectorAll("[data-beta-mirror]").forEach(function (e) { e.href = beta.href; });
    };
    beta.href = releases;
    renderBeta();
    if (toggle) toggle.addEventListener("click", renderBeta);
    fetch("https://api.github.com/repos/" + c.repo + (c.appleSilicon ? "/releases/latest" : "/releases?per_page=20"), { headers: { Accept: "application/vnd.github+json" } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        var list = Array.isArray(d) ? d.filter(function (x) { return x.prerelease && !x.draft; }) : [d];
        for (var i = 0; i < list.length; i++) {
          var dmg = (list[i].assets || []).filter(function (a) { return /\.dmg$/i.test(a.name); })[0];
          if (dmg) { list[i].dmg = dmg; betaRel = list[i]; beta.href = dmg.browser_download_url; betaState = "ok"; renderBeta(); return; }
          if (i === list.length - 1) beta.href = releases;
        }
        betaState = "none"; renderBeta();
      })
      .catch(function () { betaState = "fail"; renderBeta(); });
  }

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
