import { readChartTheme, type ChartTheme } from '@wirecore/wirelayer-recipes';
import { Chart as ChartJs, type ChartConfiguration } from 'chart.js/auto';
import { useEffect, useRef } from 'react';

// Internal: the canvas of the ready-made charts – creates the Chart.js instance from `build` and recolours it when
// theme, mode or the motion preference change

export interface ChartBuild {
    type: string;
    data: unknown;
    options: Record<string, unknown>;
    plugins?: unknown[];
}

export function ChartCanvas({
    build,
    labelledby,
}: {
    /** Chart.js configuration from the token colours */
    build: (theme: ChartTheme, reducedMotion: boolean) => ChartBuild;
    /** Id of the title that names the canvas; without it the canvas is decorative */
    labelledby?: string;
}) {
    const canvas = useRef<HTMLCanvasElement>(null);
    const latest = useRef(build);
    const refresh = useRef<(() => void) | undefined>(undefined);

    useEffect(() => {
        const motion = matchMedia('(prefers-reduced-motion: reduce)');
        const config = () =>
            latest.current(readChartTheme(canvas.current!), motion.matches) as unknown as ChartConfiguration;
        let instance: ChartJs | undefined;
        const create = () => {
            instance?.destroy();
            // No 2D context outside a real browser (e.g. jsdom) – the table still renders
            const context = canvas.current?.getContext('2d');
            instance = context ? new ChartJs(context, config()) : undefined;
        };
        const update = () => {
            if (!instance) return;
            const next = config();
            if (next.type !== (instance.config as { type?: string }).type) return create();
            instance.data = next.data;
            instance.options = next.options ?? {};
            instance.update();
        };
        create();
        refresh.current = update;
        // Theme and mode live on <html> (data-theme, data-mode)
        const observer = new MutationObserver(update);
        observer.observe(document.documentElement, { attributes: true });
        motion.addEventListener('change', update);
        return () => {
            observer.disconnect();
            motion.removeEventListener('change', update);
            instance?.destroy();
        };
    }, []);

    useEffect(() => {
        latest.current = build;
        refresh.current?.();
    }, [build]);

    return labelledby ? (
        <canvas ref={canvas} role="img" aria-labelledby={labelledby} />
    ) : (
        <canvas ref={canvas} aria-hidden="true" />
    );
}
