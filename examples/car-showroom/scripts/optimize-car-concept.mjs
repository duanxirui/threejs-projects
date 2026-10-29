/**
 * Losslessly compress Car Concept geometry with EXT_meshopt_compression.
 *
 * This deliberately keeps the 3 original KHR_materials_variants mappings,
 * complete PBR materials, textures and geometry unchanged after decoding.
 *
 * Usage:
 *   node scripts/optimize-car-concept.mjs CLEAN.glb COMPRESSED.glb
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';

const SOURCE_SHA256 = '1bf17df84aa9eeb8e30139dcd4f58b755c9d1f47a647d2792849d67996c73ad2';
const MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;
const EXTENSION = 'EXT_meshopt_compression';
const align4 = (size) => (size + 3) & ~3;
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

function readGLB(data) {
  if (data.readUInt32LE(0) !== MAGIC || data.readUInt32LE(4) !== 2) {
    throw new Error('Expected a glTF 2.0 GLB file');
  }
  if (data.readUInt32LE(8) !== data.length || data.readUInt32LE(16) !== JSON_CHUNK) {
    throw new Error('Invalid GLB header');
  }
  const jsonLength = data.readUInt32LE(12);
  const binaryHeader = 20 + jsonLength;
  if (data.readUInt32LE(binaryHeader + 4) !== BIN_CHUNK) {
    throw new Error('Missing GLB binary chunk');
  }
  const binLength = data.readUInt32LE(binaryHeader);
  if (binaryHeader + 8 + binLength !== data.length) {
    throw new Error('Invalid GLB binary length');
  }
  return {
    json: JSON.parse(data.subarray(20, binaryHeader).toString('utf8')),
    binary: data.subarray(binaryHeader + 8),
  };
}

function packGLB(json, binary) {
  const rawJSON = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonChunk = Buffer.alloc(align4(rawJSON.length), 0x20);
  rawJSON.copy(jsonChunk);
  const binChunk = Buffer.alloc(align4(binary.length));
  binary.copy(binChunk);
  const output = Buffer.alloc(12 + 8 + jsonChunk.length + 8 + binChunk.length);
  output.writeUInt32LE(MAGIC, 0);
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(output.length, 8);
  output.writeUInt32LE(jsonChunk.length, 12);
  output.writeUInt32LE(JSON_CHUNK, 16);
  jsonChunk.copy(output, 20);
  const binHeader = 20 + jsonChunk.length;
  output.writeUInt32LE(binChunk.length, binHeader);
  output.writeUInt32LE(BIN_CHUNK, binHeader + 4);
  binChunk.copy(output, binHeader + 8);
  return output;
}

function accessorUsage(json) {
  const usage = new Map();
  const add = (accessorIndex, kind) => {
    if (accessorIndex === undefined) return;
    const accessor = json.accessors[accessorIndex];
    if (accessor.bufferView === undefined || accessor.sparse) {
      throw new Error('Sparse or missing bufferView accessor is not supported');
    }
    const existing = usage.get(accessor.bufferView);
    if (existing && existing.kind !== kind) {
      throw new Error('BufferView is shared by both attributes and indices');
    }
    usage.set(accessor.bufferView, {
      kind,
      componentType: accessor.componentType,
    });
  };
  for (const mesh of json.meshes) {
    for (const primitive of mesh.primitives) {
      add(primitive.indices, 'indices');
      for (const index of Object.values(primitive.attributes ?? {})) add(index, 'attributes');
      for (const target of primitive.targets ?? []) {
        for (const index of Object.values(target)) add(index, 'attributes');
      }
    }
  }
  return usage;
}

function append(parts, value) {
  const bytes = Buffer.from(value);
  const aligned = Buffer.alloc(align4(bytes.length));
  bytes.copy(aligned);
  parts.push(aligned);
  return aligned.length;
}

async function main() {
  const [sourcePath, outputPath] = process.argv.slice(2);
  if (!sourcePath || !outputPath || resolve(sourcePath) === resolve(outputPath)) {
    throw new Error('Usage: node scripts/optimize-car-concept.mjs CLEAN.glb COMPRESSED.glb');
  }
  const source = await readFile(sourcePath);
  if (sha256(source) !== SOURCE_SHA256) {
    throw new Error('Source does not match the recorded, trademark-cleaned GLB SHA-256');
  }
  const { json, binary } = readGLB(source);
  if (json.buffers.length !== 1) throw new Error('Expected one source GLB buffer');
  if (json.extensionsRequired?.includes(EXTENSION)) throw new Error('Already compressed GLB');

  const usage = accessorUsage(json);
  const outputParts = [];
  let outputOffset = 0;
  let fallbackLength = 0;
  let compressedViews = 0;
  let geometryInputBytes = 0;
  let geometryOutputBytes = 0;
  await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);

  for (const [index, view] of json.bufferViews.entries()) {
    if (view.buffer !== 0) throw new Error('Unexpected source buffer index');
    const offset = view.byteOffset ?? 0;
    const sourceBytes = binary.subarray(offset, offset + view.byteLength);
    if (sourceBytes.length !== view.byteLength) {
      throw new Error('BufferView ' + index + ' is outside the binary chunk');
    }
    const entry = usage.get(index);
    const stride = entry?.kind === 'indices'
      ? (entry.componentType === 5123 ? 2 : entry.componentType === 5125 ? 4 : 0)
      : view.byteStride;
    const compressible = entry
      && stride > 0
      && view.byteLength % stride === 0
      && (entry.kind === 'indices' || stride % 4 === 0);

    if (compressible) {
      const count = view.byteLength / stride;
      // TRIANGLES may cyclically rotate indices within a face. INDICES keeps
      // the index sequence byte-identical, so round-trip hashes stay stable.
      const mode = entry.kind === 'indices' ? 'INDICES' : 'ATTRIBUTES';
      const compressed = MeshoptEncoder.encodeGltfBuffer(
        new Uint8Array(sourceBytes), count, stride, mode,
      );
      geometryInputBytes += sourceBytes.length;
      geometryOutputBytes += compressed.length;

      // The encoder and decoder must agree bit-for-bit before shipping.
      const decoded = new Uint8Array(sourceBytes.length);
      MeshoptDecoder.decodeGltfBuffer(
        decoded, count, stride, compressed, mode, 'NONE',
      );
      if (!Buffer.from(decoded).equals(sourceBytes)) {
        throw new Error('Meshopt round-trip mismatch in BufferView ' + index);
      }

      // GLB buffer 0 stores only compressed data and uncompressed images.
      // Buffer 1 is the spec-sanctioned placeholder for required compression.
      view.buffer = 1;
      view.byteOffset = fallbackLength;
      fallbackLength += align4(view.byteLength);
      view.extensions = {
        ...view.extensions,
        [EXTENSION]: {
          buffer: 0,
          byteOffset: outputOffset,
          byteLength: compressed.length,
          byteStride: stride,
          count,
          mode,
          filter: 'NONE',
        },
      };
      outputOffset += append(outputParts, compressed);
      compressedViews += 1;
    } else {
      view.byteOffset = outputOffset;
      outputOffset += append(outputParts, sourceBytes);
    }
  }

  if (compressedViews === 0) throw new Error('No compatible geometry bufferViews');
  const outputBinary = Buffer.concat(outputParts);
  json.buffers = [
    { byteLength: outputBinary.length },
    { byteLength: fallbackLength, extensions: { [EXTENSION]: { fallback: true } } },
  ];
  json.extensionsUsed = [...new Set([...(json.extensionsUsed ?? []), EXTENSION])];
  json.extensionsRequired = [...new Set([...(json.extensionsRequired ?? []), EXTENSION])];
  json.asset.extras = {
    ...json.asset.extras,
    meshoptSourceSha256: SOURCE_SHA256,
    meshoptMode: 'lossless geometry, filter NONE',
  };

  const output = packGLB(json, outputBinary);
  const parsed = readGLB(output);
  if (parsed.json.buffers[0].byteLength !== parsed.binary.length) {
    throw new Error('Output GLB buffer size mismatch');
  }
  await mkdir(dirname(resolve(outputPath)), { recursive: true });
  await writeFile(outputPath, output);
  console.log(JSON.stringify({
    output: resolve(outputPath),
    originalBytes: source.length,
    compressedBytes: output.length,
    reductionPercent: Number((100 * (1 - output.length / source.length)).toFixed(1)),
    geometryInputBytes,
    geometryOutputBytes,
    compressedViews,
    sha256: sha256(output),
    variants: parsed.json.extensions.KHR_materials_variants.variants.map((entry) => entry.name),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
