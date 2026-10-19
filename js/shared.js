/* =========================================================
   Funzioni condivise: navbar, tema logo, inclinazione card,
   stato "aperto/chiuso", dati negozio, recensioni
   ========================================================= */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var NC = window.NC || {};
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----- Navbar: menu mobile ----- */
  var nav = $('.nav');
  var burger = $('.burger');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('.nav-links a, .mobile-menu a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; });
    });
  }

  /* ----- Tema giorno / notte ----- */
  var root = document.documentElement;
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('nc-theme', t); } catch (e) { /* navigazione privata: pazienza */ }
    $$('.theme-btn').forEach(function (b) {
      b.setAttribute('aria-label', t === 'dark' ? 'Passa alla modalità giorno' : 'Passa alla modalità notte');
      b.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
    });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#080b16' : '#ffffff');
    window.dispatchEvent(new Event('nc-theme'));
  }
  setTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  $$('.theme-btn').forEach(function (b) {
    b.addEventListener('click', function () { setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); });
  });

  /* ----- Sito aperto con doppio clic (file://): il 3D non può caricarsi ----- */
  if (location.protocol === 'file:') root.classList.add('no-3d');

  /* ----- Bagliore che segue il mouse ----- */
  $$('.glow-host').forEach(function (host) {
    host.addEventListener('pointermove', function (e) {
      var r = host.getBoundingClientRect();
      host.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      host.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ----- Card che si inclinano in 3D (solo con mouse) ----- */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    $$('[data-tilt]').forEach(function (el) {
      var max = parseFloat(el.getAttribute('data-tilt')) || 8;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.transform = 'perspective(900px) rotateY(' + ((px - .5) * max * 2) + 'deg) rotateX(' + ((.5 - py) * max * 2) + 'deg) translateZ(0)';
        el.style.setProperty('--px', (px * 100) + '%');
        el.style.setProperty('--py', (py * 100) + '%');
      });
      el.addEventListener('pointerleave', function () {
        el.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1), box-shadow .3s, border-color .3s, background .3s';
        el.style.transform = '';
        setTimeout(function () { el.style.transition = ''; }, 520);
      });
    });
  }

  /* ----- Stato aperto / chiuso (ora italiana) ----- */
  function nowRome() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
      var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { d: map[o.weekday], h: (parseInt(o.hour, 10) % 24) + parseInt(o.minute, 10) / 60 };
    } catch (e) { var n = new Date(); return { d: n.getDay(), h: n.getHours() + n.getMinutes() / 60 }; }
  }
  function fmt(h) { var hh = Math.floor(h), mm = Math.round((h - hh) * 60); return hh + (mm ? ':' + (mm < 10 ? '0' : '') + mm : ':00'); }
  var t = nowRome(), slots = (NC.orari && NC.orari[t.d]) || [], openNow = null;
  slots.forEach(function (s) { if (t.h >= s[0] && t.h < s[1]) openNow = s; });
  var label;
  if (openNow) label = 'Aperto ora · chiude alle ' + fmt(openNow[1]);
  else {
    var next = null, i, d, k;
    for (i = 0; i < 8 && !next; i++) {
      d = (t.d + i) % 7;
      var sl = (NC.orari && NC.orari[d]) || [];
      for (k = 0; k < sl.length; k++) {
        if (i > 0 || sl[k][0] > t.h) { next = { when: i, h: sl[k][0] }; break; }
      }
    }
    var days = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
    label = 'Chiuso ora' + (next ? ' · riapre ' + (next.when === 0 ? 'oggi' : next.when === 1 ? 'domani' : days[(t.d + next.when) % 7]) + ' alle ' + fmt(next.h) : '');
  }
  $$('[data-status]').forEach(function (el) { el.textContent = label; el.classList.toggle('open', !!openNow); });
  // timbro breve (Aperto / Chiuso) con la frase completa per i lettori di schermo
  $$('[data-stamp]').forEach(function (el) {
    el.textContent = openNow ? 'Aperto' : 'Chiuso';
    el.setAttribute('aria-label', label); el.setAttribute('title', label);
    el.classList.toggle('open', !!openNow); el.classList.add('thump');
  });
  // orario di oggi in breve (barra informazioni)
  var oggi = (NC.orari && NC.orari[t.d]) || [];
  var oggiTxt = oggi.length ? oggi.map(function (s) { return fmt(s[0]).replace(':00', '') + '–' + fmt(s[1]).replace(':00', ''); }).join(' · ') : 'Chiuso';
  $$('[data-today-hours]').forEach(function (el) { el.textContent = oggiTxt; });
  // orari raggruppati (Lun–Ven / Sabato / Domenica): evidenzia il gruppo di oggi
  $$('[data-days]').forEach(function (el) { el.classList.toggle('today', el.getAttribute('data-days').split(',').indexOf(String(t.d)) > -1); });
  $$('.hours tr[data-day]').forEach(function (tr) {
    if (parseInt(tr.getAttribute('data-day'), 10) === t.d) tr.classList.add('today');
  });

  /* ----- Dati del negozio (telefono, email, social) ----- */
  $$('[data-nc]').forEach(function (el) {
    var key = el.getAttribute('data-nc'), v = NC[key];
    if (!v) { el.hidden = true; return; }
    el.hidden = false;
    if (el.tagName === 'A') {
      if (key === 'telefono') el.href = 'tel:' + v.replace(/\s+/g, '');
      else if (key === 'email') el.href = 'mailto:' + v;
      else if (key === 'whatsapp') el.href = 'https://wa.me/' + v.replace(/\D/g, '');
      else el.href = v;
    }
    var out = el.querySelector('[data-out]');
    if (out) out.textContent = v;
  });

  /* ----- Header: fondo solo dopo aver iniziato a scorrere ----- */
  var navEl = $('.nav');
  if (navEl) {
    var onScroll = function () { navEl.classList.toggle('scrolled', window.scrollY > 24); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ----- Comparsa dei testi, una sola volta ----- */
  var rv = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  /* ----- Schede (riparazioni per categoria) ----- */
  $$('[data-tabs]').forEach(function (box) {
    var tabs = Array.prototype.slice.call(box.querySelectorAll('[role="tab"]'));
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab, panel = document.getElementById(t.getAttribute('aria-controls'));
        t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
        if (panel) { panel.hidden = !on; if (on) { panel.classList.remove('in'); void panel.offsetWidth; panel.classList.add('in'); } }
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (k) { e.preventDefault(); select(tabs[(i + k + tabs.length) % tabs.length], true); }
      });
    });
  });

  /* ----- Data di oggi ----- */
  $$('[data-today]').forEach(function (el) {
    var n = new Date(), p = function (x) { return (x < 10 ? '0' : '') + x; };
    el.textContent = p(n.getDate()) + '/' + p(n.getMonth() + 1) + '/' + n.getFullYear();
  });

  /* ----- Contatti: email quando sarà attiva ----- */
  if (NC.email) $$('[data-email-way]').forEach(function (el) { el.href = 'mailto:' + NC.email; var l = el.querySelector('[data-email-label]'); if (l) l.textContent = NC.email; });

  /* ----- Anno nel footer ----- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ----- Recensioni (carosello) ----- */
  var track = $('#revTrack');
  if (track) {
    var list = window.NC_REVIEWS || [];
    var star = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1z"/></svg>';
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    // In anteprima sul computer (Go Live / 127.0.0.1) mostra recensioni d'ESEMPIO, ben segnalate,
    // per vedere l'impaginazione. Online, finché js/reviews.js è vuoto, compare l'invito a lasciarne una.
    var preview = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
    var sample = !list.length && preview;
    if (sample) list = [
      { nome: 'Esempio', stelle: 5, testo: 'Testo d’esempio: qui comparirà una recensione vera copiata da Google.', quando: 'Anteprima' },
      { nome: 'Esempio', stelle: 5, testo: 'Testo d’esempio: incolla le recensioni vere in js/reviews.js e questi riquadri spariranno.', quando: 'Anteprima' },
      { nome: 'Esempio', stelle: 5, testo: 'Testo d’esempio per vedere come appare il carosello con più recensioni.', quando: 'Anteprima' },
      { nome: 'Esempio', stelle: 5, testo: 'Testo d’esempio.', quando: 'Anteprima' }
    ];
    if (list.length) {
      track.innerHTML = list.map(function (r) {
        var n = Math.max(1, Math.min(5, r.stelle || 5)), s = '';
        for (var q = 0; q < n; q++) s += star;
        return '<article class="rev' + (sample ? ' sample' : '') + '">' + (sample ? '<span class="sample-tag">Esempio</span>' : '') +
          '<div class="stars" aria-label="' + n + ' stelle su 5">' + s + '</div><blockquote>' + esc(r.testo) + '</blockquote>' +
          '<div class="who"><i>' + esc((r.nome || '?').charAt(0)) + '</i><div>' + esc(r.nome) + '<small>' + esc(r.quando || 'Recensione Google') + '</small></div>' +
          '<svg class="g" viewBox="0 0 24 24" aria-label="Google"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.2a11 11 0 0 0 0 9.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.2 7.1l3.6 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg></div></article>';
      }).join('');
    } else {
      var empty = $('#revEmpty'); if (empty) empty.hidden = false;
      track.hidden = true;
      var navR = $('.rev-nav'); if (navR) navR.hidden = true;
    }
    var prev = $('#revPrev'), nxt = $('#revNext');
    var step = function () { var c = track.querySelector('.rev'); return c ? c.getBoundingClientRect().width + 20 : 300; };
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (nxt) nxt.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
  }
})();
