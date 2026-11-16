import * as THREE from 'three';
import { meshField, sharpenBoundaries } from './isosurface.js';
import { Surface, cloth, awayFromAxis, bodyDistance, TAU } from './outfit.js';
import { assemble } from './outfit2.js';
import { jacketFabric, keepLargestPiece, skirtRadius, ARM, CEKET } from './outfit3.js';
import { buildAyakkabi } from './outfit5.js';

// Osmanlı halk kıyafeti 1 (levhadaki sol üst figür): pembe çizgili uzun entari, belde kırmızı kuşak
// ve kuşağa sokulu beyaz mendil, üstünde önü açık uzun mavi cübbe, ayakta alçak ayakkabı.
// manken_erkek.glb'nin üstüne oturur (gömleksiz kopyayla kullanılır); konum ve ölçek mankenle aynı.

const HEM = 0.14; // etek ucu: ayak bileği

// ---------- Entari ----------
// Bileğe inen uzun kollu, V yakalı, ayak bileğine kadar inen iç giysi; boyuna pembe çizgili.
function stripeTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 8;
  const g = c.getContext('2d');
  g.fillStyle = '#b98f8c';
  g.fillRect(0, 0, 64, 8);
  g.fillStyle = '#d9c3ba';
  g.fillRect(0, 0, 22, 8);
  g.fillStyle = '#a87674';
  g.fillRect(40, 0, 5, 8);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.name = 'entari_cizgi';
  return t;
}
function buildEntari() {
  const s = jacketFabric(
    [[1.1, 0.018], [1.06, 0.019], [1.0, 0.02], [0.9, 0.024], [0.75, 0.03], [0.6, 0.036], [0.45, 0.042], [0.3, 0.05], [HEM, 0.058], [HEM - 0.003, 0.052]],
    { drop: 0.07, from: -0.03, to: 0.06 }, // V yaka: önde göğse doğru açılır
  );
  // Çizgiler gövdede ve etekte yukarıdan aşağı, kollarda kol boyunca akar. Dikiş yeri sırtta.
  const uv = [];
  for (let i = 0; i < s.positions.length; i += 3) {
    const [x, y, z] = [s.positions[i], s.positions[i + 1], s.positions[i + 2]];
    const onArm = Math.abs(x) > 0.24 && y > 1.3;
    uv.push(onArm ? (Math.atan2(y - ARM.y, z - ARM.z) / TAU) * 10 : (Math.atan2(x, z - CEKET.cz) / TAU) * 36, 0.5);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(s.positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(s.indices);
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ name: 'entari', map: stripeTexture(), roughness: 0.85, metalness: 0, side: THREE.DoubleSide }));
  mesh.name = 'entari';
  return mesh;
}

// ---------- Kuşak ve mendil ----------
function buildKusak() {
  const red = new Surface(), gold = new Surface(), white = new Surface();
  // Kuşak yalnız önde ve yanlarda modellenir; arkası cübbenin altında kalır
  const ring = (s, y, gap) => Array.from({ length: 25 }, (_, k) => {
    const a = Math.PI / 2 - 1.5 + (3 * k) / 24, r = skirtRadius(y, a, gap);
    return s.point(CEKET.cx + Math.cos(a) * r, y, CEKET.cz + Math.sin(a) * r);
  });
  const out = awayFromAxis(CEKET.cx, CEKET.cz);
  // Üç kat sargı: kırmızı, ortasında sarı şerit
  const rows = [[1.0, 0.024], [1.003, 0.03], [1.035, 0.034], [1.04, 0.03], [1.062, 0.034], [1.066, 0.03], [1.098, 0.034], [1.102, 0.024]];
  rows.slice(1).forEach(([y, gap], i) => {
    const s = i === 3 ? gold : red;
    s.strip(ring(s, rows[i][0], rows[i][1]), ring(s, y, gap), false, out);
  });
  // Mendil: kuşağın sol önünden sarkan beyaz bez, aşağı doğru daralır
  let above = null;
  for (const [y, half] of [[1.03, 0.17], [0.95, 0.18], [0.87, 0.17], [0.8, 0.14], [0.74, 0.08]]) {
    const row = Array.from({ length: 5 }, (_, c) => {
      const a = Math.PI / 2 - 0.3 + half * (c / 2 - 1), r = skirtRadius(y, a, y > 1 ? 0.042 : 0.046) + 0.004 * Math.sin(c * 2.4);
      return white.point(CEKET.cx + Math.cos(a) * r, y, CEKET.cz + Math.sin(a) * r);
    });
    if (above) white.strip(above, row, false, out);
    above = row;
  }
  return assemble('kusak', [[red, cloth('kusak', 0x8c2a1f)], [gold, cloth('kusak_serit', 0xb08a2e)], [white, cloth('mendil', 0xd8d2c0)]]);
}

// ---------- Cübbe ----------
// Omuzları ve sırtı örten, önü boydan boya açık, geniş kollu uzun dış giysi.
const OPEN = 0.1; // ön açıklığın yarısı
function cubbeField(x, y, z) {
  const body = bodyDistance(x, y, z) - 0.036 + 0.08 * Math.min(1, Math.max(0, (Math.abs(x) - 0.2) / 0.14));
  const ax = Math.abs(x);
  if (ax < 0.2) return body;
  const tube = Math.hypot(y - (ARM.y - 0.012), z - ARM.z) - (0.092 + 0.02 * Math.min(1, (ax - 0.2) / 0.4)); // bileğe doğru genişleyen kol
  const k = 0.03, t = Math.max(k - Math.abs(body - tube), 0) / k;
  return Math.min(body, tube) - t * t * k * 0.25;
}
function inCubbe(x, y, z) {
  if (Math.abs(x) > 0.6 || y < CEKET.waist) return 0;
  if (y > 1.5 && Math.hypot(x, z + 0.045) < 0.115) return 0; // boyun
  if (z > 0 && Math.abs(x) < OPEN + 0.03 * Math.max(0, (y - 1.3) / 0.25)) return 0; // ön açıklık, yukarı doğru genişler
  return y < 1.6 ? 1 : 0;
}
function buildCubbe() {
  const { positions, indices } = meshField(cubbeField, [-0.66, 1.03, -0.24, 0.66, 1.63, 0.18], 0.028);
  sharpenBoundaries(cubbeField, inCubbe, positions, indices);
  const s = new Surface();
  const keep = new Int32Array(positions.length / 3).fill(-1);
  const inside = (v) => inCubbe(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]);
  for (let t = 0; t < indices.length; t += 3) {
    const tri = [indices[t], indices[t + 1], indices[t + 2]];
    if (!tri.every(inside)) continue;
    for (const v of tri) {
      if (keep[v] < 0) keep[v] = s.point(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]);
      s.indices.push(keep[v]);
    }
  }
  keepLargestPiece(s);
  // Etek: belden ayak bileğine, önü açık; aşağı doğru genişler
  const SEG = 36, GAP = 0.62;
  let previous = null;
  for (const [y, gap] of [[1.1, 0.03], [1.05, 0.038], [1.0, 0.046], [0.85, 0.06], [0.65, 0.072], [0.45, 0.085], [0.25, 0.098], [HEM - 0.02, 0.105]]) {
    const row = Array.from({ length: SEG + 1 }, (_, k) => {
      const a = Math.PI / 2 + GAP + ((TAU - 2 * GAP) * k) / SEG, r = skirtRadius(y, a, gap);
      return s.point(CEKET.cx + Math.cos(a) * r, y, CEKET.cz + Math.sin(a) * r);
    });
    if (previous) s.strip(previous, row, false, awayFromAxis(CEKET.cx, CEKET.cz));
    previous = row;
  }
  const mesh = new THREE.Mesh(s.geometry(), cloth('cubbe', 0x1f5a6b));
  mesh.name = 'cubbe';
  return mesh;
}

export function createHalk1() {
  const root = new THREE.Group();
  root.name = 'halk_01_cubbeli';
  root.add(buildEntari(), buildKusak(), buildCubbe(), buildAyakkabi(0x2a211a));
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
