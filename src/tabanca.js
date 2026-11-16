import * as THREE from 'three';
import { Surface } from './outfit.js';

// Eski kapsüllü (perküsyon) süvari tabancası, 19. yüzyıl ortası; sahne dekoru. Gerçek boyut
// (yaklaşık 36 cm), 1 birim = 1 metre, Y yukarı, namlu +Z'ye bakar. Yan yatmadan, dik durur:
// en alt noktası y = 0'da, taban ortası (0, 0, 0)'da. Dokusuz; hareketli parça yok.

const TAU = Math.PI * 2;
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const X = v3(1, 0, 0);

// Y-Z düzlemindeki bir yol boyunca oval kesitli gövde. sections: [z, y, yarı en (x), yarı yükseklik]
function loft(s, sections, { x = 0, segs = 12, capStart = true, capEnd = true } = {}) {
  const pts = sections.map(([z, y]) => v3(x, y, z));
  let before = null;
  sections.forEach(([, , rx, rn], i) => {
    const c = pts[i];
    const t = pts[Math.min(i + 1, pts.length - 1)].clone().sub(pts[Math.max(i - 1, 0)]).normalize();
    const n = t.clone().cross(X).normalize();
    const ring = Array.from({ length: segs }, (_, k) => {
      const a = (k / segs) * TAU + Math.PI / segs;
      const p = c.clone().addScaledVector(X, Math.cos(a) * rx).addScaledVector(n, Math.sin(a) * rn);
      return s.point(p.x, p.y, p.z);
    });
    if (before) s.strip(before, ring, true, (px, py, pz) => [px - c.x, py - c.y, pz - c.z]);
    if ((i === 0 && capStart) || (i === sections.length - 1 && capEnd)) {
      const sign = i === 0 ? -1 : 1;
      s.fan(s.point(c.x, c.y, c.z), ring.map((id) => {
        const p = s.positions.slice(id * 3, id * 3 + 3); // kapak kendi köşeleriyle: kenar keskin kalır
        return s.point(p[0], p[1], p[2]);
      }), () => t.clone().multiplyScalar(sign).toArray());
    }
    before = ring;
  });
}
function box(s, cx, cy, cz, w, h, d) {
  const c = (a, b, e) => s.point(cx + (a * w) / 2, cy + (b * h) / 2, cz + (e * d) / 2);
  for (const [axis, sign] of [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]]) {
    const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, w2]) => {
      const p = [0, 0, 0];
      p[axis] = sign;
      p[(axis + 1) % 3] = u;
      p[(axis + 2) % 3] = w2;
      return c(...p);
    });
    const start = s.indices.length;
    s.indices.push(q[0], q[1], q[2], q[0], q[2], q[3]);
    const n = [0, 0, 0];
    n[axis] = sign;
    s.orient(start, () => n);
  }
}

export function createTabanca() {
  const wood = new Surface(), iron = new Surface(), band = new Surface(), brass = new Surface();

  // Namlu: kuyrukta sekizgen ve kalın, ağza doğru incelir; ağızda küçük bir bilezik
  loft(iron, [[-0.012, 0, 0.0125, 0.0125], [0.06, 0, 0.012, 0.012], [0.2, 0, 0.0098, 0.0098], [0.214, 0, 0.0098, 0.0098], [0.216, 0, 0.0108, 0.0108], [0.224, 0, 0.0108, 0.0108]], { segs: 8 });
  loft(iron, [[0.2238, 0, 0.0062, 0.0062], [0.2245, 0, 0.0062, 0.0062]], { segs: 8, capStart: false }); // namlu ağzı: koyu iç
  box(iron, 0, 0.0115, 0.2, 0.002, 0.004, 0.008); // arpacık
  box(iron, 0, 0.005, -0.03, 0.012, 0.006, 0.04); // kuyruk tırnağı: namluyu kabzaya bağlayan dil

  // Kundak ve kabza: namlunun altında uzanan el kundağı, kilit bölgesinde kalınlaşır, bilekte
  // aşağı kıvrılıp dipte genişleyen kabzaya döner
  loft(wood, [
    [0.186, -0.011, 0.0105, 0.0105], [0.12, -0.012, 0.0135, 0.0125], [0.045, -0.013, 0.016, 0.0155],
    [0.0, -0.011, 0.0185, 0.02], [-0.04, -0.014, 0.0175, 0.021], [-0.075, -0.031, 0.0155, 0.0195],
    [-0.106, -0.06, 0.0155, 0.0195], [-0.127, -0.09, 0.017, 0.0215], [-0.138, -0.112, 0.0185, 0.0235],
  ], { segs: 14, capEnd: false });
  // Kabza başlığı: dipteki pirinç kapak
  loft(brass, [[-0.1375, -0.111, 0.0195, 0.0245], [-0.142, -0.121, 0.0198, 0.025], [-0.1445, -0.126, 0.0165, 0.021]], { segs: 14, capStart: false });

  // Namlu bileziği: namluyu kundağa bağlayan deri-pirinç kuşak
  loft(band, [[0.118, -0.0055, 0.0155, 0.0205], [0.142, -0.0055, 0.015, 0.02]], { segs: 14 });

  // Kilit (sağ yanda): plaka, horoz, horozun vurduğu kapsül yuvası
  const LX = -0.0185; // namlu +Z'ye bakarken silahın sağı -X'tir
  loft(iron, [[-0.062, -0.012, 0.0022, 0.006], [-0.045, -0.006, 0.0022, 0.011], [0.0, -0.003, 0.0022, 0.0115], [0.03, -0.004, 0.0022, 0.0075], [0.038, -0.005, 0.0022, 0.004]], { x: LX, segs: 8 });
  loft(iron, [[-0.03, -0.004, 0.0035, 0.0075], [-0.034, 0.012, 0.0035, 0.0055], [-0.03, 0.026, 0.0035, 0.005], [-0.02, 0.031, 0.0035, 0.0045], [-0.011, 0.025, 0.0035, 0.005], [-0.008, 0.0185, 0.0035, 0.0055]], { x: LX - 0.004, segs: 8 }); // horoz
  loft(iron, [[-0.036, 0.03, 0.003, 0.0035], [-0.047, 0.04, 0.003, 0.003]], { x: LX - 0.004, segs: 8 }); // horoz mahmuzu
  box(iron, LX + 0.004, 0.009, -0.006, 0.01, 0.008, 0.012); // kapsül yuvası
  loft(iron, [[-0.03, -0.004, 0.006, 0.0035], [-0.0295, -0.004, 0.006, 0.0035]], { x: LX - 0.0035, segs: 8 }); // horoz vidası
  // Sol yanda kilit vidalarının karşılık plakası
  loft(iron, [[-0.05, -0.008, 0.0015, 0.006], [0.02, -0.005, 0.0015, 0.006]], { x: 0.018, segs: 8 });

  // Tetik korkuluğu ve tetik
  loft(iron, [[0.012, -0.03, 0.005, 0.002], [0.002, -0.036, 0.005, 0.002], [-0.006, -0.052, 0.005, 0.002], [-0.02, -0.06, 0.005, 0.002], [-0.04, -0.058, 0.005, 0.002], [-0.054, -0.048, 0.005, 0.002], [-0.07, -0.046, 0.005, 0.002]], { segs: 8 });
  loft(iron, [[-0.024, -0.03, 0.002, 0.0035], [-0.027, -0.043, 0.002, 0.003], [-0.024, -0.052, 0.002, 0.002]], { segs: 6 });

  // Harbi: namlunun altında, kundağın içine giren ince çubuk; ucunda topuz
  loft(iron, [[0.06, -0.0265, 0.0028, 0.0028], [0.2, -0.0225, 0.0028, 0.0028], [0.204, -0.0224, 0.0045, 0.0045], [0.216, -0.022, 0.0045, 0.0045]], { segs: 8 });
  loft(band, [[0.168, -0.0215, 0.0048, 0.0058], [0.184, -0.021, 0.0048, 0.0058]], { segs: 8 }); // harbi yuvası

  const mat = (name, color, roughness, metalness) => new THREE.MeshStandardMaterial({ name, color, roughness, metalness });
  const parts = [
    ['kundak', wood, mat('eski_ceviz', 0x4a2a1b, 0.8, 0)],
    ['demir_aksam', iron, mat('pasli_demir', 0x3b302a, 0.78, 0.55)],
    ['bilezik', band, mat('bilezik', 0x5c4027, 0.75, 0.3)],
    ['kabza_basligi', brass, mat('kararmis_pirinc', 0x5a4720, 0.7, 0.6)],
  ];
  const root = new THREE.Group();
  root.name = 'tabanca';
  const boxAll = new THREE.Box3();
  for (const [name, s, material] of parts) {
    const mesh = new THREE.Mesh(s.geometry(), material);
    mesh.name = name;
    mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
    boxAll.expandByObject(mesh);
  }
  // En alt nokta y = 0'a, taban ortası (0, 0, 0)'a: köşeler kaydırılır, düğümlerde dönüşüm kalmaz
  const shift = [-(boxAll.min.x + boxAll.max.x) / 2, -boxAll.min.y, -(boxAll.min.z + boxAll.max.z) / 2];
  for (const mesh of root.children) mesh.geometry.translate(...shift);
  return root;
}
