import {
    colorPicker,
    hsbToRgb,
    parseColorText,
    parseHex,
    rgbToHsb,
    select,
    toHex,
} from '@wirecore/wirelayer-recipes/native';
import { Palette } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslations } from '../../locale.js';
import { PickerTrigger } from '../../utils/PickerTrigger.js';
import { Sheet } from '../../utils/Sheet.js';
import { useControllable } from '../../utils/useControllable.js';
import { ColorSwatchPicker } from '../ColorSwatchPicker/ColorSwatchPicker.js';
import { Field, useFieldControl } from '../Field/Field.js';
import { Input } from '../Input/Input.js';
import { Slider } from '../Slider/Slider.js';

export interface ColorPickerProps {
    /** Colour as hex, e.g. "#1e66f5" */
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /** Called once the user lets go of a slider or picks a swatch */
    onValueChangeEnd?: (value: string) => void;
    /** Preset colours below the sliders */
    swatches?: string[];
    /** Sliders and hex field (default true); false: only the `swatches` (a palette) */
    withPicker?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    /** Accessible name without a surrounding Field */
    'aria-label'?: string;
    closeLabel?: string;
    className?: string;
}

/** Steps of the gradient behind a slider */
const STEPS = 12;

/**
 * Colour field: the button shows the colour and its hex value and opens a sheet with a preview, sliders for hue,
 * saturation and brightness (adjustable with the screen reader's gestures), a hex field and presets. Simplified
 * compared with the web: no area, no alpha, hex only.
 */
export function ColorPicker({
    value,
    defaultValue = '#1e66f5',
    onValueChange,
    onValueChangeEnd,
    swatches,
    withPicker = true,
    disabled,
    invalid,
    'aria-label': ariaLabel,
    closeLabel,
    className,
}: ColorPickerProps) {
    const translations = useTranslations();
    const t = translations.colorPicker;
    const control = useFieldControl({ invalid, disabled });
    const [color, setColor] = useControllable(value, defaultValue, onValueChange);
    const [open, setOpen] = useState(false);
    const rgb = parseHex(color) ?? { r: 0, g: 0, b: 0, a: 1 };
    // Hue and saturation are kept while they cannot be read back from the colour (grey, black)
    const [hsb, setHsb] = useState(() => rgbToHsb(rgb));
    const [seen, setSeen] = useState(color);
    if (color !== seen) {
        setSeen(color);
        const next = rgbToHsb(rgb);
        setHsb({ h: next.s === 0 || next.b === 0 ? hsb.h : next.h, s: next.b === 0 ? hsb.s : next.s, b: next.b });
    }
    const [hex, setHex] = useState(color);
    const styles = colorPicker();
    const label = control.label ?? ariaLabel ?? t.name;
    const fromHsb = (next: { h: number; s: number; b: number }) => {
        setHsb(next);
        const out = toHex(hsbToRgb(next.h, next.s, next.b));
        setSeen(out);
        setColor(out);
        setHex(out);
    };
    const names = t.channels.hsb!;
    const gradient = (make: (fraction: number) => string) => (
        <View className={styles.track()} aria-hidden>
            {Array.from({ length: STEPS }, (_, index) => (
                <View key={index} className={styles.segment()} style={{ backgroundColor: make(index / (STEPS - 1)) }} />
            ))}
        </View>
    );

    return (
        <>
            <PickerTrigger
                label={label}
                text={color}
                placeholder={color}
                indicator={Palette}
                content={
                    <>
                        <View className={styles.triggerSwatch()} style={{ backgroundColor: color }} aria-hidden />
                        <Text className={select().valueText()}>{color}</Text>
                    </>
                }
                open={open}
                invalid={control.invalid}
                disabled={control.disabled}
                controlProps={control.props}
                controlId={control.controlId}
                onPress={() => {
                    setHex(color);
                    setOpen(true);
                }}
                className={className}
            />
            <Sheet
                open={open}
                onClose={() => {
                    setOpen(false);
                    onValueChangeEnd?.(color);
                }}
                title={label}
                closeLabel={closeLabel ?? translations.common.close}
                focusClose
            >
                <View className={styles.content()}>
                    <View className={styles.preview()} style={{ backgroundColor: color }} aria-hidden />
                    {withPicker && (
                        <>
                            <View>
                                {gradient((fraction) => toHex(hsbToRgb(fraction * 360, 100, 100)))}
                                <Slider
                                    label={names[0]!}
                                    min={0}
                                    max={360}
                                    value={[Math.round(hsb.h)]}
                                    formatValue={(number) => `${number}°`}
                                    onValueChange={([h]) => fromHsb({ ...hsb, h: h! })}
                                    onValueChangeEnd={() => onValueChangeEnd?.(color)}
                                />
                            </View>
                            <View>
                                {gradient((fraction) => toHex(hsbToRgb(hsb.h, fraction * 100, hsb.b || 100)))}
                                <Slider
                                    label={names[1]!}
                                    min={0}
                                    max={100}
                                    value={[Math.round(hsb.s)]}
                                    formatValue={(number) => `${number} %`}
                                    onValueChange={([s]) => fromHsb({ ...hsb, s: s! })}
                                    onValueChangeEnd={() => onValueChangeEnd?.(color)}
                                />
                            </View>
                            <View>
                                {gradient((fraction) => toHex(hsbToRgb(hsb.h, hsb.s, fraction * 100)))}
                                <Slider
                                    label={names[2]!}
                                    min={0}
                                    max={100}
                                    value={[Math.round(hsb.b)]}
                                    formatValue={(number) => `${number} %`}
                                    onValueChange={([b]) => fromHsb({ ...hsb, b: b! })}
                                    onValueChangeEnd={() => onValueChangeEnd?.(color)}
                                />
                            </View>
                            <Field label={t.hex}>
                                <Input
                                    value={hex}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    onChangeText={(text) => {
                                        setHex(text);
                                        const parsed = parseColorText(text);
                                        if (parsed && parsed !== color) setColor(parsed.slice(0, 7));
                                    }}
                                    onBlur={() => setHex(color)}
                                />
                            </Field>
                        </>
                    )}
                    {swatches && swatches.length > 0 && (
                        <ColorSwatchPicker
                            label={t.palette}
                            items={swatches.map((swatch) => ({ value: swatch, label: swatch }))}
                            value={swatches.includes(color) ? color : null}
                            onValueChange={(next) => {
                                if (!next) return;
                                setColor(next);
                                setHex(next);
                                onValueChangeEnd?.(next);
                            }}
                        />
                    )}
                </View>
            </Sheet>
        </>
    );
}
