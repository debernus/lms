import * as THREE from 'three';
import { canvasTexture } from './halk2.js';
import { Part } from './arapcami.js';

// Cephe siperi kiti (1915): kütük kaplamalı, harap toprak siper. Her parça 3 × 3 m'lik bir hücredir; 3 m'lik
// ızgarada 90°'lik dönüşlerle birleştirilir. 1 birim = 1 metre, Y yukarı. ARAZİ DÜZEYİ y = 0'dadır; siper
// tabanı y = -2'dedir (parça araziye gömülür). Siperin iç genişliği 1,4 m.
// Parçalar (yerel yönler): siper_duz, siper_duz_yikik, siper_duz_cokmus → eksen Z boyunca;
// siper_kose → giriş -Z, çıkış +X; siper_kavsak → eksen Z boyunca, kol +X; siper_uc → açık ağız -Z.
// Her parça: toprak (zemin, yan yüzler, siper üstü kenarı), yatay kütükler, dikmeler, döküntü.
// Tek parça örnek: createSiperHatti().

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;
const CELL = 3, HALF = 1.5, STEP = 0.3, N = 10, DEPTH = 2.0, WALL = 0.7, BACK = 0.9;

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
let MATS = null;
function mats() {
  if (MATS) return MATS;
  const std = (name, o) => new THREE.MeshStandardMaterial({ name, roughness: 0.97, metalness: 0, ...o });
  const bark = canvasTexture('kutuk_kabugu', 128, 256, (g) => {
    const rand = rng(3);
    g.fillStyle = '#4a4640';
    g.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 260; i++) {
      const v = 40 + rand() * 60;
      g.fillStyle = `rgba(${v},${v - 3},${v - 8},${0.25 + rand() * 0.4})`;
      g.fillRect(rand() * 128, rand() * 256, 2 + rand() * 5, 10 + rand() * 60);
    }
    for (let i = 0; i < 26; i++) {
      g.fillStyle = `rgba(${rand() < 0.5 ? '18,16,14' : '120,116,104'},${0.3 + rand() * 0.3})`;
      g.beginPath();
      g.ellipse(rand() * 128, rand() * 256, 3 + rand() * 9, 2 + rand() * 6, rand() * 3, 0, TAU);
      g.fill();
    }
  });
  const earth = canvasTexture('toprak', 256, 256, (g) => {
    const rand = rng(11);
    g.fillStyle = '#3a3026';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1500; i++) {
      const v = 30 + rand() * 50;
      g.fillStyle = `rgba(${v + 16},${v + 4},${v - 8},${0.3 + rand() * 0.4})`;
      g.beginPath();
      g.ellipse(rand() * 256, rand() * 256, 1 + rand() * 6, 1 + rand() * 4, rand() * 3, 0, TAU);
      g.fill();
    }
  });
  const leaves = canvasTexture('kuru_yaprak', 512, 512, (g) => {
    const rand = rng(27);
    g.fillStyle = '#3a2c20';
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 900; i++) {
      const x = rand() * 512, y = rand() * 512, r = 10 + rand() * 20, a = rand() * TAU, v = 70 + rand() * 70;
      g.save();
      g.translate(x, y);
      g.rotate(a);
      g.fillStyle = `rgb(${v * 0.82},${v * 0.6},${v * 0.4})`;
      g.beginPath();
      for (let k = 0; k < 10; k++) {
        const t = (k / 10) * TAU, rr = r * (k % 2 ? 0.55 : 1) * (0.8 + 0.4 * Math.abs(Math.cos(t)));
        g.lineTo(Math.cos(t) * rr, Math.sin(t) * rr * 0.7);
      }
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(50,30,16,0.6)';
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(-r, 0);
      g.lineTo(r, 0);
      g.stroke();
      g.restore();
    }
  });
  MATS = {
    kabuk: std('kutuk_kabugu', { map: bark }),
    kesik: std('kutuk_kesigi', { color: 0x6e5a40 }),
    toprak: std('toprak', { map: earth }),
    yaprak: std('kuru_yaprak', { map: leaves }),
  };
  return MATS;
}

// Kütük: p0 → p1, 6 kenarlı, uçları kesik
function log(part, p0, p1, r0, r1 = r0) {
  const dir = p1.clone().sub(p0);
  const len = dir.length();
  if (len < 0.05) return;
  dir.normalize();
  const u = (Math.abs(dir.y) < 0.9 ? v3(0, 1, 0) : v3(1, 0, 0)).cross(dir).normalize(), w = dir.clone().cross(u), n = 6;
  const at = (p, r, k) => p.clone().addScaledVector(u, Math.cos((k / n) * TAU) * r).addScaledVector(w, Math.sin((k / n) * TAU) * r);
  for (let k = 0; k < n; k++) {
    const mid = u.clone().multiplyScalar(Math.cos(((k + 0.5) / n) * TAU)).addScaledVector(w, Math.sin(((k + 0.5) / n) * TAU));
    part.quad('kabuk', [at(p0, r0, k), at(p0, r0, k + 1), at(p1, r1, k + 1), at(p1, r1, k)], [[k / n, 0], [(k + 1) / n, 0], [(k + 1) / n, len / 1.5], [k / n, len / 1.5]], mid);
    part.tri('kesik', [p0, at(p0, r0, k), at(p0, r0, k + 1)], [[0.5, 0.5], [0, 0], [1, 0]], dir.clone().negate());
    part.tri('kesik', [p1, at(p1, r1, k), at(p1, r1, k + 1)], [[0.5, 0.5], [0, 0], [1, 0]], dir);
  }
}

// Parça tanımları: inside(x, z) siper boşluğu (duvar arkasına kadar); runs: kütük duvarları [a, b, içe bakan normal]
const SHAPES = {
  duz: { inside: (x) => Math.abs(x) < BACK, runs: [[[-WALL, -HALF], [-WALL, HALF], [1, 0]], [[WALL, -HALF], [WALL, HALF], [-1, 0]]] },
  kose: {
    inside: (x, z) => (Math.abs(x) < BACK && z < BACK) || (Math.abs(z) < BACK && x > -BACK),
    runs: [[[-WALL, -HALF], [-WALL, WALL], [1, 0]], [[-WALL, WALL], [HALF, WALL], [0, -1]], [[WALL, -HALF], [WALL, -WALL], [-1, 0]], [[WALL, -WALL], [HALF, -WALL], [0, 1]]],
  },
  kavsak: {
    inside: (x, z) => Math.abs(x) < BACK || (Math.abs(z) < BACK && x > 0),
    runs: [[[-WALL, -HALF], [-WALL, HALF], [1, 0]], [[WALL, -HALF], [WALL, -WALL], [-1, 0]], [[WALL, WALL], [WALL, HALF], [-1, 0]], [[WALL, WALL], [HALF, WALL], [0, -1]], [[WALL, -WALL], [HALF, -WALL], [0, 1]]],
  },
  uc: {
    inside: (x, z) => Math.abs(x) < BACK && z < BACK,
    runs: [[[-WALL, -HALF], [-WALL, WALL], [1, 0]], [[WALL, -HALF], [WALL, WALL], [-1, 0]], [[-WALL, WALL], [WALL, WALL], [0, -1]]],
  },
};
// ad → [biçim, hasar (0–1), bir duvarın çökme payı]
const PARTS = {
  siper_duz: ['duz', 0.3, 0],
  siper_duz_yikik: ['duz', 0.65, 0],
  siper_duz_cokmus: ['duz', 0.55, 1],
  siper_kose: ['kose', 0.4, 0],
  siper_kavsak: ['kavsak', 0.45, 0],
  siper_uc: ['uc', 0.5, 0],
};
export const SIPER_PARCALARI = Object.keys(PARTS);

export function createSiperParca(name, seed = 1) {
  const [shapeName, dmg, collapse] = PARTS[name], shape = SHAPES[shapeName], rand = rng(seed * 7919 + name.length * 131);
  const range = (a, b) => a + rand() * (b - a);
  const root = new THREE.Group();
  root.name = name;
  const earth = new Part('toprak'), logs = new Part('kutukler'), posts = new Part('dikmeler'), debris = new Part('dokuntu');

  // ---------- Toprak: zemin (yapraklı), yan yüzler, siper üstü kenarı ----------
  const node = (i) => -HALF + i * STEP, inCell = (i, k) => shape.inside(node(i) + STEP / 2, node(k) + STEP / 2);
  const dist = (x, z) => {
    let d = 9;
    for (let i = 0; i < N; i++) for (let k = 0; k < N; k++) if (inCell(i, k)) {
      const dx = Math.max(node(i) - x, 0, x - node(i + 1)), dz = Math.max(node(k) - z, 0, z - node(k + 1));
      d = Math.min(d, Math.hypot(dx, dz));
    }
    return d;
  };
  const noise = Array.from({ length: (N + 1) * (N + 1) }, () => rand());
  const edge = (i, k) => (i === 0 || i === N || k === 0 || k === N ? 0 : 1); // parça sınırında yükseklik sabit: komşularla birleşir
  const floorY = (i, k) => (noise[i * (N + 1) + k] - 0.5) * 0.14 * edge(i, k);
  const groundY = (i, k) => {
    const d = dist(node(i), node(k)), bump = Math.sin(Math.PI * Math.min(1, d / 0.6));
    return DEPTH + bump * (0.2 + (noise[i * (N + 1) + k] - 0.5) * 0.22 * edge(i, k)) - (d < 0.01 ? dmg * 0.25 * noise[i * (N + 1) + k] * edge(i, k) : 0);
  };
  for (let i = 0; i < N; i++) for (let k = 0; k < N; k++) {
    const inside = inCell(i, k), y = inside ? floorY : groundY;
    const c = [[i, k], [i + 1, k], [i + 1, k + 1], [i, k + 1]].map(([a, b]) => v3(node(a), y(a, b), node(b)));
    earth.quad(inside ? 'yaprak' : 'toprak', c, c.map((p) => [p.x / (inside ? 1.6 : 1.2), p.z / (inside ? 1.6 : 1.2)]), v3(0, 1, 0));
    if (!inside) continue;
    // Siper boşluğunun kenarında dik toprak yüzü
    for (const [di, dk, a, b] of [[1, 0, [i + 1, k], [i + 1, k + 1]], [-1, 0, [i, k], [i, k + 1]], [0, 1, [i, k + 1], [i + 1, k + 1]], [0, -1, [i, k], [i + 1, k]]]) {
      const ni = i + di, nk = k + dk;
      if (ni < 0 || ni >= N || nk < 0 || nk >= N || inCell(ni, nk)) continue;
      const pa = v3(node(a[0]), 0, node(a[1])), pb = v3(node(b[0]), 0, node(b[1])), ya = groundY(a[0], a[1]), yb = groundY(b[0], b[1]);
      const along = (p) => (di ? p.z : p.x) / 1.2;
      earth.quad('toprak', [pa.clone().setY(-0.1), pb.clone().setY(-0.1), pb.clone().setY(yb), pa.clone().setY(ya)], [[along(pa), 0], [along(pb), 0], [along(pb), yb / 1.2], [along(pa), ya / 1.2]], v3(-di, 0, -dk));
    }
  }

  // ---------- Kütük duvarlar: yatay kütükler, önlerinde dikmeler ----------
  const fallen = (p, n, len) => {
    // Yere düşmüş kütük: duvarın dibinden siperin içine doğru yatık
    const a = range(-0.9, 0.9), dir = v3(n[0], 0, n[1]).applyAxisAngle(v3(0, 1, 0), a + Math.PI / 2);
    const c = p.clone().addScaledVector(v3(n[0], 0, n[1]), range(0.25, 0.55)).setY(0.08);
    log(debris, c.clone().addScaledVector(dir, -len / 2), c.clone().addScaledVector(dir, len / 2).setY(range(0.08, 0.3)), range(0.06, 0.085));
  };
  shape.runs.forEach(([a, b, n], ri) => {
    const A = v3(a[0], 0, a[1]), B = v3(b[0], 0, b[1]), along = B.clone().sub(A), len = along.length(), inward = v3(n[0], 0, n[1]);
    along.normalize();
    const d = Math.min(0.95, dmg + (ri === 0 ? collapse * 0.4 : 0)), ROWS = 11;
    for (let r = 0; r < ROWS; r++) {
      const y = 0.09 + r * 0.18, high = r / ROWS, radius = range(0.075, 0.095);
      if (rand() < d * (0.25 + 0.75 * high)) {
        if (rand() < 0.4) fallen(A.clone().addScaledVector(along, range(0.2, len - 0.2)), n, Math.min(len, range(0.8, 1.8)));
        continue; // kütük yerinden çıkmış
      }
      let t0 = -0.03, t1 = len + 0.03, sag = 0;
      if (rand() < d * 0.7) {
        // Kırık: bir ucu eksik, kalan parça sarkmış
        if (rand() < 0.5) t0 = range(0.2, 0.6) * len;
        else t1 = range(0.4, 0.8) * len;
        sag = range(0.03, 0.22) * d;
      }
      const back = -0.1 + range(-0.02, 0.03), p0 = A.clone().addScaledVector(along, t0).addScaledVector(inward, back).setY(y + range(-0.02, 0.02));
      const p1 = A.clone().addScaledVector(along, t1).addScaledVector(inward, back + (sag ? range(0, 0.12) : 0)).setY(y + range(-0.02, 0.02) - sag);
      log(logs, p0, p1, radius, radius * range(0.8, 1));
    }
    const count = Math.max(1, Math.round(len / 1.0));
    for (let k = 0; k < count; k++) {
      const t = ((k + 0.5) / count) * len + range(-0.1, 0.1), base = A.clone().addScaledVector(along, t).addScaledVector(inward, 0.035), radius = range(0.06, 0.085);
      const roll = rand();
      if (roll < d * 0.22) {
        fallen(base, n, range(1.4, 2.0)); // dikme devrilmiş
        continue;
      }
      const lean = range(-1, 1) * 0.3 * d, tip = range(0.02, 0.5) * d, h = roll < d * 0.55 ? range(0.7, 1.4) : range(2.0, 2.3);
      log(posts, base.clone().setY(-0.15), base.clone().addScaledVector(along, lean * h).addScaledVector(inward, tip * h * 0.5).setY(h), radius * 1.05, radius * 0.85);
    }
    // Toprak akıntısı: duvarın boşalan yerinden içeri dökülmüş yığın
    const heaps = Math.round(d * 2 + (ri === 0 ? collapse * 2 : 0) + rand() - 0.5);
    for (let hI = 0; hI < heaps; hI++) {
      const c = A.clone().addScaledVector(along, range(0.3, len - 0.3)), top = range(0.7, 1.5) + (ri === 0 ? collapse * 0.4 : 0), reach = range(0.6, 1.05), wide = range(0.5, 0.9);
      const apex = c.clone().addScaledVector(inward, -0.2).setY(top), ring = [];
      for (let q = 0; q <= 6; q++) {
        const ang = (q / 6) * Math.PI, p = c.clone().addScaledVector(along, Math.cos(ang) * wide).addScaledVector(inward, -0.2 + Math.sin(ang) * reach * range(0.85, 1.1));
        ring.push(p.setY(-0.02));
      }
      for (let q = 0; q < 6; q++) {
        const mid = ring[q].clone().add(ring[q + 1]).multiplyScalar(0.5).lerp(apex, 0.5);
        mid.y += range(-0.08, 0.1);
        const uv = (p) => [p.x / 1.2 + p.z / 1.2, p.y / 1.2];
        debris.tri('toprak', [ring[q], ring[q + 1], mid], [ring[q], ring[q + 1], mid].map(uv), v3(inward.x, 1, inward.z));
        debris.tri('toprak', [ring[q], mid, apex], [ring[q], mid, apex].map(uv), v3(inward.x, 1, inward.z));
        debris.tri('toprak', [mid, ring[q + 1], apex], [mid, ring[q + 1], apex].map(uv), v3(inward.x, 1, inward.z));
      }
    }
  });
  for (const part of [earth, logs, posts, debris]) {
    if (!part.groups.size) continue;
    const mesh = part.mesh(mats());
    mesh.geometry.translate(0, -DEPTH, 0); // arazi düzeyi y = 0
    root.add(mesh);
  }
  return root;
}

// Kit: altı parça yan yana, her biri kendi düğümünde
export function createSiperKiti() {
  const root = new THREE.Group();
  root.name = 'siper_kiti';
  SIPER_PARCALARI.forEach((name, i) => {
    const m = createSiperParca(name, 1);
    m.position.set((i % 3 - 1) * 4.5, 0, (Math.floor(i / 3) - 0.5) * 4.5);
    root.add(m);
  });
  return root;
}
// Tek parça örnek hat: kör uç, düz ve yıkık bölümler, bir kavşak ve yan kol, köşe
export function createSiperHatti() {
  const root = new THREE.Group();
  root.name = 'siper_hatti';
  const Q = Math.PI / 2;
  [
    ['siper_uc', 0, 0, Math.PI], ['siper_duz', 0, 1, 0], ['siper_duz_yikik', 0, 2, 0], ['siper_kavsak', 0, 3, 0], ['siper_duz_cokmus', 0, 4, 0], ['siper_kose', 0, 5, 0],
    ['siper_duz_yikik', 1, 5, Q], ['siper_duz', 2, 5, Q], ['siper_uc', 3, 5, Q],
    ['siper_duz_cokmus', 1, 3, Q], ['siper_uc', 2, 3, Q],
  ].forEach(([name, x, z, rot], i) => {
    const m = createSiperParca(name, 10 + i);
    m.name = `${String(i + 1).padStart(2, '0')}_${name}`;
    m.position.set((x - 1.5) * CELL, 0, (z - 2.5) * CELL);
    m.rotation.y = rot;
    root.add(m);
  });
  return root;
}
