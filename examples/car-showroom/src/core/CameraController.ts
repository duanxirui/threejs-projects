import { Box3, PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { CameraView, CarConfig } from '../types/car';

interface CameraTransition {
  from: Vector3;
  to: Vector3;
  start: number;
  duration: number;
}

const defaultDirections: Record<CameraView, [number, number, number]> = {
  default: [1, 0.43, 1.05],
  front: [0, 0.22, 1],
  side: [1, 0.2, 0],
  rear: [0, 0.22, -1],
};

const portraitDirection: [number, number, number] = [0.12, 0.32, 1];

export class CameraController {
  readonly controls: OrbitControls;
  private readonly camera: PerspectiveCamera;
  private readonly focus = new Vector3(0, 0.9, 0);
  private distance = 8.5;
  private readonly boundsSize = new Vector3(2.4, 1.8, 4.8);
  private transition: CameraTransition | null = null;
  private presets: CarConfig['cameraPresets'] = undefined;
  private readonly reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(camera: PerspectiveCamera, canvas: HTMLCanvasElement) {
    this.camera = camera;
    this.camera.position.set(5.8, 3.5, 7.5);
    this.controls = new OrbitControls(camera, canvas);
    this.controls.target.copy(this.focus);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.enablePan = false;
    this.controls.minDistance = 3.5;
    this.controls.maxDistance = 20;
    this.controls.minPolarAngle = 0.28;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.update();
    this.controls.addEventListener('start', () => {
      this.transition = null;
    });
  }

  frame(bounds: Box3, car: CarConfig): void {
    const size = bounds.getSize(new Vector3());
    this.boundsSize.copy(size);
    const center = bounds.getCenter(new Vector3());
    this.focus.copy(center);
    this.focus.y = center.y + size.y * 0.06;
    this.presets = car.cameraPresets;

    this.distance = this.fitDistance(this.viewDirection('default'));
    this.controls.minDistance = Math.max(2.5, this.distance * 0.45);
    this.controls.maxDistance = Math.max(28, this.distance * 3);
    this.controls.target.copy(this.focus);
    this.setView('default', true);
  }

  setView(view: CameraView, immediate = false): void {
    const direction = this.viewDirection(view);
    direction.multiplyScalar(this.fitDistance(direction));
    const destination = this.focus.clone().add(direction);

    if (immediate || this.reduceMotion) {
      this.transition = null;
      this.camera.position.copy(destination);
      this.controls.target.copy(this.focus);
      this.controls.update();
      return;
    }

    this.transition = {
      from: this.camera.position.clone(),
      to: destination,
      start: performance.now(),
      duration: 650,
    };
  }

  private viewDirection(view: CameraView): Vector3 {
    const vector = this.presets?.[view]
      ?? (view === 'default' && this.camera.aspect < 0.9
        ? portraitDirection
        : defaultDirections[view]);
    return new Vector3(...vector).normalize();
  }

  private fitDistance(direction: Vector3): number {
    const halfFovTangent = Math.tan((this.camera.fov * Math.PI) / 360);
    const horizontal = new Vector3(direction.x, 0, direction.z).normalize();
    const projectedWidth =
      Math.abs(horizontal.z) * this.boundsSize.x
      + Math.abs(horizontal.x) * this.boundsSize.z;
    const projectedHeight = this.boundsSize.y
      + Math.max(this.boundsSize.x, this.boundsSize.z) * Math.abs(direction.y) * 0.45;
    const widthDistance =
      (projectedWidth / (2 * halfFovTangent * this.camera.aspect)) * 1.3;
    const heightDistance = (projectedHeight / (2 * halfFovTangent)) * 1.2;
    return Math.max(6.4, widthDistance, heightDistance);
  }

  update(): void {
    if (this.transition) {
      const elapsed = (performance.now() - this.transition.start) / this.transition.duration;
      const t = Math.max(0, Math.min(1, elapsed));
      const eased = 1 - Math.pow(1 - t, 3);
      this.camera.position.lerpVectors(this.transition.from, this.transition.to, eased);
      if (t >= 1) this.transition = null;
    }
    this.controls.update();
  }

  dispose(): void {
    this.controls.dispose();
  }
}
