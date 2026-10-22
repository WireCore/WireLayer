import type { Meta, StoryObj } from '@storybook/react-vite';
import { TableOfContents } from './TableOfContents.js';

const items = [
    { id: 'toc-services', label: 'Services' },
    { id: 'toc-term', label: 'Term', depth: 2 },
    { id: 'toc-termination', label: 'Termination', depth: 2 },
    { id: 'toc-data-protection', label: 'Data protection' },
    { id: 'toc-liability', label: 'Liability' },
];

const meta = {
    title: 'Navigation/TableOfContents',
    component: TableOfContents,
    args: { items },
    argTypes: { items: { control: false } },
    parameters: { layout: 'fullscreen' },
    render: (args) => (
        <div className="mx-auto flex max-w-3xl gap-10 p-8">
            <article className="flex-1 text-sm leading-relaxed">
                {items.map((item) => {
                    const Heading = item.depth === 2 ? 'h3' : 'h2';
                    return (
                        <section key={item.id} className="mb-10">
                            <Heading
                                id={item.id}
                                className={`mb-2 font-semibold ${item.depth === 2 ? 'text-base' : 'text-xl'}`}
                            >
                                {item.label}
                            </Heading>
                            {[1, 2, 3, 4].map((n) => (
                                <p key={n} className="mb-3">
                                    This section covers {item.label} under the agreement.
                                </p>
                            ))}
                        </section>
                    );
                })}
            </article>
            <aside className="sticky top-8 h-fit w-48">
                <TableOfContents {...args} />
            </aside>
        </div>
    ),
} satisfies Meta<typeof TableOfContents>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
