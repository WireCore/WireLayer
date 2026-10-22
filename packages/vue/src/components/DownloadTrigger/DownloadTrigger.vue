<script setup lang="ts">
import { useDownload, type DownloadableData } from '@ark-ui/vue/download-trigger';
import { Download } from '@lucide/vue';
import type { ButtonColor, ButtonSize, ButtonVariant } from '@wirecore/wirelayer-recipes';
import { ref } from 'vue';
import Button from '../Button/Button.vue';
import { useTranslations } from '../../locale.js';

export interface DownloadTriggerProps {
    /** What to download: text, a Blob/File or a function that returns (a promise of) one */
    data?: DownloadableData | (() => DownloadableData | Promise<DownloadableData>);
    /** Address to fetch and save instead of `data` (same origin or CORS) */
    url?: string;
    /** File name, e.g. "bericht.csv" */
    fileName: string;
    /** MIME type of text data (default text/plain; a Blob keeps its own type) */
    mimeType?: string;
    variant?: ButtonVariant;
    color?: ButtonColor;
    size?: ButtonSize;
    disabled?: boolean;
}

const props = withDefaults(defineProps<DownloadTriggerProps>(), { data: undefined, variant: 'outline' });
const emit = defineEmits<{
    /** The file was handed to the browser */
    download: [];
    /** Getting the data failed */
    error: [error: unknown];
}>();
defineSlots<{
    /** Label of the button (default "Download") */
    default?(): unknown;
}>();
const t = useTranslations().downloadTrigger;
const loading = ref(false);
let resolved: DownloadableData = '';
const { download } = useDownload(() => ({
    fileName: props.fileName,
    mimeType: (props.mimeType ?? 'text/plain') as never,
    data: () => resolved,
}));

async function resolveData(): Promise<DownloadableData> {
    if (props.url) {
        const response = await fetch(props.url);
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        return response.blob();
    }
    return typeof props.data === 'function' ? await props.data() : (props.data ?? '');
}

async function onClick() {
    if (loading.value) return;
    loading.value = true;
    try {
        resolved = await resolveData();
        download();
        emit('download');
    } catch (error) {
        emit('error', error);
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <!-- Button that saves text, a Blob or a fetched file; busy (aria-busy) while the data is prepared -->
    <Button
        :variant="variant"
        :color="color"
        :size="size"
        :disabled="disabled"
        :loading="loading"
        :leading-icon="Download"
        @click="onClick"
    >
        <slot>{{ t.label }}</slot>
    </Button>
</template>
