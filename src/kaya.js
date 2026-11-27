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
    if (T.dar) r *= 1 - T.dar * sm(0.1, -0.75, dy); // altı içe çekilmiş (sarkan çıkıntı)
    if (T.strata) { // yatay katmanlar: her katman bir basamak
      const y = T.cy + dy * r, t = y / T.strata[0] + 0.35 * fbm(dx * 0.8 + sd, 0.3, dz * 0.8, 2), fr = t - Math.floor(t);
      r *= 1 - T.strata[1] * (fr - 0.5) - T.strata[1] * 0.6 * sm(0.9, 1, fr);
    }
    for (const [nx, ny, nz, d] of T.clip || []) { const c = nx * dx + ny * dy + nz * dz; if (c > 1e-3) r = Math.min(r, d / c); } // düz kesme yüzleri (arka yüz, üst)
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
    const orm2 = T.orman ? 1 : 0, kuru = T.kuru ? 1 : 0;
    if (kuru) { g = 0.6 + 0.85 * (g - 0.5) + 0.07 * (fbm(x * 0.6 + 33, y * 1.6, z * 0.6 + o, 3) - 0.5); R = g * 1.0; G = g * 0.985; B = g * 0.95; }
    if (orm2) { g = 0.36 + 0.55 * (g - 0.5) * 0.9 + 0.08 * (fbm(x * 0.4 + 70, y * 0.4, z * 0.4 + o, 3) - 0.5); R = g * 0.86; G = g * 0.95; B = g * 1.02; }
    const blend = (cr, cg2, cb, t) => { R = mix(R, cr, t); G = mix(G, cg2, t); B = mix(B, cb, t); };
    blend(0.47 * (0.7 + g * 0.6), 0.39 * (0.7 + g * 0.6), 0.3 * (0.7 + g * 0.6), (orm2 ? 0.15 : 0.5) * sm(0.52, 0.68, fbm(x * 1.1 + 20 + o, y * 1.1, z * 1.1, 4))); // sıcak kahverengi lekeler
    const lich = sm(0.55, 0.65, fbm(x * 2.2 + 60, y * 2.2 + o, z * 2.2, 4)) * (0.35 + 0.65 * up);
    blend(0.4, 0.45, 0.29, (kuru ? 0.08 : 0.55) * lich); // yeşilimsi liken
    const pale = sm(0.68, 0.72, fbm(x * 5 + 90, y * 5, z * 5 + o, 3));
    blend(0.62, 0.66, 0.6, (orm2 ? 0.12 : 0.6) * pale); // açık renk liken benekleri
    blend(0.62, 0.46, 0.2, (orm2 ? 0 : 0.5) * sm(0.74, 0.77, fbm(x * 7 + 120 + o, y * 7, z * 7, 2)) * up); // turuncu liken
    // İnce çatlaklar
    const zone = sm(0.46, 0.6, fbm(x * 0.7 + 300 + o, y * 0.7, z * 0.7, 2)); // çatlaklar yalnız bazı bölgelerde, kopuk kopuk
    const fine = zone * Math.max(1 - sm(0.001, 0.0035, Math.abs(fbm(x * 1.2 + 200, y * 1.2 + o, z * 1.2, 4) - 0.5)), 0.6 * (1 - sm(0.001, 0.003, Math.abs(fbm(x * 2.6 + 240 + o, y * 2.6, z * 2.6, 3) - 0.47))) * sm(0.4, 0.6, noise(x * 2.5, y * 2.5 + o, z * 2.5)));
    blend(0.12, 0.11, 0.1, 0.6 * fine);
    // Yarıkların içi koyu; oyuklarda ve yarık kenarlarında yosun
    blend(0.1, 0.095, 0.085, 0.85 * sm(0.3, 0.85, crack));
    const moss = Math.min(1, Math.max(0.55 * sm(0.2, 0.5, crack) * (1 - sm(0.6, 0.95, crack)) * (0.4 + 0.6 * sm(-0.3, 0.5, dy)), 0.7 * sm(0.58, 0.72, fbm(x * 1.6 + 150, y * 1.6, z * 1.6 + o, 3)) * sm(0.3, 0.8, dy), 0.6 * fine * up, (T.moss || 0) * sm(-0.05, 0.45, dy) * sm(0.25, 0.5, fbm(x * 1.3 + 400, y * 1.3, z * 1.3 + o, 3) + 0.25 * (T.moss || 0)), (T.north || 0) * sm(-0.1, 0.5, -dz) * sm(-0.4, 0.1, dy) * sm(0.35, 0.55, fbm(x * 1.5 + 500 + o, y * 1.5, z * 1.5, 3) + 0.15))) * sm(0.3, 0.6, noise(x * 9 + o, y * 9, z * 9) + 0.25);
    const ust = orm2 * (T.yosun ?? 0.8) * sm(0.2, 0.7, dy) * sm(0.32, 0.5, fbm(x * 0.9 + 600 + o, y * 0.9, z * 0.9, 4) + 0.12 * (T.yosun ?? 0.8)) * sm(0.25, 0.55, noise(x * 6 + o, y * 6, z * 6) + 0.3);
    const yanY = orm2 * 0.6 * sm(0.55, 0.7, fbm(x * 1.4 + 700, y * 0.6, z * 1.4 + o, 3)) * side;
    if (kuru) { // koyu lekeler, gözenekler, yarıklarda kuru toz
      blend(0.34, 0.33, 0.31, 0.55 * sm(0.55, 0.72, fbm(x * 0.8 + 900 + o, y * 0.4, z * 0.8, 4)) * (0.4 + 0.6 * side));
      const por = sm(0.74, 0.8, noise(x * 75 + o, y * 75, z * 75)) * sm(0.35, 0.6, fbm(x * 1.5 + 990, y * 1.5, z * 1.5 + o, 2)); blend(0.3, 0.29, 0.27, 0.4 * por);
      blend(0.66, 0.6, 0.5, 0.75 * Math.min(1, sm(0.15, 0.6, crack) + 0.7 * fine + 0.4 * sm(0.2, 0.9, dy) * sm(0.6, 0.75, fbm(x * 2 + 950, y * 2, z * 2 + o, 3))));
      rough = Math.min(0.98, rough + 0.08 + 0.06 * por);
    } else blend(0.13 + 0.05 * sp, 0.18 + 0.06 * sp, 0.075, 0.8 * moss);
    const islak = orm2 * (T.islak ?? 1) * sm(0.15, -0.6, dy) * (0.7 + 0.3 * fbm(x * 1.2 + 800, y * 2, z * 1.2 + o, 3));
    if (orm2) { R *= 1 - 0.42 * islak; G *= 1 - 0.38 * islak; B *= 1 - 0.34 * islak; rough -= 0.35 * islak; }
    if (T.cilali) rough *= 0.55;
    if (orm2) { blend(0.075 + 0.04 * sp, 0.12 + 0.05 * sp, 0.05, 0.92 * Math.min(1, ust + moss * 0.5)); blend(0.16, 0.2, 0.13, 0.5 * yanY); }
    rough = Math.min(0.98, rough + 0.1 * moss + 0.05 * lich + 0.04 * pale + 0.12 * (orm2 ? ust : 0));
    const i = (py * W + px) * 4;
    col.data[i] = Math.min(255, R * 255); col.data[i + 1] = Math.min(255, G * 255); col.data[i + 2] = Math.min(255, B * 255); col.data[i + 3] = 255;
    orm.data[i] = 255; orm.data[i + 1] = rough * 255; orm.data[i + 2] = 0; orm.data[i + 3] = 255;
    H[i / 4] = (kuru ? -0.45 * sm(0.72, 0.82, noise(x * 75 + o, y * 75, z * 75)) + 0.25 * fbm(x * 40, y * 40, z * 40 + o, 3) : 0) + 0.55 * fbm(x * 16, y * 16 + o, z * 16, 4) + 0.2 * (sp - 0.5) * gran - 0.5 * fine + 0.25 * (moss + (orm2 ? ust : 0)) * noise(x * 40, y * 40, z * 40) - 0.3 * sm(0.3, 0.8, crack);
  }
  cg.putImageData(col, 0, 0);
  og.putImageData(orm, 0, 0);
  const tex = (name, c, srgb) => { const t = new THREE.CanvasTexture(c); t.name = name; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 4; return t; };
  const m = tex(`${tip}_pm`, oc, false);
  return new THREE.MeshStandardMaterial({ name: tip, map: tex(`${tip}_renk`, cc, true), roughnessMap: m, metalnessMap: m, normalMap: tex(`${tip}_kabartma`, normalFrom(H, W, 5), false), roughness: 1, metalness: 1 });
}

// ---------- Dev kayalar: birleşik köşeli kütleler, hücre hücre kırılmış yüzey ----------
// Hücre gürültüsü (Worley): [en yakın uzaklık, ikinci uzaklık, hücre kimliği 0..1]
function worley(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  let f1 = 9, f2 = 9, id = 0;
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
    const cx = ix + a, cy = iy + b, cz = iz + c, px = cx + hash(cx, cy, cz), py = cy + hash(cx + 57, cy, cz + 13), pz = cz + hash(cx, cy + 91, cz + 7), d = Math.hypot(px - x, py - y, pz - z);
    if (d < f1) { f2 = f1; f1 = d; id = hash(cx + 5, cy + 3, cz + 11); } else if (d < f2) f2 = d;
  }
  return [f1, f2, id];
}
function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
// tur: kutle (tek iri kütle), cift (yan yana iki kaya), sivri (sivri tepeli kayalık), blok (üst üste bloklar), yayvan (alçak, geniş)
const DEV = [['kutle', 14, 8], ['kutle', 18, 10], ['cift', 22, 11], ['sivri', 16, 18], ['sivri', 20, 22], ['blok', 14, 16], ['blok', 20, 14], ['yayvan', 26, 8], ['kutle', 15, 11], ['cift', 28, 14], ['sivri', 24, 12], ['yayvan', 30, 10]];
// Orman kayaları paketi: koyu mavi-gri granit, yuvarlak hatlı, üstü yosunlu (iğne yapraklı orman ortamı). Hepsinin tabanı düz:
// yan yana ve üst üste dizilir, yere gömülür.
const OK = (w, h, cy, form, ek = {}) => ({ w, h, cy, ...form, n1: 0.3, n2: 0.13, orman: true, big: w >= 3.5, ...ek });
Object.assign(KAYALAR, {
  orman_kaya_01_iri_yuvarlak: OK(6, 4, 1.0, { ell: [2.1, 1.7, 1.8, 2.3] }, { cracks: [[0.8, 0.1, 0.6, 0.15, 0.04, 0.1, 0.2, 0.6, -0.8]] }),
  orman_kaya_02_yassi_buyuk: OK(7, 2.4, 0.5, { ell: [2.6, 1.0, 2.0, 2.9] }, { yosun: 1 }),
  orman_kaya_03_uzun_sirt: OK(9, 3.4, 0.8, { ell: [3.3, 1.3, 1.5, 2.5] }, { cracks: [[0.95, 0, 0.3, 0.3, 0.03, 0.09, 0, 0.3, 1]] }),
  orman_kaya_04_yuksek_blok: OK(4, 6, 1.6, { ell: [1.5, 2.6, 1.35, 3.0] }, { lean: 0.06, yosun: 0.6 }),
  orman_kaya_05_kume: OK(11, 5, 1.4, { blobs: [[-2.6, 1.3, 0.3, 2.6, 2.5, 2.2], [2.4, 1.1, -0.4, 2.7, 2.2, 2.3], [0.1, 2.0, 0.6, 2.0, 2.6, 1.9], [0.4, 0.9, -1.6, 2.2, 1.6, 1.9], [-0.9, 1.0, 1.7, 1.8, 1.5, 1.7]] }, { n1: 0.2 }),
  orman_kaya_06_gomulu_sirt: OK(10, 2.3, 0.25, { ell: [3.4, 1.0, 2.2, 2.2] }, { yosun: 1 }),
  orman_kaya_07_ikiz: OK(7, 3.6, 1.0, { blobs: [[-1.4, 1.1, 0, 1.9, 1.9, 1.7], [1.5, 0.9, 0.2, 1.7, 1.6, 1.6]] }),
  orman_kaya_08_yarik: OK(5.5, 3.6, 1.0, { ell: [1.9, 1.5, 1.7, 2.6] }, { split: true }),
  orman_kaya_09_duvar_kayasi: OK(13, 7, 2.0, { ell: [4.4, 2.8, 2.0, 3.3] }, { cracks: [[0.95, 0.1, 0.3, 0.2, 0.03, 0.08, 0, 0.3, 1], [-0.7, 0.2, 0.7, -0.3, 0.03, 0.07, 0, 0.2, 1]], yosun: 0.7 }),
  orman_kaya_10_orta_yuvarlak: OK(3, 2.1, 0.55, { ell: [1.4, 1.1, 1.2, 2.3] }),
  orman_kaya_11_orta_koseli: OK(3.4, 2.4, 0.8, { planes: PLANES2 }, { n1: 0.08, n2: 0.035 }),
  orman_kaya_12_orta_yassi: OK(3.2, 1.2, 0.3, { ell: [1.5, 0.55, 1.2, 2.8] }, { yosun: 1 }),
  orman_kaya_13_dik_sivri: OK(3, 5, 1.4, { ell: [1.1, 2.6, 1.0, 2.2] }, { lean: 0.1, base: 0.3 }),
  orman_kaya_14_kucuk: OK(1.5, 1.0, 0.3, { ell: [0.75, 0.62, 0.66, 2.3] }),
  orman_kaya_15_kucuk_yassi: OK(1.7, 0.6, 0.18, { ell: [0.8, 0.3, 0.6, 2.7] }, { yosun: 1 }),
  orman_kaya_16_cakil: OK(0.8, 0.5, 0.15, { ell: [0.4, 0.3, 0.33, 2.2] }),
});
export const ORMAN_KAYALARI = Object.keys(KAYALAR).filter((n) => n.startsWith('orman_kaya_'));
// Örnek dizilim: kayalar yan yana ve üst üste (görsellerdeki orman patikası kenarı gibi)
export function createOrmanKayalik() {
  const g = new THREE.Group(); g.name = 'orman_kayalik_ornek';
  const put = (n, x, y, z, ry = 0, s = 1) => { const m = createKaya(n); m.position.set(x, y, z); m.rotation.y = ry; m.scale.setScalar(s); g.add(m); };
  put('orman_kaya_09_duvar_kayasi', -6, -0.4, -6, 0.1); put('orman_kaya_05_kume', 6, -0.3, -7, 2.8); put('orman_kaya_01_iri_yuvarlak', -9, 5.4, -6.5, 0.7, 0.8);
  put('orman_kaya_02_yassi_buyuk', 1.5, -0.2, -3.5, 0.3); put('orman_kaya_10_orta_yuvarlak', 2.2, 1.9, -3.6, 1.2); put('orman_kaya_04_yuksek_blok', 11, -0.3, -2, 0.4);
  put('orman_kaya_07_ikiz', -12, -0.3, 0.5, 1.9); put('orman_kaya_12_orta_yassi', -7.5, -0.15, 1.5, 0.5); put('orman_kaya_14_kucuk', -7.2, 0.95, 1.6, 0.2);
  put('orman_kaya_06_gomulu_sirt', 5, -0.4, 2.5, 0.2); put('orman_kaya_11_orta_koseli', 8.5, -0.2, 3.5, 2.2); put('orman_kaya_15_kucuk_yassi', -3, -0.1, 3.5, 1.0); put('orman_kaya_16_cakil', -2, -0.05, 4.4); put('orman_kaya_16_cakil', 0.3, -0.05, 5, 1.4, 0.7); put('orman_kaya_14_kucuk', 2.5, -0.15, 5.2, 2.6, 0.8);
  return g;
}
DEV.forEach(([tur, w, h], i) => { KAYALAR[`kaya_dev_${String(i + 1).padStart(2, '0')}`] = { w, h, cy: 0.28 * h, dev: tur, big: true, moss: i === 8 ? 0.7 : 0, tint: i }; });
function devBlobs(T, r) {
  const W = T.w, H = T.h, j = (v, d = 0.15) => v * (1 + (r() - 0.5) * 2 * d), B = [];
  const add = (cx, cy, cz, rx, ry, rz, np, boxy = 0.15) => B.push([j(cx), j(cy, 0.08), j(cz), j(rx), j(ry, 0.08), j(rz), np, boxy]);
  if (T.dev === 'kutle') { add(0, 0.4 * H, 0, 0.5 * W, 0.62 * H, 0.38 * W, 16); add(0.2 * W, 0.3 * H, 0.1 * W, 0.32 * W, 0.42 * H, 0.3 * W, 12); add(-0.25 * W, 0.25 * H, -0.1 * W, 0.28 * W, 0.34 * H, 0.25 * W, 10); }
  if (T.dev === 'cift') { add(-0.24 * W, 0.4 * H, 0, 0.27 * W, 0.6 * H, 0.26 * W, 16); add(0.22 * W, 0.5 * H, 0.03 * W, 0.3 * W, 0.56 * H, 0.28 * W, 16); add(0, 0.18 * H, 0.1 * W, 0.26 * W, 0.24 * H, 0.2 * W, 10); add(0.05 * W, 0.15 * H, -0.12 * W, 0.2 * W, 0.2 * H, 0.18 * W, 9); }
  if (T.dev === 'sivri') { [1, 0.74, 0.6, 0.5, 0.4, 0.32].forEach((k, i) => { const a = i * 2.2 + r() * 0.8, d = (i ? 0.24 : 0.12) * W; add(Math.cos(a) * d, k * H * 0.5, Math.sin(a) * d * 0.8, 0.2 * W * (0.75 + 0.5 * k), k * H * 0.56, 0.17 * W * (0.75 + 0.5 * k), 12, 0.3); }); add(0, 0.14 * H, 0, 0.5 * W, 0.2 * H, 0.4 * W, 12); }
  if (T.dev === 'blok') { add(0, 0.45 * H, 0, 0.3 * W, 0.6 * H, 0.28 * W, 11, 0.85); add(0.26 * W, 0.3 * H, 0.05 * W, 0.27 * W, 0.38 * H, 0.26 * W, 10, 0.85); add(-0.24 * W, 0.22 * H, -0.08 * W, 0.3 * W, 0.3 * H, 0.28 * W, 10, 0.85); add(0.05 * W, 0.62 * H, -0.04 * W, 0.2 * W, 0.4 * H, 0.2 * W, 9, 0.85); }
  if (T.dev === 'yayvan') { add(0, 0.4 * H, 0, 0.5 * W, 0.62 * H, 0.33 * W, 14, 0.5); add(-0.3 * W, 0.3 * H, 0.05 * W, 0.25 * W, 0.42 * H, 0.25 * W, 11, 0.5); add(0.3 * W, 0.28 * H, -0.05 * W, 0.26 * W, 0.38 * H, 0.24 * W, 11, 0.5); add(0.08 * W, 0.2 * H, 0.14 * W, 0.3 * W, 0.26 * H, 0.2 * W, 9, 0.5); }
  // Her kütle: merkezinin çevresinde rastgele düzlemlerle kesilmiş dışbükey çok yüzlü; hepsi ana merkezi içine alır
  return B.map(([cx, cy, cz, rx, ry, rz, np, boxy]) => {
    const planes = [];
    // Her yönü sınırlayan altı kutu düzlemi (kütle sonsuza uzamasın)
    for (const [nx, ny, nz, e] of [[1, 0, 0, rx], [-1, 0, 0, rx], [0, 1, 0, ry], [0, -1, 0, ry], [0, 0, 1, rz], [0, 0, -1, rz]]) { const od = nx * (0 - cx) + ny * (T.cy - cy) + nz * (0 - cz); planes.push([nx, ny, nz, Math.max(e * 1.05, od + 0.6) - od]); }
    for (let k = 0; k < np; k++) {
      let nx = r() * 2 - 1, ny = r() * 2 - 0.75, nz = r() * 2 - 1;
      if (r() < boxy) { const ax = Math.floor(r() * 3), sg = r() < 0.5 ? -1 : 1; nx = (ax === 0 ? sg : 0) + (r() - 0.5) * 0.25; ny = (ax === 1 ? 1 : 0) + (r() - 0.5) * 0.2; nz = (ax === 2 ? sg : 0) + (r() - 0.5) * 0.25; }
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
      let hd = Math.hypot(nx * rx, ny * ry, nz * rz) * (0.72 + 0.4 * r());
      const od = nx * (0 - cx) + ny * (T.cy - cy) + nz * (0 - cz);
      if (od > hd - 0.5) hd = od + 0.5 + r();
      planes.push([nx, ny, nz, hd - od]); // ana merkezden düzleme uzaklık
    }
    return planes;
  });
}
function shapeDev(T, seed) {
  const rr = rnd(seed * 7919 + 31), blobs = devBlobs(T, rr), sd = seed * 17.3, step = T.dev === 'blok' ? 0.12 : T.dev === 'yayvan' ? 0.07 : 0.045;
  const fis = Array.from({ length: 2 + Math.floor(rr() * 2) }, () => { const a = rr() * 6.28, b = rr() * 6.28; return [Math.cos(a), (rr() - 0.5) * 0.5, Math.sin(a), (rr() - 0.5) * 0.5, 0.012 + rr() * 0.01, 0.05 + rr() * 0.04, Math.cos(b), 0.3, Math.sin(b)]; });
  return (dx, dy, dz) => {
    let r = 0;
    for (const planes of blobs) { let t = 1e9; for (const [nx, ny, nz, d] of planes) { const c = nx * dx + ny * dy + nz * dz; if (c > 1e-3) t = Math.min(t, d / c); } if (t < 1e8) r = Math.max(r, t); }
    // Büyük bloklar: gerçek konumda ölçülen iri hücreler (yaklaşık 5 m) hafifçe içeri ya da dışarı durur; çatlak ağı yok
    const qx = dx * r, qy = dy * r, qz = dz * r, id1 = worley(qx * 0.2 + sd, qy * 0.2, qz * 0.2)[2], id2 = worley(qx * 0.5, qy * 0.5 + sd, qz * 0.5)[2];
    r *= 1 + step * (id1 - 0.5) + 0.3 * step * (id2 - 0.5) + 0.06 * (fbm(dx * 1.6 + sd, dy * 1.6, dz * 1.6, 3) - 0.5) + 0.025 * (fbm(dx * 6, dy * 6 + sd, dz * 6, 3) - 0.5);
    // Yalnız birkaç büyük yarık
    let c1 = 0;
    fis.forEach(([nx, ny, nz, off, w, depth, mx, my, mz], k) => {
      const d = dx * nx + dy * ny + dz * nz - off + 0.12 * (fbm(dx * 2 + k * 9 + sd, dy * 2, dz * 2, 2) - 0.5), c = Math.exp(-((d / w) ** 2)) * sm(-0.1, 0.35, dx * mx + dy * my + dz * mz);
      r *= 1 - depth * c;
      c1 = Math.max(c1, c);
    });
    const c2 = 0;
    return [r, Math.max(c1, c2 * 0.5), id1, id2];
  };
}
function texturesDev(tip, T, f, S, W) {
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = W; return c; };
  const cc = mk(), oc = mk(), cg = cc.getContext('2d'), og = oc.getContext('2d'), col = cg.createImageData(W, W), orm = og.createImageData(W, W), H = new Float32Array(W * W), o = (T.tint + 1) * 53, lean = T.lean || 0;
  const warm = 0.5 + 0.5 * Math.sin(T.tint * 2.1), darkAmt = 0.35 + 0.3 * Math.sin(T.tint * 1.3 + 1); // her kayanın tonu biraz farklı
  for (let py = 0; py < W; py++) for (let px = 0; px < W; px++) {
    const ex = ((px + 0.5) / W) * 2 - 1, ey = (1 - (py + 0.5) / W) * 2 - 1, rho = Math.min(1, Math.hypot(ex, ey)), th = rho * TH, ph = Math.atan2(ey, ex);
    const dx = Math.sin(th) * Math.cos(ph), dy = Math.cos(th), dz = Math.sin(th) * Math.sin(ph), [r, crack, id1, id2] = f(dx, dy, dz);
    const yr = Math.max(0, T.cy + dy * r), x = (dx * r + lean * yr) * S[0], y = yr * S[1], z = dz * r * S[0], up = sm(0.2, 0.9, dy), side = 1 - up;
    // Taban: açık kireçtaşı; her kırık yüzün tonu ayrı
    let g = 0.58 + 0.07 * (id1 - 0.5) + 0.04 * (id2 - 0.5) + 0.2 * (fbm(x * 0.35 + o, y * 0.35, z * 0.35, 4) - 0.5) + 0.12 * (fbm(x * 2.5, y * 2.5 + o, z * 2.5, 3) - 0.5);
    let R = g * (1 + 0.03 * warm), G = g * 0.985, B = g * (0.97 - 0.05 * warm), rough = 0.86;
    const blend = (cr, cg2, cb, t) => { R = mix(R, cr, t); G = mix(G, cg2, t); B = mix(B, cb, t); };
    // Yeni kırılmış, sarımsı yüzler
    blend(0.74 * (0.6 + g * 0.6), 0.63 * (0.6 + g * 0.6), 0.47 * (0.6 + g * 0.6), 0.5 * sm(0.52, 0.7, fbm(x * 0.16 + 90 + o, y * 0.16, z * 0.16, 3) + 0.1 * (id1 - 0.5)));
    // Koyu, yağmur yemiş kabuk: geniş lekeler ve yanlardan aşağı süzülen izler
    const patina = sm(0.5 - 0.1 * darkAmt, 0.66, fbm(x * 0.22 + 30 + o, y * 0.22, z * 0.22, 4) + 0.12 * (id2 - 0.5));
    blend(0.2, 0.21, 0.225, (0.55 + 0.3 * darkAmt) * patina);
    const streak = sm(0.52, 0.74, fbm(x * 1.5 + 60, y * 0.09 + o, z * 1.5, 4)) * sm(0.15, 0.6, side);
    blend(0.17, 0.17, 0.18, 0.55 * streak);
    blend(0.5, 0.36, 0.24, 0.4 * sm(0.6, 0.74, fbm(x * 0.9 + 140 + o, y * 0.5, z * 0.9, 3)) * side); // pas rengi akıntı
    // Tane ve ince damarlar
    const sp = noise(x * 28, y * 28, z * 28 + o);
    R *= 1 + (sp > 0.74 ? -0.2 : sp < 0.2 ? 0.1 : 0); G *= 1 + (sp > 0.74 ? -0.2 : sp < 0.2 ? 0.1 : 0); B *= 1 + (sp > 0.74 ? -0.2 : sp < 0.2 ? 0.1 : 0);
    const vein = 1 - sm(0.002, 0.008, Math.abs(fbm(x * 0.5 + 200 + o, y * 0.5, z * 0.5, 4) - 0.5));
    blend(0.86, 0.85, 0.82, 0.35 * vein * sm(0.55, 0.7, noise(x * 0.4, y * 0.4 + o, z * 0.4)));
    const fine = sm(0.56, 0.68, fbm(x * 0.25 + 300 + o, y * 0.25, z * 0.25, 2)) * (1 - sm(0.0008, 0.003, Math.abs(fbm(x * 0.5 + 240, y * 0.5 + o, z * 0.5, 4) - 0.5)));
    blend(0.1, 0.1, 0.1, 0.45 * fine);
    // Yarıklar: blok sınırları koyu
    blend(0.09, 0.09, 0.09, 0.7 * sm(0.4, 0.95, crack));
    // Liken ve yosun: üst yüzlerde, yarık kenarlarında
    const lich = sm(0.58, 0.68, fbm(x * 1.4 + 60 + o, y * 1.4, z * 1.4, 4)) * (0.25 + 0.75 * up);
    blend(0.5, 0.52, 0.36, 0.45 * lich);
    blend(0.8, 0.8, 0.72, 0.55 * sm(0.7, 0.74, fbm(x * 3.2 + 90, y * 3.2 + o, z * 3.2, 3)));
    blend(0.62, 0.46, 0.2, 0.45 * sm(0.75, 0.78, fbm(x * 4 + 120 + o, y * 4, z * 4, 2)) * up);
    const moss = Math.min(1, Math.max(0.5 * sm(0.15, 0.5, crack) * (1 - sm(0.6, 0.95, crack)) * sm(-0.1, 0.5, dy), (0.55 + 0.45 * (T.moss || 0)) * sm(0.6 - 0.2 * (T.moss || 0), 0.76, fbm(x * 0.7 + 150, y * 0.7, z * 0.7 + o, 3)) * sm(0.35, 0.85, dy))) * sm(0.3, 0.6, noise(x * 6 + o, y * 6, z * 6) + 0.25);
    blend(0.14 + 0.05 * sp, 0.19 + 0.06 * sp, 0.08, 0.8 * moss);
    rough = Math.min(0.98, rough + 0.1 * moss + 0.04 * lich - 0.08 * vein);
    const i = (py * W + px) * 4;
    col.data[i] = Math.min(255, R * 255); col.data[i + 1] = Math.min(255, G * 255); col.data[i + 2] = Math.min(255, B * 255); col.data[i + 3] = 255;
    orm.data[i] = 255; orm.data[i + 1] = rough * 255; orm.data[i + 2] = 0; orm.data[i + 3] = 255;
    H[i / 4] = 0.5 * fbm(x * 5, y * 5 + o, z * 5, 5) + 0.35 * fbm(x * 1.2 + o, y * 1.2, z * 1.2, 3) + 0.1 * (sp - 0.5) - 0.3 * fine - 0.45 * sm(0.3, 0.8, crack) + 0.2 * moss * noise(x * 20, y * 20, z * 20) - 0.15 * streak;
  }
  cg.putImageData(col, 0, 0);
  og.putImageData(orm, 0, 0);
  const tex = (name, c, srgb) => { const t = new THREE.CanvasTexture(c); t.name = name; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 4; return t; };
  const m = tex(`${tip}_pm`, oc, false);
  return new THREE.MeshStandardMaterial({ name: tip, map: tex(`${tip}_renk`, cc, true), roughnessMap: m, metalnessMap: m, normalMap: tex(`${tip}_kabartma`, normalFrom(H, W, 7), false), roughness: 1, metalness: 1 });
}

function geomOf(T, f) {
  const width = T.w, height = T.h, lean = T.lean || 0;
  const [M, N] = T.res || (T.big ? [104, 56] : [48, 30]);
  if (T.dev && !T.res) { /* dev kayalar */ }
  const NN = T.dev && !T.res ? 57 : N;
  // Ham ağ: tepe noktası, N halka (kutup açısı 0 … TH), taban merkezi. Köşeler paylaşılır: ağ kapalıdır.
  const raw = [];
  for (let j = 1; j <= NN; j++) for (let k = 0; k < M; k++) {
    const th = (j / NN) * TH, ph = (k / M) * TAU, dx = Math.sin(th) * Math.cos(ph), dy = Math.cos(th), dz = Math.sin(th) * Math.sin(ph), [r] = f(dx, dy, dz);
    raw.push([dx * r, T.cy + dy * r, dz * r, 0.5 + 0.5 * (j / NN) * Math.cos(ph), 0.5 + 0.5 * (j / NN) * Math.sin(ph)]);
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
    for (let j = 1; j < NN; j++) idx.push(id(j, k), id(j, k + 1), id(j + 1, k + 1), id(j, k), id(j + 1, k + 1), id(j + 1, k));
    idx.push(bottom, id(NN, k), id(NN, k + 1));
  }
  return { pos, uv, idx, S };
}
const bufGeo = ({ pos, uv, idx }) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; };
function yerlestir(G, x, y, z, ry, sc = 1) { const c = Math.cos(ry), s = Math.sin(ry), p = G.pos; for (let i = 0; i < p.length; i += 3) { const px = p[i] * sc, pz = p[i + 2] * sc; p[i] = px * c + pz * s + x; p[i + 1] = p[i + 1] * sc + y; p[i + 2] = -px * s + pz * c + z; } return G; }
export function createKaya(tip = 'kaya_buyuk_1') {
  const T = KAYALAR[tip], seed = Object.keys(KAYALAR).indexOf(tip), f = (T.dev ? shapeDev : shape)(T, seed), size = T.tex || (T.dev ? 1536 : T.big || T.orman ? 1024 : 512);
  const G = geomOf(T, f), fs = T.fs ?? Math.min(6, (4 / T.w) ** 0.7);
  const mat = T.dev ? texturesDev(tip, T, f, G.S, size) : textures(tip, T, f, G.S, size, fs);
  if (T.parcalar) { // birden çok kaya: ayri ise ayrı düğümler, değilse tek ağ
    const subs = T.parcalar.map((q, i) => { const Q = { ...T, ...q, parcalar: null }, g = geomOf(Q, shape(Q, seed * 13 + i + 1)); return yerlestir(g, q.x || 0, q.y || 0, q.z || 0, q.ry || 0); });
    if (T.ayri) { const grp = new THREE.Group(); grp.name = tip; subs.forEach((g, i) => { const m = new THREE.Mesh(bufGeo(g), mat); m.name = `${tip}_${i + 1}`; m.castShadow = m.receiveShadow = true; grp.add(m); }); return grp; }
    const all = { pos: [...G.pos], uv: [...G.uv], idx: [...G.idx] };
    for (const g of subs) { const base = all.pos.length / 3; all.pos.push(...g.pos); all.uv.push(...g.uv); for (const v of g.idx) all.idx.push(v + base); }
    const m = new THREE.Mesh(bufGeo(all), mat); m.name = tip; m.castShadow = m.receiveShadow = true; return m;
  }
  const mesh = new THREE.Mesh(bufGeo(G), mat);
  mesh.name = tip;
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
// ---------- Islak çam ormanı kaya seti: 10 parça (koyu gri granit, soğuk mavi-yeşil ton, yarıklarda yosun, ıslak koyu alt) ----------
const OS = (w, h, cy, form, ek = {}) => ({ w, h, cy, ...form, n1: 0.22, n2: 0.1, orman: true, big: true, ...ek });
const r9 = K_rng(9);
function K_rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const koseli = (n, sd) => { const r = K_rng(sd); return Array.from({ length: n }, () => { let x = r() * 2 - 1, y = r() * 1.6 - 0.5, z = r() * 2 - 1; const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l, 0.6 + r() * 0.15]; }); };
Object.assign(KAYALAR, {
  orman_set_01_ucurum_duvari: OS(16, 20, 3.5, { ell: [7, 9, 2.4, 3.2] }, { clip: [[0, 0, -1, 1.5]], strata: [1.3, 0.028], res: [150, 104], tex: 1536, fs: 0.75, yosun: 0.6, cracks: [[1, 0, 0.1, -0.15, 0.022, 0.12, 0, 0.1, 1], [0.95, 0.15, -0.1, 0.35, 0.02, 0.1, 0, 0.2, 1], [-0.95, 0.1, 0.1, 0.25, 0.022, 0.11, 0, 0.1, 1], [0.1, 1, 0.1, 0.25, 0.02, 0.08, 0, 0, 1]] }),
  orman_set_02_ucurum_kose: OS(12, 15, 4, { blobs: [[4.2, 4.5, 0, 6.6, 8.5, 2.4], [0, 4.5, 4.2, 2.4, 8.5, 6.6]] }, { clip: [[0, 0, -1, 1.6], [-1, 0, 0, 1.6]], strata: [1.2, 0.028], res: [150, 96], tex: 1536, fs: 0.8, yosun: 0.6, n1: 0.16, cracks: [[0.7, 0, 0.7, 0.05, 0.02, 0.1, 1, 0, 1], [1, 0, 0.1, 0.45, 0.02, 0.09, 0, 0.1, 1]] }),
  orman_set_03_sarkan_cikinti: OS(6, 2.8, 0.7, { ell: [2.6, 1.3, 1.6, 3.0] }, { dar: 0.42, clip: [[0, 1, 0, 0.95]], res: [120, 64], yosun: 0.9, cracks: [[1, 0, 0.2, 0.1, 0.03, 0.1, 0, 0.5, 1]] }),
  orman_set_04_dev_yuvarlak: OS(6, 5, 1.3, { ell: [2.0, 1.9, 1.8, 2.15] }, { n1: 0.1, n2: 0.045, res: [120, 64], yosun: 0.85, cracks: [[0.8, 0.1, 0.6, 0.15, 0.03, 0.06, 0.2, 0.6, -0.8]] }),
  orman_set_05_uclu_kume: OS(5.5, 3, 0.9, { blobs: [[-1.1, 0.9, 0.2, 1.4, 1.35, 1.2], [1.1, 0.75, -0.2, 1.3, 1.15, 1.2], [0.1, 1.2, 0.9, 1.05, 1.25, 1.0]] }, { n1: 0.16, res: [120, 64] }),
  orman_set_06_kucuk_taslar: OS(0.8, 0.5, 0.15, { ell: [0.4, 0.3, 0.33, 2.2] }, { big: false, res: [40, 26], tex: 512, ayri: true, parcalar: [
    { x: -2.2, w: 0.8, h: 0.5, cy: 0.15, ell: [0.4, 0.3, 0.33, 2.2] }, { x: -1.0, w: 0.6, h: 0.32, cy: 0.1, planes: koseli(11, 3) }, { x: 0, w: 0.5, h: 0.45, cy: 0.15, ell: [0.25, 0.32, 0.22, 2.6] },
    { x: 1.0, w: 0.7, h: 0.25, cy: 0.06, ell: [0.36, 0.16, 0.28, 2.8] }, { x: 2.0, w: 0.3, h: 0.24, cy: 0.08, planes: koseli(9, 7) }] }),
  orman_set_07_kirik_plaka: OS(2, 0.45, 0.06, { ell: [1.1, 0.24, 0.85, 4] }, { big: false, res: [64, 34], yosun: 1, cracks: [[0.9, 0, 0.44, 0.1, 0.02, 0.25, 0, 1, 0], [-0.4, 0, 0.92, -0.25, 0.018, 0.22, 0, 1, 0], [0.6, 0, -0.8, 0.4, 0.015, 0.18, 0.5, 1, 0]] }),
  orman_set_08_dere_tasi: OS(1.5, 0.8, 0.24, { ell: [0.75, 0.42, 0.56, 2.0] }, { big: false, n1: 0.035, n2: 0.012, res: [64, 34], yosun: 0.2, cilali: true }),
  orman_set_09_kaya_kulesi: OS(6, 25, 1.8, { ell: [1.3, 7, 1.15, 2.4] }, { base: 0.4, lean: 0.03, strata: [0.85, 0.035], res: [110, 130], tex: 1536, fs: 0.8, yosun: 0.5, cracks: [[0.9, 0.2, 0.3, 0.1, 0.03, 0.12, 0, 0.2, 1], [-0.5, 0.3, 0.8, 0.0, 0.03, 0.1, 1, 0.2, 0]] }),
  orman_set_10_moloz_yigini: OS(4, 1.2, 0.12, { ell: [2, 0.45, 1.6, 2.0] }, { res: [80, 40], n1: 0.12, parcalar: Array.from({ length: 30 }, (_, i) => { const a = r9() * TAU, e = Math.sqrt(r9()) * 0.92, s = 0.25 + r9() ** 2 * 0.5, hgt = 1.2 * Math.sqrt(Math.max(0, 1 - e * e)); return { x: Math.cos(a) * e * 2, z: Math.sin(a) * e * 1.6, y: Math.max(0, hgt - s * 0.15), ry: r9() * TAU, w: s, h: s * (0.5 + r9() * 0.4), cy: s * 0.2, planes: koseli(9 + (i % 4), 40 + i), big: false, res: [18, 10], ell: undefined, blobs: undefined }; }) }),
});
// ---------- Akdeniz kireçtaşı seti: 8 parça (açık gri, keskin köşeli kırık kenarlar, katmanlı çatlaklar, gözenekli yüzey, yarıklarda toz) ----------
const uzat = (pl, kx, ky, kz) => pl.map(([nx, ny, nz, d]) => { const a = nx / kx, b = ny / ky, c = nz / kz, l = Math.hypot(a, b, c); return [a / l, b / l, c / l, d / l]; });
const KS = (w, h, cy, form, ek = {}) => ({ w, h, cy, ...form, n1: 0.07, n2: 0.03, kuru: true, big: true, res: [120, 64], ...ek });
const r7 = K_rng(77), yatayCatlak = (n, sd) => { const r = K_rng(sd); return Array.from({ length: n }, () => [(r() - 0.5) * 0.3, 1, (r() - 0.5) * 0.3, (r() - 0.5) * 1.1, 0.016 + r() * 0.012, 0.06 + r() * 0.05, r() - 0.5, 0, r() - 0.5]); };
Object.assign(KAYALAR, {
  kirec_set_1_uzun_alcak: KS(8, 2, 0.15, { planes: uzat(koseli(18, 101), 3.8, 0.95, 1.3) }, { strata: [0.28, 0.035], cracks: [...yatayCatlak(3, 5), [1, 0, 0.2, 0.25, 0.02, 0.12, 0, 0.3, 1]], res: [150, 60] }),
  kirec_set_2_yuksek_sivri: KS(2.8, 4, 0.5, { planes: uzat(koseli(15, 202), 1, 2.6, 0.9) }, { lean: 0.07, strata: [0.32, 0.03], cracks: [[0.9, 0.2, 0.3, 0.05, 0.02, 0.12, 0, 0.2, 1], ...yatayCatlak(2, 9)], res: [90, 80] }),
  kirec_set_3_basamakli_raf: KS(5, 2.2, 0.4, { planes: uzat(koseli(16, 303), 2.2, 1, 1.4) }, { strata: [0.4, 0.075], cracks: yatayCatlak(3, 13) }),
  kirec_set_4_koseli_kaya: KS(2.5, 2.1, 0.5, { planes: koseli(13, 404) }, { cracks: [[0.7, 0.2, 0.7, 0.1, 0.02, 0.1, 0, 0.4, 1], ...yatayCatlak(2, 17)] }),
  kirec_set_5_dortlu_kume: KS(1.5, 1.5, 0.35, { planes: uzat(koseli(12, 505), 1, 1.3, 0.9) }, { res: [60, 40], tex: 1024, parcalar: [
    { x: 1.1, z: 0.3, w: 1.2, h: 1.0, cy: 0.3, planes: koseli(11, 506), res: [48, 32] }, { x: -0.9, z: 0.5, w: 1.0, h: 0.8, cy: 0.25, planes: koseli(12, 507), res: [48, 32] }, { x: 0.2, z: -0.95, w: 1.1, h: 0.9, cy: 0.25, planes: uzat(koseli(11, 508), 1.4, 1, 1), res: [48, 32] }] }),
  kirec_set_6_kucuk_taslar: KS(0.6, 0.4, 0.12, { planes: koseli(11, 601) }, { big: false, tex: 512, res: [32, 20], ayri: true, parcalar: [
    { x: -2.2, w: 0.6, h: 0.4, cy: 0.12, planes: koseli(11, 601) }, { x: -1.3, w: 0.45, h: 0.25, cy: 0.07, planes: uzat(koseli(10, 602), 1.4, 0.7, 1) }, { x: -0.5, w: 0.35, h: 0.32, cy: 0.1, planes: koseli(9, 603) },
    { x: 0.3, w: 0.5, h: 0.22, cy: 0.06, planes: uzat(koseli(10, 604), 1.2, 0.6, 1) }, { x: 1.1, w: 0.28, h: 0.2, cy: 0.06, planes: koseli(9, 605) }, { x: 1.8, w: 0.2, h: 0.16, cy: 0.05, planes: koseli(8, 606) }] }),
  kirec_set_7_catlak_plaka: KS(3, 0.5, 0.08, { planes: uzat(koseli(16, 701), 1.35, 0.2, 1) }, { cracks: [[0.9, 0, 0.44, 0.1, 0.02, 0.28, 0, 1, 0], [-0.4, 0, 0.92, -0.25, 0.018, 0.25, 0, 1, 0], [0.6, 0, -0.8, 0.4, 0.016, 0.22, 0.5, 1, 0], [0.2, 0, 1, 0.45, 0.014, 0.2, 0, 1, 0]], res: [96, 40] }),
  kirec_set_8_moloz: KS(1.6, 0.28, 0.04, { ell: [1, 0.25, 0.8, 2.2] }, { res: [40, 20], parcalar: Array.from({ length: 52 }, (_, i) => { const a = r7() * TAU, e = Math.sqrt(r7()) * 0.98, sz = 0.15 + r7() ** 1.5 * 0.32, hgt = 0.34 * Math.sqrt(Math.max(0, 1 - e * e)) + (e < 0.5 ? 0.12 * (1 - e * 2) : 0); return { x: Math.cos(a) * e * 0.95, z: Math.sin(a) * e * 0.78, y: Math.max(0, hgt - sz * 0.25), ry: r7() * TAU, w: sz, h: sz * (0.45 + r7() * 0.4), cy: sz * 0.15, planes: koseli(9 + (i % 4), 800 + i), ell: undefined, big: false, res: [16, 10] }; }) }),
});
export const KIREC_SETI = Object.keys(KAYALAR).filter((n) => n.startsWith('kirec_set_'));
export function createKirecSeti() {
  const g = new THREE.Group(); g.name = 'kirec_kaya_seti';
  const yer = [[-10, -4], [0, -5], [8, -4], [-11, 5], [-4, 5], [1.5, 5], [6.5, 5], [11.5, 5]];
  KIREC_SETI.forEach((n, i) => { const m = createKaya(n); m.position.set(yer[i][0], 0, yer[i][1]); g.add(m); });
  return g;
}
export const ORMAN_SETI = Object.keys(KAYALAR).filter((n) => n.startsWith('orman_set_'));
// Ön izleme dizilimi: on parça boş zeminde aralıklı, birbirine değmeden
export function createOrmanSeti() {
  const g = new THREE.Group(); g.name = 'orman_kaya_seti';
  const yer = [[-24, -6], [-4, -8], [12, -6], [-22, 10], [-12, 12], [-3, 12], [4, 13], [10, 13], [22, -4], [18, 12]];
  ORMAN_SETI.forEach((n, i) => { const m = createKaya(n); m.position.set(yer[i][0], 0, yer[i][1]); g.add(m); });
  return g;
}
