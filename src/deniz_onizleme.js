import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Deniz dalgası önizlemesi: godot/deniz/deniz.gdshader ile aynı Gerstner formülü. Sürgülerle ayarlanan değerler
// sayfada Godot'a yazılacak biçimde gösterilir. Kutu, deniz.gd'deki yükseklik hesabının aynısıyla yüzer.
const P = { yukseklik: 1, boy: 1, hiz: 1, yon: 15, dagilim: 1, kopuk: 0.3 };
const TEMEL = [[0, 0.2, 34], [40, 0.16, 19], [95, 0.12, 9.5], [-45, 0.08, 4.5]]; // [yön farkı (derece), diklik, dalga boyu]
const dalgalar = () => TEMEL.map(([a, q, l]) => { const r = ((P.yon + a * P.dagilim) * Math.PI) / 180; return new THREE.Vector4(Math.cos(r), Math.sin(r), q, l * P.boy); });

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.append(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9db7c9);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 2000);
camera.position.set(-38, 14, 46);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.maxPolarAngle = Math.PI * 0.49;

const GERSTNER = `
uniform vec4 dalga[4]; uniform float carpan; uniform float t;
void gerstner(vec4 d, vec2 xz, inout vec3 p, inout vec3 teget, inout vec3 ikincil) {
  vec2 yon = normalize(d.xy); float k = 6.2831853 / d.w; float c = sqrt(9.8 / k); float f = k * (dot(yon, xz) - c * t); float q = d.z * carpan; float a = q / k;
  p.x += yon.x * a * cos(f); p.y += a * sin(f); p.z += yon.y * a * cos(f);
  teget += vec3(-yon.x * yon.x * q * sin(f), yon.x * q * cos(f), -yon.x * yon.y * q * sin(f));
  ikincil += vec3(-yon.x * yon.y * q * sin(f), yon.y * q * cos(f), -yon.y * yon.y * q * sin(f));
}`;
const su = new THREE.ShaderMaterial({
  uniforms: { dalga: { value: dalgalar() }, carpan: { value: 1 }, t: { value: 0 }, kopuk: { value: 0.3 }, gunes: { value: new THREE.Vector3(0.4, 0.6, 0.3).normalize() } },
  vertexShader: `${GERSTNER}
    varying vec3 vN; varying vec3 vP; varying float vTepe;
    void main() { vec3 p = position; vec3 tg = vec3(1.0, 0.0, 0.0); vec3 bn = vec3(0.0, 0.0, 1.0);
      for (int i = 0; i < 4; i++) gerstner(dalga[i], position.xz, p, tg, bn);
      vTepe = p.y; vN = normalize(cross(bn, tg)); vP = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
  fragmentShader: `
    uniform vec3 gunes; uniform float kopuk; uniform float carpan; uniform float t; varying vec3 vN; varying vec3 vP; varying float vTepe;
    float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
    void main() {
      vec2 q = vP.xz * 0.9; vec3 N = normalize(vN + 0.07 * vec3(n(q + t * 0.5) - 0.5, 0.0, n(q * 1.3 - t * 0.4) - 0.5));
      vec3 V = normalize(cameraPosition - vP); float fres = pow(1.0 - max(dot(N, V), 0.0), 4.0);
      vec3 derin = vec3(0.015, 0.09, 0.16), sig = vec3(0.10, 0.42, 0.44), gok = vec3(0.62, 0.72, 0.79);
      vec3 c = mix(derin, sig, smoothstep(-0.6, 1.2, vTepe / max(0.05, carpan)) * 0.6);
      c = mix(c, gok, fres * 0.85) + vec3(1.0, 0.95, 0.85) * pow(max(dot(reflect(-gunes, N), V), 0.0), 180.0) * 1.5 + 0.08 * max(dot(N, gunes), 0.0);
      float g = n(vP.xz * 0.6 + t * 0.2) * 0.6 + n(vP.xz * 2.1 - t * 0.3) * 0.4;
      float ust = smoothstep(1.0 - kopuk, 1.25 - kopuk, vTepe / max(0.05, carpan) * 0.55 + g * 0.45) * kopuk;
      gl_FragColor = vec4(mix(c, vec3(0.92, 0.95, 0.96), clamp(ust, 0.0, 1.0)), 1.0);
    }`,
});
const duzlem = new THREE.PlaneGeometry(400, 400, 320, 320);
duzlem.rotateX(-Math.PI / 2);
scene.add(new THREE.Mesh(duzlem, su));

// Yüzen kutu: deniz.gd'deki yukseklik() ve normal() ile aynı hesap
const kutu = new THREE.Mesh(new THREE.BoxGeometry(6, 1.6, 2.6), new THREE.MeshBasicMaterial({ color: 0x6a4a2c }));
scene.add(kutu);
function kayma(x, z, t) {
  let ox = 0, oy = 0, oz = 0;
  for (const d of su.uniforms.dalga.value) { const l = Math.hypot(d.x, d.y), yx = d.x / l, yz = d.y / l, k = (Math.PI * 2) / d.w, c = Math.sqrt(9.8 / k), f = k * (yx * x + yz * z - c * t), a = (d.z * P.yukseklik) / k; ox += yx * a * Math.cos(f); oy += a * Math.sin(f); oz += yz * a * Math.cos(f); }
  return [ox, oy, oz];
}
export function yukseklik(x, z, t) { let qx = x, qz = z, y = 0; for (let i = 0; i < 3; i++) { const o = kayma(qx, qz, t); qx = x - o[0]; qz = z - o[2]; y = o[1]; } return y; }

// Sürgüler
const AYAR = [['yukseklik', 'Dalga yüksekliği', 0, 2.5, 0.05], ['boy', 'Dalga boyu', 0.3, 3, 0.05], ['hiz', 'Hız', 0, 3, 0.05], ['yon', 'Rüzgâr yönü (°)', -180, 180, 1], ['dagilim', 'Yön dağılımı', 0, 2, 0.05], ['kopuk', 'Tepe köpüğü', 0, 1, 0.01]];
const cikti = document.getElementById('cikti');
function yaz() {
  su.uniforms.dalga.value = dalgalar();
  su.uniforms.carpan.value = P.yukseklik;
  su.uniforms.kopuk.value = P.kopuk;
  const v = (d) => `Vector4(${d.x.toFixed(3)}, ${d.y.toFixed(3)}, ${d.z.toFixed(2)}, ${d.w.toFixed(1)})`;
  cikti.textContent = su.uniforms.dalga.value.map((d, i) => `dalga_${i + 1} = ${v(d)}`).join('\n') + `\nyukseklik_carpani = ${P.yukseklik}\nhiz = ${P.hiz}\ntepe_kopugu = ${P.kopuk}`;
}
for (const [key, ad, lo, hi, step] of AYAR) {
  const l = document.createElement('label'), i = document.createElement('input'), s = document.createElement('span');
  i.type = 'range'; i.min = lo; i.max = hi; i.step = step; i.value = P[key]; s.textContent = P[key];
  i.oninput = () => { P[key] = +i.value; s.textContent = i.value; yaz(); };
  l.append(ad, i, s);
  document.getElementById('ayar').append(l);
}
yaz();
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
const saat = new THREE.Clock();
let t = 0;
window.__deniz = { P, yaz, ileri: (dt) => { t += dt; } };
renderer.setAnimationLoop(() => {
  t += saat.getDelta() * P.hiz;
  su.uniforms.t.value = t;
  const e = 0.5, h = yukseklik(0, 0, t), hx = yukseklik(e, 0, t), hz = yukseklik(0, e, t);
  kutu.position.set(0, h + 0.3, 0);
  kutu.quaternion.slerp(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(h - hx, e, h - hz).normalize()), 0.15);
  controls.update();
  renderer.render(scene, camera);
});
