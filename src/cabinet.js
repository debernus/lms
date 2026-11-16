import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createPainter, seeded, regionUV, boxGeometry, RUB, GRIME } from './paint.js';

// Evrak dolabı (1914, Osmanlı İstanbul'u): bir kalem odasında yıllarca kullanılmış. Üstte üç açık
// raf dolusu dosya ve evrak destesi, altta iki kapaklı dolap. Birim metre, Y yukarı, taban ortası
// (0, 0, 0), ön yüz +Z. En 1,2 m, derinlik 0,45 m, yükseklik 2,1 m.

const ATLAS = 1024;
const SPINES = 10;
const REGION = {
  wood: [0, 0, 640, 384], // genel ahşap, damar yatay
  door: [640, 0, 384, 512], // kapak ön yüzü (sağ kenar = kulp tarafı)
  spines: [0, 384, 640, 256], // on farklı dosya sırtı, her biri 64 piksel
  paperSide: [0, 640, 256, 128], // evrak destesinin kenarı: kâğıt katları ve sicim
  paperTop: [256, 640, 192, 192], // destenin üstü: sararmış kâğıt ve çapraz bağlanmış sicim
};
const spineRect = (i) => [REGION.spines[0] + i * 64, REGION.spines[1], 64, 256];

function paintAtlas() {
  const { g, rand, range, region, blot, patch, wood, scratches, texture } = createPainter(ATLAS, 1914);

  // --- Genel ahşap ---
  region(REGION.wood, (w, h) => {
    wood(w, h, '#2f1d13');
    scratches(w, h, 110);
    for (let i = 0; i < 12; i++) blot(range(0, w), range(0, h), range(20, 70), range(12, 40), RUB, range(0.12, 0.3));
    for (let i = 0; i < 14; i++) blot(range(0, w), range(0, h), range(30, 100), range(20, 60), GRIME, range(0.25, 0.5));
  });

  // --- Kapak: dikey damar, tablalı görünüm, kulp çevresinde ve altta eskime ---
  region(REGION.door, (w, h) => {
    g.save();
    g.translate(w, 0);
    g.rotate(Math.PI / 2);
    wood(h, w, '#2f1d13');
    g.restore();
    // Tabla: çerçevenin içinde girintili pano
    const m = 58;
    g.fillStyle = 'rgba(0,0,0,0.16)';
    g.fillRect(m, m, w - 2 * m, h - 2 * m);
    g.lineWidth = 5;
    g.strokeStyle = 'rgba(5,3,2,0.75)';
    g.beginPath();
    g.moveTo(m, h - m);
    g.lineTo(m, m);
    g.lineTo(w - m, m);
    g.stroke();
    g.strokeStyle = 'rgba(150,105,65,0.35)';
    g.beginPath();
    g.moveTo(w - m, m);
    g.lineTo(w - m, h - m);
    g.lineTo(m, h - m);
    g.stroke();
    scratches(w, h, 90);
    patch(w - 30, h * 0.42, 30, 60, RUB, 16, 0.3); // kulp çevresi: elin açtığı ahşap
    patch(w - 6, h * 0.5, 8, h * 0.45, RUB, 30, 0.32, 7); // kapağın açılan kenarı
    patch(w / 2, h - 30, w / 2, 26, RUB, 26, 0.35); // alt kenar: ayak ve süpürge darbeleri
    for (let i = 0; i < 14; i++) blot(range(0, w), h - range(0, 70), range(40, 110), range(20, 50), GRIME, range(0.3, 0.55));
    for (const [cx, cy] of [[0, 0], [w, 0], [0, h]]) blot(cx, cy, 120, 120, GRIME, 0.5);
    // Rutubetten akmış su izi
    for (let i = 0; i < 5; i++) {
      const x = range(70, w - 90);
      g.strokeStyle = `rgba(8,5,3,${range(0.2, 0.4)})`;
      g.lineWidth = range(3, 8);
      g.beginPath();
      g.moveTo(x, range(60, 160));
      g.lineTo(x + range(-6, 6), range(240, 420));
      g.stroke();
    }
  });

  // --- Dosya sırtları: soluk kahverengi, bej ve koyu yeşil karton ---
  const cardboard = ['#5f4631', '#6b5038', '#56402e', '#735a40', '#857657', '#7b6d50', '#8c7d5e', '#2c3d31', '#33453a', '#28382d'];
  cardboard.forEach((base, i) => {
    region(spineRect(i), (w, h) => {
      g.fillStyle = base;
      g.fillRect(0, 0, w, h);
      for (let k = 0; k < 40; k++) blot(range(0, w), range(0, h), range(5, 20), range(5, 24), rand() < 0.55 ? '10,7,4' : '170,150,110', range(0.06, 0.18));
      // Bez şerit (bazılarında): sırtın üst ve altı koyu bezle kaplı
      if (i % 3 === 0) {
        g.fillStyle = 'rgba(14,10,7,0.6)';
        g.fillRect(0, 0, w, 30);
        g.fillRect(0, h - 34, w, 34);
      }
      // Boş etiket: sararmış, lekeli kâğıt (yazı yok)
      if (i % 4 !== 3) {
        const lx = 9;
        const ly = range(44, 78);
        const lh = range(44, 70);
        g.fillStyle = `rgb(${range(140, 165)},${range(126, 146)},${range(92, 108)})`;
        g.fillRect(lx, ly, w - 18, lh);
        g.strokeStyle = 'rgba(40,28,16,0.6)';
        g.lineWidth = 1;
        g.strokeRect(lx + 0.5, ly + 0.5, w - 19, lh - 1);
        for (let k = 0; k < 5; k++) blot(range(lx, w - lx), range(ly, ly + lh), range(6, 16), range(6, 14), '60,40,20', range(0.2, 0.45));
        if (i % 2) {
          // Kopmuş etiket köşesi
          g.fillStyle = base;
          g.beginPath();
          g.moveTo(w - 9, ly + lh);
          g.lineTo(w - 9, ly + lh - range(12, 22));
          g.lineTo(w - 9 - range(12, 24), ly + lh);
          g.fill();
        }
      }
      // Üst ve alt uçta tüylenmiş, açılmış karton; elle tutulan orta kısımda kir
      patch(w / 2, 3, w / 2, 5, '175,155,115', 12, 0.5, 5);
      patch(w / 2, h - 3, w / 2, 6, '175,155,115', 14, 0.55, 5);
      blot(w / 2, h * 0.62, w, 60, '12,8,5', range(0.15, 0.4));
      scratches(w, h, 6, 30);
      // Kenarlar koyu: sırtın yuvarlaklığı ve yan yana dosyalar arasındaki gölge
      for (const [x0, x1] of [[0, 13], [w, w - 13]]) {
        const grad = g.createLinearGradient(x0, 0, x1, 0);
        grad.addColorStop(0, 'rgba(4,3,2,0.8)');
        grad.addColorStop(1, 'rgba(4,3,2,0)');
        g.fillStyle = grad;
        g.fillRect(Math.min(x0, x1), 0, 13, h);
      }
    });
  });

  // --- Evrak destesi: yan yüz (kâğıt katları) ve üst yüz ---
  const TWINE = '#2a1c10';
  region(REGION.paperSide, (w, h) => {
    g.fillStyle = '#82734f';
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += range(1.2, 3)) {
      g.strokeStyle = rand() < 0.5 ? `rgba(30,22,12,${range(0.25, 0.6)})` : `rgba(190,172,128,${range(0.15, 0.4)})`;
      g.lineWidth = range(0.6, 1.4);
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(w, y + range(-1, 1));
      g.stroke();
    }
    for (let i = 0; i < 16; i++) blot(range(0, w), range(0, h), range(15, 50), range(10, 30), '35,24,12', range(0.2, 0.45));
    g.fillStyle = TWINE;
    g.fillRect(w / 2 - 2.5, 0, 5, h);
    for (const x of [0, w]) blot(x, h / 2, 34, h, '8,6,4', 0.6);
  });
  region(REGION.paperTop, (w, h) => {
    g.fillStyle = '#8c7c57';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) blot(range(0, w), range(0, h), range(8, 40), range(8, 40), rand() < 0.7 ? '45,32,16' : '185,168,125', range(0.1, 0.3));
    g.strokeStyle = 'rgba(35,25,14,0.5)';
    g.lineWidth = 1;
    for (let i = 0; i < 4; i++) g.strokeRect(range(2, 9), range(2, 9), w - range(6, 18), h - range(6, 18)); // kayık kâğıt kenarları
    g.fillStyle = TWINE;
    g.fillRect(w / 2 - 2.5, 0, 5, h);
    g.fillRect(0, h / 2 - 2.5, w, 5);
    blot(w / 2, h / 2, 9, 9, '20,13,7', 1);
    blot(w, h, 90, 90, '8,6,4', 0.55);
  });

  return texture('evrak_dolabi_doku');
}

export function createFilingCabinet() {
  const place = seeded(77);
  const uvAt = (rect, s, t) => regionUV(ATLAS, rect, s, t);
  // Bölgenin tamamına yayılan eşleme; flipS yatayda ayna, turn yüzü çeyrek tur döndürür.
  const fill = (rect, { flipS = false, turn = false } = {}) => () => (s, t) => {
    const a = flipS ? 1 - s : s;
    return turn ? uvAt(rect, t, a) : uvAt(rect, a, t);
  };
  // Genel ahşap: her yüze bölgede rastgele bir yer; damar yüzün uzun kenarı boyunca.
  const PX_PER_M = 640;
  const woodUV = ({ la, lb }) => {
    const [, , rw, rh] = REGION.wood;
    const alongA = la >= lb;
    const fw = Math.min(1, ((alongA ? la : lb) * PX_PER_M) / rw);
    const fh = Math.min(1, ((alongA ? lb : la) * PX_PER_M) / rh);
    const ox = place() * (1 - fw);
    const oy = place() * (1 - fh);
    return (s, t) => uvAt(REGION.wood, ox + (alongA ? s : t) * fw, oy + (alongA ? t : s) * fh);
  };

  // Ölçüler
  const BACK = -0.225;
  const BODY_FRONT = 0.165; // gövdenin ön yüzü; korniş, bel silmesi ve süpürgelik 0,225'e taşar
  const bodyDepth = BODY_FRONT - BACK;
  const bodyZ = (BODY_FRONT + BACK) / 2;
  const LOW0 = 0.08;
  const LOW1 = 0.85;
  const UP0 = 0.89;
  const UP1 = 1.98;
  const SHELF = 0.025;
  const CLEAR = (UP1 - UP0 - 2 * SHELF) / 3; // bir raf gözünün iç yüksekliği
  const INNER = 0.54; // raf gözünün yarı genişliği

  // Dış yüzeyler yere yaklaştıkça kirden koyulaşır; raf gözlerinin içi gölgede kalır.
  const outside = (x, y) => 0.6 + 0.4 * THREE.MathUtils.smoothstep(y, 0, 0.5);
  const inside = (x, y, z) => 0.3 + 0.45 * THREE.MathUtils.smoothstep(z, -0.2, BODY_FRONT);
  const board = (w, h, d, x, y, z, skip = '', tone = outside) => boxGeometry(w, h, d, x, y, z, { skip, uv: woodUV, tone });

  const wood = [
    board(1.2, LOW0, 0.45, 0, LOW0 / 2, 0, 'ny', (x, y) => 0.55 + 2 * y), // süpürgelik
    board(1.14, LOW1 - LOW0, bodyDepth, 0, (LOW0 + LOW1) / 2, bodyZ, 'py ny'), // alt gövde
    board(1.2, 0.04, 0.45, 0, LOW1 + 0.02, 0), // bel silmesi (alt rafın tabanı)
    // Üst kısım: iki yan, arkalık, iki raf
    ...[-1, 1].map((s) =>
      board(0.03, UP1 - UP0, bodyDepth, s * 0.555, (UP0 + UP1) / 2, bodyZ, 'py ny', (x, y, z, face) =>
        face === (s > 0 ? 'nx' : 'px') ? inside(x, y, z) : outside(x, y),
      ),
    ),
    board(1.08, UP1 - UP0, 0.015, 0, (UP0 + UP1) / 2, BACK + 0.0075, 'px nx py ny', (x, y, z, face) => (face === 'pz' ? 0.3 : outside(x, y))),
    ...[1, 2].map((i) => {
      const y = UP0 + i * CLEAR + (i - 0.5) * SHELF;
      return board(1.08, SHELF, bodyDepth - 0.015, 0, y, bodyZ + 0.0075, 'px nx nz', (x, yy, z, face) => (face === 'pz' ? 0.95 : inside(x, yy, z)));
    }),
    // Korniş: iki kademeli sade silme
    board(1.17, 0.05, bodyDepth + 0.03, 0, UP1 + 0.025, bodyZ + 0.015, 'py', (x, y, z, face) => (face === 'ny' ? inside(x, y, z) : 1)),
    board(1.2, 0.07, 0.45, 0, 2.065, 0),
  ];

  // --- Kapaklar: sol kapak menteşesinden sarkmış, hafif aralık ---
  const DOOR_W = 0.535;
  const DOOR_H = 0.7;
  const brass = [];
  for (const s of [-1, 1]) {
    const door = boxGeometry(DOOR_W, DOOR_H, 0.02, (-s * DOOR_W) / 2, 0, 0.01, {
      skip: 'nz',
      uv: (f) => (f.name === 'pz' ? fill(REGION.door, { flipS: s > 0 })(f) : woodUV(f)),
      tone: (x, y) => 0.62 + 0.38 * THREE.MathUtils.smoothstep(y, -DOOR_H / 2, 0.1),
    });
    // Kulp: kararmış pirinç topuz, kapakların buluştuğu kenarda
    const knob = new THREE.LatheGeometry(
      [[0.006, 0], [0.006, 0.008], [0.013, 0.014], [0.015, 0.021], [0.011, 0.027], [0, 0.029]].map(([r, y]) => new THREE.Vector2(r, y)),
      8,
    );
    knob.rotateX(Math.PI / 2).translate(-s * (DOOR_W - 0.04), 0.04, 0.02);
    knob.deleteAttribute('uv');
    // Menteşe dış kenarda: kapak o kenar etrafında döner
    const m = new THREE.Matrix4()
      .makeTranslation(s * (DOOR_W + 0.004), (LOW0 + LOW1) / 2 - (s < 0 ? 0.004 : 0), BODY_FRONT)
      .multiply(new THREE.Matrix4().makeRotationY(s < 0 ? 0.012 : -0.003))
      .multiply(new THREE.Matrix4().makeRotationZ(s < 0 ? -0.006 : 0));
    wood.push(door.applyMatrix4(m));
    brass.push(knob.toNonIndexed().applyMatrix4(m));
  }

  // --- Raflardaki dosyalar ve evrak desteleri ---
  const rand = seeded(1914);
  const range = (a, b) => a + rand() * (b - a);
  const shelfTone = (x, y, z) => 0.35 + 0.65 * THREE.MathUtils.smoothstep(z, -0.16, 0.14);
  const paper = [];
  // Dik duran dosya: sırtı öne bakar. Köşesi (0, 0)'da; lean ile yana yatırılır.
  const folder = (thick, height, frontZ) => {
    const variant = Math.floor(rand() * SPINES);
    const depth = Math.min(0.3, frontZ - (BACK + 0.02));
    const plain = ([x, y, w]) => [x, y + 196, w, 56]; // sırtın etiketsiz alt kısmı
    return boxGeometry(thick, height, depth, thick / 2, height / 2, frontZ - depth / 2, {
      skip: 'nz ny',
      uv: (f) => (f.name === 'pz' ? fill(spineRect(variant))(f) : f.name === 'py' ? fill(REGION.paperSide)(f) : fill(plain(spineRect(variant)))(f)),
      tone: shelfTone,
    });
  };
  const bundle = (w, h, d, x, y, z, turn) =>
    boxGeometry(w, h, d, 0, h / 2, 0, {
      skip: 'ny nz',
      uv: (f) => fill(f.name === 'py' ? REGION.paperTop : REGION.paperSide)(f),
      tone: () => 1,
    })
      .rotateY(turn)
      .translate(x, y, z);

  for (let shelf = 0; shelf < 3; shelf++) {
    const floor = UP0 + shelf * (CLEAR + SHELF);
    const leanAt = range(-0.3, 0.3); // her rafta en az bir dosya yana yatsın
    let leaned = false;
    let x = -INNER + 0.004;
    while (x < INNER - 0.03) {
      const room = INNER - x;
      const roll = rand();
      if (roll < 0.13 && room > 0.3) {
        // Sicimle bağlı evrak desteleri: üst üste bir ya da iki deste, bazen üstünde yatık bir dosya
        const w = range(0.2, 0.25);
        let y = floor;
        const piles = rand() < 0.6 ? 2 : 1;
        for (let k = 0; k < piles; k++) {
          const h = range(0.05, 0.11);
          const g = bundle(w - k * range(0.01, 0.03), h, 0.29, x + w / 2 + range(-0.006, 0.006), y, range(-0.05, -0.03), range(-0.07, 0.07));
          const pos = g.attributes.position;
          const col = g.attributes.color;
          for (let i = 0; i < pos.count; i++) col.setXYZ(i, ...Array(3).fill(shelfTone(0, 0, pos.getZ(i))));
          paper.push(g);
          y += h;
        }
        if (rand() < 0.6) {
          const variant = Math.floor(rand() * SPINES);
          const t = range(0.03, 0.05);
          const flat = boxGeometry(w + 0.04, t, 0.27, 0, t / 2, 0, {
            skip: 'ny nz',
            uv: (f) => fill(f.name === 'pz' ? spineRect(variant) : [spineRect(variant)[0], spineRect(variant)[1] + 196, 64, 56], { turn: f.name === 'pz' })(f),
            tone: () => 1,
          })
            .rotateY(range(-0.12, 0.12))
            .translate(x + w / 2, y, range(-0.045, -0.025));
          const pos = flat.attributes.position;
          for (let i = 0; i < pos.count; i++) flat.attributes.color.setXYZ(i, ...Array(3).fill(shelfTone(0, 0, pos.getZ(i))));
          paper.push(flat);
        }
        x += w + range(0.006, 0.016);
        continue;
      }
      const thick = range(0.028, 0.072);
      const height = Math.min(CLEAR - 0.012, range(0.26, 0.335));
      const frontZ = 0.14 - range(0, 0.055); // sırtlar aynı hizada değil
      const wantLean = (!leaned && x > leanAt) || roll > 0.93;
      const angle = range(0.16, 0.34);
      const span = height * Math.sin(angle) + thick * Math.cos(angle);
      if (wantLean && room > span + 0.05) {
        // Yana yatmış dosya: üst köşesi yanındaki dosyaya dayanır
        const toRight = rand() < 0.5;
        const g = folder(thick, height, frontZ);
        if (toRight) g.rotateZ(-angle).translate(x, floor, 0);
        else g.translate(-thick, 0, 0).rotateZ(angle).translate(x + span, floor, 0);
        paper.push(g);
        leaned = true;
        x += span + 0.002;
      } else if (room > thick) {
        paper.push(folder(thick, height, frontZ).translate(x, floor, 0));
        x += thick + (rand() < 0.15 ? range(0.003, 0.012) : 0.0015);
      } else break;
    }
  }

  const map = paintAtlas();
  const root = new THREE.Group();
  root.name = 'evrak_dolabi';
  const body = new THREE.Mesh(mergeGeometries(wood), new THREE.MeshStandardMaterial({ name: 'eski_ahsap', map, vertexColors: true, roughness: 0.8, metalness: 0 }));
  body.name = 'govde';
  const files = new THREE.Mesh(mergeGeometries(paper), new THREE.MeshStandardMaterial({ name: 'karton_ve_kagit', map, vertexColors: true, roughness: 0.95, metalness: 0 }));
  files.name = 'dosyalar';
  const knobs = new THREE.Mesh(mergeGeometries(brass), new THREE.MeshStandardMaterial({ name: 'kararmis_pirinc', color: 0x3f3118, roughness: 0.82, metalness: 0.45 }));
  knobs.name = 'kulplar';
  root.add(body, files, knobs);
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
