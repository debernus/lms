import * as THREE from 'three';
import { canvasTexture } from './halk2.js';

// Satranç takımı: çerçeveli ahşap tahta ve 32 torna taş (açık ve koyu ahşap). Taşlar başlangıç dizilişinde;
// açık taşlar -X, koyu taşlar +X yanında. 1 birim = 1 metre, Y yukarı, tahtanın tabanı y = 0, merkezde.
// Kare 5 cm; tahta 48 × 48 × 3 cm. Her taş kendi düğümünde, orijini tabanının ortasında.
// Düğümler: satranc_tahtasi, acik_/koyu_ + sah, vezir, fil_1-2, at_1-2, kale_1-2, piyon_1-8.

const TAU = Math.PI * 2;
const SQ = 0.05, TOP = 0.03;
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function woodTexture(name, base, seed, draw) {
  return canvasTexture(name, 512, 512, (g) => {
    const rand = rng(seed);
    g.fillStyle = base;
    g.fillRect(0, 0, 512, 512);
    draw?.(g);
    for (let i = 0; i < 520; i++) {
      g.fillStyle = `rgba(${rand() < 0.6 ? '30,16,8' : '230,190,140'},${0.04 + rand() * 0.1})`;
      g.fillRect(rand() * 512, rand() * 512, 1 + rand() * 2, 40 + rand() * 200);
    }
    g.filter = 'blur(12px)';
    for (let i = 0; i < 14; i++) {
      g.fillStyle = `rgba(20,10,6,${0.06 + rand() * 0.1})`;
      g.beginPath();
      g.ellipse(rand() * 512, rand() * 512, 20 + rand() * 50, 20 + rand() * 50, 0, 0, TAU);
      g.fill();
    }
    g.filter = 'none';
  });
}
const lathe = (profile, n = 20) => new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), n);
function merge(list) {
  const pos = [], nor = [], uv = [], idx = [];
  let base = 0;
  for (const g0 of list) {
    const g = g0.index ? g0 : g0.clone();
    if (!g.index) g.setIndex(Array.from({ length: g.attributes.position.count }, (_, i) => i));
    for (const v of g.attributes.position.array) pos.push(v);
    for (const v of g.attributes.normal.array) nor.push(v);
    for (const v of g.attributes.uv.array) uv.push(v);
    for (const i of g.index.array) idx.push(i + base);
    base += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx);
  return out;
}
const at = (g, x, y, z) => g.translate(x, y, z);
// Torna kaide: geniş taban, boğumlar, ince gövde; r tabanın yarıçapı, h gövdenin bittiği yükseklik
const stem = (r, h, top) => [[0, 0], [r, 0], [r, 0.004], [r * 0.92, 0.008], [r * 0.95, 0.012], [r * 0.7, 0.017], [r * 0.74, 0.021], [r * 0.5, 0.027], [r * 0.4, h * 0.55], [top, h - 0.004], [top * 1.5, h - 0.002], [top * 1.5, h]];

function pieces() {
  const G = {};
  G.piyon = merge([lathe([...stem(0.0155, 0.036, 0.0055), [0.004, 0.037]]), at(new THREE.SphereGeometry(0.0085, 14, 10), 0, 0.044, 0)]);
  // Kale: silindir gövde, taçta dört diş
  const rook = [lathe([[0, 0], [0.019, 0], [0.019, 0.005], [0.0175, 0.009], [0.018, 0.013], [0.014, 0.019], [0.012, 0.045], [0.0165, 0.05], [0.0165, 0.056], [0.012, 0.056], [0.012, 0.052], [0, 0.052]])];
  for (let k = 0; k < 4; k++) {
    const b = new THREE.BoxGeometry(0.011, 0.008, 0.0045);
    b.translate(0, 0.06, 0.0143);
    b.rotateY((k / 4) * TAU + Math.PI / 4);
    rook.push(b);
  }
  G.kale = merge(rook);
  // Fil: damla biçimli başlık, tepesinde topuz
  G.fil = merge([lathe([...stem(0.0175, 0.05, 0.0065), [0.007, 0.052], [0.0105, 0.06], [0.0095, 0.068], [0.005, 0.077], [0.0022, 0.08]]), at(new THREE.SphereGeometry(0.0038, 10, 8), 0, 0.083, 0)]);
  // Vezir: taç, çevresinde boncuklar
  const queen = [lathe([...stem(0.019, 0.062, 0.007), [0.007, 0.064], [0.0085, 0.072], [0.013, 0.082], [0.0105, 0.082], [0.006, 0.076], [0, 0.076]]), at(new THREE.SphereGeometry(0.0042, 10, 8), 0, 0.081, 0)];
  for (let k = 0; k < 8; k++) queen.push(at(new THREE.SphereGeometry(0.0026, 6, 5), Math.cos((k / 8) * TAU) * 0.0122, 0.0835, Math.sin((k / 8) * TAU) * 0.0122));
  G.vezir = merge(queen);
  // Şah: taç ve haç
  G.sah = merge([lathe([...stem(0.02, 0.07, 0.0075), [0.0075, 0.072], [0.009, 0.08], [0.0125, 0.088], [0.009, 0.091], [0.004, 0.093], [0, 0.093]]), at(new THREE.BoxGeometry(0.0032, 0.013, 0.0032), 0, 0.0995, 0), at(new THREE.BoxGeometry(0.0095, 0.0032, 0.0032), 0, 0.1, 0)]);
  // At: torna kaide üstünde yandan kesilmiş at başı (burnu +X'e bakar)
  const s = new THREE.Shape();
  [[-0.011, 0], [-0.0125, 0.014], [-0.01, 0.028], [-0.005, 0.039], [-0.0015, 0.046], [0.001, 0.0425], [0.0045, 0.039], [0.012, 0.033], [0.018, 0.026], [0.0185, 0.0205], [0.0145, 0.0185], [0.008, 0.022], [0.003, 0.0215], [0.0045, 0.014], [0.0095, 0.006], [0.011, 0]].forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  const head = new THREE.ExtrudeGeometry(s, { depth: 0.011, bevelEnabled: true, bevelSize: 0.0025, bevelThickness: 0.003, bevelSegments: 2, curveSegments: 1 });
  head.translate(0, 0.024, -0.0055);
  G.at = merge([lathe([[0, 0], [0.019, 0], [0.019, 0.005], [0.0175, 0.009], [0.018, 0.013], [0.0145, 0.019], [0.0135, 0.024], [0, 0.024]]), head]);
  return G;
}

export function createSatranc() {
  const root = new THREE.Group();
  root.name = 'satranc_takimi';
  const std = (name, map, o = {}) => new THREE.MeshStandardMaterial({ name, map, roughness: 0.6, metalness: 0, ...o });
  // ---------- Tahta: 8 × 8 kare ve çerçeve tek dokuda (48 cm = 512 px) ----------
  const F = 0.04, SIZE = 8 * SQ + 2 * F, px = 512 / SIZE;
  const boardMap = woodTexture('satranc_tahtasi', '#8a5a36', 4, (g) => {
    for (let i = 0; i < 8; i++) for (let k = 0; k < 8; k++) {
      g.fillStyle = (i + k) % 2 ? '#a06a3c' : '#3a342e';
      g.fillRect((F + i * SQ) * px, (F + k * SQ) * px, SQ * px, SQ * px);
    }
    g.strokeStyle = '#4a2c18';
    g.lineWidth = 2.5;
    g.strokeRect(F * px - 3, F * px - 3, 8 * SQ * px + 6, 8 * SQ * px + 6);
    g.strokeRect(7, 7, 498, 498);
  });
  const frameMap = woodTexture('tahta_cercevesi', '#8a5a36', 6);
  const h = SIZE / 2, slab = new THREE.BoxGeometry(SIZE, TOP - 0.006, SIZE);
  slab.translate(0, (TOP - 0.006) / 2, 0);
  // Pahlı üst kenar: tabandan dar bir üst yüz
  const lip = new THREE.BufferGeometry(), t = h - 0.008, y0 = TOP - 0.006;
  const P = [[-h, y0, -h], [h, y0, -h], [h, y0, h], [-h, y0, h], [-t, TOP, -t], [t, TOP, -t], [t, TOP, t], [-t, TOP, t]];
  const pos = [], uv = [], idx = [], face = (a, b, c, d, top) => {
    const base = pos.length / 3;
    for (const i of [a, b, c, d]) {
      pos.push(...P[i]);
      uv.push(top ? (P[i][0] + h) / SIZE : (P[i][0] + P[i][2]) / SIZE, top ? 1 - (P[i][2] + h) / SIZE : P[i][1] * 8);
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  face(7, 6, 5, 4, true);
  const topCount = 6;
  face(0, 4, 5, 1);
  face(1, 5, 6, 2);
  face(2, 6, 7, 3);
  face(3, 7, 4, 0);
  lip.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  lip.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  lip.setIndex(idx);
  lip.addGroup(0, topCount, 0);
  lip.addGroup(topCount, idx.length - topCount, 1);
  lip.computeVertexNormals();
  const frameMat = std('tahta_cercevesi', frameMap);
  const board = new THREE.Group();
  board.name = 'satranc_tahtasi';
  board.add(new THREE.Mesh(slab, frameMat), new THREE.Mesh(lip, [std('satranc_tahtasi', boardMap), frameMat]));
  root.add(board);

  // ---------- Taşlar ----------
  const G = pieces();
  const sides = [['acik', std('acik_ahsap', woodTexture('acik_ahsap', '#946038', 11)), -1], ['koyu', std('koyu_ahsap', woodTexture('koyu_ahsap', '#4a2e1e', 12)), 1]];
  const ORDER = ['kale', 'at', 'fil', 'vezir', 'sah', 'fil', 'at', 'kale'];
  for (const [side, material, sx] of sides) {
    const count = {};
    const put = (kind, file, rank, single) => {
      count[kind] = (count[kind] ?? 0) + 1;
      const m = new THREE.Mesh(G[kind], material);
      m.name = `${side}_${kind}${single ? '' : '_' + count[kind]}`;
      m.position.set(sx * (rank + 0.5) * SQ, TOP, (file - 3.5) * SQ);
      if (kind === 'at') m.rotation.y = sx > 0 ? Math.PI : 0; // atlar karşıya bakar
      root.add(m);
    };
    ORDER.forEach((kind, file) => put(kind, file, 3, kind === 'sah' || kind === 'vezir'));
    for (let file = 0; file < 8; file++) put('piyon', file, 2, false);
  }
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
