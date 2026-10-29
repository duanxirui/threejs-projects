import {
  ACESFilmicToneMapping,
  Box3,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  PCFSoftShadowMap,
  Object3D,
} from 'three';
import type { CameraView, CarConfig, LoadProgress } from '../types/car';
import { CameraController } from './CameraController';
import { CarLoader, disposeCar } from './CarLoader';
import { installLighting } from './Lighting';
import type { MaterialVariants } from './MaterialVariants';

export class Showroom {
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(38, 1, 0.1, 150);
  private readonly renderer: WebGLRenderer;
  private readonly cameraController: CameraController;
  private readonly carLoader = new CarLoader();
  private readonly resizeObserver: ResizeObserver;
  private readonly disposeLighting: () => void;
  private carRoot: Object3D | null = null;
  private materialVariants: MaterialVariants | null = null;
  private activeCar: CarConfig | null = null;
  private requestId = 0;
  private frameId: number | null = null;
  private disposed = false;
  private sceneDirty = true;
  private readonly invalidate = (): void => {
    this.sceneDirty = true;
  };

  constructor(private readonly container: HTMLElement) {
    const isMobile = window.matchMedia('(max-width: 720px)').matches;
    this.renderer = new WebGLRenderer({
      antialias: !isMobile,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.35 : 2));
    this.renderer.domElement.setAttribute('aria-label', '可旋转的三维车辆展示');
    this.container.appendChild(this.renderer.domElement);

    this.disposeLighting = installLighting(this.scene, this.renderer, isMobile);
    this.cameraController = new CameraController(this.camera, this.renderer.domElement);
    this.cameraController.controls.addEventListener('change', this.invalidate);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
    this.resize();

    document.addEventListener('visibilitychange', this.handleVisibility);
    this.start();
  }

  async loadCar(
    car: CarConfig,
    onProgress?: (progress: LoadProgress) => void,
  ): Promise<void> {
    const requestId = ++this.requestId;
    const next = await this.carLoader.load(car, onProgress);
    const nextRoot = next.root;

    // 快速切换车型时，晚到的旧请求不能覆盖当前车辆。
    if (requestId !== this.requestId || this.disposed) {
      disposeCar(nextRoot, next.variants?.extraMaterials);
      return;
    }

    try {
      if (car.scale !== undefined) nextRoot.scale.setScalar(car.scale);
      if (car.rotationY !== undefined) nextRoot.rotation.y = car.rotationY;

      let bounds = new Box3().setFromObject(nextRoot);
      if (bounds.isEmpty()) throw new Error('该模型没有可显示的几何体。');

      const center = bounds.getCenter(new Vector3());
      nextRoot.position.add(new Vector3(-center.x, 0.035 - bounds.min.y, -center.z));
      bounds = new Box3().setFromObject(nextRoot);

      const previous = this.carRoot;
      const previousVariants = this.materialVariants;
      this.scene.add(nextRoot);
      this.carRoot = nextRoot;
      this.materialVariants = next.variants;
      this.activeCar = car;
      if (previous) {
        this.scene.remove(previous);
        disposeCar(previous, previousVariants?.extraMaterials);
      }
      this.cameraController.frame(bounds, car);
      this.invalidate();
    } catch (error) {
      disposeCar(nextRoot, next.variants?.extraMaterials);
      throw error;
    }
  }

  setView(view: CameraView): void {
    this.cameraController.setView(view);
    this.invalidate();
  }

  setMaterialVariant(name: string): boolean {
    const changed = this.materialVariants?.apply(name) ?? false;
    if (changed) this.invalidate();
    return changed;
  }

  setPaintColor(color: string): boolean {
    if (!this.carRoot || !this.activeCar) return false;
    const names = new Set(this.activeCar.paintMaterialNames ?? []);
    if (names.size === 0) return false;

    let changed = false;
    this.carRoot.traverse((node) => {
      if (!(node instanceof Mesh)) return;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      for (const material of materials) {
        if (material instanceof MeshStandardMaterial && names.has(material.name)) {
          material.color.set(color);
          changed = true;
        }
      }
    });
    if (changed) this.invalidate();
    return changed;
  }

  private resize(): void {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    const previousAspect = this.camera.aspect;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.invalidate();
    if (this.carRoot && this.activeCar && Math.abs(previousAspect - this.camera.aspect) > 0.15) {
      this.cameraController.frame(new Box3().setFromObject(this.carRoot), this.activeCar);
    }
  }

  private readonly render = (): void => {
    if (this.disposed) return;
    this.frameId = requestAnimationFrame(this.render);
    this.cameraController.update();
    // Lighting and vehicles are static. OrbitControls' change event marks
    // camera movement, including drag, damping and animated camera presets.
    if (this.sceneDirty) {
      this.renderer.render(this.scene, this.camera);
      this.sceneDirty = false;
    }
  };

  private start(): void {
    if (this.frameId !== null || this.disposed) return;
    this.frameId = requestAnimationFrame(this.render);
  }

  private stop(): void {
    if (this.frameId === null) return;
    cancelAnimationFrame(this.frameId);
    this.frameId = null;
  }

  private readonly handleVisibility = (): void => {
    if (document.hidden) this.stop();
    else {
      this.invalidate();
      this.start();
    }
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.requestId++;
    this.stop();
    this.resizeObserver.disconnect();
    document.removeEventListener('visibilitychange', this.handleVisibility);
    this.cameraController.controls.removeEventListener('change', this.invalidate);
    this.cameraController.dispose();
    if (this.carRoot) {
      this.scene.remove(this.carRoot);
      disposeCar(this.carRoot, this.materialVariants?.extraMaterials);
      this.carRoot = null;
      this.materialVariants = null;
    }
    this.disposeLighting();
    this.carLoader.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
