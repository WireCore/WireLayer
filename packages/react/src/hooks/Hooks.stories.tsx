import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../components/Badge/Badge.js';
import { Button } from '../components/Button/Button.js';
import { Input } from '../components/Input/Input.js';
import { useClipboard, useNetwork } from './browser.js';
import { useColorScheme, useMediaQuery, useReducedMotion, useResolvedTokens } from './media.js';
import { useDisclosure, useStateHistory } from './state.js';
import { useLocalStorage } from './storage.js';
import { useDebouncedValue, useIdle } from './timing.js';

// A few hooks at work – all of them are exported from @wirecore/wirelayer-react (same names as the Vue composables)
function Demo() {
    const wide = useMediaQuery('(min-width: 768px)');
    const reducedMotion = useReducedMotion();
    const scheme = useColorScheme();
    const network = useNetwork();
    const idle = useIdle(5000);
    const panel = useDisclosure();
    const clipboard = useClipboard();
    const [note, setNote] = useLocalStorage('wirecore-story-note', '');
    const searched = useDebouncedValue(note, 400);
    const history = useStateHistory(0);
    return (
        <div className="grid w-[min(640px,92vw)] gap-4 text-sm sm:grid-cols-2">
            <section className="flex flex-col gap-2 rounded-xl border border-line p-4">
                <h3 className="m-0 font-semibold">Environment</h3>
                <p className="m-0">
                    Wider than 768 px: <Badge>{wide ? 'yes' : 'no'}</Badge>
                </p>
                <p className="m-0">
                    Reduced motion: <Badge>{reducedMotion ? 'yes' : 'no'}</Badge>
                </p>
                <p className="m-0">
                    System color scheme: <Badge>{scheme}</Badge>
                </p>
                <p className="m-0">
                    Online: <Badge>{network.online ? 'yes' : 'no'}</Badge> · Idle (5 s):{' '}
                    <Badge>{idle ? 'yes' : 'no'}</Badge>
                </p>
            </section>
            <section className="flex flex-col items-start gap-2 rounded-xl border border-line p-4">
                <h3 className="m-0 font-semibold">State</h3>
                <Button size="sm" variant="outline" aria-expanded={panel.opened} onClick={panel.toggle}>
                    {panel.opened ? 'Hide' : 'Show'} details
                </Button>
                {panel.opened && <p className="m-0 text-muted">useDisclosure: open</p>}
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => history.set(history.value + 1)}>
                        +1
                    </Button>
                    <Button size="sm" variant="text" disabled={!history.canUndo} onClick={() => history.undo()}>
                        Undo
                    </Button>
                    <Button size="sm" variant="text" disabled={!history.canRedo} onClick={() => history.redo()}>
                        Redo
                    </Button>
                    <span className="tabular-nums">{history.value}</span>
                </div>
            </section>
            <section className="flex flex-col gap-2 rounded-xl border border-line p-4 sm:col-span-2">
                <h3 className="m-0 font-semibold">Storage, debounce, clipboard</h3>
                <Input
                    value={note}
                    onChange={(event) => setNote(event.currentTarget.value)}
                    aria-label="Note (kept after reload)"
                    placeholder="Note – kept after reload"
                />
                <p className="m-0 text-muted">Debounced (400 ms): {searched}</p>
                <Button size="sm" variant="outline" className="self-start" onClick={() => clipboard.copy(note)}>
                    {clipboard.copied ? 'Copied' : 'Copy note'}
                </Button>
            </section>
        </div>
    );
}

const meta = {
    title: 'Utilities/Hooks',
    render: () => <Demo />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Hooks of @wirecore/wirelayer-react: media queries, network, idle, disclosure, undo/redo, localStorage, debounce, clipboard –
 * and more (useHotkeys, useFocusTrap, useIntersection, useScrollSpy …)
 */
export const Playground: Story = {};

function ResolvedTokensDemo() {
    const tokens = useResolvedTokens();
    return (
        <dl className="m-0 grid w-[min(560px,92vw)] gap-x-6 gap-y-1.5 font-mono text-xs sm:grid-cols-2">
            {Object.entries(tokens).map(([name, value]) => (
                <div key={name} className="flex items-center gap-2">
                    <dt className="flex items-center gap-2 text-muted">
                        <span className="size-4 shrink-0 rounded border border-line" style={{ background: value }} />
                        {name}
                    </dt>
                    <dd className="m-0 ms-auto text-fg">{value}</dd>
                </div>
            ))}
        </dl>
    );
}

/**
 * `useResolvedTokens()`: the token colours as hex, for canvas libraries like xterm.js that cannot read CSS variables –
 * they change with the mode and the theme (`resolveTokens()` reads them once)
 */
export const ResolvedTokens: Story = { name: 'Resolved tokens', render: () => <ResolvedTokensDemo /> };
