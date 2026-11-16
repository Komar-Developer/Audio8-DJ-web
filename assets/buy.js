(function () {
  var c = window.A8DJ || {};
  var form = document.getElementById("buy-form");
  if (!form) return;
  if (c.shop === false) {
    form.hidden = true;
    var soon = document.createElement("p");
    soon.className = "buy-status"; soon.setAttribute("data-testid", "buy-soon");
    soon.innerHTML = '<span data-l="es">La venta de licencias abrirá muy pronto. Mientras tanto, escríbenos desde <a href="soporte.html">Soporte</a>.</span>' +
      '<span data-l="en">License sales open very soon. Meanwhile, contact us via <a href="soporte.html">Support</a>.</span>';
    form.parentNode.insertBefore(soon, form);
    return;
  }
  var root = document.documentElement;
  var box = document.getElementById("buy-result");
  var msg = document.getElementById("buy-msg");
  var price = document.querySelectorAll("[data-price]");
  var STORE = "a8dj-order";
  var T = {
    es: { closed: "Las ventas están cerradas en este momento. Vuelve a intentarlo más tarde.", error: "No se ha podido crear el pedido. Revisa los datos e inténtalo de nuevo.",
          terms: "Debes aceptar los términos.", many: "Ya tienes pedidos pendientes. Paga el anterior o espera a que lo revisemos.", sending: "Enviando…",
          pending: "Pendiente de pago: en cuanto recibamos tu Bizum te enviaremos la clave por correo.", paid: "Pago recibido. Te hemos enviado la clave por correo; revisa también la carpeta de spam.",
          cancelled: "Este pedido se ha cancelado. Si crees que es un error, escríbenos desde Soporte.",
          cOk: function (p, v) { return "Cupón aplicado: -" + p + " %. Pagarás " + v + "."; }, cBad: { unknown: "Ese cupón no existe.", expired: "Ese cupón ha caducado.", used_up: "Ese cupón ya se ha agotado.", inactive: "Ese cupón no está activo." },
          paidNoMail: "Pago recibido. Estamos enviándote la clave; si no te llega en unas horas, escríbenos desde Soporte indicando tu concepto.",
          busy: "Ahora mismo hay muchos pedidos. Inténtalo de nuevo dentro de un rato.", checked: "Estado actualizado.", offline: "No se ha podido comprobar el estado. Inténtalo de nuevo.", eur: function (v) { return String(v).replace(".", ",") + " €"; } },
    en: { closed: "Sales are closed right now. Please try again later.", error: "The order couldn't be created. Check your details and try again.",
          terms: "You must accept the terms.", many: "You already have pending orders. Pay the previous one or wait for us to review it.", sending: "Sending…",
          pending: "Awaiting payment: as soon as we receive your Bizum we'll email you the key.", paid: "Payment received. We've emailed you the key; check your spam folder too.",
          cancelled: "This order was cancelled. If you think this is a mistake, contact us via Support.",
          cOk: function (p, v) { return "Coupon applied: -" + p + "%. You'll pay " + v + "."; }, cBad: { unknown: "That coupon doesn't exist.", expired: "That coupon has expired.", used_up: "That coupon has been used up.", inactive: "That coupon isn't active." },
          paidNoMail: "Payment received. We're sending you the key; if it hasn't arrived within a few hours, contact us via Support with your reference.",
          busy: "There are a lot of orders right now. Please try again in a while.", checked: "Status updated.", offline: "The status couldn't be checked. Please try again.", eur: function (v) { return "€" + v; } }
  };
  var t = function () { return T[root.lang === "en" ? "en" : "es"]; };
  var info = null, order = null;

  function show(o) {
    order = o;
    form.hidden = true; box.hidden = false;
    document.getElementById("buy-amount").textContent = t().eur(o.amount);
    document.getElementById("buy-phone").textContent = o.bizum_phone;
    document.getElementById("buy-ref").textContent = o.ref;
    var st = document.getElementById("buy-status");
    st.textContent = (o.status === "paid" && o.email_sent === false ? t().paidNoMail : t()[o.status]) || o.status;
    st.dataset.state = o.status;
    var rc = document.getElementById("buy-receipt");
    rc.hidden = o.status !== "paid";
    rc.href = c.api + "/shop/orders/" + o.id + "/receipt.pdf?token=" + encodeURIComponent(o.token);
  }
  function refreshPrice() { price.forEach(function (e) { if (info) e.textContent = t().eur(info.price_eur); }); if (order) show(order); }
  document.getElementById("lang-toggle").addEventListener("click", function () { setTimeout(refreshPrice, 0); });

  fetch(c.api + "/shop").then(function (r) { return r.json(); }).then(function (d) {
    info = d; refreshPrice();
    document.querySelectorAll("[data-devices]").forEach(function (e) { e.textContent = d.max_devices; });
    if (!d.open) { msg.textContent = t().closed; form.querySelector("button").disabled = true; }
  }).catch(function () { msg.textContent = t().closed; });

  var saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORE) || "null"); } catch (e) {}
  function check(manual) {
    if (!saved) return;
    var note = document.getElementById("buy-checked");
    fetch(c.api + "/shop/orders/" + saved.id + "/status?token=" + encodeURIComponent(saved.token))
      .then(function (r) {
        if (r.status === 404) { try { localStorage.removeItem(STORE); } catch (e) {} saved = null; return null; }
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(function (d) { if (d) { show(Object.assign({}, saved, d)); if (manual) note.textContent = t().checked + " " + new Date().toLocaleTimeString(); } })
      .catch(function () { if (saved) show(Object.assign({ status: "pending" }, saved)); if (manual) note.textContent = t().offline; });
  }
  check(false);
  document.getElementById("buy-check").addEventListener("click", function () { check(true); });
  document.getElementById("buy-new").addEventListener("click", function () {
    try { localStorage.removeItem(STORE); } catch (e) {}
    saved = null; order = null; box.hidden = true; form.hidden = false; msg.textContent = "";
  });

  var cmsg = document.getElementById("coupon-msg");
  function applyCoupon() {
    var code = form.elements["coupon"].value.trim();
    cmsg.textContent = ""; cmsg.dataset.state = "";
    if (!code) { refreshPrice(); return; }
    fetch(c.api + "/shop/coupons/" + encodeURIComponent(code) + "/check")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.ok) { cmsg.textContent = t().cOk(d.percent, t().eur(d.price)); cmsg.dataset.state = "ok"; price.forEach(function (e) { e.textContent = t().eur(d.price); }); }
        else { cmsg.textContent = t().cBad[d.reason] || t().error; refreshPrice(); }
      })
      .catch(function () { cmsg.textContent = t().error; });
  }
  document.getElementById("coupon-apply").addEventListener("click", applyCoupon);

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!form.elements["accept"].checked) { msg.textContent = t().terms; return; }
    var btn = form.querySelector("button"); btn.disabled = true; msg.textContent = t().sending;
    fetch(c.api + "/shop/orders", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.elements["name"].value.trim(), email: form.elements["email"].value.trim(), lang: root.lang === "en" ? "en" : "es", accept: true, coupon: form.elements["coupon"].value.trim() }) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, status: r.status, d: d }; }); })
      .then(function (x) {
        btn.disabled = false;
        if (!x.ok && /^coupon_/.test(x.d.reason || "")) { msg.textContent = t().cBad[x.d.reason.slice(7)] || t().error; return; }
        if (!x.ok) { msg.textContent = x.d.reason === "closed" ? t().closed : x.d.reason === "too_many_pending" ? t().many : x.d.reason === "rate_limited" ? t().busy : t().error; return; }
        msg.textContent = "";
        saved = { id: x.d.id, token: x.d.token, ref: x.d.ref, amount: x.d.amount, bizum_phone: x.d.bizum_phone };
        try { localStorage.setItem(STORE, JSON.stringify(saved)); } catch (e) {}
        show(Object.assign({}, saved, { status: x.d.status }));
      })
      .catch(function () { btn.disabled = false; msg.textContent = t().error; });
  });
})();
