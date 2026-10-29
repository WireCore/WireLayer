import { tv } from './tv.js';

export const field = tv({
    slots: {
        base: 'flex flex-col gap-1.5',
        label: 'text-[13px] font-medium text-fg data-disabled:text-muted',
        /** Label and the (i) button of `labelHelp` side by side */
        labelRow: 'flex min-h-6 items-center gap-0.5',
        requiredIndicator: 'ms-0.5 text-danger',
        /** "(optional)" after the label */
        optionalIndicator: 'ms-1 font-normal text-muted',
        helperText: 'text-xs text-muted',
        errorText: 'text-xs text-danger',
        /** Confirmation below the control (`success`), with a check icon */
        successText: 'flex items-center gap-1 text-success',
        successIcon: 'size-3.5 shrink-0',
    },
});

/**
 * Loading spinner, clear button and status icon inside a text control (Input, PasswordInput, NumberInput …).
 * The clear button is no tab stop – keyboard users delete with the usual editing keys.
 */
export const inputStatusParts = {
    spinner: 'pointer-events-none shrink-0 self-center text-muted motion-safe:animate-spin',
    clear: [
        'flex shrink-0 cursor-pointer items-center justify-center self-center rounded-full text-muted transition-colors',
        'hover:bg-line hover:text-fg motion-reduce:transition-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
    ],
    clearIcon: 'size-3.5',
};

export const input = tv({
    slots: {
        base: 'flex w-full items-stretch overflow-hidden border border-line-strong bg-bg text-fg transition-colors focus-within:border-primary motion-reduce:transition-none',
        control: 'min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted disabled:cursor-not-allowed',
        icon: 'pointer-events-none shrink-0 self-center text-muted',
        statusIcon: 'pointer-events-none shrink-0 self-center text-danger',
        prefix: 'flex shrink-0 items-center border-e border-line-strong bg-bg-2 px-3 font-mono text-xs text-muted',
        suffix: 'flex shrink-0 items-center border-s border-line-strong bg-bg-2 px-3 font-mono text-xs text-muted',
        ...inputStatusParts,
    },
    variants: {
        size: {
            sm: {
                base: 'h-[var(--wc-control-h-sm,2rem)] rounded-[var(--wc-control-radius-sm,0.375rem)]',
                control: 'px-2.5 text-[length:var(--wc-control-text-sm,13px)]',
                icon: 'ms-2.5 size-3.5',
                statusIcon: 'me-2.5 size-3.5',
                spinner: 'me-2.5 size-3.5',
                clear: 'me-1 size-6',
            },
            md: {
                base: 'h-[var(--wc-control-h-md,2.5rem)] rounded-[var(--wc-control-radius-md,0.5rem)]',
                control: 'px-3 text-[length:var(--wc-control-text-md,15px)]',
                icon: 'ms-3 size-4',
                statusIcon: 'me-3 size-4',
                spinner: 'me-3 size-4',
                clear: 'me-1.5 size-6',
            },
            lg: {
                base: 'h-[var(--wc-control-h-lg,3rem)] rounded-[var(--wc-control-radius-lg,10px)]',
                control: 'px-4 text-[length:var(--wc-control-text-lg,1rem)] leading-normal',
                icon: 'ms-4 size-[18px]',
                statusIcon: 'me-4 size-[18px]',
                spinner: 'me-4 size-[18px]',
                clear: 'me-2.5 size-7',
            },
        },
        invalid: {
            true: { base: 'border-danger focus-within:border-danger' },
        },
        /** Confirmed value: green border and check icon (the text comes from Field `success`) */
        success: {
            true: { base: 'border-success focus-within:border-success', statusIcon: 'text-success' },
        },
        disabled: {
            true: { base: 'cursor-not-allowed border-line bg-bg-2 text-muted' },
        },
        hasIcon: {
            true: { control: 'ps-2' },
        },
        hasStatusIcon: {
            true: { control: 'pe-2' },
        },
        /** Monospace font of the theme – for paths, tokens, codes and keys */
        mono: {
            true: { control: 'font-mono' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

export const textarea = tv({
    base: [
        'block w-full resize-y rounded-[var(--wc-control-radius-md,0.5rem)] border border-line-strong bg-bg px-3 py-[9px] text-[length:var(--wc-control-text-md,15px)] leading-normal text-fg',
        'outline-none transition-colors placeholder:text-muted focus:border-primary motion-reduce:transition-none',
    ],
    variants: {
        size: {
            sm: 'rounded-[var(--wc-control-radius-sm,0.375rem)] px-2.5 py-1.5 text-[length:var(--wc-control-text-sm,13px)]',
            md: 'rounded-[var(--wc-control-radius-md,0.5rem)] px-3 py-[9px] text-[length:var(--wc-control-text-md,15px)]',
            lg: 'rounded-[var(--wc-control-radius-lg,10px)] px-4 py-3 text-[length:var(--wc-control-text-lg,1rem)] leading-normal',
        },
        invalid: {
            true: 'border-danger focus:border-danger',
        },
        /** Confirmed value: green border (the text comes from Field `success`) */
        success: {
            true: 'border-success focus:border-success',
        },
        disabled: {
            true: 'cursor-not-allowed resize-none border-line bg-bg-2 text-muted',
        },
        /** Grows with its text instead of scrolling */
        autoResize: {
            true: 'resize-none overflow-hidden',
        },
        /** Room for the spinner or clear button in the top corner */
        hasTrailing: {
            true: 'pe-10',
        },
        /** Monospace font of the theme – for keys, codes and logs */
        mono: {
            true: 'font-mono',
        },
    },
});

/** Wrapper of a Textarea with counter, spinner or clear button (the textarea itself keeps the `textarea` recipe) */
export const textareaParts = tv({
    slots: {
        base: 'relative flex w-full flex-col gap-1',
        trailing: 'absolute top-2 inset-e-2 flex items-center gap-1',
        ...inputStatusParts,
        spinner: [inputStatusParts.spinner, 'm-1 size-4'],
        clear: [inputStatusParts.clear, 'size-6'],
        statusIcon: 'pointer-events-none m-1 size-4 shrink-0 text-success',
        /** "12 / 200" below the textarea */
        counter: 'self-end font-mono text-[11px] text-muted tabular-nums',
        /** Announces the remaining characters after typing pauses */
        status: 'sr-only',
    },
});

/** List of form errors with links to the fields, shown (and focused) after submitting – WCAG 3.3.1 */
export const formErrorSummary = tv({
    slots: {
        base: [
            'flex flex-col gap-2 rounded-xl border-2 border-danger bg-card p-4 text-fg outline-none',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
        title: 'flex items-center gap-2 text-sm font-semibold',
        icon: 'size-4 shrink-0 text-danger',
        list: 'flex list-disc flex-col gap-1 ps-10 text-sm text-danger marker:text-danger',
        link: [
            'cursor-pointer rounded-sm underline underline-offset-2 hover:no-underline',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
    },
});
