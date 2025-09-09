

import \* as THREE from "[https://unpkg.com/three@0.179.0/build/three.module.js](https://unpkg.com/three@0.179.0/build/three.module.js)";
import { OrbitControls } from "[https://unpkg.com/three@0.179.0/examples/jsm/controls/OrbitControls.js](https://unpkg.com/three@0.179.0/examples/jsm/controls/OrbitControls.js)";
import { FBXLoader } from "[https://unpkg.com/three@0.179.0/examples/jsm/loaders/FBXLoader.js](https://unpkg.com/three@0.179.0/examples/jsm/loaders/FBXLoader.js)";
import { EffectComposer } from "[https://unpkg.com/three@0.179.0/examples/jsm/postprocessing/EffectComposer.js](https://unpkg.com/three@0.179.0/examples/jsm/postprocessing/EffectComposer.js)";
import { RenderPass } from "[https://unpkg.com/three@0.179.0/examples/jsm/postprocessing/RenderPass.js](https://unpkg.com/three@0.179.0/examples/jsm/postprocessing/RenderPass.js)";
import { UnrealBloomPass } from "[https://unpkg.com/three@0.179.0/examples/jsm/postprocessing/UnrealBloomPass.js](https://unpkg.com/three@0.179.0/examples/jsm/postprocessing/UnrealBloomPass.js)";
import { FontLoader } from "[https://unpkg.com/three@0.179.0/examples/jsm/loaders/FontLoader.js](https://unpkg.com/three@0.179.0/examples/jsm/loaders/FontLoader.js)";
import { TextGeometry } from "[https://unpkg.com/three@0.179.0/examples/jsm/geometries/TextGeometry.js](https://unpkg.com/three@0.179.0/examples/jsm/geometries/TextGeometry.js)";

const PAGE = document.documentElement.getAttribute("data-page") || "home";
const CANVAS = document.getElementById("scene");

// Common scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
// Make scene globally accessible for theme manager
window.scene = scene;

const camera = new THREE.PerspectiveCamera(70, window\.innerWidth / window\.innerHeight, 0.1, 2000);
camera.position.set(0, 1.5, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: CANVAS });
renderer.setSize(window\.innerWidth, window\.innerHeight);
renderer.setPixelRatio(Math.min(window\.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Controls with mobile optimization
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Mobile touch optimizations
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
if (isMobile) {
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;
  controls.maxPolarAngle = Math.PI * 0.75;
  controls.minPolarAngle = Math.PI * 0.25;
}

// Lights
const ambient = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambient);
const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
keyLight.position.set(5, 8, 6);
scene.add(keyLight);
const rim = new THREE.PointLight(0x00e0ff, 1.0, 50);
rim.position.set(-6, 3, -4);
scene.add(rim);

// Postprocessing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window\.innerWidth, window\.innerHeight), 0.9, 0.4, 0.85);
composer.addPass(bloom);

// Particles background with mobile optimization
const starGeom = new THREE.BufferGeometry();
const starCount = isMobile ? 400 : 900; // Reduce particles on mobile for better performance
const starPos = new Float32Array(starCount \* 3);
for (let i = 0; i < starCount \* 3; i += 3) {
starPos\[i] = (Math.random() - 0.5) \* 120;
starPos\[i + 1] = (Math.random() - 0.5) \* 120;
starPos\[i + 2] = (Math.random() - 0.5) \* 120;
}
starGeom.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
const stars = new THREE.Points(starGeom, new THREE.PointsMaterial({ size: 0.7, color: 0xffffff }));
// Make stars globally accessible for theme manager
window.stars = stars;
scene.add(stars);

// Responsive
window\.addEventListener("resize", () => {
camera.aspect = window\.innerWidth / window\.innerHeight;
camera.updateProjectionMatrix();
renderer.setSize(window\.innerWidth, window\.innerHeight);
composer.setSize(window\.innerWidth, window\.innerHeight);
});

// Helpers
function addLogoPlane(url, size = 3) {
const tex = new THREE.TextureLoader().load(url);
const geo = new THREE.PlaneGeometry(size, size);
const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
const mesh = new THREE.Mesh(geo, mat);
return mesh;
}
async function loadFBX(url, scale = 0.01, color = 0xffffff) {
return new Promise((resolve, reject) => {
const loader = new FBXLoader();
loader.load(url, fbx => {
fbx.scale.setScalar(scale);
fbx.traverse(ch => {
if (ch.isMesh) {
ch.material = new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.25, emissive: 0x001a1f });
ch.castShadow = false;
ch.receiveShadow = false;
}
});
resolve(fbx);
}, undefined, reject);
});
}

// Scenes per page
async function setupHome() {
// 1) Logo plane
const logo = addLogoPlane("[https://pub-6fabcda3e4e84b4a89d1fb66eb6f45ea.r2.dev/ExcessLogo.jpg](https://pub-6fabcda3e4e84b4a89d1fb66eb6f45ea.r2.dev/ExcessLogo.jpg)", 3.2);
logo.position.set(0, 0.3, 0);
scene.add(logo);

// 2) Try FBX logo if hosted
const MODEL\_URL = "[https://raw.githubusercontent.com/your-user/your-repo/main/XX.fbx](https://raw.githubusercontent.com/your-user/your-repo/main/XX.fbx)"; // replace with your raw GitHub URL
try {
const fbx = await loadFBX(MODEL\_URL, 0.015, 0x00ffff);
fbx.position.set(0, -0.2, 0);
scene.add(fbx);

```
// Small entrance animation
fbx.scale.setScalar(0.001);
const start = performance.now();
function grow() {
  const t = Math.min(1, (performance.now() - start) / 1200);
  const ease = t * t * (3 - 2 * t);
  fbx.scale.setScalar(0.015 * ease);
  if (t < 1) requestAnimationFrame(grow);
}
grow();

// Replace plane focus by fading it out slowly
let fade = 1;
const fadeId = setInterval(() => {
  fade -= 0.02;
  logo.material.opacity = Math.max(0, fade);
  if (fade <= 0) {
    scene.remove(logo);
    clearInterval(fadeId);
  }
}, 16);

// Idle rotation
renderer.setAnimationLoop(() => {
  stars.rotation.y += 0.0006;
  fbx.rotation.y += 0.003;
  controls.update();
  composer.render();
});
return;
```

} catch {
// No FBX found, keep plane and rotate it
}

// Plane fallback animation
renderer.setAnimationLoop(() => {
stars.rotation.y += 0.0006;
logo.rotation.y += 0.01;
controls.update();
composer.render();
});
}

async function setupNGO() {
// Calm scene with slow camera breathing and soft text mesh
const font = await new Promise((res, rej) => {
new FontLoader().load("[https://unpkg.com/three@0.179.0/examples/fonts/helvetiker\_regular.typeface.json](https://unpkg.com/three@0.179.0/examples/fonts/helvetiker_regular.typeface.json)", res, undefined, rej);
});
const geo = new TextGeometry("Bridging the gap", { font, size: 0.6, height: 0.06, curveSegments: 8 });
geo.center();
const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.4, emissive: 0x000a0a });
const text = new THREE.Mesh(geo, mat);
text.position.y = 0.3;
scene.add(text);

renderer.setAnimationLoop(() => {
const t = performance.now() \* 0.001;
camera.position.z = 6 + Math.sin(t \* 0.6) \* 0.6;
text.rotation.y = Math.sin(t \* 0.3) \* 0.2;
stars.rotation.y += 0.0004;
controls.update();
composer.render();
});
}

async function setupArtists() {
// Reactive wireframe torus knots with slow spin
const group = new THREE.Group();
for (let i = 0; i < 4; i++) {
const g = new THREE.TorusKnotGeometry(0.9 + i \* 0.2, 0.28, 160, 24);
const m = new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true, emissive: 0x001a1f });
const mesh = new THREE.Mesh(g, m);
mesh.position.x = (i - 1.5) \* 1.7;
group.add(mesh);
}
scene.add(group);

renderer.setAnimationLoop(() => {
const t = performance.now() \* 0.001;
group.rotation.y = t \* 0.3;
stars.rotation.y += 0.0005;
controls.update();
composer.render();
});
}

async function setupContact() {
// Simple rotating grid of planes to keep page alive
const g = new THREE.PlaneGeometry(6, 6, 20, 20);
const m = new THREE.MeshBasicMaterial({ color: 0x0a2a33, wireframe: true, transparent: true, opacity: 0.5 });
const mesh = new THREE.Mesh(g, m);
mesh.rotation.x = -Math.PI / 2.5;
mesh.position.y = -1.2;
scene.add(mesh);

renderer.setAnimationLoop(() => {
mesh.rotation.z += 0.0015;
stars.rotation.y += 0.0004;
controls.update();
composer.render();
});
}

// Boot per page
if (PAGE === "home") setupHome();
if (PAGE === "ngo") setupNGO();
if (PAGE === "artists") setupArtists();
if (PAGE === "contact") setupContact();
