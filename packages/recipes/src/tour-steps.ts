// Steps of a tour (Tour) that need the app first: `before` runs (e.g. switches a tab), then the target is awaited
// for up to `waitFor` ms. Framework-neutral – Vue, React and React Native show the step once it is ready.

/** What a step needs before it is shown */
export interface TourStepPreparation<E> {
    /** Runs first, may be async */
    before?: () => void | Promise<void>;
    /** Finds the target; without it the step has none */
    find?: () => E | null | undefined;
    /** How long (ms) to wait for the target after `before` (default 0: look once) */
    waitFor?: number;
}

const POLL = 50;

/**
 * Prepares a step: runs `before`, then looks for the target until it is there or `waitFor` has passed. `ready` gets
 * the target – null without one or when it did not appear (`missing`). Returns the cancel function (the tour moved
 * on or ended): `ready` is not called after it.
 */
export function prepareTourStep<E>(
    step: TourStepPreparation<E>,
    ready: (target: E | null, missing: boolean) => void
): () => void {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const look = (until: number) => {
        if (cancelled) return;
        const target = step.find?.() ?? null;
        if (target || !step.find) return ready(target, false);
        if (Date.now() >= until) return ready(null, true);
        timer = setTimeout(() => look(until), Math.min(POLL, until - Date.now()));
    };
    Promise.resolve()
        .then(step.before)
        // A failing `before` does not stop the tour – the target decides
        .catch((error: unknown) => console.error(error))
        .then(() => look(Date.now() + (step.waitFor ?? 0)));
    return () => {
        cancelled = true;
        clearTimeout(timer);
    };
}

/**
 * The step to go to instead of a skipped one at `index`, in the direction the tour was moving (from `current`):
 * the next or previous index, `'end'` past the last step, undefined before the first (stay)
 */
export function tourSkipTarget(index: number, current: number, count: number): number | 'end' | undefined {
    if (index > current) return index + 1 < count ? index + 1 : 'end';
    return index > 0 ? index - 1 : undefined;
}
