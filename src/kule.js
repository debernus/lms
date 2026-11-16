import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Yuvarlak taş gözetleme kulesi; sahne yapısı. Moloz taş örgülü gövde, üstte dışa taşan mazgallı
// seyir katı, taş sütunlar üstünde taş külah. Zemin katında +Z'ye bakan kapısı olan nöbet odası. Gerçek boyut (çap 4,4 m, yükseklik yaklaşık 17 m),
// 1 birim = 1 metre, Y yukarı; taban y = 0'da, taban ortası (0, 0, 0)'da.

const TAU = Math.PI * 2;
const TILE = 2.4; // dokunun bir tekrarının kapladığı uzunluk (metre)

// Moloz taş duvar: düzensiz sıralar, değişen boyda taşlar, koyu derzler. Her yönde döşenebilir.
function stoneTexture() {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  let seed = 42;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  g.fillStyle = '#2b2c2b';
  g.fillRect(0, 0, size, size);
  const rows = [];
  for (let y = 0; y < size;) {
    const h = Math.min(size - y, 20 + Math.floor(rand() * 20));
    rows.push([y, size - y - h < 14 ? size - y : h]);
    y += rows[rows.length - 1][1];
  }
  for (const [y, h] of rows) {
    const start = -Math.floor(rand() * 40);
    for (let x = start; x < size;) {
      const w = 26 + Math.floor(rand() * 52);
      const tone = 96 + rand() * 62;
      const tint = rand();
      g.fillStyle = `rgb(${tone * (0.97 + tint * 0.05)},${tone},${tone * (1.0 - tint * 0.06)})`;
      for (const ox of [0, size]) { // yatayda sarar
        g.beginPath();
        g.roundRect(x + ox + 2, y + 2, w - 3, h - 3, 5);
        g.fill();
      }
      // Taşın yüzünde hafif lekeler
      for (let k = 0; k < 3; k++) {
        g.fillStyle = `rgba(${rand() < 0.5 ? '20,20,20' : '210,210,205'},${0.05 + rand() * 0.1})`;
        g.fillRect(x + 4 + rand() * (w - 12), y + 4 + rand() * (h - 10), 4 + rand() * 12, 3 + rand() * 7);
      }
      x += w;
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.name = 'moloz_tas';
  return t;
}

// Taş dokusu gerçek ölçüde otursun: yan yüzlerde çevre ve yükseklik, yatay yüzlerde x-z kullanılır.
function mapStone(geometry) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  g.computeVertexNormals();
  const p = g.attributes.position, n = g.attributes.normal, uv = [];
  for (let i = 0; i < p.count; i += 3) {
    const flat = Math.abs(n.getY(i)) > 0.8;
    // Üçgenin köşeleri açı dikişinin iki yanına düşmesin: açılar ilk köşeye göre açılır
    const a0 = Math.atan2(p.getZ(i), p.getX(i));
    for (let k = 0; k < 3; k++) {
      const x = p.getX(i + k), y = p.getY(i + k), z = p.getZ(i + k);
      if (flat) { uv.push(x / TILE, z / TILE); continue; }
      // Kapı yanağı gibi merkeze doğru uzanan yüzler: çevre yerine derinlik (yarıçap) kullanılır
      const rr = Math.hypot(x, z) || 1;
      if (Math.abs((n.getX(i) * x + n.getZ(i) * z) / rr) < 0.5) { uv.push(rr / TILE, y / TILE); continue; }
      let a = Math.atan2(z, x);
      if (a - a0 > Math.PI) a -= TAU;
      if (a0 - a > Math.PI) a += TAU;
      // Çevre boyunca tam sayıda tekrar: dikişte desen kopmaz
      const repeats = Math.max(1, Math.round((TAU * 2.4) / TILE));
      uv.push((a / TAU) * repeats, y / TILE + Math.hypot(x, z) * 0.15);
    }
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

// Halka parçası: iç ve dış yarıçap, alt ve üst yükseklik, açı aralığı (kapalı kutu).
function arcBlock(r0, r1, y0, y1, a0, a1, segs = 6) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, r1, a0, a1, false);
  shape.absarc(0, 0, r0, a1, a0, true);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false, curveSegments: segs }).rotateX(-Math.PI / 2).translate(0, y0, 0);
}

export function createKule() {
  const R = 2.2, BODY = 12, TOP_R = 2.65, WALK = 12.9; // gövde yarıçapı ve yüksekliği, seyir katı
  const parts = [];
  // Gövde ve dışa taşan seyir katı (profil döndürülür); üstü döşemeyle kapalı
  // Zemin katı içi boş bir nöbet odasıdır: çevre duvarı, +Z yönünde kapı boşluğu, lento, döşeme, tavan
  const ROOM = { r: 1.5, h: 3.0, door: 2.15, half: Math.asin(0.55 / R) }; // kapı 1,1 m x 2,15 m
  const DOOR = -Math.PI / 2; // halka parçalarında +Z yönünün açısı
  parts.push(arcBlock(ROOM.r, R, 0, ROOM.h, DOOR + ROOM.half, DOOR + TAU - ROOM.half, 36));
  parts.push(arcBlock(ROOM.r, R, ROOM.door, ROOM.h, DOOR - ROOM.half, DOOR + ROOM.half, 4)); // kapı üstü lentosu
  parts.push(new THREE.CircleGeometry(ROOM.r + 0.02, 32).rotateX(-Math.PI / 2).translate(0, 0.02, 0)); // taş döşeme
  parts.push(new THREE.CircleGeometry(ROOM.r + 0.02, 32).rotateX(Math.PI / 2).translate(0, ROOM.h, 0)); // tavan
  const profile = [[R, ROOM.h], [R, BODY], [TOP_R - 0.15, BODY + 0.45], [TOP_R, BODY + 0.75], [TOP_R, WALK], [0, WALK]];
  parts.push(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 40));
  // Korkuluk duvarı ve sekiz mazgal dişi
  parts.push(arcBlock(TOP_R - 0.4, TOP_R, WALK, WALK + 0.6, 0, TAU, 40));
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU;
    parts.push(arcBlock(TOP_R - 0.4, TOP_R, WALK + 0.6, WALK + 1.25, a - 0.24, a + 0.24, 4));
  }
  // Külahı taşıyan altı taş sütun ve üstlerindeki halka kiriş
  const POST_R = 1.75, ROOF = WALK + 2.9;
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU + 0.26;
    parts.push(new THREE.CylinderGeometry(0.15, 0.17, ROOF - WALK, 8).translate(Math.cos(a) * POST_R, (WALK + ROOF) / 2, Math.sin(a) * POST_R));
  }
  parts.push(arcBlock(POST_R - 0.22, POST_R + 0.22, ROOF, ROOF + 0.22, 0, TAU, 32));
  // Taş külah: saçağı dışa taşar, altı kapalı
  parts.push(new THREE.ConeGeometry(3.15, 1.9, 32, 3, false).translate(0, ROOF + 0.22 + 0.95, 0));

  const mesh = new THREE.Mesh(
    mergeGeometries(parts.map(mapStone)),
    new THREE.MeshStandardMaterial({ name: 'moloz_tas', map: stoneTexture(), roughness: 0.95, metalness: 0 }),
  );
  mesh.name = 'kule';
  mesh.castShadow = mesh.receiveShadow = true;
  const root = new THREE.Group();
  root.name = 'tas_kule';
  root.add(mesh);
  return root;
}
