import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createPainter, mapUVs, regionUV, RUB, GRIME } from './paint.js';

// Thonet tarzı bükme ahşap sandalye (1914, Osmanlı İstanbul'u): kahvehanelerde ve kalem
// odalarında yıllarca kullanılmış. Birim metre, Y yukarı, taban ortası (0, 0, 0), ön yüz +Z.
// Oturma yüksekliği 0,46 m, toplam yükseklik 0,9 m, oturma yeri 0,42 m çapında.

const ATLAS = 1024;
const STRIP = 64;
const REGION = {
  outer: [0, 0, ATLAS, STRIP], // dış kemer: sol ayak -> tepe -> sağ ayak
  inner: [0, STRIP, ATLAS, STRIP], // iç kemer
  legs: [0, STRIP * 2, ATLAS, STRIP], // ön ayaklar: üst -> alt
  hoop: [0, STRIP * 3, ATLAS, STRIP], // ayak halkası: çevre boyunca
  seat: [0, STRIP * 4, ATLAS, STRIP * 2], // oturma kasnağı: çevre boyunca (iki uç = ön)
  cane: [0, 384, 640, 640], // hasır örgü
};

function paintAtlas() {
  const { g, rand, range, region, blot, patch, wood, scratches, texture } = createPainter(ATLAS, 14);
  const BASE = '#2b190f';

  const strip = (rect, wear) =>
    region(rect, (w, h) => {
      wood(w, h, BASE);
      scratches(w, h, 60, 40);
      for (let i = 0; i < 10; i++) blot(range(0, w), range(0, h), range(10, 40), range(8, 20), RUB, range(0.1, 0.25));
      for (let i = 0; i < 10; i++) blot(range(0, w), range(0, h), range(20, 60), range(10, 30), GRIME, range(0.2, 0.45));
      wear(w, h);
    });
  // Yere değen uç: kir, ıslaklıktan kararma ve kopmuş cila
  const foot = (x, h) => {
    blot(x, h / 2, 110, h, GRIME, 0.75);
    patch(x, h / 2, 26, h / 2, '170,130,90', 9, 0.6, 6);
  };

  strip(REGION.outer, (w, h) => {
    foot(0, h);
    foot(w, h);
    patch(w / 2, h / 2, 95, h / 2, RUB, 46, 0.6); // tepe: sandalyeyi tutan eller cilayı götürmüş
    for (const x of [w * 0.235, w * 0.765]) patch(x, h / 2, 40, h / 2, RUB, 12, 0.35); // oturma hizası
  });
  strip(REGION.inner, (w, h) => {
    patch(w / 2, h / 2, 110, h / 2, RUB, 26, 0.45); // sırtın sürtündüğü yer
    for (const x of [0, w]) blot(x, h / 2, 70, h, GRIME, 0.5);
  });
  strip(REGION.legs, (w, h) => {
    foot(w, h);
    patch(w * 0.62, h / 2, 130, h / 2, RUB, 22, 0.4); // ayakkabı vuruşları
    scratches(w, h, 50, 30);
  });
  strip(REGION.hoop, (w, h) => {
    patch(w * 0.25, h / 2, 150, h / 2, RUB, 70, 0.7); // öne gelen kısım: ayak basmaktan ham ahşaba inmiş
    for (let i = 0; i < 14; i++) blot(range(w * 0.45, w), range(0, h), range(20, 50), range(10, 24), GRIME, range(0.3, 0.5));
  });
  strip(REGION.seat, (w, h) => {
    for (const x of [0, w]) patch(x, h / 2, 170, h / 2, RUB, 60, 0.6); // ön kenar: bacakların sürtündüğü yer
    for (let i = 0; i < 16; i++) blot(range(w * 0.25, w * 0.75), range(0, h), range(20, 60), range(10, 30), GRIME, range(0.25, 0.45));
  });

  // --- Hasır: Viyana örgüsü; yaşlanmış, kirlenmiş, bir yerinden kopmuş ---
  region(REGION.cane, (w, h) => {
    g.fillStyle = '#17110b';
    g.fillRect(0, 0, w, h);
    const cell = 21;
    const strand = () => {
      const t = range(0.75, 1.05);
      return `rgb(${172 * t},${140 * t},${82 * t})`;
    };
    // Çaprazlar altta, yatay ve dikey çift şeritler üstte
    g.lineWidth = 3;
    for (let d = -h; d < w + h; d += cell) {
      for (const dir of [1, -1]) {
        g.strokeStyle = strand();
        g.globalAlpha = 0.85;
        g.beginPath();
        g.moveTo(d, dir > 0 ? 0 : h);
        g.lineTo(d + h, dir > 0 ? h : 0);
        g.stroke();
      }
    }
    g.globalAlpha = 1;
    g.lineWidth = 3.4;
    for (let c = cell / 2; c < w; c += cell) {
      for (const off of [-3.2, 3.2]) {
        g.strokeStyle = strand();
        g.beginPath();
        g.moveTo(c + off, 0);
        g.lineTo(c + off, h);
        g.stroke();
        g.strokeStyle = strand();
        g.beginPath();
        g.moveTo(0, c + off);
        g.lineTo(w, c + off);
        g.stroke();
      }
    }
    // Yılların kiri: ortada oturmaktan kararmış ve çökmüş bölge, kenarlarda toz
    for (let i = 0; i < 40; i++) blot(w / 2 + range(-150, 150), h / 2 + range(-130, 150), range(50, 130), range(50, 110), '40,26,12', range(0.12, 0.3));
    for (let i = 0; i < 60; i++) blot(range(0, w), range(0, h), range(15, 60), range(15, 60), rand() < 0.6 ? '30,20,10' : '95,70,35', range(0.1, 0.3));
    blot(430, 250, 60, 46, '25,14,8', 0.6); // dökülmüş kahve lekesi
    // Kopmuş bölüm: arka sol tarafta şeritler kırılıp sarkmış
    const hx = 215;
    const hy = 150;
    g.fillStyle = '#0d0906';
    g.beginPath();
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * 6.3;
      const r = range(20, 44);
      g.lineTo(hx + Math.cos(a) * r * 1.25, hy + Math.sin(a) * r);
    }
    g.fill();
    for (let i = 0; i < 9; i++) {
      const a = range(0, 6.3);
      g.strokeStyle = strand();
      g.lineWidth = 2.6;
      g.beginPath();
      g.moveTo(hx + Math.cos(a) * 46, hy + Math.sin(a) * 40);
      g.lineTo(hx + Math.cos(a + range(-0.5, 0.5)) * range(8, 26), hy + Math.sin(a) * range(8, 24));
      g.stroke();
    }
  });

  return texture('sandalye_doku');
}

const v = (x, y, z) => new THREE.Vector3(x, y, z);
const mirror = (points) => [...points, ...points.slice(0, -1).reverse().map((p) => v(-p.x, p.y, p.z))];

// Yere gömülen köşeleri zemin düzlemine çeker: ayak tabanı düz biter.
function ground(geometry) {
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) if (pos.getY(i) < 0) pos.setY(i, 0);
  return geometry;
}

export function createThonetChair() {
  const ROD = 0.014;
  const wood = [];

  // --- Dış kemer: arka ayaklar ve arkalık tek parça bükme çubuk ---
  const outer = mirror([
    v(-0.176, -0.012, -0.168),
    v(-0.176, 0.22, -0.147),
    v(-0.178, 0.445, -0.132),
    v(-0.176, 0.62, -0.172),
    v(-0.162, 0.76, -0.208),
    v(-0.118, 0.846, -0.227),
    v(-0.062, 0.877, -0.233),
    v(0, 0.886, -0.235), // tepe: 0,886 + çubuk yarıçapı = 0,9 m
  ]);
  const outerGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(outer, false, 'centripetal'), 52, ROD, 7);
  wood.push(ground(mapUVs(outerGeo, ATLAS, REGION.outer)));

  // --- İç kemer: kasnağın arkasından çıkıp dış kemerin içinde kalan küçük kemer ---
  const inner = mirror([
    v(-0.104, 0.44, -0.18),
    v(-0.11, 0.58, -0.186),
    v(-0.096, 0.71, -0.204),
    v(-0.056, 0.784, -0.218),
    v(0, 0.806, -0.223),
  ]);
  const innerGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(inner, false, 'centripetal'), 26, 0.011, 6);
  wood.push(mapUVs(innerGeo, ATLAS, REGION.inner));

  // --- Ön ayaklar: ince, aşağı doğru incelen ve hafif dışa açılan ---
  for (const s of [-1, 1]) {
    const top = v(s * 0.14, 0.44, 0.128);
    const bottom = v(s * 0.171, -0.012, 0.137);
    const dir = bottom.clone().sub(top);
    const leg = new THREE.CylinderGeometry(0.0155, 0.0115, dir.length(), 7, 3, true);
    mapUVs(leg, ATLAS, REGION.legs, (u, t) => [1 - t, u]); // şeridin sağ ucu = yere değen uç
    leg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(v(0, -1, 0), dir.clone().normalize()));
    const mid = top.clone().lerp(bottom, 0.5);
    wood.push(ground(leg.translate(mid.x, mid.y, mid.z)));
  }

  // --- Ayakları birleştiren halka: yıllar içinde gevşeyip hafif eğilmiş ---
  const hoop = new THREE.TorusGeometry(0.195, 0.009, 6, 28);
  mapUVs(hoop, ATLAS, REGION.hoop);
  hoop.rotateX(Math.PI / 2).rotateZ(0.02).rotateX(-0.015).translate(0, 0.22, -0.02);
  wood.push(hoop);

  // --- Oturma kasnağı: bükme ahşap halka (çap 0,42 m, üstü 0,46 m) ---
  const ring = [
    [0.172, 0.432], [0.174, 0.452], [0.18, 0.459], [0.202, 0.46], [0.21, 0.452], [0.209, 0.436], [0.2, 0.43], [0.172, 0.432],
  ];
  const seat = new THREE.LatheGeometry(ring.map(([r, y]) => new THREE.Vector2(r, y)), 28);
  wood.push(mapUVs(seat, ATLAS, REGION.seat));

  // --- Hasır: ortası oturmaktan çökmüş disk ---
  const R = 0.176;
  const SEG = 28;
  const radii = [0, 0.06, 0.12, R];
  const positions = [];
  const uvs = [];
  const indices = [];
  for (const r of radii) {
    for (let k = 0; k < SEG; k++) {
      const a = (k / SEG) * Math.PI * 2;
      const x = Math.sin(a) * r;
      const z = Math.cos(a) * r;
      positions.push(x, 0.453 - 0.013 * (1 - (r / R) ** 2), z);
      uvs.push(...regionUV(ATLAS, REGION.cane, 0.5 + x / (2 * R), 0.5 + z / (2 * R))); // dokunun altı = ön
    }
  }
  for (let j = 0; j < radii.length - 1; j++) {
    for (let k = 0; k < SEG; k++) {
      const a = j * SEG + k;
      const b = j * SEG + ((k + 1) % SEG);
      const c = a + SEG;
      const d = b + SEG;
      if (j === 0) indices.push(a, c, d); // merkez: tek üçgen
      else indices.push(a, c, d, a, d, b);
    }
  }
  let cane = new THREE.BufferGeometry();
  cane.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  cane.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  cane.setIndex(indices);
  cane.computeVertexNormals();

  // Taban ortası: dört ayağın kapladığı alanın merkezi (0, 0, 0)'a gelsin
  const shift = -(0.137 - 0.168) / 2;
  const body = mergeGeometries(wood.map((g) => (g.index ? g.toNonIndexed() : g))).translate(0, 0, shift);
  cane = cane.toNonIndexed().translate(0, 0, shift);

  const map = paintAtlas();
  const root = new THREE.Group();
  root.name = 'sandalye';
  const frame = new THREE.Mesh(body, new THREE.MeshStandardMaterial({ name: 'eski_cilali_ahsap', map, roughness: 0.62, metalness: 0 }));
  frame.name = 'iskelet';
  const weave = new THREE.Mesh(cane, new THREE.MeshStandardMaterial({ name: 'eski_hasir', map, roughness: 0.92, metalness: 0, side: THREE.DoubleSide }));
  weave.name = 'hasir';
  root.add(frame, weave);
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
