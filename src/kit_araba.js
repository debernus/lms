import * as THREE from 'three';
import * as K from './kit_ortak.js';
const { V, TAU, ALL, PAINT, box, beam, cyl, lathe, Part } = K;

// At arabası kiti (1890'lar İstanbul). Ölçü metre, Y yukarı; arabanın önü +Z, sol yanı +X.
// Orijin tekerlek akslarının ortasında, zeminde. Her tekerlek ayrı düğüm (dönme ekseni yerel X).
const koruk = (g, w, h, rand) => {
  g.fillStyle = '#1d1a19';
  g.fillRect(0, 0, w, h);
  for (let k = 0; k < 8; k++) {
    g.fillStyle = `rgba(${k % 2 ? '70,64,58' : '0,0,0'},${0.25 + rand() * 0.2})`;
    g.fillRect(0, (k * h) / 8 + rand() * 4, w, 3);
  }
  for (let k = 0; k < 300; k++) {
    g.fillStyle = `rgba(120,110,100,${rand() * 0.08})`;
    g.fillRect(rand() * w, rand() * h, 2 + rand() * 10, 1);
  }
};
const M = K.materials('araba', {
  kaba_tahta: [PAINT.tahta, 256, 256, [118, 108, 94]], kereste: [PAINT.kereste, 256, 256, [74, 58, 44]],
  boyali_ahsap: [PAINT.tahta, 256, 256, [96, 58, 44]], siyah_boya: [PAINT.kereste, 256, 256, [34, 31, 30]],
  fici_tahtasi: [PAINT.tahta, 256, 256, [124, 94, 60]], sandik: [PAINT.tahta, 256, 256, [134, 106, 72]],
  saman: [PAINT.lif, 256, 256, '#a88a42', ['#d9bc62', '#b89846', '#8a6e2e', '#e6d08a'], 1400, 30, true],
  cuval_bezi: [PAINT.lif, 256, 256, '#8a7858', ['#a39070', '#6e5e42'], 1600, 12, false],
  bez_tente: [PAINT.lif, 256, 256, '#b3a585', ['#c9bd9c', '#978a6c', '#a89a7a'], 1500, 16, false],
  deri: [PAINT.lif, 256, 256, '#4a2f1e', ['#5e3e28', '#382216'], 900, 10, false],
  doseme: [PAINT.lif, 256, 256, '#6a1f24', ['#7c2a2e', '#541518'], 900, 6, true],
  koruk_derisi: [koruk], demir: 0x26221e, pirinc: 0x9a7a34, fener_cami: 0xd9cc98,
});
for (const m of Object.values(M)) m.side = THREE.DoubleSide;

// ---------- Yardımcılar ----------
const centroid = (pts) => pts.reduce((c, q) => c.add(q), V(0, 0, 0)).multiplyScalar(1 / pts.length);
const ring = (c, u, w, ru, rw, n, ph = 0) => Array.from({ length: n }, (_, k) => c.clone().addScaledVector(u, Math.cos((k / n) * TAU + ph) * ru).addScaledVector(w, Math.sin((k / n) * TAU + ph) * rw));
function loft(p, mat, R, s = 2) { // kapalı kesit halkaları arasında yüzey
  for (let j = 0; j + 1 < R.length; j++) {
    const A = R[j], B = R[j + 1], n = A.length, cc = centroid([...A, ...B]);
    for (let k = 0; k < n; k++) {
      const k1 = (k + 1) % n, pts = [A[k], A[k1], B[k1], B[k]];
      p.quad(typeof mat === 'function' ? mat(j) : mat, pts, [[(k / n) * s, j * 0.5], [((k + 1) / n) * s, j * 0.5], [((k + 1) / n) * s, j * 0.5 + 0.5], [(k / n) * s, j * 0.5 + 0.5]], centroid(pts).sub(cc));
    }
  }
}
function cap(p, mat, pts, hint) {
  const c = centroid(pts), n = pts.length, uv = (k) => [0.5 + 0.5 * Math.cos((k / n) * TAU), 0.5 + 0.5 * Math.sin((k / n) * TAU)];
  for (let k = 0; k < n; k++) p.tri(mat, [c, pts[k], pts[(k + 1) % n]], [[0.5, 0.5], uv(k), uv(k + 1)], hint);
}
const strip = (p, mat, pts, off, hintOf) => { // iki yüzlü ince şerit (kayış, bez)
  for (let k = 0; k + 1 < pts.length; k++) p.quad(mat, [pts[k], pts[k + 1], pts[k + 1].clone().add(off), pts[k].clone().add(off)], [[k * 0.3, 0], [k * 0.3 + 0.3, 0], [k * 0.3 + 0.3, 0.2], [k * 0.3, 0.2]], hintOf(pts[k].clone().add(pts[k + 1]).multiplyScalar(0.5)));
};
// Tekerlek: merkez orijinde, eksen X
function tekerlek(name, r, { n = 12, spokes = 6, solid = false } = {}) {
  const p = new Part(name), P = (x, rad, a) => V(x, Math.cos(a) * rad, Math.sin(a) * rad);
  if (solid) {
    const hw = 0.05;
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * TAU, a1 = ((k + 1) / n) * TAU;
      p.quad('kereste', [P(-hw, r, a0), P(hw, r, a0), P(hw, r, a1), P(-hw, r, a1)], [[0, k / 4], [0.1, k / 4], [0.1, (k + 1) / 4], [0, (k + 1) / 4]], P(0, 1, (a0 + a1) / 2));
      for (const s of [-1, 1]) p.tri('kaba_tahta', [V(s * hw, 0, 0), P(s * hw, r, a0), P(s * hw, r, a1)], [[0.5, 0.5], [0.5 + 0.5 * Math.sin(a0), 0.5 + 0.5 * Math.cos(a0)], [0.5 + 0.5 * Math.sin(a1), 0.5 + 0.5 * Math.cos(a1)]], V(s, 0, 0));
    }
    box(p, 'kereste', -0.14, 0.14, -0.1, 0.1, -0.1, 0.1, ALL, 1);
    for (const s of [-1, 1]) box(p, 'kereste', s > 0 ? hw : -hw - 0.025, s > 0 ? hw + 0.025 : -hw, -0.07, 0.07, -r + 0.05, r - 0.05, [s > 0 ? '+x' : '-x', '+y', '-y', '+z', '-z'], 1);
  } else {
    const w = 0.035, t = 0.09;
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * TAU, a1 = ((k + 1) / n) * TAU, m = P(0, 1, (a0 + a1) / 2);
      p.quad('demir', [P(-w, r, a0), P(w, r, a0), P(w, r, a1), P(-w, r, a1)], K.FLAT, m);
      for (const s of [-1, 1]) p.quad('kereste', [P(s * w, r, a0), P(s * w, r, a1), P(0, r - t, a1), P(0, r - t, a0)], [[k / 3, 0], [(k + 1) / 3, 0], [(k + 1) / 3, 0.2], [k / 3, 0.2]], V(s, 0, 0).addScaledVector(m, -0.3));
    }
    for (let i = 0; i < spokes; i++) cyl(p, 'kereste', P(0, 0.06, ((i + 0.5) / spokes) * TAU), P(0, r - t + 0.02, ((i + 0.5) / spokes) * TAU), 0.024, 3, false);
    cyl(p, 'kereste', V(-0.1, 0, 0), V(0.1, 0, 0), 0.08, 6, true, 'demir');
  }
  const mesh = p.mesh(M);
  mesh.name = name;
  return mesh;
}
// Dört tekerlekli şasi: akslar, yastıklar, ara kiriş, oklar, falaka
function sasi(p, { zf, zr, rf, rr, tr, deckY, sx = 0.38, len = 2.7, reach = true }) {
  for (const [z, r] of [[zf, rf], [zr, rr]]) {
    box(p, 'kereste', -tr + 0.04, tr - 0.04, r - 0.045, r + 0.045, z - 0.045, z + 0.045, ['+y', '-y', '+z', '-z'], 1);
    if (deckY > r + 0.05) box(p, 'kereste', -0.5, 0.5, r + 0.045, deckY, z - 0.06, z + 0.06, ['+x', '-x', '+z', '-z'], 1);
  }
  if (reach) beam(p, 'kereste', V(0, rf, zf), V(0, rr, zr), 0.07, 0.07, false);
  oklar(p, V(0, rf + 0.03, zf), len, sx);
}
function oklar(p, a, len, sx, yEnd = 1.0) {
  for (const s of [-1, 1]) beam(p, 'kereste', V(s * sx, a.y, a.z), V(s * sx, yEnd, a.z + len), 0.06, 0.05);
  const t = 0.42 / len, y = a.y + (yEnd - a.y) * t;
  box(p, 'kereste', -sx - 0.1, sx + 0.1, y + 0.03, y + 0.08, a.z + 0.38, a.z + 0.46, ALL, 1);
}
const side = (s) => (s > 0 ? '+x' : '-x');

// ---------- Arabalar: build(p) -> { wheels: [[ad, r, x, z, opts]], surucu, at } ----------
const yukGovde = (p) => {
  sasi(p, { zf: 0.95, zr: -0.95, rf: 0.5, rr: 0.6, tr: 0.86, deckY: 0.78 });
  box(p, 'kaba_tahta', -0.75, 0.75, 0.78, 0.83, -1.5, 1.5, ALL, 1);
  for (const s of [-1, 1]) {
    box(p, 'kaba_tahta', s > 0 ? 0.715 : -0.75, s > 0 ? 0.75 : -0.715, 0.83, 1.13, -1.5, 1.5, ['+x', '-x', '+z', '-z', '+y'], 1);
    box(p, 'kaba_tahta', -0.715, 0.715, 0.83, 1.13, s > 0 ? 1.465 : -1.5, s > 0 ? 1.5 : -1.465, ['+z', '-z', '+y'], 1);
    for (const z of [-1.2, 0, 1.2]) box(p, 'kereste', s > 0 ? 0.75 : -0.79, s > 0 ? 0.79 : -0.75, 0.7, 1.2, z - 0.03, z + 0.03, [side(s), '+z', '-z', '+y', '-y'], 1);
  }
  box(p, 'kaba_tahta', -0.75, 0.75, 1.13, 1.17, 1.0, 1.35, ALL, 1);
  return {
    wheels: [['tekerlek_sol_on', 0.5, 0.86, 0.95], ['tekerlek_sag_on', 0.5, -0.86, 0.95], ['tekerlek_sol_arka', 0.6, 0.86, -0.95], ['tekerlek_sag_arka', 0.6, -0.86, -0.95]],
    surucu: V(0, 1.17, 1.175), at: V(0, 0, 2.8),
  };
};
const oct = (hx, hz, y, cz) => { const c = Math.min(hx, hz) * 0.42; return [[hx, -hz + c], [hx, hz - c], [hx - c, hz], [-hx + c, hz], [-hx, hz - c], [-hx, -hz + c], [-hx + c, -hz], [hx - c, -hz]].map(([x, z]) => V(x, y, z + cz)); };
const ARABALAR = {
  yuk_arabasi_donen: yukGovde,
  kagni_donen: (p) => {
    box(p, 'kereste', -0.95, 0.95, 0.54, 0.66, -0.06, 0.06, ALL, 1);
    for (const s of [-1, 1]) {
      box(p, 'kereste', s * 0.62 - 0.05, s * 0.62 + 0.05, 0.67, 0.77, -1.3, 1.3, ALL, 1);
      for (const z of [-1.15, 0, 1.15]) box(p, 'kereste', s * 0.68 - 0.02, s * 0.68 + 0.02, 0.81, 1.3, z - 0.02, z + 0.02, ['+x', '-x', '+z', '-z'], 1);
      box(p, 'kereste', s * 0.68 - 0.025, s * 0.68 + 0.025, 1.3, 1.35, -1.3, 1.3, ALL, 1);
    }
    box(p, 'kaba_tahta', -0.7, 0.7, 0.77, 0.81, -1.3, 1.3, ALL, 1);
    beam(p, 'kereste', V(0, 0.72, 0), V(0, 1.2, 4.1), 0.1, 0.1);
    box(p, 'kereste', -0.8, 0.8, 1.23, 1.31, 3.9, 4.0, ALL, 1);
    for (const x of [-0.7, -0.3, 0.3, 0.7]) box(p, 'kereste', x - 0.018, x + 0.018, 0.85, 1.23, 3.932, 3.968, ['+x', '-x', '+z', '-z'], 1);
    return { wheels: [['tekerlek_sol', 0.6, 0.82, 0, { solid: true, n: 16 }], ['tekerlek_sag', 0.6, -0.82, 0, { solid: true, n: 16 }]], surucu: V(0, 0.81, 1.0), at: V(0, 0, 3.2) };
  },
  tenteli_araba: (p) => {
    sasi(p, { zf: 0.95, zr: -0.95, rf: 0.5, rr: 0.6, tr: 0.82, deckY: 0.78 });
    box(p, 'boyali_ahsap', -0.7, 0.7, 0.78, 0.83, -1.4, 1.4, ALL, 1);
    for (const s of [-1, 1]) {
      box(p, 'boyali_ahsap', s > 0 ? 0.665 : -0.7, s > 0 ? 0.7 : -0.665, 0.83, 1.28, -1.4, 1.4, ['+x', '-x', '+z', '-z', '+y'], 1);
      box(p, 'boyali_ahsap', -0.665, 0.665, 0.83, 1.28, s > 0 ? 1.365 : -1.4, s > 0 ? 1.4 : -1.365, ['+z', '-z', '+y'], 1);
      for (const z of [-1.37, 0, 1.37]) box(p, 'kereste', s * 0.68 - 0.025, s * 0.68 + 0.025, 1.28, 2.13, z - 0.025, z + 0.025, ['+x', '-x', '+z', '-z'], 1);
      // Yan saçak ve arka yarıda yan perde
      p.quad('bez_tente', [V(s * 0.78, 1.95, -1.5), V(s * 0.78, 1.95, 1.5), V(s * 0.78, 2.12, 1.5), V(s * 0.78, 2.12, -1.5)], [[0, 0], [3, 0], [3, 0.17], [0, 0.17]], V(s, 0, 0));
      p.quad('bez_tente', [V(s * 0.71, 1.28, -1.42), V(s * 0.71, 1.28, -0.5), V(s * 0.78, 1.95, -0.5), V(s * 0.78, 1.95, -1.5)], [[0, 0], [1, 0], [1, 0.7], [0, 0.7]], V(s, 0, 0));
      box(p, 'demir', s > 0 ? 0.7 : -0.9, s > 0 ? 0.9 : -0.7, 0.42, 0.44, 0.1, 0.4, [side(s), '+y', '-y', '+z', '-z'], 1);
    }
    const X = [-0.78, -0.45, 0, 0.45, 0.78], Y = [2.12, 2.27, 2.33, 2.27, 2.12];
    for (let k = 0; k < 4; k++) {
      p.quad('bez_tente', [V(X[k], Y[k], -1.5), V(X[k + 1], Y[k + 1], -1.5), V(X[k + 1], Y[k + 1], 1.5), V(X[k], Y[k], 1.5)], [[X[k], 0], [X[k + 1], 0], [X[k + 1], 3], [X[k], 3]], V(0, 1, 0));
      for (const z of [-1.5, 1.5]) p.tri('bez_tente', [V(0, 2.12, z), V(X[k], Y[k], z), V(X[k + 1], Y[k + 1], z)], [[0, 0], [X[k], 0.2], [X[k + 1], 0.2]], V(0, 0, z));
    }
    p.quad('bez_tente', [V(-0.78, 1.95, 1.5), V(0.78, 1.95, 1.5), V(0.78, 2.12, 1.5), V(-0.78, 2.12, 1.5)], [[0, 0], [1.5, 0], [1.5, 0.17], [0, 0.17]], V(0, 0, 1));
    p.quad('bez_tente', [V(-0.71, 1.28, -1.42), V(0.71, 1.28, -1.42), V(0.78, 2.12, -1.5), V(-0.78, 2.12, -1.5)], [[0, 0], [1.5, 0], [1.5, 0.85], [0, 0.85]], V(0, 0, -1));
    for (const [z0, z1] of [[-1.3, -0.85], [0.9, 1.3]]) {
      box(p, 'boyali_ahsap', -0.665, 0.665, 0.83, 1.2, z0, z1, ['+z', '-z', '+y'], 1);
      box(p, 'doseme', -0.64, 0.64, 1.2, 1.26, z0 + 0.02, z1 - 0.02, ['+x', '-x', '+z', '-z', '+y'], 1);
    }
    return {
      wheels: [['tekerlek_sol_on', 0.5, 0.82, 0.95], ['tekerlek_sag_on', 0.5, -0.82, 0.95], ['tekerlek_sol_arka', 0.6, 0.82, -0.95], ['tekerlek_sag_arka', 0.6, -0.82, -0.95]],
      surucu: V(0, 1.26, 1.1), at: V(0, 0, 2.8),
    };
  },
  fayton: (p) => {
    const zf = 0.85, zr = -0.85, rf = 0.42, rr = 0.58, tr = 0.75;
    sasi(p, { zf, zr, rf, rr, tr, deckY: 0.5, reach: false });
    box(p, 'siyah_boya', -0.5, 0.5, 0.5, 0.56, -1.0, 1.0, ALL, 1);
    for (const s of [-1, 1]) {
      box(p, 'siyah_boya', s > 0 ? 0.46 : -0.5, s > 0 ? 0.5 : -0.46, 0.56, 0.98, -1.0, 0.3, ['+x', '-x', '+z', '-z', '+y'], 1);
      // Çamurluklar
      for (const [zc, r] of [[zf, rf], [zr, rr]]) {
        for (let k = 0; k < 4; k++) {
          const a0 = 0.35 + (k / 4) * 2.44, a1 = 0.35 + ((k + 1) / 4) * 2.44, R = r + 0.07, q = (x, a) => V(s * x, r + Math.sin(a) * R, zc + Math.cos(a) * R);
          p.quad('siyah_boya', [q(tr - 0.08, a0), q(tr + 0.08, a0), q(tr + 0.08, a1), q(tr - 0.08, a1)], [[0, k / 4], [0.2, k / 4], [0.2, (k + 1) / 4], [0, (k + 1) / 4]], V(0, Math.sin((a0 + a1) / 2), Math.cos((a0 + a1) / 2)));
        }
      }
      box(p, 'fener_cami', s * 0.55 - 0.05, s * 0.55 + 0.05, 1.0, 1.15, 0.84, 0.94, ALL, 1);
      box(p, 'pirinc', s * 0.55 - 0.06, s * 0.55 + 0.06, 1.15, 1.19, 0.83, 0.95, ALL, 1);
      box(p, 'demir', s > 0 ? 0.5 : -0.72, s > 0 ? 0.72 : -0.5, 0.3, 0.32, -0.12, 0.14, ALL, 1);
      // Körük yan yüzü
      const H = [[-1.12, 1.0], [-1.2, 1.55], [-1.0, 2.0], [-0.5, 2.15], [0.0, 2.02]];
      for (let k = 0; k < 4; k++) p.tri('koruk_derisi', [V(s * 0.54, 1.0, -0.75), V(s * 0.54, H[k][1], H[k][0]), V(s * 0.54, H[k + 1][1], H[k + 1][0])], [[0.5, 0], [k / 4, 1], [(k + 1) / 4, 1]], V(s, 0, 0));
      if (s > 0) for (let k = 0; k < 4; k++) p.quad('koruk_derisi', [V(-0.54, H[k][1], H[k][0]), V(0.54, H[k][1], H[k][0]), V(0.54, H[k + 1][1], H[k + 1][0]), V(-0.54, H[k + 1][1], H[k + 1][0])], [[0, k / 2], [1, k / 2], [1, (k + 1) / 2], [0, (k + 1) / 2]], V(0, H[k][0] < -0.9 ? 0.2 : 1, H[k][0] < -0.9 ? -1 : 0));
    }
    box(p, 'siyah_boya', -0.46, 0.46, 0.56, 1.0, -1.0, -0.96, ['+z', '-z', '+y'], 1);
    box(p, 'siyah_boya', -0.46, 0.46, 0.56, 0.88, -0.96, -0.4, ['+z', '+y'], 1);
    box(p, 'doseme', -0.44, 0.44, 0.88, 0.97, -0.94, -0.42, ['+x', '-x', '+z', '-z', '+y'], 1);
    beam(p, 'doseme', V(0, 0.92, -0.97), V(0, 1.5, -1.09), 0.06, 0.9);
    // Sürücü sandığı ve yüksek oturak
    box(p, 'siyah_boya', -0.42, 0.42, 0.56, 1.15, 0.45, 0.85, ['+x', '-x', '+z', '-z'], 1);
    box(p, 'siyah_boya', -0.48, 0.48, 1.15, 1.2, 0.4, 0.9, ALL, 1);
    box(p, 'doseme', -0.44, 0.44, 1.2, 1.27, 0.44, 0.86, ['+x', '-x', '+z', '-z', '+y'], 1);
    beam(p, 'siyah_boya', V(0, 0.56, 1.0), V(0, 0.95, 1.3), 0.03, 1.0);
    return {
      wheels: [['tekerlek_sol_on', rf, tr, zf, { n: 12, spokes: 6 }], ['tekerlek_sag_on', rf, -tr, zf], ['tekerlek_sol_arka', rr, tr, zr], ['tekerlek_sag_arka', rr, -tr, zr]],
      surucu: V(0, 1.27, 0.65), at: V(0, 0, 2.7),
    };
  },
  su_arabasi: (p) => {
    box(p, 'kereste', -0.68, 0.68, 0.605, 0.695, -0.045, 0.045, ['+y', '-y', '+z', '-z'], 1);
    for (const s of [-1, 1]) box(p, 'kereste', s * 0.38 - 0.035, s * 0.38 + 0.035, 0.695, 0.765, -1.0, 1.3, ALL, 1);
    for (const z of [-0.95, 1.25]) box(p, 'kereste', -0.345, 0.345, 0.705, 0.755, z - 0.035, z + 0.035, ['+y', '-y', '+z', '-z'], 1);
    oklar(p, V(0, 0.75, 1.2), 2.1, 0.38);
    for (const z of [-0.5, 0.5]) box(p, 'kereste', -0.42, 0.42, 0.765, 0.97, z - 0.04, z + 0.04, ALL, 1);
    // Fıçı: ekseni Z
    const cy = 1.34, X = V(1, 0, 0), Y = V(0, 1, 0), rg = (z, r) => ring(V(0, cy, z), X, Y, r, r, 10), R = [rg(-0.8, 0.36), rg(-0.3, 0.44), rg(0.3, 0.44), rg(0.8, 0.36)];
    loft(p, 'fici_tahtasi', R, 3);
    cap(p, 'fici_tahtasi', R[0], V(0, 0, -1));
    cap(p, 'fici_tahtasi', R[3], V(0, 0, 1));
    for (const [z, r] of [[-0.72, 0.38], [-0.34, 0.446], [0.34, 0.446], [0.72, 0.38]]) loft(p, 'demir', [rg(z - 0.025, r), rg(z + 0.025, r)], 1);
    box(p, 'kereste', -0.05, 0.05, cy + 0.42, cy + 0.5, -0.05, 0.05, ['+x', '-x', '+z', '-z', '+y'], 1);
    beam(p, 'pirinc', V(0, cy - 0.26, -0.8), V(0, cy - 0.28, -0.95), 0.035, 0.035);
    lathe(p, 'kaba_tahta', 0.38, -1.12, [[0, 0.44], [0.1, 0.44], [0.13, 0.7], [0, 0.66]], 6, 1);
    box(p, 'sandik', -0.42, 0.42, 0.765, 1.0, 0.9, 1.28, ALL, 1);
    return { wheels: [['tekerlek_sol', 0.65, 0.72, 0, { spokes: 8 }], ['tekerlek_sag', 0.65, -0.72, 0, { spokes: 8 }]], surucu: V(0, 1.0, 1.09), at: V(0, 0, 2.45) };
  },
  saman_arabasi: (p) => {
    const r = yukGovde(p), L = [oct(0.7, 1.15, 0.86, -0.4), oct(0.98, 1.38, 1.25, -0.4), oct(1.0, 1.4, 1.7, -0.4), oct(0.8, 1.2, 2.1, -0.4), oct(0.42, 0.75, 2.35, -0.4)];
    loft(p, 'saman', L, 4);
    cap(p, 'saman', L[4], V(0, 1, 0));
    cap(p, 'saman', L[0], V(0, -1, 0));
    return r;
  },
};
// ---------- Koşum takımı ve yük dengi (tek ağ) ----------
const DIGER = {
  kosum_takimi: (p) => {
    const th = 0.44, C = V(0, 1.28, 0.82), a = V(1, 0, 0), b = V(0, Math.cos(th), -Math.sin(th)), nr = V(0, Math.sin(th), Math.cos(th)), R = [];
    for (let i = 0; i <= 10; i++) {
      const f = (i / 10) * TAU, e = a.clone().multiplyScalar(Math.cos(f)).addScaledVector(b, Math.sin(f));
      R.push(ring(C.clone().addScaledVector(a, 0.27 * Math.cos(f)).addScaledVector(b, 0.38 * Math.sin(f)), e, nr, 0.06, 0.05, 4));
    }
    loft(p, 'deri', R, 1); // hamut
    for (const s of [-1, 1]) {
      const at = (x, y) => C.clone().addScaledVector(a, s * x).addScaledVector(b, y).addScaledVector(nr, 0.065);
      beam(p, 'kereste', at(0.24, -0.26), at(0.3, 0.1), 0.035, 0.035, false); // hamut ağaçları
      beam(p, 'kereste', at(0.3, 0.1), at(0.1, 0.52), 0.035, 0.035);
      beam(p, 'deri', V(s * 0.3, 1.2, 0.8), V(s * 0.35, 0.95, -1.25), 0.05, 0.012); // çeki kayışı
      beam(p, 'deri', V(s * 0.32, 1.14, -0.7), V(s * 0.34, 1.02, -0.78), 0.012, 0.04, false);
    }
    loft(p, 'deri', [ring(V(0, 1.14, 0.255), a, V(0, 1, 0), 0.31, 0.37, 10), ring(V(0, 1.14, 0.345), a, V(0, 1, 0), 0.31, 0.37, 10)], 2); // kolan
    box(p, 'deri', -0.13, 0.13, 1.5, 1.545, 0.2, 0.4, ALL, 1);
    beam(p, 'deri', V(0, 1.525, 0.3), V(0, 1.51, -0.72), 0.012, 0.04);
    const arc = (f) => Array.from({ length: 6 }, (_, k) => f((k / 5) * Math.PI));
    strip(p, 'deri', arc((t) => V(Math.cos(t) * 0.32, 1.14 + Math.sin(t) * 0.38, -0.72)), V(0, 0, 0.05), (m) => V(m.x, m.y - 1.14, 0)); // sağrı kayışı
    strip(p, 'deri', arc((t) => V(Math.cos(t) * 0.34, 1.0, -0.78 - Math.sin(t) * 0.36)), V(0, 0.07, 0), (m) => V(m.x, 0, m.z + 0.78)); // paldım
  },
  yuk_denk: (p) => {
    box(p, 'sandik', -0.6, 0.0, 0, 0.44, -0.8, -0.1, ALL, 1);
    box(p, 'sandik', 0.05, 0.6, 0, 0.36, -0.75, -0.2, ALL, 1);
    box(p, 'sandik', 0.1, 0.6, 0, 0.3, 0.3, 0.8, ALL, 1);
    for (const [x0, x1, y, z0, z1] of [[-0.6, 0, 0.3, -0.8, -0.1], [0.05, 0.6, 0.24, -0.75, -0.2], [0.1, 0.6, 0.2, 0.3, 0.8]]) box(p, 'demir', x0 - 0.006, x1 + 0.006, y, y + 0.03, z0 - 0.006, z1 + 0.006, ['+x', '-x', '+z', '-z'], 1);
    const sack = (c, yaw, len, rw, rh) => {
      const d = V(Math.sin(yaw), 0, Math.cos(yaw)), u = V(d.z, 0, -d.x), up = V(0, 1, 0);
      const R = [[-0.5, 0.45], [-0.36, 1], [0.36, 1], [0.5, 0.45]].map(([t, k]) => ring(c.clone().addScaledVector(d, t * len), u, up, rw * k, rh * k, 6));
      loft(p, 'cuval_bezi', R, 2);
      cap(p, 'cuval_bezi', R[0], d.clone().negate());
      cap(p, 'cuval_bezi', R[3], d);
    };
    sack(V(-0.3, 0.2, 0.36), 0, 0.86, 0.28, 0.2);
    sack(V(-0.29, 0.56, 0.3), 0.12, 0.8, 0.26, 0.17);
    sack(V(-0.3, 0.62, -0.45), 0, 0.68, 0.28, 0.18);
    sack(V(0.32, 0.54, -0.47), -0.15, 0.5, 0.25, 0.18);
    sack(V(0.35, 0.47, 0.55), Math.PI / 2, 0.48, 0.23, 0.17);
    sack(V(0.3, 0.19, 0.05), Math.PI / 2, 0.56, 0.2, 0.19);
  },
};
export const PARCALAR = [...Object.keys(ARABALAR), ...Object.keys(DIGER)];
const cache = new Map(), wheelCache = new Map();
const clone = (src, name) => { const m = new THREE.Mesh(src.geometry, src.material); m.name = name; m.castShadow = m.receiveShadow = true; return m; };
export function createParca(name) {
  const g = new THREE.Group();
  g.name = name;
  if (!cache.has(name)) { const p = new Part(name); cache.set(name, { info: (ARABALAR[name] || DIGER[name])(p), mesh: p.mesh(M) }); }
  const { info, mesh } = cache.get(name);
  if (!ARABALAR[name]) return clone(mesh, name);
  g.add(clone(mesh, 'govde'));
  for (const [wn, r, x, z, o = {}] of info.wheels) {
    const key = JSON.stringify([r, o]);
    if (!wheelCache.has(key)) wheelCache.set(key, tekerlek('tekerlek', r, o));
    const w = clone(wheelCache.get(key), wn);
    w.position.set(x, r, z);
    g.add(w);
  }
  for (const [n, v] of [['surucu_yeri', info.surucu], ['at_yeri', info.at]]) { const e = new THREE.Object3D(); e.name = n; e.position.copy(v); g.add(e); }
  return g;
}
export function createKit() {
  const root = new THREE.Group();
  root.name = 'at_arabasi_kiti';
  PARCALAR.forEach((n, i) => { const o = createParca(n); o.position.x = (i - (PARCALAR.length - 1) / 2) * 4; root.add(o); });
  return root;
}
