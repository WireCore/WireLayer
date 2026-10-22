import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Camera, FileText, Image } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text/Text.js';
import { FileUpload } from './FileUpload.js';
import type { FilePicker, NativeFile } from './types.js';

// In an app: documentPicker() from @wirecore/wirelayer-native/expo-document-picker, imageLibraryPicker() and cameraPicker()
// from @wirecore/wirelayer-native/expo-image-picker. The story picks example files instead.
let count = 0;
const fake = (kind: FilePicker['kind'], icon: FilePicker['icon'], file: () => NativeFile): FilePicker => ({
    kind,
    icon,
    pick: async ({ multiple }) => (multiple ? [file(), file()] : [file()]),
});
const pickers = [
    fake('documents', FileText, () => ({
        uri: `file:///quote-${++count}.pdf`,
        name: `Quote-${count}.pdf`,
        type: 'application/pdf',
        size: 182_000 * count,
    })),
    fake('photos', Image, () => ({
        uri: `file:///photo-${++count}.heic`,
        name: `Photo-${count}.heic`,
        type: 'image/heic',
        size: 2_400_000,
    })),
    fake('camera', Camera, () => ({
        uri: `file:///camera-${++count}.jpg`,
        name: `Camera-${count}.jpg`,
        type: 'image/jpeg',
        size: 9_800_000,
    })),
];

// Stands in for a fetch/XMLHttpRequest upload with progress
const upload = (
    _file: NativeFile,
    { onProgress, signal }: { onProgress: (percent: number) => void; signal: AbortSignal }
) =>
    new Promise<void>((done, fail) => {
        let percent = 0;
        const timer = setInterval(() => {
            percent += 20;
            onProgress(percent);
            if (percent >= 100) {
                clearInterval(timer);
                done();
            }
        }, 300);
        signal.addEventListener('abort', () => {
            clearInterval(timer);
            fail(signal.reason);
        });
    });

function Demo() {
    const [files, setFiles] = useState<NativeFile[]>([]);
    return (
        <View className="w-80 gap-3">
            <FileUpload
                label="Attachments"
                pickers={pickers}
                accept={['application/pdf', 'image/*']}
                maxFiles={4}
                maxFileSize={5_000_000}
                hint="PDF or images, up to 5 MB each"
                upload={upload}
                onFilesChange={setFiles}
            />
            <Text variant="muted">Files: {files.map((file) => file.name).join(', ') || '–'}</Text>
        </View>
    );
}

const meta = {
    title: 'Forms/FileUpload',
    component: FileUpload,
    args: { pickers },
    render: () => <Demo />,
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
