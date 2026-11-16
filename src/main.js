import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createCharacter } from './character.js';

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
key.position.set(2.5, 4, 3);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = key.shadow.camera.bottom = -1.5;
key.shadow.camera.right = key.shadow.camera.top = 2;
key.shadow.bias = -0.0004;
key.shadow.normalBias = 0.01;
key.shadow.radius = 4;
scene.add(key);
const rim = new THREE.DirectionalLight(0xdfe8ff, 1.2);
rim.position.set(-3, 2, -3);
scene.add(rim);

const ground = new THREE.Mesh(new THREE.CircleGeometry(4, 64), new THREE.ShadowMaterial({ opacity: 0.25 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const character = createCharacter();
scene.add(character);

const TARGET = new THREE.Vector3(0, 0.92, 0);
const DISTANCE = 3.6;
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.copy(TARGET);
controls.minDistance = 0.6;
controls.maxDistance = 10;

// Referans görseldeki üç görünüş: ön, yan (sağa bakan profil) ve arka.
const views = {
  front: [0, 0, 1],
  side: [-1, 0, 0],
  back: [0, 0, -1],
};

function setView(name) {
  const [x, y, z] = views[name];
  controls.target.copy(TARGET);
  camera.position.set(x, y, z).multiplyScalar(DISTANCE).add(TARGET);
  controls.update();
}

function exportGLB() {
  new GLTFExporter().parse(
    character,
    (buffer) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([buffer], { type: 'model/gltf-binary' }));
      link.download = 'karakter.glb';
      link.click();
      URL.revokeObjectURL(link.href);
    },
    (error) => alert('Dışa aktarma başarısız: ' + error.message),
    { binary: true },
  );
}

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

setView('front');
