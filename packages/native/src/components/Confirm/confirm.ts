import type { DialogStatus } from '@wirecore/wirelayer-recipes/native';
import type { IconComponent } from '../../utils/Icon.js';

export interface ConfirmOptions {
    title: string;
    description?: string;
    /** Text of the confirm button (default "Confirm") */
    confirmLabel?: string;
    /** Text of the cancel button (default "Cancel") – the safe choice, it gets the focus */
    cancelLabel?: string;
    /** `danger` colours the confirm button red */
    status?: DialogStatus;
    /** Icon component in the coloured box at the top */
    icon?: IconComponent;
    /** The user has to type this text first (e.g. the name of what is deleted) – the field gets the focus */
    typeToConfirm?: string;
    /** Centred (default), near the top or docked to the bottom edge */
    position?: 'center' | 'top' | 'bottom';
}

export interface PromptOptions extends Omit<ConfirmOptions, 'typeToConfirm'> {
    /** Label of the text field */
    label: string;
    defaultValue?: string;
    placeholder?: string;
    /** Error message for a value, or nothing when it is fine – checked when confirming */
    validate?: (value: string) => string | null | undefined;
}

export type ConfirmRequest = (({ kind: 'confirm' } & ConfirmOptions) | ({ kind: 'prompt' } & PromptOptions)) & {
    id: number;
    settle(confirmed: boolean, value?: string): void;
};

let nextId = 1;

let current: ConfirmRequest | null = null;
// Stays after the answer, so the dialog keeps its content while it fades out
let last: ConfirmRequest | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

/** One request at a time, shown by <ConfirmDialog /> */
export const confirmStore = {
    subscribe(listener: () => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
    get: () => current,
    last: () => last,
};

function open(request: ConfirmRequest) {
    // A newer request answers the pending one with "no"
    current?.settle(false);
    current = request;
    last = request;
    emit();
}

function finish(request: ConfirmRequest) {
    if (current !== request) return;
    current = null;
    emit();
}

/**
 * Asks for a confirmation in the app-wide <ConfirmDialog />: resolves with true, or false when cancelled (also the
 * back button, Escape or a newer confirm/prompt)
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
        const request: ConfirmRequest = {
            ...options,
            kind: 'confirm',
            id: nextId++,
            settle(confirmed) {
                finish(request);
                resolve(confirmed);
            },
        };
        open(request);
    });
}

/** Asks for a text in the app-wide <ConfirmDialog />: resolves with the value, or null when cancelled */
export function prompt(options: PromptOptions): Promise<string | null> {
    return new Promise((resolve) => {
        const request: ConfirmRequest = {
            ...options,
            kind: 'prompt',
            id: nextId++,
            settle(confirmed, value) {
                finish(request);
                resolve(confirmed ? (value ?? '') : null);
            },
        };
        open(request);
    });
}
