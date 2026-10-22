import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, type ConcreteComponent } from 'vue';
import Carousel from './Carousel.vue';

const references = [
    { title: 'Northside Utilities', text: 'Customer portal and billing' },
    { title: 'Southern Logistics', text: 'Real-time route planning' },
    { title: 'Westside Hospital Group', text: 'Appointment booking for patients' },
    { title: 'Eastside Retail', text: 'Inventory management in the cloud' },
    { title: 'Midtown Learning Center', text: 'Learning platform for 4,000 users' },
];

const meta = {
    title: 'Media/Carousel',
    // Generic component: Storybook's Vue types can't infer args here
    component: Carousel as ConcreteComponent,
    args: { label: 'Case studies', slidesPerPage: 1, loop: false, autoplay: false, indicators: true },
    render: (args) => ({
        components: { Carousel: Carousel as ConcreteComponent },
        setup: () => ({ args, references, page: ref(0) }),
        template: `
            <div class="flex max-w-xl flex-col gap-3">
                <Carousel v-bind="args" v-model:page="page" :items="references">
                    <template #default="{ item }">
                        <div class="flex h-40 flex-col justify-center gap-1 rounded-xl border border-line bg-card p-6">
                            <span class="text-lg font-semibold">{{ item.title }}</span>
                            <span class="text-sm text-muted">{{ item.text }}</span>
                        </div>
                    </template>
                </Carousel>
                <span class="text-xs text-muted">Page: {{ page + 1 }}</span>
            </div>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

export const SeveralPerPage: Story = { args: { slidesPerPage: 2 } };

export const Autoplay: Story = { args: { autoplay: { delay: 5000 } } };

/** 1.5 slides in view (a part of the next one shows), one slide per step */
export const PartSlides: Story = {
    name: 'Partial slides and step size',
    args: { slidesPerPage: 1.5, slidesToScroll: 1 },
};

/** Slides on top of each other; the arrows point up and down */
export const Vertical: Story = { name: 'Vertical', args: { orientation: 'vertical', height: '10rem' } };

/** Slides per page follow the width of the carousel (a container query): 1, from 480 px 2, from 720 px 3 */
export const Breakpoints: Story = {
    name: 'Breakpoints',
    args: {
        breakpoints: [
            { minWidth: 480, slidesPerPage: 2 },
            { minWidth: 720, slidesPerPage: 3, spacing: '12px' },
        ],
        allowMouseDrag: true,
    },
};
