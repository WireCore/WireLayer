import type { OverlaySize } from '@wirecore/wirelayer-recipes/native';
import type { ReactNode } from 'react';

export interface DialogOptions<TResult = unknown> {
    title: string;
    description?: string;
    /** The content; `close(result)` closes the dialog and resolves its promise with the result */
    content: (close: (result?: TResult) => void, data: unknown) => ReactNode;
    /** Handed to `content` as the second argument */
    data?: unknown;
    size?: OverlaySize;
    /** Centred (default), near the top or docked to the bottom edge */
    position?: 'center' | 'top' | 'bottom';
    fullscreen?: boolean;
    /** `inside`: only the body scrolls */
    scrollBehavior?: 'inside' | 'outside';
    /** Shows the close button (default true) */
    closable?: boolean;
    /** Escape (web) and the back button close it (default true) */
    closeOnEscape?: boolean;
    /** A press on the dimmed background closes it (default true) */
    closeOnInteractOutside?: boolean;
}

/** The promise of an opened dialog (resolves with the result, undefined when dismissed) plus its controls */
export interface DialogHandle<TResult = unknown> extends Promise<TResult | undefined> {
    id: number;
    close(result?: TResult): void;
    update(changes: Partial<DialogOptions<TResult>>): void;
}

export interface DialogRequest extends DialogOptions<never> {
    id: number;
    open: boolean;
    settle(result: unknown): void;
}

let dialogs: DialogRequest[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const dialogStore = {
    subscribe(listener: () => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
    get: () => dialogs,
    /** Drops closed dialogs (after their exit animation) */
    removeClosed() {
        if (!dialogs.some((dialog) => !dialog.open)) return;
        dialogs = dialogs.filter((dialog) => dialog.open);
        emit();
    },
};

function change(id: number, changes: Partial<DialogRequest>) {
    dialogs = dialogs.map((dialog) => (dialog.id === id ? { ...dialog, ...changes } : dialog));
    emit();
}

/**
 * Opens a dialog in the app-wide <DialogHost /> from anywhere (no state in the screen): resolves with the value
 * passed to `close(result)`, or undefined when dismissed. Dialogs opened from a dialog stack on top of it.
 */
export function openDialog<TResult = unknown>(options: DialogOptions<TResult>): DialogHandle<TResult> {
    const id = nextId++;
    let settle: (result: TResult | undefined) => void = () => {};
    const promise = new Promise<TResult | undefined>((resolve) => {
        settle = resolve;
    });
    const close = (result?: TResult) => {
        if (!dialogs.some((dialog) => dialog.id === id && dialog.open)) return;
        change(id, { open: false });
        settle(result);
        setTimeout(() => dialogStore.removeClosed(), 400);
    };
    dialogs = [
        ...dialogs,
        { ...(options as DialogOptions<never>), id, open: true, settle: (result) => close(result as TResult) },
    ];
    emit();
    return Object.assign(promise, {
        id,
        close,
        update: (changes: Partial<DialogOptions<TResult>>) => change(id, changes as Partial<DialogRequest>),
    });
}

/** Closes every dialog of the DialogHost – their promises resolve with undefined */
export function closeAllDialogs() {
    for (const dialog of dialogs) if (dialog.open) dialog.settle(undefined);
}
