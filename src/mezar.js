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
function paintStone(g, w, h, seed, ground = 0) {
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
  if (ground) {
    const grad = g.createLinearGradient(0, h, 0, h - ground);
    grad.addColorStop(0, 'rgba(62,56,42,0.75)');
    grad.addColorStop(0.5, 'rgba(84,88,60,0.35)');
    grad.addColorStop(1, 'rgba(84,88,60,0)');
    g.fillStyle = grad;
    g.fillRect(0, h - ground, w, ground);
  }
}
const stoneMaterial = (name, seed) => new THREE.MeshStandardMaterial({
  name, map: canvasTexture(name, 512, 512, (g) => paintStone(g, 512, 512, seed)), roughness: 0.9, metalness: 0,
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
function inscription() {
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
    const wide = g.measureText(LINES[i]).width;
    if (wide > w - 56) size *= (w - 56) / wide;
    g.font = `700 ${size}px Amiri`;
    g.fillText(LINES[i], w / 2, y + ph / 2 + size * 0.04);
    y += ph;
  });
  // Yumuşatılmış yükseklik
  const soft = document.createElement('canvas');
  soft.width = w;
  soft.height = h;
  const sg = soft.getContext('2d');
  sg.filter = 'blur(1.6px)';
  sg.drawImage(height, 0, 0);
  const H = sg.getImageData(0, 0, w, h).data;

  const map = canvasTexture('kitabe', w, h, (c) => {
    paintStone(c, w, h, 31);
    // Zemin (oyuk) kirli ve koyu, yazı ve çerçeve açık
    c.globalCompositeOperation = 'multiply';
    c.globalAlpha = 0.3;
    c.drawImage(soft, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  });
  const normalMap = canvasTexture('kitabe_kabartma', w, h, (c) => {
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
  return new THREE.MeshStandardMaterial({ name: 'kitabe', map, normalMap, normalScale: new THREE.Vector2(1.4, 1.4), roughness: 0.9, metalness: 0 });
}

export function createMezarTasi() {
  const root = new THREE.Group();
  root.name = 'mezar_tasi';
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
  const stone = stoneMaterial('mermer', 7);
  const body = new THREE.Mesh(worldUV(merge([slab, neck])), stone);
  body.name = 'mezar_govde';
  root.add(body);

  // ---------- Kitabe: ön yüzün hemen önünde, yazılı ve kabartmalı levha ----------
  const plate = new THREE.PlaneGeometry(PLATE.x * 2, PLATE.y1 - PLATE.y0);
  plate.translate(0, (PLATE.y0 + PLATE.y1) / 2, DEPTH / 2 + 0.0012);
  const kitabe = new THREE.Mesh(plate, inscription());
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
  const head = new THREE.Mesh(worldUV(cap), stone);
  head.name = 'mezar_baslik';
  root.add(head);

  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
