import * as THREE from 'three';

// Entire park is modeled procedurally. No models, textures or fonts are downloaded.
const palette = {
  grass: 0x88c97a, grassLight: 0xaddc83, grassDark: 0x59a46a,
  dirt: 0xa97d5c, stone: 0x74677c, stoneDark: 0x484a66,
  path: 0xf6d9a2, cream: 0xfff3c9, coral: 0xf77983,
  pink: 0xffaec4, yellow: 0xffcd63, mint: 0x7ccfc0,
  sky: 0x7ab6dd, blue: 0x648cc5, wood: 0xa9724d,
  darkWood: 0x795a49, navy: 0x38436c, white: 0xfff4de,
};

function seededRandom(seed = 42) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let r = value;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const random = seededRandom(7826);
const TAU = Math.PI * 2;
const vec = (x, y, z) => new THREE.Vector3(x, y, z);

export function createWorld(scene) {
  const root = new THREE.Group();
  root.name = 'PIXEL PARK floating island';
  scene.add(root);

  const materials = new Map();
  const bulbMaterials = [];
  const animatedLights = [];
  const updates = [];
  const pickables = [];
  const focusPoints = {};

  function mat(hex, extra = {}) {
    const key = `${hex}/${JSON.stringify(extra)}`;
    if (!materials.has(key)) {
      materials.set(key, new THREE.MeshStandardMaterial({
        color: hex, roughness: 0.84, metalness: 0, flatShading: true, ...extra,
      }));
    }
    return materials.get(key);
  }

  const grass = mat(palette.grass);
  const grassLight = mat(palette.grassLight);
  const pathMat = mat(palette.path);
  const cream = mat(palette.cream);
  const wood = mat(palette.wood);
  const navy = mat(palette.navy);
  const sunYellow = mat(palette.yellow);
  const coral = mat(palette.coral);

  function add(parent, geometry, material, x = 0, y = 0, z = 0, shadow = true) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function box(parent, width, height, depth, material, x = 0, y = 0, z = 0, shadow = true) {
    return add(parent, new THREE.BoxGeometry(width, height, depth), material, x, y, z, shadow);
  }

  function cylinder(parent, top, bottom, height, material, x = 0, y = 0, z = 0, segments = 12) {
    return add(parent, new THREE.CylinderGeometry(top, bottom, height, segments, 1), material, x, y, z);
  }

  function cone(parent, radius, height, material, x = 0, y = 0, z = 0, sides = 10) {
    return add(parent, new THREE.ConeGeometry(radius, height, sides), material, x, y, z);
  }

  function beam(parent, from, to, radius, material, sides = 5) {
    const direction = new THREE.Vector3().subVectors(to, from);
    const mesh = add(parent, new THREE.CylinderGeometry(radius, radius, direction.length(), sides), material);
    mesh.position.copy(from).addScaledVector(direction, 0.5);
    mesh.quaternion.setFromUnitVectors(vec(0, 1, 0), direction.normalize());
    return mesh;
  }

  function glowMaterial(hex, intensity = 0.35) {
    const material = new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: intensity });
    bulbMaterials.push(material);
    return material;
  }

  function bulb(parent, x, y, z, size = 0.1) {
    return add(parent, new THREE.SphereGeometry(size, 5, 4), glowMaterial(0xfff09e), x, y, z, false);
  }

  function sign(parent, width, height, color, x, y, z) {
    const panel = box(parent, width, height, 0.12, mat(color), x, y, z);
    box(parent, width * 0.73, 0.055, 0.14, cream, x, y + 0.08, z + 0.075);
    return panel;
  }

  // ---------------------------------------------------------------------
  // Island: grass plateau, layered dirt and a faceted pointed stone base.
  // ---------------------------------------------------------------------
  cylinder(root, 10.7, 10.45, 0.36, mat(palette.grassDark), 0, -0.18, 0, 14);
  cylinder(root, 10.42, 9.82, 0.95, mat(palette.dirt), 0, -0.80, 0, 14);
  cylinder(root, 9.82, 8.90, 1.12, mat(palette.stone), 0, -1.82, 0, 12);
  cylinder(root, 8.90, 6.50, 1.68, mat(palette.stoneDark), 0, -3.22, 0, 10);
  cone(root, 6.50, 2.65, mat(0x41445d), 0, -5.35, 0, 8).rotation.z = Math.PI;
  cylinder(root, 10.02, 10.15, 0.12, grass, 0, 0.06, 0, 16);
  cylinder(root, 7.35, 7.8, 0.034, grassLight, 0, 0.133, 0, 16);

  const islandRocks = [
    [-10.55, -1.2, -0.5, 0.78], [11.8, -0.95, -4.6, 0.7],
    [0.3, -4.25, -7.4, 0.72], [11.5, -2.1, 2.5, 0.5],
  ];
  islandRocks.forEach(([x, y, z, scale], i) => {
    const stone = add(root, new THREE.DodecahedronGeometry(scale, 0), mat(i % 2 ? 0x80748c : 0x565974), x, y, z);
    stone.rotation.set(random(), random(), random());
  });

  // Decorative stepped plaza and paths. Roads sit on the surface.
  cylinder(root, 2.45, 2.55, 0.065, pathMat, 0.1, 0.195, 0.2, 16);
  cylinder(root, 1.42, 1.46, 0.018, mat(0xffe9ba), 0.1, 0.239, 0.2, 16);

  function ribbon(parent, points, width, material, closed = false, yOffset = 0.202) {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => vec(x, yOffset, z)), closed, 'centripetal');
    const count = Math.max(32, points.length * 14);
    const positions = [];
    const indices = [];
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const p = curve.getPoint(t);
      const dir = curve.getTangent(t).normalize();
      const nx = -dir.z * width / 2;
      const nz = dir.x * width / 2;
      positions.push(p.x + nx, p.y, p.z + nz, p.x - nx, p.y, p.z - nz);
      if (i < count) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const road = add(parent, geo, material, 0, 0, 0, false);
    road.material.side = THREE.DoubleSide;
    return curve;
  }

  const promenade = Array.from({ length: 16 }, (_, i) => {
    const a = i / 16 * TAU;
    return [5.72 * Math.cos(a), 5.03 * Math.sin(a)];
  });
  const promenadeCurve = ribbon(root, promenade, 1.1, pathMat, true);
  ribbon(root, [[0, 0], [-1, -1.5], [-3.5, -3.2]], 0.82, pathMat);
  ribbon(root, [[0, 0], [2.0, -1.5], [4.2, -3.3]], 0.84, pathMat);
  ribbon(root, [[0, 0], [-1.4, 2.5], [-3.5, 4.0]], 0.8, pathMat);
  ribbon(root, [[0, 0], [3.1, 1.3], [5.5, 2.5]], 0.85, pathMat);
  ribbon(root, [[0.0, 0], [0, 3.7], [0, 8.7]], 1.2, pathMat);

  // Park rim fence, with an open entrance facing the viewer.
  const fenceMaterial = mat(0xfce1a8);
  const fenceCount = 56;
  const post = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.72, 0.12), fenceMaterial, fenceCount);
  const dummy = new THREE.Object3D();
  let used = 0;
  for (let i = 0; i < fenceCount; i++) {
    const a = i / fenceCount * TAU;
    if (Math.abs(a - Math.PI / 2) < 0.20) continue;
    dummy.position.set(9.74 * Math.cos(a), 0.43, 9.35 * Math.sin(a));
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    post.setMatrixAt(used++, dummy.matrix);
  }
  post.count = used;
  post.castShadow = true;
  root.add(post);
  const railingPoints = [];
  for (let i = 0; i <= 54; i++) {
    const a = (Math.PI / 2 + 0.2) + i / 54 * (TAU - 0.4);
    railingPoints.push(vec(9.74 * Math.cos(a), 0.69, 9.35 * Math.sin(a)));
  }
  const fenceCurve = new THREE.CatmullRomCurve3(railingPoints);
  add(root, new THREE.TubeGeometry(fenceCurve, 120, 0.047, 4, false), fenceMaterial, 0, 0, 0, false);

  // ---------------------------------------------------------------------
  // Instanced vegetation for a distinct voxel / low-poly toy appearance.
  // ---------------------------------------------------------------------
  const treeLocations = [];
  const shrubLocations = [];
  const restricted = [
    [-4.2, -3.1, 3.1], [2.2, -1.6, 2.8],
    [5.4, 2.1, 2.3], [-3.4, 3.8, 2.1], [0.1, 7.1, 2],
  ];
  function clearSpace(x, z) {
    return restricted.every(([rx, rz, rr]) => Math.hypot(x - rx, z - rz) > rr);
  }
  for (let i = 0; i < 140; i++) {
    const a = random() * TAU;
    const radius = 6.8 + random() * 2.45;
    const x = Math.cos(a) * radius;
    const z = Math.sin(a) * radius;
    if (clearSpace(x, z) && treeLocations.length < 52) treeLocations.push([x, z, 0.74 + random() * 0.55]);
  }
  for (let i = 0; i < 185; i++) {
    const a = random() * TAU;
    const radius = 3.8 + random() * 5.7;
    const x = Math.cos(a) * radius;
    const z = Math.sin(a) * radius;
    if (clearSpace(x, z) && shrubLocations.length < 100) shrubLocations.push([x, z, 0.4 + random() * 0.4]);
  }

  function vegetationInstancing(positions, geometry, material, yFunc, scaleFunc) {
    const mesh = new THREE.InstancedMesh(geometry, material, positions.length);
    positions.forEach(([x, z, scale], i) => {
      dummy.position.set(x, yFunc(scale), z);
      dummy.rotation.set(0, random() * TAU, 0);
      dummy.scale.setScalar(scaleFunc(scale));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, new THREE.Color().setHSL(0.29 + random() * 0.055, 0.28 + random() * 0.18, 0.41 + random() * 0.14));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  }

  const trunkMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.13, 0.17, 0.8, 5), wood, treeLocations.length);
  treeLocations.forEach(([x, z, scale], i) => {
    dummy.position.set(x, 0.49 * scale, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    trunkMesh.setMatrixAt(i, dummy.matrix);
  });
  trunkMesh.castShadow = true;
  root.add(trunkMesh);
  vegetationInstancing(treeLocations, new THREE.ConeGeometry(0.7, 1.55, 5), grass, (s) => 1.18 * s, (s) => s);
  vegetationInstancing(shrubLocations, new THREE.IcosahedronGeometry(0.46, 0), grass, (s) => 0.25 * s, (s) => s);

  // Flower patches are tiny colorful instanced cubes.
  const flowerCount = 88;
  const flowers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), cream, flowerCount);
  for (let i = 0; i < flowerCount; i++) {
    const a = random() * TAU;
    const r = 2 + random() * 7.4;
    dummy.position.set(Math.cos(a) * r, 0.22, Math.sin(a) * r);
    dummy.rotation.set(0, random() * TAU, 0);
    dummy.scale.setScalar(0.7 + random() * 0.9);
    dummy.updateMatrix();
    flowers.setMatrixAt(i, dummy.matrix);
    flowers.setColorAt(i, new THREE.Color([palette.pink, palette.yellow, palette.white, palette.mint][i % 4]));
  }
  root.add(flowers);

  // ---------------------------------------------------------------------
  // Ferris wheel. Cabins counter-rotate to stay upright as the wheel turns.
  // ---------------------------------------------------------------------
  function makeFerris() {
    const ride = new THREE.Group();
    ride.position.set(-4.25, 0.12, -3.25);
    ride.name = '彩虹摩天轮';
    root.add(ride);
    cylinder(ride, 1.9, 2, 0.22, mat(0xc6e8d6), 0, 0.16, 0, 10);
    for (const z of [-0.55, 0.55]) {
      beam(ride, vec(-1.35, 0.28, z), vec(0, 4.55, z), 0.11, wood);
      beam(ride, vec(1.35, 0.28, z), vec(0, 4.55, z), 0.11, wood);
    }
    const wheel = new THREE.Group();
    wheel.position.set(0, 4.55, 0);
    ride.add(wheel);
    for (const z of [-0.18, 0.18]) {
      add(wheel, new THREE.TorusGeometry(2.65, 0.095, 5, 40), sunYellow, 0, 0, z);
    }
    cylinder(wheel, 0.23, 0.23, 0.75, coral, 0, 0, 0, 12).rotation.x = Math.PI / 2;
    const cabins = [];
    const cabinMats = [mat(0xf4789c), mat(0x75c7bf), mat(0xf5be56), mat(0x7fa6db), mat(0xc4a5e8)];
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12;
      beam(wheel, vec(0, 0, 0), vec(Math.sin(a) * 2.63, Math.cos(a) * 2.63, 0), 0.062, i % 2 ? cream : coral, 5);
      const cabinPivot = new THREE.Group();
      cabinPivot.position.set(Math.sin(a) * 2.65, Math.cos(a) * 2.65, 0);
      wheel.add(cabinPivot);
      const tone = cabinMats[i % cabinMats.length];
      box(cabinPivot, 0.58, 0.33, 0.48, tone, 0, -0.22, 0);
      box(cabinPivot, 0.53, 0.08, 0.43, cream, 0, 0.08, 0);
      beam(cabinPivot, vec(-0.22, -0.19, 0), vec(-0.22, 0.09, 0), 0.035, navy);
      beam(cabinPivot, vec(0.22, -0.19, 0), vec(0.22, 0.09, 0), 0.035, navy);
      cabins.push(cabinPivot);
    }
    const center = add(wheel, new THREE.IcosahedronGeometry(0.3, 1), coral, 0, 0, 0);
    pickables.push({ object: ride, id: 'ferris' });
    focusPoints.ferris = vec(-4.25, 3.0, -3.25);
    updates.push((time, delta, speed) => {
      wheel.rotation.z -= delta * 0.19 * speed;
      cabins.forEach((c) => { c.rotation.z = -wheel.rotation.z; });
    });
  }
  makeFerris();

  // ---------------------------------------------------------------------
  // Carousel: rotating striped canopy, bobbing carousel animals and bulbs.
  // ---------------------------------------------------------------------
  function stripedCanopy(parent, radius, height, topY, colors, segmentCount = 12) {
    const roof = new THREE.Group();
    parent.add(roof);
    const top = vec(0, topY + height, 0);
    for (let i = 0; i < segmentCount; i++) {
      const a0 = (i / segmentCount) * TAU;
      const a1 = ((i + 1) / segmentCount) * TAU;
      const positions = [
        top.x, top.y, top.z,
        Math.cos(a0) * radius, topY, Math.sin(a0) * radius,
        Math.cos(a1) * radius, topY, Math.sin(a1) * radius,
      ];
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.computeVertexNormals();
      const panel = add(roof, geo, colors[i % colors.length], 0, 0, 0);
      panel.material.side = THREE.DoubleSide;
    }
    cylinder(roof, 0.09, 0.09, 0.2, sunYellow, 0, topY + height + 0.09);
    return roof;
  }

  function makeCarousel() {
    const ride = new THREE.Group();
    ride.position.set(2.1, 0.13, -1.85);
    ride.name = '旋转木马';
    root.add(ride);
    cylinder(ride, 2.25, 2.31, 0.26, mat(0xe9aa8e), 0, 0.16, 0, 14);
    cylinder(ride, 2.12, 2.14, 0.075, sunYellow, 0, 0.34, 0, 14);
    const rotor = new THREE.Group();
    rotor.position.y = 0.3;
    ride.add(rotor);
    cylinder(rotor, 0.19, 0.2, 2.85, mat(0xf7ce7a), 0, 1.43, 0);
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * TAU;
      const x = Math.cos(a) * 1.75;
      const z = Math.sin(a) * 1.75;
      beam(rotor, vec(x, 0.19, z), vec(x, 2.7, z), 0.033, cream);
    }
    stripedCanopy(rotor, 2.2, 1.12, 2.54, [coral, cream], 14);
    const horses = [];
    const colors = [palette.sky, palette.mint, palette.pink, palette.yellow];
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      const x = Math.cos(a) * 1.43;
      const z = Math.sin(a) * 1.43;
      const toy = new THREE.Group();
      toy.position.set(x, 0.93, z);
      toy.rotation.y = a;
      rotor.add(toy);
      const color = mat(colors[i % colors.length]);
      box(toy, 0.49, 0.4, 0.23, color, 0, 0, 0);
      box(toy, 0.24, 0.43, 0.22, color, 0.25, 0.13, 0);
      box(toy, 0.3, 0.22, 0.23, color, 0.38, 0.39, 0);
      box(toy, 0.1, 0.35, 0.12, navy, -0.12, -0.31, 0.085);
      box(toy, 0.1, 0.35, 0.12, navy, 0.14, -0.31, -0.085);
      box(toy, 0.28, 0.09, 0.22, mat(0xa77563), -0.04, 0.23, 0);
      horses.push(toy);
    }
    for (let i = 0; i < 28; i++) {
      const a = i / 28 * TAU;
      bulb(rotor, Math.cos(a) * 2.04, 2.57, Math.sin(a) * 2.04, 0.072);
    }
    pickables.push({ object: ride, id: 'carousel' });
    focusPoints.carousel = vec(2.1, 1.8, -1.85);
    updates.push((time, delta, speed) => {
      rotor.rotation.y += delta * 0.36 * speed;
      horses.forEach((horse, i) => { horse.position.y = 0.92 + Math.sin(time * 2.0 * speed + i * 0.8) * 0.18; });
    });
  }
  makeCarousel();

  // ---------------------------------------------------------------------
  // Pirate ship: rocking boat suspended from two timber A-frames.
  // ---------------------------------------------------------------------
  function makePirateShip() {
    const ride = new THREE.Group();
    ride.position.set(5.55, 0.1, 2.15);
    ride.rotation.y = -0.38;
    ride.name = '海盗船';
    root.add(ride);
    cylinder(ride, 1.75, 1.8, 0.12, mat(0xe6dbbc), 0, 0.12, 0, 12);
    for (const z of [-0.7, 0.7]) {
      beam(ride, vec(-1.15, 0.25, z), vec(0, 3.02, z), 0.10, wood);
      beam(ride, vec(1.15, 0.25, z), vec(0, 3.02, z), 0.10, wood);
    }
    beam(ride, vec(0, 3.02, -0.88), vec(0, 3.02, 0.88), 0.11, coral);
    const swing = new THREE.Group();
    swing.position.y = 3.02;
    ride.add(swing);
    beam(swing, vec(0, 0, -0.62), vec(0, -1.8, -0.62), 0.045, navy);
    beam(swing, vec(0, 0, 0.62), vec(0, -1.8, 0.62), 0.045, navy);
    const hull = new THREE.Group();
    hull.position.y = -1.83;
    swing.add(hull);
    box(hull, 2.30, 0.36, 0.92, mat(0x7e84b5), 0, 0, 0);
    box(hull, 2.15, 0.3, 0.98, mat(0xf5b95d), 0, 0.23, 0);
    for (const x of [-0.9, -0.45, 0, 0.45, 0.9]) box(hull, 0.08, 0.40, 0.95, navy, x, 0.31, 0);
    cone(hull, 0.46, 0.8, coral, -1.12, 0.04, 0, 4).rotation.z = Math.PI / 2;
    cone(hull, 0.46, 0.8, coral, 1.12, 0.04, 0, 4).rotation.z = -Math.PI / 2;
    box(hull, 0.06, 0.70, 0.06, cream, 0, 0.78, 0);
    cone(hull, 0.28, 0.42, mat(0xffd66b), 0, 1.05, 0, 3);
    pickables.push({ object: ride, id: 'ship' });
    focusPoints.ship = vec(5.55, 2.0, 2.15);
    updates.push((time, delta, speed) => {
      swing.rotation.z = Math.sin(time * 0.96 * speed) * 0.52;
    });
  }
  makePirateShip();

  // ---------------------------------------------------------------------
  // Spinning cups, a miniature ride in the garden quadrant.
  // ---------------------------------------------------------------------
  function makeTeacups() {
    const ride = new THREE.Group();
    ride.position.set(-3.35, 0.13, 3.75);
    ride.name = '旋转茶杯';
    root.add(ride);
    cylinder(ride, 1.84, 1.87, 0.18, mat(0xa6dcd0), 0, 0.16, 0, 12);
    cylinder(ride, 1.72, 1.74, 0.08, cream, 0, 0.28, 0, 12);
    const platform = new THREE.Group();
    platform.position.y = 0.27;
    ride.add(platform);
    const cups = [];
    for (let i = 0; i < 6; i++) {
      const a = i * TAU / 6;
      const g = new THREE.Group();
      g.position.set(Math.cos(a) * 1.15, 0.39, Math.sin(a) * 1.15);
      platform.add(g);
      const color = mat([palette.coral, palette.blue, palette.yellow, palette.mint][i % 4]);
      cylinder(g, 0.39, 0.27, 0.44, color);
      add(g, new THREE.TorusGeometry(0.39, 0.055, 4, 12), cream, 0, 0.24, 0).rotation.x = Math.PI / 2;
      add(g, new THREE.TorusGeometry(0.20, 0.05, 4, 10, Math.PI), cream, 0.4, 0.02, 0).rotation.y = Math.PI / 2;
      cups.push(g);
    }
    pickables.push({ object: ride, id: 'cups' });
    focusPoints.cups = vec(-3.35, 1.15, 3.75);
    updates.push((time, delta, speed) => {
      platform.rotation.y -= delta * 0.32 * speed;
      cups.forEach((c, i) => { c.rotation.y += delta * (0.48 + i * 0.045) * speed; });
    });
  }
  makeTeacups();

  // ---------------------------------------------------------------------
  // Roller coaster: faceted timber snake encircles the park.
  // ---------------------------------------------------------------------
  const railPoints = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * TAU;
    const h = 3.65 + Math.sin(a * 2.1 + 0.4) * 1.1 + Math.cos(a * 3.2 - 0.5) * 0.95;
    return vec(Math.cos(a) * 8.55, Math.max(1.75, h), Math.sin(a) * 8.45);
  });
  const trackCurve = new THREE.CatmullRomCurve3(railPoints, true, 'catmullrom', 0.36);
  const trackLength = trackCurve.getLength();
  const coaster = new THREE.Group();
  coaster.name = '木质过山车';
  root.add(coaster);
  const railMat = mat(0xe3ac5f);
  const darkRail = mat(0xb78150);
  const railLeft = [];
  const railRight = [];
  const trackSamples = 265;
  for (let i = 0; i <= trackSamples; i++) {
    const a = i / trackSamples;
    const p = trackCurve.getPointAt(a);
    const tangent = trackCurve.getTangentAt(a);
    const normal = vec(-tangent.z, 0, tangent.x).normalize();
    railLeft.push(p.clone().addScaledVector(normal, 0.21));
    railRight.push(p.clone().addScaledVector(normal, -0.21));
  }
  add(coaster, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railLeft, false, 'centripetal'), trackSamples, 0.082, 4, false), railMat);
  add(coaster, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railRight, false, 'centripetal'), trackSamples, 0.082, 4, false), railMat);

  const sleepersCount = 115;
  const sleeperMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 0.12, 0.19), darkRail, sleepersCount);
  for (let i = 0; i < sleepersCount; i++) {
    const p = trackCurve.getPointAt(i / sleepersCount);
    const tangent = trackCurve.getTangentAt(i / sleepersCount);
    dummy.position.copy(p).add(vec(0, -0.11, 0));
    dummy.rotation.set(0, Math.atan2(tangent.x, tangent.z) + Math.PI / 2, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    sleeperMesh.setMatrixAt(i, dummy.matrix);
  }
  sleeperMesh.castShadow = true;
  coaster.add(sleeperMesh);

  const supportPoints = [];
  const supportCount = 46;
  for (let i = 0; i < supportCount; i++) {
    const t = i / supportCount;
    const p = trackCurve.getPointAt(t);
    supportPoints.push([p, i]);
  }
  const supportMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.10, 0.14, 1, 5), wood, supportPoints.length * 2);
  supportPoints.forEach(([p, i]) => {
    for (let side = 0; side < 2; side++) {
      const a = i / supportCount * TAU;
      const x = p.x + Math.cos(a) * (side ? -0.30 : 0.30);
      const z = p.z + Math.sin(a) * (side ? -0.30 : 0.30);
      dummy.position.set(x, p.y / 2, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, p.y, 1);
      dummy.updateMatrix();
      supportMesh.setMatrixAt(i * 2 + side, dummy.matrix);
    }
  });
  supportMesh.castShadow = true;
  coaster.add(supportMesh);

  const cars = [];
  const carColors = [mat(0xfa857e), mat(0xffd06b), mat(0x71cabc)];
  for (let i = 0; i < 3; i++) {
    const car = new THREE.Group();
    box(car, 0.54, 0.24, 0.86, carColors[i], 0, 0, 0);
    box(car, 0.60, 0.20, 0.24, cream, 0, 0.19, -0.35);
    box(car, 0.60, 0.20, 0.12, cream, 0, 0.18, 0.4);
    for (const side of [-1, 1]) {
      for (const z of [-0.25, 0.25]) {
        cylinder(car, 0.12, 0.12, 0.09, navy, side * 0.28, -0.2, z, 8).rotation.z = Math.PI / 2;
      }
    }
    box(car, 0.22, 0.25, 0.19, cream, 0, 0.42, 0.01);
    cars.push(car);
    coaster.add(car);
  }
  pickables.push({ object: coaster, id: 'coaster' });
  focusPoints.coaster = vec(0, 3.8, -0.4);
  let trainProgress = 0.08;
  const forward = vec(0, 0, 1);
  updates.push((time, delta, speed) => {
    trainProgress = (trainProgress + delta * (3.05 * speed) / trackLength) % 1;
    for (let i = 0; i < cars.length; i++) {
      const t = (trainProgress - i * 0.015 + 1) % 1;
      const p = trackCurve.getPointAt(t);
      const tangent = trackCurve.getTangentAt(t).normalize();
      cars[i].position.copy(p).add(vec(0, 0.25, 0));
      cars[i].quaternion.setFromUnitVectors(forward, tangent);
    }
  });

  // ---------------------------------------------------------------------
  // Voxel concessions, balloon cart, entrance, benches and small details.
  // ---------------------------------------------------------------------
  function kiosk(x, z, hue, rotation = 0) {
    const g = new THREE.Group();
    g.position.set(x, 0.12, z);
    g.rotation.y = rotation;
    root.add(g);
    box(g, 1.35, 1.2, 1.1, mat(0xf7e5c5), 0, 0.7, 0);
    box(g, 1.6, 0.17, 1.34, mat(hue), 0, 1.37, 0);
    box(g, 1.3, 0.48, 0.16, mat(0xfbf2d6), 0, 0.85, 0.63);
    box(g, 0.7, 0.28, 0.055, mat(0x74b9af), 0, 1.18, 0.69);
    for (let i = 0; i < 7; i++) {
      box(g, 0.17, 0.24, 1.32, i % 2 ? cream : mat(hue), -0.66 + i * 0.22, 1.50, 0);
    }
    box(g, 0.5, 0.48, 0.075, mat(0x997a68), -0.3, 0.35, 0.61);
    bulb(g, -0.45, 1.26, 0.72, 0.09);
    bulb(g, 0.45, 1.26, 0.72, 0.09);
  }
  kiosk(-2.8, 7.2, palette.coral, 0.18);
  kiosk(0.1, 7.65, palette.mint, 0);
  kiosk(3.0, 6.85, palette.yellow, -0.18);

  function bench(x, z, rotation) {
    const g = new THREE.Group();
    g.position.set(x, 0.22, z);
    g.rotation.y = rotation;
    root.add(g);
    for (const offset of [-0.36, 0.36]) {
      box(g, 0.085, 0.38, 0.09, navy, offset, 0.19, -0.1);
    }
    box(g, 0.98, 0.12, 0.38, wood, 0, 0.45, 0);
    box(g, 0.98, 0.42, 0.10, wood, 0, 0.72, -0.2);
  }
  [[-6.25, 1.6, -0.75], [6.4, -1.7, 0.55], [1.8, 5.8, 0.6], [-5.8, 5.8, -0.5], [5.2, 6.3, 0.15]].forEach(a => bench(...a));

  // Entrance arch with little floating flag.
  const entry = new THREE.Group();
  entry.position.set(0, 0.12, 8.5);
  root.add(entry);
  for (const x of [-1.35, 1.35]) box(entry, 0.24, 1.9, 0.32, coral, x, 0.97, 0);
  box(entry, 3.1, 0.46, 0.4, sunYellow, 0, 1.92, 0);
  sign(entry, 2.15, 0.25, 0x78b5b4, 0, 2.0, 0.26);
  bulb(entry, -1.20, 2.32, 0.15, 0.12);
  bulb(entry, 1.20, 2.32, 0.15, 0.12);

  // Lamps are instanced where possible. A few actual PointLights illuminate
  // the entire park at night, avoiding dozens of expensive shadowed lights.
  const lampPositions = [];
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * TAU;
    lampPositions.push([6.6 * Math.cos(a), 6.05 * Math.sin(a)]);
  }
  const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.065, 0.088, 1.75, 5), navy, lampPositions.length);
  const globes = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.18, 0), glowMaterial(0xffdf84), lampPositions.length);
  lampPositions.forEach(([x, z], i) => {
    dummy.position.set(x, 1.05, z);
    dummy.scale.setScalar(1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    poles.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, 2.04, z);
    dummy.updateMatrix();
    globes.setMatrixAt(i, dummy.matrix);
  });
  poles.castShadow = true;
  root.add(poles, globes);
  const nightLampCoords = [[-4.25, 3, -3.25], [2.1, 3, -1.85], [-3.35, 2.6, 3.75], [5.55, 3, 2.15], [0, 2.9, 7.5]];
  for (const [x, y, z] of nightLampCoords) {
    const light = new THREE.PointLight(0xffc778, 0, 7.2, 1.5);
    light.position.set(x, y, z);
    root.add(light);
    animatedLights.push(light);
  }

  // A few low-poly voxel clouds drift slowly through the lavender sky.
  const clouds = [];
  for (let i = 0; i < 3; i++) {
    const group = new THREE.Group();
    const x = [-13.4, 13.9, -11.2][i];
    const y = [8.5, 9.5, 11][i];
    const z = [-7.5, -9, 5.5][i];
    group.position.set(x, y, z);
    const cloudColor = mat(0xeef5ff, { transparent: true, opacity: 0.88 });
    [[0, 0, 0, 1.08], [-0.8, -0.12, 0.16, 0.68], [0.79, -0.13, 0.07, 0.77], [0.15, 0.35, -0.12, 0.72]].forEach(([cx, cy, cz, size]) => {
      add(group, new THREE.IcosahedronGeometry(size, 0), cloudColor, cx, cy, cz, false);
    });
    root.add(group);
    clouds.push({ group, originalX: x, phase: i * 2.1 });
  }
  updates.push((time) => clouds.forEach(({ group, originalX, phase }) => {
    group.position.x = originalX + Math.sin(time * 0.08 + phase) * 1.1;
  }));

  // ---------------------------------------------------------------------
  // Moving visitors: separate instanced meshes for bodies, heads and hats.
  // ---------------------------------------------------------------------
  const visitorLimit = 64;
  const bodyMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.23, 0.39, 0.21), cream, visitorLimit);
  const headMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.23, 0.22, 0.22), mat(0xf4c6aa), visitorLimit);
  const hatMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.27, 0.1, 0.27), cream, visitorLimit);
  const colors = [palette.coral, palette.yellow, palette.blue, palette.mint, palette.pink, palette.navy];
  const visitors = Array.from({ length: visitorLimit }, (_, i) => ({
    offset: random(), walkingSpeed: 0.005 + random() * 0.008,
    orbit: i % 3,
    direction: i % 5 === 0 ? -1 : 1,
  }));
  visitors.forEach((p, i) => {
    const color = new THREE.Color(colors[i % colors.length]);
    bodyMesh.setColorAt(i, color);
    hatMesh.setColorAt(i, new THREE.Color(colors[(i + 2) % colors.length]));
  });
  root.add(bodyMesh, headMesh, hatMesh);
  const innerVisitorCurve = new THREE.CatmullRomCurve3(
    Array.from({ length: 12 }, (_, i) => vec(3.1 * Math.cos(i / 12 * TAU), 0.28, 2.5 * Math.sin(i / 12 * TAU))), true,
  );
  const outerVisitorCurve = promenadeCurve;
  const visitorPaths = [outerVisitorCurve, innerVisitorCurve, innerVisitorCurve];
  let activeVisitorCount = 42;
  let lastVisitorTime = 0;

  function visitorUpdate(time, speed) {
    lastVisitorTime = time;
    bodyMesh.count = headMesh.count = hatMesh.count = activeVisitorCount;
    for (let i = 0; i < activeVisitorCount; i++) {
      const visitor = visitors[i];
      const curve = visitorPaths[visitor.orbit];
      const walkT = ((visitor.offset + time * visitor.walkingSpeed * speed * visitor.direction) % 1 + 1) % 1;
      const position = curve.getPointAt(walkT);
      const tangent = curve.getTangentAt(walkT);
      const yaw = Math.atan2(tangent.x * visitor.direction, tangent.z * visitor.direction);
      const bob = Math.sin(time * 10 * speed + i) * 0.018;
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.setScalar(1);
      dummy.position.set(position.x, 0.57 + bob, position.z);
      dummy.updateMatrix();
      bodyMesh.setMatrixAt(i, dummy.matrix);
      dummy.position.y = 0.91 + bob;
      dummy.updateMatrix();
      headMesh.setMatrixAt(i, dummy.matrix);
      dummy.position.y = 1.07 + bob;
      dummy.updateMatrix();
      hatMesh.setMatrixAt(i, dummy.matrix);
    }
    bodyMesh.instanceMatrix.needsUpdate = true;
    headMesh.instanceMatrix.needsUpdate = true;
    hatMesh.instanceMatrix.needsUpdate = true;
  }
  visitorUpdate(0, 1);
  updates.push((time, delta, speed) => visitorUpdate(time, speed));

  function setVisitorCount(count) {
    activeVisitorCount = THREE.MathUtils.clamp(Math.round(count), 8, visitorLimit);
    visitorUpdate(lastVisitorTime, 1);
  }

  function setNight(night) {
    for (const material of bulbMaterials) material.emissiveIntensity = night ? 2.2 : 0.15;
    for (const light of animatedLights) light.intensity = night ? 7 : 0;
  }

  function update(elapsed, delta, speed) {
    for (const callback of updates) callback(elapsed, delta, speed);
  }

  return {
    root, update, setNight, setVisitorCount, focusPoints, pickables,
    get visitorCount() { return activeVisitorCount; },
  };
}
