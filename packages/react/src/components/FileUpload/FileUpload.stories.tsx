import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileTypes } from '@wirecore/wirelayer-recipes';
import { useRef, useState } from 'react';
import { Avatar } from '../Avatar/Avatar.js';
import { Button } from '../Button/Button.js';
import { Dialog, DialogClose, DialogContent } from '../Dialog/Dialog.js';
import { ImageCropper, type ImageCropperHandle } from '../ImageCropper/ImageCropper.js';
import { FileUpload, type FileUploadHandle } from './FileUpload.js';

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
    render: (args) => <FileUpload {...args} className="w-96" />,
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

function ButtonOnlyDemo() {
    const upload = useRef<FileUploadHandle>(null);
    return (
        <div className="flex w-96 flex-col gap-3">
            <FileUpload
                ref={upload}
                variant="button"
                label="Invoice"
                accept={['application/pdf']}
                hint="PDF up to 5 MB"
            />
            <Button variant="text" size="sm" className="self-start" onClick={() => upload.current?.open()}>
                Open from elsewhere
            </Button>
        </div>
    );
}

/** Only the button – opened from another button, too (open()) */
export const ButtonOnly: Story = { name: 'Button only', render: () => <ButtonOnlyDemo /> };

/** Drop files anywhere in the window; the overlay says whether they are allowed */
export const Fullscreen: Story = { name: 'Fullscreen', args: { fullscreenDrop: true, label: 'Documents' } };

function AvatarCrop() {
    const [source, setSource] = useState('');
    const [avatar, setAvatar] = useState('');
    const [open, setOpen] = useState(false);
    const cropper = useRef<ImageCropperHandle>(null);
    const choose = (files: File[]) => {
        if (!files[0]) return;
        if (source) URL.revokeObjectURL(source);
        setSource(URL.createObjectURL(files[0]));
        setOpen(true);
    };
    const apply = async () => {
        const url = await cropper.current?.getCroppedImage({ output: 'dataUrl', maxSize: { width: 256, height: 256 } });
        if (typeof url === 'string') setAvatar(url);
        setOpen(false);
    };
    return (
        <div className="flex items-center gap-4">
            <Avatar src={avatar || undefined} name="Anna Berg" size="lg" />
            <FileUpload
                variant="button"
                triggerLabel="Choose photo"
                accept={[...FileTypes.images]}
                onFilesChange={choose}
            />
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    title="Crop photo"
                    size="lg"
                    footer={
                        <>
                            <DialogClose>
                                <Button variant="outline" size="sm">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button size="sm" onClick={() => void apply()}>
                                Apply
                            </Button>
                        </>
                    }
                >
                    {source && <ImageCropper ref={cropper} src={source} aspectRatio={1} cropShape="circle" />}
                </DialogContent>
            </Dialog>
        </div>
    );
}

/** Choose a picture, crop it in a dialog (circle, zoom, rotate) and use it as avatar */
export const CropAvatar: Story = { name: 'Crop avatar', render: () => <AvatarCrop /> };
