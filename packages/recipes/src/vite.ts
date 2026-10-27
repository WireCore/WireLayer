/// <reference types="node" />
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join, relative } from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

// Vite plugin: adds the sources files of the WireLayer components and recipes an app imports to its CSS, so only their
// classes end up in it (instead of all of them with styles.css). Node only – @wirecore/wirelayer-recipes/vite.

export interface WireLayerSourcesOptions {
    /** Folders searched for imports, relative to the Vite root (default: the root) */
    include?: string[];
    /** Folder names skipped while searching (default: node_modules, dist and the build folders of Nuxt, Next, Astro) */
    exclude?: string[];
}

const PACKAGES = ['vue', 'react', 'blocks-vue', 'blocks-react', 'recipes'].map((name) => `@wirecore/wirelayer-${name}`);
/** The CSS file that gets the imports: the one importing the theme without component classes */
const ENTRY = /@import\s+['"]@wirecore\/wirelayer-(?:vue|react)\/(?:theme|styles-core)\.css['"]/;
const IMPORT =
    /(?:import|export)\s+(type\s+)?(\{[^}]*\}|\*\s+as\s+\w+)\s+from\s+['"](@wirecore\/wirelayer-[\w-]+)(?:\/[\w-]+)?['"]/g;
const SOURCE_FILES = new Set(['.vue', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.astro', '.mdx', '.svelte']);
const SKIPPED = ['node_modules', 'dist', '.git', '.nuxt', '.output', '.next', '.astro', '.vercel', 'storybook-static'];

/** Names imported from the WireLayer packages, by package; `*` for a namespace import (`import * as W`) */
export function findImports(code: string, found = new Map<string, Set<string>>()) {
    for (const [, typeOnly, names, pkg] of code.matchAll(IMPORT)) {
        if (typeOnly || !PACKAGES.includes(pkg!)) continue;
        const set = found.get(pkg!) ?? new Set<string>();
        found.set(pkg!, set);
        if (names!.startsWith('*')) {
            set.add('*');
            continue;
        }
        for (const part of names!.slice(1, -1).split(',')) {
            const name = part.trim().split(/\s+as\s+/)[0]!;
            if (name && !name.startsWith('type ')) set.add(name);
        }
    }
    return found;
}

/** The sources files (absolute paths) for the imported names – names without one (helpers, types) are skipped */
export function sourcesFiles(imports: Map<string, Set<string>>, root: string) {
    const require = createRequire(join(root, 'package.json'));
    const files = new Set<string>();
    for (const [pkg, names] of imports) {
        const folder = sourcesFolder(require, pkg);
        if (!folder) continue;
        if (!existsSync(folder)) continue;
        const wanted = names.has('*') ? readdirSync(folder).map((file) => file.slice(0, -4)) : [...names];
        for (const name of wanted) {
            const file = join(folder, `${name}.css`);
            if (existsSync(file)) files.add(file);
        }
    }
    return [...files].sort();
}

/** dist/sources of an installed package: up from its main entry to the folder of its package.json */
function sourcesFolder(require: NodeJS.Require, pkg: string) {
    let folder: string;
    try {
        folder = dirname(require.resolve(pkg));
    } catch {
        return undefined;
    }
    while (!existsSync(join(folder, 'package.json'))) {
        const parent = dirname(folder);
        if (parent === folder) return undefined;
        folder = parent;
    }
    return join(folder, 'dist/sources');
}

function sourceFilesIn(folder: string, skipped: Set<string>, out: string[] = []) {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (!skipped.has(entry.name)) sourceFilesIn(join(folder, entry.name), skipped, out);
        } else if (SOURCE_FILES.has(extname(entry.name))) out.push(join(folder, entry.name));
    }
    return out;
}

/**
 * Vite plugin for smaller CSS: imports the sources files of the components and recipes used in the app into the CSS
 * file that imports `@wirecore/wirelayer-vue/theme.css` (or `styles-core.css`; the same for React). Put it before
 * Tailwind's plugin. Components that are registered globally or imported automatically are not found – the warning
 * "classes … are missing" names them in development; import their sources files by hand.
 */
export function wirelayer(options: WireLayerSourcesOptions = {}): Plugin {
    let root = process.cwd();
    const skipped = new Set(options.exclude ?? SKIPPED);
    /** Imports per source file, so a changed file is read again on its own */
    const perFile = new Map<string, Map<string, Set<string>>>();
    let imports = '';
    const entries = new Set<string>();

    const read = (file: string) => {
        try {
            perFile.set(file, findImports(readFileSync(file, 'utf8')));
        } catch {
            perFile.delete(file);
        }
    };
    const collect = () => {
        const all = new Map<string, Set<string>>();
        for (const found of perFile.values())
            for (const [pkg, names] of found) all.set(pkg, new Set([...(all.get(pkg) ?? []), ...names]));
        return sourcesFiles(all, root)
            .map((file) => `@import '${file.replaceAll('\\', '/')}';`)
            .join('\n');
    };
    const scan = () => {
        perFile.clear();
        for (const folder of options.include ?? ['.']) {
            const path = join(root, folder);
            if (existsSync(path) && statSync(path).isDirectory())
                for (const file of sourceFilesIn(path, skipped)) read(file);
        }
        imports = collect();
    };

    return {
        name: 'wirelayer-sources',
        enforce: 'pre',
        configResolved(config) {
            root = config.root;
        },
        buildStart() {
            scan();
        },
        transform(code, id) {
            const entry = id.split('?')[0]!.endsWith('.css') ? ENTRY.exec(code) : null;
            if (!entry) return;
            entries.add(id);
            // Right after the theme import – @import rules come before all others
            const end = code.indexOf(';', entry.index) + 1;
            return {
                code: `${code.slice(0, end)}\n/* added by wirelayer() */\n${imports}\n${code.slice(end)}`,
                map: null,
            };
        },
        configureServer(server: ViteDevServer) {
            // A new or changed import adds its sources file: the CSS is built again
            const update = (file: string) => {
                if (!SOURCE_FILES.has(extname(file)) || relative(root, file).startsWith('..')) return;
                if ([...skipped].some((name) => file.split(/[\\/]/).includes(name))) return;
                read(file);
                const next = collect();
                if (next === imports) return;
                imports = next;
                for (const id of entries) {
                    const module = server.moduleGraph.getModuleById(id);
                    if (module) void server.reloadModule(module);
                }
            };
            server.watcher.on('add', update);
            server.watcher.on('change', update);
        },
    };
}
