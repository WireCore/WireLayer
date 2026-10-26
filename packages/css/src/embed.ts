// WireLayer inside a page that brings its own CSS (WordPress admin, a host app …): the compiled CSS is scoped to one
// element and leaves the rest of the page alone.
//   - no @layer – unlayered CSS of the host would win over every layered rule, whatever its specificity
//   - components get the scope as ancestor (#scope .wc-button), so an id scope outranks the host's element and class
//     rules
//   - preflight, theme and base styles apply to the scope element and everything inside it; :root, :host, html and
//     body become the scope element (data-mode and data-theme work on it as they do on <html>)
// The build writes the parts with the placeholder #wirelayer-scope, `wirelayer-css embed` puts in the app's selector.
import { transform, type Selector, type SelectorComponent } from 'lightningcss';

export const scopePlaceholder = 'wirelayer-scope';
const scope: SelectorComponent = { type: 'id', name: scopePlaceholder };
const descendant: SelectorComponent = { type: 'combinator', value: 'descendant' };

const isRoot = (part: SelectorComponent) =>
    (part.type === 'pseudo-class' && (part.kind === 'root' || part.kind === 'host')) ||
    (part.type === 'type' && (part.name === 'html' || part.name === 'body'));

/** :root, :host, html and body – also inside :where(), :not() … – become the scope element */
const rootToScope = (selector: Selector): Selector =>
    selector.map((part) => {
        if (isRoot(part)) return scope;
        if (part.type === 'pseudo-class' && ['is', 'where', 'not', 'has'].includes(part.kind) && 'selectors' in part)
            return { ...part, selectors: (part.selectors as Selector[]).map(rootToScope) } as SelectorComponent;
        return part;
    });

const hasScope = (selector: Selector) => selector.some((part) => part.type === 'id' && part.name === scopePlaceholder);

/** The scope element or anything inside it – :is() counts like the id, so it still outranks the host's rules */
const inScope: SelectorComponent = {
    type: 'pseudo-class',
    kind: 'is',
    selectors: [[scope], [scope, descendant, { type: 'universal' }]],
};

/** Adds :is(#scope, #scope *) to the subject, before its pseudo-elements (::before, ::placeholder must come last) */
const subjectInScope = (selector: Selector): Selector => {
    const last = selector.findLastIndex((part) => part.type === 'combinator');
    const pseudo = selector.findIndex((part, index) => index > last && part.type === 'pseudo-element');
    const at = pseudo === -1 ? selector.length : pseudo;
    return [...selector.slice(0, at), inScope, ...selector.slice(at)];
};

/**
 * Scopes compiled CSS: every @layer is dissolved into its rules, every selector gets the scope – components only
 * inside it, base styles (preflight, theme) also on the scope element itself.
 */
export function scopeCss(css: string, kind: 'components' | 'base'): string {
    // Only the selectors are visited: a whole rule does not survive the way back from JavaScript (lightningcss 1.32
    // fails on declarations with var())
    const { code } = transform({
        filename: 'embed.css',
        code: Buffer.from(dissolveLayers(css)),
        minify: true,
        visitor: {
            Selector(original) {
                const selector = rootToScope(original);
                if (hasScope(selector)) return selector;
                return kind === 'components' ? [scope, descendant, ...selector] : subjectInScope(selector);
            },
        },
    });
    return code.toString();
}

/** Removes `@layer a, b;` and replaces every `@layer a {…}` (also nested ones) with its content */
function dissolveLayers(css: string): string {
    for (let at = css.indexOf('@layer'); at !== -1; at = css.indexOf('@layer', at)) {
        const end = at + css.slice(at).search(/[;{]/);
        if (css[end] === ';') {
            css = css.slice(0, at) + css.slice(end + 1);
        } else {
            const close = closingBrace(css, end);
            css = css.slice(0, at) + css.slice(end + 1, close) + css.slice(close + 1);
        }
    }
    return css;
}

/** Index of the brace that closes the one at `open` (skipping strings) */
function closingBrace(css: string, open: number): number {
    let depth = 0;
    let quote = '';
    for (let i = open; i < css.length; i++) {
        const char = css[i];
        if (quote) {
            if (char === '\\') i++;
            else if (char === quote) quote = '';
        } else if (char === '"' || char === "'") quote = char;
        else if (char === '{') depth++;
        else if (char === '}' && --depth === 0) return i;
    }
    throw new Error(`Unbalanced braces after position ${open}`);
}

/** Cuts the blocks `@layer <prefix><name> {…}` out of compiled CSS: their content by name and the rest */
export function splitLayers(css: string, prefix: string) {
    const parts = new Map<string, string>();
    const marker = `@layer ${prefix}`;
    let rest = '';
    let from = 0;
    for (let at = css.indexOf(marker); at !== -1; at = css.indexOf(marker, from)) {
        const open = css.indexOf('{', at);
        const close = closingBrace(css, open);
        rest += css.slice(from, at);
        parts.set(css.slice(at + marker.length, open).trim(), css.slice(open + 1, close));
        from = close + 1;
    }
    return { parts, rest: rest + css.slice(from) };
}
