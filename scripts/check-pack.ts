// What the component packages publish: `npm pack --dry-run` lists the files of each tarball – llms.txt and
// llms-full.txt (written by the build) have to be in it and must not be empty. Run after `pnpm build` (CI: build job).
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const packages = ['vue', 'react', 'native', 'css'];
const required = ['llms.txt', 'llms-full.txt'];

const failures: string[] = [];
for (const name of packages) {
    const output = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
        cwd: join(root, 'packages', name),
        encoding: 'utf8',
    });
    const [tarball] = JSON.parse(output) as { name: string; files: { path: string; size: number }[] }[];
    for (const file of required) {
        const entry = tarball!.files.find((candidate) => candidate.path === file);
        if (!entry) failures.push(`${tarball!.name}: ${file} is missing`);
        else if (entry.size === 0) failures.push(`${tarball!.name}: ${file} is empty`);
    }
}
if (failures.length) {
    console.error(`Run pnpm build first?\n${failures.join('\n')}`);
    process.exit(1);
}
console.log(`${required.join(' and ')} are in the packages of ${packages.join(', ')}`);
