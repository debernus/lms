// Örtük yüzeyden (işaretli uzaklık alanı) tek parça kapalı ağ çıkarır: "surface nets" yöntemi.
// Izgara, odak noktalarının çevresinde sıklaşacak biçimde bükülür; böylece yüz ve eller gibi
// yerler ince, kumaş gibi sade yerler kaba örülür ama ağ yine tek ve kapalı kalır.

// Dünya -> ızgara uzayı: her odak çevresini büyütür (odakta 1 + s kat).
function warp(foci, x, y, z, out) {
  let ox = x, oy = y, oz = z;
  for (const f of foci) {
    const dx = x - f.x, dy = y - f.y, dz = z - f.z;
    const t = (dx * dx + dy * dy + dz * dz) / (f.r * f.r);
    const g = f.s / Math.pow(1 + t, 0.75); // yavaş sönen büyütme: çevrede kaba halka bırakmaz
    ox += dx * g;
    oy += dy * g;
    oz += dz * g;
  }
  out[0] = ox;
  out[1] = oy;
  out[2] = oz;
}

// Köşeyi gerçek yüzeye oturtur (Newton adımları).
function project(field, verts, v, steps) {
  const e = 2e-4;
  for (let it = 0; it < steps; it++) {
    const x = verts[v], y = verts[v + 1], z = verts[v + 2];
    const d = field(x, y, z);
    const gx = field(x + e, y, z) - field(x - e, y, z);
    const gy = field(x, y + e, z) - field(x, y - e, z);
    const gz = field(x, y, z + e) - field(x, y, z - e);
    const g2 = (gx * gx + gy * gy + gz * gz) / (4 * e * e);
    if (g2 < 1e-6) break;
    const s = Math.max(-0.004, Math.min(0.004, d)) / g2 / (2 * e);
    verts[v] -= gx * s;
    verts[v + 1] -= gy * s;
    verts[v + 2] -= gz * s;
  }
}

// Renk sınırlarını keskinleştirir: iki farklı malzemeyi birleştiren her kenarda sınırın yerini
// bulur ve kenarın iki ucunu sınırın hemen iki yanına çeker. Böylece sınır hücreleri çapraz
// kesmez, köşelerden geçer; ağın bağlantısı (ve kapalılığı) değişmez.
export function sharpenBoundaries(field, material, positions, indices, gap = 0.002) {
  const count = positions.length / 3;
  const mat = new Int16Array(count);
  for (let v = 0; v < count; v++) mat[v] = material(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]);
  const sum = new Float32Array(count * 3);
  const hits = new Uint16Array(count);
  const seen = new Set();
  const probe = [0, 0, 0];
  for (let t = 0; t < indices.length; t += 3) {
    for (let k = 0; k < 3; k++) {
      const a = indices[t + k], b = indices[t + ((k + 1) % 3)];
      if (a > b || mat[a] === mat[b] || seen.has(a * count + b)) continue;
      seen.add(a * count + b);
      const ax = positions[a * 3], ay = positions[a * 3 + 1], az = positions[a * 3 + 2];
      const dx = positions[b * 3] - ax, dy = positions[b * 3 + 1] - ay, dz = positions[b * 3 + 2] - az;
      let lo = 0, hi = 1;
      for (let it = 0; it < 9; it++) {
        const m = (lo + hi) / 2;
        probe[0] = ax + dx * m; probe[1] = ay + dy * m; probe[2] = az + dz * m;
        project(field, probe, 0, 2); // kirişin içindeki nokta değil, yüzeydeki karşılığı sınanır
        if (material(probe[0], probe[1], probe[2]) === mat[a]) lo = m;
        else hi = m;
      }
      const len = Math.hypot(dx, dy, dz);
      const g = Math.min(gap / len, 0.25);
      const ta = Math.max(0, lo - g), tb = Math.min(1, hi + g);
      sum[a * 3] += ax + dx * ta; sum[a * 3 + 1] += ay + dy * ta; sum[a * 3 + 2] += az + dz * ta; hits[a]++;
      sum[b * 3] += ax + dx * tb; sum[b * 3 + 1] += ay + dy * tb; sum[b * 3 + 2] += az + dz * tb; hits[b]++;
    }
  }
  // Köşeyi eski yerinden hedefe doğru, kendi malzemesinde kaldığı en uzak noktaya taşı
  const old = [0, 0, 0];
  const target = [0, 0, 0];
  const place = (o, t) => {
    for (let c = 0; c < 3; c++) positions[o + c] = old[c] + (target[c] - old[c]) * t;
    project(field, positions, o, 2);
    return material(positions[o], positions[o + 1], positions[o + 2]);
  };
  for (let v = 0; v < count; v++) {
    if (!hits[v]) continue;
    const o = v * 3;
    for (let c = 0; c < 3; c++) {
      old[c] = positions[o + c];
      target[c] = old[c] + (sum[o + c] / hits[v] - old[c]) * 1.15; // sınırı biraz aşabilecek kadar uzat
    }
    if (place(o, 1) === mat[v]) continue;
    let lo = 0, hi = 1;
    for (let it = 0; it < 7; it++) {
      const m = (lo + hi) / 2;
      if (place(o, m) === mat[v]) lo = m;
      else hi = m;
    }
    place(o, lo);
  }
}

// field(x, y, z) < 0 içerisi. bounds: [minX, minY, minZ, maxX, maxY, maxZ] (dünya), cell: temel hücre.
export function meshField(field, bounds, cell, foci = []) {
  const pad = 0.3; // bükülme en çok bu kadar taşır
  // x = 0 bir düğüme denk gelsin: simetrik biçim simetrik örülür
  const min = [-Math.ceil((pad - bounds[0]) / cell) * cell, bounds[1] - pad, bounds[2] - pad];
  const dims = [0, 1, 2].map((a) => Math.ceil((bounds[a + 3] + pad - min[a]) / cell) + 1);
  const [nx, ny, nz] = dims;
  const count = nx * ny * nz;
  const pos = new Float32Array(count * 3);
  const val = new Float32Array(count);
  const step = 1 / (1 + foci.reduce((m, f) => Math.max(m, f.s), 0));
  const w = [0, 0, 0];

  // Her ızgara düğümünün dünya konumu: bükülmenin tersi (sönümlü yineleme ile)
  let n = 0;
  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++, n++) {
        const qx = min[0] + i * cell, qy = min[1] + j * cell, qz = min[2] + k * cell;
        let x = qx, y = qy, z = qz;
        if (foci.length) {
          for (let it = 0; it < 400; it++) {
            warp(foci, x, y, z, w);
            const ex = w[0] - qx, ey = w[1] - qy, ez = w[2] - qz;
            x -= ex * step;
            y -= ey * step;
            z -= ez * step;
            if (ex * ex + ey * ey + ez * ez < 1e-11) break;
          }
        }
        pos[n * 3] = x;
        pos[n * 3 + 1] = y;
        pos[n * 3 + 2] = z;
        val[n] = field(x, y, z);
      }
    }
  }

  const node = (i, j, k) => i + nx * (j + ny * k);
  const cx = nx - 1, cy = ny - 1;
  const cellId = (i, j, k) => i + cx * (j + cy * k);
  const cellVert = new Int32Array(cx * cy * (nz - 1)).fill(-1);
  const verts = [];
  const CORNERS = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const ids = new Int32Array(8);

  // Yüzeyin geçtiği her hücreye bir köşe: kenar kesişimlerinin ortalaması
  for (let k = 0; k < nz - 1; k++) {
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        let inside = 0;
        for (let c = 0; c < 8; c++) {
          ids[c] = node(i + CORNERS[c][0], j + CORNERS[c][1], k + CORNERS[c][2]);
          if (val[ids[c]] < 0) inside++;
        }
        if (inside === 0 || inside === 8) continue;
        let sx = 0, sy = 0, sz = 0, hits = 0;
        for (const [a, b] of EDGES) {
          const va = val[ids[a]], vb = val[ids[b]];
          if (va < 0 === vb < 0) continue;
          const t = va / (va - vb);
          const pa = ids[a] * 3, pb = ids[b] * 3;
          sx += pos[pa] + (pos[pb] - pos[pa]) * t;
          sy += pos[pa + 1] + (pos[pb + 1] - pos[pa + 1]) * t;
          sz += pos[pa + 2] + (pos[pb + 2] - pos[pa + 2]) * t;
          hits++;
        }
        cellVert[cellId(i, j, k)] = verts.length / 3;
        verts.push(sx / hits, sy / hits, sz / hits);
      }
    }
  }

  for (let v = 0; v < verts.length; v += 3) project(field, verts, v, 3);

  // İşaret değiştiren her ızgara kenarı için, o kenarı paylaşan dört hücrenin köşelerinden bir dörtgen
  const indices = [];
  const dist2 = (a, b) => (verts[a * 3] - verts[b * 3]) ** 2 + (verts[a * 3 + 1] - verts[b * 3 + 1]) ** 2 + (verts[a * 3 + 2] - verts[b * 3 + 2]) ** 2;
  const quad = (a, b, c, d, flip) => {
    if (flip) [b, d] = [d, b];
    if (dist2(a, c) <= dist2(b, d)) indices.push(a, b, c, a, c, d);
    else indices.push(a, b, d, b, c, d);
  };
  for (let k = 0; k < nz - 1; k++) {
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const here = val[node(i, j, k)] < 0;
        if (j > 0 && k > 0 && here !== val[node(i + 1, j, k)] < 0) {
          quad(cellVert[cellId(i, j - 1, k - 1)], cellVert[cellId(i, j, k - 1)], cellVert[cellId(i, j, k)], cellVert[cellId(i, j - 1, k)], !here);
        }
        if (i > 0 && k > 0 && here !== val[node(i, j + 1, k)] < 0) {
          quad(cellVert[cellId(i - 1, j, k - 1)], cellVert[cellId(i - 1, j, k)], cellVert[cellId(i, j, k)], cellVert[cellId(i, j, k - 1)], !here);
        }
        if (i > 0 && j > 0 && here !== val[node(i, j, k + 1)] < 0) {
          quad(cellVert[cellId(i - 1, j - 1, k)], cellVert[cellId(i, j - 1, k)], cellVert[cellId(i, j, k)], cellVert[cellId(i - 1, j, k)], !here);
        }
      }
    }
  }
  return { positions: new Float32Array(verts), indices };
}

// Ağın tek parça ve kapalı olup olmadığını denetler.
export function checkClosed(positions, indices) {
  const edges = new Map();
  for (let t = 0; t < indices.length; t += 3) {
    for (let e = 0; e < 3; e++) {
      const a = indices[t + e], b = indices[t + ((e + 1) % 3)];
      edges.set(a + '>' + b, (edges.get(a + '>' + b) || 0) + 1);
    }
  }
  let bad = 0;
  const where = [];
  for (const [key, n] of edges) {
    const [a, b] = key.split('>');
    if (n !== 1 || edges.get(b + '>' + a) !== 1) {
      bad++;
      where.push([positions[a * 3], positions[a * 3 + 1], positions[a * 3 + 2]].map((v) => +v.toFixed(3)));
    }
  }
  const V = positions.length / 3, F = indices.length / 3, E = edges.size / 2;
  return { vertices: V, triangles: F, badEdges: bad, euler: V - E + F, where };
}
