// Vercel never uploads folders named node_modules, but Expo puts font/image assets under dist/assets/node_modules/.
// This moves them to dist/assets/nm/ and rewrites the references in the built JS. Run after `expo export --platform web`.
import { cpSync, copyFileSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(import.meta.dirname, '..', 'dist');
const from = join(dist, 'assets', 'node_modules');
if (existsSync(from)) {
  cpSync(from, join(dist, 'assets', 'nm'), { recursive: true });
  rmSync(from, { recursive: true, force: true });
}
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
let changed = 0;
for (const file of walk(dist).filter((f) => /\.(js|html|json)$/.test(f))) {
  const src = readFileSync(file, 'utf8');
  const out = src.split('/assets/node_modules/').join('/assets/nm/');
  if (out !== src) {
    writeFileSync(file, out);
    changed += 1;
  }
}
copyFileSync(join(import.meta.dirname, '..', 'vercel.json'), join(dist, 'vercel.json'));
console.log(`prepare-vercel: rewrote ${changed} files`);
