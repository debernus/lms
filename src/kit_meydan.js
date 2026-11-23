import * as THREE from 'three';
import fontUrl from '@fontsource/amiri/files/amiri-arabic-700-normal.woff2';
import * as K from './kit_ortak.js';
import { marble, ashlar, bars, mossTile } from './sebil.js';
import * as sebil from './sebil.js';
const { V, ALL, SIDES, PAINT, TAU, FLAT, box, quad, tri, beam, cyl, lathe } = K;

// Meydan yapıları kiti (1890'lar Osmanlı İstanbul'u, cami meydanı). Birim metre, Y yukarı, orijin taban
// ortasında (y = 0 zemin). Duvara dayanan parçaların sırtı z = 0'da, önü +Z'ye bakar; duvar gövdesi
// z 0 … 0,45. Modül 3 m. Bütün malzemeler çift taraflıdır ve içi görünen yapıların iç yüzleri kapalıdır.
document.fonts.add(await new FontFace('AmiriMeydan', `url(${fontUrl})`, { weight: '700' }).load());

const lead = (g, w, h, rand) => {
  g.fillStyle = '#4e5660';
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) {
    const v = 60 + rand() * 50;
    g.fillStyle = `rgba(${v},${v + 6},${v + 14},0.3)`;
    g.fillRect(rand() * w, rand() * h, 8 + rand() * 30, 8 + rand() * 30);
  }
  g.strokeStyle = 'rgba(24,28,34,0.8)';
  g.lineWidth = 2.5;
  for (let k = 0; k <= 4; k++) {
    g.strokeRect(k * 64, 0, 0.01, h);
    g.strokeRect(0, k * 64, w, 0.01);
  }
};
const kitabe = (g, w, h) => {
  g.fillStyle = '#1c4a34';
  g.fillRect(0, 0, w, h);
  g.strokeStyle = '#b89a48';
  g.lineWidth = 6;
  g.strokeRect(5, 5, w - 10, h - 10);
  g.fillStyle = '#c9ac58';
  g.font = `700 ${h * 0.5}px AmiriMeydan`;
  g.direction = 'rtl';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('بسم الله الرحمن الرحیم', w / 2, h * 0.46);
};
const M = K.materials('meydan', {
  kesme_tas: [ashlar], mermer: [marble], kursun: [lead], kiremit: [mossTile], kereste: [PAINT.kereste], tahta: [PAINT.tahta, 256, 256, [92, 74, 56]],
  demir_parmaklik: [bars], ahsap_kapi: [PAINT.kapi, 128, 192], kitabe: [kitabe, 256, 64],
  demir: 0x1c1a18, su: 0x2a3a40, pirinc: 0x8a6e32, alem: 0x8a7434, fener_cami: 0xcdb46a, karanlik: 0x14110e,
});
for (const m of Object.values(M)) m.side = THREE.DoubleSide;

// ---------- Yardımcılar ----------
// Çokgen kuşak: düz yüzleri eksenlere bakar; (apotem, y) → (apotem, y)
const vert = (n, k, ap, y, cx = 0, cz = 0) => V(cx + Math.cos(((k - 0.5) / n) * TAU) * (ap / Math.cos(Math.PI / n)), y, cz + Math.sin(((k - 0.5) / n) * TAU) * (ap / Math.cos(Math.PI / n)));
function ring(p, mat, n, a0, y0, a1, y1, s = 1.5, cx = 0, cz = 0) {
  const side = 2 * Math.tan(Math.PI / n), len = Math.hypot(a1 - a0, y1 - y0);
  for (let k = 0; k < n; k++) {
    const t = (k / n) * TAU, hint = V(Math.cos(t), Math.abs(y1 - y0) < 1e-6 ? (a1 < a0 ? 9 : -9) : a1 < a0 ? 0.7 : y1 > y0 ? 0.1 : -0.7, Math.sin(t));
    const u0 = (k * side * a0) / s, u1 = ((k + 1) * side * a0) / s;
    if (a1 < 1e-4) p.tri(mat, [vert(n, k, a0, y0, cx, cz), vert(n, k + 1, a0, y0, cx, cz), V(cx, y1, cz)], [[u0, 0], [u1, 0], [(u0 + u1) / 2, len / s]], hint);
    else p.quad(mat, [vert(n, k, a0, y0, cx, cz), vert(n, k + 1, a0, y0, cx, cz), vert(n, k + 1, a1, y1, cx, cz), vert(n, k, a1, y1, cx, cz)], [[u0, y0 / s], [u1, y0 / s], [u1, (y0 + len) / s], [u0, (y0 + len) / s]], hint);
  }
}
const rings = (p, mat, n, prof, s, cx, cz) => prof.slice(1).forEach(([a, y, m], i) => ring(p, prof[i][2] ?? mat, n, prof[i][0], prof[i][1], a, y, s, cx, cz));
// İki nokta arasında sivri kemerli alınlık (iki yüz ve kemer içi)
function archPanel(p, mat, A, B, ys, yt, th, seg = 6, margin = 0.1) {
  const dir = B.clone().sub(A), w = dir.length(), hw = w / 2 - margin, mid = A.clone().add(B).multiplyScalar(0.5), rise = yt - ys - 0.35;
  dir.normalize();
  const n = V(dir.z, 0, -dir.x), pos = (s, y, o) => mid.clone().addScaledVector(dir, s).addScaledVector(n, o).setY(y);
  const pts = [[-w / 2, ys], [-hw, ys]];
  for (let k = 1; k < seg; k++) {
    const s = -hw + (2 * hw * k) / seg;
    pts.push([s, ys + rise * (1 - (Math.abs(s) / hw) ** 1.8) ** 0.6]);
  }
  pts.push([hw, ys], [w / 2, ys]);
  for (let i = 0; i + 1 < pts.length; i++) {
    const [s0, y0] = pts[i], [s1, y1] = pts[i + 1];
    for (const o of [-th / 2, th / 2]) p.quad(mat, [pos(s0, y0, o), pos(s1, y1, o), pos(s1, yt, o), pos(s0, yt, o)], [[s0 / 1.5, y0 / 1.5], [s1 / 1.5, y1 / 1.5], [s1 / 1.5, yt / 1.5], [s0 / 1.5, yt / 1.5]], n.clone().multiplyScalar(o));
    p.quad(mat, [pos(s0, y0, -th / 2), pos(s1, y1, -th / 2), pos(s1, y1, th / 2), pos(s0, y0, th / 2)], FLAT, V(0, -1, 0));
  }
}
const alem = (p, x, z, y, s = 1) => lathe(p, 'alem', x, z, [[0.1 * s, y], [0.2 * s, y + 0.2 * s], [0.07 * s, y + 0.42 * s], [0.13 * s, y + 0.6 * s], [0, y + 0.95 * s]], 6);
const column = (p, x, z, y0, y1, r = 0.12, n = 5) => lathe(p, 'mermer', x, z, [[r * 1.6, y0], [r * 1.6, y0 + 0.2], [r, y0 + 0.3], [r * 0.9, y1 - 0.3], [r * 1.7, y1]], n);
const openBox = (p, mat, x0, x1, z0, z1, y0, h, w, fill) => {
  const t = y0 + h, yb = y0 + h * 0.35, a = x0 + w, b = x1 - w, c = z0 + w, d = z1 - w;
  box(p, mat, x0, x1, y0, t, z0, z1, ['+x', '-x', '+z', '-z', '-y'], 1.5);
  for (const [u0, u1, v0, v1] of [[x0, x1, z0, c], [x0, x1, d, z1], [x0, a, c, d], [b, x1, c, d]]) quad(p, mat, [V(u0, t, v0), V(u1, t, v0), V(u1, t, v1), V(u0, t, v1)], V(0, 1, 0));
  for (const [q, n] of [[[V(a, yb, c), V(b, yb, c), V(b, t, c), V(a, t, c)], V(0, 0, 1)], [[V(a, yb, d), V(b, yb, d), V(b, t, d), V(a, t, d)], V(0, 0, -1)], [[V(a, yb, c), V(a, yb, d), V(a, t, d), V(a, t, c)], V(1, 0, 0)], [[V(b, yb, c), V(b, yb, d), V(b, t, d), V(b, t, c)], V(-1, 0, 0)]]) quad(p, mat, q, n);
  quad(p, fill, [V(a, y0 + h * 0.8, c), V(b, y0 + h * 0.8, c), V(b, y0 + h * 0.8, d), V(a, y0 + h * 0.8, d)], V(0, 1, 0));
};
const tap = (p, x, y, z, n) => beam(p, 'pirinc', V(x, y, z), V(x + n.x * 0.14, y - 0.05, z + n.z * 0.14), 0.035, 0.035);
// Sivri kemerli pano (yelpaze üçgenler): parmaklık ya da karanlık niş
function archFill(p, mat, cx, y0, w, h, z, s = 0.6) {
  const pts = [[-w / 2, 0], [w / 2, 0], [w / 2, h * 0.6], [w * 0.28, h * 0.86], [0, h], [-w * 0.28, h * 0.86], [-w / 2, h * 0.6]].map(([x, y]) => V(cx + x, y0 + y, z));
  for (let i = 1; i + 1 < pts.length; i++) p.tri(mat, [pts[0], pts[i], pts[i + 1]], [pts[0], pts[i], pts[i + 1]].map((q) => [q.x / s, q.y / s]), V(0, 0, 1));
}
// Şadırvan: n kenarlı; ap: sütun dizisinin apotemi, eave: saçak apotemi
function sadirvan(p, n, ap, eave, colH, o) {
  ring(p, 'mermer', n, ap + 0.4, 0, ap + 0.4, 0.15);
  ring(p, 'mermer', n, ap + 0.4, 0.15, 0, 0.15);
  // Su haznesi: mermer tekne, içinde su, her yüzünde musluk
  const b = o.basin, bh = o.basinH;
  rings(p, 'mermer', n, [[b + 0.08, 0.15], [b + 0.08, 0.3], [b, 0.35], [b, bh], [b + 0.06, bh + 0.03], [b + 0.06, bh + 0.12], [b - 0.14, bh + 0.12], [b - 0.14, bh - 0.1], [0, bh - 0.1, 'su']]);
  ring(p, 'su', n, b - 0.14, bh - 0.1, 0, bh - 0.1);
  for (let k = 0; k < n; k++) {
    const t = (k / n) * TAU, nrm = V(Math.cos(t), 0, Math.sin(t));
    tap(p, nrm.x * b, 0.85, nrm.z * b, nrm);
    const A = vert(n, k, ap, 0), B = vert(n, k + 1, ap, 0);
    column(p, A.x, A.z, 0.15, colH, o.colR);
    archPanel(p, 'mermer', A, B, colH, colH + o.archH, 0.28, 6, 0.12);
  }
  const y = colH + o.archH;
  rings(p, 'mermer', n, [[ap + 0.16, y], [ap + 0.22, y + 0.1], [ap + 0.22, y + 0.25]]);
  ring(p, 'tahta', n, ap - 0.14, y, 0, y, 1); // içeriden görünen ahşap tavan
  ring(p, 'tahta', n, ap + 0.2, y + 0.12, eave, y + 0.3, 1); // saçak altı
  ring(p, 'kereste', n, eave, y + 0.3, eave, y + 0.42, 1);
  rings(p, o.roof, n, o.dome.map(([a, h]) => [a, y + 0.42 + h]));
  alem(p, 0, 0, y + 0.42 + o.dome[o.dome.length - 1][1] - 0.05, o.alem);
}
// Kırma kiremit çatılı sundurma: hx × hz yarı boyut (saçak dahil), direkler pts
function sundurma(p, hx, hz, posts, base = 0) {
  const E = base + 2.8, R = hx - hz; // saçak altı, mahya yarı boyu
  for (const [x, z] of posts) {
    box(p, 'kereste', x - 0.09, x + 0.09, base, E, z - 0.09, z + 0.09, SIDES, 1);
    box(p, 'mermer', x - 0.16, x + 0.16, base, base + 0.25, z - 0.16, z + 0.16, ['+x', '-x', '+z', '-z', '+y'], 1.5);
    for (const [dx, dz] of [[Math.sign(-x) * 0.6, 0], [0, Math.sign(-z) * 0.6]]) beam(p, 'kereste', V(x, E - 0.65, z), V(x + dx, E - 0.06, z + dz), 0.07, 0.07, false); // eli böğründe
  }
  const px = hx - 0.45, pz = hz - 0.45;
  for (const s of [-1, 1]) {
    beam(p, 'kereste', V(-px - 0.2, E - 0.02, s * pz), V(px + 0.2, E - 0.02, s * pz), 0.14, 0.12);
    beam(p, 'kereste', V(s * px, E - 0.02, -pz), V(s * px, E - 0.02, pz), 0.14, 0.12);
  }
  quad(p, 'tahta', [V(-hx, E + 0.06, -hz), V(hx, E + 0.06, -hz), V(hx, E + 0.06, hz), V(-hx, E + 0.06, hz)], V(0, -1, 0), 1); // tavan
  box(p, 'kereste', -hx, hx, E + 0.06, E + 0.2, -hz, hz, SIDES, 1);
  const T = E + 0.2 + hz * 0.55;
  for (const s of [-1, 1]) {
    quad(p, 'kiremit', [V(-hx, E + 0.2, s * hz), V(hx, E + 0.2, s * hz), V(R, T, 0), V(-R, T, 0)], V(0, 1, s * 0.5));
    tri(p, 'kiremit', [V(s * hx, E + 0.2, -hz), V(s * hx, E + 0.2, hz), V(s * R, T, 0)], V(s * 0.5, 1, 0));
  }
}
const WT = 0.45; // duvar kalınlığı: z 0 … 0,45
const wallBox = (p, x0, x1, y0, y1) => box(p, 'kesme_tas', x0, x1, y0, y1, 0, WT, ALL, 1.5);
const dome = (p, x, z, r, y, rise, n = 12) => lathe(p, 'kursun', x, z, [[r + 0.08, y], [r, y + 0.1], [r * 0.92, y + rise * 0.4], [r * 0.68, y + rise * 0.75], [r * 0.34, y + rise * 0.95], [0, y + rise]], n, 1.5);

const PARTS = {
  // ================= A) Şadırvan =================
  sadirvan: (p) => sadirvan(p, 8, 3.2, 4.5, 3.1, { basin: 1.5, basinH: 1.25, colR: 0.13, archH: 1.1, roof: 'kursun', alem: 0.74, dome: [[4.5, 0], [3.3, 0.35], [3.1, 0.75], [2.4, 1.2], [1.3, 1.55], [0, 1.72]] }),
  sadirvan_kucuk: (p) => sadirvan(p, 6, 1.75, 2.5, 1.95, { basin: 0.8, basinH: 1.05, colR: 0.1, archH: 0.65, roof: 'kiremit', alem: 0.4, dome: [[2.5, 0], [0.25, 1.02], [0, 1.1]] }),
  abdest_taburesi: (p) => {
    box(p, 'mermer', -0.17, 0.17, 0, 0.3, -0.17, 0.17, ['+x', '-x', '+z', '-z', '-y'], 1);
    box(p, 'mermer', -0.2, 0.2, 0.3, 0.35, -0.2, 0.2, ALL, 1);
  },
  musluk_tasi: (p) => {
    box(p, 'mermer', -0.6, 0.6, 0, 1.3, 0, 0.14, ALL, 1.2);
    for (const [a, b, c] of [[V(-0.6, 1.3, 0.14), V(0.6, 1.3, 0.14), V(0, 1.6, 0.14)], [V(-0.6, 1.3, 0), V(0.6, 1.3, 0), V(0, 1.6, 0)]]) tri(p, 'mermer', [a, b, c], V(0, 0, a.z ? 1 : -1), 1.2);
    for (const s of [-1, 1]) quad(p, 'mermer', [V(s * 0.6, 1.3, 0), V(s * 0.6, 1.3, 0.14), V(0, 1.6, 0.14), V(0, 1.6, 0)], V(s, 1, 0), 1.2);
    archFill(p, 'karanlik', 0, 0.6, 0.5, 0.6, 0.142);
    tap(p, 0, 0.78, 0.14, V(0, 0, 1));
    openBox(p, 'mermer', -0.55, 0.55, 0.14, 0.5, 0, 0.42, 0.06, 'su');
  },
  // ================= B) Sundurma ve köşk =================
  sundurma_acik: (p) => sundurma(p, 3, 2, [[-2.55, -1.55], [2.55, -1.55], [-2.55, 1.55], [2.55, 1.55]]),
  sundurma_uzun: (p) => sundurma(p, 4.5, 2, [[-4.05, -1.55], [0, -1.55], [4.05, -1.55], [-4.05, 1.55], [0, 1.55], [4.05, 1.55]]),
  sundurma_tasli: (p) => {
    box(p, 'kesme_tas', -3, 3, 0, 0.5, -2, 2, ['+x', '-x', '+z', '-z', '+y'], 1.5);
    for (let k = 0; k < 3; k++) box(p, 'mermer', -1, 1, 0, 0.5 - (k + 1) * 0.125, 2 + k * 0.3, 2 + (k + 1) * 0.3, ['+x', '-x', '+z', '+y'], 1.5);
    sundurma(p, 3, 2, [[-2.55, -1.55], [2.55, -1.55], [-2.55, 1.55], [2.55, 1.55]], 0.5);
  },
  namazgah: (p) => { // mihrap taşı arka (-Z) kenarda
    box(p, 'kesme_tas', -1.96, 1.96, 0, 0.4, -1.96, 1.96, ['+x', '-x', '+z', '-z', '+y'], 1.5);
    box(p, 'mermer', -2, 2, 0.32, 0.4, -2, 2, [...SIDES, '+y', '-y'], 1.5);
    box(p, 'mermer', -0.5, 0.5, 0.4, 1.5, -1.95, -1.77, ALL, 1.2);
    for (const z of [-1.95, -1.77]) tri(p, 'mermer', [V(-0.5, 1.5, z), V(0.5, 1.5, z), V(0, 1.85, z)], V(0, 0, z > -1.9 ? 1 : -1), 1.2);
    for (const s of [-1, 1]) quad(p, 'mermer', [V(s * 0.5, 1.5, -1.95), V(s * 0.5, 1.5, -1.77), V(0, 1.85, -1.77), V(0, 1.85, -1.95)], V(s, 1, 0), 1.2);
    archFill(p, 'karanlik', 0, 0.45, 0.6, 1.0, -1.768);
    box(p, 'mermer', -0.5, 0.5, 0.4, 0.52, -1.77, -1.45, ['+x', '-x', '+z', '+y'], 1.2);
  },
  muvakkithane: (p) => {
    const W = 2.38;
    box(p, 'kesme_tas', -W, W, 0, 3.2, -W, W, SIDES, 1.5);
    box(p, 'mermer', -W - 0.06, W + 0.06, 0, 0.4, -W - 0.06, W + 0.06, [...SIDES, '+y'], 1.5);
    box(p, 'mermer', -2.5, 2.5, 3.2, 3.5, -2.5, 2.5, ALL, 1.5);
    ring(p, 'kesme_tas', 8, 2.2, 3.5, 2.2, 3.75);
    dome(p, 0, 0, 2.2, 3.75, 0.9);
    alem(p, 0, 0, 4.6, 0.42);
    const faces = [[V(0, 0, W), V(1, 0, 0), V(0, 0, 1)], [V(W, 0, 0), V(0, 0, -1), V(1, 0, 0)], [V(0, 0, -W), V(-1, 0, 0), V(0, 0, -1)], [V(-W, 0, 0), V(0, 0, 1), V(-1, 0, 0)]];
    faces.forEach(([c, r, n], i) => {
      const at = (a, y, d) => c.clone().addScaledVector(r, a).addScaledVector(n, d).setY(y);
      const pane = (mat, cx, w, y0, hh, d) => { // sivri kemerli pano
        const pts = [[-w / 2, 0], [w / 2, 0], [w / 2, hh * 0.6], [w * 0.28, hh * 0.86], [0, hh], [-w * 0.28, hh * 0.86], [-w / 2, hh * 0.6]];
        for (let k = 1; k + 1 < pts.length; k++) p.tri(mat, [pts[0], pts[k], pts[k + 1]].map(([x, y]) => at(cx + x, y0 + y, d)), [pts[0], pts[k], pts[k + 1]].map(([x, y]) => [x / 0.6, y / 0.6]), n);
      };
      if (i === 0) {
        pane('mermer', 0, 1.7, 0, 2.9, 0.03);
        p.quad('ahsap_kapi', [at(-0.55, 0, 0.05), at(0.55, 0, 0.05), at(0.55, 2.1, 0.05), at(-0.55, 2.1, 0.05)], FLAT, n);
      } else for (const cx of [-1.1, 1.1]) {
        pane('mermer', cx, 1.3, 0.75, 2.2, 0.03);
        pane('demir_parmaklik', cx, 1.0, 0.9, 1.9, 0.05);
      }
    });
  },
  // ================= C) Avlu kapısı ve duvar ekleri =================
  avlu_kapisi_buyuk: (p) => { // yan kanatlar z 0 … 0,45; ortadaki kapı kütlesi öne (+Z) taşar, sırt z = 0
    const F = 0.9;
    for (const s of [-1, 1]) {
      wallBox(p, s < 0 ? -3 : 1.5, s < 0 ? -1.5 : 3, 0, 4.2);
      box(p, 'mermer', s * 1.5 - 0.22, s * 1.5 + 0.22, 0, 2.7, 0, F, ALL, 1.5); // geçit söveleri
      box(p, 'mermer', s < 0 ? -3 : 2.6, s < 0 ? -2.6 : 3, 0, 4.2, 0, WT + 0.04, ALL, 1.5);
    }
    archPanel(p, 'kesme_tas', V(-1.5, 0, F / 2), V(1.5, 0, F / 2), 2.7, 4.2, F, 8, 0.02);
    box(p, 'mermer', -3, 3, 4.2, 4.45, 0, WT + 0.1, ALL, 1.5);
    box(p, 'mermer', -1.95, 1.95, 4.2, 4.45, 0, F + 0.08, ALL, 1.5);
    box(p, 'kesme_tas', -1.9, 1.9, 4.45, 5.15, 0, F, ALL, 1.5);
    p.quad('kitabe', [V(-1.5, 4.55, F + 0.012), V(1.5, 4.55, F + 0.012), V(1.5, 5.05, F + 0.012), V(-1.5, 5.05, F + 0.012)], FLAT, V(0, 0, 1));
    box(p, 'mermer', -2.0, 2.0, 5.15, 5.27, 0, F + 0.08, ALL, 1.5);
    dome(p, 0, F / 2, 0.37, 5.27, 0.34, 8);
    alem(p, 0, F / 2, 5.56, 0.44);
  },
  duvar_cesmeli: (p) => {
    wallBox(p, -1.5, 1.5, 0, 3);
    box(p, 'mermer', -0.7, 0.7, 0, 2.2, WT, WT + 0.1, ['+x', '-x', '+z', '+y'], 1.2);
    box(p, 'mermer', -0.8, 0.8, 2.2, 2.34, WT, WT + 0.16, ['+x', '-x', '+z', '+y', '-y'], 1.2);
    archFill(p, 'karanlik', 0, 0.75, 0.7, 1.2, WT + 0.102);
    tap(p, 0, 0.95, WT + 0.1, V(0, 0, 1));
    openBox(p, 'mermer', -0.65, 0.65, WT + 0.1, WT + 0.6, 0, 0.45, 0.07, 'su');
  },
  duvar_parmaklikli: (p) => { // açıklık gerçek boşluk; parmaklık çubukları geometri
    wallBox(p, -1.5, -1.05, 0, 3);
    wallBox(p, 1.05, 1.5, 0, 3);
    wallBox(p, -1.05, 1.05, 0, 0.7);
    box(p, 'mermer', -1.1, 1.1, 0.7, 0.8, 0, WT + 0.04, ALL, 1.5);
    archPanel(p, 'kesme_tas', V(-1.05, 0, WT / 2), V(1.05, 0, WT / 2), 1.9, 3, WT, 8, 0.02);
    for (let k = 0; k < 7; k++) beam(p, 'demir', V(-0.78 + k * 0.26, 0.8, WT / 2), V(-0.78 + k * 0.26, 2.5 - Math.abs(k - 3) * 0.16, WT / 2), 0.03, 0.03, false);
    for (const y of [1.15, 1.75]) beam(p, 'demir', V(-1.03, y, WT / 2), V(1.03, y, WT / 2), 0.035, 0.035, false);
  },
  duvar_kubbeli_kose: (p) => {
    box(p, 'kesme_tas', -1.9, 1.9, 0, 3.6, -1.9, 1.9, SIDES, 1.5);
    box(p, 'mermer', -1.95, 1.95, 0, 0.4, -1.95, 1.95, [...SIDES, '+y'], 1.5);
    box(p, 'mermer', -2, 2, 3.6, 3.85, -2, 2, ALL, 1.5);
    ring(p, 'kesme_tas', 8, 1.75, 3.85, 1.75, 4.05);
    dome(p, 0, 0, 1.75, 4.05, 0.95);
    alem(p, 0, 0, 5.0, 0.5);
    for (const [c, r, n] of [[V(0, 0, 1.9), V(1, 0, 0), V(0, 0, 1)], [V(1.9, 0, 0), V(0, 0, -1), V(1, 0, 0)], [V(0, 0, -1.9), V(-1, 0, 0), V(0, 0, -1)], [V(-1.9, 0, 0), V(0, 0, 1), V(-1, 0, 0)]]) {
      const at = (a, y, d) => c.clone().addScaledVector(r, a).addScaledVector(n, d).setY(y);
      p.quad('mermer', [at(-0.65, 1.0, 0.03), at(0.65, 1.0, 0.03), at(0.65, 2.9, 0.03), at(-0.65, 2.9, 0.03)], FLAT, n);
      p.quad('demir_parmaklik', [at(-0.5, 1.15, 0.05), at(0.5, 1.15, 0.05), at(0.5, 2.75, 0.05), at(-0.5, 2.75, 0.05)], FLAT, n);
    }
  },
  duvar_alcak: (p) => {
    wallBox(p, -1.5, 1.5, 0, 1.0);
    for (const [z0, z1, n] of [[0, WT / 2, -1], [WT + 0.05, WT / 2, 1]]) quad(p, 'mermer', [V(-1.5, 1.0, z0), V(1.5, 1.0, z0), V(1.5, 1.2, z1), V(-1.5, 1.2, z1)], V(0, 1, n));
    for (const x of [-1.5, 1.5]) tri(p, 'mermer', [V(x, 1.0, 0), V(x, 1.0, WT + 0.05), V(x, 1.2, WT / 2)], V(x, 0, 0));
    quad(p, 'mermer', [V(-1.5, 1.0, 0), V(1.5, 1.0, 0), V(1.5, 1.0, WT + 0.05), V(-1.5, 1.0, WT + 0.05)], V(0, -1, 0));
  },
  duvar_alcak_kose: (p) => {
    box(p, 'kesme_tas', -0.22, 0.22, 0, 1.2, -0.22, 0.22, ['+x', '-x', '+z', '-z', '-y'], 1.5);
    box(p, 'mermer', -0.25, 0.25, 1.2, 1.27, -0.25, 0.25, ALL, 1.5);
    ring(p, 'mermer', 4, 0.25, 1.27, 0, 1.4);
  },
  // ================= D) Meydan döşemesi ve küçük yapılar =================
  merdiven_genis: (p) => { // sırtı (üst) z = 0; +Z'ye doğru iner
    for (let k = 0; k < 5; k++) box(p, 'mermer', -3, 3, 0, 0.8 - k * 0.16, k * 0.35, (k + 1) * 0.35, ['+x', '-x', '+z', '+y'], 1.5);
    quad(p, 'mermer', [V(-3, 0, 0), V(3, 0, 0), V(3, 0.8, 0), V(-3, 0.8, 0)], V(0, 0, -1));
  },
  tas_seki: (p) => rings(p, 'kesme_tas', 8, [[1.44, 0], [1.44, 0.37], [1.5, 0.37, 'mermer'], [1.5, 0.45, 'mermer'], [0.5, 0.45], [0.5, 0]]),
  dikili_tas: (p) => {
    box(p, 'kesme_tas', -0.6, 0.6, 0, 0.6, -0.6, 0.6, ['+x', '-x', '+z', '-z', '+y'], 1.2);
    box(p, 'mermer', -0.5, 0.5, 0.6, 0.85, -0.5, 0.5, ['+x', '-x', '+z', '-z', '+y'], 1.2);
    rings(p, 'kesme_tas', 4, [[0.36, 0.85], [0.24, 5.55], [0, 6.0]], 1.2);
  },
  bayrak_diregi: (p) => {
    box(p, 'kesme_tas', -0.45, 0.45, 0, 0.5, -0.45, 0.45, ['+x', '-x', '+z', '-z', '+y'], 1.2);
    box(p, 'mermer', -0.3, 0.3, 0.5, 0.8, -0.3, 0.3, ['+x', '-x', '+z', '-z', '+y'], 1.2);
    lathe(p, 'kereste', 0, 0, [[0.11, 0.8], [0.06, 8.6]], 6);
    alem(p, 0, 0, 8.55, 0.47);
  },
  nobetci_kulubesi: (p) => { // önü (+Z) açık
    const W = 0.54;
    box(p, 'tahta', -W, W, 0, 0.06, -W, W, ALL, 1);
    box(p, 'tahta', -W, W, 0.06, 2.0, -W, -W + 0.05, ALL, 1);
    for (const s of [-1, 1]) box(p, 'tahta', s < 0 ? -W : W - 0.05, s < 0 ? -W + 0.05 : W, 0.06, 2.0, -W + 0.05, W, ALL, 1);
    box(p, 'kereste', -W, W, 1.8, 2.0, W - 0.05, W, ALL, 1);
    quad(p, 'tahta', [V(-0.6, 2.0, -0.6), V(0.6, 2.0, -0.6), V(0.6, 2.0, 0.6), V(-0.6, 2.0, 0.6)], V(0, -1, 0), 1);
    rings(p, 'tahta', 4, [[0.6, 2.0], [0.6, 2.06], [0, 2.6]], 1);
  },
  meydan_feneri: (p) => {
    box(p, 'kesme_tas', -0.25, 0.25, 0, 0.5, -0.25, 0.25, ['+x', '-x', '+z', '-z', '+y'], 1.2);
    lathe(p, 'demir', 0, 0, [[0.13, 0.5], [0.07, 0.8], [0.05, 1.2], [0.04, 4.1], [0.1, 4.2]], 6);
    rings(p, 'fener_cami', 4, [[0.12, 4.2], [0.2, 4.65], [0.25, 4.67, 'demir'], [0, 4.95, 'demir']], 1);
    for (let k = 0; k < 4; k++) { const a = vert(4, k, 0.12, 4.2), b = vert(4, k, 0.2, 4.65); beam(p, 'demir', a, b, 0.02, 0.02, false); }
  },
  sinir_tasi: (p) => lathe(p, 'mermer', 0, 0, [[0.175, 0], [0.15, 0.6], [0.175, 0.66], [0.16, 0.8], [0, 0.9]], 8),
  mezar_hazire: (p) => { // taş seki, alçak demir parmaklık, üç kavuklu mezar taşı
    box(p, 'kesme_tas', -1.5, 1.5, 0, 0.25, -1.5, 1.5, ['+x', '-x', '+z', '-z', '+y'], 1.5);
    const c = [[-1.4, -1.4], [1.4, -1.4], [1.4, 1.4], [-1.4, 1.4]];
    c.forEach(([x, z], i) => {
      const [x1, z1] = c[(i + 1) % 4];
      box(p, 'demir', x - 0.03, x + 0.03, 0.25, 1.15, z - 0.03, z + 0.03, SIDES, 1);
      for (const y of [0.42, 1.0]) beam(p, 'demir', V(x, y, z), V(x1, y, z1), 0.03, 0.02, false);
      for (let k = 1; k < 3; k++) beam(p, 'demir', V(x + ((x1 - x) * k) / 3, 0.42, z + ((z1 - z) * k) / 3), V(x + ((x1 - x) * k) / 3, 1.1, z + ((z1 - z) * k) / 3), 0.02, 0.02, false);
    });
    for (const [x, z, h] of [[-0.7, -0.3, 1.1], [0, -0.5, 1.3], [0.7, -0.2, 0.95]]) {
      box(p, 'mermer', x - 0.16, x + 0.16, 0.25, h, z - 0.04, z + 0.04, ['+x', '-x', '+z', '-z', '+y'], 1);
      box(p, 'mermer', x - 0.11, x + 0.11, h + 0.08, h + 0.3, z - 0.09, z + 0.09, ALL, 1); // kavuk
    }
  },
};
const kit = K.makeKit('meydan_kiti', PARTS, M);
export const PARCALAR = kit.names, createParca = kit.create;
// Bütün parçalar ızgarada, aralarında 5 m boşluk
export function createKit() {
  const root = new THREE.Group();
  root.name = 'meydan_kiti';
  let x = 0, z = 0, depth = 0;
  for (const name of PARCALAR) {
    const m = createParca(name);
    m.geometry.computeBoundingBox();
    const b = m.geometry.boundingBox;
    if (x > 50) { x = 0; z += depth + 5; depth = 0; }
    m.position.set(x - b.min.x, 0, z - b.min.z);
    x += b.max.x - b.min.x + 5;
    depth = Math.max(depth, b.max.z - b.min.z);
    root.add(m);
  }
  root.position.set(-30, 0, -z / 2);
  return root;
}
export function createOrnek() {
  const root = new THREE.Group();
  root.name = 'ornek_meydan';
  const put = (make, part, x, z, rot = 0, y = 0) => {
    const m = make(part);
    m.position.set(x, y, z);
    m.rotation.y = rot;
    root.add(m);
  };
  const Q = Math.PI / 2, own = createParca, sw = sebil.createParca;
  // Arka avlu duvarı (önü +Z): ortada büyük kapı, yanlarda duvar modülleri, köşede kubbeli oda
  put(own, 'avlu_kapisi_buyuk', 0, -12);
  [['duvar_cesmeli', -4.5], ['duvar_parmaklikli', -7.5], ['tas_duvar_pencere', -10.5], ['duvar_parmaklikli', 4.5], ['tas_duvar_2pencere', 7.5], ['duvar_cesmeli', 10.5]].forEach(([part, x]) => {
    if (part.startsWith('tas_')) { put(sw, part, x, -12 + 0.45); put(sw, 'tas_sacak', x, -12 + 0.45, 0, 3); } // sebil kitinin duvarı: önü z = 0
    else put(own, part, x, -12);
  });
  put(own, 'duvar_kubbeli_kose', -14, -10.2);
  put(own, 'muvakkithane', 14.5, -8.5, -Q);
  put(own, 'sadirvan', 0, 0);
  for (let k = 0; k < 8; k++) put(own, 'abdest_taburesi', Math.cos((k / 8) * TAU) * 2.2, Math.sin((k / 8) * TAU) * 2.2);
  put(own, 'sundurma_uzun', -11, 1, Q);
  put(own, 'sundurma_tasli', 11.5, 3, Q);
  put(own, 'sadirvan_kucuk', 12, 12);
  put(own, 'namazgah', -11, 11.5);
  put(own, 'tas_seki', -4.5, 9);
  put(own, 'dikili_tas', 5.5, 9.5);
  put(own, 'mezar_hazire', -14.5, -5.5);
  put(own, 'nobetci_kulubesi', 3.2, -10.6);
  put(own, 'meydan_feneri', -3.6, -10.4);
  put(own, 'meydan_feneri', 6, 4.5);
  put(own, 'bayrak_diregi', -6, 4.5);
  put(own, 'musluk_tasi', -12.5, -8.2, Q);
  put(own, 'merdiven_genis', 0, 16.5);
  for (const x of [-7.5, -4.5, 4.5, 7.5]) put(own, 'duvar_alcak', x, 16.05);
  for (const x of [-9.25, -3, 3, 9.25]) put(own, 'duvar_alcak_kose', x, 16.3);
  for (const x of [-2.6, 2.6]) for (const z of [18.6, 20]) put(own, 'sinir_tasi', x, z);
  return root;
}
