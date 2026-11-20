import * as THREE from 'three';
import { canvasTexture } from './halk2.js';

// Gaz yağı lambası (1900'ler): kararmış pirinç hazne, taç dişli başlık, fitil ve ayar düğmesi, isli cam şişe.
// 1 birim = 1 metre, Y yukarı, taban y = 0, merkezde; ayar düğmesi +Z'ye (öne) bakar. Yükseklik 0,43 m.
// Parçalar: lamba_hazne, lamba_basligi, lamba_fitili, lamba_sisesi (cam: yarı saydam).

const TAU = Math.PI * 2;
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const lathe = (profile, n = 28) => new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), n);

export function createGazLambasi() {
  const root = new THREE.Group();
  root.name = 'gaz_lambasi';
  const rand = rng(1914);
  // Eskimiş pirinç: mat sarı-kahve zemin, koyu kararma, açık çizikler, yeşilimsi küf
  const brassMap = canvasTexture('eski_pirinc', 256, 256, (g) => {
    g.fillStyle = '#8a6a34';
    g.fillRect(0, 0, 256, 256);
    g.filter = 'blur(8px)';
    for (let i = 0; i < 40; i++) {
      g.fillStyle = i % 4 === 0 ? `rgba(70,96,70,${0.12 + rand() * 0.14})` : `rgba(36,24,12,${0.14 + rand() * 0.22})`;
      g.beginPath();
      g.ellipse(rand() * 256, rand() * 256, 10 + rand() * 34, 8 + rand() * 26, rand() * 3, 0, TAU);
      g.fill();
    }
    g.filter = 'none';
    for (let i = 0; i < 160; i++) {
      g.strokeStyle = `rgba(${rand() < 0.5 ? '210,180,120' : '30,20,10'},${0.1 + rand() * 0.2})`;
      g.lineWidth = 0.7;
      g.beginPath();
      const x = rand() * 256, y = rand() * 256;
      g.moveTo(x, y);
      g.lineTo(x + (rand() - 0.5) * 40, y + (rand() - 0.5) * 8);
      g.stroke();
    }
  });
  // Cam: toz ve is lekeleri (alfa kanalı lekelerde daha yoğun)
  const glassMap = canvasTexture('isli_cam', 256, 256, (g) => {
    g.clearRect(0, 0, 256, 256);
    g.fillStyle = 'rgba(215,220,220,0.3)';
    g.fillRect(0, 0, 256, 256);
    g.filter = 'blur(6px)';
    for (let i = 0; i < 90; i++) {
      const y = rand() * 256, top = 1 - y / 256; // üst yarıda (dokuda v büyük) is daha çok
      g.fillStyle = rand() < 0.35 + 0.3 * top ? `rgba(60,58,54,${0.1 + rand() * 0.25})` : `rgba(240,240,236,${0.15 + rand() * 0.3})`;
      g.beginPath();
      g.ellipse(rand() * 256, y, 6 + rand() * 26, 6 + rand() * 30, rand() * 3, 0, TAU);
      g.fill();
    }
    g.filter = 'none';
  });
  const brass = new THREE.MeshStandardMaterial({ name: 'eski_pirinc', map: brassMap, roughness: 0.6, metalness: 0.75, side: THREE.DoubleSide });
  const dark = new THREE.MeshStandardMaterial({ name: 'kararmis_pirinc', color: 0x4a3418, roughness: 0.7, metalness: 0.6, side: THREE.DoubleSide });
  const wick = new THREE.MeshStandardMaterial({ name: 'fitil', color: 0xb8b09a, roughness: 1 });
  const glass = new THREE.MeshStandardMaterial({ name: 'isli_cam', map: glassMap, transparent: true, opacity: 0.85, roughness: 0.25, metalness: 0, side: THREE.DoubleSide, depthWrite: false });
  const add = (name, geometry, material) => {
    const m = new THREE.Mesh(geometry, material);
    m.name = name;
    m.castShadow = m.receiveShadow = true;
    root.add(m);
    return m;
  };

  // ---------- Hazne: basık, omuzlu gövde; ortasında lehim dikişi, altında ayak halkası ----------
  add('lamba_hazne', lathe([[0, 0], [0.056, 0], [0.0615, 0.003], [0.0615, 0.011], [0.058, 0.015], [0.0595, 0.04], [0.0625, 0.0445], [0.0625, 0.0485], [0.06, 0.053], [0.0605, 0.072], [0.057, 0.088], [0.047, 0.099], [0.034, 0.105], [0.028, 0.108], [0.026, 0.113], [0.026, 0.12]]), brass);

  // ---------- Başlık: bilezik, cam yuvası, taç dişler, ayar düğmesi ----------
  const burner = [lathe([[0.0265, 0.118], [0.033, 0.121], [0.035, 0.127], [0.035, 0.137], [0.03, 0.141], [0.03, 0.145], [0.037, 0.149], [0.0385, 0.154]])];
  // Taç dişler: cam şişeyi tutan yuvarlak uçlu yapraklar, hafif dışa açık
  const pos = [], idx = [], PRONGS = 12;
  for (let k = 0; k < PRONGS; k++) {
    const a0 = ((k + 0.08) / PRONGS) * TAU, a1 = ((k + 0.92) / PRONGS) * TAU, am = (a0 + a1) / 2, base = pos.length / 3;
    const pt = (a, r, y) => pos.push(Math.cos(a) * r, y, Math.sin(a) * r);
    pt(a0, 0.0385, 0.153);
    pt(a1, 0.0385, 0.153);
    pt(a1, 0.04, 0.174);
    pt(am + (a1 - am) * 0.6, 0.0408, 0.184);
    pt(am, 0.041, 0.188);
    pt(am - (am - a0) * 0.6, 0.0408, 0.184);
    pt(a0, 0.04, 0.174);
    for (let t = 1; t < 6; t++) idx.push(base, base + t, base + t + 1);
  }
  const prongs = new THREE.BufferGeometry();
  prongs.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  prongs.setAttribute('uv', new THREE.Float32BufferAttribute(pos.flatMap((v, i) => (i % 3 === 2 ? [] : [v * 8])), 2));
  prongs.setIndex(idx);
  prongs.computeVertexNormals();
  burner.push(prongs);
  // Fitil kovanı ve alev yayıcı başlık
  burner.push(lathe([[0.014, 0.141], [0.014, 0.176], [0.017, 0.18], [0.013, 0.19], [0.006, 0.193]], 16));
  // Ayar düğmesi: öne uzanan mil ve tırtıllı çark
  const shaft = new THREE.CylinderGeometry(0.0028, 0.0028, 0.034, 8);
  shaft.rotateX(Math.PI / 2);
  shaft.translate(0, 0.132, 0.05);
  const knob = new THREE.CylinderGeometry(0.0115, 0.0115, 0.006, 14);
  knob.rotateX(Math.PI / 2);
  knob.translate(0, 0.132, 0.069);
  burner.push(shaft, knob);
  const merged = mergeAll(burner);
  add('lamba_basligi', merged, dark);

  // ---------- Fitil ----------
  const wickGeo = new THREE.BoxGeometry(0.014, 0.012, 0.003);
  wickGeo.translate(0, 0.196, 0);
  add('lamba_fitili', wickGeo, wick);

  // ---------- Cam şişe: altta şişkin, yukarı doğru daralan uzun baca ----------
  add('lamba_sisesi', lathe([[0.0345, 0.152], [0.0355, 0.163], [0.041, 0.182], [0.049, 0.208], [0.0525, 0.232], [0.05, 0.256], [0.042, 0.284], [0.033, 0.31], [0.0275, 0.336], [0.0255, 0.37], [0.025, 0.41], [0.0258, 0.428], [0.025, 0.43]], 32), glass).castShadow = false;
  return root;
}
function mergeAll(list) {
  const pos = [], nor = [], uv = [], idx = [];
  let base = 0;
  for (const g of list) {
    pos.push(...g.attributes.position.array);
    nor.push(...g.attributes.normal.array);
    uv.push(...(g.attributes.uv ? g.attributes.uv.array : new Float32Array(g.attributes.position.count * 2)));
    for (const i of g.index.array) idx.push(i + base);
    base += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx);
  return out;
}
