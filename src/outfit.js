import * as THREE from 'three';
import M from './manken_olcu.js';
import { meshField, sharpenBoundaries } from './isosurface.js';

// 1914, Anadolu'da bir yol eşkıyasının kıyafeti: cepken, kuşak, şalvar ve iki başlık seçeneği
// (takke ya da sarıklı takke).
// Parçalar manken_erkek.glb'nin üstüne oturur; ölçüler manken_olcu.js'ten gelir (mankenin kendisi
// burada yoktur). Mankenle aynı konum ve duruş: 1 birim = 1 metre, Y yukarı, yüz +Z'ye bakar.
// Yalnız dış yüzeyler modellenir; hiçbir parça taşınmaz, döndürülmez, ölçeklenmez.

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const S = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const TAU = Math.PI * 2;

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
// Bacak tabloları ilk ölçümde 0,36'dan başlıyordu, sonra ayak tabanına kadar uzatıldı. Dilim
// numarası hâlâ 0,36'ya göre hesaplanır: aksi halde yuvarlama farkı tam dilim sınırındaki
// yüksekliklerde başka dilimi seçer ve daha önce üretilmiş parçalar milimetre oynar.
M.legRight.anchor = M.legLeft.anchor = 0.36;
// [dilim konumu (çıpaya göre, kesirli), çıpanın tablodaki dilim numarası]; ikisi ayrı tutulur ki
// toplama, kesrin son basamağını yutmasın
function slicePosition(table, y) {
  const anchor = table.anchor ?? table.y0;
  return [(y - anchor) / table.dy, Math.round((anchor - table.y0) / table.dy)];
}
// y yüksekliğinde mankenin o yöndeki en dış noktası: komşu iki dilimin büyüğü (asla içeride kalmaz).
export function reach(table, y, cx, cz, dx, dz) {
  const [f, first] = slicePosition(table, y);
  const last = table.hulls.length - 1;
  const a = clamp(Math.floor(f) + first, 0, last), b = clamp(Math.ceil(f) + first, 0, last);
  return Math.max(hullRadius(table.hulls[a], cx, cz, dx, dz), hullRadius(table.hulls[b], cx, cz, dx, dz));
}

// Gövde ve kolların çevresindeki işaretli uzaklık (dışarısı artı); ızgaradan üç doğrusal okunur.
const GRID = M.grid;
const cells = Uint8Array.from(atob(GRID.data), (c) => c.charCodeAt(0));
export function bodyDistance(x, y, z) {
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

export class Surface {
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
export const cloth = (name, color) => new THREE.MeshStandardMaterial({ name, color, roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
export const awayFromAxis = (cx, cz) => (x, y, z) => [x - cx, 0, z - cz];

// ---------- Şalvar ----------
// Vücuda oturan, hafif bol pantolon: mankenin kendi pantolonunun 0,5–2,5 cm dışında. Kalçada ve
// uylukta hafif bolluk, dizden aşağı daralır ve çizmenin ağzında biter. İki bacak ayrıdır; ağ
// sarkmaz, yalnız iki paçayı birleştiren düz bir dikiş vardır.
const SALVAR = {
  name: 'salvar', color: 0x1b1b1d, top: 1.08, crotch: 0.84, hem: 0.452, cx: 0, cz: -0.04,
  // [yükseklik, mankenden pay]: çizmenin ağzında dar, uylukta ve kalçada biraz bol, belde kuşağın altına girer
  ease: [[0.452, 0.006], [0.47, 0.009], [0.5, 0.012], [0.56, 0.014], [0.66, 0.016], [0.76, 0.02], [0.96, 0.02], [1.0, 0.015], [1.08, 0.015]],
  legRows: [0.452, 0.47, 0.5, 0.54, 0.585, 0.64, 0.7, 0.755, 0.8, 0.84],
  hipRows: [0.88, 0.92, 0.96, 0.98, 1.0, 1.04, 1.08],
  legFold: 0.005, hipFold: 0.004, // dikey kıvrımların derinliği
};
function easeAt(table, y) {
  for (let i = 1; i < table.length; i++) {
    if (y <= table[i][0]) return table[i - 1][1] + ((table[i][1] - table[i - 1][1]) * (y - table[i - 1][0])) / (table[i][0] - table[i - 1][0]);
  }
  return table[table.length - 1][1];
}
// Kesitin ağırlık merkezi: bacak halkaları bunun çevresine kurulur (uyluk ve baldır aynı eksende değil).
export function sliceCenter(table, y) {
  const [f, first] = slicePosition(table, y);
  const hull = table.hulls[clamp(Math.round(f) + first, 0, table.hulls.length - 1)];
  let x = 0, z = 0;
  for (let i = 0; i < hull.length; i += 2) {
    x += hull[i];
    z += hull[i + 1];
  }
  return [x / (hull.length / 2), z / (hull.length / 2)];
}

// Pantolon kurucusu: iki ayrı bacak, düz ağ dikişi, kalçadan bele tek gövde. Ölçüler o'dan gelir.
export function buildTrousers(o = SALVAR) {
  const ease = (y) => easeAt(o.ease, y);
  const s = new Surface();
  const N = 20; // bacak halkasındaki köşe sayısı; 7..13 arası köşeler öbür bacağa bakar
  const INNER = [7, 13];
  const legRows = o.legRows;
  const top = {}; // her bacağın en üst halkası
  for (const side of [1, -1]) {
    const table = side > 0 ? M.legRight : M.legLeft;
    let previous = null;
    for (const y of legRows) {
      const [cx, cz] = sliceCenter(table, y);
      const innerX = Math.abs(cx) - reach(table, y, cx, cz, -side, 0); // mankenin bacağının orta düzleme uzaklığı
      const ring = [];
      for (let i = 0; i < N; i++) {
        const a = (i / N) * TAU;
        const dx = side * Math.cos(a), dz = Math.sin(a);
        const outer = (1 + Math.cos(a)) / 2; // dış yanda 1, iki bacağın arasında 0
        // Üç dikey kıvrım: dış yanda belirgin, bacak arasında yok
        const fold = o.legFold * Math.max(0, Math.cos(3 * a + 0.6)) ** 2 * (0.3 + 0.7 * outer) * S(0.49, 0.58, y);
        const r = reach(table, y, cx, cz, dx, dz) + ease(y) + fold;
        // İki bacak birbirine değmesin: iç yan orta düzlemden 6 mm beride kalır; mankenin bacakları
        // buna yer bırakmayacak kadar yakınsa (kasığa doğru) pay 2 mm'ye kadar iner
        const x = side * Math.max(Math.min(0.006, innerX - 0.002), side * (cx + dx * r));
        ring.push(s.point(x, y, cz + dz * r));
      }
      if (previous) s.strip(previous, ring, true, awayFromAxis(cx, cz));
      previous = ring;
    }
    top[side] = previous;
  }

  // Ağ dikişi: iki bacağın birbirine bakan yaylarını birleştiren düz, dar şerit
  const inner = (ring) => ring.slice(INNER[0], INNER[1] + 1);
  const R = inner(top[1]), L = inner(top[-1]);
  const P = s.positions;
  const mid = R.map((r, m) => s.point((P[r * 3] + P[L[m] * 3]) / 2, o.crotch, (P[r * 3 + 2] + P[L[m] * 3 + 2]) / 2));
  s.strip(R, mid, false, () => [0, -1, 0]);
  s.strip(mid, L, false, () => [0, -1, 0]);

  // Kalça: en alt halkası iki bacağın dış yaylarıdır (arada ön ve arka ara köşeler); bele kadar çıkar
  const outerArc = [];
  for (let i = INNER[1]; i !== INNER[0]; i = (i + 1) % N) outerArc.push(i);
  outerArc.push(INNER[0]);
  const between = (a, m, b) => {
    const at = (t, u, v) => s.point(P[u * 3] + (P[v * 3] - P[u * 3]) * t, P[u * 3 + 1], P[u * 3 + 2] + (P[v * 3 + 2] - P[u * 3 + 2]) * t);
    return [at(0.5, a, m), m, at(0.5, m, b)];
  };
  const front = between(top[1][INNER[0]], mid[0], top[-1][INNER[0]]);
  const back = between(top[-1][INNER[1]], mid[mid.length - 1], top[1][INNER[1]]);
  const base = [...outerArc.map((i) => top[1][i]), ...front, ...[...outerArc].reverse().map((i) => top[-1][i]), ...back];
  const angles = base.map((v) => Math.atan2(P[v * 3 + 2] - o.cz, P[v * 3] - o.cx));
  let previous = base;
  for (const y of o.hipRows) {
    const ring = angles.map((a) => {
      const fold = o.hipFold * Math.max(0, Math.cos(5 * a + 0.4)) ** 2 * (1 - S(0.94, 1.0, y)); // kuşağın altında kıvrım yok
      const r = reach(M.body, y, o.cx, o.cz, Math.cos(a), Math.sin(a)) + ease(y) + fold;
      return s.point(o.cx + Math.cos(a) * r, y, o.cz + Math.sin(a) * r);
    });
    s.strip(previous, ring, true, awayFromAxis(o.cx, o.cz));
    previous = ring;
  }
  const mesh = new THREE.Mesh(s.geometry(), cloth(o.name, o.color));
  mesh.name = o.name;
  return mesh;
}

// ---------- Kuşak ----------
// Bele üç kat sarılmış 18 cm yüksekliğinde sargı; şalvarın üst, cepkenin alt kenarını örter.
// Bir ucu sol yanda (mankenin solu = +X) 25 cm sarkar.
// Sarkan uç, bu parça ilk yapıldığındaki bol şalvarın yüzeyine göre biçimlendi ve öyle bırakıldı:
const DRAPE = { top: 1.08, cx: 0, cz: -0.04 };
const BAG = [[0.52, 0.02], [0.55, 0.03], [0.6, 0.05], [0.67, 0.06], [0.75, 0.068], [0.83, 0.07], [0.9, 0.06], [0.945, 0.035], [0.972, 0.003], [1.08, 0]]; // kuşağın altında bolluk yok
function bagginess(y) {
  for (let i = 1; i < BAG.length; i++) {
    if (y <= BAG[i][0]) return BAG[i - 1][1] + ((BAG[i][1] - BAG[i - 1][1]) * (y - BAG[i - 1][0])) / (BAG[i][0] - BAG[i - 1][0]);
  }
  return 0;
}
// Sarkan ucun, orta eksenden angle yönündeki uzaklığı: manken + 1,5 cm + bolluk (altı büyük kıvrımla).
function drapeRadius(y, angle) {
  const folds = 1 + 0.28 * Math.cos(6 * angle + 0.7) * (1 - S(0.9, 1.0, y));
  return reach(M.body, y, DRAPE.cx, DRAPE.cz, Math.cos(angle), Math.sin(angle)) + 0.015 + bagginess(y) * folds;
}

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
      const r = drapeRadius(Math.min(y, DRAPE.top), a) + (y > 1.0 ? 0.008 : 0.012);
      row.push(s.point(DRAPE.cx + Math.cos(a) * r, y, DRAPE.cz + Math.sin(a) * r));
    }
    if (above) s.strip(above, row, false, awayFromAxis(DRAPE.cx, DRAPE.cz));
    above = row;
  }
  const mesh = new THREE.Mesh(s.geometry(), cloth('kusak', 0x5a1210));
  mesh.name = 'kusak';
  return mesh;
}

// ---------- Takke ----------
// Başa tam oturan, örme, yuvarlak ve alçak başlık; başın yüzeyinden 0,5–1 cm dışarıda. Kenarı önde
// alnın üst kısmında, yanlarda kulakların hemen üstünde, arkada ense çukurunun üstünde biter.
const HEAD = M.head;
// Başın, y yüksekliğinde angle yönündeki en dış noktası. Dilimler ve açılar arasında yumuşak
// geçer (ölçü tablosu komşu açıların büyüğünü tuttuğu için sonuç yine güvenli taraftadır).
export function headRadius(y, angle) {
  const n = HEAD.radii[0].length;
  const last = HEAD.radii.length - 1;
  const f = clamp((y - HEAD.y0) / HEAD.dy, 0, last);
  const j = Math.min(Math.floor(f), last - 1);
  const g = ((((angle % TAU) + TAU) % TAU) / TAU) * n - 0.5;
  const k0 = ((Math.floor(g) % n) + n) % n, k1 = (k0 + 1) % n;
  const t = g - Math.floor(g);
  const at = (row) => HEAD.radii[row][k0] + (HEAD.radii[row][k1] - HEAD.radii[row][k0]) * t;
  return at(j) + (at(j + 1) - at(j)) * (f - j);
}
const TAKKE = { front: 1.765, side: 1.735, back: 1.678, apex: 1.838, band: 0.02, seam: 0.6 };
function takkeRim(angle) {
  const s = Math.sin(angle); // +1 ön, -1 arka
  if (s >= 0) return TAKKE.side + (TAKKE.front - TAKKE.side) * S(0.2, 0.9, s);
  return TAKKE.side + (TAKKE.back - TAKKE.side) * S(0.55, 1.0, -s); // kulağın arkasına kadar düz, sonra enseye iner
}
// Referanstaki gibi: kenarda koyu işlemeli bant, üstünde büzgülü krem bezden dolgun yanlar, tepede
// dikişle ayrılan tepelik ve ortasında küçük düğüm. İşlemenin motifleri yok (doku kullanılmıyor):
// bant tek renk, iki kenarında ince şerit. Bant başa oturur; bez yukarı doğru baştan uzaklaşıp
// kubbe yapar (tepede başın yaklaşık 3 cm üstünde).
function buildTakke() {
  const SEG = 48;
  const PLEATS = 24; // büzgü sayısı: her ikinci köşe dışarıda
  const BAND = 0.0075, FABRIC = 0.0045, PLEAT = 0.006, PIPING = 0.0015;
  const s = new Surface();
  const groups = [[], [], []]; // bez, bant, şerit ve düğüm
  const head = (y, a) => (y > HEAD.y0 + HEAD.dy * (HEAD.radii.length - 1) + 0.002 ? 0 : headRadius(y, a));
  // Bant satırı: kenardan up kadar yukarıda, baştan gap kadar dışarıda
  const bandRing = (up, gap) => Array.from({ length: SEG }, (_, k) => {
    const a = (k / SEG) * TAU;
    const y = takkeRim(a) + up;
    const r = head(y, a) + gap;
    return s.point(HEAD.cx + Math.cos(a) * r, y, HEAD.cz + Math.sin(a) * r);
  });
  // Bez satırı: bandın üstünden (t = 0) tepeye (t = 1) uzanan kubbe profili; hiçbir yerde başın
  // FABRIC kadar dışından içeri girmez. pleat: büzgü derinliği
  const clothRing = (t, pleat) => Array.from({ length: SEG }, (_, k) => {
    const a = (k / SEG) * TAU;
    const y0 = takkeRim(a) + TAKKE.band;
    const r0 = head(y0, a) + FABRIC + 0.002;
    const y = y0 + (TAKKE.apex - y0) * Math.sin((t * Math.PI) / 2) ** 0.9;
    const dome = r0 * Math.cos((t * Math.PI) / 2) ** 0.5;
    const r = Math.max(dome, head(y, a) + FABRIC) + (k % (SEG / PLEATS) === 0 ? pleat : 0);
    return s.point(HEAD.cx + Math.cos(a) * r, y, HEAD.cz + Math.sin(a) * r);
  });
  const join = (group, a, b) => {
    const start = s.indices.length;
    s.strip(a, b, true, awayFromAxis(HEAD.cx, HEAD.cz));
    groups[group].push(...s.indices.splice(start));
  };

  // Bant: iki kenarında ince şerit, arası düz
  const edge = 0.003;
  join(2, bandRing(0, BAND + PIPING), bandRing(edge, BAND + PIPING));
  join(1, bandRing(edge, BAND), bandRing(TAKKE.band - edge, BAND));
  join(2, bandRing(TAKKE.band - edge, BAND + PIPING), bandRing(TAKKE.band, BAND + PIPING));
  // Büzgülü yanlar: banttan tepelik dikişine kadar dikey kıvrımlar; dikişe doğru derinleşir
  const side = [[0, 0.002], [0.15, 0.004], [0.3, PLEAT], [0.45, PLEAT], [TAKKE.seam, PLEAT]].map(([t, p]) => clothRing(t, p));
  for (let j = 1; j < side.length; j++) join(0, side[j - 1], side[j]);
  // Tepelik: dikişte büzgülerin üstüne binen düz kenar, sonra yuvarlak tepe
  const crown = [clothRing(TAKKE.seam, PLEAT + 0.002), clothRing(TAKKE.seam + 0.03, 0.003), ...[0.72, 0.82, 0.91, 0.97].map((t) => clothRing(t, 0))];
  for (let j = 1; j < crown.length; j++) join(0, crown[j - 1], crown[j]);
  let start = s.indices.length;
  s.fan(s.point(HEAD.cx, TAKKE.apex, HEAD.cz), crown[crown.length - 1], () => [0, 1, 0]);
  groups[0].push(...s.indices.splice(start));
  // Tepedeki küçük düğüm
  const knot = Array.from({ length: 6 }, (_, k) => s.point(HEAD.cx + Math.cos((k / 6) * TAU) * 0.006, TAKKE.apex + 0.0005, HEAD.cz + Math.sin((k / 6) * TAU) * 0.006));
  start = s.indices.length;
  s.fan(s.point(HEAD.cx, TAKKE.apex + 0.006, HEAD.cz), knot, () => [0, 1, 0]);
  groups[2].push(...s.indices.splice(start));

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(s.positions, 3));
  geometry.setIndex(groups.flat());
  let offset = 0;
  groups.forEach((g, i) => {
    geometry.addGroup(offset, g.length, i);
    offset += g.length;
  });
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, [cloth('takke', 0xb9ae93), cloth('takke_bant', 0x2e1216), cloth('takke_serit', 0x6e2a33)]);
  mesh.name = 'takke';
  return mesh;
}

// ---------- Sarıklı takke ----------
// İkinci başlık seçeneği (takke ile aynı yerde durur; ikisi birlikte giyilmez): üstü yuvarlak
// tepeli kahverengi keçe külah, altında koyu renkli kumaştan çapraz sarılmış kalın sargı.
const KULAH = { center: [HEAD.cx, 1.733, HEAD.cz], tilt: 0.1, wrap: 0.055, height: 0.15 };
function buildSarikliTakke() {
  const SEG = 32;
  const C = new THREE.Vector3(...KULAH.center);
  const axis = new THREE.Vector3(0, 1, -KULAH.tilt).normalize(); // hafifçe arkaya yatık
  // Alt kenar: yatık düzlemin başı kestiği çizgi; düzgün bir oval olacak kadar yumuşatılır ve
  // hiçbir yerde başın içine girmeyecek kadar genişletilir
  const raw = [];
  for (let k = 0; k < SEG; k++) {
    const a = (k / SEG) * TAU;
    let r = 0.09;
    for (let it = 0; it < 4; it++) r = headRadius(C.y + KULAH.tilt * r * Math.sin(a), a) + 0.006;
    raw.push(r);
  }
  const smooth = raw.map((_, k) => [-2, -1, 0, 1, 2].reduce((sum, d) => sum + raw[(k + d + SEG) % SEG], 0) / 5);
  const widen = Math.max(...raw.map((r, k) => r - smooth[k]));
  const spoke = smooth.map((r, k) => {
    const a = (k / SEG) * TAU;
    return new THREE.Vector3(Math.cos(a) * (r + widen), KULAH.tilt * (r + widen) * Math.sin(a), Math.sin(a) * (r + widen));
  });
  const s = new Surface();
  const groups = [[], [], []]; // külah, sargının iki rengi
  // Eksen boyunca h yükseklikte, alt kenarın scale katı genişlikte, extra kadar dışarıda halka
  const ring = (h, scale, extra) => spoke.map((v, k) => {
    const p = C.clone().addScaledVector(axis, h).addScaledVector(v, scale).addScaledVector(v.clone().normalize(), extra(k));
    return s.point(p.x, p.y, p.z);
  });
  const outward = (x, y, z) => {
    const d = new THREE.Vector3(x, y, z).sub(C);
    return d.addScaledVector(axis, -d.dot(axis)).toArray();
  };
  // Sargı: ortası kabarık kalın bir rulo; çapraz kıvrımlar ve çapraz dönen iki renk
  const wrapRows = [0, 0.14, 0.34, 0.6, 0.84, 1].map((t) => ring(t * KULAH.wrap, 1, (k) => 0.004 + 0.015 * Math.sin(Math.PI * t) ** 0.7 + 0.003 * Math.sin(5 * (k / SEG) * TAU + t * 5) * Math.sin(Math.PI * t)));
  for (let j = 1; j < wrapRows.length; j++) {
    for (let k = 0; k < SEG; k++) {
      const k1 = (k + 1) % SEG;
      const start = s.indices.length;
      s.indices.push(wrapRows[j - 1][k], wrapRows[j - 1][k1], wrapRows[j][k1], wrapRows[j - 1][k], wrapRows[j][k1], wrapRows[j][k]);
      s.orient(start, outward);
      groups[1 + (Math.floor((k + j * 1.5) / 4) % 2)].push(...s.indices.splice(start));
    }
  }
  // Külah: sargının içinden çıkar, yukarı doğru hafif daralır, tepesi yuvarlak
  const cap = [[KULAH.wrap - 0.005, 1], [0.1, 0.93], [0.13, 0.8], [0.146, 0.55]].map(([h, scale]) => ring(h, scale, () => 0));
  for (let j = 1; j < cap.length; j++) {
    const start = s.indices.length;
    s.strip(cap[j - 1], cap[j], true, outward);
    groups[0].push(...s.indices.splice(start));
  }
  const start = s.indices.length;
  const apex = C.clone().addScaledVector(axis, KULAH.height);
  s.fan(s.point(apex.x, apex.y, apex.z), cap[cap.length - 1], () => axis.toArray());
  groups[0].push(...s.indices.splice(start));

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(s.positions, 3));
  geometry.setIndex(groups.flat());
  let offset = 0;
  groups.forEach((g, i) => {
    geometry.addGroup(offset, g.length, i);
    offset += g.length;
  });
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, [cloth('kulah', 0x4a3222), cloth('sarik_lacivert', 0x191d28), cloth('sarik_visne', 0x3a1519)]);
  mesh.name = 'sarikli_takke';
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
  root.add(buildCepken(), buildKusak(), buildTrousers(), buildTakke(), buildSarikliTakke());
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
