import * as THREE from 'three';
import { canvasTexture } from './halk2.js';

// Uzun namlulu toplu tabanca (revolver), 1900'ler: 20 cm sekizgen namlu, oluklu altı gözlü top, açık horoz,
// geniş tetik korkuluğu, ceviz kabza, kabza dibinde kayış halkası. Kararmış, aşınmış çelik.
// 1 birim = 1 metre, Y yukarı, namlu +Z'ye bakar, en alt nokta y = 0, boyca ortalanmış. Boy 33 cm.
// Parçalar: revolver_govde, revolver_namlu, revolver_top, revolver_horoz, revolver_tetik, revolver_kabza.

const TAU = Math.PI * 2;
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
// Yan görünüş çizgisinden (z, y) kalınlığı t olan parça; kalınlık X boyunca ortalanır
function profile(points, t, bevel = 0.0012, hole = null) {
  const s = new THREE.Shape();
  points.forEach(([z, y], i) => (i ? s.lineTo(z, y) : s.moveTo(z, y)));
  s.closePath();
  if (hole) {
    const h = new THREE.Path();
    hole.forEach(([z, y], i) => (i ? h.lineTo(z, y) : h.moveTo(z, y)));
    h.closePath();
    s.holes.push(h);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: t - 2 * bevel, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1, curveSegments: 1 });
  g.translate(0, 0, -(t - 2 * bevel) / 2);
  g.rotateY(-Math.PI / 2); // çizimin x'i → dünya z'si
  return g;
}
const alongZ = (g, y, z) => {
  g.rotateX(Math.PI / 2);
  g.translate(0, y, z);
  return g;
};
function merge(list) {
  const pos = [], nor = [], uv = [], idx = [];
  let base = 0;
  for (const g of list) {
    const index = g.index ? g.index.array : Array.from({ length: g.attributes.position.count }, (_, i) => i);
    for (const v of g.attributes.position.array) pos.push(v);
    for (const v of g.attributes.normal.array) nor.push(v);
    for (const v of g.attributes.uv.array) uv.push(v);
    for (const i of index) idx.push(i + base);
    base += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx);
  return out;
}
const ellipse = (cz, cy, rz, ry, n = 28) => Array.from({ length: n }, (_, k) => [cz + Math.cos((k / n) * TAU) * rz, cy + Math.sin((k / n) * TAU) * ry]);

export function createRevolver() {
  const root = new THREE.Group();
  root.name = 'revolver';
  const rand = rng(1911);
  const steelMap = canvasTexture('kararmis_celik', 256, 256, (g) => {
    g.fillStyle = '#5a5d64';
    g.fillRect(0, 0, 256, 256);
    g.filter = 'blur(6px)';
    for (let i = 0; i < 40; i++) {
      g.fillStyle = i % 3 ? `rgba(150,150,150,${0.05 + rand() * 0.1})` : `rgba(96,58,34,${0.08 + rand() * 0.12})`; // aşınmış parlak yerler ve pas
      g.beginPath();
      g.ellipse(rand() * 256, rand() * 256, 6 + rand() * 30, 4 + rand() * 16, rand() * 3, 0, TAU);
      g.fill();
    }
    g.filter = 'none';
    for (let i = 0; i < 140; i++) {
      g.strokeStyle = `rgba(200,200,205,${0.05 + rand() * 0.14})`;
      g.lineWidth = 0.6;
      g.beginPath();
      const x = rand() * 256, y = rand() * 256;
      g.moveTo(x, y);
      g.lineTo(x + (rand() - 0.5) * 50, y + (rand() - 0.5) * 10);
      g.stroke();
    }
  });
  const woodMap = canvasTexture('ceviz_kabza', 256, 256, (g) => {
    g.fillStyle = '#5a3420';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 200; i++) {
      g.fillStyle = `rgba(${rand() < 0.6 ? '24,12,6' : '170,110,70'},${0.06 + rand() * 0.16})`;
      g.fillRect(rand() * 256, rand() * 256, 1 + rand() * 2.5, 30 + rand() * 140);
    }
    // Baklava tırtıl izleri
    g.strokeStyle = 'rgba(20,10,6,0.28)';
    g.lineWidth = 1;
    for (let i = -256; i < 512; i += 9) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i + 256, 256);
      g.moveTo(i + 256, 0);
      g.lineTo(i, 256);
      g.stroke();
    }
  });
  const steel = new THREE.MeshStandardMaterial({ name: 'kararmis_celik', map: steelMap, roughness: 0.45, metalness: 0.6 });
  const dark = new THREE.MeshStandardMaterial({ name: 'namlu_ici', color: 0x050506, roughness: 0.9 });
  const wood = new THREE.MeshStandardMaterial({ name: 'ceviz_kabza', map: woodMap, roughness: 0.7, metalness: 0 });
  const BY = 0.12, CY = 0.107; // namlu ekseni, top ekseni
  const add = (name, geometry, material) => {
    const m = new THREE.Mesh(geometry, material);
    m.name = name;
    m.castShadow = m.receiveShadow = true;
    root.add(m);
    return m;
  };
  const box = (x, y, z, cy, cz) => new THREE.BoxGeometry(x, y, z).translate(0, cy, cz);

  // ---------- Gövde: arka gövde, üst ve alt köprü, namlu yatağı, geniş tetik korkuluğu, kayış halkası ----------
  const guardOuter = ellipse(0.022, 0.052, 0.043, 0.034), guardInner = ellipse(0.022, 0.052, 0.0385, 0.0295).reverse();
  add('revolver_govde', merge([
    profile([[-0.046, 0.083], [0, 0.076], [0, 0.138], [-0.02, 0.138], [-0.034, 0.128], [-0.049, 0.104]], 0.017),
    alongZ(new THREE.CylinderGeometry(0.0225, 0.0225, 0.006, 24), CY, -0.003), // top yatağı (geri tepme kalkanı)
    box(0.013, 0.008, 0.066, 0.134, 0.028), // üst köprü
    box(0.014, 0.008, 0.066, 0.08, 0.028), // alt köprü
    profile([[0.043, 0.076], [0.064, 0.082], [0.068, 0.1], [0.064, 0.138], [0.043, 0.138]], 0.019), // namlu yatağı
    profile(guardOuter, 0.009, 0.001, guardInner), // tetik korkuluğu: geniş halka
    alongZ(new THREE.CylinderGeometry(0.0032, 0.0032, 0.1, 8), 0.1015, 0.118), // çıkarıcı çubuk
    box(0.007, 0.012, 0.01, 0.106, 0.165), // çubuk yuvası
    box(0.0022, 0.006, 0.012, BY + 0.0125, 0.262), // arpacık
    new THREE.TorusGeometry(0.007, 0.0016, 6, 14).rotateY(Math.PI / 2).translate(0, 0.004, -0.058), // kayış halkası
    box(0.005, 0.008, 0.005, 0.012, -0.058),
  ]), steel);

  // ---------- Namlu: sekizgen, uzun; ağzında koyu delik ----------
  add('revolver_namlu', merge([
    alongZ(new THREE.CylinderGeometry(0.0092, 0.0098, 0.205, 8).rotateY(Math.PI / 8), BY, 0.1665),
    alongZ(new THREE.CylinderGeometry(0.0105, 0.0105, 0.004, 8).rotateY(Math.PI / 8), BY, 0.267), // namlu ağzı bileziği
  ]), steel);
  add('revolver_namlu_agzi', alongZ(new THREE.CircleGeometry(0.0046, 12).rotateX(-Math.PI / 2), BY, 0.2692), dark);

  // ---------- Top: altı oluklu silindir; ön yüzünde altı göz ----------
  const outline = Array.from({ length: 72 }, (_, k) => {
    const a = (k / 72) * TAU, flute = Math.max(0, Math.cos(6 * a)) ** 4; // gözlerin arasında oluk
    const r = 0.0218 - 0.004 * flute;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
  const shape = new THREE.Shape();
  outline.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  const fluted = new THREE.ExtrudeGeometry(shape, { depth: 0.028, bevelEnabled: false, curveSegments: 1 }).translate(0, CY, 0.013);
  const drum = [fluted, alongZ(new THREE.CylinderGeometry(0.0218, 0.0218, 0.0125, 36), CY, 0.00675)];
  add('revolver_top', merge(drum), steel);
  const holes = [];
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU + Math.PI / 6 + Math.PI / 3;
    holes.push(alongZ(new THREE.CircleGeometry(0.0047, 10).rotateX(-Math.PI / 2), CY + Math.sin(a) * 0.013, 0.0412).translate(Math.cos(a) * 0.013, 0, 0));
  }
  add('revolver_top_gozleri', merge(holes), dark);

  // ---------- Horoz, tetik ----------
  add('revolver_horoz', profile([[-0.029, 0.124], [-0.02, 0.136], [-0.024, 0.146], [-0.036, 0.157], [-0.05, 0.163], [-0.054, 0.157], [-0.043, 0.148], [-0.041, 0.124]], 0.008), steel);
  add('revolver_tetik', profile([[0.006, 0.078], [0.016, 0.078], [0.013, 0.062], [0.017, 0.046], [0.0125, 0.044], [0.0065, 0.06]], 0.0055, 0.0008), steel);

  // ---------- Kabza: kuş başı biçimli ceviz yanaklar ----------
  add('revolver_kabza', profile([[-0.046, 0.085], [-0.008, 0.079], [-0.014, 0.058], [-0.024, 0.034], [-0.036, 0.012], [-0.05, 0.004], [-0.068, 0.008], [-0.078, 0.022], [-0.076, 0.04], [-0.066, 0.062], [-0.056, 0.084], [-0.05, 0.103]], 0.027, 0.005), wood);

  // Boyca ortala, en alt noktayı y = 0'a getir
  const bounds = new THREE.Box3().setFromObject(root), dz = -(bounds.min.z + bounds.max.z) / 2;
  root.traverse((o) => {
    if (o.isMesh) o.geometry.translate(0, -bounds.min.y, dz);
  });
  return root;
}
