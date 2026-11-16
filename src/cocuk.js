import * as THREE from 'three';
import { Surface, cloth, awayFromAxis, buildTrousers, TAU } from './outfit.js';
import { castOut, settle } from './outfit2.js';
import { skirtRadius, CEKET } from './outfit3.js';
import { buildAyakkabi } from './outfit5.js';
import { canvasTexture, build, robe, wrapUV } from './halk2.js';

// Yoksul sokak çocuğu kıyafeti (1900'lerin başı, Osmanlı): çizgili mintan, bele dolanmış bez kuşak,
// bol şalvar, omuzdan çapraz asılı bez çanta ve ayrı duran terlikler. Hepsi eski, kirli ve soluk.
// manken_erkek.glb'nin üstüne oturur (gömleksiz kopyayla); konum ve ölçek mankenle aynı.

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
let seed = 1900;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

// Kir: açık zemin üstünde düzensiz koyu lekeler; malzemenin rengiyle çarpılır.
function grime(g, w, h, count, strength) {
  for (let i = 0; i < count; i++) {
    const x = rand() * w, y = rand() * h, r = 6 + rand() * 26;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(28,22,16,${strength * (0.3 + rand() * 0.7)})`);
    grad.addColorStop(1, 'rgba(28,22,16,0)');
    g.fillStyle = grad;
    for (const [ox, oy] of [[0, 0], [w, 0], [-w, 0], [0, h], [0, -h]]) g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
  }
}
const dirtMap = canvasTexture('kir', 128, 128, (g) => {
  g.fillStyle = '#d2cdc2';
  g.fillRect(0, 0, 128, 128);
  grime(g, 128, 128, 46, 0.55);
});
export const dirty = (name, color) => new THREE.MeshStandardMaterial({ name, color, map: dirtMap, roughness: 0.95, metalness: 0, side: THREE.DoubleSide });
export const worldUV = (x, y, z) => [(x + z) * 2.6, y * 2.6];
// Hazır bir ağa kir dokusu için uv ekler ve malzemesini değiştirir.
export function soil(mesh, name, color) {
  const p = mesh.geometry.attributes.position, uv = [];
  for (let i = 0; i < p.count; i++) uv.push(...worldUV(p.getX(i), p.getY(i), p.getZ(i)));
  mesh.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  mesh.material = dirty(name, color);
  mesh.name = name;
  return mesh;
}

// ---------- Mintan ----------
// Yakasız, uzun kollu, soluk çizgili gömlek; yakası göğüste açık, eteği kuşağın altında.
function buildMintan() {
  const s = robe({
    offset: 0.017, sleeveDrop: 0.008,
    sleeve: (ax) => 0.074 + 0.01 * clamp01((ax - 0.3) / 0.38) + 0.004 * Math.sin(ax * 46), // buruşuk kol
    inside: (x, y, z) => {
      if (Math.abs(x) > 0.68) return false;
      if (y > 1.53 && Math.hypot(x, z + 0.045) < 0.1) return false; // boyun
      return !(z > 0 && Math.abs(x) < (y - 1.3) * 0.22); // göğse inen açık yaka
    },
    rows: [[1.1, 0.02], [1.04, 0.022], [0.98, 0.024]],
  });
  const map = canvasTexture('mintan_cizgi', 128, 128, (g) => {
    g.fillStyle = '#8f897b';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#4d4944';
    for (const x of [0, 32, 64, 96]) g.fillRect(x + 4, 0, 11, 128);
    g.fillStyle = '#6f6a60';
    for (const x of [0, 32, 64, 96]) g.fillRect(x + 21, 0, 3, 128);
    grime(g, 128, 128, 60, 0.5);
  });
  const material = new THREE.MeshStandardMaterial({ name: 'mintan', map, roughness: 0.95, metalness: 0, side: THREE.DoubleSide });
  return build('mintan', [[s, material, wrapUV(9, 2.2)]]);
}

// ---------- Kuşak ----------
// Bele gelişigüzel dolanmış geniş bez; katları eğri büğrü, önde sarkan kısa bir ucu var.
function buildKusak() {
  const s = new Surface();
  const out = awayFromAxis(CEKET.cx, CEKET.cz);
  const at = (a, y, pay) => {
    const r = skirtRadius(y, a, pay);
    return s.point(CEKET.cx + Math.cos(a) * r, y, CEKET.cz + Math.sin(a) * r);
  };
  let previous = null;
  for (const [y, pay] of [[0.955, 0.03], [0.96, 0.038], [0.995, 0.05], [1.03, 0.042], [1.06, 0.052], [1.095, 0.042], [1.12, 0.05], [1.14, 0.034], [1.143, 0.026]]) {
    const ring = Array.from({ length: 40 }, (_, k) => {
      const a = (k / 40) * TAU;
      return at(a, y + 0.014 * Math.sin(a * 2 + y * 9) + 0.008 * Math.sin(a * 5), pay + 0.004 * Math.sin(a * 7 + y * 40));
    });
    if (previous) s.strip(previous, ring, true, out);
    previous = ring;
  }
  let above = null;
  for (const [y, half] of [[0.99, 0.2], [0.93, 0.18], [0.88, 0.14], [0.85, 0.07]]) {
    const row = Array.from({ length: 5 }, (_, c) => at(Math.PI / 2 + 0.3 + half * (c / 2 - 1), y, 0.056 + 0.005 * Math.sin(c * 2.2)));
    if (above) s.strip(above, row, false, out);
    above = row;
  }
  return build('kusak', [[s, dirty('kusak', 0x9a8f78), worldUV]]);
}

// ---------- Çanta ----------
// Sağ omuzdan sol kalçaya çapraz inen bez askı ve kalçada sarkan, kapaklı bez torba.
function buildCanta() {
  const s = new Surface();
  // Askı: gövdeyi dolanan yassı bez şerit, mintanın üstünde
  const OFFSET = 0.026, WIDTH = 0.035;
  const shoulder = v3(-0.135, 1.53, -0.045), hip = v3(0.175, 1.13, -0.03);
  const along = hip.clone().sub(shoulder).normalize(), depth = v3(0, 0, 1);
  const across = along.clone().cross(depth).normalize(), center = shoulder.clone().lerp(hip, 0.5);
  const K = 64, rows = [];
  for (let k = 0; k < K; k++) {
    const phi = (k / K) * TAU;
    const mid = castOut(center, along.clone().multiplyScalar(Math.cos(phi)).addScaledVector(depth, Math.sin(phi)), OFFSET);
    rows.push([-1, 1].map((e) => {
      const p = settle(mid.clone().addScaledVector(across, (e * WIDTH) / 2), OFFSET);
      return s.point(p.x, p.y, p.z);
    }));
  }
  s.strip(rows.map((r) => r[0]), rows.map((r) => r[1]), true, (x, y, z) => [x - center.x, y - center.y, z - center.z]);
  // Torba: sol kalçada, hafif yamuk ve şişkin
  const C = v3(0.262, 0.975, -0.035);
  const ring = (y, halfZ, thick, lean) => Array.from({ length: 12 }, (_, k) => {
    const a = (k / 12) * TAU;
    return s.point(C.x + Math.cos(a) * thick + lean, y, C.z + Math.sin(a) * halfZ);
  });
  const levels = [[0.845, 0.075, 0.022, 0.012], [0.865, 0.11, 0.046, 0.012], [0.95, 0.118, 0.056, 0.008], [1.03, 0.112, 0.046, 0], [1.085, 0.1, 0.026, -0.012], [1.1, 0.09, 0.01, -0.018]].map((l) => ring(...l));
  for (let j = 1; j < levels.length; j++) s.strip(levels[j - 1], levels[j], true, (x, y, z) => [x - C.x, 0, z - C.z]);
  s.fan(s.point(C.x + 0.012, 0.84, C.z), levels[0], () => [0, -1, 0]);
  s.fan(s.point(C.x - 0.018, 1.102, C.z), levels[levels.length - 1], () => [0, 1, 0]);
  // Kapak: torbanın dış yüzüne katlanan bez
  const flap = [[1.1, -0.004], [1.04, 0.05], [0.985, 0.066]].map(([y, dx]) => [-0.095, 0, 0.095].map((dz) => s.point(C.x + dx, y, C.z + dz * (y < 1 ? 0.8 : 1))));
  s.strip(flap[0], flap[1], false, () => [1, 0, 0]);
  s.strip(flap[1], flap[2], false, () => [1, 0, 0]);
  return build('canta', [[s, dirty('canta', 0x77684c), worldUV]]);
}

// ---------- Şalvar ----------
const SALVAR = {
  name: 'salvar', color: 0x3b3833, top: 1.04, crotch: 0.84, cx: 0, cz: -0.04,
  ease: [[0.12, 0.02], [0.2, 0.05], [0.36, 0.062], [0.6, 0.06], [0.84, 0.05], [0.96, 0.04], [1.04, 0.02]],
  legRows: [0.12, 0.15, 0.2, 0.28, 0.36, 0.44, 0.52, 0.6, 0.68, 0.76, 0.84],
  hipRows: [0.88, 0.92, 0.96, 0.98, 1.0, 1.02, 1.04],
  legFold: 0.012, hipFold: 0.01,
};

export function createCocukKiyafet() {
  const root = new THREE.Group();
  root.name = 'cocuk_kiyafet';
  root.add(buildMintan(), buildKusak(), soil(buildTrousers(SALVAR), 'salvar', SALVAR.color), buildCanta(), soil(buildAyakkabi(), 'terlik', 0x54422f));
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
