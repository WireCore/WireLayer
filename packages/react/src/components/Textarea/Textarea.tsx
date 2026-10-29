import { Field, useFieldContext } from '@ark-ui/react/field';
import {
    setTextControlValue,
    textarea as textareaRecipe,
    textareaParts as textareaPartsRecipe,
    type RecipeClasses,
    type Size,
} from '@wirecore/wirelayer-recipes';
import { useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState, type ComponentProps } from 'react';
import { useFieldStatus } from '../Field/context.js';
import { InputStatus } from '../Input/InputStatus.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface TextareaProps extends ComponentProps<'textarea'> {
    size?: Size;
    /** Marks the textarea as invalid (also inherited from a surrounding Field) */
    invalid?: boolean;
    /** Confirmed value: green border and check icon (also inherited from a Field with `success`) */
    success?: boolean;
    /** Grows with its text instead of scrolling (rows stays the minimum) */
    autoResize?: boolean;
    /** With autoResize: at least this many rows */
    minRows?: number;
    /** With autoResize: at most this many rows, then it scrolls */
    maxRows?: number;
    /**
     * Counter "12 / 200" below the field (needs `maxLength`); the remaining characters are announced once typing
     * pauses, not on every character
     */
    showCount?: boolean;
    /** Shows a spinner in the corner and marks the field busy (aria-busy) */
    loading?: boolean;
    /** Shows a button that empties the field while it has text */
    clearable?: boolean;
    /** Accessible name of the clear button (default "Clear input") */
    clearLabel?: string;
    /** Monospace font of the theme (JetBrains Mono) – for keys, codes and logs */
    mono?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipes textarea and textareaParts) */
    classes?: RecipeClasses<typeof textareaRecipe> & RecipeClasses<typeof textareaPartsRecipe>;
}

/**
 * Multi-line text field, optionally growing with the text (autoResize) and with a counter; works inside Field. `ref`
 * reaches the native textarea
 */
export function Textarea({
    classes,
    size,
    invalid = false,
    success = false,
    disabled = false,
    autoResize = false,
    minRows,
    maxRows,
    showCount = false,
    loading = false,
    clearable = false,
    clearLabel,
    mono = false,
    className,
    style,
    onInput,
    onChange,
    ref,
    ...props
}: TextareaProps) {
    const textarea = useRecipe('textarea', textareaRecipe, classes);
    const textareaParts = useRecipe('textareaParts', textareaPartsRecipe, classes);
    const translations = useTranslations();
    const fieldContext = useFieldContext();
    const fieldStatus = useFieldStatus();
    const isInvalid = invalid || !!fieldContext?.invalid;
    const isSuccess = !isInvalid && (success || fieldStatus.success);
    const isDisabled = disabled || !!fieldContext?.disabled;
    const isReadOnly = !!props.readOnly || !!fieldContext?.readOnly;
    const element = useRef<HTMLTextAreaElement>(null);
    // `ref` reaches the native textarea, as on the other text fields
    useImperativeHandle(ref, () => element.current!, []);
    const maxLength = props.maxLength && props.maxLength > 0 ? props.maxLength : undefined;
    const counted = showCount && maxLength !== undefined;
    const trailing = loading || clearable || isSuccess;
    // Without counter, spinner or clear button the textarea is rendered on its own (unchanged DOM)
    const wrapped = counted || loading || clearable;
    const [typedLength, setTypedLength] = useState(() => String(props.defaultValue ?? '').length);
    const length = props.value !== undefined ? String(props.value ?? '').length : typedLength;

    // autoResize: as high as the text (plus the border), within minRows/maxRows
    const resize = () => {
        const area = element.current;
        if (!autoResize || !area) return;
        area.style.height = 'auto';
        const border = area.offsetHeight - area.clientHeight;
        let height = area.scrollHeight + border;
        if (minRows || maxRows) {
            const computed = getComputedStyle(area);
            const line = parseFloat(computed.lineHeight) || parseFloat(computed.fontSize) * 1.5;
            const frame = parseFloat(computed.paddingTop) + parseFloat(computed.paddingBottom) + border;
            const max = maxRows ? maxRows * line + frame : Infinity;
            area.style.overflowY = height > max ? 'auto' : '';
            height = Math.min(Math.max(height, minRows ? minRows * line + frame : 0), max);
        }
        area.style.height = `${height}px`;
    };
    useLayoutEffect(resize);

    // Counter: announced politely once typing pauses
    const counterId = useId();
    const [announcement, setAnnouncement] = useState('');
    const announceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => clearTimeout(announceTimer.current), []);
    const announce = (current: number) => {
        if (!counted) return;
        clearTimeout(announceTimer.current);
        announceTimer.current = setTimeout(
            () => setAnnouncement(translations.textarea.remaining(maxLength - current, maxLength)),
            1000
        );
    };

    const clear = () => {
        const area = element.current;
        if (!area) return;
        setTextControlValue(area);
        area.focus();
    };

    const control = (
        <Field.Textarea
            {...props}
            ref={element}
            rows={props.rows ?? minRows}
            className={textarea({
                size,
                invalid: isInvalid,
                success: isSuccess,
                disabled: isDisabled,
                autoResize,
                hasTrailing: wrapped ? trailing : undefined,
                mono,
                class: wrapped ? undefined : className,
            })}
            style={wrapped ? undefined : style}
            disabled={isDisabled || undefined}
            aria-invalid={isInvalid || undefined}
            {...(wrapped
                ? {
                      'aria-describedby':
                          [fieldContext?.ariaDescribedby, counted && counterId, props['aria-describedby']]
                              .filter(Boolean)
                              .join(' ') || undefined,
                      'aria-busy': loading || undefined,
                  }
                : {})}
            onInput={(event) => {
                resize();
                onInput?.(event);
            }}
            onChange={(event) => {
                setTypedLength(event.currentTarget.value.length);
                announce(event.currentTarget.value.length);
                onChange?.(event);
            }}
        />
    );
    if (!wrapped) return control;
    const parts = textareaParts();
    return (
        <div className={parts.base({ class: className })} style={style}>
            {control}
            {trailing && (
                <div className={parts.trailing()}>
                    <InputStatus
                        loading={loading}
                        clear={clearable && length > 0 && !isDisabled && !isReadOnly}
                        clearLabel={clearLabel ?? translations.field.clear}
                        onClear={clear}
                        success={isSuccess}
                        classes={{
                            spinner: parts.spinner(),
                            clear: parts.clear(),
                            clearIcon: parts.clearIcon(),
                            statusIcon: parts.statusIcon(),
                        }}
                    />
                </div>
            )}
            {counted && (
                <>
                    <span id={counterId} className={parts.counter()} aria-hidden="true">
                        {translations.textarea.counter(length, maxLength)}
                    </span>
                    <span className={parts.status()} role="status">
                        {announcement}
                    </span>
                </>
            )}
        </div>
    );
}
