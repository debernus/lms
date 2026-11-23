import * as THREE from 'three';
import * as K from './kit_ortak.js';
const { V, ALL, OUT, SIDES, PAINT, box, lath, quad, tri, beam, cyl, lathe, window, door } = K;

// Osmanlı köyü ahır, samanlık ve çit kiti (19. yy sonu). Duvar ve çit parçaları 3,0 m uzun; orijin alt
// kenarın ortası, dış yüz +Z. Duvar gövdesi Z -0,25 … 0; çitler Z -0,08 … +0,08.
const M = K.materials('ahir', {
  ahir_duvari: [PAINT.aralikli, 256, 256, false, 0.6], kaba_tahta: [PAINT.tahta, 256, 256, [118, 108, 94]], samanlik_tahtasi: [PAINT.aralikli, 256, 256, true],
  kutuk: [PAINT.kereste, 256, 256, [74, 58, 44]], kereste: [PAINT.kereste, 256, 256, [74, 58, 44]], moloz_tas: [PAINT.tas], ahir_kapisi: [PAINT.cift_kapi],
  saman: [PAINT.lif, 256, 256, '#a88a42', ['#d9bc62', '#b89846', '#8a6e2e', '#e6d08a'], 1400, 30, true],
  sazdan_dam: [PAINT.lif, 256, 256, '#5e5238', ['#8a7a52', '#4a4028', '#a39468', '#6e6240'], 1400, 60, true],
  hasir: [PAINT.orgu], odun_kesiti: [PAINT.odun], cuval_bezi: [PAINT.lif, 256, 256, '#8a7858', ['#a39070', '#6e5e42'], 1600, 12, false],
  toprak: [PAINT.toprak], demir: 0x26221e, karanlik: 0x14110e, su: 0x2a3a40,
});
const ahir = (p, hw = 1.5) => {
  box(p, 'ahir_duvari', -hw, hw, 0, 3, -0.25, 0, ALL, 3);
  for (const y of [1.25, 2.6]) lath(p, -hw, hw, y, y + 0.1, 0.03);
};
const samanlik = (p) => {
  box(p, 'samanlik_tahtasi', -1.5, 1.5, 0, 2, -0.25, 0, ALL, 3, 2);
  for (const x of [-1.45, 0, 1.45]) lath(p, x - 0.05, x + 0.05, 0, 2, 0.03);
};
const leafQuad = (p, hinge, end, h, u0, u1) => { // açık kapı kanadı: iki yüzlü ince levha
  for (const n of [1, -1]) p.quad('ahir_kapisi', [hinge.clone(), end.clone(), end.clone().setY(h), hinge.clone().setY(h)], [[u0, 0], [u1, 0], [u1, 1], [u0, 1]], V(-(end.z - hinge.z) * n, 0, (end.x - hinge.x) * n));
};
// Çit yardımcıları
const post = (p, x, h, half = 0, r = 0.07) => box(p, 'kutuk', half < 0 ? x : x - r, half > 0 ? x : x + r, 0, h, -r, r, ['+x', '-x', '+z', '-z', '+y'], 1);
const ends = (p, h, hw = 1.5) => { post(p, -hw, h, -1); post(p, hw, h, 1); };
const rail = (p, x0, x1, y, faces = ALL) => box(p, 'kaba_tahta', x0, x1, y, y + 0.13, 0.02, 0.06, faces, 1.5);
const gate = (p, angle) => { // tek kanatlı çit kapısı: menteşe x = -0,7
  ends(p, 1.1);
  for (const s of [-1, 1]) {
    box(p, 'kutuk', s * 0.78 - 0.08, s * 0.78 + 0.08, 0, 1.4, -0.08, 0.08, ['+x', '-x', '+z', '-z', '+y'], 1);
    for (const y of [0.35, 0.8]) rail(p, s < 0 ? -1.5 : 0.86, s < 0 ? -0.86 : 1.5, y, ['+z', '-z', '+y', '-y']);
  }
  const hinge = V(-0.7, 0, 0), dir = V(Math.cos(angle), 0, Math.sin(angle)), at = (t, y) => hinge.clone().addScaledVector(dir, t).setY(y);
  beam(p, 'kaba_tahta', at(0, 0.62), at(1.4, 0.62), 0.9, 0.035);
  for (const y of [0.3, 0.95]) beam(p, 'kutuk', at(0, y), at(1.4, y), 0.1, 0.07);
  beam(p, 'kutuk', at(0.05, 0.3), at(1.35, 0.95), 0.09, 0.075);
};
const trough = (p, mat, hx, hz, h, wall, fill, y0 = 0) => { // yalak: içi oyuk tekne
  const top = y0 + h, ix = hx - wall, iz = hz - wall, yb = y0 + h * 0.35, P = (x, y, z) => V(x, y, z);
  box(p, mat, -hx, hx, y0, top, -hz, hz, ['+x', '-x', '+z', '-z', '-y'], 1);
  for (const [a, b, c, d] of [[-hx, hx, -hz, -iz], [-hx, hx, iz, hz], [-hx, -ix, -iz, iz], [ix, hx, -iz, iz]]) quad(p, mat, [P(a, top, c), P(b, top, c), P(b, top, d), P(a, top, d)], V(0, 1, 0), 1);
  quad(p, mat, [P(-ix, yb, -iz), P(ix, yb, -iz), P(ix, top, -iz), P(-ix, top, -iz)], V(0, 0, 1), 1);
  quad(p, mat, [P(-ix, yb, iz), P(ix, yb, iz), P(ix, top, iz), P(-ix, top, iz)], V(0, 0, -1), 1);
  quad(p, mat, [P(-ix, yb, -iz), P(-ix, yb, iz), P(-ix, top, iz), P(-ix, top, -iz)], V(1, 0, 0), 1);
  quad(p, mat, [P(ix, yb, -iz), P(ix, yb, iz), P(ix, top, iz), P(ix, top, -iz)], V(-1, 0, 0), 1);
  quad(p, fill, [P(-ix, y0 + h * 0.8, -iz), P(ix, y0 + h * 0.8, -iz), P(ix, y0 + h * 0.8, iz), P(-ix, y0 + h * 0.8, iz)], V(0, 1, 0), 1);
};
const PARTS = {
  // ---- Ahır duvarları ----
  ahir_duvar: (p) => ahir(p),
  ahir_duvar_kapi: (p) => { ahir(p); door(p, 0, 2.2, 2.4, 'ahir_kapisi', { lento: true }); },
  ahir_duvar_acik_kapi: (p) => {
    ahir(p);
    p.quad('karanlik', [V(-1.1, 0, 0.012), V(1.1, 0, 0.012), V(1.1, 2.4, 0.012), V(-1.1, 2.4, 0.012)], K.FLAT, V(0, 0, 1));
    lath(p, -1.2, -1.1, 0, 2.4, 0.07);
    lath(p, 1.1, 1.2, 0, 2.4, 0.07);
    lath(p, -1.34, 1.34, 2.4, 2.56, 0.11);
    leafQuad(p, V(-1.15, 0, 0.07), V(-1.42, 0, 1.13), 2.35, 0.5, 0);
    leafQuad(p, V(1.15, 0, 0.07), V(1.36, 0, 1.15), 2.35, 0.5, 1);
  },
  ahir_duvar_pencere: (p) => { ahir(p); window(p, 0, 2.05, 0.7, 0.45, { glass: 'karanlik', bars: true }); },
  ahir_duvar_yarim: (p) => {
    box(p, 'ahir_duvari', -1.5, 1.5, 0, 1.5, -0.25, 0, ALL, 3);
    quad(p, 'kaba_tahta', [V(-1.5, 1.5, -0.25), V(1.5, 1.5, -0.25), V(1.5, 3, -0.25), V(-1.5, 3, -0.25)], V(0, 0, -1));
    quad(p, 'karanlik', [V(-1.5, 1.5, -0.24), V(1.5, 1.5, -0.24), V(1.5, 3, -0.24), V(-1.5, 3, -0.24)], V(0, 0, 1));
    for (const x of [-1.42, 0, 1.42]) box(p, 'kutuk', x - 0.08, x + 0.08, 1.5, 2.85, -0.2, -0.04, SIDES, 1);
    box(p, 'kutuk', -1.5, 1.5, 2.85, 3, -0.25, 0, ALL, 1);
    lath(p, -1.5, 1.5, 1.4, 1.52, 0.04);
  },
  ahir_duvar_dar: (p) => ahir(p, 0.3),
  ahir_kose: (p) => K.corner(p, 'kutuk', -0.24, 0.06, 3, 1),
  samanlik_duvar: samanlik,
  samanlik_duvar_kapak: (p) => {
    samanlik(p);
    p.quad('kaba_tahta', [V(-0.5, 0.35, 0.012), V(0.5, 0.35, 0.012), V(0.5, 1.5, 0.012), V(-0.5, 1.5, 0.012)], K.FLAT, V(0, 0, 1));
    lath(p, -0.57, -0.5, 0.3, 1.57, 0.05);
    lath(p, 0.5, 0.57, 0.3, 1.57, 0.05);
    lath(p, -0.57, 0.57, 1.5, 1.57, 0.05);
    box(p, 'kutuk', -0.07, 0.07, 1.76, 1.9, 0, 0.75, OUT, 1); // makara kirişi
    cyl(p, 'kutuk', V(-0.05, 1.66, 0.62), V(0.05, 1.66, 0.62), 0.09, 6);
  },
  // ---- Çatılar ----
  ahir_cati: (p) => K.catiBesik(p, 'sazdan_dam', 1.4, false, null, -0.48, 'kutuk'),
  ahir_cati_uc: (p) => K.catiBesik(p, 'sazdan_dam', 1.4, true, 'kaba_tahta', -0.48, 'kutuk'),
  sundurma_cati: (p) => {
    quad(p, 'sazdan_dam', [V(-1.5, -0.7, 3), V(1.5, -0.7, 3), V(1.5, 0, 0), V(-1.5, 0, 0)], V(0, 1, 0.3));
    quad(p, 'kutuk', [V(-1.5, -0.78, 3), V(1.5, -0.78, 3), V(1.5, -0.08, 0), V(-1.5, -0.08, 0)], V(0, -1, 0));
    quad(p, 'kutuk', [V(-1.5, -0.78, 3), V(1.5, -0.78, 3), V(1.5, -0.7, 3), V(-1.5, -0.7, 3)], V(0, 0, 1));
    for (const x of [-1.4, 1.4]) box(p, 'kutuk', x - 0.07, x + 0.07, -3, -0.76, 2.76, 2.9, SIDES, 1);
    box(p, 'kutuk', -1.5, 1.5, -0.9, -0.76, 2.76, 2.9, ['+z', '-z', '-y'], 1);
  },
  // ---- Çitler ----
  cit_tahta: (p) => { ends(p, 1.1); post(p, 0, 1.1); rail(p, -1.5, 1.5, 0.35); rail(p, -1.5, 1.5, 0.8); },
  cit_tahta_kirik: (p) => {
    ends(p, 1.1);
    post(p, 0, 1.02);
    rail(p, -1.5, 1.5, 0.35);
    rail(p, -1.5, 0.1, 0.8);
    beam(p, 'kaba_tahta', V(0.1, 0.84, 0.04), V(1.38, 0.1, 0.05), 0.13, 0.035); // düşmüş kalas
  },
  cit_sirik: (p) => {
    ends(p, 1.2);
    for (let k = 0; k < 6; k++) {
      const x = -1.15 + k * 0.46;
      beam(p, 'kutuk', V(x - 0.25, 0.02, 0.03), V(x + 0.25, 1.17, 0.03), 0.045, 0.045, false);
      beam(p, 'kutuk', V(x + 0.25, 0.02, -0.03), V(x - 0.25, 1.17, -0.03), 0.045, 0.045, false);
    }
  },
  cit_orme: (p) => {
    ends(p, 1.0, 1.5);
    for (const x of [-0.75, 0, 0.75]) post(p, x, 1.0, 0, 0.04);
    for (const [z, n] of [[0.055, 1], [-0.055, -1]]) p.quad('hasir', [V(-1.5, 0.05, z), V(1.5, 0.05, z), V(1.5, 0.92, z), V(-1.5, 0.92, z)], [[0, 0], [3, 0], [3, 1], [0, 1]], V(0, 0, n));
    p.quad('hasir', [V(-1.5, 0.92, -0.055), V(1.5, 0.92, -0.055), V(1.5, 0.92, 0.055), V(-1.5, 0.92, 0.055)], [[0, 0], [3, 0], [3, 0.1], [0, 0.1]], V(0, 1, 0));
  },
  cit_tas: (p) => {
    box(p, 'moloz_tas', -1.5, 1.5, 0, 0.72, -0.225, 0.225, ['+x', '-x', '+z', '-z', '+y'], 1.2);
    [[-1.2, 0.3, 0.16], [-0.55, 0.28, 0.1], [0.05, 0.3, 0.18], [0.7, 0.3, 0.12], [1.22, 0.26, 0.17]].forEach(([x, w, h]) => box(p, 'moloz_tas', x - w, x + w, 0.72, 0.72 + h, -0.19, 0.2, ['+x', '-x', '+z', '-z', '+y'], 1.2));
  },
  cit_kapi: (p) => gate(p, 0),
  cit_kapi_acik: (p) => gate(p, (70 * Math.PI) / 180),
  cit_kose: (p) => {
    box(p, 'kutuk', -0.07, 0.07, 0, 1.22, -0.07, 0.07, SIDES, 1);
    box(p, 'kutuk', -0.08, 0.08, 1.22, 1.3, -0.08, 0.08, ALL, 1); // başlık
  },
  cit_dar: (p) => { ends(p, 1.1, 0.5); rail(p, -0.5, 0.5, 0.35); rail(p, -0.5, 0.5, 0.8); },
  // ---- Avlu eşyaları ----
  saman_yigini: (p) => {
    lathe(p, 'saman', 0, 0, [[1.1, 0], [1.08, 0.6], [0.95, 1.2], [0.7, 1.75], [0.36, 2.15], [0, 2.3]], 10, 0.8);
    cyl(p, 'kutuk', V(0, 2.2, 0), V(0, 2.4, 0), 0.04, 5);
  },
  saman_balyasi: (p) => {
    box(p, 'saman', -0.5, 0.5, 0, 0.495, -0.245, 0.245, ALL, 0.8);
    for (const x of [-0.3, 0, 0.3]) box(p, 'kutuk', x - 0.012, x + 0.012, 0, 0.5, -0.25, 0.25, ['+y', '+z', '-z', '+x', '-x'], 1);
  },
  yalak_ahsap: (p) => {
    for (const x of [-0.75, 0.75]) box(p, 'kutuk', x - 0.1, x + 0.1, 0, 0.12, -0.25, 0.25, ['+x', '-x', '+z', '-z'], 1);
    trough(p, 'kutuk', 1.0, 0.25, 0.33, 0.06, 'su', 0.12);
  },
  yalak_tas: (p) => {
    for (const x of [-0.5, 0.5]) box(p, 'moloz_tas', x - 0.18, x + 0.18, 0, 0.1, -0.28, 0.28, ['+x', '-x', '+z', '-z'], 1);
    trough(p, 'moloz_tas', 0.8, 0.3, 0.4, 0.1, 'su', 0.1);
  },
  at_baglama: (p) => {
    for (const x of [-1.05, 1.05]) cyl(p, 'kutuk', V(x, 0, 0), V(x, 1.1, 0), 0.07, 6);
    cyl(p, 'kutuk', V(-1.2, 0.95, 0), V(1.2, 0.95, 0), 0.055, 6);
  },
  kagni: (p) => { // iki tekerlekli kağnı; ok +Z'ye uzanır
    box(p, 'kaba_tahta', -0.55, 0.55, 0.62, 0.7, -1.1, 0.9, ALL, 1);
    for (const s of [-1, 1]) {
      cyl(p, 'kaba_tahta', V(s * 0.66, 0.5, -0.2), V(s * 0.74, 0.5, -0.2), 0.5, 10);
      for (const z of [-1.0, 0.8]) box(p, 'kutuk', s * 0.52 - 0.03, s * 0.52 + 0.03, 0.7, 1.15, z - 0.03, z + 0.03, SIDES, 1);
      beam(p, 'kutuk', V(s * 0.52, 1.1, -1.0), V(s * 0.52, 1.1, 0.8), 0.06, 0.05);
    }
    cyl(p, 'kutuk', V(-0.8, 0.5, -0.2), V(0.8, 0.5, -0.2), 0.06, 6);
    beam(p, 'kutuk', V(0, 0.6, 0.9), V(0, 0.75, 2.05), 0.09, 0.09); // ok
    beam(p, 'kutuk', V(-0.6, 0.78, 2.0), V(0.6, 0.78, 2.0), 0.08, 0.08); // boyunduruk
  },
  el_arabasi: (p) => {
    trough(p, 'kaba_tahta', 0.3, 0.42, 0.28, 0.03, 'kaba_tahta', 0.32);
    cyl(p, 'kaba_tahta', V(-0.03, 0.2, 0.62), V(0.03, 0.2, 0.62), 0.2, 8);
    for (const s of [-1, 1]) {
      beam(p, 'kutuk', V(s * 0.1, 0.2, 0.62), V(s * 0.36, 0.5, -1.0), 0.05, 0.05);
      box(p, 'kutuk', s * 0.27 - 0.025, s * 0.27 + 0.025, 0, 0.34, -0.38, -0.33, SIDES, 1);
    }
  },
  odun_yigini: (p) => {
    box(p, 'odun_kesiti', -0.95, 0.95, 0, 0.84, -0.25, 0.25, ['+z', '-z'], 1);
    box(p, 'kutuk', -0.95, 0.95, 0, 0.84, -0.25, 0.25, ['+x', '-x', '+y'], 1);
    for (const x of [-0.97, 0.97]) box(p, 'kutuk', x - 0.03, x + 0.03, 0, 1.0, -0.03, 0.03, SIDES, 1);
    for (let k = 0; k < 5; k++) cyl(p, 'kutuk', V(-0.7 + k * 0.35, 0.9, -0.245), V(-0.7 + k * 0.35 + 0.04, 0.9, 0.245), 0.08, 5, true, 'odun_kesiti');
  },
  kumes: (p) => {
    for (const [x, z] of [[-0.68, -0.55], [0.68, -0.55], [-0.68, 0.1], [0.68, 0.1]]) box(p, 'kutuk', x - 0.04, x + 0.04, 0, 0.45, z - 0.04, z + 0.04, SIDES, 1);
    box(p, 'kaba_tahta', -0.72, 0.72, 0.45, 1.05, -0.58, 0.14, ALL, 1.2);
    quad(p, 'kaba_tahta', [V(-0.75, 1.05, 0.2), V(0.75, 1.05, 0.2), V(0.75, 1.3, -0.6), V(-0.75, 1.3, -0.6)], V(0, 1, 0.2));
    quad(p, 'kaba_tahta', [V(-0.72, 1.05, -0.58), V(0.72, 1.05, -0.58), V(0.72, 1.29, -0.58), V(-0.72, 1.29, -0.58)], V(0, 0, -1));
    for (const s of [-1, 1]) tri(p, 'kaba_tahta', [V(s * 0.72, 1.05, 0.14), V(s * 0.72, 1.05, -0.58), V(s * 0.72, 1.29, -0.58)], V(s, 0, 0));
    p.quad('karanlik', [V(-0.18, 0.5, 0.145), V(0.18, 0.5, 0.145), V(0.18, 0.86, 0.145), V(-0.18, 0.86, 0.145)], K.FLAT, V(0, 0, 1));
    beam(p, 'kaba_tahta', V(0, 0.47, 0.14), V(0, 0.03, 0.58), 0.03, 0.3); // rampa
  },
  kuyu: (p) => {
    lathe(p, 'moloz_tas', 0, 0, [[0.7, 0], [0.7, 0.8], [0.5, 0.8], [0.5, 0.25, 'karanlik'], [0, 0.25]], 10, 1);
    for (const s of [-1, 1]) box(p, 'kutuk', s * 0.6 - 0.05, s * 0.6 + 0.05, 0.8, 1.95, -0.05, 0.05, SIDES, 1);
    cyl(p, 'kutuk', V(-0.6, 1.45, 0), V(0.6, 1.45, 0), 0.08, 6); // çıkrık
    beam(p, 'demir', V(0.66, 1.45, 0), V(0.66, 1.2, 0.16), 0.025, 0.025);
    for (const s of [1, -1]) quad(p, 'kaba_tahta', [V(-0.85, 1.95, s * 0.6), V(0.85, 1.95, s * 0.6), V(0.85, 2.4, 0), V(-0.85, 2.4, 0)], V(0, 1, s * 0.5));
    for (const s of [-1, 1]) tri(p, 'kaba_tahta', [V(s * 0.7, 1.95, -0.5), V(s * 0.7, 1.95, 0.5), V(s * 0.7, 2.36, 0)], V(s, 0, 0));
  },
  firin: (p) => {
    box(p, 'moloz_tas', -0.9, 0.9, 0, 0.6, -0.8, 0.8, ['+x', '-x', '+z', '-z', '+y'], 1.2);
    lathe(p, 'toprak', 0, -0.05, [[0.78, 0.6], [0.74, 0.95], [0.56, 1.25], [0.3, 1.43], [0, 1.5]], 10, 1);
    p.quad('karanlik', [V(-0.22, 0.62, 0.74), V(0.22, 0.62, 0.74), V(0.22, 0.98, 0.74), V(-0.22, 0.98, 0.74)], K.FLAT, V(0, 0, 1));
    box(p, 'moloz_tas', -0.3, 0.3, 0.98, 1.08, 0.6, 0.78, OUT, 1.2);
    for (const s of [-1, 1]) box(p, 'moloz_tas', s * 0.26 - 0.05, s * 0.26 + 0.05, 0.6, 0.98, 0.6, 0.78, OUT, 1.2);
  },
  merdiven_el: (p) => {
    for (const x of [-0.22, 0.22]) box(p, 'kutuk', x - 0.03, x + 0.03, 0, 3.2, -0.02, 0.02, ALL, 1);
    for (let k = 0; k < 9; k++) box(p, 'kutuk', -0.19, 0.19, 0.3 + k * 0.32, 0.34 + k * 0.32, -0.015, 0.015, ['+z', '-z', '+y', '-y'], 1);
  },
  fici: (p) => {
    lathe(p, 'kaba_tahta', 0, 0, [[0.26, 0], [0.32, 0.22], [0.33, 0.4], [0.32, 0.58], [0.26, 0.8], [0.22, 0.76], [0, 0.76]], 10, 0.6);
    for (const y of [0.12, 0.66]) lathe(p, 'demir', 0, 0, [[y < 0.4 ? 0.3 : 0.305, y], [y < 0.4 ? 0.315 : 0.29, y + 0.04]], 10);
  },
  kufe: (p) => lathe(p, 'hasir', 0, 0, [[0.2, 0], [0.3, 0.55], [0.27, 0.55], [0.18, 0.04], [0, 0.04]], 10, 0.5),
  cuval: (p) => lathe(p, 'cuval_bezi', 0, 0, [[0.2, 0], [0.27, 0.15], [0.26, 0.45], [0.12, 0.62], [0.16, 0.7], [0, 0.66]], 8, 0.5),
};
const kit = K.makeKit('ahir_cit_kiti', PARTS, M);
export const PARCALAR = kit.names, createParca = kit.create, createKit = kit.createKit;
export function createOrnekler() {
  const Q = Math.PI / 2, roof = { type: 'besik', orta: 'ahir_cati', uc: 'ahir_cati_uc' };
  const ahirEv = K.assemble('ornek_ahir', createParca, {
    nx: 3, nz: 1, roof,
    floors: [{ corner: 'ahir_kose', wall: (s, k) => (s === 0 ? ['ahir_duvar_pencere', 'ahir_duvar_acik_kapi', 'ahir_duvar_yarim'][k] : s === 2 ? (k === 1 ? 'ahir_duvar_pencere' : 'ahir_duvar') : 'ahir_duvar') }],
    extras: [['sundurma_cati', 4.5, 2.45, 0, Q], ['saman_balyasi', 6, 0, 0.4, 0.4], ['yalak_ahsap', 6.2, 0, -0.9, Q]],
  });
  const samanlikli = K.assemble('ornek_samanlikli_ahir', createParca, {
    nx: 2, nz: 1, roof,
    floors: [
      { corner: 'ahir_kose', wall: (s, k) => (s === 0 ? (k ? 'ahir_duvar_pencere' : 'ahir_duvar_kapi') : 'ahir_duvar') },
      { h: 2, wall: (s) => (s === 1 ? 'samanlik_duvar_kapak' : 'samanlik_duvar') },
    ],
    extras: [['merdiven_el', 3.35, 0, 0.9, Q], ['saman_yigini', 5.2, 0, -0.5]],
  });
  // Ağıl: 4 × 3 modül çit
  const agil = new THREE.Group();
  agil.name = 'ornek_agil';
  const put = (part, x, z, rot = 0) => {
    const m = createParca(part);
    m.position.set(x, 0, z);
    m.rotation.y = rot;
    agil.add(m);
  };
  ['cit_tahta', 'cit_kapi_acik', 'cit_tahta_kirik', 'cit_tahta'].forEach((n, k) => put(n, -4.5 + 3 * k, 4.5, 0));
  ['cit_sirik', 'cit_sirik', 'cit_tahta'].forEach((n, k) => put(n, 6, 3 - 3 * k, Q));
  ['cit_tas', 'cit_tas', 'cit_orme', 'cit_orme'].forEach((n, k) => put(n, 4.5 - 3 * k, -4.5, 2 * Q));
  ['cit_orme', 'cit_tahta', 'cit_tahta'].forEach((n, k) => put(n, -6, -3 + 3 * k, -Q));
  for (const [x, z] of [[6, 4.5], [6, -4.5], [-6, -4.5], [-6, 4.5]]) put('cit_kose', x, z);
  put('yalak_tas', 2, -3.4);
  put('saman_yigini', -3.2, -1.8);
  put('kumes', 4.6, 3.2, -Q);
  put('at_baglama', -1, 3);
  put('fici', 5.2, -3.6);
  put('kufe', 4.5, -3.7);
  put('cuval', -5.2, -3.7);
  return K.row('ornek_evler', [[ahirEv, 14], [samanlikli, 12], [agil, 13]]);
}
