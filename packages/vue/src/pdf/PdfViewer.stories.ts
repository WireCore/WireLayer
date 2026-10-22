/// <reference types="vite/client" />
import type { Meta, StoryObj } from '@storybook/vue3-vite';
// pdf.js's stylesheet (text and annotation layers) and its worker as a URL – the setup an app does once
import 'pdfjs-dist/legacy/web/pdf_viewer.css';
import workerSrc from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { ref } from 'vue';
import Button from '../components/Button/Button.vue';
import PdfViewer from './PdfViewer.vue';

// Sample documents (apps/storybook/public/pdf, made by apps/storybook/scripts/sample-pdf.ts); pdf.js's character
// maps and standard fonts come from pdfjs-dist (staticDirs in .storybook/main.ts)
const assets = { workerSrc, cMapUrl: 'pdfjs/cmaps/', standardFontDataUrl: 'pdfjs/standard_fonts/' };

const meta = {
    title: 'Media/PdfViewer',
    component: PdfViewer,
    args: { src: 'pdf/sample.pdf', ...assets, height: '560px' },
    parameters: { layout: 'padded' },
    render: (args) => ({
        components: { PdfViewer },
        setup: () => ({ args }),
        template: `<PdfViewer v-bind="args" class="max-w-4xl" />`,
    }),
} satisfies Meta<typeof PdfViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Side bar with thumbnails and the outline (a tree – choosing an entry jumps there) */
export const Sidebar: Story = { args: { sidebar: true } };

/** Page and zoom bound to the app (v-model), methods via ref: goToPage, search, download, print */
export const Controlled: Story = {
    render: (args) => ({
        components: { Button, PdfViewer },
        setup: () => {
            const page = ref(1);
            const zoom = ref<number | 'page-width' | 'page-fit'>(1);
            const pages = ref(0);
            const viewer = ref<InstanceType<typeof PdfViewer>>();
            return { args, page, zoom, pages, viewer };
        },
        template: `
            <div class="flex max-w-4xl flex-col gap-3">
                <div class="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" @click="viewer?.goToPage(3)">Go to contact page</Button>
                    <Button size="sm" variant="outline" @click="viewer?.search('offer')">Search for “offer”</Button>
                    <Button size="sm" variant="outline" @click="zoom = 1.5">150%</Button>
                    <Button size="sm" variant="outline" @click="viewer?.download()">Download</Button>
                    <span class="text-sm text-muted">Page {{ page }} of {{ pages }} · Zoom {{ zoom }}</span>
                </div>
                <PdfViewer
                    ref="viewer"
                    v-bind="args"
                    v-model:page="page"
                    v-model:zoom="zoom"
                    @loaded="pages = $event.numPages"
                />
            </div>`,
    }),
};

/** Text layer switched at runtime: the pages are drawn again, page and zoom stay */
export const Layers: Story = {
    name: 'Layers',
    render: (args) => ({
        components: { Button, PdfViewer },
        setup: () => ({ args, textLayer: ref(true) }),
        template: `
            <div class="flex max-w-4xl flex-col gap-3">
                <Button size="sm" variant="outline" class="self-start" :aria-pressed="!textLayer" @click="textLayer = !textLayer">Hide text layer</Button>
                <PdfViewer v-bind="args" :text-layer="textLayer" />
            </div>`,
    }),
};

/** Only some tools; without the side bar, rotation, printing and full screen */
export const FewTools: Story = { args: { toolbar: ['page', 'zoom', 'search', 'download'], height: '420px' } };

/** A protected PDF asks for its password in a dialog – here: wirecore */
export const Password: Story = { args: { src: 'pdf/sample-password.pdf' } };

/** A file chosen on the device (File/Blob) – nothing is uploaded */
export const LocalFile: Story = {
    render: (args) => ({
        components: { PdfViewer },
        setup: () => {
            const file = ref<File>();
            const choose = (event: Event) => (file.value = (event.target as HTMLInputElement).files?.[0]);
            return { args, file, choose };
        },
        template: `
            <div class="flex max-w-4xl flex-col gap-3">
                <label class="flex flex-col gap-1 text-sm">
                    Choose a PDF file
                    <input type="file" accept="application/pdf" @change="choose" />
                </label>
                <PdfViewer v-if="file" v-bind="args" :src="file" />
            </div>`,
    }),
};

/** The document cannot be loaded: the message replaces the pages */
export const LoadError: Story = { args: { src: 'pdf/does-not-exist.pdf' } };
