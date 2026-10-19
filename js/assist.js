/* =========================================================
   ASSISTENZA — i 4 passaggi, con l'iPhone vero legato allo scroll
   ========================================================= */
import { THREE, hasWebGL, makeRenderer, makeScene, buildIphoneExploded } from './nc3d.js';

const wrap = document.getElementById('stepsWrap');
const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;

async function start() {
  if (location.protocol === 'file:') { document.documentElement.classList.add('no-3d'); return; }
  if (!wrap) return;
  if (!gsap || !ScrollTrigger || !hasWebGL()) { document.documentElement.classList.add('no-3d'); return; }
  gsap.registerPlugin(ScrollTrigger);
  const canvas = document.getElementById('stepsCanvas');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = makeRenderer(canvas);
  const scene = makeScene(renderer);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  let phone;
  try { phone = await buildIphoneExploded(); } catch (e) { document.documentElement.classList.add('no-3d'); return; }
  const holder = new THREE.Group(), spin = new THREE.Group();
  spin.add(phone.group); holder.add(spin); scene.add(holder);

  // linea di scansione (diagnosi) e anello luminoso (ritiro)
  const scanMat = new THREE.MeshBasicMaterial({ color: 0x5b7bff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.04), scanMat); scan.position.z = 0.2; spin.add(scan);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x8a5bff, transparent: true, opacity: 0, depthWrite: false });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.012, 12, 120), ringMat); spin.add(halo);

  const zero = () => ({ screen: 0, frame: 0, board: 0, battery: 0, bottom: 0, coil: 0, back: 0, cam: 0 });
  const S = { rx: 0.1, ry: -1.3, scale: 0.9, scanA: 0, scanY: -0.9, haloA: 0, ex: zero() };
  let d = 6, tall = false;
  function layout() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    tall = window.innerWidth < 1001 && !(window.innerWidth > window.innerHeight && window.innerHeight <= 620);
    const t2 = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    d = Math.max(3.4 / t2, 3.6 / (t2 * camera.aspect));
  }
  layout();
  let rt = 0;
  const onResize = () => { layout(); clearTimeout(rt); rt = setTimeout(() => ScrollTrigger.refresh(), 120); };
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  new ResizeObserver(onResize).observe(canvas);

  const steps = wrap.querySelectorAll('.step'), dots = wrap.querySelectorAll('.steps-dots i');
  gsap.set(steps, { autoAlpha: 0 });
  const on = (i) => dots.forEach((el, k) => el.classList.toggle('on', k === i));
  on(0);
  const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: { trigger: wrap, start: 'top top', end: 'bottom bottom', scrub: 1 } });
  const sIn = (i, at) => tl.fromTo(steps[i], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out', onStart: () => on(i), onReverseComplete: () => on(Math.max(0, i - 1)) }, at);
  const sOut = (i, at) => tl.to(steps[i], { autoAlpha: 0, y: -40, duration: 0.45, ease: 'power2.in' }, at);

  tl.to(S, { ry: 0.45, scale: 1, duration: 1.6 }, 0); sIn(0, 0.4); sOut(0, 2.4);                     // 1 porta il dispositivo
  tl.to(S, { ry: -0.15, rx: 0.04, duration: 1.0 }, 2.5);                                            // 2 diagnosi
  tl.to(S, { scanA: 1, duration: 0.3 }, 2.9);
  tl.fromTo(S, { scanY: -0.9 }, { scanY: 0.9, duration: 1.1, ease: 'sine.inOut' }, 2.9);
  tl.to(S, { scanY: -0.9, duration: 1.0, ease: 'sine.inOut' }, 4.0);
  tl.to(S, { scanA: 0, duration: 0.3 }, 4.9);
  sIn(1, 2.9); sOut(1, 4.9);
  tl.to(S, { ry: -0.95, rx: 0.3, scale: 0.78, duration: 1.3 }, 5.0);                               // 3 riparazione
  tl.to(S.ex, { screen: 0.9, frame: 0.6, board: 0.5, battery: 0.5, bottom: 0.5, duration: 1.4 }, 5.2);
  sIn(2, 5.5); sOut(2, 7.4);
  tl.to(S.ex, { screen: 0, frame: 0, board: 0, battery: 0, bottom: 0, duration: 1.3, ease: 'power3.inOut' }, 7.5);   // 4 ritiro
  tl.to(S, { ry: Math.PI * 2 + 0.35, rx: 0.05, scale: 1, duration: 1.5 }, 7.5);
  tl.to(S, { haloA: 0.9, duration: 0.7 }, 8.7);
  sIn(3, 8.2);
  tl.to({}, { duration: 0.8 }, 9.4);

  let visible = true;
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { rootMargin: '200px' }).observe(wrap);
  const clock = new THREE.Clock();
  (function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();
    holder.position.set(0, reduce ? 0 : Math.sin(t) * 0.03, 0);
    holder.scale.setScalar(S.scale);
    spin.rotation.set(S.rx, S.ry, 0);
    phone.apply(S.ex);
    scan.position.y = S.scanY; scanMat.opacity = S.scanA * 0.85;
    halo.scale.setScalar(1 + Math.sin(t * 2) * 0.02); ringMat.opacity = S.haloA * (0.6 + Math.sin(t * 2) * 0.2);
    camera.position.set(0, 0, d); camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  })();
}

start();
