// Sources files: CSS that brings the classes of single recipes or components into the Tailwind build of an app – the
// opt-in alternative to styles.css, which lets Tailwind scan all recipes (used together with styles-core.css):
//   node ../../scripts/sources.ts recipes      in packages/recipes, after tsc
//       dist/sources/<recipe>.css   @source inline() of every class the recipe can return (slots, variants, compound
//                                   variants) and the marker --wc-recipe-<recipe> (development warning)
//   node ../../scripts/sources.ts components   in a component package, after its build
//       dist/sources/<Export>.css   @import of the recipe files of everything the export renders
// What an export renders is read from the imports of its sources: named imports of recipes from
// @wirecore/wirelayer-recipes, followed through relative imports and into the component packages (blocks → vue/react).
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// Not new URL('..', import.meta.url): the parity test imports this file under jsdom, whose URL is not file-based
const root = join(import.meta.dirname, '..');
const RECIPES = '@wirecore/wirelayer-recipes';
/** Component packages whose sources other packages import (blocks-vue → vue, blocks-react → react) */
const workspace: Record<string, string> = {
    '@wirecore/wirelayer-vue': join(root, 'packages/vue'),
    '@wirecore/wirelayer-react': join(root, 'packages/react'),
};

interface Recipe {
    base?: unknown;
    slots?: unknown;
    variants?: unknown;
    compoundVariants?: Record<string, unknown>[];
    compoundSlots?: Record<string, unknown>[];
}

/** A tailwind-variants component (the same test as the @wirecore/wirelayer-css generator) */
export const isRecipe = (value: unknown): value is Recipe =>
    typeof value === 'function' && 'variantKeys' in value && 'slots' in value;

const flatten = (value: unknown): string[] =>
    typeof value === 'string'
        ? value.split(/\s+/).filter(Boolean)
        : Array.isArray(value)
          ? value.flatMap(flatten)
          : value && typeof value === 'object'
            ? Object.values(value).flatMap(flatten)
            : [];

/** Every class a recipe can return – the variant conditions of compound variants are not classes */
export function recipeClasses(recipe: Recipe): string[] {
    const compound = [...(recipe.compoundVariants ?? []), ...(recipe.compoundSlots ?? [])].map((entry) => [
        entry.class,
        entry.className,
    ]);
    return [...new Set(flatten([recipe.base, recipe.slots, recipe.variants, compound]))].sort();
}

interface Import {
    from: string;
    /** Imported value names (`default` for a default import), null for the whole module (namespace, side effect) */
    names: string[] | null;
}

interface ParsedModule {
    imports: Import[];
    /** export { a as b } from './x' → b: { from: './x', name: 'a' } */
    reexports: Map<string, { from: string; name: string }>;
    /** export * from './x' */
    stars: string[];
    /** Only imports and re-exports (an index file): following one name does not need the others */
    barrel: boolean;
}

const parsed = new Map<string, ParsedModule>();

function parse(file: string): ParsedModule {
    const cached = parsed.get(file);
    if (cached) return cached;
    let code = readFileSync(file, 'utf8');
    if (file.endsWith('.vue'))
        code = [...code.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
    const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, false, kind);
    const module: ParsedModule = { imports: [], reexports: new Map(), stars: [], barrel: true };
    for (const statement of source.statements) {
        if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
            const clause = statement.importClause;
            if (clause?.isTypeOnly) continue;
            const from = statement.moduleSpecifier.text;
            const bindings = clause?.namedBindings;
            if (!clause || (bindings && ts.isNamespaceImport(bindings))) {
                module.imports.push({ from, names: null });
                continue;
            }
            const names = clause.name ? ['default'] : [];
            if (bindings && ts.isNamedImports(bindings)) {
                for (const element of bindings.elements)
                    if (!element.isTypeOnly) names.push((element.propertyName ?? element.name).text);
            }
            if (names.length) module.imports.push({ from, names });
        } else if (ts.isExportDeclaration(statement)) {
            if (statement.isTypeOnly) continue;
            // export { a } of a local or imported binding: not a plain index file
            if (!statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) {
                module.barrel = false;
                continue;
            }
            const from = statement.moduleSpecifier.text;
            if (!statement.exportClause) module.stars.push(from);
            else if (ts.isNamedExports(statement.exportClause)) {
                for (const element of statement.exportClause.elements) {
                    if (element.isTypeOnly) continue;
                    module.reexports.set(element.name.text, {
                        from,
                        name: (element.propertyName ?? element.name).text,
                    });
                }
            }
        } else if (!ts.isTypeAliasDeclaration(statement) && !ts.isInterfaceDeclaration(statement)) {
            module.barrel = false;
        }
    }
    parsed.set(file, module);
    return module;
}

/** Resolves an import of a source file: relative paths (.js → .ts/.tsx) and the component packages' sources */
function resolveImport(from: string, file: string): string | undefined {
    if (from.startsWith('.')) {
        const path = resolve(dirname(file), from);
        const stem = path.replace(/\.js$/, '');
        return [path, `${stem}.ts`, `${stem}.tsx`, `${path}/index.ts`].find(
            (candidate) => /\.(ts|tsx|vue)$/.test(candidate) && existsSync(candidate)
        );
    }
    const pkg = Object.keys(workspace).find((name) => from === name || from.startsWith(`${name}/`));
    return pkg ? entrySource(workspace[pkg]!, `.${from.slice(pkg.length)}`) : undefined;
}

interface Manifest {
    exports: Record<string, string | Record<string, string>>;
}

const readManifest = (dir: string) => JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as Manifest;

/** The TypeScript source of a subpath export (`wirecore:source` condition) */
function entrySource(dir: string, subpath: string) {
    const target = readManifest(dir).exports[subpath];
    const source = typeof target === 'object' ? target['wirecore:source'] : undefined;
    return source ? join(dir, source) : undefined;
}

/**
 * The recipes that the given exports of a source file render (all exports with names = null): recipes imported
 * by name, plus those of every module it imports. In an index file only the re-exports of the names are followed.
 */
function recipesOf(file: string, names: string[] | null, recipeNames: Set<string>, seen = new Set<string>()) {
    const found = new Set<string>();
    const key = `${file}\0${names?.join() ?? '*'}`;
    if (seen.has(key)) return found;
    seen.add(key);
    const module = parse(file);
    const follow = (from: string, followed: string[] | null) => {
        if (from === RECIPES) {
            for (const name of followed ?? []) if (recipeNames.has(name)) found.add(name);
            return;
        }
        const target = resolveImport(from, file);
        if (target) for (const recipe of recipesOf(target, followed, recipeNames, seen)) found.add(recipe);
    };
    if (module.barrel && names) {
        const rest = names.filter((name) => !module.reexports.has(name));
        for (const name of names) {
            const reexport = module.reexports.get(name);
            if (reexport) follow(reexport.from, [reexport.name]);
        }
        if (rest.length) for (const star of module.stars) follow(star, rest);
        return found;
    }
    for (const { from, names: imported } of module.imports) follow(from, imported);
    for (const [, { from, name }] of module.reexports) follow(from, [name]);
    for (const star of module.stars) follow(star, null);
    return found;
}

/** The value exports of an index file, also those of `export *` */
function exportNames(file: string): string[] {
    const module = parse(file);
    const stars = module.stars.flatMap((from) => {
        const target = resolveImport(from, file);
        return target ? exportNames(target) : [];
    });
    return [...module.reexports.keys(), ...stars];
}

/**
 * Export name → recipes it renders, for every subpath of a component package (without the language modules).
 * Every component gets an entry – also one without classes of its own (Vue's Dialog root), so an app can import
 * the file of each component it uses; other exports (confirm, dateInput …) only when they render recipes.
 */
export function componentRecipes(dir: string, recipeNames: Set<string>) {
    const result = new Map<string, Set<string>>();
    for (const subpath of Object.keys(readManifest(dir).exports)) {
        const entry = subpath.includes('*') ? undefined : entrySource(dir, subpath);
        if (!entry) continue;
        for (const name of exportNames(entry)) {
            const recipes = recipesOf(entry, [name], recipeNames);
            if (recipes.size === 0 && !/^[A-Z]/.test(name)) continue;
            if (result.has(name)) throw new Error(`${name} is exported by two subpaths of ${dir}`);
            result.set(name, recipes);
        }
    }
    return result;
}

const banner = (what: string) => `/* ${what} – generated by scripts/sources.ts, do not edit */`;

/**
 * The classes as @source inline() – not as a file: with automatic source detection Tailwind scans the whole folder
 * of a file an @source in node_modules points to, so each import would bring the classes of all recipes.
 * Tailwind does not unescape the string: classes with " go in single quotes, braces would be expanded.
 */
function inlineSources(name: string, classes: string[]) {
    const invalid = classes.find((cls) => /[{}\\]/.test(cls) || (cls.includes('"') && cls.includes("'")));
    if (invalid) throw new Error(`${name}: the class ${invalid} cannot be written into @source inline()`);
    const quoted = classes.filter((cls) => cls.includes('"'));
    const plain = classes.filter((cls) => !cls.includes('"'));
    return [
        ...(plain.length ? [`@source inline("${plain.join(' ')}");`] : []),
        ...(quoted.length ? [`@source inline('${quoted.join(' ')}');`] : []),
    ];
}

/** Writes sources/<recipe>.css for every recipe of the module into `out` */
export function writeRecipeSources(out: string, module: Record<string, unknown>) {
    rmSync(out, { recursive: true, force: true });
    mkdirSync(out, { recursive: true });
    const recipes = Object.entries(module).filter((entry): entry is [string, Recipe] => isRecipe(entry[1]));
    for (const [name, recipe] of recipes) {
        const lines = [
            banner(`Classes of the WireLayer recipe ${name}`),
            ...inlineSources(name, recipeClasses(recipe)),
        ];
        writeFileSync(join(out, `${name}.css`), `${lines.join('\n')}\n:root {\n    --wc-recipe-${name}: 1;\n}\n`);
    }
    return recipes.length;
}

/** Writes sources/<Export>.css for the exports of the component package in `dir` into `out` */
export function writeComponentSources(dir: string, out: string, recipeNames: Set<string>) {
    rmSync(out, { recursive: true, force: true });
    mkdirSync(out, { recursive: true });
    const components = componentRecipes(dir, recipeNames);
    for (const [name, recipes] of components) {
        const imports = recipes.size
            ? [...recipes].sort().map((recipe) => `@import '${RECIPES}/sources/${recipe}.css';`)
            : [`/* ${name} renders no classes of its own */`];
        writeFileSync(join(out, `${name}.css`), `${banner(`Classes of ${name}`)}\n${imports.join('\n')}\n`);
    }
    return components.size;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    const dir = process.cwd();
    const recipes = (await import(pathToFileURL(join(root, 'packages/recipes/dist/index.js')).href)) as Record<
        string,
        unknown
    >;
    const out = join(dir, 'dist/sources');
    if (process.argv[2] === 'recipes') console.log(`${writeRecipeSources(out, recipes)} recipes → dist/sources`);
    else if (process.argv[2] === 'components') {
        const recipeNames = new Set(Object.keys(recipes).filter((name) => isRecipe(recipes[name])));
        console.log(`${writeComponentSources(dir, out, recipeNames)} exports → dist/sources`);
    } else throw new Error('Usage: node scripts/sources.ts recipes|components');
}
