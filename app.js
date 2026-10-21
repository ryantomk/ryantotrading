(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* ---------- Settings: edit only this block ---------- */
  var CONFIG = Object.freeze({
    businessName: 'Ryanto Trading',
    upiId: 'yourname@upi',          /* your real UPI ID, e.g. ryanto@oksbi */
    waNumber: '910000000000',       /* WhatsApp number: country code + number, digits only */
    instagramUrl: 'https://www.instagram.com/yourhandle/',
    offerText: 'Free demo class every week. Book your seat today.',  /* leave '' to hide the bar */
    address: 'Nilambur, Kerala, India',
    phone: '+91 00000 00000',
    hours: Object.freeze({          /* India time, 24-hour format */
      open: '09:00',
      close: '18:00',
      days: Object.freeze([1, 2, 3, 4, 5, 6]),   /* 0 = Sunday ... 6 = Saturday */
      label: 'Monday to Saturday'
    })
  });
  var UPI_PLACEHOLDER = 'yourname@upi';
  var WA_PLACEHOLDER = '910000000000';
  var MAX_QTY = 10;

  /* ---------- Locked menu: the only source of names and prices ---------- */
  function item(o) { return Object.freeze(o); }
  var MENU = Object.freeze([
    item({ id: 'forex', group: 'Markets', featured: true, category: 'Forex', name: 'Forex Foundations', desc: '', price: 14999, per: '', img: 'photo-1535320903710-d993d3d77d29' }),
    item({ id: 'stocks', group: 'Markets', category: 'Stocks', name: 'Stock Market Basics', desc: 'How markets work, how to read a balance sheet, and how to pick your first positions.', price: 7999, per: '', img: 'photo-1590283603385-17ffb3a7f29f' }),
    item({ id: 'crypto', group: 'Markets', category: 'Crypto', name: 'Crypto Essentials', desc: 'Bitcoin, altcoins and exchanges explained, with a clear plan for managing volatility.', price: 8999, per: '', img: 'photo-1621761191319-c6fb62004040' }),
    item({ id: 'charts', group: 'Skills', category: 'Technical analysis', name: 'Chart Analysis', desc: 'Candlesticks, trend, support and resistance, and how to build a repeatable setup.', price: 9999, per: '', img: 'photo-1642543492481-44e81e3914a7' }),
    item({ id: 'risk', group: 'Skills', category: 'Risk', name: 'Risk and Capital Management', desc: 'Position sizing, stop-loss rules and drawdown limits, so one bad trade never ends your account.', price: 6999, per: '', img: 'photo-1554224155-6726b3ff858f' }),
    item({ id: 'mindset', group: 'Skills', category: 'Mindset', name: 'Trading Psychology', desc: 'Build routines that hold up under fear and greed, with a journal you actually keep.', price: 5999, per: '', img: 'photo-1579532537598-459ecdaf39cc' }),
    item({ id: 'mentor', group: 'Mentorship', category: 'Mentorship', name: 'Live Market Room', desc: 'Trade alongside your mentor in live sessions, with feedback on your own charts.', price: 4999, per: ' / month', img: 'photo-1535320903710-d993d3d77d29' })
  ]);
  var BY_ID = Object.create(null);
  MENU.forEach(function (m) { BY_ID[m.id] = m; });

  /* ---------- Reviews: replace these placeholders with real ones ---------- */
  var REVIEWS = Object.freeze([
    Object.freeze({ text: 'Student review goes here. Replace this text with a real review.', name: 'Student name', course: 'Course taken' }),
    Object.freeze({ text: 'Student review goes here. Replace this text with a real review.', name: 'Student name', course: 'Course taken' }),
    Object.freeze({ text: 'Student review goes here. Replace this text with a real review.', name: 'Student name', course: 'Course taken' })
  ]);

  /* ---------- Instagram gallery: Unsplash photo IDs (replace with your own images later) ---------- */
  var GALLERY = Object.freeze([
    'photo-1611974789855-9c2a0a7236a3', 'photo-1590283603385-17ffb3a7f29f', 'photo-1621761191319-c6fb62004040',
    'photo-1642543492481-44e81e3914a7', 'photo-1554224155-6726b3ff858f', 'photo-1522202176988-66273c2fd55f'
  ]);

  /* ---------- Helpers ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function guardImg(img) {
    img.draggable = false;
    img.addEventListener('error', function () { img.remove(); }, { once: true });
  }
  function photo(id, w) { return 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=' + w + '&q=80'; }

  /* India time helpers */
  function istNow() {
    var o = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(new Date()).forEach(function (x) { o[x.type] = x.value; });
    var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { date: o.year + '-' + o.month + '-' + o.day, day: days[o.weekday], min: (Number(o.hour) % 24) * 60 + Number(o.minute) };
  }
  function toMin(t) { var p = t.split(':'); return Number(p[0]) * 60 + Number(p[1]); }
  function t12(m) {
    var h = Math.floor(m / 60), mm = m % 60;
    return ((h % 12) || 12) + ':' + (mm < 10 ? '0' : '') + mm + ' ' + (h >= 12 ? 'pm' : 'am');
  }
  function hoursText() { return CONFIG.hours.label + ', ' + t12(toMin(CONFIG.hours.open)) + ' to ' + t12(toMin(CONFIG.hours.close)); }

  /* Sanitise typed input: strip control and invisible characters, markup characters, collapse spaces, limit length */
  var CONTROL = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;
  function cleanName(v) {
    return String(v == null ? '' : v).normalize('NFKC').replace(CONTROL, ' ')
      .replace(/[^\p{L}\p{M}\s.'\u2019-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 40);
  }
  function cleanNote(v) {
    return String(v == null ? '' : v).normalize('NFKC').replace(CONTROL, ' ')
      .replace(/[<>`{}\\|^~]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
  }

  /* ---------- Toast ---------- */
  var toast = $('toast'), toastTimer;
  function say(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2800);
  }

  /* ---------- Copy to clipboard ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (res, rej) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;user-select:text;-webkit-user-select:text';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (x) { ok = false; }
      document.body.removeChild(ta);
      if (ok) res(); else rej();
    });
  }

  /* ---------- Build course cards with textContent ---------- */
  var grid = $('courseGrid');
  MENU.forEach(function (m) {
    if (m.featured) return;
    var card = el('article', 'card reveal');
    card.dataset.group = m.group;
    var imgWrap = el('div', 'card-img');
    var img = el('img');
    img.src = photo(m.img, 900);
    img.alt = m.name;
    img.loading = 'lazy';
    guardImg(img);
    imgWrap.appendChild(img);
    var body = el('div', 'card-body');
    var foot = el('div', 'card-foot');
    var btn = el('button', 'btn btn-ghost', 'Add to order');
    btn.type = 'button';
    btn.addEventListener('click', function () { addItem(m.id); });
    foot.appendChild(el('span', 'amt', fmt.format(m.price) + m.per));
    foot.appendChild(btn);
    body.appendChild(el('span', 'cat', m.category));
    body.appendChild(el('h3', null, m.name));
    body.appendChild(el('p', null, m.desc));
    body.appendChild(foot);
    card.appendChild(imgWrap);
    card.appendChild(body);
    grid.appendChild(card);
  });
  $('featPrice').textContent = fmt.format(BY_ID.forex.price);
  $('featAdd').addEventListener('click', function () { addItem('forex'); });
  document.querySelectorAll('img').forEach(guardImg);

  /* ---------- Find us (from CONFIG) ---------- */
  (function () {
    var q = encodeURIComponent(CONFIG.address);
    var tel = 'tel:' + CONFIG.phone.replace(/[^\d+]/g, '');
    var mapLink = 'https://www.google.com/maps/search/?api=1&query=' + q;
    $('findAddress').textContent = CONFIG.address;
    $('findHours').textContent = hoursText();
    $('findPhone').textContent = CONFIG.phone; $('findPhone').href = tel;
    $('callUs').href = tel;
    $('footPhone').textContent = CONFIG.phone; $('footPhone').href = tel;
    $('directions').href = 'https://www.google.com/maps/dir/?api=1&destination=' + q;
    $('mapFrame').src = 'https://maps.google.com/maps?q=' + q + '&z=15&output=embed';
    function wire(id, getText, done) {
      var b = $(id), orig = b.textContent;
      b.addEventListener('click', function () {
        copyText(getText()).then(function () {
          b.textContent = 'Copied'; say(done);
          setTimeout(function () { b.textContent = orig; }, 1600);
        }, function () { say('Could not copy. Please copy it manually.'); });
      });
    }
    wire('copyPhone', function () { return CONFIG.phone; }, 'Phone number copied');
    wire('copyMap', function () { return mapLink; }, 'Map link copied');
  })();

  /* ---------- Order cart ---------- */
  var body = document.body;
  var items = [];            /* [{id, qty}] — names and prices always come from MENU */
  var orderRef = makeRef();
  var panel = $('cart'), list = $('cartList'), empty = $('cartEmpty'), totalEl = $('cartTotal');
  var countEl = $('cartCount'), countSr = $('cartCountSr');
  var openBtn = $('cartOpen'), closeBtn = $('cartClose');
  var payBtn = $('payUpi'), waBtn = $('sendWa'), hint = $('payHint');
  var nameIn = $('custName'), noteIn = $('custNote');
  var lastFocus = null;

  function makeRef() {
    var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  /* 32 characters, no I, O, 0 or 1 */
    var b = new Uint8Array(4), r = '';
    crypto.getRandomValues(b);
    for (var i = 0; i < 4; i++) r += A.charAt(b[i] % 32);
    return 'RYN-' + r;
  }
  function findItem(id) { for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i]; return null; }
  function total() { return items.reduce(function (s, i) { return s + BY_ID[i.id].price * i.qty; }, 0); }

  function isHttps() { return window.location.protocol === 'https:'; }
  function upiValid() { return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(CONFIG.upiId) && CONFIG.upiId !== UPI_PLACEHOLDER; }
  function waValid() { return /^\d{10,15}$/.test(CONFIG.waNumber) && CONFIG.waNumber !== WA_PLACEHOLDER; }
  function isMobile() {
    var ua = navigator.userAgent || '';
    if (/Android|iPhone|iPad|iPod/i.test(ua)) return true;
    if (navigator.userAgentData && navigator.userAgentData.mobile) return true;
    return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  }

  function render() {
    var n = 0;
    while (list.firstChild) list.removeChild(list.firstChild);
    items.forEach(function (it) {
      var m = BY_ID[it.id];
      n += it.qty;
      var li = el('li', 'cart-item');
      var left = el('div');
      left.appendChild(el('h3', null, m.name));
      left.appendChild(el('span', 'unit', fmt.format(m.price) + ' each'));
      li.appendChild(left);
      li.appendChild(el('div', 'line-total', fmt.format(m.price * it.qty)));
      var ctl = el('div', 'item-ctl');
      var qty = el('div', 'qty');
      qty.setAttribute('role', 'group');
      qty.setAttribute('aria-label', 'Quantity for ' + m.name);
      function ctlBtn(label, act, aria, cls) {
        var b = el('button', cls || null, label);
        b.type = 'button'; b.dataset.act = act; b.dataset.id = m.id;
        if (aria) b.setAttribute('aria-label', aria);
        return b;
      }
      qty.appendChild(ctlBtn('\u2212', 'dec', 'Decrease quantity'));
      qty.appendChild(el('span', null, String(it.qty)));
      qty.appendChild(ctlBtn('+', 'inc', 'Increase quantity'));
      ctl.appendChild(qty);
      var rm = ctlBtn('Remove', 'rm', null, 'rm');
      ctl.appendChild(rm);
      li.appendChild(ctl);
      list.appendChild(li);
    });
    empty.style.display = items.length ? 'none' : '';
    totalEl.textContent = fmt.format(total());
    countEl.textContent = String(n);
    countSr.textContent = ', ' + n + (n === 1 ? ' item' : ' items');
    $('orderRef').textContent = orderRef;
    updatePay();
  }

  function updatePay() {
    var has = items.length > 0, msg = '';
    var upiOk = has && isHttps() && upiValid();
    payBtn.disabled = !upiOk;
    waBtn.disabled = !(has && waValid());
    if (!isHttps()) msg = 'UPI payment is turned off because this page is not on https.';
    else if (!upiValid()) msg = 'UPI payment is off until a UPI ID is set.';
    else if (!waValid() && has) msg = 'WhatsApp ordering is off until a number is set.';
    hint.textContent = msg;
  }

  function addItem(id) {
    var m = BY_ID[id];
    if (!m) return;
    var it = findItem(id);
    if (!items.length) orderRef = makeRef();
    if (it) {
      if (it.qty >= MAX_QTY) { say('Maximum ' + MAX_QTY + ' of each course per order'); return; }
      it.qty++;
      say('Added another ' + m.name + ' (' + it.qty + ' in your order)');
    } else {
      items.push({ id: id, qty: 1 });
      say('Added ' + m.name + ' to your order');
    }
    render();
  }

  function openCart() {
    lastFocus = document.activeElement;
    body.classList.add('cart-open');
    body.style.overflow = 'hidden';
    panel.setAttribute('aria-hidden', 'false');
    setTimeout(function () { closeBtn.focus(); }, 60);
  }
  function closeCart() {
    if (!body.classList.contains('cart-open')) return;
    body.classList.remove('cart-open');
    body.style.overflow = '';
    panel.setAttribute('aria-hidden', 'true');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  list.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]');
    if (!b) return;
    var it = findItem(b.dataset.id);
    if (!it) return;
    var m = BY_ID[it.id], act = b.dataset.act;
    if (act === 'inc') {
      if (it.qty >= MAX_QTY) { say('Maximum ' + MAX_QTY + ' of each course per order'); return; }
      it.qty++; say(m.name + ': quantity ' + it.qty);
    } else if (act === 'dec' && it.qty > 1) {
      it.qty--; say(m.name + ': quantity ' + it.qty);
    } else {
      items = items.filter(function (i) { return i !== it; });
      say('Removed ' + m.name + ' from your order');
    }
    render();
    if (!items.length) closeBtn.focus();
    else {
      var again = list.querySelector('[data-act="' + act + '"][data-id="' + it.id + '"]') || list.querySelector('button');
      if (again) again.focus();
    }
  });

  openBtn.addEventListener('click', openCart);
  $('menuCart').addEventListener('click', function () {
    var burgerBtn = $('burger');
    if (burgerBtn.getAttribute('aria-expanded') === 'true') burgerBtn.click();
    openCart();
  });
  closeBtn.addEventListener('click', closeCart);
  $('backdrop').addEventListener('click', closeCart);
  $('browse').addEventListener('click', closeCart);

  /* typed input: sanitise when the person leaves the field */
  nameIn.addEventListener('change', function () { nameIn.value = cleanName(nameIn.value); });
  noteIn.addEventListener('change', function () { noteIn.value = cleanNote(noteIn.value); });

  /* UPI payment: total and names come from MENU, never from the page */
  payBtn.addEventListener('click', function () {
    if (!items.length || !isHttps() || !upiValid()) { updatePay(); return; }
    var amt = total();
    if (!(amt > 0)) return;
    var tn = (orderRef + ' ' + CONFIG.businessName).slice(0, 50);
    var url = 'upi://pay?pa=' + encodeURIComponent(CONFIG.upiId) +
      '&pn=' + encodeURIComponent(CONFIG.businessName) +
      '&am=' + amt.toFixed(2) + '&cu=INR&tn=' + encodeURIComponent(tn);
    if (isMobile()) {
      say('Opening your UPI app for ' + fmt.format(amt));
      window.location.href = url;
    } else {
      copyText(CONFIG.upiId).then(function () {
        say('UPI ID copied. Pay ' + fmt.format(amt) + ' and add ' + orderRef + ' in the note');
      }, function () { say('Could not copy the UPI ID. Please type it manually.'); });
    }
  });

  /* WhatsApp message */
  waBtn.addEventListener('click', function () {
    if (!items.length || !waValid()) return;
    var name = cleanName(nameIn.value), note = cleanNote(noteIn.value);
    nameIn.value = name; noteIn.value = note;
    var lines = ['New order ' + orderRef];
    if (name) lines.push('Name: ' + name);
    items.forEach(function (it) {
      var m = BY_ID[it.id];
      lines.push('- ' + m.name + ' x' + it.qty + ' = ' + fmt.format(m.price * it.qty));
    });
    lines.push('Total: ' + fmt.format(total()));
    if (note) lines.push('Note: ' + note);
    lines.push('Payment note: ' + orderRef);
    var url = 'https://wa.me/' + CONFIG.waNumber + '?text=' + encodeURIComponent(lines.join('\n'));
    window.open(url, '_blank', 'noopener,noreferrer');
    say('Opening WhatsApp with order ' + orderRef);
  });

  document.addEventListener('keydown', function (e) {
    if (!body.classList.contains('cart-open')) return;
    if (e.key === 'Escape') { e.stopImmediatePropagation(); closeCart(); return; }
    if (e.key === 'Tab') {
      var f = panel.querySelectorAll('button:not([disabled]),a[href],input,textarea');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, true);

  /* ---------- Header, progress line, parallax, pinned feature ---------- */
  var header = $('header'), bar = $('bar'), media = $('media'), burger = $('burger'), menu = $('menu');
  var feat = $('featured'), fPhoto = $('featPhoto'), fTitle = $('feat-title'), fCopy = $('featCopy');
  var pars = document.querySelectorAll('[data-par]');
  var lastY = window.scrollY, ticking = false, menuOpen = false;
  if (reduce) feat.classList.add('static');

  function pin() {
    if (reduce) return;
    var span = feat.offsetHeight - window.innerHeight;
    var t = clamp(-feat.getBoundingClientRect().top / span);
    fPhoto.style.setProperty('--p', ease(clamp(t / 0.55)));
    fTitle.style.opacity = 1 - clamp((t - 0.25) / 0.2);
    var c = clamp((t - 0.68) / 0.22);
    fCopy.style.opacity = c;
    fCopy.style.transform = 'translateY(' + (1 - c) * 24 + 'px)';
    fCopy.style.visibility = c > 0.02 ? 'visible' : 'hidden';
  }
  function parallax() {
    if (reduce) return;
    pars.forEach(function (p) {
      var r = p.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      p.style.transform = 'translate3d(0,' + ((r.top + r.height / 2 - window.innerHeight / 2) * -0.06) + 'px,0)';
    });
  }
  function update() {
    var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    header.classList.toggle('scrolled', y > 40);
    if (!menuOpen) {
      if (y > lastY && y > 120) header.classList.add('hidden');
      else if (y < lastY) header.classList.remove('hidden');
    }
    if (!reduce && y < window.innerHeight * 1.5) media.style.transform = 'translate3d(0,' + (y * 0.35) + 'px,0)';
    pin(); parallax();
    lastY = y; ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });

  /* ---------- Offers bar ---------- */
  (function () {
    var bar = $('offerBar');
    if (!CONFIG.offerText) { bar.hidden = true; return; }
    $('offerText').textContent = CONFIG.offerText;
    $('offerClose').addEventListener('click', function () { bar.hidden = true; });
  })();

  /* ---------- Open now / Closed now (India time) ---------- */
  (function () {
    var badge = $('openBadge'), h = CONFIG.hours;
    function tick() {
      var n = istNow();
      var open = h.days.indexOf(n.day) >= 0 && n.min >= toMin(h.open) && n.min < toMin(h.close);
      badge.textContent = open ? 'Open now' : 'Closed now';
      badge.className = 'badge ' + (open ? 'is-open' : 'is-closed');
    }
    tick();
    setInterval(tick, 60000);
  })();

  /* ---------- Course category tabs ---------- */
  (function () {
    var wrap = $('courseTabs'), groups = ['All'];
    MENU.forEach(function (m) { if (!m.featured && groups.indexOf(m.group) < 0) groups.push(m.group); });
    var cards = grid.querySelectorAll('.card'), buttons = [];
    groups.forEach(function (g, i) {
      var b = el('button', 'tab', g);
      b.type = 'button';
      b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function () {
        buttons.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        cards.forEach(function (c) { c.hidden = !(g === 'All' || c.dataset.group === g); });
      });
      buttons.push(b);
      wrap.appendChild(b);
    });
  })();

  /* ---------- Reviews (placeholders live in REVIEWS) ---------- */
  (function () {
    var box = $('reviewGrid');
    REVIEWS.forEach(function (r) {
      var f = el('figure', 'review reveal');
      var q = el('blockquote');
      q.appendChild(el('p', null, r.text));
      var c = el('figcaption');
      c.appendChild(el('strong', null, r.name));
      c.appendChild(el('span', null, r.course));
      f.appendChild(q);
      f.appendChild(c);
      box.appendChild(f);
    });
  })();

  /* ---------- Instagram gallery ---------- */
  (function () {
    var url = 'https://www.instagram.com/';
    try {
      var u = new URL(CONFIG.instagramUrl);
      if (u.protocol === 'https:' && /(^|\.)instagram\.com$/.test(u.hostname)) url = u.href;
    } catch (x) { /* keep default */ }
    var box = $('igGrid');
    GALLERY.forEach(function (id) {
      var a = el('a', 'ig-tile reveal');
      a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', 'Open our Instagram page');
      var img = el('img');
      img.src = photo(id, 600); img.alt = ''; img.loading = 'lazy';
      guardImg(img);
      a.appendChild(img);
      box.appendChild(a);
    });
    $('igFollow').href = url;
    $('footInsta').href = url;
  })();

  /* ---------- Demo class booking, sent to WhatsApp ---------- */
  (function () {
    var form = $('bookForm'), nameI = $('bkName'), dateI = $('bkDate'), timeI = $('bkTime'),
        noteI = $('bkNote'), sendB = $('bkSend'), msg = $('bkHint');
    var h = CONFIG.hours, today = istNow().date;
    var p = today.split('-').map(Number);
    var maxDate = new Date(Date.UTC(p[0], p[1] - 1, p[2] + 90)).toISOString().slice(0, 10);
    dateI.min = today; dateI.max = maxDate;

    function slotsFor(ds) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ds) || ds < today || ds > maxDate) return null;
      var d = new Date(ds + 'T00:00:00Z');
      if (isNaN(d.getTime()) || h.days.indexOf(d.getUTCDay()) < 0) return null;
      var now = istNow(), out = [];
      for (var m = toMin(h.open); m <= toMin(h.close) - 30; m += 30) {
        if (ds === now.date && m <= now.min) continue;
        out.push(m);
      }
      return out;
    }
    function fillSlots() {
      while (timeI.firstChild) timeI.removeChild(timeI.firstChild);
      var s = dateI.value ? slotsFor(dateI.value) : null, first = el('option');
      first.value = '';
      if (!dateI.value) { first.textContent = 'Choose a date first'; timeI.disabled = true; msg.textContent = ''; }
      else if (!s) { first.textContent = 'No slots'; timeI.disabled = true; msg.textContent = 'We are closed on that date. Please pick another day.'; }
      else if (!s.length) { first.textContent = 'No slots left'; timeI.disabled = true; msg.textContent = 'No slots left today. Please pick another day.'; }
      else {
        first.textContent = 'Choose a time'; timeI.disabled = false; msg.textContent = '';
        timeI.appendChild(first);
        s.forEach(function (m) { var o = el('option', null, t12(m)); o.value = String(m); timeI.appendChild(o); });
        return;
      }
      timeI.appendChild(first);
    }
    dateI.addEventListener('change', fillSlots);
    nameI.addEventListener('change', function () { nameI.value = cleanName(nameI.value); });
    noteI.addEventListener('change', function () { noteI.value = cleanNote(noteI.value); });
    if (!waValid()) { sendB.disabled = true; msg.textContent = 'Booking is off until a WhatsApp number is set.'; }
    fillSlots();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!waValid()) return;
      var name = cleanName(nameI.value), note = cleanNote(noteI.value);
      nameI.value = name; noteI.value = note;
      var s = dateI.value ? slotsFor(dateI.value) : null;
      if (!name) { msg.textContent = 'Please enter your name.'; nameI.focus(); return; }
      if (!s) { msg.textContent = 'Please choose an open date from today onwards.'; dateI.focus(); return; }
      var mins = Number(timeI.value);
      if (!timeI.value || s.indexOf(mins) < 0) { msg.textContent = 'Please choose a time slot.'; timeI.focus(); return; }
      msg.textContent = '';
      var ref = makeRef();
      var d = new Date(dateI.value + 'T00:00:00Z');
      var nice = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
      var lines = ['Demo class booking ' + ref, 'Name: ' + name, 'Date: ' + nice, 'Time: ' + t12(mins) + ' (India time)'];
      if (note) lines.push('Note: ' + note);
      window.open('https://wa.me/' + CONFIG.waNumber + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener,noreferrer');
      say('Opening WhatsApp with booking ' + ref);
    });
  })();

  /* ---------- Hero and call-to-action WhatsApp link ---------- */
  if (waValid()) {
    $('ctaWa').href = 'https://wa.me/' + CONFIG.waNumber + '?text=' + encodeURIComponent('Hi, I would like to know more about your courses.');
    $('ctaWa').target = '_blank';
    $('ctaWa').rel = 'noopener noreferrer';
  }

  /* ---------- Fade up on scroll ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(function (n, i) {
    if (n.classList.contains('card')) n.style.setProperty('--d', ((i % 3) * 0.1) + 's');
    io.observe(n);
  });

  /* ---------- Mobile menu ---------- */
  function setMenu(open) {
    menuOpen = open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    body.style.overflow = open ? 'hidden' : '';
    if (open) header.classList.remove('hidden');
  }
  burger.addEventListener('click', function () { setMenu(!menuOpen); });
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuOpen) { setMenu(false); burger.focus(); }
  });
  window.matchMedia('(min-width:861px)').addEventListener('change', function (e) { if (e.matches && menuOpen) setMenu(false); });

  /* ---------- Casual copy protection ---------- */
  var allowed = 'input,textarea,[contenteditable="true"],a:not(.btn),.selectable';
  document.addEventListener('dragstart', function (e) { if (e.target && e.target.tagName === 'IMG') e.preventDefault(); });
  function fromAllowed(e) {
    var t = e.target;
    if (t && t.closest && t.closest(allowed)) return true;
    var sel = window.getSelection();
    if (sel && sel.anchorNode) {
      var n = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement;
      if (n && n.closest && n.closest(allowed)) return true;
    }
    return false;
  }
  ['copy', 'cut'].forEach(function (ev) {
    document.addEventListener(ev, function (e) { if (!fromAllowed(e)) e.preventDefault(); });
  });

  /* ---------- Service worker (https only) and Install app button ---------- */
  (function () {
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js', { scope: './' }).catch(function () { /* offline support is optional */ });
      });
    }
    var btn = $('installApp'), deferred = null;
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferred = e;
      btn.hidden = false;
    });
    btn.addEventListener('click', function () {
      if (!deferred) return;
      var p = deferred;
      deferred = null;
      btn.hidden = true;
      p.prompt();
      if (p.userChoice) p.userChoice.then(function (r) { if (r && r.outcome === 'accepted') say('Installing Ryanto Trading'); });
    });
    window.addEventListener('appinstalled', function () { deferred = null; btn.hidden = true; say('App installed'); });
  })();

  render();
  update();
})();
