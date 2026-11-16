import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Dökme demir sokak lambası direği (1914, Osmanlı İstanbul'u). Birim metre, Y yukarı,
// taban ortası (0, 0, 0), ön yüz +Z. Dokusuz: pas lekeleri köşe renkleriyle verilir.

const IRON = new THREE.Color(0x18211c); // koyu yeşile çalan siyah
const RUST = new THREE.Color(0x4b2c1b);
const SEGMENTS = 16;

// Konuma bağlı pas miktarı (0..1): yer yer lekeler, kaidede ve yere yakın kısımda daha çok.
function rustAt(x, y, z) {
  const n = Math.sin(x * 43 + y * 11) * Math.sin(z * 39 - y * 7) + 0.6 * Math.sin(y * 4.3 + x * 17 + z * 23);
  const nearGround = THREE.MathUtils.smoothstep(0.5, 0, y) * 0.5;
  return THREE.MathUtils.clamp((n - 0.3) * 1.3 + nearGround, 0, 0.85);
}

// Ağa uv'siz, köşe renkli son halini verir (birleştirme için hepsi aynı öznitelikleri taşır).
function paint(geometry) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  g.deleteAttribute('uv');
  const pos = g.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    c.copy(IRON).lerp(RUST, rustAt(pos.getX(i), pos.getY(i), pos.getZ(i))).toArray(colors, i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return g;
}

// Profili Y ekseni etrafında döndürür. Profil: [yarıçap, y, yivli mi]. Her kuşağın kendi köşeleri
// olduğu için silmeler keskin, çevre yönü yumuşak gölgelenir. Alt ve üst kapak yoktur.
function revolve(points) {
  // Uzun kuşakları böl: pas lekeleri köşe renkleriyle verildiği için gövdede ara köşe gerekir.
  const profile = [points[0]];
  for (let j = 1; j < points.length; j++) {
    const [r0, y0] = points[j - 1];
    const [r1, y1, fluted] = points[j];
    const parts = Math.max(1, Math.ceil((y1 - y0) / 0.17));
    for (let i = 1; i <= parts; i++) profile.push([r0 + ((r1 - r0) * i) / parts, y0 + ((y1 - y0) * i) / parts, fluted]);
  }
  const positions = [];
  const indices = [];
  for (let j = 0; j < profile.length - 1; j++) {
    const base = positions.length / 3;
    for (const [r, y, fluted] of [profile[j], profile[j + 1]]) {
      for (let k = 0; k < SEGMENTS; k++) {
        const a = (k / SEGMENTS) * Math.PI * 2;
        const rr = fluted && k % 2 ? r * 0.8 : r; // yiv: her ikinci köşe içeride
        positions.push(Math.sin(a) * rr, y, Math.cos(a) * rr);
      }
    }
    for (let k = 0; k < SEGMENTS; k++) {
      const k1 = (k + 1) % SEGMENTS;
      const a = base + k, b = base + k1, c = base + SEGMENTS + k, d = base + SEGMENTS + k1;
      indices.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

function box(w, h, d, x, y, z) {
  return new THREE.BoxGeometry(w, h, d).translate(x, y, z);
}

// a'dan b'ye uzanan ince çubuk.
function bar(a, b, thickness) {
  const dir = b.clone().sub(a);
  const g = new THREE.BoxGeometry(thickness, dir.length(), thickness);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()));
  const mid = a.clone().lerp(b, 0.5);
  return g.translate(mid.x, mid.y, mid.z);
}

export function createStreetLamp() {
  // --- Kaide ve gövde ---
  const profile = [
    [0.15, 0, 0], [0.15, 0.06, 0], // alt tabla, çap 30 cm
    [0.132, 0.075, 0], [0.128, 0.13, 0],
    [0.14, 0.15, 0], [0.14, 0.17, 0],
    [0.108, 0.2, 1], [0.092, 0.5, 1], // yivli kaide gövdesi
    [0.112, 0.52, 0], [0.112, 0.55, 0],
    [0.072, 0.585, 0], [0.072, 0.62, 0],
    [0.05, 0.66, 0], [0.047, 1.0, 0],
    [0.058, 1.015, 0], [0.058, 1.045, 0], [0.046, 1.06, 0], // gövde bileziği
    [0.037, 2.41, 0],
    [0.052, 2.425, 0], [0.052, 2.475, 0], [0.036, 2.49, 0], // merdiven kolunun bileziği
    [0.033, 2.76, 0],
    [0.05, 2.775, 0], [0.05, 2.805, 0], [0.03, 2.83, 0], [0.03, 2.86, 0],
    [0.088, 2.935, 0], // fenerin oturduğu çanak
  ];

  // --- Fener: aşağı doğru daralan dört camlı kutu ---
  const Y0 = 2.955, Y1 = 3.33; // camın altı ve üstü
  const H0 = 0.12, H1 = 0.175; // alt ve üst yarı genişlik (üstte 35 cm)
  const corners = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  const iron = [
    paint(revolve(profile)),
    paint(box(0.27, 0.022, 0.27, 0, Y0 - 0.011, 0)), // alt tabla
    paint(box(0.375, 0.025, 0.375, 0, Y1 + 0.0125, 0)), // üst çerçeve
    paint(new THREE.CylinderGeometry(0.018, 0.024, 0.04, 8, 1, true).translate(0, 3.535, 0)), // topuz boynu
    paint(new THREE.SphereGeometry(0.03, 10, 6).translate(0, 3.57, 0)), // topuz
    // Merdiven dayama kolu: iki yana çıkan yatay çubuk ve uç topuzları
    paint(new THREE.CylinderGeometry(0.013, 0.013, 0.6, 8, 1, true).rotateZ(Math.PI / 2).translate(0, 2.45, 0)),
    paint(new THREE.SphereGeometry(0.022, 8, 5).translate(0.3, 2.45, 0)),
    paint(new THREE.SphereGeometry(0.022, 8, 5).translate(-0.3, 2.45, 0)),
  ];
  for (const [sx, sz] of corners) {
    iron.push(paint(bar(new THREE.Vector3(sx * H0, Y0, sz * H0), new THREE.Vector3(sx * H1, Y1, sz * H1), 0.022)));
  }
  // Piramit çatı (saçak alttan göründüğü için tabanı kapalı)
  const roof = new THREE.ConeGeometry(0.205 * Math.SQRT2, 0.175, 4, 1).rotateY(Math.PI / 4).translate(0, Y1 + 0.025 + 0.0875, 0);
  iron.push(paint(roof));

  // --- Camlar: dört yüz, yalnız dış yüzeyleri ---
  const inset = 0.006;
  const glassPositions = [];
  for (let i = 0; i < 4; i++) {
    const [ax, az] = corners[i];
    const [bx, bz] = corners[(i + 3) % 4]; // dışarıdan bakınca saat yönünün tersi sıra
    const p = (sx, sz, h, y) => [sx * (h - inset), y, sz * (h - inset)];
    const a0 = p(ax, az, H0, Y0), b0 = p(bx, bz, H0, Y0), a1 = p(ax, az, H1, Y1), b1 = p(bx, bz, H1, Y1);
    glassPositions.push(...b0, ...a0, ...a1, ...b0, ...a1, ...b1);
  }
  const glass = new THREE.BufferGeometry();
  glass.setAttribute('position', new THREE.Float32BufferAttribute(glassPositions, 3));
  glass.computeVertexNormals();

  const root = new THREE.Group();
  root.name = 'sokak_lambasi';

  const body = new THREE.Mesh(
    mergeGeometries(iron),
    new THREE.MeshStandardMaterial({ name: 'dokme_demir', vertexColors: true, roughness: 0.85, metalness: 0.35 }),
  );
  body.name = 'direk';
  const panes = new THREE.Mesh(
    glass,
    new THREE.MeshStandardMaterial({ name: 'fener_cami', color: 0x6b4a22, roughness: 0.45, emissive: 0xffb060, emissiveIntensity: 1.5 }),
  );
  panes.name = 'camlar';
  root.add(body, panes);
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
