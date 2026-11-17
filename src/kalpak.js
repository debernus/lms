import * as THREE from 'three';
import { canvasTexture } from './halk2.js';

// Osmanlı zabit kalpağı (19. yy sonu): siyah astragan, yukarı doğru hafif daralan, kenarları yuvarlak
// alçak silindir. Dünya koordinatlarında durur (taşınmaz, ölçeklenmez): alt kenar y = 1,785, tepe
// y = 1,920, merkez x = 0, z = 0,023. Parçalar: kalpak_govde, kalpak_tepe, kalpak_terlik, kalpak_astar.
// Her parça tek taraflıdır; iç yüzey ayrı bir ağdır. Renkler malzemeden ve gömülü dokudan gelir.

const TAU = Math.PI * 2;
const C = { x: 0, z: 0.023, bottom: 1.785, top: 1.92 };
const OUT_B = [0.118, 0.122], OUT_T = [0.108, 0.112]; // dış yarıçaplar (x, z): alt kenar, tepe
const INNER = [0.094, 0.108]; // baş boşluğu (alt kenarda)
const SEAM = [INNER[0] + 0.01, INNER[1] + 0.01]; // alt yüzde postun bittiği, 1 cm'lik deri şeridin başladığı çizgi
const A = 0.004; // tüy kabartısının yüksekliği: tepeleri verilen dış ölçüye değer

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Halkalardan ağ: rows[j] = [{ x, y, z, u, v }]; quad köşegeni split(i, j) ile seçilir.
function mesh(name, material, rows, { closedTop = null, split = () => false, facing }) {
  const pos = [], uv = [], idx = [];
  const n = rows[0].length;
  rows.forEach((row) => row.forEach((p) => {
    pos.push(p.x, p.y, p.z);
    uv.push(p.u ?? 0, p.v ?? 0);
  }));
  const at = (i, j) => j * n + (i % n);
  for (let j = 0; j + 1 < rows.length; j++) for (let i = 0; i < n; i++) {
    const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
    if (split(i, j)) idx.push(a, b, d, b, c, d);
    else idx.push(a, b, c, a, c, d);
  }
  if (closedTop) {
    const centre = pos.length / 3;
    pos.push(closedTop.x, closedTop.y, closedTop.z);
    uv.push(closedTop.u ?? 0, closedTop.v ?? 0);
    for (let i = 0; i < n; i++) idx.push(at(i, rows.length - 1), at(i + 1, rows.length - 1), centre);
  }
  // Sarım yönü: yüzler facing(x, y, z) yönüne bakmalı
  let vote = 0;
  for (let t = 0; t < idx.length; t += 3) {
    const [a, b, c] = [0, 1, 2].map((k) => new THREE.Vector3().fromArray(pos, idx[t + k] * 3));
    const normal = b.clone().sub(a).cross(c.clone().sub(a));
    const mid = a.add(b).add(c).multiplyScalar(1 / 3);
    vote += normal.dot(new THREE.Vector3(...facing(mid.x, mid.y, mid.z)));
  }
  if (vote < 0) for (let t = 0; t < idx.length; t += 3) [idx[t + 1], idx[t + 2]] = [idx[t + 2], idx[t + 1]];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, material);
  m.name = name;
  m.castShadow = m.receiveShadow = true;
  return m;
}
const ellipse = (rx, rz, y, n, extra = () => ({})) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * TAU;
  return { x: C.x + Math.cos(a) * rx, y, z: C.z + Math.sin(a) * rz, ...extra(a, i) };
});

export function createKalpak() {
  const root = new THREE.Group();
  root.name = 'kalpak';

  // ---------- kalpak_govde: kuzu postu ----------
  // Kesit (alt yüzdeki dikişten dışa, yandan yukarı, tepe kenarından içe): [rx, rz, y] taban yüzeyi.
  // Taban yüzeyi verilen dış ölçünün A kadar içindedir; kıvırcıklar onu dış ölçüye kadar kabartır.
  const profile = [];
  const lerp = (a, b, t) => a + (b - a) * t;
  profile.push([SEAM[0], SEAM[1], C.bottom, 0], [lerp(SEAM[0], OUT_B[0], 0.6), lerp(SEAM[1], OUT_B[1], 0.6), C.bottom, 0]);
  profile.push([OUT_B[0] - 0.0045, OUT_B[1] - 0.0045, C.bottom, 0], [OUT_B[0] - A - 0.0005, OUT_B[1] - A - 0.0005, C.bottom + 0.003, 0.5]);
  const CORNER = 0.02, sideTop = C.top - A - CORNER, sideBottom = C.bottom + 0.008, SIDE = 21;
  const sideR = (y) => {
    const t = (y - C.bottom) / (C.top - C.bottom), belly = 0.003 * Math.sin(Math.PI * Math.min(1, t * 1.05)); // hafif bombe
    return [lerp(OUT_B[0], OUT_T[0], t) - A + belly, lerp(OUT_B[1], OUT_T[1], t) - A + belly];
  };
  for (let k = 0; k <= SIDE; k++) {
    const y = lerp(sideBottom, sideTop, k / SIDE);
    profile.push([...sideR(y), y, 1]);
  }
  const [cx, cz] = sideR(sideTop);
  for (const deg of [18, 36, 54, 72, 90]) {
    const f = (deg * Math.PI) / 180, inset = CORNER * (1 - Math.cos(f));
    profile.push([cx - inset, cz - inset, sideTop + CORNER * Math.sin(f), 1]);
  }
  const TOP_Y = C.top - A, DISC = [cx - CORNER - 0.012, cz - CORNER - 0.012]; // bordo dairenin kenarı
  profile.push([cx - CORNER - 0.006, cz - CORNER - 0.006, TOP_Y - 0.0005, 0.9], [DISC[0] + 0.001, DISC[1] + 0.001, TOP_Y - 0.003, 0.35], [DISC[0] - 0.003, DISC[1] - 0.003, TOP_Y - 0.0065, 0]);

  const SEG = 144, rand = rng(1890);
  // Kıvırcıklar: rastgele alan hafifçe yumuşatılıp keskinleştirilir; 1–2 gözlük (6–10 mm) düzensiz öbekler
  const noise = profile.map(() => Array.from({ length: SEG }, () => rand()));
  const curl = profile.map((_, j) => Array.from({ length: SEG }, (_, i) => {
    let sum = 0, weight = 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const jj = j + dj;
      if (jj < 0 || jj >= profile.length) continue;
      const w = di === 0 && dj === 0 ? 1 : di === 0 || dj === 0 ? 0.42 : 0.16;
      sum += w * noise[jj][(i + di + SEG) % SEG];
      weight += w;
    }
    const t = Math.min(1, Math.max(0, (sum / weight - 0.36) / 0.28));
    return t * t * (3 - 2 * t);
  }));
  const fur = profile.map(([rx, rz, y, amount], j) => {
    const before = profile[Math.max(j - 1, 0)], after = profile[Math.min(j + 1, profile.length - 1)];
    // Kesit düzlemindeki dış normal (yarıçap, y) ve kesit boyunca yön
    let nr = after[2] - before[2], ny = -((after[0] + after[1]) / 2 - (before[0] + before[1]) / 2);
    const len = Math.hypot(nr, ny) || 1;
    nr /= len;
    ny /= len;
    return Array.from({ length: SEG }, (_, i) => {
      const a = ((i + (rand() - 0.5) * 0.7 * amount) / SEG) * TAU;
      const slide = (rand() - 0.5) * 0.0028 * (amount === 1 ? 1 : 0); // kesit boyunca küçük kayma
      const h = amount * curl[j][i];
      const ex = Math.cos(a) * rz, ez = Math.sin(a) * rx, el = Math.hypot(ex, ez); // elipsin dış normali
      const d = A * h, r = nr * d - ny * slide, up = ny * d + nr * slide;
      return {
        x: C.x + Math.cos(a) * rx + (ex / el) * r,
        y: Math.min(C.top, y + up),
        z: C.z + Math.sin(a) * rz + (ez / el) * r,
        u: rand(), v: 0.04 + 0.92 * h, h,
      };
    });
  });
  // Tüy dokusu: çukurlar siyah, kıvırcıkların sırtı çok hafif koyu gri (v = kabartı yüksekliği)
  const furMap = canvasTexture('astragan', 8, 64, (g) => {
    const grad = g.createLinearGradient(0, 64, 0, 0);
    grad.addColorStop(0, '#050506');
    grad.addColorStop(0.55, '#0e0e10');
    grad.addColorStop(1, '#2b2b2e');
    g.fillStyle = grad;
    g.fillRect(0, 0, 8, 64);
  });
  root.add(mesh('kalpak_govde', new THREE.MeshStandardMaterial({ name: 'astragan', map: furMap, roughness: 0.92, metalness: 0 }), fur, {
    split: (i, j) => fur[j][i].h + fur[j + 1][(i + 1) % SEG].h < fur[j][(i + 1) % SEG].h + fur[j + 1][i].h, // köşegen yüksek iki köşeyi birleştirir: kıvrım sırtı
    facing: (x, y, z) => [x - C.x, (y - 1.85) * 1.5, z - C.z],
  }));

  // ---------- kalpak_tepe: bordo çuha daire (ortası çukur) ve kenarında siyah dikiş ----------
  const disc = [[1, TOP_Y - 0.0058], [0.93, TOP_Y - 0.0062], [0.86, TOP_Y - 0.0064], [0.55, TOP_Y - 0.0069]].map(([f, y]) => ellipse(DISC[0] * f, DISC[1] * f, y, 48));
  const tepe = mesh('kalpak_tepe', new THREE.MeshStandardMaterial({ name: 'bordo_cuha', color: 0x4a1218, roughness: 0.92, metalness: 0 }), disc, {
    closedTop: { x: C.x, y: C.top - 0.01, z: C.z }, facing: () => [0, 1, 0],
  });
  // Dikiş: ince siyah halka; daireyle aynı parçada ikinci malzeme
  const stitch = mesh('dikis', null, [0.905, 0.885].map((f) => ellipse(DISC[0] * f, DISC[1] * f, TOP_Y - 0.0062 - (0.93 - f) * 0.003 + 0.0006, 48)), { facing: () => [0, 1, 0] });
  const tg = tepe.geometry, sg = stitch.geometry, base = tg.attributes.position.count;
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute([...tg.attributes.position.array, ...sg.attributes.position.array], 3));
  merged.setAttribute('uv', new THREE.Float32BufferAttribute([...tg.attributes.uv.array, ...sg.attributes.uv.array], 2));
  merged.setIndex([...tg.index.array, ...Array.from(sg.index.array, (i) => i + base)]);
  merged.addGroup(0, tg.index.count, 0);
  merged.addGroup(tg.index.count, sg.index.count, 1);
  merged.computeVertexNormals();
  tepe.geometry = merged;
  tepe.material = [tepe.material, new THREE.MeshStandardMaterial({ name: 'dikis_siyah', color: 0x0a0a0a, roughness: 0.9, metalness: 0 })];
  root.add(tepe);

  // ---------- kalpak_terlik: alt kenarın içinde 1 cm'lik, içe kıvrılmış siyah deri şerit ----------
  const band = [
    [SEAM[0] + 0.0005, SEAM[1] + 0.0005, C.bottom + 0.0004], [SEAM[0] - 0.002, SEAM[1] - 0.002, C.bottom],
    [INNER[0] + 0.003, INNER[1] + 0.003, C.bottom], [INNER[0] + 0.0008, INNER[1] + 0.0008, C.bottom + 0.0012],
    [INNER[0], INNER[1], C.bottom + 0.004], [INNER[0], INNER[1], C.bottom + 0.012], [INNER[0] + 0.0012, INNER[1] + 0.0012, C.bottom + 0.019], [INNER[0] + 0.004, INNER[1] + 0.004, C.bottom + 0.022],
  ].map(([rx, rz, y]) => ellipse(rx, rz, y, 72));
  root.add(mesh('kalpak_terlik', new THREE.MeshStandardMaterial({ name: 'siyah_deri', color: 0x121110, roughness: 0.7, metalness: 0 }), band, {
    facing: (x, y, z) => [C.x - x, -0.04, C.z - z],
  }));

  // ---------- kalpak_astar: iç yüzey (koyu astar), içe ve aşağı bakar ----------
  const lining = [
    [INNER[0] + 0.003, INNER[1] + 0.003, C.bottom + 0.02], [INNER[0] + 0.002, INNER[1] + 0.002, 1.83], [0.091, 0.103, 1.86], [0.087, 0.098, 1.883],
    [0.078, 0.088, 1.895], [0.056, 0.064, 1.901], [0.026, 0.03, 1.9028],
  ].map(([rx, rz, y]) => ellipse(rx, rz, y, 48));
  root.add(mesh('kalpak_astar', new THREE.MeshStandardMaterial({ name: 'astar', color: 0x2a211c, roughness: 0.95, metalness: 0 }), lining, {
    closedTop: { x: C.x, y: 1.9032, z: C.z }, facing: (x, y, z) => [C.x - x, 1.83 - y, C.z - z],
  }));
  return root;
}
