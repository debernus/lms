import * as THREE from 'three';
import { Surface, cloth, awayFromAxis, TAU } from './outfit.js';
import { skirtRadius, CEKET } from './outfit3.js';
import { buildAyakkabi } from './outfit5.js';
import { canvasTexture, patterned, build, robe, wrapUV } from './halk2.js';

// Osmanlı halk kıyafeti 5 (levhada üst sıranın sonuncusu): mavi-gri çizgili uzun entari, belde
// zeytin yeşili şal kuşak ve önde sarkan saçaklı ucu, üstünde önü açık, bol, geniş kollu kırmızı
// cübbe, ayakta sarı terlik. manken_erkek.glb'nin üstüne oturur (gömleksiz kopyayla).

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const HEM = 0.16;

// ---------- Entari ----------
function buildEntari() {
  const s = robe({
    offset: 0.016, sleeveDrop: 0.006,
    sleeve: (ax) => 0.068 + 0.012 * clamp01((ax - 0.3) / 0.38),
    inside: (x, y, z) => {
      if (Math.abs(x) > 0.69) return false;
      if (y > 1.535 && Math.hypot(x, z + 0.045) < 0.1) return false; // boyun
      return !(z > 0 && Math.abs(x) < (y - 1.46) * 0.4); // küçük V yaka
    },
    rows: [[1.1, 0.02], [1.04, 0.022], [0.95, 0.026], [0.8, 0.032], [0.6, 0.04], [0.4, 0.05], [HEM, 0.06], [HEM - 0.003, 0.054]],
  });
  const map = canvasTexture('entari_cizgi', 64, 8, (g) => {
    g.fillStyle = '#6f8791';
    g.fillRect(0, 0, 64, 8);
    g.fillStyle = '#a9b4ad';
    g.fillRect(0, 0, 20, 8);
    g.fillStyle = '#4b626d';
    g.fillRect(40, 0, 6, 8);
  });
  return build('entari', [[s, patterned('entari', map), wrapUV(34, 1)]]);
}

// ---------- Şal kuşak ----------
// Bele dolanmış geniş, kabarık şal; önde solda bir ucu dizin üstüne kadar sarkar, ucu saçaklı.
function buildKusak() {
  const s = new Surface(), stripe = new Surface(), fringe = new Surface();
  const out = awayFromAxis(CEKET.cx, CEKET.cz);
  const at = (surface, a, y, pay) => {
    const r = skirtRadius(y, a, pay);
    return surface.point(CEKET.cx + Math.cos(a) * r, y, CEKET.cz + Math.sin(a) * r);
  };
  let previous = null;
  for (const [y, pay] of [[0.975, 0.03], [0.98, 0.036], [1.01, 0.046], [1.045, 0.04], [1.075, 0.047], [1.105, 0.037], [1.11, 0.028]]) {
    const ring = Array.from({ length: 40 }, (_, k) => at(s, (k / 40) * TAU, y + 0.012 * Math.sin((k / 40) * TAU + 0.6), pay));
    if (previous) s.strip(previous, ring, true, out);
    previous = ring;
  }
  // Sarkan uç: aşağı doğru hafif açılır; alt kenarına yakın iki koyu şerit, ucunda saçak
  const CENTER = Math.PI / 2 - 0.22, COLS = 6;
  const row = (surface, y, half, pay) => Array.from({ length: COLS + 1 }, (_, c) => at(surface, CENTER + half * ((2 * c) / COLS - 1), y, pay + 0.004 * Math.sin(c * 1.9 + y * 30)));
  const drops = [[1.0, 0.3, 0.05], [0.93, 0.31, 0.05], [0.86, 0.32, 0.05], [0.79, 0.33, 0.052], [0.74, 0.34, 0.054], [0.72, 0.34, 0.054], [0.7, 0.34, 0.054], [0.68, 0.34, 0.054], [0.65, 0.345, 0.056]];
  for (let i = 1; i < drops.length; i++) {
    const surface = i === 5 || i === 7 ? stripe : s;
    surface.strip(row(surface, ...drops[i - 1]), row(surface, ...drops[i]), false, out);
  }
  for (let k = 0; k < 14; k++) {
    const a = CENTER + 0.345 * ((2 * (k + 0.5)) / 14 - 1), w = 0.008;
    const len = 0.05 + 0.02 * Math.sin(k * 2.3);
    const quad = [at(fringe, a - w, 0.65, 0.056), at(fringe, a + w, 0.65, 0.056), at(fringe, a + w * 0.4, 0.65 - len, 0.058), at(fringe, a - w * 0.4, 0.65 - len, 0.058)];
    const start = fringe.indices.length;
    fringe.indices.push(quad[0], quad[1], quad[2], quad[0], quad[2], quad[3]);
    fringe.orient(start, out);
  }
  return build('kusak', [[s, cloth('sal', 0x6b6a45), null], [stripe, cloth('sal_serit', 0x7a3323), null], [fringe, cloth('sal_sacak', 0x57563a), null]]);
}

// ---------- Cübbe ----------
// Omuzlardan bol dökülen, önü açık, geniş kollu, ayak bileğine inen kırmızı dış giysi.
function buildCubbe() {
  const s = robe({
    offset: 0.045, sleeveDrop: 0.03,
    sleeve: (ax) => 0.105 + 0.045 * clamp01((ax - 0.2) / 0.4), // bileğe doğru açılan bol kol
    inside: (x, y, z) => {
      const ax = Math.abs(x);
      if (ax > 0.62) return false;
      if (y > 1.5 && Math.hypot(x, z + 0.045) < 0.12) return false; // boyun
      return !(z > 0 && ax < 0.115 + 0.03 * clamp01((y - 1.3) / 0.25)); // ön açıklık
    },
    rows: [[1.1, 0.05], [1.05, 0.056], [0.98, 0.064], [0.85, 0.076], [0.65, 0.092], [0.45, 0.106], [0.25, 0.118], [HEM - 0.03, 0.124]],
    gapAngle: 0.66,
  });
  return build('cubbe', [[s, cloth('cubbe', 0x7a221c), null]]);
}

export function createHalk5() {
  const root = new THREE.Group();
  root.name = 'halk_05_kirmizi_cubbeli';
  const terlik = buildAyakkabi(0xb08e2e);
  terlik.name = 'terlik';
  terlik.material.name = 'terlik';
  root.add(buildEntari(), buildKusak(), buildCubbe(), terlik);
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
