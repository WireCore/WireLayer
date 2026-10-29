import { Field, useFieldContext } from '@ark-ui/react/field';
import { input as inputRecipe, setTextControlValue, type Size, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { CircleAlert } from 'lucide-react';
import { useId, useRef, useState, type ComponentProps } from 'react';
import type { IconComponent } from '../../types.js';
import { useFieldStatus } from '../Field/context.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { InputStatus } from './InputStatus.js';

export interface InputProps extends Omit<ComponentProps<'input'>, 'size' | 'prefix'> {
    size?: Size;
    /** Marks the input as invalid (also inherited from a surrounding Field) */
    invalid?: boolean;
    /** Confirmed value: green border and check icon (also inherited from a Field with `success`) */
    success?: boolean;
    /** Shows a spinner in the field and marks it busy (aria-busy), e.g. while checking the value */
    loading?: boolean;
    /** Shows a button that empties the field while it has a value */
    clearable?: boolean;
    /** Accessible name of the clear button (default "Clear input") */
    clearLabel?: string;
    /** Icon component rendered inside the field, before the text */
    leadingIcon?: IconComponent;
    /** Static text segment before the input, e.g. `https://` */
    prefix?: string;
    /** Static text segment after the input, e.g. `.de` */
    suffix?: string;
    /** Monospace font of the theme (JetBrains Mono) – for paths, tokens, codes, URLs and keys */
    mono?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof inputRecipe>;
}

/**
 * Text field with sizes, leading icon, prefix and suffix; works inside Field. `ref` reaches the native input (focus,
 * select, setSelectionRange)
 */
export function Input({
    classes,
    size,
    invalid = false,
    success = false,
    loading = false,
    clearable = false,
    clearLabel,
    disabled = false,
    leadingIcon: LeadingIcon,
    prefix,
    suffix,
    mono = false,
    className,
    style,
    onChange,
    ...props
}: InputProps) {
    const input = useRecipe('input', inputRecipe, classes);
    const translations = useTranslations();
    const fieldContext = useFieldContext();
    const fieldStatus = useFieldStatus();
    const isInvalid = invalid || !!fieldContext?.invalid;
    const isSuccess = !isInvalid && (success || fieldStatus.success);
    const isDisabled = disabled || !!fieldContext?.disabled;
    const isReadOnly = !!props.readOnly || !!fieldContext?.readOnly;
    const styles = input({
        size,
        invalid: isInvalid,
        success: isSuccess,
        disabled: isDisabled,
        hasIcon: !!LeadingIcon,
        hasStatusIcon: isInvalid || isSuccess || loading || clearable,
        mono,
    });

    // Whether there is text to clear (uncontrolled inputs report it through their change events)
    const [typed, setTyped] = useState(() => String(props.defaultValue ?? '') !== '');
    const filled = props.value !== undefined ? String(props.value ?? '') !== '' : typed;
    const wrapper = useRef<HTMLDivElement>(null);
    const clear = () => {
        const element = wrapper.current?.querySelector('input');
        if (!element) return;
        setTextControlValue(element);
        element.focus();
    };

    // Prefix/suffix are read by screen readers as part of the description, after helper/error text
    const prefixId = useId();
    const suffixId = useId();
    const describedBy =
        [fieldContext?.ariaDescribedby, prefix && prefixId, suffix && suffixId, props['aria-describedby']]
            .filter(Boolean)
            .join(' ') || undefined;

    return (
        <div
            ref={wrapper}
            className={styles.base({ class: className })}
            style={style}
            data-invalid={isInvalid || undefined}
            data-disabled={isDisabled || undefined}
        >
            {prefix && (
                <span id={prefixId} className={styles.prefix()}>
                    {prefix}
                </span>
            )}
            {LeadingIcon && <LeadingIcon className={styles.icon()} aria-hidden="true" />}
            <Field.Input
                {...props}
                className={styles.control()}
                disabled={isDisabled || undefined}
                aria-invalid={isInvalid || undefined}
                aria-describedby={describedBy}
                aria-busy={loading || undefined}
                onChange={(event) => {
                    setTyped(event.currentTarget.value !== '');
                    onChange?.(event);
                }}
            />
            {(loading || clearable || isSuccess) && (
                <InputStatus
                    loading={loading}
                    clear={clearable && filled && !isDisabled && !isReadOnly}
                    clearLabel={clearLabel ?? translations.field.clear}
                    onClear={clear}
                    success={isSuccess}
                    classes={{
                        spinner: styles.spinner(),
                        clear: styles.clear(),
                        clearIcon: styles.clearIcon(),
                        statusIcon: styles.statusIcon(),
                    }}
                />
            )}
            {isInvalid && <CircleAlert className={styles.statusIcon()} aria-hidden="true" />}
            {suffix && (
                <span id={suffixId} className={styles.suffix()}>
                    {suffix}
                </span>
            )}
        </div>
    );
}
