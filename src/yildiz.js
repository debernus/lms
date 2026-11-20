import * as THREE from 'three';
import { canvasTexture } from './halk2.js';
import { Part, opening } from './arapcami.js';

// Yıldız Sarayı, Büyük Mabeyn Köşkü (İstanbul). Beyaz mermer cepheli, bodrum üstünde iki katlı yapı:
// ortada geri çekilmiş üç açıklıklı bölüm, iki yanında öne çıkan köşk kütleleri, dışta üçer açıklıklı
// kanatlar. Kemerli, yeşil kepenkli pencereler; altlarında korkuluk panoları; açıklıklar arasında pilastrlar;
// kat silmeleri, taşkın saçak silmesi ve çatı korkuluğu; ortada çift kollu merdiven ve camekânlı giriş.
// 1 birim = 1 metre, Y yukarı, ön cephe +Z, taban y = 0, yapı merkezde.
// Parçalar: saray_govde, saray_cephe (pencere, pilastr, pano), saray_cati, saray_merdiven.

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
// Kat düzeyleri
const Y = { base: 3.2, f1: 10.0, f2: 16.5, cornice: 17.4 };
const XW = 23.5, XP0 = 5.5, XP1 = 13.5, ZF = 12.5, ZR = -14, JUT = 2.5; // kanat ucu, köşk kütlesi, ön/arka yüz, çıkıntı

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function textures() {
  const rand = rng(1880);
  const stone = canvasTexture('beyaz_mermer_cephe', 512, 512, (g) => {
    g.fillStyle = '#e4e0d4';
    g.fillRect(0, 0, 512, 512);
    for (let row = 0; row < 8; row++) {
      g.fillStyle = 'rgba(120,112,96,0.22)';
      g.fillRect(0, row * 64 + 62, 512, 2);
      for (let k = 0; k < 4; k++) g.fillRect(k * 128 + (row % 2) * 64, row * 64, 1.5, 62);
    }
    g.filter = 'blur(14px)';
    for (let i = 0; i < 24; i++) {
      g.fillStyle = `rgba(${rand() < 0.5 ? '120,110,90' : '255,255,250'},${0.05 + rand() * 0.08})`;
      g.beginPath();
      g.ellipse(80 + rand() * 352, 80 + rand() * 352, 30 + rand() * 60, 30 + rand() * 80, 0, 0, 6.3);
      g.fill();
    }
    g.filter = 'none';
  });
  // Pencere: koyu cam, yeşil doğrama, içeride açık renk perde
  const win = canvasTexture('saray_penceresi', 128, 256, (g) => {
    g.fillStyle = '#1a2224';
    g.fillRect(0, 0, 128, 256);
    g.fillStyle = 'rgba(214,204,180,0.5)';
    g.beginPath();
    g.moveTo(10, 256);
    g.quadraticCurveTo(30, 150, 10, 40);
    g.lineTo(10, 256);
    g.moveTo(118, 256);
    g.quadraticCurveTo(98, 150, 118, 40);
    g.lineTo(118, 256);
    g.fill();
    g.strokeStyle = '#1f4a3a';
    g.lineWidth = 9;
    g.strokeRect(4, 4, 120, 248);
    g.lineWidth = 6;
    g.strokeRect(64, 0, 0.01, 256);
    g.strokeRect(0, 78, 128, 0.01);
    g.strokeRect(0, 170, 128, 0.01);
  });
  const shutter = canvasTexture('yesil_kepenk', 64, 64, (g) => {
    g.fillStyle = '#1e4a3b';
    g.fillRect(0, 0, 64, 64);
    for (let y = 0; y < 64; y += 8) {
      g.fillStyle = '#133227';
      g.fillRect(0, y + 5, 64, 3);
      g.fillStyle = '#2c6350';
      g.fillRect(0, y, 64, 1.5);
    }
  });
  const baluster = canvasTexture('korkuluk_panosu', 128, 128, (g) => {
    g.fillStyle = '#d9d4c6';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#8f897a';
    g.fillRect(0, 14, 128, 100);
    for (let k = 0; k < 4; k++) {
      const x = k * 32 + 16;
      g.fillStyle = '#ece8dc';
      g.beginPath();
      g.moveTo(x - 4, 14);
      g.bezierCurveTo(x - 13, 40, x - 13, 80, x - 5, 96);
      g.lineTo(x - 7, 114);
      g.lineTo(x + 7, 114);
      g.lineTo(x + 5, 96);
      g.bezierCurveTo(x + 13, 80, x + 13, 40, x + 4, 14);
      g.fill();
    }
  });
  const lattice = (name, bg, line, step) => canvasTexture(name, 128, 128, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = line;
    g.lineWidth = 3;
    for (let i = -128; i < 256; i += step) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i + 128, 128);
      g.moveTo(i + 128, 0);
      g.lineTo(i, 128);
      g.stroke();
    }
    g.lineWidth = 7;
    g.strokeRect(2, 2, 124, 124);
  });
  const porch = canvasTexture('camekan', 128, 128, (g) => {
    g.fillStyle = '#5d6a70';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#f2efe6';
    g.lineWidth = 7;
    for (let k = 0; k <= 4; k++) g.strokeRect(k * 32, 0, 0.01, 128);
    for (const y of [3, 30, 100, 125]) g.strokeRect(0, y, 128, 0.01);
    g.lineWidth = 3;
    for (let k = 0; k < 4; k++) {
      g.beginPath();
      g.moveTo(k * 32, 3);
      g.lineTo(k * 32 + 32, 30);
      g.moveTo(k * 32 + 32, 3);
      g.lineTo(k * 32, 30);
      g.moveTo(k * 32, 100);
      g.lineTo(k * 32 + 32, 125);
      g.moveTo(k * 32 + 32, 100);
      g.lineTo(k * 32, 125);
      g.stroke();
    }
  });
  return { stone, win, shutter, baluster, lattice, porch };
}

export function createYildizSarayi() {
  const root = new THREE.Group();
  root.name = 'yildiz_sarayi';
  const T = textures();
  const std = (name, o) => new THREE.MeshStandardMaterial({ name, roughness: 0.85, metalness: 0, side: THREE.DoubleSide, ...o });
  const M = {
    tas: std('beyaz_mermer_cephe', { map: T.stone }),
    silme: std('mermer_silme', { color: 0xe9e5da }),
    pencere: std('saray_penceresi', { map: T.win, roughness: 0.4 }),
    kepenk: std('yesil_kepenk', { map: T.shutter }),
    korkuluk: std('korkuluk_panosu', { map: T.baluster }),
    kafes: std('bodrum_kafesi', { map: T.lattice('bodrum_kafesi', '#1c2422', '#4f6a5e', 16) }),
    camekan: std('camekan', { map: T.porch, roughness: 0.5 }),
    kapi: std('kapi_karanlik', { color: 0x1a1612 }),
    cati: std('cati_kursun', { color: 0x8c9094, roughness: 0.7, metalness: 0.2 }),
  };
  const ALL = ['+x', '-x', '+z', '-z', '+y', '-y'];
  const body = new Part('saray_govde'), face = new Part('saray_cephe'), roof = new Part('saray_cati'), stair = new Part('saray_merdiven');
  // Cepheye göre kutu: P'den R boyunca [a0, a1], N boyunca [d0, d1]
  const obox = (part, mat, P, R, N, a0, a1, y0, y1, d0, d1, us = 3) => {
    const p = P.clone().addScaledVector(R, a0).addScaledVector(N, d0), q = P.clone().addScaledVector(R, a1).addScaledVector(N, d1);
    part.box(mat, Math.min(p.x, q.x), Math.max(p.x, q.x), y0, y1, Math.min(p.z, q.z), Math.max(p.z, q.z), ALL, us, us);
  };

  // ---------- Kütleler: gövde, ön ve arka köşk çıkıntıları; her birinde silmeler ve çatı korkuluğu ----------
  const blocks = [
    [-XW, XW, ZR, ZF, 1.0],
    [-XP1, -XP0, ZR - JUT, ZF + JUT, 1.9],
    [XP0, XP1, ZR - JUT, ZF + JUT, 1.9],
  ];
  for (const [x0, x1, z0, z1, attic] of blocks) {
    body.box('tas', x0, x1, 0, Y.f2, z0, z1, ['+x', '-x', '+z', '-z'], 3, 3);
    const band = (y0, y1, out, mat = 'silme') => body.box(mat, x0 - out, x1 + out, y0, y1, z0 - out, z1 + out, ALL, 3, 3);
    band(0, 0.5, 0.12); // subasman
    band(Y.base - 0.25, Y.base + 0.1, 0.18); // bodrum üstü silme
    band(Y.f1 - 0.55, Y.f1 - 0.2, 0.2); // kat silmesi: alt kuşak
    band(Y.f1 - 0.2, Y.f1, 0.34);
    band(Y.f2 - 0.3, Y.f2, 0.2); // saçak: friz, dişli kuşak, taşkın silme
    band(Y.f2, Y.f2 + 0.45, 0.4);
    band(Y.f2 + 0.45, Y.cornice, 0.75);
    // Çatı korkuluğu (atik): saçağın gerisinde alçak duvar, üstü kurşun örtü
    roof.box('tas', x0 + 0.1, x1 - 0.1, Y.cornice, Y.cornice + attic, z0 + 0.1, z1 - 0.1, ['+x', '-x', '+z', '-z'], 3, 3);
    roof.box('silme', x0 - 0.05, x1 + 0.05, Y.cornice + attic - 0.22, Y.cornice + attic, z0 - 0.05, z1 + 0.05, ALL, 3, 3);
    roof.box('cati', x0 + 0.6, x1 - 0.6, Y.cornice + attic - 0.5, Y.cornice + attic - 0.3, z0 + 0.6, z1 - 0.6, ['+y'], 3, 3);
    roof.box('cati', x0 - 0.75, x1 + 0.75, Y.cornice - 0.02, Y.cornice, z0 - 0.75, z1 + 0.75, ['+y'], 3, 3);
  }

  // ---------- Cephe düzeni: her yüz açıklıklara bölünür ----------
  const pilaster = (P, R, N, a, y0, y1) => {
    obox(face, 'silme', P, R, N, a - 0.3, a + 0.3, y0, y1 - 0.5, 0, 0.2);
    obox(face, 'silme', P, R, N, a - 0.38, a + 0.38, y0, y0 + 0.45, 0, 0.28); // kaide
    obox(face, 'silme', P, R, N, a - 0.4, a + 0.4, y1 - 0.5, y1, 0, 0.3); // başlık
  };
  const windowAt = (P, R, N, a, sill, wide) => {
    const c = P.clone().addScaledVector(R, a), half = wide ? 0.8 : 0.5, h = 3.7;
    opening(face, { P: c.clone().setY(sill), R, N, a: half, h, pane: 'pencere', frame: 'silme', f: 0.22, depth: 0.14 });
    obox(face, 'silme', c, R, N, -half - 0.42, half + 0.42, sill + h + 0.3, sill + h + 0.48, 0, 0.3); // alınlık silmesi
    obox(face, 'silme', c, R, N, -0.14, 0.14, sill + h - 0.05, sill + h + 0.3, 0, 0.24); // kilit taşı
    if (wide) for (const s of [-1, 1]) obox(face, 'kepenk', c, R, N, s * (half + 0.24), s * (half + 0.66), sill + 0.05, sill + h - half * 0.55, 0.02, 0.09, 0.5); // açık kepenk kanatları
    // Pencere altı korkuluk panosu
    obox(face, 'korkuluk', c, R, N, -half - 0.4, half + 0.4, sill - 1.25, sill - 0.14, 0, 0.12, 1);
    obox(face, 'silme', c, R, N, -half - 0.5, half + 0.5, sill - 0.14, sill, 0, 0.22);
    obox(face, 'silme', c, R, N, -half - 0.5, half + 0.5, sill - 1.4, sill - 1.25, 0, 0.18);
  };
  const cellar = (P, R, N, a) => {
    const c = P.clone().addScaledVector(R, a), at = (x, y) => c.clone().addScaledVector(R, x).addScaledVector(N, 0.03).setY(y);
    face.quad('kafes', [at(-0.65, 0.9), at(0.65, 0.9), at(0.65, 2.35), at(-0.65, 2.35)], [[0, 0], [1, 0], [1, 1], [0, 1]], N);
    obox(face, 'silme', c, R, N, -0.8, 0.8, 2.35, 2.5, 0, 0.1);
    obox(face, 'silme', c, R, N, -0.8, 0.8, 0.75, 0.9, 0, 0.1);
  };
  // run: P (başlangıç köşesi), R (yüz boyunca), N (dış normal), length, bays; door: giriş açıklığının sırası
  const run = (P, R, N, length, bays, o = {}) => {
    const w = length / bays, narrow = w < 3;
    for (let k = 0; k <= bays; k++) {
      if (narrow && !o.ends) continue;
      const a = Math.min(length - 0.3, Math.max(0.3, k * w));
      pilaster(P, R, N, a, Y.base + 0.1, Y.f1 - 0.55);
      pilaster(P, R, N, a, Y.f1, Y.f2 - 0.3);
    }
    for (let k = 0; k < bays; k++) {
      const a = (k + 0.5) * w;
      windowAt(P, R, N, a, Y.f1 + 1.55, !narrow);
      if (o.door === k) continue;
      windowAt(P, R, N, a, Y.base + 1.75, !narrow);
      if (!narrow) cellar(P, R, N, a);
    }
  };
  const X = V(1, 0, 0), Z = V(0, 0, 1), nX = V(-1, 0, 0), nZ = V(0, 0, -1);
  // Ön cephe (+Z)
  run(V(-XW, 0, ZF), X, Z, XW - XP1, 3);
  run(V(-XP1, 0, ZF + JUT), X, Z, XP1 - XP0, 2);
  run(V(-XP0, 0, ZF), X, Z, 2 * XP0, 3, { door: 1 });
  run(V(XP0, 0, ZF + JUT), X, Z, XP1 - XP0, 2);
  run(V(XP1, 0, ZF), X, Z, XW - XP1, 3);
  // Arka cephe (-Z): ön cephenin aynası, merdivensiz
  run(V(XW, 0, ZR), nX, nZ, XW - XP1, 3);
  run(V(XP1, 0, ZR - JUT), nX, nZ, XP1 - XP0, 2);
  run(V(XP0, 0, ZR), nX, nZ, 2 * XP0, 3);
  run(V(-XP0, 0, ZR - JUT), nX, nZ, XP1 - XP0, 2);
  run(V(-XP1, 0, ZR), nX, nZ, XW - XP1, 3);
  // Yan cepheler
  run(V(XW, 0, ZF), nZ, X, ZF - ZR, 7);
  run(V(-XW, 0, ZR), Z, nX, ZF - ZR, 7);
  // Köşk çıkıntılarının yan yüzleri: birer dar pencere
  for (const s of [-1, 1]) {
    run(V(s * XP0, 0, ZF), Z, V(-s, 0, 0), JUT, 1);
    run(V(s * XP1, 0, ZF), Z, V(s, 0, 0), JUT, 1);
    run(V(s * XP0, 0, ZR - JUT), Z, V(-s, 0, 0), JUT, 1);
    run(V(s * XP1, 0, ZR - JUT), Z, V(s, 0, 0), JUT, 1);
  }

  // ---------- Giriş: sahanlık, çift kollu merdiven, camekân ----------
  const LX = 3.2, LZ = ZF + 3.4, LY = Y.base + 0.1;
  stair.box('tas', -LX, LX, 0, LY, ZF, LZ, ['+x', '-x', '+z', '+y'], 3, 3);
  stair.box('silme', -LX - 0.1, LX + 0.1, LY - 0.25, LY, ZF, LZ + 0.1, ALL, 3, 3);
  // Sahanlığın altında bodrum kapısı
  stair.quad('kapi', [V(-0.85, 0, LZ + 0.02), V(0.85, 0, LZ + 0.02), V(0.85, 2.4, LZ + 0.02), V(-0.85, 2.4, LZ + 0.02)], [[0, 0], [1, 0], [1, 1], [0, 1]], Z);
  stair.box('silme', -1.1, 1.1, 2.4, 2.6, LZ, LZ + 0.12, ALL, 3, 3);
  // Sahanlık korkuluğu (ön)
  stair.box('korkuluk', -LX, LX, LY, LY + 0.95, LZ - 0.12, LZ, ALL, 1, 1);
  // Kollar: sahanlığın iki yanından öne ve dışa doğru iner
  const STEPS = 18, RISE = LY / STEPS, GO = 0.31, HALFW = 1.15;
  for (const s of [-1, 1]) {
    const d = V(s * 0.64, 0, 0.77).normalize(), side = V(d.z, 0, -d.x), start = V(s * (LX - 0.4), 0, LZ - 1.1);
    const flat = [[0, 0], [1, 0], [1, 0.15], [0, 0.15]];
    for (let k = 0; k < STEPS; k++) {
      const y = LY - (k + 1) * RISE, a = start.clone().addScaledVector(d, k * GO), b = start.clone().addScaledVector(d, (k + 1) * GO);
      const c = [a.clone().addScaledVector(side, -HALFW), a.clone().addScaledVector(side, HALFW), b.clone().addScaledVector(side, HALFW), b.clone().addScaledVector(side, -HALFW)];
      stair.quad('silme', c.map((p) => p.clone().setY(y + RISE)), flat, UP); // basamak
      stair.quad('silme', [c[3].clone().setY(y), c[2].clone().setY(y), c[2].clone().setY(y + RISE), c[3].clone().setY(y + RISE)], flat, d); // rıht
    }
    // Yan duvarlar: zeminden basamak çizgisinin üstüne, eğimli korkuluk
    const end = start.clone().addScaledVector(d, STEPS * GO);
    for (const e of [-1, 1]) {
      const p0 = start.clone().addScaledVector(side, e * HALFW), p1 = end.clone().addScaledVector(side, e * HALFW);
      stair.quad('tas', [p0.clone().setY(0), p1.clone().setY(0), p1.clone().setY(1.0), p0.clone().setY(LY + 0.95)], [[0, 0], [2, 0], [2, 0.33], [0, 1.4]], side.clone().multiplyScalar(e));
    }
    // Alt uçta babalar
    for (const e of [-1, 1]) {
      const p = end.clone().addScaledVector(side, e * HALFW);
      stair.box('silme', p.x - 0.22, p.x + 0.22, 0, 1.25, p.z - 0.22, p.z + 0.22, ALL, 3, 3);
    }
  }
  // Camekân: kapının önünde beyaz kafesli camlı giriş
  stair.box('camekan', -1.7, 1.7, LY, LY + 3.6, ZF, ZF + 2.2, ['+x', '-x', '+z'], 0.9, 3.6, true);
  stair.box('silme', -1.85, 1.85, LY + 3.6, LY + 3.85, ZF, ZF + 2.35, ALL, 3, 3);
  root.add(body.mesh(M), face.mesh(M), roof.mesh(M), stair.mesh(M));
  return root;
}
