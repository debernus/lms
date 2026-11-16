import * as THREE from 'three';
import M from './manken_olcu.js';
import { Surface, awayFromAxis, buildTrousers, headRadius, TAU } from './outfit.js';
import { skirtRadius, CEKET } from './outfit3.js';
import { buildAyakkabi } from './outfit5.js';
import { build, robe } from './halk2.js';
import { dirty, worldUV, soil } from './cocuk.js';

// Üç yoksul köylü kıyafeti (kaba dokuma, kirli, soluk): 1) pelerinli, 2) kukuletalı, 3) kolsuz
// üstlüklü. manken_erkek.glb'nin üstüne oturur (gömleksiz kopyayla); konum ve ölçek mankenle aynı.

const HEAD = M.head;
const neckHole = (x, y, z, r = 0.1) => y > 1.53 && Math.hypot(x, z + 0.045) < r;
const piece = (name, surface, color) => build(name, [[surface, dirty(name, color), worldUV]]);

// Uzun kollu ya da kolsuz gömlek/tunik. hem: etek ucu, slit: ön yırtmacın yarı açısı
function tunic(name, color, { offset = 0.017, sleeve = 0.072, hem, flare = 0.03, slit = 0 }) {
  const rows = [[1.1, offset + 0.003], [1.04, offset + 0.005]];
  for (let y = 0.96; y > hem + 0.04; y -= 0.1) rows.push([y, offset + 0.006 + flare * (1.04 - y) / (1.04 - hem)]);
  rows.push([hem, offset + 0.006 + flare], [hem - 0.004, offset + flare]);
  const s = robe({
    offset, sleeveDrop: 0.006,
    sleeve: sleeve ? (ax) => sleeve + 0.004 * Math.sin(ax * 40) : null, // buruşuk kol
    inside: (x, y, z) => Math.abs(x) < (sleeve ? 0.69 : 0.2) && !neckHole(x, y, z, sleeve ? 0.1 : 0.115),
    rows, gapAngle: slit,
  });
  return piece(name, s, color);
}
// Omuzları örten kısa pelerin
function capelet(name, color, { offset = 0.045, bottom = 1.26, reach = 0.36, neck = 0.11 }) {
  const s = robe({
    offset, sleeveDrop: 0.02, sleeve: (ax) => 0.115 + 0.03 * Math.min(1, (ax - 0.2) / 0.16),
    inside: (x, y, z) => Math.abs(x) < reach && !neckHole(x, y, z, neck) && (Math.abs(x) > 0.2 || y > bottom + 0.012 * Math.sin(x * 60 + z * 40)), // yıpranmış, eğri kenar
    rows: [],
  });
  return piece(name, s, color);
}
// Kuşak: bele dolanmış kayış ya da ip ve önde sarkan ucu
function belt(name, color, { y = 1.05, width = 0.045, pay = 0.036, tail = 0.3, turns = 1 }) {
  const s = new Surface();
  const at = (a, yy, extra) => {
    const r = skirtRadius(yy, a, pay + extra);
    return s.point(CEKET.cx + Math.cos(a) * r, yy, CEKET.cz + Math.sin(a) * r);
  };
  const out = awayFromAxis(CEKET.cx, CEKET.cz);
  for (let t = 0; t < turns; t++) {
    const y0 = y + t * (width + 0.006);
    let previous = null;
    for (const [h, extra] of [[-0.002, -0.004], [0, 0], [width, 0], [width + 0.002, -0.004]]) {
      const ring = Array.from({ length: 40 }, (_, k) => at((k / 40) * TAU, y0 + h + 0.006 * Math.sin((k / 40) * TAU + t), extra));
      if (previous) s.strip(previous, ring, true, out);
      previous = ring;
    }
  }
  let above = null;
  for (const yy of [y + width * 0.6, y - 0.08, y - 0.18, y - tail]) {
    const row = [-1, 1].map((e) => at(Math.PI / 2 + 0.1 + e * 0.07, yy, 0.008));
    if (above) s.strip(above, row, false, out);
    above = row;
  }
  return piece(name, s, color);
}
// Başlık: başı saran bez (yüz açık). cowl: boyundan omuzlara inen yaka kısmı
function hood(name, color, { offset = 0.012, cowl = false, peak = 0 }) {
  const s = new Surface();
  const SEG = 32, TOPY = 1.812 + offset;
  const rows = [];
  if (cowl) for (const [y, r] of [[1.47, 0.2], [1.52, 0.165], [1.58, 0.13], [1.63, 0.115]]) rows.push({ y, r: () => r + offset });
  else rows.push({ y: 1.6, r: (a) => headRadius(1.66, a) + offset - 0.004 }, { y: 1.63, r: (a) => headRadius(1.66, a) + offset });
  for (const y of [1.66, 1.69, 1.72, 1.75]) rows.push({ y, r: (a) => headRadius(y, a) + offset });
  for (const t of [0, 0.3, 0.55, 0.78, 0.94]) {
    const th = (t * Math.PI) / 2;
    rows.push({ y: 1.775 + (TOPY - 1.775) * Math.sin(th) + peak * Math.sin(th) ** 2, r: (a) => (headRadius(1.775, a) + offset) * Math.cos(th) });
  }
  const grid = rows.map((row) => Array.from({ length: SEG }, (_, k) => {
    const a = (k / SEG) * TAU, r = row.r(a) * (cowl && row.y < 1.56 ? 1 + 0.25 * Math.abs(Math.cos(a)) : 1); // omuzlara doğru genişler
    const forward = cowl && row.y > 1.6 ? 0.03 * Math.max(0, Math.sin(a)) : 0; // kukuleta yüzün önüne taşar
    return s.point(HEAD.cx + Math.cos(a) * r, row.y, HEAD.cz + Math.sin(a) * (r + forward) - (peak ? 0.02 * (row.y > 1.78 ? 1 : 0) : 0));
  }));
  const FACE = cowl ? 0.75 : 0.95; // yüz açıklığının yarı açısı
  for (let j = 1; j < rows.length; j++) for (let k = 0; k < SEG; k++) {
    const a = ((k + 0.5) / SEG) * TAU, mid = (rows[j].y + rows[j - 1].y) / 2;
    const face = Math.abs(a - Math.PI / 2) < FACE && mid > (cowl ? 1.575 : 1.59) && mid < 1.775;
    if (face) continue;
    const k1 = (k + 1) % SEG, start = s.indices.length;
    s.indices.push(grid[j - 1][k], grid[j - 1][k1], grid[j][k1], grid[j - 1][k], grid[j][k1], grid[j][k]);
    s.orient(start, awayFromAxis(HEAD.cx, HEAD.cz));
  }
  s.fan(s.point(HEAD.cx, TOPY + peak, HEAD.cz - (peak ? 0.02 : 0)), grid[grid.length - 1], () => [0, 1, 0]);
  return piece(name, s, color);
}
const trousers = (color) => soil(buildTrousers({
  name: 'pantolon', color, top: 1.04, crotch: 0.84, cx: 0, cz: -0.04,
  ease: [[0.075, 0.024], [0.2, 0.02], [0.4, 0.018], [0.5, 0.014], [0.66, 0.014], [0.76, 0.015], [0.96, 0.016], [1.04, 0.013]],
  legRows: [0.075, 0.078, 0.13, 0.2, 0.28, 0.36, 0.43, 0.48, 0.52, 0.56, 0.6, 0.65, 0.7, 0.755, 0.8, 0.84],
  hipRows: [0.88, 0.92, 0.96, 0.98, 1.0, 1.02, 1.04], legFold: 0.006, hipFold: 0.004,
}), 'pantolon', color);
const shoes = (color) => soil(buildAyakkabi(), 'ayakkabi', color);

const SETS = {
  // 1) Kahverengi tunik, kiremit rengi omuz pelerini, deri kuşak, kirli beyaz pantolon, beyaz takke-başlık
  1: () => [
    tunic('tunik', 0x4a443a, { hem: 0.62, sleeve: 0.074 }),
    capelet('pelerin', 0x7a4a3c, {}),
    belt('kusak', 0x4a3728, { width: 0.05 }),
    trousers(0x9a9482), shoes(0x8a8272), hood('baslik', 0xa39c88, {}),
  ],
  // 2) Krem tunik, gri kuşak, omuzlara inen kahverengi kukuleta, gri pantolon, kahverengi ayakkabı
  2: () => [
    tunic('tunik', 0xa59c84, { hem: 0.68, sleeve: 0.078 }),
    belt('kusak', 0x55534e, { width: 0.04, tail: 0.34 }),
    capelet('kukuleta_yaka', 0x5c3d2a, { offset: 0.04, bottom: 1.44, reach: 0.25, neck: 0.085 }),
    hood('kukuleta', 0x5c3d2a, { offset: 0.035, cowl: true, peak: 0.03 }),
    trousers(0x6a6660), shoes(0x5e4636),
  ],
  // 3) Yeşil kollu iç gömlek, üstünde önü yırtmaçlı krem kolsuz üstlük, ip kuşak, mor-kahve pantolon, yeşil başlık
  3: () => [
    tunic('gomlek', 0x3f4a38, { hem: 0.95, sleeve: 0.074, flare: 0.005 }),
    tunic('ustluk', 0xa8a08a, { offset: 0.03, sleeve: 0, hem: 0.52, flare: 0.035, slit: 0.1 }),
    belt('kusak', 0x7a644a, { width: 0.012, turns: 3, pay: 0.05, tail: 0.24 }),
    trousers(0x5e4a48), shoes(0x5a4540), hood('baslik', 0x3f4a38, {}),
  ],
};
export function createKoylu(set = 1) {
  const root = new THREE.Group();
  root.name = `koylu_${set}`;
  root.add(...SETS[set]());
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
