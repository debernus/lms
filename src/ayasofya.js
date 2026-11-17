import * as THREE from 'three';
import { canvasTexture } from './halk2.js';
import { Part, opening } from './arapcami.js';

// Ayasofya (İstanbul): merkezî kubbeli ana yapı, doğu ve batıda yarım kubbeler, kuzey ve güneyde pencereli
// kemer alınlıkları ile payanda kuleleri, batıda narteks, doğuda apsis, dört minare. Önde (güneyde) üç türbe
// ayrı düğümlerdir. 1 birim = 1 metre, Y yukarı, taban y = 0; ana kubbe merkezde. Batı -X, doğu +X,
// güney cephesi (türbelerin durduğu yan) +Z.
// Düğümler: ayasofya_govde, ayasofya_kubbe, minare_1..4, turbe_1..3.

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;
const US = 4; // duvar dokusu: 1 doku = 4 m

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function textures() {
  const brick = canvasTexture('kizil_tugla', 512, 512, (g) => {
    const rand = rng(21);
    g.fillStyle = '#8c5a52';
    g.fillRect(0, 0, 512, 512);
    for (let row = 0; row < 32; row++) for (let k = -1; k < 17; k++) {
      const r = 168 + rand() * 40, gg = 92 + rand() * 26, b = 84 + rand() * 22;
      g.fillStyle = `rgb(${r},${gg},${b})`;
      g.fillRect(k * 32 + (row % 2) * 16 + 1, row * 16 + 1, 30, 14);
    }
    // Sıva kalıntıları ve yıpranma: soluk ve koyu lekeler
    g.filter = 'blur(22px)';
    for (let i = 0; i < 12; i++) {
      g.fillStyle = i % 3 ? `rgba(222,190,178,${0.14 + rand() * 0.16})` : `rgba(60,30,26,${0.1 + rand() * 0.12})`;
      g.beginPath();
      g.ellipse(110 + rand() * 292, 110 + rand() * 292, 40 + rand() * 60, 24 + rand() * 40, rand() * 3, 0, 6.3);
      g.fill();
    }
    g.filter = 'none';
  });
  const lead = canvasTexture('kursun_ortu', 256, 256, (g) => {
    const rand = rng(8);
    g.fillStyle = '#3b3a40';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 300; i++) {
      const v = 40 + rand() * 50;
      g.fillStyle = `rgba(${v},${v},${v + 6},0.35)`;
      g.fillRect(rand() * 256, rand() * 256, 6 + rand() * 30, 6 + rand() * 30);
    }
    g.strokeStyle = 'rgba(16,16,18,0.8)';
    g.lineWidth = 2;
    for (let k = 0; k <= 4; k++) {
      g.strokeRect(k * 64, 0, 0.01, 256);
      g.strokeRect(0, k * 64, 256, 0.01);
    }
  });
  const stone = (name, base, seed) => canvasTexture(name, 256, 256, (g) => {
    const rand = rng(seed);
    g.fillStyle = base;
    g.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 8; row++) for (let k = -1; k < 5; k++) {
      g.fillStyle = `rgba(${rand() < 0.5 ? '60,50,36' : '236,226,200'},${0.05 + rand() * 0.14})`;
      g.fillRect(k * 64 + (row % 2) * 32, row * 32, 62, 30);
      g.fillStyle = 'rgba(40,34,26,0.35)';
      g.fillRect(k * 64 + (row % 2) * 32 + 62, row * 32, 2, 32);
    }
    for (let row = 0; row < 8; row++) {
      g.fillStyle = 'rgba(40,34,26,0.4)';
      g.fillRect(0, row * 32 + 30, 256, 2);
    }
  });
  // Kafesli pencere: koyu cam, sarımsı kafes
  const lattice = canvasTexture('kafesli_pencere', 128, 256, (g) => {
    g.fillStyle = '#17181a';
    g.fillRect(0, 0, 128, 256);
    g.strokeStyle = '#8a7438';
    g.lineWidth = 2;
    for (let i = -256; i < 256; i += 16) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i + 256, 256);
      g.moveTo(i + 256, 0);
      g.lineTo(i, 256);
      g.stroke();
    }
    g.strokeStyle = '#8f8a7c';
    g.lineWidth = 6;
    g.strokeRect(3, 3, 122, 250);
    g.strokeRect(64, 0, 0.01, 256);
    g.strokeRect(0, 128, 128, 0.01);
  });
  // Türbe penceresi: taş söve içinde koyu cam
  const tomb = canvasTexture('turbe_pencere', 64, 128, (g) => {
    g.fillStyle = '#d8cfbb';
    g.fillRect(0, 0, 64, 128);
    g.fillStyle = '#23272a';
    g.fillRect(12, 14, 40, 104);
    g.strokeStyle = '#8f8a7c';
    g.lineWidth = 3;
    g.strokeRect(32, 14, 0.01, 104);
    g.strokeRect(12, 66, 40, 0.01);
  });
  return { brick, lead, stone, lattice, tomb };
}

// ---------- Eğri yüzey yardımcıları (Part üstüne) ----------
const polar = (cx, cz, r, a, y) => v3(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r);
// Dikey silindir duvar dilimi
function arcWall(part, mat, cx, cz, r, y0, y1, a0, a1, seg) {
  for (let k = 0; k < seg; k++) {
    const a = a0 + ((a1 - a0) * k) / seg, b = a0 + ((a1 - a0) * (k + 1)) / seg, ua = (a * r) / US, ub = (b * r) / US;
    part.quad(mat, [polar(cx, cz, r, a, y0), polar(cx, cz, r, b, y0), polar(cx, cz, r, b, y1), polar(cx, cz, r, a, y1)], [[ua, y0 / US], [ub, y0 / US], [ub, y1 / US], [ua, y1 / US]], v3(Math.cos((a + b) / 2), 0, Math.sin((a + b) / 2)));
  }
}
// Kubbe (ya da dilimi): taban yarıçapı r, yükseklik ry
function dome(part, mat, cx, cy, cz, r, ry, a0, a1, seg, rings) {
  const P = (a, j) => {
    const lat = (j / rings) * (Math.PI / 2);
    return polar(cx, cz, r * Math.cos(lat), a, cy + ry * Math.sin(lat));
  };
  for (let j = 0; j < rings; j++) for (let k = 0; k < seg; k++) {
    const a = a0 + ((a1 - a0) * k) / seg, b = a0 + ((a1 - a0) * (k + 1)) / seg, hint = v3(Math.cos((a + b) / 2), 0.6, Math.sin((a + b) / 2));
    const uv = [[(a * r) / US, (j * ry) / rings / 2], [(b * r) / US, (j * ry) / rings / 2], [(b * r) / US, ((j + 1) * ry) / rings / 2], [(a * r) / US, ((j + 1) * ry) / rings / 2]];
    if (j === rings - 1) part.tri(mat, [P(a, j), P(b, j), v3(cx, cy + ry, cz)], [uv[0], uv[1], uv[2]], hint);
    else part.quad(mat, [P(a, j), P(b, j), P(b, j + 1), P(a, j + 1)], uv, hint);
  }
}
// Dönel yüzey: profile = [[yarıçap, y, malzeme]...]; her dilim alt noktasının malzemesini alır
function lathe(part, cx, cz, profile, n, phase = 0) {
  let run = 0;
  for (let j = 0; j + 1 < profile.length; j++) {
    const [r0, y0, mat] = profile[j], [r1, y1] = profile[j + 1], len = Math.hypot(r1 - r0, y1 - y0);
    for (let k = 0; k < n; k++) {
      const a = phase + (k / n) * TAU, b = phase + ((k + 1) / n) * TAU, rm = Math.max(r0, r1);
      const hint = v3(Math.cos((a + b) / 2), y1 === y0 ? (r1 < r0 ? 1 : -1) * 5 : 0.3, Math.sin((a + b) / 2));
      part.quad(mat, [polar(cx, cz, r0, a, y0), polar(cx, cz, r0, b, y0), polar(cx, cz, r1, b, y1), polar(cx, cz, r1, a, y1)],
        [[(a * rm) / US, run / US], [(b * rm) / US, run / US], [(b * rm) / US, (run + len) / US], [(a * rm) / US, (run + len) / US]], hint);
    }
    run += len;
  }
}
const alem = (part, cx, cz, y, s = 1) => lathe(part, cx, cz, [[0.28 * s, y, 'alem'], [0.6 * s, y + 0.6 * s, 'alem'], [0.2 * s, y + 1.3 * s, 'alem'], [0.4 * s, y + 1.9 * s, 'alem'], [0.1 * s, y + 2.6 * s, 'alem'], [0.02, y + 3.8 * s, 'alem']], 6);

// ---------- Minare ----------
function minaret(M, name, x, z, { fat, brick }) {
  const part = new Part(name), s = fat ? 1 : 0.64, shaft = brick ? 'tugla' : 'tas', H0 = fat ? 0 : 3;
  const profile = [
    [4.7 * s, 0, 'tas'], [4.7 * s, 9 + H0, 'tas'], [3.0 * s, 15 + H0, shaft], [3.0 * s, 37, 'tas'], [3.3 * s, 37.4, 'tas'],
    [4.0 * s, 38.4, 'tas'], [4.0 * s, 39.7, 'tas'], [2.7 * s, 39.7, shaft], [2.7 * s, 49.5, 'tas'], [3.0 * s, 49.8, 'kursun'], [0.12, 62 - (fat ? 0 : 1), 'kursun'],
  ];
  lathe(part, 0, 0, profile, fat ? 14 : 12, Math.PI / (fat ? 14 : 12));
  alem(part, 0, 0, 62 - (fat ? 0 : 1) - 0.2, 0.7);
  const mesh = part.mesh(M);
  mesh.position.set(x, 0, z);
  return mesh;
}

// ---------- Türbe: sekizgen gövde, kurşun kubbe ----------
function tomb(M, name, x, z, R, h) {
  const part = new Part(name), corner = (k, r, y) => polar(0, 0, r, (k / 8) * TAU + Math.PI / 8, y);
  for (let k = 0; k < 8; k++) {
    const a = corner(k, R, 0), b = corner(k + 1, R, 0), mid = a.clone().add(b).multiplyScalar(0.5), N = mid.clone().setY(0).normalize(), Rv = b.clone().sub(a).normalize(), w = a.distanceTo(b);
    part.wall('tas_gri', a, Rv, w, 0, h, N, US, US, (k * w) / US);
    for (const dx of [-0.24, 0.24]) for (const y of [h * 0.2, h * 0.58]) opening(part, { P: mid.clone().addScaledVector(Rv, dx * w).setY(y), R: Rv, N, a: w * 0.1, h: h * 0.2, pointed: true, pane: 'turbe_pencere' });
    // Saçak silmesi
    const c0 = corner(k, R + 0.35, h), c1 = corner(k + 1, R + 0.35, h), c2 = corner(k + 1, R + 0.35, h + 0.5), c3 = corner(k, R + 0.35, h + 0.5), flat = [[0, 0], [1, 0], [1, 1], [0, 1]];
    part.quad('kursun', [c0, c1, c2, c3], flat, N);
    part.quad('kursun', [corner(k, R, h), corner(k + 1, R, h), c1, c0], flat, v3(0, -1, 0));
  }
  lathe(part, 0, 0, [[R + 0.35, h + 0.5, 'kursun'], [R * 0.96, h + 0.9, 'kursun']], 8, Math.PI / 8);
  dome(part, 'kursun', 0, h + 0.9, 0, R * 0.96, R * 0.56, 0, TAU, 16, 5);
  alem(part, 0, 0, h + 0.9 + R * 0.56 - 0.15, 0.55);
  const mesh = part.mesh(M);
  mesh.position.set(x, 0, z);
  return mesh;
}

export function createAyasofya() {
  const root = new THREE.Group();
  root.name = 'ayasofya';
  const T = textures();
  const std = (name, o) => new THREE.MeshStandardMaterial({ name, roughness: 0.9, metalness: 0, ...o });
  const M = {
    tugla: std('kizil_tugla', { map: T.brick }),
    kursun: std('kursun_ortu', { map: T.lead, roughness: 0.75, metalness: 0.15 }),
    tas: std('kufeki_tasi', { map: T.stone('kufeki_tasi', '#b3a383', 4) }),
    tas_gri: std('turbe_tasi', { map: T.stone('turbe_tasi', '#a7a498', 9) }),
    kafes: std('kafesli_pencere', { map: T.lattice }),
    turbe_pencere: std('turbe_pencere', { map: T.tomb }),
    cam_acik: std('kasnak_penceresi', { color: 0xd9d4c4 }),
    alem: std('alem_pirinc', { color: 0xb09640, roughness: 0.45, metalness: 0.85 }),
  };
  const body = new Part('ayasofya_govde');
  const B = (mat, x0, x1, y0, y1, z0, z1, faces = ['+x', '-x', '+z', '-z']) => body.box(mat, x0, x1, y0, y1, z0, z1, faces, US, US);
  const roofed = (x0, x1, y0, y1, z0, z1, faces) => {
    B('tugla', x0, x1, y0, y1, z0, z1, faces);
    B('kursun', x0 - 0.4, x1 + 0.4, y1 - 0.5, y1, z0 - 0.4, z1 + 0.4, ['+x', '-x', '+z', '-z', '+y', '-y']);
  };
  const win = (P, R, N, a, h, o = {}) => opening(body, { P, R, N, a, h, pane: 'kafes', ...o });
  const X = v3(1, 0, 0), Z = v3(0, 0, 1), nX = v3(-1, 0, 0), nZ = v3(0, 0, -1);

  // --- Alt gövde (yan nefler ve galeriler), üst orta gövde ---
  roofed(-36, 36, 0, 23, -35, 35);
  roofed(-17.5, 17.5, 23, 41, -19, 19);
  // --- Kuzey ve güney: kemerli alınlık, iki sıra pencere, iki yanda payanda kuleleri ---
  for (const s of [1, -1]) {
    const N = v3(0, 0, s), R = v3(s, 0, 0), face = (x, y) => v3(x * s, y, 19 * s);
    opening(body, { P: face(0, 24), R, N, a: 9.6, h: 15.2, pane: 'tugla', frame: 'tugla', f: 0.9, depth: 0.5, base: -0.35 }); // alınlık kemeri
    for (const x of [-7.2, -4.8, -2.4, 0, 2.4, 4.8, 7.2]) win(face(x, 26.2), R, N, 0.62, 2.9, { base: 0.02 });
    for (const x of [-4.8, -2.4, 0, 2.4, 4.8]) win(face(x, 31.4), R, N, 0.62, x === 0 ? 3.9 : 3.2, { base: 0.02 });
    for (const sx of [1, -1]) {
      // Payanda kulesi: gövdeden yan duvar hizasına uzanır, üstü beşik tonoz
      const x0 = Math.min(sx * 10.5, sx * 17.5), x1 = Math.max(sx * 10.5, sx * 17.5), z0 = Math.min(s * 19, s * 31), z1 = Math.max(s * 19, s * 31), xc = (x0 + x1) / 2, r = 3.5, TOP = 42;
      B('tugla', x0, x1, 23, TOP, z0, z1);
      for (let k = 0; k < 8; k++) {
        const t0 = (k / 8) * Math.PI, t1 = ((k + 1) / 8) * Math.PI, p = (t, z) => v3(xc - Math.cos(t) * r, TOP + Math.sin(t) * r * 0.75, z);
        body.quad('tugla', [p(t0, z0), p(t1, z0), p(t1, z1), p(t0, z1)], [[z0 / US, (t0 * r) / US], [z0 / US, (t1 * r) / US], [z1 / US, (t1 * r) / US], [z1 / US, (t0 * r) / US]], v3(-Math.cos((t0 + t1) / 2), 1, 0));
        for (const z of [z0, z1]) body.tri('tugla', [v3(xc, TOP, z), p(t0, z), p(t1, z)], [[0, 0], [0.5, 0.5], [1, 0.5]], v3(0, 0, z === (s > 0 ? z1 : z0) ? s : -s));
      }
      for (const y of [28, 33, 38]) win(v3(xc, y, s * 31), R, N, 0.3, 1.5, { base: 0.02 });
    }
    // Alınlığın altında üç küçük kubbe (galeri örtüsü)
    for (const x of [-6.5, 0, 6.5]) dome(body, 'kursun', x, 23, s * 25.5, 3.1, 1.9, 0, TAU, 10, 3);
    // Yan cephe: uçlarda üçlü pencere grupları, ortada çıkıntılı kütle ve iki büyük kafesli kemer
    for (const x of [-30, -26.5, -23, 23, 26.5, 30]) for (const [y, h] of [[4, 4], [13, 4.4]]) win(v3(x, y, 35 * s), R, N, 1.0, h, { base: 0.02 });
    const z0 = Math.min(35 * s, 38 * s), z1 = Math.max(35 * s, 38 * s);
    roofed(-18.5, 18.5, 0, 18, z0, z1, ['+x', '-x', s > 0 ? '+z' : '-z']);
    for (const x of [-9, 9]) opening(body, { P: v3(x, 0, 38 * s), R, N, a: 4.2, h: 13.5, pane: 'kafes', frame: 'tugla', f: 0.5, depth: 0.3 });
    // Eğimli büyük payandalar
    for (const x of [-27, 27]) {
      const a = v3(x - 3.5, 0, 35 * s), b = v3(x + 3.5, 0, 35 * s), o = v3(0, 0, 8 * s), top = 21, low = 5, flat = [[0, 0], [1.75, 0], [1.75, 2], [0, 2]];
      body.quad('tugla', [a.clone().add(o), b.clone().add(o), b.clone().add(o).setY(low), a.clone().add(o).setY(low)], flat, N);
      body.quad('kursun', [a.clone().add(o).setY(low), b.clone().add(o).setY(low), b.clone().setY(top), a.clone().setY(top)], flat, v3(0, 1, s));
      for (const [p, n] of [[a, -1], [b, 1]]) body.quad('tugla', [p.clone(), p.clone().add(o), p.clone().add(o).setY(low), p.clone().setY(top)], [[0, 0], [2, 0], [2, 1.25], [0, 5.25]], v3(n, 0, 0));
    }
  }
  // --- Doğu ve batı: büyük yarım kubbe, iki yanında küçük yarım kubbeler ---
  for (const s of [1, -1]) {
    const cx = 17.5 * s, a0 = s > 0 ? -Math.PI / 2 : Math.PI / 2, a1 = a0 + Math.PI;
    arcWall(body, 'tugla', cx, 0, 16, 23, 32.5, a0, a1, 20);
    lathe(body, cx, 0, [[16.5, 32.5, 'kursun'], [16.5, 33, 'kursun'], [16, 33, 'kursun']], 40);
    dome(body, 'kursun', cx, 33, 0, 16, 8, a0, a1, 20, 6);
    for (const t of [-0.5, -0.25, 0, 0.25, 0.5]) {
      const a = (s > 0 ? 0 : Math.PI) + t * 2.2;
      win(polar(cx, 0, 16, a, 26.5), v3(-Math.sin(a), 0, Math.cos(a)), v3(Math.cos(a), 0, Math.sin(a)), 0.8, 3.4, { base: 0.06 });
    }
    for (const sz of [1, -1]) {
      const ex = (17.5 + 10.2) * s, ez = 11.8 * sz;
      arcWall(body, 'tugla', ex, ez, 6.6, 23, 28, 0, TAU, 14);
      dome(body, 'kursun', ex, 28, ez, 6.9, 3.8, 0, TAU, 14, 4);
    }
  }
  // --- Doğu: apsis ---
  arcWall(body, 'tugla', 36, 0, 6.6, 0, 19, -Math.PI / 2, Math.PI / 2, 10);
  dome(body, 'kursun', 36, 19, 0, 6.9, 4.4, -Math.PI / 2, Math.PI / 2, 10, 4);
  for (const a of [-0.75, 0, 0.75]) win(polar(36, 0, 6.6, a, 6), v3(-Math.sin(a), 0, Math.cos(a)), v3(Math.cos(a), 0, Math.sin(a)), 0.95, 7, { base: 0.08 });
  for (const z of [-28, -20, 20, 28]) for (const [y, h] of [[4, 4], [13, 4.4]]) win(v3(36, y, z), nZ, X, 1.0, h, { base: 0.02 });
  // --- Batı: büyük batı penceresi ve narteks ---
  roofed(-37.5, -33, 23, 35.5, -9.5, 9.5, ['-x', '+z', '-z']);
  opening(body, { P: v3(-37.5, 23.6, 0), R: Z, N: nX, a: 7.2, h: 10.6, pane: 'kafes', frame: 'tugla', f: 0.6, depth: 0.3 });
  roofed(-47, -36, 0, 16.5, -31, 31, ['-x', '+z', '-z']);
  for (let k = 0; k <= 9; k++) {
    const z = -31 + (62 * k) / 9;
    B('tugla', -47.9, -47, 0, 16, Math.max(-31, z - 0.9), Math.min(31, z + 0.9), ['-x', '+z', '-z']);
    if (k < 9) for (const [y, h] of [[2.4, 4], [9.8, 4]]) win(v3(-47, y, z + 62 / 18), Z, nX, 1.55, h, { base: 0.02 });
  }
  for (const z of [-33, 33]) for (const [y, h] of [[2.4, 4], [9.8, 4]]) win(v3(-41.5, y, Math.sign(z) * 31), X, v3(0, 0, Math.sign(z)), 1.3, h, { base: 0.02 });
  root.add(body.mesh(M));

  // ---------- Ana kubbe: pencereli ve payandalı kasnak, kurşun kubbe, alem ----------
  const cupola = new Part('ayasofya_kubbe'), DR = 16.2, D0 = 41, D1 = 46.4;
  arcWall(cupola, 'kursun', 0, 0, DR, D0, D1, 0, TAU, 40);
  for (let k = 0; k < 40; k++) {
    const a = ((k + 0.5) / 40) * TAU, b = (k / 40) * TAU, N = v3(Math.cos(a), 0, Math.sin(a)), R = v3(-Math.sin(a), 0, Math.cos(a));
    opening(cupola, { P: polar(0, 0, DR, a, D0 + 0.9), R, N, a: 0.62, h: 3.9, pane: 'cam_acik', base: 0.04 });
    // Pencere aralarında dışa taşan payanda
    const Nb = v3(Math.cos(b), 0, Math.sin(b)), Rb = v3(-Math.sin(b), 0, Math.cos(b)), c = polar(0, 0, DR - 0.1, b, 0), w = 0.5, d = 1.5, flat = [[0, 0], [0.4, 0], [0.4, 1.4], [0, 1.4]];
    const p = (x, dd, y) => c.clone().addScaledVector(Rb, x).addScaledVector(Nb, dd).setY(y);
    cupola.quad('kursun', [p(-w, d, D0), p(w, d, D0), p(w, d, D1 - 1), p(-w, d, D1 - 1)], flat, Nb);
    cupola.quad('kursun', [p(-w, d, D1 - 1), p(w, d, D1 - 1), p(w, 0, D1 + 0.3), p(-w, 0, D1 + 0.3)], flat, v3(Nb.x, 1, Nb.z));
    for (const sgn of [-1, 1]) cupola.quad('kursun', [p(sgn * w, 0, D0), p(sgn * w, d, D0), p(sgn * w, d, D1 - 1), p(sgn * w, 0, D1 + 0.3)], flat, Rb.clone().multiplyScalar(sgn));
  }
  lathe(cupola, 0, 0, [[DR + 1.7, D0, 'kursun'], [DR + 1.7, D0 + 0.01, 'kursun']], 40);
  dome(cupola, 'kursun', 0, D1, 0, DR + 0.2, 10.2, 0, TAU, 40, 8);
  alem(cupola, 0, 0, D1 + 10, 1.3);
  root.add(cupola.mesh(M));

  // ---------- Minareler ----------
  root.add(minaret(M, 'minare_1', -41.5, 40, { fat: true }), minaret(M, 'minare_2', -41.5, -40, { fat: true }));
  root.add(minaret(M, 'minare_3', 39.5, 38, { brick: true }), minaret(M, 'minare_4', 39.5, -38, {}));

  // ---------- Türbeler: güneyde, ayrı düğümler ----------
  root.add(tomb(M, 'turbe_1', -26, 62, 9, 12.5), tomb(M, 'turbe_2', -3, 60, 6.6, 9.5), tomb(M, 'turbe_3', 20, 62, 9, 12.5));
  return root;
}
