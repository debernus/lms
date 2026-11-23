import * as K from './kit_ortak.js';
const { V, ALL, OUT, PAINT, box, slab, lath, quad, tri, beam, window, door } = K;

// Osmanlı ahşap köy evi kiti (19. yy sonu): yığma kütük zemin kat, tahta kaplama üst kat, hartama çatı.
const M = K.materials('ahsap', {
  yigma_kutuk: [PAINT.kutuk], tahta_kaplama: [PAINT.tahta], kepenk: [PAINT.tahta, 256, 256, [86, 70, 54]], kereste: [PAINT.kereste],
  hartama: [PAINT.hartama], doseme_tahtasi: [PAINT.tahta_yatay], moloz_tas: [PAINT.tas], kafes: [PAINT.kafes],
  pencere_cam: [PAINT.cam, 128, 192], ahsap_kapi: [PAINT.kapi, 128, 192], ahir_kapisi: [PAINT.cift_kapi, 128, 192], karanlik: 0x14110e,
});
const kutuk = (p, hw = 1.5) => {
  slab(p, 'yigma_kutuk', hw);
  if (hw > 1) for (const x of [-0.75, 0.75]) lath(p, x - 0.05, x + 0.05, 0.05, 2.95, 0.03); // kütükleri tutan dikey kuşaklar
  else lath(p, -0.05, 0.05, 0.05, 2.95, 0.03);
};
const tahta = (p, hw = 1.5) => {
  slab(p, 'tahta_kaplama', hw);
  lath(p, -hw, hw, 0, 0.12, 0.04);
  lath(p, -hw, hw, 2.86, 3, 0.05);
};
function cumba(p) {
  const d = 0.78;
  box(p, 'tahta_kaplama', -1.5, 1.5, 0, 3, 0, d, OUT, 1.5);
  box(p, 'kereste', -1.55, 1.55, -0.16, 0.08, 0, 0.83, ['+x', '-x', '+z', '-y'], 1);
  box(p, 'kereste', -1.55, 1.55, 2.86, 3, 0, 0.83, ['+x', '-x', '+z'], 1);
  for (const x of [-1.25, 0, 1.25]) beam(p, 'kereste', V(x, -1.0, 0.05), V(x, -0.2, d - 0.1), 0.11, 0.1, false);
  for (const x of [-0.9, 0, 0.9]) {
    p.quad('pencere_cam', [V(x - 0.32, 0.85, d + 0.012), V(x + 0.32, 0.85, d + 0.012), V(x + 0.32, 2.4, d + 0.012), V(x - 0.32, 2.4, d + 0.012)], K.FLAT, V(0, 0, 1));
    for (const [a, b, c, e] of [[x - 0.38, x - 0.32, 0.85, 2.46], [x + 0.32, x + 0.38, 0.85, 2.46], [x - 0.38, x + 0.38, 2.4, 2.46], [x - 0.4, x + 0.4, 0.79, 0.85]]) box(p, 'kereste', a, b, c, e, d, d + 0.045, ['+x', '-x', '+z', '+y', '-y'], 1);
  }
  for (const s of [-1, 1]) p.quad('pencere_cam', [V(s * 1.512, 0.85, 0.14), V(s * 1.512, 0.85, d - 0.14), V(s * 1.512, 2.4, d - 0.14), V(s * 1.512, 2.4, 0.14)], K.FLAT, V(s, 0, 0));
}
function sundurma(p) {
  for (const x of [-1.4, 1.4]) box(p, 'kereste', x - 0.07, x + 0.07, 0, 2.85, 2.2, 2.34, K.SIDES, 1);
  box(p, 'doseme_tahtasi', -1.5, 1.5, 2.88, 3, 0, 2.4, ALL, 1.5);
  box(p, 'kereste', -1.5, 1.5, 2.74, 2.88, 2.2, 2.34, ['+z', '-z', '-y'], 1);
  for (const y of [0.16, 0.8]) box(p, 'kereste', -1.33, 1.33, y, y + 0.07, 2.24, 2.3, ['+z', '-z', '+y', '-y'], 1);
  for (let k = 0; k < 6; k++) box(p, 'kereste', -1.1 + k * 0.44 - 0.025, -1.1 + k * 0.44 + 0.025, 0.23, 0.8, 2.25, 2.29, ['+x', '-x', '+z', '-z'], 1);
}
function kose(p) {
  box(p, 'yigma_kutuk', -0.42, 0, 0, 3, -0.42, 0, ['+x', '-x', '+z', '-z', '+y'], 1.5);
  for (let k = 0; k < 10; k++) { // sırayla iki yöne taşan kütük uçları
    const y = k * 0.3 + 0.04;
    if (k % 2) box(p, 'kereste', 0, 0.06, y, y + 0.22, -0.3, -0.04, ['+x', '+z', '-z', '+y', '-y'], 1);
    else box(p, 'kereste', -0.3, -0.04, y, y + 0.22, 0, 0.06, ['+z', '+x', '-x', '+y', '-y'], 1);
  }
}
const PARTS = {
  kutuk_duvar: (p) => kutuk(p),
  kutuk_duvar_pencere: (p) => { kutuk(p); window(p, 0, 1.3, 0.7, 0.8, { shutters: 'acik' }); },
  kutuk_duvar_kapi: (p) => { kutuk(p); door(p, 0, 0.95, 1.75, 'ahsap_kapi', { lento: true }); },
  kutuk_duvar_ahir: (p) => { kutuk(p); door(p, 0, 2.0, 2.3, 'ahir_kapisi', { lento: true }); },
  kutuk_duvar_dar: (p) => kutuk(p, 0.3),
  tahta_duvar: (p) => tahta(p),
  tahta_duvar_pencere: (p) => { tahta(p); window(p, 0, 0.9, 0.8, 1.5, { head: true }); },
  tahta_duvar_2pencere: (p) => { tahta(p); for (const x of [-0.72, 0.72]) window(p, x, 0.9, 0.7, 1.5, { head: true }); },
  tahta_duvar_kepenkli: (p) => { tahta(p); window(p, 0, 0.9, 0.8, 1.5, { head: true, shutters: 'yarim' }); },
  tahta_duvar_kafesli: (p) => { tahta(p); window(p, 0, 0.9, 1.0, 1.5, { head: true, glass: 'kafes', rep: true }); },
  tahta_duvar_dar: (p) => tahta(p, 0.3),
  kutuk_kose: kose,
  kose_diregi: (p) => K.corner(p, 'kereste', -0.16, 0.05, 3, 1),
  kat_kusagi: K.katKusagi,
  cikma_tabani: K.cikmaTabani,
  cumba_ahsap: cumba,
  doseme: (p) => K.doseme(p, 'doseme_tahtasi'),
  sundurma,
  ahsap_merdiven: (p) => K.merdiven(p, 'doseme_tahtasi'),
  baca: (p) => K.baca(p, 'moloz_tas', 'moloz_tas'),
  cati_kenar: (p) => K.catiKenar(p, 'hartama'),
  cati_kose: (p) => K.catiKose(p, 'hartama'),
  cati_tepe: (p) => K.catiTepe(p, 'hartama'),
  cati_besik: (p) => K.catiBesik(p, 'hartama'),
  cati_besik_uc: (p) => K.catiBesik(p, 'hartama', 0.6, true, 'tahta_kaplama'),
  cumba_catisi: (p) => {
    quad(p, 'hartama', [V(-1.62, 0.08, 1), V(1.62, 0.08, 1), V(1.5, 0.6, 0), V(-1.5, 0.6, 0)], V(0, 1, 0.5));
    for (const s of [-1, 1]) tri(p, 'hartama', [V(s * 1.62, 0.08, 1), V(s * 1.62, 0.08, 0), V(s * 1.5, 0.6, 0)], V(s, 0.4, 0));
    box(p, 'kereste', -1.62, 1.62, 0, 0.08, 0, 1, ['+x', '-x', '+z', '-y'], 1);
  },
};
const kit = K.makeKit('ahsap_ev_kiti', PARTS, M);
export const PARCALAR = kit.names, createParca = kit.create, createKit = kit.createKit;
export function createOrnekler() {
  const roof = { type: 'kirma', kenar: 'cati_kenar', kose: 'cati_kose', orta: 'cati_tepe' }, common = { band: 'kat_kusagi', jettyBase: 'cikma_tabani', floor: 'doseme' };
  const koy = K.assemble('ornek_koy_evi', createParca, {
    ...common, nx: 2, nz: 2, roof,
    floors: [
      { corner: 'kutuk_kose', wall: (s, k) => (s === 0 ? (k ? 'kutuk_duvar_pencere' : 'kutuk_duvar_kapi') : s === 2 ? 'kutuk_duvar' : k ? 'kutuk_duvar' : 'kutuk_duvar_pencere') },
      { corner: 'kose_diregi', jetty: true, narrow: 'tahta_duvar_dar', wall: (s, k) => (s === 0 ? (k ? 'tahta_duvar_2pencere' : 'tahta_duvar_kepenkli') : s === 2 ? 'tahta_duvar' : 'tahta_duvar_pencere') },
    ],
    extras: [['baca', -1.5, 6.7, -1.2], ['ahsap_merdiven', -1.5, 0, 3]],
  });
  const yayla = K.assemble('ornek_yayla_evi', createParca, {
    ...common, nx: 3, nz: 1, roof: { type: 'besik', orta: 'cati_besik', uc: 'cati_besik_uc' },
    floors: [{ corner: 'kutuk_kose', wall: (s, k) => (s === 0 ? ['kutuk_duvar_pencere', 'kutuk_duvar_kapi', 'kutuk_duvar_ahir'][k] : s === 2 ? (k === 1 ? 'kutuk_duvar_pencere' : 'kutuk_duvar') : 'kutuk_duvar') }],
    extras: [['sundurma', -3, 0, 1.5], ['sundurma', 0, 0, 1.5], ['baca', -3, 3.2, -0.4]],
  });
  const konak = K.assemble('ornek_ahsap_konak', createParca, {
    ...common, nx: 3, nz: 2, roof,
    floors: [
      { corner: 'kutuk_kose', wall: (s, k) => (s === 0 ? (k === 1 ? 'kutuk_duvar_kapi' : 'kutuk_duvar_pencere') : s === 2 ? (k === 1 ? 'kutuk_duvar_ahir' : 'kutuk_duvar') : k ? 'kutuk_duvar' : 'kutuk_duvar_pencere') },
      { corner: 'kose_diregi', wall: (s, k) => (s === 0 ? (k === 1 ? 'cumba_ahsap' : 'tahta_duvar_2pencere') : s === 2 ? 'tahta_duvar' : k ? 'tahta_duvar_kepenkli' : 'tahta_duvar_pencere') },
      { corner: 'kose_diregi', wall: (s, k) => (s === 0 ? (k === 1 ? 'tahta_duvar_2pencere' : 'tahta_duvar_kafesli') : s === 2 ? (k === 1 ? 'tahta_duvar_pencere' : 'tahta_duvar') : 'tahta_duvar_pencere') },
    ],
    extras: [['cumba_catisi', 0, 6, 3], ['baca', 3, 9.7, -1.2], ['ahsap_merdiven', 0, 0, 3]],
  });
  return K.row('ornek_evler', [[koy, 9], [yayla, 12], [konak, 12]]);
}
