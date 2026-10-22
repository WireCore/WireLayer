// Licence check for the published packages (pnpm licenses:check): the production dependencies of every non-private
// package in packages/* (from `pnpm licenses list --prod --json`) and their peer dependencies, which the user
// installs, must have a licence from the allowlist. Exits with 1 and lists the packages otherwise.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Permissive licences that are fine for an MIT release (SPDX ids) */
const allowed = new Set([
    'MIT',
    'ISC',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'Apache-2.0',
    '0BSD',
    'OFL-1.1',
    'CC0-1.0',
    'BlueOak-1.0.0',
    'Unlicense',
]);
/** MPL-2.0 (file-level copyleft) only for build tools that are installed unmodified and not redistributed */
const buildTools: Record<string, string> = { lightningcss: 'MPL-2.0' };

interface Manifest {
    name: string;
    private?: boolean;
    license?: string;
    peerDependencies?: Record<string, string>;
}

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (file: string) => JSON.parse(readFileSync(file, 'utf8')) as Manifest;
const published = readdirSync(join(root, 'packages')).filter(
    (dir) =>
        existsSync(join(root, 'packages', dir, 'package.json')) &&
        !read(join(root, 'packages', dir, 'package.json')).private
);

/** An SPDX expression like "MIT", "(MIT OR CC0-1.0)" or "MIT AND OFL-1.1" */
function isAllowed(expression: string) {
    return expression
        .replace(/[()]/g, '')
        .split(/\s+OR\s+/)
        .some((choice) => choice.split(/\s+AND\s+/).every((id) => allowed.has(id.trim())));
}

const problems: string[] = [];
const notes: string[] = [];
let checked = 0;

const output = execFileSync(
    'pnpm',
    [...published.flatMap((dir) => ['--filter', `./packages/${dir}`]), 'licenses', 'list', '--prod', '--json'],
    { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
);
const byLicence = JSON.parse(output) as Record<string, { name: string; versions: string[] }[]>;
for (const [licence, packages] of Object.entries(byLicence)) {
    for (const pkg of packages) {
        checked++;
        const name = `${pkg.name}@${pkg.versions.join(', ')}`;
        if (isAllowed(licence)) continue;
        if (buildTools[pkg.name] === licence) notes.push(`${name}: ${licence} (build tool, not redistributed)`);
        else problems.push(`${name}: ${licence}`);
    }
}

// Peer dependencies are installed by the user; here they are devDependencies of the package
for (const dir of published) {
    const manifest = read(join(root, 'packages', dir, 'package.json'));
    for (const peer of Object.keys(manifest.peerDependencies ?? {})) {
        if (peer.startsWith('@wirecore/')) continue;
        checked++;
        const file = join(root, 'packages', dir, 'node_modules', peer, 'package.json');
        const licence = existsSync(file) ? (read(file).license ?? 'no licence field') : 'not installed';
        if (!isAllowed(licence)) problems.push(`${peer} (peer of ${manifest.name}): ${licence}`);
    }
}

for (const note of notes) console.log(`Note: ${note}`);
if (problems.length) {
    console.error(
        `Licences not on the allowlist (scripts/check-licenses.ts):\n${problems.map((p) => `  ${p}`).join('\n')}`
    );
    process.exit(1);
}
console.log(
    `${checked} packages checked (${published.length} published packages and their peers): all licences allowed`
);
