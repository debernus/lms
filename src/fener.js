import * as THREE from 'three';
import { canvasTexture } from './halk2.js';
import * as K from './kit_ortak.js';
const { V, ALL, TAU, box, beam, cyl, lathe } = K;

// Dökme demir fenerler: altıgen gövde, buzlu cam üstünde gotik kemerli oyma, kubbe ve alemler.
// 1) duvar_feneri: sırt levhası, yatay kol ve kıvrımlı payanda; orijin duvardaki levhanın ortası, +Z'ye uzanır.
// 2) tavan_feneri: tavan göbeği, çubuk ve zincirle sarkar; orijin tavandaki bağlantı noktası (y = 0'dan aşağı).
// 1 birim = 1 metre. Cam ışır (emissive); ışık kaynağı içermez.

let MATS = null;
function mats() {
  if (MATS) return MATS;
  const glass = canvasTexture('buzlu_cam_oymali', 128, 256, (g) => {
    const grad = g.createRadialGradient(64, 150, 10, 64, 140, 150);
    grad.addColorStop(0, '#fff3cf');
    grad.addColorStop(0.5, '#ecd9a8');
    grad.addColorStop(1, '#b89e6c');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 256);
    g.strokeStyle = '#0c0c0d';
    g.fillStyle = '#0c0c0d';
    g.lineWidth = 7;
    g.strokeRect(3, 3, 122, 250);
    g.fillRect(0, 0, 128, 26);
    // İkiz sivri kemer, orta kayıt, tepede üç dilimli göz
    g.lineWidth = 6;
    g.strokeRect(64, 96, 0.01, 160);
    for (const x of [8, 64]) {
      g.beginPath();
      g.moveTo(x, 256);
      g.lineTo(x, 120);
      g.quadraticCurveTo(x + 4, 82, x + 28, 62);
      g.quadraticCurveTo(x + 52, 82, x + 56, 120);
      g.lineTo(x + 56, 256);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(8, 100);
    g.quadraticCurveTo(14, 44, 64, 28);
    g.quadraticCurveTo(114, 44, 120, 100);
    g.stroke();
    for (const [x, y] of [[64, 50], [52, 66], [76, 66]]) {
      g.beginPath();
      g.arc(x, y, 8, 0, TAU);
      g.stroke();
    }
  });
  glass.wrapS = glass.wrapT = THREE.ClampToEdgeWrapping;
  MATS = {
    dokme_demir: new THREE.MeshStandardMaterial({ name: 'dokme_demir', color: 0x101011, roughness: 0.55, metalness: 0.6, side: THREE.DoubleSide }),
    buzlu_cam: new THREE.MeshStandardMaterial({ name: 'buzlu_cam_oymali', map: glass, emissive: 0xffffff, emissiveMap: glass, emissiveIntensity: 0.75, roughness: 0.5, metalness: 0 }),
  };
  return MATS;
}
const D = 'dokme_demir';
// Fener gövdesi: cam bölümün altı y0'da; toplam -0,2 … +0,5
function lantern(p, y0, z0 = 0, topLoop = false) {
  const L = (prof, n) => lathe(p, D, 0, z0, prof.map(([r, y]) => [r, y0 + y]), n);
  L([[0, -0.2], [0.02, -0.185], [0.034, -0.155], [0.014, -0.135], [0.03, -0.115], [0.07, -0.075], [0.105, -0.035], [0.125, 0], [0.138, 0.012], [0.125, 0.012]], 12); // alt çanak ve alem
  const R = 0.118, H = 0.27, vert = (k) => [Math.cos((k / 6) * TAU + Math.PI / 6) * R, Math.sin((k / 6) * TAU + Math.PI / 6) * R];
  for (let k = 0; k < 6; k++) {
    const [x0, zz0] = vert(k), [x1, zz1] = vert(k + 1);
    p.quad('buzlu_cam', [V(x1, y0 + 0.012, z0 + zz1), V(x0, y0 + 0.012, z0 + zz0), V(x0, y0 + H, z0 + zz0), V(x1, y0 + H, z0 + zz1)], K.FLAT, V(x0 + x1, 0, zz0 + zz1));
    const px = x0 * 1.05, pz = z0 + zz0 * 1.05; // köşe dikmesi, üstünde ve altında küçük alem
    cyl(p, D, V(px, y0, pz), V(px, y0 + H + 0.012, pz), 0.008, 5, false);
    lathe(p, D, px, pz, [[0.008, y0 + H + 0.012], [0.014, y0 + H + 0.024], [0.006, y0 + H + 0.04], [0, y0 + H + 0.058]], 5);
    lathe(p, D, px, pz, [[0, y0 - 0.03], [0.011, y0 - 0.014], [0.008, y0]], 5);
  }
  L([[0.125, H], [0.14, H + 0.004], [0.142, H + 0.018], [0.122, H + 0.022]], 6); // üst kuşak
  L([[0.122, H + 0.022], [0.118, H + 0.06], [0.096, H + 0.105], [0.058, H + 0.135], [0.024, H + 0.148], [0.03, H + 0.162], [0.012, H + 0.18], [0.02, H + 0.196], [0, H + 0.225]], 12); // kubbe ve tepe alemi
  if (topLoop) for (const s of [-1, 1]) beam(p, D, V(s * 0.012, y0 + H + 0.2, z0), V(0, y0 + H + 0.245, z0), 0.006, 0.006, false);
}
const finish = (name, part) => {
  const root = new THREE.Group();
  root.name = name;
  const m = part.mesh(mats());
  m.castShadow = m.receiveShadow = true;
  root.add(m);
  return root;
};

export function createDuvarFeneri() {
  const p = new K.Part('duvar_feneri');
  // Sırt levhası: uçları sivri, ortasında göbek
  box(p, D, -0.035, 0.035, -0.3, 0.26, 0, 0.018, ['+x', '-x', '+z', '+y', '-y'], 1);
  for (const [y, s] of [[0.26, 1], [-0.3, -1]]) K.tri(p, D, [V(-0.035, y, 0.018), V(0.035, y, 0.018), V(0, y + s * 0.045, 0.018)], V(0, 0, 1));
  lathe(p, D, 0, 0, [[0.05, -0.14], [0.05, -0.1]], 8); // kolun çıktığı bilezik (yatay eksenli görünüm için kısa halka)
  for (const y of [0.2, -0.24]) cyl(p, D, V(0, y, 0.018), V(0, y, 0.024), 0.008, 6);
  // Yatay kol, ucunda aşağı kıvrım ve fener tablası
  const AY = -0.12, AZ = 0.36;
  beam(p, D, V(0, AY, 0.018), V(0, AY, AZ + 0.02), 0.024, 0.02);
  beam(p, D, V(0, AY, AZ + 0.02), V(0, AY - 0.03, AZ + 0.045), 0.02, 0.02, false);
  beam(p, D, V(0, AY - 0.03, AZ + 0.045), V(0, AY - 0.05, AZ + 0.03), 0.018, 0.018);
  // Kıvrımlı payandalar: kolun üstünde büyük S, altında küçük C
  const sweep = (pts, t) => pts.slice(1).forEach((q, i) => beam(p, D, V(0, pts[i][0], pts[i][1]), V(0, q[0], q[1]), t, 0.014, i === 0 || i === pts.length - 2));
  const arc = (cy, cz, r, a0, a1, n = 7) => Array.from({ length: n + 1 }, (_, k) => [cy + Math.sin(a0 + ((a1 - a0) * k) / n) * r, cz + Math.cos(a0 + ((a1 - a0) * k) / n) * r]);
  sweep([...arc(0.1, 0.02, 0.12, 1.45, -0.2, 8), ...arc(-0.04, 0.2, 0.07, 2.2, 5.2, 8)], 0.014);
  sweep(arc(0.14, 0.075, 0.035, 1.6, 6.4, 8), 0.011);
  sweep(arc(-0.2, 0.02, 0.085, -1.45, 0.9, 7), 0.013);
  sweep(arc(-0.155, 0.13, 0.03, 4.0, -0.6, 7), 0.01);
  lantern(p, AY + 0.21, AZ);
  return finish('duvar_feneri', p);
}

export function createTavanFeneri() {
  const p = new K.Part('tavan_feneri');
  lathe(p, D, 0, 0, [[0.075, 0], [0.075, -0.012], [0.04, -0.04], [0.014, -0.052], [0.008, -0.06]], 12); // tavan göbeği
  cyl(p, D, V(0, -0.06, 0), V(0, -0.15, 0), 0.006, 5, false);
  for (let k = 0; k < 5; k++) { // zincir: sırayla dönük baklalar
    const y = -0.145 - k * 0.046, a = k % 2 ? [0.004, 0.013] : [0.013, 0.004];
    for (const s of [-1, 1]) box(p, D, s * a[0] - 0.003 * (a[0] > a[1] ? 1 : 0.9), s * a[0] + 0.003, y - 0.056, y, s * a[1] - 0.003, s * a[1] + 0.003, ['+x', '-x', '+z', '-z'], 1);
    for (const yy of [y, y - 0.056]) box(p, D, -a[0] - 0.003, a[0] + 0.003, yy - 0.003, yy + 0.003, -a[1] - 0.003, a[1] + 0.003, ALL, 1);
  }
  lantern(p, -0.145 - 5 * 0.046 - 0.012 - 0.515, 0, true);
  return finish('tavan_feneri', p);
}
