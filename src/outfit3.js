import * as THREE from 'three';
import M from './manken_olcu.js';
import { meshField, sharpenBoundaries } from './isosurface.js';
import { Surface, cloth, awayFromAxis, reach, bodyDistance, sliceCenter, buildTrousers, S, clamp, TAU } from './outfit.js';
import { brass, bodyNormal, castOut, assemble } from './outfit2.js';

// 1914, Osmanlı piyade erinin üniforması; manken_erkek.glb'nin üstüne oturur (ölçüler
// manken_olcu.js'ten). Dört parça: ceket, palaska, salvar, dolak_potin. Başlık (fes) ayrı dosyada.
// Mankenle aynı konum ve T duruşu: 1 birim = 1 metre, Y yukarı, yüz +Z'ye bakar; mankenin sağı -X,
// solu +X. Yalnız dış yüzeyler; hiçbir şey taşınmaz ya da ölçeklenmez.
//
// Katmanlar içten dışa: pantolon, ceket (eteği pantolonun belini örter), palaska (ceketin üstünde).

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const KHAKI = 0x5b5139;

// Yüzeyin üstünde duran küçük yuvarlak düğme: c merkez, n dışa bakan yön.
export function button(s, c, n, radius = 0.009) {
  const u = (Math.abs(n.x) < 0.9 ? v3(1, 0, 0) : v3(0, 1, 0)).addScaledVector(n, -(Math.abs(n.x) < 0.9 ? n.x : n.y)).normalize();
  const w = n.clone().cross(u);
  const ring = (r, lift) => Array.from({ length: 8 }, (_, k) => {
    const p = c.clone().addScaledVector(u, Math.cos((k / 8) * TAU) * r).addScaledVector(w, Math.sin((k / 8) * TAU) * r).addScaledVector(n, lift);
    return s.point(p.x, p.y, p.z);
  });
  const base = ring(radius, -0.001), rim = ring(radius * 0.85, 0.003);
  s.strip(base, rim, true, (x, y, z) => [x - c.x, y - c.y, z - c.z]);
  const top = c.clone().addScaledVector(n, 0.0045);
  s.fan(s.point(top.x, top.y, top.z), rim, () => n.toArray());
}
// Nokta ızgarasından yama (cep, apolet): rows[j][i] noktaları; yüzler outward yönüne bakar.
export function patchOf(s, rows, outward) {
  const ids = rows.map((row) => row.map((p) => s.point(p.x, p.y, p.z)));
  for (let j = 1; j < ids.length; j++) s.strip(ids[j - 1], ids[j], false, outward);
}
// center'da, eksenleri (right, up, out) olan kutunun arka yüzü dışındaki beş yüzü.
function boxOn(s, center, right, up, out, w, h, d) {
  const corner = (a, b, c) => {
    const p = center.clone().addScaledVector(right, (a * w) / 2).addScaledVector(up, (b * h) / 2).addScaledVector(out, c * d);
    return s.point(p.x, p.y, p.z);
  };
  const back = [corner(-1, -1, 0), corner(1, -1, 0), corner(1, 1, 0), corner(-1, 1, 0)];
  const front = [corner(-1, -1, 1), corner(1, -1, 1), corner(1, 1, 1), corner(-1, 1, 1)];
  const middle = center.clone().addScaledVector(out, d / 2);
  s.strip(back, front, true, (x, y, z) => [x - middle.x, y - middle.y, z - middle.z]);
  const start = s.indices.length;
  s.indices.push(front[0], front[1], front[2], front[0], front[2], front[3]);
  s.orient(start, () => out.toArray());
}

// Ağın birbirine bağlı parçalarından yalnız en büyüğünü bırakır.
function keepLargestPiece(s) {
  const parent = Array.from({ length: s.positions.length / 3 }, (_, i) => i);
  const find = (i) => {
    while (parent[i] !== i) i = parent[i] = parent[parent[i]];
    return i;
  };
  for (let t = 0; t < s.indices.length; t += 3) {
    parent[find(s.indices[t])] = find(s.indices[t + 1]);
    parent[find(s.indices[t + 1])] = find(s.indices[t + 2]);
  }
  const size = new Map();
  for (let t = 0; t < s.indices.length; t += 3) size.set(find(s.indices[t]), (size.get(find(s.indices[t])) || 0) + 1);
  const biggest = [...size.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const kept = [];
  const remap = new Map();
  const positions = [];
  for (let t = 0; t < s.indices.length; t += 3) {
    if (find(s.indices[t]) !== biggest) continue;
    for (let k = 0; k < 3; k++) {
      const v = s.indices[t + k];
      if (!remap.has(v)) {
        remap.set(v, positions.length / 3);
        positions.push(s.positions[v * 3], s.positions[v * 3 + 1], s.positions[v * 3 + 2]);
      }
      kept.push(remap.get(v));
    }
  }
  s.positions = positions;
  s.indices = kept;
  return size.size - 1; // atılan parça sayısı
}

// ---------- Ceket ----------
// Belden yukarısı mankenin gövde ve boyun yüzeyinin 1,3 cm dışında örülen kabuk ile düz kol
// borularının birleşimidir; belden
// aşağı etek, kalça kesitlerini saran halkalardır. İkisinin birleştiği yer palaskanın altında kalır.
export const CEKET = { waist: 1.085, hem: 0.93, cuff: 0.715, collar: 1.6, cx: 0, cz: -0.03 };
const ceketOffset = () => 0.013;
// Kol: mankenin gömleği omuzda ve dirsekte kabarıktır; ceketin kolu bu kabarıklıkları izlemez,
// omuzdan bileğe düz incelen tek bir borudur. Borunun yarıçapı, kol ekseni boyunca ölçülen
// (manken + pay) yarıçaplarının üstünden geçen en dar dışbükey çizgidir: her yerde mankenin dışında.
export const ARM = { y: 1.451, z: -0.074, from: 0.2, to: 0.72 }; // mankenin çıplak kolunun ekseni
// Kol dar ve düzdür: bilekte mankenin ön kolunu 1,2 cm payla sarar, omuza doğru hafifçe kalınlaşır.
// Mankenin kabarık gömlek kolu bundan geniştir; ceket onu izlemez (gömlek kolu ceketin içinde
// kalmaz, mankenle birlikte gösterilirse yer yer dışarı taşar).
// Ölçü mankenin çıplak kolundan alındı: dirsekte (x 0,44–0,52) eksenden en çok 5,4 cm, bilekte
// 3,5 cm. Kol omuzdan dirseğe aynı kalınlıkta gider, dirsekten bileğe düz incelir.
const sleeveR = (ax) => 0.068 - 0.022 * clamp((ax - 0.5) / (ARM.to - 0.5), 0, 1);
const sleeve = { ry: sleeveR, rz: sleeveR };
function ceketField(x, y, z) {
  const ax = Math.abs(x);
  // Omuzdan öteye gövde kabuğu geri çekilir: kol yalnız borudan oluşur
  const body = bodyDistance(x, y, z) - ceketOffset() + 0.08 * S(0.2, 0.34, ax);
  if (ax < ARM.from || ax > ARM.to + 0.04) return ax < ARM.from ? body : 1;
  const ry = sleeve.ry(Math.min(ax, ARM.to)), rz = sleeve.rz(Math.min(ax, ARM.to));
  const tube = (Math.hypot((y - ARM.y) / ry, (z - ARM.z) / rz) - 1) * Math.min(ry, rz);
  // Yumuşak birleşim: kol gövdeye omuzda keskin bir kenar yapmadan bağlanır
  const k = 0.03, t = Math.max(k - Math.abs(body - tube), 0) / k;
  return Math.min(body, tube) - t * t * k * 0.25;
}
// origin'den dir yönünde giderken ceketin yüzeyinin lift kadar dışına çıkılan ilk nokta.
export function castToCeket(origin, dir, lift) {
  let r0 = 0;
  for (let r = 0.01; r < 0.7; r += 0.005) {
    const p = origin.clone().addScaledVector(dir, r);
    if (ceketField(p.x, p.y, p.z) > lift) {
      let lo = r0, hi = r;
      for (let i = 0; i < 12; i++) {
        const m = (lo + hi) / 2;
        const q = origin.clone().addScaledVector(dir, m);
        if (ceketField(q.x, q.y, q.z) > lift) hi = m;
        else lo = m;
      }
      return origin.clone().addScaledVector(dir, hi);
    }
    r0 = r;
  }
  return null;
}
function inCeket(x, y, z) {
  if (Math.abs(x) > CEKET.cuff || y < CEKET.waist) return 0;
  const neck = Math.hypot(x, z + 0.045) < 0.11;
  // Dik yaka boynu sarar: arkada ve yanlarda 1,6'ya çıkar, önde çenenin altında 3 cm alçalır
  if (neck) return y < CEKET.collar - collarDrop * S(0, 0.04, z) ? 1 : 0;
  if (z > 0.03 && Math.abs(x) < 0.11 && y > 1.555) return 0; // çene ve gıdı açıkta
  return y < 1.59 ? 1 : 0;
}
// Eteğin, orta eksenden a yönündeki yarıçapı (pantolonun dışında kalacak kadar pay ile).
export function skirtRadius(y, a, gap) {
  let r = 0;
  for (let d = -0.02; d <= 0.0201; d += 0.02) r = Math.max(r, reach(M.body, y + d, CEKET.cx, CEKET.cz, Math.cos(a), Math.sin(a)));
  return r + gap + 0.004 * Math.max(0, Math.cos(5 * a + 0.4)) ** 2 * S(1.06, 0.96, y); // birkaç dikey kıvrım
}
// Ceketin göğüs yüzeyinde, (x, y) hizasında, kumaşın lift kadar üstünde nokta.
export function onChest(x, y, lift) {
  return castToCeket(v3(x, y, -0.03), v3(0, 0, 1), lift);
}
// Ceketin kumaşı: gövde kabuğu, düz kollar ve etek. skirt: [yükseklik, pay] satırları.
const SKIRT = [[1.1, 0.018], [1.06, 0.019], [1.01, 0.02], [0.965, 0.021], [CEKET.hem, 0.022], [CEKET.hem - 0.003, 0.017]];
let collarDrop = 0.03; // yakanın önde, çenenin altında ne kadar alçaldığı
export function jacketFabric(skirt = SKIRT, frontDrop = 0.03) {
  collarDrop = frontDrop;
  const { positions, indices } = meshField(ceketField, [-0.75, 1.03, -0.2, 0.75, 1.615, 0.14], 0.026);
  sharpenBoundaries(ceketField, inCeket, positions, indices);
  const keep = new Int32Array(positions.length / 3).fill(-1);
  const fabric = new Surface();
  const inside = (v) => inCeket(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]);
  for (let t = 0; t < indices.length; t += 3) {
    const tri = [indices[t], indices[t + 1], indices[t + 2]];
    if (!tri.every(inside)) continue;
    for (const v of tri) {
      if (keep[v] < 0) keep[v] = fabric.point(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]);
      fabric.indices.push(keep[v]);
    }
  }
  // Ölçü ızgarası bileğin içinde küçük bir boşluk görür; yüzey örücü orada, kolun içinde kapalı
  // bir kabarcık üretir. Ceket tek parçadır: en büyük bağlı parça dışındaki her şey atılır.
  keepLargestPiece(fabric);
  // Etek: belden kalçanın üstüne; aşağı doğru hafif açılır, ucunda içe dönen ince bir kenar
  const SEG = 40;
  let previous = null;
  for (const [y, gap] of skirt) {
    const ring = Array.from({ length: SEG }, (_, k) => {
      const a = (k / SEG) * TAU;
      const r = skirtRadius(y, a, gap);
      return fabric.point(CEKET.cx + Math.cos(a) * r, y, CEKET.cz + Math.sin(a) * r);
    });
    if (previous) fabric.strip(previous, ring, true, awayFromAxis(CEKET.cx, CEKET.cz));
    previous = ring;
  }
  return fabric;
}
function buildCeket() {
  const fabric = jacketFabric();

  const metal = new Surface(), trim = new Surface();
  // Altı pirinç düğme: boyundan etek ucuna, önde orta çizgide (beşi belin üstünde, biri etekte)
  for (const y of [1.505, 1.42, 1.335, 1.25, 1.165]) {
    const c = onChest(0, y, 0);
    button(metal, c, bodyNormal(c));
  }
  button(metal, v3(0, 0.99, CEKET.cz + skirtRadius(0.99, Math.PI / 2, 0.0205)), v3(0, 0, 1));

  for (const side of [-1, 1]) {
    // Göğüs cebi: kumaşın üstünde hafif kabarık yama, üstünde sivri uçlu kapak ve düğmesi
    const cx = side * 0.097;
    const cols = [-0.055, -0.0275, 0, 0.0275, 0.055];
    const front = () => [0, 0, 1];
    patchOf(trim, [1.428, 1.395, 1.36, 1.325, 1.3].map((y) => cols.map((dx) => onChest(cx + dx, y, 0.004))), front);
    patchOf(trim, [[1.432, 0], [1.41, 0], [1.392, 1]].map(([y, point]) => cols.map((dx) => onChest(cx + dx * 1.04, y - point * 0.012 * (1 - Math.abs(dx) / 0.055), 0.008))), front);
    const c = onChest(cx, 1.4, 0.008);
    button(metal, c, bodyNormal(c), 0.006);

    // Apolet: omzun üstünde, yakadan kola uzanan düz şerit; yaka ucunda düğmesi
    const up = () => [0, 1, 0];
    const strap = (x, z, lift) => castToCeket(v3(x, 1.4, z), v3(0, 1, 0), lift);
    patchOf(trim, [-0.022, 0, 0.022].map((dz) => [0.1, 0.125, 0.15, 0.175, 0.195].map((x) => strap(side * x, -0.055 + dz, 0.005))), up);
    const e = strap(side * 0.112, -0.055, 0.005);
    button(metal, e, v3(0, 1, 0), 0.006);

    // Kol ağzındaki dikiş çizgisi: bileğin biraz gerisinde kolu dolanan ince şerit
    const rings = [0.662, 0.67].map((x) => Array.from({ length: 16 }, (_, k) => {
      const a = (k / 16) * TAU;
      const origin = v3(side * x, ARM.y, ARM.z);
      const p = castToCeket(origin, v3(0, Math.cos(a), Math.sin(a)), 0.003);
      return trim.point(p.x, p.y, p.z);
    }));
    trim.strip(rings[0], rings[1], true, (x, y, z) => [0, y - ARM.y, z - ARM.z]);
  }
  return assemble('ceket', [[fabric, cloth('ceket', KHAKI)], [trim, cloth('ceket_cep_apolet', 0x4f462f)], [metal, brass()]]);
}

// ---------- Palaska ----------
// Ceketin üstünde, bel hizasında 5 cm'lik deri kemer; önde pirinç toka, iki yanında ikişer fişek
// kesesi, sol kalçada kemere asılı süngü kını.
const BELT = { bottom: 1.065, width: 0.05, cx: 0, cz: -0.03, gap: 0.03 };
function beltRadius(a) {
  let r = 0;
  for (let y = BELT.bottom - 0.02; y <= BELT.bottom + BELT.width + 0.0201; y += 0.02) r = Math.max(r, reach(M.body, y, BELT.cx, BELT.cz, Math.cos(a), Math.sin(a)));
  return r + BELT.gap;
}
function buildPalaska() {
  const leather = new Surface(), metal = new Surface();
  const SEG = 40;
  const at = (a, r, y) => v3(BELT.cx + Math.cos(a) * r, y, BELT.cz + Math.sin(a) * r);
  let previous = null;
  for (const [h, extra] of [[-0.002, -0.005], [0, 0], [BELT.width, 0], [BELT.width + 0.002, -0.005]]) {
    const ring = Array.from({ length: SEG }, (_, k) => {
      const p = at((k / SEG) * TAU, beltRadius((k / SEG) * TAU) + extra, BELT.bottom + h);
      return leather.point(p.x, p.y, p.z);
    });
    if (previous) leather.strip(previous, ring, true, awayFromAxis(BELT.cx, BELT.cz));
    previous = ring;
  }
  const mid = BELT.bottom + BELT.width / 2;
  const up = v3(0, 1, 0);
  // Kemer üzerinde, önden (a = PI/2) yay boyunca distance kadar ötedeki açı (artı: mankenin soluna doğru)
  const angleAt = (distance) => {
    let a = Math.PI / 2, travelled = 0;
    const step = -Math.sign(distance) * 0.004;
    while (travelled < Math.abs(distance)) {
      const p = at(a, beltRadius(a), mid), q = at(a + step, beltRadius(a + step), mid);
      travelled += p.distanceTo(q);
      a += step;
    }
    return a;
  };
  const frame = (a) => ({ out: v3(Math.cos(a), 0, Math.sin(a)), right: v3(Math.sin(a), 0, -Math.cos(a)), p: at(a, beltRadius(a), mid) });

  // Toka: önde ortada dikdörtgen pirinç levha
  const b = frame(Math.PI / 2);
  boxOn(metal, b.p, b.right, up, b.out, 0.055, 0.045, 0.006);
  // Dört fişek kesesi: 9 x 8 x 4 cm kutu, üstünde öne taşan kapağı ve kapak düğmesi
  for (const d of [-0.185, -0.083, 0.083, 0.185]) {
    const f = frame(angleAt(d));
    const c = f.p.clone().addScaledVector(f.out, -0.002);
    boxOn(leather, c, f.right, up, f.out, 0.09, 0.08, 0.04);
    boxOn(leather, c.clone().add(v3(0, 0.028, 0)), f.right, up, f.out, 0.094, 0.03, 0.044);
    button(metal, c.clone().add(v3(0, 0.018, 0)).addScaledVector(f.out, 0.044), f.out, 0.005);
  }
  // Süngü kını: sol kalçada, kemerden aşağı 35 cm; ucu hafif arkaya yatık, ucunda pirinç başlık
  const a = -0.12;
  let r = 0;
  for (let y = 0.74; y <= 1.1; y += 0.02) r = Math.max(r, reach(M.body, y, BELT.cx, BELT.cz, Math.cos(a), Math.sin(a)));
  const hang = (t) => at(a, r + 0.048, BELT.bottom + 0.01 - 0.35 * t).add(v3(0, 0, -0.035 * t));
  const out = v3(Math.cos(a), 0, Math.sin(a));
  const section = (s, [t, half, thick]) => {
    const c = hang(t);
    const tangent = hang(Math.min(1, t + 0.01)).sub(hang(Math.max(0, t - 0.01))).normalize();
    const sideways = tangent.clone().cross(out).normalize();
    return {
      c, tangent,
      ring: Array.from({ length: 8 }, (_, k) => {
        const p = c.clone().addScaledVector(sideways, Math.cos((k / 8) * TAU) * half).addScaledVector(out, Math.sin((k / 8) * TAU) * thick);
        return s.point(p.x, p.y, p.z);
      }),
    };
  };
  const loft = (s, list, capStart, capEnd) => {
    let before = null;
    list.forEach((item, i) => {
      const now = section(s, item);
      if (before) s.strip(before.ring, now.ring, true, (x, y, z) => v3(x, y, z).sub(now.c).toArray());
      if ((i === 0 && capStart) || (i === list.length - 1 && capEnd)) {
        const start = s.indices.length;
        for (let k = 1; k < 7; k++) s.indices.push(now.ring[0], now.ring[k], now.ring[k + 1]);
        s.orient(start, () => now.tangent.clone().multiplyScalar(i === 0 ? -1 : 1).toArray());
      }
      before = now;
    });
  };
  // [boy boyunca konum, yarı en, yarı kalınlık]: askı, kın gövdesi, uç başlığı
  loft(leather, [[0, 0.021, 0.011], [0.13, 0.021, 0.011], [0.15, 0.016, 0.008], [0.9, 0.011, 0.006]], true, false);
  loft(metal, [[0.9, 0.0115, 0.0065], [0.97, 0.008, 0.005], [1, 0.004, 0.003]], false, true);
  return assemble('palaska', [[leather, cloth('palaska_deri', 0x33221a)], [metal, brass()]]);
}

// ---------- Şalvar (asker pantolonu) ----------
// Düz kesim, vücuda oturan pantolon; beli ceketin eteğinin, paçası dolağın altında kalır.
const PANTOLON = {
  name: 'salvar', color: 0x4a412d, top: 1.04, crotch: 0.84, cx: 0, cz: -0.04,
  ease: [[0.455, 0.008], [0.5, 0.009], [0.56, 0.01], [0.66, 0.011], [0.76, 0.012], [0.96, 0.015], [1.0, 0.013], [1.04, 0.013]],
  legRows: [0.455, 0.48, 0.51, 0.54, 0.585, 0.64, 0.7, 0.755, 0.8, 0.84],
  hipRows: [0.88, 0.92, 0.96, 0.98, 1.0, 1.02, 1.04],
  legFold: 0.002, hipFold: 0.002,
};

// ---------- Dolak ve potin ----------
// Dizin altından ayak tabanına tek parça: baldırda yatay şeritler halinde sarılı kumaş dolak, ayakta
// bilekte biten, bağcıklı, kalın tabanlı kısa potin. Mankenin çizmesini en az 1 cm payla içine alır.
const DOLAK = { top: 0.475, ankle: 0.14, band: 0.036 };
function buildDolakPotin() {
  const wrap = new Surface(), boot = new Surface(), lace = new Surface();
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
          const x = side * Math.max(Math.min(0.006, innerX - 0.002), side * (cx + dx * r)); // iki bacak değmesin
          return s.point(x, y + tilt * Math.sin(a + 0.8), cz + dz * r);
        }),
      };
    };
    const join = (s, a, b) => s.strip(a.ids, b.ids, true, awayFromAxis(b.cx, b.cz));

    // Potin: kalın taban (kenarı dışa taşar), üstünde bileğe kadar deri saya
    const rows = [[0, 0.024], [0.026, 0.024], [0.028, 0.016], [0.05, 0.016], [0.08, 0.016], [0.11, 0.016], [DOLAK.ankle, 0.017], [DOLAK.ankle + 0.004, 0.013]].map(([y, gap]) => ring(boot, y, gap));
    for (let j = 1; j < rows.length; j++) join(boot, rows[j - 1], rows[j]);
    // Bağcıklar: ayağın üstünde, önde, yatay kısa şeritler
    for (const y of [0.068, 0.088, 0.108, 0.128]) {
      const [cx, cz] = sliceCenter(table, y);
      const z = cz + reach(table, y, cx, cz, 0, 1) + 0.016 + 0.003;
      const quad = [[-0.017, -0.003], [0.017, -0.003], [0.017, 0.003], [-0.017, 0.003]].map(([dx, dy]) => lace.point(cx + dx, y + dy, z - 0.004 * (Math.abs(dx) / 0.017) ** 2));
      const start = lace.indices.length;
      lace.indices.push(quad[0], quad[1], quad[2], quad[0], quad[2], quad[3]);
      lace.orient(start, () => [0, 0.3, 1]);
    }
    // Dolak: üst üste binen yatay sarımlar; her sarımın alt kenarı kalın, üstü bir sonrakinin altına girer
    const pay = (y) => 0.013 + 0.005 * S(0.42, 0.46, y); // dizin altında pantolonun paçasını da örter
    let previous = null;
    for (let y = DOLAK.ankle + 0.004; y < DOLAK.top - 0.005; y += DOLAK.band) {
      const y1 = Math.min(DOLAK.top, y + DOLAK.band);
      const lower = ring(wrap, y, pay(y) + 0.004, 0.005), upper = ring(wrap, y1, pay(y1), 0.005);
      if (previous) join(wrap, previous, lower); // sarımlar arasındaki basamak
      join(wrap, lower, upper);
      previous = upper;
    }
  }
  return assemble('dolak_potin', [[wrap, cloth('dolak', 0x6b6a58)], [boot, cloth('potin', 0x1f1a16)], [lace, cloth('potin_bagcik', 0x0e0c0a)]]);
}

export function createSoldierOutfit() {
  const root = new THREE.Group();
  root.name = 'asker_kiyafet';
  root.add(buildCeket(), buildPalaska(), buildTrousers(PANTOLON), buildDolakPotin());
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
