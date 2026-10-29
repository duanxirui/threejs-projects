import { Material, Mesh, Object3D } from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';

interface VariantMapping {
  material: number;
  variants: number[];
}

interface VariantPrimitive {
  extensions?: {
    KHR_materials_variants?: {
      mappings?: VariantMapping[];
    };
  };
}

interface VariantEntry {
  mesh: Mesh;
  initial: Material;
  alternatives: Map<number, Material>;
}

/**
 * Preserve all glTF material variants without cloning or downloading the GLB
 * again. The parser finalizes each material once for the target mesh geometry,
 * just as GLTFLoader does for its initial material.
 */
export class MaterialVariants {
  readonly names: readonly string[];
  readonly extraMaterials = new Set<Material>();
  private readonly entries: VariantEntry[];

  private constructor(names: string[], entries: VariantEntry[], materials: Set<Material>) {
    this.names = names;
    this.entries = entries;
    this.extraMaterials = materials;
  }

  static async fromGLTF(gltf: GLTF): Promise<MaterialVariants | null> {
    const json = gltf.parser.json;
    const variantDefs = json.extensions?.KHR_materials_variants?.variants as
      | Array<{ name: string }>
      | undefined;
    if (!Array.isArray(variantDefs) || variantDefs.length === 0) return null;

    const names = variantDefs.map((entry) => entry.name);
    const candidates: Array<{ mesh: Mesh; mappings: VariantMapping[] }> = [];
    const indices = new Set<number>();

    gltf.scene.traverse((object: Object3D) => {
      if (!(object instanceof Mesh)) return;
      const association = gltf.parser.associations.get(object);
      if (association?.meshes === undefined) return;
      const primitiveIndex = (association as { primitives?: number }).primitives ?? 0;
      const primitive = json.meshes[association.meshes]?.primitives?.[primitiveIndex] as
        | VariantPrimitive
        | undefined;
      const mappings = primitive?.extensions?.KHR_materials_variants?.mappings;
      if (!Array.isArray(mappings) || mappings.length === 0) return;

      candidates.push({ mesh: object, mappings });
      for (const mapping of mappings) indices.add(mapping.material);
    });

    if (candidates.length === 0) return null;

    // Resolve each glTF material once; multiple body parts reuse the same asset.
    const materialIndices = [...indices];
    const resolvedMaterials = await Promise.all(
      materialIndices.map((index) => gltf.parser.getDependency('material', index) as Promise<Material>),
    );
    const materials = new Map<number, Material>();
    for (let i = 0; i < materialIndices.length; i += 1) {
      materials.set(materialIndices[i], resolvedMaterials[i]);
    }
    const extraMaterials = new Set<Material>(resolvedMaterials);
    const entries: VariantEntry[] = [];

    for (const { mesh, mappings } of candidates) {
      if (Array.isArray(mesh.material)) {
        throw new Error('Material variants require one material per GLTF primitive');
      }
      const initial = mesh.material;
      const alternatives = new Map<number, Material>();
      for (const mapping of mappings) {
        const sourceMaterial = materials.get(mapping.material);
        if (!sourceMaterial) throw new Error('Missing variant material ' + mapping.material);

        // Mirrors GLTFLoader's own geometry-sensitive material finalization.
        mesh.material = sourceMaterial;
        gltf.parser.assignFinalMaterial(mesh);
        extraMaterials.add(mesh.material);
        for (const variantIndex of mapping.variants) {
          if (variantIndex < 0 || variantIndex >= names.length) {
            throw new Error('Invalid glTF variant index ' + variantIndex);
          }
          alternatives.set(variantIndex, mesh.material);
        }
      }
      mesh.material = initial;
      entries.push({ mesh, initial, alternatives });
    }

    return new MaterialVariants(names, entries, extraMaterials);
  }

  apply(name: string): boolean {
    const index = this.names.indexOf(name);
    if (index < 0) return false;
    for (const entry of this.entries) {
      entry.mesh.material = entry.alternatives.get(index) ?? entry.initial;
    }
    return true;
  }
}
