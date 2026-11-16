// Bir manken GLB'sinden kıyafet dikmek için gereken ölçüleri çıkarır ve src/manken_olcu.js'e yazar.
// Manken dosyasının kendisi depoya girmez; yalnız bu ölçüler girer.
//   kullanım: node tools/olcu_al.mjs <manken.glb> [çıktı.js]
import { readFileSync, writeFileSync } from 'node:fs';

const [, , input, output = new URL('../src/manken_olcu.js', import.meta.url).pathname] = process.argv;
if (!input) throw new Error('kullanım: node tools/olcu_al.mjs <manken.glb> [çıktı.js]');

// --- GLB oku: her düğümün ağını (dönüşümsüz varsayılır) köşe ve üçgen olarak al ---
const file = readFileSync(input);
const jsonLength = file.readUInt32LE(12);
const gltf = JSON.parse(file.subarray(20, 20 + jsonLength).toString('utf8'));
const bin = file.subarray(20 + jsonLength + 8);
const TYPES = { 5121: [Uint8Array, 1], 5123: [Uint16Array, 2], 5125: [Uint32Array, 4], 5126: [Float32Array, 4] };
const WIDTH = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
function accessor(index) {
  const a = gltf.accessors[index];
  const view = gltf.bufferViews[a.bufferView];
  const [Type, size] = TYPES[a.componentType];
  const n = WIDTH[a.type];
  const stride = view.byteStride || size * n;
  const start = (view.byteOffset || 0) + (a.byteOffset || 0);
  const out = new Type(a.count * n);
  const dv = new DataView(bin.buffer, bin.byteOffset);
  const read = { 5121: 'getUint8', 5123: 'getUint16', 5125: 'getUint32', 5126: 'getFloat32' }[a.componentType];
  for (let i = 0; i < a.count; i++) for (let c = 0; c < n; c++) out[i * n + c] = dv[read](start + i * stride + c * size, true);
  return out;
}
const parts = [];
for (const node of gltf.nodes) {
  if (node.mesh === undefined) continue;
  if (node.translation || node.rotation || node.scale || node.matrix) throw new Error(`"${node.name}" düğümünde dönüşüm var; bu araç dönüşümsüz manken bekler`);
  for (const prim of gltf.meshes[node.mesh].primitives) {
    parts.push({ name: node.name, positions: accessor(prim.attributes.POSITION), indices: accessor(prim.indices) });
  }
}

// --- Yüzeyi 4 mm aralıkla noktala (her nokta hangi parçadan geldiğini bilir) ---
let seed = 12345;
const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const SPACING = 0.004;
const points = []; // x, y, z
const owner = [];
parts.forEach((part, pi) => {
  const P = part.positions;
  for (let v = 0; v < P.length; v += 3) {
    points.push(P[v], P[v + 1], P[v + 2]);
    owner.push(pi);
  }
  for (let t = 0; t < part.indices.length; t += 3) {
    const [a, b, c] = [0, 1, 2].map((k) => part.indices[t + k] * 3);
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
    const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    const area = 0.5 * Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx);
    for (let n = Math.ceil(area / (SPACING * SPACING)); n > 0; n--) {
      let s = random(), w = random();
      if (s + w > 1) { s = 1 - s; w = 1 - w; }
      points.push(P[a] + ux * s + vx * w, P[a + 1] + uy * s + vy * w, P[a + 2] + uz * s + vz * w);
      owner.push(pi);
    }
  }
});
const count = owner.length;
const partName = (i) => parts[owner[i]].name;

// --- En yakın yüzey noktasına uzaklık (uzamsal ızgara ile) ---
const HASH = 0.02;
const buckets = new Map();
const keyOf = (i, j, k) => (i + 512) * 1048576 + (j + 512) * 1024 + (k + 512);
for (let p = 0; p < count; p++) {
  const key = keyOf(Math.floor(points[p * 3] / HASH), Math.floor(points[p * 3 + 1] / HASH), Math.floor(points[p * 3 + 2] / HASH));
  let list = buckets.get(key);
  if (!list) buckets.set(key, (list = []));
  list.push(p);
}
function distance(x, y, z, limit) {
  const ci = Math.floor(x / HASH), cj = Math.floor(y / HASH), ck = Math.floor(z / HASH);
  let best = limit * limit;
  const rings = Math.ceil(limit / HASH);
  for (let r = 0; r <= rings; r++) {
    if ((r - 1) * HASH > Math.sqrt(best)) break; // bu halkadan daha yakını çıkamaz
    for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) for (let k = -r; k <= r; k++) {
      if (Math.max(Math.abs(i), Math.abs(j), Math.abs(k)) !== r) continue;
      const list = buckets.get(keyOf(ci + i, cj + j, ck + k));
      if (!list) continue;
      for (const p of list) {
        const d = (points[p * 3] - x) ** 2 + (points[p * 3 + 1] - y) ** 2 + (points[p * 3 + 2] - z) ** 2;
        if (d < best) best = d;
      }
    }
  }
  return Math.sqrt(best);
}

// --- 1) Gövde ve kolların çevresinde işaretli uzaklık ızgarası (cepken için) ---
// Dışarısı artı, içerisi eksi.
const CELL = 0.015;
const MIN = [-0.525, 1.065, -0.225];
const DIMS = [71, 38, 27]; // x: ±0.525, y: 1.065..1.62, z: -0.225..0.165
const RANGE = [-0.03, 0.09]; // saklanan uzaklık aralığı
const total = DIMS[0] * DIMS[1] * DIMS[2];
const dist = new Float32Array(total);
const at = (i, j, k) => i + DIMS[0] * (j + DIMS[1] * k);
for (let k = 0; k < DIMS[2]; k++) for (let j = 0; j < DIMS[1]; j++) for (let i = 0; i < DIMS[0]; i++) {
  dist[at(i, j, k)] = distance(MIN[0] + i * CELL, MIN[1] + j * CELL, MIN[2] + k * CELL, RANGE[1] + 0.02);
}
// Manken kapalı bir hacim değil (gömleğin yakası, kol ağızları ve eteği açık); bu yüzden iç/dış
// ayrımı sarım sayısıyla yapılır: düğümden bakınca yüzeyin kapladığı katı açı, 4π'nin yarısını
// geçiyorsa düğüm içeridedir. Açık ağızlar bu sayıyı biraz düşürür ama yarının altına indirmez.
const tris = [];
for (const part of parts) {
  for (let t = 0; t < part.indices.length; t++) {
    const v = part.indices[t] * 3;
    tris.push(part.positions[v], part.positions[v + 1], part.positions[v + 2]);
  }
}
const T = new Float64Array(tris);
function windingNumber(x, y, z) {
  let sum = 0;
  for (let t = 0; t < T.length; t += 9) {
    const ax = T[t] - x, ay = T[t + 1] - y, az = T[t + 2] - z;
    const bx = T[t + 3] - x, by = T[t + 4] - y, bz = T[t + 5] - z;
    const cx = T[t + 6] - x, cy = T[t + 7] - y, cz = T[t + 8] - z;
    const la = Math.sqrt(ax * ax + ay * ay + az * az), lb = Math.sqrt(bx * bx + by * by + bz * bz), lc = Math.sqrt(cx * cx + cy * cy + cz * cz);
    const det = ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx);
    const den = la * lb * lc + (ax * bx + ay * by + az * bz) * lc + (bx * cx + by * cy + bz * cz) * la + (cx * ax + cy * ay + cz * az) * lb;
    sum += 2 * Math.atan2(det, den);
  }
  return sum / (4 * Math.PI);
}
const outside = new Uint8Array(total);
for (let k = 0; k < DIMS[2]; k++) for (let j = 0; j < DIMS[1]; j++) for (let i = 0; i < DIMS[0]; i++) {
  const w = windingNumber(MIN[0] + i * CELL, MIN[1] + j * CELL, MIN[2] + k * CELL);
  outside[at(i, j, k)] = Math.abs(w) < 0.5 ? 1 : 0;
}
const bytes = Buffer.alloc(total);
let inside = 0;
for (let n = 0; n < total; n++) {
  const signed = outside[n] ? dist[n] : -dist[n];
  if (!outside[n]) inside++;
  bytes[n] = Math.round((Math.max(RANGE[0], Math.min(RANGE[1], signed)) - RANGE[0]) / (RANGE[1] - RANGE[0]) * 255);
}

// --- 2) Yatay kesitlerin dışbükey zarfları (şalvar, kuşak ve kalpak için) ---
function hull(pts) {
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list) => {
    const h = [];
    for (const p of list) {
      while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop();
      h.push(p);
    }
    h.pop();
    return h;
  };
  return [...half(pts), ...half([...pts].reverse())];
}
// y0'dan y1'e dy aralıklı dilimler; her dilimde keep(i) süzgecinden geçen noktaların [x, z] zarfı.
function slices(y0, y1, dy, keep) {
  const n = Math.round((y1 - y0) / dy) + 1;
  const groups = Array.from({ length: n }, () => []);
  for (let p = 0; p < count; p++) {
    if (!keep(p)) continue;
    const s = Math.round((points[p * 3 + 1] - y0) / dy);
    if (s >= 0 && s < n) groups[s].push([points[p * 3], points[p * 3 + 2]]);
  }
  return {
    y0, dy,
    hulls: groups.map((g, s) => {
      if (g.length < 3) throw new Error(`y = ${(y0 + s * dy).toFixed(2)} diliminde nokta yok`);
      return hull(g).flatMap(([x, z]) => [Math.round(x * 1000) / 1000, Math.round(z * 1000) / 1000]);
    }),
  };
}
const X = (p) => points[p * 3];
const lower = (p) => Math.abs(X(p)) < 0.3; // gövde ve bacaklar (kollar ve eller dışarıda)
const measures = {
  grid: { min: MIN, cell: CELL, dims: DIMS, range: RANGE, data: bytes.toString('base64') },
  body: slices(0.48, 1.22, 0.02, lower), // kalça, bel ve iki bacak birlikte
  legRight: slices(0.38, 0.56, 0.02, (p) => lower(p) && X(p) > 0),
  legLeft: slices(0.38, 0.56, 0.02, (p) => lower(p) && X(p) < 0),
  head: slices(1.7, 1.81, 0.01, (p) => Math.abs(X(p)) < 0.15),
};

let height = 0;
for (let p = 0; p < count; p++) height = Math.max(height, points[p * 3 + 1]);
const header = `// Mankenden alınan ölçüler. tools/olcu_al.mjs üretir; elle düzenleme.\n// Kaynak: ${parts.length} parça, ${count} yüzey noktası, boy ${height.toFixed(3)} m.\n`;
writeFileSync(output, `${header}export default ${JSON.stringify(measures)};\n`);
console.log(`parçalar: ${[...new Set(parts.map((p) => p.name))].join(', ')}`);
console.log(`noktalar: ${count}, boy: ${height.toFixed(3)} m`);
console.log(`ızgara: ${DIMS.join('×')} düğüm, içeride ${inside} (${((inside * CELL ** 3) * 1000).toFixed(1)} litre)`);
console.log(`yazıldı: ${output} (${(Buffer.byteLength(JSON.stringify(measures)) / 1024).toFixed(0)} KB)`);
