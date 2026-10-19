/* =========================================================
   "Scegli. Esplora." — dispositivi 3D da ruotare
   - Mouse: trascina in ogni direzione
   - Touch: trascina di lato per ruotare; in verticale la pagina scorre (Safari ok)
   ========================================================= */
import { THREE, hasWebGL, makeRenderer, makeScene, buildIphone, buildAndroid, buildMacbook, buildLaptop, buildDesktop, buildPS5, buildPS4, buildXbox } from './nc3d.js';

const root = document.getElementById('explorer');

// categorie e modelli: rispecchiano quello che il negozio vende e ripara
const GROUPS = {
  smartphone: ['iphone', 'android'],
  computer: ['laptop', 'macbook', 'desktop'],
  console: ['ps5', 'ps4', 'xbox']
};
const DATA = {
  iphone:  { label: 'iPhone',     title: 'iPhone',           text: 'iPhone usati e Open Box. Ripariamo schermo, batteria, fotocamere e scheda madre.', build: buildIphone,  ry: 0.55,  rx: 0.08, fill: 0.62 },
  android: { label: 'Android',    title: 'Smartphone Android', text: 'Nuovi Samsung, Honor, Oppo, Realme, Motorola. Riparazioni complete per ogni marca.', build: buildAndroid, ry: -0.6, rx: 0.08, fill: 0.62 },
  laptop:  { label: 'Notebook',   title: 'Notebook',         text: 'Notebook nuovi e ricondizionati. Ripariamo schermo, batteria, tastiera e scheda madre.', build: buildLaptop, ry: -0.5, rx: 0.28, fill: 0.5 },
  macbook: { label: 'MacBook',    title: 'MacBook',          text: 'Assistenza e riparazione anche per i portatili Apple.', build: buildMacbook, ry: -0.5, rx: 0.28, fill: 0.5 },
  desktop: { label: 'PC fisso',   title: 'PC fisso',         text: 'PC desktop nuovi. Ripariamo e aggiorniamo anche il tuo computer fisso.', build: buildDesktop, ry: -0.35, rx: 0.12, fill: 0.46 },
  ps5:     { label: 'PS5',        title: 'PlayStation 5',    text: 'Riparazione PlayStation 5: portala in negozio per la diagnosi.', build: buildPS5, ry: -0.75, rx: 0.1, fill: 0.6 },
  ps4:     { label: 'PS4',        title: 'PlayStation 4',    text: 'Riparazione PlayStation 4: portala in negozio per la diagnosi.', build: buildPS4, ry: -0.65, rx: 0.32, fill: 0.42 },
  xbox:    { label: 'Xbox',       title: 'Xbox',             text: 'Riparazione Xbox: portala in negozio per la diagnosi.', build: buildXbox, ry: -0.6, rx: 0.45, fill: 0.6 }
};

async function start() {
  if (!root) return;
  const viewer = root.querySelector('.viewer');
  const canvas = viewer.querySelector('canvas');
  const hint = viewer.querySelector('.viewer-hint span');
  const titleEl = root.querySelector('[data-title]');
  const textEl = root.querySelector('[data-text]');
  if (!hasWebGL()) { if (hint) hint.textContent = 'Anteprima 3D non disponibile su questo dispositivo'; return; }

  const renderer = makeRenderer(canvas);
  const scene = makeScene(renderer);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);
  const pivot = new THREE.Group(); scene.add(pivot);
  const built = {};           // ogni modello si costruisce una sola volta
  let current = null, key = null, token = 0;
  let tgtY = 0, tgtX = 0, rotY = 0, rotX = 0, velY = 0, zoom = 1, tgtZoom = 1, appear = 1, dist = 6;
  let dragging = false, visible = true;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let auto = !reduce;

  function fit() {
    if (!current) return;
    const keep = pivot.rotation.clone(), keepS = pivot.scale.x;
    pivot.rotation.set(0, 0, 0); pivot.scale.setScalar(1); pivot.updateMatrixWorld(true);
    const s = new THREE.Box3().setFromObject(current).getSize(new THREE.Vector3());
    pivot.rotation.copy(keep); pivot.scale.setScalar(keepS);
    const t2 = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), f = DATA[key].fill * (viewer.classList.contains('compact') ? 1.45 : 1);
    const r = Math.max(s.x, s.z) * 0.92;          // ruotando, la larghezza cambia
    dist = Math.max(s.y / (t2 * f), r / (t2 * camera.aspect * f)) + s.z * 0.3;
  }
  function size() {
    const w = canvas.clientWidth, h = canvas.clientHeight;   // la tela può essere più bassa del riquadro
    renderer.setSize(w, h, false); camera.aspect = w / h;
    // sposta l'immagine in alto: in basso c'è la didascalia
    const lift = viewer.classList.contains('compact') ? 0 : h * (w < 620 ? 0.13 : 0.07);
    camera.setViewOffset(w, h, 0, lift, w, h);
    camera.updateProjectionMatrix(); fit();
  }

  async function show(k) {
    const my = ++token;
    if (hint) hint.textContent = 'Caricamento…';
    try { if (!built[k]) built[k] = await DATA[k].build(); }
    catch (e) { if (hint) hint.textContent = 'Modello non disponibile'; return; }
    if (my !== token) return;
    if (current) pivot.remove(current);
    current = built[k]; key = k; pivot.add(current);
    const d = DATA[k];
    tgtY = rotY = d.ry; tgtX = rotX = d.rx; velY = 0; appear = 0; tgtZoom = 1;
    if (titleEl) titleEl.textContent = d.title;
    if (textEl) textEl.textContent = d.text;
    if (hint) hint.textContent = 'Trascina per ruotare';
    fit();
  }

  // selettore a due livelli: categoria → modello
  const cats = Array.from(root.querySelectorAll('[data-cat]'));
  const modelsEl = root.querySelector('.models');
  function pickModel(k) {
    modelsEl.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.model === k ? 'true' : 'false'));
    show(k);
  }
  function pickCat(c) {
    cats.forEach((b) => b.setAttribute('aria-selected', b.dataset.cat === c ? 'true' : 'false'));
    modelsEl.innerHTML = GROUPS[c].map((k) => '<button type="button" data-model="' + k + '" aria-pressed="false">' + DATA[k].label + '</button>').join('');
    modelsEl.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => pickModel(b.dataset.model)));
    pickModel(GROUPS[c][0]);
  }
  cats.forEach((b) => b.addEventListener('click', () => pickCat(b.dataset.cat)));

  /* trascinamento */
  let lastX = 0, lastY = 0, pid = null, touch = false;
  viewer.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.viewer-tools')) return;
    pid = e.pointerId; touch = e.pointerType === 'touch';
    dragging = true; lastX = e.clientX; lastY = e.clientY; velY = 0;
    viewer.classList.add('dragging', 'touched');
    if (!touch) { try { viewer.setPointerCapture(pid); } catch (err) { /* niente */ } }
  });
  viewer.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== pid) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    tgtY += dx * 0.011; velY = dx * 0.011;
    if (!touch) tgtX = Math.max(-0.7, Math.min(0.9, tgtX + dy * 0.007));
  });
  const end = (e) => { if (e.pointerId !== pid) return; dragging = false; pid = null; viewer.classList.remove('dragging'); };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => viewer.addEventListener(ev, end));

  /* pulsanti */
  const q = (a) => root.querySelector('[data-act="' + a + '"]');
  const bAuto = q('auto');
  const setAuto = (v) => { auto = v; if (bAuto) bAuto.setAttribute('aria-pressed', v ? 'true' : 'false'); };
  setAuto(auto);
  if (bAuto) bAuto.addEventListener('click', () => setAuto(!auto));
  q('in') && q('in').addEventListener('click', () => { tgtZoom = Math.max(0.55, tgtZoom - 0.18); });
  q('out') && q('out').addEventListener('click', () => { tgtZoom = Math.min(1.6, tgtZoom + 0.18); });
  q('reset') && q('reset').addEventListener('click', () => { const d = DATA[key]; tgtY = d.ry + Math.round((rotY - d.ry) / (Math.PI * 2)) * Math.PI * 2; tgtX = d.rx; tgtZoom = 1; });

  new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { rootMargin: '150px' }).observe(viewer);
  window.addEventListener('resize', size);
  new ResizeObserver(size).observe(canvas);
  const clock = new THREE.Clock();
  (function frame() {
    requestAnimationFrame(frame);
    if (!visible || !current) return;
    const t = clock.getElapsedTime();
    if (!dragging && auto) tgtY += 0.005;
    if (!dragging && Math.abs(velY) > 0.0005) { tgtY += velY; velY *= 0.93; }
    rotY += (tgtY - rotY) * 0.12; rotX += (tgtX - rotX) * 0.12;
    zoom += (tgtZoom - zoom) * 0.1; appear += (1 - appear) * 0.08;
    pivot.rotation.set(rotX, rotY, 0);
    pivot.position.y = reduce ? 0 : Math.sin(t * 1.2) * 0.035;
    pivot.scale.setScalar(0.9 + 0.1 * appear);
    camera.position.set(0, 0.05, dist * zoom); camera.lookAt(0, 0, 0);
    if (current.userData.tick) current.userData.tick(t);
    renderer.render(scene, camera);
  })();
  size();
  pickCat((cats[0] && cats[0].dataset.cat) || 'smartphone');
}

start();
