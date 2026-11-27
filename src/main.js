import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createCharacter } from './character.js';
import { createStall, createCobbleGround } from './stall.js';
import { createStreetLamp } from './lamp.js';
import { createClerkDesk } from './desk.js';
import { createThonetChair } from './chair.js';
import { createFilingCabinet } from './cabinet.js';
import { createBandit } from './bandit.js';
import { createOutfit } from './outfit.js';
import { createFes } from './fes.js';
import { createOutfit2 } from './outfit2.js';
import { createEfeTakke } from './baslik.js';
import { createSoldierOutfit } from './outfit3.js';
import { createCavalryOutfit } from './outfit4.js';
import { createOfficerOutfit } from './outfit5.js';
import { createHalk1 } from './halk1.js';
import { createHalk2 } from './halk2.js';
import { createHalk3 } from './halk3.js';
import { createHalk5 } from './halk5.js';
import { createTabanca } from './tabanca.js';
import { createBoyaciSandigi } from './boyaci_sandigi.js';
import { createCocukKiyafet } from './cocuk.js';
import { createAskiliTepsi } from './askili_tepsi.js';
import { createPasaUniforma } from './pasa.js';
import { createKule } from './kule.js';
import { createKoylu } from './koylu.js';
import { createKayik } from './kayik.js';
import { createGemi } from './gemi.js';
import { createSirmaliUniforma, createSirmaliCeket } from './sirmali.js';
import { createKalpak } from './kalpak.js';
import { createKaput } from './kaput.js';
import { createIhram } from './ihram.js';
import { createMezarTasi, createMezarTasiEski, createMezarTasiEski2 } from './mezar.js';
import { createArapCamii } from './arapcami.js';
import { createAyasofya } from './ayasofya.js';
import { createYildizSarayi } from './yildiz.js';
import { createKizKulesi } from './kizkulesi.js';
import { createSultanahmet } from './sultanahmet.js';
import * as kit_ahsap from './kit_ahsap.js';
import * as kit_kerpic from './kit_kerpic.js';
import * as kit_ahir from './kit_ahir.js';
import * as kit_sokak from './kit_sokak.js';
import * as sebil from './sebil.js';
import * as kit_meydan from './kit_meydan.js';
import * as kit_araba from './kit_araba.js';
import * as sehir_halki from './sehir_halki.js';
import * as kit_siper from './kit_siper.js';
import { createTufekMavzer, tufekRaporu } from './tufek_mavzer.js';
import { createKaya, KAYALAR } from './kaya.js';
import { createGovde, GOVDELER } from './agac_govde.js';
import { createHazireYapisi, HAZIRE_YAPILARI } from './hazire_yapilari.js';
import { createMimariKit, createMimariParca, MIMARI_PARCALAR } from './mimari_kit.js';
import { createSehirParca, createSehirOrnek, SEHIR_PARCALAR } from './sehir.js';
import { createBatikGemi, BATIK_GEMILER } from './batik_gemi.js';
const BATIK = Math.min(5, Math.max(1, +new URLSearchParams(location.search).get('batik') || 3));
const SEHIR = SEHIR_PARCALAR.includes(new URLSearchParams(location.search).get('sehir')) ? new URLSearchParams(location.search).get('sehir') : 'ev_01';
const GOVDE = GOVDELER.includes(new URLSearchParams(location.search).get('govde')) ? new URLSearchParams(location.search).get('govde') : 'govde_mese';
const KAYA = KAYALAR[new URLSearchParams(location.search).get('kaya')] ? new URLSearchParams(location.search).get('kaya') : 'kaya_buyuk_1';
import { createDuvarFeneri, createTavanFeneri } from './fener.js';
import { createGemi as createGemiGezilir, createKayik as createKayikGezilir } from './tekne.js';
import { createTunelGirisi } from './tunel.js';
import { createMadenTuneli } from './maden.js';
import { createMakamMezari } from './makam.js';
import { createRevolver } from './revolver.js';
import { createRevolverCelik } from './revolver_celik.js';
import { createSatranc } from './satranc.js';
import { createHokkalik } from './hokkalik.js';
import { createGazLambasi } from './gaz_lambasi.js';
import { createKoltukAcikKollu, createKoltukBerjer, createKoltukTakimlari } from './koltuk.js';
import { createSiperHatti, createSiperKiti, createSiperParca, SIPER_PARCALARI } from './siper.js';

// ?siper=<ad>: 'Siper parçası' modelinde gösterilecek parça
const SIPER = SIPER_PARCALARI.includes(new URLSearchParams(location.search).get('siper')) ? new URLSearchParams(location.search).get('siper') : SIPER_PARCALARI[0];
import { createEvKiti, createOrnekEvler, createEvParca, EV_PARCALARI } from './evkit.js';

// ?parca=<ad>: 'Ev parçası' modelinde gösterilecek kit parçası
const PARCA = EV_PARCALARI.includes(new URLSearchParams(location.search).get('parca')) ? new URLSearchParams(location.search).get('parca') : EV_PARCALARI[0];
import { createMezarSeti, createMezarTek, MEZAR_ADLARI } from './mezar_basliklar.js';

// ?tas=<1-25>: 'Mezar taşı (tek)' modelinde gösterilecek taş
const TAS = Math.min(24, Math.max(0, (Number(new URLSearchParams(location.search).get('tas')) || 1) - 1));
import { createSakal, createYasliSakal, createYasliKisaSakal, createUzunSacSakal } from './sakal.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf2f2f2);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
document.body.appendChild(renderer.domElement);

// Stüdyo ortam ışığı: malzemelerin (deri, metal) yansımaları için.
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.6;

const key = new THREE.DirectionalLight(0xfff4e6, 2.4);
key.position.set(3.5, 6, 4.5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = key.shadow.camera.bottom = -4;
key.shadow.camera.right = key.shadow.camera.top = 4;
key.shadow.bias = -0.0004;
key.shadow.normalBias = 0.01;
key.shadow.radius = 4;
scene.add(key);
const rim = new THREE.DirectionalLight(0xdfe8ff, 1.2);
rim.position.set(-3, 2, -3);
scene.add(rim);

const ground = new THREE.Mesh(new THREE.CircleGeometry(12, 64), new THREE.ShadowMaterial({ opacity: 0.25 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Sahnede gösterilebilen modeller. Her biri ilk seçildiğinde oluşturulur.
const RENK = new URLSearchParams(location.search).get('renk');
const models = {
  stall: {
    create: createStall,
    file: 'tezgah.glb',
    target: new THREE.Vector3(0, 1.25, 0),
    distance: 8.5,
    extras: () => [createCobbleGround()],
  },
  lamp: {
    create: createStreetLamp,
    file: 'sokak_lambasi.glb',
    target: new THREE.Vector3(0, 1.8, 0),
    distance: 7,
  },
  desk: {
    create: createClerkDesk,
    file: 'memur_masasi.glb',
    target: new THREE.Vector3(0, 0.4, 0),
    distance: 3.6,
  },
  chair: {
    create: createThonetChair,
    file: 'sandalye.glb',
    target: new THREE.Vector3(0, 0.45, 0),
    distance: 2.6,
  },
  cabinet: {
    create: createFilingCabinet,
    file: 'evrak_dolabi.glb',
    target: new THREE.Vector3(0, 1.15, 0),
    distance: 6.4,
  },
  bandit: {
    create: createBandit,
    file: 'eskiya_deneme.glb',
    target: new THREE.Vector3(0, 0.9, 0),
    distance: 4.6,
  },
  outfit: {
    create: createOutfit,
    file: 'eskiya_kiyafet.glb',
    target: new THREE.Vector3(0, 0.95, 0),
    distance: 4.8,
    extras: loadMannequin,
  },
  outfit2: {
    create: createOutfit2,
    file: 'eskiya2_kiyafet.glb',
    target: new THREE.Vector3(0, 0.95, 0),
    distance: 4.8,
    extras: loadMannequin,
  },
  uzunSacSakal: {
    create: createUzunSacSakal,
    file: 'uzun_sac_sakal.glb',
    target: new THREE.Vector3(0, 1.6, 0),
    distance: 1.6,
    extras: loadMannequin,
  },
  yasliKisaSakal: {
    create: createYasliKisaSakal,
    file: 'sakal_yasli_kisa.glb',
    target: new THREE.Vector3(0, 1.63, 0),
    distance: 1.2,
    extras: loadMannequin,
  },
  yasliSakal: {
    create: createYasliSakal,
    file: 'sakal_yasli.glb',
    target: new THREE.Vector3(0, 1.63, 0),
    distance: 1.2,
    extras: loadMannequin,
  },
  sakal: {
    create: createSakal,
    file: 'sakal.glb',
    target: new THREE.Vector3(0, 1.63, 0),
    distance: 1.2,
    extras: loadMannequin,
  },
  // Hazır bir GLB dosyasını göstermek için: ?manken=<dosya adresi> ile açıp bu modeli seçin
  dosya: {
    create: () => new THREE.Group(),
    file: 'bos.glb',
    target: new THREE.Vector3(0, 0.15, 0),
    distance: 1,
    extras: loadMannequin,
  },
  koylu1: {
    create: () => createKoylu(1),
    file: 'koylu_1.glb',
    target: new THREE.Vector3(0, 0.95, 0),
    distance: 4.8,
    extras: loadMannequin,
  },
  koylu2: {
    create: () => createKoylu(2),
    file: 'koylu_2.glb',
    target: new THREE.Vector3(0, 0.95, 0),
    distance: 4.8,
    extras: loadMannequin,
  },
  koylu3: {
    create: () => createKoylu(3),
    file: 'koylu_3.glb',
    target: new THREE.Vector3(0, 0.95, 0),
    distance: 4.8,
    extras: loadMannequin,
  },
  maden: {
    create: createMadenTuneli,
    file: 'maden_tuneli.glb',
    target: new THREE.Vector3(0, 1.6, 0),
    distance: 30,
  },
  tunel: {
    create: createTunelGirisi,
    file: 'tunel_girisi.glb',
    target: new THREE.Vector3(0, 4, 3),
    distance: 34,
  },
  kitAhsap: {
    create: kit_ahsap.createKit,
    file: 'kit_ahsap.glb',
    target: new THREE.Vector3(0, 1.5, 0),
    distance: 60,
  },
  ornekAhsap: {
    create: kit_ahsap.createOrnekler,
    file: 'kit_ahsap_ornekler.glb',
    target: new THREE.Vector3(0, 4, 0),
    distance: 50,
  },
  kitKerpic: {
    create: kit_kerpic.createKit,
    file: 'kit_kerpic.glb',
    target: new THREE.Vector3(0, 1.5, 0),
    distance: 60,
  },
  ornekKerpic: {
    create: kit_kerpic.createOrnekler,
    file: 'kit_kerpic_ornekler.glb',
    target: new THREE.Vector3(0, 4, 0),
    distance: 50,
  },
  kitAhir: {
    create: kit_ahir.createKit,
    file: 'kit_ahir.glb',
    target: new THREE.Vector3(0, 1.5, 0),
    distance: 60,
  },
  ornekAhir: {
    create: kit_ahir.createOrnekler,
    file: 'kit_ahir_ornekler.glb',
    target: new THREE.Vector3(0, 4, 0),
    distance: 50,
  },
  kitSokak: {
    create: kit_sokak.createKit,
    file: 'kit_sokak.glb',
    target: new THREE.Vector3(0, 1.5, 6),
    distance: 75,
  },
  ornekSokak: {
    create: kit_sokak.createOrnekler,
    file: 'kit_sokak_ornekler.glb',
    target: new THREE.Vector3(0, 2, 0),
    distance: 50,
  },
  gemiGezilir: {
    create: createGemiGezilir,
    file: 'gemi_gezilebilir.glb',
    target: new THREE.Vector3(0, 3, 0),
    distance: 40,
  },
  kayikGezilir: {
    create: createKayikGezilir,
    file: 'kayik_gezilebilir.glb',
    target: new THREE.Vector3(0, 0.4, 0),
    distance: 14,
  },
  duvarFeneri: {
    create: createDuvarFeneri,
    file: 'duvar_feneri.glb',
    target: new THREE.Vector3(0, 0.1, 0.2),
    distance: 1.6,
  },
  tavanFeneri: {
    create: createTavanFeneri,
    file: 'tavan_feneri.glb',
    target: new THREE.Vector3(0, -0.5, 0),
    distance: 2.0,
  },
  sebil: {
    create: sebil.createSebil,
    file: 'sebil.glb',
    target: new THREE.Vector3(0, 3.5, 0),
    distance: 26,
  },
  sebilOrnek: {
    create: sebil.createOrnek,
    file: 'ornek_sebil.glb',
    target: new THREE.Vector3(0, 3, 0),
    distance: 42,
  },
  kitMeydan: {
    create: kit_meydan.createKit,
    file: 'meydan_kiti.glb',
    target: new THREE.Vector3(0, 2, 0),
    distance: 110,
  },
  // Şehir halkı kıyafetleri: ?kiyafet=<ad> ile seçilir (adlar: sehir_halki.js KIYAFET_ADLARI)
  sehirHalki: {
    create: () => sehir_halki.createSehir(new URLSearchParams(location.search).get('kiyafet') || 'esnaf'),
    file: `${new URLSearchParams(location.search).get('kiyafet') || 'esnaf'}.glb`,
    target: new THREE.Vector3(0, 0.95, 0),
    distance: 4.8,
    extras: loadMannequin,
  },
  kitSiper2: {
    create: kit_siper.createKit,
    file: 'siper_kiti.glb',
    target: new THREE.Vector3(0, 0.5, 0),
    distance: 60,
  },
  ornekSiper2: {
    create: kit_siper.createOrnek,
    file: 'ornek_siper.glb',
    target: new THREE.Vector3(7, 0.8, 0),
    distance: 32,
  },
  tufekMavzer: {
    create: createTufekMavzer,
    file: 'tufek_mavzer.glb',
    target: new THREE.Vector3(0, -0.02, 0),
    distance: 1.9,
    report: tufekRaporu, // dışa aktarmadan önce konsola özet yazar
  },
  // Kayalar: ?kaya=<ad> ile seçilir (adlar: kaya.js KAYALAR)
  kaya: {
    create: () => createKaya(KAYA),
    file: `${KAYA}.glb`,
    target: new THREE.Vector3(0, KAYALAR[KAYA].h * 0.45, 0),
    distance: Math.max(KAYALAR[KAYA].w, KAYALAR[KAYA].h) * 2.2,
  },
  // Kütük ve gövdeler: ?govde=<ad> ile seçilir (adlar: agac_govde.js GOVDELER)
  govde: {
    create: () => createGovde(GOVDE),
    file: `${GOVDE}.glb`,
    target: new THREE.Vector3(0, 2, 0),
    distance: 14,
  },
  hazireTurbe: {
    create: () => createHazireYapisi('turbe'),
    file: 'turbe.glb',
    target: new THREE.Vector3(0, 4.5, 0),
    distance: 22,
  },
  hazireEv: {
    create: () => createHazireYapisi('ahsap_ev'),
    file: 'ahsap_ev.glb',
    target: new THREE.Vector3(0, 3.8, 0),
    distance: 24,
  },
  hazireKosk: {
    create: () => createHazireYapisi('giris_kosku'),
    file: 'giris_kosku.glb',
    target: new THREE.Vector3(0, 2.4, 0),
    distance: 16,
  },
  kitMimari: {
    create: createMimariKit,
    file: 'mimari_susleme_kiti.glb',
    target: new THREE.Vector3(0, 1.2, -4),
    distance: 30,
  },
  // Şehir paketi: ?sehir=<ad> ile seçilir (adlar: sehir.js SEHIR_PARCALAR)
  sehirParca: {
    create: () => createSehirParca(SEHIR),
    file: `${SEHIR}.glb`,
    target: new THREE.Vector3(0, 4, -3),
    distance: 30,
  },
  sehirOrnek: {
    create: createSehirOrnek,
    file: 'ornek_sokak.glb',
    target: new THREE.Vector3(24, 5, 0),
    distance: 70,
  },
  // Batık gemiler: ?batik=1…5 (küçükten büyüğe)
  batikGemi: {
    create: () => createBatikGemi(BATIK),
    file: `${BATIK_GEMILER[BATIK - 1].ad}.glb`,
    target: new THREE.Vector3(0, 5, 0),
    distance: 30 + BATIK * 22,
  },
  kitAraba: {
    create: kit_araba.createKit,
    file: 'at_arabasi_kiti.glb',
    target: new THREE.Vector3(0, 1, 1),
    distance: 40,
  },
  ornekMeydan: {
    create: kit_meydan.createOrnek,
    file: 'ornek_meydan.glb',
    target: new THREE.Vector3(0, 3, 2),
    distance: 75,
  },
  sultanahmet: {
    create: createSultanahmet,
    file: 'sultanahmet_camii.glb',
    target: new THREE.Vector3(0, 15, 26),
    distance: 250,
  },
  kizKulesi: {
    create: createKizKulesi,
    file: 'kiz_kulesi.glb',
    target: new THREE.Vector3(0, 9, 0),
    distance: 95,
  },
  yildiz: {
    create: createYildizSarayi,
    file: 'yildiz_sarayi.glb',
    target: new THREE.Vector3(0, 9, 0),
    distance: 110,
  },
  ayasofya: {
    create: createAyasofya,
    file: 'ayasofya.glb',
    target: new THREE.Vector3(0, 24, 8),
    distance: 240,
  },
  arapCamii: {
    create: createArapCamii,
    file: 'arap_camii.glb',
    target: new THREE.Vector3(0, 9, 0),
    distance: 95,
  },
  siperHatti: {
    create: createSiperHatti,
    file: 'siper_hatti.glb',
    target: new THREE.Vector3(0, -1, 0),
    distance: 30,
  },
  siperKiti: {
    create: createSiperKiti,
    file: 'siper_kiti.glb',
    target: new THREE.Vector3(0, -1, 0),
    distance: 20,
  },
  siperParca: {
    create: () => createSiperParca(SIPER),
    file: `${SIPER}.glb`,
    target: new THREE.Vector3(0, -1, 0),
    distance: 9,
  },
  evOrnek: {
    create: createOrnekEvler,
    file: 'ornek_evler.glb',
    target: new THREE.Vector3(0, 5, 0),
    distance: 48,
  },
  evKiti: {
    create: createEvKiti,
    file: 'ev_kiti.glb',
    target: new THREE.Vector3(0, 1.5, 2),
    distance: 55,
  },
  evParca: {
    create: () => createEvParca(PARCA),
    file: `${PARCA}.glb`,
    target: new THREE.Vector3(0, 1.5, 0),
    distance: 9,
  },
  koltukTakim: {
    create: createKoltukTakimlari,
    file: 'koltuk_takimlari.glb',
    target: new THREE.Vector3(0, 0.55, 0),
    distance: 9,
  },
  koltuk1: {
    create: createKoltukAcikKollu,
    file: 'koltuk_acik_kollu.glb',
    target: new THREE.Vector3(0, 0.55, 0),
    distance: 3.2,
  },
  koltuk2: {
    create: createKoltukBerjer,
    file: 'koltuk_berjer.glb',
    target: new THREE.Vector3(0, 0.55, 0),
    distance: 3.2,
  },
  gazLambasi: {
    create: createGazLambasi,
    file: 'gaz_lambasi.glb',
    target: new THREE.Vector3(0, 0.2, 0),
    distance: 1.3,
  },
  hokkalik: {
    create: createHokkalik,
    file: 'hokkalik.glb',
    target: new THREE.Vector3(0, 0.06, 0),
    distance: 0.8,
  },
  satranc: {
    create: createSatranc,
    file: 'satranc_takimi.glb',
    target: new THREE.Vector3(0, 0.04, 0),
    distance: 1.3,
  },
  revolverCelik: {
    create: createRevolverCelik,
    file: 'revolver_celik.glb',
    target: new THREE.Vector3(0, 0.09, 0),
    distance: 0.85,
  },
  revolver: {
    create: createRevolver,
    file: 'revolver.glb',
    target: new THREE.Vector3(0, 0.085, 0),
    distance: 0.9,
  },
  makam: {
    create: createMakamMezari,
    file: 'makam_mezari.glb',
    target: new THREE.Vector3(0, 0.6, 0),
    distance: 9,
  },
  mezarSeti: {
    create: createMezarSeti,
    file: 'mezar_taslari.glb',
    target: new THREE.Vector3(0, 0.7, 0),
    distance: 9,
  },
  mezarTek: {
    create: () => createMezarTek(TAS),
    file: `${MEZAR_ADLARI[TAS]}.glb`,
    target: new THREE.Vector3(0, 0.75, 0),
    distance: 2.6,
  },
  mezarEski2: {
    create: createMezarTasiEski2,
    file: 'mezar_tasi_eski_2.glb',
    target: new THREE.Vector3(0, 0.75, 0),
    distance: 2.6,
  },
  mezarEski: {
    create: createMezarTasiEski,
    file: 'mezar_tasi_eski.glb',
    target: new THREE.Vector3(0, 0.75, 0),
    distance: 2.6,
  },
  mezar: {
    create: createMezarTasi,
    file: 'mezar_tasi.glb',
    target: new THREE.Vector3(0, 0.75, 0),
    distance: 2.6,
  },
  ihram: {
    create: createIhram,
    file: 'ihram.glb',
    target: new THREE.Vector3(0, 0.95, 0),
    distance: 4.8,
    extras: loadMannequin,
  },
  kaput: {
    create: createKaput,
    file: 'kaput.glb',
    target: new THREE.Vector3(0, 0.95, 0),
    distance: 4.8,
    extras: loadMannequin,
  },
  kalpak: {
    create: createKalpak,
    file: 'kalpak.glb',
    target: new THREE.Vector3(0, 1.85, 0.023),
    distance: 0.9,
    extras: loadMannequin,
  },
  sirmaliCeket: {
    create: createSirmaliCeket,
    file: 'sirmali_ceket.glb',
    target: new THREE.Vector3(0, 0.95, 0),
    distance: 4.8,
    extras: loadMannequin,
  },
  sirmali: {
    create: createSirmaliUniforma,
    file: 'sirmali_uniforma.glb',
    target: new THREE.Vector3(0, 0.95, 0),
    distance: 4.8,
    extras: loadMannequin,
  },
  gemi: {
    create: createGemi,
    file: 'gemi.glb',
    target: new THREE.Vector3(0, 4.5, 0),
    distance: 30,
  },
  kayik: {
    create: createKayik,
    file: 'kayik.glb',
    target: new THREE.Vector3(0, 0.3, 0),
    distance: 9,
  },
  kule: {
    create: createKule,
    file: 'tas_kule.glb',
    target: new THREE.Vector3(0, 8.5, 0),
    distance: 36,
  },
  pasa: {
    create: createPasaUniforma,
    file: 'pasa_uniforma.glb',
    target: new THREE.Vector3(0, 0.95, 0),
    distance: 4.8,
    extras: loadMannequin,
  },
  tepsi: {
    create: createAskiliTepsi,
    file: 'askili_tepsi.glb',
    target: new THREE.Vector3(0, 0.2, 0),
    distance: 1.2,
  },
  cocuk: {
    create: createCocukKiyafet,
    file: 'cocuk_kiyafet.glb',
    target: new THREE.Vector3(0, 0.95, 0),
    distance: 4.8,
    extras: loadMannequin,
  },
  sandik: {
    create: createBoyaciSandigi,
    file: 'boyaci_sandigi.glb',
    target: new THREE.Vector3(0, 0.25, 0),
    distance: 1.5,
  },
  tabanca: {
    create: createTabanca,
    file: 'tabanca.glb',
    target: new THREE.Vector3(0, 0.09, 0),
    distance: 0.8,
  },
  halk5: {
    create: createHalk5,
    file: 'halk_05_kirmizi_cubbeli.glb',
    target: new THREE.Vector3(0, 0.95, 0),
    distance: 4.8,
    extras: loadMannequin,
  },
  halk3: {
    create: createHalk3,
    file: 'halk_03_cepkenli.glb',
    target: new THREE.Vector3(0, 0.95, 0),
    distance: 4.8,
    extras: loadMannequin,
  },
  halk2: {
    create: createHalk2,
    file: 'halk_02_kurklu.glb',
    target: new THREE.Vector3(0, 0.95, 0),
    distance: 4.8,
    extras: loadMannequin,
  },
  halk1: {
    // Renk çeşidi adres satırından seçilir: ?renk=siyah | kahve | bordo | yesil | krem
    create: () => createHalk1(RENK ?? undefined),
    file: RENK ? `halk_01_cubbeli_${RENK}.glb` : 'halk_01_cubbeli.glb',
    target: new THREE.Vector3(0, 0.95, 0),
    distance: 4.8,
    extras: loadMannequin,
  },
  zabit: {
    create: createOfficerOutfit,
    file: 'zabit_kiyafet.glb',
    target: new THREE.Vector3(0, 0.95, 0),
    distance: 4.8,
    extras: loadMannequin,
  },
  suvari: {
    create: createCavalryOutfit,
    file: 'suvari_kiyafet.glb',
    target: new THREE.Vector3(0, 0.95, 0),
    distance: 4.8,
    extras: loadMannequin,
  },
  asker: {
    create: createSoldierOutfit,
    file: 'asker_kiyafet.glb',
    target: new THREE.Vector3(0, 0.95, 0),
    distance: 4.8,
    extras: loadMannequin,
  },
  efeTakke: {
    create: createEfeTakke,
    file: 'efe_takke.glb',
    target: new THREE.Vector3(0, 1.72, 0),
    distance: 1.5,
    extras: loadMannequin,
  },
  fes: {
    create: createFes,
    file: 'fes.glb',
    target: new THREE.Vector3(0, 1.72, 0),
    distance: 1.5,
    extras: loadMannequin,
  },
  character: {
    create: createCharacter,
    file: 'karakter.glb',
    target: new THREE.Vector3(0, 0.92, 0),
    distance: 3.6,
  },
};
let active = null;

// Kıyafeti mankenin üstünde görmek için: sayfayı ?manken=<manken.glb adresi> ile açın.
// Manken yalnız sahnede gösterilir; dışa aktarılan dosyaya girmez.
function loadMannequin() {
  const url = new URLSearchParams(location.search).get('manken');
  const holder = new THREE.Group();
  holder.name = 'manken';
  if (url) new GLTFLoader().load(url, (gltf) => holder.add(gltf.scene));
  return [holder];
}

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 0.6;
controls.maxDistance = 80;

// Görünüş yönleri: ön, yan, arka ve referans görsellerdeki gibi üstten çapraz bakış.
const views = {
  front: [0, 0, 1],
  side: [-1, 0, 0],
  back: [0, 0, -1],
  iso: [-0.62, 0.55, 0.56],
};

function setView(name) {
  const [x, y, z] = views[name];
  controls.target.copy(active.target);
  // Büyük yapılarda kamera sınırları modelin ölçeğine uyar
  camera.near = Math.max(0.1, active.distance / 150);
  camera.far = Math.max(100, active.distance * 12);
  camera.updateProjectionMatrix();
  controls.maxDistance = Math.max(80, active.distance * 4);
  camera.position.set(x, y, z).normalize().multiplyScalar(active.distance).add(active.target);
  controls.update();
}

function showModel(key) {
  if (active) for (const o of active.objects) o.visible = false;
  active = models[key];
  if (!active.objects) {
    active.object = active.create();
    active.objects = [active.object, ...(active.extras?.() ?? [])];
    scene.add(...active.objects);
  }
  for (const o of active.objects) o.visible = true;
  document.querySelectorAll('[data-model]').forEach((b) => b.classList.toggle('active', b.dataset.model === key));
  setView(['character', 'bandit', 'outfit', 'outfit2', 'asker', 'suvari', 'zabit', 'halk1', 'halk2', 'halk3', 'halk5', 'cocuk', 'pasa', 'koylu1', 'koylu2', 'koylu3', 'sirmali', 'sirmaliCeket', 'kaput', 'ihram'].includes(key) ? 'front' : 'iso');
}

function exportGLB() {
  const { object, file } = active;
  active.report?.(object);
  new GLTFExporter().parse(
    object,
    (buffer) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([buffer], { type: 'model/gltf-binary' }));
      link.download = file;
      link.click();
      URL.revokeObjectURL(link.href);
    },
    (error) => alert('Dışa aktarma başarısız: ' + error.message),
    { binary: true },
  );
}

document.querySelectorAll('[data-model]').forEach((b) => b.addEventListener('click', () => showModel(b.dataset.model)));
document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
const rotateBtn = document.getElementById('rotate');
rotateBtn.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  rotateBtn.classList.toggle('active', controls.autoRotate);
});
document.getElementById('export').addEventListener('click', exportGLB);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

showModel('stall');

