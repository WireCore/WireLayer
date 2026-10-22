<script setup lang="ts">
import { QrCode, useQrCode } from '@ark-ui/vue/qr-code';
import { Download } from '@lucide/vue';
import { downloadText, qrCode as qrCodeRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, ref, useAttrs } from 'vue';
import Button from '../Button/Button.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface QrCodeProps {
    /** Text or URL to encode */
    value: string;
    /** Width and height in px (default 160) */
    size?: number;
    /** Error correction: L 7 %, M 15 % (default), Q 25 %, H 30 % of the code may be covered (H with a logo) */
    errorCorrection?: 'L' | 'M' | 'Q' | 'H';
    /** Image URL shown in the middle (decorative; use error correction "H") */
    logo?: string;
    /** Accessible name (default "QR code: <value>") */
    label?: string;
    /** Shows the encoded value as text below the code */
    showValue?: boolean;
    /** Buttons to download the code as PNG and SVG */
    download?: boolean;
    /** File name of the downloads without extension (default "qr-code") */
    fileName?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof qrCodeRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<QrCodeProps>(), { size: 160, fileName: 'qr-code' });
const qrCode = useRecipe('qrCode', qrCodeRecipe, () => props.classes);
const attrs = useAttrs();
const t = useTranslations().qrCode;
const styles = qrCode();
const api = useQrCode(
    computed(() => ({ value: props.value, encoding: { ecc: props.errorCorrection ?? (props.logo ? 'H' : 'M') } }))
);
const frame = ref<HTMLElement | null>(null);

async function downloadPng() {
    const url = await api.value.getDataUrl('image/png');
    Object.assign(document.createElement('a'), { href: url, download: `${props.fileName}.png` }).click();
}
// The pattern on a white tile, with explicit colours (the page's CSS does not travel with the file)
function downloadSvg() {
    const svg = frame.value?.querySelector('svg');
    const path = svg?.querySelector('path')?.getAttribute('d') ?? '';
    const box = svg?.getAttribute('viewBox') ?? '0 0 0 0';
    downloadText(
        `${props.fileName}.svg`,
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}"><rect width="100%" height="100%" fill="#fff"/><path d="${path}" fill="#000"/></svg>`,
        'image/svg+xml'
    );
}
</script>

<template>
    <!-- QR code as an image named by its value; optional logo, value text and downloads -->
    <div v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <div ref="frame">
            <QrCode.RootProvider :value="api" :class="styles.frame()">
                <QrCode.Frame
                    :class="styles.svg()"
                    :style="{ width: `${size}px`, height: `${size}px` }"
                    role="img"
                    :aria-label="label ?? t.label(value)"
                >
                    <QrCode.Pattern :class="styles.pattern()" />
                </QrCode.Frame>
                <QrCode.Overlay v-if="logo" :class="styles.overlay()">
                    <img :src="logo" alt="" :class="styles.logo()" />
                </QrCode.Overlay>
            </QrCode.RootProvider>
        </div>
        <span v-if="showValue" :class="styles.value()">{{ value }}</span>
        <div v-if="download" :class="styles.actions()">
            <Button variant="outline" size="sm" :leading-icon="Download" @click="downloadPng">{{
                t.downloadPng
            }}</Button>
            <Button variant="outline" size="sm" :leading-icon="Download" @click="downloadSvg">{{
                t.downloadSvg
            }}</Button>
        </div>
    </div>
</template>
