import * as THREE from 'three';
import { Surface, cloth, awayFromAxis, TAU } from './outfit.js';
import { skirtRadius, CEKET } from './outfit3.js';
import { buildAyakkabi } from './outfit5.js';
import { canvasTexture, patterned, build, robe, wrapUV } from './halk2.js';

// Osmanlı halk kıyafeti 3 (levhada üst sıranın üçüncüsü): sarı çizgili uzun entari, belde ince
// kuşak, üstünde önü açık kısa gri-yeşil cepken, ayakta siyah ayakkabı. manken_erkek.glb'nin üstüne
// oturur (gömleksiz kopyayla); konum ve ölçek mankenle aynı.

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const HEM = 0.2;

// ---------- Entari ----------
// Önü çapraz kapanan, bileğe doğru hafif genişleyen kollu, baldıra inen sarı çizgili giysi.
function buildEntari() {
  const s = robe({
    offset: 0.016, sleeveDrop: 0.008,
    sleeve: (ax) => 0.07 + 0.03 * clamp01((ax - 0.3) / 0.38),
    inside: (x, y, z) => {
      if (Math.abs(x) > 0.68) return false;
      if (y > 1.535 && Math.hypot(x, z + 0.045) < 0.1) return false; // boyun
      return !(z > 0 && Math.abs(x) < (y - 1.44) * 0.4); // dar V yaka
    },
    rows: [[1.1, 0.02], [1.04, 0.022], [0.95, 0.026], [0.8, 0.032], [0.6, 0.04], [0.4, 0.05], [HEM, 0.06], [HEM - 0.003, 0.054]],
  });
  const map = canvasTexture('entari_cizgi', 64, 8, (g) => {
    g.fillStyle = '#c2a23a';
    g.fillRect(0, 0, 64, 8);
    g.fillStyle = '#dccb78';
    g.fillRect(0, 0, 24, 8);
    g.fillStyle = '#a07e26';
    g.fillRect(42, 0, 5, 8);
  });
  return build('entari', [[s, patterned('entari', map), wrapUV(34, 1)]]);
}

// ---------- Kuşak ----------
function buildKusak() {
  const s = new Surface();
  const ring = (y, pay) => Array.from({ length: 40 }, (_, k) => {
    const a = (k / 40) * TAU, r = skirtRadius(y, a, pay);
    return s.point(CEKET.cx + Math.cos(a) * r, y, CEKET.cz + Math.sin(a) * r);
  });
  let previous = null;
  for (const [y, pay] of [[1.025, 0.031], [1.028, 0.034], [1.06, 0.037], [1.092, 0.034], [1.095, 0.028]]) {
    const now = ring(y, pay);
    if (previous) s.strip(previous, now, true, awayFromAxis(CEKET.cx, CEKET.cz));
    previous = now;
  }
  return build('kusak', [[s, cloth('kusak', 0x9a7a24), null]]);
}

// ---------- Cepken ----------
// Göğüs hizasında biten, önü açık kısa ceket; kolları dirseğin altına iner, entarinin kolu altından çıkar.
function buildCepken() {
  const s = robe({
    offset: 0.04, sleeveDrop: 0.008, cell: 0.026,
    sleeve: (ax) => 0.098 + 0.014 * clamp01((ax - 0.25) / 0.3),
    inside: (x, y, z) => {
      const ax = Math.abs(x);
      if (ax > 0.55) return false;
      if (ax < 0.24 && y < 1.2 + 0.03 * clamp01(z / 0.1)) return false; // etek ucu: önde biraz kalkık
      if (y > 1.5 && Math.hypot(x, z + 0.045) < 0.12) return false; // boyun
      return !(z > 0 && ax < 0.085 + 0.05 * clamp01((y - 1.3) / 0.25)); // ön açıklık
    },
    rows: [],
  });
  return build('cepken', [[s, cloth('cepken', 0x4f5f58), null]]);
}

export function createHalk3() {
  const root = new THREE.Group();
  root.name = 'halk_03_cepkenli';
  root.add(buildEntari(), buildKusak(), buildCepken(), buildAyakkabi(0x141210));
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
