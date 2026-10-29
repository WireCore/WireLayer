/**
 * What the text fields expose (Input, PasswordInput, NumberInput, Textarea, MaskInput): the native element and its
 * focus and selection methods – the root of these components is a wrapper, not the input
 */
export interface TextFieldHandle<E extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement> {
    /** The native input (or textarea); null before mounting */
    readonly element: E | null;
    focus(options?: FocusOptions): void;
    blur(): void;
    /** Selects the whole text */
    select(): void;
    setSelectionRange(start: number | null, end: number | null, direction?: 'forward' | 'backward' | 'none'): void;
}

/** The handle for a component's defineExpose, reading the element when called */
export function textFieldHandle<E extends HTMLInputElement | HTMLTextAreaElement>(
    element: () => E | null | undefined
): TextFieldHandle<E> {
    return {
        get element() {
            return element() ?? null;
        },
        focus: (options) => element()?.focus(options),
        blur: () => element()?.blur(),
        select: () => element()?.select(),
        setSelectionRange: (start, end, direction) => element()?.setSelectionRange(start, end, direction),
    };
}
