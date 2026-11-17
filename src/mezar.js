import * as THREE from 'three';
import fontUrl from '@fontsource/amiri/files/amiri-arabic-700-normal.woff2';
import { canvasTexture } from './halk2.js';

// Osmanlı erkek mezar taşı (18.–19. yy): kitabeli mermer gövde, basamaklı omuz, boyun ve kavuklu başlık;
// dibi toprağa giren dar bir sapla biter. 1 birim = 1 metre, Y yukarı, ön yüz +Z, taban y = 0'da ve
// merkezde. Parçalar: mezar_govde, mezar_kitabe (Arap harfli yazı: doku + normal haritası), mezar_baslik.

// Kitabe yazısı için Arap harfli font (Amiri, OFL); doku çizilmeden önce yüklenmiş olmalı
const amiri = new FontFace('Amiri', `url(${fontUrl})`, { weight: '700' });
document.fonts.add(await amiri.load());

const TAU = Math.PI * 2;
const S01 = (v) => {
  const t = Math.min(1, Math.max(0, v));
  return t * t * (3 - 2 * t);
};
// Dönemin alışılmış kitabe kalıbı; ad kurgudur
const LINES = ['هو الباقی', 'مرحوم و مغفور', 'الی رحمة ربه الغفور', 'قره حصارلی احمد آغا', 'روحیچون الفاتحه', 'سنه ١٣٢٨'];

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
// Yıpranmış mermer: kirli beyaz zemin, benekler, aşağı akan koyu izler, dipte yosun ve toprak
export function paintStone(g, w, h, seed, ground = 0, worn = false) {
  const rand = rng(seed);
  g.fillStyle = '#c9c2b2';
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) {
    const v = 150 + rand() * 80;
    g.fillStyle = `rgba(${v},${v - 6},${v - 18},${0.05 + rand() * 0.12})`;
    const r = 1 + rand() * 6;
    g.fillRect(rand() * w, rand() * h, r, r * (0.6 + rand()));
  }
  g.filter = 'blur(3px)';
  for (let i = 0; i < 40; i++) {
    const x = rand() * w, y = rand() * h, len = 40 + rand() * 220;
    const grad = g.createLinearGradient(0, y, 0, y + len);
    grad.addColorStop(0, `rgba(70,66,54,${0.08 + rand() * 0.12})`);
    grad.addColorStop(1, 'rgba(70,66,54,0)');
    g.fillStyle = grad;
    g.fillRect(x, y, 3 + rand() * 10, len);
  }
  g.filter = 'none';
  for (let i = 0; i < 26; i++) {
    g.fillStyle = `rgba(${90 + rand() * 30},${98 + rand() * 30},${70 + rand() * 20},${0.08 + rand() * 0.1})`;
    g.beginPath();
    g.ellipse(rand() * w, rand() * h, 8 + rand() * 30, 6 + rand() * 22, rand() * 3, 0, TAU);
    g.fill();
  }
  if (worn) {
    // Eskimiş taş: genel kararma, koyu akıntılar, sarı-yeşil ve siyah liken lekeleri
    g.fillStyle = 'rgba(58,54,42,0.3)';
    g.fillRect(0, 0, w, h);
    g.filter = 'blur(4px)';
    for (let i = 0; i < 70; i++) {
      const x = rand() * w, y = rand() * h, len = 60 + rand() * 300;
      const grad = g.createLinearGradient(0, y, 0, y + len);
      grad.addColorStop(0, `rgba(30,28,22,${0.18 + rand() * 0.22})`);
      grad.addColorStop(1, 'rgba(30,28,22,0)');
      g.fillStyle = grad;
      g.fillRect(x, y, 4 + rand() * 16, len);
    }
    g.filter = 'blur(7px)';
    for (let i = 0; i < 70; i++) {
      g.fillStyle = i % 3 === 0 ? `rgba(34,36,30,${0.25 + rand() * 0.3})` : i % 3 === 1 ? `rgba(150,142,70,${0.18 + rand() * 0.22})` : `rgba(86,98,62,${0.2 + rand() * 0.25})`;
      g.beginPath();
      g.ellipse(rand() * w, rand() * h, 10 + rand() * 40, 8 + rand() * 30, rand() * 3, 0, TAU);
      g.fill();
    }
    g.filter = 'none';
  }
  if (ground) {
    const grad = g.createLinearGradient(0, h, 0, h - ground);
    grad.addColorStop(0, 'rgba(62,56,42,0.75)');
    grad.addColorStop(0.5, 'rgba(84,88,60,0.35)');
    grad.addColorStop(1, 'rgba(84,88,60,0)');
    g.fillStyle = grad;
    g.fillRect(0, h - ground, w, ground);
  }
}
const stoneMaterial = (name, seed, worn = false) => new THREE.MeshStandardMaterial({
  name, map: canvasTexture(name, 512, 512, (g) => paintStone(g, 512, 512, seed, 0, worn)), roughness: worn ? 0.96 : 0.9, metalness: 0,
});
// Köşe konumundan doku koordinatı: 1 doku = 0,6 m
function worldUV(geometry) {
  const p = geometry.attributes.position, n = geometry.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const side = Math.abs(n.getX(i)) > 0.7;
    uv[i * 2] = ((side ? p.getZ(i) : p.getX(i)) + 0.3) / 0.6;
    uv[i * 2 + 1] = p.getY(i) / 0.6;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geometry;
}

// ---------- Kitabe: çerçeveli altı pano, kabartma yazı ----------
const PLATE = { x: 0.158, y0: 0.265, y1: 0.975, w: 512, h: 1152 };
const inscriptions = new Map();
function inscription(worn = false, lines = LINES, key = '') {
  const id = `${worn}/${key}`;
  if (!inscriptions.has(id)) inscriptions.set(id, paintInscription(worn, lines, key));
  return inscriptions.get(id);
}
function paintInscription(worn, lines, key) {
  const { w, h } = PLATE;
  const height = document.createElement('canvas');
  height.width = w;
  height.height = h;
  const g = height.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);
  // Çerçeve ve pano ayırıcıları (kabartma)
  g.strokeStyle = '#fff';
  g.lineWidth = 12;
  g.strokeRect(10, 10, w - 20, h - 20);
  const weights = [1, 0.95, 1.05, 1.05, 1.05, 1.2], total = weights.reduce((a, b) => a + b, 0);
  let y = 16;
  g.fillStyle = '#fff';
  g.direction = 'rtl';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  weights.forEach((weight, i) => {
    const ph = ((h - 32) * weight) / total;
    if (i) g.fillRect(16, y - 4, w - 32, 8);
    let size = ph * 0.82;
    g.font = `700 ${size}px Amiri`;
    const wide = g.measureText(lines[i]).width;
    if (wide > w - 56) size *= (w - 56) / wide;
    g.font = `700 ${size}px Amiri`;
    g.fillText(lines[i], w / 2, y + ph / 2 + size * 0.04);
    y += ph;
  });
  // Eskimiş kitabe: yazı yer yer aşınıp silinmiş, levhayı boydan boya bir çatlak kesiyor
  const crack = [];
  if (worn) {
    const rand = rng(77);
    g.filter = 'blur(9px)';
    g.fillStyle = 'rgba(0,0,0,0.9)';
    for (let i = 0; i < 16; i++) {
      g.beginPath();
      g.ellipse(rand() * w, rand() * h, 22 + rand() * 60, 16 + rand() * 44, rand() * 3, 0, TAU);
      g.fill();
    }
    g.filter = 'none';
    let cx = 70 + rand() * 60;
    for (let cy = 0; cy <= h + 40; cy += 40) crack.push([(cx += (rand() - 0.32) * 46), cy]);
    g.strokeStyle = '#000';
    g.lineWidth = 6;
    g.beginPath();
    crack.forEach(([x, yy], i) => (i ? g.lineTo(x, yy) : g.moveTo(x, yy)));
    g.stroke();
  }
  // Yumuşatılmış yükseklik
  const soft = document.createElement('canvas');
  soft.width = w;
  soft.height = h;
  const sg = soft.getContext('2d');
  sg.filter = worn ? 'blur(2.8px)' : 'blur(1.6px)';
  sg.drawImage(height, 0, 0);
  const H = sg.getImageData(0, 0, w, h).data;

  const map = canvasTexture((worn ? 'kitabe_eski' : 'kitabe') + key, w, h, (c) => {
    paintStone(c, w, h, 31, 0, worn);
    // Zemin (oyuk) kirli ve koyu, yazı ve çerçeve açık
    c.globalCompositeOperation = 'multiply';
    c.globalAlpha = worn ? 0.5 : 0.3;
    c.drawImage(soft, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    if (crack.length) {
      c.strokeStyle = 'rgba(14,12,10,0.9)';
      c.lineWidth = 3.5;
      c.beginPath();
      crack.forEach(([x, yy], i) => (i ? c.lineTo(x, yy) : c.moveTo(x, yy)));
      c.stroke();
    }
  });
  const normalMap = canvasTexture((worn ? 'kitabe_eski_kabartma' : 'kitabe_kabartma') + key, w, h, (c) => {
    const out = c.createImageData(w, h);
    const at = (x, yy) => H[(Math.min(h - 1, Math.max(0, yy)) * w + Math.min(w - 1, Math.max(0, x))) * 4] / 255;
    for (let yy = 0; yy < h; yy++) for (let x = 0; x < w; x++) {
      const du = (at(x + 1, yy) - at(x - 1, yy)) * 3.2, dv = (at(x, yy - 1) - at(x, yy + 1)) * 3.2;
      const len = Math.hypot(du, dv, 1), i = (yy * w + x) * 4;
      out.data[i] = (-du / len * 0.5 + 0.5) * 255;
      out.data[i + 1] = (-dv / len * 0.5 + 0.5) * 255;
      out.data[i + 2] = (1 / len * 0.5 + 0.5) * 255;
      out.data[i + 3] = 255;
    }
    c.putImageData(out, 0, 0);
  });
  normalMap.colorSpace = THREE.NoColorSpace;
  map.wrapS = map.wrapT = normalMap.wrapS = normalMap.wrapT = THREE.ClampToEdgeWrapping;
  return new THREE.MeshStandardMaterial({ name: (worn ? 'kitabe_eski' : 'kitabe') + key, map, normalMap, normalScale: new THREE.Vector2(1.4, 1.4), roughness: worn ? 0.96 : 0.9, metalness: 0 });
}

// Ağı bir düzlemle keser: düzlemin önünde (normal yönünde) kalan parça atılır, kesik yüz pürüzlü bir
// kırık yüzeyiyle kapatılır. Girdi: indekssiz, konum + normal. Çıktı: { kept, cap } indekssiz geometriler.
function breakOff(geometry, point, normal, side = 1) {
  const P = geometry.attributes.position, Nn = geometry.attributes.normal, n = normal.clone().normalize();
  const pos = [], nor = [], segments = [];
  const hash = (v) => {
    const t = Math.sin(v.x * 311.7 + v.y * 157.3 + v.z * 271.9) * 43758.5453;
    return t - Math.floor(t);
  };
  const ragged = (v) => v.clone().addScaledVector(n, (hash(v) - 0.65) * 0.006); // kırık kenarı düz bir çizgi olmasın
  for (let t = 0; t < P.count; t += 3) {
    const tri = [0, 1, 2].map((k) => ({ p: new THREE.Vector3().fromBufferAttribute(P, t + k), n: new THREE.Vector3().fromBufferAttribute(Nn, t + k) }));
    const d = tri.map((v) => side * v.p.clone().sub(point).dot(n)); // side = -1: düzlemin öbür yanı atılır (aynı kırığın karşı parçası)
    if (d.every((x) => x > 0)) continue;
    const out = [], cut = [];
    for (let k = 0; k < 3; k++) {
      const a = tri[k], b = tri[(k + 1) % 3], da = d[k], db = d[(k + 1) % 3];
      if (da <= 0) out.push(a);
      if (da <= 0 !== db <= 0) {
        const f = da / (da - db), p = ragged(a.p.clone().lerp(b.p, f));
        out.push({ p, n: a.n.clone().lerp(b.n, f).normalize() });
        cut.push(p);
      }
    }
    for (let k = 1; k + 1 < out.length; k++) for (const v of [out[0], out[k], out[k + 1]]) {
      pos.push(v.p.x, v.p.y, v.p.z);
      nor.push(v.n.x, v.n.y, v.n.z);
    }
    if (cut.length === 2) segments.push(cut);
  }
  // Kırık yüzeyi: kesik kenarından ortaya doğru iki kademeli, pürüzlü
  const capPos = [];
  // Kesik kenarları bağlı halkalara ayrılır; her halka kendi ortasına doğru kapatılır
  const key = (v) => `${Math.round(v.x * 5000)},${Math.round(v.y * 5000)},${Math.round(v.z * 5000)}`;
  const group = new Map(), find = (k) => {
    while (group.get(k) !== k) k = group.get(k);
    return k;
  };
  for (const [a, b] of segments) {
    for (const k of [key(a), key(b)]) if (!group.has(k)) group.set(k, k);
    group.set(find(key(a)), find(key(b)));
  }
  const loops = new Map();
  for (const seg of segments) {
    const k = find(key(seg[0]));
    if (!loops.has(k)) loops.set(k, []);
    loops.get(k).push(seg);
  }
  for (const loop of loops.values()) {
    const centre = new THREE.Vector3();
    loop.forEach(([a, b]) => centre.add(a).add(b));
    centre.multiplyScalar(1 / (loop.length * 2)).addScaledVector(n, -0.006);
    const inner = (v) => {
      const m = v.clone().lerp(centre, 0.5);
      return m.addScaledVector(n, (hash(m) - 0.5) * 0.008);
    };
    const push = (a, b, c) => {
      const face = b.clone().sub(a).cross(c.clone().sub(a));
      for (const v of face.dot(n) * side < 0 ? [a, c, b] : [a, b, c]) capPos.push(v.x, v.y, v.z);
    };
    for (const [a, b] of loop) {
      const ia = inner(a), ib = inner(b);
      push(a, b, ib);
      push(a, ib, ia);
      push(centre, ia, ib);
    }
  }
  const kept = new THREE.BufferGeometry();
  kept.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  kept.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  const cap = new THREE.BufferGeometry();
  cap.setAttribute('position', new THREE.Float32BufferAttribute(capPos, 3));
  cap.computeVertexNormals();
  return { kept, cap };
}
// Sırayla birkaç kırık uygular; ana yüzey ve kırık yüzeyleri iki malzeme grubu olarak tek geometride döner
function weather(geometry, breaks) {
  let current = geometry.index ? geometry.toNonIndexed() : geometry;
  const caps = [];
  for (const [point, normal, side = 1] of breaks) {
    const next = [];
    for (const c of caps) next.push(breakOff(c, point, normal, side)); // önceki kırık yüzeyleri de kesilir
    const { kept, cap } = breakOff(current, point, normal, side);
    current = kept;
    caps.length = 0;
    for (const r of next) caps.push(r.kept, r.cap);
    caps.push(cap);
  }
  const pos = [...current.attributes.position.array], nor = [...current.attributes.normal.array], first = pos.length / 3;
  for (const c of caps) {
    if (!c.attributes.position.count) continue;
    pos.push(...c.attributes.position.array);
    nor.push(...c.attributes.normal.array);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.addGroup(0, first, 0);
  out.addGroup(first, pos.length / 3 - first, 1);
  return out;
}

export const createMezarTasi = () => build(false);
// Eskimiş sürüm: kirli ve yosunlu taş, aşınmış ve çatlak kitabe, kırık köşeler, başlığın yarısı kopuk
export const createMezarTasiEski = () => build(true);
// Eskimiş sürümün eşi: her şey aynı, ama başlığın öbür yanı kırıktır (ilk taşta sağ üst, bunda sol üst kopuk);
// yan yana gelince biri ötekinin eksiğini tamamlıyormuş gibi durur.
export const createMezarTasiEski2 = () => build(true, true);
// Özel başlıklı eskimiş mezar taşı (kırıksız). custom: { name, head (konum + normal içeren geometri),
// headMaterial (isteğe bağlı), neck (false: boyun yok), lines (kitabe satırları), key (kitabe dokusunun adı) }
export const createMezarOzel = (custom) => build(true, false, custom);
export const eskiTas = () => (stones.eski ??= stoneMaterial('mermer_eski', 7, true));
const stones = {};

function build(worn, otherHalf = false, custom = null) {
  const root = new THREE.Group();
  root.name = custom ? custom.name : otherHalf ? 'mezar_tasi_eski_2' : worn ? 'mezar_tasi_eski' : 'mezar_tasi';
  const DEPTH = 0.085, BEVEL = 0.005;

  // ---------- Gövde: dar sap, çentikli dip, düz levha, basamaklı omuz; üstünde boyun ----------
  const half = [[0.07, BEVEL], [0.07, 0.1], [0.125, 0.15], [0.112, 0.2], [0.175, 0.245], [0.175, 1.0], [0.112, 1.0], [0.112, 1.04], [0.078, 1.066]];
  const shape = new THREE.Shape();
  half.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  [...half].reverse().forEach(([x, y]) => shape.lineTo(-x, y));
  shape.closePath();
  const slab = new THREE.ExtrudeGeometry(shape, { depth: DEPTH - 2 * BEVEL, bevelEnabled: true, bevelSize: BEVEL, bevelThickness: BEVEL, bevelSegments: 1, curveSegments: 1 });
  slab.translate(0, 0, -(DEPTH - 2 * BEVEL) / 2);
  const neck = new THREE.CylinderGeometry(0.05, 0.058, 0.16, 16, 1, true);
  neck.translate(0, 1.066 + 0.07, 0);
  const merge = (list) => {
    const pos = [], nor = [], idx = [];
    let base = 0;
    for (const g0 of list) {
      const g = g0.index ? g0.toNonIndexed() : g0;
      pos.push(...g.attributes.position.array);
      nor.push(...g.attributes.normal.array);
      for (let i = 0; i < g.attributes.position.count; i++) idx.push(base + i);
      base += g.attributes.position.count;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    out.setIndex(idx);
    return out;
  };
  const stone = custom ? eskiTas() : worn ? stoneMaterial('mermer_eski', 7, true) : stoneMaterial('mermer', 7);
  const fracture = new THREE.MeshStandardMaterial({ name: 'kirik_yuzey', color: 0x8b8676, roughness: 1, metalness: 0 });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const body = custom
    ? new THREE.Mesh(worldUV(merge(custom.neck === false ? [slab] : [slab, neck])), stone)
    : worn
    ? new THREE.Mesh(worldUV(weather(merge([slab, neck]), [
      [V(-0.167, 0.99, 0.03), V(-1, 0.5, 0.9)], // sol omuz köşesi (ön)
      [V(0.165, 1.0, 0.03), V(1, 0.3, 0.6)], // sağ omuz köşesi (ön)
      [V(0.07, 0.07, 0.01), V(1, -0.7, 0.9)], // dipte ön sağ köşe
      [V(-0.175, 0.62, -0.03), V(-1, 0.1, -1.2)], // sol kenarın arka yüzünde kopma
      [V(0.175, 0.5, -0.035), V(1, -0.25, -1.4)], // sağ kenarın arka yüzünde kopma
    ])), [stone, fracture])
    : new THREE.Mesh(worldUV(merge([slab, neck])), stone);
  body.name = 'mezar_govde';
  root.add(body);

  // ---------- Kitabe: ön yüzün hemen önünde, yazılı ve kabartmalı levha ----------
  const plate = new THREE.PlaneGeometry(PLATE.x * 2, PLATE.y1 - PLATE.y0);
  plate.translate(0, (PLATE.y0 + PLATE.y1) / 2, DEPTH / 2 + 0.0012);
  const kitabe = new THREE.Mesh(plate, custom ? inscription(true, custom.lines, custom.key) : inscription(worn));
  kitabe.name = 'mezar_kitabe';
  root.add(kitabe);

  // ---------- Başlık: iki yana kabaran sarık, önde çapraz kavuşan kat, ortasından yükselen yivli kavuk ----------
  const CY = 1.262, RX = 0.168, RY = 0.108, RZ = 0.122, SEG = 28, RINGS = 12;
  const pos = [], idx = [];
  for (let j = 0; j <= RINGS; j++) {
    const lat = -Math.PI / 2 + (j / RINGS) * Math.PI;
    for (let i = 0; i < SEG; i++) {
      const lon = (i / SEG) * TAU, sx = Math.sin(lon), cz = Math.cos(lon), front = Math.max(0, cz);
      // Önde ortada yarık (iki lob), çapraz kavuşan sargının sırtı ve hafif kat izleri
      const cleft = 0.42 * Math.exp(-((sx / (0.1 + 0.22 * (j / RINGS))) ** 2)) * front * S01((j / RINGS - 0.3) / 0.5);
      const cross = 0.07 * Math.exp(-(((Math.abs(sx) - 0.3 - 0.45 * (lat / 1.2)) / 0.13) ** 2)) * front;
      const folds = 0.012 * Math.sin(lat * 5 + sx * 4);
      const k = (1 - cleft + cross + folds) * Math.cos(lat);
      pos.push(sx * RX * k, CY + Math.sin(lat) * RY * (1 + 0.1 * Math.abs(sx)), cz * RZ * k);
    }
  }
  for (let j = 0; j < RINGS; j++) for (let i = 0; i < SEG; i++) {
    const a = j * SEG + i, b = j * SEG + ((i + 1) % SEG), c = a + SEG, d = b + SEG;
    idx.push(a, b, d, a, d, c);
  }
  // Kavuk: yukarı doğru açılan yivli silindir, düz tepe
  const base = pos.length / 3, RIBS = 32, LEVELS = [[1.24, 0.084], [1.33, 0.088], [1.4, 0.093], [1.447, 0.097], [1.455, 0.092]];
  LEVELS.forEach(([y, r]) => {
    for (let i = 0; i < RIBS; i++) {
      const a = (i / RIBS) * TAU, rr = r + (i % 2 ? -0.005 : 0.005);
      pos.push(Math.sin(a) * rr, y, Math.cos(a) * rr * 0.94);
    }
  });
  for (let j = 0; j + 1 < LEVELS.length; j++) for (let i = 0; i < RIBS; i++) {
    const a = base + j * RIBS + i, b = base + j * RIBS + ((i + 1) % RIBS), c = a + RIBS, d = b + RIBS;
    idx.push(a, b, d, a, d, c);
  }
  const centre = pos.length / 3, last = base + (LEVELS.length - 1) * RIBS;
  pos.push(0, 1.453, 0);
  for (let i = 0; i < RIBS; i++) idx.push(last + i, last + ((i + 1) % RIBS), centre);
  const cap = new THREE.BufferGeometry();
  cap.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  cap.setIndex(idx);
  cap.computeVertexNormals();
  // Eskimiş sürümde başlığın üst yarısı eğik bir kırıkla kopmuştur (kavuğun çoğu ve bir lob gitmiş); eşinde kırık ayna simetriğidir
  const head = custom
    ? new THREE.Mesh(custom.headMaterial ? custom.head : worldUV(custom.head), custom.headMaterial ?? stone)
    : worn
    ? new THREE.Mesh(worldUV(weather(cap, otherHalf ? [[V(-0.015, 1.3, 0), V(-0.8, 0.62, 0.22)], [V(0.16, 1.2, 0.06), V(1, -0.5, 0.9)]] : [[V(0.015, 1.3, 0), V(0.8, 0.62, 0.22)], [V(-0.16, 1.2, 0.06), V(-1, -0.5, 0.9)]])), [stone, fracture])
    : new THREE.Mesh(worldUV(cap), stone);
  head.name = 'mezar_baslik';
  root.add(head);

  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
