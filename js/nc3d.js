/* =========================================================
   New Connection — motore 3D condiviso (Three.js r160, moduli)
   - carica i modelli veri (assets/models/*.glb)
   - illumina tutto con uno "studio fotografico" (niente parti nere)
   - costruisce l'iPhone esploso: pezzi veri del modello + componenti interni
   ========================================================= */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export { THREE };
const PI = Math.PI;
const FONT = "'Outfit','Helvetica Neue',Helvetica,Arial,sans-serif";

/* ---------- controlli di base ---------- */
export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}
export const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

/* ---------- renderer + luci + ambiente ---------- */
export function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.05;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.VSMShadowMap;
  return r;
}

// più luce in modalità notte, così i dispositivi non spariscono sul fondo scuro
export function applyTheme(renderer, scene) {
  const dark = isDark();
  // scena "fotografica" (il banco): esposizione fissa, come una foto in studio
  if (scene.userData.photo) { renderer.toneMappingExposure = 1.0; if (scene.userData.hemi) scene.userData.hemi.intensity = 0.4; return; }
  renderer.toneMappingExposure = dark ? 1.5 : 1.05;
  if (scene.userData.hemi) scene.userData.hemi.intensity = dark ? 1.4 : 0.9;
}

export function makeScene(renderer) {
  const scene = new THREE.Scene();
  try {
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.03).texture;
    pm.dispose();
  } catch (e) { /* se l'ambiente non si crea, bastano le luci qui sotto */ }
  // luci da ogni lato: anche il retro dei dispositivi resta visibile
  const hemi = new THREE.HemisphereLight(0xffffff, 0x9aa0c0, 0.9); scene.add(hemi); scene.userData.hemi = hemi;
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 4, 5); scene.add(key); scene.userData.key = key;
  const back = new THREE.DirectionalLight(0xdfe6ff, 1.2); back.position.set(-3, 2, -5); scene.add(back);
  const rimB = new THREE.DirectionalLight(0xcfd8ff, 0.6); rimB.position.set(-6, 0, 1); scene.add(rimB);
  const rimV = new THREE.DirectionalLight(0xffe2c8, 0.6); rimV.position.set(6, -1, -1); scene.add(rimV);
  const fill = new THREE.DirectionalLight(0xffffff, 1.1); fill.position.set(-5, 2, 4); scene.add(fill);   // illumina l'interno dei pezzi
  applyTheme(renderer, scene);
  window.addEventListener('nc-theme', () => applyTheme(renderer, scene));
  return scene;
}

/* ---------- caricamento modelli (con cache) ---------- */
const base = new URL('../', import.meta.url);
const draco = new DRACOLoader().setDecoderPath(new URL('js/vendor/draco/', base).href);
const loader = new GLTFLoader().setDRACOLoader(draco);
const cache = {};
export function loadGLB(name) {
  if (!cache[name]) {
    cache[name] = new Promise((res, rej) => {
      loader.load(new URL('assets/models/' + name + '.glb', base).href, (g) => res(g.scene), undefined, rej);
    });
  }
  return cache[name].then((s) => s.clone(true));
}

/* ---------- utilità geometriche ---------- */
function rr(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  r = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4);
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -PI / 2, 0, false);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, PI / 2, false);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, PI / 2, PI, false);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, PI, PI * 1.5, false);
  return s;
}
function slab(w, h, d, r, b = 0.003) {
  const g = new THREE.ExtrudeGeometry(rr(w - 2 * b, h - 2 * b, Math.max(r - b, 0.002)), {
    depth: Math.max(d - 2 * b, 1e-4), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 18
  });
  g.translate(0, 0, -(d - 2 * b) / 2);
  return g;
}
function rrPlane(w, h, r) {
  const g = new THREE.ShapeGeometry(rr(w, h, r), 18);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h);
  return g;
}
function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
function rect(x, px, py, w, h, r) { x.beginPath(); if (x.roundRect) x.roundRect(px, py, w, h, r); else x.rect(px, py, w, h); }

function canvasTex(w, h, draw, flipY = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'); draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.flipY = flipY;
  if (flipY === 'rot') {
    t.flipY = true;   // orientamento corretto per lo schermo del modello iPhone
  }
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('200 40px Outfit'), document.fonts.load('800 40px Outfit')])
      .then(() => { ctx.clearRect(0, 0, w, h); draw(ctx, w, h); t.needsUpdate = true; }).catch(() => {});
  }
  return t;
}

/* ---------- texture: schermate con il marchio ---------- */
function usbMotif(x, cx, cy, len) {
  const g = x.createLinearGradient(cx - len / 2, 0, cx + len / 2, 0);
  g.addColorStop(0, '#5b8cff'); g.addColorStop(1, '#b47bff');
  x.strokeStyle = g; x.lineWidth = len / 50; x.lineCap = 'round';
  x.beginPath(); x.moveTo(cx - len / 2, cy); x.lineTo(cx + len / 2 - len * .13, cy); x.stroke();
  const px = cx + len / 2 - len * .13, s = len / 330;
  x.fillStyle = g; rect(x, px, cy - 22 * s, 36 * s, 44 * s, 9 * s); x.fill();
  x.fillRect(px + 36 * s, cy - 14 * s, 18 * s, 28 * s);
}
function screenArt(x, w, h, big) {
  const g = x.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#040824'); g.addColorStop(.5, '#1f4fff'); g.addColorStop(1, '#7a2bff');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  const r = x.createRadialGradient(w * .2, h * .2, 10, w * .2, h * .2, Math.max(w, h));
  r.addColorStop(0, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = r; x.fillRect(0, 0, w, h);
  x.fillStyle = '#fff'; x.textAlign = 'center';
  return big;
}
export function phoneScreenTex(flipY) {
  return canvasTex(600, 1240, (x, w, h) => {
    screenArt(x, w, h);
    x.font = '200 210px ' + FONT; x.fillText('9:41', w / 2, 400);
    x.font = '300 36px ' + FONT; x.globalAlpha = .85; x.fillText('martedì 13 ottobre', w / 2, 200); x.globalAlpha = 1;
    usbMotif(x, w / 2, 760, 360);
    x.font = '200 52px ' + FONT; x.fillText('NEW', w / 2, 850);
    x.font = '800 64px ' + FONT; x.fillText('CONNECTION', w / 2, 916);
    x.fillStyle = 'rgba(255,255,255,.6)'; rect(x, w / 2 - 80, h - 40, 160, 9, 5); x.fill();
  }, flipY);
}
export function macScreenTex(flipY) {
  return canvasTex(1440, 900, (x, w, h) => {
    screenArt(x, w, h);
    x.fillStyle = 'rgba(255,255,255,.16)'; x.fillRect(0, 0, w, 36);
    x.fillStyle = '#fff'; x.font = '600 20px ' + FONT; x.textAlign = 'left'; x.fillText('New Connection     File     Modifica     Vista', 30, 25);
    x.textAlign = 'center';
    x.font = '200 130px ' + FONT; x.fillText('NEW', w / 2, h / 2 - 20);
    x.font = '800 160px ' + FONT; x.fillText('CONNECTION', w / 2, h / 2 + 130);
    usbMotif(x, w / 2, h / 2 + 220, 620);
    x.fillStyle = 'rgba(255,255,255,.22)'; rect(x, w / 2 - 300, h - 100, 600, 80, 24); x.fill();
    const cols = ['#4aa3ff', '#ff6b6b', '#ffd166', '#06d6a0', '#a78bfa', '#f472b6', '#38bdf8'];
    cols.forEach((c, i) => { x.fillStyle = c; rect(x, w / 2 - 276 + i * 80, h - 90, 60, 60, 15); x.fill(); });
  }, flipY);
}
function tvTex() {
  const c = document.createElement('canvas'); c.width = 960; c.height = 540;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.userData.ctx = c.getContext('2d'); return t;
}
function drawTV(t, time) {
  const x = t.userData.ctx, w = 960, h = 540;
  x.fillStyle = '#040822'; x.fillRect(0, 0, w, h);
  [['#1f6bff', 0, 1], ['#8a2bff', 2.1, 1.3], ['#2fd0ff', 4.2, .8]].forEach((b) => {
    const bx = w * (.5 + .38 * Math.sin(time * .5 * b[2] + b[1])), by = h * (.5 + .34 * Math.cos(time * .4 * b[2] + b[1] * 1.3));
    const g = x.createRadialGradient(bx, by, 0, bx, by, 380);
    g.addColorStop(0, b[0]); g.addColorStop(1, 'rgba(4,8,34,0)'); x.globalAlpha = .85; x.fillStyle = g; x.fillRect(0, 0, w, h);
  });
  x.globalAlpha = 1; x.fillStyle = '#fff'; x.textAlign = 'center';
  x.font = '200 80px ' + FONT; x.fillText('NEW', w / 2, h / 2 - 10);
  x.font = '800 96px ' + FONT; x.fillText('CONNECTION', w / 2, h / 2 + 84);
  t.needsUpdate = true;
}
function batteryTex() {
  return canvasTex(512, 860, (x, w, h) => {
    const R = rng(7);
    x.fillStyle = '#1b1d24'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < h; i += 3) { x.fillStyle = 'rgba(255,255,255,' + (0.02 + R() * 0.04) + ')'; x.fillRect(0, i, w, 1); }
    const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#1f6bff'); g.addColorStop(1, '#8a2bff');
    x.fillStyle = g; x.fillRect(0, 0, w, 18);
    x.fillStyle = '#e9ecf6'; x.textAlign = 'left';
    x.font = '700 58px ' + FONT; x.fillText('Li-ion', 40, 120);
    x.font = '400 26px ' + FONT; x.globalAlpha = .75; x.fillText('Batteria ricaricabile', 40, 165); x.globalAlpha = 1;
    x.strokeStyle = '#e9ecf6'; x.lineWidth = 5; x.strokeRect(40, 220, 130, 60); x.fillStyle = '#e9ecf6'; x.fillRect(170, 236, 10, 28); x.fillRect(50, 230, 84, 40);
    x.font = '400 22px ' + FONT; x.globalAlpha = .6; x.fillText('Non perforare · non riscaldare', 40, 340); x.globalAlpha = 1;
    for (let b = 0; b < 40; b++) { x.fillStyle = '#e9ecf6'; x.fillRect(40 + b * 10, 700, R() > .5 ? 5 : 2, 90); }
  });
}
function pcbTex() {
  return canvasTex(640, 512, (x, w, h) => {
    const R = rng(21);
    x.fillStyle = '#123b2f'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(214,170,69,.55)'; x.lineWidth = 2;
    for (let i = 0; i < 120; i++) {
      const px = R() * w, py = R() * h; x.beginPath(); x.moveTo(px, py);
      x.lineTo(px + (R() - .5) * 180, py); x.lineTo(px + (R() - .5) * 180, py + (R() - .5) * 140); x.stroke();
    }
    x.fillStyle = '#d6aa45';
    for (let k = 0; k < 160; k++) { x.beginPath(); x.arc(R() * w, R() * h, 2.2, 0, PI * 2); x.fill(); }
  });
}

/* =========================================================
   iPHONE VERO (modello 15 Pro Max) — pezzi riconosciuti per nome
   Nel file originale lo schermo guarda verso -Z: lo giriamo verso +Z.
   ========================================================= */
const IPH = {
  screen: ['xXDHkMplTIDAXLN', 'vELORlCJixqPHsZ', 'DjdhycfQYjKMDyn', 'usFLmqcyrnltBUr', 'EbQGKrWAqhBHiMv'],
  back: ['wLfSXtbwRlBrwof', 'WJwwVjsahIXbJpU', 'YfrJNXgMvGOAfzz', 'IykfmVvLplTsTEW', 'TakBsdEjEytCAMK'],
  cam: ['EddVrWkqZTlvmci', 'KSWlaxBcnPDpFCs', 'DCLCbjzqejuvsqH', 'CdalkzDVnwgdEhS', 'NtjcIgolNGgYlCg', 'pXBNoLiaMwsDHRF', 'IkoiNqATMVoZFKD', 'rqgRAGHOwnuBypi'],
  inner: ['ttmRoLdJipiIOmf', 'MrMmlCAsAxJpYqQ_0', 'DjsDkGiopeiEJZK'],
  display: 'xXDHkMplTIDAXLN'
};

// colore della scocca dell'iPhone (titanio blu chiaro, visibile su bianco e su nero)
export const IPHONE_COLOR = '#7d88a8';
const IPH_KEEP = ['zFdeDaGNRwzccye', 'ujsvqBWRMnqdwPx', 'hUlRcbieVuIiOXG', 'jlzuBkUzuJqgiAK', 'xNrofRCqOXXHVZt', 'pIJKfZsazmcpEiU', 'sxNzrmuTqVeaXdg', 'TBLSREBUyLMVtJa', 'hiVunnLeAHkwGEo', 'vhaEJjZoqGtyLdo'];
function tintIphone(root) {
  const done = new Set();
  root.traverse((o) => {
    if (!o.isMesh || !o.material || done.has(o.material) || IPH_KEEP.includes(o.material.name)) return;
    done.add(o.material); o.material.color.set(IPHONE_COLOR);
  });
}

// prepara i materiali del modello: niente nero assoluto, riflessi visibili
function tuneMaterials(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    const m = o.material;
    if (m && m.isMeshStandardMaterial) {
      m.envMapIntensity = 1.2;
      if (m.metalness > 0.6 && m.roughness > 0.9) m.roughness = 0.42; // metalli "spenti" del file originale
    }
  });
}

/* Telefono intero (per il visualizzatore). Restituisce un gruppo alto ~2 unità. */
export async function buildIphone() {
  const src = await loadGLB('iphone');
  tuneMaterials(src); tintIphone(src);
  src.traverse((o) => {
    if (o.isMesh && o.name === IPH.display) o.material = new THREE.MeshBasicMaterial({ map: phoneScreenTex('rot'), toneMapped: false });
  });
  const g = new THREE.Group(); src.rotation.y = PI; g.add(src);
  return normalize(g, 2);
}

/* Telefono scomponibile: restituisce { group, parts, apply(ex), anchors } */
export async function buildIphoneExploded() {
  const src = await loadGLB('iphone');
  tuneMaterials(src); tintIphone(src);
  src.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(src), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
  const k = 2 / size.y;                      // altezza finale = 2 unità
  const W = size.x * k, H = size.y * k, D = size.z * k;

  const root = new THREE.Group();
  const parts = {};
  const part = (name) => { const g = new THREE.Group(); g.name = name; parts[name] = g; root.add(g); return g; };
  ['screen', 'frame', 'board', 'battery', 'bottom', 'coil', 'back', 'cam'].forEach(part);

  // sposta ogni mesh del modello nel gruppo giusto, mantenendo la posizione
  const meshes = [];
  src.traverse((o) => { if (o.isMesh) meshes.push(o); });
  meshes.forEach((o) => {
    const name = o.name;
    let target = 'frame';
    if (IPH.screen.includes(name)) target = 'screen';
    else if (IPH.back.includes(name)) target = 'back';
    else if (IPH.cam.includes(name)) target = 'cam';
    else if (IPH.inner.includes(name)) target = null;      // pezzi di riempimento interni: non servono
    o.updateMatrixWorld(true);
    const mtx = o.matrixWorld.clone();
    o.parent.remove(o);
    if (!target) return;
    // porta in coordinate "telefono": centro nell'origine, scala k, schermo verso +Z
    const fix = new THREE.Matrix4().makeRotationY(PI)
      .multiply(new THREE.Matrix4().makeScale(k, k, k))
      .multiply(new THREE.Matrix4().makeTranslation(-ctr.x, -ctr.y, -ctr.z));
    o.matrix.copy(fix.multiply(mtx)); o.matrix.decompose(o.position, o.quaternion, o.scale);
    o.matrixAutoUpdate = true;
    if (name === IPH.display) o.material = new THREE.MeshBasicMaterial({ map: phoneScreenTex('rot'), toneMapped: false });
    parts[target].add(o);
  });

  /* ---- componenti interni (proporzionati al telefono vero) ---- */
  const M = {
    board: new THREE.MeshStandardMaterial({ map: pcbTex(), roughness: 0.5, metalness: 0.3 }),
    chip: new THREE.MeshStandardMaterial({ color: 0xc8ccd8, metalness: 0.95, roughness: 0.28 }),
    chipDark: new THREE.MeshStandardMaterial({ color: 0x23252e, metalness: 0.5, roughness: 0.45 }),
    shield: new THREE.MeshStandardMaterial({ color: 0xd9dce6, metalness: 1, roughness: 0.22 }),
    batt: new THREE.MeshStandardMaterial({ map: batteryTex(), metalness: 0.2, roughness: 0.55 }),
    battEdge: new THREE.MeshStandardMaterial({ color: 0x2a2d38, metalness: 0.4, roughness: 0.5 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xd3824a, metalness: 1, roughness: 0.28 }),
    magnet: new THREE.MeshStandardMaterial({ color: 0x9aa0ad, metalness: 1, roughness: 0.35 }),
    flex: new THREE.MeshStandardMaterial({ color: 0xc98a2b, metalness: 0.4, roughness: 0.45 }),
    black: new THREE.MeshStandardMaterial({ color: 0x1a1c22, metalness: 0.3, roughness: 0.5 }),
    accent: new THREE.MeshStandardMaterial({ color: 0x6b5bff, metalness: 0.4, roughness: 0.4, emissive: 0x2a1a8a, emissiveIntensity: 0.4 })
  };
  const add = (grp, geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); grp.add(m); return m; };
  const iw = W * 0.86;                          // larghezza utile interna
  let anchorsCam = null;

  // scheda logica (parte alta) con processore e schermature metalliche
  const b = parts.board;
  add(b, slab(iw, H * 0.34, 0.03, 0.06, 0.006), M.board, 0, H * 0.29, 0);
  add(b, slab(iw * 0.34, iw * 0.34, 0.035, 0.03, 0.006), M.shield, -iw * 0.2, H * 0.31, 0.03);
  add(b, slab(iw * 0.3, H * 0.12, 0.03, 0.02, 0.005), M.shield, iw * 0.22, H * 0.36, 0.028);
  add(b, slab(iw * 0.22, iw * 0.22, 0.03, 0.02, 0.005), M.chipDark, iw * 0.22, H * 0.22, 0.026);
  add(b, slab(iw * 0.16, iw * 0.08, 0.025, 0.01, 0.004), M.chip, -iw * 0.26, H * 0.18, 0.024);
  add(b, slab(iw * 0.12, iw * 0.08, 0.025, 0.01, 0.004), M.accent, -iw * 0.04, H * 0.17, 0.024);
  for (let i = 0; i < 6; i++) add(b, new THREE.CylinderGeometry(0.012, 0.012, 0.02, 16).rotateX(PI / 2), M.chip, -iw * 0.42 + i * iw * 0.168, H * 0.45, 0.02);

  // batteria (parte centrale bassa)
  const bt = parts.battery;
  add(bt, slab(iw * 0.92, H * 0.5, 0.07, 0.04, 0.01), M.battEdge, 0, -H * 0.14, 0);
  const label = new THREE.Mesh(rrPlane(iw * 0.88, H * 0.47, 0.03), M.batt); label.position.set(0, -H * 0.14, 0.0352); bt.add(label);
  add(bt, slab(iw * 0.36, H * 0.05, 0.02, 0.01, 0.004), M.flex, -iw * 0.2, H * 0.12, 0.02);

  // modulo inferiore: connettore USB-C, altoparlante, motore di vibrazione
  const bo = parts.bottom;
  add(bo, slab(iw * 0.95, H * 0.07, 0.02, 0.02, 0.005), M.flex, 0, -H * 0.445, 0);
  add(bo, slab(iw * 0.2, H * 0.035, 0.05, 0.02, 0.006), M.shield, 0, -H * 0.468, 0.02);
  add(bo, slab(iw * 0.28, H * 0.055, 0.06, 0.012, 0.006), M.black, -iw * 0.3, -H * 0.43, 0.025);
  add(bo, slab(iw * 0.26, H * 0.055, 0.06, 0.012, 0.006), M.chipDark, iw * 0.31, -H * 0.43, 0.025);
  for (let i = 0; i < 7; i++) add(bo, new THREE.CylinderGeometry(0.006, 0.006, 0.07, 10).rotateX(PI / 2), M.chip, iw * 0.22 + i * 0.026, -H * 0.43, 0.03);

  // bobina di ricarica wireless + anello di magneti
  const co = parts.coil;
  [0.36, 0.3, 0.24, 0.18].forEach((r) => {
    const t = new THREE.Mesh(new THREE.TorusGeometry(r * W, 0.014, 12, 96), M.copper); t.scale.z = 0.5; t.position.set(0, -H * 0.05, 0); co.add(t);
  });
  const mag = new THREE.Mesh(new THREE.TorusGeometry(0.43 * W, 0.02, 10, 96), M.magnet); mag.scale.z = 0.4; mag.position.set(0, -H * 0.05, 0); co.add(mag);
  add(co, slab(W * 0.08, H * 0.2, 0.008, 0.01, 0.003), M.flex, 0, -H * 0.27, 0);

  // modulo fotocamere: i tre sensori dietro le lenti vere
  {
    const cb = new THREE.Box3();
    parts.cam.children.forEach((m) => cb.expandByObject(m));
    const c = cb.getCenter(new THREE.Vector3()), s = cb.getSize(new THREE.Vector3());
    const r = Math.min(s.x, s.y) * 0.21;
    const housing = new THREE.MeshStandardMaterial({ color: 0x2b2f3a, metalness: 0.7, roughness: 0.35 });
    const ring = new THREE.MeshStandardMaterial({ color: 0xc9ccd6, metalness: 1, roughness: 0.25 });
    const glassM = new THREE.MeshPhysicalMaterial({ color: 0x0a0d24, roughness: 0.05, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.03, emissive: 0x241a6a, emissiveIntensity: 0.35 });
    const dz = D * 0.35;
    [[-0.25, 0.25], [-0.25, -0.25], [0.25, 0]].forEach(([fx, fy]) => {
      const x = c.x + fx * s.x * 0.85, y = c.y + fy * s.y * 0.85;
      const body = new THREE.Mesh(slab(r * 2.3, r * 2.3, D * 0.45, r * 0.4, 0.004), housing); body.position.set(x, y, c.z + dz); body.userData.inner = true; parts.cam.add(body);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.95, r * 0.95, D * 0.3, 40).rotateX(PI / 2), ring); barrel.position.set(x, y, c.z + dz * 0.25); parts.cam.add(barrel);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(r * 0.75, 40), glassM); lens.position.set(x, y, c.z + dz * 0.25 - D * 0.151); lens.rotation.y = PI; parts.cam.add(lens);
    });
    anchorsCam = new THREE.Vector3(c.x, cb.max.y + 0.02, c.z);
  }

  // posizione "a riposo" (dentro il telefono) e distanza di esplosione lungo Z
  // ordine dal davanti al retro, come in un esploso tecnico
  const rest = { screen: 0, frame: 0, board: -D * 0.05, battery: -D * 0.1, bottom: -D * 0.05, coil: -D * 0.28, back: 0, cam: 0 };
  const spread = { screen: 1.5, frame: 0.75, board: 0, battery: 0, bottom: 0, coil: -0.75, back: -1.5, cam: -2.25 };
  Object.keys(parts).forEach((n) => { parts[n].userData.rest = rest[n]; });
  // i componenti interni sono nascosti quando il telefono è chiuso
  const innerNames = ['board', 'battery', 'bottom', 'coil'];

  // punti dove agganciare le etichette (in coordinate locali)
  const anchors = {
    screen: new THREE.Vector3(0, H * 0.5, 0),
    frame: new THREE.Vector3(-W * 0.5, H * 0.32, 0),
    board: new THREE.Vector3(0, H * 0.46, 0.02),
    battery: new THREE.Vector3(0, -H * 0.39, 0.03),
    bottom: new THREE.Vector3(0, -H * 0.48, 0.02),
    coil: new THREE.Vector3(0, -H * 0.05 - W * 0.43, 0),
    back: new THREE.Vector3(0, -H * 0.5, -D * 0.3),
    cam: anchorsCam
  };

  // ogni pezzo ha i suoi materiali, così si può sbiadire da solo
  Object.keys(parts).forEach((n) => parts[n].traverse((o) => {
    if (!o.isMesh) return;
    o.material = o.material.clone();
    o.userData.op = o.material.opacity; o.userData.tr = o.material.transparent;
  }));
  const fade = (n, f) => parts[n].traverse((o) => {
    if (!o.isMesh) return;
    const op = o.userData.op * (1 - 0.84 * f);
    const tr = o.userData.tr || op < 0.999;
    if (tr !== o.material.transparent) { o.material.transparent = tr; o.material.needsUpdate = true; }
    o.material.opacity = op;
    o.material.depthWrite = op > 0.5;
  });
  const hiddenWhenClosed = [];
  parts.cam.traverse((o) => { if (o.userData.inner) hiddenWhenClosed.push(o); });
  // ex: quanto è aperto ogni pezzo (0-1); focus: pezzo in evidenza (0-1), gli altri sbiadiscono
  let lastDim = {};
  function apply(ex, focus) {
    const open = Math.max(0, ...Object.keys(parts).map((n) => +ex[n] || 0));
    innerNames.forEach((n) => { parts[n].visible = open > 0.02; });
    hiddenWhenClosed.forEach((o) => { o.visible = (ex.cam || 0) > 0.05; });
    Object.keys(parts).forEach((n) => {
      const p = parts[n], a = ex[n] || 0;
      p.position.set(0, 0, p.userData.rest + spread[n] * a);
      const f = (focus && focus[n]) || 0;
      p.scale.setScalar(1 + 0.1 * f);
    });
    // sbiadisce i pezzi non in evidenza
    let maxF = 0; Object.keys(parts).forEach((n) => { maxF = Math.max(maxF, (focus && focus[n]) || 0); });
    Object.keys(parts).forEach((n) => {
      const f = (focus && focus[n]) || 0, dim = Math.max(0, maxF - f);
      if (Math.abs((lastDim[n] || 0) - dim) > 0.002) { fade(n, dim); lastDim[n] = dim; }
    });
  }
  apply({});
  return { group: root, parts, apply, anchors, size: { W, H, D } };
}

/* =========================================================
   MacBook vero
   ========================================================= */
export async function buildMacbook() {
  const src = await loadGLB('macbook');
  tuneMaterials(src);
  src.traverse((o) => {
    if (o.isMesh && o.material && o.material.name === 'screen.001') o.material = new THREE.MeshBasicMaterial({ map: macScreenTex(false), toneMapped: false });
    if (o.isMesh && o.material && o.material.name === 'aluminium') { o.material = o.material.clone(); o.material.color.set(0xd5d8e0); o.material.roughness = 0.32; }
  });
  const g = new THREE.Group(); g.add(src);
  return normalize(g, 3.2);
}

/* =========================================================
   PS5 e TV: se in assets/models ci sono ps5.glb / tv.glb usa quelli,
   altrimenti li costruisce da codice
   ========================================================= */
export async function buildPS5() {
  try { const s = await loadGLB('ps5'); tuneMaterials(s); const g = new THREE.Group(); g.add(s); return normalize(g, 2.6); }
  catch (e) { return normalize(proceduralPS5(), 2.6); }
}
export async function buildTV() {
  try { const s = await loadGLB('tv'); tuneMaterials(s); const g = new THREE.Group(); g.add(s); return normalize(g, 3.6); }
  catch (e) { const t = proceduralTV(); const g = normalize(t.group, 3.6); g.userData.tick = t.tick; return g; }
}

/* ---------- guscio curvo: un profilo 2D (z, y) diventa un pannello spesso,
   con bordo arrotondato e superficie piegata da deform(z, y) ---------- */
function shellPanel(shape, th, deform, sgn) {
  const pts = shape.getSpacedPoints(180); pts.pop();
  const N = pts.length, c = new THREE.Vector2();
  pts.forEach((p) => c.add(p)); c.divideScalar(N);
  const nrm = pts.map((p, i) => {
    const a = pts[(i - 1 + N) % N], b = pts[(i + 1) % N];
    const n = new THREE.Vector2(b.y - a.y, -(b.x - a.x)).normalize();
    return n.dot(p.clone().sub(c)) < 0 ? n.negate() : n;
  });
  const h = th / 2, rows = [];
  const T = [0, 0.12, 0.25, 0.38, 0.5, 0.62, 0.72, 0.81, 0.88, 0.93, 0.97, 1];
  T.forEach((t) => rows.push({ t, a: 0 }));
  for (let k = 1; k < 8; k++) rows.push({ t: 1, a: (k / 8) * PI });
  T.slice().reverse().forEach((t) => rows.push({ t, a: PI }));
  const pos = [];
  rows.forEach((r) => {
    for (let i = 0; i < N; i++) {
      const z = c.x + (pts[i].x - c.x) * r.t + nrm[i].x * h * Math.sin(r.a);
      const y = c.y + (pts[i].y - c.y) * r.t + nrm[i].y * h * Math.sin(r.a);
      pos.push(sgn * (h * Math.cos(r.a) + deform(z, y)), y, z);
    }
  });
  const idx = [];
  for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < N; i++) {
    const a = j * N + i, b = j * N + (i + 1) % N, d = (j + 1) * N + i, e = (j + 1) * N + (i + 1) % N;
    idx.push(a, d, b, b, d, e);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  // la faccia esterna deve guardare verso l'esterno: se no, inverte i triangoli
  const nx = g.attributes.normal.getX(N * 4 + 3);
  if (nx * sgn < 0) { for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; } g.setIndex(idx); g.computeVertexNormals(); }
  return g;
}

/* =========================================================
   PS5 (edizione con lettore, in piedi) — ricostruita da codice
   misure reali in proporzione: 39 × 10,4 × 26 cm
   ========================================================= */
function proceduralPS5() {
  const root = new THREE.Group();
  const white = new THREE.MeshPhysicalMaterial({ color: 0xe4e6eb, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.4, sheen: 0.3, sheenColor: 0xffffff });
  const gloss = new THREE.MeshPhysicalMaterial({ color: 0x0c0d12, roughness: 0.16, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 });
  const matte = new THREE.MeshStandardMaterial({ color: 0x07080b, roughness: 0.85 });
  const grey = new THREE.MeshStandardMaterial({ color: 0x1b1d24, roughness: 0.55, metalness: 0.3 });
  const glow = new THREE.MeshBasicMaterial({ color: 0x3f8dff, toneMapped: false });

  // profilo laterale dei pannelli bianchi: bordo anteriore concavo che si apre in alto
  const s = new THREE.Shape();
  s.moveTo(-1.0, -1.95); s.lineTo(0.96, -1.95);
  s.quadraticCurveTo(1.1, -1.95, 1.1, -1.78);
  s.bezierCurveTo(1.03, -0.7, 1.04, 0.85, 1.34, 1.84);
  s.quadraticCurveTo(1.39, 2.0, 1.22, 2.0);
  s.bezierCurveTo(0.45, 1.9, -0.55, 1.9, -1.2, 2.0);
  s.quadraticCurveTo(-1.37, 2.0, -1.33, 1.84);
  s.bezierCurveTo(-1.05, 0.85, -1.04, -0.7, -1.14, -1.78);
  s.quadraticCurveTo(-1.14, -1.95, -1.0, -1.95);
  // pancia curva, più ampia in alto (le "ali" si aprono a V)
  const bulge = (z, y) => {
    const zn = Math.min(Math.abs(z) / 1.36, 1), yn = (y + 1.95) / 3.95;
    return 0.15 * Math.pow(1 - zn * zn, 0.75) * (0.72 + 0.28 * yn) + 0.05 * yn;
  };
  const th = 0.04;
  const R = new THREE.Mesh(shellPanel(s, th, bulge, 1), white); R.position.x = 0.3 + th / 2; root.add(R);
  const L = new THREE.Mesh(shellPanel(s, th, bulge, -1), white); L.position.x = -0.3 - th / 2; root.add(L);

  // anima nera lucida
  const core = new THREE.Mesh(slab(2.26, 3.76, 0.6, 0.2, 0.05), gloss); core.rotation.y = PI / 2; core.position.y = 0.0; root.add(core);
  const F = 1.13;                          // faccia anteriore dell'anima (z)
  // prese d'aria: lamelle in alto sul fronte e sulla sommità
  const slat = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.012, 0.02), matte, 22), m4 = new THREE.Matrix4();
  for (let i = 0; i < 22; i++) { m4.makeTranslation(0, 1.18 + i * 0.026, F + 0.004); slat.setMatrixAt(i, m4); }
  root.add(slat);
  const top = new THREE.InstancedMesh(new THREE.BoxGeometry(0.46, 0.02, 0.014), matte, 60);
  for (let i = 0; i < 60; i++) { m4.makeTranslation(0, 1.884, -1.0 + i * 0.034); top.setMatrixAt(i, m4); }
  root.add(top);
  // barra luminosa: corre nella fessura tra anima e pannelli
  [-1, 1].forEach((k) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.012, 3.3, 0.012), glow); bar.position.set(k * 0.302, 0.05, F - 0.02); root.add(bar);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 3.3), new THREE.MeshBasicMaterial({ color: 0x3f8dff, transparent: true, opacity: 0.25, toneMapped: false, depthWrite: false }));
    halo.position.set(k * 0.3, 0.05, F + 0.002); root.add(halo);
  });
  // fronte in basso: USB-A, USB-C, tasti di accensione ed espulsione
  const port = (w, hh, y) => {
    const fr = new THREE.Mesh(rrPlane(w, hh, Math.min(w, hh) * 0.3), grey); fr.position.set(0, y, F + 0.003); root.add(fr);
    const hole = new THREE.Mesh(rrPlane(w * 0.78, hh * 0.6, Math.min(w, hh) * 0.2), matte); hole.position.set(0, y, F + 0.004); root.add(hole);
  };
  port(0.16, 0.06, -1.42); port(0.11, 0.04, -1.3);
  const btn = (y) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.018, 0.012), grey); b.position.set(0, y, F + 0.004); root.add(b); };
  btn(-1.62); btn(-1.68);
  // fessura del lettore disco, sul lato destro del fronte
  const disc = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.95, 0.01), matte); disc.position.set(0.22, -0.9, F + 0.004); root.add(disc);
  // piccolo logo PlayStation inciso (tre tratti stilizzati)
  const logo = new THREE.Mesh(rrPlane(0.07, 0.07, 0.01), grey); logo.position.set(0, 1.0, F + 0.004); root.add(logo);
  // base circolare
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.54, 0.07, 72), new THREE.MeshPhysicalMaterial({ color: 0x15161b, roughness: 0.4, clearcoat: 0.6 }));
  stand.position.y = -1.94; root.add(stand);
  return root;
}

/* =========================================================
   TV OLED sottile su piedistallo centrale
   ========================================================= */
function proceduralTV() {
  const root = new THREE.Group(), W = 3.2, H = 1.82;
  const metal = new THREE.MeshStandardMaterial({ color: 0x3a3d46, metalness: 0.9, roughness: 0.28 });
  const backM = new THREE.MeshStandardMaterial({ color: 0x1d1f25, metalness: 0.35, roughness: 0.6 });
  const black = new THREE.MeshPhysicalMaterial({ color: 0x050608, roughness: 0.12, clearcoat: 1 });
  // pannello sottilissimo con cornice metallica
  root.add(new THREE.Mesh(slab(W, H, 0.022, 0.01, 0.005), metal));
  const bez = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.016, H - 0.016), black); bez.position.z = 0.0112; root.add(bez);
  const tex = tvTex(); drawTV(tex, 0);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.05, H - 0.05), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  scr.position.z = 0.0116; root.add(scr);
  // vetro: riflette l'ambiente senza coprire l'immagine
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.016, H - 0.016), new THREE.MeshPhysicalMaterial({ color: 0x000000, transparent: true, opacity: 0.12, roughness: 0.04, metalness: 1, depthWrite: false }));
  glass.position.z = 0.012; root.add(glass);
  // striscia inferiore con logo e led
  const chin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, 0.02), metal); chin.position.set(0, -H / 2 - 0.006, 0.004); root.add(chin);
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 0.004), new THREE.MeshBasicMaterial({ color: 0xff4040, toneMapped: false })); led.position.set(0.14, -H / 2 - 0.004, 0.012); root.add(led);
  // scocca posteriore: più spessa in basso, con griglie e attacco VESA
  const hump = new THREE.Mesh(slab(W * 0.82, H * 0.5, 0.11, 0.06, 0.03), backM); hump.position.set(0, -H * 0.2, -0.066); root.add(hump);
  const grille = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.008, 0.004), new THREE.MeshStandardMaterial({ color: 0x0b0c0f, roughness: 0.9 }), 16), m4 = new THREE.Matrix4();
  for (let i = 0; i < 16; i++) { m4.makeTranslation(-0.75, -0.55 + i * 0.03, -0.123); grille.setMatrixAt(i, m4); }
  root.add(grille);
  const ports = new THREE.Mesh(slab(0.5, 0.36, 0.01, 0.02, 0.003), new THREE.MeshStandardMaterial({ color: 0x0e0f13, roughness: 0.7 })); ports.position.set(0.85, -0.35, -0.124); root.add(ports);
  for (let i = 0; i < 4; i++) {
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.01, 16), metal);
    v.rotation.x = PI / 2; v.position.set(i % 2 ? 0.2 : -0.2, i < 2 ? 0.0 : -0.4, -0.123); root.add(v);
  }
  // piedistallo centrale: collo inclinato + piastra arrotondata
  const neck = new THREE.Mesh(slab(0.34, 0.5, 0.05, 0.04, 0.012), metal);
  neck.position.set(0, -H / 2 - 0.12, -0.11); neck.rotation.x = 0.28; root.add(neck);
  const plate = new THREE.Mesh(slab(1.2, 0.5, 0.035, 0.22, 0.012), metal);
  plate.rotation.x = -PI / 2; plate.position.set(0, -H / 2 - 0.355, 0.0); root.add(plate);
  return { group: root, tick: (t) => drawTV(tex, t) };
}


/* =========================================================
   IL BANCO DEL TECNICO — ricostruito da codice
   Tappetino in silicone antistatico (blu del logo) con griglia e
   righelli, e gli attrezzi veri di una riparazione: cacciavite di
   precisione, pinzette, leva in nylon, plettro, ventosa e viti.
   Scala: 1 unità = 80 mm (l'iPhone è alto 2 unità = 160 mm).
   Il tappetino sta sul piano XY e guarda verso +Z.
   ========================================================= */
const MM = 1 / 80;
const MAT_W = 760, MAT_H = 500;                    // tappetino da banco 760 × 500 mm
function matTexture() {
  const W = 4096, H = Math.round(4096 * MAT_H / MAT_W), PX = W / MAT_W;
  return canvasTex(W, H, (x) => {
    x.fillStyle = '#16276b'; x.fillRect(0, 0, W, H);
    // grana del silicone
    const R = rng(11);
    for (let i = 0; i < 12000; i++) { x.fillStyle = 'rgba(255,255,255,' + (R() * 0.035) + ')'; x.fillRect(R() * W, R() * H, 2, 2); }
    // griglia: 1 cm sottile, 5 cm più marcata
    for (let mm = 0; mm <= MAT_W; mm += 10) {
      x.fillStyle = mm % 50 === 0 ? 'rgba(225,232,255,.13)' : 'rgba(225,232,255,.045)';
      x.fillRect(mm * PX - 1, 0, mm % 50 === 0 ? 3 : 2, H);
    }
    for (let mm = 0; mm <= MAT_H; mm += 10) {
      x.fillStyle = mm % 50 === 0 ? 'rgba(225,232,255,.13)' : 'rgba(225,232,255,.045)';
      x.fillRect(0, mm * PX - 1, W, mm % 50 === 0 ? 3 : 2);
    }
    // righelli sui bordi, in millimetri
    x.fillStyle = 'rgba(232,238,255,.42)'; x.font = '500 ' + Math.round(3.4 * PX) + 'px "Geist Mono", ui-monospace, monospace'; x.textAlign = 'center';
    for (let mm = 0; mm <= MAT_W; mm += 1) {
      const l = (mm % 10 === 0 ? 40 : mm % 5 === 0 ? 26 : 14) * PX / 8;
      x.fillRect(mm * PX - 1, 0, 2, l); x.fillRect(mm * PX - 1, H - l, 2, l);
      if (mm % 10 === 0 && mm > 0 && mm < MAT_W) { x.fillText(String(mm / 10), mm * PX, 9 * PX); x.fillText(String(mm / 10), mm * PX, H - 6 * PX); }
    }
    x.textAlign = 'left';
    for (let mm = 0; mm <= MAT_H; mm += 1) {
      const l = (mm % 10 === 0 ? 40 : mm % 5 === 0 ? 26 : 14) * PX / 8;
      x.fillRect(0, mm * PX - 1, l, 2); x.fillRect(W - l, mm * PX - 1, l, 2);
      if (mm % 10 === 0 && mm > 0 && mm < MAT_H) x.fillText(String(mm / 10), 7 * PX, mm * PX + 1.2 * PX);
    }
    // goniometro nell'angolo e marchio
    x.strokeStyle = 'rgba(232,238,255,.16)'; x.lineWidth = 0.4 * PX;
    const cx = W - 60 * PX, cy = H - 40 * PX;
    [25, 30].forEach((r) => { x.beginPath(); x.arc(cx, cy, r * PX, Math.PI, Math.PI * 1.5); x.stroke(); });
    for (let a = 0; a <= 90; a += 5) {
      const t = Math.PI + (a / 90) * Math.PI / 2, r1 = 25 * PX, r2 = (a % 15 === 0 ? 30 : 27.5) * PX;
      x.beginPath(); x.moveTo(cx + Math.cos(t) * r1, cy + Math.sin(t) * r1); x.lineTo(cx + Math.cos(t) * r2, cy + Math.sin(t) * r2); x.stroke();
    }
    x.fillStyle = 'rgba(232,238,255,.35)'; x.font = '500 ' + Math.round(3.6 * PX) + 'px "Geist Mono", ui-monospace, monospace';
    x.fillText('NEW CONNECTION — VALMONTONE', 14 * PX, H - 14 * PX);
    x.textAlign = 'right'; x.fillText('ESD · ' + MAT_W + ' × ' + MAT_H + ' mm', W - 12 * PX, 16 * PX);
  });
}

function siliconeMaps() {
  const bump = canvasTex(1024, 1024, (x, w, h) => {
    const R = rng(29); x.fillStyle = '#808080'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 90000; i++) { const v = 100 + R() * 56 | 0; x.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; x.fillRect(R() * w, R() * h, 1 + R() * 2, 1 + R() * 2); }
  });
  bump.colorSpace = THREE.NoColorSpace; bump.wrapS = bump.wrapT = THREE.RepeatWrapping; bump.repeat.set(8, 5);
  const rough = canvasTex(512, 512, (x, w, h) => {
    const R = rng(41); x.fillStyle = '#d0d0d0'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) { const g = x.createRadialGradient(R() * w, R() * h, 0, R() * w, R() * h, 40 + R() * 120); g.addColorStop(0, 'rgba(150,150,150,.35)'); g.addColorStop(1, 'rgba(150,150,150,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }
  });
  rough.colorSpace = THREE.NoColorSpace;
  return { bump, rough };
}

function knurledHandle(len, r, mat, ringMat) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 40), mat); g.add(body);
  const n = Math.floor(len / (r * 0.55));
  for (let i = 0; i < n; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.005, r * 0.06, 6, 40), ringMat);
    ring.rotation.x = PI / 2; ring.position.y = -len / 2 + r * 0.6 + i * (len - r * 1.2) / (n - 1); g.add(ring);
  }
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.92, r * 0.92, r * 0.5, 40), ringMat); cap.position.y = len / 2 + r * 0.25; g.add(cap);
  return g;
}

export function buildBench() {
  const bench = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0xb9bcc2, metalness: 1, roughness: 0.34, envMapIntensity: 1.2 });
  const anod = new THREE.MeshStandardMaterial({ color: 0x2a2c31, metalness: 0.8, roughness: 0.42 });
  const nylon = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.7 });
  const amber = new THREE.MeshStandardMaterial({ color: 0xff8a3a, roughness: 0.55 });
  const sil = new THREE.MeshPhysicalMaterial({ color: 0xd9dde4, roughness: 0.35, transmission: 0.0, clearcoat: 0.6 });

  // tappetino 760 × 500 × 3 mm
  const mat = new THREE.Mesh(slab(MAT_W * MM, MAT_H * MM, 3 * MM, 10 * MM, 1.2 * MM),
    [(() => { const m = siliconeMaps(); return new THREE.MeshStandardMaterial({ map: matTexture(), roughness: 0.78, roughnessMap: m.rough, bumpMap: m.bump, bumpScale: 0.6, envMapIntensity: 0.55 }); })(), new THREE.MeshStandardMaterial({ color: 0x10225f, roughness: 0.9 })]);
  // ExtrudeGeometry: gruppo 0 = facce, gruppo 1 = bordi
  mat.receiveShadow = true; bench.add(mat);
  // le UV dell'estrusione vanno da -w/2..w/2: normalizzale sulla faccia
  const uv = mat.geometry.attributes.uv, pos = mat.geometry.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / (MAT_W * MM) + 0.5, pos.getY(i) / (MAT_H * MM) + 0.5);
  const top = 1.5 * MM;
  const lay = (obj, x, y, rotZ, lift) => { obj.position.set(x, y, top + lift); obj.rotation.z = rotZ; obj.traverse((o) => { if (o.isMesh) o.castShadow = true; }); bench.add(obj); return obj; };

  // cacciavite di precisione: manico zigrinato 95 mm, asta 60 mm
  const sd = new THREE.Group();
  const handle = knurledHandle(95 * MM, 7 * MM, anod, steel); sd.add(handle);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.4 * MM, 1.4 * MM, 60 * MM, 16), steel); shaft.position.y = -(95 + 60) / 2 * MM; sd.add(shaft);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(1.4 * MM, 4 * MM, 6), steel); tip.rotation.x = PI; tip.position.y = -(95 / 2 + 62) * MM; sd.add(tip);
  const sdHold = new THREE.Group(); sdHold.add(sd); lay(sdHold, 1.75, -1.0, -0.95, 7 * MM);

  // pinzette 120 mm in acciaio
  const tw = new THREE.Group();
  const legShape = new THREE.Shape(); legShape.moveTo(0, 0); legShape.lineTo(120 * MM, 1.2 * MM); legShape.lineTo(120 * MM, 2.2 * MM); legShape.lineTo(0, 9 * MM); legShape.lineTo(0, 0);
  const legGeo = new THREE.ExtrudeGeometry(legShape, { depth: 1.2 * MM, bevelEnabled: true, bevelSize: 0.3 * MM, bevelThickness: 0.3 * MM, bevelSegments: 2 });
  const l1 = new THREE.Mesh(legGeo, steel); l1.rotation.z = 0.035; tw.add(l1);
  const l2 = new THREE.Mesh(legGeo, steel); l2.scale.y = -1; l2.position.y = 12 * MM; l2.rotation.z = -0.035; tw.add(l2);
  lay(tw, -2.45, 1.05, -0.22, 0);

  // leva in nylon (spudger) 140 mm
  const sp = new THREE.Shape(); sp.moveTo(0, -4 * MM); sp.lineTo(110 * MM, -5 * MM); sp.quadraticCurveTo(140 * MM, -2 * MM, 140 * MM, 0); sp.quadraticCurveTo(140 * MM, 2 * MM, 110 * MM, 5 * MM); sp.lineTo(0, 4 * MM); sp.quadraticCurveTo(-8 * MM, 0, 0, -4 * MM);
  lay(new THREE.Mesh(new THREE.ExtrudeGeometry(sp, { depth: 3 * MM, bevelEnabled: true, bevelSize: 0.8 * MM, bevelThickness: 0.8 * MM, bevelSegments: 2 }), nylon), -2.55, -1.3, 0.1, 0);

  // plettri di apertura
  const pick = new THREE.Shape(); pick.moveTo(0, 14 * MM); pick.quadraticCurveTo(14 * MM, 14 * MM, 13 * MM, 0); pick.quadraticCurveTo(10 * MM, -10 * MM, 0, -16 * MM); pick.quadraticCurveTo(-10 * MM, -10 * MM, -13 * MM, 0); pick.quadraticCurveTo(-14 * MM, 14 * MM, 0, 14 * MM);
  const pickGeo = new THREE.ExtrudeGeometry(pick, { depth: 0.6 * MM, bevelEnabled: false });
  lay(new THREE.Mesh(pickGeo, amber), 2.05, 1.25, 0.6, 0);
  lay(new THREE.Mesh(pickGeo, amber), 2.3, 1.1, -0.3, 0.7 * MM);

  // ventosa con anello
  const cup = new THREE.Group();
  const prof = []; for (let i = 0; i <= 16; i++) { const t = i / 16; prof.push(new THREE.Vector2(22 * MM * Math.sin(t * PI / 2), 9 * MM * Math.cos(t * PI / 2))); }
  const dome = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), sil); dome.rotation.x = PI / 2; cup.add(dome);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(12 * MM, 2 * MM, 12, 40), anod); ring.position.z = 14 * MM; ring.rotation.y = PI / 2; cup.add(ring);
  lay(cup, 1.25, 1.35, 0, 0);

  // viti sfuse
  const R = rng(5);
  for (let i = 0; i < 7; i++) {
    const sc = new THREE.Group();
    const head = new THREE.Mesh(new THREE.CylinderGeometry(1.1 * MM, 1.1 * MM, 0.6 * MM, 16), steel); sc.add(head);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.6 * MM, 0.6 * MM, 3 * MM, 10), steel); body.position.y = -1.8 * MM; sc.add(body);
    sc.rotation.x = PI / 2 * (R() > 0.5 ? 1 : 0.5);
    lay(sc, 1.55 + R() * 0.6, -0.35 - R() * 0.3, R() * PI, 1.1 * MM);
  }
  return bench;
}


/* =========================================================
   ALTRI DISPOSITIVI — ricostruiti da codice (img2threejs)
   Android, notebook Windows, PC fisso, PS4, Xbox Series X.
   Proporzioni dalle misure reali; dettagli identificativi:
   foro fotocamera, obiettivi in colonna, profilo a parallelogramma
   della PS4, griglia circolare dell'Xbox.
   ========================================================= */
function androidScreenTex() {
  return canvasTex(600, 1280, (x, w, h) => {
    screenArt(x, w, h);
    x.textAlign = 'left';
    x.font = '200 190px ' + FONT; x.fillText('10:08', 50, 330);
    x.font = '300 34px ' + FONT; x.globalAlpha = .85; x.fillText('mercoledì 14 ottobre', 56, 390); x.globalAlpha = 1;
    x.textAlign = 'center';
    usbMotif(x, w / 2, 860, 330);
    x.font = '200 46px ' + FONT; x.fillText('NEW', w / 2, 940);
    x.font = '800 58px ' + FONT; x.fillText('CONNECTION', w / 2, 1002);
  });
}
function winScreenTex() {
  return canvasTex(1440, 900, (x, w, h) => {
    screenArt(x, w, h);
    x.font = '200 120px ' + FONT; x.fillText('NEW', w / 2, h / 2 - 20);
    x.font = '800 150px ' + FONT; x.fillText('CONNECTION', w / 2, h / 2 + 120);
    x.fillStyle = 'rgba(10,12,30,.55)'; x.fillRect(0, h - 64, w, 64);
    for (let i = 0; i < 7; i++) { x.fillStyle = i === 0 ? '#4aa3ff' : 'rgba(255,255,255,.55)'; rect(x, w / 2 - 210 + i * 60, h - 50, 38, 38, 9); x.fill(); }
    x.fillStyle = 'rgba(255,255,255,.85)'; x.font = '400 22px ' + FONT; x.textAlign = 'right'; x.fillText('10:08', w - 30, h - 24);
  });
}

export async function buildAndroid() {
  const g = new THREE.Group(), W = 0.74, H = 1.56, D = 0.078;
  const alu = new THREE.MeshStandardMaterial({ color: 0x8d93a3, metalness: 1, roughness: 0.32 });
  const back = new THREE.MeshPhysicalMaterial({ color: 0x2c2f3b, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.15 });
  const black = new THREE.MeshPhysicalMaterial({ color: 0x050608, roughness: 0.1, clearcoat: 1 });
  g.add(new THREE.Mesh(slab(W, H, D, 0.085, 0.008), alu));
  const front = new THREE.Mesh(rrPlane(W - 0.016, H - 0.016, 0.078), black); front.position.z = D / 2 + 0.0004; g.add(front);
  const scr = new THREE.Mesh(rrPlane(W - 0.05, H - 0.05, 0.07), new THREE.MeshBasicMaterial({ map: androidScreenTex(), toneMapped: false })); scr.position.z = D / 2 + 0.0008; g.add(scr);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.017, 32), new THREE.MeshBasicMaterial({ color: 0x000000 })); hole.position.set(0, H / 2 - 0.07, D / 2 + 0.0012); g.add(hole);
  const bk = new THREE.Mesh(rrPlane(W - 0.016, H - 0.016, 0.078), back); bk.rotation.y = PI; bk.position.z = -D / 2 - 0.0004; g.add(bk);
  // tre obiettivi in colonna, in alto a sinistra guardando il retro
  for (let i = 0; i < 3; i++) {
    const lens = new THREE.Group(); lens.position.set(W / 2 - 0.15, H / 2 - 0.17 - i * 0.135, -D / 2);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.016, 48), alu); ring.rotation.x = PI / 2; ring.position.z = -0.008; lens.add(ring);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.04, 40), black); glass.rotation.y = PI; glass.position.z = -0.0165; lens.add(glass);
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.014, 24), new THREE.MeshBasicMaterial({ color: 0x232a55 })); iris.rotation.y = PI; iris.position.z = -0.017; lens.add(iris);
    g.add(lens);
  }
  const flash = new THREE.Mesh(new THREE.CircleGeometry(0.014, 20), new THREE.MeshBasicMaterial({ color: 0xfff1c8 })); flash.rotation.y = PI; flash.position.set(W / 2 - 0.27, H / 2 - 0.17, -D / 2 - 0.001); g.add(flash);
  [[0.34, 0.16], [0.12, 0.08]].forEach(([y, h]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.012, h, 0.03), alu); b.position.set(W / 2 + 0.004, y, 0); g.add(b); });
  return normalize(g, 2);
}

export async function buildLaptop() {
  const src = await loadGLB('macbook');
  tuneMaterials(src);
  src.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    if (o.material.name === 'screen.001') o.material = new THREE.MeshBasicMaterial({ map: winScreenTex(), toneMapped: false });
    else if (o.material.name === 'aluminium') { o.material = o.material.clone(); o.material.color.set(0x2b2e36); o.material.roughness = 0.5; o.material.metalness = 0.6; }
  });
  const g = new THREE.Group(); g.add(src);
  return normalize(g, 3.2);
}

export async function buildDesktop() {
  const g = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: 0x15161b, roughness: 0.5, metalness: 0.4 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x9da2ad, metalness: 1, roughness: 0.3 });
  // monitor 27"
  const mon = new THREE.Group(); mon.position.set(-0.55, 0.35, 0); g.add(mon);
  mon.add(new THREE.Mesh(slab(2.4, 1.38, 0.05, 0.03, 0.01), dark));
  const ms = new THREE.Mesh(rrPlane(2.32, 1.3, 0.015), new THREE.MeshBasicMaterial({ map: winScreenTex(), toneMapped: false })); ms.position.z = 0.0262; mon.add(ms);
  const neck = new THREE.Mesh(slab(0.18, 0.62, 0.06, 0.02, 0.01), metal); neck.position.set(0, -0.86, -0.08); mon.add(neck);
  const foot = new THREE.Mesh(slab(0.8, 0.45, 0.03, 0.08, 0.008), metal); foot.rotation.x = -PI / 2; foot.position.set(0, -1.16, 0.02); mon.add(foot);
  // case con vetro laterale e ventole
  const tw = new THREE.Group(); tw.position.set(1.35, -0.18, -0.25); g.add(tw);
  tw.add(new THREE.Mesh(slab(0.62, 1.6, 1.4, 0.04, 0.012), dark));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.45), new THREE.MeshPhysicalMaterial({ color: 0x0a0b10, transparent: true, opacity: 0.55, roughness: 0.05, metalness: 0.2 }));
  glass.rotation.y = -PI / 2; glass.position.x = -0.312; tw.add(glass);
  const fanMat = new THREE.MeshBasicMaterial({ color: 0x5b6dff, toneMapped: false });
  [0.45, 0, -0.45].forEach((y) => { const f = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.012, 8, 48), fanMat); f.rotation.y = PI / 2; f.position.set(-0.25, y, 0.48); tw.add(f); });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 1.5), new THREE.MeshStandardMaterial({ color: 0x0c0d11, roughness: 0.9 })); front.position.z = 0.701; tw.add(front);
  const pw = new THREE.Mesh(new THREE.CircleGeometry(0.025, 24), new THREE.MeshBasicMaterial({ color: 0x8fa8ff })); pw.position.set(0, 0.7, 0.703); tw.add(pw);
  // tastiera
  const kb = new THREE.Mesh(slab(1.5, 0.45, 0.04, 0.03, 0.01), dark); kb.rotation.x = -PI / 2; kb.position.set(-0.55, -0.79, 0.75); g.add(kb);
  return normalize(g, 3.4);
}

export async function buildPS4() {
  const g = new THREE.Group();
  const matte = new THREE.MeshStandardMaterial({ color: 0x111216, roughness: 0.75 });
  const gloss = new THREE.MeshPhysicalMaterial({ color: 0x0b0c10, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.3, envMapIntensity: 0.5 });
  // profilo laterale a parallelogramma: 305 mm di profondità, 53 mm di altezza
  const prof = (y0, y1) => { const s = new THREE.Shape(); const k = 0.26;
    s.moveTo(-1.52 + k * (y0 + 0.27), y0); s.lineTo(1.52 - k * (0.27 - y0), y0); s.lineTo(1.52 - k * (0.27 - y1), y1); s.lineTo(-1.52 + k * (y1 + 0.27), y1); s.lineTo(-1.52 + k * (y0 + 0.27), y0); return s; };
  const block = (y0, y1, x0, x1, mat) => {
    const geo = new THREE.ExtrudeGeometry(prof(y0, y1), { depth: x1 - x0, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2 });
    geo.translate(0, 0, x0); const m = new THREE.Mesh(geo, mat); m.rotation.y = PI / 2; g.add(m); return m;
  };
  block(-0.265, -0.05, -1.375, 1.375, matte);        // parte bassa
  block(-0.02, 0.265, -1.375, 0.35, matte);          // sopra, opaca
  block(-0.02, 0.265, 0.39, 1.375, gloss);           // sopra, lucida
  const groove = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.03, 2.9), new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.9 })); groove.position.y = -0.035; g.add(groove);
  const light = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.012, 2.9), new THREE.MeshBasicMaterial({ color: 0x3f8dff, toneMapped: false })); light.position.set(-0.37, 0.27, 0); g.add(light);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.012, 0.01), new THREE.MeshBasicMaterial({ color: 0x000000 })); slot.position.set(-0.35, 0.12, 1.47); slot.rotation.x = 0.25; g.add(slot);
  return normalize(g, 2.8);
}

export async function buildXbox() {
  const g = new THREE.Group();
  const black = new THREE.MeshStandardMaterial({ color: 0x101113, roughness: 0.8, metalness: 0.1 });
  g.add(new THREE.Mesh(slab(0.6, 1.2, 0.6, 0.03, 0.012), black));
  // sommità: griglia circolare di fori con l'interno verde
  const top = canvasTex(512, 512, (x, w) => {
    x.fillStyle = '#121315'; x.fillRect(0, 0, w, w);
    const gr = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w * .42); gr.addColorStop(0, '#2f8f3a'); gr.addColorStop(1, '#0c2a12');
    for (let r = 0; r < 26; r++) for (let c = 0; c < 26; c++) {
      const px = 22 + c * 18.5 + (r % 2) * 9, py = 22 + r * 18.5, d = Math.hypot(px - w / 2, py - w / 2);
      if (d < w * .44) { x.fillStyle = gr; x.beginPath(); x.arc(px, py, 6, 0, PI * 2); x.fill(); }
    }
  });
  const disk = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.58), new THREE.MeshStandardMaterial({ map: top, roughness: 0.7, emissive: 0x0b3d14, emissiveIntensity: 0.4 }));
  disk.rotation.x = -PI / 2; disk.position.y = 0.6011; g.add(disk);
  const fz = 0.3011;
  const pw = new THREE.Mesh(new THREE.CircleGeometry(0.03, 32), new THREE.MeshBasicMaterial({ color: 0xffffff })); pw.position.set(-0.2, 0.48, fz); g.add(pw);
  const slot = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.6), new THREE.MeshBasicMaterial({ color: 0x000000 })); slot.position.set(0.22, 0.05, fz); g.add(slot);
  const usb = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.02), new THREE.MeshBasicMaterial({ color: 0x000000 })); usb.position.set(-0.2, -0.48, fz); g.add(usb);
  return normalize(g, 2.6);
}

/* porta un modello a una dimensione standard e lo centra */
export function normalize(group, size) {
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group), c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
  const k = size / Math.max(s.x, s.y, s.z);
  const inner = new THREE.Group(); group.position.sub(c); inner.add(group); inner.scale.setScalar(k);
  const holder = new THREE.Group(); holder.add(inner);
  holder.userData.tick = group.userData.tick;
  return holder;
}

export function disposeTree(obj) {
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.map && m.map.isCanvasTexture) m.map.dispose(); m.dispose(); });
  });
}
