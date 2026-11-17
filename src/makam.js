import * as THREE from 'three';
import fontUrl from '@fontsource/amiri/files/amiri-latin-700-normal.woff2';
import fontExtUrl from '@fontsource/amiri/files/amiri-latin-ext-700-normal.woff2';
import { canvasTexture } from './halk2.js';
import { Part } from './arapcami.js';

// Makam mezarı: mermer kenarlı, içi çakıllı kaide; köşelerde ve yan ortalarda küre başlı mermer babalar ve
// aralarında sarkan zincirler; ortada mermer sanduka, üstünde yeşil demir parmaklık. Sandukanın ön yüzünde
// küçük bir tabela: "Emevî halifesi Abdülmelik, oğlu MESLEME". 1 birim = 1 metre, Y yukarı, ön +Z,
// taban y = 0 ve merkezde. Parçalar: mezar_kaide, mezar_babalar, mezar_zincirler, mezar_sanduka,
// mezar_parmaklik, mezar_tabela.

// Türkçe harfler (ğ, ş, İ, ı) fontun genişletilmiş Latin alt kümesindedir; ikisi aynı aile adıyla yüklenir
for (const url of [fontUrl, fontExtUrl]) document.fonts.add(await new FontFace('AmiriLatin', `url(${url})`, { weight: '700' }).load());

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;
const HX = 2.2, HZ = 1.6, CURB = 0.3, CURB_H = 0.22, FILL = 0.15; // kaide yarı boyutları, kenar genişliği ve yüksekliği, çakıl düzeyi
const BX = 1.15, BZ = 0.75, BH = 0.55; // sanduka yarı boyutları ve yüksekliği (çakıl düzeyinden)

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function textures() {
  const marble = canvasTexture('beyaz_mermer', 512, 512, (g) => {
    const rand = rng(9);
    g.fillStyle = '#d9d8d2';
    g.fillRect(0, 0, 512, 512);
    g.filter = 'blur(3px)';
    for (let i = 0; i < 26; i++) {
      g.strokeStyle = `rgba(120,124,128,${0.12 + rand() * 0.2})`;
      g.lineWidth = 1 + rand() * 4;
      g.beginPath();
      let x = rand() * 512, y = rand() * 512;
      g.moveTo(x, y);
      for (let k = 0; k < 6; k++) g.lineTo((x += 20 + rand() * 60), (y += (rand() - 0.5) * 70));
      g.stroke();
    }
    for (let i = 0; i < 30; i++) {
      g.fillStyle = `rgba(90,86,70,${0.05 + rand() * 0.08})`;
      g.beginPath();
      g.ellipse(rand() * 512, rand() * 512, 10 + rand() * 40, 8 + rand() * 30, 0, 0, TAU);
      g.fill();
    }
    g.filter = 'none';
  });
  const gravel = canvasTexture('beyaz_cakil', 512, 512, (g) => {
    const rand = rng(14);
    g.fillStyle = '#8f8c82';
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2600; i++) {
      const v = 150 + rand() * 90;
      g.fillStyle = `rgb(${v},${v - 2},${v - 10})`;
      g.beginPath();
      g.ellipse(rand() * 512, rand() * 512, 3 + rand() * 6, 2 + rand() * 5, rand() * 3, 0, TAU);
      g.fill();
    }
    for (let i = 0; i < 14; i++) {
      g.fillStyle = `rgba(86,110,60,${0.25 + rand() * 0.3})`;
      g.beginPath();
      g.ellipse(rand() * 512, rand() * 512, 10 + rand() * 30, 8 + rand() * 20, 0, 0, TAU);
      g.fill();
    }
  });
  const grass = canvasTexture('sanduka_ustu', 256, 256, (g) => {
    const rand = rng(23);
    g.fillStyle = '#3d4a2c';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1800; i++) {
      g.strokeStyle = `rgba(${60 + rand() * 60},${100 + rand() * 70},${40 + rand() * 30},0.8)`;
      g.lineWidth = 1.5;
      const x = rand() * 256, y = rand() * 256;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (rand() - 0.5) * 8, y - 4 - rand() * 8);
      g.stroke();
    }
  });
  // Tabela: açık mermer levha, ince çerçeve; üstte küçük satır, altta büyük MESLEME
  const sign = canvasTexture('tabela_yazi', 1024, 512, (g) => {
    g.fillStyle = '#e4e1d6';
    g.fillRect(0, 0, 1024, 512);
    g.strokeStyle = '#2a2a26';
    g.lineWidth = 10;
    g.strokeRect(22, 22, 980, 468);
    g.lineWidth = 3;
    g.strokeRect(40, 40, 944, 432);
    g.fillStyle = '#1e1d1a';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '700 62px AmiriLatin';
    g.fillText('Emevî halifesi Abdülmelik, oğlu', 512, 160);
    g.font = '700 190px AmiriLatin';
    g.fillText('MESLEME', 512, 335);
  });
  sign.wrapS = sign.wrapT = THREE.ClampToEdgeWrapping;
  return { marble, gravel, grass, sign };
}

// İki nokta arasında n kenarlı ince çubuk
function rod(part, mat, p0, p1, r, n = 4) {
  const dir = p1.clone().sub(p0).normalize();
  const u = (Math.abs(dir.y) < 0.9 ? v3(0, 1, 0) : v3(1, 0, 0)).cross(dir).normalize(), w = dir.clone().cross(u);
  const at = (p, k) => p.clone().addScaledVector(u, Math.cos((k / n) * TAU + Math.PI / 4) * r).addScaledVector(w, Math.sin((k / n) * TAU + Math.PI / 4) * r);
  for (let k = 0; k < n; k++) {
    const mid = u.clone().multiplyScalar(Math.cos(((k + 0.5) / n) * TAU + Math.PI / 4)).addScaledVector(w, Math.sin(((k + 0.5) / n) * TAU + Math.PI / 4));
    part.quad(mat, [at(p0, k), at(p0, k + 1), at(p1, k + 1), at(p1, k)], [[0, 0], [1, 0], [1, 1], [0, 1]], mid);
  }
}

export function createMakamMezari() {
  const root = new THREE.Group();
  root.name = 'makam_mezari';
  const T = textures();
  const std = (name, o) => new THREE.MeshStandardMaterial({ name, roughness: 0.9, metalness: 0, ...o });
  const M = {
    mermer: std('beyaz_mermer', { map: T.marble, roughness: 0.75 }),
    cakil: std('beyaz_cakil', { map: T.gravel, roughness: 1 }),
    cim: std('sanduka_ustu', { map: T.grass, roughness: 1 }),
    demir: std('yesil_demir', { color: 0x1f5a3c, roughness: 0.6, metalness: 0.4 }),
    zincir: std('zincir', { color: 0x2a2a2c, roughness: 0.6, metalness: 0.6 }),
    tabela: std('tabela_yazi', { map: T.sign, roughness: 0.7 }),
  };
  const ALL = ['+x', '-x', '+z', '-z', '+y'];

  // ---------- Kaide: mermer kenar, içi çakıl ----------
  const base = new Part('mezar_kaide');
  base.box('mermer', -HX, HX, 0, CURB_H, HZ - CURB, HZ, ALL, 1.5, 1.5);
  base.box('mermer', -HX, HX, 0, CURB_H, -HZ, -HZ + CURB, ALL, 1.5, 1.5);
  base.box('mermer', -HX, -HX + CURB, 0, CURB_H, -HZ + CURB, HZ - CURB, ['+x', '-x', '+y'], 1.5, 1.5);
  base.box('mermer', HX - CURB, HX, 0, CURB_H, -HZ + CURB, HZ - CURB, ['+x', '-x', '+y'], 1.5, 1.5);
  base.box('cakil', -HX + CURB, HX - CURB, 0, FILL, -HZ + CURB, HZ - CURB, ['+y'], 0.9, 0.9);
  root.add(base.mesh(M));

  // ---------- Babalar: kaideli, başlıklı kare mermer direk; tepesinde küre ----------
  const posts = new Part('mezar_babalar');
  const spots = [[-1, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [1, -1]].map(([sx, sz]) => [sx * (HX - CURB / 2), sz * (HZ - CURB / 2)]);
  const TOP = CURB_H + 0.94; // zincirlerin asıldığı yükseklik referansı
  for (const [x, z] of spots) {
    const sq = (half, y0, y1, faces = ALL) => posts.box('mermer', x - half, x + half, y0, y1, z - half, z + half, faces, 1.2, 1.2);
    let y = CURB_H;
    sq(0.2, y, y + 0.1);
    sq(0.17, y + 0.1, y + 0.16);
    sq(0.14, y + 0.16, y + 0.7, ['+x', '-x', '+z', '-z']);
    sq(0.17, y + 0.7, y + 0.75, ['+x', '-x', '+z', '-z', '+y', '-y']);
    sq(0.19, y + 0.75, y + 0.8, ['+x', '-x', '+z', '-z', '+y', '-y']);
    // Piramit tepe, boyun ve küre
    const c = (dx, dz, yy, h) => v3(x + dx * h, yy, z + dz * h), apex = y + 0.86;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = dx ? c(dx, 1, y + 0.8, 0.17) : c(1, dz, y + 0.8, 0.17), b = dx ? c(dx, -1, y + 0.8, 0.17) : c(-1, dz, y + 0.8, 0.17);
      posts.tri('mermer', [a, b, v3(x, apex + 0.04, z)], [[0, 0], [1, 0], [0.5, 1]], v3(dx, 1, dz));
    }
    const ring = (r, yy) => Array.from({ length: 10 }, (_, k) => v3(x + Math.cos((k / 10) * TAU) * r, yy, z + Math.sin((k / 10) * TAU) * r));
    const levels = [[0.045, apex - 0.01], [0.04, apex + 0.03]];
    for (let j = 0; j <= 6; j++) {
      const lat = -Math.PI / 2 + 0.35 + ((Math.PI - 0.35) * j) / 6;
      levels.push([Math.max(0.004, 0.085 * Math.cos(lat)), apex + 0.1 + 0.085 * Math.sin(lat)]);
    }
    for (let j = 0; j + 1 < levels.length; j++) {
      const r0 = ring(...levels[j]), r1 = ring(...levels[j + 1]);
      for (let k = 0; k < 10; k++) posts.quad('mermer', [r0[k], r0[(k + 1) % 10], r1[(k + 1) % 10], r1[k]], [[k / 10, 0], [(k + 1) / 10, 0], [(k + 1) / 10, 1], [k / 10, 1]], v3(r0[k].x - x, levels[j + 1][1] > apex + 0.15 ? 0.5 : 0, r0[k].z - z));
    }
  }
  root.add(posts.mesh(M));

  // ---------- Zincirler: ön ve iki yanda babadan babaya sarkan ----------
  const chains = new Part('mezar_zincirler');
  const hang = (a, b) => {
    const p0 = v3(a[0], CURB_H + 0.56, a[1]), p1 = v3(b[0], CURB_H + 0.56, b[1]);
    let before = p0;
    for (let k = 1; k <= 7; k++) {
      const t = k / 7, p = p0.clone().lerp(p1, t);
      p.y -= 0.22 * 4 * t * (1 - t) * Math.min(1, p0.distanceTo(p1) / 3);
      rod(chains, 'zincir', before, p, 0.014, 4);
      before = p;
    }
  };
  hang(spots[0], spots[1]); // ön
  hang(spots[0], spots[2]);
  hang(spots[2], spots[4]);
  hang(spots[1], spots[3]);
  hang(spots[3], spots[5]);
  root.add(chains.mesh(M));

  // ---------- Sanduka: mermer blok, üstü çimenli ----------
  const tomb = new Part('mezar_sanduka'), Y0 = FILL, Y1 = FILL + BH;
  tomb.box('mermer', -BX, BX, Y0, Y1, -BZ, BZ, ['+x', '-x', '+z', '-z'], 1.5, 1.5);
  tomb.box('mermer', -BX - 0.03, BX + 0.03, Y1 - 0.06, Y1, -BZ - 0.03, BZ + 0.03, ['+x', '-x', '+z', '-z', '+y', '-y'], 1.5, 1.5);
  tomb.box('cim', -BX + 0.1, BX - 0.1, Y1, Y1 + 0.03, -BZ + 0.1, BZ - 0.1, ALL, 0.8, 0.8);
  root.add(tomb.mesh(M));

  // ---------- Parmaklık: yeşil demir; dikmeler, üç yatay kuşak, sivri uçlar ----------
  const fence = new Part('mezar_parmaklik'), FX = BX - 0.04, FZ = BZ - 0.04, F0 = Y1, F1 = Y1 + 0.78;
  const sidesF = [[v3(-FX, 0, FZ), v3(FX, 0, FZ)], [v3(FX, 0, FZ), v3(FX, 0, -FZ)], [v3(FX, 0, -FZ), v3(-FX, 0, -FZ)], [v3(-FX, 0, -FZ), v3(-FX, 0, FZ)]];
  for (const [a, b] of sidesF) {
    const len = a.distanceTo(b), count = Math.round(len / 0.115);
    for (const y of [F0 + 0.06, F0 + 0.4, F1 - 0.08]) rod(fence, 'demir', a.clone().setY(y), b.clone().setY(y), 0.012, 4);
    for (let k = 0; k < count; k++) {
      const p = a.clone().lerp(b, k / count), corner = k === 0;
      rod(fence, 'demir', p.clone().setY(F0), p.clone().setY(F1 + (corner ? 0.06 : 0)), corner ? 0.02 : 0.008, 4);
      // Sivri uç
      const tip = p.clone().setY(F1 + (corner ? 0.14 : 0.07)), r = corner ? 0.026 : 0.014, yb = F1 + (corner ? 0.06 : 0);
      const basePts = [0, 1, 2, 3].map((q) => v3(p.x + Math.cos((q / 4) * TAU) * r, yb, p.z + Math.sin((q / 4) * TAU) * r));
      for (let q = 0; q < 4; q++) fence.tri('demir', [basePts[q], basePts[(q + 1) % 4], tip], [[0, 0], [1, 0], [0.5, 1]], v3(basePts[q].x + basePts[(q + 1) % 4].x - 2 * p.x, 0.3, basePts[q].z + basePts[(q + 1) % 4].z - 2 * p.z));
    }
  }
  root.add(fence.mesh(M));

  // ---------- Tabela: sandukanın ön yüzünde küçük yazılı levha ----------
  const sign = new Part('mezar_tabela'), SW = 0.3, SH = 0.15, SY = Y0 + 0.27, SZ = BZ + 0.018;
  sign.quad('tabela', [v3(-SW, SY - SH, SZ), v3(SW, SY - SH, SZ), v3(SW, SY + SH, SZ), v3(-SW, SY + SH, SZ)], [[0, 0], [1, 0], [1, 1], [0, 1]], v3(0, 0, 1));
  sign.box('mermer', -SW, SW, SY - SH, SY + SH, BZ, SZ, ['+x', '-x', '+y', '-y'], 1, 1);
  root.add(sign.mesh(M));
  return root;
}
