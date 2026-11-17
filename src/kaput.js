import * as THREE from 'three';
import { Surface, cloth, buildTrousers, S, TAU } from './outfit.js';
import { button, patchOf, ARM } from './outfit3.js';
import { buildAyakkabi } from './outfit5.js';
import { build } from './halk2.js';
import { buildKemer } from './pasa.js';
import { coatShell } from './sirmali.js';

// Uzun asker kaputu (1910'lar): haki yeşil, mat çuha; baldıra inen etek, boğaza kadar kapalı ön,
// bordo devrik yaka, bordo kemer ve pirinç toka. Parçalar: kaput, yaka, kemer, dugmeler, pantolon,
// ayakkabi. manken_erkek.glb'nin üstüne oturur (gömleksiz kopyayla); konum ve ölçek mankenle aynı.

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const HAKI = 0x4d5338, BORDO = 0x521219, HEM = 0.36;

export function createKaput() {
  const root = new THREE.Group();
  root.name = 'kaput_takim';
  const { fabric, at, onJacket, angles, R, NZ, neckline, sleeveR, AY, fromArm, probe } = coatShell({
    offset: 0.046, rows: [HEM, 0.44, 0.52, 0.6, 0.68, 0.76, 0.84, 0.92, 0.98, 1.04], flare: 0.075, sleeve: 0.096,
  });
  // Kol kapakları: bilekte geriye katlanmış geniş bant (aynı çuha, bir ton koyu)
  const cuffs = new Surface();
  for (const side of [-1, 1]) {
    const rings = [0.585, 0.59, 0.64, 0.692, 0.692].map((x, j) => Array.from({ length: 16 }, (_, k) => {
      const a = (k / 16) * TAU, r = sleeveR(x) + (j === 0 ? 0.001 : j === 4 ? -0.006 : 0.006);
      return cuffs.point(side * x, AY + Math.cos(a) * r, ARM.z + Math.sin(a) * r);
    }));
    for (let j = 1; j < rings.length; j++) cuffs.strip(rings[j - 1], rings[j], true, fromArm);
  }
  // Ön kapama: sağ yaka sola biner; yakadan etek ucuna inen ince kat çizgisi
  const seam = new Surface();
  const X0 = 0.045;
  const upper = [];
  for (let y = 1.47; y > 1.11; y -= 0.04) upper.push([0, 0.012].map((dx) => onJacket(X0 + dx, y, dx ? 0.0005 : 0.006).p));
  patchOf(seam, upper, () => [1, 0, 0.3]);
  const lower = [1.05, 0.98, 0.9, 0.8, 0.7, 0.6, 0.5, 0.42, HEM + 0.004].map((y) => [0.33, 0.42].map((da, i) => at(Math.PI / 2 - da, y, i ? 0.0005 : 0.006)));
  patchOf(seam, lower, () => [1, 0, 0.3]);
  root.add(build('kaput', [[fabric, cloth('kaput_cuha', HAKI), null], [cuffs, cloth('kaput_kol_kapagi', 0x454b32), null], [seam, cloth('kaput_kat', 0x454b32), null]]));

  // --- Yaka: boynu saran dik bant ve üstünden dışa devrilen bordo yaka; önde iki sivri uç ---
  const down = new THREE.Raycaster();
  const fabricTop = (x, z) => {
    down.set(v3(x, 1.75, z), v3(0, -1, 0));
    const hit = down.intersectObject(probe)[0];
    return hit ? hit.point.y : 1.5;
  };
  const collar = new Surface();
  const rows = [[0.002, -0.006, 0], [0.001, 0.016, 0], [-0.001, 0.03, 0], [0.006, 0.033, 0], [0.016, 0.024, 0], [0.026, 0, 1]].map(([dr, h, lay]) => angles.map((a) => {
    const dz = Math.sin(a), tip = S(0.55, 1, dz), r = R + dr + (lay ? 0.014 * tip : 0.004 * tip * (dr > 0.005 ? 1 : 0));
    const x = Math.cos(a) * r, z = NZ + dz * r;
    const y = lay ? Math.max(fabricTop(x, z) + 0.007, neckline(dz) - 0.012 - 0.012 * tip) : neckline(dz) + h * (h > 0 ? 1 - 0.14 * dz : 1);
    return collar.point(x, y, z);
  }));
  const fromNeck = (x, y, z) => [x, 0.6, z - NZ];
  for (let j = 1; j < rows.length; j++) collar.strip(rows[j - 1], rows[j], true, fromNeck);
  root.add(build('yaka', [[collar, cloth('yaka_bordo', BORDO), null]]));

  // --- Düğmeler: ön kapama boyunca tek sıra pirinç düğme ---
  const buttons = new Surface();
  for (const y of [1.43, 1.35, 1.27, 1.19]) {
    const { p, n } = onJacket(X0 - 0.022, y, 0.003);
    button(buttons, p, n, 0.011);
  }
  for (const y of [0.98, 0.88]) button(buttons, at(Math.PI / 2 - 0.2, y, 0.003), v3(0.2, 0, 1).normalize(), 0.011);
  root.add(build('dugmeler', [[buttons, new THREE.MeshStandardMaterial({ name: 'pirinc_dugme', color: 0x7d6a34, roughness: 0.7, metalness: 0.6 }), null]]));

  // --- Bordo kemer, pirinç toka ---
  root.add(buildKemer(new THREE.MeshStandardMaterial({ name: 'kemer_bordo', color: BORDO, roughness: 0.9, metalness: 0, side: THREE.DoubleSide }), 0.06));

  // --- Pantolon ve ayakkabı (eteğin altında görünen bölüm) ---
  root.add(buildTrousers({
    name: 'pantolon', color: 0x3f4530, top: 1.04, crotch: 0.84, cx: 0, cz: -0.04,
    ease: [[0.075, 0.022], [0.2, 0.018], [0.4, 0.016], [0.5, 0.012], [0.66, 0.011], [0.76, 0.012], [0.96, 0.015], [1.0, 0.013], [1.04, 0.013]],
    legRows: [0.075, 0.078, 0.13, 0.2, 0.28, 0.36, 0.43, 0.48, 0.52, 0.56, 0.6, 0.65, 0.7, 0.755, 0.8, 0.84],
    hipRows: [0.88, 0.92, 0.96, 0.98, 1.0, 1.02, 1.04], legFold: 0.002, hipFold: 0.002,
  }));
  root.add(buildAyakkabi());
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
