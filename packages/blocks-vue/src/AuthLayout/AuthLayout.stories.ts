import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AuthForm from '../AuthForm/AuthForm.vue';
import AuthLayout from './AuthLayout.vue';

// A neutral decorative picture (no stock photo in the repo)
const image = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b5bdb"/><stop offset="1" stop-color="#0b7285"/></linearGradient></defs><rect width="400" height="600" fill="url(#g)"/><circle cx="320" cy="120" r="140" fill="#fff" fill-opacity=".08"/><circle cx="60" cy="420" r="200" fill="#fff" fill-opacity=".06"/></svg>'
)}`;

const meta = {
    title: 'Blocks/AuthLayout',
    component: AuthLayout,
    args: { image, side: 'start' },
    argTypes: { side: { control: 'inline-radio', options: ['start', 'end'] } },
    parameters: { layout: 'fullscreen' },
    render: (args) => ({
        components: { AuthForm, AuthLayout },
        setup: () => ({ args }),
        template: `
            <AuthLayout v-bind="args">
                <template #brand>WireLayer</template>
                <template #teaser>
                    <p class="m-0 text-2xl font-semibold tracking-[-0.03em]">All your projects in one place.</p>
                    <p class="m-0 text-sm text-bg/70">Invoices, tickets and documents – secure in the customer portal.</p>
                </template>
                <AuthForm />
                <template #footer>Legal notice · Privacy</template>
            </AuthLayout>`,
    }),
} satisfies Meta<typeof AuthLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Form on one side, image with teaser on the other (from 1024 px; below only the form) */
export const Playground: Story = {};
