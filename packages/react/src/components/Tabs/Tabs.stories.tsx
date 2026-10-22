import type { Meta, StoryObj } from '@storybook/react-vite';
import { GitCommitHorizontal, Layers, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs.js';

const meta = {
    title: 'Navigation/Tabs',
    component: Tabs,
    args: { defaultValue: 'overview', label: 'About WireLayer' },
    render: (args) => (
        <Tabs {...args} className="w-[380px]">
            <TabsList>
                <TabsTrigger value="overview" icon={LayoutDashboard}>
                    Overview
                </TabsTrigger>
                <TabsTrigger value="services" icon={Layers}>
                    Services
                </TabsTrigger>
                <TabsTrigger value="process" icon={GitCommitHorizontal}>
                    Process
                </TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="text-sm leading-[1.55] text-muted">
                One team for the whole stack – from software to the network cable.
            </TabsContent>
            <TabsContent value="services" className="text-sm leading-[1.55] text-muted">
                Software, AI, hosting, cloud, hardware and network.
            </TabsContent>
            <TabsContent value="process" className="text-sm leading-[1.55] text-muted">
                Understand, build, ship and operate.
            </TabsContent>
        </Tabs>
    ),
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function ClosableDemo() {
    const [files, setFiles] = useState([
        'quote.pdf',
        'contract.docx',
        'notes.txt',
        'invoice-2026-10.pdf',
        'minutes.md',
        'budget.xlsx',
    ]);
    const [current, setCurrent] = useState<string | null>('quote.pdf');
    const close = (file: string) => {
        const index = files.indexOf(file);
        const rest = files.filter((name) => name !== file);
        setFiles(rest);
        if (current === file) setCurrent(rest[Math.min(index, rest.length - 1)] ?? null);
    };
    return (
        <Tabs value={current ?? undefined} onValueChange={setCurrent} label="Open files" className="w-[380px]">
            <TabsList scrollable>
                {files.map((file) => (
                    <TabsTrigger key={file} value={file} closable onClose={close}>
                        {file}
                    </TabsTrigger>
                ))}
            </TabsList>
            {files.map((file) => (
                <TabsContent key={file} value={file} className="text-sm text-muted">
                    Content of {file}
                </TabsContent>
            ))}
            {!files.length && <p className="text-sm text-muted">All files closed.</p>}
        </Tabs>
    );
}

/** Closable tabs (Delete or the x), a scrolling list with arrows on overflow */
export const ClosableAndScrollable: Story = { render: () => <ClosableDemo /> };

/** Tabs beside the panels; manual activation: arrow keys move the focus, Enter/Space select */
export const VerticalManual: Story = {
    args: { orientation: 'vertical', activationMode: 'manual', lazyMount: true },
    render: (args) => (
        <Tabs {...args} className="w-[480px]">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="process">Process</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="text-sm text-muted">
                One team for the whole stack.
            </TabsContent>
            <TabsContent value="services" className="text-sm text-muted">
                Software, AI, hosting, cloud.
            </TabsContent>
            <TabsContent value="process" className="text-sm text-muted">
                Understand, build, operate.
            </TabsContent>
        </Tabs>
    ),
};
