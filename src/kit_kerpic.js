import * as K from './kit_ortak.js';
const { V, ALL, OUT, SIDES, PAINT, box, lath, quad, beam, cyl, window, door } = K;

// Osmanlı kerpiç köy evi kiti (19. yy sonu): taş kaideli kerpiç zemin kat, çamur sıvalı üst kat,
// düz toprak dam ya da alaturka kiremitli alçak çatı. Duvar dokuları duvarın tümünü (3 × 3 m) kaplar:
// her metrede hatıl, dipte ıslak koyuluk, yer yer dökülmüş sıva.
const M = K.materials('kerpic', {
  kerpic_kaideli: [PAINT.kerpic, 256, 256, 0.8], kerpic_siva: [PAINT.kerpic], kerpic_tugla: [PAINT.kerpic, 256, 256, 0, true],
  moloz_tas: [PAINT.tas], hatil: [PAINT.kereste], kereste: [PAINT.kereste], kepenk: [PAINT.tahta, 256, 256, [96, 78, 58]],
  toprak_dam: [PAINT.toprak], toprak_doseme: [PAINT.toprak, 256, 256, '#6e5a40'],
  cali: [PAINT.lif, 256, 256, '#3a2e1e', ['#8a7446', '#5e4c2c', '#a08a58'], 900, 40, false],
  alaturka_kiremit: [PAINT.kiremit], pencere_cam: [PAINT.cam, 128, 192], ahsap_kapi: [PAINT.kapi, 128, 192], cift_kapi: [PAINT.cift_kapi, 128, 192], karanlik: 0x14110e,
});
const wall = (p, mat, hw = 1.5) => {
  box(p, mat, -hw, hw, 0, 3, -0.25, 0, ALL, 3);
  lath(p, -hw, hw, 1.98, 2.08, 0.02, 'hatil'); // dışarı taşan hatıl
};
const dam = (p, x1, z1) => { // toprak dam levhası; x1/z1: saçaklı kenarlar
  box(p, 'toprak_dam', -1.5, x1, 0.17, 0.35, -1.5, z1, ['+y', ...(z1 > 1.5 ? ['+z'] : []), ...(x1 > 1.5 ? ['+x'] : [])], 1.5);
  if (z1 > 1.5) {
    box(p, 'cali', -1.5, x1, 0.12, 0.17, 1.5, z1, ['+z', '-y', ...(x1 > 1.5 ? ['+x'] : [])], 1);
    for (const x of x1 > 1.5 ? [-0.75, 0.75] : [-1, 0, 1]) box(p, 'kereste', x - 0.07, x + 0.07, 0, 0.12, 1.5, 1.85, ['+z', '+x', '-x', '-y'], 1);
  }
  if (x1 > 1.5) {
    box(p, 'cali', 1.5, x1, 0.12, 0.17, -1.5, 1.5, ['+x', '-y'], 1);
    box(p, 'kereste', 1.5, 1.85, 0, 0.12, -0.07, 0.07, ['+x', '+z', '-z', '-y'], 1);
  }
};
const small = (p, x, o) => window(p, x, 1.45, 0.5, 0.65, o);
const PARTS = {
  kerpic_duvar: (p) => wall(p, 'kerpic_kaideli'),
  kerpic_duvar_pencere: (p) => { wall(p, 'kerpic_kaideli'); small(p, 0, { bars: true }); },
  kerpic_duvar_kapi: (p) => { wall(p, 'kerpic_kaideli'); door(p, 0, 0.95, 1.75, 'ahsap_kapi', { lento: true }); },
  kerpic_duvar_ahir: (p) => { wall(p, 'kerpic_kaideli'); door(p, 0, 2.0, 2.2, 'cift_kapi', { lento: true }); },
  kerpic_duvar_dar: (p) => wall(p, 'kerpic_kaideli', 0.3),
  siva_duvar: (p) => wall(p, 'kerpic_siva'),
  siva_duvar_pencere: (p) => { wall(p, 'kerpic_siva'); small(p, 0, { shutters: 'acik' }); },
  siva_duvar_2pencere: (p) => { wall(p, 'kerpic_siva'); for (const x of [-0.75, 0.75]) small(p, x, {}); },
  siva_duvar_dokuk: (p) => wall(p, 'kerpic_tugla'),
  siva_duvar_dar: (p) => wall(p, 'kerpic_siva', 0.3),
  kerpic_kose: (p) => { // dış köşesi pahlı (yuvarlatılmış) kalın köşe
    const poly = [[-0.42, -0.42], [0.06, -0.42], [0.06, -0.04], [0.03, 0.03], [-0.04, 0.06], [-0.42, 0.06]];
    let run = 0;
    poly.forEach(([x, z], i) => {
      const [x1, z1] = poly[(i + 1) % poly.length], len = Math.hypot(x1 - x, z1 - z);
      p.quad('kerpic_kaideli', [V(x, 0, z), V(x1, 0, z1), V(x1, 3, z1), V(x, 3, z)], [[run / 3, 0], [(run + len) / 3, 0], [(run + len) / 3, 1], [run / 3, 1]], V(z1 - z, 0, x - x1).multiplyScalar(-1).add(V((x + x1) / 2 + 0.18, 0, (z + z1) / 2 + 0.18)));
      run += len;
    });
    for (let i = 1; i + 1 < poly.length; i++) K.tri(p, 'kerpic_siva', [V(...[poly[0][0], 3, poly[0][1]]), V(poly[i][0], 3, poly[i][1]), V(poly[i + 1][0], 3, poly[i + 1][1])], V(0, 1, 0), 3);
  },
  kose_diregi: (p) => K.corner(p, 'kerpic_siva', -0.16, 0.05, 3, 3),
  kat_kusagi: K.katKusagi,
  cikma_tabani: K.cikmaTabani,
  doseme: (p) => K.doseme(p, 'toprak_doseme'),
  sundurma: (p) => {
    for (const x of [-1.4, 1.4]) cyl(p, 'kereste', V(x, 0, 2.25), V(x, 2.7, 2.25), 0.08, 6, false);
    box(p, 'kereste', -1.5, 1.5, 2.7, 2.82, 2.17, 2.33, ['+z', '-z', '-y'], 1);
    box(p, 'cali', -1.5, 1.5, 2.82, 2.88, 0, 2.4, ['+z', '+x', '-x', '-y'], 1);
    box(p, 'toprak_dam', -1.5, 1.5, 2.88, 3, 0, 2.4, ['+z', '+x', '-x', '+y'], 1.5);
  },
  tas_merdiven: (p) => K.merdiven(p, 'moloz_tas'),
  dis_merdiven: (p) => { // sağdan (+X) sola yükselir; üstte sahanlık
    for (let k = 0; k < 9; k++) box(p, 'moloz_tas', 1.5 - 0.3 * (k + 1), 1.5 - 0.3 * k, 0, 0.3 * (k + 1), 0, 1, ['+x', '+z', '+y'], 1.5);
    box(p, 'moloz_tas', -1.5, -1.2, 0, 3, 0, 1, ['+x', '-x', '+z', '+y'], 1.5);
  },
  baca: (p) => K.baca(p, 'kerpic_siva', 'moloz_tas'),
  avlu_duvari: (p) => {
    box(p, 'kerpic_siva', -1.5, 1.5, 0, 1.42, -0.32, -0.03, ALL, 3);
    box(p, 'cali', -1.5, 1.5, 1.42, 1.6, -0.35, 0, ALL, 1); // çalı-çamur harpuşta
  },
  avlu_kapisi: (p) => {
    for (const s of [-1, 1]) {
      box(p, 'kerpic_siva', s < 0 ? -1.5 : 0.95, s < 0 ? -0.95 : 1.5, 0, 1.42, -0.32, -0.03, ALL, 3);
      box(p, 'cali', s < 0 ? -1.5 : 0.95, s < 0 ? -0.95 : 1.5, 1.42, 1.6, -0.35, 0, ALL, 1);
      box(p, 'kereste', s * 0.87 - 0.08, s * 0.87 + 0.08, 0, 2.05, -0.26, -0.1, SIDES, 1);
    }
    for (const [z, n] of [[-0.14, 1], [-0.2, -1]]) p.quad('cift_kapi', [V(-0.79, 0, z), V(0.79, 0, z), V(0.79, 1.9, z), V(-0.79, 1.9, z)], K.FLAT, V(0, 0, n));
    box(p, 'kereste', -1.05, 1.05, 2.05, 2.15, -0.3, -0.06, ALL, 1);
    K.quad(p, 'alaturka_kiremit', [V(-1.15, 2.15, 0.15), V(1.15, 2.15, 0.15), V(1.15, 2.4, -0.18), V(-1.15, 2.4, -0.18)], V(0, 1, 0.6));
    K.quad(p, 'alaturka_kiremit', [V(-1.15, 2.15, -0.51), V(1.15, 2.15, -0.51), V(1.15, 2.4, -0.18), V(-1.15, 2.4, -0.18)], V(0, 1, -0.6));
  },
  dam_kenar: (p) => dam(p, 1.5, 1.9),
  dam_kose: (p) => dam(p, 1.9, 1.9),
  dam_orta: (p) => box(p, 'toprak_dam', -1.5, 1.5, 0.17, 0.35, -1.5, 1.5, ALL, 1.5),
  dam_loglu: (p) => {
    box(p, 'toprak_dam', -1.5, 1.5, 0.17, 0.35, -1.5, 1.5, ALL, 1.5);
    cyl(p, 'moloz_tas', V(-0.45, 0.57, 0.3), V(0.45, 0.57, 0.3), 0.22, 7); // loğ taşı
  },
  cati_kenar: (p) => K.catiKenar(p, 'alaturka_kiremit'),
  cati_kose: (p) => K.catiKose(p, 'alaturka_kiremit'),
  cati_tepe: (p) => K.catiTepe(p, 'alaturka_kiremit'),
  cati_besik: (p) => K.catiBesik(p, 'alaturka_kiremit'),
  cati_besik_uc: (p) => K.catiBesik(p, 'alaturka_kiremit', 0.6, true, 'kerpic_siva'),
};
const kit = K.makeKit('kerpic_ev_kiti', PARTS, M);
export const PARCALAR = kit.names, createParca = kit.create, createKit = kit.createKit;
export function createOrnekler() {
  const damRoof = { type: 'dam', kenar: 'dam_kenar', kose: 'dam_kose', orta: 'dam_orta' }, common = { band: 'kat_kusagi', jettyBase: 'cikma_tabani', floor: 'doseme' };
  const kulube = K.assemble('ornek_kerpic_kulube', createParca, {
    ...common, nx: 2, nz: 2, roof: damRoof,
    floors: [{ corner: 'kerpic_kose', wall: (s, k) => (s === 0 ? (k ? 'kerpic_duvar_pencere' : 'kerpic_duvar_kapi') : s === 1 && k === 0 ? 'kerpic_duvar_pencere' : 'kerpic_duvar') }],
    extras: [['dam_loglu', 1.5, 3.001, 1.5, Math.PI], ['baca', -1.6, 3.3, -1.6], ['tas_merdiven', -1.5, 0, 3]],
  });
  const ev = K.assemble('ornek_kerpic_ev', createParca, {
    ...common, nx: 3, nz: 2, roof: damRoof,
    floors: [
      { corner: 'kerpic_kose', wall: (s, k) => (s === 0 ? ['kerpic_duvar_ahir', 'kerpic_duvar', 'kerpic_duvar_pencere'][k] : s === 2 ? 'kerpic_duvar' : k ? 'kerpic_duvar' : 'kerpic_duvar_pencere') },
      { corner: 'kose_diregi', wall: (s, k) => (s === 0 ? ['siva_duvar_pencere', 'siva_duvar_2pencere', 'siva_duvar_dokuk'][k] : s === 1 ? (k ? 'siva_duvar_pencere' : 'kerpic_duvar_kapi') : s === 2 ? (k === 1 ? 'siva_duvar_dokuk' : 'siva_duvar') : 'siva_duvar_pencere') },
    ],
    extras: [['dis_merdiven', 4.5, 0, 0, Math.PI / 2], ['baca', -3, 6.3, -1.8]],
  });
  const kasaba = K.assemble('ornek_kasaba_evi', createParca, {
    ...common, nx: 2, nz: 2, roof: { type: 'kirma', kenar: 'cati_kenar', kose: 'cati_kose', orta: 'cati_tepe' },
    floors: [
      { corner: 'kerpic_kose', wall: (s, k) => (s === 0 ? (k ? 'kerpic_duvar_pencere' : 'kerpic_duvar_kapi') : s === 2 ? 'kerpic_duvar' : k ? 'kerpic_duvar' : 'kerpic_duvar_pencere') },
      { corner: 'kose_diregi', jetty: true, narrow: 'siva_duvar_dar', wall: (s, k) => (s === 0 ? (k ? 'siva_duvar_pencere' : 'siva_duvar_2pencere') : s === 2 ? 'siva_duvar' : 'siva_duvar_pencere') },
    ],
    extras: [['avlu_duvari', -4.5, 0, 7], ['avlu_kapisi', -1.5, 0, 7], ['avlu_duvari', 1.5, 0, 7], ['avlu_duvari', 4.5, 0, 7], ['avlu_duvari', 6, 0, 5.5, Math.PI / 2], ['avlu_duvari', -6, 0, 5.5, -Math.PI / 2], ['baca', 1.5, 6.7, -1.2]],
  });
  return K.row('ornek_evler', [[kulube, 8], [ev, 12], [kasaba, 13]]);
}
