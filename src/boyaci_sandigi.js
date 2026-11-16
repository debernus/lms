import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Osmanlı boyacı (ayakkabı boyacısı) sandığı; sahne eşyası. Kakma işlemeli ahşap sandık, pirinç
// ayaklar ve dilimli etek, üstte ayak koyma yeri ve köşe topuzları, yanda pirinç şişelik ve içinde
// pirinç kapaklı cam şişeler. Gerçek boyut (yaklaşık 66 x 20 x 52 cm), 1 birim = 1 metre, Y yukarı,
// ön yüz +Z; taban y = 0'da, taban ortası (0, 0, 0)'da. Hareketli parça yok.

const L = 0.5, D = 0.2, H = 0.2, FOOT = 0.1; // sandık gövdesi ve ayak yüksekliği
const SHIFT = -0.08; // şişelik sağa taştığı için bütün model sola kaydırılır: taban ortası 0'a gelir

// Ön ve arka yüzün kakma süslemesi: ahşap zemine krem rengi kemik kakma motifler.
function inlayTexture() {
  const W = 1024, Hh = 400;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = Hh;
  const g = c.getContext('2d');
  let seed = 11;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  g.fillStyle = '#6b3320';
  g.fillRect(0, 0, W, Hh);
  for (let i = 0; i < 260; i++) { // ahşap damarı
    g.strokeStyle = rand() < 0.6 ? `rgba(40,16,8,${0.1 + rand() * 0.25})` : `rgba(150,90,50,${0.08 + rand() * 0.15})`;
    g.lineWidth = 0.6 + rand() * 1.6;
    const y = rand() * Hh;
    g.beginPath();
    g.moveTo(0, y);
    g.bezierCurveTo(W * 0.3, y + rand() * 8 - 4, W * 0.7, y + rand() * 8 - 4, W, y + rand() * 6 - 3);
    g.stroke();
  }
  const BONE = '#d9cba0', DARK = '#1c120c';
  const diamond = (x, y, w, h) => {
    g.beginPath();
    g.moveTo(x, y - h); g.lineTo(x + w, y); g.lineTo(x, y + h); g.lineTo(x - w, y);
    g.closePath();
    g.fill();
  };
  // Kenar: baklava dizisi ve içte iki sıra ince çizgi
  g.fillStyle = BONE;
  for (let x = 40; x < W; x += 105) { diamond(x, 22, 26, 9); diamond(x, Hh - 22, 26, 9); }
  for (let y = 80; y < Hh - 40; y += 80) { diamond(18, y, 8, 22); diamond(W - 18, y, 8, 22); }
  g.strokeStyle = BONE;
  g.lineWidth = 4;
  g.strokeRect(44, 46, W - 88, Hh - 92);
  g.setLineDash([10, 6]);
  g.lineWidth = 3;
  g.strokeStyle = '#b9824a';
  g.strokeRect(54, 56, W - 108, Hh - 112);
  g.setLineDash([]);
  const oval = (x, y, rx, ry, rot, inner) => {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.fillStyle = BONE;
    g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, 7); g.fill();
    g.fillStyle = DARK;
    inner();
    g.restore();
  };
  // Orta madalyon: çift başlı kuş
  oval(W / 2, Hh / 2, 150, 92, 0, () => {
    g.beginPath(); g.ellipse(0, 12, 26, 52, 0, 0, 7); g.fill();
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(s * 14, -6); g.quadraticCurveTo(s * 70, -64, s * 118, -20); g.quadraticCurveTo(s * 80, 0, s * 96, 40); g.quadraticCurveTo(s * 50, 30, s * 18, 44); g.closePath(); g.fill();
      g.beginPath(); g.ellipse(s * 20, -52, 13, 18, s * 0.5, 0, 7); g.fill();
      g.beginPath(); g.moveTo(s * 28, -60); g.lineTo(s * 50, -56); g.lineTo(s * 28, -48); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(s * 6, 60); g.lineTo(s * 26, 84); g.lineTo(s * 2, 78); g.closePath(); g.fill();
    }
  });
  // İki yanda eğik oval madalyonlar (yaprak motifli) ve köşe üçgenleri
  for (const s of [-1, 1]) {
    oval(W / 2 + s * 265, Hh / 2, 44, 88, s * 0.32, () => {
      g.beginPath(); g.ellipse(0, 0, 20, 70, 0, 0, 7); g.fill();
      g.fillStyle = BONE;
      g.fillRect(-2, -62, 4, 124);
    });
    g.fillStyle = BONE;
    g.beginPath(); g.moveTo(W / 2 + s * 452, Hh - 70); g.lineTo(W / 2 + s * 452, 150); g.lineTo(W / 2 + s * 340, Hh - 70); g.closePath(); g.fill();
    g.fillStyle = DARK;
    g.beginPath(); g.moveTo(W / 2 + s * 438, Hh - 84); g.lineTo(W / 2 + s * 438, 200); g.lineTo(W / 2 + s * 372, Hh - 84); g.closePath(); g.fill();
  }
  // Aralara serpiştirilmiş küçük hayvan figürleri (horoz, geyik, balık) ve noktalar: basit kakma biçimler
  const beast = (x, y, flip) => {
    g.save();
    g.translate(x, y);
    g.scale(flip, 1);
    g.fillStyle = BONE;
    g.beginPath(); g.ellipse(0, 0, 20, 10, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(22, -12, 8, 7, 0, 0, 7); g.fill();
    g.fillRect(-14, 6, 5, 16); g.fillRect(10, 6, 5, 16);
    g.beginPath(); g.moveTo(-18, -4); g.lineTo(-34, -16); g.lineTo(-22, 4); g.closePath(); g.fill();
    g.restore();
  };
  beast(W / 2 - 180, 100, 1); beast(W / 2 + 180, 100, -1); beast(W / 2 - 380, 100, 1); beast(W / 2 + 380, 100, -1);
  g.fillStyle = BONE;
  for (const [x, y] of [[-190, 300], [190, 300], [-120, 330], [120, 330], [0, 340], [-330, 318], [330, 318]]) {
    g.beginPath(); g.ellipse(W / 2 + x, y, 13, 6, x * 0.004, 0, 7); g.fill();
  }
  // Kullanılmışlık: kenarlarda kararma
  const shade = g.createLinearGradient(0, 0, 0, Hh);
  shade.addColorStop(0, 'rgba(0,0,0,0.25)'); shade.addColorStop(0.2, 'rgba(0,0,0,0)'); shade.addColorStop(0.8, 'rgba(0,0,0,0)'); shade.addColorStop(1, 'rgba(0,0,0,0.3)');
  g.fillStyle = shade;
  g.fillRect(0, 0, W, Hh);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.name = 'sandik_kakma';
  return t;
}

export function createBoyaciSandigi() {
  const parts = { ahsap: [], koyu: [], pirinc: [], kapak: [], cam: [], kakma: [] };
  const add = (key, g) => parts[key].push(g.index ? g.toNonIndexed() : g);
  const box = (key, w, h, d, x, y, z) => add(key, new THREE.BoxGeometry(w, h, d).translate(x, y, z));
  const lathe = (key, profile, x, y, z, segs = 12) => add(key, new THREE.LatheGeometry(profile.map(([r, h]) => new THREE.Vector2(r, h)), segs).translate(x, y, z));

  // --- Sandık gövdesi ve üst tabla ---
  box('ahsap', L, H, D, 0, FOOT + H / 2, 0);
  box('ahsap', L + 0.012, 0.012, D + 0.012, 0, FOOT + H + 0.006, 0);
  const panel = new THREE.PlaneGeometry(L - 0.006, H - 0.006);
  add('kakma', panel.clone().translate(0, FOOT + H / 2, D / 2 + 0.0008));
  add('kakma', panel.clone().rotateY(Math.PI).translate(0, FOOT + H / 2, -D / 2 - 0.0008));

  // --- Pirinç ayaklar ve aralarındaki dilimli etek ---
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    box('pirinc', 0.075, FOOT + 0.02, 0.06, sx * (L / 2 - 0.03), (FOOT + 0.02) / 2, sz * (D / 2 - 0.022));
    box('pirinc', 0.085, 0.014, 0.068, sx * (L / 2 - 0.03), 0.007, sz * (D / 2 - 0.022)); // taban pabucu
  }
  const apron = new THREE.Shape();
  const A0 = -L / 2 + 0.07, A1 = L / 2 - 0.07, N = 5, w = (A1 - A0) / N;
  apron.moveTo(A0, 0.022);
  apron.lineTo(A0, 0);
  for (let i = 0; i < N; i++) apron.absarc(A0 + w * (i + 0.5), 0, w / 2, Math.PI, Math.PI * 2, false); // aşağı sarkan yarım daire dilimler
  apron.lineTo(A1, 0.022);
  apron.closePath();
  const apronGeo = new THREE.ExtrudeGeometry(apron, { depth: 0.008, bevelEnabled: false, curveSegments: 10 });
  for (const sz of [-1, 1]) add('ahsap', apronGeo.clone().translate(0, FOOT - 0.012, sz * (D / 2 - 0.004) - 0.004));

  // --- Köşe topuzları ---
  const finial = [[0.016, 0], [0.018, 0.006], [0.007, 0.02], [0.005, 0.03], [0.012, 0.042], [0.013, 0.05], [0.008, 0.06], [0.003, 0.068], [0.0035, 0.074], [0, 0.078]];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) lathe('pirinc', finial, sx * (L / 2 - 0.022), FOOT + H + 0.012, sz * (D / 2 - 0.022), 10);

  // --- Ayak koyma yeri: sütun üstünde, ayakkabı tabanı biçiminde eğik tabla ---
  const TOP = FOOT + H + 0.012;
  lathe('koyu', [[0.034, 0], [0.036, 0.008], [0.022, 0.03], [0.02, 0.06], [0.026, 0.078]], 0.0, TOP, 0.0, 10);
  const sole = new THREE.Shape();
  sole.moveTo(-0.085, 0);
  sole.bezierCurveTo(-0.09, 0.03, -0.05, 0.036, -0.02, 0.028); // topuk
  sole.bezierCurveTo(0.01, 0.022, 0.03, 0.04, 0.07, 0.04); // taban
  sole.bezierCurveTo(0.1, 0.038, 0.105, 0.0, 0.105, 0);
  sole.bezierCurveTo(0.105, -0.036, 0.09, -0.04, 0.07, -0.04);
  sole.bezierCurveTo(0.03, -0.04, 0.01, -0.022, -0.02, -0.028);
  sole.bezierCurveTo(-0.05, -0.036, -0.09, -0.03, -0.085, 0);
  const soleGeo = new THREE.ExtrudeGeometry(sole, { depth: 0.014, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 2, curveSegments: 8 });
  add('koyu', soleGeo.rotateX(-Math.PI / 2).rotateZ(0.16).rotateY(0.25).translate(0.0, TOP + 0.078, 0.0));

  // --- Pirinç şişelik: sandığın sağ yanına asılı, üstü açık kutu ---
  const BX = L / 2 + 0.082, BW = 0.16, BH = 0.13, BY = FOOT + H - BH + 0.012, T = 0.004;
  box('pirinc', BW, T, D, BX, BY + T / 2, 0); // taban
  for (const sz of [-1, 1]) box('pirinc', BW, BH, T, BX, BY + BH / 2, sz * (D / 2 - T / 2));
  box('pirinc', T, BH, D, BX + BW / 2 - T / 2, BY + BH / 2, 0);
  box('pirinc', T, BH, D, BX - BW / 2 + T / 2, BY + BH / 2, 0);
  // Kabartma süs: ön ve yan yüzlerde ortada göbek, çevresinde kabaralar
  const boss = (x, y, z, r, ny) => add('pirinc', new THREE.SphereGeometry(r, 10, 6).scale(ny ? 0.45 : 1, 1, ny ? 1 : 0.45).translate(x, y, z));
  for (const sz of [-1, 1]) {
    boss(BX, BY + BH / 2, sz * (D / 2 + 0.001), 0.02, false);
    for (let k = 0; k < 8; k++) boss(BX + Math.cos((k / 8) * 6.283) * 0.05, BY + BH / 2 + Math.sin((k / 8) * 6.283) * 0.045, sz * (D / 2 + 0.001), 0.006, false);
  }
  boss(BX + BW / 2, BY + BH / 2, 0, 0.022, true);
  for (let k = 0; k < 8; k++) boss(BX + BW / 2, BY + BH / 2 + Math.sin((k / 8) * 6.283) * 0.045, Math.cos((k / 8) * 6.283) * 0.065, 0.006, true);

  // --- Şişeler: cam gövde, pirinç boyunluk ve soğan biçimli uzun kapak ---
  const bottle = [[0, 0.002], [0.031, 0.002], [0.032, 0.012], [0.032, 0.115], [0.026, 0.132], [0.016, 0.14]];
  const collar = [[0.017, 0.138], [0.03, 0.142], [0.031, 0.165], [0.027, 0.18], [0.012, 0.19]];
  const stopper = [[0.011, 0.188], [0.014, 0.2], [0.009, 0.212], [0.02, 0.24], [0.026, 0.275], [0.024, 0.31], [0.014, 0.34], [0.004, 0.356], [0, 0.358]];
  for (const [dx, dz, lift] of [[-0.038, 0.048, 0], [0.038, 0.048, 0.004], [-0.038, -0.048, 0.01], [0.038, -0.048, 0.006]]) {
    lathe('cam', bottle, BX + dx, BY + T, dz, 12);
    lathe('pirinc', collar, BX + dx, BY + T, dz, 12);
    lathe('kapak', stopper, BX + dx, BY + T + lift, dz, 12);
  }

  const std = (name, o) => new THREE.MeshStandardMaterial({ name, ...o });
  const materials = {
    ahsap: std('ahsap', { color: 0x5e2c1b, roughness: 0.62 }),
    koyu: std('koyu_ahsap', { color: 0x2c1810, roughness: 0.55 }),
    pirinc: std('eski_pirinc', { color: 0x7d6230, roughness: 0.5, metalness: 0.75 }),
    kapak: std('parlak_pirinc', { color: 0x9a7634, roughness: 0.32, metalness: 0.85 }),
    cam: std('cam', { color: 0xdfe6e3, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.35 }),
    kakma: std('kakma', { map: inlayTexture(), roughness: 0.6 }),
  };
  const names = { ahsap: 'sandik', koyu: 'ayak_koyma', pirinc: 'pirinc_aksam', kapak: 'sise_kapaklari', cam: 'siseler', kakma: 'kakma_yuzler' };
  const root = new THREE.Group();
  root.name = 'boyaci_sandigi';
  for (const key of Object.keys(parts)) {
    const mesh = new THREE.Mesh(mergeGeometries(parts[key]).translate(SHIFT, 0, 0), materials[key]);
    mesh.name = names[key];
    mesh.castShadow = key !== 'cam';
    mesh.receiveShadow = true;
    root.add(mesh);
  }
  return root;
}
