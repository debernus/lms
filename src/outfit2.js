import * as THREE from 'three';
import M from './manken_olcu.js';
import { meshField, sharpenBoundaries } from './isosurface.js';
import { Surface, cloth, awayFromAxis, reach, bodyDistance, sliceCenter, buildTrousers, S, clamp, TAU } from './outfit.js';

// 1900'lerin başı, Osmanlı Anadolu'sunda bir dağ eşkıyasının (efe) kıyafeti; manken_erkek.glb'nin
// üstüne oturur (ölçüler manken_olcu.js'ten). Beş parça: ceket, fiseklik, kusak, salvar,
// dolak_carik. (Başlık ve yatağan istek üzerine çıkarıldı.) Mankenle aynı konum ve T duruşu: 1 birim = 1 metre, Y yukarı, yüz +Z'ye
// bakar; mankenin sağı -X, solu +X. Yalnız dış yüzeyler; hiçbir şey taşınmaz ya da ölçeklenmez.
//
// Katmanlar içten dışa: ceket ve şalvar (mankenden 1–2 cm), fişeklik kayışları (2,3 ve 2,9 cm),
// kuşak (belde hepsinin üstünde).

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const brass = () => new THREE.MeshStandardMaterial({ name: 'pirinc', color: 0x8f7a3a, roughness: 0.85, metalness: 0.6 });

// Gövde yüzeyinin dışa bakan yönü (uzaklık alanının eğimi).
export function bodyNormal(p) {
  const e = 0.004;
  return v3(
    bodyDistance(p.x + e, p.y, p.z) - bodyDistance(p.x - e, p.y, p.z),
    bodyDistance(p.x, p.y + e, p.z) - bodyDistance(p.x, p.y - e, p.z),
    bodyDistance(p.x, p.y, p.z + e) - bodyDistance(p.x, p.y, p.z - e),
  ).normalize();
}
// Noktayı gövdeden tam offset kadar uzağa oturtur.
export function settle(p, offset) {
  for (let i = 0; i < 4; i++) p.addScaledVector(bodyNormal(p), offset - bodyDistance(p.x, p.y, p.z));
  return p;
}
// origin'den dir yönünde giderken gövdeden offset kadar uzaklaşılan ilk nokta.
export function castOut(origin, dir, offset) {
  let r0 = 0;
  for (let r = 0.01; r < 0.7; r += 0.005) {
    const p = origin.clone().addScaledVector(dir, r);
    if (bodyDistance(p.x, p.y, p.z) > offset) {
      let lo = r0, hi = r;
      for (let i = 0; i < 12; i++) {
        const m = (lo + hi) / 2;
        const q = origin.clone().addScaledVector(dir, m);
        if (bodyDistance(q.x, q.y, q.z) > offset) hi = m;
        else lo = m;
      }
      return origin.clone().addScaledVector(dir, hi);
    }
    r0 = r;
  }
  return null;
}

// Birden çok malzemeli ağ: parts = [[Surface ya da {positions, indices}, malzeme], ...]
export function assemble(name, parts) {
  const positions = [];
  const indices = [];
  const geometry = new THREE.BufferGeometry();
  parts.forEach(([s], i) => {
    const base = positions.length / 3;
    geometry.addGroup(indices.length, s.indices.length, i);
    positions.push(...s.positions);
    for (const k of s.indices) indices.push(k + base);
  });
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, parts.map(([, material]) => material));
  mesh.name = name;
  return mesh;
}

// center'da, axis boyunca uzanan sekiz kenarlı silindir (fişek). Uç kapakları ayrı köşelerle: kenar keskin kalır.
function cartridge(s, center, axis, length = 0.05, radius = 0.005) {
  const a = axis.clone().normalize();
  const u = (Math.abs(a.y) < 0.9 ? v3(0, 1, 0) : v3(1, 0, 0)).cross(a).normalize();
  const w = a.clone().cross(u);
  const ring = (h) => Array.from({ length: 8 }, (_, k) => {
    const p = center.clone().addScaledVector(a, h).addScaledVector(u, Math.cos((k / 8) * TAU) * radius).addScaledVector(w, Math.sin((k / 8) * TAU) * radius);
    return s.point(p.x, p.y, p.z);
  });
  const c = center;
  s.strip(ring(-length / 2), ring(length / 2), true, (x, y, z) => {
    const d = v3(x, y, z).sub(c);
    return d.addScaledVector(a, -d.dot(a)).toArray();
  });
  for (const side of [-1, 1]) {
    const cap = ring((side * length) / 2);
    const start = s.indices.length;
    for (let k = 1; k < 7; k++) s.indices.push(cap[0], cap[k], cap[k + 1]);
    s.orient(start, () => a.clone().multiplyScalar(side).toArray());
  }
}

// ---------- Ceket ----------
// Vücuda oturan kısa yün ceket: önü kapalı ve düğmeli, alçak dik yaka, bileğe inen dar kollar.
// Mankenin gövde, kol ve boyun yüzeyinin 1,3 cm dışında örülen kabuktan kesilir.
const CEKET = { hem: 1.15, cuff: 0.715, collar: 1.558 };
function ceketOffset(x, y, z) {
  const ax = Math.abs(x);
  // Kolda birkaç geniş kıvrım; mankenin kıvrık gömlek manşeti (dirsekte) kabardığı için orada biraz pay
  const sleeve = S(0.26, 0.32, ax) * (0.5 + 0.5 * Math.sin(ax * 34 + 0.5));
  // Önde orta çizgide mankenin gömleğinin kopçaları çıkıntı yapar: orada biraz daha pay
  const placket = 0.006 * (1 - S(0.03, 0.055, ax)) * S(0, 0.03, z);
  return 0.013 + 0.004 * sleeve * S(1.17, 1.24, y) + 0.004 * S(0.4, 0.45, ax) * (1 - S(0.53, 0.57, ax)) + placket;
}
const ceketField = (x, y, z) => bodyDistance(x, y, z) - ceketOffset(x, y, z);
function inCeket(x, y, z) {
  if (Math.abs(x) > CEKET.cuff || y < CEKET.hem || y > 1.59) return 0;
  // Yakanın üstü: boyun ve baş açıkta (önde çene de boynun hizasından taşar)
  // Yaka arkada ve yanlarda dik durur, önde alçalır: mankenin gömlek yakası oradan görünür
  const collar = CEKET.collar - 0.055 * S(-0.03, 0.03, z);
  if (y > collar && (Math.hypot(x, z + 0.045) < 0.11 || (z > 0 && Math.abs(x) < 0.11))) return 0;
  return 1;
}
function buildCeket() {
  const { positions, indices } = meshField(ceketField, [-0.75, 1.1, -0.2, 0.75, 1.6, 0.14], 0.024);
  sharpenBoundaries(ceketField, inCeket, positions, indices);
  // Bölgenin dışındaki üçgenleri at, kalan köşeleri sıkıştır
  const keep = new Int32Array(positions.length / 3).fill(-1);
  const fabric = { positions: [], indices: [] };
  const inside = (v) => inCeket(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]);
  for (let t = 0; t < indices.length; t += 3) {
    const tri = [indices[t], indices[t + 1], indices[t + 2]];
    if (!tri.every(inside)) continue;
    for (const v of tri) {
      if (keep[v] < 0) {
        keep[v] = fabric.positions.length / 3;
        fabric.positions.push(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]);
      }
      fabric.indices.push(keep[v]);
    }
  }
  // Düğmeler: önde, orta çizgide yukarıdan aşağı yedi düğme; her biri kumaşın üstünde alçak bir kubbe
  const buttons = new Surface();
  for (let i = 0; i < 7; i++) {
    const y = 1.5 - i * 0.052;
    const c = castOut(v3(0, y, -0.03), v3(0, 0, 1), ceketOffset(0, y, 0.1));
    const n = bodyNormal(c);
    const u = v3(1, 0, 0).addScaledVector(n, -n.x).normalize();
    const w = n.clone().cross(u);
    const ring = (radius, lift) => Array.from({ length: 8 }, (_, k) => {
      const p = c.clone().addScaledVector(u, Math.cos((k / 8) * TAU) * radius).addScaledVector(w, Math.sin((k / 8) * TAU) * radius).addScaledVector(n, lift);
      return buttons.point(p.x, p.y, p.z);
    });
    const base = ring(0.0095, -0.001), rim = ring(0.008, 0.003);
    buttons.strip(base, rim, true, (x, yy, z) => [x - c.x, yy - c.y, z - c.z]);
    const top = c.clone().addScaledVector(n, 0.0045);
    buttons.fan(buttons.point(top.x, top.y, top.z), rim, () => n.toArray());
  }
  return assemble('ceket', [[fabric, cloth('ceket', 0x14171d)], [buttons, cloth('ceket_dugme', 0x3b3428)]]);
}

// ---------- Fişeklik ----------
// Göğüste çaprazlanan iki mermi kemeri. Her biri gövdeyi dolanan kapalı bir halkadır: bir omuzdan
// karşı kalçaya iner, sırttan aynı omuza döner; ikisi önde ve arkada X yapar. 6 cm eninde deri
// kayışın ön yüzünde, kayışa dik duran pirinç fişekler dizilidir.
const STRAP = { width: 0.06, pitch: 0.0155, bottom: 1.215 };
function buildFiseklik() {
  const leather = new Surface();
  const shells = new Surface();
  // side = 1: sağ omuzdan (-X) sol kalçaya (+X); altta kalan kayış. side = -1: öteki, üstte.
  for (const [side, offset] of [[1, 0.023], [-1, 0.029]]) {
    const shoulder = v3(-side * 0.135, 1.53, -0.045), hip = v3(side * 0.165, 1.14, -0.03);
    const along = hip.clone().sub(shoulder).normalize(); // omuzdan kalçaya
    const depth = v3(0, 0, 1);
    const across = along.clone().cross(depth).normalize(); // kayışın eni bu yönde: halkanın düzlemine dik
    const center = shoulder.clone().lerp(hip, 0.5);
    const K = 72;
    const rows = [];
    for (let k = 0; k < K; k++) {
      const phi = (k / K) * TAU; // 0: kalça, PI/2: ön, PI: omuz, 3PI/2: sırt
      const dir = along.clone().multiplyScalar(Math.cos(phi)).addScaledVector(depth, Math.sin(phi));
      const mid = castOut(center, dir, offset);
      const edges = [-1, 1].map((e) => settle(mid.clone().addScaledVector(across, (e * STRAP.width) / 2), offset));
      rows.push({ phi, mid, points: [edges[0], mid, edges[1]] });
    }
    const index = rows.map((r) => r.points.map((p) => leather.point(p.x, p.y, p.z)));
    for (let c = 0; c < 2; c++) {
      leather.strip(index.map((r) => r[c]), index.map((r) => r[c + 1]), true, (x, y, z) => [x - center.x, y - center.y, z - center.z]);
    }
    // Fişekler: ön yayda, omuzdan aşağı kuşağın üstüne kadar; her biri kayışın enine uzanır
    const front = rows.filter((r) => r.phi > 0.05 && r.phi < Math.PI * 0.99).reverse(); // omuzdan kalçaya
    let travelled = 0, next = 0.012;
    for (let i = 1; i < front.length; i++) {
      const a = front[i - 1].mid, b = front[i].mid;
      const seg = a.distanceTo(b);
      while (next <= travelled + seg) {
        const p = a.clone().lerp(b, (next - travelled) / seg);
        next += STRAP.pitch;
        if (p.y < STRAP.bottom) continue; // aşağısı kuşağın altında kalır
        if (side > 0 && Math.abs(p.x) < 0.05) continue; // öteki kayış buradan üstten geçer
        const n = bodyNormal(p);
        const axis = across.clone().addScaledVector(n, -across.dot(n));
        cartridge(shells, p.clone().addScaledVector(n, 0.0065), axis);
      }
      travelled += seg;
    }
  }
  return assemble('fiseklik', [[leather, cloth('fiseklik_deri', 0x3a2618)], [shells, brass()]]);
}

// ---------- Kuşak (silahlık) ----------
// 20 cm yüksekliğinde: alt yarısı kalın deri kemer (üstünde bir sıra fişek), üst yarısı sarılmış
// kumaş. Ceketin eteğini, şalvarın belini ve fişekliklerin kalçaya inen uçlarını dıştan örter.
const KUSAK = { bottom: 0.98, height: 0.2, cx: 0, cz: -0.01, gap: 0.034 };
function kusakRadius(y, a) {
  let r = 0; // sargının kapladığı yükseklik boyunca mankenin en geniş yeri
  for (let d = -0.02; d <= 0.0201; d += 0.02) r = Math.max(r, reach(M.body, clamp(y, KUSAK.bottom, KUSAK.bottom + KUSAK.height) + d, KUSAK.cx, KUSAK.cz, Math.cos(a), Math.sin(a)));
  return r + KUSAK.gap;
}
function buildKusak() {
  const SEG = 40;
  const band = (s, rows) => {
    let previous = null;
    for (const [h, extra] of rows) {
      const ring = Array.from({ length: SEG }, (_, k) => {
        const a = (k / SEG) * TAU;
        const r = kusakRadius(KUSAK.bottom + h, a) + extra;
        return s.point(KUSAK.cx + Math.cos(a) * r, KUSAK.bottom + h, KUSAK.cz + Math.sin(a) * r);
      });
      if (previous) s.strip(previous, ring, true, awayFromAxis(KUSAK.cx, KUSAK.cz));
      previous = ring;
    }
    return s;
  };
  const belt = band(new Surface(), [[-0.003, -0.004], [0, 0.004], [0.1, 0.004], [0.103, -0.002]]);
  const sash = band(new Surface(), [[0.1, 0], [0.125, 0.007], [0.15, 0.001], [0.175, 0.007], [0.2, 0.001], [0.203, -0.006]]);

  // Kemerin üstündeki fişekler: önde ve yanlarda, dik durur
  const shells = new Surface();
  const y = KUSAK.bottom + 0.05;
  let a = -0.25;
  while (a < Math.PI + 0.25) {
    const r = kusakRadius(y, a) + 0.004 + 0.0062;
    const p = v3(KUSAK.cx + Math.cos(a) * r, y, KUSAK.cz + Math.sin(a) * r);
    cartridge(shells, p, v3(0, 1, 0));
    a += 0.02 / r;
  }
  return assemble('kusak', [[sash, cloth('kusak_kumas', 0x4a1218)], [belt, cloth('kusak_deri', 0x33221a)], [shells, brass()]]);
}

// ---------- Şalvar (potur) ----------
// Dar, vücuda oturan pantolon; mankenin pantolonunun 0,6–1,6 cm dışında. Paçası dolağın içine girer.
const POTUR = {
  name: 'salvar', color: 0x3a332c, top: 1.08, crotch: 0.84, cx: 0, cz: -0.04,
  ease: [[0.455, 0.006], [0.5, 0.008], [0.56, 0.01], [0.66, 0.011], [0.76, 0.012], [0.96, 0.015], [1.0, 0.013], [1.08, 0.013]],
  legRows: [0.455, 0.48, 0.51, 0.54, 0.585, 0.64, 0.7, 0.755, 0.8, 0.84],
  hipRows: [0.88, 0.92, 0.96, 0.98, 1.0, 1.04, 1.08],
  legFold: 0.002, hipFold: 0.003,
};

// ---------- Dolak ve çarık ----------
// Dizin altından ayak tabanına tek parça: baldırda yatay şeritler halinde sarılı yün dolak, ayakta
// burnu hafif kalkık alçak deri çarık. Mankenin çizmesini her yerinden en az 1 cm payla içine alır.
const DOLAK = { top: 0.475, ankle: 0.09, band: 0.032 };
function buildDolakCarik() {
  const wrap = new Surface(), shoe = new Surface();
  const N = 24;
  for (const side of [1, -1]) {
    const table = side > 0 ? M.legRight : M.legLeft;
    // y yüksekliğinde, çizmeden gap kadar dışarıda halka; tilt sarımı hafif çapraz gösterir
    const ring = (s, y, gap, tilt = 0) => {
      const [cx, cz] = sliceCenter(table, y);
      // Çizmenin orta düzleme en yakın noktası (bu yükseklikteki iki komşu dilimin en içtekisi)
      let innerX = Infinity;
      for (const d of [-0.01, 0.01]) {
        const hull = table.hulls[clamp(Math.round((y + d) / table.dy), 0, table.hulls.length - 1)];
        for (let i = 0; i < hull.length; i += 2) innerX = Math.min(innerX, side * hull[i]);
      }
      return {
        cx, cz,
        ids: Array.from({ length: N }, (_, i) => {
          const a = (i / N) * TAU;
          const dx = side * Math.cos(a), dz = Math.sin(a);
          const r = reach(table, y, cx, cz, dx, dz) + gap;
          // İki bacak birbirine değmesin (pantolon paçasındaki kuralın aynısı)
          const x = side * Math.max(Math.min(0.006, innerX - 0.002), side * (cx + dx * r));
          return s.point(x, y + tilt * Math.sin(a + 0.8), cz + dz * r);
        }),
      };
    };
    const join = (s, a, b) => s.strip(a.ids, b.ids, true, awayFromAxis(b.cx, b.cz));

    // Çarık: tabandan bileğe; üst kenarı dolağın üstüne hafifçe biner
    const shoeRows = [0, 0.015, 0.03, 0.05, 0.07, DOLAK.ankle].map((y) => ring(shoe, y, 0.016));
    for (let j = 1; j < shoeRows.length; j++) join(shoe, shoeRows[j - 1], shoeRows[j]);
    join(shoe, shoeRows[shoeRows.length - 1], ring(shoe, DOLAK.ankle + 0.004, 0.013));
    // Kalkık burun: ayağın en ön noktasından yukarı ve geriye kıvrılan küçük sivri uç
    const [fx, fz] = sliceCenter(table, 0.04);
    const toe = fz + reach(table, 0.04, fx, fz, 0, 1) + 0.016;
    const horn = [[0.04, 0.016, 0.012], [0.064, 0.02, 0.008], [0.082, 0.016, 0.004]].map(([y, dz, r]) =>
      Array.from({ length: 6 }, (_, k) => shoe.point(fx + Math.cos((k / 6) * TAU) * r, y + Math.sin((k / 6) * TAU) * r * 0.5, toe + dz - 0.012 + Math.sin((k / 6) * TAU) * r * 0.7)),
    );
    const hornOut = (x, y, z) => [x - fx, 0.3, z - (toe - 0.02)];
    shoe.strip(horn[0], horn[1], true, hornOut);
    shoe.strip(horn[1], horn[2], true, hornOut);
    shoe.fan(shoe.point(fx, 0.094, toe + 0.0), horn[2], () => [0, 1, -0.5]);

    // Dolak: üst üste binen yatay sarımlar; her sarımın alt kenarı kalın, üstü bir sonrakinin altına girer
    const pay = (y) => 0.013 + 0.005 * S(0.42, 0.46, y); // dizin altında şalvarın paçasını da örter
    let previous = null;
    for (let y = DOLAK.ankle + 0.004; y < DOLAK.top - 0.005; y += DOLAK.band) {
      const y1 = Math.min(DOLAK.top, y + DOLAK.band);
      const lower = ring(wrap, y, pay(y) + 0.004, 0.005), upper = ring(wrap, y1, pay(y1), 0.005);
      if (previous) join(wrap, previous, lower); // sarımlar arasındaki basamak
      join(wrap, lower, upper);
      previous = upper;
    }
  }
  return assemble('dolak_carik', [[wrap, cloth('dolak', 0x857860)], [shoe, cloth('carik', 0x6b4a2e)]]);
}

export function createOutfit2() {
  const root = new THREE.Group();
  root.name = 'eskiya2_kiyafet';
  root.add(buildCeket(), buildFiseklik(), buildKusak(), buildTrousers(POTUR), buildDolakCarik());
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
