import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useRef, useState } from 'react';
import { Button } from '../Button/Button.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Tabs/Tabs.js';
import { Tour, type TourStep } from './Tour.js';

const steps: TourStep[] = [
    { id: 'welcome', title: 'Welcome', description: 'Your first server in three steps.' },
    {
        id: 'create',
        title: 'Create server',
        description: 'Create new servers here.',
        target: '#tour-create',
        placement: 'bottom',
    },
    {
        id: 'reports',
        title: 'Reports',
        description: 'Load and costs at a glance.',
        target: '#tour-reports',
        placement: 'bottom',
    },
];

function Demo({ steps }: { steps: readonly TourStep[] }) {
    const [open, setOpen] = useState(false);
    const [done, setDone] = useState(false);
    return (
        <div className="flex flex-col items-center gap-6">
            <div className="flex gap-3">
                <Button id="tour-create" variant="outline">
                    Create server
                </Button>
                <Button id="tour-reports" variant="outline">
                    Reports
                </Button>
            </div>
            <Button onClick={() => setOpen(true)}>Start tour</Button>
            <p className="h-4 text-xs text-muted" aria-live="polite">
                {done ? 'Tour completed' : ''}
            </p>
            <Tour steps={steps} open={open} onOpenChange={setOpen} onComplete={() => setDone(true)} />
        </div>
    );
}

const meta = {
    title: 'Overlays/Tour',
    component: Tour,
    args: { steps },
    argTypes: { steps: { control: false } },
    render: (args) => <Demo steps={args.steps} />,
} satisfies Meta<typeof Tour>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function Waiting() {
    const [tab, setTab] = useState<string | null>('servers');
    const [loaded, setLoaded] = useState(false);
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<string | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const steps = useMemo<TourStep[]>(
        () => [
            {
                id: 'servers',
                title: 'Servers',
                description: 'Add servers here.',
                target: '#tour-add-server',
                placement: 'bottom',
                before: () => setTab('servers'),
            },
            {
                id: 'load',
                title: 'Load',
                description: 'The chart of the reports – the tour waits until it has loaded.',
                target: '#tour-load-chart',
                placement: 'bottom',
                before: () => {
                    setTab('reports');
                    clearTimeout(timer.current);
                    timer.current = setTimeout(() => setLoaded(true), 1500);
                },
                waitFor: 5000,
            },
            { id: 'beta', title: 'Beta', description: 'Not there – skipped.', target: '#tour-beta' },
            { id: 'end', title: 'That is it', description: 'Start the tour again at any time.' },
        ],
        []
    );
    return (
        <div className="flex flex-col items-center gap-6">
            <Tabs value={tab} onValueChange={setTab} className="w-[380px]">
                <TabsList>
                    <TabsTrigger value="servers">Servers</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>
                <TabsContent value="servers">
                    <Button id="tour-add-server" variant="outline">
                        Add server
                    </Button>
                </TabsContent>
                <TabsContent value="reports">
                    {loaded ? (
                        <div
                            id="tour-load-chart"
                            className="h-20 rounded-md bg-line"
                            aria-label="Load chart"
                            role="img"
                        />
                    ) : (
                        <p className="text-sm text-muted">Loading …</p>
                    )}
                </TabsContent>
            </Tabs>
            <Button onClick={() => setOpen(true)}>Start tour</Button>
            <p className="h-4 text-xs text-muted">Step: {step ?? '–'}</p>
            <Tour steps={steps} open={open} onOpenChange={setOpen} step={step} onStepChange={setStep} />
        </div>
    );
}

/**
 * Steps that need the app first: `before` switches the tab, `waitFor` waits for the chart while it loads (1.5 s).
 * A step whose target is not there ("Beta") is skipped. `step`/`onStepChange` show the current step.
 */
export const WaitingForTargets: Story = { render: () => <Waiting /> };
