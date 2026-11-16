import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { loft, patch, surfaceTube, surfacePoint, leatherTextures, denimTextures, knitTextures } from './geometry.js';

// Referans görseldeki karakter: kesitlerden üretilmiş pürüzsüz yüzeyler ve prosedürel dokular.
// Birim metre; karakter +Z yönüne bakar, ayak tabanı y = 0.

const UP = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const v = (x, y, z) => new THREE.Vector3(x, y, z);
const FRONT = Math.PI / 2;
const BACK = -Math.PI / 2;
const smooth = (a, b, x) => THREE.MathUtils.smoothstep(x, a, b);
const mix = THREE.MathUtils.lerp;

// --- Baş şekli: birim küre yönünden yüz hatları olan kafa yüzeyine ---
const HEAD = { x: 0.077, y: 0.112, z: 0.097 };
const gauss = (px, py, cx, cy, r) => Math.exp(-((px - cx) ** 2 + (py - cy) ** 2) / (r * r));

function headPoint(x, y, z, off = 0) {
  let px = HEAD.x * x;
  const py = HEAD.y * y;
  let pz = HEAD.z * z;
  const t = Math.max(0, -y);
  px *= 1 - 0.34 * Math.pow(t, 1.6); // çeneye doğru daralma
  if (z < 0) pz *= 1.06 * (1 - 0.4 * t * t); // ense boyna doğru içeri girer
  else pz *= 1 - 0.08 * t * t;
  const face = smooth(0, 0.35, z);
  if (face > 0) {
    const ax = Math.abs(px);
    let dz = 0;
    dz -= 0.0075 * gauss(ax, py, 0.031, 0.024, 0.015); // göz çukurları
    dz += 0.0045 * Math.exp(-(((py - 0.046) / 0.011) ** 2)) * (1 - smooth(0.045, 0.075, ax)); // kaş kemeri
    dz += 0.003 * gauss(ax, py, 0.046, -0.012, 0.02); // elmacık kemikleri
    dz += 0.004 * gauss(px, py, 0, -0.056, 0.028); // ağız çevresi
    dz += 0.006 * gauss(px, py, 0, -0.094, 0.024); // çene ucu
    dz -= 0.002 * gauss(ax, py, 0.06, 0.03, 0.02); // şakaklar
    pz += dz * face;
  }
  return v(px + x * off, py + y * off, pz + z * off);
}

// Yüzün ön yüzeyinde verilen (x, y) noktasını bulur.
function facePoint(x, y) {
  let dx = x / HEAD.x;
  let dy = y / HEAD.y;
  let p;
  for (let i = 0; i < 12; i++) {
    const dz = Math.sqrt(Math.max(0.02, 1 - dx * dx - dy * dy));
    const l = Math.hypot(dx, dy, dz);
    p = headPoint(dx / l, dy / l, dz / l);
    dx += (x - p.x) / HEAD.x;
    dy += (y - p.y) / HEAD.y;
  }
  return p;
}

// offsetFn(yön) yüzeyden dışarı (pozitif) ya da içeri (negatif) kayma verir; kabuğun
// deriyle kesiştiği çizgi saç/sakal sınırını oluşturur.
function headShell(offsetFn) {
  let g = new THREE.SphereGeometry(1, 96, 72);
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  const pos = g.attributes.position;
  const d = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    d.fromBufferAttribute(pos, i).normalize();
    const p = headPoint(d.x, d.y, d.z, offsetFn(d));
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  g = mergeVertices(g, 1e-6);
  g.computeVertexNormals();
  return g;
}

const clump = (d) =>
  0.5 + 0.3 * Math.sin(31 * d.x + 9 * d.y) * Math.sin(27 * d.z + 13 * d.x) + 0.2 * Math.sin(53 * d.y + 19 * d.z + 41 * d.x);
const forward = (d) => d.z / (Math.hypot(d.x, d.z) || 1e-6); // 1 = ön, -1 = arka
const HIDDEN = -0.006;

function hairOffset(d) {
  const f = forward(d);
  const line = f > 0 ? mix(0.3, 0.6, smooth(0.15, 0.75, f)) : mix(0.3, -0.45, smooth(0, 0.6, -f));
  const volume = 0.007 + 0.012 * smooth(-0.2, 0.8, d.y) + 0.009 * smooth(0.2, 0.9, d.z) * smooth(0.3, 0.8, d.y);
  return mix(HIDDEN, volume + 0.006 * clump(d), smooth(-0.03, 0.12, d.y - line));
}

function beardOffset(d) {
  const f = forward(d);
  const front = mix(-0.2, -0.335, smooth(0.32, 0.75, f));
  const line = mix(0.36, front, smooth(0.2, 0.36, f)); // favori -> yanak -> bıyık çizgisi
  let m = Math.min(line - d.y, (f - 0.02) * 1.2);
  const p = headPoint(d.x, d.y, d.z);
  if (d.z > 0.5) m = Math.min(m, 10 * Math.max(Math.abs(p.x) - 0.017, Math.abs(p.y + 0.0605) - 0.005)); // dudak boşluğu
  return mix(HIDDEN, 0.004 + 0.003 * clump(d), smooth(-0.01, 0.05, m));
}

export function createCharacter() {
  const leather = leatherTextures('#3b281c');
  const bootLeather = leatherTextures('#5b3f2a');
  const denim = denimTextures();
  const knit = knitTextures();
  const std = (opts) => new THREE.MeshStandardMaterial(opts);
  const m = {
    jacket: std({ ...leather, bumpScale: 0.7, roughness: 0.5 }),
    jacketDark: std({ ...leather, bumpScale: 0.7, roughness: 0.56, color: 0xb5a89f }),
    sweater: std({ ...knit, bumpScale: 2.5, roughness: 0.95 }),
    jeans: std({ ...denim, bumpScale: 0.8, roughness: 0.88 }),
    jeansSeam: std({ color: 0x141b28, roughness: 0.9 }),
    boot: std({ ...bootLeather, bumpScale: 0.6, roughness: 0.55 }),
    sole: std({ color: 0x15110e, roughness: 0.92 }),
    lace: std({ color: 0x2a1d14, roughness: 0.9 }),
    skin: std({ color: 0xb47c5a, roughness: 0.6 }),
    lip: std({ color: 0x8a5545, roughness: 0.5 }),
    hair: std({ color: 0x18110c, roughness: 0.62 }),
    metal: std({ color: 0x8d8a84, roughness: 0.42, metalness: 0.9 }),
    sclera: std({ color: 0xece6df, roughness: 0.25 }),
    iris: std({ color: 0x3a2413, roughness: 0.2 }),
    pupil: std({ color: 0x050505, roughness: 0.1 }),
  };

  const root = new THREE.Group();
  root.name = 'Karakter';

  const add = (name, geometry, material, parent = root) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    parent.add(mesh);
    return mesh;
  };
  const sphere = (name, center, r, material, parent, scale) => {
    const mesh = add(name, new THREE.SphereGeometry(r, 24, 16), material, parent);
    mesh.position.copy(center);
    if (scale) mesh.scale.copy(scale);
    return mesh;
  };
  const capsule = (name, a, b, r, material, parent) => {
    const dir = b.clone().sub(a);
    const mesh = add(name, new THREE.CapsuleGeometry(r, dir.length(), 6, 12), material, parent);
    mesh.position.copy(a).lerp(b, 0.5);
    mesh.quaternion.setFromUnitVectors(UP, dir.normalize());
    return mesh;
  };

  // ================= Gövde: deri ceket =================
  const T = [
    [0, 1.0, 0, 0.172, 0.114],
    [0, 1.055, 0, 0.174, 0.116],
    [0, 1.085, 0.002, 0.181, 0.123],
    [0, 1.2, 0.004, 0.18, 0.124],
    [0, 1.32, 0.008, 0.184, 0.128],
    [0, 1.41, 0.004, 0.198, 0.122],
    [0, 1.458, 0, 0.194, 0.108],
    [0, 1.495, -0.004, 0.122, 0.084],
    [0, 1.525, -0.006, 0.07, 0.068],
  ];
  const tOpt = { e: 2.4 };
  add('ceket', loft(T, { ...tOpt, radial: 64, uRepeat: 2, vScale: 2.5, capStart: true }), m.jacket);
  add('ceket-bel-bandi', loft(T, { ...tOpt, radial: 64, u0: 0, u1: 1, offset: 0.004, vScale: 2.5 }), m.jacketDark);
  add('ceket-roba-dikisi', loft(T, { ...tOpt, radial: 64, u0: 5.02, u1: 5.07, offset: 0.0018 }), m.jacketDark);
  add('ceket-sirt-dikisi', surfaceTube(T, { ...tOpt, u0: 1.05, u1: 5.05, angle: BACK, radius: 0.0025, offset: 0.0005 }), m.jacketDark);

  // Açık önden görünen kazak, ceket kenarları ve fermuar
  const TOP = 7.7;
  const openingAt = (u) => 0.17 + 0.17 * (u / TOP) + 0.75 * smooth(0.8, 1, u / TOP);
  const over = (u0, u1, fn) => (q) => fn(u0 + (u1 - u0) * q); // q ilerlemesini u'ya çevirir
  add('kazak-on', patch(T, { ...tOpt, u0: 0, u1: TOP, center: FRONT, half: over(0, TOP, openingAt), offset: 0.004, cols: 14, uvScale: [0.5, 3] }), m.sweater);
  for (const s of [-1, 1]) {
    const edge = (u) => FRONT + s * openingAt(u);
    add('ceket-on-kenar', surfaceTube(T, { ...tOpt, u0: 0, u1: 6.9, angle: over(0, 6.9, edge), radius: 0.0075, offset: 0.004, samples: 48 }), m.jacket);
    add('fermuar', surfaceTube(T, { ...tOpt, u0: 0.05, u1: 6.3, angle: over(0.05, 6.3, (u) => edge(u) - s * 0.04), radius: 0.002, offset: 0.0062, samples: 48 }), m.metal);
    add('yan-cep', surfaceTube(T, { ...tOpt, u0: 1.5, u1: 2.7, angle: (q) => FRONT + s * (0.78 - 0.14 * q), radius: 0.004, offset: 0.0005 }), m.jacketDark);
    // Bel bandı ve düğmeleri
    sphere('bel-dugmesi', surfacePoint(T, 0.5, FRONT + s * 0.95, { ...tOpt, offset: 0.006 }), 0.008, m.metal, root, v(1, 1, 0.5));
    sphere('bel-dugmesi', surfacePoint(T, 0.5, BACK + s * 0.75, { ...tOpt, offset: 0.006 }), 0.008, m.metal, root, v(1, 1, 0.5));
  }
  add('gogus-fermuari', surfaceTube(T, { ...tOpt, u0: 4.45, u1: 4.55, angle: (q) => FRONT - 0.5 - 0.42 * q, radius: 0.0022, offset: 0.0012 }), m.metal);

  // Yaka: boyundan omuzlara doğru açılan devrik yaka, önde açık
  const collar = [
    [0, 1.548, -0.008, 0.07, 0.068],
    [0, 1.525, -0.006, 0.086, 0.078],
    [0, 1.498, -0.002, 0.118, 0.094],
    [0, 1.478, 0.004, 0.142, 0.108],
  ];
  const collarMat = m.jacket.clone();
  collarMat.side = THREE.DoubleSide;
  const collarHalf = (q) => Math.PI - 0.5 - 0.1 * q + 0.25 * q * q; // uçlar öne doğru sivrilir
  add('yaka', patch(collar, { e: 2.2, u0: 0, u1: 3, center: BACK, half: collarHalf, cols: 48, uvScale: [2, 0.4] }), collarMat);

  // ================= Boyun ve balıkçı yaka =================
  add('boyun', loft([[0, 1.52, -0.004, 0.05, 0.052], [0, 1.6, 0, 0.047, 0.05], [0, 1.645, 0.004, 0.05, 0.056]]), m.skin);
  const turtle = [
    [0, 1.495, -0.004, 0.068, 0.066],
    [0, 1.55, -0.001, 0.059, 0.061],
    [0, 1.582, 0.001, 0.0585, 0.0605],
    [0, 1.596, 0.002, 0.063, 0.065],
    [0, 1.607, 0.002, 0.055, 0.057],
  ];
  add('balikci-yaka', loft(turtle, { radial: 48, uRepeat: 2, vScale: 3 }), m.sweater);

  // ================= Baş =================
  const head = new THREE.Group();
  head.name = 'bas';
  head.position.set(0, 1.712, 0.012);
  root.add(head);

  add('kafa', headShell(() => 0), m.skin, head);
  add('sac', headShell(hairOffset), m.hair, head);
  add('sakal', headShell(beardOffset), m.hair, head);

  // Burun
  const fz = (x, y) => facePoint(x, y).z;
  const nose = [
    [0, 0.026, fz(0, 0.026) - 0.003, 0.006, 0.005],
    [0, 0.004, fz(0, 0.004) + 0.002, 0.0075, 0.0065],
    [0, -0.02, fz(0, -0.02) + 0.009, 0.0115, 0.0095],
    [0, -0.03, fz(0, -0.03) + 0.006, 0.0145, 0.0085],
    [0, -0.037, fz(0, -0.037) - 0.002, 0.011, 0.005],
  ];
  add('burun', loft(nose, { radial: 24, capStart: true, capEnd: true }), m.skin, head);
  sphere('alt-dudak', facePoint(0, -0.0605).add(v(0, 0, 0.001)), 1, m.lip, head, v(0.017, 0.0042, 0.0045));

  for (const s of [-1, 1]) {
    // Göz: göz akı, iris, göz bebeği ve göz kapakları
    const eye = facePoint(s * 0.031, 0.024).add(v(0, 0, -0.0085));
    const r = 0.012;
    sphere('goz-aki', eye, r, m.sclera, head);
    sphere('iris', eye.clone().add(v(0, 0, r - 0.0028)), 0.0066, m.iris, head, v(1, 1, 0.5));
    sphere('goz-bebegi', eye.clone().add(v(0, 0, r - 0.0008)), 0.003, m.pupil, head, v(1, 1, 0.4));
    const upper = add('ust-goz-kapagi', new THREE.SphereGeometry(r * 1.07, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.3), m.skin, head);
    upper.position.copy(eye);
    upper.rotation.x = 0.4;
    const lower = add('alt-goz-kapagi', new THREE.SphereGeometry(r * 1.06, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.21), m.skin, head);
    lower.position.copy(eye);
    lower.rotation.x = Math.PI - 0.5;

    // Kaş
    const brow = [0.012, 0.03, 0.047, 0.058].map((x, i) => {
      const y = [0.044, 0.05, 0.049, 0.043][i];
      const p = facePoint(s * x, y);
      return [p.x, p.y, p.z + 0.001, [0.003, 0.0034, 0.0028, 0.0018][i], [0.0022, 0.0025, 0.0022, 0.0015][i]];
    });
    add('kas', loft(brow, { radial: 12, right: UP, capStart: true, capEnd: true }), m.hair, head);

    const ear = sphere('kulak', v(s * 0.078, 0.004, -0.006), 1, m.skin, head, v(0.008, 0.03, 0.017));
    ear.rotation.set(0, s * -0.35, s * -0.12);
  }

  // ================= Kalça ve bacaklar: kot =================
  const P = [
    [0, 0.845, 0, 0.05, 0.07],
    [0, 0.9, 0, 0.14, 0.098],
    [0, 0.97, 0, 0.162, 0.106],
    [0, 1.04, 0, 0.16, 0.104],
  ];
  const pOpt = { e: 2.3 };
  add('kalca', loft(P, { ...pOpt, radial: 56, uRepeat: 6, vScale: 9, capStart: true, capEnd: true }), m.jeans);
  add('fermuar-pati', surfaceTube(P, { ...pOpt, u0: 0.75, u1: 2.7, angle: FRONT - 0.1, radius: 0.003, offset: 0.0005 }), m.jeansSeam);
  for (const s of [-1, 1]) {
    add('arka-cep', patch(P, { ...pOpt, u0: 1.35, u1: 2.45, center: BACK + s * 0.62, half: (q) => 0.3 + 0.08 * q, offset: 0.003, uvScale: [1.5, 1.2] }), m.jeans);
  }

  for (const s of [-1, 1]) {
    const side = s < 0 ? 'sag' : 'sol';
    const L = [
      [0.115, 0.125, -0.02, 0.064, 0.074],
      [0.115, 0.2, -0.02, 0.06, 0.068],
      [0.114, 0.32, -0.016, 0.058, 0.064],
      [0.112, 0.43, -0.014, 0.064, 0.07],
      [0.108, 0.53, -0.002, 0.061, 0.066],
      [0.103, 0.7, 0.006, 0.074, 0.08],
      [0.096, 0.86, 0.004, 0.086, 0.092],
      [0.09, 0.95, 0, 0.088, 0.096],
      [0.086, 1.0, 0, 0.08, 0.09],
    ].map((c) => [c[0] * s, ...c.slice(1)]);
    add(`bacak-${side}`, loft(L, { radial: 40, uRepeat: 4, vScale: 9, capStart: true }), m.jeans);
    add(`paca-${side}`, loft(L, { radial: 40, u0: 0, u1: 0.16, offset: 0.0025, uRepeat: 4, vScale: 9 }), m.jeans);
    add(`bacak-dikisi-${side}`, surfaceTube(L, { u0: 0, u1: 7, angle: s > 0 ? 0 : Math.PI, radius: 0.0025, offset: 0.0003, samples: 40 }), m.jeansSeam);

    // ---------- Bot ----------
    const boot = new THREE.Group();
    boot.name = `bot-${side}`;
    boot.position.set(s * 0.115, 0, -0.02);
    boot.rotation.y = s * 0.14;
    root.add(boot);
    const foot = [
      [0, 0.056, -0.084, 0.02, 0.03],
      [0, 0.064, -0.066, 0.04, 0.05],
      [0, 0.072, -0.02, 0.046, 0.058],
      [0, 0.062, 0.05, 0.049, 0.048],
      [0, 0.05, 0.115, 0.051, 0.038],
      [0, 0.043, 0.165, 0.047, 0.031],
      [0, 0.04, 0.196, 0.034, 0.025],
      [0, 0.038, 0.208, 0.012, 0.011],
    ];
    add('bot-govde', loft(foot, { e: 2.5, radial: 32, uRepeat: 2, vScale: 5, capStart: true, capEnd: true }), m.boot, boot);
    const shaft = [
      [0, 0.09, -0.022, 0.046, 0.058],
      [0, 0.17, -0.026, 0.043, 0.05],
      [0, 0.235, -0.024, 0.046, 0.051],
    ];
    add('bot-konc', loft(shaft, { radial: 32, uRepeat: 2, vScale: 5, capEnd: true }), m.boot, boot);
    const sole = [[0, 0, 0.06, 0.053, 0.15], [0, 0.02, 0.06, 0.053, 0.15]];
    add('taban', loft(sole, { e: 2.8, radial: 40, steps: 1, capStart: true, capEnd: true }), m.sole, boot);
    const welt = [[0, 0.02, 0.06, 0.055, 0.152], [0, 0.026, 0.06, 0.055, 0.152]];
    add('taban-kenari', loft(welt, { e: 2.8, radial: 40, steps: 1, capEnd: true }), m.lace, boot);
    for (let i = 0; i < 5; i++) {
      const z = i * 0.024;
      const y = 0.131 - i * 0.0085;
      capsule('bagcik', v(-0.018, y, z), v(0.018, y, z), 0.003, m.lace, boot);
    }

    // ---------- Kol (A-poz), bilekten omuza ----------
    const A = [
      [0.47, 0.945, 0.02, 0.041, 0.043],
      [0.452, 0.98, 0.017, 0.047, 0.047],
      [0.4, 1.07, 0.006, 0.052, 0.052],
      [0.335, 1.19, -0.004, 0.054, 0.055],
      [0.265, 1.32, 0, 0.061, 0.064],
      [0.226, 1.385, 0, 0.061, 0.067],
      [0.192, 1.422, 0, 0.052, 0.064],
      [0.15, 1.435, 0, 0.036, 0.054],
    ].map((c) => [c[0] * s, ...c.slice(1)]);
    add(`kol-${side}`, loft(A, { radial: 40, uRepeat: 2, vScale: 2.5, capStart: true }), m.jacket);
    add(`manset-${side}`, loft(A, { radial: 40, u0: 0, u1: 0.75, offset: 0.003, vScale: 2.5 }), m.jacketDark);
    sphere('manset-dugmesi', surfacePoint(A, 0.4, s > 0 ? 0 : Math.PI, { offset: 0.005 }), 0.007, m.metal, root);

    const wrist = v(A[0][0], A[0][1], A[0][2]);
    const armDir = wrist.clone().sub(v(A[1][0], A[1][1], A[1][2])).normalize();
    const lo = wrist.clone().addScaledVector(armDir, 0.024);
    const hi = wrist.clone().addScaledVector(armDir, -0.02);
    add(`kazak-bilek-${side}`, loft([[lo.x, lo.y, lo.z, 0.033, 0.035], [hi.x, hi.y, hi.z, 0.036, 0.038]], { radial: 24, steps: 2, uRepeat: 2, vScale: 3, capStart: true }), m.sweater);

    // ---------- El: avuç içi gövdeye bakar, başparmak önde ----------
    const hand = new THREE.Group();
    hand.name = `el-${side}`;
    hand.position.copy(wrist).addScaledVector(armDir, 0.018);
    hand.quaternion.setFromUnitVectors(DOWN, armDir);
    root.add(hand);
    const palm = [
      [0, 0, 0, 0.023, 0.014],
      [0, -0.03, 0.002, 0.036, 0.015],
      [0, -0.07, 0, 0.041, 0.013],
      [0, -0.094, 0, 0.04, 0.0105],
    ];
    add('avuc', loft(palm, { e: 3, right: Z_AXIS, radial: 24, capStart: true, capEnd: true }), m.skin, hand);
    const inward = -s; // avuç içi yönü (yerel X)
    [0.07, 0.078, 0.072, 0.057].forEach((length, i) => {
      let p = v(0, -0.09 - [0, 0.003, 0.001, -0.005][i], 0.0305 - i * 0.0203);
      let angle = 0.1;
      [0.45, 0.31, 0.24].forEach((part, j) => {
        angle += [0.1, 0.22, 0.2][j];
        const q = p.clone().add(v(Math.sin(angle) * inward, -Math.cos(angle), 0).multiplyScalar(length * part));
        capsule('parmak', p, q, 0.0092 - j * 0.0008 - (i === 3 ? 0.001 : 0), m.skin, hand);
        p = q;
      });
    });
    const thumbDir = v(inward * 0.3, -0.72, 0.62).normalize();
    const t0 = v(inward * 0.003, -0.022, 0.03);
    const t1 = t0.clone().addScaledVector(thumbDir, 0.04);
    const t2 = t1.clone().addScaledVector(v(inward * 0.35, -0.85, 0.4).normalize(), 0.03);
    capsule('basparmak', t0, t1, 0.0115, m.skin, hand);
    capsule('basparmak', t1, t2, 0.0098, m.skin, hand);
  }

  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
