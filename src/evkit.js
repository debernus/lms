import * as THREE from 'three';
import { canvasTexture } from './halk2.js';
import { Part } from './arapcami.js';

// Parçalı Osmanlı evi kiti (Safranbolu ve İstanbul ahşap evleri). Bütün parçalar 3 m'lik ızgaraya oturur:
// bir duvar paneli 3 m genişliğinde ve 3 m (bir kat) yüksekliğindedir. 1 birim = 1 metre, Y yukarı.
//
// KURALLAR
// - Duvar panelleri: orijin panelin alt ortasında, dış yüz z = 0'da ve +Z'ye bakar; kalınlık içe (-Z) doğrudur.
//   Paneli ızgara kenarının ortasına koyup 90°'lik adımlarla döndürün. Dar paneller 0,6 m'dir (çıkma yanları).
// - Köşe parçaları: orijin köşe noktasında; dış köşe +X +Z yönündedir.
// - Çıkma tabanı: üst katı 0,6 m dışarı taşırmak için; orijin alt katın duvar çizgisinde, kat döşemesi düzeyinde.
//   Üst kat panelleri 0,6 m dışarıya konur.
// - Cumba: panel yerine konur (3 m), 0,7 m dışarı taşar.
// - Çatı parçaları: orijin 3 × 3 m'lik hücrenin ortasında, duvar üstü düzeyinde. Kenar hücrelere cati_kenar
//   (saçak +Z'de), köşelere cati_kose (dış köşe +X +Z), iç hücrelere cati_tepe. Tek hücre derinliğindeki
//   evlerde cati_besik (mahya X boyunca) ve uçlarına cati_besik_uc (kapalı uç +X).

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const W = 3, H = 3, T = 0.25, HALF = W / 2;
const JET = 0.6, CUMBA = 0.7, OV = 0.9, SLOPE = 0.4; // çıkma, cumba taşması, saçak, çatı eğimi
const ALL = ['+x', '-x', '+z', '-z', '+y', '-y'], OUT = ['+x', '-x', '+z', '+y', '-y'];

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
// ---------- Malzemeler (bütün parçalar aynı malzemeleri paylaşır) ----------
let MATS = null;
function mats() {
  if (MATS) return MATS;
  const std = (name, o) => new THREE.MeshStandardMaterial({ name, roughness: 0.92, metalness: 0, ...o });
  const stone = canvasTexture('moloz_tas', 512, 512, (g) => {
    const rand = rng(31);
    g.fillStyle = '#6b655a';
    g.fillRect(0, 0, 512, 512);
    for (let row = 0; row < 9; row++) {
      let x = -rand() * 60;
      while (x < 512) {
        const w = 40 + rand() * 70, v = 150 + rand() * 60;
        g.fillStyle = `rgb(${v},${v - 8},${v - 26})`;
        g.beginPath();
        g.roundRect(x + 3, row * 57 + 3 + rand() * 4, w - 6, 50 - rand() * 6, 9);
        g.fill();
        x += w;
      }
    }
    g.filter = 'blur(10px)';
    for (let i = 0; i < 16; i++) {
      g.fillStyle = `rgba(50,44,34,${0.1 + rand() * 0.14})`;
      g.beginPath();
      g.ellipse(80 + rand() * 352, 80 + rand() * 352, 20 + rand() * 50, 20 + rand() * 40, 0, 0, 6.3);
      g.fill();
    }
    g.filter = 'none';
  });
  const plaster = (name, base, lath, seed) => canvasTexture(name, 256, 256, (g) => {
    const rand = rng(seed);
    g.fillStyle = base;
    g.fillRect(0, 0, 256, 256);
    if (lath) for (let x = 8; x < 256; x += 16) {
      g.fillStyle = `rgba(92,70,48,${0.5 + rand() * 0.3})`;
      g.fillRect(x + (rand() - 0.5) * 3, 0, 3, 256);
    }
    g.filter = 'blur(8px)';
    for (let i = 0; i < 14; i++) {
      g.fillStyle = `rgba(70,56,40,${0.06 + rand() * 0.1})`;
      g.beginPath();
      g.ellipse(50 + rand() * 156, 50 + rand() * 156, 14 + rand() * 30, 14 + rand() * 30, 0, 0, 6.3);
      g.fill();
    }
    g.filter = 'none';
  });
  const boards = canvasTexture('ahsap_kaplama', 256, 256, (g) => {
    const rand = rng(44);
    for (let row = 0; row < 8; row++) {
      const v = 70 + rand() * 30;
      g.fillStyle = `rgb(${v + 24},${v - 4},${v - 30})`;
      g.fillRect(0, row * 32, 256, 32);
      for (let i = 0; i < 14; i++) {
        g.fillStyle = `rgba(30,18,10,${0.1 + rand() * 0.2})`;
        g.fillRect(rand() * 256, row * 32 + rand() * 30, 20 + rand() * 80, 1.5);
      }
      g.fillStyle = 'rgba(20,12,8,0.75)';
      g.fillRect(0, row * 32 + 29, 256, 3);
    }
  });
  const tiles = canvasTexture('alaturka_kiremit', 256, 256, (g) => {
    const rand = rng(5);
    for (let row = 0; row < 6; row++) for (let k = 0; k < 10; k++) {
      const r = 132 + rand() * 50, gg = 74 + rand() * 30, b = 54 + rand() * 22;
      const grad = g.createLinearGradient(k * 25.6, 0, k * 25.6 + 25.6, 0);
      grad.addColorStop(0, `rgb(${r * 0.5},${gg * 0.5},${b * 0.5})`);
      grad.addColorStop(0.45, `rgb(${r},${gg},${b})`);
      grad.addColorStop(1, `rgb(${r * 0.6},${gg * 0.6},${b * 0.6})`);
      g.fillStyle = grad;
      g.fillRect(k * 25.6, row * 42.67, 25.6, 42.67);
      g.fillStyle = 'rgba(30,14,8,0.5)';
      g.fillRect(k * 25.6, row * 42.67 + 39, 25.6, 3.67);
    }
  });
  const glass = (name, bars) => canvasTexture(name, 128, 192, (g) => {
    const grad = g.createLinearGradient(0, 0, 128, 192);
    grad.addColorStop(0, '#3b4a55');
    grad.addColorStop(1, '#161c20');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 192);
    g.strokeStyle = '#4a3324';
    g.lineWidth = 7;
    g.strokeRect(64, 0, 0.01, 192);
    for (const y of [64, 128]) g.strokeRect(0, y, 128, 0.01);
    if (bars) {
      g.strokeStyle = '#1a1512';
      g.lineWidth = 4;
      for (let x = 16; x < 128; x += 24) g.strokeRect(x, 96, 0.01, 96);
      g.strokeRect(0, 100, 128, 0.01);
    }
  });
  const door = canvasTexture('ahsap_kapi', 128, 192, (g) => {
    const rand = rng(8);
    g.fillStyle = '#5a3d28';
    g.fillRect(0, 0, 128, 192);
    for (let x = 0; x < 128; x += 16) {
      g.fillStyle = `rgba(24,14,8,${0.2 + rand() * 0.3})`;
      g.fillRect(x, 0, 2, 192);
    }
    g.strokeStyle = '#24160e';
    g.lineWidth = 5;
    g.strokeRect(62, 0, 4, 192);
    for (const y of [30, 150]) g.strokeRect(0, y, 128, 0.01);
    g.fillStyle = '#17120e';
    for (const x of [52, 76]) {
      g.beginPath();
      g.arc(x, 100, 5, 0, 6.3);
      g.fill();
    }
  });
  const lattice = canvasTexture('kafes', 64, 64, (g) => {
    g.fillStyle = '#6a4a30';
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#1c1612';
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      g.save();
      g.translate(x * 16 + 8, y * 16 + 8);
      g.rotate(Math.PI / 4);
      g.fillRect(-4, -4, 8, 8);
      g.restore();
    }
  });
  MATS = {
    tas: std('moloz_tas', { map: stone }),
    kesme: std('kesme_tas', { map: plaster('kesme_tas', '#b79f74', false, 3) }),
    dolgu: std('dolgu_siva', { map: plaster('dolgu_siva', '#d9cdb0', true, 6) }),
    siva: std('asi_siva', { map: plaster('asi_siva', '#c8a865', false, 9) }),
    kaplama: std('ahsap_kaplama', { map: boards }),
    kereste: std('kereste', { color: 0x4a3324 }),
    kiremit: std('alaturka_kiremit', { map: tiles }),
    cam: std('pencere_cam', { map: glass('pencere_cam', false), roughness: 0.5 }),
    cam_demir: std('pencere_parmaklikli', { map: glass('pencere_parmaklikli', true), roughness: 0.5 }),
    kapi: std('ahsap_kapi', { map: door }),
    kafes: std('kafes', { map: lattice }),
    doseme: std('doseme_tahtasi', { map: boards }),
    is: std('karanlik', { color: 0x14110e }),
  };
  return MATS;
}

// ---------- Ortak yardımcılar ----------
const SKIN = { tas: ['tas', 2], dolgu: ['dolgu', 1.5], kaplama: ['kaplama', 1.2], siva: ['siva', 2] };
// Dış yüzde, lift kadar önde dikdörtgen kereste (yatay/dikey)
const timber = (p, x0, x1, y0, y1, lift = 0.03, mat = 'kereste') => p.box(mat, x0, x1, y0, y1, 0, lift, OUT, 1, 1);
// Çapraz kereste: iki nokta arasında yassı çubuk
function brace(p, x0, y0, x1, y1, w = 0.09, lift = 0.022) {
  const d = new THREE.Vector2(x1 - x0, y1 - y0).normalize(), n = new THREE.Vector2(-d.y, d.x).multiplyScalar(w / 2);
  const c = [[x0 - n.x, y0 - n.y], [x1 - n.x, y1 - n.y], [x1 + n.x, y1 + n.y], [x0 + n.x, y0 + n.y]];
  const flat = [[0, 0], [1, 0], [1, 1], [0, 1]];
  p.quad('kereste', c.map(([x, y]) => v3(x, y, lift)), flat, v3(0, 0, 1));
  for (let k = 0; k < 4; k++) {
    const a = c[k], b = c[(k + 1) % 4];
    p.quad('kereste', [v3(a[0], a[1], lift - 0.022), v3(b[0], b[1], lift - 0.022), v3(b[0], b[1], lift), v3(a[0], a[1], lift)], flat, v3(b[1] - a[1], a[0] - b[0], 0));
  }
}
// Pencere: cam yüzeyi ve çevresinde çerçeve. o: { bars, shutters, head (üst silme), z (duvar yüzü) }
function windowAt(p, cx, y0, w, h, o = {}) {
  const z = o.z ?? 0, f = 0.07, d = 0.06, x0 = cx - w / 2, x1 = cx + w / 2;
  p.quad(o.bars ? 'cam_demir' : o.lattice ? 'kafes' : 'cam', [v3(x0, y0, z + 0.012), v3(x1, y0, z + 0.012), v3(x1, y0 + h, z + 0.012), v3(x0, y0 + h, z + 0.012)],
    o.lattice ? [[0, 0], [w * 3, 0], [w * 3, h * 3], [0, h * 3]] : [[0, 0], [1, 0], [1, 1], [0, 1]], v3(0, 0, 1));
  const frame = (a, b, c, e) => p.box('kereste', a, b, c, e, z, z + d, OUT, 1, 1);
  frame(x0 - f, x0, y0 - f, y0 + h + f);
  frame(x1, x1 + f, y0 - f, y0 + h + f);
  frame(x0, x1, y0 + h, y0 + h + f);
  frame(x0 - f - 0.03, x1 + f + 0.03, y0 - f - 0.03, y0, z, z + d + 0.03);
  p.box('kereste', x0 - f - 0.03, x1 + f + 0.03, y0 - f - 0.03, y0, z, z + d + 0.04, OUT, 1, 1); // denizlik
  if (o.head) p.box('kereste', x0 - f - 0.06, x1 + f + 0.06, y0 + h + f, y0 + h + f + 0.07, z, z + d + 0.07, OUT, 1, 1);
  if (o.shutters) for (const s of [-1, 1]) {
    const a = s < 0 ? x0 - f - w / 2 : x1 + f, b = a + w / 2;
    p.box('kaplama', a, b, y0, y0 + h, z, z + 0.035, OUT, 0.3, 0.3);
  }
}
function doorAt(p, cx, w, h, z = 0) {
  const x0 = cx - w / 2, x1 = cx + w / 2, f = 0.1, d = 0.07;
  p.quad('kapi', [v3(x0, 0, z + 0.012), v3(x1, 0, z + 0.012), v3(x1, h, z + 0.012), v3(x0, h, z + 0.012)], [[0, 0], [1, 0], [1, 1], [0, 1]], v3(0, 0, 1));
  p.box('kereste', x0 - f, x0, 0, h + f, z, z + d, OUT, 1, 1);
  p.box('kereste', x1, x1 + f, 0, h + f, z, z + d, OUT, 1, 1);
  p.box('kereste', x0, x1, h, h + f, z, z + d, OUT, 1, 1);
}
// Düz duvar gövdesi
function slab(p, skin, width = W) {
  const [mat, us] = SKIN[skin];
  p.box(mat, -width / 2, width / 2, 0, H, -T, 0, ALL, us, us);
}
// Ahşap dolgu çatkısı: taban ve başlık kirişleri, kenar dikmeleri
function frameDolgu(p, width = W) {
  const hw = width / 2;
  timber(p, -hw, hw, 0, 0.14, 0.04);
  timber(p, -hw, hw, H - 0.14, H, 0.04);
  timber(p, -hw, -hw + 0.07, 0.14, H - 0.14);
  timber(p, hw - 0.07, hw, 0.14, H - 0.14);
}
// Ahşap kaplama çatkısı: köşe pervazları, alt ve üst silme
function frameKaplama(p, width = W) {
  const hw = width / 2;
  timber(p, -hw, hw, 0, 0.12, 0.05);
  timber(p, -hw, hw, H - 0.2, H, 0.07);
  timber(p, -hw, -hw + 0.06, 0.12, H - 0.2, 0.035);
  timber(p, hw - 0.06, hw, 0.12, H - 0.2, 0.035);
}

// ---------- Parçalar ----------
const PARTS = {
  // --- Taş zemin kat ---
  tas_duvar: (p) => slab(p, 'tas'),
  tas_duvar_pencere: (p) => {
    slab(p, 'tas');
    p.box('kesme', -0.62, 0.62, 1.05, 2.4, 0, 0.03, OUT, 1.5, 1.5);
    windowAt(p, 0, 1.2, 0.9, 1.05, { bars: true, z: 0.03 });
  },
  tas_duvar_kapi: (p) => {
    slab(p, 'tas');
    p.box('kesme', -0.95, 0.95, 0, 2.5, 0, 0.04, OUT, 1.5, 1.5);
    doorAt(p, 0, 1.4, 2.15, 0.04);
  },
  // Kemerli açıklık (dükkân, hayat): gerçek delik
  tas_duvar_kemer: (p) => {
    const A = 1.05, S = 1.45, N = 10, us = 2;
    const arc = Array.from({ length: N + 1 }, (_, i) => {
      const t = Math.PI - (i / N) * Math.PI;
      return [A * Math.cos(t), S + A * Math.sin(t)];
    });
    for (const [z, n] of [[0, 1], [-T, -1]]) {
      const q = (pts) => p.quad('tas', pts.map(([x, y]) => v3(x, y, z)), pts.map(([x, y]) => [x / us, y / us]), v3(0, 0, n));
      q([[-HALF, 0], [-A, 0], [-A, H], [-HALF, H]]);
      q([[A, 0], [HALF, 0], [HALF, H], [A, H]]);
      for (let i = 0; i < N; i++) q([arc[i], arc[i + 1], [arc[i + 1][0], H], [arc[i][0], H]]);
    }
    p.box('tas', -HALF, HALF, 0, H, -T, 0, ['+x', '-x', '+y', '-y'], us, us);
    // Kemerin iç yüzü ve kesme taş kemer kuşağı
    const path = [[-A, 0], ...arc, [A, 0]], R = 0.22, flat = [[0, 0], [1, 0], [1, 1], [0, 1]];
    for (let i = 0; i + 1 < path.length; i++) {
      const [x0, y0] = path[i], [x1, y1] = path[i + 1], mx = (x0 + x1) / 2, my = Math.max(0, (y0 + y1) / 2 - S);
      const out = v3(mx, my, 0).normalize(), grow = ([x, y]) => (y <= S ? [x + Math.sign(x) * R, y] : [x * (1 + R / A), S + (y - S) * (1 + R / A)]);
      p.quad('kesme', [v3(x0, y0, -T), v3(x1, y1, -T), v3(x1, y1, 0.03), v3(x0, y0, 0.03)], flat, out.clone().negate());
      const [gx0, gy0] = grow(path[i]), [gx1, gy1] = grow(path[i + 1]);
      p.quad('kesme', [v3(x0, y0, 0.03), v3(x1, y1, 0.03), v3(gx1, gy1, 0.03), v3(gx0, gy0, 0.03)], flat, v3(0, 0, 1));
      p.quad('kesme', [v3(gx0, gy0, 0), v3(gx1, gy1, 0), v3(gx1, gy1, 0.03), v3(gx0, gy0, 0.03)], flat, out);
    }
  },
  tas_kose: (p) => p.box('kesme', -0.42, 0.06, 0, H, -0.42, 0.06, ['+x', '-x', '+z', '-z', '+y'], 1.2, 0.6),
  // --- Ahşap dolgu (Safranbolu) ---
  dolgu_duvar: (p) => {
    slab(p, 'dolgu');
    frameDolgu(p);
    timber(p, -0.05, 0.05, 0.14, H - 0.14);
    brace(p, -HALF + 0.07, 0.2, -0.08, H - 0.2);
    brace(p, HALF - 0.07, 0.2, 0.08, H - 0.2);
  },
  dolgu_duvar_pencere: (p) => {
    slab(p, 'dolgu');
    frameDolgu(p);
    timber(p, -HALF + 0.07, HALF - 0.07, 0.9, 0.99);
    brace(p, -HALF + 0.1, 0.16, -0.62, 0.88);
    brace(p, HALF - 0.1, 0.16, 0.62, 0.88);
    timber(p, -0.62, -0.53, 0.14, H - 0.14);
    timber(p, 0.53, 0.62, 0.14, H - 0.14);
    windowAt(p, 0, 1.08, 0.92, 1.35);
  },
  dolgu_duvar_2pencere: (p) => {
    slab(p, 'dolgu');
    frameDolgu(p);
    timber(p, -HALF + 0.07, HALF - 0.07, 0.9, 0.99);
    timber(p, -0.045, 0.045, 0.14, H - 0.14);
    brace(p, -HALF + 0.1, 0.16, -0.1, 0.88);
    brace(p, HALF - 0.1, 0.16, 0.1, 0.88);
    for (const x of [-0.75, 0.75]) windowAt(p, x, 1.08, 0.74, 1.3);
  },
  dolgu_duvar_dar: (p) => {
    slab(p, 'dolgu', JET);
    frameDolgu(p, JET);
    brace(p, -JET / 2 + 0.08, 0.2, JET / 2 - 0.08, H - 0.2, 0.07);
  },
  // --- Ahşap kaplama (İstanbul) ---
  ahsap_duvar: (p) => {
    slab(p, 'kaplama');
    frameKaplama(p);
  },
  ahsap_duvar_pencere: (p) => {
    slab(p, 'kaplama');
    frameKaplama(p);
    windowAt(p, 0, 0.75, 0.86, 1.75, { head: true });
  },
  ahsap_duvar_2pencere: (p) => {
    slab(p, 'kaplama');
    frameKaplama(p);
    for (const x of [-0.72, 0.72]) windowAt(p, x, 0.75, 0.74, 1.75, { head: true });
  },
  ahsap_duvar_kepenkli: (p) => {
    slab(p, 'kaplama');
    frameKaplama(p);
    windowAt(p, 0, 0.8, 0.9, 1.6, { head: true, shutters: true });
  },
  ahsap_duvar_kafesli: (p) => {
    slab(p, 'kaplama');
    frameKaplama(p);
    for (const x of [-0.72, 0.72]) windowAt(p, x, 0.75, 0.74, 1.75, { head: true, lattice: true });
  },
  ahsap_duvar_dar: (p) => {
    slab(p, 'kaplama', JET);
    frameKaplama(p, JET);
  },
  // --- Sıvalı zemin kat ---
  siva_duvar: (p) => {
    slab(p, 'siva');
    p.box('kesme', -HALF, HALF, 0, 0.45, 0, 0.04, OUT, 1.5, 1.5);
  },
  siva_duvar_pencere: (p) => {
    slab(p, 'siva');
    p.box('kesme', -HALF, HALF, 0, 0.45, 0, 0.04, OUT, 1.5, 1.5);
    windowAt(p, 0, 1.0, 0.86, 1.5, { bars: true, head: true });
  },
  siva_duvar_kapi: (p) => {
    slab(p, 'siva');
    for (const s of [-1, 1]) p.box('kesme', s < 0 ? -HALF : 0.82, s < 0 ? -0.82 : HALF, 0, 0.45, 0, 0.04, OUT, 1.5, 1.5);
    doorAt(p, 0, 1.3, 2.3);
    p.box('kereste', -0.9, 0.9, 2.45, 2.55, 0, 0.16, OUT, 1, 1);
  },
  // --- Köşe, kuşak, döşeme ---
  kose_diregi: (p) => p.box('kereste', -0.16, 0.05, 0, H, -0.16, 0.05, ['+x', '-x', '+z', '-z', '+y'], 1, 1),
  kat_kusagi: (p) => {
    p.box('kereste', -HALF, HALF, -0.12, 0.1, 0, 0.07, OUT, 1, 1);
    for (let x = -1.35; x < 1.4; x += 0.3) p.box('kereste', x - 0.05, x + 0.05, -0.24, -0.12, 0, 0.13, ['+x', '-x', '+z', '-y'], 1, 1);
  },
  doseme: (p) => p.box('doseme', -HALF, HALF, -0.1, 0, -HALF, HALF, ALL, 1.2, 1.2),
  // --- Çıkma (üst katı 0,6 m taşırır) ---
  cikma_tabani: (p) => {
    p.box('kereste', -HALF, HALF, -0.16, 0, 0, JET, ALL, 1, 1);
    p.box('kereste', -HALF, HALF, -0.26, -0.16, JET - 0.12, JET + 0.02, OUT, 1, 1);
    for (const x of [-1.3, -0.43, 0.43, 1.3]) {
      // Kiriş ucu ve eli böğründe (eğik destek)
      p.box('kereste', x - 0.06, x + 0.06, -0.3, -0.16, 0, JET - 0.12, ['+x', '-x', '-y'], 1, 1);
      const a = [0.02, -1.0], b = [JET - 0.14, -0.3], w = 0.05, flat = [[0, 0], [1, 0], [1, 1], [0, 1]];
      const pt = (q, dx, dy) => v3(x + dx, q[1] + dy, q[0]);
      p.quad('kereste', [pt(a, -w, 0), pt(a, w, 0), pt(b, w, 0), pt(b, -w, 0)], flat, v3(0, -1, 1));
      p.quad('kereste', [pt(a, -w, 0.12), pt(a, w, 0.12), pt(b, w, 0.12), pt(b, -w, 0.12)], flat, v3(0, 1, -1));
      for (const s of [-1, 1]) p.quad('kereste', [pt(a, s * w, 0), pt(a, s * w, 0.12), pt(b, s * w, 0.12), pt(b, s * w, 0)], flat, v3(s, 0, 0));
    }
  },
  // --- Cumba: 3 m'lik panel yerine konur, 0,7 m taşar ---
  cumba_ahsap: (p) => cumba(p, 'kaplama'),
  cumba_dolgu: (p) => cumba(p, 'dolgu'),
  cumba_catisi: (p) => {
    const hw = HALF + 0.12, d = CUMBA + 0.3, top = 0.5;
    const pts = [v3(-hw, 0, d), v3(hw, 0, d), v3(hw - 0.25, top, 0), v3(-hw + 0.25, top, 0)];
    p.quad('kiremit', pts, [[-hw / 2, 0], [hw / 2, 0], [(hw - 0.25) / 2, 0.55], [(-hw + 0.25) / 2, 0.55]], v3(0, 1, 1));
    for (const s of [-1, 1]) p.tri('kiremit', [v3(s * hw, 0, d), v3(s * hw, 0, 0), v3(s * (hw - 0.25), top, 0)], [[0, 0], [0.5, 0], [0.4, 0.3]], v3(s, 0.5, 0));
    p.box('kereste', -hw, hw, -0.1, 0, 0, d, ['+x', '-x', '+z', '-y'], 1, 1);
  },
  // --- Çatı ---
  cati_kenar: (p) => {
    const e = HALF + OV, ye = -OV * SLOPE, top = W * SLOPE, len = Math.hypot(W + OV, top - ye) / 2;
    p.quad('kiremit', [v3(-HALF, ye, e), v3(HALF, ye, e), v3(HALF, top, -HALF), v3(-HALF, top, -HALF)], [[-0.75, 0], [0.75, 0], [0.75, len], [-0.75, len]], v3(0, 1, 0.4));
    p.box('kereste', -HALF, HALF, ye - 0.12, ye, HALF, e, ['+z', '-y'], 1, 1);
  },
  cati_kose: (p) => {
    const e = HALF + OV, ye = -OV * SLOPE, top = W * SLOPE, len = Math.hypot(W + OV, top - ye) / 2, apex = v3(-HALF, top, -HALF), corner = v3(e, ye, e);
    p.tri('kiremit', [v3(-HALF, ye, e), corner, apex], [[-0.75, 0], [1.2, 0], [-0.75, len]], v3(0, 1, 0.4));
    p.tri('kiremit', [corner, v3(e, ye, -HALF), apex], [[-1.2, 0], [0.75, 0], [0.75, len]], v3(0.4, 1, 0));
    p.box('kereste', -HALF, e, ye - 0.12, ye, HALF, e, ['+z', '+x', '-y'], 1, 1);
    p.box('kereste', HALF, e, ye - 0.12, ye, -HALF, HALF, ['+x', '-y'], 1, 1);
  },
  cati_tepe: (p) => p.box('kiremit', -HALF, HALF, W * SLOPE - 0.02, W * SLOPE, -HALF, HALF, ['+y'], 2, 2),
  cati_besik: (p) => {
    const e = HALF + OV, ye = -OV * SLOPE, top = HALF * SLOPE, len = Math.hypot(HALF + OV, top - ye) / 2;
    for (const s of [1, -1]) {
      p.quad('kiremit', [v3(-HALF, ye, s * e), v3(HALF, ye, s * e), v3(HALF, top, 0), v3(-HALF, top, 0)], [[-0.75, 0], [0.75, 0], [0.75, len], [-0.75, len]], v3(0, 1, s * 0.4));
      p.box('kereste', -HALF, HALF, ye - 0.12, ye, Math.min(s * HALF, s * e), Math.max(s * HALF, s * e), [s > 0 ? '+z' : '-z', '-y'], 1, 1);
    }
  },
  cati_besik_uc: (p) => {
    const e = HALF + OV, ye = -OV * SLOPE, top = HALF * SLOPE, len = Math.hypot(HALF + OV, top - ye) / 2, apex = v3(0, top, 0);
    for (const s of [1, -1]) {
      p.quad('kiremit', [v3(-HALF, ye, s * e), v3(e, ye, s * e), apex, v3(-HALF, top, 0)], [[-0.75, 0], [1.2, 0], [0, len], [-0.75, len]], v3(0, 1, s * 0.4));
      p.box('kereste', -HALF, e, ye - 0.12, ye, Math.min(s * HALF, s * e), Math.max(s * HALF, s * e), [s > 0 ? '+z' : '-z', '-y'], 1, 1);
    }
    p.tri('kiremit', [v3(e, ye, e), v3(e, ye, -e), apex], [[-1.2, 0], [1.2, 0], [0, len]], v3(0.4, 1, 0));
    p.box('kereste', HALF, e, ye - 0.12, ye, -e, e, ['+x', '-y'], 1, 1);
  },
  // --- Ekler ---
  baca: (p) => {
    p.box('siva', -0.3, 0.3, 0, 1.5, -0.3, 0.3, ['+x', '-x', '+z', '-z'], 2, 2);
    p.box('kesme', -0.36, 0.36, 1.5, 1.62, -0.36, 0.36, ALL, 1, 1);
    p.box('is', -0.2, 0.2, 1.62, 1.63, -0.2, 0.2, ['+y'], 1, 1);
  },
  tas_merdiven: (p) => {
    for (let k = 0; k < 3; k++) p.box('kesme', -0.9, 0.9, 0, 0.18 * (3 - k), k * 0.3, (k + 1) * 0.3, ['+x', '-x', '+z', '+y'], 1.5, 1.5);
  },
};
function cumba(p, skin) {
  const [mat, us] = SKIN[skin], d = CUMBA, wood = skin === 'kaplama';
  // Kutu: ön ve iki yan; tabanı ve altındaki eğik destekler
  p.box(mat, -HALF, HALF, 0, H, 0, d, ['+x', '-x', '+z', '+y'], us, us);
  p.box('kereste', -HALF - 0.03, HALF + 0.03, -0.16, 0.08, 0, d + 0.03, ['+x', '-x', '+z', '-y'], 1, 1);
  p.box('kereste', -HALF - 0.03, HALF + 0.03, H - 0.16, H, 0, d + 0.03, ['+x', '-x', '+z'], 1, 1);
  for (const s of [-1, 1]) p.box('kereste', s < 0 ? -HALF - 0.02 : HALF - 0.08, s < 0 ? -HALF + 0.08 : HALF + 0.02, 0.08, H - 0.16, d - 0.08, d + 0.02, ['+x', '-x', '+z'], 1, 1);
  const flat = [[0, 0], [1, 0], [1, 1], [0, 1]];
  for (const x of [-1.25, 0, 1.25]) {
    const a = [0.02, -1.05], b = [d - 0.06, -0.16], w = 0.055, pt = (q, dx, dy) => v3(x + dx, q[1] + dy, q[0]);
    p.quad('kereste', [pt(a, -w, 0), pt(a, w, 0), pt(b, w, 0), pt(b, -w, 0)], flat, v3(0, -1, 1));
    p.quad('kereste', [pt(a, -w, 0.13), pt(a, w, 0.13), pt(b, w, 0.13), pt(b, -w, 0.13)], flat, v3(0, 1, -1));
    for (const s of [-1, 1]) p.quad('kereste', [pt(a, s * w, 0), pt(a, s * w, 0.13), pt(b, s * w, 0.13), pt(b, s * w, 0)], flat, v3(s, 0, 0));
  }
  for (const x of [-0.85, 0, 0.85]) windowAt(p, x, 0.8, 0.6, 1.6, { z: d, head: wood });
  // Yan pencereler: cam yüzeyi ve basit çerçeve
  for (const s of [-1, 1]) {
    const x = s * (HALF + 0.012), z0 = 0.14, z1 = d - 0.14;
    p.quad('cam', [v3(x, 0.8, z0), v3(x, 0.8, z1), v3(x, 2.4, z1), v3(x, 2.4, z0)], flat, v3(s, 0, 0));
    const bx = (a, b, c, e, z2, z3) => p.box('kereste', Math.min(s * HALF, s * (HALF + 0.05)), Math.max(s * HALF, s * (HALF + 0.05)), a, b, z2, z3, [s > 0 ? '+x' : '-x', '+z', '-z', '+y', '-y'], 1, 1);
    bx(0.73, 0.8, 0, 0, z0 - 0.07, z1 + 0.07);
    bx(2.4, 2.47, 0, 0, z0 - 0.07, z1 + 0.07);
    bx(0.8, 2.4, 0, 0, z0 - 0.07, z0);
    bx(0.8, 2.4, 0, 0, z1, z1 + 0.07);
  }
  if (!wood) {
    brace(p, -HALF + 0.1, 0.12, -1.2, 0.72, 0.07, d + 0.022);
  }
}

export const EV_PARCALARI = Object.keys(PARTS);
const cache = new Map();
export function createEvParca(name) {
  if (!cache.has(name)) {
    const part = new Part(name);
    PARTS[name](part);
    cache.set(name, part.mesh(mats()));
  }
  const src = cache.get(name), mesh = new THREE.Mesh(src.geometry, src.material);
  mesh.name = name;
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
// Kit: bütün parçalar yan yana, her biri kendi düğümünde ve kendi orijininde
export function createEvKiti() {
  const root = new THREE.Group();
  root.name = 'ev_kiti';
  EV_PARCALARI.forEach((name, i) => {
    const m = createEvParca(name);
    m.position.set((i % 6 - 2.5) * 5, name.startsWith('cati') || name === 'cumba_catisi' ? 0.5 : name === 'cikma_tabani' || name === 'kat_kusagi' ? 1.2 : name.startsWith('cumba') ? 1.2 : 0, (Math.floor(i / 6) - 2) * 6);
    root.add(m);
  });
  return root;
}

// ---------- Örnek evler: kitin parçalarıyla kurulmuş ----------
// spec: { nx, nz, floors: [{ wall(side, k) → parça adı | null, jetty }], corner, roof }
function house(name, spec) {
  const g = new THREE.Group();
  g.name = name;
  const put = (part, x, y, z, rot = 0) => {
    const m = createEvParca(part);
    m.position.set(x, y, z);
    m.rotation.y = rot;
    g.add(m);
    return m;
  };
  const { nx, nz } = spec, X = (nx * W) / 2, Z = (nz * W) / 2;
  spec.floors.forEach((floor, f) => {
    const y = f * H, j = floor.jetty ? JET : 0; // çıkma yalnız ön cephede (+Z)
    const sides = [
      { n: nx, at: (k) => [-X + W * (k + 0.5), Z + j], rot: 0 },
      { n: nz, at: (k) => [X, Z - W * (k + 0.5)], rot: Math.PI / 2 },
      { n: nx, at: (k) => [X - W * (k + 0.5), -Z], rot: Math.PI },
      { n: nz, at: (k) => [-X, -Z + W * (k + 0.5)], rot: -Math.PI / 2 },
    ];
    sides.forEach((s, si) => {
      for (let k = 0; k < s.n; k++) {
        const part = floor.wall(si, k), [x, z] = s.at(k);
        if (part) put(part, x, y, z, s.rot);
        if (f > 0 && spec.band !== false && !(si === 0 && j)) put('kat_kusagi', x, y, z, s.rot);
        if (si === 0 && j && !spec.floors[f - 1]?.jetty) put('cikma_tabani', x, y, Z, 0);
      }
    });
    if (j) for (const s of [-1, 1]) put(floor.narrow, s * X, y, Z + JET / 2, s * Math.PI / 2);
    // Köşeler
    const zf = Z + j;
    [[X, zf, 0], [X, -Z, Math.PI / 2], [-X, -Z, Math.PI], [-X, zf, -Math.PI / 2]].forEach(([x, z, rot]) => put(floor.corner, x, y, z, rot));
    for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) put('doseme', -X + W * (i + 0.5), y, -Z + W * (k + 0.5));
  });
  // Çatı
  const top = spec.floors.length * H;
  if (nz === 1) {
    for (let i = 0; i < nx; i++) {
      const x = -X + W * (i + 0.5);
      if (nx === 1) put('cati_besik', x, top, 0);
      else if (i === 0) put('cati_besik_uc', x, top, 0, Math.PI);
      else if (i === nx - 1) put('cati_besik_uc', x, top, 0);
      else put('cati_besik', x, top, 0);
    }
  } else for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
    const x = -X + W * (i + 0.5), z = -Z + W * (k + 0.5), left = i === 0, right = i === nx - 1, back = k === 0, front = k === nz - 1;
    if (front && right) put('cati_kose', x, top, z, 0);
    else if (back && right) put('cati_kose', x, top, z, Math.PI / 2);
    else if (back && left) put('cati_kose', x, top, z, Math.PI);
    else if (front && left) put('cati_kose', x, top, z, -Math.PI / 2);
    else if (front) put('cati_kenar', x, top, z, 0);
    else if (right) put('cati_kenar', x, top, z, Math.PI / 2);
    else if (back) put('cati_kenar', x, top, z, Math.PI);
    else if (left) put('cati_kenar', x, top, z, -Math.PI / 2);
    else put('cati_tepe', x, top, z);
  }
  (spec.extras ?? []).forEach(([part, x, y, z, rot]) => put(part, x, y, z, rot));
  return g;
}
export function createOrnekEvler() {
  const root = new THREE.Group();
  root.name = 'ornek_evler';
  // 1) Safranbolu konağı: taş zemin (kemerli), iki ahşap dolgu kat, önde çıkma
  const konak = house('ornek_safranbolu_konagi', {
    nx: 3, nz: 2,
    floors: [
      { corner: 'tas_kose', wall: (s, k) => (s === 0 ? (k === 1 ? 'tas_duvar_kapi' : 'tas_duvar_kemer') : s === 2 ? 'tas_duvar' : k === 0 ? 'tas_duvar_pencere' : 'tas_duvar') },
      { corner: 'kose_diregi', jetty: true, narrow: 'dolgu_duvar_dar', wall: (s, k) => (s === 2 ? (k === 1 ? 'dolgu_duvar_pencere' : 'dolgu_duvar') : s === 0 ? 'dolgu_duvar_2pencere' : 'dolgu_duvar_pencere') },
      { corner: 'kose_diregi', jetty: true, narrow: 'dolgu_duvar_dar', wall: (s, k) => (s === 0 ? (k === 1 ? 'dolgu_duvar_pencere' : 'dolgu_duvar_2pencere') : s === 2 ? 'dolgu_duvar' : 'dolgu_duvar_2pencere') },
    ],
    extras: [['baca', 1.5, 3 * H + 1.0, -1.2, 0], ['tas_merdiven', 0, 0, 3 + 0.0, 0]],
  });
  konak.position.set(-12, 0, 0);
  // 2) İstanbul ahşap evi: sıvalı zemin, ahşap kaplama üst kat, ortada cumba
  const ahsap = house('ornek_istanbul_ahsap_evi', {
    nx: 3, nz: 2,
    floors: [
      { corner: 'tas_kose', wall: (s, k) => (s === 0 && k === 1 ? 'siva_duvar_kapi' : s === 2 ? 'siva_duvar' : 'siva_duvar_pencere') },
      { corner: 'kose_diregi', wall: (s, k) => (s === 0 ? (k === 1 ? 'cumba_ahsap' : 'ahsap_duvar_2pencere') : s === 2 ? 'ahsap_duvar' : k === 0 ? 'ahsap_duvar_kepenkli' : 'ahsap_duvar_pencere') },
      { corner: 'kose_diregi', wall: (s, k) => (s === 0 ? (k === 1 ? 'cumba_ahsap' : 'ahsap_duvar_kafesli') : s === 2 ? 'ahsap_duvar' : 'ahsap_duvar_pencere') },
    ],
  });
  ahsap.position.set(0, 0, 0);
  // 3) Dar sıra ev: tek hücre derinliğinde, beşik çatılı
  const sira = house('ornek_sira_ev', {
    nx: 2, nz: 1,
    floors: [
      { corner: 'tas_kose', wall: (s, k) => (s === 0 ? (k === 0 ? 'tas_duvar_kapi' : 'tas_duvar_pencere') : 'tas_duvar') },
      { corner: 'kose_diregi', jetty: true, narrow: 'ahsap_duvar_dar', wall: (s, k) => (s === 0 ? (k === 0 ? 'ahsap_duvar_kepenkli' : 'ahsap_duvar_2pencere') : s === 2 ? 'ahsap_duvar' : 'ahsap_duvar_pencere') },
    ],
    extras: [['baca', -1.5, 2 * H + 0.3, -0.5, 0]],
  });
  sira.position.set(11, 0, 0);
  root.add(konak, ahsap, sira);
  return root;
}
