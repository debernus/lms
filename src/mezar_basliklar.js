import * as THREE from 'three';
import { canvasTexture } from './halk2.js';
import { createMezarOzel, paintStone } from './mezar.js';

// Osmanlı mezar taşı başlıkları: 25 ayrı mezar taşı. Gövde ve kitabe eskimiş mezar taşıyla aynıdır
// (kırıksız); her taşın başlığı farklıdır. Erkek taşlarında başlık boynun üstünde duran kavuk, sarık,
// taç ya da festir; hanım taşlarında gövdenin üstünde yükselen kabartmalı tepeliktir.
// Tek tek: createMezarTek(i). Hepsi bir arada, her taş kendi düğümünde: createMezarSeti().

const TAU = Math.PI * 2;
const B = 1.15; // başlıkların oturduğu yükseklik (boynun üst ucunun biraz altı)
const S = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Dönel başlık: profile = [[yarıçap, yükseklik]...] (yükseklik B'den); son nokta tepedir.
// disp(a, t): yarıçap çarpanı (a: açı, önde 0; t: 0 alt … 1 üst). sz: öne-arkaya basıklık.
function turned(profile, { disp = () => 1, sz = 0.9, seg = 32, rows = 20, lean = 0 } = {}) {
  const top = profile[profile.length - 1];
  const curve = new THREE.SplineCurve(profile.slice(0, -1).map(([r, y]) => new THREE.Vector2(r, y)));
  const pts = curve.getPoints(rows), pos = [], idx = [];
  pts.forEach((p, j) => {
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * TAU, r = Math.max(0.004, p.x) * disp(a, j / rows);
      pos.push(Math.sin(a) * r + lean * p.y, B + p.y, Math.cos(a) * r * sz);
    }
  });
  for (let j = 0; j < rows; j++) for (let i = 0; i < seg; i++) {
    const a = j * seg + i, b = j * seg + ((i + 1) % seg), c = a + seg, d = b + seg;
    idx.push(a, b, d, a, d, c);
  }
  const centre = pos.length / 3, last = rows * seg;
  pos.push(lean * top[1], B + top[1], 0);
  for (let i = 0; i < seg; i++) idx.push(last + i, last + ((i + 1) % seg), centre);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const twist = (amount, around, turns, from = 0, to = 1) => (a, t) => 1 + amount * Math.cos(around * a + turns * t * TAU) * S(from - 0.05, from + 0.05, t) * (1 - S(to - 0.05, to + 0.05, t));

// ---------- Erkek başlıkları ----------
const MALE = [
  ['burma_sarikli_kavuk', [[0.07, 0], [0.115, 0.04], [0.128, 0.14], [0.12, 0.24], [0.085, 0.3], [0.04, 0.32], [0, 0.325]], { disp: (a, t) => 1 + 0.16 * (Math.abs(Math.cos(2.5 * a)) - 0.55) * S(0.05, 0.25, t) }],
  ['kallavi_kavuk', [[0.06, 0], [0.15, 0.02], [0.142, 0.06], [0.1, 0.22], [0.075, 0.33], [0.06, 0.345], [0, 0.35]], { disp: twist(0.02, 8, 0.5) }],
  ['katibi_kavuk', [[0.06, 0], [0.14, 0.05], [0.152, 0.11], [0.125, 0.165], [0.1, 0.19], [0.102, 0.22], [0.075, 0.26], [0.035, 0.275], [0, 0.28]],
    { disp: (a, t) => 1 - 0.3 * Math.exp(-((Math.sin(a) / 0.28) ** 2)) * Math.max(0, Math.cos(a)) * S(0.25, 0.5, t) * (1 - S(0.6, 0.72, t)) }],
  ['kafesi_destarli_kavuk', [[0.06, 0], [0.1, 0.04], [0.106, 0.1], [0.085, 0.145], [0.15, 0.16], [0.168, 0.2], [0.14, 0.245], [0.05, 0.262], [0, 0.265]], { disp: twist(0.03, 10, 2, 0, 0.5) }],
  ['mucevveze_kavuk', [[0.07, 0], [0.09, 0.01], [0.1, 0.1], [0.115, 0.2], [0.126, 0.29], [0.122, 0.3], [0, 0.3]], { disp: twist(0.035, 9, 0.15) }],
  ['orfi_destarli_kavuk_1', [[0.07, 0], [0.15, 0.01], [0.166, 0.06], [0.166, 0.13], [0.14, 0.17], [0.06, 0.185], [0, 0.188]], { disp: twist(0.04, 3, 1.4) }],
  ['orfi_destarli_kavuk_2', [[0.07, 0], [0.15, 0.03], [0.178, 0.1], [0.13, 0.17], [0.05, 0.19], [0, 0.193]], { disp: twist(0.045, 2, 1.1), lean: 0.12 }],
  ['katibi_kavuk_2', [[0.06, 0], [0.12, 0.01], [0.127, 0.05], [0.115, 0.085], [0.088, 0.092], [0.085, 0.15], [0.086, 0.2], [0.09, 0.215], [0, 0.215]], { disp: twist(0.05, 14, 0.3, 0.5, 1.2) }],
  ['orfi_destarli_kavuk_3', [[0.06, 0], [0.12, 0.03], [0.146, 0.11], [0.122, 0.21], [0.055, 0.275], [0.03, 0.3], [0, 0.306]], { disp: twist(0.06, 4, 1.3) }],
  ['katibi_kavuk_3', [[0.06, 0], [0.14, 0.02], [0.156, 0.07], [0.1, 0.13], [0.096, 0.17], [0.126, 0.235], [0.122, 0.246], [0, 0.246]], {}],
  ['orfi_destarli_kavuk_4', [[0.07, 0], [0.16, 0.02], [0.192, 0.07], [0.15, 0.125], [0.06, 0.142], [0, 0.145]], { disp: twist(0.016, 10, 2.2) }],
  ['orfi_destarli_kavuk_5', [[0.07, 0], [0.15, 0.02], [0.182, 0.075], [0.14, 0.135], [0.06, 0.152], [0, 0.155]], { disp: twist(0.045, 5, 1) }],
  ['mevlevi_seyhi_taci', [[0.07, 0], [0.13, 0.01], [0.147, 0.05], [0.13, 0.09], [0.1, 0.1], [0.097, 0.18], [0.095, 0.26], [0.078, 0.3], [0.03, 0.31], [0, 0.312]], { disp: twist(0.045, 6, 2, 0, 0.3) }],
  ['naksi_taci', [[0.07, 0], [0.12, 0.01], [0.131, 0.035], [0.1, 0.06], [0.094, 0.15], [0.092, 0.25], [0.085, 0.266], [0, 0.27]], { disp: twist(0.016, 16, 0, 0.28, 1.2) }],
  ['mahmudi_fes_1', [[0.07, 0], [0.108, 0.002], [0.108, 0.08], [0.107, 0.15], [0.09, 0.195], [0.04, 0.206], [0, 0.208]], {}],
  ['mahmudi_fes_2', [[0.07, 0], [0.118, 0.002], [0.121, 0.04], [0.118, 0.12], [0.082, 0.175], [0.035, 0.186], [0, 0.188]], { disp: (a, t) => 1 + 0.07 * (Math.abs(Math.cos(2 * a)) - 0.5) * S(0.25, 0.45, t) }],
  ['azizi_fes', [[0.07, 0], [0.152, 0.002], [0.142, 0.03], [0.12, 0.09], [0.105, 0.135], [0.1, 0.14], [0, 0.14]], {}],
  ['hamidi_fes', [[0.07, 0], [0.075, 0.04], [0.11, 0.05], [0.112, 0.07], [0.1, 0.14], [0.088, 0.21], [0.085, 0.216], [0, 0.216]], {}],
];
// Hanım başlığı (hotoz): boynun üstünde yukarı doğru açılan düz tablalı başlık
const HOTOZ = ['hanim_basligi_hotoz', [[0.07, 0], [0.075, 0.08], [0.1, 0.16], [0.17, 0.215], [0.176, 0.235], [0, 0.235]], { disp: twist(0.012, 18, 0, 0.75, 1.2) }];

// ---------- Hanım tepelikleri: yassı, kabartmalı ----------
// outline(theta): merkezden kenara uzaklık; draw(g, w, h): kabartma (beyaz = yüksek)
function crown(name, cy, outline, draw) {
  const shape = new THREE.Shape(), N = 64, T0 = -0.28 * Math.PI, T1 = 1.28 * Math.PI, base = 0.095;
  shape.moveTo(base, 1.0);
  for (let i = 0; i <= N; i++) {
    const t = T0 + ((T1 - T0) * i) / N, r = outline(t);
    shape.lineTo(Math.cos(t) * r, cy + Math.sin(t) * r);
  }
  shape.lineTo(-base, 1.0);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.066, bevelEnabled: false, curveSegments: 1 });
  g.translate(0, 0, -0.033);
  g.computeBoundingBox();
  const { min, max } = g.boundingBox, p = g.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = (p.getX(i) - min.x) / (max.x - min.x);
    uv[i * 2 + 1] = (p.getY(i) - min.y) / (max.y - min.y);
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  // Kabartma dokusu: çizim tuvali kutuya oturur; (x, y) metre → piksel
  const W = 256, H = Math.round((256 * (max.y - min.y)) / (max.x - min.x));
  const height = document.createElement('canvas');
  height.width = W;
  height.height = H;
  const hg = height.getContext('2d');
  hg.fillStyle = '#000';
  hg.fillRect(0, 0, W, H);
  hg.translate(((0 - min.x) / (max.x - min.x)) * W, ((max.y - cy) / (max.y - min.y)) * H);
  const k = W / (max.x - min.x);
  hg.scale(k, -k); // çizimde birim metre, y yukarı, merkez tepeliğin ortası
  hg.fillStyle = hg.strokeStyle = '#fff';
  hg.lineCap = hg.lineJoin = 'round';
  draw(hg);
  const soft = document.createElement('canvas');
  soft.width = W;
  soft.height = H;
  const sg = soft.getContext('2d');
  sg.filter = 'blur(1.8px)';
  sg.drawImage(height, 0, 0);
  const D = sg.getImageData(0, 0, W, H).data;
  const map = canvasTexture(name, W, H, (c) => {
    c.save();
    c.scale(W / 512, W / 512); // taş lekeleri 512 piksellik ölçekte çizilir
    paintStone(c, 512, (H * 512) / W, 5 + name.length, 0, true);
    c.restore();
    c.globalCompositeOperation = 'multiply';
    // Oyuklar yalnızca hafifçe gölgelenir: taş gövdeyle aynı açık mermer kalır; kabartmayı normal haritası verir
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = 'rgba(40,36,28,0.08)';
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.14;
    c.drawImage(soft, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  });
  const normalMap = canvasTexture(name + '_kabartma', W, H, (c) => {
    const out = c.createImageData(W, H), at = (x, y) => D[(Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))) * 4] / 255;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const du = (at(x + 1, y) - at(x - 1, y)) * 3, dv = (at(x, y - 1) - at(x, y + 1)) * 3, len = Math.hypot(du, dv, 1), i = (y * W + x) * 4;
      out.data[i] = (-du / len * 0.5 + 0.5) * 255;
      out.data[i + 1] = (-dv / len * 0.5 + 0.5) * 255;
      out.data[i + 2] = (1 / len * 0.5 + 0.5) * 255;
      out.data[i + 3] = 255;
    }
    c.putImageData(out, 0, 0);
  });
  normalMap.colorSpace = THREE.NoColorSpace;
  map.wrapS = map.wrapT = normalMap.wrapS = normalMap.wrapT = THREE.ClampToEdgeWrapping;
  return { head: g, headMaterial: new THREE.MeshStandardMaterial({ name, map, normalMap, normalScale: new THREE.Vector2(1.5, 1.5), roughness: 0.96, metalness: 0 }), neck: false };
}
// Çizim yardımcıları (birim metre)
const petals = (g, n, r0, r1, wide, turn = 0) => {
  for (let i = 0; i < n; i++) {
    const a = turn + (i / n) * TAU;
    g.save();
    g.rotate(a);
    g.beginPath();
    g.moveTo(r0, 0);
    g.quadraticCurveTo((r0 + r1) / 2, wide, r1, 0);
    g.quadraticCurveTo((r0 + r1) / 2, -wide, r0, 0);
    g.fill();
    g.restore();
  }
};
const ring = (g, r, w, x = 0, y = 0) => {
  g.lineWidth = w;
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.stroke();
};
const disc = (g, r, x = 0, y = 0) => {
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fill();
};
const spiral = (g, x, y, r, turns, w) => {
  g.lineWidth = w;
  g.beginPath();
  for (let t = 0; t <= 1.001; t += 0.02) g.lineTo(x + Math.cos(t * turns * TAU) * r * t, y + Math.sin(t * turns * TAU) * r * t);
  g.stroke();
};
const scrolls = (g, y, r, w) => {
  for (const s of [-1, 1]) spiral(g, s * 0.06, y, r, 1.6 * s, w);
};
const CROWNS = [
  ['hanim_basligi_madalyon', 1.2, (t) => 0.155 + 0.008 * Math.cos(10 * t), (g) => {
    ring(g, 0.14, 0.012);
    petals(g, 16, 0.03, 0.118, 0.018);
    disc(g, 0.024);
    scrolls(g, -0.165, 0.035, 0.01);
  }],
  ['hanim_basligi_papatya', 1.26, (t) => (Math.sin(t) > -0.35 ? 0.13 + 0.022 * Math.cos(22 * t) : 0.12), (g) => {
    petals(g, 22, 0.025, 0.135, 0.012);
    petals(g, 8, 0.008, 0.045, 0.012, 0.3);
    disc(g, 0.012);
    scrolls(g, -0.19, 0.045, 0.012);
    ring(g, 0.03, 0.008, 0, -0.2);
  }],
  ['hanim_basligi_cicek_demeti', 1.25, (t) => 0.135 + 0.018 * Math.cos(9 * t) + 0.03 * Math.max(0, Math.sin(t)), (g) => {
    for (const [x, y, r] of [[0, 0.09, 0.034], [-0.06, 0.05, 0.03], [0.06, 0.05, 0.03], [-0.035, -0.005, 0.028], [0.035, -0.005, 0.028]]) {
      g.save();
      g.translate(x, y);
      petals(g, 7, r * 0.3, r, r * 0.3);
      disc(g, r * 0.28);
      g.restore();
    }
    petals(g, 9, 0.08, 0.15, 0.014, Math.PI / 9);
    g.lineWidth = 0.012;
    g.strokeRect(-0.045, -0.13, 0.09, 0.07);
    scrolls(g, -0.17, 0.03, 0.01);
  }],
  ['hanim_basligi_cicek_sepeti', 1.22, (t) => (Math.sin(t) > -0.15 ? 0.165 + 0.012 * Math.cos(16 * t) : 0.1), (g) => {
    for (let i = 0; i < 13; i++) {
      g.save();
      g.rotate((i / 12) * Math.PI);
      g.translate(0.105, 0);
      petals(g, 6, 0.006, 0.04, 0.012);
      g.restore();
    }
    for (const [x, y] of [[0, 0.05], [-0.05, 0.025], [0.05, 0.025]]) {
      g.save();
      g.translate(x, y);
      petals(g, 8, 0.008, 0.034, 0.01);
      disc(g, 0.009);
      g.restore();
    }
    g.lineWidth = 0.012;
    g.strokeRect(-0.07, -0.1, 0.14, 0.085);
    for (let x = -0.05; x < 0.06; x += 0.025) g.strokeRect(x, -0.1, 0.001, 0.085);
  }],
  ['hanim_basligi_oval_madalyon', 1.25, (t) => {
    const e = 1 / Math.hypot(Math.cos(t) / 0.115, Math.sin(t) / 0.185);
    return e + 0.01 * Math.cos(26 * t);
  }, (g) => {
    g.save();
    g.scale(0.62, 1);
    ring(g, 0.165, 0.014);
    petals(g, 26, 0.125, 0.16, 0.012);
    ring(g, 0.085, 0.012);
    g.restore();
    disc(g, 0.02, 0, 0.02);
    g.lineWidth = 0.008;
    g.strokeRect(-0.03, -0.04, 0.06, 0.025);
    scrolls(g, -0.215, 0.03, 0.01);
  }],
  ['hanim_basligi_sade', 1.23, (t) => 0.14 + 0.03 * Math.cos(3 * (t - Math.PI / 2)) + 0.006 * Math.cos(18 * t), () => {
    // (yüzü sade: sarmal bezeme kaldırıldı)
  }],
];

// ---------- Kitabeler: birkaç ad ve tarih dönüşümlü kullanılır (adlar kurgudur) ----------
const ERKEK = [['قره حصارلی احمد آغا', '١٣٢٨'], ['طوپخانه لی محمد افندی', '١٢٧٤'], ['اسكدارلی مصطفی چلبی', '١٢٣١'], ['غلطه لی حسن قپودان', '١٢٩٥'], ['ایوبلی ابراهیم دده', '١٢٥٦']];
const HANIM = [['فاطمه خانم', '١٣٠٢'], ['عایشه خاتون', '١٢٦٨'], ['زینب قادین', '١٢٨٩']];
const lines = (female, i) => {
  const [name, year] = female ? HANIM[i % HANIM.length] : ERKEK[i % ERKEK.length];
  return { lines: ['هو الباقی', female ? 'مرحومه و مغفوره' : 'مرحوم و مغفور', 'الی رحمة ربه الغفور', name, 'روحیچون الفاتحه', 'سنه ' + year], key: (female ? '_h' : '_e') + (i % (female ? HANIM.length : ERKEK.length)) };
};

// Görseldeki sıra: soldan sağa, yukarıdan aşağı
const ORDER = [...MALE.map((m) => ({ male: m })), { crown: CROWNS[0] }, { crown: CROWNS[1] }, { male: HOTOZ, female: true }, ...CROWNS.slice(2).map((c) => ({ crown: c }))];
export const MEZAR_ADLARI = ORDER.map((o, i) => `mezar_${String(i + 1).padStart(2, '0')}_${(o.male ?? o.crown)[0]}`);

export function createMezarTek(i) {
  const o = ORDER[i], female = !!o.crown || !!o.female;
  const text = lines(female, i);
  if (o.crown) {
    const [name, cy, outline, draw] = o.crown;
    return createMezarOzel({ name: MEZAR_ADLARI[i], ...crown(name, cy, outline, draw), ...text });
  }
  const [, profile, options] = o.male;
  return createMezarOzel({ name: MEZAR_ADLARI[i], head: turned(profile, options), ...text });
}
// Hepsi: 5 × 5 dizili; her taş kendi düğümünde ve kendi orijininde
export function createMezarSeti() {
  const root = new THREE.Group();
  root.name = 'mezar_taslari';
  ORDER.forEach((_, i) => {
    const stone = createMezarTek(i);
    stone.position.set((i % 5 - 2) * 0.9, 0, (Math.floor(i / 5) - 2) * 1.3);
    root.add(stone);
  });
  return root;
}
