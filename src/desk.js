import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Memur çalışma masası (1914, Osmanlı İstanbul'u): Avrupa işi, çerçeveli tablalı, iki gövdeli
// yazıhane masası; yıllarca kalem odasında kullanılmış. Birim metre, Y yukarı, taban ortası
// (0, 0, 0). Ön yüz (çekmeceler) +Z'ye bakar. En 1,6 m, derinlik 0,8 m, yükseklik 0,78 m.
//
// Eskime tek bir 1024 piksellik dokuda boyanır; doku dört bölgeye ayrılır:
const ATLAS = 1024;
const REGION = {
  top: [0, 0, 1024, 512], // tablanın üst yüzü (üst kenar = arka)
  drawer: [0, 512, 512, 256], // çekmece ön yüzü
  leather: [0, 768, 512, 256], // meşin yazı altlığı
  wood: [512, 512, 512, 512], // diğer bütün ahşap yüzeyler (damar dikey)
};

// Her seferinde aynı sonucu veren rastgele sayı üreteci.
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function paintAtlas() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = ATLAS;
  const g = canvas.getContext('2d');
  const rand = seeded(1914);
  const range = (a, b) => a + rand() * (b - a);

  const clipped = ([x, y, w, h], draw) => {
    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    g.translate(x, y);
    draw(w, h);
    g.restore();
  };
  // Yumuşak kenarlı leke: açık renk sürtünme aşınması, koyu renk kir için.
  const blot = (cx, cy, rx, ry, rgb, alpha) => {
    g.save();
    g.translate(cx, cy);
    g.scale(1, ry / rx);
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    grad.addColorStop(0, `rgba(${rgb},${alpha})`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grad;
    g.fillRect(-rx, -rx, rx * 2, rx * 2);
    g.restore();
  };
  const RUB = '168,122,78'; // cilası gitmiş, açılmış ahşap
  const GRIME = '10,6,4';

  // Koyu ceviz: damar çizgileri, geniş ton bantları.
  const wood = (w, h, horizontal) => {
    g.fillStyle = '#38241a';
    g.fillRect(0, 0, w, h);
    const across = horizontal ? h : w;
    const along = horizontal ? w : h;
    for (let i = 0; i < 10; i++) blot(range(0, w), range(0, h), range(60, 200), range(40, 120), rand() < 0.5 ? GRIME : '95,60,35', range(0.08, 0.2));
    for (let i = 0; i < across * 1.3; i++) {
      const c = range(0, across);
      const amp = range(0.5, 3.5);
      const wave = range(120, 420);
      const phase = range(0, 6.3);
      g.strokeStyle = rand() < 0.68 ? `rgba(14,7,3,${range(0.05, 0.3)})` : `rgba(125,82,48,${range(0.04, 0.18)})`;
      g.lineWidth = range(0.5, 2.4);
      g.beginPath();
      for (let t = 0; t <= along; t += 16) {
        const o = c + amp * Math.sin(t / wave * 6.3 + phase);
        if (horizontal) g.lineTo(t, o);
        else g.lineTo(o, t);
      }
      g.stroke();
    }
  };
  const scratches = (w, h, count) => {
    for (let i = 0; i < count; i++) {
      const x = range(0, w);
      const y = range(0, h);
      const len = range(8, 90);
      const a = range(0, Math.PI);
      g.strokeStyle = rand() < 0.75 ? `rgba(205,170,125,${range(0.12, 0.4)})` : `rgba(8,4,2,${range(0.3, 0.6)})`;
      g.lineWidth = range(0.5, 1.5);
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + range(-6, 6), y + Math.sin(a) * len * 0.5 + range(-6, 6), x + Math.cos(a) * len, y + Math.sin(a) * len);
      g.stroke();
    }
  };
  // Kenar boyunca düzensiz aşınma: cila en çok kenar ve köşelerden gider.
  const wornEdges = (w, h, strength) => {
    const per = 2 * (w + h);
    for (let d = 0; d < per; d += range(5, 16)) {
      const [x, y] = d < w ? [d, 0] : d < w + h ? [w, d - w] : d < 2 * w + h ? [d - w - h, h] : [0, d - 2 * w - h];
      if (rand() < 0.75) blot(x, y, range(5, 16), range(5, 16), RUB, range(0.15, 0.6) * strength);
    }
  };

  // --- Genel ahşap: çizikler, kir, yer yer aşınma ---
  clipped(REGION.wood, (w, h) => {
    wood(w, h, false);
    scratches(w, h, 70);
    for (let i = 0; i < 7; i++) blot(range(0, w), range(0, h), range(25, 70), range(25, 90), RUB, range(0.1, 0.25));
    for (let i = 0; i < 9; i++) blot(range(0, w), range(0, h), range(30, 90), range(30, 90), GRIME, range(0.2, 0.45));
  });

  // --- Tabla üstü: 640 piksel = 1 metre; alt kenar memurun oturduğu ön taraf ---
  clipped(REGION.top, (w, h) => {
    wood(w, h, true);
    scratches(w, h, 170);
    wornEdges(w, h, 1);
    // Kolların yıllarca sürtündüğü ön kenar
    for (let i = 0; i < 16; i++) blot(range(210, 815), h - range(0, 28), range(40, 95), range(18, 42), RUB, range(0.22, 0.5));
    // Köşelerde ve arka kenarda birikmiş kir
    for (const cx of [0, w]) blot(cx, 0, 150, 110, GRIME, 0.55);
    for (let i = 0; i < 8; i++) blot(range(0, w), range(0, 30), range(50, 120), range(20, 40), GRIME, range(0.2, 0.4));
    // Çay bardağı halkaları
    for (const [cx, cy, r] of [[170, 150, 20], [196, 172, 20], [905, 330, 19], [120, 420, 21]]) {
      g.lineWidth = range(2, 3.4);
      g.strokeStyle = `rgba(12,6,3,${range(0.3, 0.5)})`;
      g.beginPath();
      g.arc(cx, cy, r, range(0, 2), range(4.6, 6.3));
      g.stroke();
      g.lineWidth = 1.2;
      g.strokeStyle = 'rgba(190,150,105,0.22)';
      g.beginPath();
      g.arc(cx, cy, r - 2.5, 0, 6.3);
      g.stroke();
    }
    // Hokkanın durduğu yerde mürekkep lekeleri ve sıçramalar
    for (const [cx, cy, n, spread] of [[880, 118, 16, 26], [835, 205, 6, 12], [640, 60, 4, 9]]) {
      for (let i = 0; i < n; i++) {
        g.fillStyle = `rgba(6,8,22,${range(0.5, 0.9)})`;
        g.beginPath();
        g.ellipse(cx + range(-spread, spread), cy + range(-spread, spread) * 0.7, range(2, spread * 0.5), range(2, spread * 0.4), range(0, 3), 0, 6.3);
        g.fill();
      }
      for (let i = 0; i < n * 2; i++) {
        g.fillStyle = `rgba(6,8,22,${range(0.4, 0.8)})`;
        g.beginPath();
        g.arc(cx + range(-spread, spread) * 2.6, cy + range(-spread, spread) * 2, range(0.6, 2.2), 0, 6.3);
        g.fill();
      }
    }
    // Sigara yanığı
    blot(300, 468, 16, 9, '70,40,20', 0.6);
    blot(300, 468, 7, 4, '5,3,2', 0.95);
  });

  // --- Çekmece ön yüzü: 1505 piksel = 1 metre ---
  clipped(REGION.drawer, (w, h) => {
    wood(w, h, true);
    scratches(w, h, 45);
    // Kulpun çevresi ve üst kenar: elin değdiği yerler açılmış
    for (let i = 0; i < 6; i++) blot(w / 2 + range(-50, 50), h / 2 + range(-10, 30), range(40, 80), range(22, 40), RUB, range(0.15, 0.3));
    for (let i = 0; i < 10; i++) blot(range(120, w - 120), range(0, 10), range(25, 60), range(8, 16), RUB, range(0.2, 0.45));
    wornEdges(w, h, 0.7);
    // Kenar girintilerinde kir
    g.lineWidth = 26;
    g.strokeStyle = `rgba(${GRIME},0.3)`;
    g.strokeRect(0, 0, w, h);
    for (const [cx, cy] of [[0, h], [w, h], [0, 0], [w, 0]]) blot(cx, cy, 70, 50, GRIME, 0.5);
    // Anahtar deliği: kararmış pirinç ayna ve delik
    const kx = w / 2;
    const ky = 56;
    g.fillStyle = '#5b4722';
    g.beginPath();
    g.ellipse(kx, ky, 11, 18, 0, 0, 6.3);
    g.fill();
    g.strokeStyle = 'rgba(15,10,4,0.7)';
    g.lineWidth = 2;
    g.stroke();
    blot(kx - 3, ky - 6, 7, 9, '150,120,60', 0.45);
    g.fillStyle = '#060403';
    g.beginPath();
    g.arc(kx, ky - 4, 3.6, 0, 6.3);
    g.fill();
    g.fillRect(kx - 1.8, ky - 4, 3.6, 13);
    // Anahtarın yıllarca çizdiği yer
    for (let i = 0; i < 8; i++) {
      g.strokeStyle = `rgba(205,170,125,${range(0.15, 0.35)})`;
      g.lineWidth = 0.8;
      g.beginPath();
      g.arc(kx + range(-3, 3), ky + range(-3, 3), range(16, 26), range(0.3, 1.4), range(1.8, 3.2));
      g.stroke();
    }
  });

  // --- Meşin yazı altlığı: solmuş, çatlamış, yaldızı dökülmüş ---
  clipped(REGION.leather, (w, h) => {
    g.fillStyle = '#1c2f24';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) blot(range(0, w), range(0, h), range(4, 22), range(4, 22), rand() < 0.5 ? '6,12,8' : '60,78,58', range(0.05, 0.16));
    // Yazı yazılan orta kısım solmuş ve parlamış
    for (let i = 0; i < 14; i++) blot(w / 2 + range(-120, 120), h * 0.58 + range(-50, 50), range(50, 110), range(30, 60), '112,108,76', range(0.1, 0.22));
    // Ön kenarda meşin aşınıp altındaki ham deri çıkmış
    for (let i = 0; i < 26; i++) blot(range(40, w - 40), h - range(0, 9), range(8, 30), range(4, 10), '120,84,52', range(0.3, 0.7));
    for (const cx of [0, w]) for (const cy of [0, h]) blot(cx, cy, 34, 26, '120,84,52', 0.55);
    // Yaldız kenar çizgisi: yer yer silinmiş
    const dash = (x0, y0, x1, y1) => {
      const len = Math.hypot(x1 - x0, y1 - y0);
      for (let d = 0; d < len; d += range(5, 13)) {
        if (rand() < 0.38) continue;
        const t0 = d / len;
        const t1 = Math.min(1, (d + range(3, 9)) / len);
        g.strokeStyle = `rgba(158,126,60,${range(0.25, 0.8)})`;
        g.beginPath();
        g.moveTo(x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0);
        g.lineTo(x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1);
        g.stroke();
      }
    };
    for (const [m, lw] of [[14, 2.4], [20, 1]]) {
      g.lineWidth = lw;
      dash(m, m, w - m, m);
      dash(w - m, m, w - m, h - m);
      dash(w - m, h - m, m, h - m);
      dash(m, h - m, m, m);
    }
    // Çatlaklar
    for (let i = 0; i < 34; i++) {
      let x = range(0, w);
      let y = range(0, h);
      g.strokeStyle = `rgba(4,8,5,${range(0.35, 0.7)})`;
      g.lineWidth = range(0.5, 1.2);
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 0, a = range(0, 6.3); k < range(3, 9); k++) {
        a += range(-0.9, 0.9);
        x += Math.cos(a) * range(4, 14);
        y += Math.sin(a) * range(4, 14);
        g.lineTo(x, y);
      }
      g.stroke();
    }
    // Mürekkep damlası ve kalem izleri
    blot(372, 92, 15, 11, '5,7,20', 0.9);
    blot(356, 108, 5, 4, '5,7,20', 0.8);
    for (let i = 0; i < 16; i++) {
      const x = range(150, 380);
      const y = range(110, 210);
      g.strokeStyle = `rgba(4,6,16,${range(0.15, 0.4)})`;
      g.lineWidth = 0.7;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + range(10, 45), y + range(-3, 3));
      g.stroke();
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.name = 'memur_masasi_doku';
  return texture;
}

// Doku bölgesindeki piksel konumunu uv'ye çevirir (kenarlardan 2 piksel içeride kalır).
function atlasUV([x, y, w, h], s, t) {
  const px = x + 2 + s * (w - 4);
  const py = y + 2 + t * (h - 4);
  return [px / ATLAS, 1 - py / ATLAS];
}

// Kutu yüzleri: [ad, normal ekseni, yön, iki kenar ekseni]
const FACES = [
  ['px', 0, 1, 2, 1], ['nx', 0, -1, 2, 1],
  ['py', 1, 1, 0, 2], ['ny', 1, -1, 0, 2],
  ['pz', 2, 1, 0, 1], ['nz', 2, -1, 0, 1],
];
const AXES = { x: 0, y: 1, z: 2 };
const place = seeded(7);
const WOOD_PX_PER_M = 660;

// Ahşap parça: yalnız görünen yüzleri olan kutu. skip: modellenmeyecek yüzler ("py ny" gibi).
// Damar kutunun en uzun kenarı boyunca akar. special: { yüzAdı: bölge } o yüzü özel bölgeye eşler.
function board(w, h, d, x, y, z, { skip = '', shade = 1, grain, special = {} } = {}) {
  const size = [w, h, d];
  const center = [x, y, z];
  const grainAxis = grain ? AXES[grain] : size.indexOf(Math.max(...size));
  const positions = [];
  const normals = [];
  const uvs = [];
  const colors = [];
  const indices = [];
  for (const [name, n, dir, a, b] of FACES) {
    if (skip.includes(name)) continue;
    const base = positions.length / 3;
    // Genel ahşap bölgesinde bu yüze rastgele bir yer ayır
    const along = b === grainAxis ? b : a === grainAxis ? a : b;
    const across = along === a ? b : a;
    const [, , rw, rh] = REGION.wood;
    const fw = Math.min(1, (size[across] * WOOD_PX_PER_M) / rw);
    const fh = Math.min(1, (size[along] * WOOD_PX_PER_M) / rh);
    const ox = place() * (1 - fw);
    const oy = place() * (1 - fh);
    for (const [sa, sb] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const p = [0, 0, 0];
      p[n] = center[n] + (dir * size[n]) / 2;
      p[a] = center[a] + (sa * size[a]) / 2;
      p[b] = center[b] + (sb * size[b]) / 2;
      positions.push(...p);
      const nrm = [0, 0, 0];
      nrm[n] = dir;
      normals.push(...nrm);
      if (special[name]) {
        // Özel bölge: yatay eksen s, düşey (y ya da z) eksen t; üst/arka kenar bölgenin üstünde
        const s = (sa + 1) / 2;
        const t = n === 1 ? (sb + 1) / 2 : 1 - (sb + 1) / 2;
        uvs.push(...atlasUV(special[name], s, t));
      } else {
        const sAcross = ((across === a ? sa : sb) + 1) / 2;
        const sAlong = ((along === a ? sa : sb) + 1) / 2;
        uvs.push(...atlasUV(REGION.wood, ox + sAcross * fw, oy + sAlong * fh));
      }
      // Yere yakın kısımlar daha koyu: yıllarca silinen zeminin kiri
      const tone = shade * (0.62 + 0.38 * THREE.MathUtils.smoothstep(p[1], 0, 0.34));
      colors.push(tone, tone, tone);
    }
    if (dir * (n === 2 ? -1 : 1) < 0) indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    else indices.push(base, base + 2, base + 1, base, base + 3, base + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(indices);
  return g.toNonIndexed();
}

// Torna işi kısa ayak (alt ve üst yüzü yok); dibi yerden gelen kirle kararmış.
function turnedFoot(x, z) {
  const profile = [[0.019, 0], [0.03, 0.016], [0.036, 0.042], [0.024, 0.064], [0.021, 0.072], [0.031, 0.082], [0.033, 0.1]];
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 8);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, ...atlasUV(REGION.wood, 0.1 + uv.getX(i) * 0.3, 0.2 + uv.getY(i) * 0.15));
  const pos = g.attributes.position;
  const tone = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) tone.fill(0.5 + 2.2 * pos.getY(i), i * 3, i * 3 + 3);
  g.setAttribute('color', new THREE.BufferAttribute(tone, 3));
  return g.translate(x, 0, z).toNonIndexed();
}

// Çerçeveli tabla görünümü: bir yüzün üstüne iki dikme ve iki kayıt.
// axis: yüzün baktığı eksen ('x' ya da 'z'), dir: yönü, c: yüzün o eksendeki konumu.
function frame(axis, dir, c, u0, u1, y0, y1, stile = 0.06) {
  const t = 0.008;
  const hidden = (dir > 0 ? 'n' : 'p') + axis; // gövdeye yapışık yüz modellenmez
  const at = c + (dir * t) / 2;
  const make = (uc, yc, uw, yh, extraSkip, shade) =>
    axis === 'x'
      ? board(t, yh, uw, at, yc, uc, { skip: hidden + extraSkip, shade })
      : board(uw, yh, t, uc, yc, at, { skip: hidden + extraSkip, shade });
  const railTop = 0.07;
  const railBottom = 0.09;
  const inner = u1 - u0 - stile * 2;
  return [
    make(u0 + stile / 2, (y0 + y1) / 2, stile, y1 - y0, '', 0.97),
    make(u1 - stile / 2, (y0 + y1) / 2, stile, y1 - y0, '', 1.03),
    make((u0 + u1) / 2, y1 - railTop / 2, inner, railTop, ' py', 1),
    make((u0 + u1) / 2, y0 + railBottom / 2, inner, railBottom, ' ny', 0.92),
  ];
}

const bare = (g) => {
  const out = g.index ? g.toNonIndexed() : g;
  out.deleteAttribute('uv');
  out.deleteAttribute('color');
  return out;
};

export function createClerkDesk() {
  const TOP_Y = 0.778; // tablanın üstü; meşin altlık 0,78'e tamamlar
  const PED_X = 0.56; // çekmeceli gövdelerin merkezi
  const PED_W = 0.42;
  const FRONT = 0.36; // gövdelerin ön yüzü
  const P0 = 0.13; // gövdenin altı
  const P1 = 0.72; // gövdenin üstü

  const wood = [
    // Tabla: hafif çıkıntılı üst levha ve altındaki ince silme
    board(1.6, 0.04, 0.8, 0, TOP_Y - 0.02, 0, { shade: 1.05, special: { py: REGION.top } }),
    board(1.56, 0.018, 0.76, 0, TOP_Y - 0.049, 0, { skip: 'py', shade: 0.85 }),
    // Diz boşluğunun üstündeki ön kuşak ve arkadaki perde tahtası
    board(0.7, 0.07, 0.02, 0, 0.685, 0.33, { skip: 'py px nx', shade: 0.9 }),
    board(0.7, 0.45, 0.018, 0, 0.495, -0.34, { skip: 'py px nx', shade: 0.82, grain: 'x' }),
    ...frame('z', -1, -0.349, -0.35, 0.35, 0.27, P1, 0.07),
  ];
  const brass = [];

  // Çekmecelerin yılların verdiği bozuklukları: [dışarı çıkıklık, eğiklik, kulp açısı]
  const quirks = {
    '-1': [[0.001, 0.004, 0.1], [0.004, -0.011, -0.5], [0, 0.003, 0]],
    1: [[0.003, -0.005, 0.25], [0, 0.002, 0], [0.003, 0.008, -0.2]],
  };

  for (const s of [-1, 1]) {
    const x = s * PED_X;
    const outer = x + (s * PED_W) / 2;
    wood.push(
      board(PED_W, P1 - P0, 0.72, x, (P0 + P1) / 2, 0, { skip: 'py ny', shade: 0.86, grain: 'y' }), // gövde
      board(PED_W + 0.024, 0.03, 0.744, x, 0.115, 0, { skip: 'ny', shade: 0.75 }), // süpürgelik
      ...frame('x', s, outer, -0.36, 0.36, P0, P1), // dış yan tabla
      ...frame('z', -1, -0.36, x - PED_W / 2, x + PED_W / 2, P0, P1), // arka tabla
    );
    for (const fx of [-1, 1]) for (const fz of [-1, 1]) wood.push(turnedFoot(x + fx * 0.165, fz * 0.315));

    // Üç çekmece: ön yüzler hizasını yitirmiş, pirinç kulplar kararmış
    [0.24, 0.43, 0.62].forEach((y, i) => {
      const [out, tilt, swing] = quirks[s][i];
      const m = new THREE.Matrix4()
        .makeTranslation(x, y, FRONT + 0.007 + out)
        .multiply(new THREE.Matrix4().makeRotationZ(tilt))
        .multiply(new THREE.Matrix4().makeRotationY(out * 2 * s));
      wood.push(board(0.36, 0.17, 0.014, 0, 0, 0, { skip: 'nz', special: { pz: REGION.drawer } }).applyMatrix4(m));
      const parts = [
        board(0.075, 0.026, 0.004, 0, 0.004, 0.009, { skip: 'nz' }),
        board(0.009, 0.009, 0.01, -0.022, 0.004, 0.015, { skip: 'nz' }),
        board(0.009, 0.009, 0.01, 0.022, 0.004, 0.015, { skip: 'nz' }),
        // Sarkan yarım halka kulp; bazıları yamuk durur
        new THREE.TorusGeometry(0.022, 0.0035, 5, 10, Math.PI).rotateZ(Math.PI).rotateX(-0.25).translate(0, 0.004, 0.017).rotateZ(swing * 0.12),
      ];
      for (const part of parts) brass.push(bare(part).applyMatrix4(m));
    });
  }

  // Meşin yazı altlığı: tablanın ortasında, yalnız üst yüzü olan levha
  const pad = new THREE.PlaneGeometry(0.9, 0.5).rotateX(-Math.PI / 2).translate(0, 0.78, 0.02);
  const padUV = pad.attributes.uv;
  for (let i = 0; i < padUV.count; i++) padUV.setXY(i, ...atlasUV(REGION.leather, padUV.getX(i), 1 - padUV.getY(i)));

  const map = paintAtlas();
  const root = new THREE.Group();
  root.name = 'memur_masasi';

  const body = new THREE.Mesh(
    mergeGeometries(wood),
    new THREE.MeshStandardMaterial({ name: 'eski_ceviz', map, vertexColors: true, roughness: 0.8, metalness: 0 }),
  );
  body.name = 'govde';
  const leather = new THREE.Mesh(
    pad.toNonIndexed(),
    new THREE.MeshStandardMaterial({ name: 'eski_mesin', map, roughness: 0.86, metalness: 0 }),
  );
  leather.name = 'yazi_altligi';
  const handles = new THREE.Mesh(
    mergeGeometries(brass),
    new THREE.MeshStandardMaterial({ name: 'kararmis_pirinc', color: 0x3f3118, roughness: 0.82, metalness: 0.45 }),
  );
  handles.name = 'kulplar';
  root.add(body, leather, handles);
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
