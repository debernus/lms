import * as THREE from 'three';
import * as K from './kit_ortak.js';
const { V, TAU, Part } = K;

// Savaş harabeleri kiti (1915 cephesi): 36 parça. Metre, Y yukarı; ön yüz +Z; orijin alt ön kenarın ortasında, yer hizasında
// (asılı parçalarda asıldığı / döndüğü noktada; hazır harabelerde zemin ortasında). Duvar modülü 3,00 × 3,00 × 0,50 m:
// ön yüz z = 0, gövde z -0,5 … 0; iki yan kenar düz. Basılan yüzeyler düz ve yatay.
// İşaretler (yalnız bunlarda kullanılır): kirec_silme = tutunulan kenar, pas_turuncu = tutunulan demir, halat + kirmizi_bez = ip.
const hsh = (a, b, c) => { let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(c, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const c3 = (r, g, b, a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;
const is = (g, w, h, r, k = 1) => { // is, kurşun izleri, çatlaklar
  for (let i = 0; i < 9 * k; i++) { const x = r() * w, y = r() * h, ww = 30 + r() * 110, L = 120 + r() * 300, gr = g.createLinearGradient(0, y - L, 0, y); gr.addColorStop(0, c3(8, 8, 8, 0)); gr.addColorStop(1, c3(8, 8, 8, 0.55 + r() * 0.3)); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y - L / 2, ww / 2, L / 2, 0, 0, 7); g.fill(); }
  for (let i = 0; i < 26 * k; i++) { const cx = r() * w, cy = r() * h; for (let q = 0; q < 5; q++) { const x = cx + (r() - 0.5) * 70, y = cy + (r() - 0.5) * 50, s = 3 + r() * 6; g.fillStyle = c3(190, 180, 160, 0.5); g.beginPath(); g.arc(x, y, s + 2, 0, 7); g.fill(); g.fillStyle = c3(12, 10, 8, 0.9); g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); } }
  for (let i = 0; i < 7 * k; i++) { g.strokeStyle = c3(10, 9, 8, 0.8); g.lineWidth = 1 + r() * 2; g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let q = 0; q < 10; q++) { x += (r() - 0.5) * 50; y += (r() - 0.3) * 40; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 3000; i++) { g.fillStyle = r() < 0.6 ? c3(10, 10, 10, r() * 0.2) : c3(200, 190, 170, r() * 0.08); g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 3); }
};
const tugla = (g, x0, y0, x1, y1, r) => { g.fillStyle = '#4e4840'; g.fillRect(x0, y0, x1 - x0, y1 - y0); for (let y = y0, row = 0; y < y1; y += 14, row++) for (let x = x0 - (row % 2 ? 20 : 0); x < x1; x += 40) { const v = 0.75 + r() * 0.4; g.fillStyle = c3(88 * v, 74 * v, 66 * v); g.fillRect(x + 1, y + 1, 38, 12); } };
const ahsapP = (base, yanik) => (g, w, h, r) => { g.fillStyle = c3(...base.map((v) => v * 0.4)); g.fillRect(0, 0, w, h); for (let k = 0; k < 8; k++) { const v = 0.8 + r() * 0.4; g.fillStyle = c3(base[0] * v, base[1] * v, base[2] * v); g.fillRect(0, (k * h) / 8 + 1, w, h / 8 - 3); for (let i = 0; i < 30; i++) { g.strokeStyle = r() < 0.5 ? c3(10, 8, 6, 0.5) : c3(160, 140, 110, 0.2); g.lineWidth = 1; const y = (k * h) / 8 + 2 + r() * (h / 8 - 5); g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + (r() - 0.5) * 4); g.stroke(); } } for (let i = 0; i < 60 * yanik; i++) { g.fillStyle = c3(8, 7, 6, 0.3 + r() * 0.5); g.beginPath(); g.ellipse(r() * w, r() * h, 20 + r() * 90, 10 + r() * 40, r() * 3, 0, 7); g.fill(); } for (let i = 0; i < 300 * yanik; i++) { g.strokeStyle = c3(60, 56, 52, 0.4); g.lineWidth = 1; const x = r() * w, y = r() * h; g.strokeRect(x, y, 6 + r() * 14, 5 + r() * 10); } };
const M = K.materials('harabe', {
  tas_isli: [(g, w, h, r) => { g.fillStyle = '#3c3830'; g.fillRect(0, 0, w, h); for (let k = 0; k < 420; k++) { const x = r() * w, y = r() * h, R = 14 + r() * 24, v = 0.75 + r() * 0.4; g.fillStyle = c3(112 * v, 104 * v, 92 * v); for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { g.beginPath(); for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU + k, m = R * (0.7 + ((i * 37 + k * 13) % 10) / 22); g.lineTo(x + dx + Math.cos(a) * m * 1.25, y + dy + Math.sin(a) * m * 0.8); } g.closePath(); g.fill(); g.strokeStyle = c3(26, 24, 20, 0.7); g.lineWidth = 2; g.stroke(); } } for (let k = 0; k < 5; k++) { const x = r() * w, y = r() * h, R = 36 + r() * 60, pts = Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * TAU, m = R * (0.6 + r() * 0.6); return [x + Math.cos(a) * m * 1.3, y + Math.sin(a) * m]; }); g.save(); g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.clip(); tugla(g, x - R * 2, y - R * 2, x + R * 2, y + R * 2, r); g.restore(); g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px + 8, py - 10) : g.moveTo(px + 8, py - 10))); g.closePath(); g.fillStyle = c3(122, 116, 104, 0.8); if (k % 2) g.fill(); } is(g, w, h, r, 1.2); }, 1024, 1024],
  tugla_kirik: [(g, w, h, r) => { tugla(g, 0, 0, w, h, r); is(g, w, h, r, 0.6); }, 512, 512],
  tas_blok: [(g, w, h, r) => { g.fillStyle = '#34302a'; g.fillRect(0, 0, w, h); for (let row = 0; row < 6; row++) { let x = -r() * 60; while (x < w) { const bw = 90 + r() * 110, v = 0.8 + r() * 0.3; g.fillStyle = c3(124 * v, 118 * v, 106 * v); g.fillRect(x + 2, (row * h) / 6 + 2, bw - 4, h / 6 - 4); x += bw; } } is(g, w, h, r, 0.8); }, 512, 512],
  kirec_silme: [(g, w, h, r) => { g.fillStyle = '#e6dcc0'; g.fillRect(0, 0, w, h); for (let i = 0; i < 600; i++) { g.fillStyle = r() < 0.5 ? c3(190, 178, 148, r() * 0.3) : c3(250, 246, 230, r() * 0.3); g.fillRect(r() * w, r() * h, 2 + r() * 10, 1 + r() * 3); } for (let x = 0; x < w; x += 128) { g.fillStyle = c3(150, 138, 112, 0.6); g.fillRect(x, 0, 2, h); } }, 256, 256],
  pas_turuncu: [(g, w, h, r) => { g.fillStyle = '#c4621c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { g.fillStyle = r() < 0.5 ? c3(224, 130, 40, 0.35) : c3(120, 52, 16, 0.35); g.beginPath(); g.ellipse(r() * w, r() * h, 2 + r() * 12, 2 + r() * 8, 0, 0, 7); g.fill(); } }, 256, 256],
  ahsap_yanik: [ahsapP([58, 46, 36], 1.6), 512, 512], doseme_tahtasi: [ahsapP([104, 92, 76], 0.25), 512, 512],
  kiremit: [(g, w, h, r) => { g.fillStyle = '#2e241e'; g.fillRect(0, 0, w, h); for (let row = 0; row < 10; row++) for (let q = 0; q < 12; q++) { const x = (q / 12) * w, y = (row / 10) * h, v = 0.7 + r() * 0.45, gr = g.createLinearGradient(x, 0, x + w / 12, 0); gr.addColorStop(0, c3(62 * v, 50 * v, 46 * v)); gr.addColorStop(0.5, c3(104 * v, 80 * v, 70 * v)); gr.addColorStop(1, c3(64 * v, 52 * v, 48 * v)); g.fillStyle = gr; g.fillRect(x + 1, y, w / 12 - 2, h / 10 - 3); } is(g, w, h, r, 0.5); }, 512, 512],
  halat: [(g, w, h) => { g.fillStyle = '#c9b680'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8f7c4c'; g.lineWidth = 5; for (let k = -10; k < 30; k++) { g.beginPath(); g.moveTo(0, k * 16); g.lineTo(w, k * 16 + 40); g.stroke(); } }, 64, 256],
  toprak: [(g, w, h, r) => { g.fillStyle = '#4a4034'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { g.fillStyle = r() < 0.5 ? c3(24, 20, 16, r() * 0.4) : c3(120, 106, 86, r() * 0.3); g.beginPath(); g.ellipse(r() * w, r() * h, 1 + r() * 6, 1 + r() * 4, 0, 0, 7); g.fill(); } }, 512, 512],
  kirmizi_bez: 0xa84a40, demir_koyu: 0x24211e, is_kara: 0x0e0d0c,
});
for (const m of Object.values(M)) {
  m.side = THREE.DoubleSide; m.roughness = 0.95;
  if (!m.map) continue;
  const c = m.map.image, w = c.width, h = c.height, src = c.getContext('2d').getImageData(0, 0, w, h).data, o = document.createElement('canvas'); o.width = w; o.height = h;
  const g = o.getContext('2d'), out = g.createImageData(w, h), L = (x, y) => { const i = (((y + h) % h) * w + ((x + w) % w)) * 4; return (src[i] + src[i + 1] * 2 + src[i + 2]) / 1020; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = (L(x + 1, y) - L(x - 1, y)) * 2.5, dy = (L(x, y + 1) - L(x, y - 1)) * 2.5, l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4; out.data[i] = (-dx / l * 0.5 + 0.5) * 255; out.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; out.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; out.data[i + 3] = 255; }
  g.putImageData(out, 0, 0);
  m.normalMap = new THREE.CanvasTexture(o); m.normalMap.name = m.name + '_kabartma'; m.normalMap.wrapS = m.normalMap.wrapT = THREE.RepeatWrapping; m.normalMap.colorSpace = THREE.NoColorSpace;
}

// ---------- Yardımcılar ----------
const UP = V(0, 1, 0), XX = V(1, 0, 0), ZZ = V(0, 0, 1);
const fr = (O, R, N) => ({ O, R, N, pt: (u, y, d = 0) => O.clone().addScaledVector(R, u).addScaledVector(N, d).setY(O.y + y) });
const F0 = fr(V(0, 0, 0), XX, ZZ);
// Blok duvar: pres(u, y) doluysa hücre var. Ön yüz d = 0, gövde d -t … 0. Kırık yüzler tuğla.
function vox(P, F, o, pres = () => true) {
  const c = o.cell ?? 0.25, t = o.t ?? 0.5, nx = Math.round(o.len / c), y0 = o.y0 ?? 0, ny = Math.round((o.h - y0) / c), u0 = -o.len / 2, mat = o.mat || 'tas_isli', kir = 'tugla_kirik';
  const G = Array.from({ length: nx }, (_, i) => Array.from({ length: ny }, (_, j) => !!pres(u0 + (i + 0.5) * c, y0 + (j + 0.5) * c, i, j)));
  const has = (i, j) => i >= 0 && i < nx && j >= 0 && j < ny && G[i][j];
  const q = (m, pts, n, uv) => P.quad(m, pts.map(([u, y, d]) => F.pt(u, y, d)), uv, n), nN = F.N.clone().negate(), nR = F.R.clone().negate();
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    if (!G[i][j]) continue;
    const ua = u0 + i * c, ub = ua + c, ya = y0 + j * c, yb = ya + c, uv = [[ua / 3, ya / 3], [ub / 3, ya / 3], [ub / 3, yb / 3], [ua / 3, yb / 3]], sv = [[0, ya / 1.5], [t / 1.5, ya / 1.5], [t / 1.5, yb / 1.5], [0, yb / 1.5]], tv = [[ua / 1.5, 0], [ub / 1.5, 0], [ub / 1.5, t / 1.5], [ua / 1.5, t / 1.5]];
    q(mat, [[ua, ya, 0], [ub, ya, 0], [ub, yb, 0], [ua, yb, 0]], F.N, uv);
    q(mat, [[ua, ya, -t], [ub, ya, -t], [ub, yb, -t], [ua, yb, -t]], nN, uv.map(([a, b]) => [a + 0.37, b + 0.21]));
    if (!has(i - 1, j)) q(i === 0 ? mat : kir, [[ua, ya, -t], [ua, ya, 0], [ua, yb, 0], [ua, yb, -t]], nR, sv);
    if (!has(i + 1, j)) q(i === nx - 1 ? mat : kir, [[ub, ya, -t], [ub, ya, 0], [ub, yb, 0], [ub, yb, -t]], F.R, sv);
    if (!has(i, j + 1)) q(j === ny - 1 ? mat : kir, [[ua, yb, -t], [ub, yb, -t], [ub, yb, 0], [ua, yb, 0]], UP, tv);
    if (!has(i, j - 1)) q(j === 0 ? mat : kir, [[ua, ya, -t], [ub, ya, -t], [ub, ya, 0], [ua, ya, 0]], V(0, -1, 0), tv);
  }
}
function kut(P, mat, F, u0, u1, y0, y1, d0, d1, s = 1.5) { // çerçeveye göre kutu
  const p = (u, y, d) => F.pt(u, y, d), f = (pts, n, uv) => P.quad(mat, pts, uv, n);
  f([p(u0, y0, d1), p(u1, y0, d1), p(u1, y1, d1), p(u0, y1, d1)], F.N, [[u0 / s, y0 / s], [u1 / s, y0 / s], [u1 / s, y1 / s], [u0 / s, y1 / s]]);
  f([p(u0, y0, d0), p(u1, y0, d0), p(u1, y1, d0), p(u0, y1, d0)], F.N.clone().negate(), [[u0 / s, y0 / s], [u1 / s, y0 / s], [u1 / s, y1 / s], [u0 / s, y1 / s]]);
  for (const [u, n] of [[u0, F.R.clone().negate()], [u1, F.R]]) f([p(u, y0, d0), p(u, y0, d1), p(u, y1, d1), p(u, y1, d0)], n, [[d0 / s, y0 / s], [d1 / s, y0 / s], [d1 / s, y1 / s], [d0 / s, y1 / s]]);
  for (const [y, n] of [[y0, V(0, -1, 0)], [y1, UP]]) f([p(u0, y, d0), p(u1, y, d0), p(u1, y, d1), p(u0, y, d1)], n, [[u0 / s, d0 / s], [u1 / s, d0 / s], [u1 / s, d1 / s], [u0 / s, d1 / s]]);
}
const kw = (P, mat, x0, x1, y0, y1, z0, z1, s) => kut(P, mat, F0, x0, x1, y0, y1, z0, z1, s);
const silme = (P, x0, x1, yTop, z0, z1) => kw(P, 'kirec_silme', x0, x1, yTop - 0.15, yTop, z0, z1);
const kiymik = (P, a, dir, n = 5, s = 1) => { for (let k = 0; k < n; k++) { const o = V((hsh(k, 1, n) - 0.5) * 0.2, (hsh(k, 2, n) - 0.5) * 0.2, (hsh(k, 3, n) - 0.5) * 0.2).multiplyScalar(s); K.beam(P, 'ahsap_yanik', a.clone().add(o), a.clone().add(o).addScaledVector(dir, (0.15 + hsh(k, 4, n) * 0.4) * s).add(o), 0.05 * s, 0.04 * s); } };
const moloz = (P, cx, cz, rad, n, seed, y0 = 0, hmax = 0.4) => { for (let k = 0; k < n; k++) { const a = hsh(k, 1, seed) * TAU, d = hsh(k, 2, seed) ** 0.7 * rad, s = 0.12 + hsh(k, 3, seed) * 0.26, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, h = s * (0.5 + hsh(k, 4, seed)) * (hmax / 0.4), F = fr(V(x, y0, z), V(Math.cos(a * 3), 0, Math.sin(a * 3)), V(-Math.sin(a * 3), 0, Math.cos(a * 3))); kut(P, ['tas_blok', 'tugla_kirik', 'tas_isli'][k % 3], F, -s, s, 0, h, -s * 0.7, s * 0.7); } };
const basamak = (P, F, u0, u1, n, rise, run, mat = 'tas_blok') => { for (let k = 0; k < n; k++) kut(P, mat, F, u0, u1, 0, (k + 1) * rise, -(k + 1) * run, -k * run); };
const halatCiz = (P, a, b, r = 0.025) => K.cyl(P, 'halat', a, b, r, 6, true);
const dugum = (P, c, r = 0.07) => { for (let k = 0; k < 3; k++) K.cyl(P, 'halat', c.clone().add(V(0, r * (0.9 - k * 0.9), 0)), c.clone().add(V(0, r * (0.9 - k * 0.9) - r * 0.8, 0)), r * (k === 1 ? 1.25 : 0.9), 6); };
const bez = (P, c) => { for (const [dx, dz] of [[0.16, 0.03], [-0.05, 0.14]]) P.quad('kirmizi_bez', [c.clone().add(V(0, 0.04, 0)), c.clone().add(V(0, -0.04, 0)), c.clone().add(V(dx * 1.1, -0.26, dz * 1.1)), c.clone().add(V(dx, 0.02, dz))], K.FLAT, V(dz, 0, -dx)); K.cyl(P, 'kirmizi_bez', c.clone().add(V(0, -0.05, 0)), c.clone().add(V(0, 0.05, 0)), 0.035, 6, false); };
const halka = (P, c, r = 0.09) => { const pts = Array.from({ length: 9 }, (_, k) => c.clone().add(V(Math.cos((k / 8) * TAU) * r, Math.sin((k / 8) * TAU) * r - r, 0))); for (let k = 0; k < 8; k++) K.cyl(P, 'pas_turuncu', pts[k], pts[k + 1], 0.014, 5, false); };

// ---------- Parçalar: (mk) => ...; mk(ad) o adda bir düğüm (Part) açar ----------
const tek = (f) => (mk, ad) => f(mk(ad));
const DEFS = {
  // 1) Duvar parçaları
  duvar_saglam: tek((P) => vox(P, F0, { len: 3, h: 3 })),
  duvar_pencere: tek((P) => { vox(P, F0, { len: 3, h: 3 }, (u, y) => !(Math.abs(u) < 0.5 && y > 1.0 && y < 2.4)); for (const [a, b] of [[V(-0.5, 1.0, -0.25), V(-0.5, 2.4, -0.25)], [V(-0.5, 2.4, -0.25), V(0.2, 2.4, -0.25)], [V(-0.5, 1.02, -0.25), V(0.5, 1.02, -0.25)], [V(0.5, 1.0, -0.25), V(0.5, 1.6, -0.25)]]) K.beam(P, 'ahsap_yanik', a, b, 0.08, 0.1); kiymik(P, V(0.5, 1.6, -0.25), UP, 4); kiymik(P, V(0.2, 2.4, -0.25), XX, 3); }),
  duvar_kapi: tek((P) => { vox(P, F0, { len: 3, h: 3 }, (u, y) => !(Math.abs(u) < 0.55 && y < 2.1)); kw(P, 'tas_blok', -0.85, 0.85, 2.1, 2.35, -0.52, 0.03); P.quad('is_kara', [V(-0.9, 2.36, 0.012), V(0.9, 2.36, 0.012), V(0.6, 2.95, 0.012), V(-0.5, 2.9, 0.012)], K.FLAT, ZZ); }),
  duvar_top_deligi: tek((P) => vox(P, F0, { len: 3, h: 3 }, (u, y, i, j) => Math.hypot(u, (y - 1.65) * 1.0) > 0.72 + 0.1 * hsh(i, j, 3))),
  duvar_yarim_silmeli: tek((P) => { vox(P, F0, { len: 3, h: 3 }, (u, y, i) => (u > 0 ? y < 1.65 : y < 3 - 0.25 * Math.floor(hsh(i, 7, 1) * 3) - (u > -0.5 ? 0.5 : 0))); silme(P, 0, 1.5, 1.8, -0.5, 0.3); }),
  duvar_alcak: tek((P) => { vox(P, F0, { len: 3, h: 0.9, cell: 0.3 }); for (const x of [-1.3, 1.25]) kw(P, 'tugla_kirik', x - 0.12, x + 0.12, 0.9, 0.98, -0.3, -0.12); }),
  // Köşe: ön kol x -1,5 … 1,5 (ön yüz z = 0); yan kol sağ uçtan geriye, z 0 … -3 (dış yüzü x = 1,5)
  duvar_kose: tek((P) => { vox(P, F0, { len: 3, h: 3 }); vox(P, fr(V(1.5, 0, -1.75), V(0, 0, -1), XX), { len: 2.5, h: 3 }); }),
  duvar_kose_yikik: tek((P) => { const st = (d) => 3 - 0.5 * Math.floor(Math.min(4, d / 0.6)); vox(P, F0, { len: 3, h: 3 }, (u, y) => y < st(1.5 - u)); vox(P, fr(V(1.5, 0, -1.75), V(0, 0, -1), XX), { len: 2.5, h: 3 }, (u, y) => y < st(u + 1.25 + 0.5)); }),
  duvar_silmeli: tek((P) => { vox(P, F0, { len: 3, h: 3 }); silme(P, -1.5, 1.5, 2.0, 0, 0.3); }),
  duvar_ust_silmeli: tek((P) => { vox(P, F0, { len: 3, h: 2.75 }); kw(P, 'tas_isli', -1.5, 1.5, 2.75, 2.85, -0.5, 0, 3); silme(P, -1.5, 1.5, 3.0, -0.5, 0.2); }),
  // 2) Döşeme, kiriş, çatı
  doseme_3x3: tek((P) => { kw(P, 'doseme_tahtasi', -1.5, 1.5, -0.06, 0, -1.5, 1.5, 1.2); for (const z of [-1.3, -0.65, 0, 0.65, 1.3]) kw(P, 'ahsap_yanik', -1.5, 1.5, -0.3, -0.06, z - 0.09, z + 0.09); }),
  doseme_kirik: tek((P) => { for (let k = 0; k < 12; k++) { const z = -1.5 + k * 0.25, x1 = 0.75 + (-0.9 + (k / 11) * 1.8) + (hsh(k, 1, 5) - 0.5) * 0.5; kw(P, 'doseme_tahtasi', -0.75, Math.max(-0.4, x1), -0.06, 0, z, z + 0.24, 1.2); } for (const [z, x1] of [[-1.3, -0.1], [-0.65, 0.5], [0, 1.0], [0.65, 1.5], [1.3, 2.0]]) { kw(P, 'ahsap_yanik', -0.75, x1, -0.3, -0.06, z - 0.09, z + 0.09); kiymik(P, V(x1, -0.18, z), XX, 4); } }),
  doseme_sarkan: tek((P) => { const a = (35 * Math.PI) / 180, d = V(0, -Math.sin(a), Math.cos(a)), n = V(0, Math.cos(a), Math.sin(a)); for (let k = 0; k < 10; k++) { const x = -1.5 + (k + 0.5) * 0.3, L = 2 - hsh(k, 2, 9) * 0.7; K.beam(P, 'doseme_tahtasi', V(x, 0, 0), V(x, 0, 0).addScaledVector(d, L), 0.05, 0.28); } for (const x of [-1.3, -0.45, 0.45, 1.3]) { const a0 = V(x, 0, 0).addScaledVector(n, -0.15), b0 = a0.clone().addScaledVector(d, 2.05); K.beam(P, 'ahsap_yanik', a0, b0, 0.22, 0.16); kiymik(P, b0, d, 3); } K.beam(P, 'ahsap_yanik', V(-1.5, -0.15, -0.12), V(1.5, -0.15, -0.12), 0.3, 0.22); }),
  kiris_4m: tek((P) => { kw(P, 'ahsap_yanik', -2, 2, -0.3, 0, -0.15, 0.15); for (const s of [-1, 1]) kiymik(P, V(s * 2, -0.15, 0), V(s, 0, 0), 6); }),
  kiris_6m: tek((P) => { kw(P, 'ahsap_yanik', -3, 3, -0.3, 0, -0.15, 0.15); for (const s of [-1, 1]) kiymik(P, V(s * 3, -0.15, 0), V(s, 0, 0), 6); }),
  konsol_kiris: tek((P) => { kw(P, 'ahsap_yanik', -0.125, 0.125, -0.25, 0, -0.3, 2.0); kiymik(P, V(0, -0.12, 2.0), ZZ, 6); vox(P, fr(V(0, -0.75, 0), XX, ZZ), { len: 1.0, h: 1.25, y0: 0 }, (u, y, i, j) => Math.hypot(u, y - 0.6) < 0.5 + 0.12 * hsh(i, j, 4)); }),
  cati_kalintisi: tek((P) => { const a = Math.PI / 6, d = V(0, Math.sin(a), -Math.cos(a)), n = V(0, Math.cos(a), Math.sin(a)); for (let k = 0; k < 6; k++) { const x = -1.4 + k * 0.56, L = 3.2 - hsh(k, 3, 2) * 0.6; K.beam(P, 'ahsap_yanik', V(x, 0, 0), V(x, 0, 0).addScaledVector(d, L), 0.14, 0.1); kiymik(P, V(x, 0, 0).addScaledVector(d, L), d, 3); } for (const t of [0.4, 1.4, 2.4]) K.beam(P, 'ahsap_yanik', V(-1.5, 0, 0).addScaledVector(d, t).addScaledVector(n, 0.09), V(1.5, 0, 0).addScaledVector(d, t).addScaledVector(n, 0.09), 0.05, 0.07); for (let i = 0; i < 6; i++) for (let j = 0; j < 8; j++) { if (hsh(i >> 1, j >> 1, 6) * 0.6 + hsh(i, j, 7) * 0.4 < 0.2 + (i / 6) * 0.5) continue; const p = (x, t) => V(x, 0, 0).addScaledVector(d, t).addScaledVector(n, 0.13); P.quad('kiremit', [p(-1.5 + i * 0.5, j * 0.4), p(-1 + i * 0.5, j * 0.4), p(-1 + i * 0.5, j * 0.4 + 0.4), p(-1.5 + i * 0.5, j * 0.4 + 0.4)], [[i / 4, j / 5], [(i + 1) / 4, j / 5], [(i + 1) / 4, (j + 1) / 5], [i / 4, (j + 1) / 5]], n); } }),
  // 3) Merdiven ve moloz
  merdiven_tas_kirik: tek((P) => { basamak(P, F0, -0.6, 0.6, 10, 0.2, 0.3); vox(P, fr(V(1.1, 0, -2.25), V(0, 0, -1), XX), { len: 4.5, h: 3.5 }, (u, y, i) => y < (u < 0.3 ? 2.75 + 0.25 * Math.floor(hsh(i >> 1, 2, 2) * 3) : 3.4 - (u - 0.3) * 1.1)); moloz(P, 0, -3.4, 0.5, 6, 8, 0, 0.5); }),
  merdiven_ahsap: tek((P) => { for (const s of [-1, 1]) K.beam(P, 'doseme_tahtasi', V(s * 0.25, 0, 0), V(s * 0.25, 4, 0), 0.05, 0.07); for (let k = 1; k <= 13; k++) if (k !== 5 && k !== 9) K.cyl(P, 'doseme_tahtasi', V(-0.25, k * 0.3, 0), V(0.25, k * 0.3, 0), 0.02, 6); }),
  moloz_rampa: tek((P) => { basamak(P, F0, -1.5, 1.5, 3, 0.5, 1.0, 'tas_blok'); for (let k = 0; k < 3; k++) for (const s of [-1, 1]) moloz(P, s * 1.3, -0.5 - k, 0.3, 4, 20 + k * 2 + s, (k + 1) * 0.5 - 0.02, 0.28); for (let k = 0; k < 3; k++) for (let q = 0; q < 4; q++) { const x = -1.3 + q * 0.85 + hsh(k, q, 1) * 0.2, s = 0.14 + hsh(k, q, 2) * 0.12; kw(P, q % 2 ? 'tugla_kirik' : 'tas_isli', x - s, x + s, k * 0.5, k * 0.5 + s, -k + 0.0, -k + 0.2); } K.beam(P, 'ahsap_yanik', V(-1.6, 0.1, 0.3), V(-1.2, 1.5, -2.8), 0.2, 0.2); }),
  moloz_kucuk: tek((P) => { K.lathe(P, 'tas_isli', 0, 0, [[0.75, 0], [0.6, 0.18], [0.35, 0.36], [0, 0.44]], 9, 1); P.quad('tas_isli', [V(-0.7, 0, -0.7), V(0.7, 0, -0.7), V(0.7, 0, 0.7), V(-0.7, 0, 0.7)], K.FLAT, V(0, -1, 0)); moloz(P, 0, 0, 0.7, 14, 31, 0, 0.3); moloz(P, 0, 0, 0.3, 5, 37, 0.3, 0.2); for (const [a, b] of [[V(-0.7, 0.05, 0.2), V(0.3, 0.4, -0.2)], [V(0.1, 0.05, 0.7), V(0.6, 0.3, -0.3)]]) K.beam(P, 'ahsap_yanik', a, b, 0.03, 0.16); }),
  krater: tek((P) => { const n = 20, prof = [[0, -0.8], [0.5, -0.74], [1.1, -0.45], [1.6, 0.0], [2.0, 0.3], [2.4, 0.12], [2.8, 0]], R = prof.map(([rad, y], j) => Array.from({ length: n }, (_, k) => { const a = (k / n) * TAU, w = j === 0 ? 0 : 1 + (hsh(j, k, 5) - 0.5) * 0.12; return V(Math.cos(a) * rad * w, y + (j > 0 && j < 6 ? (hsh(k, j, 9) - 0.5) * 0.08 : 0), Math.sin(a) * rad * w); })); for (let j = 1; j + 1 < R.length; j++) for (let k = 0; k < n; k++) { const k1 = (k + 1) % n, pts = [R[j][k], R[j][k1], R[j + 1][k1], R[j + 1][k]]; P.quad('toprak', pts, pts.map((p) => [p.x / 2, p.z / 2]), UP); } for (let k = 0; k < n; k++) { const k1 = (k + 1) % n; P.tri('is_kara', [V(0, -0.8, 0), R[1][k], R[1][k1]], K.FLAT.slice(0, 3), UP); P.tri('toprak', [V(0, -0.95, 0), R[6][k], R[6][k1]], K.FLAT.slice(0, 3), V(0, -1, 0)); } moloz(P, 0, 0, 2.6, 16, 41, 0.02, 0.2); }),
  // 4) Tutunma, sallanma, atlama parçaları
  boru_cikinti: tek((P) => { K.cyl(P, 'pas_turuncu', V(0, 0, -0.3), V(0, 0, 1.9), 0.1, 12); K.cyl(P, 'pas_turuncu', V(0, 0, 1.9), V(0, -0.12, 2.5), 0.1, 12); K.cyl(P, 'pas_turuncu', V(0, 0, 0.9), V(0, 0, 1.0), 0.125, 12); vox(P, fr(V(0, -0.6, 0), XX, ZZ), { len: 1.2, h: 1.2 }, (u, y, i, j) => Math.hypot(u, y - 0.6) < 0.6 + 0.1 * hsh(i, j, 6)); kw(P, 'demir_koyu', -0.16, 0.16, -0.16, -0.12, 0.3, 0.38); K.beam(P, 'demir_koyu', V(0.14, -0.14, 0.34), V(0.3, -0.5, 0.2), 0.03, 0.03); }),
  boru_sallanan: (mk) => { const a = mk('aski'); kw(a, 'demir_koyu', -0.2, 0.2, 0.04, 0.1, -0.12, 0.12); for (const s of [-1, 1]) kw(a, 'demir_koyu', s * 0.13 - 0.02, s * 0.13 + 0.02, -0.12, 0.04, -0.04, 0.04); K.cyl(a, 'demir_koyu', V(-0.16, 0, 0), V(0.16, 0, 0), 0.025, 8); const b = mk('boru'); K.cyl(b, 'pas_turuncu', V(0, 0.06, 0), V(0, -3, 0), 0.1, 12); K.cyl(b, 'pas_turuncu', V(0, -1.5, 0), V(0, -1.6, 0), 0.125, 12); for (let k = 0; k < 6; k++) { const an = (k / 6) * TAU; b.tri('pas_turuncu', [V(Math.cos(an) * 0.1, -3, Math.sin(an) * 0.1), V(Math.cos(an + 1) * 0.1, -3, Math.sin(an + 1) * 0.1), V(Math.cos(an + 0.5) * 0.14, -3.2 - hsh(k, 1, 1) * 0.15, Math.sin(an + 0.5) * 0.14)], K.FLAT.slice(0, 3), V(Math.cos(an), 0, Math.sin(an))); } },
  demir_cubuk: tek((P) => { K.cyl(P, 'pas_turuncu', V(-1.5, 0, 0), V(1.5, 0, 0), 0.03, 8); for (const s of [-1, 1]) kw(P, 'tas_blok', s > 0 ? 1.5 : -1.9, s > 0 ? 1.9 : -1.5, -0.2, 0.2, -0.2, 0.2); }),
  ip_asili_6m: (mk) => ipAsili(mk, 6, 1.5),
  ip_asili_4m: (mk) => ipAsili(mk, 4, 1.2),
  platform_asili: (mk) => { palanga(mk('palanga'), false); const t = mk('tahta'); tahta(t, (x, z) => V(x, -3, z)); [[-1.1, -0.42], [1.1, -0.42], [-1.1, 0.42], [1.1, 0.42]].forEach(([x, z], k) => halatCiz(mk(`ip_${k + 1}`), V(0, -0.34, 0), V(x, -3, z), 0.018)); },
  platform_kopuk: (mk) => { palanga(mk('palanga'), true); const a = Math.PI / 3, pt = (x, z) => V(x, -3 - (z + 0.42) * Math.sin(a), -0.42 + (z + 0.42) * Math.cos(a)); tahta(mk('tahta'), pt); [[-1.1], [1.1]].forEach(([x], k) => halatCiz(mk(`ip_${k + 1}`), V(0, -0.34, 0), pt(x, -0.42), 0.018)); },
  tel_direk: tek((P) => { const a = (20 * Math.PI) / 180, d = V(Math.sin(a), Math.cos(a), 0), top = d.clone().multiplyScalar(6); K.cyl(P, 'ahsap_yanik', V(0, 0, 0), top, 0.11, 10); const c = d.clone().multiplyScalar(5.4), ax = V(0, 0, 1); K.cyl(P, 'pas_turuncu', c.clone().addScaledVector(ax, -0.8), c.clone().addScaledVector(ax, 0.8), 0.035, 8); for (const z of [-0.7, 0.7]) { K.cyl(P, 'demir_koyu', c.clone().addScaledVector(ax, z), c.clone().addScaledVector(ax, z).add(V(0, 0.12, 0)), 0.03, 6); const s = c.clone().addScaledVector(ax, z).add(V(0, 0.1, 0)); K.cyl(P, 'demir_koyu', s, s.clone().add(V(0.5, -1.6, z * 0.3)), 0.006, 3, false); K.cyl(P, 'demir_koyu', s.clone().add(V(0.5, -1.6, z * 0.3)), s.clone().add(V(0.9, -3.3, z * 0.2)), 0.006, 3, false); } K.beam(P, 'demir_koyu', c.clone().add(V(0, -0.5, 0)), c.clone().addScaledVector(ax, 0.5), 0.02, 0.02); }),
  // 5) Hazır harabeler (orijin zemin ortasında; 1 m taş temel yerin altında)
  harabe_1_ev: tek((P) => {
    const o = { h: 6, cell: 0.5, y0: -1 };
    vox(P, fr(V(0, 0, 3.5), XX, ZZ), { ...o, len: 9 }, (u, y, i) => y < 0 || (!(Math.abs(u) < 0.5 && y < 2) && !((Math.abs(u - 2.75) < 0.5 || Math.abs(u + 2.75) < 0.5) && y > 1 && y < 2.5) && y < 3 + (hsh(i, 3, 3) < 0.3 ? 0.5 : 0)));
    vox(P, fr(V(0, 0, -3.5), V(-1, 0, 0), V(0, 0, -1)), { ...o, len: 9 });
    vox(P, fr(V(-4.5, 0, 0), ZZ, V(-1, 0, 0)), { ...o, len: 6 }, (u, y) => y < (u < 0 ? 6 : 6 - Math.floor(u / 0.75) * 0.75));
    vox(P, fr(V(4.5, 0, 0), V(0, 0, -1), XX), { ...o, len: 6 }, (u, y) => y < (u > 0 ? 6 : 6 + Math.ceil(u / 0.6) * 0.5) && !(Math.hypot(u - 1, y - 4.3) < 0.8));
    silme(P, -4.5, 4.5, 6.15, -3.5, -2.8);
    kw(P, 'doseme_tahtasi', -4, 4, 2.94, 3.0, -3, 0, 1.2); for (let x = -3.6; x <= 3.7; x += 1.2) { kw(P, 'ahsap_yanik', x - 0.1, x + 0.1, 2.7, 2.94, -3, 0.3 + hsh(x * 10 | 0, 1, 1) * 0.9); kiymik(P, V(x, 2.82, 0.3 + hsh(x * 10 | 0, 1, 1) * 0.9), ZZ, 3); }
    basamak(P, fr(V(3.4, 0, 2.6), XX, ZZ), -0.6, 0.6, 8, 0.25, 0.3); moloz(P, 1, 1, 1.6, 14, 51, 0, 0.5); moloz(P, -2, 4.3, 1.2, 8, 53, 0, 0.5);
  }),
  harabe_2_dukkan: tek((P) => {
    const H = 3.5, o = { h: H, cell: 0.5, y0: -1 }, arch = (u, y) => [-4, 4].some((c) => Math.abs(u - c) < 1.25 && y < 1.5 + Math.sqrt(Math.max(0, 1.5625 - (u - c) ** 2)));
    vox(P, fr(V(0, 0, 2.5), XX, ZZ), { h: H, cell: 0.25, y0: -1, len: 12 }, (u, y, i) => y < 0 || (!arch(u, y) && !(Math.abs(u) < 2 - Math.min(0.6, y * 0.25) + 0.25 * hsh(i, 2, 4) && true && Math.abs(u) < 2.2)));
    vox(P, fr(V(0, 0, -2.5), V(-1, 0, 0), V(0, 0, -1)), { ...o, len: 12 }); vox(P, fr(V(-6, 0, 0), ZZ, V(-1, 0, 0)), { ...o, len: 4 }); vox(P, fr(V(6, 0, 0), V(0, 0, -1), XX), { ...o, len: 4 }, (u, y) => y < H - (u < -0.5 ? 1 : 0));
    for (const x of [-2, 2]) vox(P, fr(V(x, 0, 0), ZZ, V(x < 0 ? 1 : -1, 0, 0)), { ...o, len: 4, t: 0.4 }, (u, y) => y < H - (u > 0.5 ? 0.5 : 0));
    basamak(P, fr(V(0, 0, 2.9), XX, ZZ), -1.5, 1.5, 3, 0.5, 1.0); moloz(P, 0, 2.6, 1.9, 16, 61, 0, 0.5); moloz(P, 0, 0.5, 1.4, 8, 63, 1.5, 0.3);
    for (let x = -5.5; x <= -2.2; x += 0.8) kw(P, 'ahsap_yanik', x - 0.1, x + 0.1, H, H + 0.2, -2.5, 2.5); kw(P, 'doseme_tahtasi', -6, -2, H + 0.2, H + 0.26, -2.5, 2.5, 1.2);
    for (let x = 2.5; x <= 5.6; x += 0.8) { const z1 = -2.5 + 1.5 + hsh(x * 10 | 0, 2, 2) * 3; kw(P, 'ahsap_yanik', x - 0.1, x + 0.1, H, H + 0.2, -2.5, z1); kiymik(P, V(x, H + 0.1, z1), ZZ, 3); }
    for (const [a, b] of [[-6, -2.2], [2.2, 6]]) silme(P, a, b, H + 0.41, 2.0, 2.7);
  }),
  harabe_3_kule: tek((P) => {
    const o = { h: 9, cell: 0.5, y0: -1 }, yirt = (d, y, j) => y >= 0 && d < 1.6 + 0.5 * hsh(j, 5, 5) - (y > 6 ? 0 : 0.3);
    vox(P, fr(V(0, 0, 2.5), XX, ZZ), { ...o, len: 5 }, (u, y, i, j) => !yirt(2.5 - u, y, j) && !(Math.abs(u + 1) < 0.5 && y < 2 && y > 0));
    vox(P, fr(V(2.5, 0, 0), V(0, 0, -1), XX), { ...o, len: 4 }, (u, y, i, j) => !yirt(u + 2, y, j + 9));
    vox(P, fr(V(0, 0, -2.5), V(-1, 0, 0), V(0, 0, -1)), { ...o, len: 5 }, (u, y) => !(Math.abs(u) < 0.25 && ((y > 4 && y < 5) || (y > 7 && y < 8))));
    vox(P, fr(V(-2.5, 0, 0), ZZ, V(-1, 0, 0)), { ...o, len: 4 }, (u, y) => !(Math.abs(u) < 0.25 && y > 4 && y < 5));
    for (const y of [3, 6, 9]) { if (y < 9) { kw(P, 'doseme_tahtasi', -2, 2, y - 0.06, y, -2, -0.8, 1.2); kw(P, 'doseme_tahtasi', -2, -0.8, y - 0.06, y, -0.8, 1.6, 1.2); for (const x of [-1.6, -0.4, 0.8, 1.9]) { kw(P, 'ahsap_yanik', x - 0.1, x + 0.1, y - 0.28, y - 0.06, -2, -0.6); kiymik(P, V(x, y - 0.17, -0.6), ZZ, 3); } } silme(P, -2.8, -2.5, y, -2.5, 2.5); silme(P, -2.5, 0.5, y, 2.5, 2.8); silme(P, -2.5, 2.5, y, -2.8, -2.5); }
    kw(P, 'doseme_tahtasi', -2, 2, 8.6, 8.66, -2, -0.8, 1.2); moloz(P, 2.2, 2.2, 1.8, 18, 71, 0, 0.6);
  }),
  // Han köşesi: A duvarı x -5 … 5 (iç yüz +Z, z = 0); B duvarı z 0 … 8 (iç yüz +X, x = -5). Orijin A duvarının iç yüzünün ortasında.
  harabe_4_han: tek((P) => {
    const o = { h: 7, cell: 0.5, y0: -1 }, ark = (u, y, cs) => cs.some((c) => { const d = Math.abs(u - c); return y > 0 && ((d < 0.75 && y < 2) || (d < 0.5 && y < 2.5) || (d < 0.25 && y < 3)); });
    vox(P, fr(V(0, 0, 0), XX, ZZ), { ...o, len: 10 }, (u, y, i) => y < 0 || (!ark(u, y, [-3.75, -1.25, 1.25, 3.75]) && !(Math.hypot(u - 2.2, y - 5.2) < 1.1) && !([-3, 0].some((c) => Math.abs(u - c) < 0.5) && y > 4.5 && y < 6) && y < 7 - (u > 3 ? Math.floor((u - 3) / 0.5) * 0.75 : 0) - (hsh(i, 1, 8) < 0.2 ? 0.5 : 0)));
    vox(P, fr(V(-5, 0, 4), V(0, 0, -1), XX), { ...o, len: 8 }, (u, y, i) => y < 0 || (!ark(u, y, [-2.5, 0, 2.5]) && !(Math.hypot(u + 1.5, y - 5) < 0.9) && y < 7 - (u < -2.5 ? Math.floor((-2.5 - u) / 0.5) * 0.8 : 0)));
    kw(P, 'tas_isli', -5.5, -5, -1, 7, -0.5, 0, 3);
    silme(P, -5, 5, 3.2, 0, 0.3); silme(P, -5, -4.7, 3.2, 0.3, 8);
    kw(P, 'doseme_tahtasi', -5, 0.5, 3.44, 3.5, 0, 2.5, 1.2); kw(P, 'doseme_tahtasi', -5, -2.5, 3.44, 3.5, 2.5, 5, 1.2);
    for (let x = -4.4; x <= 0.4; x += 1.2) kw(P, 'ahsap_yanik', x - 0.1, x + 0.1, 3.2, 3.44, 0.3, 2.6); for (let z = 3; z <= 5; z += 1) kw(P, 'ahsap_yanik', -4.7, -2.4, 3.2, 3.44, z - 0.1, z + 0.1);
    for (const [x, z] of [[-2.6, 2.4], [0.4, 2.4], [-2.6, 4.9]]) kw(P, 'ahsap_yanik', x - 0.1, x + 0.1, 0, 3.2, z - 0.1, z + 0.1);
    for (let k = 0; k < 7; k++) { const x = 0.7 + k * 0.4; K.beam(P, 'doseme_tahtasi', V(x, 3.45, 0.1), V(x, 3.45 - 1.25 - hsh(k, 1, 1) * 0.4, 0.1 + 1.9), 0.05, 0.36); } K.beam(P, 'ahsap_yanik', V(0.6, 3.3, 0.2), V(3.6, 3.3, 0.2), 0.24, 0.2);
    moloz(P, 3.5, 1.5, 1.8, 16, 81, 0, 0.6); moloz(P, -3.5, 6.5, 1.3, 10, 83, 0, 0.5);
  }),
  harabe_5_hamam: tek((P) => {
    const o = { h: 4, cell: 0.5, y0: -1 };
    vox(P, fr(V(0, 0, 4), XX, ZZ), { ...o, len: 8 }, (u, y, i, j) => y < 0 || Math.hypot(u - 1.5, y - 0.9) > 1.15 + 0.2 * hsh(i, j, 2));
    vox(P, fr(V(0, 0, -4), V(-1, 0, 0), V(0, 0, -1)), { ...o, len: 8 }); vox(P, fr(V(-4, 0, 0), ZZ, V(-1, 0, 0)), { ...o, len: 7 }, (u, y) => !(Math.abs(u) < 0.5 && y > 0 && y < 2)); vox(P, fr(V(4, 0, 0), V(0, 0, -1), XX), { ...o, len: 7 });
    const R = 3.4, nA = 20, nE = 7, pt = (a, e) => V(Math.cos(a) * Math.cos(e) * R, 4 + Math.sin(e) * R * 0.8, Math.sin(a) * Math.cos(e) * R);
    for (let i = 0; i < nA; i++) for (let j = 0; j < nE; j++) { const a0 = (i / nA) * TAU, a1 = ((i + 1) / nA) * TAU, e0 = (j / nE) * Math.PI / 2, e1 = ((j + 1) / nE) * Math.PI / 2, cut = 0.5 * Math.cos(a0 - 0.6) + 0.5; if (j / nE > 0.08 + 0.72 * (1 - cut) + 0.2 * hsh(i, j, 9) - 0.1) continue; const q = [pt(a0, e0), pt(a1, e0), pt(a1, e1), pt(a0, e1)]; P.quad('tugla_kirik', q, [[i / 5, j / 3], [(i + 1) / 5, j / 3], [(i + 1) / 5, (j + 1) / 3], [i / 5, (j + 1) / 3]], q[0].clone().setY(1)); }
    for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { const x = -4 + i * 0.5, z = -4 + j * 0.5; if (Math.hypot(x + 0.25, z + 0.25) < R - 0.1) continue; P.quad('tas_blok', [V(x, 4, z), V(x + 0.5, 4, z), V(x + 0.5, 4, z + 0.5), V(x, 4, z + 0.5)], [[x / 1.5, z / 1.5], [(x + 0.5) / 1.5, z / 1.5], [(x + 0.5) / 1.5, (z + 0.5) / 1.5], [x / 1.5, (z + 0.5) / 1.5]], UP); }
    K.cyl(P, 'pas_turuncu', V(-4, 2, 4.2), V(0.2, 2, 4.2), 0.09, 10); K.cyl(P, 'pas_turuncu', V(4.2, 2, 4), V(4.2, 2, -4), 0.09, 10); K.cyl(P, 'pas_turuncu', V(2.9, 2, 4.2), V(4.2, 2, 4.2), 0.09, 10);
    for (const [x, z] of [[-3.5, 4.1], [-1.5, 4.1], [4.1, 2.5], [4.1, 0], [4.1, -2.5], [3.5, 4.1]]) kw(P, 'demir_koyu', x - 0.05, x + 0.05, 1.86, 2.0, z - 0.05, z + 0.2);
    moloz(P, 1.5, 4.6, 1.3, 12, 91, 0, 0.5); moloz(P, 0.5, 0.5, 2.2, 18, 93, 0, 0.6);
  }),
  harabe_6_cephe: tek((P) => {
    vox(P, fr(V(0, 0, 0.25), XX, ZZ), { h: 9, cell: 0.5, y0: -1, len: 12 }, (u, y, i) => y < 0 || (![-4.5, -1.5, 1.5, 4.5].some((c) => Math.abs(u - c) < 0.5 && [1, 4, 7].some((b) => y > b && y < b + 1.5)) && !(Math.hypot(u - 3, y - 6.2) < 1.0) && y < 9 - (u < -4 ? Math.floor((-4 - u) / 0.5) * 1.0 + 0.5 : 0) - (u > 4.5 ? 1.5 : 0) - (hsh(i, 4, 4) < 0.25 ? 0.5 : 0)));
    for (const y of [1, 4, 7]) silme(P, -6, 6, y, 0.25, 0.55);
    for (const x of [-3, 3]) { K.beam(P, 'ahsap_yanik', V(x, 0, -5), V(x, 6.6, -0.25), 0.3, 0.3); kw(P, 'ahsap_yanik', x - 0.4, x + 0.4, 0, 0.2, -5.4, -4.6); }
    moloz(P, 0, -1.6, 2.5, 18, 97, 0, 0.6);
  }),
};
function ipAsili(mk, L, bezY) { halka(mk('halka'), V(0, 0, 0)); const p = mk('ip'); halatCiz(p, V(0, -0.16, 0), V(0, -L, 0)); dugum(p, V(0, -0.2, 0), 0.05); dugum(p, V(0, -L + 0.07, 0), 0.085); bez(p, V(0, -L + bezY, 0)); }
function palanga(P, kopuk) { kw(P, 'ahsap_yanik', -0.7, 0.7, 0.14, 0.4, -0.13, 0.13); K.cyl(P, 'demir_koyu', V(0, 0.14, 0), V(0, 0, 0), 0.02, 6); K.cyl(P, 'demir_koyu', V(0, 0, 0), V(0, -0.1, 0), 0.02, 6); kw(P, 'doseme_tahtasi', -0.09, 0.09, -0.36, -0.1, -0.14, 0.14, 0.6); K.cyl(P, 'demir_koyu', V(-0.1, -0.23, 0), V(0.1, -0.23, 0), 0.1, 10); if (kopuk) for (const [x, z, l] of [[-0.25, 0.3, 0.9], [0.3, 0.35, 1.3]]) { halatCiz(P, V(0, -0.34, 0), V(x, -0.34 - l, z), 0.018); for (let k = 0; k < 4; k++) K.cyl(P, 'halat', V(x, -0.34 - l, z), V(x + (hsh(k, 1, l * 10 | 0) - 0.5) * 0.12, -0.34 - l - 0.14, z + (hsh(k, 2, 3) - 0.5) * 0.12), 0.006, 3, false); } }
function tahta(P, pt) { for (let k = 0; k < 4; k++) { const z0 = -0.5 + k * 0.25, z1 = z0 + 0.24, n = pt(0, 0.1).sub(pt(0, 0)).cross(V(1, 0, 0)).normalize().multiplyScalar(-0.05), q = (x, z, up) => pt(x, z).add(up ? V(0, 0, 0) : n); for (const up of [1, 0]) P.quad('doseme_tahtasi', [q(-1.2, z0, up), q(1.2, z0, up), q(1.2, z1, up), q(-1.2, z1, up)], [[0, k / 8], [1.6, k / 8], [1.6, (k + 1) / 8], [0, (k + 1) / 8]], up ? n.clone().negate() : n); for (const [a, b] of [[[-1.2, z0], [1.2, z0]], [[1.2, z0], [1.2, z1]], [[1.2, z1], [-1.2, z1]], [[-1.2, z1], [-1.2, z0]]]) P.quad('doseme_tahtasi', [q(...a, 1), q(...b, 1), q(...b, 0), q(...a, 0)], K.FLAT, V(0, 0, 1)); } for (const x of [-1.0, 1.0]) K.beam(P, 'ahsap_yanik', pt(x, -0.5), pt(x, 0.5), 0.07, 0.09); }
export const HARABE_PARCALAR = Object.keys(DEFS);
export function createHarabe(name) {
  const parts = [], mk = (ad) => { const p = new Part(ad); parts.push(p); return p; };
  DEFS[name](mk, name);
  const meshes = parts.map((p) => { const m = p.mesh(M); m.name = p.name; m.castShadow = m.receiveShadow = true; return m; });
  if (meshes.length === 1) return meshes[0];
  const g = new THREE.Group(); g.name = name; g.add(...meshes); return g;
}
