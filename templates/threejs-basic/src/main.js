import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';

const mount = document.querySelector('#scene');
const status = document.querySelector('#scene-status');
const motionToggle = document.querySelector('#motion-toggle');
const cameraReset = document.querySelector('#camera-reset');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0a1020');

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
const initialPosition = new THREE.Vector3(4.2, 2.8, 5.5);
camera.position.copy(initialPosition);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
} catch (error) {
  status.textContent = '无法启动 WebGL。请检查浏览器是否启用了硬件加速。';
  mount.classList.add('scene-error');
  mount.textContent = '此浏览器暂时无法显示 3D 场景';
  motionToggle.disabled = true;
  cameraReset.disabled = true;
  console.error('WebGL initialization failed:', error);
}

if (renderer) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  mount.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xaac8ff, 0x192039, 2.1));
  const keyLight = new THREE.DirectionalLight(0xd9e9ff, 4);
  keyLight.position.set(5, 8, 6);
  scene.add(keyLight);

  const geometry = new THREE.TorusKnotGeometry(1.18, 0.33, 180, 24);
  const material = new THREE.MeshStandardMaterial({
    color: 0x65baff,
    metalness: 0.45,
    roughness: 0.22,
  });
  const shape = new THREE.Mesh(geometry, material);
  scene.add(shape);

  const grid = new THREE.GridHelper(12, 18, 0x29456e, 0x182b48);
  grid.position.y = -2.2;
  scene.add(grid);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 2.5;
  controls.maxDistance = 14;
  controls.maxPolarAngle = Math.PI * 0.9;

  let playing = true;
  motionToggle.addEventListener('click', () => {
    playing = !playing;
    motionToggle.textContent = playing ? '暂停动画' : '继续动画';
  });

  cameraReset.addEventListener('click', () => {
    camera.position.copy(initialPosition);
    controls.target.set(0, 0, 0);
    controls.update();
  });

  function resize() {
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(mount);
  resize();
  status.textContent = '场景已就绪 · 鼠标拖动旋转 / 滚轮缩放';

  function animate() {
    requestAnimationFrame(animate);
    if (playing) shape.rotation.y += 0.004;
    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}
