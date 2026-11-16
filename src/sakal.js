import * as THREE from 'three';
import FACE from './manken_yuz.js';

// Kısa, düzgün kesilmiş sakal ve ona bitişik bıyık (1914, genç Osmanlı subayı); manken_erkek.glb'nin
// yüzüne oturur. Mankenin yüz yüzeyinden (manken_yuz.js) üretilir: yüzey inceltilir, sakal bölgesi
// maskeyle seçilir ve kenarı tam maske çizgisinden kesilir, sonra köşeler normal boyunca kalınlık
// kadar dışarı itilir. Kalınlık kenarda sıfıra iner. Konum ve ölçek mankenle aynı; yüz +Z'ye bakar.

const S = (a, b, v) => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

// Sakal maskesi: artı = sakalın içi (yaklaşık metre cinsinden kenara uzaklık), eksi = dışı.
function mask(p, n) {
  const x = Math.abs(p[0]), y = p[1], z = p[2];
  // Yanak çizgisi: kulağın önünden ağız kenarına yumuşak, düz iniş
  const t = 0.5 * ((0.074 - x) / 0.046) + 0.5 * ((z - 0.005) / 0.075);
  const cheek = 1.674 - 0.049 * Math.max(0, Math.min(1.1, t)) - y;
  // Alt kenar çene kemiğinin kenarını izler (mankenden ölçüldü: yanlara doğru yükselen eğri);
  // sakal çenenin altına yalnız önde, çene ucunun altında döner. Kenar yalnız konuma bağlıdır,
  // yüzeyin eğimine değil: çatallanmaz.
  const dx = Math.max(0, x - 0.03);
  const jawEdge = 1.578 + 1.1 * dx + 12 * dx * dx;
  const chinUnder = Math.min(y - 1.563, z - 0.034 + 3 * Math.max(0, y - 1.572));
  const side = S(0.02, 0.034, x);
  const bottom = chinUnder * (1 - side) + (y - jawEdge) * side;
  // Arka kenar: çene köşesinde kulak memesinin önü; yukarıda kulağın ön kıvrımından uzak durur
  const back = z - 0.011 * S(1.64, 1.665, y);
  const body = Math.min(cheek, bottom, back);
  // Favori: kulağın önündeki yanak yüzeyinde şakağa çıkan dar şerit, yukarı doğru incelir
  const sideburn = x > 0.055 ? Math.min(z - 0.011, 0.034 - 0.01 * S(1.66, 1.705, y) - z, (1.708 - y) * 0.6) : -1;
  // Bıyık: üst dudağın üstünü kaplar, uçları ağız kenarlarından aşağı inip sakala bağlanır
  const droop = 0.034 * S(0.022, 0.037, x);
  const moustache = Math.min(0.041 - x, y - (1.6345 - droop), 1.651 - 0.005 * S(0.0, 0.03, x) - y) - 0.003 * S(-0.4, -0.8, n[1]);
  // Yumuşak birleşim: parçalar arasında basamak kalmaz
  const k = 0.006;
  const smax = (a, b) => Math.max(a, b) + (Math.max(k - Math.abs(a - b), 0) ** 2 * 0.25) / k;
  let m = smax(smax(body, sideburn), moustache);
  // Dudaklar açık kalır
  // Dudaklar (mankenden ölçüldü): alt dudağın altındaki çukur y 1,605, burun dibi y 1,645
  const lips = (Math.hypot(x / 0.027, (y - 1.6225) / 0.0135) - 1) * 0.0135;
  return Math.min(m, lips);
}
// Kalınlık (metre): yanakta 5 mm, çenede 11 mm, bıyıkta 5 mm, favoride 4 mm
function thickness(p) {
  const x = Math.abs(p[0]), y = p[1];
  const chin = S(0.045, 0.012, x) * S(1.625, 1.598, y);
  const side = S(1.64, 1.67, y) * S(0.05, 0.065, x);
  return 0.005 + 0.006 * chin - 0.003 * side;
}

// Kıl dokusu: saydam zemin üstünde aşağı doğru akan kısa, ince teller. Zeminin yarı saydam koyu
// tabanı iç katmanda teni örter; dış katmanlarda yalnız teller görünür.
function hairTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  let seed = 1914;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  g.fillStyle = 'rgba(17,12,9,0.56)';
  g.fillRect(0, 0, size, size);
  g.lineCap = 'round';
  for (let i = 0; i < 1500; i++) {
    const x = rand() * size, y = rand() * size, len = 14 + rand() * 30, lean = (rand() - 0.5) * 9;
    const tone = 0.8 + rand() * 1.5;
    g.strokeStyle = `rgb(${Math.round(23 * tone)},${Math.round(17 * tone)},${Math.round(12 * tone)})`;
    g.lineWidth = 1.4 + rand() * 1.6;
    for (const [ox, oy] of [[0, 0], [size, 0], [-size, 0], [0, size], [0, -size]]) { // kenarlarda sarar
      g.beginPath();
      g.moveTo(x + ox, y + oy);
      g.quadraticCurveTo(x + ox + lean * 0.2, y + oy + len * 0.5, x + ox + lean, y + oy + len);
      g.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.name = 'sakal_kil';
  return texture;
}

export function createSakal() {
  // --- Yüzeyi bir kez incelt (her üçgen dörde bölünür) ---
  let P = [], N = [], T = [];
  for (let i = 0; i < FACE.positions.length; i += 3) {
    P.push(FACE.positions.slice(i, i + 3));
    N.push(FACE.normals.slice(i, i + 3));
  }
  for (let i = 0; i < FACE.indices.length; i += 3) T.push(FACE.indices.slice(i, i + 3));
  T = T.filter((tri) => tri.some((v) => mask(P[v], N[v]) > -0.02)); // yalnız sakalın yakını
  for (let level = 0; level < 1; level++) {
    const mids = new Map();
    const mid = (a, b) => {
      const key = a < b ? a * 1e6 + b : b * 1e6 + a;
      if (!mids.has(key)) {
        mids.set(key, P.length);
        P.push(lerp3(P[a], P[b], 0.5));
        const n = lerp3(N[a], N[b], 0.5), l = Math.hypot(...n) || 1;
        N.push(n.map((v) => v / l));
      }
      return mids.get(key);
    };
    T = T.flatMap(([a, b, c]) => {
      const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
      return [[a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]];
    });
  }

  // --- Maske çizgisinden kes: kenar üçgen kenarlarını değil, maskenin sıfır çizgisini izler ---
  const M = P.map((p, i) => mask(p, N[i]));
  const cuts = new Map();
  const cut = (a, b) => {
    const key = a < b ? a * 1e6 + b : b * 1e6 + a;
    if (!cuts.has(key)) {
      const t = M[a] / (M[a] - M[b]);
      cuts.set(key, P.length);
      P.push(lerp3(P[a], P[b], t));
      const n = lerp3(N[a], N[b], t), l = Math.hypot(...n) || 1;
      N.push(n.map((v) => v / l));
      M.push(0);
    }
    return cuts.get(key);
  };
  const kept = [];
  for (const tri of T) {
    const poly = [];
    for (let k = 0; k < 3; k++) {
      const a = tri[k], b = tri[(k + 1) % 3];
      if (M[a] >= 0) poly.push(a);
      if (M[a] >= 0 !== M[b] >= 0) poly.push(cut(a, b));
    }
    for (let k = 1; k + 1 < poly.length; k++) kept.push(poly[0], poly[k], poly[k + 1]);
  }

  // --- Üç katman: içteki teni örter, dıştakiler seyrelen tellerle hacim verir ---
  const LAYERS = [[0.3, 1], [0.65, 0.86], [1, 0.72]]; // [kalınlık oranı, kıl yoğunluğu]
  const positions = [], uvs = [], colors = [], indices = [];
  for (const [depth, density] of LAYERS) {
    const used = new Map();
    for (const v of kept) {
      if (!used.has(v)) {
        const p = P[v], n = N[v];
        const edge = S(0, 0.009, M[v]); // kenarda kalınlık da kıl yoğunluğu da sıfıra iner
        const h = 0.0006 + thickness(p) * edge * depth;
        // Çenede hafif sivri biçim: uç biraz aşağı ve öne uzar
        const tip = S(0.03, 0.0, Math.abs(p[0])) * S(1.6, 1.578, p[1]) * edge * depth;
        used.set(v, positions.length / 3);
        positions.push(p[0] + n[0] * h, p[1] + n[1] * h - 0.004 * tip, p[2] + n[2] * h + 0.002 * tip);
        // Doku yüzü dolanır; teller aşağı akar (her katman biraz kaydırılır: üst üste binmesin)
        uvs.push((Math.atan2(p[0], p[2] + 0.02) * 0.085) / 0.032 + depth * 0.37, p[1] / 0.032 + depth * 0.61);
        colors.push(1, 1, 1, S(0, 0.0045, M[v]) * density); // kenarın son birkaç milimetresinde teller seyrelir
      }
      indices.push(used.get(v));
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ name: 'sakal', map: hairTexture(), vertexColors: true, alphaTest: 0.5, roughness: 0.95, metalness: 0, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'sakal';
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
