import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from '../Button/Button.vue';
import { createToaster, toast } from './toaster.js';
import Toaster from './Toaster.vue';

const meta = {
    title: 'Overlays/Toast',
    component: Toaster,
    render: () => ({
        components: { Button, Toaster },
        setup: () => ({
            success: () =>
                toast({
                    title: 'Deployment complete',
                    description: 'customer-portal · v2.4.1 · 2 s ago',
                    type: 'success',
                    action: { label: 'Open', onClick: () => {} },
                }),
            info: () =>
                toast({ title: 'Maintenance window planned', description: 'Saturday, 2:00–4:00 AM', type: 'info' }),
            error: () => toast({ title: 'Connection lost', description: 'North site', type: 'error' }),
            loading: () => toast({ title: 'Backup running …', type: 'loading' }),
        }),
        template: `
            <div class="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" @click="success">Success with action</Button>
                <Button variant="secondary" size="sm" @click="info">Info</Button>
                <Button variant="secondary" size="sm" @click="error">Error</Button>
                <Button variant="secondary" size="sm" @click="loading">Loading</Button>
                <Toaster />
            </div>`,
    }),
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const wait = (ms: number, fail = false) =>
    new Promise<string>((resolve, reject) =>
        setTimeout(() => (fail ? reject(new Error('Timeout')) : resolve('web-01')), ms)
    );

/**
 * One toast that follows a promise (loading → success or error) and a toast changed later with `toast.update(id)`;
 * `toast.dismiss(id)` closes it.
 */
export const PromiseAndUpdate: Story = {
    render: () => ({
        components: { Button, Toaster },
        setup: () => ({
            save: (fail: boolean) =>
                toast.promise(wait(1500, fail), {
                    loading: 'Saving …',
                    success: (name) => ({
                        title: `${name} saved`,
                        description: 'All changes have been applied.',
                    }),
                    error: (reason) => ({ title: 'Saving failed', description: (reason as Error).message }),
                }),
            upload: () => {
                const id = toast({ title: 'Upload running …', type: 'loading' });
                setTimeout(
                    () => toast.update(id, { title: 'Upload finished', description: 'report.pdf', type: 'success' }),
                    1500
                );
            },
        }),
        template: `
            <div class="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" @click="save(false)">Save (success)</Button>
                <Button variant="secondary" size="sm" @click="save(true)">Save (error)</Button>
                <Button variant="secondary" size="sm" @click="upload">Upload</Button>
                <Toaster />
            </div>`,
    }),
};

const top = createToaster({ placement: 'top-end', overlap: true, max: 3 });
let counter = 0;

/**
 * A toaster of its own (`createToaster`): top right, stacked (fans out on hover), at most 3 at a time – more wait
 * in a queue, important ones (priority 1) first. With a progress bar of the remaining time (stops while hovered
 * or focused) and swiping to close.
 */
export const OwnToaster: Story = {
    render: () => ({
        components: { Button, Toaster },
        setup: () => ({
            top,
            add: () =>
                top.toast({
                    title: `Notice ${++counter}`,
                    description: 'Sync complete',
                    type: 'info',
                }),
            urgent: () => top.toast({ title: 'Storage almost full', type: 'warning', priority: 1 }),
        }),
        template: `
            <div class="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" @click="add">Notice</Button>
                <Button variant="secondary" size="sm" @click="urgent">Important</Button>
                <Toaster :toaster="top.toaster" label="Notices at the top" show-progress swipe-to-dismiss />
            </div>`,
    }),
};
