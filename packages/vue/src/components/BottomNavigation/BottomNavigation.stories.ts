import { Bell, House, MessageSquare, Search, UserRound } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import BottomNavigation, { type BottomNavigationItem } from './BottomNavigation.vue';

const items: BottomNavigationItem[] = [
    { label: 'Home', href: '#home', icon: House },
    { label: 'Search', href: '#search', icon: Search },
    { label: 'Messages', href: '#messages', icon: MessageSquare, badge: 3 },
    { label: 'Alerts', href: '#alerts', icon: Bell, badge: 120 },
    { label: 'Profile', href: '#profile', icon: UserRound },
];

const setup = (args: object) => () => {
    const current = ref('#home');
    const navigate = (item: BottomNavigationItem, event: MouseEvent) => {
        event.preventDefault();
        current.value = item.href;
    };
    return { args, current, navigate };
};

const meta = {
    title: 'Navigation/BottomNavigation',
    component: BottomNavigation,
    args: { items },
    argTypes: { items: { control: false } },
    parameters: { layout: 'fullscreen' },
    globals: { viewport: { value: 'mobile1' } },
    render: (args) => ({
        components: { BottomNavigation },
        setup: setup(args),
        template: `
            <div class="min-h-dvh p-4 pb-24">
                <p class="text-sm text-muted">Page content. The bar stays at the bottom, above the home indicator.</p>
                <BottomNavigation v-bind="args" :current-href="current" @navigate="navigate" />
            </div>`,
    }),
} satisfies Meta<typeof BottomNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fixed at the bottom; the current destination with aria-current="page", counters as part of the name */
export const Playground: Story = {};

/** Three destinations in the flow of the page (e.g. inside a frame) */
export const Inline: Story = {
    args: { items: items.slice(0, 3), inline: true },
    render: (args) => ({
        components: { BottomNavigation },
        setup: setup(args),
        template: `
            <div class="max-w-sm border border-line">
                <BottomNavigation v-bind="args" :current-href="current" @navigate="navigate" />
            </div>`,
    }),
};
