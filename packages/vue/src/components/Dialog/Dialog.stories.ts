import { Trash2 } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Button from '../Button/Button.vue';
import Field from '../Field/Field.vue';
import Input from '../Input/Input.vue';
import Dialog from './Dialog.vue';
import DialogClose from './DialogClose.vue';
import DialogContent from './DialogContent.vue';
import DialogTrigger from './DialogTrigger.vue';

const meta = {
    title: 'Overlays/Dialog',
    component: Dialog,
    args: { role: 'alertdialog' },
    argTypes: { role: { control: 'inline-radio', options: ['dialog', 'alertdialog'] } },
    render: (args) => ({
        components: { Button, Dialog, DialogClose, DialogContent, DialogTrigger },
        setup: () => ({ args, Trash2 }),
        template: `
            <Dialog v-bind="args">
                <DialogTrigger>
                    <Button variant="danger" :leading-icon="Trash2">Delete server</Button>
                </DialogTrigger>
                <DialogContent
                    title="Delete server?"
                    description="web-01 and all snapshots will be permanently removed. This cannot be undone."
                    :icon="Trash2"
                    status="danger"
                >
                    <template #footer>
                        <DialogClose><Button variant="outline" size="sm">Cancel</Button></DialogClose>
                        <DialogClose><Button variant="danger" size="sm">Delete</Button></DialogClose>
                    </template>
                </DialogContent>
            </Dialog>`,
    }),
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * Maximum width per `size`; on small screens every dialog takes the full width (`responsive`).
 *
 * | size | Width |
 * | --- | --- |
 * | sm | 320px (20rem) |
 * | md | 400px (25rem) – default |
 * | lg | 560px (35rem) |
 * | xl | 800px (50rem) |
 * | full | screen width minus the margin |
 *
 * Another width: leave out `size` and set the CSS variable `--wc-dialog-w` (see "Own width")
 */
export const Sizes: Story = {
    render: () => ({
        components: { Button, Dialog, DialogClose, DialogContent, DialogTrigger },
        setup: () => ({ sizes: ['sm', 'md', 'lg', 'xl', 'full'] as const }),
        template: `
            <div class="flex flex-wrap justify-center gap-2">
                <Dialog v-for="size in sizes" :key="size">
                    <DialogTrigger><Button variant="outline">{{ size }}</Button></DialogTrigger>
                    <DialogContent :title="'Size ' + size" description="The width adapts to the content." :size="size">
                        <template #footer>
                            <DialogClose><Button size="sm">OK</Button></DialogClose>
                        </template>
                    </DialogContent>
                </Dialog>
            </div>`,
    }),
};

/** `hide-title`: the title names the dialog for screen readers but is not shown – e.g. around a video or an image */
export const HiddenTitle: Story = {
    name: 'Hidden title',
    render: () => ({
        components: { Button, Dialog, DialogContent, DialogTrigger },
        template: `
            <Dialog>
                <DialogTrigger><Button variant="outline">Watch the intro</Button></DialogTrigger>
                <DialogContent title="Intro video" hide-title size="lg">
                    <div class="flex aspect-video items-center justify-center rounded-lg bg-bg-2 text-muted">Video</div>
                </DialogContent>
            </Dialog>`,
    }),
};

/** Own width: without `size`, the CSS variable `--wc-dialog-w` sets the maximum width – no Tailwind class needed */
export const OwnWidth: Story = {
    name: 'Own width',
    render: () => ({
        components: { Button, Dialog, DialogClose, DialogContent, DialogTrigger },
        template: `
            <Dialog>
                <DialogTrigger><Button variant="outline">36rem</Button></DialogTrigger>
                <DialogContent title="Edit booking" description="36rem wide – between md and xl." style="--wc-dialog-w: 36rem">
                    <template #footer>
                        <DialogClose><Button size="sm">OK</Button></DialogClose>
                    </template>
                </DialogContent>
            </Dialog>`,
    }),
};

/** Top, bottom, start or end of the screen instead of the center */
export const Positions: Story = {
    render: () => ({
        components: { Button, Dialog, DialogContent, DialogTrigger },
        setup: () => ({ positions: ['top', 'bottom', 'start', 'end'] as const }),
        template: `
            <div class="flex flex-wrap justify-center gap-2">
                <Dialog v-for="position in positions" :key="position">
                    <DialogTrigger><Button variant="outline">{{ position }}</Button></DialogTrigger>
                    <DialogContent :title="'Position ' + position" :position="position" />
                </Dialog>
            </div>`,
    }),
};

/**
 * Non-modal: no backdrop, no focus trap – the page stays usable. Draggable at the header (keyboard: Alt + arrow
 * keys, with Shift in larger steps) and maximizable.
 */
export const NonModal: Story = {
    render: () => ({
        components: { Button, Dialog, DialogContent, DialogTrigger },
        setup: () => ({ count: ref(0) }),
        template: `
            <div class="flex flex-col items-center gap-3">
                <Dialog :modal="false">
                    <DialogTrigger><Button>Open notes</Button></DialogTrigger>
                    <DialogContent
                        title="Notes"
                        description="Stays open while you keep working on the page."
                        position="end"
                        draggable
                        maximizable
                    >
                        <p class="text-sm">Customer asks for a callback on Thursday.</p>
                    </DialogContent>
                </Dialog>
                <Button variant="outline" @click="count++">Click on the page ({{ count }})</Button>
            </div>`,
    }),
};

/** A dialog opens another one on top (own backdrop); closing it returns the focus to the first one */
export const Stacked: Story = {
    render: () => ({
        components: { Button, Dialog, DialogClose, DialogContent, DialogTrigger },
        template: `
            <Dialog>
                <DialogTrigger><Button>Settings</Button></DialogTrigger>
                <DialogContent title="Settings" description="Changes apply to all servers.">
                    <Dialog role="alertdialog">
                        <DialogTrigger><Button variant="danger" size="sm">Reset …</Button></DialogTrigger>
                        <DialogContent title="Really reset?" status="danger" size="sm">
                            <template #footer>
                                <DialogClose><Button variant="outline" size="sm">Cancel</Button></DialogClose>
                                <DialogClose><Button variant="danger" size="sm">Reset</Button></DialogClose>
                            </template>
                        </DialogContent>
                    </Dialog>
                </DialogContent>
            </Dialog>`,
    }),
};

/** Long content: only the body scrolls, header and footer stay in place */
export const ScrollInside: Story = {
    render: () => ({
        components: { Button, Dialog, DialogClose, DialogContent, DialogTrigger },
        setup: () => ({ paragraphs: Array.from({ length: 20 }, (_, index) => index + 1) }),
        template: `
            <Dialog>
                <DialogTrigger><Button>Read terms</Button></DialogTrigger>
                <DialogContent title="Terms of use" size="lg" scroll-behavior="inside">
                    <p v-for="paragraph in paragraphs" :key="paragraph" class="text-sm">
                        § {{ paragraph }} – Services are provided according to the current state of the art.
                    </p>
                    <template #footer>
                        <DialogClose><Button variant="outline" size="sm">Decline</Button></DialogClose>
                        <DialogClose><Button size="sm">Agree</Button></DialogClose>
                    </template>
                </DialogContent>
            </Dialog>`,
    }),
};

/**
 * The field to start in: mark it with `data-autofocus` (or `autofocus`). The dialog moves the focus inside once it
 * opened – after the content's `onMounted`, so a `focus()` there is overridden. Without a mark the first focusable
 * element gets the focus; an `alertdialog` starts on its close button.
 */
export const InitialFocus: Story = {
    name: 'Initial focus',
    render: () => ({
        components: { Button, Dialog, DialogClose, DialogContent, DialogTrigger, Field, Input },
        template: `
            <Dialog>
                <DialogTrigger><Button variant="outline">Rename connection</Button></DialogTrigger>
                <DialogContent title="Rename connection" size="sm">
                    <Field label="Name"><Input model-value="web-01 (production)" data-autofocus /></Field>
                    <template #footer>
                        <DialogClose><Button variant="outline" size="sm">Cancel</Button></DialogClose>
                        <DialogClose><Button size="sm">Save</Button></DialogClose>
                    </template>
                </DialogContent>
            </Dialog>`,
    }),
};

/** `title-position="header"`: the title in the row of the close button, after a smaller icon (as on the Drawer) */
export const TitleInTheHeader: Story = {
    name: 'Title in the header',
    render: () => ({
        components: { Button, Dialog, DialogClose, DialogContent, DialogTrigger, Field, Input },
        setup: () => ({ Trash2 }),
        template: `
            <div class="flex flex-wrap justify-center gap-2">
                <Dialog>
                    <DialogTrigger><Button variant="outline">Edit connection</Button></DialogTrigger>
                    <DialogContent title="Edit connection" description="web-01 · production" title-position="header" maximizable>
                        <Field label="Host"><Input model-value="10.0.4.12" mono data-autofocus /></Field>
                        <template #footer>
                            <DialogClose><Button variant="outline" size="sm">Cancel</Button></DialogClose>
                            <DialogClose><Button size="sm">Save</Button></DialogClose>
                        </template>
                    </DialogContent>
                </Dialog>
                <Dialog role="alertdialog">
                    <DialogTrigger><Button variant="outline">With icon</Button></DialogTrigger>
                    <DialogContent title="Delete server?" description="This cannot be undone." :icon="Trash2" status="danger" title-position="header">
                        <template #footer>
                            <DialogClose><Button variant="outline" size="sm">Cancel</Button></DialogClose>
                            <DialogClose><Button variant="danger" size="sm">Delete</Button></DialogClose>
                        </template>
                    </DialogContent>
                </Dialog>
            </div>`,
    }),
};
