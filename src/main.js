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
import { createSakal, createYasliSakal } from './sakal.js';
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
controls.maxDistance = 25;

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
  setView(['character', 'bandit', 'outfit', 'outfit2', 'asker', 'suvari', 'zabit'].includes(key) ? 'front' : 'iso');
}

function exportGLB() {
  const { object, file } = active;
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
