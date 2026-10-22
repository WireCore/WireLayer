import {
    createToaster as createArkToaster,
    type CreateToasterProps,
    type CreateToasterReturn,
} from '@ark-ui/react/toast';
import { toastDuration } from '@wirecore/wirelayer-recipes';
import type { ReactNode } from 'react';

type Store = CreateToasterReturn<ReactNode>;
export type ToastOptions = Parameters<Store['create']>[0];
/** Placement (6 positions), `max` (more wait in a queue, by priority), `overlap` (stacked, fanned out on hover) … */
export type ToasterOptions = Partial<CreateToasterProps>;
/** A text (the title) or the options of a toast */
export type ToastContent = string | Omit<ToastOptions, 'type'>;

export interface ToastPromiseOptions<T> {
    /** While the promise is pending (stays until it settles) */
    loading: ToastContent;
    /** When it resolves – a text, options, or a function of the result */
    success?: ToastContent | ((value: T) => ToastContent);
    /** When it rejects – a text, options, or a function of the error */
    error?: ToastContent | ((error: unknown) => ToastContent);
}

export interface ToastFunction {
    /**
     * Shows a toast and returns its id. Toasts with an action stay until dismissed (WCAG 2.2.1 – nobody should
     * miss an action because it timed out); all others disappear after 6 seconds.
     */
    (options: ToastOptions): string;
    /** One toast that follows a promise: loading → success or error. Returns its id */
    promise<T>(promise: Promise<T> | (() => Promise<T>), options: ToastPromiseOptions<T>): string | undefined;
    /** Changes an open toast (title, description, type …) */
    update(id: string, options: Partial<ToastOptions>): void;
    /** Closes a toast – without an id all of them */
    dismiss(id?: string): void;
}

const toOptions = (content: ToastContent) => (typeof content === 'string' ? { title: content } : content);
const timed = (content: ToastContent) => {
    const options = toOptions(content);
    return { ...options, duration: toastDuration(options) };
};

/**
 * A toaster of its own, e.g. for a second position on the screen: `const { toaster, toast } = createToaster({
 * placement: 'top' })`, rendered by `<Toaster :toaster="toaster" />`.
 */
export function createToaster(options: ToasterOptions = {}): {
    toaster: CreateToasterReturn<ReactNode>;
    toast: ToastFunction;
} {
    const toaster: Store = createArkToaster({ placement: 'bottom-end', gap: 12, max: 5, ...options });
    const toast = ((toastOptions: ToastOptions) =>
        toaster.create({ ...toastOptions, duration: toastDuration(toastOptions) })) as ToastFunction;
    toast.promise = (promise, { loading, success, error }) =>
        toaster.promise(promise, {
            loading: { ...toOptions(loading), duration: Infinity },
            success:
                success === undefined
                    ? undefined
                    : (value) => timed(typeof success === 'function' ? success(value) : success),
            error:
                error === undefined
                    ? undefined
                    : (reason) => timed(typeof error === 'function' ? error(reason) : error),
        })?.id;
    toast.update = (id, changes) => {
        toaster.update(id, {
            ...changes,
            duration: changes.duration ?? (changes.type === 'loading' ? Infinity : toastDuration(changes)),
        });
    };
    toast.dismiss = (id) => {
        toaster.dismiss(id);
        // Ark ignores dismiss() for a toast that was updated from "loading" to another type – remove it then
        if (id !== undefined)
            setTimeout(() => {
                if (toaster.isVisible(id)) toaster.remove(id);
            }, toaster.attrs.removeDelay + 200);
    };
    return { toaster, toast };
}

/** The app-wide toaster rendered by <Toaster /> and its toast() */
export const { toaster, toast } = createToaster();
