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
  const cheek = 1.672 - 0.047 * Math.max(0, Math.min(1.1, t)) - y;
  // Çene hattının altı boyundur: sakal çene kemiğinde biter; çene altının yalnız ön kısmı kaplanır.
  // Yüzeyin aşağı bakan kısmına geçiş yumuşaktır (kenar tırtıklanmasın)
  const jaw = 1.575 + 0.045 * S(0.05, -0.005, z);
  const under = S(-0.1, -0.6, n[1]);
  const bottom = (y - (jaw - 0.006)) * (1 - under) + Math.min(z - 0.034, y - 1.563) * under;
  const back = z + 0.002; // kulağın ve çene köşesinin hemen önü
  const body = Math.min(cheek, bottom, back);
  // Favori: kulağın önünde şakağa çıkan dar şerit, yukarı doğru incelir
  const sideburn = x > 0.055 ? Math.min(z + 0.001, 0.019 - 0.009 * S(1.66, 1.705, y) - z, (1.708 - y) * 0.6) : -1;
  // Bıyık: üst dudağın üstünü kaplar, uçları ağız kenarlarından aşağı inip sakala bağlanır
  const droop = 0.022 * S(0.02, 0.036, x);
  const moustache = Math.min(0.04 - x, y - (1.6215 - droop), 1.6405 - 0.004 * S(0.0, 0.03, x) - y) - 0.004 * S(-0.3, -0.7, n[1]);
  // Yumuşak birleşim: parçalar arasında basamak kalmaz
  const k = 0.006;
  const smax = (a, b) => Math.max(a, b) + (Math.max(k - Math.abs(a - b), 0) ** 2 * 0.25) / k;
  let m = smax(smax(body, sideburn), moustache);
  // Dudaklar açık kalır
  const lips = (Math.hypot(x / 0.026, (y - 1.6095) / 0.0115) - 1) * 0.0115;
  return Math.min(m, lips);
}
// Kalınlık (metre): yanakta 5 mm, çenede 11 mm, bıyıkta 5 mm, favoride 4 mm
function thickness(p) {
  const x = Math.abs(p[0]), y = p[1];
  const chin = S(0.045, 0.012, x) * S(1.625, 1.598, y);
  const side = S(1.64, 1.67, y) * S(0.05, 0.065, x);
  return 0.005 + 0.006 * chin - 0.003 * side;
}

export function createSakal() {
  // --- Yüzeyi iki kez incelt (her üçgen dörde bölünür) ---
  let P = [], N = [], T = [];
  for (let i = 0; i < FACE.positions.length; i += 3) {
    P.push(FACE.positions.slice(i, i + 3));
    N.push(FACE.normals.slice(i, i + 3));
  }
  for (let i = 0; i < FACE.indices.length; i += 3) T.push(FACE.indices.slice(i, i + 3));
  // Yalnız sakalın yakınındaki üçgenler işlenir
  T = T.filter((tri) => tri.some((v) => mask(P[v], N[v]) > -0.02));
  for (let level = 0; level < 2; level++) {
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

  // --- Köşeleri dışarı it ---
  const used = new Map();
  const positions = [];
  const indices = [];
  for (const v of kept) {
    if (!used.has(v)) {
      const p = P[v], n = N[v];
      const edge = S(0, 0.008, M[v]); // kenarda tene doğru incelir
      // İnce kıl yönü izlenimi: aşağı akan, yüzü dolanan sık oluklar ve seyrek tutamlar
      const around = Math.atan2(p[0], p[2] + 0.02);
      const strands = 0.0007 * Math.sin(around * 95 + p[1] * 40) + 0.0005 * Math.sin(around * 41 - p[1] * 130) + 0.0004 * Math.sin(p[1] * 310 + around * 17);
      const h = 0.0005 + (thickness(p) + strands) * edge;
      // Çenede hafif sivri biçim: uç biraz aşağı ve öne uzar
      const tip = S(0.03, 0.0, Math.abs(p[0])) * S(1.6, 1.578, p[1]) * edge;
      used.set(v, positions.length / 3);
      positions.push(p[0] + n[0] * h, p[1] + n[1] * h - 0.004 * tip, p[2] + n[2] * h + 0.002 * tip);
    }
    indices.push(used.get(v));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ name: 'sakal', color: 0x17110c, roughness: 0.95, metalness: 0, side: THREE.DoubleSide }));
  mesh.name = 'sakal';
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
