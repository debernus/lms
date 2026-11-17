import * as THREE from 'three';
import { canvasTexture } from './halk2.js';

// Arap Camii (Galata, Beyoğlu): tuğla ve taş almaşık duvarlı uzun dikdörtgen gövde, geniş saçaklı kırma
// kiremit çatı, iki sıra kemerli pencere, mermer çerçeveli kapılar; arkada kare planlı tuğla minare
// (eski çan kulesi), tepesinde ahşap fener ve kurşun külah. Şadırvan yoktur.
// 1 birim = 1 metre, Y yukarı, avlu cephesi +Z, taban y = 0'da ve gövde merkezde. Minare arkada (-Z).
// Parçalar: cami_duvar, cami_cati, cami_pencereler, cami_kapilar, minare.

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = v3(0, 1, 0);
const L = 44, W = 20, H = 11.5, EAVE = 1.4, ROOF = 3.8; // gövde boyu (X), eni (Z), duvar yüksekliği, saçak, çatı yüksekliği

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ---------- Dokular ----------
// Almaşık duvar: üç sıra kırmızı tuğla + bir sıra açık taş; 512 px = 2 m
function brickTexture() {
  return canvasTexture('almasik_duvar', 512, 512, (g) => {
    const rand = rng(11);
    g.fillStyle = '#b9ab95';
    g.fillRect(0, 0, 512, 512);
    for (let band = 0; band < 4; band++) {
      const y0 = band * 128;
      for (let row = 0; row < 3; row++) {
        const y = y0 + row * 29;
        for (let k = -1; k < 9; k++) {
          const x = k * 64 + (row % 2) * 32, r = 120 + rand() * 50, gg = 58 + rand() * 26, b = 44 + rand() * 20;
          g.fillStyle = `rgb(${r},${gg},${b})`;
          g.fillRect(x + 2, y + 2, 60, 25);
          g.fillStyle = `rgba(40,20,14,${rand() * 0.25})`;
          g.fillRect(x + 2 + rand() * 30, y + 2, 20 + rand() * 20, 25);
        }
      }
      for (let k = -1; k < 5; k++) {
        const x = k * 128 + (band % 2) * 64, v = 168 + rand() * 40;
        g.fillStyle = `rgb(${v},${v - 12},${v - 36})`;
        g.fillRect(x + 2, y0 + 89, 124, 37);
      }
    }
    // Kir ve is: yumuşak koyu lekeler (kenarlara taşmaz, doku döşenebilir kalır)
    g.filter = 'blur(10px)';
    for (let i = 0; i < 26; i++) {
      g.fillStyle = `rgba(30,22,16,${0.08 + rand() * 0.14})`;
      g.beginPath();
      g.ellipse(70 + rand() * 372, 70 + rand() * 372, 20 + rand() * 40, 16 + rand() * 46, 0, 0, 6.3);
      g.fill();
    }
    g.filter = 'none';
  });
}
// Alaturka kiremit: 256 px = 2 m
function tileTexture() {
  return canvasTexture('kiremit', 256, 256, (g) => {
    const rand = rng(5);
    for (let row = 0; row < 6; row++) for (let k = 0; k < 10; k++) {
      const r = 150 + rand() * 45, gg = 78 + rand() * 28, b = 52 + rand() * 20;
      const grad = g.createLinearGradient(k * 25.6, 0, k * 25.6 + 25.6, 0);
      grad.addColorStop(0, `rgb(${r * 0.55},${gg * 0.55},${b * 0.55})`);
      grad.addColorStop(0.45, `rgb(${r},${gg},${b})`);
      grad.addColorStop(1, `rgb(${r * 0.6},${gg * 0.6},${b * 0.6})`);
      g.fillStyle = grad;
      g.fillRect(k * 25.6, row * 42.67, 25.6, 42.67);
      g.fillStyle = 'rgba(30,14,8,0.45)';
      g.fillRect(k * 25.6, row * 42.67 + 39, 25.6, 3.67);
    }
  });
}
// Alt pencere: koyu cam, demir parmaklık
function windowTexture() {
  return canvasTexture('pencere_cam', 128, 256, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#2a3138');
    grad.addColorStop(1, '#14181c');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 256);
    g.strokeStyle = '#6f6a5c';
    g.lineWidth = 5;
    g.strokeRect(8, 8, 112, 240);
    g.lineWidth = 3;
    for (let x = 36; x < 120; x += 28) g.strokeRect(x, 8, 0.01, 240);
    for (let y = 44; y < 250; y += 36) g.strokeRect(8, y, 112, 0.01);
  });
}
// Üst pencere: alçı şebeke (petek)
function latticeTexture() {
  return canvasTexture('pencere_sebeke', 128, 192, (g) => {
    g.fillStyle = '#ddd6c4';
    g.fillRect(0, 0, 128, 192);
    g.fillStyle = '#1b2024';
    for (let row = 0; row < 9; row++) for (let k = -1; k < 6; k++) {
      g.beginPath();
      g.arc(k * 26 + (row % 2) * 13 + 13, row * 22 + 11, 8.5, 0, 6.3);
      g.fill();
    }
  });
}
// Ahşap kapı
function doorTexture() {
  return canvasTexture('kapi_ahsap', 128, 256, (g) => {
    g.fillStyle = '#4a2a1c';
    g.fillRect(0, 0, 128, 256);
    g.strokeStyle = '#2a160e';
    g.lineWidth = 4;
    g.strokeRect(62, 0, 4, 256);
    for (const [x, y, w, h] of [[10, 30, 44, 90], [74, 30, 44, 90], [10, 136, 44, 100], [74, 136, 44, 100]]) g.strokeRect(x, y, w, h);
  });
}
// Minare feneri: aşı boyalı ahşap, dikdörtgen pencere sırası (bir yüz = bir doku)
function lanternTexture() {
  return canvasTexture('fener_ahsap', 512, 192, (g) => {
    const rand = rng(3);
    g.fillStyle = '#b98a3a';
    g.fillRect(0, 0, 512, 192);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(70,40,10,${0.05 + rand() * 0.1})`;
      g.fillRect(rand() * 512, 0, 2 + rand() * 6, 192);
    }
    g.fillStyle = '#7a5520';
    g.fillRect(0, 0, 512, 14);
    g.fillRect(0, 178, 512, 14);
    for (let k = 0; k < 5; k++) {
      const x = 26 + k * 96;
      g.fillStyle = '#6b4a1c';
      g.fillRect(x, 40, 76, 112);
      g.fillStyle = '#c79a48';
      g.fillRect(x + 8, 48, 60, 96);
      g.strokeStyle = '#6b4a1c';
      g.lineWidth = 3;
      g.strokeRect(x + 38, 48, 0.01, 96);
      g.strokeRect(x + 8, 96, 60, 0.01);
    }
  });
}

// ---------- Ağ kurucu: malzemeye göre gruplanan üçgenler ----------
export class Part {
  constructor(name) {
    this.name = name;
    this.groups = new Map();
  }
  tri(mat, p, uv, hint) {
    if (!this.groups.has(mat)) this.groups.set(mat, { pos: [], uv: [] });
    const g = this.groups.get(mat);
    const n = p[1].clone().sub(p[0]).cross(p[2].clone().sub(p[0]));
    const order = n.dot(hint) < 0 ? [0, 2, 1] : [0, 1, 2];
    for (const i of order) {
      g.pos.push(p[i].x, p[i].y, p[i].z);
      g.uv.push(uv[i][0], uv[i][1]);
    }
  }
  quad(mat, p, uv, hint) {
    this.tri(mat, [p[0], p[1], p[2]], [uv[0], uv[1], uv[2]], hint);
    this.tri(mat, [p[0], p[2], p[3]], [uv[0], uv[2], uv[3]], hint);
  }
  // Dikey yüz: origin'den right yönünde width, y0–y1; doku ölçüsü metre cinsinden (us, vs)
  wall(mat, origin, right, width, y0, y1, normal, us = 2, vs = 2, u0 = null) {
    const a = origin.clone().setY(y0), b = a.clone().addScaledVector(right, width);
    const start = u0 ?? a.dot(right) / us;
    this.quad(mat, [a, b, b.clone().setY(y1), a.clone().setY(y1)], [[start, y0 / vs], [start + width / us, y0 / vs], [start + width / us, y1 / vs], [start, y1 / vs]], normal);
  }
  // Eksenlere dik kutu; faces: gösterilecek yüzler ('+x', '-x', '+z', '-z', '+y', '-y')
  box(mat, x0, x1, y0, y1, z0, z1, faces = ['+x', '-x', '+z', '-z', '+y'], us = 2, vs = 2, perFace = false) {
    const u0 = perFace ? 0 : null;
    if (faces.includes('+z')) this.wall(mat, v3(x0, 0, z1), v3(1, 0, 0), x1 - x0, y0, y1, v3(0, 0, 1), us, vs, u0);
    if (faces.includes('-z')) this.wall(mat, v3(x1, 0, z0), v3(-1, 0, 0), x1 - x0, y0, y1, v3(0, 0, -1), us, vs, u0);
    if (faces.includes('+x')) this.wall(mat, v3(x1, 0, z1), v3(0, 0, -1), z1 - z0, y0, y1, v3(1, 0, 0), us, vs, u0);
    if (faces.includes('-x')) this.wall(mat, v3(x0, 0, z0), v3(0, 0, 1), z1 - z0, y0, y1, v3(-1, 0, 0), us, vs, u0);
    for (const [key, y, n] of [['+y', y1, 1], ['-y', y0, -1]]) {
      if (!faces.includes(key)) continue;
      this.quad(mat, [v3(x0, y, z0), v3(x1, y, z0), v3(x1, y, z1), v3(x0, y, z1)], [[x0 / us, z0 / us], [x1 / us, z0 / us], [x1 / us, z1 / us], [x0 / us, z1 / us]], v3(0, n, 0));
    }
  }
  mesh(materials) {
    const pos = [], uv = [], mats = [];
    const g = new THREE.BufferGeometry();
    for (const [mat, data] of this.groups) {
      g.addGroup(pos.length / 3, data.pos.length / 3, mats.length);
      pos.push(...data.pos);
      uv.push(...data.uv);
      mats.push(materials[mat]);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mats);
    m.name = this.name;
    m.castShadow = m.receiveShadow = true;
    return m;
  }
}

// Kemerli açıklığın dış çizgisi (x, y): alt sol köşeden kemerin üstünden alt sağ köşeye
function archOutline(a, h, pointed) {
  const rise = pointed ? a * 1.35 : a, spring = h - rise, pts = [[-a, 0]];
  const N = 6;
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * (Math.PI / 2);
    pts.push([-a * (pointed ? Math.cos(t) ** 0.75 : Math.cos(t)), spring + rise * Math.sin(t)]);
  }
  for (let i = N - 1; i >= 0; i--) pts.push([-pts[i + 1][0], pts[i + 1][1]]);
  pts.push([a, 0]);
  return pts;
}
// Duvar yüzünde kemerli açıklık: içeri çekik yüzey (cam/kapı), çevresinde çıkıntılı çerçeve.
// P: açıklığın alt orta noktası (duvar yüzünde), R: sağ yön, N: duvarın dış normali.
export function opening(part, { P, R, N, a, h, pointed = false, pane, frame = null, f = 0.22, sill = false, depth = 0.1, base = 0 }) {
  const at = (x, y, d) => P.clone().addScaledVector(R, x).addScaledVector(UP, y).addScaledVector(N, d + base);
  const pts = archOutline(a, h, pointed), centre = at(0, h * 0.45, 0.03);
  part.tri(pane, [centre, at(-a, 0, 0.03), at(a, 0, 0.03)], [[0.5, 0.45], [0, 0], [1, 0]], N); // alt kenar
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    part.tri(pane, [centre, at(x0, y0, 0.03), at(x1, y1, 0.03)], [[0.5, 0.45], [x0 / (2 * a) + 0.5, y0 / h], [x1 / (2 * a) + 0.5, y1 / h]], N);
    if (!frame) continue;
    const out = ([x, y]) => [x * ((a + f) / a), y > 0 ? y * ((h + f) / h) : y];
    const [ox0, oy0] = out(pts[i]), [ox1, oy1] = out(pts[i + 1]);
    const uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
    part.quad(frame, [at(x0, y0, depth), at(x1, y1, depth), at(ox1, oy1, depth), at(ox0, oy0, depth)], uv, N); // çerçevenin ön yüzü
    const inward = at(0, h * 0.45, 0).sub(at((x0 + x1) / 2, (y0 + y1) / 2, 0));
    part.quad(frame, [at(x0, y0, 0.03), at(x1, y1, 0.03), at(x1, y1, depth), at(x0, y0, depth)], uv, inward); // iç yan (derinlik)
    part.quad(frame, [at(ox0, oy0, 0), at(ox1, oy1, 0), at(ox1, oy1, depth), at(ox0, oy0, depth)], uv, inward.clone().negate()); // dış yan
  }
  if (frame && sill) {
    const w = a + f + 0.08, uv = [[0, 0], [1, 0], [1, 1], [0, 1]], d = depth + 0.06;
    part.quad(frame, [at(-w, -0.18, d), at(w, -0.18, d), at(w, 0, d), at(-w, 0, d)], uv, N);
    part.quad(frame, [at(-w, 0, 0), at(w, 0, 0), at(w, 0, d), at(-w, 0, d)], uv, UP);
    part.quad(frame, [at(-w, -0.18, 0), at(w, -0.18, 0), at(w, -0.18, d), at(-w, -0.18, d)], uv, v3(0, -1, 0));
    for (const s of [-1, 1]) part.quad(frame, [at(s * w, -0.18, 0), at(s * w, -0.18, d), at(s * w, 0, d), at(s * w, 0, 0)], uv, R.clone().multiplyScalar(s));
  }
}

export function createArapCamii() {
  const root = new THREE.Group();
  root.name = 'arap_camii';
  const std = (name, o) => new THREE.MeshStandardMaterial({ name, roughness: 0.9, metalness: 0, ...o });
  const M = {
    tugla: std('almasik_duvar', { map: brickTexture() }),
    tas: std('mermer_cerceve', { color: 0xc9c2b0 }),
    kiremit: std('kiremit', { map: tileTexture() }),
    ahsap: std('sacak_ahsap', { color: 0x3a281c }),
    cam: std('pencere_cam', { map: windowTexture(), roughness: 0.6 }),
    sebeke: std('pencere_sebeke', { map: latticeTexture() }),
    kapi: std('kapi_ahsap', { map: doorTexture() }),
    karanlik: std('gecit_karanlik', { color: 0x15120f }),
    fener: std('fener_ahsap', { map: lanternTexture() }),
    kursun: std('kursun', { color: 0x6f7478, roughness: 0.7, metalness: 0.2 }),
    alem: std('alem_pirinc', { color: 0xa88a3a, roughness: 0.5, metalness: 0.8 }),
  };
  const hx = L / 2, hz = W / 2;

  // ---------- Duvarlar, taş etek, payeler ----------
  const walls = new Part('cami_duvar');
  walls.box('tugla', -hx, hx, 0, H, -hz, hz, ['+x', '-x', '+z', '-z']);
  // Taş etek (subasman)
  const PL = 0.07;
  walls.box('tas', -hx - PL, hx + PL, 0, 0.55, -hz - PL, hz + PL, ['+x', '-x', '+z', '-z', '+y']);
  // Payeler: cepheleri bölen ince tuğla çıkıntılar (köşeler dahil)
  const BAYS_L = 9, BAYS_W = 3, PW = 0.6, PD = 0.2;
  for (let k = 0; k <= BAYS_L; k++) {
    const x = Math.min(hx - PW / 2, Math.max(-hx + PW / 2, -hx + (L * k) / BAYS_L));
    walls.box('tugla', x - PW / 2, x + PW / 2, 0.55, H - 0.3, hz, hz + PD, ['+x', '-x', '+z']);
    walls.box('tugla', x - PW / 2, x + PW / 2, 0.55, H - 0.3, -hz - PD, -hz, ['+x', '-x', '-z']);
  }
  for (let k = 0; k <= BAYS_W; k++) {
    const z = Math.min(hz - PW / 2, Math.max(-hz + PW / 2, -hz + (W * k) / BAYS_W));
    walls.box('tugla', hx, hx + PD, 0.55, H - 0.3, z - PW / 2, z + PW / 2, ['+x', '+z', '-z']);
    walls.box('tugla', -hx - PD, -hx, 0.55, H - 0.3, z - PW / 2, z + PW / 2, ['-x', '+z', '-z']);
  }
  root.add(walls.mesh(M));

  // ---------- Pencereler ve kapılar ----------
  const windows = new Part('cami_pencereler'), doors = new Part('cami_kapilar');
  const sides = [
    { P: (t) => v3(-hx + L * t, 0, hz), R: v3(1, 0, 0), N: v3(0, 0, 1), bays: BAYS_L, doors: [2, 6] }, // avlu cephesi
    { P: (t) => v3(hx - L * t, 0, -hz), R: v3(-1, 0, 0), N: v3(0, 0, -1), bays: BAYS_L, doors: [], skip: [6] }, // arka (minarenin yeri boş)
    { P: (t) => v3(hx, 0, hz - W * t), R: v3(0, 0, -1), N: v3(1, 0, 0), bays: BAYS_W, doors: [1] },
    { P: (t) => v3(-hx, 0, -hz + W * t), R: v3(0, 0, 1), N: v3(-1, 0, 0), bays: BAYS_W, doors: [] },
  ];
  for (const s of sides) {
    for (let k = 0; k < s.bays; k++) {
      if (s.skip?.includes(k)) continue;
      const base = s.P((k + 0.5) / s.bays), common = { R: s.R, N: s.N };
      opening(windows, { ...common, P: base.clone().setY(8.6), a: 0.62, h: 1.9, pointed: true, pane: 'sebeke', frame: 'tas', f: 0.16 }); // üst sıra: sivri kemerli şebekeli
      opening(windows, { ...common, P: base.clone().setY(4.7), a: 0.78, h: 2.9, pane: 'cam', frame: 'tas', f: 0.26, sill: true }); // orta sıra: yuvarlak kemerli
      if (s.doors.includes(k)) {
        // Mermer çerçeveli kapı: dikdörtgen taş sövenin içinde kemerli ahşap kanat, üstünde silme
        const along = (x, d) => base.clone().addScaledVector(s.R, x).addScaledVector(s.N, d);
        const slab = (x0, x1, y0, y1, d) => {
          const a = along(x0, d), b = along(x1, d), a0 = along(x0, 0), b0 = along(x1, 0), uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
          doors.quad('tas', [a.clone().setY(y0), b.clone().setY(y0), b.clone().setY(y1), a.clone().setY(y1)], uv, s.N);
          doors.quad('tas', [a.clone().setY(y1), b.clone().setY(y1), b0.clone().setY(y1), a0.clone().setY(y1)], uv, UP);
          doors.quad('tas', [a.clone().setY(y0), a.clone().setY(y1), a0.clone().setY(y1), a0.clone().setY(y0)], uv, s.R.clone().negate());
          doors.quad('tas', [b.clone().setY(y0), b.clone().setY(y1), b0.clone().setY(y1), b0.clone().setY(y0)], uv, s.R);
          doors.quad('tas', [a.clone().setY(y0), b.clone().setY(y0), b0.clone().setY(y0), a0.clone().setY(y0)], uv, v3(0, -1, 0));
        };
        slab(-1.75, 1.75, 0, 4.2, 0.16);
        slab(-2.0, 2.0, 4.2, 4.5, 0.3);
        opening(doors, { ...common, P: along(0, 0.16), a: 0.95, h: 3.2, pane: 'kapi', frame: 'tas', f: 0.14, depth: 0.05 });
      } else {
        opening(windows, { ...common, P: base.clone().setY(0.95), a: 0.7, h: 2.1, pane: 'cam', frame: 'tas', f: 0.2 }); // zemin sırası: parmaklıklı kemerli pencere
      }
    }
  }
  root.add(windows.mesh(M), doors.mesh(M));

  // ---------- Çatı: geniş ahşap saçak, kırma kiremit örtü ----------
  const roof = new Part('cami_cati');
  const ex = hx + EAVE, ez = hz + EAVE, ridge = hx - hz * 0.9, TOP = H + ROOF;
  const slope = Math.hypot(ez, ROOF), hip = Math.hypot(ex - ridge, ROOF);
  for (const s of [1, -1]) {
    // Uzun yüzler (yamuk)
    roof.quad('kiremit', [v3(-ex, H, s * ez), v3(ex, H, s * ez), v3(ridge, TOP, 0), v3(-ridge, TOP, 0)], [[-ex / 2, 0], [ex / 2, 0], [ridge / 2, slope / 2], [-ridge / 2, slope / 2]], v3(0, 1, s));
    // Kısa yüzler (üçgen)
    roof.tri('kiremit', [v3(s * ex, H, -ez), v3(s * ex, H, ez), v3(s * ridge, TOP, 0)], [[-ez / 2, 0], [ez / 2, 0], [0, hip / 2]], v3(s, 1, 0));
  }
  // Saçak: alın tahtası ve alt yüz
  roof.box('ahsap', -ex, ex, H - 0.3, H, -ez, ez, ['+x', '-x', '+z', '-z']);
  roof.quad('ahsap', [v3(-ex, H - 0.3, -ez), v3(ex, H - 0.3, -ez), v3(ex, H - 0.3, ez), v3(-ex, H - 0.3, ez)], [[0, 0], [1, 0], [1, 1], [0, 1]], v3(0, -1, 0));
  root.add(roof.mesh(M));

  // ---------- Minare: kare tuğla kule, ahşap fener, kurşun külah, alem ----------
  const tower = new Part('minare');
  const TW = 6.2, TH = 22.5, tx = -hx + L * (2.5 / BAYS_L), tz = -hz - TW / 2 + 0.05; // arka cephede, gövdeye bitişik
  const t0 = tx - TW / 2, t1 = tx + TW / 2, tz0 = tz - TW / 2, tz1 = tz + TW / 2;
  tower.box('tugla', t0, t1, 0, TH, tz0, tz1, ['+x', '-x', '+z', '-z']);
  tower.box('tas', t0 - PL, t1 + PL, 0, 0.55, tz0 - PL, tz1, ['+x', '-x', '-z', '+y']);
  tower.box('tugla', t0 - 0.2, t1 + 0.2, TH - 0.45, TH, tz0 - 0.2, tz1 + 0.2, ['+x', '-x', '+z', '-z', '-y', '+y']); // üst silme
  tower.box('tugla', t0 - 0.12, t1 + 0.12, 13.2, 13.5, tz0 - 0.12, tz1 + 0.12, ['+x', '-x', '+z', '-z', '-y', '+y']); // kat silmesi
  const faces = [
    { P: v3(tx, 0, tz1), R: v3(1, 0, 0), N: v3(0, 0, 1) }, { P: v3(tx, 0, tz0), R: v3(-1, 0, 0), N: v3(0, 0, -1) },
    { P: v3(t1, 0, tz), R: v3(0, 0, -1), N: v3(1, 0, 0) }, { P: v3(t0, 0, tz), R: v3(0, 0, 1), N: v3(-1, 0, 0) },
  ];
  faces.forEach((f, i) => {
    // Üstte ikiz mazgal pencereler
    for (const dx of [-0.75, 0.75]) opening(tower, { ...f, P: f.P.clone().addScaledVector(f.R, dx).setY(16.2), a: 0.24, h: 2.3, pane: 'karanlik', frame: 'tas', f: 0.1, depth: 0.06 });
    // Tabanda sivri kemerli geçit (arka ve iki yan yüzde; cami tarafı kapalı)
    if (i > 0) opening(tower, { ...f, P: f.P.clone().setY(0), a: 1.5, h: 5.4, pointed: true, pane: 'karanlik', frame: 'tas', f: 0.3, depth: 0.12 });
  });
  // Fener: aşı boyalı ahşap, hafif taşkın; üstünde saçak
  const FW = TW / 2 + 0.45, F0 = TH, F1 = TH + 2.7;
  tower.box('fener', tx - FW, tx + FW, F0, F1, tz - FW, tz + FW, ['+x', '-x', '+z', '-z', '-y'], FW * 2, 2.7, true);
  tower.box('ahsap', tx - FW - 0.35, tx + FW + 0.35, F1, F1 + 0.18, tz - FW - 0.35, tz + FW + 0.35, ['+x', '-x', '+z', '-z', '-y']);
  // Külah: fenerin üstünde alçak kurşun etek, ortasından yükselen ince sekizgen külah
  const ring = (r, y, n) => Array.from({ length: n }, (_, k) => v3(tx + Math.cos((k / n) * Math.PI * 2 + Math.PI / 8) * r, y, tz + Math.sin((k / n) * Math.PI * 2 + Math.PI / 8) * r));
  const E = FW + 0.35, Y0 = F1 + 0.18, skirt = [v3(tx - E, Y0, tz - E), v3(tx + E, Y0, tz - E), v3(tx + E, Y0, tz + E), v3(tx - E, Y0, tz + E)];
  const collar = ring(1.25, Y0 + 1.5, 8), tip = ring(0.1, Y0 + 11.5, 8), away = (p) => v3(p.x - tx, 0.5, p.z - tz);
  for (let k = 0; k < 8; k++) {
    const a = collar[k], b = collar[(k + 1) % 8], mid = a.clone().add(b).multiplyScalar(0.5);
    // Etek: sekizgenin her kenarı kare saçağın en yakın köşesine/kenarına bağlanır
    const corner = skirt.reduce((best, c) => (c.distanceTo(mid) < best.distanceTo(mid) ? c : best));
    const next = skirt.reduce((best, c) => (c.distanceTo(b) + 0.01 * c.distanceTo(a) < best.distanceTo(b) + 0.01 * best.distanceTo(a) ? c : best));
    tower.tri('kursun', [a, b, corner], [[0, 1], [1, 1], [0.5, 0]], away(mid));
    if (next !== corner) tower.tri('kursun', [b, corner, next], [[1, 1], [0, 0], [1, 0]], away(b));
    tower.quad('kursun', [a, b, tip[(k + 1) % 8], tip[k]], [[0, 0], [1, 0], [1, 1], [0, 1]], away(mid));
  }
  // Alem
  const A0 = Y0 + 11.5, alem = [[0.1, A0], [0.22, A0 + 0.25], [0.08, A0 + 0.5], [0.16, A0 + 0.75], [0.05, A0 + 1.0], [0.01, A0 + 1.5]].map(([r, y]) => ring(r, y, 6));
  for (let j = 1; j < alem.length; j++) for (let k = 0; k < 6; k++) tower.quad('alem', [alem[j - 1][k], alem[j - 1][(k + 1) % 6], alem[j][(k + 1) % 6], alem[j][k]], [[0, 0], [1, 0], [1, 1], [0, 1]], away(alem[j][k]));
  root.add(tower.mesh(M));
  return root;
}
