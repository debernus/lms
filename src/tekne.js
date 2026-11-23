import * as THREE from 'three';
import * as K from './kit_ortak.js';
const { V, ALL, SIDES, PAINT, TAU, box, quad, tri, beam, cyl, lathe } = K;

// Gezilebilir tekneler (Osmanlı, 1900'ler): yelkenli yük gemisi (kamaralı) ve balıkçı kayığı.
// 1 birim = 1 metre, Y yukarı, pruva +Z, su hattı y = 0, tekne boyca ortalı.
// Gemi: güverte y = 1,2; sancak (+X) bordasında borda kapısı ve iskele tahtası; kıç güvertede kamara
// (kapısı gerçek açıklık, içinde ranza, masa, sandık). Kayık: döşeme tahtası y = 0,1, üç oturak.
// Gövde kabuğu çift taraflıdır (içeriden de görünür). Çarpışma eklenmemiştir.

const M = K.materials('tekne', {
  govde: [PAINT.tahta_yatay, 256, 256, [52, 40, 32]], borda: [PAINT.tahta_yatay, 256, 256, [58, 92, 96]], guverte: [PAINT.tahta, 256, 256, [150, 128, 96]],
  kereste: [PAINT.kereste], kamara_tahtasi: [PAINT.tahta, 256, 256, [150, 140, 116]], kamara_dami: [PAINT.toprak, 256, 256, '#3a3a38'],
  pencere_cam: [PAINT.cam, 128, 192], ahsap_kapi: [PAINT.kapi, 128, 192], kilim: [PAINT.lif, 256, 256, '#7a2a22', ['#a8482e', '#c2aa72', '#3a3a5a'], 900, 40, false],
  yelken_bezi: 0xcfc6ae, halat: 0x8a7a5a, demir: 0x26221e, karanlik: 0x14110e, fener_cami: 0xcdb46a, yatak: 0xb9b2a0,
});
for (const m of Object.values(M)) m.side = THREE.DoubleSide;

// Gövde: P { L (yarı boy), B (yarı en), k0 (omurga derinliği), deck, bul (küpeşte yüksekliği), rise (pruva-kıç kalkımı),
// bow (pruva sivriliği), tr (ayna genişlik oranı), flare, N, gate: [i0, i1] sancakta küpeştesi açık istasyon aralığı }
function hull(P) {
  const st = (i) => {
    const t = -1 + (2 * i) / P.N, z = t * P.L;
    const b = t > 0 ? P.B * (1 - t ** P.bow) ** 0.8 : P.B * (1 - (1 - P.tr) * (-t) ** 3);
    const keel = P.k0 * (1 - 0.85 * Math.max(0, t) ** 3 - 0.5 * Math.max(0, -t) ** 4);
    return { z, b, keel, sheer: P.deck + P.bul + P.rise * t * t };
  };
  const S = [0, 0.2, 0.45, 0.72, 1];
  const pt = (s, side, j) => (j < S.length ? V(side * s.b * S[j] ** 0.4, s.keel + (P.deck - s.keel) * S[j], s.z) : V(side * s.b * P.flare, s.sheer, s.z));
  const shell = new K.Part('govde'), deck = new K.Part('guverte');
  for (let i = 0; i < P.N; i++) {
    const a = st(i), b = st(i + 1);
    for (const side of [1, -1]) {
      for (let j = 0; j < S.length; j++) {
        if (j === S.length - 1 && side > 0 && P.gate && i >= P.gate[0] && i < P.gate[1]) continue; // borda kapısı
        const q = [pt(a, side, j), pt(b, side, j), pt(b, side, j + 1), pt(a, side, j + 1)];
        shell.quad(j === S.length - 1 ? 'borda' : 'govde', q, q.map((v) => [v.z / 1.5, v.y / 1.5]), V(side, -0.2, 0));
      }
      // Küpeşte tahtası
      if (!(side > 0 && P.gate && i >= P.gate[0] && i < P.gate[1])) {
        const o = (s, d) => V(side * (s.b * P.flare + d), s.sheer + 0.01, s.z);
        shell.quad('kereste', [o(a, -0.06), o(b, -0.06), o(b, 0.06), o(a, 0.06)], [[0, 0], [0.5, 0], [0.5, 0.1], [0, 0.1]], V(0, 1, 0));
      }
    }
    const q = [V(-a.b, P.deck, a.z), V(a.b, P.deck, a.z), V(b.b, P.deck, b.z), V(-b.b, P.deck, b.z)];
    deck.quad('guverte', q, q.map((v) => [v.x / 1.2, v.z / 1.2]), V(0, 1, 0));
  }
  const a = st(0); // kıç aynası
  for (let j = 0; j < S.length; j++) {
    const q = [pt(a, -1, j), pt(a, 1, j), pt(a, 1, j + 1), pt(a, -1, j + 1)];
    shell.quad(j === S.length - 1 ? 'borda' : 'govde', q, q.map((v) => [v.x / 1.5, v.y / 1.5]), V(0, 0, -1));
  }
  return { shell, deck, st, half: (z) => st(((z / P.L + 1) * P.N) / 2).b };
}

export function createGemi() {
  const root = new THREE.Group();
  root.name = 'gemi';
  const P = { L: 8, B: 2.3, k0: -1.0, deck: 1.2, bul: 0.85, rise: 0.5, bow: 2.2, tr: 0.6, flare: 1.04, N: 24, gate: [15, 17] }, D = P.deck;
  const H = hull(P), add = (part) => root.add(part.mesh(M));
  // Omurga, baş bodoslama, dümen
  beam(H.shell, 'kereste', V(0, -1.05, -7.6), V(0, -0.55, 5.5), 0.3, 0.14);
  beam(H.shell, 'kereste', V(0, -0.5, 5.6), V(0, 2.75, 8.1), 0.22, 0.14);
  box(H.shell, 'kereste', -0.05, 0.05, -0.9, 2.3, -8.75, -8.02, ALL, 1);
  add(H.shell);
  // Güverte donanımı: ambar ağzı, ırgat, babalar
  box(H.deck, 'kereste', -0.85, 0.85, D, D + 0.32, 3.4, 5.4, SIDES, 1);
  box(H.deck, 'guverte', -0.9, 0.9, D + 0.32, D + 0.38, 3.35, 5.45, ALL, 1.2);
  cyl(H.deck, 'kereste', V(-0.5, D + 0.45, 6.5), V(0.5, D + 0.45, 6.5), 0.14, 8);
  for (const x of [-0.58, 0.58]) box(H.deck, 'kereste', x - 0.06, x + 0.06, D, D + 0.7, 6.42, 6.58, ['+x', '-x', '+z', '-z', '+y'], 1);
  for (const [x, z] of [[-1.7, 1.5], [1.7, 1.5], [-1.5, -7.2], [1.5, -7.2]]) cyl(H.deck, 'kereste', V(x, D, z), V(x, D + 0.5, z), 0.07, 6);
  lathe(H.deck, 'halat', -1.2, 5.9, [[0.3, D], [0.3, D + 0.1], [0.12, D + 0.1], [0.12, D]], 8); // halat roda
  add(H.deck);

  // ---------- Kamara: kıç güvertede; ön duvarında kapı açıklığı ----------
  const cabin = new K.Part('kamara'), X0 = -1.5, X1 = 1.5, Z0 = -6.5, Z1 = -2.5, T = 0.08, Y1 = D + 2.0, DW = 0.42, DH = D + 1.8;
  const W = (x0, x1, y0, y1, z0, z1) => box(cabin, 'kamara_tahtasi', x0, x1, y0, y1, z0, z1, ALL, 1.2);
  W(X0, X1, D, Y1, Z0, Z0 + T); // arka
  W(X0, X0 + T, D, Y1, Z0, Z1); // iskele yanı
  W(X1 - T, X1, D, Y1, Z0, Z1); // sancak yanı
  W(X0, -DW, D, Y1, Z1 - T, Z1); // ön: kapının solu, sağı, üstü
  W(DW, X1, D, Y1, Z1 - T, Z1);
  W(-DW, DW, DH, Y1, Z1 - T, Z1);
  box(cabin, 'kereste', X0 - 0.18, X1 + 0.18, Y1, Y1 + 0.07, Z0 - 0.15, Z1 + 0.25, ALL, 1);
  box(cabin, 'kamara_dami', X0 - 0.14, X1 + 0.14, Y1 + 0.07, Y1 + 0.1, Z0 - 0.11, Z1 + 0.21, ['+y'], 1.5);
  // Kapı kanadı: dışa açık, sancak yanına yaslı
  for (const n of [1, -1]) cabin.quad('ahsap_kapi', [V(DW, D, Z1), V(DW + 0.2, D, Z1 + 0.8), V(DW + 0.2, DH, Z1 + 0.8), V(DW, DH, Z1)], K.FLAT, V(-n, 0, 0.25 * n));
  // Pencereler (iç ve dış yüzde)
  const win = (pts, n) => cabin.quad('pencere_cam', pts, K.FLAT, n);
  for (const z of [-5.4, -3.6]) for (const s of [-1, 1]) for (const d of [0.012, -T - 0.012]) {
    const x = s * (1.5 + d);
    win([V(x, D + 1.0, z - 0.3), V(x, D + 1.0, z + 0.3), V(x, D + 1.55, z + 0.3), V(x, D + 1.55, z - 0.3)], V(s * Math.sign(d), 0, 0));
  }
  for (const x of [-0.95, 0.95]) for (const z of [Z1 + 0.012, Z1 - T - 0.012]) win([V(x - 0.22, D + 1.05, z), V(x + 0.22, D + 1.05, z), V(x + 0.22, D + 1.55, z), V(x - 0.22, D + 1.55, z)], V(0, 0, z > Z1 ? 1 : -1));
  add(cabin);
  // Kamaranın içi: ranza, masa, tabure, sandık, raf, asılı fener
  const inside = new K.Part('kamara_ici');
  box(inside, 'kereste', X0 + T, X0 + 0.85, D, D + 0.45, -6.35, -4.4, ['+x', '+z', '-z', '+y'], 1);
  box(inside, 'yatak', X0 + T + 0.03, X0 + 0.82, D + 0.45, D + 0.55, -6.3, -4.45, ['+x', '+z', '-z', '+y'], 1);
  box(inside, 'kilim', X0 + T + 0.03, X0 + 0.82, D + 0.55, D + 0.58, -5.6, -4.45, ['+x', '+z', '-z', '+y'], 0.6);
  box(inside, 'yatak', X0 + 0.15, X0 + 0.7, D + 0.55, D + 0.66, -6.28, -5.95, ALL, 1);
  box(inside, 'kereste', 0.55, X1 - T, D + 0.72, D + 0.76, -5.9, -5.0, ALL, 1); // masa
  for (const [x, z] of [[0.6, -5.85], [0.6, -5.05], [1.36, -5.85], [1.36, -5.05]]) box(inside, 'kereste', x - 0.025, x + 0.025, D, D + 0.72, z - 0.025, z + 0.025, SIDES, 1);
  lathe(inside, 'kereste', 0.25, -5.45, [[0.16, D], [0.14, D + 0.42], [0, D + 0.42]], 8); // tabure
  box(inside, 'kereste', 0.6, 1.35, D, D + 0.4, -3.6, -3.1, ALL, 0.8); // sandık
  box(inside, 'demir', 0.58, 1.37, D + 0.3, D + 0.34, -3.62, -3.08, SIDES, 1);
  box(inside, 'kereste', X0 + T, X0 + 0.3, D + 1.25, D + 1.28, -4.2, -2.9, ALL, 1); // raf
  lathe(inside, 'fener_cami', 0, -4.5, [[0.05, Y1 - 0.4], [0.08, Y1 - 0.25, 'demir'], [0.03, Y1 - 0.2, 'demir'], [0.01, Y1]], 5);
  lathe(inside, 'fener_cami', 0.95, -5.45, [[0.04, D + 0.76], [0.05, D + 0.86, 'demir'], [0, D + 0.9]], 5);
  add(inside);

  // ---------- Arma: direk, bumba, sarılı yelken, çarmıhlar, cıvadra, yeke ----------
  const rig = new K.Part('arma'), MZ = 0.8;
  lathe(rig, 'kereste', 0, MZ, [[0.17, D], [0.15, 6], [0.09, 13.2], [0, 13.4]], 8);
  beam(rig, 'kereste', V(0, D + 2.9, MZ - 0.2), V(0, D + 3.1, -7.4), 0.12, 0.12);
  cyl(rig, 'yelken_bezi', V(0, D + 3.2, MZ - 0.5), V(0, D + 3.35, -7.0), 0.17, 6);
  beam(rig, 'kereste', V(0, 9.5, MZ - 0.15), V(0, 12.2, -3.6), 0.09, 0.09);
  for (const s of [-1, 1]) for (const dz of [-0.5, 0.4]) beam(rig, 'halat', V(0, 10.5, MZ), V(s * H.half(MZ + dz) * P.flare, D + P.bul + 0.05, MZ + dz), 0.025, 0.025, false);
  beam(rig, 'kereste', V(0, 2.5, 7.6), V(0, 3.2, 11.0), 0.13, 0.13);
  beam(rig, 'halat', V(0, 12.6, MZ), V(0, 3.2, 10.9), 0.02, 0.02, false);
  beam(rig, 'kereste', V(0, 2.5, -8.4), V(0, 2.25, -7.0), 0.07, 0.07); // yeke
  add(rig);

  // ---------- İskele tahtası: borda kapısından rıhtıma ----------
  const plank = new K.Part('iskele_tahtasi'), gz = (H.st(15).z + H.st(17).z) / 2, gx = H.half(gz);
  beam(plank, 'guverte', V(gx - 0.2, D + 0.03, gz), V(gx + 3.6, 0.75, gz), 0.05, 0.75);
  for (let k = 1; k < 8; k++) {
    const p0 = V(gx - 0.2, D + 0.03, gz).lerp(V(gx + 3.6, 0.75, gz), k / 8);
    box(plank, 'kereste', p0.x - 0.02, p0.x + 0.02, p0.y + 0.02, p0.y + 0.05, gz - 0.36, gz + 0.36, ['+x', '-x', '+y'], 1);
  }
  add(plank);
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  return root;
}

export function createKayik() {
  const root = new THREE.Group();
  root.name = 'kayik';
  const P = { L: 3.6, B: 0.95, k0: -0.3, deck: 0.1, bul: 0.5, rise: 0.22, bow: 2.0, tr: 0.55, flare: 1.22, N: 16 }, D = P.deck;
  const H = hull(P), add = (part) => root.add(part.mesh(M));
  beam(H.shell, 'kereste', V(0, -0.34, -3.5), V(0, -0.1, 2.5), 0.12, 0.07);
  beam(H.shell, 'kereste', V(0, -0.1, 2.5), V(0, 0.95, 3.7), 0.1, 0.07);
  box(H.shell, 'kereste', -0.025, 0.025, -0.3, 0.75, -3.95, -3.6, ALL, 1);
  beam(H.shell, 'kereste', V(0, 0.78, -3.8), V(0, 0.7, -2.9), 0.045, 0.045); // yeke
  add(H.shell);
  const fit = new K.Part('donanim'), w = (z, y) => H.half(z) * (1 + (P.flare - 1) * ((y - D) / P.bul));
  // Oturaklar (üçü de bordadan bordaya), baş üstü, kürekler, ıskarmozlar
  for (const z of [-2.3, -0.5, 1.3]) box(fit, 'guverte', -w(z, 0.4), w(z, 0.4), 0.36, 0.4, z - 0.14, z + 0.14, ALL, 1);
  const zb = 2.4, yb = H.st(Math.round(((zb / P.L + 1) * P.N) / 2)).sheer - 0.03;
  tri(fit, 'guverte', [V(-w(zb, yb), yb, zb), V(w(zb, yb), yb, zb), V(0, yb + 0.06, 3.55)], V(0, 1, 0), 1);
  for (const s of [-1, 1]) {
    beam(fit, 'kereste', V(s * 0.35, 0.42, -1.9), V(s * 0.55, 0.5, 1.2), 0.035, 0.035);
    beam(fit, 'kereste', V(s * 0.55, 0.5, 1.2), V(s * 0.6, 0.52, 1.75), 0.02, 0.12);
    const zo = -0.2, yo = H.st(Math.round(((zo / P.L + 1) * P.N) / 2)).sheer;
    cyl(fit, 'kereste', V(s * w(zo, yo), yo, zo), V(s * w(zo, yo), yo + 0.12, zo), 0.02, 4);
  }
  // Rıhtıma uzanan binme tahtası ve iç basamak
  const zg = -1.4, yg = H.st(Math.round(((zg / P.L + 1) * P.N) / 2)).sheer + 0.02, xg = w(zg, yg);
  beam(fit, 'guverte', V(xg - 0.15, yg + 0.02, zg), V(xg + 1.9, yg + 0.15, zg), 0.04, 0.5);
  box(fit, 'guverte', xg - 0.55, xg - 0.12, D, 0.36, zg - 0.25, zg + 0.25, ['+x', '-x', '+z', '-z', '+y'], 1);
  lathe(fit, 'halat', -0.3, 2.0, [[0.2, D], [0.2, D + 0.08], [0.08, D + 0.08], [0.08, D]], 8);
  lathe(fit, 'kereste', 0.3, -2.9, [[0.11, D], [0.14, D + 0.25], [0.12, D + 0.25, 'karanlik'], [0, D + 0.2]], 8); // kova
  add(H.deck);
  add(fit);
  root.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  return root;
}
