import * as THREE from 'three';
import { canvasTexture } from './halk2.js';
import { Part } from './arapcami.js';
import fontUrl from '@fontsource/amiri/files/amiri-arabic-700-normal.woff2';

// Etiket yazıları için Arap harfli font (Amiri, OFL)
document.fonts.add(await new FontFace('AmiriHokka', `url(${fontUrl})`, { weight: '700' }).load());
// Etiketler Osmanlıca: mavi, kırmızı, siyah
const ETIKET = { mavi: 'ماوی', kirmizi: 'قرمزی', siyah: 'سیاه' };

// Masa hokkalığı: önünde kalem oluğu olan ahşap tabla, arkada üç gözlü kutu. Soldaki iki gözün kapağı
// kapalı (pirinç etiketler Osmanlıca: mavi, kırmızı), sağdaki açık ve dik durur (siyah); açık gözde seramik hokka ve
// tüy kalem. Eskimiş, çizik ahşap. 1 birim = 1 metre, Y yukarı, ön +Z, taban y = 0, merkezde.
// Parçalar: hokkalik_govde, kapak_1, kapak_2, kapak_3 (açık), hokka, tuy_kalem.

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const ALL = ['+x', '-x', '+z', '-z', '+y', '-y'];
const HX = 0.15, BACK = -0.085, FRONT = 0.085, TOP = 0.075, BASE = 0.012, T = 0.008;

export function createHokkalik() {
  const root = new THREE.Group();
  root.name = 'hokkalik';
  const rand = rng(1907);
  const wood = canvasTexture('eski_ceviz', 512, 512, (g) => {
    g.fillStyle = '#7a4a30';
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 420; i++) {
      g.fillStyle = `rgba(${rand() < 0.6 ? '40,20,10' : '190,140,100'},${0.06 + rand() * 0.16})`;
      g.fillRect(rand() * 512, rand() * 512, 40 + rand() * 260, 1 + rand() * 2.5);
    }
    // Yıpranma: aşınmış açık bölgeler, mürekkep lekeleri, çizikler
    g.filter = 'blur(10px)';
    for (let i = 0; i < 22; i++) {
      g.fillStyle = i % 4 === 0 ? `rgba(120,30,40,${0.12 + rand() * 0.12})` : i % 2 ? `rgba(30,16,10,${0.12 + rand() * 0.16})` : `rgba(200,160,120,${0.08 + rand() * 0.1})`;
      g.beginPath();
      g.ellipse(rand() * 512, rand() * 512, 16 + rand() * 50, 10 + rand() * 30, rand() * 3, 0, TAU);
      g.fill();
    }
    g.filter = 'none';
    for (let i = 0; i < 70; i++) {
      g.strokeStyle = `rgba(220,190,150,${0.1 + rand() * 0.2})`;
      g.lineWidth = 0.8;
      g.beginPath();
      const x = rand() * 512, y = rand() * 512;
      g.moveTo(x, y);
      g.lineTo(x + (rand() - 0.5) * 60, y + (rand() - 0.5) * 30);
      g.stroke();
    }
  });
  const label = (key) => canvasTexture('etiket_' + (key || 'bos'), 256, 72, (g) => {
    const text = ETIKET[key];
    const grad = g.createLinearGradient(0, 0, 0, 72);
    grad.addColorStop(0, '#b79a52');
    grad.addColorStop(0.5, '#8f7436');
    grad.addColorStop(1, '#a5894a');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 72);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(${rand() < 0.5 ? '40,30,14' : '230,210,150'},${0.08 + rand() * 0.18})`;
      g.fillRect(rand() * 256, rand() * 72, 4 + rand() * 30, 1 + rand() * 2);
    }
    g.strokeStyle = 'rgba(50,36,14,0.8)';
    g.lineWidth = 3;
    g.strokeRect(5, 5, 246, 62);
    g.fillStyle = 'rgba(40,28,10,0.85)';
    g.font = '700 50px AmiriHokka';
    g.direction = 'rtl';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (text) g.fillText(text, 128, 34);
  });
  const std = (name, o) => new THREE.MeshStandardMaterial({ name, roughness: 0.8, metalness: 0, ...o });
  const M = { ahsap: std('eski_ceviz', { map: wood }) };
  for (const t of ['mavi', 'kirmizi', 'siyah', '']) M['etiket_' + t] = std('pirinc_etiket_' + (t || 'bos'), { map: label(t), roughness: 0.5, metalness: 0.7 });
  const US = 0.16;
  const mesh = (part) => {
    const m = part.mesh(M);
    m.castShadow = m.receiveShadow = true;
    root.add(m);
    return m;
  };

  // ---------- Gövde ----------
  const body = new Part('hokkalik_govde');
  const box = (x0, x1, y0, y1, z0, z1, faces = ALL) => body.box('ahsap', x0, x1, y0, y1, z0, z1, faces, US, US);
  box(-HX - 0.008, HX + 0.008, 0, BASE, BACK - 0.008, FRONT + 0.008); // taban tablası
  box(-HX + T, HX - T, BASE, 0.04, FRONT - T, FRONT, ['+z', '-z', '+y']); // ön pervaz
  box(-HX + T, HX - T, BASE, TOP, -T, 0, ['+z', '-z', '+y']); // kutunun ön duvarı
  box(-HX + T, HX - T, BASE, TOP, BACK, BACK + T, ['+z', '-z', '+y']); // arka duvar
  for (const x of [-0.048, 0.048]) box(x - T / 2, x + T / 2, BASE, TOP - 0.002, BACK + T, -T, ['+x', '-x', '+y']); // göz ayırıcıları
  // Yan duvarlar: arkada kutu yüksekliğinde, öne doğru içbükey bir eğriyle alçalır
  const profile = [[BACK, BASE], [BACK, TOP], [0, TOP]];
  for (let k = 1; k <= 8; k++) profile.push([(k / 8) * FRONT, 0.04 + 0.035 * (1 - k / 8) ** 2.4]);
  profile.push([FRONT, BASE]);
  for (const s of [-1, 1]) {
    const xo = s * HX, xi = s * (HX - T);
    for (const [x, n] of [[xo, s], [xi, -s]]) for (let k = 1; k + 1 < profile.length; k++) {
      const p = [profile[0], profile[k], profile[k + 1]];
      body.tri('ahsap', p.map(([z, y]) => V(x, y, z)), p.map(([z, y]) => [z / US, y / US]), V(n, 0, 0));
    }
    for (let k = 1; k + 1 < profile.length; k++) {
      const [z0, y0] = profile[k], [z1, y1] = profile[k + 1];
      body.quad('ahsap', [V(xo, y0, z0), V(xi, y0, z0), V(xi, y1, z1), V(xo, y1, z1)], [[0, z0 / US], [0.05, z0 / US], [0.05, z1 / US], [0, z1 / US]], V(0, z1 - z0 + 0.001, y0 - y1 + (k === profile.length - 2 ? 1 : 0)));
    }
    body.quad('ahsap', [V(xo, BASE, BACK), V(xi, BASE, BACK), V(xi, TOP, BACK), V(xo, TOP, BACK)], [[0, 0], [0.05, 0], [0.05, 0.4], [0, 0.4]], V(0, 0, -1));
  }
  mesh(body);

  // ---------- Kapaklar ----------
  const plate = (part, text, c, right, up, w, h, normal) => {
    const p = [c.clone().addScaledVector(right, -w / 2).addScaledVector(up, -h / 2), c.clone().addScaledVector(right, w / 2).addScaledVector(up, -h / 2), c.clone().addScaledVector(right, w / 2).addScaledVector(up, h / 2), c.clone().addScaledVector(right, -w / 2).addScaledVector(up, h / 2)];
    part.quad('etiket_' + text, p, [[0, 0], [1, 0], [1, 1], [0, 1]], normal);
  };
  [['kapak_1', -HX - 0.004, -0.05, 'mavi'], ['kapak_2', -0.047, 0.05, 'kirmizi']].forEach(([name, x0, x1, text]) => {
    const lid = new Part(name);
    lid.box('ahsap', x0, x1, TOP, TOP + 0.009, BACK - 0.005, 0.007, ALL, US, US);
    plate(lid, text, V((x0 + x1) / 2, TOP + 0.0098, -0.03), V(1, 0, 0), V(0, 0, -1), 0.056, 0.016, V(0, 1, 0));
    mesh(lid);
  });
  // Açık kapak: arka kenarından menteşeli, dik durur; iç yüzü öne bakar
  const open = new Part('kapak_3');
  open.box('ahsap', 0.052, HX + 0.004, TOP - 0.004, TOP + 0.088, BACK - 0.01, BACK - 0.001, ALL, US, US);
  plate(open, 'siyah', V(0.103, TOP + 0.048, BACK - 0.0002), V(1, 0, 0), V(0, 1, 0), 0.062, 0.017, V(0, 0, 1));
  plate(open, '', V(0.086, TOP + 0.012, BACK - 0.0002), V(1, 0, 0), V(0, 1, 0), 0.026, 0.012, V(0, 0, 1));
  mesh(open);

  // ---------- Hokka: ebru sırlı seramik kap, içinde mürekkep ----------
  const glaze = canvasTexture('hokka_sirri', 128, 64, (g) => {
    g.fillStyle = '#d8cdb8';
    g.fillRect(0, 0, 128, 64);
    for (let i = 0; i < 90; i++) {
      g.strokeStyle = `rgba(${rand() < 0.5 ? '90,60,40' : '40,34,30'},${0.3 + rand() * 0.4})`;
      g.lineWidth = 1 + rand() * 2;
      g.beginPath();
      const x = rand() * 128, y = rand() * 64;
      g.moveTo(x, y);
      g.quadraticCurveTo(x + (rand() - 0.5) * 30, y + (rand() - 0.5) * 20, x + (rand() - 0.5) * 30, y + (rand() - 0.5) * 20);
      g.stroke();
    }
  });
  const PX = 0.098, PZ = -0.042;
  const pot = new THREE.LatheGeometry([[0, 0], [0.024, 0], [0.029, 0.006], [0.031, 0.03], [0.03, 0.05], [0.027, 0.058], [0.02, 0.06], [0.016, 0.055], [0.016, 0.046]].map(([r, y]) => new THREE.Vector2(r, y)), 20);
  const ink = new THREE.CircleGeometry(0.0165, 16);
  ink.rotateX(-Math.PI / 2);
  ink.translate(0, 0.047, 0);
  const potMesh = new THREE.Mesh(pot, std('hokka_sirri', { map: glaze, roughness: 0.35, side: THREE.DoubleSide }));
  const inkMesh = new THREE.Mesh(ink, std('murekkep', { color: 0x08080c, roughness: 0.15 }));
  const hokka = new THREE.Group();
  hokka.name = 'hokka';
  hokka.add(potMesh, inkMesh);
  hokka.position.set(PX, BASE, PZ);
  hokka.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.add(hokka);

  // ---------- Tüy kalem: hokkadan sağa yukarı yaslanmış, alacalı tüy ----------
  const feather = canvasTexture('tuy', 64, 256, (g) => {
    g.fillStyle = '#e6dcc2';
    g.fillRect(0, 0, 64, 256);
    for (let y = 0; y < 256; y += 3) {
      g.strokeStyle = `rgba(120,96,60,${0.12 + rand() * 0.14})`;
      g.beginPath();
      g.moveTo(32, y + 8);
      g.lineTo(0, y - 6);
      g.moveTo(32, y + 8);
      g.lineTo(64, y - 6);
      g.stroke();
    }
    for (let k = 0; k < 9; k++) {
      g.fillStyle = `rgba(110,66,30,${0.45 + rand() * 0.3})`;
      const y = 20 + k * 26 + rand() * 8;
      g.beginPath();
      g.moveTo(32, y + 12);
      g.lineTo(0, y - 4);
      g.lineTo(0, y + 8);
      g.lineTo(32, y + 24);
      g.lineTo(64, y + 8);
      g.lineTo(64, y - 4);
      g.fill();
    }
    g.fillStyle = '#c9b58a';
    g.fillRect(30.5, 0, 3, 256);
  });
  const start = V(PX, BASE + 0.05, PZ), dir = V(0.74, 0.62, 0.26).normalize(), side = dir.clone().cross(V(0, 0, 1)).normalize(), LEN = 0.21;
  const pos = [], uv = [], idx = [], N = 12;
  for (let k = 0; k <= N; k++) {
    const t = k / N, s = 0.3 + 0.7 * t, w = 0.021 * Math.sin(Math.PI * Math.min(1, t * 1.06)) ** 0.55 * (1 - 0.35 * t), c = start.clone().addScaledVector(dir, LEN * s);
    c.z += 0.01 * Math.sin(t * 2.4); // hafif kıvrım
    for (const [e, u] of [[-1, 0], [0, 0.5], [1, 1]]) {
      const p = c.clone().addScaledVector(side, e * w);
      p.z -= 0.004 * Math.abs(e);
      pos.push(p.x, p.y, p.z);
      uv.push(u, t);
    }
    if (k < N) for (const o of [0, 1]) {
      const a = k * 3 + o;
      idx.push(a, a + 1, a + 4, a, a + 4, a + 3);
    }
  }
  const vane = new THREE.BufferGeometry();
  vane.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  vane.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  vane.setIndex(idx);
  vane.computeVertexNormals();
  const shaft = new THREE.CylinderGeometry(0.0009, 0.0022, LEN * 1.06, 6);
  shaft.translate(0, LEN * 0.5, 0);
  shaft.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir));
  shaft.translate(start.x - dir.x * 0.012, start.y - dir.y * 0.012, start.z - dir.z * 0.012);
  const quill = new THREE.Group();
  quill.name = 'tuy_kalem';
  quill.add(new THREE.Mesh(vane, std('tuy', { map: feather, roughness: 0.95, side: THREE.DoubleSide })), new THREE.Mesh(shaft, std('tuy_sapi', { color: 0xd8cba4, roughness: 0.6 })));
  quill.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  root.add(quill);
  return root;
}
