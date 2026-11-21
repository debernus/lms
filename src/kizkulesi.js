import * as THREE from 'three';
import { canvasTexture } from './halk2.js';
import { Part, opening } from './arapcami.js';

// Kız Kulesi (İstanbul): iki kademeli taş rıhtım ve çevresinde kayalar; ahşap kuşaklı kare taş kule,
// sekizgen balkon ve fener katı, dilimli kurşun külah, bayrak direği; kulenin önünde ve yanında kiremit
// çatılı iki yapı, sütunlu giriş, arkada mazgallı avlu duvarı. Su yoktur.
// 1 birim = 1 metre, Y yukarı, giriş cephesi +Z, taban (su düzeyi) y = 0, rıhtım merkezde.
// Önde L biçimli ahşap iskele, arka sağ köşede kayalık üstünde kırmızı-beyaz küçük deniz feneri.
// Parçalar: rihtim, kayalar, kule, kule_kulahi, yapilar, avlu_duvari, bayrak, iskele, deniz_feneri, fener_kayaliklari.

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2, Y0 = 1.5; // rıhtım üstü
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function textures() {
  const rand = rng(1453);
  const blocks = (name, base, cols, rows, lo, hi, tint) => canvasTexture(name, 512, 512, (g) => {
    g.fillStyle = base;
    g.fillRect(0, 0, 512, 512);
    const w = 512 / cols, h = 512 / rows;
    for (let r = 0; r < rows; r++) for (let c = -1; c < cols; c++) {
      const v = lo + rand() * (hi - lo);
      g.fillStyle = `rgb(${v + tint[0]},${v + tint[1]},${v + tint[2]})`;
      g.fillRect(c * w + (r % 2) * w / 2 + 2, r * h + 2, w - 4, h - 4);
    }
    g.filter = 'blur(12px)';
    for (let i = 0; i < 22; i++) {
      g.fillStyle = `rgba(40,34,26,${0.06 + rand() * 0.12})`;
      g.beginPath();
      g.ellipse(80 + rand() * 352, 80 + rand() * 352, 20 + rand() * 60, 20 + rand() * 60, 0, 0, TAU);
      g.fill();
    }
    g.filter = 'none';
  });
  const tiles = canvasTexture('kiremit_kirmizi', 256, 256, (g) => {
    for (let row = 0; row < 6; row++) for (let k = 0; k < 10; k++) {
      const r = 150 + rand() * 50, gg = 62 + rand() * 26, b = 40 + rand() * 18;
      const grad = g.createLinearGradient(k * 25.6, 0, k * 25.6 + 25.6, 0);
      grad.addColorStop(0, `rgb(${r * 0.55},${gg * 0.55},${b * 0.55})`);
      grad.addColorStop(0.45, `rgb(${r},${gg},${b})`);
      grad.addColorStop(1, `rgb(${r * 0.6},${gg * 0.6},${b * 0.6})`);
      g.fillStyle = grad;
      g.fillRect(k * 25.6, row * 42.67, 25.6, 42.67);
      g.fillStyle = 'rgba(40,14,8,0.45)';
      g.fillRect(k * 25.6, row * 42.67 + 39, 25.6, 3.67);
    }
  });
  const windowMap = canvasTexture('kepenkli_pencere', 128, 192, (g) => {
    g.fillStyle = '#6a3c22';
    g.fillRect(0, 0, 128, 192);
    for (let y = 6; y < 192; y += 9) {
      g.fillStyle = '#4a2814';
      g.fillRect(0, y, 128, 3);
    }
    g.fillStyle = '#1b2226';
    g.fillRect(36, 0, 56, 192);
    g.strokeStyle = '#e8e2d2';
    g.lineWidth = 5;
    g.strokeRect(36, 2, 56, 188);
    g.strokeRect(64, 0, 0.01, 192);
    g.strokeRect(36, 70, 56, 0.01);
  });
  const lantern = canvasTexture('fener_penceresi', 128, 128, (g) => {
    g.fillStyle = '#ebe5d6';
    g.fillRect(0, 0, 128, 128);
    for (const x of [14, 70]) {
      g.fillStyle = '#20282c';
      g.fillRect(x, 22, 44, 86);
      g.strokeStyle = '#4a3020';
      g.lineWidth = 5;
      g.strokeRect(x, 22, 44, 86);
      g.strokeRect(x + 22, 22, 0.01, 86);
    }
  });
  const rail = canvasTexture('demir_korkuluk', 128, 64, (g) => {
    g.clearRect(0, 0, 128, 64);
    g.strokeStyle = '#2a2a2c';
    g.lineWidth = 4;
    g.strokeRect(0, 3, 128, 0.01);
    g.strokeRect(0, 60, 128, 0.01);
    g.lineWidth = 3;
    for (let k = 0; k < 4; k++) {
      g.beginPath();
      g.arc(k * 32 + 16, 32, 13, 0, TAU);
      g.moveTo(k * 32, 3);
      g.lineTo(k * 32, 60);
      g.moveTo(k * 32 + 4, 8);
      g.lineTo(k * 32 + 28, 56);
      g.moveTo(k * 32 + 28, 8);
      g.lineTo(k * 32 + 4, 56);
      g.stroke();
    }
  });
  const flag = canvasTexture('bayrak', 192, 128, (g) => {
    g.fillStyle = '#c8141c';
    g.fillRect(0, 0, 192, 128);
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(72, 64, 32, 0, TAU);
    g.fill();
    g.fillStyle = '#c8141c';
    g.beginPath();
    g.arc(81, 64, 25.5, 0, TAU);
    g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU + Math.PI, r = k % 2 ? 6.2 : 16;
      g.lineTo(112 + Math.cos(a) * r, 64 + Math.sin(a) * r);
    }
    g.fill();
  });
  return { blocks, tiles, windowMap, lantern, rail, flag };
}

export function createKizKulesi() {
  const root = new THREE.Group();
  root.name = 'kiz_kulesi';
  const T = textures(), rand = rng(77);
  const std = (name, o) => new THREE.MeshStandardMaterial({ name, roughness: 0.9, metalness: 0, side: THREE.DoubleSide, ...o });
  const M = {
    kaldirim: std('rihtim_tasi', { map: T.blocks('rihtim_tasi', '#4c4a46', 6, 6, 104, 140, [0, -2, -8]) }),
    tas: std('kule_tasi', { map: T.blocks('kule_tasi', '#6e6252', 5, 10, 150, 196, [0, -12, -34]) }),
    kaya: std('kaya', { map: T.blocks('kaya', '#3c3a36', 3, 3, 70, 110, [0, -2, -6]) }),
    siva: std('beyaz_siva', { color: 0xe6e0d0 }),
    kiremit: std('kiremit_kirmizi', { map: T.tiles }),
    ahsap: std('koyu_ahsap', { color: 0x4a3020 }),
    pencere: std('kepenkli_pencere', { map: T.windowMap }),
    fener: std('fener_penceresi', { map: T.lantern }),
    kapi: std('kapi_ahsap', { color: 0x5a3018 }),
    kursun: std('kursun', { color: 0xaeb2b6, roughness: 0.6, metalness: 0.25 }),
    iskele: std('iskele_tahtasi', { map: T.blocks('iskele_tahtasi', '#2e2a26', 1, 14, 70, 100, [8, 0, -10]) }),
    fener_beyaz: std('fener_beyaz', { color: 0xe8e4da }),
    fener_kirmizi: std('fener_kirmizi', { color: 0xb02a22 }),
    fener_cam: std('fener_cami', { color: 0xf2e6a8, emissive: 0x8a7a30, roughness: 0.3 }),
    korkuluk: std('demir_korkuluk', { map: T.rail, alphaTest: 0.5 }),
    bayrak: std('bayrak', { map: T.flag }),
    karanlik: std('karanlik', { color: 0x15130f }),
  };
  const ALL = ['+x', '-x', '+z', '-z', '+y', '-y'], flat = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const add = (part) => root.add(part.mesh(M));

  // ---------- Rıhtım: iki kademeli taş platform ----------
  const quay = new Part('rihtim'), QX = [-19, 18], QZ = [-17, 16];
  quay.box('kaldirim', QX[0] - 1.3, QX[1] + 1.3, 0, 0.8, QZ[0] - 1.3, QZ[1] + 1.3, ['+x', '-x', '+z', '-z', '+y'], 3, 3);
  quay.box('kaldirim', QX[0], QX[1], 0.8, Y0, QZ[0], QZ[1], ['+x', '-x', '+z', '-z', '+y'], 3, 3);
  for (let k = 0; k < 7; k++) { // babalar
    const x = QX[0] + 3 + k * 5.2;
    quay.box('karanlik', x - 0.22, x + 0.22, 0.8, 1.45, QZ[1] + 0.5, QZ[1] + 0.94, ALL, 1, 1);
  }
  add(quay);

  // ---------- Kayalar: rıhtımın çevresinde, su düzeyinde dalgakıran taşları ----------
  const rocks = new Part('kayalar'), ico = new THREE.IcosahedronGeometry(1, 0).attributes.position;
  const rock = (x, z, r) => {
    const sx = 0.8 + rand() * 0.6, sy = 0.5 + rand() * 0.4, sz = 0.8 + rand() * 0.6, turn = rand() * TAU, jit = new Map();
    const P = (i) => {
      const key = `${ico.getX(i).toFixed(2)},${ico.getY(i).toFixed(2)},${ico.getZ(i).toFixed(2)}`;
      if (!jit.has(key)) jit.set(key, 0.75 + rand() * 0.5);
      const k = jit.get(key) * r, px = ico.getX(i) * sx, pz = ico.getZ(i) * sz;
      return V(x + (px * Math.cos(turn) - pz * Math.sin(turn)) * k, Math.max(0, r * sy * 0.55 + ico.getY(i) * sy * k), z + (px * Math.sin(turn) + pz * Math.cos(turn)) * k);
    };
    for (let i = 0; i < ico.count; i += 3) {
      const tri = [P(i), P(i + 1), P(i + 2)], mid = tri[0].clone().add(tri[1]).add(tri[2]).multiplyScalar(1 / 3);
      rocks.tri('kaya', tri, tri.map((p) => [(p.x + p.z) / 3, p.y / 3]), mid.sub(V(x, r * sy * 0.5, z)));
    }
  };
  const X0 = QX[0] - 1.3, X1 = QX[1] + 1.3, Z0 = QZ[0] - 1.3, Z1 = QZ[1] + 1.3, per = 2 * (X1 - X0 + Z1 - Z0);
  for (let d = 0; d < per; d += 1.5 + rand() * 1.3) {
    let x, z, nx = 0, nz = 0;
    if (d < X1 - X0) [x, z, nz] = [X0 + d, Z1, 1];
    else if (d < X1 - X0 + Z1 - Z0) [x, z, nx] = [X1, Z1 - (d - (X1 - X0)), 1];
    else if (d < 2 * (X1 - X0) + Z1 - Z0) [x, z, nz] = [X1 - (d - (X1 - X0) - (Z1 - Z0)), Z0, -1];
    else [x, z, nx] = [X0, Z0 + (d - 2 * (X1 - X0) - (Z1 - Z0)), -1];
    for (let row = 0; row < 2; row++) {
      if (row && rand() < 0.45) continue;
      const out = 0.5 + row * 1.6 + rand() * 0.9;
      rock(x + nx * out + (rand() - 0.5), z + nz * out + (rand() - 0.5), (row ? 0.6 : 0.95) + rand() * 0.7);
    }
  }
  add(rocks);

  // ---------- Kule: kare taş gövde, ahşap kuşaklar ve çaprazlar ----------
  const tower = new Part('kule'), TX = -8.2, TZ = -1.5, TH = 3.6, T0 = Y0, T1 = Y0 + 10.5;
  tower.box('tas', TX - TH, TX + TH, T0, T1, TZ - TH, TZ + TH, ['+x', '-x', '+z', '-z'], 3, 3);
  for (const y of [T0 + 3.4, T0 + 6.9, T1 - 0.3]) tower.box('ahsap', TX - TH - 0.07, TX + TH + 0.07, y, y + 0.3, TZ - TH - 0.07, TZ + TH + 0.07, ALL, 2, 2);
  const faces4 = [[V(TX - TH, 0, TZ + TH), V(1, 0, 0), V(0, 0, 1)], [V(TX + TH, 0, TZ + TH), V(0, 0, -1), V(1, 0, 0)], [V(TX + TH, 0, TZ - TH), V(-1, 0, 0), V(0, 0, -1)], [V(TX - TH, 0, TZ - TH), V(0, 0, 1), V(-1, 0, 0)]];
  for (const [P, R, N] of faces4) {
    for (const [y0, y1] of [[T0 + 3.7, T0 + 6.9], [T0 + 7.2, T1 - 0.3]]) for (const flip of [0, 1]) { // çapraz kuşaklar
      const a = P.clone().addScaledVector(R, flip ? 2 * TH : 0).addScaledVector(N, 0.05).setY(y0), b = P.clone().addScaledVector(R, flip ? 0 : 2 * TH).addScaledVector(N, 0.05).setY(y1);
      tower.quad('ahsap', [a.clone().setY(y0 - 0.0), a.clone().setY(y0 + 0.24), b.clone().setY(y1), b.clone().setY(y1 - 0.24)], flat, N);
    }
    opening(tower, { P: P.clone().addScaledVector(R, TH).setY(T0 + 4.6), R, N, a: 0.32, h: 1.5, pane: 'karanlik', frame: 'siva', f: 0.12, depth: 0.08 });
    opening(tower, { P: P.clone().addScaledVector(R, TH).setY(T0 + 8.0), R, N, a: 0.32, h: 1.5, pane: 'karanlik', frame: 'siva', f: 0.12, depth: 0.08 });
  }
  // Sekizgen halka yardımcıları
  const ring = (r, y, n = 8, phase = Math.PI / 8) => Array.from({ length: n }, (_, k) => V(TX + Math.cos((k / n) * TAU + phase) * r, y, TZ + Math.sin((k / n) * TAU + phase) * r));
  const band = (part, mat, a, b, us = 1) => {
    const n = a.length;
    for (let k = 0; k < n; k++) {
      const q = [a[k], a[(k + 1) % n], b[(k + 1) % n], b[k]], mid = q[0].clone().add(q[1]).multiplyScalar(0.5);
      part.quad(mat, q, us ? [[0, 0], [us, 0], [us, 1], [0, 1]] : flat, V(mid.x - TX, b[k].y === a[k].y ? (Math.hypot(b[k].x - TX, b[k].z - TZ) < Math.hypot(a[k].x - TX, a[k].z - TZ) ? 3 : -3) : 0.2, mid.z - TZ));
    }
  };
  // Konsol: kare gövdeden sekizgen balkona açılır
  const B0 = T1, B1 = T1 + 1.3, BR = 5.5;
  band(tower, 'siva', ring(TH * 1.2, B0), ring(BR, B1));
  band(tower, 'ahsap', ring(BR, B1), ring(BR, B1 + 0.18));
  band(tower, 'ahsap', ring(BR, B1 + 0.18), ring(3.4, B1 + 0.18)); // balkon döşemesi
  band(tower, 'korkuluk', ring(BR - 0.1, B1 + 0.18), ring(BR - 0.1, B1 + 1.25), 5);
  // Fener katı: sekizgen, her yüzünde ikiz pencere
  const LR = 3.5, L0 = B1 + 0.18, L1 = L0 + 3.2;
  band(tower, 'fener', ring(LR, L0), ring(LR, L1));
  band(tower, 'siva', ring(LR + 0.35, L1), ring(LR + 0.35, L1 + 0.35));
  band(tower, 'siva', ring(LR, L1), ring(LR + 0.35, L1));
  add(tower);

  // ---------- Külah: dilimli kurşun kubbe, tepelik, direk ----------
  const cap = new Part('kule_kulahi'), C0 = L1 + 0.35;
  const dome = [[LR + 0.55, 0], [LR + 0.6, 0.25], [LR + 0.35, 1.3], [LR - 0.35, 2.5], [LR - 1.35, 3.5], [1.45, 4.2], [1.15, 4.6]];
  const ribbed = (r, y) => Array.from({ length: 16 }, (_, k) => V(TX + Math.cos((k / 16) * TAU) * r * (k % 2 ? 0.965 : 1.02), y, TZ + Math.sin((k / 16) * TAU) * r * (k % 2 ? 0.965 : 1.02)));
  band(cap, 'kursun', ring(LR + 0.35, C0, 16, 0), ribbed(...dome[0].map((v, i) => (i ? v + C0 : v))), 0);
  for (let j = 0; j + 1 < dome.length; j++) band(cap, 'kursun', ribbed(dome[j][0], C0 + dome[j][1]), ribbed(dome[j + 1][0], C0 + dome[j + 1][1]), 0);
  const D1 = C0 + 4.6;
  // Tepelik: küçük korkuluklu sahanlık, kasnak, sivri başlık
  band(cap, 'kursun', ring(1.15, D1, 12, 0), ring(1.7, D1 + 0.15, 12, 0), 0);
  band(cap, 'korkuluk', ring(1.65, D1 + 0.15, 12, 0), ring(1.65, D1 + 0.8, 12, 0), 2);
  band(cap, 'kursun', ring(0.75, D1 + 0.15, 12, 0), ring(0.75, D1 + 0.9, 12, 0), 0);
  band(cap, 'kursun', ring(1.0, D1 + 0.9, 12, 0), ring(0.14, D1 + 1.7, 12, 0), 0);
  band(cap, 'kursun', ring(0.75, D1 + 0.9, 12, 0), ring(1.0, D1 + 0.9, 12, 0), 0);
  const P0 = D1 + 1.7, P1 = P0 + 8.5;
  band(cap, 'kursun', ring(0.14, P0, 8, 0), ring(0.06, P1, 8, 0), 0);
  band(cap, 'kursun', ring(0.06, P1, 8, 0), ring(0.2, P1 + 0.25, 8, 0), 0); // mızrak ucu
  band(cap, 'kursun', ring(0.2, P1 + 0.25, 8, 0), ring(0.005, P1 + 0.95, 8, 0), 0);
  add(cap);
  const flag = new Part('bayrak'), FY = P0 + 5.2;
  flag.quad('bayrak', [V(TX + 0.1, FY, TZ), V(TX + 2.5, FY - 0.1, TZ + 0.25), V(TX + 2.5, FY + 1.5, TZ + 0.25), V(TX + 0.1, FY + 1.6, TZ)], flat, V(0, 0, 1));
  add(flag);

  // ---------- Yapılar: kiremit beşik çatılı iki kanat, sütunlu giriş ----------
  const house = new Part('yapilar');
  // Beşik çatılı kanat: mahya X boyunca
  const wing = (x0, x1, z0, z1, h, rise, wall = 'siva') => {
    const y1 = Y0 + h, zm = (z0 + z1) / 2, ov = 0.55, slope = rise / ((z1 - z0) / 2), ye = y1 - ov * slope, top = y1 + rise, len = Math.hypot((z1 - z0) / 2 + ov, top - ye);
    house.box(wall, x0, x1, Y0, y1, z0, z1, ['+x', '-x', '+z', '-z'], 3, 3);
    house.box('tas', x0 - 0.06, x1 + 0.06, Y0, Y0 + 0.5, z0 - 0.06, z1 + 0.06, ['+x', '-x', '+z', '-z', '+y'], 3, 3);
    for (const x of [x0, x1]) house.tri(wall, [V(x, y1, z0), V(x, y1, z1), V(x, top, zm)], [[z0 / 3, y1 / 3], [z1 / 3, y1 / 3], [zm / 3, top / 3]], V(x === x0 ? -1 : 1, 0, 0));
    for (const s of [-1, 1]) {
      const ze = s < 0 ? z0 - ov : z1 + ov;
      house.quad('kiremit', [V(x0 - ov, ye, ze), V(x1 + ov, ye, ze), V(x1 + ov, top, zm), V(x0 - ov, top, zm)], [[x0 / 2, 0], [x1 / 2, 0], [x1 / 2, len / 2], [x0 / 2, len / 2]], V(0, 1, s));
      house.box('ahsap', x0 - ov, x1 + ov, ye - 0.14, ye, Math.min(ze, ze - s * 0.12), Math.max(ze, ze - s * 0.12), ALL, 2, 2);
    }
    house.box('kiremit', x0 - ov, x1 + ov, top - 0.05, top + 0.12, zm - 0.14, zm + 0.14, ALL, 2, 2); // mahya
  };
  const win = (P, R, N) => opening(house, { P, R, N, a: 0.95, h: 2.1, pane: 'pencere', frame: 'siva', f: 0.14, depth: 0.1, sill: true });
  const X = V(1, 0, 0), Z = V(0, 0, 1), nX = V(-1, 0, 0), nZ = V(0, 0, -1);
  // Ön kanat (giriş), arka kanat (daha yüksek)
  const F = { x0: -12.5, x1: 9.5, z0: 3, z1: 9.5 }, R2 = { x0: -4.6, x1: 12, z0: -5, z1: 3 };
  wing(F.x0, F.x1, F.z0, F.z1, 3.9, 1.7);
  wing(R2.x0, R2.x1, R2.z0, R2.z1, 5.4, 2.0, 'tas'); // arka yapı taş duvarlı
  for (const x of [-10.2, -7.2, 1.8, 4.6, 7.4]) win(V(x, Y0 + 1.15, F.z1), X, Z);
  for (const z of [4.6, 7.9]) {
    win(V(F.x1, Y0 + 1.15, z), nZ, X);
    win(V(F.x0, Y0 + 1.15, z), Z, nX);
  }
  for (const x of [-9.5, -6, 6.5]) win(V(x, Y0 + 1.15, F.z0), nX, nZ);
  for (const z of [-3, 0.8]) for (const y of [Y0 + 1.1, Y0 + 3.6]) opening(house, { P: V(R2.x1, y, z), R: nZ, N: X, a: 0.6, h: y > Y0 + 3 ? 1.3 : 1.9, pane: 'pencere', frame: 'siva', f: 0.12, depth: 0.1 });
  for (const x of [-1, 3, 7, 10]) opening(house, { P: V(x, Y0 + 2.6, R2.z0), R: nX, N: nZ, a: 0.6, h: 1.6, pane: 'pencere', frame: 'siva', f: 0.12, depth: 0.1 });
  // Giriş: kapı, iki sütun, üçgen alınlıklı saçak, basamaklar
  const DX = -2.8;
  opening(house, { P: V(DX, Y0 + 0.5, F.z1), R: X, N: Z, a: 0.85, h: 2.6, pane: 'kapi', frame: 'siva', f: 0.16, depth: 0.12 });
  const PZ = F.z1 + 2.1, PY = Y0 + 3.5;
  for (const s of [-1, 1]) {
    house.box('siva', DX + s * 1.5 - 0.2, DX + s * 1.5 + 0.2, Y0 + 0.5, PY, PZ - 0.2, PZ + 0.2, ALL, 3, 3);
    house.box('siva', DX + s * 1.5 - 0.28, DX + s * 1.5 + 0.28, PY - 0.25, PY, PZ - 0.28, PZ + 0.28, ALL, 3, 3);
    house.quad('kiremit', [V(DX + s * 1.95, PY, F.z1), V(DX + s * 1.95, PY, PZ + 0.4), V(DX, PY + 1.05, PZ + 0.4), V(DX, PY + 1.05, F.z1)], [[0, 0], [1.2, 0], [1.2, 1.1], [0, 1.1]], V(s, 1, 0));
  }
  house.tri('siva', [V(DX - 1.95, PY, PZ + 0.3), V(DX + 1.95, PY, PZ + 0.3), V(DX, PY + 1.0, PZ + 0.3)], [[0, 0], [1, 0], [0.5, 1]], Z);
  house.box('siva', DX - 1.95, DX + 1.95, PY - 0.2, PY, F.z1, PZ + 0.3, ALL, 3, 3);
  for (let k = 0; k < 3; k++) house.box('kaldirim', DX - 2.3, DX + 2.3, Y0, Y0 + 0.5 - k * 0.167, F.z1 + (k ? 1.8 + k * 0.35 : 0), F.z1 + 2.15 + k * 0.35, ['+x', '-x', '+z', '+y'], 3, 3);
  // Yan merdiven: arka kanadın üst kat kapısına çıkar
  for (let k = 0; k < 8; k++) house.box('kaldirim', R2.x1, R2.x1 + 1.4, Y0, Y0 + 2.6 - k * 0.32, 3.2 + k * 0.45, 3.65 + k * 0.45, ['+x', '-x', '+z', '+y'], 3, 3);
  add(house);

  // ---------- Avlu duvarı: arkada mazgallı taş duvar ----------
  const court = new Part('avlu_duvari'), CW = { x0: -12.5, x1: 12, z0: -14, z1: -5 }, CH = Y0 + 4.2, TK = 0.7;
  const wallRun = (x0, x1, z0, z1) => {
    court.box('tas', x0, x1, Y0, CH, z0, z1, ALL, 3, 3);
    const alongX = x1 - x0 > z1 - z0, len = alongX ? x1 - x0 : z1 - z0, n = Math.max(2, Math.round(len / 1.7));
    for (let k = 0; k < n; k++) {
      const a = (k + 0.2) * (len / n), b = a + (len / n) * 0.55;
      if (alongX) court.box('tas', x0 + a, x0 + b, CH, CH + 0.75, z0, z1, ALL, 3, 3);
      else court.box('tas', x0, x1, CH, CH + 0.75, z0 + a, z0 + b, ALL, 3, 3);
    }
  };
  wallRun(CW.x0, CW.x1, CW.z0, CW.z0 + TK);
  wallRun(CW.x0, CW.x0 + TK, CW.z0 + TK, CW.z1);
  wallRun(CW.x1 - TK, CW.x1, CW.z0 + TK, CW.z1);
  opening(court, { P: V(CW.x0, Y0, -9.5), R: Z, N: nX, a: 0.7, h: 2.3, pane: 'karanlik', frame: 'tas', f: 0.2, depth: 0.08 });
  add(court);

  // ---------- İskele: ön sol köşeden denize uzanan L biçimli ahşap iskele, kazıklar üstünde ----------
  const pier = new Part('iskele'), PZ0 = QZ[1] + 1.3, DECK = [0.75, 1.0];
  const deck = (x0, x1, z0, z1) => {
    pier.box('iskele', x0, x1, DECK[0], DECK[1], z0, z1, ALL, 2.5, 2.5);
    for (let x = x0 + 0.4; x <= x1 - 0.3; x += 2.4) for (const z of z1 - z0 > 4 ? [z0 + 0.5, (z0 + z1) / 2, z1 - 0.5] : [z0 + 0.4, z1 - 0.4]) pier.box('karanlik', x - 0.2, x + 0.2, 0, DECK[0], z - 0.2, z + 0.2, ['+x', '-x', '+z', '-z'], 1, 1);
  };
  deck(-15, -11.4, PZ0, PZ0 + 9.5);
  deck(-15, -4.5, PZ0 + 6.2, PZ0 + 9.5);
  for (const [x, z] of [[-15, PZ0 + 9.5], [-4.5, PZ0 + 9.5], [-4.5, PZ0 + 6.2], [-11.4, PZ0 + 3]]) pier.box('karanlik', x - 0.16, x + 0.16, DECK[1], DECK[1] + 0.7, z - 0.16, z + 0.16, ALL, 1, 1); // babalar
  add(pier);

  // ---------- Küçük deniz feneri: arka sağ köşede kayalık üstünde, kırmızı-beyaz kuşaklı ----------
  const light = new Part('deniz_feneri'), LX = QX[1] + 5.5, LZ = QZ[0] + 1.5;
  const circle = (r, y, n = 10) => Array.from({ length: n }, (_, k) => V(LX + Math.cos((k / n) * TAU) * r, y, LZ + Math.sin((k / n) * TAU) * r));
  const shell = (mat, r0, y0, r1, y1, n = 10) => {
    const a = circle(r0, y0, n), b = circle(r1, y1, n);
    for (let k = 0; k < n; k++) light.quad(mat, [a[k], a[(k + 1) % n], b[(k + 1) % n], b[k]], flat, V(a[k].x + a[(k + 1) % n].x - 2 * LX, y1 === y0 ? (r1 < r0 ? 4 : -4) : 0.3, a[k].z + a[(k + 1) % n].z - 2 * LZ));
  };
  const G = 1.1; // kayalığın üstü
  shell('kaldirim', 1.5, 0, 1.4, G);
  shell('kaldirim', 1.4, G, 0, G);
  const levels = [[0.95, G, 'fener_beyaz'], [0.88, G + 1.1, 'fener_kirmizi'], [0.8, G + 2.2, 'fener_beyaz'], [0.72, G + 3.3, 'fener_kirmizi'], [0.66, G + 4.2]];
  for (let j = 0; j + 1 < levels.length; j++) shell(levels[j][2], levels[j][0], levels[j][1], levels[j + 1][0], levels[j + 1][1]);
  const GY = G + 4.2;
  shell('fener_beyaz', 0.66, GY, 1.0, GY + 0.12); // sahanlık
  shell('fener_beyaz', 1.0, GY + 0.12, 0.5, GY + 0.12);
  shell('korkuluk', 0.98, GY + 0.12, 0.98, GY + 0.6);
  shell('fener_cam', 0.5, GY + 0.12, 0.5, GY + 0.95, 8); // ışık odası
  shell('fener_kirmizi', 0.62, GY + 0.95, 0.5, GY + 0.95, 8);
  shell('fener_kirmizi', 0.62, GY + 0.95, 0.06, GY + 1.5, 8);
  shell('fener_kirmizi', 0.06, GY + 1.5, 0.01, GY + 1.9, 6);
  add(light);
  // Fenerin çevresinde ve rıhtıma bağlanan dilde kayalar
  const extra = new Part('fener_kayaliklari'), saved = rocks.groups;
  rocks.groups = extra.groups;
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * TAU + rand() * 0.3, d = 1.9 + rand() * 1.6;
    rock(LX + Math.cos(a) * d, LZ + Math.sin(a) * d, 0.7 + rand() * 0.8);
  }
  for (let k = 0; k < 6; k++) rock(QX[1] + 1.6 + k * 0.7 + rand() * 0.5, LZ + (rand() - 0.5) * 2.2, 0.8 + rand() * 0.6);
  rocks.groups = saved;
  add(extra);
  return root;
}
