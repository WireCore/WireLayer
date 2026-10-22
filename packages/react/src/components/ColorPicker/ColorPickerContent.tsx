import { ColorPicker as ArkColorPicker, parseColor } from '@ark-ui/react/color-picker';
import { Portal } from '@ark-ui/react/portal';
import {
    colorChannelRanges,
    colorChannels,
    colorFromChannels,
    colorPicker as colorPickerRecipe,
    isEyeDropperSupported,
    type ColorFormat,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { Pipette } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

const formats: Exclude<ColorFormat, 'hex'>[] = ['rgb', 'hsl', 'hsb', 'oklch'];
const arkChannels = {
    rgb: ['red', 'green', 'blue'],
    hsl: ['hue', 'saturation', 'lightness'],
    hsb: ['hue', 'saturation', 'brightness'],
} as const;

/** The popup of ColorPicker and ColorInput (inside Ark's ColorPicker.Root) – internal */
export function ColorPickerContent({
    alpha,
    swatches,
    withPicker,
    eyeDropper,
    channelInputs,
    classes,
}: {
    alpha: boolean;
    swatches?: string[];
    withPicker: boolean;
    eyeDropper: boolean;
    channelInputs: boolean;
    classes?: RecipeClasses<typeof colorPickerRecipe>;
}) {
    const colorPicker = useRecipe('colorPicker', colorPickerRecipe, classes);
    const styles = colorPicker();
    const text = useTranslations().colorPicker;
    const [channelFormat, setChannelFormat] = useState<Exclude<ColorFormat, 'hex'>>('rgb');
    // Only in the browser (the popup is rendered there only)
    const dropper = isEyeDropperSupported();
    return (
        <Portal>
            <ArkColorPicker.Positioner>
                <ArkColorPicker.Content className={styles.content()}>
                    {withPicker && (
                        <>
                            <ArkColorPicker.Area className={styles.area()}>
                                <ArkColorPicker.AreaBackground className={styles.areaBackground()} />
                                <ArkColorPicker.AreaThumb className={styles.areaThumb()} aria-label={text.area} />
                            </ArkColorPicker.Area>
                            <ArkColorPicker.ChannelSlider channel="hue" className={styles.channel()}>
                                <ArkColorPicker.ChannelSliderTrack className={styles.channelTrack()} />
                                <ArkColorPicker.ChannelSliderThumb
                                    className={styles.channelThumb()}
                                    aria-label={text.hue}
                                />
                            </ArkColorPicker.ChannelSlider>
                            {alpha && (
                                <ArkColorPicker.ChannelSlider channel="alpha" className={styles.channel()}>
                                    <ArkColorPicker.TransparencyGrid size="8px" />
                                    <ArkColorPicker.ChannelSliderTrack className={styles.channelTrack()} />
                                    <ArkColorPicker.ChannelSliderThumb
                                        className={styles.channelThumb()}
                                        aria-label={text.alpha}
                                    />
                                </ArkColorPicker.ChannelSlider>
                            )}
                            <div className={styles.row()}>
                                <ArkColorPicker.ChannelInput
                                    channel="hex"
                                    className={styles.input()}
                                    aria-label={text.hex}
                                />
                                {eyeDropper && dropper && (
                                    <ArkColorPicker.EyeDropperTrigger
                                        className={styles.eyeDropper()}
                                        aria-label={text.eyeDropper}
                                    >
                                        <Pipette className={styles.eyeDropperIcon()} aria-hidden="true" />
                                    </ArkColorPicker.EyeDropperTrigger>
                                )}
                            </div>
                            {channelInputs && (
                                <>
                                    <div role="group" aria-label={text.format} className={styles.formats()}>
                                        {formats.map((format) => (
                                            <button
                                                key={format}
                                                type="button"
                                                className={styles.formatButton()}
                                                aria-pressed={format === channelFormat}
                                                onClick={() => setChannelFormat(format)}
                                            >
                                                {text.formats[format]}
                                            </button>
                                        ))}
                                    </div>
                                    <div className={styles.channels()}>
                                        {channelFormat !== 'oklch' ? (
                                            arkChannels[channelFormat].map((channel, index) => (
                                                <label key={channel} className={styles.channelField()}>
                                                    <span className={styles.channelLabel()}>
                                                        {text.channels[channelFormat]![index]}
                                                    </span>
                                                    <ArkColorPicker.ChannelInput
                                                        channel={channel}
                                                        className={styles.channelInput()}
                                                        aria-label={text.channels[channelFormat]![index]}
                                                    />
                                                </label>
                                            ))
                                        ) : (
                                            <ArkColorPicker.Context>
                                                {(api) => {
                                                    // Uncontrolled like Ark's channel fields: the value counts on Enter/leave
                                                    const hex = api.value.toString('hexa');
                                                    const values = colorChannels(hex, 'oklch');
                                                    return text.channels.oklch!.map((name, index) => (
                                                        <label key={name} className={styles.channelField()}>
                                                            <span className={styles.channelLabel()}>{name}</span>
                                                            <input
                                                                key={values[index]}
                                                                type="number"
                                                                className={styles.channelInput()}
                                                                aria-label={name}
                                                                min="0"
                                                                max={colorChannelRanges.oklch[index]!.max}
                                                                step={colorChannelRanges.oklch[index]!.step}
                                                                defaultValue={values[index]}
                                                                onBlur={(event) => {
                                                                    const next = event.currentTarget.valueAsNumber;
                                                                    if (Number.isNaN(next) || next === values[index])
                                                                        return;
                                                                    const channels = [...values];
                                                                    channels[index] = next;
                                                                    api.setValue(
                                                                        parseColor(
                                                                            colorFromChannels('oklch', channels, hex)
                                                                        )
                                                                    );
                                                                }}
                                                                onKeyDown={(event) => {
                                                                    if (event.key === 'Enter')
                                                                        event.currentTarget.blur();
                                                                }}
                                                            />
                                                        </label>
                                                    ));
                                                }}
                                            </ArkColorPicker.Context>
                                        )}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                    {swatches && swatches.length > 0 && (
                        <ArkColorPicker.SwatchGroup
                            className={styles.swatches()}
                            {...(withPicker ? {} : { 'aria-label': text.palette })}
                        >
                            {swatches.map((swatch) => (
                                <ArkColorPicker.SwatchTrigger
                                    key={swatch}
                                    value={swatch}
                                    className={styles.swatchTrigger()}
                                    aria-label={text.swatch(swatch)}
                                >
                                    <ArkColorPicker.Swatch value={swatch} className={styles.swatchFill()} />
                                </ArkColorPicker.SwatchTrigger>
                            ))}
                        </ArkColorPicker.SwatchGroup>
                    )}
                </ArkColorPicker.Content>
            </ArkColorPicker.Positioner>
        </Portal>
    );
}
