import {
    markdownElements,
    prose as proseRecipe,
    type MarkdownElement,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { createElement, useMemo, type ComponentProps, type ReactNode } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface MarkdownProps extends Omit<ComponentProps<'div'>, 'children'> {
    /** The Markdown text – rendered as elements, never as HTML (raw HTML in it stays text) */
    source: string;
    /** Heading level of `#` (default 2, so `#` fits below the page's h1) */
    headingLevel?: number;
    /** A single line break is a break (chat style) instead of a space */
    breaks?: boolean;
    /** target of links, e.g. "_blank" */
    linkTarget?: string;
    /** rel of links (default "noopener noreferrer nofollow") */
    linkRel?: string;
    /** A code block, e.g. with CodeHighlight (default: pre/code) */
    renderCode?: (code: { language?: string; code: string }) => ReactNode;
    /** Extra classes of the prose recipe (see the recipe) */
    classes?: RecipeClasses<typeof proseRecipe>;
}

// Element descriptions → React elements; the checked state of task items as default (read-only)
function toReact(node: MarkdownElement | string, key: number, renderCode: MarkdownProps['renderCode']): ReactNode {
    if (typeof node === 'string') return node;
    if (node.code && renderCode)
        return <div key={key}>{renderCode({ language: node.code.language, code: node.code.text })}</div>;
    const { checked, ...attrs } = node.attrs;
    const props: Record<string, unknown> = { ...attrs, key };
    if (checked !== undefined) props.defaultChecked = checked;
    const children = node.children.map((child, index) => toReact(child, index, renderCode));
    return createElement(node.tag, props, ...(children.length ? children : []));
}

/** Markdown as elements with the prose typography: headings, lists, links (rel), code, quotes, tables */
export function Markdown({
    source,
    headingLevel,
    breaks,
    linkTarget,
    linkRel,
    renderCode,
    classes,
    className,
    ...props
}: MarkdownProps) {
    const prose = useRecipe('prose', proseRecipe, classes);
    const elements = useMemo(
        () => markdownElements(source, { headingLevel, breaks, linkTarget, linkRel }),
        [source, headingLevel, breaks, linkTarget, linkRel]
    );
    return (
        <div {...props} className={prose({ class: className })}>
            {elements.map((node, index) => toReact(node, index, renderCode))}
        </div>
    );
}
