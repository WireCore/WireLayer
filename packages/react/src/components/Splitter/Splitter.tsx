import { Splitter as ArkSplitter, useSplitter } from '@ark-ui/react/splitter';
import { readStored, splitter as splitterRecipe, writeStored, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { GripHorizontal, GripVertical } from 'lucide-react';
import { Fragment, useEffect, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface SplitterPanel {
    id: string;
    /** Names the panel for the resize handle ("Resize “…”") */
    label: string;
    /** Initial size: a number in percent, or a string with unit, e.g. "240px" or "30%" */
    defaultSize?: number | string;
    /** Limits: percent, or a string with unit ("200px") */
    minSize?: number | string;
    maxSize?: number | string;
    /** Dragging (or keys) below the minimum snaps the panel shut; Enter on the handle opens and closes it */
    collapsible?: boolean;
    /** Size when collapsed (default 0) */
    collapsedSize?: number | string;
}

export interface SplitterProps {
    panels: readonly SplitterPanel[];
    orientation?: 'horizontal' | 'vertical';
    /** Arrow keys on a handle change the size by this many percent (default 1) */
    step?: number;
    /** Shift + arrow keys (percent, default 10) */
    shiftStep?: number;
    /** Remembers the sizes in localStorage under this key */
    storageKey?: string;
    /** Sizes in percent while resizing */
    onResize?: (sizes: number[]) => void;
    /** Sizes in percent after a drag or key press */
    onResizeEnd?: (sizes: number[]) => void;
    onCollapse?: (panelId: string) => void;
    onExpand?: (panelId: string) => void;
    /** Content of a panel */
    children: (id: string) => ReactNode;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof splitterRecipe>;
}

/**
 * Panels with handles between them (role="separator"): drag, or arrow keys (Shift for bigger steps) and Home/End on
 * the handle; Enter folds a collapsible panel; double click resets. Splitters can be nested in a panel.
 */
export function Splitter({
    classes,
    panels,
    orientation = 'horizontal',
    step,
    shiftStep,
    storageKey,
    onResize,
    onResizeEnd,
    onCollapse,
    onExpand,
    children,
    className,
    style,
}: SplitterProps) {
    const splitter = useRecipe('splitter', splitterRecipe, classes);
    const styles = splitter();
    const translations = useTranslations();
    // Panels without a size share what the others leave; sizes with a unit are resolved by Ark
    const withUnit = panels.some((panel) => typeof panel.defaultSize === 'string');
    const given = panels.reduce((sum, panel) => sum + ((panel.defaultSize as number | undefined) ?? 0), 0);
    const open = panels.filter((panel) => panel.defaultSize === undefined).length;
    const api = useSplitter({
        orientation,
        panels: panels.map((panel) => ({
            id: panel.id,
            minSize: panel.minSize,
            maxSize: panel.maxSize,
            ...(panel.collapsible ? { collapsible: true, collapsedSize: panel.collapsedSize ?? 0 } : {}),
        })),
        defaultSize: withUnit
            ? (panels.map((panel) => panel.defaultSize) as (number | string)[])
            : panels.map((panel) => panel.defaultSize ?? (100 - given) / open),
        ...(step === undefined ? {} : { keyboardResizeBy: step }),
        onResize: (details) => onResize?.(details.size),
        onResizeEnd: (details) => {
            writeStored(storageKey, details.size);
            onResizeEnd?.(details.size);
        },
        onCollapse: (details) => {
            writeStored(storageKey, api.getSizes());
            onCollapse?.(details.panelId);
        },
        onExpand: (details) => {
            writeStored(storageKey, api.getSizes());
            onExpand?.(details.panelId);
        },
    });
    const { setSizes } = api;
    useEffect(() => {
        const stored = readStored<number[]>(storageKey);
        if (Array.isArray(stored) && stored.length === panels.length) setSizes(stored);
        // Only once, after mounting
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Shift + arrow keys: our own step (Ark's is fixed at 10 %); runs before Ark's handler, which then skips the key
    const onKeyDownCapture = (before: string) => (event: KeyboardEvent<HTMLElement>) => {
        if (!event.shiftKey || shiftStep === undefined) return;
        const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
        const grows = orientation === 'vertical' ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
        const shrinks = orientation === 'vertical' ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
        const sign = event.key === grows ? 1 : event.key === shrinks ? -1 : 0;
        if (!sign) return;
        event.preventDefault();
        api.resizePanel(before, api.getPanelSize(before) + sign * shiftStep);
        writeStored(storageKey, api.getSizes());
        onResizeEnd?.(api.getSizes());
    };
    // Double click on a handle: back to the initial sizes
    const reset = () => {
        api.resetSizes();
        writeStored(storageKey, api.getSizes());
        onResizeEnd?.(api.getSizes());
    };

    return (
        <div className={styles.base({ class: className })} style={style}>
            <ArkSplitter.RootProvider value={api} className={styles.root()}>
                {panels.map((panel, index) => (
                    <Fragment key={panel.id}>
                        {index > 0 && (
                            <ArkSplitter.ResizeTrigger
                                id={`${panels[index - 1]!.id}:${panel.id}`}
                                className={styles.handle()}
                                aria-label={translations.splitter.resize(panels[index - 1]!.label)}
                                onKeyDownCapture={onKeyDownCapture(panels[index - 1]!.id)}
                                onDoubleClick={reset}
                            >
                                <span className={styles.grip()} data-orientation={orientation} aria-hidden="true">
                                    {orientation === 'horizontal' ? (
                                        <GripVertical className={styles.gripIcon()} />
                                    ) : (
                                        <GripHorizontal className={styles.gripIcon()} />
                                    )}
                                </span>
                            </ArkSplitter.ResizeTrigger>
                        )}
                        <ArkSplitter.Panel id={panel.id} className={styles.panel()}>
                            {children(panel.id)}
                        </ArkSplitter.Panel>
                    </Fragment>
                ))}
            </ArkSplitter.RootProvider>
        </div>
    );
}
