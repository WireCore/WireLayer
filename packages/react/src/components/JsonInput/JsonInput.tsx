import { useFieldContext } from '@ark-ui/react/field';
import { checkJson, formatJson, jsonInput as jsonInputRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { CircleAlert, CircleCheck } from 'lucide-react';
import { useId, useState, type ComponentProps } from 'react';
import { Button } from '../Button/Button.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { Textarea } from '../Textarea/Textarea.js';

export interface JsonInputProps extends Omit<
    ComponentProps<'textarea'>,
    'value' | 'defaultValue' | 'onChange' | 'children'
> {
    /** The JSON text (controlled) */
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /** The parsed value whenever the text is valid JSON */
    onValueParse?: (value: unknown) => void;
    /** Spaces per level when formatting (default 2) */
    indent?: number;
    /** Button that formats the text (default true) */
    formatButton?: boolean;
    /** Formats valid JSON when the field loses focus */
    formatOnBlur?: boolean;
    /** Marks the field invalid (it also is while the text is no valid JSON) */
    invalid?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof jsonInputRecipe>;
}

/** JSON text field: checked while typing (the result is the field's description), "Format" pretty-prints */
export function JsonInput({
    classes,
    value,
    defaultValue = '',
    onValueChange,
    onValueParse,
    indent = 2,
    formatButton = true,
    formatOnBlur,
    invalid,
    rows = 8,
    disabled,
    readOnly,
    className,
    style,
    onBlur,
    ...props
}: JsonInputProps) {
    const jsonInput = useRecipe('jsonInput', jsonInputRecipe, classes);
    const field = useFieldContext();
    const t = useTranslations().jsonInput;
    const statusId = `${useId()}status`;
    const [internal, setInternal] = useState(defaultValue);
    const text = value ?? internal;
    const check = text.trim() ? checkJson(text) : undefined;
    const state = !check ? 'empty' : check.valid ? 'valid' : 'invalid';
    const styles = jsonInput({ state });
    const message = !check
        ? ''
        : check.valid
          ? t.valid
          : check.line
            ? t.invalidAt(check.line, check.column ?? 1)
            : t.invalid;

    const setText = (next: string) => {
        setInternal(next);
        onValueChange?.(next);
        const result = next.trim() ? checkJson(next) : undefined;
        if (result?.valid) onValueParse?.(result.value);
    };
    const format = () => {
        const formatted = formatJson(text, indent);
        if (formatted !== null && formatted !== text) setText(formatted);
    };

    return (
        <div className={styles.base({ class: className })} style={style}>
            <Textarea
                {...props}
                value={text}
                onChange={(event) => setText(event.currentTarget.value)}
                onBlur={(event) => {
                    if (formatOnBlur) format();
                    onBlur?.(event);
                }}
                rows={rows}
                disabled={disabled}
                readOnly={readOnly}
                invalid={invalid || state === 'invalid'}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                aria-describedby={[field?.ariaDescribedby, statusId].filter(Boolean).join(' ')}
                classes={{ base: styles.textarea() }}
            />
            <div className={styles.footer()}>
                <span id={statusId} className={styles.status()}>
                    {state === 'valid' && <CircleCheck className={styles.statusIcon()} aria-hidden="true" />}
                    {state === 'invalid' && <CircleAlert className={styles.statusIcon()} aria-hidden="true" />}
                    {message}
                </span>
                {formatButton && (
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={disabled || readOnly || state !== 'valid'}
                        onClick={format}
                    >
                        {t.format}
                    </Button>
                )}
            </div>
        </div>
    );
}
