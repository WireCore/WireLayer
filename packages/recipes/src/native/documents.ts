import { pressable, tv } from './tv.js';

// PdfViewer (react-native-pdf) and CodeHighlight for React Native.

export const pdfViewer = tv({
    slots: {
        base: 'w-full overflow-hidden rounded-xl border border-line bg-bg-2',
        toolbar:
            'min-h-12 flex-row flex-wrap items-center justify-between gap-1 border-b border-line bg-card px-1.5 py-1',
        group: 'flex-row items-center gap-0.5',
        status: 'min-w-24 px-1 text-center font-mono text-xs text-fg',
        zoom: 'min-w-12 px-1 text-center font-mono text-xs text-muted',
        document: 'min-h-80 flex-1 bg-bg-2',
        /** The pages of react-native-pdf fill the document area */
        pdf: 'flex-1 bg-bg-2',
        state: 'min-h-48 flex-1 items-center justify-center gap-3 p-6',
        stateText: 'text-center font-sans text-sm leading-[22px] text-muted',
        errorText: 'text-center font-sans text-sm leading-[22px] text-danger',
        spinner: 'text-muted',
    },
});

export const codeHighlight = tv({
    slots: {
        base: 'w-full overflow-hidden rounded-xl border border-line bg-bg-2',
        header: 'min-h-11 flex-row items-center justify-between gap-2 border-b border-line bg-card py-1 pr-1 pl-3',
        title: 'min-w-0 shrink font-mono text-xs text-muted',
        actions: 'flex-row items-center gap-0.5',
        scroll: 'w-full',
        scrollContent: 'min-w-full',
        body: 'py-3',
        line: 'min-h-5 flex-row pr-4',
        number: 'w-10 pr-3 text-right font-mono text-[13px] leading-5 text-muted',
        code: 'font-mono text-[13px] leading-5 text-fg',
        more: ['h-11 items-center justify-center border-t border-line', pressable],
        moreText: 'font-sans-medium text-sm text-fg',
        /** Colours of the Shiki tokens (same mapping as the web: keyword danger, string success …) */
        tokenKeyword: 'text-danger',
        tokenString: 'text-success',
        tokenConstant: 'text-info',
        tokenParameter: 'text-warn',
        tokenComment: 'text-muted',
        tokenItalic: 'italic',
    },
    variants: {
        highlighted: {
            true: { line: 'bg-primary/5' },
        },
        added: {
            true: { line: 'bg-success/10' },
        },
        removed: {
            true: { line: 'bg-danger/10' },
        },
        wrap: {
            true: { line: 'flex-1', code: 'flex-1' },
        },
    },
});
