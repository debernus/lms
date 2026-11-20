import * as THREE from 'three';
import { canvasTexture } from './halk2.js';
import { Part } from './arapcami.js';

// İki eski koltuk; eskimiş deri, yıpranmış ahşap. 1 birim = 1 metre, Y yukarı, ön +Z, taban y = 0, merkezde.
// 1) koltuk_acik_kollu: ahşap çerçeveli, kapitone sırtlı, açık kollu (kol ucu kıvrık), torna ön ayaklı.
// 2) koltuk_berjer: kolları kapalı döşemeli berjer; kalp biçimli kapitone sırt, lüle ayaklar, çivi dizili kenar.
// Parçalar: koltuk_ahsap, koltuk_doseme.

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const S = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function materials(leather, wood, seed) {
  const rand = rng(seed);
  const skin = canvasTexture('eski_deri_' + seed, 512, 512, (g) => {
    g.fillStyle = leather;
    g.fillRect(0, 0, 512, 512);
    // Aşınma: açılmış soluk lekeler, koyu kir, ince çatlaklar
    g.filter = 'blur(18px)';
    for (let i = 0; i < 26; i++) {
      g.fillStyle = i % 3 ? `rgba(20,8,6,${0.08 + rand() * 0.12})` : `rgba(170,110,92,${0.06 + rand() * 0.1})`;
      g.beginPath();
      g.ellipse(90 + rand() * 332, 90 + rand() * 332, 30 + rand() * 60, 24 + rand() * 50, rand() * 3, 0, TAU);
      g.fill();
    }
    g.filter = 'none';
    for (let i = 0; i < 380; i++) {
      g.strokeStyle = `rgba(${rand() < 0.6 ? '24,10,8' : '210,160,140'},${0.12 + rand() * 0.25})`;
      g.lineWidth = 0.6 + rand();
      g.beginPath();
      let x = rand() * 512, y = rand() * 512;
      g.moveTo(x, y);
      for (let k = 0; k < 3; k++) g.lineTo((x += (rand() - 0.5) * 22), (y += (rand() - 0.5) * 22));
      g.stroke();
    }
  });
  const grain = canvasTexture('eski_ahsap_' + seed, 256, 256, (g) => {
    g.fillStyle = wood;
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 150; i++) {
      g.fillStyle = `rgba(${rand() < 0.6 ? '14,8,4' : '170,140,110'},${0.08 + rand() * 0.2})`;
      g.fillRect(rand() * 256, rand() * 256, 1 + rand() * 3, 30 + rand() * 150);
    }
    for (let i = 0; i < 26; i++) {
      g.fillStyle = `rgba(190,170,140,${0.1 + rand() * 0.14})`;
      g.fillRect(rand() * 256, rand() * 256, 4 + rand() * 14, 3 + rand() * 8);
    }
  });
  const studs = canvasTexture('civi_dizisi_' + seed, 32, 32, (g) => {
    g.fillStyle = leather;
    g.fillRect(0, 0, 32, 32);
    g.fillStyle = '#2a1c10';
    g.beginPath();
    g.arc(16, 17, 10, 0, TAU);
    g.fill();
    g.fillStyle = '#8f7440';
    g.beginPath();
    g.arc(16, 16, 9, 0, TAU);
    g.fill();
    g.fillStyle = '#c7ab6a';
    g.beginPath();
    g.arc(13, 13, 3.5, 0, TAU);
    g.fill();
  });
  const std = (name, o) => new THREE.MeshStandardMaterial({ name, metalness: 0, ...o });
  return {
    deri: std('eski_deri', { map: skin, roughness: 0.72 }),
    ahsap: std('eski_ahsap', { map: grain, roughness: 0.85 }),
    civi: std('civi_dizisi', { map: studs, roughness: 0.6, metalness: 0.3 }),
    dugme: std('kapitone_dugmesi', { color: new THREE.Color(leather).multiplyScalar(0.55), roughness: 0.7 }),
  };
}

// ---------- Ağ yardımcıları ----------
// Nokta ızgarası: rows[j][i]; yüzler hint(p) yönüne bakar
function grid(part, mat, rows, hint, scale = 3) {
  for (let j = 0; j + 1 < rows.length; j++) for (let i = 0; i + 1 < rows[j].length; i++) {
    const q = [rows[j][i], rows[j][i + 1], rows[j + 1][i + 1], rows[j + 1][i]];
    part.quad(mat, q, [[i / scale, j / scale], [(i + 1) / scale, j / scale], [(i + 1) / scale, (j + 1) / scale], [i / scale, (j + 1) / scale]], hint(q[0].clone().add(q[2]).multiplyScalar(0.5)));
  }
}
// Yol boyunca kesit süpürme: size(i) → [ru, rw]; ref: kesitin birinci eksenine yakın yön
function sweep(part, mat, path, size, n = 6, ref = V(1, 0, 0), caps = true) {
  const rings = path.map((p, i) => {
    const t = path[Math.min(i + 1, path.length - 1)].clone().sub(path[Math.max(i - 1, 0)]).normalize();
    const u = ref.clone().addScaledVector(t, -ref.dot(t)).normalize(), w = t.clone().cross(u), [ru, rw] = size(i / (path.length - 1));
    return Array.from({ length: n }, (_, k) => {
      const a = (k / n) * TAU + Math.PI / n;
      return p.clone().addScaledVector(u, Math.cos(a) * ru).addScaledVector(w, Math.sin(a) * rw);
    });
  });
  let run = 0;
  for (let i = 0; i + 1 < rings.length; i++) {
    const len = path[i].distanceTo(path[i + 1]);
    for (let k = 0; k < n; k++) {
      const a = rings[i][k], b = rings[i][(k + 1) % n], c = rings[i + 1][(k + 1) % n], d = rings[i + 1][k];
      part.quad(mat, [a, b, c, d], [[k / n, run * 4], [(k + 1) / n, run * 4], [(k + 1) / n, (run + len) * 4], [k / n, (run + len) * 4]], a.clone().add(b).multiplyScalar(0.5).sub(path[i]));
    }
    run += len;
  }
  if (caps) for (const [ring, p, other] of [[rings[0], path[0], path[1]], [rings[rings.length - 1], path[path.length - 1], path[path.length - 2]]]) {
    for (let k = 0; k < n; k++) part.tri(mat, [p, ring[k], ring[(k + 1) % n]], [[0.5, 0.5], [0, 0], [1, 0]], p.clone().sub(other));
  }
}
// Torna parça: profile [[yarıçap, y]...]
function lathe(part, mat, x, z, profile, n = 8) {
  const ring = ([r, y]) => Array.from({ length: n }, (_, k) => V(x + Math.cos((k / n) * TAU) * r, y, z + Math.sin((k / n) * TAU) * r));
  for (let j = 0; j + 1 < profile.length; j++) {
    const a = ring(profile[j]), b = ring(profile[j + 1]);
    for (let k = 0; k < n; k++) part.quad(mat, [a[k], a[(k + 1) % n], b[(k + 1) % n], b[k]], [[k / n, profile[j][1] * 4], [(k + 1) / n, profile[j][1] * 4], [(k + 1) / n, profile[j + 1][1] * 4], [k / n, profile[j + 1][1] * 4]], V(a[k].x + a[(k + 1) % n].x - 2 * x, (profile[j][0] - profile[j + 1][0]) * 2, a[k].z + a[(k + 1) % n].z - 2 * z));
  }
}
// Minder: kenarları yuvarlak, üstü bombeli
function cushion(part, mat, x0, x1, z0, z1, yBase, yMid, yTop) {
  const N = 10, rows = [];
  for (let j = 0; j <= N; j++) rows.push(Array.from({ length: N + 1 }, (_, i) => {
    const u = (i / N) * 2 - 1, v = (j / N) * 2 - 1, edge = Math.max(Math.abs(u), Math.abs(v));
    const dome = Math.sqrt(Math.max(0, 1 - Math.abs(u) ** 5)) * Math.sqrt(Math.max(0, 1 - Math.abs(v) ** 5));
    const inset = 0.012 * S(0.8, 1, edge);
    return V(lerp(x0, x1, (u + 1) / 2) - Math.sign(u) * inset * Math.abs(u), yMid + (yTop - yMid) * dome ** 0.8, lerp(z0, z1, (v + 1) / 2) - Math.sign(v) * inset * Math.abs(v));
  }));
  grid(part, mat, rows, () => V(0, 1, 0));
  // Yan yüzler
  const rim = [...rows[0], ...rows.slice(1, -1).map((r) => r[N]), ...rows[N].slice().reverse(), ...rows.slice(1, -1).reverse().map((r) => r[0])];
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  for (let k = 0; k < rim.length; k++) {
    const a = rim[k], b = rim[(k + 1) % rim.length];
    part.quad(mat, [a.clone().setY(yBase), b.clone().setY(yBase), b, a], [[k / 3, 0], [(k + 1) / 3, 0], [(k + 1) / 3, 0.3], [k / 3, 0.3]], V(a.x + b.x - 2 * cx, 0, a.z + b.z - 2 * cz));
  }
}
// Kapitone sırt: eğik düzlemde, dış çizgisi w(v) ve h(u) ile verilen dolgun panel; çevresinde ahşap çerçeve.
// o: { origin: [y, z], tilt, H, width(v), top(u), buttons: [[v, [u...]]], frame }
function back(wood, cloth, M, o) {
  const cs = Math.cos(o.tilt), sn = Math.sin(o.tilt);
  const world = (x, yl, zl) => V(x, o.origin[0] + yl * cs + zl * sn, o.origin[1] - yl * sn + zl * cs);
  const at = (u, v, zl) => world(u * o.width(v), v * o.top(u), zl);
  const buttons = o.buttons.flatMap(([v, us]) => us.map((u) => [u, v]));
  const N = 24, rows = [];
  for (let j = 0; j <= N; j++) rows.push(Array.from({ length: N + 1 }, (_, i) => {
    const u = (i / N) * 2 - 1, v = j / N;
    let z = 0.012 + 0.042 * (1 - Math.abs(u) ** 4) * Math.sin(Math.PI * clamp(v * 0.94 + 0.03, 0, 1)) ** 0.6;
    for (const [bu, bv] of buttons) {
      const d = Math.hypot((u - bu) * o.width(v), (v - bv) * o.H);
      z -= 0.024 * Math.exp(-((d / 0.03) ** 2)); // düğme çukuru
      z -= 0.006 * Math.exp(-((d / 0.075) ** 2));
    }
    return at(u, v, z);
  }));
  const normal = V(0, sn, cs);
  grid(cloth, 'deri', rows, () => normal, 4);
  // Düğmeler
  for (const [bu, bv] of buttons) {
    const c = at(bu, bv, 0.012 + 0.042 * (1 - Math.abs(bu) ** 4) * Math.sin(Math.PI * clamp(bv * 0.94 + 0.03, 0, 1)) ** 0.6 - 0.024), ring = Array.from({ length: 6 }, (_, k) => c.clone().add(V(Math.cos((k / 6) * TAU) * 0.011, Math.sin((k / 6) * TAU) * 0.011 * cs, -Math.sin((k / 6) * TAU) * 0.011 * sn)));
    const tip = c.clone().addScaledVector(normal, 0.006);
    for (let k = 0; k < 6; k++) cloth.tri('dugme', [ring[k], ring[(k + 1) % 6], tip], [[0, 0], [1, 0], [0.5, 1]], normal);
  }
  // Arka yüz: düz deri
  const rear = [0, 0.5, 1].map((v) => [-1, 0, 1].map((u) => at(u, v, -0.03)));
  for (let j = 0; j <= N; j += 4) rear[j / 4] = Array.from({ length: 7 }, (_, i) => at((i / 6) * 2 - 1, j / N, -0.032));
  grid(cloth, 'deri', rear, () => normal.clone().negate(), 2);
  // Çerçeve: sol kenar yukarı, üst kenar, sağ kenar aşağı
  const path = [];
  for (let k = 0; k <= 12; k++) path.push(at(-1, k / 12, 0));
  for (let k = 1; k <= 20; k++) path.push(at(-1 + (k / 20) * 2, 1, 0));
  for (let k = 11; k >= 0; k--) path.push(at(1, k / 12, 0));
  sweep(wood, 'ahsap', path, () => [o.frame, o.frame * 1.25], 6, normal);
  return { at };
}

// ================= 1) Açık kollu koltuk =================
export function createKoltukAcikKollu() {
  const root = new THREE.Group();
  root.name = 'koltuk_acik_kollu';
  const M = materials('#64201c', '#44332a', 5), wood = new Part('koltuk_ahsap'), cloth = new Part('koltuk_doseme');
  // Oturma kasası ve minder
  wood.box('ahsap', -0.3, 0.3, 0.37, 0.45, -0.26, 0.3, ['+x', '-x', '+z', '-z', '+y', '-y'], 0.5, 0.25);
  wood.box('ahsap', -0.308, 0.308, 0.432, 0.452, -0.268, 0.308, ['+x', '-x', '+z', '-z', '+y', '-y'], 0.5, 0.25);
  cushion(cloth, 'deri', -0.285, 0.285, -0.2, 0.305, 0.45, 0.48, 0.54);
  for (const s of [-1, 1]) {
    // Torna ön ayak, kılıç arka ayak
    lathe(wood, 'ahsap', s * 0.265, 0.255, [[0.004, 0], [0.019, 0.004], [0.025, 0.022], [0.015, 0.05], [0.02, 0.075], [0.03, 0.255], [0.021, 0.285], [0.035, 0.305], [0.021, 0.33], [0.031, 0.345], [0.031, 0.372]]);
    sweep(wood, 'ahsap', [V(s * 0.262, 0.37, -0.225), V(s * 0.262, 0.26, -0.245), V(s * 0.268, 0.13, -0.3), V(s * 0.28, 0, -0.375)], (t) => [0.03 - 0.008 * t, 0.03 - 0.008 * t], 4);
    // Kol dayama direği
    wood.box('ahsap', s * 0.3 - 0.033, s * 0.3 + 0.033, 0.36, 0.47, 0.095, 0.165, ['+x', '-x', '+z', '-z', '+y', '-y'], 0.3, 0.3);
    lathe(wood, 'ahsap', s * 0.3, 0.13, [[0.022, 0.47], [0.03, 0.49], [0.016, 0.515], [0.026, 0.545], [0.015, 0.6], [0.017, 0.665]]);
  }
  const b = back(wood, cloth, M, {
    origin: [0.45, -0.2], tilt: 0.2, H: 0.62, frame: 0.03,
    width: (v) => 0.235 + 0.04 * v - 0.035 * S(0.9, 1, v),
    top: (u) => 0.62 - 0.03 * (0.5 + 0.5 * Math.cos(Math.PI * u)) - 0.05 * Math.abs(u) ** 8,
    buttons: [[0.3, [-0.5, 0, 0.5]], [0.45, [-0.25, 0.25]], [0.6, [-0.5, 0, 0.5]], [0.75, [-0.25, 0.25]], [0.88, [-0.5, 0, 0.5]]],
  });
  // Kollar: sırt çerçevesinden öne, ucu aşağı kıvrık
  for (const s of [-1, 1]) {
    const start = b.at(s, 0.4, 0.01);
    const path = [start, V(s * 0.305, 0.69, -0.05), V(s * 0.312, 0.688, 0.12), V(s * 0.314, 0.68, 0.22), V(s * 0.314, 0.662, 0.262), V(s * 0.314, 0.632, 0.276), V(s * 0.314, 0.604, 0.262), V(s * 0.314, 0.598, 0.236), V(s * 0.314, 0.612, 0.222)];
    sweep(wood, 'ahsap', path, (t) => [0.03 - 0.006 * S(0.75, 1, t), 0.018 - 0.004 * S(0.75, 1, t)], 6);
  }
  root.add(wood.mesh(M), cloth.mesh(M));
  return root;
}

// ================= 2) Berjer =================
export function createKoltukBerjer() {
  const root = new THREE.Group();
  root.name = 'koltuk_berjer';
  const M = materials('#421618', '#54281c', 9), wood = new Part('koltuk_ahsap'), cloth = new Part('koltuk_doseme');
  // Etek (kasa) ve lüle ayaklar
  wood.box('ahsap', -0.372, 0.372, 0.27, 0.342, -0.28, 0.325, ['+x', '-x', '+z', '-z', '-y', '+y'], 0.5, 0.25);
  sweep(wood, 'ahsap', [V(-0.35, 0.285, 0.332), V(-0.17, 0.27, 0.34), V(0, 0.262, 0.342), V(0.17, 0.27, 0.34), V(0.35, 0.285, 0.332)], () => [0.016, 0.02], 4, V(0, 1, 0));
  for (const s of [-1, 1]) {
    sweep(wood, 'ahsap', [V(s * 0.315, 0.31, 0.295), V(s * 0.338, 0.25, 0.318), V(s * 0.332, 0.15, 0.31), V(s * 0.308, 0.06, 0.288), V(s * 0.31, 0.02, 0.296), V(s * 0.318, 0, 0.306)], (t) => { const r = lerp(0.042, 0.017, S(0.1, 0.85, t)) + 0.006 * S(0.85, 1, t); return [r, r]; }, 6);
    sweep(wood, 'ahsap', [V(s * 0.31, 0.31, -0.25), V(s * 0.315, 0.16, -0.275), V(s * 0.33, 0, -0.33)], (t) => [0.032 - 0.014 * t, 0.032 - 0.014 * t], 6);
  }
  cushion(cloth, 'deri', -0.268, 0.268, -0.2, 0.335, 0.34, 0.4, 0.47);
  // Kapalı kollar: kesit (iç yüz → rulo → dış yüz) Z boyunca süpürülür
  const SECTION = [[0.262, 0.34], [0.262, 0.56], [0.272, 0.615], [0.305, 0.648], [0.355, 0.645], [0.393, 0.615], [0.402, 0.57], [0.38, 0.535], [0.366, 0.44], [0.362, 0.34]];
  const STATIONS = [[-0.245, 0, 1], [-0.1, 0.004, 1], [0.1, 0.008, 1], [0.26, 0.014, 1.02], [0.312, 0.016, 1.03]];
  for (const s of [-1, 1]) {
    const rows = STATIONS.map(([z, out, grow]) => SECTION.map(([x, y]) => V(s * (0.33 + (x - 0.33) * grow + out), 0.34 + (y - 0.34) * (y > 0.5 ? grow : 1), z)));
    const cols = SECTION.map((_, i) => rows.map((r) => r[i]));
    grid(cloth, 'deri', cols, (p) => V(p.x - s * 0.33, p.y > 0.6 ? 1 : 0, 0), 2);
    // Arka ucu kapat, ön yüz ahşap aynalık
    const cap = (row, mat, n, part) => {
      const c = row.reduce((a, p) => a.add(p), V(0, 0, 0)).multiplyScalar(1 / row.length);
      for (let k = 0; k < row.length; k++) part.tri(mat, [c, row[k], row[(k + 1) % row.length]], [[0.5, 0.5], [0, 0], [1, 0]], n);
    };
    cap(rows[0], 'deri', V(0, 0, -1), cloth);
    cap(rows[rows.length - 1], 'deri', V(0, 0, 1), cloth);
    // Ön yüzün çevresinde ahşap pervaz; üstte kıvrık uç
    const front = rows[rows.length - 1].map((p) => p.clone().setZ(0.322)), curl = front[3].clone().lerp(front[5], 0.5);
    const trim = [...front, front[front.length - 1].clone().setY(0.3)], scroll = [front[1].clone().setY(0.3), ...front.slice(1, 7), curl.clone().add(V(s * 0.012, -0.03, 0)), curl.clone().add(V(-s * 0.012, -0.026, 0)), curl.clone().add(V(-s * 0.014, -0.006, 0))];
    sweep(wood, 'ahsap', [...scroll], (t) => [0.016 - 0.005 * S(0.8, 1, t), 0.018], 4, V(0, 0, 1));
    sweep(wood, 'ahsap', trim.slice(6), () => [0.014, 0.018], 4, V(0, 0, 1));
    // Çivi dizisi: dış yüzün alt kenarı boyunca
    const lowA = rows[0][SECTION.length - 1], lowB = rows[rows.length - 1][SECTION.length - 1], len = lowA.distanceTo(lowB), x = s * 0.0015;
    cloth.quad('civi', [lowA.clone().add(V(x, 0.004, 0)), lowB.clone().add(V(x, 0.004, 0)), lowB.clone().add(V(x, 0.026, 0)), lowA.clone().add(V(x, 0.026, 0))], [[0, 0], [len / 0.022, 0], [len / 0.022, 1], [0, 1]], V(s, 0, 0));
  }
  // Ön etekte çivi dizisi (minderin altında)
  cloth.quad('civi', [V(-0.262, 0.342, 0.3275), V(0.262, 0.342, 0.3275), V(0.262, 0.364, 0.3275), V(-0.262, 0.364, 0.3275)], [[0, 0], [24, 0], [24, 1], [0, 1]], V(0, 0, 1));
  wood.box('ahsap', -0.262, 0.262, 0.3, 0.366, 0.3, 0.326, ['+z'], 0.5, 0.25);
  // Kalp biçimli kapitone sırt
  back(wood, cloth, M, {
    origin: [0.4, -0.215], tilt: 0.16, H: 0.72, frame: 0.03,
    width: (v) => 0.195 + 0.115 * Math.sin(Math.PI * 0.74 * v ** 1.5), // altta dar, omuzda geniş
    top: (u) => 0.7 + 0.035 * Math.exp(-((u / 0.3) ** 2)) - 0.075 * Math.abs(u) ** 2.4 - 0.05 * Math.abs(u) ** 10, // ortada yükselen tepe
    buttons: [[0.3, [-0.3, 0.3]], [0.42, [-0.55, 0, 0.55]], [0.54, [-0.3, 0.3]], [0.66, [-0.55, 0, 0.55]], [0.78, [-0.3, 0.3]], [0.89, [-0.5, 0, 0.5]]],
  });
  root.add(wood.mesh(M), cloth.mesh(M));
  return root;
}
