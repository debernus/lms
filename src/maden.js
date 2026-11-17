import * as THREE from 'three';
import { canvasTexture } from './halk2.js';
import { Part } from './arapcami.js';

// Maden galerisi (iç mekân): geniş bir kaya oyuğu, ahşap çatkılı dar galeriye bağlanır. Duvar ve tavan
// boyunca kablolar, asılı lambalar, yerde kayalar. Araba ve ray yoktur. İki ucu da açıktır: yakın uç
// (+Z, giriş) ve galerinin devam ettiği uzak uç (-Z, boş). Kaya yüzeyleri İÇE bakar (tek taraflı).
// 1 birim = 1 metre, Y yukarı, zemin y ≈ 0, eksen x = 0. Uzunluk 18 m (z = +9 … -9).
// Parçalar: maden_tunel, maden_direkler, maden_kablolar, maden_lambalar, maden_kayalar.

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;
const Z0 = 9, Z1 = -9, STEP = 0.75;

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const smooth = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
function textures() {
  const rock = canvasTexture('kaya', 512, 512, (g) => {
    const rand = rng(41);
    g.fillStyle = '#2f3238';
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 500; i++) {
      const v = 30 + rand() * 60;
      g.fillStyle = `rgba(${v},${v + 3},${v + 10},${0.2 + rand() * 0.3})`;
      g.beginPath();
      const x = rand() * 512, y = rand() * 512;
      g.moveTo(x, y);
      for (let k = 0; k < 4; k++) g.lineTo(x + (rand() - 0.3) * 70, y + (rand() - 0.3) * 50);
      g.fill();
    }
    g.strokeStyle = 'rgba(8,8,10,0.7)';
    for (let i = 0; i < 70; i++) {
      g.lineWidth = 1 + rand() * 2;
      g.beginPath();
      let x = rand() * 512, y = rand() * 512;
      g.moveTo(x, y);
      for (let k = 0; k < 5; k++) g.lineTo((x += (rand() - 0.5) * 60), (y += (rand() - 0.2) * 40));
      g.stroke();
    }
  });
  const floor = canvasTexture('maden_zemini', 512, 512, (g) => {
    const rand = rng(52);
    g.fillStyle = '#26221e';
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 1400; i++) {
      const v = 26 + rand() * 50;
      g.fillStyle = `rgba(${v + 6},${v},${v - 4},${0.3 + rand() * 0.4})`;
      g.beginPath();
      g.ellipse(rand() * 512, rand() * 512, 2 + rand() * 9, 2 + rand() * 6, rand() * 3, 0, 6.3);
      g.fill();
    }
  });
  const wood = canvasTexture('maden_diregi', 128, 256, (g) => {
    const rand = rng(63);
    g.fillStyle = '#5a5248';
    g.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = `rgba(${rand() < 0.5 ? '24,20,16' : '120,112,98'},${0.12 + rand() * 0.25})`;
      g.fillRect(rand() * 128, rand() * 256, 1 + rand() * 3, 30 + rand() * 120);
    }
  });
  return { rock, floor, wood };
}

// İki nokta arasında kütük ya da kablo (n kenarlı boru); uçları kapatılabilir
function tube(part, mat, p0, p1, r0, r1, n, caps = false, uScale = 1) {
  const dir = p1.clone().sub(p0).normalize();
  const u = (Math.abs(dir.y) < 0.9 ? v3(0, 1, 0) : v3(1, 0, 0)).cross(dir).normalize(), w = dir.clone().cross(u), len = p0.distanceTo(p1);
  const at = (p, r, k) => p.clone().addScaledVector(u, Math.cos((k / n) * TAU) * r).addScaledVector(w, Math.sin((k / n) * TAU) * r);
  for (let k = 0; k < n; k++) {
    const mid = u.clone().multiplyScalar(Math.cos(((k + 0.5) / n) * TAU)).addScaledVector(w, Math.sin(((k + 0.5) / n) * TAU));
    part.quad(mat, [at(p0, r0, k), at(p0, r0, k + 1), at(p1, r1, k + 1), at(p1, r1, k)], [[(k / n) * uScale, 0], [((k + 1) / n) * uScale, 0], [((k + 1) / n) * uScale, len], [(k / n) * uScale, len]], mid);
    if (caps) {
      part.tri(mat, [p0, at(p0, r0, k), at(p0, r0, k + 1)], [[0.5, 0.5], [0.2, 0.2], [0.8, 0.2]], dir.clone().negate());
      part.tri(mat, [p1, at(p1, r1, k), at(p1, r1, k + 1)], [[0.5, 0.5], [0.2, 0.2], [0.8, 0.2]], dir);
    }
  }
}

export function createMadenTuneli() {
  const root = new THREE.Group();
  root.name = 'maden_tuneli';
  const T = textures();
  const std = (name, o) => new THREE.MeshStandardMaterial({ name, roughness: 0.95, metalness: 0, ...o });
  const M = {
    kaya: std('kaya', { map: T.rock }),
    zemin: std('maden_zemini', { map: T.floor }),
    ahsap: std('maden_diregi', { map: T.wood }),
    kablo: std('kablo', { color: 0x0e0e10, roughness: 0.8 }),
    metal: std('lamba_metal', { color: 0x2a2c2e, roughness: 0.6, metalness: 0.6 }),
    isik: std('lamba_isik', { color: 0xffe9b0, emissive: 0xffd98a, emissiveIntensity: 1.5, roughness: 0.4 }),
  };

  // ---------- Kaya tünel: kesit halkaları; yakın uçta geniş oyuk, sonra dar galeri ----------
  const rand = rng(1914);
  const wide = (z) => smooth(1, 3.2, z); // 0: galeri, 1: geniş oyuk
  const halfW = (z) => 1.9 + 1.5 * wide(z), height = (z) => 2.8 + 2.1 * wide(z);
  const FLOOR = 7, ARCH = 17, COUNT = FLOOR + ARCH;
  const rings = [];
  for (let z = Z0; z >= Z1 - 1e-6; z -= STEP) {
    const w = halfW(z), h = height(z), amp = 0.12 + 0.26 * wide(z), ring = [];
    // Zemin: soldan sağa
    for (let i = 0; i < FLOOR; i++) ring.push(v3(-w + (2 * w * i) / FLOOR + (rand() - 0.5) * 0.1, (rand() - 0.5) * 0.09, z + (rand() - 0.5) * 0.15));
    // Duvarlar ve tavan: sağ alttan sola
    for (let i = 0; i < ARCH; i++) {
      const t = (i / ARCH) * Math.PI, c = Math.cos(t), s = Math.sin(t), d = (rand() - 0.5) * 2 * amp;
      const x = w * Math.sign(c) * Math.abs(c) ** 0.6, y = h * s ** 0.8;
      ring.push(v3(x + c * d, Math.max(0, y + s * d), z + (rand() - 0.5) * 0.25));
    }
    rings.push(ring);
  }
  const tunnel = new Part('maden_tunel');
  for (let j = 0; j + 1 < rings.length; j++) for (let i = 0; i < COUNT; i++) {
    const a = rings[j][i], b = rings[j][(i + 1) % COUNT], c = rings[j + 1][(i + 1) % COUNT], d = rings[j + 1][i];
    const centre = v3(0, height(a.z) * 0.45, (a.z + d.z) / 2), mid = a.clone().add(b).add(c).add(d).multiplyScalar(0.25);
    const floor = i < FLOOR - 1 || (i === FLOOR - 1 && false), u0 = i / 4, u1 = (i + 1) / 4;
    tunnel.quad(i < FLOOR ? 'zemin' : 'kaya', [a, b, c, d], floor || i < FLOOR ? [[a.x / 2.5, a.z / 2.5], [b.x / 2.5, b.z / 2.5], [c.x / 2.5, c.z / 2.5], [d.x / 2.5, d.z / 2.5]] : [[u0, a.z / 3], [u1, b.z / 3], [u1, c.z / 3], [u0, d.z / 3]], centre.sub(mid));
  }
  root.add(tunnel.mesh(M));

  // ---------- Ahşap çatkılar: içe yatık iki direk, üstlerinde kiriş ----------
  const posts = new Part('maden_direkler');
  const frames = [{ z: 2.5, foot: 2.05, top: 1.7, h: 3.05, r: 0.22 }, ...[0.3, -1.9, -4.1, -6.3, -8.4].map((z) => ({ z, foot: 1.5, top: 1.24, h: 2.36, r: 0.13 }))];
  for (const f of frames) {
    for (const s of [-1, 1]) tube(posts, 'ahsap', v3(s * f.foot, -0.05, f.z + (rand() - 0.5) * 0.1), v3(s * f.top, f.h, f.z), f.r * 1.08, f.r * 0.95, 8, true);
    tube(posts, 'ahsap', v3(-f.top - 0.38, f.h + f.r * 0.9, f.z), v3(f.top + 0.38, f.h + f.r * 0.9 + (rand() - 0.5) * 0.08, f.z), f.r * 1.05, f.r, 8, true);
  }
  root.add(posts.mesh(M));

  // ---------- Kablolar: direkten direğe sarkarak giden hatlar ----------
  const cables = new Part('maden_kablolar');
  const span = (p0, p1, sag, r = 0.018) => {
    let before = p0;
    for (let k = 1; k <= 5; k++) {
      const t = k / 5, p = p0.clone().lerp(p1, t);
      p.y -= sag * 4 * t * (1 - t);
      tube(cables, 'kablo', before, p, r, r, 3);
      before = p;
    }
  };
  const anchor = (f, s, y) => v3(s * (f.foot + (f.top - f.foot) * (y / f.h) - f.r - 0.03), y, f.z);
  for (const s of [-1, 1]) for (const [y, sag] of [[1.05, 0.14], [1.3, 0.1]]) {
    span(v3(s * 3.0, y + 0.25, Z0 - 0.2), v3(s * 2.9, y + 0.1, 5.5), sag);
    span(v3(s * 2.9, y + 0.1, 5.5), anchor(frames[0], s, y), sag);
    for (let i = 0; i + 1 < frames.length; i++) span(anchor(frames[i], s, y), anchor(frames[i + 1], s, y), sag);
    span(anchor(frames[frames.length - 1], s, y), v3(s * 1.3, y, Z1 + 0.05), 0.02);
  }
  // Tavan hattı: kirişlerin altından geçer, lambaları besler
  const roofPoint = (f) => v3(0.25, f.h - 0.06, f.z);
  span(v3(0.4, 4.4, Z0 - 0.3), v3(0.3, 4.3, 5.5), 0.2, 0.022);
  span(v3(0.3, 4.3, 5.5), roofPoint(frames[0]), 0.25, 0.022);
  for (let i = 0; i + 1 < frames.length; i++) span(roofPoint(frames[i]), roofPoint(frames[i + 1]), 0.07, 0.022);
  span(roofPoint(frames[frames.length - 1]), v3(0.25, 2.3, Z1 + 0.05), 0.01, 0.022);
  root.add(cables.mesh(M));

  // ---------- Lambalar: tavan hattından sarkan, tel kafesli maden lambaları (ışık kaynağı yok; ampul ışır) ----------
  const lamps = new Part('maden_lambalar');
  for (const [x, y, z, drop] of [[0.25, 2.75, 3.3, 0.5], [0.25, 2.12, -3.0, 0.16], [0.25, 2.12, -7.4, 0.16]]) {
    tube(lamps, 'kablo', v3(x, y + drop + 0.2, z), v3(x, y + 0.12, z), 0.012, 0.012, 3);
    tube(lamps, 'metal', v3(x, y + 0.12, z), v3(x, y, z), 0.05, 0.2, 10); // şapka
    tube(lamps, 'isik', v3(x, y, z), v3(x, y - 0.1, z), 0.09, 0.06, 8, true); // ampul
  }
  root.add(lamps.mesh(M));

  // ---------- Kayalar: duvar diplerinde irili ufaklı taşlar ----------
  const rocks = new Part('maden_kayalar');
  const base = new THREE.IcosahedronGeometry(1, 0), bp = base.attributes.position;
  for (const [x, z, r] of [[-2.6, 7.2, 0.42], [-2.9, 6.3, 0.3], [2.7, 6.0, 0.5], [-2.3, 4.3, 0.28], [2.5, 3.6, 0.24], [-1.5, -0.8, 0.26], [-1.55, -1.3, 0.18], [1.5, -5.2, 0.2], [-0.4, 5.6, 0.13], [0.9, 7.4, 0.11], [-1.2, 7.9, 0.09], [1.45, -7.6, 0.16]]) {
    const sx = 0.85 + rand() * 0.4, sy = 0.55 + rand() * 0.3, sz = 0.85 + rand() * 0.4, turn = rand() * TAU, jitter = new Map();
    const P = (i) => {
      const key = [bp.getX(i), bp.getY(i), bp.getZ(i)].map((v) => v.toFixed(3)).join();
      if (!jitter.has(key)) jitter.set(key, 0.8 + rand() * 0.4);
      const k = jitter.get(key) * r, px = bp.getX(i) * sx, pz = bp.getZ(i) * sz;
      return v3(x + (px * Math.cos(turn) - pz * Math.sin(turn)) * k, Math.max(-0.02, r * sy * 0.6 + bp.getY(i) * sy * k), z + (px * Math.sin(turn) + pz * Math.cos(turn)) * k);
    };
    for (let i = 0; i < bp.count; i += 3) {
      const tri = [P(i), P(i + 1), P(i + 2)], mid = tri[0].clone().add(tri[1]).add(tri[2]).multiplyScalar(1 / 3);
      rocks.tri('kaya', tri, tri.map((p) => [p.x + p.z, p.y * 2]), mid.sub(v3(x, r * sy * 0.5, z)));
    }
  }
  root.add(rocks.mesh(M));
  return root;
}
