import * as THREE from 'three';
import * as K from './kit_ortak.js';
const { V, TAU, Part } = K;

// Batık Osmanlı ahşap gemileri: küçükten büyüğe beş çeşit. Her biri iskele yanına yatmış; kıç kasara sağlam, orta bölüm
// çürüyüp açılmış, kaburgalar ortada, güverteler içeriden görülür. Yalnız gemi: zemin ve dağınık enkaz yok.
// Metre, Y yukarı; en alt nokta y = 0; pruva +X.
export const BATIK_GEMILER = [
  { ad: 'batik_gemi_1_cektiri', L: 17, B: 2.6, H: 3.2, HB: 1.6, kic: 1.3, bas: 0.5, decks: [], masts: [[0.08, 9]], heel: 0.55, ports: 0, seed: 11 },
  { ad: 'batik_gemi_2_sebek', L: 27, B: 3.7, H: 4.8, HB: 2.1, kic: 1.9, bas: 0.8, decks: [2.5], masts: [[-0.38, 11], [0.28, 0]], heel: 0.5, ports: 0, seed: 23 },
  { ad: 'batik_gemi_3_korvet', L: 38, B: 5.0, H: 6.6, HB: 2.8, kic: 2.4, bas: 1.1, decks: [3.2], masts: [[-0.56, 13], [-0.06, 0], [0.5, 18]], heel: 0.47, ports: 1, seed: 37 },
  { ad: 'batik_gemi_4_firkateyn', L: 50, B: 6.4, H: 8.6, HB: 3.4, kic: 2.7, bas: 1.3, decks: [3.4, 6.0], masts: [[-0.58, 17], [-0.06, 0], [0.48, 23]], heel: 0.42, ports: 1, seed: 53 },
  { ad: 'batik_gemi_5_kalyon', L: 64, B: 8.2, H: 11.2, HB: 4.1, kic: 3.0, pupa: 2.4, bas: 1.7, decks: [3.8, 6.3, 8.8], masts: [[-0.6, 20], [-0.08, 0], [0.46, 28]], heel: 0.36, ports: 2, seed: 71 },
];
const hsh = (a, b, c) => { let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(c, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const vn = (x, y, c) => { const ix = Math.floor(x), iy = Math.floor(y); let fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); const l = (a, b, t) => a + (b - a) * t; return l(l(hsh(ix, iy, c), hsh(ix + 1, iy, c), fx), l(hsh(ix, iy + 1, c), hsh(ix + 1, iy + 1, c), fx), fy); };

// ---------- Dokular ----------
const c3 = (r, g, b, a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;
function deniz(g, w, h, r, yosun = 1) { // yosun, midye kabukları, çürük oyukları
  for (let k = 0; k < 150 * yosun; k++) { g.fillStyle = r() < 0.6 ? c3(40 + r() * 20, 76 + r() * 30, 50 + r() * 16, 0.1 + r() * 0.3) : c3(86, 100 + r() * 20, 58, 0.1 + r() * 0.22); g.beginPath(); g.ellipse(r() * w, r() * h, 6 + r() * 50, 4 + r() * 26, r() * 3, 0, 7); g.fill(); }
  for (let k = 0; k < 26; k++) { const x = r() * w, y = r() * h; for (let i = 0; i < 22; i++) { g.fillStyle = c3(196, 190, 164, 0.4 + r() * 0.4); g.beginPath(); g.arc(x + (r() - 0.5) * 46, y + (r() - 0.5) * 30, 1 + r() * 2.6, 0, 7); g.fill(); } }
  for (let k = 0; k < 70; k++) { g.fillStyle = c3(8, 7, 5, 0.4 + r() * 0.45); g.beginPath(); g.ellipse(r() * w, r() * h, 2 + r() * 12, 1 + r() * 5, r() * 3, 0, 7); g.fill(); }
  for (let k = 0; k < 2600; k++) { g.fillStyle = r() < 0.6 ? c3(12, 12, 8, r() * 0.2) : c3(150, 160, 130, r() * 0.1); g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
}
const tahta = (base, rows, yosun) => (g, w, h, r) => {
  g.fillStyle = '#14120e'; g.fillRect(0, 0, w, h);
  for (let k = 0; k < rows; k++) {
    const y = (k * h) / rows, v = 0.8 + r() * 0.4;
    g.fillStyle = c3(base[0] * v, base[1] * v, base[2] * v); g.fillRect(0, y + 2, w, h / rows - 4);
    for (let i = 0; i < 36; i++) { g.strokeStyle = r() < 0.55 ? c3(16, 13, 9, 0.5) : c3(150, 138, 110, 0.22); g.lineWidth = 1; const yy = y + 3 + r() * (h / rows - 6); g.beginPath(); g.moveTo(0, yy); g.lineTo(w, yy + (r() - 0.5) * 5); g.stroke(); }
    for (let i = 0; i < 3; i++) { g.fillStyle = c3(8, 6, 4, 0.9); g.fillRect(r() * w, y, 3, h / rows); }
    for (let i = 0; i < 8; i++) { g.fillStyle = c3(60, 34, 18, 0.7); g.beginPath(); g.arc(r() * w, y + h / rows / 2 + (r() - 0.5) * 8, 2.5, 0, 7); g.fill(); }
  }
  deniz(g, w, h, r, yosun);
};
const M = K.materials('batik', {
  kaplama_tahtasi: [tahta([52, 46, 36], 8, 1.5), 1024, 1024], guverte_tahtasi: [tahta([60, 54, 42], 10, 1.1), 1024, 1024], kaburga: [tahta([36, 31, 25], 3, 1.2), 512, 512], direk: [tahta([46, 42, 34], 2, 1.6), 512, 512],
  kic_penceresi: [(g, w, h, r) => { g.fillStyle = '#3a3024'; g.fillRect(0, 0, w, h); g.fillStyle = '#0c0f10'; g.fillRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8); g.strokeStyle = '#4a3c2c'; g.lineWidth = 6; for (let k = -6; k < 12; k++) { g.beginPath(); g.moveTo(k * 40, h * 0.1); g.lineTo(k * 40 + h * 0.8, h * 0.9); g.stroke(); g.beginPath(); g.moveTo(k * 40, h * 0.1); g.lineTo(k * 40 - h * 0.8, h * 0.9); g.stroke(); } g.lineWidth = 22; g.strokeRect(0, 0, w, h); deniz(g, w, h, r, 0.6); }, 256, 256],
  pasli_demir: [(g, w, h, r) => { g.fillStyle = '#4a2e1c'; g.fillRect(0, 0, w, h); for (let k = 0; k < 500; k++) { g.fillStyle = r() < 0.5 ? c3(110 + r() * 50, 56 + r() * 24, 24, 0.3) : c3(20, 14, 10, 0.3); g.beginPath(); g.ellipse(r() * w, r() * h, 2 + r() * 14, 2 + r() * 10, 0, 0, 7); g.fill(); } deniz(g, w, h, r, 0.7); }, 256, 256],
});
for (const m of Object.values(M)) { // kabartma haritası: renk dokusunun aydınlığından
  m.side = THREE.DoubleSide; m.roughness = 0.95;
  const c = m.map.image, w = c.width, h = c.height, src = c.getContext('2d').getImageData(0, 0, w, h).data, o = document.createElement('canvas'); o.width = w; o.height = h;
  const g = o.getContext('2d'), out = g.createImageData(w, h), Lm = (x, y) => { const i = (((y + h) % h) * w + ((x + w) % w)) * 4; return (src[i] + src[i + 1] * 2 + src[i + 2]) / 1020; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = (Lm(x + 1, y) - Lm(x - 1, y)) * 3, dy = (Lm(x, y + 1) - Lm(x, y - 1)) * 3, l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4; out.data[i] = (-dx / l * 0.5 + 0.5) * 255; out.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; out.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; out.data[i + 3] = 255; }
  g.putImageData(out, 0, 0);
  m.normalMap = new THREE.CanvasTexture(o); m.normalMap.name = m.name + '_kabartma'; m.normalMap.wrapS = m.normalMap.wrapT = THREE.RepeatWrapping; m.normalMap.colorSpace = THREE.NoColorSpace;
}
const kutu = (p, mat, x0, x1, y0, y1, z0, z1) => K.box(p, mat, x0, x1, y0, y1, z0, z1, K.ALL, 2);

function govde(p, T, r) {
  const { L, B, H, HB } = T, NX = Math.round(L / 0.7), NS = Math.round((HB * 1.35 + H - HB + T.kic) / 0.33), sd = T.seed, kw = 0.11 + L / 420;
  const S = (x) => x / (L / 2), X = (i) => -L / 2 + (i * L) / NX;
  const bf = (s) => Math.max(0.03, s > 0 ? (1 - s ** 2.4) ** 0.6 : 0.6 + 0.4 * (1 - (-s) ** 2.5));
  const yk = (s) => 0.26 * H * (Math.max(0, s - 0.6) / 0.4) ** 2 + 0.14 * H * (Math.max(0, -s - 0.7) / 0.3) ** 2;
  const kasara = (s) => (s < -0.74 && T.pupa ? T.kic + T.pupa : s < -0.42 ? T.kic : s > 0.72 ? T.bas : 0);
  const sheer = (s) => H + 0.14 * H * s * s;
  const sec = (x, t, side, inset = 0) => {
    const s = S(x), b = Math.max(0.02, B * bf(s) - inset), k = yk(s), top = sheer(s) + kasara(s);
    if (t <= 0.5) { const f = (t / 0.5) * Math.PI / 2; return V(x, k + inset * 0.8 + HB * (1 - Math.cos(f)), side * b * Math.sin(f) ** 0.75); }
    const u = (t - 0.5) / 0.5;
    return V(x, k + HB + u * (top - k - HB), side * b * (1 - 0.1 * u));
  };
  const yarim = (x, y, inset = 0.15) => { const s = S(x), b = Math.max(0.02, B * bf(s) - inset), k = yk(s), top = sheer(s) + kasara(s); if (y < k + HB) return b * Math.sin(Math.acos(Math.max(-1, Math.min(1, 1 - (y - k) / HB)))) ** 0.75; return b * (1 - 0.1 * Math.min(1, (y - k - HB) / (top - k - HB))); };
  const orta = (s) => Math.abs(s + 0.02) < 0.2;
  const deckY = (d, s) => yk(s) + d + (sheer(s) - H) * 0.6;
  // Top lombarları: üst güvertelerin hizasında, düzenli aralıkla
  const lombar = (i, j, x) => { if (!T.ports) return false; const s = S(x); if (Math.abs(s) > 0.72 || i % 5 !== 2) return false; const y = sec(x, (j + 0.5) / NS, 1).y; return T.decks.slice(-T.ports).some((d) => y > deckY(d, s) + 0.55 && y < deckY(d, s) + 1.25); };
  const yok = (i, j, side) => { // düzensiz çürük delikleri: üstte kalan sancak yanı ve orta bölüm daha çok dağılmış
    if (i < 0 || i >= NX) return true;
    const x = X(i + 0.5), s = S(x), t = j / NS;
    if (lombar(i, j, x)) return true;
    let pr = side > 0 ? 0.24 : 0.06;
    if (orta(s)) pr = side > 0 ? (t > 0.2 ? 0.94 : 0.55) : t > 0.45 ? 0.8 : 0.12;
    else if (Math.abs(s + 0.02) < 0.34) pr += t > 0.3 ? 0.34 : 0.06;
    if (s < -0.42) pr *= 0.3;
    if (s > 0.7) pr = Math.max(pr, 0.34);
    const n = 0.62 * vn(i / 6, j / 4.5, sd + side) + 0.38 * vn(i / 1.9, j / 1.6, sd + 5 + side);
    return Math.min(1, Math.max(0, (n - 0.24) / 0.52)) < pr;
  };
  // Kaplama tahtaları: delik kenarlarında tahta uçları eğri ve kısa kırılmış
  for (let i = 0; i < NX; i++) for (let j = 0; j < NS; j++) for (const side of [-1, 1]) {
    if (yok(i, j, side)) continue;
    const dx = L / NX, t0 = j / NS, t1 = (j + 1) / NS, kusak = j % 6 === 3 && t0 > 0.42, ins = kusak ? -0.07 : 0, v = (j % 8) / 8;
    let xa0 = X(i), xa1 = xa0, xb0 = X(i + 1), xb1 = xb0;
    if (yok(i - 1, j, side)) { xa0 += dx * 0.75 * hsh(i, j, sd + 1); xa1 += dx * 0.75 * hsh(i, j, sd + 2); }
    if (yok(i + 1, j, side)) { xb0 -= dx * 0.75 * hsh(i, j, sd + 3); xb1 -= dx * 0.75 * hsh(i, j, sd + 4); }
    if (xb0 - xa0 < 0.05 && xb1 - xa1 < 0.05) continue;
    p.quad(kusak ? 'kaburga' : 'kaplama_tahtasi', [sec(xa0, t0, side, ins), sec(xb0, t0, side, ins), sec(xb1, t1, side, ins), sec(xa1, t1, side, ins)], [[xa0 / 4 + j * 0.31, v], [xb0 / 4 + j * 0.31, v], [xb1 / 4 + j * 0.31, v + 0.125], [xa1 / 4 + j * 0.31, v + 0.125]], V(0, t0 < 0.3 ? -1 : 0, side));
  }
  // Lombarlardan sarkan toplar
  if (T.ports) for (let i = 2; i < NX; i += 5) for (const side of [-1, 1]) for (const d of T.decks.slice(-T.ports)) { const x = X(i + 0.5), s = S(x); if (Math.abs(s) > 0.72 || hsh(i, d * 10 | 0, sd + side) > 0.45) continue; const y = deckY(d, s) + 0.75, w = yarim(x, y, 0); K.cyl(p, 'pasli_demir', V(x, y, side * (w - 1.6)), V(x, y - 0.15, side * (w + 0.5)), 0.13 + L / 900, 8); }
  // Kaburgalar
  for (let i = 1; i < NX; i++) for (const side of [-1, 1]) {
    const x = X(i), s = S(x), q = hsh(i, 5, sd + side), tEnd = orta(s) ? (side > 0 ? 0.2 + 0.45 * q : 0.45 + 0.5 * q) : q < 0.14 ? 0.5 + 0.4 * q : 1, n = 7;
    for (let k = 0; k < n; k++) K.beam(p, 'kaburga', sec(x, (k / n) * tEnd, side, 0.1), sec(x, ((k + 1) / n) * tEnd, side, 0.1), kw * 1.25, kw, k === n - 1);
  }
  // Omurga, baş bodoslama, dümen
  for (let i = 0; i < NX; i++) K.beam(p, 'kaburga', V(X(i), yk(S(X(i))) - 0.2, 0), V(X(i + 1), yk(S(X(i + 1))) - 0.2, 0), kw * 3.4, kw * 2.4, i === 0 || i === NX - 1);
  const stem = [V(L / 2 - 0.05, yk(1) - 0.1, 0), V(L / 2 + L * 0.02, H * 0.6, 0), V(L / 2 + L * 0.03, H, 0), V(L / 2 + L * 0.05, H * 1.38, 0)];
  for (let k = 0; k < 3; k++) K.beam(p, 'kaburga', stem[k], stem[k + 1], kw * 3, kw * 2.2);
  kutu(p, 'kaplama_tahtasi', -L / 2 - L * 0.045, -L / 2 - 0.05, yk(-1) + 0.2, H * 0.92, -kw * 0.6, kw * 0.6);
  // Güverteler: kirişler ve tahtalar
  const guverte = (yOf, s0, s1, pYok, seed) => {
    const NQ = Math.max(6, Math.round(B * 1.6));
    for (let i = 0; i < NX; i++) {
      const x0 = X(i), x1 = X(i + 1), sm = S((x0 + x1) / 2);
      if (sm < s0 || sm > s1) continue;
      const y0 = yOf(S(x0)), y1 = yOf(S(x1)), w0 = yarim(x0, y0), w1 = yarim(x1, y1), kirik = hsh(i, seed, 2) < pYok(sm) * 0.7;
      if (i % 2 === 0) K.beam(p, 'kaburga', V(x0, y0 - kw, -w0), V(x0, y0 - kw, kirik ? w0 * (hsh(i, seed, 9) - 0.5) : w0), kw * 1.5, kw * 1.2);
      for (let q = 0; q < NQ; q++) {
        if (Math.min(1, Math.max(0, (0.6 * vn(i / 4, q / 2.5, seed) + 0.4 * vn(i / 1.5, q / 1.2, seed + 1) - 0.24) / 0.52)) < pYok(sm)) continue;
        const a = -1 + (2 * q) / NQ, b = -1 + (2 * (q + 1)) / NQ;
        p.quad('guverte_tahtasi', [V(x0, y0, a * w0), V(x1, y1, a * w1), V(x1, y1, b * w1), V(x0, y0, b * w0)], [[x0 / 3, q / 10], [x1 / 3, q / 10], [x1 / 3, (q + 1) / 10], [x0 / 3, (q + 1) / 10]], V(0, 1, 0));
      }
    }
  };
  T.decks.forEach((d, k) => guverte((s) => deckY(d, s), -0.92, 0.82, (s) => (orta(s) ? 0.5 + 0.12 * k : 0.1 + 0.05 * k), 21 + k * 7));
  guverte((s) => sheer(s), -0.95, 0.9, (s) => (orta(s) ? 0.93 : s < -0.42 ? 0.06 : Math.abs(s + 0.02) < 0.34 ? 0.6 : 0.28), 63);
  guverte((s) => sheer(s) + T.kic, -0.98, T.pupa ? -0.74 : -0.43, () => 0.03, 75);
  if (T.pupa) { guverte((s) => sheer(s) + T.kic, -0.74, -0.43, () => 0.05, 81); guverte((s) => sheer(s) + T.kic + T.pupa, -0.98, -0.75, () => 0.03, 87); }
  guverte((s) => sheer(s) + T.bas, 0.73, 0.94, () => 0.22, 93);
  // Kasara perdeleri (kapı boşluklu)
  const perde = (s, y, h, yon) => { const x = s * L / 2, w = yarim(x, y + 0.4), dw = Math.min(0.6, w * 0.3); for (const [a, b] of [[-w, -dw], [dw, w]]) p.quad('kaplama_tahtasi', [V(x, y, a), V(x, y, b), V(x, y + h, b), V(x, y + h, a)], [[a / 4, 0], [b / 4, 0], [b / 4, h / 8], [a / 4, h / 8]], V(yon, 0, 0)); if (h > 2) p.quad('kaplama_tahtasi', [V(x, y + 1.9, -dw), V(x, y + 1.9, dw), V(x, y + h, dw), V(x, y + h, -dw)], K.FLAT, V(yon, 0, 0)); };
  perde(-0.42, sheer(-0.42), T.kic, 1); perde(0.72, sheer(0.72), T.bas, -1); if (T.pupa) perde(-0.74, sheer(-0.74) + T.kic, T.pupa, 1);
  // Kıç aynası: kafesli pencere sıraları, silmeler, fener
  const xs = -L / 2, m = 12;
  for (let j = 0; j < m; j++) { const a = sec(xs, j / m, -1), b = sec(xs, j / m, 1), c = sec(xs, (j + 1) / m, 1), d = sec(xs, (j + 1) / m, -1); p.quad('kaplama_tahtasi', [a, b, c, d], [[a.z / 4, a.y / 8], [b.z / 4, b.y / 8], [c.z / 4, c.y / 8], [d.z / 4, d.y / 8]], V(-1, 0, 0)); }
  const top = sheer(-1) + kasara(-1), sira = Math.max(1, Math.round((kasara(-1)) / 2.2));
  for (let k = 0; k < sira; k++) { const yw = sheer(-1) + 0.5 + k * 2.3, w = yarim(xs + 0.3, yw + 0.5) * 0.8, n = Math.max(2, Math.round(w / 0.55)); if (yw + 1.2 > top) break; for (let q = 0; q < n; q++) { const z = -w + ((q + 0.5) * 2 * w) / n, hw = (w / n) * 0.8; p.quad('kic_penceresi', [V(xs - 0.03, yw, z - hw), V(xs - 0.03, yw, z + hw), V(xs - 0.03, yw + 1.1, z + hw), V(xs - 0.03, yw + 1.1, z - hw)], K.FLAT, V(-1, 0, 0)); } for (const y of [yw - 0.2, yw + 1.25]) kutu(p, 'kaburga', xs - 0.14, xs, y, y + 0.14, -w * 1.15, w * 1.15); }
  K.cyl(p, 'pasli_demir', V(xs - 0.1, top, 0), V(xs - 0.5, top + 1.3, 0), 0.04, 6); K.lathe(p, 'pasli_demir', xs - 0.5, 0, [[0, top + 1.3], [0.2, top + 1.4], [0.24, top + 1.9], [0.1, top + 2.2], [0, top + 2.45]], 6, 1);
  // Küpeşte korkuluğu: üst sıra tahtası duran yerlerde
  for (const side of [-1, 1]) for (let i = 0; i < NX; i++) { if (yok(i, NS - 1, side) || hsh(i, 77, sd + side) < (side > 0 ? 0.3 : 0.1)) continue; const a = sec(X(i), 1, side), b = sec(X(i + 1), 1, side); K.beam(p, 'kaburga', a.clone().setY(a.y + 0.8), b.clone().setY(b.y + 0.8), kw * 0.7, kw * 0.9); K.beam(p, 'kaburga', a, a.clone().setY(a.y + 0.8), kw * 0.6, kw * 0.6, false); }
  // Güverte donanımı: ambar ağzı çerçeveleri, ırgat
  if (L > 22) { for (const s of [0.34, -0.3]) { const x = s * L / 2, y = sheer(s), a = Math.min(1.4, B * 0.25); for (const [x0, x1, z0, z1] of [[x - a, x + a, -a, -a + 0.14], [x - a, x + a, a - 0.14, a], [x - a, x - a + 0.14, -a, a], [x + a - 0.14, x + a, -a, a]]) kutu(p, 'kaburga', x0, x1, y, y + 0.3, z0, z1); } const cx = 0.52 * L / 2, cy = sheer(0.52); K.lathe(p, 'direk', cx, 0, [[0.5, cy], [0.5, cy + 0.12], [0.26, cy + 0.2], [0.22, cy + 0.9], [0.42, cy + 1.0], [0.42, cy + 1.2], [0, cy + 1.25]], 10, 1); }
  // Direkler: kırık uçlu; yüksekliği 0 olan dipten kırılmış ve güverteye devrilmiş
  const kirik = (a, n = 6, sc = 1) => { for (let k = 0; k < n; k++) K.beam(p, 'direk', a.clone().add(V((r() - 0.5) * 0.3 * sc, 0, (r() - 0.5) * 0.3 * sc)), a.clone().add(V((r() - 0.5) * 0.5 * sc, (0.4 + r() * 0.9) * sc, (r() - 0.5) * 0.5 * sc)), 0.07 * sc, 0.06 * sc); };
  for (const [s, h] of T.masts) {
    const x = s * L / 2, rad = L / 85 + 0.08, y0 = yk(s) + 0.3, yd = sheer(s);
    if (!h) { K.cyl(p, 'direk', V(x, y0, 0), V(x, yd + 1.4, 0.1), rad, 12); kirik(V(x, yd + 1.4, 0.1), 9, rad * 3); K.cyl(p, 'direk', V(x - 1, yd + 0.5, B * 0.45), V(x + L * 0.1, yd + 1.0, -B * 1.25), rad * 0.9, 12); K.cyl(p, 'direk', V(x + L * 0.02, yd + 0.6, -B * 0.2), V(x + L * 0.16, yd + 0.5, B * 0.5), rad * 0.4, 8); continue; }
    const lean = V((r() - 0.5) * 0.12, 1, (r() - 0.5) * 0.08).normalize(), a = V(x, y0, 0), mid = a.clone().addScaledVector(lean, (yd - y0) + h * 0.55), tip = a.clone().addScaledVector(lean, (yd - y0) + h);
    K.cyl(p, 'direk', a, mid, rad, 12); K.cyl(p, 'direk', mid, tip, rad * 0.7, 10); kirik(tip, 6, rad * 2.5);
    if (h > 10) { kutu(p, 'guverte_tahtasi', mid.x - rad * 3.2, mid.x + rad * 3.2, mid.y - 0.06, mid.y + 0.06, mid.z - rad * 3.2, mid.z + rad * 3.2); K.cyl(p, 'direk', mid.clone().add(V(0.3, -h * 0.12, -B * 0.85)), mid.clone().add(V(0.5, h * 0.08, B * 0.6)), rad * 0.36, 8); }
    K.cyl(p, 'direk', a.clone().addScaledVector(lean, (yd - y0) + h * 0.3).add(V(0.3, 0, -B * 0.7)), a.clone().addScaledVector(lean, (yd - y0) + h * 0.22).add(V(0.2, 0, B * 0.75)), rad * 0.4, 8);
  }
  const bs = V(L / 2 - L * 0.06, sheer(0.88) + T.bas + 0.3, 0), be = V(L / 2 + L * 0.11, sheer(1) + T.bas + L * 0.06, 0.2);
  K.cyl(p, 'direk', bs, be, L / 120 + 0.06, 10); kirik(be, 4, 1 + L / 60);
  // Güvertelerde kalanlar: toplar ve sandıklar
  T.decks.forEach((d, k) => { for (const s of [-0.3, 0.3]) { const x = s * L / 2 + k, y = deckY(d, s) + 0.28, z = -yarim(x, y) * 0.45; K.cyl(p, 'pasli_demir', V(x, y, z + 0.3), V(x + 0.1, y + 0.1, z - 1.9), 0.2, 10); kutu(p, 'kaburga', x - 0.4, x + 0.5, y - 0.26, y - 0.1, z - 1.2, z + 0.2); } kutu(p, 'guverte_tahtasi', -L * 0.34, -L * 0.34 + 1, deckY(d, -0.68), deckY(d, -0.68) + 0.6, -1.4, -0.7); });
}
export function createBatikGemi(n = 3) {
  const T = BATIK_GEMILER[Math.min(4, Math.max(0, n - 1))], g = new Part(T.ad);
  govde(g, T, K.rng(T.seed));
  const m = g.mesh(M);
  m.name = T.ad;
  m.geometry.rotateX(-T.heel); m.geometry.computeBoundingBox();
  const b = m.geometry.boundingBox;
  m.geometry.translate(0, -b.min.y, -(b.min.z + b.max.z) / 2); m.geometry.computeVertexNormals();
  m.castShadow = m.receiveShadow = true;
  return m;
}
