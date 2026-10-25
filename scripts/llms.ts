// llms.txt and llms-full.txt of a component package for AI assistants, in that package's own syntax, rendered from the
// collected API (packages/mcp/data/components.json – its test checks it against the sources):
//   node ../../scripts/llms.ts vue      in packages/vue after its build (react, native the same)
// @wirecore/wirelayer-css writes its own pair in its build (the class reference comes from the recipes).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { packageLlms, type PackageTarget } from '../packages/mcp/scripts/render.ts';

const targets: PackageTarget[] = ['vue', 'react', 'native'];
const target = process.argv[2] as PackageTarget;
if (!targets.includes(target)) throw new Error(`Usage: node scripts/llms.ts ${targets.join('|')}`);

const root = join(import.meta.dirname, '..');
const data = JSON.parse(readFileSync(join(root, 'packages/mcp/data/components.json'), 'utf8')) as Parameters<
    typeof packageLlms
>[0];
const { index, full } = packageLlms(data, target);
writeFileSync(join(root, 'packages', target, 'llms.txt'), index);
writeFileSync(join(root, 'packages', target, 'llms-full.txt'), full);
console.log(`llms.txt, llms-full.txt (${Math.round(full.length / 1024)} kB)`);
