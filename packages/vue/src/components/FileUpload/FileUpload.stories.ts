import { X } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { FileTypes } from '@wirecore/wirelayer-recipes';
import { ref } from 'vue';
import Avatar from '../Avatar/Avatar.vue';
import Button from '../Button/Button.vue';
import IconButton from '../IconButton/IconButton.vue';
import Dialog from '../Dialog/Dialog.vue';
import DialogClose from '../Dialog/DialogClose.vue';
import DialogContent from '../Dialog/DialogContent.vue';
import ImageCropper from '../ImageCropper/ImageCropper.vue';
import FileUpload from './FileUpload.vue';

const meta = {
    title: 'Forms/FileUpload',
    component: FileUpload,
    args: {
        label: 'Attachments',
        accept: ['application/pdf', 'image/png', 'image/jpeg'],
        maxFiles: 3,
        maxFileSize: 5 * 1024 * 1024,
        hint: 'PDF, PNG or JPG · max. 3 files, 5 MB each',
        disabled: false,
    },
    render: (args) => ({
        components: { FileUpload },
        setup: () => ({ args }),
        template: `<FileUpload v-bind="args" class="w-96" />`,
    }),
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** A pretend upload: every file reports its progress, can be canceled and retried ("fail" in the name fails) */
const fakeUpload = (
    file: File,
    { onProgress, signal }: { onProgress: (percent: number) => void; signal: AbortSignal }
) =>
    new Promise<void>((resolve, reject) => {
        let percent = 0;
        const timer = setInterval(() => {
            percent += 10;
            onProgress(percent);
            if (percent >= 100) {
                clearInterval(timer);
                if (file.name.includes('fail')) reject(new Error('Server error'));
                else resolve();
            }
        }, 250);
        signal.addEventListener('abort', () => {
            clearInterval(timer);
            reject(new Error('canceled'));
        });
    });

/** Upload with progress per file, cancel and retry; thumbnails for images; Ctrl+V pastes from the clipboard */
export const WithUpload: Story = {
    name: 'With upload',
    args: {
        upload: fakeUpload,
        autoUpload: true,
        preview: true,
        paste: true,
        accept: [...FileTypes.images, ...FileTypes.pdf],
    },
};

/** Only the button – opened from another button, too (open()) */
export const ButtonOnly: Story = {
    name: 'Button only',
    render: () => ({
        components: { Button, FileUpload },
        setup: () => ({ upload: ref<InstanceType<typeof FileUpload> | null>(null) }),
        template: `
            <div class="flex w-96 flex-col gap-3">
                <FileUpload ref="upload" variant="button" label="Invoice" :accept="['application/pdf']" hint="PDF up to 5 MB" />
                <Button variant="text" size="sm" class="self-start" @click="upload?.open()">Open from elsewhere</Button>
            </div>`,
    }),
};

/** Drop files anywhere in the window; the overlay says whether they are allowed */
export const Fullscreen: Story = { name: 'Fullscreen', args: { fullscreenDrop: true, label: 'Documents' } };

/** Choose a picture, crop it in a dialog (circle, zoom, rotate) and use it as avatar */
export const CropAvatar: Story = {
    name: 'Crop avatar',
    render: () => ({
        components: { Avatar, Button, Dialog, DialogClose, DialogContent, FileUpload, ImageCropper },
        setup: () => {
            const source = ref('');
            const avatar = ref('');
            const open = ref(false);
            const cropper = ref<InstanceType<typeof ImageCropper> | null>(null);
            const choose = (files: File[]) => {
                if (!files[0]) return;
                if (source.value) URL.revokeObjectURL(source.value);
                source.value = URL.createObjectURL(files[0]);
                open.value = true;
            };
            const apply = async () => {
                const url = await cropper.value?.getCroppedImage({
                    output: 'dataUrl',
                    maxSize: { width: 256, height: 256 },
                });
                if (typeof url === 'string') avatar.value = url;
                open.value = false;
            };
            return { source, avatar, open, cropper, choose, apply, images: [...FileTypes.images] };
        },
        template: `
            <div class="flex items-center gap-4">
                <Avatar :src="avatar || undefined" name="Anna Berg" size="lg" />
                <FileUpload variant="button" trigger-label="Choose photo" :accept="images" @files-change="choose" />
                <Dialog v-model:open="open">
                    <DialogContent title="Crop photo" size="lg">
                        <ImageCropper v-if="source" ref="cropper" :src="source" :aspect-ratio="1" crop-shape="circle" />
                        <template #footer>
                            <DialogClose><Button variant="outline" size="sm">Cancel</Button></DialogClose>
                            <Button size="sm" @click="apply">Apply</Button>
                        </template>
                    </DialogContent>
                </Dialog>
            </div>`,
    }),
};

/**
 * The app shows the files itself: `:show-file-list="false"` hides the list, v-model:files holds the chosen files –
 * removing one in the app's list removes it in the upload, too (`clear()` empties it). Rejected files (wrong type,
 * too large) come with `@files-reject`
 */
export const OwnFileList: Story = {
    name: 'Own file list',
    render: () => ({
        components: { FileUpload, IconButton },
        setup: () => ({ files: ref<File[]>([]), X }),
        template: `
            <div class="flex w-[420px] flex-col gap-3">
                <FileUpload v-model:files="files" label="Receipts" :max-files="5" :show-file-list="false" />
                <ul class="flex flex-col gap-1 text-sm">
                    <li v-for="file in files" :key="file.name" class="flex items-center justify-between gap-2">
                        {{ file.name }}
                        <IconButton :icon="X" :label="'Remove ' + file.name" variant="text" size="xs" @click="files = files.filter((other) => other !== file)" />
                    </li>
                    <li v-if="!files.length" class="text-muted">No receipts yet</li>
                </ul>
            </div>`,
    }),
};
