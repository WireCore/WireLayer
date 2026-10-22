import type { DialogPosition, OverlaySize } from '@wirecore/wirelayer-recipes';
import type { ReactNode } from 'react';

export interface DialogOptions<TResult = unknown> {
    title: string;
    description?: string;
    /** Rendered in the dialog; call `close(result)` to finish. `data` is the data passed to openDialog */
    content: (close: (result?: TResult) => void, data: unknown) => ReactNode;
    /** Data for the content – the second argument of `content` */
    data?: unknown;
    /** Maximum width (sm, md = 400px, lg, xl, full) */
    size?: OverlaySize;
    /** Where the dialog sits: centred (default), top, bottom, start or end */
    position?: DialogPosition;
    /** Covers the whole screen */
    fullscreen?: boolean;
    /** `inside`: only the body scrolls */
    scrollBehavior?: 'inside' | 'outside';
    /** Shows the close button (default true) */
    closable?: boolean;
    /** Escape closes the dialog (default true) */
    closeOnEscape?: boolean;
    /** A click outside closes the dialog (default true) */
    closeOnInteractOutside?: boolean;
}

export interface DialogRequest extends DialogOptions<never> {
    id: number;
    open: boolean;
    /** Focused before the dialog opened – gets the focus back */
    returnFocus: HTMLElement | null;
    settle: (result: unknown) => void;
}

/** The result of openDialog(): a promise of the result that can also close or change the dialog */
export interface DialogHandle<TResult> extends Promise<TResult | undefined> {
    id: number;
    /** Closes the dialog; the promise resolves with `result` */
    close: (result?: TResult) => void;
    /** Changes title, description, content, data, size … of the open dialog */
    update: (changes: Partial<DialogOptions<TResult>>) => void;
}

let stack: DialogRequest[] = [];
let nextId = 0;
const listeners = new Set<() => void>();
const set = (next: DialogRequest[]) => {
    stack = next;
    listeners.forEach((listener) => listener());
};
const replace = (request: DialogRequest) =>
    set(stack.map((entry) => (entry.id === request.id ? { ...request } : entry)));

/** Open dialogs (a dialog may open another), rendered by <DialogHost /> */
export const dialogStore = {
    subscribe(listener: () => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
    get: () => stack,
    /** Removes a closed dialog once its closing animation has ended */
    remove: (id: number) => set(stack.filter((entry) => entry.id !== id)),
    /** Removes all closed dialogs (the host unmounts before their closing animation ends) */
    removeClosed: () => set(stack.filter((entry) => entry.open)),
};

/**
 * Opens content in a dialog of the app-wide <DialogHost />. Resolves with what the content passes to
 * `close(result)`, or undefined when closed with Escape or the close button. The returned promise also has
 * `close(result)` and `update(changes)`; dialogs opened from a dialog stack on top of it.
 */
export function openDialog<TResult = unknown>(options: DialogOptions<TResult>): DialogHandle<TResult> {
    let request!: DialogRequest;
    const promise = new Promise<TResult | undefined>((resolve) => {
        request = {
            ...(options as DialogOptions<never>),
            id: nextId++,
            open: true,
            returnFocus: typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null),
            settle: (result) => {
                if (!request.open) return;
                // Closed first (animation), removed when the animation ends
                request.open = false;
                replace(request);
                resolve(result as TResult | undefined);
            },
        };
        set([...stack, request]);
    });
    return Object.assign(promise, {
        id: request.id,
        close: (result?: TResult) => request.settle(result),
        update: (changes: Partial<DialogOptions<TResult>>) => {
            if (!request.open) return;
            Object.assign(request, changes);
            replace(request);
        },
    });
}

/** Closes all dialogs of the <DialogHost />; their promises resolve with undefined */
export function closeAllDialogs() {
    for (const request of stack) request.settle(undefined);
}
