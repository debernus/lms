import * as THREE from 'three';
import { meshField, sharpenBoundaries } from './isosurface.js';
import { Surface, cloth, awayFromAxis, bodyDistance, TAU } from './outfit.js';
import { castOut } from './outfit2.js';
import { keepLargestPiece, skirtRadius, ARM, CEKET } from './outfit3.js';
import { buildAyakkabi } from './outfit5.js';

// Osmanlı halk kıyafeti 2 (levhada üst sıranın ikincisi): turuncu desenli, geniş kollu uzun entari,
// belde sarı-turuncu kuşak, üstünde kenarı kürklü, çizgili, kolsuz uzun yelek (kürk), ayakta sarı
// terlik. manken_erkek.glb'nin üstüne oturur (gömleksiz kopyayla); konum ve ölçek mankenle aynı.

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

function canvasTexture(name, w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.name = name;
  return t;
}
const patterned = (name, map) => new THREE.MeshStandardMaterial({ name, map, roughness: 0.85, metalness: 0, side: THREE.DoubleSide });

// Birden çok yüzeyi tek ağda toplar: parts = [[Surface, malzeme, uv(x, y, z) ya da null], ...]
function build(name, parts) {
  const positions = [], uvs = [], indices = [];
  const g = new THREE.BufferGeometry();
  parts.forEach(([s, , uv], i) => {
    const base = positions.length / 3;
    g.addGroup(indices.length, s.indices.length, i);
    for (let k = 0; k < s.positions.length; k += 3) {
      positions.push(s.positions[k], s.positions[k + 1], s.positions[k + 2]);
      uvs.push(...(uv ? uv(s.positions[k], s.positions[k + 1], s.positions[k + 2]) : [0, 0]));
    }
    for (const k of s.indices) indices.push(k + base);
  });
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, parts.map(([, m]) => m));
  mesh.name = name;
  return mesh;
}

// Gövde kabuğu (ve istenirse kollar) + belden aşağı etek. o: { offset, sleeve(ax) | null, inside(x, y, z),
// rows: [[y, pay]], gapAngle (ön açıklığın yarısı, radyan; 0 = kapalı), cell }
function robe(o) {
  const field = (x, y, z) => {
    const ax = Math.abs(x);
    const body = bodyDistance(x, y, z) - o.offset + (o.sleeve ? 0.08 * clamp01((ax - 0.2) / 0.14) : 0);
    if (!o.sleeve || ax < 0.2) return body;
    const tube = Math.hypot(y - (ARM.y - (o.sleeveDrop ?? 0)), z - ARM.z) - o.sleeve(ax);
    const k = 0.03, t = Math.max(k - Math.abs(body - tube), 0) / k;
    return Math.min(body, tube) - t * t * k * 0.25;
  };
  const inside = (x, y, z) => (y >= CEKET.waist && y < 1.6 && o.inside(x, y, z) ? 1 : 0);
  const { positions, indices } = meshField(field, [-0.72, 1.03, -0.26, 0.72, 1.63, 0.2], o.cell ?? 0.028);
  sharpenBoundaries(field, inside, positions, indices);
  const s = new Surface();
  const keep = new Int32Array(positions.length / 3).fill(-1);
  const ok = (v) => inside(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]);
  for (let t = 0; t < indices.length; t += 3) {
    const tri = [indices[t], indices[t + 1], indices[t + 2]];
    if (!tri.every(ok)) continue;
    for (const v of tri) {
      if (keep[v] < 0) keep[v] = s.point(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]);
      s.indices.push(keep[v]);
    }
  }
  keepLargestPiece(s);
  const SEG = 40, gap = o.gapAngle ?? 0;
  let previous = null;
  for (const [y, pay] of o.rows) {
    const row = Array.from({ length: gap ? SEG + 1 : SEG }, (_, k) => {
      const a = Math.PI / 2 + gap + ((TAU - 2 * gap) * k) / SEG, r = skirtRadius(y, a, pay);
      return s.point(CEKET.cx + Math.cos(a) * r, y, CEKET.cz + Math.sin(a) * r);
    });
    if (previous) s.strip(previous, row, !gap, awayFromAxis(CEKET.cx, CEKET.cz));
    previous = row;
  }
  return s;
}
// Desen yüzü dolanır (u) ve aşağı akar (v); kollarda kol boyunca
const wrapUV = (around, along) => (x, y, z) =>
  Math.abs(x) > 0.24 && y > 1.3 ? [(Math.atan2(y - ARM.y, z - ARM.z) / TAU) * Math.round(around / 3), x * along] : [(Math.atan2(x, z - CEKET.cz) / TAU) * around, y * along];

// ---------- Entari ----------
const HEM = 0.13;
function buildEntari() {
  const s = robe({
    offset: 0.016, sleeveDrop: 0.02,
    sleeve: (ax) => 0.075 + 0.06 * clamp01((ax - 0.25) / 0.4) ** 1.5, // bileğe doğru açılan çan kol
    inside: (x, y, z) => {
      if (Math.abs(x) > 0.66) return false;
      if (y > 1.52 && Math.hypot(x, z + 0.045) < 0.1) return false; // boyun
      return !(z > 0 && Math.abs(x) < (y - 1.36) * 0.42); // V yaka
    },
    rows: [[1.1, 0.02], [1.04, 0.022], [0.95, 0.026], [0.8, 0.032], [0.6, 0.04], [0.4, 0.05], [0.25, 0.058], [HEM, 0.064], [HEM - 0.003, 0.058]],
  });
  const map = canvasTexture('entari_desen', 64, 64, (g) => {
    g.fillStyle = '#c59a5e';
    g.fillRect(0, 0, 64, 64);
    // Şaşırtmalı dizilmiş küçük turuncu-kırmızı çiçekler
    for (const [cx, cy] of [[16, 16], [48, 48]]) {
      g.fillStyle = '#b5522a';
      for (const [dx, dy] of [[0, -6], [6, 0], [0, 6], [-6, 0]]) g.fillRect(cx + dx - 3, cy + dy - 3, 6, 6);
      g.fillStyle = '#7a2a1c';
      g.fillRect(cx - 2, cy - 2, 4, 4);
    }
    g.fillStyle = '#d8b983';
    for (const [cx, cy] of [[48, 16], [16, 48]]) g.fillRect(cx - 2, cy - 2, 4, 4);
  });
  return build('entari', [[s, patterned('entari', map), wrapUV(18, 9)]]);
}

// ---------- Kuşak ----------
function buildKusak() {
  const a = new Surface(), b = new Surface();
  const ring = (s, y, pay) => Array.from({ length: 40 }, (_, k) => {
    const an = (k / 40) * TAU, r = skirtRadius(y, an, pay);
    return s.point(CEKET.cx + Math.cos(an) * r, y, CEKET.cz + Math.sin(an) * r);
  });
  const rows = [[0.99, 0.031], [0.993, 0.034], [1.03, 0.037], [1.035, 0.032], [1.065, 0.037], [1.07, 0.032], [1.105, 0.037], [1.108, 0.026]];
  rows.slice(1).forEach(([y, pay], i) => {
    const s = i === 3 || i === 5 ? b : a;
    s.strip(ring(s, rows[i][0], rows[i][1]), ring(s, y, pay), true, awayFromAxis(CEKET.cx, CEKET.cz));
  });
  return build('kusak', [[a, cloth('kusak', 0xb07a22), null], [b, cloth('kusak_serit', 0x9a3a1c), null]]);
}

// ---------- Kürk ----------
// Kolsuz, önü açık, dize inen çizgili yelek; ön kenarları boydan boya kürklü.
const OPEN = 0.11, GAP = 0.68, KURK_HEM = 0.3;
function buildKurk() {
  const s = robe({
    offset: 0.045, sleeve: null,
    inside: (x, y, z) => {
      if (Math.abs(x) > 0.205) return false; // kol evi
      if (y > 1.5 && Math.hypot(x, z + 0.045) < 0.12) return false;
      return !(z > 0 && Math.abs(x) < OPEN + 0.04 * Math.max(0, (y - 1.3) / 0.25));
    },
    rows: [[1.1, 0.045], [1.04, 0.05], [0.95, 0.056], [0.8, 0.064], [0.6, 0.074], [0.45, 0.082], [KURK_HEM, 0.09]],
    gapAngle: GAP,
  });
  // Kürk kenar: ön açıklığın iki kenarı boyunca kabarık kahverengi şerit
  const fur = new Surface();
  for (const side of [-1, 1]) {
    const cols = [[], [], []];
    for (const y of [1.5, 1.43, 1.36, 1.29, 1.22, 1.15]) {
      const x0 = side * (OPEN + 0.04 * Math.max(0, (y - 1.3) / 0.25));
      [-0.004, 0.02, 0.044].forEach((dx, c) => {
        const p = castOut(v3(x0 + side * dx, y, -0.03), v3(0, 0, 1), 0.045 + (c === 1 ? 0.016 : 0.004));
        cols[c].push(fur.point(p.x, p.y, p.z));
      });
    }
    for (const [y, pay] of [[1.08, 0.048], [0.95, 0.056], [0.8, 0.064], [0.6, 0.074], [0.45, 0.082], [KURK_HEM, 0.09]]) {
      [-0.03, 0.1, 0.24].forEach((da, c) => {
        const a = Math.PI / 2 - side * (GAP + da), r = skirtRadius(y, a, pay + (c === 1 ? 0.016 : 0.004));
        cols[c].push(fur.point(CEKET.cx + Math.cos(a) * r, y, CEKET.cz + Math.sin(a) * r));
      });
    }
    fur.strip(cols[0], cols[1], false, () => [0, 0, 1]);
    fur.strip(cols[1], cols[2], false, () => [0, 0, 1]);
  }
  const map = canvasTexture('kurk_cizgi', 64, 8, (g) => {
    g.fillStyle = '#8a4a22';
    g.fillRect(0, 0, 64, 8);
    g.fillStyle = '#b5762c';
    g.fillRect(0, 0, 20, 8);
    g.fillStyle = '#6b2a1a';
    g.fillRect(34, 0, 10, 8);
  });
  return build('kurk', [[s, patterned('kurk', map), wrapUV(26, 1)], [fur, cloth('kurk_kenar', 0x4a3323), null]]);
}

export function createHalk2() {
  const root = new THREE.Group();
  root.name = 'halk_02_kurklu';
  const terlik = buildAyakkabi(0xb08e2e);
  terlik.name = 'terlik';
  terlik.material.name = 'terlik';
  root.add(buildEntari(), buildKusak(), buildKurk(), terlik);
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
