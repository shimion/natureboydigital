/* Nature Boy Digital — static site behaviour (no dependencies).
   Cart & checkout live in localStorage/sessionStorage.
   100% compatible with GitHub Pages, custom domains, and local preview. */
(function () {
  'use strict';

  var BASE = (document.documentElement.getAttribute('data-base') || '').trim();
  function url(path) {
    if (!path) return '';
    if (/^(https?:|\/\/|data:|blob:)/.test(path)) return path;
    var clean = String(path).replace(/^(\.\.?\/)+/, '').replace(/^\/+/, '');
    if (!BASE || BASE === '.') return './' + clean;
    return BASE.replace(/\/+$/, '') + '/' + clean;
  }

  var CART_KEY = 'nbd_cart_v1';
  var ORDER_KEY = 'nbd_last_order';
  var SHIPPING_FLAT = 0;      // Shipping included in print price
  var PA_TAX_RATE = 0;        // Sales tax included in print price

  var money = function (n) { return '$' + Number(n).toFixed(2); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };

  /* ---------- Storage ---------- */
  function readCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; }
  }
  function writeCart(items) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) {}
    updateCartUI();
  }
  function cartCount(items) { return items.reduce(function (a, i) { return a + i.qty; }, 0); }
  function cartSubtotal(items) { return items.reduce(function (a, i) { return a + i.qty * i.price; }, 0); }

  function updateCartUI() {
    var items = readCart();
    var count = cartCount(items);
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = count; el.setAttribute('data-count', count);
    });
    document.querySelectorAll('.cart-link').forEach(function (el) {
      el.setAttribute('aria-label', 'Cart, ' + count + (count === 1 ? ' item' : ' items'));
    });
    document.querySelectorAll('[data-order-summary]').forEach(function (el) {
      el.textContent = count === 0 ? 'No prints yet' : count + (count === 1 ? ' print' : ' prints') + ' · Subtotal ' + money(cartSubtotal(items));
    });
  }

  /* ---------- Navigation ---------- */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('primary-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!open));
        nav.classList.toggle('is-open', !open);
      });
    }
    var subs = document.querySelectorAll('.sub-toggle');
    subs.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = btn.getAttribute('aria-expanded') === 'true';
        subs.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
        btn.setAttribute('aria-expanded', String(!open));
      });
    });
    document.addEventListener('click', function (e) {
      if (window.matchMedia('(min-width: 1024px)').matches && !e.target.closest('.nav-list')) {
        subs.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var openBtn = document.querySelector('.sub-toggle[aria-expanded="true"]');
      if (openBtn) { openBtn.setAttribute('aria-expanded', 'false'); openBtn.focus(); }
    });
  }

  /* ---------- Size picker ---------- */
  function initPickers() {
    document.querySelectorAll('[data-choose]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        btn.textContent = open ? 'Choose size' : 'Close';
        panel.hidden = open;
        if (!open) { var first = panel.querySelector('input:checked'); if (first) first.focus(); }
      });
    });

    document.querySelectorAll('.picker').forEach(function (picker) {
      var out = picker.querySelector('output');
      var label = picker.querySelector('[data-choice]');
      var note = picker.querySelector('.type-note');
      var msg = picker.querySelector('.added-msg');

      function current() {
        var type = picker.querySelector('input[name$="-type"]:checked').value;
        var size = picker.querySelector('input[name$="-size"]:checked');
        return { type: type, sizeLabel: size.value, price: Number(size.getAttribute('data-' + type)) };
      }
      function refresh() {
        var c = current();
        picker.querySelectorAll('input[name$="-size"]').forEach(function (r) {
          r.closest('label').querySelector('.pr').textContent = money(r.getAttribute('data-' + c.type)).replace('.00', '');
        });
        out.textContent = money(c.price);
        label.textContent = (c.type === 'paper' ? 'Paper print' : 'Metal print') + ' · ' + c.sizeLabel;
        note.textContent = c.type === 'paper' ? note.getAttribute('data-paper') : note.getAttribute('data-metal');
        msg.innerHTML = '';
      }
      picker.addEventListener('change', refresh);
      refresh();

      picker.querySelector('[data-add]').addEventListener('click', function () {
        var c = current();
        var d = picker.dataset;
        var key = d.id + '|' + c.type + '|' + c.sizeLabel;
        var items = readCart();
        var found = items.filter(function (i) { return i.key === key; })[0];
        if (found) { found.qty += 1; }
        else { items.push({ key: key, id: d.id, title: d.title, img: d.img, url: d.url, gallery: d.gallery, type: c.type, size: c.sizeLabel, price: c.price, qty: 1 }); }
        writeCart(items);
        msg.innerHTML = '<span>Added: ' + esc(d.title) + ', ' + (c.type === 'paper' ? 'Paper' : 'Metal') + ' ' + esc(c.sizeLabel) + '.</span><a href="' + esc(url('cart/')) + '">View cart</a>';
      });
    });
  }

  /* ---------- Lightbox ---------- */
  function initLightbox() {
    var dlg = document.getElementById('lightbox');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    var img = dlg.querySelector('img');
    var title = dlg.querySelector('figcaption b');
    var text = dlg.querySelector('figcaption span');
    var lastBtn = null;
    document.querySelectorAll('[data-zoom]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        lastBtn = btn;
        img.src = btn.getAttribute('data-zoom');
        img.alt = btn.querySelector('img').alt;
        title.textContent = btn.getAttribute('data-title');
        text.textContent = btn.getAttribute('data-desc') || '';
        dlg.showModal();
      });
    });
    dlg.querySelector('.lightbox-close').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.tagName === 'FIGURE') dlg.close(); });
    dlg.addEventListener('close', function () { img.removeAttribute('src'); if (lastBtn) lastBtn.focus(); });
  }

  /* ---------- Cart page ---------- */
  function renderCart() {
    var root = document.querySelector('[data-cart]');
    if (!root) return;
    var items = readCart();
    var list = root.querySelector('[data-cart-items]');
    var sum = root.querySelector('[data-cart-summary]');
    var empty = root.querySelector('[data-cart-empty]');
    var layout = root.querySelector('.cart-layout');
    if (!items.length) {
      if (layout) layout.hidden = true;
      if (empty) {
        empty.hidden = false;
        var browseBtn = empty.querySelector('a');
        if (browseBtn) browseBtn.href = url('photographs/');
      }
      return;
    }
    if (layout) layout.hidden = false;
    if (empty) empty.hidden = true;

    list.innerHTML = items.map(function (i, idx) {
      var itemUrl = url(i.url);
      var itemImg = url(i.img);
      return '<li class="cart-item">' +
        '<a href="' + esc(itemUrl) + '" tabindex="-1" aria-hidden="true"><img src="' + esc(itemImg) + '" alt="" width="300" height="200" loading="lazy"></a>' +
        '<div><h2><a href="' + esc(itemUrl) + '">' + esc(i.title) + '</a></h2>' +
        '<p>' + (i.type === 'paper' ? 'Paper print · ' + esc(i.size) + ' · Moab Lasal matte' : 'Metal print · ' + esc(i.size)) + '</p>' +
        '<p>' + money(i.price) + ' each</p></div>' +
        '<div class="controls">' +
          '<div class="qty" role="group" aria-label="Quantity for ' + esc(i.title) + '">' +
            '<button type="button" data-dec="' + idx + '" aria-label="Decrease quantity">−</button>' +
            '<output aria-live="polite">' + i.qty + '</output>' +
            '<button type="button" data-inc="' + idx + '" aria-label="Increase quantity">+</button>' +
          '</div>' +
          '<span class="line-total">' + money(i.price * i.qty) + '</span>' +
          '<button type="button" class="link-btn" data-remove="' + idx + '">Remove<span class="sr-only"> ' + esc(i.title) + '</span></button>' +
        '</div></li>';
    }).join('');

    var count = cartCount(items), sub = cartSubtotal(items);
    sum.querySelector('[data-sub-label]').textContent = 'Subtotal (' + count + (count === 1 ? ' print)' : ' prints)');
    sum.querySelector('[data-sub]').textContent = money(sub);
    sum.querySelector('[data-total]').textContent = money(sub);
  }
  function initCart() {
    var root = document.querySelector('[data-cart]');
    if (!root) return;
    renderCart();
    root.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      var items = readCart(), i;
      if (t.hasAttribute('data-inc')) { i = +t.getAttribute('data-inc'); items[i].qty += 1; }
      else if (t.hasAttribute('data-dec')) { i = +t.getAttribute('data-dec'); items[i].qty = Math.max(1, items[i].qty - 1); }
      else if (t.hasAttribute('data-remove')) { i = +t.getAttribute('data-remove'); items.splice(i, 1); }
      else return;
      writeCart(items); renderCart();
      var status = document.getElementById('cart-status');
      if (status) status.textContent = 'Cart updated.';
    });
  }

  /* ---------- Checkout ---------- */
  function initCheckout() {
    var form = document.querySelector('[data-checkout]');
    if (!form) return;
    var items = readCart();
    if (!items.length) { window.location.href = url('cart/'); return; }
    var list = document.querySelector('[data-mini-items]');
    list.innerHTML = items.map(function (i) {
      return '<li><img src="' + esc(url(i.img)) + '" alt="" width="128" height="85" loading="lazy">' +
        '<span>' + esc(i.title) + '<small>' + (i.type === 'paper' ? 'Paper' : 'Metal') + ' · ' + esc(i.size) + ' · Qty ' + i.qty + '</small></span>' +
        '<span>' + money(i.price * i.qty) + '</span></li>';
    }).join('');

    var state = form.querySelector('#state');
    function totals() {
      var sub = cartSubtotal(items);
      var ship = 0;
      var tax = 0;
      document.querySelector('[data-co-sub]').textContent = money(sub);
      document.querySelector('[data-co-ship]').textContent = 'Free (included)';
      document.querySelector('[data-co-tax]').textContent = 'Included in price';
      document.querySelector('[data-co-total]').textContent = money(sub);
      return { sub: sub, ship: ship, tax: tax, total: sub };
    }
    state.addEventListener('change', totals);
    totals();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      form.querySelectorAll('[required]').forEach(function (f) {
        var err = document.getElementById(f.id + '-err');
        var bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
        f.setAttribute('aria-invalid', String(bad));
        if (err) err.hidden = !bad;
        if (bad && !firstBad) firstBad = f;
      });
      if (firstBad) {
        var box = document.getElementById('form-errors');
        box.hidden = false; box.focus();
        return;
      }
      var t = totals();
      var order = { number: 'NBD-' + String(Date.now()).slice(-5), date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        email: form.email.value, name: form.first.value + ' ' + form.last.value, items: items, totals: t };
      try { sessionStorage.setItem(ORDER_KEY, JSON.stringify(order)); } catch (err) {}
      writeCart([]);
      window.location.href = url('checkout/order-received/');
    });
  }

  /* ---------- Order received ---------- */
  function initReceived() {
    var root = document.querySelector('[data-received]');
    if (!root) return;
    var order = null;
    try { order = JSON.parse(sessionStorage.getItem(ORDER_KEY)); } catch (e) {}
    if (!order) return;
    root.querySelector('[data-o-num]').textContent = order.number;
    root.querySelector('[data-o-date]').textContent = order.date;
    root.querySelector('[data-o-email]').textContent = order.email;
    root.querySelector('[data-o-total]').textContent = money(order.totals.total);
    root.querySelector('[data-o-items]').innerHTML = order.items.map(function (i) {
      return '<tr><th scope="row">' + esc(i.title) + '</th><td>' + (i.type === 'paper' ? 'Paper' : 'Metal') + ' · ' + esc(i.size) + '</td><td class="num">' + i.qty + '</td><td class="num">' + money(i.price * i.qty) + '</td></tr>';
    }).join('') +
      '<tr><th scope="row" colspan="3">Shipping</th><td class="num">Free (included)</td></tr>' +
      '<tr><th scope="row" colspan="3">Sales tax</th><td class="num">Included in price</td></tr>' +
      '<tr><th scope="row" colspan="3">Total</th><td class="num"><b>' + money(order.totals.total) + '</b></td></tr>';
  }

  /* ---------- Contact form (prototype) ---------- */
  function initContact() {
    var form = document.querySelector('[data-contact]');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll('[required]').forEach(function (f) {
        var bad = !f.value.trim();
        f.setAttribute('aria-invalid', String(bad));
        var err = document.getElementById(f.id + '-err'); if (err) err.hidden = !bad;
        if (bad && ok) { f.focus(); ok = false; }
      });
      if (!ok) return;
      var s = document.getElementById('contact-status');
      s.hidden = false; s.focus();
      form.reset();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav(); initPickers(); initLightbox(); initCart(); initCheckout(); initReceived(); initContact(); updateCartUI();
    var y = document.querySelector('[data-year]'); if (y) y.textContent = new Date().getFullYear();
  });
})();
