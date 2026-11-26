import * as THREE from 'three';

// Kütükler, devrik gövdeler ve yapraksız ağaç gövdeleri (8 çeşit). Metre, Y yukarı; orijin tabanın ortasında (y = 0).
// Her gövde ve dal uçları kapalı bir borudur; dallar gövdenin içinden başlar. Kabuk dokuları kodla üretilir.
const TAU = Math.PI * 2, V = (x, y, z) => new THREE.Vector3(x, y, z);
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ---------- Dokular ----------
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(name, c, srgb) { const t = new THREE.CanvasTexture(c); t.name = name; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 4; return t; }
function normalFrom(hc, strength) {
  const w = hc.width, h = hc.height, src = hc.getContext('2d').getImageData(0, 0, w, h).data, [c, g] = canvas(w, h), out = g.createImageData(w, h);
  const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength, l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    out.data[i] = (-dx / l * 0.5 + 0.5) * 255; out.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; out.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; out.data[i + 3] = 255;
  }
  g.putImageData(out, 0, 0);
  return c;
}
const rgba = ([r, g, b], a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`, grey = (v, a = 1) => `rgba(${v},${v},${v},${a})`, pm = (rough) => `rgb(255,${Math.round(rough * 255)},0)`;
const KABUK = {
  mese: { base: [92, 82, 70], dark: [34, 28, 22], light: [140, 126, 106], grooves: 70, gw: [4, 13], breaks: 260, moss: 0.14, lichen: 40 },
  cam: { base: [98, 84, 72], dark: [40, 30, 24], light: [150, 122, 98], grooves: 60, gw: [3, 10], breaks: 700, moss: 0.03, lichen: 10, tint: [150, 92, 60] },
  hus: { base: [228, 224, 214], dark: [30, 28, 26], light: [245, 243, 236], grooves: 0, gw: [1, 2], breaks: 0, moss: 0.04, lichen: 8, birch: true },
  kayin: { base: [138, 138, 132], dark: [86, 86, 82], light: [168, 168, 160], grooves: 14, gw: [1, 2.5], breaks: 0, moss: 0.05, lichen: 45, smooth: true },
  olu: { base: [104, 92, 78], dark: [40, 32, 26], light: [150, 136, 116], grooves: 64, gw: [3, 11], breaks: 200, moss: 0.12, lichen: 30, peel: 9 },
  ladin: { base: [96, 84, 74], dark: [38, 30, 26], light: [146, 128, 112], grooves: 40, gw: [2, 6], breaks: 900, moss: 0.06, lichen: 50 },
  selvi: { base: [112, 92, 76], dark: [52, 38, 30], light: [158, 136, 114], grooves: 120, gw: [1.5, 4], breaks: 60, moss: 0.02, lichen: 12 },
  meyve: { base: [98, 90, 80], dark: [36, 30, 26], light: [150, 142, 126], grooves: 50, gw: [3, 9], breaks: 420, moss: 0.16, lichen: 90 },
  curuk: { base: [66, 52, 40], dark: [22, 16, 12], light: [104, 86, 66], grooves: 54, gw: [4, 14], breaks: 300, moss: 0.85, lichen: 20 },
};
function kabuk(kind) {
  const K = KABUK[kind], W = 1024, r = rng(kind.length * 7919 + kind.charCodeAt(0)), [cc, c] = canvas(W, W), [oc, o] = canvas(W, W), [hc, h] = canvas(W, W);
  const wrap = (f) => { for (const dx of [-W, 0, W]) for (const dy of [-W, 0, W]) f(dx, dy); };
  c.fillStyle = rgba(K.base); c.fillRect(0, 0, W, W);
  o.fillStyle = pm(K.smooth || K.birch ? 0.72 : 0.9); o.fillRect(0, 0, W, W);
  h.fillStyle = grey(150); h.fillRect(0, 0, W, W);
  if (K.tint) { c.fillStyle = rgba(K.tint, 0.4); c.fillRect(0, 0, W, W); }
  for (let k = 0; k < 900; k++) { // ton lekeleri
    const x = r() * W, y = r() * W, s = 8 + r() * 40;
    wrap((dx, dy) => { c.fillStyle = r() < 0.5 ? rgba(K.dark, 0.05 + r() * 0.1) : rgba(K.light, 0.05 + r() * 0.1); c.beginPath(); c.ellipse(x + dx, y + dy, s * 0.5, s * (K.birch ? 0.25 : 1.6), 0, 0, 7); c.fill(); });
  }
  // Dikey yarıklar: derin oluklar ve aralarında kabuk levhaları
  for (let k = 0; k < K.grooves; k++) {
    const x0 = r() * W, lw = K.gw[0] + r() * (K.gw[1] - K.gw[0]), a1 = 6 + r() * 16, a2 = 2 + r() * 7, f1 = 1 + Math.floor(r() * 3), f2 = 4 + Math.floor(r() * 5), p1 = r() * 7, p2 = r() * 7, y0 = r() * W, len = W * (0.35 + r() * 0.9);
    const X = (y) => x0 + a1 * Math.sin((y / W) * TAU * f1 + p1) + a2 * Math.sin((y / W) * TAU * f2 + p2);
    const draw = (g, style, w, off) => wrap((dx, dy) => { g.strokeStyle = style; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); for (let y = y0; y <= y0 + len; y += 12) g.lineTo(X(y) + off + dx, y + dy); g.stroke(); });
    draw(c, rgba(K.light, K.smooth ? 0.12 : 0.3), lw * 0.7, lw * 0.75);
    draw(c, rgba(K.dark, K.smooth ? 0.3 : 0.85), lw, 0);
    draw(h, grey(K.smooth ? 110 : 20, 0.9), lw * 1.1, 0);
    draw(h, grey(215, 0.5), lw * 0.8, lw * 0.9);
    draw(o, pm(0.97), lw, 0);
  }
  for (let k = 0; k < K.breaks; k++) { // yatay kırıklar: pul pul kabuk
    const x = r() * W, y = r() * W, len = 8 + r() * 34, lw = 1 + r() * 3;
    wrap((dx, dy) => { for (const [g, st] of [[c, rgba(K.dark, 0.6)], [h, grey(40, 0.8)]]) { g.strokeStyle = st; g.lineWidth = lw; g.beginPath(); g.moveTo(x + dx, y + dy); g.quadraticCurveTo(x + dx + len / 2, y + dy + (r() - 0.5) * 8, x + dx + len, y + dy + (r() - 0.5) * 6); g.stroke(); } });
  }
  if (K.birch) {
    for (let k = 0; k < 700; k++) { // yatay gözenek çizgileri
      const x = r() * W, y = r() * W, len = 5 + r() * 46, lw = 0.8 + r() * 1.8, a = 0.25 + r() * 0.5;
      wrap((dx, dy) => { c.strokeStyle = rgba([70, 62, 54], a); c.lineWidth = lw; c.beginPath(); c.moveTo(x + dx, y + dy); c.lineTo(x + dx + len, y + dy + (r() - 0.5) * 2); c.stroke(); h.strokeStyle = grey(110, 0.6); h.lineWidth = lw; h.beginPath(); h.moveTo(x + dx, y + dy); h.lineTo(x + dx + len, y + dy); h.stroke(); });
    }
    for (let k = 0; k < 16; k++) { // kara izler: budak yerleri
      const x = r() * W, y = r() * W, rx = 18 + r() * 40, ry = 8 + r() * 16;
      wrap((dx, dy) => {
        c.fillStyle = rgba(K.dark, 0.95); c.beginPath(); c.ellipse(x + dx, y + dy, rx, ry, 0, 0, 7); c.fill();
        c.beginPath(); c.moveTo(x + dx - rx, y + dy); c.quadraticCurveTo(x + dx - rx * 1.4, y + dy + ry * 2.5, x + dx - rx * 1.7, y + dy + ry * 4); c.lineTo(x + dx - rx * 0.4, y + dy + ry * 0.6); c.fill();
        c.beginPath(); c.moveTo(x + dx + rx, y + dy); c.quadraticCurveTo(x + dx + rx * 1.4, y + dy + ry * 2.5, x + dx + rx * 1.7, y + dy + ry * 4); c.lineTo(x + dx + rx * 0.4, y + dy + ry * 0.6); c.fill();
        h.fillStyle = grey(70, 0.9); h.beginPath(); h.ellipse(x + dx, y + dy, rx, ry, 0, 0, 7); h.fill();
        o.fillStyle = pm(0.95); o.beginPath(); o.ellipse(x + dx, y + dy, rx, ry, 0, 0, 7); o.fill();
      });
    }
  }
  for (let k = 0; k < (K.peel || 0); k++) { // soyulmuş yerler: açık renk çıplak odun
    const x = r() * W, y = r() * W, rx = 40 + r() * 90, ry = 90 + r() * 220, pts = Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * TAU, m = 0.7 + r() * 0.5; return [Math.cos(a) * rx * m, Math.sin(a) * ry * m]; });
    wrap((dx, dy) => {
      const path = (g) => { g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(x + dx + px, y + dy + py) : g.moveTo(x + dx + px, y + dy + py))); g.closePath(); };
      path(c); c.fillStyle = 'rgb(176,160,132)'; c.fill(); c.strokeStyle = rgba(K.dark, 0.9); c.lineWidth = 5; c.stroke();
      c.save(); path(c); c.clip(); for (let i = 0; i < 60; i++) { const lx = x + dx - rx + r() * rx * 2; c.strokeStyle = r() < 0.5 ? 'rgba(120,104,82,0.5)' : 'rgba(205,192,168,0.4)'; c.lineWidth = 1 + r() * 2; c.beginPath(); c.moveTo(lx, y + dy - ry * 1.3); c.lineTo(lx + (r() - 0.5) * 12, y + dy + ry * 1.3); c.stroke(); } c.restore();
      path(h); h.fillStyle = grey(95); h.fill(); path(o); o.fillStyle = pm(0.6); o.fill();
    });
  }
  for (let k = 0; k < 5000; k++) { const x = r() * W, y = r() * W; c.fillStyle = r() < 0.5 ? rgba(K.dark, 0.12 + r() * 0.2) : rgba(K.light, 0.1 + r() * 0.18); c.fillRect(x, y, 1 + r() * 2.5, 1 + r() * (K.birch ? 1.5 : 5)); h.fillStyle = grey(r() < 0.5 ? 90 : 200, 0.25); h.fillRect(x, y, 2, 3); }
  for (let k = 0; k < K.lichen; k++) { // liken benekleri
    const x = r() * W, y = r() * W, col = r() < 0.6 ? [176, 180, 160] : [150, 156, 124], s = 3 + r() * 11;
    wrap((dx, dy) => { c.fillStyle = rgba(col, 0.45 + r() * 0.35); c.beginPath(); for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU, m = s * (0.6 + r() * 0.6); c.lineTo(x + dx + Math.cos(a) * m, y + dy + Math.sin(a) * m); } c.fill(); });
  }
  for (let k = 0; k < K.moss * 420; k++) { // yosun
    const x = r() * W, y = r() * W, s = 10 + r() * 38;
    wrap((dx, dy) => {
      const gr = c.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, s); gr.addColorStop(0, `rgba(${46 + r() * 22},${62 + r() * 22},26,0.8)`); gr.addColorStop(0.6, 'rgba(44,58,26,0.45)'); gr.addColorStop(1, 'rgba(44,58,26,0)');
      c.fillStyle = gr; c.fillRect(x + dx - s, y + dy - s, s * 2, s * 2);
      const gh = h.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, s); gh.addColorStop(0, grey(200, 0.7)); gh.addColorStop(1, grey(200, 0)); h.fillStyle = gh; h.fillRect(x + dx - s, y + dy - s, s * 2, s * 2);
    });
  }
  for (let k = 0; k < K.moss * 9000; k++) { const x = r() * W, y = r() * W; h.fillStyle = grey(r() < 0.5 ? 120 : 230, 0.3); h.fillRect(x, y, 2, 2); }
  const m = tex(`kabuk_${kind}_pm`, oc, false);
  return new THREE.MeshStandardMaterial({ name: `kabuk_${kind}`, map: tex(`kabuk_${kind}_renk`, cc, true), roughnessMap: m, metalnessMap: m, normalMap: tex(`kabuk_${kind}_kabartma`, normalFrom(hc, K.smooth || K.birch ? 1.6 : 4), false), roughness: 1, metalness: 1 });
}
// Kesit: yaş halkaları. tur: 'kesik' (testere kesimi), 'kirik' (kıymıklı açık odun), 'kovuk' (çürük, koyu)
function kesit(tur) {
  const W = 512, r = rng(tur.length * 131), [cc, c] = canvas(W, W), [hc, h] = canvas(W, W), base = { kesik: [168, 138, 98], kirik: [196, 172, 130], kovuk: [38, 28, 20] }[tur];
  c.fillStyle = rgba(base.map((v) => v * 0.6)); c.fillRect(0, 0, W, W);
  h.fillStyle = grey(128); h.fillRect(0, 0, W, W);
  if (tur === 'kirik') { for (let k = 0; k < 500; k++) { const x = r() * W; c.strokeStyle = r() < 0.5 ? rgba(base.map((v) => v * 0.6), 0.6) : rgba(base.map((v) => Math.min(255, v * 1.15)), 0.6); c.lineWidth = 1 + r() * 3; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + (r() - 0.5) * 20, W); c.stroke(); h.strokeStyle = grey(r() < 0.5 ? 40 : 220, 0.6); h.lineWidth = 2; h.beginPath(); h.moveTo(x, 0); h.lineTo(x, W); h.stroke(); } }
  else {
    for (let k = 34; k > 0; k--) { const v = (k % 2 ? 1 : 0.8) * (0.85 + r() * 0.2) * (k > 28 ? 0.75 : 1); c.fillStyle = rgba(base.map((b) => b * v)); c.beginPath(); c.ellipse(W / 2 + (r() - 0.5) * 8, W / 2 + (r() - 0.5) * 8, (k / 34) * W * 0.49, (k / 34) * W * 0.49 * (0.94 + r() * 0.08), 0, 0, 7); c.fill(); h.strokeStyle = grey(90, 0.5); h.lineWidth = 2; h.beginPath(); h.arc(W / 2, W / 2, (k / 34) * W * 0.49, 0, 7); h.stroke(); }
    for (let k = 0; k < 9; k++) { const a = r() * 7, l = W * (0.2 + r() * 0.28); for (const [g, st] of [[c, 'rgba(30,20,12,0.75)'], [h, grey(20, 0.9)]]) { g.strokeStyle = st; g.lineWidth = 1 + r() * 4; g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * 10, W / 2 + Math.sin(a) * 10); g.lineTo(W / 2 + Math.cos(a) * l, W / 2 + Math.sin(a) * l); g.stroke(); } }
    for (let k = 0; k < 60; k++) { c.fillStyle = `rgba(60,84,34,${r() * 0.3})`; c.beginPath(); c.arc(r() * W, r() * W, 4 + r() * 22, 0, 7); c.fill(); }
  }
  for (let k = 0; k < 1500; k++) { c.fillStyle = `rgba(30,22,14,${r() * 0.2})`; c.fillRect(r() * W, r() * W, 1 + r() * 5, 1 + r() * 5); }
  const [oc, o] = canvas(8, 8); o.fillStyle = pm(0.85); o.fillRect(0, 0, 8, 8);
  const m = tex(`kesit_${tur}_pm`, oc, false);
  return new THREE.MeshStandardMaterial({ name: `odun_${tur}`, map: tex(`kesit_${tur}_renk`, cc, true), roughnessMap: m, metalnessMap: m, normalMap: tex(`kesit_${tur}_kabartma`, normalFrom(hc, 2), false), roughness: 1, metalness: 1 });
}

// ---------- Ağ kurucu (malzeme gruplu) ----------
class Geo {
  constructor() { this.p = []; this.uv = []; this.idx = {}; }
  vert(e) { this.p.push(e.q.x, e.q.y, e.q.z); this.uv.push(e.u, e.v); return this.p.length / 3 - 1; }
  orient(I, start, out) {
    const P = this.p, at = (k) => V(P[k * 3], P[k * 3 + 1], P[k * 3 + 2]);
    let vote = 0;
    for (let t = start; t < I.length; t += 3) { const a = at(I[t]), b = at(I[t + 1]), c = at(I[t + 2]); vote += b.clone().sub(a).cross(c.clone().sub(a)).dot(out(a.add(b).add(c).multiplyScalar(1 / 3))); }
    if (vote < 0) for (let t = start; t < I.length; t += 3) [I[t + 1], I[t + 2]] = [I[t + 2], I[t + 1]];
  }
  grid(mat, rows, out) {
    const I = (this.idx[mat] ??= []), ids = rows.map((row) => row.map((e) => this.vert(e))), start = I.length;
    for (let j = 0; j + 1 < ids.length; j++) for (let k = 0; k + 1 < ids[j].length; k++) I.push(ids[j][k], ids[j][k + 1], ids[j + 1][k + 1], ids[j][k], ids[j + 1][k + 1], ids[j + 1][k]);
    this.orient(I, start, out);
  }
  fan(mat, center, ring, out) {
    const I = (this.idx[mat] ??= []), c = this.vert(center), ids = ring.map((e) => this.vert(e)), start = I.length;
    for (let k = 0; k + 1 < ids.length; k++) I.push(c, ids[k], ids[k + 1]);
    this.orient(I, start, out);
  }
  mesh(name, mats) {
    const g = new THREE.BufferGeometry(), all = [], used = [];
    for (const [mat, I] of Object.entries(this.idx)) { g.addGroup(all.length, I.length, used.length); used.push(mats[mat]); for (const i of I) all.push(i); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(all);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, used.length === 1 ? used[0] : used);
    m.name = name;
    m.castShadow = m.receiveShadow = true;
    return m;
  }
}
// Yol boyunca boru. o: n, uRep, vTile (m / döşeme) ya da vOf(q), mult(a, j) yarıçap çarpanı, off(a, j) kaydırma, capA / capB: uç kapağı malzemesi
function tube(g, mat, path, rad, o = {}) {
  const n = o.n ?? 12, N = path.length, cum = [0], rows = [];
  for (let j = 1; j < N; j++) cum.push(cum[j - 1] + path[j].distanceTo(path[j - 1]));
  let Nv = null;
  for (let j = 0; j < N; j++) {
    const T = path[Math.min(j + 1, N - 1)].clone().sub(path[Math.max(j - 1, 0)]).normalize();
    if (!Nv) Nv = Math.abs(T.y) < 0.9 ? V(0, 1, 0).cross(T).normalize() : V(1, 0, 0);
    Nv = Nv.clone().addScaledVector(T, -Nv.dot(T)).normalize();
    const B = T.clone().cross(Nv);
    rows.push(Array.from({ length: n + 1 }, (_, k) => {
      const a = ((k % n) / n) * TAU, q = path[j].clone().addScaledVector(Nv, Math.cos(a) * rad[j] * (o.mult ? o.mult(a, j) : 1)).addScaledVector(B, Math.sin(a) * rad[j] * (o.mult ? o.mult(a, j) : 1));
      if (o.off) q.add(o.off(a, j));
      return { q, u: (k / n) * (o.uRep ?? 1), v: o.vOf ? o.vOf(q) : cum[j] / (o.vTile ?? 1.5) };
    }));
  }
  const near = (c) => { let b = 0; for (let j = 1; j < N; j++) if (path[j].distanceToSquared(c) < path[b].distanceToSquared(c)) b = j; return c.clone().sub(path[b]); };
  g.grid(mat, rows, near);
  const capOf = (row, p, m, d) => g.fan(m, { q: p, u: 0.5, v: 0.5 }, row.map((e, k) => ({ q: e.q, u: 0.5 + 0.48 * Math.cos((k / n) * TAU), v: 0.5 + 0.48 * Math.sin((k / n) * TAU) })), () => d);
  if (o.capA) capOf(rows[0], o.capAp ?? path[0], o.capA, path[0].clone().sub(path[1]));
  if (o.capB) capOf(rows[N - 1], o.capBp ?? path[N - 1], o.capB, path[N - 1].clone().sub(path[N - 2]));
  return rows;
}
// Kıvrılan dal yolu: start'tan dir yönünde len kadar; lift yukarı çeker, wig oynaklık
function yol(r, start, dir, len, segs, lift = 0, wig = 0.12) {
  const pts = [start.clone()], d = dir.clone().normalize();
  for (let i = 1; i <= segs; i++) {
    d.add(V((r() - 0.5) * wig, lift / segs + (r() - 0.5) * wig * 0.5, (r() - 0.5) * wig)).normalize();
    pts.push(pts[i - 1].clone().addScaledVector(d, len / segs));
  }
  return pts;
}
const taper = (n, r0, r1, e = 1) => Array.from({ length: n }, (_, i) => r0 + (r1 - r0) * (i / (n - 1)) ** e);
const kok = (r, lobes, amp, h) => { const ph = Array.from({ length: lobes }, () => r() * TAU / lobes), f = (a) => { let m = 0; for (let i = 0; i < lobes; i++) m = Math.max(m, Math.cos(a - (i / lobes) * TAU - ph[i]) ** 7); return m; }; return (y) => (a) => 1 + amp * Math.max(0, 1 - y / h) ** 2 * (0.35 + f(a)); };

// ---------- Modeller ----------
function agac(g, r, o) { // dik gövde + ana dallar
  const N = o.rings ?? 22, path = [], rad = [];
  for (let j = 0; j <= N; j++) { const t = j / N, y = o.h * t ** 1.15; path.push(V(o.bend * Math.sin(t * 2.4 + 1) * o.h * t, y, o.bend * Math.sin(t * 1.9 + 3) * o.h * 0.7 * t)); rad.push(o.r0 + (o.r1 - o.r0) * t ** (o.te ?? 0.8)); }
  const flare = kok(r, o.lobes ?? 5, o.flare ?? 0.5, o.flareH ?? 0.8);
  tube(g, 'kabuk', path, rad, { n: o.n ?? 16, uRep: o.uRep ?? 2, vTile: o.vTile, vOf: o.whole ? (q) => q.y / o.h : undefined, mult: (a, j) => flare(path[j].y)(a), capA: 'kabuk', capB: 'odun' });
  const at = (y) => { for (let j = 1; j <= N; j++) if (path[j].y >= y) { const t = (y - path[j - 1].y) / (path[j].y - path[j - 1].y); return [path[j - 1].clone().lerp(path[j], t), rad[j - 1] + (rad[j] - rad[j - 1]) * t]; } return [path[N].clone(), rad[N]]; };
  for (const b of o.branches) {
    const [p, rt] = at(b.y), dir = V(Math.cos(b.a), b.up, Math.sin(b.a)), len = b.len, r0 = Math.min(b.r, rt * 0.85);
    const pts = yol(r, p, dir, len, b.segs ?? 5, b.lift ?? 0.6, b.wig ?? 0.14), rr = taper(pts.length, r0, b.r1 ?? r0 * 0.35, 0.9);
    tube(g, 'kabuk', pts, rr, { n: b.n ?? 9, uRep: 1, vTile: o.vTile, vOf: o.whole ? (q) => q.y / o.h : undefined, capA: 'kabuk', capB: 'odun' });
    for (let s = 0; s < (b.sub ?? 0); s++) {
      const i = 2 + Math.floor(r() * (pts.length - 3)), sd = pts[i + 1].clone().sub(pts[i]).normalize().add(V((r() - 0.5) * 1.4, 0.3 + r() * 0.5, (r() - 0.5) * 1.4)), sp = yol(r, pts[i], sd, len * (0.3 + r() * 0.25), 3, 0.4, 0.12);
      tube(g, 'kabuk', sp, taper(4, rr[i] * 0.6, rr[i] * 0.22), { n: 7, uRep: 1, vTile: o.vTile, vOf: o.whole ? (q) => q.y / o.h : undefined, capA: 'kabuk', capB: 'odun' });
    }
  }
}
const DEFS = {
  // Kesik kütük: 0,8 m çap, 0,6 m yüksek; üstte yaş halkaları, dipte yayılan kökler
  kutuk_kesik: { bark: 'mese', wood: 'kesik', build(g, r) {
    const ys = [0, 0.06, 0.14, 0.24, 0.36, 0.5, 0.6], flare = kok(r, 5, 0.75, 0.42), path = ys.map((y) => V(0, y, 0));
    tube(g, 'kabuk', path, ys.map((y) => 0.4 + 0.02 * Math.sin(y * 9)), { n: 24, uRep: 2, vTile: 1.2, mult: (a, j) => flare(ys[j])(a) * (1 + 0.03 * Math.sin(a * 7 + j)), capA: 'kabuk', capB: 'odun', capBp: V(0.01, 0.59, 0.02) });
    for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + r() * 0.6, d = V(Math.cos(a), 0, Math.sin(a)), pts = [d.clone().multiplyScalar(0.25).setY(0.17), d.clone().multiplyScalar(0.5).setY(0.1), d.clone().multiplyScalar(0.68).setY(0.035), d.clone().multiplyScalar(0.8 + r() * 0.1).setY(-0.03)]; tube(g, 'kabuk', pts, [0.15, 0.12, 0.08, 0.035], { n: 8, vTile: 1.2, capA: 'kabuk', capB: 'kabuk' }); }
  } },
  // Fırtınada kırılmış kütük: 0,7 m çap, 1,2 m yüksek; tepesi kıymıklı
  kutuk_kirik: { bark: 'mese', wood: 'kirik', build(g, r) {
    const n = 24, spike = Array.from({ length: n }, () => Math.min(0.34, r() ** 2 * 0.34 + (r() < 0.2 ? 0.1 : 0))), ys = [0, 0.08, 0.2, 0.4, 0.62, 0.84], flare = kok(r, 4, 0.6, 0.45), path = ys.map((y) => V(0, y, 0)), kk = (a) => Math.round((a / TAU) * n) % n;
    spike[3] = 0.36; spike[4] = 0.3;
    const rows = tube(g, 'kabuk', path, ys.map(() => 0.35), { n, uRep: 2, vTile: 1.2, mult: (a, j) => flare(ys[j])(a) * (1 + 0.03 * Math.sin(a * 5 + j)), off: (a, j) => (j === 5 ? V(0, spike[kk(a)], 0) : V(0, 0, 0)), capA: 'kabuk' });
    // İç yüz: kıymıklı odun, ortaya doğru çöker
    const topRow = rows[5], ring = (s, drop, v) => topRow.map((e, k) => ({ q: V(e.q.x * s, 0.84 + (spike[k % n] - drop) * (0.4 + 0.6 * s) + (k % 2 ? 0.05 : 0) * (1 - s), e.q.z * s), u: (k / n) * 4, v }));
    g.grid('odun', [topRow.map((e, k) => ({ q: e.q, u: (k / n) * 4, v: 0 })), ring(0.72, 0.14, 0.25), ring(0.4, 0.2, 0.5)], () => V(0, 1, 0));
    g.fan('odun', { q: V(0, 0.74, 0), u: 0.5, v: 0.7 }, ring(0.4, 0.2, 0.5), () => V(0, 1, 0));
    for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + r() * 0.8, d = V(Math.cos(a), 0, Math.sin(a)); tube(g, 'kabuk', [d.clone().multiplyScalar(0.2).setY(0.16), d.clone().multiplyScalar(0.5).setY(0.08), d.clone().multiplyScalar(0.72).setY(-0.03)], [0.13, 0.09, 0.035], { n: 8, vTile: 1.2, capA: 'kabuk', capB: 'kabuk' }); }
  } },
  // Devrik kuru gövde: 5 m, X boyunca yatar; kabuğu yer yer soyulmuş, kırık dal dipleri
  govde_devrik_1: { bark: 'olu', wood: 'kirik', build(g, r) {
    const N = 16, path = [], rad = [];
    for (let j = 0; j <= N; j++) { const t = j / N, rr = 0.3 - 0.13 * t + (j === 0 ? 0.05 : 0); rad.push(rr); path.push(V(-2.5 + 5 * t, rr + 0.02 * Math.sin(t * 5), 0.12 * Math.sin(t * 3.1))); }
    tube(g, 'kabuk', path, rad, { n: 16, uRep: 2, vTile: 1.6, mult: (a, j) => 1 + 0.05 * Math.sin(a * 3 + j * 0.7), capA: 'odun', capB: 'odun' });
    for (const [t, a, len] of [[0.25, 1.2, 0.5], [0.4, 2.6, 0.32], [0.52, 0.5, 0.7], [0.66, 1.9, 0.4], [0.78, 0.9, 0.55], [0.86, 2.9, 0.3]]) { const j = Math.round(t * N), d = V(0.35, Math.sin(a), Math.cos(a)); tube(g, 'kabuk', yol(r, path[j], d, len + rad[j], 3, 0, 0.1), taper(4, rad[j] * 0.42, rad[j] * 0.28), { n: 9, vTile: 1.6, capA: 'kabuk', capB: 'odun' }); }
  } },
  // Çürük kütük: 3 m, yosunlu, raf mantarlı; bir ucu kovuk
  govde_devrik_2: { bark: 'curuk', wood: 'kovuk', extra: { mantar: () => new THREE.MeshStandardMaterial({ name: 'raf_mantari', color: 0xb89a6c, roughness: 0.8, metalness: 0 }) }, build(g, r) {
    const N = 12, path = [], rad = [];
    for (let j = 0; j <= N; j++) { const t = j / N; rad.push(0.27 - 0.04 * t); path.push(V(-1.5 + 3 * t, 0.27 - 0.04 * t - 0.012, 0.05 * Math.sin(t * 4))); }
    const lump = (a, j) => 1 + 0.07 * Math.sin(a * 2 + j) + 0.04 * Math.sin(a * 5 + j * 1.3);
    const rows = tube(g, 'kabuk', path, rad, { n: 16, uRep: 2, vTile: 1.5, mult: lump, capA: 'odun' });
    // Kovuk uç: dış kenardan içeri dönen oyuk
    const end = rows[N], c = path[N], inner = (s, back, v) => end.map((e, k) => ({ q: V(c.x - back, c.y + (e.q.y - c.y) * s, c.z + (e.q.z - c.z) * s), u: k / 4, v }));
    g.grid('odun', [end.map((e, k) => ({ q: e.q, u: k / 4, v: 0 })), inner(0.72, 0, 0.1), inner(0.66, 0.35, 0.5), inner(0.45, 0.7, 0.9)], (q) => V(1, c.y - q.y, c.z - q.z));
    g.fan('odun', { q: V(c.x - 0.75, c.y, c.z), u: 0.5, v: 1 }, inner(0.45, 0.7, 0.9), () => V(1, 0, 0));
    // Raf mantarları: yan yüzde yarım daire raflar
    for (const [t, a, s] of [[0.2, 0.5, 0.16], [0.26, 0.75, 0.11], [0.45, 0.35, 0.19], [0.5, 0.62, 0.12], [0.68, 0.45, 0.15], [0.74, -0.2 + Math.PI, 0.13], [0.36, Math.PI - 0.5, 0.17]]) {
      const j = Math.round(t * N), base = path[j].clone().add(V(0, Math.sin(a) * rad[j] * 0.92, Math.cos(a) * rad[j] * 0.92)), outD = V(0, Math.sin(a) * 0.25, Math.cos(a)).normalize();
      const rowsM = Array.from({ length: 5 }, (_, i) => Array.from({ length: 9 }, (_, k) => { const th = (i / 4) * Math.PI, ph = -Math.PI / 2 + (k / 8) * Math.PI; return { q: base.clone().addScaledVector(V(1, 0, 0), Math.sin(ph) * s * Math.sin(th)).addScaledVector(outD, (Math.cos(ph) * Math.sin(th) + 0.25) * s * 0.75).add(V(0, Math.cos(th) * s * 0.2, 0)), u: k / 8, v: i / 4 }; }));
      g.grid('mantar', rowsM, (q) => q.clone().sub(base));
      g.fan('mantar', { q: base, u: 0.5, v: 0.5 }, [...rowsM.map((row) => row[0]), rowsM[3][8], rowsM[2][8], rowsM[1][8], rowsM[0][0]], () => outD.clone().negate());
    }
  } },
  govde_mese: { bark: 'mese', wood: 'kirik', build(g, r) {
    agac(g, r, { h: 7, r0: 0.42, r1: 0.05, bend: 0.03, flare: 0.75, flareH: 1.0, lobes: 6, rings: 20, vTile: 1.6, branches: [
      { y: 2.5, a: 0.4, up: 0.45, len: 3.6, r: 0.2, lift: 0.9, sub: 2 }, { y: 2.9, a: 2.5, up: 0.5, len: 3.3, r: 0.19, lift: 0.9, sub: 2 }, { y: 3.4, a: 4.4, up: 0.55, len: 3.0, r: 0.17, lift: 0.8, sub: 2 },
      { y: 3.9, a: 1.4, up: 0.7, len: 2.6, r: 0.14, lift: 0.7, sub: 1 }, { y: 4.5, a: 3.4, up: 0.8, len: 2.2, r: 0.12, lift: 0.6, sub: 1 }, { y: 5.2, a: 5.4, up: 0.9, len: 1.6, r: 0.09, lift: 0.5, sub: 1 },
    ] });
  } },
  govde_cam: { bark: 'cam', wood: 'kirik', build(g, r) {
    const branches = [];
    for (let k = 0; k < 16; k++) { const y = 3.5 + k * 0.62 + r() * 0.3; branches.push({ y, a: k * 2.4 + r(), up: y > 11 ? 0.25 : -0.12, len: y > 11 ? 0.9 + r() * 0.5 : 0.25 + r() * 0.4, r: 0.05 - y * 0.0018, r1: 0.022, segs: 3, lift: y > 11 ? 0.3 : 0, wig: 0.08, n: 8 }); }
    agac(g, r, { h: 14, r0: 0.27, r1: 0.045, te: 1.0, bend: 0.004, flare: 0.4, flareH: 0.6, lobes: 4, rings: 26, vTile: 1.6, uRep: 1, branches });
  } },
  govde_hus: { bark: 'hus', wood: 'kirik', build(g, r) {
    agac(g, r, { h: 9, r0: 0.135, r1: 0.02, te: 0.9, bend: 0.012, flare: 0.45, flareH: 0.4, lobes: 4, rings: 24, vTile: 1.4, uRep: 1, n: 14, branches: [
      { y: 3.6, a: 0.8, up: 1.3, len: 2.6, r: 0.04, r1: 0.01, lift: 0.5, n: 8 }, { y: 4.3, a: 3.2, up: 1.4, len: 2.4, r: 0.038, r1: 0.01, lift: 0.5, n: 8 }, { y: 5.0, a: 5.1, up: 1.5, len: 2.1, r: 0.034, r1: 0.009, lift: 0.4, n: 8 },
      { y: 5.7, a: 1.9, up: 1.6, len: 1.8, r: 0.03, r1: 0.008, lift: 0.4, n: 8 }, { y: 6.5, a: 4.0, up: 1.7, len: 1.4, r: 0.025, r1: 0.008, lift: 0.3, n: 8 }, { y: 7.2, a: 0.2, up: 1.8, len: 1.0, r: 0.02, r1: 0.007, lift: 0.3, n: 8 },
    ] });
  } },
  govde_kayin: { bark: 'kayin', wood: 'kirik', build(g, r) {
    agac(g, r, { h: 10, r0: 0.31, r1: 0.04, bend: 0.01, flare: 0.5, flareH: 0.7, lobes: 5, rings: 22, vTile: 2, branches: [
      { y: 3.4, a: 0.3, up: 1.0, len: 4.2, r: 0.13, lift: 1.1, sub: 1 }, { y: 3.9, a: 2.3, up: 1.1, len: 4.0, r: 0.12, lift: 1.1, sub: 1 }, { y: 4.5, a: 4.3, up: 1.2, len: 3.6, r: 0.11, lift: 1.0, sub: 1 },
      { y: 5.2, a: 1.2, up: 1.3, len: 3.2, r: 0.1, lift: 0.9, sub: 1 }, { y: 5.9, a: 3.3, up: 1.4, len: 2.8, r: 0.085, lift: 0.8 }, { y: 6.7, a: 5.3, up: 1.5, len: 2.3, r: 0.07, lift: 0.7 }, { y: 7.5, a: 2.0, up: 1.6, len: 1.8, r: 0.055, lift: 0.6 },
    ] });
  } },
  // Ladin: dümdüz gövde; dipten tepeye çepeçevre dizilmiş ince, yatay dal dipleri
  govde_ladin: { bark: 'ladin', wood: 'kirik', build(g, r) {
    const branches = [];
    for (let k = 0; k < 16; k++) { const y = 1.4 + k * 0.9, t = k / 15, n = k < 13 ? 4 : 3; for (let q = 0; q < n; q++) branches.push({ y: y + (r() - 0.5) * 0.2, a: (q / n) * 6.283 + k * 0.7 + r() * 0.3, up: 0.02 - 0.1 * (1 - t), len: (1.7 - 1.25 * t) * (0.75 + r() * 0.4), r: 0.038 - 0.02 * t, r1: 0.012, segs: 3, lift: -0.05, wig: 0.06, n: 6 }); }
    agac(g, r, { h: 16, r0: 0.3, r1: 0.03, te: 1.0, bend: 0.002, flare: 0.4, flareH: 0.6, lobes: 5, rings: 26, vTile: 1.6, uRep: 1, branches });
  } },
  // Selvi: ince, düz gövde; boyunca yukarı bakan kısa dal dipleri
  govde_selvi: { bark: 'selvi', wood: 'kirik', build(g, r) {
    const branches = [];
    for (let k = 0; k < 34; k++) { const y = 0.9 + k * 0.32, t = k / 33; branches.push({ y, a: k * 2.4 + r() * 0.6, up: 1.3 + r() * 0.6, len: (0.75 - 0.4 * t) * (0.7 + r() * 0.5), r: 0.03 - 0.014 * t, r1: 0.01, segs: 3, lift: 0.5, wig: 0.08, n: 6 }); }
    agac(g, r, { h: 12, r0: 0.17, r1: 0.025, te: 0.95, bend: 0.004, flare: 0.5, flareH: 0.5, lobes: 6, rings: 24, vTile: 1.4, uRep: 1, n: 14, branches });
  } },
  // Yaşlı elma ağacı: kısa, eğri büğrü gövde; alçaktan yayılan kalın dallar
  govde_meyve: { bark: 'meyve', wood: 'kirik', build(g, r) {
    agac(g, r, { h: 3.4, r0: 0.24, r1: 0.05, te: 0.7, bend: 0.07, flare: 0.6, flareH: 0.5, lobes: 5, rings: 16, vTile: 1.2, uRep: 1, branches: [
      { y: 1.05, a: 0.5, up: 0.3, len: 2.5, r: 0.13, lift: 0.9, wig: 0.3, sub: 2, segs: 6 }, { y: 1.25, a: 2.7, up: 0.35, len: 2.4, r: 0.12, lift: 0.9, wig: 0.3, sub: 2, segs: 6 },
      { y: 1.5, a: 4.6, up: 0.4, len: 2.2, r: 0.11, lift: 0.8, wig: 0.3, sub: 2, segs: 6 }, { y: 1.8, a: 1.6, up: 0.55, len: 1.9, r: 0.09, lift: 0.7, wig: 0.3, sub: 1, segs: 5 },
      { y: 2.2, a: 3.7, up: 0.7, len: 1.6, r: 0.075, lift: 0.6, wig: 0.28, sub: 1, segs: 5 }, { y: 2.6, a: 5.6, up: 0.9, len: 1.2, r: 0.06, lift: 0.5, wig: 0.25, sub: 1, segs: 4 },
    ] });
  } },
};
export const GOVDELER = Object.keys(DEFS);
export function createGovde(name) {
  const D = DEFS[name], g = new Geo(), mats = { kabuk: kabuk(D.bark), odun: kesit(D.wood) };
  for (const [k, f] of Object.entries(D.extra || {})) mats[k] = f();
  D.build(g, rng(GOVDELER.indexOf(name) * 977 + 5));
  const mesh = g.mesh(name, mats);
  // Tabana oturt: en alt nokta y = 0 (kökler toprağa girer; kütük ve ağaçlarda kök uçları biraz altta kalır)
  mesh.geometry.computeBoundingBox();
  const b = mesh.geometry.boundingBox;
  if (name.startsWith('govde_devrik')) mesh.geometry.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2);
  return mesh;
}
