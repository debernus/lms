import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Bakır askılı çay tepsisi (çaycı askısı); sahne eşyası. Kalem işi bezemeli yuvarlak tepsi, üç
// kavisli kol, tepede çan biçimli başlık ve taşıma halkası; içinde çay dolu beş ince belli bardak. Gerçek boyut (çap 32 cm, yükseklik
// yaklaşık 41 cm), 1 birim = 1 metre, Y yukarı; taban y = 0'da, taban ortası (0, 0, 0)'da.

const TAU = Math.PI * 2;
const LIGHT = '#b9785a', MID = '#8a5038', DARK = '#2e1812';

function texture(name, w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.name = name;
  return t;
}
// Tepsinin yüzü: ortadan dönerek açılan çark-ı felek kolları, aralarında yapraklar, çevrede kuşak.
const trayTexture = () => texture('tepsi_kalem_isi', 1024, 1024, (g) => {
  const C = 512;
  g.fillStyle = DARK;
  g.fillRect(0, 0, 1024, 1024);
  g.translate(C, C);
  g.lineCap = 'round';
  const ARMS = 18;
  const spiral = (k, r) => (k / ARMS) * TAU + (r / 400) ** 0.8 * 1.5;
  for (let k = 0; k < ARMS; k++) {
    // Kol: çift çizgi
    for (const [off, width, color] of [[0, 7, LIGHT], [0.09, 3, MID]]) {
      g.strokeStyle = color;
      g.lineWidth = width;
      g.beginPath();
      for (let r = 24; r <= 398; r += 6) g.lineTo(Math.cos(spiral(k, r) + off * (r / 398)) * r, Math.sin(spiral(k, r) + off * (r / 398)) * r);
      g.stroke();
    }
    // Kolların arasındaki yapraklar ve küçük çiçekler
    for (const r of [120, 175, 235, 295, 355]) {
      const a = spiral(k + 0.5, r), s = 6 + r * 0.035;
      g.save();
      g.translate(Math.cos(a) * r, Math.sin(a) * r);
      g.rotate(a + 0.9);
      g.fillStyle = LIGHT;
      g.beginPath(); g.ellipse(0, 0, s * 1.5, s * 0.6, 0, 0, TAU); g.fill();
      g.fillStyle = MID;
      g.beginPath(); g.ellipse(s * 1.2, s * 0.9, s * 0.8, s * 0.35, 0.8, 0, TAU); g.fill();
      g.restore();
    }
  }
  g.fillStyle = LIGHT;
  g.beginPath(); g.arc(0, 0, 20, 0, TAU); g.fill();
  g.fillStyle = DARK;
  g.beginPath(); g.arc(0, 0, 9, 0, TAU); g.fill();
  // Çevre kuşağı: iki halka arasında dizili yaprak motifleri
  g.strokeStyle = LIGHT;
  for (const [r, w] of [[408, 6], [420, 2.5], [478, 2.5], [492, 7]]) {
    g.lineWidth = w;
    g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
  }
  for (let k = 0; k < 44; k++) {
    const a = (k / 44) * TAU;
    g.save();
    g.rotate(a);
    g.translate(449, 0);
    g.fillStyle = k % 2 ? LIGHT : MID;
    g.beginPath(); g.ellipse(0, 0, 20, 9, k % 2 ? 0.5 : -0.5, 0, TAU); g.fill();
    g.restore();
  }
});
// Başlığın yüzü: kıvrık dal kuşakları (çevre boyunca tekrar eder)
const capTexture = () => texture('baslik_kalem_isi', 512, 256, (g) => {
  g.fillStyle = DARK;
  g.fillRect(0, 0, 512, 256);
  g.strokeStyle = LIGHT;
  g.lineWidth = 5;
  for (const y of [14, 70, 236]) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  for (let k = 0; k < 8; k++) {
    const x = k * 64 + 32;
    g.lineWidth = 4;
    g.beginPath(); g.arc(x, 150, 26, 0.6, TAU - 0.9); g.stroke();
    g.beginPath(); g.arc(x + 8, 150, 12, 2, TAU + 0.6); g.stroke();
    g.fillStyle = MID;
    g.beginPath(); g.ellipse(x, 42, 18, 8, 0, 0, TAU); g.fill();
  }
});

export function createAskiliTepsi() {
  const copper = (name, extra = {}) => new THREE.MeshStandardMaterial({ name, color: 0x8a4c34, roughness: 0.45, metalness: 0.85, ...extra });
  const root = new THREE.Group();
  root.name = 'askili_tepsi';
  const add = (name, geometry, material) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
  };
  const R = 0.16;

  // Tepsi gövdesi: alt yüz, hafif kalkık dilimli kenar (üst yüz ayrı, bezemeli)
  const profile = [[0, 0], [R - 0.012, 0], [R, 0.004], [R + 0.004, 0.011], [R + 0.002, 0.0135], [R - 0.004, 0.011], [R - 0.012, 0.0062]];
  const body = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 72);
  const bp = body.attributes.position;
  for (let i = 0; i < bp.count; i++) { // kenarı dilimle: 36 küçük dalga
    const x = bp.getX(i), z = bp.getZ(i), r = Math.hypot(x, z);
    if (r > R - 0.006) {
      const k = 1 + (0.0035 * Math.cos(Math.atan2(z, x) * 36)) / r;
      bp.setXYZ(i, x * k, bp.getY(i), z * k);
    }
  }
  body.computeVertexNormals();
  add('tepsi', body, copper('bakir', { side: THREE.DoubleSide }));
  add('tepsi_yuzu', new THREE.CircleGeometry(R - 0.012, 72).rotateX(-Math.PI / 2).translate(0, 0.0062, 0), copper('bakir_bezemeli', { color: 0xffffff, map: trayTexture(), roughness: 0.5 }));

  // Üç kol: kenardan dik çıkar, içe kıvrılıp başlığın altında birleşir; burma görünümlü altıgen kesit
  const arm = new THREE.CatmullRomCurve3([[R - 0.016, 0.006], [R - 0.012, 0.05], [R - 0.03, 0.12], [0.085, 0.19], [0.04, 0.245], [0.026, 0.285]].map(([r, y]) => new THREE.Vector3(r, y, 0)));
  const armGeo = new THREE.TubeGeometry(arm, 40, 0.0052, 6);
  const arms = [0, 1, 2].map((k) => armGeo.clone().rotateY((k / 3) * TAU + Math.PI / 2));
  const merged = new THREE.BufferGeometry();
  const pos = [], nrm = [], idx = [];
  arms.forEach((g, k) => {
    const base = pos.length / 3;
    pos.push(...g.attributes.position.array);
    nrm.push(...g.attributes.normal.array);
    for (const i of g.index.array) idx.push(i + base);
  });
  merged.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  merged.setIndex(idx);
  add('kollar', merged, copper('bakir'));

  // Çan biçimli başlık ve üstündeki boyun
  const cap = [[0.0, 0.276], [0.04, 0.276], [0.043, 0.28], [0.041, 0.286], [0.036, 0.31], [0.029, 0.338], [0.02, 0.356], [0.013, 0.362], [0.012, 0.37], [0.017, 0.374], [0.013, 0.38], [0, 0.381]];
  add('baslik', new THREE.LatheGeometry(cap.map(([r, y]) => new THREE.Vector2(r, y)), 32), copper('baslik_bezemeli', { color: 0xffffff, map: capTexture(), roughness: 0.5 }));

  // Taşıma halkası: boğumlu, hafif uzun halka
  const ring = new THREE.TorusGeometry(0.027, 0.0032, 8, 36).scale(1, 1.15, 1).translate(0, 0.381 + 0.027 * 1.15 - 0.002, 0);
  add('halka', ring, copper('bakir'));

  // Beş ince belli çay bardağı, tabaklarıyla; bardaklar demli çayla dolu
  const Y0 = 0.0064; // tepsinin yüzü
  const lathe = (profile, segs) => new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segs).toNonIndexed();
  const saucer = [[0, 0.004], [0.024, 0.004], [0.042, 0.009], [0.046, 0.0115], [0.045, 0.0128], [0.04, 0.0105], [0.024, 0.006], [0, 0.006]];
  const band = [[0.0405, 0.0109], [0.0452, 0.0131]]; // tabağın kenarındaki kırmızı şerit
  const glass = [[0, 0.007], [0.021, 0.007], [0.0225, 0.012], [0.02, 0.03], [0.0185, 0.042], [0.021, 0.06], [0.026, 0.08], [0.0275, 0.09], [0.0265, 0.09], [0.025, 0.08], [0.0198, 0.06]];
  const tea = [[0, 0.0095], [0.0205, 0.0095], [0.0212, 0.013], [0.0188, 0.03], [0.0174, 0.042], [0.0198, 0.06], [0.0245, 0.08], [0.0251, 0.083], [0, 0.083]];
  const groups = { tabaklar: [], tabak_seritleri: [], bardaklar: [], cay: [] };
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * TAU + 0.31, x = Math.cos(a) * 0.092, z = Math.sin(a) * 0.092;
    groups.tabaklar.push(lathe(saucer, 24).translate(x, Y0, z));
    groups.tabak_seritleri.push(lathe(band, 24).translate(x, Y0, z));
    groups.bardaklar.push(lathe(glass, 20).translate(x, Y0, z));
    groups.cay.push(lathe(tea, 20).translate(x, Y0, z));
  }
  const materials = {
    tabaklar: new THREE.MeshStandardMaterial({ name: 'porselen', color: 0xd9d4c6, roughness: 0.35, side: THREE.DoubleSide }),
    tabak_seritleri: new THREE.MeshStandardMaterial({ name: 'tabak_seridi', color: 0x8c1f1a, roughness: 0.4, side: THREE.DoubleSide }),
    bardaklar: new THREE.MeshStandardMaterial({ name: 'cam', color: 0xe8efec, roughness: 0.06, transparent: true, opacity: 0.3, side: THREE.DoubleSide }),
    // Çay opaktır: camın arkasında her açıdan görünür
    cay: new THREE.MeshStandardMaterial({ name: 'cay', color: 0x6e1d07, roughness: 0.15 }),
  };
  for (const key of Object.keys(groups)) {
    add(key, mergeGeometries(groups[key]), materials[key]);
    if (key === 'bardaklar') root.children[root.children.length - 1].castShadow = false;
  }
  return root;
}
