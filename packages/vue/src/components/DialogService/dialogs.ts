import type { DialogPosition, OverlaySize } from '@wirecore/wirelayer-recipes';
import { shallowRef, type Component } from 'vue';

export interface DialogOptions {
    title: string;
    description?: string;
    /** Rendered in the dialog; gets the props, `data` and `close(result)` to finish */
    component: Component;
    props?: Record<string, unknown>;
    /** Data for the component – passed as its `data` prop */
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

export interface DialogRequest extends DialogOptions {
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
    /** Changes title, description, props, data, size … of the open dialog */
    update: (changes: Partial<DialogOptions>) => void;
}

/** Open dialogs (a dialog may open another), rendered by <DialogHost /> */
export const dialogStack = shallowRef<DialogRequest[]>([]);
let nextId = 0;

const replace = (request: DialogRequest) => {
    dialogStack.value = dialogStack.value.map((entry) => (entry.id === request.id ? { ...request } : entry));
};

/**
 * Opens a component in a dialog of the app-wide <DialogHost />. Resolves with what the component passes to
 * `close(result)`, or undefined when closed with Escape or the close button. The returned promise also has
 * `close(result)` and `update(changes)`; dialogs opened from a dialog stack on top of it.
 */
export function openDialog<TResult = unknown>(options: DialogOptions): DialogHandle<TResult> {
    let request!: DialogRequest;
    const promise = new Promise<TResult | undefined>((resolve) => {
        request = {
            ...options,
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
        dialogStack.value = [...dialogStack.value, request];
    });
    return Object.assign(promise, {
        id: request.id,
        close: (result?: TResult) => request.settle(result),
        update: (changes: Partial<DialogOptions>) => {
            if (!request.open) return;
            Object.assign(request, changes);
            replace(request);
        },
    });
}

/** Closes all dialogs of the <DialogHost />; their promises resolve with undefined */
export function closeAllDialogs() {
    for (const request of dialogStack.value) request.settle(undefined);
}

/** Removes a closed dialog once its closing animation has ended */
export function removeDialog(id: number) {
    dialogStack.value = dialogStack.value.filter((entry) => entry.id !== id);
}

/** Removes all closed dialogs (the host unmounts before their closing animation ends) */
export function removeClosedDialogs() {
    dialogStack.value = dialogStack.value.filter((entry) => entry.open);
}
