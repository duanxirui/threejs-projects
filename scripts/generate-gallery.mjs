import { copyFile, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateExample } from './validate-examples.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

/**
 * T04 can supply a comma-separated list of successfully built case slugs.
 * An explicitly empty list means no cases were built and none can be linked.
 */
function allowedBuilds() {
  if (!Object.hasOwn(process.env, 'GALLERY_BUILDABLE_SLUGS')) return null;
  const allowed = new Set(process.env.GALLERY_BUILDABLE_SLUGS.split(',').filter(Boolean));
  for (const slug of allowed) {
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error(`无效的 GALLERY_BUILDABLE_SLUGS 条目：${slug}`);
    }
  }
  return allowed;
}

async function generateGallery({ projectRoot = root, buildableSlugs = allowedBuilds() } = {}) {
  const examplesRoot = path.join(projectRoot, 'examples');
  const galleryRoot = path.join(projectRoot, 'apps', 'gallery');
  const dataFile = path.join(galleryRoot, 'src', 'data', 'examples.generated.json');
  const publicRoot = path.join(galleryRoot, '.generated', 'public');
  const coversRoot = path.join(publicRoot, 'covers');
  const stagingRoot = path.join(publicRoot, '.covers-next');

  const names = (await readdir(examplesRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'en'));

  const buildable = buildableSlugs;
  const entries = [];
  const assets = [];

  for (const name of names) {
    const directory = path.join(examplesRoot, name);
    let metadata;
    try {
      metadata = JSON.parse(await readFile(path.join(directory, 'example.json'), 'utf8'));
    } catch (error) {
      throw new Error(`案例 ${name} 的 example.json 无法读取或解析：${error.message}`);
    }

    if (typeof metadata.visible !== 'boolean') {
      throw new Error(`案例 ${name} 的 visible 必须为布尔值`);
    }
    if (!metadata.visible) continue;

    const { errors } = await validateExample(directory);
    if (errors.length) {
      throw new Error(`案例 ${name} 未通过规范校验：\n${errors.map((error) => `  - ${error}`).join('\n')}`);
    }

    if (buildable !== null && !buildable.has(name)) continue;

    const coverFile = path.basename(metadata.cover);
    const cover = `covers/${name}/${coverFile}`;
    entries.push({
      slug: name,
      name: metadata.name.trim(),
      description: metadata.description.trim(),
      category: metadata.category.trim(),
      tags: metadata.tags.map((tag) => tag.trim()),
      cover,
      page: `examples/${name}/`,
      source: `examples/${name}/`,
      ready: buildable !== null,
    });
    assets.push({ from: path.resolve(directory, metadata.cover), folder: name, file: coverFile });
  }

  // The directory is exclusively generated. Replacing it clears stale covers
  // without touching any developer-managed static files.
  await mkdir(publicRoot, { recursive: true });
  await rm(stagingRoot, { recursive: true, force: true });
  await mkdir(stagingRoot, { recursive: true });
  for (const asset of assets) {
    const dir = path.join(stagingRoot, asset.folder);
    await mkdir(dir, { recursive: true });
    await copyFile(asset.from, path.join(dir, asset.file));
  }

  await rm(coversRoot, { recursive: true, force: true });
  await rename(stagingRoot, coversRoot);
  await mkdir(path.dirname(dataFile), { recursive: true });
  await writeFile(dataFile, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');

  console.log(`案例索引已更新：扫描 ${names.length} 个案例，收录 ${entries.length} 个可展示案例。`);
  return entries;
}

export { generateGallery };

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generateGallery().catch((error) => {
    console.error(`案例索引生成失败：${error.message}`);
    process.exitCode = 1;
  });
}
