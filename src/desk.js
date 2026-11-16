import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { woodTextures } from './geometry.js';

// Memur çalışma masası (1914, Osmanlı İstanbul'u). Birim metre, Y yukarı, taban ortası (0, 0, 0).
// Ön yüz (çekmeceler) +Z'ye bakar. En 1,6 m, derinlik 0,8 m, yükseklik 0,78 m.

const AXES = { x: 0, y: 1, z: 2 };
// Kutu yüzleri: [ad, normal ekseni, yön, iki kenar ekseni]
const FACES = [
  ['px', 0, 1, 2, 1], ['nx', 0, -1, 2, 1],
  ['py', 1, 1, 0, 2], ['ny', 1, -1, 0, 2],
  ['pz', 2, 1, 0, 1], ['nz', 2, -1, 0, 1],
];

// Ahşap parça: yalnız görünen yüzleri olan kutu. skip: modellenmeyecek yüzler ("py ny" gibi).
// Damar, kutunun en uzun kenarı boyunca akar; shade parçanın tonunu biraz değiştirir.
function board(w, h, d, x, y, z, { skip = '', shade = 1, grain } = {}) {
  const size = [w, h, d];
  const center = [x, y, z];
  const grainAxis = grain ? AXES[grain] : size.indexOf(Math.max(...size));
  const positions = [];
  const normals = [];
  const uvs = [];
  const colors = [];
  const indices = [];
  for (const [name, n, dir, a, b] of FACES) {
    if (skip.includes(name)) continue;
    const base = positions.length / 3;
    for (const [sa, sb] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const p = [0, 0, 0];
      p[n] = center[n] + (dir * size[n]) / 2;
      p[a] = center[a] + (sa * size[a]) / 2;
      p[b] = center[b] + (sb * size[b]) / 2;
      positions.push(...p);
      const nrm = [0, 0, 0];
      nrm[n] = dir;
      normals.push(...nrm);
      // V damar boyunca, U damara dik
      const along = a === grainAxis ? a : b === grainAxis ? b : a;
      const across = along === a ? b : a;
      uvs.push(p[across] * 2.2 + n * 0.37, p[along] * 0.85 + shade);
      // Yere yakın kısımlar ve köşeler biraz daha koyu: yıpranma ve kir
      const tone = shade * (0.82 + 0.18 * THREE.MathUtils.smoothstep(p[1], 0, 0.3)) * (0.93 + 0.07 * Math.sin(p[0] * 9 + p[2] * 13 + p[1] * 7));
      colors.push(tone, tone, tone);
    }
    // Köşe sırası dışarıdan bakınca saat yönünün tersine olmalı
    const flip = (n === 0 ? dir : n === 1 ? dir : -dir) < 0;
    if (flip) indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    else indices.push(base, base + 2, base + 1, base, base + 3, base + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(indices);
  return g;
}

// Torna işi kısa ayak (alt ve üst yüzü yok).
function turnedFoot(x, z) {
  const profile = [[0.02, 0], [0.031, 0.018], [0.037, 0.045], [0.024, 0.068], [0.033, 0.084], [0.033, 0.1]];
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 8).translate(x, 0, z);
  const tone = new Float32Array(g.attributes.position.count * 3).fill(0.78);
  g.setAttribute('color', new THREE.BufferAttribute(tone, 3));
  return g;
}

const plain = (g) => {
  const out = g.index ? g.toNonIndexed() : g;
  out.deleteAttribute('uv');
  return out;
};

export function createClerkDesk() {
  const TOP_Y = 0.778; // tablanın üstü; meşin altlık 0,78'e tamamlar
  const PED_X = 0.56; // çekmeceli gövdelerin merkezi
  const PED_W = 0.42;
  const FRONT = 0.36; // gövdelerin ön yüzü

  const wood = [
    // Tabla: hafif çıkıntılı üst levha ve altındaki ince silme
    board(1.6, 0.04, 0.8, 0, TOP_Y - 0.02, 0, { shade: 1.05 }),
    board(1.56, 0.018, 0.76, 0, TOP_Y - 0.049, 0, { skip: 'py', shade: 0.9 }),
    // Diz boşluğunun üstündeki ön kuşak ve arkadaki perde tahtası
    board(0.7, 0.07, 0.02, 0, 0.685, 0.33, { skip: 'py px nx', shade: 0.95 }),
    board(0.7, 0.45, 0.018, 0, 0.495, -0.34, { skip: 'py px nx', shade: 0.9, grain: 'x' }),
  ];
  const brass = [];

  for (const s of [-1, 1]) {
    const x = s * PED_X;
    wood.push(
      board(PED_W, 0.59, 0.72, x, 0.425, 0, { skip: 'py ny', shade: 0.92, grain: 'y' }), // gövde
      board(PED_W + 0.024, 0.03, 0.744, x, 0.115, 0, { skip: 'ny', shade: 0.8 }), // süpürgelik
    );
    for (const fx of [-1, 1]) for (const fz of [-1, 1]) wood.push(turnedFoot(x + fx * 0.165, fz * 0.315));

    // Üç çekmece: hafif dışarı taşan ön yüzler ve pirinç kulplar
    [0.24, 0.43, 0.62].forEach((y, i) => {
      wood.push(board(0.36, 0.17, 0.014, x, y, FRONT + 0.007, { skip: 'nz', shade: 1 + 0.06 * ((i + (s > 0 ? 1 : 0)) % 2) }));
      const z = FRONT + 0.014;
      brass.push(plain(board(0.075, 0.026, 0.004, x, y + 0.004, z + 0.002, { skip: 'nz' })));
      for (const e of [-1, 1]) brass.push(plain(board(0.009, 0.009, 0.01, x + e * 0.022, y + 0.004, z + 0.008, { skip: 'nz' })));
      // Sarkan yarım halka kulp
      const bail = new THREE.TorusGeometry(0.022, 0.0035, 5, 10, Math.PI).rotateZ(Math.PI).rotateX(-0.25).translate(x, y + 0.004, z + 0.012);
      brass.push(plain(bail));
    });
  }
  for (const g of brass) {
    g.deleteAttribute('color');
  }

  // Meşin yazı altlığı: tablanın ortasında, yalnız üst yüzü görünen ince levha
  const pad = new THREE.PlaneGeometry(0.9, 0.5).rotateX(-Math.PI / 2).translate(0, 0.78, 0.02);
  pad.deleteAttribute('uv');
  const padEdge = plain(board(0.9, 0.002, 0.5, 0, 0.779, 0.02, { skip: 'py ny' }));
  padEdge.deleteAttribute('color');

  const { map } = woodTextures('#3d2618', 0.55);
  const root = new THREE.Group();
  root.name = 'memur_masasi';

  const body = new THREE.Mesh(
    mergeGeometries(wood.map((g) => (g.index ? g.toNonIndexed() : g))),
    new THREE.MeshStandardMaterial({ name: 'ceviz', map, vertexColors: true, roughness: 0.72, metalness: 0 }),
  );
  body.name = 'govde';
  const leather = new THREE.Mesh(
    mergeGeometries([pad.toNonIndexed(), padEdge]),
    new THREE.MeshStandardMaterial({ name: 'mesin', color: 0x1c3024, roughness: 0.8, metalness: 0 }),
  );
  leather.name = 'yazi_altligi';
  const handles = new THREE.Mesh(
    mergeGeometries(brass),
    new THREE.MeshStandardMaterial({ name: 'pirinc', color: 0x8a6a2e, roughness: 0.55, metalness: 0.8 }),
  );
  handles.name = 'kulplar';
  root.add(body, leather, handles);
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  return root;
}
