import type { StorybookConfig } from '@storybook/html-vite';

// The .wc-* classes in plain HTML – every story shows its markup in the docs
const config: StorybookConfig = {
    stories: ['../src/**/*.stories.ts', '../src/**/*.mdx'],
    addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
    staticDirs: [{ from: '../../../assets', to: '/brand' }],
    managerHead: (head) => `${head}<link rel="icon" type="image/svg+xml" href="./brand/wirelayer.svg" />`,
    framework: '@storybook/html-vite',
    core: {
        disableTelemetry: true,
        disableWhatsNewNotifications: true,
    },
    features: {
        backgrounds: false,
        sidebarOnboardingChecklist: false,
        menuOnboardingChecklist: false,
    },
};

export default config;
