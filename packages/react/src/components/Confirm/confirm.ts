import type { DialogPosition, DialogStatus } from '@wirecore/wirelayer-recipes';
import type { IconComponent } from '../../types.js';
import type { ButtonProps } from '../Button/Button.js';

/** Look of a button of the ConfirmDialog: variant, colour, size and shape, as on Button */
export type ConfirmButtonOptions = Pick<ButtonProps, 'variant' | 'color' | 'size' | 'shape'>;

export interface ConfirmOptions {
    title: string;
    description?: string;
    /** Label of the confirming button */
    confirmLabel?: string;
    /** Label of the cancelling button – it gets the focus (the safe choice) */
    cancelLabel?: string;
    /** "danger" turns the confirm button red */
    status?: DialogStatus;
    icon?: IconComponent;
    /**
     * The user has to type this text (e.g. the name of what gets deleted) before confirming – the field gets the
     * focus, a different text shows an error
     */
    typeToConfirm?: string;
    /** Where the dialog sits: centred (default), top, bottom, start or end */
    position?: DialogPosition;
    /** Look of the confirm button – wins over ConfirmDialog `confirmButton`, e.g. `{ size: 'md' }` */
    confirmButton?: ConfirmButtonOptions;
    /** Look of the cancel button – wins over ConfirmDialog `cancelButton` */
    cancelButton?: ConfirmButtonOptions;
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

let current: ConfirmRequest | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const confirmStore = {
    subscribe(listener: () => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
    get: () => current,
};

function ask<T>(
    request: Omit<ConfirmRequest, 'returnFocus' | 'settle'>,
    result: (confirmed: boolean, value?: string) => T
) {
    current?.settle(false);
    return new Promise<T>((resolve) => {
        const next = {
            ...request,
            returnFocus: typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null),
            settle: (confirmed: boolean, value?: string) => {
                if (current === next) {
                    current = null;
                    emit();
                }
                resolve(result(confirmed, value));
            },
        } as ConfirmRequest;
        current = next;
        emit();
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
