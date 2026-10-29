import {
  BoxGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Shape,
  TorusGeometry,
  type BufferGeometry,
  type Material,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** 只用于工程演示，不代表任何真实车型的外观或规格。 */
export function createConceptCar(): Group {
  const car = new Group();
  car.name = 'Procedural concept car';

  const paint = new MeshPhysicalMaterial({
    name: 'carPaint',
    color: '#b82e35',
    metalness: 0.58,
    roughness: 0.27,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  });
  const dark = new MeshStandardMaterial({ color: '#131922', metalness: 0.48, roughness: 0.43 });
  const glass = new MeshPhysicalMaterial({
    color: '#182b3a',
    metalness: 0.22,
    roughness: 0.1,
    transparent: true,
    opacity: 0.93,
    clearcoat: 1,
  });
  const rubber = new MeshStandardMaterial({ color: '#0a0b0e', roughness: 0.87 });
  const silver = new MeshStandardMaterial({ color: '#b9c3cc', metalness: 0.86, roughness: 0.24 });
  const headlight = new MeshStandardMaterial({
    color: '#ecf9ff',
    emissive: '#d8f0ff',
    emissiveIntensity: 1.7,
    roughness: 0.12,
  });
  const taillight = new MeshStandardMaterial({
    color: '#d32336',
    emissive: '#e52438',
    emissiveIntensity: 1.4,
  });

  const add = (
    geometry: BufferGeometry,
    material: Material,
    x: number,
    y: number,
    z: number,
  ): Mesh => {
    const mesh = new Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    car.add(mesh);
    return mesh;
  };

  // 底盘、车身、前盖与尾部使用相互独立的几何体，便于未来替换为 GLB。
  add(new RoundedBoxGeometry(2.08, 0.45, 4.74, 5, 0.2), dark, 0, 0.62, 0);
  add(new RoundedBoxGeometry(2.02, 0.48, 4.55, 5, 0.19), paint, 0, 0.91, 0);
  add(new RoundedBoxGeometry(1.93, 0.17, 1.52, 3, 0.08), paint, 0, 1.14, 1.36);
  add(new RoundedBoxGeometry(1.95, 0.16, 1.12, 3, 0.07), paint, 0, 1.12, -1.60);
  add(new RoundedBoxGeometry(1.90, 0.15, 0.27, 2, 0.05), dark, 0, 0.55, 2.32);
  add(new RoundedBoxGeometry(1.93, 0.12, 0.25, 2, 0.04), dark, 0, 0.56, -2.32);

  // 流线型座舱：沿车长方向绘制截面，挤出车身宽度。
  const profile = new Shape();
  profile.moveTo(-1.22, 0);
  profile.lineTo(-0.57, 0.59);
  profile.lineTo(0.56, 0.59);
  profile.lineTo(1.17, 0);
  profile.closePath();
  const canopyGeometry = new ExtrudeGeometry(profile, {
    depth: 1.46,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 3,
  });
  const canopy = add(canopyGeometry, glass, -0.73, 1.20, -0.04);
  canopy.rotation.y = Math.PI / 2;
  add(new RoundedBoxGeometry(1.43, 0.07, 1.1, 3, 0.04), paint, 0, 1.82, 0.03);

  // 侧裙、轮胎和轮毂。
  for (const side of [-1, 1]) {
    add(new RoundedBoxGeometry(0.12, 0.13, 3.12, 2, 0.04), dark, side * 1.02, 0.51, 0);

    for (const axle of [-1, 1]) {
      const z = axle * 1.48;
      const tire = add(new CylinderGeometry(0.46, 0.46, 0.30, 36), rubber, side * 1.04, 0.46, z);
      tire.rotation.z = Math.PI / 2;
      const rim = add(new CylinderGeometry(0.27, 0.27, 0.035, 12), silver, side * 1.21, 0.46, z);
      rim.rotation.z = Math.PI / 2;
      const hub = add(new CylinderGeometry(0.10, 0.10, 0.04, 20), dark, side * 1.24, 0.46, z);
      hub.rotation.z = Math.PI / 2;
    }

    // 门把手及后视镜。
    add(new BoxGeometry(0.035, 0.045, 0.24), silver, side * 1.033, 1.11, -0.22);
    add(new RoundedBoxGeometry(0.30, 0.13, 0.19, 2, 0.045), dark, side * 1.07, 1.37, 0.82);

    add(new RoundedBoxGeometry(0.48, 0.055, 0.09, 2, 0.03), headlight, side * 0.67, 1.04, 2.30);
    add(new RoundedBoxGeometry(0.61, 0.045, 0.08, 2, 0.025), taillight, side * 0.62, 1.01, -2.31);
  }

  // 后扰流板和排气细节。
  add(new RoundedBoxGeometry(1.87, 0.08, 0.30, 3, 0.04), dark, 0, 1.43, -2.14);
  for (const side of [-1, 1]) {
    add(new BoxGeometry(0.09, 0.33, 0.13), dark, side * 0.67, 1.28, -2.13);
    const exhaust = add(new TorusGeometry(0.095, 0.023, 10, 18), silver, side * 0.42, 0.59, -2.39);
    exhaust.rotation.y = Math.PI;
  }

  // 底部细节无须投射阴影。
  const underglow = add(
    new BoxGeometry(1.26, 0.035, 2.8),
    new MeshBasicMaterial({ color: '#263b48' }),
    0,
    0.25,
    0,
  );
  underglow.castShadow = false;

  return car;
}
