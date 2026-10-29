import {
  AmbientLight,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  FogExp2,
  GridHelper,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  SpotLight,
  TorusGeometry,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { disposeCar } from './CarLoader';

/** 展厅环境独立于车型，切换车辆时无需重建。 */
export function installLighting(
  scene: Scene,
  renderer: WebGLRenderer,
  isMobile: boolean,
): () => void {
  scene.background = new Color('#080d14');
  scene.fog = new FogExp2('#080d14', 0.028);

  // 工程阶段使用内置 RoomEnvironment 生成反射；后续可换经授权的 HDR。
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environmentTarget = pmrem.fromScene(room);
  scene.environment = environmentTarget.texture;
  room.dispose();
  pmrem.dispose();

  const fixtures = new Group();
  fixtures.name = 'Showroom environment';
  scene.add(fixtures);

  const ambient = new AmbientLight('#a7c4e4', 0.7);
  const hemisphere = new HemisphereLight('#d5e8ff', '#17171d', 1.6);
  fixtures.add(ambient, hemisphere);

  const key = new DirectionalLight('#fff0d8', 3.4);
  key.position.set(5.5, 10, 7.5);
  key.castShadow = true;
  key.shadow.mapSize.set(isMobile ? 512 : 1024, isMobile ? 512 : 1024);
  key.shadow.camera.left = -9;
  key.shadow.camera.right = 9;
  key.shadow.camera.top = 9;
  key.shadow.camera.bottom = -9;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 25;
  key.shadow.bias = -0.0002;
  fixtures.add(key);

  const rim = new DirectionalLight('#8eb7e3', 3.0);
  rim.position.set(-6, 6, -5);
  fixtures.add(rim);

  const spotlight = new SpotLight('#ffecd1', 95, 20, 0.55, 0.85);
  spotlight.position.set(-3, 9, 1);
  spotlight.target.position.set(0, 0, 0);
  fixtures.add(spotlight, spotlight.target);

  const floor = new Mesh(
    new PlaneGeometry(200, 200),
    new MeshStandardMaterial({
      color: '#0a1119',
      roughness: 0.78,
      metalness: 0.18,
    }),
  );
  floor.name = 'Showroom floor';
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.35;
  floor.receiveShadow = true;
  fixtures.add(floor);

  const platform = new Mesh(
    new CylinderGeometry(3.6, 3.68, 0.3, 96),
    new MeshStandardMaterial({
      color: '#19242e',
      metalness: 0.74,
      roughness: 0.28,
    }),
  );
  platform.position.y = -0.15;
  platform.receiveShadow = true;
  fixtures.add(platform);

  const topDisc = new Mesh(
    new CircleGeometry(3.52, 96),
    new MeshStandardMaterial({
      color: '#202c36',
      metalness: 0.72,
      roughness: 0.31,
    }),
  );
  topDisc.rotation.x = -Math.PI / 2;
  topDisc.position.y = 0.002;
  topDisc.receiveShadow = true;
  fixtures.add(topDisc);

  const ring = new Mesh(
    new TorusGeometry(3.58, 0.022, 8, 128),
    new MeshBasicMaterial({ color: '#b99365' }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.018;
  fixtures.add(ring);

  const floorGlow = new Mesh(
    new CircleGeometry(5.5, 96),
    new MeshBasicMaterial({
      color: '#162332',
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    }),
  );
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.position.y = -0.34;
  fixtures.add(floorGlow);

  const grid = new GridHelper(32, 32, '#283949', '#17212d');
  grid.position.y = -0.345;
  fixtures.add(grid);

  return () => {
    scene.remove(fixtures);
    disposeCar(fixtures);
    key.shadow.dispose();
    spotlight.shadow.dispose();
    environmentTarget.dispose();
    scene.environment = null;
  };
}
