import * as THREE from 'three';
import M from './manken_olcu.js';
import { Surface, cloth, bodyDistance, reach, sliceCenter, buildTrousers, S, TAU } from './outfit.js';
import { bodyNormal, castOut, settle } from './outfit2.js';
import { jacketFabric, collarTop, button, patchOf, castToCeket, onChest, skirtRadius, ARM, CEKET } from './outfit3.js';
import { buildAyakkabi } from './outfit5.js';
import { canvasTexture, build, robe } from './halk2.js';
import { buildNisanKusagi, buildKemer } from './pasa.js';

// Sırma işlemeli Osmanlı devlet üniforması (vezir / sadrazam tören kıyafeti), 1900'lerin başı.
// Parçalar: ceket, sirma_isleme, nisan_kusagi, nisanlar, kemer, salvar, pantolon_seridi, ayakkabi.
// Kılıç yok. manken_erkek.glb'nin üstüne oturur (gömleksiz kopyayla); konum ve ölçek mankenle aynı.

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const HEM = 0.56; // etek ucu: dizin hemen üstü
const BLACK = 0x121214;

// Sırma nakış: siyah zemin üstünde kıvrık dallar ve yapraklar (her yönde döşenebilir)
function embroidery(ground = '#141414', name = 'sirma_nakis') {
  const map = canvasTexture(name, 512, 512, (g) => {
    let seed = 77;
    const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    g.fillStyle = ground;
    g.fillRect(0, 0, 512, 512);
    g.lineCap = 'round';
    const leaf = (x, y, a, len) => {
      g.save();
      g.translate(x, y);
      g.rotate(a);
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(len * 0.5, -len * 0.32, len, 0);
      g.quadraticCurveTo(len * 0.5, len * 0.32, 0, 0);
      g.fill();
      g.restore();
    };
    for (let cy = 0; cy < 4; cy++) for (let cx = 0; cx < 4; cx++) {
      const x0 = cx * 128 + 64 + (cy % 2) * 30, y0 = cy * 128 + 64, dir = (cx + cy) % 2 ? 1 : -1, start = rand() * 6.28;
      for (const [ox, oy] of [[0, 0], [512, 0], [-512, 0], [0, 512], [0, -512]]) {
        // Sarmal dal
        g.strokeStyle = '#b08a34';
        g.lineWidth = 7;
        g.beginPath();
        for (let t = 0; t <= 1.001; t += 0.04) {
          const a = start + dir * t * 7.5, r = 8 + 50 * t;
          g.lineTo(x0 + ox + Math.cos(a) * r, y0 + oy + Math.sin(a) * r);
        }
        g.stroke();
        // Dal boyunca yapraklar
        for (let k = 0; k < 7; k++) {
          const t = 0.25 + k * 0.11, a = start + dir * t * 7.5, r = 8 + 50 * t;
          g.fillStyle = k % 2 ? '#c9a548' : '#8f6d26';
          leaf(x0 + ox + Math.cos(a) * r, y0 + oy + Math.sin(a) * r, a + dir * 0.9, 26 + 10 * rand());
        }
        g.fillStyle = '#d6b65a';
        g.beginPath();
        g.arc(x0 + ox + Math.cos(start) * 8, y0 + oy + Math.sin(start) * 8, 7, 0, 6.3);
        g.fill();
      }
    }
  });
  return new THREE.MeshStandardMaterial({ name, map, roughness: 0.5, metalness: 0.55, side: THREE.DoubleSide });
}

// Pantolon (dış yanında sırma şerit) ve ayakkabı: iki üst için ortak
function addLower(root, color = BLACK, gold = embroidery) {
  // --- Pantolon: siyah, dış yanında sırma şerit ---
  const EASE = [[0.075, 0.022], [0.2, 0.018], [0.4, 0.016], [0.5, 0.012], [0.66, 0.011], [0.76, 0.012], [0.96, 0.015], [1.0, 0.013], [1.04, 0.013]];
  root.add(buildTrousers({
    name: 'salvar', color, top: 1.04, crotch: 0.84, cx: 0, cz: -0.04, ease: EASE,
    legRows: [0.075, 0.078, 0.13, 0.2, 0.28, 0.36, 0.43, 0.48, 0.52, 0.56, 0.6, 0.65, 0.7, 0.755, 0.8, 0.84],
    hipRows: [0.88, 0.92, 0.96, 0.98, 1.0, 1.02, 1.04], legFold: 0.002, hipFold: 0.002,
  }));
  const stripe = new Surface();
  for (const side of [1, -1]) {
    const table = side > 0 ? M.legRight : M.legLeft;
    const rows = [];
    for (let y = 0.08; y <= 0.6; y += 0.04) {
      const [cx, cz] = sliceCenter(table, y);
      rows.push([-0.2, 0, 0.2].map((da) => {
        const dx = side * Math.cos(da), dz = Math.sin(da), r = reach(table, y, cx, cz, dx, dz) + 0.03;
        return v3(cx + dx * r, y, cz + dz * r);
      }));
    }
    patchOf(stripe, rows, () => [side, 0, 0]);
  }
  root.add(build('pantolon_seridi', [[stripe, gold(), (x, y, z) => [z * 5, y * 5]]]));
  root.add(buildAyakkabi());
}

export function createSirmaliUniforma() {
  const root = new THREE.Group();
  root.name = 'sirmali_uniforma';

  // --- Ceket: dize inen siyah redingot, dik yaka ---
  const fabric = jacketFabric(
    [[1.1, 0.018], [1.06, 0.019], [1.01, 0.02], [0.965, 0.021], [0.9, 0.024], [0.8, 0.029], [0.7, 0.034], [HEM, 0.04], [HEM - 0.003, 0.035]],
    { drop: 0.045, from: -0.03, to: 0.05 },
  );
  root.add(build('ceket', [[fabric, cloth('ceket', BLACK), null]]));

  // --- Sırma işleme: göğüste iki geniş pano, ön kenar boyunca etek ucuna inen şerit, yaka, kol kapakları ---
  const trim = new Surface();
  const front = () => [0, 0, 1];
  const onSkirt = (x, y, lift) => {
    let a = Math.PI / 2;
    for (let i = 0; i < 4; i++) a = Math.acos(Math.max(-1, Math.min(1, x / skirtRadius(y, a, 0.02))));
    const r = skirtRadius(y, a, 0.019 + 0.021 * S(1.06, HEM, y) + lift);
    return v3(CEKET.cx + Math.cos(a) * r, y, CEKET.cz + Math.sin(a) * r);
  };
  for (const side of [-1, 1]) {
    // Göğüs panosu: omuzda geniş, bele doğru daralır
    const rows = [];
    for (let y = 1.53; y > 1.115; y -= 0.03) {
      const wide = 0.055 + 0.125 * S(1.12, 1.5, y);
      rows.push([0, 0.25, 0.5, 0.75, 1].map((t) => onChest(side * (0.012 + (wide - 0.012) * t), y, 0.0025)));
    }
    patchOf(trim, rows, front);
    patchOf(trim, [1.04, 0.96, 0.88, 0.8, 0.72, 0.64, HEM + 0.005].map((y) => [0.012, 0.035, 0.058].map((x) => onSkirt(side * x, y, 0.006))), front);
    // Kol kapağı: bilekte geniş bant, üst kenarı kolun üstünde dirseğe doğru sivrilir
    const ring = (x, peak) => Array.from({ length: 16 }, (_, k) => {
      const a = (k / 16) * TAU;
      const p = castToCeket(v3(side * (x - peak * Math.max(0, Math.cos(a)) ** 3), ARM.y, ARM.z), v3(0, Math.cos(a), Math.sin(a)), 0.003);
      return trim.point(p.x, p.y, p.z);
    });
    const away = (x, y, z) => [0, y - ARM.y, z - ARM.z];
    const cuff = [ring(0.58, 0.08), ring(0.645, 0.035), ring(0.713, 0)];
    trim.strip(cuff[0], cuff[1], true, away);
    trim.strip(cuff[1], cuff[2], true, away);
  }
  const NECK = v3(0, 0, -0.045);
  const band = [0.002, 0.036].map((below) => Array.from({ length: 24 }, (_, k) => {
    const dir = v3(Math.cos((k / 24) * TAU), 0, Math.sin((k / 24) * TAU));
    let p = castToCeket(v3(0, 1.57, NECK.z), dir, 0.003);
    for (let i = 0; i < 3; i++) p = castToCeket(v3(0, collarTop(p.z) - below, NECK.z), dir, 0.003);
    return trim.point(p.x, p.y, p.z);
  }));
  trim.strip(band[0], band[1], true, (x, y, z) => [x, 0, z - NECK.z]);
  const uv = (x, y, z) => (Math.abs(x) > 0.3 ? [(Math.atan2(y - ARM.y, z - ARM.z) / TAU) * 2, x * 5] : [x * 5 + z * 2, y * 5]);
  root.add(build('sirma_isleme', [[trim, embroidery(), uv]]));

  // --- Kırmızı nişan kuşağı (sağ omuzdan sol kalçaya), gümüş kemer ---
  root.add(buildNisanKusagi(0x8a1a1c));
  root.add(buildKemer(new THREE.MeshStandardMaterial({ name: 'kemer_gumus', color: 0x8d8c84, roughness: 0.5, metalness: 0.6, side: THREE.DoubleSide })));

  // --- Nişanlar: sol göğüste iki gümüş yıldız ---
  const silver = new Surface(), centre = new Surface();
  for (const [x, y, radius] of [[0.105, 1.445, 0.03], [0.125, 1.365, 0.033]]) {
    const c = onChest(x, y, 0.009), n = bodyNormal(c);
    const u = v3(1, 0, 0).addScaledVector(n, -n.x).normalize(), w = n.clone().cross(u);
    const pts = Array.from({ length: 16 }, (_, k) => {
      const a = (k / 16) * TAU, r = k % 2 ? radius * 0.55 : radius;
      const p = c.clone().addScaledVector(u, Math.cos(a) * r).addScaledVector(w, Math.sin(a) * r);
      return silver.point(p.x, p.y, p.z);
    });
    const tip = c.clone().addScaledVector(n, 0.008);
    silver.fan(silver.point(tip.x, tip.y, tip.z), pts, () => n.toArray());
    button(centre, c.clone().addScaledVector(n, 0.007), n, radius * 0.3);
  }
  root.add(build('nisanlar', [
    [silver, new THREE.MeshStandardMaterial({ name: 'gumus', color: 0xa3a39c, roughness: 0.4, metalness: 0.8, side: THREE.DoubleSide }), null],
    [centre, new THREE.MeshStandardMaterial({ name: 'nisan_gobegi', color: 0x8c1c1c, roughness: 0.5, metalness: 0.3 }), null],
  ]));

  addLower(root);
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}

// Alternatif: aynı üniformanın bedene yapışmayan, bol kesim hali. Önü baştan sona kapalı, dik yakalı,
// düğmeli; gövdeden 4 cm açıkta durur, kolları geniştir. Kuşak ve kemer ceketin üstündedir.
export function createSirmaliCeket() {
  const root = new THREE.Group();
  root.name = 'sirmali_ceket';
  const GREEN = 0x16301f, gold = () => embroidery('#1a3a25', 'sirma_nakis_yesil');
  const OFFSET = 0.04, CHEM = 0.58, SLEEVE = 0.088, NECK = { z: -0.045, hole: 0.16 };
  const ROWS = [[1.1, 0.05], [1.04, 0.053], [0.96, 0.058], [0.86, 0.064], [0.74, 0.07], [CHEM, 0.076], [CHEM - 0.003, 0.07]];
  // Gövde kabuğu boynun çevresinde geniş bir daire olarak kesilir; aradaki bölüm aşağıda düzgün
  // halkalarla örülür (omuz parçası) ve boğazda dar, tam yuvarlak bir dik yakayla biter.
  const shell = robe({
    offset: OFFSET, sleeveDrop: 0.012, sleeve: () => SLEEVE,
    inside: (x, y, z) => Math.abs(x) < 0.69 && !(y > 1.475 && Math.hypot(x, z - NECK.z) < NECK.hole),
    rows: ROWS,
  });
  const SEGN = 32, dirs = Array.from({ length: SEGN }, (_, k) => v3(Math.cos((k / SEGN) * TAU), 0, Math.sin((k / SEGN) * TAU)));
  const neckline = (dz) => 1.525 - 0.02 * dz; // yaka tabanı: arkada biraz yüksek, önde alçak (dz: +1 ön, -1 arka)
  // Boyun yarıçapı: taban çizgisinde boynun en geniş yeri + 1,2 cm; yaka bu yarıçapta tam bir dairedir
  let R = 0;
  for (const d of dirs) R = Math.max(R, Math.min(0.074, castOut(v3(0, neckline(d.z), NECK.z), d, 0.004).distanceTo(v3(0, neckline(d.z), NECK.z))));
  R += 0.012;
  const yoke = new Surface(), trim = new Surface();
  const ring = (s, f) => dirs.map((d) => {
    const p = f(d);
    return s.point(p.x, p.y, p.z);
  });
  const up = () => [0, 1, 0.2];
  // Omuz parçası: boyun halkasından kabuğun kesik kenarına düz inen, hafif bombeli halkalar
  const inner = dirs.map((d) => v3(d.x * R, neckline(d.z) - 0.004, NECK.z + d.z * R));
  const anchor = (grow) => dirs.map((d) => settle(v3(d.x * (NECK.hole + grow), neckline(d.z) - 0.3 * (NECK.hole + grow - R), NECK.z + d.z * (NECK.hole + grow)), OFFSET + 0.0015));
  const outer = anchor(0.004), skirt = anchor(0.024);
  let before = ring(yoke, (d) => inner[dirs.indexOf(d)]);
  for (const t of [0.25, 0.5, 0.75, 1]) {
    const row = ring(yoke, (d) => {
      const k = dirs.indexOf(d), p = inner[k].clone().lerp(outer[k], t);
      p.y += 0.007 * Math.sin(Math.PI * t);
      return p;
    });
    yoke.strip(before, row, true, up);
    before = row;
  }
  yoke.strip(before, ring(yoke, (d) => skirt[dirs.indexOf(d)]), true, up);
  root.add(build('ceket', [[shell, cloth('ceket', GREEN), null], [yoke, cloth('ceket_omuz', GREEN), null]]));
  // Dik yaka: tam yuvarlak, dar bant; önde çenenin altında kalır
  const stand = [[0.002, -0.006], [0.001, 0.014], [-0.002, 0.03]].map(([dr, h]) => ring(trim, (d) => v3(d.x * (R + dr), neckline(d.z) + h * (h > 0 ? 1 - 0.12 * d.z : 1), NECK.z + d.z * (R + dr))));
  const fromNeck = (x, y, z) => [x, 0, z - NECK.z];
  trim.strip(stand[0], stand[1], true, fromNeck);
  trim.strip(stand[1], stand[2], true, fromNeck);

  // Sırma: göğüste iki pano, ön ortadan etek ucuna inen çift şerit, kol ağızlarında bant
  const chest = (x, y, lift) => castOut(v3(x, y, -0.03), v3(0, 0, 1), OFFSET + lift);
  const front = () => [0, 0, 1];
  for (const side of [-1, 1]) {
    const rows = [];
    for (let y = 1.43; y > 1.1; y -= 0.03) {
      const wide = 0.055 + 0.105 * S(1.12, 1.42, y);
      rows.push([0, 0.25, 0.5, 0.75, 1].map((t) => chest(side * (0.012 + (wide - 0.012) * t), y, 0.004)));
    }
    patchOf(trim, rows, front);
    patchOf(trim, ROWS.slice(0, 6).map(([y, pay]) => [0.035, 0.11, 0.185].map((da) => {
      const a = Math.PI / 2 - side * da, r = skirtRadius(y, a, pay + 0.005);
      return v3(CEKET.cx + Math.cos(a) * r, y + (y === CHEM ? 0.004 : 0), CEKET.cz + Math.sin(a) * r);
    })), front);
    const rings = [0.6, 0.645, 0.689].map((x) => Array.from({ length: 16 }, (_, k) => {
      const a = (k / 16) * TAU;
      return trim.point(side * x, ARM.y - 0.012 + Math.cos(a) * (SLEEVE + 0.004), ARM.z + Math.sin(a) * (SLEEVE + 0.004));
    }));
    const away = (x, y, z) => [0, y - ARM.y, z - ARM.z];
    trim.strip(rings[0], rings[1], true, away);
    trim.strip(rings[1], rings[2], true, away);
  }
  const uv = (x, y, z) => (Math.abs(x) > 0.3 ? [(Math.atan2(y - ARM.y, z - ARM.z) / TAU) * 2, x * 5] : [x * 5 + z * 2, y * 5]);
  root.add(build('sirma_isleme', [[trim, gold(), uv]]));

  // Ön ortada pirinç düğme sırası (yakadan bele, kemerin altından eteğe)
  const buttons = new Surface();
  for (const y of [1.41, 1.34, 1.27, 1.2, 1.135]) {
    const c = chest(0, y, 0.004);
    button(buttons, c, bodyNormal(c), 0.01);
  }
  for (const y of [1.0, 0.92, 0.84]) {
    const r = skirtRadius(y, Math.PI / 2, 0.062 + 0.02 * S(1.04, CHEM, y));
    button(buttons, v3(CEKET.cx, y, CEKET.cz + r), v3(0, 0, 1), 0.01);
  }
  root.add(build('dugmeler', [[buttons, new THREE.MeshStandardMaterial({ name: 'pirinc_dugme', color: 0x8f7430, roughness: 0.5, metalness: 0.7 }), null]]));

  // Kırmızı nişan kuşağı ve gümüş kemer: ceketin üstünde
  root.add(buildNisanKusagi(0x8a1a1c, OFFSET + 0.01));
  root.add(buildKemer(new THREE.MeshStandardMaterial({ name: 'kemer_gumus', color: 0x8d8c84, roughness: 0.5, metalness: 0.6, side: THREE.DoubleSide }), 0.053));

  // Nişanlar: sol göğüste iki gümüş yıldız
  const silver = new Surface(), centre = new Surface();
  for (const [x, y, radius] of [[0.105, 1.445, 0.03], [0.125, 1.365, 0.033]]) {
    const c = chest(x, y, 0.011), n = bodyNormal(c);
    const u = v3(1, 0, 0).addScaledVector(n, -n.x).normalize(), w = n.clone().cross(u);
    const pts = Array.from({ length: 16 }, (_, k) => {
      const a = (k / 16) * TAU, r = k % 2 ? radius * 0.55 : radius;
      const p = c.clone().addScaledVector(u, Math.cos(a) * r).addScaledVector(w, Math.sin(a) * r);
      return silver.point(p.x, p.y, p.z);
    });
    const tip = c.clone().addScaledVector(n, 0.008);
    silver.fan(silver.point(tip.x, tip.y, tip.z), pts, () => n.toArray());
    button(centre, c.clone().addScaledVector(n, 0.007), n, radius * 0.3);
  }
  root.add(build('nisanlar', [
    [silver, new THREE.MeshStandardMaterial({ name: 'gumus', color: 0xa3a39c, roughness: 0.4, metalness: 0.8, side: THREE.DoubleSide }), null],
    [centre, new THREE.MeshStandardMaterial({ name: 'nisan_gobegi', color: 0x8c1c1c, roughness: 0.5, metalness: 0.3 }), null],
  ]));

  addLower(root, GREEN, gold);
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
