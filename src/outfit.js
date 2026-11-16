import * as THREE from 'three';
import M from './manken_olcu.js';
import { meshField, sharpenBoundaries } from './isosurface.js';

// 1914, Anadolu'da bir yol eşkıyasının kıyafeti: cepken, kuşak, şalvar, kalpak.
// Parçalar manken_erkek.glb'nin üstüne oturur; ölçüler manken_olcu.js'ten gelir (mankenin kendisi
// burada yoktur). Mankenle aynı konum ve duruş: 1 birim = 1 metre, Y yukarı, yüz +Z'ye bakar.
// Yalnız dış yüzeyler modellenir; hiçbir parça taşınmaz, döndürülmez, ölçeklenmez.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const S = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const TAU = Math.PI * 2;

// ---------- Ölçü okuma ----------

// Dışbükey kesitin, (cx, cz) merkezinden (dx, dz) yönünde sınırına uzaklığı.
function hullRadius(hull, cx, cz, dx, dz) {
  let best = 0;
  for (let i = 0; i < hull.length; i += 2) {
    const px = hull[i] - cx, pz = hull[i + 1] - cz;
    const j = (i + 2) % hull.length;
    const ex = hull[j] - hull[i], ez = hull[j + 1] - hull[i + 1];
    const den = dx * ez - dz * ex;
    if (Math.abs(den) < 1e-12) continue;
    const t = (px * ez - pz * ex) / den;
    const s = (px * dz - pz * dx) / den;
    if (t > 0 && s >= -1e-9 && s <= 1 + 1e-9) best = Math.max(best, t);
  }
  return best;
}
// y yüksekliğinde mankenin o yöndeki en dış noktası: komşu iki dilimin büyüğü (asla içeride kalmaz).
function reach(table, y, cx, cz, dx, dz) {
  const f = (y - table.y0) / table.dy;
  const last = table.hulls.length - 1;
  const a = clamp(Math.floor(f), 0, last), b = clamp(Math.ceil(f), 0, last);
  return Math.max(hullRadius(table.hulls[a], cx, cz, dx, dz), hullRadius(table.hulls[b], cx, cz, dx, dz));
}

// Gövde ve kolların çevresindeki işaretli uzaklık (dışarısı artı); ızgaradan üç doğrusal okunur.
const GRID = M.grid;
const cells = Uint8Array.from(atob(GRID.data), (c) => c.charCodeAt(0));
function bodyDistance(x, y, z) {
  const [nx, ny, nz] = GRID.dims;
  const fx = (x - GRID.min[0]) / GRID.cell, fy = (y - GRID.min[1]) / GRID.cell, fz = (z - GRID.min[2]) / GRID.cell;
  if (fx < 0 || fy < 0 || fz < 0 || fx > nx - 1 || fy > ny - 1 || fz > nz - 1) return GRID.range[1];
  const i = Math.min(Math.floor(fx), nx - 2), j = Math.min(Math.floor(fy), ny - 2), k = Math.min(Math.floor(fz), nz - 2);
  const tx = fx - i, ty = fy - j, tz = fz - k;
  const at = (a, b, c) => cells[i + a + nx * (j + b + ny * (k + c))];
  const lerp = (p, q, t) => p + (q - p) * t;
  const v = lerp(
    lerp(lerp(at(0, 0, 0), at(1, 0, 0), tx), lerp(at(0, 1, 0), at(1, 1, 0), tx), ty),
    lerp(lerp(at(0, 0, 1), at(1, 0, 1), tx), lerp(at(0, 1, 1), at(1, 1, 1), tx), ty),
    tz,
  );
  return GRID.range[0] + (v / 255) * (GRID.range[1] - GRID.range[0]);
}

// ---------- Ağ kurma ----------

class Surface {
  constructor() {
    this.positions = [];
    this.indices = [];
  }
  point(x, y, z) {
    this.positions.push(x, y, z);
    return this.positions.length / 3 - 1;
  }
  // İki köşe sırası arasına dörtgen şerit. outward(x, y, z): yüzün bakması gereken yaklaşık yön.
  strip(a, b, closed, outward) {
    const n = a.length;
    const start = this.indices.length;
    for (let k = 0; k < (closed ? n : n - 1); k++) {
      const k1 = (k + 1) % n;
      this.indices.push(a[k], a[k1], b[k1], a[k], b[k1], b[k]);
    }
    this.orient(start, outward);
  }
  fan(center, ring, outward) {
    const start = this.indices.length;
    for (let k = 0; k < ring.length; k++) this.indices.push(center, ring[k], ring[(k + 1) % ring.length]);
    this.orient(start, outward);
  }
  // start'tan sonraki üçgenler outward yönüne bakmıyorsa hepsini çevirir.
  orient(start, outward) {
    const P = this.positions;
    let vote = 0;
    for (let t = start; t < this.indices.length; t += 3) {
      const [a, b, c] = [0, 1, 2].map((k) => this.indices[t + k] * 3);
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
      const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
      const o = outward((P[a] + P[b] + P[c]) / 3, (P[a + 1] + P[b + 1] + P[c + 1]) / 3, (P[a + 2] + P[b + 2] + P[c + 2]) / 3);
      vote += (uy * vz - uz * vy) * o[0] + (uz * vx - ux * vz) * o[1] + (ux * vy - uy * vx) * o[2];
    }
    if (vote < 0) for (let t = start; t < this.indices.length; t += 3) [this.indices[t + 1], this.indices[t + 2]] = [this.indices[t + 2], this.indices[t + 1]];
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    g.setIndex(this.indices);
    g.computeVertexNormals();
    return g;
  }
}
const cloth = (name, color) => new THREE.MeshStandardMaterial({ name, color, roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
const awayFromAxis = (cx, cz) => (x, y, z) => [x - cx, 0, z - cz];

// ---------- Şalvar ----------
// Belden dize kadar tek bir bol torba; ağı dizlerin hizasına sarkar, altında her bacak ayrı
// paçaya girer ve dizin 10 cm altında büzülür.
const SALVAR = { top: 1.08, crotch: 0.52, hem: 0.41, cx: 0, cz: -0.04, leg: [0.105, -0.048] };
const BAG = [[0.52, 0.02], [0.55, 0.03], [0.6, 0.05], [0.67, 0.06], [0.75, 0.068], [0.83, 0.07], [0.9, 0.06], [0.945, 0.035], [0.972, 0.003], [1.08, 0]]; // kuşağın altında bolluk yok
function bagginess(y) {
  for (let i = 1; i < BAG.length; i++) {
    if (y <= BAG[i][0]) return BAG[i - 1][1] + ((BAG[i][1] - BAG[i - 1][1]) * (y - BAG[i - 1][0])) / (BAG[i][0] - BAG[i - 1][0]);
  }
  return 0;
}
// Torbanın, orta eksenden angle yönündeki yarıçapı: manken + 1,5 cm + bolluk (altı büyük kıvrımla).
function salvarRadius(y, angle) {
  const folds = 1 + 0.28 * Math.cos(6 * angle + 0.7) * (1 - S(0.9, 1.0, y));
  return reach(M.body, y, SALVAR.cx, SALVAR.cz, Math.cos(angle), Math.sin(angle)) + 0.015 + bagginess(y) * folds;
}

function buildSalvar() {
  const s = new Surface();
  const N = 24; // paça halkasındaki köşe sayısı; 8..16 arası köşeler öbür bacağa bakar
  const cuffRows = [SALVAR.hem, 0.43, 0.455, 0.485, SALVAR.crotch];
  const top = {}; // her bacağın en üst paça halkası
  for (const side of [1, -1]) {
    const table = side > 0 ? M.legRight : M.legLeft;
    const cx = side * SALVAR.leg[0], cz = SALVAR.leg[1];
    const rings = cuffRows.map((y) => {
      const ring = [];
      for (let i = 0; i < N; i++) {
        const a = (i / N) * TAU;
        const dx = side * Math.cos(a), dz = Math.sin(a);
        const outer = (1 + Math.cos(a)) / 2; // dış yanda 1, iki bacağın arasında 0
        const r = reach(table, y, cx, cz, dx, dz) + 0.01 + 0.005 * outer + 0.012 * outer * S(SALVAR.hem, SALVAR.crotch, y);
        ring.push(s.point(cx + dx * r, y, cz + dz * r));
      }
      return ring;
    });
    for (let j = 1; j < rings.length; j++) s.strip(rings[j - 1], rings[j], true, awayFromAxis(cx, cz));
    top[side] = rings[rings.length - 1];
  }

  // Ağ: iki paçanın birbirine bakan yaylarını birleştiren, ortası sarkık şerit
  const inner = (ring) => ring.slice(8, 17);
  const R = inner(top[1]), L = inner(top[-1]);
  const P = s.positions;
  const mid = R.map((r, m) => {
    const l = L[m];
    const sag = 0.02 * Math.sin((Math.PI * m) / (R.length - 1));
    return s.point((P[r * 3] + P[l * 3]) / 2, SALVAR.crotch - sag, (P[r * 3 + 2] + P[l * 3 + 2]) / 2);
  });
  s.strip(R, mid, false, () => [0, -1, 0]);
  s.strip(mid, L, false, () => [0, -1, 0]);

  // Torba: en alt halkası iki paçanın dış yaylarıdır; yukarı doğru bele kadar çıkar
  const order = [...Array(9).keys()].map((i) => 16 + i).map((i) => i % N).concat([...Array(8).keys()].map((i) => i + 1));
  // İki paça arasındaki ön ve arka açıklığa ara köşeler: yoksa torba orada karnı ve sırtı keser
  const between = (a, m, b) => {
    const at = (t, u, v) => s.point(P[u * 3] + (P[v * 3] - P[u * 3]) * t, P[u * 3 + 1], P[u * 3 + 2] + (P[v * 3 + 2] - P[u * 3 + 2]) * t);
    return [at(1 / 3, a, m), at(2 / 3, a, m), m, at(1 / 3, m, b), at(2 / 3, m, b)];
  };
  const front = between(top[1][8], mid[0], top[-1][8]);
  const back = between(top[-1][16], mid[mid.length - 1], top[1][16]);
  const base = [...order.map((i) => top[1][i]), ...front, ...[...order].reverse().map((i) => top[-1][i]), ...back];
  const angles = base.map((v) => Math.atan2(P[v * 3 + 2] - SALVAR.cz, P[v * 3] - SALVAR.cx));
  let previous = base;
  for (const y of [0.55, 0.6, 0.67, 0.76, 0.83, 0.9, 0.945, 0.972, 1.03, SALVAR.top]) {
    const ring = angles.map((a) => {
      const r = salvarRadius(y, a);
      return s.point(SALVAR.cx + Math.cos(a) * r, y, SALVAR.cz + Math.sin(a) * r);
    });
    s.strip(previous, ring, true, awayFromAxis(SALVAR.cx, SALVAR.cz));
    previous = ring;
  }
  const mesh = new THREE.Mesh(s.geometry(), cloth('salvar', 0x1b1b1d));
  mesh.name = 'salvar';
  return mesh;
}

// ---------- Kuşak ----------
// Bele üç kat sarılmış 18 cm yüksekliğinde sargı; şalvarın üst, cepkenin alt kenarını örter.
// Bir ucu sol yanda (mankenin solu = +X) 25 cm sarkar.
const KUSAK = { bottom: 1.0, height: 0.18, cx: 0, cz: -0.01 };
function buildKusak() {
  const s = new Surface();
  const SEG = 40;
  const WRAPS = 3;
  const waist = (y, a) => {
    // Sargının kapladığı yükseklik boyunca mankenin en geniş yeri: kuşak hiçbir yerde içeri girmez
    let r = 0;
    for (let d = -0.02; d <= 0.0201; d += 0.02) r = Math.max(r, reach(M.body, y + d, KUSAK.cx, KUSAK.cz, Math.cos(a), Math.sin(a)));
    return r;
  };
  // Satırlar: alt kıvrık kenar, her katın oluğu ve kabarığı, üst kıvrık kenar
  const rows = [[-0.004, -0.006]];
  for (let i = 0; i <= WRAPS * 2; i++) rows.push([(i / (WRAPS * 2)) * KUSAK.height, i % 2 ? 0.007 : 0]);
  rows.push([KUSAK.height + 0.004, -0.006]);
  let previous = null;
  for (const [h, bulge] of rows) {
    const ring = [];
    for (let k = 0; k < SEG; k++) {
      const a = (k / SEG) * TAU;
      const y = KUSAK.bottom + h + 0.01 * Math.sin(a + 1); // sargı hafif çapraz durur
      const r = waist(y, a) + 0.024 + bulge;
      ring.push(s.point(KUSAK.cx + Math.cos(a) * r, y, KUSAK.cz + Math.sin(a) * r));
    }
    if (previous) s.strip(previous, ring, true, awayFromAxis(KUSAK.cx, KUSAK.cz));
    previous = ring;
  }

  // Sarkan uç: sol yanda, şalvarın üstünde aşağı iner
  const center = 0.26; // +X'ten öne doğru açı (radyan)
  const half = 0.24;
  const COLS = 5;
  let above = null;
  for (const y of [1.012, 0.972, 0.945, 0.9, 0.83, 0.76]) { // şalvarın halkalarıyla aynı yükseklikler
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const a = center + half * ((2 * c) / (COLS - 1) - 1) * (1 + 0.25 * S(0.95, 0.76, y)); // aşağı doğru hafif açılır
      // Şalvarın o noktadaki yüzeyi ölçü merkezine göre tanımlı; kuşağın ucu onun 1,2 cm dışında durur
      const r = salvarRadius(Math.min(y, SALVAR.top), a) + (y > 1.0 ? 0.008 : 0.012);
      row.push(s.point(SALVAR.cx + Math.cos(a) * r, y, SALVAR.cz + Math.sin(a) * r));
    }
    if (above) s.strip(above, row, false, awayFromAxis(SALVAR.cx, SALVAR.cz));
    above = row;
  }
  const mesh = new THREE.Mesh(s.geometry(), cloth('kusak', 0x5a1210));
  mesh.name = 'kusak';
  return mesh;
}

// ---------- Kalpak ----------
// Yukarı doğru hafif daralan, tepesi düz kürk başlık; 16 cm. Alnın ortasına iner, kulakların üstünde biter.
const KALPAK = { bottom: 1.75, height: 0.16, cx: 0, cz: -0.008 };
function buildKalpak() {
  const s = new Surface();
  const SEG = 28;
  const brim = [];
  for (let k = 0; k < SEG; k++) {
    const a = (k / SEG) * TAU;
    let r = 0; // başın kalpağın içinde kalan kısmının o yöndeki en geniş yeri
    for (let y = KALPAK.bottom - 0.005; y <= 1.81; y += 0.01) r = Math.max(r, reach(M.head, y, KALPAK.cx, KALPAK.cz, Math.cos(a), Math.sin(a)));
    brim.push(r + 0.02); // kürkün kalınlığı
  }
  // [yükseklik oranı, yarıçap çarpanı, ek yarıçap]
  const profile = [[0, 1, 0], [0.1, 1, 0.005], [0.5, 0.955, 0.005], [0.94, 0.91, 0.003], [1, 0.86, 0]];
  let previous = null;
  for (const [t, scale, extra] of profile) {
    const y = KALPAK.bottom + t * KALPAK.height;
    const ring = brim.map((r, k) => {
      const a = (k / SEG) * TAU;
      const rr = r * scale + extra;
      return s.point(KALPAK.cx + Math.cos(a) * rr, y, KALPAK.cz + Math.sin(a) * rr);
    });
    if (previous) s.strip(previous, ring, true, awayFromAxis(KALPAK.cx, KALPAK.cz));
    previous = ring;
  }
  s.fan(s.point(KALPAK.cx, KALPAK.bottom + KALPAK.height, KALPAK.cz), previous, () => [0, 1, 0]);
  const mesh = new THREE.Mesh(s.geometry(), cloth('kalpak', 0x0b0b0b));
  mesh.name = 'kalpak';
  return mesh;
}

// ---------- Cepken ----------
// Mankenin gövde ve kol yüzeyinin 1,6 cm dışında örülen kabuk; sonra cepkenin kapladığı bölge
// dışındaki her yer kesilip atılır: bel hizasının altı, dirseğin ötesi, yaka ve açık duran ön.
const CEPKEN = { hem: 1.15, sleeve: 0.47 };
function cepkenOffset(x, y, z) {
  const ax = Math.abs(x);
  // Birkaç büyük kıvrım: kolda halkalar, sırtta çapraz dalgalar; etek ucunda yok (kuşağın altına girer)
  const sleeve = S(0.24, 0.3, ax) * (0.5 + 0.5 * Math.sin(ax * 40 + 0.8));
  const back = (1 - S(0.2, 0.26, ax)) * S(-0.02, -0.08, z) * (0.5 + 0.5 * Math.sin(y * 24 + x * 7));
  // Kol ağzında mankenin kıvrık gömlek manşeti kabarır: orada biraz daha pay bırak
  return 0.016 + 0.006 * Math.max(sleeve, back) * S(1.17, 1.24, y) + 0.004 * S(0.4, 0.45, ax);
}
const cepkenField = (x, y, z) => bodyDistance(x, y, z) - cepkenOffset(x, y, z);
function inCepken(x, y, z) {
  const ax = Math.abs(x);
  if (ax > CEPKEN.sleeve || y < CEPKEN.hem || y > 1.585) return 0;
  if (y > 1.44 && Math.hypot(x, z + 0.045) < 0.1) return 0; // yaka
  if (z > -0.02 && ax < 0.06 + 0.035 * S(1.15, 1.45, y)) return 0; // önü açık
  return 1;
}

function buildCepken() {
  const { positions, indices } = meshField(cepkenField, [-0.5, 1.1, -0.2, 0.5, 1.6, 0.14], 0.022);
  sharpenBoundaries(cepkenField, inCepken, positions, indices);

  // Bölgenin dışındaki üçgenleri at, kalan köşeleri sıkıştır
  const keep = new Int32Array(positions.length / 3).fill(-1);
  const P = [];
  const I = [];
  const inside = (v) => inCepken(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]);
  for (let t = 0; t < indices.length; t += 3) {
    const tri = [indices[t], indices[t + 1], indices[t + 2]];
    if (!tri.every(inside)) continue;
    for (const v of tri) {
      if (keep[v] < 0) {
        keep[v] = P.length / 3;
        P.push(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]);
      }
      I.push(keep[v]);
    }
  }
  const body = new THREE.BufferGeometry();
  body.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  body.setIndex(I);
  body.computeVertexNormals();
  const N = body.attributes.normal.array;

  // Kenar şeridi: açık kenarlar boyunca, kumaşın 3 mm üstünde duran 1,4 cm genişliğinde koyu bant.
  // Açık kenar = yalnız bir üçgene ait kenar; içeri yön, o üçgenin üçüncü köşesine doğrudur.
  const edgeUse = new Map();
  for (let t = 0; t < I.length; t += 3) {
    for (let e = 0; e < 3; e++) {
      const a = I[t + e], b = I[t + ((e + 1) % 3)], c = I[t + ((e + 2) % 3)];
      const key = Math.min(a, b) * 100000 + Math.max(a, b);
      edgeUse.set(key, edgeUse.has(key) ? null : [a, b, c]);
    }
  }
  const inward = new Map(); // köşe -> toplam içeri yön
  const border = [];
  for (const edge of edgeUse.values()) {
    if (!edge) continue;
    const [a, b, c] = edge.map((v) => v * 3);
    const ex = P[b] - P[a], ey = P[b + 1] - P[a + 1], ez = P[b + 2] - P[a + 2];
    const len2 = ex * ex + ey * ey + ez * ez;
    const mx = (P[a] + P[b]) / 2, my = (P[a + 1] + P[b + 1]) / 2, mz = (P[a + 2] + P[b + 2]) / 2;
    let ix = P[c] - mx, iy = P[c + 1] - my, iz = P[c + 2] - mz;
    const along = (ix * ex + iy * ey + iz * ez) / len2;
    ix -= ex * along; iy -= ey * along; iz -= ez * along;
    const l = Math.hypot(ix, iy, iz) || 1;
    for (const v of [edge[0], edge[1]]) {
      const sum = inward.get(v) || [0, 0, 0];
      sum[0] += ix / l; sum[1] += iy / l; sum[2] += iz / l;
      inward.set(v, sum);
    }
    border.push(edge);
  }
  const trimP = [];
  const trimI = [];
  const outerOf = new Map();
  const innerOf = new Map();
  const lifted = (v, slide, lift) => {
    const d = inward.get(v);
    const l = Math.hypot(d[0], d[1], d[2]) || 1;
    trimP.push(P[v * 3] + (d[0] / l) * slide + N[v * 3] * lift, P[v * 3 + 1] + (d[1] / l) * slide + N[v * 3 + 1] * lift, P[v * 3 + 2] + (d[2] / l) * slide + N[v * 3 + 2] * lift);
    return trimP.length / 3 - 1;
  };
  for (const [a, b] of border) {
    for (const v of [a, b]) {
      if (!outerOf.has(v)) {
        outerOf.set(v, lifted(v, -0.001, 0.003));
        innerOf.set(v, lifted(v, 0.014, 0.004));
      }
    }
    trimI.push(outerOf.get(a), outerOf.get(b), innerOf.get(b), outerOf.get(a), innerOf.get(b), innerOf.get(a));
  }

  // Tek ağ, iki malzeme: kumaş ve kenar şeridi
  const base = P.length / 3;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([...P, ...trimP], 3));
  geometry.setIndex([...I, ...trimI.map((i) => i + base)]);
  geometry.addGroup(0, I.length, 0);
  geometry.addGroup(I.length, trimI.length, 1);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, [cloth('cepken', 0x2c1f17), cloth('cepken_serit', 0x110c09)]);
  mesh.name = 'cepken';
  return mesh;
}

export function createOutfit() {
  const root = new THREE.Group();
  root.name = 'eskiya_kiyafet';
  root.add(buildCepken(), buildKusak(), buildSalvar(), buildKalpak());
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
