import { tv } from './tv.js';

// Rich-text editor (@wirecore/wirelayer-vue/editor, @wirecore/wirelayer-react/editor, Tiptap) and the typography of its HTML.

/** Typography for HTML from the editor – also for showing stored content elsewhere (`wc-prose`) */
export const prose = tv({
    base: [
        'text-[15px] leading-relaxed text-fg [&>:first-child]:mt-0 [&>:last-child]:mb-0',
        '[&_p]:my-2 [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-[-0.02em]',
        '[&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold',
        // Smaller headings (Markdown "###" and below)
        '[&_:is(h4,h5,h6)]:mt-3 [&_:is(h4,h5,h6)]:mb-1 [&_:is(h4,h5,h6)]:text-[15px] [&_:is(h4,h5,h6)]:font-semibold',
        // Aligned table columns (Markdown ":---:"), text alignment of the editor
        '[&_[data-align=center]]:text-center [&_[data-align=end]]:text-end',
        '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:ps-6 [&_li_p]:my-0.5',
        '[&_blockquote]:my-3 [&_blockquote]:border-s-2 [&_blockquote]:border-line-strong [&_blockquote]:ps-3 [&_blockquote]:text-muted',
        '[&_a]:text-fg [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-muted',
        '[&_code]:rounded [&_code]:bg-line [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.875em]',
        '[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-bg-2 [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0',
        '[&_hr]:my-4 [&_hr]:border-line',
        // Images: never wider than the text; the selected one gets an outline in the editor
        '[&_img]:my-3 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_img.ProseMirror-selectednode]:outline-2 [&_img.ProseMirror-selectednode]:outline-primary',
        // Tables: lines between the cells, header cells tinted, selected cells marked
        '[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm',
        '[&_td]:border [&_td]:border-line-2 [&_td]:px-2.5 [&_td]:py-1.5 [&_td]:align-top',
        '[&_th]:border [&_th]:border-line-2 [&_th]:bg-bg-2 [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:text-start [&_th]:font-semibold',
        '[&_:is(td,th)>p]:my-0 [&_.selectedCell]:bg-line',
        // Task lists: checkbox in front of each item
        '[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:ps-0',
        '[&_li[data-type=taskItem]]:flex [&_li[data-type=taskItem]]:items-start [&_li[data-type=taskItem]]:gap-2',
        '[&_li[data-type=taskItem]>label]:mt-1 [&_li[data-type=taskItem]>label]:flex [&_li[data-type=taskItem]>div]:min-w-0 [&_li[data-type=taskItem]>div]:flex-1',
        '[&_li[data-type=taskItem]_input]:size-4 [&_li[data-type=taskItem]_input]:accent-[var(--wc-primary)]',
        '[&_li[data-checked=true]>div]:text-muted [&_li[data-checked=true]>div]:line-through',
        // Collapsible sections (<details>) and the editor's details node
        '[&_details]:my-3 [&_details]:rounded-lg [&_details]:border [&_details]:border-line [&_details]:px-3 [&_details]:py-2',
        '[&_summary]:cursor-pointer [&_summary]:font-semibold',
        '[&_[data-type=details]]:my-3 [&_[data-type=details]]:flex [&_[data-type=details]]:gap-2 [&_[data-type=details]]:rounded-lg [&_[data-type=details]]:border [&_[data-type=details]]:border-line [&_[data-type=details]]:p-2',
        '[&_[data-type=details]>button]:mt-0.5 [&_[data-type=details]>button]:flex [&_[data-type=details]>button]:size-6 [&_[data-type=details]>button]:shrink-0 [&_[data-type=details]>button]:items-center [&_[data-type=details]>button]:justify-center [&_[data-type=details]>button]:rounded-md [&_[data-type=details]>button]:text-muted [&_[data-type=details]>button:hover]:bg-line',
        "[&_[data-type=details]>button]:before:content-['▸'] [&_[data-type=details].is-open>button]:before:content-['▾']",
        '[&_[data-type=details]>div]:min-w-0 [&_[data-type=details]>div]:flex-1 [&_[data-type=detailsSummary]]:font-semibold',
        // Mentions (@name) as a tinted token
        '[&_[data-type=mention]]:rounded-sm [&_[data-type=mention]]:bg-primary/15 [&_[data-type=mention]]:px-0.5 forced-colors:[&_[data-type=mention]]:outline forced-colors:[&_[data-type=mention]]:outline-1',
        // Sub- and superscript keep the line height
        '[&_sub]:leading-none [&_sup]:leading-none',
    ],
});

const focusRing = 'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg';

export const editor = tv({
    slots: {
        base: [
            'flex w-full flex-col overflow-hidden rounded-lg border border-line-strong bg-bg transition-colors motion-reduce:transition-none',
            'focus-within:border-primary data-invalid:border-danger data-disabled:bg-bg-2',
        ],
        toolbar: 'flex flex-wrap items-center gap-0.5 border-b border-line p-1',
        // 32 × 32 px targets; aria-pressed shows the formatting at the cursor
        tool: [
            'flex size-8 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-line hover:text-fg',
            'aria-pressed:bg-line aria-pressed:text-fg aria-expanded:bg-line aria-expanded:text-fg',
            'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
            focusRing,
        ],
        toolIcon: 'size-4',
        separator: 'mx-1 h-5 w-px bg-line',
        linkBar: 'flex flex-wrap items-center gap-2 border-b border-line p-2',
        /** Added to the input recipe's base for the address field */
        linkField: 'min-w-48 flex-1',
        /** Image bar: address, alternative text, "decorative" and upload */
        imageAlt: 'min-w-40 flex-1',
        fileInput: 'sr-only',
        // The editable area: Tiptap puts these classes on its contenteditable element
        content: 'min-h-40 px-3.5 py-3 outline-none data-disabled:cursor-not-allowed data-disabled:text-muted',
        /** Placeholder of an empty editor (Tiptap marks the empty first paragraph) */
        placeholder:
            '[&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-start [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-muted [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]',
        /** Marks for spaces, line breaks and paragraph ends (invisible characters tool) */
        invisible: [
            '[&_.tiptap-invisible-character]:pointer-events-none [&_.tiptap-invisible-character]:inline-block [&_.tiptap-invisible-character]:w-0 [&_.tiptap-invisible-character]:select-none',
            '[&_.tiptap-invisible-character]:before:inline-block [&_.tiptap-invisible-character]:before:w-0 [&_.tiptap-invisible-character]:before:text-muted',
            "[&_.tiptap-invisible-character--space]:before:content-['·'] [&_.tiptap-invisible-character--break]:before:content-['¬'] [&_.tiptap-invisible-character--paragraph]:before:content-['¶']",
        ],
        /** Image being uploaded: shown faded until its address is there */
        uploading: 'pointer-events-none opacity-50 motion-safe:animate-pulse',
        /** HTML source mode */
        source: [
            'block min-h-40 w-full resize-y border-0 bg-bg px-3.5 py-3 font-mono text-[13px] leading-relaxed text-fg outline-none',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg',
        ],
        /** Bubble menu (text selected) and floating menu (empty line) */
        menu: 'z-20 flex items-center gap-0.5 rounded-popup border border-line bg-card p-1 shadow-[0_8px_24px_-12px_rgba(0,0,0,.35)]',
        /** Colour choice: swatches in a row */
        palette: 'flex flex-wrap items-center gap-1 border-b border-line p-2',
        paletteLabel: 'me-1 text-xs text-muted',
        swatch: [
            'flex size-7 cursor-pointer items-center justify-center rounded-md border border-line text-sm font-semibold',
            'aria-pressed:outline-2 aria-pressed:outline-offset-1 aria-pressed:outline-primary',
            focusRing,
        ],
        /** Characters and words below the editor */
        footer: 'flex items-center justify-end gap-3 border-t border-line px-3 py-1.5 text-xs text-muted tabular-nums',
        limit: 'data-[over=true]:text-danger',
        /** Table of contents beside or above the editor */
        toc: 'flex flex-col gap-1 border-b border-line px-3.5 py-2 text-sm',
        tocTitle: 'font-mono text-[10px] tracking-label text-muted uppercase',
        tocList: 'm-0 flex list-none flex-col gap-0.5 p-0',
        tocLink: [
            'cursor-pointer rounded-sm text-start text-fg underline-offset-2 hover:underline data-[level=3]:ps-3 data-[level=4]:ps-6',
            focusRing,
        ],
        /** Suggestions for mentions (listbox below the caret) */
        suggestions: 'fixed z-50 max-h-60 w-64 overflow-y-auto rounded-popup border border-line bg-card p-1 shadow-lg',
        suggestion: [
            'flex min-h-8 cursor-pointer items-center rounded-lg px-2 text-sm text-fg',
            'data-highlighted:bg-line forced-colors:data-highlighted:bg-[Highlight] forced-colors:data-highlighted:text-[HighlightText]',
        ],
        status: 'sr-only',
    },
    variants: {
        /** The toolbar stays at the top while the page scrolls (top offset: --wc-editor-top) */
        sticky: {
            true: {
                base: 'overflow-visible',
                toolbar: 'sticky top-[var(--wc-editor-top,0px)] z-10 rounded-t-lg bg-bg',
            },
        },
    },
});

/**
 * Code with syntax colours (CodeHighlight, `@wirecore/wirelayer-vue/code`): Shiki's CSS-variables theme reads the token
 * colours from these variables, so the code follows the theme and mode.
 */
const codeColors = [
    '[--wc-code-foreground:var(--wc-fg)] [--wc-code-token-comment:var(--wc-muted)] [--wc-code-token-punctuation:var(--wc-muted)]',
    '[--wc-code-token-keyword:var(--wc-danger)] [--wc-code-token-string:var(--wc-success)] [--wc-code-token-string-expression:var(--wc-success)]',
    '[--wc-code-token-constant:var(--wc-info)] [--wc-code-token-function:var(--wc-info)] [--wc-code-token-parameter:var(--wc-warn)] [--wc-code-token-link:var(--wc-info)]',
];

export const codeHighlight = tv({
    slots: {
        base: ['flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-card text-fg', ...codeColors],
        header: 'flex min-h-10 items-center gap-2 border-b border-line ps-3 pe-1.5',
        title: 'min-w-0 flex-1 truncate font-mono text-xs text-fg',
        language: 'ms-auto font-mono text-[10px] tracking-label text-muted uppercase',
        // Scrollable code: one tab stop so keyboard users can scroll it
        pre: [
            'm-0 overflow-auto py-3 font-mono text-[13px] leading-relaxed outline-none',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg',
        ],
        code: 'grid min-w-max',
        line: 'flex px-3 data-highlighted:bg-primary/8 data-highlighted:shadow-[inset_2px_0_0_var(--wc-primary)]',
        lineNumber: 'w-6 shrink-0 pe-4 text-end text-muted tabular-nums select-none',
        // Empty lines keep their height
        lineContent: 'min-h-lh whitespace-pre',
        /** Icon of the file type before the file name */
        fileIcon: 'size-4 shrink-0 text-muted',
        /** Toggle buttons in the header (line wrapping) */
        tool: [
            'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-line hover:text-fg',
            'aria-pressed:bg-line aria-pressed:text-fg',
            focusRing,
        ],
        toolIcon: 'size-4',
        /** "+" or "−" in front of a changed line (diff) */
        diffMarker: 'w-4 shrink-0 text-muted select-none',
        srOnly: 'sr-only',
        /** Long code, collapsed: faded at the bottom, a button below shows everything */
        expand: 'flex justify-center border-t border-line p-1.5',
    },
    variants: {
        /** Long lines wrap instead of scrolling */
        wrap: {
            true: { code: 'min-w-0', lineContent: 'break-words whitespace-pre-wrap' },
        },
        collapsed: {
            true: { pre: 'overflow-hidden [mask-image:linear-gradient(to_bottom,#000_70%,transparent)]' },
        },
    },
});

/** Kind of a diff line: its background and marker */
export const codeDiffLine = tv({
    base: 'flex px-3',
    variants: {
        diff: {
            add: 'bg-success/10 shadow-[inset_2px_0_0_var(--wc-success)] forced-colors:border-s-2',
            remove: 'bg-danger/10 shadow-[inset_2px_0_0_var(--wc-danger)] forced-colors:border-s-2 forced-colors:border-dashed',
        },
    },
});

/** Several files in one block: tabs with the file names above the code */
export const codeTabs = tv({
    slots: {
        base: 'flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-card text-fg',
        header: 'flex min-h-10 items-end gap-2 border-b border-line ps-1.5 pe-1.5',
        list: 'flex min-w-0 flex-1 items-end gap-0.5 overflow-x-auto',
        tab: [
            'relative -mb-px flex h-10 shrink-0 cursor-pointer items-center gap-1.5 border-b-2 border-transparent px-3 font-mono text-xs text-muted',
            'hover:text-fg aria-selected:border-primary aria-selected:text-fg forced-colors:aria-selected:border-[Highlight]',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg',
        ],
        tabIcon: 'size-3.5 shrink-0',
        actions: 'flex shrink-0 items-center self-center',
        panel: 'outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg',
        /** The code block inside a tab has no frame of its own */
        panelCode: 'rounded-none border-0',
    },
});

/** Highlighted code inside a sentence */
export const inlineCode = tv({
    base: [
        'rounded-md border border-line bg-bg-2 px-1.5 py-0.5 font-mono text-[0.875em] text-fg [overflow-wrap:anywhere]',
        ...codeColors,
    ],
});

/**
 * Tokens the editor offers as text and background colours – every text colour meets 4.5:1 on the page and card
 * surfaces and on every background colour (pairs in the token contrast test of @wirecore/wirelayer-tokens)
 */
export const editorColorTokens = ['primary', 'info', 'success', 'warn', 'danger', 'muted'] as const;
export type EditorColorToken = (typeof editorColorTokens)[number];

/**
 * CSS value of an editor colour: text in the token colour moved a quarter towards the text colour, background as a
 * 20 % tint – so coloured text stays readable on every background colour. Stored in the HTML with `var(--wc-…)`, so
 * it follows theme and mode. Content of earlier versions (`var(--wc-…)` text, 25 % tint) is still read.
 */
export function editorColorValue(token: EditorColorToken, kind: 'text' | 'background'): string {
    return kind === 'text'
        ? `color-mix(in srgb, var(--wc-${token}) 75%, var(--wc-fg))`
        : `color-mix(in oklab, var(--wc-${token}) 20%, transparent)`;
}

/** The token of a stored colour value, if it is one of ours */
export function editorColorToken(value: string | undefined | null): EditorColorToken | undefined {
    const match = /var\(--wc-([a-z]+)\)/.exec(value ?? '');
    return editorColorTokens.find((token) => token === match?.[1]);
}

/** Words and characters of a text (words: runs of letters/digits, as in most word processors) */
export function countText(text: string): { characters: number; words: number } {
    return {
        characters: [...text].length,
        words: text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)?.length ?? 0,
    };
}

/** Slug of a heading for the table of contents (stable, unique with the index) */
export function headingSlug(text: string, index: number): string {
    const slug = text
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    return `${slug || 'abschnitt'}-${index + 1}`;
}

/**
 * Cleans HTML from the source mode before it goes into the editor: drops scripts, styles, frames, objects, event
 * handlers (on…), `javascript:`/`data:` addresses (except data images) and inline styles other than our colours and
 * text alignment. Uses the browser's parser (DOMParser) – the editor's schema drops unknown tags afterwards.
 */
export function sanitizeEditorHtml(html: string): string {
    if (typeof DOMParser === 'undefined') return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll(
        'script, style, iframe, frame, frameset, object, embed, link, meta, base, form, noscript, template'
    ).forEach((node) => node.remove());
    for (const element of doc.body.querySelectorAll('*')) {
        for (const attribute of [...element.attributes]) {
            const name = attribute.name.toLowerCase();
            const value = attribute.value.trim().toLowerCase().replace(/\s+/g, '');
            if (name.startsWith('on') || name === 'srcdoc' || name === 'formaction')
                element.removeAttribute(attribute.name);
            else if (['href', 'src', 'xlink:href', 'action', 'poster', 'background'].includes(name)) {
                const image = name === 'src' && /^data:image\/(png|jpe?g|gif|webp|avif);/.test(value);
                if (/^(javascript|vbscript|data):/.test(value) && !image) element.removeAttribute(attribute.name);
            } else if (name === 'style') {
                const kept = attribute.value
                    .split(';')
                    .map((declaration) => declaration.trim())
                    .filter(
                        (declaration) =>
                            /^(color|background-color):\s*(var\(--wc-[a-z]+\)|color-mix\(in oklab, var\(--wc-[a-z]+\) (25|20)%, transparent\)|color-mix\(in srgb, var\(--wc-[a-z]+\) 75%, var\(--wc-fg\)\))$/.test(
                                declaration
                            ) || /^text-align:\s*(left|right|center|justify|start|end)$/.test(declaration)
                    );
                if (kept.length) element.setAttribute('style', kept.join('; '));
                else element.removeAttribute('style');
            }
        }
    }
    return doc.body.innerHTML;
}
