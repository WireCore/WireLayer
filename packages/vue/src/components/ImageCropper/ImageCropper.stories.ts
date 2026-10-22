import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Button from '../Button/Button.vue';
import ImageCropper from './ImageCropper.vue';

// Picture as inline SVG, so Storybook and the tests need no network
const picture = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#0d9488"/><stop offset="1" stop-color="#1e66f5"/></linearGradient></defs><rect width="1200" height="800" fill="url(#g)"/><circle cx="600" cy="360" r="180" fill="#fff" opacity=".85"/><text x="60" y="740" font-family="sans-serif" font-size="64" fill="#fff">Team photo</text></svg>'
)}`;

const meta = {
    title: 'Media/ImageCropper',
    component: ImageCropper,
    args: { src: picture, aspectRatio: 1, cropShape: 'circle', toolbar: true },
    argTypes: { cropShape: { control: 'inline-radio', options: ['rectangle', 'circle'] } },
    render: (args) => ({
        components: { Button, ImageCropper },
        setup: () => {
            const cropper = ref<InstanceType<typeof ImageCropper> | null>(null);
            const result = ref('');
            const crop = async () =>
                (result.value = String((await cropper.value?.getCroppedImage({ output: 'dataUrl' })) ?? ''));
            return { args, cropper, result, crop };
        },
        template: `
            <div class="flex w-[480px] flex-col gap-3">
                <ImageCropper ref="cropper" v-bind="args" />
                <Button size="sm" class="self-start" @click="crop">Crop</Button>
                <img v-if="result" :src="result" alt="Cropped image" class="size-24 rounded-full border border-line" />
            </div>`,
    }),
} satisfies Meta<typeof ImageCropper>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Circle for an avatar: arrow keys move, Alt+arrows resize, + and − zoom; buttons rotate and mirror */
export const Playground: Story = {};

/** Free rectangle in 16:9 */
export const Widescreen: Story = { name: 'Widescreen', args: { aspectRatio: 16 / 9, cropShape: 'rectangle' } };
