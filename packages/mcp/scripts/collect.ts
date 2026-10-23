// Collects the component API for AI tools: exported components of @wirecore/wirelayer-react (and of @wirecore/wirelayer-native, the
// React Native components) with their props and doc comments, the Storybook category of each, and the guide sections
// of the docs. Writes
//   packages/mcp/data/components.json        – read by the MCP server
//   apps/storybook/public/llms.txt           – index (llmstxt.org), served with the docs Storybook
//   apps/storybook/public/llms-full.txt      – everything in one file
// `node scripts/collect.ts --check` only compares (test and CI): the files must be up to date.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { importPath, vueName } from '../src/tools.ts';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const react = join(root, 'packages/react/src');
const native = join(root, 'packages/native/src');
const blocks = join(root, 'packages/blocks-react/src');

export interface PropInfo {
    name: string;
    type: string;
    optional: boolean;
    description: string;
}

export interface ComponentInfo {
    name: string;
    /** Import path, e.g. "@wirecore/wirelayer-react" or "@wirecore/wirelayer-react/data-table" (Vue: same with "vue") */
    subpath: string;
    description: string;
    category: string;
    /** Storybook story id of the first story, e.g. "data-datatable--playground" */
    story: string | null;
    /** Also takes the attributes of this element (React: ComponentProps<…>) */
    extends: string | null;
    props: PropInfo[];
    /** "blocks": from @wirecore/wirelayer-blocks-react / @wirecore/wirelayer-blocks-vue (page sections, ConditionBuilder …) */
    package?: 'blocks';
}

export interface Guide {
    id: string;
    title: string;
    text: string;
}

export interface Collected {
    components: ComponentInfo[];
    functions: { name: string; subpath: string; description: string }[];
    guides: Guide[];
    /** React Native (@wirecore/wirelayer-native): subpaths relative to "@wirecore/wirelayer-native", stories in the native Storybook */
    native: { components: ComponentInfo[]; functions: { name: string; subpath: string; description: string }[] };
}

const nativeEntries: Record<string, string> = {
    '': 'index.ts',
    '/form': 'form/index.ts',
    '/expo-document-picker': 'file-pickers/expo-document-picker.ts',
    '/expo-image-picker': 'file-pickers/expo-image-picker.ts',
    '/expo-clipboard': 'clipboard/expo-clipboard.ts',
    '/expo-sharing': 'sharing/expo-sharing.ts',
    '/data-table': 'data-table/index.ts',
    '/chart': 'chart/index.ts',
    '/pdf': 'pdf/index.ts',
    '/code': 'code/index.ts',
};

const entries: Record<string, string> = {
    '': 'index.ts',
    '/form': 'form/index.ts',
    '/data-table': 'data-table/index.ts',
    '/virtual': 'virtual/index.ts',
    '/chart': 'chart/index.ts',
    '/editor': 'editor/index.ts',
    '/code': 'code/index.ts',
    '/pdf': 'pdf/index.ts',
};

// Plain parsing is enough (no type checker); doc comments are parsed in full
const files = new Map<string, ts.SourceFile>();
const parse = (path: string) => {
    if (!files.has(path))
        files.set(
            path,
            ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
        );
    return files.get(path)!;
};

const docOf = (node: ts.Node) =>
    ts
        .getJSDocCommentsAndTags(node)
        .filter(ts.isJSDoc)
        .map((doc) => ts.getTextOfJSDocComment(doc.comment) ?? '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

function resolveModule(from: string, specifier: string) {
    const base = join(dirname(from), specifier.replace(/\.js$/, ''));
    return ['.tsx', '.ts', '.vue'].map((extension) => base + extension).find((file) => existsSync(file));
}

/** The first template comment of the Vue component – most Vue components describe themselves there */
function vueComment(reactFile: string, component: string) {
    const vueFile = join(
        dirname(reactFile)
            .replace('/packages/react/', '/packages/vue/')
            .replace('/packages/blocks-react/', '/packages/blocks-vue/'),
        `${component}.vue`
    );
    if (!existsSync(vueFile)) return '';
    const template = readFileSync(vueFile, 'utf8').split('<template>')[1] ?? '';
    return (
        template
            .match(/<!--([\s\S]*?)-->/)?.[1]
            ?.replace(/\s+/g, ' ')
            .trim() ?? ''
    );
}

const memberProps = (file: ts.SourceFile, node: ts.InterfaceDeclaration): PropInfo[] =>
    node.members.filter(ts.isPropertySignature).map((member) => ({
        name: member.name.getText(file).replace(/^'|'$/g, ''),
        type: member.type?.getText(file).replace(/\s+/g, ' ') ?? 'unknown',
        optional: !!member.questionToken,
        description: docOf(member),
    }));

/** The interface `name` declared in `file` or imported into it from a relative module (own sources only) */
function findInterface(
    file: ts.SourceFile,
    name: string
): { file: ts.SourceFile; node: ts.InterfaceDeclaration } | null {
    let found: { file: ts.SourceFile; node: ts.InterfaceDeclaration } | null = null;
    file.forEachChild((node) => {
        if (found) return;
        if (ts.isInterfaceDeclaration(node) && node.name.text === name) found = { file, node };
        if (
            ts.isImportDeclaration(node) &&
            (node.moduleSpecifier as ts.StringLiteral).text.startsWith('.') &&
            node.importClause?.namedBindings &&
            ts.isNamedImports(node.importClause.namedBindings) &&
            node.importClause.namedBindings.elements.some((element) => element.name.text === name)
        ) {
            const path = resolveModule(file.fileName, (node.moduleSpecifier as ts.StringLiteral).text);
            if (path && !path.endsWith('.vue')) found = findInterface(parse(path), name);
        }
    });
    return found;
}

/**
 * Members of the interfaces a props interface extends, when they are our own (React Native: OptionListProps,
 * TextFieldProps …) – `Omit<X, 'a' | 'b'>` leaves those out. Platform types (ViewProps …) stay in `extends`.
 */
function inheritedProps(file: ts.SourceFile, node: ts.InterfaceDeclaration) {
    const props: PropInfo[] = [];
    const rest: string[] = [];
    for (const type of node.heritageClauses?.flatMap((clause) => clause.types) ?? []) {
        let target: ts.TypeNode | ts.ExpressionWithTypeArguments = type;
        let omitted: string[] = [];
        if (type.expression.getText(file) === 'Omit' && type.typeArguments?.[0]) {
            target = type.typeArguments[0];
            omitted = [...(type.typeArguments[1]?.getText(file).matchAll(/'([^']+)'/g) ?? [])].map(
                (match) => match[1]!
            );
        }
        const name = (
            ts.isExpressionWithTypeArguments(target)
                ? target.expression
                : ts.isTypeReferenceNode(target)
                  ? target.typeName
                  : target
        )
            .getText(file)
            .replace(/<.*$/, '');
        const found = findInterface(file, name);
        if (!found) {
            rest.push(type.getText(file));
            continue;
        }
        const inherited = inheritedProps(found.file, found.node);
        rest.push(...inherited.rest);
        for (const prop of [...inherited.props, ...memberProps(found.file, found.node)])
            if (!omitted.includes(prop.name)) props.push(prop);
    }
    return { props, rest };
}

/** Own members of `interface <Name>Props` (inherited ones are only named by `extends`, or inlined with `inline`) */
function propsOf(file: ts.SourceFile, component: string, inline = false) {
    let props: PropInfo[] = [];
    let heritage: string | null = null;
    let description = '';
    file.forEachChild((node) => {
        if (ts.isInterfaceDeclaration(node) && node.name.text === `${component}Props`) {
            description ||= docOf(node);
            heritage =
                node.heritageClauses
                    ?.map((clause) => clause.types.map((type) => type.getText(file)).join(', '))
                    .join(', ') ?? null;
            props = memberProps(file, node);
            if (inline) {
                const inherited = inheritedProps(file, node);
                // Own members override inherited ones of the same name
                const own = new Set(props.map((prop) => prop.name));
                props = [...inherited.props.filter((prop) => !own.has(prop.name)), ...props];
                heritage = inherited.rest.length ? inherited.rest.join(', ') : null;
            }
        }
        if (ts.isFunctionDeclaration(node) && node.name?.text === component) description = docOf(node) || description;
    });
    return { props, heritage, description: description || (inline ? '' : vueComment(file.fileName, component)) };
}

function collectComponents(base = react, list = entries, inline = false) {
    const components: ComponentInfo[] = [];
    const functions: Collected['functions'] = [];
    for (const [subpath, entry] of Object.entries(list)) {
        const visit = (entryFile: string) => {
            const source = parse(entryFile);
            source.forEachChild((node) => {
                // Functions declared in the entry itself (useClipboard in /expo-clipboard, documentPicker …)
                const declared = declaredExports(node);
                for (const name of declared) {
                    if (/^[A-Z]/.test(name) && ts.isFunctionDeclaration(node)) {
                        const { props, heritage, description } = propsOf(source, name, inline);
                        components.push({
                            name,
                            subpath,
                            description,
                            category: '',
                            story: null,
                            extends: heritage,
                            props,
                        });
                    } else functions.push({ name, subpath, description: docOf(node) });
                }
                // `export * from './hooks/index.js'` (the hooks of @wirecore/wirelayer-react): collect that module as well
                if (ts.isExportDeclaration(node) && node.moduleSpecifier && !node.exportClause && !node.isTypeOnly) {
                    const file = resolveModule(entryFile, (node.moduleSpecifier as ts.StringLiteral).text);
                    if (file && !file.endsWith('.vue')) visit(file);
                    return;
                }
                if (!ts.isExportDeclaration(node) || !node.moduleSpecifier || !node.exportClause) return;
                if (!ts.isNamedExports(node.exportClause) || node.isTypeOnly) return;
                const specifier = (node.moduleSpecifier as ts.StringLiteral).text;
                const file = specifier.startsWith('.') ? resolveModule(entryFile, specifier) : undefined;
                const module = file && !file.endsWith('.vue') ? parse(file) : undefined;
                for (const element of node.exportClause.elements) {
                    if (element.isTypeOnly) continue;
                    const name = element.name.text;
                    if (!/^[A-Z]/.test(name)) {
                        const description = module ? docOfExport(module, element.propertyName?.text ?? name) : '';
                        functions.push({ name, subpath, description });
                        continue;
                    }
                    if (!module) continue;
                    const { props, heritage, description } = propsOf(
                        module,
                        inline ? (element.propertyName?.text ?? name) : name,
                        inline
                    );
                    components.push({
                        name,
                        subpath,
                        description,
                        category: '',
                        story: null,
                        extends: heritage,
                        props,
                    });
                }
            });
        };
        visit(join(base, entry));
    }
    return { components, functions };
}

/** Names of the functions and constants a statement exports by itself (`export function x`, `export const x = …`) */
function declaredExports(node: ts.Node): string[] {
    const exported = (ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined)?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
    );
    if (!exported) return [];
    if (ts.isFunctionDeclaration(node) && node.name) return [node.name.text];
    if (ts.isVariableStatement(node))
        return node.declarationList.declarations.flatMap((declaration) =>
            ts.isIdentifier(declaration.name) ? [declaration.name.text] : []
        );
    return [];
}

function docOfExport(file: ts.SourceFile, name: string) {
    let description = '';
    file.forEachChild((node) => {
        if (ts.isFunctionDeclaration(node) && node.name?.text === name) description = docOf(node);
        if (
            ts.isVariableStatement(node) &&
            node.declarationList.declarations.some((d) => d.name.getText(file) === name)
        )
            description = docOf(node);
    });
    return description;
}

/** Category and first story of every component from the React (or React Native) stories */
function collectStories(base = react) {
    const stories = new Map<string, { category: string; story: string }>();
    const walk = (directory: string) => {
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
            const path = join(directory, entry.name);
            if (entry.isDirectory()) walk(path);
            else if (entry.name.endsWith('.stories.tsx')) {
                const file = readFileSync(path, 'utf8');
                // Inside the default export (meta): stories may use title/component in their data, too
                const text = file.slice(file.indexOf('const meta'));
                const title = text.match(/title: '([^']+)'/)?.[1];
                // The file is named after the component (stories often render a demo component)
                const component = entry.name.replace('.stories.tsx', '');
                const first = file.match(/export const (\w+): Story/)?.[1];
                if (!title || !component || !first) continue;
                const id = title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '');
                const story = first.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
                stories.set(component, { category: title.split('/')[0]!, story: `${id}--${story}` });
            }
        }
    };
    walk(base);
    return stories;
}

/** Removes MDX imports and blocks – lines inside fenced code blocks stay as they are */
export function stripMdx(text: string) {
    let fence = false;
    return text
        .split('\n')
        .filter((line) => {
            if (/^\s*(```|~~~)/.test(line)) fence = !fence;
            return fence || !/^import |^<Meta|^<\w+ ?\/>$/.test(line);
        })
        .join('\n');
}

/** Sections (##) of the docs pages, without MDX imports and blocks */
function collectGuides(): Guide[] {
    const docs = join(root, 'apps/storybook/src');
    return readdirSync(docs)
        .filter((name) => name.endsWith('.mdx'))
        .sort()
        .flatMap((name) => {
            const page = name.replace(/\.mdx$/, '').toLowerCase();
            const text = stripMdx(readFileSync(join(docs, name), 'utf8'));
            return text
                .split(/^## /m)
                .slice(1)
                .map((section) => {
                    const [title = '', ...body] = section.split('\n');
                    const id = `${page}-${title
                        .toLowerCase()
                        .replace(/[^a-z0-9äöüß]+/g, '-')
                        .replace(/^-|-$/g, '')}`;
                    return { id, title: title.trim(), text: body.join('\n').trim() };
                });
        });
}

function withStories(components: ComponentInfo[], stories: Map<string, { category: string; story: string }>) {
    for (const component of components) {
        // Parts (AccordionItem, TabsList …) belong to the story of their component
        const owner = [...stories.keys()]
            .filter((name) => component.name.startsWith(name))
            .sort((a, b) => b.length - a.length)[0];
        const story = stories.get(component.name) ?? (owner ? stories.get(owner) : undefined);
        component.category = story?.category ?? '';
        component.story = story?.story ?? null;
    }
    return components.sort((a, b) => a.name.localeCompare(b.name));
}

export function collect(): Collected {
    const { components, functions } = collectComponents();
    withStories(components, collectStories());
    // Blocks (@wirecore/wirelayer-blocks-*): only the components – their helpers come from @wirecore/wirelayer-react or the recipes
    const blockData = collectComponents(blocks, { '': 'index.ts' });
    withStories(blockData.components, collectStories(blocks));
    for (const component of blockData.components)
        if (!components.some((other) => other.name === component.name))
            components.push({ ...component, package: 'blocks' });
    components.sort((a, b) => a.name.localeCompare(b.name));
    functions.sort((a, b) => a.name.localeCompare(b.name));
    // A component exported under two names (FormList as FieldArray) is listed once per name, as on the web
    const nativeData = collectComponents(native, nativeEntries, true);
    withStories(nativeData.components, collectStories(native));
    nativeData.functions.sort((a, b) => a.name.localeCompare(b.name));
    return { components, functions, guides: collectGuides(), native: nativeData };
}

export function componentText(component: ComponentInfo, storybook = '') {
    const names = component.props.map((prop) => prop.name);
    const lines = [
        `### ${component.name}`,
        '',
        component.description || '(no description)',
        '',
        `- Import: \`import { ${component.name} } from '${importPath(component, 'react')}'\` · Vue: \`${importPath(component, 'vue')}\``,
        component.category ? `- Category: ${component.category}` : '',
        component.story ? `- Story: ${storybook}?path=/story/react_${component.story}` : '',
        component.extends ? `- Also takes: ${component.extends}` : '',
        '',
        '| Prop (React) | Vue | Type | Description |',
        '| --- | --- | --- | --- |',
        ...component.props.map(
            (prop) =>
                `| ${prop.name}${prop.optional ? '?' : ''} | ${vueName(prop.name, names)} | \`${prop.type.replaceAll('|', '\\|')}\` | ${prop.description.replaceAll('|', '\\|')} |`
        ),
    ];
    return lines.filter((line, index) => line !== '' || lines[index - 1] !== '').join('\n');
}

/** One React Native component: import from @wirecore/wirelayer-native, the props as they are (no Vue names) */
export function nativeComponentText(component: ComponentInfo, storybook = '') {
    const lines = [
        `### ${component.name} (React Native)`,
        '',
        component.description || '(no description)',
        '',
        `- Import: \`import { ${component.name} } from '@wirecore/wirelayer-native${component.subpath}'\``,
        component.category ? `- Category: ${component.category}` : '',
        component.story ? `- Story: ${storybook}?path=/story/native_${component.story}` : '',
        component.extends ? `- Also takes: ${component.extends}` : '',
        '',
        '| Prop | Type | Description |',
        '| --- | --- | --- |',
        ...component.props.map(
            (prop) =>
                `| ${prop.name}${prop.optional ? '?' : ''} | \`${prop.type.replaceAll('|', '\\|')}\` | ${prop.description.replaceAll('|', '\\|')} |`
        ),
    ];
    return lines.filter((line, index) => line !== '' || lines[index - 1] !== '').join('\n');
}

const nativeIntro =
    'React Native (Expo) components with Uniwind: same prop names and values as the React components where they fit on a phone – pickers open as bottom sheets, touch targets are at least 44 pt, no hover, gestures always with accessibility actions. Forms with TanStack Form via `@wirecore/wirelayer-native/form`; DataTable (no TanStack; table or cards per row) via `@wirecore/wirelayer-native/data-table`; charts drawn with react-native-svg (no Chart.js) via `@wirecore/wirelayer-native/chart`; PdfViewer on react-native-pdf (development build, not Expo Go) via `@wirecore/wirelayer-native/pdf`; CodeHighlight with Shiki via `@wirecore/wirelayer-native/code`; file pickers via `@wirecore/wirelayer-native/expo-document-picker` and `@wirecore/wirelayer-native/expo-image-picker`, `useClipboard` via `@wirecore/wirelayer-native/expo-clipboard`, `shareFile`/`shareUri` (DataTable export, PDFs) via `@wirecore/wirelayer-native/expo-sharing` (optional peer dependencies). Overlays: Dialog, Drawer (from every edge), Menu and ContextMenu as sheets, Popover next to its trigger; `toast()`, `confirm()`, `prompt()` and `openDialog()` need `<Toaster />`, `<ConfirmDialog />` and `<DialogHost />` once at the root.';

const intro =
    'WireLayer: a component library for Vue 3 (@wirecore/wirelayer-vue), React (@wirecore/wirelayer-react), React Native (@wirecore/wirelayer-native) and plain HTML (@wirecore/wirelayer-css). Vue and React share the same API and DOM; Tailwind CSS v4 recipes in @wirecore/wirelayer-recipes; WCAG 2.2 AA; English UI texts by default, German and other languages via LocaleProvider.';
const conventions = [
    '## Conventions',
    '',
    '- React props in camelCase; Vue takes the same props in kebab-case. Controlled values: React `value` + `onValueChange`, Vue `v-model`; other `onXChange` pairs are `v-model:x` in Vue, other callbacks `@x` events.',
    '- `className` (React) is `class` (Vue). Every component takes `classes` (extra Tailwind classes per part) and reads defaults from `RecipesProvider`.',
    '- Content: React props of type ReactNode/render functions are named slots in Vue (e.g. DataTable `cell` → `#cell-<id>`, `expansion` → `#expansion`).',
    "- DataTable feature modules in `features` (only these end up in the bundle): `virtualRows` from `@wirecore/wirelayer-react/virtual` for `virtual`; `dateInput` and `numberInput` from `@wirecore/wirelayer-react/data-table` for DatePicker/NumberInput in date and number filters and editors (without them: the browser's inputs). Vue: the same from `@wirecore/wirelayer-vue/…`.",
    '- Texts come from `LocaleProvider` (en-US built in; de, fr, es, it, pt, pt-BR, nl, pl, cs, hu, lv, ar, tr via `registerLocale(\'fr\', fr)` with `fr` from `@wirecore/wirelayer-vue/locales/fr` or `@wirecore/wirelayer-react/locales/fr`); dates are ISO strings ("2026-10-20", "2026-10-20T10:00").',
].join('\n');

export function llmsIndex(data: Collected, storybook = '') {
    const byCategory = new Map<string, ComponentInfo[]>();
    for (const component of data.components) {
        const list = byCategory.get(component.category || 'Other') ?? [];
        list.push(component);
        byCategory.set(component.category || 'Other', list);
    }
    return [
        '# WireLayer',
        '',
        `> ${intro}`,
        '',
        'Full API in llms-full.txt; MCP server: `npx -y -p @wirecore/wirelayer-mcp wirelayer-mcp` (tools list_components, get_component, search_components, get_guide).',
        '',
        conventions,
        '',
        ...[...byCategory].flatMap(([category, components]) => [
            `## ${category}`,
            '',
            ...components.map(
                (component) =>
                    `- ${component.story ? `[${component.name}](${storybook}?path=/story/react_${component.story})` : component.name}: ${component.description || '–'} (\`${importPath(component, 'react')}\`)`
            ),
            '',
        ]),
        '## React Native (@wirecore/wirelayer-native)',
        '',
        nativeIntro,
        '',
        ...data.native.components.map(
            (component) =>
                `- ${component.story ? `[${component.name}](${storybook}?path=/story/native_${component.story})` : component.name}: ${component.description || '–'} (\`@wirecore/wirelayer-native${component.subpath}\`)`
        ),
        '',
        '## Guides',
        '',
        ...data.guides.map((guide) => `- ${guide.title} (${guide.id})`),
        '',
    ].join('\n');
}

export function llmsFull(data: Collected, storybook = '') {
    return [
        '# WireLayer – full API',
        '',
        `> ${intro}`,
        '',
        conventions,
        '',
        '## Components',
        '',
        ...data.components.map((component) => `${componentText(component, storybook)}\n`),
        '## Functions and hooks',
        '',
        ...data.functions.map(
            (fn) => `- \`${fn.name}\` (\`@wirecore/wirelayer-react${fn.subpath}\`): ${fn.description || '–'}`
        ),
        '',
        '## React Native components (@wirecore/wirelayer-native)',
        '',
        nativeIntro,
        '',
        ...data.native.components.map((component) => `${nativeComponentText(component, storybook)}\n`),
        '## React Native functions and hooks',
        '',
        ...data.native.functions.map(
            (fn) => `- \`${fn.name}\` (\`@wirecore/wirelayer-native${fn.subpath}\`): ${fn.description || '–'}`
        ),
        '',
        '## Guides',
        '',
        ...data.guides.map((guide) => `### ${guide.title}\n\n${guide.text}\n`),
    ].join('\n');
}

const outputs = (data: Collected) => ({
    [join(root, 'packages/mcp/data/components.json')]: `${JSON.stringify(data, null, 4)}\n`,
    [join(root, 'apps/storybook/public/llms.txt')]: llmsIndex(data),
    [join(root, 'apps/storybook/public/llms-full.txt')]: llmsFull(data),
});

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    const files = outputs(collect());
    if (process.argv.includes('--check')) {
        // Only the committed data – llms*.txt are generated from the same data and not in git (missing on a fresh checkout)
        const stale = Object.entries(files).filter(
            ([path, text]) =>
                path.endsWith('components.json') && (!existsSync(path) || readFileSync(path, 'utf8') !== text)
        );
        if (stale.length) {
            console.error(
                `Out of date – run pnpm --filter @wirecore/wirelayer-mcp collect:\n${stale.map(([path]) => path).join('\n')}`
            );
            process.exit(1);
        }
    } else {
        for (const [path, text] of Object.entries(files)) {
            mkdirSync(dirname(path), { recursive: true });
            writeFileSync(path, text);
        }
        console.log(`${Object.keys(files).length} files written`);
    }
}

export { outputs };
