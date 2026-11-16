import * as THREE from 'three';
import M from './manken_olcu.js';
import { Surface, headRadius } from './outfit.js';
import { seeded } from './paint.js';

// Osmanlı fesi; manken_erkek.glb'nin başına oturur (ölçüler manken_olcu.js'ten). Yukarı doğru hafifçe
// daralan, tepesi düz, 12 cm yüksekliğinde bordo keçe gövde; hafifçe arkaya yatık durur. Tepenin
// ortasında 1 cm'lik düğme ve ondan arkaya sarkan 13 cm'lik siyah ipek püskül.
// Mankenle aynı konum: 1 birim = 1 metre, Y yukarı, yüz +Z'ye bakar. Yalnız dış yüzeyler.

const TAU = Math.PI * 2;
const HEAD = M.head;
const FES = {
  center: [HEAD.cx, 1.752, HEAD.cz], // alt kenar düzleminin başın eksenini kestiği yer
  tilt: 0.14, // arkaya yatıklık (eğim): önde alnın üst kısmı, arkada başın arkası
  height: 0.12,
  taper: 0.85, // tepe çapı / alt çap
  gap: 0.004, // keçenin baştan payı
};
const v = (x, y, z) => new THREE.Vector3(x, y, z);

export function createFes() {
  const C = v(...FES.center);
  const axis = v(0, 1, -FES.tilt).normalize(); // fesin ekseni: yukarı ve hafifçe arkaya
  const backward = v(0, -FES.tilt, -1).normalize(); // alt kenar düzleminde arkaya doğru
  const sideways = v(1, 0, 0);

  // Alt kenar: yatık düzlemin başı kestiği çizgi, başın o yüksekliklerdeki çevresine oturur
  const SEG = 32;
  const rim = [];
  for (let k = 0; k < SEG; k++) {
    const a = (k / SEG) * TAU;
    let r = 0.09, y = C.y;
    for (let it = 0; it < 4; it++) {
      y = C.y + FES.tilt * r * Math.sin(a);
      r = headRadius(y, a) + FES.gap;
    }
    rim.push(r);
  }
  // Fes sert keçedir: alt kenarı başın her girintisini izlemez, düzgün bir oval olur. Yarıçaplar
  // komşularıyla yumuşatılır, sonra hiçbir yerde başın içine girmeyecek kadar genişletilir.
  const smooth = rim.map((_, k) => [-2, -1, 0, 1, 2].reduce((sum, d) => sum + rim[(k + d + SEG) % SEG], 0) / 5);
  const widen = Math.max(...rim.map((r, k) => r - smooth[k]));
  for (let k = 0; k < SEG; k++) {
    const a = (k / SEG) * TAU;
    const r = smooth[k] + widen;
    rim[k] = v(C.x + Math.cos(a) * r, C.y + FES.tilt * r * Math.sin(a), C.z + Math.sin(a) * r);
  }
  const top = C.clone().addScaledVector(axis, FES.height);
  const level = (t) => rim.map((p) => p.clone().sub(C).multiplyScalar(1 + (FES.taper - 1) * t).add(C).addScaledVector(axis, FES.height * t));

  const felt = new Surface();
  const add = (s, p) => s.point(p.x, p.y, p.z);
  const outward = (x, y, z) => {
    const d = v(x, y, z).sub(C);
    return d.addScaledVector(axis, -d.dot(axis)).toArray();
  };
  let previous = null;
  for (const t of [0, 0.5, 1]) {
    const ring = level(t).map((p) => add(felt, p));
    if (previous) felt.strip(previous, ring, true, outward);
    previous = ring;
  }
  // Düz tepe: kenarı keskin kalsın diye kendi köşeleriyle
  const lid = level(1).map((p) => add(felt, p));
  felt.fan(add(felt, top), lid, () => axis.toArray());
  // Düğme: tepenin ortasında 1 cm'lik küçük silindir, ucu yuvarlak
  const button = (h, r) => Array.from({ length: 8 }, (_, k) => {
    const a = (k / 8) * TAU;
    return add(felt, top.clone().addScaledVector(axis, h).addScaledVector(sideways, Math.cos(a) * r).addScaledVector(backward, Math.sin(a) * r));
  });
  const b0 = button(0, 0.006), b1 = button(0.008, 0.006);
  const fromAxis = (x, y, z) => {
    const d = v(x, y, z).sub(top);
    return d.addScaledVector(axis, -d.dot(axis)).toArray();
  };
  felt.strip(b0, b1, true, fromAxis);
  felt.fan(add(felt, top.clone().addScaledVector(axis, 0.01)), b1, () => axis.toArray());

  // Püskül: düğmeden çıkıp tepenin üstünden arkaya uzanan, kenardan aşağı sarkan ince teller
  const tassel = new Surface();
  const rand = seeded(1914);
  const range = (a, b) => a + rand() * (b - a);
  const backRim = rim[Math.round(SEG * 0.75)]; // tam arkadaki alt kenar noktası
  const edge = backRim.clone().sub(C).multiplyScalar(FES.taper).add(top); // tepenin arka kenarı
  const edgeDistance = edge.clone().sub(top).length();
  const down = backRim.clone().sub(edge).normalize(); // arka yüz boyunca aşağı
  const off = backward.clone().addScaledVector(down, -backward.dot(down)).normalize(); // arka yüzden dışarı
  const STRANDS = 18;
  const LENGTH = 0.13;
  for (let i = 0; i < STRANDS; i++) {
    const spread = (i / (STRANDS - 1) - 0.5) * 0.014 + range(-0.0015, 0.0015); // kenardaki yanal yeri: sıkı bir demet
    const lift = range(0.0025, 0.006); // keçeden yükseklik: teller üst üste biner
    const hang = LENGTH - edgeDistance - 0.01 + range(-0.01, 0.006);
    const path = [];
    for (const t of [0, 0.3, 0.65, 0.95]) {
      // Tepenin üstünde: düğmenin başından keçeye iner, kenara doğru yayılır
      path.push(top.clone().addScaledVector(backward, edgeDistance * t).addScaledVector(sideways, spread * t).addScaledVector(axis, lift + (0.0105 - lift * 0.5) * (1 - t) ** 3)); // düğmenin tepesinden başlar
    }
    path.push(edge.clone().addScaledVector(sideways, spread).addScaledVector(axis, lift + 0.002).addScaledVector(off, lift + 0.004)); // kenardan dönüş
    const sway = range(-0.004, 0.004);
    for (const t of [0.2, 0.45, 0.7, 1]) {
      // Arka yüzde aşağı sarkar: uçlara doğru hafif açılır ve dalgalanır
      path.push(edge.clone().addScaledVector(down, hang * t).addScaledVector(sideways, spread * (1 + 1.6 * t) + sway * t).addScaledVector(off, lift + 0.003 + 0.004 * t));
    }
    // Her tel üç yüzlü ince bir çubuk
    const RADIUS = 0.0015;
    let before = null;
    path.forEach((p, n) => {
      const dir = (path[Math.min(n + 1, path.length - 1)].clone().sub(path[Math.max(n - 1, 0)])).normalize();
      const u = v(1, 0, 0).addScaledVector(dir, -dir.x).normalize();
      const w = dir.clone().cross(u);
      const ring = [0, 1, 2].map((k) => add(tassel, p.clone().addScaledVector(u, Math.cos((k / 3) * TAU) * RADIUS).addScaledVector(w, Math.sin((k / 3) * TAU) * RADIUS)));
      if (before) {
        const c = p;
        tassel.strip(before, ring, true, (x, y, z) => [x - c.x, y - c.y, z - c.z]);
      }
      before = ring;
    });
  }

  // Tek ağ, iki malzeme: bordo keçe ve siyah püskül
  const base = felt.positions.length / 3;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([...felt.positions, ...tassel.positions], 3));
  geometry.setIndex([...felt.indices, ...tassel.indices.map((i) => i + base)]);
  geometry.addGroup(0, felt.indices.length, 0);
  geometry.addGroup(felt.indices.length, tassel.indices.length, 1);
  geometry.computeVertexNormals();
  const material = (name, color) => new THREE.MeshStandardMaterial({ name, color, roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, [material('fes_kece', 0x6b1420), material('puskul', 0x0a0a0a)]);
  mesh.name = 'fes';
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
