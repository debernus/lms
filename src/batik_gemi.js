import * as THREE from 'three';
import * as K from './kit_ortak.js';
const { V, TAU, Part } = K;

// Deniz dibinde batık Osmanlı ahşap gemisi (kalyon). Gemi iskele (sol) yanına yatmıştır; kıç kasara sağlam, orta bölüm
// çürüyüp açılmış, kaburgalar ortada; alt güverte içeriden görülür ve gezilebilir. Çevrede dağılmış enkaz.
// Metre, Y yukarı; deniz dibi y = 0; pruva +X. Düğümler: gemi, enkaz, deniz_dibi.
const L = 30, B = 4.1, H = 6.2, HB = 2.6, NX = 40, NS = 20, HEEL = 0.5;
const S = (x) => x / (L / 2);
const bf = (s) => Math.max(0.03, s > 0 ? (1 - s ** 2.4) ** 0.6 : 0.6 + 0.4 * (1 - (-s) ** 2.5));
const yk = (s) => 1.6 * (Math.max(0, s - 0.6) / 0.4) ** 2 + 0.9 * (Math.max(0, -s - 0.7) / 0.3) ** 2;
const kasara = (s) => (s < -0.42 ? 2.3 : s > 0.72 ? 1.1 : 0);
const sheer = (s) => H + 0.9 * s * s;
function sec(x, t, side, inset = 0) { // gövde kesiti: t 0 (omurga) … 1 (küpeşte)
  const s = S(x), b = Math.max(0.02, B * bf(s) - inset), k = yk(s), top = sheer(s) + kasara(s);
  if (t <= 0.5) { const f = (t / 0.5) * Math.PI / 2; return V(x, k + inset * 0.8 + HB * (1 - Math.cos(f)), side * b * Math.sin(f) ** 0.75); }
  const u = (t - 0.5) / 0.5;
  return V(x, k + HB + u * (top - k - HB), side * b * (1 - 0.1 * u));
}
function yarim(x, y, inset = 0.15) { // y yüksekliğinde iç yarı genişlik
  const s = S(x), b = Math.max(0.02, B * bf(s) - inset), k = yk(s), top = sheer(s) + kasara(s);
  if (y < k + HB) return b * Math.sin(Math.acos(Math.max(-1, Math.min(1, 1 - (y - k) / HB)))) ** 0.75;
  return b * (1 - 0.1 * Math.min(1, (y - k - HB) / (top - k - HB)));
}
const hsh = (a, b, c) => { let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(c, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const orta = (s) => Math.abs(s + 0.02) < 0.2;
function yok(i, j, side) { // kaplama tahtası eksik mi? Üstte kalan sancak yanı ve orta bölüm daha çok çürümüş
  const s = S(-L / 2 + ((i + 0.5) * L) / NX), t = j / NS;
  let p = side > 0 ? 0.22 : 0.05;
  if (orta(s)) p = side > 0 ? (t > 0.2 ? 0.93 : 0.55) : t > 0.45 ? 0.78 : 0.1;
  else if (Math.abs(s + 0.02) < 0.32) p += t > 0.3 ? 0.32 : 0.05;
  if (s < -0.42) p *= 0.3;
  if (s > 0.7) p = Math.max(p, 0.3);
  return 0.6 * hsh(i >> 1, j >> 1, side + 7) + 0.4 * hsh(i, j, side + 3) < p;
}

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
  kaplama_tahtasi: [tahta([78, 66, 48], 8, 1), 1024, 1024], guverte_tahtasi: [tahta([92, 80, 60], 10, 0.6), 1024, 1024], kaburga: [tahta([56, 46, 34], 3, 0.8), 512, 512], direk: [tahta([70, 60, 46], 2, 1.2), 512, 512],
  kic_penceresi: [(g, w, h, r) => { g.fillStyle = '#3a3024'; g.fillRect(0, 0, w, h); g.fillStyle = '#0c0f10'; g.fillRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8); g.strokeStyle = '#4a3c2c'; g.lineWidth = 6; for (let k = -6; k < 12; k++) { g.beginPath(); g.moveTo(k * 40, h * 0.1); g.lineTo(k * 40 + h * 0.8, h * 0.9); g.stroke(); g.beginPath(); g.moveTo(k * 40, h * 0.1); g.lineTo(k * 40 - h * 0.8, h * 0.9); g.stroke(); } g.lineWidth = 22; g.strokeRect(0, 0, w, h); deniz(g, w, h, r, 0.6); }, 256, 256],
  pasli_demir: [(g, w, h, r) => { g.fillStyle = '#4a2e1c'; g.fillRect(0, 0, w, h); for (let k = 0; k < 500; k++) { g.fillStyle = r() < 0.5 ? c3(110 + r() * 50, 56 + r() * 24, 24, 0.3) : c3(20, 14, 10, 0.3); g.beginPath(); g.ellipse(r() * w, r() * h, 2 + r() * 14, 2 + r() * 10, 0, 0, 7); g.fill(); } deniz(g, w, h, r, 0.7); }, 256, 256],
  kum: [(g, w, h, r) => { g.fillStyle = '#7c7660'; g.fillRect(0, 0, w, h); for (let k = 0; k < 40; k++) { const y = (k / 40) * h; g.strokeStyle = k % 2 ? c3(60, 58, 46, 0.25) : c3(170, 164, 136, 0.22); g.lineWidth = 6; g.beginPath(); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin((x / w) * TAU * 3 + k) * 6); g.stroke(); } for (let k = 0; k < 5000; k++) { g.fillStyle = r() < 0.5 ? c3(40, 38, 30, r() * 0.3) : c3(200, 196, 170, r() * 0.25); g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } for (let k = 0; k < 60; k++) { g.fillStyle = c3(52, 76, 50, r() * 0.2); g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 40, 6 + r() * 20, 0, 0, 7); g.fill(); } }, 512, 512],
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

function govde(p, r) {
  const X = (i) => -L / 2 + (i * L) / NX;
  // Kaplama tahtaları
  for (let i = 0; i < NX; i++) for (let j = 0; j < NS; j++) for (const side of [-1, 1]) {
    if (yok(i, j, side)) continue;
    const x0 = X(i), x1 = X(i + 1), t0 = j / NS, t1 = (j + 1) / NS, v = (j % 8) / 8;
    p.quad('kaplama_tahtasi', [sec(x0, t0, side), sec(x1, t0, side), sec(x1, t1, side), sec(x0, t1, side)], [[x0 / 4 + j * 0.31, v], [x1 / 4 + j * 0.31, v], [x1 / 4 + j * 0.31, v + 0.125], [x0 / 4 + j * 0.31, v + 0.125]], V(0, t0 < 0.3 ? -1 : 0, side));
  }
  // Kaburgalar: ortada çoğu kırık, uçları kalmış
  for (let i = 1; i < NX; i++) for (const side of [-1, 1]) {
    const x = X(i), s = S(x), q = hsh(i, 5, side + 11), tMax = (HB + (sheer(s) - yk(s) - HB) * 1.0) ? 1 : 1;
    const tEnd = orta(s) ? (side > 0 ? 0.2 + 0.45 * q : 0.45 + 0.5 * q) : q < 0.14 ? 0.5 + 0.4 * q : tMax, n = 8;
    for (let k = 0; k < n; k++) K.beam(p, 'kaburga', sec(x, (k / n) * tEnd, side, 0.1), sec(x, ((k + 1) / n) * tEnd, side, 0.1), 0.17, 0.14, k === n - 1);
  }
  // Omurga, baş bodoslama, dümen
  for (let i = 0; i < NX; i++) K.beam(p, 'kaburga', V(X(i), yk(S(X(i))) - 0.2, 0), V(X(i + 1), yk(S(X(i + 1))) - 0.2, 0), 0.5, 0.36, i === 0 || i === NX - 1);
  const stem = [V(L / 2 - 0.05, 1.4, 0), V(L / 2 + 0.5, 3.6, 0), V(L / 2 + 0.8, 6, 0), V(L / 2 + 1.3, 8.6, 0)];
  for (let k = 0; k < 3; k++) K.beam(p, 'kaburga', stem[k], stem[k + 1], 0.4, 0.32);
  kutu(p, 'kaplama_tahtasi', -L / 2 - 1.3, -L / 2 - 0.05, 1.3, 5.6, -0.09, 0.09);
  // Güverteler: kirişler ve tahtalar
  const guverte = (yOf, s0, s1, pYok, seed) => {
    for (let i = 0; i < NX; i++) {
      const x0 = X(i), x1 = X(i + 1), sm = S((x0 + x1) / 2);
      if (sm < s0 || sm > s1) continue;
      const y0 = yOf(S(x0)), y1 = yOf(S(x1)), w0 = yarim(x0, y0), w1 = yarim(x1, y1), kirik = hsh(i, seed, 2) < pYok(sm) * 0.7;
      if (i % 2 === 0) K.beam(p, 'kaburga', V(x0, y0 - 0.13, -w0), V(x0, y0 - 0.13, kirik ? w0 * (hsh(i, seed, 9) - 0.5) : w0), 0.22, 0.17);
      for (let q = 0; q < 6; q++) {
        if (0.55 * hsh(i >> 1, q >> 1, seed) + 0.45 * hsh(i, q, seed + 1) < pYok(sm)) continue;
        const a = -1 + q / 3, b = -1 + (q + 1) / 3;
        p.quad('guverte_tahtasi', [V(x0, y0, a * w0), V(x1, y1, a * w1), V(x1, y1, b * w1), V(x0, y0, b * w0)], [[x0 / 3, q / 10], [x1 / 3, q / 10], [x1 / 3, (q + 1) / 10], [x0 / 3, (q + 1) / 10]], V(0, 1, 0));
      }
    }
  };
  guverte((s) => yk(s) + 2.9, -0.92, 0.8, (s) => (orta(s) ? 0.55 : 0.1), 21); // alt güverte: gezilebilir
  guverte((s) => sheer(s), -0.95, 0.9, (s) => (orta(s) ? 0.92 : s < -0.42 ? 0.06 : Math.abs(s + 0.02) < 0.32 ? 0.6 : 0.28), 33); // ana güverte
  guverte((s) => sheer(s) + 2.3, -0.98, -0.43, () => 0.03, 45); // kıç kasara güvertesi: sağlam
  guverte((s) => sheer(s) + 1.1, 0.73, 0.94, () => 0.22, 57); // baş kasara
  // Kasara perdeleri (kapı boşluklu)
  for (const [s, h] of [[-0.42, 2.3], [0.72, 1.1]]) { const x = s * L / 2, y = sheer(s), w = yarim(x, y + 0.5); for (const [a, b] of [[-w, -0.6], [0.6, w]]) p.quad('kaplama_tahtasi', [V(x, y, a), V(x, y, b), V(x, y + h, b), V(x, y + h, a)], [[a / 4, 0], [b / 4, 0], [b / 4, h / 8], [a / 4, h / 8]], V(-s, 0, 0)); if (h > 2) p.quad('kaplama_tahtasi', [V(x, y + 1.9, -0.6), V(x, y + 1.9, 0.6), V(x, y + h, 0.6), V(x, y + h, -0.6)], K.FLAT, V(-s, 0, 0)); }
  // Kıç aynası: oymalı kafesli pencereler, küpeşte, fener
  const xs = -L / 2, m = 10;
  for (let j = 0; j < m; j++) { const a = sec(xs, j / m, -1), b = sec(xs, j / m, 1), c = sec(xs, (j + 1) / m, 1), d = sec(xs, (j + 1) / m, -1); p.quad('kaplama_tahtasi', [a, b, c, d], [[a.z / 4, a.y / 8], [b.z / 4, b.y / 8], [c.z / 4, c.y / 8], [d.z / 4, d.y / 8]], V(-1, 0, 0)); }
  const yw = sheer(-1) + 0.55;
  for (const z of [-1.5, -0.5, 0.5, 1.5]) p.quad('kic_penceresi', [V(xs - 0.03, yw, z - 0.4), V(xs - 0.03, yw, z + 0.4), V(xs - 0.03, yw + 1.1, z + 0.4), V(xs - 0.03, yw + 1.1, z - 0.4)], K.FLAT, V(-1, 0, 0));
  for (const y of [yw - 0.2, yw + 1.25]) kutu(p, 'kaburga', xs - 0.14, xs, y, y + 0.14, -2.2, 2.2);
  // Küpeşte korkuluğu (kasaralarda)
  for (const side of [-1, 1]) for (let i = 0; i < NX; i++) { const x0 = X(i), x1 = X(i + 1), s = S((x0 + x1) / 2); if (!(s < -0.44 || s > 0.74) || hsh(i, 77, side) < (side > 0 ? 0.25 : 0.08)) continue; const a = sec(x0, 1, side), b = sec(x1, 1, side); K.beam(p, 'kaburga', a.clone().setY(a.y + 0.85), b.clone().setY(b.y + 0.85), 0.1, 0.12); K.beam(p, 'kaburga', a, a.clone().setY(a.y + 0.85), 0.09, 0.09, false); }
  K.cyl(p, 'pasli_demir', V(xs - 0.1, sheer(-1) + 2.3, 0), V(xs - 0.5, sheer(-1) + 3.6, 0), 0.04, 6); K.lathe(p, 'pasli_demir', xs - 0.5, 0, [[0, sheer(-1) + 3.6], [0.2, sheer(-1) + 3.7], [0.24, sheer(-1) + 4.2], [0.1, sheer(-1) + 4.5], [0, sheer(-1) + 4.75]], 6, 1);
  // Direkler: mizana eğik ve kırık, grandi dipten kırık, pruva direği ayakta; cıvadra kırık
  const kirik = (a, n = 5) => { for (let k = 0; k < n; k++) K.beam(p, 'direk', a.clone().add(V((r() - 0.5) * 0.3, 0, (r() - 0.5) * 0.3)), a.clone().add(V((r() - 0.5) * 0.5, 0.4 + r() * 0.9, (r() - 0.5) * 0.5)), 0.07, 0.06); };
  K.cyl(p, 'direk', V(-8.5, 3, 0), V(-7.9, 14.5, 0.4), 0.22, 10); kirik(V(-7.9, 14.5, 0.4)); K.cyl(p, 'direk', V(-8.1, 12.2, -3.2), V(-8.3, 13.4, 2.4), 0.1, 8);
  K.cyl(p, 'direk', V(-0.8, 0.4, 0), V(-0.8, 4.4, 0.1), 0.38, 12); kirik(V(-0.8, 4.4, 0.1), 8);
  K.cyl(p, 'direk', V(7.5, 3.2, 0), V(8.3, 15, 0), 0.3, 10); kirik(V(8.3, 15, 0)); kutu(p, 'guverte_tahtasi', 7.3, 8.9, 11.2, 11.32, -0.8, 0.8); K.cyl(p, 'direk', V(8.0, 9.6, -3.6), V(8.2, 7.4, 2.6), 0.11, 8);
  K.cyl(p, 'direk', V(L / 2 - 1.8, sheer(0.88) + 1.4, 0), V(L / 2 + 3.2, sheer(1) + 3.0, 0.2), 0.2, 10); kirik(V(L / 2 + 3.2, sheer(1) + 3.0, 0.2), 4);
  // Alt güvertede kalanlar: iki top ve sandık
  for (const [x, z] of [[-5, -1.6], [4.5, -1.2]]) { const y = yk(S(x)) + 3.15; K.cyl(p, 'pasli_demir', V(x, y, z + 0.2), V(x + 0.1, y + 0.1, z - 2.0), 0.2, 10); kutu(p, 'kaburga', x - 0.4, x + 0.5, y - 0.25, y - 0.1, z - 1.2, z + 0.1); }
  kutu(p, 'guverte_tahtasi', -10.5, -9.5, yk(S(-10)) + 2.9, yk(S(-10)) + 3.5, -1.9, -1.2);
}
function enkaz(p, r) { // deniz dibine dağılmış parçalar (dünya koordinatında)
  K.cyl(p, 'direk', V(-1.5, 1.6, -4.5), V(5.5, 0.3, -17), 0.36, 12); K.cyl(p, 'direk', V(1.0, 0.25, -12.5), V(7.5, 0.2, -9.5), 0.12, 8);
  for (let k = 0; k < 46; k++) { const x = (r() - 0.5) * 20, z = k < 36 ? -5 - r() * 11 : 4 + r() * 6, a = r() * TAU, len = 0.8 + r() * 3, y = 0.04 + r() * 0.25, d = V(Math.cos(a) * len / 2, (r() - 0.5) * 0.3, Math.sin(a) * len / 2); K.beam(p, r() < 0.7 ? 'kaplama_tahtasi' : 'guverte_tahtasi', V(x, y, z).sub(d), V(x, y, z).add(d), 0.045, 0.22 + r() * 0.14); }
  for (let k = 0; k < 9; k++) { const x = (r() - 0.5) * 14, z = -5 - r() * 9, a = r() * TAU, c = V(Math.cos(a), 0, Math.sin(a)), o = V(x, 0.1, z); K.beam(p, 'kaburga', o.clone().addScaledVector(c, -1.2), o.clone().setY(0.35 + r() * 0.3), 0.17, 0.14); K.beam(p, 'kaburga', o.clone().setY(0.35 + r() * 0.3), o.clone().addScaledVector(c, 1.1).setY(0.9 + r() * 0.6), 0.17, 0.14); }
  for (const [x, z] of [[3, -8], [3.8, -8.6], [-6, -11], [9, -6.5]]) K.lathe(p, 'kaplama_tahtasi', x, z, [[0, -0.1], [0.3, -0.1], [0.38, 0.25], [0.3, 0.6], [0, 0.6]], 10, 1);
  for (const [a, b] of [[V(-4, 0.22, -7.5), V(-2.2, 0.3, -8.6)], [V(6.5, 0.2, -11), V(8.4, 0.24, -11.6)]]) K.cyl(p, 'pasli_demir', a, b, 0.21, 10);
  // Çapa: pruvanın önünde
  K.cyl(p, 'pasli_demir', V(17, 0.15, -3), V(19.6, 0.5, -4.2), 0.07, 8); K.beam(p, 'pasli_demir', V(19.6, 0.5, -4.2), V(20.2, 0.15, -3.0), 0.12, 0.1); K.beam(p, 'pasli_demir', V(19.6, 0.5, -4.2), V(19.5, 1.3, -5.1), 0.12, 0.1); K.beam(p, 'direk', V(17.2, 0.1, -3.9), V(17.5, 0.5, -2.3), 0.14, 0.14);
}
function denizDibi(p, r) {
  const nx = 46, nz = 34, X = (i) => -30 + (60 * i) / nx, Z = (j) => -24 + (40 * j) / nz, n2 = (x, z) => Math.sin(x * 0.31 + 1) * Math.cos(z * 0.27) * 0.25 + Math.sin(x * 0.9 + z * 0.7) * 0.07;
  const h = (i, j) => { const x = X(i), z = Z(j); return n2(x, z) + 0.95 * Math.exp(-((z + 5.2) ** 2) / 5) * Math.max(0, 1 - (x / 15) ** 4) - 0.25; };
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const q = [V(X(i), h(i, j), Z(j)), V(X(i + 1), h(i + 1, j), Z(j)), V(X(i + 1), h(i + 1, j + 1), Z(j + 1)), V(X(i), h(i, j + 1), Z(j + 1))]; p.quad('kum', q, q.map((v) => [v.x / 5, v.z / 5]), V(0, 1, 0)); }
  void r;
}
export function createBatikGemi() {
  const root = new THREE.Group(), r = K.rng(1453);
  root.name = 'batik_gemi';
  const g = new Part('gemi'); govde(g, r);
  const gm = g.mesh(M); gm.name = 'gemi';
  gm.geometry.rotateX(-HEEL); gm.geometry.computeBoundingBox();
  gm.geometry.translate(0, -gm.geometry.boundingBox.min.y - 0.75, 4.0); gm.geometry.computeVertexNormals();
  const e = new Part('enkaz'); enkaz(e, r); const em = e.mesh(M); em.name = 'enkaz';
  const d = new Part('deniz_dibi'); denizDibi(d, r); const dm = d.mesh(M); dm.name = 'deniz_dibi';
  root.add(gm, em, dm);
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  return root;
}
