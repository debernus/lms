import * as THREE from 'three';
import M from './manken_olcu.js';
import { Surface, cloth, awayFromAxis, buildTrousers, headRadius, TAU } from './outfit.js';
import { castOut } from './outfit2.js';
import { skirtRadius, CEKET } from './outfit3.js';
import { buildAyakkabi } from './outfit5.js';
import { canvasTexture, patterned, build, robe, wrapUV } from './halk2.js';

// 1890'lar İstanbul'u şehir halkı kıyafetleri: 4 kadın, 3 çocuk, 4 erkek. Hepsi manken_erkek.glb'nin
// üstüne oturur (T duruşu, 1 birim = 1 m, yüz +Z). Çocuk kıyafetleri 0,65 ölçeğe indirilmiş olarak
// üretilir: manken 0,65'e küçültülünce (orijin ayak tabanında) üstüne oturur.

const HEAD = M.head, v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const OUT = awayFromAxis(CEKET.cx, CEKET.cz);

// ---------- Dokular ----------
const rnd = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const basma = (name, ground, petals, heart, leaf) => patterned(name, canvasTexture(name, 128, 128, (g) => {
  const r = rnd(name.length * 977 + 13);
  g.fillStyle = ground;
  g.fillRect(0, 0, 128, 128);
  for (let k = 0; k < 16; k++) {
    const x = (k % 4) * 32 + 8 + r() * 14, y = Math.floor(k / 4) * 32 + 8 + r() * 14, c = petals[k % petals.length];
    g.fillStyle = leaf;
    g.fillRect(x - 5, y + 2, 4, 2);
    g.fillRect(x + 3, y - 4, 2, 4);
    g.fillStyle = c;
    for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(x + Math.cos(i * 1.257) * 3, y + Math.sin(i * 1.257) * 3, 2.2, 0, 7); g.fill(); }
    g.fillStyle = heart;
    g.beginPath(); g.arc(x, y, 1.5, 0, 7); g.fill();
  }
}));
const cizgili = (name, base, wide, thin) => patterned(name, canvasTexture(name, 64, 8, (g) => {
  g.fillStyle = base;
  g.fillRect(0, 0, 64, 8);
  g.fillStyle = wide;
  g.fillRect(4, 0, 14, 8);
  g.fillStyle = thin;
  g.fillRect(38, 0, 4, 8);
}));
const kaba = (name, base, dark, light) => patterned(name, canvasTexture(name, 128, 128, (g) => {
  const r = rnd(name.length * 331 + 7);
  g.fillStyle = base;
  g.fillRect(0, 0, 128, 128);
  for (let k = 0; k < 1800; k++) { g.fillStyle = r() < 0.5 ? dark : light; g.globalAlpha = 0.25 + r() * 0.3; g.fillRect(r() * 128, r() * 128, 1 + r() * 2, 1 + r() * 4); }
  g.globalAlpha = 1;
}));
const duzUV = (x, y, z) => [(x + z) * 3, y * 3];

// ---------- Giysi parçaları ----------
const skirtPay = (o) => (y) => o.offset + 0.006 + (o.flare ?? 0.03) * clamp01((1.04 - y) / (1.04 - o.hem)) ** (o.curve ?? 1);
// Üst giysi: gövde kabuğu, istenirse kol ve belden aşağı etek.
// o: offset, sleeve (kol yarıçapı; 0 = kolsuz), cuff, arm (kolun bittiği |x|), hem (etek ucu; yoksa belde biter),
// flare, open (ön açıklığın yarı genişliği), vneck, neck, bottom (kısa giysinin alt kenarı), uv
function ust(name, material, o) {
  const { offset = 0.018, sleeve = 0.072, cuff = 0, arm = 0.69, hem = null, open = 0, vneck = 0, neck = 0.1, bottom = 0 } = o;
  const rows = [];
  if (hem !== null) {
    const pay = skirtPay({ ...o, offset, hem, flare: o.flare ?? (hem > 0.9 ? 0.004 : 0.03) }); // bele sokulan gömlek açılmaz
    rows.push([1.1, offset + 0.003], [1.04, offset + 0.005]);
    for (let y = 0.96; y > hem + 0.04; y -= 0.1) rows.push([y, pay(y)]);
    rows.push([hem, pay(hem)]);
  }
  const s = robe({
    offset, sleeveDrop: o.sleeveDrop ?? 0.006,
    sleeve: sleeve ? (ax) => sleeve + cuff * clamp01((ax - 0.3) / 0.38) + 0.024 * clamp01((0.4 - ax) / 0.1) : null,
    inside: (x, y, z) => {
      const ax = Math.abs(x);
      if (ax > (sleeve ? arm : 0.2)) return false;
      if (y > 1.53 && Math.hypot(x, z + 0.045) < neck) return false;
      if (vneck && z > 0 && ax < (y - (1.6 - vneck)) * 0.4) return false;
      if (open && z > 0 && ax < open + (o.lapel ?? 0) * clamp01((y - 1.3) / 0.25)) return false;
      return !(bottom && ax < 0.22 && y < bottom + 0.004 * Math.sin(x * 50));
    },
    rows, gapAngle: open ? open * 5.8 : 0,
  });
  return build(name, [[s, material, o.uv ?? duzUV]]);
}
// Yalnız etek ya da önlük: halkalar belden aşağı iner. half < PI ise önde açık yay (önlük)
function etek(name, material, rows, { half = Math.PI, uv = duzUV } = {}) {
  const s = new Surface(), closed = half >= Math.PI, n = closed ? 40 : Math.max(6, Math.round((40 * half) / Math.PI));
  let previous = null;
  for (const [y, pay] of rows) {
    const row = Array.from({ length: closed ? n : n + 1 }, (_, k) => {
      const a = closed ? (k / n) * TAU : Math.PI / 2 - half + (2 * half * k) / n, r = skirtRadius(y, a, pay);
      return s.point(CEKET.cx + Math.cos(a) * r, y, CEKET.cz + Math.sin(a) * r);
    });
    if (previous) s.strip(previous, row, closed, OUT);
    previous = row;
  }
  return build(name, [[s, material, uv]]);
}
function kusak(name, material, { y = 0.99, width = 0.1, pay = 0.04, tail = 0 }) {
  const s = new Surface(), at = (a, yy, p) => { const r = skirtRadius(yy, a, p); return s.point(CEKET.cx + Math.cos(a) * r, yy, CEKET.cz + Math.sin(a) * r); };
  let previous = null;
  for (const [h, e] of [[0, 0], [width * 0.33, 0.008], [width * 0.66, 0.002], [width, 0.006]]) {
    const ring = Array.from({ length: 40 }, (_, k) => at((k / 40) * TAU, y + h + 0.006 * Math.sin((k / 40) * TAU * 2 + 1), pay + e));
    if (previous) s.strip(previous, ring, true, OUT);
    previous = ring;
  }
  if (tail) {
    let above = null;
    for (const [yy, half] of [[y + width * 0.5, 0.12], [y - tail * 0.5, 0.13], [y - tail, 0.14]]) {
      const row = Array.from({ length: 4 }, (_, c) => at(Math.PI / 2 + 0.35 + half * (c / 1.5 - 1), yy, pay + 0.012));
      if (above) s.strip(above, row, false, OUT);
      above = row;
    }
  }
  return build(name, [[s, material, duzUV]]);
}
const TROUSERS = {
  pantolon: { ease: [[0.075, 0.024], [0.2, 0.02], [0.4, 0.018], [0.5, 0.014], [0.66, 0.014], [0.76, 0.016], [0.86, 0.04], [0.98, 0.046], [1.04, 0.026]], legRows: [0.075, 0.078, 0.13, 0.2, 0.28, 0.36, 0.43, 0.48, 0.52, 0.56, 0.6, 0.65, 0.7, 0.755, 0.8, 0.84], legFold: 0.004, hipFold: 0.003 },
  salvar: { ease: [[0.4, 0.012], [0.44, 0.04], [0.6, 0.052], [0.84, 0.048], [0.96, 0.036], [1.04, 0.02]], legRows: [0.4, 0.41, 0.44, 0.5, 0.56, 0.62, 0.68, 0.76, 0.84], legFold: 0.01, hipFold: 0.008 },
  dizlik: { ease: [[0.46, 0.01], [0.49, 0.026], [0.6, 0.034], [0.84, 0.036], [0.96, 0.038], [1.04, 0.022]], legRows: [0.46, 0.47, 0.49, 0.54, 0.6, 0.68, 0.76, 0.84], legFold: 0.007, hipFold: 0.006 },
  potur: { ease: [[0.1, 0.01], [0.3, 0.01], [0.48, 0.012], [0.58, 0.022], [0.72, 0.04], [0.84, 0.05], [0.96, 0.042], [1.04, 0.022]], legRows: [0.1, 0.103, 0.16, 0.24, 0.32, 0.4, 0.48, 0.54, 0.6, 0.66, 0.72, 0.78, 0.84], legFold: 0.004, hipFold: 0.008 },
};
function bacak(kind, name, color) {
  const mesh = buildTrousers({ name, color, top: 1.04, crotch: 0.84, cx: 0, cz: -0.04, hipRows: [0.88, 0.92, 0.96, 0.98, 1.0, 1.02, 1.04], ...TROUSERS[kind] });
  mesh.name = name;
  mesh.material = cloth(name, color);
  return mesh;
}
function ayak(name, color) {
  const mesh = buildAyakkabi(color);
  mesh.name = name;
  mesh.material = cloth(name, color);
  return mesh;
}

// ---------- Başlıklar ----------
const headPoint = (s, a, y, r, dz = 0) => s.point(HEAD.cx + Math.cos(a) * r, y, HEAD.cz + Math.sin(a) * r + dz);
// Baş örtüsü. eyes: yalnız göz bandı açık (yaşmak); cowl: omuzlara inen etek
function ortu(name, material, { offset = 0.012, cowl = false, eyes = false, drape = 1 }) {
  const s = new Surface(), SEG = 32, TOPY = 1.812 + offset, rows = [];
  if (cowl) for (const [y, r] of [[1.5 - 0.04 * drape, 0.125 + 0.05 * drape], [1.535, 0.122 + 0.02 * drape], [1.58, 0.118], [1.63, 0.116]]) rows.push({ y, r: () => r + offset });
  else rows.push({ y: 1.6, r: (a) => headRadius(1.66, a) + offset - 0.004 }, { y: 1.63, r: (a) => headRadius(1.66, a) + offset });
  for (const y of [1.66, 1.69, 1.72, 1.75]) rows.push({ y, r: (a) => headRadius(y, a) + offset });
  for (const t of [0, 0.3, 0.55, 0.78, 0.94]) {
    const th = (t * Math.PI) / 2;
    rows.push({ y: 1.775 + (TOPY - 1.775) * Math.sin(th), r: (a) => (headRadius(1.775, a) + offset) * Math.cos(th) });
  }
  const grid = rows.map((row) => Array.from({ length: SEG }, (_, k) => {
    const a = (k / SEG) * TAU, r = row.r(a) * (cowl && row.y < 1.53 ? 1 + 0.25 * Math.abs(Math.cos(a)) : 1);
    return headPoint(s, a, row.y, r, cowl && row.y < 1.56 ? -0.025 : 0);
  }));
  for (let j = 1; j < rows.length; j++) for (let k = 0; k < SEG; k++) {
    const a = ((k + 0.5) / SEG) * TAU, mid = (rows[j].y + rows[j - 1].y) / 2, front = Math.abs(a - Math.PI / 2);
    if (eyes ? front < 0.8 && mid > 1.7 && mid < 1.745 : front < 0.95 && mid > (cowl ? 1.6 : 1.59) && mid < 1.775) continue;
    const k1 = (k + 1) % SEG, start = s.indices.length;
    s.indices.push(grid[j - 1][k], grid[j - 1][k1], grid[j][k1], grid[j - 1][k], grid[j][k1], grid[j][k]);
    s.orient(start, awayFromAxis(HEAD.cx, HEAD.cz));
  }
  s.fan(s.point(HEAD.cx, TOPY, HEAD.cz), grid[grid.length - 1], () => [0, 1, 0]);
  return build(name, [[s, material, duzUV]]);
}
function fes(color = 0x9a1c1c, { rim = 1.752, h = 0.115, top = 0.07 } = {}) {
  const s = new Surface(), t = new Surface(), SEG = 28, R0 = 0.094;
  const rows = [[0, 0], [0.02, 0.5], [h * 0.5, 1], [h, 1]].map(([dy, k]) => Array.from({ length: SEG }, (_, i) => {
    const a = (i / SEG) * TAU, fit = Math.max(headRadius(rim, a) + 0.006, 0.086), round = R0 + (top - R0) * (dy / h);
    return headPoint(s, a, rim + dy, fit + (round - fit) * k, -0.004);
  }));
  for (let j = 1; j < rows.length; j++) s.strip(rows[j - 1], rows[j], true, awayFromAxis(HEAD.cx, HEAD.cz));
  s.fan(s.point(HEAD.cx, rim + h + 0.004, HEAD.cz - 0.004), rows[3], () => [0, 1, 0]);
  // Püskül: tepeden arkaya-yana sarkar
  const P = [[0, rim + h + 0.006, -0.004], [-0.04, rim + h + 0.008, -0.04], [-0.074, rim + h - 0.01, -0.06], [-0.082, rim + h - 0.07, -0.064]];
  for (let k = 0; k + 1 < P.length; k++) {
    const w = k === 2 ? 0.012 : 0.004, q = [t.point(P[k][0], P[k][1], P[k][2] - 0.004), t.point(P[k][0], P[k][1], P[k][2] + 0.004), t.point(P[k + 1][0], P[k + 1][1], P[k + 1][2] + w), t.point(P[k + 1][0], P[k + 1][1], P[k + 1][2] - w)];
    t.indices.push(q[0], q[1], q[2], q[0], q[2], q[3]);
  }
  return build('fes', [[s, cloth('fes', color), null], [t, cloth('puskul', 0x121212), null]]);
}
function sarik() {
  const w = new Surface(), c = new Surface(), SEG = 32, base = (a) => headRadius(1.755, a) + 0.008;
  const ring = (s, y, f) => Array.from({ length: SEG }, (_, i) => { const a = (i / SEG) * TAU; return headPoint(s, a, y + 0.006 * Math.sin(a * 2 + y * 60), f(a), -0.004); });
  const W = [[1.722, 0.004], [1.728, 0.03], [1.752, 0.046], [1.776, 0.04], [1.8, 0.044], [1.818, 0.03], [1.824, 0.008]].map(([y, e]) => ring(w, y, (a) => base(a) + e + 0.004 * Math.sin(a * 3 + y * 90)));
  for (let j = 1; j < W.length; j++) w.strip(W[j - 1], W[j], true, awayFromAxis(HEAD.cx, HEAD.cz));
  const C = [[1.82, 0.012], [1.85, 0.0]].map(([y, e]) => ring(c, y, (a) => (y > 1.84 ? 0.066 : base(a) + e)));
  c.strip(C[0], C[1], true, awayFromAxis(HEAD.cx, HEAD.cz));
  c.fan(c.point(HEAD.cx, 1.856, HEAD.cz - 0.004), C[1], () => [0, 1, 0]);
  return build('sarik', [[w, cloth('sarik', 0xe9e5da), null], [c, cloth('sarik_fesi', 0x8f1b1b), null]]);
}
function kulah(color) {
  const s = new Surface(), SEG = 28, Y0 = 1.742, H = 0.2;
  const rows = [[-0.012, 1.1], [0, 1.04], [0.15, 0], [0.32, 0], [0.5, 0], [0.7, 0], [0.88, 0]].map(([t, brim]) => Array.from({ length: SEG }, (_, i) => {
    const a = (i / SEG) * TAU, r0 = headRadius(Y0, a) + 0.01;
    return headPoint(s, a, Y0 + Math.max(t, 0) * H + (t < 0 ? -0.004 : 0), brim ? r0 * brim : r0 * (1 - t) ** 0.72, -0.004 - 0.02 * Math.max(t, 0));
  }));
  for (let j = 1; j < rows.length; j++) s.strip(rows[j - 1], rows[j], true, awayFromAxis(HEAD.cx, HEAD.cz));
  s.fan(s.point(HEAD.cx, Y0 + H * 0.97, HEAD.cz - 0.026), rows[rows.length - 1], () => [0, 1, 0]);
  return build('kulah', [[s, kaba('kece', color, '#8a7e68', '#c9bfa8'), duzUV]]);
}
// Omuzdan öne sarkan iki örgü
function orguler(lift) {
  const s = new Surface(), b = new Surface();
  for (const side of [1, -1]) {
    const C = v3(side * 0.105, 1.44, -0.04), path = [v3(side * 0.074, 1.71, -0.085), v3(side * 0.09, 1.64, -0.085), v3(side * 0.1, 1.585, -0.07)];
    for (const t of [1.75, 1.3, 0.85, 0.45]) path.push(castOut(C, v3(0, Math.sin(t), Math.cos(t)), lift));
    for (const y of [1.4, 1.35, 1.3, 1.25, 1.21]) path.push(castOut(v3(side * 0.105, y, -0.04), v3(0, 0, 1), lift));
    let previous = null;
    path.forEach((p, i) => {
      const T = path[Math.min(i + 1, path.length - 1)].clone().sub(path[Math.max(i - 1, 0)]).normalize(), X = v3(1, 0, 0), N = T.clone().cross(X).normalize();
      const r = i === path.length - 1 ? 0.008 : i % 2 ? 0.019 : 0.014, surf = i >= path.length - 2 ? b : s;
      const mk = (S2, rr) => Array.from({ length: 6 }, (_, k) => { const q = p.clone().addScaledVector(X, Math.cos((k / 6) * TAU) * rr).addScaledVector(N, Math.sin((k / 6) * TAU) * rr); return S2.point(q.x, q.y, q.z); });
      const ring = mk(surf, r);
      if (previous) {
        if (previous.surf !== surf) previous = { surf, ring: mk(surf, previous.r) };
        surf.strip(previous.ring, ring, true, (x, y, z) => [x - p.x, 0, z - p.z]);
      }
      previous = { surf, ring, r };
    });
  }
  return build('orgu', [[s, cloth('sac', 0x2a1a12), null], [b, cloth('kurdele', 0x9a2a2a), null]]);
}
// Hamal semeri: sırtta, altı çıkıntılı dolgu yastık; iki omuz askısı
function semer() {
  const s = new Surface(), k = new Surface();
  const back = (x, y) => castOut(v3(x, y, -0.03), v3(0, 0, -1), 0.05).z;
  const levels = [[1.09, 0.2, 0.2], [1.13, 0.21, 0.24], [1.2, 0.2, 0.22], [1.32, 0.19, 0.15], [1.44, 0.17, 0.1], [1.5, 0.15, 0.07]].map(([y, w, th]) => {
    const zf = Math.min(back(0, y), back(w * 0.6, y), back(-w * 0.6, y));
    return [[-w, zf], [w, zf], [w, zf - th * 0.7], [w * 0.72, zf - th], [-w * 0.72, zf - th], [-w, zf - th * 0.7]].map(([x, z]) => s.point(x, y, z));
  });
  const mid = (x, y, z) => [x, 0, z + 0.3];
  for (let j = 1; j < levels.length; j++) s.strip(levels[j - 1], levels[j], true, mid);
  s.fan(s.point(0, 1.085, -0.3), levels[0], () => [0, -1, 0]);
  s.fan(s.point(0, 1.505, -0.2), levels[5], () => [0, 1, 0]);
  for (const side of [1, -1]) {
    const C = v3(side * 0.125, 1.4, -0.04), rows = [];
    for (let i = 0; i <= 14; i++) {
      const t = -0.9 + (i / 14) * 3.75, p = castOut(C, v3(0, Math.sin(t), Math.cos(t)), 0.045);
      rows.push([k.point(p.x - 0.02, p.y, p.z), k.point(p.x + 0.02, p.y, p.z)]);
    }
    k.strip(rows.map((r) => r[0]), rows.map((r) => r[1]), false, (x, y, z) => [0, y - C.y, z - C.z]);
  }
  return build('semer', [[s, kaba('semer_hasiri', '#9a8458', '#6e5a36', '#c4b080'), (x, y, z) => [x * 6, y * 6 + z * 3]], [k, cloth('semer_askisi', 0x4a3424), null]]);
}

// ---------- Kıyafetler ----------
const ferace = (renk, yasmakRenk) => () => [
  ust('ferace', cloth('ferace', renk), { offset: 0.026, sleeve: 0.086, cuff: 0.012, hem: 0.1, flare: 0.04, curve: 1.4, neck: 0.085 }),
  ust('ferace_yakasi', cloth('ferace_yakasi', renk), { offset: 0.036, sleeve: 0.1, arm: 0.3, bottom: 1.36, neck: 0.1 }),
  ortu('yasmak', cloth('yasmak', yasmakRenk), { cowl: true, eyes: true, drape: 0.6, offset: 0.014 }),
  ayak('pabuc', 0x2a1c16),
];
const KIYAFETLER = {
  kadin_ferace_siyah: ferace(0x1b1b1e, 0xeeeae0),
  kadin_ferace_lacivert: ferace(0x1c2743, 0xe3d8b8),
  kadin_koylu: () => {
    const e = { offset: 0.018, hem: 0.12, flare: 0.045 }, pay = skirtPay(e);
    return [
      ust('entari', basma('basma_kirmizi', '#8a2a2a', ['#e8dcc0', '#e0b050', '#f0e8e0'], '#3a2a1a', '#2e5a34'), { ...e, sleeve: 0.086, uv: wrapUV(7, 3.2) }),
      ust('yelek', cloth('yelek', 0x243a2c), { offset: 0.03, sleeve: 0, bottom: 1.13, open: 0.045, lapel: 0.03, neck: 0.11 }),
      etek('onluk', cizgili('onluk_cizgi', '#d8d0b8', '#8a3a30', '#3a4a6a'), [[1.07, 0.04], [0.95, pay(0.95) + 0.012], [0.75, pay(0.75) + 0.012], [0.55, pay(0.55) + 0.014], [0.46, pay(0.46) + 0.014]], { half: 0.85, uv: (x, y) => [x * 9, y] }),
      kusak('kusak', cloth('kusak', 0xb58a2c), { y: 1.0, width: 0.09, pay: 0.046, tail: 0.2 }),
      ortu('yemeni', basma('yemeni_basma', '#e6dfcc', ['#b03a3a', '#3a5a8a'], '#d0a030', '#3a6a3a'), { offset: 0.012, cowl: true, drape: 0.3 }),
      ayak('carik', 0x5a4030),
    ];
  },
  kadin_yasli: () => [
    ust('gomlek', cloth('gomlek', 0x8f8674), { offset: 0.016, sleeve: 0, hem: 1.0, neck: 0.09 }),
    etek('etek', cloth('etek', 0x2c2a2e), [[1.09, 0.024], [1.03, 0.032], [0.96, 0.05], [0.9, 0.06], [0.7, 0.062], [0.45, 0.064], [0.2, 0.076], [0.1, 0.08]]),
    ust('hirka', kaba('hirka_yunu', '#3f2c20', '#2a1c14', '#5a4232'), { offset: 0.034, sleeve: 0.088, cuff: 0.008, hem: 0.86, flare: 0.062, open: 0.035, lapel: 0.035, neck: 0.11 }),
    ortu('bas_ortusu', cloth('bas_ortusu', 0xeeeae0), { offset: 0.014, cowl: true, drape: 1 }),
    ayak('pabuc', 0x2a1c16),
  ],
  cocuk_erkek_1: () => [
    ust('mintan', cloth('mintan', 0xe8e4d8), { offset: 0.016, sleeve: 0.086, hem: 0.99, vneck: 0.1 }),
    ust('yelek', cloth('yelek', 0x2f3b55), { offset: 0.028, sleeve: 0, bottom: 1.13, open: 0.05, lapel: 0.03, neck: 0.11 }),
    kusak('kusak', cloth('kusak', 0x8a3a2a), { y: 0.99, width: 0.08, pay: 0.05 }),
    bacak('salvar', 'salvar', 0x4a4038),
    fes(0xa01c1c, { h: 0.095, top: 0.072 }),
  ],
  cocuk_erkek_2: () => [
    ust('entari', cizgili('entari_cizgi', '#d9d2bc', '#5a7088', '#8a4a3a'), { offset: 0.018, sleeve: 0.086, hem: 0.34, flare: 0.03, vneck: 0.07, uv: wrapUV(30, 1) }),
    kusak('kusak', cloth('kusak', 0x8a3a2a), { y: 1.0, width: 0.08, pay: 0.038, tail: 0.16 }),
  ],
  cocuk_kiz: () => [
    ust('entari', basma('basma_mavi', '#3a5a7a', ['#f0e8d8', '#e8b0a0', '#e8d070'], '#7a3a2a', '#2e5a34'), { offset: 0.018, sleeve: 0.086, hem: 0.3, flare: 0.045, uv: wrapUV(7, 3.2) }),
    orguler(0.04),
    ortu('yemeni', cloth('yemeni', 0xe2d6a8), { offset: 0.011 }),
  ],
  esnaf: () => [
    ust('gomlek', cloth('gomlek', 0xe8e4d8), { offset: 0.016, sleeve: 0.086, hem: 0.99 }),
    ust('yelek', cloth('yelek', 0x25252b), { offset: 0.028, sleeve: 0, hem: 0.99, flare: 0.012, open: 0.03, lapel: 0.05, neck: 0.11 }),
    bacak('pantolon', 'pantolon', 0x3a3632),
    etek('onluk', cloth('onluk', 0x4c5e4c), [[1.075, 0.06], [1.03, 0.062], [0.9, 0.06], [0.7, 0.056], [0.5, 0.062], [0.36, 0.066]], { half: 1.0 }),
    kusak('onluk_bagi', cloth('onluk', 0x4c5e4c), { y: 1.03, width: 0.045, pay: 0.066 }),
    fes(), ayak('ayakkabi', 0x1a1614),
  ],
  hamal: () => [
    ust('gomlek', cloth('gomlek', 0xb5ad98), { offset: 0.016, sleeve: 0.086, hem: 0.99, vneck: 0.08 }),
    ust('cepken', kaba('cepken_abasi', '#4a3a2c', '#30241a', '#66523e'), { offset: 0.03, sleeve: 0.092, arm: 0.46, bottom: 1.16, open: 0.06, lapel: 0.03, neck: 0.11 }),
    kusak('kusak', cloth('kusak', 0x7a2a22), { y: 0.97, width: 0.13, pay: 0.048 }),
    bacak('dizlik', 'dizlik', 0x54483a),
    ayak('carik', 0x5a4030), semer(),
  ],
  hoca: () => [
    ust('entari', cloth('entari', 0x8f8a7c), { offset: 0.016, sleeve: 0.086, hem: 0.14, flare: 0.034, neck: 0.085 }),
    ust('cubbe', cloth('cubbe', 0x22252b), { offset: 0.04, sleeve: 0.1, cuff: 0.03, sleeveDrop: 0.02, hem: 0.12, flare: 0.07, open: 0.05, lapel: 0.02, neck: 0.115 }),
    sarik(), ayak('pabuc', 0x1a1614),
  ],
  koylu_2: () => [
    ust('gomlek', cloth('gomlek', 0xcfc8b4), { offset: 0.016, sleeve: 0.086, hem: 0.99, vneck: 0.06 }),
    kusak('kusak', cloth('kusak', 0x6a2c24), { y: 0.96, width: 0.13, pay: 0.052 }),
    ust('aba_ceket', kaba('aba', '#6e5a44', '#4a3a2a', '#8f7a60'), { offset: 0.036, sleeve: 0.094, hem: 0.88, flare: 0.034, open: 0.045, lapel: 0.03, neck: 0.112 }),
    bacak('potur', 'potur', 0x3a3028),
    ayak('carik', 0x6a4a30), kulah('#b0a48c'),
  ],
};
export const KIYAFET_ADLARI = Object.keys(KIYAFETLER);
export function createSehir(name) {
  const root = new THREE.Group();
  root.name = name;
  root.add(...KIYAFETLER[name]());
  const k = name.startsWith('cocuk') ? 0.65 : 1;
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = o.receiveShadow = true;
    if (k !== 1) o.geometry.scale(k, k, k);
  });
  return root;
}
