import * as THREE from 'three';
import * as K from './kit_ortak.js';
import { yuz, kemer, cephe, kutu, halka } from './hazire_yapilari.js';
const { V, TAU, Part } = K;

// Mimari süsleme kiti: oymalı taş pencereler, kemerli kapılar, cumba ve balkonlar, yıldız rozet, demir konsol, fenerler.
// Duvara takılan parçalar: arkası z = 0, önü +Z; orijin alt kenarın ortasında (fenerlerde duvar levhasının ortasında).
// Kafesler saydam kesmeli dokudur (alphaTest): delikleri gerçekten boştur.

// ---------- Dokular ----------
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function tuval(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function doku(name, c, srgb = true, wrap = true) { const t = new THREE.CanvasTexture(c); t.name = name; if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 4; return t; }
function normalden(hc, k) {
  const w = hc.width, h = hc.height, src = hc.getContext('2d').getImageData(0, 0, w, h).data, [c, g] = tuval(w, h), out = g.createImageData(w, h), H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = (H(x + 1, y) - H(x - 1, y)) * k, dy = (H(x, y + 1) - H(x, y - 1)) * k, l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4; out.data[i] = (-dx / l * 0.5 + 0.5) * 255; out.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; out.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; out.data[i + 3] = 255; }
  g.putImageData(out, 0, 0);
  return c;
}
const TAS = [184, 156, 112];
function tasZemin(g, w, h, r, base = TAS) {
  g.fillStyle = `rgb(${base})`; g.fillRect(0, 0, w, h);
  for (let k = 0; k < 900; k++) { g.fillStyle = r() < 0.5 ? `rgba(90,70,44,${r() * 0.16})` : `rgba(240,225,190,${r() * 0.14})`; g.beginPath(); g.ellipse(r() * w, r() * h, 2 + r() * 26, 2 + r() * 16, r() * 3, 0, 7); g.fill(); }
  for (let k = 0; k < 2500; k++) { g.fillStyle = r() < 0.5 ? 'rgba(70,52,30,0.18)' : 'rgba(255,240,210,0.14)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
}
// Oyma taş: kıvrık dal (rumi) bezemeli kumtaşı; renk ve kabartma
function oymaTas() {
  const W = 512, r = rng(7), [cc, c] = tuval(W, W), [hc, h] = tuval(W, W);
  tasZemin(c, W, W, r);
  h.fillStyle = '#555'; h.fillRect(0, 0, W, W);
  const kivrim = (x, y, R, a0, dir) => { for (const [g, st, lw] of [[c, 'rgba(60,42,22,0.9)', 10], [c, 'rgba(222,198,150,1)', 5], [h, '#fff', 8]]) { g.strokeStyle = st; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); for (let i = 0; i <= 26; i++) { const t = i / 26, a = a0 + dir * t * 4.6, rr = R * (1 - t * 0.82); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.stroke(); } for (const [g, st] of [[c, 'rgba(226,204,160,0.95)'], [h, '#fff']]) { g.fillStyle = st; g.beginPath(); g.ellipse(x + Math.cos(a0) * R * 1.05, y + Math.sin(a0) * R * 1.05, R * 0.34, R * 0.15, a0 + dir * 0.9, 0, 7); g.fill(); } };
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = i * 128 + 64, y = j * 128 + 64, d = (i + j) % 2 ? 1 : -1; for (const dx of [-W, 0, W]) for (const dy of [-W, 0, W]) { kivrim(x + dx, y + dy, 46, d > 0 ? 0.4 : 2.7, d); kivrim(x + dx + 64, y + dy + 64, 24, d > 0 ? 3.4 : 0.2, -d); } }
  return new THREE.MeshStandardMaterial({ name: 'oyma_tas', map: doku('oyma_tas_renk', cc), normalMap: doku('oyma_tas_kabartma', normalden(hc, 3.4), false), roughness: 0.92, metalness: 0 });
}
const duz = (name, base) => { const [c, g] = tuval(256, 256); tasZemin(g, 256, 256, rng(name.length * 31), base); return new THREE.MeshStandardMaterial({ name, map: doku(name, c), roughness: 0.95, metalness: 0 }); };
// Kafes: saydam zemin üstüne taş (ya da demir) çubuklar
function kafes(name, W, H, draw, base = TAS, lw = 15) {
  const [c, g] = tuval(W, H), cizgi = (f) => { for (const [st, w2] of [[`rgb(${base.map((v) => v * 0.45)})`, lw], [`rgb(${base})`, lw * 0.72], [`rgba(255,246,220,0.35)`, lw * 0.25]]) { g.strokeStyle = st; g.lineWidth = w2; g.lineJoin = 'round'; g.lineCap = 'round'; f(g); } };
  draw(g, cizgi, W, H);
  const t = doku(name, c);
  return new THREE.MeshStandardMaterial({ name, map: t, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9, metalness: 0 });
}
const poly = (g, pts, close = true) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); if (close) g.closePath(); g.stroke(); };
const yildiz8 = (x, y, R) => [0, 1].map((q) => Array.from({ length: 4 }, (_, k) => [x + Math.cos(q * Math.PI / 4 + (k / 4) * TAU) * R, y + Math.sin(q * Math.PI / 4 + (k / 4) * TAU) * R]));
const M = {
  oyma_tas: oymaTas(), duz_tas: duz('duz_tas', TAS), mermer: duz('mermer', [214, 200, 170]),
  kafes_yildiz: kafes('kafes_yildiz', 256, 256, (g, cizgi, W) => cizgi(() => { for (const [x, y] of [[W / 2, W / 2], [0, 0], [W, 0], [0, W], [W, W]]) { for (const sq of yildiz8(x, y, W * 0.36)) poly(g, sq); g.beginPath(); g.arc(x, y, W * 0.09, 0, 7); g.stroke(); } poly(g, [[W / 2, 0], [W / 2, W * 0.14]], false); poly(g, [[W / 2, W], [W / 2, W * 0.86]], false); poly(g, [[0, W / 2], [W * 0.14, W / 2]], false); poly(g, [[W, W / 2], [W * 0.86, W / 2]], false); }), TAS, 16),
  kafes_altigen: kafes('kafes_altigen', 256, 444, (g, cizgi, W, H) => cizgi(() => { const R = W / 3 / 0.866 / 2; for (let rI = -1; rI < 8; rI++) for (let cI = -1; cI < 5; cI++) { const x = cI * R * 1.732 + (rI % 2 ? R * 0.866 : 0), y = rI * R * 1.5; poly(g, Array.from({ length: 6 }, (_, k) => [x + Math.sin((k / 6) * TAU) * R, y + Math.cos((k / 6) * TAU) * R])); g.beginPath(); g.arc(x, y, R * 0.3, 0, 7); g.stroke(); } }), TAS, 12),
  kafes_kare: kafes('kafes_kare', 256, 256, (g, cizgi, W) => cizgi(() => { for (let k = -4; k <= 8; k++) { poly(g, [[k * 64, 0], [k * 64 + W, W]], false); poly(g, [[k * 64, 0], [k * 64 - W, W]], false); } for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) g.strokeRect(i * 64 - 9 + (j % 2 ? 32 : 0), j * 64 - 9, 18, 18); }), TAS, 11),
  kafes_rozet: kafes('kafes_rozet', 512, 640, (g, cizgi, W, H) => cizgi(() => { const x = W / 2, y = H * 0.56, R = W * 0.44; for (const rr of [1, 0.62, 0.2]) { g.beginPath(); g.arc(x, y, R * rr, 0, 7); g.stroke(); } for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; poly(g, [[x + Math.cos(a) * R * 0.2, y + Math.sin(a) * R * 0.2], [x + Math.cos(a) * R * 0.62, y + Math.sin(a) * R * 0.62]], false); g.beginPath(); g.arc(x + Math.cos(a + TAU / 24) * R * 0.81, y + Math.sin(a + TAU / 24) * R * 0.81, R * 0.19, 0, 7); g.stroke(); } for (let i = -1; i < 6; i++) for (let j = -1; j < 8; j++) { const px = i * 102 + (j % 2 ? 51 : 0), py = j * 88; if (Math.hypot(px - x, py - y) > R * 1.02) poly(g, Array.from({ length: 6 }, (_, k) => [px + Math.sin((k / 6) * TAU) * 58, py + Math.cos((k / 6) * TAU) * 58])); } g.strokeRect(4, 4, W - 8, H - 8); }), TAS, 15),
  tac: kafes('tac', 512, 160, (g, cizgi, W, H) => cizgi(() => { for (let k = 0; k < 6; k++) { const x = 44 + k * 85, s = k < 3 ? 1 : -1; g.beginPath(); for (let i = 0; i <= 20; i++) { const t = i / 20, a = (s > 0 ? Math.PI : 0) - s * t * 4.4, rr = 34 * (1 - t * 0.75); g.lineTo(x + Math.cos(a) * rr, H * 0.62 + Math.sin(a) * rr); } g.stroke(); } poly(g, [[6, H - 8], [W - 6, H - 8]], false); poly(g, [[W / 2, H - 8], [W / 2 - 26, H * 0.5], [W / 2, 10], [W / 2 + 26, H * 0.5]], true); for (const x of [14, W - 14]) { poly(g, [[x, H - 8], [x, H * 0.35]], false); g.beginPath(); g.arc(x, H * 0.27, 10, 0, 7); g.stroke(); } }), TAS, 12),
  korkuluk: kafes('korkuluk', 256, 256, (g, cizgi, W) => cizgi(() => { for (let k = 0; k < 4; k++) { const x = 32 + k * 64; g.beginPath(); g.moveTo(x, 20); g.bezierCurveTo(x - 22, 70, x - 22, 110, x, 128); g.bezierCurveTo(x + 22, 150, x + 22, 200, x, 236); g.stroke(); g.beginPath(); g.moveTo(x, 20); g.bezierCurveTo(x + 22, 70, x + 22, 110, x, 128); g.bezierCurveTo(x - 22, 150, x - 22, 200, x, 236); g.stroke(); } poly(g, [[0, 10], [W, 10]], false); poly(g, [[0, 246], [W, 246]], false); }), TAS, 13),
  kafes_demir: kafes('kafes_demir', 512, 512, (g, cizgi, W) => cizgi(() => { const sp = (x, y, R, a0, d) => { g.beginPath(); for (let i = 0; i <= 28; i++) { const t = i / 28, a = a0 + d * t * 5.2, rr = R * (1 - t * 0.8); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.stroke(); }; for (const x0 of [0, 256]) { sp(x0 + 76, 150, 62, Math.PI / 2, -1); sp(x0 + 180, 150, 62, Math.PI / 2, 1); sp(x0 + 76, 350, 62, -Math.PI / 2, 1); sp(x0 + 180, 350, 62, -Math.PI / 2, -1); poly(g, [[x0 + 128, 30], [x0 + 128, 482]], false); poly(g, [[x0, 30], [x0, 482]], false); g.beginPath(); g.arc(x0 + 128, 256, 22, 0, 7); g.stroke(); } poly(g, [[0, 26], [W, 26]], false); poly(g, [[0, 486], [W, 486]], false); poly(g, [[W - 1, 30], [W - 1, 482]], false); }), [44, 62, 52], 13),
  rozet_yildiz: kafes('rozet_yildiz', 512, 512, (g, cizgi, W) => { const x = W / 2, y = W / 2, st = Array.from({ length: 16 }, (_, k) => { const a = (k / 16) * TAU + Math.PI / 8, rr = k % 2 ? W * 0.36 : W * 0.48; return [x + Math.cos(a) * rr, y + Math.sin(a) * rr]; }); cizgi(() => { g.lineWidth *= 2.2; poly(g, st); }); cizgi(() => { for (const sq of yildiz8(x, y, W * 0.3)) poly(g, sq); for (const rr of [0.2, 0.08]) { g.beginPath(); g.arc(x, y, W * rr, 0, 7); g.stroke(); } for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; poly(g, [[x + Math.cos(a) * W * 0.08, y + Math.sin(a) * W * 0.08], [x + Math.cos(a) * W * 0.4, y + Math.sin(a) * W * 0.4]], false); g.beginPath(); g.arc(x + Math.cos(a + TAU / 16) * W * 0.24, y + Math.sin(a + TAU / 16) * W * 0.24, W * 0.055, 0, 7); g.stroke(); } }); }, TAS, 13),
  istiridye: (() => { const [c, g] = tuval(256, 256); tasZemin(g, 256, 256, rng(5)); for (let k = 0; k < 11; k++) { const a = Math.PI * (0.04 + (0.92 * k) / 10); g.strokeStyle = 'rgba(80,58,34,0.8)'; g.lineWidth = 5; g.beginPath(); g.moveTo(128, 250); g.lineTo(128 + Math.cos(a) * 250, 250 - Math.sin(a) * 250); g.stroke(); g.strokeStyle = 'rgba(240,224,188,0.7)'; g.lineWidth = 9; const b = a + Math.PI * 0.046; g.beginPath(); g.moveTo(128, 250); g.lineTo(128 + Math.cos(b) * 250, 250 - Math.sin(b) * 250); g.stroke(); } g.fillStyle = 'rgb(170,144,104)'; g.beginPath(); g.arc(128, 250, 34, 0, 7); g.fill(); const t = doku('istiridye', c, true, false); return new THREE.MeshStandardMaterial({ name: 'istiridye', map: t, roughness: 0.92, metalness: 0 }); })(),
  karanlik: new THREE.MeshStandardMaterial({ name: 'karanlik', color: 0x0e0d0c, roughness: 1, metalness: 0 }),
  demir: new THREE.MeshStandardMaterial({ name: 'demir', color: 0x26302a, roughness: 0.6, metalness: 0.7 }),
  pirinc: new THREE.MeshStandardMaterial({ name: 'pirinc', color: 0x9a7a38, roughness: 0.45, metalness: 0.85 }),
  fener_cami: new THREE.MeshStandardMaterial({ name: 'fener_cami', color: 0xb8c4a4, emissive: 0x6a5a28, roughness: 0.25, metalness: 0, transparent: false }),
};
for (const [ad, renk] of [['kepenk_kahve', [96, 70, 48]], ['kepenk_yesil', [70, 108, 96]]]) {
  const [c, g] = tuval(256, 512), r = rng(ad.length);
  g.fillStyle = `rgb(${renk.map((v) => v * 0.7)})`; g.fillRect(0, 0, 256, 512);
  for (const x0 of [0, 128]) { for (let k = 0; k < 26; k++) { const y = 20 + k * 18; g.fillStyle = `rgb(${renk.map((v) => v * (0.9 + r() * 0.25))})`; g.fillRect(x0 + 12, y, 104, 11); g.fillStyle = 'rgba(10,8,6,0.75)'; g.fillRect(x0 + 12, y + 11, 104, 5); } g.strokeStyle = `rgb(${renk.map((v) => v * 0.55)})`; g.lineWidth = 10; g.strokeRect(x0 + 6, 8, 116, 496); }
  M[ad] = new THREE.MeshStandardMaterial({ name: ad, map: doku(ad, c, true, false), roughness: 0.85, metalness: 0 });
}
for (const k of ['oyma_tas', 'duz_tas', 'mermer', 'demir', 'pirinc', 'fener_cami', 'kepenk_kahve', 'kepenk_yesil']) M[k].side = THREE.DoubleSide;

// ---------- Yardımcılar ----------
const UP = V(0, 1, 0);
// Taş çerçeve: ön yüzü oymalı levha (kalınlık d), içinde açıklıklar. Dolgulu açıklığın arkası karanlıktır.
function cerceve(P, o) {
  const d = o.d ?? 0.16, F = yuz(V(0, 0, d), V(0, 0, 1)), y0 = o.y0 ?? 0, hw = o.w / 2;
  const ops = (o.ops || []).map((op) => ({ ...op, u0: op.u - op.w / 2, u1: op.u + op.w / 2, depth: d, fillDepth: d * 0.55, reveal: 'duz_tas', fillScale: op.fit ? undefined : op.scale ?? 0.34 }));
  cephe(P, F, o.w, [[y0, o.h, 'oyma_tas', 0.85]], ops);
  for (const s of [-1, 1]) P.quad('duz_tas', [V(s * hw, y0, 0), V(s * hw, y0, d), V(s * hw, o.h, d), V(s * hw, o.h, 0)], [[0, y0], [d, y0], [d, o.h], [0, o.h]], V(s, 0, 0));
  for (const [y, n] of [[o.h, 1], [y0, -1]]) P.quad('duz_tas', [V(-hw, y, 0), V(hw, y, 0), V(hw, y, d), V(-hw, y, d)], [[-hw, 0], [hw, 0], [hw, d], [-hw, d]], V(0, n, 0));
  for (const op of ops) if (op.fill) P.quad('karanlik', [V(op.u0, op.y0, 0.004), V(op.u1, op.y0, 0.004), V(op.u1, op.ys + (op.rise || 0), 0.004), V(op.u0, op.ys + (op.rise || 0), 0.004)], K.FLAT, V(0, 0, 1));
  return { F, ops, d };
}
// Silme: yüzden öne taşan yatay kuşak
const silme = (P, F, u0, u1, y, h = 0.07, out = 0.06, mat = 'duz_tas') => { kutu(P, F, u0, u1, y, y + h * 0.5, 0, out * 0.6, mat); kutu(P, F, u0 - 0.02, u1 + 0.02, y + h * 0.5, y + h, 0, out, mat); };
// Sütunçe: kaide, gövde, başlık
const sutun = (P, x, z, y0, y1, r = 0.05, n = 8) => halka(P, 'mermer', [[r * 1.7, y0], [r * 1.7, y0 + r * 1.2], [r * 1.25, y0 + r * 2], [r, y0 + r * 2.6], [r * 0.92, y1 - r * 3.4], [r * 1.1, y1 - r * 3], [r * 1.7, y1 - r * 1.2], [r * 1.8, y1 - r * 0.9], [r * 1.8, y1]], n, 0, 1, x, z);
// Tepelik: çerçevenin üstünde kemer biçimli alınlık
function tepelik(P, d, u0, u1, y, rise, tip) {
  const op = { u0, u1, ys: y, rise, tip }, n = 24, uc = (u0 + u1) / 2;
  for (let k = 0; k < n; k++) {
    const a = u0 + ((u1 - u0) * k) / n, b = u0 + ((u1 - u0) * (k + 1)) / n, ya = kemer(op, a), yb = kemer(op, b);
    P.tri('oyma_tas', [V(uc, y, d), V(a, ya, d), V(b, yb, d)], [[uc / 0.85, y / 0.85], [a / 0.85, ya / 0.85], [b / 0.85, yb / 0.85]], V(0, 0, 1));
    P.quad('duz_tas', [V(a, ya, 0), V(b, yb, 0), V(b, yb, d), V(a, ya, d)], K.FLAT, V(0, 1, 0));
  }
}
const konsol = (P, x, yTop, len, h = 0.3, w = 0.16) => { for (let k = 0; k < 3; k++) P.box('duz_tas', x - w / 2, x + w / 2, yTop - (h * (k + 1)) / 3, yTop - (h * k) / 3, 0, len * (1 - k * 0.3), ['+x', '-x', '+z', '-y'], 0.6, 0.6); };
// Demir korkuluk: üç yanı kapatan şeritler (saydam kesmeli desen) ve küpeşte
function korkulukDemir(P, x0, x1, z0, z1, y, h) {
  const seg = [[V(x0, y, z0), V(x0, y, z1)], [V(x0, y, z1), V(x1, y, z1)], [V(x1, y, z1), V(x1, y, z0)]];
  for (const [a, b] of seg) { const L = a.distanceTo(b), rep = Math.max(1, Math.round(L / h)); P.quad('kafes_demir', [a, b, b.clone().setY(y + h), a.clone().setY(y + h)], [[0, 0], [rep, 0], [rep, 1], [0, 1]], b.clone().sub(a).cross(UP).multiplyScalar(-1)); K.beam(P, 'demir', a.clone().setY(y + h), b.clone().setY(y + h), 0.035, 0.045); }
  for (const p of [V(x0, y, z1), V(x1, y, z1)]) { K.cyl(P, 'demir', p, p.clone().setY(y + h + 0.06), 0.022, 6); halka(P, 'demir', [[0, y + h + 0.06], [0.035, y + h + 0.09], [0, y + h + 0.13]], 6, 0, 1, p.x, p.z); }
}
// Demir çubuk: noktalar boyunca
const cubuk = (P, pts, r = 0.011, mat = 'demir') => { for (let i = 0; i + 1 < pts.length; i++) K.cyl(P, mat, pts[i], pts[i + 1], r, 5, false); };
const sarmal = (cy, cz, R, a0, a1, n = 18, shrink = 0.75) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, a = a0 + (a1 - a0) * t, rr = R * (1 - shrink * t); return V(0, cy + Math.sin(a) * rr, cz + Math.cos(a) * rr); });
// Fener gövdesi: üst askı noktasından (top) aşağı ya da tabandan (base) yukarı. n: kenar sayısı, s: ölçek
function fener(P, top, s = 1, n = 6, asili = true) {
  const x = top.x, z = top.z, y = top.y, H = (h) => y - h * s, ph = Math.PI / n;
  halka(P, 'pirinc', [[0, 0], [0.02, 0.01], [0.03, 0.05], [0.012, 0.08], [0.04, 0.11], [0.02, 0.13], [0.07, 0.17], [0.19, 0.27], [0.2, 0.29], [0.165, 0.3]].map(([r, h]) => [r * s, H(h)]), n, ph, 1, x, z); // tepe ve külah
  halka(P, 'fener_cami', [[0.16, 0.3], [0.165, 0.42], [0.12, 0.62]].map(([r, h]) => [r * s, H(h)]), n, ph, 1, x, z); // cam
  for (let k = 0; k < n; k++) { const a = ph + (k / n) * TAU, p = (r, h) => V(x + Math.sin(a) * r * s, H(h), z + Math.cos(a) * r * s); K.cyl(P, 'pirinc', p(0.165, 0.3), p(0.17, 0.42), 0.009 * s, 4, false); K.cyl(P, 'pirinc', p(0.17, 0.42), p(0.124, 0.62), 0.009 * s, 4, false); }
  halka(P, 'pirinc', [[0.165, 0.41], [0.18, 0.42], [0.165, 0.43]].map(([r, h]) => [r * s, H(h)]), n, ph, 1, x, z);
  halka(P, 'pirinc', (asili ? [[0.125, 0.62], [0.14, 0.63], [0.13, 0.66], [0.07, 0.7], [0.03, 0.74], [0.045, 0.77], [0, 0.82]] : [[0.125, 0.62], [0.14, 0.63], [0.14, 0.66], [0.05, 0.69], [0.04, 0.76], [0.09, 0.79], [0.09, 0.81], [0, 0.81]]).map(([r, h]) => [r * s, H(h)]), n, ph, 1, x, z);
}
const levha = (P, y0, y1, w = 0.09) => P.box('demir', -w / 2, w / 2, y0, y1, 0, 0.02, ['+x', '-x', '+z', '+y', '-y'], 1, 1);

// ---------- Parçalar ----------
const pen = (u, w, y0, ys, rise, tip, fill, extra = {}) => ({ u, w, y0, ys, rise, tip, fill, ...extra });
const DEFS = {
  pencere_sogan_kemerli: (P) => { const { F } = cerceve(P, { w: 1.2, h: 1.75, ops: [pen(0, 0.7, 0.3, 1.1, 0.42, 'sogan', 'kafes_yildiz')] }); tepelik(P, 0.16, -0.6, 0.6, 1.75, 0.4, 'sogan'); silme(P, F, -0.6, 0.6, 0.12); for (const s of [-1, 1]) sutun(P, s * 0.46, 0.2, 0.2, 1.14, 0.04); },
  pencere_tacli: (P) => { const { F } = cerceve(P, { w: 1.2, h: 1.55, ops: [pen(0, 0.84, 0.22, 1.35, 0, '', 'kafes_kare', { scale: 0.3 })] }); silme(P, F, -0.6, 0.6, 1.48); silme(P, F, -0.6, 0.6, 0.02); P.quad('tac', [V(-0.6, 1.55, 0.1), V(0.6, 1.55, 0.1), V(0.6, 1.93, 0.1), V(-0.6, 1.93, 0.1)], K.FLAT, V(0, 0, 1)); },
  pencere_dilimli_rozet: (P) => { const { F } = cerceve(P, { w: 1.4, h: 1.5, ops: [pen(0, 0.84, 0.3, 1.0, 0.44, 'dilimli', 'kafes_rozet', { fit: true })] }); tepelik(P, 0.16, -0.7, 0.7, 1.5, 0.6, 'dilimli'); silme(P, F, -0.7, 0.7, 0.1); for (const s of [-1, 1]) sutun(P, s * 0.52, 0.2, 0.18, 1.02, 0.04); },
  pencere_kepenkli: (P) => { const { F } = cerceve(P, { w: 0.9, h: 1.7, ops: [pen(0, 0.46, 0.38, 1.2, 0.24, 'sogan', 'kepenk_yesil', { fit: true })] }); tepelik(P, 0.16, -0.45, 0.45, 1.7, 0.42, 'sogan'); silme(P, F, -0.48, 0.48, 0.18); },
  pencere_uzun_kafesli: (P) => { const { F } = cerceve(P, { w: 0.95, h: 1.65, ops: [pen(0, 0.6, 0.25, 1.3, 0.3, 'yuvarlak', 'kafes_altigen', { scale: 0.22 })] }); tepelik(P, 0.16, -0.475, 0.475, 1.65, 0.45, 'yuvarlak'); silme(P, F, -0.5, 0.5, 0.06); for (const s of [-1, 1]) sutun(P, s * 0.38, 0.2, 0.13, 1.34, 0.035); },
  pencere_ikiz: (P) => { const { F } = cerceve(P, { w: 2.2, h: 1.8, ops: [-0.52, 0.52].map((u) => pen(u, 0.72, 0.28, 1.05, 0.42, 'sogan', 'kafes_altigen', { scale: 0.24 })) }); silme(P, F, -1.1, 1.1, 1.72); silme(P, F, -1.1, 1.1, 0.08); for (const x of [-0.96, 0, 0.96]) sutun(P, x, 0.205, 0.15, 1.09, 0.045); },
  pano_kafesli: (P) => { const { F } = cerceve(P, { w: 1.1, h: 1.5, d: 0.12, ops: [pen(0, 0.78, 0.2, 1.3, 0, '', 'kafes_yildiz', { scale: 0.26 })] }); silme(P, F, -0.55, 0.55, 1.43, 0.07, 0.04); P.quad('oyma_tas', [V(-0.2, 0.42, 0.07), V(0.2, 0.42, 0.07), V(0.2, 0.84, 0.07), V(-0.2, 0.84, 0.07)], K.FLAT, V(0, 0, 1)); tepelik(P, 0.07, -0.2, 0.2, 0.84, 0.22, 'sogan'); },
  nis_istiridye: (P) => { const { F } = cerceve(P, { w: 1.0, h: 1.75, ops: [pen(0, 0.62, 0.25, 0.92, 0, '', 'kafes_kare', { scale: 0.28 }), pen(0, 0.62, 1.06, 1.06, 0.5, 'yuvarlak', 'istiridye', { fit: true })] }); tepelik(P, 0.16, -0.5, 0.5, 1.75, 0.3, 'sogan'); silme(P, F, -0.5, 0.5, 0.96, 0.08, 0.05); silme(P, F, -0.52, 0.52, 0.08); },
  kapi_sutunlu: (P) => { const { F } = cerceve(P, { w: 1.9, h: 2.8, d: 0.22, ops: [pen(0, 1.1, 0, 1.7, 0.62, 'sogan', null)] }); silme(P, F, -0.95, 0.95, 2.72, 0.08, 0.07); for (const s of [-1, 1]) { sutun(P, s * 0.68, 0.33, 0, 1.72, 0.085, 10); P.box('duz_tas', s * 0.68 - 0.16, s * 0.68 + 0.16, 1.72, 1.8, 0.22, 0.5, ['+x', '-x', '+z', '+y', '-y'], 0.6, 0.6); } },
  kapi_dilimli: (P) => { const { F } = cerceve(P, { w: 2.0, h: 2.05, d: 0.22, ops: [pen(0, 1.14, 0, 1.12, 0.55, 'dilimli', null)] }); silme(P, F, -1.0, 1.0, 1.97, 0.08, 0.07); for (const s of [-1, 1]) { sutun(P, s * 0.72, 0.33, 0, 1.12, 0.09, 10); P.box('duz_tas', s * 0.72 - 0.17, s * 0.72 + 0.17, 1.12, 1.2, 0.22, 0.52, ['+x', '-x', '+z', '+y', '-y'], 0.6, 0.6); } },
  revak_uc_kemerli: (P) => { const us = [-0.6, 0, 0.6], { F } = cerceve(P, { w: 1.9, h: 1.5, d: 0.2, ops: us.map((u) => pen(u, 0.44, 0.14, 0.86, 0.26, 'sogan', null)) }); silme(P, F, -0.95, 0.95, 1.42); silme(P, F, -0.97, 0.97, 0.0, 0.1, 0.07); for (const u of us) P.quad('korkuluk', [V(u - 0.22, 0.14, 0.1), V(u + 0.22, 0.14, 0.1), V(u + 0.22, 0.52, 0.1), V(u - 0.22, 0.52, 0.1)], [[0, 0], [1, 0], [1, 1], [0, 1]], V(0, 0, 1)); for (const x of [-0.3, 0.3]) sutun(P, x, 0.24, 0.14, 0.9, 0.04); },
  // Cumba: duvardan 0,5 m çıkar; üç kemerli kepenkli pencere, altında kafesli korkuluk panoları, konsollar
  cumba_uc_kemerli: (P) => {
    const us = [-0.82, 0, 0.82], D = 0.5, y0 = 0.35;
    const { F } = cerceve(P, { w: 2.7, h: 2.5, d: D, y0, ops: [...us.map((u) => pen(u, 0.6, 1.2, 1.85, 0.3, 'sogan', 'kepenk_kahve', { fit: true })), ...us.map((u) => pen(u, 0.6, 0.55, 1.02, 0, '', 'kafes_kare', { scale: 0.22 }))].map((o) => ({ ...o })) });
    silme(P, F, -1.35, 1.35, 2.4, 0.1, 0.1); silme(P, F, -1.35, 1.35, 1.06, 0.07, 0.05); silme(P, F, -1.37, 1.37, y0, 0.1, 0.08);
    for (const x of [-1.24, -0.41, 0.41, 1.24]) sutun(P, x, D + 0.045, 1.13, 2.2, 0.04);
    for (const x of [-1.15, 0, 1.15]) konsol(P, x, y0, D, 0.35);
  },
  balkon_demir: (P) => { P.box('duz_tas', -1.2, 1.2, 0.3, 0.42, 0, 0.7, ['+x', '-x', '+z', '+y', '-y'], 0.8, 0.8); P.box('duz_tas', -1.24, 1.24, 0.42, 0.47, 0, 0.74, ['+x', '-x', '+z', '+y', '-y'], 0.8, 0.8); for (const x of [-0.95, 0.95]) konsol(P, x, 0.3, 0.6, 0.3, 0.2); korkulukDemir(P, -1.16, 1.16, 0.02, 0.68, 0.47, 0.95); },
  balkon_kepenkli: (P) => {
    P.box('duz_tas', -0.85, 0.85, 0.28, 0.4, 0, 0.6, ['+x', '-x', '+z', '+y', '-y'], 0.8, 0.8);
    for (const x of [-0.65, 0.65]) konsol(P, x, 0.28, 0.5, 0.28, 0.16);
    korkulukDemir(P, -0.8, 0.8, 0.02, 0.56, 0.4, 0.75);
    const Q = xfP(P, 0, 0.4);
    const { F } = cerceve(Q, { w: 1.2, h: 1.55, d: 0.14, ops: [pen(0, 0.8, 0.02, 1.2, 0, '', 'kepenk_kahve', { fit: true })] });
    silme(Q, F, -0.62, 0.62, 1.46, 0.09, 0.07);
  },
  rozet_yildiz: (P) => { P.quad('rozet_yildiz', [V(-0.55, 0, 0.05), V(0.55, 0, 0.05), V(0.55, 1.1, 0.05), V(-0.55, 1.1, 0.05)], K.FLAT, V(0, 0, 1)); P.quad('karanlik', [V(-0.4, 0.15, 0.004), V(0.4, 0.15, 0.004), V(0.4, 0.95, 0.004), V(-0.4, 0.95, 0.004)], K.FLAT, V(0, 0, 1)); },
  // Demir konsol: duvar levhası, yatay kol ve altında sarmallar (orijin levhanın ortasında)
  konsol_demir: (P) => { levha(P, -0.45, 0.45); cubuk(P, [V(0, 0.3, 0.02), V(0, 0.3, 0.62)], 0.014); cubuk(P, sarmal(0.02, 0.3, 0.27, Math.PI / 2, Math.PI / 2 + 5.4)); cubuk(P, sarmal(-0.26, 0.14, 0.15, -Math.PI / 2, -Math.PI / 2 - 5)); cubuk(P, sarmal(0.36, 0.62, 0.06, -Math.PI / 2, -Math.PI / 2 + 5, 12)); },
  // Fenerler (orijin duvar levhasının ortasında; asma fenerde askı halkasında)
  fener_konsollu: (P) => { levha(P, -0.2, 0.2, 0.08); cubuk(P, [V(0, 0.12, 0.02), V(0, 0.16, 0.5)], 0.013); cubuk(P, sarmal(-0.02, 0.24, 0.17, Math.PI / 2, Math.PI / 2 + 5)); cubuk(P, sarmal(0.2, 0.5, 0.045, -Math.PI / 2, -Math.PI / 2 + 5, 10)); cubuk(P, [V(0, 0.16, 0.44), V(0, 0.04, 0.44)], 0.006); fener(P, V(0, 0.04, 0.44), 0.95, 6); },
  fener_duvar: (P) => { levha(P, -0.3, 0.3, 0.1); cubuk(P, sarmal(-0.02, 0.2, 0.2, Math.PI, Math.PI + 4.8)); cubuk(P, [V(0, -0.02, 0.02), V(0, -0.02, 0.36)], 0.014); cubuk(P, sarmal(0.22, 0.12, 0.09, 0, 5, 12)); fener(P, V(0, 0.8, 0.36), 1.0, 6, false); },
  fener_kivrik: (P) => { levha(P, -0.42, 0.42, 0.08); const arc = Array.from({ length: 15 }, (_, i) => { const a = -0.5 + (i / 14) * 2.9; return V(0, 0.05 + Math.sin(a) * 0.36, 0.3 - Math.cos(a) * 0.29); }); cubuk(P, arc, 0.013); cubuk(P, sarmal(-0.1, 0.16, 0.13, Math.PI / 2, Math.PI / 2 + 5)); const tip = arc[14]; cubuk(P, [tip, tip.clone().setY(tip.y - 0.1)], 0.006); fener(P, tip.clone().setY(tip.y - 0.1), 0.9, 6); },
  fener_asma: (P) => { cubuk(P, Array.from({ length: 9 }, (_, i) => V(Math.cos((i / 8) * TAU) * 0.03, -0.03 + Math.sin((i / 8) * TAU) * 0.03, 0)), 0.006, 'pirinc'); for (let k = 0; k < 6; k++) cubuk(P, [V(0, -0.06 - k * 0.05, 0), V(k % 2 ? 0.012 : -0.012, -0.11 - k * 0.05, 0)], 0.006, 'pirinc'); fener(P, V(0, -0.36, 0), 1.0, 6); },
  fener_buyuk: (P) => { levha(P, -0.3, 0.3, 0.1); cubuk(P, [V(0, 0.22, 0.02), V(0, 0.26, 0.62)], 0.016); cubuk(P, sarmal(0.02, 0.3, 0.24, Math.PI / 2, Math.PI / 2 + 5.2)); cubuk(P, [V(0, 0.26, 0.56), V(0, 0.12, 0.56)], 0.007); fener(P, V(0, 0.12, 0.56), 1.35, 8); },
};
// Parçayı (x, y) kadar kaydırarak kurmak için vekil
function xfP(P, dx, dy) { const f = (v) => V(v.x + dx, v.y + dy, v.z); return { quad: (m, pts, uv, h) => P.quad(m, pts.map(f), uv, h), tri: (m, pts, uv, h) => P.tri(m, pts.map(f), uv, h), box: (m, x0, x1, y0, y1, z0, z1, ...r) => P.box(m, x0 + dx, x1 + dx, y0 + dy, y1 + dy, z0, z1, ...r) }; }
export const MIMARI_PARCALAR = Object.keys(DEFS);
export function createMimariParca(name) {
  const p = new Part(name);
  DEFS[name](p);
  const mesh = p.mesh(M);
  mesh.name = name;
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
export function createMimariKit() {
  const root = new THREE.Group();
  root.name = 'mimari_susleme_kiti';
  // Duvar levhası düzeni: parçalar aynı düzlemde, satır satır (resimdeki gibi)
  MIMARI_PARCALAR.forEach((n, i) => { const m = createMimariParca(n); m.position.set((i % 6 - 2.5) * 3.2, (3 - Math.floor(i / 6)) * 3.3 + (n.startsWith('fener') || n === 'konsol_demir' ? 1.3 : 0), 0); root.add(m); });
  return root;
}
