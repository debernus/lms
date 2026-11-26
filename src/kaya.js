import * as THREE from 'three';

// Büyük kayalar: tek, kapalı (su geçirmez) ağ; taban düz ve y = 0'da, orijin tabanın ortasında.
// 1) yuvarlak, üstü aşınmış kaya  2) büyük bir dikey yarıkla ikiye ayrılmış köşeli kaya. İkisi de 5 m geniş, 3 m yüksek.
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

// ---------- Biçimler: f(dx, dy, dz) -> [yarıçap, yarık (0..1)] ; merkez (0, cy, 0) ----------
const norm = ([x, y, z, d]) => { const l = Math.hypot(x, y, z); return [x / l, y / l, z / l, d]; };
const TIPLER = {
  1: {
    cy: 1.05,
    f(dx, dy, dz) {
      const p = 2.5, base = (Math.abs(dx / 2.55) ** p + Math.abs(dy / 1.95) ** p + Math.abs(dz / 2.1) ** p) ** (-1 / p);
      const top = sm(0.35, 0.8, dy);
      let r = base * (1 + 0.2 * (fbm(dx * 1.3 + 3, dy * 1.3, dz * 1.3, 3) - 0.5) + 0.09 * (fbm(dx * 3.1, dy * 3.1 + 9, dz * 3.1, 3) - 0.5) * (1 - 0.75 * top));
      let crack = 0;
      // Birkaç derin yarık: merkezden geçen eğri düzlemler, yalnız bir yanda
      for (const [nx, ny, nz, off, w, depth, mx, my, mz, k] of [[0.8, 0.1, 0.6, 0.12, 0.05, 0.42, 0.2, 0.6, -0.8, 1], [-0.5, 0.2, 0.84, -0.2, 0.04, 0.3, -0.7, 0.5, 0.4, 2], [0.2, 0.75, -0.6, 0.35, 0.035, 0.22, 0.9, 0.2, 0.3, 3]]) {
        const d = dx * nx + dy * ny + dz * nz - off + 0.16 * (fbm(dx * 2.4 + k * 13, dy * 2.4, dz * 2.4, 2) - 0.5);
        const c = Math.exp(-((d / w) ** 2)) * sm(-0.15, 0.3, dx * mx + dy * my + dz * mz);
        r -= depth * c;
        crack = Math.max(crack, c);
      }
      return [r, crack];
    },
  },
  2: {
    cy: 1.1,
    planes: [[1, 0.08, 0.1, 2.4], [-1, 0.12, -0.08, 2.3], [0.1, 0.05, 1, 1.9], [-0.06, 0.1, -1, 2.0], [0.08, 1, -0.06, 1.9], [0.62, 0.7, 0.2, 2.5], [-0.5, 0.78, -0.3, 2.35], [0.3, 0.55, 0.8, 2.15], [-0.72, 0.2, 0.66, 2.3], [0.66, 0.12, -0.72, 2.4], [-0.35, 0.6, 0.72, 2.3], [-0.6, 0.3, -0.74, 2.45]].map(norm),
    f(dx, dy, dz) {
      let r = 1e9;
      for (const [nx, ny, nz, d] of this.planes) { const c = nx * dx + ny * dy + nz * dz; if (c > 0.02) r = Math.min(r, d / c); }
      r *= 1 + 0.06 * (fbm(dx * 2.2 + 30, dy * 2.2, dz * 2.2, 3) - 0.5) + 0.025 * (fbm(dx * 7, dy * 7 + 4, dz * 7, 2) - 0.5);
      // Büyük dikey yarık: kayayı ikiye ayırır; bir yarısı biraz çökmüş
      const d = dx * 0.93 + dz * 0.36 - 0.06 + 0.1 * (fbm(dx * 2 + 50, dy * 2, dz * 2, 2) - 0.5);
      const c = Math.exp(-((d / 0.055) ** 2)) * sm(-0.55, -0.1, dy);
      r *= 1 - 0.07 * sm(0, 0.08, d);
      r -= 1.15 * c;
      // İkincil ince yarık
      const d2 = dx * -0.3 + dy * 0.2 + dz * 0.93 - 0.3 + 0.12 * (fbm(dx * 2.6 + 80, dy * 2.6, dz * 2.6, 2) - 0.5), c2 = Math.exp(-((d2 / 0.03) ** 2)) * sm(0, 0.3, d);
      r -= 0.22 * c2;
      return [r, Math.max(c, c2 * 0.8)];
    },
  },
};

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
function textures(tip, T, S, W) {
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = W; return c; };
  const cc = mk(), oc = mk(), cg = cc.getContext('2d'), og = oc.getContext('2d'), col = cg.createImageData(W, W), orm = og.createImageData(W, W), H = new Float32Array(W * W), o = tip * 100;
  for (let py = 0; py < W; py++) for (let px = 0; px < W; px++) {
    const ex = ((px + 0.5) / W) * 2 - 1, ey = (1 - (py + 0.5) / W) * 2 - 1, rho = Math.min(1, Math.hypot(ex, ey)), th = rho * TH, ph = Math.atan2(ey, ex);
    const dx = Math.sin(th) * Math.cos(ph), dy = Math.cos(th), dz = Math.sin(th) * Math.sin(ph), [r, crack] = T.f(dx, dy, dz);
    const x = dx * r * S[0], y = (T.cy + dy * r) * S[1], z = dz * r * S[0], up = sm(0.15, 0.85, dy), side = 1 - up;
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
    const moss = Math.min(1, Math.max(0.55 * sm(0.2, 0.5, crack) * (1 - sm(0.6, 0.95, crack)) * (0.4 + 0.6 * sm(-0.3, 0.5, dy)), 0.7 * sm(0.58, 0.72, fbm(x * 1.6 + 150, y * 1.6, z * 1.6 + o, 3)) * sm(0.3, 0.8, dy), 0.6 * fine * up)) * sm(0.3, 0.6, noise(x * 9 + o, y * 9, z * 9) + 0.25);
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
  const m = tex(`kaya${tip}_pm`, oc, false);
  return new THREE.MeshStandardMaterial({ name: `kaya_${tip}`, map: tex(`kaya${tip}_renk`, cc, true), roughnessMap: m, metalnessMap: m, normalMap: tex(`kaya${tip}_kabartma`, normalFrom(H, W, 5), false), roughness: 1, metalness: 1 });
}

export function createKaya(tip = 1, { width = 5, height = 3, M = 112, N = 60, size = 1024 } = {}) {
  const T = TIPLER[tip];
  // Ham ağ: tepe noktası, N halka (kutup açısı 0 … TH), taban merkezi. Köşeler paylaşılır: ağ kapalıdır.
  const raw = [];
  for (let j = 1; j <= N; j++) for (let k = 0; k < M; k++) {
    const th = (j / N) * TH, ph = (k / M) * TAU, dx = Math.sin(th) * Math.cos(ph), dy = Math.cos(th), dz = Math.sin(th) * Math.sin(ph), [r] = T.f(dx, dy, dz);
    raw.push([dx * r, T.cy + dy * r, dz * r, 0.5 + 0.5 * (j / N) * Math.cos(ph), 0.5 + 0.5 * (j / N) * Math.sin(ph)]);
  }
  const top = T.cy + T.f(0, 1, 0)[0];
  // Tabanın altına düşen noktalar, merkezden çıkan ışın boyunca y = 0 kesitine çekilir: düz taban
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, y1 = top;
  for (const q of raw) { if (q[1] < 0) { const t = T.cy / (T.cy - q[1]); q[0] *= t; q[2] *= t; q[1] = 0; } const [x, y, z] = q; x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); y1 = Math.max(y1, y); }
  const S = [width / Math.max(x1 - x0, z1 - z0), height / y1], ox = ((x0 + x1) / 2) * S[0], oz = ((z0 + z1) / 2) * S[0];
  const pos = [0 - ox, top * S[1], 0 - oz], uv = [0.5, 0.5], idx = [];
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
  const mesh = new THREE.Mesh(g, textures(tip, T, S, size));
  mesh.name = `kaya_buyuk_${tip}`;
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
