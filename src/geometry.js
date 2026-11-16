import * as THREE from 'three';

// Kesitlerden (section) pürüzsüz yüzey üreten yardımcılar.
// Bir kesit: [x, y, z, rx, rz] — merkez ve iki yarıçap. Kesitler arası Catmull-Rom ile yumuşatılır.

const X_AXIS = new THREE.Vector3(1, 0, 0);

const catmull = (p0, p1, p2, p3, t) =>
  0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);

export function evalSections(S, u) {
  const n = S.length;
  const i = Math.max(0, Math.min(Math.floor(u), n - 2));
  const t = u - i;
  const g = (k) => S[Math.max(0, Math.min(n - 1, k))];
  const out = [];
  for (let c = 0; c < 5; c++) out.push(catmull(g(i - 1)[c], g(i)[c], g(i + 1)[c], g(i + 2)[c], t));
  return out;
}

const sgnPow = (v, p) => Math.sign(v) * Math.pow(Math.abs(v), p);

// u parametresindeki halkanın a açısındaki noktası. a = PI/2 "ön", a = -PI/2 "arka".
function ringPoint(S, u, a, { e = 2, right = X_AXIS, offset = 0 }, target) {
  const n = S.length - 1;
  const eps = 0.01;
  const A = evalSections(S, Math.max(0, u - eps));
  const B = evalSections(S, Math.min(n, u + eps));
  const t = new THREE.Vector3(B[0] - A[0], B[1] - A[1], B[2] - A[2]).normalize();
  const r = right.clone().addScaledVector(t, -t.dot(right)).normalize();
  const f = new THREE.Vector3().crossVectors(r, t);
  const [x, y, z, rx, rz] = evalSections(S, u);
  return target
    .set(x, y, z)
    .addScaledVector(r, (rx + offset) * sgnPow(Math.cos(a), 2 / e))
    .addScaledVector(f, (rz + offset) * sgnPow(Math.sin(a), 2 / e));
}

function finish(positions, uvs, indices) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

// Kesitler boyunca kapalı tüp yüzeyi.
export function loft(S, opts = {}) {
  const { radial = 40, steps = 8, capStart = false, capEnd = false, uRepeat = 2, vScale = 4 } = opts;
  const u0 = opts.u0 ?? 0;
  const u1 = opts.u1 ?? S.length - 1;
  const rows = Math.max(1, Math.round((u1 - u0) * steps));
  const positions = [];
  const uvs = [];
  const indices = [];
  const p = new THREE.Vector3();
  const prev = new THREE.Vector3();
  let len = 0;

  for (let j = 0; j <= rows; j++) {
    const u = u0 + ((u1 - u0) * j) / rows;
    const c = evalSections(S, u);
    if (j > 0) len += prev.distanceTo(p.set(c[0], c[1], c[2]));
    prev.set(c[0], c[1], c[2]);
    for (let k = 0; k <= radial; k++) {
      ringPoint(S, u, -Math.PI / 2 + (2 * Math.PI * k) / radial, opts, p);
      positions.push(p.x, p.y, p.z);
      uvs.push((k / radial) * uRepeat, len * vScale);
    }
  }
  const w = radial + 1;
  for (let j = 0; j < rows; j++) {
    for (let k = 0; k < radial; k++) {
      const a = j * w + k;
      indices.push(a, a + w, a + 1, a + w, a + w + 1, a + 1);
    }
  }
  const cap = (row, flip) => {
    const c = evalSections(S, row === 0 ? u0 : u1);
    const ci = positions.length / 3;
    positions.push(c[0], c[1], c[2]);
    uvs.push(0.5, 0.5);
    for (let k = 0; k < radial; k++) {
      const a = row * w + k;
      if (flip) indices.push(ci, a + 1, a);
      else indices.push(ci, a, a + 1);
    }
  };
  if (capStart) cap(0, false);
  if (capEnd) cap(rows, true);

  const g = finish(positions, uvs, indices);
  // Dikiş yerindeki (k = 0 ve k = radial) normalleri birleştir.
  const nrm = g.attributes.normal;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  for (let j = 0; j <= rows; j++) {
    const i0 = j * w;
    const i1 = j * w + radial;
    a.fromBufferAttribute(nrm, i0).add(b.fromBufferAttribute(nrm, i1)).normalize();
    nrm.setXYZ(i0, a.x, a.y, a.z);
    nrm.setXYZ(i1, a.x, a.y, a.z);
  }
  return g;
}

// Tüp yüzeyinin üzerine oturan yama: center açısı etrafında half genişliğinde.
// center ve half sayı ya da (0..1 arası ilerleme) => açı fonksiyonu olabilir.
export function patch(S, opts) {
  const { u0, u1, cols = 10, steps = 8, uvScale = [1, 1] } = opts;
  const fn = (v) => (typeof v === 'function' ? v : () => v);
  const center = fn(opts.center);
  const half = fn(opts.half);
  const rows = Math.max(1, Math.round((u1 - u0) * steps));
  const positions = [];
  const uvs = [];
  const indices = [];
  const p = new THREE.Vector3();
  for (let j = 0; j <= rows; j++) {
    const q = j / rows;
    for (let k = 0; k <= cols; k++) {
      const a = center(q) + half(q) * ((2 * k) / cols - 1);
      ringPoint(S, u0 + (u1 - u0) * q, a, opts, p);
      positions.push(p.x, p.y, p.z);
      uvs.push((k / cols) * uvScale[0], q * uvScale[1]);
    }
  }
  const w = cols + 1;
  for (let j = 0; j < rows; j++) {
    for (let k = 0; k < cols; k++) {
      const a = j * w + k;
      indices.push(a, a + w, a + 1, a + w, a + w + 1, a + 1);
    }
  }
  return finish(positions, uvs, indices);
}

// Yüzey üzerinde, açısı ilerlemeye bağlı bir çizgi boyunca ince boru (dikiş, fermuar, kenar).
export function surfaceTube(S, opts) {
  const { u0, u1, radius = 0.003, samples = 24 } = opts;
  const angle = typeof opts.angle === 'function' ? opts.angle : () => opts.angle;
  const pts = [];
  for (let j = 0; j <= samples; j++) {
    const q = j / samples;
    pts.push(ringPoint(S, u0 + (u1 - u0) * q, angle(q), opts, new THREE.Vector3()));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), samples * 2, radius, 8);
}

// --- Prosedürel dokular ---

function canvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

function randomGray(size) {
  const c = canvas(size);
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

// Farklı çözünürlükte rastgele katmanların üst üste bindirilmesiyle bulutsu gürültü.
function noise(size, octaves) {
  const c = canvas(size);
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  octaves.forEach(([res, alpha], i) => {
    g.globalAlpha = i === 0 ? 1 : alpha;
    g.drawImage(randomGray(res), 0, 0, size, size);
  });
  return c;
}

function texture(c, srgb) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function overlay(g, src, op, alpha) {
  g.globalCompositeOperation = op;
  g.globalAlpha = alpha;
  g.drawImage(src, 0, 0, g.canvas.width, g.canvas.height);
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
}

export function leatherTextures(base = '#4d3423') {
  const size = 512;
  const c = canvas(size);
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  overlay(g, noise(size, [[6, 1], [14, 0.5], [40, 0.35]]), 'overlay', 0.55); // eskitme lekeleri
  overlay(g, noise(size, [[128, 1], [256, 0.5]]), 'soft-light', 0.35); // ince gren
  const bump = noise(size, [[40, 1], [128, 0.5], [256, 0.5]]);
  return { map: texture(c, true), bumpMap: texture(bump, false) };
}

export function denimTextures(base = '#171d2b') {
  const size = 512;
  const c = canvas(size);
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  // Dikey iplik çizgileri
  const streak = canvas(size);
  streak.getContext('2d').drawImage(randomGray(size), 0, 0, size, 1, 0, 0, size, size);
  overlay(g, streak, 'overlay', 0.22);
  overlay(g, noise(size, [[8, 1], [32, 0.5]]), 'overlay', 0.18); // yıkama solukluğu
  // Çapraz dimi dokusu
  const twill = canvas(size);
  const tg = twill.getContext('2d');
  tg.fillStyle = '#707070';
  tg.fillRect(0, 0, size, size);
  tg.strokeStyle = '#c8c8c8';
  tg.lineWidth = 1.5;
  for (let i = -size; i < size; i += 5) {
    tg.beginPath();
    tg.moveTo(i, size);
    tg.lineTo(i + size, 0);
    tg.stroke();
  }
  overlay(g, twill, 'overlay', 0.15);
  return { map: texture(c, true), bumpMap: texture(twill, false) };
}

export function knitTextures(base = '#303338') {
  const size = 512;
  const ribs = 32;
  const w = size / ribs;
  const bump = canvas(size);
  const bg = bump.getContext('2d');
  for (let i = 0; i < ribs; i++) {
    const grad = bg.createLinearGradient(i * w, 0, (i + 1) * w, 0);
    grad.addColorStop(0, '#202020');
    grad.addColorStop(0.5, '#e0e0e0');
    grad.addColorStop(1, '#202020');
    bg.fillStyle = grad;
    bg.fillRect(i * w, 0, w, size);
  }
  bg.fillStyle = 'rgba(0,0,0,0.25)';
  for (let y = 0; y < size; y += 6) bg.fillRect(0, y, size, 1.5); // ilmek sıraları
  const c = canvas(size);
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  overlay(g, bump, 'overlay', 0.45);
  overlay(g, noise(size, [[64, 1], [256, 0.5]]), 'soft-light', 0.3);
  return { map: texture(c, true), bumpMap: texture(bump, false) };
}

export const surfacePoint = (S, u, a, opts = {}) => ringPoint(S, u, a, opts, new THREE.Vector3());
