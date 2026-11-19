import * as THREE from 'three';
import M from './manken_olcu.js';
import { Surface, cloth, bodyDistance, reach, awayFromAxis, S, TAU } from './outfit.js';
import { castOut } from './outfit2.js';
import { patchOf } from './outfit3.js';
import { build } from './halk2.js';
import { coatShell } from './sirmali.js';

// İhram: iki dikişsiz beyaz havlu kumaş. izar: belden bileğe inen sargı etek; rida: sol omuzdan çapraz
// örtülen üst örtü (sağ omuz ve sağ kol açıkta), bir ucu sol omuzdan öne sarkar.
// manken_erkek.glb'nin üstüne oturur; konum ve ölçek mankenle aynı. Parçalar: izar, rida, ten (açıkta kalan gövde ve kollar; istenmezse silinir).

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const CX = 0, CZ = -0.03, SEG = 44, WAIST = 1.1, WHITE = 0xdcdad3;
const lerp = (a, b, t) => a + (b - a) * t;
const hull = (a, y) => reach(M.body, y, CX, CZ, Math.cos(a), Math.sin(a));

// Gövdenin a yönünde, y yüksekliğinde, mankenden offset kadar dışarıdaki yarıçapı (yanlarda kol köküne kadar)
function torsoRadius(a, y, offset) {
  const dx = Math.cos(a), dz = Math.sin(a), limit = 0.2 / Math.max(1e-3, Math.abs(dx));
  let hi = 0.02;
  while (hi < limit && bodyDistance(CX + dx * hi, y, CZ + dz * hi) < offset) hi += 0.004;
  let lo = Math.max(0.02, hi - 0.004);
  for (let i = 0; i < 10 && hi < limit; i++) {
    const m = (lo + hi) / 2;
    if (bodyDistance(CX + dx * m, y, CZ + dz * m) < offset) lo = m;
    else hi = m;
  }
  return Math.min(hi, limit);
}

export function createIhram() {
  const root = new THREE.Group();
  root.name = 'ihram';
  const angles = Array.from({ length: SEG }, (_, k) => (k / SEG) * TAU);
  const outward = awayFromAxis(CX, CZ);
  const ring = (s, f) => angles.map((a, k) => {
    const p = f(a, k);
    return s.point(p.x, p.y, p.z);
  });

  // ---------- ten: ihramın açıkta bıraktığı gövde, omuzlar ve üst kollar (gömleksiz mankende bu bölüm yoktur) ----------
  const skin = coatShell({ offset: 0.002, rows: [1.0, 1.05], flare: 0, sleeve: 0.052 });
  // Boyun dibi: gövdenin yaka halkasından mankenin boynuna doğru daralan kısa halka
  const neck = new Surface(), nr = [[skin.R, 0], [skin.R - 0.012, 0.02], [0.052, 0.045]].map(([r, h]) => skin.angles.map((a) => neck.point(Math.cos(a) * r, skin.neckline(Math.sin(a)) + h, skin.NZ + Math.sin(a) * r)));
  for (let j = 1; j < nr.length; j++) neck.strip(nr[j - 1], nr[j], true, (x, y, z) => [x, 0.6, z - skin.NZ]);
  const tenMat = new THREE.MeshStandardMaterial({ name: 'ten', color: 0xc48a66, roughness: 0.75, metalness: 0, side: THREE.DoubleSide });
  root.add(build('ten', [[skin.fabric, tenMat, null], [neck, tenMat, null]]));

  // ---------- izar: belde kıvrılıp sıkıştırılmış, bileğe kadar düz inen sargı ----------
  const izar = new Surface();
  // Kumaş kalçadan aşağı daralmadan düşer: her yönde, o yükseklikten yukarıdaki en geniş kesit kadar açık
  const HEM = 0.13, ROWS_Y = [1.14, 1.12, 1.085, 1.05, 0.98, 0.9, 0.8, 0.68, 0.55, 0.42, 0.3, 0.2, HEM, HEM - 0.004];
  const widest = angles.map(() => 0);
  let before = null;
  ROWS_Y.forEach((y, j) => {
    const row = ring(izar, (a, k) => {
      widest[k] = Math.max(widest[k], hull(a, Math.min(y, WAIST)), y < WAIST ? hull(a, y) : 0);
      const roll = j < 3 ? [0.014, 0.03, 0.022][j] : 0.016 + 0.03 * S(1.0, HEM, y); // belde kıvrım, aşağı doğru hafif açılma
      const folds = 0.012 * Math.max(0, Math.cos(7 * a + 0.5)) ** 2 * S(1.0, 0.5, y); // uzun dikey kıvrımlar
      // Sarılan kumaşın üstte kalan ucu: önde, sol bacağın üstünde düşey bir kenar çizgisi
      const over = 0.014 * S(Math.PI / 2 - 0.62, Math.PI / 2 - 0.56, a) * S(Math.PI / 2 + 1.9, Math.PI / 2 + 1.5, a);
      const r = widest[k] + roll + folds + over + (j === ROWS_Y.length - 1 ? -0.012 : 0);
      return v3(CX + Math.cos(a) * r, y, CZ + Math.sin(a) * r);
    });
    if (before) izar.strip(before, row, true, outward);
    before = row;
  });
  root.add(build('izar', [[izar, cloth('ihram_izar', WHITE), null]]));

  // ---------- rida: gövdeyi çapraz saran örtü ----------
  const rida = new Surface(), OFF = 0.03;
  // Üst kenar: sağ koltuk altından sol omuza yükselen çapraz çizgi; sol yanda kol kökünün altında kalır
  const top = (a) => {
    const c = Math.cos(a), plane = 1.3 + ((c * 0.16 + 0.16) / 0.32) * 0.22;
    return Math.min(plane, 1.355 + 0.22 * (1 - S(0.5, 0.92, c)));
  };
  const bottom = (a) => 0.93 + 0.1 * S(-0.9, 0.9, Math.cos(a)); // etek ucu sola doğru yükselir (kumaş sol kola toplanır)
  const R = 11;
  before = null;
  for (let j = 0; j <= R; j++) {
    const row = ring(rida, (a) => {
      const y = lerp(bottom(a), top(a), j / R), x0 = Math.cos(a) * 0.16;
      let r = y >= WAIST ? torsoRadius(a, y, OFF) : torsoRadius(a, WAIST, OFF) + Math.max(0, hull(a, y) - hull(a, WAIST)) + 0.012 * (WAIST - y) / 0.2;
      r += 0.007 * Math.max(0, Math.cos(46 * (y - 0.7 * x0))) ** 2; // çapraz kıvrımlar
      if (j === R) r += 0.007; // üst kenarda kıvrık kenar
      if (j === 0) r -= 0.006;
      return v3(CX + Math.cos(a) * r, y, CZ + Math.sin(a) * r);
    });
    if (before) rida.strip(before, row, true, outward);
    before = row;
  }
  // Sol omuzun üstünden geçen bölüm: göğüsten sırta, omzu örter
  const XS = [0.085, 0.115, 0.15, 0.185, 0.215, 0.24], PHI = 13;
  const over = XS.map((x, i) => Array.from({ length: PHI + 1 }, (_, k) => {
    const phi = lerp(0.1, 0.9, k / PHI) * Math.PI;
    const p = castOut(v3(x, 1.36, CZ), v3(0, Math.sin(phi), Math.cos(phi)), OFF + 0.004 + 0.006 * (i % 2));
    if (i === XS.length - 1) p.y -= 0.012; // kol tarafındaki kenar aşağı döner
    return p;
  }));
  patchOf(rida, over, (x, y, z) => [0.2, 1, z - CZ]);
  // Sol omuzdan öne sarkan uç: göğüsten kalçaya inen kıvrımlı kumaş
  const TX = [0.07, 0.105, 0.14, 0.175, 0.21, 0.24], tail = [];
  for (let y = 1.43; y > 0.84; y -= 0.06) {
    tail.push(TX.map((x, i) => {
      const xr = Math.min(x, 0.13), p = castOut(v3(xr, Math.max(y, WAIST), CZ), v3(0, 0, 1), OFF + 0.014);
      const sink = Math.max(0, x - 0.13) * 0.9;
      return v3(x + 0.03 * S(1.45, 0.8, y) * (i / 5 - 0.3), y, p.z - sink + 0.022 * (i % 2) * S(1.43, 1.2, y) + 0.015 * S(1.3, 0.85, y));
    }));
  }
  patchOf(rida, tail, () => [0.2, 0, 1]);
  root.add(build('rida', [[rida, cloth('ihram_rida', WHITE), null]]));
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = o.receiveShadow = true;
      o.material.side = THREE.DoubleSide;
    }
  });
  return root;
}
