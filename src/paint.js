import * as THREE from 'three';

// Eskime dokularını tuvale boyamak için ortak araçlar. Tohumlu rastgele sayı kullanıldığı için
// her çalıştırmada aynı doku çıkar.

export function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const RUB = '152,106,64'; // cilası gitmiş, açılmış ahşap
export const GRIME = '9,6,4';

export function createPainter(size, seed) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const rand = seeded(seed);
  const range = (a, b) => a + rand() * (b - a);

  // Verilen bölgeye kırparak ve bölgenin sol üstünü (0, 0) alarak çizer.
  const region = ([x, y, w, h], draw) => {
    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    g.translate(x, y);
    draw(w, h);
    g.restore();
  };

  // Yumuşak kenarlı leke: açık renk sürtünme aşınması, koyu renk kir için.
  const blot = (cx, cy, rx, ry, rgb, alpha) => {
    g.save();
    g.translate(cx, cy);
    g.scale(1, ry / rx);
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    grad.addColorStop(0, `rgba(${rgb},${alpha})`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grad;
    g.fillRect(-rx, -rx, rx * 2, rx * 2);
    g.restore();
  };

  // Birçok küçük lekeden oluşan düzensiz aşınma alanı.
  const patch = (cx, cy, spreadX, spreadY, rgb, count, alpha = 0.45, blob = 14) => {
    for (let i = 0; i < count; i++) {
      blot(cx + range(-spreadX, spreadX), cy + range(-spreadY, spreadY), range(blob * 0.5, blob * 1.6), range(blob * 0.4, blob), rgb, range(alpha * 0.4, alpha));
    }
  };

  // Yatay damarlı koyu ahşap.
  const wood = (w, h, base) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < h * 1.4; i++) {
      const c = range(0, h);
      const amp = range(0.4, 2.5);
      const wave = range(120, 420);
      const phase = range(0, 6.3);
      g.strokeStyle = rand() < 0.68 ? `rgba(12,6,3,${range(0.05, 0.3)})` : `rgba(120,78,44,${range(0.04, 0.16)})`;
      g.lineWidth = range(0.5, 2.2);
      g.beginPath();
      for (let t = 0; t <= w; t += 16) g.lineTo(t, c + amp * Math.sin((t / wave) * 6.3 + phase));
      g.stroke();
    }
  };

  const scratches = (w, h, count, maxLen = 60) => {
    for (let i = 0; i < count; i++) {
      const x = range(0, w);
      const y = range(0, h);
      const len = range(6, maxLen);
      const a = range(0, Math.PI);
      g.strokeStyle = rand() < 0.75 ? `rgba(200,165,120,${range(0.12, 0.4)})` : `rgba(8,4,2,${range(0.3, 0.6)})`;
      g.lineWidth = range(0.5, 1.4);
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      g.stroke();
    }
  };

  const texture = (name) => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.name = name;
    return t;
  };

  return { canvas, g, rand, range, region, blot, patch, wood, scratches, texture };
}

// Bölge içindeki (s, t) konumunu uv'ye çevirir; kenarlardan 2 piksel içeride kalır.
export function regionUV(size, [x, y, w, h], s, t) {
  return [(x + 2 + s * (w - 4)) / size, 1 - (y + 2 + t * (h - 4)) / size];
}

// Bir ağın uv'lerini bölgeye taşır. remap(u, v) => [s, t] bölge içi konumu verir.
export function mapUVs(geometry, size, rect, remap = (u, v) => [u, v]) {
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    const [s, t] = remap(uv.getX(i), uv.getY(i));
    uv.setXY(i, ...regionUV(size, rect, s, t));
  }
  return geometry;
}

// Kutu yüzleri: [ad, normal ekseni, yön, yüzün iki kenar ekseni]
const BOX_FACES = [
  ['px', 0, 1, 2, 1], ['nx', 0, -1, 2, 1],
  ['py', 1, 1, 0, 2], ['ny', 1, -1, 0, 2],
  ['pz', 2, 1, 0, 1], ['nz', 2, -1, 0, 1],
];

// Yalnız istenen yüzleri olan kutu (konum, normal, uv, köşe rengi).
//   skip: modellenmeyecek yüzler ("ny nz" gibi)
//   uv:   ({ name, la, lb }) => (s, t) => [u, v]. la, lb yüzün kenar uzunlukları (metre);
//         s yüzün yatay ekseninde, t yukarıdan aşağı (üst yüzlerde arkadan öne) 0..1 ilerler
//   tone: (x, y, z, yüzAdı) => köşe renginin parlaklığı
export function boxGeometry(w, h, d, x, y, z, { skip = '', uv, tone = () => 1 } = {}) {
  const size = [w, h, d];
  const center = [x, y, z];
  const positions = [];
  const normals = [];
  const uvs = [];
  const colors = [];
  for (const [name, n, dir, a, b] of BOX_FACES) {
    if (skip.includes(name)) continue;
    const mapper = uv({ name, la: size[a], lb: size[b] });
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sa, sb]) => {
      const p = [0, 0, 0];
      p[n] = center[n] + (dir * size[n]) / 2;
      p[a] = center[a] + (sa * size[a]) / 2;
      p[b] = center[b] + (sb * size[b]) / 2;
      const t = n === 1 ? (sb + 1) / 2 : 1 - (sb + 1) / 2;
      const shade = tone(p[0], p[1], p[2], name);
      return { p, uv: mapper((sa + 1) / 2, t), shade };
    });
    // Dışarıdan bakınca saat yönünün tersine sıralı iki üçgen
    const order = dir * (n === 2 ? -1 : 1) < 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
    for (const i of order) {
      const c = corners[i];
      positions.push(...c.p);
      normals.push(n === 0 ? dir : 0, n === 1 ? dir : 0, n === 2 ? dir : 0);
      uvs.push(...c.uv);
      colors.push(c.shade, c.shade, c.shade);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return g;
}
