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

  // --- Yaka: büyük devrik kaput yakası. Boynu yüksekten saran dik bölüm, üstünden dışa devrilip omuzlara
  // ve göğse yayılan geniş bordo kanatlar; önde iki sivri uç, boğazda V biçiminde açıklık ---
  const ray = new THREE.Raycaster();
  // Kaputun yüzeyinde, (açı, yarıçap, yükseklik) hedefine dışarıdan bakınca görülen nokta
  const onCoat = (a, rho, y, lift) => {
    const eye = v3(Math.cos(a) * 0.5, 1.8, NZ + Math.sin(a) * 0.5), target = v3(Math.cos(a) * rho, y, NZ + Math.sin(a) * rho);
    ray.set(eye, target.clone().sub(eye).normalize());
    const hit = ray.intersectObject(probe)[0];
    if (!hit) return target;
    const n = hit.face.normal.clone();
    if (n.dot(ray.ray.direction) > 0) n.negate();
    return hit.point.clone().addScaledVector(n, lift);
  };
  const coatTop = (x, z) => {
    ray.set(v3(x, 1.75, z), v3(0, -1, 0));
    const hit = ray.intersectObject(probe)[0];
    return hit ? hit.point.y : 0;
  };
  const collar = new Surface(), COLS = 44, GAP = 0.07;
  const grid = Array.from({ length: COLS + 1 }, (_, k) => {
    const a = Math.PI / 2 + GAP + ((TAU - 2 * GAP) * k) / COLS, dz = Math.sin(a);
    const theta = Math.min(k, COLS - k) * ((TAU - 2 * GAP) / COLS) + GAP, side = k < COLS / 2 ? 1 : -1; // ön ortadan açısal uzaklık
    const wing = Math.max(0, 1 - theta / 1.45) ** 1.1; // öne doğru büyüyen kanat
    const base = neckline(dz), top = base + 0.03 - 0.008 * S(0.3, 1, dz);
    const at3 = (r, y) => v3(Math.cos(a) * r, y, NZ + dz * r);
    const column = [at3(R + 0.002, base - 0.006), at3(R, top - 0.012), at3(R + 0.001, top), at3(R + 0.008, top + 0.003)];
    // Kanat: devrim çizgisinden uca; öne yakın sütunlar yana doğru açılarak sivri ucu oluşturur
    const tipAngle = a + side * 0.2 * wing, tipRho = R + 0.023 + 0.04 * wing, tipY = base - 0.013 - 0.036 * wing;
    // Yaprak devrim çizgisinden uca düz iner; hiçbir noktası kaputun yüzeyinin altına girmez
    for (const f of [0.34, 0.67, 1]) {
      const aa = a + (tipAngle - a) * f ** 1.2, rho = R + 0.008 + (tipRho - R - 0.008) * f;
      const x = Math.cos(aa) * rho, z = NZ + Math.sin(aa) * rho;
      column.push(v3(x, Math.max(top + 0.003 + (tipY - top - 0.003) * f, coatTop(x, z) + 0.006), z));
    }
    return column;
  });
  for (let j = 1; j < grid[0].length; j++) {
    collar.strip(grid.map((c) => collar.point(c[j - 1].x, c[j - 1].y, c[j - 1].z)), grid.map((c) => collar.point(c[j].x, c[j].y, c[j].z)), false, (x, y, z) => [x, 0.8, z - NZ]);
  }
  // Kanatlarda küçük gümüş rütbe işareti
  const pips = new Surface();
  for (const k of [3, COLS - 3]) {
    const c = grid[k], p = c[5].clone().lerp(c[6], 0.45), n = c[6].clone().sub(c[5]).cross(grid[k + 1][5].clone().sub(c[5])).normalize();
    if (n.z < 0) n.negate();
    button(pips, p.addScaledVector(n, 0.002), n, 0.006);
  }
  root.add(build('yaka', [[collar, cloth('yaka_bordo', BORDO), null], [pips, new THREE.MeshStandardMaterial({ name: 'gumus_isaret', color: 0x9a9a94, roughness: 0.5, metalness: 0.7 }), null]]));

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
