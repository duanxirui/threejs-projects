/**
 * Prepare the Khronos CarConcept CC-BY model for the independent demo.
 *
 * The source model contains Khronos marks on a licence plate and steering
 * emblem. The marks are excluded from the model's CC-BY license, so this
 * script disables those display meshes and replaces the logo image bytes.
 * Geometry and all other textures remain identical to the source.
 *
 * Usage:
 *   node scripts/prepare-car-concept.mjs SOURCE.glb DESTINATION.glb
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';

const SOURCE_SHA256 = 'c272098089d78c5cd9fd9f24ff50ee8acf8d932c55f2d55fc10adb6c8998966b';
const GLTF_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const value of bytes) {
    crc ^= value;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const name = Buffer.from(type, 'ascii');
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  name.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(chunk.subarray(4, 8 + data.length)), 8 + data.length);
  return chunk;
}

function opaqueBlackPng() {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(1, 0);
  header.writeUInt32BE(1, 4);
  header[8] = 8; // bits per channel
  header[9] = 6; // RGBA
  const pixel = Buffer.from([0, 0, 0, 0, 255]); // filter, R, G, B, A
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(pixel)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function align4(length) {
  return (length + 3) & ~3;
}

function readGlb(source) {
  if (source.readUInt32LE(0) !== GLTF_MAGIC || source.readUInt32LE(4) !== 2) {
    throw new Error('Source is not a glTF 2.0 GLB');
  }
  if (source.readUInt32LE(8) !== source.length) {
    throw new Error('GLB header length does not match source size');
  }
  const jsonLength = source.readUInt32LE(12);
  if (source.readUInt32LE(16) !== JSON_CHUNK) {
    throw new Error('Missing GLB JSON chunk');
  }
  const binaryHeader = 20 + jsonLength;
  const binaryLength = source.readUInt32LE(binaryHeader);
  if (source.readUInt32LE(binaryHeader + 4) !== BIN_CHUNK) {
    throw new Error('Missing GLB binary chunk');
  }
  if (binaryHeader + 8 + binaryLength !== source.length) {
    throw new Error('Invalid GLB chunk lengths');
  }
  return {
    json: JSON.parse(source.subarray(20, binaryHeader).toString('utf8')),
    binary: source.subarray(binaryHeader + 8),
  };
}

function packGlb(json, binary) {
  const rawJson = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonBuffer = Buffer.alloc(align4(rawJson.length), 0x20);
  rawJson.copy(jsonBuffer);
  const binBuffer = Buffer.alloc(align4(binary.length));
  binary.copy(binBuffer);
  const output = Buffer.alloc(12 + 8 + jsonBuffer.length + 8 + binBuffer.length);
  output.writeUInt32LE(GLTF_MAGIC, 0);
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(output.length, 8);
  output.writeUInt32LE(jsonBuffer.length, 12);
  output.writeUInt32LE(JSON_CHUNK, 16);
  jsonBuffer.copy(output, 20);
  const binHeader = 20 + jsonBuffer.length;
  output.writeUInt32LE(binBuffer.length, binHeader);
  output.writeUInt32LE(BIN_CHUNK, binHeader + 4);
  binBuffer.copy(output, binHeader + 8);
  return output;
}

async function main() {
  const [input, output] = process.argv.slice(2);
  if (!input || !output || resolve(input) === resolve(output)) {
    throw new Error('Usage: node scripts/prepare-car-concept.mjs SOURCE.glb DESTINATION.glb (distinct paths)');
  }
  const source = await readFile(input);
  const sha = createHash('sha256').update(source).digest('hex');
  if (sha !== SOURCE_SHA256) {
    throw new Error(`Unexpected source SHA-256 ${sha}. Review the new upstream version first.`);
  }

  const { json, binary } = readGlb(source);
  const logoMaterial = json.materials.findIndex((material) => material.name === 'License');
  if (logoMaterial < 0) throw new Error('Expected License material was not found');
  const logoTextureIndex = json.materials[logoMaterial].pbrMetallicRoughness?.baseColorTexture?.index;
  const logoImageIndex = json.textures[logoTextureIndex]?.source;
  const logoBufferView = json.images[logoImageIndex]?.bufferView;
  if (logoImageIndex !== 3 || logoBufferView === undefined) {
    throw new Error('Unexpected trademark logo texture layout');
  }

  const blockedNames = new Set(['License Plate', 'InteriorSteeringEmblem']);
  const detached = [];
  for (const node of json.nodes) {
    if (!blockedNames.has(node.name)) continue;
    if (node.mesh === undefined) throw new Error(`${node.name} has no mesh to remove`);
    delete node.mesh;
    detached.push(node.name);
  }
  if (detached.length !== blockedNames.size) {
    throw new Error('One or more trademark-bearing nodes were not found');
  }

  const neutral = opaqueBlackPng();
  const pieces = [];
  let offset = 0;
  for (const [index, view] of json.bufferViews.entries()) {
    const data = index === logoBufferView
      ? neutral
      : binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength);
    if (data.length === 0) throw new Error(`Empty buffer view ${index}`);
    const aligned = Buffer.alloc(align4(data.length));
    data.copy(aligned);
    pieces.push(aligned);
    view.byteOffset = offset;
    view.byteLength = data.length;
    offset += aligned.length;
  }
  const preparedBinary = Buffer.concat(pieces);
  json.buffers[0].byteLength = preparedBinary.length;
  json.asset.extras = {
    ...json.asset.extras,
    sourceSha256: SOURCE_SHA256,
    preparedFor: 'CAR ATELIER technical demonstration',
    modifications: 'Khronos mark image replaced with a neutral pixel; license plate and steering emblem meshes disabled.',
  };

  const prepared = packGlb(json, preparedBinary);
  const reparsed = readGlb(prepared);
  if (reparsed.json.buffers[0].byteLength !== reparsed.binary.length) {
    throw new Error('Prepared GLB buffer length validation failed');
  }
  await mkdir(dirname(resolve(output)), { recursive: true });
  await writeFile(output, prepared);
  const preparedHash = createHash('sha256').update(prepared).digest('hex');
  process.stdout.write(JSON.stringify({
    output: resolve(output),
    bytes: prepared.length,
    sha256: preparedHash,
    disabledMeshes: detached,
    replacedImageIndex: logoImageIndex,
  }, null, 2) + '\n');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
