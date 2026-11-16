// Manken GLB'sinin başından yüz bölgesini (sakal ve bıyığın oturacağı yüzey) çıkarır ve
// src/manken_yuz.js'e yazar: kaynaştırılmış köşeler, köşe normalleri ve üçgenler.
//   kullanım: node tools/yuz_al.mjs <manken.glb> [baş düğümünün adı]
import { readFileSync, writeFileSync } from 'node:fs';

const [, , input, nodeName = 'SuperHero_Male'] = process.argv;
if (!input) throw new Error('kullanım: node tools/yuz_al.mjs <manken.glb> [baş düğümünün adı]');
const file = readFileSync(input);
const jsonLength = file.readUInt32LE(12);
const gltf = JSON.parse(file.subarray(20, 20 + jsonLength).toString('utf8'));
const bin = file.subarray(20 + jsonLength + 8);
const dv = new DataView(bin.buffer, bin.byteOffset);
function accessor(index) {
  const a = gltf.accessors[index];
  const view = gltf.bufferViews[a.bufferView];
  const [read, size] = { 5121: ['getUint8', 1], 5123: ['getUint16', 2], 5125: ['getUint32', 4], 5126: ['getFloat32', 4] }[a.componentType];
  const n = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
  const stride = view.byteStride || size * n;
  const start = (view.byteOffset || 0) + (a.byteOffset || 0);
  const out = new Float64Array(a.count * n);
  for (let i = 0; i < a.count; i++) for (let c = 0; c < n; c++) out[i * n + c] = dv[read](start + i * stride + c * size, true);
  return out;
}
const node = gltf.nodes.find((n) => n.name === nodeName);
if (!node) throw new Error(`"${nodeName}" düğümü yok`);
const prim = gltf.meshes[node.mesh].primitives[0];
const P = accessor(prim.attributes.POSITION), I = accessor(prim.indices);

// Aynı konumdaki köşeleri kaynaştır (doku dikişleri köşeleri ikiye böler)
const ids = new Map();
const positions = [];
const remap = [];
for (let v = 0; v < P.length; v += 3) {
  const key = [0, 1, 2].map((c) => Math.round(P[v + c] * 1e5)).join(',');
  if (!ids.has(key)) {
    ids.set(key, positions.length / 3);
    positions.push(P[v], P[v + 1], P[v + 2]);
  }
  remap.push(ids.get(key));
}
// Alan ağırlıklı köşe normalleri (bütün baş üzerinden)
const normals = new Float64Array(positions.length);
const tris = [];
for (let t = 0; t < I.length; t += 3) {
  const [a, b, c] = [remap[I[t]], remap[I[t + 1]], remap[I[t + 2]]];
  if (a === b || b === c || a === c) continue;
  const p = (i, k) => positions[i * 3 + k];
  const u = [0, 1, 2].map((k) => p(b, k) - p(a, k)), w = [0, 1, 2].map((k) => p(c, k) - p(a, k));
  const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
  for (const i of [a, b, c]) for (let k = 0; k < 3; k++) normals[i * 3 + k] += n[k];
  tris.push([a, b, c]);
}
// Yüz bölgesi: çene altından şakağa, kulağın biraz arkasından öne
const inFace = (i) => positions[i * 3 + 1] > 1.54 && positions[i * 3 + 1] < 1.725 && positions[i * 3 + 2] > -0.03;
const keep = new Map();
const out = { positions: [], normals: [], indices: [] };
for (const tri of tris) {
  if (!tri.every(inFace)) continue;
  for (const i of tri) {
    if (!keep.has(i)) {
      keep.set(i, out.positions.length / 3);
      const l = Math.hypot(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]) || 1;
      for (let k = 0; k < 3; k++) {
        out.positions.push(Math.round(positions[i * 3 + k] * 1e5) / 1e5);
        out.normals.push(Math.round((normals[i * 3 + k] / l) * 1e4) / 1e4);
      }
    }
    out.indices.push(keep.get(i));
  }
}
const target = new URL('../src/manken_yuz.js', import.meta.url).pathname;
writeFileSync(target, `// Mankenin yüz yüzeyi (sakal için). tools/yuz_al.mjs üretir; elle düzenleme.\nexport default ${JSON.stringify(out)};\n`);
console.log(`yüz: ${out.positions.length / 3} köşe, ${out.indices.length / 3} üçgen → ${target}`);
