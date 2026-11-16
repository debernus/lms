import * as THREE from 'three';

// Referans görseldeki karakterin stilize, basit geometrilerden kurulmuş hali.
// Birim metre; karakter +Z yönüne bakar, ayak tabanı y = 0, boy ~1.81 m.

const UP = new THREE.Vector3(0, 1, 0);
const v = (x, y, z) => new THREE.Vector3(x, y, z);

const mat = (color, roughness = 0.7, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

export function createCharacter() {
  const m = {
    jacket: mat(0x4a3324, 0.55),
    jacketDark: mat(0x33231a, 0.6),
    sweater: mat(0x2f3236, 0.95),
    jeans: mat(0x1b2333, 0.85),
    boot: mat(0x503826, 0.6),
    sole: mat(0x17120f, 0.9),
    skin: mat(0xc48d69, 0.65),
    hair: mat(0x17110d, 0.8),
    metal: mat(0xa3a3a3, 0.35, 0.8),
    eye: mat(0x120d0a, 0.3),
  };
  m.hair.side = THREE.DoubleSide;

  const root = new THREE.Group();
  root.name = 'Karakter';

  const add = (name, geometry, material, position, parent = root) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    if (position) mesh.position.copy(position);
    parent.add(mesh);
    return mesh;
  };

  // a noktasından b noktasına uzanan, uçları farklı yarıçaplı uzuv parçası.
  const limb = (name, a, b, rA, rB, material) => {
    const dir = b.clone().sub(a);
    const mesh = add(name, new THREE.CylinderGeometry(rB, rA, dir.length(), 24), material, a.clone().lerp(b, 0.5));
    mesh.quaternion.setFromUnitVectors(UP, dir.normalize());
    return mesh;
  };

  const ball = (name, center, r, material, scale, parent) => {
    const mesh = add(name, new THREE.SphereGeometry(r, 24, 16), material, center, parent);
    if (scale) mesh.scale.copy(scale);
    return mesh;
  };

  // --- Gövde: deri ceket ---
  const torso = add('ceket', new THREE.CylinderGeometry(0.2, 0.185, 0.48, 32), m.jacket, v(0, 1.25, 0));
  torso.scale.z = 0.62;
  ball('omuzlar', v(0, 1.47, 0), 0.2, m.jacket, v(1.05, 0.38, 0.64));
  const hem = add('ceket-etek', new THREE.CylinderGeometry(0.19, 0.19, 0.06, 32), m.jacketDark, v(0, 1.02, 0));
  hem.scale.z = 0.64;

  // Açık fermuarın arasından görünen kazak ve fermuar şeritleri
  add('kazak-on', new THREE.BoxGeometry(0.085, 0.5, 0.03), m.sweater, v(0, 1.25, 0.112));
  for (const s of [-1, 1]) {
    add('fermuar', new THREE.BoxGeometry(0.008, 0.5, 0.012), m.metal, v(s * 0.046, 1.25, 0.124));
    // Yaka: boyundan dışa açılan iki parça
    const collar = add('yaka', new THREE.BoxGeometry(0.1, 0.022, 0.075), m.jacket, v(s * 0.075, 1.515, 0.075));
    collar.rotation.set(0.5, s * -0.5, s * -0.35);
    // Yan cepler
    const pocket = add('cep', new THREE.BoxGeometry(0.008, 0.1, 0.01), m.jacketDark, v(s * 0.135, 1.13, 0.094));
    pocket.rotation.z = s * 0.25;
  }
  add('gogus-fermuari', new THREE.BoxGeometry(0.07, 0.008, 0.01), m.metal, v(0.115, 1.36, 0.1));
  add('sirt-dikisi', new THREE.BoxGeometry(0.006, 0.4, 0.01), m.jacketDark, v(0, 1.27, -0.121));
  add('sirt-roba', new THREE.BoxGeometry(0.3, 0.006, 0.01), m.jacketDark, v(0, 1.43, -0.122));
  const backCollar = add('yaka-arka', new THREE.TorusGeometry(0.075, 0.022, 10, 24, Math.PI), m.jacket, v(0, 1.52, -0.005));
  backCollar.rotation.set(Math.PI / 2, 0, Math.PI);
  backCollar.scale.set(1, 1, 1.4);

  // --- Boyun ve balıkçı yaka ---
  add('boyun', new THREE.CylinderGeometry(0.05, 0.055, 0.14, 24), m.skin, v(0, 1.57, 0));
  add('balikci-yaka', new THREE.CylinderGeometry(0.06, 0.07, 0.085, 24), m.sweater, v(0, 1.545, 0.003));

  // --- Baş ---
  const head = new THREE.Group();
  head.name = 'bas';
  head.position.set(0, 1.69, 0.01);
  root.add(head);
  const headScale = v(0.095, 0.12, 0.105);

  add('kafa', new THREE.SphereGeometry(1, 32, 24), m.skin, null, head).scale.copy(headScale);
  // Saç: kafanın üst-arka kısmını saran kabuk
  const hair = add('sac', new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), m.hair, v(0, 0.002, -0.004), head);
  hair.scale.set(headScale.x * 1.1, headScale.y * 1.14, headScale.z * 1.12);
  hair.rotation.x = -0.5;
  // Sakal: çeneyi ve yanakları saran alt-ön bant (phi = PI/2 ön taraf)
  const beard = add('sakal', new THREE.SphereGeometry(1.04, 32, 12, Math.PI * 0.14, Math.PI * 0.72, Math.PI * 0.66, Math.PI * 0.34), m.hair, null, head);
  beard.scale.copy(headScale);
  add('biyik', new THREE.BoxGeometry(0.05, 0.01, 0.012), m.hair, v(0, -0.04, 0.098), head);

  const nose = add('burun', new THREE.ConeGeometry(0.014, 0.045, 12), m.skin, v(0, -0.008, 0.108), head);
  nose.rotation.x = -0.35;
  for (const s of [-1, 1]) {
    add('goz', new THREE.SphereGeometry(0.009, 12, 8), m.eye, v(s * 0.036, 0.018, 0.094), head);
    const brow = add('kas', new THREE.BoxGeometry(0.034, 0.007, 0.01), m.hair, v(s * 0.037, 0.04, 0.097), head);
    brow.rotation.z = s * -0.18;
    add('kulak', new THREE.SphereGeometry(0.02, 12, 8), m.skin, v(s * 0.095, 0, 0), head).scale.set(0.45, 1.2, 0.8);
  }

  // --- Kalça ve bacaklar: kot ---
  ball('kalca', v(0, 0.96, 0), 0.19, m.jeans, v(1, 0.68, 0.66));
  add('kemer', new THREE.CylinderGeometry(0.178, 0.182, 0.035, 32), m.sole, v(0, 1.0, 0)).scale.z = 0.62;

  for (const s of [-1, 1]) {
    const side = s < 0 ? 'sag' : 'sol';
    const hip = v(s * 0.095, 0.93, 0);
    const knee = v(s * 0.11, 0.54, 0.012);
    const ankle = v(s * 0.125, 0.2, 0);
    limb(`ust-bacak-${side}`, hip, knee, 0.095, 0.072, m.jeans);
    ball(`diz-${side}`, knee, 0.072, m.jeans);
    limb(`alt-bacak-${side}`, knee, ankle, 0.072, 0.066, m.jeans);

    // Bot: konç, ayak ve taban
    limb(`bot-konc-${side}`, v(ankle.x, 0.07, 0), v(ankle.x, 0.23, 0), 0.062, 0.058, m.boot);
    const foot = add(`bot-${side}`, new THREE.CapsuleGeometry(0.055, 0.15, 8, 16), m.boot, v(ankle.x, 0.075, 0.05));
    foot.rotation.x = Math.PI / 2;
    foot.scale.z = 0.85; // döndürmeden sonra dikey eksen
    add(`taban-${side}`, new THREE.BoxGeometry(0.112, 0.024, 0.28), m.sole, v(ankle.x, 0.012, 0.05));

    // --- Kollar (A-poz) ---
    const shoulder = v(s * 0.205, 1.445, 0);
    const elbow = v(s * 0.355, 1.19, 0);
    const wrist = v(s * 0.495, 0.95, 0.015);
    ball(`omuz-${side}`, shoulder, 0.068, m.jacket);
    limb(`ust-kol-${side}`, shoulder, elbow, 0.066, 0.054, m.jacket);
    ball(`dirsek-${side}`, elbow, 0.054, m.jacket);
    limb(`on-kol-${side}`, elbow, wrist, 0.054, 0.046, m.jacket);

    const armDir = wrist.clone().sub(elbow).normalize();
    const along = (d) => wrist.clone().addScaledVector(armDir, d);
    limb(`manset-${side}`, along(-0.03), along(0.012), 0.049, 0.047, m.jacketDark);
    limb(`kazak-bilek-${side}`, along(0.01), along(0.03), 0.038, 0.036, m.sweater);

    const hand = ball(`el-${side}`, along(0.1), 1, m.skin, v(0.02, 0.08, 0.038));
    hand.quaternion.setFromUnitVectors(UP, armDir);
    const thumb = add(`basparmak-${side}`, new THREE.CapsuleGeometry(0.011, 0.04, 4, 8), m.skin, along(0.075).add(v(0, 0, 0.045)));
    thumb.quaternion.setFromUnitVectors(UP, armDir.clone().add(v(0, 0, 0.6)).normalize());
  }

  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
