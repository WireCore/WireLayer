import {
    colorTokens,
    colors,
    controlSizes,
    modes,
    radius,
    resolveColors,
    sizes,
    themes,
} from '@wirecore/wirelayer-tokens';

// `sb-unstyled` keeps the Storybook docs typography away from these previews

export function ColorTable() {
    return (
        <div className="sb-unstyled grid gap-4 font-sans sm:grid-cols-2">
            {modes.map((mode) => (
                <div key={mode} data-mode={mode} className="rounded-card border border-line bg-bg p-5 text-fg">
                    <div className="label-mono mb-3">{mode === 'light' ? 'Light' : 'Dark'}</div>
                    {colorTokens.map((token) => (
                        <div key={token} className="flex items-center gap-3 border-t border-line py-2">
                            <span
                                className="size-8 shrink-0 rounded-md border border-line-2"
                                style={{ background: `var(--wc-${token})` }}
                            />
                            <span className="w-24 text-sm font-semibold">{token}</span>
                            <code className="font-mono text-[11px] text-muted">{colors[mode][token]}</code>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

/** Every built-in theme in both modes, previewed with a primary button, a selected chip and a progress bar. */
export function ThemeTable() {
    return (
        <div className="sb-unstyled grid gap-4 font-sans sm:grid-cols-2">
            {themes.map((theme) => (
                <div key={theme.name} className="flex flex-col gap-3 rounded-card border border-line bg-bg p-5 text-fg">
                    <div className="flex items-baseline justify-between">
                        <span className="text-sm font-semibold">{theme.label}</span>
                        <code className="font-mono text-[11px] text-muted">data-theme="{theme.name}"</code>
                    </div>
                    {modes.map((mode) => (
                        <div
                            key={mode}
                            data-theme={theme.name}
                            data-mode={mode}
                            className="flex items-center gap-3 rounded-xl border border-line bg-bg p-3 text-fg"
                        >
                            <span className="inline-flex h-8 items-center rounded-full bg-primary px-3 text-[13px] font-semibold text-on-primary">
                                Primary
                            </span>
                            <span className="inline-flex h-8 items-center rounded-full border border-primary bg-primary px-3 text-[13px] font-medium text-on-primary">
                                Selected
                            </span>
                            <span className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-line-2">
                                <span className="block h-full w-2/3 bg-primary" />
                            </span>
                            <code className="w-40 font-mono text-[11px] text-muted">
                                {resolveColors(theme, mode).primary}
                            </code>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

const typeScale = [
    { name: 'Display', className: 'text-7xl font-semibold tracking-display', sample: 'Systems that run.' },
    { name: 'H2', className: 'text-5xl font-semibold tracking-heading', sample: 'Input without noise.' },
    { name: 'H3', className: 'text-xl font-semibold tracking-tight', sample: 'Software & Web' },
    {
        name: 'Body',
        className: 'text-[15px]/relaxed text-muted',
        sample: 'Web applications, websites, internal tools.',
    },
    { name: 'Label', className: 'label-mono', sample: '01 · Basics' },
    {
        name: 'Gradient',
        className: 'text-5xl font-semibold tracking-heading text-gradient',
        sample: 'Building blocks.',
    },
];

export function TypeScale() {
    return (
        <div className="sb-unstyled flex flex-col rounded-card border border-line bg-bg p-6 font-sans text-fg">
            {typeScale.map((type) => (
                <div key={type.name} className="flex flex-col gap-2 border-b border-line py-5 last:border-0">
                    <div className={type.className}>{type.sample}</div>
                    <code className="font-mono text-[11px] text-muted">
                        {type.name} · {type.className}
                    </code>
                </div>
            ))}
        </div>
    );
}

const radii = [
    { name: 'md', value: '6px', className: 'rounded-md' },
    { name: 'lg', value: '8px', className: 'rounded-lg' },
    { name: 'xl', value: '12px', className: 'rounded-xl' },
    { name: 'card', value: radius.card, className: 'rounded-card' },
    { name: 'panel', value: radius.panel, className: 'rounded-panel' },
    { name: 'full', value: '999px', className: 'rounded-full' },
];

export function Radii() {
    return (
        <div className="sb-unstyled flex flex-wrap gap-4 rounded-card border border-line bg-bg p-6 font-sans text-fg">
            {radii.map((r) => (
                <div key={r.name} className="flex flex-col items-center gap-2">
                    <div className={`size-16 border border-line-2 bg-bg-2 ${r.className}`} />
                    <code className="font-mono text-[11px] text-muted">
                        {r.className} · {r.value}
                    </code>
                </div>
            ))}
        </div>
    );
}

export function SizeGrid() {
    return (
        <div className="sb-unstyled overflow-hidden rounded-card border border-line bg-bg font-sans text-sm text-fg">
            <div className="grid grid-cols-4 gap-4 border-b border-line bg-bg-2 px-5 py-3 font-mono text-[11px] text-muted uppercase">
                <span>Size</span>
                <span>Height</span>
                <span>Font</span>
                <span>Icon</span>
            </div>
            {sizes.map((size) => (
                <div key={size} className="grid grid-cols-4 gap-4 border-b border-line px-5 py-3 last:border-0">
                    <span className="font-semibold">{size}</span>
                    <span>{controlSizes[size].height} px</span>
                    <span>{controlSizes[size].fontSize} px</span>
                    <span>{controlSizes[size].iconSize} px</span>
                </div>
            ))}
        </div>
    );
}
