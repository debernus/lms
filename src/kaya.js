import * as THREE from 'three';

// Kayalar ve taşlar (11 çeşit, KAYALAR tablosu): tek, kapalı (su geçirmez) ağ; taban düz ve y = 0'da,
// orijin tabanın ortasında. Ölçüler tablodaki w (en geniş yatay ölçü) ve h (yükseklik) değerlerine tam oturtulur.
const TAU = Math.PI * 2, TH = Math.PI * 0.72; // TH: ağın ve dokunun kapsadığı en büyük kutup açısı (altı düz taban)
const sm = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

// ---------- Gürültü ----------
function hash(x, y, z) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  let fx = x - ix, fy = y - iy, fz = z - iz;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
  const l = (a, b, t) => a + (b - a) * t;
  return l(l(l(hash(ix, iy, iz), hash(ix + 1, iy, iz), fx), l(hash(ix, iy + 1, iz), hash(ix + 1, iy + 1, iz), fx), fy), l(l(hash(ix, iy, iz + 1), hash(ix + 1, iy, iz + 1), fx), l(hash(ix, iy + 1, iz + 1), hash(ix + 1, iy + 1, iz + 1), fx), fy), fz);
}
function fbm(x, y, z, oct) {
  let s = 0, a = 0.5, n = 0;
  for (let i = 0; i < oct; i++) { s += a * noise(x, y, z); n += a; x = x * 2.03 + 11.7; y = y * 2.03 + 5.3; z = z * 2.03 + 7.1; a *= 0.5; }
  return s / n;
}

// ---------- Biçimler ----------
// Her kaya, merkezinden (0, cy, 0) her yöne bir yarıçap veren işlevle tanımlanır (yıldız biçimli, kapalı).
// ell: süper elipsoit [a, b, c, p]; planes: çok yüzlü (köşeli); blobs: kaynaşmış elipsoitler [cx, cy, cz, rx, ry, rz]
const norm = ([x, y, z, d]) => { const l = Math.hypot(x, y, z); return [x / l, y / l, z / l, d]; };
const PLANES = [[1, 0.08, 0.1, 2.4], [-1, 0.12, -0.08, 2.3], [0.1, 0.05, 1, 1.9], [-0.06, 0.1, -1, 2.0], [0.08, 1, -0.06, 1.9], [0.62, 0.7, 0.2, 2.5], [-0.5, 0.78, -0.3, 2.35], [0.3, 0.55, 0.8, 2.15], [-0.72, 0.2, 0.66, 2.3], [0.66, 0.12, -0.72, 2.4], [-0.35, 0.6, 0.72, 2.3], [-0.6, 0.3, -0.74, 2.45]].map(norm);
const PLANES2 = [[0.9, 0.2, 0.4, 0.62], [-0.8, 0.1, 0.5, 0.66], [0.2, 0.1, -1, 0.6], [-0.5, 0.15, -0.8, 0.68], [0.1, 1, 0.15, 0.72], [0.6, 0.75, -0.3, 0.74], [-0.45, 0.8, 0.35, 0.7], [0.15, 0.5, 0.9, 0.62], [0.95, 0.3, -0.5, 0.7], [-0.9, 0.5, -0.1, 0.72]].map(norm);
const C3 = [[0.8, 0.1, 0.6, 0.12, 0.065, 0.42, 0.2, 0.6, -0.8], [-0.5, 0.2, 0.84, -0.2, 0.04, 0.3, -0.7, 0.5, 0.4], [0.2, 0.75, -0.6, 0.35, 0.035, 0.22, 0.9, 0.2, 0.3]];
// cracks: [nx, ny, nz, kayma, genişlik, derinlik (yarıçapın kesri), mx, my, mz (yarığın bulunduğu yan)]
export const KAYALAR = {
  kaya_buyuk_1: { w: 4, h: 2.5, cy: 0.9, ell: [2.05, 1.6, 1.75, 2.5], n1: 0.2, n2: 0.09, cracks: C3.map((c) => { const q = [...c]; q[5] *= 0.42; return q; }), big: true },
  kaya_buyuk_2: { w: 5, h: 3, cy: 1.1, planes: PLANES, n1: 0.06, n2: 0.025, split: true, big: true },
  kayalik_1: { w: 9, h: 3.5, cy: 1.0, ell: [4.6, 2.6, 2.7, 3.2], n1: 0.2, n2: 0.07, strata: [0.6, 0.055], cracks: [[0.95, 0, 0.3, 0.25, 0.03, 0.1, 0, 0.2, 1], [0.7, 0, -0.7, -0.3, 0.03, 0.09, 0, 0.3, 0.6], [-0.2, 0, 1, 0.1, 0.03, 0.08, 1, 0.3, 0]], big: true },
  kayalik_2: { w: 7, h: 4, cy: 1.2, blobs: [[-1.3, 1.2, 0.2, 2.2, 2.3, 1.9], [1.4, 1.0, -0.3, 2.1, 1.9, 1.8], [0.2, 1.9, 0.5, 1.6, 2.1, 1.5], [0.3, 0.8, -1.1, 1.7, 1.4, 1.6], [-0.4, 0.9, 1.0, 1.5, 1.3, 1.5]], n1: 0.14, n2: 0.08, cracks: [[0.6, 0.3, 0.74, 0.3, 0.03, 0.08, 0.5, 0.5, 0.2]], big: true },
  kaya_yuksek: { w: 2.5, h: 5, cy: 1.5, ell: [1.15, 3.6, 1.0, 2.8], n1: 0.26, n2: 0.1, base: 0.3, lean: 0.11, cracks: [[0.3, 0.9, 0.3, 0.2, 0.03, 0.12, 1, 0, 0.3], [0.9, 0.1, -0.4, 0.1, 0.035, 0.14, 0, 0.5, 1]], big: true },
  kaya_yassi: { w: 4, h: 0.8, cy: 0.28, ell: [2.0, 0.55, 1.6, 3.6], n1: 0.14, n2: 0.05, cracks: [[0.9, 0, 0.44, 0.1, 0.02, 0.12, 0, 1, 0], [-0.4, 0, 0.92, -0.25, 0.018, 0.1, 0, 1, 0], [0.6, 0, -0.8, 0.4, 0.015, 0.08, 0.5, 1, 0]], big: true },
  kaya_orta_1: { w: 1.6, h: 1, cy: 0.3, ell: [0.8, 0.72, 0.7, 2.4], n1: 0.2, n2: 0.08, cracks: [[0.7, 0.3, 0.65, 0.2, 0.035, 0.08, 0.3, 0.6, 0.5]] },
  kaya_orta_2: { w: 1.4, h: 1.1, cy: 0.4, planes: PLANES2, n1: 0.07, n2: 0.03, cracks: [[0.5, 0.2, 0.84, 0.15, 0.03, 0.07, -0.5, 0.6, 0.3]] },
  tas_kucuk_1: { w: 0.5, h: 0.3, cy: 0.11, ell: [0.25, 0.2, 0.21, 2.3], n1: 0.18, n2: 0.07 },
  tas_kucuk_2: { w: 0.6, h: 0.22, cy: 0.08, ell: [0.3, 0.14, 0.24, 2.9], n1: 0.14, n2: 0.05, moss: 0.9 },
  kaya_yosunlu: { w: 1.8, h: 1.2, cy: 0.4, ell: [0.9, 0.85, 0.8, 2.4], n1: 0.2, n2: 0.09, moss: 1, north: 0.9, cracks: [[0.8, 0.2, 0.56, 0.1, 0.035, 0.08, 0.2, 0.6, 0.6]] },
};
function shape(T, seed) {
  const sd = seed * 37.7;
  return (dx, dy, dz) => {
    let r;
    if (T.blobs) {
      r = 0;
      for (const [cx, cy, cz, rx, ry, rz] of T.blobs) {
        const ox = -cx, oy = T.cy - cy, oz = -cz, A = (dx / rx) ** 2 + (dy / ry) ** 2 + (dz / rz) ** 2, B = 2 * ((ox * dx) / rx ** 2 + (oy * dy) / ry ** 2 + (oz * dz) / rz ** 2), C = (ox / rx) ** 2 + (oy / ry) ** 2 + (oz / rz) ** 2 - 1;
        r = Math.max(r, (-B + Math.sqrt(Math.max(0, B * B - 4 * A * C))) / (2 * A));
      }
    } else if (T.planes) {
      r = 1e9;
      for (const [nx, ny, nz, d] of T.planes) { const c = nx * dx + ny * dy + nz * dz; if (c > 0.02) r = Math.min(r, d / c); }
    } else { const [a, b, c, p] = T.ell; r = (Math.abs(dx / a) ** p + Math.abs(dy / b) ** p + Math.abs(dz / c) ** p) ** (-1 / p); }
    const top = sm(0.35, 0.8, dy);
    r *= 1 + T.n1 * (fbm(dx * 1.3 + 3 + sd, dy * 1.3, dz * 1.3, 3) - 0.5) + T.n2 * (fbm(dx * 3.1, dy * 3.1 + 9 + sd, dz * 3.1, 3) - 0.5) * (1 - 0.75 * top);
    if (T.base) r *= 1 + T.base * sm(0.15, -0.5, dy);
    if (T.strata) { // yatay katmanlar: her katman bir basamak
      const y = T.cy + dy * r, t = y / T.strata[0] + 0.35 * fbm(dx * 0.8 + sd, 0.3, dz * 0.8, 2), fr = t - Math.floor(t);
      r *= 1 - T.strata[1] * (fr - 0.5) - T.strata[1] * 0.6 * sm(0.9, 1, fr);
    }
    let crack = 0;
    (T.cracks || []).forEach(([nx, ny, nz, off, w, depth, mx, my, mz], k) => {
      const d = dx * nx + dy * ny + dz * nz - off + 0.16 * (fbm(dx * 2.4 + k * 13 + sd, dy * 2.4, dz * 2.4, 2) - 0.5), c = Math.exp(-((d / w) ** 2)) * sm(-0.15, 0.3, dx * mx + dy * my + dz * mz);
      r *= 1 - depth * c;
      crack = Math.max(crack, c);
    });
    if (T.split) { // büyük dikey yarık: kayayı ikiye ayırır; bir yarısı biraz çökmüş
      const d = dx * 0.93 + dz * 0.36 - 0.06 + 0.1 * (fbm(dx * 2 + 50, dy * 2, dz * 2, 2) - 0.5), c = Math.exp(-((d / 0.055) ** 2)) * sm(-0.55, -0.1, dy);
      r *= 1 - 0.07 * sm(0, 0.08, d);
      r -= 1.15 * c;
      const d2 = dx * -0.3 + dy * 0.2 + dz * 0.93 - 0.3 + 0.12 * (fbm(dx * 2.6 + 80, dy * 2.6, dz * 2.6, 2) - 0.5), c2 = Math.exp(-((d2 / 0.03) ** 2)) * sm(0, 0.3, d);
      r -= 0.22 * c2;
      crack = Math.max(crack, c, c2 * 0.8);
    }
    return [r, crack];
  };
}

// ---------- Doku: her nokta, yüzeydeki gerçek konumundan boyanır (dikişsiz) ----------
function normalFrom(H, W, strength) {
  const c = document.createElement('canvas');
  c.width = c.height = W;
  const g = c.getContext('2d'), out = g.createImageData(W, W), at = (x, y) => H[Math.min(W - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) * strength, dy = (at(x, y + 1) - at(x, y - 1)) * strength, l = Math.hypot(dx, dy, 1), i = (y * W + x) * 4;
    out.data[i] = (-dx / l * 0.5 + 0.5) * 255; out.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; out.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; out.data[i + 3] = 255;
  }
  g.putImageData(out, 0, 0);
  return c;
}
function textures(tip, T, f, S, W, fs) {
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = W; return c; };
  const cc = mk(), oc = mk(), cg = cc.getContext('2d'), og = oc.getContext('2d'), col = cg.createImageData(W, W), orm = og.createImageData(W, W), H = new Float32Array(W * W), o = (Object.keys(KAYALAR).indexOf(tip) + 1) * 100, lean = T.lean || 0;
  for (let py = 0; py < W; py++) for (let px = 0; px < W; px++) {
    const ex = ((px + 0.5) / W) * 2 - 1, ey = (1 - (py + 0.5) / W) * 2 - 1, rho = Math.min(1, Math.hypot(ex, ey)), th = rho * TH, ph = Math.atan2(ey, ex);
    const dx = Math.sin(th) * Math.cos(ph), dy = Math.cos(th), dz = Math.sin(th) * Math.sin(ph), [r, crack] = f(dx, dy, dz);
    const yr = Math.max(0, T.cy + dy * r), x = (dx * r + lean * yr) * S[0] * fs, y = yr * S[1] * fs, z = dz * r * S[0] * fs, up = sm(0.15, 0.85, dy), side = 1 - up;
    // Taş: gri kireçtaşı / granit
    let g = 0.5 + 0.2 * (fbm(x * 0.9 + o, y * 0.9, z * 0.9, 4) - 0.5) + 0.14 * (fbm(x * 6, y * 6 + o, z * 6, 3) - 0.5);
    const gran = sm(0.42, 0.6, fbm(x * 0.5 + 7 + o, y * 0.5, z * 0.5, 2)), sp = noise(x * 55, y * 55, z * 55 + o);
    g *= 1 + gran * (sp > 0.72 ? -0.26 : sp < 0.22 ? 0.14 : 0);
    g *= 1 - 0.18 * side * sm(0.45, 0.75, fbm(x * 3 + 40, y * 0.35 + o, z * 3, 3)); // yanlarda akıntı izleri
    let R = g * 1.0, G = g * 0.985, B = g * 0.955, rough = 0.84 - 0.06 * gran;
    const blend = (cr, cg2, cb, t) => { R = mix(R, cr, t); G = mix(G, cg2, t); B = mix(B, cb, t); };
    blend(0.47 * (0.7 + g * 0.6), 0.39 * (0.7 + g * 0.6), 0.3 * (0.7 + g * 0.6), 0.5 * sm(0.52, 0.68, fbm(x * 1.1 + 20 + o, y * 1.1, z * 1.1, 4))); // sıcak kahverengi lekeler
    const lich = sm(0.55, 0.65, fbm(x * 2.2 + 60, y * 2.2 + o, z * 2.2, 4)) * (0.35 + 0.65 * up);
    blend(0.4, 0.45, 0.29, 0.55 * lich); // yeşilimsi liken
    const pale = sm(0.68, 0.72, fbm(x * 5 + 90, y * 5, z * 5 + o, 3));
    blend(0.72, 0.72, 0.62, 0.6 * pale); // açık renk liken benekleri
    blend(0.62, 0.46, 0.2, 0.5 * sm(0.74, 0.77, fbm(x * 7 + 120 + o, y * 7, z * 7, 2)) * up); // turuncu liken
    // İnce çatlaklar
    const zone = sm(0.46, 0.6, fbm(x * 0.7 + 300 + o, y * 0.7, z * 0.7, 2)); // çatlaklar yalnız bazı bölgelerde, kopuk kopuk
    const fine = zone * Math.max(1 - sm(0.001, 0.0035, Math.abs(fbm(x * 1.2 + 200, y * 1.2 + o, z * 1.2, 4) - 0.5)), 0.6 * (1 - sm(0.001, 0.003, Math.abs(fbm(x * 2.6 + 240 + o, y * 2.6, z * 2.6, 3) - 0.47))) * sm(0.4, 0.6, noise(x * 2.5, y * 2.5 + o, z * 2.5)));
    blend(0.12, 0.11, 0.1, 0.6 * fine);
    // Yarıkların içi koyu; oyuklarda ve yarık kenarlarında yosun
    blend(0.1, 0.095, 0.085, 0.85 * sm(0.3, 0.85, crack));
    const moss = Math.min(1, Math.max(0.55 * sm(0.2, 0.5, crack) * (1 - sm(0.6, 0.95, crack)) * (0.4 + 0.6 * sm(-0.3, 0.5, dy)), 0.7 * sm(0.58, 0.72, fbm(x * 1.6 + 150, y * 1.6, z * 1.6 + o, 3)) * sm(0.3, 0.8, dy), 0.6 * fine * up, (T.moss || 0) * sm(-0.05, 0.45, dy) * sm(0.25, 0.5, fbm(x * 1.3 + 400, y * 1.3, z * 1.3 + o, 3) + 0.25 * (T.moss || 0)), (T.north || 0) * sm(-0.1, 0.5, -dz) * sm(-0.4, 0.1, dy) * sm(0.35, 0.55, fbm(x * 1.5 + 500 + o, y * 1.5, z * 1.5, 3) + 0.15))) * sm(0.3, 0.6, noise(x * 9 + o, y * 9, z * 9) + 0.25);
    blend(0.13 + 0.05 * sp, 0.18 + 0.06 * sp, 0.075, 0.8 * moss);
    rough = Math.min(0.98, rough + 0.1 * moss + 0.05 * lich + 0.04 * pale);
    const i = (py * W + px) * 4;
    col.data[i] = Math.min(255, R * 255); col.data[i + 1] = Math.min(255, G * 255); col.data[i + 2] = Math.min(255, B * 255); col.data[i + 3] = 255;
    orm.data[i] = 255; orm.data[i + 1] = rough * 255; orm.data[i + 2] = 0; orm.data[i + 3] = 255;
    H[i / 4] = 0.55 * fbm(x * 16, y * 16 + o, z * 16, 4) + 0.2 * (sp - 0.5) * gran - 0.5 * fine + 0.25 * moss * noise(x * 40, y * 40, z * 40) - 0.3 * sm(0.3, 0.8, crack);
  }
  cg.putImageData(col, 0, 0);
  og.putImageData(orm, 0, 0);
  const tex = (name, c, srgb) => { const t = new THREE.CanvasTexture(c); t.name = name; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 4; return t; };
  const m = tex(`${tip}_pm`, oc, false);
  return new THREE.MeshStandardMaterial({ name: tip, map: tex(`${tip}_renk`, cc, true), roughnessMap: m, metalnessMap: m, normalMap: tex(`${tip}_kabartma`, normalFrom(H, W, 5), false), roughness: 1, metalness: 1 });
}

export function createKaya(tip = 'kaya_buyuk_1') {
  const T = KAYALAR[tip], f = shape(T, Object.keys(KAYALAR).indexOf(tip)), width = T.w, height = T.h, lean = T.lean || 0;
  const M = T.big ? 104 : 48, N = T.big ? 56 : 30, size = T.big ? 1024 : 512; // büyükler ~11 600, küçükler 2 880 üçgen
  // Ham ağ: tepe noktası, N halka (kutup açısı 0 … TH), taban merkezi. Köşeler paylaşılır: ağ kapalıdır.
  const raw = [];
  for (let j = 1; j <= N; j++) for (let k = 0; k < M; k++) {
    const th = (j / N) * TH, ph = (k / M) * TAU, dx = Math.sin(th) * Math.cos(ph), dy = Math.cos(th), dz = Math.sin(th) * Math.sin(ph), [r] = f(dx, dy, dz);
    raw.push([dx * r, T.cy + dy * r, dz * r, 0.5 + 0.5 * (j / N) * Math.cos(ph), 0.5 + 0.5 * (j / N) * Math.sin(ph)]);
  }
  const top = T.cy + f(0, 1, 0)[0];
  // Tabanın altına düşen noktalar, merkezden çıkan ışın boyunca y = 0 kesitine çekilir: düz taban. Sonra eğiklik uygulanır.
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, y1 = top;
  for (const q of raw) {
    if (q[1] < 0) { const t = T.cy / (T.cy - q[1]); q[0] *= t; q[2] *= t; q[1] = 0; }
    q[0] += lean * q[1];
    x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[2]); z1 = Math.max(z1, q[2]); y1 = Math.max(y1, q[1]);
  }
  x0 = Math.min(x0, lean * top); x1 = Math.max(x1, lean * top);
  const S = [width / Math.max(x1 - x0, z1 - z0), height / y1], ox = ((x0 + x1) / 2) * S[0], oz = ((z0 + z1) / 2) * S[0];
  const pos = [lean * top * S[0] - ox, top * S[1], 0 - oz], uv = [0.5, 0.5], idx = [];
  for (const [x, y, z, u, v] of raw) { pos.push(x * S[0] - ox, y * S[1], z * S[0] - oz); uv.push(u, v); }
  const bottom = pos.length / 3;
  pos.push(0, 0, 0);
  uv.push(0.5, 0.995);
  const id = (j, k) => 1 + (j - 1) * M + (k % M);
  for (let k = 0; k < M; k++) {
    idx.push(0, id(1, k + 1), id(1, k));
    for (let j = 1; j < N; j++) idx.push(id(j, k), id(j, k + 1), id(j + 1, k + 1), id(j, k), id(j + 1, k + 1), id(j + 1, k));
    idx.push(bottom, id(N, k), id(N, k + 1));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, textures(tip, T, f, S, size, Math.min(6, (4 / width) ** 0.7)));
  mesh.name = tip;
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
