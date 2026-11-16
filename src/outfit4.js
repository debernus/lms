import * as THREE from 'three';
import M from './manken_olcu.js';
import { Surface, cloth, awayFromAxis, reach, sliceCenter, buildTrousers, S, clamp, TAU } from './outfit.js';
import { brass, bodyNormal, castOut, settle, assemble } from './outfit2.js';
import { jacketFabric, button, patchOf, castToCeket, onChest, skirtRadius, ARM, CEKET } from './outfit3.js';

// Osmanlı süvari (mızraklı) eri üniforması, 1900'lerin başı; manken_erkek.glb'nin üstüne oturur.
// Dört parça: ceket, omuz_kusagi, salvar, cizme. Fes ayrı dosyada; kılıç ve mızrak yok.
// Mankenle aynı konum ve T duruşu: 1 birim = 1 metre, Y yukarı, yüz +Z; mankenin sağı -X, solu +X.
// Kollar dar olduğu için gömleği çıkarılmış manken kopyasıyla kullanılır.

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const RED = 0x7a1f1c;

// ---------- Ceket ----------
// Koyu yeşil, uyluğun üstüne inen uzun ceket: kırmızı dik yaka, göğüste beş sıra kırmızı kordon ve
// pirinç düğmeler, kırmızı kol kapakları ve apoletler, sol göğüste madalya.
const HEM = 0.86;
function buildCeket() {
  const fabric = jacketFabric([[1.1, 0.018], [1.06, 0.019], [1.01, 0.02], [0.965, 0.021], [0.91, 0.023], [HEM, 0.026], [HEM - 0.003, 0.021]]);
  const red = new Surface(), metal = new Surface();
  const front = () => [0, 0, 1];

  // Göğüs kordonları: orta düğmeden iki yana uzanan, uçlara doğru incelen yatay şeritler
  [1.5, 1.425, 1.35, 1.275, 1.2].forEach((y, i) => {
    const half = 0.115 - i * 0.008;
    const xs = [-1, -0.6, -0.2, 0.2, 0.6, 1].map((t) => t * half);
    patchOf(red, [0.008, -0.008].map((dy) => xs.map((x) => onChest(x, y + dy * (1 - 0.5 * Math.abs(x) / half), 0.004))), front);
    const c = onChest(0, y, 0.004);
    button(metal, c, bodyNormal(c));
    for (const side of [-1, 1]) {
      const e = onChest(side * half, y, 0.004);
      button(metal, e, bodyNormal(e), 0.005);
    }
  });
  // Madalya: sol göğüste küçük pirinç disk
  const medal = onChest(0.085, 1.39, 0.002);
  button(metal, medal, bodyNormal(medal), 0.012);

  // Dik yaka: boynu saran kırmızı şerit
  const NECK = v3(0, 0, -0.045);
  const collar = [0, 1].map((top) => Array.from({ length: 24 }, (_, k) => {
    const a = (k / 24) * TAU;
    const dir = v3(Math.cos(a), 0, Math.sin(a));
    const z = NECK.z + 0.06 * Math.sin(a);
    const y = top ? CEKET.collar - 0.004 - 0.03 * S(0, 0.04, z) : 1.574 - 0.022 * S(0, 0.04, z);
    const p = castToCeket(v3(0, y, NECK.z), dir, 0.003);
    return red.point(p.x, p.y, p.z);
  }));
  red.strip(collar[0], collar[1], true, (x, y, z) => [x, 0, z - NECK.z]);

  for (const side of [-1, 1]) {
    // Kol kapağı: bilekte 6 cm'lik kırmızı şerit
    const rings = [0.652, 0.682, 0.713].map((x) => Array.from({ length: 16 }, (_, k) => {
      const a = (k / 16) * TAU;
      const p = castToCeket(v3(side * x, ARM.y, ARM.z), v3(0, Math.cos(a), Math.sin(a)), 0.003);
      return red.point(p.x, p.y, p.z);
    }));
    const away = (x, y, z) => [0, y - ARM.y, z - ARM.z];
    red.strip(rings[0], rings[1], true, away);
    red.strip(rings[1], rings[2], true, away);
    // Apolet: omuzda kırmızı şerit, yaka ucunda düğmesi
    const strap = (x, z) => castToCeket(v3(x, 1.4, z), v3(0, 1, 0), 0.005);
    patchOf(red, [-0.022, 0, 0.022].map((dz) => [0.1, 0.125, 0.15, 0.175, 0.195].map((x) => strap(side * x, -0.055 + dz))), () => [0, 1, 0]);
    button(metal, strap(side * 0.112, -0.055), v3(0, 1, 0), 0.006);
  }
  // Etekte, kordonların altında iki düğme daha
  for (const y of [1.0, 0.92]) button(metal, v3(0, y, CEKET.cz + skirtRadius(y, Math.PI / 2, 0.0235)), v3(0, 0, 1));

  return assemble('ceket', [[fabric, cloth('ceket', 0x1f3a36)], [red, cloth('ceket_kirmizi', RED)], [metal, brass()]]);
}

// ---------- Omuz kuşağı ----------
// Sol omuzdan sağ kalçaya çapraz inen, cekete yapışık yassı kumaş şerit: 7 cm eninde, gri, iki
// kenarında kırmızı şerit. Gövdeyi dolanan kapalı bir halkadır; ceketin 9 mm üstünde durur.
function buildOmuzKusagi() {
  const grey = new Surface(), red = new Surface();
  const WIDTH = 0.07, EDGE = 0.012, OFFSET = 0.013 + 0.009; // kordonların ve düğmelerin üstünde
  const shoulder = v3(0.135, 1.53, -0.045), hip = v3(-0.165, 1.14, -0.03);
  const along = hip.clone().sub(shoulder).normalize();
  const depth = v3(0, 0, 1);
  const across = along.clone().cross(depth).normalize(); // şeridin eni bu yönde
  const center = shoulder.clone().lerp(hip, 0.5);
  const K = 72;
  const offsets = [-WIDTH / 2, -WIDTH / 2 + EDGE, 0, WIDTH / 2 - EDGE, WIDTH / 2];
  const rows = { grey: [], red: [] };
  for (let k = 0; k < K; k++) {
    const phi = (k / K) * TAU;
    const mid = castOut(center, along.clone().multiplyScalar(Math.cos(phi)).addScaledVector(depth, Math.sin(phi)), OFFSET);
    const points = offsets.map((o) => (o === 0 ? mid : settle(mid.clone().addScaledVector(across, o), OFFSET)));
    rows.grey.push(points.map((p) => grey.point(p.x, p.y, p.z)));
    rows.red.push(points.map((p) => red.point(p.x, p.y, p.z)));
  }
  const outward = (x, y, z) => [x - center.x, y - center.y, z - center.z];
  for (let c = 0; c < 4; c++) {
    const edge = c === 0 || c === 3;
    const s = edge ? red : grey, r = edge ? rows.red : rows.grey;
    s.strip(r.map((row) => row[c]), r.map((row) => row[c + 1]), true, outward);
  }
  return assemble('omuz_kusagi', [[grey, cloth('kusak_gri', 0x6c6c63)], [red, cloth('kusak_kirmizi', RED)]]);
}

// ---------- Şalvar (süvari pantolonu) ----------
const PANTOLON = {
  name: 'salvar', color: 0x18292a, top: 1.04, crotch: 0.84, cx: 0, cz: -0.04,
  ease: [[0.455, 0.008], [0.5, 0.009], [0.56, 0.01], [0.66, 0.011], [0.76, 0.012], [0.96, 0.015], [1.0, 0.013], [1.04, 0.013]],
  legRows: [0.455, 0.48, 0.51, 0.54, 0.585, 0.64, 0.7, 0.755, 0.8, 0.84],
  hipRows: [0.88, 0.92, 0.96, 0.98, 1.0, 1.02, 1.04],
  legFold: 0.002, hipFold: 0.002,
};

// ---------- Çizme ----------
// Dize kadar çıkan siyah deri süvari çizmesi; mankenin çizmesini ve pantolon paçasını içine alır.
function buildCizme() {
  const s = new Surface();
  const N = 24;
  for (const side of [1, -1]) {
    const table = side > 0 ? M.legRight : M.legLeft;
    const ring = (y, gap) => {
      const [cx, cz] = sliceCenter(table, y);
      let innerX = Infinity;
      for (const d of [-0.01, 0.01]) {
        const hull = table.hulls[clamp(Math.round((y + d) / table.dy), 0, table.hulls.length - 1)];
        for (let i = 0; i < hull.length; i += 2) innerX = Math.min(innerX, side * hull[i]);
      }
      return {
        cx, cz,
        ids: Array.from({ length: N }, (_, i) => {
          const a = (i / N) * TAU;
          const dx = side * Math.cos(a), dz = Math.sin(a);
          const r = reach(table, y, cx, cz, dx, dz) + gap;
          const x = side * Math.max(Math.min(0.006, innerX - 0.002), side * (cx + dx * r)); // iki bacak değmesin
          return s.point(x, y, cz + dz * r);
        }),
      };
    };
    // Kalın taban, saya, bilekte hafif büzülme, dize doğru düz konç; üst kenarı içe döner
    const rows = [[0, 0.024], [0.026, 0.024], [0.028, 0.019], [0.04, 0.02], [0.05, 0.02], [0.06, 0.02], [0.075, 0.019], [0.09, 0.018], [0.11, 0.016], [0.14, 0.015], [0.2, 0.014], [0.28, 0.014], [0.36, 0.015], [0.43, 0.017], [0.5, 0.019], [0.503, 0.012]].map(([y, gap]) => ring(y, gap));
    for (let j = 1; j < rows.length; j++) s.strip(rows[j - 1].ids, rows[j].ids, true, awayFromAxis(rows[j].cx, rows[j].cz));
  }
  const mesh = new THREE.Mesh(s.geometry(), cloth('cizme', 0x131211));
  mesh.name = 'cizme';
  return mesh;
}

export function createCavalryOutfit() {
  const root = new THREE.Group();
  root.name = 'suvari_kiyafet';
  root.add(buildCeket(), buildOmuzKusagi(), buildTrousers(PANTOLON), buildCizme());
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
