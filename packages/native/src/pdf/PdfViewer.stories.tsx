import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { PdfViewer } from './PdfViewer.js';

const meta = {
    title: 'Media/PdfViewer',
    component: PdfViewer,
    args: {
        src: 'https://www.example.com/documents/manual.pdf',
        label: 'Maintenance portal manual',
    },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
    parameters: {
        docs: {
            description: {
                component:
                    'Pages of a PDF with `react-native-pdf` (optional peer dependency, plus `react-native-blob-util`): ' +
                    'page x of y, previous/next page, zoom (buttons or two-finger gesture) and sharing. ' +
                    'Import from `@wirecore/wirelayer-native/pdf`. Needs a development build with the config plugins of both ' +
                    'packages – it does not run in Expo Go. `trustAllCerts` is off by default. On the web (react-native-web, ' +
                    'so here in Storybook, too) there is no native PDF view: the component shows a note and ' +
                    'a link to the file.',
            },
        },
    },
} satisfies Meta<typeof PdfViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** In the browser: the note instead of the pages (react-native-pdf is native only) */
export const Playground: Story = {};

/** With a share button – in an app `shareUri` from @wirecore/wirelayer-native/expo-sharing */
export const Share: Story = {
    name: 'Share',
    args: { onShare: () => undefined, fileName: 'manual.pdf' },
};
