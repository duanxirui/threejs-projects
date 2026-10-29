/**
 * Validate the compact documentation structure and task traceability.
 * Run from the project root: node scripts/check-docs.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, relative, resolve, sep } from 'node:path';

const root = process.cwd();
const docsDir = resolve(root, 'docs');
const failures = [];
// These two commits belong to the pre-migration car-atelier repository.
// The collection intentionally has its own Git history and no nested .git.
// Keep the exact recorded SHAs auditable without asserting they live in the
// Three.js collection repository.
const legacyCommits = new Map([
  ['CAR-007', '5f5e3bbeab8c43dfef498ce86028eb6a48eeab57'],
  ['CAR-012', '8abedd58defc32cea10b17da28029ff501b94c3e'],
]);
const read = (file) => readFileSync(file, 'utf8');
const formatPath = (file) => relative(root, file).split(sep).join('/');

function listMarkdown(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const absolute = resolve(dir, item.name);
    return item.isDirectory()
      ? listMarkdown(absolute)
      : item.isFile() && item.name.endsWith('.md') ? [absolute] : [];
  });
}

function headingSlug(value) {
  return value.toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

const docs = listMarkdown(docsDir);
const markdownFiles = [resolve(root, 'README.md'), resolve(root, 'AGENTS.md'), ...docs];
const index = read(resolve(docsDir, 'README.md'));
let localLinks = 0;
let anchors = 0;
let gitRefs = 0;

for (const file of docs) {
  const relativeDoc = relative(docsDir, file).split(sep).join('/');
  if (relativeDoc !== 'README.md' && !index.includes(`](${relativeDoc})`)) {
    failures.push(`未在文档中心登记：${relativeDoc}`);
  }
  if (dirname(file) === docsDir && ![
    'README.md', 'development-scheme.md', 'development-plan.md',
  ].includes(relativeDoc)) {
    failures.push(`docs 根目录存在额外项目文档：${relativeDoc}`);
  }
  if (relativeDoc.startsWith('plans/') && !/^plans\/\d{4}-\d{2}-\d{2}\.md$/.test(relativeDoc)) {
    failures.push(`日志必须使用 YYYY-MM-DD.md：${relativeDoc}`);
  }
}

for (const file of markdownFiles) {
  if (!existsSync(file)) {
    failures.push(`缺少入口：${formatPath(file)}`);
    continue;
  }
  const source = read(file);
  for (const match of source.matchAll(/(?<!!)\[[^\]\n]+\]\(([^)\n]+)\)/g)) {
    const href = match[1].trim();
    if (/^(https?:\/\/|mailto:|data:)/i.test(href)) continue;
    const [urlPath, hash] = href.split('#', 2);
    const target = urlPath ? resolve(dirname(file), decodeURIComponent(urlPath)) : file;
    localLinks++;
    if (!existsSync(target) || !statSync(target).isFile()) {
      failures.push(`本地链接失效：${formatPath(file)} -> ${href}`);
      continue;
    }
    if (hash && extname(target).toLowerCase() === '.md') {
      anchors++;
      const fragment = decodeURIComponent(hash);
      const available = [...read(target).matchAll(/^#{1,6}\s+(.+?)\s*$/gm)]
        .map((heading) => headingSlug(heading[1]));
      if (!available.includes(fragment)) {
        failures.push(`标题锚点失效：${formatPath(file)} -> ${href}`);
      }
    }
  }
}

const plan = read(resolve(docsDir, 'development-plan.md'));
const planRows = [...plan.matchAll(/^\|\s*`(CAR-\d{3})`\s*\|([^\n]+)$/gm)];
const planIds = planRows.map((row) => row[1]);
if (new Set(planIds).size !== planIds.length) failures.push('开发计划存在重复任务编号');

const logs = docs.filter((file) => dirname(file) === resolve(docsDir, 'plans'));
const loggedIds = new Set();
for (const file of logs) {
  const rows = [...read(file).matchAll(/^\|\s*`(CAR-\d{3})`\s*\|([^\n]+)$/gm)];
  if (rows.length === 0) failures.push(`日志没有任务关联表：${formatPath(file)}`);
  for (const row of rows) {
    const id = row[1];
    loggedIds.add(id);
    if (!planIds.includes(id)) failures.push(`日志任务编号未登记到计划：${id}`);
    const cells = row[0].split('|').map((item) => item.trim()).filter(Boolean);
    const commit = cells.at(-1).replace(/`/g, '');
    if (/未提交|未建立提交/.test(commit)) continue;
    if (file === resolve(docsDir, 'plans', '2026-10-21.md') && legacyCommits.get(id) === commit) {
      gitRefs++;
      continue;
    }
    if (!/^[0-9a-f]{7,40}$/i.test(commit)) {
      failures.push(`${formatPath(file)} 的 ${id} 缺少有效 Git SHA/未提交状态`);
      continue;
    }
    try {
      const kind = execFileSync('git', ['cat-file', '-t', commit], {
        cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      if (kind !== 'commit') throw new Error('not a commit');
      gitRefs++;
    } catch {
      failures.push(`Git 提交不存在：${id} -> ${commit}`);
    }
  }
}

for (const row of planRows) {
  if (/已完成|已实现/.test(row[2]) && !loggedIds.has(row[1])) {
    failures.push(`已完成任务没有日期日志：${row[1]}`);
  }
}

if (failures.length) {
  console.error(`文档检查失败（${failures.length} 处）：`);
  for (const failure of failures) console.error(' - ' + failure);
  process.exitCode = 1;
} else {
  console.log(`文档检查通过：${docs.length} 份 docs Markdown，${planIds.length} 个任务，`
    + `${loggedIds.size} 个有日志关联，${localLinks} 个本地链接，`
    + `${anchors} 个锚点，${gitRefs} 个有效 Git 提交引用。`);
}
