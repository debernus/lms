import * as THREE from 'three';

// Osmanlı Mavzeri (1893 modeli) piyade tüfeği. Birim metre; namlu +Z, yukarı +Y, sürgü kolu -X (nişancının sağı).
// Boyun ortası orijinde; namlu ekseni y = 0,02. s: dipçik tabanından ileriye uzaklık (0 … 1,235).
const L = 1.235, AX = 0.02, TAU = Math.PI * 2;
const V = (x, y, z) => new THREE.Vector3(x, y, z), Z = (s) => s - L / 2;
const sgn = Math.sign, pw = (v, e) => sgn(v) * Math.abs(v) ** e;

// ---------- Dokular ----------
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}
function tex(name, c, srgb) {
  const t = new THREE.CanvasTexture(c);
  t.name = name;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 4;
  return t;
}
// Yükseklik tuvalinden kabartma (normal) haritası
function normalFrom(hc, strength) {
  const w = hc.width, h = hc.height, src = hc.getContext('2d').getImageData(0, 0, w, h).data, [c, g] = canvas(w, h), out = g.createImageData(w, h);
  const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength, l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    out.data[i] = (-dx / l * 0.5 + 0.5) * 255;
    out.data[i + 1] = (dy / l * 0.5 + 0.5) * 255;
    out.data[i + 2] = (1 / l * 0.5 + 0.5) * 255;
    out.data[i + 3] = 255;
  }
  g.putImageData(out, 0, 0);
  return c;
}
const orm = (rough, metal) => `rgb(255,${Math.round(rough * 255)},${Math.round(metal * 255)})`;
const grey = (v, a = 1) => `rgba(${v},${v},${v},${a})`;

// Ahşap: u tüfek boyunca (damar yönü), v kesitin çevresinde. 1024 × 512
function woodMaterial() {
  const W = 1024, Hh = 512, r = rng(93), [cc, c] = canvas(W, Hh), [oc, o] = canvas(W, Hh), [hc, h] = canvas(W, Hh);
  c.fillStyle = '#4a2c17'; c.fillRect(0, 0, W, Hh);
  o.fillStyle = orm(0.55, 0); o.fillRect(0, 0, W, Hh);
  h.fillStyle = grey(128); h.fillRect(0, 0, W, Hh);
  // Geniş renk dalgaları
  for (let k = 0; k < 26; k++) {
    const y = r() * Hh, t = 10 + r() * 40;
    c.fillStyle = r() < 0.5 ? `rgba(30,16,8,${0.1 + r() * 0.16})` : `rgba(110,68,36,${0.08 + r() * 0.12})`;
    c.beginPath();
    c.moveTo(0, y);
    for (let x = 0; x <= W; x += 32) c.lineTo(x, y + Math.sin(x * 0.006 + k) * 14 + Math.sin(x * 0.021 + k * 2) * 5);
    for (let x = W; x >= 0; x -= 32) c.lineTo(x, y + t + Math.sin(x * 0.006 + k) * 14 + Math.sin(x * 0.017 + k) * 6);
    c.fill();
  }
  // Damar çizgileri
  for (let k = 0; k < 520; k++) {
    const y = r() * Hh, x0 = r() * W, len = 80 + r() * 500, dark = r() < 0.65, a = 0.12 + r() * 0.3, ph = r() * 6, wv = 2 + r() * 8;
    const line = (g, style, lw) => {
      g.strokeStyle = style; g.lineWidth = lw; g.beginPath();
      for (let x = x0; x <= x0 + len; x += 16) g.lineTo(x % W, y + Math.sin(x * 0.008 + ph) * wv + (x % W < x0 ? 0 : 0));
      g.stroke();
    };
    line(c, dark ? `rgba(24,12,5,${a})` : `rgba(128,82,44,${a * 0.7})`, 0.6 + r() * 1.4);
    if (dark) line(h, grey(70, a * 0.7), 1);
  }
  // Elin aşındırdığı açık, parlak yerler: kabza (s 0,33–0,42) ve kundağın tutulan yeri (s 0,66–0,82), dipçik burnu
  const worn = (u0, u1, v0, v1, n, amt) => {
    for (let k = 0; k < n; k++) {
      const x = (u0 + r() * (u1 - u0)) * W, y = (v0 + r() * (v1 - v0)) * Hh, rx = 18 + r() * 46, ry = 10 + r() * 30;
      for (const dy of [0, Hh, -Hh]) {
        const gr = c.createRadialGradient(x, y + dy, 0, x, y + dy, rx);
        gr.addColorStop(0, `rgba(140,96,56,${amt})`); gr.addColorStop(1, 'rgba(140,96,56,0)');
        c.fillStyle = gr; c.fillRect(x - rx, y + dy - rx, rx * 2, rx * 2);
        const go = o.createRadialGradient(x, y + dy, 0, x, y + dy, rx);
        go.addColorStop(0, `rgba(255,${Math.round(0.3 * 255)},0,${amt * 1.6})`); go.addColorStop(1, `rgba(255,${Math.round(0.3 * 255)},0,0)`);
        o.fillStyle = go; o.fillRect(x - rx, y + dy - ry * 2, rx * 2, ry * 4);
      }
    }
  };
  worn(0.265, 0.345, 0, 1, 60, 0.3);
  worn(0.53, 0.67, 0, 1, 70, 0.24);
  worn(0.0, 0.03, 0, 1, 26, 0.3);
  worn(0.06, 0.24, 0.42, 0.58, 20, 0.2); // dipçiğin üst sırtı (yanak yeri)
  // Kir: çeliğe değen yerler koyulaşır
  for (const [u0, u1] of [[0.345, 0.45], [0.7, 0.72], [0.83, 0.86]]) { c.fillStyle = 'rgba(14,8,4,0.22)'; c.fillRect(u0 * W, 0, (u1 - u0) * W, Hh); }
  // Çizik ve ezikler
  for (let k = 0; k < 170; k++) {
    const x = r() * W, y = r() * Hh, a = (r() - 0.5) * 1.2 + (r() < 0.3 ? 1.5 : 0), len = 6 + r() * 46, light = r() < 0.45;
    const seg = (g, style, lw) => { g.strokeStyle = style; g.lineWidth = lw; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke(); };
    seg(c, light ? `rgba(168,124,80,${0.25 + r() * 0.3})` : `rgba(14,7,3,${0.3 + r() * 0.35})`, 0.7 + r());
    seg(h, grey(30, 0.6), 1.2);
    seg(o, orm(0.85, 0), 1.2);
  }
  for (let k = 0; k < 90; k++) {
    const x = r() * W, y = r() * Hh, rx = 2 + r() * 7, ry = 1.5 + r() * 4;
    c.fillStyle = `rgba(16,8,3,${0.25 + r() * 0.3})`; c.beginPath(); c.ellipse(x, y, rx, ry, r() * 3, 0, 7); c.fill();
    h.fillStyle = grey(40, 0.7); h.beginPath(); h.ellipse(x, y, rx, ry, 0, 0, 7); h.fill();
    o.fillStyle = orm(0.8, 0); o.beginPath(); o.ellipse(x, y, rx, ry, 0, 0, 7); o.fill();
  }
  const m = tex('ahsap_pm', oc, false);
  return new THREE.MeshStandardMaterial({ name: 'ahsap', map: tex('ahsap_renk', cc, true), roughnessMap: m, metalnessMap: m, normalMap: tex('ahsap_kabartma', normalFrom(hc, 2.2), false), normalScale: new THREE.Vector2(0.9, 0.9), roughness: 1, metalness: 1 });
}
// Çelik: 512 × 512. v bölgeleri: 0–0,78 barutlanmış yüzey; 0,78–0,86 kenar aşınması (gümüşiye geçiş);
// 0,88–0,94 namlu içi (siyah); 0,95–1 parlak, çok aşınmış
function steelMaterial() {
  const W = 512, r = rng(1893), [cc, c] = canvas(W, W), [oc, o] = canvas(W, W), [hc, h] = canvas(W, W), Y = (v) => (1 - v) * W;
  c.fillStyle = '#23262b'; c.fillRect(0, 0, W, W);
  o.fillStyle = orm(0.38, 1); o.fillRect(0, 0, W, W);
  h.fillStyle = grey(128); h.fillRect(0, 0, W, W);
  for (let k = 0; k < 500; k++) { // leke ve ton oynaması
    const x = r() * W, y = r() * W, s = 6 + r() * 40;
    c.fillStyle = r() < 0.5 ? `rgba(10,11,13,${0.1 + r() * 0.2})` : `rgba(70,76,86,${0.05 + r() * 0.1})`;
    c.beginPath(); c.ellipse(x, y, s, s * (0.3 + r() * 0.7), r() * 3, 0, 7); c.fill();
  }
  for (let k = 0; k < 380; k++) { // çizikler
    const x = r() * W, y = r() * W, a = r() < 0.7 ? (r() - 0.5) * 0.5 + Math.PI / 2 : r() * 7, len = 5 + r() * 50, al = 0.15 + r() * 0.4;
    const seg = (g, style, lw) => { g.strokeStyle = style; g.lineWidth = lw; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke(); };
    seg(c, `rgba(150,156,164,${al})`, 0.5 + r() * 0.8);
    seg(o, orm(0.22, 1), 1);
    seg(h, grey(60, 0.5), 1);
  }
  for (let k = 0; k < 150; k++) { // pas ve çukurcuklar
    const x = r() * W, y = Y(r() * 0.78), s = 1.5 + r() * 7;
    c.fillStyle = `rgba(${90 + r() * 40},${48 + r() * 20},26,${0.25 + r() * 0.4})`; c.beginPath(); c.ellipse(x, y, s, s * (0.5 + r() * 0.5), r() * 3, 0, 7); c.fill();
    o.fillStyle = orm(0.85, 0.35); o.beginPath(); o.ellipse(x, y, s, s * 0.7, 0, 0, 7); o.fill();
    h.fillStyle = grey(170, 0.6); h.beginPath(); h.ellipse(x, y, s, s * 0.7, 0, 0, 7); h.fill();
  }
  // Kenar aşınması: v 0,78 → 0,86 arasında gümüşiye geçer; düzensiz
  for (let x = 0; x < W; x += 2) {
    const reach = 0.035 + 0.045 * (0.5 + 0.5 * Math.sin(x * 0.07) * Math.sin(x * 0.023 + 1)) + r() * 0.01, y1 = Y(0.865), y0 = Y(0.865 - reach);
    const gr = c.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, 'rgba(160,166,172,0)'); gr.addColorStop(1, 'rgba(172,178,184,0.95)');
    c.fillStyle = gr; c.fillRect(x, y1, 2, y0 - y1);
    const go = o.createLinearGradient(0, y0, 0, y1); go.addColorStop(0, 'rgba(255,60,255,0)'); go.addColorStop(1, 'rgba(255,60,255,0.9)');
    o.fillStyle = go; o.fillRect(x, y1, 2, y0 - y1);
  }
  c.fillStyle = '#050505'; c.fillRect(0, Y(0.945), W, Y(0.875) - Y(0.945));
  o.fillStyle = orm(0.9, 0.2); o.fillRect(0, Y(0.945), W, Y(0.875) - Y(0.945));
  c.fillStyle = '#9da3a9'; c.fillRect(0, 0, W, Y(0.95));
  o.fillStyle = orm(0.26, 1); o.fillRect(0, 0, W, Y(0.95));
  for (let k = 0; k < 160; k++) { c.fillStyle = `rgba(40,42,46,${0.2 + r() * 0.4})`; c.fillRect(r() * W, r() * Y(0.95), 1 + r() * 14, 1); }
  const m = tex('celik_pm', oc, false);
  return new THREE.MeshStandardMaterial({ name: 'celik', map: tex('celik_renk', cc, true), roughnessMap: m, metalnessMap: m, normalMap: tex('celik_kabartma', normalFrom(hc, 1.6), false), normalScale: new THREE.Vector2(0.7, 0.7), roughness: 1, metalness: 1 });
}

// ---------- Ağ kurucu: paylaşılan köşeli (yumuşak) ızgaralar; her ızgara ayrı köşe kümesi (keskin kenar) ----------
class Geo {
  constructor() { this.p = []; this.uv = []; this.i = []; }
  vert(e) { this.p.push(e.q.x, e.q.y, e.q.z); this.uv.push(e.u, e.v); return this.p.length / 3 - 1; }
  orient(start, out) {
    const P = this.p, at = (k) => V(P[k * 3], P[k * 3 + 1], P[k * 3 + 2]);
    let vote = 0;
    for (let t = start; t < this.i.length; t += 3) {
      const a = at(this.i[t]), b = at(this.i[t + 1]), c = at(this.i[t + 2]);
      vote += b.clone().sub(a).cross(c.clone().sub(a)).dot(out(a.add(b).add(c).multiplyScalar(1 / 3)));
    }
    if (vote < 0) for (let t = start; t < this.i.length; t += 3) [this.i[t + 1], this.i[t + 2]] = [this.i[t + 2], this.i[t + 1]];
  }
  grid(rows, out) {
    const ids = rows.map((row) => row.map((e) => this.vert(e))), start = this.i.length;
    for (let j = 0; j + 1 < ids.length; j++) for (let k = 0; k + 1 < ids[j].length; k++) this.i.push(ids[j][k], ids[j][k + 1], ids[j + 1][k + 1], ids[j][k], ids[j + 1][k + 1], ids[j + 1][k]);
    this.orient(start, out);
  }
  fan(center, ring, out) {
    const c = this.vert(center), ids = ring.map((e) => this.vert(e)), start = this.i.length;
    for (let k = 0; k + 1 < ids.length; k++) this.i.push(c, ids[k], ids[k + 1]);
    this.orient(start, out);
  }
  mesh(name, material) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.i);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, material);
    m.name = name;
    m.castShadow = m.receiveShadow = true;
    return m;
  }
}
const radial = (cx = 0, cy = AX) => (c) => V(c.x - cx, c.y - cy, 0);
const dirZ = (d) => () => V(0, 0, d), dirOf = (x, y, z) => () => V(x, y, z);
// Z ekseni boyunca dönel yüzey. prof: [s, r, v?]
function lathe(g, prof, { n = 16, cx = 0, cy = AX, v0 = 0.1, v1 = 0.72, uRep = 1 } = {}) {
  const cum = [0];
  for (let j = 1; j < prof.length; j++) cum.push(cum[j - 1] + Math.hypot(prof[j][0] - prof[j - 1][0], prof[j][1] - prof[j - 1][1]));
  const rows = prof.map((p, j) => Array.from({ length: n + 1 }, (_, k) => ({ q: V(cx + p[1] * Math.cos((k / n) * TAU), cy + p[1] * Math.sin((k / n) * TAU), Z(p[0])), u: (k / n) * uRep, v: p[2] ?? v0 + ((v1 - v0) * cum[j]) / cum[cum.length - 1] })));
  g.grid(rows, radial(cx, cy));
}
// Z'ye bakan halka ya da daire yüz: dış kenarı aşınmış
function disc(g, s, r0, r1, dir, { n = 16, cx = 0, cy = AX, vIn = 0.6, vOut = 0.86 } = {}) {
  const ringAt = (r, v) => Array.from({ length: n + 1 }, (_, k) => ({ q: V(cx + r * Math.cos((k / n) * TAU), cy + r * Math.sin((k / n) * TAU), Z(s)), u: k / n, v }));
  if (r0 > 0) g.grid([ringAt(r0, vIn), ringAt(r1, vOut)], dirZ(dir));
  else g.fan({ q: V(cx, cy, Z(s)), u: 0.5, v: vIn }, ringAt(r1, vOut), dirZ(dir));
}
// İki nokta arasında silindir / koni, uçları kapalı
function cyl(g, a, b, ra, rb, { n = 16, va = 0.3, vb = 0.6, caps = true } = {}) {
  const d = b.clone().sub(a).normalize(), u = Math.abs(d.y) < 0.9 ? V(0, 1, 0).cross(d).normalize() : V(1, 0, 0), w = d.clone().cross(u);
  const ringAt = (c, r, v) => Array.from({ length: n + 1 }, (_, k) => ({ q: c.clone().addScaledVector(u, r * Math.cos((k / n) * TAU)).addScaledVector(w, r * Math.sin((k / n) * TAU)), u: k / n, v }));
  const mid = a.clone().add(b).multiplyScalar(0.5);
  g.grid([ringAt(a, ra, va), ringAt(b, rb, vb)], (c) => c.clone().sub(mid).projectOnPlane(d));
  if (caps) { g.fan({ q: a, u: 0.5, v: 0.6 }, ringAt(a, ra, 0.86), () => d.clone().negate()); g.fan({ q: b, u: 0.5, v: 0.6 }, ringAt(b, rb, 0.86), () => d); }
}
function sphere(g, c, r, { nu = 16, nv = 8, v = 0.83 } = {}) {
  const rows = Array.from({ length: nv + 1 }, (_, j) => Array.from({ length: nu + 1 }, (_, k) => { const th = (j / nv) * Math.PI, ph = (k / nu) * TAU; return { q: V(c.x + r * Math.cos(th), c.y + r * Math.sin(th) * Math.cos(ph), c.z + r * Math.sin(th) * Math.sin(ph)), u: k / nu, v: v + 0.03 * Math.sin(th * 3) }; }));
  g.grid(rows, (p) => p.clone().sub(c));
}
// Kutu: her yüz ayrı (keskin kenar); yüzün bir kenarı aşınmış bölgeye düşer
function box(g, x0, x1, y0, y1, z0, z1, skip = '') {
  const F = { '+x': [[x1, y0, z0], [x1, y0, z1], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]], '-x': [[x0, y0, z0], [x0, y0, z1], [x0, y1, z0], [x0, y1, z1], [-1, 0, 0]], '+y': [[x0, y1, z0], [x1, y1, z0], [x0, y1, z1], [x1, y1, z1], [0, 1, 0]], '-y': [[x0, y0, z0], [x1, y0, z0], [x0, y0, z1], [x1, y0, z1], [0, -1, 0]], '+z': [[x0, y0, z1], [x1, y0, z1], [x0, y1, z1], [x1, y1, z1], [0, 0, 1]], '-z': [[x0, y0, z0], [x1, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]] };
  for (const [key, [a, b, c, d, n]] of Object.entries(F)) if (!skip.includes(key)) g.grid([[{ q: V(...a), u: 0.1, v: 0.5 }, { q: V(...b), u: 0.4, v: 0.5 }], [{ q: V(...c), u: 0.1, v: 0.86 }, { q: V(...d), u: 0.4, v: 0.86 }]], dirOf(...n));
}
// Kapalı ya da açık yol boyunca tel (yuvarlak kesit)
function wire(g, path, r, { m = 8, closed = true, normal = V(0, 0, 1), v = 0.7 } = {}) {
  const N = path.length, rows = [];
  for (let j = 0; j <= (closed ? N : N - 1); j++) {
    const p = path[j % N], T = path[(j + 1) % N].clone().sub(path[(j - 1 + N) % N]);
    if (!closed && j === 0) T.copy(path[1]).sub(path[0]);
    if (!closed && j === N - 1) T.copy(path[N - 1]).sub(path[N - 2]);
    const B = T.normalize().clone().cross(normal).normalize();
    rows.push(Array.from({ length: m + 1 }, (_, k) => ({ q: p.clone().addScaledVector(B, r * Math.cos((k / m) * TAU)).addScaledVector(normal, r * Math.sin((k / m) * TAU)), u: k / m, v: v + 0.1 * Math.sin(j) })));
  }
  const c = path.reduce((s, q) => s.add(q), V(0, 0, 0)).multiplyScalar(1 / N);
  g.grid(rows, (q) => { let best = path[0]; for (const p of path) if (p.distanceToSquared(q) < best.distanceToSquared(q)) best = p; return q.clone().sub(best).lengthSq() > 1e-12 ? q.clone().sub(best) : q.clone().sub(c); });
}
const roundRect = (cx, cy, z, hw, hh, rc, plane = 'xy') => {
  const pts = [];
  for (const [sx, sy, a0] of [[1, 1, 0], [-1, 1, 1], [-1, -1, 2], [1, -1, 3]]) for (let k = 0; k <= 3; k++) { const a = (a0 + k / 3) * (Math.PI / 2); pts.push(plane === 'xy' ? V(cx + sx * (hw - rc) + rc * Math.cos(a), cy + sy * (hh - rc) + rc * Math.sin(a), z) : V(z, cy + sy * (hh - rc) + rc * Math.sin(a), cx + sx * (hw - rc) + rc * Math.cos(a))); }
  return pts;
};

// ---------- Ölçü tabloları ----------
// Ahşap kesitleri: [s, üst, alt, genişlik, yan dolgunluk, üst biçim, alt biçim]
const DIPCIK = [
  [0.004, -0.015, -0.14, 0.045, 0.55, 0.6, 0.6], [0.06, -0.013, -0.127, 0.046, 0.55, 0.62, 0.62], [0.14, -0.0095, -0.108, 0.046, 0.6, 0.66, 0.66], [0.22, -0.006, -0.086, 0.044, 0.66, 0.72, 0.72],
  [0.28, -0.002, -0.066, 0.041, 0.78, 0.82, 0.85], [0.33, 0.0015, -0.0455, 0.038, 0.92, 0.95, 0.95], [0.375, 0.0045, -0.0405, 0.038, 0.96, 1, 1], [0.42, 0.008, -0.037, 0.039, 0.9, 0.9, 0.95],
  [0.445, 0.015, -0.0345, 0.043, 0.82, 0.6, 0.9], [0.47, 0.0175, -0.032, 0.046, 0.78, 0.5, 0.9], [0.51, 0.0185, -0.027, 0.046, 0.78, 0.48, 0.95], [0.55, 0.019, -0.021, 0.046, 0.8, 0.46, 1],
];
const KUNDAK = [[0.55, 0.019, -0.021, 0.046, 0.8, 0.46, 1], [0.6, 0.02, -0.02, 0.046, 0.8, 0.45, 1], [0.8, 0.02, -0.02, 0.046, 0.8, 0.45, 1], [1.0, 0.02, -0.02, 0.046, 0.8, 0.45, 1], [1.04, 0.0195, -0.0195, 0.045, 0.82, 0.5, 1], [1.05, 0.018, -0.018, 0.042, 0.85, 0.55, 1]];
function sectionAt(keys, s) {
  let i = 0;
  while (i < keys.length - 2 && s > keys[i + 1][0]) i++;
  const a = keys[i], b = keys[i + 1], t = Math.min(1, Math.max(0, (s - a[0]) / (b[0] - a[0]))), p = keys[Math.max(i - 1, 0)], n = keys[Math.min(i + 2, keys.length - 1)];
  return a.map((_, c) => {
    if (c === 0) return s;
    const ma = ((b[c] - p[c]) / (b[0] - p[0])) * (b[0] - a[0]), mb = ((n[c] - a[c]) / (n[0] - a[0])) * (b[0] - a[0]), t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * a[c] + (t3 - 2 * t2 + t) * ma + (-2 * t3 + 3 * t2) * b[c] + (t3 - t2) * mb;
  });
}
const WN = 32;
function woodRing([s, top, bot, w, e, pt, pb]) {
  const yc = (top + bot) / 2, h = top - bot;
  return Array.from({ length: WN + 1 }, (_, k) => { const a = -Math.PI / 2 + (k / WN) * TAU, cs = Math.cos(a), sn = Math.sin(a); return { q: V((w / 2) * pw(cs, e), yc + (h / 2) * pw(sn, sn > 0 ? pt : pb), Z(s)), u: s / L, v: k / WN }; });
}
function woodBody(g, keys, samples) {
  const rows = samples.map((s) => woodRing(sectionAt(keys, s)));
  g.grid(rows, (c) => V(c.x, c.y + 0.02 + 0.05 * Math.max(0, 0.3 - (c.z + L / 2)) / 0.3, 0));
  for (const [row, d] of [[rows[0], -1], [rows[rows.length - 1], 1]]) g.fan({ q: V(0, (row[0].q.y + row[WN / 2].q.y) / 2, row[0].q.z), u: row[0].u, v: 0.5 }, row.map((e) => ({ ...e })), dirZ(d));
}
const NAMLU = [[0.495, 0.015], [0.553, 0.015], [0.557, 0.0138], [0.6, 0.0128], [0.604, 0.012], [0.9, 0.0098], [1.19, 0.0078], [1.214, 0.0075], [1.221, 0.0084], [1.235, 0.0084]];
const rb = (s) => { for (let i = 1; i < NAMLU.length; i++) if (s <= NAMLU[i][0]) return NAMLU[i - 1][1] + ((NAMLU[i][1] - NAMLU[i - 1][1]) * (s - NAMLU[i - 1][0])) / (NAMLU[i][0] - NAMLU[i - 1][0]); return 0.0084; };
const GRIP_S = 0.375, SOL_S = 0.74, GEZ_S = 0.588, GEZ_Y = 0.0432;

// ---------- Model ----------
export function createTufekMavzer() {
  const root = new THREE.Group(), wood = woodMaterial(), steel = steelMaterial();
  root.name = 'tufek_mavzer';
  const add = (name, mat, build) => { const g = new Geo(); build(g); root.add(g.mesh(name, mat)); };
  const span = (a, b, n) => Array.from({ length: n + 1 }, (_, k) => a + ((b - a) * k) / n);

  add('dipcik', wood, (g) => woodBody(g, DIPCIK, [...span(0.004, 0.28, 16), ...span(0.295, 0.47, 14).slice(0), ...span(0.49, 0.55, 3)]));
  add('kundak', wood, (g) => {
    woodBody(g, KUNDAK, [...span(0.55, 0.6, 2), ...span(0.65, 1.0, 7), 1.02, 1.035, 1.045, 1.05]);
    // Üst el koruyucu: namlunun üstünü örten yarım boru (gezin önünden arka bileziğe)
    const S = span(0.662, 0.876, 8), rows = S.map((s, j) => Array.from({ length: 13 }, (_, k) => { const a = (k / 12) * Math.PI, end = j === 0 || j === 8 ? 0.0015 : 0; return { q: V(0.0215 * Math.cos(a), AX + (rb(s) + 0.0068 - end) * Math.sin(a) ** 0.85, Z(s)), u: s / L, v: 0.25 + 0.5 * (k / 12) }; }));
    g.grid(rows, (c) => V(c.x, c.y - AX, 0));
    for (const [row, d] of [[rows[0], -1], [rows[8], 1]]) g.fan({ q: V(0, AX, row[0].q.z), u: row[0].u, v: 0.5 }, row.map((e) => ({ ...e })), dirZ(d));
  });
  add('namlu', steel, (g) => {
    lathe(g, [[0.495, 0.015], [0.553, 0.015, 0.84], [0.557, 0.0138, 0.7], [0.6, 0.0128, 0.84], [0.604, 0.012, 0.7], [0.9, 0.0098, 0.35], [1.19, 0.0078, 0.2], [1.214, 0.0075, 0.3], [1.221, 0.0084, 0.6], [1.2335, 0.0084, 0.84], [1.235, 0.0078, 0.86]], { n: 24, uRep: 2 });
    disc(g, 1.235, 0.0038, 0.0078, 1, { n: 24, vIn: 0.7, vOut: 0.86 });
    lathe(g, [[1.235, 0.0038, 0.86], [1.232, 0.0036, 0.9], [1.2, 0.0036, 0.92]], { n: 24 }); // namlu içi
    disc(g, 1.2, 0, 0.0036, 1, { n: 24, vIn: 0.91, vOut: 0.91 });
    disc(g, 0.495, 0, 0.015, -1, { n: 24 });
  });
  add('govde', steel, (g) => {
    // Arka köprü
    lathe(g, [[0.36, 0.0145, 0.86], [0.3625, 0.0165, 0.84], [0.38, 0.0165, 0.5], [0.3965, 0.0165, 0.84], [0.398, 0.0158, 0.86]]);
    disc(g, 0.36, 0.0098, 0.0145, -1);
    disc(g, 0.398, 0.0098, 0.0158, 1);
    // Orta bölüm: üstü açık oluk (fişek yatağı açıklığı)
    const A0 = (150 * Math.PI) / 180, A1 = (390 * Math.PI) / 180, arc = (r, s, v) => Array.from({ length: 15 }, (_, k) => { const a = A0 + ((A1 - A0) * k) / 14; return { q: V(r * Math.cos(a), AX + r * Math.sin(a), Z(s)), u: k / 14, v: k === 0 || k === 14 ? 0.86 : v }; });
    g.grid([arc(0.0156, 0.398, 0.45), arc(0.0156, 0.474, 0.55)], radial());
    g.grid([arc(0.0104, 0.398, 0.3), arc(0.0104, 0.474, 0.35)], (c) => V(-c.x, AX - c.y, 0));
    for (const a of [A0, A1]) g.grid([[0.398, 0.474].map((s) => ({ q: V(0.0104 * Math.cos(a), AX + 0.0104 * Math.sin(a), Z(s)), u: 0.2, v: 0.86 })), [0.398, 0.474].map((s) => ({ q: V(0.0156 * Math.cos(a), AX + 0.0156 * Math.sin(a), Z(s)), u: 0.3, v: 0.8 }))], dirOf(0, 1, 0));
    // Ön halka (namlu yuvası)
    lathe(g, [[0.474, 0.0162, 0.86], [0.4765, 0.0176, 0.84], [0.5, 0.0176, 0.4], [0.531, 0.0176, 0.84], [0.535, 0.0158, 0.86]], { n: 20 });
    disc(g, 0.474, 0.0098, 0.0162, -1, { n: 20 });
    disc(g, 0.535, 0.0138, 0.0158, 1, { n: 20 });
    // Kuyruk: kabzanın üstüne uzanan dil
    box(g, -0.0065, 0.0065, 0.004, 0.0105, Z(0.325), Z(0.362), '-y');
  });
  add('surgu', steel, (g) => {
    lathe(g, [[0.354, 0.0098, 0.86], [0.37, 0.0098, 0.8], [0.44, 0.0098, 0.83], [0.476, 0.0098, 0.8]]); // sürgü gövdesi: sürtünmeyle parlamış
    disc(g, 0.476, 0, 0.0098, 1);
    // Arka kapak ve horoz kuyruğu
    lathe(g, [[0.314, 0.0055, 0.86], [0.318, 0.0082, 0.84], [0.33, 0.0092, 0.5], [0.343, 0.0104, 0.6], [0.3555, 0.0104, 0.84], [0.357, 0.0098, 0.86]]);
    disc(g, 0.314, 0, 0.0055, -1);
    box(g, -0.0028, 0.0028, AX + 0.009, AX + 0.0185, Z(0.338), Z(0.352), '-y'); // emniyet mandalı
    // Sürgü kolu: sağa (-X) yatay çıkar, ucu küre
    const zc = Z(0.405);
    cyl(g, V(-0.006, AX, zc), V(-0.013, AX, zc), 0.0075, 0.0058, { va: 0.6, vb: 0.84, caps: false });
    cyl(g, V(-0.013, AX, zc), V(-0.05, AX, zc), 0.0058, 0.0048, { va: 0.84, vb: 0.8, caps: false });
    sphere(g, V(-0.058, AX, zc), 0.0108);
  });
  add('tetik', steel, (g) => {
    // Korkuluk: içi boş oval şerit (0,065 × 0,028), üstü kundağa gömülü
    const sc = 0.4625, yc = -0.045, a = 0.0325, b = 0.014, t = 0.0028, hw = 0.0068, N = 28;
    const at = (k, off, x, v) => { const f = (k / N) * TAU, nrm = V(0, Math.sin(f) / b, Math.cos(f) / a).normalize(); return { q: V(x, yc + b * Math.sin(f) + nrm.y * off, Z(sc) + a * Math.cos(f) + nrm.z * off), u: (k / N) * 3, v }; };
    const loop = (f) => Array.from({ length: N + 1 }, (_, k) => f(k)), C = V(0, yc, Z(sc));
    g.grid([loop((k) => at(k, 0, -hw, 0.86)), loop((k) => at(k, 0, 0, 0.55)), loop((k) => at(k, 0, hw, 0.86))], (c) => c.clone().sub(C).setX(0));
    g.grid([loop((k) => at(k, -t, -hw, 0.84)), loop((k) => at(k, -t, hw, 0.84))], (c) => C.clone().sub(c).setX(0));
    for (const s of [-1, 1]) g.grid([loop((k) => at(k, 0, s * hw, 0.86)), loop((k) => at(k, -t, s * hw, 0.7))], dirOf(s, 0, 0));
    // Tetik: öne kıvrık dil
    const P = [[0.4635, -0.03], [0.461, -0.038], [0.4625, -0.045], [0.467, -0.0505], [0.4705, -0.052]], hx = 0.003, th = 0.0036;
    const frame = (j) => { const p = P[j], d = V(0, P[Math.min(j + 1, 4)][1] - P[Math.max(j - 1, 0)][1], P[Math.min(j + 1, 4)][0] - P[Math.max(j - 1, 0)][0]).normalize(), n = V(0, -d.z, d.y), k = j === 4 ? 0.55 : 1; return [V(-hx, p[1] - n.y * th * k * 0.5, Z(p[0]) - n.z * th * k * 0.5), V(hx, p[1] - n.y * th * k * 0.5, Z(p[0]) - n.z * th * k * 0.5), V(hx, p[1] + n.y * th * k * 0.5, Z(p[0]) + n.z * th * k * 0.5), V(-hx, p[1] + n.y * th * k * 0.5, Z(p[0]) + n.z * th * k * 0.5)]; };
    const F = P.map((_, j) => frame(j));
    for (let e = 0; e < 4; e++) { const e1 = (e + 1) % 4; g.grid(F.map((f, j) => [{ q: f[e], u: j / 4, v: 0.86 }, { q: f[e1], u: j / 4, v: 0.6 }]), (c) => { let best = 0; for (let j = 1; j < 5; j++) if (Math.abs(Z(P[j][0]) - c.z) + Math.abs(P[j][1] - c.y) < Math.abs(Z(P[best][0]) - c.z) + Math.abs(P[best][1] - c.y)) best = j; return c.clone().sub(V(0, P[best][1], Z(P[best][0]))); }); }
    g.grid([[{ q: F[4][0], u: 0, v: 0.86 }, { q: F[4][1], u: 1, v: 0.86 }], [{ q: F[4][3], u: 0, v: 0.86 }, { q: F[4][2], u: 1, v: 0.86 }]], dirOf(0, -1, 0.3));
  });
  add('sarjor', steel, (g) => {
    // Kundağın altından 0,012 m taşan düz kutu; alt kenarları pahlı
    const z0 = Z(0.497), z1 = Z(0.572), prof = [[-0.012, -0.016], [-0.012, -0.0295], [-0.0095, -0.032], [0.0095, -0.032], [0.012, -0.0295], [0.012, -0.016]];
    for (let k = 0; k + 1 < prof.length; k++) { const [xa, ya] = prof[k], [xb, yb] = prof[k + 1]; g.grid([[{ q: V(xa, ya, z0), u: 0.1, v: 0.86 }, { q: V(xb, yb, z0), u: 0.3, v: 0.86 }], [{ q: V(xa, ya, (z0 + z1) / 2), u: 0.1, v: 0.5 }, { q: V(xb, yb, (z0 + z1) / 2), u: 0.3, v: 0.5 }], [{ q: V(xa, ya, z1), u: 0.1, v: 0.86 }, { q: V(xb, yb, z1), u: 0.3, v: 0.86 }]], dirOf((xa + xb) / 2, (ya + yb) / 2 + 0.024, 0)); }
    for (const [z, d] of [[z0, -1], [z1, 1]]) g.fan({ q: V(0, -0.024, z), u: 0.2, v: 0.55 }, [...prof, prof[0]].map(([x, y]) => ({ q: V(x, y, z), u: 0.2, v: 0.86 })), dirZ(d));
    cyl(g, V(0, -0.032, Z(0.56)), V(0, -0.0332, Z(0.56)), 0.0035, 0.0032, { n: 16 }); // taban kapağı mandalı
    box(g, -0.0068, 0.0068, -0.0335, -0.0305, Z(0.485), Z(0.498), '+z+y'); // korkuluğa bağlanan köprü
  });
  // Bilezikler: kundağı ve namluyu birlikte saran oval çember
  const bilezik = (g, s0, s1, top) => {
    const n = 28, t = 0.0024, out = (grow, s, v) => Array.from({ length: n + 1 }, (_, k) => { const a = -Math.PI / 2 + (k / n) * TAU, cs = Math.cos(a), sn = Math.sin(a); return { q: V((0.0232 + grow) * pw(cs, 0.82), sn < 0 ? -(0.0202 + grow) * Math.abs(sn) : (top + grow) * sn ** 0.78, Z(s)), u: (k / n) * 2, v }; });
    g.grid([out(t, s0, 0.86), out(t, (s0 + s1) / 2, 0.52), out(t, s1, 0.86)], (c) => V(c.x, c.y - 0.004, 0));
    g.grid([out(t, s0, 0.86), out(-0.001, s0, 0.7)], dirZ(-1));
    g.grid([out(t, s1, 0.86), out(-0.001, s1, 0.7)], dirZ(1));
  };
  add('bilezik_arka', steel, (g) => {
    bilezik(g, 0.872, 0.888, AX + rb(0.88) + 0.0075);
    cyl(g, V(0.0262, -0.004, Z(0.88)), V(0.028, -0.004, Z(0.88)), 0.003, 0.0028, { n: 16 }); // bilezik vidası
  });
  add('bilezik_on', steel, (g) => {
    bilezik(g, 1.03, 1.05, AX + rb(1.04) + 0.002);
    for (const sx of [-1, 1]) box(g, sx > 0 ? 0.012 : -0.019, sx > 0 ? 0.019 : -0.012, -0.021, -0.012, Z(1.036), Z(1.046), '+y'); // halka yuvaları
  });
  add('gez', steel, (g) => {
    const yb = AX + rb(0.61) - 0.0012;
    box(g, -0.0078, 0.0078, yb, yb + 0.0052, Z(0.584), Z(0.64), '-y'); // taban
    for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) box(g, sx > 0 ? 0.0062 : -0.0095, sx > 0 ? 0.0095 : -0.0062, yb, yb + 0.0105 - k * 0.0016, Z(0.59 + k * 0.011), Z(0.601 + k * 0.011), '-y'); // basamaklı rampa
    box(g, -0.0055, 0.0055, yb + 0.0052, yb + 0.0074, Z(0.588), Z(0.638), '-y'); // gez yaprağı
    box(g, -0.0068, 0.0068, yb + 0.0074, yb + 0.0094, Z(0.6), Z(0.608), '-y'); // sürgü
    box(g, -0.006, 0.006, yb + 0.0074, GEZ_Y - 0.0012, Z(0.5865), Z(0.5895), '-y');
    for (const sx of [-1, 1]) box(g, sx > 0 ? 0.0009 : -0.006, sx > 0 ? 0.006 : -0.0009, GEZ_Y - 0.0012, GEZ_Y + 0.0012, Z(0.5865), Z(0.5895), '-y'); // çentiğin iki yanı
  });
  add('arpacik', steel, (g) => {
    lathe(g, [[1.192, 0.0079, 0.86], [1.1935, 0.0096, 0.84], [1.203, 0.0096, 0.55], [1.2125, 0.0096, 0.84], [1.214, 0.0079, 0.86]], { n: 20 });
    box(g, -0.0042, 0.0042, AX + 0.008, AX + 0.0145, Z(1.195), Z(1.211), '-y');
    const y0 = AX + 0.0145, y1 = AX + 0.0218, za = Z(1.197), zb = Z(1.209), zt = Z(1.2065), hx = 0.0009; // arpacık bıçağı: öne eğimli
    const quad = (pts, d) => g.grid([[{ q: pts[0], u: 0.1, v: 0.6 }, { q: pts[1], u: 0.3, v: 0.6 }], [{ q: pts[3], u: 0.1, v: 0.86 }, { q: pts[2], u: 0.3, v: 0.86 }]], dirOf(...d));
    for (const sx of [-1, 1]) quad([V(sx * hx, y0, za), V(sx * hx, y0, zb), V(sx * hx, y1, zb), V(sx * hx, y1, zt)], [sx, 0, 0]);
    quad([V(-hx, y0, za), V(hx, y0, za), V(hx, y1, zt), V(-hx, y1, zt)], [0, 0.5, -1]);
    quad([V(-hx, y0, zb), V(hx, y0, zb), V(hx, y1, zb), V(-hx, y1, zb)], [0, 0, 1]);
    quad([V(-hx, y1, zt), V(hx, y1, zt), V(hx, y1, zb), V(-hx, y1, zb)], [0, 1, 0]);
  });
  add('harbi', steel, (g) => {
    lathe(g, [[0.7, 0.003, 0.3], [1.0, 0.003, 0.5], [1.212, 0.003, 0.7], [1.2135, 0.0042, 0.84], [1.219, 0.0042, 0.6], [1.2195, 0.0034, 0.5], [1.2215, 0.0034, 0.5], [1.222, 0.0042, 0.6], [1.2275, 0.0042, 0.84], [1.229, 0.0034, 0.86]], { cy: -0.0185 });
    disc(g, 1.229, 0, 0.0034, 1, { cy: -0.0185 });
    disc(g, 0.7, 0, 0.003, -1, { cy: -0.0185 });
  });
  add('kayis_halka_on', steel, (g) => wire(g, roundRect(0, -0.0285, Z(1.041), 0.016, 0.0125, 0.005), 0.0021));
  const butBot = sectionAt(DIPCIK, 0.115)[2];
  add('kayis_halka_arka', steel, (g) => {
    box(g, -0.0055, 0.0055, butBot - 0.0055, butBot + 0.003, Z(0.103), Z(0.127), '+y');
    wire(g, roundRect(0, butBot - 0.0175, Z(0.115), 0.017, 0.0145, 0.005), 0.0021);
  });
  add('dipcik_tabani', steel, (g) => {
    const sec = (s, grow, v) => woodRing(sectionAt(DIPCIK, 0.004)).map((e, k) => { const a = -Math.PI / 2 + (k / WN) * TAU; return { q: V(e.q.x + grow * Math.cos(a), e.q.y + grow * Math.sin(a), Z(s)), u: (k / WN) * 3, v }; });
    g.grid([sec(0.0055, 0.0008, 0.8), sec(0.0018, 0.0008, 0.86)], (c) => V(c.x, c.y + 0.0775, 0));
    g.grid([sec(0.0018, 0.0008, 0.86), sec(0.0004, -0.004, 0.7), sec(0, -0.012, 0.5)], dirZ(-1));
    g.fan({ q: V(0, -0.0775, Z(0)), u: 0.5, v: 0.4 }, sec(0, -0.012, 0.5), dirZ(-1));
    box(g, -0.0085, 0.0085, -0.0152, -0.0132, Z(0.003), Z(0.045), '-y'); // üst dil
    for (const y of [-0.045, -0.112]) cyl(g, V(0, y, Z(0.0016)), V(0, y, Z(0.0004)), 0.004, 0.0036, { n: 16 }); // vidalar
  });

  // İşaret noktaları
  const mark = (name, x, y, z) => { const o = new THREE.Object3D(); o.name = name; o.position.set(x, y, z); root.add(o); };
  const grip = sectionAt(DIPCIK, GRIP_S);
  mark('el_sag', 0, (grip[1] + grip[2]) / 2, Z(GRIP_S));
  mark('el_sol', 0, sectionAt(KUNDAK, SOL_S)[2], Z(SOL_S));
  mark('namlu_ucu', 0, AX, Z(L));
  mark('omuz', 0, -0.0775, Z(0));
  mark('nisan', 0, GEZ_Y, Z(GEZ_S));
  return root;
}
// Dışa aktarmadan önce konsola yazılan özet
export function tufekRaporu(root) {
  root.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(root), parts = [], marks = {};
  let tris = 0;
  root.children.forEach((o) => { if (o.isMesh) { parts.push(o.name); tris += o.geometry.index.count / 3; } else marks[o.name] = o.position.toArray().map((v) => +v.toFixed(4)); });
  const rapor = { toplam_boy_m: +(b.max.z - b.min.z).toFixed(4), ucgen_sayisi: tris, parcalar: parts, isaret_noktalari: marks, kutu: { min: b.min.toArray().map((v) => +v.toFixed(4)), max: b.max.toArray().map((v) => +v.toFixed(4)) } };
  console.log('tufek_mavzer.glb', JSON.stringify(rapor, null, 1));
  return rapor;
}
