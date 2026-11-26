import * as THREE from 'three';
import * as K from './kit_ortak.js';
import { yuz, cephe, kutu, halka, kemer } from './hazire_yapilari.js';
const { V, TAU, Part } = K;

// Eski İstanbul şehir paketi: 32 ev, merdiven ve yokuş parçaları, istinat ve bahçe duvarları, dükkân önü parçaları.
// Evler: 1 birim = 1 m; ön cephe +Z; orijin zemin katın ön kenarının ortasında, yer hizasında. Yan duvarlar düz ve
// boştur (bitişik dizilir); çıkma ve saçak yalnız öne taşar. Zemin katın altında 1,5 m taş temel vardır.

// ---------- Dokular (512 piksel = 3 m; duvar dokuları kat yüksekliğine oturur) ----------
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const ton = (r, c, d) => { const k = 1 + (r() - 0.5) * 2 * d; return c.map((v) => Math.min(255, v * k)); };
const lekele = (g, w, h, r, n, c, a, s = 0.1) => { for (let k = 0; k < n; k++) { g.fillStyle = `rgba(${c},${r() * a})`; g.beginPath(); g.ellipse(r() * w, r() * h, 3 + r() * w * s, 3 + r() * h * s, r() * 3, 0, 7); g.fill(); } };
const tuglaCiz = (g, x0, y0, x1, y1, r) => { g.fillStyle = '#6e6252'; g.fillRect(x0, y0, x1 - x0, y1 - y0); for (let y = y0, row = 0; y < y1; y += 13, row++) for (let x = x0 - (row % 2 ? 18 : 0); x < x1; x += 36) { g.fillStyle = rgb(ton(r, [122, 86, 72], 0.14)); g.fillRect(x + 1, y + 1, 34, 11); } };
const yagmurIzi = (g, w, h, r, n = 14, a = 0.3) => { for (let k = 0; k < n; k++) { const x = r() * w, L = 50 + r() * 190, ww = 6 + r() * 26, gr = g.createLinearGradient(0, 0, 0, L); gr.addColorStop(0, `rgba(40,32,24,${a * (0.5 + r() * 0.5)})`); gr.addColorStop(1, 'rgba(40,32,24,0)'); g.fillStyle = gr; g.fillRect(x, 0, ww, L); } };
// Kir katmanı: saçak altı ve dip koyulaşır, iri lekeler ve aşağı süzülen izler (düz, temiz görünüşü kırar)
const kirlet = (g, w, h, r, k = 1) => { let gr = g.createLinearGradient(0, 0, 0, h * 0.16); gr.addColorStop(0, `rgba(24,20,16,${0.5 * k})`); gr.addColorStop(1, 'rgba(24,20,16,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h * 0.16); gr = g.createLinearGradient(0, h * 0.8, 0, h); gr.addColorStop(0, 'rgba(30,26,20,0)'); gr.addColorStop(1, `rgba(30,26,20,${0.42 * k})`); g.fillStyle = gr; g.fillRect(0, h * 0.8, w, h * 0.2); lekele(g, w, h, r, 70, '26,22,18', 0.13 * k, 0.07); lekele(g, w, h, r, 30, '70,80,56', 0.09 * k, 0.06); yagmurIzi(g, w, h, r, 16, 0.34 * k); for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.6 ? `rgba(20,16,12,${r() * 0.16})` : `rgba(235,230,215,${r() * 0.09})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 3); } };
const siva = (base, dokuk = 3) => (g, w, h, r) => {
  g.fillStyle = rgb(base); g.fillRect(0, 0, w, h);
  lekele(g, w, h, r, 260, '60,48,34', 0.1); lekele(g, w, h, r, 200, '255,250,235', 0.1);
  for (let k = 0; k < dokuk; k++) { // dökülmüş sıva: altından tuğla görünür
    const x = r() * w, y = h * (0.25 + r() * 0.75), R = 12 + r() * 34, pts = Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * TAU, m = R * (0.55 + r() * 0.7); return [x + Math.cos(a) * m * 1.3, y + Math.sin(a) * m]; });
    g.save(); g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.clip(); tuglaCiz(g, x - R * 2, y - R * 2, x + R * 2, y + R * 2, r); g.restore();
    g.strokeStyle = 'rgba(40,30,20,0.55)'; g.lineWidth = 2; g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.stroke();
  }
  yagmurIzi(g, w, h, r);
  for (let k = 0; k < 6; k++) { g.strokeStyle = 'rgba(50,40,30,0.45)'; g.lineWidth = 1; g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let i = 0; i < 8; i++) { x += (r() - 0.5) * 30; y += 10 + r() * 24; g.lineTo(x, y); } g.stroke(); }
  kirlet(g, w, h, r);
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
  kirlet(g, w, h, r, 0.8);
};
const tasBlok = (base, rows, koyu = '#6a6052', dw = 0.4) => (g, w, h, r) => {
  g.fillStyle = koyu; g.fillRect(0, 0, w, h);
  for (let row = 0; row < rows; row++) { let x = -r() * 60; const rh = h / rows; while (x < w) { const bw = rh * (1 + r() * (1 + dw * 2)); g.fillStyle = rgb(ton(r, base, 0.1)); g.fillRect(x + 2, row * rh + 2, bw - 4, rh - 4); x += bw; } }
  lekele(g, w, h, r, 160, '50,40,28', 0.14); kirlet(g, w, h, r);
};
const moloz = (base) => (g, w, h, r) => {
  g.fillStyle = '#4e463c'; g.fillRect(0, 0, w, h);
  for (let k = 0; k < 520; k++) { const x = r() * w, y = r() * h, R = 12 + r() * 22; g.fillStyle = rgb(ton(r, base, 0.14)); for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { g.beginPath(); for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU + k, m = R * (0.7 + ((i * 37 + k * 13) % 10) / 22); g.lineTo(x + dx + Math.cos(a) * m * 1.25, y + dy + Math.sin(a) * m * 0.8); } g.closePath(); g.fill(); g.strokeStyle = 'rgba(40,34,26,0.55)'; g.lineWidth = 1.5; g.stroke(); } }
  kirlet(g, w, h, r, 0.9);
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
    lekele(g, w, h, r, 40, '20,14,8', 0.2, 0.06); const gk = g.createLinearGradient(0, h * 0.7, 0, h); gk.addColorStop(0, 'rgba(20,16,12,0)'); gk.addColorStop(1, 'rgba(20,16,12,0.5)'); g.fillStyle = gk; g.fillRect(0, h * 0.7, w, h * 0.3);
  }
};
const yarimAhsap = (g, w, h, r) => { siva([190, 184, 168], 3)(g, w, h, r); g.fillStyle = '#3a2c20'; for (const x of [0, 0.33, 0.66]) g.fillRect(x * w, 0, 22, h); g.fillRect(w - 6, 0, 6, h); for (const y of [0, 0.5]) g.fillRect(0, y * h, w, 22); g.fillRect(0, h - 10, w, 10); g.save(); g.strokeStyle = '#3a2c20'; g.lineWidth = 18; for (const [a, b] of [[0.04, 0.33], [0.66, 0.37]]) { g.beginPath(); g.moveTo(a * w, h * 0.5); g.lineTo(b * w, h * 0.98); g.stroke(); } g.restore(); };
const almasik = (g, w, h, r) => { g.fillStyle = '#7a6e5e'; g.fillRect(0, 0, w, h); const rows = [[0, 0.2, 0], [0.2, 0.4, 0], [0.4, 0.467, 1], [0.467, 0.533, 1], [0.533, 0.6, 1], [0.6, 0.8, 0], [0.8, 0.867, 1], [0.867, 0.933, 1], [0.933, 1, 1]]; for (const [a, b, br] of rows) { let x = -r() * 60; while (x < w) { const bw = br ? 60 + r() * 20 : 100 + r() * 90; g.fillStyle = rgb(ton(r, br ? [128, 84, 68] : [170, 166, 152], br ? 0.14 : 0.08)); g.fillRect(x + 2, a * h + 2, bw - 4, (b - a) * h - 4); x += bw; } } kirlet(g, w, h, r); };
const kiremitP = (g, w, h, r) => { g.fillStyle = '#3a2c24'; g.fillRect(0, 0, w, h); for (let row = 0; row < 12; row++) for (let c = 0; c < 14; c++) { const x = (c / 14) * w, y = (row / 12) * h, t = ton(r, [140, 92, 72], 0.2), gr = g.createLinearGradient(x, 0, x + w / 14, 0); gr.addColorStop(0, rgb(t.map((v) => v * 0.6))); gr.addColorStop(0.5, rgb(t)); gr.addColorStop(1, rgb(t.map((v) => v * 0.62))); g.fillStyle = gr; g.fillRect(x + 1, y, w / 14 - 2, h / 12 - 3); } lekele(g, w, h, r, 90, '30,26,22', 0.3, 0.08); lekele(g, w, h, r, 50, '86,96,60', 0.2, 0.06); lekele(g, w, h, r, 40, '190,180,160', 0.1, 0.05); };
const kursunP = (g, w, h, r) => { g.fillStyle = '#74787a'; g.fillRect(0, 0, w, h); lekele(g, w, h, r, 120, '40,44,46', 0.22, 0.12); lekele(g, w, h, r, 70, '190,196,196', 0.12, 0.1); for (let k = 0; k < 5; k++) { const x = (k / 5) * w; g.fillStyle = 'rgba(36,40,42,0.7)'; g.fillRect(x, 0, 4, h); g.fillStyle = 'rgba(170,176,176,0.5)'; g.fillRect(x + 4, 0, 4, h); } yagmurIzi(g, w, h, r, 12, 0.3); };
const bez = (base, serit) => (g, w, h, r) => { g.fillStyle = rgb(base); g.fillRect(0, 0, w, h); if (serit) { g.fillStyle = rgb(serit); for (let k = 0; k < 4; k++) g.fillRect((k / 4) * w, 0, w / 8, h); } for (let k = 0; k < 3000; k++) { g.fillStyle = r() < 0.5 ? 'rgba(60,50,36,0.1)' : 'rgba(255,250,235,0.1)'; g.fillRect(r() * w, r() * h, 1, 3 + r() * 8); } lekele(g, w, h, r, 60, '70,56,36', 0.14); };
const kaldirim = (g, w, h, r) => { g.fillStyle = '#4a4034'; g.fillRect(0, 0, w, h); for (let row = 0; row < 12; row++) for (let c = 0; c < 12; c++) { const x = (c + (row % 2 ? 0.5 : 0)) * (w / 12) + (r() - 0.5) * 8, y = (row + 0.5) * (h / 12) + (r() - 0.5) * 8; for (const dx of [-w, 0, w]) { const gr = g.createRadialGradient(x + dx - 4, y - 4, 2, x + dx, y, 24); const c0 = ton(r, [150, 142, 128], 0.14); gr.addColorStop(0, rgb(c0.map((v) => Math.min(255, v * 1.15)))); gr.addColorStop(1, rgb(c0.map((v) => v * 0.7))); g.fillStyle = gr; g.beginPath(); g.ellipse(x + dx, y, 17 + r() * 4, 15 + r() * 4, r() * 3, 0, 7); g.fill(); } } lekele(g, w, h, r, 60, '30,24,16', 0.2); };
const M = K.materials('sehir', {
  temel_tas: [moloz([104, 100, 92])], moloz_tas: [moloz([138, 134, 124])], beyaz_tas: [moloz([174, 170, 158])], kesme_tas: [tasBlok([158, 154, 142], 7)], kirec_tasi: [tasBlok([164, 160, 146], 4, '#4a463c', 0.2)],
  almasik_duvar: [almasik], tugla: [(g, w, h, r) => { tuglaCiz(g, 0, 0, w, h, r); lekele(g, w, h, r, 80, '40,30,20', 0.16); }],
  siva_beyaz: [siva([196, 190, 174])], siva_asi: [siva([174, 150, 106])], siva_krem: [siva([188, 176, 148], 6)], siva_hardal: [siva([164, 138, 88])], siva_pembe: [siva([176, 150, 138])], siva_kirli: [siva([166, 160, 144], 5)],
  yarim_ahsap: [yarimAhsap],
  ahsap_koyu: [ahsap([74, 58, 46])], ahsap_gri: [ahsap([110, 104, 96])], ahsap_kirmizi: [ahsap([102, 58, 50])], ahsap_mavi: [ahsap([110, 120, 124])], ahsap_katran: [ahsap([50, 42, 36])], ahsap_asi: [ahsap([150, 130, 94])], ahsap_kizil: [ahsap([90, 56, 46])], ahsap_gumus: [ahsap([130, 128, 122])], ahsap_yama: [(g, w, h, r) => { ahsap([110, 92, 72])(g, w, h, r); for (let k = 0; k < 7; k++) { g.fillStyle = rgb(ton(r, [[70, 54, 40], [150, 130, 100], [96, 84, 76]][k % 3], 0.1)); g.fillRect(r() * w, r() * h, 60 + r() * 90, 50 + r() * 120); } }],
  kereste: [ahsap([84, 64, 46], true)], tahta: [ahsap([134, 112, 84], true)],
  kiremit: [kiremitP], kursun: [kursunP], tas_koyu: [tasBlok([124, 120, 110], 8, '#3c3830', 0.3)], tas_sove: [tasBlok([184, 180, 166], 3, '#6a665a', 0.3)], bez_krem: [bez([214, 200, 166])], bez_cizgili: [bez([224, 214, 190], [160, 60, 48])], bez_yamali: [(g, w, h, r) => { bez([188, 170, 134])(g, w, h, r); for (let k = 0; k < 6; k++) { g.fillStyle = rgb(ton(r, [[150, 120, 90], [200, 190, 160], [130, 110, 100]][k % 3], 0.1)); const x = r() * w, y = r() * h; g.fillRect(x, y, 70 + r() * 80, 60 + r() * 80); g.strokeStyle = 'rgba(40,30,20,0.6)'; g.setLineDash([6, 5]); g.strokeRect(x, y, 100, 90); g.setLineDash([]); } }],
  kaldirim: [kaldirim],
  pencere_giyotin: [PEN('giyotin', [168, 162, 148]), 256, 384], pencere_koyu: [PEN('giyotin', [70, 54, 40]), 256, 384], pencere_kafes: [PEN('kafes', [84, 64, 46], [140, 110, 78]), 256, 384], pencere_kafes_beyaz: [PEN('kafes', [168, 162, 148], [124, 104, 80]), 256, 384],
  pencere_cok: [PEN('cok', [84, 64, 46]), 384, 384], pencere_sebeke: [(g, w, h) => { g.fillStyle = '#14171a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#a8a494'; g.lineWidth = w * 0.035; const R = w / 8; for (let rI = -1; rI < 14; rI++) for (let c = -1; c < 7; c++) { const x = c * R * 1.732 + (rI % 2 ? R * 0.866 : 0), y = rI * R * 1.5; g.beginPath(); for (let k = 0; k <= 6; k++) g.lineTo(x + Math.sin((k / 6) * TAU) * R, y + Math.cos((k / 6) * TAU) * R); g.stroke(); } g.strokeStyle = '#8f8b7c'; g.lineWidth = w * 0.06; g.strokeRect(0, 0, w, h); }, 256, 384], bayrak: [(g, w, h, r) => { const G = h; g.fillStyle = '#c0161d'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4f1ea'; g.beginPath(); g.arc(0.5 * G, 0.5 * G, 0.25 * G, 0, 7); g.fill(); g.fillStyle = '#c0161d'; g.beginPath(); g.arc(0.5625 * G, 0.5 * G, 0.2 * G, 0, 7); g.fill(); g.fillStyle = '#f4f1ea'; g.beginPath(); for (let k = 0; k < 10; k++) { const a = Math.PI + (k / 10) * TAU, rr = (k % 2 ? 0.048 : 0.125) * G; g.lineTo(0.76 * G + Math.cos(a) * rr, 0.5 * G + Math.sin(a) * rr); } g.fill(); for (let k = 0; k < 500; k++) { g.fillStyle = r() < 0.5 ? 'rgba(40,10,10,0.1)' : 'rgba(255,220,200,0.06)'; g.fillRect(r() * w, r() * h, 2 + r() * 14, 1); } }, 384, 256], pencere_parmak: [PEN('parmak', [90, 84, 74]), 256, 256],
  kepenk_yesil: [PEN('kepenk', [60, 52, 40], [82, 104, 86]), 256, 384], kepenk_mavi: [PEN('kepenk', [168, 162, 148], [100, 112, 118]), 256, 384], kepenk_kahve: [PEN('kepenk', [60, 46, 34], [88, 70, 54]), 256, 384],
  kapi_ahsap: [PEN('kapi', [0, 0, 0], [72, 58, 46]), 256, 512], kapi_cift: [PEN('cift', [0, 0, 0], [64, 52, 42]), 256, 384], kapi_civili: [PEN('civili', [0, 0, 0], [56, 46, 38]), 256, 384], kepenk_dukkan: [PEN('dukkan', [0, 0, 0], [90, 78, 64]), 384, 256],
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
    const F = yuz(V(0, 0, z1), V(0, 0, 1)), ops = acik(k.k || [], y), kagir = !/ahsap/.test(mat), sm = kagir ? 'tas_sove' : 'kereste';
    cephe(P, F, W, [[y, y + h, mat, 3]], ops);
    if (kagir) { // taş söve: açıklığın çevresinde öne çıkan çerçeve (kemerliyse kemeri izler); köşe taşları
      for (const o of ops) if (o.fill !== 'karanlik' || o.rise) { const hwO = (o.u1 - o.u0) / 2, top = o.ys + (o.rise || 0), kapi = o.y0 - y < 0.2; cephe(P, yuz(V((o.u0 + o.u1) / 2, 0, z1 + 0.05), V(0, 0, 1)), hwO * 2 + 0.34, [[kapi ? y : o.y0 - 0.14, top + 0.18, 'tas_sove', 1.5]], [{ ...o, u0: -hwO, u1: hwO, depth: 0.05, fill: null, reveal: 'tas_sove' }]); if (!kapi) kup(P, 'tas_sove', o.u0 - 0.24, o.u1 + 0.24, o.y0 - 0.2, o.y0 - 0.1, z1, z1 + 0.11, '-z', 1.5); }
      for (const sg of [-1, 1]) kup(P, 'tas_sove', sg > 0 ? hw - 0.32 : -hw, sg > 0 ? hw : -hw + 0.32, y, y + h, z1, z1 + 0.045, '-z-y+y', 1.5);
    } else sove(P, F, ops);
    if (i === 0) kup(P, kagir ? 'tas_sove' : 'temel_tas', -hw, hw, 0, 0.42, z1, z1 + 0.07, '-z-y', 1.5); // su basman
    if (i < s.kat.length - 1 && !(s.kat[i + 1].c)) kup(P, sm, -hw, hw, y + h - 0.09, y + h + 0.09, z1, z1 + 0.08, '-z', 1.5); // kat silmesi
    for (const sg of [-1, 1]) {
      const yan = sg > 0 ? k.sag : k.sol;
      if (yan) { const Fy = yuz(V(sg * hw, 0, (z1 - D) / 2), V(sg, 0, 0)), oy = acik(yan, y); cephe(P, Fy, z1 + D, [[y, y + h, mat, 3]], oy); sove(P, Fy, oy); }
      else dortgen(P, k.yan || mat, [V(sg * hw, y, -D), V(sg * hw, y, z1), V(sg * hw, y + h, z1), V(sg * hw, y + h, -D)], V(sg, 0, 0));
    }
    if (k.arkaK) cephe(P, yuz(V(0, 0, -D), V(0, 0, -1)), W, [[y, y + h, mat, 3]], acik(k.arkaK, y)); else dortgen(P, k.arka || mat, [V(-hw, y, -D), V(hw, y, -D), V(hw, y + h, -D), V(-hw, y + h, -D)], V(0, 0, -1));
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
  const H = y, zf = on + (s.sacak ?? 0.9), zb = -D, rz = (pr + zb) / 2, rh = (zf - zb) * (s.cati ?? 0.17), topMat = katlar[katlar.length - 1].mat, cm = s.catiMat || 'kiremit';
  { // saçak altı korniş: kuşak ve dişler
    const kagir = !/ahsap/.test(topMat), km = kagir ? 'tas_sove' : 'kereste';
    kup(P, km, -hw, hw, H - 0.22, H - 0.02, pr, pr + 0.12, '-z', 1.5);
    for (let x = -hw + 0.1; x < hw - 0.2; x += 0.34) kup(P, km, x, x + 0.14, H - 0.36, H - 0.22, pr, pr + 0.1, '-z+y', 1.5);
  }
  const yOn = (z) => H + rh * (z > rz ? (zf - z) / (zf - rz) : (z - zb) / (rz - zb));
  const sag = s.sarkma ? 0.12 : 0; // çökmüş mahya
  for (let q = 0; q < 4; q++) { const xa = -hw + (W * q) / 4, xb = -hw + (W * (q + 1)) / 4, ya = H + rh - sag * Math.sin((q / 4) * Math.PI), yb = H + rh - sag * Math.sin(((q + 1) / 4) * Math.PI); P.quad(cm, [V(xa, H, zf), V(xb, H, zf), V(xb, yb, rz), V(xa, ya, rz)], [[xa / 1.5, 0], [xb / 1.5, 0], [xb / 1.5, (zf - rz) / 1.3], [xa / 1.5, (zf - rz) / 1.3]], V(0, 1, 0.5)); P.quad(cm, [V(xb, H, zb), V(xa, H, zb), V(xa, ya, rz), V(xb, yb, rz)], [[xb / 1.5, 0], [xa / 1.5, 0], [xa / 1.5, (rz - zb) / 1.3], [xb / 1.5, (rz - zb) / 1.3]], V(0, 1, -0.5)); }
  for (const sg of [-1, 1]) { const x = sg * hw; P.quad(topMat, [V(x, H, zb), V(x, H, pr), V(x, yOn(pr), pr), V(x, H + rh, rz)], [[zb / 3, H / 3], [pr / 3, H / 3], [pr / 3, yOn(pr) / 3], [rz / 3, (H + rh) / 3]], V(sg, 0, 0)); P.tri('kereste', [V(x, H, pr), V(x, H, zf), V(x, yOn(pr), pr)], K.FLAT.slice(0, 3), V(sg, 0, 0)); }
  dortgen(P, 'kereste', [V(-hw, H, pr), V(hw, H, pr), V(hw, H, zf), V(-hw, H, zf)], V(0, -1, 0), 1.5);
  dortgen(P, 'kereste', [V(-hw, H - 0.02, zf), V(hw, H - 0.02, zf), V(hw, H + 0.12, zf), V(-hw, H + 0.12, zf)], V(0, 0, 1), 1.5);
  for (const [bx, bz, bh = 1.3] of s.baca || []) { const y0 = yOn(bz) - 0.3; kup(P, 'tugla', bx - 0.28, bx + 0.28, y0, y0 + bh, bz - 0.28, bz + 0.28, '-y', 1.5); kup(P, 'kesme_tas', bx - 0.34, bx + 0.34, y0 + bh, y0 + bh + 0.1, bz - 0.34, bz + 0.34, '', 1.5); }
  if (s.ek) s.ek(P, { katlar, H, zf, on, hw, yOn });
}

// ---------- Küçük yapı parçaları ----------
// Basamaklar: z0'dan -Z'ye doğru yükselir (ya da dx verilirse X boyunca). Yanları yere kadar kapalı.
function basamak(P, mat, x0, x1, n, rise, run, z0 = 0, y0 = 0, base = y0) {
  for (let k = 0; k < n; k++) kup(P, mat, x0, x1, base, y0 + (k + 1) * rise, z0 - (k + 1) * run, z0 - k * run, '-y', 3);
}
function basamakX(P, mat, z0, z1, n, rise, run, x0, dir = 1, y0 = 0, base = y0) {
  for (let k = 0; k < n; k++) { const a = x0 + dir * k * run, b = x0 + dir * (k + 1) * run; kup(P, mat, Math.min(a, b), Math.max(a, b), base, y0 + (k + 1) * rise, z0, z1, '-y', 3); }
}
const balkonDemir = (P, x0, x1, y, z0, z1, h = 0.9) => { kup(P, 'kesme_tas', x0, x1, y - 0.12, y, z0, z1, '', 1.5); for (const [a, b] of [[V(x0, y, z1), V(x1, y, z1)], [V(x0, y, z0), V(x0, y, z1)], [V(x1, y, z0), V(x1, y, z1)]]) { K.beam(P, 'demir', a.clone().setY(y + h), b.clone().setY(y + h), 0.03, 0.04); const n = Math.max(2, Math.round(a.distanceTo(b) / 0.14)); for (let k = 0; k <= n; k++) { const q = a.clone().lerp(b, k / n); K.cyl(P, 'demir', q, q.clone().setY(y + h), 0.009, 4, false); } } };
const balkonAhsap = (P, x0, x1, y, z0, z1, h = 0.9) => { kup(P, 'tahta', x0, x1, y - 0.1, y, z0, z1, '', 1.5); for (const [a, b] of [[V(x0, y, z1), V(x1, y, z1)], [V(x0, y, z0), V(x0, y, z1)], [V(x1, y, z0), V(x1, y, z1)]]) { K.beam(P, 'kereste', a.clone().setY(y + h), b.clone().setY(y + h), 0.06, 0.07); K.beam(P, 'kereste', a.clone().setY(y + 0.15), b.clone().setY(y + 0.15), 0.05, 0.05); const n = Math.max(2, Math.round(a.distanceTo(b) / 0.2)); for (let k = 0; k <= n; k++) { const q = a.clone().lerp(b, k / n); K.beam(P, 'kereste', q, q.clone().setY(y + h), 0.04, 0.04, false); } } for (const x of [x0 + 0.1, x1 - 0.1]) K.beam(P, 'kereste', V(x, y - 0.6, z0), V(x, y - 0.1, z1 - 0.1), 0.09, 0.08); };
const direk = (P, x, z, y0, y1, t = 0.12, mat = 'kereste') => kup(P, mat, x - t / 2, x + t / 2, y0, y1, z - t / 2, z + t / 2, '-y', 1.5);
// Eğimli örtü (tente, sundurma): duvardan (z0, y1) öne (z1, y0) iner; sag: ortadaki sarkma
function ortu(P, mat, x0, x1, z0, y1, z1, y0, sag = 0, s = 1.5) { const nx = sag ? 4 : 1, nz = sag ? 3 : 1; for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const pt = (a, b) => { const x = x0 + (x1 - x0) * a, t = b; return V(x, y1 + (y0 - y1) * t - sag * Math.sin(a * Math.PI) * Math.sin(t * Math.PI), z0 + (z1 - z0) * t); }; const q = [pt(i / nx, j / nz), pt((i + 1) / nx, j / nz), pt((i + 1) / nx, (j + 1) / nz), pt(i / nx, (j + 1) / nz)]; P.quad(mat, q, [[i / nx * (x1 - x0) / s, j / nz], [(i + 1) / nx * (x1 - x0) / s, j / nz], [(i + 1) / nx * (x1 - x0) / s, (j + 1) / nz], [i / nx * (x1 - x0) / s, (j + 1) / nz]], V(0, 1, 0.3)); } }

// ---------- 32 ev ----------
const KAF = 'pencere_kafes', GIY = 'pencere_giyotin', YES = 'kepenk_yesil';
const ust2 = (ops) => [...ops, ...ops.map((o) => ({ ...o, y0: o.y0 + 3 }))]; // iki kat boyunca süren cumbada pencereler
const EVLER = {
  // A. Dar cepheli sıra evler
  ev_01: { w: 4, d: 7, sacak: 0.9, kat: [{ m: 'moloz_tas', k: [kp(0, 1.1, 2.25, 'kapi_ahsap', 'yuvarlak', 0.5)] }, { m: 'ahsap_koyu', c: 0.6, k: sira(2, 1.8, 0.8, 1.7, KAF) }] },
  ev_02: { w: 4.5, d: 7, sacak: 1.0, kat: [{ m: 'beyaz_tas', k: [kp(-1.1, 1.0, 1.85), pn(1.1, 0.6, 0.7, 'pencere_parmak', 1.3)] }, { m: 'siva_kirli', k: sira(2, 3.2, 0.6, 1.6, GIY, 0.8, 'yuvarlak', 0.3) }], cumba: [{ u: 0, w: 1.8, c: 0.65, kat: [1], m: 'ahsap_gri', k: sira(2, 0.8, 0.6, 1.5, KAF) }] },
  ev_03: { w: 4, d: 8, sacak: 1.2, kat: [{ m: 'moloz_tas', k: [kp(-0.9, 1.0, 2.0), pn(1.0, 0.6, 0.8, 'pencere_parmak', 1.2)] }, { m: 'ahsap_gri', c: 0.45, k: sira(3, 2.6, 0.6, 1.6, KAF) }, { m: 'ahsap_gri', c: 0.45, k: sira(3, 2.6, 0.6, 1.6, KAF) }] },
  ev_04: { w: 5, d: 7, kat: [{ m: 'almasik_duvar', k: [kp(-1.3, 1.0, 2.1), pn(1.1, 0.8, 1.0, 'pencere_parmak', 1.1)] }, { m: 'yarim_ahsap', c: 0.4, k: sira(2, 2.4, 0.9, 1.5, YES) }] },
  ev_05: { w: 4.5, d: 8, baca: [[1.4, -5]], kat: [{ m: 'kesme_tas', k: [kp(0, 1.5, 2.3, 'kapi_cift')] }, { m: 'ahsap_kirmizi', c: 0.3, k: sira(2, 3.3, 0.6, 1.6, GIY) }, { m: 'ahsap_kirmizi', k: sira(2, 3.3, 0.6, 1.6, GIY) }], cumba: [{ u: 0, w: 1.7, c: 0.6, kat: [1, 2], k: ust2([pn(0, 1.1, 1.6, GIY)]) }] },
  ev_06: { w: 4, d: 6, sarkma: true, sacak: 0.6, kat: [{ m: 'moloz_tas', h: 2.7, k: [kp(-0.8, 0.95, 1.9)] }, { m: 'ahsap_yama', h: 2.6, c: 0.3, destek: 2, k: [pn(-1.0, 0.6, 0.9, 'pencere_koyu', 1.0)] }], cumba: [{ u: 0.7, w: 1.3, c: 0.45, kat: [1], alt: 0.8, ust: 0.5, cati: true, k: [pn(0, 0.8, 1.0, KAF, 1.0)] }] },
  ev_07: { w: 5, d: 8, sacak: 1.1, kat: [{ m: 'kesme_tas', k: [kp(-1.2, 1.2, 2.5, 'kapi_cift', 'yuvarlak', 0.6), pn(1.2, 0.9, 1.3, 'pencere_parmak', 1.0)] }, { m: 'kesme_tas', k: sira(3, 3.2, 0.75, 1.9, GIY, 0.7, 'yuvarlak', 0.38) }, { m: 'kesme_tas', k: sira(3, 3.2, 0.75, 1.9, GIY, 0.7, 'yuvarlak', 0.38) }], catiMat: 'kursun' },
  ev_08: { w: 4.5, d: 7, kat: [{ m: 'siva_krem', k: [kp(0, 1.2, 2.5, 'kapi_cift', 'yuvarlak', 0.6)] }, { m: 'siva_krem', k: sira(3, 3.0, 0.7, 1.7, GIY, 0.8, 'yuvarlak', 0.35) }], ek: (P) => { basamak(P, 'kirec_tasi', -0.9, 0.9, 2, 0.01, 0.01, 0.6); kup(P, 'kirec_tasi', -1.0, 1.0, 0, 0.16, 0, 0.6, '-y'); kup(P, 'kirec_tasi', -0.8, 0.8, 0.16, 0.3, 0, 0.3, '-y'); balkonDemir(P, -0.7, 0.7, 3.75, 0, 0.5, 0.85); } },
  ev_09: { w: 4, d: 9, sacak: 1.0, cati: 0.14, kat: [{ m: 'ahsap_katran', k: [kp(-1.0, 1.0, 2.1)] }, { m: 'ahsap_katran', k: sira(2, 3.0, 0.5, 1.5, KAF) }, { m: 'ahsap_katran', k: sira(2, 3.0, 0.5, 1.5, KAF) }], cumba: [{ u: 0, w: 2.2, c: 0.7, kat: [1, 2], k: ust2(sira(2, 1.0, 0.7, 1.6, KAF)) }], ek: (P) => kup(P, 'moloz_tas', -2, 2, 0, 1, -0.02, 0.06, '-y-z') },
  ev_10: { w: 5, d: 7, kat: [{ m: 'moloz_tas', k: [kp(0.7, 2.3, 2.4, 'kapi_cift')] }, { m: 'siva_hardal', k: sira(2, 1.6, 0.8, 1.6, KAF).map((o) => ({ ...o, u: o.u + 1.2 })) }], cumba: [{ u: -1.55, w: 1.8, c: 0.6, kat: [1], k: [pn(0, 1.1, 1.6, KAF)] }] },
  // B. Dükkânlı evler
  ev_11: { w: 5, d: 8, kat: [{ m: 'kesme_tas', k: [{ u: 0, w: 3.6, y0: 0.02, h: 2.5, fill: 'karanlik', depth: 0.6 }] }, { m: 'ahsap_koyu', c: 0.6, k: sira(2, 2.4, 0.9, 1.6, KAF) }], ek: (P) => { kup(P, 'tahta', -1.8, 1.8, 0, 0.9, -0.5, -0.1, '-y'); kup(P, 'tahta', -1.85, 1.85, 0.9, 0.96, -0.55, 0.25, ''); ortu(P, 'kepenk_dukkan', -1.8, 1.8, 0, 2.55, 1.3, 2.1, 0, 3.6); for (const x of [-1.7, 1.7]) K.beam(P, 'kereste', V(x, 1.6, 0), V(x, 2.15, 1.2), 0.05, 0.05); } },
  ev_12: { w: 6, d: 8, sacak: 1.1, kat: [{ m: 'kesme_tas', k: [-1.5, 1.5].map((u) => kp(u, 2.2, 2.7, 'kepenk_dukkan', 'yuvarlak', 0.75)) }, { m: 'kesme_tas', k: sira(5, 4.8, 0.6, 1.5, GIY, 0.9, 'yuvarlak', 0.3) }] },
  ev_13: { w: 5, d: 7, kat: [{ m: 'moloz_tas', k: [{ u: 0, w: 3.4, y0: 0.6, h: 1.8, fill: 'karanlik', depth: 0.5 }] }, { m: 'siva_asi', k: sira(2, 2.6, 0.9, 1.6, YES) }, { m: 'ahsap_koyu', c: 0.5, k: sira(3, 3.2, 0.7, 1.6, KAF) }], ek: (P) => { ortu(P, 'tahta', -2.3, 2.3, 0, 2.9, 1.6, 2.3, 0); for (const x of [-2.1, 2.1]) direk(P, x, 1.5, 0, 2.32, 0.1); kup(P, 'tahta', -1.7, 1.7, 0.5, 0.62, -0.1, 0.3, ''); } },
  ev_14: { w: 4.5, d: 7, kat: [{ m: 'moloz_tas', h: 2.6, k: [{ u: 0, w: 3.0, y0: 0.5, h: 1.75, fill: 'karanlik', depth: 0.5 }] }, { m: 'siva_kirli', h: 2.6, k: sira(2, 2.2, 0.7, 1.0, 'pencere_koyu', 1.0) }], ek: (P) => { kup(P, 'kereste', -1.75, 1.75, 2.25, 2.5, -0.02, 0.08, '-z'); for (const x of [-1.62, 1.62]) kup(P, 'kereste', x - 0.12, x + 0.12, 0.5, 2.25, -0.02, 0.08, '-z'); kup(P, 'kirec_tasi', -1.75, 1.75, 0.3, 0.5, -0.3, 0.2, ''); } },
  ev_15: { w: 6, d: 9, sacak: 1.0, kat: [{ m: 'ahsap_gri', k: [pn(-2.1, 1.4, 1.9, 'pencere_cok', 0.6), kp(0, 1.1, 2.2, 'kapi_cift'), pn(2.1, 1.4, 1.9, 'pencere_cok', 0.6)] }, { m: 'ahsap_koyu', c: 0.6, destek: 4, k: sira(6, 5.0, 0.7, 1.5, KAF) }], ek: (P) => { ortu(P, 'kiremit', -1.6, 1.6, 0.6, 2.95, 2.0, 2.5, 0); for (const x of [-1.5, -0.5, 0.5, 1.5]) direk(P, x, 1.9, 0, 2.5, 0.09); } },
  ev_16: { w: 5, d: 8, baca: [[-1.5, -4, 2.8]], kat: [{ m: 'almasik_duvar', k: [{ ...kp(-1.0, 1.7, 2.1, 'karanlik', 'yuvarlak', 0.85), depth: 0.5, reveal: 'tugla' }, { ...pn(1.4, 0.9, 0.9, 'karanlik', 1.1), depth: 0.4 }] }, { m: 'siva_pembe', k: sira(2, 2.6, 0.9, 1.5, YES) }], ek: (P) => kup(P, 'kirec_tasi', 0.85, 1.95, 1.0, 1.1, -0.05, 0.3, '') },
  // C. Konaklar
  ev_17: { w: 9, d: 10, sacak: 1.3, kat: [{ m: 'kesme_tas', k: [kp(0, 2.0, 2.8, 'kapi_civili', 'yuvarlak', 0.9), ...[-3.2, 3.2].map((u) => pn(u, 0.8, 1.2, 'pencere_parmak', 1.2))] }, { m: 'kesme_tas', k: [-2.3, -1.6, 1.6, 2.3].map((u) => pn(u, 0.55, 1.9, GIY, 0.7, 'yuvarlak', 0.28)) }, { m: 'kesme_tas', k: [-2.3, -1.6, 1.6, 2.3].map((u) => pn(u, 0.55, 1.9, GIY, 0.7, 'yuvarlak', 0.28)) }], catiMat: 'kursun', cumba: [{ u: 0, w: 2.8, c: 0.7, kat: [1, 2], m: 'kesme_tas', k: ust2(sira(3, 1.8, 0.6, 1.9, GIY, 0.7, 'yuvarlak', 0.3)) }, ...[-3.6, 3.6].map((u) => ({ u, w: 1.5, c: 0.45, kat: [1, 2], m: 'kesme_tas', k: ust2([pn(0, 0.8, 1.9, GIY, 0.7, 'yuvarlak', 0.4)]) }))] },
  ev_18: { w: 8, d: 9, sacak: 1.0, kat: [{ m: 'kesme_tas', k: [kp(0, 1.5, 2.4, 'kapi_cift'), ...[-2.7, 2.7].map((u) => pn(u, 0.9, 1.4, GIY, 1.0))] }, { m: 'ahsap_kizil', k: [-2.9, -1.9, 1.9, 2.9].map((u) => pn(u, 0.7, 1.7, GIY)) }, { m: 'ahsap_kizil', k: [-2.9, -1.9, 1.9, 2.9].map((u) => pn(u, 0.7, 1.7, GIY)) }], cumba: [{ u: 0, w: 2.6, c: 0.7, kat: [1, 2], k: ust2(sira(2, 1.2, 0.8, 1.7, GIY)) }], ek: (P, b) => { P.tri('ahsap_kizil', [V(-1.5, 9, 0.72), V(1.5, 9, 0.72), V(0, 10, 0.72)], [[0, 0], [1, 0], [0.5, 0.33]], V(0, 0, 1)); for (const s of [-1, 1]) K.beam(P, 'pencere_giyotin', V(s * 1.55, 9, 0.75), V(0, 10.05, 0.75), 0.1, 0.1); } },
  ev_19: { w: 10, d: 9, sacak: 1.2, catiMat: 'kursun', kat: [{ m: 'moloz_tas', h: 3.4, k: [kp(-2.8, 1.8, 2.6, 'kapi_civili'), ...[0.5, 2.3, 4.0].map((u) => pn(u, 0.5, 0.5, 'pencere_parmak', 2.3))] }, { m: 'siva_beyaz', c: 0.3, destek: 6, k: [-4.3, -1.3, 0, 1.3, 4.3].map((u) => pn(u, 0.6, 1.5, 'pencere_kafes_beyaz')) }], cumba: [-2.8, 2.8].map((u) => ({ u, w: 1.9, c: 0.5, kat: [1], k: sira(2, 0.9, 0.6, 1.5, 'pencere_kafes_beyaz') })) },
  ev_20: { w: 8, d: 10, catiMat: 'kursun', baca: [[2.6, -6, 1.6]], kat: [{ m: 'almasik_duvar', k: [kp(0, 1.5, 2.6, 'kapi_cift', 'yuvarlak', 0.7), ...[-2.6, 2.6].map((u) => pn(u, 0.9, 1.6, GIY, 0.9, 'yuvarlak', 0.4))] }, { m: 'almasik_duvar', k: [-2.9, -1.0, 1.0, 2.9].map((u) => pn(u, 0.8, 1.7, GIY, 0.8, 'yuvarlak', 0.4)).map((o) => ({ ...o, reveal: 'kesme_tas' })) }, { m: 'almasik_duvar', k: [-2.9, 2.9].map((u) => pn(u, 0.8, 1.7, GIY, 0.8, 'yuvarlak', 0.4)) }], cumba: [{ u: 0, w: 2.4, c: 0.6, kat: [2], m: 'ahsap_koyu', k: sira(2, 1.1, 0.7, 1.6, KAF) }], ek: (P, b) => halka(P, 'kesme_tas', [[0.34, b.yOn(-6) + 1.4], [0.3, b.yOn(-6) + 1.6], [0.16, b.yOn(-6) + 1.78], [0, b.yOn(-6) + 1.84]], 8, 0, 1, 2.6, -6) },
  // D. Kıyı evleri ve yalılar
  ev_21: { w: 8, d: 9, sacak: 1.2, kat: [{ m: 'ahsap_gumus', k: [kp(0, 1.4, 2.3, 'kapi_cift'), ...[-2.8, -1.5, 1.5, 2.8].map((u) => pn(u, 0.7, 1.7, 'kepenk_kahve', 0.8))] }, { m: 'ahsap_gumus', k: [-0.5, 0.5].map((u) => pn(u, 0.7, 1.8, 'kepenk_kahve', 0.8)) }, { m: 'ahsap_gumus', k: [-0.5, 0.5].map((u) => pn(u, 0.7, 1.8, 'kepenk_kahve', 0.8)) }], cumba: [-2.6, 2.6].map((u) => ({ u, w: 2.2, c: 0.6, kat: [1, 2], k: ust2(sira(2, 1.0, 0.7, 1.8, 'kepenk_kahve', 0.8)) })), ek: (P) => kup(P, 'kesme_tas', -4, 4, 0, 0.6, -0.02, 0.08, '-y-z') },
  ev_22: { w: 7, d: 8, kat: [{ m: 'siva_asi', k: [{ u: -1.2, w: 3.2, y0: 0.7, h: 1.7, fill: 'pencere_cok', depth: 0.1 }, kp(2.2, 1.1, 2.2, 'kapi_cift')] }, { m: 'siva_asi', k: [pn(0, 1.0, 2.1, GIY, 0.1)] }, { m: 'siva_asi', k: [pn(0, 1.0, 2.1, GIY, 0.1)] }], cumba: [-2.3, 2.3].map((u) => ({ u, w: 1.9, c: 0.55, kat: [1, 2], m: 'siva_beyaz', k: ust2([pn(0, 1.1, 1.7, GIY)]) })), ek: (P) => { ortu(P, 'bez_cizgili', -3.0, 0.7, 0, 2.75, 1.6, 2.15, 0.12, 0.8); for (const x of [-2.9, 0.6]) K.beam(P, 'kereste', V(x, 1.7, 0), V(x, 2.15, 1.55), 0.04, 0.04); for (const y of [3, 6]) balkonAhsap(P, -0.9, 0.9, y + 0.1, 0, 0.6, 0.85); } },
  ev_23: { w: 6, d: 8, sarkma: true, kat: [{ m: 'ahsap_katran', k: [kp(0, 3.2, 2.5, 'kapi_cift')] }, { m: 'ahsap_katran', k: [pn(-1.4, 0.9, 2.0, 'pencere_koyu', 0.1), pn(1.6, 0.8, 1.2, 'pencere_koyu', 1.0)] }], ek: (P) => balkonAhsap(P, -2.3, -0.5, 3.1, 0, 0.8, 0.9) },
  ev_24: { w: 9, d: 9, kat: [{ m: 'kesme_tas', h: 3.4, k: [-2.9, 0, 2.9].map((u) => ({ ...kp(u, 2.1, 3.0, 'karanlik', 'yuvarlak', 1.0), depth: 1.2, reveal: 'kesme_tas' })) }, { m: 'kesme_tas', k: sira(4, 6.6, 0.9, 1.8, GIY, 0.8, 'yuvarlak', 0.45) }, { m: 'siva_kirli', k: [-3.3, -1.1, 3.3].map((u) => pn(u, 0.9, 1.6, YES)).concat([{ ...kp(1.1, 1.2, 2.2, 'kapi_cift'), y0: 0.1 }]) }], ek: (P, b) => { K.beam(P, 'kereste', V(1.1, 9.1, -0.3), V(1.1, 9.1, 1.5), 0.16, 0.14); K.cyl(P, 'demir', V(1.0, 8.9, 1.35), V(1.2, 8.9, 1.35), 0.1, 8); K.cyl(P, 'kereste', V(1.1, 8.9, 1.35), V(1.1, 6.6, 1.35), 0.012, 4, false); } },
  // E. Yamaç ve köşe evleri
  ev_25: { w: 6, d: 6, kat: [{ m: 'moloz_tas', k: [kp(-1.5, 1.0, 2.1), pn(1.2, 0.8, 1.0, 'pencere_parmak', 1.2)], sag: [pn(0, 0.8, 1.0, 'pencere_parmak', 1.2)] }, { m: 'ahsap_koyu', c: 0.5, k: [pn(-1.6, 0.8, 1.6, KAF), pn(-0.2, 0.8, 1.6, KAF)], sag: sira(2, 2.6, 0.8, 1.6, KAF) }], cumba: [{ u: 2.1, w: 1.8, c: 0.55, kat: [1], k: [pn(0, 1.1, 1.6, KAF)] }], ek: (P) => kup(P, 'kesme_tas', 1.6, 3.0, 2.2, 3.0, 0.5, 1.0, '-z') },
  ev_26: { w: 6, d: 6, kat: [{ m: 'kesme_tas', k: [kp(-2.1, 1.1, 2.2, 'kapi_cift'), pn(1.0, 1.4, 1.4, 'pencere_cok', 0.9)], sol: [pn(0.5, 1.2, 1.4, 'pencere_cok', 0.9)] }, { m: 'ahsap_gri', c: 0.45, k: sira(3, 4.0, 0.8, 1.6, KAF), sol: sira(2, 2.8, 0.8, 1.6, KAF) }, { m: 'ahsap_gri', c: 0.3, k: sira(3, 4.0, 0.8, 1.6, KAF), sol: sira(2, 2.8, 0.8, 1.6, KAF) }] },
  ev_27: { w: 5, d: 7, kat: [{ m: 'temel_tas', k: [kp(1.6, 0.9, 1.6)] }, { m: 'kesme_tas', k: [kp(-1.6, 1.0, 2.1), pn(0.9, 0.8, 1.2, 'pencere_parmak', 1.1)] }, { m: 'ahsap_koyu', c: 0.5, k: sira(2, 2.6, 0.9, 1.6, KAF) }], ek: (P) => { basamakX(P, 'kirec_tasi', 0, 1.1, 12, 0.25, 0.3, 2.5, -1); kup(P, 'kirec_tasi', -2.5, -1.1, 0, 3, 0, 1.1, '-y'); } },
  ev_28: { w: 5, d: 7, sacak: 1.9, kat: [{ m: 'moloz_tas', k: [kp(1.4, 0.9, 1.9)] }, { m: 'siva_beyaz', k: [kp(-1.5, 0.95, 2.0), pn(0.6, 0.8, 1.4, 'pencere_koyu')] }, { m: 'yarim_ahsap', k: sira(2, 2.4, 0.8, 1.4, 'pencere_koyu') }], ek: (P) => { kup(P, 'tahta', -2.5, 2.5, 2.88, 3, 0, 1.4, ''); for (const x of [-2.4, -0.8, 0.8, 2.4]) direk(P, x, 1.3, 0, 9, 0.13); for (const y of [3.9, 6]) K.beam(P, 'kereste', V(-2.5, y, 1.3), V(2.5, y, 1.3), 0.08, 0.08); kup(P, 'tahta', -2.5, 2.5, 5.9, 6, 0, 1.4, ''); basamakX(P, 'tahta', 0.15, 1.2, 12, 0.25, 0.28, 2.4, -1, 0, 0); } },
  ev_29: { w: 7, d: 7, sacak: 1.0, baca: [[2.4, -4, 1.4]], kat: [{ m: 'moloz_tas', h: 2.8, k: [kp(0, 1.0, 1.9), ...[-2.2, 2.2].map((u) => pn(u, 0.8, 1.0, 'kepenk_kahve', 1.0))] }], ek: (P) => { for (const [a, b] of [[-3.5, -0.8], [0.8, 3.5]]) kup(P, 'moloz_tas', a, b, 0, 1.1, 2.0, 2.4, '-y'); for (const x of [-3.5, 3.1]) kup(P, 'moloz_tas', x, x + 0.4, 0, 1.1, 0, 2.0, '-y'); } },
  ev_30: { w: 4, d: 6, sacak: 0.7, kat: [{ m: 'moloz_tas', k: [kp(0, 1.0, 2.1)] }, { m: 'siva_kirli', k: [] }], cumba: [{ u: 0, w: 2.4, c: 0.6, kat: [1], m: 'ahsap_koyu', k: [pn(0, 1.3, 1.6, KAF)] }] },
  // F. Ek çeşitler
  ev_31: { w: 6, d: 6, kat: [{ m: 'kesme_tas', h: 3.5, k: [{ u: 0, w: 3, y0: 0, h: 2.2, rise: 1.0, tip: 'yuvarlak', fill: null, depth: 6, reveal: 'kesme_tas' }], arkaK: [{ u: 0, w: 3, y0: 0, h: 2.2, rise: 1.0, tip: 'yuvarlak', fill: null, depth: 0.02, reveal: 'kesme_tas' }] }, { m: 'ahsap_koyu', c: 0.3, k: sira(3, 3.8, 0.8, 1.6, KAF) }] },
};
// Yanmış, yıkık ev: yalnız taş zemin kat duvarları ve kömürleşmiş bir köşe kalmış
function harabe(P) {
  const hw = 2.5, D = 7, r = K.rng(32), t = 0.5;
  kup(P, 'temel_tas', -hw, hw, -1.5, 0, -D, 0, '+y-y', 2);
  const duvar = (x0, x1, z0, z1, hs) => { const n = hs.length, alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0); hs.forEach((h, i) => { if (h <= 0) return; const a = i / n, b = (i + 1) / n; if (alongX) kup(P, 'moloz_tas', x0 + (x1 - x0) * a, x0 + (x1 - x0) * b, 0, h, z0, z1, '-y'); else kup(P, 'moloz_tas', x0, x1, 0, h, z0 + (z1 - z0) * a, z0 + (z1 - z0) * b, '-y'); }); };
  duvar(-hw, hw, -t, 0, [2.6, 2.9, 0, 0, 2.2, 1.5, 0.9, 1.8]); // ön: kapı boşluğu
  duvar(-hw, hw, -D, -D + t, [1.2, 2.0, 2.8, 2.4, 1.6, 0.8, 1.4, 2.2]);
  duvar(-hw, -hw + t, -D + t, -t, [2.9, 3.0, 2.4, 1.6, 1.0, 1.9, 2.6]);
  duvar(hw - t, hw, -D + t, -t, [2.0, 1.2, 0.7, 1.5, 2.3, 2.8, 2.6]);
  for (const [x, z] of [[-hw + 0.25, -0.25], [-hw + 0.25, -2.4], [-0.6, -0.25]]) direk(P, x, z, 2.4, 5.2 - r(), 0.2, 'yanik');
  K.beam(P, 'yanik', V(-hw + 0.25, 4.4, -0.25), V(-hw + 0.25, 4.2, -2.4), 0.18, 0.16); K.beam(P, 'yanik', V(-hw + 0.25, 4.6, -0.25), V(-0.6, 4.3, -0.25), 0.18, 0.16);
  for (const [a, b] of [[V(-1.5, 0.2, -2), V(1.6, 1.7, -4.2)], [V(0.4, 0.15, -1.2), V(2.0, 0.9, -5.5)], [V(-1.8, 0.1, -5), V(0.2, 1.1, -3)]]) K.beam(P, 'yanik', a, b, 0.16, 0.14);
  for (let k = 0; k < 9; k++) { const x = (r() - 0.5) * 3.6, z = -0.8 - r() * 5.4, s = 0.35 + r() * 0.6; halka(P, k % 3 ? 'moloz_tas' : 'kiremit', [[s, 0], [s * 0.7, s * 0.45], [0, s * 0.6]], 6, r() * 3, 1, x, z); }
}
// ---------- Merdivenler ve yokuş parçaları (alt uç z = 0'da, -Z'ye doğru yükselir; orijin alt ucun ortasında) ----------
const TAS = 'kirec_tasi';
const DIGER = {
  ev_32: harabe,
  merdiven_genis: (P) => basamak(P, TAS, -3, 3, 10, 0.15, 0.35),
  merdiven_dar: (P) => { basamak(P, TAS, -0.95, 0.95, 18, 3 / 18, 5 / 18); for (const s of [-1, 1]) for (let k = 0; k < 6; k++) kup(P, 'moloz_tas', s > 0 ? 0.95 : -1.25, s > 0 ? 1.25 : -0.95, 0, (k + 1) * 0.5 + 0.7, -(k + 1) * (5 / 6), -k * (5 / 6), '-y'); },
  merdiven_sahanlik: (P) => { basamak(P, TAS, -2, 2, 9, 1.5 / 9, 0.3); kup(P, TAS, -2, 2, 0, 1.5, -4.5, -2.7, '-y'); basamak(P, TAS, -2, 2, 9, 1.5 / 9, 0.3, -4.5, 1.5, 0); for (const [z0, z1, y] of [[-2.7, 0, 0.75], [-4.5, -2.7, 1.5], [-7.2, -4.5, 2.25]]) K.beam(P, 'moloz_tas', V(1.85, y + 1.2 - (z0 === -4.5 ? 0.3 : 0.75), z1), V(1.85, y + 0.45 + (z0 === -4.5 ? 0.45 : 0.75) - 0.0, z0), 0.9, 0.3); },
  merdiven_donemec: (P) => { basamak(P, TAS, -1.5, 1.5, 9, 1.5 / 9, 0.3); kup(P, TAS, -1.5, 1.5, 0, 1.5, -5.7, -2.7, '-y'); basamakX(P, TAS, -5.7, -2.7, 9, 1.5 / 9, 0.3, 1.5, 1, 1.5, 0); },
  merdiven_yayvan: (P) => { basamak(P, 'kaldirim', -2.5, 2.5, 8, 0.125, 1.0); for (let k = 0; k < 8; k++) dortgen(P, 'kirec_tasi', [V(-0.25, (k + 1) * 0.125 + 0.004, -k), V(0.25, (k + 1) * 0.125 + 0.004, -k), V(0.25, (k + 1) * 0.125 + 0.004, -k - 1), V(-0.25, (k + 1) * 0.125 + 0.004, -k - 1)], UP, 1.5); },
  rampa_kaldirim: (P) => { P.quad('kaldirim', [V(-2.5, 0, 0), V(2.5, 0, 0), V(2.5, 1, -8), V(-2.5, 1, -8)], [[0, 0], [2.5, 0], [2.5, 4], [0, 4]], UP); for (const s of [-1, 1]) P.tri('moloz_tas', [V(s * 2.5, 0, 0), V(s * 2.5, 0, -8), V(s * 2.5, 1, -8)], [[0, 0], [2.7, 0], [2.7, 0.33]], V(s, 0, 0)); dortgen(P, 'moloz_tas', [V(-2.5, 0, -8), V(2.5, 0, -8), V(2.5, 1, -8), V(-2.5, 1, -8)], V(0, 0, -1)); },
  korkuluk_tas: (P) => { kup(P, 'moloz_tas', -1.5, 1.5, 0, 0.86, -0.18, 0.18, '-y'); for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI, b = ((k + 1) / 6) * Math.PI, q = (t) => [Math.cos(t) * 0.22, 0.86 + Math.sin(t) * 0.14]; dortgen(P, TAS, [V(-1.5, q(a)[1], q(a)[0]), V(1.5, q(a)[1], q(a)[0]), V(1.5, q(b)[1], q(b)[0]), V(-1.5, q(b)[1], q(b)[0])], V(0, Math.sin((a + b) / 2), Math.cos((a + b) / 2)), 1.5); } },
  korkuluk_demir: (P) => { kup(P, TAS, -1.5, 1.5, 0, 0.14, -0.12, 0.12, '-y'); for (const x of [-1.45, 0, 1.45]) K.cyl(P, 'demir', V(x, 0.14, 0), V(x, 1.0, 0), 0.02, 6); for (const y of [0.3, 0.96]) K.beam(P, 'demir', V(-1.45, y, 0), V(1.45, y, 0), 0.025, 0.03); for (let k = 1; k < 20; k++) if (k !== 10) K.cyl(P, 'demir', V(-1.45 + k * 0.145, 0.3, 0), V(-1.45 + k * 0.145, 0.96, 0), 0.008, 4, false); },
  // ---------- İstinat ve bahçe duvarları (ön yüz +Z; orijin ön alt kenarın ortasında) ----------
  istinat_3m: (P) => istinat(P, 4, 3, 0.8),
  istinat_5m: (P) => { istinat(P, 4, 5, 1.0); const q = (y) => 0.9 * (1 - y / 4.4); for (let k = 0; k < 4; k++) { const y0 = k * 1.1, y1 = y0 + 1.1; for (const s of [-1, 1]) P.quad('moloz_tas', [V(s * 0.5, y0, 0), V(s * 0.5, y0, q(y0)), V(s * 0.5, y1, q(y1)), V(s * 0.5, y1, 0)], K.FLAT, V(s, 0, 0)); dortgen(P, 'moloz_tas', [V(-0.5, y0, q(y0)), V(0.5, y0, q(y0)), V(0.5, y1, q(y1)), V(-0.5, y1, q(y1))], V(0, 0.2, 1)); } },
  istinat_kose: (P) => { kup(P, 'moloz_tas', -3, 0, 0, 3, -0.8, 0, '-y'); kup(P, 'moloz_tas', -0.8, 0, 0, 3, -3, -0.8, '-y+z'); kup(P, TAS, -3.05, 0.05, 3, 3.15, -0.85, 0.05, '-y', 1.5); kup(P, TAS, -0.85, 0.05, 3, 3.15, -3.05, -0.85, '-y+z', 1.5); },
  istinat_kemerli: (P) => { cephe(P, yuz(V(0, 0, 0), V(0, 0, 1)), 4, [[0, 4, 'moloz_tas', 3]], [{ u0: -0.9, u1: 0.9, y0: 0.5, ys: 2.0, rise: 0.9, tip: 'yuvarlak', depth: 0.35, fill: 'tugla', fillScale: 1.5, reveal: 'tugla' }]); kup(P, 'moloz_tas', -2, 2, 0, 4, -0.9, 0, '-y+z'); kup(P, TAS, -2.03, 2.03, 4, 4.14, -0.93, 0.04, '-y', 1.5); kup(P, 'kesme_tas', -0.35, 0.35, 0.9, 1.9, -0.35, -0.27, '-z', 1.5); kup(P, 'kesme_tas', -0.6, 0.6, 0.5, 0.82, -0.35, 0.25, '', 1.5); kup(P, 'karanlik', -0.48, 0.48, 0.822, 0.825, -0.25, 0.15, '-y'); K.cyl(P, 'demir', V(0, 1.25, -0.27), V(0, 1.2, -0.12), 0.02, 6); },
  bahce_duvari: (P) => { kup(P, 'moloz_tas', -2, 2, 0, 2.0, -0.5, 0, '-y'); for (const s of [-1, 1]) dortgen(P, 'kiremit', [V(-2, 2.0, s > 0 ? 0.08 : -0.58), V(2, 2.0, s > 0 ? 0.08 : -0.58), V(2, 2.2, -0.25), V(-2, 2.2, -0.25)], V(0, 1, s * 0.5), 1.2); for (const x of [-2, 2]) P.tri('kiremit', [V(x, 2, 0.08), V(x, 2, -0.58), V(x, 2.2, -0.25)], K.FLAT.slice(0, 3), V(x, 0, 0)); },
  bahce_kapisi: (P) => { cephe(P, yuz(V(0, 0, 0), V(0, 0, 1)), 3, [[0, 2.6, 'moloz_tas', 3]], [{ u0: -0.75, u1: 0.75, y0: 0.02, ys: 1.7, rise: 0.55, tip: 'yuvarlak', depth: 0.3, fill: 'kapi_cift', reveal: 'kesme_tas' }]); kup(P, 'moloz_tas', -1.5, 1.5, 0, 2.6, -0.5, 0, '-y+z'); for (const s of [-1, 1]) dortgen(P, 'kiremit', [V(-1.2, 2.6, s > 0 ? 0.55 : -1.05), V(1.2, 2.6, s > 0 ? 0.55 : -1.05), V(1.2, 3.0, -0.25), V(-1.2, 3.0, -0.25)], V(0, 1, s * 0.5), 1.2); for (const x of [-1.2, 1.2]) P.tri('kereste', [V(x, 2.6, 0.55), V(x, 2.6, -1.05), V(x, 3.0, -0.25)], K.FLAT.slice(0, 3), V(x, 0, 0)); dortgen(P, 'kereste', [V(-1.2, 2.6, -1.05), V(1.2, 2.6, -1.05), V(1.2, 2.6, 0.55), V(-1.2, 2.6, 0.55)], V(0, -1, 0), 1.5); for (const x of [-1.05, 1.05]) K.beam(P, 'kereste', V(x, 2.2, 0), V(x, 2.6, 0.5), 0.08, 0.07); },
  // Sokak kemeri: 4 m açıklık, 4,5 m yüksek geçit; üstünde kafes pencereli oda
  kemer_sokak: (P) => { const op = { u0: -2, u1: 2, y0: 0, ys: 2.7, rise: 1.8, tip: 'yuvarlak', depth: 3, fill: null, reveal: 'kesme_tas' }; cephe(P, yuz(V(0, 0, 0), V(0, 0, 1)), 5.8, [[0, 4.8, 'kesme_tas', 3], [4.8, 7.4, 'siva_kirli', 3]], [op, { u0: -0.5, u1: 0.5, y0: 5.5, ys: 6.9, depth: 0.08, fill: 'pencere_kafes', reveal: 'kereste' }]); cephe(P, yuz(V(0, 0, -3), V(0, 0, -1)), 5.8, [[0, 4.8, 'kesme_tas', 3], [4.8, 7.4, 'siva_kirli', 3]], [{ ...op, depth: 0.02 }, { u0: -0.5, u1: 0.5, y0: 5.5, ys: 6.9, depth: 0.08, fill: 'pencere_kafes', reveal: 'kereste' }]); for (const s of [-1, 1]) { dortgen(P, 'kesme_tas', [V(s * 2.9, 0, -3), V(s * 2.9, 0, 0), V(s * 2.9, 4.8, 0), V(s * 2.9, 4.8, -3)], V(s, 0, 0)); dortgen(P, 'siva_kirli', [V(s * 2.9, 4.8, -3), V(s * 2.9, 4.8, 0), V(s * 2.9, 7.4, 0), V(s * 2.9, 7.4, -3)], V(s, 0, 0)); dortgen(P, 'kiremit', [V(-3.1, 7.4, s > 0 ? 0.5 : -3.5), V(3.1, 7.4, s > 0 ? 0.5 : -3.5), V(3.1, 8.2, -1.5), V(-3.1, 8.2, -1.5)], V(0, 1, s * 0.5), 1.4); P.tri('siva_kirli', [V(s * 2.9, 7.4, 0), V(s * 2.9, 7.4, -3), V(s * 2.9, 8.05, -1.5)], K.FLAT.slice(0, 3), V(s, 0, 0)); } },
  // ---------- Dükkân önü ve tente parçaları (arkası z = 0'da duvara oturur; orijin yerde, ortada) ----------
  tente_bez_1: (P) => { ortu(P, 'bez_krem', -1.5, 1.5, 0, 2.8, 1.8, 2.15, 0.16, 1.2); for (const x of [-1.42, 1.42]) K.cyl(P, 'kereste', V(x, 0, 1.75), V(x, 2.17, 1.75), 0.025, 6); },
  tente_bez_2: (P) => { ortu(P, 'bez_cizgili', -1.5, 1.5, 0, 2.8, 1.8, 2.2, 0.06, 0.75); for (let k = 0; k < 12; k++) { const x = -1.5 + k * 0.25; P.tri('bez_cizgili', [V(x, 2.2, 1.8), V(x + 0.25, 2.2, 1.8), V(x + 0.125, 2.02, 1.8)], [[k / 4, 0], [(k + 1) / 4, 0], [(k + 0.5) / 4, 0.2]], V(0, 0, 1)); } for (const x of [-1.4, 1.4]) { K.beam(P, 'demir', V(x, 2.75, 0), V(x, 2.22, 1.75), 0.025, 0.025); K.beam(P, 'demir', V(x, 1.9, 0), V(x, 2.4, 1.1), 0.02, 0.02); kup(P, 'demir', x - 0.03, x + 0.03, 1.8, 2.85, 0, 0.015, '-z'); } },
  tente_ahsap: (P) => { ortu(P, 'tahta', -1.75, 1.75, 0, 2.9, 1.5, 2.3, 0, 1.5); dortgen(P, 'kiremit', [V(-1.75, 2.905, 0), V(1.75, 2.905, 0), V(1.75, 2.585, 0.8), V(-1.75, 2.585, 0.8)], V(0, 1, 0.4), 1.2); for (const x of [-1.6, 0, 1.6]) { K.beam(P, 'kereste', V(x, 1.7, 0.02), V(x, 2.3, 1.42), 0.08, 0.07); K.beam(P, 'kereste', V(x, 2.86, 0.02), V(x, 2.28, 1.48), 0.07, 0.06); } },
  kepenk_acik: (P) => { for (const x of [-1.5, 1.38]) kup(P, 'kereste', x, x + 0.12, 0, 2.5, 0, 0.14, '-y', 1.5); kup(P, 'kereste', -1.5, 1.5, 2.5, 2.66, 0, 0.14, '', 1.5); kup(P, 'moloz_tas', -1.38, 1.38, 0, 0.85, 0, 0.12, '-y'); kup(P, 'kepenk_dukkan', -1.36, 1.36, 0.85, 0.91, 0, 0.9, '', 2.7); for (const x of [-1.2, 1.2]) K.beam(P, 'kereste', V(x, 0.2, 0.12), V(x, 0.85, 0.8), 0.05, 0.05); P.quad('kepenk_dukkan', [V(-1.36, 2.5, 0.07), V(1.36, 2.5, 0.07), V(1.36, 2.05, 1.05), V(-1.36, 2.05, 1.05)], K.FLAT, V(0, 1, 0.3)); for (const x of [-1.25, 1.25]) K.beam(P, 'kereste', V(x, 1.5, 0.1), V(x, 2.07, 1.0), 0.04, 0.04); P.quad('karanlik', [V(-1.38, 0.91, 0.02), V(1.38, 0.91, 0.02), V(1.38, 2.5, 0.02), V(-1.38, 2.5, 0.02)], K.FLAT, V(0, 0, 1)); },
  sergen_ahsap: (P) => { for (let k = 0; k < 3; k++) { kup(P, 'tahta', -1.25, 1.25, 0.3 + k * 0.3, 0.34 + k * 0.3, 0.02 + (2 - k) * 0.32, 0.36 + (2 - k) * 0.32, '', 1.5); } for (const x of [-1.2, 1.2]) { P.quad('tahta', [V(x, 0, 0.02), V(x, 0, 1.0), V(x, 0.3, 1.0), V(x, 0.9, 0.02)], K.FLAT, V(x, 0, 0)); } for (const x of [-1.2, 0, 1.2]) for (let k = 0; k < 3; k++) direk(P, x, 0.06 + (2 - k) * 0.32 + 0.14, 0, 0.3 + k * 0.3, 0.05, 'tahta'); },
  golgelik_ipli: (P) => { const pt = (a, b) => V(-2.5 + 5 * a, 3.4 - 0.55 * Math.sin(a * Math.PI) * Math.sin(b * Math.PI) - 0.3 * b, -1.75 + 3.5 * b); for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) P.quad('bez_yamali', [pt(i / 6, j / 5), pt((i + 1) / 6, j / 5), pt((i + 1) / 6, (j + 1) / 5), pt(i / 6, (j + 1) / 5)], [[i / 3, j / 2.5], [(i + 1) / 3, j / 2.5], [(i + 1) / 3, (j + 1) / 2.5], [i / 3, (j + 1) / 2.5]], UP); for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const c = pt(a, b); K.cyl(P, 'kereste', c, V(c.x + (a ? 1.2 : -1.2), c.y + 0.5, c.z + (b ? 0.9 : -0.9)), 0.012, 4, false); } },
  tabela_asili: (P) => { kup(P, 'demir', -0.02, 0.02, 2.5, 2.95, 0, 0.012, '-z'); K.beam(P, 'demir', V(0, 2.9, 0), V(0, 2.9, 0.75), 0.022, 0.022); K.beam(P, 'demir', V(0, 2.55, 0), V(0, 2.88, 0.5), 0.016, 0.016); for (const z of [0.2, 0.65]) K.cyl(P, 'demir', V(0, 2.9, z), V(0, 2.78, z), 0.006, 4, false); kup(P, 'tahta', -0.02, 0.02, 2.3, 2.78, 0.1, 0.75, '', 0.8); kup(P, 'kereste', -0.03, 0.03, 2.27, 2.3, 0.08, 0.77, '', 0.8); },
  cardak_asma: (P) => { const r = K.rng(77); for (const x of [-2, 2]) for (const z of [-1.5, 1.5]) direk(P, x, z, 0, 2.5, 0.12); for (const z of [-1.5, 1.5]) K.beam(P, 'kereste', V(-2.2, 2.55, z), V(2.2, 2.55, z), 0.1, 0.1); for (let k = 0; k < 7; k++) K.beam(P, 'kereste', V(-2 + k * 0.666, 2.63, -1.75), V(-2 + k * 0.666, 2.63, 1.75), 0.06, 0.06); K.cyl(P, 'kereste', V(-2.08, 0, -1.4), V(-1.9, 2.6, -1.3), 0.035, 5, false); for (let k = 0; k < 60; k++) { const x = -2.2 + r() * 4.4, z = -1.8 + r() * 3.6, y = 2.68 + r() * 0.12, s = 0.3 + r() * 0.35, a = r() * 3, c = V(Math.cos(a) * s, 0, Math.sin(a) * s), d = V(-Math.sin(a) * s, (r() - 0.5) * 0.2, Math.cos(a) * s), o = V(x, y, z); P.quad('asma', [o.clone().sub(c).sub(d), o.clone().add(c).sub(d), o.clone().add(c).add(d), o.clone().sub(c).add(d)], K.FLAT, UP); } for (let k = 0; k < 10; k++) { const x = -2 + r() * 4, z = r() < 0.5 ? -1.6 : 1.6, o = V(x, 2.6, z); P.quad('asma', [o, o.clone().add(V(0.4, 0, 0)), o.clone().add(V(0.35, -0.5 - r() * 0.5, 0.05)), o.clone().add(V(0.05, -0.4 - r() * 0.4, -0.05))], K.FLAT, V(0, 0, z)); } },
};
function istinat(P, w, h, t) { // şevli (arkaya yatık) kaba taş duvar; ağlama delikleri ve çatlaklardan çıkan otlar
  const hw = w / 2, lean = h * 0.07, r = K.rng(w * 10 + h);
  dortgen(P, 'moloz_tas', [V(-hw, 0, 0), V(hw, 0, 0), V(hw, h, -lean), V(-hw, h, -lean)], V(0, 0.1, 1));
  for (const s of [-1, 1]) P.quad('moloz_tas', [V(s * hw, 0, -t - lean), V(s * hw, 0, 0), V(s * hw, h, -lean), V(s * hw, h, -t - lean)], [[0, 0], [t / 3, 0], [t / 3, h / 3], [0, h / 3]], V(s, 0, 0));
  dortgen(P, 'moloz_tas', [V(-hw, 0, -t - lean), V(hw, 0, -t - lean), V(hw, h, -t - lean), V(-hw, h, -t - lean)], V(0, 0, -1));
  kup(P, TAS, -hw, hw, h, h + 0.14, -t - lean - 0.03, -lean + 0.05, '-y', 1.5);
  for (let k = 0; k < 3; k++) { const x = -hw + 0.7 + k * ((w - 1.4) / 2), y = 0.5 + (k % 2) * 0.25, z = -y * 0.07 + 0.004; P.quad('karanlik', [V(x - 0.07, y, z), V(x + 0.07, y, z), V(x + 0.07, y + 0.12, z), V(x - 0.07, y + 0.12, z)], K.FLAT, V(0, 0, 1)); }
  for (let k = 0; k < 6; k++) { const x = (r() - 0.5) * (w - 0.6), y = 0.6 + r() * (h - 1), z = -y * 0.07; for (let q = 0; q < 3; q++) { const a = (q - 1) * 0.6 + (r() - 0.5) * 0.3; P.tri('asma', [V(x - 0.05, y, z + 0.01), V(x + 0.05, y, z + 0.01), V(x + Math.sin(a) * 0.28, y + 0.22 + r() * 0.12, z + 0.16 + r() * 0.08)], K.FLAT.slice(0, 3), V(0, 0.3, 1)); } }
}
// ---------- Kubbeli köşk (resimdeki yapı): solda üçlü pencereli kemer panolu, alçak kurşun çatılı kütle ve onu saran
// sütunlu revak; sağda kasnaklı kurşun kubbeli kütle, sivri kemerli taç kapı, şebekeli pencereler. Ön cephe +Z.
function koskKubbeli(P) {
  const XL = -6.5, XM = -0.5, XR = 6, D = 6.5, H1 = 3.8, H2 = 8.5, TAS2 = 'tas_koyu';
  // Kemer kuşağı: almaşık (taş / tuğla) kemer taşları, duvardan hafif taşar
  const kusak = (F, op, t, d = 0.05) => { const n = 18, uc = (op.u0 + op.u1) / 2, pt = (k, out) => { const u = op.u0 + ((op.u1 - op.u0) * k) / n, y = kemer(op, u), dx = u - uc, dy = y - op.ys + 0.4, l = Math.hypot(dx, dy) || 1; return out ? [u + (dx / l) * t, y + (dy / l) * t] : [u, y]; }; for (let k = 0; k < n; k++) P.quad(k % 2 ? 'tugla' : 'tas_sove', [pt(k, 0), pt(k + 1, 0), pt(k + 1, 1), pt(k, 1)].map(([u, y]) => F.pt(u, y, d)), K.FLAT, F.N); for (const [u, sg] of [[op.u0, -1], [op.u1, 1]]) kutu(P, F, Math.min(u, u + sg * t), Math.max(u, u + sg * t), op.y0, op.ys, 0, d, 'tas_sove'); };
  const soveKat = (F, ops) => { for (const o of ops) { const hwO = (o.u1 - o.u0) / 2, top = o.ys + (o.rise || 0), kapi = o.y0 < 0.3; cephe(P, yuz(F.pt((o.u0 + o.u1) / 2, 0, 0.05).setY(0), F.N), hwO * 2 + 0.4, [[kapi ? 0 : o.y0 - 0.16, top + 0.22, 'tas_sove', 1.5]], [{ ...o, u0: -hwO, u1: hwO, depth: 0.05, fill: null, reveal: 'tas_sove' }]); if (!kapi) kutu(P, F, o.u0 - 0.28, o.u1 + 0.28, o.y0 - 0.24, o.y0 - 0.12, 0, 0.12, 'tas_sove'); } };
  const op = (u, w, y0, ys, rise, fill, tip, depth = 0.12) => ({ u0: u - w / 2, u1: u + w / 2, y0, ys, rise, tip, fill, depth, reveal: 'tas_sove' });
  const Z2 = [[0, H1, TAS2, 3], [H1, H2, TAS2, 3]];
  const uclu = (F) => { const big = { u0: -1.95, u1: 1.95, y0: 4.7, ys: 6.25, rise: 1.5, tip: 'sogan' }; kusak(F, big, 0.36); return [-0.8, 0, 0.8].map((u) => op(u, 0.55, 5.1, 6.05, 0.32, 'pencere_sebeke', 'yuvarlak', 0.1)); };
  // Sol kütle
  const Fo = yuz(V((XL + XM) / 2, 0, 0), V(0, 0, 1)), oOn = [op(-1.9, 1.15, 0.02, 1.75, 0.6, 'kapi_cift'), op(1.6, 0.9, 1.1, 2.2, 0.45, 'pencere_parmak'), ...uclu(Fo)];
  cephe(P, Fo, XM - XL, Z2, oOn); soveKat(Fo, oOn.slice(0, 2));
  const Fs = yuz(V(XL, 0, -D / 2), V(-1, 0, 0)), oSol = [op(-1.6, 0.9, 1.1, 2.2, 0.45, 'pencere_parmak'), op(1.6, 0.9, 1.1, 2.2, 0.45, 'pencere_parmak'), ...uclu(Fs)];
  cephe(P, Fs, D, Z2, oSol); soveKat(Fs, oSol.slice(0, 2));
  // Sağ (kubbeli) kütle
  const Fr = yuz(V((XM + XR) / 2, 0, 0), V(0, 0, 1)), oR = [op(-1.3, 2.0, 0.02, 2.45, 1.25, 'kapi_cift', undefined, 0.5), op(2.3, 1.0, 1.25, 2.55, 0, 'pencere_parmak'), op(-1.5, 1.0, 5.2, 6.3, 0.62, 'pencere_sebeke'), op(1.6, 1.0, 5.2, 6.3, 0.62, 'pencere_sebeke')];
  cephe(P, Fr, XR - XM, Z2, oR); soveKat(Fr, oR);
  kusak(Fr, { u0: -2.3, u1: -0.3, y0: 0.02, ys: 2.45, rise: 1.25 }, 0.3, 0.1);
  const Fy = yuz(V(XR, 0, -D / 2), V(1, 0, 0)), oY = [op(0, 1.0, 5.2, 6.3, 0.62, 'pencere_sebeke'), op(0, 1.0, 1.25, 2.55, 0, 'pencere_parmak')];
  cephe(P, Fy, D, Z2, oY); soveKat(Fy, oY);
  dortgen(P, TAS2, [V(XL, 0, -D), V(XR, 0, -D), V(XR, H2, -D), V(XL, H2, -D)], V(0, 0, -1));
  // Kat silmesi, saçak kornişi (dişli) ve tepelik dizisi
  const cevre = [[V(XL, 0, 0), V(XR, 0, 0), V(0, 0, 1)], [V(XL, 0, -D), V(XL, 0, 0), V(-1, 0, 0)], [V(XR, 0, 0), V(XR, 0, -D), V(1, 0, 0)], [V(XR, 0, -D), V(XL, 0, -D), V(0, 0, -1)]];
  for (const [a, b, n] of cevre) {
    const F = yuz(a.clone().add(b).multiplyScalar(0.5), n), L = a.distanceTo(b);
    kutu(P, F, -L / 2 - 0.08, L / 2 + 0.08, H1 - 0.1, H1 + 0.1, 0, 0.09, 'tas_sove');
    kutu(P, F, -L / 2, L / 2, 0, 0.5, 0, 0.07, 'tas_sove');
    kutu(P, F, -L / 2 - 0.2, L / 2 + 0.2, H2 - 0.1, H2 + 0.16, 0, 0.2, 'tas_sove');
    kutu(P, F, -L / 2 - 0.1, L / 2 + 0.1, H2 - 0.42, H2 - 0.26, 0, 0.1, 'tas_sove');
    for (let u = -L / 2 + 0.1; u < L / 2 - 0.1; u += 0.36) kutu(P, F, u, u + 0.16, H2 - 0.26, H2 - 0.1, 0, 0.14, 'tas_sove');
    for (let u = -L / 2 - 0.1; u < L / 2; u += 0.42) { const q = (uu, y) => F.pt(uu, y, 0.16); P.quad('tas_sove', [q(u, H2 + 0.16), q(u + 0.3, H2 + 0.16), q(u + 0.3, H2 + 0.4), q(u, H2 + 0.4)], K.FLAT, n); P.tri('tas_sove', [q(u, H2 + 0.4), q(u + 0.3, H2 + 0.4), q(u + 0.15, H2 + 0.58)], K.FLAT.slice(0, 3), n); }
  }
  // Sol kütlenin çatısı: alçak kırma kurşun örtü; uzun baca
  const cx = (XL + XM) / 2, tip = V(cx, H2 + 1.25, -D / 2), e = 0.05, kose = [V(XL - e, H2 + 0.16, e), V(XM, H2 + 0.16, e), V(XM, H2 + 0.16, -D - e), V(XL - e, H2 + 0.16, -D - e)];
  for (let k = 0; k < 4; k++) { const a = kose[k], b = kose[(k + 1) % 4], m = a.clone().add(b).multiplyScalar(0.5); P.tri('kursun', [a, b, tip], [[0, 0], [a.distanceTo(b) / 1.5, 0], [a.distanceTo(b) / 3, 2.6]], V(m.x - cx, 1.5, m.z + D / 2)); }
  kup(P, TAS2, XL + 0.7, XL + 1.25, H2 + 0.3, H2 + 2.9, -D + 0.9, -D + 1.45, '-y', 1.5); kup(P, 'tas_sove', XL + 0.62, XL + 1.33, H2 + 2.9, H2 + 3.02, -D + 0.82, -D + 1.53, '', 1.5); kup(P, 'kursun', XL + 0.78, XL + 1.17, H2 + 3.02, H2 + 3.3, -D + 0.98, -D + 1.37, '-y', 1);
  // Sağ kütle: düz kurşun dam, sekizgen kasnak, kurşun kubbe, alem; bayrak direği
  const dx = (XM + XR) / 2, dz = -D / 2;
  dortgen(P, 'kursun', [V(XM, H2 + 0.17, 0), V(XR, H2 + 0.17, 0), V(XR, H2 + 0.17, -D), V(XM, H2 + 0.17, -D)], UP, 1.5);
  halka(P, TAS2, [[2.95, H2 + 0.17], [2.95, H2 + 1.05, 'tas_sove'], [3.1, H2 + 1.12, 'tas_sove'], [3.1, H2 + 1.24, 'kursun'], [2.78, H2 + 1.32]], 8, Math.PI / 8, 1.5, dx, dz);
  const dome = Array.from({ length: 10 }, (_, k) => { const t = (k / 9) * (Math.PI / 2); return [2.78 * Math.cos(t) ** 0.95, H2 + 1.32 + 2.3 * Math.sin(t)]; });
  dome[9][0] = 0.12;
  halka(P, 'kursun', dome, 20, 0, 1.2, dx, dz);
  halka(P, 'demir', [[0.12, H2 + 3.56], [0.16, H2 + 3.68], [0.06, H2 + 3.8], [0.13, H2 + 3.96], [0.03, H2 + 4.12], [0.02, H2 + 4.56], [0, H2 + 4.66]], 8, 0, 1, dx, dz);
  // Türk bayrağı: sol kütlenin kırma çatısının tepesinde; hafif dalgalı
  const by = tip.y + 4.2, bw = 2.7, bh = 1.8;
  K.cyl(P, 'demir', V(tip.x, tip.y - 0.15, tip.z), V(tip.x, by + 0.12, tip.z), 0.04, 8);
  halka(P, 'demir', [[0, by + 0.12], [0.08, by + 0.2], [0, by + 0.3]], 8, 0, 1, tip.x, tip.z);
  const dalga = (t) => V(tip.x + 0.04 + bw * t, 0, tip.z + 0.16 * Math.sin(t * 5.2) * t);
  for (let k = 0; k < 6; k++) { const a = dalga(k / 6), b = dalga((k + 1) / 6), sag = (t) => 0.1 * t * t; P.quad('bayrak', [a.clone().setY(by - bh - sag(k / 6)), b.clone().setY(by - bh - sag((k + 1) / 6)), b.clone().setY(by - sag((k + 1) / 6)), a.clone().setY(by - sag(k / 6))], [[k / 6, 0], [(k + 1) / 6, 0], [(k + 1) / 6, 1], [k / 6, 1]], V(0, 0, 1)); }
  // Revak: sol kütlenin önünü ve sol yanını saran, kurşun örtülü sundurma; ince sütunlar, soğan kemerler, alçak korkuluk
  const PX = XL - 2.7, PZ = 2.7, RY = 3.62, EY = 3.0;
  kup(P, TAS2, PX, XM, 0, 0.18, 0, PZ, '-y-z', 3); kup(P, TAS2, PX, XL, 0, 0.18, -D, 0, '-y+x', 3);
  P.quad('kursun', [V(XL, RY, 0), V(XM, RY, 0), V(XM, EY, PZ + 0.25), V(PX - 0.25, EY, PZ + 0.25)], [[0, 0], [5, 0], [5, 2], [-1.5, 2]], V(0, 1, 0.3));
  P.quad('kursun', [V(XL, RY, -D), V(XL, RY, 0), V(PX - 0.25, EY, PZ + 0.25), V(PX - 0.25, EY, -D)], [[0, 0], [5, 0], [6.5, 2], [0, 2]], V(-0.3, 1, 0));
  P.tri(TAS2, [V(XM, RY, 0), V(XM, EY, 0), V(XM, EY, PZ + 0.25)], K.FLAT.slice(0, 3), V(1, 0, 0));
  const revak = (a, b, n, bays) => { // a → b boyunca kemer dizisi
    const L = a.distanceTo(b), F = yuz(a.clone().add(b).multiplyScalar(0.5), n), bw = L / bays, ops = Array.from({ length: bays }, (_, k) => ({ u0: -L / 2 + k * bw, u1: -L / 2 + (k + 1) * bw, y0: 0.18, ys: 2.1, rise: 0.62, tip: 'sogan', fill: null, depth: 0.22, reveal: 'tas_sove' }));
    cephe(P, F, L, [[0.18, EY, 'tas_sove', 2]], ops);
    cephe(P, yuz(F.pt(0, 0, -0.22).setY(0), n.clone().negate()), L, [[0.18, EY, 'tas_sove', 2]], ops.map((o) => ({ ...o, u0: -o.u1, u1: -o.u0, depth: 0.01 })));
    for (let k = 0; k <= bays; k++) { const c = F.pt(-L / 2 + k * bw, 0, -0.11); halka(P, 'tas_sove', [[0.17, 0.18], [0.17, 0.3], [0.1, 0.38], [0.085, 1.85], [0.11, 1.9], [0.17, 2.02], [0.17, 2.08]], 8, 0, 1, c.x, c.z); }
    for (let k = 0; k < bays; k++) kutu(P, F, -L / 2 + k * bw + 0.14, -L / 2 + (k + 1) * bw - 0.14, 0.18, 0.78, -0.16, -0.06, 'tas_sove'); // korkuluk levhaları
    kutu(P, F, -L / 2 - 0.25, L / 2 + 0.25, EY - 0.12, EY + 0.02, 0, 0.22, 'kursun');
  };
  revak(V(PX, 0, PZ), V(XM, 0, PZ), V(0, 0, 1), 5);
  revak(V(PX, 0, -D), V(PX, 0, PZ), V(-1, 0, 0), 5);
}
DIGER.kosk_kubbeli = koskKubbeli;
export const SEHIR_PARCALAR = [...Object.keys(EVLER), ...Object.keys(DIGER)].sort((a, b) => (a.startsWith('ev_') ? 0 : 1) - (b.startsWith('ev_') ? 0 : 1) || a.localeCompare(b));
const cache = new Map();
export function createSehirParca(name) {
  if (!cache.has(name)) { const p = new Part(name); if (EVLER[name]) ev(p, EVLER[name]); else DIGER[name](p); cache.set(name, p.mesh(M)); }
  const src = cache.get(name), mesh = new THREE.Mesh(src.geometry, src.material);
  mesh.name = name;
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
// Örnek yokuş sokağı: bitişik sıra evler, kademe kademe yükselir
export function createSehirOrnek() {
  const root = new THREE.Group();
  root.name = 'ornek_sokak';
  let x = 0;
  ['ev_01', 'ev_02', 'ev_03', 'ev_04', 'ev_30', 'ev_05', 'ev_06', 'ev_07', 'ev_08', 'ev_09', 'ev_10'].forEach((n, i) => { const m = createSehirParca(n); m.geometry.computeBoundingBox(); const w = m.geometry.boundingBox.max.x - m.geometry.boundingBox.min.x; m.position.set(x + w / 2, Math.floor(i / 2) * 0.5, 0); x += w; root.add(m); });
  return root;
}
