import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Haliç balıkçı kayığı (1914, Osmanlı İstanbul'u); eskimiş, boyası dökülmüş. Uzunluk 5,2 m, en
// 1,35 m, bordo yüksekliği 0,55 m. 1 birim = 1 metre, Y yukarı, baş +Z; tekne tabanı y = 0'da,
// taban ortası (0, 0, 0)'da. Su hattı y = 0,18: tekne suya 18 cm gömülecek biçimde yerleştirilir.
// Dokusuz: eskime köşe renkleriyle verilir.

const L = 5.2, HALF = 0.675, BORDO = 0.55;
const GREEN = [0x1f, 0x3a, 0x2c], RED = [0x7a, 0x24, 0x1c], WOOD = [0x7a, 0x5c, 0x3c], DARKWOOD = [0x5a, 0x40, 0x28], ROPE = [0x8a, 0x7a, 0x56], IRON = [0x2e, 0x2a, 0x26];

// Konuma bağlı aşınma (0..1): boyanın döküldüğü, ahşabın karardığı yerler
export const wear = (x, y, z) => 0.5 + 0.3 * Math.sin(x * 9 + z * 4.3) * Math.sin(y * 13 - z * 2.7) + 0.2 * Math.sin(z * 11 + x * 5 + y * 7);
// Renkler sRGB verilir; köşe renkleri doğrusal uzayda saklanır
export const mix = (a, b, t) => a.map((v, i) => ((v + (b[i] - v) * t) / 255) ** 2.2);

// Kesit: z konumunda yarı genişlik, omurga ve küpeşte yüksekliği (uçlara doğru kalkar)
const t01 = (z) => Math.abs(z) / (L / 2);
const halfWidth = (z) => Math.max(0.018, HALF * (1 - t01(z) ** 2.3));
const keelY = (z) => 0.1 * t01(z) ** 3;
const sheerY = (z) => BORDO + 0.1 * t01(z) ** 2;
// Kesit eğrisi: s = 0 omurga, s = 1 küpeşte; [genişlik oranı, yükseklik oranı]
const SECTION = [[0, 0], [0.42, 0.04], [0.74, 0.2], [0.92, 0.48], [0.98, 0.78], [1, 1]];

// paint(x, y, z) => [r, g, b]; yüzey nokta ızgarasından kurulur
export function grid(rows, paint, flip = false) {
  const pos = [], col = [], idx = [];
  const w = rows[0].length;
  for (const row of rows) for (const p of row) { pos.push(...p); col.push(...paint(...p)); }
  for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < w - 1; i++) {
    const a = j * w + i, b = a + 1, c = a + w, d = c + 1;
    if (flip) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
// Hazır bir geometriyi boyar (uv'siz, köşe renkli)
export function tint(geometry, base, worn, amount = 0.5) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  g.deleteAttribute('uv');
  const p = g.attributes.position, col = [];
  for (let i = 0; i < p.count; i++) col.push(...mix(base, worn, amount * Math.max(0, wear(p.getX(i), p.getY(i), p.getZ(i)) - 0.35)));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

export function createKayik() {
  const STATIONS = 21;
  const zs = Array.from({ length: STATIONS }, (_, i) => -L / 2 + (L * i) / (STATIONS - 1));
  // Bir yüzey: inset kadar içeride, s oranında; her istasyonda iskeleden sancağa noktalar
  const surface = (inset, lift) => zs.map((z) => {
    const w = Math.max(0.006, halfWidth(z) - inset), k = keelY(z) + lift, h = sheerY(z) - k;
    const half = SECTION.map(([sx, sy]) => [sx * w, k + sy * h, z]);
    return [...half.slice(1).reverse().map(([x, y, zz]) => [-x, y, zz]), ...half];
  });
  // Dış yüz: koyu yeşil, üstte 7 cm kırmızı şerit; boya su hattında ve sürtünen yerlerde dökülmüş
  const outerPaint = (x, y, z) => {
    const base = y > sheerY(z) - 0.07 ? RED : GREEN;
    const nearWater = 1 - Math.min(1, Math.abs(y - 0.2) / 0.14);
    return mix(base, DARKWOOD, Math.min(0.85, Math.max(0, wear(x, y, z) - 0.42) * 1.5 + 0.35 * nearWater * wear(z, x, y)));
  };
  const innerPaint = (x, y, z) => mix(WOOD, DARKWOOD, Math.min(1, Math.max(0, wear(x, y, z) - 0.3) * 1.1 + 0.5 * Math.max(0, 0.25 - y) / 0.25));
  const outer = surface(0, 0), inner = surface(0.028, 0.03);
  // Küpeşte: dış ve iç yüzün üst kenarlarını birleştiren kırmızı şerit (iki yanda)
  const cap = [0, outer[0].length - 1].map((e) => grid(zs.map((_, j) => [outer[j][e], inner[j][e]]), outerPaint, e !== 0));
  const hull = mergeGeometries([grid(outer, outerPaint, true), grid(inner, innerPaint, false), ...cap].map((g) => g.toNonIndexed()));

  const innerHalfAt = (z, y) => { // içeride, y yüksekliğinde yarı genişlik
    const w = halfWidth(z) - 0.028, k = keelY(z) + 0.03, s = (y - k) / (sheerY(z) - k);
    for (let i = 1; i < SECTION.length; i++) if (s <= SECTION[i][1]) return w * (SECTION[i - 1][0] + ((SECTION[i][0] - SECTION[i - 1][0]) * (s - SECTION[i - 1][1])) / (SECTION[i][1] - SECTION[i - 1][1]));
    return w;
  };
  // Üç oturma tahtası
  const SEAT_Y = 0.34;
  const seats = mergeGeometries([-1.35, 0.05, 1.3].map((z) => tint(new THREE.BoxGeometry(innerHalfAt(z, SEAT_Y) * 2 - 0.03, 0.03, 0.24).translate(0, SEAT_Y, z), WOOD, DARKWOOD, 0.9)));
  // İki çift ıskarmoz: küpeşteye çakılı takoz ve demir çubuk
  const locks = [];
  for (const z of [-0.75, 0.6]) for (const s of [-1, 1]) {
    const x = s * (halfWidth(z) - 0.02), y = sheerY(z);
    locks.push(tint(new THREE.BoxGeometry(0.05, 0.03, 0.16).translate(x, y + 0.012, z), DARKWOOD, IRON, 0.6));
    locks.push(tint(new THREE.CylinderGeometry(0.009, 0.011, 0.11, 6).translate(x, y + 0.08, z), IRON, DARKWOOD, 0.4));
  }
  // İki kürek: oturakların üstünde yan yana yatık; palaları kıç tarafta
  const oars = [];
  [[-0.1, 0.012], [-0.21, -0.02]].forEach(([x, yaw], i) => {
    const shaft = new THREE.CylinderGeometry(0.019, 0.024, 2.5, 6).rotateX(Math.PI / 2).translate(0, 0, 0.45);
    const blade = new THREE.BoxGeometry(0.11, 0.014, 0.75).translate(0, 0, -1.15);
    const grip = new THREE.CylinderGeometry(0.015, 0.015, 0.14, 6).rotateX(Math.PI / 2).translate(0, 0, 1.76);
    oars.push(...[shaft, blade, grip].map((g) => tint(g.rotateY(yaw).translate(x, SEAT_Y + 0.036 + i * 0.002, -0.15), WOOD, DARKWOOD, 1)));
  });
  // Başta toplanmış halat kangalı: üst üste dizili halkalar
  const coil = [];
  const CZ = 1.82, CY = keelY(CZ) + 0.03 + 0.07;
  [[0.14, 0], [0.125, 0.03], [0.14, 0.06], [0.11, 0.088]].forEach(([r, h], i) => {
    coil.push(tint(new THREE.TorusGeometry(r, 0.017, 5, 14).rotateX(Math.PI / 2).rotateY(i * 0.7).translate(0.012 * Math.sin(i * 2), CY + h, CZ + 0.01 * Math.cos(i * 2)), ROPE, DARKWOOD, 0.7));
  });
  coil.push(tint(new THREE.CylinderGeometry(0.015, 0.015, 0.34, 5).rotateX(Math.PI / 2).rotateY(0.5).translate(-0.09, CY + 0.1, CZ - 0.2), ROPE, DARKWOOD, 0.7)); // sarkan uç

  const material = (name, roughness) => new THREE.MeshStandardMaterial({ name, vertexColors: true, roughness, metalness: 0, side: THREE.DoubleSide });
  const root = new THREE.Group();
  root.name = 'kayik';
  for (const [name, geometry, mat] of [
    ['govde', hull, material('boyali_ahsap', 0.82)], ['oturaklar', seats, material('ciplak_ahsap', 0.9)],
    ['iskarmozlar', mergeGeometries(locks), material('iskarmoz', 0.85)], ['kurekler', mergeGeometries(oars), material('kurek', 0.88)],
    ['halat', mergeGeometries(coil), material('halat', 0.95)],
  ]) {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.name = name;
    mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
  }
  return root;
}
