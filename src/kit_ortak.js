import * as THREE from 'three';
import { canvasTexture } from './halk2.js';
import { Part } from './arapcami.js';

// Modüler köy kitleri için ortak altyapı: doku boyayıcılar, parça yardımcıları, kit ve örnek ev kurucu.
// Kurallar: birim metre, Y yukarı, modül 3,0 m. Duvar parçası: orijin alt kenarın ortası, dış yüz +Z,
// gövde Z -0,25 … 0. Çatı parçası: orijin modülün ortasında, duvar üst kotunda.

export { Part };
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const TAU = Math.PI * 2;
export const ALL = ['+x', '-x', '+z', '-z', '+y', '-y'], OUT = ['+x', '-x', '+z', '+y', '-y'], SIDES = ['+x', '-x', '+z', '-z'];
export const FLAT = [[0, 0], [1, 0], [1, 1], [0, 1]];
export function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ---------- Doku boyayıcılar (hepsi g, w, h, rand alır) ----------
const grain = (g, w, h, rand, vertical, count, alpha = 1) => {
  for (let i = 0; i < count; i++) {
    g.fillStyle = `rgba(${rand() < 0.6 ? '24,14,8' : '210,190,160'},${(0.05 + rand() * 0.12) * alpha})`;
    const len = 20 + rand() * 120, t = 1 + rand() * 2;
    if (vertical) g.fillRect(rand() * w, rand() * h, t, len);
    else g.fillRect(rand() * w, rand() * h, len, t);
  }
};
const tone = (rand, [r, gg, b], spread) => {
  const d = (rand() - 0.5) * spread;
  return `rgb(${r + d},${gg + d},${b + d})`;
};
const rubble = (g, x0, y0, w, h, rand, base = [128, 120, 106]) => {
  g.fillStyle = '#4a443a';
  g.fillRect(x0, y0, w, h);
  for (let y = y0; y < y0 + h; y += 17) {
    let x = x0 - rand() * 20;
    while (x < x0 + w) {
      const bw = 18 + rand() * 26;
      g.fillStyle = tone(rand, base, 50);
      g.beginPath();
      g.roundRect(x + 1.5, y + 1.5 + rand() * 2, bw - 3, 14 - rand() * 2, 5);
      g.fill();
      x += bw;
    }
  }
};
const stains = (g, w, h, rand, n, color = '40,30,18', lo = 0.05, hi = 0.14) => {
  g.filter = 'blur(8px)';
  for (let i = 0; i < n; i++) {
    g.fillStyle = `rgba(${color},${lo + rand() * (hi - lo)})`;
    g.beginPath();
    g.ellipse(rand() * w, rand() * h, 10 + rand() * 30, 10 + rand() * 30, 0, 0, TAU);
    g.fill();
  }
  g.filter = 'none';
};
export const PAINT = {
  // Yığma kütük: 5 kütük / karo (karo 1,5 m)
  kutuk: (g, w, h, rand) => {
    for (let k = 0; k < 5; k++) {
      const y = (k * h) / 5, grad = g.createLinearGradient(0, y, 0, y + h / 5), v = 0.85 + rand() * 0.3;
      grad.addColorStop(0, `rgb(${40 * v},${30 * v},${22 * v})`);
      grad.addColorStop(0.45, `rgb(${112 * v},${88 * v},${64 * v})`);
      grad.addColorStop(1, `rgb(${30 * v},${22 * v},${16 * v})`);
      g.fillStyle = grad;
      g.fillRect(0, y, w, h / 5);
    }
    grain(g, w, h, rand, false, 160);
  },
  // Dikey tahta kaplama: 8 tahta / karo, aralarda çıta
  tahta: (g, w, h, rand, base = [104, 88, 70]) => {
    for (let k = 0; k < 8; k++) {
      g.fillStyle = tone(rand, base, 36);
      g.fillRect((k * w) / 8, 0, w / 8, h);
      g.fillStyle = 'rgba(20,14,8,0.75)';
      g.fillRect((k * w) / 8, 0, 2, h);
      g.fillStyle = 'rgba(210,190,160,0.18)';
      g.fillRect((k * w) / 8 + 2, 0, 1.5, h);
    }
    grain(g, w, h, rand, true, 200);
  },
  // Yatay tahta (döşeme, kapak)
  tahta_yatay: (g, w, h, rand, base = [112, 92, 68]) => {
    for (let k = 0; k < 8; k++) {
      g.fillStyle = tone(rand, base, 34);
      g.fillRect(0, (k * h) / 8, w, h / 8);
      g.fillStyle = 'rgba(20,14,8,0.7)';
      g.fillRect(0, (k * h) / 8, w, 2);
    }
    grain(g, w, h, rand, false, 200);
  },
  kereste: (g, w, h, rand, base = [70, 52, 38]) => {
    g.fillStyle = `rgb(${base})`;
    g.fillRect(0, 0, w, h);
    grain(g, w, h, rand, false, 260);
  },
  // Hartama: üst üste binen ince tahta pullar
  hartama: (g, w, h, rand) => {
    for (let r = 0; r < 8; r++) for (let k = -1; k < 9; k++) {
      const x = (k * w) / 8 + (r % 2) * (w / 16), y = (r * h) / 8;
      g.fillStyle = tone(rand, [92, 84, 74], 40);
      g.fillRect(x, y, w / 8, h / 8);
      g.fillStyle = 'rgba(18,14,10,0.7)';
      g.fillRect(x, y, 1.5, h / 8);
      g.fillRect(x, y + h / 8 - 4, w / 8, 4);
    }
    grain(g, w, h, rand, true, 120);
  },
  tas: (g, w, h, rand) => rubble(g, 0, 0, w, h, rand),
  cam: (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#34424e');
    grad.addColorStop(1, '#161c22');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#3a2a1e';
    g.lineWidth = 7;
    g.strokeRect(w / 2, 0, 0.01, h);
    g.strokeRect(0, h / 2, w, 0.01);
  },
  kapi: (g, w, h, rand) => {
    for (let k = 0; k < 6; k++) {
      g.fillStyle = tone(rand, [92, 70, 50], 30);
      g.fillRect((k * w) / 6, 0, w / 6, h);
      g.fillStyle = 'rgba(16,10,6,0.8)';
      g.fillRect((k * w) / 6, 0, 2, h);
    }
    grain(g, w, h, rand, true, 80);
    g.fillStyle = '#3a2a1c';
    for (const y of [0.14, 0.8]) g.fillRect(0, h * y, w, h * 0.07);
    g.fillStyle = '#14100c';
    g.fillRect(w * 0.82, h * 0.48, w * 0.08, h * 0.04);
  },
  // Çift kanatlı ahır kapısı: her kanatta çapraz kuşak
  cift_kapi: (g, w, h, rand) => {
    for (let k = 0; k < 10; k++) {
      g.fillStyle = tone(rand, [96, 80, 62], 34);
      g.fillRect((k * w) / 10, 0, w / 10, h);
      g.fillStyle = 'rgba(16,10,6,0.8)';
      g.fillRect((k * w) / 10, 0, 2, h);
    }
    grain(g, w, h, rand, true, 100);
    g.strokeStyle = '#3e2e20';
    g.lineWidth = h * 0.05;
    for (const x0 of [0, w / 2]) {
      g.strokeRect(x0 + 3, h * 0.1, w / 2 - 6, 0.01);
      g.strokeRect(x0 + 3, h * 0.9, w / 2 - 6, 0.01);
      g.beginPath();
      g.moveTo(x0 + 4, h * 0.9);
      g.lineTo(x0 + w / 2 - 4, h * 0.1);
      g.stroke();
    }
    g.fillStyle = '#0c0a08';
    g.fillRect(w / 2 - 2, 0, 4, h);
    for (const x of [6, w - 12]) for (const y of [0.12, 0.88]) g.fillRect(x, h * y - 5, 6, 10); // menteşeler
  },
  kafes: (g, w, h) => {
    g.fillStyle = '#14181c';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#6a4e34';
    g.lineWidth = 7;
    for (let i = -h; i < w; i += 32) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i + h, h);
      g.moveTo(i + h, 0);
      g.lineTo(i, h);
      g.stroke();
    }
  },
  // Kerpiç duvar: doku duvarın tümünü (3 × 3 m) kaplar. kaide: alttaki taş yüksekliği (m); dokuk: sıva dökük
  kerpic: (g, w, h, rand, kaide = 0, dokuk = false) => {
    g.fillStyle = '#b89c6c';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { // saman kırıntıları ve pütür
      g.fillStyle = `rgba(${rand() < 0.5 ? '226,204,150' : '120,96,60'},${0.1 + rand() * 0.2})`;
      g.fillRect(rand() * w, rand() * h, 1 + rand() * 4, 1);
    }
    stains(g, w, h, rand, 26, '236,214,170', 0.04, 0.12);
    stains(g, w, h, rand, 20);
    const bricks = (x0, y0, bw, bh) => {
      g.save();
      g.beginPath();
      g.ellipse(x0, y0, bw, bh, rand(), 0, TAU);
      g.clip();
      g.fillStyle = '#5a4630';
      g.fillRect(0, 0, w, h);
      for (let r = 0; r < h / 9; r++) for (let k = -1; k < w / 24 + 1; k++) {
        g.fillStyle = tone(rand, [150, 118, 78], 30);
        g.fillRect(k * 24 + (r % 2) * 12 + 1, r * 9 + 1, 22, 7);
      }
      g.restore();
    };
    if (dokuk) for (const [x, y, a, b] of [[70, 150, 60, 44], [190, 90, 46, 60], [150, 200, 70, 30], [40, 60, 30, 30]]) bricks(x, y, a, b);
    else for (let i = 0; i < 2; i++) bricks(rand() * w, h * (0.3 + rand() * 0.5), 10 + rand() * 12, 8 + rand() * 10);
    for (let m = 1; m <= 3; m++) { // her metrede ahşap hatıl
      const y = h - (m * h) / 3;
      g.fillStyle = '#3e2c1c';
      g.fillRect(0, y, w, 7);
      g.fillStyle = 'rgba(180,150,110,0.25)';
      g.fillRect(0, y + 1, w, 1.5);
    }
    if (kaide) rubble(g, 0, h - (kaide / 3) * h, w, (kaide / 3) * h, rand);
    const wet = g.createLinearGradient(0, h, 0, h * 0.72); // dipte yağmurdan koyulaşma
    wet.addColorStop(0, 'rgba(50,36,22,0.55)');
    wet.addColorStop(1, 'rgba(50,36,22,0)');
    g.fillStyle = wet;
    g.fillRect(0, h * 0.72, w, h * 0.28);
  },
  toprak: (g, w, h, rand, base = '#7c6646') => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1600; i++) {
      g.fillStyle = `rgba(${rand() < 0.5 ? '50,38,24' : '170,150,110'},${0.12 + rand() * 0.25})`;
      g.beginPath();
      g.ellipse(rand() * w, rand() * h, 1 + rand() * 3, 1 + rand() * 2, 0, 0, TAU);
      g.fill();
    }
    stains(g, w, h, rand, 12);
  },
  // Çalı, saman, saz: yönlü lifler
  lif: (g, w, h, rand, base, colors, n, len, vertical) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      g.strokeStyle = colors[Math.floor(rand() * colors.length)];
      g.lineWidth = 0.8 + rand() * 1.4;
      const x = rand() * w, y = rand() * h, a = (vertical ? Math.PI / 2 : 0) + (rand() - 0.5) * 0.5, l = len * (0.5 + rand());
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
  },
  kiremit: (g, w, h, rand) => {
    for (let r = 0; r < 6; r++) for (let k = 0; k < 10; k++) {
      const c = [150 + rand() * 40, 84 + rand() * 26, 56 + rand() * 18], x = (k * w) / 10, y = (r * h) / 6, grad = g.createLinearGradient(x, 0, x + w / 10, 0);
      grad.addColorStop(0, `rgb(${c.map((v) => v * 0.5)})`);
      grad.addColorStop(0.45, `rgb(${c})`);
      grad.addColorStop(1, `rgb(${c.map((v) => v * 0.6)})`);
      g.fillStyle = grad;
      g.fillRect(x, y, w / 10, h / 6);
      g.fillStyle = 'rgba(30,14,8,0.5)';
      g.fillRect(x, y + h / 6 - 4, w / 10, 4);
    }
  },
  // Dal örgü: yatay dallar, dikmelerin önünden arkasından geçer
  orgu: (g, w, h, rand) => {
    g.fillStyle = '#2a2016';
    g.fillRect(0, 0, w, h);
    for (let r = 0; r < 20; r++) {
      g.strokeStyle = tone(rand, [116, 92, 62], 40);
      g.lineWidth = 9;
      g.beginPath();
      for (let x = 0; x <= w; x += 8) g.lineTo(x, r * 13 + 6 + Math.sin((x / w) * TAU * 4 + r * Math.PI) * 3);
      g.stroke();
    }
  },
  // Aralıklı tahta: aralar koyu. yatay: samanlık (aralardan saman taşar); taş: alttaki taş kaide (m, 3 m'lik dokuda)
  aralikli: (g, w, h, rand, yatay = false, kaide = 0) => {
    g.fillStyle = '#17120e';
    g.fillRect(0, 0, w, h);
    const n = yatay ? 9 : 14;
    for (let k = 0; k < n; k++) {
      g.fillStyle = tone(rand, [118, 108, 94], 40);
      if (yatay) g.fillRect(0, (k * h) / n + 3, w, h / n - 6);
      else g.fillRect((k * w) / n + 2, 0, w / n - 4, h);
    }
    grain(g, w, h, rand, !yatay, 220);
    if (yatay) {
      g.strokeStyle = '#c9a850';
      for (let i = 0; i < 260; i++) {
        const x = rand() * w, y = (Math.floor(rand() * n) * h) / n;
        g.lineWidth = 1 + rand();
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + (rand() - 0.5) * 14, y + 4 + rand() * 12);
        g.stroke();
      }
    }
    if (kaide) rubble(g, 0, h - (kaide / 3) * h, w, (kaide / 3) * h, rand);
  },
  odun: (g, w, h, rand) => {
    g.fillStyle = '#241a12';
    g.fillRect(0, 0, w, h);
    for (let r = 0; r < 6; r++) for (let k = 0; k < 8; k++) {
      const x = k * 32 + (r % 2) * 16 + 16, y = r * 42 + 21, rr = 14 + rand() * 5;
      g.fillStyle = tone(rand, [176, 140, 96], 40);
      g.beginPath();
      g.moveTo(x - rr, y + rr * 0.8);
      g.lineTo(x + rr, y + rr * 0.8);
      g.lineTo(x + rr * 0.2 * (rand() - 0.5), y - rr);
      g.fill();
    }
  },
};
// Malzeme kümesi: defs = { ad: [boyayıcı ya da renk, w, h, ...ek argümanlar] }
export function materials(prefix, defs) {
  const M = {};
  let seed = 100;
  for (const [name, def] of Object.entries(defs)) {
    seed += 37;
    if (typeof def === 'number') M[name] = new THREE.MeshStandardMaterial({ name, color: def, roughness: 1, metalness: 0 });
    else {
      const [painter, w = 256, h = 256, ...args] = def, rand = rng(seed);
      M[name] = new THREE.MeshStandardMaterial({ name, map: canvasTexture(`${prefix}_${name}`, w, h, (g) => painter(g, w, h, rand, ...args)), roughness: 1, metalness: 0 });
    }
  }
  return M;
}

// ---------- Geometri yardımcıları ----------
export const box = (p, mat, x0, x1, y0, y1, z0, z1, faces = ALL, s = 1.5, sv = s) => p.box(mat, x0, x1, y0, y1, z0, z1, faces, s, sv);
// Duvar gövdesi: 3 m yüksek, 0,25 kalın. s: doku ölçüsü (3 = doku duvarın tümünü kaplar)
export const slab = (p, mat, hw = 1.5, h = 3, s = 1.5, sv = s) => box(p, mat, -hw, hw, 0, h, -0.25, 0, ALL, s, sv);
// Dış yüze çakılı kereste (z 0 … d)
export const lath = (p, x0, x1, y0, y1, d = 0.035, mat = 'kereste', faces = OUT) => box(p, mat, x0, x1, y0, y1, 0, d, faces, 1);
const planar = (pts, hint, s) => {
  const a = [Math.abs(hint.x), Math.abs(hint.y), Math.abs(hint.z)], m = Math.max(...a);
  return pts.map((q) => (a[1] === m ? [q.x / s, q.z / s] : a[2] === m ? [q.x / s, q.y / s] : [q.z / s, q.y / s]));
};
export const quad = (p, mat, pts, hint, s = 1.5) => p.quad(mat, pts, s ? planar(pts, hint, s) : FLAT, hint);
export const tri = (p, mat, pts, hint, s = 1.5) => p.tri(mat, pts, planar(pts, hint, s), hint);
// İki nokta arasında dikdörtgen kesitli kiriş (h: düşey yöndeki, t: yanal kalınlık)
export function beam(p, mat, a, b, h, t, caps = true) {
  const d = b.clone().sub(a), len = d.length();
  d.normalize();
  const u = Math.abs(d.y) < 0.99 ? V(0, 1, 0).addScaledVector(d, -d.y).normalize() : V(1, 0, 0), w = d.clone().cross(u);
  const c = (q, i, j) => q.clone().addScaledVector(u, (i * h) / 2).addScaledVector(w, (j * t) / 2);
  for (const [i0, j0, i1, j1, n] of [[1, -1, 1, 1, u], [-1, 1, -1, -1, u.clone().negate()], [1, 1, -1, 1, w], [-1, -1, 1, -1, w.clone().negate()]]) {
    p.quad(mat, [c(a, i0, j0), c(a, i1, j1), c(b, i1, j1), c(b, i0, j0)], [[0, 0], [0, 0.2], [len, 0.2], [len, 0]], n);
  }
  if (caps) for (const [q, n] of [[a, d.clone().negate()], [b, d]]) p.quad(mat, [c(q, -1, -1), c(q, 1, -1), c(q, 1, 1), c(q, -1, 1)], [[0, 0], [0.2, 0], [0.2, 0.2], [0, 0.2]], n);
}
// İki nokta arasında silindir
export function cyl(p, mat, a, b, r, n = 8, caps = true, capMat = mat) {
  const d = b.clone().sub(a), len = d.length();
  d.normalize();
  const u = Math.abs(d.y) < 0.99 ? V(0, 1, 0).addScaledVector(d, -d.y).normalize() : V(1, 0, 0), w = d.clone().cross(u);
  const c = (q, k) => q.clone().addScaledVector(u, Math.cos((k / n) * TAU) * r).addScaledVector(w, Math.sin((k / n) * TAU) * r);
  for (let k = 0; k < n; k++) {
    const m = u.clone().multiplyScalar(Math.cos(((k + 0.5) / n) * TAU)).addScaledVector(w, Math.sin(((k + 0.5) / n) * TAU));
    p.quad(mat, [c(a, k), c(a, k + 1), c(b, k + 1), c(b, k)], [[k / n, 0], [(k + 1) / n, 0], [(k + 1) / n, len], [k / n, len]], m);
    if (caps) {
      p.tri(capMat, [a, c(a, k), c(a, k + 1)], [[0.5, 0.5], [0.5 + 0.5 * Math.cos((k / n) * TAU), 0.5 + 0.5 * Math.sin((k / n) * TAU)], [0.5 + 0.5 * Math.cos(((k + 1) / n) * TAU), 0.5 + 0.5 * Math.sin(((k + 1) / n) * TAU)]], d.clone().negate());
      p.tri(capMat, [b, c(b, k), c(b, k + 1)], [[0.5, 0.5], [0.5 + 0.5 * Math.cos((k / n) * TAU), 0.5 + 0.5 * Math.sin((k / n) * TAU)], [0.5 + 0.5 * Math.cos(((k + 1) / n) * TAU), 0.5 + 0.5 * Math.sin(((k + 1) / n) * TAU)]], d);
    }
  }
}
// Dönel yüzey: prof [[r, y, mat?]]
export function lathe(p, mat, cx, cz, prof, n = 10, s = 1) {
  let run = 0;
  for (let j = 0; j + 1 < prof.length; j++) {
    const [r0, y0, m = mat] = prof[j], [r1, y1] = prof[j + 1], len = Math.hypot(r1 - r0, y1 - y0);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU, b = ((k + 1) / n) * TAU, at = (r, y, t) => V(cx + Math.cos(t) * r, y, cz + Math.sin(t) * r);
      const hint = V(Math.cos((a + b) / 2), Math.abs(y1 - y0) < 1e-6 ? (r1 < r0 ? 9 : -9) : (r1 < r0 ? 0.6 : -0.2), Math.sin((a + b) / 2));
      const uv = [[(k / n) * 3 * s, run / s], [((k + 1) / n) * 3 * s, run / s], [((k + 1) / n) * 3 * s, (run + len) / s], [(k / n) * 3 * s, (run + len) / s]];
      if (r1 < 1e-4) p.tri(m, [at(r0, y0, a), at(r0, y0, b), at(0, y1, a)], uv.slice(0, 3), hint);
      else if (r0 < 1e-4) p.tri(m, [at(0, y0, a), at(r1, y1, b), at(r1, y1, a)], [uv[0], uv[2], uv[3]], hint);
      else p.quad(m, [at(r0, y0, a), at(r0, y0, b), at(r1, y1, b), at(r1, y1, a)], uv, hint);
    }
    run += len;
  }
}
// Pencere: cam, çerçeve, denizlik. o: { glass, rep (kafes dokusu döşenir), head, shutters: 'acik' | 'kapali' | 'yarim', bars }
export function window(p, cx, y0, w, h, o = {}) {
  const x0 = cx - w / 2, x1 = cx + w / 2, f = 0.06, d = 0.05;
  p.quad(o.glass ?? 'pencere_cam', [V(x0, y0, 0.012), V(x1, y0, 0.012), V(x1, y0 + h, 0.012), V(x0, y0 + h, 0.012)], o.rep ? [[0, 0], [w * 1.5, 0], [w * 1.5, h * 1.5], [0, h * 1.5]] : FLAT, V(0, 0, 1));
  lath(p, x0 - f, x0, y0, y0 + h + f, d);
  lath(p, x1, x1 + f, y0, y0 + h + f, d);
  lath(p, x0, x1, y0 + h, y0 + h + f, d);
  lath(p, x0 - f - 0.03, x1 + f + 0.03, y0 - f, y0, 0.09);
  if (o.head) lath(p, x0 - f - 0.05, x1 + f + 0.05, y0 + h + f, y0 + h + f + 0.06, 0.11);
  if (o.bars) for (const t of [0.25, 0.5, 0.75]) lath(p, x0 + w * t - 0.018, x0 + w * t + 0.018, y0, y0 + h, 0.04, 'kereste', ['+x', '-x', '+z']);
  const leaf = (a, b, z1) => box(p, o.shutterMat ?? 'kepenk', a, b, y0, y0 + h, z1 - 0.03, z1, OUT, 0.75);
  if (o.shutters === 'acik') {
    leaf(x0 - f - w / 2, x0 - f, 0.03);
    leaf(x1 + f, x1 + f + w / 2, 0.03);
  } else if (o.shutters === 'kapali') {
    leaf(x0, cx - 0.008, 0.085);
    leaf(cx + 0.008, x1, 0.085);
  } else if (o.shutters === 'yarim') { // bir kanat kapalı, öteki açık
    leaf(x0, cx, 0.085);
    leaf(x1 + f, x1 + f + w / 2, 0.03);
  }
}
// Kapı: kanat dokusu, söveler, üstte lento
export function door(p, cx, w, h, mat = 'ahsap_kapi', o = {}) {
  const x0 = cx - w / 2, x1 = cx + w / 2, f = o.frame ?? 0.09;
  p.quad(mat, [V(x0, 0, 0.012), V(x1, 0, 0.012), V(x1, h, 0.012), V(x0, h, 0.012)], FLAT, V(0, 0, 1));
  lath(p, x0 - f, x0, 0, h, 0.07);
  lath(p, x1, x1 + f, 0, h, 0.07);
  lath(p, x0 - f - (o.lento ? 0.14 : 0), x1 + f + (o.lento ? 0.14 : 0), h, h + (o.lento ? 0.16 : f), o.lento ? 0.11 : 0.07);
}

// ---------- Ortak parçalar ----------
// Köşe kutusu (orijin iç noktada): gövde lo … hi
export const corner = (p, mat, lo, hi, h = 3, s = 1.5) => box(p, mat, lo, hi, 0, h, lo, hi, ['+x', '-x', '+z', '-z', '+y'], s);
export function katKusagi(p) {
  box(p, 'kereste', -1.5, 1.5, -0.12, 0.1, 0, 0.07, OUT, 1);
  for (let k = 0; k < 8; k++) {
    const x = -1.3 + k * (2.6 / 7);
    box(p, 'kereste', x - 0.055, x + 0.055, -0.24, -0.12, 0, 0.13, ['+x', '-x', '+z', '-y'], 1);
  }
}
export function cikmaTabani(p) {
  box(p, 'kereste', -1.5, 1.5, -0.16, 0, 0, 0.62, ALL, 1);
  for (const x of [-1.3, -0.43, 0.43, 1.3]) beam(p, 'kereste', V(x, -0.94, 0.05), V(x, -0.2, 0.52), 0.11, 0.1, false);
}
export const doseme = (p, mat) => box(p, mat, -1.5, 1.5, -0.1, 0, -1.5, 1.5, ALL, 1.5);
export function baca(p, mat, capMat) {
  box(p, mat, -0.3, 0.3, 0, 1.5, -0.3, 0.3, SIDES, 1.5);
  box(p, capMat, -0.36, 0.36, 1.5, 1.63, -0.36, 0.36, ALL, 1.5);
  quad(p, 'karanlik', [V(-0.2, 1.632, -0.2), V(0.2, 1.632, -0.2), V(0.2, 1.632, 0.2), V(-0.2, 1.632, 0.2)], V(0, 1, 0));
}
export function merdiven(p, mat) {
  for (let k = 0; k < 3; k++) box(p, mat, -0.9, 0.9, 0, 0.54 - k * 0.18, k * 0.3, (k + 1) * 0.3, ['+x', '-x', '+z', '+y'], 1.5);
}
// Eğimli çatı parçaları. Üst yüz saçakta eave + T, tepede top; alt yüz saçakta eave, tepede top - T.
const RT = 0.08;
export function catiKenar(p, mat, eave = -0.48, top = 1.2, zo = 2.4, under = 'kereste') {
  quad(p, mat, [V(-1.5, eave + RT, zo), V(1.5, eave + RT, zo), V(1.5, top, -1.5), V(-1.5, top, -1.5)], V(0, 1, 0.4));
  quad(p, under, [V(-1.5, eave, zo), V(1.5, eave, zo), V(1.5, top - RT, -1.5), V(-1.5, top - RT, -1.5)], V(0, -1, 0));
  quad(p, under, [V(-1.5, eave, zo), V(1.5, eave, zo), V(1.5, eave + RT, zo), V(-1.5, eave + RT, zo)], V(0, 0, 1));
}
export function catiKose(p, mat, eave = -0.48, top = 1.2, o = 2.4, under = 'kereste') {
  for (const [y, yt, m, n] of [[eave + RT, top, mat, 1], [eave, top - RT, under, -1]]) {
    tri(p, m, [V(-1.5, y, o), V(o, y, o), V(-1.5, yt, -1.5)], V(0, n, n * 0.4));
    tri(p, m, [V(o, y, o), V(o, y, -1.5), V(-1.5, yt, -1.5)], V(n * 0.4, n, 0));
  }
  quad(p, under, [V(-1.5, eave, o), V(o, eave, o), V(o, eave + RT, o), V(-1.5, eave + RT, o)], V(0, 0, 1));
  quad(p, under, [V(o, eave, o), V(o, eave, -1.5), V(o, eave + RT, -1.5), V(o, eave + RT, o)], V(1, 0, 0));
}
export const catiTepe = (p, mat, top = 1.2) => box(p, mat, -1.5, 1.5, top - RT, top, -1.5, 1.5, ALL, 1.5);
// Beşik çatı: mahya X boyunca. uc: +X'te 0,9 m saçak ve alınlık (gable malzemesi)
export function catiBesik(p, mat, ridge = 0.6, uc = false, gable = null, eave = -0.48, under = 'kereste') {
  const x1 = uc ? 2.4 : 1.5, zo = 2.4;
  for (const s of [1, -1]) {
    quad(p, mat, [V(-1.5, eave + RT, s * zo), V(x1, eave + RT, s * zo), V(x1, ridge, 0), V(-1.5, ridge, 0)], V(0, 1, s * 0.4));
    quad(p, under, [V(-1.5, eave, s * zo), V(x1, eave, s * zo), V(x1, ridge - RT, 0), V(-1.5, ridge - RT, 0)], V(0, -1, 0));
    quad(p, under, [V(-1.5, eave, s * zo), V(x1, eave, s * zo), V(x1, eave + RT, s * zo), V(-1.5, eave + RT, s * zo)], V(0, 0, s));
    if (uc) quad(p, under, [V(x1, eave, s * zo), V(x1, ridge - RT, 0), V(x1, ridge, 0), V(x1, eave + RT, s * zo)], V(1, 0, 0));
  }
  if (uc) {
    const slope = (ridge - RT - eave) / zo, zg = Math.min(1.5, (ridge - RT) / slope); // alınlık: duvar üstünden çatı altına
    p.tri(gable, [V(1.5, 0, -zg), V(1.5, 0, zg), V(1.5, ridge - RT, 0)], [[-zg / 1.5, 0], [zg / 1.5, 0], [0, (ridge - RT) / 1.5]], V(1, 0, 0));
  }
}

// ---------- Kit ve örnek kurucu ----------
export function makeKit(name, defs, M) {
  const cache = new Map();
  const create = (part) => {
    if (!cache.has(part)) {
      const p = new Part(part);
      defs[part](p);
      cache.set(part, p.mesh(M));
    }
    const src = cache.get(part), mesh = new THREE.Mesh(src.geometry, src.material);
    mesh.name = part;
    mesh.castShadow = mesh.receiveShadow = true;
    return mesh;
  };
  const names = Object.keys(defs);
  // Bütün parçalar yan yana; her biri yere oturur
  const createKit = () => {
    const root = new THREE.Group();
    root.name = name;
    names.forEach((part, i) => {
      const m = create(part);
      m.geometry.computeBoundingBox();
      m.position.set((i % 7 - 3) * 5, -m.geometry.boundingBox.min.y, (Math.floor(i / 7) - 2) * 6);
      root.add(m);
    });
    return root;
  };
  return { names, create, createKit };
}
// Parçalardan ev: spec { nx, nz, floors: [{ h, wall(side, k), corner, jetty, narrow, band }], roof: { type, ... }, floor, extras }
// Dizilim: ön cephe dönüş 0, sağ (+X) +90°, arka 180°, sol -90°.
export function assemble(name, create, spec) {
  const g = new THREE.Group();
  g.name = name;
  const put = (part, x, y, z, rot = 0) => {
    const m = create(part);
    m.position.set(x, y, z);
    m.rotation.y = rot;
    g.add(m);
  };
  const { nx, nz } = spec, X = (nx * 3) / 2, Z = (nz * 3) / 2, Q = Math.PI / 2;
  let y = 0;
  spec.floors.forEach((fl, f) => {
    const j = fl.jetty ? 0.6 : 0, zf = Z + j;
    const sides = [[nx, (k) => [-X + 3 * (k + 0.5), zf], 0], [nz, (k) => [X, Z - 3 * (k + 0.5)], Q], [nx, (k) => [X - 3 * (k + 0.5), -Z], 2 * Q], [nz, (k) => [-X, -Z + 3 * (k + 0.5)], -Q]];
    sides.forEach(([n, at, rot], si) => {
      for (let k = 0; k < n; k++) {
        const part = fl.wall(si, k), [x, z] = at(k);
        if (part) put(part, x, y, z, rot);
        if (f > 0 && fl.band !== false && spec.band && !(si === 0 && j)) put(spec.band, x, y, z, rot);
        if (si === 0 && j && !spec.floors[f - 1]?.jetty) put(spec.jettyBase, x, y, Z, 0);
      }
    });
    if (j) {
      put(fl.narrow, X, y, Z + 0.3, Q);
      put(fl.narrow, -X, y, Z + 0.3, -Q);
    }
    if (fl.corner) [[X, zf, 0], [X, -Z, Q], [-X, -Z, 2 * Q], [-X, zf, -Q]].forEach(([x, z, rot]) => put(fl.corner, x, y, z, rot));
    if (spec.floor) for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) put(spec.floor, -X + 3 * (i + 0.5), y, -Z + 3 * (k + 0.5));
    y += fl.h ?? 3;
  });
  const R = spec.roof;
  if (R.type === 'besik') {
    for (let i = 0; i < nx; i++) put(i === 0 || i === nx - 1 ? R.uc : R.orta, -X + 3 * (i + 0.5), y, 0, i === 0 ? 2 * Q : 0);
  } else for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
    const x = -X + 3 * (i + 0.5), z = -Z + 3 * (k + 0.5), l = i === 0, r = i === nx - 1, b = k === 0, fr = k === nz - 1;
    if (fr && r) put(R.kose, x, y, z, 0);
    else if (b && r) put(R.kose, x, y, z, Q);
    else if (b && l) put(R.kose, x, y, z, 2 * Q);
    else if (fr && l) put(R.kose, x, y, z, -Q);
    else if (fr) put(R.kenar, x, y, z, 0);
    else if (r) put(R.kenar, x, y, z, Q);
    else if (b) put(R.kenar, x, y, z, 2 * Q);
    else if (l) put(R.kenar, x, y, z, -Q);
    else put(R.orta, x, y, z);
  }
  (spec.extras ?? []).forEach(([part, x, yy, z, rot]) => put(part, x, yy, z, rot ?? 0));
  return g;
}
export function row(name, houses, gap = 4) {
  const root = new THREE.Group();
  root.name = name;
  let x = 0;
  houses.forEach(([h, width]) => {
    h.position.x = x + width / 2;
    root.add(h);
    x += width + gap;
  });
  root.children.forEach((h) => (h.position.x -= (x - gap) / 2));
  return root;
}
