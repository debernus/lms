import * as THREE from 'three';
import * as K from './kit_ortak.js';
const { V, ALL, OUT, SIDES, PAINT, TAU, box, quad, tri, beam, cyl, lathe } = K;

// Osmanlı sokak ve köy eşyası kiti (19. yy sonu): şehir sokağı ve köy yaşantısı için dolgu parçaları.
// Her parça: birim metre, Y yukarı, orijin tabanın ortasında (yer Y 0), ön yüz +Z. Düşük poligon,
// gömülü 256×256 dokular, mat malzemeler. Yazı, insan, hayvan yok.
const arnavut = (g, w, h, rand) => {
  g.fillStyle = '#3a3630';
  g.fillRect(0, 0, w, h);
  for (let r = 0; r < 8; r++) for (let k = 0; k < 8; k++) {
    const v = 110 + rand() * 60;
    g.fillStyle = `rgb(${v},${v - 4},${v - 12})`;
    g.beginPath();
    g.roundRect(k * 32 + 2 + rand() * 2, r * 32 + 2 + rand() * 2, 27, 27, 7);
    g.fill();
  }
};
const mermer = (g, w, h, rand) => {
  g.fillStyle = '#cfccc2';
  g.fillRect(0, 0, w, h);
  g.filter = 'blur(2px)';
  for (let i = 0; i < 22; i++) {
    g.strokeStyle = `rgba(110,110,112,${0.1 + rand() * 0.18})`;
    g.lineWidth = 1 + rand() * 3;
    g.beginPath();
    let x = rand() * w, y = rand() * h;
    g.moveTo(x, y);
    for (let k = 0; k < 5; k++) g.lineTo((x += 20 + rand() * 40), (y += (rand() - 0.5) * 50));
    g.stroke();
  }
  g.filter = 'none';
  for (let i = 0; i < 14; i++) {
    g.fillStyle = `rgba(80,74,58,${0.05 + rand() * 0.1})`;
    g.fillRect(rand() * w, rand() * h, 8 + rand() * 30, 30 + rand() * 90);
  }
};
const kilim = (g, w, h, rand) => {
  const colors = ['#7a1e1e', '#1e2e5a', '#c2aa72', '#2a4a2e', '#8a4a1e'];
  for (let r = 0; r < 8; r++) {
    g.fillStyle = colors[r % colors.length];
    g.fillRect(0, r * 32, w, 32);
    g.fillStyle = colors[(r + 2) % colors.length];
    for (let k = 0; k < 8; k++) {
      g.beginPath();
      g.moveTo(k * 32 + 16, r * 32 + 4);
      g.lineTo(k * 32 + 28, r * 32 + 16);
      g.lineTo(k * 32 + 16, r * 32 + 28);
      g.lineTo(k * 32 + 4, r * 32 + 16);
      g.fill();
    }
  }
  for (let i = 0; i < 500; i++) {
    g.fillStyle = `rgba(30,20,12,${rand() * 0.2})`;
    g.fillRect(rand() * w, rand() * h, 6, 1);
  }
};
const tente = (g, w, h, rand) => {
  for (let k = 0; k < 8; k++) {
    g.fillStyle = k % 2 ? '#b9ad8e' : '#7a2a22';
    g.fillRect(k * 32, 0, 32, h);
  }
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(40,30,20,${0.05 + rand() * 0.12})`;
    g.fillRect(rand() * w, rand() * h, 20 + rand() * 60, 10 + rand() * 40);
  }
};
const yaprak = (g, w, h, rand, base, colors) => {
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1100; i++) {
    g.fillStyle = colors[Math.floor(rand() * colors.length)];
    g.beginPath();
    g.ellipse(rand() * w, rand() * h, 3 + rand() * 6, 2 + rand() * 3, rand() * 3, 0, TAU);
    g.fill();
  }
};
const M = K.materials('sokak', {
  tahta: [PAINT.tahta_yatay], kaba_tahta: [PAINT.tahta, 256, 256, [118, 108, 94]], kereste: [PAINT.kereste], kutuk: [PAINT.kereste, 256, 256, [82, 66, 50]],
  moloz_tas: [PAINT.tas], mermer: [mermer], kaldirim: [arnavut], toprak_yol: [PAINT.toprak], toprak_siva: [PAINT.toprak, 256, 256, '#a88a5e'],
  hasir: [PAINT.orgu], kilim: [kilim], tente_bezi: [tente],
  yaprak: [yaprak, 256, 256, '#2e4a22', ['#3e6a2a', '#56803a', '#263e1c', '#6a8a44']], selvi_yapragi: [yaprak, 256, 256, '#16281a', ['#1e3a24', '#2a4a2c', '#101e14']],
  tezek: [PAINT.toprak, 256, 256, '#4a3c28'], bez: 0xd6d0c0, toprak_canak: 0x9a5a3a, bakir: 0x8a4a2a, pirinc: 0x9a7a3a, demir: 0x26221e, karanlik: 0x14110e,
  su: 0x2a3a40, fener_cami: 0xcdb46a, porselen: 0xd8d6cc, karpuz: 0x2e5a2a, kirmizi: 0xa02a1e, sari: 0xc9a23a, simit: 0x9a6228, kor: 0x7a2a12, kul: 0x6a6660,
});
// Yardımcılar
const ball = (p, mat, x, y, z, r, n = 6, sy = 1) => lathe(p, mat, x, z, [[0, y - r * sy], [r * 0.75, y - r * 0.66 * sy], [r, y], [r * 0.75, y + r * 0.66 * sy], [0, y + r * sy]], n, 0.5);
const openBox = (p, mat, x0, x1, z0, z1, y0, h, w, fill) => { // içi oyuk tekne ya da kasa
  const t = y0 + h, yb = y0 + h * 0.3, a = x0 + w, b = x1 - w, c = z0 + w, d = z1 - w;
  box(p, mat, x0, x1, y0, t, z0, z1, ['+x', '-x', '+z', '-z', '-y'], 1);
  for (const [u0, u1, v0, v1] of [[x0, x1, z0, c], [x0, x1, d, z1], [x0, a, c, d], [b, x1, c, d]]) quad(p, mat, [V(u0, t, v0), V(u1, t, v0), V(u1, t, v1), V(u0, t, v1)], V(0, 1, 0), 1);
  quad(p, mat, [V(a, yb, c), V(b, yb, c), V(b, t, c), V(a, t, c)], V(0, 0, 1), 1);
  quad(p, mat, [V(a, yb, d), V(b, yb, d), V(b, t, d), V(a, t, d)], V(0, 0, -1), 1);
  quad(p, mat, [V(a, yb, c), V(a, yb, d), V(a, t, d), V(a, t, c)], V(1, 0, 0), 1);
  quad(p, mat, [V(b, yb, c), V(b, yb, d), V(b, t, d), V(b, t, c)], V(-1, 0, 0), 1);
  quad(p, fill, [V(a, y0 + h * 0.82, c), V(b, y0 + h * 0.82, c), V(b, y0 + h * 0.82, d), V(a, y0 + h * 0.82, d)], V(0, 1, 0), 1);
};
const ICO = new THREE.IcosahedronGeometry(1, 0).attributes.position;
const rock = (p, mat, x, z, r, seed, sy = 0.7) => {
  const rand = K.rng(seed), jit = new Map(), sx = 0.8 + rand() * 0.5, sz = 0.8 + rand() * 0.5;
  const P = (i) => {
    const key = `${ICO.getX(i).toFixed(2)},${ICO.getY(i).toFixed(2)},${ICO.getZ(i).toFixed(2)}`;
    if (!jit.has(key)) jit.set(key, 0.75 + rand() * 0.5);
    const k = jit.get(key) * r;
    return V(x + ICO.getX(i) * sx * k, Math.max(0, r * sy * 0.6 + ICO.getY(i) * sy * k), z + ICO.getZ(i) * sz * k);
  };
  for (let i = 0; i < ICO.count; i += 3) {
    const t = [P(i), P(i + 1), P(i + 2)];
    p.tri(mat, t, t.map((q) => [q.x + q.z, q.y * 1.5]), t[0].clone().add(t[1]).add(t[2]).multiplyScalar(1 / 3).sub(V(x, r * sy * 0.5, z)));
  }
};
const crate = (p, x, y, z, hx = 0.3, h = 0.42, hz = 0.22) => {
  box(p, 'kaba_tahta', x - hx, x + hx, y, y + h, z - hz, z + hz, ALL, 0.8);
  for (const yy of [0.06, h - 0.12]) box(p, 'kereste', x - hx - 0.012, x + hx + 0.012, y + yy, y + yy + 0.06, z - hz - 0.012, z + hz + 0.012, SIDES, 1);
};
const legs = (p, mat, pts, top, t = 0.035) => pts.forEach(([x, z]) => box(p, mat, x - t, x + t, 0, top, z - t, z + t, SIDES, 1));
const pot = (p, x, z, s = 1, n = 8) => lathe(p, 'toprak_canak', x, z, [[0.1 * s, 0], [0.14 * s, 0.22 * s], [0.12 * s, 0.22 * s, 'toprak_yol'], [0, 0.2 * s]], n);
const PARTS = {
  // ================= ŞEHİR SOKAĞI =================
  sokak_feneri: (p) => {
    lathe(p, 'demir', 0, 0, [[0.14, 0], [0.14, 0.08], [0.07, 0.3], [0.05, 0.5], [0.045, 2.55], [0.09, 2.6]], 6);
    lathe(p, 'fener_cami', 0, 0, [[0.1, 2.6], [0.17, 3.0, 'demir'], [0.21, 3.02, 'demir'], [0, 3.25]], 4);
  },
  duvar_feneri: (p) => { // orijin duvardaki bağlantı noktası; +Z'ye uzanır
    beam(p, 'demir', V(0, 0, 0), V(0, 0.1, 0.42), 0.03, 0.03);
    beam(p, 'demir', V(0, -0.32, 0), V(0, 0.06, 0.36), 0.025, 0.025);
    lathe(p, 'fener_cami', 0, 0.42, [[0.07, -0.3], [0.11, -0.02, 'demir'], [0.14, 0, 'demir'], [0, 0.14]], 4);
    lathe(p, 'demir', 0, 0.42, [[0, -0.33], [0.07, -0.3]], 4);
  },
  duvar_cesmesi: (p) => { // mermer ayna taşı, sivri kemerli niş, tekne
    box(p, 'mermer', -0.7, 0.7, 0, 2.2, 0, 0.28, ALL, 1.2);
    box(p, 'mermer', -0.78, 0.78, 2.2, 2.32, 0, 0.34, ALL, 1.2);
    const a = [[-0.35, 0.75], [0.35, 0.75], [0.35, 1.45], [0, 1.85], [-0.35, 1.45]].map(([x, y]) => V(x, y, 0.285));
    for (let i = 1; i < 4; i++) p.tri('karanlik', [a[0], a[i], a[i + 1]], [[0, 0], [1, 0], [1, 1]], V(0, 0, 1));
    cyl(p, 'pirinc', V(0, 0.95, 0.28), V(0, 0.9, 0.42), 0.02, 5);
    openBox(p, 'mermer', -0.6, 0.6, 0.28, 0.78, 0, 0.45, 0.07, 'su');
  },
  koy_cesmesi: (p) => {
    box(p, 'moloz_tas', -0.8, 0.8, 0, 1.45, 0, 0.4, ALL, 1.2);
    box(p, 'mermer', -0.88, 0.88, 1.45, 1.55, -0.04, 0.44, ALL, 1.2);
    cyl(p, 'kutuk', V(0, 0.85, 0.4), V(0, 0.8, 0.6), 0.035, 5);
    openBox(p, 'moloz_tas', -1.2, 1.2, 0.4, 0.95, 0, 0.45, 0.09, 'su');
  },
  tulumba: (p) => {
    box(p, 'moloz_tas', -0.4, 0.4, 0, 0.12, -0.4, 0.4, ['+x', '-x', '+z', '-z', '+y'], 1);
    lathe(p, 'demir', 0, 0, [[0.09, 0.12], [0.07, 0.3], [0.07, 1.0], [0.1, 1.05], [0.08, 1.15], [0, 1.2]], 6);
    beam(p, 'demir', V(0, 0.88, 0.05), V(0, 0.8, 0.34), 0.06, 0.06);
    beam(p, 'demir', V(0, 1.1, 0.03), V(0, 1.38, -0.5), 0.035, 0.035);
  },
  dukkan_tentesi: (p) => { // duvara yaslanır (Z 0); 3 m geniş, 1,6 m derin
    const c = [V(-1.5, 2.6, 0), V(1.5, 2.6, 0), V(1.5, 2.1, 1.6), V(-1.5, 2.1, 1.6)];
    quad(p, 'tente_bezi', c, V(0, 1, 0.3), 0.75);
    quad(p, 'tente_bezi', c.map((q) => q.clone().setY(q.y - 0.01)), V(0, -1, 0), 0.75);
    for (const n of [1, -1]) quad(p, 'tente_bezi', [V(-1.5, 1.9, 1.6), V(1.5, 1.9, 1.6), V(1.5, 2.1, 1.6), V(-1.5, 2.1, 1.6)], V(0, 0, n), 0.75);
    for (const x of [-1.45, 1.45]) cyl(p, 'kereste', V(x, 0, 1.55), V(x, 2.1, 1.55), 0.03, 5, false);
    beam(p, 'kereste', V(-1.5, 2.08, 1.57), V(1.5, 2.08, 1.57), 0.04, 0.04);
  },
  seyyar_tezgah: (p) => {
    box(p, 'tahta', -0.9, 0.9, 0.8, 0.85, -0.4, 0.4, ALL, 1);
    legs(p, 'kereste', [[-0.82, -0.33], [0.82, -0.33], [-0.82, 0.33], [0.82, 0.33]], 0.8);
    box(p, 'tahta', -0.82, 0.82, 0.3, 0.33, -0.33, 0.33, ['+y', '-y', '+z', '-z'], 1);
    ['kirmizi', 'sari', 'yaprak'].forEach((m, i) => openBox(p, 'kaba_tahta', -0.82 + i * 0.57, -0.32 + i * 0.57, -0.3, 0.3, 0.85, 0.16, 0.02, m));
  },
  simitci_tablasi: (p) => {
    for (const [x, z] of [[-0.26, 0.18], [0.26, 0.18], [0, -0.3]]) beam(p, 'kereste', V(x, 0, z), V(-x * 0.3, 0.9, -z * 0.3), 0.03, 0.03, false);
    cyl(p, 'tahta', V(0, 0.9, 0), V(0, 0.94, 0), 0.4, 10);
    lathe(p, 'simit', 0, 0, [[0.3, 0.94], [0.3, 1.0], [0.2, 1.12], [0, 1.16]], 8);
  },
  kahve_masasi: (p) => {
    cyl(p, 'tahta', V(0, 0.46, 0), V(0, 0.5, 0), 0.35, 10);
    for (let k = 0; k < 3; k++) beam(p, 'kereste', V(Math.cos(k * 2.094) * 0.28, 0, Math.sin(k * 2.094) * 0.28), V(Math.cos(k * 2.094) * 0.18, 0.46, Math.sin(k * 2.094) * 0.18), 0.035, 0.035, false);
  },
  hasir_tabure: (p) => lathe(p, 'hasir', 0, 0, [[0.2, 0], [0.17, 0.2], [0.2, 0.42], [0, 0.42]], 8),
  nargile: (p) => {
    lathe(p, 'fener_cami', 0, 0, [[0.1, 0], [0.13, 0.08], [0.11, 0.22], [0.04, 0.32, 'pirinc'], [0.03, 0.7, 'pirinc'], [0.07, 0.74, 'toprak_canak'], [0.06, 0.8, 'kor'], [0, 0.8]], 8);
    beam(p, 'kilim', V(0, 0.4, 0.03), V(0.2, 0.1, 0.25), 0.02, 0.02, false);
    beam(p, 'kilim', V(0.2, 0.1, 0.25), V(0.45, 0.02, 0.1), 0.02, 0.02);
  },
  mangal: (p) => lathe(p, 'bakir', 0, 0, [[0.2, 0], [0.12, 0.06], [0.1, 0.3], [0.34, 0.42], [0.36, 0.46], [0.3, 0.46, 'kor'], [0, 0.44]], 10),
  binek_tasi: (p) => {
    box(p, 'mermer', -0.4, 0.4, 0, 0.25, -0.3, 0.3, ['+x', '-x', '+z', '-z', '+y'], 1);
    box(p, 'mermer', -0.4, 0, 0.25, 0.5, -0.3, 0.3, ['+x', '-x', '+z', '-z', '+y'], 1);
  },
  tas_baba: (p) => lathe(p, 'mermer', 0, 0, [[0.16, 0], [0.14, 0.55], [0.17, 0.6], [0.15, 0.72], [0, 0.8]], 8),
  arnavut_kaldirimi: (p) => box(p, 'kaldirim', -1.5, 1.5, -0.1, 0, -1.5, 1.5, ALL, 1.5),
  toprak_yol: (p) => box(p, 'toprak_yol', -1.5, 1.5, -0.1, 0, -1.5, 1.5, ALL, 1.5),
  kaldirim_kenari: (p) => box(p, 'mermer', -1.5, 1.5, 0, 0.18, -0.15, 0.15, ALL, 1.2),
  sokak_merdiveni: (p) => { // 3 m geniş; -Z'ye doğru yükselir
    for (let k = 0; k < 5; k++) box(p, 'kaldirim', -1.5, 1.5, 0, 0.18 * (5 - k), -(5 - k) * 0.35, -(4 - k) * 0.35, ['+x', '-x', '+z', '+y'], 1.5);
  },
  sandik: (p) => crate(p, 0, 0, 0),
  sandik_yigini: (p) => { crate(p, -0.33, 0, 0); crate(p, 0.33, 0, 0.04); crate(p, 0.05, 0.42, 0.02, 0.28, 0.36, 0.2); },
  meyve_kasasi: (p) => openBox(p, 'kaba_tahta', -0.3, 0.3, -0.2, 0.2, 0, 0.25, 0.025, 'kirmizi'),
  meyve_sepeti: (p) => lathe(p, 'hasir', 0, 0, [[0.15, 0], [0.26, 0.22], [0.24, 0.22, 'sari'], [0.12, 0.3, 'sari'], [0, 0.32]], 8, 0.5),
  karpuz_yigini: (p) => [[-0.17, 0.16, 0], [0.17, 0.16, 0.03], [0, 0.16, 0.3], [0.02, 0.42, 0.1], [0.34, 0.16, 0.33]].forEach(([x, y, z]) => ball(p, 'karpuz', x, y, z, 0.16)),
  testi: (p) => {
    lathe(p, 'toprak_canak', 0, 0, [[0.07, 0], [0.14, 0.12], [0.15, 0.25], [0.06, 0.4], [0.05, 0.48], [0.07, 0.5], [0, 0.5]], 8);
    beam(p, 'toprak_canak', V(0.05, 0.46, 0), V(0.16, 0.38, 0), 0.025, 0.025, false);
    beam(p, 'toprak_canak', V(0.16, 0.38, 0), V(0.14, 0.26, 0), 0.025, 0.025, false);
  },
  kup: (p) => lathe(p, 'toprak_canak', 0, 0, [[0.14, 0], [0.3, 0.3], [0.32, 0.55], [0.2, 0.82], [0.22, 0.9], [0.17, 0.9, 'karanlik'], [0, 0.85]], 10),
  gugum: (p) => {
    lathe(p, 'bakir', 0, 0, [[0.12, 0], [0.16, 0.1], [0.15, 0.25], [0.07, 0.36], [0.08, 0.46], [0.1, 0.48], [0, 0.5]], 8);
    beam(p, 'bakir', V(0.13, 0.25, 0), V(0.27, 0.42, 0), 0.03, 0.03);
    beam(p, 'bakir', V(-0.08, 0.45, 0), V(-0.2, 0.36, 0), 0.02, 0.02, false);
    beam(p, 'bakir', V(-0.2, 0.36, 0), V(-0.15, 0.2, 0), 0.02, 0.02, false);
  },
  kova: (p) => {
    lathe(p, 'kaba_tahta', 0, 0, [[0.13, 0], [0.16, 0.3], [0.14, 0.3, 'su'], [0, 0.26]], 8, 0.5);
    for (const [a, b] of [[V(-0.16, 0.3, 0), V(-0.1, 0.46, 0)], [V(-0.1, 0.46, 0), V(0.1, 0.46, 0)], [V(0.1, 0.46, 0), V(0.16, 0.3, 0)]]) beam(p, 'demir', a, b, 0.012, 0.012, false);
  },
  kazan: (p) => { // sacayağında bakır kazan, altında odun ve kor
    for (let k = 0; k < 3; k++) beam(p, 'demir', V(Math.cos(k * 2.094) * 0.36, 0, Math.sin(k * 2.094) * 0.36), V(Math.cos(k * 2.094) * 0.24, 0.42, Math.sin(k * 2.094) * 0.24), 0.03, 0.03, false);
    lathe(p, 'bakir', 0, 0, [[0, 0.36], [0.2, 0.38], [0.3, 0.5], [0.3, 0.72], [0.27, 0.72, 'karanlik'], [0, 0.64]], 10);
    cyl(p, 'kutuk', V(-0.3, 0.05, -0.1), V(0.3, 0.05, 0.12), 0.05, 5);
    cyl(p, 'kutuk', V(-0.2, 0.05, 0.25), V(0.25, 0.06, -0.2), 0.045, 5);
    quad(p, 'kor', [V(-0.15, 0.02, -0.15), V(0.15, 0.02, -0.15), V(0.15, 0.02, 0.15), V(-0.15, 0.02, 0.15)], V(0, 1, 0));
  },
  hali_askisi: (p) => {
    for (const x of [-0.95, 0.95]) cyl(p, 'kereste', V(x, 0, 0), V(x, 1.55, 0), 0.04, 5);
    cyl(p, 'kereste', V(-1.05, 1.5, 0), V(1.05, 1.5, 0), 0.03, 5);
    quad(p, 'kilim', [V(-0.8, 0.45, 0.04), V(0.8, 0.45, 0.04), V(0.8, 1.53, 0.04), V(-0.8, 1.53, 0.04)], V(0, 0, 1), 0.8);
    quad(p, 'kilim', [V(-0.8, 0.85, -0.04), V(0.8, 0.85, -0.04), V(0.8, 1.53, -0.04), V(-0.8, 1.53, -0.04)], V(0, 0, -1), 0.8);
    quad(p, 'kilim', [V(-0.8, 1.53, -0.04), V(0.8, 1.53, -0.04), V(0.8, 1.53, 0.04), V(-0.8, 1.53, 0.04)], V(0, 1, 0), 0.8);
    quad(p, 'bez', [V(-0.8, 0.45, 0.035), V(0.8, 0.45, 0.035), V(0.8, 1.53, 0.035), V(-0.8, 1.53, 0.035)], V(0, 0, -1));
    quad(p, 'bez', [V(-0.8, 0.85, -0.035), V(0.8, 0.85, -0.035), V(0.8, 1.53, -0.035), V(-0.8, 1.53, -0.035)], V(0, 0, 1));
  },
  camasir_ipi: (p) => { // 4 m açıklık
    for (const x of [-2, 2]) beam(p, 'kereste', V(x, 0, 0), V(x, 2.1, 0), 0.07, 0.07);
    beam(p, 'bez', V(-2, 2.0, 0), V(2, 2.0, 0), 0.012, 0.012, false);
    [[-1.5, 0.7, 0.9, 'bez'], [-0.6, 0.5, 1.2, 'bez'], [0.15, 0.9, 0.7, 'kilim'], [1.2, 0.6, 1.0, 'bez']].forEach(([x, w, h, m]) => {
      for (const n of [1, -1]) quad(p, m, [V(x, 2 - h, 0.008 * n), V(x + w, 2 - h, 0.008 * n), V(x + w, 2, 0.008 * n), V(x, 2, 0.008 * n)], V(0, 0, n), 0.8);
    });
  },
  saksi: (p) => {
    pot(p, 0, 0);
    ball(p, 'yaprak', 0, 0.38, 0, 0.17);
    for (const [x, y, z] of [[0.1, 0.5, 0.06], [-0.09, 0.47, 0.1], [0.02, 0.55, -0.08]]) ball(p, 'kirmizi', x, y, z, 0.04, 4);
  },
  saksi_rafi: (p) => { // duvar dibine konan basamaklı saksılık
    box(p, 'tahta', -0.7, 0.7, 0.45, 0.49, -0.14, 0.14, ALL, 1);
    legs(p, 'kereste', [[-0.62, -0.1], [0.62, -0.1], [-0.62, 0.1], [0.62, 0.1]], 0.45, 0.025);
    for (const x of [-0.45, 0, 0.45]) {
      const q = new K.Part('q');
      pot(q, x, 0, 0.8, 6);
      ball(q, 'yaprak', x, 0.3, 0, 0.13, 5);
      for (const [mat, g] of q.groups) for (let i = 0; i < g.pos.length; i += 9) p.tri(mat, [0, 3, 6].map((k) => V(g.pos[i + k], g.pos[i + k + 1] + 0.49, g.pos[i + k + 2])), [0, 2, 4].map((k) => [g.uv[(i / 3) * 2 + k], g.uv[(i / 3) * 2 + k + 1]]), V(0, 0, 0));
    }
  },
  asma_cardagi: (p) => { // 3 m geniş, 2,4 m derin; duvara yaslanabilir (Z 0)
    legs(p, 'kereste', [[-1.4, 0.1], [1.4, 0.1], [-1.4, 2.3], [1.4, 2.3]], 2.3, 0.045);
    for (const x of [-1.4, 1.4]) beam(p, 'kereste', V(x, 2.34, 0), V(x, 2.34, 2.4), 0.09, 0.07);
    for (let k = 0; k < 4; k++) beam(p, 'kereste', V(-1.5, 2.41, 0.2 + k * 0.67), V(1.5, 2.41, 0.2 + k * 0.67), 0.05, 0.05);
    box(p, 'yaprak', -1.5, 1.5, 2.44, 2.56, 0, 2.4, ALL, 1);
    for (const [x, z] of [[-1.4, 2.3], [1.4, 0.1]]) cyl(p, 'kutuk', V(x + 0.07, 0, z), V(x + 0.05, 2.44, z + 0.03), 0.025, 4, false); // asma gövdesi
  },
  ahsap_sira: (p) => {
    box(p, 'tahta', -0.8, 0.8, 0.4, 0.45, -0.18, 0.18, ALL, 1);
    for (const x of [-0.68, 0.68]) {
      box(p, 'kereste', x - 0.03, x + 0.03, 0, 0.4, -0.16, 0.16, SIDES, 1);
      box(p, 'kereste', x - 0.03, x + 0.03, 0.45, 0.85, -0.2, -0.15, SIDES, 1);
    }
    box(p, 'tahta', -0.8, 0.8, 0.62, 0.82, -0.21, -0.18, ALL, 1);
  },
  tas_sedir: (p) => {
    for (const x of [-0.6, 0.6]) box(p, 'moloz_tas', x - 0.15, x + 0.15, 0, 0.38, -0.2, 0.2, SIDES, 1);
    box(p, 'mermer', -0.9, 0.9, 0.38, 0.48, -0.25, 0.25, ALL, 1.2);
  },
  yuk_arabasi: (p) => { // dört tekerlekli yük arabası; ok +Z'ye uzanır
    box(p, 'kaba_tahta', -0.6, 0.6, 0.75, 0.83, -1.3, 1.3, ALL, 1.2);
    for (const s of [-1, 1]) {
      beam(p, 'kaba_tahta', V(s * 0.6, 1.02, -1.3), V(s * 0.6, 1.02, 1.3), 0.3, 0.035);
      cyl(p, 'kaba_tahta', V(s * 0.68, 0.45, -0.85), V(s * 0.75, 0.45, -0.85), 0.45, 10);
      cyl(p, 'kaba_tahta', V(s * 0.68, 0.36, 0.9), V(s * 0.75, 0.36, 0.9), 0.36, 10);
    }
    cyl(p, 'kutuk', V(-0.8, 0.45, -0.85), V(0.8, 0.45, -0.85), 0.05, 5, false);
    cyl(p, 'kutuk', V(-0.8, 0.36, 0.9), V(0.8, 0.36, 0.9), 0.05, 5, false);
    beam(p, 'kutuk', V(0, 0.45, 1.3), V(0, 0.6, 2.9), 0.07, 0.07);
  },
  telgraf_diregi: (p) => {
    lathe(p, 'kutuk', 0, 0, [[0.12, 0], [0.08, 6.5], [0, 6.56]], 6);
    beam(p, 'kutuk', V(-0.65, 6.0, 0.09), V(0.65, 6.0, 0.09), 0.09, 0.07);
    for (const x of [-0.58, -0.25, 0.25, 0.58]) cyl(p, 'porselen', V(x, 6.04, 0.09), V(x, 6.18, 0.09), 0.035, 5);
  },
  // ================= ZANAAT VE EV İŞLERİ =================
  nalbant_orsu: (p) => {
    cyl(p, 'kutuk', V(0, 0, 0), V(0, 0.5, 0), 0.25, 8);
    box(p, 'demir', -0.16, 0.16, 0.5, 0.58, -0.07, 0.07, ALL, 1);
    box(p, 'demir', -0.08, 0.08, 0.58, 0.68, -0.05, 0.05, SIDES, 1);
    box(p, 'demir', -0.2, 0.2, 0.68, 0.76, -0.08, 0.08, ALL, 1);
    box(p, 'demir', 0.2, 0.36, 0.71, 0.76, -0.035, 0.035, ALL, 1);
  },
  bileyi_carki: (p) => {
    for (const z of [-0.2, 0.2]) for (const s of [-1, 1]) beam(p, 'kereste', V(s * 0.4, 0, z), V(s * 0.06, 0.75, z), 0.05, 0.05, false);
    cyl(p, 'moloz_tas', V(0, 0.72, -0.045), V(0, 0.72, 0.045), 0.3, 10);
    cyl(p, 'demir', V(0, 0.72, -0.26), V(0, 0.72, 0.36), 0.02, 4, false);
    beam(p, 'demir', V(0, 0.72, 0.36), V(0.02, 0.9, 0.36), 0.02, 0.02);
    box(p, 'kaba_tahta', -0.36, 0.36, 0.3, 0.4, -0.16, 0.16, ['+x', '-x', '+z', '-z', '-y'], 1);
  },
  dibek: (p) => {
    lathe(p, 'moloz_tas', 0, 0, [[0.25, 0], [0.3, 0.4], [0.22, 0.4, 'karanlik'], [0.12, 0.15, 'karanlik'], [0, 0.15]], 8);
    cyl(p, 'kutuk', V(0.02, 0.2, 0), V(0.3, 1.05, 0.1), 0.045, 5);
  },
  el_degirmeni: (p) => {
    cyl(p, 'moloz_tas', V(0, 0, 0), V(0, 0.12, 0), 0.3, 10);
    cyl(p, 'moloz_tas', V(0, 0.13, 0), V(0, 0.25, 0), 0.28, 10);
    cyl(p, 'kutuk', V(0.2, 0.25, 0), V(0.2, 0.42, 0), 0.02, 4);
  },
  yayik: (p) => {
    lathe(p, 'kaba_tahta', 0, 0, [[0.16, 0], [0.14, 0.7], [0.1, 0.75], [0, 0.75]], 8, 0.6);
    for (const y of [0.15, 0.5]) lathe(p, 'demir', 0, 0, [[0.158 - y * 0.03, y], [0.158 - y * 0.03, y + 0.04]], 8);
    cyl(p, 'kereste', V(0, 0.75, 0), V(0, 1.25, 0), 0.018, 4);
  },
  tandir: (p) => lathe(p, 'toprak_siva', 0, 0, [[0.6, 0], [0.5, 0.35], [0.3, 0.5], [0.22, 0.5, 'karanlik'], [0.2, 0.2, 'kor'], [0, 0.2]], 10),
  ocak_tasi: (p) => {
    for (let k = 0; k < 6; k++) rock(p, 'moloz_tas', Math.cos(k * 1.047) * 0.4, Math.sin(k * 1.047) * 0.4, 0.14 + (k % 2) * 0.03, 30 + k);
    quad(p, 'kul', [V(-0.3, 0.02, -0.3), V(0.3, 0.02, -0.3), V(0.3, 0.02, 0.3), V(-0.3, 0.02, 0.3)], V(0, 1, 0));
    cyl(p, 'kutuk', V(-0.25, 0.07, -0.08), V(0.25, 0.07, 0.1), 0.045, 5);
    cyl(p, 'kutuk', V(-0.18, 0.08, 0.2), V(0.2, 0.1, -0.18), 0.04, 5);
  },
  tezek_yigini: (p) => lathe(p, 'tezek', 0, 0, [[0.6, 0], [0.56, 0.25], [0.42, 0.5], [0.22, 0.75], [0, 0.85]], 8),
  ari_kovani: (p) => { // örme sepet kovan, taş altlıkta
    box(p, 'moloz_tas', -0.3, 0.3, 0, 0.08, -0.3, 0.3, ['+x', '-x', '+z', '-z', '+y'], 1);
    lathe(p, 'hasir', 0, 0, [[0.22, 0.08], [0.24, 0.3], [0.16, 0.5], [0, 0.58]], 8, 0.5);
    quad(p, 'karanlik', [V(-0.04, 0.09, 0.232), V(0.04, 0.09, 0.232), V(0.04, 0.14, 0.236), V(-0.04, 0.14, 0.236)], V(0, 0, 1));
  },
  kutuk_kovan: (p) => { // sehpa üstünde yatık kütük kovan
    for (const x of [-0.35, 0.35]) for (const s of [-1, 1]) beam(p, 'kereste', V(x, 0, s * 0.28), V(x, 0.5, -s * 0.06), 0.04, 0.04, false);
    cyl(p, 'kutuk', V(-0.5, 0.62, 0), V(0.5, 0.62, 0), 0.2, 8);
  },
  // ================= KÖY VE TARLA =================
  kurutma_sirigi: (p) => { // biber ve mısır dizileri asılı sırık
    for (const x of [-1.2, 1.2]) cyl(p, 'kutuk', V(x, 0, 0), V(x, 1.85, 0), 0.045, 5);
    cyl(p, 'kutuk', V(-1.35, 1.78, 0), V(1.35, 1.78, 0), 0.03, 5);
    for (let k = 0; k < 6; k++) lathe(p, k % 2 ? 'sari' : 'kirmizi', -0.9 + k * 0.36, 0, [[0, 1.76], [0.06, 1.6], [0.07, 1.2], [0, 1.02]], 5);
  },
  doven: (p) => {
    box(p, 'kaba_tahta', -0.3, 0.3, 0.04, 0.1, -0.9, 0.7, ALL, 1);
    beam(p, 'kaba_tahta', V(0, 0.07, 0.7), V(0, 0.32, 1.1), 0.06, 0.6);
    quad(p, 'moloz_tas', [V(-0.28, 0.035, -0.85), V(0.28, 0.035, -0.85), V(0.28, 0.035, 0.65), V(-0.28, 0.035, 0.65)], V(0, -1, 0), 0.4);
    for (const x of [-0.2, 0.2]) box(p, 'kereste', x - 0.03, x + 0.03, 0.1, 0.14, -0.8, 0.6, ['+x', '-x', '+y', '+z', '-z'], 1);
  },
  karasaban: (p) => {
    beam(p, 'kutuk', V(0, 0.3, -0.25), V(0, 0.72, 2.2), 0.08, 0.07);
    beam(p, 'kutuk', V(0, 0.06, -0.55), V(0, 0.09, 0.35), 0.09, 0.08);
    beam(p, 'kutuk', V(0, 0.08, -0.45), V(0, 1.0, -0.85), 0.06, 0.05);
    beam(p, 'kutuk', V(0, 0.1, -0.1), V(0, 0.42, 0.25), 0.05, 0.05, false);
    beam(p, 'demir', V(0, 0.07, 0.3), V(0, 0.02, 0.62), 0.05, 0.1);
  },
  tarim_aletleri: (p) => { // duvara yaslı yaba, tırmık ve kürek (üstleri -Z'ye yatık)
    const shaft = (x) => beam(p, 'kutuk', V(x, 0.02, 0.3), V(x, 1.5, 0.02), 0.035, 0.035, false);
    [-0.35, 0, 0.35].forEach(shaft);
    for (const dx of [-0.09, 0, 0.09]) beam(p, 'kutuk', V(-0.35, 1.5, 0.02), V(-0.35 + dx * 1.6, 1.95, -0.06), 0.025, 0.025, false);
    beam(p, 'kutuk', V(-0.22, 1.5, 0.02), V(0.22, 1.5, 0.02), 0.04, 0.04);
    for (let k = 0; k < 5; k++) box(p, 'kutuk', -0.19 + k * 0.095 - 0.01, -0.19 + k * 0.095 + 0.01, 1.5, 1.6, 0.03, 0.05, ['+x', '-x', '+z', '+y'], 1);
    beam(p, 'demir', V(0.35, 1.5, 0.02), V(0.35, 1.85, -0.045), 0.012, 0.2);
  },
  ahsap_kopru: (p) => { // 3 m uzun (X), 1,6 m geniş
    box(p, 'tahta', -1.5, 1.5, 0.2, 0.28, -0.8, 0.8, ALL, 1);
    for (const z of [-0.6, 0.6]) beam(p, 'kutuk', V(-1.5, 0.12, z), V(1.5, 0.12, z), 0.16, 0.14);
    for (const z of [-0.76, 0.76]) {
      for (const x of [-1.4, 0, 1.4]) box(p, 'kereste', x - 0.04, x + 0.04, 0.28, 1.15, z - 0.04, z + 0.04, ['+x', '-x', '+z', '-z', '+y'], 1);
      beam(p, 'kereste', V(-1.5, 1.05, z), V(1.5, 1.05, z), 0.07, 0.05);
      beam(p, 'kereste', V(-1.5, 0.65, z), V(1.5, 0.65, z), 0.06, 0.04);
    }
  },
  su_olugu: (p) => { // sehpalar üstünde ahşap su oluğu, 3 m
    for (const x of [-1, 1]) for (const s of [-1, 1]) beam(p, 'kutuk', V(x, 0, s * 0.35), V(x, 0.95, -s * 0.06), 0.05, 0.05, false);
    openBox(p, 'kaba_tahta', -1.5, 1.5, -0.15, 0.15, 0.85, 0.2, 0.03, 'su');
  },
  kaya_buyuk: (p) => { rock(p, 'moloz_tas', 0, 0, 0.9, 5); rock(p, 'moloz_tas', 0.75, 0.3, 0.4, 6); },
  kaya_kucuk: (p) => { rock(p, 'moloz_tas', 0, 0, 0.35, 8); rock(p, 'moloz_tas', 0.4, 0.15, 0.2, 9); rock(p, 'moloz_tas', -0.2, 0.3, 0.14, 10); },
  kesme_kutugu: (p) => {
    cyl(p, 'kutuk', V(0, 0, 0), V(0, 0.45, 0), 0.28, 8);
    beam(p, 'kereste', V(0.05, 0.45, 0), V(0.5, 0.95, 0.1), 0.04, 0.03);
    box(p, 'demir', 0, 0.2, 0.4, 0.52, -0.02, 0.02, ALL, 1);
    cyl(p, 'kutuk', V(0.5, 0.07, 0.3), V(0.85, 0.07, 0.45), 0.07, 5);
    cyl(p, 'kutuk', V(0.45, 0.06, -0.35), V(0.8, 0.06, -0.3), 0.06, 5);
  },
  devrik_kutuk: (p) => {
    cyl(p, 'kutuk', V(-1, 0.22, 0), V(1, 0.2, 0.1), 0.22, 8);
    cyl(p, 'kutuk', V(0.3, 0.3, 0.1), V(0.5, 0.65, 0.3), 0.06, 5);
  },
  cali: (p) => { ball(p, 'yaprak', 0, 0.45, 0, 0.55, 6, 0.8); ball(p, 'yaprak', 0.45, 0.3, 0.2, 0.38, 6, 0.8); ball(p, 'yaprak', -0.4, 0.28, -0.15, 0.35, 6, 0.8); },
  selvi: (p) => {
    cyl(p, 'kutuk', V(0, 0, 0), V(0, 0.9, 0), 0.1, 5, false);
    lathe(p, 'selvi_yapragi', 0, 0, [[0, 0.5], [0.3, 0.7], [0.55, 1.7], [0.52, 3.6], [0.32, 5.8], [0, 7]], 7, 1);
  },
  meyve_agaci: (p) => {
    lathe(p, 'kutuk', 0, 0, [[0.16, 0], [0.11, 1.7]], 6);
    beam(p, 'kutuk', V(0, 1.5, 0), V(0.7, 2.4, 0.2), 0.08, 0.08, false);
    beam(p, 'kutuk', V(0, 1.6, 0), V(-0.6, 2.5, -0.3), 0.08, 0.08, false);
    [[0, 3.0, 0, 1.1], [0.9, 2.7, 0.3, 0.8], [-0.8, 2.8, -0.4, 0.85], [0.1, 2.5, -0.8, 0.7], [-0.2, 2.5, 0.8, 0.7]].forEach(([x, y, z, r]) => ball(p, 'yaprak', x, y, z, r, 6, 0.8));
  },
  kuru_agac: (p) => {
    lathe(p, 'kutuk', 0, 0, [[0.18, 0], [0.1, 2.2], [0.05, 3.4], [0, 3.6]], 6);
    [[1.4, 0.9, 2.6, 0.3], [1.8, -0.8, 2.9, -0.2], [2.3, 0.4, 3.4, -0.6], [2.5, -0.3, 3.5, 0.6], [1.1, -0.5, 1.7, 0.5]].forEach(([y0, x, y1, z]) => beam(p, 'kutuk', V(0, y0, 0), V(x, y1, z), 0.06, 0.06, false));
    beam(p, 'kutuk', V(0.9, 2.6, 0.3), V(1.3, 3.2, 0.5), 0.035, 0.035, false);
    beam(p, 'kutuk', V(-0.8, 2.9, -0.2), V(-1.2, 3.3, 0.1), 0.035, 0.035, false);
  },
  yer_sofrasi: (p) => { // sini, kasnak, kâseler ve üç minder
    lathe(p, 'kereste', 0, 0, [[0.22, 0], [0.14, 0.25]], 6);
    cyl(p, 'bakir', V(0, 0.25, 0), V(0, 0.28, 0), 0.45, 12);
    for (const [x, z] of [[0, 0.2], [-0.2, -0.1], [0.2, -0.12]]) lathe(p, 'toprak_canak', x, z, [[0.05, 0.28], [0.1, 0.34], [0.08, 0.34, 'sari'], [0, 0.32]], 6);
    for (const [x, z] of [[0, 0.85], [-0.8, -0.3], [0.8, -0.3]]) box(p, 'kilim', x - 0.28, x + 0.28, 0, 0.1, z - 0.28, z + 0.28, ['+x', '-x', '+z', '-z', '+y'], 0.5);
  },
  kilim_yaygi: (p) => box(p, 'kilim', -1, 1, 0, 0.015, -0.65, 0.65, ['+x', '-x', '+z', '-z', '+y'], 0.7),
  minder: (p) => {
    box(p, 'kilim', -0.3, 0.3, 0, 0.12, -0.3, 0.3, ALL, 0.5);
    box(p, 'kilim', -0.3, 0.3, 0.12, 0.4, -0.3, -0.18, ALL, 0.5); // sırt yastığı
  },
};
const kit = K.makeKit('sokak_esya_kiti', PARTS, M);
export const PARCALAR = kit.names, createParca = kit.create, createKit = kit.createKit;
function scene(name, list) {
  const g = new THREE.Group();
  g.name = name;
  for (const [part, x, z, rot = 0, y = 0] of list) {
    const m = createParca(part);
    m.position.set(x, y, z);
    m.rotation.y = rot;
    g.add(m);
  }
  return g;
}
export function createOrnekler() {
  const Q = Math.PI / 2, tiles = (part, nx, nz) => Array.from({ length: nx * nz }, (_, i) => [part, -((nx - 1) * 1.5) + (i % nx) * 3, -((nz - 1) * 1.5) + Math.floor(i / nx) * 3]);
  const sokak = scene('ornek_sehir_sokagi', [
    ...tiles('arnavut_kaldirimi', 5, 3),
    ...[-6, -3, 0, 3, 6].map((x) => ['kaldirim_kenari', x, -3.3]),
    ['duvar_cesmesi', -5.5, -4.4], ['sokak_feneri', -3.6, -3.6], ['dukkan_tentesi', 0, -4.4], ['seyyar_tezgah', 0, -3.4], ['sandik_yigini', 1.6, -3.9], ['meyve_kasasi', -1.4, -3.5], ['karpuz_yigini', 2.4, -3.2],
    ['kahve_masasi', 4.6, -3.0], ['hasir_tabure', 4.0, -2.6], ['hasir_tabure', 5.2, -2.7], ['nargile', 5.0, -3.5], ['mangal', 6.3, -3.6], ['saksi_rafi', 6.2, -4.25], ['ahsap_sira', 4.8, -4.2],
    ['tas_baba', -7.2, -3.0], ['tas_baba', 7.2, -3.0], ['binek_tasi', -2.6, -4.0], ['telgraf_diregi', 7.0, 4.0], ['simitci_tablasi', -4.5, 1.5], ['yuk_arabasi', 2.5, 2.2, Q * 1.1], ['gugum', -6.0, -3.6], ['testi', -6.4, -3.7], ['saksi', -4.6, -4.2], ['kup', 3.1, -4.2],
  ]);
  const koy = scene('ornek_koy_meydani', [
    ...tiles('toprak_yol', 5, 4),
    ['koy_cesmesi', -5, -5.6], ['selvi', -7, -5.5], ['selvi', -3, -6], ['meyve_agaci', 5.5, -4.5], ['kuru_agac', 7.2, 4.5], ['cali', 3, -5.6], ['cali', -7, 2],
    ['asma_cardagi', 0.5, -6.0], ['yer_sofrasi', 0.5, -4.6], ['kilim_yaygi', 0.5, -4.6, 0, 0.001], ['camasir_ipi', -4.5, 4.6], ['hali_askisi', 6, 1.5, Q], ['kurutma_sirigi', 2.5, 5.2],
    ['tandir', -1.5, 1.2], ['ocak_tasi', 0.6, 0.2], ['kazan', 1.9, 1.3], ['tezek_yigini', -3.4, 2.3], ['dibek', -2.9, -0.3], ['el_degirmeni', -1.9, -1.0], ['yayik', -0.2, -1.6], ['kova', -4.4, -4.3], ['tulumba', 3.6, -2.2],
    ['doven', 4.5, 3.4, 0.4], ['karasaban', 6.6, -1.4, -0.3], ['tarim_aletleri', 2.6, -6.3], ['ari_kovani', 6.8, -3.2], ['ari_kovani', 7.5, -2.6], ['kutuk_kovan', 7.4, -4.2, Q], ['kesme_kutugu', -6.2, -1.2], ['devrik_kutuk', -6.6, 0.6, 0.5],
    ['kaya_buyuk', -7.6, 4.8], ['kaya_kucuk', 4.2, 5.6], ['nalbant_orsu', 3.4, -0.4], ['bileyi_carki', 4.9, -0.2, Q], ['su_olugu', -3.4, -4.9, 0, 0], ['ahsap_kopru', 0, 7.2], ['tas_sedir', -1.8, -5.9], ['minder', 2.2, -5.8], ['sandik', -5.6, 4.0], ['meyve_sepeti', -0.5, -4.2],
  ]);
  return K.row('ornek_evler', [[sokak, 16], [koy, 17]], 5);
}
