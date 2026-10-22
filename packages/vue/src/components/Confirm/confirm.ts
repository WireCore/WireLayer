import type { DialogPosition, DialogStatus } from '@wirecore/wirelayer-recipes';
import { shallowRef, type Component } from 'vue';

export interface ConfirmOptions {
    title: string;
    description?: string;
    /** Label of the confirming button */
    confirmLabel?: string;
    /** Label of the cancelling button – it gets the focus (the safe choice) */
    cancelLabel?: string;
    /** "danger" turns the confirm button red */
    status?: DialogStatus;
    icon?: Component;
    /**
     * The user has to type this text (e.g. the name of what gets deleted) before confirming – the field gets the
     * focus, a different text shows an error
     */
    typeToConfirm?: string;
    /** Where the dialog sits: centred (default), top, bottom, start or end */
    position?: DialogPosition;
}

export interface PromptOptions extends Omit<ConfirmOptions, 'typeToConfirm'> {
    /** Label of the text field */
    label: string;
    defaultValue?: string;
    placeholder?: string;
    /** Error message for an invalid value (shown on submit and while correcting), nothing when it is valid */
    validate?: (value: string) => string | null | undefined;
}

export type ConfirmRequest = (({ kind: 'confirm' } & ConfirmOptions) | ({ kind: 'prompt' } & PromptOptions)) & {
    /** Focused before the dialog opened – gets the focus back */
    returnFocus: HTMLElement | null;
    /** Finishes the request: confirm() resolves with `confirmed`, prompt() with the value or null */
    settle: (confirmed: boolean, value?: string) => void;
};

/** The open request, rendered by <ConfirmDialog /> */
export const confirmRequest = shallowRef<ConfirmRequest | null>(null);

function ask<T>(
    request: Omit<ConfirmRequest, 'returnFocus' | 'settle'>,
    result: (confirmed: boolean, value?: string) => T
) {
    confirmRequest.value?.settle(false);
    return new Promise<T>((resolve) => {
        const current = {
            ...request,
            returnFocus: typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null),
            settle: (confirmed: boolean, value?: string) => {
                if (confirmRequest.value === current) confirmRequest.value = null;
                resolve(result(confirmed, value));
            },
        } as ConfirmRequest;
        confirmRequest.value = current;
    });
}

/**
 * Asks for confirmation in the app-wide <ConfirmDialog />. Resolves with true (confirmed) or false
 * (cancelled, Escape, a newer confirm()).
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
    return ask({ ...options, kind: 'confirm' }, (confirmed) => confirmed);
}

/**
 * Asks for a text in the app-wide <ConfirmDialog />. Resolves with the (valid) text, or null when cancelled.
 */
export function prompt(options: PromptOptions): Promise<string | null> {
    return ask({ ...options, kind: 'prompt' }, (confirmed, value) => (confirmed ? (value ?? '') : null));
}
