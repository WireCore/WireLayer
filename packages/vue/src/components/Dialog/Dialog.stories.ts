import { Trash2 } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Button from '../Button/Button.vue';
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

/** Widths sm (320px), md (400px, default), lg, xl and full; on small screens every dialog takes the full width */
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
