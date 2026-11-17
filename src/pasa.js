import * as THREE from 'three';
import M from './manken_olcu.js';
import { Surface, cloth, awayFromAxis, reach, buildTrousers, S, TAU } from './outfit.js';
import { brass, bodyNormal, castOut, settle, assemble } from './outfit2.js';
import { jacketFabric, collarTop, button, patchOf, castToCeket, onChest, skirtRadius, ARM, CEKET } from './outfit3.js';
import { buildAyakkabi } from './outfit5.js';

// Osmanlı paşası (müşir) tören üniforması, 1900'lerin başı; manken_erkek.glb'nin üstüne oturur
// (gömleksiz kopyayla). Parçalar: ceket, apoletler, kordon, nisan_kusagi, nisanlar, kemer, salvar,
// ayakkabi. Fes ve sakal ayrı dosyalarda. Konum ve ölçek mankenle aynı; mankenin sağı -X, solu +X.

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const NAVY = 0x161c2b;
const gold = (name = 'sirma') => new THREE.MeshStandardMaterial({ name, color: 0x9a7a2c, roughness: 0.55, metalness: 0.65, side: THREE.DoubleSide });
const HEM = 0.74;

// ---------- Ceket ----------
// Uyluğa inen lacivert redingot: sırma işlemeli dik yaka, önde tek sıra düğme ve sırma biye,
// dirseğe doğru sivrilen geniş sırma kol kapakları.
function buildCeket() {
  const fabric = jacketFabric(
    [[1.1, 0.018], [1.06, 0.019], [1.01, 0.02], [0.965, 0.021], [0.9, 0.024], [0.82, 0.028], [HEM, 0.032], [HEM - 0.003, 0.027]],
    { drop: 0.045, from: -0.03, to: 0.05 },
  );
  const trim = new Surface(), metal = new Surface();
  const front = () => [0, 0, 1];
  const onSkirt = (x, y, lift) => {
    let a = Math.PI / 2;
    for (let i = 0; i < 4; i++) a = Math.acos(Math.max(-1, Math.min(1, x / skirtRadius(y, a, 0.02))));
    const r = skirtRadius(y, a, 0.019 + 0.013 * S(1.06, HEM, y) + lift);
    return v3(CEKET.cx + Math.cos(a) * r, y, CEKET.cz + Math.sin(a) * r);
  };
  // Önde düğmeler ve ön kapama boyunca ince sırma biye
  for (const y of [1.5, 1.43, 1.36, 1.29, 1.22, 1.15]) {
    const c = onChest(0, y, 0.002);
    button(metal, c, bodyNormal(c), 0.008);
  }
  for (const y of [0.98, 0.9]) button(metal, onSkirt(0, y, 0.005), v3(0, 0, 1), 0.008);
  patchOf(trim, Array.from({ length: 15 }, (_, i) => 1.53 - i * 0.03).map((y) => [0.014, 0.022].map((x) => onChest(x, y, 0.005))), front);
  patchOf(trim, [1.04, 0.98, 0.92, 0.86, 0.8, HEM].map((y) => [0.014, 0.022].map((x) => onSkirt(x, y, 0.006))), front);
  // Yaka: boydan boya sırma
  const NECK = v3(0, 0, -0.045);
  const band = [0.002, 0.034].map((below) => Array.from({ length: 24 }, (_, k) => {
    const dir = v3(Math.cos((k / 24) * TAU), 0, Math.sin((k / 24) * TAU));
    let p = castToCeket(v3(0, 1.57, NECK.z), dir, 0.003);
    for (let i = 0; i < 3; i++) p = castToCeket(v3(0, collarTop(p.z) - below, NECK.z), dir, 0.003);
    return trim.point(p.x, p.y, p.z);
  }));
  trim.strip(band[0], band[1], true, (x, y, z) => [x, 0, z - NECK.z]);
  // Kol kapakları: bilekte geniş sırma bant, üst kenarı kolun üstünde dirseğe doğru sivrilir
  for (const side of [-1, 1]) {
    const ring = (x, peak) => Array.from({ length: 16 }, (_, k) => {
      const a = (k / 16) * TAU; // a = 0: kolun üstü
      const p = castToCeket(v3(side * (x - peak * Math.max(0, Math.cos(a)) ** 3), ARM.y, ARM.z), v3(0, Math.cos(a), Math.sin(a)), 0.003);
      return trim.point(p.x, p.y, p.z);
    });
    const away = (x, y, z) => [0, y - ARM.y, z - ARM.z];
    const rows = [ring(0.6, 0.07), ring(0.655, 0.03), ring(0.713, 0)];
    trim.strip(rows[0], rows[1], true, away);
    trim.strip(rows[1], rows[2], true, away);
  }
  return assemble('ceket', [[fabric, cloth('ceket', NAVY)], [trim, gold()], [metal, brass()]]);
}

// ---------- Apoletler ----------
// Omuzda sırma tabla ve dış ucundan sarkan püskül saçağı.
function buildApoletler() {
  const board = new Surface(), fringe = new Surface();
  for (const side of [-1, 1]) {
    const at = (x, z, lift) => castToCeket(v3(side * x, 1.4, z), v3(0, 1, 0), lift);
    patchOf(board, [-0.045, -0.015, 0.015, 0.045].map((dz) => [0.095, 0.13, 0.165, 0.2, 0.23].map((x) => at(x, -0.06 + dz * (x > 0.18 ? 1.3 : 1), 0.018))), () => [0, 1, 0]);
    // Saçak: tablanın dış ucunu saran, aşağı dökülen kısa püsküller
    const top = [], bottom = [];
    for (let k = 0; k <= 14; k++) {
      const a = -1.75 + (3.5 * k) / 14; // kolun üstünden öne ve arkaya
      const p = castToCeket(v3(side * 0.232, ARM.y, ARM.z), v3(0, Math.cos(a), Math.sin(a)), 0.016);
      top.push(fringe.point(p.x, p.y + 0.004, p.z));
      const q = p.clone().add(v3(side * 0.04, -0.06 - 0.01 * (k % 2), 0.012 * Math.sin(a)));
      bottom.push(fringe.point(q.x, q.y, q.z));
    }
    fringe.strip(top, bottom, false, (x, y, z) => [side, 0.3, z - ARM.z]);
  }
  return assemble('apoletler', [[board, gold('apolet')], [fringe, gold('apolet_sacak')]]);
}

// ---------- Kordon (yaver kordonu) ----------
// Sağ omuzdan göğse inen, ön düğmelere bağlanan sırma kordon halkaları ve sarkan uçları.
function buildKordon() {
  const s = { positions: [], indices: [] };
  const cord = (points, radius = 0.0045) => {
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 28, radius, 6);
    const base = s.positions.length / 3;
    s.positions.push(...g.attributes.position.array);
    for (const i of g.index.array) s.indices.push(i + base);
  };
  const P = (x, y, lift = 0.016) => onChest(x, y, lift);
  cord([P(-0.165, 1.5), P(-0.15, 1.4), P(-0.105, 1.335), P(-0.05, 1.36), P(-0.012, 1.425)]);
  cord([P(-0.17, 1.495), P(-0.165, 1.35), P(-0.115, 1.255), P(-0.05, 1.29), P(-0.012, 1.36)]);
  cord([P(-0.16, 1.505), P(-0.12, 1.46), P(-0.06, 1.44), P(-0.012, 1.43)], 0.0035);
  // Düğmeden sarkan iki uç ve uçlarındaki madeni kalemler
  for (const [x, len] of [[-0.03, 0.1], [-0.048, 0.13]]) {
    cord([P(-0.012, 1.428), P(x, 1.38), P(x - 0.004, 1.38 - len)], 0.003);
    cord([P(x - 0.004, 1.38 - len), P(x - 0.004, 1.34 - len)], 0.0055);
  }
  return assemble('kordon', [[s, gold('kordon')]]);
}

// ---------- Nişan kuşağı ----------
// Sağ omuzdan sol kalçaya çapraz inen geniş koyu kurdele; ceketin üstünde yassı durur.
export function buildNisanKusagi(color = 0x1b2420, OFFSET = 0.013 + 0.007) {
  const s = new Surface();
  const WIDTH = 0.085;
  const shoulder = v3(-0.135, 1.53, -0.045), hip = v3(0.165, 1.14, -0.03);
  const along = hip.clone().sub(shoulder).normalize(), depth = v3(0, 0, 1);
  const across = along.clone().cross(depth).normalize(), center = shoulder.clone().lerp(hip, 0.5);
  const rows = [];
  for (let k = 0; k < 72; k++) {
    const phi = (k / 72) * TAU;
    const mid = castOut(center, along.clone().multiplyScalar(Math.cos(phi)).addScaledVector(depth, Math.sin(phi)), OFFSET);
    rows.push([-0.5, 0, 0.5].map((e) => {
      const p = e ? settle(mid.clone().addScaledVector(across, e * WIDTH), OFFSET) : mid;
      return s.point(p.x, p.y, p.z);
    }));
  }
  const out = (x, y, z) => [x - center.x, y - center.y, z - center.z];
  s.strip(rows.map((r) => r[0]), rows.map((r) => r[1]), true, out);
  s.strip(rows.map((r) => r[1]), rows.map((r) => r[2]), true, out);
  return assemble('nisan_kusagi', [[s, cloth('nisan_kusagi', color)]]);
}

// ---------- Nişanlar ----------
// Sol göğüste bir sıra madalya (kurdele ve madalyon) ve göğsün iki yanında sekiz köşeli yıldız nişanlar.
function buildNisanlar() {
  const medal = new Surface(), silver = new Surface(), ribbons = [new Surface(), new Surface(), new Surface()];
  [0.045, 0.072, 0.099, 0.126, 0.153].forEach((x, i) => {
    patchOf(ribbons[i % 3], [1.452, 1.418].map((y) => [-0.011, 0.011].map((dx) => onChest(x + dx, y, 0.006))), () => [0, 0, 1]);
    const c = onChest(x, 1.402, 0.006);
    button(medal, c, bodyNormal(c), 0.011);
  });
  const star = (x, y, radius) => {
    const c = onChest(x, y, 0.004), n = bodyNormal(c);
    const u = v3(1, 0, 0).addScaledVector(n, -n.x).normalize(), w = n.clone().cross(u);
    const ring = Array.from({ length: 16 }, (_, k) => {
      const a = (k / 16) * TAU, r = k % 2 ? radius * 0.52 : radius;
      const p = c.clone().addScaledVector(u, Math.cos(a) * r).addScaledVector(w, Math.sin(a) * r).addScaledVector(n, 0.003);
      return silver.point(p.x, p.y, p.z);
    });
    const tip = c.clone().addScaledVector(n, 0.011);
    silver.fan(silver.point(tip.x, tip.y, tip.z), ring, () => n.toArray());
    button(medal, c.clone().addScaledVector(n, 0.009), n, radius * 0.3);
  };
  star(0.1, 1.325, 0.034);
  star(-0.1, 1.3, 0.03);
  return assemble('nisanlar', [
    [medal, brass()], [silver, new THREE.MeshStandardMaterial({ name: 'gumus', color: 0x9a9a94, roughness: 0.4, metalness: 0.8, side: THREE.DoubleSide })],
    [ribbons[0], cloth('kurdele_kirmizi', 0x7a1f1c)], [ribbons[1], cloth('kurdele_yesil', 0x1f4a36)], [ribbons[2], cloth('kurdele_mavi', 0x2a3f5c)],
  ]);
}

// ---------- Kemer ----------
export function buildKemer(material = gold('kemer_sirma'), gap = 0.03) {
  const belt = new Surface(), metal = new Surface();
  const B = { bottom: 1.055, width: 0.05, gap };
  const radius = (a) => {
    let r = 0;
    for (let y = B.bottom - 0.02; y <= B.bottom + B.width + 0.0201; y += 0.02) r = Math.max(r, reach(M.body, y, CEKET.cx, CEKET.cz, Math.cos(a), Math.sin(a)));
    return r + B.gap;
  };
  let previous = null;
  for (const [h, extra] of [[-0.002, -0.004], [0, 0], [B.width, 0], [B.width + 0.002, -0.004]]) {
    const ring = Array.from({ length: 40 }, (_, k) => {
      const a = (k / 40) * TAU, r = radius(a) + extra;
      return belt.point(CEKET.cx + Math.cos(a) * r, B.bottom + h, CEKET.cz + Math.sin(a) * r);
    });
    if (previous) belt.strip(previous, ring, true, awayFromAxis(CEKET.cx, CEKET.cz));
    previous = ring;
  }
  const z = CEKET.cz + radius(Math.PI / 2), y = B.bottom + B.width / 2;
  const corners = (dz, grow) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => metal.point(a * 0.03 * grow, y + b * 0.031 * grow, z + dz));
  const back = corners(0, 1), face = corners(0.007, 0.9);
  metal.strip(back, face, true, (x, yy) => [x, yy - y, 0]);
  const start = metal.indices.length;
  metal.indices.push(face[0], face[1], face[2], face[0], face[2], face[3]);
  metal.orient(start, () => [0, 0, 1]);
  return assemble('kemer', [[belt, material], [metal, brass()]]);
}

const PANTOLON = {
  name: 'salvar', color: 0x141a28, top: 1.04, crotch: 0.84, cx: 0, cz: -0.04,
  ease: [[0.075, 0.022], [0.2, 0.018], [0.4, 0.016], [0.5, 0.012], [0.66, 0.011], [0.76, 0.012], [0.96, 0.015], [1.0, 0.013], [1.04, 0.013]],
  legRows: [0.075, 0.078, 0.13, 0.2, 0.28, 0.36, 0.43, 0.48, 0.52, 0.56, 0.6, 0.65, 0.7, 0.755, 0.8, 0.84],
  hipRows: [0.88, 0.92, 0.96, 0.98, 1.0, 1.02, 1.04],
  legFold: 0.002, hipFold: 0.002,
};

export function createPasaUniforma() {
  const root = new THREE.Group();
  root.name = 'pasa_uniforma';
  root.add(buildCeket(), buildApoletler(), buildKordon(), buildNisanKusagi(), buildNisanlar(), buildKemer(), buildTrousers(PANTOLON), buildAyakkabi());
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
