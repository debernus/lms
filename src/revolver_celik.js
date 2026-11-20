import * as THREE from 'three';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvasTexture } from './halk2.js';

// Modern paslanmaz çelik toplu tabanca: tam alt kızaklı 6 inç (15 cm) yuvarlak namlu, altı oluklu top,
// yuvarlak hatlı gövde ve tetik korkuluğu, parmak oluklu siyah kauçuk kabza, ayarlı gez, rampalı arpacık.
// 1 birim = 1 metre, Y yukarı, namlu +Z'ye bakar, en alt nokta y = 0, boyca ortalanmış.
// Parçalar: revolver_govde, revolver_namlu, revolver_top, revolver_horoz, revolver_tetik, revolver_kabza,
// revolver_nisangah, revolver_siyah_parcalar.

const TAU = Math.PI * 2;
const BY = 0.0125; // namlu ekseni (top ekseni y = 0)
const lerp = (a, b, t) => a + (b - a) * t;
const S = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// Kapalı çizgiyi yumuşatır
const smooth = (points, n = 140) => new THREE.CatmullRomCurve3(points.map(([a, b]) => new THREE.Vector3(a, b, 0)), true, 'catmullrom', 0.5).getPoints(n).slice(0, -1).map((p) => [p.x, p.y]);
function shapeOf(points, holes = []) {
  const s = new THREE.Shape();
  points.forEach(([a, b], i) => (i ? s.lineTo(a, b) : s.moveTo(a, b)));
  s.closePath();
  for (const hole of holes) {
    const h = new THREE.Path();
    hole.forEach(([a, b], i) => (i ? h.lineTo(a, b) : h.moveTo(a, b)));
    h.closePath();
    s.holes.push(h);
  }
  return s;
}
const crease = (g) => toCreasedNormals(g, 0.7);
// Yan görünüşten (z, y) kalınlığı t olan, kenarları yuvarlatılmış parça; X boyunca ortalı
function plate(points, t, bevel, holes = []) {
  const g = new THREE.ExtrudeGeometry(shapeOf(points, holes), { depth: t - 2 * bevel, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 1 });
  g.translate(0, 0, -(t - 2 * bevel) / 2);
  g.rotateY(-Math.PI / 2);
  return crease(g);
}
// Kesiti (x, y) olan, Z boyunca uzanan parça
function bar(points, z0, z1, bevel = 0, holes = []) {
  const g = new THREE.ExtrudeGeometry(shapeOf(points, holes), { depth: z1 - z0 - 2 * bevel, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: 1 });
  g.translate(0, 0, z0 + bevel);
  return crease(g);
}
const box = (x, y, z, cy, cz, cx = 0) => new THREE.BoxGeometry(x, y, z).toNonIndexed().translate(cx, cy, cz);
function merge(list) {
  const pos = [], nor = [], uv = [], idx = [];
  let base = 0;
  for (const g of list) {
    const index = g.index ? g.index.array : Array.from({ length: g.attributes.position.count }, (_, i) => i);
    for (const v of g.attributes.position.array) pos.push(v);
    for (const v of g.attributes.normal.array) nor.push(v);
    for (const v of g.attributes.uv.array) uv.push(v);
    for (const i of index) idx.push(i + base);
    base += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx);
  return out;
}
const circle = (cx, cy, r, n = 16) => Array.from({ length: n }, (_, k) => [cx + Math.cos((k / n) * TAU) * r, cy + Math.sin((k / n) * TAU) * r]);

export function createRevolverCelik() {
  const root = new THREE.Group();
  root.name = 'revolver_celik';
  // Mat paslanmaz çelik: ince fırça izleri
  const steelMap = canvasTexture('mat_paslanmaz', 256, 256, (g) => {
    let seed = 5;
    const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    g.fillStyle = '#7b7f85';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(${rand() < 0.5 ? '255,255,255' : '60,64,70'},${0.03 + rand() * 0.06})`;
      g.fillRect(rand() * 256, rand() * 256, 30 + rand() * 120, 1);
    }
  });
  const steel = new THREE.MeshStandardMaterial({ name: 'mat_paslanmaz', map: steelMap, roughness: 0.48, metalness: 0.5 });
  const black = new THREE.MeshStandardMaterial({ name: 'siyah_celik', color: 0x17181a, roughness: 0.5, metalness: 0.45 });
  const rubber = new THREE.MeshStandardMaterial({ name: 'siyah_kaucuk', color: 0x101011, roughness: 0.92, metalness: 0 });
  const hole = new THREE.MeshStandardMaterial({ name: 'delik', color: 0x030303, roughness: 1 });
  const add = (name, geometry, material) => {
    const m = new THREE.Mesh(geometry, material);
    m.name = name;
    m.castShadow = m.receiveShadow = true;
    root.add(m);
  };

  // ---------- Gövde: tek parça yan çizgi; top penceresi ve tetik korkuluğu gerçek boşluk ----------
  const outer = smooth([[0.058, 0.031], [0.02, 0.0315], [-0.012, 0.031], [-0.026, 0.026], [-0.036, 0.014], [-0.041, 0], [-0.046, -0.02], [-0.055, -0.05], [-0.062, -0.08], [-0.05, -0.085], [-0.04, -0.06], [-0.03, -0.04], [-0.024, -0.033], [-0.019, -0.045], [-0.009, -0.062], [0.01, -0.07], [0.03, -0.066], [0.043, -0.052], [0.047, -0.036], [0.052, -0.028], [0.058, -0.022], [0.059, 0]], 160);
  const windowHole = [[-0.0008, -0.0205], [0.0432, -0.0205], [0.0432, 0.0205], [-0.0008, 0.0205]];
  const guardHole = Array.from({ length: 32 }, (_, k) => {
    const a = (k / 32) * TAU, c = Math.cos(a), s = Math.sin(a);
    return [0.012 + Math.sign(c) * Math.abs(c) ** 0.8 * 0.027, Math.min(-0.0315, -0.047 + Math.sign(s) * Math.abs(s) ** 0.8 * 0.0175)];
  });
  add('revolver_govde', merge([
    plate(outer, 0.0168, 0.0032, [windowHole, guardHole]),
    box(0.0105, 0.0026, 0.058, 0.0325, 0.03), // üst köprüde işlenmiş düz bant
    new THREE.CylinderGeometry(0.0196, 0.0196, 0.004, 28).toNonIndexed().rotateX(Math.PI / 2).translate(0, 0, -0.0025), // geri tepme kalkanı
  ]), steel);

  // ---------- Namlu: yuvarlak namlu ve tam boy alt kızak tek kesit ----------
  const R1 = 0.0105, R2 = 0.0078, DROP = 0.0155, phi = Math.asin((R1 - R2) / DROP), section = [];
  for (let k = 0; k <= 20; k++) {
    const a = -phi + ((Math.PI + 2 * phi) * k) / 20;
    section.push([Math.cos(a) * R1, BY + Math.sin(a) * R1]);
  }
  for (let k = 0; k <= 12; k++) {
    const a = Math.PI + phi + ((Math.PI - 2 * phi) * k) / 12;
    section.push([Math.cos(a) * R2, BY - DROP + Math.sin(a) * R2]);
  }
  const Z0 = 0.058, Z1 = 0.21;
  add('revolver_namlu', merge([
    bar(section, Z0 - 0.002, Z1, 0.0014, [circle(0, BY, 0.0048, 14)]),
    bar(circle(0, BY, R1 + 0.0012, 28), Z0 - 0.004, Z0 + 0.012, 0.0008), // namlu dibindeki bilezik
  ]), steel);

  // ---------- Top: altı oluk; arkası düz, önü pahlı ----------
  const scallop = Array.from({ length: 96 }, (_, k) => {
    const a = (k / 96) * TAU, r = 0.0192 - 0.0042 * Math.max(0, Math.cos(6 * a)) ** 5;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
  const chambers = Array.from({ length: 6 }, (_, k) => circle(Math.cos((k / 6) * TAU + Math.PI / 2) * 0.0122, Math.sin((k / 6) * TAU + Math.PI / 2) * 0.0122, 0.0049, 12));
  add('revolver_top', merge([
    bar(scallop, 0.014, 0.0422, 0.0012, chambers),
    bar(circle(0, 0, 0.0192, 48), 0.0004, 0.0152, 0.0008),
  ]), steel);

  // ---------- Siyah parçalar: top kolu (yoke), çıkarıcı çubuk ve yuvası, top mandalı, delik dipleri ----------
  const dark = [
    plate(smooth([[0.0445, -0.009], [0.0575, -0.009], [0.058, -0.02], [0.052, -0.0245], [0.0445, -0.0205]], 40), 0.0172, 0.0028),
    new THREE.CylinderGeometry(0.0024, 0.0024, 0.07, 8).toNonIndexed().rotateX(Math.PI / 2).translate(0, BY - DROP, 0.1),
    box(0.0164, 0.0044, 0.06, BY - DROP, 0.1), // kızaktaki çubuk yuvası (iki yanda koyu oluk)
    plate(smooth([[-0.011, 0.005], [-0.018, 0.008], [-0.023, 0.004], [-0.018, 0]], 24), 0.003, 0.001).translate(0.0088, 0, 0), // top mandalı (sol yan)
  ];
  add('revolver_siyah_parcalar', merge(dark), black);
  add('revolver_delikler', merge([
    new THREE.CircleGeometry(0.0047, 14).toNonIndexed().translate(0, BY, Z1 - 0.012), // namlu içi
    new THREE.CircleGeometry(0.018, 24).toNonIndexed().translate(0, 0, 0.03), // göz dipleri
  ]), hole);

  // ---------- Nişangâh: ayarlı gez, rampalı arpacık ----------
  add('revolver_nisangah', merge([
    box(0.012, 0.0045, 0.03, 0.0355, -0.006),
    box(0.0048, 0.0052, 0.004, 0.0398, -0.019, 0.0046),
    box(0.0048, 0.0052, 0.004, 0.0398, -0.019, -0.0046),
    box(0.014, 0.0028, 0.004, 0.0358, -0.019),
    plate([[Z1 - 0.004, BY + R1 - 0.0008], [Z1 - 0.034, BY + R1 - 0.0008], [Z1 - 0.012, BY + R1 + 0.0105], [Z1 - 0.004, BY + R1 + 0.0105]], 0.0034, 0.0006),
  ]), black);

  // ---------- Horoz ve tetik ----------
  add('revolver_horoz', plate(smooth([[-0.019, 0.02], [-0.013, 0.033], [-0.02, 0.04], [-0.034, 0.047], [-0.045, 0.046], [-0.046, 0.04], [-0.036, 0.036], [-0.034, 0.02]], 48), 0.0085, 0.0018), black);
  add('revolver_tetik', plate(smooth([[0.003, -0.03], [0.014, -0.03], [0.0125, -0.042], [0.0165, -0.056], [0.0125, -0.0585], [0.0055, -0.046]], 40), 0.0072, 0.002), black);

  // ---------- Kabza: parmak oluklu kauçuk; kesitler eğik bir eksen boyunca dizilir ----------
  const A = [-0.04, -0.018], B = [-0.07, -0.128], len = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const d = [(B[0] - A[0]) / len, (B[1] - A[1]) / len], u = [-d[1], d[0]]; // u: öne bakan dik yön
  const ROWS = 30, RING = 28, pos = [], idx = [], uv = [];
  for (let j = 0; j <= ROWS; j++) {
    const t = j / ROWS, c = [lerp(A[0], B[0], t) - 0.006 * Math.sin(Math.PI * t), lerp(A[1], B[1], t)];
    const close = Math.min(1, Math.sin(Math.PI * Math.min(1, t * 14) / 2), Math.sin(Math.PI * Math.min(1, (1 - t) * 10) / 2) * 0.35 + 0.65); // üstte kapanır, dipte hafif yuvarlanır
    const front = 0.0195 + 0.004 * Math.cos(t * 3.4 * TAU + 0.6) * S(0.12, 0.3, t) - 0.006 * S(0.2, 0, t), back = 0.018 + 0.008 * t ** 1.4 + 0.004 * Math.exp(-(((t - 0.12) / 0.12) ** 2));
    const half = 0.0158 + 0.0022 * Math.sin(Math.PI * t) + 0.001 * t;
    for (let k = 0; k < RING; k++) {
      const a = (k / RING) * TAU, co = Math.cos(a), si = Math.sin(a), ru = (co > 0 ? front : back) * close;
      const e = Math.sign(co) * Math.abs(co) ** 0.85, w = Math.sign(si) * Math.abs(si) ** 0.8; // köşeleri dolgun kesit
      pos.push(w * half * close, c[1] + u[1] * e * ru, c[0] + u[0] * e * ru);
      uv.push(k / RING, t);
    }
  }
  for (let j = 0; j < ROWS; j++) for (let k = 0; k < RING; k++) {
    const a = j * RING + k, b = j * RING + ((k + 1) % RING), c = a + RING, e = b + RING;
    idx.push(a, c, e, a, e, b);
  }
  const capTop = pos.length / 3;
  pos.push(0, A[1], A[0]);
  uv.push(0.5, 0);
  const capBottom = capTop + 1;
  pos.push(0, B[1] - 0.001, B[0] - 0.0005);
  uv.push(0.5, 1);
  for (let k = 0; k < RING; k++) {
    idx.push(capTop, k, (k + 1) % RING);
    idx.push(capBottom, ROWS * RING + ((k + 1) % RING), ROWS * RING + k);
  }
  const grip = new THREE.BufferGeometry();
  grip.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  grip.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  grip.setIndex(idx);
  grip.computeVertexNormals();
  // Yüzlerin dışa baktığından emin ol
  grip.computeBoundingBox();
  const centre = grip.boundingBox.getCenter(new THREE.Vector3()), n = grip.attributes.normal, p = grip.attributes.position;
  let vote = 0;
  for (let i = 0; i < p.count; i += 7) vote += n.getX(i) * (p.getX(i) - centre.x) + n.getY(i) * (p.getY(i) - centre.y) + n.getZ(i) * (p.getZ(i) - centre.z);
  if (vote < 0) {
    for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
    grip.setIndex(idx);
    grip.computeVertexNormals();
  }
  add('revolver_kabza', grip, rubber);

  // Boyca ortala, en alt noktayı y = 0'a getir
  const bounds = new THREE.Box3().setFromObject(root), dz = -(bounds.min.z + bounds.max.z) / 2;
  root.traverse((o) => {
    if (o.isMesh) o.geometry.translate(0, -bounds.min.y, dz);
  });
  return root;
}
