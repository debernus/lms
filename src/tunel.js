import * as THREE from 'three';
import { canvasTexture } from './halk2.js';
import { Part } from './arapcami.js';

// Taş tünel girişi: payeli cephe duvarı, kemer taşlı tünel ağzı, iki yanda öne uzanan eğimli istinat
// duvarları. Kemerin içinde kemer biçimli büyük ahşap-demir kapı; ortasında dikdörtgen kapı yeri BOŞ
// bırakılmıştır (delik; arkası açık). 1 birim = 1 metre, Y yukarı, ön yüz +Z, taban y = 0 ve merkezde.
// Parçalar: tunel_duvar, tunel_kemer, tunel_kapi.

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const US = 3; // taş dokusu: 1 doku = 3 m
const W = 8.2, H = 9, ZF = 0.75, ZB = -0.75; // cephe yarı genişliği, yüksekliği, ön ve arka yüz
const A = 2.6, S = 2.6, N = 16; // kemer yarıçapı, üzengi yüksekliği, kemer dilimi
const DOOR = { half: 0.8, h: 2.3 }; // boş bırakılan dikdörtgen kapı yeri: 1,6 × 2,3 m

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
// Kesme taş duvar: gri bloklar, nem izleri, yosun
function stoneTexture(name, seed, tone) {
  return canvasTexture(name, 512, 512, (g) => {
    const rand = rng(seed);
    g.fillStyle = '#4a4740';
    g.fillRect(0, 0, 512, 512);
    for (let row = 0; row < 10; row++) for (let k = -1; k < 6; k++) {
      const v = tone + rand() * 34, x = k * 102.4 + (row % 2) * 51.2;
      g.fillStyle = `rgb(${v},${v - 3},${v - 12})`;
      g.fillRect(x + 2, row * 51.2 + 2, 98.4, 47.2);
      g.fillStyle = `rgba(30,28,24,${rand() * 0.25})`;
      g.fillRect(x + 2 + rand() * 40, row * 51.2 + 2, 30 + rand() * 40, 47.2);
    }
    g.filter = 'blur(12px)';
    for (let i = 0; i < 22; i++) {
      g.fillStyle = i % 2 ? `rgba(74,86,48,${0.16 + rand() * 0.2})` : `rgba(24,22,20,${0.14 + rand() * 0.18})`;
      g.beginPath();
      g.ellipse(80 + rand() * 352, 80 + rand() * 352, 20 + rand() * 50, 26 + rand() * 60, 0, 0, 6.3);
      g.fill();
    }
    g.filter = 'none';
  });
}
// Kemer taşı: tek blok; dokunun sağ ve sol kenarı derz
function voussoirTexture() {
  return canvasTexture('kemer_tasi', 128, 128, (g) => {
    const rand = rng(4);
    g.fillStyle = '#8a867a';
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = `rgba(${rand() < 0.5 ? '40,38,32' : '170,166,150'},${0.06 + rand() * 0.12})`;
      g.fillRect(rand() * 128, rand() * 128, 4 + rand() * 20, 4 + rand() * 20);
    }
    g.fillStyle = '#3c3a34';
    g.fillRect(0, 0, 4, 128);
    g.fillRect(124, 0, 4, 128);
    g.fillStyle = 'rgba(70,84,44,0.3)';
    g.fillRect(0, 0, 128, 26);
  });
}
// Kapı: düşey kalaslar, paslı demir kuşaklar ve perçinler (doku kapının tümünü kaplar)
function gateTexture() {
  return canvasTexture('kapi_ahsap_demir', 512, 512, (g) => {
    const rand = rng(17);
    for (let k = 0; k < 20; k++) {
      const v = 58 + rand() * 26;
      g.fillStyle = `rgb(${v + 14},${v},${v - 18})`;
      g.fillRect(k * 25.6, 0, 25.6, 512);
      g.fillStyle = 'rgba(16,10,6,0.7)';
      g.fillRect(k * 25.6, 0, 2, 512);
      for (let i = 0; i < 8; i++) {
        g.fillStyle = `rgba(20,12,8,${0.1 + rand() * 0.2})`;
        g.fillRect(k * 25.6 + 3 + rand() * 18, rand() * 512, 2, 30 + rand() * 120);
      }
    }
    for (const y of [36, 150, 264, 378, 474]) {
      g.fillStyle = '#3a2c24';
      g.fillRect(0, y, 512, 22);
      g.fillStyle = 'rgba(120,62,30,0.35)';
      for (let i = 0; i < 30; i++) g.fillRect(rand() * 512, y + rand() * 18, 6 + rand() * 30, 3);
      g.fillStyle = '#1c1612';
      for (let x = 12.8; x < 512; x += 25.6) {
        g.beginPath();
        g.arc(x, y + 11, 4, 0, 6.3);
        g.fill();
      }
    }
    const grad = g.createLinearGradient(0, 512, 0, 380);
    grad.addColorStop(0, 'rgba(20,18,12,0.6)');
    grad.addColorStop(1, 'rgba(20,18,12,0)');
    g.fillStyle = grad;
    g.fillRect(0, 380, 512, 132);
  });
}

// Kemerin dış çizgisi: sol alttan kemerin üstünden sağ alta
const arc = Array.from({ length: N + 1 }, (_, i) => {
  const t = Math.PI - (i / N) * Math.PI;
  return [A * Math.cos(t), S + A * Math.sin(t), t];
});

export function createTunelGirisi() {
  const root = new THREE.Group();
  root.name = 'tunel_girisi';
  const std = (name, o) => new THREE.MeshStandardMaterial({ name, roughness: 0.92, metalness: 0, ...o });
  const M = {
    tas: std('kesme_tas', { map: stoneTexture('kesme_tas', 3, 104) }),
    tas_koyu: std('istinat_tasi', { map: stoneTexture('istinat_tasi', 12, 88) }),
    kemer: std('kemer_tasi', { map: voussoirTexture() }),
    levha: std('kitabe_levhasi', { color: 0x9c988c }),
    kapi: std('kapi_ahsap_demir', { map: gateTexture(), roughness: 0.85 }),
    demir: std('demir_cerceve', { color: 0x2c2622, roughness: 0.7, metalness: 0.5 }),
  };
  const uv = (p) => [p.x / US, p.y / US];

  // ---------- Cephe duvarı: kemer açıklığı delik ----------
  const wall = new Part('tunel_duvar');
  for (const [z, n] of [[ZF, 1], [ZB, -1]]) {
    const hint = v3(0, 0, n), q = (pts) => wall.quad('tas', pts, pts.map(uv), hint);
    q([v3(-W, 0, z), v3(-A, 0, z), v3(-A, H, z), v3(-W, H, z)]);
    q([v3(A, 0, z), v3(W, 0, z), v3(W, H, z), v3(A, H, z)]);
    for (let i = 0; i < N; i++) q([v3(arc[i][0], arc[i][1], z), v3(arc[i + 1][0], arc[i + 1][1], z), v3(arc[i + 1][0], H, z), v3(arc[i][0], H, z)]);
  }
  wall.box('tas', -W, W, 0, H, ZB, ZF, ['+x', '-x', '+y'], US, US);
  // Payeler: kaide, gövde, başlık; üstte boydan boya silme; kemerin üstünde boş kitabe levhası
  for (const s of [-1, 1]) {
    const x = s * 4.65;
    wall.box('tas', x - 0.45, x + 0.45, 0.9, 7.0, ZF, ZF + 0.35, ['+x', '-x', '+z'], US, US);
    wall.box('tas', x - 0.6, x + 0.6, 0, 0.9, ZF, ZF + 0.5, ['+x', '-x', '+z', '+y'], US, US);
    wall.box('tas', x - 0.6, x + 0.6, 7.0, 7.4, ZF, ZF + 0.5, ['+x', '-x', '+z', '+y', '-y'], US, US);
  }
  wall.box('tas', -W - 0.15, W + 0.15, H - 0.55, H + 0.05, ZB - 0.1, ZF + 0.3, ['+x', '-x', '+z', '-z', '+y', '-y'], US, US);
  wall.box('levha', -0.95, 0.95, 6.35, 7.15, ZF, ZF + 0.1, ['+x', '-x', '+z', '+y', '-y'], US, US);
  // Eğimli istinat duvarları: cepheden öne doğru açılarak uzanır, uca doğru alçalır
  for (const s of [-1, 1]) {
    const n0 = v3(s * 6.4, 0, ZF), f0 = v3(s * 7.9, 0, ZF + 10), n1 = v3(s * 7.7, H, ZF), f1 = v3(s * 9.3, 5.2, ZF + 10);
    const on0 = v3(s * 11.2, 0, ZF), of0 = v3(s * 11.2, 0, ZF + 10), on1 = v3(s * 11.2, H, ZF), of1 = v3(s * 11.2, 5.2, ZF + 10);
    const side = (p) => [p.z / US, p.y / US], front = (p) => [p.x / US, p.y / US], top = (p) => [p.x / US, p.z / US];
    wall.quad('tas_koyu', [n0, f0, f1, n1], [n0, f0, f1, n1].map(side), v3(-s, 0.3, 0)); // iç eğimli yüz
    wall.quad('tas_koyu', [n1, f1, of1, on1], [n1, f1, of1, on1].map(top), v3(0, 1, 0));
    wall.quad('tas_koyu', [f0, of0, of1, f1], [f0, of0, of1, f1].map(front), v3(0, 0, 1));
    wall.quad('tas_koyu', [on0, of0, of1, on1], [on0, of0, of1, on1].map(side), v3(s, 0, 0));
    wall.quad('tas_koyu', [n0, on0, on1, n1], [n0, on0, on1, n1].map(front), v3(0, 0, -1));
  }
  root.add(wall.mesh(M));

  // ---------- Kemer: öne taşan kemer taşları ve tünel ağzının iç yüzü ----------
  const arch = new Part('tunel_kemer'), RING = 0.75, LIP = 0.12, ZR = ZF + LIP;
  const ringPt = (i, r, z) => (i < 0 ? v3(-r, 0, z) : i > N ? v3(r, 0, z) : v3(Math.cos(arc[i][2]) * r, S + Math.sin(arc[i][2]) * r, z));
  // Dizi: sol ayak (0–S), kemer, sağ ayak
  const path = [-1, ...arc.map((_, i) => i), N + 1];
  let run = 0;
  for (let k = 0; k + 1 < path.length; k++) {
    const i = path[k], j = path[k + 1], len = ringPt(i, A, 0).distanceTo(ringPt(j, A, 0)), u0 = run / 0.52, u1 = (run + len) / 0.52;
    run += len;
    const mid = ringPt(i, A, 0).add(ringPt(j, A, 0)).multiplyScalar(0.5), outward = v3(mid.x, Math.max(0, mid.y - S), 0).normalize();
    arch.quad('kemer', [ringPt(i, A, ZR), ringPt(j, A, ZR), ringPt(j, A + RING, ZR), ringPt(i, A + RING, ZR)], [[u0, 0], [u1, 0], [u1, 1], [u0, 1]], v3(0, 0, 1)); // ön yüz
    arch.quad('kemer', [ringPt(i, A + RING, ZF), ringPt(j, A + RING, ZF), ringPt(j, A + RING, ZR), ringPt(i, A + RING, ZR)], [[u0, 0], [u1, 0], [u1, 0.2], [u0, 0.2]], outward); // dış kenar
    arch.quad('tas', [ringPt(i, A, ZB), ringPt(j, A, ZB), ringPt(j, A, ZR), ringPt(i, A, ZR)], [[ZB / US, (run - len) / US], [ZB / US, run / US], [ZR / US, run / US], [ZR / US, (run - len) / US]], outward.clone().negate()); // tünel ağzının iç yüzü
  }
  root.add(arch.mesh(M));

  // ---------- Kapı: kemer biçimli kanat, ortasında boş dikdörtgen kapı yeri ----------
  const gate = new Part('tunel_kapi'), G1 = 0.05, G0 = -0.09, D = DOOR.half, DH = DOOR.h;
  const guv = (p) => [(p.x + A) / (2 * A), p.y / (S + A)];
  for (const [z, n] of [[G1, 1], [G0, -1]]) {
    const hint = v3(0, 0, n), q = (pts) => gate.quad('kapi', pts, pts.map(guv), hint);
    q([v3(-A, 0, z), v3(-D, 0, z), v3(-D, S, z), v3(-A, S, z)]);
    q([v3(D, 0, z), v3(A, 0, z), v3(A, S, z), v3(D, S, z)]);
    q([v3(-D, DH, z), v3(D, DH, z), v3(D, S, z), v3(-D, S, z)]);
    for (let i = 0; i < N; i++) {
      const pts = [v3(0, S, z), v3(arc[i][0], arc[i][1], z), v3(arc[i + 1][0], arc[i + 1][1], z)];
      gate.tri('kapi', pts, pts.map(guv), hint);
    }
  }
  // Kapı yerinin iç kenarları (kanadın kalınlığı) ve demir çerçevesi
  const flat = [[0, 0], [1, 0], [1, 1], [0, 1]];
  for (const s of [-1, 1]) gate.quad('demir', [v3(s * D, 0, G0), v3(s * D, 0, G1), v3(s * D, DH, G1), v3(s * D, DH, G0)], flat, v3(-s, 0, 0));
  gate.quad('demir', [v3(-D, DH, G0), v3(D, DH, G0), v3(D, DH, G1), v3(-D, DH, G1)], flat, v3(0, -1, 0));
  const FR = 0.12, FZ = G1 + 0.04;
  for (const [x0, x1, y0, y1] of [[-D - FR, -D, 0, DH + FR], [D, D + FR, 0, DH + FR], [-D, D, DH, DH + FR]]) {
    gate.box('demir', x0, x1, y0, y1, G1, FZ, ['+x', '-x', '+z', '+y', '-y'], 1, 1);
  }
  root.add(gate.mesh(M));
  return root;
}
