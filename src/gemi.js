import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { wear, mix, grid, tint } from './kayik.js';

// Küçük yelkenli yük gemisi (tek direkli kıyı teknesi, 1914 Osmanlı İstanbul'u); eskimiş.
// Uzunluk 11 m (cıvadrayla 13,6 m), en 3,4 m, direk tepesi 10,6 m. 1 birim = 1 metre, Y yukarı,
// baş +Z; omurga y = 0'da, taban ortası (0, 0, 0)'da. Su hattı y = 0,75. Dokusuz, köşe renkli.

const L = 11, HALF = 1.7, DECK = 1.75; // güverte yüksekliği (ortada)
const BLACK = [0x1c, 0x1b, 0x1a], OCHRE = [0x9a, 0x7a, 0x32], REDLEAD = [0x5e, 0x24, 0x1c], WOOD = [0x7a, 0x5c, 0x3c], DARKWOOD = [0x4a, 0x35, 0x22];
const CANVAS = [0xa8, 0x9c, 0x80], STAIN = [0x6a, 0x5c, 0x44], ROPE = [0x6e, 0x60, 0x44], IRON = [0x2a, 0x27, 0x24], CABIN = [0x35, 0x4a, 0x42];

// Kesitler: baş sivri, kıç daha dolgun; küpeşte uçlara doğru kalkar
const u = (z) => z / (L / 2); // -1 kıç, +1 baş
const halfWidth = (z) => Math.max(0.03, HALF * (1 - Math.abs(u(z)) ** (z > 0 ? 2.0 : 3.2)));
const keelY = (z) => (z > 0 ? 0.5 * u(z) ** 4 : 0.25 * u(z) ** 6);
const sheerY = (z) => DECK + 0.45 + 0.5 * u(z) ** 2 + (z > 0 ? 0.25 * u(z) ** 2 : 0);
const deckY = (z) => sheerY(z) - 0.45;
const SECTION = [[0, 0], [0.3, 0.05], [0.68, 0.22], [0.9, 0.45], [0.99, 0.72], [1, 1]];

export function createGemi() {
  const zs = Array.from({ length: 25 }, (_, i) => -L / 2 + (L * i) / 24);
  const surface = (inset, top) => zs.map((z) => {
    const w = Math.max(0.01, halfWidth(z) - inset), k = keelY(z), h = top(z) - k;
    const half = SECTION.map(([sx, sy]) => [sx * w, k + sy * h, z]);
    return [...half.slice(1).reverse().map(([x, y, zz]) => [-x, y, zz]), ...half];
  });
  // Dış yüz: su altında kırmızı sülyen, üstü siyah, küpeştenin altında aşı boyası şerit
  const hullPaint = (x, y, z) => {
    const base = y < 0.72 ? REDLEAD : y > sheerY(z) - 0.16 && y < sheerY(z) - 0.06 ? OCHRE : BLACK;
    const nearWater = 1 - Math.min(1, Math.abs(y - 0.78) / 0.25);
    return mix(base, DARKWOOD, Math.min(0.8, Math.max(0, wear(x * 0.5, y, z * 0.5) - 0.45) * 1.4 + 0.4 * nearWater * wear(z * 0.4, x, y)));
  };
  const woodPaint = (x, y, z) => mix(WOOD, DARKWOOD, Math.min(1, Math.max(0, wear(x, y * 2, z * 0.7) - 0.3) * 1.2));
  const outer = surface(0, sheerY);
  // Güverte: iki bordanın arasını kapatan tahta yüzey; üstünde parampet (bordanın güverteden yukarısı)
  const deck = grid(zs.map((z) => [-1, -0.5, 0, 0.5, 1].map((e) => [e * (halfWidth(z) - 0.06), deckY(z) + 0.03 * (1 - e * e), z])), woodPaint, false);
  const bulwark = [-1, 1].map((sgn) => grid(zs.map((z) => [[sgn * (halfWidth(z) - 0.07), deckY(z), z], [sgn * (halfWidth(z) - 0.06), sheerY(z), z]]), woodPaint, sgn > 0));
  const cap = [-1, 1].map((sgn) => grid(zs.map((z) => [[sgn * halfWidth(z), sheerY(z), z], [sgn * (halfWidth(z) - 0.07), sheerY(z), z]]), woodPaint, sgn < 0));
  const hull = mergeGeometries([grid(outer, hullPaint, true), deck, ...bulwark, ...cap].map((g) => g.toNonIndexed()));

  const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
  const cyl = (r0, r1, len, segs = 8) => new THREE.CylinderGeometry(r1, r0, len, segs);
  const between = (a, b, r0, r1, segs = 6) => { // a'dan b'ye uzanan çubuk
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
    const g = cyl(r0, r1, d.length(), segs);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()));
    const m = A.lerp(B, 0.5);
    return g.translate(m.x, m.y, m.z);
  };

  // Kıç kamarası, ambar kapağı, baş ırgat babası
  const CZ = -2.75, cy = deckY(CZ);
  const house = [
    tint(box(1.6, 1.0, 1.7, 0, cy + 0.5, CZ), CABIN, DARKWOOD, 0.8),
    tint(box(1.8, 0.07, 1.9, 0, cy + 1.035, CZ), DARKWOOD, WOOD, 0.6), // dam
    tint(box(0.5, 0.78, 0.04, 0.35, cy + 0.44, CZ + 0.86), DARKWOOD, WOOD, 0.5), // kapı
    tint(box(0.28, 0.22, 0.04, -0.4, cy + 0.65, CZ + 0.86), IRON, DARKWOOD, 0.3), // pencere
    tint(box(1.5, 0.3, 1.7, 0, deckY(0.6) + 0.15, 0.6), DARKWOOD, WOOD, 0.9), // ambar ağzı
    tint(box(1.6, 0.05, 1.8, 0, deckY(0.6) + 0.32, 0.6), CANVAS, STAIN, 1.2), // ambar örtüsü
    tint(cyl(0.11, 0.09, 0.6).translate(0, deckY(4.2) + 0.3, 4.2), DARKWOOD, IRON, 0.6), // baba
  ];
  // Dümen: kıç bodoslamada pala, güvertede yeke
  const rudder = [
    tint(box(0.07, 1.9, 0.75, 0, 0.95, -L / 2 - 0.36), DARKWOOD, REDLEAD, 0.8),
    tint(between([0, deckY(-5.2) + 0.75, -L / 2 - 0.1], [0, deckY(-4.6) + 0.55, -4.45], 0.035, 0.03), WOOD, DARKWOOD, 0.9),
  ];
  // Arma: direk, bumba, pik, cıvadra
  const MZ = 1.9, mastFoot = deckY(MZ), TOP = 10.6;
  const boomEnd = [0.25, mastFoot + 1.45, -4.9], gaffEnd = [0.2, 8.6, -2.4], sprit = [0, sheerY(5.3) + 0.55, L / 2 + 2.6];
  const spars = [
    tint(between([0, keelY(MZ) + 0.4, MZ], [0, TOP, MZ - 0.25], 0.15, 0.075, 10), WOOD, DARKWOOD, 0.9),
    tint(between([0, mastFoot + 1.35, MZ - 0.2], boomEnd, 0.075, 0.055), WOOD, DARKWOOD, 0.9),
    tint(between([0, 7.2, MZ - 0.25], gaffEnd, 0.06, 0.045), WOOD, DARKWOOD, 0.9),
    tint(between([0, sheerY(4.6) + 0.1, 4.4], sprit, 0.1, 0.06), WOOD, DARKWOOD, 0.9),
  ];
  // Yelkenler: randa (dört köşe) ve flok (üçgen); rüzgârda hafif şişkin, lekeli ve yamalı görünüm
  const sailPaint = (x, y, z) => mix(CANVAS, STAIN, Math.min(0.8, Math.max(0, wear(z * 0.8, y * 0.6, x) - 0.35) * 1.3));
  const quad = (a, b, c, d, belly) => grid(Array.from({ length: 7 }, (_, j) => Array.from({ length: 7 }, (_, i) => {
    const s = i / 6, t = j / 6;
    const p = [0, 1, 2].map((k) => (a[k] * (1 - s) + b[k] * s) * (1 - t) + (d[k] * (1 - s) + c[k] * s) * t);
    p[0] += belly * Math.sin(Math.PI * s) * Math.sin(Math.PI * Math.min(1, t * 1.1));
    return p;
  })), sailPaint, false);
  const sails = [
    quad([0, mastFoot + 1.5, MZ - 0.3], [boomEnd[0], boomEnd[1] + 0.08, boomEnd[2] + 0.2], [gaffEnd[0], gaffEnd[1] - 0.08, gaffEnd[2] + 0.15], [0, 7.1, MZ - 0.35], 0.45),
    quad([0, sheerY(4.9) + 0.75, 5.6], [0, mastFoot + 1.6, MZ + 0.5], [0, 8.4, MZ + 0.15], [0, 8.4, MZ + 0.15], 0.3),
  ];
  // Donanım: çarmıhlar, baş ve kıç ıstralyaları
  const rig = [];
  for (const sgn of [-1, 1]) for (const dz of [-0.5, 0.2]) rig.push(between([sgn * (halfWidth(MZ + dz) - 0.03), sheerY(MZ + dz), MZ + dz], [0, 8.9, MZ - 0.22], 0.012, 0.012, 4));
  rig.push(between(sprit, [0, 9.2, MZ - 0.2], 0.012, 0.012, 4), between(gaffEnd, [0, TOP - 0.2, MZ - 0.25], 0.01, 0.01, 4), between(boomEnd, [0, deckY(-5) + 0.1, -5.0], 0.012, 0.012, 4));
  const rigging = mergeGeometries(rig.map((g) => tint(g, ROPE, IRON, 0.6)));

  const material = (name, roughness) => new THREE.MeshStandardMaterial({ name, vertexColors: true, roughness, metalness: 0, side: THREE.DoubleSide });
  const root = new THREE.Group();
  root.name = 'gemi';
  for (const [name, geometry, mat] of [
    ['govde', hull, material('boyali_ahsap', 0.85)], ['kamara_ve_guverte', mergeGeometries(house), material('guverte_yapilari', 0.88)],
    ['dumen', mergeGeometries(rudder), material('dumen', 0.88)], ['direkler', mergeGeometries(spars), material('direk', 0.85)],
    ['yelkenler', mergeGeometries(sails.map((g) => g.toNonIndexed())), material('yelken_bezi', 0.95)], ['donanim', rigging, material('halat', 0.95)],
  ]) {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.name = name;
    mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
  }
  return root;
}
