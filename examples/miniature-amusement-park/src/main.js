import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createWorld } from './world.js';
import './style.css';

const $ = (selector) => document.querySelector(selector);
const mount = $('#scene');
const defaults = { playing: !matchMedia('(prefers-reduced-motion: reduce)').matches, night: false, speed: 1, visitors: 42, pixels: 36, dither: true, palette: true };
const state = { ...defaults, focus: 'overview' };
const details = {
  overview: ['01 / PARK GUIDE', '像素奇想游乐园', '一座漂浮在云端的迷你乐园。拖动环游，或点击设施，发现每一个正在运转的小世界。', '5 大动态设施'],
  coaster: ['02 / THRILL RIDE', '木质云端过山车', '三节彩色小车沿着高低起伏的木轨不断穿梭，绕行整座浮空岛。', '环岛轨道 · 3 节车厢'],
  ferris: ['03 / SKY VIEW', '彩虹摩天轮', '十二个糖果色座舱缓缓升起，在高处眺望云海和整座游乐园。', '12 个缤纷座舱'],
  carousel: ['04 / CLASSIC RIDE', '旋转木马', '条纹顶篷下，小木马随着乐园节奏上下摆动。入夜后灯泡逐渐亮起。', '8 匹玩具小木马'],
  ship: ['05 / ADVENTURE', '摇摆海盗船', '迷你的海盗船在木架间有节奏地往复摆动，像一艘童话小船。', '持续往复摆动'],
  cups: ['06 / TEA PARTY', '魔法旋转茶杯', '六个彩色茶杯在圆盘上打转，各自旋转，组成一场奇妙茶会。', '6 只旋转茶杯'],
};

function panelOpen(open) {
  $('#control-panel').classList.toggle('is-collapsed', !open);
  $('#control-panel').setAttribute('aria-hidden', String(!open));
  $('#control-panel').inert = !open;
  $('#open-controls').classList.toggle('is-visible', !open);
  $('#open-controls').setAttribute('aria-expanded', String(open));
}
function syncUI() {
  $('#motion-toggle').innerHTML = state.playing ? 'Ⅱ <span>暂停</span>' : '▶ <span>继续</span>';
  $('#motion-toggle').setAttribute('aria-pressed', String(!state.playing));
  $('#run-status').textContent = state.playing ? '园区运行中' : '动画已暂停';
  $('.live-dot').classList.toggle('is-paused', !state.playing);
  $('#day-toggle').innerHTML = state.night ? '☀ <span>白天</span>' : '☾ <span>夜晚</span>';
  $('#day-toggle').setAttribute('aria-pressed', String(state.night));
  for (const id of ['day', 'night']) {
    const selected = (id === 'night') === state.night;
    $('#' + id + '-mode').classList.toggle('is-selected', selected);
    $('#' + id + '-mode').setAttribute('aria-pressed', String(selected));
  }
  $('#speed-range').value = String(state.speed);
  $('#speed-value').textContent = state.speed.toFixed(2).replace(/0$/, '') + '×';
  $('#visitor-range').value = String(state.visitors);
  $('#visitor-value').textContent = state.visitors + ' 人';
  $('#visitor-stat').textContent = String(state.visitors).padStart(2, '0');
  $('#pixel-range').value = String(state.pixels);
  $('#pixel-value').textContent = state.pixels + '%';
  $('#dither-toggle').checked = state.dither;
  $('#palette-toggle').checked = state.palette;
}
function showDetails(id) {
  const [index, title, description, stat] = details[id];
  $('#ride-index').textContent = index;
  $('#ride-title').textContent = title;
  $('#ride-description').textContent = description;
  $('#ride-stat').textContent = stat;
  document.querySelectorAll('[data-focus]').forEach((button) => {
    const selected = button.dataset.focus === id;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  state.focus = id;
}
syncUI();
panelOpen(innerWidth > 820);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
} catch (error) {
  $('#scene-error').hidden = false;
  $('#scene-error').textContent = '当前浏览器无法初始化 WebGL 3D 场景。请开启硬件加速，或使用支持 WebGL 的新版浏览器。';
  $('#run-status').textContent = '3D 场景不可用';
  console.error('PIXEL PARK WebGL initialization failed:', error);
}

if (renderer) {
  const scene = new THREE.Scene();
  // Keep the island crisp when portrait viewports place the camera farther away.
  scene.fog = new THREE.Fog(0xcac0e9, 66, 155);
  const camera = new THREE.PerspectiveCamera(41, 1, 0.1, 180);
  const homePosition = new THREE.Vector3(19, 13, 21);
  const homeTarget = new THREE.Vector3(0, -1.2, 0);
  camera.position.copy(homePosition);
  camera.lookAt(homeTarget);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = !matchMedia('(max-width: 720px)').matches;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  mount.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', '3D 游乐园画面，可以拖动、缩放或点击游乐设施');
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(homeTarget);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = false;
  controls.minDistance = 8;
  controls.maxDistance = 68;
  controls.maxPolarAngle = Math.PI * 0.82;
  controls.update();

  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { top: { value: new THREE.Color(0x929edd) }, bottom: { value: new THREE.Color(0xf0cfdc) } },
    vertexShader: [
      'varying float vHeight;',
      'void main() { vHeight = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    ].join('\n'),
    fragmentShader: [
      'uniform vec3 top; uniform vec3 bottom; varying float vHeight;',
      'void main() { gl_FragColor = vec4(mix(bottom, top, smoothstep(-0.55,0.75,vHeight)),1.0); }',
    ].join('\n'),
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(90, 24, 16), skyMaterial);
  sky.frustumCulled = false;
  sky.renderOrder = -100;
  scene.add(sky);
  const starPositions = [];
  for (let i = 0; i < 170; i++) {
    const angle = i * 2.39996;
    const y = 0.14 + (i % 55) / 55 * 0.83;
    const radius = Math.sqrt(1 - y * y) * 75;
    starPositions.push(Math.cos(angle) * radius, y * 75, Math.sin(angle) * radius);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({ color: 0xfff4dd, size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false });
  scene.add(new THREE.Points(starGeometry, starMaterial));
  const hemi = new THREE.HemisphereLight(0xeaf1ff, 0x8f6580, 1.45);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe8b5, 2.5);
  sun.position.set(-13, 23, 19);
  sun.castShadow = renderer.shadowMap.enabled;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, near: 0.5, far: 60 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.035;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x9cafff, 0.8);
  fill.position.set(13, 8, -14);
  scene.add(fill);
  const world = createWorld(scene);
  world.setVisitorCount(state.visitors);
  world.setNight(state.night);
  world.update(0, 0, 1);

  const target = new THREE.WebGLRenderTarget(320, 180, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true, stencilBuffer: false });
  target.texture.generateMipmaps = false;
  const pixelMaterial = new THREE.ShaderMaterial({
    depthWrite: false, depthTest: false,
    uniforms: {
      tDiffuse: { value: target.texture },
      sourceSize: { value: new THREE.Vector2(320, 180) },
      ditherAmount: { value: 0.35 },
      paletteMix: { value: 0.75 },
      levels: { value: 9.0 },
    },
    vertexShader: [
      'varying vec2 vUv;',
      'void main() { vUv = uv; gl_Position = vec4(position.xy,0.0,1.0); }',
    ].join('\n'),
    fragmentShader: [
      'uniform sampler2D tDiffuse;',
      'uniform vec2 sourceSize;',
      'uniform float ditherAmount, paletteMix, levels;',
      'varying vec2 vUv;',
      'float bayer4(vec2 point) {',
      ' vec2 p = mod(floor(point), 4.0);',
      ' if(p.y<1.0) { if(p.x<1.0) return 0.0; if(p.x<2.0) return 8.0; if(p.x<3.0) return 2.0; return 10.0; }',
      ' if(p.y<2.0) { if(p.x<1.0) return 12.0; if(p.x<2.0) return 4.0; if(p.x<3.0) return 14.0; return 6.0; }',
      ' if(p.y<3.0) { if(p.x<1.0) return 3.0; if(p.x<2.0) return 11.0; if(p.x<3.0) return 1.0; return 9.0; }',
      ' if(p.x<1.0) return 15.0; if(p.x<2.0) return 7.0; if(p.x<3.0) return 13.0; return 5.0;',
      '}',
      'void main() {',
      ' vec4 color = texture2D(tDiffuse, vUv);',
      ' float noise = (bayer4(floor(vUv * sourceSize))/16.0 - 0.5) * ditherAmount;',
      ' vec3 quantized = floor(color.rgb * levels + vec3(noise + 0.5)) / levels;',
      ' gl_FragColor = vec4(mix(color.rgb,clamp(quantized,0.0,1.0),paletteMix),color.a);',
      ' #include <tonemapping_fragment>',
      ' #include <colorspace_fragment>',
      '}',
    ].join('\n'),
  });
  const postScene = new THREE.Scene();
  const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), pixelMaterial));
  let viewportWidth = 0;
  let viewportHeight = 0;
  let previousQuality = 0;
  let previousCompact = innerWidth <= 820;
  function overviewPosition() {
    const scale = THREE.MathUtils.clamp(0.97 / camera.aspect, 1, 2.15);
    return homeTarget.clone().addScaledVector(homePosition.clone().sub(homeTarget), scale);
  }
  function resize() {
    const rect = mount.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    if (viewportWidth === w && viewportHeight === h && previousQuality === state.pixels) return;
    const oldAspect = viewportWidth / Math.max(1, viewportHeight);
    viewportWidth = w;
    viewportHeight = h;
    previousQuality = state.pixels;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (state.focus === 'overview' && (!oldAspect || Math.abs(camera.aspect - oldAspect) > 0.18)) {
      camera.position.copy(overviewPosition());
      controls.target.copy(homeTarget);
      controls.update();
    }
    const compact = w <= 820;
    if (compact !== previousCompact) {
      panelOpen(!compact);
      previousCompact = compact;
    }
    renderer.setSize(w, h, false);
    const renderWidth = Math.max(90, Math.round(w * state.pixels / 100));
    const renderHeight = Math.max(90, Math.round(h * state.pixels / 100));
    target.setSize(renderWidth, renderHeight);
    pixelMaterial.uniforms.sourceSize.value.set(renderWidth, renderHeight);
  }
  addEventListener('resize', resize, { passive: true });
  new ResizeObserver(resize).observe(mount);
  resize();

  let tween = null;
  function focus(id) {
    if (!details[id]) return;
    showDetails(id);
    const targetPoint = id === 'overview' ? homeTarget.clone() : world.focusPoints[id].clone();
    const direction = camera.position.clone().sub(controls.target).normalize();
    const distance = id === 'coaster' ? 29 : id === 'ferris' ? 18.5 : 14.5;
    const cameraPoint = id === 'overview' ? overviewPosition() : targetPoint.clone().addScaledVector(direction, distance);
    if (id !== 'overview') cameraPoint.y = Math.max(cameraPoint.y, targetPoint.y + 5);
    tween = {
      fromPosition: camera.position.clone(), fromTarget: controls.target.clone(),
      toPosition: cameraPoint, toTarget: targetPoint, elapsed: 0,
      duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.01 : 0.85,
    };
  }
  function setNight(value) {
    state.night = Boolean(value);
    world.setNight(state.night);
    $('.scene-shell').classList.toggle('is-night', state.night);
    syncUI();
  }
  function toggleMotion() { state.playing = !state.playing; syncUI(); }
  function setVisitors(value) {
    state.visitors = THREE.MathUtils.clamp(Math.round(Number(value)), 8, 64);
    world.setVisitorCount(state.visitors);
    syncUI();
  }
  $('#motion-toggle').addEventListener('click', toggleMotion);
  $('#day-toggle').addEventListener('click', () => setNight(!state.night));
  $('#day-mode').addEventListener('click', () => setNight(false));
  $('#night-mode').addEventListener('click', () => setNight(true));
  $('#camera-reset').addEventListener('click', () => focus('overview'));
  $('#speed-range').addEventListener('input', (e) => { state.speed = Number(e.target.value); syncUI(); });
  $('#visitor-range').addEventListener('input', (e) => setVisitors(e.target.value));
  $('#pixel-range').addEventListener('input', (e) => { state.pixels = Number(e.target.value); resize(); syncUI(); });
  $('#dither-toggle').addEventListener('change', (e) => { state.dither = e.target.checked; syncUI(); });
  $('#palette-toggle').addEventListener('change', (e) => { state.palette = e.target.checked; syncUI(); });
  $('#open-controls').addEventListener('click', () => panelOpen(true));
  $('#close-controls').addEventListener('click', () => panelOpen(false));
  $('#panel-reset').addEventListener('click', () => {
    const playing = state.playing;
    Object.assign(state, defaults, { playing });
    setNight(false);
    setVisitors(defaults.visitors);
    resize();
    focus('overview');
  });
  document.querySelectorAll('[data-focus]').forEach((button) => button.addEventListener('click', () => focus(button.dataset.focus)));

  const pickObjects = world.pickables.map((item) => item.object);
  const pickMap = new Map(world.pickables.map((item) => [item.object, item.id]));
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerStart = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { pointerStart = { x: e.clientX, y: e.clientY }; tween = null; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!pointerStart) return;
    const moved = Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y);
    pointerStart = null;
    if (moved > 7) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(pickObjects, true);
    if (!hits.length) return;
    let object = hits[0].object;
    while (object && !pickMap.has(object)) object = object.parent;
    if (object) focus(pickMap.get(object));
  });
  renderer.domElement.addEventListener('pointercancel', () => { pointerStart = null; });
  addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.code === 'Space') { e.preventDefault(); toggleMotion(); }
    if (e.key.toLowerCase() === 'n') setNight(!state.night);
    if (e.key.toLowerCase() === 'r') focus('overview');
    if (e.key.toLowerCase() === 'h') panelOpen($('#control-panel').classList.contains('is-collapsed'));
  });

  const dayTop = new THREE.Color(0x929edd);
  const dayBottom = new THREE.Color(0xf0cfdc);
  const nightTop = new THREE.Color(0x111b42);
  const nightBottom = new THREE.Color(0x645281);
  const dayFog = new THREE.Color(0xcac0e9);
  const nightFog = new THREE.Color(0x232c52);
  const clock = new THREE.Clock();
  let elapsed = 0;
  let lightingMix = 0;
  let frames = 0;
  let fpsTime = 0;
  let running = true;
  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    const delta = Math.min(clock.getDelta(), 0.05);
    if (state.playing) {
      const scaled = delta * state.speed;
      elapsed += scaled;
      world.update(elapsed, scaled, 1);
    }
    lightingMix = THREE.MathUtils.damp(lightingMix, state.night ? 1 : 0, 2.7, delta);
    skyMaterial.uniforms.top.value.copy(dayTop).lerp(nightTop, lightingMix);
    skyMaterial.uniforms.bottom.value.copy(dayBottom).lerp(nightBottom, lightingMix);
    scene.fog.color.copy(dayFog).lerp(nightFog, lightingMix);
    hemi.intensity = THREE.MathUtils.lerp(1.45, 0.6, lightingMix);
    sun.intensity = THREE.MathUtils.lerp(2.5, 0.35, lightingMix);
    fill.intensity = THREE.MathUtils.lerp(0.8, 1.1, lightingMix);
    starMaterial.opacity = lightingMix * 0.95;
    if (tween) {
      tween.elapsed += delta;
      const t = Math.min(1, tween.elapsed / tween.duration);
      const eased = t * t * (3 - 2 * t);
      camera.position.lerpVectors(tween.fromPosition, tween.toPosition, eased);
      controls.target.lerpVectors(tween.fromTarget, tween.toTarget, eased);
      if (t === 1) tween = null;
    }
    controls.update();
    sky.position.copy(camera.position);
    pixelMaterial.uniforms.ditherAmount.value = state.dither ? (state.night ? 0.16 : 0.35) : 0;
    pixelMaterial.uniforms.paletteMix.value = state.palette ? (state.night ? 0.65 : 0.75) : 0;
    renderer.setRenderTarget(target);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCamera);
    frames++;
    fpsTime += delta;
    if (fpsTime > 0.7) {
      $('#fps-status').textContent = 'FPS ' + Math.round(frames / fpsTime);
      fpsTime = 0;
      frames = 0;
    }
    $('#time-status').textContent = 'DAY 01 · ' + (state.night ? '20' : '10') + ':' + String(Math.floor(elapsed / 3) % 60).padStart(2, '0');
  }
  frame();
  addEventListener('pagehide', () => { running = false; });
}
