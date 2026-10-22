import { FloatingPanel as ArkFloatingPanel, useFloatingPanel } from '@ark-ui/react/floating-panel';
import { Portal } from '@ark-ui/react/portal';
import {
    floatingPanel as floatingPanelRecipe,
    panelRectForKey,
    writeStorage,
    type PanelRect,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { Maximize2, Minimize2, Minus, X } from 'lucide-react';
import { useId, useState, type ComponentProps, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';
import { parseStored, useStoredText } from '../../storage.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

type Size = { width: number; height: number };
type Point = { x: number; y: number };

export interface FloatingPanelProps extends Omit<ComponentProps<'div'>, 'title'> {
    /** Title in the header – also the name of the window */
    title: string;
    /** Open (controlled) */
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Size when it opens (default 360 × 280) */
    defaultSize?: Size;
    /** Position when it opens (default: next to the trigger, else centred) */
    defaultPosition?: Point;
    /** Smallest and largest size (default min 240 × 120) */
    minSize?: Size;
    maxSize?: Size;
    /** Edges and corners change the size (default true) */
    resizable?: boolean;
    /** The header moves the window (default true) */
    draggable?: boolean;
    /** Keeps position and size in localStorage under this key */
    storageKey?: string;
    /** Escape closes the window (default true) */
    closeOnEscape?: boolean;
    /** Pixels per Alt+arrow (default 10) */
    keyboardStep?: number;
    /** Button that opens the window (its position is the anchor) – one element */
    trigger?: ReactElement;
    children?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof floatingPanelRecipe>;
}

const axes = ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'] as const;

/**
 * Non-modal window (role="dialog", named by its title): drag the header, resize at the edges, minimise, maximise,
 * close; Alt+arrows move it, Alt+Shift+arrows resize it, Escape closes it.
 */
export function FloatingPanel({
    classes,
    title,
    open,
    defaultOpen = false,
    onOpenChange,
    defaultSize = { width: 360, height: 280 },
    defaultPosition,
    minSize = { width: 240, height: 120 },
    maxSize,
    resizable = true,
    draggable = true,
    storageKey,
    closeOnEscape = true,
    keyboardStep = 10,
    trigger,
    className,
    children,
    ...props
}: FloatingPanelProps) {
    const floatingPanel = useRecipe('floatingPanel', floatingPanelRecipe, classes);
    const styles = floatingPanel();
    const t = useTranslations().floatingPanel;
    const id = useId();
    const hintId = `${id}hint`;
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    // Stored rect (after hydration), own changes on top
    const stored = parseStored<Partial<PanelRect>>(useStoredText(storageKey));
    const [moved, setMoved] = useState<Point | undefined>(undefined);
    const [resized, setResized] = useState<Size | undefined>(undefined);
    const position = moved ?? stored?.position ?? defaultPosition;
    const size = resized ?? stored?.size ?? defaultSize;
    const store = (rect: { position?: Point; size?: Size }) => {
        const nextPosition = rect.position ?? position;
        if (storageKey && nextPosition)
            writeStorage('local', storageKey, { position: nextPosition, size: rect.size ?? size });
    };

    const api = useFloatingPanel({
        id,
        open: open ?? internalOpen,
        position,
        size,
        minSize,
        maxSize,
        resizable,
        draggable,
        closeOnEscape,
        persistRect: true,
        translations: { minimize: t.minimize, maximize: t.maximize, restore: t.restore },
        onOpenChange: (details) => {
            setInternalOpen(details.open);
            onOpenChange?.(details.open);
        },
        onPositionChange: (details) => setMoved(details.position),
        onPositionChangeEnd: (details) => store({ position: details.position }),
        onSizeChange: (details) => setResized(details.size),
        onSizeChangeEnd: (details) => store({ size: details.size }),
    });

    // Alt+arrows move, Alt+Shift+arrows resize – from anywhere in the window (before Ark's own arrow handling)
    const onKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
        const next = panelRectForKey(
            event,
            { position: api.position, size: api.size },
            { step: keyboardStep, minSize, maxSize }
        );
        if (!next) return;
        event.preventDefault();
        if (next.position && draggable) api.setPosition(next.position);
        if (next.size && resizable) api.setSize(next.size);
        store(next);
    };

    return (
        <ArkFloatingPanel.RootProvider value={api} lazyMount unmountOnExit>
            {trigger && <ArkFloatingPanel.Trigger asChild>{trigger}</ArkFloatingPanel.Trigger>}
            <Portal>
                <ArkFloatingPanel.Positioner className={styles.positioner()}>
                    <ArkFloatingPanel.Content
                        {...props}
                        className={styles.content({ class: className })}
                        aria-describedby={hintId}
                        onKeyDownCapture={onKeyDownCapture}
                    >
                        <ArkFloatingPanel.DragTrigger>
                            <ArkFloatingPanel.Header className={styles.header()}>
                                <ArkFloatingPanel.Title className={styles.title()}>{title}</ArkFloatingPanel.Title>
                                <ArkFloatingPanel.Control className={styles.control()}>
                                    {resizable && (
                                        <>
                                            <ArkFloatingPanel.StageTrigger
                                                stage="minimized"
                                                className={styles.button()}
                                            >
                                                <Minus className={styles.buttonIcon()} aria-hidden="true" />
                                            </ArkFloatingPanel.StageTrigger>
                                            <ArkFloatingPanel.StageTrigger
                                                stage="maximized"
                                                className={styles.button()}
                                            >
                                                <Maximize2 className={styles.buttonIcon()} aria-hidden="true" />
                                            </ArkFloatingPanel.StageTrigger>
                                            <ArkFloatingPanel.StageTrigger stage="default" className={styles.button()}>
                                                <Minimize2 className={styles.buttonIcon()} aria-hidden="true" />
                                            </ArkFloatingPanel.StageTrigger>
                                        </>
                                    )}
                                    <ArkFloatingPanel.CloseTrigger className={styles.button()} aria-label={t.close}>
                                        <X className={styles.buttonIcon()} aria-hidden="true" />
                                    </ArkFloatingPanel.CloseTrigger>
                                </ArkFloatingPanel.Control>
                            </ArkFloatingPanel.Header>
                        </ArkFloatingPanel.DragTrigger>
                        <ArkFloatingPanel.Body className={styles.body()}>{children}</ArkFloatingPanel.Body>
                        <span id={hintId} className={styles.hint()}>
                            {t.hint}
                        </span>
                        {resizable &&
                            axes.map((axis) => (
                                <ArkFloatingPanel.ResizeTrigger key={axis} axis={axis} className={styles.resize()} />
                            ))}
                    </ArkFloatingPanel.Content>
                </ArkFloatingPanel.Positioner>
            </Portal>
        </ArkFloatingPanel.RootProvider>
    );
}
