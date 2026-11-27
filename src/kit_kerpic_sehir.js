import * as THREE from 'three';
import * as K from './kit_ortak.js';
import { yuz, cephe, kutu, halka } from './hazire_yapilari.js';
const { V, TAU, Part } = K;

// Kerpiç şehir kiti: çöl / bozkır kasabası yapıları için modüler parçalar ve üç örnek yapı.
// Metre, Y yukarı. Duvar modülü 3,0 m en × 3,0 m yükseklik × 0,4 m kalınlık: orijin alt kenarın ortasında, dış yüz z = 0
// ve +Z'ye bakar, gövde z -0,4 … 0. Döşeme 3 × 3 × 0,25 m (orijin alt yüzün ortasında): kat aralığı 3,25 m.
// Kapı açıklığı 1,0 × 2,1 m, pencere açıklığı 0,9 × 1,1 m (denizlik 1,0 m): kapı ve pencere dolguları bunlara oturur.
const T = 0.4, c3 = (r, g, b, a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;
const hsh = (a, b, c) => { let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(c, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const toz = (g, w, h, r, k = 1) => { let gr = g.createLinearGradient(0, h * 0.82, 0, h); gr.addColorStop(0, c3(60, 44, 28, 0)); gr.addColorStop(1, c3(60, 44, 28, 0.4 * k)); g.fillStyle = gr; g.fillRect(0, h * 0.82, w, h * 0.18); gr = g.createLinearGradient(0, 0, 0, h * 0.12); gr.addColorStop(0, c3(50, 38, 26, 0.35 * k)); gr.addColorStop(1, c3(50, 38, 26, 0)); g.fillStyle = gr; g.fillRect(0, 0, w, h * 0.12); for (let i = 0; i < 12; i++) { const x = r() * w, L = 60 + r() * 200, ww = 8 + r() * 26; gr = g.createLinearGradient(0, 0, 0, L); gr.addColorStop(0, c3(50, 36, 22, 0.3 * k)); gr.addColorStop(1, c3(50, 36, 22, 0)); g.fillStyle = gr; g.fillRect(x, 0, ww, L); } for (let i = 0; i < 3000; i++) { g.fillStyle = r() < 0.5 ? c3(40, 28, 16, r() * 0.16) : c3(240, 224, 190, r() * 0.12); g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 3); } };
const kerpicP = (base) => (g, w, h, r) => { g.fillStyle = c3(...base); g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? c3(base[0] * 0.72, base[1] * 0.7, base[2] * 0.66, 0.1 + r() * 0.18) : c3(base[0] * 1.2, base[1] * 1.2, base[2] * 1.18, 0.1 + r() * 0.16); g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 80, 8 + r() * 50, r() * 3, 0, 7); g.fill(); } for (let i = 0; i < 900; i++) { g.strokeStyle = c3(214, 190, 140, 0.3); g.lineWidth = 1; const x = r() * w, y = r() * h, a = r() * 7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7); g.stroke(); } for (let i = 0; i < 9; i++) { g.strokeStyle = c3(60, 42, 26, 0.6); g.lineWidth = 1 + r(); g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let q = 0; q < 9; q++) { x += (r() - 0.5) * 40; y += 8 + r() * 26; g.lineTo(x, y); } g.stroke(); } toz(g, w, h, r); };
const ahsapP = (base, yatay) => (g, w, h, r) => { g.fillStyle = c3(...base.map((v) => v * 0.4)); g.fillRect(0, 0, w, h); for (let k = 0; k < 8; k++) { const v = 0.8 + r() * 0.4; g.fillStyle = c3(base[0] * v, base[1] * v, base[2] * v); if (yatay) g.fillRect(0, (k * h) / 8 + 1, w, h / 8 - 3); else g.fillRect((k * w) / 8 + 1, 0, w / 8 - 3, h); for (let i = 0; i < 24; i++) { g.strokeStyle = r() < 0.5 ? c3(20, 14, 8, 0.45) : c3(190, 170, 130, 0.2); g.lineWidth = 1; const o = (k * (yatay ? h : w)) / 8 + 2 + r() * ((yatay ? h : w) / 8 - 5); g.beginPath(); if (yatay) { g.moveTo(0, o); g.lineTo(w, o + (r() - 0.5) * 4); } else { g.moveTo(o, 0); g.lineTo(o + (r() - 0.5) * 4, h); } g.stroke(); } } toz(g, w, h, r, 0.7); };
const dolgu = (tip, base) => (g, w, h, r) => { ahsapP(base, false)(g, w, h, r); const f = w * 0.07; g.strokeStyle = c3(...base.map((v) => v * 0.5)); g.lineWidth = f; g.strokeRect(f / 2, f / 2, w - f, h - f); if (tip === 'cift') { g.fillStyle = c3(12, 9, 6, 0.9); g.fillRect(w / 2 - 2, 0, 4, h); } if (tip === 'panel') for (const [a, b] of [[0.12, 0.42], [0.55, 0.88]]) { g.strokeStyle = c3(...base.map((v) => v * 0.55)); g.lineWidth = 6; g.strokeRect(w * 0.18, h * a, w * 0.64, h * (b - a)); } if (tip === 'kepenk') { for (let y = f + 6; y < h - f - 6; y += 14) { g.fillStyle = c3(12, 9, 6, 0.7); g.fillRect(f + 6, y + 9, w - 2 * f - 12, 3); } g.fillStyle = c3(12, 9, 6, 0.9); g.fillRect(w / 2 - 2, 0, 4, h); } if (tip === 'kafes' || tip === 'parmak') { g.fillStyle = '#14100c'; g.fillRect(f, f, w - 2 * f, h - 2 * f); g.strokeStyle = tip === 'kafes' ? c3(...base) : '#3a342c'; g.lineWidth = tip === 'kafes' ? 6 : 7; if (tip === 'kafes') for (let k = -12; k < 24; k++) { g.beginPath(); g.moveTo(k * 22, 0); g.lineTo(k * 22 + h, h); g.stroke(); g.beginPath(); g.moveTo(k * 22, 0); g.lineTo(k * 22 - h, h); g.stroke(); } else for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo((k / 5) * w, f); g.lineTo((k / 5) * w, h - f); g.stroke(); g.beginPath(); g.moveTo(f, (k / 5) * h); g.lineTo(w - f, (k / 5) * h); g.stroke(); } g.strokeStyle = c3(...base.map((v) => v * 0.5)); g.lineWidth = f; g.strokeRect(f / 2, f / 2, w - f, h - f); } g.fillStyle = '#2a241c'; if (tip !== 'kafes' && tip !== 'parmak' && tip !== 'kepenk') { g.beginPath(); g.arc(w * (tip === 'cift' ? 0.44 : 0.84), h * 0.5, w * 0.03, 0, 7); g.fill(); } };
const M = K.materials('kerpic_sehir', {
  kerpic: [kerpicP([172, 136, 98]), 1024, 1024], kerpic_koyu: [kerpicP([120, 92, 64]), 512, 512], kum_tasi: [(g, w, h, r) => { g.fillStyle = '#7a6448'; g.fillRect(0, 0, w, h); for (let row = 0; row < 6; row++) { let x = -r() * 60; while (x < w) { const bw = 90 + r() * 100, v = 0.85 + r() * 0.25; g.fillStyle = c3(196 * v, 170 * v, 132 * v); g.fillRect(x + 2, (row * h) / 6 + 2, bw - 4, h / 6 - 4); x += bw; } } toz(g, w, h, r); }, 512, 512],
  ahsap_eski: [ahsapP([112, 86, 60], true), 512, 512], ahsap_koyu: [ahsapP([72, 54, 40], true), 512, 512], hasir: [(g, w, h, r) => { g.fillStyle = '#6a5a3a'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) { g.fillStyle = c3(150 + r() * 40, 126 + r() * 30, 80 + r() * 20); g.fillRect(0, y + 1, w, 5); } for (let x = 0; x < w; x += 64) { g.fillStyle = c3(60, 46, 28, 0.6); g.fillRect(x, 0, 4, h); } toz(g, w, h, r, 0.6); }, 256, 256],
  bez: [(g, w, h, r) => { g.fillStyle = '#7c7048'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { g.fillStyle = r() < 0.5 ? c3(50, 44, 26, 0.14) : c3(190, 176, 128, 0.14); g.fillRect(r() * w, r() * h, 1, 3 + r() * 8); } for (let i = 0; i < 50; i++) { g.fillStyle = c3(60, 50, 30, r() * 0.25); g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 50, 8 + r() * 30, 0, 0, 7); g.fill(); } }, 512, 512],
  teneke_mavi: [(g, w, h, r) => { g.fillStyle = '#4e8a8c'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 32) { const gr = g.createLinearGradient(x, 0, x + 32, 0); gr.addColorStop(0, c3(20, 40, 44, 0.4)); gr.addColorStop(0.5, c3(190, 220, 215, 0.2)); gr.addColorStop(1, c3(20, 40, 44, 0.4)); g.fillStyle = gr; g.fillRect(x, 0, 32, h); } for (let i = 0; i < 160; i++) { g.fillStyle = r() < 0.6 ? c3(130, 78, 40, 0.3 + r() * 0.4) : c3(200, 196, 180, 0.3); g.beginPath(); g.ellipse(r() * w, r() * h, 3 + r() * 26, 3 + r() * 16, 0, 0, 7); g.fill(); } toz(g, w, h, r, 0.8); }, 256, 256],
  kapi_tahta: [dolgu('tek', [104, 78, 52]), 256, 512], kapi_panelli: [dolgu('panel', [84, 66, 50]), 256, 512], kapi_cift: [dolgu('cift', [96, 72, 48]), 384, 512], kapi_mavi: [dolgu('panel', [86, 110, 116]), 256, 512],
  pencere_kepenk: [dolgu('kepenk', [100, 76, 52]), 256, 320], pencere_kafes: [dolgu('kafes', [116, 88, 58]), 256, 320], pencere_parmaklik: [dolgu('parmak', [104, 82, 58]), 256, 320], kafes_pano: [dolgu('kafes', [150, 120, 86]), 512, 256],
  pismis_toprak: [(g, w, h, r) => { g.fillStyle = '#a65a34'; g.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { g.fillStyle = r() < 0.5 ? c3(70, 34, 18, 0.2) : c3(214, 150, 110, 0.2); g.beginPath(); g.ellipse(r() * w, r() * h, 2 + r() * 14, 2 + r() * 8, 0, 0, 7); g.fill(); } }, 128, 128],
  demir: 0x2c2824, karanlik: 0x15110d,
});
for (const m of Object.values(M)) {
  m.side = THREE.DoubleSide; m.roughness = 0.95;
  if (!m.map) continue;
  const c = m.map.image, w = c.width, h = c.height, src = c.getContext('2d').getImageData(0, 0, w, h).data, o = document.createElement('canvas'); o.width = w; o.height = h;
  const g = o.getContext('2d'), out = g.createImageData(w, h), L = (x, y) => { const i = (((y + h) % h) * w + ((x + w) % w)) * 4; return (src[i] + src[i + 1] * 2 + src[i + 2]) / 1020; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = (L(x + 1, y) - L(x - 1, y)) * 2.4, dy = (L(x, y + 1) - L(x, y - 1)) * 2.4, l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4; out.data[i] = (-dx / l * 0.5 + 0.5) * 255; out.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; out.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; out.data[i + 3] = 255; }
  g.putImageData(out, 0, 0);
  m.normalMap = new THREE.CanvasTexture(o); m.normalMap.name = m.name + '_kabartma'; m.normalMap.wrapS = m.normalMap.wrapT = THREE.RepeatWrapping; m.normalMap.colorSpace = THREE.NoColorSpace;
}

// ---------- Yardımcılar ----------
const UP = V(0, 1, 0), F0 = yuz(V(0, 0, 0), V(0, 0, 1));
const kw = (P, mat, x0, x1, y0, y1, z0, z1, s = 2) => K.box(P, mat, x0, x1, y0, y1, z0, z1, K.ALL, s);
const dq = (P, mat, pts, n, s = 3) => { const a = [Math.abs(n.x), Math.abs(n.y), Math.abs(n.z)], m = Math.max(...a); P.quad(mat, pts, pts.map((q) => (a[1] === m ? [q.x / s, q.z / s] : a[2] === m ? [q.x / s, q.y / s] : [q.z / s, q.y / s])), n); };
// Duvar: ops = [[u, en, y0, dikdörtgen yükseklik, kemer yüksekliği, kemer tipi, dolgu (null = açık), derinlik]]
function duvar(P, ops = [], o = {}) {
  const w = o.w ?? 3, h = o.h ?? 3, t = o.t ?? T, mat = o.mat || 'kerpic', hw = w / 2;
  const A = ops.map(([u, ww, ya, hh, rise = 0, tip, fill = null, depth]) => ({ u0: u - ww / 2, u1: u + ww / 2, y0: ya, ys: ya + hh, rise, tip, fill, depth: depth ?? (fill ? 0.14 : t), reveal: o.sove || mat }));
  cephe(P, F0, w, [[0, h, mat, 3]], A);
  cephe(P, yuz(V(0, 0, -t), V(0, 0, -1)), w, [[0, h, mat, 3]], A.filter((a) => !a.fill).map((a) => ({ ...a, u0: -a.u1, u1: -a.u0, depth: 0.004 })));
  for (const s of [-1, 1]) dq(P, mat, [V(s * hw, 0, -t), V(s * hw, 0, 0), V(s * hw, h, 0), V(s * hw, h, -t)], V(s, 0, 0));
  for (const [y, n] of [[h, 1], [0, -1]]) dq(P, mat, [V(-hw, y, -t), V(hw, y, -t), V(hw, y, 0), V(-hw, y, 0)], V(0, n, 0));
}
const kapiOp = (u = 0, f = null) => [u, 1.0, 0, 2.1, 0, undefined, f], penOp = (u = 0, f = null) => [u, 0.9, 1.0, 1.1, 0, undefined, f];
const direk = (P, x, z, y0, y1, r = 0.06, mat = 'ahsap_eski') => K.cyl(P, mat, V(x, y0, z), V(x, y1, z), r, 7);
const kiris = (P, a, b, r = 0.05, mat = 'ahsap_eski') => K.cyl(P, mat, a, b, r, 6);
const ortu = (P, mat, x0, x1, za, ya, zb, yb, sag = 0, s = 1.5) => { const nx = sag ? 5 : 1, nz = sag ? 4 : 1; for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const pt = (a, b) => V(x0 + (x1 - x0) * a, ya + (yb - ya) * b - sag * Math.sin(a * Math.PI) * Math.sin(b * Math.PI), za + (zb - za) * b); P.quad(mat, [pt(i / nx, j / nz), pt((i + 1) / nx, j / nz), pt((i + 1) / nx, (j + 1) / nz), pt(i / nx, (j + 1) / nz)], [[(i / nx) * (x1 - x0) / s, j / nz * 1.5], [((i + 1) / nx) * (x1 - x0) / s, j / nz * 1.5], [((i + 1) / nx) * (x1 - x0) / s, (j + 1) / nz * 1.5], [(i / nx) * (x1 - x0) / s, (j + 1) / nz * 1.5]], UP); } };
const sutunCiz = (P, x, z, h, r = 0.16) => halka(P, 'kum_tasi', [[r * 1.6, 0], [r * 1.6, 0.18], [r * 1.15, 0.3], [r, 0.42], [r * 0.9, h - 0.5], [r * 1.05, h - 0.42], [r * 1.6, h - 0.2], [r * 1.7, h - 0.12], [r * 1.7, h]], 10, 0, 1, x, z);
const kubbe = (P, R, y0, n = 16, mat = 'kerpic', k = 1) => { const prof = Array.from({ length: 9 }, (_, i) => { const t = (i / 8) * Math.PI / 2; return [R * Math.cos(t) ** 0.9, y0 + R * k * Math.sin(t)]; }); prof[8][0] = 0.06; halka(P, mat, prof, n, 0, 1.5); halka(P, mat, [[0.06, y0 + R * k], [0.12, y0 + R * k + 0.14], [0.04, y0 + R * k + 0.3], [0, y0 + R * k + 0.5]], 6); };
const caprazKork = (P, x0, x1, y, z, h = 0.9, mat = 'ahsap_koyu') => { const n = Math.max(1, Math.round((x1 - x0) / 1.0)), d = (x1 - x0) / n; K.beam(P, mat, V(x0, y + h, z), V(x1, y + h, z), 0.07, 0.07); K.beam(P, mat, V(x0, y + 0.12, z), V(x1, y + 0.12, z), 0.06, 0.06); for (let k = 0; k <= n; k++) K.beam(P, mat, V(x0 + k * d, y, z), V(x0 + k * d, y + h, z), 0.07, 0.07, false); for (let k = 0; k < n; k++) { K.beam(P, mat, V(x0 + k * d, y + 0.12, z), V(x0 + (k + 1) * d, y + h, z), 0.04, 0.04, false); K.beam(P, mat, V(x0 + k * d, y + h, z), V(x0 + (k + 1) * d, y + 0.12, z), 0.04, 0.04, false); } };

// ---------- Parçalar ----------
const DEFS = {
  // Duvarlar (3 × 3 × 0,4)
  duvar_duz: (P) => duvar(P),
  duvar_kapi: (P) => duvar(P, [kapiOp()]),
  duvar_kapi_kemerli: (P) => duvar(P, [[0, 1.2, 0, 1.6, 0.75, undefined]]),
  duvar_kapi_genis: (P) => duvar(P, [[0, 1.8, 0, 2.3]]),
  duvar_pencere: (P) => duvar(P, [penOp()]),
  duvar_pencere_cift: (P) => duvar(P, [penOp(-0.75), penOp(0.75)]),
  duvar_pencere_kemerli: (P) => duvar(P, [[0, 0.9, 1.0, 0.8, 0.5, undefined]]),
  duvar_pencere_uclu: (P) => duvar(P, [-0.8, 0, 0.8].map((u) => [u, 0.5, 1.5, 0.5, 0.28, undefined])),
  duvar_menfez: (P) => duvar(P, [-0.9, -0.3, 0.3, 0.9].map((u) => [u, 0.22, 2.2, 0.22])),
  duvar_kapi_pencere: (P) => duvar(P, [kapiOp(-0.8), penOp(0.8)]),
  duvar_dukkan: (P) => duvar(P, [[0, 2.2, 0.9, 1.4]]),
  duvar_kemer_acik: (P) => duvar(P, [[0, 2.2, 0, 1.5, 1.1, 'yuvarlak']]),
  duvar_nis: (P) => duvar(P, [[0, 1.3, 0.3, 1.4, 0.8, undefined, 'kerpic_koyu']]),
  duvar_yarim: (P) => duvar(P, [], { w: 1.5 }),
  duvar_alcak: (P) => duvar(P, [], { h: 1.0 }),
  kose_direk: (P) => kw(P, 'kerpic', -0.2, 0.2, 0, 3, -0.4, 0, 3),
  // Dam korkulukları (3 m; damın kenarına, duvarın üstüne)
  korkuluk_duz: (P) => duvar(P, [], { h: 0.6, t: 0.3 }),
  korkuluk_kafesli: (P) => { duvar(P, [], { h: 0.25, t: 0.3 }); for (const x of [-1.4, 0, 1.4]) kw(P, 'kerpic', x - 0.1, x + 0.1, 0.25, 0.85, -0.3, 0, 3); kw(P, 'kerpic', -1.5, 1.5, 0.85, 0.95, -0.3, 0, 3); for (const [a, b] of [[-1.3, -0.1], [0.1, 1.3]]) for (const z of [-0.04, -0.26]) P.quad('kafes_pano', [V(a, 0.25, z), V(b, 0.25, z), V(b, 0.85, z), V(a, 0.85, z)], [[0, 0], [1, 0], [1, 1], [0, 1]], V(0, 0, z > -0.1 ? 1 : -1)); },
  korkuluk_dendanli: (P) => { duvar(P, [], { h: 0.5, t: 0.3 }); for (let k = 0; k < 5; k++) kw(P, 'kerpic', -1.5 + k * 0.66, -1.5 + k * 0.66 + 0.36, 0.5, 0.85, -0.3, 0, 3); },
  korkuluk_ahsap: (P) => caprazKork(P, -1.5, 1.5, 0, -0.1),
  // Taş kemer ve sütunlar
  sutun: (P) => sutunCiz(P, 0, 0, 3),
  sutun_kisa: (P) => sutunCiz(P, 0, 0, 2.2, 0.13),
  kemer_sivri: (P) => duvar(P, [[0, 2.3, 0, 1.3, 1.35, undefined]], { mat: 'kum_tasi' }),
  kemer_yuvarlak: (P) => duvar(P, [[0, 2.3, 0, 1.4, 1.15, 'yuvarlak']], { mat: 'kum_tasi' }),
  kemer_pencereli: (P) => duvar(P, [[0, 2.3, 0, 1.0, 1.0, undefined], ...[-0.8, 0, 0.8].map((u) => [u, 0.4, 2.3, 0.3, 0.2, undefined])], { mat: 'kum_tasi' }),
  kemer_dilimli: (P) => duvar(P, [[0, 2.3, 0, 1.3, 1.2, 'dilimli']], { mat: 'kum_tasi' }),
  kemer_kopru: (P) => { duvar(P, [[0, 2.4, 0, 0.001, 0.6, 'yuvarlak']], { mat: 'kum_tasi', h: 0.9 }); },
  // Döşeme, kubbeler, kule
  doseme_3x3: (P) => { kw(P, 'kerpic', -1.5, 1.5, 0.1, 0.25, -1.5, 1.5, 3); for (let k = 0; k < 6; k++) kw(P, 'ahsap_eski', -1.5, 1.5, 0, 0.1, -1.35 + k * 0.52, -1.35 + k * 0.52 + 0.12); },
  doseme_hasir: (P) => { kw(P, 'hasir', -1.5, 1.5, 0.1, 0.16, -1.5, 1.5, 1.5); for (let k = 0; k < 6; k++) kw(P, 'ahsap_eski', -1.5, 1.5, 0, 0.1, -1.35 + k * 0.52, -1.35 + k * 0.52 + 0.12); },
  kiris_uclari: (P) => { for (let k = 0; k < 6; k++) K.cyl(P, 'ahsap_eski', V(-1.25 + k * 0.5, -0.12, -0.3), V(-1.25 + k * 0.5, -0.12, 0.42), 0.075, 8); }, // duvarın üstüne: dışarı taşan tavan kirişi uçları
  kubbe_buyuk: (P) => { halka(P, 'kerpic', [[3.92, 0], [3.92, 0.9], [3.75, 0.95]], 8, Math.PI / 8, 1.5); kubbe(P, 3.6, 0.95, 20); }, // sekizgen kasnak (kenarı 3 m) + kubbe
  kubbe_orta: (P) => { halka(P, 'kerpic', [[2.12, 0], [2.12, 0.3], [2.0, 0.35]], 4, Math.PI / 4, 1.5); kubbe(P, 1.45, 0.35, 14); }, // 3 × 3 odanın üstüne
  kubbe_kucuk: (P) => kubbe(P, 0.75, 0, 10),
  kubbe_kosk: (P) => { for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; sutunCiz(P, Math.sin(a) * 0.85, Math.cos(a) * 0.85, 1.7, 0.07); } halka(P, 'kum_tasi', [[1.05, 1.7], [1.15, 1.76], [1.15, 1.9], [0.95, 1.95]], 6, 0, 1); kubbe(P, 0.95, 1.95, 12, 'kerpic', 0.85); halka(P, 'kum_tasi', [[1.05, 0], [1.05, 0.12], [0, 0.12]], 6, 0, 1); },
  kule_ruzgar: (P) => { // rüzgâr kulesi (badgir): 2,4 × 2,4 × 6
    for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU, N = V(Math.sin(a), 0, Math.cos(a)), F = yuz(N.clone().multiplyScalar(1.2), N); cephe(P, F, 2.4, [[0, 6, 'kum_tasi', 3]], [{ u0: -0.6, u1: 0.6, y0: 0, ys: 1.5, rise: 0.8, fill: 'karanlik', depth: 0.3, reveal: 'kum_tasi' }, { u0: -0.85, u1: 0.85, y0: 3.9, ys: 5.3, rise: 0, fill: 'kafes_pano', depth: 0.1, reveal: 'kum_tasi' }]); kutu(P, F, -1.3, 1.3, 3.3, 3.5, 0, 0.12, 'kum_tasi'); kutu(P, F, -1.35, 1.35, 5.8, 6.0, 0, 0.16, 'kum_tasi'); for (const s of [-1, 1]) kutu(P, F, s * 1.2 - 0.15, s * 1.2 + 0.15, 6, 6.6, -0.3, 0, 'kum_tasi'); }
    dq(P, 'kum_tasi', [V(-1.2, 6, -1.2), V(1.2, 6, -1.2), V(1.2, 6, 1.2), V(-1.2, 6, 1.2)], UP);
  },
  // Merdivenler
  merdiven_kerpic: (P) => { for (let k = 0; k < 13; k++) kw(P, 'kerpic', -0.6, 0.6, 0, (k + 1) * 0.25, -(k + 1) * 0.3, -k * 0.3, 3); kw(P, 'kerpic', 0.6, 0.85, 0, 0.9, -0.3, 0, 3); for (let k = 0; k < 13; k++) kw(P, 'kerpic', 0.6, 0.85, 0, (k + 1) * 0.25 + 0.75, -(k + 1) * 0.3, -k * 0.3, 3); }, // 3,25 m çıkar, 3,9 m ilerler (-Z'ye)
  el_merdiveni: (P) => { const top = V(0, 3.9, -1.1); for (const s of [-1, 1]) kiris(P, V(s * 0.28, 0, 0), top.clone().setX(s * 0.22), 0.035); for (let k = 1; k <= 11; k++) { const t = k / 12.5; kiris(P, V(-0.3 + t * 0.06, 3.9 * t, -1.1 * t), V(0.3 - t * 0.06, 3.9 * t, -1.1 * t), 0.025); } }, // duvara yaslanır: üst ucu 1,1 m geride
  // Ahşap ve bez örtüler
  cardak: (P) => { for (const x of [-1.4, 1.4]) for (const z of [-1.4, 1.4]) direk(P, x, z, 0, 2.5); for (const z of [-1.4, 1.4]) kiris(P, V(-1.6, 2.5, z), V(1.6, 2.5, z), 0.06); for (let k = 0; k < 9; k++) kiris(P, V(-1.4 + k * 0.35, 2.6, -1.65), V(-1.4 + k * 0.35, 2.6, 1.65), 0.035); for (let k = 0; k < 5; k++) kiris(P, V(-1.6, 2.66, -1.4 + k * 0.7), V(1.6, 2.66, -1.4 + k * 0.7), 0.025); },
  cardak_hasirli: (P) => { DEFS.cardak(P); P.quad('hasir', [V(-1.5, 2.7, -1.5), V(1.5, 2.7, -1.5), V(1.5, 2.7, 1.5), V(-1.5, 2.7, 1.5)], [[0, 0], [2, 0], [2, 2], [0, 2]], UP); },
  sundurma_ahsap: (P) => { ortu(P, 'ahsap_eski', -1.5, 1.5, 0, 2.9, 2.0, 2.4); for (const x of [-1.4, 1.4]) { direk(P, x, 1.9, 0, 2.42); kiris(P, V(x, 2.88, 0), V(x, 2.4, 2.0), 0.05); } kiris(P, V(-1.5, 2.4, 1.9), V(1.5, 2.4, 1.9), 0.05); caprazKork(P, -1.4, 1.4, 0, 1.9, 0.8, 'ahsap_eski'); },
  sundurma_teneke: (P) => { ortu(P, 'teneke_mavi', -1.5, 1.5, 0, 2.9, 2.0, 2.4, 0, 1); for (const x of [-1.4, 1.4]) { direk(P, x, 1.9, 0, 2.42); kiris(P, V(x, 2.88, 0), V(x, 2.4, 2.0), 0.05); } kiris(P, V(-1.5, 2.4, 1.9), V(1.5, 2.4, 1.9), 0.05); },
  tente_bez: (P) => { ortu(P, 'bez', -1.5, 1.5, -1.5, 2.7, 1.5, 2.5, 0.3); for (const [x, z, y] of [[-1.5, -1.5, 2.7], [1.5, -1.5, 2.7], [-1.5, 1.5, 2.5], [1.5, 1.5, 2.5]]) K.cyl(P, 'ahsap_eski', V(x * 1.08, 0, z * 1.08), V(x, y + 0.2, z), 0.04, 6); },
  tente_egik: (P) => { ortu(P, 'bez', -1.5, 1.5, 0, 2.8, 2.2, 1.9, 0.15); for (const x of [-1.5, 1.5]) K.cyl(P, 'ahsap_eski', V(x, 0, 2.3), V(x, 2.1, 2.2), 0.04, 6); },
  tezgah_teneke: (P) => { ortu(P, 'teneke_mavi', -1.2, 1.2, -0.8, 2.3, 0.8, 2.0, 0, 1); for (const x of [-1.1, 1.1]) for (const z of [-0.7, 0.7]) direk(P, x, z, 0, z < 0 ? 2.28 : 2.02, 0.04); kw(P, 'ahsap_eski', -1.1, 1.1, 0.8, 0.86, -0.5, 0.5); for (const x of [-1.0, 1.0]) kw(P, 'ahsap_eski', x - 0.04, x + 0.04, 0, 0.8, -0.45, 0.45); },
  balkon_ahsap: (P) => { kw(P, 'ahsap_eski', -1.0, 1.0, -0.08, 0, 0, 0.8); for (const x of [-0.9, 0.9]) K.beam(P, 'ahsap_koyu', V(x, -0.6, 0.02), V(x, -0.08, 0.7), 0.08, 0.07); caprazKork(P, -0.95, 0.95, 0, 0.75, 0.85); for (const x of [-0.95, 0.95]) { K.beam(P, 'ahsap_koyu', V(x, 0.85, 0), V(x, 0.85, 0.75), 0.07, 0.07); K.beam(P, 'ahsap_koyu', V(x, 0.12, 0), V(x, 0.12, 0.75), 0.06, 0.06); } }, // orijin döşemenin duvara değdiği kenarın ortası
  cumba_kafesli: (P) => { kw(P, 'ahsap_koyu', -0.8, 0.8, 0, 1.9, 0, 0.6); for (const [a, b, n] of [[V(-0.7, 0.5, 0.605), V(0.7, 0.5, 0.605), V(0, 0, 1)], [V(-0.805, 0.5, 0.05), V(-0.805, 0.5, 0.55), V(-1, 0, 0)], [V(0.805, 0.5, 0.05), V(0.805, 0.5, 0.55), V(1, 0, 0)]]) P.quad('pencere_kafes', [a, b, b.clone().setY(1.7), a.clone().setY(1.7)], [[0, 0], [1, 0], [1, 1], [0, 1]], n); for (const x of [-0.7, 0.7]) K.beam(P, 'ahsap_koyu', V(x, -0.5, 0.02), V(x, 0, 0.5), 0.08, 0.07); ortu(P, 'ahsap_eski', -0.9, 0.9, 0, 2.15, 0.75, 1.9); },
  cit_ahsap: (P) => { for (const x of [-1.45, 0, 1.45]) direk(P, x, 0, 0, 1.1, 0.05); for (const y of [0.4, 0.85]) kiris(P, V(-1.5, y, 0.05), V(1.5, y + 0.05, 0.05), 0.035); kiris(P, V(-1.4, 0.3, -0.05), V(-0.1, 0.95, -0.05), 0.03); },
  // Kapı ve pencere dolguları (açıklığın içine, duvar yüzünden 0,2 m içeri)
  kapi_tahta: (P) => dolguCiz(P, 'kapi_tahta', 1.0, 2.1), kapi_panelli: (P) => dolguCiz(P, 'kapi_panelli', 1.0, 2.1), kapi_mavi: (P) => dolguCiz(P, 'kapi_mavi', 1.0, 2.1), kapi_cift: (P) => dolguCiz(P, 'kapi_cift', 1.8, 2.3),
  pencere_kepenk: (P) => dolguCiz(P, 'pencere_kepenk', 0.9, 1.1), pencere_kafes: (P) => dolguCiz(P, 'pencere_kafes', 0.9, 1.1), pencere_parmaklik: (P) => dolguCiz(P, 'pencere_parmaklik', 0.9, 1.1),
  // Eşyalar
  sira: (P) => { kw(P, 'ahsap_eski', -0.9, 0.9, 0.42, 0.48, -0.2, 0.2); for (const x of [-0.75, 0.75]) kw(P, 'ahsap_eski', x - 0.04, x + 0.04, 0, 0.42, -0.17, 0.17); },
  el_arabasi: (P) => { kw(P, 'ahsap_eski', -0.5, 0.5, 0.5, 0.56, -0.8, 0.8); for (const s of [-1, 1]) { kw(P, 'ahsap_eski', s * 0.5 - 0.02, s * 0.5 + 0.02, 0.56, 0.8, -0.8, 0.8); K.cyl(P, 'ahsap_koyu', V(s * 0.58, 0.4, -0.2), V(s * 0.64, 0.4, -0.2), 0.4, 12); K.beam(P, 'ahsap_eski', V(s * 0.4, 0.5, 0.8), V(s * 0.4, 0.35, 2.0), 0.05, 0.05); } K.cyl(P, 'ahsap_koyu', V(-0.6, 0.4, -0.2), V(0.6, 0.4, -0.2), 0.04, 6); K.beam(P, 'ahsap_eski', V(0, 0, 0.7), V(0, 0.5, 0.7), 0.05, 0.05); },
  fici: (P) => { halka(P, 'ahsap_eski', [[0, 0], [0.27, 0], [0.33, 0.3], [0.33, 0.55], [0.27, 0.85], [0, 0.85]], 10, 0, 1); for (const y of [0.12, 0.72]) halka(P, 'demir', [[0.3, y - 0.02], [0.31, y], [0.3, y + 0.02]], 10); },
  kup: (P) => halka(P, 'pismis_toprak', [[0, 0], [0.14, 0], [0.3, 0.3], [0.32, 0.5], [0.2, 0.75], [0.13, 0.82], [0.17, 0.9], [0.13, 0.9], [0.1, 0.8]], 10, 0, 1),
  comlek: (P) => halka(P, 'pismis_toprak', [[0, 0], [0.1, 0], [0.18, 0.12], [0.16, 0.26], [0.12, 0.3], [0.14, 0.34], [0.11, 0.34]], 8, 0, 1),
  kasa: (P) => { kw(P, 'ahsap_eski', -0.3, 0.3, 0, 0.4, -0.22, 0.22); for (const y of [0.05, 0.3]) kw(P, 'ahsap_koyu', -0.31, 0.31, y, y + 0.05, -0.23, 0.23); },
};
function dolguCiz(P, mat, w, h) { for (const z of [-0.2, -0.24]) P.quad(mat, [V(-w / 2, 0, z), V(w / 2, 0, z), V(w / 2, h, z), V(-w / 2, h, z)], [[0, 0], [1, 0], [1, 1], [0, 1]], V(0, 0, z > -0.22 ? 1 : -1)); for (const [a, b] of [[V(-w / 2, 0, -0.2), V(-w / 2, 0, -0.24)], [V(w / 2, 0, -0.24), V(w / 2, 0, -0.2)]]) P.quad(mat, [a, b, b.clone().setY(h), a.clone().setY(h)], [[0, 0], [0.04, 0], [0.04, 1], [0, 1]], V(a.x, 0, 0)); }
export const KERPIC_PARCALAR = Object.keys(DEFS);
const cache = new Map();
export function createKerpicParca(name) {
  if (!cache.has(name)) { const p = new Part(name); DEFS[name](p); cache.set(name, p.mesh(M)); }
  const src = cache.get(name), m = new THREE.Mesh(src.geometry, src.material);
  m.name = name; m.castShadow = m.receiveShadow = true;
  return m;
}
export function createKerpicKit() {
  const root = new THREE.Group(); root.name = 'kerpic_sehir_kiti';
  KERPIC_PARCALAR.forEach((n, i) => { const m = createKerpicParca(n); m.position.set((i % 10 - 4.5) * 5, 0, -Math.floor(i / 10) * 7); root.add(m); });
  return root;
}
// ---------- Örnek yapılar (yalnız kit parçalarıyla) ----------
const KAT = 3.25, Q = Math.PI / 2;
function kur(name, f) { const g = new THREE.Group(); g.name = name; const put = (n, x, y, z, rot = 0) => { const m = createKerpicParca(n); m.position.set(x, y, z); m.rotation.y = rot; g.add(m); return m; }; f(put, (x0, z0, nx, nz, y, w) => { // dikdörtgen oda: w = { on: [...], arka, sol, sag } parça adları ya da [ad, dolgu]
    const W = nx * 3, D = nz * 3, one = (list, k, x, z, rot) => { const e = list?.[k] ?? 'duvar_duz', [n, d] = Array.isArray(e) ? e : [e]; if (n) put(n, x, y, z, rot); if (d) put(d, x, y + (d.startsWith('pencere') ? 1.0 : 0), z, rot); };
    for (let k = 0; k < nx; k++) { one(w.on, k, x0 + 1.5 + k * 3, z0 + D, 0); one(w.arka, k, x0 + W - 1.5 - k * 3, z0, Math.PI); }
    for (let k = 0; k < nz; k++) { one(w.sag, k, x0 + W, z0 + D - 1.5 - k * 3, Q); one(w.sol, k, x0, z0 + 1.5 + k * 3, -Q); }
    if (w.dam !== false) for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) put(w.dam || 'doseme_3x3', x0 + 1.5 + i * 3, y + 3, z0 + 1.5 + j * 3);
    if (w.kork) { for (let k = 0; k < nx; k++) { put(w.kork, x0 + 1.5 + k * 3, y + KAT, z0 + D, 0); put(w.kork, x0 + W - 1.5 - k * 3, y + KAT, z0, Math.PI); } for (let k = 0; k < nz; k++) { put(w.kork, x0 + W, y + KAT, z0 + D - 1.5 - k * 3, Q); put(w.kork, x0, y + KAT, z0 + 1.5 + k * 3, -Q); } }
    if (w.kiris) for (let k = 0; k < nx; k++) put('kiris_uclari', x0 + 1.5 + k * 3, y + 3, z0 + D, 0);
  }); return g; }
export const KERPIC_ORNEKLER = {
  ornek_carsi_hani: () => kur('ornek_carsi_hani', (put, oda) => {
    oda(-7.5, -3, 5, 2, 0, { on: [['duvar_kapi', 'kapi_tahta'], ['duvar_pencere', 'pencere_parmaklik'], 'duvar_dukkan', ['duvar_kapi', 'kapi_panelli'], ['duvar_pencere', 'pencere_kepenk']], sag: [['duvar_pencere', 'pencere_kafes'], 'duvar_duz'], sol: ['duvar_duz', ['duvar_pencere', 'pencere_kepenk']] });
    oda(-7.5, -3, 5, 2, KAT, { on: ['duvar_duz', ['duvar_pencere', 'pencere_kepenk'], ['duvar_pencere', 'pencere_kafes'], ['duvar_kapi', 'kapi_mavi'], ['duvar_pencere', 'pencere_parmaklik']], sag: ['duvar_menfez', ['duvar_pencere', 'pencere_kepenk']], kork: 'korkuluk_kafesli' });
    put('cumba_kafesli', -6, KAT + 0.6, 3); put('balkon_ahsap', 3, KAT, 3); put('sundurma_ahsap', -1.5, 0, 3); put('sundurma_ahsap', 1.5, 0, 3); put('sundurma_teneke', 6, 0, 3); put('fici', 7.9, 0, 3.6); put('el_arabasi', 4.2, 0, 4.6, 1.2); put('sira', -4.5, 0, 3.5); put('kup', -6.8, 0, 3.5);
  }),
  ornek_turbe: () => kur('ornek_turbe', (put) => {
    const ap = 1.5 / Math.tan(Math.PI / 8);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU, x = Math.sin(a) * ap, z = Math.cos(a) * ap; put(k % 2 ? 'kemer_pencereli' : 'kemer_sivri', x, 0, z, a); put('duvar_nis', x, 3, z, a).scale.set(1, 0.6, 1); const c = a + Math.PI / 8, R = ap / Math.cos(Math.PI / 8) + 0.1; put('sutun', Math.sin(c) * R, 0, Math.cos(c) * R); put('kubbe_kucuk', Math.sin(c) * (R - 0.3), 4.8, Math.cos(c) * (R - 0.3)).scale.setScalar(0.5); }
    put('kubbe_buyuk', 0, 4.8, 0);
  }),
  ornek_kerpic_ev: () => kur('ornek_kerpic_ev', (put, oda) => {
    oda(-6, -3, 2, 2, 0, { on: [['duvar_kapi', null], 'duvar_menfez'], sol: ['duvar_menfez', 'duvar_duz'], kiris: true });
    oda(0, -3, 2, 2, 0, { on: ['duvar_menfez', ['duvar_kapi', null]], sag: ['duvar_duz', 'duvar_menfez'], kiris: true, kork: 'korkuluk_duz' });
    oda(-6, -3, 1, 2, KAT, { on: [['duvar_kapi', null]], sag: ['duvar_menfez', 'duvar_duz'], kiris: true });
    put('cardak', -1.5, KAT + 0.25, -1.5); put('cardak_hasirli', 4.5, KAT + 0.85, 1.5); put('el_merdiveni', -1.5, 0, 4.1); put('el_merdiveni', 2.5, 0, 4.1); put('el_merdiveni', -2.2, KAT + 0.25, 1.4, -Q).scale.set(1, 0.9, 1); put('kup', 3, 0, 3.6); put('comlek', 3.6, 0, 3.5); put('kasa', -4.5, 0, 3.5);
  }),
};
