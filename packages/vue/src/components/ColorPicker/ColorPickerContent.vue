<script setup lang="ts">
import { ColorPicker, parseColor } from '@ark-ui/vue/color-picker';
import { Pipette } from '@lucide/vue';
import {
    colorChannelRanges,
    colorChannels,
    colorFromChannels,
    colorPicker as colorPickerRecipe,
    isEyeDropperSupported,
    type ColorFormat,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { ref } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

// The popup of ColorPicker and ColorInput (inside Ark's ColorPicker.Root)
const props = defineProps<{
    alpha: boolean;
    swatches?: readonly string[];
    withPicker: boolean;
    eyeDropper: boolean;
    channelInputs: boolean;
    classes?: RecipeClasses<typeof colorPickerRecipe>;
}>();
const colorPicker = useRecipe('colorPicker', colorPickerRecipe, () => props.classes);
const styles = colorPicker();
const text = useTranslations().colorPicker;
const formats: Exclude<ColorFormat, 'hex'>[] = ['rgb', 'hsl', 'hsb', 'oklch'];
const arkChannels = {
    rgb: ['red', 'green', 'blue'],
    hsl: ['hue', 'saturation', 'lightness'],
    hsb: ['hue', 'saturation', 'brightness'],
} as const;
const channelFormat = ref<Exclude<ColorFormat, 'hex'>>('rgb');
// Only in the browser (the popup is rendered there only)
const dropper = isEyeDropperSupported();

function setOklch(
    api: { value: { toString(format: 'hexa'): string }; setValue(value: unknown): void },
    index: number,
    event: Event
) {
    const input = event.target as HTMLInputElement;
    const hex = api.value.toString('hexa');
    const channels = colorChannels(hex, 'oklch');
    if (Number.isNaN(input.valueAsNumber)) return;
    channels[index] = input.valueAsNumber;
    api.setValue(parseColor(colorFromChannels('oklch', channels, hex)));
}
</script>

<template>
    <Teleport to="body">
        <ColorPicker.Positioner>
            <ColorPicker.Content :class="styles.content()">
                <template v-if="withPicker">
                    <ColorPicker.Area :class="styles.area()">
                        <ColorPicker.AreaBackground :class="styles.areaBackground()" />
                        <ColorPicker.AreaThumb :class="styles.areaThumb()" :aria-label="text.area" />
                    </ColorPicker.Area>
                    <ColorPicker.ChannelSlider channel="hue" :class="styles.channel()">
                        <ColorPicker.ChannelSliderTrack :class="styles.channelTrack()" />
                        <ColorPicker.ChannelSliderThumb :class="styles.channelThumb()" :aria-label="text.hue" />
                    </ColorPicker.ChannelSlider>
                    <ColorPicker.ChannelSlider v-if="alpha" channel="alpha" :class="styles.channel()">
                        <ColorPicker.TransparencyGrid size="8px" />
                        <ColorPicker.ChannelSliderTrack :class="styles.channelTrack()" />
                        <ColorPicker.ChannelSliderThumb :class="styles.channelThumb()" :aria-label="text.alpha" />
                    </ColorPicker.ChannelSlider>
                    <div :class="styles.row()">
                        <ColorPicker.ChannelInput channel="hex" :class="styles.input()" :aria-label="text.hex" />
                        <ColorPicker.EyeDropperTrigger
                            v-if="eyeDropper && dropper"
                            :class="styles.eyeDropper()"
                            :aria-label="text.eyeDropper"
                        >
                            <Pipette :class="styles.eyeDropperIcon()" aria-hidden="true" />
                        </ColorPicker.EyeDropperTrigger>
                    </div>
                    <template v-if="channelInputs">
                        <div role="group" :aria-label="text.format" :class="styles.formats()">
                            <button
                                v-for="format in formats"
                                :key="format"
                                type="button"
                                :class="styles.formatButton()"
                                :aria-pressed="format === channelFormat"
                                @click="channelFormat = format"
                            >
                                {{ text.formats[format] }}
                            </button>
                        </div>
                        <div :class="styles.channels()">
                            <template v-if="channelFormat !== 'oklch'">
                                <label
                                    v-for="(channel, index) in arkChannels[channelFormat]"
                                    :key="channel"
                                    :class="styles.channelField()"
                                >
                                    <span :class="styles.channelLabel()">{{
                                        text.channels[channelFormat]![index]
                                    }}</span>
                                    <ColorPicker.ChannelInput
                                        :channel="channel"
                                        :class="styles.channelInput()"
                                        :aria-label="text.channels[channelFormat]![index]"
                                    />
                                </label>
                            </template>
                            <ColorPicker.Context v-else v-slot="api">
                                <label
                                    v-for="(name, index) in text.channels.oklch"
                                    :key="name"
                                    :class="styles.channelField()"
                                >
                                    <span :class="styles.channelLabel()">{{ name }}</span>
                                    <input
                                        type="number"
                                        :class="styles.channelInput()"
                                        :aria-label="name"
                                        min="0"
                                        :max="colorChannelRanges.oklch[index]!.max"
                                        :step="colorChannelRanges.oklch[index]!.step"
                                        :value="colorChannels(api.value.toString('hexa'), 'oklch')[index]"
                                        @change="setOklch(api, index, $event)"
                                    />
                                </label>
                            </ColorPicker.Context>
                        </div>
                    </template>
                </template>
                <ColorPicker.SwatchGroup
                    v-if="swatches?.length"
                    :class="styles.swatches()"
                    v-bind="withPicker ? {} : { 'aria-label': text.palette }"
                >
                    <ColorPicker.SwatchTrigger
                        v-for="swatch in swatches"
                        :key="swatch"
                        :value="swatch"
                        :class="styles.swatchTrigger()"
                        :aria-label="text.swatch(swatch)"
                    >
                        <ColorPicker.Swatch :value="swatch" :class="styles.swatchFill()" />
                    </ColorPicker.SwatchTrigger>
                </ColorPicker.SwatchGroup>
            </ColorPicker.Content>
        </ColorPicker.Positioner>
    </Teleport>
</template>
