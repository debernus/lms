import * as THREE from 'three';
import * as K from './kit_ortak.js';
import { yuz, cephe, kutu, halka } from './hazire_yapilari.js';
const { V, TAU, Part } = K;

// Eski İstanbul şehir paketi: 32 ev, merdiven ve yokuş parçaları, istinat ve bahçe duvarları, dükkân önü parçaları.
// Evler: 1 birim = 1 m; ön cephe +Z; orijin zemin katın ön kenarının ortasında, yer hizasında. Yan duvarlar düz ve
// boştur (bitişik dizilir); çıkma ve saçak yalnız öne taşar. Zemin katın altında 1,5 m taş temel vardır.

// ---------- Dokular (512 piksel = 3 m; duvar dokuları kat yüksekliğine oturur) ----------
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const ton = (r, c, d) => { const k = 1 + (r() - 0.5) * 2 * d; return c.map((v) => Math.min(255, v * k)); };
const lekele = (g, w, h, r, n, c, a, s = 0.1) => { for (let k = 0; k < n; k++) { g.fillStyle = `rgba(${c},${r() * a})`; g.beginPath(); g.ellipse(r() * w, r() * h, 3 + r() * w * s, 3 + r() * h * s, r() * 3, 0, 7); g.fill(); } };
const tuglaCiz = (g, x0, y0, x1, y1, r) => { g.fillStyle = '#6e6252'; g.fillRect(x0, y0, x1 - x0, y1 - y0); for (let y = y0, row = 0; y < y1; y += 13, row++) for (let x = x0 - (row % 2 ? 18 : 0); x < x1; x += 36) { g.fillStyle = rgb(ton(r, [150, 78, 56], 0.16)); g.fillRect(x + 1, y + 1, 34, 11); } };
const yagmurIzi = (g, w, h, r, n = 14, a = 0.3) => { for (let k = 0; k < n; k++) { const x = r() * w, L = 50 + r() * 190, ww = 6 + r() * 26, gr = g.createLinearGradient(0, 0, 0, L); gr.addColorStop(0, `rgba(40,32,24,${a * (0.5 + r() * 0.5)})`); gr.addColorStop(1, 'rgba(40,32,24,0)'); g.fillStyle = gr; g.fillRect(x, 0, ww, L); } };
const siva = (base, dokuk = 6) => (g, w, h, r) => {
  g.fillStyle = rgb(base); g.fillRect(0, 0, w, h);
  lekele(g, w, h, r, 260, '60,48,34', 0.1); lekele(g, w, h, r, 200, '255,250,235', 0.1);
  for (let k = 0; k < dokuk; k++) { // dökülmüş sıva: altından tuğla görünür
    const x = r() * w, y = h * (0.25 + r() * 0.75), R = 18 + r() * 60, pts = Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * TAU, m = R * (0.55 + r() * 0.7); return [x + Math.cos(a) * m * 1.3, y + Math.sin(a) * m]; });
    g.save(); g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.clip(); tuglaCiz(g, x - R * 2, y - R * 2, x + R * 2, y + R * 2, r); g.restore();
    g.strokeStyle = 'rgba(40,30,20,0.55)'; g.lineWidth = 2; g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.stroke();
  }
  yagmurIzi(g, w, h, r);
  for (let k = 0; k < 6; k++) { g.strokeStyle = 'rgba(50,40,30,0.45)'; g.lineWidth = 1; g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let i = 0; i < 8; i++) { x += (r() - 0.5) * 30; y += 10 + r() * 24; g.lineTo(x, y); } g.stroke(); }
  g.fillStyle = 'rgba(50,40,28,0.22)'; g.fillRect(0, h * 0.9, w, h * 0.1);
};
const ahsap = (base, yatay = false) => (g, w, h, r) => {
  g.fillStyle = rgb(base.map((v) => v * 0.35)); g.fillRect(0, 0, w, h);
  const n = 16;
  for (let k = 0; k < n; k++) {
    const c = ton(r, base, 0.14), a = (k / n) * w;
    g.fillStyle = rgb(c); if (yatay) g.fillRect(0, a + 1, w, w / n - 3); else g.fillRect(a + 1, 0, w / n - 3, h);
    for (let i = 0; i < 9; i++) { g.strokeStyle = r() < 0.5 ? rgb(c.map((v) => v * 0.7), 0.5) : rgb(c.map((v) => Math.min(255, v * 1.2)), 0.35); g.lineWidth = 1; const o = a + 2 + r() * (w / n - 6); g.beginPath(); if (yatay) { g.moveTo(0, o); g.lineTo(w, o + (r() - 0.5) * 3); } else { g.moveTo(o, 0); g.lineTo(o + (r() - 0.5) * 3, h); } g.stroke(); }
    for (const q of [0.12, 0.62]) { g.fillStyle = 'rgba(20,14,8,0.8)'; if (yatay) g.fillRect(q * w + (k % 2) * 40, a + w / n / 2, 3, 3); else g.fillRect(a + w / n / 2, q * h, 3, 3); }
  }
  lekele(g, w, h, r, 120, '30,22,14', 0.14); lekele(g, w, h, r, 60, '200,190,170', 0.08);
  yagmurIzi(g, w, h, r, 10, 0.25);
  const gr = g.createLinearGradient(0, h * 0.75, 0, h); gr.addColorStop(0, 'rgba(30,22,14,0)'); gr.addColorStop(1, 'rgba(30,22,14,0.35)'); g.fillStyle = gr; g.fillRect(0, h * 0.75, w, h * 0.25);
};
const tasBlok = (base, rows, koyu = '#6a6052', dw = 0.4) => (g, w, h, r) => {
  g.fillStyle = koyu; g.fillRect(0, 0, w, h);
  for (let row = 0; row < rows; row++) { let x = -r() * 60; const rh = h / rows; while (x < w) { const bw = rh * (1 + r() * (1 + dw * 2)); g.fillStyle = rgb(ton(r, base, 0.1)); g.fillRect(x + 2, row * rh + 2, bw - 4, rh - 4); x += bw; } }
  lekele(g, w, h, r, 160, '50,40,28', 0.14); lekele(g, w, h, r, 80, '90,110,60', 0.08); yagmurIzi(g, w, h, r, 8, 0.2);
};
const moloz = (base) => (g, w, h, r) => {
  g.fillStyle = '#4e463c'; g.fillRect(0, 0, w, h);
  for (let k = 0; k < 260; k++) { const x = r() * w, y = r() * h, R = 16 + r() * 30; g.fillStyle = rgb(ton(r, base, 0.18)); for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { g.beginPath(); for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU + k, m = R * (0.7 + ((i * 37 + k * 13) % 10) / 22); g.lineTo(x + dx + Math.cos(a) * m * 1.25, y + dy + Math.sin(a) * m * 0.8); } g.closePath(); g.fill(); g.strokeStyle = 'rgba(40,34,26,0.7)'; g.lineWidth = 2.5; g.stroke(); } }
  lekele(g, w, h, r, 120, '40,32,24', 0.16); lekele(g, w, h, r, 60, '80,100,50', 0.1);
};
const PEN = (tip, cerceve, renk) => (g, w, h, r) => { // pencere ve kapı dokuları (açıklığa oturur)
  const f = w * 0.07;
  g.fillStyle = rgb(cerceve); g.fillRect(0, 0, w, h);
  const cam = () => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#39464e'); gr.addColorStop(0.5, '#1c2329'); gr.addColorStop(1, '#2a343b'); g.fillStyle = gr; g.fillRect(f, f, w - 2 * f, h - 2 * f); g.fillStyle = 'rgba(190,205,210,0.1)'; g.beginPath(); g.moveTo(f, h * 0.5); g.lineTo(w * 0.6, f); g.lineTo(w * 0.8, f); g.lineTo(f, h * 0.75); g.fill(); };
  const cita = (nx, ny, y0 = f, y1 = h - f) => { g.fillStyle = rgb(cerceve); for (let k = 1; k < nx; k++) g.fillRect(f + ((w - 2 * f) * k) / nx - 3, y0, 6, y1 - y0); for (let k = 1; k < ny; k++) g.fillRect(f, y0 + ((y1 - y0) * k) / ny - 3, w - 2 * f, 6); };
  if (tip === 'giyotin') { cam(); cita(2, 4); g.fillRect(f, h * 0.5 - 6, w - 2 * f, 12); }
  if (tip === 'cok') { cam(); cita(4, 5); }
  if (tip === 'kafes') { cam(); cita(2, 2, f, h * 0.42); g.fillStyle = rgb(renk.map((v) => v * 0.4)); g.fillRect(f, h * 0.42, w - 2 * f, h * 0.58 - f); g.strokeStyle = rgb(renk); g.lineWidth = 5; g.save(); g.beginPath(); g.rect(f, h * 0.42, w - 2 * f, h * 0.58 - f); g.clip(); for (let k = -20; k < 40; k++) { g.beginPath(); g.moveTo(k * 16, h * 0.42); g.lineTo(k * 16 + h, h * 0.42 + h); g.stroke(); g.beginPath(); g.moveTo(k * 16, h * 0.42); g.lineTo(k * 16 - h, h * 0.42 + h); g.stroke(); } g.restore(); g.fillStyle = rgb(cerceve); g.fillRect(f, h * 0.42 - 5, w - 2 * f, 10); }
  if (tip === 'kepenk') { for (const x0 of [f, w / 2 + 1]) { const ww = w / 2 - f - 1; g.fillStyle = rgb(renk.map((v) => v * 0.75)); g.fillRect(x0, f, ww, h - 2 * f); for (let y = f + 8; y < h - f - 8; y += 13) { g.fillStyle = rgb(ton(r, renk, 0.1)); g.fillRect(x0 + 7, y, ww - 14, 8); g.fillStyle = 'rgba(10,10,8,0.7)'; g.fillRect(x0 + 7, y + 8, ww - 14, 3); } g.strokeStyle = rgb(renk.map((v) => v * 0.55)); g.lineWidth = 5; g.strokeRect(x0 + 3, f + 3, ww - 6, h - 2 * f - 6); } lekele(g, w, h, r, 30, '220,215,200', 0.12, 0.05); }
  if (tip === 'parmak') { cam(); g.strokeStyle = '#2a2622'; g.lineWidth = 6; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo((k / 4) * w, f); g.lineTo((k / 4) * w, h - f); g.stroke(); } for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(f, (k / 4) * h); g.lineTo(w - f, (k / 4) * h); g.stroke(); } }
  if (tip === 'kapi' || tip === 'cift' || tip === 'civili' || tip === 'dukkan') {
    g.fillStyle = rgb(renk.map((v) => v * 0.5)); g.fillRect(0, 0, w, h);
    const n = tip === 'dukkan' ? 9 : 6;
    for (let k = 0; k < n; k++) { g.fillStyle = rgb(ton(r, renk, 0.12)); if (tip === 'dukkan') g.fillRect(3, (k / n) * h + 2, w - 6, h / n - 4); else g.fillRect((k / n) * w + 2, 0, w / n - 4, h); }
    for (let k = 0; k < 160; k++) { g.fillStyle = `rgba(20,14,8,${r() * 0.25})`; g.fillRect(r() * w, r() * h, tip === 'dukkan' ? 40 + r() * 80 : 2, tip === 'dukkan' ? 2 : 30 + r() * 90); }
    if (tip !== 'dukkan') { g.fillStyle = '#26221e'; for (const y of [0.16, 0.8]) g.fillRect(0, y * h, w, h * 0.022); }
    if (tip === 'cift' || tip === 'civili') { g.fillStyle = 'rgba(10,8,6,0.9)'; g.fillRect(w / 2 - 2, 0, 4, h); }
    if (tip === 'civili') { g.fillStyle = '#3a342c'; for (let a = 0; a < 6; a++) for (let b = 0; b < 9; b++) { g.beginPath(); g.arc(((a + 0.5) / 6) * w, ((b + 0.5) / 9) * h, w * 0.022, 0, 7); g.fill(); } }
    g.fillStyle = '#7a6a3a'; g.beginPath(); g.arc(w * (tip === 'kapi' ? 0.82 : 0.44), h * 0.52, w * 0.03, 0, 7); g.fill();
    lekele(g, w, h, r, 40, '20,14,8', 0.2, 0.06);
  }
};
const yarimAhsap = (g, w, h, r) => { siva([226, 218, 200], 3)(g, w, h, r); g.fillStyle = '#3a2c20'; for (const x of [0, 0.33, 0.66]) g.fillRect(x * w, 0, 22, h); g.fillRect(w - 6, 0, 6, h); for (const y of [0, 0.5]) g.fillRect(0, y * h, w, 22); g.fillRect(0, h - 10, w, 10); g.save(); g.strokeStyle = '#3a2c20'; g.lineWidth = 18; for (const [a, b] of [[0.04, 0.33], [0.66, 0.37]]) { g.beginPath(); g.moveTo(a * w, h * 0.5); g.lineTo(b * w, h * 0.98); g.stroke(); } g.restore(); };
const almasik = (g, w, h, r) => { g.fillStyle = '#7a6e5e'; g.fillRect(0, 0, w, h); const rows = [[0, 0.2, 0], [0.2, 0.4, 0], [0.4, 0.467, 1], [0.467, 0.533, 1], [0.533, 0.6, 1], [0.6, 0.8, 0], [0.8, 0.867, 1], [0.867, 0.933, 1], [0.933, 1, 1]]; for (const [a, b, br] of rows) { let x = -r() * 60; while (x < w) { const bw = br ? 60 + r() * 20 : 100 + r() * 90; g.fillStyle = rgb(ton(r, br ? [160, 82, 58] : [214, 202, 178], br ? 0.14 : 0.07)); g.fillRect(x + 2, a * h + 2, bw - 4, (b - a) * h - 4); x += bw; } } lekele(g, w, h, r, 80, '50,40,28', 0.14); yagmurIzi(g, w, h, r, 8, 0.2); };
const bez = (base, serit) => (g, w, h, r) => { g.fillStyle = rgb(base); g.fillRect(0, 0, w, h); if (serit) { g.fillStyle = rgb(serit); for (let k = 0; k < 4; k++) g.fillRect((k / 4) * w, 0, w / 8, h); } for (let k = 0; k < 3000; k++) { g.fillStyle = r() < 0.5 ? 'rgba(60,50,36,0.1)' : 'rgba(255,250,235,0.1)'; g.fillRect(r() * w, r() * h, 1, 3 + r() * 8); } lekele(g, w, h, r, 60, '70,56,36', 0.14); };
const kaldirim = (g, w, h, r) => { g.fillStyle = '#4a4034'; g.fillRect(0, 0, w, h); for (let row = 0; row < 12; row++) for (let c = 0; c < 12; c++) { const x = (c + (row % 2 ? 0.5 : 0)) * (w / 12) + (r() - 0.5) * 8, y = (row + 0.5) * (h / 12) + (r() - 0.5) * 8; for (const dx of [-w, 0, w]) { const gr = g.createRadialGradient(x + dx - 4, y - 4, 2, x + dx, y, 24); const c0 = ton(r, [150, 142, 128], 0.14); gr.addColorStop(0, rgb(c0.map((v) => Math.min(255, v * 1.15)))); gr.addColorStop(1, rgb(c0.map((v) => v * 0.7))); g.fillStyle = gr; g.beginPath(); g.ellipse(x + dx, y, 17 + r() * 4, 15 + r() * 4, r() * 3, 0, 7); g.fill(); } } lekele(g, w, h, r, 60, '30,24,16', 0.2); };
const M = K.materials('sehir', {
  temel_tas: [moloz([120, 112, 100])], moloz_tas: [moloz([158, 150, 136])], beyaz_tas: [moloz([212, 206, 192])], kesme_tas: [tasBlok([206, 196, 172], 6)], kirec_tasi: [tasBlok([190, 184, 166], 4, '#5a5446', 0.2)],
  almasik_duvar: [almasik], tugla: [(g, w, h, r) => { tuglaCiz(g, 0, 0, w, h, r); lekele(g, w, h, r, 80, '40,30,20', 0.16); }],
  siva_beyaz: [siva([226, 220, 204])], siva_asi: [siva([204, 164, 92])], siva_krem: [siva([222, 204, 164], 12)], siva_hardal: [siva([196, 156, 70])], siva_pembe: [siva([206, 160, 148])], siva_kirli: [siva([190, 182, 164], 9)],
  yarim_ahsap: [yarimAhsap],
  ahsap_koyu: [ahsap([86, 62, 44])], ahsap_gri: [ahsap([124, 114, 102])], ahsap_kirmizi: [ahsap([126, 50, 42])], ahsap_mavi: [ahsap([126, 142, 150])], ahsap_katran: [ahsap([58, 44, 34])], ahsap_asi: [ahsap([196, 162, 100])], ahsap_kizil: [ahsap([104, 52, 38])], ahsap_gumus: [ahsap([150, 148, 140])], ahsap_yama: [(g, w, h, r) => { ahsap([110, 92, 72])(g, w, h, r); for (let k = 0; k < 7; k++) { g.fillStyle = rgb(ton(r, [[70, 54, 40], [150, 130, 100], [96, 84, 76]][k % 3], 0.1)); g.fillRect(r() * w, r() * h, 60 + r() * 90, 50 + r() * 120); } }],
  kereste: [ahsap([84, 64, 46], true)], tahta: [ahsap([134, 112, 84], true)],
  kiremit: [K.PAINT.kiremit], bez_krem: [bez([214, 200, 166])], bez_cizgili: [bez([224, 214, 190], [160, 60, 48])], bez_yamali: [(g, w, h, r) => { bez([188, 170, 134])(g, w, h, r); for (let k = 0; k < 6; k++) { g.fillStyle = rgb(ton(r, [[150, 120, 90], [200, 190, 160], [130, 110, 100]][k % 3], 0.1)); const x = r() * w, y = r() * h; g.fillRect(x, y, 70 + r() * 80, 60 + r() * 80); g.strokeStyle = 'rgba(40,30,20,0.6)'; g.setLineDash([6, 5]); g.strokeRect(x, y, 100, 90); g.setLineDash([]); } }],
  kaldirim: [kaldirim],
  pencere_giyotin: [PEN('giyotin', [226, 220, 204]), 256, 384], pencere_koyu: [PEN('giyotin', [70, 54, 40]), 256, 384], pencere_kafes: [PEN('kafes', [84, 64, 46], [140, 110, 78]), 256, 384], pencere_kafes_beyaz: [PEN('kafes', [226, 220, 204], [150, 122, 88]), 256, 384],
  pencere_cok: [PEN('cok', [84, 64, 46]), 384, 384], pencere_parmak: [PEN('parmak', [90, 84, 74]), 256, 256],
  kepenk_yesil: [PEN('kepenk', [60, 52, 40], [86, 124, 92]), 256, 384], kepenk_mavi: [PEN('kepenk', [226, 220, 204], [110, 130, 142]), 256, 384], kepenk_kahve: [PEN('kepenk', [60, 46, 34], [112, 84, 58]), 256, 384],
  kapi_ahsap: [PEN('kapi', [0, 0, 0], [104, 78, 54]), 256, 512], kapi_cift: [PEN('cift', [0, 0, 0], [92, 68, 48]), 256, 384], kapi_civili: [PEN('civili', [0, 0, 0], [80, 60, 44]), 256, 384], kepenk_dukkan: [PEN('dukkan', [0, 0, 0], [116, 96, 72]), 384, 256],
  demir: 0x2a2826, karanlik: 0x14110e, yanik: 0x1c1814, asma: 0x4a6a34,
});
// Kabartma haritaları: renk dokusunun aydınlığından
for (const m of Object.values(M)) {
  m.side = THREE.DoubleSide;
  if (!m.map) continue;
  const c = m.map.image, w = c.width, h = c.height, src = c.getContext('2d').getImageData(0, 0, w, h).data, o = document.createElement('canvas'); o.width = w; o.height = h;
  const g = o.getContext('2d'), out = g.createImageData(w, h), L = (x, y) => { const i = (((y + h) % h) * w + ((x + w) % w)) * 4; return (src[i] + src[i + 1] * 2 + src[i + 2]) / 1020; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = (L(x + 1, y) - L(x - 1, y)) * 2.2, dy = (L(x, y + 1) - L(x, y - 1)) * 2.2, l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4; out.data[i] = (-dx / l * 0.5 + 0.5) * 255; out.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; out.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; out.data[i + 3] = 255; }
  g.putImageData(out, 0, 0);
  m.normalMap = new THREE.CanvasTexture(o); m.normalMap.name = m.name + '_kabartma'; m.normalMap.wrapS = m.normalMap.wrapT = THREE.RepeatWrapping; m.normalMap.colorSpace = THREE.NoColorSpace;
  m.roughness = m.name.startsWith('pencere') ? 0.5 : 0.92;
}

// ---------- Yardımcılar ----------
const UP = V(0, 1, 0);
function kup(P, mat, x0, x1, y0, y1, z0, z1, skip = '', s = 3) {
  const F = { '+x': [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [1, 0, 0], 2, 1], '-x': [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], 2, 1], '+y': [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0], 0, 2], '-y': [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], 0, 2], '+z': [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], 0, 1], '-z': [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, -1], 0, 1] };
  for (const [key, [a, b, c, d, n, iu, iv]] of Object.entries(F)) if (!skip.includes(key)) P.quad(mat, [a, b, c, d].map((q) => V(...q)), [a, b, c, d].map((q) => [q[iu] / s, q[iv] / s]), V(...n));
}
const dortgen = (P, mat, pts, n, s = 3) => { const a = [Math.abs(n.x), Math.abs(n.y), Math.abs(n.z)], m = Math.max(...a); P.quad(mat, pts, pts.map((q) => (a[1] === m ? [q.x / s, q.z / s] : a[2] === m ? [q.x / s, q.y / s] : [q.z / s, q.y / s])), n); };
// Açıklık tanımları (y, katın tabanına göre): kapı ve pencere
const kp = (u, w, h, fill = 'kapi_ahsap', tip, rise = 0) => ({ u, w, y0: 0.02, h: h - rise, rise, tip, fill, depth: 0.14 });
const pn = (u, w, h, fill = 'pencere_kafes', y0 = 0.95, tip, rise = 0) => ({ u, w, y0, h: h - rise, rise, tip, fill, depth: 0.08 });
const sira = (n, span, w, h, fill, y0 = 0.95, tip, rise = 0) => Array.from({ length: n }, (_, k) => pn(n === 1 ? 0 : -span / 2 + (span * k) / (n - 1), w, h, fill, y0, tip, rise));
const acik = (ops, y) => ops.map((o) => ({ u0: o.u - o.w / 2, u1: o.u + o.w / 2, y0: y + o.y0, ys: y + o.y0 + o.h, rise: o.rise, tip: o.tip, fill: o.fill, depth: o.depth, reveal: o.reveal || 'kereste', fillScale: o.scale }));
function sove(P, F, ops, mat = 'kereste') { for (const o of ops) if (o.fill && !o.fill.startsWith('kapi') && o.fill !== 'karanlik' && !o.rise) { kutu(P, F, o.u0 - 0.06, o.u1 + 0.06, o.y0 - 0.07, o.y0, 0, 0.05, mat); kutu(P, F, o.u0 - 0.06, o.u1 + 0.06, o.ys, o.ys + 0.07, 0, 0.05, mat); } }
// Ev üreticisi. s: { w, d, kat: [{ h, m, c (öne çıkma), k (açıklıklar), destek, sag / sol (köşe evinde yan cephe açıklıkları) }],
//   cumba: [{ u, w, c, kat: [ilk, son], m, k, cati }], sacak, cati (mahya yüksekliği oranı), baca: [x, z], ek(P, bilgi) }
function ev(P, s) {
  const W = s.w, D = s.d, hw = W / 2, katlar = [];
  kup(P, 'temel_tas', -hw, hw, -1.5, 0, -D, 0, '+y-y', 2);
  let y = 0, pr = 0;
  s.kat.forEach((k, i) => {
    const h = k.h ?? 3, z1 = pr + (k.c ?? 0), mat = k.m;
    if (k.c) { // çıkma: alt yüz, silme ve eli böğründeler
      dortgen(P, 'kereste', [V(-hw, y, pr), V(hw, y, pr), V(hw, y, z1), V(-hw, y, z1)], V(0, -1, 0), 1.5);
      kup(P, 'kereste', -hw, hw, y - 0.03, y + 0.13, z1 - 0.02, z1 + 0.03, '+x-x-z', 1.5);
      const n = k.destek ?? 3;
      for (let q = 0; q < n; q++) { const x = n === 1 ? 0 : -hw + 0.35 + ((W - 0.7) * q) / (n - 1); K.beam(P, 'kereste', V(x, y - (k.destekBoy ?? 0.75), pr + 0.02), V(x, y - 0.02, z1 - 0.04), 0.11, 0.09); }
    }
    const F = yuz(V(0, 0, z1), V(0, 0, 1)), ops = acik(k.k || [], y);
    cephe(P, F, W, [[y, y + h, mat, 3]], ops);
    sove(P, F, ops);
    for (const sg of [-1, 1]) {
      const yan = sg > 0 ? k.sag : k.sol;
      if (yan) { const Fy = yuz(V(sg * hw, 0, (z1 - D) / 2), V(sg, 0, 0)), oy = acik(yan, y); cephe(P, Fy, z1 + D, [[y, y + h, mat, 3]], oy); sove(P, Fy, oy); }
      else dortgen(P, k.yan || mat, [V(sg * hw, y, -D), V(sg * hw, y, z1), V(sg * hw, y + h, z1), V(sg * hw, y + h, -D)], V(sg, 0, 0));
    }
    dortgen(P, k.arka || mat, [V(-hw, y, -D), V(hw, y, -D), V(hw, y + h, -D), V(-hw, y + h, -D)], V(0, 0, -1));
    katlar.push({ y, h, z: z1, mat });
    y += h; pr = z1;
  });
  let on = pr;
  for (const b of s.cumba || []) { // kapalı çıkma (cumba)
    const k0 = katlar[b.kat[0]], k1 = katlar[b.kat[1] ?? b.kat[0]], y0 = k0.y + (b.alt ?? 0), y1 = k1.y + k1.h - (b.ust ?? 0), z0 = Math.min(k0.z, k1.z), z1 = Math.max(k0.z, k1.z) + b.c, x0 = b.u - b.w / 2, x1 = b.u + b.w / 2, mat = b.m || k1.mat;
    const F = yuz(V(b.u, 0, z1), V(0, 0, 1)), ops = acik(b.k || [], k0.y);
    cephe(P, F, b.w, [[y0, y1, mat, 3]], ops); sove(P, F, ops);
    for (const [x, n] of [[x0, -1], [x1, 1]]) dortgen(P, mat, [V(x, y0, z0), V(x, y0, z1), V(x, y1, z1), V(x, y1, z0)], V(n, 0, 0));
    dortgen(P, 'kereste', [V(x0, y0, z0), V(x1, y0, z0), V(x1, y0, z1), V(x0, y0, z1)], V(0, -1, 0), 1.5);
    for (const x of [x0 + 0.15, x1 - 0.15]) K.beam(P, 'kereste', V(x, y0 - 0.6, z0 + 0.02), V(x, y0 - 0.02, z1 - 0.05), 0.1, 0.09);
    if (b.cati) { dortgen(P, 'kiremit', [V(x0 - 0.1, y1, z1 + 0.15), V(x1 + 0.1, y1, z1 + 0.15), V(x1 + 0.1, y1 + 0.4, z0), V(x0 - 0.1, y1 + 0.4, z0)], V(0, 1, 0.4), 1.5); for (const [x, n] of [[x0 - 0.1, -1], [x1 + 0.1, 1]]) P.tri('kereste', [V(x, y1, z0), V(x, y1, z1 + 0.15), V(x, y1 + 0.4, z0)], K.FLAT.slice(0, 3), V(n, 0, 0)); }
    else on = Math.max(on, z1);
  }
  // Çatı: mahya X boyunca; öne ve arkaya eğimli. Yanlarda taşma yok (bitişik dizilir); saçak yalnız önde.
  const H = y, zf = on + (s.sacak ?? 0.8), zb = -D, rz = (pr + zb) / 2, rh = (zf - zb) * (s.cati ?? 0.22), topMat = katlar[katlar.length - 1].mat;
  const yOn = (z) => H + rh * (z > rz ? (zf - z) / (zf - rz) : (z - zb) / (rz - zb));
  const sag = s.sarkma ? 0.12 : 0; // çökmüş mahya
  for (let q = 0; q < 4; q++) { const xa = -hw + (W * q) / 4, xb = -hw + (W * (q + 1)) / 4, ya = H + rh - sag * Math.sin((q / 4) * Math.PI), yb = H + rh - sag * Math.sin(((q + 1) / 4) * Math.PI); P.quad('kiremit', [V(xa, H, zf), V(xb, H, zf), V(xb, yb, rz), V(xa, ya, rz)], [[xa / 1.5, 0], [xb / 1.5, 0], [xb / 1.5, (zf - rz) / 1.3], [xa / 1.5, (zf - rz) / 1.3]], V(0, 1, 0.5)); P.quad('kiremit', [V(xb, H, zb), V(xa, H, zb), V(xa, ya, rz), V(xb, yb, rz)], [[xb / 1.5, 0], [xa / 1.5, 0], [xa / 1.5, (rz - zb) / 1.3], [xb / 1.5, (rz - zb) / 1.3]], V(0, 1, -0.5)); }
  for (const sg of [-1, 1]) { const x = sg * hw; P.quad(topMat, [V(x, H, zb), V(x, H, pr), V(x, yOn(pr), pr), V(x, H + rh, rz)], [[zb / 3, H / 3], [pr / 3, H / 3], [pr / 3, yOn(pr) / 3], [rz / 3, (H + rh) / 3]], V(sg, 0, 0)); P.tri('kereste', [V(x, H, pr), V(x, H, zf), V(x, yOn(pr), pr)], K.FLAT.slice(0, 3), V(sg, 0, 0)); }
  dortgen(P, 'kereste', [V(-hw, H, pr), V(hw, H, pr), V(hw, H, zf), V(-hw, H, zf)], V(0, -1, 0), 1.5);
  dortgen(P, 'kereste', [V(-hw, H - 0.02, zf), V(hw, H - 0.02, zf), V(hw, H + 0.12, zf), V(-hw, H + 0.12, zf)], V(0, 0, 1), 1.5);
  for (const [bx, bz, bh = 1.3] of s.baca || []) { const y0 = yOn(bz) - 0.3; kup(P, 'tugla', bx - 0.28, bx + 0.28, y0, y0 + bh, bz - 0.28, bz + 0.28, '-y', 1.5); kup(P, 'kesme_tas', bx - 0.34, bx + 0.34, y0 + bh, y0 + bh + 0.1, bz - 0.34, bz + 0.34, '', 1.5); }
  if (s.ek) s.ek(P, { katlar, H, zf, on, hw, yOn });
}
