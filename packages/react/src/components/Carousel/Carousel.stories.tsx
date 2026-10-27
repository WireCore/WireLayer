import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CarouselBreakpoint } from '@wirecore/wirelayer-recipes';
import { useState } from 'react';
import { Carousel } from './Carousel.js';

const references = [
    { title: 'Northside Utilities', text: 'Customer portal and billing' },
    { title: 'Southern Logistics', text: 'Real-time route planning' },
    { title: 'Westside Hospital Group', text: 'Appointment booking for patients' },
    { title: 'Eastside Retail', text: 'Inventory management in the cloud' },
    { title: 'Midtown Learning Center', text: 'Learning platform for 4,000 users' },
];

interface DemoArgs {
    label: string;
    slidesPerPage?: number;
    slidesToScroll?: number | 'auto';
    orientation?: 'horizontal' | 'vertical';
    height?: string;
    breakpoints?: CarouselBreakpoint[];
    allowMouseDrag?: boolean;
    loop?: boolean;
    autoplay?: boolean | { delay: number };
    indicators?: boolean;
    controlsPosition?: 'bottom' | 'sides';
}

function Demo(args: DemoArgs) {
    const [page, setPage] = useState(0);
    return (
        <div className="flex max-w-xl flex-col gap-3">
            <Carousel {...args} items={references} page={page} onPageChange={setPage}>
                {(item) => (
                    <div className="flex h-40 flex-col justify-center gap-1 rounded-xl border border-line bg-card p-6">
                        <span className="text-lg font-semibold">{item.title}</span>
                        <span className="text-sm text-muted">{item.text}</span>
                    </div>
                )}
            </Carousel>
            <span className="text-xs text-muted">Page: {page + 1}</span>
        </div>
    );
}

const meta = {
    title: 'Media/Carousel',
    component: Demo,
    args: { label: 'Case studies', slidesPerPage: 1, loop: false, autoplay: false, indicators: true },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

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

/** `controlsPosition="sides"`: previous and next beside the slides, vertically centred; the dots stay below */
export const ControlsAtTheSides: Story = { name: 'Controls at the sides', args: { controlsPosition: 'sides' } };
