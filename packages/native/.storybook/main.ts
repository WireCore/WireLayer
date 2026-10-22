import type { StorybookConfig } from '@storybook/react-native-web-vite';
import tailwindcss from '@tailwindcss/vite';
import { nativeExtraThemes } from '@wirecore/wirelayer-tokens';
import { uniwind } from 'uniwind/vite';
import { fileURLToPath } from 'node:url';
import { defaultClientConditions, mergeConfig } from 'vite';

// React Native components rendered with react-native-web – Uniwind compiles the same classes to CSS
const config: StorybookConfig = {
    stories: ['../src/**/*.stories.tsx'],
    addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
    staticDirs: [{ from: '../../../assets', to: '/brand' }],
    managerHead: (head) => `${head}<link rel="icon" type="image/svg+xml" href="./brand/wirelayer.svg" />`,
    framework: '@storybook/react-native-web-vite',
    core: {
        disableTelemetry: true,
        disableWhatsNewNotifications: true,
    },
    features: {
        backgrounds: false,
        sidebarOnboardingChecklist: false,
        menuOnboardingChecklist: false,
    },
    viteFinal: (config) =>
        mergeConfig(config, {
            plugins: [
                tailwindcss(),
                uniwind({ cssEntryFile: './.storybook/global.css', extraThemes: nativeExtraThemes() }),
            ],
            resolve: {
                // Resolve workspace packages to their TypeScript sources during development
                conditions: ['wirecore:source', ...defaultClientConditions],
                // react-native-svg's web build still imports native TurboModules, which Vite cannot resolve.
                // lucide-react draws the same icons with the same props (color, size) as plain <svg>.
                alias: [
                    { find: /^lucide-react-native$/, replacement: 'lucide-react' },
                    // SignaturePad draws its strokes with react-native-svg – a small DOM SVG stand-in here
                    // react-native-pdf is native only – PdfViewer shows a note on the web
                    {
                        find: /^react-native-pdf$/,
                        replacement: fileURLToPath(new URL('./react-native-pdf.tsx', import.meta.url)),
                    },
                    {
                        find: /^react-native-svg$/,
                        replacement: fileURLToPath(new URL('./react-native-svg.tsx', import.meta.url)),
                    },
                ],
            },
        }),
};

export default config;
