// Doğa resimleri: dal, ot, çalı, çiçek levhaları (2048 × 2048, saf siyah arka plan, yandan görünüş) ve
// döşenebilir zemin dokuları. Hepsi tuval (canvas 2D) ile kodla çizilir; fotoğraf değildir.
const S = 2048, TAU = Math.PI * 2;
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
const jit = (r, v, d) => v + (r() - 0.5) * 2 * d;

// ---------- Temel çizimler ----------
// İncelen sap: noktalar boyunca; w0 dipte, w1 uçta
function sap(g, pts, w0, w1, col, hi) {
  g.lineCap = 'round';
  for (let pass = 0; pass < (hi ? 2 : 1); pass++) for (let i = 0; i + 1 < pts.length; i++) {
    const t = i / (pts.length - 1), w = w0 + (w1 - w0) * t;
    g.strokeStyle = pass ? hi : col;
    g.lineWidth = pass ? Math.max(0.6, w * 0.3) : w;
    g.beginPath();
    g.moveTo(pts[i][0] - (pass ? w * 0.2 : 0), pts[i][1]);
    g.lineTo(pts[i + 1][0] - (pass ? w * 0.2 : 0), pts[i + 1][1]);
    g.stroke();
  }
}
const egri = (r, x0, y0, x1, y1, n, wob) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n; return [x0 + (x1 - x0) * t + Math.sin(t * Math.PI) * wob + (i && i < n ? (r() - 0.5) * Math.abs(wob) * 0.25 : 0), y0 + (y1 - y0) * t]; });
// Yaprak biçimleri: t (0 dip … 1 uç) -> yarı genişlik oranı
const tepe = (p, k) => (t) => (t < p ? Math.sin((Math.PI / 2) * (t / p)) ** 0.8 : Math.max(0, Math.cos((Math.PI / 2) * ((t - p) / (1 - p)))) ** k);
const BICIM = {
  oval: tepe(0.45, 0.9), mizrak: tepe(0.35, 1.0), ucgen: tepe(0.2, 1.35), kalp: (t) => tepe(0.24, 1.15)(t) * (t < 0.06 ? 0.55 + t * 7.5 : 1), yuvarlak: tepe(0.5, 0.6),
  loblu: (t) => tepe(0.58, 0.8)(t) * (0.5 + 0.5 * Math.abs(Math.sin(t * Math.PI * 4.2 + 0.3)) ** 0.55),
  devedikeni: (t) => tepe(0.5, 0.9)(t) * (0.35 + 0.65 * Math.abs(Math.sin(t * Math.PI * 6)) ** 1.6),
};
// Yaprak: (x, y) dipten ang yönünde. o: kind, h, s, l (renk), serr (diş), ribs (koşut damar), vein
function yaprak(g, r, x, y, ang, len, wid, o = {}) {
  const f = BICIM[o.kind || 'oval'], N = o.kind === 'loblu' || o.kind === 'devedikeni' ? 44 : 22, serr = o.serr || 0, h = jit(r, o.h ?? 105, 6), s = jit(r, o.s ?? 45, 6), l = jit(r, o.l ?? 30, 4);
  const up = [], dn = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, z = serr ? 1 - serr * (i % 2) * (t > 0.08 && t < 0.97 ? 1 : 0) : 1, hw = (wid / 2) * f(t) * z, bend = (o.bend || 0) * len * Math.sin(t * Math.PI * 0.5) ** 2;
    up.push([t * len, -hw + bend]);
    dn.push([t * len, hw * (0.92 + 0.16 * r()) + bend]);
  }
  g.save();
  g.translate(x, y);
  g.rotate(ang);
  const path = () => { g.beginPath(); up.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); for (let i = N; i >= 0; i--) g.lineTo(dn[i][0], dn[i][1]); g.closePath(); };
  const gr = g.createLinearGradient(0, 0, len, 0);
  gr.addColorStop(0, hsl(h, s, l * 0.72)); gr.addColorStop(0.5, hsl(h, s, l)); gr.addColorStop(1, hsl(h - 6, s + 4, l * 1.18));
  path(); g.fillStyle = gr; g.fill();
  g.save(); path(); g.clip();
  g.fillStyle = 'rgba(0,0,0,0.16)'; g.beginPath(); g.moveTo(0, 0); up.forEach(([px, py]) => g.lineTo(px, py + ((o.bend || 0) ? 0 : 0))); g.lineTo(len, (o.bend || 0) * len); g.closePath(); if (r() < 0.5) g.fill(); else { g.beginPath(); g.moveTo(0, 0); dn.forEach(([px, py]) => g.lineTo(px, py)); g.closePath(); g.fill(); } // bir yarısı gölgede
  if (o.vein !== false) { // yan damarlar
    g.strokeStyle = hsl(h - 8, s - 8, l * 1.35, 0.4); g.lineWidth = Math.max(0.7, len / 110);
    const nv = o.ribs ? 0 : Math.max(4, Math.round(len / 16));
    for (let i = 1; i < nv; i++) { const t = i / nv, hw = (wid / 2) * f(Math.min(1, t + 0.18)), b0 = (o.bend || 0) * len * Math.sin(t * Math.PI * 0.5) ** 2; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(t * len, b0); g.quadraticCurveTo((t + 0.1) * len, b0 + sd * hw * 0.5, (t + 0.2) * len, b0 + sd * hw * 0.95); g.stroke(); } }
    for (let i = 1; i <= (o.ribs || 0); i++) for (const sd of [-1, 1]) { const k = (i / (o.ribs + 1)) * sd; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.5, k * wid * 0.62, len, 0); g.stroke(); }
  }
  for (let i = 0; i < len / 6; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,220,0.07)'; g.fillRect(r() * len, (r() - 0.5) * wid, 1 + r() * 3, 1 + r() * 2); } // benek
  g.restore();
  g.strokeStyle = hsl(o.rib ?? h - 10, s - 5, l * 1.5, 0.75); g.lineWidth = Math.max(1, len / 70); g.beginPath(); g.moveTo(0, 0); for (let i = 1; i <= 8; i++) g.lineTo((i / 8) * len * 0.96, (o.bend || 0) * len * Math.sin((i / 8) * Math.PI * 0.5) ** 2); g.stroke();
  path(); g.strokeStyle = hsl(h, s, l * 0.5, 0.5); g.lineWidth = 1; g.stroke();
  g.restore();
}
function cinarYapragi(g, r, x, y, ang, len, o) { // beş loblu
  [[-1.2, 0.6], [-0.6, 0.88], [0, 1], [0.6, 0.88], [1.2, 0.6]].forEach(([a, k]) => yaprak(g, r, x, y, ang + a, len * k, len * k * 0.56, { ...o, kind: 'ucgen', serr: 0.16 }));
  g.fillStyle = hsl(o.h, o.s, o.l * 0.85); g.beginPath(); g.arc(x + Math.cos(ang) * len * 0.2, y + Math.sin(ang) * len * 0.2, len * 0.27, 0, 7); g.fill();
}
// Yapraklı dal: sütun merkezinde cx, alttan yukarı. o: yaprak seçenekleri + len, wid, gap, twig, perTwig, hang (sarkık)
function yaprakliDal(g, r, cx, o) {
  const y0 = 1990, y1 = jit(r, 170, 60), main = egri(r, cx + jit(r, 0, 30), y0, cx + jit(r, 0, 50), y1, 14, jit(r, 0, 70)), items = [], twigs = [];
  const leafAt = (x, y, a) => items.push([x, y, a, jit(r, o.len, o.len * 0.18), r()]);
  for (let yy = y0 - 260; yy > y1 + 20; yy -= jit(r, o.gap, o.gap * 0.25)) {
    for (const yan of o.cift ? [-1, 1] : [0]) {
    const t = (y0 - yy) / (y0 - y1), i = Math.min(13, Math.floor(t * 14)), px = main[i][0] + (main[i + 1][0] - main[i][0]) * (t * 14 - i), side = yan || (twigs.length % 2 ? 1 : -1);
    const L = o.twig * (1 - 0.55 * t) * jit(r, 1, 0.2), a = -Math.PI / 2 + side * jit(r, o.spread ?? 1.0, 0.2), ex = Math.max(cx - 225, Math.min(cx + 225, px + Math.cos(a) * L)), ey = yy + Math.sin(a) * L + (o.hang ? L * 0.9 : 0);
    const tw = egri(r, px, yy, ex, ey, 5, 0).map(([x, y], k) => [x, y + (o.hang ? -Math.sin((k / 5) * Math.PI) * L * 0.35 : 0)]);
    twigs.push([tw, 7 * (1 - 0.6 * t) + 2]);
    const n = o.perTwig;
    for (let k = 1; k <= n; k++) { const q = k / n, j = Math.min(4, Math.floor(q * 5)), lx = tw[j][0] + (tw[j + 1][0] - tw[j][0]) * (q * 5 - j), ly = tw[j][1] + (tw[j + 1][1] - tw[j][1]) * (q * 5 - j), ta = Math.atan2(tw[j + 1][1] - tw[j][1], tw[j + 1][0] - tw[j][0]); leafAt(lx, ly, k === n ? ta + jit(r, 0, 0.2) : ta + (k % 2 ? 1 : -1) * jit(r, 0.85, 0.25) + (o.hang ? 0.4 * side : 0)); }
    }
  }
  for (let k = 0; k < 3; k++) leafAt(main[14][0], main[14][1], -Math.PI / 2 + (k - 1) * 0.7);
  sap(g, main, o.stem ?? 15, 4, o.bark ?? '#4a3a2a', 'rgba(150,130,100,0.35)');
  for (const [tw, w] of twigs) sap(g, tw, w, 2, o.bark ?? '#4a3a2a', 'rgba(150,130,100,0.3)');
  items.sort((a, b) => a[4] - b[4]).forEach(([x, y, a, len, z]) => { const oo = { ...o, l: (o.l ?? 30) * (z < 0.4 ? 0.72 : 1) }; if (o.cinar) cinarYapragi(g, r, x, y, a, len, oo); else yaprak(g, r, x, y, a, len, len * o.wid, oo); if (o.leke && r() < 0.35) { g.fillStyle = `rgba(${90 + r() * 50},${60 + r() * 30},20,0.55)`; g.beginPath(); g.ellipse(x + Math.cos(a) * len * (0.3 + r() * 0.5), y + Math.sin(a) * len * (0.3 + r() * 0.5), 2 + r() * 5, 2 + r() * 4, r() * 3, 0, 7); g.fill(); } if (o.extra && r() < o.extra[1]) o.extra[0](g, r, x, y); });
}
// İğne yapraklı dal
function igneliDal(g, r, cx, o) {
  const y0 = 1990, y1 = jit(r, 180, 60), main = egri(r, cx + jit(r, 0, 30), y0, cx + jit(r, 0, 40), y1, 14, jit(r, 0, 50)), twigs = [[main, 13]];
  let k = 0;
  for (let yy = y0 - 300; yy > y1 + 60; yy -= jit(r, o.gap, o.gap * 0.2)) {
    const t = (y0 - yy) / (y0 - y1), i = Math.min(13, Math.floor(t * 14)), px = main[i][0], side = k++ % 2 ? 1 : -1, L = o.twig * (1 - 0.5 * t) * jit(r, 1, 0.15), a = -Math.PI / 2 + side * jit(r, 1.05, 0.15);
    const ex = Math.max(cx - 215, Math.min(cx + 215, px + Math.cos(a) * L)), tw = egri(r, px, yy, ex, yy + Math.sin(a) * L, 6, 0).map(([x, y], q) => [x, y + (o.droop || 0) * L * (q / 6) ** 2]);
    twigs.push([tw, 6]);
  }
  for (const [tw, w] of twigs) sap(g, tw, w, 2.5, '#4a3626', 'rgba(150,120,90,0.3)');
  for (const [tw] of twigs) {
    const start = tw === main ? 0.45 : 0.12;
    for (let q = start; q <= 1; q += o.step / 1000) {
      const f = q * (tw.length - 1), j = Math.min(tw.length - 2, Math.floor(f)), x = tw[j][0] + (tw[j + 1][0] - tw[j][0]) * (f - j), y = tw[j][1] + (tw[j + 1][1] - tw[j][1]) * (f - j), ta = Math.atan2(tw[j + 1][1] - tw[j][1], tw[j + 1][0] - tw[j][0]);
      for (let n = 0; n < o.per; n++) {
        const a = ta + (r() < 0.5 ? 1 : -1) * jit(r, o.fan, o.fan * 0.5), len = jit(r, o.len, o.len * 0.2), dark = r() < 0.45;
        g.strokeStyle = hsl(jit(r, o.h, 8), jit(r, 38, 8), dark ? jit(r, 15, 3) : jit(r, 27, 6)); g.lineWidth = o.lw * (0.7 + r() * 0.5); g.lineCap = 'round';
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + (r() - 0.5) * 6, y + Math.sin(a) * len * 0.5 + (o.droop ? 3 : 0), x + Math.cos(a) * len, y + Math.sin(a) * len + (o.droop ? len * 0.12 : 0)); g.stroke();
      }
    }
  }
  for (let c = 0; c < (o.cones || 0); c++) { // kozalak
    const tw = twigs[1 + Math.floor(r() * (twigs.length - 1))][0], [x, y] = tw[1], hh = jit(r, 78, 10);
    g.save(); g.translate(x, y + 6); g.rotate(jit(r, 0.2, 0.5));
    for (let row = 0; row < 9; row++) for (let q = -2; q <= 2; q++) { const yy = (row / 9) * hh, ww = 24 * Math.sin(((row + 0.6) / 9.6) * Math.PI) ** 0.7; if (Math.abs(q * 9) > ww) continue; g.fillStyle = hsl(jit(r, 28, 5), 34, jit(r, 26, 6)); g.beginPath(); g.ellipse(q * 9 + (row % 2 ? 4.5 : 0), yy, 7, 6, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(20,12,6,0.6)'; g.lineWidth = 1; g.stroke(); }
    g.restore();
  }
}
// Çıplak dal: çatallanan kuru çubuklar. thorn: diken, lichen: liken beneği
function ciplakDal(g, r, x, y, ang, len, w, depth, o) {
  const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len, pts = egri(r, x, y, ex, ey, 4, 0).map(([px, py], i) => [px + Math.sin(i * 1.3) * len * 0.03, py]);
  sap(g, pts, w, w * 0.62, o.col, 'rgba(190,180,160,0.25)');
  if (o.thorn) for (let k = 0; k < len / 34; k++) { const [px, py] = pts[1 + Math.floor(r() * 3)], a = ang + (r() < 0.5 ? 1 : -1) * jit(r, 1.3, 0.3); g.strokeStyle = o.col; g.lineWidth = 2; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a) * 13, py + Math.sin(a) * 13); g.stroke(); }
  if (o.lichen) for (let k = 0; k < len / 22; k++) { const [px, py] = pts[Math.floor(r() * 5)]; g.fillStyle = hsl(jit(r, 80, 20), 16, jit(r, 62, 8), 0.8); g.beginPath(); g.arc(px + (r() - 0.5) * w, py + (r() - 0.5) * 10, 1.5 + r() * w * 0.35, 0, 7); g.fill(); }
  if (depth <= 0 || w < 1.6) return;
  const n = r() < 0.35 ? 3 : 2;
  for (let k = 0; k < n; k++) ciplakDal(g, r, ex, ey, ang + (k - (n - 1) / 2) * jit(r, 0.62, 0.2) + (-Math.PI / 2 - ang) * 0.18, len * jit(r, 0.74, 0.1), w * 0.66, depth - 1, o);
  if (r() < 0.6) ciplakDal(g, r, pts[2][0], pts[2][1], ang + (r() < 0.5 ? 1 : -1) * jit(r, 0.9, 0.2), len * 0.5, w * 0.45, depth - 2, o);
}
// Ot yaprağı: dipten kıvrılarak incelir
function otYapragi(g, r, x, y, h, lean, w, o) {
  const tx = x + lean, ty = y - h, cxp = x + lean * 0.22, cyp = y - h * 0.62, hh = jit(r, o.h, 8), ll = jit(r, o.l, 5);
  const gr = g.createLinearGradient(0, y, 0, ty);
  gr.addColorStop(0, hsl(hh + 8, o.s * 0.8, ll * 0.55)); gr.addColorStop(0.5, hsl(hh, o.s, ll)); gr.addColorStop(1, hsl(o.tip ?? hh - 8, o.tipS ?? o.s, o.tipL ?? ll * 1.25));
  g.fillStyle = gr;
  g.beginPath(); g.moveTo(x - w / 2, y); g.quadraticCurveTo(cxp - w * 0.42, cyp, tx, ty); g.quadraticCurveTo(cxp + w * 0.42, cyp, x + w / 2, y); g.closePath(); g.fill();
  g.strokeStyle = hsl(hh, o.s * 0.7, ll * 1.5, 0.35); g.lineWidth = Math.max(0.8, w * 0.12); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(cxp, cyp, tx, ty); g.stroke();
  return [tx, ty];
}
function otObegi(g, r, cx, o) {
  const blades = Array.from({ length: o.n }, () => ({ x: cx + (r() - 0.5) * o.base, h: o.hgt * (0.45 + 0.55 * r() ** 0.7), lean: (r() - 0.5) * 2 * o.spread, w: jit(r, o.w, o.w * 0.3) })).sort((a, b) => b.h - a.h);
  blades.forEach((b, i) => { otYapragi(g, r, b.x, 2040, b.h, b.lean * b.h, b.w, i < o.n * 0.4 ? { ...o, l: o.l * 0.7 } : o); });
  for (let k = 0; k < (o.heads || 0); k++) { // başak
    const x = cx + (r() - 0.5) * o.base * 0.7, h = o.hgt * jit(r, 1.08, 0.1), lean = (r() - 0.5) * o.spread * h * 1.2, pts = Array.from({ length: 11 }, (_, i) => { const t = i / 10; return [x + lean * t * t, 2040 - h * t]; });
    sap(g, pts, 5, 2, hsl(o.headStem ?? 70, 35, 38));
    for (let q = 0; q < 16; q++) {
      const t = 0.72 + (q / 16) * 0.28, px = x + lean * t * t, py = 2040 - h * t, sd = q % 2 ? 1 : -1;
      if (o.feather) { for (let f = 0; f < 7; f++) { g.strokeStyle = hsl(jit(r, 45, 6), 40, jit(r, 72, 8), 0.85); g.lineWidth = 1.3; g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px + sd * 26, py - 20, px + sd * jit(r, 52, 16), py - jit(r, 6, 22)); g.stroke(); } } else { g.fillStyle = hsl(jit(r, o.headH ?? 62, 8), 42, jit(r, 52, 8)); g.beginPath(); g.ellipse(px + sd * 9, py, 5, 15, sd * 0.5, 0, 7); g.fill(); g.strokeStyle = 'rgba(60,50,20,0.4)'; g.lineWidth = 1; g.stroke(); }
    }
  }
}
// Çiçek sapı: tabandan yukarı; yapraklar leaf(x, y, yön) ile; uç noktasını döndürür
function cicekSapi(g, r, x, h, o = {}) {
  const lean = (r() - 0.5) * (o.lean ?? 160), pts = Array.from({ length: 13 }, (_, i) => { const t = i / 12; return [x + lean * t * t + Math.sin(t * 5 + x) * 8, 2040 - h * t]; });
  sap(g, pts, o.w ?? 7, 3, hsl(o.h ?? 100, 38, 30), hsl(o.h ?? 100, 35, 48, 0.4));
  if (o.hairy) for (let k = 0; k < h / 5; k++) { const [px, py] = pts[Math.floor(r() * 12)], sd = r() < 0.5 ? 1 : -1; g.strokeStyle = 'rgba(200,215,170,0.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(px, py + r() * 40); g.lineTo(px + sd * jit(r, 9, 3), py + r() * 40 - 4); g.stroke(); }
  if (o.leaf) for (let k = 1; k <= (o.leaves ?? 5); k++) { const t = (k / ((o.leaves ?? 5) + 1)) * (o.leafTop ?? 0.7), i = Math.floor(t * 12); o.leaf(pts[i][0], pts[i][1], k % 2 ? 1 : -1, 1 - t * 0.5); }
  return pts[12];
}
const disk = (g, x, y, rx, ry, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); };
function tacYapraklari(g, r, x, y, n, len, wid, col, tilt = 0.6, rot = 0) { // yandan / çaprazdan görülen çiçek başı
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(1, tilt);
  for (let k = 0; k < n; k++) { const a = (k / n) * TAU + r() * 0.15, l = len * jit(r, 1, 0.1); g.save(); g.rotate(a); const gr = g.createLinearGradient(0, 0, l, 0); gr.addColorStop(0, col(0)); gr.addColorStop(1, col(1)); g.fillStyle = gr; g.beginPath(); g.ellipse(l * 0.55, 0, l * 0.5, wid * 0.5, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1; g.stroke(); g.restore(); }
  g.restore();
}

// ---------- İkinci tur: dolu, yelpaze biçimli dallar ----------
// Dolu iğneli dal: ana eksen, iki yanda sık yan dallar ve onların dalcıkları; hepsi iğneyle kaplı.
// o: len (iğne boyu), lw, step (iğne aralığı, piksel), h (renk), genis (tabandaki yarı genişlik), sarkik, per, cones
function doluIgneli(g, r, cx, o) {
  const y0 = 2000, y1 = jit(r, 130, 50), H = y0 - y1, lean = jit(r, 0, 50), bend = jit(r, 0, 60), twigs = [];
  const main = Array.from({ length: 21 }, (_, i) => { const t = i / 20; return [cx + lean * t + Math.sin(t * Math.PI) * bend, y0 - H * t]; });
  twigs.push({ pts: main, w: 14, from: 0.12 });
  const nSide = Math.round(H / o.gap);
  for (let k = 0; k < nSide; k++) for (const side of [-1, 1]) {
    const t = 0.1 + (0.86 * (k + (side > 0 ? 0.5 : 0))) / nSide, i = Math.min(19, Math.floor(t * 20)), px = main[i][0], py = y0 - H * t;
    const L = o.genis * (1 - t) ** (o.us ?? 0.75) * jit(r, 1, 0.18) + 30, a = -Math.PI / 2 + side * jit(r, o.aci ?? 1.0, 0.14);
    const pts = Array.from({ length: 9 }, (_, q) => { const u = q / 8; return [Math.max(cx - 240, Math.min(cx + 240, px + Math.cos(a) * L * u)), py + Math.sin(a) * L * u + (o.sarkik || 0) * L * u * u + Math.sin(u * 3 + k) * 5]; });
    twigs.push({ pts, w: 6, from: 0.05 });
    for (let q = 2; q < 8; q += 1 + (r() < 0.4 ? 1 : 0)) { // dalcıklar
      const [sx, sy] = pts[q], sa = a + (r() < 0.5 ? 1 : -1) * jit(r, 0.7, 0.2), SL = L * jit(r, 0.32, 0.1) * (1 - q / 10);
      if (SL > 24) twigs.push({ pts: Array.from({ length: 5 }, (_, v) => [Math.max(cx - 245, Math.min(cx + 245, sx + Math.cos(sa) * SL * (v / 4))), sy + Math.sin(sa) * SL * (v / 4) + (o.sarkik || 0) * SL * (v / 4) ** 2]), w: 3, from: 0.1 });
    }
  }
  for (const tw of twigs) sap(g, tw.pts, tw.w, Math.max(1.5, tw.w * 0.35), '#3e2e22', 'rgba(140,116,90,0.3)');
  // Üç kat iğne: önce koyu (arkada kalanlar), sonra orta, en üstte ışık alanlar
  for (let pass = 0; pass < 3; pass++) for (const tw of twigs) {
    const n = tw.pts.length - 1;
    let acc = 0;
    for (let i = Math.floor(tw.from * n); i < n; i++) {
      const [ax, ay] = tw.pts[i], [bx, by] = tw.pts[i + 1], seg = Math.hypot(bx - ax, by - ay), ta = Math.atan2(by - ay, bx - ax);
      for (acc += seg; acc > 0; acc -= o.step * (pass === 2 ? 2.2 : 1)) {
        const u = r(), x = ax + (bx - ax) * u, y = ay + (by - ay) * u;
        for (let q = 0; q < o.per; q++) {
          const a = ta + (r() < 0.5 ? 1 : -1) * jit(r, o.fan, o.fan * 0.55) * (pass === 0 ? 1.15 : 1), len = jit(r, o.len, o.len * 0.25) * (pass === 0 ? 1.1 : 1);
          g.strokeStyle = hsl(jit(r, o.h, 9), jit(r, o.s ?? 30, 8), pass === 0 ? jit(r, 9, 2.5) : pass === 1 ? jit(r, 19, 5) : jit(r, 31, 6), pass === 2 ? 0.85 : 1);
          g.lineWidth = o.lw * (0.7 + r() * 0.5) * (pass === 2 ? 0.7 : 1); g.lineCap = 'round';
          g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + (r() - 0.5) * len * 0.12, y + Math.sin(a) * len * 0.5 + (o.sarkik ? len * 0.05 : 0), x + Math.cos(a) * len, y + Math.sin(a) * len + (o.sarkik ? len * 0.12 : 0)); g.stroke();
        }
      }
    }
  }
  for (let c = 0; c < (o.cones || 0); c++) { // kozalak
    const tw = twigs[1 + Math.floor(r() * Math.min(12, twigs.length - 1))].pts, [x, y] = tw[1 + Math.floor(r() * 2)], hh = jit(r, 84, 10);
    g.save(); g.translate(x, y + 8); g.rotate(jit(r, 0.2, 0.6));
    for (let row = 0; row < 10; row++) for (let q = -3; q <= 3; q++) { const yy = (row / 10) * hh, ww = 27 * Math.sin(((row + 0.6) / 10.6) * Math.PI) ** 0.7; if (Math.abs(q * 9) > ww) continue; g.fillStyle = hsl(jit(r, 27, 5), 30, jit(r, 25, 7)); g.beginPath(); g.ellipse(q * 9 + (row % 2 ? 4.5 : 0), yy, 7.5, 6, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(16,10,6,0.65)'; g.lineWidth = 1; g.stroke(); g.fillStyle = 'rgba(190,160,120,0.25)'; g.fillRect(q * 9 + (row % 2 ? 4.5 : 0) - 3, yy - 3, 4, 2); }
    g.restore();
  }
}
// Selvi sürgünü: dar, alev biçimli; pul yapraklı sık dalcıklar eksene yapışık yükselir
function selviDali(g, r, cx) {
  const y0 = 2000, y1 = jit(r, 120, 40), H = y0 - y1, lean = jit(r, 0, 30), items = [];
  const axis = (t) => [cx + lean * t + Math.sin(t * 2.6) * 12, y0 - H * t];
  sap(g, Array.from({ length: 12 }, (_, i) => axis((i / 11) * 0.5)), 13, 4, '#4a3828', 'rgba(150,126,98,0.3)');
  for (let k = 0; k < 380; k++) {
    const t = 0.06 + 0.92 * r() ** 0.9, [px, py] = axis(t), wHere = 150 * Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.08)) ** 0.8 * (1 - t * 0.55), side = r() < 0.5 ? -1 : 1, L = jit(r, 190, 60) * (1 - t * 0.5), a = -Math.PI / 2 + side * r() * 0.5;
    const sx = px + side * r() * wHere * 0.75, sy = py + r() * 40;
    items.push({ pts: Array.from({ length: 7 }, (_, q) => { const u = q / 6; return [sx + Math.cos(a) * L * u * 0.5 + side * u * u * 14, sy + Math.sin(a) * L * u]; }), z: r() });
  }
  items.sort((a, b) => a.z - b.z).forEach(({ pts, z }) => {
    const dark = z < 0.4;
    for (let q = 0; q + 1 < pts.length; q++) for (let v = 0; v < 5; v++) {
      const u = v / 5, x = pts[q][0] + (pts[q + 1][0] - pts[q][0]) * u, y = pts[q][1] + (pts[q + 1][1] - pts[q][1]) * u, w = 11 * (1 - q / 9);
      g.fillStyle = hsl(jit(r, 112, 9), jit(r, 28, 6), dark ? jit(r, 11, 3) : jit(r, 21, 5));
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * w * 0.5, y, w * 0.62, w * 0.95, s * 0.5, 0, 7); g.fill(); }
      if (!dark && r() < 0.3) { g.fillStyle = hsl(105, 26, 34, 0.7); g.beginPath(); g.ellipse(x, y - 2, w * 0.3, w * 0.5, 0, 0, 7); g.fill(); }
    }
  });
}
const elma = (g, r, x, y) => { const R = jit(r, 34, 6), cx2 = x + (r() - 0.5) * 30, cy2 = y + R + 14; g.strokeStyle = '#3a2a1c'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(cx2, cy2 - R + 4); g.stroke(); const gr = g.createRadialGradient(cx2 - R * 0.3, cy2 - R * 0.3, 2, cx2, cy2, R); gr.addColorStop(0, hsl(48, 70, 62)); gr.addColorStop(0.45, hsl(jit(r, 14, 8), 62, 44)); gr.addColorStop(1, hsl(356, 55, 24)); g.fillStyle = gr; g.beginPath(); g.ellipse(cx2, cy2, R, R * 0.94, 0, 0, 7); g.fill(); for (let k = 0; k < 40; k++) { g.fillStyle = 'rgba(240,220,150,0.25)'; g.fillRect(cx2 + (r() - 0.5) * R * 1.5, cy2 + (r() - 0.5) * R * 1.5, 1.5, 1.5); } g.fillStyle = 'rgba(255,255,240,0.35)'; g.beginPath(); g.ellipse(cx2 - R * 0.35, cy2 - R * 0.4, R * 0.18, R * 0.1, -0.6, 0, 7); g.fill(); };
// Tuvale tane ve hafif ton oynaması ekler (düz renk görünüşünü kırar); siyah zemine dokunmaz
function tanele(g, seed) {
  const img = g.getImageData(0, 0, S, S), d = img.data, r = rng(seed);
  for (let i = 0; i < d.length; i += 4) { if (d[i] + d[i + 1] + d[i + 2] < 12) continue; const k = 0.86 + r() * 0.28, w = (r() - 0.5) * 10; d[i] = Math.min(255, d[i] * k + w); d[i + 1] = Math.min(255, d[i + 1] * k); d[i + 2] = Math.min(255, d[i + 2] * k - w * 0.6); }
  g.putImageData(img, 0, 0);
}
const DOLU = { gap: 82, twig: 150, perTwig: 6, cift: true, leke: true, spread: 0.85 };

// ---------- Levhalar ----------
const SUTUN4 = [256, 768, 1280, 1792];
const dallar = (o) => (g, r) => SUTUN4.forEach((cx) => yaprakliDal(g, r, cx, o));
const igneli = (o) => (g, r) => SUTUN4.forEach((cx) => igneliDal(g, r, cx, o));
const bogurtlen = (g, r, x, y) => { for (let k = 0; k < 12; k++) disk(g, x + (r() - 0.5) * 26, y + (r() - 0.5) * 26 + 16, 7, 7, hsl(jit(r, 280, 20), 30, jit(r, 9, 4))); for (let k = 0; k < 5; k++) disk(g, x + (r() - 0.5) * 22, y + 12 + (r() - 0.5) * 22, 2, 2, 'rgba(160,150,200,0.5)'); };
const kusburnu = (g, r, x, y) => { g.strokeStyle = '#5a4630'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 6, y + 30); g.stroke(); disk(g, x + 8, y + 46, 12, 18, hsl(jit(r, 6, 6), 78, jit(r, 40, 5))); disk(g, x + 4, y + 40, 4, 7, 'rgba(255,200,180,0.45)'); g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; for (const a of [-0.5, 0, 0.5]) { g.beginPath(); g.moveTo(x + 8, y + 62); g.lineTo(x + 8 + Math.sin(a) * 10, y + 72); g.stroke(); } };
const otlar = (n, o) => (g, r) => { for (let k = 0; k < n; k++) otObegi(g, r, (S / n) * (k + 0.5), { ...o, hgt: o.hgt * jit(r, 1, 0.12) }); };
const RESIM = {
  dal_mese: dallar({ kind: 'loblu', len: 150, wid: 0.5, gap: 150, twig: 230, perTwig: 4, h: 108, s: 42, l: 24, vein: true }),
  dal_kayin: dallar({ kind: 'oval', len: 122, wid: 0.56, gap: 120, twig: 230, perTwig: 5, h: 98, s: 52, l: 36, serr: 0.04 }),
  dal_hus: dallar({ kind: 'ucgen', len: 70, wid: 0.74, gap: 105, twig: 250, perTwig: 7, h: 90, s: 50, l: 42, serr: 0.14, hang: true, stem: 9, bark: '#3a2c24', spread: 0.9 }),
  dal_cam: igneli({ len: 120, step: 60, per: 3, fan: 0.75, lw: 2.4, h: 105, gap: 250, twig: 210, cones: 2 }),
  dal_ladin: igneli({ len: 27, step: 14, per: 4, fan: 1.2, lw: 2.6, h: 125, gap: 150, twig: 235, droop: 0.55 }),
  dal_cinar: dallar({ cinar: true, len: 150, wid: 1, gap: 210, twig: 200, perTwig: 2, h: 100, s: 44, l: 32 }),
  dal_kavak: dallar({ kind: 'kalp', len: 104, wid: 0.9, gap: 130, twig: 215, perTwig: 4, h: 102, s: 50, l: 30, serr: 0.05, rib: 70 }),
  dal_kuru: (g, r) => SUTUN4.forEach((cx) => ciplakDal(g, r, cx + jit(r, 0, 30), 1990, -Math.PI / 2 + jit(r, 0, 0.12), 430, 15, 6, { col: '#6a5e52', lichen: true })),
  ot_kisa: otlar(6, { n: 80, hgt: 900, base: 150, spread: 0.2, w: 15, h: 100, s: 55, l: 34 }),
  ot_uzun: otlar(5, { n: 46, hgt: 1500, base: 150, spread: 0.13, w: 15, h: 92, s: 48, l: 32, tip: 58, tipS: 55, tipL: 52, heads: 9, headH: 60 }),
  ot_kuru: otlar(5, { n: 50, hgt: 1450, base: 150, spread: 0.15, w: 12, h: 46, s: 42, l: 56, tip: 44, tipL: 70, heads: 9, feather: true, headStem: 46 }),
  ot_yabani: (g, r) => {
    const fan = (cx, n, len, wid, o, a0 = 0.25, a1 = 2.9) => Array.from({ length: n }, (_, k) => [-(a0 + ((a1 - a0) * (k + r() * 0.5)) / n), r()]).sort((a, b) => Math.abs(a[0] + 1.57) - Math.abs(b[0] + 1.57)).reverse().forEach(([a]) => yaprak(g, r, cx + (r() - 0.5) * 40, 2030, a, len * jit(r, 1, 0.2), wid, { ...o, bend: (a > -1.57 ? 1 : -1) * 0.12 }));
    fan(256, 9, 520, 210, { kind: 'oval', h: 104, s: 44, l: 28, ribs: 3 }); // sinir otu
    for (const dx of [-40, 50]) { const top = cicekSapi(g, r, 256 + dx, 820, { lean: 60, w: 5 }); for (let k = 0; k < 40; k++) disk(g, top[0] + (r() - 0.5) * 12, top[1] + k * 5, 6, 5, hsl(jit(r, 60, 20), 26, jit(r, 34, 8))); }
    fan(768, 8, 780, 170, { kind: 'mizrak', h: 96, s: 44, l: 30, serr: 0.07, rib: 0 }, 0.5, 2.65); // labada
    { const top = cicekSapi(g, r, 768, 1500, { lean: 80, w: 8, h: 20 }); for (let k = 0; k < 260; k++) disk(g, top[0] + (r() - 0.5) * (30 + k * 0.25), top[1] + r() * 520, 5, 5, hsl(jit(r, 14, 8), 50, jit(r, 30, 8))); }
    fan(1280, 12, 480, 190, { kind: 'devedikeni', h: 110, s: 26, l: 34 }, 0.12, 3.02); // deve dikeni rozeti
    fan(1792, 13, 520, 130, { kind: 'mizrak', h: 100, s: 50, l: 32, serr: 0.34 }, 0.2, 2.95); // karahindiba yaprakları
  },
  egrelti: (g, r) => {
    for (const [cx, n] of [[340, 3], [1024, 4], [1700, 3]]) for (let f = 0; f < n; f++) {
      const dir = (f - (n - 1) / 2) / n, h = jit(r, 1500, 250), lean = dir * 950 + jit(r, 0, 60), pts = Array.from({ length: 41 }, (_, i) => { const t = i / 40; return [cx + lean * t ** 1.6, 2030 - h * t + 260 * t ** 3]; });
      sap(g, pts, 9, 2, hsl(80, 36, 26));
      for (let i = 4; i < 40; i++) { const t = i / 40, L = 290 * Math.sin(Math.PI * Math.min(1, t * 1.05)) ** 0.8 * (1 - 0.25 * t), ta = Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]); for (const sd of [-1, 1]) yaprak(g, r, pts[i][0], pts[i][1], ta + sd * jit(r, 1.25, 0.08), L, L * 0.2, { kind: 'mizrak', h: 96, s: 58, l: 36, serr: 0.4, vein: false }); }
    }
  },
  yonca: (g, r) => {
    for (let c = 0; c < 5; c++) {
      const cx = 205 + c * 410, list = Array.from({ length: 46 }, () => ({ x: cx + (r() - 0.5) * 330, h: 90 + r() ** 0.8 * 560 })).sort((a, b) => b.h - a.h);
      list.forEach(({ x, h }, i) => {
        const tx = x + (r() - 0.5) * 120, ty = 2035 - h;
        g.strokeStyle = hsl(95, 40, 30); g.lineWidth = 3.5; g.beginPath(); g.moveTo(x, 2035); g.quadraticCurveTo(x, ty + h * 0.3, tx, ty); g.stroke();
        if (i % 11 === 5) { for (let k = 0; k < 46; k++) { const a = r() * TAU, d = r() ** 0.5 * 34; g.strokeStyle = hsl(jit(r, 330, 20), 30, jit(r, 90, 6)); g.lineWidth = 4; g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx + Math.cos(a) * d, ty + Math.sin(a) * d * 0.9 - 8); g.stroke(); } return; }
        const s = jit(r, 62, 14), rot = r() * TAU;
        for (let k = 0; k < 3; k++) { const a = rot + (k / 3) * TAU; yaprak(g, r, tx, ty, a, s, s * 0.95, { kind: 'yuvarlak', h: 112, s: 50, l: i < 16 ? 22 : 31, vein: false }); g.strokeStyle = 'rgba(210,235,190,0.5)'; g.lineWidth = 3; g.beginPath(); g.arc(tx + Math.cos(a) * s * 0.42, ty + Math.sin(a) * s * 0.42, s * 0.2, a - 1.2, a + 1.2); g.stroke(); }
      });
    }
  },
  cali_yesil: dallar({ kind: 'oval', len: 64, wid: 0.58, gap: 78, twig: 270, perTwig: 8, h: 112, s: 44, l: 23, serr: 0.06, stem: 12 }),
  cali_bogurtlen: dallar({ kind: 'oval', len: 92, wid: 0.62, gap: 130, twig: 240, perTwig: 5, h: 104, s: 42, l: 26, serr: 0.2, stem: 10, bark: '#5a3a3a', extra: [bogurtlen, 0.22] }),
  cali_kusburnu: dallar({ kind: 'oval', len: 50, wid: 0.6, gap: 100, twig: 250, perTwig: 9, h: 108, s: 40, l: 28, serr: 0.14, stem: 9, bark: '#5a4630', extra: [kusburnu, 0.2] }),
  cali_kuru: (g, r) => SUTUN4.forEach((cx) => ciplakDal(g, r, cx + jit(r, 0, 30), 1990, -Math.PI / 2 + jit(r, 0, 0.15), 380, 12, 7, { col: '#6e6258', thorn: true })),
  cali_funda: igneli({ len: 13, step: 9, per: 4, fan: 1.0, lw: 3, h: 130, gap: 80, twig: 240 }),
  // İkinci tur
  dal_cam_2: (g, r) => SUTUN4.forEach((cx) => doluIgneli(g, r, cx, { len: 92, lw: 2.2, step: 15, per: 3, fan: 0.8, h: 100, s: 28, gap: 120, genis: 235, us: 0.6, cones: 2 })),
  dal_ladin_2: (g, r) => SUTUN4.forEach((cx) => doluIgneli(g, r, cx, { len: 21, lw: 2.4, step: 5, per: 3, fan: 1.15, h: 122, s: 26, gap: 78, genis: 240, us: 0.85, sarkik: 0.3, aci: 1.15 })),
  dal_selvi: (g, r) => SUTUN4.forEach((cx) => selviDali(g, r, cx)),
  dal_meyve: dallar({ ...DOLU, kind: 'oval', len: 100, wid: 0.56, h: 98, s: 36, l: 31, serr: 0.07, gap: 100, perTwig: 6, extra: [elma, 0.035] }),
  dal_mese_2: dallar({ ...DOLU, kind: 'loblu', len: 132, wid: 0.52, h: 104, s: 34, l: 23 }),
  dal_kayin_2: dallar({ ...DOLU, kind: 'oval', len: 104, wid: 0.58, h: 96, s: 38, l: 31, serr: 0.04 }),
  dal_cinar_2: dallar({ ...DOLU, cinar: true, len: 132, wid: 1, h: 96, s: 34, l: 29, gap: 150, perTwig: 4 }),
  cicek_papatya: (g, r) => {
    for (let k = 0; k < 7; k++) {
      const x = 150 + k * 290, small = k % 3 === 1, h = jit(r, small ? 1150 : 1500, 160);
      const top = cicekSapi(g, r, x, h, { leaves: small ? 7 : 5, leaf: (lx, ly, sd, sc) => { if (small) for (let q = 0; q < 7; q++) { g.strokeStyle = hsl(100, 40, 34); g.lineWidth = 2.5; g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + sd * (40 + q * 16), ly - 30 + q * 12 - r() * 20); g.stroke(); } else yaprak(g, r, lx, ly, sd > 0 ? -0.5 : -2.6, 170 * sc, 52, { kind: 'mizrak', h: 104, s: 42, l: 30, serr: 0.3 }); } });
      const R = small ? 62 : 118, rot = jit(r, 0, 0.5);
      tacYapraklari(g, r, top[0], top[1], small ? 14 : 22, R, R * 0.3, (t) => (t ? '#f6f4ec' : '#d6d6c8'), 0.55, rot);
      disk(g, top[0], top[1] - R * 0.08, R * 0.3, R * 0.24, hsl(46, 92, 50)); disk(g, top[0] - R * 0.06, top[1] - R * 0.14, R * 0.16, R * 0.1, hsl(52, 95, 66, 0.8));
    }
  },
  cicek_gelincik: (g, r) => {
    for (let k = 0; k < 7; k++) {
      const x = 150 + k * 290, bud = k === 2 || k === 5, h = jit(r, 1500, 200);
      const top = cicekSapi(g, r, x, h, { hairy: true, w: 6, leaves: 4, leafTop: 0.5, leaf: (lx, ly, sd, sc) => yaprak(g, r, lx, ly, sd > 0 ? -0.6 : -2.5, 230 * sc, 80, { kind: 'devedikeni', h: 108, s: 34, l: 30 }) });
      if (bud) { g.save(); g.translate(top[0], top[1]); g.rotate(2.6); disk(g, 0, -40, 26, 46, hsl(104, 34, 30)); g.restore(); for (let q = 0; q < 40; q++) { g.strokeStyle = 'rgba(210,225,180,0.6)'; g.lineWidth = 1; const a = r() * TAU; g.beginPath(); g.moveTo(top[0] + 14 + Math.cos(a) * 22, top[1] + 30 + Math.sin(a) * 40); g.lineTo(top[0] + 14 + Math.cos(a) * 32, top[1] + 30 + Math.sin(a) * 50); g.stroke(); } continue; }
      for (const [a, sc] of [[-2.5, 1], [-0.65, 1], [-1.57, 1.1], [-2.0, 0.85], [-1.1, 0.85]]) { g.save(); g.translate(top[0], top[1]); g.rotate(a + jit(r, 0, 0.12)); const L = 150 * sc, gr = g.createRadialGradient(0, 0, 5, L * 0.6, 0, L); gr.addColorStop(0, hsl(356, 80, 22)); gr.addColorStop(0.25, hsl(2, 88, 44)); gr.addColorStop(1, hsl(8, 92, 54)); g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(L * 0.3, -L * 0.75, L * 1.05, -L * 0.6, L, 0); g.bezierCurveTo(L * 1.05, L * 0.6, L * 0.3, L * 0.75, 0, 0); g.fill(); g.strokeStyle = 'rgba(90,0,0,0.3)'; g.lineWidth = 1.5; for (let q = -3; q <= 3; q++) { g.beginPath(); g.moveTo(10, 0); g.quadraticCurveTo(L * 0.5, q * L * 0.12, L * 0.94, q * L * 0.16); g.stroke(); } g.restore(); }
      disk(g, top[0], top[1] - 14, 26, 20, '#16110f'); disk(g, top[0], top[1] - 18, 11, 8, hsl(80, 30, 38));
    }
  },
  cicek_sari: (g, r) => {
    for (let k = 0; k < 8; k++) {
      const x = 130 + k * 256, dand = k % 2 === 1, h = jit(r, dand ? 1000 : 1450, 160);
      if (dand) for (let q = 0; q < 8; q++) yaprak(g, r, x + (r() - 0.5) * 30, 2032, -(0.35 + (2.45 * q) / 8), jit(r, 430, 60), 110, { kind: 'mizrak', h: 100, s: 50, l: 31, serr: 0.34, bend: (q < 4 ? 1 : -1) * 0.1 });
      const top = cicekSapi(g, r, x, h, dand ? { w: 9, h: 85, lean: 60 } : { w: 5, leaves: 4, leaf: (lx, ly, sd, sc) => { for (const a of [-0.5, 0, 0.5]) yaprak(g, r, lx, ly, (sd > 0 ? -0.6 : -2.55) + a, 120 * sc, 34, { kind: 'mizrak', h: 104, s: 44, l: 30, serr: 0.2 }); } });
      if (dand) { for (const [n, R, l] of [[44, 100, 52], [34, 76, 56], [24, 50, 60]]) tacYapraklari(g, r, top[0], top[1], n, R, 11, (t) => hsl(50 - t * 4, 96, l + t * 4), 0.5, jit(r, 0, 0.3)); disk(g, top[0], top[1] - 8, 20, 12, hsl(44, 96, 50)); }
      else { tacYapraklari(g, r, top[0], top[1], 5, 70, 62, (t) => hsl(54 - t * 4, 98, 52 + t * 8), 0.6, jit(r, 0, 0.5)); disk(g, top[0], top[1] - 5, 17, 12, hsl(64, 70, 40)); disk(g, top[0] - 22, top[1] - 14, 16, 7, 'rgba(255,255,220,0.5)'); }
    }
  },
  cicek_mor: (g, r) => {
    for (let k = 0; k < 7; k++) {
      const x = 150 + k * 290, kind = k % 3, h = jit(r, [1550, 1350, 1250][kind], 150);
      if (kind === 0) { // deve dikeni
        const top = cicekSapi(g, r, x, h, { w: 9, h: 105, leaves: 6, leaf: (lx, ly, sd, sc) => yaprak(g, r, lx, ly, sd > 0 ? -0.55 : -2.6, 250 * sc, 90, { kind: 'devedikeni', h: 112, s: 26, l: 33 }) });
        for (let q = 0; q < 90; q++) { const a = -Math.PI / 2 + (r() - 0.5) * 1.5, L = jit(r, 105, 25); g.strokeStyle = hsl(jit(r, 292, 12), 52, jit(r, 52, 10)); g.lineWidth = 2.5; g.beginPath(); g.moveTo(top[0] + (r() - 0.5) * 40, top[1] - 30); g.lineTo(top[0] + Math.cos(a) * L, top[1] - 30 + Math.sin(a) * L); g.stroke(); }
        disk(g, top[0], top[1] + 22, 50, 60, hsl(108, 28, 30)); for (let q = 0; q < 60; q++) { const a = r() * TAU; g.strokeStyle = hsl(100, 22, 50); g.lineWidth = 1.6; g.beginPath(); g.moveTo(top[0] + Math.cos(a) * 36, top[1] + 22 + Math.sin(a) * 46); g.lineTo(top[0] + Math.cos(a) * 62, top[1] + 22 + Math.sin(a) * 68 - 8); g.stroke(); }
      } else if (kind === 1) { // fiğ
        const top = cicekSapi(g, r, x, h, { w: 4, lean: 260, leaves: 6, leafTop: 0.85, leaf: (lx, ly, sd, sc) => { const a = sd > 0 ? -0.4 : -2.75, L = 250 * sc; g.strokeStyle = hsl(100, 36, 32); g.lineWidth = 2.5; g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + Math.cos(a) * L, ly + Math.sin(a) * L); g.stroke(); for (let q = 1; q <= 7; q++) for (const s2 of [-1, 1]) yaprak(g, r, lx + Math.cos(a) * L * (q / 7.5), ly + Math.sin(a) * L * (q / 7.5), a + s2 * 1.0, 62 * sc, 20, { kind: 'oval', h: 104, s: 40, l: 34, vein: false }); } });
        for (let q = 0; q < 12; q++) { const px = top[0] + (q - 6) * 4, py = top[1] + q * 34; g.save(); g.translate(px, py); g.rotate(0.5); disk(g, 22, 0, 26, 11, hsl(jit(r, 276, 8), 56, jit(r, 46, 6))); disk(g, 40, -8, 13, 13, hsl(286, 52, 60)); g.restore(); }
      } else { // çan çiçeği
        const top = cicekSapi(g, r, x, h, { w: 4, leaves: 5, leaf: (lx, ly, sd, sc) => yaprak(g, r, lx, ly, sd > 0 ? -0.5 : -2.6, 120 * sc, 26, { kind: 'mizrak', h: 106, s: 40, l: 32 }) });
        for (let q = 0; q < 5; q++) { const px = top[0] + (q % 2 ? 46 : -46), py = top[1] + q * 110; g.strokeStyle = hsl(100, 36, 32); g.lineWidth = 2.5; g.beginPath(); g.moveTo(top[0], py - 30); g.quadraticCurveTo(px, py - 50, px, py); g.stroke(); const gr = g.createLinearGradient(0, py, 0, py + 80); gr.addColorStop(0, hsl(262, 50, 42)); gr.addColorStop(1, hsl(268, 62, 62)); g.fillStyle = gr; g.beginPath(); g.moveTo(px - 14, py); g.bezierCurveTo(px - 34, py + 30, px - 30, py + 60, px - 46, py + 84); g.lineTo(px - 20, py + 70); g.lineTo(px, py + 88); g.lineTo(px + 20, py + 70); g.lineTo(px + 46, py + 84); g.bezierCurveTo(px + 30, py + 60, px + 34, py + 30, px + 14, py); g.closePath(); g.fill(); }
      }
    }
  },
  cicek_mavi: (g, r) => {
    for (let k = 0; k < 7; k++) {
      const x = 150 + k * 290, fm = k % 2 === 1, h = jit(r, fm ? 1050 : 1500, 150);
      const top = cicekSapi(g, r, x, h, { w: fm ? 4 : 6, h: fm ? 100 : 112, leaves: 6, leaf: (lx, ly, sd, sc) => yaprak(g, r, lx, ly, sd > 0 ? -0.6 : -2.5, (fm ? 130 : 170) * sc, fm ? 36 : 22, { kind: 'mizrak', h: fm ? 104 : 118, s: fm ? 42 : 22, l: fm ? 32 : 40 }) });
      if (fm) { for (let q = 0; q < 16; q++) { const px = top[0] + (r() - 0.5) * 220, py = top[1] + r() * 210 - 40; g.strokeStyle = hsl(100, 36, 32); g.lineWidth = 2; g.beginPath(); g.moveTo(top[0], top[1] + 180); g.quadraticCurveTo(top[0], py + 60, px, py); g.stroke(); tacYapraklari(g, r, px, py, 5, 25, 24, (t) => hsl(206 + t * 8, 82, 62 + t * 8), 0.8, r() * 6); disk(g, px, py, 5, 4, hsl(50, 95, 60)); } }
      else { disk(g, top[0], top[1] + 44, 34, 50, hsl(104, 24, 30)); for (let q = 0; q < 30; q++) { g.strokeStyle = 'rgba(30,24,16,0.5)'; g.lineWidth = 1.5; g.beginPath(); g.arc(top[0] + (r() - 0.5) * 50, top[1] + 30 + r() * 50, 9, 0.3, 2.8); g.stroke(); } for (let q = 0; q < 16; q++) { const a = -Math.PI / 2 + (q - 7.5) * 0.21 + jit(r, 0, 0.05), L = jit(r, 130, 16), ex = top[0] + Math.cos(a) * L, ey = top[1] + Math.sin(a) * L * 0.8; g.strokeStyle = hsl(224, 78, 50); g.lineWidth = 6; g.beginPath(); g.moveTo(top[0] + (r() - 0.5) * 20, top[1]); g.lineTo(ex, ey); g.stroke(); for (const d of [-0.5, 0, 0.5]) { g.strokeStyle = hsl(222, 82, 58); g.lineWidth = 5; g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex + Math.cos(a + d) * 30, ey + Math.sin(a + d) * 30); g.stroke(); } } for (let q = 0; q < 26; q++) { g.strokeStyle = hsl(280, 50, 30); g.lineWidth = 2.5; const a = -Math.PI / 2 + (r() - 0.5) * 1.2; g.beginPath(); g.moveTo(top[0], top[1]); g.lineTo(top[0] + Math.cos(a) * 44, top[1] + Math.sin(a) * 44); g.stroke(); } }
    }
  },
};
// ---------- Zemin dokuları: tepeden bakış, dört kenarı kesintisiz döşenir ----------
const dose = (f) => { for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) f(dx, dy); };
function leke(g, r, n, cols, lo, hi) { for (let k = 0; k < n; k++) { const x = r() * S, y = r() * S, rx = lo + r() * (hi - lo), ry = rx * (0.5 + r() * 0.8), a = r() * 3, c = cols[Math.floor(r() * cols.length)]; dose((dx, dy) => { if (x + dx < -hi || x + dx > S + hi || y + dy < -hi || y + dy > S + hi) return; g.fillStyle = c; g.beginPath(); g.ellipse(x + dx, y + dy, rx, ry, a, 0, 7); g.fill(); }); } }
const ZEMIN = {
  zemin_orman: (g, r) => {
    g.fillStyle = '#2a2018'; g.fillRect(0, 0, S, S);
    leke(g, r, 2500, ['rgba(20,14,10,0.3)', 'rgba(70,54,38,0.25)', 'rgba(50,40,26,0.3)'], 6, 60);
    for (let k = 0; k < 1500; k++) { const x = r() * S, y = r() * S, a = r() * TAU, L = 30 + r() * 90; dose((dx, dy) => { g.strokeStyle = hsl(jit(r, 28, 8), 40, jit(r, 26, 8)); g.lineWidth = 1.6; g.beginPath(); g.moveTo(x + dx, y + dy); g.lineTo(x + dx + Math.cos(a) * L, y + dy + Math.sin(a) * L); g.stroke(); }); } // çam iğneleri
    for (let k = 0; k < 900; k++) { const x = r() * S, y = r() * S, a = r() * TAU, L = 60 + r() * 80, kind = ['oval', 'loblu', 'oval', 'kalp'][Math.floor(r() * 4)], h = jit(r, 28, 12), l = jit(r, 28, 10), seed = Math.floor(r() * 1e9); dose((dx, dy) => { if (x + dx < -160 || x + dx > S + 160 || y + dy < -160 || y + dy > S + 160) return; yaprak(g, rng(seed), x + dx, y + dy, a, L, L * 0.55, { kind, h, s: 44, l, bend: 0.05 }); }); } // kuru yapraklar
    for (let k = 0; k < 90; k++) { const x = r() * S, y = r() * S, a = r() * TAU, L = 80 + r() * 220, seed = Math.floor(r() * 1e9); dose((dx, dy) => { const rr = rng(seed), pts = egri(rr, x + dx, y + dy, x + dx + Math.cos(a) * L, y + dy + Math.sin(a) * L, 5, 12); sap(g, pts, 6 + rr() * 5, 3, '#4a3a2c', 'rgba(150,130,100,0.3)'); }); } // dal parçaları
  },
  zemin_cayir: (g, r) => {
    g.fillStyle = '#263a16'; g.fillRect(0, 0, S, S);
    leke(g, r, 900, ['rgba(20,34,12,0.35)', 'rgba(60,84,30,0.3)', 'rgba(84,100,40,0.2)'], 20, 120);
    for (let layer = 0; layer < 3; layer++) for (let k = 0; k < 9000; k++) { const x = r() * S, y = r() * S, a = r() * TAU, L = 26 + r() * 46, c = hsl(jit(r, 96, 16), jit(r, 50, 10), 16 + layer * 9 + r() * 8), w = 2.5 + r() * 2.5; dose((dx, dy) => { if (x + dx < -80 || x + dx > S + 80 || y + dy < -80 || y + dy > S + 80) return; g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + dx, y + dy); g.quadraticCurveTo(x + dx + Math.cos(a + 0.4) * L * 0.5, y + dy + Math.sin(a + 0.4) * L * 0.5, x + dx + Math.cos(a) * L, y + dy + Math.sin(a) * L); g.stroke(); }); }
  },
  zemin_toprak: (g, r) => {
    g.fillStyle = '#7a6448'; g.fillRect(0, 0, S, S);
    leke(g, r, 3500, ['rgba(60,46,30,0.18)', 'rgba(150,128,96,0.16)', 'rgba(100,82,58,0.2)', 'rgba(170,150,116,0.12)'], 8, 110);
    leke(g, r, 9000, ['rgba(50,38,24,0.3)', 'rgba(180,160,126,0.3)'], 1, 4);
    for (let k = 0; k < 60; k++) { let x = r() * S, y = r() * S, a = r() * TAU; const pts = [[x, y]]; for (let i = 0; i < 12; i++) { a += (r() - 0.5) * 0.9; x += Math.cos(a) * 26; y += Math.sin(a) * 26; pts.push([x, y]); } dose((dx, dy) => { g.strokeStyle = 'rgba(40,30,18,0.5)'; g.lineWidth = 1.6; g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px + dx, py + dy) : g.moveTo(px + dx, py + dy))); g.stroke(); }); } // çatlaklar
    for (let k = 0; k < 420; k++) { const x = r() * S, y = r() * S, rx = 5 + r() ** 2 * 30, ry = rx * (0.6 + r() * 0.4), a = r() * 3, l = jit(r, 52, 14), h = jit(r, 34, 10); dose((dx, dy) => { if (x + dx < -60 || x + dx > S + 60 || y + dy < -60 || y + dy > S + 60) return; g.fillStyle = 'rgba(40,30,20,0.35)'; g.beginPath(); g.ellipse(x + dx, y + dy, rx + 2.5, ry + 2.5, a, 0, 7); g.fill(); const gr = g.createRadialGradient(x + dx - rx * 0.2, y + dy - ry * 0.2, 1, x + dx, y + dy, rx); gr.addColorStop(0, hsl(h, 14, l + 10)); gr.addColorStop(1, hsl(h, 14, l - 8)); g.fillStyle = gr; g.beginPath(); g.ellipse(x + dx, y + dy, rx, ry, a, 0, 7); g.fill(); }); } // çakıllar
  },
  zemin_kaya: (g, r) => {
    g.fillStyle = '#84847e'; g.fillRect(0, 0, S, S);
    leke(g, r, 3000, ['rgba(60,60,58,0.16)', 'rgba(170,168,160,0.16)', 'rgba(120,106,88,0.14)', 'rgba(100,104,100,0.18)'], 10, 160);
    leke(g, r, 14000, ['rgba(40,40,40,0.3)', 'rgba(215,212,200,0.3)'], 1, 3.5);
    for (let k = 0; k < 140; k++) { const x = r() * S, y = r() * S, n = 5 + Math.floor(r() * 9), R = 16 + r() * 70, col = r() < 0.55 ? [72, 12, 66] : r() < 0.8 ? [84, 22, 42] : [42, 36, 48], seed = Math.floor(r() * 1e9); dose((dx, dy) => { if (x + dx < -200 || x + dx > S + 200 || y + dy < -200 || y + dy > S + 200) return; const rr = rng(seed); for (let i = 0; i < n; i++) { const px = x + dx + (rr() - 0.5) * R * 1.6, py = y + dy + (rr() - 0.5) * R * 1.6, s = R * (0.25 + rr() * 0.5); g.fillStyle = hsl(col[0] + (rr() - 0.5) * 10, col[1], col[2] + (rr() - 0.5) * 12, 0.75); g.beginPath(); for (let q = 0; q < 10; q++) { const a = (q / 10) * TAU, m = s * (0.65 + rr() * 0.5); g.lineTo(px + Math.cos(a) * m, py + Math.sin(a) * m); } g.fill(); } }); } // liken
    for (let k = 0; k < 46; k++) { let x = r() * S, y = r() * S, a = r() * TAU; const pts = [[x, y]], w = 1 + r() * 3.5; for (let i = 0; i < 20 + r() * 30; i++) { a += (r() - 0.5) * 0.7; x += Math.cos(a) * 30; y += Math.sin(a) * 30; pts.push([x, y]); } dose((dx, dy) => { for (const [st, lw, off] of [['rgba(225,222,210,0.35)', w, 2], ['rgba(24,24,24,0.8)', w, 0]]) { g.strokeStyle = st; g.lineWidth = lw; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px + dx + off, py + dy + off) : g.moveTo(px + dx + off, py + dy + off))); g.stroke(); } }); } // çatlaklar
  },
};
export const RESIMLER = [...Object.keys(RESIM), ...Object.keys(ZEMIN)];
export function cizResim(name) {
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d'), r = rng(RESIMLER.indexOf(name) * 7919 + 101);
  g.fillStyle = '#000';
  g.fillRect(0, 0, S, S);
  (RESIM[name] || ZEMIN[name])(g, r);
  if (/_2$|selvi|meyve/.test(name)) tanele(g, RESIMLER.indexOf(name) + 9);
  return c;
}
