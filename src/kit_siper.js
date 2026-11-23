import * as THREE from 'three';
import * as K from './kit_ortak.js';
const { V, TAU, PAINT, Part } = K;

// Siper kiti v2 (1897 Osmanlı cephesi). Metre, Y yukarı; modül 3 m (yerel X). Siperin iç genişliği 1,6 m,
// taban y = 0, duvar üstü y = 1,35. Duvar parçaları: orijin taban hizasında, parçanın ortasında; sipere
// bakan yüz z = 0 düzleminde ve +Z'ye bakar, gövde (0,7 m toprak) -Z tarafındadır. Kazıklar yüzün önünde durur.
const D = 0.7, TOP = 1.35;
const bark = (g, w, h, rand, base, moss) => {
  g.fillStyle = `rgb(${base})`;
  g.fillRect(0, 0, w, h);
  for (let k = 0; k < 900; k++) {
    const v = rand();
    g.fillStyle = v < 0.5 ? `rgba(20,14,8,${0.15 + rand() * 0.3})` : `rgba(150,128,100,${0.08 + rand() * 0.16})`;
    g.fillRect(rand() * w, rand() * h, 1 + rand() * 3, 20 + rand() * 120);
  }
  for (let k = 0; k < 40; k++) {
    g.fillStyle = moss && rand() < 0.4 ? `rgba(70,82,40,${0.2 + rand() * 0.2})` : `rgba(40,30,18,${0.2 + rand() * 0.25})`;
    g.beginPath();
    g.ellipse(rand() * w, rand() * h, 8 + rand() * 30, 12 + rand() * 50, 0, 0, 7);
    g.fill();
  }
};
const mud = (g, w, h, rand) => {
  g.fillStyle = '#3c3022';
  g.fillRect(0, 0, w, h);
  for (let k = 0; k < 500; k++) {
    g.fillStyle = rand() < 0.5 ? `rgba(24,18,12,${0.15 + rand() * 0.25})` : `rgba(110,92,66,${0.08 + rand() * 0.14})`;
    g.beginPath();
    g.ellipse(rand() * w, rand() * h, 4 + rand() * 30, 3 + rand() * 14, rand() * 3, 0, 7);
    g.fill();
  }
  // Ayak izleri: taban boyunca iki sıra
  for (let k = 0; k < 14; k++) {
    const x = (k / 14) * w + rand() * 12, y = h * (k % 2 ? 0.38 : 0.6) + (rand() - 0.5) * h * 0.2, a = (rand() - 0.5) * 0.5 + (k % 5 === 0 ? Math.PI : 0);
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.fillStyle = 'rgba(14,10,6,0.6)';
    g.beginPath(); g.ellipse(0, 0, 15, 9, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(-19, 0, 7, 7, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(120,104,80,0.25)';
    g.beginPath(); g.ellipse(2, -9, 14, 3, 0, 0, 7); g.fill();
    g.restore();
  }
};
const burlap = (g, w, h, rand) => {
  PAINT.lif(g, w, h, rand, '#857452', ['#a08e6a', '#6a5a3e', '#94825e'], 3200, 14, false);
  for (let k = 0; k < 30; k++) {
    g.fillStyle = `rgba(50,38,24,${0.12 + rand() * 0.2})`;
    g.beginPath();
    g.ellipse(rand() * w, rand() * h, 10 + rand() * 50, 8 + rand() * 30, 0, 0, 7);
    g.fill();
  }
};
const kesit = (g, w, h, rand) => {
  g.fillStyle = '#4a3826';
  g.fillRect(0, 0, w, h);
  for (let k = 22; k > 0; k--) {
    g.fillStyle = k % 2 ? `rgb(${150 - k * 2 + rand() * 14},${118 - k * 2 + rand() * 10},${78 - k})` : `rgb(${118 + rand() * 10},${90 + rand() * 8},${58})`;
    g.beginPath();
    g.ellipse(w / 2 + (rand() - 0.5) * 6, h / 2 + (rand() - 0.5) * 6, (k / 22) * w * 0.47, (k / 22) * h * 0.47, 0, 0, 7);
    g.fill();
  }
  g.strokeStyle = 'rgba(30,20,10,0.6)';
  for (let k = 0; k < 5; k++) { const a = rand() * 7; g.lineWidth = 1 + rand() * 3; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + Math.cos(a) * w * 0.45, h / 2 + Math.sin(a) * h * 0.45); g.stroke(); }
  for (let k = 0; k < 300; k++) { g.fillStyle = `rgba(30,22,12,${rand() * 0.25})`; g.fillRect(rand() * w, rand() * h, 2 + rand() * 6, 2 + rand() * 6); }
};
const M = K.materials('siper2', {
  kutuk: [bark, 512, 512, '74,56,40', true], kazik: [bark, 512, 512, '104,84,60', false], kutuk_ucu: [kesit, 512, 512],
  toprak: [PAINT.toprak, 512, 512, '#54422e'], camur: [mud, 512, 512], kum_torbasi: [burlap, 512, 512],
  tahta: [PAINT.tahta, 512, 512, [104, 90, 70]], sandik: [PAINT.tahta, 512, 512, [86, 88, 60]], fici_tahtasi: [PAINT.tahta, 512, 512, [116, 88, 58]],
  bez: [PAINT.lif, 512, 512, '#9a9078', ['#b0a68c', '#7c7460'], 2600, 16, false],
  tel: 0x3a2e26, demir: 0x2a2622, pirinc: 0x9a7a34, fener_cami: 0xd6c890, karanlik: 0x0c0a08, su: 0x2e2c24, ip: 0x8a7a58,
});
for (const m of Object.values(M)) m.side = THREE.DoubleSide;
M.su.roughness = 0.2;

// ---------- Yardımcılar ----------
const centroid = (pts) => pts.reduce((c, q) => c.add(q), V(0, 0, 0)).multiplyScalar(1 / pts.length);
const ring = (c, u, w, ru, rw, n, ph = 0) => Array.from({ length: n }, (_, k) => c.clone().addScaledVector(u, Math.cos((k / n) * TAU + ph) * ru).addScaledVector(w, Math.sin((k / n) * TAU + ph) * rw));
function loft(P, mat, R, s = 2, vs = 0.5) {
  for (let j = 0; j + 1 < R.length; j++) {
    const A = R[j], B = R[j + 1], n = A.length, cc = centroid([...A, ...B]);
    for (let k = 0; k < n; k++) {
      const k1 = (k + 1) % n, pts = [A[k], A[k1], B[k1], B[k]];
      P.quad(mat, pts, [[(k / n) * s, j * vs], [((k + 1) / n) * s, j * vs], [((k + 1) / n) * s, (j + 1) * vs], [(k / n) * s, (j + 1) * vs]], centroid(pts).sub(cc));
    }
  }
}
function cap(P, mat, pts, hint) {
  const c = centroid(pts), n = pts.length, uv = (k) => [0.5 + 0.45 * Math.cos((k / n) * TAU), 0.5 + 0.45 * Math.sin((k / n) * TAU)];
  for (let k = 0; k < n; k++) P.tri(mat, [c, pts[k], pts[(k + 1) % n]], [[0.5, 0.5], uv(k), uv(k + 1)], hint);
}
// Y çevresinde döndürüp öteleyen vekil: alt parçaları başka yöne kurmak için
const xf = (p, ang, tx = 0, tz = 0, ty = 0) => {
  const c = Math.cos(ang), s = Math.sin(ang), f = (v) => V(v.x * c + v.z * s + tx, v.y + ty, -v.x * s + v.z * c + tz), fh = (h) => V(h.x * c + h.z * s, h.y, -h.x * s + h.z * c);
  return { quad: (m, pts, uv, h) => p.quad(m, pts.map(f), uv, fh(h)), tri: (m, pts, uv, h) => p.tri(m, pts.map(f), uv, fh(h)) };
};
function bx(P, mat, x0, x1, y0, y1, z0, z1, skip = '') {
  const F = {
    '+x': [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [1, 0, 0], 2, 1], '-x': [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], 2, 1],
    '+y': [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0], 0, 2], '-y': [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], 0, 2],
    '+z': [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], 0, 1], '-z': [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, -1], 0, 1],
  };
  for (const [key, [a, b, c, d, n, iu, iv]] of Object.entries(F)) if (!skip.includes(key)) P.quad(mat, [a, b, c, d].map((q) => V(...q)), [a, b, c, d].map((q) => [q[iu], q[iv]]), V(...n));
}
// İki nokta arasında kütük: hafif eğri, kalınlığı oynak, uçları kesit dokulu
function log(P, a, b, r, rand, { n = 8, segs = 2, wob = 0.02, mat = 'kutuk', capMat = 'kutuk_ucu', taper = 0 } = {}) {
  const d = b.clone().sub(a), len = d.length();
  d.normalize();
  const u = Math.abs(d.y) < 0.9 ? V(0, 1, 0).addScaledVector(d, -d.y).normalize() : V(1, 0, 0), w = d.clone().cross(u), ph = rand() * TAU, R = [];
  for (let j = 0; j <= segs; j++) {
    const c = a.clone().lerp(b, j / segs), rr = r * (1 - taper * (j / segs)) * (0.94 + rand() * 0.12);
    if (j > 0 && j < segs) c.addScaledVector(u, (rand() - 0.5) * 2 * wob).addScaledVector(w, (rand() - 0.5) * 2 * wob);
    R.push(ring(c, u, w, rr, rr, n, ph));
  }
  loft(P, mat, R, 2, len / segs / 1.5);
  cap(P, capMat, R[0], d.clone().negate());
  cap(P, capMat, R[segs], d);
}
const kazik = (P, rand, x, z = 0.055, h = 1.45, lean = 0.05, r = 0.05) => log(P, V(x, 0, z), V(x + (rand() - 0.5) * 2 * lean, h + rand() * 0.08, z + (rand() - 0.5) * lean), r, rand, { n: 6, segs: 1, mat: 'kazik', taper: 0.15 });
// Toprak gövde: önü, arkası, altı, uçları kapalı; üstü engebeli. top(x): üst yükseklik
function toprakGovde(P, rand, L, top = () => TOP, zf = -0.13, zb = -D) {
  const nx = Math.max(2, Math.round(L * 4)), xs = Array.from({ length: nx + 1 }, (_, i) => -L + (2 * L * i) / nx), zs = [zf, (zf + zb) / 2, zb];
  const H = xs.map((x, i) => zs.map((z, j) => top(x) - (i === 0 || i === nx ? 0 : rand() * 0.05 + (j === 1 ? 0 : 0.02))));
  const uv = (q) => [q.x / 1.5, q.z / 1.5], uy = (q) => [q.x / 1.5, q.y / 1.5];
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < 2; j++) { const q = [V(xs[i], H[i][j], zs[j]), V(xs[i + 1], H[i + 1][j], zs[j]), V(xs[i + 1], H[i + 1][j + 1], zs[j + 1]), V(xs[i], H[i][j + 1], zs[j + 1])]; P.quad('toprak', q, q.map(uv), V(0, 1, 0)); }
    for (const [j, n] of [[0, 1], [2, -1]]) { const q = [V(xs[i], 0, zs[j]), V(xs[i + 1], 0, zs[j]), V(xs[i + 1], H[i + 1][j], zs[j]), V(xs[i], H[i][j], zs[j])]; P.quad('toprak', q, q.map(uy), V(0, 0, n)); }
  }
  for (const [i, n] of [[0, -1], [nx, 1]]) for (let j = 0; j < 2; j++) { const q = [V(xs[i], 0, zs[j]), V(xs[i], 0, zs[j + 1]), V(xs[i], H[i][j + 1], zs[j + 1]), V(xs[i], H[i][j], zs[j])]; P.quad('toprak', q, q.map((p) => [p.z / 1.5, p.y / 1.5]), V(n, 0, 0)); }
  const b = [V(-L, 0, zf), V(L, 0, zf), V(L, 0, zb), V(-L, 0, zb)];
  P.quad('toprak', b, b.map(uv), V(0, -1, 0));
}
// Kütük duvar. o: len, posts, yOff, top(x), log(i, y, r) -> true ise o sıra özel işlenmiştir
function kutukDuvar(P, rand, o = {}) {
  const L = (o.len ?? 3) / 2;
  let y = 0.01 + (o.yOff ?? 0), i = 0;
  for (;;) {
    const r = 0.092 + rand() * 0.026;
    if (y + 2 * r > TOP + 0.02) break;
    if (!(o.log && o.log(i, y + r, r))) log(P, V(-L + rand() * 0.05, y + r, -r + (rand() - 0.5) * 0.03), V(L - rand() * 0.05, y + r + (rand() - 0.5) * 0.03, -r + (rand() - 0.5) * 0.03), r, rand, { segs: L > 1 ? 3 : 1 });
    y += 2 * r - 0.012;
    i++;
  }
  for (const x of o.posts ?? [-0.75, 0.75]) kazik(P, rand, x);
  toprakGovde(P, rand, L, o.top);
  bx(P, 'toprak', -L, L, -0.1, 0.015, -0.13, 0, '-z'); // en alt kütüğün altını kapatan eşik
}
// Kum torbası: uçları büzülmüş, altı yassı yastık
function torba(P, rand, c, yaw = 0, { len = 0.58, w = 0.3, h = 0.185, n = 6, fine = false } = {}) {
  const d = V(Math.cos(yaw), 0, Math.sin(yaw)), u = V(-d.z, 0, d.x), up = V(0, 1, 0);
  const T = fine ? [[-0.5, 0.35], [-0.44, 0.8], [-0.25, 1], [0, 1.04], [0.25, 1], [0.44, 0.8], [0.5, 0.35]] : [[-0.5, 0.4], [-0.4, 0.96], [0.4, 0.96], [0.5, 0.4]];
  const R = T.map(([t, k]) => {
    const cc = c.clone().addScaledVector(d, t * len).setY(c.y + (h / 2) * (0.25 + 0.75 * k) + (rand() - 0.5) * 0.01);
    return Array.from({ length: n }, (_, i) => { const a = (i / n) * TAU + 0.3, cs = Math.cos(a), sn = Math.sin(a); return cc.clone().addScaledVector(u, Math.sign(cs) * Math.abs(cs) ** 0.6 * (w / 2) * k).addScaledVector(up, Math.sign(sn) * Math.abs(sn) ** 0.7 * (h / 2) * k * (sn < 0 ? 0.9 : 1)); });
  });
  loft(P, 'kum_torbasi', R, 2, 0.4);
  cap(P, 'kum_torbasi', R[0], d.clone().negate());
  cap(P, 'kum_torbasi', R[R.length - 1], d);
}
const torbaSirasi = (P, rand, xs, y, z = -0.3) => xs.forEach((x) => torba(P, rand, V(x + (rand() - 0.5) * 0.03, y, z + (rand() - 0.5) * 0.04), (rand() - 0.5) * 0.12));
// Çamurlu taban: kenarları y = 0, içi hafif engebeli; altı ve yanları kapalı
function taban(P, rand, lx, lz, pools = []) {
  const nx = Math.round(lx * 3.4), nz = 5, X = (i) => -lx / 2 + (lx * i) / nx, Z = (j) => -lz / 2 + (lz * j) / nz;
  const H = Array.from({ length: nx + 1 }, (_, i) => Array.from({ length: nz + 1 }, (_, j) => {
    if (i === 0 || i === nx || j === 0 || j === nz) return 0;
    let y = -0.008 - rand() * 0.028;
    for (const [px, pz, pr] of pools) if (Math.hypot(X(i) - px, (Z(j) - pz) * 1.4) < pr) y = -0.05;
    return y;
  }));
  const uv = (q) => [q.x / lx + 0.5, q.z / lz + 0.5];
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const q = [V(X(i), H[i][j], Z(j)), V(X(i + 1), H[i + 1][j], Z(j)), V(X(i + 1), H[i + 1][j + 1], Z(j + 1)), V(X(i), H[i][j + 1], Z(j + 1))]; P.quad('camur', q, q.map(uv), V(0, 1, 0)); }
  bx(P, 'camur', -lx / 2, lx / 2, -0.1, 0, -lz / 2, lz / 2, '+y');
  for (const [px, pz, pr] of pools) cap(P, 'su', ring(V(px, -0.022, pz), V(1, 0, 0), V(0, 0, 1), pr * 1.15, pr * 0.8, 8), V(0, 1, 0));
}

// ---------- Parçalar ----------
const DEFS = {
  duvar_kutuk: (P, r) => kutukDuvar(P, r),
  duvar_kutuk_kum: (P, r) => {
    kutukDuvar(P, r);
    torbaSirasi(P, r, [-1.2, -0.6, 0, 0.6, 1.2], TOP - 0.01);
    torbaSirasi(P, r, [-0.9, -0.3, 0.3, 0.9], TOP + 0.165);
  },
  duvar_kutuk_mazgal: (P, r) => {
    kutukDuvar(P, r);
    torbaSirasi(P, r, [-1.2, -0.6, 0.6, 1.2], TOP - 0.01);
    for (const s of [-1, 1]) torba(P, r, V(s * 0.31, TOP - 0.01, -0.36), Math.PI / 2 + s * 0.25, { len: 0.5 });
    bx(P, 'tahta', -0.62, 0.62, TOP + 0.17, TOP + 0.2, -0.56, -0.1);
    torbaSirasi(P, r, [-0.6, 0, 0.6], TOP + 0.195);
  },
  duvar_kutuk_yikik: (P, r) => {
    const dip = (x) => TOP - 0.55 * Math.exp(-(((x - 0.35) / 0.55) ** 2));
    kutukDuvar(P, r, {
      top: dip,
      log: (i, y, rr) => {
        if (i < 3) return false;
        log(P, V(-1.5 + r() * 0.04, y, -rr), V(-0.45 - r() * 0.25, y - 0.02, -rr + 0.02), rr, r, { segs: 1 }); // sol yarı yerinde
        if (i === 3) log(P, V(-0.2, y - 0.05, -rr + 0.05), V(1.46, y - 0.42, 0.16), rr, r); // sarkmış
        if (i === 4) log(P, V(1.0, y - 0.05, -rr), V(1.48, y, -rr), rr, r, { segs: 1 }); // sağda kalan kütük ucu
        if (i === 5) log(P, V(0.15, 0.02 + rr, 0.5), V(1.2, 0.75, 0.06), rr, r); // tabana düşmüş, duvara yaslı
        return true;
      },
      posts: [-0.75],
    });
    log(P, V(0.75, 0, 0.055), V(0.95, 0.72, 0.2), 0.05, r, { n: 6, segs: 1, mat: 'kazik' }); // kırık kazık
    log(P, V(0.5, 0.05, 0.42), V(0.98, 0.07, 0.62), 0.045, r, { n: 6, segs: 1, mat: 'kazik' });
    // Dağılmış toprak
    for (const [x, z, s] of [[0.2, 0.2, 0.2], [0.7, 0.36, 0.14], [-0.1, 0.42, 0.1]]) { const R = ring(V(x, 0, z), V(1, 0, 0), V(0, 0, 1), s * 1.4, s, 6, x); P.tri('toprak', [R[0], R[2], R[4]], K.FLAT.slice(0, 3), V(0, -1, 0)); for (let k = 0; k < 6; k++) P.tri('toprak', [V(x, s * 0.7, z), R[k], R[(k + 1) % 6]], [[0.5, 0.5], [k / 6, 0], [(k + 1) / 6, 0]], R[k].clone().sub(V(x, -0.3, z))); }
  },
  duvar_kutuk_cokuk: (P, r) => {
    const bulge = (x) => Math.exp(-((x / 0.75) ** 2));
    kutukDuvar(P, r, {
      top: (x) => TOP - 0.3 * bulge(x),
      log: (i, y, rr) => {
        if (i < 2) return false;
        const push = 0.07 * (i - 1), drop = 0.045 * (i - 1);
        for (const s of [-1, 1]) log(P, V(s * (1.5 - r() * 0.04), y, -rr), V(s * 0.04, y - drop, -rr + push + r() * 0.04), rr, r, { segs: 2 });
        return true;
      },
      posts: [],
    });
    log(P, V(-0.75, 0, 0.055), V(-0.6, 1.4, 0.28), 0.05, r, { n: 6, segs: 1, mat: 'kazik' });
    log(P, V(0.75, 0, 0.055), V(0.62, 1.36, 0.34), 0.05, r, { n: 6, segs: 1, mat: 'kazik' });
    // İçeri akmış toprak: duvarın üstünden tabana yayılan yığın
    const nx = 6, nz = 5, X = (i) => -1.05 + (2.1 * i) / nx, Z = (j) => -0.5 + (1.3 * j) / nz;
    const h = (i, j) => (i === 0 || i === nx || j === nz ? 0 : Math.max(0, 1.12 * (1 - (X(i) / 1.05) ** 2) * (1 - (Z(j) + 0.5) / 1.3) ** 1.3 + (r() - 0.5) * 0.05));
    const H = Array.from({ length: nx + 1 }, (_, i) => Array.from({ length: nz + 1 }, (_, j) => h(i, j)));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const q = [V(X(i), H[i][j], Z(j)), V(X(i + 1), H[i + 1][j], Z(j)), V(X(i + 1), H[i + 1][j + 1], Z(j + 1)), V(X(i), H[i][j + 1], Z(j + 1))]; P.quad('toprak', q, q.map((p) => [p.x / 1.5, p.z / 1.5]), V(0, 1, 0.3)); }
    P.quad('toprak', [V(-1.05, 0, 0), V(1.05, 0, 0), V(1.05, 0, 0.8), V(-1.05, 0, 0.8)], K.FLAT, V(0, -1, 0));
  },
  duvar_toprak: (P, r) => {
    const nx = 8, ny = 5, X = (i) => -1.5 + (3 * i) / nx, Y = (j) => (TOP * j) / ny;
    const Zf = Array.from({ length: nx + 1 }, (_, i) => Array.from({ length: ny + 1 }, (_, j) => -0.02 - 0.1 * (j / ny) - (i === 0 || i === nx ? 0.03 : r() * 0.06)));
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const q = [V(X(i), Y(j), Zf[i][j]), V(X(i + 1), Y(j), Zf[i + 1][j]), V(X(i + 1), Y(j + 1), Zf[i + 1][j + 1]), V(X(i), Y(j + 1), Zf[i][j + 1])]; P.quad('toprak', q, q.map((p) => [p.x / 1.5, p.y / 1.5]), V(0, 0, 1)); }
    for (let i = 0; i < nx; i++) { const q = [V(X(i), TOP, Zf[i][ny]), V(X(i + 1), TOP, Zf[i + 1][ny]), V(X(i + 1), TOP, -D), V(X(i), TOP, -D)]; P.quad('toprak', q, q.map((p) => [p.x / 1.5, p.z / 1.5]), V(0, 1, 0)); }
    for (const [i, n] of [[0, -1], [nx, 1]]) for (let j = 0; j < ny; j++) { const q = [V(X(i), Y(j), Zf[i][j]), V(X(i), Y(j + 1), Zf[i][j + 1]), V(X(i), Y(j + 1), -D), V(X(i), Y(j), -D)]; P.quad('toprak', q, q.map((p) => [p.z / 1.5, p.y / 1.5]), V(n, 0, 0)); }
    bx(P, 'toprak', -1.5, 1.5, 0, TOP, -D, -D + 0.01, '+z+x-x+y');
    // Yer yer tahta destek: iki yatay tahta ve onları tutan iki kazık
    bx(P, 'tahta', -1.35, 0.2, 0.62, 0.84, -0.015, 0.02);
    bx(P, 'tahta', -0.3, 1.4, 0.2, 0.42, -0.005, 0.03);
    kazik(P, r, -0.75, 0.075, 1.2, 0.04);
    kazik(P, r, 0.75, 0.085, 1.0, 0.04);
  },
  duvar_ucu: (P, r) => kutukDuvar(P, r, { len: 1.6, posts: [-0.5, 0.5] }),
  // İç köşe (dönüşün iç yanı, dışbükey): 0,7 × 0,7 blok; yüzleri +Z (z = 0) ve +X (x = 0), orijin köşe noktasında
  duvar_kose_ic: (P, r) => {
    kutukDuvar(xf(P, 0, -D / 2, 0), r, { len: D, posts: [] });
    kutukDuvar(xf(P, Math.PI / 2, 0, -D / 2), r, { len: D, posts: [], yOff: 0.1 });
    kazik(P, r, 0.05, 0.05, 1.5, 0.03, 0.065);
  },
  // Dış köşe (dönüşün dış yanı, içbükey): orijin iç köşe noktasında; A yüzü x -1,6 … 0 (z = 0, +Z'ye bakar),
  // B yüzü z 0 … 1,6 (x = 0, -X'e bakar)
  duvar_kose_dis: (P, r) => {
    kutukDuvar(xf(P, 0, -0.8, 0), r, { len: 1.6, posts: [-0.3] });
    kutukDuvar(xf(P, -Math.PI / 2, 0, 0.8), r, { len: 1.6, posts: [0.3], yOff: 0.1 });
    bx(P, 'toprak', 0, D, 0, TOP, -D, 0, '-x+z');
    kazik(P, r, -0.07, 0.07, 1.5, 0.03, 0.065);
  },
  taban_camur: (P, r) => taban(P, r, 3, 1.6, [[-0.7, 0.25, 0.3], [0.8, -0.3, 0.24]]),
  taban_tahta: (P, r) => {
    taban(P, r, 3, 1.6, [[1.1, 0.55, 0.16]]);
    for (const z of [-0.3, 0.3]) bx(P, 'tahta', -1.5, 1.5, 0, 0.07, z - 0.04, z + 0.04, '-y');
    for (let k = 0; k < 13; k++) { const x = -1.38 + k * 0.23 + (r() - 0.5) * 0.02, s = (r() - 0.5) * 0.04; bx(xf(P, s, x, 0), 'tahta', -0.075, 0.075, 0.07, 0.1, -0.46 - r() * 0.03, 0.46 + r() * 0.03); }
  },
  taban_kare: (P, r) => taban(P, r, 1.6, 1.6, [[0.2, 0.1, 0.26]]),
  // Atış basamağı: arkası z = 0 (duvar dibi), önü +Z; 3 × 0,35 × 0,4
  atis_basamagi: (P, r) => {
    bx(P, 'toprak', -1.5, 1.5, 0, 0.3, 0, 0.36);
    bx(P, 'tahta', -1.5, 1.5, 0.3, 0.35, 0, 0.4);
    bx(P, 'tahta', -1.5, 1.5, 0.02, 0.29, 0.355, 0.385, '-z');
    for (const x of [-1.1, 0, 1.1]) log(P, V(x, 0, 0.4 - 0.035 + 0.03), V(x + (r() - 0.5) * 0.03, 0.3, 0.4), 0.035, r, { n: 5, segs: 1, mat: 'kazik' });
  },
  toprak_sirti: (P, r) => {
    const nx = 8, nz = 6, X = (i) => -1.5 + (3 * i) / nx, Z = (j) => -0.6 + (1.2 * j) / nz;
    const H = Array.from({ length: nx + 1 }, (_, i) => Array.from({ length: nz + 1 }, (_, j) => (j === 0 || j === nz ? 0 : 0.4 * (1 - (Z(j) / 0.6) ** 2) ** 0.7 - (i === 0 || i === nx ? 0 : r() * 0.06))));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const q = [V(X(i), H[i][j], Z(j)), V(X(i + 1), H[i + 1][j], Z(j)), V(X(i + 1), H[i + 1][j + 1], Z(j + 1)), V(X(i), H[i][j + 1], Z(j + 1))]; P.quad('toprak', q, q.map((p) => [p.x / 1.5, p.z / 1.5]), V(0, 1, 0)); }
    for (const [i, n] of [[0, -1], [nx, 1]]) cap(P, 'toprak', Array.from({ length: nz + 1 }, (_, j) => V(X(i), H[i][j], Z(j))), V(n, 0, 0));
    P.quad('toprak', [V(-1.5, 0, -0.6), V(1.5, 0, -0.6), V(1.5, 0, 0.6), V(-1.5, 0, 0.6)], K.FLAT, V(0, -1, 0));
  },
  kum_torbasi: (P, r) => {
    torba(P, r, V(0, 0, 0), 0, { n: 8, fine: true, len: 0.6, h: 0.2 });
    bx(P, 'ip', 0.262, 0.275, 0.05, 0.13, -0.045, 0.045);
  },
  kum_torbasi_yigin: (P, r) => {
    for (const [x, y, z, a] of [[-0.6, 0, 0, 0.05], [0, 0, 0.02, -0.04], [0.6, 0, -0.01, 0.06], [-0.3, 0.175, 0, -0.05], [0.3, 0.175, 0.02, 0.07], [0, 0.35, 0, 0.25]]) torba(P, r, V(x, y, z), a, { n: 8, len: 0.6, h: 0.2 });
  },
  dikenli_tel: (P, r) => {
    for (const s of [-1, 1]) {
      log(P, V(s * 1.42, 0, -0.32), V(s * 1.42 + 0.03, 1.2, 0.3), 0.04, r, { n: 5, segs: 1, mat: 'kazik' });
      log(P, V(s * 1.42 + 0.05, 0, 0.32), V(s * 1.42 - 0.02, 1.2, -0.3), 0.04, r, { n: 5, segs: 1, mat: 'kazik' });
    }
    for (const [y, z] of [[1.08, 0.24], [0.62, 0], [1.08, -0.24]]) {
      const pts = Array.from({ length: 7 }, (_, k) => V(-1.42 + (2.84 * k) / 6, y - 0.07 * Math.sin((k / 6) * Math.PI) + (r() - 0.5) * 0.02, z * (y > 1 ? 1 : 0) + (r() - 0.5) * 0.02));
      for (let k = 0; k < 6; k++) K.cyl(P, 'tel', pts[k], pts[k + 1], 0.006, 3, false);
      for (let k = 0; k < 12; k++) { const t = (k + 0.5) / 12 * 6, a = pts[Math.floor(t)].clone().lerp(pts[Math.min(6, Math.floor(t) + 1)], t % 1), e = 0.035; for (const [dy, dz] of [[e, e], [e, -e]]) P.tri('tel', [a.clone().add(V(-0.012, dy, dz)), a.clone().add(V(0.012, -dy, -dz)), a.clone().add(V(0.012, dy * 0.2, dz * 0.2))], K.FLAT.slice(0, 3), V(0, 0, 1)); }
    }
  },
  tel_kazigi: (P, r) => log(P, V(0, 0, 0), V(0.28, 1.25, 0.1), 0.045, r, { n: 6, segs: 2, mat: 'kazik', taper: 0.3 }),
  // Çıkış merdiveni: üst ucu duvara (z = 0) yaslanır, ayağı z = 0,5'te
  merdiven_siper: (P, r) => {
    for (const s of [-1, 1]) K.beam(P, 'tahta', V(s * 0.22, 0, 0.5), V(s * 0.2, 1.52, 0.035), 0.07, 0.04);
    for (let k = 0; k < 5; k++) { const t = 0.12 + k * 0.19; log(P, V(-0.24, 1.52 * t, 0.5 - 0.465 * t), V(0.24, 1.52 * t + (r() - 0.5) * 0.02, 0.5 - 0.465 * t), 0.02, r, { n: 5, segs: 1, mat: 'kazik' }); }
  },
  cephane_sandigi: (P) => {
    bx(P, 'sandik', -0.4, 0.4, 0, 0.3, -0.19, 0.19);
    bx(P, 'sandik', -0.415, 0.415, 0.3, 0.335, -0.205, 0.205);
    for (const x of [-0.26, 0.26]) bx(P, 'demir', x - 0.025, x + 0.025, -0.001, 0.34, -0.21, 0.21, '-y');
    for (const s of [-1, 1]) { bx(P, 'tahta', s > 0 ? 0.4 : -0.43, s > 0 ? 0.43 : -0.4, 0.17, 0.22, -0.14, 0.14); K.beam(P, 'ip', V(s * 0.44, 0.15, -0.07), V(s * 0.44, 0.15, 0.07), 0.02, 0.02, false); }
  },
  mermi_kasasi: (P) => {
    bx(P, 'sandik', -0.25, 0.25, 0, 0.2, -0.15, 0.15, '+y');
    for (const [a, b, c, d] of [[-0.25, 0.25, -0.15, -0.13], [-0.25, 0.25, 0.13, 0.15], [-0.25, -0.23, -0.13, 0.13], [0.23, 0.25, -0.13, 0.13]]) P.quad('sandik', [V(a, 0.2, c), V(b, 0.2, c), V(b, 0.2, d), V(a, 0.2, d)], K.FLAT, V(0, 1, 0));
    bx(P, 'sandik', -0.23, 0.23, 0.13, 0.2, -0.13, 0.13, '+y-y+x-x'); // iç yan yüzler (çift yüzlü)
    P.quad('pirinc', [V(-0.23, 0.14, -0.13), V(0.23, 0.14, -0.13), V(0.23, 0.14, 0.13), V(-0.23, 0.14, 0.13)], K.FLAT, V(0, 1, 0));
    for (let k = 0; k < 9; k++) K.cyl(P, 'pirinc', V(-0.2 + k * 0.05, 0.15, -0.12), V(-0.2 + k * 0.05, 0.15, 0.12), 0.02, 4, false);
    bx(P, 'sandik', -0.26, 0.26, 0, 0.025, 0.19, 0.5); // yanına bırakılmış kapak
  },
  su_fici: (P) => {
    const rg = (y, rr) => ring(V(0, y, 0), V(1, 0, 0), V(0, 0, 1), rr, rr, 10), R = [rg(0, 0.2), rg(0.2, 0.25), rg(0.5, 0.25), rg(0.7, 0.2)];
    loft(P, 'fici_tahtasi', R, 3);
    cap(P, 'fici_tahtasi', R[0], V(0, -1, 0));
    cap(P, 'fici_tahtasi', rg(0.68, 0.195), V(0, 1, 0));
    for (const [y, rr] of [[0.07, 0.222], [0.35, 0.256], [0.63, 0.222]]) loft(P, 'demir', [rg(y - 0.02, rr), rg(y + 0.02, rr)], 1);
  },
  sedye: (P, r) => {
    for (const z of [-0.27, 0.27]) {
      log(P, V(-1.1, 0.17, z), V(1.1, 0.17, z), 0.022, r, { n: 5, segs: 1, mat: 'kazik', wob: 0 });
      for (const x of [-0.7, 0.7]) bx(P, 'tahta', x - 0.02, x + 0.02, 0, 0.16, z - 0.02, z + 0.02);
    }
    const xs = [-0.82, -0.4, 0, 0.4, 0.82], zs = [-0.27, -0.09, 0.09, 0.27], sag = (i, j) => 0.185 - (j === 0 || j === 3 ? 0 : 0.05 + 0.02 * Math.sin(i * 1.7));
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const q = [V(xs[i], sag(i, j), zs[j]), V(xs[i + 1], sag(i + 1, j), zs[j]), V(xs[i + 1], sag(i + 1, j + 1), zs[j + 1]), V(xs[i], sag(i, j + 1), zs[j + 1])]; P.quad('bez', q, q.map((p) => [p.x, p.z]), V(0, 1, 0)); }
  },
  fener_gazli: (P) => {
    const rg = (y, rr, n = 8) => ring(V(0, y, 0), V(1, 0, 0), V(0, 0, 1), rr, rr, n);
    const B = [rg(0, 0.075), rg(0.05, 0.075), rg(0.075, 0.03)];
    loft(P, 'demir', B, 1);
    cap(P, 'demir', B[0], V(0, -1, 0));
    loft(P, 'fener_cami', [rg(0.075, 0.035), rg(0.13, 0.06), rg(0.2, 0.035)], 1);
    const C = [rg(0.2, 0.05), rg(0.225, 0.04), rg(0.26, 0.015)];
    loft(P, 'demir', C, 1);
    cap(P, 'demir', C[2], V(0, 1, 0));
    for (const s of [-1, 1]) K.cyl(P, 'demir', V(s * 0.07, 0.05, 0), V(s * 0.065, 0.22, 0), 0.004, 3, false);
    const arc = Array.from({ length: 6 }, (_, k) => V(Math.cos((k / 5) * Math.PI) * 0.065, 0.22 + Math.sin((k / 5) * Math.PI) * 0.09, 0));
    for (let k = 0; k < 5; k++) K.cyl(P, 'demir', arc[k], arc[k + 1], 0.004, 3, false);
  },
  kazma_kurek: (P, r) => {
    log(P, V(-0.62, 0.025, -0.14), V(0.3, 0.025, -0.1), 0.02, r, { n: 5, segs: 1, mat: 'kazik', wob: 0 });
    const blade = [V(0.3, 0.03, -0.21), V(0.3, 0.03, 0.01), V(0.56, 0.012, 0.0), V(0.6, 0.005, -0.1), V(0.56, 0.012, -0.2)];
    cap(P, 'demir', blade, V(0, 1, 0));
    cap(P, 'demir', blade.map((q) => q.clone().setY(q.y - 0.006)), V(0, -1, 0));
    K.beam(P, 'tahta', V(-0.64, 0.025, -0.2), V(-0.64, 0.025, -0.08), 0.03, 0.03);
    log(P, V(-0.5, 0.03, 0.2), V(0.4, 0.03, 0.1), 0.022, r, { n: 5, segs: 1, mat: 'kazik', wob: 0 });
    for (const s of [-1, 1]) { K.beam(P, 'demir', V(0.4, 0.03, 0.1), V(0.42, 0.03, 0.1 + s * 0.16), 0.035, 0.035, false); K.beam(P, 'demir', V(0.42, 0.03, 0.1 + s * 0.16), V(0.36, 0.02, 0.1 + s * 0.31), 0.022, 0.02); }
  },
  // Sığınak ağzı: 3 m duvar modülü; ortada 1,0 × 1,05 m açıklık, arkasında 1,5 m derin karanlık oda
  siginak_agzi: (P, r) => {
    for (const s of [-1, 1]) {
      kutukDuvar(xf(P, 0, s * 1.0, 0), r, { len: 1.0, posts: [] });
      kazik(P, r, s * 0.56, 0.07, 1.34, 0.01, 0.075);
      kazik(P, r, s * 1.25, 0.055);
    }
    log(P, V(-0.78, 1.15, -0.1), V(0.78, 1.15, -0.1), 0.105, r); // lento
    log(P, V(-0.74, 1.27, -0.14), V(0.74, 1.29, -0.13), 0.085, r);
    bx(P, 'toprak', -0.5, 0.5, 1.05, TOP, -D, -0.2, '+x-x'); // lentonun arkası
    // Oda: iç yüzler
    const q = (m, pts, h) => P.quad(m, pts.map((p) => V(...p)), K.FLAT, V(...h));
    for (const s of [-1, 1]) q('toprak', [[s * 0.5, 0, -0.02], [s * 0.5, 1.05, -0.02], [s * 0.62, 1.05, -1.5], [s * 0.62, 0, -1.5]], [-s, 0, 0]);
    q('karanlik', [[-0.62, 0, -1.5], [0.62, 0, -1.5], [0.62, 1.05, -1.5], [-0.62, 1.05, -1.5]], [0, 0, 1]);
    q('karanlik', [[-0.5, 1.05, -0.2], [0.5, 1.05, -0.2], [0.62, 1.05, -1.5], [-0.62, 1.05, -1.5]], [0, -1, 0]);
    q('camur', [[-0.5, 0.004, -0.02], [0.5, 0.004, -0.02], [0.62, 0.004, -1.5], [-0.62, 0.004, -1.5]], [0, 1, 0]);
    bx(P, 'toprak', -0.7, 0.7, -0.05, 1.15, -1.58, -D, '+z'); // odanın dış kabuğu
  },
  // Mermi çukuru: orijin çukurun ortasında, zemin hizasında (y = 0); dibi y = -1
  top_cukuru: (P, r) => {
    const n = 14, prof = [[0, -1.0], [0.55, -0.92], [1.15, -0.55], [1.6, -0.12], [1.84, 0.13], [2.0, 0]];
    const R = prof.map(([rad, y], j) => Array.from({ length: n }, (_, k) => { const a = (k / n) * TAU, w = j === 0 ? 0 : 1 + (r() - 0.5) * 0.14; return V(Math.cos(a) * rad * w, y + (j > 0 && j < 5 ? (r() - 0.5) * 0.08 : 0), Math.sin(a) * rad * w); }));
    for (let j = 1; j + 1 < R.length; j++) for (let k = 0; k < n; k++) { const k1 = (k + 1) % n, pts = [R[j][k], R[j][k1], R[j + 1][k1], R[j + 1][k]]; P.quad('toprak', pts, pts.map((p) => [p.x / 1.5, p.z / 1.5]), V(0, 1, 0)); }
    for (let k = 0; k < n; k++) {
      const k1 = (k + 1) % n;
      P.tri('camur', [V(0, -1, 0), R[1][k], R[1][k1]], [[0.5, 0.5], [0.5 + R[1][k].x / 3, 0.5 + R[1][k].z / 1.6], [0.5 + R[1][k1].x / 3, 0.5 + R[1][k1].z / 1.6]], V(0, 1, 0));
      P.tri('toprak', [V(0, -1.12, 0), R[5][k], R[5][k1]], [[0.5, 0.5], [k / n, 0], [(k + 1) / n, 0]], V(0, -1, 0)); // altı kapalı
    }
    cap(P, 'su', ring(V(0, -0.9, 0), V(1, 0, 0), V(0, 0, 1), 0.62, 0.55, 8), V(0, 1, 0));
  },
};
export const PARCALAR = Object.keys(DEFS);
const cache = new Map();
export function createParca(name) {
  if (!cache.has(name)) { const p = new Part(name); DEFS[name](p, K.rng(PARCALAR.indexOf(name) * 131 + 17)); cache.set(name, p.mesh(M)); }
  const src = cache.get(name), mesh = new THREE.Mesh(src.geometry, src.material);
  mesh.name = name;
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
export function createKit() {
  const root = new THREE.Group();
  root.name = 'siper_kiti';
  PARCALAR.forEach((n, i) => { const m = createParca(n); m.position.set((i % 9 - 4) * 5, n === 'top_cukuru' ? 1.12 : 0, (Math.floor(i / 9) - 1) * 5); root.add(m); });
  return root;
}
// 20 m'lik örnek: X boyunca 12,8 m ana kol, sonunda +Z'ye dönemeç (6,8 m), x = 4,5'te -Z'ye yan kol
export function createOrnek() {
  const root = new THREE.Group(), Q = Math.PI / 2;
  root.name = 'ornek_siper';
  const put = (n, x, z, rot = 0, y = 0) => { const m = createParca(n); m.position.set(x, y, z); m.rotation.y = rot; root.add(m); };
  // Ana kol
  put('duvar_ucu', 0, 0, Q);
  [['duvar_kutuk_kum', 1.5], ['duvar_kutuk_mazgal', 7.5], ['duvar_kutuk_yikik', 10.5]].forEach(([n, x]) => put(n, x, -0.8));
  [['duvar_kutuk', 0.8], ['siginak_agzi', 3.8], ['duvar_toprak', 6.8], ['duvar_kutuk_cokuk', 9.8]].forEach(([n, x]) => put(n, x, 0.8, Math.PI));
  [['taban_camur', 1.5], ['taban_tahta', 4.5], ['taban_tahta', 7.5], ['taban_camur', 10.5]].forEach(([n, x]) => put(n, x, 0));
  // Dönemeç
  put('duvar_kose_dis', 13.6, -0.8);
  put('duvar_kose_ic', 12, 0.8, Q);
  put('taban_kare', 12.8, 0);
  [['duvar_kutuk_mazgal', 2.3], ['duvar_kutuk_kum', 5.3]].forEach(([n, z]) => put(n, 13.6, z, -Q));
  [['duvar_kutuk', 3.0], ['duvar_toprak', 6.0]].forEach(([n, z]) => put(n, 12, z, Q));
  put('taban_tahta', 12.8, 2.3, Q);
  put('taban_camur', 12.8, 5.3, Q);
  put('duvar_ucu', 12.8, 6.8, Math.PI);
  // Yan kol
  put('duvar_kose_ic', 3.7, -0.8);
  put('duvar_kose_ic', 5.3, -0.8, -Q);
  put('duvar_kutuk', 3.7, -3.0, Q);
  put('duvar_kutuk', 5.3, -3.0, -Q);
  put('duvar_ucu', 4.5, -3.8);
  put('taban_camur', 4.5, -2.3, Q);
  // Basamak, merdiven, eşya
  put('atis_basamagi', 1.5, -0.8);
  put('atis_basamagi', 7.5, -0.8);
  put('merdiven_siper', 6.8, 0.8, Math.PI);
  put('cephane_sandigi', 9.6, 0.45, 0.1);
  put('mermi_kasasi', 2.4, 0.5, -0.2);
  put('fener_gazli', 4.6, 0.6);
  put('su_fici', 4.9, -3.4);
  put('sedye', 4.3, -2.2, Q + 0.05);
  put('kazma_kurek', 12.9, 4.9, 1.2);
  put('kum_torbasi', 12.4, 0.5, 0.6);
  // Siperin dışı (zemin y = 1,35)
  for (const x of [1.5, 7.5, 10.5]) put('toprak_sirti', x, -1.7, 0, TOP);
  put('toprak_sirti', 14.5, 2.3, Q, TOP);
  put('toprak_sirti', 14.5, 5.3, Q, TOP);
  put('kum_torbasi_yigin', 0.8, 1.15, 0.05, TOP);
  for (const x of [1.5, 4.5, 7.5, 10.5]) put('dikenli_tel', x, -7.2, 0, TOP);
  put('tel_kazigi', 12.6, -7.0, 0.5, TOP);
  put('tel_kazigi', 13.4, -6.2, 2.4, TOP);
  put('top_cukuru', 8.6, -4.4, 0, TOP);
  return root;
}
