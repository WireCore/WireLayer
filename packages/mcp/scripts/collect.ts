// Collects the component API for AI tools: exported components of @wirecore/wirelayer-react (and of @wirecore/wirelayer-native, the
// React Native components) with their props and doc comments, the slots and events of the Vue components, the Storybook
// category of each, and the guide sections of the docs. Writes
//   packages/mcp/data/components.json        – read by the MCP server and by the llms.txt of the component packages
//   apps/storybook/public/llms.txt           – index (llmstxt.org), served with the docs Storybook
//   apps/storybook/public/llms-full.txt      – everything in one file
// `node scripts/collect.ts --check` only compares (test and CI): the files must be up to date.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { llmsFull, llmsIndex, stripMdx } from './render.ts';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const react = join(root, 'packages/react/src');
const vue = join(root, 'packages/vue/src');
const native = join(root, 'packages/native/src');
const blocks = join(root, 'packages/blocks-react/src');

export interface PropInfo {
    name: string;
    type: string;
    optional: boolean;
    description: string;
}

/** A slot of a Vue component (`#name`), with the type of its slot props */
export interface SlotInfo {
    name: string;
    props: string;
    description: string;
}

/** An event of a Vue component (`@name`), with its payload */
export interface EventInfo {
    name: string;
    payload: string;
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
    /** Props, slots and events of the Vue component (defineProps/defineSlots/defineEmits), when it declares any */
    vue?: { props?: PropInfo[]; slots: SlotInfo[]; events: EventInfo[] };
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
    /** Functions and composables of @wirecore/wirelayer-vue (the components are the ones above) */
    vue: { functions: { name: string; subpath: string; description: string }[] };
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
    if (specifier.endsWith('.vue')) {
        const file = join(dirname(from), specifier);
        return existsSync(file) ? file : undefined;
    }
    const base = join(dirname(from), specifier.replace(/\.js$/, ''));
    return ['.tsx', '.ts', '.vue'].map((extension) => base + extension).find((file) => existsSync(file));
}

/** The scripts of a .vue file (<script setup> and a plain <script>) as one TypeScript source */
const parseVueScript = (path: string) => {
    if (!files.has(path)) {
        const scripts = [...readFileSync(path, 'utf8').matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
        files.set(
            path,
            ts.createSourceFile(
                path,
                scripts.map((match) => match[1]).join('\n'),
                ts.ScriptTarget.Latest,
                true,
                ts.ScriptKind.TS
            )
        );
    }
    return files.get(path)!;
};

/** The .vue file of a component next to its React counterpart (blocks-react → blocks-vue) */
const vueFileOf = (reactFile: string, component: string) =>
    join(
        dirname(reactFile)
            .replace('/packages/react/', '/packages/vue/')
            .replace('/packages/blocks-react/', '/packages/blocks-vue/'),
        `${component}.vue`
    );

/** The first template comment of the Vue component – most Vue components describe themselves there */
function vueComment(reactFile: string, component: string) {
    const vueFile = vueFileOf(reactFile, component);
    if (!existsSync(vueFile)) return '';
    const template = readFileSync(vueFile, 'utf8').split('<template>')[1] ?? '';
    return (
        template
            .match(/<!--([\s\S]*?)-->/)?.[1]
            ?.replace(/\s+/g, ' ')
            .trim() ?? ''
    );
}

const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim();

// The members of `{ … }` or `{ … } & { … }`
const members = (type: ts.TypeNode): ts.TypeElement[] =>
    ts.isTypeLiteralNode(type)
        ? [...type.members]
        : ts.isIntersectionTypeNode(type)
          ? type.types.flatMap(members)
          : ts.isParenthesizedTypeNode(type)
            ? members(type.type)
            : [];

/** The props of a `defineProps<…>()` type: an interface (own, imported or extending another), a literal, both joined */
function typeProps(file: ts.SourceFile, type: ts.TypeNode): PropInfo[] {
    if (ts.isIntersectionTypeNode(type)) return type.types.flatMap((part) => typeProps(file, part));
    if (ts.isParenthesizedTypeNode(type)) return typeProps(file, type.type);
    if (ts.isTypeLiteralNode(type))
        return members(type)
            .filter(ts.isPropertySignature)
            .map((member) => propOf(file, member));
    if (!ts.isTypeReferenceNode(type)) return [];
    const found = findInterface(file, type.typeName.getText(file));
    if (!found) return [];
    const own = memberProps(found.file, found.node);
    const names = new Set(own.map((prop) => prop.name));
    return [...inheritedProps(found.file, found.node).props.filter((prop) => !names.has(prop.name)), ...own];
}

/**
 * Props, slots and events the Vue component declares with defineProps<…>, defineSlots<{…}> and defineEmits<{…}>.
 * A prop without a doc comment takes the one of the React prop of the same name.
 */
function vueApi(reactFile: string, component: string, reactProps: PropInfo[] = []): ComponentInfo['vue'] {
    const vueFile = vueFileOf(reactFile, component);
    if (!existsSync(vueFile)) return undefined;
    const file = parseVueScript(vueFile);
    let props: PropInfo[] | undefined;
    const models: PropInfo[] = [];
    const slots: SlotInfo[] = [];
    const events: EventInfo[] = [];
    const nameOf = (member: ts.TypeElement) => {
        // [cell: `cell-${string}`] → cell-<id>
        if (ts.isIndexSignatureDeclaration(member))
            return (member.parameters[0]?.type?.getText(file) ?? '')
                .replace(/^`|`$/g, '')
                .replace(/\$\{string\}/g, '<id>');
        return member.name?.getText(file).replace(/^'|'$/g, '') ?? '';
    };
    // item?(props: {…}): unknown · item?: (props: {…}) => unknown · [x: `x-${string}`]: (props: {…}) => unknown
    const slotProps = (member: ts.TypeElement) => {
        const signature = ts.isMethodSignature(member)
            ? member
            : (ts.isPropertySignature(member) || ts.isIndexSignatureDeclaration(member)) &&
                member.type &&
                ts.isFunctionTypeNode(member.type)
              ? member.type
              : undefined;
        return oneLine(signature?.parameters[0]?.type?.getText(file) ?? '');
    };
    // 'update:modelValue': [value: string] → value: string
    const payload = (member: ts.TypeElement) =>
        ts.isPropertySignature(member) && member.type && ts.isTupleTypeNode(member.type)
            ? oneLine(member.type.elements.map((element) => element.getText(file)).join(', '))
            : '';
    const visit = (node: ts.Node) => {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.typeArguments?.[0]) {
            const kind = node.expression.text;
            if (kind === 'defineProps') props = typeProps(file, node.typeArguments[0]);
            if (kind === 'defineSlots')
                for (const member of members(node.typeArguments[0]))
                    slots.push({ name: nameOf(member), props: slotProps(member), description: docOf(member) });
            if (kind === 'defineEmits')
                for (const member of members(node.typeArguments[0]))
                    events.push({ name: nameOf(member), payload: payload(member), description: docOf(member) });
            // defineModel<string>() (Input, Textarea, PasswordInput): v-model without a declared emit
            if (kind === 'defineModel') {
                const model =
                    node.arguments[0] && ts.isStringLiteral(node.arguments[0]) ? node.arguments[0].text : 'modelValue';
                events.push({
                    name: `update:${model}`,
                    payload: `value: ${oneLine(node.typeArguments[0].getText(file))}`,
                    description: '',
                });
                models.push({
                    name: model,
                    type: oneLine(node.typeArguments[0].getText(file)),
                    optional: true,
                    // React calls the model `value`
                    description:
                        reactProps.find((prop) => prop.name === (model === 'modelValue' ? 'value' : model))
                            ?.description ?? '',
                });
            }
        }
        node.forEachChild(visit);
    };
    visit(file);
    if (models.length) props = [...models, ...(props ?? [])];
    const described = props?.map((prop) => ({
        ...prop,
        description: prop.description || (reactProps.find((other) => other.name === prop.name)?.description ?? ''),
    }));
    return described?.length || slots.length || events.length
        ? { ...(described?.length ? { props: described } : {}), slots, events }
        : undefined;
}

const propOf = (file: ts.SourceFile, member: ts.PropertySignature): PropInfo => ({
    name: member.name.getText(file).replace(/^'|'$/g, ''),
    type: member.type?.getText(file).replace(/\s+/g, ' ') ?? 'unknown',
    optional: !!member.questionToken,
    description: docOf(member),
});

const memberProps = (file: ts.SourceFile, node: ts.InterfaceDeclaration): PropInfo[] =>
    node.members.filter(ts.isPropertySignature).map((member) => propOf(file, member));

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
            if (path) found = findInterface(path.endsWith('.vue') ? parseVueScript(path) : parse(path), name);
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
                            ...(inline ? {} : { vue: vueApi(source.fileName, name, props) }),
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
                        ...(inline ? {} : { vue: vueApi(module.fileName, name, props) }),
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
    // Vue: only the functions – its components are .vue files and share the React entries above
    const vueFunctions = collectComponents(vue).functions.sort((a, b) => a.name.localeCompare(b.name));
    return { components, functions, guides: collectGuides(), native: nativeData, vue: { functions: vueFunctions } };
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

export { outputs, stripMdx };
