import * as THREE from 'three';
import * as K from './kit_ortak.js';
const { V, ALL, OUT, SIDES, PAINT, TAU, box, lath, quad, tri, lathe } = K;

// Osmanlı sebili (tek parça) ve iki yanına dizilen kesme taş duvar kiti.
// Sebil: sekizgen, düz yüzleri eksenlere bakar; düzden düze 6,0 m (iki modül), orijin tabanın ortası.
//   Öne ve yanlara bakan beş yüzünde mermer sütunlar arasında tunç şebekeli pencereler ve kemer aynaları;
//   arka üç yüzü sağır (binaya yaslanır), arkada kapı. Geniş ahşap saçak, yosunlu kiremit külah, alem.
// Duvar kiti: modül 3,0 m; parça 3,0 m geniş, 3,0 m yüksek; orijin alt kenarın ortası, dış yüz +Z,
//   gövde Z -0,4 … 0. Parçalar: tas_duvar, _pencere, _2pencere, _kemerli, _kapi, _yikik, _dar, tas_kose, tas_sacak.

export const marble = (g, w, h, rand) => {
  g.fillStyle = '#d6d2c6';
  g.fillRect(0, 0, w, h);
  g.filter = 'blur(6px)';
  for (let i = 0; i < 40; i++) {
    const x = rand() * w, y = rand() * h, len = 30 + rand() * 140, grad = g.createLinearGradient(0, y, 0, y + len);
    grad.addColorStop(0, `rgba(70,64,50,${0.1 + rand() * 0.2})`);
    grad.addColorStop(1, 'rgba(70,64,50,0)');
    g.fillStyle = grad;
    g.fillRect(x, y, 4 + rand() * 18, len);
  }
  for (let i = 0; i < 16; i++) {
    g.fillStyle = `rgba(90,100,70,${0.06 + rand() * 0.1})`;
    g.beginPath();
    g.ellipse(rand() * w, rand() * h, 10 + rand() * 30, 8 + rand() * 20, 0, 0, TAU);
    g.fill();
  }
  g.filter = 'none';
  for (let i = 0; i < 60; i++) {
    g.fillStyle = `rgba(40,36,28,${0.1 + rand() * 0.2})`;
    g.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 4 + rand() * 20);
  }
};
export const ashlar = (g, w, h, rand) => {
  g.fillStyle = '#5e594e';
  g.fillRect(0, 0, w, h);
  for (let r = 0; r < 6; r++) {
    let x = -rand() * 40;
    while (x < w) {
      const bw = 50 + rand() * 60, v = 138 + rand() * 46;
      g.fillStyle = `rgb(${v},${v - 6},${v - 20})`;
      g.fillRect(x + 1.5, r * 42.67 + 1.5, bw - 3, 39.67);
      x += bw;
    }
  }
  g.filter = 'blur(9px)';
  for (let i = 0; i < 26; i++) {
    g.fillStyle = i % 3 ? `rgba(36,30,22,${0.1 + rand() * 0.16})` : `rgba(84,96,60,${0.1 + rand() * 0.14})`;
    g.beginPath();
    g.ellipse(rand() * w, rand() * h, 14 + rand() * 40, 14 + rand() * 50, 0, 0, TAU);
    g.fill();
  }
  g.filter = 'none';
};
// Altıgen gözlü tunç şebeke; arch: üstü kemerli ayna (mermer zemin üstünde)
const lattice = (g, w, h, rand, arch = false) => {
  if (arch) marble(g, w, h, rand);
  g.save();
  if (arch) {
    g.beginPath();
    g.moveTo(w * 0.08, h);
    g.lineTo(w * 0.08, h * 0.62);
    g.quadraticCurveTo(w * 0.1, h * 0.14, w / 2, h * 0.08);
    g.quadraticCurveTo(w * 0.9, h * 0.14, w * 0.92, h * 0.62);
    g.lineTo(w * 0.92, h);
    g.closePath();
    g.clip();
  }
  g.fillStyle = '#15130f';
  g.fillRect(0, 0, w, h);
  g.strokeStyle = '#4a4434';
  g.lineWidth = 5;
  const s = 32;
  for (let r = -1; r < h / (s * 0.87) + 1; r++) for (let k = -1; k < w / s + 1; k++) {
    const cx = k * s + (r % 2 ? s / 2 : 0), cy = r * s * 0.87;
    g.beginPath();
    for (let q = 0; q <= 6; q++) g.lineTo(cx + Math.cos((q / 6) * TAU + Math.PI / 6) * s * 0.56, cy + Math.sin((q / 6) * TAU + Math.PI / 6) * s * 0.56);
    g.stroke();
  }
  g.restore();
  if (arch) {
    g.strokeStyle = '#8f8a7a';
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(w * 0.08, h);
    g.lineTo(w * 0.08, h * 0.62);
    g.quadraticCurveTo(w * 0.1, h * 0.14, w / 2, h * 0.08);
    g.quadraticCurveTo(w * 0.9, h * 0.14, w * 0.92, h * 0.62);
    g.lineTo(w * 0.92, h);
    g.stroke();
  } else {
    g.strokeStyle = '#2a261c';
    g.lineWidth = 8;
    g.strokeRect(4, 4, w - 8, h - 8);
  }
};
export const bars = (g, w, h) => {
  g.fillStyle = '#17130f';
  g.fillRect(0, 0, w, h);
  g.strokeStyle = '#3a342a';
  g.lineWidth = 5;
  for (let x = 16; x < w; x += 28) g.strokeRect(x, 0, 0.01, h);
  for (let y = 16; y < h; y += 28) g.strokeRect(0, y, w, 0.01);
};
export const mossTile = (g, w, h, rand) => {
  PAINT.kiremit(g, w, h, rand);
  g.filter = 'blur(5px)';
  for (let i = 0; i < 26; i++) {
    g.fillStyle = `rgba(${60 + rand() * 30},${90 + rand() * 40},${40 + rand() * 20},${0.35 + rand() * 0.35})`;
    g.beginPath();
    g.ellipse(rand() * w, rand() * h, 8 + rand() * 26, 6 + rand() * 16, 0, 0, TAU);
    g.fill();
  }
  g.filter = 'none';
};
const M = K.materials('sebil', {
  mermer: [marble], kesme_tas: [ashlar], sebeke: [lattice], sebeke_kemer: [lattice, 256, 256, true], demir_parmaklik: [bars, 128, 192],
  kiremit_yosunlu: [mossTile], sacak_ahsabi: [PAINT.tahta, 256, 256, [96, 78, 60]], kereste: [PAINT.kereste], ahsap_kapi: [PAINT.kapi, 128, 192],
  ot: [PAINT.lif, 256, 256, '#3a4a26', ['#56703a', '#2e3e1e', '#7a8a4a'], 1200, 18, true], kursun: 0x6a6e72, karanlik: 0x14110e, alem: 0x8a7434,
});
M.alem.metalness = 0.6;
M.alem.roughness = 0.5;

// ---------- Sebil ----------
const AP = 3.0, C8 = Math.cos(Math.PI / 8), HS = AP * Math.tan(Math.PI / 8);
const vert = (k, ap, y) => V(Math.cos(((k - 0.5) / 8) * TAU) * (ap / C8), y, Math.sin(((k - 0.5) / 8) * TAU) * (ap / C8));
// Sekizgen kuşak: (ap0, y0) → (ap1, y1)
function ring(p, mat, a0, y0, a1, y1, s = 1.5) {
  for (let k = 0; k < 8; k++) {
    const q = [vert(k, a0, y0), vert(k + 1, a0, y0), vert(k + 1, a1, y1), vert(k, a1, y1)], t = (k / 8) * TAU, len = Math.hypot(a1 - a0, y1 - y0), w = 2 * HS * (a0 / AP);
    p.quad(mat, q, [[k * w / s, y0 / s], [(k + 1) * w / s, y0 / s], [(k + 1) * w / s, (y0 + len) / s], [k * w / s, (y0 + len) / s]], V(Math.cos(t), Math.abs(y1 - y0) < 1e-6 ? (a1 < a0 ? 9 : -9) : (a1 < a0 ? 0.7 : y1 > y0 ? 0.1 : -0.7), Math.sin(t)));
  }
}
export function createSebil() {
  const p = new K.Part('sebil');
  ring(p, 'mermer', AP + 0.12, 0, AP + 0.12, 0.25); // kaide
  ring(p, 'mermer', AP + 0.12, 0.25, AP, 0.32);
  ring(p, 'mermer', AP, 0.32, AP, 4.3);
  ring(p, 'mermer', AP, 0.9, AP + 0.2, 0.92); // pencere önü mermer tabla
  ring(p, 'mermer', AP + 0.2, 0.92, AP + 0.2, 1.0);
  ring(p, 'mermer', AP + 0.2, 1.0, AP, 1.0);
  ring(p, 'mermer', AP, 4.3, AP + 0.14, 4.4); // saçak altı silmesi
  ring(p, 'mermer', AP + 0.14, 4.4, AP + 0.14, 4.6);
  // Saçak: geniş ahşap, altı eğik; üstünde yosunlu kiremit külah
  ring(p, 'sacak_ahsabi', AP + 0.1, 4.55, AP + 1.45, 4.78, 1);
  ring(p, 'kereste', AP + 1.45, 4.78, AP + 1.45, 4.9, 1);
  ring(p, 'kiremit_yosunlu', AP + 1.45, 4.9, 0.9, 6.25);
  ring(p, 'kursun', 0.9, 6.25, 0.5, 6.5);
  lathe(p, 'kursun', 0, 0, [[0.52, 6.5], [0.3, 6.7], [0.12, 6.78, 'alem'], [0.26, 7.0, 'alem'], [0.08, 7.2, 'alem'], [0.16, 7.36, 'alem'], [0, 7.7]], 8);
  for (let k = 0; k < 8; k++) {
    const t = (k / 8) * TAU, n = V(Math.cos(t), 0, Math.sin(t)), r = V(-n.z, 0, n.x), c = n.clone().multiplyScalar(AP);
    const at = (a, y, d = 0.02) => c.clone().addScaledVector(r, a).addScaledVector(n, d).setY(y);
    // Köşe sütunu: kaide, gövde, başlık
    const v = vert(k, AP + 0.06, 0);
    lathe(p, 'mermer', v.x, v.z, [[0.2, 1.0], [0.2, 1.12], [0.14, 1.18], [0.13, 2.86], [0.2, 2.98], [0.22, 3.1], [0.16, 3.1], [0.16, 4.3]], 6);
    if (n.z > -0.1) {
      const w = HS - 0.3;
      p.quad('sebeke', [at(-w, 1.02), at(w, 1.02), at(w, 3.0), at(-w, 3.0)], [[0, 0], [w * 1.6, 0], [w * 1.6, 1.6], [0, 1.6]], n);
      p.quad('sebeke_kemer', [at(-w - 0.08, 3.12), at(w + 0.08, 3.12), at(w + 0.08, 4.25), at(-w - 0.08, 4.25)], K.FLAT, n);
      for (const [a0, a1, y0, y1] of [[-w - 0.06, -w, 1.0, 3.06], [w, w + 0.06, 1.0, 3.06], [-w - 0.06, w + 0.06, 3.0, 3.1]]) { // mermer söve
        p.quad('mermer', [at(a0, y0, 0.06), at(a1, y0, 0.06), at(a1, y1, 0.06), at(a0, y1, 0.06)], K.FLAT, n);
      }
    } else if (Math.abs(n.x) < 0.1) { // arka yüz: kapı
      p.quad('ahsap_kapi', [at(-0.5, 0.32), at(0.5, 0.32), at(0.5, 2.3), at(-0.5, 2.3)], K.FLAT, n);
      p.quad('mermer', [at(-0.62, 2.3, 0.05), at(0.62, 2.3, 0.05), at(0.62, 2.45, 0.05), at(-0.62, 2.45, 0.05)], K.FLAT, n);
    }
  }
  const root = new THREE.Group();
  root.name = 'sebil';
  const m = p.mesh(M);
  m.castShadow = m.receiveShadow = true;
  root.add(m);
  return root;
}

// ---------- Duvar kiti ----------
const TH = 0.4;
const wall = (p, hw = 1.5, h = 3) => box(p, 'kesme_tas', -hw, hw, 0, h, -TH, 0, ALL, 1.5);
const grille = (p, cx, y0, w, h) => { // mermer söveli, demir parmaklıklı pencere
  const x0 = cx - w / 2, x1 = cx + w / 2;
  p.quad('demir_parmaklik', [V(x0, y0, 0.012), V(x1, y0, 0.012), V(x1, y0 + h, 0.012), V(x0, y0 + h, 0.012)], K.FLAT, V(0, 0, 1));
  lath(p, x0 - 0.14, x0, y0 - 0.14, y0 + h + 0.14, 0.06, 'mermer');
  lath(p, x1, x1 + 0.14, y0 - 0.14, y0 + h + 0.14, 0.06, 'mermer');
  lath(p, x0, x1, y0 + h, y0 + h + 0.14, 0.06, 'mermer');
  lath(p, x0, x1, y0 - 0.14, y0, 0.09, 'mermer');
};
const PARTS = {
  tas_duvar: (p) => { wall(p); lath(p, -1.5, 1.5, 0, 0.35, 0.05, 'mermer'); },
  tas_duvar_pencere: (p) => { wall(p); lath(p, -1.5, 1.5, 0, 0.35, 0.05, 'mermer'); grille(p, 0, 0.95, 1.2, 1.6); },
  tas_duvar_2pencere: (p) => { wall(p); lath(p, -1.5, 1.5, 0, 0.35, 0.05, 'mermer'); for (const x of [-0.72, 0.72]) grille(p, x, 0.95, 0.9, 1.6); },
  tas_duvar_kemerli: (p) => { // mermer çerçeve içinde kemerli şebekeli açıklık
    wall(p);
    lath(p, -1.2, 1.2, 0, 2.95, 0.07, 'mermer');
    p.quad('sebeke_kemer', [V(-0.95, 0.75, 0.082), V(0.95, 0.75, 0.082), V(0.95, 2.85, 0.082), V(-0.95, 2.85, 0.082)], K.FLAT, V(0, 0, 1));
  },
  tas_duvar_kapi: (p) => {
    wall(p);
    lath(p, -0.95, 0.95, 0, 2.75, 0.07, 'mermer');
    p.quad('ahsap_kapi', [V(-0.65, 0, 0.082), V(0.65, 0, 0.082), V(0.65, 2.3, 0.082), V(-0.65, 2.3, 0.082)], K.FLAT, V(0, 0, 1));
    lath(p, -1.05, 1.05, 2.75, 2.9, 0.12, 'mermer');
  },
  tas_duvar_yikik: (p) => { // üstü yıkılmış, otlanmış duvar
    [[-1.5, -0.7, 2.5], [-0.7, 0.1, 1.9], [0.1, 0.9, 2.3], [0.9, 1.5, 1.5]].forEach(([x0, x1, h]) => {
      box(p, 'kesme_tas', x0, x1, 0, h, -TH, 0, ALL, 1.5);
      box(p, 'ot', x0 + 0.04, x1 - 0.04, h, h + 0.1, -TH + 0.04, -0.04, ['+x', '-x', '+z', '-z', '+y'], 0.6);
    });
    lath(p, -1.5, 1.5, 0, 0.35, 0.05, 'mermer');
  },
  tas_duvar_dar: (p) => { wall(p, 0.3); lath(p, -0.3, 0.3, 0, 0.35, 0.05, 'mermer'); },
  tas_kose: (p) => { // köşe payesi; orijin köşenin iç noktasında, +X +Z köşesine dönüş 0 ile konur
    box(p, 'mermer', -0.5, 0.08, 0, 3, -0.5, 0.08, ['+x', '-x', '+z', '-z', '+y'], 1.5);
    box(p, 'mermer', -0.54, 0.12, 0, 0.35, -0.54, 0.12, ['+x', '-x', '+z', '-z', '+y'], 1.5);
  },
  tas_sacak: (p) => { // duvar üstü silmesi: orijin duvar üst kotunda (Y 0)
    box(p, 'mermer', -1.5, 1.5, 0, 0.14, -TH - 0.04, 0.1, ALL, 1.5);
    box(p, 'mermer', -1.5, 1.5, 0.14, 0.26, -TH - 0.08, 0.18, ALL, 1.5);
  },
};
const kit = K.makeKit('sebil_duvar_kiti', PARTS, M);
export const PARCALAR = kit.names, createParca = kit.create, createKit = kit.createKit;
// Örnek: sebil ortada, iki yanında duvarlar (fotoğraftaki düzen)
export function createOrnek() {
  const root = new THREE.Group();
  root.name = 'ornek_sebil_ve_duvarlar';
  root.add(createSebil());
  const put = (part, x, y = 0, z = -1) => {
    const m = createParca(part);
    m.position.set(x, y, z);
    root.add(m);
  };
  [['tas_duvar_pencere', -4.5], ['tas_duvar_2pencere', -7.5], ['tas_duvar_kapi', -10.5], ['tas_duvar_yikik', -13.5], ['tas_duvar_kemerli', 4.5], ['tas_duvar_pencere', 7.5], ['tas_duvar', 10.5]].forEach(([part, x]) => {
    put(part, x);
    if (part !== 'tas_duvar_yikik') put('tas_sacak', x, 3);
  });
  put('tas_kose', 12, 0, -1);
  return root;
}
