import * as THREE from 'three';
import { woodTextures, canvasTextures, cobbleTextures } from './geometry.js';

// Pazar tezgahı: eğimli branda çadır, arka direkler, çapraz destekler, arka bez ve öndeki masa.
// Üzerinde ya da önünde hiçbir ürün, kasa, fıçı, sepet yok. Birim metre; ön taraf +Z.

const UP = new THREE.Vector3(0, 1, 0);
const v = (x, y, z) => new THREE.Vector3(x, y, z);

const HALF_WIDTH = 1.6; // direklerin x konumu
const POST_Z = -0.8;
const ROOF_ANGLE = Math.atan2(0.5, 1.8); // ön kenar arkadan 0.5 m yüksek
const ROOF_CENTER = v(0, 2.36, -0.05);

export function createStall() {
  const std = (opts) => new THREE.MeshStandardMaterial(opts);
  const m = {
    frame: std({ ...woodTextures('#a98c63', 0.5), bumpScale: 1.2, roughness: 0.85 }),
    table: std({ ...woodTextures('#6a3d2b', 0.6), bumpScale: 1.4, roughness: 0.7 }),
    tableDark: std({ ...woodTextures('#4a2b20', 0.55), bumpScale: 1.4, roughness: 0.75 }),
    cloth: std({ ...canvasTextures(), bumpScale: 0.6, roughness: 0.95, side: THREE.DoubleSide }),
  };

  const root = new THREE.Group();
  root.name = 'Tezgah';

  const add = (name, geometry, material, parent = root) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    parent.add(mesh);
    return mesh;
  };

  // a'dan b'ye uzanan kereste; damarlar boy yönünde akar.
  const beam = (name, a, b, width, thick, material, parent = root) => {
    const dir = b.clone().sub(a);
    const len = dir.length();
    const geo = new THREE.BoxGeometry(width, len, thick);
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.max(width, thick) * 4, uv.getY(i) * len * 0.8);
    const mesh = add(name, geo, material, parent);
    mesh.position.copy(a).lerp(b, 0.5);
    mesh.quaternion.setFromUnitVectors(UP, dir.normalize());
    return mesh;
  };

  // ================= İskelet =================
  for (const s of [-1, 1]) {
    const side = s < 0 ? 'sol' : 'sag';
    const x = s * HALF_WIDTH;
    beam(`direk-${side}`, v(x, 0, POST_Z), v(x, 2.1, POST_Z), 0.1, 0.1, m.frame);
    // Çapraz destek: önde yerden başlar, direğin üst ucunu dıştan geçerek çadırın arka kenarına uzanır
    const foot = v(x + s * 0.085, 0, 0.78);
    const top = v(x + s * 0.085, 2.14, POST_Z - 0.1);
    beam(`capraz-${side}`, foot, top, 0.07, 0.11, m.frame);
  }
  // Direkleri bağlayan yatay kuşak
  beam('kusak', v(-HALF_WIDTH - 0.13, 1.2, POST_Z + 0.075), v(HALF_WIDTH + 0.13, 1.2, POST_Z + 0.075), 0.11, 0.05, m.frame);

  // Arka bez: çadırın arka kenarından aşağı sarkar
  const backCloth = new THREE.PlaneGeometry(HALF_WIDTH * 2 - 0.1, 1.5, 32, 12);
  const bp = backCloth.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    const px = bp.getX(i);
    const py = bp.getY(i);
    const hang = 0.5 - py / 1.5; // 0 üstte, 1 altta
    bp.setZ(i, 0.018 * Math.sin(px * 7.5) * hang + 0.01 * Math.sin(px * 17 + py * 3) * hang);
  }
  backCloth.computeVertexNormals();
  backCloth.attributes.uv.array.forEach((_, i, a) => (a[i] *= i % 2 ? 1.5 : 3));
  add('arka-bez', backCloth, m.cloth).position.set(0, 1.32, POST_Z - 0.06);

  // ================= Çadır =================
  const roof = new THREE.Group();
  roof.name = 'cadir';
  roof.position.copy(ROOF_CENTER);
  roof.rotation.x = -ROOF_ANGLE; // ön kenar yukarıda
  root.add(roof);
  const RW = 1.8; // yarı genişlik
  const RD = 0.934; // yarı derinlik (eğim boyunca)

  const cloth = new THREE.PlaneGeometry(RW * 2 - 0.04, RD * 2 - 0.04, 36, 18);
  cloth.rotateX(-Math.PI / 2);
  const cp = cloth.attributes.position;
  for (let i = 0; i < cp.count; i++) {
    const px = cp.getX(i);
    const pz = cp.getZ(i);
    const sag = Math.cos((px / RW) * (Math.PI / 2)) * Math.cos((pz / RD) * (Math.PI / 2));
    cp.setY(i, -0.045 * sag + 0.006 * Math.sin(px * 9 + pz * 5) * sag);
  }
  cloth.computeVertexNormals();
  cloth.attributes.uv.array.forEach((_, i, a) => (a[i] *= i % 2 ? 2 : 3.6));
  add('cadir-bezi', cloth, m.cloth, roof).position.y = 0.02;

  // Çadır çerçevesi: ön alın tahtası, arka tahta, iki yan tahta ve alttaki mertekler
  beam('cadir-on', v(-RW, 0, RD), v(RW, 0, RD), 0.15, 0.035, m.frame, roof);
  beam('cadir-arka', v(-RW, 0, -RD), v(RW, 0, -RD), 0.1, 0.035, m.frame, roof);
  for (const s of [-1, 1]) {
    beam('cadir-yan', v(s * RW, 0.01, -RD - 0.02), v(s * RW, 0.01, RD + 0.02), 0.035, 0.13, m.frame, roof);
    beam('mertek', v(s * HALF_WIDTH, -0.09, -RD), v(s * HALF_WIDTH, -0.09, RD), 0.05, 0.06, m.frame, roof);
  }
  beam('mertek', v(0, -0.09, -RD), v(0, -0.09, RD), 0.05, 0.06, m.frame, roof);

  // ================= Masa =================
  const TABLE = { length: 2.9, depth: 0.78, height: 0.78, z: 0.28, thick: 0.055 };
  const plank = TABLE.depth / 3;
  for (let i = 0; i < 3; i++) {
    const z = TABLE.z - TABLE.depth / 2 + plank * (i + 0.5);
    const y = TABLE.height - TABLE.thick / 2;
    const len = TABLE.length / 2 - (i === 1 ? 0 : 0.012);
    beam('masa-tahtasi', v(-len, y, z), v(len, y, z), TABLE.thick, plank - 0.006, m.table);
  }
  // Ayak: geniş tabanlı, ortası ince, üstü masayı taşıyan profil (Z-Y düzleminde)
  const top = TABLE.height - TABLE.thick;
  const profile = [
    [0.37, 0], [0.37, 0.07], [0.24, 0.13], [0.1, 0.22], [0.1, top - 0.2], [0.3, top - 0.07], [0.3, top],
    [-0.3, top], [-0.3, top - 0.07], [-0.1, top - 0.2], [-0.1, 0.22], [-0.24, 0.13], [-0.37, 0.07], [-0.37, 0],
  ];
  const shape = new THREE.Shape(profile.map(([z, y]) => new THREE.Vector2(z, y)));
  const legGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2 });
  legGeo.translate(0, 0, -0.035);
  legGeo.rotateY(-Math.PI / 2); // profilin yatay ekseni Z'ye, kalınlık X'e
  for (const s of [-1, 1]) {
    add('masa-ayagi', legGeo, m.tableDark).position.set(s * (TABLE.length / 2 - 0.35), 0, TABLE.z);
  }
  // Ayakları bağlayan kayıt
  const lx = TABLE.length / 2 - 0.35;
  beam('masa-kaydi', v(-lx - 0.1, 0.34, TABLE.z), v(lx + 0.1, 0.34, TABLE.z), 0.1, 0.045, m.tableDark);

  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}

// Tezgahın durduğu taş zemin (modelin parçası değil, yalnızca sahnede gösterilir).
export function createCobbleGround(size = 6) {
  const tex = cobbleTextures();
  tex.map.repeat.set(size, size);
  tex.bumpMap.repeat.set(size, size);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshStandardMaterial({ ...tex, bumpScale: 3, roughness: 0.9 }),
  );
  ground.name = 'tas-zemin';
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.002;
  return ground;
}
