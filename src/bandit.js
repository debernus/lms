import * as THREE from 'three';
import { meshField, checkClosed, sharpenBoundaries } from './isosurface.js';

// 1914, Anadolu'da bir yol eşkıyası; T duruşunda, tek kapalı ağ. Gövde, baş ve kıyafet tek bir
// hacim olarak tanımlanır (işaretli uzaklık alanı), yüzeyi ondan örülür; renkler köşe rengidir.
// Birim metre, Y yukarı, yüz +Z'ye bakar.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const S = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
// Yumuşak birleşim / kesişim
const smin = (a, b, k) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
const smax = (a, b, k) => -smin(-a, -b, k);
const sphere = (x, y, z, cx, cy, cz, r) => Math.hypot(x - cx, y - cy, z - cz) - r;
// a'dan b'ye, yarıçapı ra'dan rb'ye değişen kapsül
function cone(x, y, z, ax, ay, az, bx, by, bz, ra, rb) {
  const px = x - ax, py = y - ay, pz = z - az;
  const dx = bx - ax, dy = by - ay, dz = bz - az;
  const h = clamp((px * dx + py * dy + pz * dz) / (dx * dx + dy * dy + dz * dz), 0, 1);
  return Math.hypot(px - dx * h, py - dy * h, pz - dz * h) - (ra + (rb - ra) * h);
}
function ellipsoid(x, y, z, cx, cy, cz, rx, ry, rz) {
  const px = (x - cx) / rx, py = (y - cy) / ry, pz = (z - cz) / rz;
  const k0 = Math.hypot(px, py, pz);
  if (k0 < 1e-6) return -Math.min(rx, ry, rz);
  return (k0 * (k0 - 1)) / Math.hypot(px / rx, py / ry, pz / rz);
}
function roundBox(x, y, z, cx, cy, cz, hx, hy, hz, r) {
  const qx = Math.abs(x - cx) - hx + r, qy = Math.abs(y - cy) - hy + r, qz = Math.abs(z - cz) - hz + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
}

// --- Parçalar. P her parçanın uzaklığını tutar; renk verirken en yakın parça seçilir. ---
const P = { wrap: 0, head: 0, hair: 0, eye: 0, lip: 0, turban: 0, cap: 0, neck: 0, torso: 0, arm: 0, hand: 0, sash: 0, shalvar: 0, dolak: 0, foot: 0, cepken: 0, sleeve: 0 };
const SH = 1.428; // omuz ve kol yüksekliği
const EYE = [0.031, 1.613];

function body(sx, y, z) {
  const x = Math.abs(sx);

  // Baş: kafatası, çene, elmacık, kaş kemeri, göz çukuru, burun, kulak
  let h = smin(ellipsoid(x, y, z, 0, 1.64, -0.008, 0.076, 0.094, 0.09), ellipsoid(x, y, z, 0, 1.578, 0.018, 0.06, 0.058, 0.068), 0.03);
  h = smin(h, sphere(x, y, z, 0, 1.538, 0.058, 0.022), 0.02);
  h = smin(h, sphere(x, y, z, 0.046, 1.598, 0.045, 0.024), 0.02);
  h = smin(h, cone(x, y, z, 0.01, 1.634, 0.076, 0.046, 1.644, 0.06, 0.0095, 0.0085), 0.012); // çatık kaş kemeri
  h = smax(h, -sphere(x, y, z, EYE[0], EYE[1], 0.079, 0.016), 0.008);
  h = smin(h, cone(x, y, z, 0, 1.628, 0.078, 0, 1.588, 0.103, 0.0085, 0.0125), 0.008);
  h = smin(h, sphere(x, y, z, 0.0125, 1.5835, 0.09, 0.0085), 0.005);
  h = smin(h, ellipsoid(x, y, z, 0.079, 1.612, -0.006, 0.011, 0.027, 0.017), 0.008);
  P.head = h;
  P.eye = sphere(x, y, z, EYE[0], EYE[1], 0.0565, 0.0135);
  P.lip = cone(x, y, z, 0, 1.5545, 0.08, 0.013, 1.556, 0.076, 0.006, 0.005);
  // Gür bıyık: üst dudağı örten, uçları aşağı sarkan kalın kıl kütlesi
  P.hair = Math.min(
    cone(x, y, z, 0.003, 1.5685, 0.088, 0.034, 1.557, 0.071, 0.0095, 0.0075),
    cone(x, y, z, 0.034, 1.557, 0.071, 0.043, 1.546, 0.053, 0.0075, 0.005),
  );
  let d = smin(smin(smin(h, P.eye, 0.002), P.lip, 0.004), P.hair, 0.003);

  // Sarık: fesin çevresine çapraz dolanmış kalın sargı; tepede fes görünür
  const ex = sx / 0.086, ez = (z + 0.008) / 0.098;
  const ring = (Math.hypot(ex, ez) - 1) * 0.09;
  const dy = y - (1.693 + 0.01 * ez);
  P.wrap = Math.sin(2 * Math.atan2(sx, z + 0.008) + dy * 48); // sargı katlarının evresi
  P.turban = Math.hypot(ring, dy / 1.45) - 0.03 + 0.004 * P.wrap * S(-0.025, 0.005, dy); // alt kenar düz: alınla arasında cep kalmasın
  P.cap = ellipsoid(x, y, z, 0, 1.712, -0.008, 0.078, 0.05, 0.09);
  d = smin(smin(d, P.cap, 0.004), P.turban, 0.03);

  P.neck = cone(x, y, z, 0, 1.45, -0.02, 0, 1.56, -0.005, 0.05, 0.047);
  d = smin(d, P.neck, 0.04);

  // Gövde: göğüs, karın, omuzlar. Cepken gömleğin üstünde 12 mm kalınlık olarak eklenir.
  let t = smin(ellipsoid(x, y, z, 0, 1.28, -0.012, 0.178, 0.19, 0.112), ellipsoid(x, y, z, 0, 1.1, -0.005, 0.158, 0.16, 0.108), 0.05);
  t = smin(t, cone(x, y, z, 0, 1.425, -0.02, 0.185, 1.425, -0.015, 0.058, 0.055), 0.04);
  t = smin(t, cone(x, y, z, 0.05, 1.47, -0.02, 0.15, 1.435, -0.018, 0.035, 0.035), 0.03);
  const open = (1 - S(0.03 + 0.05 * S(1.15, 1.45, y), 0.042 + 0.05 * S(1.15, 1.45, y), x)) * S(-0.01, 0.02, z); // önü açık
  P.cepken = S(1.15, 1.162, y) * (1 - open);
  P.torso = t - 0.012 * P.cepken;
  d = smin(d, P.torso, 0.065);

  // Kol: yatay. Cepkenin kolu ön kolun ortasına, gömleğin kolu bileğe kadar iner.
  let a = smin(cone(x, y, z, 0.185, SH, -0.015, 0.455, SH, -0.018, 0.056, 0.044), cone(x, y, z, 0.455, SH, -0.018, 0.715, SH, -0.004, 0.043, 0.029), 0.02);
  P.sleeve = 0.011 * (1 - S(0.578, 0.586, x)) + 0.006 * (1 - S(0.692, 0.7, x));
  P.arm = a - P.sleeve;
  d = smin(d, P.arm, 0.035);

  // El: avuç aşağı, parmaklar bitişik ve düz, başparmak öne doğru işaret parmağına yaslı
  let hd = roundBox(x, y, z, 0.772, 1.425, 0.002, 0.046, 0.012, 0.04, 0.012);
  hd = smin(hd, cone(x, y, z, 0.815, 1.4245, 0.0285, 0.892, 1.4235, 0.0285, 0.0098, 0.0088), 0.004);
  hd = smin(hd, cone(x, y, z, 0.815, 1.4245, 0.0095, 0.903, 1.4235, 0.0095, 0.0102, 0.009), 0.004);
  hd = smin(hd, cone(x, y, z, 0.815, 1.4245, -0.0095, 0.894, 1.4235, -0.0095, 0.0096, 0.0086), 0.004);
  hd = smin(hd, cone(x, y, z, 0.815, 1.4245, -0.027, 0.873, 1.4235, -0.027, 0.0085, 0.0075), 0.004);
  hd = smin(hd, ellipsoid(x, y, z, 0.766, 1.4225, 0.036, 0.032, 0.0145, 0.022), 0.008); // başparmak kökü
  hd = smin(hd, cone(x, y, z, 0.745, 1.421, 0.036, 0.79, 1.42, 0.056, 0.0135, 0.012), 0.014);
  hd = smin(hd, cone(x, y, z, 0.79, 1.42, 0.056, 0.826, 1.42, 0.0485, 0.0115, 0.01), 0.006);
  P.hand = hd;
  d = smin(d, hd, 0.012);

  // Kuşak: bele dolanmış geniş sargı, solda düğüm ve sarkan uç
  const cr = Math.hypot(sx * 0.7, z + 0.004) - 0.118 + 0.022;
  const ch = Math.abs(y - 1.06) - 0.058 + 0.022;
  let sash = Math.min(Math.max(cr, ch), 0) + Math.hypot(Math.max(cr, 0), Math.max(ch, 0)) - 0.022 + 0.002 * Math.sin(y * 140);
  sash = smin(sash, sphere(sx, y, z, -0.05, 1.06, 0.116, 0.03), 0.01);
  sash = smin(sash, cone(sx, y, z, -0.055, 1.04, 0.118, -0.06, 0.93, 0.115, 0.02, 0.016), 0.01);
  P.sash = sash;
  d = smin(d, sash, 0.008);

  // Şalvar: bol kalça ve bacak, dizin altında büzülür ve dolağın üstüne biner
  let sv = smin(ellipsoid(x, y, z, 0, 0.93, -0.008, 0.172, 0.135, 0.125), cone(x, y, z, 0.098, 0.9, -0.005, 0.118, 0.52, 0, 0.108, 0.084), 0.04);
  sv = smin(sv, cone(x, y, z, 0.118, 0.52, 0, 0.122, 0.43, -0.003, 0.084, 0.07), 0.02);
  sv += 0.003 * Math.sin(Math.atan2(z, x - 0.11) * 7) * S(0.45, 0.6, y) * (1 - S(0.8, 0.9, y)); // kumaş kıvrımları
  sv = smax(sv, 0.425 - y, 0.012);
  P.shalvar = sv;
  d = smin(d, sv, 0.025);

  // Dolak: baldırı saran sargı
  P.dolak = smin(cone(x, y, z, 0.122, 0.46, -0.004, 0.128, 0.09, -0.012, 0.054, 0.04), ellipsoid(x, y, z, 0.124, 0.33, -0.03, 0.045, 0.09, 0.045), 0.02);
  d = smin(d, P.dolak, 0.006);

  // Çarık: burnu hafif kalkık ham deri ayakkabı, tabanı düz
  let ft = smin(cone(x, y, z, 0.13, 0.05, -0.045, 0.134, 0.04, 0.125, 0.05, 0.038), sphere(x, y, z, 0.134, 0.05, 0.165, 0.024), 0.02);
  P.foot = ft;
  d = smin(d, ft, 0.015);
  return Math.max(d, -y); // yerin altı yok: ayak tabanları y = 0'da düz
}

// --- Malzemeler ve renkler (mat ve koyu) ---
const M = { skin: 0, hair: 1, sclera: 2, iris: 3, lip: 4, turban: 5, cap: 6, shirt: 7, cepken: 8, sash: 9, shalvar: 10, dolak: 11, leather: 12 };
const PARTS = ['head', 'hair', 'eye', 'lip', 'turban', 'cap', 'neck', 'torso', 'arm', 'hand', 'sash', 'shalvar', 'dolak', 'foot'];

// Noktadaki malzeme: en yakın parça ve o parçanın içindeki bölge.
function material(sx, y, z) {
  body(sx, y, z);
  const x = Math.abs(sx);
  let key = 'head';
  let best = Infinity;
  for (const k of PARTS) {
    if (P[k] < best) {
      best = P[k];
      key = k;
    }
  }
  switch (key) {
    case 'head': {
      const brow = cone(x, y, z, 0.01, 1.636, 0.086, 0.048, 1.647, 0.068, 0.0055, 0.0045);
      const onEar = Math.hypot(x - 0.079, y - 1.612, (z + 0.006) * 1.3) < 0.03 && x > 0.074;
      const hairline = z < 0.0 && y > 1.562; // kulağın arkası ve ense
      const sideburn = z < 0.028 && y > 1.618 && x > 0.055;
      return brow < 0.0035 || (!onEar && (hairline || sideburn)) ? M.hair : M.skin;
    }
    case 'eye':
      return Math.hypot(x - EYE[0], y - (EYE[1] - 0.001)) < 0.0078 ? M.iris : M.sclera;
    case 'hair': return M.hair;
    case 'lip': return M.lip;
    case 'turban': return M.turban;
    case 'cap': return M.cap;
    case 'torso': return P.cepken > 0.5 ? M.cepken : M.shirt;
    case 'arm': return x < 0.582 ? M.cepken : x < 0.696 ? M.shirt : M.skin;
    case 'sash': return M.sash;
    case 'shalvar': return M.shalvar;
    case 'dolak': return M.dolak;
    case 'foot': return M.leather;
    default: return M.skin; // boyun, el
  }
}

const C = (hex) => new THREE.Color(hex);
const COL = {
  skin: C(0x7d5136), stubble: C(0x33261d), lip: C(0x55302a), hair: C(0x0c0a08), sclera: C(0x7a7263), iris: C(0x120a06),
  turban: C(0x23272e), turbanLight: C(0x565d68), cap: C(0x3b1512), shirt: C(0x928b74), grime: C(0x4f4636), cepken: C(0x2c1f17),
  sash: C(0x601310), shalvar: C(0x111111), dust: C(0x4a4033), dolak: C(0x4d463a), leather: C(0x432f1f), mud: C(0x1d1711),
};
const noise = (x, y, z) => 0.5 + 0.25 * Math.sin(x * 37 + y * 11) * Math.sin(z * 41 - y * 23) + 0.25 * Math.sin(y * 17 + x * 29 + z * 13);

function colorAt(sx, y, z, c) {
  const id = material(sx, y, z); // P de bu nokta için dolar
  const n = noise(sx, y, z);
  switch (id) {
    case M.skin: {
      c.copy(COL.skin);
      // Birkaç günlük sakal: çene, yanakların altı ve boynun üstü
      const beard = (1 - S(1.576, 1.598, y)) * S(1.5, 1.535, y) * S(-0.012, 0.02, z) * (y > 1.45 ? 1 : 0);
      c.lerp(COL.stubble, 0.6 * beard).multiplyScalar(0.86 + 0.24 * n);
      break;
    }
    case M.hair: c.copy(COL.hair); break;
    case M.sclera: c.copy(COL.sclera); break;
    case M.iris: c.copy(COL.iris); break;
    case M.lip: c.copy(COL.lip); break;
    case M.turban: c.copy(COL.turban).lerp(COL.turbanLight, S(0.1, 0.7, P.wrap)).multiplyScalar(0.85 + 0.3 * n); break;
    case M.cap: c.copy(COL.cap).multiplyScalar(0.8 + 0.4 * n); break;
    case M.cepken: c.copy(COL.cepken).multiplyScalar(0.8 + 0.45 * n); break;
    case M.shirt: c.copy(COL.shirt).lerp(COL.grime, 0.15 + 0.55 * n * n); break;
    case M.sash: c.copy(COL.sash).multiplyScalar(0.75 + 0.3 * Math.sin(y * 140) ** 2 + 0.2 * n); break;
    case M.shalvar: c.copy(COL.shalvar).lerp(COL.dust, 0.5 * (1 - S(0.43, 0.6, y)) * n + 0.08 * n); break;
    case M.dolak: c.copy(COL.dolak).multiplyScalar(0.75 + 0.4 * n).lerp(COL.mud, 0.5 * (1 - S(0.1, 0.25, y))); break;
    default: c.copy(COL.leather).multiplyScalar(0.8 + 0.4 * n).lerp(COL.mud, 0.6 * (1 - S(0.0, 0.04, y)));
  }
  return c;
}

export function createBandit() {
  const t0 = performance.now();
  const { positions, indices } = meshField(body, [-0.92, 0, -0.2, 0.92, 1.78, 0.2], 0.034, [
    { x: 0, y: 1.6, z: 0.065, r: 0.042, s: 7 }, // yüz
    { x: 0.835, y: 1.424, z: 0.008, r: 0.06, s: 5 }, // eller
    { x: -0.835, y: 1.424, z: 0.008, r: 0.06, s: 5 },
  ]);
  sharpenBoundaries(body, material, positions, indices);

  // Renkler ölçeklemeden önce, özgün koordinatlarda hesaplanır
  const colors = new Float32Array(positions.length);
  const c = new THREE.Color();
  for (let i = 0; i < positions.length; i += 3) colorAt(positions[i], positions[i + 1], positions[i + 2], c).toArray(colors, i);

  // Boy tam 1,75 m; ayak tabanları y = 0; iki ayağın ortası (0, 0, 0)
  let top = 0, bottom = Infinity, zMin = Infinity, zMax = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    top = Math.max(top, positions[i + 1]);
    bottom = Math.min(bottom, positions[i + 1]);
    if (positions[i + 1] < 0.03) {
      zMin = Math.min(zMin, positions[i + 2]);
      zMax = Math.max(zMax, positions[i + 2]);
    }
  }
  const scale = 1.75 / (top - bottom);
  const zShift = -(zMin + zMax) / 2;
  for (let i = 0; i < positions.length; i += 3) {
    const y = (positions[i + 1] - bottom) * scale;
    positions[i] *= scale;
    positions[i + 1] = y < 0.004 ? 0 : y; // taban köşeleri tam yere otursun
    positions[i + 2] = (positions[i + 2] + zShift) * scale;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  // Ağ tek parça ve kapalı olmalı: her kenar tam iki üçgene ait, Euler sayısı 2
  const report = checkClosed(positions, indices);
  console.info('eskiya', JSON.stringify({ ...report, where: undefined, ms: Math.round(performance.now() - t0) }));
  if (report.badEdges || report.euler !== 2) console.warn('eskiya: ağ kapalı değil', report.where);

  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ name: 'eskiya', vertexColors: true, roughness: 0.92, metalness: 0 }));
  mesh.name = 'govde';
  mesh.castShadow = mesh.receiveShadow = true;
  const root = new THREE.Group();
  root.name = 'eskiya_deneme';
  root.add(mesh);
  return root;
}
