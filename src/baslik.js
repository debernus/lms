import * as THREE from 'three';
import M from './manken_olcu.js';
import { Surface, cloth, awayFromAxis, headRadius, S, clamp, TAU } from './outfit.js';
import { seeded } from './paint.js';

// Efe başlığı; manken_erkek.glb'nin başına oturur (ölçüler manken_olcu.js'ten). Fotoğraftaki gibi:
// başa çapraz sarılmış dolgun bez, sol üstte düğüm ve düğümden yukarı çıkan uç, sağ yanda saçaklı
// uç. Mankenle aynı konum: 1 birim = 1 metre, Y yukarı, yüz +Z'ye bakar; mankenin sağı -X, solu +X.
// Yalnız dış yüzeyler; doku yok.

const HEAD = M.head;
const TOP = HEAD.y0 + HEAD.dy * (HEAD.radii.length - 1);
const head = (y, a) => (y > TOP + 0.002 ? 0 : headRadius(y, a));
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

const WRAP = { front: 1.757, side: 1.735, back: 1.69, apex: 1.835 };
function rim(angle) {
  const s = Math.sin(angle); // +1 ön, -1 arka
  if (s >= 0) return WRAP.side + (WRAP.front - WRAP.side) * S(0.2, 0.9, s);
  return WRAP.side + (WRAP.back - WRAP.side) * S(0.55, 1.0, -s); // kulağın arkasına kadar düz, sonra enseye iner
}
// Sargının yüzeyi: angle yönünde, kenardan (v = 0) tepeye (v = 1). Bez başın 1–3 cm dışında dolgun
// bir kubbe yapar; üstünde sağ alttan sol üste dönen geniş, yumuşak kat sırtları vardır.
function wrapPoint(angle, v) {
  const y0 = rim(angle);
  const y = y0 + (WRAP.apex - y0) * Math.sin((v * Math.PI) / 2) ** 0.9;
  const dome = (head(y0, angle) + 0.016) * Math.cos((v * Math.PI) / 2) ** 0.55;
  const folds = (0.5 + 0.5 * Math.cos(TAU * (2.4 * v + 0.6 * Math.sin(angle - 0.6)))) ** 1.6; // sırtlar dar, aralar geniş
  const roll = 0.006 * (1 - S(0, 0.15, v)); // kenarda kıvrılıp kalınlaşan bez
  const r = Math.max(dome, head(y, angle) + 0.008) + 0.012 * folds * Math.sin(Math.PI * clamp(v, 0, 1)) ** 0.5 + roll;
  return v3(HEAD.cx + Math.cos(angle) * r, y, HEAD.cz + Math.sin(angle) * r);
}

// Yol boyunca üç yüzlü ince tel (saçak).
function strand(s, path, radius) {
  let before = null;
  path.forEach((p, n) => {
    const dir = path[Math.min(n + 1, path.length - 1)].clone().sub(path[Math.max(n - 1, 0)]).normalize();
    const u = v3(0, 0, 1).addScaledVector(dir, -dir.z).normalize();
    const w = dir.clone().cross(u);
    const ring = [0, 1, 2].map((k) => {
      const q = p.clone().addScaledVector(u, Math.cos((k / 3) * TAU) * radius).addScaledVector(w, Math.sin((k / 3) * TAU) * radius);
      return s.point(q.x, q.y, q.z);
    });
    if (before) s.strip(before, ring, true, (x, y, z) => [x - p.x, y - p.y, z - p.z]);
    before = ring;
  });
}

export function createEfeTakke() {
  const s = new Surface();
  const add = (p) => s.point(p.x, p.y, p.z);
  const outward = awayFromAxis(HEAD.cx, HEAD.cz);

  // --- Sargı ---
  const SEG = 40;
  let previous = null;
  for (const v of [0, 0.06, 0.13, 0.21, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.97]) {
    const ring = Array.from({ length: SEG }, (_, k) => add(wrapPoint((k / SEG) * TAU, v)));
    if (previous) s.strip(previous, ring, true, outward);
    previous = ring;
  }
  s.fan(add(v3(HEAD.cx, WRAP.apex, HEAD.cz)), previous, () => [0, 1, 0]);

  // --- Düğüm: sol üstte (+X, hafif önde), bezin iki ucunun bağlandığı yumru ---
  const KNOT = { angle: 0.5, v: 0.6 };
  const anchor = wrapPoint(KNOT.angle, KNOT.v);
  const away = v3(anchor.x - HEAD.cx, 0.35 * 0.1, anchor.z - HEAD.cz).normalize();
  const knot = anchor.clone().addScaledVector(away, 0.016); // yumru sargının dışında kalır, başa yaklaşmaz
  const rings = [];
  for (let j = 1; j < 5; j++) {
    const lat = (j / 5) * Math.PI;
    rings.push(Array.from({ length: 8 }, (_, k) => {
      const lon = (k / 8) * TAU;
      return add(knot.clone().add(v3(Math.sin(lat) * Math.cos(lon) * 0.018, Math.cos(lat) * 0.015, Math.sin(lat) * Math.sin(lon) * 0.018)));
    }));
  }
  const fromKnot = (x, y, z) => [x - knot.x, y - knot.y, z - knot.z];
  s.fan(add(knot.clone().add(v3(0, 0.015, 0))), rings[0], fromKnot);
  for (let j = 1; j < rings.length; j++) s.strip(rings[j - 1], rings[j], true, fromKnot);
  s.fan(add(knot.clone().add(v3(0, -0.015, 0))), rings[rings.length - 1], fromKnot);

  // Düğümden yukarı ve dışa çıkan uç: sivri, hafif kıvrık bir bez kulağı; yanında daha kısa ikincisi
  const ear = (length, width, lean, turn) => {
    const side = v3(-Math.sin(KNOT.angle + turn), 0, Math.cos(KNOT.angle + turn));
    let before = null;
    for (const t of [0, 0.35, 0.7, 1]) {
      const c = knot.clone().add(v3(0, 0.008 + length * t, 0)).addScaledVector(away, lean * t * t + 0.004);
      const w = width * (1 - 0.8 * t ** 1.5);
      const row = [-1, 0, 1].map((e) => add(c.clone().addScaledVector(side, e * w).addScaledVector(away, -0.004 * Math.abs(e))));
      if (before) s.strip(before, row, false, () => away.toArray());
      before = row;
    }
  };
  ear(0.048, 0.024, 0.03, 0);
  ear(0.03, 0.02, 0.04, 1.1);

  // --- Saçaklı uç: sağ yanda (-X), sargının altından çıkıp kulağın önünde aşağı sarkar ---
  const rand = seeded(1900);
  const range = (a, b) => a + rand() * (b - a);
  const TAIL = { angle: Math.PI - 0.2, half: 0.26, cloth: 0.04, fringe: 0.06 };
  const tailPoint = (a, drop, lift) => {
    const y = rim(a) + 0.012 - drop;
    // Aşağıda kulak başın en geniş yeridir: saçak onun dışında kalır
    let r = 0;
    for (let yy = Math.max(y, HEAD.y0); yy <= rim(a) + 0.012; yy += 0.01) r = Math.max(r, head(yy, a));
    return v3(HEAD.cx + Math.cos(a) * (r + lift), y, HEAD.cz + Math.sin(a) * (r + lift));
  };
  let above = null;
  const COLS = 4;
  for (const drop of [0, 0.02, TAIL.cloth]) {
    const row = Array.from({ length: COLS + 1 }, (_, c) => add(tailPoint(TAIL.angle + TAIL.half * ((2 * c) / COLS - 1), drop, 0.016 + 0.003 * Math.sin(c * 2.3))));
    if (above) s.strip(above, row, false, outward);
    above = row;
  }
  const fringe = new Surface();
  for (let i = 0; i < 12; i++) {
    const a = TAIL.angle + TAIL.half * ((2 * i) / 11 - 1) * 0.95;
    const length = TAIL.fringe + range(-0.012, 0.006);
    const sway = range(-0.03, 0.03);
    strand(fringe, [0, 0.35, 0.7, 1].map((t) => tailPoint(a + sway * t, TAIL.cloth - 0.003 + length * t, 0.017 + 0.004 * t)), 0.0013);
  }

  const base = s.positions.length / 3;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([...s.positions, ...fringe.positions], 3));
  geometry.setIndex([...s.indices, ...fringe.indices.map((i) => i + base)]);
  geometry.addGroup(0, s.indices.length, 0);
  geometry.addGroup(s.indices.length, fringe.indices.length, 1);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, [cloth('takke_bez', 0x2b3038), cloth('takke_sacak', 0x3b4149)]);
  mesh.name = 'takke';
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
