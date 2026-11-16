import * as THREE from 'three';
import M from './manken_olcu.js';
import { Surface, cloth, awayFromAxis, reach, sliceCenter, buildTrousers, S, clamp, TAU } from './outfit.js';
import { brass, bodyNormal, assemble } from './outfit2.js';
import { jacketFabric, collarTop, button, patchOf, castToCeket, onChest, skirtRadius, ARM, CEKET } from './outfit3.js';

// Osmanlı subayı (zabit) üniforması, 1900'lerin başı; manken_erkek.glb'nin üstüne oturur.
// Dört parça: ceket, kemer, salvar, ayakkabi. Fes ayrı dosyada; kılıç ve eldiven yok.
// Mankenle aynı konum ve T duruşu: 1 birim = 1 metre, Y yukarı, yüz +Z; mankenin sağı -X, solu +X.
// Kollar dar olduğu için gömleği çıkarılmış manken kopyasıyla kullanılır.

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const NAVY = 0x1c2738, RED = 0x7a1f1c, GOLD = 0x8f7a3a;

// ---------- Ceket ----------
// Lacivert, uyluğun ortasına inen kruvaze (çift sıra düğmeli) ceket: alçak dik yaka, yukarıdan
// bele doğru birbirine yaklaşan iki sıra pirinç düğme, ön kapama kenarında kırmızı biye, kol
// ağzında sırma şerit.
const HEM = 0.78;
const COLLAR = { drop: 0.05, from: -0.03, to: 0.05 }; // önde çenenin altında alçalır
function buildCeket() {
  const fabric = jacketFabric([[1.1, 0.018], [1.06, 0.019], [1.01, 0.02], [0.965, 0.021], [0.91, 0.023], [0.85, 0.026], [HEM, 0.03], [HEM - 0.003, 0.025]], COLLAR);
  const red = new Surface(), gold = new Surface(), metal = new Surface();
  const front = () => [0, 0, 1];

  // İki sıra düğme: omuzda açık, belde yakın; etekte birer düğme daha
  const rowX = (y) => 0.04 + 0.055 * S(1.1, 1.5, y);
  for (const y of [1.5, 1.435, 1.37, 1.305, 1.24, 1.175, 1.115]) {
    for (const side of [-1, 1]) {
      const c = onChest(side * rowX(y), y, 0);
      button(metal, c, bodyNormal(c), 0.008);
    }
  }
  const onSkirt = (x, y, lift) => {
    let a = Math.PI / 2;
    for (let i = 0; i < 4; i++) a = Math.acos(clamp(x / skirtRadius(y, a, 0.02), -1, 1));
    const gap = 0.019 + 0.011 * S(1.06, HEM, y) + lift;
    const r = skirtRadius(y, a, gap);
    return v3(CEKET.cx + Math.cos(a) * r, y, CEKET.cz + Math.sin(a) * r);
  };
  for (const side of [-1, 1]) button(metal, onSkirt(side * 0.04, 0.99, 0.004), v3(0, 0, 1), 0.008);

  // Ön kapama kenarındaki kırmızı biye: sol düğme sırasının dışından etek ucuna iner
  const edgeX = (y) => rowX(Math.max(y, 1.1)) + 0.022;
  patchOf(red, Array.from({ length: 15 }, (_, i) => 1.52 - i * 0.03).map((y) => [-0.004, 0.004].map((dx) => onChest(edgeX(y) + dx, y, 0.006))), front);
  patchOf(red, [1.045, 1.01, 0.98, 0.95, 0.92, 0.89, 0.86, 0.83, 0.8, HEM].map((y) => [-0.004, 0.004].map((dx) => onSkirt(edgeX(y) + dx, y, 0.006))), front);

  // Yaka şeridi: dik yakanın üst kenarı boyunca sırma
  const NECK = v3(0, 0, -0.045);
  const band = [0.003, 0.014].map((below) => Array.from({ length: 24 }, (_, k) => {
    const dir = v3(Math.cos((k / 24) * TAU), 0, Math.sin((k / 24) * TAU));
    let p = castToCeket(v3(0, 1.57, NECK.z), dir, 0.003);
    for (let i = 0; i < 3; i++) p = castToCeket(v3(0, collarTop(p.z) - below, NECK.z), dir, 0.003);
    return gold.point(p.x, p.y, p.z);
  }));
  gold.strip(band[0], band[1], true, (x, y, z) => [x, 0, z - NECK.z]);

  for (const side of [-1, 1]) {
    // Kol ağzı: sırma şerit ve üstünde ince kırmızı çizgi
    const ring = (s, x, lift) => Array.from({ length: 16 }, (_, k) => {
      const a = (k / 16) * TAU;
      const p = castToCeket(v3(side * x, ARM.y, ARM.z), v3(0, Math.cos(a), Math.sin(a)), lift);
      return s.point(p.x, p.y, p.z);
    });
    const away = (x, y, z) => [0, y - ARM.y, z - ARM.z];
    gold.strip(ring(gold, 0.668, 0.003), ring(gold, 0.7, 0.003), true, away);
    red.strip(ring(red, 0.656, 0.003), ring(red, 0.664, 0.003), true, away);
    // Omuzda küçük düğme
    button(metal, castToCeket(v3(side * 0.115, 1.4, -0.055), v3(0, 1, 0), 0.002), v3(0, 1, 0), 0.006);
  }
  return assemble('ceket', [[fabric, cloth('ceket', NAVY)], [red, cloth('ceket_biye', RED)], [gold, cloth('ceket_sirma', GOLD)], [metal, brass()]]);
}

// ---------- Kemer ----------
// Ceketin üstünde, belde 3,5 cm'lik ince koyu kemer; önde küçük pirinç toka.
function buildKemer() {
  const leather = new Surface(), metal = new Surface();
  const B = { bottom: 1.062, width: 0.035, gap: 0.027 };
  const radius = (a) => {
    let r = 0;
    for (let y = B.bottom - 0.02; y <= B.bottom + B.width + 0.0201; y += 0.02) r = Math.max(r, reach(M.body, y, CEKET.cx, CEKET.cz, Math.cos(a), Math.sin(a)));
    return r + B.gap;
  };
  let previous = null;
  for (const [h, extra] of [[-0.002, -0.004], [0, 0], [B.width, 0], [B.width + 0.002, -0.004]]) {
    const ring = Array.from({ length: 40 }, (_, k) => {
      const a = (k / 40) * TAU, r = radius(a) + extra;
      return leather.point(CEKET.cx + Math.cos(a) * r, B.bottom + h, CEKET.cz + Math.sin(a) * r);
    });
    if (previous) leather.strip(previous, ring, true, awayFromAxis(CEKET.cx, CEKET.cz));
    previous = ring;
  }
  // Toka: önde ortada küçük dikdörtgen levha
  const z = CEKET.cz + radius(Math.PI / 2), y = B.bottom + B.width / 2;
  const corners = (dz) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => metal.point(a * 0.022, y + b * 0.021, z + dz));
  const back = corners(0), face = corners(0.005);
  metal.strip(back, face, true, (x, yy) => [x, yy - y, 0]);
  const start = metal.indices.length;
  metal.indices.push(face[0], face[1], face[2], face[0], face[2], face[3]);
  metal.orient(start, () => [0, 0, 1]);
  return assemble('kemer', [[leather, cloth('kemer_deri', 0x14110f)], [metal, brass()]]);
}

// ---------- Şalvar (subay pantolonu) ----------
// Düz kesim, bileğe kadar inen lacivert pantolon; mankenin çizmesinin koncunu da içine alır.
const PANTOLON = {
  name: 'salvar', color: 0x182132, top: 1.04, crotch: 0.84, cx: 0, cz: -0.04,
  ease: [[0.075, 0.022], [0.2, 0.018], [0.4, 0.016], [0.5, 0.012], [0.66, 0.011], [0.76, 0.012], [0.96, 0.015], [1.0, 0.013], [1.04, 0.013]],
  legRows: [0.075, 0.078, 0.13, 0.2, 0.28, 0.36, 0.43, 0.48, 0.52, 0.56, 0.6, 0.65, 0.7, 0.755, 0.8, 0.84],
  hipRows: [0.88, 0.92, 0.96, 0.98, 1.0, 1.02, 1.04],
  legFold: 0.002, hipFold: 0.002,
};

// ---------- Ayakkabı ----------
// Alçak siyah deri ayakkabı; üstü pantolon paçasının içinde kalır, mankenin çizmesinin ayağını örter.
function buildAyakkabi() {
  const s = new Surface();
  const N = 24;
  for (const side of [1, -1]) {
    const table = side > 0 ? M.legRight : M.legLeft;
    const rows = [[0, 0.022], [0.022, 0.022], [0.024, 0.018], [0.04, 0.019], [0.05, 0.019], [0.06, 0.019], [0.075, 0.018], [0.09, 0.017], [0.11, 0.015]].map(([y, gap]) => {
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
          return s.point(side * Math.max(Math.min(0.006, innerX - 0.002), side * (cx + dx * r)), y, cz + dz * r);
        }),
      };
    });
    for (let j = 1; j < rows.length; j++) s.strip(rows[j - 1].ids, rows[j].ids, true, awayFromAxis(rows[j].cx, rows[j].cz));
  }
  const mesh = new THREE.Mesh(s.geometry(), cloth('ayakkabi', 0x121110));
  mesh.name = 'ayakkabi';
  return mesh;
}

export function createOfficerOutfit() {
  const root = new THREE.Group();
  root.name = 'zabit_kiyafet';
  root.add(buildCeket(), buildKemer(), buildTrousers(PANTOLON), buildAyakkabi());
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
