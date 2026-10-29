export type CameraView = 'default' | 'front' | 'side' | 'rear';
export type LocalizedText = string | { zh: string; en: string };

export interface MaterialVariantChoice {
  name: string;
  label: LocalizedText;
  swatch: string;
}

export interface CarConfig {
  id: string;
  brand: string;
  name: string;
  designation: LocalizedText;
  description: LocalizedText;
  modelUrl: string | null;
  modelKind: 'procedural' | 'gltf';
  scale?: number;
  rotationY?: number;
  paintMaterialNames?: string[];
  materialVariants?: readonly MaterialVariantChoice[];
  cameraPresets?: Partial<Record<CameraView, [number, number, number]>>;
  attribution?: LocalizedText;
  sourceUrl?: string;
  licenseUrl?: string;
}

export interface LoadProgress {
  loaded: number;
  total?: number;
}
