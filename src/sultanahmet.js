import * as THREE from 'three';
import fontUrl from '@fontsource/amiri/files/amiri-arabic-700-normal.woff2';
import { canvasTexture } from './halk2.js';
import { Part } from './arapcami.js';

// Sultanahmet Camii (İstanbul), içine girilip gezilebilir. Kalın duvarlarda kapılar gerçek açıklıktır;
// kubbeler, yarım kubbeler ve tavan içeriden de görünür (iç kabuklar ayrı malzemeyle). İçeride dört fil
// ayağı, halı, mihrap, minber; önde revaklı avlu, şadırvan, üç taç kapı; altı minare.
// 1 birim = 1 metre, Y yukarı. Zemin (cami ve avlu döşemesi) y = 0, çevre arazi y = -1,2.
// Harim merkezde (x, z ±26); kıble -Z; avlu +Z yanında (z 26…78); ana taç kapı z = 78'de, +Z'ye bakar.
// Düğümler: platform, cami_duvarlari, cami_ortusu, cami_ici, avlu, sadirvan, minare_1…6.

document.fonts.add(await new FontFace('AmiriCami', `url(${fontUrl})`, { weight: '700' }).load());

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2, UP = V(0, 1, 0), DOWN = V(0, -1, 0);
const HALF = 26, C = 17, TOPY = 30, Z1 = 78, T = 1.2, US = 4;
const flat = [[0, 0], [1, 0], [1, 1], [0, 1]];
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function materials() {
  const rand = rng(1616);
  const std = (name, map, o = {}) => new THREE.MeshStandardMaterial({ name, map, roughness: 0.9, metalness: 0, side: THREE.DoubleSide, ...o });
  const tex = (name, w, h, draw) => canvasTexture(name, w, h, draw);
  const ashlar = (name, base, lo, hi) => tex(name, 512, 512, (g) => {
    g.fillStyle = base;
    g.fillRect(0, 0, 512, 512);
    for (let r = 0; r < 12; r++) {
      let x = -rand() * 50;
      while (x < 512) {
        const w = 40 + rand() * 60, v = lo + rand() * (hi - lo);
        g.fillStyle = `rgb(${v},${v},${v + 3})`;
        g.fillRect(x + 1, r * 42.67 + 1, w - 2, 40.67);
        x += w;
      }
    }
    g.filter = 'blur(14px)';
    for (let i = 0; i < 18; i++) {
      g.fillStyle = `rgba(70,70,74,${0.05 + rand() * 0.1})`;
      g.beginPath();
      g.ellipse(80 + rand() * 352, 80 + rand() * 352, 20 + rand() * 60, 30 + rand() * 80, 0, 0, TAU);
      g.fill();
    }
    g.filter = 'none';
  });
  const lead = tex('kursun_ortu', 256, 256, (g) => {
    g.fillStyle = '#5a6472';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 200; i++) {
      const v = 80 + rand() * 40;
      g.fillStyle = `rgba(${v},${v + 8},${v + 20},0.3)`;
      g.fillRect(rand() * 256, rand() * 256, 10 + rand() * 30, 10 + rand() * 30);
    }
    g.strokeStyle = 'rgba(30,34,42,0.8)';
    g.lineWidth = 2;
    for (let k = 0; k <= 8; k++) {
      g.strokeRect(k * 32, 0, 0.01, 256);
      g.strokeRect(0, k * 32, 256, 0.01);
    }
  });
  const carpet = tex('hali', 256, 256, (g) => {
    g.fillStyle = '#8c1c22';
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#c9a25a';
    g.lineWidth = 3;
    for (const y of [6, 250]) g.strokeRect(0, y, 256, 0.01);
    for (let k = 0; k < 4; k++) {
      const x = k * 64 + 32;
      g.fillStyle = '#b8862e';
      g.beginPath();
      g.moveTo(x, 40);
      g.quadraticCurveTo(x + 24, 80, x + 20, 210);
      g.lineTo(x - 20, 210);
      g.quadraticCurveTo(x - 24, 80, x, 40);
      g.fill();
      g.fillStyle = '#7a161c';
      g.beginPath();
      g.arc(x, 130, 10, 0, TAU);
      g.fill();
    }
  });
  const tile = tex('iznik_cinisi', 256, 256, (g) => {
    g.fillStyle = '#e6e8ea';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) {
      const x = i * 64 + 32, y = k * 64 + 32;
      g.fillStyle = '#1f4f9a';
      for (let p = 0; p < 8; p++) {
        g.save();
        g.translate(x, y);
        g.rotate((p / 8) * TAU);
        g.beginPath();
        g.ellipse(15, 0, 11, 4.5, 0, 0, TAU);
        g.fill();
        g.restore();
      }
      g.fillStyle = '#2a8f8a';
      g.beginPath();
      g.arc(x, y, 6, 0, TAU);
      g.fill();
      g.fillStyle = '#b8322a';
      g.beginPath();
      g.arc(x + 32, y + 32, 4, 0, TAU);
      g.fill();
      g.strokeStyle = 'rgba(31,79,154,0.5)';
      g.strokeRect(i * 64, k * 64, 64, 64);
    }
  });
  const paint = tex('kalem_isi', 256, 256, (g) => {
    g.fillStyle = '#e9e2cf';
    g.fillRect(0, 0, 256, 256);
    for (const [y, c] of [[20, '#27508f'], [128, '#a8372c'], [236, '#27508f']]) {
      g.fillStyle = c;
      g.fillRect(0, y - 7, 256, 3);
      g.fillRect(0, y + 4, 256, 3);
      for (let x = 16; x < 256; x += 32) {
        g.beginPath();
        g.moveTo(x, y - 12);
        g.quadraticCurveTo(x + 14, y, x, y + 12);
        g.quadraticCurveTo(x - 14, y, x, y - 12);
        g.fill();
      }
    }
    g.strokeStyle = 'rgba(39,80,143,0.55)';
    g.lineWidth = 2;
    for (let x = 0; x < 256; x += 64) for (const y of [74, 182]) {
      g.beginPath();
      g.arc(x + 32, y, 22, 0, TAU);
      g.moveTo(x + 32, y - 22);
      g.lineTo(x + 54, y);
      g.lineTo(x + 32, y + 22);
      g.lineTo(x + 10, y);
      g.closePath();
      g.stroke();
    }
  });
  const arch = (g, x, y, w, h) => {
    g.beginPath();
    g.moveTo(x, y + h);
    g.lineTo(x, y + w * 0.75);
    g.quadraticCurveTo(x + w * 0.06, y + w * 0.2, x + w / 2, y);
    g.quadraticCurveTo(x + w * 0.94, y + w * 0.2, x + w, y + w * 0.75);
    g.lineTo(x + w, y + h);
    g.closePath();
  };
  // Dış pencereler: alt sıra (demir parmaklıklı), üst sıralar (kırmızı-beyaz kemerli, petek şebekeli)
  const winLow = tex('pencere_alt', 128, 192, (g) => {
    g.fillStyle = '#dcdad4';
    g.fillRect(0, 0, 128, 192);
    g.fillStyle = '#b9b6ae';
    g.fillRect(8, 8, 112, 176);
    g.fillStyle = '#241a16';
    g.fillRect(20, 20, 88, 152);
    g.strokeStyle = '#0c0a09';
    g.lineWidth = 3;
    for (let x = 34; x < 108; x += 15) g.strokeRect(x, 20, 0.01, 152);
    for (let y = 36; y < 172; y += 17) g.strokeRect(20, y, 88, 0.01);
  });
  const winArch = tex('pencere_kemerli', 128, 256, (g) => {
    g.fillStyle = '#d6d4ce';
    g.fillRect(0, 0, 128, 256);
    for (let k = 0; k < 13; k++) { // kırmızı-beyaz kemer taşları
      g.save();
      g.translate(64, 78);
      g.rotate(Math.PI + (k / 12) * Math.PI);
      g.fillStyle = k % 2 ? '#e8e2d8' : '#b0483c';
      g.fillRect(48, -9, 20, 18);
      g.restore();
    }
    g.fillStyle = '#e4e1d8';
    arch(g, 14, 22, 100, 226);
    g.fill();
    g.save();
    arch(g, 20, 30, 88, 214);
    g.clip();
    g.fillStyle = '#1c2228';
    g.fillRect(0, 0, 128, 256);
    g.strokeStyle = '#e4e1d8';
    g.lineWidth = 3.5;
    for (let r = 0; r < 20; r++) for (let k = -1; k < 8; k++) {
      g.beginPath();
      g.arc(k * 16 + (r % 2) * 8 + 8, r * 14 + 8, 7, 0, TAU);
      g.stroke();
    }
    g.restore();
  });
  // İçeriden pencere: renkli revzen (ışır)
  const glass = tex('revzen', 128, 256, (g) => {
    g.fillStyle = '#e9e2cf';
    g.fillRect(0, 0, 128, 256);
    g.fillStyle = '#27508f';
    arch(g, 12, 18, 104, 232);
    g.fill();
    g.save();
    arch(g, 20, 28, 88, 216);
    g.clip();
    const colors = ['#f6e7a0', '#7fb8e6', '#e8705a', '#8fd09a', '#fff6d8', '#5a8fd6'];
    for (let r = 0; r < 18; r++) for (let k = 0; k < 8; k++) {
      g.fillStyle = colors[Math.floor(rand() * colors.length)];
      g.fillRect(k * 14 + (r % 2) * 7 + 12, r * 14 + 20, 12, 12);
    }
    g.restore();
  });
  const drum = (name, bg, pane, edge) => tex(name, 64, 128, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, 64, 128);
    g.fillStyle = edge;
    arch(g, 14, 22, 36, 88);
    g.fill();
    g.fillStyle = pane;
    arch(g, 19, 29, 26, 78);
    g.fill();
    g.fillStyle = edge;
    g.fillRect(0, 0, 64, 6);
    g.fillRect(0, 120, 64, 8);
  });
  const mihrab = tex('mihrap', 256, 512, (g) => {
    g.fillStyle = '#e8e4da';
    g.fillRect(0, 0, 256, 512);
    g.strokeStyle = '#b89a48';
    g.lineWidth = 8;
    g.strokeRect(10, 10, 236, 492);
    g.fillStyle = '#b89a48';
    arch(g, 56, 120, 144, 380);
    g.fill();
    g.fillStyle = '#5a5248';
    arch(g, 66, 134, 124, 366);
    g.fill();
    for (let r = 0; r < 5; r++) for (let k = 0; k <= r; k++) { // mukarnas
      g.fillStyle = r % 2 ? '#d8c890' : '#efe6c8';
      g.beginPath();
      g.moveTo(128 + (k - r / 2) * 22, 150 + r * 16);
      g.lineTo(128 + (k - r / 2) * 22 - 11, 168 + r * 16);
      g.lineTo(128 + (k - r / 2) * 22 + 11, 168 + r * 16);
      g.fill();
    }
    g.fillStyle = '#17603c';
    g.fillRect(40, 40, 176, 54);
  });
  const script = (name, text, w, h) => tex(name, w, h, (g) => {
    g.fillStyle = '#17603c';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d9b84e';
    g.lineWidth = 5;
    g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#e7c95c';
    g.font = `700 ${h * 0.58}px AmiriCami`;
    g.direction = 'rtl';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, w / 2, h * 0.47);
  });
  const hood = tex('tac_kapi_mukarnas', 128, 128, (g) => {
    g.fillStyle = '#d9d7d0';
    g.fillRect(0, 0, 128, 128);
    for (let r = 0; r < 9; r++) for (let k = 0; k <= r; k++) {
      g.fillStyle = r % 2 ? '#b9b3a2' : '#8f8a7c';
      g.beginPath();
      g.moveTo(64 + (k - r / 2) * 13, 6 + r * 13);
      g.lineTo(64 + (k - r / 2) * 13 - 6.5, 19 + r * 13);
      g.lineTo(64 + (k - r / 2) * 13 + 6.5, 19 + r * 13);
      g.fill();
    }
  });
  const rail = tex('tas_korkuluk', 64, 64, (g) => {
    g.fillStyle = '#dcdad4';
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#6e6c68';
    for (let x = 6; x < 64; x += 16) g.fillRect(x, 12, 8, 40);
  });
  return {
    tas: std('kufeki_tasi', ashlar('kufeki_tasi', '#a9a9a6', 188, 226)),
    mermer: std('mermer_doseme', ashlar('mermer_doseme', '#b4b6b8', 196, 232), { roughness: 0.6 }),
    kursun: std('kursun_ortu', lead, { roughness: 0.65, metalness: 0.2 }),
    hali: std('hali', carpet),
    cini: std('iznik_cinisi', tile, { roughness: 0.4 }),
    ic: std('kalem_isi', paint),
    alt: std('pencere_alt', winLow),
    kemer: std('pencere_kemerli', winArch),
    revzen: std('revzen', glass, { emissive: 0xffffff, emissiveMap: glass, emissiveIntensity: 0.55 }),
    kasnak: std('kasnak_disi', drum('kasnak_disi', '#dcdad4', '#20262c', '#b9b6ae')),
    kasnak_ic: std('kasnak_ici', drum('kasnak_ici', '#e9e2cf', '#fff3c4', '#27508f'), { emissive: 0xffffff, emissiveIntensity: 0.45 }),
    mihrap: std('mihrap', mihrab),
    kitabe: std('kitabe_besmele', script('kitabe_besmele', 'بسم الله الرحمن الرحیم', 512, 128)),
    kitabe2: std('kitabe_tevhid', script('kitabe_tevhid', 'لا اله الا الله محمد رسول الله', 512, 128)),
    mukarnas: std('tac_kapi_mukarnas', hood),
    korkuluk: std('tas_korkuluk', rail),
    ahsap: std('ceviz', null, { color: 0x4a3020 }),
    altin: std('alem_altin', null, { color: 0xc9a23a, roughness: 0.4, metalness: 0.9 }),
  };
}

// ---------- Geometri yardımcıları ----------
// Dönel yüzey dilimi. prof: [{ r, y, mat, fit }]; mat/fit o noktadan sonraki kuşağa uygulanır.
function lathe(part, cx, cz, prof, n, a0 = 0, a1 = TAU) {
  let run = 0;
  for (let j = 0; j + 1 < prof.length; j++) {
    const A = prof[j], B = prof[j + 1], len = Math.hypot(B.r - A.r, B.y - A.y), rm = Math.max(A.r, B.r);
    if (len < 1e-6) continue;
    for (let k = 0; k < n; k++) {
      const t0 = a0 + ((a1 - a0) * k) / n, t1 = a0 + ((a1 - a0) * (k + 1)) / n, tm = (t0 + t1) / 2;
      const p = (P, t) => V(cx + Math.cos(t) * P.r, P.y, cz + Math.sin(t) * P.r);
      const hint = V(Math.cos(tm), Math.abs(B.y - A.y) < 1e-6 ? (B.r < A.r ? 9 : -9) : 0.3, Math.sin(tm));
      const uv = A.fit ? [[k * A.fit, 0], [(k + 1) * A.fit, 0], [(k + 1) * A.fit, 1], [k * A.fit, 1]]
        : [[(t0 * rm) / US, run / US], [(t1 * rm) / US, run / US], [(t1 * rm) / US, (run + len) / US], [(t0 * rm) / US, (run + len) / US]];
      if (B.r < 1e-4) part.tri(A.mat, [p(A, t0), p(A, t1), p(B, t0)], [uv[0], uv[1], uv[2]], hint);
      else part.quad(A.mat, [p(A, t0), p(A, t1), p(B, t1), p(B, t0)], uv, hint);
    }
    run += len;
  }
}
// Kasnak + kubbe kesiti
function domeProfile(r, y0, drumH, rise, rings, drumMat, domeMat) {
  const prof = [{ r, y: y0, mat: drumMat, fit: 1 }, { r, y: y0 + drumH, mat: domeMat }];
  for (let j = 1; j <= rings; j++) {
    const lat = (j / rings) * (Math.PI / 2);
    prof.push({ r: j === rings ? 0 : r * Math.cos(lat), y: y0 + drumH + rise * Math.sin(lat), mat: domeMat });
  }
  return prof;
}
const alem = (part, cx, cz, y, s = 1) => lathe(part, cx, cz, [[0.25, 0], [0.5, 0.5], [0.16, 1.1], [0.34, 1.6], [0.08, 2.2], [0, 3.2]].map(([r, h]) => ({ r: r * s, y: y + h * s, mat: 'altin' })), 6);
// Kalın duvar: dış yüz, iç yüz (altı çini olabilir), kapı açıklıkları (gaps: [{ a0, a1, h }]), üst yüz.
// Pencereler dokulu levhadır: tiers [[y, dış malzeme, iç malzeme, w, h]], adım step.
function wall(part, o) {
  const { P, R, N, len, H, T: th = T, out = 'tas', inn = 'ic', innLow = null, split = 7.5, gaps = [], tiers = [], step = 5.2 } = o;
  const back = N.clone().negate();
  const pt = (a, y, d) => P.clone().addScaledVector(R, a).addScaledVector(N, -d).setY(y);
  const rect = (mat, a0, a1, y0, y1, d, n) => {
    if (a1 - a0 < 1e-3 || y1 - y0 < 1e-3) return;
    part.quad(mat, [pt(a0, y0, d), pt(a1, y0, d), pt(a1, y1, d), pt(a0, y1, d)], [[a0 / US, y0 / US], [a1 / US, y0 / US], [a1 / US, y1 / US], [a0 / US, y1 / US]], n);
  };
  const inner = (a0, a1, y0, y1) => {
    if (innLow && y0 < split) {
      rect(innLow, a0, a1, y0, Math.min(split, y1), th, back);
      rect(inn, a0, a1, Math.max(split, y0), y1, th, back);
    } else rect(inn, a0, a1, y0, y1, th, back);
  };
  let a = 0;
  for (const g of [...gaps, { a0: len, a1: len, h: 0 }]) {
    rect(out, a, g.a0, 0, H, 0, N);
    inner(a, g.a0, 0, H);
    if (g.a1 > g.a0) {
      rect(out, g.a0, g.a1, g.h, H, 0, N);
      inner(g.a0, g.a1, g.h, H);
      part.quad('mermer', [pt(g.a0, g.h, 0), pt(g.a1, g.h, 0), pt(g.a1, g.h, th), pt(g.a0, g.h, th)], flat, DOWN);
      part.quad('mermer', [pt(g.a0, 0, 0), pt(g.a0, 0, th), pt(g.a0, g.h, th), pt(g.a0, g.h, 0)], flat, R);
      part.quad('mermer', [pt(g.a1, 0, 0), pt(g.a1, 0, th), pt(g.a1, g.h, th), pt(g.a1, g.h, 0)], flat, R.clone().negate());
    }
    a = g.a1;
  }
  part.quad(out, [pt(0, H, 0), pt(len, H, 0), pt(len, H, th), pt(0, H, th)], flat, UP);
  for (let x = step / 2; x < len; x += step) {
    if (gaps.some((g) => x > g.a0 - 2 && x < g.a1 + 2)) continue;
    for (const [y, mo, mi, w, h] of tiers) {
      if (mo) part.quad(mo, [pt(x - w / 2, y, -0.06), pt(x + w / 2, y, -0.06), pt(x + w / 2, y + h, -0.06), pt(x - w / 2, y + h, -0.06)], flat, N);
      if (mi) part.quad(mi, [pt(x + w / 2, y, th + 0.06), pt(x - w / 2, y, th + 0.06), pt(x - w / 2, y + h, th + 0.06), pt(x + w / 2, y + h, th + 0.06)], flat, back);
    }
  }
}
// Delikli yatay levha (tavan/çatı): outline ve holes (x, z) noktalarıdır
function plate(part, mat, y, outline, holes, hint) {
  const shape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, z)));
  for (const h of holes) shape.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, z))));
  const g = new THREE.ShapeGeometry(shape), p = g.attributes.position, idx = g.index.array;
  for (let i = 0; i < idx.length; i += 3) {
    const tri = [0, 1, 2].map((k) => V(p.getX(idx[i + k]), y, p.getY(idx[i + k])));
    part.tri(mat, tri, tri.map((q) => [q.x / US, q.z / US]), hint);
  }
}
const circle = (cx, cz, r, n = 24) => Array.from({ length: n }, (_, k) => [cx + Math.cos((k / n) * TAU) * r, cz + Math.sin((k / n) * TAU) * r]);
const rot = (x, z, q) => [[x, z], [-z, x], [-x, -z], [z, -x]][q];
// İki sütun arasında sivri kemerli alınlık duvarı
function archSpan(part, mat, p0, p1, ys, yt, th = 0.7) {
  const dir = p1.clone().sub(p0), w = dir.length(), hw = w / 2 - 0.4, mid = p0.clone().add(p1).multiplyScalar(0.5), rise = yt - ys - 0.9;
  dir.normalize();
  const n = V(dir.z, 0, -dir.x), pos = (s, y, o) => mid.clone().addScaledVector(dir, s).addScaledVector(n, o).setY(y);
  const pts = [[-w / 2, ys], [-hw, ys]];
  for (let k = 1; k < 10; k++) {
    const s = -hw + (2 * hw * k) / 10;
    pts.push([s, ys + rise * (1 - (Math.abs(s) / hw) ** 1.8) ** 0.6]);
  }
  pts.push([hw, ys], [w / 2, ys]);
  for (let i = 0; i + 1 < pts.length; i++) {
    const [s0, y0] = pts[i], [s1, y1] = pts[i + 1];
    for (const o of [-th / 2, th / 2]) part.quad(mat, [pos(s0, y0, o), pos(s1, y1, o), pos(s1, yt, o), pos(s0, yt, o)], [[s0 / US, y0 / US], [s1 / US, y1 / US], [s1 / US, yt / US], [s0 / US, yt / US]], n.clone().multiplyScalar(o));
    part.quad(mat, [pos(s0, y0, -th / 2), pos(s1, y1, -th / 2), pos(s1, y1, th / 2), pos(s0, y0, th / 2)], flat, DOWN);
  }
}
const column = (part, x, z, h, r = 0.38) => lathe(part, x, z, [[r * 1.4, 0], [r * 1.4, 0.3], [r, 0.4], [r * 0.92, h - 0.55], [r * 1.5, h - 0.1], [r * 1.5, h]].map(([rr, y]) => ({ r: rr, y, mat: 'mermer' })), 8);

export function createSultanahmet() {
  const root = new THREE.Group();
  root.name = 'sultanahmet_camii';
  const M = materials();
  const add = (part, x = 0, z = 0) => {
    const m = part.mesh(M);
    m.position.set(x, 0, z);
    root.add(m);
  };
  const X = V(1, 0, 0), Z = V(0, 0, 1), nX = V(-1, 0, 0), nZ = V(0, 0, -1), ALL = ['+x', '-x', '+z', '-z', '+y', '-y'];

  // ---------- Platform, döşemeler, basamaklar ----------
  const ground = new Part('platform');
  ground.box('mermer', -31, 31, -1.2, 0, -31, 82, ['+x', '-x', '+z', '-z', '+y'], US, US);
  ground.quad('hali', [V(-24.8, 0.03, -24.8), V(24.8, 0.03, -24.8), V(24.8, 0.03, 24.8), V(-24.8, 0.03, 24.8)], [[0, 0], [12.4, 0], [12.4, 12.4], [0, 12.4]], UP);
  const steps = (cx, cz, d, width) => {
    for (let k = 0; k < 3; k++) {
      const a = V(cx, 0, cz).addScaledVector(V(d.z, 0, -d.x), -width / 2), b = V(cx, 0, cz).addScaledVector(V(d.z, 0, -d.x), width / 2).addScaledVector(d, 0.55 * (3 - k));
      ground.box('mermer', Math.min(a.x, b.x), Math.max(a.x, b.x), -1.2, -0.3 * (3 - k), Math.min(a.z, b.z), Math.max(a.z, b.z), ['+x', '-x', '+z', '-z', '+y'], US, US);
    }
  };
  steps(0, 82, Z, 12);
  for (const s of [-1, 1]) {
    steps(s * 31, 52, V(s, 0, 0), 8);
    steps(s * 31, 18, V(s, 0, 0), 7);
  }
  add(ground);

  // ---------- Harim duvarları: kapılar gerçek açıklık ----------
  const walls = new Part('cami_duvarlari');
  const hallTiers = [[1.3, 'alt', 'alt', 1.7, 2.8], [6.4, 'kemer', 'revzen', 1.8, 4], [11.8, 'kemer', 'revzen', 1.8, 3.8]];
  const hall = { H: C, innLow: 'cini', tiers: hallTiers };
  wall(walls, { ...hall, P: V(-HALF, 0, HALF), R: X, N: Z, len: 52, gaps: [{ a0: 24, a1: 28, h: 7 }] }); // avluya açılan cümle kapısı
  wall(walls, { ...hall, P: V(HALF, 0, -HALF), R: nX, N: nZ, len: 52 }); // kıble duvarı
  wall(walls, { ...hall, P: V(HALF, 0, HALF), R: nZ, N: X, len: 52, gaps: [{ a0: 6.5, a1: 9.5, h: 5.5 }] }); // yan kapılar
  wall(walls, { ...hall, P: V(-HALF, 0, -HALF), R: Z, N: nX, len: 52, gaps: [{ a0: 42.5, a1: 45.5, h: 5.5 }] });
  walls.quad('kitabe2', [V(-2.6, 7.6, HALF + 0.07), V(2.6, 7.6, HALF + 0.07), V(2.6, 8.9, HALF + 0.07), V(-2.6, 8.9, HALF + 0.07)], flat, Z);
  walls.box('tas', -HALF - 0.35, HALF + 0.35, C - 0.5, C + 0.9, -HALF - 0.35, HALF + 0.35, ['+x', '-x', '+z', '-z'], US, US); // saçak silmesi
  add(walls);

  // ---------- Örtü: çatı levhası, yarım kubbeler, köşe kubbeleri, orta kule, ana kubbe ----------
  const roof = new Part('cami_ortusu'), inside = new Part('cami_ici');
  const RO = 12, RI = 11.6, CR = 5.5, CRI = 5.1, CC = 19, HD = { drum: 2.5, rise: 9.2, riseIn: 8.9 };
  // Dört yapraklı açıklık (orta kare + dört yarım daire) ve köşe kubbe delikleri
  const quatrefoil = [];
  for (let q = 0; q < 4; q++) {
    const [cx, cz] = rot(RO, 0, q);
    for (let k = 0; k <= 16; k++) {
      const a = (q * Math.PI) / 2 - Math.PI / 2 + (k / 16) * Math.PI;
      quatrefoil.push([cx + Math.cos(a) * RI, cz + Math.sin(a) * RI]);
    }
  }
  const square = (h) => [[-h, -h], [h, -h], [h, h], [-h, h]];
  const corners = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  const holes = [quatrefoil, ...corners.map(([sx, sz]) => circle(sx * CC, sz * CC, CRI))];
  plate(roof, 'kursun', C + 0.9, square(HALF + 0.35), holes, UP);
  plate(inside, 'ic', C - 0.25, square(HALF), holes, DOWN);
  for (let q = 0; q < 4; q++) {
    const [cx, cz] = rot(RO, 0, q), a0 = (q * Math.PI) / 2 - Math.PI / 2;
    lathe(roof, cx, cz, domeProfile(RO, C, HD.drum, HD.rise, 6, 'kasnak', 'kursun'), 16, a0, a0 + Math.PI);
    lathe(inside, cx, cz, domeProfile(RI, C - 0.25, HD.drum + 0.25, HD.riseIn, 6, 'kasnak_ic', 'ic'), 16, a0, a0 + Math.PI);
    // Orta kulenin duvarı: yarım kubbenin ağzı (büyük kemer) boşluk, üstü dolu
    const arc = [[-RI, C - 0.25], [-RI, C + HD.drum]];
    for (let j = 5; j >= -5; j--) {
      const lat = (Math.abs(j) / 6) * (Math.PI / 2);
      arc.push([-Math.sign(j || 1) * RI * Math.cos(lat) * (j === 0 ? 0 : 1), C + HD.drum + HD.riseIn * Math.sin(lat)]);
    }
    arc.splice(7, 1, [-RI * Math.cos((1 / 6) * Math.PI / 2), C + HD.drum + HD.riseIn * Math.sin((1 / 6) * Math.PI / 2)], [0, C + HD.drum + HD.riseIn], [RI * Math.cos((1 / 6) * Math.PI / 2), C + HD.drum + HD.riseIn * Math.sin((1 / 6) * Math.PI / 2)]);
    arc.push([RI, C + HD.drum], [RI, C - 0.25]);
    arc.sort((a, b) => a[0] - b[0] || 0);
    const face = (part, mat, d, ext, y0) => {
      const pt = (s, y) => {
        const [x, z] = rot(RO + d, s, q);
        return V(x, y, z);
      };
      const [nx, nz] = rot(1, 0, q), n = V(nx, 0, nz);
      const line = [[-RO - ext, y0], ...arc.filter(([, y], i) => !(i === 0 || i === arc.length - 1) || true), [RO + ext, y0]];
      for (let i = 0; i + 1 < line.length; i++) {
        const [s0, y0a] = line[i], [s1, y1a] = line[i + 1];
        if (Math.abs(s1 - s0) < 1e-6) continue;
        part.quad(mat, [pt(s0, Math.max(y0a, y0)), pt(s1, Math.max(y1a, y0)), pt(s1, TOPY), pt(s0, TOPY)], [[s0 / US, y0a / US], [s1 / US, y1a / US], [s1 / US, TOPY / US], [s0 / US, TOPY / US]], n);
      }
    };
    face(inside, 'ic', 0, 0, C - 0.25);
    face(roof, 'tas', 0.3, 0.3, C);
  }
  for (const [sx, sz] of corners) {
    lathe(roof, sx * CC, sz * CC, domeProfile(CR, C + 0.9, 1.9, 4.4, 5, 'kasnak', 'kursun'), 16);
    lathe(inside, sx * CC, sz * CC, domeProfile(CRI, C - 0.25, 3, 4.1, 5, 'kasnak_ic', 'ic'), 16);
    alem(roof, sx * CC, sz * CC, C + 7.1, 0.7);
  }
  // Pandantif levhası, ana kasnak ve kubbe
  plate(roof, 'kursun', TOPY + 0.05, square(RO + 0.3), [circle(0, 0, RI, 32)], UP);
  plate(inside, 'ic', TOPY - 0.05, square(RO), [circle(0, 0, RI, 32)], DOWN);
  lathe(roof, 0, 0, domeProfile(RO, TOPY, 4, 9, 8, 'kasnak', 'kursun'), 32);
  lathe(inside, 0, 0, domeProfile(RI, TOPY - 0.05, 4.05, 8.7, 8, 'kasnak_ic', 'ic'), 32);
  alem(roof, 0, 0, TOPY + 12.9, 1.3);
  // Fil ayakları: içeride yivli mermer paye, dışarıda ağırlık kulesi olarak yükselir
  for (const [sx, sz] of corners) {
    lathe(inside, sx * RO, sz * RO, [[2.8, 0], [2.8, 1.2], [2.5, 1.5], [2.5, 8], [2.65, 8.2], [2.65, 8.8], [2.5, 9], [2.5, C]].map(([r, y]) => ({ r, y, mat: y < 8.2 ? 'mermer' : 'ic' })), 16);
    lathe(roof, sx * RO, sz * RO, [{ r: 2.6, y: C, mat: 'tas' }, { r: 2.6, y: 33.5, mat: 'tas' }, { r: 2.9, y: 33.8, mat: 'kursun' }, { r: 2.2, y: 35.4, mat: 'kursun' }, { r: 0, y: 36.6 }], 8, Math.PI / 8, TAU + Math.PI / 8);
    alem(roof, sx * RO, sz * RO, 36.4, 0.6);
  }
  add(roof);
  // Mihrap ve minber
  inside.quad('mihrap', [V(-2.2, 0, -HALF + T + 0.08), V(2.2, 0, -HALF + T + 0.08), V(2.2, 8.8, -HALF + T + 0.08), V(-2.2, 8.8, -HALF + T + 0.08)], flat, Z);
  for (let k = 0; k < 10; k++) inside.box('mermer', 5.6, 6.8, 0, 0.36 * (k + 1), -17.4 - 0.62 * (k + 1), -17.4 - 0.62 * k, ['+x', '-x', '+z', '+y'], 2, 2);
  inside.box('mermer', 5.6, 6.8, 0, 3.6, -24.7, -23.6, ['+x', '-x', '+z', '+y'], 2, 2);
  for (const [x, z] of [[5.7, -23.7], [6.7, -23.7], [5.7, -24.6], [6.7, -24.6]]) inside.box('mermer', x - 0.07, x + 0.07, 3.6, 6, z - 0.07, z + 0.07, ['+x', '-x', '+z', '-z'], 2, 2);
  lathe(inside, 6.2, -24.15, [{ r: 0.85, y: 6, mat: 'kursun' }, { r: 0.6, y: 6.5, mat: 'kursun' }, { r: 0, y: 8.4 }], 6);
  add(inside);

  // ---------- Avlu: duvarlar, üç taç kapı, revak, kubbecikler ----------
  const court = new Part('avlu');
  const courtTiers = [[1.2, 'alt', 'alt', 1.6, 2.6], [5.6, 'kemer', null, 1.6, 3.6]], CH = 11, CT = 1;
  const cw = { H: CH, T: CT, inn: 'tas', tiers: courtTiers };
  wall(court, { ...cw, P: V(-HALF, 0, Z1), R: X, N: Z, len: 52, gaps: [{ a0: 24, a1: 28, h: 7 }] });
  wall(court, { ...cw, P: V(HALF, 0, Z1), R: nZ, N: X, len: 52, gaps: [{ a0: 24.3, a1: 27.7, h: 6 }] });
  wall(court, { ...cw, P: V(-HALF, 0, HALF), R: Z, N: nX, len: 52, gaps: [{ a0: 24.3, a1: 27.7, h: 6 }] });
  // Taç kapı: duvardan taşan ve yükselen mermer kütle, mukarnas kavsara ve kitabe
  const portal = (c, N, half, h, top, text) => {
    const R = V(-N.z, 0, N.x), at = (a, y, d) => c.clone().addScaledVector(R, a).addScaledVector(N, d).setY(y);
    const blk = (a0, a1, y0, y1, faces) => {
      const p = at(a0, 0, 0), q = at(a1, 0, 1.5);
      court.box('mermer', Math.min(p.x, q.x), Math.max(p.x, q.x), y0, y1, Math.min(p.z, q.z), Math.max(p.z, q.z), faces, US, US);
    };
    blk(-half - 2.2, -half, 0, top, ALL);
    blk(half, half + 2.2, 0, top, ALL);
    blk(-half, half, h, top, ALL);
    const q = (mat, a0, a1, y0, y1) => court.quad(mat, [at(a0, y0, 1.56), at(a1, y0, 1.56), at(a1, y1, 1.56), at(a0, y1, 1.56)], flat, N);
    q('mukarnas', -half, half, h, h + (top - h) * 0.55);
    q(text, -half - 0.4, half + 0.4, top - 2.3, top - 0.9);
  };
  portal(V(0, 0, Z1), Z, 2, 7, 15, 'kitabe');
  portal(V(HALF, 0, 52), X, 1.7, 6, 13, 'kitabe2');
  portal(V(-HALF, 0, 52), nX, 1.7, 6, 13, 'kitabe2');
  // Avlu döşemesi ve duvar üstü korkuluk
  court.quad('mermer', [V(-25, 0.02, 26), V(25, 0.02, 26), V(25, 0.02, 77), V(-25, 0.02, 77)], [[0, 0], [10, 0], [10, 10], [0, 10]], UP);
  const band = (x0, x1, z0, z1) => court.box('korkuluk', x0, x1, CH, CH + 1, z0, z1, ['+x', '-x', '+z', '-z', '+y'], 1, 1);
  band(-HALF, HALF, Z1 - 0.3, Z1);
  band(-HALF, -HALF + 0.3, HALF, Z1);
  band(HALF - 0.3, HALF, HALF, Z1);
  // Revak: sütunlar, sivri kemerler, düz örtü ve üstünde kubbecikler
  const G = 5.2, A0 = -20.8, ZA = 31.2, YS = 5.6, YT = 9, pts = [];
  for (let k = 0; k <= 8; k++) pts.push([A0 + k * G, ZA]);
  for (let k = 1; k <= 8; k++) pts.push([-A0, ZA + k * G]);
  for (let k = 1; k <= 8; k++) pts.push([-A0 - k * G, ZA + 8 * G]);
  for (let k = 1; k < 8; k++) pts.push([A0, ZA + (8 - k) * G]);
  pts.forEach(([x, z], i) => {
    column(court, x, z, YS);
    const [x1, z1] = pts[(i + 1) % pts.length];
    archSpan(court, 'mermer', V(x, 0, z), V(x1, 0, z1), YS, YT);
  });
  for (const [x0, x1, z0, z1] of [[-25, 25, 26, 31.55], [-25, 25, 72.45, 77], [-25, -20.45, 31.55, 72.45], [20.45, 25, 31.55, 72.45]]) {
    court.box('kursun', x0, x1, YT, YT + 0.5, z0, z1, ['+x', '-x', '+z', '-z', '+y'], US, US);
    court.box('ic', x0, x1, YT - 0.02, YT, z0, z1, ['-y'], US, US);
  }
  for (let i = 0; i < 10; i++) for (let k = 0; k < 10; k++) {
    if (i > 0 && i < 9 && k > 0 && k < 9) continue;
    const x = -23.4 + i * G, z = 28.6 + k * G;
    lathe(court, x, z, domeProfile(2.15, YT + 0.5, 0.6, 1.7, 4, 'kasnak', 'kursun'), 12);
  }
  add(court);

  // ---------- Şadırvan: altıgen, sütunlu, kubbeli ----------
  const fountain = new Part('sadirvan');
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU, b = ((k + 1) / 6) * TAU;
    column(fountain, Math.cos(a) * 3.1, Math.sin(a) * 3.1, 3.6, 0.24);
    archSpan(fountain, 'mermer', V(Math.cos(a) * 3.1, 0, Math.sin(a) * 3.1), V(Math.cos(b) * 3.1, 0, Math.sin(b) * 3.1), 3.6, 5.2, 0.45);
  }
  lathe(fountain, 0, 0, [{ r: 2.1, y: 0, mat: 'mermer' }, { r: 2.1, y: 1.3, mat: 'mermer' }, { r: 1.8, y: 1.3, mat: 'mermer' }, { r: 1.8, y: 0.9, mat: 'kursun' }, { r: 0, y: 0.9 }], 6);
  lathe(fountain, 0, 0, [{ r: 3.7, y: 5.2, mat: 'kursun' }, { r: 3.4, y: 5.5, mat: 'kursun' }, { r: 2.4, y: 6.6, mat: 'kursun' }, { r: 0, y: 7.3 }], 6);
  alem(fountain, 0, 0, 7.2, 0.5);
  add(fountain, 0, 52);

  // ---------- Minareler: dördü üç, ikisi iki şerefeli ----------
  const minaret = (name, x, z, balconies, shaftTop, tip) => {
    const part = new Part(name), prof = [{ r: 2.7, y: -1.2, mat: 'tas' }, { r: 2.7, y: 9, mat: 'tas' }, { r: 1.75, y: 12.5, mat: 'tas' }];
    let r = 1.7;
    for (const by of balconies) {
      prof.push({ r, y: by - 1.5, mat: 'tas' }, { r: 2.5, y: by, mat: 'korkuluk', fit: 1 }, { r: 2.5, y: by + 1.1, mat: 'tas' }, { r: 2.35, y: by + 1.1, mat: 'tas' }, { r: 2.35, y: by + 0.1, mat: 'mermer' });
      r -= 0.1;
      prof.push({ r, y: by + 0.1, mat: 'tas' });
    }
    prof.push({ r, y: shaftTop, mat: 'kursun' }, { r: r + 0.2, y: shaftTop + 0.3, mat: 'kursun' }, { r: 0, y: tip });
    lathe(part, 0, 0, prof, 12);
    alem(part, 0, 0, tip - 0.4, 0.6);
    add(part, x, z);
  };
  minaret('minare_1', -27.6, -27.6, [28, 38, 48], 54, 65);
  minaret('minare_2', 27.6, -27.6, [28, 38, 48], 54, 65);
  minaret('minare_3', -27.6, 26, [28, 38, 48], 54, 65);
  minaret('minare_4', 27.6, 26, [28, 38, 48], 54, 65);
  minaret('minare_5', -27.6, 79.4, [25, 35], 41, 51);
  minaret('minare_6', 27.6, 79.4, [25, 35], 41, 51);
  return root;
}
