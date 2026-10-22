import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.ts', '../../blocks-vue/src/**/*.stories.ts'],
    addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
    // PdfViewer stories: the sample PDFs and pdf.js's character maps and standard fonts
    staticDirs: [
        { from: '../../../assets', to: '/brand' },
        { from: '../../../apps/storybook/public/pdf', to: '/pdf' },
        { from: '../node_modules/pdfjs-dist/cmaps', to: '/pdfjs/cmaps' },
        { from: '../node_modules/pdfjs-dist/standard_fonts', to: '/pdfjs/standard_fonts' },
    ],
    managerHead: (head) => `${head}<link rel="icon" type="image/svg+xml" href="./brand/wirelayer.svg" />`,
    framework: '@storybook/vue3-vite',
    core: {
        disableTelemetry: true,
        disableWhatsNewNotifications: true,
    },
    features: {
        // The theme (light/dark toolbar toggle) sets the background – a separate background picker only confuses
        backgrounds: false,
        sidebarOnboardingChecklist: false,
        menuOnboardingChecklist: false,
    },
};

export default config;
