import * as THREE from 'three';
import FACE from './manken_yuz.js';
import M from './manken_olcu.js';
import { headRadius } from './outfit.js';

const HEAD = M.head;

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
let coverMouth = false; // gür bıyık ağzı örter
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
  // Üst kenar burun kanatlarına tırmanmaz: ortadan uçlara doğru alçalır
  const moustache = Math.min(0.041 - x, y - (1.631 - droop), 1.6495 - 0.013 * S(0.01, 0.034, x) - y) - 0.003 * S(-0.4, -0.8, n[1]);
  // Yumuşak birleşim: parçalar arasında basamak kalmaz
  const k = 0.006;
  const smax = (a, b) => Math.max(a, b) + (Math.max(k - Math.abs(a - b), 0) ** 2 * 0.25) / k;
  let m = smax(smax(body, sideburn), moustache);
  // Dudaklar açık kalır
  // Dudaklar (mankenden ölçüldü): alt dudağın altındaki çukur y 1,605, burun dibi y 1,645
  const lips = (Math.hypot(x / 0.027, (y - 1.6195) / 0.0125) - 1) * 0.0125;
  return coverMouth ? m : Math.min(m, lips);
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
function hairTexture(o) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  let seed = 1914;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  g.fillStyle = `rgba(${o.shadow.join(',')},0.56)`; // teller arasındaki gölge
  g.fillRect(0, 0, size, size);
  g.lineCap = 'round';
  // Teller ayrı ayrı seçilsin: ince, aralıklı, tonları koyudan açık kahveye değişir
  for (let i = 0; i < 2400; i++) {
    const x = rand() * size, y = rand() * size, len = 30 + rand() * 70, lean = (rand() - 0.5) * 22;
    const tone = rand() < 0.18 ? o.light[0] + rand() * o.light[1] : o.dark[0] + rand() * o.dark[1];
    g.strokeStyle = `rgb(${o.hair.map((c) => Math.min(255, Math.round(c * tone))).join(',')})`;
    g.lineWidth = 1.3 + rand() * 1.4;
    for (const [ox, oy] of [[0, 0], [size, 0], [-size, 0], [0, size], [0, -size]]) { // kenarlarda sarar
      g.beginPath();
      g.moveTo(x + ox, y + oy);
      g.quadraticCurveTo(x + ox + lean * 0.15, y + oy + len * 0.5, x + ox + lean, y + oy + len);
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

// Kısa, koyu kahve genç subay sakalı
const GENC = {
  hair: [23, 17, 12], shadow: [12, 8, 6], dark: [0.7, 1.1], light: [2.2, 1.3],
  thick: 1, tuft: 1, chinDrop: 0.004, chinForward: 0.002, tipX: 0.03, tipY: 1.6, deep: false, wave: 0,
};
// Yaşlı adam sakalı: kırlaşmış, grimsi beyaz; daha gür, çenede aşağı doğru uzun ve sivri
const YASLI = {
  hair: [150, 148, 142], shadow: [62, 60, 57], dark: [0.62, 0.5], light: [1.2, 0.28],
  thick: 1.8, tuft: 1.5, chinDrop: 0.04, chinForward: 0.008, tipX: 0.085, tipY: 1.625, deep: true, wave: 0.006,
};
export const createYasliSakal = () => createSakal(YASLI);
// Aynı kır sakalın kısa kesilmişi: çenenin hemen altında biter, öne ve aşağı uzamaz
const YASLI_KISA = { ...YASLI, thick: 1.5, tuft: 1.0, chinDrop: 0.01, chinForward: 0.002, wave: 0.004 };
export const createYasliKisaSakal = () => createSakal(YASLI_KISA);

// Dervişvari uzun, gür, dağınık kır sakal: göğse kadar iner, bıyık ağzı örter
const UZUN = {
  hair: [138, 136, 131], shadow: [66, 65, 62], dark: [0.55, 0.55], light: [1.35, 0.4],
  thick: 4.2, tuft: 3.4, chinDrop: 0.15, chinForward: 0.035, tipX: 0.16, tipY: 1.66, deep: true, wave: 0.014, coverMouth: true,
};
export const createUzunSakal = () => createSakal(UZUN);

// Aynı tarzda uzun, dağınık kır saç: tepeden ayrılır, kulakları örtüp omuzlara dökülür; alın açıktır.
// Başın ölçü tablosundan (manken_olcu.js) üretilir; mankenle aynı konum.
export function createUzunSac(o = UZUN) {
  const TAU = Math.PI * 2;
  const cx = HEAD.cx, cz = HEAD.cz, TOP = 1.812;
  const positions = [], uvs = [], colors = [], indices = [];
  let seed = 23;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  // Saç yüzeyi: a açısı (ön = PI/2), v tepeden (0) uca (1). lift: baştan yükseklik
  const end = (a) => 1.5 - 0.05 * S(0.2, -0.9, Math.sin(a)); // arkada daha uzun
  const point = (a, v, lift) => {
    const wave = 0.012 * Math.sin(a * 9 + v * 11) * v + 0.006 * Math.sin(a * 23 + v * 31) * v;
    if (v < 0.45) {
      // Tepe yuvarlak bir kubbedir: önce kubbe (tepeden başın en geniş yerine), sonra başın yanı
      const t = (v / 0.45) * 2.2, EQ = 1.755;
      if (t < 1) {
        const th = (t * Math.PI) / 2, r = (headRadius(EQ, a) + lift + wave) * Math.sin(th);
        return [cx + Math.cos(a) * r, EQ + (TOP + lift - EQ) * Math.cos(th), cz + Math.sin(a) * r];
      }
      const y = EQ - (EQ - 1.68) * ((t - 1) / 1.2), r = headRadius(y, a) + lift + wave;
      return [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r];
    }
    const t = (v - 0.45) / 0.55, y = 1.68 - (1.68 - end(a)) * t;
    const r = headRadius(1.68, a) + lift + 0.045 * Math.sin(t * Math.PI * 0.6) + 0.035 * t + wave;
    return [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r];
  };
  // Yüz açıklığı: önde saç alnın üstünde biter, yanlara doğru şakaktan aşağı iner
  const hairline = (a) => {
    const f = Math.sin(a);
    return f > 0.3 ? 1.69 + 0.095 * S(0.3, 0.72, f) : -1;
  };
  const SEG = 56, ROWS = 16;
  for (const [lift, density] of [[0.008, 1], [0.018, 0.86], [0.028, 0.78], [0.04, 0.7]]) {
    const base = positions.length / 3;
    for (let j = 0; j <= ROWS; j++) {
      for (let k = 0; k <= SEG; k++) {
        const a = (k / SEG) * TAU + Math.PI / 2, v = j / ROWS;
        const p = point(a, v, lift);
        positions.push(...p);
        uvs.push((k / SEG) * 18 + lift * 37, v * 7 + lift * 61);
        const open = S(0, 0.025, p[1] - hairline(a)); // alında ve yüzün önünde saç yok
        colors.push(1, 1, 1, open * density * (1 - 0.45 * S(0.8, 1, v))); // uçlarda seyrelir
      }
    }
    for (let j = 0; j < ROWS; j++) for (let k = 0; k < SEG; k++) {
      const q = base + j * (SEG + 1) + k;
      indices.push(q, q + SEG + 1, q + 1, q + 1, q + SEG + 1, q + SEG + 2);
    }
  }
  // Dağınık tutamlar: yüzeyden dışa ve aşağı fırlayan ince, sivri teller
  for (let i = 0; i < 1500; i++) {
    const a = rand() * TAU, v = 0.12 + rand() * 0.88;
    const p = point(a, v, 0.03), q = point(a, Math.min(1, v + 0.02), 0.03);
    if (p[1] - hairline(a) < 0.03) continue;
    const out = [Math.cos(a), 0, Math.sin(a)];
    const len = 0.03 + rand() * 0.05 * (0.5 + v), half = 0.0016 + rand() * 0.0012;
    const dir = [out[0] * (0.5 + rand() * 0.5) + (rand() - 0.5) * 0.5, -0.5 - rand() * 0.6 + (v < 0.3 ? 0.5 : 0), out[2] * (0.5 + rand() * 0.5) + (rand() - 0.5) * 0.5];
    const dl = Math.hypot(...dir), side = [-out[2], 0, out[0]];
    const base = positions.length / 3, u0 = rand(), v0 = rand();
    const push = (along, e, w) => {
      positions.push(...p.map((c, n) => c + (dir[n] / dl) * len * along + side[n] * half * e * w));
      uvs.push(u0 + e * w * 0.05, v0 - along * len * 20);
      colors.push(1, 1, 1, 1);
    };
    push(0, -1, 1); push(0, 1, 1); push(0.55, -1, 0.6); push(0.55, 1, 0.6); push(1, 0, 0);
    indices.push(base, base + 1, base + 3, base, base + 3, base + 2, base + 2, base + 3, base + 4);
    void q;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ name: 'sac', map: hairTexture(o), vertexColors: true, alphaTest: 0.5, roughness: 0.95, metalness: 0, side: THREE.DoubleSide }));
  mesh.name = 'sac';
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
// Uzun saç ve uzun sakal birlikte, tek kök altında
export function createUzunSacSakal() {
  const root = new THREE.Group();
  root.name = 'uzun_sac_sakal';
  root.add(createUzunSac(), createUzunSakal());
  return root;
}

export function createSakal(o = GENC) {
  coverMouth = !!o.coverMouth;
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

  // --- Beş katman: içteki teni örter, dıştakiler seyrelen tellerle hacim verir ---
  const LAYERS = [[0.15, 1], [0.38, 0.88], [0.6, 0.8], [0.8, 0.74], [1, 0.68]]; // [kalınlık oranı, kıl yoğunluğu]
  const positions = [], uvs = [], colors = [], indices = [];
  for (const [depth, density] of LAYERS) {
    const used = new Map();
    for (const v of kept) {
      if (!used.has(v)) {
        const p = P[v], n = N[v];
        const edge = S(0, 0.009, M[v]); // kenarda kalınlık da kıl yoğunluğu da sıfıra iner
        const h = 0.0006 + thickness(p) * o.thick * edge * depth;
        // Çenede hafif sivri biçim: uç biraz aşağı ve öne uzar
        const tip = S(o.tipX, 0.0, Math.abs(p[0])) * S(o.tipY, 1.578, p[1]) * edge * depth;
        used.set(v, positions.length / 3);
        // Dalgalı tutamlar: aşağı akan geniş, yumuşak oluklar
        const wave = o.wave * Math.sin(Math.atan2(p[0], p[2] + 0.02) * 26 + p[1] * 60) * edge * depth;
        positions.push(p[0] + n[0] * (h + wave), p[1] + n[1] * (h + wave) - o.chinDrop * tip, p[2] + n[2] * (h + wave) + o.chinForward * tip);
        // Doku yüzü dolanır; teller aşağı akar (her katman biraz kaydırılır: üst üste binmesin)
        uvs.push((Math.atan2(p[0], p[2] + 0.02) * 0.085) / 0.032 + depth * 0.37, p[1] / 0.032 + depth * 0.61);
        colors.push(1, 1, 1, S(0, 0.0045, M[v]) * density); // kenarın son birkaç milimetresinde teller seyrelir
      }
      indices.push(used.get(v));
    }
  }
  // --- Kıl tutamları: yüzeyden aşağı ve dışa doğru çıkan ince kartlar; sakala kabarıklık ve
  // tüylü bir dış çizgi verir. Her kartın ucunda teller seyrelir.
  let seed = 7;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const norm = (v) => {
    const l = Math.hypot(...v) || 1;
    return v.map((c) => c / l);
  };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  for (let t = 0; t < kept.length; t += 3) {
    const [a, b, c] = [kept[t], kept[t + 1], kept[t + 2]];
    const area = 0.5 * Math.hypot(...cross(P[b].map((v, i) => v - P[a][i]), P[c].map((v, i) => v - P[a][i])));
    let count = area / 0.000009; // yaklaşık her 9 mm² için bir tutam
    while (count > rand()) {
      count -= 1;
      let u = rand(), w = rand();
      if (u + w > 1) { u = 1 - u; w = 1 - w; }
      const mix = (A) => A[a].map((v, i) => v + (A[b][i] - v) * u + (A[c][i] - v) * w);
      const m = M[a] + (M[b] - M[a]) * u + (M[c] - M[a]) * w;
      if (m < 0.0025) continue; // kenarın dibinde tutam yok
      const p = mix(P), n = norm(mix(N));
      const full = S(0.002, 0.009, m);
      const thick = thickness(p) * o.thick;
      // Kıl aşağı ve dışa doğru büyür; her tutam biraz farklı yöne yatar
      const grow = norm([n[0] * 0.55 + (rand() - 0.5) * 0.35, n[1] * 0.55 - 0.75, n[2] * 0.55 + (rand() - 0.5) * 0.2]);
      const sideways = norm(cross(n, grow));
      const length = (0.0035 + thick * 0.55) * o.tuft * (0.6 + 0.6 * rand()) * (0.5 + 0.5 * full);
      const half = 0.0011 + 0.0009 * rand();
      // Gür sakalda tutamlar hacmin her derinliğinden çıkar ve çenedeki uzamayı izler
      const at = o.deep ? 0.25 + 0.75 * rand() : 0.35;
      const drop = S(o.tipX, 0.0, Math.abs(p[0])) * S(o.tipY, 1.578, p[1]) * full * at;
      const root = p.map((v, i) => v + n[i] * (0.0006 + thick * full * at));
      root[1] -= o.chinDrop * drop * (o.deep ? 1 : 0);
      root[2] += o.chinForward * drop * (o.deep ? 1 : 0);
      const u0 = rand(), v0 = rand();
      const base = positions.length / 3;
      // Sivri uçlu ince tutam: dipte geniş, ortada daralır, uçta tek noktada biter
      const point = (along, e, width) => {
        const lift = along * along * 0.35; // uca doğru yüzeye yaklaşır: tutam kıvrılır
        positions.push(...root.map((v, i) => v + grow[i] * length * along + sideways[i] * half * e * width - n[i] * length * lift * 0.4));
        uvs.push(u0 + (e * half * width) / 0.032, v0 - (length * along) / 0.032);
        colors.push(1, 1, 1, 1); // tutamın biçimi geometriden gelir: dokunun saydamlığına bağlı değil
      };
      point(0, -1, 1); point(0, 1, 1); point(0.55, -1, 0.6); point(0.55, 1, 0.6); point(1, 0, 0);
      indices.push(base, base + 1, base + 3, base, base + 3, base + 2, base + 2, base + 3, base + 4);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ name: 'sakal', map: hairTexture(o), vertexColors: true, alphaTest: 0.5, roughness: 0.95, metalness: 0, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'sakal';
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
