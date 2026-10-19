/* =========================================================
   HOME — iPhone vero che si scompone in esploso tecnico
   (come i siti degli orologi) e si ricompone seguendo lo scroll.
   ========================================================= */
import { THREE, hasWebGL, makeRenderer, makeScene, buildIphoneExploded } from './nc3d.js';

const section = document.getElementById('teardown');
const canvas = document.getElementById('heroCanvas');
const stageEl = section && section.querySelector('.stage');
const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;

// testi delle etichette: nome del componente + a cosa serve
const LABELS = {
  screen:  ['Vetro e display OLED', 'Lo schermo che tocchi ogni giorno'],
  frame:   ['Scocca in titanio', 'Struttura e tasti laterali'],
  board:   ['Scheda logica', 'Processore e memoria'],
  battery: ['Batteria', 'Ioni di litio'],
  bottom:  ['Connettore USB-C', 'Ricarica, altoparlante, vibrazione'],
  coil:    ['Bobina MagSafe', 'Ricarica wireless'],
  back:    ['Vetro posteriore', 'Il retro del telefono'],
  cam:     ['Modulo fotocamere', 'Tre obiettivi posteriori']
};
// direzione della linea di ogni etichetta: desktop (pila orizzontale) e telefono (pila verticale)
const DIR_WIDE = { screen: ['up', 70], frame: ['down', 60], board: ['up', 70], battery: ['down', 130], bottom: ['down', 34], coil: ['up', 60], back: ['down', 60], cam: ['up', 70] };
const DIR_TALL = { cam: ['right', 28], back: ['left', 28], coil: ['right', 28], board: ['left', 28], battery: ['right', 34], bottom: ['left', 22], frame: ['right', 28], screen: ['left', 28] };

function fallback() { document.documentElement.classList.add('no-3d'); }

async function start() {
  if (location.protocol === 'file:') return fallback();
  if (!section || !gsap || !ScrollTrigger || !hasWebGL()) return fallback();
  gsap.registerPlugin(ScrollTrigger);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loadingEl = section.querySelector('.loading-3d');

  /* ---------- scena ---------- */
  const renderer = makeRenderer(canvas);
  const scene = makeScene(renderer);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);

  let phone;
  try { phone = await buildIphoneExploded(); }
  catch (e) { console.warn('Modello iPhone non caricato', e); return fallback(); }
  if (loadingEl) loadingEl.classList.add('done');

  const holder = new THREE.Group(), spin = new THREE.Group();
  spin.add(phone.group); holder.add(spin); scene.add(holder);
  
  // quote di misura attorno al telefono intero (spariscono quando si apre)
  const dimsEl = section.querySelector('.dims');
  const box0 = new THREE.Box3().setFromObject(phone.group);
  const corners = []; for (let i = 0; i < 8; i++) corners.push(new THREE.Vector3(i & 1 ? box0.max.x : box0.min.x, i & 2 ? box0.max.y : box0.min.y, i & 4 ? box0.max.z : box0.min.z));
  const cv = new THREE.Vector3();

  /* ---------- etichette HTML agganciate ai pezzi 3D ---------- */
  const labelsEl = section.querySelector('.labels');
  const labelEls = {};
  Object.keys(LABELS).forEach((k) => {
    const el = document.createElement('div');
    el.className = 'lbl';
    el.innerHTML = '<span class="dot"></span><span class="ln"></span><span class="tx"><b>' + LABELS[k][0] + '</b><small>' + LABELS[k][1] + '</small></span>';
    labelsEl.appendChild(el); labelEls[k] = el;
  });

  /* ---------- impaginazione: cambia con la forma dello schermo ---------- */
  const L = {};
  function layout() {
    const w = stageEl.clientWidth, h = stageEl.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    L.w = w; L.h = h;
    L.tall = (w < 1001 && w / h < 1.3) || w / h < 1.15;          // telefono, iPad in verticale
    const t2 = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    // distanza per vedere il telefono intero (alto 2 unità) e la pila esplosa
    L.dHero = L.tall ? 2 / (t2 * (w < 620 ? 0.36 : 0.34)) : 2 / (t2 * 0.6);
    // spazio libero accanto ai testi (che restano nella colonna centrale del sito)
    const wrapW = Math.min(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--wrap')) || 1320, w - 64);
    const side = (w - wrapW) / 2, capW = Math.min(440, w * 0.4) + 40;
    L.free = { left: [side + capW, w - side * 0.6], right: [side * 0.6, w - side - capW] };   // [da, a] in pixel
    const freeW = L.free.left[1] - L.free.left[0];
    // schermi stretti/alti: la pila scomposta sta nella fascia libera sopra i testi
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 76;
    const top = navH + 16, bot = Math.max(h * 0.5, h - (w < 620 ? 300 : 340));
    L.band = { top, bot, frac: (bot - top) / h, mid: (top + bot) / 2 / h };
    L.dExp = L.tall ? Math.max(2.6 / (t2 * L.band.frac), 3.9 / (t2 * camera.aspect * 0.94)) : Math.max(3.9 / t2, 5.6 / (t2 * camera.aspect), 5.0 / (t2 * camera.aspect * (freeW / w)));
    const visW = (d) => t2 * d * camera.aspect;
    // telefono a destra dentro la colonna dei contenuti (anche su schermi molto larghi)
    const maxW = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--max')) || 1320;
    const colW = Math.min(maxW, w), heroPx = (w - colW) / 2 + colW * 0.74;
    L.heroX = L.tall ? 0 : (heroPx / w - 0.5) * visW(L.dHero);
    L.heroY = L.tall ? t2 * L.dHero * (w < 620 ? 0.04 : 0.17) : 0;
        // fine animazione: su telefono il modello torna più piccolo e più in alto, sopra i testi
    L.endD = L.tall ? L.dHero * 1.5 : L.dHero;
    L.endY = L.tall ? (0.5 - L.band.mid) * t2 * L.endD : L.heroY;
    // centro della pila quando il testo è a sinistra (+1) o a destra (-1), in unità 3D
    const toWorld = (px) => (px / w - 0.5) * visW(L.dExp);
    L.shiftR = L.tall ? 0 : toWorld((L.free.left[0] + L.free.left[1]) / 2);
    L.shiftL = L.tall ? 0 : toWorld((L.free.right[0] + L.free.right[1]) / 2);
    L.expY = L.tall ? (0.5 - L.band.mid) * t2 * L.dExp : 0.05;
    L.rx = 0.3;
    L.ry = -0.98;
    L.dirs = DIR_WIDE;
    Object.keys(labelEls).forEach((k) => {
      const [d, len] = L.dirs[k];
      labelEls[k].className = 'lbl ' + d;
      labelEls[k].style.setProperty('--len', (L.w < 620 ? len * 0.7 : len) + 'px');
      labelEls[k].txW = labelEls[k].querySelector('.tx').offsetWidth || 90;
    });
  }
  layout();

  /* ---------- stato animato ---------- */
  const zero = () => ({ screen: 0, frame: 0, board: 0, battery: 0, bottom: 0, coil: 0, back: 0, cam: 0 });
  const S = { x: L.heroX, y: L.heroY, d: L.dHero, rx: 0.06, ry: -0.42, lab: 0, ex: zero(), lift: zero(), mx: 0, my: 0 };

  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 1, invalidateOnRefresh: true }
  });
  const caps = gsap.utils.toArray(section.querySelectorAll('.cap'));
  gsap.set(caps, { autoAlpha: 0 });
  const capIn = (sel, at) => tl.fromTo(sel, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' }, at);
  const capOut = (sel, at) => tl.to(sel, { autoAlpha: 0, y: -40, duration: 0.4, ease: 'power2.in' }, at);

  // 1. il testo iniziale esce, il telefono si gira e si apre a strati
  tl.to('.hero-copy', { autoAlpha: 0, y: -50, duration: 0.6 }, 0.1);
  tl.to('.scroll-hint', { autoAlpha: 0, duration: 0.3 }, 0);
  // posizione di partenza ricalcolata a ogni ridimensionamento della finestra
  tl.fromTo(S, { x: () => L.heroX, y: () => L.heroY, d: () => L.dHero }, { x: 0, y: () => L.expY, d: () => L.dExp, rx: () => L.rx, ry: () => L.ry, duration: 1.4, immediateRender: true }, 0.3);
  const order = ['screen', 'frame', 'board', 'battery', 'bottom', 'coil', 'back', 'cam'];
  order.forEach((k, i) => tl.to(S.ex, { [k]: 1, duration: 1.1, ease: 'power3.out' }, 0.8 + i * 0.07));
  tl.to(S, { lab: 1, duration: 0.5 }, 1.25);
  tl.to(S, { x: () => L.shiftR, duration: 0.7 }, 1.2);
  capIn('.cap-0', 1.3); capOut('.cap-0', 2.8);

  // 2. un componente alla volta viene messo in evidenza
  const focus = [
    ['screen', '.cap-1', 1],    // testo a sinistra → pila a destra
    ['battery', '.cap-2', -1],
    ['board', '.cap-3', 1],
    ['cam', '.cap-4', -1]
  ];
  focus.forEach(([k, cap, side], i) => {
    const t0 = 3.1 + i * 1.7;
    tl.to(S, { x: () => (side > 0 ? L.shiftR : L.shiftL), duration: 0.8 }, t0);
    tl.to(S.lift, { [k]: 1, duration: 0.6, ease: 'power3.out' }, t0 + 0.2);
    capIn(cap, t0 + 0.35);
    capOut(cap, t0 + 1.4);
    tl.to(S.lift, { [k]: 0, duration: 0.5 }, t0 + 1.35);
  });

  // 3. tutto si ricompone e il telefono torna di fronte
  tl.to(S, { lab: 0, duration: 0.4 }, 9.9);
  tl.to(S.ex, { screen: 0, frame: 0, board: 0, battery: 0, bottom: 0, coil: 0, back: 0, cam: 0, duration: 1.5, ease: 'power3.inOut' }, 10.1);
  tl.to(S, { x: () => L.heroX, y: () => L.endY, d: () => L.endD, rx: 0.05, ry: Math.PI * 2 + 0.35, duration: 1.8 }, 10.1);
  capIn('.cap-5', 11.4);
  tl.to({}, { duration: 0.8 }, 11.9);

  const bar = section.querySelector('.progress i');
  ScrollTrigger.create({ trigger: section, start: 'top top', end: 'bottom bottom', onUpdate: (st) => { if (bar) bar.style.height = (st.progress * 100) + '%'; } });

  // ridimensionamento (finestra del Mac, rotazione di telefono/iPad): ricalcola tutto
  let rt = 0;
  const onResize = () => {
    clearTimeout(rt);
    layout();
    rt = setTimeout(() => {
      ScrollTrigger.refresh();
      if (tl.progress() < 0.02) { S.x = L.heroX; S.y = L.heroY; S.d = L.dHero; }
    }, 120);
  };
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  // si accorge di ogni cambio di misura della scena (anche senza evento resize)
  let lastW = stageEl.clientWidth, lastH = stageEl.clientHeight;
  new ResizeObserver(() => { const w = stageEl.clientWidth, h = stageEl.clientHeight; if (w !== lastW || Math.abs(h - lastH) > 80) { lastW = w; lastH = h; onResize(); } }).observe(stageEl);
  stageEl.addEventListener('pointermove', (e) => {
    const r = stageEl.getBoundingClientRect();
    S.mx = (e.clientX - r.left) / r.width - 0.5; S.my = (e.clientY - r.top) / r.height - 0.5;
  });

  /* ---------- disegno a ogni fotogramma ---------- */
  const v = new THREE.Vector3();
  let visible = true, px = 0, py = 0;
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { rootMargin: '200px' }).observe(section);
  const clock = new THREE.Clock();

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();
    px += (S.mx - px) * 0.05; py += (S.my - py) * 0.05;
    const float = reduce ? 0 : Math.sin(t * 1.1) * 0.03;
    holder.position.set(S.x, S.y + float, 0);
    spin.rotation.set(S.rx + py * 0.12, S.ry + px * 0.25, 0);
        const k = L.tall ? 0.8 : 1, ex = {};
    Object.keys(S.ex).forEach((n) => { ex[n] = S.ex[n] * k; });
    phone.apply(ex, S.lift);
    camera.position.set(0, 0, S.d); camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);

    // quote
    if (dimsEl) {
      const o = Math.max(0, 1 - S.ex.screen * 4 - S.lab * 4);
      dimsEl.style.opacity = o.toFixed(3);
      if (o > 0) {
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        spin.updateMatrixWorld(true);
        corners.forEach((c) => {
          cv.copy(c).applyMatrix4(phone.group.matrixWorld).project(camera);
          const px = (cv.x * 0.5 + 0.5) * L.w, py = (-cv.y * 0.5 + 0.5) * L.h;
          x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
        });
        dimsEl.style.setProperty('--x0', x0.toFixed(1) + 'px'); dimsEl.style.setProperty('--x1', x1.toFixed(1) + 'px');
        dimsEl.style.setProperty('--y0', y0.toFixed(1) + 'px'); dimsEl.style.setProperty('--y1', y1.toFixed(1) + 'px');
      }
    }

    // etichette
    labelsEl.style.opacity = S.lab;
    if (S.lab > 0.01) {
      let focused = null;
      Object.keys(S.lift).forEach((k) => { if (S.lift[k] > 0.3) focused = k; });
      labelsEl.classList.toggle('focus', !!focused);
      // posizioni sullo schermo dei punti di aggancio
      const pos = {};
      Object.keys(labelEls).forEach((k) => {
        const a = phone.anchors[k]; if (!a) return;
        v.copy(a); phone.parts[k].localToWorld(v); v.project(camera);
        pos[k] = { x: (v.x * 0.5 + 0.5) * L.w, y: (-v.y * 0.5 + 0.5) * L.h };
      });
      // telefono/tablet: etichette in due colonne ai bordi, senza sovrapporsi
      if (false) {
        const margin = 10, gap = L.w < 620 ? 26 : 34;
        // se il testo uscirebbe dallo schermo, l'etichetta passa dall'altro lato
        Object.keys(pos).forEach((k) => {
          const p = pos[k], tw = labelEls[k].txW + margin + 14;
          let side = L.dirs[k][0];
          if (side === 'left' && p.x < tw) side = 'right';
          else if (side === 'right' && L.w - p.x < tw) side = 'left';
          p.side = side;
          if (!labelEls[k].classList.contains(side)) labelEls[k].className = 'lbl ' + side;
        });
        ['left', 'right'].forEach((side) => {
          const ks = Object.keys(pos).filter((k) => pos[k].side === side).sort((a, b) => pos[a].y - pos[b].y);
          let last = -1e9;
          ks.forEach((k) => {
            const p = pos[k]; p.y = Math.max(p.y, last + gap); last = p.y;
            const el = labelEls[k];
            const len = side === 'left' ? p.x - margin - el.txW - 4 : L.w - margin - el.txW - p.x - 4;
            el.style.setProperty('--len', Math.max(10, len).toFixed(0) + 'px');
          });
        });
      }
      Object.keys(pos).forEach((k) => {
        const { x, y } = pos[k];
        const el = labelEls[k], d = pos[k].side || L.dirs[k][0];
        const off = d === 'up' ? 'translate(-50%, calc(-100% + 4.5px))' : d === 'down' ? 'translate(-50%, -4.5px)' : d === 'left' ? 'translate(calc(-100% + 4.5px), -50%)' : 'translate(-4.5px, -50%)';
        el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) ' + off;
        el.classList.toggle('on', k === focused);
      });
    }
  }
  frame();
}

start();
