/* =========================================================
   Modelli 3D costruiti con Three.js (r128)
   iPhone scomponibile, MacBook, iMac, PS5, TV
   Tutto è generato dal codice: nessun file esterno da caricare.
   ========================================================= */
(function () {
  'use strict';
  var T = window.THREE;
  if (!T) { window.NC3D = null; return; }
  var PI = Math.PI;
  var FONT = "'Outfit','Helvetica Neue',Helvetica,Arial,sans-serif";

  function hasWebGL() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  // rettangolo con angoli arrotondati, centrato sull'origine
  function rr(w, h, r) {
    var s = new T.Shape(), x = -w / 2, y = -h / 2;
    r = Math.min(r, w / 2 - 0.0001, h / 2 - 0.0001);
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.absarc(x + w - r, y + r, r, -PI / 2, 0, false);
    s.lineTo(x + w, y + h - r);
    s.absarc(x + w - r, y + h - r, r, 0, PI / 2, false);
    s.lineTo(x + r, y + h);
    s.absarc(x + r, y + h - r, r, PI / 2, PI, false);
    s.lineTo(x, y + r);
    s.absarc(x + r, y + r, r, PI, PI * 1.5, false);
    return s;
  }

  // lastra con bordi smussati: w, h, d sono le misure ESTERNE finali
  function slab(w, h, d, r, b) {
    b = b || 0.003;
    var g = new T.ExtrudeGeometry(rr(w - 2 * b, h - 2 * b, Math.max(r - b, 0.002)), {
      depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 20
    });
    g.translate(0, 0, -(d - 2 * b) / 2);
    return g;
  }

  // cornice (anello) con foro centrale
  function ring(w, h, r, wall, d, b) {
    b = b || 0.004;
    var s = rr(w - 2 * b, h - 2 * b, r - b);
    s.holes.push(rr(w - 2 * wall + 2 * b, h - 2 * wall + 2 * b, Math.max(r - wall, 0.01)));
    var g = new T.ExtrudeGeometry(s, {
      depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSegments: 3, bevelSize: b, curveSegments: 20
    });
    g.translate(0, 0, -(d - 2 * b) / 2);
    return g;
  }

  // piano con angoli arrotondati e UV corrette (0..1), per mostrare una texture
  function rrPlane(w, h, r) {
    var g = new T.ShapeGeometry(rr(w, h, r), 20);
    var p = g.attributes.position, uv = g.attributes.uv;
    for (var i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h);
    uv.needsUpdate = true;
    return g;
  }

  function rng(seed) { var s = seed || 1; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  function rect(x, px, py, w, h, r) { if (x.roundRect) x.roundRect(px, py, w, h, r); else x.rect(px, py, w, h); }

  function canvasTex(w, h, draw) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    draw(ctx, w, h);
    var t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    t.anisotropy = 8;
    // quando il font Outfit è pronto, ridisegna la texture
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load('200 40px Outfit'), document.fonts.load('800 40px Outfit')]).then(function () {
        ctx.clearRect(0, 0, w, h); draw(ctx, w, h); t.needsUpdate = true;
      }).catch(function () {});
    }
    return t;
  }

  /* ---------- texture degli schermi ---------- */
  function usbMotif(x, cx, cy, len, col) {
    var g = x.createLinearGradient(cx - len / 2, 0, cx + len / 2, 0);
    g.addColorStop(0, '#1f6bff'); g.addColorStop(1, '#a24bff');
    x.strokeStyle = g; x.lineWidth = 7; x.lineCap = 'round';
    x.beginPath(); x.moveTo(cx - len / 2, cy); x.lineTo(cx + len / 2 - 44, cy); x.stroke();
    x.fillStyle = g;
    var px = cx + len / 2 - 44;
    x.beginPath(); rect(x, px, cy - 22, 36, 44, 9); x.fill();
    x.fillRect(px + 36, cy - 14, 18, 28);
    x.fillStyle = col || '#0a1030';
    x.fillRect(px + 42, cy - 8, 5, 6); x.fillRect(px + 42, cy + 2, 5, 6);
  }

  function phoneScreenTex() {
    return canvasTex(540, 1170, function (x, w, h) {
      var g = x.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#070d36'); g.addColorStop(.45, '#1f6bff'); g.addColorStop(1, '#8a2bff');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      var r = x.createRadialGradient(w * .15, h * .22, 10, w * .15, h * .22, w * 1.05);
      r.addColorStop(0, 'rgba(255,255,255,.42)'); r.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = r; x.fillRect(0, 0, w, h);
      x.textAlign = 'center'; x.fillStyle = '#fff';
      x.font = '200 200px ' + FONT; x.fillText('9:41', w / 2, 360);
      x.font = '300 34px ' + FONT; x.globalAlpha = .85; x.fillText('Benvenuto', w / 2, 420); x.globalAlpha = 1;
      usbMotif(x, w / 2, 720, 330, '#1a1060');
      x.font = '200 46px ' + FONT; x.fillText('NEW', w / 2, 800);
      x.font = '800 58px ' + FONT; x.fillText('CONNECTION', w / 2, 862);
      x.fillStyle = 'rgba(0,0,0,.35)';
      x.beginPath(); x.arc(78, 1060, 36, 0, PI * 2); x.fill();
      x.beginPath(); x.arc(w - 78, 1060, 36, 0, PI * 2); x.fill();
      x.fillStyle = 'rgba(255,255,255,.9)';
      x.fillRect(66, 1046, 24, 28); x.fillRect(w - 94, 1050, 32, 22);
      x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); rect(x, w / 2 - 70, 1128, 140, 7, 4); x.fill();
    });
  }

  function macScreenTex() {
    return canvasTex(1280, 800, function (x, w, h) {
      var g = x.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#060b30'); g.addColorStop(.5, '#1f6bff'); g.addColorStop(1, '#8a2bff');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      var r = x.createRadialGradient(w * .75, h * .2, 10, w * .75, h * .2, w * .7);
      r.addColorStop(0, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = r; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(0, 0, w, 34);
      x.fillStyle = '#fff'; x.font = '600 20px ' + FONT; x.textAlign = 'left'; x.fillText('New Connection    File   Modifica   Vista', 28, 24);
      x.textAlign = 'center';
      x.font = '200 120px ' + FONT; x.fillText('NEW', w / 2, h / 2 - 20);
      x.font = '800 150px ' + FONT; x.fillText('CONNECTION', w / 2, h / 2 + 120);
      usbMotif(x, w / 2, h / 2 + 200, 560, '#1a1060');
      x.fillStyle = 'rgba(255,255,255,.22)'; x.beginPath(); rect(x, w / 2 - 280, h - 96, 560, 76, 24); x.fill();
      var cols = ['#4aa3ff', '#ff6b6b', '#ffd166', '#06d6a0', '#a78bfa', '#f472b6', '#38bdf8'];
      for (var i = 0; i < 7; i++) { x.fillStyle = cols[i]; x.beginPath(); rect(x, w / 2 - 258 + i * 76, h - 86, 56, 56, 14); x.fill(); }
    });
  }

  function batteryTex() {
    return canvasTex(512, 880, function (x, w, h) {
      var R = rng(7);
      x.fillStyle = '#d8dce8'; x.fillRect(0, 0, w, h);
      for (var i = 0; i < h; i += 2) { x.fillStyle = 'rgba(255,255,255,' + (0.05 + R() * 0.12) + ')'; x.fillRect(0, i, w, 1); }
      var g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#1f6bff'); g.addColorStop(1, '#8a2bff');
      x.fillStyle = g; x.fillRect(0, 0, w, 26);
      x.fillStyle = '#0b1020'; x.textAlign = 'left';
      x.font = '800 62px ' + FONT; x.fillText('Li-ion', 36, 120);
      x.font = '400 30px ' + FONT; x.fillText('3,88 V  ·  12,98 Wh', 36, 168);
      x.strokeStyle = '#0b1020'; x.lineWidth = 6; x.strokeRect(36, 220, 150, 70); x.fillStyle = '#0b1020'; x.fillRect(186, 238, 12, 34); x.fillRect(46, 230, 100, 50);
      x.font = '400 26px ' + FONT; x.fillText('Batteria agli ioni di litio', 36, 350); x.fillText('Non perforare · non schiacciare', 36, 388);
      for (var b = 0; b < 46; b++) { x.fillStyle = '#0b1020'; x.fillRect(40 + b * 9.6, 690, R() > .5 ? 5 : 2, 110); }
      x.font = '500 24px ' + FONT; x.fillText('NC-0 4 8 1 5 9 2 6 7 3', 40, 840);
    });
  }

  function pcbTex() {
    return canvasTex(512, 360, function (x, w, h) {
      var R = rng(21);
      x.fillStyle = '#0f3036'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#1d6a74'; x.lineWidth = 2;
      for (var i = 0; i < 70; i++) {
        var px = R() * w, py = R() * h; x.beginPath(); x.moveTo(px, py);
        x.lineTo(px + (R() - .5) * 160, py); x.lineTo(px + (R() - .5) * 160, py + (R() - .5) * 120); x.stroke();
      }
      x.fillStyle = '#d6aa45';
      for (var k = 0; k < 90; k++) { x.beginPath(); x.arc(R() * w, R() * h, 2.4, 0, PI * 2); x.fill(); }
    });
  }

  function tvTex() {
    var c = document.createElement('canvas'); c.width = 640; c.height = 360;
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4;
    t.userData = { ctx: c.getContext('2d') };
    return t;
  }
  function drawTV(t, time) {
    var x = t.userData.ctx, w = 640, h = 360;
    x.fillStyle = '#05081a'; x.fillRect(0, 0, w, h);
    var blobs = [['#1f6bff', 0, 1.0], ['#8a2bff', 2.1, 1.3], ['#2fd0ff', 4.2, .8]];
    for (var i = 0; i < blobs.length; i++) {
      var b = blobs[i], bx = w * (.5 + .38 * Math.sin(time * .6 * b[2] + b[1])), by = h * (.5 + .34 * Math.cos(time * .5 * b[2] + b[1] * 1.3));
      var g = x.createRadialGradient(bx, by, 0, bx, by, 260);
      g.addColorStop(0, b[0]); g.addColorStop(1, 'rgba(5,8,26,0)');
      x.globalAlpha = .85; x.fillStyle = g; x.fillRect(0, 0, w, h);
    }
    x.globalAlpha = 1; x.fillStyle = '#fff'; x.textAlign = 'center';
    x.font = '200 54px ' + FONT; x.fillText('NEW', w / 2, h / 2 - 8);
    x.font = '800 66px ' + FONT; x.fillText('CONNECTION', w / 2, h / 2 + 56);
    t.needsUpdate = true;
  }

  /* ---------- renderer, luci e ambiente ---------- */
  function makeRenderer(canvas) {
    var r = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputEncoding = T.sRGBEncoding;
    r.toneMapping = T.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.1;
    return r;
  }

  // piccolo "studio fotografico" generato al volo: serve ai metalli per riflettere qualcosa
  function makeEnv(renderer) {
    var pm = new T.PMREMGenerator(renderer);
    var s = new T.Scene();
    var sky = new T.Mesh(new T.SphereGeometry(30, 32, 16), new T.ShaderMaterial({
      side: T.BackSide,
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying vec3 vP; void main(){ float h = vP.y * .5 + .5; vec3 top = vec3(.30,.34,.62); vec3 bot = vec3(.02,.025,.06); gl_FragColor = vec4(mix(bot, top, h), 1.0); }'
    }));
    s.add(sky);
    function panel(w, h, color, k, x, y, z) {
      var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(color).multiplyScalar(k), side: T.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
    }
    panel(14, 7, 0xffffff, 7, 0, 10, 7);
    panel(5, 14, 0x3d7cff, 5, -11, 1, 3);
    panel(5, 14, 0xa24bff, 5, 11, 1, -3);
    panel(16, 3, 0xffffff, 3.2, 0, -3, 11);
    panel(8, 8, 0xffffff, 2.2, 0, 2, -12);
    var rt = pm.fromScene(s, 0.04);
    pm.dispose();
    sky.geometry.dispose(); sky.material.dispose();
    return rt.texture;
  }

  function addLights(scene) {
    var key = new T.DirectionalLight(0xffffff, 1.1); key.position.set(3, 5, 6); scene.add(key);
    var blue = new T.PointLight(0x3d7cff, 1.1, 18); blue.position.set(-4, 1, 3); scene.add(blue);
    var vio = new T.PointLight(0xa24bff, 1.1, 18); vio.position.set(4, -1, -2); scene.add(vio);
    scene.add(new T.AmbientLight(0xffffff, 0.12));
  }

  // porta un modello a una dimensione standard e lo centra
  function fit(group, size) {
    var box = new T.Box3().setFromObject(group), c = new T.Vector3(), s = new T.Vector3();
    box.getCenter(c); box.getSize(s);
    var k = size / Math.max(s.x, s.y, s.z);
    var holder = new T.Group();
    group.position.sub(c);
    var inner = new T.Group(); inner.add(group); inner.scale.setScalar(k);
    holder.add(inner);
    return holder;
  }

  function dispose(obj) {
    obj.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) {
          if (m.map && m.map.dispose) m.map.dispose();
          m.dispose();
        });
      }
    });
  }

  /* =========================================================
     iPHONE — scomponibile
     Parti: screen, frame, battery, board, port, coil, back, cam
     La parte anteriore guarda verso +Z.
     ========================================================= */
  function buildPhone() {
    var W = 0.72, H = 1.5, D = 0.078;
    var M = {
      ti: new T.MeshStandardMaterial({ color: 0x8f8d9a, metalness: 1, roughness: 0.3 }),
      tiDark: new T.MeshStandardMaterial({ color: 0x23242d, metalness: 0.85, roughness: 0.45 }),
      black: new T.MeshPhysicalMaterial({ color: 0x04050a, roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04 }),
      back: new T.MeshPhysicalMaterial({ color: 0x3b3f7d, roughness: 0.5, metalness: 0.15, clearcoat: 0.45, clearcoatRoughness: 0.35 }),
      plate: new T.MeshPhysicalMaterial({ color: 0x4a4f94, roughness: 0.22, metalness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.15 }),
      lensGlass: new T.MeshPhysicalMaterial({ color: 0x05060d, roughness: 0.05, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.02 }),
      chip: new T.MeshStandardMaterial({ color: 0xb9bcc9, metalness: 0.9, roughness: 0.35 }),
      chipDark: new T.MeshStandardMaterial({ color: 0x14161e, metalness: 0.4, roughness: 0.5 }),
      gold: new T.MeshStandardMaterial({ color: 0xd8ab45, metalness: 1, roughness: 0.3 }),
      copper: new T.MeshStandardMaterial({ color: 0xc8733a, metalness: 1, roughness: 0.32 }),
      violet: new T.MeshStandardMaterial({ color: 0x8a2bff, roughness: 0.5 })
    };
    var root = new T.Group(), parts = {};
    function part(name) {
      var g = new T.Group(); g.name = name; root.add(g); parts[name] = g;
      g.userData.home = new T.Vector3(); return g;
    }

    /* cornice in titanio + tasti laterali */
    var frame = part('frame');
    frame.add(new T.Mesh(ring(W, H, 0.105, 0.022, D, 0.004), M.ti));
    function sideBtn(x, y, h) {
      var m = new T.Mesh(new T.BoxGeometry(0.014, h, 0.026), M.ti); m.position.set(x, y, 0); frame.add(m);
    }
    sideBtn(-W / 2 - 0.003, 0.5, 0.05); sideBtn(-W / 2 - 0.003, 0.34, 0.1); sideBtn(-W / 2 - 0.003, 0.18, 0.1);
    sideBtn(W / 2 + 0.003, 0.3, 0.17);

    /* schermo: vetro + pannello + Dynamic Island */
    var scr = part('screen');
    var glass = new T.Mesh(slab(W - 0.048, H - 0.048, 0.008, 0.092, 0.002), M.black); glass.position.z = 0.0325; scr.add(glass);
    var disp = new T.Mesh(rrPlane(W - 0.07, H - 0.07, 0.08), new T.MeshBasicMaterial({ map: phoneScreenTex(), toneMapped: false }));
    disp.position.z = 0.0368; scr.add(disp);
    var isl = new T.Mesh(rrPlane(0.17, 0.048, 0.024), new T.MeshBasicMaterial({ color: 0x000000 })); isl.position.set(0, H / 2 - 0.075, 0.0372); scr.add(isl);
    var fcam = new T.Mesh(new T.CircleGeometry(0.0085, 20), new T.MeshBasicMaterial({ color: 0x141a3a })); fcam.position.set(0.045, H / 2 - 0.075, 0.0374); scr.add(fcam);

    /* vetro posteriore + isola delle fotocamere */
    var back = part('back');
    var bg = new T.Mesh(slab(W - 0.048, H - 0.048, 0.012, 0.092, 0.003), M.back); bg.position.z = -0.031; back.add(bg);
    var PX = 0.145, PY = 0.535, PZ = -0.048;
    var plateG = new T.Group(); plateG.position.set(PX, PY, PZ); plateG.rotation.y = PI; back.add(plateG);
    var plate = new T.Mesh(slab(0.37, 0.37, 0.012, 0.075, 0.003), M.plate); plate.position.z = -0.006; plateG.add(plate);
    var flash = new T.Mesh(new T.CircleGeometry(0.016, 24), new T.MeshBasicMaterial({ color: 0xfff1c8 })); flash.position.set(0.105, 0.115, 0.0004); plateG.add(flash);
    var lidar = new T.Mesh(new T.CircleGeometry(0.018, 24), new T.MeshBasicMaterial({ color: 0x0a0b12 })); lidar.position.set(0.105, -0.115, 0.0004); plateG.add(lidar);
    var mic = new T.Mesh(new T.CircleGeometry(0.006, 12), new T.MeshBasicMaterial({ color: 0x0a0b12 })); mic.position.set(0.15, 0.015, 0.0004); plateG.add(mic);

    /* modulo fotocamere (si stacca dal retro) */
    var cam = part('cam');
    cam.position.set(PX, PY, PZ); cam.rotation.y = PI; cam.userData.home.copy(cam.position);
    function lens(lx, ly, r) {
      var g = new T.Group(); g.position.set(lx, ly, 0);
      var base = new T.Mesh(new T.CylinderGeometry(r, r * 1.04, 0.018, 48), M.ti); base.rotation.x = PI / 2; base.position.z = 0.009; g.add(base);
      var inner = new T.Mesh(new T.CylinderGeometry(r * 0.78, r * 0.78, 0.004, 48), M.tiDark); inner.rotation.x = PI / 2; inner.position.z = 0.019; g.add(inner);
      var gl = new T.Mesh(new T.CircleGeometry(r * 0.64, 48), M.lensGlass); gl.position.z = 0.0212; g.add(gl);
      var iris = new T.Mesh(new T.CircleGeometry(r * 0.2, 32), new T.MeshBasicMaterial({ color: 0x3b2b9a })); iris.position.z = 0.0216; g.add(iris);
      cam.add(g);
    }
    lens(-0.085, 0.085, 0.062); lens(-0.085, -0.085, 0.062); lens(0.085, 0, 0.062);

    /* batteria */
    var bat = part('battery');
    var b1 = new T.Mesh(slab(0.5, 0.74, 0.012, 0.03, 0.002), new T.MeshStandardMaterial({ color: 0xc9cdd9, metalness: 0.6, roughness: 0.45 })); b1.position.set(0, -0.12, -0.012); bat.add(b1);
    var b2 = new T.Mesh(new T.PlaneGeometry(0.46, 0.7), new T.MeshBasicMaterial({ map: batteryTex(), toneMapped: false })); b2.position.set(0, -0.12, -0.0057); bat.add(b2);
    [-0.1, 0.1].forEach(function (x) { var t = new T.Mesh(new T.BoxGeometry(0.035, 0.12, 0.002), M.violet); t.position.set(x, -0.5, -0.012); bat.add(t); });

    /* scheda logica */
    var board = part('board');
    var pcb = new T.Mesh(slab(0.62, 0.36, 0.008, 0.03, 0.002), new T.MeshStandardMaterial({ map: pcbTex(), roughness: 0.55, metalness: 0.2 })); pcb.position.set(0, 0.5, -0.012); board.add(pcb);
    var chips = [[-0.12, 0.52, 0.15, 0.15, 'chip'], [0.12, 0.6, 0.12, 0.07, 'chipDark'], [0.2, 0.47, 0.13, 0.08, 'chipDark'], [-0.24, 0.4, 0.09, 0.06, 'chipDark'],
      [-0.22, 0.62, 0.07, 0.05, 'chip'], [0.02, 0.39, 0.1, 0.05, 'chip'], [0.22, 0.38, 0.07, 0.05, 'chip']];
    chips.forEach(function (c) { var m = new T.Mesh(new T.BoxGeometry(c[2], c[3], 0.006), M[c[4]]); m.position.set(c[0], c[1], -0.005); board.add(m); });
    [-0.29, 0.29].forEach(function (x) { var m = new T.Mesh(new T.BoxGeometry(0.022, 0.2, 0.004), M.gold); m.position.set(x, 0.5, -0.0075); board.add(m); });

    /* connettore di ricarica USB-C + altoparlante + taptic engine */
    var port = part('port');
    var pb = new T.Mesh(slab(0.5, 0.14, 0.007, 0.03, 0.002), new T.MeshStandardMaterial({ map: pcbTex(), roughness: 0.55, metalness: 0.2 })); pb.position.set(0, -0.62, -0.0125); port.add(pb);
    var usbc = new T.Mesh(slab(0.075, 0.03, 0.014, 0.014, 0.002), M.chip); usbc.position.set(0, -0.665, -0.007); port.add(usbc);
    var slot = new T.Mesh(rrPlane(0.055, 0.012, 0.006), new T.MeshBasicMaterial({ color: 0x000000 })); slot.position.set(0, -0.665, 0.0002); port.add(slot);
    var taptic = new T.Mesh(slab(0.16, 0.06, 0.012, 0.01, 0.002), M.chipDark); taptic.position.set(-0.17, -0.615, -0.003); port.add(taptic);
    var spk = new T.Mesh(slab(0.12, 0.06, 0.01, 0.01, 0.002), M.chip); spk.position.set(0.17, -0.615, -0.004); port.add(spk);

    /* bobina di ricarica wireless */
    var coil = part('coil');
    [0.21, 0.17, 0.13].forEach(function (r) {
      var t = new T.Mesh(new T.TorusGeometry(r, 0.012, 10, 64), M.copper); t.scale.z = 0.35; t.position.set(0, -0.12, -0.0225); coil.add(t);
    });

    // direzioni dell'esplosione per ogni parte (x, y, z)
    var dirs = {
      screen: [0, 0.05, 1.55], battery: [0, -0.04, 0.85], board: [0, 0.1, 0.85], port: [0, -0.12, 0.85],
      frame: [0, 0, 0], coil: [0, 0, -0.55], back: [0, 0, -1.2], cam: [0, 0.02, -1.85]
    };
    function apply(ex) {
      for (var k in parts) {
        var p = parts[k], d = dirs[k], a = (ex && ex[k]) || 0;
        p.position.set(p.userData.home.x + d[0] * a, p.userData.home.y + d[1] * a, p.userData.home.z + d[2] * a);
      }
    }
    return { group: root, parts: parts, apply: apply, W: W, H: H, D: D };
  }

  /* =========================================================
     MacBook
     ========================================================= */
  function buildMac() {
    var root = new T.Group();
    var al = new T.MeshStandardMaterial({ color: 0xc4c8d3, metalness: 1, roughness: 0.34 });
    var dk = new T.MeshStandardMaterial({ color: 0x0b0c12, roughness: 0.6, metalness: 0.2 });
    var base = new T.Mesh(slab(1.8, 1.2, 0.07, 0.05, 0.012), al); base.rotation.x = -PI / 2; base.position.y = 0.035; root.add(base);
    var well = new T.Mesh(new T.PlaneGeometry(1.64, 0.6), new T.MeshStandardMaterial({ color: 0x15171f, roughness: 0.7 })); well.rotation.x = -PI / 2; well.position.set(0, 0.0712, -0.285); root.add(well);
    var keys = new T.InstancedMesh(new T.BoxGeometry(0.097, 0.012, 0.097), dk, 70), m4 = new T.Matrix4(), n = 0;
    for (var r = 0; r < 5; r++) for (var c = 0; c < 14; c++) { m4.setPosition((c - 6.5) * 0.113, 0.077, -0.53 + r * 0.113); keys.setMatrixAt(n++, m4); }
    root.add(keys);
    var pad = new T.Mesh(new T.BoxGeometry(0.62, 0.002, 0.4), new T.MeshStandardMaterial({ color: 0xaeb3c1, metalness: 0.9, roughness: 0.3 })); pad.position.set(0, 0.0712, 0.38); root.add(pad);
    var hinge = new T.Mesh(new T.CylinderGeometry(0.028, 0.028, 1.5, 24), dk); hinge.rotation.z = PI / 2; hinge.position.set(0, 0.072, -0.6); root.add(hinge);

    var lid = new T.Group(); lid.position.set(0, 0.072, -0.6); lid.rotation.x = -0.2; root.add(lid);
    var shell = new T.Mesh(slab(1.8, 1.2, 0.045, 0.05, 0.01), al); shell.position.set(0, 0.6, 0.0225); lid.add(shell);
    var bez = new T.Mesh(rrPlane(1.74, 1.14, 0.035), new T.MeshBasicMaterial({ color: 0x030409 })); bez.position.set(0, 0.6, 0.0456); lid.add(bez);
    var scr = new T.Mesh(rrPlane(1.66, 1.04, 0.014), new T.MeshBasicMaterial({ map: macScreenTex(), toneMapped: false })); scr.position.set(0, 0.62, 0.0462); lid.add(scr);
    var notch = new T.Mesh(rrPlane(0.2, 0.045, 0.02), new T.MeshBasicMaterial({ color: 0x000000 })); notch.position.set(0, 1.138, 0.0464); lid.add(notch);
    return { group: root };
  }

  /* =========================================================
     iMac
     ========================================================= */
  function buildIMac() {
    var root = new T.Group(), W = 1.8, H = 1.05;
    var body = new T.MeshStandardMaterial({ color: 0xdfe3ee, metalness: 0.7, roughness: 0.35 });
    var m = new T.Mesh(slab(W, H, 0.06, 0.04, 0.01), body); root.add(m);
    var chin = new T.Mesh(new T.PlaneGeometry(W - 0.012, 0.2), new T.MeshStandardMaterial({ color: 0x8f9cff, roughness: 0.55 })); chin.position.set(0, -H / 2 + 0.11, 0.0306); root.add(chin);
    var bez = new T.Mesh(rrPlane(1.74, 0.82, 0.02), new T.MeshBasicMaterial({ color: 0x030409 })); bez.position.set(0, 0.075, 0.0308); root.add(bez);
    var scr = new T.Mesh(rrPlane(1.7, 0.78, 0.014), new T.MeshBasicMaterial({ map: macScreenTex(), toneMapped: false })); scr.position.set(0, 0.075, 0.0312); root.add(scr);
    var neck = new T.Mesh(new T.BoxGeometry(0.4, 0.62, 0.035), body); neck.position.set(0, -H / 2 - 0.27, -0.05); root.add(neck);
    var foot = new T.Mesh(new T.BoxGeometry(0.78, 0.026, 0.46), body); foot.position.set(0, -H / 2 - 0.585, 0); root.add(foot);
    return { group: root };
  }

  /* =========================================================
     PlayStation 5 (in piedi, con pannelli bianchi e anima nera)
     ========================================================= */
  function buildPS5() {
    var root = new T.Group();
    var white = new T.MeshPhysicalMaterial({ color: 0xf3f5fa, roughness: 0.38, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.3 });
    var black = new T.MeshStandardMaterial({ color: 0x0a0b10, roughness: 0.45, metalness: 0.2 });
    function outline(s) {
      var p = new T.Shape();
      p.moveTo(-0.5 * s, -0.95 * s); p.lineTo(0.5 * s, -0.95 * s);
      p.quadraticCurveTo(0.66 * s, -0.95 * s, 0.66 * s, -0.75 * s);
      p.lineTo(0.62 * s, 0.62 * s);
      p.quadraticCurveTo(0.58 * s, 0.95 * s, 0.3 * s, 0.95 * s);
      p.lineTo(-0.3 * s, 0.95 * s);
      p.quadraticCurveTo(-0.6 * s, 0.95 * s, -0.64 * s, 0.62 * s);
      p.lineTo(-0.66 * s, -0.75 * s);
      p.quadraticCurveTo(-0.66 * s, -0.95 * s, -0.5 * s, -0.95 * s);
      return p;
    }
    var panelGeo = new T.ExtrudeGeometry(outline(0.972), { depth: 0.07, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 4, curveSegments: 24 });
    panelGeo.translate(0, 0, -0.035); panelGeo.rotateY(-PI / 2);
    var left = new T.Mesh(panelGeo, white); left.position.x = -0.228; root.add(left);
    var right = new T.Mesh(panelGeo, white); right.position.x = 0.228; root.add(right);
    var coreGeo = new T.ExtrudeGeometry(outline(1), { depth: 0.36, bevelEnabled: false, curveSegments: 24 });
    coreGeo.translate(0, 0, -0.18); coreGeo.rotateY(-PI / 2);
    root.add(new T.Mesh(coreGeo, black));
    var led = new T.Mesh(new T.BoxGeometry(0.22, 0.004, 0.9), new T.MeshBasicMaterial({ color: 0x4aa0ff, toneMapped: false })); led.position.set(0, 0.952, 0); root.add(led);
    var stand = new T.Mesh(new T.CylinderGeometry(0.5, 0.56, 0.07, 56), white); stand.position.y = -0.985; root.add(stand);
    return { group: root };
  }

  /* =========================================================
     TV con schermo animato
     ========================================================= */
  function buildTV() {
    var root = new T.Group(), W = 2.7, H = 1.52;
    var dk = new T.MeshStandardMaterial({ color: 0x0c0d14, metalness: 0.6, roughness: 0.4 });
    root.add(new T.Mesh(slab(W, H, 0.05, 0.025, 0.008), dk));
    var tex = tvTex(); drawTV(tex, 0);
    var scr = new T.Mesh(new T.PlaneGeometry(W - 0.06, H - 0.06), new T.MeshBasicMaterial({ map: tex, toneMapped: false })); scr.position.z = 0.0262; root.add(scr);
    var bk = new T.Mesh(slab(1.3, 0.7, 0.1, 0.04, 0.01), dk); bk.position.set(0, -0.1, -0.07); root.add(bk);
    var neck = new T.Mesh(new T.BoxGeometry(0.14, 0.34, 0.05), dk); neck.position.set(0, -H / 2 - 0.17, -0.03); root.add(neck);
    var base = new T.Mesh(new T.BoxGeometry(0.95, 0.03, 0.36), dk); base.position.set(0, -H / 2 - 0.345, 0.04); root.add(base);
    return { group: root, tick: function (t) { drawTV(tex, t); } };
  }

  window.NC3D = {
    hasWebGL: hasWebGL, makeRenderer: makeRenderer, makeEnv: makeEnv, addLights: addLights,
    fit: fit, dispose: dispose,
    buildPhone: buildPhone,
    models: { iphone: buildPhone, macbook: buildMac, imac: buildIMac, ps5: buildPS5, tv: buildTV }
  };
})();
