import { ColorPicker as ArkColorPicker, parseColor } from '@ark-ui/react/color-picker';
import { useFieldContext } from '@ark-ui/react/field';
import {
    colorPicker as colorPickerRecipe,
    formatColor,
    parseColorText,
    type ColorFormat,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { useId, useMemo, useState, type ComponentProps } from 'react';
import { ColorPickerContent } from '../ColorPicker/ColorPickerContent.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ColorInputProps extends Omit<ComponentProps<'input'>, 'value' | 'defaultValue' | 'onChange' | 'size'> {
    /** Colour as text in `format` (controlled) */
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /** Format of the value and the field: hex (default), rgb, hsl, hsb or oklch; typing accepts all of them */
    format?: ColorFormat;
    /** Adds an opacity slider */
    alpha?: boolean;
    /** Preset colours in the popup */
    swatches?: readonly string[];
    /** Area and sliders in the popup (default true); false: only the `swatches` */
    withPicker?: boolean;
    /** Button to pick a colour from the screen (where supported) */
    eyeDropper?: boolean;
    /** Number fields for the channels in the popup */
    channelInputs?: boolean;
    invalid?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof colorPickerRecipe>;
}

const hexOf = (value: string) => parseColorText(value) ?? '#000000';

/** Colour field: type a colour (hex, rgb(), hsl(), oklch()) or open the picker with the swatch button */
export function ColorInput({
    classes,
    value,
    defaultValue = '#000000',
    onValueChange,
    format = 'hex',
    alpha = false,
    swatches,
    withPicker = true,
    eyeDropper = false,
    channelInputs = false,
    disabled,
    readOnly,
    invalid,
    className,
    style,
    onBlur,
    onKeyDown,
    ...props
}: ColorInputProps) {
    const colorPicker = useRecipe('colorPicker', colorPickerRecipe, classes);
    const styles = colorPicker();
    const field = useFieldContext();
    const text = useTranslations().colorPicker;
    const openId = `${useId()}open`;
    const [internal, setInternal] = useState(() => hexOf(defaultValue));
    const current = value === undefined ? internal : hexOf(value);
    const [draft, setDraft] = useState<string | null>(null);
    const shown = draft ?? formatColor(current, format);
    const draftInvalid = draft !== null && !!draft.trim() && !parseColorText(draft);
    const isInvalid = (invalid ?? field?.invalid) || draftInvalid;
    const parsed = useMemo(() => (value === undefined ? undefined : parseColor(hexOf(value))), [value]);
    const initial = useMemo(() => parseColor(hexOf(defaultValue)), [defaultValue]);

    // Typed text counts on Enter or when leaving the field; unreadable text goes back to the colour
    const commit = (api: { setValue(value: ReturnType<typeof parseColor>): void }) => {
        const hex = draft === null ? null : parseColorText(draft);
        setDraft(null);
        if (hex && hex !== current) api.setValue(parseColor(hex));
    };

    return (
        <ArkColorPicker.Root
            className={styles.base({ class: className })}
            style={style}
            value={parsed}
            defaultValue={initial}
            disabled={disabled ?? field?.disabled}
            readOnly={readOnly ?? field?.readOnly}
            invalid={isInvalid}
            positioning={{ placement: 'bottom-start', gutter: 4 }}
            lazyMount
            unmountOnExit
            onValueChange={(details) => {
                const hex = details.value.toString(alpha ? 'hexa' : 'hex');
                setInternal(hex);
                onValueChange?.(formatColor(hex, format));
            }}
        >
            <ArkColorPicker.Context>
                {(api) => (
                    <ArkColorPicker.Control className={styles.control()}>
                        {/* Named by its own text (Ark would name it by the Field label, like the text field) */}
                        <ArkColorPicker.Trigger className={styles.inputTrigger()} aria-labelledby={openId}>
                            <ArkColorPicker.ValueSwatch className={styles.swatch()} />
                            <span id={openId} className={styles.hiddenName()}>
                                {text.open}
                            </span>
                        </ArkColorPicker.Trigger>
                        <input
                            {...props}
                            id={field?.ids.control ?? props.id}
                            type="text"
                            className={styles.textInput()}
                            value={shown}
                            disabled={disabled ?? field?.disabled}
                            readOnly={readOnly ?? field?.readOnly}
                            aria-label={field ? undefined : (props['aria-label'] ?? (props.id ? undefined : text.name))}
                            aria-invalid={isInvalid || undefined}
                            aria-describedby={field?.ariaDescribedby}
                            spellCheck={false}
                            autoComplete="off"
                            onChange={(event) => setDraft(event.currentTarget.value)}
                            onKeyDown={(event) => {
                                onKeyDown?.(event);
                                if (event.key !== 'Enter') return;
                                event.preventDefault();
                                commit(api);
                            }}
                            onBlur={(event) => {
                                commit(api);
                                onBlur?.(event);
                            }}
                        />
                    </ArkColorPicker.Control>
                )}
            </ArkColorPicker.Context>
            <ColorPickerContent
                alpha={alpha}
                swatches={swatches}
                withPicker={withPicker}
                eyeDropper={eyeDropper}
                channelInputs={channelInputs}
                classes={classes}
            />
        </ArkColorPicker.Root>
    );
}
