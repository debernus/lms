import * as THREE from 'three';
import './mezar.js'; // Amiri yazı tipini yükler (çini kuşağı ve kitabe için)
import * as K from './kit_ortak.js';
const { V, TAU, Part } = K;

// Boğaz kıyısındaki hazire resminden üç yapı (19. yy sonu İstanbul), her biri ayrı model:
// turbe (kubbeli, çinili, sekizgen), ahsap_ev (cumbalı, yeşil kepenkli), giris_kosku (geniş saçaklı taş kapı yapısı).
// Metre, Y yukarı; orijin tabanın ortasında (y = 0); ön cephe +Z.

// ---------- Dokular ----------
const col = ([r, g, b], a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;
const ton = (rand, c, d) => { const k = 1 + (rand() - 0.5) * 2 * d; return c.map((v) => Math.min(255, v * k)); };
const kir = (g, w, h, rand, n, c = '40,32,22', a = 0.12) => { for (let k = 0; k < n; k++) { g.fillStyle = `rgba(${c},${rand() * a})`; g.beginPath(); g.ellipse(rand() * w, rand() * h, 4 + rand() * w * 0.08, 6 + rand() * h * 0.12, 0, 0, 7); g.fill(); } };
const PAINT = {
  // Almaşık duvar: iki sıra kesme taş, üç sıra tuğla (doku 1,3 m'ye döşenir)
  almasik: (g, w, h, rand) => {
    g.fillStyle = '#8a7c6a'; g.fillRect(0, 0, w, h);
    const rows = [[0, 0.37, 0], [0.37, 0.74, 0], [0.74, 0.826, 1], [0.826, 0.913, 1], [0.913, 1, 1]];
    for (const [a, b, brick] of rows) { let x = -rand() * 60; while (x < w) { const bw = brick ? 70 + rand() * 30 : 110 + rand() * 90; g.fillStyle = col(ton(rand, brick ? [170, 86, 62] : [222, 208, 182], brick ? 0.14 : 0.07)); g.fillRect(x + 2, a * h + 2, bw - 4, (b - a) * h - 4); x += bw; } }
    kir(g, w, h, rand, 60);
    for (let k = 0; k < 2500; k++) { g.fillStyle = rand() < 0.5 ? 'rgba(60,46,34,0.12)' : 'rgba(255,245,225,0.1)'; g.fillRect(rand() * w, rand() * h, 1 + rand() * 3, 1 + rand() * 2); }
  },
  mermer: (g, w, h, rand) => {
    g.fillStyle = '#e4dfd2'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 26; k++) { g.strokeStyle = `rgba(120,118,112,${0.06 + rand() * 0.14})`; g.lineWidth = 1 + rand() * 3; g.beginPath(); let x = rand() * w, y = rand() * h; g.moveTo(x, y); for (let i = 0; i < 6; i++) { x += (rand() - 0.5) * 120; y += (rand() - 0.3) * 90; g.lineTo(x, y); } g.stroke(); }
    kir(g, w, h, rand, 40, '90,80,60', 0.1);
  },
  kesme_tas: (g, w, h, rand) => {
    g.fillStyle = '#8f8472'; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 4; r++) { let x = -rand() * 80; while (x < w) { const bw = 120 + rand() * 110; g.fillStyle = col(ton(rand, [214, 200, 172], 0.08)); g.fillRect(x + 2, (r * h) / 4 + 2, bw - 4, h / 4 - 4); x += bw; } }
    kir(g, w, h, rand, 70);
  },
  // Çini: lacivert zemin, beyaz ve turkuaz rozetler
  cini: (g, w, h, rand) => {
    g.fillStyle = '#1b3f86'; g.fillRect(0, 0, w, h);
    const rozet = (x, y, R) => {
      for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; g.fillStyle = k % 2 ? '#2f9aa8' : '#f1efe6'; g.beginPath(); g.ellipse(x + Math.cos(a) * R * 0.55, y + Math.sin(a) * R * 0.55, R * 0.42, R * 0.2, a, 0, 7); g.fill(); }
      g.fillStyle = '#b8402e'; g.beginPath(); g.arc(x, y, R * 0.16, 0, 7); g.fill();
      g.strokeStyle = '#f1efe6'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, R, 0, 7); g.stroke();
    };
    rozet(w / 2, h / 2, w * 0.26);
    for (const [x, y] of [[0, 0], [w, 0], [0, h], [w, h]]) rozet(x, y, w * 0.2);
    g.strokeStyle = '#2f9aa8'; g.lineWidth = 3;
    for (const [x, y, a] of [[w / 2, 0, 0], [w / 2, h, Math.PI], [0, h / 2, -Math.PI / 2], [w, h / 2, Math.PI / 2]]) { g.beginPath(); g.arc(x, y, w * 0.16, a, a + Math.PI); g.stroke(); }
    g.strokeStyle = 'rgba(230,228,215,0.55)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
    kir(g, w, h, rand, 10, '10,20,40', 0.15);
  },
  cini_yazi: (g, w, h) => {
    g.fillStyle = '#17377a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2f9aa8'; g.fillRect(0, 0, w, h * 0.09); g.fillRect(0, h * 0.91, w, h * 0.09);
    g.fillStyle = '#f1efe6'; g.fillRect(0, h * 0.09, w, 3); g.fillRect(0, h * 0.91 - 3, w, 3);
    g.font = `700 ${h * 0.56}px Amiri`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl';
    g.fillText('بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ', w / 2, h * 0.5);
  },
  sebeke: (g, w, h) => { // altıgen taş şebeke
    g.fillStyle = '#14181c'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d8d0bc'; g.lineWidth = w * 0.035;
    const R = w / 9;
    for (let r = -1; r < 12; r++) for (let c = -1; c < 8; c++) { const x = c * R * 1.732 + (r % 2 ? R * 0.866 : 0), y = r * R * 1.5; g.beginPath(); for (let k = 0; k <= 6; k++) g.lineTo(x + Math.sin((k / 6) * TAU) * R, y + Math.cos((k / 6) * TAU) * R); g.stroke(); }
  },
  parmaklik: (g, w, h) => {
    g.fillStyle = '#101214'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#3a342e'; g.lineWidth = w * 0.03;
    for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo((k / 6) * w, 0); g.lineTo((k / 6) * w, h); g.stroke(); }
    for (let k = 1; k < 8; k++) { g.beginPath(); g.moveTo(0, (k / 8) * h); g.lineTo(w, (k / 8) * h); g.stroke(); }
    g.fillStyle = '#4a433a'; for (let a = 1; a < 6; a++) for (let b = 1; b < 8; b++) { g.beginPath(); g.arc((a / 6) * w, (b / 8) * h, w * 0.028, 0, 7); g.fill(); }
  },
  kursun: (g, w, h, rand) => {
    g.fillStyle = '#7c8286'; g.fillRect(0, 0, w, h);
    kir(g, w, h, rand, 80, '40,44,48', 0.2); kir(g, w, h, rand, 50, '200,205,205', 0.12);
    for (let k = 0; k < 4; k++) { const x = (k / 4) * w; g.fillStyle = 'rgba(40,44,48,0.6)'; g.fillRect(x, 0, 3, h); g.fillStyle = 'rgba(200,205,205,0.5)'; g.fillRect(x + 3, 0, 4, h); }
  },
  beyaz_tahta: (g, w, h, rand) => { // yatay kaplama tahtaları: badanası dökülmüş
    g.fillStyle = '#6a5e50'; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 8; r++) { g.fillStyle = col(ton(rand, [216, 207, 190], 0.05)); g.fillRect(0, (r * h) / 8 + 1, w, h / 8 - 3); for (let k = 0; k < 10; k++) { g.fillStyle = `rgba(110,96,80,${0.15 + rand() * 0.35})`; g.fillRect(rand() * w, (r * h) / 8 + 2 + rand() * (h / 8 - 8), 10 + rand() * 80, 2 + rand() * 5); } if (rand() < 0.7) { g.fillStyle = 'rgba(70,60,50,0.6)'; g.fillRect(rand() * w, (r * h) / 8, 2, h / 8); } }
    kir(g, w, h, rand, 50);
  },
  kepenk: (g, w, h, rand) => { // yeşil panjurlu kepenk kanadı çifti
    g.fillStyle = '#3f6b45'; g.fillRect(0, 0, w, h);
    for (const x0 of [0, w / 2]) { g.fillStyle = '#35593a'; g.fillRect(x0 + w * 0.05, h * 0.05, w * 0.4, h * 0.9); for (let k = 0; k < 22; k++) { const y = h * 0.06 + (k / 22) * h * 0.88; g.fillStyle = col(ton(rand, [78, 128, 82], 0.08)); g.fillRect(x0 + w * 0.06, y, w * 0.38, h * 0.024); g.fillStyle = 'rgba(16,30,18,0.7)'; g.fillRect(x0 + w * 0.06, y + h * 0.024, w * 0.38, h * 0.012); } g.fillStyle = '#35593a'; g.fillRect(x0 + w * 0.05, h * 0.48, w * 0.4, h * 0.04); }
    g.fillStyle = 'rgba(14,24,14,0.8)'; g.fillRect(w / 2 - 2, 0, 4, h);
    kir(g, w, h, rand, 30, '200,200,170', 0.1);
  },
  yesil_kapi: (g, w, h, rand) => {
    g.fillStyle = '#2f5038'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 6; k++) { g.fillStyle = col(ton(rand, [58, 96, 66], 0.1)); g.fillRect((k / 6) * w + 2, 0, w / 6 - 4, h); }
    g.fillStyle = 'rgba(12,22,14,0.85)'; g.fillRect(w / 2 - 2, 0, 4, h);
    g.fillStyle = '#2a2622'; for (let a = 0; a < 6; a++) for (const y of [0.12, 0.42, 0.72]) { g.beginPath(); g.arc(((a + 0.5) / 6) * w, y * h, w * 0.014, 0, 7); g.fill(); }
    g.fillStyle = '#8a7434'; g.beginPath(); g.arc(w * 0.44, h * 0.56, w * 0.022, 0, 7); g.fill(); g.beginPath(); g.arc(w * 0.56, h * 0.56, w * 0.022, 0, 7); g.fill();
    kir(g, w, h, rand, 30);
  },
  kitabe: (g, w, h) => {
    g.fillStyle = '#23513a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c9a646'; g.lineWidth = h * 0.03; g.strokeRect(h * 0.05, h * 0.05, w - h * 0.1, h * 0.9);
    g.fillStyle = '#d8b858'; g.font = `700 ${h * 0.2}px Amiri`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl';
    ['كُلُّ نَفْسٍ ذَائِقَةُ الْمَوْتِ', 'هُوَ الْبَاقِي', 'رُوحِنَه الْفَاتِحَه'].forEach((t, i) => g.fillText(t, w / 2, h * (0.25 + i * 0.26)));
  },
  kereste: (g, w, h, rand) => { g.fillStyle = '#5a4634'; g.fillRect(0, 0, w, h); for (let k = 0; k < 300; k++) { g.fillStyle = rand() < 0.5 ? `rgba(30,22,14,${rand() * 0.3})` : `rgba(150,124,92,${rand() * 0.2})`; g.fillRect(rand() * w, rand() * h, 30 + rand() * 160, 1 + rand() * 3); } for (let k = 1; k < 5; k++) { g.fillStyle = 'rgba(20,14,8,0.6)'; g.fillRect(0, (k / 5) * h, w, 2); } },
};
const M = K.materials('hazire', {
  almasik_duvar: [PAINT.almasik, 512, 512], mermer: [PAINT.mermer, 512, 512], kesme_tas: [PAINT.kesme_tas, 512, 512], cini: [PAINT.cini, 256, 256], cini_yazi: [PAINT.cini_yazi, 1024, 128],
  sebeke: [PAINT.sebeke, 256, 512], demir_parmaklik: [PAINT.parmaklik, 256, 512], kursun: [PAINT.kursun, 256, 256], beyaz_tahta: [PAINT.beyaz_tahta, 512, 512], yesil_kepenk: [PAINT.kepenk, 256, 512],
  yesil_kapi: [PAINT.yesil_kapi, 256, 512], kitabe: [PAINT.kitabe, 512, 256], kereste: [PAINT.kereste, 256, 256], pirinc: 0xa8873a, karanlik: 0x121416,
});
for (const m of Object.values(M)) m.side = THREE.DoubleSide;
M.pirinc.metalness = 0.8; M.pirinc.roughness = 0.4;

// ---------- Yardımcılar ----------
const UP = V(0, 1, 0);
const yuz = (C, N) => { const R = V(N.z, 0, -N.x); return { C, R, N, pt: (u, y, d = 0) => C.clone().addScaledVector(R, u).addScaledVector(N, d).setY(C.y + y) }; };
const kaydir = (F, d) => yuz(F.C.clone().addScaledVector(F.N, d), F.N);
function kemer(op, u) { // açıklığın üst kenarının yüksekliği
  if (!op.rise) return op.ys;
  const a = (op.u1 - op.u0) / 2, x = Math.min(a, Math.abs(u - (op.u0 + op.u1) / 2));
  if (op.rise < a) return op.ys + op.rise * Math.sqrt(Math.max(0, 1 - (x / a) ** 2));
  const R = (op.rise ** 2 + a ** 2) / (2 * a), cx = a - R;
  return op.ys + Math.sqrt(Math.max(0, R * R - (x - cx) ** 2)); // sivri kemer
}
// Cephe: bölgelere ayrılmış duvar yüzü ve içine oyulmuş (kemerli ya da düz) açıklıklar.
// zones: [y0, y1, malzeme, döşeme ölçüsü | 'fit']; ops: { u0, u1, y0, ys, rise, depth, fill, reveal }
function cephe(P, F, w, zones, ops = []) {
  const us = [...new Set([-w / 2, w / 2, ...ops.flatMap((o) => [o.u0, o.u1])])].sort((a, b) => a - b), ys = [...new Set([...zones.flatMap((z) => [z[0], z[1]]), ...ops.flatMap((o) => [o.y0, o.ys, o.ys + (o.rise || 0)])])].sort((a, b) => a - b);
  const yMin = zones[0][0], yMax = zones[zones.length - 1][1];
  const uvOf = (z) => (u, y) => (z[3] === 'fit' ? [(u + w / 2) / w, (y - z[0]) / (z[1] - z[0])] : [u / (z[3] || 1), y / (z[3] || 1)]);
  const q = (mat, pts, uv) => P.quad(mat, pts.map(([u, y]) => F.pt(u, y)), pts.map(([u, y]) => uv(u, y)), F.N);
  for (let i = 0; i + 1 < us.length; i++) for (let j = 0; j + 1 < ys.length; j++) {
    const ua = us[i], ub = us[i + 1], ya = ys[j], yb = ys[j + 1], um = (ua + ub) / 2, ym = (ya + yb) / 2;
    if (ym < yMin || ym > yMax) continue;
    const z = zones.find((zz) => ym >= zz[0] && ym <= zz[1]), op = ops.find((o) => um > o.u0 && um < o.u1 && ym > o.y0 && ym < o.ys + (o.rise || 0));
    if (!z) continue;
    if (!op) { q(z[2], [[ua, ya], [ub, ya], [ub, yb], [ua, yb]], uvOf(z)); continue; }
    if (ym < op.ys) continue;
    for (let k = 0; k < 8; k++) { const u1 = ua + ((ub - ua) * k) / 8, u2 = ua + ((ub - ua) * (k + 1)) / 8, c1 = Math.max(ya, kemer(op, u1)), c2 = Math.max(ya, kemer(op, u2)); if (c1 < yb - 1e-4 || c2 < yb - 1e-4) q(z[2], [[u1, Math.min(c1, yb)], [u2, Math.min(c2, yb)], [u2, yb], [u1, yb]], uvOf(z)); }
  }
  for (const op of ops) {
    const d = -(op.depth ?? 0.12), top = op.ys + (op.rise || 0), fit = (u, y) => [(u - op.u0) / (op.u1 - op.u0), (y - op.y0) / (top - op.y0)], rv = op.reveal || 'mermer';
    const B = (u, y) => F.pt(u, y, d), A = (u, y) => F.pt(u, y, 0);
    P.quad(op.fill, [B(op.u0, op.y0), B(op.u1, op.y0), B(op.u1, op.ys), B(op.u0, op.ys)], [fit(op.u0, op.y0), fit(op.u1, op.y0), fit(op.u1, op.ys), fit(op.u0, op.ys)], F.N);
    for (const [u, n] of [[op.u0, 1], [op.u1, -1]]) P.quad(rv, [A(u, op.y0), B(u, op.y0), B(u, op.ys), A(u, op.ys)], K.FLAT, F.R.clone().multiplyScalar(n));
    P.quad(rv, [A(op.u0, op.y0), A(op.u1, op.y0), B(op.u1, op.y0), B(op.u0, op.y0)], K.FLAT, UP);
    const n = op.rise ? 10 : 1, uc = (op.u0 + op.u1) / 2;
    for (let k = 0; k < n; k++) {
      const u1 = op.u0 + ((op.u1 - op.u0) * k) / n, u2 = op.u0 + ((op.u1 - op.u0) * (k + 1)) / n, y1 = kemer(op, u1), y2 = kemer(op, u2);
      if (op.rise) P.tri(op.fill, [B(uc, op.ys), B(u1, y1), B(u2, y2)], [fit(uc, op.ys), fit(u1, y1), fit(u2, y2)], F.N);
      P.quad(rv, [A(u1, y1), A(u2, y2), B(u2, y2), B(u1, y1)], K.FLAT, V(0, -1, 0));
    }
  }
}
// Yüze göre kutu: u, y aralığı; d0 (içte) … d1 (dışta)
function kutu(P, F, u0, u1, y0, y1, d0, d1, mat, fitFront = false) {
  const p = (u, y, d) => F.pt(u, y, d), uv = fitFront ? K.FLAT : [[u0, y0], [u1, y0], [u1, y1], [u0, y1]];
  P.quad(mat, [p(u0, y0, d1), p(u1, y0, d1), p(u1, y1, d1), p(u0, y1, d1)], uv, F.N);
  P.quad(mat, [p(u0, y0, d0), p(u0, y0, d1), p(u0, y1, d1), p(u0, y1, d0)], K.FLAT, F.R.clone().negate());
  P.quad(mat, [p(u1, y0, d0), p(u1, y0, d1), p(u1, y1, d1), p(u1, y1, d0)], K.FLAT, F.R);
  P.quad(mat, [p(u0, y1, d0), p(u1, y1, d0), p(u1, y1, d1), p(u0, y1, d1)], K.FLAT, UP);
  P.quad(mat, [p(u0, y0, d0), p(u1, y0, d0), p(u1, y0, d1), p(u0, y0, d1)], K.FLAT, V(0, -1, 0));
}
// Y çevresinde dönel / çokgen yüzey. prof: [yarıçap, y, malzeme?]; phase: ilk köşenin açısı
function halka(P, mat, prof, n, phase = 0, s = 1, cx = 0, cz = 0) {
  let run = 0;
  for (let j = 0; j + 1 < prof.length; j++) {
    const [r0, y0, m = mat] = prof[j], [r1, y1] = prof[j + 1], len = Math.hypot(r1 - r0, y1 - y0);
    for (let k = 0; k < n; k++) {
      const a = phase + (k / n) * TAU, b = phase + ((k + 1) / n) * TAU, at = (r, y, t) => V(cx + Math.sin(t) * r, y, cz + Math.cos(t) * r);
      const hint = V(Math.sin((a + b) / 2), Math.abs(y1 - y0) < 1e-6 ? (r1 < r0 ? 9 : -9) : (r1 < r0 ? 0.7 : -0.2), Math.cos((a + b) / 2));
      const uv = [[(k / n) * 4 * s, run / s], [((k + 1) / n) * 4 * s, run / s], [((k + 1) / n) * 4 * s, (run + len) / s], [(k / n) * 4 * s, (run + len) / s]];
      if (r1 < 1e-4) P.tri(m, [at(r0, y0, a), at(r0, y0, b), at(0, y1, a)], uv.slice(0, 3), hint);
      else if (r0 < 1e-4) P.tri(m, [at(0, y0, a), at(r1, y1, b), at(r1, y1, a)], [uv[0], uv[2], uv[3]], hint);
      else P.quad(m, [at(r0, y0, a), at(r0, y0, b), at(r1, y1, b), at(r1, y1, a)], uv, hint);
    }
    run += len;
  }
}
const alem = (P, x, y, z, s = 1) => halka(P, 'pirinc', [[0.1, 0], [0.13, 0.06], [0.05, 0.14], [0.14, 0.26], [0.14, 0.34], [0.04, 0.46], [0.1, 0.56], [0.1, 0.62], [0.025, 0.74], [0.02, 1.0], [0, 1.12]].map(([r, h]) => [r * s, y + h * s]), 8, 0, 1, x, z);
// Kırma çatı: saçak dikdörtgeninden mahyaya
function kirmaCati(P, x0, x1, z0, z1, y0, y1, mat) {
  const hx = (x1 - x0) / 2, hz = (z1 - z0) / 2, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, alongZ = hz > hx, ins = Math.min(hx, hz), rx = alongZ ? 0 : hx - ins, rz = alongZ ? hz - ins : 0;
  const A = V(cx - rx, y1, cz - rz), B = V(cx + rx, y1, cz + rz), uv = (p) => [(p.x + p.z) / 1.2, p.y / 1.2 + Math.hypot(p.x - cx, p.z - cz) / 1.6];
  const face = (pts, n) => (pts.length === 4 ? P.quad(mat, pts, pts.map(uv), n) : P.tri(mat, pts, pts.map(uv), n));
  if (alongZ) { face([V(x1, y0, z0), V(x1, y0, z1), B, A], V(1, 1, 0)); face([V(x0, y0, z1), V(x0, y0, z0), A, B], V(-1, 1, 0)); face(rx + rz < 1e-6 ? [V(x0, y0, z1), V(x1, y0, z1), B] : [V(x0, y0, z1), V(x1, y0, z1), B], V(0, 1, 1)); face([V(x1, y0, z0), V(x0, y0, z0), A], V(0, 1, -1)); }
  else { face([V(x0, y0, z1), V(x1, y0, z1), B, A], V(0, 1, 1)); face([V(x1, y0, z0), V(x0, y0, z0), A, B], V(0, 1, -1)); face([V(x1, y0, z1), V(x1, y0, z0), B], V(1, 1, 0)); face([V(x0, y0, z0), V(x0, y0, z1), A], V(-1, 1, 0)); }
  return [A, B];
}
// Saçak: alt yüzü ahşap, alın tahtalı levha
function sacak(P, x0, x1, z0, z1, y, t = 0.12) {
  P.quad('kereste', [V(x0, y, z0), V(x1, y, z0), V(x1, y, z1), V(x0, y, z1)], [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], V(0, -1, 0));
  for (const [a, b, n] of [[V(x0, y, z1), V(x1, y, z1), V(0, 0, 1)], [V(x1, y, z0), V(x0, y, z0), V(0, 0, -1)], [V(x1, y, z1), V(x1, y, z0), V(1, 0, 0)], [V(x0, y, z0), V(x0, y, z1), V(-1, 0, 0)]]) P.quad('kereste', [a, b, b.clone().setY(y + t), a.clone().setY(y + t)], [[0, 0], [a.distanceTo(b), 0], [a.distanceTo(b), t], [0, t]], n);
}

// ---------- Yapılar ----------
const YAPILAR = {
  // Türbe: sekizgen gövde; altta çini pano ve demir parmaklıklı kemerli pencereler, üstte yazı kuşağı,
  // almaşık duvarda şebekeli pencereler, mermer saçak silmesi, kurşun kubbe ve alem
  turbe: (P) => {
    const ap = 2.7, Rc = ap / Math.cos(Math.PI / 8), s = 2 * ap * Math.tan(Math.PI / 8);
    for (let i = 0; i < 8; i++) {
      const th = (i / 8) * TAU, N = V(Math.sin(th), 0, Math.cos(th)), F = yuz(N.clone().multiplyScalar(ap), N), door = i === 4;
      const alt = door ? { u0: -0.6, u1: 0.6, y0: 0.5, ys: 2.05, rise: 0.7, depth: 0.22, fill: 'yesil_kapi' } : { u0: -0.46, u1: 0.46, y0: 0.95, ys: 2.0, rise: 0.55, depth: 0.2, fill: 'demir_parmaklik' };
      const ust = { u0: -0.4, u1: 0.4, y0: 3.75, ys: 4.55, rise: 0.5, depth: 0.14, fill: 'sebeke', reveal: 'almasik_duvar' };
      cephe(P, F, s, [[0, 0.5, 'mermer', 1.2], [0.5, 2.95, 'cini', 0.42], [2.95, 3.35, 'cini_yazi', 'fit'], [3.35, 5.4, 'almasik_duvar', 0.95]], [alt, ust]);
      // Mermer söve: açıklığın çevresinde öne çıkan çerçeve
      const hw = (alt.u1 - alt.u0) / 2 + 0.2, F2 = kaydir(F, 0.035);
      cephe(P, F2, hw * 2, [[door ? 0.5 : 0.78, alt.ys + alt.rise + 0.16, 'mermer', 1.2]], [{ ...alt, depth: 0.035 + 0 }]);
      kutu(P, F, -0.52, 0.52, 3.62, 3.75, 0, 0.07, 'mermer'); // üst pencere denizliği
      if (door) { kutu(P, F, -0.9, 0.9, 0, 0.25, 0, 0.75, 'mermer'); kutu(P, F, -0.9, 0.9, 0.25, 0.5, 0, 0.4, 'mermer'); } // basamaklar
      // Köşe sütunçeleri
      const c = V(Math.sin(th + Math.PI / 8), 0, Math.cos(th + Math.PI / 8)).multiplyScalar(Rc + 0.01);
      halka(P, 'mermer', [[0.11, 0.5], [0.11, 0.62], [0.08, 0.66], [0.08, 2.78], [0.11, 2.84], [0.11, 2.95]], 6, 0, 1, c.x, c.z);
    }
    halka(P, 'mermer', [[Rc + 0.14, 0], [Rc + 0.14, 0.34], [Rc + 0.04, 0.42], [Rc, 0.42]], 8, Math.PI / 8); // kaide
    halka(P, 'mermer', [[Rc, 5.4], [Rc + 0.1, 5.46], [Rc + 0.1, 5.56], [Rc + 0.24, 5.68], [Rc + 0.24, 5.78], [Rc - 0.05, 5.86]], 8, Math.PI / 8); // saçak silmesi
    halka(P, 'kursun', [[Rc - 0.05, 5.86], [2.62, 6.02]], 8, Math.PI / 8, 1.2);
    halka(P, 'mermer', [[2.62, 6.02], [2.52, 6.02, 'mermer'], [2.52, 6.36], [2.58, 6.4], [2.46, 6.44]], 24); // kasnak
    const dome = Array.from({ length: 10 }, (_, k) => { const t = (k / 9) * (Math.PI / 2); return [2.46 * Math.cos(t) ** 0.92, 6.44 + 2.5 * Math.sin(t)]; });
    dome[9][0] = 0.14;
    halka(P, 'kursun', dome, 24, 0, 1.2);
    alem(P, 0, 6.44 + 2.5 - 0.03, 0, 1.15);
  },
  // Ahşap ev: taş temel, beyaz kaplama tahtalı iki kat, üst kat öne ve sağa çıkmalı (cumba), yeşil kepenkler, geniş saçak
  ahsap_ev: (P) => {
    const gx = 2.3, gz = 2.8, ux0 = -2.3, ux1 = 2.85, uz0 = -2.8, uz1 = 3.35, Y1 = 3.2, Y2 = 6.2;
    const pen = (u, y0, y1, w = 0.9, fill = 'yesil_kepenk') => ({ u0: u - w / 2, u1: u + w / 2, y0, ys: y1, rise: 0, depth: 0.05, fill, reveal: 'kereste' });
    const kat = (C, N, w, y0, y1, ops) => { const F = yuz(C, N); cephe(P, F, w, [[y0, y1, 'beyaz_tahta', 1.6]], ops); for (const o of ops) { kutu(P, F, o.u0 - 0.07, o.u1 + 0.07, o.y0 - 0.08, o.y0, 0, 0.06, 'kereste'); kutu(P, F, o.u0 - 0.07, o.u1 + 0.07, o.ys, o.ys + 0.08, 0, 0.06, 'kereste'); } return F; };
    P.box('kesme_tas', -gx - 0.05, gx + 0.05, 0, 0.35, -gz - 0.05, gz + 0.05, ['+x', '-x', '+z', '-z', '+y'], 1.6, 1.6);
    // Zemin kat
    kat(V(0, 0, gz), V(0, 0, 1), gx * 2, 0.35, Y1, [{ ...pen(-1.25, 0.35, 2.5, 1.0, 'yesil_kapi'), depth: 0.1 }, pen(0.95, 1.2, 2.6)]);
    kat(V(gx, 0, 0), V(1, 0, 0), gz * 2, 0.35, Y1, [pen(-1.4, 1.2, 2.6), pen(1.4, 1.2, 2.6)]);
    kat(V(-gx, 0, 0), V(-1, 0, 0), gz * 2, 0.35, Y1, [pen(0, 1.2, 2.6)]);
    kat(V(0, 0, -gz), V(0, 0, -1), gx * 2, 0.35, Y1, [pen(0.9, 1.2, 2.6)]);
    // Üst kat (çıkmalı)
    const ucx = (ux0 + ux1) / 2, ucz = (uz0 + uz1) / 2, uw = ux1 - ux0, ud = uz1 - uz0;
    const on = kat(V(ucx, 0, uz1), V(0, 0, 1), uw, Y1, Y2, [pen(-1.55, 3.95, 5.55), pen(0, 3.95, 5.55), pen(1.55, 3.95, 5.55)]);
    kat(V(ux1, 0, ucz), V(1, 0, 0), ud, Y1, Y2, [pen(-1.9, 3.95, 5.55), pen(0, 3.95, 5.55, 0.9, 'karanlik'), pen(1.9, 3.95, 5.55)]);
    kat(V(ux0, 0, ucz), V(-1, 0, 0), ud, Y1, Y2, [pen(-1.4, 3.95, 5.55), pen(1.4, 3.95, 5.55)]);
    kat(V(ucx, 0, uz0), V(0, 0, -1), uw, Y1, Y2, [pen(-1.2, 3.95, 5.55), pen(1.2, 3.95, 5.55)]);
    // Açık kepenk kanatları (sağ cephenin ortasındaki pencere)
    for (const sgn of [-1, 1]) { const h0 = V(ux1 + 0.01, 3.95, ucz + sgn * 0.45), e = h0.clone().add(V(0.36, 0, sgn * 0.27)); P.quad('yesil_kepenk', [h0, e, e.clone().setY(5.55), h0.clone().setY(5.55)], [[0.02, 0], [0.48, 0], [0.48, 1], [0.02, 1]], V(1, 0, -sgn)); }
    // Çıkmanın altı, kat silmesi ve eli böğründeler
    P.quad('kereste', [V(ux0, Y1, uz0), V(ux1, Y1, uz0), V(ux1, Y1, uz1), V(ux0, Y1, uz1)], [[ux0, uz0], [ux1, uz0], [ux1, uz1], [ux0, uz1]], V(0, -1, 0));
    P.box('kereste', ux0 - 0.04, ux1 + 0.04, Y1 - 0.02, Y1 + 0.14, uz0 - 0.04, uz1 + 0.04, ['+x', '-x', '+z', '-z'], 1, 1);
    for (const z of [-2.2, -0.75, 0.75, 2.2]) K.beam(P, 'kereste', V(gx, Y1 - 0.75, z), V(ux1 - 0.05, Y1, z), 0.11, 0.09);
    for (const x of [-1.9, -0.6, 0.7, 1.95]) K.beam(P, 'kereste', V(x, Y1 - 0.75, gz), V(x, Y1, uz1 - 0.05), 0.11, 0.09);
    for (const [x, z] of [[ux0, uz1], [ux1, uz1], [ux0, uz0], [ux1, uz0]]) P.box('kereste', x - 0.06, x + 0.06, Y1, Y2, z - 0.06, z + 0.06, ['+x', '-x', '+z', '-z'], 1, 1); // köşe tahtaları
    void on;
    // Saçak ve kırma çatı
    const E = 0.85;
    sacak(P, ux0 - E, ux1 + E, uz0 - E, uz1 + E, Y2);
    const [A, B] = kirmaCati(P, ux0 - E, ux1 + E, uz0 - E, uz1 + E, Y2 + 0.12, Y2 + 1.55, 'kursun');
    alem(P, (A.x + B.x) / 2, Y2 + 1.5, B.z - 0.2, 0.7);
  },
  // Giriş köşkü: kesme taş gövde, sivri kemerli yeşil kapı, üstünde yeşil kitabe, çok geniş ahşap saçak, basamaklar
  giris_kosku: (P) => {
    const hx = 1.7, hz = 1.4, H = 3.6;
    const kapi = { u0: -0.62, u1: 0.62, y0: 0.3, ys: 2.0, rise: 0.72, depth: 0.28, fill: 'yesil_kapi' };
    const on = yuz(V(0, 0, hz), V(0, 0, 1));
    cephe(P, on, hx * 2, [[0, 0.3, 'mermer', 1.2], [0.3, H, 'kesme_tas', 1.5]], [kapi]);
    cephe(P, kaydir(on, 0.05), 1.8, [[0.3, 2.86, 'mermer', 1.2]], [{ ...kapi, depth: 0.05 }]);
    kutu(P, on, -0.8, 0.8, 2.9, 3.48, 0, 0.07, 'mermer');
    kutu(P, on, -0.72, 0.72, 2.95, 3.43, 0.07, 0.09, 'kitabe', true);
    const pencere = { u0: -0.35, u1: 0.35, y0: 1.2, ys: 2.0, rise: 0.42, depth: 0.2, fill: 'demir_parmaklik' };
    for (const [C, N, w] of [[V(hx, 0, 0), V(1, 0, 0), hz * 2], [V(-hx, 0, 0), V(-1, 0, 0), hz * 2]]) { const F = yuz(C, N); cephe(P, F, w, [[0, 0.3, 'mermer', 1.2], [0.3, H, 'kesme_tas', 1.5]], [pencere]); cephe(P, kaydir(F, 0.04), 1.1, [[1.05, 2.6, 'mermer', 1.2]], [{ ...pencere, depth: 0.04 }]); }
    cephe(P, yuz(V(0, 0, -hz), V(0, 0, -1)), hx * 2, [[0, 0.3, 'mermer', 1.2], [0.3, H, 'kesme_tas', 1.5]]);
    // Basamaklar
    for (let k = 0; k < 3; k++) P.box('mermer', -1.1 - k * 0.12, 1.1 + k * 0.12, 0, 0.3 - k * 0.1, hz, hz + 0.35 + k * 0.32, ['+x', '-x', '+z', '+y'], 1.2, 1.2);
    // Saçak: gövdeden 1,1 m taşar; altında payandalar
    const E = 1.1;
    P.box('kereste', -hx - 0.06, hx + 0.06, H, H + 0.16, -hz - 0.06, hz + 0.06, ['+x', '-x', '+z', '-z'], 1, 1);
    sacak(P, -hx - E, hx + E, -hz - E, hz + E, H + 0.16, 0.14);
    for (const x of [-1.3, 0, 1.3]) for (const s of [-1, 1]) K.beam(P, 'kereste', V(x, H - 0.55, s * hz), V(x, H + 0.14, s * (hz + E - 0.15)), 0.1, 0.08);
    for (const z of [-0.9, 0.9]) for (const s of [-1, 1]) K.beam(P, 'kereste', V(s * hx, H - 0.55, z), V(s * (hx + E - 0.15), H + 0.14, z), 0.1, 0.08);
    const [A, B] = kirmaCati(P, -hx - E, hx + E, -hz - E, hz + E, H + 0.3, H + 1.25, 'kursun');
    alem(P, (A.x + B.x) / 2, H + 1.2, 0, 0.6);
  },
};
export const HAZIRE_YAPILARI = Object.keys(YAPILAR);
export function createHazireYapisi(name) {
  const p = new Part(name);
  YAPILAR[name](p);
  const mesh = p.mesh(M);
  mesh.name = name;
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
