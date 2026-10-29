import {
  BufferGeometry,
  FileLoader,
  LineSegments,
  Material,
  Mesh,
  Object3D,
  Texture,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type { CarConfig, LoadProgress } from '../types/car';
import { createConceptCar } from './ConceptCar';
import { MaterialVariants } from './MaterialVariants';

export interface LoadedCar {
  root: Object3D;
  variants: MaterialVariants | null;
}

const textureSlots = [
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'aoMap',
  'emissiveMap',
  'alphaMap',
  'bumpMap',
  'displacementMap',
  'clearcoatMap',
  'clearcoatNormalMap',
  'clearcoatRoughnessMap',
  'transmissionMap',
  'thicknessMap',
  'iridescenceMap',
  'iridescenceThicknessMap',
  'sheenColorMap',
  'sheenRoughnessMap',
  'specularIntensityMap',
  'specularColorMap',
  'anisotropyMap',
] as const;

/** 仅清理车辆自身持有的资源，不清理展厅公用的环境贴图。 */
export function disposeCar(root: Object3D, additionalMaterials: Iterable<Material> = []): void {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();

  root.traverse((node) => {
    if (!(node instanceof Mesh) && !(node instanceof LineSegments)) return;
    geometries.add(node.geometry);
    const meshMaterials = Array.isArray(node.material) ? node.material : [node.material];
    meshMaterials.forEach((material) => {
      materials.add(material);
      const record = material as unknown as Record<string, unknown>;
      for (const key of textureSlots) {
        const texture = record[key];
        if (texture instanceof Texture) textures.add(texture);
      }
    });
  });

  // Materials loaded for other glTF variants may not be active in the scene.
  for (const material of additionalMaterials) {
    materials.add(material);
    const record = material as unknown as Record<string, unknown>;
    for (const key of textureSlots) {
      const texture = record[key];
      if (texture instanceof Texture) textures.add(texture);
    }
  }
  // GLTFLoader may decode PNG/JPEG sources as ImageBitmap objects. Releasing
  // WebGL textures does not close those CPU-side bitmaps automatically.
  const bitmaps = new Set<ImageBitmap>();
  textures.forEach((texture) => {
    const image: unknown = texture.source.data;
    if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
      bitmaps.add(image);
    }
    texture.dispose();
  });
  bitmaps.forEach((bitmap) => bitmap.close());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}

// Keep at most one or two compressed assets in memory, never decoded meshes.
// Each return to a model still creates fresh materials and geometry, allowing
// the previous car's WebGL resources to be fully released.
const MAX_BUFFER_CACHE_BYTES = 16 * 1024 * 1024;

export class CarLoader {
  private readonly loader = new GLTFLoader();
  private readonly fileLoader = new FileLoader();
  private readonly buffers = new Map<string, ArrayBuffer>();
  private readonly downloads = new Map<string, Promise<ArrayBuffer>>();
  private cachedBytes = 0;
  private disposed = false;

  constructor() {
    this.loader.setMeshoptDecoder(MeshoptDecoder);
    this.fileLoader.setResponseType('arraybuffer');
  }

  private remember(url: string, data: ArrayBuffer): void {
    if (this.disposed || data.byteLength > MAX_BUFFER_CACHE_BYTES) return;
    const previous = this.buffers.get(url);
    if (previous) {
      this.cachedBytes -= previous.byteLength;
      this.buffers.delete(url);
    }
    while (this.cachedBytes + data.byteLength > MAX_BUFFER_CACHE_BYTES) {
      const oldest = this.buffers.keys().next().value as string | undefined;
      if (oldest === undefined) break;
      this.cachedBytes -= this.buffers.get(oldest)!.byteLength;
      this.buffers.delete(oldest);
    }
    this.buffers.set(url, data);
    this.cachedBytes += data.byteLength;
  }

  private async readBytes(
    url: string,
    onProgress?: (progress: LoadProgress) => void,
  ): Promise<ArrayBuffer> {
    const cached = this.buffers.get(url);
    if (cached) {
      this.buffers.delete(url);
      this.buffers.set(url, cached);
      onProgress?.({ loaded: cached.byteLength, total: cached.byteLength });
      return cached;
    }

    const pending = this.downloads.get(url);
    if (pending) {
      const data = await pending;
      onProgress?.({ loaded: data.byteLength, total: data.byteLength });
      return data;
    }

    const download = (this.fileLoader.loadAsync(url, (event) => {
      onProgress?.({
        loaded: event.loaded,
        total: event.total > 0 ? event.total : undefined,
      });
    }) as Promise<ArrayBuffer>)
      .then((data) => {
        if (!(data instanceof ArrayBuffer)) {
          throw new Error('3D 模型资源不是有效的二进制数据。');
        }
        this.remember(url, data);
        return data;
      })
      .finally(() => this.downloads.delete(url));
    this.downloads.set(url, download);
    return download;
  }

  async load(
    car: CarConfig,
    onProgress?: (progress: LoadProgress) => void,
  ): Promise<LoadedCar> {
    if (this.disposed) throw new Error('车辆加载器已关闭。');
    if (car.modelKind === 'procedural') {
      onProgress?.({ loaded: 1, total: 1 });
      return { root: createConceptCar(), variants: null };
    }

    if (!car.modelUrl) {
      throw new Error('尚未配置该车型的 GLB/glTF 文件路径。');
    }

    const bytes = await this.readBytes(car.modelUrl, onProgress);
    const absoluteUrl = new URL(car.modelUrl, document.baseURI);
    const resourcePath = new URL('.', absoluteUrl).href;
    const gltf = await this.loader.parseAsync(bytes, resourcePath);

    try {
      gltf.scene.traverse((node) => {
        if (node instanceof Mesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      const variants = await MaterialVariants.fromGLTF(gltf);
      return { root: gltf.scene, variants };
    } catch (error) {
      disposeCar(gltf.scene);
      throw error;
    }
  }

  dispose(): void {
    this.disposed = true;
    this.buffers.clear();
    this.cachedBytes = 0;
  }
}
